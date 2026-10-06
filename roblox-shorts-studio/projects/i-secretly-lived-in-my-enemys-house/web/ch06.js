// Ch6: The Practice (THURSDAY 10:15 PM). Upstairs hallway at night, cutting inside Max's room. Plan: production/shots/ch06.md.
// Skye creeps to Max's door and overhears him practising asking someone to the dance; Lily sneaks up ("You like him");
// Dad's broom patrol; Lily pulls Skye into the linen closet; "I'm checking every single box." "Every box?" "Uh-oh."
// Everything is a pure function of t, keyed to the spoken lines (lines.json indexes are 1-based).
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 6;
const CARD = { day: 'THURSDAY', time: '10:15 PM' };
const EST = [
  { index: 1, speaker: 'VO', text: 'Thursday night. I had my best haunting planned yet. Then I heard him through his bedroom door.', start: 0.0, end: 5.0 },
  { index: 2, speaker: 'MAX', note: 'behind door', text: 'Hey. So. Do you want to go to the Halloween dance with me?', start: 5.35, end: 9.0 },
  { index: 3, speaker: 'MAX', note: 'behind door', text: 'No. Too serious.', start: 9.25, end: 10.5 },
  { index: 4, speaker: 'MAX', note: 'behind door', text: 'Yo! Dance? You? Me? Ugh. No.', start: 10.75, end: 13.8 },
  { index: 5, speaker: 'MAX', note: 'behind door', text: "Okay. This weekend, I just ask her. What's the worst she can say? Gross?", start: 14.05, end: 18.4 },
  { index: 6, speaker: 'SKYE', note: 'whisper', text: 'Who is he asking?', start: 18.65, end: 19.9 },
  { index: 7, speaker: 'SKYE', note: 'whisper', text: 'Who would even say yes to him?', start: 20.15, end: 21.9 },
  { index: 8, speaker: 'LILY', note: 'whisper', text: 'You like him.', start: 22.75, end: 23.9 },
  { index: 9, speaker: 'SKYE', note: 'whisper', text: "Lily! Don't sneak up on me.", start: 24.15, end: 25.8 },
  { index: 10, speaker: 'SKYE', note: 'whisper', text: 'And I do not like him.', start: 26.05, end: 27.5 },
  { index: 11, speaker: 'LILY', note: 'whisper', text: 'Then why is your face all red?', start: 27.75, end: 29.6 },
  { index: 12, speaker: 'SKYE', note: 'whisper', text: "It's dusty up there. It's a very dusty attic.", start: 29.85, end: 32.8 },
  { index: 13, speaker: 'DAD', text: "Hello? Mister Ghost? This is a friendly house. We're friendly people.", start: 33.85, end: 38.6 },
  { index: 14, speaker: 'DAD', text: 'But you have eaten nine of my pancakes, and that is where I draw the line.', start: 38.85, end: 43.4 },
  { index: 15, speaker: 'DAD', text: 'Max, was that you?', start: 44.25, end: 45.5 },
  { index: 16, speaker: 'MAX', note: 'behind door', text: 'Go to bed, Dad!', start: 45.75, end: 46.9 },
  { index: 17, speaker: 'DAD', text: "I'm a grown man. I go to bed when I want.", start: 47.15, end: 50.0 },
  { index: 18, speaker: 'DAD', text: "Tomorrow, I'm going up into that attic, and I'm checking every single box.", start: 50.25, end: 55.0 },
  { index: 19, speaker: 'SKYE', note: 'whisper', text: 'Every box?', start: 55.25, end: 56.1 },
  { index: 20, speaker: 'LILY', note: 'whisper', text: 'Uh-oh.', start: 56.35, end: 57.0 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
const LAST = Math.max(...L.lines.map((l) => l.end));
export const meta = K.chapterMeta(LAST + 0.8);        // last line + 0.8 s room tone (boundary sheet: 0.5-1.0 s)
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ln = (i) => L.line(i);
const at = (i, off = 0) => ln(i).start + off;
const end = (i, off = 0) => ln(i).end + off;
// start time of the k-th word (0-based) of spoken line i (measured words when narration exists, else spread evenly)
function wordT(i, k) {
  const l = ln(i), ws = L.words.filter((w) => w.start >= l.start - 0.05 && w.start < l.end);
  if (ws.length > k) return ws[k].start;
  const n = l.text.split(/\s+/).length; return l.start + (l.end - l.start) * k / n;
}

// ---------- key times ----------
const T = {
  heard: () => wordT(1, 11),                 // "heard"
  whats: () => wordT(5, 7),                  // "What's": cut back to Skye at the door
  tap: () => end(7, 0.2),                    // Lily's tap (the +0.6 pause)
  creak: () => end(12, 0.12),                // floorboard creak, Dad's beam (the +0.8 pause)
  hide: () => end(14, 0.08),                 // Lily pulls Skye into the closet (the +0.6 pause)
  hatch: () => wordT(18, 1),                 // "I'm going up": Dad steps under the hatch
};

// ---------- marks (kit-sets-a hallway / bedroom; world coordinates) ----------
// Hallway: runs along x, open camera side +z. Linen closet in the left end wall (x -17), Max's door (x -9) and Lily's
// door (x 6) in the back wall, the attic hatch in the ceiling (x -4..0), the stairs at the right end (x 11).
const HO = () => K.getSet('hallway').group.position;
const hw = (x, z, heading) => ({ pos: HO().clone().add(V(x, 0, z)), heading });
const M = {
  creep: () => K.mark('hallway', 'hall_creep_start'),
  door: () => ({ ...K.mark('hallway', 'max_door_listen'), heading: -0.87 }),     // listening: face cheated 3/4 to camera
  doorTurn: 1.15,                                                                 // turned to Lily (facing +x, a bit to camera)
  lilyStart: () => K.mark('hallway', 'lily_door_out'),
  lily: () => { const m = K.mark('hallway', 'max_door_listen'); return { pos: m.pos.add(V(1.5, 0, 1.2)), heading: -0.45 }; },   // behind Skye, facing her (-x), cheated 3/4
  linenFront: () => K.mark('hallway', 'linen_front'),
  linenSkye: () => hw(-17.4, -2.0, 1.0),           // inside, at the crack, above and behind Lily
  linenLily: () => hw(-16.95, -1.5, 1.05),         // in front of / below Skye
  stairs: () => K.mark('hallway', 'dad_enter'),
  dadMid: () => hw(4.0, 0.8, -1.07),
  hatch: () => hw(-5.6, 1.4, 1.45),                 // just past the hatch, facing it (+x) and looking up; the closet behind him
  mirror: () => { const m = K.mark('bedroom', 'desk_stand'); m.pos.x -= 0.8; return m; },   // facing the mirror, a step back from the desk
};
const HATCH_C = () => HO().clone().add(V(-2, 9.6, 0));

// ---------- setup ----------
let C, A, P = {}, beamSkye, beamDad, dadFill;
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'bedroom']);
  K.setState({ chapter: CH });
  const bd = K.getSet('bedroom');
  if (bd?.parts?.chair) bd.parts.chair.position.x -= 3.2;   // the desk chair pushed back so Max can stand at the mirror
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_robe');
  A = await K.loadAnims(['idle', 'walk', 'run', 'shock', 'facepalm', 'horror_listen', 'think']);
  P.torchSkye = K.makeProp('flashlight', { color: 'pink' }); stage.scene.add(P.torchSkye); K.hold(P.torchSkye, C.skye, 'R');
  P.torchDad = K.makeProp('flashlight'); stage.scene.add(P.torchDad); K.hold(P.torchDad, C.dad, 'L');
  P.broom = K.makeProp('broom'); stage.scene.add(P.broom); K.hold(P.broom, C.dad, 'R');
  beamSkye = K.chinLight(stage); beamDad = K.flashlightBeam(stage, { cone: 0.02 }); dadFill = K.chinLight(stage);
}
export const cast = () => ({ skye: C.skye, max: C.max, lily: C.lily, dad: C.dad });

