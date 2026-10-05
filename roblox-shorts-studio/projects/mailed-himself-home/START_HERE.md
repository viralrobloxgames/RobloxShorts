# He Mailed Himself Home: resume notes

Standalone true story (one part), found through general research (not OddFrame's list). In October 1964 Reg Spiers,
an Australian javelin thrower broke in London, had his friend John McSorley nail him into a wooden crate labelled
paint and sent cash on delivery to a company that didn't exist. Fog in London, upside down on the tarmac in Bombay,
63 hours later he cut his way out in Perth, walked out of the airport in his suit and hitchhiked home to Adelaide for
his daughter's birthday. He forgot to tell his friend he'd survived; the friend called a newspaper, the world heard,
and the airline dropped the bill. Max plays the athlete; Leo the friend; Mia the wife. Facts, beats and sources:
`source/story.md`.

## State
- 2026-10-05: script v1 (160 words) **approved** ("Make the video"). The payoff line was split in two ("In the end," /
  "he never paid for one.") after two takes read it too fast; same words.
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py` (48.9 -> 47.7 s),
  then the clip "he never paid for one." slowed with `ffmpeg -filter:a atempo=0.8` (re-running tighten_clips undoes it),
  joined with `narrate.py --voice george_c --beat 0.9 --gap 0.5` = **61.3 s speech** (words end 61.34 s). Video = speech +
  2.0 s end card = 63.4 s (1901 frames), + 0.5 s cover = **63.9 s**. Whisper hears "Sixty-three" as "63" (fine in captions).
- Web route: `web/mail_clip.js` (24 shots), `web/kit.js` (the London lock-up with the PAINT crate (front panel and lid
  separate; a cut-out front for Perth), the athletics field, the airport apron with a 1960s four-engine jet, cargo loader
  and terminal (sign per city), the Perth bond store, the outback road with a truck, the house in Adelaide with the
  birthday banner, Leo's flat with the rotary phone, the airline's cargo office). Clothing shells: Max's vest and suit,
  Skye's clerk uniform, the daughter's dress (a 0.62-scale Skye with a paper party hat), hi-vis / uniform / coats on
  recoloured Noobs. No pack accessories (fit check: 0 pairs, reviewed).
- Overlays: LONDON, 1964; item pointers in the crate; ONE FOR... LATER; JAVELIN THROWER + the £0 wallet; the birthday
  postcard; London -> Perth route map with a crate; (NOT PAINT); C.O.D. / THEY PAY ON ARRIVAL / DOESN'T EXIST; the DELAYED
  board; UPSIDE DOWN; heat + sweat (the burn shot is the crate interior with the camera rolled 180 degrees); 63 HOURS IN A
  BOX; NOBODY STOPS HIM; Perth -> Adelaide route map; JUST IN TIME; NO CALL. NO LETTER.; Leo's bubble; four newspapers;
  NO CHARGE; TICKET HOME / PAID: £0; CTA card.
- Hold check: `web/hold_check.js` (14 close-ups, looked at; the torch is held upright and scaled 1.6x so it shows out of
  the fist; the phone handset is upright in Leo's fist in front of his face).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (80 cues). Music: playful_history_music.
- Cover: `web/cover_clip.js` (Max in the open PAINT crate, Leo with the hammer; HE MAILED / HIMSELF HOME / IN A BOX /
  (TRUE STORY)), `delivery/He_Mailed_Himself_Home_cover.jpg|png`, grid check `_cover_grid.jpg`. Post copy: `delivery/post.json`.
- Full render running (renders/web, 4 workers, ~3.6 s/frame, ~1h55m).

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/mailed-himself-home/web/mail_clip.js --out projects/mailed-himself-home/renders/web --workers 4 --resume
node web/render.mjs --clip projects/mailed-himself-home/web/cover_clip.js --out projects/mailed-himself-home/renders/cover --frames 1 --skip-fit-check
python3 scripts/finish.py projects/mailed-himself-home --encode --frames projects/mailed-himself-home/renders/web
python3 scripts/review/blank_frames.py projects/mailed-himself-home/delivery/He_Mailed_Himself_Home.mp4
python3 scripts/post_md.py projects/mailed-himself-home
```

## Next
1. Finish the render, encode, blank-frame check, review contact sheet, deliver for the user's review. Post only after approval.
