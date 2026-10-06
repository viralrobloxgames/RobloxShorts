// Ch2 "Twelve Pancakes" (TUESDAY 6:04 AM). Shot plan: production/shots/ch02.md. Boundary: source/boundary_sheet.md
// (Start of Ch2: hallway predawn, Skye on the attic ladder; End of Ch2: classroom, Skye waving on her way back to her
// desk, Max bolt upright). Built from web/ch_template.js; everything is a pure function of t.
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch02.js --out /tmp/ch02 \
//            --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';
import { clamp, lerp, inv, smooth } from '../../../web/lib/anim.js';
import { travel } from '../../../web/lib/locomotion.js';
import { waveArm } from '../../../web/lib/gestures.js';

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
const at = (line, off = 0) => L.line(line).start + off;
const endOf = (line, off = 0) => L.line(line).end + off;
// start of the k-th word (0-based) of a spoken line
const wd = (line, k, off = 0) => { const l = L.line(line); const ws = L.words.filter((w) => w.start >= l.start - 0.02 && w.start < l.end); return (ws[Math.min(k, ws.length - 1)]?.start ?? l.start) + off; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PI = Math.PI;

// ---------- marks (fallbacks: offsets from the set origin, inside the box room, camera side -z) ----------
const M = {
  ladderTop: () => K.mark('hallway', 'ladder_top', { pos: V(1.5, 6.2, 2), heading: PI / 2 }),
  ladderFoot: () => K.mark('hallway', 'ladder_foot', { pos: V(-2, 0, 2), heading: PI / 2 }),
  stairsTop: () => K.mark('hallway', 'stairs_top', { pos: V(-9, 0, -3), heading: -PI / 2 }),
  stove: () => K.mark('kitchen', 'stove_three_quarter'),
  stoveTurned: () => K.mark('kitchen', 'stove_turned'),
  hide: () => K.mark('kitchen', 'island_hide'),
  reach: () => K.mark('kitchen', 'island_hide_reach'),
  stoolMax: () => K.mark('kitchen', 'island_stool_4'),
  stoolLily: () => K.mark('kitchen', 'island_stool_3'),
  stairsBottom: () => K.mark('kitchen', 'stairs_bottom'),
  backCrawl: () => K.mark('kitchen', 'back_door_crawl'),
  backStep: () => K.mark('exterior', 'back_step', { pos: V(0, 0, 0), heading: PI }),
  deskSkye: () => K.mark('classroom', 'desk_skye', { pos: V(-5, 0, -2), heading: PI }),
  deskMax: () => K.mark('classroom', 'desk_max', { pos: V(-2, 0, 2), heading: PI }),
  deskMaxSide: () => K.mark('classroom', 'desk_max_side', { pos: V(-4, 0, 1.2), heading: PI / 2 }),
  extra: (i) => K.mark('classroom', `desk_extra_${i + 1}`, { pos: [V(2, 0, -2), V(4.5, 0, 2), V(1, 0, 6)][i], heading: PI }),
};

// ---------- setup ----------
let C, A, P = {};
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'kitchen', 'exterior', 'classroom']);
  K.setState({ chapter: 2, hatch: 'open' });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack');
  K.dress(C.dad, 'dad_apron'); K.dress(C.lily, 'lily_pjs');
  A = await K.loadAnims(['idle', 'walk', 'run', 'climb', 'duck', 'sit', 'talk', 'point', 'shrug', 'laugh', 'think', 'look_up', 'facepalm', 'horror_reach']);
  P.spatula = K.makeProp('spatula'); stage.scene.add(P.spatula); K.hold(P.spatula, C.dad, 'R');
  P.pancake = K.makeProp('pancake'); stage.scene.add(P.pancake);
}

// ---------- key times ----------
const T = {
  kitchen: () => wd(1, 15, -0.1),                // "Rule two:" -> cut to the kitchen
  freeze: () => wd(1, 22),                        // "six."
  duck0: () => endOf(1, 0.05),                    // Skye runs from the stair foot to the island
  famIn: () => at(3, 0.3),                         // Max shuffles down the stairs, Lily skips behind
  steal: () => endOf(8, 0.1),                     // [+0.8] the hand over the island
  crawl0: () => at(13, 0.5),                      // Skye crawls to the back door during Dad's syrup line
  out: () => at(14, -0.3),
  class: () => at(15, -0.2),
  sitUp: () => endOf(19, 0.08),                   // [+0.6] Max sits up
  bye0: () => wd(21, 2, -0.1),                    // "Everybody does that." she backs off towards her desk
};

