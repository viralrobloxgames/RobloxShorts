# Web renderer (no Blender, no render farm)

A second picture route for Roblox Shorts. Scenes are written in JavaScript with three.js and rendered frame by frame
in headless Chromium using software WebGL, so it runs anywhere Node and Chromium run, including a cloud session with
no GPU. Audio, captions and the MP4 still go through `scripts/finish.py` and `scripts/export.py`.

| Piece | What |
|---|---|
| `lib/rig.js` | Max, Mia and Leo: a port of `scripts/characters.py` (same geometry, palettes, pivots, 6 expressions, `actionPose` clips) |
| `lib/world.js` | stage: renderer, soft sun shadows, sky image lighting, ambient occlusion, bloom; studded parts, spawn pad, signs, checkpoint, clouds, crown, ForceField |
| `lib/anim.js` | easing, keyframe `track`, `shotAt` for shot lists; everything is a pure function of time |
| `lib/overlay.js` | 2D layer drawn on each frame: captions (Luckiest Guy), admin timer HUD, Roblox-style chat, speed lines, flashes |
| `runner.html` | loads a clip, renders one frame per call: jittered sub-samples for anti-aliasing, spread over the shutter for motion blur |
| `render.mjs` | drives Chromium and writes `web_0001.png ...` |
| `examples/lineup.js` | cast check against `assets/Character_Lineup.png` |

## Setup

```
cd web && npm install
```

It uses Playwright's Chromium (`CHROMIUM_PATH` overrides the default `/opt/pw-browsers/chromium`) and FFmpeg.

## A clip

A clip module exports `meta` (`seconds`, `fps`), optional `sky`, `setup(stage)`, `update(t, stage)` (pose everything and
place the camera for time `t`), and optionally `overlay(ctx, scale, t)`, `samples(t)` and `shutter(t)`.
See `projects/the-sixty-second-admin/web/speed_clip.js`.

## Render, review, finish

```
# quick previews: half size, one sample, a few frames
node web/render.mjs --clip projects/<slug>/web/<clip>.js --out /tmp/prev --frames 1,60,120 --scale 0.5 --samples 1 --workers 2
# full quality
node web/render.mjs --clip projects/<slug>/web/<clip>.js --out projects/<slug>/renders/web --workers 3
python scripts/finish.py <project dir> --encode --frames projects/<slug>/renders/web
```

The cost is about 2.3 s per sample at 1080 x 1920 on 4 CPU cores: 3 samples for static shots and 6 for motion blur.
A 10 s clip takes about 30 minutes.

## Compared with the Blender + GarageFarm route

- Every frame can be previewed before the full render, so framing and contact problems are fixed before rendering. The Blender route relies on numeric checks and paid farm tests.
- No farm cost and no multi-gigabyte download.
- Lighting is a little simpler than EEVEE (no area lights or soft GI). Ambient occlusion, soft shadows, sky lighting and bloom cover most of the difference for block characters.
