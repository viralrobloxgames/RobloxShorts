# Narration, timings, music and effects

## Voice

The Roblox series narrator is **George**: the voice of ElevenLabs' *George - Warm, Captivating Storyteller* (`JBFqnCBsd6RMkjVDRZzb`), now cloned into local Qwen3-TTS. Use natural pitch and speed with **no PS2 crunch**.

### Route L: local Qwen3-TTS clone (default since 2026-10-02)

Story narration (the admin series and other story Shorts) is generated free on the laptop with Qwen3-TTS. It's installed at `~/Qwen3-TTS` by the personal `qwen3-tts` skill: CPU only, 0.6B model, preset and clone models (voice design isn't installed). The saved voice `george` is a 13.9 s cut from the start of Part 2's ElevenLabs narration (`projects/max-got-admin`). A copy with its exact transcript lives in `assets/audio/voices/george.wav` and `george.txt`; to restore it, run `tts --add-voice george --from assets/audio/voices/george.wav --ref-text "<george.txt>"`.

**One background command does it all. Keep the token cost low:** don't use the Studio browser for project narration, don't read the log, and don't poll. Start this with `run_in_background` and wait for the completion notice:

`& "$env:USERPROFILE\Qwen3-TTS\.venv\Scripts\python.exe" scripts/narrate.py projects/<slug>` (add `--voice brittney` for ViralRoblox News; a blank line in `script.txt` adds a `--beat` pause, default 0.9 s)

- It reads `script.txt`, one sentence or beat per line. Each line becomes a clip cached by its text in `audio/qwen/<take>/clips/`, so after a script edit only new or changed lines are generated.
- It joins the clips with 0.4 s gaps into `audio/narration.wav`, writes `narration-source.json`, runs `transcribe.py` for word timings (Qwen gives none), and compares what was heard with the script.
- It prints about 3–10 lines: `NARRATION_READY ...` and then either `CHECK clean` or the lines whose words differ or whose pace looks wrong. Everything else goes to `audio/qwen/<take>/narrate.log`; read that only if it fails.
- Whisper often mishears names and game words, so a flagged line is not proof of a bad read. Cloned voices do sometimes drop a sentence-opening "And" or "So", or the last word of a long line. Fix one with `--redo 3,7`, which regenerates only those lines, re-joins and re-checks.
- Every take comes out a little different. On 2026-10-02, the same `brittney` sample gave one take that sounded off and one the user rated closest of five; a longer mid-episode sample did no better. So if a line doesn't sound like the voice, `--redo` it rather than changing the sample.
- Speed: about 1.5–3 min to load the model, then about 16 s per second of speech, so a 60 s Short takes about 17–20 min. Generation is free, but still get the script approved first.

Don't run two Qwen jobs at once, because the laptop has 8 GB of RAM. In this Claude app's shell, `uv` needs `UV_PYTHON_INSTALL_DIR` and `UV_CACHE_DIR` pointed at `~/.uv` (the app sandboxes AppData); the `tts.bat` and Studio launchers don't.

**ElevenLabs is now only for auditioning new voices.** To pick a voice for a new series or character, play the ElevenLabs previews or Voice Library samples. Once one is chosen, generate a 10–20 s sample, save it with `tts --add-voice <name>`, and narrate locally from then on.

**George voice C (chosen 2026-10-02, Part 4 on):** the user compared four clone setups against real George by ear and picked C:
**Qwen3-TTS 1.7B-Base** (not 0.6B), ICL sample = `assets/audio/voices/george_c.wav` (first 20.8 s of Part 3's ElevenLabs narration, transcript in
`george_c.txt`), and speaker embedding = `george_c_1.7B_xvector.npy`, the mean x-vector over 161 clean George sentences from Parts 1-3 and
The AFK Millionaire (about 3.5 minutes). Findings from that test (`projects/the-noob-has-admin/audio/auditions/`):
- The old `george` setup (0.6B, 13.9 s sample) reads the same sentence about 33% slower than George, which is most of the "robotic" feel.
  The 1.7B model with the longer sample is within ~10%. On a 4-core CPU the 1.7B model was only ~20% slower than 0.6B.
- **Don't pitch-shift the narration.** George's own pitch varies between takes (about 119-131 Hz); lowering the clone made it sound deeper and
  more processed. That pitch-shift step is withdrawn.
- Cloud sessions generate it with `scripts/qwen_cloud_george_c.py <project> [--take take-02] [--redo 3,7]` (writes narrate.py's clip cache), then
  `QWEN_TTS_DIR=<any dir> python3 scripts/narrate.py <project> --voice george_c --take take-02` joins, times and checks without regenerating.
  On the laptop the 1.7B model needs about 7 GB in float32; use bfloat16 there, or keep the 0.6B `george` setup if memory runs out.

### Route A: ElevenLabs connector or signed-in website (legacy)

George's ElevenLabs settings were `eleven_multilingual_v2`, speed 1.0, stability 0.5, similarity 0.75, style 0, speaker boost on. Use the connected ElevenLabs tools, or the user's signed-in ElevenLabs site in Brave. Generate from the saved `script.txt` only after approval. Download the finished take (pre-approved) to `audio/narration.mp3`, or to `audio/source/` if you will splice. Record the voice, model, settings, credits and duration in `audio/narration-source.json`. A pending request is never a reason to generate again: check History.

### Route B: ElevenLabs API (`scripts/voice.py`, legacy)

Set `"elevenlabs_mode": "api"` in settings and store `ELEVENLABS_API_KEY` in the OS keyring (service `roblox-shorts-studio`) or the environment. Then run `python scripts/voice.py generate projects/<slug> --take take-01`. It makes one billed request with timestamps and writes `audio/narration.mp3`, the alignment captions and the source record. Repeating a completed take reuses it. A changed script needs a new take name.

### Credits reference

AFK's full 64 s script took 845 credits, and two insert lines took 56. For TikTok's >60 s rule, generate only the missing lines and splice them (`examples/the-afk-champion/source/assemble_narration.py` finds the quietest window near each cut and crossfades).

## Word timings

Run `python scripts/studio.py transcribe projects/<slug>`, which uses local faster-whisper (CPU, int8). On the original laptop the default CTranslate2 4.8.2 crashes, so set `ctranslate2_compat` to a 4.6.0 copy and `transcription_model` to the cached `faster-whisper-base.en` snapshot. Always compare the transcript with `script.txt`.

## Music

`assets/audio/playful_history_music.wav` is an upbeat instrumental (ElevenLabs music, from the creator's own account; see `assets/audio/PROVENANCE.md`). It is about 32 s long and loops automatically. Default level is `music_gain` 0.065 under `voice_gain` 1.4, with a fade over the last 1.2 s. Set `finish.music` in `project.json` to another WAV path to change it.

## Sound effects

Library: `impact_1-4`, `swish_1-4`, `click`, `drum_hit`. Synthesized tones in cues cover coins, pings, beeps and stings (`{"tone": [988, 1319], "dur": .12}`). Keep effects motivated by visible action and quieter than the voice. More action does not mean more effects. Mastering: `alimiter` 0.95 → `loudnorm` I −16 / TP −1.5 / LRA 9, at 48 kHz.
