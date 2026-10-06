// Ch10 "Hungry?" (SATURDAY 11:59 PM). Max's bedroom at midnight: the big scare, the lamp clicks on, "Hey, Skye.
// Hungry?", the reveal (every twist clue paid off), "Nobody!" / "Nobody!". Shot plan: production/shots/ch10.md.
// Built on web/ch_template.js. Everything is a pure function of t.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 10;
const CARD = { day: 'SATURDAY', time: '11:59 PM' };
const EST = [
  { index: 1, speaker: 'VO', text: 'Saturday, midnight. Phone recording. Glow sticks on. Time to give Max the scare of his life.', start: 0.0, end: 6.0 },
  { index: 2, speaker: 'SKYE', note: 'ghost', text: 'Maaax. Maaaax.', start: 6.25, end: 8.25 },
  { index: 3, speaker: 'MAX', text: "Hey, Skye. Hungry? It's ham. No crusts.", start: 9.3, end: 12.5 },
  { index: 4, speaker: 'SKYE', note: 'ghost', text: 'I am not Skye. I am a ghost. Ooooh.', start: 12.75, end: 16.25 },
  { index: 5, speaker: 'MAX', text: "Your hair is pink. It's sticking out of the sheet. Same as in my closet on Monday.", start: 16.5, end: 22.8 },
  { index: 6, speaker: 'SKYE', text: 'Monday? You knew? The whole week?', start: 23.85, end: 26.45 },
  { index: 7, speaker: 'MAX', text: 'Who did you think was making the sandwiches?', start: 26.7, end: 29.7 },
  { index: 8, speaker: 'MAX', text: 'Or leaving the back door open? Or fixing your pumpkin?', start: 29.95, end: 33.65 },
  { index: 9, speaker: 'SKYE', text: 'But on the phone. I heard you. You said I was the worst.', start: 33.9, end: 38.2 },
  { index: 10, speaker: 'MAX', text: "You left too early. I said, Skye is the worst at hiding. She's been in our attic all week.", start: 38.45, end: 45.45 },
  { index: 11, speaker: 'MAX', text: "And then I said I'm asking her to the dance. If she ever comes down.", start: 45.7, end: 50.9 },
  { index: 12, speaker: 'SKYE', text: 'You were nice to me all week because a fridge told you to.', start: 51.15, end: 55.45 },
  { index: 13, speaker: 'MAX', text: 'It was a very convincing fridge.', start: 55.7, end: 57.9 },
  { index: 14, speaker: 'SKYE', text: "Then why didn't you tell anyone I was here?", start: 58.15, end: 61.15 },
  { index: 15, speaker: 'MAX', text: 'Because before you haunted it, this house was really boring.', start: 61.4, end: 65.1 },
  { index: 16, speaker: 'DAD', note: 'offscreen', text: 'Max? Who are you talking to?', start: 66.35, end: 68.75 },
  { index: 17, speaker: 'MAX', text: 'Nobody!', start: 69.0, end: 69.7 },
  { index: 18, speaker: 'SKYE', text: 'Nobody!', start: 69.95, end: 70.65 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(Math.max(K.chapterLength(L), L.end + 0.9)); // last "Nobody!" + ~0.9 s room tone
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const { clamp, inv, lerp, smooth } = { clamp: (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), inv: (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a))), lerp: (a, b, u) => a + (b - a) * u, smooth: (u) => u * u * (3 - 2 * u) };
const ln = (i) => L.line(i);
const at = (i, off = 0) => ln(i).start + off;
const end = (i, off = 0) => ln(i).end + off;
// time of the k-th word (0-based) of line i (measured words when narration exists, else spread evenly)
function wordT(i, k) {
  const l = ln(i), ws = L.words.filter((w) => w.speaker === l.speaker && w.start >= l.start - 0.05 && w.end <= l.end + 0.05);
  if (ws.length) return ws[Math.min(k, ws.length - 1)].start;
  const n = l.text.split(/\s+/).length; return l.start + (l.end - l.start) * (k / n);
}

