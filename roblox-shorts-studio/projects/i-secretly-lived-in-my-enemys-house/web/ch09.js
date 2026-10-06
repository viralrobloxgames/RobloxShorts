// Chapter 9, "The Drawing" (SATURDAY 2:20 PM). The attic on Saturday afternoon: Skye cuts eye holes in Dad's good sheet
// in her nest while Lily rocks on the rocking chair; Dad calls up from below; Skye opens MAX - OLD STUFF for glow sticks
// and finds Max's kindergarten drawing (ME AND SKYE. BEST FRENDS.); the sandcastle story; she puts it back, picks up the
// sheet, "Yes." / "You're both so dumb." / Dad again / "Ghost!". Shot plan: production/shots/ch09.md.
// Seams (source/boundary_sheet.md): first frame = Ch8|Ch9 "Start of Ch9", last frame = Ch9|Ch10 "End of Ch9".
// Everything is a pure function of t.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 9;
const CARD = { day: 'SATURDAY', time: '2:20 PM' };
// Estimated lines until audio/chapters/ch09/lines.json lands (same index numbering: spoken lines in script order).
const EST = [
  ['VO', 'Saturday. Everyone was home all day, and I had one job. Make the scariest ghost in history.', 0.0, 5.4],
  ['SKYE', 'Step one, eye holes. Step two, glow sticks. Step three, revenge.', 5.7, 10.3],
  ['LILY', "That's Dad's good sheet.", 10.6, 12.0],
  ['SKYE', "Ghosts don't use bad sheets.", 12.3, 14.0],
  ['DAD', 'Has anyone seen my good sheet?', 14.35, 16.3, 'offscreen, below'],
  ['LILY', 'No, Dad!', 16.6, 17.4],
  ['SKYE', 'I need more glow sticks. Where does Max keep his old stuff?', 17.75, 21.1],
  ['LILY', "In that box. But nobody's allowed to touch it.", 21.4, 24.0],
  ['SKYE', 'What is this?', 25.1, 25.9],                                  // after the [+0.8] action
  ['SKYE', 'Me and Skye. Best friends. He spelled friends wrong.', 26.15, 29.6],
  ['LILY', 'He drew it in kindergarten. He keeps it on top.', 29.9, 32.6],
  ['SKYE', 'He kept it. All this time.', 32.9, 34.7],
  ['LILY', "He looks at it when he's sad.", 35.0, 36.6],
  ['SKYE', 'We were best friends. Then he knocked down my sandcastle, so I knocked down his. And we just never stopped.', 36.9, 43.0],
  ['LILY', 'For seven years?', 43.3, 44.3],
  ['SKYE', 'It was a really good sandcastle.', 44.6, 46.4],
  ['LILY', 'So are you still going to scare him?', 47.95, 49.7],          // after the [+1.2] action
  ['SKYE', 'Yes.', 50.0, 50.5],
  ['LILY', "You're both so dumb.", 50.8, 52.1],
  ['DAD', 'Lily? Why are there pancake crumbs on the attic ladder?', 52.45, 55.6, 'offscreen, below'],
  ['LILY', 'Ghost!', 55.9, 56.6],
].map(([speaker, text, start, end, note], index) => ({ index, speaker, text, start, end, ...(note ? { note } : {}) }));
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.75);
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BASE = L.lines[0]?.index ?? 0;     // lines.json counts spoken lines from 1, EST from 0
const ln = (i) => L.line(i + BASE);
const at = (i, off = 0) => ln(i).start + off;
const endOf = (i, off = 0) => ln(i).end + off;
// start of the k-th word (0-based) of spoken line i (measured words when narrated, else spread evenly)
function wordAt(i, k) {
  const l = ln(i), ws = L.words.filter((w) => w.speaker === l.speaker && w.start >= l.start - 0.05 && w.start < l.end);
  return ws[Math.min(k, ws.length - 1)]?.start ?? l.start;
}
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerpAng = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- key times ----------
const T = {
  standUp: at(6, -0.3),                  // cut: Skye standing by the nest with the sheet
  walk: at(7, 0.55),                      // Skye heads for MAX - OLD STUFF while Lily is still talking
};
T.lidOpen = T.walk + 1.45; T.lidOpened = T.lidOpen + 0.4; T.pick = T.lidOpened + 0.55; T.picked = at(8, -0.05);
T.lilyWalk = at(8, 0.2);                 // Lily gets up and comes over while Skye reads the drawing
T.back = endOf(15, 0.2); T.backDone = T.back + 0.4; T.lidClose = T.backDone + 0.05; T.lidClosed = T.lidClose + 0.3;
T.sheetUp = T.lidClosed; T.sheetUpDone = at(16, 0.3);
T.dad2 = at(19); T.ghost = at(20);
const SPELL = wordAt(9, 6);              // "He spelled friends wrong": back to Skye's face

