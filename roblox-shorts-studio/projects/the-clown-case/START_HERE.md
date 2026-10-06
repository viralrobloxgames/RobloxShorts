# Detective Max Sniffwell: The Clown Case: resume notes

Standalone case of the Super Nose Detective series (cases 1-2: `projects/the-super-nose-detective`,
`projects/super-nose-case-2`). Web route, `detective_noir` narration. Story, beats and what was taken from the
original's Election Case: `source/story.md`. Script: `script.txt` (158 words, ~63 s).

## Done
- Script v1 approved 2026-10-05 ("approved, make the video").
- Narration take-01 (`scripts/qwen_cloud_clone.py --voice detective_noir`, tightened): 60.3 s, speech ends 59.9 s;
  transcript matches the script (whisper writes "10 000" / "chalk" / "viralrobloxgames", fixed in `source/fix_captions.py`).
  Then `source/beats.py` -> `web/beats.js`, `source/lipsync.py` -> `web/lipsync.js`, `source/sound_cues.py` ->
  `source/sound_cues.json` (library SFX, Case 1's sniff, a till bell, clown honks). Music: Case 1's funk bed. 61.0 s + cover.
- Outfits: `source/make_outfits.py` -> `web/outfits/` (Giggles on Leo's rig, the wife on Mia's, Big Scoop and the crew on
  the Noob). Sets and props in `web/kit.js`; Case 1's nose, sunglasses and convertible; the lock-up from Case 2.
- Scene `web/clown_clip.js` (20 shots, word-anchored). Every shot previewed and re-framed: faces visible, no blocked or
  empty frames (the putt, the offer, the till scene, the scuffle, the rally and the coda all got new cameras).
- Hold check `web/hold_check.js` (photo, putter in both hands, ransom note, note at the nose, the thrown sundae, the
  spoon): all in the hand. `web/lib/holdcheck.js` entries can now carry their own camera ({ dist, side, up }).
- Cover `web/cover_clip.js` -> `delivery/The_Clown_Case_cover.png/.jpg` (Giggles surprised, Max's nose bottom right,
  the lock-up; 3:4 band checked). `delivery/post.json` written.
- Fit check: 0 pairs, reviewed.

- Full render (1830 frames) and encode 2026-10-06: `delivery/The_Clown_Case.mp4`, 61.5 s (61.0 s + the cover as the last
  0.5 s), 1080x1920, captions burned in; blank-frame scan clean; -16.8 LUFS. The title card sits below the caption band
  (y 1490). `delivery/The_Clown_Case_post.md` written.
- First render was lost to a fingerprint bug (`web/runner.html` frameState read the sun's shadow camera before three.js
  had placed it); fixed, and `web/changed_frames.mjs --delete` now refuses to delete every frame without --force.
  Known: ~27 frames (the drive, a few at 0.1 s) still fingerprint differently with no edit; harmless (they'd just re-render).

## Next
- Awaiting the user's review. Fixes: edit `web/clown_clip.js`, refresh the fit check, then
  `web/changed_frames.mjs --delete` + `render.mjs --resume` (only the changed frames), then `finish.py --encode`.
- After approval: post TikTok first, then YouTube, via the user's local Claude (references/scheduling-workflow.md;
  TikTok AI label OFF).
