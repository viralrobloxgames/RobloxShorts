# Leo Gave Everyone Admin (Part 3): resume notes

Part 3 of the series in `ideas/series/admin-for-one-round.md`. 63.3 s (1,899 frames) TikTok / YouTube Short. Web route,
Roblox R6 pack and animations, George narration (take-01, 856 characters), call to action at the end.

## Done
- Script approved (ensemble rewrite after feedback that the first draft was just Leo vs Max).
- Scene `web/leo_clip.js`: 34 shots. HUD LEO ADMIN -> ALL ADMIN -> MIA ADMIN -> ROUND OVER -> NOOB ADMIN ?:??;
  the ":admin all" typo; Roblox-style explosion (parts fly apart); invisible Leo (hair + crown only); giant Max;
  rocket to space; "Mia is typing..." running gag and her long command; giant lands on the hair; forced dance2 in
  sync (7.4 apart so arms never meet); the AFK noob still has admin; end card "PART 4: THE NOOB HAS ADMIN".
- Arms: gestures.js panic, dance2 only (dance1/dance3 bring arms across the hair).
- Fit check: crowns on Leo, Max, Mia and the noob passed and reviewed.
- Sound cues, mix -16 LUFS; captions. Cover `delivery/*_cover.jpg|png` (1080x1920, checked on a 3:4 crop).
- `delivery/post.json` with the TikTok caption and YouTube metadata.
- **Delivered:** `delivery/Leo_Gave_Everyone_Admin.mp4` (1080x1920, 30 fps, 1,899 frames).

## Next
- Post after the user approves it (references/publishing.md). After 24 h, add its results to the series file.

## Re-render / re-encode
```
cd roblox-shorts-studio
node web/fit_check.mjs --clip projects/leo-gave-everyone-admin/web/leo_clip.js        # review the sheet, then --reviewed
node web/render.mjs --clip projects/leo-gave-everyone-admin/web/leo_clip.js --out projects/leo-gave-everyone-admin/renders/web --workers 2 --resume
python3 scripts/finish.py projects/leo-gave-everyone-admin --encode --frames projects/leo-gave-everyone-admin/renders/web
node web/render.mjs --clip projects/leo-gave-everyone-admin/web/cover_clip.js --out /tmp/cover --frames 1 --samples 6 --skip-fit-check
```
