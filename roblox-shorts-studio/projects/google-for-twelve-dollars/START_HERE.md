# He Bought Google For 12 Dollars: resume notes

Standalone true story (one part), taken from OddFrame's best-performing Short ("He Owned Google For A Minute") at the
user's request. In 2015 a former Google employee bought google.com for $12 on Google's own domain shop and owned it
for about a minute; Google cancelled it, paid him a $6,006.13 bug reward (digits spell GOOGLE), and doubled it when
he gave it to a charity running free schools in India. Leo plays him; Max and Mia are Google security; the Noob
brings the cheque.

## State
- 2026-10-05: script v1 (155 words) **approved** ("approved, make the video"). `script.txt` re-flowed to one sentence per
  line (same words) so each narration clip is a whole sentence.
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --beat 0.85 --gap 0.42` = **62.8 s speech**. The digit and letter lines were re-spoken as
  "Six. Zero. Zero. Six. One. Three." and "G... O... O... G... L... E." (same words) so they read slowly enough for the
  on-screen flip; "He asks them..." re-rolled (it was rushed). Caption fixes in captions.json: "google .com" -> "google.com",
  "-O" -> "O". Video 64.4 s + 0.5 s cover = 64.9 s.
- Web route: `web/google_clip.js` (cast, laptop screen UI per story step, 18 shots), `web/kit.js` (bedroom with live laptop
  screen, wall clock, night/day window; globe in space with OWNER flag; security office with live wall screen and monitors
  and the REWARD button; free school; cheque with live texture). Beats: `source/beats.py` -> `web/beats.js`.
  POV screen shots hide Leo (the camera is where his head is). The cheque's digits light up on each spoken digit and flip
  into G-O-O-G-L-E on each spoken letter; the "squint" is eyelid bars in the overlay.
- No pack accessories (fit check: 0 pairs, reviewed). Sound: `source/sound_cues.py` -> `source/sound_cues.json`
  (sfx copied into audio/sfx from The Backwards Umbrella and Every Lie Comes True). Music: playful_history_music.
- Cover: `web/cover_clip.js` (Leo on top of the world with the OWNER: LEO / google.com flag; HE BOUGHT / GOOGLE / FOR $12),
  `delivery/He_Bought_Google_For_12_Dollars_cover.jpg|png`, grid check `_cover_grid.jpg`. Post copy: `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/google-for-twelve-dollars/web/google_clip.js --out projects/google-for-twelve-dollars/renders/web --workers 4 --resume
node web/render.mjs --clip projects/google-for-twelve-dollars/web/cover_clip.js --out projects/google-for-twelve-dollars/renders/cover --frames 1
python3 scripts/finish.py projects/google-for-twelve-dollars --encode --frames projects/google-for-twelve-dollars/renders/web
```

## Next
1. Full render (running), encode, review contact sheet, deliver for the user's review. Post only after approval.
