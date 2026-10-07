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
T.back = endOf(15, 0.55); T.contact = T.back + 0.65; T.backDone = T.contact + 0.1; T.lidClose = at(16, 0.75); T.lidClosed = T.lidClose + 0.25;   // the flaps close off screen, during Lily's line   // a long look, turn, bend and lay it on top
T.sheetUp = T.lidClosed; T.sheetUpDone = T.sheetUp + 0.6;
T.dad2 = at(19); T.ghost = at(20);
const SPELL = wordAt(9, 6);              // "He spelled friends wrong": back to Skye's face

// ---------- marks (attic, world coords) ----------
const OFF = K.SET_ORIGIN.attic;
const W = (x, z, heading = 0, y = 0) => ({ pos: V(x, y, z).add(OFF), heading });
const M = {
  nest: () => K.mark('attic', 'nest', W(0.2, -7.2, 0)),
  nestStand: () => W(-1.9, -5.4, 0),   // left of the nest_stand mark, out of the window's sun shaft
  chair: () => K.mark('attic', 'rocking_chair', W(-8, -4, 0.7)),
  chairFront: () => K.mark('attic', 'rocking_chair_front', W(-6.6, -2.3, 0.7)),
  box: () => { const m = K.mark('attic', 'box_max', W(7.6, 6.0, 2.29)); m.pos.addScaledVector(V(Math.sin(m.heading), 0, Math.cos(m.heading)), -0.8); return m; },   // 0.8 back from the mark: clear of the open flaps
  lilyBox: () => W(2.9, 6.2, 0.75),      // Lily beside Skye at the box (screen left), both cheated open to the +z camera side
  hatch: () => V(4.5, 1.2, 9.0).add(OFF),
};
const towardXZ = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const SKYE_OPEN = -0.75, LILY_OPEN = 0.5;  // box scene: facing each other, opened to the +z side (camera, hatch)
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
  add('scissors', 'scissors'); add('drawing', 'drawing'); add('glow', 'glow_sticks');
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

// ---------- arm holds (kit angle convention, degrees: x < 0 = forward, y > 0 on the LEFT arm = inward) ----------
const ARMS = (a, l, r = [l[0], -l[1], -l[2]]) => K.posture(a, { 'Arm.L': l, 'Arm.R': r }, { reset: false });
const mixArm = (p, q, u) => p.map((v, i) => v + (q[i] - v) * u);
const LILY_HUG = globalThis.LH ?? [-48, 34, 0];   // both forearms round the teddy on her chest
const CHEST = [-80, 24, 0], WAIST = [-38, 20, 0], DOWN = [-6, 0, -4], BOX_REACH = [-38, 14, 0], FLAPS = [-55, 4, 0];
const SHEET_CHEST = [-84, -8, 0], SHEET_CHIN = [-104, -10, 0], LAP_L = [-34, 30, 0], LAP_R = [-34, -34, 0];
// the drawing lying on top of the contents of MAX - OLD STUFF, art up, its top towards the insert camera's "up"
const BOX_TOP = V(9.2, 1.25, 4.6).add(OFF), BOX_UPDIR = V(-0.24, 0, -0.97).normalize();
const DRAW_IN_BOX = (() => { const x = V(-BOX_UPDIR.z, 0, BOX_UPDIR.x), m = new THREE.Matrix4().makeBasis(x, BOX_UPDIR, V(0, 1, 0)); return { pos: BOX_TOP.clone().addScaledVector(BOX_UPDIR, -0.425), q: new THREE.Quaternion().setFromRotationMatrix(m) }; })();

