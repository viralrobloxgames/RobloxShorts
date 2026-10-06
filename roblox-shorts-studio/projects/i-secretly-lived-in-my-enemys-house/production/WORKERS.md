# Workers: read this first (every session on the long-form video)

You are one of ~20 cloud sessions making **"I Secretly Lived In My Enemy's House For A Week"** in parallel (the
project folder is `roblox-shorts-studio/projects/i-secretly-lived-in-my-enemys-house/`). The user approved the whole
video end to end (2026-10-06): no approval stops, never post anything, don't stop until your part is done. Speed
matters (target: the whole video finished about 5 hours after setup started), but every rule in `roblox-shorts-studio/SKILL.md`
still applies except the Shorts-only ones (61-65 s, 9:16, covers, TikTok).

Read: `../START_HERE.md` (the plan), `../source/story.md`, `../source/boundary_sheet.md` (the contract between chapters),
`../script.txt`, `KIT_SPEC.md`, `NARRATION_SPEC.md`, and the web route notes in `roblox-shorts-studio/web/README.md`.
Recent web-route clips to learn the house style from: `projects/she-raced-around-the-world/web/race_clip.js`,
`projects/he-flew-a-lawn-chair/web/chair_clip.js` (Shorts, 9:16; the long-form is 1920x1080).

## Roles (status file = `production/status/<role>.md`)
| Role | Job |
|---|---|
| `kit-pipeline` | `web/kit/index.js`, `stage.js`, `lighting.js`, `camera.js`, `overlay.js`, the chapter template `web/ch_template.js`, `scripts/finish_longform.py` (chapter or frame-range segment: video only, captions burned, fixed encode), `scripts/stitch_longform.py` (concat + full audio: narration, SFX, music bed, loudness), frame-skip speed-up in `web/render.mjs`, the 3 s proof |
| `kit-cast` | `web/kit/cast.js`: the four characters + extras, every wardrobe id, faces, `speak()` helper, scales, Lily's teddy |
| `kit-props` | `web/kit/props.js`: every prop in the script and boundary sheet, `hold()` / `carry2()` at the measured palm |
| `kit-sets-a` | `web/kit/sets/bedroom.js`, `hallway.js` |
| `kit-sets-b` | `web/kit/sets/attic.js` (all its states across the week) |
| `kit-sets-c` | `web/kit/sets/kitchen.js`, `classroom.js`, `exterior.js` |
| `voices` | VoiceDesign auditions for MAX and LILY, pick, save `max_kid` / `lily_kid` clone samples |
| `narration-tool` | `scripts/narrate_multi.py` per `NARRATION_SPEC.md` |
| `ch01` ... `ch11` | one chapter each: shot plan, own narration, the clip `web/chNN.js`, previews, hold/fit checks, sound, render, fixes |
| `gate-*`, `render-*`, `review-*` | started later by the orchestrator with their own brief |

## How we work together
- **Own your files.** Only edit the files your role owns. Shared docs (`web/kit/README.md`, `production/requests.md`)
  are append-only. If you need something in another role's file, append a request to `production/requests.md`
  (`- [for kit-sets-a] ch06 needs a mark outside Lily's door ...`); owners check it every 20-30 min and answer there.
- **Status file.** Create `production/status/<role>.md` at once and keep it current at every milestone, first line one
  of `STATUS: WORKING`, `STATUS: READY` (your deliverable is on main), `STATUS: READY_FOR_GATE`, `STATUS: READY_TO_RENDER`,
  `STATUS: RENDERING`, `STATUS: DONE`, `STATUS: BLOCKED <why>`; then what's done, what's next, any measurements.
- **Push often.** Small commits; after each: `git fetch origin main && git merge origin/main`, then
  `git push origin HEAD:main` and push your session branch. Never force-push, never rewrite history, never open a PR.
  If `ideas/idea-ledger.json` or a shared doc conflicts, keep both sides. No model names in commits.
- **Waiting for someone.** Don't idle-poll in the foreground: run a background check, e.g.
  `until git fetch -q origin main && git show origin/main:roblox-shorts-studio/projects/i-secretly-lived-in-my-enemys-house/production/status/kit-sets-a.md | head -1 | grep -q READY; do sleep 60; done`,
  and keep working on what you can meanwhile.
- **Long jobs** (voice generation, renders) run in the background with `timeout` 7200000 ms (the default 1 h limit kills
  them). Never run two heavy jobs (TTS, renders) at once on your machine.
- **Usage limits / restarts.** If you are interrupted, the orchestrator will message you after the reset: resume from your
  status file. Keep it current so that's possible.
- `pkill -f "<pattern>"` kills your own shell if the pattern is in your command line; use `pgrep` + `kill <pid>`.
- Report problems in your status file (`STATUS: BLOCKED ...`) rather than working around a contract.
