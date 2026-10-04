# The Last Penalty: resume notes

Standalone story (one part). You're the keeper facing the last penalty of the final; the taker always looks where he's
going to shoot, until he closes his eyes.

## State
- 2026-10-03: script (`script.txt`, 177 words), narration (George C, take-01, 69.0 s speech, 69.87 s with the end
  card), web build (`web/penalty_clip.js`, `web/timeline.js`), original score (`source/score.py` -> `audio/score.wav`),
  SFX cues (`source/sound_cues.py`), mix and captions (`scripts/finish.py`), cover (`web/cover_clip.js` ->
  `delivery/The_Last_Penalty_cover.png`), post metadata (`delivery/post.json`).
- Cameras were widened after the Part 2 "too zoomed in" feedback: portrait frames are only ~0.56x as wide as tall, so
  single-character shots sit 10-13 studs back and two-character shots further.
- 2026-10-04: full render (2096 frames) encoded to `delivery/The_Last_Penalty.mp4` (69.87 s, validated). Sent for
  review. **Not posted.** Post only after the user approves this MP4 (TikTok first, then YouTube).

## Rebuild
```
node web/fit_check.mjs --clip projects/the-last-penalty/web/penalty_clip.js --reviewed   # no wardrobe items
node web/render.mjs --clip projects/the-last-penalty/web/penalty_clip.js --out projects/the-last-penalty/renders/web --workers 3 --resume
cd projects/the-last-penalty && python3 source/sound_cues.py && python3 source/score.py && cd ../..
python3 scripts/finish.py projects/the-last-penalty --encode --frames projects/the-last-penalty/renders/web
node web/render.mjs --clip projects/the-last-penalty/web/cover_clip.js --out <dir> --frames 1   # cover
```
