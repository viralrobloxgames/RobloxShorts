# He Stole The Mona Lisa, landscape cut (YouTube long-form): resume notes

The 16:9 version of `projects/he-stole-the-mona-lisa` (the approved 62 s vertical Short). Why: YouTube classes any
vertical or square video up to 3 minutes as a Short, and Shorts-feed views do not count towards the 4,000 public watch
hours for monetisation. A 1920x1080 file is a normal video at any length. It replaces the Short on YouTube only
(video id vD09XCnE420, scheduled 2026-10-08 22:30 UK); TikTok keeps the vertical one.

Same script, narration, timing, cast, sets and sound. Only the frame changes.

## State
- 2026-10-08: `web/mona_wide_clip.js` re-exports the base clip with `LAY` set for 1920x1080 (the base clip reads `LAY`:
  frame size, graphics offset `ox/oy`, tag position, `fovK` 0.62 on every lens, per-shot `cam[shot] = { k, dy }`,
  newspapers in a row, SUBSCRIBE button). The vertical clip is unchanged when `LAY` is left at its defaults.
- Audio inputs copied from the vertical project (`audio/narration.wav`, `audio/alignment`, `audio/sfx`,
  `source/sound_cues.json`). `source/project.json`: 1920x1080, captions size 80, 70 px above the bottom edge.
- Smoke test: frames 60, 700, 1010, 1800 render at half size. **Not yet framed shot by shot**: seen so far, the thought
  bubble sits on the artist's head (shot `guards`) and the end card covers the painting with the crowd low in frame
  (shots `today`/`cta`).
- No fit check for this clip: same cast and clothing as the vertical clip (0 accessory pairs, reviewed there), so render
  with `--skip-fit-check`.
- No cover frame at the end (YouTube takes a custom 16:9 thumbnail): name the thumbnail `*_thumb.jpg`, not `*_cover.*`,
  or finish.py appends a 0.5 s vertical cover.

## Commands
```
node web/render.mjs --clip projects/he-stole-the-mona-lisa-wide/web/mona_wide_clip.js --out projects/he-stole-the-mona-lisa-wide/renders/check --frames <one per shot> --scale 0.5 --no-skip
node web/render.mjs --clip projects/he-stole-the-mona-lisa-wide/web/mona_wide_clip.js --out projects/he-stole-the-mona-lisa-wide/renders/web --workers 4 --resume --skip-fit-check
python3 scripts/finish.py projects/he-stole-the-mona-lisa-wide --encode --frames projects/he-stole-the-mona-lisa-wide/renders/web
```

## Next
1. Frame every one of the 22 shots (one still each, plus the overlay moments), fix with `LAY.cam` and the overlay positions.
2. Full render, encode, check (1920x1080, 1857 frames, 61.9 s, captions inside the frame), thumbnail 1280x720.
3. Commit the MP4 and thumbnail to main. Upload and scheduling happen from the local session (browser sign-in).
