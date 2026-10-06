// He Sold The Eiffel Tower: sets, props and clothing shells built in code.
// World layout (studs, floor y 0). Places are far apart so they never share a frame; each is its own group:
//   PARIS    origin. The Champ de Mars: the tower (TOWER, legs about 25 out from its centre), a gravel avenue running
//            +z away from it between lawns and tree rows, benches, lamp posts, cream Paris blocks far off on both sides.
//   HOTEL    (300, 0, 0). A grand hotel suite: cream panelled walls, red carpet, chandelier, a long table along x with
//            five chairs, tall window on the back wall (z -12) with a little tower outside.
//   OFFICE   (-300, 0, 0). Max's rented room: a desk with the typewriter and the stamp, a window. Also the counterfeit
//            room in America (re-dressed: the money box on the desk) and the death certificate close-up.
//   STATION  (0, 0, 300). A platform along x (edge z 0, top y PLAT_Y), rails at z 4, the steam train, canopy, clock.
//   DOCK     (0, 0, -300). A wooden pier along x and a steamship moored beside it (z -10), water around.
//   GANG     (600, 0, 0). The gangster's office: dark wood, desk, lamp, window blinds.
//   JAIL     (-600, 0, 0). A brick prison wall at night, barred windows, the knotted-sheet rope; a street lamp.
// Props face +z; held props have their origin where the hand holds them.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = s.receiveShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const TYPE = (g, text, x, y, px, color, align = 'left') => { g.font = `bold ${px}px "Courier New", monospace`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const PARIS = V(0, 0, 0), HOTEL = V(300, 0, 0), OFFICE = V(-300, 0, 0), STATION = V(0, 0, 300), DOCK = V(0, 0, -300), GANG = V(600, 0, 0), JAIL = V(-600, 0, 0);
export const TOWER = V(0, 0, -40);              // the tower's centre (Paris); the avenue runs from it toward +z
export const PLAT_Y = 1.2;                       // station platform top
export const DESK = OFFICE.clone().add(V(0, 0, -4));   // the office desk's centre on the floor (top at y 3.1)
export const DESK_Y = 3.1;

// ======================================================= ground ======================================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#6e9a3e'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${78 + r() * 30},${36 + r() * 18}%,${30 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(160, 160);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
  return m;
}
const gravelTex = (seed = 4, base = '#cdbb98') => {
  const t = canvasTexture(512, 512, (g, w) => { g.fillStyle = base; g.fillRect(0, 0, w, w); const r = rng(seed); for (let i = 0; i < 7000; i++) { const s = 1 + r() * 3; g.fillStyle = `hsl(${34 + r() * 12},${18 + r() * 14}%,${58 + r() * 22}%)`; g.fillRect(r() * w, r() * w, s, s); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
function flat(w, d, mat, x, z, y = 0.02) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; return m; }
export function trees(parent, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 7), std('#5b3a24', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.BoxGeometry(5.2, 5.6, 5.2), std('#4f7a33', { roughness: 0.9 }), n);   // clipped Paris trees
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.9 + r() * 0.2); q.setFromEuler(e.set(0, 0, 0));
    m.compose(V(x, 2 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 6.6 * sc, z), q, V(sc, sc, sc)); crown.setMatrixAt(i, m);
  });
  for (const o of [trunk, crown]) { o.castShadow = true; o.receiveShadow = true; parent.add(o); }
  return [trunk, crown];
}

// ======================================================= the tower ===================================================
// About 0.4 studs per metre: 116 tall to the top deck, 25 from the centre to each leg's outer corner, platforms at 23
// and 46. Four lattice legs (each a square column of chords with X bracing) lean in and merge at the second platform;
// one tapering shaft goes on to the top. Everything is merged into one mesh with one material, so `rust(k)` can tint it.
const HALF = (y) => 2.2 + 22.8 * Math.exp(-y / 28);      // outer half-width of the tower at height y
const LEG_W = (y) => lerp(6, HALF(46), y / 46);
function lerp(a, b, k) { return a + (b - a) * k; }
function beam(geos, a, b, r) {
  const d = b.clone().sub(a), len = d.length(); if (len < 1e-4) return;
  const g = new THREE.BoxGeometry(r, len, r);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().addScaledVector(d, 0.5), q, V(1, 1, 1))); geos.push(g);
}
// a square lattice column: corners(y) gives the 4 corners (in order round the square) at height y
function column(geos, corners, y0, y1, n, chord, brace) {
  let prev = corners(y0);
  for (let i = 1; i <= n; i++) {
    const y = lerp(y0, y1, i / n), cur = corners(y);
    for (let c = 0; c < 4; c++) {
      const c2 = (c + 1) % 4;
      beam(geos, prev[c], cur[c], chord);                         // chord
      beam(geos, prev[c], cur[c2], brace); beam(geos, prev[c2], cur[c], brace);   // X on this face
      beam(geos, cur[c], cur[c2], brace * 0.9);                   // ring
    }
    prev = cur;
  }
}
function arch(geos, sx, sz, r) {                                   // decorative arch on one face between two legs
  const pts = []; const inner = HALF(0) - LEG_W(0), top = 19.5;
  for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18; pts.push([Math.cos(a) * inner, Math.sin(a) * (top - 2) + 2]); }
  for (let i = 0; i < pts.length - 1; i++) {
    const [u0, y0] = pts[i], [u1, y1] = pts[i + 1];
    const p = (u, y) => sx ? V(sx * (HALF(y) - LEG_W(y) * 0.15), y, u) : V(u, y, sz * (HALF(y) - LEG_W(y) * 0.15));
    beam(geos, p(u0, y0), p(u1, y1), r);
  }
}
export function eiffel() {
  const g = new THREE.Group(), geos = [];
  const legCorners = (sx, sz) => (y) => {
    const o = HALF(y), w = LEG_W(y), i = o - w;
    return [V(sx * o, y, sz * o), V(sx * i, y, sz * o), V(sx * i, y, sz * i), V(sx * o, y, sz * i)];
  };
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) column(geos, legCorners(sx, sz), 0, 46, 12, 0.9, 0.32);
  const shaft = (y) => { const o = HALF(y); return [V(o, y, o), V(-o, y, o), V(-o, y, -o), V(o, y, -o)]; };
  column(geos, shaft, 46, 110, 18, 0.7, 0.26);
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) arch(geos, sx, sz, 0.55);
  const metal = std('#6e5a44', { roughness: 0.55, metalness: 0.35 });
  const lattice = new THREE.Mesh(mergeGeometries(geos), metal); lattice.castShadow = true; lattice.receiveShadow = true; g.add(lattice);
  for (const gg of geos) gg.dispose();
  // platforms: a deck and a railing band with a lattice pattern
  const band = canvasTexture(256, 64, (c, w, h) => { c.fillStyle = '#6e5a44'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3f3226'; c.lineWidth = 4; for (let x = -h; x < w; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h, h); c.moveTo(x + h, 0); c.lineTo(x, h); c.stroke(); } });
  band.wrapS = THREE.RepeatWrapping;
  const plat = (y, half, t) => {
    const p = new THREE.Group(); p.position.y = y;
    p.add(box(half * 2 + 1, t, half * 2 + 1, std('#5c4a38', { roughness: 0.6 }), 0, 0, 0));
    const bm = std('#ffffff', { map: band.clone(), roughness: 0.6 }); bm.map.repeat.set(half / 2, 1); bm.map.needsUpdate = true;
    for (const [x, z, ry] of [[0, half + 0.5, 0], [0, -half - 0.5, 0], [half + 0.5, 0, Math.PI / 2], [-half - 0.5, 0, Math.PI / 2]]) { const b = box(half * 2 + 1, t * 1.3, 0.3, bm, x, t * 1.15, z); b.rotation.y = ry; p.add(b); }
    g.add(p); return p;
  };
  plat(23, HALF(23) + 0.6, 1.6); plat(46, HALF(46) + 0.6, 1.2); plat(110, HALF(110) + 0.8, 1.0);
  // the top: lantern cabin and antenna
  g.add(box(3.4, 3.0, 3.4, std('#6e5a44', { roughness: 0.5 }), 0, 112.6, 0), cyl(1.2, 1.7, 2.2, std('#6e5a44'), 12, 0, 115.2, 0), cyl(0.18, 0.3, 10, std('#4c3e30'), 8, 0, 121, 0));
  const flag = box(2.4, 1.6, 0.06, std('#ffffff', { map: canvasTexture(96, 64, (c, w, h) => { c.fillStyle = '#1f3d9e'; c.fillRect(0, 0, w / 3, h); c.fillStyle = '#ffffff'; c.fillRect(w / 3, 0, w / 3, h); c.fillStyle = '#d42a2a'; c.fillRect(2 * w / 3, 0, w / 3, h); }) }), 1.25, 125, 0); g.add(flag);
  // the four piers the legs stand on
  for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) g.add(box(LEG_W(0) + 1.6, 1.2, LEG_W(0) + 1.6, std('#b5a58c', { roughness: 0.85 }), sx * (HALF(0) - LEG_W(0) / 2), 0.6, sz * (HALF(0) - LEG_W(0) / 2)));
  const rustTex = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#7a5a40'; c.fillRect(0, 0, w, w); const r = rng(21); for (let i = 0; i < 260; i++) { c.fillStyle = `hsl(${16 + r() * 14},${55 + r() * 25}%,${28 + r() * 18}%)`; c.beginPath(); c.arc(r() * w, r() * w, 4 + r() * 18, 0, 7); c.fill(); } });
  g.userData = {
    metal, rustTex,
    rust(k) { metal.map = k > 0 ? rustTex : null; metal.color.set('#6e5a44'); if (k > 0) metal.color.lerp(new THREE.Color('#ffffff'), k); metal.needsUpdate = true; },
  };
  return g;
}

