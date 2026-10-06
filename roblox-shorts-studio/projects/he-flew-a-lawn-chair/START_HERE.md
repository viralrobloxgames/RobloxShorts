# He Flew A Lawn Chair: resume notes

Standalone true story (one part), found through general research (not OddFrame's list). On 2 July 1982 Larry
Walters, a truck driver who couldn't become a pilot because of his eyesight, sat in a lawn chair tied to 42 weather
balloons in a San Pedro backyard, meaning to rise about 100 ft on a tether. The tether snapped and he shot up to about
16,000 ft, freezing, where TWA and Delta pilots radioed the tower about a man in a lawn chair. He popped some balloons
with a pellet gun, dropped the gun, drifted into power lines in Long Beach (a 20-minute blackout), landed unhurt and
was arrested. "A man can't just sit around." The FAA fined him for flying an aircraft without contacting the tower;
the chair is now in the Smithsonian's National Air and Space Museum. Max plays him; Mia the girlfriend; Leo and Skye
the airline pilots. Facts, beats and sources: `source/story.md`.

## State
- 2026-10-05 night: overnight run (user: keep making story videos until 6am, no script approval needed; never post).
  Script v1 (155 words with the CTA) used as written, except line 17 spelled "He was never... allowed to be a pilot."
  (same words).
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --beat 1.05 --gap 0.55` = **59.8 s speech** (words end 59.66 s). The 0.38 / 0.8 join gave
  55.9 s (a 58.4 s video, under the 61-65 s rule), so the pauses were opened up. Line 17 read too fast (8 words in
  1.7 s, two seeds alike), so its clip was slowed 15% with ffmpeg atempo (pitch kept, clips and clips_raw). Video =
  speech + 2.0 s end card = 61.67 s (1850 frames), + 0.5 s cover = **62.2 s**. Caption fix: FINE -> FINED.
- Web route: `web/chair_clip.js` (20 shots), `web/kit.js` (yard with the Jeep, lawn chair with jugs, balloon cluster
  that pops, sky with clouds, eye doctor's room, airliner nose with the pilots and a whole airliner, control tower,
  Long Beach street with the power line and police car, museum). Max's thick glasses are drawn on his faces
  (`assets/roblox_pack/faces/glasses_*.png`, `tools/make_glasses_faces.py`), so no accessory fit is needed for them;
  the pilots and police wear `officer_cap` (fit check: 3 pairs pass, reviewed).
- Preview fixes after the restart: every character preloads the full face set (Leo's "sad" was missing and crashed the
  render); cameras re-framed for snap, eye (two angles), liner, cockpit (windscreen pillars moved off the pilots' faces),
  police and press (a street tree moved out of the lens), fined/aircraft (notice overlay shrunk, Max framed lower);
  museum light softened (no roof; the white walls blew out).
- Hold check: `web/hold_check.js` (12 close-ups, looked at; props sit at the measured palm).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (53 cues). Mix -16.4 LUFS.
- Cover: `web/cover_clip.js` (Max in the chair at 16,000 ft under the balloons; HE FLEW A / LAWN CHAIR / TO 16,000 FT),
  `delivery/He_Flew_A_Lawn_Chair_cover.jpg|png`, grid check `_cover_grid.jpg`. Post copy: `delivery/post.json`.
- Full render done (renders/web, git-ignored, kept for fixes). Encoded `delivery/He_Flew_A_Lawn_Chair.mp4`: 1865 frames,
  62.17 s incl. the 0.5 s cover, -16.4 LUFS / -1.5 dBTP, captions burned, blank-frame check clean, contact sheet reviewed.

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/he-flew-a-lawn-chair/web/chair_clip.js --out projects/he-flew-a-lawn-chair/renders/web --workers 4 --resume
python3 scripts/finish.py projects/he-flew-a-lawn-chair --encode --frames projects/he-flew-a-lawn-chair/renders/web
python3 scripts/review/blank_frames.py projects/he-flew-a-lawn-chair/delivery/He_Flew_A_Lawn_Chair.mp4
```

## Next
1. Awaiting the user's review of `delivery/He_Flew_A_Lawn_Chair.mp4`. Never post without explicit approval of this MP4.
