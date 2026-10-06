STATUS: WORKING

**Template ready:** `web/ch_template.js` (copy to `web/chNN.js`) runs end to end on whatever sets exist (box rooms
until then). Kit API in `web/kit/README.md`: stage.js, lighting.js, camera.js, overlay.js are on main.
- Done: index.js, sets/index.js (tolerates missing sets), stage.js, lighting.js (8 presets + practicals), camera.js
  (camOn / twoShot / overShoulder, 180 line, no camera inside geometry or actors), overlay.js (dayCard, timeStamp,
  redCircle, endScreen), ch_template.js. runner.html: overlay fingerprint canvas sized to the clip (16:9).
- Measured: template preview at 0.5 scale, 1 sample: ~1.7-3 s/frame (cloud, 1 worker).
- Next: scripts/finish_longform.py, scripts/stitch_longform.py, 3 s proof, frame-skip in render.mjs.
