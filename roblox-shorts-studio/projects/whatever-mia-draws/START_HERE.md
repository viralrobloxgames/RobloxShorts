# Whatever Mia Draws: resume notes

Standalone story (one part). Anything Mia draws with her pencil comes to life exactly as drawn, and she can't draw.
Leo grabs it and draws a perfect lion; Mia's wobbly cage has no roof; a scribble (a ball of yarn) saves the day.

## State
- 2026-10-05: script draft v1 (196 words, ~78 s) too long; cut to v2 (`script.txt`, 153 words with the CTA,
  expect ~61 s speech, 62-63 s video, inside the 61-65 s rule). Beats in `source/story.md`.
  Approved 2026-10-05 ("Approved, make the video").
- Narration: George voice C generating (`scripts/qwen_cloud_george_c.py`, take-01).
- Lion: the pack's `animal_lion` is one rigid mesh (no joints, no skin weights), so it can't roar, swat or roll paws-up.
  `web/lion.js` is a work-in-progress blocky part-rig alternative; asked the user whether to use the pack lion as is,
  cut it into hinged parts, or use the custom rig.

## Next
1. Narrate with George (`scripts/narrate.py`), measure word timings, set `seconds`.
2. Build on the web route (classroom, drawn props, `animal_lion`), preview each shot, fit check, render, finish.
