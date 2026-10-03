# Which Max Is Real? (After Hours horror, Part 2 of 2: the finale): resume notes

Concludes `projects/the-server-says-one` (Part 1). Same set, same rules, same voice (George voice C, Qwen3-TTS 1.7B).
Script approved 2026-10-03 (162 words). Web route; cast Max, the copy (Max mirrored, `mirror: true`), Mia.

## How it works
- `web/timeline.js`: every actor's state as a pure function of real time, keyed to narration words (`web/beats.js`
  from `source/beats.py`). **Staged in the lobby** (v2, after review: the 12-stud corridor forced cameras too close in
  portrait). Mirror physics as in Part 1: Max walks backwards (+z) and the mirror walks back (-z) to the EXIT door, which
  here opens INTO the lobby (door root rotated 180). One ceiling light dies per step; red glitch while it fights; it is
  dragged then flung into the corridor; Mia slams the door and holds it while it rattles.
- `source/score.py` -> `audio/score.wav`: original synthesized suspense score timed to the events (drone, cluster pad,
  heartbeat on the steps, risers, stingers, sprint toms, real silence at "it stopped"); it is the finish music bed.
- `web/finale_clip.js`: set, cameras (`SHOTS`), lights, overlays (player list, LEFT/RIGHT, MIRROR line, hand rings,
  star ring, REAL/COPY, delay readout, CTA). `web/cover_clip.js`: the cover.
- `source/sound_cues.py`: SFX from the same events.

## Build / render
```
cd roblox-shorts-studio
python3 projects/which-max-is-real/source/beats.py && python3 projects/which-max-is-real/source/score.py && python3 projects/which-max-is-real/source/sound_cues.py
python3 scripts/finish.py projects/which-max-is-real
node web/fit_check.mjs --clip projects/which-max-is-real/web/finale_clip.js        # then --reviewed
node web/render.mjs --clip projects/which-max-is-real/web/finale_clip.js --out projects/which-max-is-real/renders/web --workers 3 --resume
python3 scripts/finish.py projects/which-max-is-real --encode --frames projects/which-max-is-real/renders/web
```

## Delivered
- `delivery/Which_Max_Is_Real.mp4` (65.8 s, 1080x1920, validated), cover, captions, `post.json`.

## Next
- Post only after the user approves (TikTok, then YouTube), after Part 1 is up.
