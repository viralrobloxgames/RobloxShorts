// Ch7 "The Pumpkin Girl" (FRIDAY 4:05 PM). The attic in the afternoon: Dad comes up with the vacuum, Skye poses as a
// Halloween decoration (pumpkin bucket on her head, scarecrow arms out at shoulder height), Max sends Dad away and
// straightens her pumpkin. Shot plan: production/shots/ch07.md. Built from web/ch_template.js; everything is a pure
// function of t. Set: K.sets.attic (local layout in its header: tea box at (-3.5, 2), decorations at z -3.5, hatch at
// (4.5, 9)). Cameras stay on the tea-box (-x) side of the Skye-Dad line, so Dad is screen right of Skye.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 7;
const CARD = { day: 'FRIDAY', time: '4:05 PM' };
const EST = [
  { index: 0, speaker: 'VO', text: 'Friday. Day five. Dad kept his promise. And this time, he brought backup.', start: 0.0, end: 4.6 },
  { index: 1, speaker: 'SKYE', note: 'whisper', text: "Where do I hide? There's nowhere to hide!", start: 4.85, end: 7.3 },
  { index: 2, speaker: 'LILY', text: 'Quick! Be a decoration!', start: 7.55, end: 9.1 },
  { index: 3, speaker: 'SKYE', text: 'A what?', start: 9.35, end: 10.0 },
  { index: 4, speaker: 'LILY', text: "Stand still. Don't breathe. Think pumpkin thoughts.", start: 10.85, end: 13.8 },
  { index: 5, speaker: 'DAD', text: "Right, ghost. It's you, me, and the vacuum.", start: 14.65, end: 17.9 },
  { index: 6, speaker: 'DAD', text: 'Lily? What are you doing up here?', start: 18.15, end: 20.5 },
  { index: 7, speaker: 'LILY', text: 'Tea party. With the decorations.', start: 20.75, end: 22.6 },
  { index: 8, speaker: 'DAD', text: "You put the Halloween stuff out already? It's not even Halloween.", start: 22.85, end: 26.6 },
  { index: 9, speaker: 'LILY', text: 'I like to plan ahead.', start: 26.85, end: 28.4 },
  { index: 10, speaker: 'DAD', text: "That's my girl. Let's see. Skeleton. Witch. Giant pumpkin girl.", start: 28.65, end: 32.9 },
  { index: 11, speaker: 'DAD', text: "Hmm. I don't remember buying a pumpkin girl.", start: 33.15, end: 35.9 },
  { index: 12, speaker: 'DAD', text: 'Very realistic. Bit dusty. Smells like cinnamon.', start: 36.95, end: 39.8 },
  { index: 13, speaker: 'DAD', text: 'Lily, why do the decorations smell like cinnamon?', start: 40.05, end: 42.8 },
  { index: 14, speaker: 'LILY', text: "They're festive.", start: 43.05, end: 44.1 },
  { index: 15, speaker: 'DAD', text: "Well, she's filthy. Hold still, pumpkin girl. Time for a good hoover.", start: 44.35, end: 48.6 },
  { index: 16, speaker: 'MAX', note: 'offscreen', text: "Dad! I'll clean the attic. Your football's starting!", start: 49.45, end: 52.4 },
  { index: 17, speaker: 'DAD', text: "Already? You're a good lad, Max.", start: 52.65, end: 54.8 },
  { index: 18, speaker: 'MAX', text: 'Nice decoration. Very realistic.', start: 56.25, end: 58.1 },
  { index: 19, speaker: 'MAX', text: 'Lily. Dinner. Five minutes.', start: 58.35, end: 60.2 },
  { index: 20, speaker: 'SKYE', text: 'I almost got hoovered.', start: 61.25, end: 62.6 },
  { index: 21, speaker: 'LILY', text: 'He fixed your pumpkin.', start: 62.85, end: 64.3 },
  { index: 22, speaker: 'SKYE', text: "He didn't notice. Boys never notice anything.", start: 64.55, end: 67.0 },
  { index: 23, speaker: 'LILY', text: 'Sure.', start: 67.25, end: 67.9 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.75);
export const sky = K.SKY;
export const samples = () => 1;
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const { clamp, lerp } = THREE.MathUtils;
const inv = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
const smooth = (u) => u * u * (3 - 2 * u);
const sm = (a, b, t) => smooth(inv(a, b, t));
const ATT = V(600, 0, 0);
const W = (x, z, y = 0) => V(x, y, z).add(ATT);                          // attic local -> world
const pt = (x, z, h = 0) => ({ pos: W(x, z), heading: h });              // a spot as a mark
const towards = (a, b) => Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z);

