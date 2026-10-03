# Stealing a T-Rex Egg (Part 1): resume notes

A Steal an Egg parody with Leo, Max and Mia on the game's own T-rex and eggs (`assets/roblox_pack/creatures/trex`,
`props/egg_*`, exported from the user's place "Hunt For Eggs!"). Web route, George voice C narration (71.4 s, take-01),
71.8 s video (2,155 frames). Story and research notes: `source/story.md`.

## Done
- Script v2 approved 2026-10-03 ("make the video"). Narration take-01; line 24 given a pause ("Now... the T-rex...").
- `source/fix_captions.py` (text only): joins Whisper's "T" + "-Rex", fixes "Steel and" -> "Steal an", digits, "Mum" -> "Mom".
  Run it after any re-transcribe, before `beats.py`.
- Rig: `web/lib/creature.js` poses the pack creatures from rig.json; `web/lib/trexPoses.js` (sleep/idle/roar/run/headbutt;
  the run is the game's own CreatureGait). `projects/stealing-a-t-rex-egg/web/rig_probe.js` is the pose/axis probe.
- Scene `web/egg_clip.js`: beats from `source/beats.py`, SFX from `source/sound_cues.py` (mirrors the clip's `B` block).
  Mia's four background raids (`RAIDS`) and the nest counter plant the twist; Mom walks through the safe zone.
- Ground is plain grass (studs only on the base plots): a studded ground made each frame ~3x slower.
- `delivery/post.json`.

## Next
- Finish the full render, mix + encode, review, cover, deliver. Post only after the user approves.

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/stealing-a-t-rex-egg/source/fix_captions.py && python3 projects/stealing-a-t-rex-egg/source/beats.py && python3 projects/stealing-a-t-rex-egg/source/sound_cues.py
python3 scripts/finish.py projects/stealing-a-t-rex-egg
node web/fit_check.mjs --clip projects/stealing-a-t-rex-egg/web/egg_clip.js && node web/fit_check.mjs --clip projects/stealing-a-t-rex-egg/web/egg_clip.js --reviewed
node web/render.mjs --clip projects/stealing-a-t-rex-egg/web/egg_clip.js --out projects/stealing-a-t-rex-egg/renders/web --workers 3 --resume
python3 scripts/finish.py projects/stealing-a-t-rex-egg --encode --frames projects/stealing-a-t-rex-egg/renders/web
```
