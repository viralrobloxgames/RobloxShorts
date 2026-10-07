// Ch2 "Twelve Pancakes" (TUESDAY 6:04 AM). Shot plan: production/shots/ch02.md. Boundary: source/boundary_sheet.md
// (Start of Ch2: hallway predawn, Skye climbing down the attic ladder; End of Ch2: classroom, Skye walking back to her
// desk waving, Max bolt upright). Built from web/ch_template.js; everything is a pure function of t.
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch02.js --out /tmp/ch02 \
//            --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';
import { clamp, lerp, inv, smooth } from '../../../web/lib/anim.js';
import { travel, STRIDE } from '../../../web/lib/locomotion.js';

// ---------- CHAPTER ----------
const CH = 2;
const CARD = { day: 'TUESDAY', time: '6:04 AM' };
// Estimated spoken lines until audio/chapters/ch02/lines.json lands (index from 1, as lines.json). Paces: VO/SKYE 2.9,
// MAX 2.7, LILY 2.6, DAD 2.5 words/s; 0.25 s between lines, 0.35 s on a scene change, plus the [+N] pauses.
const SCRIPT = [
  ['VO', '', "Tuesday. Rule one of living in your enemy's house: be out before anyone wakes up. Rule two: his dad wakes up at six."],
  ['DAD', '', 'Good morning, kitchen! Who wants pancakes? Everybody wants pancakes!', 0.1],
  ['SKYE', 'whisper', "Why is he so happy? It's still dark."],
  ['MAX', '', 'Dad, something was in my room last night. It said my name.'],
  ['DAD', '', "That's just the pipes, champ. This house is a hundred years old. It says all sorts of things."],
  ['LILY', '', "Or it's a ghost."],
  ['DAD', '', "Or it's a ghost!"],
  ['MAX', '', "Not funny. I didn't sleep at all."],
  ['DAD', '', 'Hang on. I made twelve pancakes. Why are there eleven?', 0.8],
  ['LILY', '', 'Ghost.'],
  ['MAX', '', 'Lily, stop saying ghost.'],
  ['LILY', '', 'Ghost, ghost, ghost, ghost.'],
  ['DAD', '', "Fine. Ghost, if you're listening, the syrup's in the cupboard."],
  ['SKYE', 'whisper', 'Best. Pancake. Ever.', 0.6],
  ['SKYE', '', 'Wow. You look terrible.', 0.1],
  ['MAX', '', 'My house is haunted. It knows my name.'],
  ['SKYE', '', 'A ghost? I thought nothing scares you.'],
  ['MAX', '', "I'm not scared. I'm just very alert."],
  ['SKYE', '', "Sure. That's why you hid under your blanket."],
  ['MAX', '', 'How do you know that?', 0.6],
  ['SKYE', '', 'Lucky guess. Everybody does that. Bye!'],
];
const PACE = { VO: 2.9, SKYE: 2.9, MAX: 2.7, LILY: 2.6, DAD: 2.5 };
const EST = []; { let t = 0; SCRIPT.forEach(([speaker, note, text, pause = 0], i) => {
  if (i) t += 0.25 + pause; const d = text.split(/\s+/).length / PACE[speaker] + 0.3;
  EST.push({ index: i + 1, speaker, note, text, start: +t.toFixed(2), end: +(t + d).toFixed(2) }); t += d; }); }
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.75);
export const sky = K.SKY;
export const samples = () => 1;
export const at = (line, off = 0) => L.line(line).start + off;
const endOf = (line, off = 0) => L.line(line).end + off;
// start of the k-th word (0-based) of a spoken line
const wd = (line, k, off = 0) => { const l = L.line(line); const ws = L.words.filter((w) => w.start >= l.start - 0.02 && w.start < l.end); return (ws[Math.min(k, ws.length - 1)]?.start ?? l.start) + off; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// ---------- marks ----------
const mk = (set, name) => K.getSet(set).marks[name];          // raw set mark (keeps seatTop etc.)
const M = {
  stairsTop: () => K.mark('hallway', 'stairs_top'),
  stove: () => K.mark('kitchen', 'stove_three_quarter'),
  stoveTurned: () => K.mark('kitchen', 'stove_turned'),
  islandEnd: () => K.mark('kitchen', 'island_end_left'),
  hide: () => K.mark('kitchen', 'island_hide'),
  reach: () => K.mark('kitchen', 'island_hide_reach'),
  stoolMax: () => mk('kitchen', 'island_stool_3'),
  stoolLily: () => mk('kitchen', 'island_stool_1'),
  stairsBottom: () => K.mark('kitchen', 'stairs_bottom'),
  backCrawl: () => K.mark('kitchen', 'back_door_crawl'),
  porch: () => K.mark('exterior', 'porch_step'),
  deskMax: () => mk('classroom', 'desk_max'),
  maxSide: () => K.mark('classroom', 'max_desk_side'),
  extra: (i) => mk('classroom', ['desk_r3c1', 'desk_r4c1', 'desk_r4c2', 'desk_r2c3'][i]),
};

// ---------- setup ----------
let C, A, P = {};
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'kitchen', 'exterior', 'classroom']);
  K.setState({ chapter: 2 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.dad, 'dad_apron'); K.dress(C.lily, 'lily_pjs');
  K.dress(C.max, 'max_pjs');
  A = await K.loadAnims(['idle']);
  P.spatula = K.makeProp('spatula'); stage.scene.add(P.spatula);
  P.pan = K.makeProp('pan', { pancake: true }); stage.scene.add(P.pan);
  P.pancake = K.makeProp('pancake'); stage.scene.add(P.pancake);
  P.edgeCake = K.makeProp('pancake', { grip: 'edge' }); stage.scene.add(P.edgeCake);   // held by its edge outside
}

