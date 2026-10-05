# Detective Max Sniffwell: The Vampire Case: resume notes

Standalone case of the Super Nose Detective series (Case 1: `projects/the-super-nose-detective`). Web route,
`detective_noir` narration (designed voice, see references/voice-and-audio.md). Story, beats and what was taken from the
original: `source/story.md`. Script: `script.txt`. Research: `source/research/` (incl. the user's key-frame uploads).

## Done
- Script v5 approved 2026-10-05 with one change ("His sister asked me to stay for dinner"; "then make the video").
  History: v1 The Big Cheese rejected (not standalone); v2 too long, hook made no sense; v3 random elements; v4 the Chief
  again; v5 the gardener.
- Narration take-01 (`scripts/qwen_cloud_clone.py --voice detective_noir`, tightened): 62.0 s of speech, transcript
  matches the script. `source/fix_captions.py` (text only: "20" -> "Twenty", "home grown" -> "homegrown", drops anything
  heard after "more cases"); run it after any re-transcribe, before `beats.py`.
- Outfits: `source/make_outfits.py` -> `web/outfits/` (Vlad on Leo's rig: tailcoat, red waistcoat, pale; his sister on
  Mia's rig: black dress, pale; the gardener on the Noob: green overalls and gloves). Max and the Chief wear Case 1's.
- Sets and props in code: `web/kit.js` (mansion, coffin, candelabras, garlic bread with butter / clove / soil crumb, garden:
  roses, garlic patch, sad tomatoes, straw hat, clippers, cape, fangs, KO stars, bats, burger, pool ring). Case 1's nose,
  sunglasses and handcuffs come from its kit. Title-card fonts: `assets/fonts/AlfaSlabOne-Regular.woff2` and
  `PlayfairDisplay-Bold.woff2` (OFL), registered in `web/runner.html`.
- Scene `web/vampire_clip.js` (28 shots, all word-anchored from `web/beats.js`). The sun comes from behind the house
  (+X/-Z, low) so the mansion's shadow lies across the garden on its -X side. Lock-up title card lower left at ~5.2-8 s
  (`lockup()`, also used by the cover).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (library + horror SFX, Case 1's sniff). Music: Case 1's funk bed.
- Cover: `web/cover_clip.js` -> `delivery/The_Vampire_Case_cover.png/.jpg` (both vampires grinning with fangs, Max's nose
  bottom right, the lock-up; 3:4 crop checked). `delivery/post.json` written.
- Fit check: 0 pairs (no pack accessories), reviewed.

## Next
- Full render running into `renders/web` (1870 frames), then encode, review, deliver to main.

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/super-nose-case-2/source/fix_captions.py && python3 projects/super-nose-case-2/source/beats.py && python3 projects/super-nose-case-2/source/lipsync.py && python3 projects/super-nose-case-2/source/sound_cues.py
python3 projects/super-nose-case-2/source/make_outfits.py
node web/fit_check.mjs --clip projects/super-nose-case-2/web/vampire_clip.js && node web/fit_check.mjs --clip projects/super-nose-case-2/web/vampire_clip.js --reviewed
node web/render.mjs --clip projects/super-nose-case-2/web/vampire_clip.js --out projects/super-nose-case-2/renders/web --workers 3 --resume
node web/render.mjs --clip projects/super-nose-case-2/web/cover_clip.js --out /tmp/cover --frames 1 --workers 1 --skip-fit-check
python3 scripts/finish.py projects/super-nose-case-2 --encode --frames projects/super-nose-case-2/renders/web
python3 scripts/post_md.py projects/super-nose-case-2
```

## Budget
- Web route: no farm cost. Narration local (free).