// ---------- marks ----------
const M = {
  // Ch7 tea seats: both on the far side of the upturned box from the opening camera, faces to it; the hatch behind them
  teaSkye: () => pt(-3.0, 4.2, -2.95), teaLily: () => pt(-5.8, 2.4, -2.6),
  pose: () => { const m = K.mark('attic', 'decor_pose'); m.heading -= 0.3; return m; },   // cheated toward the cameras (-x side)
  front: () => pt(6.3, -1.5, Math.atan2(5.3 - 6.3, -3.5 + 1.5) + 0.45),   // in front of her, a little to the witch side (both faces read)
  hatchTop: () => K.mark('attic', 'hatch_top'), climb: () => K.mark('attic', 'hatch_climb'),
  vac: () => K.mark('attic', 'vacuum'),
};

// ---------- key times (on the narration) ----------
const T = {};
function times() {
  T.lidLift = at(0, 3.6);                // the lid starts to lift (rattles before)
  T.skyeUp = at(1, 0.15);                // Skye scrambles up from the tea box
  T.lilyUp = at(2, 0.0);                 // Lily jumps up
  T.goDecor = at(3, 0.0);                // both head for the decorations
  T.jam = end(3, 0.55);                  // the bucket goes on
  T.pose = T.jam + 0.25;                 // scarecrow pose
  T.lilyBack = end(4, 0.0);              // Lily runs back to the tea box
  T.dadRise = end(4, 0.05);              // Dad climbs in
  T.dadOut = at(5, 1.6);
  T.dadWalk1 = at(8, 0.3);               // toward the decorations
  T.dadWalk2 = at(10, 1.5);              // along the row to the pumpkin girl
  T.lean = end(11, 0.1);                 // nose to nose
  T.unlean = at(13, 0.4);
  T.nozzle = at(15, 1.6);                // he raises the nozzle
  T.hum = end(15, 0.15);
  T.humOff = at(16, 0.05);
  T.dadGo = at(17, 0.4);                 // walks to the hatch
  T.dadDown = end(17, -0.25);
  T.maxUp = end(17, 0.35);
  T.maxOut = at(18, -0.25);
  T.fix = at(18, 1.1);                   // straightens the pumpkin
  T.maxGo = end(19, 0.05);
  T.maxDown = end(19, 0.75);
  T.lilyCome = at(20, -0.2);             // Lily walks over to Skye
  T.armsDown = at(22, 0.6);
}
times();

// ---------- setup ----------
let C, A, set, P = {};
export async function setup(stage) {
  await K.buildSets(stage, ['attic']);
  K.setState({ chapter: 7 });
  set = K.getSet('attic');
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_school'); K.dress(C.dad, 'dad_cardigan'); K.dress(C.lily, 'lily_day');
  A = await K.loadAnims(['idle', 'walk', 'run']);
  // the set's own pumpkin bucket and vacuum move with the action (until kit-props hands chapters its own movable ones)
  P.pumpkin = set.items?.pumpkin_bucket; P.vacuum = set.items?.vacuum;
  for (const o of [P.pumpkin, P.vacuum]) o?.traverse((m) => { m.userData.noCamBlock = true; });   // carried things never push a camera
  for (const o of [set.items?.shafts_sun, set.items?.shafts_moon]) o?.traverse((m) => { m.userData.noCamBlock = true; });   // light shafts aren't walls (asked kit-sets-b to set this in the set)
}

