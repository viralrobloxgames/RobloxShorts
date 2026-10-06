# The Penguin General: resume notes

Standalone true story (one part): Sir Nils Olav, the king penguin at Edinburgh Zoo adopted by the Norwegian King's
Guard in 1972 as a lance corporal and promoted on every visit since: knighted in 2008 (130 guardsmen on parade), a
bronze statue, brigadier in 2016, major general in 2023. Three penguins have held the name and rank. Facts, beats and
sources: `source/story.md`. Made overnight without script approval (user request 2026-10-05).

## State
- 2026-10-05: script v1 (147 words with the CTA). Web clip (three.js, 15 shots) and sets kit started.
- 2026-10-06 (overnight): narration (George voice C, take-01): **58.9 s speech**, all words heard (numerals only).
  Beats from the real narration: 47 anchors, none interpolated (aliases for "1972", "130", "2023").
  Clip 60.67 s (1820 frames) + 0.5 s cover = 61.2 s (61-65 s rule); `source/project.json` seconds = 60.67.
- Preview sheets reviewed; fixed: the 1972 visit (guards walked to spots outside both cameras at 12 units/s and Mia
  stood on top of the cameras: now the penguin stands on the pool's front rim, the guards march in single file from
  the right and halt facing him, Mia claps behind the pool; the nearest guard turns half to camera to salute at
  "lance corporal"); the knighthood card read "SIR  SIR NILS OLAV" (sword insignia now); the 2023 tag sat on the
  BRIGADIER card (the card now waits for "major general").
- Hold check (`web/hold_check.js`: sword, scroll, salute) and fit check (0 pairs) done.
- **Full render not started: the disk has 1.3 GB free; a full render needs ~2.6 GB.**

- Sound cues (`source/sound_cues.py`, 53 cues; SFX copied into `audio/sfx/`), final mix -16.8 LUFS, peak 0.84;
  captions built. Cover clip (`web/cover_clip.js`: the penguin turned to camera in front of the saluting line,
  "THIS PENGUIN IS A / MAJOR GENERAL / THEY SALUTE HIM") saved full size: `delivery/The_Penguin_General_cover.png|jpg`.
  Post copy: `delivery/post.json`.

## Next
1. Free disk space (user decision), then full render:
   `node web/render.mjs --clip projects/the-penguin-general/web/penguin_clip.js --out projects/the-penguin-general/renders/web --workers 4`;
   cover full size, encode with `scripts/finish.py ... --encode --frames .../renders/web`, blank-frame check, preview to the user.
