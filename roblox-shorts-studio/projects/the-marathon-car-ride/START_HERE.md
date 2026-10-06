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
- Full render 2026-10-06 01:11-02:52 UTC (1877 frames, 1080x1920; paused ~7 min while the Niagara narration ran).
- Sound: `source/make_sfx.py` (synthesized engine putter, bulb horn, dog barks, radiator hiss, snores, apple crunch,
  running steps, bucket splash; copies whoosh/thud/pop/chime/fanfare/applause/clang/flutter) -> `audio/sfx/`,
  `source/sound_cues.py` -> `source/sound_cues.json` (113 cues). Music: playful_history_music.
- Cover: `web/cover_clip.js` (Max laughing and waving from the back seat of the car beside the driver, Leo and Skye
  running behind; HE "WON" THE / MARATHON / BY CAR, 1904 · TRUE STORY), 3:4 grid check looked at.
- **Delivered for review (2026-10-06):** `delivery/He_Won_The_Marathon_By_Car.mp4` (63.07 s = 1877 frames + 15 cover
  frames, fully decoded, captions burned in), cover `.jpg`/`.png`, `_post.md`, `post.json`. Blank-frame check: no
  runs flagged. Contact sheet of the MP4 reviewed. Not posted (needs the user's approval of this MP4).

## Next
1. The user watches the MP4. Post only after they approve it (TikTok first, then YouTube; see references/publishing.md).