// ---------- marks (attic, world coords) ----------
const OFF = K.SET_ORIGIN.attic;
const W = (x, z, heading = 0, y = 0) => ({ pos: V(x, y, z).add(OFF), heading });
const M = {
  nest: () => K.mark('attic', 'nest', W(0.2, -7.2, 0)),
  nestStand: () => K.mark('attic', 'nest_stand', W(0.3, -5.6, 0)),
  chair: () => K.mark('attic', 'rocking_chair', W(-8, -4, 0.7)),
  chairFront: () => K.mark('attic', 'rocking_chair_front', W(-6.6, -2.3, 0.7)),
  box: () => K.mark('attic', 'box_max', W(7.6, 6.0, 2.29)),
  lilyBox: () => W(4.4, 5.6, 0.75),      // Lily beside Skye at the box (screen left), both cheated open to the +z camera side
  hatch: () => V(4.5, 1.2, 9.0).add(OFF),
};
const towardXZ = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const SKYE_OPEN = -0.75, LILY_OPEN = 0.75;  // box scene: facing each other, opened to the +z side (camera, hatch)
// box-scene cameras (attic local coords): the two-shot from the hatch side, and the walk/put-back angle
const BOXCAM = { pos: V(5.8, 4.5, 12.4).add(OFF), target: V(6.5, 3.4, 5.6).add(OFF), fov: 40 };
const NESTCAM = { pos: V(-3.0, 4.4, 5.6).add(OFF), target: V(-3.7, 2.0, -5.4).add(OFF), fov: 50 };
// where the drawing is: between Skye's hands (props may not have landed yet)
function handsMid(a) { const l = a.bones['Arm.L'].localToWorld(V(0.5 * a.scale, -1.8 * a.scale, 0)), r = a.bones['Arm.R'].localToWorld(V(-0.5 * a.scale, -1.8 * a.scale, 0)); return l.lerp(r, 0.5); }