// ---------- key times ----------
export const T = {
  ladderEnd: () => 2.7,                           // Skye's feet reach the hall floor
  kitchen: () => wd(1, 15, -0.1),                 // "Rule two:" -> cut to the kitchen
  freeze: () => wd(1, 22),                        // "six."
  duck0: () => endOf(1, 0.05),                    // Skye runs down the rest of the stairs to the island
  famIn: () => at(3, -0.6),                       // Max shuffles down the stairs, Lily skips well behind him
  steal: () => endOf(8, 0.08),                    // [+0.8] the hand over the island
  crawl0: () => at(13, 0.5),
  lilyOut: () => at(12, 0.2),                     // Lily skips out of the kitchen chanting "ghost"
  maxOut: () => at(12, 1.3),                      // Max gives up and follows her
  dadOut: () => at(13, 0.6),                      // "Fine." at the stove, then Dad follows them out with the rest of the line
  skyeOut: () => T.dadOut() + routeLen(exitPath('dad')) / DAD_SP + 0.05,   // the kitchen is empty: the pantry doors open
  out: () => at(14, -0.12),  // cut outside (her line starts at 14)
  class: () => at(15, -0.2),
  sitUp: () => endOf(19, 0.08),                   // [+0.6] Max sits up
  bye0: () => endOf(21, -0.35),                   // she heads back to her desk on "Bye!"
};
T.slide = () => T.steal() + 0.32;                 // the pancake leaves the stack

// ---------- the shot table ----------
const kc = (name) => K.getSet('kitchen').cams[name];
const cc = (name) => K.getSet('classroom').cams[name];
const SHOTS = [
  { at: () => 0, id: 'hall_ladder', set: 'hallway', light: 'predawn', cam: (s) => K.setCam(s, ladderCam(), { clear: false }) },
  { at: () => T.ladderEnd() + 0.1, id: 'hall_creep', set: 'hallway', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.22, heading: K.faceTo(K.mark('hallway', 'ladder_foot'), M.stairsTop()), dist: 6.5, height: 0.8 }) },
  { at: T.kitchen, id: 'kitchen_wide', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('wide'), { clear: false }) },
  { at: () => at(2, 1.2), id: 'dad_morning', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, dadCam(), { clear: false }) },
  { at: () => at(3, -0.1), id: 'skye_whisper', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: KO().clone().add(V(-16.45, 4.3, -1.5)), target: K.headPos(C.skye).add(V(0, -0.3, 0)), fov: 60 }, { clear: false }) },   // inside the dark pantry
  { at: () => at(4, -0.1), id: 'max_walk', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, entranceCam(), { clear: false }) },   // one held shot: Max shuffles down the stairs, Lily skips in behind
  { at: () => at(4, 1.0), id: 'max_dad', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kidsCam(0.55), { clear: false }) },
  { at: () => at(5, -0.1), id: 'dad_pipes', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, dadCam(), { clear: false }) },
  { at: () => at(5, 2.3), id: 'pov_gap', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: KO().clone().add(V(-17.6, 4.55, -0.05)), target: KO().clone().add(V(-1.0, 4.0, -3.4)), fov: 28 }, { clear: false }) },   // her POV through the ajar gap: the family at the island
  { at: () => at(6, -0.1), id: 'lily_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(7, -0.1), id: 'dad_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, dadCam(), { clear: false }) },
  { at: () => at(8, -0.1), id: 'max_notfunny', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.3, height: 0.9 }) },
  { at: () => at(8, 1.3), id: 'peek', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, peekCam(), { clear: false }) },   // her eyes in the gap as the kids turn round to Dad
  { at: () => T.steal() - 0.3, id: 'steal', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: KO().clone().add(V(-12.2, 5.6, 8.5)), target: KO().clone().add(V(-15.6, 4.0, 1.6)), fov: 42 }, { clear: false }) },   // toward the left wall: her and the stack, the family out of frame
  { at: () => at(9, -0.1), id: 'dad_count', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, dadCam(), { clear: false }) },
  { at: () => at(10, -0.1), id: 'lily_ghost2', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(11, -0.1), id: 'max_lily', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kidsCam(0.45), { clear: false }) },
  { at: () => at(11, 1.0), id: 'peek_cake', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, peekCam(), { clear: false }) },   // in the gap, the pancake between her teeth
  { at: () => at(12, -0.1), id: 'lily_ghosts', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: KO().clone().add(V(-7.0, 9.2, -9.6)), target: KO().clone().add(V(-3.0, 3.0, 3.0)), fov: 58 }, { clear: false }) },   // from the back wall: Lily skips out chanting, Max trails after her
  { at: () => at(13, -0.1), id: 'dad_syrup', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, dadCam(), { clear: false }) },   // "Fine." and he sets off after them
  { at: () => at(13, 0.75), id: 'kitchen_empty', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: KO().clone().add(V(6.0, 7.0, -10.0)), target: KO().clone().add(V(-8.0, 3.2, 5.0)), fov: 58 }, { clear: false }) },   // Dad out of the doorway; then the pantry doors open on the empty kitchen
  { at: T.out, id: 'back_step', set: 'exterior', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: -0.5 }) },
  { at: T.class, id: 'class_two', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, cc('max_desk_two_shot'), { clear: false }) },
  { at: () => at(16, -0.1), id: 'max_haunted', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35 }) },
  { at: () => at(17, -0.1), id: 'skye_ghost', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5, height: 0.25 }) },
  { at: () => at(18, -0.1), id: 'max_alert', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35 }) },
  { at: () => at(19, -0.1), id: 'skye_blanket', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5, height: 0.25 }) },
  { at: T.sitUp, id: 'sit_up', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, cc('max_desk_two_shot'), { clear: false }) },
  { at: () => at(20, 0.0), id: 'max_how', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35, zoom: 0.85 }) },
  { at: () => at(21, -0.1), id: 'lucky', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, cc('max_desk_two_shot'), { clear: false }) },
  { at: T.bye0, id: 'bye', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, byeCam(), { clear: false }) },
].map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start);
export const SHOT_LIST = SHOTS.map((x) => [x.id, +x.start.toFixed(2), Math.round(x.start * 30) + 1]);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// faces: [from time, face] per character; speak() adds the mouth on their words
const FACE = {
  skye: () => [[0, 'nervous'], [T.freeze(), 'shocked'], [T.duck0() + 0.9, 'nervous'], [at(3), 'annoyed'], [endOf(3), 'nervous'], [T.steal(), 'scheming'],
    [at(9), 'nervous'], [at(12), 'scheming'], [T.out(), 'happy'], [T.class(), 'smug'], [T.sitUp(), 'shocked'], [at(21), 'nervous'], [wd(21, 5, -0.25), 'happy']],
  max: () => [[0, 'nervous'], [at(4), 'scared'], [endOf(4), 'nervous'], [at(6), 'annoyed'], [at(9), 'surprised'], [at(10), 'annoyed'], [T.class(), 'annoyed'],
    [at(16), 'scared'], [at(18), 'determined'], [at(19), 'annoyed'], [T.sitUp(), 'suspicious']],
  dad: () => [[0, 'happy'], [at(7), 'laugh'], [endOf(7), 'happy'], [at(9), 'surprised'], [wd(9, 7), 'suspicious'], [at(10), 'happy']],
  lily: () => [[0, 'neutral'], [at(6), 'smug']],
};
const faceAt = (who, t) => { let f = 'neutral'; for (const [a, x] of FACE[who]()) if (t >= a) f = x; return f; };
const WHISPER = (t) => L.lines.some((l) => l.note === 'whisper' && t >= l.start && t < l.end);