// ---------- the shot table ----------
const SHOTS = [
  { at: () => 0, id: 'hall', set: 'hallway', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'ws', { angle: -0.75, height: 0.6, look: V(0, 0.4, 0) }) },
  { at: T.kitchen, id: 'kitchen_wide', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('wide'), { clear: false }) },
  { at: () => at(2, 1.2), id: 'dad_morning', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.55, height: 1.2 }) },
  { at: () => at(3, -0.1), id: 'skye_whisper', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.45, height: 0.2 }) },
  { at: () => at(4, -0.1), id: 'family_in', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('wide'), { clear: false }) },
  { at: () => at(4, 2.6), id: 'max_dad', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('island_stools_right'), { clear: false }) },
  { at: () => at(5, -0.1), id: 'dad_pipes', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.55, height: 1.2 }) },
  { at: () => at(6, -0.1), id: 'lily_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(7, -0.1), id: 'dad_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.55, height: 1.2 }) },
  { at: () => at(8, -0.1), id: 'max_notfunny', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.3, height: 0.9 }) },
  { at: T.steal, id: 'steal', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('pancake_reach'), { clear: false }) },
  { at: () => at(9, -0.1), id: 'dad_count', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.7 }) },
  { at: () => at(10, -0.1), id: 'lily_ghost2', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: -0.45, height: 0.6, look: V(0, 0.45, 0) }) },
  { at: () => at(11, -0.1), id: 'max_lily', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.lily, C.max, { framing: 'mcu', bias: 0.6, height: 1.0 }) },
  { at: () => at(12, -0.1), id: 'lily_ghosts', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.lily, C.max, { framing: 'mcu', bias: 0.35, height: 1.0 }) },
  { at: () => at(13, -0.1), id: 'dad_syrup', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.7 }) },
  { at: T.crawl0, id: 'crawl', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, kc('back_door_wide'), { clear: false }) },
  { at: T.out, id: 'back_step', set: 'exterior', light: 'predawn', cam: (s) => K.overShoulder(s, C.max, C.skye, 'mcu') },
  { at: T.class, id: 'class_two', set: 'classroom', light: 'school_day', cam: (s) => K.twoShot(s, C.skye, C.max, { framing: 'ms' }) },
  { at: () => at(16, -0.1), id: 'max_haunted', set: 'classroom', light: 'school_day', cam: (s) => K.overShoulder(s, C.skye, C.max, 'mcu') },
  { at: () => at(17, -0.1), id: 'skye_ghost', set: 'classroom', light: 'school_day', cam: (s) => K.overShoulder(s, C.max, C.skye, 'mcu') },
  { at: () => at(18, -0.1), id: 'max_alert', set: 'classroom', light: 'school_day', cam: (s) => K.overShoulder(s, C.skye, C.max, 'mcu') },
  { at: () => at(19, -0.1), id: 'skye_blanket', set: 'classroom', light: 'school_day', cam: (s) => K.overShoulder(s, C.max, C.skye, 'mcu') },
  { at: T.sitUp, id: 'sit_up', set: 'classroom', light: 'school_day', cam: (s) => K.twoShot(s, C.skye, C.max, { framing: 'ms' }) },
  { at: () => at(20, 0.0), id: 'max_how', set: 'classroom', light: 'school_day', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.35 }) },
  { at: () => at(21, -0.1), id: 'bye', set: 'classroom', light: 'school_day', cam: (s) => K.twoShot(s, C.skye, C.max, { framing: 'ws', bias: 0.45 }) },
].map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start);
function kc(name) { return K.getSet('kitchen').cams[name]; }
export const SHOT_LIST = SHOTS.map((x) => [x.id, +x.start.toFixed(2), Math.round(x.start * 30) + 1]);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// faces: [from time, face] per character; speak() adds talking / mouth_o on their words
const FACE = {
  skye: () => [[0, 'nervous'], [T.freeze(), 'shocked'], [T.duck0() + 0.6, 'nervous'], [at(3), 'annoyed'], [endOf(3), 'nervous'], [T.steal(), 'scheming'],
    [at(9), 'nervous'], [at(12), 'scheming'], [T.out(), 'happy'], [T.class(), 'smug'], [T.sitUp(), 'shocked'], [at(21), 'nervous'], [wd(21, 5, -0.2), 'happy']],
  max: () => [[0, 'nervous'], [at(4), 'scared'], [endOf(4), 'nervous'], [at(6), 'annoyed'], [at(9), 'surprised'], [at(10), 'annoyed'], [T.class(), 'annoyed'],
    [at(16), 'scared'], [at(18), 'determined'], [at(19), 'annoyed'], [T.sitUp(), 'suspicious']],
  dad: () => [[0, 'happy'], [at(7), 'laugh'], [endOf(7), 'happy'], [at(9), 'surprised'], [wd(9, 7), 'suspicious'], [at(10), 'happy']],
  lily: () => [[0, 'neutral'], [at(6), 'smug']],
};
const faceAt = (who, t) => { let f = 'neutral'; for (const [a, x] of FACE[who]()) if (t >= a) f = x; return f; };
const sayer = (who) => L.said(who === 'skye' ? 'SKYE' : who.toUpperCase());

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.applyLight(stage, sh.light, sh.set === 'kitchen' ? {} : { set });   // the kitchen's practicals follow its own setState (time: predawn)
  const idle = K.holdClock(t, L, [[T.kitchen(), T.duck0() + 1], [T.famIn(), at(4, 2)], [T.steal(), at(9)], [T.crawl0(), at(14)], [endOf(21), endOf(21)]]);
  P.pancake.visible = false; P.spatula.visible = false;

  if (sh.set === 'hallway') hallway(t, idle);
  else if (sh.set === 'kitchen') kitchen(t, idle, sh);
  else if (sh.set === 'exterior') outside(t, idle);
  else classroom(t, idle, sh);

  for (const who of ['skye', 'max', 'dad', 'lily']) if (C[who].root.visible) K.speak(C[who], faceAt(who, t), t, sayer(who));
  if (sh.set === 'kitchen') K.setBlockers(set.group); else K.setBlockers(set.group, C.skye, C.max, C.dad, C.lily);   // kitchen: the kids on the stools sit between the camera and Dad by design
  sh.cam(stage, t);
}

