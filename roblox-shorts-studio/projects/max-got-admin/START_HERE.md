# Max Got Admin For One Round (Part 2): resume notes

Part 2 of the series in `ideas/series/admin-for-one-round.md`. 67.5 s (2,025 frames) TikTok / YouTube Short. Web route,
Roblox R6 pack and animations, George narration, call to action at the end.

## Done
- Script approved; narration take-01 (852 ElevenLabs characters), word timings in `audio/alignment/`.
- Scene `web/max_clip.js`: 29 shots, ADMIN countdown HUD (60 s to 0 at 53.25 s, one second before Max presses enter),
  "COMMAND ONE..FIVE" cards, typed chat commands, payoff words, the letter-by-letter ban, "PART 3 IS COMING" end card.
- Sound cues `source/sound_cues.json`; mix -16 LUFS / -1.5 dBTP; captions `delivery/*.ass|srt`.
- Fit check: crowns on Max and Leo (Leo hairLift 0.16) passed and reviewed.
- Cover `delivery/Max_Got_Admin_For_One_Round_cover.jpg|png` (`web/cover_clip.js`).
- Posting metadata `delivery/post.json` (TikTok caption with 5 hashtags, YouTube title/description/tags).

## Next
- Full render to `renders/web`, encode, review, hand-off. Post after the user approves (`scripts/publish.py`).

## Re-render / re-encode
```
cd roblox-shorts-studio
node web/fit_check.mjs --clip projects/max-got-admin/web/max_clip.js        # review the sheet, then --reviewed
node web/render.mjs --clip projects/max-got-admin/web/max_clip.js --out projects/max-got-admin/renders/web --workers 2 --resume
python3 scripts/finish.py projects/max-got-admin --encode --frames projects/max-got-admin/renders/web
node web/render.mjs --clip projects/max-got-admin/web/cover_clip.js --out /tmp/cover --frames 1 --samples 6 --skip-fit-check
```
