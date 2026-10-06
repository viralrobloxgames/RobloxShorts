STATUS: RENDERING
FRAMES: 2095
SPLIT: 944
COMMIT: 3e6f232
render-ch11-b: review-2 fix (ch11 3e6f232): re-rendering ch11 frames 1270-1330 and 1555-1760 as ch11 asked, then re-encoding delivery/chapters/ch11_b.mp4 (944-2095).
- Checked: fingerprinting the old (78db3a9) and new ch11.js under the same runner shows changes only in 1275-1326 and 1563-1726, both inside the requested ranges. changed_frames against the stored hashes flags 944 and 1232-2095 only because runner.html's fingerprint changed (0b822646), so it was not used here.
- Previous delivery: ch11_b.mp4 from 78db3a9 (1152 frames).
