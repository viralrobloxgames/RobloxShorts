# Detective Max Sniffwell: The Clown Case: resume notes

Standalone case of the Super Nose Detective series (cases 1-2: `projects/the-super-nose-detective`,
`projects/super-nose-case-2`). Web route, `detective_noir` narration. Story, beats and what was taken from the
original's Election Case: `source/story.md`. Script: `script.txt` (158 words, ~63 s).

## Status
- Script v1 written 2026-10-05, **awaiting the user's approval**.

## Next (after approval)
- Narrate in the background (`/tmp/claude-0/qwenv/bin/python scripts/qwen_cloud_clone.py projects/the-clown-case --voice
  detective_noir --take take-01`, then `scripts/tighten_clips.py`, then `scripts/narrate.py`) while building the scene
  from case 2's kit (nose, cuffs, the lock-up title card) against estimated, word-anchored beats.
- Before the full render: hold check (`web/hold_check.js`), fit check. After the encode: `scripts/review/blank_frames.py`.
  Fixes after review: `web/changed_frames.mjs --delete` + `render.mjs --resume`.
