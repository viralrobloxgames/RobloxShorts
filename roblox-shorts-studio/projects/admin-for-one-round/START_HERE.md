# Admin For One Round: resume notes

63.8 s TikTok / YouTube Short (over 60 s for Creator Rewards). Leo, Max, Mia and a noob on an obby map. George narration.
Made entirely with the web renderer (`web/`), no Blender and no render farm.

## Done
- `script.txt` approved. Narration `audio/narration.mp3` (take-01, 845 ElevenLabs characters; recovered from
  ElevenLabs History after the session was interrupted mid-request, not regenerated).
- Word timings in `audio/alignment/` (faster-whisper `small.en`).
- Scene: `web/admin_clip.js` (27 named shots, all timings from the measured narration).
- Sound: `source/sound_cues.json`. Mix: -16 LUFS, -1.5 dBTP.
- **Delivered:** `delivery/Admin_For_One_Round.mp4` (1080x1920, 30 fps, 1,914 frames, burned word captions).

## Re-render / re-encode
```
cd roblox-shorts-studio
node web/render.mjs --clip projects/admin-for-one-round/web/admin_clip.js --out projects/admin-for-one-round/renders/web --workers 2 --resume
python scripts/finish.py projects/admin-for-one-round --encode --frames projects/admin-for-one-round/renders/web
```
Full quality took about 2.3 h in a 4-CPU cloud session (software WebGL). `--resume` skips frames already written.
Preview single frames first with `--frames a,b,c --scale 0.3 --samples 1`.

## Budget
- ElevenLabs: 845 characters used (3,336 -> 4,181 of 10,000 this month).
- GarageFarm: not used.

## Next
- Watch the MP4. Publishing only on request.
