# Final render brief (fresh sessions `final-chNN-a` / `final-chNN-b`)

You render one segment of one chapter at full quality once its re-check is OK. Segment A = frames 1..SPLIT-1,
segment B = SPLIT..FRAMES (from `production/status/chNN.md` at the OK'd commit). Never post anything. ~40 sessions share
one 5-hour usage limit: wait with background commands and end your turn; keep your context small.

Paths: work from `roblox-shorts-studio/`; `P=projects/i-secretly-lived-in-my-enemys-house`.
1. **Setup now**: `git pull`; prove the renderer runs: `node web/render.mjs --clip $P/web/chNN.js --out /tmp/t --frames
   1-1 --scale 0.25`. Write `$P/production/status/final-chNN-<a|b>.md` = `STATUS: WAITING`, push.
2. **Wait** (background, then end your turn) for the OK line:
   `until git fetch -q origin main && git show origin/main:$P/production/status/recheck-chNN.md 2>/dev/null | grep -q "RECHECK: OK @"; do sleep 120; done`
3. **Render at that sha**: `git worktree add /tmp/wt <sha>`; from `/tmp/wt/roblox-shorts-studio`:
   `node web/render.mjs --clip $P/web/chNN.js --out /tmp/frames --frames <range> --workers 4` as a background command
   (~50-60 min), status `STATUS: RENDERING @ <sha>`, end your turn.
4. **Encode** (from the worktree): `python3 scripts/finish_longform.py projects/i-secretly-lived-in-my-enemys-house
   --chapter NN --frames /tmp/frames --range <range>` -> `delivery/chapters/chNN_<a|b>.mp4` + `.json` in the worktree.
   Check: the frame count equals the range length, 3 stills look right (no black or broken frames).
5. **Publish**: copy the .mp4 and .json into your main checkout's `$P/delivery/chapters/`, `git pull --rebase`, commit only
   those two files + your status file (`STATUS: DONE`, `COMMIT: <sha>`, `RANGE: a-b`), push (retry on races).
If `recheck-chNN.md` later shows a newer `RECHECK: OK @ <sha2>`, render again at sha2. If you are stopped by the usage
limit, the orchestrator resumes you after the reset.
