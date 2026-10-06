// The Dog Who Saved A Town: sets and props built in code (no pack accessories, so the fit check has nothing to fit).
// World layout (studs, floor y 0); each place is its own group, shown only in its shots:
//   TOWN    origin. Snowy Nome at night: a street along x with wooden houses (lit windows), the doctor's house with a
//           red cross, a NOME sign; the camera looks from +z.
//   ROOM    (300, 0, 0). The sick room (open toward +z): a bed against the back wall, a window, a side table, a lamp.
//   HARBOR  (-300, 0, 0). The frozen harbour: a ship stuck in the sea ice (out at -z) and a frosted biplane on the shore.
//   TRAIL   (0, 0, 600). A long snowy plain along x with spruce trees off the trail (|z| > 9) and trail stakes.
//   ICE     (0, 0, -600). The frozen sea: flat ice with cracks and pressure ridges along x; the roadhouse on the shore
//           at x +70; floes (userData.floes) that drift out to sea at night.
//   PARK    (600, 0, 0). A New York park in winter: paths, bare trees, two plinths (BALTO at x -6, TOGO at x +40).
// Props are built with their origin where the hand holds them (or on the ground under their middle) and face +z.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const TOWN = V(0, 0, 0), ROOM = V(300, 0, 0), HARBOR = V(-300, 0, 0), TRAIL = V(0, 0, 600), ICE = V(0, 0, -600), PARK = V(600, 0, 0);
const SNOW = std('#eef3fa', { roughness: 0.95 }), WOOD = std('#7a5636', { roughness: 0.8 }), DARKWOOD = std('#4e3320', { roughness: 0.8 });

