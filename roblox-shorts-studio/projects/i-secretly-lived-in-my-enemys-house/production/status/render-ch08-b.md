STATUS: WORKING
render-ch08-b (segment B of ch08, per production/briefs/render_plan.md "Helper"). Same machine as narration-tool.
- [x] machine check: `npm ci` in web/, 2 frames of ch08.js at --scale 0.3 rendered (2.3 s/frame), finish_longform.py --help OK
- [x] ch08 READY_FOR_GATE (FRAMES 1742, SPLIT 785, COMMIT 522e2ce)
- [x] first render of 785-1742 done (958 frames, 55.6% copied, 4.4 s per rendered frame)
- [x] ch08 READY_TO_RENDER (COMMIT 2f6d84f): gate fix added a face-fill light to the scene -> all frames changed, --force delete
- [ ] re-render 785-1742 --resume (started 14:2xZ), then encode delivery/chapters/ch08_b.mp4
