# Shared kit (API reference)

Chapters import only the kit: `import * as K from './kit/index.js';` (from `web/chNN.js`). Every chapter starts from
`web/ch_template.js`. Contract: `production/KIT_SPEC.md`. All roles append their section here; one example per function.

## index.js / sets/index.js (kit-pipeline)

`index.js` re-exports `stage.js`, `lighting.js`, `camera.js`, `overlay.js`, `cast.js`, `props.js`, and the set modules as
`K.sets.bedroom`, `K.sets.hallway`, `K.sets.attic`, `K.sets.kitchen`, `K.sets.classroom`, `K.sets.exterior` (each with
`build(scene) -> { id, group, marks, cams, lights, setState(state) }`).

`sets/index.js` loads each set module on its own: a missing or broken one comes back `null` with a console warning, and
`buildSets()` puts a box room in its place, so chapters can be blocked out before every set lands.

**Name rule for all kit files:** `index.js` re-exports everything with `export *`, so two kit files exporting the same
name makes that name silently undefined. Before adding an export, grep the other kit files for it.

## The chapter pattern (`web/ch_template.js`, kit-pipeline)

Copy `web/ch_template.js` to `web/chNN.js`: set `CH`, `CARD`, `EST` (estimated lines; replaced automatically by
`audio/chapters/chNN/lines.json` + `captions.json` when they exist), the shot table (keyed to spoken-line indexes as in
lines.json, plus an offset) and the per-set blocking in `update()`. Preview:
`node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js --out /tmp/chNN --frames 1,60,120 --scale 0.5`
(from `roblox-shorts-studio/`). Captions are not drawn by the clip: `scripts/finish_longform.py` burns them in.

## stage.js (kit-pipeline)

