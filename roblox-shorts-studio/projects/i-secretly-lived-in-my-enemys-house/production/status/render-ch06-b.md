STATUS: DONE

render-ch06-b (session of kit-sets-c): machine checked (ch06 renders, 2.7 s/frame at scale 0.3; finish_longform.py runs). Waiting for ch06 READY_FOR_GATE + FRAMES/SPLIT, then segment B -> delivery/chapters/ch06_b.mp4.
- 14:09 UTC: segment B frames 781-1733 (ch06 at 55f7d0b) rendering, workers 4; waiting for READY_TO_RENDER to re-sync.
- 14:37 UTC: ch06 READY_TO_RENDER at 95f831f (ch06.js changed at the gate); segment B 781-1733 re-rendering from scratch (~70 min at ~4.4 s/frame).
- 18:20 UTC: DONE. delivery/chapters/ch06_b.mp4 = frames 781-1733 of ch06 at 95f831f (changed_frames: only 1-780 differ, i.e. segment A), 953 frames decoded, 1920x1080 30 fps, 20 captions, 11.2 MB; 3 stills checked. 3.86 s/frame (75 of 953 copied). Frames kept in scratch for re-syncs.
- 18:56 UTC: review-1 #1 re-sync to e898db1: frames 1345-1370 re-rendered (changed_frames: only 1347-1367 in B), ch06_b.mp4 re-encoded, 953 frames, stills of the new linen-closet shot checked. DONE.
- 04:48 UTC: full re-render of segment B (781-1733) at 3868841b requested by ch06 (plausibility pass); old frames deleted; render + encode running.
- 04:55 UTC: per orchestrator, re-render stopped (final-ch06-b renders the final B); nothing pushed to delivery. Standing down.
