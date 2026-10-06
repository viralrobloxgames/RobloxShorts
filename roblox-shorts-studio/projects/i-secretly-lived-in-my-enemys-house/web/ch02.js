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
  stoolMax: () => mk('kitchen', 'island_stool_4'),
  stoolLily: () => mk('kitchen', 'island_stool_3'),
  stairsBottom: () => K.mark('kitchen', 'stairs_bottom'),
  backCrawl: () => K.mark('kitchen', 'back_door_crawl'),
  porch: () => K.mark('exterior', 'porch_step'),
  deskMax: () => mk('classroom', 'desk_max'),
  maxSide: () => K.mark('classroom', 'max_desk_side'),
  extra: (i) => mk('classroom', ['desk_extra_2', 'desk_extra_3', 'desk_extra_4'][i]),
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
}

// ---------- key times ----------
export const T = {
  ladderEnd: () => 2.7,                           // Skye's feet reach the hall floor
  kitchen: () => wd(1, 15, -0.1),                 // "Rule two:" -> cut to the kitchen
  freeze: () => wd(1, 22),                        // "six."
  duck0: () => endOf(1, 0.05),                    // Skye runs down the rest of the stairs to the island
  famIn: () => at(3, 0.3),                        // Max shuffles down the stairs, Lily skips behind
  steal: () => endOf(8, 0.08),                    // [+0.8] the hand over the island
  crawl0: () => at(13, 0.5),                      // Skye crawls to the back door during Dad's syrup line
  out: () => at(14, -0.3),
  class: () => at(15, -0.2),
  sitUp: () => endOf(19, 0.08),                   // [+0.6] Max sits up
  bye0: () => endOf(21, -0.35),                   // she heads back to her desk on "Bye!"
};
T.slide = () => T.steal() + 0.45;                 // the pancake leaves the stack

