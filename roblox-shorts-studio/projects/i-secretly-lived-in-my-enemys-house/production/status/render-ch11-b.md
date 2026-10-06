STATUS: DONE
FRAMES: 2095
SPLIT: 944
COMMIT: 78db3a9
render-ch11-b: delivery/chapters/ch11_b.mp4 (+ .json, .ass) = ch11 frames 944-2095, 1152 frames, 38.4 s, 1920x1080 h264, 17 captions, sha256 b33c5196...0449e0. Decodes cleanly with 1152 frames; stills at 3/17/34 s checked (Skye on phone + caption, Dad "PANCAKES FOR EVERYONE" + caption, closing wide with subscribe end screen).
- Rendered from ch11 78db3a9 (GATE: PASS). The first pass from 6ac38c4 was dropped: the gate fix adds a `pan` prop to setup(), so every frame changed (changed_frames --force, all of B rendered again; 263/1152 frames copied by the frame skip).
- Frames kept in renders/ch11 (944-2095 + frame_hashes.json) on this machine for final-review fixes ("re-sync ch11 B to <sha>").
- Nothing extra installed (web npm ci only).
