STATUS: RENDERING
render-ch09-b (helper, segment B of ch09 per production/briefs/render_plan.md "Helper")
- [x] machine check: npm ci done, render.mjs test frames 1,60 OK (scale 0.3), ffmpeg libass+libx264, Pillow, LuckiestGuy font present; finish_longform.py --help OK
- [x] ch09 READY_FOR_GATE seen (FRAMES 1792, SPLIT 807, COMMIT 8344a30); first render got 807-966 before the gate passed
- [x] ch09 READY_TO_RENDER seen (FRAMES 1792, SPLIT 807, COMMIT 5705206); changed_frames: all frames changed, because
      kit lighting.js `attic_afternoon` changed (stage sun off, attic's own lights) and ch09 is all attic -> --delete --force
- [ ] synced render segment B 807-1792 (--workers 4 --resume), ~6.3 s/frame -> ~1.5 h
- [ ] encode delivery/chapters/ch09_b.mp4, check 986 frames + 3 stills
