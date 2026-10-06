# Gate reviewer brief (fresh session; you wrote none of the chapters)

Role `gate-X` reviews chapters {CHAPTERS} and the seams {SEAMS} before any full render. Read `production/WORKERS.md`,
`source/boundary_sheet.md`, `source/story.md`, `script.txt`, `production/KIT_SPEC.md`, `web/kit/README.md` and SKILL.md's
hard rules. Create `production/status/gate-X.md` and keep it current.

For each of your chapters, as soon as its `production/status/chNN.md` says `READY_FOR_GATE` (watch in the background):
1. Look at its sheets in `production/previews/chNN/` and render more frames yourself whenever a shot needs a closer look
   (`node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js --out <scratch> --frames ... --scale 0.5 --samples 1 --skip-fit-check`).
2. Check against the script and the boundary sheet: every line has its picture (whoever speaks is framed, faces readable
   and 3/4, no backs of heads in key moments, the reaction shots land), first and last frames match the sheet exactly
   (set, light, wardrobe, props, faces, positions), continuity of the persistent things (fridge letters, garlic, attic
   state, pancakes, glow sticks, backpack on/off), kit looks used (no private copies), props in the palm, no two-arms-up,
   real walks, nothing inside walls or cameras inside geometry, day card / time stamps right, captions' lower third clear
   of faces, the comedy beats timed so they read. Seams: put chapter N's last frame next to N+1's first frame.
3. Write `production/gate/chNN.md`: first line `GATE: PASS` or `GATE: FIX`, then a numbered list of fixes, each with the
   time or frame, what is wrong, what to do, and severity (must / should). Be specific and brief; anything a viewer would
   notice is a must. Push at once and message nothing: the chapter session watches that file.
4. When a chapter re-submits after fixes (`READY_FOR_GATE` again with a note), re-check only the fixes and update the file
   (`GATE: PASS` when all musts are done).
When all your chapters pass, set STATUS: DONE. The orchestrator may then give you a render job.
