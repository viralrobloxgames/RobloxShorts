STATUS: WORKING

Template ready: `web/ch_template.js`. Kit API + pipeline usage: `web/kit/README.md`.
- Done and on main: kit index.js, sets/index.js, stage.js, lighting.js, camera.js, overlay.js, ch_template.js,
  scripts/finish_longform.py, scripts/stitch_longform.py, render.mjs frame skip (+ runner.html fingerprint covers face
  textures, exposure, sky, lights), proof clip.
- Measured (proof, 1920x1080, 1 sample, 2 workers): 3.0 s/rendered frame; 33% of frames skipped on the proof
  (wall 4:31 -> 3:00); copied frames identical to a no-skip render within renderer noise; two-segment encode + stitch:
  stream copy, seams frame-exact, A/V 0.000 s, -14.1 LUFS / -1.0 dBTP.
- Requests answered in production/requests.md (practicals, beam fromProp, chinLight, clearShot fix, endScreen space).
- Next: watch requests; READY once docs are complete.