// ---------- posing helpers ----------
// a posture on a floor (or seat) height: the root goes down by the pose's drop
function poseAt(actor, pose, pos, heading, opts = {}) {
  const drop = K.posture(actor, pose, opts);
  K.putOn(actor, { pos: V(pos.x, pos.y - drop, pos.z), heading }, { sit: true });
  return drop;
}
// stand on a mark with the pack idle (moves only while someone speaks: holdClock)
function stand(actor, m, heading, idle) { K.playAnim(actor, [[A.idle, idle]]); K.putOn(actor, m, { heading: heading ?? m.heading }); }
// sit on a seat mark (seatTop): blends stand -> sit over `blend` s from t0
function sitOn(actor, seat, pose, t0, t, from = null, blend = 0.35, heading = seat.heading) {
  const u = smooth(inv(t0, t0 + blend, t)), y = K.seatY(actor, seat.seatTop);
  K.posture(actor, K.mixAngles({}, K.POSES[pose], u));
  const p = from ? from.clone().lerp(seat.pos, u) : seat.pos.clone(); p.y = lerp(0, y, u);
  K.putOn(actor, { pos: p, heading }, { sit: true });
}
// hip on the floor, legs out (Skye behind the island)
// low against the island front (hands and knees, head ~2.6): below every seated sight line (kit island_hide_low)
function hideCrouch(m) { poseAt(C.skye, K.POSES.crouch, m.pos, 0.5); }   // upright low crouch, head level, 3/4 to camera
function hideLow(m) { poseAt(C.skye, { ...crawlPose(0), Head: [-40, -50, 0] }, m.pos, PI / 2); }   // side-on along the island front, face turned out
function floorSit(actor, m) { poseAt(actor, 'sit_chair', V(m.pos.x, m.pos.y + 0.5 - 1.5 * actor.scale, m.pos.z), m.heading); }
// hands and knees; the crawl cycle is driven by the distance covered (phase = distance / STRIDE)
function crawlPose(phase) {
  const c = Math.sin(phase * PI * 2);
  // legs hang from the root (not the torso): swung back 45 deg so the hips stay up on the knees; arms straight down to the floor
  return { Torso: [70, 0, 0], Head: [-58, 0, 0], 'Arm.L': [-70 + 15 * c, 0, -4], 'Arm.R': [-70 - 15 * c, 0, 4], 'Leg.L': [45 - 12 * c, 0, -3], 'Leg.R': [45 + 12 * c, 0, 3], drop: 0.59 };
}
// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.applyLight(stage, sh.light, sh.set === 'kitchen' ? {} : { set, practicals: sh.set === 'hallway' ? { ceiling_light: false } : {} });   // the hall stays dark: nobody is up yet   // the kitchen's practicals follow its own setState
  const idle = K.holdClock(t, L, [[T.kitchen(), T.duck0() + 1.8], [T.famIn(), at(4, 3)], [T.steal(), at(9)], [T.crawl0(), at(14)], [T.bye0(), meta.seconds]]);
  for (const p of Object.values(P)) p.visible = false;

  if (sh.set === 'kitchen') K.setLine(C.dad, C.max, 1); else if (sh.set === 'classroom') K.setLine(C.skye, C.max, -1); else K.clearLine();
  if (sh.set === 'hallway') hallway(t, idle);
  else if (sh.set === 'kitchen') { stage0 = stage; kitchen(t, idle); }
  else if (sh.set === 'exterior') outside(t, idle);
  else classroom(t, idle);

  for (const who of ['skye', 'max', 'dad', 'lily']) if (C[who].root.visible) K.speak(C[who], faceAt(who, t), t, L.words, { whisper: (who === 'skye' && WHISPER(t)) || (who === 'max' && t >= at(4) && t < endOf(4)) });
  K.setBlockers(set.group, ...[C.skye, C.max, C.dad, C.lily, ...C.extras].filter((a) => a.root.visible));
  sh.cam(stage, t);
}