// ---------- the shot table ----------
const H = 'hallway', B = 'bedroom';
const SHOTS = [
  { at: () => 0, id: 'creep', set: H, cam: (s) => setCam(s, H, 'door_approach') },
  { at: () => at(2, -0.15), id: 'mirror_ms', set: B, cam: (s) => camMirror(s, 'mcu') },
  { at: () => at(4, -0.15), id: 'mirror_gest', set: B, cam: (s) => camMirror(s, 'ms', 0.3) },
  { at: () => at(5, -0.15), id: 'mirror_cu', set: B, cam: (s) => camMirror(s, 'mcu', -0.15) },
  { at: () => T.whats() - 0.1, id: 'door_listen', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.3 }) },
  { at: () => T.tap() - 0.45, id: 'tap', set: H, cam: (s) => K.setCam(s, { pos: K.headPos(C.lily).add(V(-0.2, 0.5, 6.8)), target: K.headPos(C.lily).lerp(K.headPos(C.skye), 0.45).add(V(0, -0.5, 0)), fov: 40 }, { clear: false }) },
  { at: () => at(9, -0.1), id: 'skye_mcu', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { at: () => at(11, -0.1), id: 'lily_mcu', set: H, cam: (s) => K.setCam(s, { pos: K.headPos(C.lily).add(V(0.4, 0.3, 4.6)), target: K.headPos(C.lily).add(V(-0.5, -0.1, 0)), fov: 40 }, { clear: false }) },
  { at: () => at(12, -0.1), id: 'skye_dusty', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { at: () => T.creak(), id: 'hall_wide', set: H, cam: (s) => setCam(s, H, 'wide_to_stairs') },
  { at: () => at(13, 0.9), id: 'dad_ms', set: H, cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.4 }) },
  { at: () => at(14, -0.1), id: 'dad_mcu', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.4 }) },
  { at: () => T.hide() - 0.05, id: 'hide_wide', set: H, cam: (s) => setCam(s, H, 'wide') },
  { at: () => at(15, -0.1), id: 'dad_max', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.45 }) },
  { at: () => at(16, -0.1), id: 'max_bed', set: B, cam: (s) => camMirror(s, 'mcu', 0.9) },
  { at: () => at(17, -0.1), id: 'dad_grown', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.4 }) },
  { at: () => T.hatch() + 1.12, id: 'dad_hatch', set: H, cam: (s) => camHatch(s) },   // after his 9.6-stud walk at 9 studs/s
  { at: () => at(19, -0.12), id: 'gap', set: H, cam: (s) => K.setCam(s, K.getSet(H).cams.linen_gap, { clear: false }) },
  { at: () => end(20, 0.05), id: 'end', set: H, cam: (s) => camEnd(s) },
].map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

