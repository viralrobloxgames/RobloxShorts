# Shared kit contract (read before writing any kit or chapter code)

Every chapter imports the kit and nothing else for cast, wardrobe, sets, lighting, props, cards and camera rules. No
chapter overrides a kit look. Ids come from `../source/boundary_sheet.md` and `../source/story.md` (Sets). If the kit
lacks something a chapter needs, the chapter session adds it to the kit (small, additive, documented in `web/kit/README.md`),
never a private copy.

## Files (project folder `projects/i-secretly-lived-in-my-enemys-house/`)

| File | Owner (setup phase) | What |
|---|---|---|
| `web/kit/index.js` | K1 | re-exports everything below; chapters import only `../kit/index.js` |
| `web/kit/README.md` | K1 (all add to it) | API reference with one example per function |
| `web/kit/stage.js` | K1 | `META` = { width: 1920, height: 1080, fps: 30 }; `SKY`; `showSet(id)`; `applyLight(stage, presetId)` |
| `web/kit/lighting.js` | K1 | presets `night_moon`, `school_day`, `dusk`, `predawn`, `night_fridge`, `attic_afternoon`, `midnight`, `sunday_morning`; plus practicals on/off (bedside lamp, fridge light, flashlight beams, phone glow, glow sticks) |
| `web/kit/camera.js` | K1 | camera rules: `camOn(stage, actor, framing, opts)` (framing `cu`, `mcu`, `ms`, `ws`), `twoShot(stage, a, b, opts)`, `overShoulder(stage, from, to, opts)`; the camera is on whoever speaks; cuts never cross the 180-degree line of a scene |
| `web/kit/overlay.js` | K1 | `dayCard(g, s, t, { day, time })` (full width, about 2 s, from frame 0 of Ch2-11), `timeStamp(g, s, text)` (small, top left), `redCircle(g, s, t, x, y, r)`, `endScreen(g, s, t)` (SUBSCRIBE @viralrobloxgames, clear space for YouTube end-screen elements) |
| `web/kit/cast.js` | K2 | `loadCast(scene)` → `{ skye, max, dad, lily, extras }`; `dress(actor, wardrobeId)` for every boundary-sheet wardrobe id; every face the script uses preloaded for every character; Dad = Leo rig at ~1.12 with dark-brown hair; Lily = Mia rig at ~0.78 with her black ponytail; Lily's teddy |
| `web/kit/props.js` | K2 | `makeProp(id)` for every prop id in the boundary sheet and the script; `hold(prop, actor, hand, mode)` at the measured palm (see below); `carry2(prop, actor)` for two-handed things |
| `web/kit/sets/*.js` | K3 | `bedroom`, `hallway`, `attic`, `kitchen`, `classroom`, `exterior` |
| `scripts/narrate_multi.py`, `assets/audio/voices/*` | V | see `NARRATION_SPEC.md` |
| `scripts/finish_longform.py`, `scripts/stitch_longform.py` | K1 | chapter mix + captions + encode; final stitch (see below) |

## Sets

Each set module exports `build(scene)` returning `{ id, group, marks, cams, lights, setState(state) }`:
- world offsets so sets never overlap: bedroom (0,0,0), hallway (300,0,0), attic (600,0,0), kitchen (900,0,0),
  classroom (1200,0,0), exterior (1500,0,0); floor at y 0 (the attic floor is its own y 0);
- `marks`: named standing/sitting spots `{ pos: Vector3, heading }` (e.g. `closet_inside`, `bed_sit`, `fridge`, `island_stool_1`,
  `pantry_slats`, `desk_skye`, `desk_max`, `nest`, `hatch_top`, `ladder_foot`, `stairs_top`), with heading in the cast's
  convention (forward = (sin h, 0, cos h));
- `cams`: named camera set-ups `{ pos, target, fov }` for the shots the script needs (e.g. bedroom `closet_pov` for the
  Ch1 hook, `two_shot_bed_closet`);
- `lights`: practical lights the lighting presets switch;
- `setState(state)`: the persistent things from the boundary sheet ("Things that persist across the week"): fridge
  letters (any string), pancake count, garlic on Max's window, attic boxes/decorations/tea set/pumpkin/vacuum by chapter,
  glow sticks, the nest. A chapter calls `setState({ chapter: 5, ... })` and gets the right state.
Rooms are open on the camera side or have removable walls (`group.userData.walls`) so cameras never sit inside geometry.
The sets match the descriptions in `source/story.md` (Sets table) and every action line in `script.txt`.

## Cast, faces, props

- Heading convention: `actor.root.rotation.y = heading`, forward = (sin h, 0, cos h). Walks are real moves at walk ~12 /
  run ~16 studs/s with the leg cycle driven by distance (`web/lib/locomotion.js`), never walking on the spot.
- Faces: the pack names in the boundary sheet (`scared`, `suspicious`, `scheming`, `nervous`, `happy`, `annoyed`,
  `shocked`, `smug`, `surprised`, `determined`, `crying`, `sad`, `shouting`, `laugh`, plus `talking`, `mouth_o`,
  `neutral`). While a character speaks, alternate their face with `talking` / `mouth_o` on the word timings (kit helper
  `speak(actor, face, t, words)`).
- Held props sit in the palm: grip point `V(sd === 'R' ? -0.5 : 0.5, -1.3, 0)` in the arm bone's frame (scaled by the
  actor's scale); a prop held out in front of a raised arm goes just past the fist at `(-+0.5, -1.75, 0)`. Two-handed
  things run into both fists. Every chapter lists its held props in `web/chNN_hold.js` and looks at the close-ups.
- Accessories only via `wear()` / `fitAccessory()` (`web/lib/robloxPack.js`); fit check per chapter before its render.
- No two-arms-up poses (SKILL.md); Ch7's scarecrow pose is arms out at shoulder height.

## Finishing (K1)

- `scripts/finish_longform.py <project> --chapter N [--encode --frames <dir>]`: narration from `audio/chapters/chNN/`,
  the chapter's SFX cues (`source/sound/chNN.json`, same cue format as Shorts), **no music**, a limiter but no loudness
  normalisation; captions burned in at 1920x1080 with the speaker's colour (VO/SKYE pink, MAX teal, DAD amber, LILY
  yellow; VO italic), lower third, never over a face; encode with the one fixed setting every chapter uses (libx264,
  1920x1080, 30 fps, yuv420p, the same CRF/preset/profile/GOP; AAC 48 kHz) to `delivery/chapters/chNN.mp4`.
- `scripts/stitch_longform.py <project>`: concatenates the chapter MP4s (video stream-copied if the settings match, else
  re-encoded once), decodes and joins their audio into one track, lays the music bed once, one loudness pass for YouTube
  (-14 LUFS, -1 dBTP), writes `delivery/<Title>.mp4`, the YouTube chapter list from the chapter start times, and checks
  the seams (no gap, no duplicated frame, A/V in sync).
- Proof first (K1): a 3 s 16:9 clip through render → finish → encode, then two clips encoded separately and stitched, to
  prove the seams are clean.

## Speed-up (K1)

`web/render.mjs` copies the previous PNG instead of rendering when a frame's fingerprint (`window.frameState`) equals the
previous frame's. Chapters get it by holding poses between lines (kit helper `hold()`; idle motion off while held) and
keeping cameras still within a held moment. Measure on the proof clip: render s/frame, share of frames skipped.
