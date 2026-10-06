# He Stole The Mona Lisa: resume notes

Standalone true story (one part), found through general research, not OddFrame's list. On Monday 21 August 1911,
a former Louvre worker, Vincenzo Peruggia, walked in wearing a staff smock, lifted the Mona Lisa off its four pegs,
dumped the frame and glass case on a service stairway, and a passing plumber unlocked the door for him. Nobody
noticed until the next day; the guards assumed it was off being photographed. The Louvre shut for a week, police
questioned Picasso, and a detective wrote his report leaning on the table she was hidden in. Crowds queued to stare at
the empty wall. Two years later he tried to sell it to a Florence dealer, who had it checked and called the police.
The theft turned the painting into the most famous in the world. Max plays the thief. Facts, beats and sources:
`source/story.md`.

## State
- 2026-10-05: script v1 (160 words) **approved** ("approved, make the video").
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py` (48.0 -> 47.4 s),
  joined with `narrate.py --voice george_c --beat 0.9 --gap 0.5` = **59.9 s speech** (words end 59.88 s). Video = speech +
  2.0 s end card = 61.9 s (1857 frames), + 0.5 s cover = **62.4 s**. Transcript matches the script; Whisper hears "queue"
  as "cue", fixed in captions with `word_fixes` ("CUE": "QUEUE").
- Web route: `web/mona_clip.js` (22 shots), `web/kit.js` (the Salon Carre gallery with the four pegs, the service
  staircase with the cut-out doorway, the museum front with FERME/CLOSED, the police office with the DISPARUE poster, the
  thief's room with the hollow table (cut away on the camera side), the Florence shop with the red dome in the window,
  the Louvre today; props: framed and bare painting, frame + glass case, toolbox, key, brush, easel, notebook, pencil,
  magnifier, candlestick phone with a liftable earpiece, trunk, phones, newspapers). Clothing shells (`dress()` in
  kit.js, boxes on the torso and upper-arm bones, hands bare): Max's white smock, Skye's guard uniform, Mia's trench,
  Leo's waistcoat (Florence), police uniforms and a striped shirt on recoloured Noobs. No pack accessories (fit check: 0
  pairs, reviewed).
- The painting image is the public-domain Wikimedia Commons scan (C2RMF retouched, 500 px thumbnail) in `web/tex/`.
- Overlays: PARIS, 1911 tag, LOUVRE STAFF / FORMER badge, padlock, NEXT MORNING, circles on the real peg positions
  (projected), the guard's thought (camera + painting), STOLEN!, CLOSED FOR A WEEK, 60 POLICE counter, QUESTIONED: PABLO
  PICASSO, SHE'S RIGHT HERE! arrow, THE MUSEUM REOPENS, four spinning newspaper fronts, 2 YEARS LATER / Florence, REAL,
  ARRESTED!, 1911 sepia flashback, TODAY / THE MOST FAMOUS / PAINTING ON EARTH, CTA card.
- Hold check: `web/hold_check.js` (20 close-ups, looked at; brush turned forward so it no longer runs up the forearm,
  phones turned so the screens face the holders, the palette dropped because it cut through Leo's forearm).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (56 cues). Music: playful_history_music.
- Cover: `web/cover_clip.js` (Max holding the painting, a peg behind him; HE STOLE THE / MONA LISA / AND MADE HER /
  FAMOUS), `delivery/He_Stole_The_Mona_Lisa_cover.jpg|png`, grid check `_cover_grid.jpg`. Post copy: `delivery/post.json`.
- Full render done (1857 frames, renders/web, not in git). Encoded `delivery/He_Stole_The_Mona_Lisa.mp4`: 62.4 s incl. the
  0.5 s cover, 1080x1920, 1872 frames all decoded, -16.8 LUFS, captions burned; post sheet `delivery/He_Stole_The_Mona_Lisa_post.md`.
  `blank_frames.py` lists 18.4 s and 24.2-25.6 s: the intended empty-wall close-ups (four empty pegs, LA JOCONDE plaque,
  STOLEN! stamp), looked at, kept. **Delivered for review (2026-10-05); not posted.**

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/he-stole-the-mona-lisa/web/mona_clip.js --out projects/he-stole-the-mona-lisa/renders/web --workers 4 --resume
node web/render.mjs --clip projects/he-stole-the-mona-lisa/web/cover_clip.js --out projects/he-stole-the-mona-lisa/renders/cover --frames 1 --skip-fit-check
python3 scripts/finish.py projects/he-stole-the-mona-lisa --encode --frames projects/he-stole-the-mona-lisa/renders/web
python3 scripts/review/blank_frames.py projects/he-stole-the-mona-lisa/delivery/He_Stole_The_Mona_Lisa.mp4
python3 scripts/post_md.py projects/he-stole-the-mona-lisa
```

## Next
1. Wait for the user's review. Post only after approval (TikTok first, then YouTube Shorts), using `delivery/post.json`.
