# Stealing a T-Rex Egg (Part 1): resume notes

A Steal an Egg parody with Leo, Max and Mia (see `source/story.md`, which includes research notes). Web route, Roblox R6
pack plus a new procedural blocky T-rex, George voice C narration, about 67 s.

## Done
- Story beats `source/story.md` (hook first) and `script.txt` (165 words).

## Next
1. **Script approval** (ledger status `script_draft_awaiting_approval`).
2. On approval: narration (`scripts/qwen_cloud_george_c.py`, then `scripts/narrate.py --voice george_c`), and in
   parallel build the T-rex rig, biome and `web/<clip>.js` against word-anchored beats (`source/beats.py`, pattern from
   `projects/every-jump-makes-you-bigger`).
