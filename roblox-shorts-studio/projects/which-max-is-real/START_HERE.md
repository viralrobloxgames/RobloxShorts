# Which Max Is Real? (After Hours horror, Part 2 of 2: the finale): resume notes

Concludes `projects/the-server-says-one` (Part 1). Same set, same rules, same voice (George voice C, Qwen3-TTS 1.7B).
Script approved 2026-10-03 (162 words). Web route; cast Max, the copy (Max mirrored, `mirror: true`), Mia.

## How it works
- `web/timeline.js`: every actor's state as a pure function of real time, keyed to narration words (`web/beats.js`
  from `source/beats.py`). Mirror physics as in Part 1: the copy moves the opposite way along the line between them, so
  Max walking backwards walks it back towards the EXIT door. The backwards sprint is one eased curve (slow motion that
  never rewinds). The door starts open (the copy came through it in Part 1's blackout).
- `web/finale_clip.js`: set, cameras (`SHOTS`), lights, overlays (player list, LEFT/RIGHT, MIRROR line, hand rings,
  star ring, REAL/COPY, delay readout, CTA). `web/cover_clip.js`: the cover.
- `source/sound_cues.py`: SFX from the same events.

## Build / render
```
cd roblox-shorts-studio
python3 projects/which-max-is-real/source/beats.py && python3 projects/which-max-is-real/source/sound_cues.py
python3 scripts/finish.py projects/which-max-is-real
node web/fit_check.mjs --clip projects/which-max-is-real/web/finale_clip.js        # then --reviewed
node web/render.mjs --clip projects/which-max-is-real/web/finale_clip.js --out projects/which-max-is-real/renders/web --workers 3 --resume
python3 scripts/finish.py projects/which-max-is-real --encode --frames projects/which-max-is-real/renders/web
```

## Delivered
- `delivery/Which_Max_Is_Real.mp4` (65.8 s, 1080x1920, validated), cover, captions, `post.json`.

## Next
- Post only after the user approves (TikTok, then YouTube), after Part 1 is up.