// Shot 1: Skye climbs down the attic ladder (rung cycle driven by the height descended), then tiptoes past Max's door.
function hallway(t, idle) {
  K.only(C, ['skye']);
  const top = M.ladderTop(), foot = M.ladderFoot(), stairs = M.stairsTop(), climbEnd = 3.0;
  if (t < climbEnd) {
    const u = smooth(inv(0.0, climbEnd, t));
    const pos = top.pos.clone().lerp(foot.pos, u);
    K.playAnim(C.skye, [[A.climb, (top.pos.y - pos.y) / 2.2]]);
    K.putOn(C.skye, { pos, heading: foot.heading }, { sit: true });
  } else {
    const m = K.walk(C.skye, A, foot, stairs, climbEnd + 0.25, t, { speed: 9, idleAt: idle });
    if (!m.moving && !m.done) C.skye.root.rotation.y = foot.heading - 0.6;   // looks round at Max's door before going
  }
}

// The kitchen: Dad at the stove, Skye down the stairs and behind the island, Max and Lily come in, the steal, the crawl.
// Kitchen layout (sets/kitchen.js): camera side +z; stove at the back, stools on the island's back side facing +z,
// Skye hides on the front side; the stairs come down the right wall, the back door beside their foot.
let KS = '';
function kitchenState(st) { const k = JSON.stringify(st); if (k !== KS) { KS = k; K.getSet('kitchen').setState({ chapter: 2, ...st }); } }
function stairsWalk(actor, t0, t, u0, u1, speed, idleAt) {
  // walk down the stairs from u0 to u1 of the set's stair path; legs driven by distance travelled
  const ks = K.getSet('kitchen'), a = ks.stairsPath(u0).pos, b = ks.stairsPath(u1).pos, len = a.distanceTo(b);
  const u = clamp((t - t0) * speed / len), p = ks.stairsPath(lerp(u0, u1, u));
  K.playAnim(actor, u > 0 && u < 1 ? [[A.walk, u * len / 14.5]] : [[A.idle, idleAt]]);
  K.putOn(actor, p);
  return { done: u >= 1, end: t0 + len / speed };
}
function kitchen(t, idle, sh) {
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  const slide = T.steal() + 0.45;
  kitchenState({ pancakes: t < slide ? 12 : 11, backDoor: smooth(inv(T.crawl0() + 2.6, T.crawl0() + 3.2, t)) });

  // Dad: cooking at the stove (3/4), turned to the room for his lines; walks to the island end for the count
  const stove = M.stove(), turned = M.stoveTurned(), end = K.mark('kitchen', 'island_end_left');
  P.spatula.visible = true;
  const talking = L.lines.some((l) => l.speaker === 'DAD' && t >= l.start - 0.2 && t < l.end + 0.3);
  if (t < at(9)) {
    const flip = t < at(2) ? Math.abs(Math.sin((t - T.kitchen()) * 4)) : 0;
    const layers = [[A.idle, idle], [A.point, 0.2 + 0.2 * flip, talking ? 0.3 : 0.6, false]];
    if (t >= at(7) && t < endOf(7)) layers.push([A.laugh, t - at(7), 0.7]);
    K.playAnim(C.dad, layers);
    K.putOn(C.dad, talking ? turned : stove);
  } else {
    const m = K.walk(C.dad, A, turned, end, at(9), t, { idleAt: idle });
    if (m.done) {
      const layers = [[A.idle, idle]];
      if (t < endOf(9)) layers.push([A.point, 0.4, 0.6, false]);                                          // the spatula at the stack
      if (t >= at(13) && t < endOf(13) + 0.5) layers.push([t < wd(13, 5) ? A.look_up : A.point, t - at(13), 0.7, false]);
      K.playAnim(C.dad, layers);
      K.putOn(C.dad, end, { heading: t >= at(10) && t < at(13) ? end.heading + 0.5 : t >= at(13) ? end.heading - 0.9 : end.heading });
    }
  }

  // Max shuffles down the stairs to stool 3, Lily skips behind him to stool 2
  for (const [who, stool, d, sp] of [['max', M.stoolMax(), 0, 8], ['lily', M.stoolLily(), 0.6, 10]]) {
    const a = C[who], t0 = T.famIn() + d;
    if (t < t0) { a.root.visible = false; continue; }
    const sw = stairsWalk(a, t0, t, 0, 1, sp, idle);
    if (!sw.done) continue;
    const behind = { pos: stool.pos.clone().add(V(0, 0, -1.6)).setY(0), heading: 0 };
    const m = K.walk(a, A, M.stairsBottom(), behind, sw.end, t, { speed: sp, idleAt: idle });
    if (who === 'lily' && m.moving) a.root.position.y += 0.3 * Math.abs(Math.sin(m.anim * PI * 2));     // skip
    if (m.done) {
      const look = (who === 'max' && t >= at(11) && t < endOf(12)) ? K.faceTo(stool, M.stoolLily()) * 0 - 0.5 : (who === 'lily' && t >= at(11) && t < endOf(12)) ? 0.5 : 0;
      K.playAnim(a, [[A.sit, 1, 1, false], [A.idle, idle, 0.15]]);
      K.putOn(a, stool, { sit: true, heading: stool.heading + look });
      if (who === 'max' && t >= at(8) && t < endOf(8)) K.playAnim(a, [[A.sit, 1, 1, false], [A.facepalm, t - at(8), 0.5, false]]);
      if (who === 'lily' && t >= at(12) && t < endOf(12)) a.root.position.y += 0.1 * Math.abs(Math.sin((t - at(12)) * 7));
    }
  }

  // Skye: on the stairs at the cut, freezes on "six", runs down to the island and hides; steals; crawls out
  const hide = M.hide(), reach = M.reach(), crawlTo = M.backCrawl();
  const ks = K.getSet('kitchen'), STAIR_LEN = ks.stairsPath(0).pos.distanceTo(ks.stairsPath(1).pos);
  const uFreeze = 0.3 + 0.7 * clamp((T.freeze() - T.kitchen() + 0.6) * 5 / (0.7 * STAIR_LEN));
  if (t < T.duck0()) {
    stairsWalk(C.skye, T.kitchen() - 0.6, Math.min(t, T.freeze()), 0.3, 1, 5, 0);
    if (t >= T.freeze()) { K.playAnim(C.skye, [[A.idle, 0]]); C.skye.root.rotation.y = -0.6; }   // frozen, looking at Dad
  } else if (t < T.duck0() + 1.6) {
    const sw = stairsWalk(C.skye, T.duck0(), t, uFreeze, 1, 14, 0);
    if (sw.done) { const m = K.walk(C.skye, A, M.stairsBottom(), hide, sw.end, t, { speed: 16 }); if (m.done) floorSit(hide); }
  } else if (t < T.steal() || t >= T.steal() + 1.3 && t < T.crawl0()) {
    floorSit(hide);
    if (t >= slide) { P.pancake.visible = true; K.hold(P.pancake, C.skye, 'R'); }
  } else if (t < T.crawl0()) {
    // turned to the island, crouched, one arm up over the counter to the stack
    const u = inv(T.steal(), T.steal() + 0.35, t) - inv(T.steal() + 0.8, T.steal() + 1.2, t);
    K.playAnim(C.skye, [[A.duck, 1, 1, false], [A.horror_reach, 0.6, u, false]]);
    K.putOn(C.skye, reach, { sit: true });
    if (t >= slide) { P.pancake.visible = true; K.hold(P.pancake, C.skye, 'R'); }
  } else {
    // crawl (kit-cast crawl pose replaces duck + walk when it lands): cycle driven by the distance covered
    const m = travel(reach.pos, crawlTo.pos.clone().add(V(5, 0, 0)), T.crawl0(), t, 4);
    K.playAnim(C.skye, [[A.duck, 1, 0.6, false], [A.walk, m.anim * 2.2, 0.4]]);
    K.putOn(C.skye, { pos: m.pos, heading: m.heading }, { sit: true });
    P.pancake.visible = true; K.hold(P.pancake, C.skye, 'mouth');
  }
}
function floorSit(m) { K.playAnim(C.skye, [[A.sit, 1, 1, false]]); K.putOn(C.skye, m, { sit: true }); }