// ---------- posing helpers (chapter blocking; looks come from the kit) ----------
const eu = new THREE.Euler();
function headTurn(actor, yaw, pitch = 0) { const h = actor.bones.Head; h.rotation.set(pitch, yaw, 0); }
// seated on the floor at the tea box (kit poses sit_cross / kneel; the pose's drop puts the seat on the floor)
function sitFloor(actor, m, heading, pose = 'sit_cross') {
  K.putOn(actor, { pos: m.pos, heading: heading ?? m.heading }, { sit: true });
  const d = K.posture(actor, pose); actor.root.position.y = m.pos.y - d;
}
// up or down the attic ladder through the hatch: k 0 = below the floor, 1 = standing on it (kit climb gait)
function climbAt(actor, m, heading, k) {
  K.putOn(actor, { pos: m.pos, heading }, { sit: true });
  K.posture(actor, K.gait('climb', (k * 4 * actor.scale) / 1.6));
  actor.root.position.y = set.hatchRise(actor.scale, k);
}
// put a set object at a world transform (it stays parented to the set group)
const _m = new THREE.Matrix4(), _p = new THREE.Matrix4();
function placeWorld(obj, worldMatrix) {
  obj.parent.updateMatrixWorld(true);
  _p.copy(obj.parent.matrixWorld).invert().multiply(worldMatrix);
  _p.decompose(obj.position, obj.quaternion, obj.scale);
}
// world matrix of a point on a bone: offset (bone local), rotation (euler), scale
function onBone(actor, bone, off, rot = [0, 0, 0], s = 1) {
  actor.root.updateMatrixWorld(true);
  const b = actor.bones[bone];
  const local = new THREE.Matrix4().compose(off.clone().multiplyScalar(actor.scale), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), V(s, s, s));
  return _m.copy(b.matrixWorld).multiply(local).clone();
}

// ---------- blocking per character ----------
function poseSkye(t, idle) {
  const s = C.skye;
  const ts = M.teaSkye(), pose = M.pose();
  if (t < T.skyeUp) {                                   // at the tea box, head snapping to the hatch
    sitFloor(s, ts, ts.heading);
    headTurn(s, -0.25 * sm(1.2, 1.6, t));               // an ear toward the hatch behind her
    return 'tea';
  }
  if (t < T.goDecor) {                                  // up on her feet, looking for somewhere to hide
    K.putOn(s, { pos: ts.pos, heading: ts.heading + 0.45 * Math.sin((t - T.skyeUp) * 4) });
    K.posture(s, 'shock', { mix: 0.45 });                 // arms half out, panicking (not up)
    return 'stand';
  }
  const from = { pos: ts.pos, heading: ts.heading };
  const m = K.walk(s, A, from, pose, T.goDecor + 0.1, t, { idleAt: idle, endHeading: pose.heading });
  if (!m.done) return 'walk';
  // the scarecrow pose: both arms straight out at shoulder height (never above the head); feet together
  K.putOn(s, pose);
  let k = sm(T.pose - 0.15, T.pose + 0.1, t);               // snap into it
  k *= 1 - 0.18 * sm(at(20), end(20), t);                   // a tired droop on "I almost got hoovered"
  k *= 1 - 0.55 * sm(T.armsDown, T.armsDown + 0.9, t);      // arms coming down at the end (the end frame)
  K.posture(s, 'scarecrow', { mix: k });
  // tiny flinch when the nozzle comes up
  const fl = sm(T.nozzle, T.nozzle + 0.3, t) * (1 - sm(T.humOff, T.humOff + 0.4, t));
  headTurn(s, 0, -0.08 * fl);
  return 'pose';
}

