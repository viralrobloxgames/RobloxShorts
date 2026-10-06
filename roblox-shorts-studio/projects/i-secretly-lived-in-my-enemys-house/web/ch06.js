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
  hatch: () => wordT(18, 1),                 // "I'm going up": Dad walks under the hatch
  spin: () => end(14, -0.05),                // Dad spins round to a creak on the stairs; the girls dash behind his back
  atHatch: () => wordT(18, 1) + 1.25,         // he has walked past the hatch and turned to face it
};

// ---------- marks (kit-sets-a hallway / bedroom; world coordinates) ----------
// Hallway: runs along x, open camera side +z. Linen closet in the left end wall (x -17), Max's door (x -9) and Lily's
// door (x 6) in the back wall, the attic hatch in the ceiling (x -4..0), the stairs at the right end (x 11).
// Staging (plausibility pass): Skye creeps along the back wall from the hatch end to Max's door, faces the lens 3/4,
// right ear to the door; Lily comes up behind her from her own room (+x) and stops ~2 studs away; Dad comes up the
// stairs, stops at dad_mid, and on the +0.6 pause spins round to a noise on the stairs, so the girls dash to the closet
// behind his back; he then walks under the hatch and turns to face it, his back to the closet (crack, no light inside).
const HO = () => K.getSet('hallway').group.position;
const hw = (x, z, heading) => ({ pos: HO().clone().add(V(x, 0, z)), heading });
const M = {
  creep: () => hw(0.5, -1.4, -Math.PI / 2),
  door: () => hw(-8.0, -3.0, -1.27),                 // facing -x (cheated 3/4 to the lens), right ear to Max's door
  doorTurn: 1.12,                                    // turned to Lily (facing +x, a bit to camera)
  toDad: 1.0,                                        // turned toward Dad's beam at the stairs end
  lilyStart: () => K.mark('hallway', 'lily_door_out'),
  lily: () => hw(-5.4, -1.7, -1.05),                 // ~2 studs behind Skye, facing her, cheated 3/4
  linenFront: () => K.mark('hallway', 'linen_front'),
  skyeVia: () => hw(-14.0, -2.4, -Math.PI / 2),
  linenSkye: () => hw(-17.95, -1.85, 1.15),           // inside, behind Lily, face at the crack
  linenLily: () => hw(-17.0, -1.35, 1.25),           // in front of / below Skye
  stairs: () => K.mark('hallway', 'dad_enter'),
  dadMid: () => hw(4.0, 0.8, -1.07),
  hatch: () => hw(-6.2, -1.4, 1.25),                      // past the hatch, turned back to face it (+x), the closet behind him
  mirror: () => { const m = K.mark('bedroom', 'desk_stand'); m.pos.x -= 1.7; return m; },   // facing the mirror, well back from the desk
};
const HATCH_C = () => HO().clone().add(V(-2, 9.6, 0));
const STAIRS_C = () => HO().clone().add(V(12.5, 1.0, -2.6));

// ---------- setup ----------
let C, A, P = {}, beamSkye, beamDad, lilyGlow;
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'bedroom']);
  K.setState({ chapter: CH });
  const bd = K.getSet('bedroom');
  if (bd?.parts?.chair) bd.parts.chair.position.x -= 4.4;   // the desk chair pushed back so Max can stand at the mirror
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_robe');
  A = await K.loadAnims(['idle', 'walk', 'run', 'facepalm']);
  P.torchSkye = K.makeProp('flashlight', { color: 'pink' }); stage.scene.add(P.torchSkye); K.hold(P.torchSkye, C.skye, 'R');
  P.torchDad = K.makeProp('flashlight'); stage.scene.add(P.torchDad); K.hold(P.torchDad, C.dad, 'L');
  P.broom = K.makeProp('broom'); stage.scene.add(P.broom); K.hold(P.broom, C.dad, 'R');
  beamSkye = K.chinLight(stage); beamDad = K.flashlightBeam(stage, { cone: 0.02 }); lilyGlow = K.chinLight(stage);
}
export const cast = () => ({ skye: C.skye, max: C.max, lily: C.lily, dad: C.dad });

