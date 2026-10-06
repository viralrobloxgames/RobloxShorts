// He Declared Himself Emperor: sets, props and clothing shells, all built in code (no pack accessories, so the fit
// check has nothing to fit). One place, San Francisco in 1859 (origin, floor y 0): a dirt street along x at z 0 with
// timber shopfronts behind it (z < -4: bank, store, the BULLETIN newspaper office), hills on the skyline, and the bay to
// the right (x > 22) with a wooden dock, rice sacks and ships; the Bay Bridge (hidden until its scene) spans the bay.
// Every prop is built with its origin where it is held and its front facing +z.
// WORK IN PROGRESS (overnight 2026-10-06): the street, bay, dock, ships and bridge exist; the hats (merchant's top hat,
// the emperor's feathered beaver hat) still need placing on bones.Head with a test render; the Capitol is not built yet.
import * as THREE from 'three';
import { canvasTexture } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };

export const STREET_Z = 0, BAY_X = 22, DOCK = V(26, 0, 2);

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, buttons = null, collar = null, belt = null } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 4; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.6, roughness: 0.3 }), 12, 0, 1.75 - i * 0.4, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (belt) { const b = box(2.16, 0.26, 1.16, std(belt, { roughness: 0.5 }), 0, 0.28, 0); actor.bones.Torso.add(b); parts.push(b); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}
// Norton's uniform: a navy officer's coat with brass buttons and a gold collar, and gold epaulettes (a pad with a fringe)
// on top of each shoulder, parented to the arm bones so they ride the shoulders.
export function nortonUniform(actor) {
  const d = dress(actor, { color: '#22325e', hem: 0.35, buttons: '#e0b23a', collar: '#e0b23a', belt: '#f4f2ec' });
  const gold = std('#e8bd3a', { metalness: 0.75, roughness: 0.3 });
  for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) {
    const pad = box(1.2, 0.16, 1.16, gold, sx * 0.5, 0.56, 0); actor.bones[bone].add(pad); d.parts.push(pad);
    for (let k = 0; k < 5; k++) { const f = box(0.08, 0.3, 0.08, gold, sx * 0.5 + (sx > 0 ? 0.52 : -0.52), 0.36, -0.44 + k * 0.22); actor.bones[bone].add(f); d.parts.push(f); }
  }
  return d;
}
// Hats, built with their origin at the inside of the crown (sits on the top of the head): a merchant's top hat, and the
// emperor's beaver hat with a gold band, a rosette and a long peacock feather. Attach with headHat(actor, hat).
export function hat({ feather = false } = {}) {
  const g = new THREE.Group(), felt = std('#1d1a1c', { roughness: 0.7 }), gold = std('#e8bd3a', { metalness: 0.75, roughness: 0.3 });
  g.add(cyl(0.88, 0.88, 0.08, felt, 28, 0, 0.04, 0), cyl(0.62, 0.66, 1.3, felt, 28, 0, 0.7, 0));
  if (feather) {
    g.add(cyl(0.67, 0.67, 0.16, gold, 28, 0, 0.22, 0), cyl(0.16, 0.16, 0.06, std('#c1121f'), 16, 0.5, 0.3, 0.45));
    const f = new THREE.Group(); f.position.set(0.55, 0.3, 0.35); f.rotation.set(-0.25, 0, -0.35);
    f.add(box(0.05, 1.9, 0.05, std('#d9cfa8'), 0, 0.95, 0), box(0.34, 1.1, 0.03, std('#2e7d6b', { roughness: 0.5 }), 0, 1.35, 0), box(0.16, 0.18, 0.035, std('#1f3c8a'), 0, 1.75, 0.01));
    g.add(f);
  } else g.add(cyl(0.67, 0.67, 0.14, std('#3a2a1e'), 28, 0, 0.2, 0));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export const HAT_Y = 1.55;                                   // bones.Head frame: resting on Leo's hair (hairLift 0.16), checked in a test render
export function headHat(actor, h) { h.position.set(0, HAT_Y, 0); actor.bones.Head.add(h); return h; }
export const merchantCoat = (a) => dress(a, { color: '#3b2a22', hem: 0.45, buttons: '#c9a24a', collar: '#f4f2ec' });

// ======================================================= the city ====================================================
function shopfront(w, h, color, sign, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const wood = std(color, { roughness: 0.9 }), trim = std('#efe6d2', { roughness: 0.8 }), dark = std('#2b2420', { roughness: 0.9 });
  g.add(box(w, h, 3, wood, 0, h / 2, 0));                                   // the building
  g.add(box(w + 0.4, 0.5, 3.4, trim, 0, h + 0.25, 0));                      // cornice
  g.add(box(w * 0.36, 3.2, 0.12, dark, -w * 0.18, 1.6, 1.52), box(w * 0.28, 2.0, 0.12, std('#9fc7d9', { roughness: 0.2, metalness: 0.1 }), w * 0.22, 2.0, 1.52));   // door, window
  g.add(box(w, 0.25, 2.2, trim, 0, 3.8, 2.6));                              // the porch roof
  for (const sx of [-1, 1]) g.add(cyl(0.12, 0.12, 3.8, trim, 8, sx * (w / 2 - 0.3), 1.9, 3.6));
  const s = label(w * 0.8, 1.1, 640, 110, (c, W, H) => { c.fillStyle = '#f3e4c0'; c.fillRect(0, 0, W, H); c.strokeStyle = '#3a2a1e'; c.lineWidth = 8; c.strokeRect(6, 6, W - 12, H - 12); MS(c, sign, W / 2, H / 2 + 2, 62, '#3a2a1e'); });
  s.position.set(0, h - 1.0, 1.53); g.add(s);
  return g;
}
function ship(scale = 1) {
  const g = new THREE.Group(), hull = std('#4a3326', { roughness: 0.85 }), sail = std('#f1ead8', { roughness: 0.9, side: THREE.DoubleSide });
  g.add(box(10, 2.2, 3, hull, 0, 1.1, 0), box(3, 1.4, 3, hull, 4.2, 2.5, 0));
  for (const [x, h] of [[-2.5, 9], [1.5, 10]]) {
    g.add(cyl(0.15, 0.18, h, std('#3a2a1e'), 8, x, 2.2 + h / 2, 0));
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.6, h * 0.55), sail); s.position.set(x, 2.2 + h * 0.55, 0.2); s.rotation.y = Math.PI / 2; g.add(s);
  }
  g.scale.setScalar(scale);
  return g;
}
export function riceSack() { const g = new THREE.Group(); g.add(box(1.2, 0.9, 0.8, std('#d8c7a0', { roughness: 1 }), 0, 0.45, 0)); return g; }