// ---------- setup ----------
let C, A, P = {}, attic, CAMS = {};
export async function setup(stage) {
  await K.buildSets(stage, ['attic']);
  attic = K.getSet('attic');
  K.setState({ chapter: 9 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.lily, 'lily_day');
  A = await K.loadAnims(['idle', 'walk', 'run', 'sit', 'point', 'shock']);
  const add = (k, id) => { P[k] = K.makeProp(id); stage.scene.add(P[k]); return P[k]; };
  P.sheetLap = K.makeProp('bedsheet', { state: 'flat', holes: 1 }); P.sheetBunch = K.makeProp('bedsheet', { state: 'bunched' });
  P.sheetHeld = K.makeProp('bedsheet', { state: 'held', holes: 2 });
  for (const k of ['sheetLap', 'sheetBunch', 'sheetHeld']) stage.scene.add(P[k]);
  add('scissors', 'scissors'); add('drawing', 'drawing');
  CAMS = attic.cams || {};
}
export const cast = () => ({ skye: C.skye, lily: C.lily });

// ---------- posing helpers (arm angles on top of the pack animation) ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08, twist = 0) { EUL.set(fwd, twist, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
// arm reaching forward: pitch p (0 down, PI/2 straight ahead), slight inward yaw
function reach(a, sd, p, inward = 0.25) { EUL.set(-p, (sd === 'L' ? -1 : 1) * inward, 0, 'YXZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }   // inward < 0 spreads the hands
function lookHead(a, yaw, pitch = 0) { a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(pitch, yaw, 0, 'YXZ'))); }
// sitting cross-legged on the floor (nest; the blankets are ~0.3 thick)
function floorSit(a, at, heading) {
  const d = K.posture(a, 'sit_cross');
  K.putOn(a, { pos: at.pos, heading }, { sit: true });
  a.root.position.y = at.pos.y + 0.3 - d; a.root.updateMatrixWorld(true);
}
// sitting on the rocking chair: the kit's sit_chair on the seat, rocking with the chair about its base
const _ax = V(), _rq = new THREE.Quaternion();
function chairSit(a, at, heading, seatTop, rock = 0) {
  K.posture(a, 'sit_chair');
  K.putOn(a, { pos: at.pos, heading }, { sit: true });
  a.root.position.y = K.seatY(a, at.pos.y + seatTop);
  if (rock) {
    _ax.set(Math.cos(heading), 0, -Math.sin(heading)); _rq.setFromAxisAngle(_ax, rock);
    const rel = a.root.position.clone().sub(at.pos).applyQuaternion(_rq);
    a.root.position.copy(at.pos).add(rel); a.root.quaternion.premultiply(_rq);
  }
  a.root.updateMatrixWorld(true);
}
const rockAngle = (s, on) => (on ? 0.06 * Math.sin(s * 2.2) : 0);
let ROCK = 0;

// ---------- where everyone is ----------
function skyeAt(s, idle) {
  const sk = C.skye;
  let st = { face: 'determined', sheet: 'lap', scissors: true, drawing: false };
  if (s < T.standUp) {                                     // the nest: cutting eye holes
    floorSit(sk, M.nest(), -0.1);
    const snip = s < at(1) || (s >= at(1) && s < wordAt(1, 3)) ? 0.5 + 0.5 * Math.sin(s * 9) : 0;
    reach(sk, 'R', 1.1 + 0.12 * snip, 0.3); reach(sk, 'L', 1.15, 0.4);
    if (s >= wordAt(1, 3) && s < wordAt(1, 8)) { reach(sk, 'L', 0.6 + 0.4 * smooth(inv(wordAt(1, 3), wordAt(1, 3) + 0.3, s)), 0.6); }   // "glow sticks": a hand towards the bundle
    if (s >= wordAt(1, 8)) reach(sk, 'R', 1.55, 0.15);        // "revenge": scissors up
    st.face = s >= wordAt(1, 8) && s < endOf(1) + 0.3 ? 'scheming' : 'determined';
    if (s >= at(2) && s < at(3)) st.face = 'neutral';
    if (s >= at(3) && s < at(4)) { st.face = 'smug'; reach(sk, 'L', 1.0, 0.4); reach(sk, 'R', 1.0, 0.4); st.scissors = true; }
    if (s >= at(4) - 0.1) { st.face = s < endOf(5) ? 'shocked' : 'nervous'; lookHead(sk, 0.55 * smooth(inv(at(4) - 0.1, at(4) + 0.25, s)), -0.05); }
    return st;
  }
  st.scissors = false;
  if (s < T.walk) {                                        // standing by the nest, the sheet bundled in her arms
    K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, M.nestStand(), { heading: -0.2 });
    st.sheet = 'carry'; st.face = s < at(7) ? 'determined' : 'suspicious';
    if (s >= at(7)) lookHead(sk, -0.5, 0);
    return st;
  }
  const box = M.box(), to = box;
  if (s < T.picked) {                                      // walk to the box, put the sheet down, open the lid, lift the drawing
    const m = K.walk(sk, A, M.nestStand(), to, T.walk, s, { idleAt: idle, endHeading: to.heading });
    st.sheet = m.done && s >= T.lidOpen ? 'floor' : 'carry';
    if (m.done) {
      if (s >= T.lidOpen - 0.2) { const back = smooth(inv(T.lidOpened, T.lidOpened + 0.15, s)) * (1 - smooth(inv(T.pick - 0.2, T.pick, s))); reach(sk, 'L', lerp(1.2, 0.35, back), 0.3); reach(sk, 'R', lerp(1.2, 0.35, back), 0.3); }
      if (s >= T.pick) { st.drawing = s >= T.pick + 0.2; reach(sk, 'L', lerp(1.2, 0.95, inv(T.pick, T.picked, s)), 0.45); reach(sk, 'R', lerp(1.2, 0.95, inv(T.pick, T.picked, s)), 0.45); }
    }
    st.face = s >= T.pick ? 'surprised' : 'determined';
    return st;
  }
  // at the box, turned half to Lily (and the lens)
  const faceLily = SKYE_OPEN;            // turned to Lily, cheated open to the camera side
  let h = lerpAng(box.heading, faceLily, smooth(inv(T.picked - 0.3, T.picked + 0.15, s)));
  st.sheet = 'floor'; st.drawing = true; st.face = 'surprised';
  K.playAnim(sk, [[A.idle, idle]]);
  const hold = s < at(9) || (s >= at(9) && s < SPELL) ? 0.95 : 0.6;   // the drawing up to read it, then lower at her waist
  reach(sk, 'L', hold, 0.45); reach(sk, 'R', hold, 0.45);
  if (s >= at(9)) st.face = s < SPELL ? 'happy' : 'smug';
  if (s >= at(10)) st.face = 'sad';
  if (s >= at(11)) { st.face = 'sad'; }
  if (s >= at(13)) {
    st.face = 'sad';
    const k1 = wordAt(13, 7), k2 = wordAt(13, 12), k3 = wordAt(13, 15);    // "knocked down my sandcastle" / "his"
    if (s >= k1 && s < k3) { st.face = s >= k2 ? 'annoyed' : 'sad'; const u = smooth(inv(k1, k1 + 0.35, s)) * (1 - smooth(inv(k3 - 0.3, k3, s))); setArm(sk, 'L', lerp(0.2, 1.3, u), lerp(0.08, 0.9, u)); st.oneHand = true; }
  }
  if (s >= at(14)) st.face = 'neutral';
  if (s >= at(15)) st.face = 'smug';
  if (s >= endOf(15)) {                                    // the long look, the drawing back on top, the lid, the sheet
    st.face = 'sad';
    h = lerpAng(h, box.heading, smooth(inv(T.back, T.back + 0.25, s)));
    if (s >= T.back) { const u = inv(T.back, T.backDone, s); reach(sk, 'L', lerp(0.6, 1.25, u), 0.45); reach(sk, 'R', lerp(0.6, 1.25, u), 0.45); st.drawing = s < T.backDone; }
    if (s >= T.backDone) { reach(sk, 'L', 1.2, 0.3); reach(sk, 'R', 1.2, 0.3); }
    if (s >= T.sheetUp) { st.face = 'determined'; const u = smooth(inv(T.sheetUp, T.sheetUpDone, s)); st.sheet = u > 0.25 ? 'open' : 'floor'; h = lerpAng(box.heading, faceLily, u); reach(sk, 'L', lerp(1.2, 1.15, u), lerp(0.3, -0.3, u)); reach(sk, 'R', lerp(1.2, 1.15, u), lerp(0.3, -0.3, u)); }
  }
  if (s >= at(16)) { st.sheet = 'open'; st.face = 'determined'; reach(sk, 'L', 1.15, -0.3); reach(sk, 'R', 1.15, -0.3); }
  if (s >= at(18)) st.face = 'smug';
  if (s >= T.dad2 - 0.1) { st.face = s < T.ghost ? 'shocked' : 'determined'; h = lerpAng(h, towardXZ(box.pos, M.hatch()), 0.5 * smooth(inv(T.dad2 - 0.1, T.dad2 + 0.3, s))); }
  K.putOn(sk, { pos: box.pos, heading: h });
  return st;
}
function lilyAt(s, idle) {
  const li = C.lily;
  let st = { face: 'annoyed' };
  const ch = M.chair();
  if (s < T.lilyWalk) {                                    // on the rocking chair
    const seatY = 1.65;
    const rocking = s < at(2) || (s > endOf(7) && s < T.lilyWalk);
    ROCK = rockAngle(idle, rocking && s < at(2)); chairSit(li, ch, ch.heading, seatY, ROCK);
    if (s >= at(2) && s < endOf(2) + 0.2) { K.gesture(li, 'point', 'L', smooth(inv(at(2), at(2) + 0.25, s))); lookHead(li, 0.25, 0); }  // points at the sheet
    if (s >= at(4) - 0.1) { st.face = s < at(5) ? 'shocked' : s < endOf(5) + 0.2 ? 'shouting' : 'annoyed'; lookHead(li, -0.5 * smooth(inv(at(4) - 0.1, at(4) + 0.25, s)), -0.08); }
    if (s >= at(5) && s < endOf(5) + 0.1) { li.root.position.add(V(Math.sin(ch.heading), 0, Math.cos(ch.heading)).multiplyScalar(0.25)); }
    if (s >= at(6)) { st.face = 'annoyed'; }
    if (s >= at(7)) { st.face = s < wordAt(7, 4) ? 'annoyed' : 'nervous'; if (s < wordAt(7, 4) + 0.4) { K.gesture(li, 'point', 'L', smooth(inv(at(7), at(7) + 0.25, s))); lookHead(li, 0.5, 0); } }
    if (s >= endOf(7)) st.face = 'nervous';
    return st;
  }
  // gets up and comes over to the box; stands beside Skye
  const to = M.lilyBox();
  const m = K.walk(li, A, M.chairFront(), to, T.lilyWalk, s, { idleAt: idle, endHeading: to.heading });
  const skP = M.box().pos;
  if (m.done) K.putOn(li, { pos: to.pos, heading: LILY_OPEN });
  st.face = 'neutral';
  if (s >= at(10)) st.face = 'neutral';
  if (s >= at(12)) st.face = 'sad';
  if (s >= at(14)) st.face = 'suspicious';
  if (s >= at(16)) st.face = 'neutral';
  if (s >= at(18)) st.face = 'annoyed';
  if (s >= T.dad2 - 0.1) {
    st.face = s < T.ghost ? 'shocked' : 'shouting';
    const hh = lerpAng(li.root.rotation.y, towardXZ(to.pos, M.hatch()), smooth(inv(T.dad2 - 0.1, T.dad2 + 0.35, s)));
    K.putOn(li, { pos: to.pos, heading: hh });
  }
  return st;
}

