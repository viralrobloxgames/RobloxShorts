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
  stove: () => K.mark('kitchen', 'stove', { pos: V(-7, 0, 5.5), heading: -2.4 }),
  stairsMid: () => K.mark('kitchen', 'stairs_mid', { pos: V(9, 0, 5), heading: PI }),
  stairsFoot: () => K.mark('kitchen', 'stairs_foot', { pos: V(8, 0, 0.5), heading: PI }),
  hide: () => K.mark('kitchen', 'island_hide', { pos: V(1, 0, -1.2), heading: PI }),
  islandDad: () => K.mark('kitchen', 'island_dad', { pos: V(-2.4, 0, 3.4), heading: PI }),
  islandMax: () => K.mark('kitchen', 'island_max', { pos: V(0.4, 0, 3.4), heading: PI }),
  islandLily: () => K.mark('kitchen', 'island_lily', { pos: V(2.8, 0, 3.4), heading: PI }),
  stack: () => K.mark('kitchen', 'pancake_stack', { pos: V(0.6, 3.6, 1.2), heading: 0 }),
  backDoor: () => K.mark('kitchen', 'back_door', { pos: V(-9.5, 0, -2.5), heading: -PI / 2 }),
  backStep: () => K.mark('exterior', 'back_step', { pos: V(0, 0, 0), heading: PI }),
  deskSkye: () => K.mark('classroom', 'desk_skye', { pos: V(-5, 0, -2), heading: PI }),
  deskMax: () => K.mark('classroom', 'desk_max', { pos: V(-2, 0, 2), heading: PI }),
  deskMaxSide: () => K.mark('classroom', 'desk_max_side', { pos: V(-4, 0, 1.2), heading: PI / 2 }),
  extra: (i) => K.mark('classroom', `desk_extra_${i + 1}`, { pos: [V(2, 0, -2), V(4.5, 0, 2), V(1, 0, 6)][i], heading: PI }),
};

// ---------- setup ----------
let C, A, P = {}, pancakes = -1;
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'kitchen', 'exterior', 'classroom']);
  K.setState({ chapter: 2, hatch: 'open', pancakes: 12, fridge: 'LILY' });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack');
  K.dress(C.dad, 'dad_apron'); K.dress(C.lily, 'lily_pjs');
  A = await K.loadAnims(['idle', 'walk', 'run', 'climb', 'duck', 'sit', 'talk', 'point', 'shrug', 'laugh', 'think', 'look_up', 'facepalm', 'horror_reach']);
  P.spatula = K.makeProp('spatula'); stage.scene.add(P.spatula); K.hold(P.spatula, C.dad, 'R');
  P.pancake = K.makeProp('pancake'); stage.scene.add(P.pancake);
}
const setPancakes = (n) => { if (n !== pancakes) { pancakes = n; K.setState({ chapter: 2, hatch: 'open', pancakes: n, fridge: 'LILY' }); } };

// ---------- key times ----------
const T = {
  kitchen: () => wd(1, 15, -0.1),                // "Rule two:" -> cut to the kitchen
  freeze: () => wd(1, 22),                        // "six."
  duck0: () => endOf(1, 0.05),                    // Skye runs from the stair foot to the island
  famIn: () => endOf(3, 0.05),                    // Max shuffles in, Lily skips behind
  steal: () => endOf(8, 0.1),                     // [+0.8] the hand over the island
  crawl0: () => at(13, 1.2),                      // Skye crawls to the back door during Dad's syrup line
  out: () => at(14, -0.3),
  class: () => at(15, -0.2),
  sitUp: () => endOf(19, 0.08),                   // [+0.6] Max sits up
  bye0: () => wd(21, 2, -0.1),                    // "Everybody does that." she backs off towards her desk
};

