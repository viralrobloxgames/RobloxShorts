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
- Narration (George voice C, local Qwen): 20 clips, tightened 47.6 -> 47.0 s, joined at gap 0.5 / beat 1.0:
  speech ends 59.82 s; video 61.83 s (1855 frames) + 0.5 s cover = **62.3 s**. `source/beats.py` maps the
  transcriber's digits (80, 72, 6, 11) back to the script words, so all 56 anchors are measured (none interpolated).
- Web route: `web/race_clip.js` (15 shots), `web/kit.js`. Preview pass (every 10th frame) after the narration; fixes:
  the travel bag now stays in her hand on the whole trip (sail, author, route, race, storm, CTA); the author's book and
  the telegram are held out just past the fist (they sank into the hand); Mia faces Leo in the office; cameras
  re-framed for the editor (Leo was out of shot), her reply (was the back of her head), sail and storm (closer),
  the author (both faces; the book moved to his left hand, his right was behind her bag), Hong Kong (her face and the
  telegram), the rival's train and the special train (the platform was at the frame edge) and the rival's arrival
  (both of them in shot; the rival walks in sooner and turns to her).
- Hold check: `web/hold_check.js` (11 close-ups, looked at). Fit check: no accessories (0 pairs), reviewed.
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (46 cues; sfx copied into `audio/sfx/`).
- Cover: `web/cover_clip.js` (Mia, one fist up, in front of the giant book with its 80 crossed out; SHE RACED /
  AROUND THE WORLD / IN 72 DAYS), `delivery/She_Raced_Around_The_World_cover.jpg|png`, grid check `_cover_grid.jpg`.
- Full render running (renders/web, 4 workers, started ~04:05 BST); resume with the render command below.
- Post copy: `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/she-raced-around-the-world/web/race_clip.js --out projects/she-raced-around-the-world/renders/web --workers 4 --resume
python3 scripts/finish.py projects/she-raced-around-the-world --encode --frames projects/she-raced-around-the-world/renders/web
python3 scripts/review/blank_frames.py projects/she-raced-around-the-world/delivery/She_Raced_Around_The_World.mp4
```

## Next
1. Finish the full render (`--resume`), encode, blank-frame check, contact sheet review; deliver for the user's review.
   Never post without the user's explicit approval of the MP4.
