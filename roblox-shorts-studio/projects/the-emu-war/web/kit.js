// They Lost A War To Emus: sets, props and the emus, built in code. World layout (studs, floor y 0); places far apart:
//   WHEAT   origin. A Western Australian wheat farm, 1932: a golden field (z < 0), a dirt track along x at z 8, a
//           farmhouse, a dam (pond) at (-30, 0, -24) with scrub around it, a mound for the lookout emu.
//   PARL    (-3000, 0, 0). The House of Representatives: green benches facing across a floor, the Speaker's chair.
// Every prop is built with its origin where it is held or stands.
import * as THREE from 'three';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, transparent: !!o.transparent, ...o }));
const MS = (g, text, x, y, px, color, align = 'center', wgt = 800) => { g.font = `${wgt} ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

export const WHEAT = V(0, 0, 0), PARL = V(-3000, 0, 0);
export const DAM = V(-30, 0, -24), MOUND = V(14, 0, -18);

// ======================================================= clothing ====================================================
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, buttons = null, collar = null, belt = null } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 3; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, 0, 1.6 - i * 0.48, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (belt) { const b = box(2.14, 0.22, 1.14, std(belt, { roughness: 0.5 }), 0, 0.3, 0); actor.bones.Torso.add(b); parts.push(b); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}

// ======================================================= the emu =====================================================
// A blocky emu, about as tall as a person (head at ~5.6). Origin on the ground between its feet, facing +z.
// userData: legs [L, R] (pivots at the hips), neck (pivot at the shoulder), body. Pose with setEmu().
const EMU_FEATHER = ['#5a4a3a', '#4e4032', '#655240', '#463a2e'];
export function emu(seed = 0, tall = 1) {
  const g = new THREE.Group(), r = rng(seed + 1), feather = std(EMU_FEATHER[seed % 4], { roughness: 0.95 }), skin = std('#6f7f9a', { roughness: 0.6 }), legM = std('#4a4038', { roughness: 0.7 });
  const body = new THREE.Group(); body.position.y = 3.0 * tall; g.add(body);
  const b = sph(1.0, feather, 0, 0, 0, 14); b.scale.set(1.15, 0.95, 1.45); body.add(b);
  const tail = sph(0.6, feather, 0, 0.1, -1.25, 10); tail.scale.set(1.2, 0.8, 1); body.add(tail);
  const neck = new THREE.Group(); neck.position.set(0, 0.45, 1.0); body.add(neck);
  const n1 = cyl(0.22, 0.32, 2.0, feather, 10, 0, 1.0, 0); neck.add(n1);
  const head = new THREE.Group(); head.position.set(0, 2.05, 0.05); neck.add(head);
  head.add(box(0.5, 0.48, 0.62, skin, 0, 0, 0.05), box(0.22, 0.14, 0.45, std('#2b2620'), 0, -0.08, 0.5));
  for (const sx of [-1, 1]) { head.add(box(0.06, 0.12, 0.12, std('#ffffff'), sx * 0.26, 0.08, 0.15)); head.add(box(0.07, 0.07, 0.07, std('#111111'), sx * 0.28, 0.08, 0.17)); }
  const legs = [];
  for (const sx of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(sx * 0.45, 3.0 * tall - 0.4, 0); g.add(L);
    L.add(cyl(0.14, 0.12, 2.6 * tall, legM, 8, 0, -1.3 * tall, 0));
    const foot = box(0.45, 0.12, 0.7, legM, 0, -2.6 * tall + 0.06, 0.2); L.add(foot);
    legs.push(L);
  }
  g.userData = { legs, neck, head, body, tall, phase: r() * 6.28 };
  return g;
}
// run: stride phase in radians (0 = standing); peck 0..1 (head down to the ground); look: head yaw; bob: body bounce.
export function setEmu(e, { run = null, peck = 0, look = 0, alert = 0 } = {}) {
  const u = e.userData, sw = run === null ? 0 : Math.sin(run);
  u.legs[0].rotation.x = 0.7 * sw; u.legs[1].rotation.x = -0.7 * sw;
  u.body.position.y = 3.0 * u.tall + (run === null ? 0 : 0.18 * Math.abs(Math.cos(run)));
  u.neck.rotation.x = run === null ? 1.55 * peck - 0.25 * alert : 0.45;          // lean forward to run, down to peck
  u.head.rotation.x = -1.55 * peck * 0.6; u.neck.rotation.y = look;
}

// ======================================================= props =======================================================
// A Lewis gun on its bipod, standing on the ground, barrel along +z. userData.muzzle: the barrel tip.
export function lewisGun() {
  const g = new THREE.Group(), dark = std('#2a2d33', { metalness: 0.7, roughness: 0.4 }), wood = std('#6e4526', { roughness: 0.6 });
  const Y = 1.2;
  const shroud = cyl(0.26, 0.26, 2.6, dark, 14, 0, Y, 0.9); shroud.rotation.x = Math.PI / 2; g.add(shroud);
  const barrel = cyl(0.08, 0.08, 0.6, dark, 8, 0, Y, 2.5); barrel.rotation.x = Math.PI / 2; g.add(barrel);
  g.add(box(0.36, 0.42, 1.2, dark, 0, Y, -0.8), box(0.22, 0.5, 1.2, wood, 0, Y - 0.1, -1.9));
  const drum = cyl(0.7, 0.7, 0.24, dark, 22, 0, Y + 0.38, -0.5); g.add(drum);
  for (const sx of [-1, 1]) { const l = box(0.08, 1.4, 0.08, dark, sx * 0.35, 0.6, 1.4); l.rotation.z = sx * 0.3; g.add(l); }
  g.userData.muzzle = V(0, Y, 2.85);
  return g;
}
// A crate of ammunition (origin on the ground). `open`: lid off and empty.
export function ammoBox(open = false) {
  const g = new THREE.Group(), m = std('#5a6a3a', { roughness: 0.7 });
  g.add(box(1.6, 0.9, 1.0, m, 0, 0.45, 0));
  if (!open) g.add(box(1.64, 0.12, 1.04, std('#4a5a2a'), 0, 0.96, 0));
  g.add(label(1.0, 0.36, 200, 72, (x, w, h) => { x.fillStyle = '#5a6a3a'; x.fillRect(0, 0, w, h); MS(x, '.303 AMMO', w / 2, h / 2 + 2, 30, '#e9e2cf'); }));
  g.children[g.children.length - 1].position.set(0, 0.5, 0.505);
  return g;
}
// A 1930s army truck (cab at +x) with a gun mount in the back. Origin on the ground; userData.bed: where the gunner
// stands; userData.gun: the mounted Lewis gun (barrel along +x).
export function armyTruck() {
  const g = new THREE.Group(), body = std('#4f5a3a', { roughness: 0.6 }), dark = std('#1e2226', { roughness: 0.6 });
  g.add(box(12, 0.7, 4.0, dark, 0, 1.3, 0), box(6.6, 0.35, 4.4, std('#6e5a3a', { roughness: 0.8 }), -2.6, 1.85, 0));
  for (const z of [-2.1, 2.1]) g.add(box(6.6, 0.8, 0.15, body, -2.6, 2.4, z));
  g.add(box(3.2, 1.8, 3.8, body, 4.5, 2.5, 0), box(2.4, 2.6, 4.0, body, 2.2, 3.1, 0), box(2.5, 0.2, 4.2, body, 2.2, 4.5, 0));
  g.add(box(0.1, 1.2, 3.4, std('#a9cbe6', { roughness: 0.1, transparent: true, opacity: 0.35 }), 3.42, 3.7, 0));
  for (const x of [4.4, -4.0]) for (const z of [-2.0, 2.0]) { const w = cyl(1.0, 1.0, 0.7, std('#1b1b1d', { roughness: 0.9 }), 16, x, 1.0, z); w.rotation.x = Math.PI / 2; g.add(w); }
  const gun = lewisGun(); gun.position.set(-1.0, 2.0, 0); gun.rotation.y = Math.PI / 2; g.add(gun);
  g.add(cyl(0.12, 0.12, 1.2, dark, 8, -1.0, 2.6, 0));
  g.userData = { bed: V(-3.4, 2.03, 0), gun };
  return g;
}
// A tall bush / scrub clump (origin on the ground).
export function scrub(seed = 0, s = 1) { const g = new THREE.Group(), r = rng(seed + 7); for (let i = 0; i < 4; i++) { const b = sph((1.0 + r() * 0.8) * s, std(['#6a7a3a', '#7a8a4a', '#5a6a32'][i % 3], { roughness: 0.95 }), (r() - 0.5) * 2 * s, 0.8 * s, (r() - 0.5) * 2 * s, 10); b.scale.y = 0.75; g.add(b); } return g; }

// ======================================================= sets ========================================================
export function wheat(scene) {
  const g = new THREE.Group(); g.name = 'wheat'; g.position.copy(WHEAT); scene.add(g);
  const field = canvasTexture(256, 256, (x, w, h) => { const r = rng(3); x.fillStyle = '#d9b44a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2200; i++) { x.fillStyle = r() > 0.5 ? 'rgba(255,230,140,.35)' : 'rgba(150,110,30,.3)'; x.fillRect(r() * w, r() * h, 2, 6); } });
  g.add(flat(900, 600, std('#ffffff', { map: rep(field, 80, 50), roughness: 0.95 }), 0, 0, -296));
  const dirt = canvasTexture(256, 256, (x, w, h) => { const r = rng(4); x.fillStyle = '#b8743d'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,210,160' : '90,40,10'},0.12)`; x.fillRect(r() * w, r() * h, 4, 4); } });
  g.add(flat(900, 600, std('#ffffff', { map: rep(dirt, 80, 50), roughness: 0.95 }), 0, 0, 304));
  g.add(flat(900, 6, std('#a8683a', { roughness: 0.95 }), 0, 0.02, 8));
  // wheat clumps standing in the field near the action (the rest is the texture)
  const r = rng(11), stalk = std('#e2c056', { roughness: 0.9 }), ear = std('#c99a32', { roughness: 0.9 });
  const clumps = new THREE.Group(); g.add(clumps);
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 90, z = -3 - r() * 60; const c = new THREE.Group(); c.position.set(x, 0, z); const h = 1.6 + r() * 0.8; c.add(cyl(0.05, 0.05, h, stalk, 4, 0, h / 2, 0), cyl(0.12, 0.08, 0.5, ear, 6, 0, h + 0.2, 0)); c.rotation.z = (r() - 0.5) * 0.3; clumps.add(c); }
  // fence along the track
  for (let x = -60; x <= 60; x += 4) g.add(box(0.25, 2.2, 0.25, std('#8a6a4a'), x, 1.1, 4.5));
  g.add(box(124, 0.15, 0.12, std('#cfd3d6', { metalness: 0.6 }), 0, 1.8, 4.5), box(124, 0.15, 0.12, std('#cfd3d6', { metalness: 0.6 }), 0, 1.0, 4.5));
  // farmhouse
  const fh = new THREE.Group(); fh.position.set(30, 0, 22); g.add(fh);
  fh.add(box(14, 7, 10, std('#e9e2cf', { roughness: 0.8 }), 0, 3.5, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 9, 4, 4, 1), std('#9aa3ad', { metalness: 0.5, roughness: 0.4 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.1, 1, 0.8); roof.position.y = 9; fh.add(roof);
  fh.add(box(2.2, 4.2, 0.2, std('#6e4526'), 0, 2.1, -5.05), box(2.4, 2.0, 0.2, std('#3b4a5c', { roughness: 0.1 }), -4, 4, -5.05), box(2.4, 2.0, 0.2, std('#3b4a5c', { roughness: 0.1 }), 4, 4, -5.05));
  const tank = cyl(2, 2, 4, std('#b8bec8', { metalness: 0.6, roughness: 0.4 }), 18, 10, 2, 0); fh.add(tank);
  // the dam: a pond with a muddy rim and scrub for the ambush
  const pond = new THREE.Mesh(new THREE.CircleGeometry(10, 40), std('#5a7a8a', { roughness: 0.15, metalness: 0.2 })); pond.rotation.x = -Math.PI / 2; pond.position.set(DAM.x, 0.05, DAM.z); g.add(pond);
  const rim = new THREE.Mesh(new THREE.RingGeometry(10, 13, 40), std('#8a5a32', { roughness: 0.95 })); rim.rotation.x = -Math.PI / 2; rim.position.set(DAM.x, 0.04, DAM.z); g.add(rim);
  for (let i = 0; i < 9; i++) { const s = scrub(i, 1.2); const a = -0.4 + i * 0.25; s.position.set(DAM.x + 18 + Math.cos(a) * 3, 0, DAM.z + 6 + Math.sin(a) * 8); g.add(s); }
  // the lookout mound
  const mound = sph(4, std('#b8743d', { roughness: 0.95 }), MOUND.x, -2.2, MOUND.z, 18); mound.scale.y = 0.6; g.add(mound);
  // gum trees and clouds
  const gm = std('#d9d2c2', { roughness: 0.8 }), lf = std('#7a9a6a', { roughness: 0.9 });
  for (let i = 0; i < 10; i++) { const t = new THREE.Group(); t.position.set(-90 + i * 20 + r() * 6, 0, -70 - r() * 30); g.add(t); t.add(cyl(0.4, 0.6, 10, gm, 8, 0, 5, 0)); for (let j = 0; j < 4; j++) { const b = sph(2 + r() * 2, lf, (r() - 0.5) * 4, 10 + r() * 2, (r() - 0.5) * 3, 10); b.scale.y = 0.6; t.add(b); } }
  for (let i = 0; i < 6; i++) { const c = cloud(80 + i, 18); c.position.set(-240 + i * 90, 90, -360); g.add(c); }
  return { group: g, clumps };
}
export const DOOR = V(30, 0, 16.9);
export function parliament(scene) {
  const g = new THREE.Group(); g.name = 'parl'; g.position.copy(PARL); scene.add(g);
  const carpet = canvasTexture(128, 128, (x, w, h) => { x.fillStyle = '#2f6b3a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a7a46'; x.lineWidth = 4; for (let i = 0; i < 4; i++) x.strokeRect(i * 32 + 6, 6, 20, h - 12); });
  g.add(flat(50, 40, std('#ffffff', { map: rep(carpet, 8, 6), roughness: 0.95 }), 0, 0, 0));
  const wood = std('#6e4526', { roughness: 0.5 }), wall = std('#c9b28e', { roughness: 0.85 });
  g.add(box(50, 18, 0.6, wall, 0, 9, -16), box(0.6, 18, 40, wall, -25, 9, 0), box(0.6, 18, 40, wall, 25, 9, 0));
  for (let x = -22; x <= 22; x += 4) g.add(box(0.6, 18, 0.4, std('#8a6a4a'), x, 9, -15.6));
  const green = std('#2f6b3a', { roughness: 0.6 });
  // benches in tiers on both sides, facing the centre
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) {
    const x = side * (6 + row * 2.6), y = row * 0.9;
    g.add(box(2.0, 0.6, 26, green, x, y + 1.6, -1), box(0.4, 1.2, 26, green, x + side * 1.0, y + 2.4, -1), box(2.4, y + 1.3, 26, wood, x, (y + 1.3) / 2, -1));
  }
  // the Speaker's chair and the table
  g.add(box(3.6, 7, 2.4, wood, 0, 3.5, -13.4), box(4.2, 0.5, 2.8, std('#c9a03a', { metalness: 0.6, roughness: 0.4 }), 0, 7.2, -13.4));
  g.add(box(4, 2.6, 10, wood, 0, 1.3, -2), box(4.2, 0.2, 10.2, green, 0, 2.7, -2));
  const sg = label(12, 1.4, 1200, 140, (x, w, h) => { x.fillStyle = '#3a2416'; x.fillRect(0, 0, w, h); x.font = '700 80px "Playfair Display"'; x.fillStyle = '#e9c46a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HOUSE OF REPRESENTATIVES', w / 2, h / 2 + 4); });
  sg.position.set(0, 13, -15.65); g.add(sg);
  const lamp = new THREE.PointLight('#ffe9c8', 0, 60, 1.0); lamp.position.set(0, 14, 0); g.add(lamp);
  return { group: g, lamp };
}
