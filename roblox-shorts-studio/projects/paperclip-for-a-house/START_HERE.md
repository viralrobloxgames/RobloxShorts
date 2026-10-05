# He Traded A Paperclip For A House: resume notes

Standalone true story (one part), taken from one of OddFrame's best-performing Shorts ("He Traded a Paperclip for a
House", 25K views) at the user's request. In 2005-06 Kyle MacDonald traded one red paperclip up through 14 trades
(fish pen, doorknob, camp stove, generator ... a year's rent, an afternoon with Alice Cooper, a KISS snow globe that
everyone called the dumbest trade ever) until actor Corbin Bernsen, a snow-globe collector, gave a movie role for the
globe and the town of Kipling, Saskatchewan gave a house for the role. Max plays the trader. Facts, beats and sources:
`source/story.md`.

## State
- 2026-10-05: script v1 (158 words) **approved** ("approved, make the video").
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py`, joined with
  `narrate.py --voice george_c --beat 1.1 --gap 0.5` = **59.2 s speech** (the default 0.42/0.85 gave 56.8 s, under the
  61-65 s rule, so the pauses were opened up rather than changing the approved words). Video = speech + 2.0 s end card
  = 61.2 s, + 0.5 s cover = **61.7 s**.
- Web route: `web/paperclip_clip.js` (20 shots), `web/kit.js` (street with the four traders' houses, trading plaza
  with pedestal and arch, snow-globe room with ~280 instanced globes and one glowing empty slot, Kipling with WELCOME
  sign, audition stage and the two-storey house with the giant paperclip in the yard; every traded item as a prop).
  Beats: `source/beats.py` -> `web/beats.js`. Overlays: post card (hook), Roblox-style TRADE #n window with ACCEPT
  ticks per trade, a paperclip -> house progress bar (drops on the snow globe, DOWNGRADE!), the chat flood, the
  6,000+ counter, 1 YEAR / 14 TRADES, the CTA card.
- Staging rule used everywhere: Max on the left facing +x hands over with his right hand, the other trader on the right
  facing -x with the left hand, so the hands meet on the camera side; two-handed boxes (stove, generator) are sized to
  fit between the forearms. Hold check: `web/hold_check.js` (32 close-ups, reviewed). Fit check: 0 pairs, reviewed.
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (sfx copied from Google). Music: playful_history_music.
- Cover: `web/cover_clip.js` (Max on the porch holding up a giant paperclip, house behind, giant paperclip sculpture;
  HE TRADED / 1 PAPERCLIP / FOR A HOUSE), `delivery/He_Traded_A_Paperclip_For_A_House_cover.jpg|png`, grid check
  `_cover_grid.jpg`. Post copy: `delivery/post.json`.

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/paperclip-for-a-house/web/paperclip_clip.js --out projects/paperclip-for-a-house/renders/web --workers 4 --resume
node web/render.mjs --clip projects/paperclip-for-a-house/web/cover_clip.js --out projects/paperclip-for-a-house/renders/cover --frames 1
python3 scripts/finish.py projects/paperclip-for-a-house --encode --frames projects/paperclip-for-a-house/renders/web
python3 scripts/review/blank_frames.py projects/paperclip-for-a-house/delivery/He_Traded_A_Paperclip_For_A_House.mp4
```

## Next
1. Full render (running), encode, blank-frame check, review contact sheet, deliver for the user's review. Post only after approval.
