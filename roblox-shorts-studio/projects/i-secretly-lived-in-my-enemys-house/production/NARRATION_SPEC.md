# Narration contract (multi-voice)

`script.txt` format (see `../source/story.md`, "Script format"): `# CHnn | DAY | TIME | Title` headers; `SPEAKER: text`
or `SPEAKER (note): text` spoken lines; `[ ... ]` action lines (never spoken); `[+N ...]` adds N seconds of silence
before the next spoken line. Notes: `whisper`, `ghost`, `shriek`, `offscreen`, `offscreen, below`, `behind door`, `phone`.

Voices (four): `VO` and `SKYE` = `brittney` clone; `DAD` = George voice C (`george_c`, as `scripts/qwen_cloud_george_c.py`);
`MAX` = a designed 12-13-year-old boy saved as a clone sample `assets/audio/voices/max_kid.wav|.txt|.json`; `LILY` = a
designed 7-year-old girl saved as `lily_kid.wav|.txt|.json`. Designed voices are chosen once (VoiceDesign auditions) and
then every line is cloned from the saved sample, so they stay consistent across chapters and machines.

`python3 scripts/narrate_multi.py <project> --chapters 3[,4...] [--redo 3:5,3:9]`:
1. generates any missing line clips (clip cache `audio/qwen/<take>/clips/<sha1(voice|text)[:12]>.wav`, so any machine can
   generate any chapter and the clips can be committed and shared), tightened like `tighten_clips.py`;
2. applies the note effects deterministically (whisper: quieter, softer; ghost: echo/reverb; shriek: normal take, a little
   louder; offscreen/behind door: muffled low-pass and quieter; phone: band-pass 300-3400 Hz);
3. joins each chapter: 0.25 s between lines (0.35 s on a change of scene), plus every `[+N]` pause, 0.6 s of room tone
   at the end;
4. transcribes (faster-whisper) and checks words against the script, then writes per chapter
   `audio/chapters/chNN/narration.wav`, `captions.json` (every word with start, end and speaker), and `lines.json`
   (every spoken line: index, speaker, note, text, start, end, and every action line with the time it falls at), plus
   the chapter's measured length.
Chapter clips drive the picture: cut to and frame whoever speaks, `talking` faces on their words, actions in the gaps.

## How to run (`scripts/narrate_multi.py`, narration-tool)

Setup on a fresh cloud machine (~3 min; torch and torchaudio must be the same version or qwen-tts fails to import):
```
pip install "torch==2.11.0+cpu" "torchaudio==2.11.0+cpu" --index-url https://download.pytorch.org/whl/cpu
pip install qwen-tts faster-whisper librosa soundfile
```
Narrate a chapter (from `roblox-shorts-studio/`; run in the background with a 7200000 ms timeout, ~30 s of CPU per new line,
plus ~2 min to download/load the 1.7B model the first time):
```
python3 scripts/narrate_multi.py projects/i-secretly-lived-in-my-enemys-house --chapters 3 > /tmp/ch03_narr.log 2>&1
python3 scripts/narrate_multi.py projects/i-secretly-lived-in-my-enemys-house --chapters 3 --redo 3:5,3:9   # new seed for lines 5 and 9
python3 scripts/narrate_multi.py projects/i-secretly-lived-in-my-enemys-house --chapters 3 --no-gen         # re-join/re-time only
```
- `git fetch origin main && git merge origin/main` first: clips other sessions committed are reused, never regenerated.
- Line numbers (`--redo ch:line`, `lines.json` `index`, `captions.json` `line`) count **spoken lines in the chapter, from 1**.
  A redo bumps the clip's `attempt` in its sidecar (`seed = 77 + int(name[:6],16) % 100000 + 1000*attempt`) and overwrites
  the clip under the same name. After a redo, listen; the report's mismatches are whisper's hearing, so redo only lines that
  sound wrong (names, "Maaax", shouts and whispers are often misheard).
- Outputs, per chapter `audio/chapters/chNN/`: `narration.wav` (24 kHz mono, PCM16; first word at 0.0 s; ends with 0.6 s
  room tone), `captions.json` (`{chapter, duration, words:[{word, start, end, speaker, line}]}`, words spelled exactly as in
  the script, punctuation attached), `lines.json` (`{chapter, header, duration, lines:[{index, speaker, voice, note, text,
  start, end, clip, seed}], actions:[{after_line, at, until, pause, scene_change, text}]}`; an action's `at` is where the
  previous line ends, `until` where the next one starts; `[+N]` pauses sit inside that window).
- Timeline rule: 0.25 s between lines, 0.35 s when an action line between them is a scene change (starts with "Hard cut",
  "Back to", "Inside", "Dusk", or names a set: "The kitchen.", ...), plus every `[+N]`; a ghost line's echo tail runs past
  its `end` into the gap.
- Levels: every clip is levelled to the same speech RMS (-20 dBFS) before its note effect, so the four voices match; the
  effects (`FX` in the script) then set the level: measured speech RMS normal -22.5 dB, phone -25.4, behind door -28.4,
  offscreen, below -29.2 (whisper about -26, shriek about -20).
- Commit after a run: `audio/qwen/take-01/clips/` (`*.wav` + `*.json` sidecars), `audio/qwen/take-01/clips_raw/`, and
  `audio/chapters/chNN/`. Never commit stand-in output: `--standin MAX=brittney` (testing before a voice exists) writes to
  `audio/chapters-standin/` and its clips are hashed under the stand-in's voice name, so they never pass for real ones —
  but don't `git add` them either.
- `--gen-only` generates clips without joining (e.g. to pre-generate several chapters in one model load: `--chapters 4,5`),
  `--max-lines N` narrates only the first N lines (testing), `--whisper small.en` is the default check model.
