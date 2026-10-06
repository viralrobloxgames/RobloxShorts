// Chapter 4, "Cinnamon" (WEDNESDAY 12:15 PM). The classroom at lunch: Max is being nice. Cookie, cobweb, cinnamon,
// crusts "since this week", half a sandwich; "Stop it, face." Shot plan: production/shots/ch04.md.
// Seams (source/boundary_sheet.md): first frame "Ch3 | Ch4" start (Skye at her desk, annoyed, cobweb, backpack on her
// chair, empty desk; Max walking over with a cookie and a crustless sandwich; extras eating); last frame "Ch4 | Ch5" end
// (Skye holding half a sandwich, annoyed at herself; Max back at his desk with the other half, glancing at her, happy).
// Geography: Skye row 2 by the window, Max row 3 diagonally behind toward the aisle; Max stands in the aisle beside her.
// Every camera is on the board side of the Skye -> Max line (setLine side +1), so both faces read 3/4.
// Everything is a pure function of t.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 4;
const CARD = { day: 'WEDNESDAY', time: '12:15 PM' };
// Spoken lines (index 1-based, as in lines.json). EST is derived from these until the narration lands.
const SCRIPT = [
  ['VO', "Wednesday. Day three. I hadn't brushed my hair since Monday, and something terrible was happening. Max was being nice."],
  ['MAX', 'Hey, Skye. Want my cookie? You can have it.'],
  ['SKYE', "What's wrong with it?"],
  ['MAX', "Nothing. It's a cookie."],
  ['SKYE', 'Did you lick it?'],
  ['MAX', "No! I'm just being nice."],
  ['SKYE', 'Since when are you nice to me?'],
  ['MAX', "Since a ghost told me to. It's a long story."],
  ['MAX', "It wrote on our fridge. In my little sister's magnet letters."],
  ['SKYE', 'Wow. Spooky. What did it say?'],
  ['MAX', "That's private.", 0.6],                              // [+0.6 Max leans in, frowning at her hair] after it
  ['MAX', 'Why is there a cobweb in your hair?'],
  ['SKYE', "It's fashion."],
  ['MAX', "And why do you smell like my dad's pancakes?"],
  ['SKYE', 'Lots of people have pancakes.'],
  ['MAX', 'With cinnamon?'],
  ['SKYE', 'Cinnamon is a very popular spice, Max.'],
  ['MAX', "Right. Hey, I tried cutting the crusts off my sandwich. You were right. It's better."],
  ['SKYE', 'Since when do you cut off your crusts?'],
  ['MAX', 'Since this week. Want half?', 0.8],                  // [+0.8 Skye takes half. Max goes back. Skye stares.]
  ['SKYE', "Why is my face hot? Stop it, face. He's the enemy.", 0, 'whisper'],
];
const PACE = { VO: 2.9, SKYE: 2.9, MAX: 2.7 };
const EST = (() => {
  let t = 0; const out = [];
  SCRIPT.forEach(([speaker, text, pause = 0, note], i) => {
    const n = text.split(/\s+/).length, d = n / PACE[speaker] + 0.25;
    out.push({ index: i + 1, speaker, note, text, start: t, end: t + d });
    t += d + 0.25 + pause;
  });
  return out;
})();
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.8);           // last line + room tone
export const sky = K.SKY;
export const samples = () => 1;
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, b) => smooth((t - a) / (b - a));

// ---------- marks (fallbacks: offsets from the classroom origin until the set has them) ----------
// Students face the board (-z); the window is at +x. Skye row 2 at the window, Max row 3 one column toward the aisle.
const M = {
  skye: () => K.mark('classroom', 'desk_skye', { pos: V(4, 0, 0), heading: Math.PI }),
  max: () => K.mark('classroom', 'desk_max', { pos: V(0.8, 0, 4.2), heading: Math.PI }),
  aisle: () => K.mark('classroom', 'desk_skye_aisle', { pos: V(2.0, 0, 0.3), heading: Math.PI / 2 }),
  deskTop: () => K.mark('classroom', 'desk_skye_top', { pos: V(4, 2.6, -1.3), heading: Math.PI }),
  bag: () => K.mark('classroom', 'chair_skye_back', { pos: V(4, 2.0, 1.05), heading: 0 }),
  extra: (i) => K.mark('classroom', `desk_extra_${i + 1}`, [
    { pos: V(-2.4, 0, 0), heading: Math.PI }, { pos: V(-2.4, 0, 4.2), heading: Math.PI },
    { pos: V(-5.6, 0, -4.2), heading: Math.PI }, { pos: V(4, 0, 8.4), heading: Math.PI }][i]),
};
const SEAT_Y = 1.85 - 1.5;                                 // root height for the pack 'sit' pose on a classroom chair
const seated = (m) => ({ pos: m.pos.clone().add(V(0, m.seated ? 0 : SEAT_Y, 0)), heading: m.heading });