// ---------- the shot table ----------
const SHOTS = [
  { at: () => 0, id: 'hall', set: 'hallway', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'ws', { angle: -0.75, height: 0.6, look: V(0, 0.4, 0) }) },
  { at: T.kitchen, id: 'kitchen_wide', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: K.mark('kitchen', 'cam_wide', { pos: V(0, 7, -15) }).pos, target: K.mark('kitchen', 'cam_wide_target', { pos: V(0, 3, 3) }).pos, fov: 50 }) },
  { at: () => at(2, 0.9), id: 'dad_morning', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.5 }) },
  { at: () => at(3, -0.1), id: 'skye_whisper', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.3, height: 0.3 }) },
  { at: T.famIn, id: 'family_in', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: K.mark('kitchen', 'cam_wide', { pos: V(0, 7, -15) }).pos, target: K.mark('kitchen', 'cam_wide_target', { pos: V(0, 3, 3) }).pos, fov: 50 }) },
  { at: () => at(4, 1.6), id: 'max_dad', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.dad, C.max, { framing: 'ms', bias: 0.6 }) },
  { at: () => at(5, -0.1), id: 'dad_pipes', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.45 }) },
  { at: () => at(6, -0.1), id: 'lily_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.35 }) },
  { at: () => at(7, -0.1), id: 'dad_ghost', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.45 }) },
  { at: () => at(8, -0.1), id: 'max_notfunny', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.3 }) },
  { at: T.steal, id: 'steal', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.55, height: 0.4, zoom: 1.5, look: V(0, 1.2, 0) }) },
  { at: () => at(9, -0.1), id: 'dad_count', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.4 }) },
  { at: () => at(10, -0.1), id: 'lily_ghost2', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.35 }) },
  { at: () => at(11, -0.1), id: 'max_lily', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.max, C.lily, { framing: 'ms', bias: 0.4 }) },
  { at: () => at(12, -0.1), id: 'lily_ghosts', set: 'kitchen', light: 'predawn', cam: (s) => K.twoShot(s, C.max, C.lily, { framing: 'mcu', bias: 0.65 }) },
  { at: () => at(13, -0.1), id: 'dad_syrup', set: 'kitchen', light: 'predawn', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.45 }) },
  { at: T.crawl0, id: 'crawl', set: 'kitchen', light: 'predawn', cam: (s) => K.setCam(s, { pos: K.mark('kitchen', 'cam_crawl', { pos: V(-3, 1.6, -8) }).pos, target: K.mark('kitchen', 'cam_crawl_target', { pos: V(-5, 1.2, -1.5) }).pos, fov: 55 }) },
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
  K.applyLight(stage, sh.light, { set });
  const idle = K.holdClock(t, L, [[T.kitchen(), T.duck0() + 1], [T.famIn(), at(4, 2)], [T.steal(), at(9)], [T.crawl0(), at(14)], [endOf(21), endOf(21)]]);
  P.pancake.visible = false; P.spatula.visible = false;

  if (sh.set === 'hallway') hallway(t, idle);
  else if (sh.set === 'kitchen') kitchen(t, idle, sh);
  else if (sh.set === 'exterior') outside(t, idle);
  else classroom(t, idle, sh);

  for (const who of ['skye', 'max', 'dad', 'lily']) if (C[who].root.visible) K.speak(C[who], faceAt(who, t), t, sayer(who));
  K.setBlockers(set.group, C.skye, C.max, C.dad, C.lily);
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
function kitchen(t, idle, sh) {
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  // pancakes on the island: 12 until Skye's hand slides one off
  const slide = T.steal() + 0.45;
  setPancakes(t < slide ? 12 : 11);

  // Dad: at the stove flipping (spatula), then over to the island for "Who wants pancakes?" and the rest
  const stove = M.stove(), isl = M.islandDad();
  P.spatula.visible = true;
  if (t < at(2, 0.6)) {
    const flip = Math.sin(clamp((t - T.kitchen()) * 3.5, 0, 50));
    K.playAnim(C.dad, [[A.idle, idle], [A.point, 0.25 + 0.12 * flip, 0.5, false]]);
    K.putOn(C.dad, stove, { heading: stove.heading + (t > T.kitchen() + 1.2 ? 0.7 : 0) });
  } else {
    const m = K.walk(C.dad, A, stove, isl, at(2, 0.6), t, { idleAt: idle, endHeading: isl.heading });
    if (m.done) {
      const layers = [[A.idle, idle]];
      if (t >= at(2) && t < endOf(2)) layers.push([A.point, 0.4, wd(2, 6) <= t ? 0.6 : 0, false]);        // "Everybody" spatula out
      if (t >= at(7) && t < endOf(7)) layers.push([A.laugh, t - at(7), 0.7]);
      if (t >= at(9) && t < endOf(9)) layers.push([A.point, 0.4, 0.6, false]);                            // points the spatula at the stack
      if (t >= at(13) && t < endOf(13)) layers.push([t < wd(13, 4) ? A.look_up : A.point, t - at(13), 0.7, false]);
      K.playAnim(C.dad, layers);
      const look = t >= at(9) && t < endOf(9) ? M.stack() : t >= at(5) && t < endOf(5) ? C.max : null;
      K.putOn(C.dad, isl, { heading: look ? lerp(isl.heading, K.faceTo(isl, look), 0.6) : isl.heading });
    }
  }

  // Max shuffles in (slow walk), Lily skips behind him; both face front over the island
  const sf = M.stairsFoot(), im = M.islandMax(), il = M.islandLily();
  if (t < T.famIn()) { C.max.root.visible = false; C.lily.root.visible = false; }
  else {
    K.walk(C.max, A, sf, im, T.famIn(), t, { speed: 7, idleAt: idle, endHeading: t >= at(11) && t < endOf(12) ? K.faceTo(im, il) : im.heading });
    const lm = K.walk(C.lily, A, sf, il, T.famIn() + 0.5, t, { speed: 10, idleAt: idle + 0.4, endHeading: t >= at(11) && t < endOf(12) ? K.faceTo(il, im) : il.heading });
    if (lm.moving) C.lily.root.position.y += 0.35 * Math.abs(Math.sin(lm.anim * PI * 2));                // skip
    if (t >= at(8) && t < endOf(8)) K.playAnim(C.max, [[A.idle, idle], [A.facepalm, t - at(8), 0.6, false]]);
    if (t >= at(12) && t < endOf(12)) C.lily.root.position.y += 0.12 * Math.abs(Math.sin((t - at(12)) * 7));   // bouncing on her heels
  }

  // Skye: halfway down the stairs, freezes on "six", runs to the island and crouches, steals, then crawls out
  const sm = M.stairsMid(), hide = M.hide(), door = M.backDoor();
  if (t < T.duck0()) {
    const m = K.walk(C.skye, A, sm, sf, T.kitchen() - 0.6, t, { speed: 6, idleAt: idle });
    if (t >= T.freeze()) { K.playAnim(C.skye, [[A.idle, 0]]); C.skye.root.rotation.y = K.faceTo(C.skye.root.position, M.stove()); }
    void m;
  } else if (t < T.duck0() + 0.9) {
    const m = K.walk(C.skye, A, { pos: sf.pos }, hide, T.duck0(), t, { speed: 16 });
    if (m.done) crouch(t, hide, idle);
  } else if (t < T.crawl0()) {
    crouch(t, hide, idle);
    if (t >= T.steal() && t < T.steal() + 1.2) {                                                          // one arm up over the counter
      const u = inv(T.steal(), T.steal() + 0.4, t) - inv(T.steal() + 0.7, T.steal() + 1.1, t);
      K.playAnim(C.skye, [[A.duck, 1, 1, false], [A.horror_reach, 0.6, u, false]]);
    }
    if (t >= slide) { P.pancake.visible = true; K.hold(P.pancake, C.skye, 'R'); }
  } else {
    // crawl: low and moving, the cycle driven by the distance covered (kit-cast crawl pose replaces duck+walk)
    const m = travel(hide.pos, door.pos, T.crawl0(), t, 3.2);
    K.playAnim(C.skye, [[A.duck, 1, 0.6, false], [A.walk, m.anim * 2.2, 0.4]]);
    K.putOn(C.skye, { pos: m.pos, heading: m.heading });
    if (m.done) C.skye.root.visible = false;
    P.pancake.visible = C.skye.root.visible; K.hold(P.pancake, C.skye, 'mouth');
  }
}
function crouch(t, m, idle) { K.playAnim(C.skye, [[A.duck, 1, 1, false]]); K.putOn(C.skye, m); }

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