const setCam = (stage, id, name) => { const set = K.getSet(id); return K.setCam(stage, set.cams[name], { blockers: [set.group] }); };
const fixed = (stage, pos, target, fov) => K.setCam(stage, { pos: HO().clone().add(pos), target, fov }, { blockers: [K.getSet(H).group] });
// opening: from ahead of Skye as she creeps down the hall to Max's door; her face 3/4, below the day card
const camCreep = (stage) => fixed(stage, V(-13.5, 4.3, 5.5), K.headPos(C.skye).lerp(HO().clone().add(V(-9, 3.6, -5)), 0.3).add(V(0, 0.6, 0)), 38);
// the mirror's point of view: the camera just in front of the desk mirror, looking back at Max (a slight angle off square)
function camMirror(stage, framing, side = -0.35) {
  const eye = K.headPos(C.max), f = { cu: 2.6, mcu: 3.8, ms: 4.8 }[framing];
  const pos = V(10.3, eye.y + 0.25, eye.z + side * 2), d = pos.distanceTo(eye);
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(f / 2 / d)) * 1.05;
  return K.setCam(stage, { pos, target: eye.clone().add(V(0, -0.12 * f, 0)), fov }, { clear: false });
}
// Dad from low in front, the hatch above him in frame
const camHatch = (stage) => fixed(stage, V(2.2, 3.0, 3.6), K.headPos(C.dad).lerp(HATCH_C(), 0.22), 44);
// last frame: toward the linen-closet gap, Dad in the foreground (3/4) facing the hatch
const camEnd = (stage) => fixed(stage, V(2.0, 4.0, 9.5), K.headPos(C.dad).lerp(K.headPos(C.skye), 0.62).add(V(0, -0.8, 0)), 34);

