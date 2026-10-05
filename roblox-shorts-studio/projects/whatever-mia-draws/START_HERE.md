# Whatever Mia Draws: resume notes

Standalone story (one part). Anything Mia draws with her pencil comes to life exactly as drawn, and she can't draw.
Leo grabs it and draws a perfect lion; Mia's wobbly cage has no roof; a scribble (a ball of yarn) saves the day.

## State
- 2026-10-05: script draft v1 (196 words, ~78 s) too long; cut to v2 (`script.txt`, 153 words with the CTA,
  expect ~61 s speech, 62-63 s video, inside the 61-65 s rule). Beats in `source/story.md`.
  Approved 2026-10-05 ("Approved, make the video").
- Narration done: George voice C (1.7B, cloud), take-01, clips tightened (`scripts/tighten_clips.py`), joined with
  `narrate.py --beat 0.5` (0.4 s gaps, 0.5 s at blank lines) = **62.1 s speech**; all words heard. Video ~63.7 s + 0.5 s
  cover = ~64.2 s, inside 61-65 s. (Default 0.9 s beats gave 66.9 s, too long.)
- Lion (user chose option 2, 2026-10-05): the pack lion cut into hinged parts by its own blocks
  (`assets/roblox_pack/tools/cut_lion.py` -> `creatures/animal_lion_parts`): Body, Mane, Head (turns inside the mane),
  Jaw (the whole muzzle, with a dark mouth and fangs behind it), Tail, four legs (each one rigid block, no knee).
  `web/lion.js`: placement, walk cycle (distance-driven), pencil-sketch look with ink outlines, and `lionDrawing()`,
  which renders this lion once and edge-detects/hatches it into the pencil drawing Leo makes on the page.
- Build so far: the lion section only (`web/mia_clip.js`, W.draws1 .. W.wants, 20.5-56 s): Leo draws it, it steps off
  the page (sketch -> colour), roars, stalks Leo to the board, Mia's no-roof cage drops, it swats the bars, leaps out,
  bats the stick boyfriend twice, play-bows ("just a big cat"), Mia scribbles a ball of yarn, it pounces and rolls over
  purring. Classroom and drawn props: `web/kit.js`. Beats: `source/beats.py` -> `web/beats.js`.
- Preview of the lion section sent to the user for the animation check before building the rest.

## Next
1. User feedback on the lion animation.
2. Build the rest: the hook and montage (stick dog fetching, square-wheeled bike, stick boyfriend), Leo grabbing the
   pencil ("Watch and learn." bubble), and the button ("No. You're too good." bubble) + CTA end card; cover; full render.
