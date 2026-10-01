# The AFK Millionaire: resume notes

63.2 s TikTok / YouTube Short (over 60 s). Web route with the Roblox R6 pack and its Roblox animations. George narration.

## Done
- Script approved; narration take-01 (854 ElevenLabs characters; 5,035 of 10,000 used this month after it).
- Word timings from the ElevenLabs request (`audio/alignment/`).
- Scene `web/afk_clip.js`: 35 shots. Hook = slow-motion replay of the rocket flight with "HE WASN'T EVEN PLAYING",
  rewind, then real time. Players-left HUD, chat (the "brb" in frame 1 pays off at the end), AFK tag, comic hits.
- Sound cues `source/sound_cues.json`; mix -16 LUFS / -1.5 dBTP.
- Fit check: no worn accessories (handheld sword and launcher checked in the shot previews); passed, reviewed.
- **Delivered:** `delivery/The_AFK_Millionaire.mp4` (1080x1920, 30 fps, 1,896 frames) and
  `delivery/The_AFK_Millionaire_cover.jpg|png` (made by `web/cover_clip.js`).

## Re-cut (repost)
- First post: ~70% of viewers left by 0:06 (abstract tumbling-flight hook, rewind, quick name cards); after 0:06 the
  retention line stayed almost flat, so only the opening changed.
- New opening: 0-4.35 s the AFK noob in the circle in the coin rain, losers furious behind, title; 4.35-6.36 s one
  line-up shot with name tags. Frames 1-191 re-rendered; first version kept as `delivery/The_AFK_Millionaire_v1.mp4`.

## Re-render / re-encode
```
cd roblox-shorts-studio
node web/fit_check.mjs --clip projects/the-afk-millionaire/web/afk_clip.js        # review, then --reviewed
node web/render.mjs --clip projects/the-afk-millionaire/web/afk_clip.js --out projects/the-afk-millionaire/renders/web --workers 2 --resume
python scripts/finish.py projects/the-afk-millionaire --encode --frames projects/the-afk-millionaire/renders/web
node web/render.mjs --clip projects/the-afk-millionaire/web/cover_clip.js --out /tmp/cover --frames 1 --skip-fit-check   # cover still
```
