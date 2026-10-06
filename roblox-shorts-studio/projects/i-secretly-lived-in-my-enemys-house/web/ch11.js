// Ch11 "No Crusts" (SUNDAY 8:30 AM) + the ~12 s end screen. Shot plan: production/shots/ch11.md.
// Kitchen, Sunday morning: Skye walks down the stairs like a normal person, owns up, rings her mum; the fridge says
// SAY YES; Max asks her to the dance; pancakes for everyone; the end screen on the wide of the island.
// Everything is a pure function of t (the runner may render frames in any order).
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 11;
const CARD = { day: 'SUNDAY', time: '8:30 AM' };
// Estimate until audio/chapters/ch11/lines.json exists: ~2.5 words/s, 0.25 s between lines, the script's [+N] pauses.
const EST = (() => {
  const raw = [
    ['VO', 'Sunday. Day seven. For the first time all week, I walked down the stairs like a normal person.'],
    ['DAD', 'Morning, Max! Morning, Lily! Morning...'], ['DAD', 'Pumpkin girl?'],
    ['MAX', "Dad, this is Skye. She's the ghost."], ['DAD', 'The pancake thief!'],
    ['SKYE', 'Sorry about the pancakes. And the sheet. And the ham. And the fridge.'],
    ['LILY', 'I knew first.'], ['DAD', 'You knew?'], ['LILY', 'She was my horse.'],
    ['DAD', "Does your mother know where you've been all week?"], ['SKYE', "She thinks I'm at a sleepover."],
    ['DAD', 'For a week?'], ['SKYE', "It's a really long sleepover."], ['DAD', 'Phone. Now. Then pancakes.'],
    ['SKYE', 'Hi, Mom. So. Funny story.'],
    ['MAX', 'So. The Halloween dance. Do you want to go? With me?', 0.8],
    ['SKYE', 'Are you asking me, or is the fridge asking me?'], ['LILY', 'The fridge says yes.'],
    ['SKYE', 'Fine. One condition.'], ['MAX', 'No crusts?'], ['SKYE', 'No crusts.'],
    ['DAD', 'Pancakes for everyone! Including the ghost! Especially the ghost.'],
    ['VO', 'I spent a week trying to scare my enemy. He spent it making me sandwiches.', 0.8],
    ['VO', 'Subscribe to Viral Roblox Games for more stories like this.'],
  ];
  let t = 0; const out = [];
  raw.forEach(([speaker, text, pause = 0], index) => {
    if (index) t += 0.25 + pause;
    const d = Math.max(0.8, text.split(/\s+/).length / 2.5);
    out.push({ index, speaker, text, start: t, end: t + d }); t += d;
  });
  return out;
})();
const L = await K.loadLines(import.meta.url, CH, EST);
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
// key lines (indexes as in lines.json)
const LN = { vo: 0, morning: 1, pumpkin: 2, ghost: 3, thief: 4, sorry: 5, knew: 6, youKnew: 7, horse: 8, mother: 9,
  sleepover: 10, week: 11, long: 12, phone: 13, mom: 14, dance: 15, fridgeAsk: 16, says: 17, cond: 18, crusts: 19,
  crusts2: 20, pancakes: 21, spent: 22, sub: 23 };
const T_LATER = end(LN.mom) + 0.1;                    // the "Later" cut: SAY YES, Skye seated
const T_WIDE = end(LN.pancakes) + 0.1;                // the wide on the island
const T_END = at(LN.sub) - 0.1;                       // end screen from the subscribe line
export const meta = K.chapterMeta(Math.max(L.end + 0.75, T_END + 12.2));
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- marks (fallbacks, kitchen-local, only until kit-sets-c defines them) ----------
const km = (name, x, y, z, heading) => () => K.mark('kitchen', name, { pos: V(x, y, z), heading });
const M = {
  stairsTop: km('stairs_top', 9.5, 6.5, 10.5, Math.PI), stairsFoot: km('stairs_foot', 9.5, 0, 3.0, Math.PI),
  stove: km('stove', -8.5, 0, 5, -Math.PI / 2), islandEnd: km('island_end', 6.2, 0, 0.8, -Math.PI / 2),
  stool1: km('island_stool_1', -4.5, 0.9, 1.6, Math.PI), stool2: km('island_stool_2', -1.5, 0.9, 1.6, Math.PI),
  stool3: km('island_stool_3', 1.5, 0.9, 1.6, Math.PI), fridge: km('fridge', 3, 0, 10.5, Math.PI),
  plate2: km('island_plate_2', -1.5, 3.3, 0.4, 0), plate3: km('island_plate_3', 1.5, 3.3, 0.4, 0),
  pan: km('pan', -10.2, 3.5, 5, 0), bagFloor: km('backpack_floor_3', 2.6, 0, 2.4, 0.4),
  phoneDown: km('island_phone_3', 2.4, 3.3, 0.3, 0.3),
};