// ---------- props ----------
let HOLES = 1;
function placeProps(sk, s) {
  const root = C.skye.root, h = root.rotation.y, f = V(Math.sin(h), 0, Math.cos(h));
  const mode = sk.sheet;
  for (const k of ['sheetLap', 'sheetBunch', 'sheetHeld']) P[k].visible = false;
  if (mode === 'lap') {                                     // across her crossed legs, eye-hole edge towards her
    const sh = P.sheetLap, holes = s < wordAt(1, 3) ? 1 : 2;
    if (holes !== HOLES) { sh.userData.setHoles(holes); HOLES = holes; }
    if (sh.parent !== root.parent) root.parent.add(sh);
    sh.visible = true; sh.position.copy(root.position).setY(M.nest().pos.y + 1.3).addScaledVector(f, 0.85); sh.rotation.set(0, h + Math.PI, 0);
  } else if (mode === 'carry') { P.sheetBunch.visible = true; K.hold(P.sheetBunch, C.skye, 'R', 'side'); }
  else if (mode === 'open') { P.sheetHeld.visible = true; K.carry2(P.sheetHeld, C.skye); }
  else {                                                    // dropped flat on the floor beside her, left of the box
    const sh = P.sheetLap; if (sh.parent !== root.parent) root.parent.add(sh);
    if (HOLES !== 2) { sh.userData.setHoles(2); HOLES = 2; }
    sh.visible = true; sh.position.copy(M.box().pos).add(V(-1.6, 0.06, -0.6)); sh.rotation.set(0, 0.5, 0); sh.scale.set(0.8, 0.12, 0.8);
  }
  if (mode === 'lap') P.sheetLap.scale.set(1, 1, 1);
  P.scissors.visible = sk.scissors; if (sk.scissors) K.hold(P.scissors, C.skye, 'R');
  P.drawing.visible = sk.drawing; if (sk.drawing) K.carry2(P.drawing, C.skye);
}

