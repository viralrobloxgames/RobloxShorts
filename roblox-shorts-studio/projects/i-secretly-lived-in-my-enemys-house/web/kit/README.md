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
| `sheetLift(skye, u)` | Ch10 pull-off: `u` 0 → 1 lifts the sheet up and off (hair and face come back at 0.35). At 1: `K.dress(C.skye, 'skye_sheet', false)` (or `dress(skye,'skye_hoodie')`) and hand her kit-props' `makeProp('sheet_bunched')` in her left palm. |
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
- kit-sets-c additions: `setDoor(name, u)` on kitchen (`back_door`, `pantry`, `fridge`) and exterior (`back_door`, `gate`);
  aliases `aisle_skye` and `chair_skye_back` (classroom), `inside_back_door` (exterior).

## sets/bedroom.js, sets/hallway.js (kit-sets-a)

Both return `{ id, group, marks, cams, lights, parts, walls, setState, useCam, ... }`. Marks and cams are in world
coordinates; every mark has `{ pos, heading, note }` (forward = (sin h, 0, cos h)); sitting marks also carry `seat`
(seat-surface y) with `pos.y = seat - 2.0` (R6 hip height at scale 1), so `K.putOn(actor, mark, { sit: true })` seats a
scale-1 rig; for another scale use `sitPos(mark, scale)` (exported from bedroom.js / on the bedroom set). Every cam is
`{ pos, target, fov, hide, note }`; the camera-side (+z) wall is hidden by default, `hide` lists any other wall to hide
(`set.useCam(stage.camera, 'closet_pov')` applies it, or `K.setCam(stage, set.cams.closet_pov)`). Walls: `group.userData.walls`
= `{ back, left, right, front, ceiling }`. Previews of every cam: `production/previews/kit-sets-a/*_cams.jpg`
(re-render: `node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/production/previews/kit-sets-a/prev_bedroom.js --out /tmp/b --frames 1-35 --scale 0.3 --samples 1`; also `prev_hallway.js`, `prev_linen.js`).