function poseLily(t, idle) {
  const l = C.lily;
  const tl = M.teaLily(), grab = pt(6.9, -5.1, Math.PI), jam = pt(7.1, -2.4, 0), stand = pt(-5.4, 1.2, 0);
  const teaH = tl.heading;
  if (t < T.lilyUp) { sitFloor(l, tl, teaH, 'kneel'); headTurn(l, -0.3 * sm(1.2, 1.6, t)); return; }
  if (t < T.goDecor) {
    K.playAnim(l, [[A.idle, idle]]); K.putOn(l, { pos: stand.pos, heading: towards(stand, M.pose()) });
    K.gesture(l, 'point', 'L');                              // points at the decorations (one arm)
    return;
  }
  if (t < T.lilyBack) {
    const m = K.walk(l, A, stand, grab, T.goDecor, t, { speed: 16, idleAt: idle });
    if (!m.done) return;
    // grabs the bucket, steps to Skye, hops and jams it on her head, then steps aside giving orders
    const m2 = K.walk(l, A, grab, jam, m.arrive + 0.2, t, { speed: 12, idleAt: idle, endHeading: towards(jam, M.pose()) });
    if (m2.done) {
      const hop = Math.max(0, Math.sin(Math.PI * inv(T.jam - 0.25, T.jam + 0.1, t)));
      l.root.position.y += 0.9 * hop;
      if (t < T.jam + 0.1) K.gesture(l, 'reach_up', 'L');     // reaching up and forward with the bucket (one arm)
      if (t > T.jam + 0.3) l.root.rotation.y = lerp(towards(jam, M.pose()), towards(jam, pt(3.0, 3.5)), sm(T.jam + 0.3, T.jam + 0.6, t));  // orders, half to camera
      if (t >= T.jam + 0.1 && t > at(4)) K.gesture(l, 'finger_up', 'L', sm(at(4, 1.2), at(4, 1.5), t) * (1 - sm(at(4, 2.4), at(4, 2.7), t))); // a finger up
    }
    return;
  }
  if (t < T.lilyCome) {                                      // back at the tea party
    const m = K.walk(l, A, jam, tl, T.lilyBack, t, { speed: 16, idleAt: idle });
    if (m.done) { sitFloor(l, tl, towards(tl, M.front()) * 0.6 + tl.heading * 0.4, 'kneel'); if (t > at(7) && t < end(9)) K.gesture(l, 'cup_hold', 'L'); }
    return;
  }
  const side = pt(7.3, -2.5, 0);
  const m = K.walk(l, A, tl, side, T.lilyCome, t, { idleAt: idle, endHeading: towards(side, pt(4.6, 3)) });
  if (m.done) headTurn(l, at(22) < t ? -0.45 : -0.2);
}

function poseDad(t, idle) {
  const d = C.dad, top = M.hatchTop(), climb = M.climb();
  if (t < T.dadRise) { d.root.visible = false; return; }
  if (t < T.dadOut) {                                        // up the ladder
    const k = sm(T.dadRise, T.dadOut - 0.2, t);
    climbAt(d, climb, climb.heading, k);
    return;
  }
  const near = pt(1.8, 0.4), front = M.front();
  if (t < T.dadWalk1) {
    const m = K.walk(d, A, climb, top, T.dadOut, t, { idleAt: idle, endHeading: towards(top, M.teaLily()) });
    if (m.done && t > at(6) - 0.3) d.root.rotation.y = towards(top, M.teaLily());
    return;
  }
  if (t < T.dadWalk2) {
    const m = K.walk(d, A, top, near, T.dadWalk1, t, { idleAt: idle, endHeading: towards(near, M.pose()) - 0.3 });
    if (m.done && t > at(10, 0.9)) d.root.rotation.y = towards(near, pt(2.6, -3.5));   // "Skeleton."
    if (m.done && t > at(8, 2.2) && t < end(8)) K.gesture(d, 'hold_out', 'R');          // gestures at the decorations
    return;
  }
  if (t < T.dadGo) {
    const m = K.walk(d, A, near, front, T.dadWalk2, t, { idleAt: idle, endHeading: front.heading });
    if (!m.done) { if (t < T.dadWalk2 + 0.6) K.gesture(d, 'point', 'R'); return; }   // pointing as he goes ("Witch.")
    // nose to nose
    const lk = sm(T.lean, T.lean + 0.5, t) * (1 - sm(T.unlean, T.unlean + 0.4, t));
    d.root.rotation.y -= 0.45 * lk;                          // square up to her for the lean (the cheat is for the two-shot)
    if (lk > 0) K.posture(d, 'hip_bend', { mix: 0.55 * lk, reset: false });
    if (t > at(11) && t < end(11)) K.gesture(d, 'chin_hand', 'R', sm(at(11), at(11, 0.3), t)); // chin stroke
    if (t > at(13) && t < at(15)) headTurn(d, 0.75 * sm(at(13), at(13, 0.3), t) * (1 - sm(at(15), at(15, 0.3), t)));
    // the nozzle: right arm forward, raised toward her face
    const nz = sm(T.nozzle, T.nozzle + 0.5, t) * (1 - sm(T.humOff + 0.2, T.humOff + 0.6, t));
    if (nz > 0) K.gesture(d, 'hold_out', 'R', nz);
    if (t > T.humOff) headTurn(d, 1.2 * sm(T.humOff, T.humOff + 0.35, t));               // toward the hatch
    return;
  }
  if (t < T.dadDown) { K.walk(d, A, front, climb, T.dadGo, t, { idleAt: idle }); return; }
  if (t < T.maxUp + 0.2) {
    const k = 1 - sm(T.dadDown, T.maxUp, t);
    climbAt(d, climb, 0, k);
    if (k <= 0.01) d.root.visible = false;
    return;
  }
  d.root.visible = false;
}

