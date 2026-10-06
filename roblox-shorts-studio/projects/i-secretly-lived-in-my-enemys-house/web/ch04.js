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
const LAST = Math.max(...L.lines.map((l) => l.end));
export const meta = K.chapterMeta(Math.max(LAST + 0.8, L.duration ?? 0));   // last line + 0.8 s room tone
export const sky = K.SKY;
export const samples = () => 1;
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
// start of word k of a spoken line (measured captions; an even spread on the estimate)
const wordT = (line, k, off = 0) => { const l = L.line(line), ws = L.words.filter((w) => w.start >= l.start - 0.05 && w.start < l.end); return (ws[k] ? ws[k].start : l.start + (l.end - l.start) * k / l.text.split(/\s+/).length) + off; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (t, a, b) => smooth((t - a) / (b - a));

// ---------- marks (fallbacks: offsets from the classroom origin until the set has them) ----------
// Students face the board (-z); the window is at +x. Skye row 2 at the window, Max row 3 one column toward the aisle.
const mk = (name, fb) => { const m = K.mark('classroom', name, fb), raw = K.getSet('classroom')?.marks[name]; return { ...m, sit: !!raw?.sit }; };
const M = {
  skye: () => mk('desk_skye', { pos: V(4, 0, 0), heading: Math.PI }),
  max: () => mk('desk_max', { pos: V(0.8, 0, 4.2), heading: Math.PI }),
  aisle: () => mk('desk_skye_aisle', { pos: V(2.0, 0, 0.3), heading: Math.PI / 2 }),
  deskTop: () => mk('desk_skye_top', { pos: V(4, 2.6, -1.3), heading: Math.PI }),
  bag: () => mk('chair_skye_back', { pos: V(4, 2.0, 1.05), heading: 0 }),
  extra: (i) => mk(['desk_r1c3', 'desk_extra_2', 'desk_extra_3', 'desk_extra_4'][i], [
    { pos: V(-2.4, 0, 0), heading: Math.PI }, { pos: V(-2.4, 0, 4.2), heading: Math.PI },
    { pos: V(-5.6, 0, -4.2), heading: Math.PI }, { pos: V(4, 0, 8.4), heading: Math.PI }][i]),
};
const SEAT_TOP = 1.7;                                       // classroom chair seat height (until the set's mark gives seatTop)

// ---------- setup ----------
let C, A, P = {}, EXTRAS = [], MAXSTAND = null;
export async function setup(stage) {
  await K.buildSets(stage, ['classroom']);
  K.setState({ chapter: CH });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_school');
  EXTRAS = (C.extras || []).slice(0, 4); EXTRAS.forEach((e) => K.dress(e, 'extras'));
  A = await K.loadAnims(['idle', 'walk', 'run']);
  const add = (id, o = {}) => { try { const p = K.makeProp(id, o); stage.scene.add(p); return p; } catch (e) { console.warn(e.message); return null; } };
  P.cookie = add('cookie'); P.halfA = add('sandwich', { half: true }); P.halfB = add('sandwich', { half: true });
  P.bag = add('backpack');                                   // on her chair (kit-props request; skipped until it exists)
  P.cobweb = K.makeProp('cobweb'); K.wearOnHead(P.cobweb, C.skye, { spot: 'left' });
  P.lunch = EXTRAS.map((_, i) => add(...[['sandwich', {}], ['cookie', {}], ['sandwich', { half: true }], ['sandwich', { bitten: 2 }]][i]));
  P.scene = stage.scene;
  buildShots();
  // a stand-in for Max standing in the aisle: the hand-off two-shot keeps this framing while he walks back (one angle)
  MAXSTAND = { root: new THREE.Object3D(), bones: {}, scale: 1 };
  MAXSTAND.bones.Head = new THREE.Object3D(); MAXSTAND.bones.Head.position.set(0, 4, 0); MAXSTAND.root.add(MAXSTAND.bones.Head);
}

// ---------- key times ----------
const T = {
  walk0: 0.0,                                  // Max leaves his desk on frame 0
  offer: () => wordT(1, 15, -0.1),             // "Max was being nice": cookie out
  cookieDown: () => end(6, -0.2),
  swap: () => end(6, 0.45),                    // sandwich from his left hand to his right              // after "I'm just being nice." he puts it on her desk
  lean: () => end(11, 0.05),                   // [+0.6 Max leans in]
  unlean: () => at(18, 0.1),                   // "Right." he straightens
  show: () => wordT(18, 4, -0.1),                     // lifts the sandwich to show it
  split: () => wordT(20, 3, -0.15),                    // "Want half?" one half into his right hand, held out
  take: () => end(20, 0.15),                   // Skye's hand meets the half
  back: () => end(20, 0.45),                   // Max walks back to his desk
  snap: () => wordT(21, 5, -0.05),                    // "Stop it, face." Skye snaps her head front
};

// ---------- the shot table ----------
const S2 = (s) => K.twoShot(s, C.skye, C.max, { framing: 'ms', fov: 34, look: V(0, -0.45, 0) });   // a touch low: held props clear the captions
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
  const c = K.getSet('classroom').cams.end_front; if (c) return K.setCam(s, { ...c, target: c.target.clone().add(V(0, -0.5, 0)) });
  const sk = K.headPos(C.skye), mx = K.headPos(C.max);
  const target = sk.clone().lerp(mx, 0.42).add(V(0, -0.5, 0));
  const pos = sk.clone().add(V(-2.6, 0.2, -6.4));
  return K.applyShot(s, { pos, target, fov: 34 });
};
// "Want half?" two-shot: Max's place in it is his standing mark, so the angle holds still while he walks away
const HALF = (s, t) => {
  const mA = M.aisle(); MAXSTAND.root.position.copy(mA.pos); MAXSTAND.root.rotation.set(0, mA.heading - 0.5, 0);
  return K.twoShot(s, C.skye, MAXSTAND, { framing: 'ms', fov: 34, look: V(0, -0.45, 0) });
};
// the end shot starts once Max is back in his seat (walk 12 studs/s from the aisle), never before line 21's lead-in
const ENDCUT = () => Math.max(at(21, -0.35), T.back() + M.aisle().pos.distanceTo(M.max().pos) / 12 + 0.2);
const SHOT_LIST = [
  { line: 1, off: 0, id: 'skye_max_diag', cam: named('skye_max_diag', WIDE) },
  { line: 1, word: 10, id: 'two_shot', cam: S2 },
  { line: 3, off: -0.1, id: 'skye_wrong', cam: named('mcu_skye', SK('mcu')) },
  { line: 4, off: -0.1, id: 'max_nothing', cam: MX('mcu') },
  { line: 5, off: -0.1, id: 'skye_lick', cam: named('cu_skye', SK('cu')) },
  { line: 6, off: -0.1, id: 'max_no', cam: S2 },
  { line: 7, off: -0.1, id: 'skye_since', cam: named('mcu_skye', SK('mcu')) },
  { line: 8, off: -0.1, id: 'max_ghost', cam: MX('mcu') },
  { line: 9, off: -0.1, id: 'fridge_two', cam: S2 },
  { line: 10, off: -0.1, id: 'skye_spooky', cam: named('mcu_skye', SK('mcu')) },
  { line: 11, off: -0.1, id: 'max_private', cam: MX('mcu') },
  { line: 11, off: 1.0, id: 'lean_two', cam: S2c },
  { line: 13, off: -0.1, id: 'skye_fashion', cam: named('cu_skye', SK('cu')) },
  { line: 14, off: -0.1, id: 'max_pancakes', cam: S2c },
  { line: 15, off: -0.1, id: 'skye_lots', cam: named('mcu_skye', SK('mcu')) },
  { line: 16, off: -0.1, id: 'max_cinnamon', cam: MX('mcu') },          // follows his lean
  { line: 17, off: -0.1, id: 'skye_spice', cam: named('mcu_skye', SK('mcu')) },
  { line: 18, off: -0.1, id: 'right_two', cam: S2 },
  { line: 19, off: -0.1, id: 'skye_crusts', cam: named('mcu_skye', SK('mcu')) },
  { line: 20, off: -0.1, id: 'max_half', cam: HALF },                    // one angle from "Want half?" through the take and his walk back
  { line: 21, off: 98, id: 'end_front', cam: END },                       // cut once, after he has sat down
];
// shot starts need the set's marks (ENDCUT), so they are computed in setup() once the classroom is built
let SHOTS = [];
const buildShots = () => { SHOTS = SHOT_LIST.map((x) => ({ ...x, start: x.off === 98 ? ENDCUT() : x.off === 99 ? end(x.line, 0.1) : x.word != null ? wordT(x.line, x.word, -0.1) : Math.max(0, at(x.line, x.off)) })).sort((a, b) => a.start - b.start); };
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- posing helpers (choreography only; poses, gestures, faces and looks come from the kit) ----------
const mix = (a, b, u) => a + (b - a) * u;
const amix = (a, b, u) => { let d = ((b - a) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const P3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
function placeAt(prop, pos, rotY = 0) {
  if (prop.parent !== P.scene) P.scene.add(prop);
  prop.position.copy(pos); prop.rotation.set(0, rotY, 0); prop.visible = true;
}
// seated on a mark: posture dict + the root at the seat (the mark's seatTop, else a 2.0-stud classroom chair)
function sitOn(a, m, heading, dict) {
  K.posture(a, dict);
  a.root.visible = true;
  a.root.position.copy(m.pos); if (!m.sit) a.root.position.y = K.seatY(a, m.pos.y + SEAT_TOP);   // set sit marks: pos.y is already the root
  a.root.rotation.set(0, heading, 0); a.root.updateMatrixWorld(true);
}
function standOn(a, pos, heading, dict) {
  const drop = K.posture(a, dict);
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, heading, 0); a.root.updateMatrixWorld(true);
  a.root.position.y -= a.soleHeight() - pos.y + drop; a.root.updateMatrixWorld(true);
}
const SIT = K.POSES.sit_desk_arms;
const OFFER = [-84, 0, 4];                 // hold_out raised to chest height (kit hold_out is -64: too low for the frame)
const CHEST = [-112, 0, -18];               // Skye's half held up in front of her chest
const GLANCE_SIGN = 1;

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet('classroom');
  K.applyLight(stage, 'school_day', { set });
  const idle = K.holdClock(t, L, [[0, 1.8], [T.back(), T.back() + 1.0]]);
  K.only(C, ['skye', 'max', 'extras']);

  // ----- Skye: seated at her desk all chapter, turned toward Max in the aisle -----
  const mS = M.skye(), mA = M.aisle(), mM = M.max();
  const towardMax = K.faceTo(mS, mA), watchMaxDesk = K.faceTo(mS, mM);
  const turnTo = (h, u) => amix(mS.heading, h, u);
  let hS = turnTo(towardMax, 0.45 * ramp(t, wordT(1, 14), wordT(1, 15))), headY = 0;
  const hTurned = turnTo(towardMax, 0.45);
  const toDesk = Math.sign(amix(hTurned, watchMaxDesk, 1) - hTurned), away = -Math.sign(amix(hTurned, towardMax, 1) - hTurned || 1);
  // stares after him through the hand-off shot; for her whisper (end_front) she faces front again, 3/4 to the lens
  const faceFront = ENDCUT() - 0.1;
  if (t > T.back()) { hS = hTurned; headY = 40 * toDesk * ramp(t, T.back(), T.back() + 0.6); }
  if (t > faceFront) { hS = mS.heading - 0.25; headY = 0; }
  if (t > T.snap() && t < T.snap() + 0.45) headY = 12 * Math.sin((t - T.snap()) / 0.45 * Math.PI * 3);   // "Stop it, face." shakes it off
  let dS = { ...SIT };
  const back = (t > at(3) && t < at(7) ? ramp(t, at(3), at(3) + 0.3) * (t > at(5) ? 1 : 0.5) * (1 - ramp(t, at(7), at(7) + 0.3)) : 0)
    + (t > at(12) && t < at(16) ? ramp(t, at(12), at(12) + 0.3) * (1 - ramp(t, at(16) - 0.3, at(16))) * 0.7 : 0);
  dS.Torso = P3(SIT.Torso, K.POSES.lean_back.Torso, back); dS.Head = P3([0, 0, 0], K.POSES.lean_back.Head, back);
  if (t > at(10) && t < end(10, 0.3)) dS = K.mixAngles(dS, K.POSES.chin_on_hand, 0.4 * ramp(t, at(10), at(10) + 0.3) * (1 - ramp(t, end(10), end(10, 0.3))));
  if (t > at(17, 0.5) && t < end(17, 0.2)) headY += 30 * away * ramp(t, at(17, 0.5), at(17, 0.8)) * (1 - ramp(t, end(17), end(17, 0.2)));   // prim: turns her head away
  if (t > at(13) && t < end(13, 0.25)) headY += 25 * away * ramp(t, at(13), at(13) + 0.2) * (1 - ramp(t, end(13), end(13, 0.25)));   // "It's fashion." flips her hair away from him: the cobweb side to camera
  const tilt = t > at(13) && t < end(13, 0.25) ? 12 * ramp(t, at(13), at(13) + 0.2) * (1 - ramp(t, end(13), end(13, 0.25))) : 0;   // "It's fashion." smug head tilt
  dS.Head = [dS.Head?.[0] ?? 0, (dS.Head?.[1] ?? 0) + headY, (dS.Head?.[2] ?? 0) + tilt];
  sitOn(C.skye, mS, hS, dS);

  if (t > T.take() - 0.4) K.gesture(C.skye, OFFER, 'R', ramp(t, T.take() - 0.4, T.take()));
  if (t > T.take() + 0.1) K.gesture(C.skye, CHEST, 'R', ramp(t, T.take() + 0.1, T.take() + 0.5));      // holds her half up at chest height
  let fS = 'annoyed';
  if (t > wordT(1, 15)) fS = 'suspicious';
  if (t > at(7)) fS = 'annoyed';
  if (t > at(9, 0.4)) fS = 'scheming';                                               // she wrote it
  if (t > at(10)) fS = 'smug';
  if (t > end(11)) fS = 'nervous';
  if (t > at(13)) fS = 'smug';
  if (t > end(13)) fS = 'nervous';
  if (t > at(17)) fS = 'annoyed';
  if (t > at(19)) fS = 'surprised';
  if (t > T.back()) fS = 'nervous';
  if (t > T.snap()) fS = 'annoyed';
  K.speak(C.skye, fS, t, L.said('SKYE'), { whisper: t > at(21, -0.1) });
  K.blush(C.skye, t > T.back() ? 1 - 0.6 * ramp(t, T.snap(), T.snap() + 0.5) : (t > at(15) && t < at(17) ? 0.5 : 0));

  // ----- Max: walks over, stands in the aisle, walks back and sits -----
  const hA = mA.heading - 0.5;                                                       // facing her, cheated toward the board (cameras)
  const walkIn = t >= T.walk0 && t < T.walk0 + mM.pos.distanceTo(mA.pos) / 12;
  const walkBack = t >= T.back();
  let seatedM = false;
  if (t < T.back()) {
    const m = K.walk(C.max, A, mM, mA, T.walk0, t, { idleAt: idle, endHeading: hA });
    if (m.done) {
      const offer = ramp(t, T.offer() - 0.3, T.offer()) * (1 - ramp(t, T.cookieDown(), T.cookieDown() + 0.4));
      const lean = t > T.lean() ? ramp(t, T.lean(), T.lean() + 0.35) * (1 - ramp(t, T.unlean(), T.unlean() + 0.3)) : 0;
      const d = K.mixAngles({}, K.POSES.lean_in, lean);
      if (t > at(14) && t < at(14, 0.8)) d.Head = [(d.Head?.[0] ?? 0) + 8 * Math.abs(Math.sin((t - at(14)) * Math.PI * 5)), 0, 0];  // sniff, sniff
      if (t > at(8) && t < at(8, 1.4)) d.Head = [0, 18 * Math.sin((t - at(8)) * 4.5), 0];        // glances round: a secret
      if (t > at(11) && t < end(11)) d.Head = [6, -22, 0];                                          // "That's private." looks away
      standOn(C.max, mA.pos, hA, d);
      // the sandwich: left hand until the cookie is down, then his near (right) hand so the camera sees it; at "Want half?"
      // one half goes back to his left and the other is held out to her in his right
      const swapped = t > T.swap();
      K.gesture(C.max, 'cup_hold', 'L', swapped && t < T.split() ? 0 : 1);
      if (swapped) K.gesture(C.max, 'cup_hold', 'R', ramp(t, T.swap() - 0.25, T.swap()));
      if (t > T.show() && t < at(19, 0.3)) K.gesture(C.max, OFFER, 'R', ramp(t, T.show(), T.show() + 0.3) * (1 - ramp(t, at(19), at(19, 0.3))));
      const down = t > T.cookieDown() && t < T.cookieDown() + 0.5 ? Math.sin(Math.PI * clamp((t - T.cookieDown()) / 0.5)) : 0;
      if (offer > 0 || down > 0) K.gesture(C.max, down > 0 ? 'tap' : OFFER, 'R', Math.max(offer, down));
      if (t > T.split()) K.gesture(C.max, OFFER, 'R', ramp(t, T.split(), T.split() + 0.35) * (1 - ramp(t, T.take() + 0.1, T.take() + 0.4)));
    } else { K.gesture(C.max, 'cup_hold', 'L', 1); K.gesture(C.max, 'cup_hold', 'R', 0.6); }
  } else {
    const m = K.walk(C.max, A, mA, mM, T.back(), t, { idleAt: idle, endHeading: mM.heading });
    if (m.done) {
      seatedM = true;
      const d = { ...SIT, Head: [0, 0, 0] };
      const hM = amix(mM.heading, K.faceTo(mM, mS), 0.3);
      const glance = t > at(21, 0.6) ? 1 : 0;                                         // glances over at her
      d.Head = [0, glance * 75 * GLANCE_SIGN * Math.sign(amix(hM, K.faceTo(mM, mS), 1) - hM), 0];
      sitOn(C.max, mM, hM, d);
      K.gesture(C.max, 'cup_hold', 'R', 1);
    } else K.gesture(C.max, 'cup_hold', 'R', 0.7);
  }
  let fM = 'happy';
  if (t > at(6) && t < at(6, 0.45)) fM = 'shocked';
  if (t > at(8)) fM = 'nervous';
  if (t > at(9, 1.0)) fM = 'neutral';
  if (t > at(11)) fM = 'nervous';
  if (t > end(11)) fM = 'suspicious';
  if (t > at(18)) fM = 'happy';
  K.speak(C.max, fM, t, L.said('MAX'));
  K.blush(C.max, t > at(11) && t < end(11, 0.4) ? 0.7 : 0);

  // ----- extras: eating at their desks -----
  EXTRAS.forEach((e, i) => {
    const m = M.extra(i);
    sitOn(e, m, m.heading, SIT);
    const bite = 0.5 + 0.5 * Math.sin(idle * 2.1 + i * 1.7);
    K.gesture(e, 'chin_hand', 'R', clamp((bite - 0.3) / 0.7));
    K.speak(e, bite > 0.85 ? 'mouth_o' : 'happy', t, []);
    if (P.lunch[i]) K.hold(P.lunch[i], e, 'R');
  });

  // ----- props -----
  const out = (u) => (u > 0.5 ? 'out' : 'palm');
  if (t < T.cookieDown() + 0.25) K.hold(P.cookie, C.max, 'R', out(t > T.offer() - 0.15 && t < T.cookieDown() ? 1 : 0));
  else { if (P.cookie.parent !== P.scene) P.scene.add(P.cookie); K.place(P.cookie, M.deskTop().pos.clone().add(V(-0.6, 0, 0.1)), 0.4); }
  const hand0 = t < T.swap() ? 'L' : 'R';
  K.hold(P.halfA, C.max, t < T.swap() ? 'L' : t < T.split() ? 'R' : t < T.back() ? 'L' : 'R', t > T.show() && t < at(19, 0.3) ? 'out' : 'palm');
  if (t < T.split()) K.hold(P.halfB, C.max, hand0, t > T.show() && t < at(19, 0.3) ? 'out' : 'palm', { offset: [hand0 === 'L' ? 0.38 : -0.38, 0, 0] });   // the two halves side by side
  else if (t < T.take()) K.hold(P.halfB, C.max, 'R', 'out'); else K.hold(P.halfB, C.skye, 'R', t < T.take() + 0.3 ? 'out' : 'palm');
  if (P.bag) { const bag = M.bag(); if (P.bag.parent !== P.scene) P.scene.add(P.bag); K.place(P.bag, bag.pos, bag.heading); }

  K.setBlockers(set.group, C.skye, C.max);
  { const mA = M.aisle(); MAXSTAND.root.position.copy(mA.pos); MAXSTAND.root.rotation.set(0, mA.heading - 0.5, 0); }
  K.setLine(C.skye, t < T.back() ? C.max : MAXSTAND, -1);   // after the take the line stays on his standing mark (no flip while he walks)                            // board side (-z) of Skye -> Max
  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }

// ---------- for the hold check (web/ch04_hold.js) ----------
export const cast = () => ({ skye: C.skye, max: C.max, ...Object.fromEntries(EXTRAS.map((e, i) => ['extra' + i, e])) });
const HC = { dist: 4.5, side: -2.0, up: 1.0 };
export const HOLDS = [
  [1.0, 'max', 'R', 'cookie (walking over)', HC], [1.0, 'max', 'L', 'sandwich halves (walking over)', HC],
  [T.offer() + 0.5, 'max', 'R', 'cookie held out', HC], [T.show() + 0.5, 'max', 'R', 'sandwich shown', HC],
  [T.split() + 0.5, 'max', 'R', 'half held out', HC], [T.split() + 0.5, 'max', 'L', 'other half', HC],
  [T.take() + 0.8, 'skye', 'R', 'half in her hand', HC], [LAST + 0.7, 'skye', 'R', 'half, last frame', HC],
];