// ---------- arm and head overrides (after playAnim; one arm high at most) ----------
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
// fwd: swing forward (rad, 0 hanging, PI/2 straight ahead, <= 2.4); out: away from the body (rad); twist about the arm
function arm(a, side, fwd, out = 0, twist = 0) {
  _e.set(-fwd, twist, side === 'L' ? out : -out, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(_e);
}
function headTurn(a, yaw = 0, pitch = 0, roll = 0) {
  _e.set(-pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e); a.bones.Head.quaternion.multiply(_q);
}
const pulse = (t, t0, d) => (t >= t0 && t < t0 + d ? Math.sin(Math.PI * (t - t0) / d) : 0);

// ---------- update ----------
export function update(t, stage) {
  P.dadAim = false;
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  const idle = K.holdClock(t, L, [[0, T.heard() + 0.6], [T.tap() - 1.8, T.tap() + 0.7], [T.creak(), at(13, 1.8)], [T.hide(), T.hide() + 1.2], [T.hatch() - 0.4, T.hatch() + 1.4]]);
  const o = set.group.position;
  if (sh.set === H) K.setLine(V(o.x - 20, 4, o.z + 0.5), V(o.x + 14, 4, o.z + 0.5), 1); else K.clearLine();
  let linen = 0;
  if (sh.set === H) linen = hallway(t, idle, sh); else bedroom(t, idle, sh);
  if (sh.set === H) set.setLinen?.(linen);
  K.setBlockers(set.group, ...Object.values(cast()).filter((a) => a.root.visible));
  const pr = sh.set === H
    ? { moon_window: t >= T.creak() ? 0.65 : 1, under_door: true, nightlight: true, linen_fill: linen > 0.02 && linen < 0.8 ? 0.6 : false }
    : { bedside_lamp: true, desk_lamp: true, moon_window: 1.2 };
  K.applyLight(stage, 'night_moon', { set, practicals: pr });
  sh.cam(stage, t);
  beams(t, sh);
}

// ---------- Max's room: rehearsing to the mirror ----------
function bedroom(t, idle, sh) {
  K.only(C, ['max']);
  const m = M.mirror(), mx = C.max;
  let face = 'nervous';
  K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m);
  if (t < at(3)) {                                    // "Hey. So. Do you want to go to the Halloween dance with me?"
    const k = smooth((t - at(2) + 0.1) / 0.4) * (1 - smooth((t - wordT(2, 6)) / 0.4));   // nervous hand to his chin
    if (k > 0) { K.playAnim(mx, [[A.idle, idle], [A.think, 0.4, 2 * k, false]]); K.putOn(mx, m); }
    const offer = smooth((t - wordT(2, 10) + 0.1) / 0.3);                               // open-hand offer on "with me?"
    if (offer > 0) arm(mx, 'L', 1.1 * offer, 0.3 * offer, 0);
  } else if (t < at(4)) {                             // "No. Too serious." head shake
    headTurn(mx, 0.3 * Math.sin((t - at(3)) * 14) * pulse(t, at(3), 0.8)); face = 'annoyed';
  } else if (t < at(5)) {                             // "Yo! Dance? You? Me? Ugh. No."
    face = 'happy';
    const you = wordT(4, 2), me = wordT(4, 3), ugh = wordT(4, 4);
    if (t >= you - 0.1 && t < me - 0.05) arm(mx, 'R', 1.55 * smooth((t - you + 0.1) / 0.12), 0.05);   // points at the mirror
    else if (t >= me - 0.05 && t < ugh - 0.05) arm(mx, 'R', 1.3, -0.6, 0);                             // thumb to his chest
    if (t >= ugh - 0.05) { K.playAnim(mx, [[A.idle, idle], [A.facepalm, Math.min(0.3, t - ugh + 0.05), 1.6, false]]); K.putOn(mx, m); face = 'annoyed'; }
  } else if (sh.id !== 'max_bed') {                   // "Okay. This weekend, I just ask her..." squares up, a nod
    face = 'determined'; headTurn(mx, 0, -0.12 * pulse(t, wordT(5, 3), 0.5));
  } else {                                            // "Go to bed, Dad!" turned toward his door
    K.putOn(mx, { pos: m.pos, heading: 1.05 }); face = 'annoyed';   // half turned to his door, the desk lamp on his face
  }
  K.speak(mx, face, t, L.said('MAX'));
}

