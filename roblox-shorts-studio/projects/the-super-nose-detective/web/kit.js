// The Super Nose Detective: cast extras and 70s Miami props, built in code (no pack accessory, so nothing to fit-check:
// the nose and the sunglasses sit in front of the face, clear of hair, checked in the look test from every side).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { part, canvasTexture } from '../../../web/lib/world.js';
import { packTexture } from '../../../web/lib/robloxPack.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

// ---------- cast ----------
// Swap the body atlas (outfits made by source/make_outfits.py: same layout, head swatch kept).
export async function wearOutfit(actor, file) {
  const tex = await new THREE.TextureLoader().loadAsync(new URL(`./outfits/${file}`, import.meta.url).href);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  actor.root.traverse((o) => {
    if (!o.isMesh || o.name === 'Face' || o.name === 'Hair') return;
    if (o.material.map) { o.material = o.material.clone(); o.material.map = tex; }
  });
}

// Max's Super Nose: a long, slightly hooked block-style nose between the eyes and the mouth (head-local coords:
// head bone pivot is the neck at y 4; the face is the +Z side at z 0.6; eyes at y ~0.78, mouth at ~0.26).
// Returns the group (on the Head bone) with userData.glow (0..1 green gamepass glow) and .inflate (sneeze swell).
export function makeNose(actor, skin = '#F0B774') {
  const g = new THREE.Group(); g.name = 'SuperNose';
  const m = std(skin, { roughness: 0.5, emissive: new THREE.Color('#39ff6a'), emissiveIntensity: 0 });
  const dark = std(new THREE.Color(skin).multiplyScalar(0.55));
  const root = V(0, 0.6, 0.58);
  // A wedge: tall and wide where it meets the face (between the eyes), tapering forward and drooping down to the tip.
  const pts = [];
  for (const s of [-1, 1]) pts.push(V(0.12 * s, 0.74, 0.57), V(0.24 * s, 0.47, 0.57), V(0.09 * s, 0.72, 0.68),
    V(0.1 * s, 0.56, 1.2), V(0.12 * s, 0.41, 1.18), V(0.17 * s, 0.41, 0.95));
  const wedge = mesh(new ConvexGeometry(pts), m); g.add(wedge);
  const bulb = mesh(new THREE.SphereGeometry(0.175, 24, 16), m); bulb.position.set(0, 0.47, 1.18); bulb.scale.set(1.15, 1, 1); g.add(bulb);
  for (const s of [-1, 1]) {
    const wing = mesh(new THREE.SphereGeometry(0.13, 16, 12), m); wing.position.set(0.16 * s, 0.45, 1.0); wing.scale.set(1, 0.9, 1.2); g.add(wing);
    const hole = mesh(new THREE.SphereGeometry(0.05, 10, 8), dark); hole.position.set(0.075 * s, 0.38, 1.15); hole.scale.set(1, 0.5, 1.3); g.add(hole);
  }
  g.userData = { mat: m, base: root.clone(), glow: 0, inflate: 0 };
  // Pivot the whole nose at its root so it can swell and twitch from the face.
  const pivot = new THREE.Group(); pivot.position.copy(root); g.position.copy(root).negate(); pivot.add(g);
  pivot.userData = g.userData;
  actor.bones.Head.add(pivot);
  return pivot;
}
export function setNose(nose, { glow = 0, inflate = 0, twitch = 0 } = {}) {
  nose.userData.mat.emissiveIntensity = glow * 0.9;
  nose.scale.setScalar(1 + inflate);
  nose.rotation.set(-0.05 * inflate + twitch * 0.08, twitch * 0.12, 0);
}

// Sunglasses for the head bone: dark lenses and a frame across the eyes, arms back to just in front of the hair line.
export function makeSunglasses(actor, frame = '#151515', lens = '#202630') {
  const g = new THREE.Group(); g.name = 'Sunglasses';
  const fm = std(frame, { roughness: 0.3, metalness: 0.4 }), lm = new THREE.MeshPhysicalMaterial({ color: lens, roughness: 0.08, metalness: 0.2, clearcoat: 1 });
  g.add(mesh(new THREE.BoxGeometry(1.04, 0.06, 0.06), fm, 0, 0.88, 0.64));
  for (const s of [-1, 1]) {
    const l = mesh(new RoundedBoxGeometry(0.44, 0.26, 0.05, 2, 0.05), lm, 0.25 * s, 0.77, 0.645); g.add(l);
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.05, 0.45), fm, 0.6 * s, 0.86, 0.42));
  }
  actor.bones.Head.add(g);
  return g;
}

