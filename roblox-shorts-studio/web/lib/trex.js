// Blocky Roblox-style T-rex, eggs and a nest (original builds for the Steal an Egg parody).
// The T-rex is a rigid-part rig like the R6 cast: rounded boxes on pivot groups, posed procedurally by rexPose().
// Units are studs (a character is 5 tall); the rex stands about 17 tall and 30 long, facing +Z. Root sits on the ground.
import * as THREE from 'three';
import { mat, roundedBox } from './rig.js';
import { canvasTexture } from './world.js';

export const REX_COLORS = { body: '4f9a3e', belly: 'e2dc9c', dark: '2f6a28', claw: 'f4eedb', tooth: 'fcfcf6', mouth: '8a2a36', tongue: 'd8586a', eye: 'ffd23f', pupil: '140f08' };
const C = REX_COLORS;
const G = () => new THREE.Group();
function box(w, h, d, color, { r = 0.3, rough = 0.55, x = 0, y = 0, z = 0 } = {}) {
  const m = new THREE.Mesh(roundedBox(w, h, d, r), mat(color, rough, { clearcoat: 0.25, clearcoatRoughness: 0.5 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
const pivot = (parent, x, y, z) => { const g = G(); g.position.set(x, y, z); parent.add(g); return g; };

export const REX = { hip: 11, thigh: 5.6, shin: 5.0, stride: 26 };   // `stride`: studs travelled per run cycle at scale 1 (feet stay planted)

export function makeTRex() {
  const root = G(); root.name = 'TRex';
  const b = {};
  b.hips = pivot(root, 0, REX.hip, 0);
  // Body: a short, deep block (the classic tilted T-rex torso) with a pale belly, back stripes and a ridge of plates.
  b.body = pivot(b.hips, 0, 0, 0);
  b.body.add(box(8.2, 8.2, 11, C.body, { r: 1.4, y: 1.0, z: 1.2 }));
  b.body.add(box(6.6, 4.4, 9.2, C.belly, { r: 1.1, y: -1.6, z: 2.2 }));
  for (let i = 0; i < 3; i++) b.body.add(box(8.35, 0.7, 1.3, C.dark, { r: 0.3, y: 3.0, z: -2.4 + i * 2.9 }));
  for (let i = 0; i < 5; i++) b.body.add(box(0.8, 1.3 - Math.abs(i - 2) * 0.15, 1.5, C.dark, { r: 0.3, y: 5.4, z: -3 + i * 2.1 }));
  // Tiny arms.
  b.arms = [];
  for (const s of [-1, 1]) {
    const a = pivot(b.body, s * 4.0, -0.2, 5.8); a.add(box(1.2, 2.4, 1.2, C.body, { r: 0.4, y: -1.0 }));
    const f = pivot(a, 0, -2.1, 0); f.add(box(1.0, 1.8, 1.0, C.body, { r: 0.35, y: -0.7, z: 0.4 }));
    for (const c of [-0.25, 0.25]) f.add(box(0.28, 0.7, 0.28, C.claw, { r: 0.1, x: c, y: -1.7, z: 0.7 }));
    a.rotation.x = -0.9; f.rotation.x = -0.9; b.arms.push({ a, f });
  }
  // Thick neck and a BIG head: cranium, snout, brow, big cartoon eyes with lids, nostrils, teeth; jaw on its own pivot.
  b.neck = pivot(b.body, 0, 3.4, 5.4); b.neck.add(box(6.0, 6.2, 5.6, C.body, { r: 1.3, y: 2.2, z: 0.8 }));
  b.neck.add(box(4.6, 4.6, 1.2, C.belly, { r: 0.5, y: 1.2, z: 3.4 }));
  b.head = pivot(b.neck, 0, 4.6, 1.4);
  b.head.add(box(7.4, 6.2, 7.4, C.body, { r: 1.4, y: 0.9, z: 1.8 }));
  b.head.add(box(6.2, 3.8, 7.4, C.body, { r: 1.0, y: 0.1, z: 7.6 }));               // snout (upper jaw)
  b.head.add(box(5.2, 0.5, 6.8, C.mouth, { r: 0.2, y: -1.65, z: 7.0 }));            // roof of the mouth
  for (const s of [-1, 1]) {
    b.head.add(box(2.4, 1.0, 3.2, C.dark, { r: 0.4, x: s * 2.6, y: 4.0, z: 2.6 }));   // brow ridge
    b.head.add(box(0.9, 0.55, 0.9, C.pupil, { r: 0.18, x: s * 1.5, y: 1.95, z: 10.9 })); // nostril
    for (let i = 0; i < 7; i++) b.head.add(box(0.5, 0.95, 0.5, C.tooth, { r: 0.14, x: s * 2.75, y: -1.95, z: 4.6 + i * 0.95 }));
  }
  for (const x of [-1.6, -0.55, 0.55, 1.6]) b.head.add(box(0.5, 0.95, 0.5, C.tooth, { r: 0.14, x, y: -1.95, z: 11.0 }));
  b.eyes = []; b.lids = [];
  for (const s of [-1, 1]) {
    const e = pivot(b.head, s * 3.72, 2.3, 3.0); e.rotation.y = s * 0.25;
    e.add(box(0.3, 2.2, 2.2, C.eye, { r: 0.2, rough: 0.3 }));
    const p = box(0.34, 1.6, 0.66, C.pupil, { r: 0.15, rough: 0.2 }); p.position.set(s * 0.02, -0.05, 0.2); e.add(p);
    const glint = box(0.36, 0.4, 0.4, 'ffffff', { r: 0.08, rough: 0.1 }); glint.position.set(s * 0.03, 0.45, 0.5); e.add(glint);
    const lidP = pivot(b.head, s * 3.78, 3.45, 3.0); lidP.rotation.y = s * 0.25; lidP.add(box(0.55, 2.35, 2.45, C.body, { r: 0.25, y: -1.17 }));
    b.eyes.push(e); b.lids.push(lidP);
  }
  b.jaw = pivot(b.head, 0, -1.9, 2.2);
  b.jaw.add(box(6.0, 1.9, 9.6, C.body, { r: 0.8, y: -0.8, z: 4.6 }));
  b.jaw.add(box(5.2, 1.4, 8.0, C.belly, { r: 0.5, y: -1.2, z: 4.2 }));
  b.jaw.add(box(4.8, 0.4, 7.8, C.tongue, { r: 0.18, y: 0.05, z: 4.4 }));
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) b.jaw.add(box(0.48, 0.85, 0.48, C.tooth, { r: 0.14, x: s * 2.45, y: 0.45, z: 3.0 + i * 1.05 }));
  // Tail: five tapering segments, each on its own pivot so it can sway and curl.
  b.tail = []; let parent = b.body, z0 = -4.0;
  for (let i = 0; i < 5; i++) {
    const w = 6.6 - i * 1.2, h = 6.4 - i * 1.15, len = 5.0 - i * 0.3;
    const p = pivot(parent, 0, i === 0 ? 1.6 : 0, z0); p.add(box(w, h, len + 0.6, i % 2 ? C.dark : C.body, { r: Math.min(1.2, w * 0.2), z: -len / 2 }));
    if (i < 3) p.add(box(0.7, 1.0, 1.3, C.dark, { r: 0.25, y: h / 2 + 0.2, z: -len / 2 }));
    b.tail.push(p); parent = p; z0 = -len;
  }
  // Legs: big thighs, shin and a clawed foot.
  b.legs = [];
  for (const s of [-1, 1]) {
    const thigh = pivot(b.hips, s * 3.7, -0.2, -0.4);
    thigh.add(box(3.8, 6.8, 5.4, C.body, { r: 1.2, y: -2.6, z: 0.5 }));
    const shin = pivot(thigh, 0, -REX.thigh, 0.4); shin.add(box(2.4, REX.shin + 0.7, 2.5, C.body, { r: 0.7, y: -REX.shin / 2, z: -0.2 }));
    const foot = pivot(shin, 0, -REX.shin, -0.2);
    foot.add(box(3.4, 1.0, 4.4, C.dark, { r: 0.4, y: -0.1, z: 1.1 }));
    for (const c of [-1.05, 0, 1.05]) foot.add(box(0.6, 0.6, 1.0, C.claw, { r: 0.18, x: c, y: -0.25, z: 3.6 }));
    b.legs.push({ thigh, shin, foot, side: s });
  }
  root.userData.bones = b;
  return { root, bones: b };
}

// A pose: every field optional, so presets can be blended with mixRex(). Angles in radians.
export const REST = { hipY: 0, pitch: 0, roll: 0, neck: 0, head: 0, headYaw: 0, headRoll: 0, jaw: 0.05, lid: 0, breathe: 0,
  tailLift: 0, tailSway: 0, tailCurl: 0, legs: [{ thigh: 0, knee: 0, foot: 0 }, { thigh: 0, knee: 0, foot: 0 }], arms: 0 };
export function mixRex(a, b, u) {
  const L = (x, y) => x + (y - x) * u;
  const o = {};
  for (const k of Object.keys(REST)) {
    if (k === 'legs') o.legs = [0, 1].map((i) => ({ thigh: L(a.legs[i].thigh, b.legs[i].thigh), knee: L(a.legs[i].knee, b.legs[i].knee), foot: L(a.legs[i].foot, b.legs[i].foot) }));
    else o[k] = L(a[k] ?? REST[k], b[k] ?? REST[k]);
  }
  return o;
}
const full = (p) => ({ ...REST, ...p, legs: p.legs || REST.legs });

// Presets.
export const rexStand = (t = 0) => full({ breathe: 0.5 + 0.5 * Math.sin(t * 2.2), tailSway: 0.12 * Math.sin(t * 1.4), head: 0.05 * Math.sin(t * 1.1), pitch: 0.06, neck: -0.05 });
export function rexSleep(t = 0) {
  // Belly on the ground, legs folded under, head resting on the ground, tail curled round the side, slow breathing.
  const br = 0.5 + 0.5 * Math.sin(t * 1.6);
  return full({ hipY: -REX.hip + 4.25 + 0.1 * br, pitch: 0.15, neck: 1.2, head: -1.25 + 0.04 * br, headRoll: 0.05, headYaw: 0.12, jaw: 0, lid: 1, breathe: br,
    tailLift: -0.15, tailCurl: 0.28, legs: [{ thigh: 1.25, knee: 2.55, foot: 0 }, { thigh: 1.25, knee: 2.55, foot: 0 }], arms: 0.4 });
}
export const rexRoar = (t = 0) => full({ pitch: -0.12, neck: -0.3, head: -0.05, jaw: 1, headYaw: 0.06 * Math.sin(t * 30), breathe: 1, tailLift: 0.25, tailSway: 0.08 * Math.sin(t * 9) });
// Run cycle: `phase` in cycles (distance / REX.stride). Legs swing in opposition, body bobs twice per cycle.
export function rexRun(phase, t = 0) {
  const a = phase * Math.PI * 2, leg = (o) => { const s = Math.sin(a + o), c = Math.cos(a + o); return { thigh: 0.62 * s, knee: 0.35 + 0.55 * Math.max(0, c), foot: -0.3 * s }; };
  return full({ hipY: -0.6 + 0.5 * Math.abs(Math.cos(a)), pitch: 0.28, neck: 0.1, head: -0.2, jaw: 0.25, roll: 0.05 * Math.sin(a),
    tailLift: 0.12, tailSway: 0.18 * Math.sin(a), legs: [leg(0), leg(Math.PI)], arms: 0.3 * Math.sin(a * 2) });
}
// Headbutt / swipe: u 0..1 (wind up, strike, recover).
export function rexHeadbutt(u) {
  const k = u < 0.35 ? -Math.sin((u / 0.35) * Math.PI / 2) * 0.5 : u < 0.55 ? -0.5 + 1.6 * ((u - 0.35) / 0.2) : 1.1 * (1 - (u - 0.55) / 0.45);
  return full({ pitch: 0.2 + 0.25 * Math.max(0, k), neck: 0.5 * k, head: 0.3 * k, jaw: u > 0.35 && u < 0.6 ? 0.6 : 0.1, tailLift: 0.2 - 0.2 * k });
}

export function rexPose(rex, p) {
  const b = rex.bones;
  const pitch = -0.1 + p.pitch;   // natural stance: chest up
  b.hips.position.y = REX.hip + p.hipY; b.hips.rotation.set(pitch, 0, p.roll);
  b.body.scale.set(1 + 0.015 * p.breathe, 1 + 0.03 * p.breathe, 1);
  b.neck.rotation.set(0.45 + p.neck, 0, 0); b.head.rotation.set(-0.3 + p.head, p.headYaw, p.headRoll); b.jaw.rotation.x = 0.85 * p.jaw;
  for (const l of b.lids) l.scale.y = Math.max(0.001, p.lid);
  b.tail.forEach((s, i) => s.rotation.set(-p.tailLift * (i === 0 ? 1 : 0.4) + (i ? 0.06 : 0), p.tailSway * (0.5 + i * 0.25) + p.tailCurl * (i + 1) * 0.55, 0));
  b.legs.forEach((l, i) => { const q = p.legs[i]; l.thigh.rotation.x = -q.thigh - pitch; l.shin.rotation.x = q.knee; l.foot.rotation.x = q.foot - q.knee + q.thigh; });
  for (const { a, f } of b.arms) { a.rotation.x = -0.9 + p.arms; f.rotation.x = -0.9 - 0.5 * p.arms; }
}
// Lowest point of the feet in world space (for grounding while standing or running).
export function rexSole(rex) {
  rex.root.updateMatrixWorld(true); const v = new THREE.Vector3(); let min = Infinity;
  for (const l of rex.bones.legs) for (const [x, z] of [[-1.7, -1], [1.7, -1], [-1.7, 3.3], [1.7, 3.3]]) { v.set(x, -0.6, z).applyMatrix4(l.foot.matrixWorld); min = Math.min(min, v.y); }
  return min;
}
// World position of the snout tip and of the head centre (for hits, Zzz, cameras).
export const rexSnout = (rex) => rex.bones.head.localToWorld(new THREE.Vector3(0, 0.5, 11.4));
export const rexHeadCentre = (rex) => rex.bones.head.localToWorld(new THREE.Vector3(0, 1.2, 4));
export const rexEye = (rex, side = 1) => rex.bones.eyes[side > 0 ? 1 : 0].localToWorld(new THREE.Vector3(side * 0.2, 0, 0));

// ---------- eggs and nest ----------
function eggTexture(base, spot, seed = 1) {
  return canvasTexture(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    let s = seed * 9973; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) { x.fillStyle = spot; x.globalAlpha = 0.55 + r() * 0.45; x.beginPath(); x.ellipse(r() * w, r() * h, 6 + r() * 26, 5 + r() * 18, r() * 3, 0, 7); x.fill(); }
  });
}
const EGG_GEO = (() => { const g = new THREE.SphereGeometry(1, 48, 32); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 1.32); const k = 1 - 0.18 * Math.max(0, p.getY(i)) / 1.32; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); g.translate(0, 1.32, 0); return g; })();
// An egg standing on its base (pivot at the bottom). size = radius in studs.
export function makeEgg({ size = 1, base = '#f3ead2', spot = '#7a9b4e', seed = 1, golden = false } = {}) {
  const m = golden
    ? new THREE.MeshPhysicalMaterial({ color: '#ffcf3a', metalness: 0.85, roughness: 0.18, clearcoat: 1, emissive: '#ff9f1a', emissiveIntensity: 0.35, map: eggTexture('#ffd75a', '#e8a21a', seed) })
    : new THREE.MeshPhysicalMaterial({ map: eggTexture(base, spot, seed), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const egg = new THREE.Mesh(EGG_GEO, m); egg.scale.setScalar(size); egg.castShadow = true; egg.receiveShadow = true;
  const g = G(); g.add(egg); g.userData.egg = egg; return g;
}
// Nest: a straw bowl ringed by logs. Returns { group, slots } where slots are egg positions (local).
export function makeNest(radius = 7) {
  const g = G();
  const straw = new THREE.MeshStandardMaterial({ color: '#c8a35a', roughness: 0.95 }), strawDark = new THREE.MeshStandardMaterial({ color: '#9c7a3c', roughness: 1 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.85, 0.8, 40), straw); bowl.position.y = 0.4; bowl.receiveShadow = true; g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 1.0, 12, 48), strawDark); rim.rotation.x = Math.PI / 2; rim.position.y = 0.9; rim.scale.z = 0.7; rim.castShadow = rim.receiveShadow = true; g.add(rim);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2, log = box(0.9, 0.9, radius * 0.8, '7a4e2a', { r: 0.35, rough: 0.9 });
    log.position.set(Math.cos(a) * (radius + 0.6), 1.1, Math.sin(a) * (radius + 0.6)); log.rotation.y = -a + Math.PI / 2 + 0.3; log.rotation.z = 0.15; g.add(log);
  }
  const slots = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = radius * (i % 2 ? 0.55 : 0.75); slots.push(new THREE.Vector3(Math.cos(a) * rr, 0.8, Math.sin(a) * rr)); }
  return { group: g, slots, centre: new THREE.Vector3(0, 0.8, 0) };
}
export const EGG_COLORS = [['#f3ead2', '#7a9b4e'], ['#d9eef7', '#4a86b8'], ['#f7dfe8', '#c4507a'], ['#f2f0c8', '#b89a2e'], ['#e3f2d6', '#4e8a3a'], ['#efe2f7', '#7c52b0']];
