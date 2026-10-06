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

## Roblox pack cast and accessories

`lib/robloxPack.js` loads the Roblox R6 pack (`assets/roblox_pack/`): `loadRobloxCharacter(name, { expressions, hairLift })`
returns an actor that `rig.js` `pose()`, `actionPose()`, `setExpression()` and `soleHeight()` drive like the old cast;
`packItem(kind, name)` loads props and map pieces.

Accessories are never placed by hand. `wear(actor, name)` (attached to the head) or `fitAccessory(actor, name)` (you place
it, e.g. a crown that drops on) fits each one to that character's hair by the rule in `ACCESSORY_FIT`:

| Rule | Items | Fitting |
|---|---|---|
| seat | crown_admin, top_hat, ranger_hat, officer_cap, pillbox_hat, postman_kepi | lowest height where it clears the hair, up to 1.35x |
| cover | cap | as low as possible, up to 1.35x; hair hidden if nothing fits |
| band | headphones | widened only (up to 1.6x across), height kept |
| float | admin_badge_halo | lowest height with nothing inside it |
| hair | hair_*, spiky_hair, long_hair, beanie (has hair built in) | replaces the character's hair |

The check behind it bins the accessory's surface by angle around the head and by height; in every bin the accessory
occupies, no hair or head surface may sit more than 0.02 studs further out.

### Accessory fit check (required before a full render)

```
node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js            # numbers + fit_check/fit_sheet.png next to the clip
node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js --reviewed # after looking at every view on the sheet
node web/fit_check.mjs --all                                           # whole pack: every character x every accessory
```

It runs the clip's own `setup()` (so character options such as `hairLift` apply), refits every accessory the clip's
characters wear, and renders front / three-quarter / side / back head close-ups with PASS/FAIL, depth and scale on
each. Numbers passing is not enough: look for hair or head showing through, items floating or oversized, and anything
that reads wrong from the back. `render.mjs` refuses a full render (no `--frames`) of a pack clip unless
`fit_check/fit_check.json` exists, passed, is marked reviewed, and matches the current clip, `robloxPack.js`,
`fit_check_clip.js` and pack catalog. `--skip-fit-check` exists for tests only, never for a delivery.

## Render, review, finish

```
# quick previews: half size, one sample, a few frames
node web/render.mjs --clip projects/<slug>/web/<clip>.js --out /tmp/prev --frames 1,60,120 --scale 0.5 --samples 1 --workers 2
# accessory fit check (see above), then full quality; --resume continues a stopped render
node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js && node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js --reviewed
node web/render.mjs --clip projects/<slug>/web/<clip>.js --out projects/<slug>/renders/web --workers 2 --resume
python scripts/finish.py <project dir> --encode --frames projects/<slug>/renders/web
```

The cost is about 2.3 s per sample at 1080 x 1920 on 4 CPU cores: 3 samples for static shots and 6 for motion blur.
A 10 s clip takes about 30 minutes.

## Compared with the Blender + GarageFarm route

- Every frame can be previewed before the full render, so framing and contact problems are fixed before rendering. The Blender route relies on numeric checks and paid farm tests.
- No farm cost and no multi-gigabyte download.
- Lighting is a little simpler than EEVEE (no area lights or soft GI). Ambient occlusion, soft shadows, sky lighting and bloom cover most of the difference for block characters.
