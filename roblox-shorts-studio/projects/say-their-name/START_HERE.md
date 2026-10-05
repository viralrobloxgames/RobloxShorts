# Say Their Name: resume notes

Standalone story (one part). In this obby, saying a player's name teleports them next to you; first to the top wins a
million coins. Leo and Max keep summoning each other back down, Leo's "Steve" name tag lasts one line, and Mia summons
both boys into mid-air over the lava. Then she tries to summon the Noob, whose username takes so long to say that he
wins before she finishes, and her "...nine" teleports him to her, holding a million coins.

## State
- 2026-10-05: script v1 (`script.txt`, 155 words) **approved** ("approved, make the video").
- Narration: George voice C (1.7B, cloud, `scripts/qwen_cloud_george_c.py --take take-01`), tightened, joined with
  `narrate.py --beat 0.5` = **62.0 s speech** (speech end 61.82). Video 63.43 s + 0.5 s cover = **63.9 s** (61-65 s rule).
  Whisper flags were checked: "Leo?" in line 12 is there (small.en hears it); the username line says "X underscore..."
  with the two opening X's run together (a redo gave the same read; kept).
- Web route: `web/tower_clip.js` (cast timelines, teleports, 37 shots, overlay: name tags, chat, bubbles, display-name
  editor, CTA), `web/kit.js` (spiral tower: 12 steps twice round a pillar, top + coin pile + 1,000,000 COINS board,
  plank over the lava from step 7, rule board, lava sea). Beats: `source/beats.py` -> `web/beats.js`.
- Story logic note: after Max says "Steve!", Leo switches his tag back to "Leo" (sparkle, `T.unsteve`), so Mia's
  "Max? Leo?" still works by the rule.
- Fit check: no accessories (0 pairs), reviewed.
- Sound: `source/sfx_assets.py` -> `source/sound_cues.py` -> `source/sound_cues.json`.
- Full render started 2026-10-05 into `renders/web` (1903 frames).

## Next
1. Finish the render, cover (`web/cover_clip.js`), sound cues, encode, post copy; send for review.
   Post only after approval (TikTok, then YouTube).

## Commands
```
python3 source/beats.py && python3 source/sfx_assets.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/say-their-name/web/tower_clip.js --out projects/say-their-name/renders/web --workers 4 --resume
node web/render.mjs --clip projects/say-their-name/web/cover_clip.js --out <dir> --frames 1   # cover
python3 scripts/finish.py projects/say-their-name --encode --frames projects/say-their-name/renders/web
```
