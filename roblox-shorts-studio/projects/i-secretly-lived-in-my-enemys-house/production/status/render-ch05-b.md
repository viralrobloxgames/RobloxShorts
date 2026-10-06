STATUS: DONE
render-ch05-b (gate-a session): delivery/chapters/ch05_b.mp4 (+ .json) = ch05 frames 910-2019 at COMMIT bc038bc (GATE: PASS).
- First render 910-2019 from ba2fd86 (1110 frames, 75% copied, 1.15 s/frame overall). ch05 said only 1965-2019 changed at
  bc038bc (pose only): those 55 PNGs were deleted and re-rendered with --resume. Nothing else in ch05.js/kit/lib/narration changed.
- Check: ffprobe decodes 1110 frames, 1920x1080 30 fps, 7.8 MB, 20 captions. Stills at 1 s / 18 s / 36.9 s look right (captions in
  speaker colours; last shot has Lily's mouth clear of her pouring arm).
- Frames kept in renders/ch05 for final-review fixes. Fingerprints saved with the fixed changed_frames.mjs before the fix.
