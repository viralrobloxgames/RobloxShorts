# Stealing a T-Rex Egg (Part 1): resume notes

A Steal an Egg parody with Leo, Max and Mia (see `source/story.md`, which includes research notes). Web route, Roblox R6
pack plus the T-rex and eggs from the user's own game (`assets/roblox_pack/creatures/trex`, `props/egg_*`), George voice C
narration, about 67 s.

## Done
- Story beats `source/story.md` (hook first) and `script.txt` (165 words).

- T-rex and eggs exported from Roblox Studio into the pack (see the Result section of `STUDIO_HANDOFF.md`). The
  hand-built `web/lib/trex.js` was rejected; do not use it.

## Next
0. Load `creatures/trex` in `web/` (one group per body from `rig.json`), author sleep / wake / roar / run / headbutt on its
   joints, and render a look test for the user.
1. **Script approval** (ledger status `script_draft_awaiting_approval`).
2. On approval: narration (`scripts/qwen_cloud_george_c.py`, then `scripts/narrate.py --voice george_c`), and in
   parallel build the T-rex rig, biome and `web/<clip>.js` against word-anchored beats (`source/beats.py`, pattern from
   `projects/every-jump-makes-you-bigger`).
