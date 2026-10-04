# Catching the Egg Thief (standalone): resume notes

A Steal an Egg parody about the game's base-stealing side, with Leo, Max (as the hooded thief), the pack's spinosaurus,
capybara and eggs (`assets/roblox_pack/creatures/{spinosaurus,animal_capybara}`, `props/egg_*`; the Mythic egg is
`props/egg_spinosaurus`). Web route, George voice C narration (take-01, speech ends 68.4 s), 69.1 s video (2,072 frames).
Story and beats: `source/story.md`. Standalone: no part tags anywhere (user rule).

## Done
- Script approved 2026-10-04 ("Make it"). Line 19 reworded for pace: "It picked them up by the hood. And carried them all the way back to me."
- `source/fix_captions.py` (text only): digits -> words, "check" -> "checked". Run it after any re-transcribe, before `beats.py`.
- Spinosaurus poses: `web/lib/spinoPoses.js` (idle/walk = the game's CreatureGait/roar/bend). `web/lib/creature.js` now takes a
  `kind` (`loadCreature(name, 'props')`) and poses `<body>_decal<n>` meshes with their body.
- Scene `web/thief_clip.js`: beats from `source/beats.py`, SFX from `source/sound_cues.py` (mirrors the clip's `B` block).
  Night lighting; the thief is Max with a procedural hood (glowing eyes) and cloak, lit by a follow light (`thiefLight`).
  Portrait framing note: horizontal half-FOV is only ~15 deg at fov 50, so keep subjects near the look target.
- Cover: `web/cover_clip.js` (spinosaurus carrying the thief by the hood; "CATCHING THE / EGG THIEF").

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/catching-the-egg-thief/source/fix_captions.py && python3 projects/catching-the-egg-thief/source/beats.py && python3 projects/catching-the-egg-thief/source/sound_cues.py
python3 scripts/finish.py projects/catching-the-egg-thief
node web/fit_check.mjs --clip projects/catching-the-egg-thief/web/thief_clip.js && node web/fit_check.mjs --clip projects/catching-the-egg-thief/web/thief_clip.js --reviewed
node web/render.mjs --clip projects/catching-the-egg-thief/web/thief_clip.js --out projects/catching-the-egg-thief/renders/web --workers 3 --resume
python3 scripts/finish.py projects/catching-the-egg-thief --encode --frames projects/catching-the-egg-thief/renders/web
node web/render.mjs --clip projects/catching-the-egg-thief/web/cover_clip.js --out projects/catching-the-egg-thief/renders/cover --frames 1
```
Post only after the user approves this MP4 (TikTok first, then YouTube).