// ---------- setup ----------
let C, A, P = {}, EXTRAS = [];
export async function setup(stage) {
  await K.buildSets(stage, ['classroom']);
  K.setState({ chapter: CH });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_school');
  EXTRAS = (C.extras || []).slice(0, 4); EXTRAS.forEach((e) => K.dress(e, 'extras'));
  A = await K.loadAnims(['idle', 'walk', 'run', 'sit']);
  const add = (id) => { const p = K.makeProp(id); stage.scene.add(p); return p; };
  P.cookie = add('cookie'); P.halfA = add('sandwich_half'); P.halfB = add('sandwich_half');
  P.bag = add('backpack'); P.cobweb = add('cobweb');
  P.lunch = EXTRAS.map((_, i) => add(['sandwich', 'apple', 'juice_box', 'sandwich'][i]));
  P.scene = stage.scene;
}

// ---------- key times ----------
const T = {
  walk0: 0.0,                                  // Max leaves his desk on frame 0
  offer: () => at(1, 5.2),                     // "Max was being nice": cookie out
  cookieDown: () => end(6, -0.2),              // after "I'm just being nice." he puts it on her desk
  lean: () => end(11, 0.05),                   // [+0.6 Max leans in]
  unlean: () => at(18, 0.1),                   // "Right." he straightens
  show: () => at(18, 0.9),                     // lifts the sandwich to show it
  split: () => at(20, 0.9),                    // "Want half?" one half into his right hand, held out
  take: () => end(20, 0.15),                   // Skye's hand meets the half
  back: () => end(20, 0.45),                   // Max walks back to his desk
  snap: () => at(21, 1.15),                    // "Stop it, face." Skye snaps her head front
};

