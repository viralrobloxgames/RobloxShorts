# He Won The Marathon By Car: resume notes

Standalone true story: the 1904 St. Louis Olympic marathon. Fred Lorz quits at mile nine, rides eleven miles in a
car, jogs in first when it breaks down at mile nineteen and nearly gets the gold before officials hear about the car
(banned); Andarín Carvajal, a Cuban mailman in cut-off street clothes, chats with the crowd, eats rotten orchard
apples, naps and still finishes fourth; Len Taunyane is chased a mile off course by a dog; 90 F heat, dust, one water
stop. Max is Lorz, Leo the mailman, Skye the runner the dog chases, Mia hands out the medal, Noob drives the car and is
the official. Facts, beats and sources: `source/story.md`.

## State
- 2026-10-05/06 (overnight run): script v1 (157 words with the CTA); approval waived by the user for this run.
- Narration: George voice C (`qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --gap 0.6 --beat 1.3` (longer pauses to reach the 61-65 s rule) = **60.7 s speech**
  (words end 60.54 s). Video = speech + 2.0 s end card = 62.57 s (1877 frames), + 0.5 s cover = **~63.1 s**.
  Captions: "runner's" -> "runners'" fixed in `audio/alignment/captions.json` / `.srt` and word_fixes. Numbers show
  as digits in the captions (11, 1904, 90, 9, 19).
- Web route: `web/marathon_clip.js` (18 shots), `web/kit.js` (dirt road with ruts, split-rail fences, trees, apple
  orchard, the finish with stands, a flat block crowd that bounces, FINISH banner and breaking tape, the 1900s car with
  spinning spoked wheels, dust and steam puffs, MILE 9 / MILE 19 posts, the well with the WATER board, medal, apple,
  running vests with numbers, the mailman's shirt and knee-cut trousers). The collie (pack `animal_collie_parts`)
  follows Skye's trail. The road sits at y 0.1 with a polygon offset and the camera near plane is 0.5 (the meadow
  z-fought through the road at 0.04).
- Checks: previews of every shot, a motion pass (`--every 3 --scale 0.3`) reviewed in sheets, `web/hold_check.js`
  (medal raised / low / back, apple low / at the mouth / rotten, hands on the wheel) looked at, fit check (Noob + cap)
  PASS and reviewed.
- Full render started 2026-10-06 01:11 UTC: `node web/render.mjs --clip projects/the-marathon-car-ride/web/marathon_clip.js --out projects/the-marathon-car-ride/renders/web --workers 4 --resume`

## Next
1. When the render finishes: `python3 source/make_sfx.py && python3 source/sound_cues.py`, cover (`web/cover_clip.js`
   -> `delivery/He_Won_The_Marathon_By_Car_cover.png/.jpg` + 3:4 grid check), then
   `python3 scripts/finish.py projects/the-marathon-car-ride --encode --frames projects/the-marathon-car-ride/renders/web`,
   `python3 scripts/review/blank_frames.py <mp4>`, contact sheet, `delivery/post.json`, `python3 scripts/post_md.py projects/the-marathon-car-ride`.
2. Ledger status -> delivered_local_review. Post only after the user approves the MP4.
