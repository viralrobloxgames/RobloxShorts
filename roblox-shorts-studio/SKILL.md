---
name: roblox-shorts-studio
description: Make original Roblox-style block-character comedy Shorts (TikTok / YouTube Shorts) end to end - idea, script, ElevenLabs narration, measured word timings, Blender scene authoring with the Max/Mia/Leo rig, GarageFarm rendering, sound design, word-highlight captions, final MP4 and optional publishing. Use for any request to create, continue, finish or fix a Roblox short in this repo.
---

# Roblox Shorts Studio

Everything needed to make a Roblox-style Short lives in this folder. Paths below are relative to it. The characters are original block-style meshes with classic Roblox proportions, not official Roblox avatars. Native Roblox Studio scenes are a separate workflow.

## Hard rules

- **No local 3D rendering.** The laptop can't handle it. All picture rendering happens on **GarageFarm** in the user's signed-in Brave browser. Local work is limited to scene building (background Blender, no render), numeric checks, audio, captions and ffmpeg encoding.
- **Budget:** ask for a spending cap for each new short before its first farm job. Stay within it, and never top up credit. Record costs in `source/garagefarm_job.json`.
- **Narration costs credits.** Save the script and get it approved before generating. Never regenerate a take that already exists. Recover it from ElevenLabs History instead.
- **Downloads:** the user has pre-approved downloading their own generated outputs (ElevenLabs narration, GarageFarm frames) for the current short.
- **Publishing** needs an explicit request with the destination and visibility. The default deliverable is a local review MP4.
- **Frame 1 shows the central action.** No title cards or slow approaches. It must read on mute within 1–2 s.

## Workflow

Full detail is in [references/workflow.md](references/workflow.md). The short version:

1. **Idea:** add it to `ideas/idea-ledger.json`. Choose a Roblox-game situation with a visible cause, reaction and payoff (e.g. disaster survival, obby, tycoon, simulator, AFK, lag, admin commands).
2. **Scaffold:** `python scripts/studio.py new --out projects/<slug> --title "<Title>" --character Max|Mia|Leo --seconds 30`.
3. **Story and script:** write the beats in `source/story.md` (the hook first) and the narration in `script.txt`. Get approval.
4. **Narration:** use the saved George voice (see [voice-and-audio](references/voice-and-audio.md)). Save `audio/narration.mp3` plus `audio/narration-source.json`.
5. **Timings:** run `python scripts/studio.py transcribe projects/<slug>`, or use `voice.py` in API mode. Check the words against the script. Set `seconds` in `source/project.json` to the measured speech end plus about 0.5 s. **TikTok Creator Rewards needs more than 60 s.**
6. **Shots:** write `source/shots.json` from the measured timings. Change shot every 2–3 s.
7. **Scene:** author `source/build_scene.py` using [references/authoring.md](references/authoring.md). Bake all motion to keyframes (no simulations, no auto-run scripts), pack everything, and save `<Title>_GarageFarm.blend`. Run `python scripts/studio.py build projects/<slug>`. Record numeric framing checks for the test frames in `source/farm_manifest.json`.
8. **Farm render:** follow [references/garagefarm.md](references/garagefarm.md). Run a test job, review a contact sheet, run the full range within the cap, then download the PNGs to `renders/farm/`.
9. **Sound and captions:** write `source/sound_cues.json` and optional `source/overlays.json` (HUD, title pops). Run `python scripts/studio.py finish projects/<slug>`. Caption styles are in [references/captions.md](references/captions.md).
10. **Encode:** run `python scripts/studio.py finish projects/<slug> --encode`. It checks for frame gaps and duplicates, burns the captions, verifies the MP4 decodes, and writes `delivery/<Title>.validation.json`.
11. **Review:** watch the whole thing and check a contact sheet (`scripts/review/contact_sheet.py`). Look for clipping, floating, expression timing, prop contact and caption readability.
12. **Publish (only on request):** see [references/publishing.md](references/publishing.md).

Keep `START_HERE.md` in each project updated with what is done, what is next, and the job and budget state, so any session can resume.

## Web route (no Blender)

`web/` renders scenes with three.js in headless Chromium, with the same Max/Mia/Leo cast, so a short can be made with no Blender and no farm (for example in a cloud session). Author `projects/<slug>/web/<clip>.js`, preview frames at half size, render with `node web/render.mjs`, then finish with `scripts/finish.py --encode --frames <renders/web>`. See [web/README.md](web/README.md). For a clip with no narration yet, set `"finish": {"narration": false}`.

## Tools and settings

`scripts/settings.py` merges `~/.roblox-shorts-studio/settings.json`, `tools.local.json` and older kit settings, then falls back to PATH. See `config/settings.example.json`. Blender 5.2.1 is tested. Run the Python helpers with Blender's bundled Python (it has numpy). Word timings need faster-whisper, set as `transcription_python`.

## Worked examples

- `examples/the-free-coin-trap/`: a 21.7 s, 8-shot, finished short with the MP4 in `delivery/`. Farm cost was $2.76 for 651 frames.
- `examples/the-afk-champion/`: a 64.5 s TikTok (>60 s) short with 5 disaster rounds, a HUD overlay, spliced narration inserts (`assemble_narration.py`) and a multi-module scene (`afk_*.py`).
- `demo/`: an 8 s motion test of walk, wave, shock and recover (`Meet_Max.mp4`).

These are for learning structure. Write new ideas rather than reskinning them.