// ======================================================= buildings ===================================================
const facadeTex = (seed) => canvasTexture(256, 256, (c, w, h) => {
  c.fillStyle = '#e8dcc2'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(120,100,70,.18)'; for (let y = 0; y < h; y += 16) c.fillRect(0, y, w, 2);
  for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 4; fx++) {
    const x = 18 + fx * 60, y = 22 + fy * 60;
    c.fillStyle = '#3b4a5c'; c.fillRect(x, y, 30, 40); c.fillStyle = '#f2ead6'; c.fillRect(x - 4, y + 40, 38, 5);
    if (fy === 1) { c.fillStyle = '#26282c'; c.fillRect(x - 6, y + 34, 42, 3); for (let k = 0; k < 6; k++) c.fillRect(x - 5 + k * 8, y + 30, 2, 8); }
  }
});
// A Paris block: cream stone, windows, a grey-blue mansard roof with dormers. Front +z.
export function parisBlock(w = 24, h = 16, d = 14, seed = 1) {
  const g = new THREE.Group(), tex = facadeTex(seed); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(w / 16, h / 16);
  g.add(box(w, h, d, std('#ffffff', { map: tex, roughness: 0.85 }), 0, h / 2, 0));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1, 1, 4, 1), std('#5d6b7c', { roughness: 0.6 }));
  roof.scale.set(w * 0.72, 5, d * 0.72); roof.rotation.y = Math.PI / 4; roof.position.y = h + 2.5; roof.castShadow = true; g.add(roof);
  for (let i = 0; i < Math.floor(w / 5); i++) g.add(box(1.4, 1.8, 1.0, std('#e8dcc2'), -w / 2 + 3 + i * 5, h + 1.5, d / 2 - 1.3));
  return g;
}
export function lampPost(lit = false) {
  const g = new THREE.Group(), iron = std('#1f2326', { roughness: 0.4, metalness: 0.6 });
  g.add(cyl(0.16, 0.24, 9, iron, 10, 0, 4.5, 0), cyl(0.5, 0.6, 0.6, iron, 10, 0, 0.3, 0));
  const glass = std('#fff3c4', { emissive: '#ffcf6a', emissiveIntensity: lit ? 2.2 : 0.2, roughness: 0.3 });
  g.add(box(0.9, 1.2, 0.9, glass, 0, 9.6, 0), cyl(0.0, 0.8, 0.6, iron, 4, 0, 10.5, 0));
  g.userData.glass = glass; return g;
}
export function bench() {
  const g = new THREE.Group(), wood = std('#4f6f3a', { roughness: 0.6 }), iron = std('#1f2326', { metalness: 0.5, roughness: 0.4 });
  for (let i = 0; i < 3; i++) g.add(box(6, 0.18, 0.5, wood, 0, 2.0, -0.6 + i * 0.6));
  for (let i = 0; i < 2; i++) g.add(box(6, 0.5, 0.15, wood, 0, 3.0 + i * 0.7, -1.05));
  for (const x of [-2.6, 2.6]) g.add(box(0.2, 2.0, 1.8, iron, x, 1.0, -0.3));
  return g;
}

