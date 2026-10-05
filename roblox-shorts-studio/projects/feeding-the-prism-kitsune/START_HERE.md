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

- User approved the per-shot previews 2026-10-05 ("carry on with the render").
- Full render (1,864 frames, web route), SFX `source/sound_cues.py` (203 cues, mirrors the clip's `B` block), captions,
  encode: `delivery/Feeding_the_Prism_Kitsune.mp4` (1080x1920, 62.63 s incl. the 0.5 s cover tail, 1,879 frames,
  -17.2 LUFS, validated), cover `delivery/Feeding_the_Prism_Kitsune_cover.{png,jpg}`, `delivery/post.json`,
  `delivery/Feeding_the_Prism_Kitsune_post.md`.

## Next
- **Awaiting the user's approval of the MP4.** Then post TikTok first, then YouTube, before the event ends
  (deadline: post by Thu 8 Oct; "leaves this Friday" is wrong from Fri 9 Oct). Follow references/publishing.md.

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/feeding-the-prism-kitsune/source/fix_captions.py && python3 projects/feeding-the-prism-kitsune/source/beats.py && python3 projects/feeding-the-prism-kitsune/source/sound_cues.py
python3 scripts/finish.py projects/feeding-the-prism-kitsune
node web/fit_check.mjs --clip projects/feeding-the-prism-kitsune/web/kitsune_clip.js && node web/fit_check.mjs --clip projects/feeding-the-prism-kitsune/web/kitsune_clip.js --reviewed
node web/render.mjs --clip projects/feeding-the-prism-kitsune/web/kitsune_clip.js --out projects/feeding-the-prism-kitsune/renders/web --workers 3 --resume
python3 scripts/finish.py projects/feeding-the-prism-kitsune --encode --frames projects/feeding-the-prism-kitsune/renders/web
node web/render.mjs --clip projects/feeding-the-prism-kitsune/web/cover_clip.js --out projects/feeding-the-prism-kitsune/renders/cover --frames 1
```