// ---------- the shot table ----------
const H = 'hallway', B = 'bedroom';
const SHOTS = [
  { at: () => 0, id: 'creep', set: H, cam: (s) => setCam(s, H, 'door_approach') },
  { at: () => at(2, -0.15), id: 'mirror_mcu', set: B, cam: (s) => camMirror(s, 'mcu', 0.35) },
  { at: () => at(4, -0.15), id: 'mirror_ms', set: B, cam: (s) => camMirror(s, 'ms', 0.45) },
  { at: () => at(5, -0.15), id: 'mirror_mcu2', set: B, cam: (s) => camMirror(s, 'mcu', 0.3) },
  { at: () => T.whats() - 0.1, id: 'door_listen', set: H, cam: (s) => fixed(s, V(-10.6, 4.7, 0.3), K.headPos(C.skye).add(V(0, -0.45, 0)), 34) },
  { at: () => T.tap() - 0.45, id: 'tap', set: H, cam: (s) => fixed(s, V(-7.3, 3.8, 2.6), K.headPos(C.skye).lerp(K.headPos(C.lily), 0.5).add(V(0, -0.6, 0)), 50) },
  { at: () => at(9, -0.1), id: 'skye_mcu', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.9 }) },
  { at: () => at(11, -0.1), id: 'two_red', set: H, cam: (s) => fixed(s, V(-7.3, 3.7, 2.4), K.headPos(C.skye).lerp(K.headPos(C.lily), 0.45).add(V(0, -0.3, 0)), 48) },
  { at: () => at(12, -0.1), id: 'skye_dusty', set: H, cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.8 }) },
  { at: () => T.creak(), id: 'girls_beam', set: H, cam: (s) => fixed(s, V(-7.0, 4.3, 4.0), K.headPos(C.skye).lerp(K.headPos(C.lily), 0.4).add(V(0, -0.6, 0)), 44) },
  { at: () => at(13, 0.6), id: 'dad_ms', set: H, cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.4 }) },
  { at: () => at(14, -0.1), id: 'dad_mcu', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.4 }) },
  { at: () => T.spin() + 0.1, id: 'dash', set: H, cam: (s) => fixed(s, V(-15.2, 4.4, 3.8), HO().clone().add(V(-6, 3.6, -1.4)), 52) },
  { at: () => at(15, -0.1), id: 'dad_max', set: H, cam: (s) => fixed(s, V(-3.0, 4.6, 2.2), K.headPos(C.dad).add(V(0, -0.5, 0)), 36) },
  { at: () => at(16, -0.1), id: 'max_bed', set: B, cam: (s) => camMirror(s, 'mcu', 0.9) },
  { at: () => at(17, -0.1), id: 'dad_grown', set: H, cam: (s) => fixed(s, V(-3.0, 4.6, 2.2), K.headPos(C.dad).add(V(0, -0.5, 0)), 36) },
  { at: () => T.hatch(), id: 'dad_walk', set: H, cam: (s) => fixed(s, V(-10.5, 4.4, 2.6), K.headPos(C.dad).add(V(0, -0.8, 0)), 44) },   // ahead of him: he walks toward the lens
  { at: () => T.atHatch(), id: 'dad_hatch', set: H, cam: (s) => fixed(s, V(3.5, 4.5, -1.0), K.headPos(C.dad).lerp(HATCH_C(), 0.3), 55) },   // from his left: the raised broom is on his far side
  { at: () => at(19, -0.12), id: 'gap', set: H, cam: (s) => fixed(s, V(-12.5, 4.4, 1.5), K.headPos(C.skye).lerp(K.headPos(C.lily), 0.4), 36) },
  { at: () => end(20, 0.05), id: 'end', set: H, cam: (s) => fixed(s, V(-1.5, 4.3, 4.3), K.headPos(C.dad).lerp(K.headPos(C.skye), 0.45).add(V(0, -0.5, 0)), 50) },
].map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