// ---------- setup ----------
let C, A, P = {}, SET;
export async function setup(stage) {
  await K.buildSets(stage, ['kitchen']);
  K.setState({ chapter: CH, fridge: 'BE NICE 2 SKYE' });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack'); K.dress(C.max, 'max_pjs');
  K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_apron');
  A = await K.loadAnims(['idle', 'walk', 'sit', 'point', 'shrug', 'laugh', 'laugh_big', 'proud', 'think', 'scheming', 'talk']);
  const add = (k, id) => { P[k] = K.makeProp(id); stage.scene.add(P[k]); return P[k]; };
  add('spatula', 'spatula'); add('phone', 'phone'); add('plate', 'sandwich_plate'); add('pancake', 'pancake');
  add('stack', 'pancake_stack'); add('bag', 'backpack');
}
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });

// ---------- the shot table (one scene: the camera stays on the island-front side) ----------
const cam = (name, fb) => (s) => { const c = SET?.cams?.[name]; return c ? K.setCam(s, c) : fb(s); };
const SHOTS = [
  { line: LN.vo, off: 0, id: 'stairs_wide', cam: cam('stairs_wide', (s) => K.twoShot(s, C.skye, C.max, { framing: 'ws' })) },
  { line: LN.morning, off: -0.1, id: 'stove_ms', cam: cam('stove_ms', (s) => K.camOn(s, C.dad, 'ms', { angle: 0.5 })) },
  { line: LN.pumpkin, off: -0.05, id: 'dad_cu', cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { line: LN.ghost, off: -0.05, id: 'island_two', cam: cam('island_two', (s) => K.twoShot(s, C.max, C.skye, { framing: 'ms' })) },
  { line: LN.thief, off: -0.05, id: 'dad_cu', cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { line: LN.sorry, off: -0.1, id: 'skye_mcu', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.4 }) },
  { line: LN.knew, off: -0.05, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.35 }) },
  { line: LN.youKnew, off: -0.05, id: 'dad_cu', cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { line: LN.horse, off: -0.05, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.35 }) },
  { line: LN.mother, off: -0.05, id: 'dad_skye_two', cam: (s) => K.twoShot(s, C.dad, C.skye, { framing: 'ms' }) },
  { line: LN.sleepover, off: -0.05, id: 'skye_mcu', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.4 }) },
  { line: LN.week, off: -0.05, id: 'dad_cu', cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { line: LN.long, off: -0.05, id: 'skye_mcu', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.4 }) },
  { line: LN.phone, off: -0.05, id: 'dad_cu', cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { line: LN.mom, off: -0.45, id: 'phone_ms', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: -0.35 }) },
  { t: T_LATER, id: 'fridge_cu', cam: cam('fridge_cu', (s) => K.camOn(s, C.skye, 'ws', { angle: 0.1, look: M.fridge().pos.clone().add(V(0, 4, 0)) })) },
  { t: T_LATER + 0.6, id: 'island_two_seated', cam: cam('island_two_seated', (s) => K.twoShot(s, C.max, C.skye, { framing: 'ms' })) },
  { line: LN.fridgeAsk, off: -0.05, id: 'skye_cu_fridge', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.25 }) },
  { line: LN.says, off: -0.05, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.35 }) },
  { line: LN.cond, off: -0.05, id: 'skye_cu_fridge', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.25 }) },
  { line: LN.crusts, off: -0.05, id: 'max_cu', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.25 }) },
  { line: LN.crusts2, off: -0.05, id: 'island_two_seated', cam: cam('island_two_seated', (s) => K.twoShot(s, C.max, C.skye, { framing: 'ms' })) },
  { line: LN.pancakes, off: -0.1, id: 'stove_ms', cam: cam('stove_ms', (s) => K.camOn(s, C.dad, 'ms', { angle: 0.5 })) },
  { t: T_WIDE, id: 'island_wide', cam: cam('island_wide', (s) => K.twoShot(s, C.lily, C.dad, { framing: 'ws' })) },
].map((x) => ({ ...x, start: x.t ?? at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- helpers ----------
const inv = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (u) => u * u * (3 - 2 * u);
const lerpH = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;
// one-shot gesture layer over idle: [anim, local time, weight]
const gest = (anim, t0, t, len = 1.2) => (t >= t0 && t < t0 + len ? [[anim, t - t0, 1, false]] : []);

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  SET = K.showSet('kitchen');
  K.setState({ chapter: CH, fridge: t >= T_LATER ? 'SAY YES' : 'BE NICE 2 SKYE' });
  K.applyLight(stage, 'sunday_morning', { set: SET });
  K.setBlockers(SET.group, C.skye, C.max, C.dad, C.lily);
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  K.setLine(C.dad, C.max, 1);
  const idle = K.holdClock(t, L, [[at(LN.vo), at(LN.morning)], [T_WIDE, T_END]]);
  const seated = t >= T_LATER;

  // --- Skye: down the stairs (real walk), to the island end, phone call; after "Later" on stool 3 ---
  const foot = M.stairsFoot(), endM = M.islandEnd(), dadPos = M.stove().pos;
  if (!seated) {
    const tFoot = at(LN.vo) + 5.6;                      // arrives at the foot of the stairs near the end of the VO
    if (t < tFoot + 0.01) {
      const top = M.stairsTop(), d = top.pos.distanceTo(foot.pos);
      K.walk(C.skye, A, top, foot, Math.max(-0.4, tFoot - d / 12), t, { idleAt: idle, endHeading: K.faceTo(foot, C.max.root.position) });
    } else if (t < at(LN.sorry) + 0.3) {
      K.playAnim(C.skye, [[A.idle, idle]]);
      K.putOn(C.skye, foot, { heading: K.faceTo(foot, sh.id === 'island_two' || t < at(LN.thief) ? C.max.root.position : dadPos) });
    } else {
      const m = K.walk(C.skye, A, foot, endM, at(LN.sorry) + 0.3, t, { idleAt: idle, endHeading: K.faceTo(endM, dadPos) });
      if (m.done) {
        let layers = [[A.idle, idle]];
        if (t >= at(LN.sleepover) && t < end(LN.sleepover)) layers.push(...gest(A.shrug, at(LN.sleepover) + 0.2, t, 1.4));
        K.playAnim(C.skye, layers);
        // looking toward the fridge on "And the fridge."
        const look = t > end(LN.sorry) - 0.9 && t < end(LN.sorry) + 0.2 ? M.fridge().pos : dadPos;
        K.putOn(C.skye, endM, { heading: K.faceTo(endM, look) });
      }
    }
    K.dress(C.skye, 'backpack', true);
  } else {
    const st3 = M.stool3();
    let layers = [[A.sit, 0]];
    if (t >= at(LN.fridgeAsk) && t < end(LN.fridgeAsk)) layers.push(...gest(A.point, at(LN.fridgeAsk) + 0.6, t, 1.4));
    if (t >= at(LN.cond) && t < end(LN.cond) + 0.3) layers.push(...gest(A.scheming, at(LN.cond), t, 1.6));
    K.playAnim(C.skye, layers);
    K.putOn(C.skye, st3, { sit: true, heading: lerpH(st3.heading, K.faceTo(st3, C.max.root.position), 0.55) });
    K.dress(C.skye, 'backpack', false);
  }

  // --- Max: stool 2 the whole chapter, turned to whoever matters ---
  const st2 = M.stool2();
  {
    let layers = [[A.sit, 0]];
    if (t >= at(LN.ghost) && t < end(LN.ghost)) layers.push(...gest(A.point, at(LN.ghost) + 0.5, t, 1.5));
    K.playAnim(C.max, layers);
    const tgt = t < at(LN.sorry) ? C.skye.root.position : seated ? C.skye.root.position : dadPos;
    K.putOn(C.max, st2, { sit: true, heading: lerpH(st2.heading, K.faceTo(st2, tgt), 0.5) });
  }

  // --- Lily: stool 1 with her teddy ---
  const st1 = M.stool1();
  {
    let layers = [[A.sit, 0]];
    if (t >= at(LN.says) && t < end(LN.says) + 0.2) layers.push(...gest(A.point, at(LN.says), t, 1.4));
    K.playAnim(C.lily, layers);
    const tgt = t < at(LN.knew) ? C.skye.root.position : t < T_LATER ? dadPos : C.skye.root.position;
    K.putOn(C.lily, st1, { sit: true, heading: lerpH(st1.heading, K.faceTo(st1, tgt), 0.45) });
  }

  // --- Dad: at the stove, spatula in his right hand; turns to the island to talk ---
  const sv = M.stove();
  {
    let layers = [[A.idle, idle]];
    if (t >= at(LN.thief) && t < end(LN.thief) + 0.3) layers.push(...gest(A.point, at(LN.thief), t, 1.3));
    if (t >= at(LN.phone) && t < end(LN.phone)) layers.push(...gest(A.point, at(LN.phone), t, 1.2));
    if (t >= at(LN.mother) && t < end(LN.mother)) layers.push(...gest(A.proud, at(LN.mother) + 0.2, t, 2.2));
    if (t >= at(LN.pancakes) + 1.2) layers.push(...gest(A.laugh, at(LN.pancakes) + 1.2, t, 2.0));
    K.playAnim(C.dad, layers);
    // faces the pan (set heading) except while talking to the island
    const talkTo = t < at(LN.vo) + 6.3 ? null : t < T_LATER ? C.skye.root.position : t < at(LN.pancakes) ? null : C.max.root.position;
    let h = sv.heading;
    if (t >= at(LN.morning) - 0.2 && t < T_LATER) h = lerpH(sv.heading, K.faceTo(sv, C.skye.root.position), sm(inv(at(LN.morning) - 0.2, at(LN.morning) + 0.3, t)));
    else if (t >= at(LN.pancakes) - 0.1 && t < T_WIDE) h = lerpH(sv.heading, K.faceTo(sv, C.max.root.position), 0.6);
    else if (talkTo) h = K.faceTo(sv, talkTo);
    K.putOn(C.dad, sv, { heading: h });
  }

  // --- faces: speak() on each speaker's words, the scripted face otherwise ---
  const skyeF = t < at(LN.long) ? 'nervous' : t < T_LATER ? (t < at(LN.phone) ? 'happy' : 'nervous')
    : t < at(LN.fridgeAsk) ? 'surprised' : t < at(LN.cond) ? 'smug' : t < at(LN.crusts) ? 'scheming' : 'happy';
  const maxF = t >= at(LN.dance) - 0.3 && t < at(LN.crusts) ? 'nervous' : 'happy';
  const lilyF = t >= T_WIDE ? 'happy' : 'smug';
  const dadF = t < at(LN.morning) + 1.0 ? 'happy' : t < at(LN.ghost) ? 'surprised' : t < at(LN.sorry) ? (t < at(LN.thief) ? 'surprised' : 'shocked')
    : t < at(LN.knew) ? 'surprised' : t < at(LN.mother) ? 'surprised' : t < at(LN.week) ? 'suspicious' : t < at(LN.phone) ? 'shocked'
    : t < T_LATER ? 'determined' : t < at(LN.pancakes) ? 'happy' : 'laugh';
  K.speak(C.skye, skyeF, t, L.said('SKYE'));
  K.speak(C.max, maxF, t, L.said('MAX'));
  K.speak(C.lily, lilyF, t, L.said('LILY'));
  K.speak(C.dad, dadF, t, L.said('DAD'));

  // --- props ---
  K.hold(P.spatula, C.dad, 'R');
  const phoneAtEar = t >= at(LN.mom) - 0.4 && t < T_LATER;
  P.phone.visible = phoneAtEar || seated;
  if (phoneAtEar) K.hold(P.phone, C.skye, 'R', 'ear');
  else if (seated) { P.phone.parent !== stage.scene && stage.scene.attach(P.phone); const p = M.phoneDown(); P.phone.position.copy(p.pos); P.phone.rotation.set(0, p.heading, 0); }
  // the crustless sandwich: Max slides the plate from his place to Skye's in the wide
  {
    const a = M.plate2().pos, b = M.plate3().pos, u = sm(inv(T_WIDE + 0.4, T_WIDE + 1.4, t));
    P.plate.visible = t >= T_LATER; P.plate.position.copy(a).lerp(b, u); P.plate.rotation.set(0, 0, 0);
  }
  // pancakes: a stack on the island; the flip from the pan on "Pancakes for everyone!" and in the wide (slow loop)
  {
    P.stack.position.copy(M.plate2().pos).add(V(-3, 0, -0.6));
    const pan = M.pan().pos, flips = [at(LN.pancakes) + 0.3, T_WIDE + 0.6, T_WIDE + 4.6, T_END + 2.5, T_END + 7.5];
    let y = 0, r = 0;
    for (const f of flips) { const u = inv(f, f + 0.9, t); if (u > 0 && u < 1) { y = 2.4 * 4 * u * (1 - u); r = u * Math.PI * 2; } }
    P.pancake.position.copy(pan).add(V(0, 0.15 + y, 0)); P.pancake.rotation.set(r, 0, 0);
  }
  P.bag.visible = seated;
  if (seated) { const b = M.bagFloor(); P.bag.position.copy(b.pos); P.bag.rotation.set(0, b.heading, 0); }

  sh.cam(stage, t);
  OVL = { end: t >= T_END };
}

// ---------- overlay ----------
let OVL = {};
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
  if (OVL.end) K.endScreen(g, s, t, { t0: T_END, dur: 13 });
}