// ---------- props ----------
// The Golden Donut (whole or a half): gold ring with pink icing and sprinkles. `half`: 'L' | 'R' | null.
const SPRINKLES = ['#ff5d7a', '#7fe3dd', '#ffffff', '#ffd23f', '#a56dff'];
export function donut(half = null, scale = 1) {
  const g = new THREE.Group(), arc = half ? Math.PI : Math.PI * 2, start = half === 'R' ? Math.PI : 0;
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.32, 18, 40, arc), std('#f2b630', { metalness: 0.75, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.4 }));
  ring.rotation.set(Math.PI / 2, 0, start); g.add(ring);
  const icing = mesh(new THREE.TorusGeometry(0.62, 0.25, 14, 40, arc), std('#ffd6ec', { roughness: 0.35, emissive: '#ff9ccd', emissiveIntensity: 0.15 }));
  icing.rotation.set(Math.PI / 2, 0, start); icing.position.y = 0.11; icing.scale.set(1, 1, 0.7); g.add(icing);
  for (let i = 0; i < 26; i++) {
    const a = start + (i / 26) * arc + 0.07, r = 0.62 + 0.13 * Math.sin(i * 2.3);
    const sp = mesh(new THREE.CapsuleGeometry(0.025, 0.09, 2, 6), std(SPRINKLES[i % 5])); sp.position.set(Math.cos(a) * r, 0.33, -Math.sin(a) * r); sp.rotation.set(Math.PI / 2, 0, i * 1.7); g.add(sp);
  }
  g.scale.setScalar(scale); return g;
}

// A striped tube sock (foot towards +Z), with a few sprinkles stuck on it (plant 2).
export function sock(scale = 1) {
  const g = new THREE.Group(), tex = canvasTexture(64, 256, (c) => { c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 64, 256); for (const [y, col] of [[18, '#e0405a'], [44, '#2d7fd6'], [70, '#e0405a']]) { c.fillStyle = col; c.fillRect(0, y, 64, 14); } });
  const leg = mesh(new THREE.CylinderGeometry(0.28, 0.26, 1.6, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), 0, 0.8, 0); g.add(leg);
  const foot = mesh(new THREE.CapsuleGeometry(0.26, 0.6, 6, 16), std('#f4f1ea', { roughness: 0.9 })); foot.rotation.x = Math.PI / 2; foot.position.set(0, 0.05, 0.4); g.add(foot);
  for (let i = 0; i < 5; i++) { const sp = mesh(new THREE.CapsuleGeometry(0.02, 0.07, 2, 6), std(SPRINKLES[i])); sp.position.set(0.27 * Math.cos(i * 1.3), 0.4 + i * 0.2, 0.27 * Math.sin(i * 1.3)); sp.rotation.z = i; g.add(sp); }
  g.scale.setScalar(scale); return g;
}
// Clear evidence bag with a label.
export function evidenceBag(item) {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new RoundedBoxGeometry(1.5, 2.6, 0.5, 2, 0.12), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  bag.position.y = 1.2; bag.renderOrder = 2; g.add(bag);
  const lab = mesh(new THREE.PlaneGeometry(1.3, 0.42), new THREE.MeshStandardMaterial({ map: canvasTexture(256, 84, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 84); c.fillStyle = '#d02030'; c.fillRect(0, 0, 256, 26); c.font = 'bold 20px sans-serif'; c.fillStyle = '#ffffff'; c.fillText('EVIDENCE', 80, 20); c.fillStyle = '#152435'; c.font = 'bold 22px sans-serif'; c.fillText('CASE #1  SOCK', 40, 62); }) }));
  lab.position.set(0, 2.2, 0.26); g.add(lab);
  if (item) { item.position.y = 0.3; g.add(item); }
  return g;
}

