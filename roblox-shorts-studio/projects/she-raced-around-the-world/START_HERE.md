# She Raced Around The World: resume notes

Standalone true story (one part), overnight run 2026-10-06 (user: keep making story videos until 6am, no script
approval needed; never post). In 1889 the New York World reporter Nellie Bly set out to beat Jules Verne's eighty days;
her editor wanted to send a man ("start the man, and I'll beat him"); she sailed two days later with one dress, one coat
and one small bag, met Verne in Amiens, learned in Hong Kong that Cosmopolitan had sent Elizabeth Bisland the other way
the same day, lost two days to Pacific storms, crossed America on a special train, and finished in 72 days, 6 hours,
11 minutes, almost eight days ahead of the book and four and a half days ahead of her rival. Mia plays her. Facts,
beats and sources: `source/story.md`.

## State
- 2026-10-06 ~02:30 BST: script v1 (158 words with the CTA, 20 lines) in `script.txt` (used as written: no approval
  needed tonight).
- Narration: take-01 started at low priority beside the lawn-chair render and was stopped after 1 of 20 lines (it was
  starved); the cached line is kept. Resume with the commands below once the CPU is free.
- Web route drafted: `web/race_clip.js` (15 shots: hook at the pier with the giant open book, editor's office with
  bubbles, sailing with 1 DRESS / 1 COAT / 1 BAG, the author's door in Amiens, the route map over the sea, Hong Kong
  telegram, the rival on her train going the other way, THE GREAT RACE front page, the storm (-2 DAYS), the special
  train with her on the rear platform, the Jersey City finish with 72 DAYS / 6 HOURS / 11 MINUTES, the crossed-out 80,
  the rival arriving +4.5 DAYS, CTA on the ship), `web/kit.js`, `source/beats.py` (anchors; `web/beats.js` is still the
  estimate). A first low-res pass per shot ran; framing fixes applied for the hook (camera was inside the moored ship),
  the office, finish/rival2 (faces turned to camera) and the trains (rear platform). Needs a full preview pass after
  the narration, then hold check (bag, telegram, the author's book), fit check (no accessories), sound cues, cover.
- Post copy: `delivery/post.json`.

## Next
1. `python3 scripts/qwen_cloud_george_c.py projects/she-raced-around-the-world --take take-01`, then
   `python3 scripts/tighten_clips.py projects/she-raced-around-the-world --voice george_c --take take-01`, then
   `QWEN_TTS_DIR=<dir> python3 scripts/narrate.py projects/she-raced-around-the-world --voice george_c --take take-01 --beat 0.8 --gap 0.38`
   (adjust the join so speech end + 2.5 s is 61-65 s), `python3 source/beats.py`, set `seconds` in project.json.
2. Preview every 10th frame (`node web/render.mjs --clip projects/she-raced-around-the-world/web/race_clip.js --out /tmp/p --every 10 --scale 0.3 --samples 1`),
   fix framing, hold check, fit check (`node web/fit_check.mjs --clip ...` then `--reviewed`), sound cues, cover, full
   render, encode, blank-frame check, review. Never post without the user's approval.