// ---------- where everyone is ----------
function skyeAt(s, idle) {
  const sk = C.skye;
  let st = { face: 'determined', sheet: 'lap', scissors: 'hand', drawing: 'box' };
  if (s < T.standUp) {                                     // the nest: cutting eye holes in the sheet across her knees
    floorSit(sk, M.nest(), -0.1);
    const cutting = s < wordAt(1, 4);                      // "Step one, eye holes" (snips), then the glow sticks
    const snip = cutting ? Math.sin(s * 9) : 0;
    let L = LAP_L, Rr = mixArm(LAP_R, [-60, -14, 0], 0.5 + 0.5 * snip);
    const g0 = wordAt(1, 6), g1 = endOf(1);                // "glow sticks" ... end of the line: the bundle up in her L palm
    if (s >= g0 - 0.3 && s < g1 + 0.2) { const u = smooth(inv(g0 - 0.3, g0, s)) * (1 - smooth(inv(g1, g1 + 0.2, s))); L = mixArm(LAP_L, [-92, 16, 0], u); st.glow = u > 0.5; }
    if (s >= wordAt(1, 10) - 0.1 && s < endOf(1) + 0.3) Rr = mixArm(Rr, [-100, -10, 0], smooth(inv(wordAt(1, 10) - 0.1, wordAt(1, 10) + 0.15, s)));   // "revenge": scissors up
    ARMS(sk, L, Rr);
    st.face = s >= wordAt(1, 10) && s < endOf(1) + 0.3 ? 'scheming' : 'determined';
    if (s >= at(2) && s < at(3)) st.face = 'neutral';
    if (s >= at(3) && s < at(4)) st.face = 'smug';
    if (s >= at(4) - 0.1) { st.face = s < endOf(5) ? 'shocked' : 'nervous'; lookHead(sk, 0.55 * smooth(inv(at(4) - 0.1, at(4) + 0.25, s)), -0.05); }
    return st;
  }
  st.scissors = 'nest';
  if (s < T.walk) {                                        // standing by the nest, the bunched sheet in her right hand
    K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, M.nestStand(), { heading: -0.2 });
    st.sheet = 'carry'; st.face = 'determined';
    ARMS(sk, DOWN, [-34, -8, 0]);
    const w = wordAt(6, 4);                                // "Where does Max keep his old stuff?": a look round, a hand up
    if (s >= w - 0.2) { const u = smooth(inv(w - 0.2, w + 0.2, s)); st.face = 'suspicious'; lookHead(sk, 0.45 * Math.sin(Math.min(1, inv(w - 0.2, endOf(6), s)) * Math.PI), 0); K.gesture(sk, 'hand_on_hip', 'L', u * (1 - smooth(inv(endOf(6), endOf(6) + 0.3, s)))); }
    if (s >= at(7)) lookHead(sk, -0.5 * smooth(inv(at(7), at(7) + 0.3, s)), 0);
    return st;
  }
  const box = M.box(), to = box;
  if (s < T.picked) {                                      // walk to the box, put the sheet down, open the flaps, lift the drawing
    const m = K.walk(sk, A, M.nestStand(), to, T.walk, s, { idleAt: idle, endHeading: to.heading });
    st.sheet = m.done && s >= T.lidOpen - 0.1 ? 'floor' : 'carry';
    if (!m.done) { K.posture(sk, { 'Arm.R': [-30, -8, 0] }, { reset: false }); return st; }
    let bend = 0, arms = DOWN;
    if (s < T.lidOpened) { const u = smooth(inv(T.lidOpen - 0.35, T.lidOpen, s)); arms = mixArm(DOWN, FLAPS, u); bend = 0.35 * u; }
    else if (s < T.pick - 0.3) { const u = smooth(inv(T.lidOpened, T.lidOpened + 0.2, s)); arms = mixArm(FLAPS, DOWN, u); bend = 0.35 * (1 - u); }
    else if (s < T.pick + 0.15) { const u = smooth(inv(T.pick - 0.3, T.pick, s)); arms = mixArm(DOWN, BOX_REACH, u); bend = u; }   // down to the drawing; contact at T.pick
    else { const u = smooth(inv(T.pick + 0.15, T.pick + 0.6, s)); arms = mixArm(BOX_REACH, CHEST, u); bend = 1 - u; st.drawing = 'hands'; st.lift = u; }   // one continuous lift to her chest
    if (s >= T.pick && s < T.pick + 0.15) st.drawing = 'contact';
    if (bend) K.posture(sk, 'hip_bend', { reset: false, mix: 0.5 * bend });   // a half bend: the open flap is right in front of her
    ARMS(sk, arms);
    st.face = s >= T.pick ? 'surprised' : 'determined';
    if (s >= T.pick + 0.15) { K.putOn(sk, { pos: to.pos, heading: lerpAng(to.heading, SKYE_OPEN, smooth(inv(T.pick + 0.3, T.pick + 0.7, s))) }); }
    return st;
  }
  // at the box, turned half to Lily (and the lens), the drawing at her chest in both hands
  let h = SKYE_OPEN;
  st.sheet = 'floor'; st.drawing = 'hands'; st.face = 'surprised'; st.tilt = -0.45;
  K.playAnim(sk, [[A.idle, idle]]);
  let arms = CHEST, look = 0;
  if (s >= at(9)) st.face = s < SPELL ? 'happy' : 'smug';
  if (s >= SPELL) look = 0.3;                              // "He spelled friends wrong": eyes on it
  if (s >= at(10)) { st.face = 'sad'; look = 0.15; }
  if (s >= at(11)) { st.face = 'sad'; look = s < wordAt(11, 3) ? 0.32 : 0.05; }   // "He kept it." down at it, then up
  if (s >= at(12)) look = 0.2;
  if (s >= at(13)) {
    st.face = 'sad'; look = 0.1;
    const k2 = wordAt(13, 12), k3 = wordAt(13, 15);       // "so I knocked down his": a small shake of the head
    if (s >= k2 && s < k3) { st.face = 'annoyed'; lookHead(sk, 0.12 * Math.sin((s - k2) * 14), 0); }
  }
  if (s >= at(14)) { st.face = 'neutral'; look = 0.1; }
  if (s >= at(15)) { st.face = 'smug'; look = 0.2; }
  if (s >= endOf(15)) {                                    // the long look, then she turns, bends and lays it on top
    st.face = s < T.back - 0.2 ? 'sad' : 'happy'; look = 0.38;
    if (s >= T.back) {
      look = 0.2; st.face = 'sad';
      h = lerpAng(SKYE_OPEN, box.heading, smooth(inv(T.back, T.back + 0.25, s)));
      const u = smooth(inv(T.back + 0.2, T.contact, s)), w = smooth(inv(T.backDone + 0.05, T.backDone + 0.35, s));
      arms = mixArm(mixArm(CHEST, BOX_REACH, u), DOWN, w); K.posture(sk, 'hip_bend', { reset: false, mix: 0.5 * u * (1 - w) });
      st.down = u; st.drawing = s < T.contact ? 'hands' : s < T.backDone ? 'contact' : 'box';
    }
    if (s >= T.lidClose - 0.3 && s < T.sheetUp) { const u = smooth(inv(T.lidClose - 0.3, T.lidClose, s)) * (1 - smooth(inv(T.lidClosed - 0.05, T.lidClosed + 0.1, s))); arms = mixArm(DOWN, FLAPS, u); K.posture(sk, 'hip_bend', { reset: false, mix: 0.35 * u }); }
    if (s >= T.sheetUp) { st.face = 'determined'; const u = smooth(inv(T.sheetUp, T.sheetUpDone, s)); st.sheet = u > 0.4 ? 'open' : 'floor'; h = lerpAng(box.heading, SKYE_OPEN, u); arms = u > 0.4 ? SHEET_CHEST : DOWN; look = 0; }
  }
  if (s >= T.sheetUpDone) { st.sheet = 'open'; st.face = 'determined'; arms = SHEET_CHEST; look = 0; }
  if (s >= at(18)) st.face = 'smug';
  if (s >= T.dad2 - 0.1) {                                 // Dad again: she turns to the hatch, the sheet up under her chin
    st.face = s < T.ghost ? 'shocked' : 'determined'; arms = mixArm(SHEET_CHEST, SHEET_CHIN, smooth(inv(T.dad2, T.dad2 + 0.5, s)));
    h = lerpAng(SKYE_OPEN, towardXZ(box.pos, M.hatch()), 0.5 * smooth(inv(T.dad2 - 0.1, T.dad2 + 0.3, s)));
  }
  ARMS(sk, arms);
  if (look) lookHead(sk, 0, look);
  K.putOn(sk, { pos: box.pos, heading: h });
  return st;
}
function lilyAt(s, idle) {
  const li = C.lily;
  let st = { face: 'annoyed' };
  const ch = M.chair();
  if (s < T.lilyWalk) {                                    // on the rocking chair, the teddy hugged in her lap, feet towards the floor
    const rocking = s < at(2) || (s > endOf(7) && s < T.lilyWalk);
    ROCK = rockAngle(idle, rocking && s < at(2)); chairSit(li, ch, ch.heading, 2.05, ROCK);   // seat top 1.65 + the cushion, thighs on it
    K.posture(li, { 'Leg.L': [-58, 0, -3], 'Leg.R': [-58, 0, 3] }, { reset: false });
    ARMS(li, LILY_HUG);
    if (s >= at(2) && s < endOf(2) + 0.2) { K.gesture(li, 'point', 'L', smooth(inv(at(2), at(2) + 0.25, s))); lookHead(li, 0.25, 0); }  // points at the sheet
    if (s >= at(4) - 0.1) { st.face = s < at(5) ? 'shocked' : s < endOf(5) + 0.2 ? 'shouting' : 'annoyed'; lookHead(li, -0.5 * smooth(inv(at(4) - 0.1, at(4) + 0.25, s)), -0.08); }
    if (s >= at(6)) { st.face = 'annoyed'; }
    if (s >= at(7)) { st.face = s < wordAt(7, 4) ? 'annoyed' : 'nervous'; if (s < wordAt(7, 4) + 0.4) { K.gesture(li, 'point', 'L', smooth(inv(at(7), at(7) + 0.25, s))); lookHead(li, 0.5, 0); } }
    if (s >= endOf(7)) st.face = 'nervous';
    return st;
  }
  // gets up and comes over to the box; stands beside Skye, the teddy hugged
  const to = M.lilyBox();
  const m = K.walk(li, A, M.chairFront(), to, T.lilyWalk, s, { idleAt: idle, endHeading: to.heading });
  if (m.done) K.putOn(li, { pos: to.pos, heading: LILY_OPEN });
  ARMS(li, LILY_HUG);
  st.face = 'neutral';
  if (m.done && s >= at(13) && s < at(14)) lookHead(li, 0.35, 0.15);   // the sandcastle story: looking at the drawing in Skye's hands
  if (s >= at(12)) st.face = 'sad';
  if (s >= at(14)) st.face = 'suspicious';
  if (s >= at(16)) st.face = 'neutral';
  if (s >= at(18)) st.face = 'annoyed';
  if (s >= T.dad2 - 0.1) {
    st.face = s < T.ghost ? 'shocked' : 'shouting';
    const hh = lerpAng(LILY_OPEN, towardXZ(to.pos, M.hatch()), smooth(inv(T.dad2 - 0.1, T.dad2 + 0.35, s)));
    K.putOn(li, { pos: to.pos, heading: hh });
    ARMS(li, LILY_HUG);
  }
  return st;
}

