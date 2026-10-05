# Every Lie Comes True: resume notes

Standalone story (one part). Whatever Leo lies about comes true, until he tells Max he's never seen him before.
Approved 2026-10-04 ("Approved, make the video").

## State
- Script approved (`script.txt`, 187 words). Narration: George voice C (Qwen3-TTS 1.7B clone, cloud), take-01,
  74.6 s speech, all words heard (line 25 is a quick, snappy read). Video length 76.0 s.
- Web build: `web/lie_clip.js` (timeline, shots, overlays), `web/kit.js` (classroom, school, yard, bike, backpack,
  cash, lip sync), `web/beats.js` (`source/beats.py`), `web/lipsync.js` (`source/lipsync.py`).
  The dragon is the pack's `saber_tooth_wyvern` (jaw: upper head + `.013` lower jaw, hinged in `hinge()`).
- Sound: `source/sfx_assets.py` synthesizes roar/glass/chomp/chime/rewind/flutter/clang/whoosh/thud into `audio/sfx/`;
  `source/sound_cues.py` -> `source/sound_cues.json`; music bed `playful_history_music`.
- Cover: `web/cover_clip.js` -> `delivery/Every_Lie_Comes_True_cover.png|jpg` (3:4 crop checked).
- Post text: `delivery/post.json` (+ `_post.md` from `scripts/post_md.py`).
- 2026-10-05: full web render (2280 frames, two browser processes ~2 h), encoded to `delivery/Every_Lie_Comes_True.mp4`
  (76.5 s incl. the 0.5 s cover hold, validated, -17 LUFS). Sent for review.
- **Not posted.** Post only after the user approves this MP4 (TikTok first, then YouTube).

## Rebuild
```
cd projects/every-lie-comes-true && python3 source/beats.py && python3 source/lipsync.py && python3 source/sfx_assets.py && python3 source/sound_cues.py && cd ../..
node web/fit_check.mjs --clip projects/every-lie-comes-true/web/lie_clip.js --reviewed   # no wardrobe items
node web/render.mjs --clip projects/every-lie-comes-true/web/lie_clip.js --out projects/every-lie-comes-true/renders/web --workers 4 --resume
node web/render.mjs --clip projects/every-lie-comes-true/web/cover_clip.js --out <dir> --frames 1   # cover
python3 scripts/finish.py projects/every-lie-comes-true --encode --frames projects/every-lie-comes-true/renders/web
```