// ---------- the shot table ----------
const kc = (name) => K.getSet('kitchen').cams[name];
const cc = (name) => K.getSet('classroom').cams[name];
const SHOTS = [
  { at: () => 0, id: 'hall_ladder', set: 'hallway', light: 'predawn', cam: (s) => K.setCam(s, ladderCam(), { clear: false }) },
  { at: () => T.ladderEnd() + 0.1, id: 'hall_creep', set: 'hallway', light: 'predawn', cam: (s) => K.setCam(s, creepCam(), { clear: false }) },
  { at: T.kitchen, id: 'kitchen_wide', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('wide'), { clear: false }) },
  { at: () => at(2, 1.2), id: 'dad_morning', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.35, height: 0.8 }) },
  { at: () => at(3, -0.1), id: 'skye_whisper', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.45, height: 0.2 }) },
  { at: () => at(4, -0.1), id: 'family_in', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('wide'), { clear: false }) },
  { at: () => at(4, 2.6), id: 'max_dad', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('island_stools_right'), { clear: false }) },
  { at: () => at(5, -0.1), id: 'dad_pipes', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.35, height: 0.8 }) },
  { at: () => at(6, -0.1), id: 'lily_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(7, -0.1), id: 'dad_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.35, height: 0.8 }) },
  { at: () => at(8, -0.1), id: 'max_notfunny', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.3, height: 0.9 }) },
  { at: T.steal, id: 'steal', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('pancake_reach'), { clear: false }) },
  { at: () => at(9, -0.1), id: 'dad_count', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.5, height: 0.8 }) },
  { at: () => at(10, -0.1), id: 'lily_ghost2', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(11, -0.1), id: 'max_lily', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.lily, C.max, { framing: 'mcu', bias: 0.6, height: 1.0 }) },
  { at: () => at(12, -0.1), id: 'lily_ghosts', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.lily, C.max, { framing: 'mcu', bias: 0.35, height: 1.0 }) },
  { at: () => at(13, -0.1), id: 'dad_syrup', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.5, height: 0.8 }) },
  { at: T.crawl0, id: 'crawl', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('back_door_wide'), { clear: false }) },
  { at: T.out, id: 'back_step', set: 'exterior', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.5 }) },
  { at: T.class, id: 'class_two', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, cc('max_desk_two_shot'), { clear: false }) },
  { at: () => at(16, -0.1), id: 'max_haunted', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35 }) },
  { at: () => at(17, -0.1), id: 'skye_ghost', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5, height: 0.25 }) },
  { at: () => at(18, -0.1), id: 'max_alert', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35 }) },
  { at: () => at(19, -0.1), id: 'skye_blanket', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5, height: 0.25 }) },
  { at: T.sitUp, id: 'sit_up', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, cc('max_desk_two_shot'), { clear: false }) },
  { at: () => at(20, 0.0), id: 'max_how', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5, height: 0.35 }) },
  { at: () => at(21, -0.1), id: 'bye', set: 'classroom', light: 'school_day', cam: (s) => K.setCam(s, byeCam(), { clear: false }) },
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
function floorSit(actor, m) { poseAt(actor, 'sit_chair', V(m.pos.x, m.pos.y + 0.5 - 1.5 * actor.scale, m.pos.z), m.heading); }
// hands and knees; the crawl cycle is driven by the distance covered (phase = distance / STRIDE)
function crawlPose(phase) {
  const c = Math.sin(phase * PI * 2);
  return { Torso: [72, 0, 0], Head: [-62, 0, 0], 'Arm.L': [-70 + 18 * c, 0, -4], 'Arm.R': [-70 - 18 * c, 0, 4], 'Leg.L': [78 - 14 * c, 0, -3], 'Leg.R': [78 + 14 * c, 0, 3], drop: 1.25 };
}
// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.applyLight(stage, sh.light, sh.set === 'kitchen' ? {} : { set });   // the kitchen's practicals follow its own setState
  const idle = K.holdClock(t, L, [[T.kitchen(), T.duck0() + 1.8], [T.famIn(), at(4, 3)], [T.steal(), at(9)], [T.crawl0(), at(14)], [T.bye0(), meta.seconds]]);
  for (const p of Object.values(P)) p.visible = false;

  if (sh.set === 'kitchen') K.setLine(C.dad, C.max, 1); else if (sh.set === 'classroom') K.setLine(C.skye, C.max, -1); else K.clearLine();
  if (sh.set === 'hallway') hallway(t, idle);
  else if (sh.set === 'kitchen') kitchen(t, idle);
  else if (sh.set === 'exterior') outside(t, idle);
  else classroom(t, idle);

  for (const who of ['skye', 'max', 'dad', 'lily']) if (C[who].root.visible) K.speak(C[who], faceAt(who, t), t, L.words, { whisper: who === 'skye' && WHISPER(t) });
  K.setBlockers(set.group, ...[C.skye, C.max, C.dad, C.lily, ...C.extras].filter((a) => a.root.visible));
  sh.cam(stage, t);
}

// ---------- hallway: down the attic ladder, then creeping to the stairs ----------
function ladderCam() {
  const p = K.getSet('hallway').ladderPoint(0.42).pos;
  return { pos: p.clone().add(V(1.6, 1.2, 11.5)), target: p.clone().add(V(0.4, 3.6, 0)), fov: 42 };
}
// ahead of her, from the stairs end of the hall (open +z side), so her face reads as she creeps to the stairs
function creepCam() {
  const p = C.skye.root.position, o = K.SET_ORIGIN.hallway;
  return { pos: V(o.x + 15.5, 5.8, o.z + 8.5), target: V(p.x, 3.4, p.z), fov: 38 };
}
function hallway(t, idle) {
  K.only(C, ['skye']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); 
  const hs = K.getSet('hallway');
  if (t < T.ladderEnd()) {
    const u = lerp(0.62, 0, smooth(inv(0, T.ladderEnd(), t))), lp = hs.ladderPoint(u);
    const climbed = hs.ladderPoint(0.62).pos.y - lp.pos.y;
    poseAt(C.skye, { ...K.gait('climb', climbed / 1.6), Head: [10, 55, 0] }, lp.pos, lp.heading);   // looks down over her shoulder
  } else {
    const foot = K.mark('hallway', 'ladder_foot'), top = M.stairsTop();
    const m = travel(foot.pos, top.pos, T.ladderEnd() + 0.35, t, 6);
    if (m.moving) {
      // creeping, glancing back toward Max's door (down the hall behind her)
      poseAt(C.skye, { ...K.gait('creep', m.anim), Head: [-6, inv(0.2, 0.5, m.u) * (1 - inv(0.7, 0.9, m.u)) * 60, 0] }, m.pos, m.heading);
    } else stand(C.skye, { pos: m.pos }, m.done ? 0.8 : foot.heading + 0.7, idle);   // at the stairs she looks back down the hall
  }
}