// ---------- hallway: down the attic ladder, then creeping to the stairs ----------
function ladderCam() {
  const p = K.getSet('hallway').ladderPoint(0.25).pos;
  return { pos: p.clone().add(V(2.2, 3.4, 13.5)), target: p.clone().add(V(0.3, 6.6, 0)), fov: 34 };
}
// ahead of her, from the stairs end of the hall (open +z side), so her face reads as she creeps to the stairs
function creepCam() {
  const p = C.skye.root.position, o = K.SET_ORIGIN.hallway;
  const e = M.stairsTop().pos;                                                                   // from the open (+z) side, level with the stairs end
  return { pos: V(e.x - 0.5, 5.4, e.z + 11), target: V(p.x, 3.6, p.z), fov: 40 };
}
function hallway(t, idle) {
  K.only(C, ['skye']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); 
  const hs = K.getSet('hallway');
  if (t < T.ladderEnd()) {
    const u = lerp(0.45, 0, smooth(inv(0, T.ladderEnd(), t))), lp = hs.ladderPoint(u);
    const climbed = hs.ladderPoint(0.45).pos.y - lp.pos.y;
    const g = K.gait('climb', climbed / 1.6), c = Math.sin(climbed / 1.6 * PI * 2);
    const k = 1 - smooth(inv(T.ladderEnd() - 0.3, T.ladderEnd(), t));   // off the rails and face forward as she steps off (eased)
    poseAt(C.skye, { ...g, 'Arm.L': [(-34 + 8 * c) * k, 0, -16 * k], 'Arm.R': [(-34 - 8 * c) * k, 0, 16 * k], Head: [6 * k, 70 * k, 0] }, lp.pos, lp.heading + 0.3);   // hands on the side rails at chest height, face turned 3/4 over her shoulder   // cheated 3/4 to camera, looking down over her shoulder
  } else {
    const foot = K.mark('hallway', 'ladder_foot'), top = M.stairsTop();
    const m = travel(foot.pos, top.pos, T.ladderEnd() + 0.35, t, 6);
    if (m.moving) {
      // creeping, glancing back toward Max's door (down the hall behind her)
      poseAt(C.skye, { ...K.gait('creep', m.anim), 'Arm.L': [-18, 0, -4], 'Arm.R': [-18, 0, 4], Head: [-6, inv(0.2, 0.5, m.u) * (1 - inv(0.7, 0.9, m.u)) * 25, 0] }, m.pos, m.heading);
    } else {   // off the ladder she turns (eased) to the hall; at the stairs she turns to look back down it
      const h0 = hs.ladderPoint(0).heading + 0.3;
      stand(C.skye, { pos: m.pos }, m.done ? turnTo(m.heading, 0.8, smooth(inv(m.arrive, m.arrive + 0.3, t))) : turnTo(h0, m.heading, smooth(inv(T.ladderEnd(), T.ladderEnd() + 0.35, t))), idle);
    }
  }
}

