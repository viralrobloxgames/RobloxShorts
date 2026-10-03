# The Super Nose Detective (Case 1): resume notes

Roblox parody of the 70s Miami detective series Dick Snifford (logicbent). Max is Detective Max Sniffwell, with the Super
Nose gamepass. First-person noir narration in George voice C. Web route. Content line: flirting is fine, no swearing or
sexual references. Story, research and beats: `source/story.md`. Script: `script.txt` (v3, 169 words).

## Done
- Script v3 approved 2026-10-03 ("about 65 seconds", "for the next case"; "start making it").
- Narration: take-01 (George voice C, cloud `scripts/qwen_cloud_george_c.py`), line 5 redone for pace; 63.5 s speech.
  `source/fix_captions.py` (text only): joins "game pass" (also across caption groups) and "At chew" -> "Achoo",
  "meer" -> "Mia". Run it after any re-transcribe, before `beats.py`.
- Outfits: `source/make_outfits.py` -> `web/outfits/` (Max's pink palm-print shirt, white trousers, holster straps;
  Leo's navy chief blazer; Skye's coral 70s top). Nose, sunglasses, donuts, sock, evidence bag, convertible, police car,
  tape, palms: `web/kit.js` (built in code, no pack accessories; fit check passes with 0 pairs, reviewed).
- Scene `web/nose_clip.js`: station plaza (crime scene), road, Flamingo Hotel pool, office set at x = -300. Beats from
  `source/beats.py`; SFX from `source/sound_cues.py` (mirrors the clip's `B` block); smell trails A-D.
- Audio: `source/make_audio.py` -> `audio/music_funk.wav` (original synthesized 70s funk bed), `sniff/achoo/splash.wav`.
  `finish.music` points at the funk bed (gain 0.08).
- Cover: `web/cover_clip.js` -> `delivery/The_Super_Nose_Detective_cover.jpg/.png` (3:4 crop checked). `delivery/post.json`.

## Next
- Finish the full render (`--resume`), encode, review (contact sheet), deliver. Post only after the user approves.

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/the-super-nose-detective/source/fix_captions.py && python3 projects/the-super-nose-detective/source/beats.py && python3 projects/the-super-nose-detective/source/sound_cues.py
python3 projects/the-super-nose-detective/source/make_audio.py
python3 scripts/finish.py projects/the-super-nose-detective
node web/fit_check.mjs --clip projects/the-super-nose-detective/web/nose_clip.js && node web/fit_check.mjs --clip projects/the-super-nose-detective/web/nose_clip.js --reviewed
node web/render.mjs --clip projects/the-super-nose-detective/web/nose_clip.js --out projects/the-super-nose-detective/renders/web --workers 3 --resume
python3 scripts/finish.py projects/the-super-nose-detective --encode --frames projects/the-super-nose-detective/renders/web
```

## Budget
- Web route: no farm cost. Narration local (free).