// ---------- kitchen ----------
// Layout (sets/kitchen.js): camera side +z; the stove at the back, the stools on the island's back side facing +z,
// Skye hides on the front side; the stairs come down the right wall, the back door beside their foot.
let KS = '';
function kitchenState(st) { const k = JSON.stringify(st); if (k !== KS) { KS = k; K.getSet('kitchen').setState({ chapter: 2, ...st }); } }
function stairsGait(actor, kind, t0, t, u0, u1, speed, idle) {
  const ks = K.getSet('kitchen'), a = ks.stairsPath(u0).pos, b = ks.stairsPath(u1).pos, len = a.distanceTo(b);
  const u = clamp((t - t0) * speed / len), p = ks.stairsPath(lerp(u0, u1, u));
  if (u > 0 && u < 1) poseAt(actor, K.gait(kind, u * len / STRIDE), p.pos, p.heading);
  else stand(actor, p, p.heading, idle);
  return { done: u >= 1, end: t0 + len / speed, pos: p.pos };
}
let cakeBase = null;
function kitchen(t, idle) {
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs'); K.dress(C.dad, 'dad_apron'); K.dress(C.lily, 'lily_pjs');
  kitchenState({ pancakes: t < T.slide() ? 12 : 11, backDoor: smooth(inv(T.crawl0() + 2.4, T.crawl0() + 3.0, t)) });
  const said = (i) => t >= at(i) && t < endOf(i);

  // Dad: cooking at the stove (3/4), turned to the room for his lines; to the island end for the count
  const dadTalk = L.lines.some((l) => l.speaker === 'DAD' && t >= l.start - 0.2 && t < l.end + 0.3);
  P.spatula.visible = true;
  if (t < at(9)) {
    const m = dadTalk ? M.stoveTurned() : M.stove();
    stand(C.dad, m, m.heading, idle);
    K.gesture(C.dad, 'hold_out', 'L', 0.9);                                                        // the pan
    K.gesture(C.dad, !dadTalk ? 'hold_out' : said(7) ? 'point_up' : 'point', 'R', !dadTalk ? 0.8 : said(2) && t > wd(2, 6) ? 1 : 0.55);
    if (said(7)) C.dad.bones['Arm.R'].rotateZ(0.15 * Math.sin((t - at(7)) * 14));                  // spooky waggle, one arm
    P.pan.visible = true; K.hold(P.pan, C.dad, 'L');
    // flipping: the pancake hops off the pan and turns over (every 1.1 s while he cooks)
    const cake = P.pan.userData.pancake; if (!cakeBase) cakeBase = cake.position.clone();
    const ph = !dadTalk ? ((t - T.kitchen()) % 1.1) / 0.55 : 2;
    cake.position.copy(cakeBase); cake.rotation.set(0, 0, 0);
    if (ph < 1) { cake.position.y += 1.4 * Math.sin(ph * PI); cake.rotation.x = ph * PI * 2; }
  } else {
    const from = M.stoveTurned(), end = M.islandEnd(), m = travel(from.pos, end.pos, at(9), t, 12);
    if (m.moving) poseAt(C.dad, K.gait('walk', m.anim), m.pos, m.heading);
    else {
      const h = t < at(10) ? end.heading : t < at(13) ? end.heading + 0.5 : end.heading - 0.9;
      stand(C.dad, m.done ? end : from, m.done ? h : from.heading, idle);
      if (t < endOf(9) + 0.3) K.gesture(C.dad, 'point', 'R', 0.9);                                  // the spatula at the stack
      if (t >= at(13) && t < endOf(13) + 0.5) {
        if (t < wd(13, 5)) C.dad.bones.Head.rotateX(-0.45);                                         // "Ghost, if you're listening" to the ceiling
        else K.gesture(C.dad, 'point', 'R', 1);                                                     // "the syrup's in the cupboard"
      }
    }
  }
  K.hold(P.spatula, C.dad, 'R', 'palm', { level: true });

  // Max shuffles down the stairs to stool 4, Lily skips behind him to stool 3; they sit
  for (const [who, stool, d, kind, sp] of [['max', M.stoolMax(), 0, 'shuffle', 7], ['lily', M.stoolLily(), 0.7, 'skip', 9]]) {
    const a = C[who], t0 = T.famIn() + d;
    if (t < t0) { a.root.visible = false; continue; }
    const sw = stairsGait(a, kind, t0, t, 0, 1, sp, idle);
    if (!sw.done) continue;
    const behind = V(stool.pos.x, 0, stool.pos.z - 1.4);
    const m = travel(K.mark('kitchen', 'stairs_bottom').pos, behind, sw.end, t, sp);
    if (!m.done) { poseAt(a, K.gait(kind, m.anim), m.pos, m.heading); continue; }
    let h = stool.heading;
    if (t >= at(11) && t < endOf(12)) h += who === 'max' ? -0.55 : 0.5;                              // Max and Lily turn to each other
    sitOn(a, stool, 'sit_chair', m.arrive, t, behind, 0.35, h);
    if (who === 'max' && said(8)) K.gesture(a, 'eye_wipe', 'L', smooth(inv(at(8), at(8, 0.3), t)));   // rubs his eye
    if (who === 'lily' && t >= at(12) && t < endOf(12)) a.root.position.y += 0.1 * Math.abs(Math.sin((t - at(12)) * 7));
  }

  // Skye: on the stairs at the cut, freezes on "six", runs to the island and hides; steals one; crawls out the back door
  const ks = K.getSet('kitchen'), STAIR_LEN = ks.stairsPath(0).pos.distanceTo(ks.stairsPath(1).pos);
  const uFreeze = 0.3 + 0.7 * clamp((T.freeze() - T.kitchen() + 0.6) * 5 / (0.7 * STAIR_LEN));
  const hide = M.hide(), reach = M.reach();
  if (t < T.duck0()) {
    stairsGait(C.skye, 'creep', T.kitchen() - 0.6, Math.min(t, T.freeze()), 0.3, 1, 5, 0);
    if (t >= T.freeze()) poseAt(C.skye, K.POSES.shock, ks.stairsPath(uFreeze).pos, -0.6, { mix: 0.5 });
  } else if (t < T.duck0() + 1.8) {
    const sw = stairsGait(C.skye, 'run', T.duck0(), t, uFreeze, 1, 14, 0);
    if (sw.done) {
      const m = travel(M.stairsBottom().pos, hide.pos, sw.end, t, 16);
      if (!m.done) poseAt(C.skye, K.gait('run', m.anim), m.pos, m.heading);
      else floorSit(C.skye, hide);
    }
  } else if (t < T.crawl0()) {
    if (t >= T.steal() && t < T.steal() + 1.3) {
      // turned to the island, crouched, one arm up over the counter to the stack
      const u = inv(T.steal(), T.steal() + 0.3, t) - inv(T.steal() + 0.75, T.steal() + 1.1, t);
      poseAt(C.skye, 'crouch', reach.pos, reach.heading);
      K.gesture(C.skye, 'reach_up', 'R', u);
    } else { floorSit(C.skye, hide); if (t >= T.slide()) K.gesture(C.skye, 'hold_out', 'R', 0.55); }   // the pancake held up in front of her
    if (t >= T.slide()) K.hold(P.pancake, C.skye, 'R');
  } else {
    // crawl: from the hiding spot round to the back door and out
    const door = M.backCrawl(), out = door.pos.clone().add(V(4.5, 0, 0));
    const m1 = travel(hide.pos, door.pos, T.crawl0(), t, 4.2);
    const m = m1.done ? travel(door.pos, out, m1.arrive + 0.15, t, 4.2) : m1;
    poseAt(C.skye, crawlPose((m1.done ? m1.anim + m.anim : m.anim) * 1.6), m.pos, m.heading);
    K.hold(P.pancake, C.skye, 'R', 'mouth');
  }
}