// a two-leg run (via a waypoint) from t0; returns the travel state of the current leg
function run2(a, from, via, to, t0, t, speed = 16) {
  const t1 = t0 + from.pos.distanceTo(via.pos) / speed;
  if (t < t1) return K.walk(a, A, from, via, t0, t, { speed });
  return K.walk(a, A, via, to, t1, t, { speed, endHeading: to.heading });
}

// ---------- the hallway ----------
function hallway(t, idle, sh) {
  const sk = C.skye, li = C.lily, dd = C.dad;
  const lilyOn = t >= T.tap() - 1.9, dadOn = t >= T.creak() - 0.05;
  K.only(C, ['skye', ...(lilyOn ? ['lily'] : []), ...(dadOn ? ['dad'] : [])]);
  const door = M.door(), hide = T.hide();
  let linen = 0;

  // --- Skye ---
  let skFace = 'scheming', chin = 1;                  // chin: 1 = flashlight under her chin, 0 = lowered
  if (t < hide) {
    const cr = M.creep(), creepEnd = 3.0, sp = 4.2;
    const m = K.walk(sk, A, cr, door, creepEnd - cr.pos.distanceTo(door.pos) / sp, t, { speed: sp, idleAt: idle, endHeading: door.heading });
    if (m.done) {
      let h = door.heading;
      if (t >= T.tap()) h = door.heading + (M.doorTurn - door.heading) * smooth((t - T.tap() - 0.3) / 0.35);   // turns to Lily
      if (t >= T.creak()) h = M.doorTurn - 0.15 * smooth((t - T.creak() - 0.1) / 0.3);                          // toward the stairs
      const listen = t >= T.heard() - 0.1 && t < at(6, 0.1);
      K.playAnim(sk, listen ? [[A.idle, idle], [A.horror_listen, Math.min(1.2, t - T.heard() + 0.1), 1.5, false]] : [[A.idle, idle]]);
      K.putOn(sk, { pos: door.pos, heading: h });
      if (t >= at(6, 0.1) && t < T.tap()) headTurn(sk, 0.25 * smooth((t - at(6, 0.1)) / 0.3));   // pulls back, turns her face out
    }
    if (t < T.heard()) skFace = 'scheming';
    else if (t < at(5)) skFace = 'surprised';
    else if (t < at(7)) skFace = 'suspicious';
    else if (t < T.tap()) skFace = 'annoyed';
    else if (t < at(9)) skFace = 'shocked';
    else if (t < at(12)) skFace = 'annoyed';
    else if (t < T.creak()) skFace = 'nervous';
    else skFace = 'scared';
    const jolt = pulse(t, T.tap() + 0.02, 0.45);      // the jump when Lily taps her (a hop; the torch drops from her chin)
    if (jolt > 0) sk.root.position.y += 0.45 * jolt;
    if (t >= T.heard()) chin = 1 - smooth((t - T.heard()) / 0.3);   // she lowers the torch to lean in and listen
    if (t >= at(10) && t < at(11)) arm(sk, 'L', 1.25, -0.7);                  // arms folded: "I do not like him"
    if (t >= at(12) && t < T.creak()) {               // "up there": the left arm points up at the attic (the right holds the light)
      const u = pulse(t, wordT(12, 2) - 0.15, 1.4);
      if (u > 0) arm(sk, 'L', 2.3 * u, 0.15 * u);
    }
  } else {                                            // pulled into the linen closet, peeking out
    const m = run2(sk, { pos: door.pos, heading: door.heading }, M.linenFront(), M.linenSkye(), hide + 0.12, t);
    if (m.moving) arm(sk, 'L', 1.0, 0.1);            // her hand in Lily's
    if (t >= m.arrive && m.done) { K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, M.linenSkye()); }
    skFace = 'scared'; chin = 0;
    linen = t < hide + 0.9 ? 0.75 * smooth((t - hide - 0.1) / 0.3) : 0.75 - 0.35 * smooth((t - hide - 0.9) / 0.4);   // open, they dive in, pulled to a crack (0.4)   // opens, they dive in, pulled to a crack
  }
  K.speak(sk, skFace, t, L.said('SKYE'));
  P.torchSkye.userData.chin = chin;
  if (chin > 0.02) K.gesture(sk, 'flashlight_chin', 'R', chin);     // the torch held under her chin
  if (chin > 0.5) K.hold(P.torchSkye, sk, 'R', 'palm', { aim: K.facePoint(sk) }); else K.hold(P.torchSkye, sk, 'R', 'palm');

  // --- Lily ---
  if (lilyOn) {
    let lfFace = 'neutral';
    const lm = M.lily();
    if (t < hide) {
      const st = M.lilyStart(), arrive = T.tap() - 0.05;
      const m = K.walk(li, A, st, lm, arrive - st.pos.distanceTo(lm.pos) / 9, t, { speed: 9, idleAt: idle, endHeading: lm.heading });
      if (m.done) {
        K.playAnim(li, [[A.idle, idle]]); K.putOn(li, lm);
        const tap = pulse(t, T.tap() - 0.1, 0.45);
        if (tap > 0) arm(li, 'L', 1.9 * tap, 0.1);    // the tap on Skye's arm
        if (t >= at(11) && t < at(12)) arm(li, 'L', 2.1 * smooth((t - wordT(11, 1)) / 0.2), 0.1);   // points up at Skye's red face
        headTurn(li, 0, 0.25);                        // looking up at Skye
        if (t >= T.creak()) { K.putOn(li, { pos: lm.pos, heading: lm.heading + 2.1 * smooth((t - T.creak() - 0.2) / 0.3) }); }
      }
      if (t >= at(8, -0.2)) lfFace = 'smug';
      if (t >= T.creak()) lfFace = 'surprised';
    } else {
      const m = run2(li, lm, M.linenFront(), M.linenLily(), hide, t);
      if (m.moving) arm(li, 'L', 0.5, 0.2);          // reaching back for Skye's hand
      if (t >= m.arrive && m.done) { K.playAnim(li, [[A.idle, idle]]); K.putOn(li, M.linenLily()); }
      lfFace = 'nervous';
    }
    K.speak(li, lfFace, t, L.said('LILY'));
  }

  // --- Dad ---
  if (dadOn) {
    let dFace = 'nervous', swordUp = 0, torchUp = 0;
    const st = M.stairs(), mid = M.dadMid(), hm = M.hatch();
    if (t < T.hatch()) {
      const m = K.walk(dd, A, st, mid, T.creak() + 0.15, t, { speed: 5, idleAt: idle, endHeading: mid.heading });
      if (m.done) {
        let h = mid.heading;
        if (t >= at(15, -0.2) && t < at(17)) h = K.faceTo(mid, K.mark('hallway', 'max_door'));   // "Max, was that you?"
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, { pos: mid.pos, heading: h });
      }
      dFace = t < at(13, 1.6) ? 'nervous' : t < at(15) ? 'determined' : t < at(17) ? 'suspicious' : 'smug';
      if (t >= wordT(14, 13) && t < at(15)) swordUp = smooth((t - wordT(14, 13)) / 0.25);   // "draw the line"
      if (t >= at(17) && t < T.hatch()) headTurn(dd, 0, 0.18 * smooth((t - at(17)) / 0.3)); // chin up
    } else {
      const m = K.walk(dd, A, mid, hm, T.hatch(), t, { speed: 9, idleAt: idle, endHeading: hm.heading });
      P.dadAim = m.done;
      if (m.done) {
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, hm);
        const u = smooth((t - m.arrive) / 0.4);
        headTurn(dd, 0, 0.3 * u); torchUp = 0.45 * u; swordUp = 0.85 * u;   // broom raised (right arm only); torch forward, its beam aimed up at the hatch   // broom held low across, torch up at the hatch
      }
      dFace = 'determined';
    }
    // broom out in front like a sword (right), raised on "draw the line" / at the hatch; torch (left) forward, up at the hatch
    arm(dd, 'R', 1.45 + 0.5 * swordUp, 0.05 + 0.5 * Math.max(0, swordUp), 0);   // raised out to the side, clear of his face
    arm(dd, 'L', 1.35 + 0.85 * torchUp, 0.12, 0);
    K.speak(dd, dFace, t, L.said('DAD'));
  }
  return linen;
}

