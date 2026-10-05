# The Guardian Quits (standalone): resume notes

Steal an Egg told by the guardian: the game's T-rex (`assets/roblox_pack/creatures/trex`, poses in `web/lib/trexPoses.js`)
loses its egg at the safe-zone wall every day, disguises itself as a "Player", takes every egg back, hatches 400 babies
and quits to guard Leo's base from a treadmill. George voice C narration (take-01, speech ends 63.5 s), 64.6 s video
including the 0.5 s cover hold (61-65 s rule). Story and beats: `source/story.md`.

## Done
- Script approved 2026-10-05 ("change it to a t rex and then make it").
- `source/fix_captions.py` (text only): joins "T" + "-Rex", 400 -> four hundred, "brain rot" -> brainrot. Run before `beats.py`.
- Scene `web/guardian_clip.js`; SFX `source/sound_cues.py` mirrors its `B` block. The disguise (sunglasses on the head,
  hoodie and the egg pile on the torso) uses `attachToBody()` from `web/lib/creature.js` (objects given in OBJ model space).
- Cover `web/cover_clip.js` -> `delivery/The_Guardian_Quits_cover.{png,jpg}`; `finish.py --encode` appends it as the last 0.5 s.
- `delivery/The_Guardian_Quits.mp4` (1080x1920, 64.6 s, 1,937 frames, validated), `delivery/The_Guardian_Quits_post.md`, `delivery/post.json`.

## Next
- Awaiting the user's approval of this MP4. Post only after "approved" (TikTok first, then YouTube; story slot 22:30 UK).

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/the-guardian-quits/source/fix_captions.py && python3 projects/the-guardian-quits/source/beats.py && python3 projects/the-guardian-quits/source/sound_cues.py
python3 scripts/finish.py projects/the-guardian-quits
node web/fit_check.mjs --clip projects/the-guardian-quits/web/guardian_clip.js && node web/fit_check.mjs --clip projects/the-guardian-quits/web/guardian_clip.js --reviewed
node web/render.mjs --clip projects/the-guardian-quits/web/guardian_clip.js --out projects/the-guardian-quits/renders/web --workers 3 --resume
node web/render.mjs --clip projects/the-guardian-quits/web/cover_clip.js --out projects/the-guardian-quits/renders/cover --frames 1
python3 scripts/finish.py projects/the-guardian-quits --encode --frames projects/the-guardian-quits/renders/web
```