// ---------- outside the back door: "Best. Pancake. Ever." (bites on "Ever") ----------
function outside(t, idle) {
  K.only(C, ['skye']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); 
  stand(C.skye, M.porch(), 0, idle);
  const bite = smooth(inv(wd(14, 2, -0.3), wd(14, 2, -0.05), t));
  K.gesture(C.skye, 'hold_out', 'R', 1 - bite);
  K.gesture(C.skye, 'chin_hand', 'R', bite);
  K.hold(P.pancake, C.skye, 'R', 'palm', { level: true, rot: [0.7, 0, 0] });   // tipped toward camera so it reads as a pancake
}

// ---------- classroom before the bell ----------
// the last shot: from the front, Skye walking toward camera waving back, Max bolt upright behind her
function byeCam() { const o = K.SET_ORIGIN.classroom; return { pos: o.clone().add(V(-3.0, 7.0, -11.5)), target: o.clone().add(V(-8.4, 3.9, 1.6)), fov: 44 }; }
function classroom(t, idle) {
  K.only(C, ['skye', 'max', 'extras']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_school');
  const dm = M.deskMax(), side = M.maxSide();
  // Max: slumped over his desk until he snaps bolt upright
  const up = smooth(inv(T.sitUp(), T.sitUp() + 0.2, t));
  K.posture(C.max, K.mixAngles(K.POSES.sit_slump, K.POSES.sit_upright, up));
  K.putOn(C.max, { pos: V(dm.pos.x, K.seatY(C.max, dm.seatTop), dm.pos.z), heading: dm.heading - 0.35 * (1 - up) - 0.3 * up }, { sit: true });
  // Skye: leaning on his desk; on "Bye!" she walks back toward her own desk, waving
  if (t < T.bye0()) {
    const drop = K.posture(C.skye, 'lean_in');
    K.gesture(C.skye, 'tap', 'L', 1);                                                              // hand on his desk
    K.putOn(C.skye, { pos: side.pos.clone().setY(-drop), heading: side.heading }, { sit: true });
  } else {
    const to = V(side.pos.x - 1.0, 0, side.pos.z - 8.5);
    const m = travel(side.pos, to, T.bye0(), t, 7);
    poseAt(C.skye, K.gait('walk', m.anim), m.pos, m.heading);
    K.gesture(C.skye, K.ARM_GESTURES.wave.map((v, i) => (i === 2 ? v + 10 * Math.sin(t * 11) : v)), 'R', smooth(inv(T.bye0(), T.bye0() + 0.2, t)));
    C.skye.bones.Head.rotateY(0.3 * smooth(inv(T.bye0(), T.bye0() + 0.3, t)));                     // looking back at him
  }
  // extras: three at their desks
  C.extras.forEach((e, i) => {
    if (i > 2) { e.root.visible = false; return; }
    const s = M.extra(i);
    K.posture(e, 'sit_chair'); K.putOn(e, { pos: V(s.pos.x, K.seatY(e, s.seatTop), s.pos.z), heading: s.heading }, { sit: true });
    e.setFace(i === 1 ? 'happy' : 'neutral');
  });
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}