const setCam = (stage, id, name) => { const set = K.getSet(id); return K.setCam(stage, set.cams[name], { blockers: [set.group] }); };
const fixed = (stage, pos, target, fov) => K.setCam(stage, { pos: HO().clone().add(pos), target, fov }, { clear: false });
// the mirror's point of view: the camera just in front of the desk mirror, looking back at Max (a slight angle off square)
function camMirror(stage, framing, side = 0.35) {
  const eye = K.headPos(C.max), f = { cu: 2.6, mcu: 3.8, ms: 4.8 }[framing];
  const pos = V(9.9, eye.y + 0.25, eye.z + side * 2), d = pos.distanceTo(eye);
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(f / 2 / d)) * 1.05;
  return K.setCam(stage, { pos, target: eye.clone().add(V(0, -0.12 * f, 0)), fov }, { clear: false });
}

// ---------- arm and head overrides (after the pose; one arm high at most) ----------
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
// fwd: swing forward (rad, 0 hanging, PI/2 straight ahead, <= 2.4); out: away from the body (rad); twist about the arm
function arm(a, side, fwd, out = 0, twist = 0) {
  _e.set(-fwd, twist, side === 'L' ? out : -out, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(_e);
}
function headTurn(a, yaw = 0, pitch = 0, roll = 0) {
  _e.set(-pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e); a.bones.Head.quaternion.multiply(_q);
}
const pulse = (t, t0, d) => (t >= t0 && t < t0 + d ? Math.sin(Math.PI * (t - t0) / d) : 0);
const ramp = (t, t0, d) => smooth((t - t0) / d);
const lerpA = (a, b, u) => a + (b - a) * u;

// ---------- update ----------
export function update(t, stage) {
  P.dadAim = false;
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  const idle = K.holdClock(t, L, [[0, T.heard() + 0.6], [T.tap() - 1.8, T.tap() + 0.7], [T.creak(), at(13, 1.8)], [T.spin() - 0.3, at(15, 0.4)], [T.hatch() - 0.2, T.atHatch() + 0.5]]);
  const o = set.group.position;
  if (sh.set === H) K.setLine(V(o.x - 20, 4, o.z + 0.5), V(o.x + 14, 4, o.z + 0.5), 1); else K.clearLine();
  let linen = 0;
  if (sh.set === H) linen = hallway(t, idle, sh); else bedroom(t, idle, sh);
  if (sh.set === H) set.setLinen?.(linen);
  K.setBlockers(set.group, ...Object.values(cast()).filter((a) => a.root.visible));
  const pr = sh.set === H
    ? { moon_window: t >= T.creak() ? 0.65 : 1, under_door: true, nightlight: true, linen_fill: false }
    : { bedside_lamp: true, desk_lamp: true, moon_window: 1.2 };
  K.applyLight(stage, 'night_moon', { set, practicals: pr });
  sh.cam(stage, t);
  beams(t, sh);
}

// ---------- Max's room: rehearsing to the mirror (well back from the desk, one-arm gestures) ----------
function bedroom(t, idle, sh) {
  K.only(C, ['max']);
  const m = M.mirror(), mx = C.max;
  let face = 'nervous';
  K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m);
  if (t < at(3)) {                                    // "Hey. So. Do you want to go to the Halloween dance with me?"
    const neck = ramp(t, at(2) - 0.1, 0.3) * (1 - ramp(t, wordT(2, 8), 0.3));   // right hand to the back of his neck
    const offer = ramp(t, wordT(2, 9), 0.3);                                     // then a small palm-up offer, chest height
    if (neck > 0.01) K.gesture(mx, 'hand_on_neck', 'R', neck);
    if (offer > 0.01) K.gesture(mx, 'hold_out', 'R', offer * 0.8);
  } else if (t < at(4)) {                             // "No. Too serious." head shake
    headTurn(mx, 0.3 * Math.sin((t - at(3)) * 14) * pulse(t, at(3), 0.8)); face = 'annoyed';
  } else if (t < at(5)) {                             // "Yo! Dance? You? Me? Ugh. No."
    face = 'happy';
    const you = wordT(4, 2), me = wordT(4, 3), ugh = wordT(4, 4);
    if (t >= you - 0.12 && t < me - 0.06) arm(mx, 'R', 0.75 * ramp(t, you - 0.12, 0.12), -1.0 * ramp(t, you - 0.12, 0.12));   // finger-gun at his reflection, out to the side (not into the lens)
    else if (t >= me - 0.06 && t < ugh - 0.06) K.gesture(mx, 'thumb_to_chest', 'R', ramp(t, me - 0.06, 0.12));
    if (t >= ugh - 0.06) { K.gesture(mx, 'eye_wipe', 'R', ramp(t, ugh - 0.06, 0.15)); face = 'annoyed'; }   // facepalm: hand to his face
  } else if (sh.id !== 'max_bed') {                   // "Okay. This weekend, I just ask her..." squares up, a nod
    face = 'determined'; headTurn(mx, 0, -0.12 * pulse(t, wordT(5, 3), 0.5));
  } else {                                            // "Go to bed, Dad!" turned 3/4 toward his door
    K.putOn(mx, { pos: m.pos, heading: 0.3 }); face = 'annoyed';
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
  const door = M.door(), hide = T.hide(), wh = { whisper: true };
  let linen = 0;

  // --- Skye ---
  let skFace = 'scheming', chin = 1;                  // chin: 1 = flashlight under her chin, 0 = lowered
  if (t < hide) {
    const cr = M.creep(), via = hw(-6.4, -1.4, -Math.PI / 2), sp = 3.2, arrive = 3.0;   // along the middle of the hall (clear of the side table), then in to the door
    const t0 = arrive - (cr.pos.distanceTo(via.pos) + via.pos.distanceTo(door.pos)) / sp;
    const m = run2(sk, cr, via, door, t0, t, sp);
    if (m.moving) { const d = K.posture(sk, K.gait('creep', m.anim)); sk.root.position.y -= d || 0; }
    if (m.done) {
      let h = lerpA(Math.atan2(door.pos.x - via.pos.x, door.pos.z - via.pos.z), door.heading, ramp(t, arrive, 0.3));             // turns to the lens over ~9 frames
      if (t >= T.tap()) h = lerpA(door.heading, M.doorTurn, ramp(t, T.tap() + 0.25, 0.35));   // round to Lily
      if (t >= T.creak()) h = lerpA(M.doorTurn, M.toDad, ramp(t, T.creak() + 0.1, 0.3));
      K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, { pos: door.pos, heading: h });
      const lean = ramp(t, T.heard() - 0.1, 0.35) * (1 - ramp(t, at(6, 0.05), 0.3));   // ear to the door on "heard"
      if (lean > 0.01) K.posture(sk, 'ear_to_door', { mix: lean });
      if (t >= at(10) && t < at(11, -0.1)) K.posture(sk, 'arms_folded', { mix: ramp(t, at(10), 0.25) });   // "I do not like him"
    }
    if (t < T.heard()) skFace = 'scheming';
    else if (t < at(5)) skFace = 'surprised';
    else if (t < at(7)) skFace = 'suspicious';
    else if (t < T.tap()) skFace = 'annoyed';
    else if (t < at(9)) skFace = 'shocked';
    else if (t < at(12)) skFace = 'annoyed';
    else if (t < T.creak()) skFace = 'nervous';
    else skFace = 'scared';
    const jolt = pulse(t, T.tap() + 0.02, 0.45);      // the jump at Lily's tap: a hop, her left hand to her mouth
    if (jolt > 0) { sk.root.position.y += 0.4 * jolt; K.gesture(sk, 'hand_over_mouth', 'L', jolt); }
    if (t >= T.tap()) chin = 1 - ramp(t, T.tap(), 0.25);   // the torch drops from her chin when she jumps
    if (t >= at(12) && t < T.creak()) {               // "up there": the left arm points up at the attic
      const u = pulse(t, wordT(12, 2) - 0.15, 1.3);
      if (u > 0) K.gesture(sk, 'point_up', 'L', u);
    }
    K.blush(sk, t >= at(11) && t < T.creak() ? 1 : 0);   // "Then why is your face all red?"
  } else {                                            // the dash behind Dad's back into the linen closet
    const m = run2(sk, { pos: door.pos, heading: M.toDad }, M.skyeVia(), M.linenSkye(), hide + 0.32, t);
    if (m.moving) K.gesture(sk, 'reach_up', 'L', 0.5);   // her hand out to Lily's
    if (m.done) { K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, M.linenSkye()); }
    skFace = 'scared'; chin = 0; K.blush(sk, 0);
    linen = t < hide + 1.05 ? 0.7 * ramp(t, hide + 0.15, 0.25) : 0.7 - 0.36 * ramp(t, hide + 1.05, 0.4);   // open, in, pulled to a crack (0.34)
  }
  K.speak(sk, skFace, t, L.said('SKYE'), wh);
  P.torchSkye.userData.chin = chin;
  if (chin > 0.02) K.gesture(sk, 'flashlight_chin', 'R', chin * 0.85);   // the lit torch held under her chin
  K.hold(P.torchSkye, sk, 'R', 'palm', chin > 0.5 ? { aim: K.facePoint(sk).add(V(0, 0.6, 0)) } : {});

  // --- Lily ---
  if (lilyOn) {
    let lfFace = 'neutral';
    const lm = M.lily();
    if (t < hide) {
      const st = M.lilyStart(), arrive = T.tap() - 0.15;
      const m = K.walk(li, A, st, lm, arrive - st.pos.distanceTo(lm.pos) / 8, t, { speed: 8, idleAt: idle, endHeading: lm.heading });
      if (m.done) {
        let h = lm.heading;
        if (t >= T.creak()) h = lerpA(lm.heading, M.toDad, ramp(t, T.creak() + 0.2, 0.35));   // turns to the beam
        K.playAnim(li, [[A.idle, idle]]); K.putOn(li, { pos: lm.pos, heading: h });
        const tap = pulse(t, T.tap() - 0.12, 0.5);
        if (tap > 0) K.gesture(li, 'tap', 'L', 0.65 * tap);   // a short reach to Skye's elbow
        if (t >= at(11) && t < at(12)) K.gesture(li, 'point', 'L', ramp(t, wordT(11, 1), 0.2));   // points up at Skye's red face
        if (t < T.creak()) headTurn(li, 0, 0.22);      // looking up at Skye
      }
      if (t >= at(8, -0.2)) lfFace = 'smug';
      if (t >= T.creak()) lfFace = 'surprised';
    } else {                                          // she leads the way into the closet
      const m = run2(li, { pos: lm.pos, heading: M.toDad }, hw(-9.5, 1.8, -Math.PI / 2), M.linenLily(), hide, t);   // on the camera side of Skye, then along the hall
      if (m.moving) K.gesture(li, 'hand_hold', 'L', 1);   // reaching back for Skye's hand
      if (m.done) { K.playAnim(li, [[A.idle, idle]]); K.putOn(li, M.linenLily()); }
      lfFace = 'nervous';
    }
    K.speak(li, lfFace, t, L.said('LILY'), wh);
  }

  // --- Dad ---
  if (dadOn) {
    let dFace = 'nervous', broomUp = 0, torch = 0.5;   // torch: arm forward amount (low by default)
    const st = M.stairs(), mid = M.dadMid(), hm = M.hatch();
    const toDoor = K.faceTo(mid, K.mark('hallway', 'max_door'));
    if (t < T.hatch()) {
      const m = K.walk(dd, A, st, mid, T.creak() + 0.15, t, { speed: 5, idleAt: idle, endHeading: mid.heading });
      if (m.done) {
        // on the +0.6 pause he spins round to a creak on the stairs (behind him), then back to Max's door
        const back = Math.PI / 2 + 0.25;
        let h = mid.heading;
        if (t >= T.spin()) h = lerpA(mid.heading, back, ramp(t, T.spin(), 0.3));
        if (t >= at(15, -0.35)) h = lerpA(back, toDoor, ramp(t, at(15, -0.35), 0.35));   // turns back via the lens side
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, { pos: mid.pos, heading: h });
      }
      dFace = t < at(13, 1.6) ? 'nervous' : t < T.spin() ? 'determined' : t < at(15) ? 'surprised' : t < at(17) ? 'suspicious' : 'smug';
      if (t >= wordT(14, 13) && t < T.spin()) broomUp = ramp(t, wordT(14, 13), 0.25);   // "draw the line"
      if (t >= T.spin() && t < at(15)) torch = 0.9;    // beam on the stairs
      if (t >= at(15) - 0.1 && t < T.hatch()) torch = 0.8;   // beam on Max's door
      if (t >= at(17) && t < T.hatch()) headTurn(dd, 0, 0.15 * ramp(t, at(17), 0.3));   // chin up
    } else {                                          // under the hatch, past it, then round to face it
      const pre = { pos: mid.pos, heading: toDoor };
      const m = K.walk(dd, A, pre, hm, T.hatch(), t, { speed: 9, idleAt: idle, endHeading: hm.heading });
      if (m.done) {
        const walkH = Math.atan2(hm.pos.x - mid.pos.x, hm.pos.z - mid.pos.z);
        const u = ramp(t, m.arrive, 0.4);
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, { pos: hm.pos, heading: lerpA(walkH, hm.heading, u) });   // turns round via the lens side
        const up = ramp(t, m.arrive + 0.3, 0.35);
        headTurn(dd, 0, 0.42 * up); broomUp = up; torch = 1.1 * up + 0.5 * (1 - up); P.dadAim = up > 0.5;
      }
      dFace = 'determined';
    }
    // broom in his right hand, bristles forward; raised up beside his head (out to the side, clear of the face) on the beats
    arm(dd, 'R', 0.9 + 1.4 * broomUp, 0.15 + 0.35 * broomUp, 0);
    K.hold(P.broom, dd, 'R', 'palm', broomUp > 0.5 ? {} : { aim: K.headPos(dd).add(V(Math.sin(dd.root.rotation.y) * 6, 1.5, Math.cos(dd.root.rotation.y) * 6)) });
    arm(dd, 'L', torch, 0.1, 0);                     // torch low in his left hand
    K.hold(P.torchDad, dd, 'L', 'palm', P.dadAim ? { aim: HATCH_C() } : {});
    K.speak(dd, dFace, t, L.said('DAD'));
  }
  return linen;
}

