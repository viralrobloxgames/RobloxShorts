# Render plan: render while the gate reviews (orchestrator, 13:30Z)

Full renders start the moment a chapter is submitted to the gate, on two machines, instead of after the gate. Fixes then
cost only the frames they change: `web/changed_frames.mjs` compares every frame's fingerprint (camera, meshes, bones,
lights, materials, overlay) with what was rendered and deletes just the changed PNGs, and `render.mjs --resume` redoes them.
House setting: 1920x1080, 1 sample, ~3 s per rendered frame on 2 workers, ~1/3 of frames copied by the frame skip.

All commands run from `roblox-shorts-studio/`; `C=projects/i-secretly-lived-in-my-enemys-house/web/chNN.js`,
`O=projects/i-secretly-lived-in-my-enemys-house/renders/chNN` (renders are never committed). Use the same `--clip`
string everywhere (the fingerprints are stored per clip path). Long jobs: background, `timeout` 7200000.

## Chapter session (segment A = frames 1..S-1)
1. Before `READY_FOR_GATE`: narration, captions, SFX cues, previews, hold check and a reviewed fit check are final, so
   the chapter's length is locked. Fixes after this should keep the timing unless the gate asks for a timing change.
2. Set `STATUS: READY_FOR_GATE` with three lines under it: `FRAMES: <total>`, `SPLIT: <S>` (S = round(0.45 x total) + 1,
   you take the smaller half because you also do the fixes), `COMMIT: <sha>`. Push.
3. Start segment A at once in the background: `node web/render.mjs --clip $C --out $O --frames 1-<S-1> --workers 3`.
   The orchestrator gives frames S..total (segment B) to a helper; nothing to do for B.
4. Gate fixes: fix as usual (previews at --scale 0.5 into a scratch dir, never into $O). If a fix needs a narration
   retake (heavy), stop your render first (`pgrep -f "render.mjs"` + `kill <pid>`; `--resume` continues it later).
   Re-submit (`READY_FOR_GATE` again, new COMMIT/FRAMES).
5. After `GATE: PASS` in `production/gate/chNN.md`: set `STATUS: READY_TO_RENDER` with the final `FRAMES:`, `SPLIT:`
   (unchanged) and `COMMIT: <sha>` and push. That is the signal for the helper to sync segment B.
6. Sync A: let the first render finish (or kill it), then `node web/changed_frames.mjs --clip $C --out $O --delete`
   (frames outside your range have no PNG here and show as changed: that's expected; if it refuses because "every frame
   changed", check, then add `--force` only if the edit really touched all of A), then
   `node web/render.mjs --clip $C --out $O --frames 1-<S-1> --workers 4 --resume`.
7. Encode: `python3 scripts/finish_longform.py projects/i-secretly-lived-in-my-enemys-house --chapter NN --frames $O --range 1-<S-1>`
   -> `delivery/chapters/chNN_a.mp4` (+ .json). Check it decodes with S-1 frames, look at 3 stills from it, push,
   `STATUS: DONE` (keep FRAMES/SPLIT/COMMIT lines). Keep $O: final-review fixes reuse it (step 6 again + step 7).

## Helper (segment B = frames S..total), status file `production/status/render-chNN-b.md`
1. `git pull` main. Read `production/status/chNN.md` for FRAMES and SPLIT. Start at once in the background:
   `node web/render.mjs --clip $C --out $O --frames <S>-<FRAMES> --workers 4` (no fit-check flag needed for a range).
2. Wait in the background for `production/status/chNN.md` to say `STATUS: READY_TO_RENDER` (or DONE), e.g.
   `until git fetch -q origin main && git show origin/main:roblox-shorts-studio/projects/i-secretly-lived-in-my-enemys-house/production/status/chNN.md | head -1 | grep -qE "READY_TO_RENDER|DONE"; do sleep 90; done`.
3. Then `git pull`, re-read FRAMES (the end may have moved), stop the first render if it is still running
   (`pgrep -f "render.mjs"` + `kill <pid>`), `node web/changed_frames.mjs --clip $C --out $O --delete` (frames before S show
   as changed here: expected), then `node web/render.mjs --clip $C --out $O --frames <S>-<FRAMES> --workers 4 --resume`.
4. `python3 scripts/finish_longform.py projects/i-secretly-lived-in-my-enemys-house --chapter NN --frames $O --range <S>-<FRAMES>`
   -> `delivery/chapters/chNN_b.mp4`; check it decodes with FRAMES-S+1 frames, look at 3 stills, push, `STATUS: DONE`.
   If finish_longform.py needs something missing on your machine (font, Python package), install it and note the fix in
   `production/requests.md` for the next helper.
5. Keep $O and stay available: final-review fixes come as a message ("re-sync chNN B to <sha>"): steps 3-4 again.

## Orchestrator
Watches the status files; on `READY_FOR_GATE` assigns segment B to a free helper by message (`render-chNN-b`), and the
gate reviewer picks the chapter up by itself. Stitch (`scripts/stitch_longform.py`) runs when every chNN_a/chNN_b is DONE.