// ======================================================= PARIS =======================================================
export function paris(scene) {
  const g = new THREE.Group(); g.position.copy(PARIS); scene.add(g);
  const tower = eiffel(); tower.position.copy(TOWER); g.add(tower);
  const gt = gravelTex(4); gt.repeat.set(8, 60);
  g.add(flat(26, 400, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 140));           // the avenue
  const ga = gravelTex(5); ga.repeat.set(30, 30); g.add(flat(110, 110, std('#ffffff', { map: ga, roughness: 0.95 }), 0, -40, 0.015)); // under the tower
  const sp = []; for (let z = 22; z < 300; z += 9) { sp.push([-18, z], [18, z], [-46, z], [46, z]); }
  trees(g, sp, 7);
  for (let z = 30; z < 200; z += 36) for (const x of [-11, 11]) { const l = lampPost(); l.position.set(x, 0, z); g.add(l); }
  const b1 = bench(); b1.position.set(-9.5, 0, 26); b1.rotation.y = Math.PI / 2; g.add(b1); g.userData.bench = b1;
  for (let i = 0; i < 9; i++) for (const side of [-1, 1]) { const b = parisBlock(24 + (i % 3) * 4, 16 + (i % 2) * 3, 16, i); b.position.set(side * 96, 0, -100 + i * 30); b.rotation.y = -side * Math.PI / 2; g.add(b); }
  for (let i = 0; i < 6; i++) { const b = parisBlock(28, 18, 16, i + 20); b.position.set(-75 + i * 30, 0, -150); g.add(b); }
  return { group: g, tower };
}

