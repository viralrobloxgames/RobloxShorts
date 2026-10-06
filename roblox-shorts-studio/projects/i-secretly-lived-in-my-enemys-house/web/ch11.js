// Ch11 "No Crusts" (SUNDAY 8:30 AM) + the ~12 s end screen. Shot plan: production/shots/ch11.md.
// Kitchen, Sunday morning: Skye walks down the stairs like a normal person, owns up, rings her mum; the fridge says
// SAY YES; Max asks her to the dance; pancakes for everyone; the end screen on the wide of the island.
// Everything is a pure function of t (the runner may render frames in any order).
// The cast comes from kit/cast.js, which loads and fits the Roblox pack (web/lib/robloxPack.js): the fit check applies.
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
    out.push({ index: index + 1, speaker, text, start: t, end: t + d }); t += d;   // lines.json counts from 1
  });
  return out;
})();
const L = await K.loadLines(import.meta.url, CH, EST);
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
// key lines (indexes as in lines.json: spoken lines from 1)
const LN = { vo: 1, morning: 2, pumpkin: 3, ghost: 4, thief: 5, sorry: 6, knew: 7, youKnew: 8, horse: 9, mother: 10,
  sleepover: 11, week: 12, long: 13, phone: 14, mom: 15, dance: 16, fridgeAsk: 17, says: 18, cond: 19, crusts: 20,
  crusts2: 21, pancakes: 22, spent: 23, sub: 24 };
const T_LATER = end(LN.mom) + 0.1;                    // the "Later" cut: SAY YES, Skye seated
const T_WIDE = end(LN.pancakes) + 0.1;                // the wide on the island
const T_END = at(LN.sub) - 0.1;                       // end screen from the subscribe line
// moments for web/ch11_hold.js (every held prop)
export const KEY = { morning: at(LN.morning) + 0.6, thief: at(LN.thief) + 0.5, phone: at(LN.phone) + 0.5, mom: at(LN.mom) + 0.6,
  knew: at(LN.knew) + 0.3, says: at(LN.says) + 0.5, flip: at(LN.pancakes) + 0.7, wide: T_WIDE + 2.0, end: T_END + 6.0 };
export const meta = K.chapterMeta(Math.max(L.end + 0.75, T_END + 12.2));
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- marks (kitchen; +z is the open camera side, stools on the stove side facing +z) ----------
const KM = (name) => () => K.mark('kitchen', name);
const KL = (x, y, z, heading = 0) => ({ pos: K.SET_ORIGIN.kitchen.clone().add(V(x, y, z)), heading });
const M = {
  stairsTop: KM('stairs_top'), stairsMid: KM('stairs_mid'), stairsLow: KM('stairs_low'), stairsBottom: KM('stairs_bottom'),
  stove: KM('stove_three_quarter'), islandEnd: KM('island_end_right'), fridge: KM('fridge'),
  stool: (i, a) => { const m = K.mark('kitchen', `island_stool_${i}`); m.pos.y += 2 - 2 * (a?.scale ?? 1); return m; },
  plateMax: () => KL(-1.2, 3.6, -1.25), plateSkye: () => KL(1.2, 3.6, -1.25), phoneDown: () => KL(2.3, 3.6, -1.0, 0.4),
  bagFloor: () => KL(2.5, 0, -3.9, -0.5), pan: () => KL(-2.85, 3.78, -10.1),
};
const CHEAT = 0;                                       // heading that faces the camera side (+z)

// ---------- setup ----------
let C, A, P = {}, SET;
export async function setup(stage) {
  await K.buildSets(stage, ['kitchen']);
  K.setState({ chapter: CH });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_apron');
  A = await K.loadAnims(['idle', 'walk', 'sit', 'laugh']);
  const add = (k, id, o) => { P[k] = K.makeProp(id, o); stage.scene.add(P[k]); return P[k]; };
  add('spatula', 'spatula'); add('pan', 'pan', { pancake: true }); add('phone', 'phone'); add('plate', 'plate', { with: 'sandwich' }); add('pancake', 'pancake');
  try { add('bag', 'backpack'); } catch { P.bag = null; }     // floor backpack: requested from kit-props
}
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });

// ---------- the shot table (one scene; every camera on the open +z side of the room) ----------
const KO = K.SET_ORIGIN.kitchen;
// the closing wide / end screen: the four in a compact block at frame centre, SAY YES in the left third, Dad clear between Max and Skye
const WIDE_POS = [6, 10.6, 14], WIDE_TGT = [-2.1, 3.7, -4.6], WIDE_FOV = 38;
// fixed set-ups (kitchen-local), all on the open +z side; walls auto-hide, so no wall pull-in
const fixed = (pos, target, fov) => (s) => K.setCam(s, { pos: KO.clone().add(V(...pos)), target: KO.clone().add(V(...target)), fov }, { clear: false });
const dadCU = (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 });
const skyeMCU = (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.3 });
const lilyCU = fixed([-5.4, 4.6, 4.2], [-4.0, 4.1, -3.2], 26);
const seatedTwo = fixed([-0.2, 5.4, 5.0], [0.0, 4.4, -3.2], 30);
const skyeSeatCU = fixed([6.6, 7.6, 0.9], [-0.2, 5.3, -3.8], 36);      // from front-right: SAY YES on the fridge behind her
const SHOTS = [
  { line: LN.vo, off: 0, id: 'stairs_wide', cam: fixed([5.5, 10.2, 15], [4.6, 5.6, -4], 56) },
  { line: LN.morning, off: -0.1, id: 'stove_ms', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.9 }) },
  { line: LN.pumpkin, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.ghost, off: -0.05, id: 'max_mcu', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.4 }) },
  { line: LN.thief, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.sorry, off: -0.1, id: 'skye_ms', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.3 }) },
  { line: LN.knew, off: -0.05, id: 'lily_cu', cam: lilyCU },
  { line: LN.youKnew, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.horse, off: -0.05, id: 'lily_cu', cam: lilyCU },
  { line: LN.mother, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.sleepover, off: -0.05, id: 'skye_mcu', cam: skyeMCU },
  { line: LN.week, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.long, off: -0.05, id: 'skye_mcu', cam: skyeMCU },
  { line: LN.phone, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.mom, off: -0.45, id: 'phone_ms', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.3 }) },
  { t: T_LATER, id: 'fridge_cu', cam: fixed([-11, 4.7, -4.6], [-11, 4.7, -9], 34) },
  { t: T_LATER + 0.7, id: 'island_two_seated', cam: seatedTwo },
  { line: LN.fridgeAsk, off: -0.05, id: 'skye_cu', cam: skyeSeatCU },
  { line: LN.says, off: -0.05, id: 'lily_cu', cam: lilyCU },
  { line: LN.cond, off: -0.05, id: 'skye_cu', cam: skyeSeatCU },
  { line: LN.crusts, off: -0.05, id: 'max_cu', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.6 }) },
  { line: LN.crusts2, off: -0.05, id: 'island_two_seated', cam: seatedTwo },
  { line: LN.pancakes, off: -0.1, id: 'stove_ms', cam: fixed([4.2, 5.9, -5.6], [-1.6, 4.8, -8.4], 42) },
  { t: T_WIDE, id: 'island_wide', cam: fixed(WIDE_POS, WIDE_TGT, WIDE_FOV) },
].map((x) => ({ ...x, start: x.t ?? at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- helpers ----------
const inv = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (u) => u * u * (3 - 2 * u);
const lerpH = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;
// one-arm kit gesture held from t0 to t1, eased in and out over 0.25 s
const gest = (actor, name, side, t0, t1, t) => { const k = sm(inv(t0, t0 + 0.25, t)) * (1 - sm(inv(t1 - 0.25, t1, t))); if (k > 0) K.gesture(actor, name, side, k); };
const STRIDE = 14.5;
const PHONE_OFF = [-0.7, -0.3, 0];     // phone in the fist against her ear (hold() offset, phone frame)
const PAN = (t) => t >= at(LN.pancakes) - 0.3;
const FLIPS = () => [at(LN.pancakes) + 0.3, T_WIDE + 0.7, T_WIDE + 4.7, T_END + 2.5, T_END + 7.5];
// Walk down the stairs in legs [from, to, arriveAt]: straight along the flight (feet on the slope), legs driven by the
// horizontal distance, stopping between legs (a nervous pause on the steps).
function stairsWalk(actor, legs, t, idle, speed = 10) {
  let dist = 0, pos = legs[0][0].pos.clone(), moving = false;
  for (const [a, b, arrive] of legs) {
    const flat = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z), t0 = arrive - flat / speed, u = inv(t0, arrive, t);
    if (t < t0) break;
    pos = a.pos.clone().lerp(b.pos, u); dist += u * flat; moving = u < 1;
    if (moving) break;
  }
  K.playAnim(actor, moving ? [[A.walk, dist / STRIDE]] : [[A.idle, idle]]);
  K.putOn(actor, { pos, heading: 0 });
  return !moving && pos.distanceTo(legs[legs.length - 1][1].pos) < 1e-3;
}
// palm of the right hand (world), the point a held/slid thing sits at
const palmR = (a) => { a.root.updateMatrixWorld(true); return a.bones['Arm.R'].localToWorld(V(-0.5, -1.75, 0)); };

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  SET = K.showSet('kitchen');
  K.setState({ fridge: t >= T_LATER ? 'SAY YES' : 'BE NICE\n2 SKYE', pancakes: t >= T_LATER ? null : 8 });
  K.applyLight(stage, 'sunday_morning', { set: SET });
  K.setBlockers(SET.group, C.skye, C.max, C.dad, C.lily);
  K.only(C, ['skye', 'max', 'dad', 'lily']);
  const idle = K.holdClock(t, L, [[0, at(LN.morning)], [T_WIDE, T_WIDE + 3.0]]);
  const seated = t >= T_LATER;
  const sv = M.stove(), dadAt = sv.pos, endM = M.islandEnd(), bottom = M.stairsBottom();
  const s1 = M.stool(1, C.lily), s2 = M.stool(2, C.max), s3 = M.stool(3, C.skye);

  // --- Skye: down the stairs from frame 0 (two nervous pauses), to the island end on "Sorry", the phone call; seated after "Later" ---
  if (!seated) {
    // frame 0: already halfway down and moving; a nervous stop two steps from the bottom, then the last steps
    const mid0 = { pos: M.stairsMid().pos.clone().lerp(M.stairsLow().pos, 0.35), heading: 0 };
    const legs = [[mid0, M.stairsLow(), 0.6], [M.stairsLow(), bottom, 4.6]];
    const tLeave = at(LN.sorry) + 0.2;
    if (t < 4.6) stairsWalk(C.skye, legs, t, idle);
    else if (t < tLeave) {
      K.playAnim(C.skye, [[A.idle, idle]]);
      const look = t < at(LN.thief) ? s2.pos : dadAt;
      K.putOn(C.skye, bottom, { heading: lerpH(K.faceTo(bottom, look), CHEAT, 0.55) });
    } else {
      const m = K.walk(C.skye, A, bottom, endM, tLeave, t, { idleAt: idle });
      if (m.done) {
        K.playAnim(C.skye, [[A.idle, idle]]);
        const sh2 = sm(inv(at(LN.sleepover) + 0.2, at(LN.sleepover) + 0.45, t)) * (1 - sm(inv(end(LN.sleepover), end(LN.sleepover) + 0.3, t)));
        if (sh2 > 0) K.posture(C.skye, 'shrug', { mix: sh2, reset: false });
        gest(C.skye, 'phone_ear', 'R', at(LN.mom) - 0.4, T_LATER + 0.2, t);
        const look = t > end(LN.sorry) - 0.9 && t < end(LN.sorry) + 0.2 ? M.fridge().pos : dadAt;
        K.putOn(C.skye, endM, { heading: lerpH(K.faceTo(endM, look), CHEAT, 0.6) });
      }
    }
    K.dress(C.skye, ['skye_hoodie', 'backpack']);
  } else {
    K.playAnim(C.skye, [[A.sit, 0]]);
    // on her two lines she turns to the front-right camera: a thumb back over her right shoulder at the fridge, then a finger up (left arm, clear of Max)
    const turn = sm(inv(at(LN.fridgeAsk) - 0.2, at(LN.fridgeAsk) + 0.2, t)) * (1 - sm(inv(end(LN.cond) + 0.1, end(LN.cond) + 0.5, t)));
    K.putOn(C.skye, s3, { sit: true, heading: lerpH(-0.5, 0.45, turn) });
    gest(C.skye, 'finger_up', 'L', at(LN.cond) + 0.4, end(LN.cond) + 0.3, t);
    K.dress(C.skye, 'skye_hoodie');
  }
  K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_apron');

  // --- Max: stool 2; turned a little to whoever matters; slides Skye the plate in the wide ---
  {
    const slide0 = T_WIDE + 0.5, slide1 = T_WIDE + 1.6;
    K.playAnim(C.max, [[A.sit, 0]]);
    let h = t < at(LN.sorry) ? 0.4 : seated ? 0.5 : 0.3;
    if (t >= slide0 - 0.4 && t < slide1 + 0.6) h = 0.15 + 0.7 * sm(inv(slide0, slide1, t));
    K.putOn(C.max, s2, { sit: true, heading: h });
    gest(C.max, 'point', 'R', at(LN.ghost) + 0.4, end(LN.ghost) + 0.2, t);
    gest(C.max, 'hold_out', 'R', slide0 - 0.4, slide1 + 0.5, t);
  }

  // --- Lily: stool 1, teddy in her right hand ---
  {
    K.playAnim(C.lily, [[A.sit, 0]]);
    K.putOn(C.lily, s1, { sit: true, heading: t < at(LN.knew) ? 0.45 : t < T_WIDE ? -0.25 : 0.35 });
    gest(C.lily, 'point', 'L', at(LN.says), end(LN.says) + 0.3, t);
    // seated she is only head-high to the island, so her teddy sits on the island in front of her, her left hand on it
    K.holdTeddy(C.lily, 'free'); if (C.lily.teddy.parent !== stage.scene) stage.scene.add(C.lily.teddy);
    K.place(C.lily.teddy, KL(-2.55, 3.6, -1.95).pos, -0.2);
    if (!(t >= at(LN.says) && t < end(LN.says) + 0.3)) K.gesture(C.lily, 'tap', 'L', 1);
  }

  // --- Dad: at the stove (cheated 3/4); turns to the room to talk ---
  {
    K.playAnim(C.dad, [[A.idle, idle]]);
    const toRoom = sm(inv(at(LN.morning) - 0.3, at(LN.morning) + 0.3, t)) * (1 - sm(inv(at(LN.pancakes) - 0.4, at(LN.pancakes) + 0.1, t)));
    const tgt = t < at(LN.morning) + 1.3 ? s2.pos : seated ? s3.pos : t < at(LN.sorry) + 1 ? bottom.pos : endM.pos;
    let h = lerpH(sv.heading, lerpH(K.faceTo(sv, tgt), CHEAT, 0.3), toRoom);
    if (t < at(LN.morning) - 0.3) h = 0.9;               // frame 0: cooking side-on, 3/4 to the opening wide
    if (PAN(t)) h = 0.9;                                  // flipping with the pan held out, 3/4 to the stove shot and the wide
    K.putOn(C.dad, sv, { heading: h });
    gest(C.dad, 'point', 'R', at(LN.thief), end(LN.thief) + 0.3, t);
    gest(C.dad, 'hand_on_hip', 'L', at(LN.mother) + 0.1, end(LN.week) + 0.2, t);
    gest(C.dad, 'point', 'R', at(LN.phone), end(LN.phone) + 0.1, t);
    // from "Pancakes for everyone!" on: the pan out in his right hand, the spatula in his left, a flick up for each flip
    if (PAN(t)) { K.gesture(C.dad, 'hold_out', 'R', 1); K.gesture(C.dad, 'hold_out', 'L', 0.55); }
    for (const f of FLIPS()) gest(C.dad, 'tap', 'L', f - 0.3, f + 0.35, t);
  }

  // --- faces ---
  const skyeF = t < at(LN.long) ? 'nervous' : t < at(LN.phone) ? 'happy' : t < T_LATER ? 'nervous'
    : t < at(LN.fridgeAsk) ? 'surprised' : t < at(LN.cond) ? 'smug' : t < at(LN.crusts) ? 'scheming' : 'happy';
  const maxF = t >= at(LN.dance) - 0.3 && t < at(LN.crusts) ? 'nervous' : 'happy';
  const lilyF = t >= T_WIDE ? 'happy' : 'smug';
  const dadF = t < at(LN.morning) + 1.3 ? 'happy' : t < at(LN.thief) ? 'surprised' : t < at(LN.sorry) ? 'shocked'
    : t < at(LN.mother) ? 'surprised' : t < at(LN.week) ? 'suspicious' : t < at(LN.phone) ? 'shocked'
    : t < T_LATER ? 'determined' : t < at(LN.pancakes) ? 'happy' : 'laugh';
  K.speak(C.skye, skyeF, t, L.said('SKYE'));
  K.speak(C.max, maxF, t, L.said('MAX'));
  K.speak(C.lily, lilyF, t, L.said('LILY'));
  K.speak(C.dad, dadF, t, L.said('DAD'));

  // --- props ---
  K.hold(P.spatula, C.dad, PAN(t) ? 'L' : 'R');
  P.pan.visible = PAN(t); if (PAN(t)) K.hold(P.pan, C.dad, 'R', 'palm');
  const phoneOut = t >= at(LN.mom) - 0.4 && t < T_LATER;
  if (phoneOut) { P.phone.visible = true; K.hold(P.phone, C.skye, 'R', 'palm', { offset: PHONE_OFF }); }
  else if (seated) { if (P.phone.parent !== stage.scene) stage.scene.add(P.phone); const p = M.phoneDown(); P.phone.visible = true; P.phone.scale.setScalar(1); P.phone.position.copy(p.pos).add(V(0, 0.06, 0)); P.phone.rotation.set(-Math.PI / 2, p.heading, 0, 'YXZ'); }   // lying flat, screen up
  else P.phone.visible = false;
  // the crustless sandwich: in front of Max after "Later"; he slides it to Skye in the wide (it follows his palm)
  {
    const a = M.plateMax().pos, b = M.plateSkye().pos, u = sm(inv(T_WIDE + 0.5, T_WIDE + 1.6, t));
    P.plate.visible = seated;
    const pp = a.clone().lerp(b, u);
    if (u > 0 && u < 1) { const h = palmR(C.max); pp.set(h.x, a.y, h.z); }
    K.place(P.plate, pp, 0);
  }
  // pancake flips out of the held pan: on "Pancakes for everyone!" and slowly through the wide / end screen
  {
    const cake = P.pan.userData.pancake; cake.visible = true;
    let y = 0.04, r = 0;
    for (const f of FLIPS()) { const u = inv(f, f + 0.9, t); if (u > 0 && u < 1) { y = 0.04 + 2.2 * 4 * u * (1 - u); r = u * Math.PI * 2; } }
    cake.position.y = y; cake.rotation.x = r;
    P.pancake.visible = false;
  }
  if (P.bag) { P.bag.visible = seated; if (seated) { const b = M.bagFloor(); K.place(P.bag, b.pos, b.heading); } }

  sh.cam(stage, t);
  OVL = { end: t >= T_END };
}

// ---------- overlay ----------
let OVL = {};
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
  if (OVL.end) K.endScreen(g, s, t, { t0: T_END, dur: 13 });
}
