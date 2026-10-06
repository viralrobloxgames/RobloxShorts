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
