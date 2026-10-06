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
