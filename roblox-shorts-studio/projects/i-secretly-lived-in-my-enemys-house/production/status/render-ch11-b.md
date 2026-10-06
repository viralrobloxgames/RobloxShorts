STATUS: RENDERING
render-ch11-b: ch11 segment B = frames 944-2095 (FRAMES 2095, SPLIT 944), synced to ch11 COMMIT 78db3a9 (GATE: PASS).
- First pass (from 6ac38c4) got to 548/1152, then stopped at READY_TO_RENDER. changed_frames reported all 2095 frames changed because the gate fix adds a `pan` prop to setup(), so every frame has a new mesh; kit unchanged. Used --force, so all of B renders again with --resume, 4 workers.
- Next: encode delivery/chapters/ch11_b.mp4 (--range 944-2095), check 1152 frames, 3 stills, DONE.