// ======================================================= ground =====================================================
function snowGround(g, w, d, seed = 3, tint = '#eef3fa') {
  const tex = canvasTexture(512, 512, (c, W) => { c.fillStyle = tint; c.fillRect(0, 0, W, W); const r = rng(seed); for (let i = 0; i < 2600; i++) { c.fillStyle = `hsla(${205 + r() * 20},${20 + r() * 25}%,${82 + r() * 14}%,0.8)`; c.fillRect(r() * W, r() * W, 3 + r() * 8, 2 + r() * 4); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 16, d / 16);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std('#ffffff', { map: tex, roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); return m;
}
function iceGround(g, w, d, seed = 9) {
  const tex = canvasTexture(1024, 1024, (c, W) => {
    c.fillStyle = '#dcebf5'; c.fillRect(0, 0, W, W); const r = rng(seed);
    for (let i = 0; i < 1800; i++) { c.fillStyle = `hsla(200,${30 + r() * 30}%,${80 + r() * 15}%,0.6)`; c.fillRect(r() * W, r() * W, 6 + r() * 20, 2 + r() * 6); }
    c.strokeStyle = 'rgba(70,120,160,.55)'; c.lineWidth = 3;
    for (let i = 0; i < 26; i++) { let x = r() * W, y = r() * W; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 60, d / 60);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std('#ffffff', { map: tex, roughness: 0.35, metalness: 0.05 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); return m;
}
export function spruce(h = 9, snow = true) {
  const g = new THREE.Group(), green = std('#24482f', { roughness: 0.85 });
  g.add(cyl(0.25, 0.35, 1.6, std('#4a3322'), 8, 0, 0.8, 0));
  for (let i = 0; i < 3; i++) {
    const r = (3 - i) * h * 0.11, y = 1.4 + i * h * 0.25, c = new THREE.Mesh(new THREE.ConeGeometry(r, h * 0.42, 8), green); c.position.y = y + h * 0.21; c.castShadow = true; g.add(c);
    if (snow) { const s = new THREE.Mesh(new THREE.ConeGeometry(r * 0.62, h * 0.16, 8), SNOW); s.position.y = y + h * 0.36; g.add(s); }
  }
  return g;
}
// a wooden house; front (door, windows) faces +z; origin on the ground at the middle of the front wall's foot
function house(w, h, color, seed, lit = true) {
  const g = new THREE.Group(), r = rng(seed), wall = std(color, { roughness: 0.85 });
  g.add(box(w, h, 7, wall, 0, h / 2, -3.5));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, 2.8, 4, 1), std('#5a4a44')); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 7 / (w * 0.88)); roof.position.set(0, h + 1.4, -3.5); g.add(roof);
  const cap = box(w * 0.92, 0.5, 7.4, SNOW, 0, h + 0.4, -3.5); g.add(cap);
  const win = std(lit ? '#ffcf73' : '#8fb3cf', { emissive: lit ? '#ffb347' : '#3a5a78', emissiveIntensity: lit ? 1.1 : 0.3 });
  for (const x of [-w / 4, w / 4]) if (r() > 0.15) g.add(box(1.6, 1.6, 0.2, win, x, h * 0.55, 0.05), box(1.9, 0.2, 0.35, SNOW, x, h * 0.55 - 0.9, 0.1));
  g.add(box(1.5, 2.8, 0.2, DARKWOOD, w > 9 ? 0 : -w / 4 + 0.2, 1.4, 0.05));
  return g;
}

// ======================================================= the town (Nome at night) ===================================
export function town(scene) {
  const g = new THREE.Group(); g.position.copy(TOWN); scene.add(g);
  snowGround(g, 400, 400, 3);
  const cols = ['#8a4b3a', '#5d6b7a', '#7a6a4a', '#4f6650', '#8a6a3a', '#6a4a5a'];
  [[-26, 9, 7], [-14, 10, 8], [-1, 12, 9], [13, 9, 7], [25, 11, 8], [37, 9, 7]].forEach(([x, w, h], i) => { const hs = house(w, h, cols[i], 20 + i); hs.position.set(x, 0, -8); g.add(hs); });
  // the doctor's house: a red cross over the door
  const cross = label(2.2, 2.2, 220, 220, (c, w) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, w); c.fillStyle = '#d62828'; c.fillRect(w * 0.38, w * 0.12, w * 0.24, w * 0.76); c.fillRect(w * 0.12, w * 0.38, w * 0.76, w * 0.24); });
  cross.position.set(-1, 7.4, -7.85); g.add(cross);
  const sign = label(7, 1.8, 700, 180, (c, w, h) => { c.fillStyle = '#3a2618'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8d4a8'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'NOME, ALASKA', w / 2, h / 2 + 4, 96, '#f4ead2'); });
  sign.position.set(-10, 4.2, 6.2); g.add(sign, box(0.35, 4.2, 0.35, DARKWOOD, -13, 2.1, 6.1), box(0.35, 4.2, 0.35, DARKWOOD, -7, 2.1, 6.1));
  // snow banks and a few trees behind the houses
  const r = rng(5);
  for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1.4 + r() * 1.6, 10, 8), SNOW); s.scale.y = 0.35; s.position.set(-40 + i * 6.2 + r() * 2, 0, -1.2 + r() * 1.5); g.add(s); }
  for (let i = 0; i < 18; i++) { const t = spruce(8 + r() * 6); t.position.set(-60 + i * 7 + r() * 3, 0, -22 - r() * 14); g.add(t); }
  const street = new THREE.PointLight('#ffb347', 0, 40, 1.6); street.position.set(0, 7, 3); g.add(street);
  return { group: g, lamp: street };
}