// Pink 70s convertible (front towards +Z). userData.wheels spin with distance.
export function convertible(color = '#f27aa8') {
  const g = new THREE.Group(), body = std(color, { metalness: 0.35, roughness: 0.3 }), chrome = std('#e8eef4', { metalness: 1, roughness: 0.15 }), tire = std('#1b1b1f', { roughness: 0.9 });
  const lower = mesh(new RoundedBoxGeometry(5.4, 1.3, 11.5, 3, 0.35), body, 0, 1.25, 0); g.add(lower);
  const hood = mesh(new RoundedBoxGeometry(5.2, 0.5, 4, 3, 0.2), body, 0, 2.0, 3.6); g.add(hood);
  const trunk = mesh(new RoundedBoxGeometry(5.2, 0.5, 3, 3, 0.2), body, 0, 2.0, -4.1); g.add(trunk);
  const seat = mesh(new RoundedBoxGeometry(4.6, 1.0, 1.0, 2, 0.2), std('#fff3e6', { roughness: 0.6 }), 0, 2.2, -1.6); g.add(seat);
  const seat2 = mesh(new RoundedBoxGeometry(4.6, 0.4, 3.2, 2, 0.15), std('#fff3e6', { roughness: 0.6 }), 0, 1.85, -0.4); g.add(seat2);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 0.08), new THREE.MeshPhysicalMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false })); glass.position.set(0, 2.75, 1.45); glass.rotation.x = -0.35; g.add(glass);
  g.add(mesh(new THREE.BoxGeometry(5.6, 0.25, 0.4), chrome, 0, 0.9, 5.85), mesh(new THREE.BoxGeometry(5.6, 0.25, 0.4), chrome, 0, 0.9, -5.85));
  const wheel = mesh(new THREE.TorusGeometry(0.6, 0.3, 12, 24), tire);
  const wheels = [];
  for (const [x, z] of [[-2.55, 3.6], [2.55, 3.6], [-2.55, -3.6], [2.55, -3.6]]) {
    const w = new THREE.Group(); w.position.set(x, 0.9, z); const t = wheel.clone(); t.rotation.y = Math.PI / 2; w.add(t);
    const hub = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.62, 16), chrome); hub.rotation.z = Math.PI / 2; w.add(hub);
    const spoke = mesh(new THREE.BoxGeometry(0.66, 0.1, 0.7), std('#9aa3ad', { metalness: 0.8 })); w.add(spoke);
    g.add(w); wheels.push(w);
  }
  for (const s of [-1, 1]) { const hl = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), std('#fff7d6', { emissive: '#fff2b0', emissiveIntensity: 1.2 })); hl.rotation.x = Math.PI / 2; hl.position.set(1.9 * s, 1.5, 5.8); g.add(hl); }
  g.userData.wheels = wheels;
  return g;
}
export function rollWheels(car, dist) { car.userData.wheels.forEach((w) => { w.rotation.x = dist / 0.9; }); }