// ---------- kitchen ----------
// Layout (sets/kitchen.js): camera side +z; the stove at the back, the stools on the island's back side facing +z,
// Skye hides on the front side; the stairs come down the right wall, the back door beside their foot.
let KS = '';
function stealCam() { const o = K.SET_ORIGIN.kitchen; return { pos: o.clone().add(V(5.2, 6.2, -1.8)), target: o.clone().add(V(1.0, 4.5, 1.5)), fov: 40 }; }   // over the island's far-right corner: her face 3/4, her hand on the stack beside it
const STEAL_AT = () => V(0.5, 0, 3.45).add(K.SET_ORIGIN.kitchen);   // kneeling side-on to the island under the stack, facing +x
function crawlCam() { const o = K.SET_ORIGIN.kitchen, h = K.headPos(C.skye); return { pos: o.clone().add(V(12.8, 5.0, 12.5)), target: h.clone().add(V(0, -0.8, 0)), fov: 40 }; }   // from beside the door: she tiptoes toward camera, the kids' turned backs beyond the island
function entranceCam() { const o = K.SET_ORIGIN.kitchen; return { pos: o.clone().add(V(1.2, 5.8, -9.6)), target: o.clone().add(V(9.0, 4.2, 0.0)), fov: 44 }; }
// Lily (stool 1) and Max (stool 3) from the front, over the hiding Skye's head; bias 0 = Lily, 1 = Max
function kidsCam(bias) { const o = K.SET_ORIGIN.kitchen, x = lerp(-3.6, 1.2, bias); return { pos: o.clone().add(V(x, 5.6, 6.2)), target: o.clone().add(V(x, 4.3, -3.2)), fov: 42 }; }
// Dad at the stove, frontal, through the gap between Lily (stool 1) and Max (stool 3)
function dadCam() { const o = K.SET_ORIGIN.kitchen; return { pos: o.clone().add(V(-1.1, 9.4, 2.4)), target: o.clone().add(V(-1.6, 4.4, -7.9)), fov: 22 }; }   // high enough to clear the kids' heads
// Skye hiding low against the island front: close, from the front-right, a little above her
function whisperCam() { const h = K.headPos(C.skye); return { pos: h.clone().add(V(2.6, 1.0, 4.4)), target: h.clone().add(V(0, -0.3, 0)), fov: 34 }; }
function kitchenState(st) { const k = JSON.stringify(st); if (k !== KS) { KS = k; K.getSet('kitchen').setState({ chapter: 2, ...st }); } }
function stairsPose(kind, t0, t, u0, u1, speed) {
  const ks = K.getSet('kitchen'), a = ks.stairsPath(u0).pos, b = ks.stairsPath(u1).pos, len = a.distanceTo(b);
  const u = clamp((t - t0) * speed / len), p = ks.stairsPath(lerp(u0, u1, u));
  const g = K.gait(kind, u * len / STRIDE);
  for (const k of ['Leg.L', 'Leg.R']) if (g[k]) g[k] = [g[k][0] * 0.45, g[k][1], g[k][2]];   // short steps on the stairs: feet stay clear of the treads
  g['Arm.L'] = [-8 * Math.sin(u * len / STRIDE * PI * 2), 0, -3]; g['Arm.R'] = [-38, 0, 6];          // left arm low, right hand on the rail
  return { g, p, u, len };
}
// from: a pose dict to blend out of over 0.2 s after t0 (no one-frame snap into the gait)
function stairsGait(actor, kind, t0, t, u0, u1, speed, idle, from = null) {
  const { g, p, u, len } = stairsPose(kind, t0, t, u0, u1, speed);
  if (u > 0 && u < 1) poseAt(actor, from ? K.mixAngles(from.pose, g, smooth(inv(t0, t0 + 0.2, t))) : g, p.pos, from ? turnTo(from.heading, p.heading, smooth(inv(t0, t0 + 0.2, t))) : p.heading);
  else stand(actor, p, p.heading, idle);
  return { done: u >= 1, end: t0 + len / speed, pos: p.pos };
}
let cakeBase = null;
let stage0 = null;
const KO = () => K.SET_ORIGIN.kitchen;
const turnTo = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;   // shortest-way heading blend
const ease = (t, a, b, d = 0.2) => smooth(inv(a, a + d, t)) * (1 - smooth(inv(b, b + d, t)));   // 0 -> 1 over d at a, back to 0 over d at b
const peekCam = () => ({ pos: KO().clone().add(V(-9.0, 4.9, -0.3)), target: KO().clone().add(V(-16.2, 4.5, -0.5)), fov: 26 });   // straight on to the gap between the doors: her eyes in it
const inPov = (t) => t >= at(5, 2.3) && t < at(6, -0.1);
const routeLen = (pts) => pts.slice(1).reduce((a, p, i) => a + pts[i].distanceTo(p), 0);
// stair foot -> along the front of the room -> into the pantry (Dad has his back to the room)
const runPath = () => [K.getSet('kitchen').stairsPath(1).pos, KO().clone().add(V(5, 0, 6.0)), KO().clone().add(V(-11.5, 0, 4.0)), K.mark('kitchen', 'pantry_front').pos, K.mark('kitchen', 'pantry_inside').pos];
// once the kitchen is empty: out of the pantry toward the back door (we cut outside after her first steps)
const sneakPath = () => [K.mark('kitchen', 'pantry_slats').pos.clone().add(V(-0.35, 0, 0)), K.mark('kitchen', 'pantry_front').pos, KO().clone().add(V(-11.3, 0, -0.2)), KO().clone().add(V(-9.6, 0, 4.6)), KO().clone().add(V(8.5, 0, 5.2))];
// the family leaves the kitchen by the living-room doorway (front wall, x -4..0), round the island's left end
const DAD_SP = 11.5;
const exitPath = (who) => ({
  lily: [[-5.2, -3.8], [-7.2, -4.2], [-7.2, 5.0], [-2.0, 10.8], [-2.0, 13.6]],
  max: [[2.4, -4.0], [0.8, -4.95], [-7.8, -4.95], [-7.8, 5.0], [-1.6, 10.8], [-1.6, 13.6]],
  dad: [[-2.0, -7.9], [-7.6, -6.6], [-7.6, 5.0], [-1.9, 10.8], [-1.9, 13.6]],
})[who].map(([x, z]) => KO().clone().add(V(x, 0, z)));
// the 12-stack on the side counter beside the pantry (kit: setState({ stackAt: 'side' }) + anchors.sideStackTop); fallback position until it lands
const sideTop = () => (K.getSet('kitchen').anchors.sideStackTop ? K.getSet('kitchen').anchors.sideStackTop() : KO().clone().add(V(-15.3, 3.5 + 0.1 + 12 * 0.11, 3.4)));
const stepOut = () => K.getSet('kitchen').marks.pantry_step_out ? K.mark('kitchen', 'pantry_step_out') : { pos: KO().clone().add(V(-15.3, 0, 1.4)), heading: 0 };
// the steal: out of the ajar gap past the open door leaf to one step from the side counter, right hand onto the top
// pancake, then quickly back in; all inside the window where the kids sit turned round and Dad faces the pan
const stealPath = () => { const g = K.mark('kitchen', 'pantry_gap').pos; return [g, KO().clone().add(V(-11.8, 0, -0.5)), KO().clone().add(V(-11.6, 0, 2.2)), stealStand()]; };   // wide of the open leaf's edge
// her right shoulder (1.5 to her right) one arm's length short of the stack, facing it like pantry_step_out
const stealStand = () => { const so = stepOut(), h = so.heading, top = sideTop(); return top.clone().setY(0).add(V(-Math.sin(h) * 2.1, 0, -Math.cos(h) * 2.1)).add(V(Math.cos(h) * 1.1, 0, -Math.sin(h) * 1.1 + 0.6)); };   // +0.6 z keeps the reaching arm clear of the open door leaf
function stealPose(t) {
  const S = T.steal(), pts = stealPath(), len = routeLen(pts), so = stepOut();
  const goOut = inv(S - 0.25, S + 0.3, t), goBack = inv(S + 0.65, S + 1.2, t), u = goOut - goBack;
  const m = pathMove(pts, 0, u * len, 1), moving = (goOut > 0 && goOut < 1) || (goBack > 0 && goBack < 1);
  // out of the gap facing the room, turning to the stack as she goes; backs into the pantry still facing out (no snaps)
  const h = goBack > 0 ? turnTo(so.heading, PI / 2, smooth(inv(0, 0.8, goBack))) : turnTo(PI / 2, so.heading, smooth(inv(0.35, 1, goOut)));
  if (moving) poseAt(C.skye, K.mixAngles({}, { ...K.gait('creep', m.anim), 'Arm.L': [-24, 0, -4] }, smooth(inv(S - 0.25, S - 0.1, t)) * 0.7 + 0.3), m.pos, h);
  else stand(C.skye, { pos: m.pos }, u >= 1 ? so.heading : PI / 2, 0);
  const up = smooth(inv(S + 0.08, S + 0.3, t)), lift = smooth(inv(T.slide() + 0.03, T.slide() + 0.18, t)), lower = smooth(inv(0.6, 1, goBack));
  C.skye.bones.Torso.rotateX(0.22 * up * (1 - lift));                                             // leaning in over the counter
  // up and over the top of the stack; lifts the pancake high off it; lowers it to her middle once she has stepped clear
  K.gesture(C.skye, [-148 - 27 * lift + 133 * lower, 0, lerp(-8, -40, lower)], 'R', up * (1 - smooth(inv(S + 1.05, S + 1.3, t))));
}
// constant-speed walk along waypoints (legs driven by the distance covered)
function pathMove(pts, t0, t, speed) {
  const seg = pts.slice(1).map((p, i) => pts[i].distanceTo(p)), total = seg.reduce((a, b) => a + b, 0);
  let d = clamp((t - t0) * speed, 0, total), i = 0;
  while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
  const a = pts[i], b = pts[i + 1], pos = a.clone().lerp(b, seg[i] ? d / seg[i] : 1), u = clamp((t - t0) * speed / total);
  // heading blends across each waypoint (no one-frame turns at the corners)
  const hd = (k) => Math.atan2(pts[k + 1].x - pts[k].x, pts[k + 1].z - pts[k].z), rr = (k) => Math.min(1.0, seg[k] / 2);
  let heading = hd(i);
  if (i > 0 && d < rr(i)) heading = turnTo(turnTo(hd(i - 1), hd(i), 0.5), hd(i), d / rr(i));
  else if (i < seg.length - 1 && seg[i] - d < rr(i)) heading = turnTo(hd(i), turnTo(hd(i), hd(i + 1), 0.5), 1 - (seg[i] - d) / rr(i));
  return { pos, heading, anim: u * total / STRIDE, done: u >= 1, moving: u > 0 && u < 1, arrive: t0 + total / speed };
}
function kitchen(t, idle) {
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs'); K.dress(C.dad, 'dad_apron'); K.dress(C.lily, 'lily_pjs');
  const pd = t < T.duck0() + 0.6 ? 0 : t < T.duck0() + 2.6 ? 0.9 : t < at(5) ? 0 : t < at(12) ? lerp(0.18, 0.9, smooth(inv(T.steal() - 0.55, T.steal() - 0.25, t)) - smooth(inv(T.steal() + 1.2, T.steal() + 1.5, t))) : 0.9 * smooth(inv(T.skyeOut(), T.skyeOut() + 0.3, t));   // shut while the family comes down; a peeking gap once they sit; shut while they leave; open once they are gone
  kitchenState({ pancakes: t < T.slide() ? 12 : 11, stackAt: 'side', pantryDoors: pd, practicals: { pantry: 0.35 }, backDoor: 0 });
  const said = (i) => t >= at(i) && t < endOf(i);

  // Dad: cooking at the stove (3/4), turned to the room for his lines; to the island end for the count
  const talkWins = L.lines.filter((l) => l.speaker === 'DAD').map((l) => [l.start + (l.index === 2 ? 1.8 : l.index === 9 ? 0.6 : -0.2), l.end + 0.3]).concat([[at(4, 0.4), endOf(4)]]);
  const wTalk = Math.max(0, ...talkWins.map(([a, b]) => ease(t, a, b, 0.3))), dadTalk = wTalk > 0.5;   // every turn stove <-> room eased over 0.2 s   // and he turns to Max for Max's first line   // line 2 starts to the stove
  P.spatula.visible = true;
  if (t < at(9, 0.6)) {   // "Hang on." still to the pan: he turns once she is back behind the doors
    const s0 = M.stove(), s1 = M.stoveTurned(), hd = turnTo(s0.heading, s1.heading, wTalk);
    stand(C.dad, { pos: s0.pos.clone().lerp(s1.pos, wTalk), heading: hd }, hd, idle);
    K.gesture(C.dad, 'hold_out', 'L', 0.4);                                                        // the pan, held low in front of the counter
    K.gesture(C.dad, 'hold_out', 'R', 0.8 * (1 - wTalk));                                            // spatula at the pan
    const w7 = ease(t, at(7) - 0.15, endOf(7), 0.3);
    if (w7 > 0) K.gesture(C.dad, 'finger_up', 'L', w7);                                               // "Or it's a ghost!" (free hand, clear of his face; eased)
    if (dadTalk && !said(7)) for (const b of [wd(2, 6, -0.1), at(5, 1.2)]) K.beat(C.dad, 'point', 'R', t, b, 1.2);         // one spatula beat ("Everybody", "a hundred years old"), back down
    if (said(7)) C.dad.bones['Arm.R'].rotateZ(0.15 * Math.sin((t - at(7)) * 14));                  // spooky waggle, one arm
    P.pan.visible = true; K.hold(P.pan, C.dad, 'L');
    // flipping: the pancake hops off the pan and turns over (every 1.1 s while he cooks)
    const cake = P.pan.userData.pancake; if (!cakeBase) cakeBase = cake.position.clone();
    const ph = !dadTalk ? ((t - T.kitchen()) % 1.1) / 0.55 : 2;
    cake.position.copy(cakeBase); cake.rotation.set(0, 0, 0);
    if (ph < 1) { cake.position.y += 1.4 * Math.sin(ph * PI); cake.rotation.x = ph * PI * 2; }
  } else {
    // the count and the syrup line from the stove (no walk: the island stays between him and the hiding Skye)
    const st = M.stoveTurned(), s0 = M.stove(), u9 = smooth(inv(at(9, 0.6), at(9, 0.85), t));   // eased off the pan
    const h = turnTo(turnTo(s0.heading, K.faceTo(st, K.getSet('kitchen').anchors.pancakeStackTop()), u9), st.heading, smooth(inv(at(10), at(10, 0.25), t)));
    if (t < T.dadOut()) stand(C.dad, { pos: s0.pos.clone().lerp(st.pos, u9), heading: h }, h, idle);
    else {   // follows the kids out, saying the rest of the line as he goes
      const e = pathMove(exitPath('dad'), T.dadOut(), t, DAD_SP);
      if (e.done) C.dad.root.visible = false;
      else poseAt(C.dad, K.gait('walk', e.anim), e.pos, turnTo(h, e.heading, smooth(inv(T.dadOut(), T.dadOut() + 0.45, t))));
    }
    K.gesture(C.dad, 'hold_out', 'L', 0.4); K.gesture(C.dad, 'hold_out', 'R', 0.8 * (1 - u9));      // pan still in hand; spatula hand leaves the pan (eased)
    P.pan.visible = true; K.hold(P.pan, C.dad, 'L');
    if (t < endOf(9) + 0.55) K.gesture(C.dad, 'point', 'R', 0.9 * u9 * (1 - smooth(inv(endOf(9) + 0.3, endOf(9) + 0.55, t))));   // the spatula at the stack, eased up and down
    if (t >= at(13) && t < endOf(13) + 0.5) {
      C.dad.bones.Head.rotateX(-0.45 * ease(t, at(13, 0.4), wd(13, 5) - 0.2));                       // "Ghost, if you're listening" to the ceiling (eased)
      K.gesture(C.dad, 'point', 'R', smooth(inv(wd(13, 5), wd(13, 5) + 0.3, t)) * (1 - smooth(inv(wd(13, 5) + 0.5, wd(13, 5) + 0.8, t))));   // "the syrup's in the cupboard": at the wall cupboards as he passes, arm down before the doorway
    }
  }
  K.hold(P.spatula, C.dad, 'R', 'palm', { level: true });

  // Max shuffles down the stairs to stool 4, Lily skips behind him to stool 3; they sit
  K.holdTeddy(C.lily, 'R');
  for (const [who, stool, d, kind, sp] of [['max', M.stoolMax(), 0, 'shuffle', 7], ['lily', M.stoolLily(), 1.9, 'skip', 8]]) {
    const a = C[who], t0 = T.famIn() + d;
    if (t < t0) { a.root.visible = false; continue; }
    const sw = stairsGait(a, kind, t0, t, 0, 1, sp, idle);
    if (!sw.done) continue;
    const o = K.SET_ORIGIN.kitchen, behind = V(stool.pos.x, 0, stool.pos.z - 1.4);
    const way = [K.getSet('kitchen').stairsPath(1).pos, o.clone().add(V(9.0, 0, 4.4)), o.clone().add(V(8.8, 0, -4.6)), behind];   // off the treads, round the newel post, down the side and behind the island (never past Skye's side)
    const m = pathMove(way, sw.end, t, sp);
    if (!m.done) { const kr = smooth(inv(sw.end, sw.end + 0.3, t)); poseAt(a, K.mixAngles({ ...K.gait(kind, m.anim), 'Arm.R': [-38, 0, 6] }, K.gait(kind, m.anim), kr), m.pos, turnTo(K.getSet('kitchen').stairsPath(1).heading, m.heading, smooth(inv(sw.end, sw.end + 0.3, t)))); continue; }
    const leave = who === 'lily' ? T.lilyOut() : T.maxOut();
    if (t >= leave) {   // off the stool (0.35 s), then out by the living-room doorway
      const ex = exitPath(who), h1 = Math.atan2(ex[1].x - ex[0].x, ex[1].z - ex[0].z);
      if (t < leave + 0.6) {
        const u = smooth(inv(leave, leave + 0.6, t));
        // back from the island, swivels on the seat (Lily to her left, Max to his right), hops off sideways, then stands
        const p = stool.pos.clone().add(V(0, 0, -0.6 * smooth(inv(0, 0.3, u)))).lerp(ex[0], smooth(inv(0.35, 0.75, u)));
        K.posture(a, K.mixAngles({}, K.POSES.sit_chair, 1 - smooth(inv(0.55, 1, u))));
        p.y = lerp(K.seatY(a, stool.seatTop), 0, smooth(inv(0.55, 1, u))) + 0.5 * Math.sin(PI * clamp(u / 0.9));
        const h = lerp(stool.heading, who === 'lily' ? -PI / 2 : PI / 2, smooth(inv(0.15, 0.5, u)));
        K.putOn(a, { pos: p, heading: h }, { sit: true });
      } else {
        const e = pathMove(ex, leave + 0.6, t, who === 'max' ? 8.5 : sp);   // Max hurries after her (clear of Dad in the doorway)
        if (e.done) a.root.visible = false; else poseAt(a, K.gait(kind, e.anim), e.pos, turnTo(who === 'lily' ? -PI / 2 : PI / 2, e.heading, smooth(inv(leave + 0.6, leave + 0.95, t))));   // turns (eased) from the hop-off to the way out
      }
      if (who === 'lily') { K.gesture(a, [-46, 0, -26], 'L', 1); K.gesture(a, [-42, 0, -26], 'R', 1); K.holdTeddy(a, 'hug'); }
      continue;
    }
    // both turn round on their stools to Dad for the steal (eased in and out); turned round, they sit back on the far edge
    const wAway = ease(t, T.steal() - 0.85, at(9, 0.4), 0.35);
    const seat = { ...stool, pos: stool.pos.clone().add(V(0, 0, -0.9 * wAway)) };
    sitOn(a, seat, 'sit_chair', m.arrive, t, behind, 0.35, turnTo(m.heading, stool.heading + wAway * (who === 'max' ? -2.5 : 2.6), smooth(inv(m.arrive, m.arrive + 0.35, t))));
    const wLook = ease(t, at(11), at(12) - 0.05) * (1 - wAway);                                        // Max and Lily look at each other (eased)
    if (wLook > 0) { const look = who === 'max' ? M.stoolLily() : M.stoolMax(); let d = K.faceTo(stool, look) - stool.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); a.bones.Head.rotateY(clamp(d, -1.3, 1.3) * wLook); }
    if (who === 'lily') { const kh = smooth(inv(m.arrive, m.arrive + 0.35, t)); K.gesture(a, [-46, 0, -26], 'L', kh); K.gesture(a, [-42, 0, -26], 'R', kh); K.holdTeddy(a, 'hug'); }
    if (who === 'lily' && t >= at(12) && t < endOf(12)) a.root.position.y += 0.1 * Math.abs(Math.sin((t - at(12)) * 7));
  }

  // Skye: on the stairs at the cut, freezes on "six", runs into the pantry while Dad sings to the stove (before anyone
  // comes down); hides behind its shut louvred doors; steals from the side counter beside it while all three look away;
  // sneaks out upright along the island front while the seated kids are turned round to Dad, who faces the back wall.
  const ks = K.getSet('kitchen'), STAIR_LEN = ks.stairsPath(0).pos.distanceTo(ks.stairsPath(1).pos);
  const SKYE_STAIR_SP = 4.75;   // she reaches the stair foot just as she freezes on "six" (no idle beat before it)
  const uFreeze = 0.3 + 0.7 * clamp((T.freeze() - T.kitchen() + 0.6) * SKYE_STAIR_SP / (0.7 * STAIR_LEN));
  const inside = K.mark('kitchen', 'pantry_inside'), front = K.mark('kitchen', 'pantry_front');
  const tFreeze = Math.min(T.freeze(), T.kitchen() - 0.6 + stairsPose('walk', 0, 0, 0.3, 1, 1).len / SKYE_STAIR_SP - 0.01);   // on "six", or as she reaches the foot
  const freezePose = (tt) => {   // the mid-stride stair pose eased into a half shock; the feet come together on the tread
    const k = smooth(inv(tFreeze, tFreeze + 0.3, tt)), g = stairsPose('walk', T.kitchen() - 0.6, tFreeze, 0.3, 1, SKYE_STAIR_SP).g;
    const shock = K.mixAngles({}, K.POSES.shock, 0.5); shock['Leg.L'] = [0, 0, -2]; shock['Leg.R'] = [0, 0, 2];
    return K.mixAngles(g, shock, k);
  };
  if (t < T.duck0()) {
    if (t < tFreeze) stairsGait(C.skye, 'walk', T.kitchen() - 0.6, t, 0.3, 1, SKYE_STAIR_SP, 0);
    else poseAt(C.skye, freezePose(t), ks.stairsPath(uFreeze).pos, turnTo(0, -0.6, smooth(inv(tFreeze, tFreeze + 0.3, t))));   // freezes on "six" (eased in)
  } else if (t < T.skyeOut()) {
    const sw = stairsGait(C.skye, 'run', T.duck0(), t, uFreeze, 1, 14, 0, { pose: freezePose(T.duck0()), heading: -0.6 });
    if (sw.done) {
      const m = pathMove(runPath(), sw.end, t, 16);
      if (!m.done) { const kf = smooth(inv(T.duck0(), T.duck0() + 0.25, t)); poseAt(C.skye, K.mixAngles(freezePose(T.duck0()), K.gait('run', m.anim), kf), m.pos, turnTo(-0.6, m.heading, kf)); }   // out of the freeze into the run (eased)
      else if (t >= T.steal() - 0.25 && t < T.steal() + 1.3) stealPose(t);
      else if (t < at(4, -0.1)) poseAt(C.skye, K.mixAngles(K.gait('run', m.anim), { ...K.POSES.kneel, Head: [-4, 0, 0] }, smooth(inv(m.arrive, m.arrive + 0.25, t))), inside.pos.clone().add(V(0.35, 0, 0)), turnTo(m.heading, inside.heading, smooth(inv(m.arrive, m.arrive + 0.35, t))));   // whispering, kneeling upright in the dark pantry
      else { stand(C.skye, { pos: t >= at(12) ? K.mark('kitchen', 'pantry_slats').pos.clone().add(V(-0.35, 0, 0)) : K.mark('kitchen', t < at(5) ? 'pantry_slats' : 'pantry_gap').pos }, PI / 2, 0);   // behind the shut slats; at the gap once it is ajar
        C.skye.bones.Head.rotateY(0.08); if (inPov(t)) C.skye.root.visible = false; }   // peeking through the gap (hidden for her own POV)
    }
    if (t >= T.slide()) {
      if (t < T.steal() + 1.3) K.hold(P.pancake, C.skye, 'R', 'out', { level: true });            // in her hand from its first moving frame
      else { K.hold(P.pancake, C.skye, 'R', 'mouth'); P.pancake.visible = true; }                 // then between her teeth
    }
  } else {
    // the family has gone: out of the pantry on tiptoe toward the back door (cut outside after her first steps)
    const m = pathMove(sneakPath(), T.skyeOut() + 0.2, t, 8);
    poseAt(C.skye, { ...K.gait('creep', m.anim), 'Arm.L': [-24, 0, -4], 'Arm.R': [-24, 0, 4] }, m.pos, m.heading);
    K.hold(P.pancake, C.skye, 'R', 'mouth'); P.pancake.visible = true;
  }
}

