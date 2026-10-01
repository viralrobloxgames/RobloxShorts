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

- Revision after review: Leo turns side-on and squeezes out through a one-bar gap in the cage; arm gestures from
  `web/lib/gestures.js` replace the pack's celebrate/panic/wave (arms went through heads); "1 ROUND = 1 MINUTE" label,
  "1 round = 60 seconds." chat line and the clock shown as 1:00; tiny Leo is now a jump-stomp (leap, slam, splat, poof),
  framed with Leo below the caption line. Changed frames re-rendered; cover has Leo hands on hips.
- **Delivered:** `delivery/Max_Got_Admin_For_One_Round.mp4` (1080x1920, 30 fps, 2,025 frames, 26 MB).

## Next
- Post after the user approves it: `python3 scripts/publish.py projects/max-got-admin --approve`, then `--post`
  (TikTok, then YouTube). Needs the one-time account setup in `references/publishing.md`.
- After 24 h, add its TikTok results to `ideas/series/admin-for-one-round.md` and decide on Part 3.

## Re-render / re-encode
```
cd roblox-shorts-studio
node web/fit_check.mjs --clip projects/max-got-admin/web/max_clip.js        # review the sheet, then --reviewed
node web/render.mjs --clip projects/max-got-admin/web/max_clip.js --out projects/max-got-admin/renders/web --workers 2 --resume
python3 scripts/finish.py projects/max-got-admin --encode --frames projects/max-got-admin/renders/web
node web/render.mjs --clip projects/max-got-admin/web/cover_clip.js --out /tmp/cover --frames 1 --samples 6 --skip-fit-check
```
