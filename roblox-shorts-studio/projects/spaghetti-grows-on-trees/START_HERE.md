# Spaghetti Grows On Trees: resume notes

Standalone true story (one part) for the overnight run of 2026-10-05/06 (picked through general research because the
user's second named story, Lawnchair Larry, was already in the ledger as He Flew A Lawn Chair; script approval waived for
the run, posting still needs approval of the finished MP4). On 1 April 1957 Britain's most serious news show reported a
bumper spaghetti harvest in Switzerland: pickers pulling spaghetti off trees, the spaghetti weevil almost wiped out,
every strand the same length thanks to careful breeding. Eight million watched; hundreds phoned in asking how to grow
their own and were told to "place a sprig of spaghetti in a tin of tomato sauce and hope for the best". It was April
Fools' Day. Max is the presenter, Mia and Skye the pickers, Leo and Noob the viewers. Facts, beats, sources:
`source/story.md`. No on-screen branding; nobody named in the narration.

## State
- Script v1 (157 words; line 3 writes the year out, "It's nineteen fifty-seven", because the voice read "1957" as
  "a 1957"), `script.txt`.
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --gap 0.5 --beat 1.1` (slightly longer pauses so the video clears 61 s) = **59.4 s**
  speech (words end 59.24 s). Video = words end + 2.5 s end card = 61.77 s, + 0.5 s cover = **62.3 s**. Whisper
  heard "phoned in" (spoken that way; fine), "1st", "Fool's", "ViralRobloxGames": word_fixes in `source/project.json`.
- Web route: `web/spaghetti_clip.js` (16 shots), `web/kit.js` (orchard of spaghetti trees with a ladder, a basket, a
  drying rail and a PERFECT LENGTH board, mountains; the weevil; a 1950s TV studio with desk, microphone, desk phone,
  flip calendar, studio camera; a 1950s living room with a TV set, armchairs, side table phone, shelf of tins, the tin
  of tomato sauce). Hold check `web/hold_check.js`, cover `web/cover_clip.js`, sound `source/make_sfx.py` +
  `source/sound_cues.py`, post copy `delivery/post.json`.
- Overlays: TV bezel in the hook, ON THE NEWS / OFF A TREE?!, n WATCHING, BRITAIN · 1957 / BRITAIN'S MOST SERIOUS NEWS
  SHOW, SWITZERLAND / MILD WINTER / BUMPER HARVEST!, DRYING IN THE SUN, THE SPAGHETTI WEEVIL / ALMOST GONE, ALL THE SAME
  LENGTH? / CAREFUL BREEDING, SPAGHETTI IN BRITAIN: RARE / ONLY IN A TIN, CALLS counter, bubbles IS IT REAL? / HOW DO
  I GROW MY OWN SPAGHETTI TREE?, THE ANSWER:, the sprig quote bubble, ...AND HOPE FOR THE BEST, THE DATE OF THE SHOW?,
  APRIL FOOL! stamp, THE BIGGEST HOAX A SERIOUS NEWS SHOW EVER PULLED, CTA card.

## Commands
```
python3 source/beats.py && python3 source/make_sfx.py && python3 source/sound_cues.py     # from the project dir
node web/fit_check.mjs --clip projects/spaghetti-grows-on-trees/web/spaghetti_clip.js       # then --reviewed
node web/render.mjs --clip projects/spaghetti-grows-on-trees/web/spaghetti_clip.js --out projects/spaghetti-grows-on-trees/renders/web --workers 4 --resume
node web/render.mjs --clip projects/spaghetti-grows-on-trees/web/cover_clip.js --out /tmp/cover --frames 1
python3 scripts/finish.py projects/spaghetti-grows-on-trees --encode --frames projects/spaghetti-grows-on-trees/renders/web
python3 scripts/review/blank_frames.py projects/spaghetti-grows-on-trees/delivery/Spaghetti_Grows_On_Trees.mp4
python3 scripts/post_md.py projects/spaghetti-grows-on-trees
```

- Shots after the preview/motion review: 18 (the orchard aerial split into aerial + harvest, the tin shot into shelf +
  tin). Hold check looked at (hank in Mia's palm, basket by the handle clear of Skye's leg, a hank per fist at the
  rail, tin against Noob's fist, handsets in Leo's and Max's fists, the sprig into the tin). Fit check: 0 accessory
  pairs, reviewed. Cover: `delivery/Spaghetti_Grows_On_Trees_cover.png/.jpg` + `_cover_grid.jpg` (3:4 check).
- **Delivered for review (2026-10-06 04:36 UTC):** `delivery/Spaghetti_Grows_On_Trees.mp4`, **62.3 s** (1868 frames
  incl. the 0.5 s cover), captions burned in; `delivery/Spaghetti_Grows_On_Trees_post.md` + `post.json`. Full render
  1853 frames (web route, 1 sample; started at nice 19 beside the previous render, finished with 4 workers).
  Blank-frame check: three 2-3 frame runs (4.0 s living room, 27.6 s and 28.7 s shelf close-up) are plain-wall,
  low-detail shots with full content, kept.
- Known nit for a re-cut: in Leo's phone close-up ('ask', about 37-40 s) his face sits in the caption band, so the
  caption crosses his mouth. Fix: aim the 'ask' camera lower (target y ~3.9) or pull back, then
  `node web/changed_frames.mjs --clip ... --out renders/web --delete`, fit check + --reviewed, `render.mjs --resume`,
  re-encode.

## Next
1. The user watches the MP4. Post only after the user approves this MP4 (TikTok first, then YouTube Shorts).