// ---------- practicals: flashlight beams ----------
const _p = V(0, 0, 0), _d = V(0, 0, 0);
function handPos(a, side, out) { a.root.updateMatrixWorld(true); return a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].localToWorld(out.set(side === 'R' ? -0.5 : 0.5, -1.9, 0).multiplyScalar(1)); }
function beams(t, sh) {
  if (sh.set !== H) { beamSkye.set(false); beamDad.set(false); lilyGlow.set(false); return; }
  const sk = C.skye, chin = P.torchSkye.userData.chin ?? 0;
  const low = t >= T.tap() && t < T.creak();       // torch lowered, still lit: a dim glow on her face while she talks to Lily
  const closet = t >= T.hide() + 1.0;             // in the closet: her torch, covered by her fingers, a faint glow on both faces
  beamSkye.set(sk.root.visible && chin > 0.05 ? 0.28 * Math.max(chin, 0.6) : low ? 0.16 : closet ? 0.14 : false, sk);
  lilyGlow.set(closet && C.lily.root.visible ? 0.12 : false, C.lily);
  if (C.dad.root.visible) {
    const a = C.dad; handPos(a, 'L', _p);
    const s0 = a.bones['Arm.L'].localToWorld(V(0.5, 0, 0)); _d.copy(_p).sub(s0).normalize();   // along the arm
    if (t < at(13)) { const sw = Math.sin((t - T.creak()) * 2.2) * 0.6; _d.applyAxisAngle(V(0, 1, 0), sw); }  // the beam swings in
    if (t >= T.spin() && t < at(15)) _d.copy(STAIRS_C()).sub(_p).normalize();     // at the noise on the stairs
    if (P.dadAim) _d.copy(HATCH_C()).sub(_p).normalize();                         // up at the hatch
    beamDad.set(true, _p.clone(), _d.clone());
  } else beamDad.set(false);
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// moments for web/ch06_hold.js
export const HOLD_TIMES = {
  creep: 1.2, listen: at(6, 0.2), lowered: at(10, 0.3), lily: at(8, 0.3), closet: at(20, 0.2),
  dadWalk: at(13, 0.8), line: end(14, -0.2), hatch: end(20, 0.3),
};
