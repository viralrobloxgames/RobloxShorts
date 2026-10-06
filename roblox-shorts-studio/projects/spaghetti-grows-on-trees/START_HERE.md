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
- Script v1 (155 words), `script.txt`.
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), then `tighten_clips.py` and
  `narrate.py --voice george_c` (see the root of this file's history for the run; check the word report).
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

## Next
1. Previews on the real timings, motion pass, hold check, fit check, full render (~2 h), cover, encode, review.
   Post only after the user approves the MP4.