// Black-and-white 70s police car with a red/blue light bar (lights flash with t).
export function policeCar() {
  const g = new THREE.Group(), white = std('#f2f2f2', { metalness: 0.3, roughness: 0.35 }), black = std('#1d2230', { metalness: 0.3, roughness: 0.35 }), tire = std('#1b1b1f', { roughness: 0.9 });
  g.add(mesh(new RoundedBoxGeometry(5.4, 1.4, 12, 3, 0.35), black, 0, 1.3, 0));
  g.add(mesh(new RoundedBoxGeometry(5.3, 0.9, 5.2, 3, 0.3), white, 0, 1.6, 0));
  g.add(mesh(new RoundedBoxGeometry(4.8, 1.5, 5.0, 3, 0.4), white, 0, 2.9, -0.4));
  const win = std('#2a3a50', { roughness: 0.1, metalness: 0.5 });
  g.add(mesh(new THREE.BoxGeometry(4.9, 0.9, 4.0), win, 0, 3.05, -0.4));
  const red = std('#ff2a3a', { emissive: '#ff1a2a', emissiveIntensity: 0 }), blue = std('#2a6aff', { emissive: '#1a5aff', emissiveIntensity: 0 });
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), red, -0.9, 3.85, -0.4), mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), blue, 0.9, 3.85, -0.4));
  const badge = mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: canvasTexture(160, 100, (c) => { c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#E8B931'; c.beginPath(); c.moveTo(80, 8); c.lineTo(120, 30); c.lineTo(110, 80); c.lineTo(80, 94); c.lineTo(50, 80); c.lineTo(40, 30); c.fill(); c.fillStyle = '#152435'; c.font = 'bold 18px sans-serif'; c.fillText('POLICE', 46, 58); }) }));
  badge.position.set(2.66, 1.7, 0); badge.rotation.y = Math.PI / 2; g.add(badge);
  for (const [x, z] of [[-2.55, 3.8], [2.55, 3.8], [-2.55, -3.8], [2.55, -3.8]]) { const w = mesh(new THREE.TorusGeometry(0.6, 0.3, 12, 24), tire, x, 0.9, z); w.rotation.y = Math.PI / 2; g.add(w); }
  const lr = new THREE.PointLight('#ff2a3a', 0, 30, 2), lb = new THREE.PointLight('#2a6aff', 0, 30, 2); lr.position.set(-1, 5, -0.4); lb.position.set(1, 5, -0.4); g.add(lr, lb);
  g.userData = { red, blue, lr, lb };
  return g;
}
export function flashLights(car, t, k = 1) {
  const a = Math.floor(t * 6) % 2 === 0 ? 1 : 0;
  car.userData.red.emissiveIntensity = 3 * a * k; car.userData.blue.emissiveIntensity = 3 * (1 - a) * k;
  car.userData.lr.intensity = 60 * a * k; car.userData.lb.intensity = 60 * (1 - a) * k;
}

// Yellow-and-black crime-scene tape between two points (y = height).
export function tape(a, b, y = 3) {
  const d = a.distanceTo(b), tex = canvasTexture(512, 32, (c) => { c.fillStyle = '#ffd400'; c.fillRect(0, 0, 512, 32); c.fillStyle = '#111'; c.font = 'bold 22px sans-serif'; for (let x = 0; x < 512; x += 200) c.fillText('POLICE LINE  DO NOT CROSS', x, 24); });
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = d / 12;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(d, 0.45), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.6 }));
  m.position.copy(a).lerp(b, 0.5).setY(y); m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); m.castShadow = true;
  return m;
}

// Blocky palm tree.
export function palm(h = 16, seed = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) { const s = part(1.3 - i * 0.07, h / 7 + 0.1, 1.3 - i * 0.07, i % 2 ? '#8a5a32' : '#7a4e2a', { center: true }); s.position.set(Math.sin(i * 0.4 + seed) * 0.25 * i, (i + 0.5) * h / 7, 0); g.add(s); }
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + seed, leaf = part(1.4, 0.25, 6.5, i % 2 ? '#3f9a4a' : '#2f8a3e', { center: true }); leaf.position.set(Math.cos(a) * 2.8, h + 0.3 - 0.6, Math.sin(a) * 2.8); leaf.rotation.set(0.4, -a + Math.PI / 2, 0); g.add(leaf); }
  return g;
}

// Lip-sync for a pack character with the default face style: the expression's eyes layer + a mouth layer, composited once
// per pair. talk(expr, code) with code from web/lipsync.js: c closed, s small, w wide, o round, e teeth, n flat, - rest.
const REST_OWN = new Set(['happy', 'laugh', 'shocked', 'scared', 'surprised', 'smug', 'sleeping', 'love', 'evil_grin']);
const MOUTH = { c: 'mouth_closed', s: 'mouth_small', w: 'mouth_wide', o: 'mouth_o', e: 'mouth_e', n: 'neutral' };
export async function makeTalkingFace(actor, exprs) {
  const eyes = {}, mouths = {}, cache = new Map();
  await Promise.all(exprs.map(async (e) => { eyes[e] = (await packTexture(`faces/layers/eyes/${e}.png`)).image; mouths[e] = (await packTexture(`faces/layers/mouth/${e}.png`)).image; }));
  await Promise.all(Object.values(MOUTH).map(async (m) => { mouths[m] = (await packTexture(`faces/layers/mouth/${m}.png`)).image; }));
  return (expr, code) => {
    if (!eyes[expr]) return false;
    const rest = REST_OWN.has(expr) ? expr : 'neutral';          // between sentences: a calm flat mouth unless the expression's mouth is the point
    const m = code === '-' || !MOUTH[code] ? rest : MOUTH[code], key = expr + '|' + m;
    if (!cache.has(key)) cache.set(key, canvasTexture(1024, 1024, (g) => { g.drawImage(eyes[expr], 0, 0, 1024, 1024); g.drawImage(mouths[m], 0, 0, 1024, 1024); }));
    actor.face.material.map = cache.get(key); actor.face.material.needsUpdate = true; return true;
  };
}