function poseMax(t, idle) {
  const x = C.max, climb = M.climb(), top = M.hatchTop();
  if (t < T.maxUp) { x.root.visible = false; return; }
  const near = pt(6.4, -1.4, Math.PI);
  if (t < T.maxOut) {                                        // head and shoulders up through the hatch: the long look
    const k = 0.62 * sm(T.maxUp, T.maxUp + 0.5, t);
    climbAt(x, climb, towards(climb, M.pose()), k);
    if (t > T.maxUp + 0.5) K.posture(x, 'stand', { reset: false, extra: { 'Arm.L': [-60, 0, -6], 'Arm.R': [-60, 0, 6] } });   // hands on the hatch rim, looking
    return;
  }
  if (t < T.maxGo) {
    const m = K.walk(x, A, { pos: climb.pos, heading: towards(climb, M.pose()) }, near, T.maxOut, t, { idleAt: idle, endHeading: towards(near, M.pose()) });
    if (!m.done) return;
    const fx = sm(T.fix - 0.3, T.fix, t) * (1 - sm(T.fix + 0.5, T.fix + 0.8, t));
    if (fx > 0) K.gesture(x, 'reach_up', 'R', fx);          // reaches up to her pumpkin (one arm)
    if (t > at(19)) x.root.rotation.y = lerp(towards(near, M.pose()), towards(near, M.teaLily()), sm(at(19), at(19, 0.3), t));
    return;
  }
  if (t < T.maxDown) { K.walk(x, A, near, climb, T.maxGo, t, { idleAt: idle }); return; }
  const k = 1 - sm(T.maxDown, T.maxDown + 0.6, t);
  climbAt(x, climb, 0, k); if (k <= 0.01) x.root.visible = false;
}