// ======================================================= the sick room ==============================================
export function room(scene) {
  const g = new THREE.Group(); g.position.copy(ROOM); scene.add(g);
  g.add(box(24, 0.3, 18, std('#6b4a2e', { roughness: 0.8 }), 0, -0.15, 0));
  const wall = std('#cbbf9f', { roughness: 0.9 });
  g.add(box(24, 12, 0.4, wall, 0, 6, -6), box(0.4, 12, 18, wall, -10, 6, 0), box(0.4, 12, 18, wall, 10, 6, 0));
  const win = std('#2d4a78', { emissive: '#1d3358', emissiveIntensity: 0.6, roughness: 0.2 });
  g.add(box(4.5, 3.6, 0.2, win, 5.5, 6.5, -5.75), box(4.9, 0.25, 0.5, WOOD, 5.5, 4.6, -5.6), box(0.2, 3.6, 0.25, WOOD, 5.5, 6.5, -5.6), box(4.5, 0.2, 0.25, WOOD, 5.5, 6.5, -5.6));
  // snowflakes painted on the window
  const flakes = label(4.4, 3.5, 220, 175, (c, w, h) => { const r = rng(4); c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 2.5, 0, 7); c.fill(); } }, { transparent: true, emissive: '#ffffff', emissiveIntensity: 0.4 });
  flakes.position.set(5.5, 6.5, -5.6); g.add(flakes);
  // the bed: head against the back wall, foot toward +z; mattress top y 2.2
  g.add(box(4.2, 1.0, 7.4, WOOD, -2.5, 0.9, -2.0), box(4.2, 3.4, 0.3, WOOD, -2.5, 1.7, -5.7), box(4.2, 1.8, 0.3, WOOD, -2.5, 0.9, 1.75));
  g.add(box(3.9, 0.6, 7.0, std('#f4f1e8'), -2.5, 1.9, -2.0));
  g.add(box(2.6, 0.5, 1.4, std('#ffffff'), -2.5, 2.4, -4.7));
  const blanket = box(4.0, 0.3, 4.6, std('#4a6fa5', { roughness: 0.9 }), -2.5, 2.3, -0.6); g.add(blanket);
  // side table with an empty medicine bottle and a lamp
  g.add(box(1.8, 2.4, 1.8, DARKWOOD, 1.2, 1.2, -4.6), cyl(0.25, 0.3, 0.8, std('#6a8f6a', { transparent: true, opacity: 0.7, roughness: 0.2 }), 12, 0.8, 2.8, -4.4));
  g.add(cyl(0.5, 0.5, 0.2, std('#3a3330'), 12, 1.6, 2.5, -4.8), cyl(0.08, 0.08, 1.2, std('#3a3330'), 8, 1.6, 3.1, -4.8));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.8, 16, 1, true), std('#f2d39b', { emissive: '#ffcf8a', emissiveIntensity: 0.8, side: THREE.DoubleSide })); shade.position.set(1.6, 3.9, -4.8); g.add(shade);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 28, 1.4); lamp.position.set(1.4, 5, -3); g.add(lamp);
  return { group: g, lamp };
}