export function sanFrancisco(scene) {
  const g = new THREE.Group(); g.name = 'sf1859'; scene.add(g);
  g.add(flat(220, 160, std('#a7b06a', { roughness: 1 }), 0, 0, 0));                             // scrub ground
  g.add(flat(60, 8, std('#b8946a', { roughness: 1 }), -4, 0.02, STREET_Z));                      // the dirt street
  g.add(flat(60, 2.4, std('#8a6a4a', { roughness: 1 }), -4, 0.03, STREET_Z - 4.6));              // boardwalk
  [['BANK', '#8c5a3c', 7, 8], ['GENERAL STORE', '#a8763e', 9, 7], ['DAILY EVENING BULLETIN', '#6e4a36', 11, 9], ['HOTEL', '#9a6a4a', 8, 10]]
    .reduce((x, [sign, c, w, h]) => { g.add(shopfront(w, h, c, sign, x + w / 2, STREET_Z - 7.5)); return x + w + 0.6; }, -26);
  for (const [x, z, r, h] of [[-30, -60, 28, 14], [0, -70, 34, 18], [34, -64, 26, 12]]) {        // hills on the skyline
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#8f9a5a', { roughness: 1 }));
    hill.scale.y = h / r; hill.position.set(x, 0, z); g.add(hill);
  }
  // the bay, the dock, rice sacks and ships
  const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), std('#3d7fb3', { roughness: 0.15, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(BAY_X + 60, 0.05, 0); g.add(water);
  g.add(box(14, 0.4, 5, std('#7a5a3e', { roughness: 0.9 }), DOCK.x, 0.6, DOCK.z));
  for (let i = 0; i < 6; i++) g.add(cyl(0.25, 0.25, 2.2, std('#5a4030'), 8, DOCK.x - 6 + i * 2.4, 0.1, DOCK.z + 2.3));
  const ships = [];
  for (let i = 0; i < 4; i++) { const s = ship(1); s.position.set(DOCK.x + 12 + i * 3, 0, DOCK.z - 6 - i * 9); g.add(s); ships.push(s); }
  // the Bay Bridge (decades later): two towers and a deck far out on the water, hidden until its scene
  const bridge = new THREE.Group(), steel = std('#9aa3ab', { metalness: 0.5, roughness: 0.4 });
  bridge.add(box(4, 1, 140, steel, 0, 7, 0));
  for (const z of [-30, 30]) bridge.add(box(2.5, 26, 2.5, steel, 0, 13, z));
  bridge.position.set(BAY_X + 40, 0, 0); bridge.visible = false; g.add(bridge);
  return { group: g, ships, bridge };
}
