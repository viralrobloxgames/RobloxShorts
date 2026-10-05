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
- Lion preview sent; user: "the animation on the lion is good", but the drawing made no sense (pencil moving on its own,
  Leo inside the desk). Fixed: drawers stand at the desk's east edge (`LEO_DESK`/`MIA_DRAW` -1.5, 2.4, lean 0.24) and
  the pencil is held by real arm IK (`reachArm` puts the right hand over the moving tip; the pencil runs tip -> hand).
- Rest built: hook (Mia draws the stick dog, it hops off the page), fetch, square-wheeled bike (BONK x2, ridden across
  the open floor by the board), stick boyfriend thumbs-up, Leo grabs the pencil ("Watch and learn." bubble), the
  ending (Leo runs back round the cage, "No. You're too good." bubble, over-the-shoulder shots), CTA end card.
  The drawn dog's flat head always turns to the camera.
- Sound: `source/sfx_assets.py` (roar/clang/thud/whoosh/chime/flutter copied from Every Lie Comes True; pencil, purr,
  bonk synthesized) -> `source/sound_cues.py` -> `source/sound_cues.json` (81 cues).
- Cover: `web/cover_clip.js` (the lion mid-roar, WHATEVER SHE DRAWS / COMES ALIVE, "HE DREW IT TOO WELL") ->
  `delivery/Whatever_Mia_Draws_cover.png|jpg`. Post copy: `delivery/post.json`. Fit check: 0 pairs, reviewed.
- Full render started 2026-10-05 (`renders/web`, 1904 frames, --resume safe).

## Next
1. Encode: `python3 scripts/finish.py projects/whatever-mia-draws --encode --frames projects/whatever-mia-draws/renders/web`
   (appends the cover as the last 0.5 s, writes `_post.md`); review a contact sheet; send the preview for approval.
2. Post only after the user approves this MP4 (TikTok first, then YouTube).

## Commands
```
python3 source/beats.py && python3 source/sfx_assets.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/whatever-mia-draws/web/mia_clip.js --out projects/whatever-mia-draws/renders/web --workers 4 --resume
node web/render.mjs --clip projects/whatever-mia-draws/web/cover_clip.js --out <dir> --frames 1   # cover
```
