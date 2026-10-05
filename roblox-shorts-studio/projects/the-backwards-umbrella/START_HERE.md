# The Backwards Umbrella: resume notes

Standalone story (one part). When Leo's umbrella is open, it rains everywhere except under it. It soaks his friends;
sharing only fits three (the Noob gets a private thunderstorm); then Max's barbecue goes up like a volcano and the rain
saves the park. Mia ducks under: "Room for one more?"

## State
- 2026-10-05: script v1 (`script.txt`, 152 words) **approved** ("Approved, make the video").
- Narration: George voice C (1.7B, cloud, `scripts/qwen_cloud_george_c.py --take take-01`), tightened, joined with
  `narrate.py --beat 0.5` = **60.3 s speech**; all words heard. Video 61.9 s + 0.5 s cover = 62.4 s (61-65 s rule).
- Web route: `web/umbrella_clip.js` (cast, weather timing, fire spread, 21 shots), `web/kit.js` (park, barbecue, umbrella,
  rain/splashes, clouds and bolt, fire/steam sprites, wet materials). Beats: `source/beats.py` -> `web/beats.js`.
  Weather is a pure function of time: `OPEN` windows drive the umbrella, the storm, the sky and the rain sound; wetness
  is integrated from them in 0.1 s steps (rain + not under the umbrella soaks, sun or cover dries).
- Crowd: 12 Noob-rig players with their own shirt/pants/skin colours + Skye. No accessories (fit check: 0 pairs, reviewed).
- The pack golden retriever faces +X at rest (not +Z): see the dog's rotation in `update()`.
- Sound: `source/sfx_assets.py` (synthesized rain loop, thunder, zap, fwoomp, fire loop, hiss, pop, boing, applause,
  shake) -> `source/sound_cues.py` -> `source/sound_cues.json`.
- Cover: `web/cover_clip.js` (Leo dry in the downpour, HIS UMBRELLA / RAINS ON / EVERYONE ELSE). Post copy: `delivery/post.json`.
- Full render done 2026-10-05 (`renders/web`, 1857 frames, verified). Encoded: `delivery/The_Backwards_Umbrella.mp4`,
  62.4 s incl. the 0.5 s cover at the end, -16.6 LUFS, validated; `_post.md` written. Preview sent for approval. v2: Mia moved clear of Leo's umbrella arm (squeeze + ending), Max a half step behind; rain/fire loops cut on cue. Frames 552-800 and 1500-1857 re-rendered, re-encoded (62.4 s).
- Disk: the encode filled the disk; the render frames of Whatever Mia Draws and Every Lie Comes True (both scheduled,
  MP4s in delivery/) were deleted to make room. Re-render them from their clips if ever needed.

## Next
1. User review of the full video. Re-encode after any fix: `python3 scripts/finish.py projects/the-backwards-umbrella --encode --frames projects/the-backwards-umbrella/renders/web`.
   Post only after approval (TikTok, then YouTube).

## Commands
```
python3 source/beats.py && python3 source/sfx_assets.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/the-backwards-umbrella/web/umbrella_clip.js --out projects/the-backwards-umbrella/renders/web --workers 4 --resume
node web/render.mjs --clip projects/the-backwards-umbrella/web/cover_clip.js --out <dir> --frames 1   # cover
```
