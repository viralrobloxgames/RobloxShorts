STATUS: DONE
FRAMES: 2204
SPLIT: 993
COMMIT: d5ca3f4c
render-ch07-b: delivery/chapters/ch07_b.mp4 = frames 993-2204 (1212 frames, 1920x1080 30 fps, decodes with 1212 frames), 18 captions, 11.6 MB.
- First render (from READY_FOR_GATE 96ddb91) stopped at 482 frames; the gate fix moved the tea seats, so all of B changed -> deleted (--force) and re-rendered from 1f3787d: 1212 frames, 114 copied by frame skip, 4.9 s per rendered frame on 4 workers (~45 min).
- After the render, changed_frames showed only 1-992 (segment A, not on this machine) as changed: B is in sync with 1f3787d.
- 3 stills checked (t=2, 18, 39 s): framing, captions and props OK.
- Encode: finish_longform.py ran with no extra installs (~3 min).
- renders/ch07 (B frames + frame_hashes.json) kept on this machine for final-review fixes ("re-sync ch07 B to <sha>").
- review-2 fix (ch07 d5ca3f4c): re-rendered 1050-1140,1665-2204 (631 frames), ch07_b.mp4 re-encoded: 1212 frames, 18 captions, 11.5 MB; 3 stills OK