**Practicals** (`set.lights`, switched by `K.applyLight(stage, preset, { set, practicals: {...} })` / `K.setPractical`; all
off unless named): bedroom `bedside_lamp` (shade + bulb glow), `desk_lamp` (Ch6 mirror face light), `moon_window` (cold spot through the window + fill),
`hall_under_door` (hallway light seen when the door opens + the warm strip under the door), `closet_light`; hallway
`moon_window`, `under_door` (warm strip + floor spill under Max's door + light in his room), `nightlight`, `ceiling_light`
(the `predawn` preset turns it on), `attic_glow` (faint light above the open hatch), `linen_fill` (soft light on faces in
the linen-closet crack). Night chapters: pass `moon_window: true` (the presets don't name it).

### Max's bedroom (offset 0,0,0; room x -11..11, z -9..9, ceiling 11)
Layout: window + bed (headboard to the back wall) at x -4; bedside table + lamp right of the bed (x 0.6, z -7.8); louvred
double closet doors in the left wall (x -11, z -1..5), walk-in to x -16.4 with six hoodies on a rail along z and a gap at
z ~2; desk + real mirror (Reflector; `parts.mirror.visible = false` to skip its cost) on the right wall at z -5; door to
the hallway in the right wall (z 1.5..5.5) with a dim hallway stub behind it.
- Controls: `setClosetDoors(fLeft, fRight = fLeft)` (0 shut, ~0.12 crack, 1 wide), `setDoor(f)` (0 shut, 1 open into the
  room), `setBlanket('flat' | 'legs' | 'over_head')`, `setClock('12:00')`, `setLamp/setMoon/setHall(on, k)`.
- `setState({ chapter, garlic, lamp, moon, hall, door, closet, blanket, blanketUp, clock })`: `garlic` defaults to
  `chapter >= 5` (none in Ch1; on in Ch6, 8, 10).
- Marks: `closet_inside` (Ch1 hook, Skye 3/4 toward `closet_pov`), `closet_deep` (pressed back into the hoodie gap),
  `closet_crack` (face at the door crack), `closet_front`, `bed_side`, `bed_lie`, `bed_sit` (= `bed_sit_up`),
  `bed_sit_door`, `bed_edge` (sit, faces `ghost_stop`), `desk_chair` (sit), `desk_stand` (= `mirror_stand`), `room_center`,
  `door_out` (= `door_outside`), `door_in` (= `door_inside`), `door_in_bed`, `mid_room_bed`, `ghost_stop`, `window`,
  `bedside_plate`, `bedside_flashlight`, `lamp_switch` (points).
- Cams: `closet_pov`, `closet_pov_cu` (= `closet_skye_cu`), `closet_pov_reverse`, `closet_max_mcu`, `closet_door_ext`,
  `closet_doors_ms`, `closet_doors_cu`, `two_shot_bed_closet`, `wide`, `bed_ms` (= `bed_max_ms`), `bed_cu` (= `bed_max_mcu`),
  `bed_edge_ms`, `bed_phone_mcu`, `bed_phone_ms`, `desk_side`, `desk_profile`, `desk_cu`, `desk_wide`, `mirror_mcu`,
  `mirror_ms`, `door_ws`, `bed_to_door` (Ch10 start, from the open side), `two_shot_bed_door`, `two_shot_door` (Ch10 end),
  `ots_max_to_skye`, `ots_skye_to_max`, `cu_skye_mid`, `cu_skye_door`, `ghost_front_mcu`, `door_handle_cu`, `window_garlic`.
  Ch10 line: Skye (door / `ghost_stop`) and Max (bed): the named Ch10 cams all sit on the open (+z) side.
- `parts`: bed, blanket(s), closet doors, door leaf, desk, chair, mirror, garlic, lamp shade/bulb, moon, rug.

### Upstairs hallway (offset 300,0,0; hall x -16.5..12, z -5..4.5, ceiling 10)
Layout (camera side +z): left end wall = linen closet (opening z -3.5..-0.5, door hinged at z -3.5 opening outward; the
crack at its free edge looks down the hall at the hatch). Back wall left→right: Max's door (x -9, sign MAX KEEP OUT),
small table + plant, moonlit window (x 1), Lily's door (x 6), nightlight, then the stairs going down along +x from x 12
(banister and landing on the camera side). Ceiling: attic hatch x -4..0 hinged at x -4; ladder foot at x ~0.
- Controls: `setHatch(f)` (0 shut; 0..0.6 the panel swings down; 0.6..1 the lower ladder slides out to the floor),
  `ladderPoint(u)` → `{ pos, heading }` on the ladder (u 0 floor, 1 hatch; climber faces -x), `rungs` (rung centres, top
  first, open state), `setLinen(f)` (0 shut, **0.4 for the Ch6 peek**, 1 open), `setMaxDoor(f)`, `setLilyDoor(f)`.
- `setState({ chapter, hatch: 'shut' | 'open' | 0..1, linen, maxDoor, lilyDoor, underDoor, moon, ceiling, nightlight })`:
  chapter defaults Ch2 hatch open (ladder down), Ch6/Ch8 hatch shut + light under Max's door.
- Marks: `ladder_foot`, `ladder_mid`, `ladder_top`, `hatch_below` = `dad_hatch` = `under_hatch` (Dad facing the hatch,
  face toward the stairs end), `hall_mid`, `dad_mid`, `hall_creep_start`, `max_door`, `max_door_listen` (= `max_door_out`;
  Skye's left ear on the door, facing +x), `lily_behind_skye` (= `lily_behind`), `max_door_kneel`, `max_door_outside`,
  `max_door_crouch`, `max_door_back`, `linen_skye` (= `linen_in_R`), `linen_lily` (= `linen_in_L`), `linen_front`,
  `lily_door`, `lily_door_out`, `stairs_top`, `stairs_step2`, `stairs_up`, `dad_enter`, `landing`.
- Cams: `wide` (= `hall_wide`), `wide_to_max_door` (= `max_door_ws`), `wide_to_stairs`, `hatch_low` (Ch2), `hatch_low_dad`
  (Ch6), `ladder_ms`, `door_approach`, `max_door_ms`, `max_door_cu`, `max_door_mcu`, `max_door_side`, `max_door_crouch_cu`,
  `max_door_back_mcu`, `under_door`, `two_shot_skye_lily`, `linen_gap`, `linen_pov`, `linen_end`, `dad_ms`, `dad_low`,
  `stairs_top`. MCUs not listed: derive with `K.camOn`.

## Props (`props.js`, kit-props)

Every hand-held or worn prop. Real sizes in studs for the cast (characters ~5 tall, a fist 1 stud); +y up, **front +z**,
**origin = the grip** (the point in the palm). `PROPS` lists every id with a one-line `what`. Hold check:
`web/kit/props_hold_check.js` (sheets in `production/previews/kit-props/`: `hold_sheet_*.jpg` all props x Skye/Lily/Dad,
both hands; `hold_fixes_*.jpg` the final carry2 / hug / head / mouth checks; `pumpkin_worn.jpg`). Notes from the check: rigid R6
fists cover anything small held at the grip, so props sit just past the fist end; a phone at the ear (`'ear'`) needs the
arm swung so the fist is behind the phone, not over it; when you re-parent the vacuum wand to a hand, `vac.userData.park()`
puts it back on the canister (removing the canister alone leaves the wand in the hand).

```js
import { makeProp, hold, carry2, reach2, place, wearOnHead, wearWrist, glowBands, facePoint, magnetLetter } from '../kit/index.js';
const fl = makeProp('flashlight', { beam: true });           // once, in setup
// every frame, AFTER posing the actor:
hold(fl, max, 'R');                                          // palm; aims along the arm
```

### Helpers

| Call | What |
|---|---|
| `makeProp(id, opts)` | a fresh `THREE.Group`, shadows on; `userData.id`, `userData.bottom`, optional `handles`, `holdDefaults` and switches below |
| `hold(prop, actor, hand = 'R', mode = 'palm', opts)` | parents the prop to `Arm.L/R` at the measured grip `(-+0.5, -1.3, 0) * actor.scale` and orients it. Modes: `palm` (Rx90: prop +z out of the fist along the arm, +y = the arm's front: world up when the arm is raised forward), `out` (same, just past the fist at `(-+0.5, -1.75, 0)`), `side` (no rotation: for things carried with the arm hanging), `hug` (on the torso front: the teddy), `ear` (phone against the side of the head), `mouth` (clamped in the teeth: the Ch2 pancake). `opts`: `level` (stay upright, facing along the arm), `aim` (world point the prop's +z points at), `rot` [x,y,z], `offset` [x,y,z] (prop frame), `mirror`, `scale`, `yaw`. Each prop's own `holdDefaults` fill in the right ones (cups, plates, letters stay level etc.). Call every frame after posing; re-parenting is automatic, so a hand-off is just `hold(p, skye, 'R')` from the contact frame on instead of `hold(p, max, 'R')` |
| `carry2(prop, actor, { at, parent, tilt })` | two-handed: the prop's `handles.L/R` into the left/right fists, upright, centred; returns the gap error. Use `reach2` first so the fists are the right distance apart |
| `reach2(actor, propOrWidth, pitch = -1.2)` | poses both arms forward by `pitch` and swings them in until the fists match the prop's handle spacing (or a width in studs). Returns the inward angle (`Arm.L.rotation.z`; `Arm.R` gets its negative) |
| `place(prop, pos, heading, { flat })` | stands the prop with `userData.bottom` on `pos` (parent space). `flat: true` lays it on its back, front up: a phone face-up on the island, a note, the drawing, **a flashlight standing on its tail with the beam up** (Ch8) |
| `wearOnHead(prop, actor, opts)` | `pumpkin_bucket` (make it with `{ worn: true }`): upside down over the crown, rim at the brows (`opts.rim`, default 0.12 above head centre), sized from the actor's own hair so nothing pokes through, face upright, handle as a chin strap swung back; `opts.tilt: [x, z]` radians for crooked (Ch7: `[0.25, -0.2]` when Lily jams it on, `[0, 0]` after Max straightens it). Anything else (the `cobweb`): on the hair surface at `opts.spot` `'left'` (default) / `'top'` / `'right'` |
| `wearWrist(band, actor, hand)` / `glowBands(actor, { light })` | a `glow_band` round the wrist, follows the arm; `glowBands` does both wrists and returns `[L, R]` |
| `facePoint(actor)` | a world point on the face: `hold(pinkFl, skye, 'R', 'palm', { aim: facePoint(skye) })` lights her face from under the chin (Ch6) |
| `magnetLetter(ch, color, size = 0.42)` | one fridge magnet letter (extruded, glossy), standing, origin at its back-bottom: sets use it for the fridge door; `LETTER_COLORS` |

Arm angles: `arm.rotation.x = -PI/2` raises an arm straight forward; arms are rigid (R6), so for "held at chest height"
use about -1.2 to -1.4. No two-arms-up poses.

### Prop ids

| Id | Notes (opts; switches) |
|---|---|
| `flashlight` | Max's/Dad's dark torch, beam +z. `{ beam, light, beamLength = 12, beamStrength, on }`; `setOn(bool)`, `setBeam(bool)`; `userData.beam` (cone), `.spot` (SpotLight when `light: true`). `{ pink: true }` or id `flashlight_small` = Skye's small pink one |
| `lunchbox` | Skye's lilac box, handle grip. `{ open, sandwich = true, spider }`; `setOpen(0..1)`; `userData.sandwich`, `.spider`. Carry: `hold(lb, skye, 'R', 'side')`; on the desk: `place()` |
| `rubber_spider` | grip on its back; `hold(sp, max, 'R', 'out')` dangles it; drop = re-parent to the scene and animate |
| `spatula`, `pan` | `pan { pancake: true }`: `userData.pancake` (a child you can re-parent to flip), `userData.panPivot` |
| `pancake` | `{ grip: 'edge' }` pinched at the edge (palm), default centred (for `mouth` / plates) |
| `pancake_stack` | `{ count = 12, plate = true, butter, syrup }`; `setCount(n)`; `userData.top()` world point of the top pancake. Origin = plate bottom |
| `magnet_letters` | a fanned handful, `{ letters: 'BENICE' }` |
| `plate`, `sandwich_plate` | `{ with: 'sandwich' | 'ham_sandwich' | 'pancakes' | 'crumbs', size: 'big' }`; handles for `carry2`; palm (level) and `place()` |
| `sandwich` (`sandwich_crustless`, `sandwich_half`) | crustless by default. `{ half, bitten: n | 'half_eaten', filling: 'ham' | 'jam' | 'cheese', crusts }`. Grip = back edge, lies flat pointing +z |
| `cookie` | `{ bitten, upright }` |
| `bread`, `knife` (`butter_knife`), `ham` (`{ raided }`), `milk`, `syrup`, `napkin`, `apple`, `juice_box` | kitchen / lunch things; `ham` is carried by the bone (`'side'`) |
| `cobweb` | `wearOnHead(web, skye, { spot: 'left' })` (Ch4) |
| `teddy` | Lily's brown bear. Default: hangs from its raised paw (`hold(t, lily, 'L' or 'R', 'side')`); `{ hold: false }` arms down for `'hug'`; `{ pose: 'sit' }` for tables/laps. `toy_teddy_a` (cream), `toy_teddy_b` (pink): sitting tea-party guests. cast.js gives `lily.teddy` already |
| `teapot`, `cup` | toy tea set (white, pink spots); handle grips, level. `cup { saucer: true }` for the table, `{ tea: false }` empty; pour: `hold(...)` then `teapot.rotateX(0.5)` |
| `hobby_horse` | upright, grip 0.9 below the head; across a lap: `place()` it and rotate flat |
| `pumpkin_bucket` | handle-top grip (`'side'` carries it hanging; `place()` on the HALLOWEEN box); `{ worn: true }` + `wearOnHead` for Ch7 |
| `vacuum` | canister on the floor (origin), hose to `userData.wand`. `hold(vac.userData.wand, dad, 'R')` (the hose re-routes); `vac.userData.park()` rests the wand on top; carried up the ladder: `hold(vac, dad, 'R', 'side')` by its top handle |
| `broom` | long axis +z, grip near the top (`{ grip: 'end' }` at the very end). `palm` with a raised arm = sword; `side` = bristles down beside a hanging arm |
| `note` (`note_crumpled`) | `{ state: 'folded' | 'crumpled' | 'open' }`: folded says "Max" and stands up out of the fist; swap for a `crumpled` one on the crumple frame; `open` (carry2 handles) has Skye's text |
| `phone` | `{ screen: 'record' | 'call' | 'home' | 'off', light, brightness }`; `setGlow(bool)`. `'out'`/`'palm'` turn the screen to the holder (recording), `'ear'` at the head; `place(p, pos, h, { flat: true })` on a table |
| `bedsheet` | `{ state: 'flat' (across a lap) | 'held' (carry2 by the top corners) | 'bunched' (one fist; also id `sheet_bunched`) | 'bundle' (an armful, carry2), holes: 0..2 }`; `setHoles(n)` while cutting |
| `scissors` | loops in the fist, blades out; `{ open }`, `setOpen(a)` to snip |
| `glow_sticks` | bundle of six, `{ lit }`, `setLit(bool)` |
| `glow_band` | one green band for a wrist, `{ color, lit = true, light }`; see `glowBands` |
| `drawing` | crayon drawing, ME AND SKYE. BEST FRENDS.; carry2 handles; `place(d, pos, h, { flat: true })` in the box |
| `backpack` | Skye's lilac backpack as a loose prop (floor, nest, chair back), top loop grip |
| `cracker_packet` | Skye's crackers (nest), palm or `place(..., { flat })` |

## Clipping check (kit-pipeline)

`node web/clip_check.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js [--every 2] [--frames a-b] --out projects/i-secretly-lived-in-my-enemys-house/production/review/clip_check/chNN.json`
(about 15 s a chapter). Poses every sampled frame as for a render and lists where a character's body goes through visible
scenery or another character, in frame ranges with film times, depth and coverage, ranked high / medium / low; only clipping
the camera can see. Mark an object `userData.noClipCheck = true` if it is meant to be passed through (e.g. a sheet).
Results and the method: `production/review/clip_check/SUMMARY.md`.

### PR1: held props stay in the palm and out of the body (kit-props)

- `hold()` now orients a held prop from the arm in every pose, with no jumps between frames. Yaw follows the arm's horizontal direction and blends to the actor's heading as the arm hangs. Pitch stays level until the arm goes above horizontal, then follows it up. `level` props (cups, plates, teapot, food) never pitch. `side` and `aim` work as before.
- **Clearance pass** (every `hold`/`hug`): points sampled from the prop must stay out of the holder's head, torso, legs and arms. The grip may sit inside the holding fist: points within `userData.gripR` of the origin or `userData.handle.r` of the handle axis. Otherwise the prop slides along its +z or outward, whichever is shorter, capped at 0.5 x scale so it never leaves the hand. `prop.userData.clipDepth` is what is left (0 = clean); `{ clear: false }` turns it off.
- **`holdPose(prop, actor, hand, pose)`** poses the holding arm and holds the prop, with grip offsets checked on all three scales. Poses: `low`, `carry`, `chest`, `offer`, `raise`, `pour` (teapot tipped), `sip` (cup at the mouth), `ear` (phone). See `HOLD_POSES`. Use it after the cast pose each frame. For the hobby horse use `carry`/`offer` (in `low` its head brushes the arm).
- **One prop per hold.** Make the prop once, call `hold`/`holdPose` every frame of the hold and keep it visible. Never swap two copies or re-create the prop mid-shot; that is the "pop". `note` now holds all three states: `note.userData.setState('crumpled')` swaps in place in the same hand (ch08).
- **Teddy:** `holdTeddy(lily, ...)` must run every frame after posing Lily (the clearance depends on the pose).
- Check sheets: `production/previews/kit-props/pr1_*.jpg` (clip `web/kit/props_pose_check.js`; the label shows slide/clip, red if anything is still inside).
- (kit-sets-a, SA1/SA2) Hallway: the camera side runs on to z 34 (floor, side walls, ceiling, end wall) and the stair end
  is closed, so no camera sees past the set. Bedroom: the walk-in runs on behind the left wall to z -5.4; `closet_hide` is
  Skye flat against the inside of that wall, out of sight from `closet_front` with the doors open (a hair lock at the
  edge at most); cams `closet_hide_pov` (corner: Skye 3/4 foreground, Max beyond the wall edge) and `closet_hide_ext`
  (over Max into the open closet: hoodies, no Skye). With the doors shut the closet is dark and louvred: Max can't see in.

### Cast colour floor (kit-pipeline, P1)
Every lighting preset has `cast` (0 by day, ~0.2-0.38 at night / under the fridge / in the attic): each cast material
also glows with its own texture at that level, applied right before each draw, so coloured light tints the set but not a
character's skin, hair or clothes. Override per frame with `K.applyLight(stage, id, { set, castFloor: 0.3 })`.
Flashlight defaults are softer (`flashlightBeam` 30, `chinLight` 4.5) so torches don't white out faces.

### kit-sets-c SC1/SC2 (plausibility fix, 2026-10-06 late)
- **Walk routes:** `set.route(fromWorld, toWorld)` (classroom, kitchen) → world waypoints around desks, chairs, the
  island, stools, counters, fridge, stairs and newel post (body half-width 2.1 included). Walk them with
  `set.alongRoute(pts, distance)` → `{ pos, heading, done }` (distance = speed × time; `routeLength(pts)` for timing). An
  endpoint inside furniture (a seat, a stool) steps out sideways first. Never lerp a character straight between marks.
- **Classroom:** desks are 3.2 wide (aisles 4.8 at x −9, −1, 7; window aisle x −17), chairs 2.3 behind the desk centre so
  a seated torso sits 0.65 behind the desk edge; seat top `set.SEAT_TOP` 1.7, desk top `set.DESK_TOP` 3.1;
  `set.seatY(scale)` = root y (= `K.seatY(actor, 1.7)`). Forearms rest on the top with the upper arm horizontal
  (arm pitch ≈ −90°; shoulder 3.7 above the floor). New marks `desk_rXcY_side` (stand here, step in sideways, sit),
  `desk_skye_side`, `desk_max_side_entry`, `aisle_<12|23|34|window|door>_<front|back>`. The teacher's desk moved to the
  front window corner (`teacher_desk`), so the door side of the room is clear. Nobody stands in a chair: walk to a
  `_side` mark, then slide sideways onto the seat while sitting.
- **Kitchen:** stairs are 5 wide (x 11..16, `STAIR_X` 13.5), banister/newel at x 11.2. `set.stairsPath(u)` keeps the
  feet on the higher tread under the body; `set.fromStairs(toWorld)` = waypoints from the stair foot into the room
  around the newel. New marks `stairs_foot_out`, `island_reach` (kneel_up against the island front under the stack; one
  arm straight up beside the edge, hand over at y ≈ 4.3; the stack now sits at the front edge, z 1.12),
  `island_hide_low` (crawl/crouch-low: below the seated family's sight line), `island_hide_crawl_end`,
  `island_hide_crawl_door`. `set.sightBlocked(eyeWorld, headWorld)` → true when the island hides the head from those
  eyes (sitting upright at `island_hide` the hair can show over the top to someone on a stool). Stove marks moved to z −7.9 so
  Dad's arms stay in front of the counter. `set.seatY(scale)` for the stools (seat 2.2).
