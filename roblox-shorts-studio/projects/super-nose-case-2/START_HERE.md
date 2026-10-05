# Detective Max Sniffwell: The Vampire Case: resume notes

Standalone case of the Super Nose Detective series (Case 1: `projects/the-super-nose-detective`). Web route,
`detective_noir` narration (designed voice, see references/voice-and-audio.md). Story, beats and what was taken from the
original: `source/story.md`. Script: `script.txt`. Research: `source/research/`.

## Status
- Script v1 "The Big Cheese" rejected 2026-10-05 (series is standalone cases).
- Script v2 (94 s) too long with a hook that did not make sense; v3 (62 s) had random elements (camping, respawn, floating); v4 2026-10-05 is one clue chain (garlic bread -> barbecue + sunscreen -> Chief Leo, whose pool the mansion shades), 147 words, **awaiting the user's approval**. Nothing narrated or built yet.

## Next (after approval)
- Narrate in the background (`scripts/qwen_cloud_clone.py --voice detective_noir --take take-01`, then
  `scripts/tighten_clips.py`, then `scripts/narrate.py`) while building the scene from Case 1's kit (nose, police car,
  handcuffs) plus new sets: haunted mansion on the beach with Leo's pool in its shadow, coffin, garlic bread, barbecue, pool floatie.