// ---------- shots ----------
// Explicit cameras (no auto-clear: each one is checked in the previews). front(a, ...) = in front of actor a's face,
// `ang` off their facing, `d` back, `up` above the head, looking at the head + `look`.
const FIX = (cam) => (s) => K.setCam(s, cam, { clear: false });
function front(a, { d = 5.2, ang = 0, up = 0.2, look = -0.35, fov = 35, heading = null } = {}) {
  return (s) => {
    const head = K.headPos(C[a]), h = (heading ?? C[a].root.rotation.y) + ang;
    K.setCam(s, { pos: head.clone().add(V(Math.sin(h) * d, up, Math.cos(h) * d)), target: head.clone().add(V(0, look, 0)), fov }, { clear: false });
  };
}
const push = (a, b, t0, t1) => (s, t) => K.applyShot(s, K.blendShot(a, b, smooth(inv(t0, t1, t))));
const NEST_TWO = { pos: NESTCAM.pos.clone().lerp(NESTCAM.target, 0.18), target: NESTCAM.target, fov: NESTCAM.fov };
const BOX_TWO = { pos: BOXCAM.pos.clone().lerp(BOXCAM.target, 0.12), target: BOXCAM.target.clone().add(V(0, 0.75, 0)), fov: 40 };
const SHOTS = [
  { line: 0, off: 0, id: 'open', cam: (s, t) => push(NESTCAM, { pos: NESTCAM.pos.clone().lerp(NESTCAM.target, 0.3), target: NESTCAM.target, fov: NESTCAM.fov }, 0, endOf(0))(s, t) },
  { line: 1, off: 0, id: 'skye_steps', cam: front('skye', { ang: -0.45, d: 5.6 }) },
  { line: 2, off: 0, id: 'lily_sheet', cam: front('lily', { ang: 0.25, d: 4.6 }) },
  { line: 3, off: 0, id: 'two_nest', cam: FIX(NEST_TWO) },
  { line: 4, off: 0, id: 'dad_below', cam: (s, t) => push(NEST_TWO, { pos: NEST_TWO.pos.clone().lerp(NEST_TWO.target, 0.2), target: NEST_TWO.target, fov: NEST_TWO.fov }, at(4), at(4) + 0.6)(s, t) },
  { line: 5, off: 0, id: 'lily_nodad', cam: front('lily', { ang: -0.2, d: 4.6 }) },
  { line: 6, off: -0.3, id: 'skye_stand', cam: front('skye', { ang: -0.35, d: 7.5, up: -0.2, look: -1.0, fov: 38 }) },
  { line: 7, off: 0, id: 'lily_box', cam: front('lily', { ang: 0.25, d: 4.6 }) },
  { line: 7, off: 0.55, id: 'skye_walk', cam: FIX(BOXCAM) },
  { line: 7, off: 0, at: () => T.lidOpen - 0.1, id: 'box_insert', cam: FIX({ pos: V(7.0, 5.4, 2.9).add(OFF), target: V(9.2, 1.2, 4.6).add(OFF), fov: 26 }) },   // the flaps open: the drawing on top
  { line: 8, off: -0.05, id: 'skye_what', cam: front('skye', { heading: SKYE_OPEN, ang: 0.3 }) },
  { line: 9, off: 0, id: 'drawing_cu', cam: (s) => { const r = C.skye.root.position, h = C.skye.root.rotation.y, f = V(Math.sin(h), 0, Math.cos(h)); const m = handsMid(C.skye); K.setCam(s, { pos: m.clone().addScaledVector(f, 2.4).add(V(0, 1.6, 0)), target: m.clone().add(V(0, 0.25, 0)), fov: 34 }, { clear: false }); } },
  { line: 9, off: 0, at: () => SPELL - 0.1, id: 'skye_spelled', cam: front('skye', { heading: SKYE_OPEN, ang: 0.3 }) },
  { line: 10, off: 0, id: 'lily_kinder', cam: front('lily', { heading: LILY_OPEN, ang: -0.55, d: 6.2, fov: 25 }) },
  { line: 11, off: 0, id: 'skye_kept', cam: (s, t) => { const u = smooth(inv(at(11), endOf(11) + 0.3, t)); front('skye', { heading: SKYE_OPEN, ang: 0.3, d: lerp(5.2, 3.6, u) })(s); } },
  { line: 12, off: 0, id: 'lily_sad', cam: front('lily', { heading: LILY_OPEN, ang: -0.55, d: 6.2, fov: 25 }) },
  { line: 13, off: 0, id: 'two_sandcastle', cam: FIX(BOX_TWO) },
  { line: 14, off: 0, id: 'lily_seven', cam: front('lily', { heading: LILY_OPEN, ang: -0.55, d: 6.2, fov: 25 }) },
  { line: 15, off: 0, id: 'skye_good', cam: front('skye', { heading: SKYE_OPEN, ang: 0.3 }) },
  { line: 15, off: 0, at: () => T.back - 0.05, id: 'put_back', cam: FIX({ pos: V(7.0, 5.4, 2.9).add(OFF), target: V(9.2, 1.2, 4.6).add(OFF), fov: 38 }) },   // insert: the drawing back on top, the lid
  { line: 16, off: 0, id: 'lily_still', cam: front('lily', { heading: LILY_OPEN, ang: -0.55, d: 6.2, fov: 25 }) },
  { line: 17, off: -0.05, id: 'skye_yes', cam: front('skye', { heading: SKYE_OPEN, ang: 0.3, d: 4.6, up: 0.4 }) },
  { line: 18, off: 0, id: 'two_dumb', cam: FIX(BOX_TWO) },
  { line: 19, off: 0, id: 'two_hatch', cam: FIX(BOXCAM) },
].map((x) => ({ ...x, start: x.at ? x.at() : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- update ----------
let OVL = {};
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet('attic');
  const lid = t < T.lidOpen ? 0 : t < T.lidOpened ? smooth(inv(T.lidOpen, T.lidOpened, t)) : t < T.lidClose ? 1 : 1 - smooth(inv(T.lidClose, T.lidClosed, t));
  const drawingInBox = t < T.pick + 0.2 || t >= T.backDone;
  K.applyLight(stage, 'attic_afternoon', { set });
  K.setBlockers(set.group, C.skye, C.lily);
  K.setLine(C.lily, C.skye, 1);
  K.only(C, ['skye', 'lily']);
  // idle motion while someone speaks and while things move (walks, the lid, the sheet)
  const idle = K.holdClock(t, L, [[T.walk, T.picked], [T.lilyWalk, T.lilyWalk + 2], [T.back - 0.3, T.sheetUpDone]]);
  ROCK = 0;
  const sk = skyeAt(t, idle), li = lilyAt(t, idle + 0.7);
  K.setState({ chapter: 9, maxBox: lid, drawing: drawingInBox ? 'box' : 'none', rock: ROCK });

  K.speak(C.skye, sk.face, t, L.said('SKYE'));
  K.speak(C.lily, li.face, t, L.said('LILY'));
  C.skye.root.updateMatrixWorld(true); C.lily.root.updateMatrixWorld(true);
  placeProps(sk, t);
  sh.cam(stage, t);
  OVL = {};
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }

// held props and their moments, for web/ch09_hold.js: [t, who, hand, what]
export const HOLDS = [
  [at(1, 0.5), 'skye', 'R', 'scissors (nest)'],
  [at(6, 0.5), 'skye', 'R', 'sheet bunched at her side'],
  [at(8, 0.4), 'skye', 'L', 'drawing (carry2, left fist)'],
  [at(8, 0.4), 'skye', 'R', 'drawing (carry2, right fist)'],
  [at(13, 1.0), 'skye', 'R', 'drawing low while she gestures'],
  [at(17, 0.2), 'skye', 'L', 'sheet held open (left fist)'],
  [at(17, 0.2), 'skye', 'R', 'sheet held open (right fist)'],
  [at(2, 0.3), 'lily', 'R', 'teddy on the rocking chair'],
  [at(12, 0.3), 'lily', 'R', 'teddy standing at the box'],
  [at(20, 0.2), 'lily', 'R', 'teddy, last frame'],
];
