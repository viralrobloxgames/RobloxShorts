STATUS: RENDERING
Role: render-ch07-b (segment B of ch07), per production/briefs/render_plan.md "Helper".
- [x] machine check: npm ci ok, render.mjs 2 frames of ch07.js at --scale 0.3 ok (4.8 s/frame), finish_longform.py --help ok, ffmpeg present
- [x] ch07 READY_FOR_GATE (FRAMES 2204, SPLIT 993, COMMIT 96ddb91): rendering 993-2204 into renders/ch07 (4 workers)
- [ ] wait for READY_TO_RENDER, sync (changed_frames --delete, --resume), encode ch07_b.mp4
