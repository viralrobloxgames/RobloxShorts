STATUS: READY

kit-sets-c: `web/kit/sets/kitchen.js`, `classroom.js`, `exterior.js` (+ helpers `common_c.js`) are on main and documented
in `web/kit/README.md` (section "sets/kitchen.js, classroom.js, exterior.js").
- Every request in production/requests.md addressed to kit-sets-c (ch01, ch02, ch03, ch04, ch11) is answered in the sets
  (marks/cams/states/aliases) — see the reply in requests.md.
- Previews: production/previews/kit-sets-c/sheet_1..3.jpg (55 set/cam frames with stand-ins, rendered under the kit
  lighting presets; clip set_preview.js).
- Practicals plug into K.applyLight (proxies). Kitchen: fridge_light (follows the door), ceiling_light, pantry_light, upstairs_light.
- Measured: preview at scale 0.3, 1 sample: ~1.4 s/frame with all three sets + 8 stand-ins.
Next: watching requests.md and shots/*.md for more asks; available for a render job.
- Update: sit marks follow kit-cast `seatY` (root = seatTop − 1.5); kitchen stool seat 2.2, classroom seat 1.7; walls and
  pantry slats are `noCamBlock` (setCam's clearShot never pulls a set cam inside); `setDoor()` on kitchen/exterior;
  aliases for every name ch01-ch04/ch11 code looks up (checked against web/chNN.js).
- 13:18 UTC: per orchestrator, chapter QA dropped; answering kit-sets-c requests (background watch), waiting for a render job.
