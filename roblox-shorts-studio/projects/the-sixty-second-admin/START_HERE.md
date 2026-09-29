# The Sixty Second Admin: start here

Status: **script_draft_awaiting_approval**

Done
- Project scaffolded; `source/story.md` beats and `script.txt` draft (~150 words, target 62-66 s) written.

Next
1. Approve or edit `script.txt` (no credits spent yet).
2. Generate narration with the saved George voice (~800 credits expected, based on AFK's 845).
3. `studio.py transcribe`, then set `seconds` in `source/project.json` to speech end + 0.5 s (must stay > 60 s).
4. `source/shots.json`, `source/build_scene.py`, `studio.py build` -> `The_Sixty_Second_Admin_GarageFarm.blend`.
5. GarageFarm test + full render (needs a budget cap first; AFK estimate was ~$4 for 1,935 frames).
6. `source/sound_cues.json`, `source/overlays.json` (ADMIN countdown HUD), `studio.py finish --encode`.

Budget / jobs
- GarageFarm cap: not set yet. No jobs submitted.
- ElevenLabs: nothing generated.
