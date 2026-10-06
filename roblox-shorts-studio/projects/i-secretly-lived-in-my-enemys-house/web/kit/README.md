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
| `holdClock(t, L, extra?)` | `K.playAnim(a, [[A.idle, K.holdClock(t, L)]])`: idle motion runs only while someone speaks (plus `extra` [t0, t1] ranges), so silent held moments repeat frames exactly and render.mjs skips them |
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
| `setPractical(set, name, on)` | `K.setPractical(set, 'bedside_lamp', true)` (sets: `light.userData.bulb` = emissive mesh(es) switched with it) |
| `flashlightBeam(stage)` → `{ set(on, from, dir) }` | `beam.set(true, torchWorldPos, dirVector)` each frame; spot light + faint cone |
| `phoneGlow(stage)` → `{ set(on, pos) }` | `glow.set(true, phonePos)` |
| `glowSticks(stage, n)` → `{ set(on, [pos, ...]) }` | `sticks.set(true, [wristL, wristR])` |

## camera.js (kit-pipeline)

The camera is on whoever speaks. Call one camera function per frame, last in `update()` (after posing).
`K.setBlockers(set.group, C.skye, C.max)` each frame: cameras are pulled in front of any wall or other actor between
them and their subject. `K.setLine(a, b, side)` once per scene: two-shots, over-the-shoulders and singles stay on that
side of the line a→b (no 180-degree crossing); if a single would cross, its angle is mirrored.

| Export | Example |
|---|---|
| `camOn(stage, actor, framing, opts)` | `K.camOn(stage, C.max, 'mcu', { angle: 0.35, fov: 35 })`; framings `cu` (whole head), `mcu` (head and shoulders), `ms` (waist up), `ws` (full body + room); opts `angle`, `height`, `fov`, `dist`, `zoom`, `look`, `apply:false` |
| `twoShot(stage, a, b, opts)` | `K.twoShot(stage, C.max, C.skye, { framing: 'ms', bias: 0.5 })` |
| `overShoulder(stage, from, to, framing, opts)` | `K.overShoulder(stage, C.skye, C.max, 'mcu')`: over Skye's shoulder onto Max |
| `setCam(stage, cam)` | `K.setCam(stage, set.cams.closet_pov)` a set's named camera (also pulled out of walls) |
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
| `endScreen(g, s, t, { t0 })` | Ch11's last ~12 s: SUBSCRIBE @viralrobloxgames at the top; y 330-1000 left clear for YouTube's end-screen elements |
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
