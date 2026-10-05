# The Tornado Came Back: resume notes

Standalone true story (one part), found through general research for the user's request "Make a story about
tornados" (2026-10-05). On 20 March 1948 an unforecast tornado wrecked about fifty planes at Tinker Air Force Base,
Oklahoma. The general demanded to know why weathermen could forecast rain but not tornadoes; five days later his two
weathermen saw the same weather map, put the odds at "billions to one", and still answered his "yes or no?" with yes.
The planes went into hangars, one weatherman went home wondering if he could get a job running an elevator, and at
about 6 pm a tornado hit almost the same spot: the first official tornado forecast came true. Max and Leo play the
weathermen, Mia the general, Skye and Noob airmen. Facts, beats and sources: `source/story.md`.

## State
- 2026-10-05: script v1 (155 words) **approved** ("approved, make the video").
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c` at the default gap 0.4 / beat 0.9 = **61.0 s speech** (words end 60.88 s). Video =
  speech + 2.0 s end card = 62.9 s (1887 frames), + 0.5 s cover = **63.4 s**. Captions: "o 'clock" merged and
  "hangers" fixed in `audio/alignment/captions.json` / `.srt`; word_fixes in `source/project.json`.
- New pack hats (procedural, `assets/roblox_pack/tools/make_service_caps.py`, fit rule `seat`): `officer_cap` (the
  general; the band's lower edge rises at the front and the underside is open, so it seats on the hair and clears the
  brows) and `pillbox_hat` (Max's elevator daydream). Mia loads with `hairLift: 0.2` so her fringe clears her angry
  brows under the cap.
- Web route: `web/tornado_clip.js` (26 shots), `web/kit.js` (the air base: apron, bomber and fighter rows, three
  arched hangars with sliding doors, control tower, weather station, shelter with a dark tunnel, siren, gate; the
  tornado: three spinning streaked lathe shells + dust skirt + debris + wall cloud, dark at night, a white "finger" at
  six; the weather office with map board, ghost chart, notice board, typewriter, files, clock, calendar, radar
  console; the elevator; the phone on a table). Planes near the hook's path are thrown when the funnel reaches them.
- Overlays: date pill, PLANES WRECKED counter, WEATHERMEN / IT'S COMING BACK, NOT ALLOWED stamp, THE GENERAL, two
  speech bubbles, DAY n, SAME MAP stamp, SAME BASE? / odds counter, BILLIONS TO 1, YES., PLANES INTO HANGARS,
  EVERYONE TO SHELTER, NEW JOB? / GOING DOWN in a thought-bubble frame, 6:00 P.M., AGAIN!, ALMOST THE SAME SPOT with
  the two path ribbons, THIS TIME: READY, FIRST TORNADO FORECAST / IT CAME TRUE, TORNADO WARNINGS START HERE, CTA card.
- Hold check: `web/hold_check.js` (no held props; the hand contacts: pushing the fighter's tail, typing), looked at.
- Sound: `source/make_sfx.py` (synthesized tornado roar, siren, radar ping, phone buzz, hangar doors, typewriter;
  copies the rest) -> `audio/sfx/`; `source/sound_cues.py` -> `source/sound_cues.json` (142 cues). Music:
  playful_history_music.
- Cover: `web/cover_clip.js` (the hook: funnel, a fighter in the air, Max and Leo running; THEY PREDICTED / THE
  TORNADO / 1948 · TRUE STORY). Post copy: `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/make_sfx.py && python3 source/sound_cues.py      # from the project dir
node web/fit_check.mjs --clip projects/the-tornado-came-back/web/tornado_clip.js            # then --reviewed
node web/render.mjs --clip projects/the-tornado-came-back/web/tornado_clip.js --out projects/the-tornado-came-back/renders/web --workers 4 --resume
node web/render.mjs --clip projects/the-tornado-came-back/web/cover_clip.js --out /tmp/cover --frames 1
python3 scripts/finish.py projects/the-tornado-came-back --encode --frames projects/the-tornado-came-back/renders/web
python3 scripts/review/blank_frames.py projects/the-tornado-came-back/delivery/The_Tornado_Came_Back.mp4
python3 scripts/post_md.py projects/the-tornado-came-back
```

## Next
1. Full render, encode, blank-frame check, contact-sheet review, cover, deliver for the user's review. Post only
   after approval.