// Outside the back door: "Best. Pancake. Ever." (bites on "Ever")
function outside(t, idle) {
  K.only(C, ['skye']);
  const st = M.backStep();
  K.playAnim(C.skye, [[A.idle, idle], [A.point, 0.3, t >= wd(14, 2, -0.2) ? 0.7 : 0.35, false]]);
  K.putOn(C.skye, st);
  P.pancake.visible = true; K.hold(P.pancake, C.skye, 'R');
}

// The classroom before the bell: Max slumped at his desk, Skye leaning on it; extras at their desks.
function classroom(t, idle, sh) {
  K.only(C, ['skye', 'max', 'extras']);
  K.dress(C.max, 'max_school');
  const dm = M.deskMax(), side = M.deskMaxSide(), ds = M.deskSkye();
  K.setLine(C.max, C.skye, 1);
  // Max: slumped until he sits bolt upright
  const up = smooth(inv(T.sitUp(), T.sitUp() + 0.25, t));
  K.playAnim(C.max, [[A.sit, 1, 1, false], [A.idle, idle, 0.15]]);
  K.putOn(C.max, dm, { sit: true, heading: lerp(dm.heading - 0.5, dm.heading - 0.25, up) });
  C.max.bones.Torso && C.max.bones.Torso.rotateX(0.35 * (1 - up));
  // Skye: leans on his desk, then backs off to her own, waving on "Bye!"
  if (t < T.bye0()) {
    K.playAnim(C.skye, [[A.idle, idle], [A.point, 0.3, 0.3, false]]);
    K.putOn(C.skye, side, { heading: K.faceTo(side, dm) });
  } else {
    const m = K.walk(C.skye, A, side, { pos: ds.pos.clone().add(V(-1.5, 0, 1.2)) }, T.bye0(), t, { speed: 8, idleAt: idle, endHeading: K.faceTo(ds, dm) });
    if (t >= wd(21, 5, -0.15)) waveArm(C.skye, t, 'R');
    if (!m.moving) C.skye.root.rotation.y = lerp(C.skye.root.rotation.y, K.faceTo(C.skye.root.position, dm), 0.5);
  }
  // extras: three at their desks, idle
  C.extras.forEach((e, i) => {
    if (i > 2) { e.root.visible = false; return; }
    K.playAnim(e, [[A.sit, 1, 1, false], [A.idle, idle + i * 0.9, 0.2]]); K.putOn(e, M.extra(i), { sit: true });
  });
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}
