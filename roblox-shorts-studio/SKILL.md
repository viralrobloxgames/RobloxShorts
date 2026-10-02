---
name: roblox-shorts-studio
description: Make original Roblox-style block-character comedy Shorts (TikTok / YouTube Shorts) end to end - idea, script, local Qwen3-TTS narration (cloned George voice), measured word timings, Blender scene authoring with the Max/Mia/Leo rig, GarageFarm rendering, sound design, word-highlight captions, final MP4 and optional publishing. Use for any request to create, continue, finish or fix a Roblox short in this repo.
---

# Roblox Shorts Studio

Everything needed to make a Roblox-style Short lives in this folder. Paths below are relative to it. The characters are original block-style meshes with classic Roblox proportions, not official Roblox avatars. Native Roblox Studio scenes are a separate workflow.

## Hard rules

- **No local 3D rendering.** The laptop can't handle it. All picture rendering happens on **GarageFarm** in the user's signed-in Brave browser. Local work is limited to scene building (background Blender, no render), numeric checks, audio, captions and ffmpeg encoding.
- **Budget:** ask for a spending cap for each new short before its first farm job. Stay within it, and never top up credit. Record costs in `source/garagefarm_job.json`.
- **Narration is local and free now.** Story narration uses Qwen3-TTS on the laptop with the cloned `george` voice (see references/voice-and-audio.md, Route L). Use one background run of `scripts/narrate.py`, which generates, joins, transcribes and checks, then prints a short report. Don't poll it or read its log. It takes about 20 min per minute of speech, so get the script approved first. ElevenLabs is only for auditioning new voices through its previews. For an old ElevenLabs take, recover it from History rather than regenerating.
- **Downloads:** the user has pre-approved downloading their own generated outputs (ElevenLabs narration, GarageFarm frames) for the current short.
- **Publishing happens only after the user approves that specific video.** The default deliverable is a review MP4 plus cover and captions; the cover follows the cover spec in references/publishing.md (1080x1920, all text inside the 3:4 grid crop). Once the user has watched it and approves it ("approved", "post it"), post it straight away: **TikTok first, then YouTube Shorts right after**, public, using `delivery/post.json` (from a Claude session on the user's computer through their signed-in browser for now; `scripts/publish.py` from the cloud once the platforms approve API posting - see references/publishing.md). Approval covers that one MP4 only; a re-cut needs a new approval. Never post anything unapproved, and never re-post something `published.json` marks as posted.
- **Frame 1 shows the central action.** No title cards or slow approaches. It must read on mute within 1–2 s.
- **Every video gets a custom cover:** `delivery/<Title>_cover.jpg` (+ `.png`), exactly **1080×1920** (9:16, same as the video), JPG under 2 MB (YouTube's thumbnail limit). TikTok's profile grid crops covers to **3:4**, so everything that matters (headline, faces, props, the PART tag) sits inside the centre band **y 240–1680**; check it on a 3:4 centre crop before delivery. Keep big text clear of faces and crowns.
- **Every video ends with a call to action:** a spoken last line and a ~2 s end card naming the account, e.g. "Follow Viral Roblox Games for part three" with **@viralrobloxgames** and "FOLLOW FOR PART N" on screen. It goes after the payoff, never before it.
- **Series:** when the first part of a format performs well (judge it on TikTok analytics after at least 24 h: average watch time and full-watch rate against the channel's other originals), continue it as a numbered series that keeps the story going: same cast, running gags, last part's ending as this part's setup, a cliffhanger into the next part. Keep `ideas/series/<series>.md` up to date (parts, what each established, results). A series that stops performing gets its last part and ends.
- **Arms never pass through heads or bodies.** Don't use the pack's `celebrate` or `panic` animations (both fold the arms over the head, so the hands sink into it), or the Roblox `wave` (it swings the arm behind the head). Use `cheerWave`, `waveArm` and `panicArms` from `web/lib/gestures.js` on top of `idle`. Check every raised-arm pose in the shot previews from the angle the camera actually sees it. A character moving through a tight space (a cage, a gap, a door) has to visibly fit: turn side-on, squeeze or duck, never pass through solid parts.
- **Accessories must fit before any full render.** Hats, hair and other accessories are placed only with `wear()` / `fitAccessory()` from `web/lib/robloxPack.js`, never with hand-typed offsets or scales. Before every full render run `node web/fit_check.mjs --clip <clip>`: every pair must PASS (nothing pokes through by more than 0.02 studs), and every view in `fit_check/fit_sheet.png` (front, three-quarter, side, back) must be looked at for hair or head showing through, floating, oversized or badly placed items. Only then mark it with `--reviewed`. `web/render.mjs` refuses a full render without a current, passing, reviewed check, and any edit to the clip or the fitting code needs a new one. Never use `--skip-fit-check` for a delivery.

## Workflow

Full detail is in [references/workflow.md](references/workflow.md). **Work in parallel:** start the narration the moment a script is approved and build the scene against estimated, word-anchored timing while it generates; while a video renders, write the next script and narrate it on the laptop (workflow.md, "Running steps in parallel"). The short version:

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
12. **Post (after the user approves):** write `delivery/post.json` with the hand-off, then on approval post it (TikTok, then YouTube) the way references/publishing.md describes. See [references/publishing.md](references/publishing.md).

Keep `START_HERE.md` in each project updated with what is done, what is next, and the job and budget state, so any session can resume.

## Web route (no Blender)

`web/` renders scenes with three.js in headless Chromium, with the same Max/Mia/Leo cast, so a short can be made with no Blender and no farm (for example in a cloud session). Author `projects/<slug>/web/<clip>.js`, preview frames at half size, render with `node web/render.mjs`, then finish with `scripts/finish.py --encode --frames <renders/web>`. See [web/README.md](web/README.md). For a clip with no narration yet, set `"finish": {"narration": false}`.

Characters, faces, accessories and map pieces come from the Roblox R6 pack (`assets/roblox_pack/`, loaded by `web/lib/robloxPack.js`). Web-route order: preview one frame per shot → **accessory fit check** (`node web/fit_check.mjs --clip <clip>`, review the sheet, `--reviewed`) → full render → finish and encode. When a new accessory or character is added to the pack, give it a rule in `ACCESSORY_FIT` and run `node web/fit_check.mjs --all` (sheet in `assets/roblox_pack/fit_check/`); every pair must pass and look right before any clip uses it.

## Tools and settings

`scripts/settings.py` merges `~/.roblox-shorts-studio/settings.json`, `tools.local.json` and older kit settings, then falls back to PATH. See `config/settings.example.json`. Blender 5.2.1 is tested. Run the Python helpers with Blender's bundled Python (it has numpy). Word timings need faster-whisper, set as `transcription_python`.

## Worked examples

- `examples/the-free-coin-trap/`: a 21.7 s, 8-shot, finished short with the MP4 in `delivery/`. Farm cost was $2.76 for 651 frames.
- `examples/the-afk-champion/`: a 64.5 s TikTok (>60 s) short with 5 disaster rounds, a HUD overlay, spliced narration inserts (`assemble_narration.py`) and a multi-module scene (`afk_*.py`).
- `demo/`: an 8 s motion test of walk, wave, shock and recover (`Meet_Max.mp4`).

These are for learning structure. Write new ideas rather than reskinning them.