// ---------- key beats ----------
const T = {
  click: (L.actions.find((a) => a.after_line === 2)?.at ?? end(2, 0.25)) + 0.05,   // [+0.8] the lamp clicks on (after the ghost echo)
  pink: wordT(5, 3),                   // "Your hair is PINK"
  sticking: wordT(5, 4),               // "It's sticking out of the sheet."
  monday: wordT(5, 10),                // "Same as in my closet on Monday."
  pull: end(5, 0.08),                  // [+0.8] Skye pulls the sheet off
  edge: at(8, 0.15),                   // Max swings onto the bed edge, plate to the bedside table
  pumpkin: wordT(8, 6),                // "Or fixing your pumpkin?"
  hiding: wordT(10, 4),                // "I said, Skye is the worst at hiding."
  attic: wordT(10, 12),                // "She's been in our attic all week."
  comesDown: wordT(11, 9),             // "If she ever comes down."
  fridge: wordT(12, 9),                // "...because a fridge told you to."
  smiles: end(15),                     // [+1.0] smiles; footsteps
  dad: at(16),
  handle: end(16, -0.9),               // the handle starts turning
};

// ---------- marks (kit-sets-a bedroom: room x -11..11, z -9..9, camera side +z; bed under the window at the back,
// bedside table + lamp at x 0.6 z -7.8, door in the right wall at z 3.5). Skye stands screen right, Max screen left.
const M = {
  doorIn: () => K.mark('bedroom', 'door_in_bed', { pos: V(8.2, 0, 2.8), heading: -2.15 }),
  ghost: () => K.mark('bedroom', 'ghost_stop', { pos: V(3.2, 0, -4.4), heading: -1.27 }),
  nearBed: () => K.mark('bedroom', 'ghost_stop', { pos: V(3.2, 0, -4.4), heading: -1.27 }),  // beside the bed edge, level with Max (both read from +z)
  bedUp: () => K.mark('bedroom', 'bed_sit_door', { pos: V(-4, 0.1, -6.4), heading: 0.99 }),
  bedEdge: () => K.mark('bedroom', 'bed_edge', { pos: V(-1.3, 0.0, -4.6), heading: Math.PI / 2 }),
  plate: () => K.mark('bedroom', 'bedside_plate', { pos: V(0.9, 2.42, -7.5), heading: 0 }),
  door: () => ({ pos: V(11, 0, 3.5), heading: -Math.PI / 2 }),
};

// ---------- setup ----------
let C, A, P = {}, glow, sticks, FILL, RED = null, OVL = {};
export async function setup(stage) {
  await K.buildSets(stage, ['bedroom']);
  K.setState({ chapter: CH });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_sheet'); K.dress(C.max, 'max_pjs');
  A = await K.loadAnims(['idle', 'walk', 'sit', 'shrug']);
  const prop = (id, opts) => { const p = K.makeProp(id, opts); stage.scene.add(p); return p; };
  P.phone = prop('phone', { screen: 'record', light: true });
  P.plate = prop('plate', { with: 'ham_sandwich' });
  P.plateDown = prop('plate', { with: 'ham_sandwich' });          // the same plate set down on the bedside table
  P.sheet = prop('bedsheet', { state: 'bunched', holes: true });
  K.dress(C.skye, 'glow_sticks');
  glow = K.phoneGlow(stage); sticks = K.glowSticks(stage, 2, { intensity: 1.5, range: 3 });
  // a soft on-camera fill (warm once the lamp is on, cool moonlight before): faces read when the lamp is behind them
  FILL = new THREE.PointLight('#ffd9b0', 0, 30, 1.5); stage.scene.add(FILL);
}

