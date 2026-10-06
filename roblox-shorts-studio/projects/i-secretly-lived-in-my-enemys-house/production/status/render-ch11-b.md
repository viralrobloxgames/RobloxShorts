STATUS: DONE
FRAMES: 2095
SPLIT: 944
COMMIT: 3e6f232
render-ch11-b: delivery/chapters/ch11_b.mp4 (+ .json, .ass) re-encoded for review-2 (ch11 3e6f232): frames 944-2095, 1152 frames, 1920x1080, 17 captions, sha256 d9c9f78bef10b3ce93e732f69cc75cea8e2f1fdfd1a583046ae593bdd3394857. Decodes cleanly with 1152 frames.
- Re-rendered 1270-1330 and 1555-1760 at full quality, no --resume, as ch11 asked. Fingerprinting the old (78db3a9) and new ch11.js under the same runner showed changes only in 1275-1326 and 1563-1726, both covered.
- Stills checked: f1295 Lily single ("THE FRIDGE SAYS YES"; a big tan forearm still fills the right third next to the teddy), f1700 Skye/Max two-shot with the plate ("HE SPENT IT MAKING ME SANDWICHES"), f1740 the wide + subscribe end screen.
- Frames kept in renders/ch11 (944-2095) on this machine. Note: frame_hashes.json there predates runner.html 0b822646, so changed_frames against it flags unchanged frames; next fix: send explicit ranges, or I re-fingerprint.
