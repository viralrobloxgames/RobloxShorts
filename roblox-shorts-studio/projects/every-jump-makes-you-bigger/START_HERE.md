# Every Jump Makes You Bigger (Part 1): resume notes

Part 1 of the new series in `ideas/series/every-x-makes-you-y.md` (not the admin series). Leo and Max race through an
obby where every jump makes you bigger. Web route, Roblox R6 pack, George voice C narration (Qwen3-TTS 1.7B, cloud
take-01, 65.0 s, checked), call to action at the end. 65.3 s (1,960 frames).

## Done
- Script approved 2026-10-02; narration take-01 (every line checked; Whisper's "50" for "fifty" is fine).
- Scene `web/jump_clip.js`: the rule `SIZE(j)` (first jump doubles you, then `2 j^0.42`), jump schedules with discrete
  hops and x10 fast-forward montages, Roblox leaderstats (Stage / Size), round timer, breakable finish slab (cracks at
  99, breaks at 100), tiny trophy room with glass front and roof, Checkpoint 20 lit when Leo sits (plants the twist),
  respawn there. Beats anchored to narration words via `source/beats.py`; SFX from `source/sound_cues.py` (mirrors the
  clip's `B` block - change both together).
- No accessories, so the fit check has 0 pairs (passed, reviewed).
- `delivery/Every_Jump_Makes_You_Bigger.mp4` (1080x1920, 65.3 s, 1,960 frames, validated).
- Cover `delivery/Every_Jump_Makes_You_Bigger_cover.{png,jpg}` (3:4-safe), `delivery/post.json`.

## Next
- Post after the user approves the MP4 (TikTok, then YouTube; story slot 22:30 UK).

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/every-jump-makes-you-bigger/source/beats.py && python3 projects/every-jump-makes-you-bigger/source/sound_cues.py
python3 scripts/finish.py projects/every-jump-makes-you-bigger
node web/fit_check.mjs --clip projects/every-jump-makes-you-bigger/web/jump_clip.js && node web/fit_check.mjs --clip projects/every-jump-makes-you-bigger/web/jump_clip.js --reviewed
node web/render.mjs --clip projects/every-jump-makes-you-bigger/web/jump_clip.js --out projects/every-jump-makes-you-bigger/renders/web --workers 3 --resume
python3 scripts/finish.py projects/every-jump-makes-you-bigger --encode --frames projects/every-jump-makes-you-bigger/renders/web
node web/render.mjs --clip projects/every-jump-makes-you-bigger/web/cover_clip.js --out /tmp/cover --frames 1   # cover
```