// ---------- props ----------
let HOLES = 1;
const _wp = V(), _wq = new THREE.Quaternion();
function placeProps(sk, s) {
  const root = C.skye.root, h = root.rotation.y, f = V(Math.sin(h), 0, Math.cos(h)), world = root.parent;
  const mode = sk.sheet;
  for (const k of ['sheetLap', 'sheetBunch', 'sheetHeld']) P[k].visible = false;
  if (mode === 'lap') {                                     // draped across her crossed legs, eye-hole edge towards her
    const sh = P.sheetLap, holes = s < wordAt(1, 3) ? 1 : 2;
    if (holes !== HOLES) { sh.userData.setHoles(holes); HOLES = holes; }
    if (sh.parent !== world) world.add(sh);
    sh.visible = true; sh.scale.set(0.95, 0.14, 0.9);   // a soft drape, not a box
    sh.position.copy(root.position).setY(M.nest().pos.y + 1.38).addScaledVector(f, 0.8); sh.rotation.set(0, h + Math.PI, 0);
  } else if (mode === 'carry') { P.sheetBunch.visible = true; K.hold(P.sheetBunch, C.skye, 'R', 'palm'); }
  else if (mode === 'open') { P.sheetHeld.visible = true; K.carry2(P.sheetHeld, C.skye); }
  else {                                                    // dropped flat on the floor beside her, left of the box
    const sh = P.sheetLap; if (sh.parent !== world) world.add(sh);
    if (HOLES !== 2) { sh.userData.setHoles(2); HOLES = 2; }
    sh.visible = true; sh.position.copy(M.box().pos).add(V(-1.6, 0.06, -0.6)); sh.rotation.set(0, 0.5, 0); sh.scale.set(0.8, 0.12, 0.8);
  }
  // scissors: in her right palm while she cuts, then left on the blanket in the nest
  P.scissors.visible = true;
  if (sk.scissors === 'hand') K.hold(P.scissors, C.skye, 'R');
  else { if (P.scissors.parent !== world) world.add(P.scissors); P.scissors.position.copy(M.nest().pos).add(V(1.1, 0.34, 0.9)); P.scissors.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.6)); P.scissors.scale.setScalar(1); }
  P.glow.visible = !!sk.glow; if (sk.glow) K.hold(P.glow, C.skye, 'L', 'palm', { scale: 1.25 });
  // the drawing: in the box (art up), in her hands (carry2 at her chest), or blending between the two at the contacts
  const d = P.drawing; d.visible = true;
  const inBox = () => { if (d.parent !== world) world.add(d); d.position.copy(DRAW_IN_BOX.pos); d.quaternion.copy(DRAW_IN_BOX.q); d.scale.setScalar(1); };
  if (sk.drawing === 'box') inBox();
  else {
    K.carry2(d, C.skye, { tilt: sk.tilt ?? 0, at: (sk.tilt ?? 0) < 0 ? 'out' : 'palm' });
    let k = 0;                                              // how far the drawing still is from her hands, towards its place in the box
    if (s < T.picked) k = sk.drawing === 'contact' ? 1 : 1 - (sk.lift ?? 1);
    else if (sk.drawing === 'contact') k = 1;
    else if (sk.down != null) k = sk.down;
    if (k > 0) { d.position.lerp(DRAW_IN_BOX.pos, k); d.quaternion.slerp(DRAW_IN_BOX.q, k); }
  }
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
// Lily at the box: from the hatch side, clear of Skye's arms
const LILY_BOX = (s) => { const h = K.headPos(C.lily); K.setCam(s, { pos: h.clone().add(V(1.7, 0.1, 4.6)), target: h.clone().add(V(-0.7, -0.45, 0)), fov: 24 }, { clear: false }); };
// inserts into MAX - OLD STUFF from above its left side (Skye reaches in from the right edge)
const INSERT = { pos: V(9.9, 5.0, 7.4).add(OFF), target: V(9.2, 1.25, 4.6).add(OFF), fov: 22 };   // level, from Skye's side: her forearms come in at the bottom edge
// her reach into the box, side on (from her actual head and heading; SIDE_ANG picks the side)
const SIDE_ANG = 0.9;   // side on, her face readable, the box in front of her
const SIDE = (s) => front('skye', { heading: M.box().heading, ang: SIDE_ANG, d: 7.5, up: 0.6, look: -1.9, fov: 42 })(s);
const INSERT_WIDE = { pos: V(9.9, 5.0, 7.4).add(OFF), target: V(9.1, 1.4, 4.75).add(OFF), fov: 27 };
const push = (a, b, t0, t1) => (s, t) => K.applyShot(s, K.blendShot(a, b, smooth(inv(t0, t1, t))));
const NEST_TWO = { pos: NESTCAM.pos.clone().lerp(NESTCAM.target, 0.18), target: NESTCAM.target, fov: NESTCAM.fov };
const BOX_TWO = { pos: BOXCAM.pos.clone().lerp(BOXCAM.target, 0.12), target: BOXCAM.target.clone().add(V(0, 0.75, 0)), fov: 40 };
const SHOTS = [
  { line: 0, off: 0, id: 'open', cam: (s, t) => push(NESTCAM, { pos: NESTCAM.pos.clone().lerp(NESTCAM.target, 0.3), target: NESTCAM.target, fov: NESTCAM.fov }, 0, endOf(0))(s, t) },
  { line: 1, off: 0, id: 'skye_steps', cam: front('skye', { ang: -0.45, d: 7.8, up: 0.4, look: -1.05 }) },
  { line: 2, off: 0, id: 'lily_sheet', cam: front('lily', { ang: 0.25, d: 4.6 }) },
  { line: 3, off: 0, id: 'two_nest', cam: FIX(NEST_TWO) },
  { line: 4, off: 0, id: 'dad_below', cam: (s, t) => push(NEST_TWO, { pos: NEST_TWO.pos.clone().lerp(NEST_TWO.target, 0.2), target: NEST_TWO.target, fov: NEST_TWO.fov }, at(4), at(4) + 0.6)(s, t) },
  { line: 5, off: 0, id: 'lily_nodad', cam: front('lily', { ang: -0.2, d: 4.6 }) },
  { line: 6, off: -0.3, id: 'skye_stand', cam: front('skye', { ang: -0.35, d: 7.5, up: 0.9, look: -1.3, fov: 36 }) },
  { line: 7, off: 0, id: 'lily_box', cam: front('lily', { ang: 0.25, d: 4.6 }) },
  { line: 7, off: 0, at: () => wordAt(7, 3) - 0.05, id: 'skye_walk', cam: FIX(BOXCAM) },
  { line: 7, off: 0, at: () => T.lidOpen + 0.3, id: 'box_insert', cam: FIX(INSERT) },   // the flaps open: the drawing on top
  { line: 7, off: 0, at: () => T.pick - 0.35, id: 'pick_side', cam: SIDE },
  { line: 8, off: 0, at: () => T.pick + 0.4, id: 'skye_what', cam: front('skye', { heading: SKYE_OPEN, ang: 0.6, d: 6.2, look: -0.9 }) },
  { line: 9, off: 0, id: 'drawing_cu', cam: (s) => { const r = C.skye.root.position, h = C.skye.root.rotation.y, f = V(Math.sin(h), 0, Math.cos(h)); const m = handsMid(C.skye); K.setCam(s, { pos: m.clone().addScaledVector(f, 2.4).add(V(0, 1.6, 0)), target: m.clone().add(V(0, 0.25, 0)), fov: 34 }, { clear: false }); } },
  { line: 9, off: 0, at: () => SPELL - 0.1, id: 'skye_spelled', cam: front('skye', { heading: SKYE_OPEN, ang: 0.6, d: 5.8, look: -0.75 }) },
  { line: 10, off: 0, id: 'lily_kinder', cam: LILY_BOX },
  { line: 11, off: 0, id: 'skye_kept', cam: (s, t) => { const u = smooth(inv(at(11), endOf(11) + 0.3, t)); front('skye', { heading: SKYE_OPEN, ang: 0.6, d: lerp(6.0, 4.8, u), look: -0.75 })(s); } },
  { line: 12, off: 0, id: 'lily_sad', cam: LILY_BOX },
  { line: 13, off: 0, id: 'two_sandcastle', cam: FIX({ pos: V(5.4, 3.9, 12.6).add(OFF), target: V(6.1, 3.2, 5.6).add(OFF), fov: 40 }) },
  { line: 14, off: 0, id: 'lily_seven', cam: LILY_BOX },
  { line: 15, off: 0, id: 'skye_good', cam: front('skye', { heading: SKYE_OPEN, ang: 0.6, d: 5.8, look: -0.75 }) },
  { line: 15, off: 0, at: () => endOf(15, 0.05), id: 'look_cu', cam: front('skye', { heading: SKYE_OPEN, ang: 0.6, d: 5.6, look: -0.85 }) },
  { line: 15, off: 0, at: () => T.back, id: 'put_side', cam: SIDE },
  { line: 15, off: 0, at: () => T.backDone + 0.3, id: 'put_back', cam: FIX(INSERT_WIDE) },   // insert: the drawing back on top, the lid
  { line: 16, off: 0.6, id: 'lily_still', cam: LILY_BOX },
  { line: 17, off: -0.05, id: 'skye_yes', cam: front('skye', { heading: SKYE_OPEN, ang: 0.6, d: 6.2, look: -0.8 }) },
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
  K.applyLight(stage, 'attic_afternoon', { set });
  K.setBlockers(set.group, C.skye, C.lily);
  K.setLine(C.lily, C.skye, 1);
  K.only(C, ['skye', 'lily']);
  // idle motion while someone speaks and while things move (walks, the lid, the sheet)
  const idle = K.holdClock(t, L, [[T.walk, T.picked], [T.lilyWalk, T.lilyWalk + 2], [T.back, T.sheetUpDone]]);
  ROCK = 0;
  const sk = skyeAt(t, idle), li = lilyAt(t, idle + 0.7);
  K.setState({ chapter: 9, maxBox: lid, drawing: 'none', rock: ROCK, glowSticks: !sk.glow });   // the drawing is the kit prop, placed by placeProps

  K.speak(C.skye, sk.face, t, L.said('SKYE'), { whisper: true });   // mouth only, the expression held per phrase
  K.holdTeddy(C.lily, 'hug');
  const shout = (t >= at(5) && t < endOf(5)) || t >= at(20);
  K.speak(C.lily, li.face, t, L.said('LILY'), { whisper: !shout });
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
  [at(13, 1.0), 'skye', 'L', 'drawing at her chest in the sandcastle story'],
  [at(17, 0.2), 'skye', 'L', 'sheet held open (left fist)'],
  [at(17, 0.2), 'skye', 'R', 'sheet held open (right fist)'],
  [at(2, 0.3), 'lily', 'R', 'teddy on the rocking chair'],
  [at(12, 0.3), 'lily', 'R', 'teddy standing at the box'],
  [at(20, 0.2), 'lily', 'R', 'teddy, last frame'],
];
export const SHOT_LIST = SHOTS.map((x, i) => ({ id: x.id, start: x.start, end: SHOTS[i + 1]?.start ?? meta.seconds }));