// ---------- outside the back door: "Best. Pancake. Ever." (bites on "Ever") ----------
function outside(t, idle) {
  K.only(C, ['skye']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); 
  stand(C.skye, M.porch(), 0, idle);
  const bite = smooth(inv(wd(14, 2, -0.3), wd(14, 2, -0.05), t));
  const up = bite - smooth(inv(wd(14, 2, 0.25), wd(14, 2, 0.55), t));                           // to her mouth on "Ever", then back down
  K.gesture(C.skye, 'chin_hand', 'L', 0.72);                    // beside her chin; the bite is her head dipping to it                                       // pancake in her palm beside her face (far hand), to her mouth on "Ever"
  C.skye.bones.Head.rotateX(0.3 * up);                                                         // she dips her head to the pancake to bite
  K.hold(P.edgeCake, C.skye, 'L', 'palm', { level: true }); P.edgeCake.visible = true;
}

// ---------- classroom before the bell ----------
// the last shot: from the front, Skye walking toward camera waving back, Max bolt upright behind her
function byeCam() { const o = K.SET_ORIGIN.classroom; return { pos: o.clone().add(V(-3.0, 7.0, -11.5)), target: o.clone().add(V(-7.8, 4.2, 1.8)), fov: 30 }; }
function classroom(t, idle) {
  K.only(C, ['skye', 'max', 'extras']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_school');
  const dm = M.deskMax(), side = M.maxSide();
  // Max: slumped over his desk until he snaps bolt upright
  const up = smooth(inv(T.sitUp(), T.sitUp() + 0.2, t));
  const SLUMP = { ...K.POSES.sit_slump, Head: [-14, 0, 0] };   // kit slump (forearms on the desk), chin up so the face reads
  K.posture(C.max, K.mixAngles(SLUMP, K.POSES.sit_upright, up)); K.restArms(C.max, 'desk', 1 - up);
  K.putOn(C.max, { pos: V(dm.pos.x, K.seatY(C.max, dm.seatTop), dm.pos.z), heading: dm.heading - 0.35 * (1 - up) - 0.3 * up }, { sit: true });
  // Skye: leaning on his desk; on "Bye!" she walks back toward her own desk, waving
  if (t < T.bye0()) {
    const drop = K.posture(C.skye, 'lean_in');
    K.restArms(C.skye, 'standing', 1);                                                             // arms down, clear of the chair backs
    K.putOn(C.skye, { pos: side.pos.clone().setY(-drop), heading: side.heading }, { sit: true });
  } else {
    const o = K.SET_ORIGIN.classroom, pts = [side.pos, o.clone().add(V(-9.0, 0, 3.0)), o.clone().add(V(-9.2, 0, -3.0))];
    const m = pathMove(pts, T.bye0(), t, 7);   // down the c1/c2 aisle (x -11.4..-6.6 clear) toward the front, i.e. toward camera
    poseAt(C.skye, K.gait('walk', m.anim), m.pos, m.heading);
    K.gesture(C.skye, K.ARM_GESTURES.wave.map((v, i) => (i === 2 ? v + 10 * Math.sin(t * 11) : v)), 'R', smooth(inv(T.bye0(), T.bye0() + 0.2, t)));
    C.skye.bones.Head.rotateY(0.3 * smooth(inv(T.bye0(), T.bye0() + 0.3, t)));                     // looking back at him
  }
  // extras: three at their desks
  C.extras.forEach((e, i) => {
    const s = M.extra(i);
    K.posture(e, 'sit_chair'); K.putOn(e, { pos: V(s.pos.x, K.seatY(e, s.seatTop), s.pos.z), heading: s.heading }, { sit: true });
    e.setFace(i === 1 ? 'happy' : 'neutral');
  });
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}