// ---------- props ----------
function placeProps(t) {
  // hatch lid: rattles, a crack of light, then all the way open when Dad climbs in; stays open
  let lid = 0;
  if (t < T.lidLift) lid = 0.03 * Math.max(0, Math.sin(t * 23)) * (Math.sin(t * 2.7) > 0.2 ? 1 : 0);
  else if (t < T.dadRise) lid = 0.12 * sm(T.lidLift, T.lidLift + 0.6, t);
  else lid = lerp(0.12, 1, sm(T.dadRise - 0.1, T.dadRise + 0.35, t));
  const vacOn = t >= T.dadRise;
  K.setState({ chapter: 7, hatch: lid, pumpkin: t < T.jam - 0.3 ? 'box' : 'none', vacuum: vacOn });
  // pumpkin: in Lily's hand, then on Skye's head (crooked until Max fixes it)
  const pb = P.pumpkin;
  if (pb && t >= T.jam - 0.3) {
    pb.visible = true;
    if (t < T.jam) placeWorld(pb, onBone(C.lily, 'Arm.L', V(0.5, -2.3, 0), [0, 0, 0], 1 / C.lily.scale * 0.9));
    else {
      const tilt = lerp(0.22, 0.0, sm(T.fix - 0.1, T.fix + 0.35, t));
      const drop = 0.25 * (1 - sm(T.jam, T.jam + 0.12, t));
      placeWorld(pb, onBone(C.skye, 'Head', V(0.05, 1.98 + drop, 0), [Math.PI + 0.05, Math.PI + 0.3, tilt], 1.05));
    }
  }
  // vacuum: in Dad's left hand up the ladder, then on the floor at his side, then left by the hatch
  const vac = P.vacuum;
  if (vac && vacOn) {
    if (t < T.dadOut + 0.3) placeWorld(vac, new THREE.Matrix4().compose(W(7.4, 8.4), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -2.2, 0)), V(1, 1, 1)));   // pushed up onto the floor ahead of him
    else if (t < T.dadGo) {
      const d = C.dad.root, h = d.rotation.y, side = V(Math.cos(h), 0, -Math.sin(h));        // his left
      const p = d.position.clone().addScaledVector(side, 1.6).add(V(Math.sin(h) * 0.6, 0, Math.cos(h) * 0.6)); p.y = 0;
      placeWorld(vac, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h, 0)), V(1, 1, 1)));
    } else { const m = M.vac(); placeWorld(vac, new THREE.Matrix4().compose(m.pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, m.heading, 0)), V(1, 1, 1))); }
  }
}