// ---------- the shot table ----------
const S2 = (s) => K.twoShot(s, C.skye, C.max, { framing: 'ms', fov: 34 });
const S2c = (s) => K.twoShot(s, C.skye, C.max, { framing: 'mcu', fov: 32, bias: 0.45 });
const SK = (fr) => (s) => K.camOn(s, C.skye, fr, { angle: 0.45, fov: 32 });
const MX = (fr) => (s) => K.camOn(s, C.max, fr, { angle: 0.45, fov: 32 });
const WIDE = (s, t) => {
  const set = K.getSet('classroom');
  if (set.cams.wide_front) return K.setCam(s, set.cams.wide_front);
  const o = K.SET_ORIGIN.classroom, a = { pos: o.clone().add(V(-5, 6.2, -9)), target: o.clone().add(V(2.6, 3.2, 1.6)), fov: 44 };
  const b = { pos: o.clone().add(V(-3.6, 5.6, -7.6)), target: o.clone().add(V(2.8, 3.4, 0.8)), fov: 42 };
  return K.applyShot(s, K.blendShot(a, b, smooth((t - 2.2) / 2.5)));
};
const named = (id, fb) => (s, t) => { const c = K.getSet('classroom').cams[id]; return c ? K.setCam(s, c) : fb(s, t); };
const END = (s) => {                          // Skye MCU foreground left, Max at his desk background right
  const c = K.getSet('classroom').cams.end_front; if (c) return K.setCam(s, c);
  const sk = K.headPos(C.skye), mx = K.headPos(C.max);
  const target = sk.clone().lerp(mx, 0.42).add(V(0, -0.5, 0));
  const pos = sk.clone().add(V(-2.6, 0.2, -6.4));
  return K.applyShot(s, { pos, target, fov: 34 });
};
const SHOTS = [
  { line: 1, off: 0, id: 'wide_front', cam: WIDE },
  { line: 1, off: 4.5, id: 'two_shot_desk', cam: named('two_shot_desk', S2) },
  { line: 2, off: -0.1, id: 'max_cookie', cam: named('mcu_max', MX('mcu')) },
  { line: 3, off: -0.1, id: 'skye_wrong', cam: named('mcu_skye', SK('mcu')) },
  { line: 4, off: -0.1, id: 'max_nothing', cam: named('mcu_max', MX('mcu')) },
  { line: 5, off: -0.1, id: 'skye_lick', cam: named('cu_skye', SK('cu')) },
  { line: 6, off: -0.1, id: 'max_no', cam: named('mcu_max', MX('mcu')) },
  { line: 7, off: -0.1, id: 'skye_since', cam: named('two_shot_desk', S2) },
  { line: 8, off: -0.1, id: 'max_ghost', cam: named('mcu_max', MX('mcu')) },
  { line: 9, off: -0.1, id: 'fridge_two', cam: named('two_shot_desk', S2) },
  { line: 10, off: -0.1, id: 'skye_spooky', cam: named('mcu_skye', SK('mcu')) },
  { line: 11, off: -0.1, id: 'max_private', cam: named('cu_max', MX('cu')) },
  { line: 11, off: 1.0, id: 'lean_two', cam: named('two_shot_close', S2c) },
  { line: 13, off: -0.1, id: 'skye_fashion', cam: named('cu_skye', SK('cu')) },
  { line: 14, off: -0.1, id: 'max_pancakes', cam: named('two_shot_close', S2c) },
  { line: 15, off: -0.1, id: 'skye_lots', cam: named('mcu_skye', SK('mcu')) },
  { line: 16, off: -0.1, id: 'max_cinnamon', cam: named('cu_max', MX('cu')) },
  { line: 17, off: -0.1, id: 'skye_spice', cam: named('mcu_skye', SK('mcu')) },
  { line: 18, off: -0.1, id: 'right_two', cam: named('two_shot_desk', S2) },
  { line: 18, off: 0.8, id: 'max_crusts', cam: named('mcu_max', MX('ms')) },
  { line: 19, off: -0.1, id: 'skye_crusts', cam: named('mcu_skye', SK('mcu')) },
  { line: 20, off: -0.1, id: 'max_half', cam: named('mcu_max', MX('ms')) },
  { line: 20, off: 99, id: 'handoff', cam: named('two_shot_desk', (s) => K.twoShot(s, C.skye, C.max, { framing: 'ws', fov: 36, bias: 0.35 })) },
  { line: 21, off: -0.35, id: 'end_front', cam: END },
].map((x) => ({ ...x, start: x.off === 99 ? end(x.line, 0.1) : Math.max(0, at(x.line, x.off)) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- posing helpers (choreography only; looks come from the kit) ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
// up: raised sideways (0 hanging); fwd: negative swings the arm forward (-1.57 = straight out in front)
function arm(a, sd, up, fwd) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function lean(a, x) { a.bones.Torso.quaternion.multiply(Q.setFromEuler(EUL.set(x, 0, 0, 'XYZ'))); }
function look(a, yaw, pitch = 0) { a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(pitch, yaw, 0, 'YXZ'))); }
const mix = (a, b, u) => a + (b - a) * u;
function placeAt(prop, pos, rotY = 0) {
  if (prop.parent !== P.scene) P.scene.add(prop);
  prop.position.copy(pos); prop.rotation.set(0, rotY, 0); prop.visible = true;
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet('classroom');
  K.applyLight(stage, 'school_day', { set });
  const idle = K.holdClock(t, L, [[0, 1.8], [T.back(), T.back() + 1.0]]);
  K.only(C, ['skye', 'max', 'extras']);

  // ----- Skye: seated at her desk all chapter -----
  const mS = M.skye(), mA = M.aisle(), mM = M.max();
  const towardMax = K.faceTo(mS, mA);                      // turned in her seat toward the aisle
  const watchMaxDesk = K.faceTo(mS, mM);
  let hS = mix(mS.heading, mix(mS.heading, towardMax, 0.55), ramp(t, at(1, 4.6), at(1, 5.2)));
  if (t > T.back()) hS = mix(mix(mS.heading, towardMax, 0.55), mix(mS.heading, watchMaxDesk, 0.45), ramp(t, T.back(), T.back() + 0.7));
  if (t > T.snap()) hS = mix(mix(mS.heading, watchMaxDesk, 0.45), mS.heading, ramp(t, T.snap(), T.snap() + 0.25));
  K.playAnim(C.skye, [[A.sit, 0, 1, false]]);
  K.putOn(C.skye, seated(mS), { heading: hS, sit: true });
  arm(C.skye, 'L', 0.1, -1.25); arm(C.skye, 'R', 0.1, -1.25);                         // forearms on the desk
  const skBack = t > at(3) && t < at(7) ? ramp(t, at(3), at(3) + 0.3) * (t > at(5) ? 0.22 : 0.12) : 0;
  const skLeanBack = skBack + (t > at(12) && t < at(16) ? 0.14 * ramp(t, at(12), at(12) + 0.3) : 0);
  lean(C.skye, -skLeanBack);
  if (t > at(13) && t < end(13, 0.2)) { const u = ramp(t, at(13), at(13) + 0.25) * (1 - ramp(t, end(13), end(13, 0.2))); arm(C.skye, 'L', mix(0.1, 1.75, u), mix(-1.25, -0.55, u)); } // pats her hair (left, the cobweb side)
  if (t > at(17, 0.5) && t < end(17)) look(C.skye, 0.35 * ramp(t, at(17, 0.5), at(17, 0.8)));   // prim: turns her head away on "Max"
  const reach = t > T.take() - 0.35 && t < T.take() + 0.6 ? ramp(t, T.take() - 0.35, T.take()) : 0;
  if (t > T.take() - 0.35) arm(C.skye, 'R', 0.15, mix(-1.25, -1.45, reach) + (t > T.take() ? -0.15 * (1 - ramp(t, T.take(), T.take() + 0.5)) : 0));
  if (t > T.take() + 0.5) arm(C.skye, 'R', 0.12, -1.35);                            // holds her half at chest height
  // face
  let fS = 'annoyed';
  if (t > at(1, 4.8)) fS = 'suspicious';
  if (t > at(7)) fS = 'annoyed';
  if (t > at(8, 1.5)) fS = 'scheming';                                               // she wrote it
  if (t > at(10)) fS = 'smug';
  if (t > end(11)) fS = 'nervous';
  if (t > at(13)) fS = 'smug';
  if (t > end(13)) fS = 'nervous';
  if (t > at(17)) fS = 'annoyed';
  if (t > at(19)) fS = 'surprised';
  if (t > T.back()) fS = 'nervous';
  if (t > T.snap()) fS = 'annoyed';
  K.speak(C.skye, fS, t, L.said('SKYE'));

  // ----- Max -----
  let fM = 'happy';
  if (t < T.back()) {
    const m = K.walk(C.max, A, mM, mA, T.walk0, t, { idleAt: idle, endHeading: mA.heading + 0.3 });
    if (!m.moving && m.done) { K.playAnim(C.max, [[A.idle, idle]]); K.putOn(C.max, mA, { heading: mA.heading + 0.3 }); }
  } else {
    const m = K.walk(C.max, A, mA, mM, T.back(), t, { idleAt: idle, endHeading: mM.heading });
    if (m.done) {                                                                   // sits back at his desk, turned toward her
      K.playAnim(C.max, [[A.sit, 0, 1, false]]);
      K.putOn(C.max, seated(mM), { heading: mix(mM.heading, K.faceTo(mM, mS), 0.4), sit: true });
    }
  }
  const sittingM = t > T.back() && K.walk && C.max.root.position.distanceTo(seated(mM).pos) < 0.05;
  if (!sittingM) {
    const walking = t < T.walk0 + mM.pos.distanceTo(mA.pos) / 12 || (t > T.back());
    // left hand: the sandwich, low in front; right: the cookie, out to her on the offer
    const offer = t < T.cookieDown() ? ramp(t, T.offer() - 0.3, T.offer()) * (1 - ramp(t, T.cookieDown(), T.cookieDown() + 0.4)) : 0;
    const down = t > T.cookieDown() && t < T.cookieDown() + 0.5 ? Math.sin(Math.PI * clamp((t - T.cookieDown()) / 0.5)) : 0;
    if (!walking || t < 2) {
      arm(C.max, 'L', 0.12, -0.8 - 0.55 * ramp(t, T.show(), T.show() + 0.3) * (1 - ramp(t, at(19), at(19, 0.3))));
      arm(C.max, 'R', 0.1, mix(-0.5, -1.35, offer) - 1.0 * down);
      if (t > T.split()) { const u = ramp(t, T.split(), T.split() + 0.35); arm(C.max, 'R', 0.12, mix(-0.5, -1.4, u)); }
      if (t > T.take() + 0.1) arm(C.max, 'R', 0.1, mix(-1.4, -0.3, ramp(t, T.take() + 0.1, T.take() + 0.35)));
    }
    if (t > T.lean() && t < T.unlean() + 0.3) {
      const u = ramp(t, T.lean(), T.lean() + 0.35) * (1 - ramp(t, T.unlean(), T.unlean() + 0.3));
      lean(C.max, 0.22 * u);
      if (t > at(14) && t < at(14, 0.8)) look(C.max, 0, 0.12 * Math.abs(Math.sin((t - at(14)) * 2 * Math.PI * 2.5)));   // sniff, sniff
    }
    if (t > at(8) && t < end(9)) look(C.max, 0.25 * Math.sin((t - at(8)) * 3.2) * (t < at(8, 1.4) ? 1 : 0.3));       // glances round: a secret
    if (t > at(11) && t < end(11)) look(C.max, 0.35);                                // "That's private." looks away
  } else {
    arm(C.max, 'L', 0.1, -1.25); arm(C.max, 'R', 0.1, -1.3);
  }
  if (t > at(6) && t < at(6, 0.45)) fM = 'shocked';
  if (t > at(8)) fM = 'nervous';
  if (t > at(9, 1.0)) fM = 'neutral';
  if (t > at(11)) fM = 'nervous';
  if (t > end(11)) fM = 'suspicious';
  if (t > at(18)) fM = 'happy';
  K.speak(C.max, fM, t, L.said('MAX'));

  // ----- extras: eating at their desks -----
  EXTRAS.forEach((e, i) => {
    const m = M.extra(i);
    K.playAnim(e, [[A.sit, 0, 1, false]]);
    K.putOn(e, seated(m), { sit: true });
    const bite = 0.5 + 0.5 * Math.sin(idle * 2.1 + i * 1.7);
    arm(e, 'L', 0.1, -1.2); arm(e, 'R', 0.1, mix(-1.2, -2.3, bite));
    e.setFace?.(bite > 0.8 ? 'mouth_o' : 'happy');
    K.hold(P.lunch[i], e, 'R');
  });

  // ----- props -----
  if (t < T.cookieDown() + 0.25) K.hold(P.cookie, C.max, 'R');
  else placeAt(P.cookie, M.deskTop().pos.clone().add(V(-0.6, 0, 0.1)), 0.4);
  if (t < T.split()) { K.hold(P.halfA, C.max, 'L'); K.hold(P.halfB, C.max, 'L'); }
  else {
    K.hold(P.halfA, C.max, 'L');
    if (t < T.take()) K.hold(P.halfB, C.max, 'R'); else K.hold(P.halfB, C.skye, 'R');
  }
  const bag = M.bag(); placeAt(P.bag, bag.pos, bag.heading);
  if (P.cobweb.parent !== C.skye.bones.Head) { C.skye.bones.Head.add(P.cobweb); P.cobweb.position.set(0.55, 1.0, 0.1); }

  K.setBlockers(set.group, C.skye, C.max);
  K.setLine(C.skye, C.max, 1);
  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }

// ---------- for the hold check (web/ch04_hold.js) ----------
export const cast = () => ({ skye: C.skye, max: C.max, ...Object.fromEntries(EXTRAS.map((e, i) => ['extra' + i, e])) });
export const HOLDS = [
  [1.0, 'max', 'R', 'cookie (walking over)'], [1.0, 'max', 'L', 'sandwich halves (walking over)'],
  [T.offer() + 0.5, 'max', 'R', 'cookie held out'], [T.show() + 0.5, 'max', 'L', 'sandwich shown'],
  [T.split() + 0.5, 'max', 'R', 'half held out'], [T.split() + 0.5, 'max', 'L', 'other half'],
  [T.take() + 0.8, 'skye', 'R', 'half in her hand'], [L.end, 'skye', 'R', 'half, last frame'],
];
