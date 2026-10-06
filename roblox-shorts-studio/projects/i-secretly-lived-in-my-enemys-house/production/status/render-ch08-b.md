STATUS: WORKING
render-ch08-b (segment B of ch08, per production/briefs/render_plan.md "Helper"). Same machine as narration-tool.
- [x] machine check: `npm ci` in web/, 2 frames of ch08.js at --scale 0.3 rendered (2.3 s/frame), finish_longform.py --help OK
- [x] ch08 READY_FOR_GATE (FRAMES 1742, SPLIT 785, COMMIT 522e2ce)
- [ ] rendering frames 785-1742 into renders/ch08 (4 workers, started 13:5xZ); then wait for READY_TO_RENDER, sync, encode ch08_b.mp4
