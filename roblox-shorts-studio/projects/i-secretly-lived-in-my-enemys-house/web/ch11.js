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
// review #26: "He spent it making me sandwiches." on a medium two-shot of Skye and Max (the plate slide), then the wide again
const W_HE = L.words.find((w) => w.speaker === 'VO' && w.start > at(LN.spent) + 1 && w.start < end(LN.spent) && /^He\b/.test(w.word));
const T_PAY = (W_HE ? W_HE.start : at(LN.spent) + 2.65) - 0.15, T_PAY_END = end(LN.spent) + 0.05;
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
  stove: KM('stove_three_quarter'), islandEnd: () => KL(6.5, 0, 3.0, -1.0), fridge: KM('fridge'),   // islandEnd: in front of the island's right end, so the walk to it crosses the frame
  stool: (i, a) => { const m = K.mark('kitchen', `island_stool_${i}`); m.pos.y = K.getSet('kitchen').seatY(a?.scale ?? 1); return m; },   // hips on the seat (kit sit_chair)
  plateMax: () => KL(-1.2, 3.6, -1.25), plateSkye: () => KL(1.2, 3.6, -1.25), phoneDown: KM('island_phone_3'),
  bagFloor: KM('backpack_floor_3'), pan: () => KL(-2.85, 3.78, -10.1),
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
const WIDE_POS = [-9, 10.5, 13.5], WIDE_TGT = [-0.3, 4.0, -4.6], WIDE_FOV = 42;   // from the left: Dad reads above Lily, clear of Max
// fixed set-ups (kitchen-local), all on the open +z side; walls auto-hide, so no wall pull-in
const fixed = (pos, target, fov) => (s) => K.setCam(s, { pos: KO.clone().add(V(...pos)), target: KO.clone().add(V(...target)), fov }, { clear: false });
// fixed set-ups only (critic-6 #1-#3): a camera never follows a turning actor, so nothing jumps inside a line
const DADCAM = [2.1, 6.6, -4.9], DADTGT = [-1.6, 4.85, -8.0];
const dadCU = fixed(DADCAM, DADTGT, 30), dadMS = fixed(DADCAM, [-1.6, 5.3, -8.0], 44);
// a fixed position panning with an actor's head (Skye's walk to the island end)
const track = (pos, actor, fov) => (s) => K.setCam(s, { pos: KO.clone().add(V(...pos)), target: K.headPos(actor()).add(V(0, -0.5, 0)), fov }, { clear: false });
const skyeMCU = fixed([2.4, 5.9, 9.4], [6.5, 4.9, 3.0], 30), skyeMS = fixed([2.0, 5.8, 10.2], [6.5, 4.4, 3.0], 40);
const lilyCU = fixed([-6.0, 4.6, 4.2], [-4.6, 4.1, -3.2], 26);
const seatedTwo = fixed([2.1, 5.4, 6.2], [2.1, 4.4, -3.2], 34);     // three stools 4.2 apart (kit stoolX 'three'): Max x 0, Skye x 4.2
const skyeSeatCU = fixed([9.6, 7.6, 0.9], [3.4, 5.3, -3.8], 36);      // from front-right: SAY YES on the fridge behind her
const SHOTS = [
  { line: LN.vo, off: 0, id: 'stairs_wide', cam: fixed([-8.5, 9.0, 14], [4.5, 7.6, -3.5], 60) },
  { line: LN.morning, off: -0.1, id: 'stove_ms', cam: dadMS },
  { line: LN.pumpkin, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.ghost, off: -0.05, id: 'max_skye_two', cam: fixed([4.5, 6.0, 12.5], [7.3, 4.4, 0.9], 48) },   // Max points at Skye at the foot of the stairs
  { line: LN.thief, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.sorry, off: -0.1, id: 'skye_walk', cam: track([6.0, 6.0, 8.5], () => C.skye, 44) },
  { line: LN.knew, off: -0.05, id: 'lily_cu', cam: lilyCU },
  { line: LN.youKnew, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.horse, off: -0.05, id: 'lily_cu', cam: lilyCU },
  { line: LN.mother, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.sleepover, off: -0.05, id: 'skye_mcu', cam: skyeMCU },
  { line: LN.week, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.long, off: -0.05, id: 'skye_mcu', cam: skyeMCU },
  { line: LN.phone, off: -0.05, id: 'dad_cu', cam: dadCU },
  { line: LN.mom, off: -0.45, id: 'phone_ms', cam: skyeMS },
  { t: T_LATER, id: 'fridge_cu', cam: fixed([-11, 4.7, -4.6], [-11, 4.7, -9], 34) },
  { t: T_LATER + 0.7, id: 'island_two_seated', cam: seatedTwo },
  { line: LN.fridgeAsk, off: -0.05, id: 'skye_cu', cam: skyeSeatCU },
  { line: LN.says, off: -0.05, id: 'lily_single', cam: fixed([-4.8, 5.1, 3.0], [-4.2, 4.3, -3.2], 26) },
  { line: LN.cond, off: -0.05, id: 'skye_cu', cam: skyeSeatCU },
  { line: LN.crusts, off: -0.05, id: 'max_cu', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: -0.6 }) },
  { line: LN.crusts2, off: -0.05, id: 'island_two_seated', cam: seatedTwo },
  { line: LN.pancakes, off: -0.1, id: 'stove_ms', cam: dadMS },
  { t: T_WIDE, id: 'island_wide', cam: fixed(WIDE_POS, WIDE_TGT, WIDE_FOV) },
  { t: T_PAY, id: 'payoff_two', cam: fixed([2.1, 5.6, 6.6], [2.1, 4.2, -3.0], 34) },        // Skye and Max, the plate in the lower third
  { t: T_PAY_END, id: 'island_wide', cam: fixed(WIDE_POS, WIDE_TGT, WIDE_FOV) },
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
const PAN = () => true;                 // critic-6 #6/#15: Dad cooks the whole chapter, the pan in his right hand, the spatula in his left
const SEAT_TOP = 2.2, LILY_KNEEL = 0.6;  // kitchen stool top; kneel_up root drop (kit posture), Lily kneeling on stool 1
// the plate slide: Max turns on his stool with his left hand on the plate's rim; the plate follows that palm along the island top
const SLIDE0 = () => T_PAY + 0.35, SLIDE1 = () => T_PAY + 1.35;
const maxSlideH = (t) => 0.45 * sm(inv(SLIDE0(), SLIDE1(), t));   // the palm ends on the island in front of the gap, toward Skye (not in her)
const palmL = (a) => { a.root.updateMatrixWorld(true); return a.bones['Arm.L'].localToWorld(V(0.5 * a.scale, -1.75 * a.scale, 0)); };
// Max's left palm when posed for the slide at time tt (heading + full hold_out), projected on the island top
function slidePalm(tt) {
  K.posture(C.max, 'sit_chair'); K.putOn(C.max, M.stool(2, C.max), { sit: true, heading: maxSlideH(tt) });
  K.gesture(C.max, 'hold_out', 'L', 1); const p = palmL(C.max); p.y = KO.y + 3.6; return p;
}
const FLIPS = () => [at(LN.pancakes) + 0.3, T_WIDE + 0.7, T_END + 2.5, T_END + 7.5];   // none in the payoff two-shot (it floated by Max's head)
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
    // critic-6 #5: one continuous walk down the whole flight from frame 0 ("like a normal person"), feet on the slope,
    // legs driven by the distance travelled, arriving at the foot at 5.0 s
    const tLeave = at(LN.sorry) + 0.2, top = M.stairsTop(), T_FOOT = 5.0;
    if (t < T_FOOT) {
      const u = 0.42 + 0.58 * inv(0, T_FOOT, t), p = SET.stairsPath(u);   // frame 0: out of the stairwell; the kit stair gait, one tread per step
      K.posture(C.skye, SET.stairsGait(u));
      C.skye.root.position.copy(p.pos); C.skye.root.rotation.y = p.heading; C.skye.root.visible = true; C.skye.root.updateMatrixWorld(true);
    }
    else if (t < tLeave) {
      K.posture(C.skye, 'stand'); K.playAnim(C.skye, [[A.idle, idle]]);    // arms at her sides (no stair-gait residue)
      gest(C.skye, 'wave', 'L', at(LN.ghost) + 0.3, end(LN.ghost) + 0.2, t);  // critic-6 R-a: a one-arm wave on "this is Skye"
      const look = t < at(LN.thief) ? s2.pos : dadAt;
      K.putOn(C.skye, bottom, { heading: lerpH(K.faceTo(bottom, look), CHEAT, 0.55) });
    } else {
      const route = SET.fromStairs(endM.pos), d = Math.max(0, t - tLeave) * 12, m = SET.alongRoute(route, d);
      if (!m.done) { K.playAnim(C.skye, [[A.walk, d / STRIDE]]); K.putOn(C.skye, { pos: m.pos, heading: m.heading }); }
      else {
        K.posture(C.skye, 'stand'); K.playAnim(C.skye, [[A.idle, idle]]);
        const sh2 = sm(inv(at(LN.sleepover) + 0.2, at(LN.sleepover) + 0.45, t)) * (1 - sm(inv(end(LN.sleepover), end(LN.sleepover) + 0.3, t)));
        if (sh2 > 0) K.posture(C.skye, 'shrug', { mix: 0.35 * sh2, reset: false });   // a small shoulders-only lift
        gest(C.skye, 'phone_ear', 'R', at(LN.mom) - 0.4, T_LATER + 0.2, t);
        // a look to the fridge on "And the fridge.", eased in and out (recheck: no one-frame head turn)
        const e = end(LN.sorry), wl = sm(inv(e - 0.9, e - 0.7, t)) * (1 - sm(inv(e + 0.2, e + 0.4, t)));
        K.putOn(C.skye, endM, { heading: lerpH(lerpH(K.faceTo(endM, dadAt), K.faceTo(endM, M.fridge().pos), wl), CHEAT, 0.6) });
      }
    }
    K.dress(C.skye, ['skye_hoodie', 'backpack']);
  } else {
    K.posture(C.skye, 'sit_chair');
    // on her two lines she turns to the front-right camera: a thumb back over her right shoulder at the fridge, then a finger up (left arm, clear of Max)
    const turn = sm(inv(at(LN.fridgeAsk) - 0.2, at(LN.fridgeAsk) + 0.2, t)) * (1 - sm(inv(end(LN.cond) + 0.1, end(LN.cond) + 0.5, t)));
    K.putOn(C.skye, s3, { sit: true, heading: lerpH(-0.5, 0.45, turn) });
    gest(C.skye, 'finger_up', 'L', at(LN.cond) + 0.4, end(LN.cond) + 0.3, t);
    K.dress(C.skye, 'skye_hoodie');
  }
  K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_apron');

  // the plate's rest spots before and after the slide = Max's palm in the slide pose (sampled before his real pose)
  const PLATE_A = seated ? slidePalm(SLIDE0()) : null, PLATE_B = seated ? slidePalm(SLIDE1()) : null;

  // --- Max: stool 2; turned a little to whoever matters; slides Skye the plate in the wide ---
  {
    const slide0 = T_PAY + 0.35, slide1 = T_PAY + 1.35;
    K.posture(C.max, 'sit_chair');
    const toSkye = sm(inv(at(LN.ghost), at(LN.ghost) + 0.35, t)) * (1 - sm(inv(end(LN.ghost) + 0.1, end(LN.ghost) + 0.5, t)));
    let h = lerpH(t < at(LN.sorry) ? 0.4 : seated ? 0.5 : 0.3, K.faceTo(s2, bottom), toSkye);
    const ws = sm(inv(slide0 - 0.4, slide0 - 0.2, t)) * (1 - sm(inv(slide1 + 0.4, slide1 + 0.6, t)));   // eased in and out of the slide turn (no snap)
    if (ws > 0) h = lerpH(h, maxSlideH(t), ws);
    K.putOn(C.max, s2, { sit: true, heading: h });
    { const a0 = at(LN.ghost) - 0.05, a1 = end(LN.ghost) + 0.6, k = sm(inv(a0, a0 + 0.07, t)) * (1 - sm(inv(a1 - 0.07, a1, t)));
      if (k > 0) K.gesture(C.max, 'point', 'R', k); }      // a quick raise: the arm never sweeps through the island top
    gest(C.max, 'hold_out', 'L', slide0 - 0.4, slide1 + 0.5, t);
  }

  // --- Lily: stool 1, teddy in her right hand ---
  {
    // critic-6 #13: kneeling up on the stool (a 7-year-old at a high island), the teddy hugged to her chest
    K.posture(C.lily, 'kneel_up', { extra: K.POSES.hug_teddy });   // critic-6 R-b: forearms crossed over the bear
    const kp = s1.pos.clone(); kp.y = SEAT_TOP + KO.y - LILY_KNEEL * C.lily.scale;
    // her turns are eased (~6 frames) and the one into her close-up is done before the cut
    let lh = 0.45;
    lh = lerpH(lh, -0.25, sm(inv(at(LN.knew) - 0.45, at(LN.knew) - 0.15, t)));
    lh = lerpH(lh, 0.25, sm(inv(at(LN.says) - 0.05, at(LN.says) + 0.15, t)));
    lh = lerpH(lh, -0.25, sm(inv(at(LN.cond) - 0.05, at(LN.cond) + 0.15, t)));
    lh = lerpH(lh, 0.35, sm(inv(T_WIDE - 0.3, T_WIDE - 0.1, t)));
    K.putOn(C.lily, { pos: kp, heading: lh }, { sit: true });
    K.holdTeddy(C.lily, 'hug');
    gest(C.lily, [10, 0, 85], 'R', at(LN.says) + 0.2, end(LN.says) + 0.3, t);   // one arm out sideways toward the fridge (frame-left), the other still round the bear
  }

  // --- Dad: at the stove the whole chapter, the pan in his right hand, the spatula in his left; turns smoothly to whoever matters ---
  {
    K.playAnim(C.dad, [[A.idle, idle]]);
    const turn = (h0, h1, t0, d = 0.4) => lerpH(h0, h1, sm(inv(t0, t0 + d, t)));
    let h = 0.3;                                                         // frame 0: cooking, 3/4 to the opening wide
    h = turn(h, K.faceTo(sv, s2.pos), at(LN.morning) - 0.2);             // "Morning, Max! Morning, Lily!"
    h = turn(h, K.faceTo(sv, bottom.pos), at(LN.morning) + 1.6);         // "Morning..." to the stairs
    h = turn(h, K.faceTo(sv, endM.pos), at(LN.sorry) + 0.6, 0.8);       // follows Skye to the island end
    h = turn(h, K.faceTo(sv, s3.pos), T_LATER, 0.01);                    // after "Later": Skye on stool 3
    h = turn(h, 0.6, at(LN.pancakes) - 0.3);                             // flipping, 3/4 to the stove shot
    h = turn(h, 0.3, T_WIDE, 0.01);                                      // the wide
    K.putOn(C.dad, sv, { heading: h });
    K.gesture(C.dad, 'hold_out', 'R', 1);
    K.gesture(C.dad, 'hold_out', 'L', 0.55);
    gest(C.dad, 'point', 'L', at(LN.thief), end(LN.thief) + 0.3, t);              // the spatula at Skye
    gest(C.dad, [-55, 0, 25], 'L', at(LN.phone), end(LN.phone) + 0.1, t);         // the spatula at her hoodie pocket, lower and across
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
  // the crustless sandwich at Max's elbow after "Later"; on "He spent it making me sandwiches" his left hand slides it
  // along the island top to Skye (critic-6 #14: no jump, it follows his palm the whole way)
  {
    P.plate.visible = seated;
    if (seated) {
      const inSlide = t > SLIDE0() && t < SLIDE1();
      const q = inSlide ? palmL(C.max) : (t <= SLIDE0() ? PLATE_A : PLATE_B); q.y = KO.y + 3.6;
      K.place(P.plate, q, 0);
    }
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
