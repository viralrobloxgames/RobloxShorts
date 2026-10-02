# Mia Had Two Crowns (Part 5): resume notes

Part 5 of the series in `ideas/series/admin-for-one-round.md`. 68.3 s (2,050 frames). Web route, Roblox R6 pack (+ Skye,
glam face), George voice C narration (Qwen3-TTS 1.7B, `assets/audio/voices/george_c*`), call to action at the end.

## Delivered
- Script approved; narration take-01 (68.0 s, every word checked).
- Scene `web/mia_clip.js`: only one of Mia's accounts moves at a time (`SEG` / `eff()` freeze the idle one at the moment it
  lost focus), PLAYING / FROZEN tags, ALT+TAB counter; beats anchored to narration words via `source/beats.py` (script
  alignment, so a misheard word elsewhere doesn't shift anything); SFX from `source/sound_cues.py`.
- No two-arms-up poses (user rule): celebration is `proud`, the fling is `shock`.
- Fit check: crowns on Mia, the noob, Leo and Max passed and reviewed.
- `delivery/Mia_Had_Two_Crowns.mp4`, cover (1080x1920, 3:4-safe), `post.json`.

## Next
- Post after the user approves it (one admin part per day; slot 19:00 UK weekdays / 17:00 weekends).

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/mia-had-two-crowns/source/beats.py && python3 projects/mia-had-two-crowns/source/sound_cues.py
python3 scripts/finish.py projects/mia-had-two-crowns
node web/fit_check.mjs --clip projects/mia-had-two-crowns/web/mia_clip.js        # review, then --reviewed
node web/render.mjs --clip projects/mia-had-two-crowns/web/mia_clip.js --out projects/mia-had-two-crowns/renders/web --workers 2 --resume
python3 scripts/finish.py projects/mia-had-two-crowns --encode --frames projects/mia-had-two-crowns/renders/web
```
