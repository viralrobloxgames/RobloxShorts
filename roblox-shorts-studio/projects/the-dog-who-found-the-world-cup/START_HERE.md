# The Dog Who Found The World Cup: resume notes

Standalone true story (one part), found through general research, not OddFrame's list. On Sunday 20 March 1966,
four months before England hosted the World Cup, the Jules Rimet Trophy was stolen from a guarded glass case at a
stamp exhibition in Westminster. A GBP 15,000 ransom demand led to an arrest at the handover, but the man said he was
only a middleman and the cup stayed missing. A week after the theft a collie called Pickles pulled a newspaper parcel
from under a hedge in south London; his owner feared a bomb, tore it and read "Brazil, West Germany, Uruguay". Police
made the owner their prime suspect and questioned him until 2:30 a.m. England won that summer and Pickles licked the
players' plates at the victory dinner. In 1983 the trophy was stolen again in Rio and never found. Max plays the owner.
Facts, beats and sources: `source/story.md`.

## State
- 2026-10-05: script v1 (160 words) **approved** ("Make it").
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`), `tighten_clips.py` (50.6 -> 49.1 s),
  joined with `narrate.py --voice george_c --beat 0.9 --gap 0.45` = **62.1 s speech** (words end 61.98 s). Video = speech +
  2.0 s end card = 64.0 s (1920 frames), + 0.5 s cover = **64.5 s**. Whisper writes "£15 ,000" and "17": fixed in captions
  with `word_fixes` and in `source/beats.py` with an alias table.
- Pickles: new pack creature `animal_collie_parts` (`assets/roblox_pack/tools/cut_collie.py`: the pack golden retriever cut
  into hinged parts and recoloured black and white), scale 0.62, red collar, tongue and medal attached to the head.
- Web route: `web/cup_clip.js` (26 shots), `web/kit.js` (Beulah Hill street with the hedge hollow, the stamp-exhibition hall
  with the glass cabinet, the football boss's office with a rotary phone and the ransom note, the park, the police
  station (desk, interview room with the racing wall clock, line-up wall), the stadium, the victory dinner, Rio 1983
  with the cabinet's wooden back forced open; props: trophy with the engraved BRAZIL / WEST GERMANY / URUGUAY plate,
  newspaper parcel (wrapped and torn), small parcel, warrant card, plates, crowbar). Clothing shells via `dress()` /
  `kit()`: Max's work jacket, Skye's guard uniform, Mia's trench, Leo's suit and red No. 6 shirt, the Noob's coat;
  recoloured Noobs wear guard, police, red kit or dinner-suit shells. No pack accessories (fit check: 0 pairs, reviewed).
- Hold check: `web/hold_check.js` (12 close-ups, looked at; the trophy is held by its base, the parcel between the fists,
  the phone handset in Leo's hand).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (71 cues; `audio/sfx/woof.wav` synthesised, tonal; no
  applause or paper noise). Music: playful_history_music.
- Cover: `web/cover_clip.js`, `delivery/The_Dog_Who_Found_The_World_Cup_cover.jpg|png`, grid check `_cover_grid.jpg`.
  Post copy: `delivery/post.json`.
- Full render running (renders/web, 4 workers, ~3.7 s/frame, ~2 h).

## Commands
```
python3 source/beats.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/the-dog-who-found-the-world-cup/web/cup_clip.js --out projects/the-dog-who-found-the-world-cup/renders/web --workers 4 --resume
node web/render.mjs --clip projects/the-dog-who-found-the-world-cup/web/cover_clip.js --out projects/the-dog-who-found-the-world-cup/renders/cover --frames 1 --skip-fit-check
python3 scripts/finish.py projects/the-dog-who-found-the-world-cup --encode --frames projects/the-dog-who-found-the-world-cup/renders/web
python3 scripts/review/blank_frames.py projects/the-dog-who-found-the-world-cup/delivery/The_Dog_Who_Found_The_World_Cup.mp4
python3 scripts/post_md.py projects/the-dog-who-found-the-world-cup
```

## Next
1. Finish the render, encode, blank-frame check, review contact sheet, deliver for the user's review. Post only after approval.
