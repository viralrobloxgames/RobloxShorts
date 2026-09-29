# The Sixty Second Admin: start here

Status: **script_draft_awaiting_approval**

Done
- Project scaffolded; `source/story.md` beats and `script.txt` draft (~160 words, target 62-66 s) written.
- 10 s quality test of the "command one: speed" beat with the Blender-free web renderer (`web/README.md` in the studio):
  scene `web/speed_clip.js`, finish project `web/speed_test/` (music + SFX, no narration), MP4 in `web/speed_test/delivery/`.
  Re-render: `node web/render.mjs --clip projects/the-sixty-second-admin/web/speed_clip.js --out projects/the-sixty-second-admin/renders/web --workers 3`
  then `python scripts/finish.py projects/the-sixty-second-admin/web/speed_test --encode --frames projects/the-sixty-second-admin/renders/web`.

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