// ======================================================= the frozen harbour =========================================
export function harbor(scene) {
  const g = new THREE.Group(); g.position.copy(HARBOR); scene.add(g);
  snowGround(g, 300, 120, 6).position.z = 40;                       // the shore (z > -20)
  iceGround(g, 300, 300, 2).position.set(0, 0.02, -170);           // the frozen sea
  // the ship stuck in the ice, out at z -40, bow toward -x, listing a little
  const ship = new THREE.Group(); ship.position.set(-4, -0.6, -42); ship.rotation.set(0, 0.25, 0.04); g.add(ship);
  const hull = std('#24262c', { roughness: 0.6 }), white = std('#f2f0ea'), red = std('#8a2222');
  ship.add(box(34, 5, 8, hull, 0, 2.5, 0), box(34, 1, 8, red, 0, 0.5, 0), box(14, 3.4, 6, white, 2, 6.7, 0), box(6, 2.4, 5, white, 3, 9.6, 0));
  ship.add(cyl(1.0, 1.0, 6, std('#c7a02f'), 16, 2, 13, 0), cyl(1.05, 1.05, 1.2, std('#1d1f24'), 16, 2, 16.4, 0));
  ship.add(box(34.2, 0.4, 8.2, SNOW, 0, 5.2, 0), box(14.2, 0.4, 6.2, SNOW, 2, 8.6, 0), box(6.2, 0.4, 5.2, SNOW, 3, 11.0, 0));
  ship.add(cyl(0.18, 0.22, 16, std('#5a4330'), 8, -10, 13, 0), cyl(0.18, 0.22, 14, std('#5a4330'), 8, 12, 12, 0));
  const ridge = std('#cfe2ee', { roughness: 0.4 }), r = rng(11);
  for (let i = 0; i < 22; i++) { const b = box(2 + r() * 3, 1 + r() * 1.6, 2 + r() * 3, ridge, -22 + i * 2.2 + r(), 0.4, -37 + (r() - 0.5) * 2.5); b.rotation.set(r() - 0.5, r() * 3, r() - 0.5); g.add(b); }
  // the frosted biplane on the shore at x +16, nose toward -x
  const pl = biplane(); pl.position.set(16, 0, 6); pl.rotation.y = 0.5; g.add(pl);
  for (let i = 0; i < 10; i++) { const t = spruce(7 + r() * 5); t.position.set(-40 + i * 9 + r() * 4, 0, 26 + r() * 10); g.add(t); }
  return { group: g, plane: pl, ship };
}
export function biplane() {
  const g = new THREE.Group(), body = std('#5d7a52', { roughness: 0.7 }), frost = std('#f2f7fb', { roughness: 0.9 });
  g.add(box(9, 1.6, 1.6, body, 0, 3.0, 0), box(3, 1.1, 1.3, body, 5.6, 3.2, 0));
  g.add(box(2.6, 0.2, 13, body, -1.0, 4.9, 0), box(2.6, 0.2, 12, body, -1.0, 2.2, 0));
  g.add(box(2.7, 0.16, 13.1, frost, -1.0, 5.05, 0), box(9.1, 0.18, 1.62, frost, 0, 3.85, 0));
  for (const z of [-4.5, 4.5]) g.add(cyl(0.08, 0.08, 2.7, std('#3a3330'), 6, -1.0, 3.55, z));
  g.add(box(0.5, 2.4, 0.2, std('#4a3322'), -4.8, 3.0, 0));                   // propeller
  g.add(box(1.8, 1.6, 0.18, body, 6.6, 4.0, 0), box(1.6, 0.18, 4, body, 6.6, 3.3, 0));
  for (const z of [-1.3, 1.3]) g.add(cyl(0.7, 0.7, 0.3, std('#1d1f24'), 14, -1.5, 0.7, z).rotateX(Math.PI / 2));
  g.add(box(1.2, 1.5, 0.1, std('#cfe6ff', { transparent: true, opacity: 0.5 }), 1.2, 4.2, 0));
  // icicles under the wings
  const ic = std('#e6f4ff', { roughness: 0.2, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 6), ic); c.rotation.x = Math.PI; c.position.set(-1.0 + (i % 3 - 1) * 0.8, 1.8, -5 + i * 1.2); g.add(c); }
  return g;
}

// ======================================================= the trail ==================================================
export function trail(scene) {
  const g = new THREE.Group(); g.position.copy(TRAIL); scene.add(g);
  snowGround(g, 1400, 300, 8);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(1400, 3.2), std('#d9e3ee', { roughness: 0.9 })); track.rotation.x = -Math.PI / 2; track.position.y = 0.02; g.add(track);
  const r = rng(13);
  for (let i = 0; i < 140; i++) { const t = spruce(7 + r() * 7); const side = r() > 0.5 ? 1 : -1; t.position.set(-600 + i * 9 + r() * 5, 0, side * (26 + r() * 40)); g.add(t); }
  for (let i = 0; i < 120; i++) g.add(box(0.15, 1.6, 0.15, DARKWOOD, -600 + i * 10, 0.8, i % 2 ? 3.2 : -3.2));
  for (let i = 0; i < 20; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(30 + r() * 30, 14, 8), SNOW); h.scale.y = 0.35; h.position.set(-600 + i * 70, -4, -140 - r() * 40); g.add(h); }
  return { group: g };
}

