# The Postman's Palace: resume notes

Standalone true story (one part), made in the overnight run (user, 2026-10-05 23:45 UK: keep making new story videos
until 06:00 UK; no script approval needed tonight; never post without approval). In 1879 a French country postman
(Ferdinand Cheval) trips over a strange stone, pockets it, and spends 33 years building a palace from stones picked
up on his 30 km round: pockets, then baskets, then a wheelbarrow, building at night by an oil lamp while the village
laughs. Refused burial in it, he builds his own tomb in eight more years. Today it's a protected monument. Max plays
the postman (new `postman_kepi` + satchel); Leo, Mia, Skye, Noob the villagers / tourists / official / stall keeper.
Facts, beats and sources: `source/story.md`.

## State
- Script v1 (156 words) written (no approval needed tonight). Ledger: script_approved.
- Narration: George voice C, 60.2 s (`audio/narration.wav`); captions merged for 10,000 and 93,000.
- Web route: `web/palace_clip.js` (19 shots) on the real word timings (`source/beats.py` -> `web/beats.js`).
  Fit check (postman_kepi on Max) passed and reviewed; hold check (stone, basket, wheelbarrow, lamp-lit stone, tomb
  stone) passed.
- Cover rendered: `delivery/The_Postman_s_Palace_cover.png/.jpg` + 3:4 grid crop; subline under the headline, motto
  sign reads in full, Max's face clear.
- **Delivered for review (2026-10-06 ~05:25 UK):** `delivery/The_Postman_s_Palace.mp4` (62.5 s, 1875 frames,
  1080x1920, audio, burned captions, cover held in the last 0.5 s). The first encode's blank-frame check flagged the
  start of the round shot (Max behind the front hedge); his walk now starts inside the hedge gap (x -29), the round
  shot (frames 387-516) was re-rendered and the video re-encoded: no flags. Contact sheet looked at: faces readable,
  no two-arms-up poses, stone/basket/barrow in hand. Fit check re-run and reviewed after the clip edit. Post copy:
  `delivery/The_Postman_s_Palace_post.md`. **Not posted: waiting for the user's approval of the MP4.**
- Sound: `source/make_sfx.py` (copies) and `source/sound_cues.py`. Post copy: `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/make_sfx.py && python3 source/sound_cues.py      # from the project dir
node web/fit_check.mjs --clip projects/the-postmans-palace/web/palace_clip.js             # then --reviewed
node web/render.mjs --clip projects/the-postmans-palace/web/palace_clip.js --out projects/the-postmans-palace/renders/web --workers 4 --resume
node web/render.mjs --clip projects/the-postmans-palace/web/cover_clip.js --out /tmp/cover --frames 1 --skip-fit-check
python3 scripts/finish.py projects/the-postmans-palace --encode --frames projects/the-postmans-palace/renders/web
python3 scripts/review/blank_frames.py "projects/the-postmans-palace/delivery/The_Postman_s_Palace.mp4"
```
