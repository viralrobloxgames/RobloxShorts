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
- Narration: George voice C running (`scripts/qwen_cloud_george_c.py --take take-01`, then tighten + narrate.py),
  slowed by sharing CPU with The Tornado Came Back's render.
- Web route: `web/palace_clip.js` (19 shots), `web/kit.js` (lane with the stone, site with the palace that grows by
  clipping planes, fence and village, oil lamp, cemetery with the tomb, wheelbarrow, basket, satchel, souvenir stand,
  monument plaque). First preview pass done and fixed; needs the real narration timings, a second preview pass, a
  motion pass, the hold check (`web/hold_check.js`), the fit check (postman_kepi on Max) and then the full render.
- Sound: `source/make_sfx.py` (copies) and `source/sound_cues.py`. Cover: `web/cover_clip.js`. Post copy:
  `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/make_sfx.py && python3 source/sound_cues.py      # from the project dir
node web/fit_check.mjs --clip projects/the-postmans-palace/web/palace_clip.js             # then --reviewed
node web/render.mjs --clip projects/the-postmans-palace/web/palace_clip.js --out projects/the-postmans-palace/renders/web --workers 4 --resume
node web/render.mjs --clip projects/the-postmans-palace/web/cover_clip.js --out /tmp/cover --frames 1 --skip-fit-check
python3 scripts/finish.py projects/the-postmans-palace --encode --frames projects/the-postmans-palace/renders/web
python3 scripts/review/blank_frames.py "projects/the-postmans-palace/delivery/The_Postman_s_Palace.mp4"
```
