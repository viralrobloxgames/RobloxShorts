# Feeding the Prism Kitsune (standalone promo for Hunt For Eggs!): resume notes

A promo for the user's own game **Hunt For Eggs!** about its Prism Kitsune event (ends **Fri 9 Oct 2026 10:20 UK**; the
script says "leaves this Friday", so it must be posted by Thu 8 Oct). Web route, George voice C, Leo / Max / Mia.
Story, event rules and beats: `source/story.md`. Standalone: no part tags anywhere.

## Done
- Script approved 2026-10-05 (158 words, unchanged; last line "Play Hunt for Eggs today. Link in bio!").
- Narration take-01: `scripts/qwen_cloud_george_c.py` (cloud CPU, 1.7B) + `scripts/narrate.py --voice george_c`: 61.8 s,
  speech ends 61.52 s. Line 1 regenerated once; Whisper still hears "sky in Hunt" as "and" (borderline, ~50/50 when
  prompted): listen to it. `source/fix_captions.py` fixes that word and the capitals (run after any re-transcribe, before beats.py).
- Scene `web/kitsune_clip.js` (beats from `source/beats.py` -> `web/beats.js`). Cover `web/cover_clip.js`.
  The Kitsune is one skinned mesh in rest pose, animated whole (drop, squash, gulp bob, hop, slide-walk); its greyscale
  texture gets a cyan-violet vertex tint. Prism beasts / Alpha = pack T-rex + 4 neon crystals on the torso.
  The Prism Chest is props/gift_chest split at y 2.9 into body + lid and repainted.

## Next
- Per-shot previews to the user, then fit check, full render, SFX (`source/sound_cues.py`), finish + encode, post.json.
- Post only after the user approves the MP4 (TikTok, then YouTube).