| Export | Example |
|---|---|
| `META` `{ width: 1920, height: 1080, fps: 30 }`, `FPS`, `V(x,y,z)` | `new THREE.Vector3` shorthand |
| `chapterMeta(seconds)`, `chapterLength(L)` | `export const meta = K.chapterMeta(K.chapterLength(L));` (last line + 0.75 s, at least the narration's length; rounded up to whole frames) |
| `SKY` | `export const sky = K.SKY;` (the preset recolours it each frame) |
| `frameAt(t)`, `timeOf(frame)` | frame numbers are 1-based: frame f is at t = (f-1)/30 |
| `SET_IDS`, `SET_ORIGIN` | world offsets of the six sets |
| `buildSets(stage, ids)` | `await K.buildSets(stage, ['bedroom', 'classroom'])` in `setup()`; only the sets the chapter uses |
| `showSet(id)` → set | `const set = K.showSet('bedroom')` every frame; hides the other sets |
| `getSet(id)`, `currentSet()` | `K.getSet('attic').marks` |
| `setState(state)` | `K.setState({ chapter: 5 })` once in setup (or per frame when the state changes inside the chapter) |
| `mark(setId, name, fallback?)` → `{ pos, heading }` | `K.mark('bedroom', 'closet_inside', { pos: V(-6,0,6), heading: 2.7 })` (fallback = offset from the set origin, used with a warning until the set has the mark) |
| `boxRoom(id)` | the placeholder room |
| `loadLines(import.meta.url, ch, EST)` → `L` | top level of the clip: `const L = await K.loadLines(import.meta.url, 4, EST);` `L.lines` (`index` 1-based as in lines.json), `L.words` (each with `speaker`), `L.end`, `L.duration`, `L.measured`, `L.line(i)`, `L.said('MAX')`, `L.speakerAt(t)` |
| `holdClock(t, L, extra?)` (the "hold()" of KIT_SPEC: `hold` itself is props.js's prop-in-hand helper) | `K.playAnim(a, [[A.idle, K.holdClock(t, L)]])`: idle motion runs only while someone speaks (plus `extra` [t0, t1] ranges), so silent held moments repeat frames exactly and render.mjs skips them |
| `loadAnims(names)` | `const A = await K.loadAnims(['idle', 'walk', 'run'])` (pack animations) |
| `playAnim(actor, layers)` | `K.playAnim(C.max, [[A.idle, idle], [A.point, 0.4, 0.5, false]])` |
| `putOn(actor, at, { heading, sit, visible })` | `K.putOn(C.skye, K.mark('attic', 'nest'))`; feet on the mark's floor unless `sit` |
| `walk(actor, A, from, to, t0, t, { speed, idleAt, endHeading })` | `K.walk(C.max, A, M.bed(), M.door(), at(3), t)`; walk 12 / run 16 studs/s, legs driven by distance |
| `only(C, names)` | `K.only(C, ['max', 'skye'])`: everyone else hidden |

## lighting.js (kit-pipeline)

`applyLight(stage, presetId, { set, practicals })` every frame. Presets: `night_moon`, `midnight`, `night_fridge`
(practical `fridge_light` on), `predawn` (`ceiling_light` on), `school_day`, `dusk`, `attic_afternoon`, `sunday_morning`.
`K.applyLight(stage, 'night_moon', { set, practicals: { bedside_lamp: true } })` switches the set's practicals: every
light in `set.lights` is off unless the preset or `practicals` turns it on (true/false or an intensity factor).

| Export | Example |
|---|---|
| `PRESETS` | the numbers; change a look here (for every chapter), never in a chapter |
| `setPractical(set, name, on)` | `K.setPractical(set, 'bedside_lamp', true)` (sets: `light.userData.bulb` = emissive mesh(es) switched with it); `on` may be a 0..1 factor for ramps, e.g. the fridge light with the door: `practicals: { fridge_light: doorOpen }` |
| `flashlightBeam(stage, opts)` → `{ set(on, from, dir), fromProp(on, prop, axis?) }` | `beam.fromProp(true, P.torch)` each frame (the held prop's world position, along its local +z or `axis`); `beam.set(true, pos, dir)` by hand; opts `cone: false` (no visible cone), `intensity`, `distance`, `angle` |
| `chinLight(stage)` → `{ set(on, actor) }` | Ch6 torch under the chin: `chin.set(true, C.skye)`: warm up-light below the face, no cone |
| `phoneGlow(stage)` → `{ set(on, pos) }` | `glow.set(true, phonePos)` |
| `glowSticks(stage, n)` → `{ set(on, [pos, ...]) }` | `sticks.set(true, [wristL, wristR])` |

## camera.js (kit-pipeline)

The camera is on whoever speaks. Call one camera function per frame, last in `update()` (after posing).
`K.setBlockers(set.group, C.skye, C.max)` each frame: a removable wall (`set.walls` / `group.userData.walls`) between a
camera and its subject is hidden for that frame (dollhouse); any other solid thing or actor in the way pulls the camera
in front of it. Light shafts, particles, additive / see-through meshes and `userData.noCamBlock` objects never block.
Shots inside tight spaces (the closet, under the island) use the set's named cams via `setCam`. `K.setLine(a, b, side)` once per scene: two-shots, over-the-shoulders and singles stay on that
side of the line a→b (no 180-degree crossing); if a single would cross, its angle is mirrored.

| Export | Example |
|---|---|
| `camOn(stage, actor, framing, opts)` | `K.camOn(stage, C.max, 'mcu', { angle: 0.35, fov: 35 })`; framings `cu` (whole head), `mcu` (head and shoulders), `ms` (waist up), `ws` (full body + room); opts `angle`, `height`, `fov`, `dist`, `zoom`, `look`, `apply:false` |
| `twoShot(stage, a, b, opts)` | `K.twoShot(stage, C.max, C.skye, { framing: 'ms', bias: 0.5 })` |
| `overShoulder(stage, from, to, framing, opts)` | `K.overShoulder(stage, C.skye, C.max, 'mcu')`: over Skye's shoulder onto Max |
| `setCam(stage, cam)` | `K.setCam(stage, set.cams.closet_pov)` a set's named camera; hides the walls in its `hide` list; clears against the set only (never actors) |
| `blendShot(a, b, u)`, `applyShot(stage, shot)` | push-in: `K.applyShot(stage, K.blendShot(K.camOn(stage, a, 'ms', { apply: false }), K.camOn(stage, a, 'cu', { apply: false }), u))` |
| `drift(shot, t, amp)` | handheld feel for tense shots |
| `headPos(actor)`, `screenOf(stage, p)` → `{ x, y, visible }` (1920x1080) | `K.screenOf(stage, K.headPos(C.skye))` for a red circle |
| `faceTo(from, to)` → heading | `K.putOn(C.max, m, { heading: K.faceTo(m, C.skye) })` |
| `setLine(a, b, side)`, `clearLine()`, `setBlockers(...)`, `clearShot(...)`, `FRAMINGS` | |

## overlay.js (kit-pipeline)

Coordinates are 1920x1080 units times `s`. The lower third (y > 760) belongs to the burned-in captions.

| Export | Example |
|---|---|
| `dayCard(g, s, t, { day, time })` | `K.dayCard(g, s, t, { day: 'TUESDAY', time: '6:04 AM' })` in `overlay()` of Ch2-11: full-width band across the top (y 35-265) from frame 0 for 2.1 s; frame the first shot's faces below it |
| `timeStamp(g, s, text)` | `K.timeStamp(g, s, 'MONDAY 12:15 PM')` small, top left |
| `redCircle(g, s, t, x, y, r, { t0, t1 })` | `K.redCircle(g, s, t, p.x, p.y, 130, { t0: 2.5 })` hand-drawn, draws on in 0.35 s |
| `endScreen(g, s, t, { t0 })` | Ch11's last ~12 s: SUBSCRIBE @viralrobloxgames in the top band (y 40-290, darkened); **clear space for YouTube's end-screen elements: x 0-1920, y 300-1040** (the whole frame below the title) where YouTube places two video tiles and the subscribe button. The picture underneath shows through a dim; frame the cast in the top band's sides or keep them small/out of the clear space |
| `roundRect`, `OV` | |

## sets/attic.js (kit-sets-b)

`const attic = K.sets.attic.build(scene)` → `{ id, group, marks, cams, lights, items, setState, setHatch, rockChair, useCam, hatchRise, roofY }`.
World offset (600, 0, 0), attic floor y 0. A gabled room x -13..13, z -10 (back gable, round window) .. 14 (front
gable); ridge y 13 along z, knee walls 3 high at x ±13 (`roofY(worldX)` gives the roof underside). Cameras are all
inside the room, below the rafters (collar ties are at y ~11). Check sheets: `production/previews/kit-sets-b/`; check
clip: `web/previews/attic_preview.js` (one frame per state × cam with stand-ins).

Layout: Skye's nest under the window (x 0, z -8: two blankets, pillow, cracker packet, pink flashlight, backpack, glow
sticks); right side: HALLOWEEN box with the skeleton and the witch in front of it, XMAS, MAX - OLD STUFF, the hobby
horse leaning on XMAS; front right: the floor hatch (centre (604.5, 0, 9), hole 4.6 × 3.4, the ladder going down to the
hallway floor at y -10) and the vacuum spot; left: the upturned box table with the tea party round it, the rocking chair.

```js
attic.setState({ chapter: 5 });                                 // Ch5 start: no tea set, backpack not in the nest (she wears it)
attic.setState({ chapter: 5, hatch: 0.9 });                     // the hatch lifting (0 shut .. 1 open, or 'shut'/'open')
attic.setState({ chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' });   // the tea party (horse in Skye's hands)
attic.setState({ chapter: 7, pumpkin: false });                 // HALLOWEEN open, pumpkin on Skye's head (chapter's prop)
attic.setState({ chapter: 8 });                                 // night: moonlight, flashlight standing lit, vacuum, pumpkin on the lid
attic.setState({ chapter: 9, maxBox: 'open', rock: 0.1 });      // MAX - OLD STUFF open, the drawing on top; the chair rocked
attic.useCam(stage.camera, 'nest_to_hatch');
lily.root.position.copy(attic.marks.hatch_head_lily.pos); lily.root.rotation.y = attic.marks.hatch_head_lily.heading;
```

**setState is stateless**: each call = that chapter's defaults (boundary sheet "Things that persist") + the overrides
passed, so call it every frame with everything the moment needs. Defaults by chapter:

| key | values | default |
|---|---|---|
| `time` | `'afternoon'` (warm sun spot + dusty shafts through the round window), `'night'` (moon spot + cold shaft), `'predawn'` | Ch8 night, Ch2 predawn, else afternoon (`night: true` also works) |
| `hatch` | `'shut'`, `'open'`, 0..1 (lid angle; light comes up from the hallway when open) | shut |
| `backpack` | true = lying in the nest | false in Ch2 and Ch5 (worn), true Ch7-9 |
| `flashlight` | `'lying'`, `'standing'` (on end, lit), `'none'` | Ch8 standing |
| `tea` (`teaSet`) | teapot + 2 cups on the upturned box | true from Ch6 on; Ch5 sets it from the tea party |
| `halloween` | `'open'`, `'closed'`, 0..1 | Ch7 open |
| `pumpkin` | `'box'` (in the open box), `'lid'` (on the closed box), `'inside'`, `'none'`/false | Ch7 box, Ch8+ lid |
| `vacuum` | by the hatch | true from Ch8 (Ch7 sets it at the end) |
| `glowSticks` | true (bundle beside the nest), `'lit'` | Ch9 true |
| `maxBox` (`oldStuffOpen`) | `'open'`, `'closed'`, 0..1 | closed |
| `drawing` | `'box'` (on top inside MAX - OLD STUFF), `'none'` | Ch9 box |
| `hobbyHorse` | `'boxes'` (leaning on XMAS), `'floor'`, `'none'`/false | boxes |
| `teddies` | the two attic toys at the tea party | true from Ch5 |
| `rock` | rocking chair angle (rad, ±0.15 reads well) | 0 |
| `hide` / `show` | arrays of `items` names | |

`setHatch(k)` and `rockChair(a)` set those two directly. `items` holds every named object (`nest`, `backpack`,
`flashlight`, `crackers`, `glow_sticks`, `box_halloween`, `box_xmas`, `box_max`, `drawing`, `skeleton`, `witch`,
`pumpkin_bucket`, `hobby_horse`, `table_box`, `tea_set`, `teapot`, `cup_1`, `cup_2`, `teddy_left`, `teddy_right`,
`rocking_chair`, `vacuum`, `hatch_lid`, `ladder`, `window`, `rafters`, walls ...). Set props are the attic's own until
`props.js` has its versions.

**Marks** (world `{ pos, heading }`, sitting marks are at floor level: a floor sit puts the hips on the floor):
`nest` / `nest_sit` (Skye cross-legged, facing +z), `nest_beside` (Lily next to her, frame-right from the +z cams),
`nest_stand`, `nest_front`, `nest_backpack`, `window`; `tea_skye` (nest side, facing +z, the window behind her),
`tea_lily` (hatch side, facing -z, kneeling), `tea_teddy` / `tea_teddy_lily`, `tea_toy_1`, `tea_toy_2`, `tea_box` /
`box_table` / `tea_table` (box top, y 1.42); `rocking_chair` (seat centre, `seatY` 1.65), `rocking_chair_front`;
`decor_pose` / `decor_gap` (Ch7, between `skeleton` and `witch`, facing +z, arms out clear both), `decor_front` /
`decor_inspect` (Dad nose to nose), `decor_lily`, `box_halloween`, `box_xmas`, `box_max` / `old_stuff_box`,
`box_max_kneel`, `old_stuff_inside` (where the drawing lies), `hobby_horse`, `horse_lean`; `hatch_top` / `hatch_stand`
(standing on the floor at the hatch, facing the room), `hatch_side`, `hatch_climb` / `hatch_below` (over the hole; height
`hatchRise(scale, k)`: k 0 = below the floor, 1 = standing), `hatch_head` (scale 1), `hatch_head_lily`,
`hatch_head_dad`, `hatch_head_max` (head and shoulders up through the hatch, facing -z), `ladder_foot`, `vacuum` /
`vacuum_by_hatch`, `centre`.

**Cams** (`{ pos, target, fov, note }`): `wide`, `wide_low`, `wide_nest_hatch`, `wide_nest_to_hatch` (Ch7 start:
tea party, hatch, decorations), `nest_to_hatch` (Ch5 start), `nest_to_hatch_tight`, `hatch_to_nest`, `hatch_lily_cu`
/ `hatch_mcu`, `lily_ms`, `hatch_down` (Ch2), `hatch_wide`, `nest_ms`, `nest_cu` / `nest_mcu`, `nest_two` /
`nest_two_shot`, `nest_mcu_skye`, `nest_mcu_lily`, `nest_from_window` (Ch8), `tea_two` / `tea_party`, `tea_wide`,
`tea_wide_front`, `tea_hatch`, `tea_lily_ots`, `tea_skye_ots`, `tea_lily_cu`, `tea_skye_cu` (all tea cams on the +x side
of the Skye-Lily line), `decor_wide` / `decor_line`, `decor_ms`, `decor_cu`, `decor_to_hatch`, `decor_side`, `boxes`,
`box_max_cu` / `old_stuff`, `drawing_insert`, `rocking_nest` (Ch9), `rocking_ms`, `window`.

**Lights** (practicals; lighting.js sets the stage preset): `sun` (spot through the window) + `shafts.sun`, `moon` +
`shafts.moon`, `bounce`, `hatchGlow`, `flashlight` + `flashlightCone`, `glow` (glow sticks). `setState({ time })`
switches them; the stage hemi/env should be low inside the attic (the preview uses hemi 0.22 day / 0.1 night, env
0.18 / 0.08, stage sun off).

## cast.js (kit-cast)

Four characters + four extras, all wardrobe ids of `source/boundary_sheet.md`, faces, lip flap, poses. Clothes are painted
into each character's own R6 atlas (128 px/stud, the pack layout), so they follow the bones exactly and cannot clip; only
the ghost sheet and the backpack are meshes (parented to the bones they move with). Check sheets (front, 3/4, side,
back per look; poses; gestures; gaits; blush): `production/previews/kit-cast/*.jpg`, made by
`node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/kit/cast_turnaround.js --out /tmp/ta --frames 1-28 --scale 0.4 --samples 1`.

| Export | What / example |
|---|---|
| `loadCast(scene)` | `const C = await K.loadCast(stage.scene)` → `{ skye, max, dad, lily, extras: [4] }`, all added to the scene, dressed in their default looks (`skye_hoodie`, `max_school`, `dad_cardigan`, `lily_day`, `extras`), face `neutral`, `lily.teddy` (kit-props' `teddy`) already in her right hand. Dad = Leo rig at 1.12 with hair tinted dark brown; Lily = Mia rig at 0.78 with her ponytail tinted black. Extras: the Noob in a `cap`, then recoloured Noobs in `spiky_hair`, `long_hair`, `beanie` (all via `wear()`). Each actor has `.speaker` (`SKYE`/`MAX`/`DAD`/`LILY`), `.scale`, `.outfit`. |
| `FACES` | every face preloaded on every character: scared suspicious scheming nervous happy annoyed shocked smug surprised determined crying sad shouting laugh talking mouth_o neutral confused mouth_small. `C.max.setFace('suspicious')` |
| `WARDROBE`, `dress(actor, id \| [ids], on = true)` | synchronous and cached, so it can run inside `update(t)`. Base looks: `skye_hoodie`, `max_school`, `max_pjs`, `dad_cardigan`, `dad_apron`, `dad_robe`, `lily_day`, `lily_pjs`, `extras`. A base look on Skye also takes the sheet AND the backpack off, so give the order: `K.dress(C.skye, ['skye_hoodie', 'backpack'])`. Overlays: `K.dress(C.skye, 'backpack', false)` (take it off mid-shot), `K.dress(C.skye, 'skye_sheet')` (ghost: dome with eye holes + pink lock out at the LEFT of her face, drape to below the knees, sheet sleeves to the wrists; hides her hair and face), `K.dress(C.skye, 'glow_sticks')` (kit-props' green wrist bands on both wrists). Wrong person → throws. |
| `sheetLift(skye, u)` | Ch10 pull-off: `u` 0 → 1 lifts the sheet up and off (hair and face come back at 0.35). At 1: `K.dress(C.skye, 'skye_sheet', false)` (or `dress(skye,'skye_hoodie')`) and hand her kit-props' `bedsheet` `{ state: 'bunched' }` in her left palm. |
| `speak(actor, baseFace, t, words, { whisper })` | `K.speak(C.max, 'suspicious', t, captions.words)`: on the actor's own words (speaker match; VO never moves a mouth) alternates `talking`/`mouth_o` (every ~0.14 s inside long words), base face in the gaps. `whisper: true` alternates `mouth_small`/base. Returns the face set. |
| `blush(actor, 0..1)` | pink cheeks over any face: `K.blush(C.skye, 1)` with `nervous` for "blushing"; `K.blush(C.skye, 0)` to clear. |
| `holdTeddy(lily, mode)` | `'R'` / `'L'` (kit-props `hold(teddy, lily, hand, 'side')`, hanging at her side), `'hug'` (on her chest; pose with `posture(lily, 'hug_teddy')`), `'free'` (detached: add `C.lily.teddy` to the set and place it, e.g. beside her at the tea party). |
| `POSES`, `posture(actor, name \| dict, { mix, reset, extra })` | sets the bones (rig.js angle convention, degrees) and returns the root drop. Floor poses: `const d = K.posture(C.skye, 'sit_cross'); C.skye.root.position.y = floorY - d`. Seats: `K.posture(C.max, 'sit_chair'); C.max.root.position.y = K.seatY(C.max, seatTopY)`. Names: `stand`, `sit_chair`, `sit_upright`, `sit_slump`, `sit_desk_arms`, `chin_on_hand`, `sit_cross`, `kneel`, `kneel_up`, `crouch`, `lie_back`, `shock`, `scarecrow` (arms out at shoulder height; `mix` brings them down), `arms_folded`, `hug_teddy`, `shrug`, `lean_in`, `lean_back`, `ear_to_door`, `hip_bend` (Dad leaning in nose to nose). `mixAngles(a, b, u)` blends two dicts. |
| `ARM_GESTURES`, `gesture(actor, name, side, mix)` | one arm, layered over the current pose (call after `posture`/`robloxPose`): `K.gesture(C.skye, 'hand_over_mouth', 'L')`. Names: point, point_up, reach_up, finger_up, knock, tap, hand_over_mouth, eye_wipe, thumb_to_chest, hand_on_hip, hand_on_neck, hair_pat, phone_ear, chin_hand, hold_out, flashlight_chin, wave (static; `waveArm` in web/lib/gestures.js animates), hand_hold, cup_hold; or pass `[x, y, z]`. `mix` slerps from the current arm. |
| `gait(kind, phase)` | distance-driven gaits as a pose dict: `const m = travel(a, b, t0, t, 6); K.posture(C.skye, K.gait('creep', m.anim))`. Kinds: `walk`, `run`, `creep` (sneaky, bent forward), `skip` (Lily; returns a negative `drop` = hop), `shuffle` (sleepy Max),  `crawl` (hands and knees), `climb` (ladder, facing the rungs; phase = height climbed / 1.6). Use the drop: `root.y = floorY - drop`. |
| `SCALE`, `COLORS`, `SPEAKER`, `EXTRA_LOOKS` | constants (Dad 1.12, Lily 0.78; hair and glow colours; caption speaker labels; the extras' looks). |

Notes: walk in the sheet with the arms still or barely swinging (the drape bulges for legs and arms, but a big arm swing
reads as a tent); one arm up through the sheet (phone, left arm at shoulder height) reads as a sheet-covered arm. No
two-arms-up poses (SKILL.md): `climb` keeps both hands in front of the face, not above the head.

## Render, finish, stitch (kit-pipeline)

From `roblox-shorts-studio/` (P = `projects/i-secretly-lived-in-my-enemys-house`):

```
# render (frame skip is on: a frame identical to the previous one is copied; --no-skip turns it off)
node web/render.mjs --clip $P/web/ch03.js --out /tmp/ch03 --workers 2                     # whole chapter
node web/render.mjs --clip $P/web/ch03.js --out /tmp/ch03 --workers 2 --frames 1-1050      # segment A (helper renders 1051-end)
# encode: video only, captions burned from audio/chapters/ch03/captions.json, the one fixed encode
python3 scripts/finish_longform.py $P --chapter 3 --frames /tmp/ch03                        # -> delivery/chapters/ch03.mp4
python3 scripts/finish_longform.py $P --chapter 3 --frames /tmp/ch03 --range 1-1050 --total 2040     # -> ch03_a.mp4
python3 scripts/finish_longform.py $P --chapter 3 --frames /tmp/chB  --range 1051-2040 --total 2040  # -> ch03_b.mp4
python3 scripts/finish_longform.py $P --chapter 3 --ass-only                                # just the captions file, to check
# stitch (all segments in order; narration + SFX source/sound/chNN.json + music bed; -14 LUFS / -1 dBTP; seam checks)
python3 scripts/stitch_longform.py $P                    # all 11 -> delivery/I_Secretly_Lived_In_My_Enemys_House.mp4 + youtube_chapters.txt
python3 scripts/stitch_longform.py $P --chapters 1-5     # a block
```

- `--total` = the chapter's frame count (`Math.round(meta.seconds * 30)`); a full render's `frame_hashes.json` supplies it
  automatically. Segment ranges must meet exactly (A ends at k, B starts at k+1); the stitch refuses gaps/overlaps.
- Captions: speaker colour (VO/SKYE pink, MAX teal, DAD amber, LILY yellow; VO italic), Luckiest Guy 72 px, bottom centre.
  If a face sits in the lower third for a shot, add `web/chNN_captions.json` `{"top": [[t0, t1], ...]}` (chapter seconds):
  captions starting in those ranges go to the top.
- SFX: `source/sound/chNN.json`, cues in chapter seconds, finish.py format (`asset` from assets/audio or assets/audio/horror,
  or `tone`). Mixed only at the stitch; never into a chapter MP4.
- Commit the chapter MP4 + its `.json` sidecar (not the `.ass`, not frames).

**Proof (2026-10-06):** the 3 s clip `web/proof_clip.js` (template 5-8 s: a held silent moment, a whisper, a cut),
1920x1080, 1 sample, 2 workers: 3.0 s per rendered frame; with frame skip 30 of 90 frames copied (33%), wall time
4:31 → 3:00; copied frames equal a no-skip render within renderer noise. Encoded as ch01_a (1-45) + ch01_b (46-90) and
a whole ch02, stitched with test audio: stream copy, 180/180 frames, per-frame checksums equal the segments' (both
seams clean), A/V difference 0.000 s, -14.1 LUFS / -1.0 dBTP.

## sets/kitchen.js, classroom.js, exterior.js (kit-sets-c)

All three: `build(scene)` → `{ id, group, marks, cams, lights, setState, state, anchors, walls }`. Marks are world
`{ pos, heading, note? }` (forward = (sin h, 0, cos h)); sit marks also carry `sit: true, seatTop` (pos.y = seatTop − 1.5, kit-cast `seatY`,
i.e. the root for a scale-1 actor whose hip sits on the seat; for Lily use `K.seatY(lily, seatTop)`). Cams are `{ pos, target, fov, note? }`.
Walls and ceilings hide by themselves whenever the camera is outside them (scene.onBeforeRender), so any camera can look
in; force one with `setState({ walls: { wall_front: false } })`. `setState({ chapter: N })` sets that chapter's state and
ignores chapters that don't use the set (so `K.setState` broadcast is safe). Shared helpers: `sets/common_c.js`.
Preview sheets: `production/previews/kit-sets-c/sheet_*.jpg` (clip `set_preview.js` there, one frame per set/cam).

**Practicals and `K.applyLight`.** `set.lights` holds proxies the kit switches; the set applies them to its real lights
right before each render. Order of precedence: `setState({ practicals: { name: level } })` > `applyLight`/`setPractical` >
the set's time-of-day default. Window light (moon, sun, a soft room fill) follows `setState({ time })` and is not in `set.lights`.

### Kitchen (900,0,0) — Ch2, Ch3, Ch11
Layout (local): fridge on the back wall at the left (x −11, door hinged on its left, opens toward the room); stove x −2 and
sink under the window x 3 on the back wall; slatted pantry in the LEFT wall (x −16, z −3..2); stairs down the RIGHT wall
(top at the back, foot at z 2–3); back door in the right wall near the front (x 16, z 4–8, window in its top half, opens
outward); island in the middle (top y 3.6, z −2.1..1.8), four stools on its stove side facing the camera side (+z) — the
family faces the camera, a hider sits on the floor on the camera side, hidden from Dad at the stove.
- **States:** `time` `predawn|night|morning|day`; `fridge` / `letters` any string (`\n` = new row; 7-column fixed grid,
  left-aligned, so adding letters never moves placed ones), `fridgeScatter` (loose letters top/bottom, default true);
  `fridgeOpen` 0..1 (the fridge light follows it); `pancakes` null | 0..12 (stack on the island); `plate` null | `'sandwich'`
  | `'empty'` (back counter left of the stove); `backDoor` 0..1; `pantryDoors` (= `pantryDoor`) 0..1, ~0.15 = ajar gap;
  `stools` `'out'|'tucked'` (tucked under the overhang so someone can stand at `island_counter`); `clock` [h, m].
  Chapters: 2 = predawn, LILY + scatter, 12 pancakes, stools out; 3 = night, `BE NI`, fridge open, stools tucked;
  11 = morning, `BE NICE\n2 SKYE`, 8 pancakes (switch with `setState({ fridge: 'SAY YES' })`).
- **lights:** `fridge_light` (× door open), `ceiling_light` (2 pendants + hood; on by default at predawn), `pantry_light`, `upstairs_light`.
- **Marks:** `fridge`, `fridge_open`, `fridge_read`, `fridge_side`, `stove`, `stove_turned`, `stove_three_quarter`, `pan`
  (pan top), `cupboard`, `counter_sandwich`, `counter_right`, `island_stool_1..4` (sit, left→right from the front camera;
  Ch11: Lily 1, Max 2, Skye 3), `island_back_stand`, `island_counter`, `island_max`, `island_lily`, `island_end`
  (= `island_end_right`), `island_end_left`, `island_front_stand`, `island_hide` / `island_hide_left` (`floorSit`: on the
  floor, back to the island, head under the top), `island_hide_reach`, `island_crouch` (crouch: head must stay < 3.6),
  `island_plate_1..4`, `island_phone_3` (y = island top), `backpack_floor_3`, `pantry_inside`, `pantry_slats`, `pantry_gap`,
  `pantry_front`, `stairs_top`, `stairs_mid`, `stairs_low`, `stairs_bottom` (= `stairs_foot`), `stairs_exit` (offscreen
  top), `back_door_inside` (= `back_door`), `back_door_crawl`, `back_door_outside`, `phone_corner`, `front_doorway`, `kitchen_center`.
  Walking the stairs: `set.stairsPath(u)` → `{ pos, heading }` (u 0 top … 1 floor), `set.stairFootY(zWorld)`.
- **Cams:** `wide`, `kitchen_wide`, `wide_island`, `stairs_wide` (Ch11 frame 0: fridge L, island, stove, stairs R),
  `end_screen`, `island_wide` (Ch11 end: four at the island, fridge letters left), `island_two_shot`, `island_two`,
  `island_two_seated`, `island_stools_left|right`, `island_counter`, `behind_island`, `behind_island_low`,
  `island_low_behind`, `island_hide_cu`, `pancake_reach`, `stove`, `stove_ms`, `stove_front`, `fridge` (= `fridge_side`),
  `fridge_wide`, `fridge_letters`, `fridge_cu`, `fridge_pov` (from inside the open fridge), `fridge_ots`, `pantry_pov`,
  `pantry_pov_island` (through the slats), `pantry_peek`, `pantry_gap`, `stairs_side`, `stairs_bottom`, `back_door`,
  `back_door_wide`, `back_door_floor`, `reverse_from_stove`.
- **anchors:** `pancakeStackTop()`, `plate`, `fridgeLetters`.

### Classroom (1200,0,0) — Ch1, Ch2, Ch4
Board on the front wall (students face −z, heading π); windows along the left wall; door front-right; cubbies and the
HALLOWEEN DANCE poster on the back wall. Desks 4×4: columns c1..c4 at x −13, −5, 3, 11 (c1 by the windows), rows r1..r4
(r1 nearest the board). Skye r2c1, Max r3c2 (diagonally behind, on her right). Seat top 1.7, desk top 3.1.
- **States:** `time` `lunch|morning` (clock 12:15 / 8:25, extras' lunches on their desks at lunch; `lunch: false` hides
  them), `board` (text, `\n` rows; per-chapter defaults), `chapter` 1/2/4, `practicals: { fillL, fillR, windowSun }`.
  `lights` is empty (the room lights are always on; school_day does the rest).
- **Marks:** `desk_r{1-4}c{1-4}` (sit), `desk_skye`, `desk_max`, `desk_extra_1..4` (r1c1, r2c3, r3c3, r4c2),
  `skye_desk_side` (= `desk_skye_aisle`: standing in the aisle facing seated Skye), `skye_desk_front`, `max_desk_side`
  (= `desk_max_side`: leaning on Max's desk, facing him), `max_desk_front`, `aisle_mid`, `door_inside` (= `door`),
  `board`, `teacher_desk`, `desk_skye_top` (desk surface).
- **Cams:** `wide_front` (= `classroom_wide`), `wide_back`, `board_reverse`, `skye_max_diag` (= `two_shot_desks`),
  `two_shot_desk`, `two_shot_close`, `ots_max_on_skye` (= `ots_max_to_skye`), `ots_skye_on_max` (= `ots_skye_to_max`),
  `mcu_skye`, `cu_skye_desk` (= `cu_skye`), `mcu_max`, `cu_max_desk` (= `cu_max`), `mcu_max_stand`, `cu_side_stand`,
  `max_desk_two_shot`, `ots_skye_on_max_desk`, `lunchbox_top` (= `desk_skye_insert`), `window_in`, `end_front`.
- **anchors:** `deskTop(key)`, `desk_skye_top`, `desk_max_top`, `skye_chair_hang` (top of Skye's backrest, for the backpack).

### Exterior (1500,0,0) — Ch1 (dusk), Ch2 back step (predawn), day establishing
The back of Max's house faces +z (back wall z −8): the back door at x 6 (unlocked, opens inward; step y 0.6), the kitchen
window beside it, the round attic window in the gable; garden with a stepping-stone path from the back-fence gate
(x −10, z 31) to the door, shed, tree, washing line, bins, pumpkins on the step.
- **States:** `time` `dusk|day|night|predawn` (windows lit at dusk/night/predawn), `windows` 0..1, `porchLight` 0..1,
  `hallLight`, `atticGlow`, `backDoor` 0..1, `gate` 0..1 (default 0.35 ajar); chapter 1 = dusk, 2 = predawn.
- **Marks:** `gate` (= `yard_start`), `gate_outside`, `path_mid`, `path_near`, `porch_step`, `back_door`, `inside_door`,
  `back_step` (outside the door facing the garden), `bins_hide`, `lawn_center`.
- **Cams:** `dusk_wide`, `gate` (from the garden: Skye coming in), `garden_follow` (= `back_door_wide`), `back_door`,
  `back_door_ots` (= `back_door_close`), `back_door_low`, `from_inside` (needs `backDoor` > 0.6), `back_step_mcu`,
  `establishing_day`, `attic_window`.