// ======================================================= rooms =======================================================
// A box room: floor, three walls (back z -D/2, sides) with a wainscot, an open front. Origin at the floor centre.
function room(parent, W, D, H, { wall = '#d9cdb2', wains = '#8b5a3c', floor = '#6b4a32', floorMap = null, trim = '#c9a74a' } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const fm = std(floor, { roughness: 0.6, map: floorMap });
  g.add(box(W, 0.4, D + 20, fm, 0, -0.2, 6));
  const wm = std(wall, { roughness: 0.85 }), wn = std(wains, { roughness: 0.6 }), tm = std(trim, { roughness: 0.4, metalness: 0.5 });
  g.add(box(W, H, 0.5, wm, 0, H / 2, -D / 2), box(W, 3.2, 0.62, wn, 0, 1.6, -D / 2 + 0.06), box(W, 0.25, 0.7, tm, 0, 3.3, -D / 2 + 0.08));
  for (const sx of [-1, 1]) g.add(box(0.5, H, D + 20, wm, sx * W / 2, H / 2, 6), box(0.62, 3.2, D + 20, wn, sx * (W / 2 - 0.06), 1.6, 6), box(0.7, 0.25, D + 20, tm, sx * (W / 2 - 0.08), 3.3, 6));
  g.add(box(W, 0.5, D + 20, std(wall, { roughness: 0.9 }), 0, H, 6));
  return g;
}
const woodFloor = (base = '#7a5236') => { const t = canvasTexture(256, 256, (c, w) => { c.fillStyle = base; c.fillRect(0, 0, w, w); const r = rng(9); for (let y = 0; y < w; y += 32) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y, w, 2); for (let x = (y / 32 % 2) * 64; x < w; x += 128) c.fillRect(x, y, 2, 32); c.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; c.fillRect(0, y + 4, w, 10); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; };
function window_(w, h, view = '#a8cdf0', frame = '#f0e8d6') {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: view })); g.add(glass);
  const fm = std(frame, { roughness: 0.5 });
  g.add(box(w + 0.6, 0.4, 0.4, fm, 0, h / 2, 0.1), box(w + 0.6, 0.4, 0.4, fm, 0, -h / 2, 0.1), box(0.4, h, 0.4, fm, -w / 2, 0, 0.1), box(0.4, h, 0.4, fm, w / 2, 0, 0.1), box(0.18, h, 0.2, fm, 0, 0, 0.1), box(w, 0.18, 0.2, fm, 0, h * 0.15, 0.1));
  g.userData.glass = glass; return g;
}
export function chandelier() {
  const g = new THREE.Group(), gold = std('#d4ab3c', { metalness: 0.8, roughness: 0.25 }), glow = std('#fff6d8', { emissive: '#ffd98a', emissiveIntensity: 2.4 });
  g.add(cyl(0.06, 0.06, 3, gold, 6, 0, 1.5, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.12, 8, 32), gold); ring.rotation.x = Math.PI / 2; g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 24), gold); ring2.rotation.x = Math.PI / 2; ring2.position.y = -0.8; g.add(ring2);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(cyl(0.08, 0.08, 0.5, gold, 6, Math.cos(a) * 2, 0.25, Math.sin(a) * 2), sph(0.2, glow, Math.cos(a) * 2, 0.62, Math.sin(a) * 2, 10)); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), std('#e9f4ff', { roughness: 0.05, metalness: 0.2 })); d.position.set(Math.cos(a) * 1.6, -0.5, Math.sin(a) * 1.6); g.add(d); }
  g.add(sph(0.35, gold, 0, -1.2, 0, 12));
  const light = new THREE.PointLight('#ffd9a0', 60, 40, 1.6); light.position.y = -0.4; g.add(light);
  return g;
}
export function chair(color = '#8a1c2b') {
  const g = new THREE.Group(), wood = std('#5a3622', { roughness: 0.5 }), seat = std(color, { roughness: 0.8 });
  g.add(box(2.2, 0.4, 2.2, seat, 0, 2.0, 0), box(2.2, 3.0, 0.3, seat, 0, 3.6, -1.0));
  for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) g.add(box(0.22, 2.0, 0.22, wood, x, 1.0, z));
  return g;
}
export function hotel(scene) {
  const g = new THREE.Group(); g.position.copy(HOTEL); scene.add(g);
  const carpet = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#7d1b26'; c.fillRect(0, 0, w, w); c.strokeStyle = '#c9a74a'; c.lineWidth = 3; for (let i = 0; i < w; i += 64) for (let j = 0; j < w; j += 64) { c.beginPath(); c.moveTo(i + 32, j + 6); c.lineTo(i + 58, j + 32); c.lineTo(i + 32, j + 58); c.lineTo(i + 6, j + 32); c.closePath(); c.stroke(); } });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(8, 8);
  room(g, 40, 24, 16, { wall: '#efe3c8', wains: '#e2d2ae', floor: '#ffffff', floorMap: carpet, trim: '#c9a74a' });
  // wall panels with gold frames
  const tm = std('#c9a74a', { metalness: 0.6, roughness: 0.35 });
  for (const x of [-15, -9, 9, 15]) { g.add(box(4.2, 0.18, 0.2, tm, x, 12, -11.6), box(4.2, 0.18, 0.2, tm, x, 5, -11.6), box(0.18, 7, 0.2, tm, x - 2.1, 8.5, -11.6), box(0.18, 7, 0.2, tm, x + 2.1, 8.5, -11.6)); }
  const win = window_(8, 10, '#a9cff2'); win.position.set(0, 8.2, -11.7); g.add(win);
  g.add(box(2.4, 12, 0.5, std('#8a1c2b', { roughness: 0.9 }), -5.6, 8.4, -11.4), box(2.4, 12, 0.5, std('#8a1c2b', { roughness: 0.9 }), 5.6, 8.4, -11.4));
  const mini = eiffel(); mini.scale.setScalar(0.11); mini.position.set(2.0, -2, -40); g.add(mini);    // seen through the window
  // the long table and chairs
  const cloth = std('#f6f1e4', { roughness: 0.85 }), wood = std('#5a3622', { roughness: 0.5 });
  g.add(box(16, 0.3, 5, cloth, 0, 3.5, 0), box(16.2, 0.12, 5.2, cloth, 0, 3.38, 0));
  for (const [x, z] of [[-7.5, -2.2], [7.5, -2.2], [-7.5, 2.2], [7.5, 2.2]]) g.add(box(0.4, 3.35, 0.4, wood, x, 1.67, z));
  const chairs = [];
  for (const [x, z, ry] of [[-5, -4.0, 0], [0, -4.0, 0], [5, -4.0, 0], [-10, 0, Math.PI / 2], [10, 0, -Math.PI / 2]]) { const c = chair(); c.position.set(x, 0, z); c.rotation.y = ry; g.add(c); chairs.push(c); }
  const ch = chandelier(); ch.position.set(0, 12.5, 0); g.add(ch);
  // on the table: candles and the papers
  for (const x of [-2.5, 2.5]) { g.add(cyl(0.25, 0.35, 0.3, tm, 10, x, 3.8, -1.3), cyl(0.1, 0.1, 1.0, std('#fbf6e8'), 8, x, 4.4, -1.3), sph(0.12, std('#ffdf8a', { emissive: '#ffb84a', emissiveIntensity: 3 }), x, 5.0, -1.3, 8)); }
  return { group: g, chairs, window: win };
}
export function office(scene) {
  const g = new THREE.Group(); g.position.copy(OFFICE); scene.add(g);
  const wp = canvasTexture(128, 128, (c, w) => { c.fillStyle = '#9fb2b8'; c.fillRect(0, 0, w, w); c.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 10, w); });
  wp.wrapS = wp.wrapT = THREE.RepeatWrapping; wp.repeat.set(8, 4);
  const r = room(g, 30, 18, 14, { wall: '#ffffff', wains: '#5c4330', floor: '#ffffff', floorMap: woodFloor(), trim: '#3c2a1e' });
  r.children[4].material = std('#ffffff', { map: wp, roughness: 0.9 });   // back wall: striped paper
  const win = window_(6, 7, '#a9cff2'); win.position.set(-8, 8, -8.7); g.add(win);
  const wood = std('#5a3622', { roughness: 0.45 });
  const desk = new THREE.Group(); desk.position.copy(DESK).sub(OFFICE); g.add(desk);
  desk.add(box(9, 0.4, 4.4, wood, 0, DESK_Y - 0.2, 0));
  for (const [x, z] of [[-4.1, -1.8], [4.1, -1.8], [-4.1, 1.8], [4.1, 1.8]]) desk.add(box(0.4, DESK_Y - 0.4, 0.4, wood, x, (DESK_Y - 0.4) / 2, z));
  desk.add(box(2.6, 2.4, 3.8, wood, 3.0, 1.4, 0));
  const lamp = new THREE.Group(); lamp.position.set(-3.6, DESK_Y, -1.3); desk.add(lamp);
  lamp.add(cyl(0.4, 0.5, 0.2, std('#2b5f3a', { metalness: 0.3 }), 12, 0, 0.1, 0), cyl(0.06, 0.06, 1.6, std('#c9a74a', { metalness: 0.7 }), 6, 0, 0.9, 0), cyl(0.3, 0.9, 0.7, std('#2b7a4a', { emissive: '#1a4a2a', emissiveIntensity: 0.4 }), 14, 0, 1.8, 0));
  const lampLight = new THREE.PointLight('#ffe2a8', 25, 18, 1.6); lampLight.position.set(-3.6, DESK_Y + 1.4, -1.3); desk.add(lampLight);
  const chairB = chair('#3c2a1e'); chairB.position.set(0, 0, 3.4); chairB.rotation.y = Math.PI; g.add(chairB);
  // a shelf of files on the back wall
  for (let i = 0; i < 2; i++) { g.add(box(8, 0.25, 1.4, wood, 8, 6 + i * 2.6, -8.3)); for (let k = 0; k < 7; k++) g.add(box(0.7, 1.9, 1.1, std(['#8a1c2b', '#2b4f7a', '#3f6b3a', '#c9a74a'][k % 4]), 5 + k * 0.95, 7.1 + i * 2.6, -8.3)); }
  return { group: g, desk, chair: chairB, lampLight, window: win };
}
export function gang(scene) {
  const g = new THREE.Group(); g.position.copy(GANG); scene.add(g);
  room(g, 30, 18, 14, { wall: '#4a2f22', wains: '#2c1b13', floor: '#ffffff', floorMap: woodFloor('#3a2618'), trim: '#a8852f' });
  const blind = canvasTexture(128, 128, (c, w) => { c.fillStyle = '#f2d9a0'; c.fillRect(0, 0, w, w); c.fillStyle = '#3a2618'; for (let y = 0; y < w; y += 16) c.fillRect(0, y, w, 6); });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshBasicMaterial({ map: blind })); win.position.set(0, 8.5, -8.7); g.add(win);
  const wood = std('#2c1b13', { roughness: 0.4 });
  g.add(box(10, 0.4, 4.4, wood, 0, 3.4, -3), box(10, 3.2, 0.3, wood, 0, 1.6, -0.95), box(0.3, 3.2, 4.4, wood, -4.9, 1.6, -3), box(0.3, 3.2, 4.4, wood, 4.9, 1.6, -3));
  const leather = chair('#5a1a12'); leather.scale.setScalar(1.15); leather.position.set(0, 0, -6.3); g.add(leather);
  const lamp = new THREE.Group(); lamp.position.set(3.4, 3.6, -3.6); g.add(lamp);
  lamp.add(cyl(0.4, 0.5, 0.2, std('#c9a74a', { metalness: 0.7 }), 12, 0, 0.1, 0), cyl(0.06, 0.06, 1.6, std('#c9a74a', { metalness: 0.7 }), 6, 0, 0.9, 0), cyl(0.3, 0.9, 0.7, std('#2b7a4a', { emissive: '#1a4a2a', emissiveIntensity: 0.6 }), 14, 0, 1.8, 0));
  const lampLight = new THREE.PointLight('#ffd08a', 70, 26, 1.5); lampLight.position.set(1.0, 6.4, -1.5); g.add(lampLight);
  g.add(box(0.8, 0.5, 0.8, std('#e8e2d0'), -3.0, 3.85, -3.6));      // ashtray-ish box (no smoke)
  return { group: g, lampLight };
}
// ======================================================= STATION =====================================================
export function locomotive() {
  const g = new THREE.Group(), blk = std('#1c1d22', { roughness: 0.4, metalness: 0.5 }), red = std('#b3242c', { roughness: 0.5 }), brass = std('#c9a03a', { metalness: 0.8, roughness: 0.3 });
  const boiler = cyl(1.7, 1.7, 9, blk, 20, 1.5, 4.2, 0); boiler.rotation.z = Math.PI / 2; g.add(boiler);
  const front = cyl(1.75, 1.75, 0.3, std('#2a2b30'), 20, 6.1, 4.2, 0); front.rotation.z = Math.PI / 2; g.add(front);
  g.add(cyl(0.5, 0.7, 2.4, blk, 12, 4.8, 6.6, 0), cyl(0.75, 0.6, 0.4, blk, 12, 4.8, 7.9, 0), sph(0.7, brass, 2.0, 6.0, 0, 12));
  g.add(box(4.0, 5.2, 4.0, blk, -4.6, 4.6, 0), box(4.6, 0.4, 4.6, red, -4.6, 7.3, 0), box(12.5, 0.8, 4.2, red, -0.4, 2.2, 0));
  for (const z of [2.06, -2.06]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ color: '#ffd98a' })); w.position.set(-4.6, 5.6, z * 1.0); w.rotation.y = z > 0 ? 0 : Math.PI; g.add(w); }
  const wheels = [];
  for (const x of [-4.6, -1.2, 1.8, 4.6]) for (const z of [2.0, -2.0]) { const wh = cyl(x > 4 ? 0.9 : 1.5, x > 4 ? 0.9 : 1.5, 0.4, red, 18, x, x > 4 ? 0.9 : 1.5, z); wh.rotation.x = Math.PI / 2; g.add(wh); wheels.push(wh); }
  g.add(box(0.6, 1.6, 4.4, red, 6.6, 1.1, 0));                         // buffer beam
  g.userData.wheels = wheels; g.userData.chimney = V(4.8, 8.2, 0);
  return g;
}
export function carriage() {
  const g = new THREE.Group(), body = std('#2f5e3f', { roughness: 0.5 }), trim = std('#c9a03a', { metalness: 0.7, roughness: 0.3 });
  g.add(box(14, 5.4, 4.2, body, 0, 4.4, 0), box(14.4, 0.5, 4.6, std('#1c1d22'), 0, 7.3, 0), box(14, 0.18, 4.25, trim, 0, 5.4, 0));
  const wm = new THREE.MeshBasicMaterial({ color: '#f6e2b0' });
  for (let i = 0; i < 5; i++) for (const z of [2.12, -2.12]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.7), wm); w.position.set(-5.4 + i * 2.7, 5.4, z); w.rotation.y = z > 0 ? 0 : Math.PI; g.add(w); }
  const wheels = [];
  for (const x of [-5, -3, 3, 5]) for (const z of [1.9, -1.9]) { const wh = cyl(0.9, 0.9, 0.3, std('#1c1d22'), 14, x, 0.9, z); wh.rotation.x = Math.PI / 2; g.add(wh); wheels.push(wh); }
  // the door Max steps through (front face, +z), at x 0
  g.add(box(1.8, 3.6, 0.1, std('#244a31'), 0, 3.6, 2.14));
  g.userData.wheels = wheels;
  return g;
}
export function station(scene) {
  const g = new THREE.Group(); g.position.copy(STATION); scene.add(g);
  const tiles = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#b9b2a4'; c.fillRect(0, 0, w, w); c.strokeStyle = 'rgba(60,56,50,.35)'; c.lineWidth = 2; for (let i = 0; i < w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, w); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(30, 4);
  g.add(box(160, PLAT_Y, 16, std('#ffffff', { map: tiles, roughness: 0.85 }), 0, PLAT_Y / 2, -8));
  g.add(box(160, 0.3, 0.6, std('#e8d36a'), 0, PLAT_Y + 0.02, -0.6));
  const bal = gravelTex(8, '#7d746a'); bal.repeat.set(40, 3); g.add(flat(200, 10, std('#ffffff', { map: bal, roughness: 0.95 }), 0, 5, 0.03));
  const steel = std('#7c8086', { metalness: 0.8, roughness: 0.35 });
  for (const z of [2.6, 5.4]) g.add(box(200, 0.35, 0.3, steel, 0, 0.3, z));
  for (let x = -100; x <= 100; x += 2.2) g.add(box(0.8, 0.2, 4.6, std('#4a3424', { roughness: 0.9 }), x, 0.12, 4));
  // canopy on iron columns
  const iron = std('#2f4a3c', { roughness: 0.4, metalness: 0.5 });
  for (let x = -60; x <= 60; x += 15) g.add(cyl(0.3, 0.3, 11, iron, 10, x, PLAT_Y + 5.5, -6));
  g.add(box(140, 0.5, 14, std('#3a4c44', { roughness: 0.6 }), 0, PLAT_Y + 11.2, -4), box(140, 1.2, 0.3, iron, 0, PLAT_Y + 10.4, 2.9));
  // back wall with arched windows and the clock
  const wall = canvasTexture(512, 128, (c, w, h) => { c.fillStyle = '#c9b48f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { const x = 20 + i * 62; c.fillStyle = '#3d4a58'; c.beginPath(); c.moveTo(x, h - 12); c.lineTo(x, 46); c.arc(x + 20, 46, 20, Math.PI, 0); c.lineTo(x + 40, h - 12); c.closePath(); c.fill(); } });
  wall.wrapS = THREE.RepeatWrapping; wall.repeat.set(3, 1);
  g.add(box(160, 16, 1, std('#ffffff', { map: wall, roughness: 0.85 }), 0, 8, -16.5));
  const clock = new THREE.Group(); clock.position.set(6, PLAT_Y + 8.4, -5.6); g.add(clock);
  clock.add(cyl(1.3, 1.3, 0.4, iron, 24, 0, 0, 0).rotateX(Math.PI / 2));
  const face = label(2.2, 2.2, 128, 128, (c, w) => { c.fillStyle = '#fbf6e8'; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 2, 0, 7); c.fill(); c.fillStyle = '#16141f'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(w / 2 + Math.cos(a) * 52 - 2, w / 2 + Math.sin(a) * 52 - 2, 5, 5); } c.strokeStyle = '#16141f'; c.lineWidth = 6; c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2, 22); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 + 30, w / 2 + 10); c.stroke(); }, { side: THREE.DoubleSide });
  face.position.z = 0.22; clock.add(face); g.add(cyl(0.1, 0.1, 2.6, iron, 6, 6, PLAT_Y + 10.1, -5.6));
  const sign = label(10, 1.8, 600, 108, (c, w, h) => { c.fillStyle = '#1f3a5c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2e6c4'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); SLAB(c, 'PARIS - GARE DE L\'EST', w / 2, h / 2 + 4, 52, '#f2e6c4'); });
  sign.position.set(-14, PLAT_Y + 9.6, 2.75); g.add(sign);
  const loco = locomotive(), car = carriage();
  const train = new THREE.Group(); train.add(loco, car); loco.position.x = 10.5; car.position.x = -3.6; train.position.set(0, 0, 4); g.add(train);
  return { group: g, train, loco, car };
}
// ======================================================= DOCK ========================================================
export function steamship() {
  const g = new THREE.Group(), hullM = std('#1c1d22', { roughness: 0.5 }), red = std('#9b1f24', { roughness: 0.6 }), white = std('#f2efe6', { roughness: 0.6 });
  const shape = new THREE.Shape(); shape.moveTo(-30, -3.5); shape.lineTo(-30, 3.5); shape.lineTo(22, 3.5); shape.quadraticCurveTo(34, 0, 22, -3.5); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0);
  const hull = new THREE.Mesh(geo, hullM); hull.position.y = 1; hull.castShadow = true; g.add(hull);
  const stripe = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false }).rotateX(-Math.PI / 2), red); stripe.scale.set(1.002, 1, 1.01); stripe.position.y = 0.0; g.add(stripe);
  g.add(box(36, 4, 6, white, -4, 9.0, 0), box(22, 3, 5, white, -6, 12.5, 0));
  const wm = new THREE.MeshBasicMaterial({ color: '#2a3442' });
  for (let i = 0; i < 14; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), wm); w.position.set(-20 + i * 2.6, 9.2, 3.02); g.add(w); }
  for (const x of [-12, -2]) { g.add(cyl(1.5, 1.6, 7, std('#c9302c', { roughness: 0.5 }), 16, x, 17, 0), cyl(1.55, 1.55, 1.4, hullM, 16, x, 20.2, 0)); }
  g.add(cyl(0.2, 0.25, 12, std('#3a2a1e'), 8, 14, 13, 0), cyl(0.2, 0.25, 12, std('#3a2a1e'), 8, -24, 13, 0));
  g.userData.funnels = [V(-12, 21, 0), V(-2, 21, 0)];
  return g;
}
export function dock(scene) {
  const g = new THREE.Group(); g.position.copy(DOCK); scene.add(g);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), std('#2f6f9a', { roughness: 0.25, metalness: 0.1 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.15; water.receiveShadow = true; g.add(water);
  const planks = canvasTexture(256, 64, (c, w, h) => { c.fillStyle = '#8a6a48'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.28)'; for (let x = 0; x < w; x += 16) c.fillRect(x, 0, 2, h); });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(20, 2);
  g.add(box(120, 1.2, 14, std('#ffffff', { map: planks, roughness: 0.8 }), 0, 1.6, 6));
  for (let x = -58; x <= 58; x += 6) for (const z of [-0.6, 12.6]) g.add(cyl(0.45, 0.45, 4, std('#5a4330'), 8, x, 0.2, z));
  for (let x = -40; x <= 40; x += 20) g.add(cyl(0.5, 0.6, 1.0, std('#1c1d22', { metalness: 0.5 }), 10, x, 2.7, 0.6));   // bollards
  const ship = steamship(); ship.position.set(4, 0, -6.6); ship.rotation.y = 0; g.add(ship);
  const plank = box(1.8, 0.25, 7, std('#7a5a3a'), -6, 4.2, -2.4); plank.rotation.x = -0.45; g.add(plank);
  for (let i = 0; i < 6; i++) { const c = box(3, 3, 3, std(['#7a5236', '#5a3e2a', '#8a6a48'][i % 3]), -40 + i * 3.4 + (i > 2 ? 30 : 0), 3.7, 10 + (i % 2) * 1.2); g.add(c); }
  return { group: g, ship };
}
// ======================================================= JAIL ========================================================
export function jail(scene) {
  const g = new THREE.Group(); g.position.copy(JAIL); scene.add(g);
  const brick = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#6b5a52'; c.fillRect(0, 0, w, w); const r = rng(13); for (let y = 0; y < w; y += 16) for (let x = (y / 16 % 2) * 16; x < w; x += 32) { c.fillStyle = `hsl(${10 + r() * 14},${18 + r() * 12}%,${30 + r() * 12}%)`; c.fillRect(x + 1, y + 1, 30, 14); } });
  brick.wrapS = brick.wrapT = THREE.RepeatWrapping; brick.repeat.set(10, 10);
  g.add(box(80, 40, 2, std('#ffffff', { map: brick, roughness: 0.9 }), 0, 20, -2));
  const bars = std('#2a2c30', { metalness: 0.6, roughness: 0.4 }), dark = new THREE.MeshBasicMaterial({ color: '#0d0f16' });
  const wins = [];
  for (const [x, y] of [[-14, 12], [-14, 24], [0, 12], [14, 12], [14, 24], [-28, 24], [28, 24]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.4), dark); w.position.set(x, y, -0.98); g.add(w); wins.push(w);
    for (let k = 0; k < 5; k++) g.add(box(0.16, 4.4, 0.16, bars, x - 1.4 + k * 0.7, y, -0.9));
    g.add(box(4.4, 0.4, 0.8, std('#8f8378'), x, y - 2.4, -0.6));
  }
  // the escape window: its bars bent away
  const esc = new THREE.Group(); esc.position.set(0, 24, -0.98); g.add(esc);
  esc.add(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.4), new THREE.MeshBasicMaterial({ color: '#ffd98a' })));
  esc.add(box(4.4, 0.4, 0.8, std('#8f8378'), 0, -2.4, 0.4));
  const pav = gravelTex(14, '#5a5650'); pav.repeat.set(30, 6); g.add(flat(200, 40, std('#ffffff', { map: pav, roughness: 0.95 }), 0, 18, 0.03));
  const lamp = lampPost(true); lamp.position.set(-10, 0, 9); g.add(lamp);
  const lampLight = new THREE.PointLight('#ffcf8a', 120, 40, 1.5); lampLight.position.set(-10, 9.4, 9); g.add(lampLight);
  return { group: g, esc, escY: 24, lampLight };
}
// The rope of knotted bedsheets, hanging from the escape window sill to near the ground. Origin at the top.
export function sheetRope(len = 21) {
  const g = new THREE.Group(), m = std('#f2efe6', { roughness: 0.9 });
  const n = Math.round(len / 2.2);
  for (let i = 0; i < n; i++) { const s = box(0.5, 2.0, 0.12, m, 0, -1.1 - i * 2.2, 0); s.rotation.z = (i % 2 ? 0.05 : -0.05); g.add(s); g.add(sph(0.3, m, 0, -2.15 - i * 2.2, 0, 8)); }
  return g;
}