// ======================================================= the frozen sea and the roadhouse ===========================
export function seaIce(scene) {
  const g = new THREE.Group(); g.position.copy(ICE); scene.add(g);
  const ground = iceGround(g, 1400, 400, 5);
  const ridge = std('#cfe2ee', { roughness: 0.35 }), r = rng(17);
  for (let i = 0; i < 90; i++) { const b = box(1.5 + r() * 3, 0.8 + r() * 1.8, 1.5 + r() * 3, ridge, -600 + r() * 1200, 0.3, (r() > 0.5 ? 1 : -1) * (7 + r() * 60)); if (Math.abs(b.position.z) < 18) b.position.z *= 18 / Math.abs(b.position.z); b.rotation.set(r() - 0.5, r() * 3, r() - 0.5); g.add(b); }
  // the shore and the roadhouse at x +70 (the camera looks back across the ice from it at night)
  const shore = snowGround(g, 200, 400, 4); shore.position.set(190, 0.06, 0);
  const rh = house(10, 6, '#6b4a2e', 31, true); rh.position.set(100, 0, -6); rh.rotation.y = -Math.PI / 2; g.add(rh);
  const rsign = label(6, 1.2, 600, 120, (c, w, h) => { c.fillStyle = '#3a2618'; c.fillRect(0, 0, w, h); LG(c, 'ROADHOUSE', w / 2, h / 2 + 4, 80, '#f4ead2'); });
  rsign.position.set(99.7, 7.6, -9.5); rsign.rotation.y = -Math.PI / 2; g.add(rsign);
  // floes: big slabs of the sea ice between the shore and the open sea; they drift out (-x) at night
  const floes = [], fm = std('#d7e8f3', { roughness: 0.35 });
  for (let i = 0; i < 30; i++) {                                    // overlapping slabs from the shore (x 92) out to sea
    const cx = 80 - (i % 5) * 20, f = box(22 + r() * 6, 0.6, 22 + r() * 6, fm, cx + (r() - 0.5) * 3, -0.1, -50 + Math.floor(i / 5) * 20 + (r() - 0.5) * 3);
    f.rotation.y = (r() - 0.5) * 0.3; f.userData.base = f.position.clone(); f.userData.k = 0.25 + (80 - cx) / 80 + r() * 0.3; floes.push(f); g.add(f);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std('#0e2233', { roughness: 0.15, metalness: 0.3, emissive: '#06121c', emissiveIntensity: 0.4 })); water.rotation.x = -Math.PI / 2; water.position.set(-60, -0.25, 0); g.add(water);
  water.visible = false;
  const lamp = new THREE.PointLight('#ffb347', 0, 40, 1.4); lamp.position.set(96, 5, -4); g.add(lamp);
  return { group: g, floes, water, lamp, ground };
}

