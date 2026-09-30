# Admin For One Round: resume notes

About 64 s TikTok / YouTube Short (must stay over 60 s). Leo, Max and Mia on an obby map. George narration.

## Done
- Project folder created with `studio.py new`.
- `source/story.md`: 10 beats, hook on frame 1.
- `script.txt`: draft narration, 152 words / 846 characters. **Waiting for approval.**

## Next
1. Get the script approved (edit `script.txt` if needed).
2. Generate the narration once with `python scripts/voice.py generate projects/admin-for-one-round`
   (about 850 ElevenLabs characters). Never regenerate a take that exists.
3. Check the measured length is over 60 s; set `seconds` in `source/project.json`.
4. Write `source/shots.json` and `source/build_scene.py`; build the `.blend` with Blender (no local render).
5. Agree a GarageFarm spending cap, run a test job, then the full render.
6. Sound cues, captions, encode with `studio.py finish --encode`.

## Budget
- ElevenLabs: free tier, about 6,660 characters left this month at the start of this project.
- GarageFarm: no cap agreed yet. No jobs run.