// ---------- practicals: flashlight beams ----------
const _p = V(0, 0, 0), _d = V(0, 0, 0);
function handPos(a, side, out) { a.root.updateMatrixWorld(true); return a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].localToWorld(out.set(side === 'R' ? -0.5 : 0.5, -1.9, 0).multiplyScalar(1)); }
function beams(t, sh) {
  if (sh.set !== H) { beamSkye.set(false); beamDad.set(false); dadFill.set(false); return; }
  const sk = C.skye, chin = P.torchSkye.userData.chin ?? 0;
  const inCloset = t >= T.hide() + 0.9;           // in the closet her torch, covered by her hand, lights both faces a little
  const low = t >= T.heard() && t < T.creak();      // torch lowered, still lit: a dim glow on her face while she talks to Lily
  beamSkye.set(sk.root.visible && chin > 0.05 ? 0.28 * Math.max(chin, 0.6) : low ? 0.16 : inCloset ? 0.22 : false, sk);              // the torch under her chin: warm up-light
  if (C.dad.root.visible) {
    const a = C.dad; handPos(a, 'L', _p);
    const s0 = a.bones['Arm.L'].localToWorld(V(0.5, 0, 0)); _d.copy(_p).sub(s0).normalize();   // along the arm
    if (t < at(13)) { const sw = Math.sin((t - T.creak()) * 2.2) * 0.6; _d.applyAxisAngle(V(0, 1, 0), sw); }  // the beam swings in
    if (P.dadAim) _d.copy(HATCH_C()).sub(_p).normalize();                // up at the hatch
    beamDad.set(true, _p.clone(), _d.clone());
    dadFill.set(0.55, a);                          // warm spill from his torch on his face
  } else { beamDad.set(false); dadFill.set(false); }
}

// ---------- overlay ----------
let OVL = {};
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// moments for web/ch06_hold.js
export const HOLD_TIMES = {
  creep: 1.2, listen: at(6, 0.2), lowered: at(10, 0.3), lily: at(8, 0.3), closet: at(20, 0.2),
  dadWalk: at(13, 0.8), line: end(14, -0.2), hatch: end(20, 0.3),
};
