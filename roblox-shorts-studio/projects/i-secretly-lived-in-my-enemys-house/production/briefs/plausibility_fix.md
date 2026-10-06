# Plausibility fix brief (chapter sessions), after the user's feedback and the frame critics

The user found characters inside desks, walking through the banister and island, overlapping bodies, bad sitting,
a "hidden" Skye in plain view, floating props and poor poses. Six frame critics have listed every case.
Your job: fix every must in your chapter, prove it on previews, get your critic's OK, then re-render.

1. **Inputs**: your section in `production/review/critic-N.md`, plus `production/review/clip_check/chNN.json` when
   kit-pipeline publishes it (an automated interpenetration report; run `node web/clip_check.mjs --clip <your clip>`
   yourself after fixing).
2. **Fix** every must; shoulds when cheap. Stage like a real room: walk paths that go around furniture and down the
   steps, seated hips on the seat (use the set's sit marks + `seatY`), feet on the floor, hands holding props,
   one-arm gestures, nobody overlapping anybody, secrets out of the other character's line of sight, the speaker on
   screen. Keep the narration timing (lines.json) unless a beat cannot work without a change; if so, say so in your
   status file first. A cause that lives in the kit (a set's furniture spacing or seat height, a pose in cast.js, a
   light that makes a face unreadable) goes to its owner in `production/requests.md` with the exact problem; do the
   rest meanwhile, and message the owner directly if it blocks you (roster: `production/ORCHESTRATION.md`).
3. **Prove it before any full render**: previews at `--scale 0.5` of every changed shot at 5-10 fps (`--frames a-b`
   or `--every 3`), plus the whole chapter at `--every 15`; look at them yourself in 2x2 sheets. Automated proof, all
   from `roblox-shorts-studio/`: `node web/clip_check.mjs --clip <clip> --sight skye:max,dad,lily --out
   production/review/clip_check/chNN.json` (no unexplained penetration; nobody sees Skye while she is hiding) and
   `node web/cam_check.mjs --clip <clip>` (no camera glide or camera inside geometry at a cut). Paste the totals in
   your status file.
4. **Re-check**: set `STATUS: READY_FOR_RECHECK` (+ `COMMIT:`), and message your critic (session in the roster) to
   re-check your fixes from previews it renders itself. Fix what it still finds.
5. **After the critic's OK** (and after KIT FREEZE: segments A and B must be rendered from the same code, render.mjs
   stamps a code fingerprint and the stitch warns on a mismatch): re-render your whole segment A at full quality and ask your segment-B helper to
   re-render the whole of segment B at your commit (both with `--workers 4`, frames deleted first or rendered in
   place), re-encode both, push, `STATUS: DONE`, message the orchestrator. Never post anything.