// ======================================================= props =======================================================
// The bill of sale / deed (the hook and Poisson's embarrassment). GRIP: origin at the bottom edge centre, in the fist.
export function deed() {
  const g = new THREE.Group();
  const paper = label(1.6, 2.1, 320, 420, (c, w, h) => {
    c.fillStyle = '#f4ead2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a3a'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20);
    SLAB(c, 'BILL OF SALE', w / 2, 54, 34, '#3a2a1e'); c.fillStyle = 'rgba(58,42,30,.5)'; for (let i = 0; i < 7; i++) c.fillRect(34, 100 + i * 26, w - 68, 5);
    // the tower drawn small
    c.strokeStyle = '#3a2a1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(w / 2 - 50, 380); c.quadraticCurveTo(w / 2 - 10, 330, w / 2, 280); c.quadraticCurveTo(w / 2 + 10, 330, w / 2 + 50, 380); c.stroke();
    c.fillStyle = '#b3242c'; c.beginPath(); c.arc(w - 70, h - 70, 30, 0, 7); c.fill();
  }, { side: THREE.DoubleSide });
  paper.position.y = 1.05; g.add(paper); return g;
}
// A cash bag (canvas sack with a franc sign). GRIP: origin at the knot, the sack hangs below the fist.
export function cashBag(scale = 1) {
  const g = new THREE.Group(), m = std('#c8b08a', { roughness: 0.9 });
  const s = sph(0.75, m, 0, -0.9, 0, 14); s.scale.set(1, 1.1, 0.9); g.add(s);
  g.add(cyl(0.2, 0.32, 0.4, m, 10, 0, -0.1, 0), cyl(0.24, 0.24, 0.1, std('#7a5236'), 10, 0, -0.18, 0));
  const tag = label(0.7, 0.7, 64, 64, (c, w) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, w); LG(c, '₣', w / 2, w / 2 + 4, 54, '#3a6b2a'); }, { transparent: true });
  tag.position.set(0, -0.9, 0.7); g.add(tag);
  g.scale.setScalar(scale); return g;
}
// The newspaper Max reads. GRIP: origin at the bottom edge centre; held open in front with both hands.
export function newspaper() {
  const g = new THREE.Group();
  const front = label(2.8, 2.0, 560, 400, (c, w, h) => {
    c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, h); SLAB(c, 'LE JOURNAL', w / 2, 40, 44, '#16182a'); c.fillStyle = '#16182a'; c.fillRect(20, 70, w - 40, 4);
    LG(c, 'TOWER RUSTING!', w / 2, 120, 58, '#b0121b'); LG(c, 'REPAIRS: A FORTUNE', w / 2, 178, 34, '#16182a');
    c.strokeStyle = '#16182a'; c.lineWidth = 4; c.beginPath(); c.moveTo(w / 2 - 60, 370); c.quadraticCurveTo(w / 2 - 12, 300, w / 2, 220); c.quadraticCurveTo(w / 2 + 12, 300, w / 2 + 60, 370); c.stroke();
    c.fillStyle = 'rgba(22,24,42,.38)'; for (let i = 0; i < 6; i++) { c.fillRect(24, 220 + i * 26, 150, 6); c.fillRect(w - 174, 220 + i * 26, 150, 6); }
  }, { side: THREE.FrontSide });
  const back = label(2.8, 2.0, 280, 200, (c, w, h) => { c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(22,24,42,.38)'; for (let col = 0; col < 3; col++) for (let i = 0; i < 12; i++) c.fillRect(14 + col * 90, 16 + i * 15, 78, 6); });
  front.position.y = 1.0; back.position.set(0, 1.0, -0.01); back.rotation.y = Math.PI; g.add(front, back);
  return g;
}
export function typewriter() {
  const g = new THREE.Group(), body = std('#22252a', { roughness: 0.35, metalness: 0.4 }), key = std('#e8e2c8', { roughness: 0.4 });
  g.add(box(2.4, 0.5, 1.8, body, 0, 0.25, 0));
  g.add(box(2.4, 0.5, 1.0, body, 0, 0.7, -0.4));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) g.add(cyl(0.08, 0.08, 0.06, key, 8, -0.95 + k * 0.24 + (r % 2) * 0.12, 0.55 + r * 0.06, 0.65 - r * 0.2));
  g.add(cyl(0.18, 0.18, 2.8, std('#16141f', { roughness: 0.5 }), 14, 0, 1.05, -0.55).rotateZ(Math.PI / 2));
  const sheet = label(1.7, 2.25, 340, 450, (c, w, h) => {
    c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f3a5c'; c.beginPath(); c.arc(w / 2, 56, 34, 0, 7); c.fill();
    TYPE(c, 'MINISTERE DES POSTES', w / 2, 116, 22, '#16141f', 'center'); TYPE(c, 'CONFIDENTIEL', w / 2, 150, 26, '#b0121b', 'center');
    c.fillStyle = 'rgba(22,20,31,.55)'; for (let i = 0; i < 8; i++) c.fillRect(30, 190 + i * 26, w - 60 - (i % 3) * 40, 5);
  }, { side: THREE.DoubleSide });
  sheet.position.set(0, 2.1, -0.62); sheet.rotation.x = -0.25; g.add(sheet);
  return g;
}
// The official rubber stamp. GRIP: origin in the fist (handle top), the pad below.
export function stamp() {
  const g = new THREE.Group();
  g.add(sph(0.26, std('#5a3622', { roughness: 0.4 }), 0, 0, 0, 12), cyl(0.09, 0.09, 0.5, std('#5a3622'), 8, 0, -0.35, 0), box(0.7, 0.18, 0.5, std('#5a3622'), 0, -0.65, 0), box(0.66, 0.08, 0.46, std('#8a1c2b'), 0, -0.78, 0));
  return g;
}
// An envelope with a red wax seal (flies to each dealer). Origin at its centre, face +z.
export function letter() {
  const g = new THREE.Group();
  g.add(label(1.4, 0.9, 140, 90, (c, w, h) => { c.fillStyle = '#f2e6c8'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(80,60,30,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * 0.58); c.lineTo(w, 0); c.stroke(); c.fillStyle = '#b3242c'; c.beginPath(); c.arc(w / 2, h * 0.58, 12, 0, 7); c.fill(); }, { side: THREE.DoubleSide }));
  return g;
}
// The candlestick telephone (Mia calls the police). Origin on the table top; the earpiece `ear` is lifted.
export function candlestickPhone() {
  const g = new THREE.Group(), blk = std('#16181f', { roughness: 0.35, metalness: 0.4 }), brass = std('#c9a03a', { metalness: 0.75, roughness: 0.3 });
  g.add(cyl(0.32, 0.38, 0.14, blk, 18, 0, 0.07, 0), cyl(0.07, 0.07, 1.25, blk, 10, 0, 0.75, 0), cyl(0.18, 0.12, 0.26, blk, 14, 0, 1.4, 0.0));
  const mouth = cyl(0.16, 0.1, 0.18, blk, 14, 0, 1.42, 0.14); mouth.rotation.x = Math.PI / 2; g.add(mouth);
  g.add(box(0.06, 0.24, 0.06, brass, 0.14, 1.0, 0), box(0.18, 0.04, 0.06, brass, 0.2, 1.12, 0));
  const ear = new THREE.Group(); g.add(ear);
  ear.add(cyl(0.06, 0.06, 0.5, blk, 10, 0, 0.0, 0), cyl(0.13, 0.08, 0.16, blk, 14, 0, 0.32, 0));
  g.userData.ear = ear; g.userData.rest = V(0.26, 1.0, 0);
  return g;
}
// A leather briefcase (Capone's $50,000). GRIP: origin at the handle; the case hangs below.
export function briefcase() {
  const g = new THREE.Group(), m = std('#5a3622', { roughness: 0.5 }), brass = std('#c9a03a', { metalness: 0.8, roughness: 0.3 });
  g.add(box(2.2, 1.6, 0.6, m, 0, -1.0, 0), box(0.8, 0.12, 0.2, m, 0, -0.08, 0), box(0.12, 0.3, 0.2, m, -0.36, -0.2, 0), box(0.12, 0.3, 0.2, m, 0.36, -0.2, 0));
  for (const x of [-0.7, 0.7]) g.add(box(0.2, 0.16, 0.06, brass, x, -0.36, 0.31));
  return g;
}
// A bundle of banknotes (the reward). GRIP: origin in the fist.
export function cashStack() {
  const g = new THREE.Group();
  g.add(box(1.2, 0.3, 0.6, std('#7fae6a', { roughness: 0.7 }), 0, 0.1, 0), box(0.3, 0.32, 0.62, std('#f2efe6'), 0, 0.1, 0));
  return g;
}
// The "money box": a mahogany trunk-sized box with brass dials and a slot that spits bills. Origin on its base.
export function moneyBox() {
  const g = new THREE.Group(), mah = std('#6a2a1a', { roughness: 0.35 }), brass = std('#c9a03a', { metalness: 0.8, roughness: 0.3 });
  g.add(box(3.6, 2.0, 2.0, mah, 0, 1.0, 0), box(3.7, 0.16, 2.1, brass, 0, 2.0, 0), box(1.8, 0.12, 0.08, std('#16141f'), 0, 1.2, 1.02));
  for (const x of [-1.3, 1.3]) { const d = cyl(0.3, 0.3, 0.12, brass, 16, x, 1.3, 1.04); d.rotation.x = Math.PI / 2; g.add(d); }
  for (let i = 0; i < 3; i++) g.add(sph(0.1, std(i === 1 ? '#ff4a3a' : '#7CFC9A', { emissive: i === 1 ? '#ff2a1a' : '#3aff6a', emissiveIntensity: 1.6 }), -0.4 + i * 0.4, 1.7, 1.02, 8));
  return g;
}
export function bill() { const m = label(1.0, 0.45, 100, 45, (c, w, h) => { c.fillStyle = '#9cc58a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a6b2a'; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6); LG(c, '$', w / 2, h / 2 + 2, 30, '#3a6b2a'); }, { side: THREE.DoubleSide }); m.castShadow = true; return m; }
// The death certificate on the desk (close-up). Origin at its centre, lying flat (face +y).
export function certificate() {
  const g = new THREE.Group();
  const paper = label(6, 7.8, 600, 780, (c, w, h) => {
    c.fillStyle = '#f3ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a6a4a'; c.lineWidth = 8; c.strokeRect(16, 16, w - 32, h - 32);
    SLAB(c, 'CERTIFICATE OF DEATH', w / 2, 80, 40, '#2a2418');
    TYPE(c, 'NAME:  VICTOR LUSTIG', 50, 170, 30, '#2a2418'); TYPE(c, 'DATE:  11 MARCH 1947', 50, 220, 30, '#2a2418');
    TYPE(c, 'OCCUPATION:', 50, 320, 34, '#2a2418');
    c.fillStyle = 'rgba(42,36,24,.35)'; for (let i = 0; i < 6; i++) c.fillRect(50, 560 + i * 28, w - 100 - (i % 2) * 120, 6);
  }, { side: THREE.DoubleSide });
  paper.rotation.x = -Math.PI / 2; g.add(paper);
  return g;
}

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. `hem` extends the shell below the hips.
export function dress(actor, { color = '#2a2d3a', hem = 0.25, sleeves = true, map = null, buttons = null, collar = null, tie = null } = {}) {
  const m = std(color, { roughness: 0.75, map }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (collar) { const sh = box(0.7, 0.9, 0.04, std(collar, { roughness: 0.6 }), 0, 1.6, 0.56); actor.bones.Torso.add(sh); parts.push(sh); }
  if (tie) { const ti = box(0.22, 0.8, 0.05, std(tie, { roughness: 0.5 }), 0, 1.5, 0.585); actor.bones.Torso.add(ti); parts.push(ti); }
  if (buttons) for (let i = 0; i < 3; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, 0.3, 1.1 - i * 0.4, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, material: m, set visible(v) { for (const p of parts) p.visible = v; } };
}
export const pinstripe = (base = '#1c1d24') => { const t = canvasTexture(64, 64, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < w; i += 12) x.fillRect(i, 0, 2, h); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t; };
// a puff of steam/smoke: a soft grey sphere that grows and fades (posed per frame by the clip)
export function puff() { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: '#e8e8ec', roughness: 1, transparent: true, opacity: 0.8, depthWrite: false })); return m; }
