# Lightning Hit Him Seven Times: resume notes

Standalone true story (one part), found through general research rather than OddFrame's list (user, 2026-10-05:
"Lets not just copy all their video ideas"). Shenandoah park ranger Roy Sullivan was hit by lightning seven times
between 1942 and 1977 and survived every one: a toenail, his eyebrows, his shoulder, his hair (three times), his
ankle; he carried a can of water, tried to outrun a storm cloud, his boss walked off when lightning flashed, and on
the seventh strike a bear came to steal his fish. Guinness still lists the record. Max plays the ranger, Leo his
boss. Facts, beats and sources: `source/story.md`.

## State
- 2026-10-05: script v1 (155 words) **approved** ("approved, make the video").
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --beat 0.8 --gap 0.38` = **62.1 s speech** (words end 61.88 s). The default 0.42 / 0.85
  gave 63.0 s, which would have put the video over 65 s. Video = speech + 2.0 s end card = 63.9 s (1917 frames),
  + 0.5 s cover = **64.4 s**.
- New pack assets: `ranger_hat` (procedural, `assets/roblox_pack/tools/make_ranger_hat.py`, fit rule `seat`; whole-pack
  fit check rerun, 65 pairs pass) and `ranger_hat_burnt` (museum prop, no fit rule); the pack bear cut into hinged parts
  (`creatures/animal_bear_parts`, `tools/cut_bear.py`, walks with a distance-driven gait); brow-less faces
  (`faces/nobrow_*.png`, `faces/singed.png`, `tools/make_nobrow_faces.py`): after strike two Max never has eyebrows again.
- Web route: `web/lightning_clip.js` (28 shots), `web/kit.js` (stormy plain with the forest trail and bench, lookout
  tower on a hill, mountain road with a cliff and valley, the yard with the power pole, ranger station outside and the
  office inside, the pond with the stump, the museum case; the ranger truck, water can, rod, fish, bolts, flames, sparks,
  storm clouds). Overlays: STRIKES 0/7 counter, a STRIKE n title per strike, a damage pop per strike (never carried over
  a cut), NEW ITEM: WATER CAN, Leo's "I'll see you later." bubble, 7 STRIKES / SURVIVED 7/7 / STILL THE WORLD RECORD,
  CTA card over Max waving under the rainbow. Rain is drawn in the overlay.
- Held props use the measured palm: the R6 arm runs 0.5 above to 1.5 below the shoulder pivot, centred 0.5 out, so the
  fist is (-+0.5, -1.3, 0) in the arm bone (the old (0, -1.8, 0) grip sat 0.3 below the hand). Hold check:
  `web/hold_check.js` (14 close-ups, looked at). Fit check: Max and Leo + ranger_hat, reviewed.
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (104 cues; sfx copied into audio/sfx from The Backwards
  Umbrella, Every Lie Comes True and Copy the Crown). Music: playful_history_music. Mix -16.9 LUFS.
- Cover: `web/cover_clip.js` (the hook strike: bolt, hat flying, HIT BY LIGHTNING / 7 TIMES / AND SURVIVED),
  `delivery/Lightning_Hit_Him_Seven_Times_cover.jpg|png`, grid check `_cover_grid.jpg`. Post copy: `delivery/post.json`.
- Full render done (renders/web, 1917 frames, 4 workers, ~2.8 s/frame, about 1.5 h; frame_hashes.json saved, so a fix
  re-renders only the changed frames with web/changed_frames.mjs). Encoded: `delivery/Lightning_Hit_Him_Seven_Times.mp4`,
  64.4 s incl. the 0.5 s cover hold, 1932 frames, fully decoded, -17.0 LUFS / -1.3 dB peak; blank-frame check: no runs
  flagged; contact sheet reviewed. **Awaiting the user's review.** Post only after approval (TikTok, then YouTube).

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/lightning-hit-him-seven-times/web/lightning_clip.js --out projects/lightning-hit-him-seven-times/renders/web --workers 4 --resume
node web/render.mjs --clip projects/lightning-hit-him-seven-times/web/cover_clip.js --out /tmp/cover --frames 1
python3 scripts/finish.py projects/lightning-hit-him-seven-times --encode --frames projects/lightning-hit-him-seven-times/renders/web
python3 scripts/review/blank_frames.py projects/lightning-hit-him-seven-times/delivery/Lightning_Hit_Him_Seven_Times.mp4
python3 scripts/post_md.py projects/lightning-hit-him-seven-times
```

## Next
1. The user's review. On approval: post TikTok first, then YouTube Shorts (references/publishing.md), with delivery/post.json.
2. Once delivered and approved, delete renders/ (git-ignored, ~5 GB) before the next render on this machine.
