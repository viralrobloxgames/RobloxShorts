# She Went Over Niagara Falls In A Barrel: resume notes

Standalone true story: Annie Edson Taylor (24 October 1901, her 63rd birthday) went over the Horseshoe Falls in a
barrel, after her cat went first as a test; she survived with a cut on her head ("never again"), and then her manager
ran off with the barrel and she spent her savings on detectives to get it back. Mia is Annie, Leo and Noob her friends
(Noob later the detective), Skye the rescuer, Max the manager (top hat), the pack cat the cat. Facts, beats and
sources: `source/story.md`.

## State
- 2026-10-06 (overnight run): script v1 (151 words with the CTA); approval waived by the user for this run.
- Narration: George voice C (`qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --gap 0.6 --beat 1.3` = **59.9 s speech** (words end 59.74 s). Video = speech + 2.0 s
  end card = 61.77 s (1853 frames), + 0.5 s cover = **~62.3 s**. Captions: "63 -year -old" merged into one word in
  `audio/alignment/captions.json` / `.srt`; numbers show as digits (63, 20).
- Web route: `web/barrel_clip.js` (19 shots), `web/kit.js` (upper river flowing to an arc-shaped brink, the Horseshoe
  curtain with falling streaks, mist at its base, the gorge and lower river, grass-topped banks with rock cliffs, the
  dock, the oak barrel with iron hoops and a hinged lid, the bicycle pump with a hose, the birthday cake, the rowboat,
  the LOST poster, block crowds, the rock ledge). Mia wears a long dark dress (bodice, sleeves, bell skirt) and a cross
  plaster after the drop; the newspaper, age card, money thought bubble and savings counter are 2D overlays.
- Checks: previews of every shot, a motion pass (`--every 3 --scale 0.3`) reviewed in sheets, `web/hold_check.js`
  (pump handle, lid, pushing, Skye's hands on the barrel) looked at, fit check (Max + top_hat) PASS and reviewed.
- Sound: `source/make_sfx.py` -> `audio/sfx/`, `source/sound_cues.py` -> `source/sound_cues.json`. Post copy: `delivery/post.json`.

## Next
1. Full render (after the marathon's finishes): `node web/render.mjs --clip projects/over-the-falls-in-a-barrel/web/barrel_clip.js --out projects/over-the-falls-in-a-barrel/renders/web --workers 4 --resume`
2. Cover (`web/cover_clip.js` -> `delivery/She_Went_Over_Niagara_Falls_In_A_Barrel_cover.png/.jpg` + 3:4 grid check), then
   `python3 scripts/finish.py projects/over-the-falls-in-a-barrel --encode --frames projects/over-the-falls-in-a-barrel/renders/web`,
   `python3 scripts/review/blank_frames.py <mp4>`, contact sheet, `python3 scripts/post_md.py projects/over-the-falls-in-a-barrel`.
3. Ledger status -> delivered_local_review. Post only after the user approves the MP4.
