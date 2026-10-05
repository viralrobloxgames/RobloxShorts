// Blocky Roblox-style lion for Whatever Mia Draws: a rigid-part rig like web/lib/trex.js (rounded boxes on pivot groups),
// posed procedurally by lionPose(). The pack's animal_lion is a single rigid mesh, so it can't swat, roar or roll over.
// Units are studs (a character is 5 tall): shoulder ~4.3, top of the mane ~7.4, nose to rump ~8. Faces +Z, root on the ground.
import * as THREE from 'three';
import { mat, roundedBox } from '../../../web/lib/rig.js';

const C = { body: 'e3a548', belly: 'f4d38c', mane: 'a8551f', maneDark: '8a431a', nose: '3a2420', eye: 'ffffff', pupil: '17110c',
  mouth: '7a2430', tongue: 'e0697a', tooth: 'fbf8ee', paw: 'f1c77a', claw: 'f6f1e2', brow: '6e3514', tuft: '8a431a' };
const G = () => new THREE.Group();
function box(w, h, d, color, { r = 0.25, rough = 0.6, x = 0, y = 0, z = 0 } = {}) {
  const m = new THREE.Mesh(roundedBox(w, h, d, Math.min(r, w / 2.05, h / 2.05, d / 2.05)), mat(color, rough, { clearcoat: 0.15, clearcoatRoughness: 0.6 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
const pivot = (parent, x, y, z) => { const g = G(); g.position.set(x, y, z); parent.add(g); return g; };

export const LION = { hip: 3.0, upper: 1.55, lower: 1.45, stride: 7.5 };   // stride: studs per walk cycle (feet planted)

export function makeLion() {
  const root = G(); root.name = 'Lion';
  const b = {};
  b.hips = pivot(root, 0, LION.hip, 0);                      // body pivot at the middle of the back, leg tops at this height
  b.body = pivot(b.hips, 0, 0, 0);
  b.body.add(box(3.1, 2.6, 6.6, C.body, { r: 0.9, y: 0.75, z: 0 }));
  b.body.add(box(2.5, 1.0, 5.4, C.belly, { r: 0.45, y: -0.45, z: 0.2 }));
  // Chest and neck, with the mane all round the head.
  b.neck = pivot(b.body, 0, 1.4, 2.7);
  b.neck.add(box(2.7, 2.6, 2.2, C.body, { r: 0.8, y: 0.3, z: 0.4 }));
  b.head = pivot(b.neck, 0, 1.2, 1.3);
  const maneM = [C.mane, C.maneDark];
  b.head.add(box(4.4, 4.2, 1.9, C.mane, { r: 1.0, y: 0.4, z: -0.6 }));                     // the mane disc behind the face
  for (let i = 0; i < 10; i++) {                                                             // shaggy blocks round the edge
    const a = (i / 10) * Math.PI * 2 + 0.3, rr = 2.05;
    b.head.add(box(1.5, 1.5, 1.6, maneM[i % 2], { r: 0.5, x: Math.cos(a) * rr, y: 0.4 + Math.sin(a) * rr, z: -0.45 - (i % 2) * 0.2 }));
  }
  b.head.add(box(2.7, 2.5, 2.3, C.body, { r: 0.8, y: 0.45, z: 0.45 }));                    // face
  b.head.add(box(1.75, 1.05, 1.1, C.belly, { r: 0.4, y: -0.2, z: 1.7 }));                  // muzzle (upper jaw)
  b.head.add(box(0.85, 0.5, 0.35, C.nose, { r: 0.15, y: 0.3, z: 2.25 }));                  // nose
  for (const s of [-1, 1]) {
    b.head.add(box(0.75, 0.75, 0.5, C.body, { r: 0.25, x: s * 1.15, y: 1.95, z: 0.2 }));   // ears
    b.head.add(box(0.4, 0.4, 0.3, C.maneDark, { r: 0.12, x: s * 1.15, y: 1.95, z: 0.42 }));
    for (const k of [0.25, 0.55]) b.head.add(box(0.16, 0.42, 0.16, C.tooth, { r: 0.05, x: s * k, y: -0.85, z: 2.05 }));   // upper teeth
  }
  b.head.add(box(1.45, 0.12, 0.9, C.mouth, { r: 0.05, y: -0.72, z: 1.65 }));               // roof of the mouth
  b.eyes = []; b.brows = []; b.lids = [];
  for (const s of [-1, 1]) {
    const e = pivot(b.head, s * 0.62, 0.95, 1.62);
    e.add(box(0.62, 0.66, 0.12, C.eye, { r: 0.12, rough: 0.3 }));
    const p = box(0.32, 0.42, 0.1, C.pupil, { r: 0.08, rough: 0.2 }); p.position.set(s * -0.04, -0.03, 0.05); e.add(p);
    e.add(box(0.12, 0.12, 0.06, 'ffffff', { r: 0.03, rough: 0.1, x: s * -0.1, y: 0.12, z: 0.1 }));
    const lid = pivot(b.head, s * 0.62, 1.3, 1.66); lid.add(box(0.72, 0.72, 0.1, C.body, { r: 0.1, y: -0.36 })); lid.scale.y = 0.001;
    const brow = pivot(b.head, s * 0.62, 1.42, 1.66); brow.add(box(0.8, 0.18, 0.14, C.brow, { r: 0.06 }));
    b.eyes.push(e); b.lids.push(lid); b.brows.push(brow);
  }
  b.jaw = pivot(b.head, 0, -0.75, 1.2);
  b.jaw.add(box(1.55, 0.45, 1.2, C.belly, { r: 0.2, y: -0.2, z: 0.5 }));
  b.jaw.add(box(1.25, 0.08, 0.95, C.tongue, { r: 0.04, y: 0.04, z: 0.45 }));
  for (const s of [-1, 1]) b.jaw.add(box(0.15, 0.32, 0.15, C.tooth, { r: 0.05, x: s * 0.5, y: 0.15, z: 0.95 }));
  // Legs: upper (pivot at the body), lower + paw (pivot at the knee).
  b.legs = {};
  for (const [k, x, z] of [['FL', -0.95, 2.15], ['FR', 0.95, 2.15], ['BL', -0.95, -2.3], ['BR', 0.95, -2.3]]) {
    const up = pivot(b.hips, x, 0, z); up.add(box(1.05, LION.upper + 0.5, 1.15, C.body, { r: 0.4, y: -LION.upper / 2 + 0.1 }));
    const lo = pivot(up, 0, -LION.upper, 0); lo.add(box(0.9, LION.lower, 0.95, C.body, { r: 0.35, y: -LION.lower / 2 + 0.1 }));
    const paw = pivot(lo, 0, -LION.lower + 0.15, 0); paw.add(box(1.1, 0.42, 1.35, C.paw, { r: 0.18, y: -0.05, z: 0.15 }));
    for (const c of [-0.32, 0, 0.32]) paw.add(box(0.16, 0.14, 0.2, C.claw, { r: 0.04, x: c, y: -0.06, z: 0.86 }));
    b.legs[k] = { up, lo, paw };
  }
  // Tail: four segments and a dark tuft.
  b.tail = []; let parent = b.body, z0 = -3.2, y0 = 1.3;
  for (let i = 0; i < 4; i++) {
    const p = pivot(parent, 0, y0, z0); p.add(box(0.42, 0.42, 1.3, C.body, { r: 0.18, z: -0.6 }));
    b.tail.push(p); parent = p; z0 = -1.15; y0 = 0;
  }
  b.tail[3].add(box(0.8, 0.8, 0.9, C.tuft, { r: 0.35, z: -1.35 }));
  root.userData.bones = b;
  return { root, bones: b };
}

// Pose fields (all optional; radians): hipY (studs), pitch (body nose-down +), roll, headPitch (down +), headYaw, headRoll,
// jaw 0..1, lid 0..1 (eyes closed), brow (+ angry, - worried), breathe 0..1, tail {lift, sway, curl},
// legs {FL,FR,BL,BR: {up (swing forward +), knee (bend +), side (out +)}}.
export const REST = { hipY: 0, pitch: 0, roll: 0, headPitch: 0, headYaw: 0, headRoll: 0, jaw: 0, lid: 0, brow: 0, breathe: 0,
  tailLift: 0.4, tailSway: 0, tailCurl: 0, legs: { FL: { up: 0, knee: 0, side: 0 }, FR: { up: 0, knee: 0, side: 0 }, BL: { up: 0, knee: 0, side: 0 }, BR: { up: 0, knee: 0, side: 0 } } };
const LEGS = ['FL', 'FR', 'BL', 'BR'];
export function full(p = {}) {
  const legs = {};
  for (const k of LEGS) legs[k] = { ...REST.legs[k], ...((p.legs || {})[k] || {}) };
  return { ...REST, ...p, legs };
}
export function mixLion(a, b, u) {
  const L = (x, y) => x + (y - x) * u, o = { legs: {} };
  for (const k of Object.keys(REST)) if (k !== 'legs') o[k] = L(a[k] ?? REST[k], b[k] ?? REST[k]);
  for (const k of LEGS) o.legs[k] = { up: L(a.legs[k].up, b.legs[k].up), knee: L(a.legs[k].knee, b.legs[k].knee), side: L(a.legs[k].side, b.legs[k].side) };
  return o;
}

// ---------- presets ----------
export const lionStand = (t = 0) => full({ breathe: 0.5 + 0.5 * Math.sin(t * 2.4), tailSway: 0.35 * Math.sin(t * 1.7), tailCurl: 0.15, headYaw: 0.08 * Math.sin(t * 0.9) });
// Walk / stalk: `phase` in cycles (distance / LION.stride); diagonal pairs move together. low 0..1 crouches (stalking).
export function lionWalk(phase, t = 0, low = 0) {
  const a = phase * Math.PI * 2, leg = (o) => ({ up: 0.45 * Math.sin(a + o), knee: 0.55 * Math.max(0, Math.cos(a + o)), side: 0 });
  return full({ hipY: -0.6 * low - 0.06 * Math.abs(Math.sin(a * 2)), pitch: 0.05 + 0.08 * low, headPitch: 0.2 * low, brow: 0.6 * low,
    tailSway: 0.3 * Math.sin(a), tailLift: 0.2, legs: { FL: leg(0), BR: leg(0), FR: leg(Math.PI), BL: leg(Math.PI) } });
}
// Roar: head up, jaws wide, brows down. k 0..1 blends in, t shakes.
export const lionRoar = (t = 0) => full({ pitch: -0.12, hipY: -0.15, headPitch: -0.55, headYaw: 0.05 * Math.sin(t * 31), jaw: 1, brow: 1, breathe: 1, tailLift: 0.9, tailSway: 0.2 * Math.sin(t * 9),
  legs: { FL: { up: 0.25, knee: 0, side: 0.12 }, FR: { up: 0.25, knee: 0, side: 0.12 }, BL: { up: -0.2, knee: 0.3, side: 0 }, BR: { up: -0.2, knee: 0.3, side: 0 } } });
// Crouch before a jump: low and coiled, back legs folded, tail flicking.
export const lionCrouch = (t = 0) => full({ hipY: -1.1, pitch: 0.12, headPitch: 0.15, brow: 0.8, tailSway: 0.4 * Math.sin(t * 14), tailLift: 0.0,
  legs: { FL: { up: 0.35, knee: 1.0, side: 0 }, FR: { up: 0.35, knee: 1.0, side: 0 }, BL: { up: 0.7, knee: 1.6, side: 0 }, BR: { up: 0.7, knee: 1.6, side: 0 } } });
// In the air: front legs reaching forward (or tucked up for a straight-up jump), back legs stretched back.
export const lionLeap = (tuck = 0) => full({ pitch: -0.25 * (1 - tuck), headPitch: 0.1, brow: 0.6, jaw: 0.3, tailLift: 0.7,
  legs: { FL: { up: 1.0 - 0.3 * tuck, knee: 0.3 + 1.2 * tuck, side: 0 }, FR: { up: 1.0 - 0.3 * tuck, knee: 0.3 + 1.2 * tuck, side: 0 },
    BL: { up: -0.9 + 1.5 * tuck, knee: 0.3 + 1.2 * tuck, side: 0 }, BR: { up: -0.9 + 1.5 * tuck, knee: 0.3 + 1.2 * tuck, side: 0 } } });
// Swat with the right front paw: u 0..1 (raise, sweep across, recover). dir +1 sweeps to the lion's left.
export function lionSwat(u, dir = 1) {
  const raise = Math.sin(Math.PI * Math.min(1, u / 0.45)) * (u < 0.45 ? 1 : 0) + (u >= 0.45 && u < 0.7 ? 1 - (u - 0.45) / 0.25 : 0);
  const sweep = u < 0.35 ? -0.5 * (u / 0.35) : u < 0.6 ? -0.5 + 1.4 * ((u - 0.35) / 0.25) : 0.9 * (1 - (u - 0.6) / 0.4);
  return full({ hipY: -0.25, pitch: -0.05, roll: 0.08 * dir * sweep, headPitch: 0.25, headYaw: -0.25 * dir * sweep, brow: 0.3, jaw: 0.15,
    tailSway: 0.4 * sweep, legs: { FR: { up: 0.6 + 1.0 * raise, knee: 0.4 + 0.5 * raise, side: dir * sweep * 0.9 }, FL: { up: 0.1, knee: 0.2, side: 0 }, BL: { up: 0, knee: 0.3, side: 0 }, BR: { up: 0, knee: 0.3, side: 0 } } });
}
// On its back, paws up, batting at the yarn; eyes shut, purring. Root roll is applied by the caller (placeLion roll=PI).
export const lionBelly = (t = 0) => full({ headPitch: -0.3, headRoll: 0.35, headYaw: 0.5, lid: 0.85, brow: -0.5, jaw: 0.08 + 0.04 * Math.sin(t * 22), breathe: 0.5 + 0.5 * Math.sin(t * 6),
  tailCurl: 0.6 * Math.sin(t * 2), tailLift: 0.3,
  legs: { FL: { up: 0.9 + 0.35 * Math.sin(t * 7), knee: 1.4, side: 0.15 }, FR: { up: 0.9 + 0.35 * Math.sin(t * 7 + 2), knee: 1.4, side: 0.15 },
    BL: { up: 0.4, knee: 1.5, side: 0.25 }, BR: { up: 0.4, knee: 1.5, side: 0.25 } } });

export function lionPose(lion, p) {
  const b = lion.bones;
  b.hips.position.y = LION.hip + p.hipY; b.hips.rotation.set(p.pitch, 0, p.roll);
  b.body.scale.set(1 + 0.02 * p.breathe, 1 + 0.035 * p.breathe, 1);
  b.neck.rotation.set(-0.15 + p.headPitch * 0.4, p.headYaw * 0.4, 0);
  b.head.rotation.set(p.headPitch * 0.6 - p.pitch * 0.5, p.headYaw * 0.6, p.headRoll);
  b.jaw.rotation.x = 0.75 * p.jaw;
  for (const l of b.lids) l.scale.y = Math.max(0.001, p.lid);
  b.brows.forEach((w, i) => { const s = i ? 1 : -1; w.rotation.z = -s * 0.45 * p.brow; w.position.y = 1.42 - 0.1 * Math.abs(p.brow); });
  b.tail.forEach((s, i) => s.rotation.set(-p.tailLift * (i === 0 ? 1 : 0.35) + (i ? 0.25 : 0), p.tailSway * (0.5 + i * 0.3) + p.tailCurl * (i + 1) * 0.4, 0));
  for (const k of LEGS) {
    const q = p.legs[k], l = b.legs[k], s = k[1] === 'L' ? -1 : 1;
    l.up.rotation.set(-q.up - p.pitch, 0, s * q.side, 'ZXY'); l.lo.rotation.x = q.knee; l.paw.rotation.x = q.up - q.knee + p.pitch;
  }
}
// Lowest point of the four paws in world space (grounding while standing or walking).
const v3 = new THREE.Vector3();
export function lionSole(lion) {
  lion.root.updateMatrixWorld(true); let min = Infinity;
  for (const k of LEGS) for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.85], [0.5, 0.85]]) { v3.set(x, -0.26, z).applyMatrix4(lion.bones.legs[k].paw.matrixWorld); min = Math.min(min, v3.y); }
  return min;
}
export const lionHead = (lion) => lion.bones.head.localToWorld(new THREE.Vector3(0, 0.5, 0.8));
export const lionMouth = (lion) => lion.bones.head.localToWorld(new THREE.Vector3(0, -0.6, 2.2));
export const lionPaw = (lion, k = 'FR') => lion.bones.legs[k].paw.localToWorld(new THREE.Vector3(0, -0.1, 0.4));
