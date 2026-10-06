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
  needed tonight). Narration (George voice C, cloud, take-01) generating.

## Next
1. `python3 scripts/tighten_clips.py projects/she-raced-around-the-world --voice george_c --take take-01`, then
   `QWEN_TTS_DIR=<dir> python3 scripts/narrate.py projects/she-raced-around-the-world --voice george_c --take take-01 --beat 0.8 --gap 0.38`
   (adjust the join so the video is 61-65 s), then beats.py -> web clip, previews, hold check, fit check, full render,
   encode, blank-frame check, review, cover, post copy. Never post without the user's approval.