// ---------- posing helpers ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
// arm out to the side (up: 0 = down, ~1.57 = shoulder height) with a little forward swing
function armSide(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
// arm forward (pitch: 0 = down, -1.57 = straight out in front), small spread
function armFwd(a, sd, pitch, spread = 0.1) { EUL.set(pitch, 0, sd === 'L' ? spread : -spread, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function headTurn(a, yaw, pitch = 0) { a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(pitch, yaw, 0, 'YXZ'))); }
const wrist = (a, sd) => a.bones['Arm.' + sd].localToWorld(V(sd === 'R' ? -0.5 : 0.5, -1.05, 0));
const palm = (a, sd, y = -1.3) => a.bones['Arm.' + sd].localToWorld(V(sd === 'R' ? -0.5 : 0.5, y, 0));
const toward = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
// turn a heading `k` x 0.45 rad toward +z (the camera side): faces open to the lens in a face-to-face scene
const cheat = (h, k = 1, amt = 0.45) => { const d = Math.atan2(Math.sin(0 - h), Math.cos(0 - h)); return h + Math.sign(d) * Math.min(Math.abs(d), amt) * k; };
const lerpV = (a, b, u) => a.clone().lerp(b, u);
const lerpAngle = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- Skye ----------
const CREEP = 6;                                     // creeping speed, studs/s (legs driven by distance)
function poseSkye(t, idle) {
  const a = C.skye, g = M.ghost(), nb = M.nearBed(), din = M.doorIn();
  const lift = inv(T.pull - 0.05, T.pull + 0.35, t), sheetOn = lift < 1;
  K.dress(a, 'skye_hoodie'); K.dress(a, 'skye_sheet', sheetOn); if (sheetOn) K.sheetLift(a, lift);
  K.dress(a, 'glow_sticks');
  // 1) the entrance: already a step inside the doorway at frame 0, creeping to her mark
  const m0 = { pos: din.pos.clone().lerp(g.pos, 0.08), heading: toward(din.pos, g.pos) };
  let heading;
  if (true) {
    const m = K.walk(a, A, m0, g, 0, t, { speed: CREEP, idleAt: idle, endHeading: toward(g.pos, M.bedUp().pos) });
    heading = a.root.rotation.y;
    if (m.done) heading = toward(g.pos, lerpV(M.bedUp().pos, M.bedEdge().pos, smooth(inv(T.edge, T.edge + 1.0, t))));
  } else {
    // 2) after "fixing your pumpkin" she steps nearer the bed (a real walk), before "But on the phone"
    K.walk(a, A, g, nb, at(9) - 0.6, t, { speed: 9, idleAt: idle });
    heading = a.root.rotation.y;
    if (t > at(9) - 0.6 + g.pos.distanceTo(nb.pos) / 9) heading = toward(nb.pos, M.bedEdge().pos);
  }
  // spooky sway on "Maaax" and "I am a ghost"
  const spook = (t > at(2, -0.2) && t < end(2, 0.1)) || (t > at(4, -0.2) && t < end(4, 0.1));
  if (spook) heading += 0.12 * Math.sin(t * 3.2);
  // 3) the door: both turn to it on Dad's voice
  if (t > T.pull) heading = cheat(heading, smooth(inv(T.pull, T.pull + 0.6, t)), 0.65);
  if (t > T.dad + 0.25) heading = lerpAngle(heading, cheat(toward(a.root.position, M.door().pos), 1, 0.15), smooth(inv(T.dad + 0.25, T.dad + 0.8, t)));
  a.root.rotation.y = heading; a.root.updateMatrixWorld(true);
  // arms: the phone up recording (right), lowered to her chest once the sheet is off
  armFwd(a, 'R', t < T.pull + 0.3 ? -1.35 : -0.7, 0.2);
  if (spook) armSide(a, 'L', 1.45 + 0.15 * Math.sin(t * 5), 0.25);                     // one arm out, never both up
  if (t > T.pull - 0.05 && t < T.pull + 0.45) { const k = Math.sin(inv(T.pull - 0.05, T.pull + 0.4, t) * Math.PI); armSide(a, 'L', lerp(0.3, 2.5, k), 0.5); }
  else if (!sheetOn) armFwd(a, 'L', -0.75, 0.25);                                         // sheet bunched in her left hand, at her hip
  if (t > T.fridge - 0.5 && t < end(12)) armFwd(a, 'R', -1.45, 0.05);                    // points at him with the phone hand
  a.root.updateMatrixWorld(true);
  // faces (they only read once the sheet is off)
  let face = 'scheming';
  if (!sheetOn) face = 'shocked';
  if (t > at(7)) face = 'surprised';
  if (t > at(9)) face = 'sad';
  if (t > T.hiding) face = 'nervous';
  if (t > at(11)) face = 'surprised';
  if (t > T.comesDown) face = 'nervous';
  if (t > at(12)) face = 'annoyed';
  if (t > end(12)) face = 'smug';
  if (t > at(14)) face = 'nervous';
  if (t > end(15, -0.6)) face = 'happy';
  if (t > T.dad + 0.25) face = 'shocked';
  K.speak(a, t > at(18, -0.05) && t < end(18) ? 'shouting' : face, t, sheetOn ? [] : L.said('SKYE'));
  // the sheet bunched in her hand, the phone, the glow sticks
  if (!sheetOn) K.hold(P.sheet, a, 'L', 'side', { offset: [0, 0.7, 0.25] }); else P.sheet.visible = false;
  K.hold(P.phone, a, 'R', t < T.pull + 0.3 ? 'out' : 'palm', t < T.pull + 0.3 ? { rot: [0, 0, 0] } : {});   // filming: lit screen + REC dot toward the lens
  const ph = palm(a, 'R', -1.6);
  glow.set(t < T.click ? 1 : 0.15, ph.clone().add(V(0, 0.2, 0.3)));
  sticks.set(true, [wrist(a, 'L'), wrist(a, 'R')]);
}

// ---------- Max ----------
function poseMax(t, idle) {
  const a = C.max, up = M.bedUp(), ed = M.bedEdge();
  // sitting up in bed (R6 sit = legs straight out, as under the blanket); onto the edge from T.edge
  const k = smooth(inv(T.edge, T.edge + 1.0, t));
  const pos = up.pos.clone().lerp(ed.pos, k);
  if (k > 0 && k < 1) pos.y += 0.35 * Math.sin(k * Math.PI);
  let heading = lerpAngle(toward(up.pos, M.ghost().pos), toward(ed.pos, M.nearBed().pos), k);
  if (t < T.click) heading = lerpAngle(-0.55, heading, smooth(inv(T.click - 0.6, T.click, t)) * 0.0 + smooth(inv(T.click - 0.5, T.click, t)));
  heading = lerpAngle(heading, 0.2, k);                 // on the bed edge he sits open to the lens, turned a little toward her
  if (t > T.dad + 0.2) heading = lerpAngle(heading, cheat(toward(ed.pos, M.door().pos), 1, 0.15), smooth(inv(T.dad + 0.2, T.dad + 0.7, t)));
  K.playAnim(a, [[A.sit, 0, 1, false]]);
  K.putOn(a, { pos, heading }, { sit: true });
  // the lamp click: right hand back to the switch on the bedside table
  if (t > T.click - 0.45 && t < T.click + 0.35) { const u = Math.sin(inv(T.click - 0.45, T.click + 0.35, t) * Math.PI); armSide(a, 'L', lerp(0.2, 1.2, u), lerp(0, -0.8, u)); }
  // holding the plate: in his lap (left hand forward-low), out to her on "Hungry?", lifted on "the sandwiches"
  let plateUp = -1.3;                                   // plate held up in front of his chest, toward the lens
  if (t > at(3) && t < end(3, 0.2)) plateUp = -1.3 - 0.2 * smooth(inv(at(3), at(3, 0.4), t));
  if (t > at(7) && t < end(7)) plateUp = -1.3 - 0.4 * Math.sin(inv(at(7), end(7), t) * Math.PI);
  if (t < T.edge + 0.55) armFwd(a, 'R', t < T.click ? -1.5 : plateUp, t < T.click ? -0.4 : -0.05);   // in the open the plate swings out to his right, clear of his arm, toward the lens
  else if (t < T.edge + 0.9) armSide(a, 'R', 0.9, -0.5);                                  // reaching to the table
  if (t > T.pink - 0.15 && t < T.monday) armFwd(a, 'L', -1.5, 0.05);                      // points at her head
  if (t > T.pumpkin - 0.1 && t < end(8, 0.1)) armSide(a, 'R', 2.0 + 0.12 * Math.sin((t - T.pumpkin) * 9), -0.6); // straightening a pumpkin
  if (t > at(13, -0.1) && t < end(13, 0.2)) { armSide(a, 'L', 0.75, -0.7); armSide(a, 'R', 0.75, -0.7); } // a shrug, arms low
  if (t > at(11) && t < T.comesDown + 0.2) headTurn(a, 0, 0.18);                         // eyes down, blushing
  a.root.updateMatrixWorld(true);
  let face = 'happy';
  if (t > T.monday && t < end(5)) face = 'smug';
  if (t > at(11) && t < T.comesDown + 0.4) face = 'nervous';
  if (t > T.dad + 0.2) face = 'shocked';
  K.speak(a, t > at(17, -0.05) && t < end(17) ? 'shouting' : face, t, L.said('MAX'));
  const inHand = t < T.edge + 0.6;
  if (inHand) K.hold(P.plate, a, 'R', 'palm'); else P.plate.visible = false;
  P.plateDown.visible = !inHand;
  if (!inHand) { const pm = M.plate(); K.place(P.plateDown, pm.pos, pm.heading); }
}

// ---------- the shot table ----------
const LINE_SIDE = () => {                            // the side of the line skye -> max that the room is open to (+z)
  const A0 = M.ghost().pos, B0 = M.bedUp().pos, d = B0.clone().sub(A0), q = V(A0.x, 0, A0.z + 20).sub(A0);
  return Math.sign(d.x * q.z - d.z * q.x) || 1;
};
const FR = { cu: [2.6, 0.04], mcu: [3.8, 0.1], ms: [4.8, 0.18], ws: [9, 0.22] };
function camFrom(stage, actor, dir, framing, fov = 32, lift = 0.35) {
  const [span, up] = FR[framing], eye = K.headPos(actor), target = eye.clone().add(V(0, -up * span, 0));
  const d = span / 2 / Math.tan(THREE.MathUtils.degToRad(fov) / 2), n = dir.clone().setY(0).normalize();
  return K.setCam(stage, { pos: target.clone().addScaledVector(n, d).add(V(0, lift + 0.12 * span, 0)), target, fov }, { clear: false });
}
const SKYE_DIR = V(-4.7, 0, 3.9), MAX_EDGE_DIR = V(1.6, 0, 4.5);   // camera side of the line, lamp out of frame
const skyeOn = (framing) => (s) => camFrom(s, C.skye, SKYE_DIR, framing);
const maxOn = (framing, o = {}) => (s) => K.camOn(s, C.max, framing, { angle: 0.5, fov: 35, ...o });
const setCamOf = (name) => (s) => K.setCam(s, K.getSet('bedroom').cams[name], { clear: false });
const maxEdge = (framing) => (s) => camFrom(s, C.max, MAX_EDGE_DIR, framing);
const two = () => (s) => K.setCam(s, { pos: V(-1.0, 5.2, 5.6), target: V(1.0, 3.6, -4.5), fov: 38 }, { clear: false });
const SHOTS = [
  { line: 1, off: 0, id: 'open', cam: (s) => K.setCam(s, { pos: K.getSet('bedroom').cams.two_shot_bed_door.pos, target: V(3.0, 2.8, -4.4), fov: 52 }, { clear: false }) },  // the set's Ch10 cam, panned to keep Max in frame
  { line: 1, off: 3.9, id: 'ghost_front', cam: (s) => K.setCam(s, { pos: V(-1.4, 4.9, -2.9), target: V(3.2, 4.4, -4.4), fov: 34 }, { clear: false }) },
  { line: 2, off: -0.15, id: 'ghost_ms', cam: (s) => K.setCam(s, { pos: V(-3.9, 5.0, -2.1), target: V(3.2, 3.8, -4.4), fov: 38 }, { clear: false }) },
  { line: 2, off: T.click - at(2) - 0.03, id: 'click', cam: (s) => camFrom(s, C.max, V(3.0, 0, 5.2), 'ms', 34, 1.4) },
  { line: 3, off: -0.1, id: 'hungry', cam: (s) => camFrom(s, C.max, V(3.0, 0, 5.2), 'ms', 34, 1.4) },
  { line: 4, off: -0.1, id: 'not_skye', cam: (s) => K.setCam(s, { pos: V(-3.9, 5.0, -2.1), target: V(3.2, 3.8, -4.4), fov: 38 }, { clear: false }) },
  { line: 5, off: -0.1, id: 'pink', cam: (s) => camFrom(s, C.max, V(3.0, 0, 5.2), 'ms', 34, 1.4) },
  { line: 5, off: T.sticking - at(5) - 0.1, id: 'lock_cu', cam: (s) => K.setCam(s, { pos: V(0.55, 4.85, -1.95), target: V(3.2, 4.6, -4.4), fov: 38 }, { clear: false }) },
  { line: 5, off: T.monday - at(5) - 0.1, id: 'monday', cam: setCamOf('bed_cu') },
  { line: 5, off: T.pull - at(5) - 0.1, id: 'pull', cam: (s) => K.setCam(s, { pos: V(-3.6, 6.2, 1.6), target: V(3.2, 5.0, -4.4), fov: 42 }, { clear: false }) },
  { line: 6, off: -0.1, id: 'you_knew', cam: skyeOn('mcu') },
  { line: 7, off: -0.1, id: 'sandwiches', cam: (s) => camFrom(s, C.max, V(3.0, 0, 5.2), 'ms', 34, 1.4) },
  { line: 8, off: -0.1, id: 'pumpkin', cam: two() },
  { line: 9, off: -0.1, id: 'phone', cam: skyeOn('mcu') },
  { line: 10, off: -0.1, id: 'too_early', cam: maxEdge('mcu') },
  { line: 10, off: T.attic - at(10) - 0.3, id: 'attic', cam: two() },
  { line: 11, off: -0.1, id: 'dance', cam: maxEdge('mcu') },
  { line: 11, off: T.comesDown - at(11) - 0.1, id: 'comes_down', cam: skyeOn('cu') },
  { line: 12, off: -0.1, id: 'fridge', cam: skyeOn('ms') },
  { line: 13, off: -0.1, id: 'convincing', cam: maxEdge('mcu') },
  { line: 14, off: -0.1, id: 'why', cam: skyeOn('mcu') },
  { line: 15, off: -0.1, id: 'boring', cam: two() },
  { line: 16, off: -0.1, id: 'door', cam: (s) => K.setCam(s, { pos: V(5.0, 3.2, 6.8), target: V(10.8, 1.9, 3.6), fov: 38 }, { clear: false }) },
  { line: 17, off: -0.15, id: 'nobody', cam: (s) => K.setCam(s, { pos: V(1.0, 5.3, 5.0), target: V(1.0, 4.0, -4.5), fov: 36 }, { clear: false }) },
].map((x) => ({ ...x, start: Math.max(0, at(x.line, x.off)) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet('bedroom');
  K.setState({ chapter: CH, garlic: true, door: doorOpen(t) + (t > T.handle ? 0.006 * Math.abs(Math.sin((t - T.handle) * 22)) * (t < T.handle + 0.8 ? 1 : 0) : 0), blanket: t < T.edge + 0.3 ? 'legs' : 'flat' });
  K.applyLight(stage, 'midnight', { set, practicals: { moon_window: 0.6, bedside_lamp: t >= T.click, hall_under_door: t > T.smiles + 0.2 } });
  K.setBlockers(set.group, C.skye, C.max);
  // idle runs only while someone speaks, in the entrance creep, and in the scripted actions (so still moments repeat)
  const idle = K.holdClock(t, L, [[0, 3.2], [T.click - 0.5, T.click + 0.4], [T.pull - 0.1, T.pull + 0.5]]);
  K.only(C, ['skye', 'max']);
  K.setLine(C.skye, C.max, LINE_SIDE());
  poseMax(t, idle);
  poseSkye(t, idle);
  sh.cam(stage, t);
  FILL.position.copy(stage.camera.position).add(V(0, 0.8, 0)); FILL.color.set(t < T.click ? '#9fb4ff' : '#ffd9b0'); FILL.intensity = (t < T.click ? 3 : 7) * (/ghost|not_skye|pull|lock/.test(sh.id) ? 0.25 : /skye|you_knew|phone|fridge|why|comes_down/.test(sh.id) ? 0.5 : 1);
  // red circle on the pink lock (left of her face, i.e. screen right of her head centre when she faces the camera)
  RED = null;
  if (sh.id === 'lock_cu') { const lock = C.skye.root.getObjectByName('pink_lock'); if (lock) RED = K.screenOf(stage, new THREE.Box3().setFromObject(lock).getCenter(V(0, 0, 0))); }
  OVL = { id: sh.id };
}
// the door: swinging open at frame 0, pushed shut behind her once she's in
function doorOpen(t) { return t < 2.4 ? lerp(0.7, 1.0, smooth(clamp(t / 0.8))) : 1 - smooth(inv(2.4, 3.0, t)); }

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
  if (RED) K.redCircle(g, s, t, RED.x, RED.y, 120, { t0: T.sticking + 0.1 });
}

export const cast = () => ({ skye: C.skye, max: C.max });
export const props = () => P;
export const TIMES = T, SHOT_LIST = SHOTS, LINES = L;