// ---------- the shot table ----------
const cam = (name) => (s) => K.setCam(s, set.cams[name]);
// Skye front 3/4, whoever stands at M.front() in profile, screen right of her
const TWO = (s) => K.setCam(s, { pos: W(0.4, 0.0, 4.3), target: W(5.8, -2.4, 3.6), fov: 40 });
const NOSE = (s) => K.setCam(s, { pos: W(5.8, 1.5, 5.0), target: W(5.3, -3.5, 4.5), fov: 30 });   // over Dad's left shoulder onto her face
const SHOTS = [
  { line: 0, off: 0, id: 'open', cam: (s) => K.setCam(s, { pos: W(-7.6, -5.8, 5.9), target: W(0.6, 6.5, 0.6), fov: 52 }) },
  { line: 1, off: 0, id: 'hide', cam: (s) => K.setCam(s, { pos: W(-6.6, -3.6, 5.2), target: W(-3.6, 3.0, 3.2), fov: 46 }) },
  { line: 2, off: 0, id: 'lily_quick', cam: (s) => K.camOn(s, C.lily, 'ms') },
  { line: 3, off: 0, id: 'skye_what', cam: (s) => K.camOn(s, C.skye, 'mcu') },
  { line: 3, off: 0.6, id: 'decor_jam', cam: (s) => K.setCam(s, { pos: W(2.6, 4.6, 4.4), target: W(5.9, -3.5, 3.0), fov: 44 }) },
  { line: 5, off: -0.8, id: 'dad_rises', cam: (s) => K.setCam(s, { pos: W(0.6, 2.0, 3.8), target: W(4.5, 8.0, 2.6), fov: 44 }) },
  { line: 6, off: 0, id: 'dad_lily', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.4 }) },
  { line: 7, off: 0, id: 'lily_tea', cam: (s) => K.camOn(s, C.lily, 'ms', { angle: 0.4 }) },
  { line: 8, off: 0, id: 'dad_halloween', cam: (s) => K.setCam(s, { pos: W(4.0, -1.8, 4.6), target: W(2.2, 1.6, 3.9), fov: 44 }) },
  { line: 9, off: 0, id: 'lily_plan', cam: (s) => K.camOn(s, C.lily, 'ms', { angle: 0.4 }) },
  { line: 10, off: 0, id: 'row', cam: (s) => K.setCam(s, { pos: W(-1.6, 1.6, 4.6), target: W(5.0, -2.4, 3.2), fov: 46 }) },
  { line: 11, off: 0, id: 'two_hmm', cam: TWO },
  { line: 12, off: -0.8, id: 'nose', cam: NOSE },
  { line: 13, off: 0, id: 'dad_asks', cam: TWO },
  { line: 14, off: 0, id: 'lily_festive', cam: (s) => K.camOn(s, C.lily, 'ms', { angle: 0.4 }) },
  { line: 15, off: 0, id: 'hoover', cam: TWO },
  { line: 15, off: 2.4, id: 'nozzle_cu', cam: (s) => K.setCam(s, { pos: W(2.4, -1.4, 4.9), target: W(5.4, -3.3, 4.6), fov: 30 }) },
  { line: 16, off: 0, id: 'max_off', cam: TWO },
  { line: 17, off: 0.3, id: 'dad_leaves', cam: cam('hatch_wide') },
  { line: 18, off: 0, id: 'max_fix', cam: TWO },
  { line: 19, off: 0, id: 'max_dinner', cam: TWO },
  { line: 19, off: 1.9, id: 'max_down', cam: cam('hatch_wide') },
  { line: 20, off: 0, id: 'skye_hoovered', cam: (s) => K.setCam(s, { pos: W(3.4, 0.4, 4.8), target: W(5.3, -3.5, 4.5), fov: 32 }) },
  { line: 21, off: 0, id: 'end_two', cam: cam('decor_ms') },
].map((x) => ({ ...x, start: x.line === 0 && x.off === 0 ? 0 : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- faces ----------
function faces(t) {
  const posed = t >= T.pose;
  const skye = t < at(1) ? 'shocked' : t < T.pose ? 'scared' : t < at(20) ? (t > T.nozzle && t < T.humOff + 0.3 ? 'scared' : 'neutral') : t < at(22) ? 'annoyed' : 'smug';
  const lily = t < at(1) ? 'surprised' : t < at(4) ? 'determined' : t < T.dadRise ? 'smug' : t < at(9) ? 'happy' : t < at(14) ? 'smug' : t < at(20) ? 'neutral' : t < at(23) ? 'smug' : 'suspicious';
  const dad = t < at(6) ? 'determined' : t < at(8) ? 'surprised' : t < at(10) ? 'suspicious' : t < at(11) ? 'happy' : t < at(15) ? 'suspicious' : t < at(16) ? 'determined' : t < at(17) ? 'surprised' : 'happy';
  const max = t < T.maxOut ? 'neutral' : t < at(19) ? 'smug' : 'neutral';
  // Skye mouths nothing while she is a decoration (her lines come after Max leaves)
  K.speak(C.skye, skye, t, posed && t < at(20) ? [] : L.said('SKYE'));
  K.speak(C.lily, lily, t, L.said('LILY'));
  K.speak(C.dad, dad, t, L.said('DAD'));
  K.speak(C.max, max, t, L.said('MAX').filter((w) => w.start > at(17)));   // his offscreen call isn't lip-synced
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  set = K.showSet('attic');
  K.applyLight(stage, 'attic_afternoon', { set });
  K.only(C, ['skye', 'lily', 'dad', 'max']);
  const idle = K.holdClock(t, L, [[T.goDecor, T.pose + 0.3], [T.dadRise, T.dadOut + 1], [T.dadWalk1, T.dadWalk1 + 1], [T.dadWalk2, T.dadWalk2 + 1], [T.dadGo, T.maxOut + 1], [T.maxGo, T.maxDown + 0.8], [T.lilyCome, T.lilyCome + 1]]);
  poseSkye(t, idle); poseLily(t, idle + 0.7); poseDad(t, idle + 1.3); poseMax(t, idle + 2.1);
  placeProps(t);
  faces(t);
  K.setBlockers(set.group);                           // walls only: the blocking keeps actors out of each other's shots
  K.setLine(C.skye, C.dad.root.visible ? C.dad : C.lily, 1);
  sh.cam(stage, t);
  const r = (a) => a.root.visible ? [+(a.root.position.x - 600).toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2), +a.root.rotation.y.toFixed(2)] : null;
  globalThis.__dbg = { shot: sh.id, skye: r(C.skye), lily: r(C.lily), dad: r(C.dad), max: r(C.max), cam: stage.camera.position.toArray().map((v, i) => +(v - (i ? 0 : 600)).toFixed(2)) };
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }
