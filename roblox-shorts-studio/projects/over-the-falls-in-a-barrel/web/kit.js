// She Went Over Niagara Falls In A Barrel: sets and props, built in code.
// World layout (studs). The upper river flows +x at y 0 (z -70..70) to the Horseshoe brink: an arc centred on
// (-110, 0, 0), radius 110, so the brink is at x 0 mid-river and curves back upstream to x -25 at z +-70. The curtain of
// water drops 70 to the lower river (y -70) in a gorge (z -120..120) running on downstream (+x). Banks are big boxes
// (grass tops, rock cliffs). Places:
//   DOCK   (-160, 0.8, 62): a wooden dock on the +z bank where the barrel is filled and pushed off.
//   LEDGE  (110, -68, 104): a rock ledge on the +z side of the lower river where the barrel is landed.
//   PATH   z 104 on the +z upper bank: a dirt path; STAGE (-60, 0, 112) a little platform for the famous shot; the poster.
// Props face +z. The barrel's origin is its bottom centre; it is BARREL_H tall.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 16) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const ARC_C = V(-110, 0, 0), ARC_R = 110, LOW_Y = -70;
export const brinkX = (z) => ARC_C.x + Math.sqrt(Math.max(0, ARC_R * ARC_R - z * z));
export const DOCK = V(-160, 0.8, 62), LEDGE = V(110, -68, 104), STAGE = V(-60, 0, 112), PATH_Z = 104;
export const BARREL_H = 5.0, BARREL_R = 2.3;

const grassTex = () => { const t = canvasTexture(512, 512, (g, w) => { g.fillStyle = '#6f9a45'; g.fillRect(0, 0, w, w); const r = rng(3); for (let i = 0; i < 4000; i++) { const s = 2 + r() * 5; g.fillStyle = `hsl(${85 + r() * 25},${32 + r() * 15}%,${30 + r() * 15}%)`; g.fillRect(r() * w, r() * w, s, s * 2); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const rockTex = () => { const t = canvasTexture(512, 512, (g, w) => { g.fillStyle = '#7d756b'; g.fillRect(0, 0, w, w); const r = rng(8); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '50,46,42' : '170,160,148'},${0.15 + r() * 0.2})`; g.fillRect(r() * w, r() * w, 6 + r() * 30, 3 + r() * 10); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

// ======================================================= land and water ==============================================
export function land(scene) {
  const g = new THREE.Group(); scene.add(g);
  const gt = grassTex(), rt = rockTex();
  const bank = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0, h = 74;
    const top = std('#ffffff', { map: gt.clone(), roughness: 0.95 }); top.map.repeat.set(w / 24, d / 24); top.map.needsUpdate = true;
    const side = std('#ffffff', { map: rt.clone(), roughness: 0.95 }); side.map.repeat.set(Math.max(w, d) / 30, h / 30); side.map.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side]);
    m.position.set((x0 + x1) / 2, -h / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; g.add(m);
  };
  for (const s of [1, -1]) {
    const zs = (a, b) => (s > 0 ? [a, b] : [-b, -a]);
    bank(-700, brinkX(70), ...zs(70, 420));           // upper bank, to the head of the gorge
    bank(brinkX(70), 700, ...zs(120, 420));            // gorge rim downstream
  }
  // rock under the upper river behind the curtain (hidden by the water), and the gorge floor under the lower river
  const rockM = std('#5f5850', { roughness: 1 });
  g.add(box(140, 70, 140, rockM, -112, -35.4, 0));
  return g;
}
// Water with a scrolling streak texture. dir: +1 flows +x. Returns the mesh; call flowWater(mesh, t).
function waterTex(seed, foam = 0.15) {
  const t = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = '#3d93b8'; g.fillRect(0, 0, w, w); const r = rng(seed);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < foam ? '235,245,250' : '120,180,200'},${0.15 + r() * 0.35})`; const x = r() * w, y = r() * w; g.fillRect(x, y, 20 + r() * 80, 2 + r() * 4); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function upperRiver(scene) {
  const sh = new THREE.Shape(); sh.moveTo(-700, -70); sh.lineTo(brinkX(-70), -70);
  for (let i = 0; i <= 40; i++) { const z = -70 + 140 * i / 40; sh.lineTo(brinkX(z), z); }
  sh.lineTo(-700, 70); sh.closePath();
  const geo = new THREE.ShapeGeometry(sh, 4); geo.rotateX(-Math.PI / 2);        // shape (x, y) -> world (x, 0, -y), facing up (the shape is symmetric in z)
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 40, pos.getZ(i) / 40);
  const tex = waterTex(5, 0.12); const m = new THREE.Mesh(geo, std('#ffffff', { map: tex, roughness: 0.4, metalness: 0.0 }));
  m.receiveShadow = true; scene.add(m); m.userData.tex = tex; m.userData.speed = 0.35;
  // rapids: a foamier band before the brink
  return m;
}
export function lowerRiver(scene) {
  const tex = waterTex(9, 0.35); tex.repeat.set(820 / 40, 240 / 40);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(820, 240), std('#ffffff', { map: tex, roughness: 0.4, metalness: 0.0 }));
  m.rotation.x = -Math.PI / 2; m.position.set(290, LOW_Y, 0); m.receiveShadow = true; scene.add(m); m.userData.tex = tex; m.userData.speed = 0.12;
  return m;
}
export function flowWater(m, t) { m.userData.tex.offset.x = -t * m.userData.speed; }
// The curtain: an open cylinder segment along the brink arc, with falling streaks.
export function curtain(scene) {
  const tex = canvasTexture(512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5fa3bd'); gr.addColorStop(0.25, '#cfe8f0'); gr.addColorStop(1, '#f4fbfd');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(12);
    for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,150,175'},${0.2 + r() * 0.4})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 40 + r() * 160); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(14, 1);
  const half = Math.asin(70 / ARC_R);
  const geo = new THREE.CylinderGeometry(ARC_R, ARC_R + 6, -LOW_Y, 64, 1, true, Math.PI / 2 - half, 2 * half);
  const m = new THREE.Mesh(geo, std('#ffffff', { map: tex, roughness: 0.35, emissive: '#bfe3ef', emissiveIntensity: 0.25, side: THREE.DoubleSide }));
  m.position.set(ARC_C.x, LOW_Y / 2 - 0.2, ARC_C.z); scene.add(m); m.userData.tex = tex;
  return m;
}
export function fallCurtain(m, t) { m.userData.tex.offset.y = t * 0.9; }
// Mist and spray: soft white puffs churning up from the base of the falls.
export function mist(scene, n = 46) {
  const g = new THREE.Group(), r = rng(21), mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false, emissive: '#ffffff', emissiveIntensity: 0.35 });
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mat.clone()); m.castShadow = false;
    const z = -70 + 140 * r(); m.userData = { z, r: [r(), r(), r()] }; g.add(m);
  }
  scene.add(g); return g;
}
export function updateMist(g, t, amount = 1) {
  g.children.forEach((m) => {
    const { z, r } = m.userData, life = (t * 0.12 + r[0]) % 1, bx = brinkX(z) + 8 + r[1] * 30;
    m.position.set(bx + life * 16, LOW_Y + 4 + life * (34 + 12 * r[2]), z + (r[2] - 0.5) * 10);
    m.scale.setScalar(8 + life * 14 + r[1] * 6); m.material.opacity = amount * 0.42 * Math.sin(Math.PI * life);
  });
}

// ======================================================= dressing ====================================================
export function trees(scene, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.6, 3.6, 7), std('#6b4a2c', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4, 1), std('#4f7a35', { roughness: 0.9, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.85 + r() * 0.4); q.setFromEuler(e.set(0, r() * 6.28, 0));
    m.compose(V(x, 1.8 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 5.6 * sc, z), q, V(sc * 1.15, sc * 0.95, sc * 1.15)); crown.setMatrixAt(i, m);
  });
  for (const o of [trunk, crown]) { o.castShadow = true; o.receiveShadow = true; scene.add(o); }
  return [trunk, crown];
}
// A crowd of flat block spectators in rows (x0..x1 along x at z, facing `facing`).
export function crowd(scene, x0, x1, z, rows = 3, seed = 9, facing = -1) {
  const r = rng(seed), cols = ['#d94f3d', '#3d7bd9', '#f2c14e', '#5aa05a', '#8c5ad9', '#f4f1e8', '#e08a3a', '#2f9e9e', '#3a3a44'];
  const per = Math.floor((x1 - x0) / 3.2), n = per * rows;
  const tors = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 1.8, 0.9), std('#ffffff', { roughness: 0.8 }), n);
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 1.9, 0.85), std('#2f3340', { roughness: 0.8 }), n);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), std('#f2c79a', { roughness: 0.7 }), n);
  const hats = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 12), std('#3a2e24', { roughness: 0.8 }), n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let k = 0; const base = [];
  for (let row = 0; row < rows; row++) for (let i = 0; i < per; i++, k++) {
    const x = x0 + i * 3.2 + (r() - 0.5) * 1.2 + (row % 2) * 1.6, zz = z - facing * row * 2.6;
    tors.setColorAt(k, c.set(cols[(r() * cols.length) | 0])); base.push([x, zz, r() < 0.6 ? 1 : 0, r()]);
  }
  for (const o of [tors, legs, heads, hats]) { o.castShadow = true; g0(scene).add(o); }
  const cr = { tors, legs, heads, hats, base, n, q };
  bounceCrowd(cr, 0, 0); return cr;
}
const g0 = (scene) => scene;
export function bounceCrowd(cr, t, k) {
  const M = new THREE.Matrix4(), S = V(1, 1, 1), P = V();
  cr.base.forEach(([x, z, hat, ph], i) => {
    const h = k * 0.45 * Math.abs(Math.sin(t * 9 + ph * 6.28));
    M.compose(P.set(x, 0.95, z), cr.q, S.set(1, 1, 1)); cr.legs.setMatrixAt(i, M);
    M.compose(P.set(x, 2.8 + h, z), cr.q, S); cr.tors.setMatrixAt(i, M);
    M.compose(P.set(x, 4.25 + h, z), cr.q, S); cr.heads.setMatrixAt(i, M);
    M.compose(P.set(x, 4.85 + h, z), cr.q, S.setScalar(hat)); cr.hats.setMatrixAt(i, M);
  });
  for (const o of [cr.tors, cr.legs, cr.heads, cr.hats]) o.instanceMatrix.needsUpdate = true;
}
// The dock: planks on posts, from the bank out over the water (along -z), top at DOCK.y.
export function dock(scene) {
  const g = new THREE.Group(), wood = std('#8a6a48', { roughness: 0.85 }), dark = std('#5e4630', { roughness: 0.9 });
  const planks = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#9a7652'; c.fillRect(0, 0, w, w); c.strokeStyle = '#5e4630'; c.lineWidth = 4; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(w, i * 32); c.stroke(); } });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(1, 4);
  const deck = box(9, 0.5, 26, std('#ffffff', { map: planks, roughness: 0.85 }), 0, DOCK.y - 0.25, 0); g.add(deck);
  for (const x of [-4.2, 4.2]) for (const z of [-12, -6, 0, 6]) g.add(box(0.6, 6, 0.6, dark, x, DOCK.y - 3.2, z));
  g.position.set(DOCK.x, 0, DOCK.z - 4); scene.add(g); return g;
}
// The barrel: oak staves (a lathe with a bulge), four iron hoops, a bottom, and a lid on a hinge at the -z rim.
export function barrel() {
  const g = new THREE.Group(), pts = [];
  for (let i = 0; i <= 16; i++) { const v = i / 16; pts.push(new THREE.Vector2(BARREL_R - 0.22 + 0.32 * Math.sin(v * Math.PI), v * BARREL_H)); }
  const staves = canvasTexture(512, 256, (c, w, h) => { c.fillStyle = '#a2743f'; c.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 24; i++) { c.fillStyle = `hsl(28,${40 + r() * 15}%,${34 + r() * 12}%)`; c.fillRect(i * w / 24, 0, w / 24 - 3, h); } c.fillStyle = 'rgba(40,24,10,.6)'; for (let i = 0; i < 24; i++) c.fillRect(i * w / 24 - 1, 0, 3, h); });
  const wood = std('#ffffff', { map: staves, roughness: 0.75, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), wood); body.castShadow = body.receiveShadow = true; g.add(body);
  const iron = std('#3a3a40', { metalness: 0.7, roughness: 0.4 });
  for (const v of [0.08, 0.3, 0.7, 0.92]) { const r = BARREL_R - 0.22 + 0.32 * Math.sin(v * Math.PI) + 0.04; const h = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 40), iron); h.rotation.x = Math.PI / 2; h.position.y = v * BARREL_H; h.castShadow = true; g.add(h); }
  g.add(cyl(BARREL_R - 0.24, BARREL_R - 0.24, 0.12, std('#7a5430'), 32, 0, 0.1, 0));
  // inside floor (darker) so a look in reads as a barrel
  const lidG = new THREE.Group(); lidG.position.set(0, BARREL_H, -(BARREL_R - 0.22)); g.add(lidG);
  const lid = cyl(BARREL_R - 0.12, BARREL_R - 0.12, 0.16, std('#8a5f35', { roughness: 0.7 }), 32, 0, 0.08, BARREL_R - 0.22); lidG.add(lid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), iron); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.2, BARREL_R - 0.22); lidG.add(ring);
  g.userData = { lidG };
  return g;
}
export function setLid(b, open) { b.userData.lidG.rotation.x = -1.75 * open; }      // 0 shut, 1 open (swung back)
// The bicycle pump: foot plate, barrel, a T-handle that slides (setPump), and a hose to the barrel.
export function pump() {
  const g = new THREE.Group(), black = std('#202024', { roughness: 0.5 }), red = std('#b3261e', { roughness: 0.4, metalness: 0.3 }), chrome = std('#c8ccd2', { metalness: 0.9, roughness: 0.25 });
  g.add(box(1.2, 0.12, 0.5, black, 0, 0.06, 0));
  g.add(cyl(0.22, 0.22, 2.4, red, 16, 0, 1.32, 0));
  const rod = new THREE.Group(); g.add(rod);
  rod.add(cyl(0.05, 0.05, 1.4, chrome, 8, 0, 2.6, 0));
  const t = cyl(0.11, 0.11, 1.5, black, 12, 0, 3.3, 0); t.rotation.z = Math.PI / 2; rod.add(t);
  g.userData = { rod, handleY: 3.3 };
  return g;
}
export function setPump(p, k) { p.userData.rod.position.y = -0.5 * k; }               // k 0 up .. 1 pushed down
// A hose from a to b (world), sagging.
export function hose(scene) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.5, -0.3, 0), V(1, 0, 0)]), 16, 0.06, 6), std('#202024'));
  scene.add(m); return m;
}
export function setHose(m, a, b) {
  const mid = a.clone().lerp(b, 0.5); mid.y = Math.min(a.y, b.y) - 0.6;
  m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.6), mid, b.clone().lerp(mid, 0.6), b]), 24, 0.06, 6);
}
// A birthday cake with candles (flames glow), on a crate. Origin at the crate's bottom centre; cake top at 3.05.
export function cake() {
  const g = new THREE.Group();
  g.add(box(2.0, 2.0, 2.0, std('#9a7652', { roughness: 0.9 }), 0, 1.0, 0));
  g.add(cyl(0.95, 0.95, 0.6, std('#f6c1d8', { roughness: 0.6 }), 24, 0, 2.3, 0));
  g.add(cyl(0.97, 0.97, 0.12, std('#ffffff', { roughness: 0.5 }), 24, 0, 2.62, 0));
  const flames = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2; g.add(cyl(0.05, 0.05, 0.42, std(i % 2 ? '#5ab0ff' : '#ffd23f'), 8, Math.cos(a) * 0.55, 2.89, Math.sin(a) * 0.55));
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), std('#ffb347', { emissive: '#ff9a2a', emissiveIntensity: 3 })); f.scale.y = 1.7; f.position.set(Math.cos(a) * 0.55, 3.2, Math.sin(a) * 0.55); g.add(f); flames.push(f);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.userData = { flames };
  return g;
}
// A rowboat: a tapered hull (open), two benches and oars resting. Faces +z; origin at the waterline centre.
export function rowboat() {
  const g = new THREE.Group(), wood = std('#7a4f2a', { roughness: 0.8, side: THREE.DoubleSide }), white = std('#e9e2d0', { roughness: 0.8 });
  const shape = new THREE.Shape(); shape.moveTo(0, 4.2); shape.quadraticCurveTo(2.0, 2.2, 1.9, -2.4); shape.lineTo(-1.9, -2.4); shape.quadraticCurveTo(-2.0, 2.2, 0, 4.2);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: false }), wood); hull.rotation.x = Math.PI / 2; hull.position.y = 0.9; hull.castShadow = true; g.add(hull);
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape), std('#5e3a1c', { roughness: 0.9 })); inner.rotation.x = -Math.PI / 2; inner.position.y = -0.1; inner.scale.set(0.88, 0.88, 1); g.add(inner);
  g.add(box(3.4, 0.25, 0.8, white, 0, 0.55, -1.2)); g.add(box(3.0, 0.25, 0.7, white, 0, 0.55, 1.6));
  for (const sx of [-1, 1]) { const o = cyl(0.08, 0.08, 6, std('#c9a46a'), 6, sx * 2.1, 0.8, -0.3); o.rotation.x = Math.PI / 2 - 0.1; o.rotation.z = sx * 0.15; g.add(o); }
  return g;
}
// The poster: LOST: ONE BARREL · REWARD, on a post.
export function poster() {
  const g = new THREE.Group(), wood = std('#7a5a3c', { roughness: 0.9 });
  g.add(box(0.5, 7, 0.5, wood, 0, 3.5, 0));
  const p = label(3.6, 4.6, 360, 460, (c, w, h) => {
    c.fillStyle = '#f2e6c4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a2a1a'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
    SLAB(c, 'LOST', w / 2, 70, 76, '#b3261e'); SLAB(c, 'ONE BARREL', w / 2, 140, 40, '#3a2a1a');
    c.fillStyle = '#a2743f'; c.beginPath(); c.ellipse(w / 2, 250, 70, 80, 0, 0, 7); c.fill(); c.fillStyle = '#3a3a40'; for (const y of [195, 305]) c.fillRect(w / 2 - 68, y, 136, 10);
    SLAB(c, 'REWARD', w / 2, 380, 52, '#3a2a1a');
  });
  p.position.set(0, 5.0, 0.28); g.add(p); return g;
}