// ======================================================= the park (New York) ========================================
export function park(scene) {
  const g = new THREE.Group(); g.position.copy(PARK); scene.add(g);
  snowGround(g, 300, 300, 21, '#e8eef4');
  const path = new THREE.Mesh(new THREE.PlaneGeometry(300, 6), std('#9a9a96', { roughness: 0.9 })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, 6); g.add(path);
  const r = rng(23), bark = std('#4a3a30', { roughness: 0.9 });
  for (let i = 0; i < 16; i++) {                                   // bare winter trees
    const t = new THREE.Group(), x = -70 + i * 10 + r() * 4, z = -18 - r() * 20; t.position.set(x, 0, z); g.add(t);
    t.add(cyl(0.4, 0.6, 9, bark, 8, 0, 4.5, 0));
    for (let k = 0; k < 4; k++) { const b = cyl(0.12, 0.22, 5, bark, 6, 0, 0, 0); b.position.set(Math.cos(k * 1.7) * 1.4, 8 + k * 0.6, Math.sin(k * 1.7) * 1.4); b.rotation.set(Math.sin(k * 1.7) * 0.7, 0, -Math.cos(k * 1.7) * 0.7); t.add(b); }
  }
  const stone = std('#8d8a84', { roughness: 0.75 });
  const plinth = (x, name, year) => {
    g.add(box(6, 3, 4, stone, x, 1.5, 0), box(6.6, 0.4, 4.6, stone, x, 3.2, 0));
    const p = label(4.6, 1.5, 460, 150, (c, w, h) => { c.fillStyle = '#6b5a2a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8c45a'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); LG(c, name, w / 2, h / 2 - 12, 64, '#f4e2a8'); MS(c, year, w / 2, h / 2 + 42, 30, '#f4e2a8'); });
    p.position.set(x, 1.6, 2.02); g.add(p);
  };
  plinth(-6, 'BALTO', '1925'); plinth(40, 'TOGO', '2001');
  // a cloth over the Balto statue that whips off at the unveiling (userData.cloth)
  const cloth = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.4, 10), std('#7a1f2a', { roughness: 0.9 })); cloth.position.set(-6, 5.6, 0); g.add(cloth);
  return { group: g, cloth, BALTO: V(-6, 3.4, 0), TOGO: V(40, 3.4, 0) };
}

// ======================================================= props =======================================================
// The medicine crate (strapped on the sled, then carried): GRIP at the middle of its bottom, front (+z) with the cross.
export function crate() {
  const g = new THREE.Group();
  g.add(box(1.5, 0.9, 1.0, std('#b88a52', { roughness: 0.7 }), 0, 0.45, 0));
  for (const x of [-0.6, 0.6]) g.add(box(0.12, 0.95, 1.05, std('#6b4a2e'), x, 0.45, 0));
  const l = label(0.9, 0.62, 180, 124, (c, w, h) => { c.fillStyle = '#f4efe2'; c.fillRect(0, 0, w, h); c.fillStyle = '#d62828'; c.fillRect(w * 0.4, 10, w * 0.2, 62); c.fillRect(w * 0.5 - 31, 41 - 10, 62, 20); MS(c, 'SERUM', w / 2, h - 24, 30, '#1d1f24'); });
  l.position.set(0, 0.47, 0.51); g.add(l);
  return g;
}
// The sled: a basket sled 6.4 long along x (front toward +x), runners on the ground, handlebar at the back (x -3).
// userData.CRATE = where the crate sits; userData.STAND = where the musher stands (on the runners at the back).
export function sled() {
  const g = new THREE.Group(), wood = std('#9a6b3a', { roughness: 0.7 }), dark = DARKWOOD;
  for (const z of [-0.9, 0.9]) { g.add(box(7.0, 0.15, 0.2, dark, 0, 0.1, z)); const tip = box(0.9, 0.15, 0.2, dark, 3.75, 0.45, z); tip.rotation.z = 0.8; g.add(tip); }
  for (let i = 0; i < 4; i++) g.add(box(0.15, 0.9, 0.15, wood, -2.4 + i * 1.6, 0.6, -0.9), box(0.15, 0.9, 0.15, wood, -2.4 + i * 1.6, 0.6, 0.9));
  g.add(box(5.2, 0.12, 1.9, wood, -0.1, 1.0, 0));                    // the bed
  for (const z of [-0.95, 0.95]) g.add(box(5.2, 0.1, 0.1, wood, -0.1, 1.6, z));
  g.add(box(0.15, 2.6, 0.15, wood, -2.9, 1.9, -0.8), box(0.15, 2.6, 0.15, wood, -2.9, 1.9, 0.8), box(0.15, 0.15, 1.75, wood, -2.9, 3.15, 0));
  g.userData = { CRATE: V(0.6, 1.06, 0), STAND: V(-3.4, 0.25, 0), FRONT: V(3.9, 0.5, 0) };
  return g;
}
// The statue (bronze) stand-in material for a dog clone.
export const BRONZE = () => std('#8a6a3a', { metalness: 0.75, roughness: 0.35 });
