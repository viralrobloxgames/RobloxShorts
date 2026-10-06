// He Flew A Lawn Chair: sets, props and effects built in code.
// World layout (studs, floor y 0). Each place is its own group, shown only in its shots (sky dome follows the camera):
//   YARD    origin. A San Pedro backyard: the girlfriend's mum's house, a fence, a Jeep, the launch spot at LAUNCH.
//   SKY     (0, 260, 0). Open sky: cloud banks below and around; the chair flies here (no ground shown).
//   EYE     (300, 0, 0). An eye-test room: an eye chart on the wall, a stool.
//   PLANE   (0, 260, -300). An airliner's nose, flying with the camera; captain and co-pilot behind the windscreen.
//   TOWER   (-300, 0, 0). An airport apron with the control tower.
//   STREET  (0, 0, 300). A Long Beach street at dusk: houses with lit windows, power poles and lines, a lawn.
//   MUSEUM  (-300, 0, 300). A bright gallery: the chair on a plinth with its jugs and ropes, a plane overhead.
// Props are built with their origin where the hand holds them and their front facing +z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const rbox = (w, h, d, r, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center', wt = 800) => { g.font = `${wt} ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const YARD = V(0, 0, 0), SKY = V(0, 260, 0), EYE = V(300, 0, 0), PLANE = V(0, 260, -300), TOWER = V(-300, 0, 0),
  STREET = V(0, 0, 300), MUSEUM = V(-300, 0, 300);
export const LAUNCH = V(0, 0, 0);                 // yard: where the chair stands before lift-off
export const JEEP = V(7.5, 0, -1.5);              // yard: the Jeep, nose toward -x, the rope tied to its rear bumper
export const LANDING = V(0, 0, 306);              // street: the front lawn he comes down on
export const POLE_Z = 300 - 7;                     // street: the power line runs along x at this z

// ======================================================= ground ======================================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#69a043'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${88 + r() * 20},${40 + r() * 16}%,${32 + r() * 14}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(70, 70);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
  return m;
}
// round leafy trees (instanced): [x, z, scale]
export function trees(parent, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.55, 4, 7), std('#6b4a30', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.2, 1), std('#3f8a3a', { roughness: 0.85, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.85 + r() * 0.35); q.setFromEuler(e.set(0, r() * 6.28, 0));
    m.compose(V(x, 2 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 5.6 * sc, z), q, V(sc, sc * 0.9, sc)); crown.setMatrixAt(i, m);
  });
  for (const o of [trunk, crown]) { o.castShadow = true; o.receiveShadow = true; parent.add(o); }
  return [trunk, crown];
}
// a simple house; front (door, windows) faces +z. Windows use `winM` so a blackout can switch them off.
export function house(w, h, d, wallC, roofC, winM) {
  const g = new THREE.Group(), wall = std(wallC), trim = std('#ffffff');
  g.add(box(w, h, d, wall, 0, h / 2, 0));
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.6, 4), std(roofC)); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); r.position.set(0, h + h * 0.3, 0); r.castShadow = true; g.add(r);
  g.add(box(2.4, 4.4, 0.3, std('#7b3f2a'), 0, 2.2, d / 2 + 0.05));
  for (const x of [-w / 2 + 2.6, w / 2 - 2.6]) { g.add(box(3, 2.4, 0.2, winM, x, h * 0.55, d / 2 + 0.06)); g.add(box(3.4, 0.25, 0.3, trim, x, h * 0.55 - 1.3, d / 2 + 0.1)); }
  return g;
}

// ======================================================= the yard ====================================================
export function yard(scene) {
  const g = new THREE.Group(); g.position.copy(YARD); scene.add(g);
  const winM = std('#9fc6e8', { roughness: 0.2 });
  const h = house(16, 8, 11, '#e9d8b6', '#7a3b2e', winM); h.position.set(-6, 0, -16); g.add(h);
  // a back porch step and a little patio
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), std('#c9bfae', { roughness: 0.9 })); patio.rotation.x = -Math.PI / 2; patio.position.set(-6, 0.03, -7.8); patio.receiveShadow = true; g.add(patio);
  // fence round the yard
  const fence = std('#b98a5a', { roughness: 0.85 });
  for (let x = -26; x <= 26; x += 1.25) g.add(box(0.9, 4, 0.25, fence, x, 2, -24));
  for (const sx of [-1, 1]) for (let z = -24; z <= 18; z += 1.25) g.add(box(0.25, 4, 0.9, fence, sx * 26, 2, z));
  // the neighbours' roofs over the fence
  for (const [x, z, c] of [[-18, -40, '#5b6e8a'], [14, -42, '#8a5b4a'], [-40, 6, '#6e8a5b'], [40, -6, '#8a7a5b']]) {
    const hh = house(14, 7, 10, '#ddd2c0', c, std('#9fc6e8', { roughness: 0.2 })); hh.position.set(x, 0, z); hh.rotation.y = x < -30 ? Math.PI / 2 : x > 30 ? -Math.PI / 2 : 0; g.add(hh);
  }
  trees(g, [[-22, -20, 1.1], [21, -19, 1.2], [23, 12, 1.0], [-23, 14, 0.9], [-34, -30, 1.3], [32, -34, 1.2], [0, -48, 1.3], [-50, -10, 1.2], [48, 20, 1.2]], 7);
  // a garden hose reel and a cooler near the launch spot (a little life in the yard)
  g.add(cyl(0.9, 0.9, 0.5, std('#3a8a4a', { roughness: 0.6 }), 16, -9, 0.9, -4).rotateX(Math.PI / 2));
  g.add(rbox(2.2, 1.5, 1.4, 0.2, std('#3a7fd6', { roughness: 0.5 }), 3.2, 0.75, 3.8), rbox(2.3, 0.3, 1.5, 0.12, std('#ffffff', { roughness: 0.5 }), 3.2, 1.6, 3.8));
  const jeep = jeepModel(); jeep.position.copy(JEEP); jeep.rotation.y = -Math.PI / 2; g.add(jeep);
  return { group: g, jeep, hitch: jeep.localToWorld(V(0, 1.4, -4.6)) };
}
// an open-top Jeep, nose toward +z (local); the rear bumper hook at (0, 1.4, -4.6)
export function jeepModel() {
  const g = new THREE.Group(), body = std('#5c6b3a', { roughness: 0.6 }), dark = std('#1d1f22', { roughness: 0.9 }), chrome = std('#cfd3d8', { metalness: 0.8, roughness: 0.3 });
  g.add(rbox(4.8, 1.8, 8.6, 0.25, body, 0, 2.0, 0));
  g.add(rbox(4.6, 0.5, 3.0, 0.15, body, 0, 3.1, 2.6));                     // bonnet
  g.add(box(4.4, 1.6, 0.15, std('#a9cbe6', { roughness: 0.1, metalness: 0.3 }), 0, 3.9, 1.0));   // windscreen
  g.add(box(4.6, 0.2, 0.25, body, 0, 4.75, 1.0));
  for (const x of [-1.2, 1.2]) g.add(box(1.6, 0.9, 1.6, dark, x, 3.0, -1.3));  // seats
  g.add(box(5.0, 0.5, 0.4, chrome, 0, 1.2, 4.4), box(5.0, 0.5, 0.4, chrome, 0, 1.2, -4.4));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16), chrome); hook.position.set(0, 1.4, -4.65); g.add(hook);
  for (const [x, z] of [[-2.4, 2.8], [2.4, 2.8], [-2.4, -2.8], [2.4, -2.8]]) { const w = cyl(1.15, 1.15, 0.9, dark, 18, x, 1.15, z); w.rotation.z = Math.PI / 2; g.add(w); g.add(cyl(0.45, 0.45, 0.95, chrome, 12, x, 1.15, z).rotateZ(Math.PI / 2)); }
  const spare = cyl(1.0, 1.0, 0.7, dark, 18, 0, 2.3, -4.7); spare.rotation.x = Math.PI / 2; g.add(spare);
  for (const x of [-1.5, 1.5]) g.add(cyl(0.38, 0.38, 0.2, std('#fff5c0', { emissive: '#fff0a0', emissiveIntensity: 0.4 }), 12, x, 2.6, 4.35).rotateX(Math.PI / 2));
  return g;
}

// ======================================================= the lawn chair and balloons =================================
// The chair: an aluminium frame with green-and-white webbing. Origin on the ground between the legs; SEAT is the top of
// the seat (a sitter's root goes 1.5 below it). Plastic water jugs hang off both arms; four ropes rise from the corners
// to the RING above the chair, where the balloon strings gather.
export const SEAT = V(0, 1.75, 0.15), RING = V(0, 10, 0);
export function lawnChair({ ropes = true, jugs = true } = {}) {
  const g = new THREE.Group(), frame = std('#d6dbe2', { metalness: 0.6, roughness: 0.35 });
  const web = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, w); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#2f9a5a' : '#f2f2f2'; c.fillRect(0, i * w / 8, w, w / 8); } c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 8; i++) c.fillRect(i * w / 8, 0, 3, w); });
  const cloth = std('#ffffff', { map: web, roughness: 0.8 });
  g.add(box(3.0, 0.16, 2.3, cloth, 0, 1.6, 0.15));
  const back = box(3.0, 3.4, 0.16, cloth, 0, 3.25, -1.15); back.rotation.x = -0.18; g.add(back);
  const tube = (x0, y0, z0, x1, y1, z1, r = 0.09) => { const a = V(x0, y0, z0), b = V(x1, y1, z1), c = cyl(r, r, a.distanceTo(b), frame, 8); c.position.copy(a).lerp(b, 0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(c); return c; };
  for (const sx of [-1.55, 1.55]) {
    tube(sx, 0, 1.3, sx, 1.6, 1.3); tube(sx, 0, -1.0, sx, 1.6, -1.0); tube(sx, 0.05, 1.3, sx, 0.05, -1.0);    // legs and runner
    tube(sx, 1.6, 1.3, sx, 1.6, -1.05); tube(sx, 1.6, -1.05, sx, 4.9, -1.65);                                 // seat rail, back post
    tube(sx, 2.55, 1.15, sx, 2.55, -1.2, 0.12); tube(sx, 1.6, 1.15, sx, 2.55, 1.15);                          // arm rest and its post
  }
  tube(-1.55, 4.9, -1.65, 1.55, 4.9, -1.65); tube(-1.55, 1.6, 1.3, 1.55, 1.6, 1.3);
  // a hand-painted name on the back
  const nm = label(2.6, 0.7, 520, 140, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(0, 0, w, h); LG(c, 'INSPIRATION I', w / 2, h / 2 + 4, 76, '#1d3d8a'); }, { transparent: true });
  nm.position.set(0, 4.15, -1.0); nm.rotation.x = -0.18; g.add(nm);
  g.userData.jugs = [];
  if (jugs) {
    const jm = std('#eef4f8', { roughness: 0.25, transparent: true, opacity: 0.85 }), wm = std('#7fb8e6', { roughness: 0.1, transparent: true, opacity: 0.7 }), cap = std('#2a6ad6');
    const spots = [[-1.95, 1.9, 0.9], [-1.95, 1.7, -0.1], [-1.95, 1.9, -0.9], [1.95, 1.9, 0.9], [1.95, 1.7, -0.1], [1.95, 1.9, -0.9], [-0.8, 0.9, -1.4], [0.8, 0.9, -1.4]];
    for (const [x, y, z] of spots) {
      const j = new THREE.Group(); j.position.set(x, y, z);
      j.add(rbox(0.75, 1.0, 0.75, 0.18, jm, 0, -0.55, 0), rbox(0.68, 0.7, 0.68, 0.16, wm, 0, -0.68, 0), cyl(0.14, 0.14, 0.18, cap, 10, 0, -0.0, 0));
      const str = cyl(0.025, 0.025, 0.6, std('#e8e2d0'), 4, 0, 0.3, 0); str.castShadow = false; j.add(str);
      g.add(j); g.userData.jugs.push(j);
    }
  }
  const rg = new THREE.Group(); g.add(rg); g.userData.ropes = rg;
  if (ropes) for (const [x, z] of [[-1.55, 1.3], [1.55, 1.3], [-1.55, -1.65], [1.55, -1.65]]) {
    const y0 = z < 0 ? 4.9 : 2.55; const r = tube(x, y0, z, RING.x, RING.y, RING.z, 0.05); r.material = std('#e8e2d0', { roughness: 0.9 }); r.castShadow = false;
    g.remove(r); rg.add(r);
  }
  return g;
}
// The balloon cluster: 42 weather balloons (pale, a little see-through) on strings gathered at the ring. Instanced, so a
// popped one is just a zero-scale matrix. layout[i] = { p: position in the cluster frame (ring at origin), r: radius }.
export function balloons(n = 42, seed = 5) {
  const r = rng(seed), layout = [];
  for (let i = 0; i < n; i++) {                       // a loose dome: rings of balloons, the middle ones highest
    const ring = i < 1 ? 0 : i < 7 ? 1 : i < 19 ? 2 : i < 33 ? 3 : 4;
    const k = ring === 0 ? 0 : i - [0, 1, 7, 19, 33][ring], cnt = [1, 6, 12, 14, 9][ring];
    const a = (k / cnt) * Math.PI * 2 + ring * 0.7 + (r() - 0.5) * 0.25, rad = ring * 4.1 + (r() - 0.5) * 0.8;
    const y = 15 - ring * 1.6 + (ring === 4 ? 6 : 0) + r() * 1.6;
    layout.push({ p: V(Math.cos(a) * rad, y, Math.sin(a) * rad), r: 2.55 + r() * 0.35 });
  }
  const tints = ['#f4efe2', '#efe7d4', '#f6f2ea', '#ece4d2', '#f1ead9'];
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0, transparent: true, opacity: 0.93, emissive: '#2a2416', emissiveIntensity: 0.12 });
  const ball = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), mat, n);
  const strM = new THREE.MeshStandardMaterial({ color: '#d8d2c0', roughness: 0.9 });
  const str = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 4), strM, n);
  const col = new THREE.Color();
  layout.forEach((b, i) => { ball.setColorAt(i, col.set(tints[i % tints.length])); });
  ball.castShadow = true; str.castShadow = false;
  const g = new THREE.Group(); g.add(ball, str);
  g.userData = { ball, str, layout };
  setBalloons(g, () => 1, 0);
  return g;
}
// k(i) in [0,1]: 1 = full balloon, 0 = gone (popped); sway = time for a gentle bob
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
export function setBalloons(g, k, sway, stretch = 1) {
  const { ball, str, layout } = g.userData;
  layout.forEach((b, i) => {
    const kk = k(i), w = 0.25 * Math.sin(sway * 1.3 + i * 1.7);
    const p = b.p.clone(); p.x += w; p.z += 0.25 * Math.cos(sway * 1.1 + i * 2.3); p.y *= stretch;
    _m.compose(p, _q.identity(), _v.set(b.r * kk, b.r * 1.12 * kk, b.r * kk)); ball.setMatrixAt(i, _m);
    // string from the ring (origin) to the bottom of the balloon
    const bot = p.clone().add(V(0, -b.r * 1.1, 0)), len = bot.length();
    _q.setFromUnitVectors(V(0, 1, 0), bot.clone().normalize());
    _m.compose(bot.clone().multiplyScalar(0.5), _q, _v.set(1, kk > 0 ? len : 0.0001, 1)); str.setMatrixAt(i, _m);
  });
  ball.instanceMatrix.needsUpdate = true; str.instanceMatrix.needsUpdate = true;
}
export function balloonWorld(g, i) { const b = g.userData.layout[i]; g.updateMatrixWorld(true); return g.localToWorld(b.p.clone()); }

// ======================================================= the sky =====================================================
export function sky(scene) {
  const g = new THREE.Group(); g.position.copy(SKY); scene.add(g);
  const cm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#dfe8f5', emissiveIntensity: 0.35 });
  const r = rng(31), list = [];
  for (let i = 0; i < 46; i++) {           // cloud banks scattered through a tall column, so the climb streams past them
    const c = cloud(100 + i, 9 + r() * 9); c.material = cm;
    const a = r() * Math.PI * 2, d = 40 + r() * 140;
    c.position.set(Math.cos(a) * d, -160 + r() * 330, Math.sin(a) * d); c.rotation.y = r() * 6; c.userData.base = c.position.clone();
    g.add(c); list.push(c);
  }
  const floor = [];                        // a deck of cloud far below (the "ground" at altitude)
  for (let i = 0; i < 40; i++) { const c = cloud(300 + i, 22 + r() * 10); c.material = cm; const a = r() * Math.PI * 2, d = r() * 420; c.position.set(Math.cos(a) * d, -230, Math.sin(a) * d); g.add(c); floor.push(c); }
  return { group: g, clouds: list, floor };
}

// ======================================================= the eye-test room ==========================================
export function eyeRoom(scene) {
  const g = new THREE.Group(); g.position.copy(EYE); scene.add(g);
  g.add(box(30, 0.3, 26, std('#b9a98e', { roughness: 0.6 }), 0, -0.15, 0));
  const wall = std('#cfe3e0', { roughness: 0.9 });
  g.add(box(30, 14, 0.5, wall, 0, 7, -8), box(0.5, 14, 26, wall, -12, 7, 0), box(0.5, 14, 26, wall, 12, 7, 0));
  const chart = label(5.2, 7.6, 520, 760, (c, w, h) => {
    c.fillStyle = '#fbfbf6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#333'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
    const rows = [['E'], ['F', 'P'], ['T', 'O', 'Z'], ['L', 'P', 'E', 'D'], ['P', 'E', 'C', 'F', 'D'], ['E', 'D', 'F', 'C', 'Z', 'P'], ['F', 'E', 'L', 'O', 'P', 'Z', 'D']];
    let y = 110;
    rows.forEach((row, i) => { const px = [170, 110, 80, 60, 46, 36, 28][i]; c.font = `700 ${px}px Montserrat`; c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(row.join(' '), w / 2, y); y += px * 1.15 + 18; });
  });
  chart.position.set(0, 7.5, -7.7); g.add(chart);
  // a blurred copy over the chart: how it looks to him (faded in by the clip)
  const blur = label(5.2, 7.6, 260, 380, (c, w, h) => {
    c.fillStyle = '#fbfbf6'; c.fillRect(0, 0, w, h); c.filter = 'blur(9px)';
    const rows = [['E'], ['F', 'P'], ['T', 'O', 'Z'], ['L', 'P', 'E', 'D'], ['P', 'E', 'C', 'F', 'D'], ['E', 'D', 'F', 'C', 'Z', 'P'], ['F', 'E', 'L', 'O', 'P', 'Z', 'D']];
    let y = 55; rows.forEach((row, i) => { const px = [85, 55, 40, 30, 23, 18, 14][i]; c.font = `700 ${px}px Montserrat`; c.fillStyle = '#333'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(row.join(' '), w / 2, y); y += px * 1.15 + 9; });
  }, { transparent: true, opacity: 0 });
  blur.position.set(0, 7.5, -7.65); g.add(blur);
  // a framed "PILOT TRAINING" poster with a plane
  const poster = label(5, 3.4, 600, 400, (c, w, h) => { c.fillStyle = '#1d3d8a'; c.fillRect(0, 0, w, h); LG(c, 'LEARN TO FLY', w / 2, 80, 64, '#ffd23f'); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(150, 250); c.lineTo(450, 230); c.lineTo(470, 250); c.lineTo(150, 270); c.fill(); c.fillRect(270, 190, 50, 130); c.fillRect(170, 225, 20, 50); c.strokeStyle = '#d4af37'; c.lineWidth = 20; c.strokeRect(0, 0, w, h); });
  poster.position.set(-7, 8.5, -7.7); g.add(poster);
  g.add(box(2.4, 0.4, 2.4, std('#444', { roughness: 0.5 }), 0, 2.4, 9), cyl(0.15, 0.15, 2.4, std('#999', { metalness: 0.6, roughness: 0.4 }), 8, 0, 1.2, 9));   // stool
  const pointer = cyl(0.05, 0.08, 4.5, std('#7a4a2a'), 6);
  return { group: g, chart, blur, pointer };
}

// ======================================================= the airliner ===============================================
// The front of an airliner, nose toward +z. The windscreen is open (no glass) so the two pilots' faces read; SEATS are
// the seat tops for the captain (left, -x) and the first officer (right, +x), facing +z.
export const PSEAT_L = V(-1.6, 1.75, 2.0), PSEAT_R = V(1.6, 1.75, 2.0);
export function airlinerNose() {
  const g = new THREE.Group(), white = std('#f4f5f7', { roughness: 0.35, metalness: 0.15 }), blue = std('#1f4fa8', { roughness: 0.4 }), dark = std('#1c2230', { roughness: 0.6 });
  const fus = cyl(4.6, 4.6, 46, white, 32); fus.rotation.x = Math.PI / 2; fus.position.set(0, 2.6, -21); g.add(fus);
  // the cockpit section: a shell (floor, walls, roof) with an open windscreen band
  g.add(box(9.0, 0.4, 9, dark, 0, -0.3, 1.0));                                         // floor
  for (const sx of [-1, 1]) g.add(rbox(0.8, 6.8, 9.2, 0.35, white, sx * 4.3, 2.6, 1.0));   // side walls
  g.add(rbox(9.4, 0.9, 9.4, 0.4, white, 0, 6.6, 0.8));                                  // roof
  g.add(rbox(9.4, 2.2, 1.4, 0.5, white, 0, 0.3, 5.6));                                  // below the windscreen
  const nose = sph(4.4, white, 0, 1.0, 6.2, 28); nose.scale.set(1.0, 0.55, 0.8); g.add(nose);
  for (const x of [-4.3, -1.5, 1.5, 4.3]) g.add(box(0.35, 4.3, 0.4, dark, x, 3.6, 5.6));  // windscreen pillars
  g.add(box(9.2, 0.45, 0.6, dark, 0, 1.5, 5.6), box(9.2, 0.45, 0.6, dark, 0, 5.8, 5.6));
  // livery stripe and a side window row
  for (const sx of [-1, 1]) { const s = box(0.1, 0.7, 40, blue, sx * 4.62, 2.4, -20); g.add(s); for (let z = -6; z > -42; z -= 2.6) g.add(box(0.12, 0.8, 0.8, std('#2a3448', { roughness: 0.2 }), sx * 4.62, 3.6, z)); }
  // instrument panel and seats
  const panel = label(8.0, 1.4, 800, 140, (c, w, h) => { c.fillStyle = '#20252f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { c.fillStyle = '#0d1016'; c.beginPath(); c.arc(60 + i * 85, 70, 32, 0, 7); c.fill(); c.strokeStyle = '#58f08a'; c.lineWidth = 4; c.beginPath(); c.arc(60 + i * 85, 70, 24, -1 + i, 1 + i); c.stroke(); } });
  panel.position.set(0, 2.1, 4.85); panel.rotation.x = -0.5; g.add(panel);
  for (const p of [PSEAT_L, PSEAT_R]) { g.add(rbox(2.3, 0.5, 2.2, 0.15, std('#3a3f4a'), p.x, p.y - 0.25, p.z)); g.add(rbox(2.3, 3.6, 0.6, 0.2, std('#3a3f4a'), p.x, p.y + 1.6, p.z - 1.3)); }
  for (const sx of [-1, 1]) { const w = box(1.2, 0.25, 0.8, dark, sx * 1.6, 2.6, 4.3); g.add(w); }   // yokes
  return g;
}
// a whole airliner in the distance (for the chair's sky shots): nose toward +z
export function airliner() {
  const g = new THREE.Group(), white = std('#f4f5f7', { roughness: 0.35, metalness: 0.15 }), blue = std('#1f4fa8', { roughness: 0.4 }), grey = std('#9aa3ad', { metalness: 0.5, roughness: 0.4 });
  const fus = cyl(2.6, 2.6, 40, white, 24); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = sph(2.6, white, 0, 0, 20, 24); nose.scale.set(1, 1, 1.5); g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 24), white); tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.4, -24); g.add(tail);
  g.add(box(44, 0.6, 6, white, 0, -1.0, 0), box(15, 0.4, 3.2, white, 0, 1.0, -25));
  const fin = box(0.5, 9, 6, blue, 0, 5.5, -24.5); fin.rotation.x = -0.35; g.add(fin);
  for (const x of [-9, 9]) { const e = cyl(1.2, 1.0, 5, grey, 16, x, -2.2, 2.0); e.rotation.x = Math.PI / 2; g.add(e); }
  g.add(box(0.1, 0.6, 34, blue, 2.62, 0.2, -2), box(0.1, 0.6, 34, blue, -2.62, 0.2, -2));
  for (let z = 15; z > -18; z -= 2.2) for (const sx of [-1, 1]) g.add(box(0.1, 0.6, 0.6, std('#26324a'), sx * 2.62, 1.2, z));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ======================================================= the airport and control tower ==============================
export function tower(scene) {
  const g = new THREE.Group(); g.position.copy(TOWER); scene.add(g);
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), std('#6d7177', { roughness: 0.95 })); tarmac.rotation.x = -Math.PI / 2; tarmac.position.y = 0.02; tarmac.receiveShadow = true; g.add(tarmac);
  for (let x = -120; x < 120; x += 14) { const l = box(7, 0.05, 0.6, std('#f2f2f2'), x, 0.05, 30); g.add(l); }
  const t = new THREE.Group(), wall = std('#d9d4c4'), dark = std('#2b3550');
  t.add(box(10, 26, 10, wall, 0, 13, 0), box(14, 0.7, 14, dark, 0, 26.4, 0));
  const glass = std('#9fc6e8', { roughness: 0.15, metalness: 0.2, emissive: '#1d2c3a', emissiveIntensity: 0.5 });
  for (const s of [-1, 1]) { t.add(box(12, 5, 0.3, glass, 0, 29.3, s * 6)); t.add(box(0.3, 5, 12, glass, s * 6, 29.3, 0)); }
  t.add(box(13, 0.9, 13, dark, 0, 32.2, 0), cyl(0.1, 0.1, 6, std('#cfd2d6'), 6, 3, 35.6, 3));
  const dish = cyl(1.6, 0.2, 0.6, std('#e6e6e6', { metalness: 0.4 }), 16, -3, 33.4, -3); dish.rotation.x = 0.6; t.add(dish);
  const sgn = label(8, 1.6, 640, 128, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); LG(c, 'CONTROL TOWER', w / 2, h / 2 + 4, 76, '#f2f0e6'); });
  sgn.position.set(0, 20, 5.06); t.add(sgn);
  g.add(t);
  // a parked airliner and a hangar for depth
  const a = airliner(); a.position.set(46, 5, -30); a.rotation.y = -2.4; g.add(a);
  g.add(box(60, 18, 30, std('#b8bec6', { roughness: 0.6, metalness: 0.3 }), -60, 9, -60));
  return { group: g, top: V(TOWER.x, 29, TOWER.z) };
}

// ======================================================= the street at dusk =========================================
export function street(scene) {
  const g = new THREE.Group(); g.position.copy(STREET); scene.add(g);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 16), std('#3c3f45', { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, -16); road.receiveShadow = true; g.add(road);
  for (let x = -190; x < 190; x += 10) g.add(box(4.5, 0.04, 0.4, std('#e8d36a'), x, 0.06, -16));
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(400, 4), std('#a9a69f', { roughness: 0.9 })); walk.rotation.x = -Math.PI / 2; walk.position.set(0, 0.05, -6); walk.receiveShadow = true; g.add(walk);
  // houses on both sides; their windows share winM so the blackout switches them all off at once
  const winM = std('#ffd98a', { emissive: '#ffb54a', emissiveIntensity: 1.4, roughness: 0.4 });
  const cols = ['#e9d8b6', '#d9e4ef', '#f0d6c8', '#dfe8d0', '#efe2c0', '#d8d0e8'];
  for (let i = -6; i <= 6; i++) {
    const hh = house(14, 8, 11, cols[(i + 12) % cols.length], ['#7a3b2e', '#4e5d73', '#6b5a3e'][(i + 12) % 3], winM); hh.position.set(i * 22, 0, 16); hh.rotation.y = Math.PI; g.add(hh);
    const hb = house(14, 8, 11, cols[(i + 15) % cols.length], ['#6b5a3e', '#7a3b2e', '#4e5d73'][(i + 12) % 3], winM); hb.position.set(i * 22 + 8, 0, -38); g.add(hb);
  }
  trees(g, [[-12, 4, 0.9], [14, 3, 0.8], [36, 5, 0.9], [-34, 4, 0.8], [-58, 4, 0.9], [60, 3, 1], [-20, -32, 1], [24, -30, 0.9]], 17);
  // power poles along the near side of the road, with three lines strung between them (sagging catenaries)
  const pole = std('#6a4a30', { roughness: 0.9 }), lines = [];
  const xs = []; for (let x = -132; x <= 132; x += 33) xs.push(x);
  for (const x of xs) { g.add(cyl(0.32, 0.4, 20, pole, 10, x, 10, POLE_Z - 300)); g.add(box(6, 0.35, 0.35, pole, x, 19, POLE_Z - 300)); for (const dx of [-2.5, 0, 2.5]) g.add(cyl(0.12, 0.12, 0.5, std('#dfe4ea'), 8, x + dx * 0.0 + 0, 19.4, POLE_Z - 300 + dx)); }
  const wm = std('#141414', { roughness: 0.6 });
  for (let k = 0; k < xs.length - 1; k++) for (const dz of [-2.5, 0, 2.5]) {
    const a = V(xs[k], 19.4, POLE_Z - 300 + dz), b = V(xs[k + 1], 19.4, POLE_Z - 300 + dz), mid = a.clone().lerp(b, 0.5).add(V(0, -1.6, 0));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 24, 0.07, 5), wm); tube.castShadow = false; g.add(tube); lines.push(tube);
  }
  // street lamps
  const lampM = std('#fff2c8', { emissive: '#ffd68a', emissiveIntensity: 2.0 }), lamps = [];
  for (const x of [-99, -33, 33, 99]) { g.add(cyl(0.18, 0.22, 14, std('#4a4f57', { metalness: 0.5 }), 8, x + 12, 7, -9)); const l = box(2.2, 0.5, 1.0, lampM, x + 12, 14, -10); g.add(l); lamps.push(l); }
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), std('#5f9a3e', { roughness: 0.95 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.04, 3); lawn.receiveShadow = true; g.add(lawn);
  const glow = new THREE.PointLight('#ffb760', 0, 60, 1.6); glow.position.set(0, 9, 14); g.add(glow);
  return { group: g, winM, lampM, lamps, glow, lineAt: (x, dz = 0) => V(x, 19.4 - 1.6 * (1 - ((((x + 132) % 33) / 33) * 2 - 1) ** 2), POLE_Z + dz) };
}
// the police car (after The Super Nose Detective's), nose toward +z
export function policeCar() {
  const g = new THREE.Group(), white = std('#f2f2f2', { metalness: 0.3, roughness: 0.35 }), black = std('#1d2230', { metalness: 0.3, roughness: 0.35 }), tire = std('#1b1b1f', { roughness: 0.9 });
  g.add(rbox(5.4, 1.4, 12, 0.35, black, 0, 1.3, 0), rbox(5.3, 0.9, 5.2, 0.3, white, 0, 1.6, 0));
  g.add(rbox(4.8, 1.5, 5.0, 0.4, white, 0, 2.9, -0.4), box(4.9, 0.9, 4.0, std('#2a3a50', { roughness: 0.1, metalness: 0.5 }), 0, 3.05, -0.4));
  const red = std('#ff2a3a', { emissive: '#ff1a2a', emissiveIntensity: 0 }), blue = std('#2a6aff', { emissive: '#1a5aff', emissiveIntensity: 0 });
  g.add(box(1.6, 0.4, 0.8, red, -0.9, 3.85, -0.4), box(1.6, 0.4, 0.8, blue, 0.9, 3.85, -0.4));
  for (const sx of [-1, 1]) { const b = label(2.4, 0.7, 240, 70, (c, w, h) => { c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, h); MS(c, 'POLICE', w / 2, h / 2 + 2, 48, '#152435'); }); b.position.set(sx * 2.67, 1.7, 0.6); b.rotation.y = sx * Math.PI / 2; g.add(b); }
  for (const [x, z] of [[-2.55, 3.8], [2.55, 3.8], [-2.55, -3.8], [2.55, -3.8]]) { const w = cyl(0.9, 0.9, 0.7, tire, 16, x, 0.9, z); w.rotation.z = Math.PI / 2; g.add(w); }
  const lr = new THREE.PointLight('#ff2a3a', 0, 30, 2), lb = new THREE.PointLight('#2a6aff', 0, 30, 2); lr.position.set(-1, 5, -0.4); lb.position.set(1, 5, -0.4); g.add(lr, lb);
  g.userData = { red, blue, lr, lb };
  return g;
}

// ======================================================= the museum =================================================
export function museum(scene) {
  const g = new THREE.Group(); g.position.copy(MUSEUM); scene.add(g);
  g.add(box(70, 0.3, 50, std('#d8d2c6', { roughness: 0.35 }), 0, -0.15, 0));
  const wall = std('#eef0f2', { roughness: 0.9 });
  g.add(box(70, 34, 0.5, wall, 0, 17, -14), box(0.5, 34, 50, wall, -26, 17, 0), box(0.5, 34, 50, wall, 26, 17, 0));
  // tall windows on the back wall
  for (const x of [-16, 0, 16]) g.add(box(9, 20, 0.2, std('#cfe6ff', { emissive: '#bcdcff', emissiveIntensity: 0.6, roughness: 0.2 }), x, 17, -13.7));
  // a plinth with the chair on it
  g.add(box(8, 1.6, 6.5, std('#2b2f36', { roughness: 0.5 }), 0, 0.8, 0), box(8.3, 0.15, 6.8, std('#c9ccd2', { metalness: 0.6, roughness: 0.3 }), 0, 1.65, 0));
  const chair = lawnChair({ ropes: true, jugs: true }); chair.position.set(0, 1.7, 0); chair.rotation.y = 0.35; g.add(chair);
  // the ropes end in a short bundle of cut string above the ring (no balloons in the museum)
  const plaque = label(4.8, 1.8, 960, 360, (c, w, h) => { c.fillStyle = '#1f232b'; c.fillRect(0, 0, w, h); LG(c, 'LAWN CHAIR, 1982', w / 2, 90, 92, '#ffffff'); MS(c, 'FLOWN TO ABOUT 16,000 FEET', w / 2, 200, 50, '#ffd23f'); MS(c, 'ON 42 WEATHER BALLOONS', w / 2, 272, 50, '#ffd23f'); });
  plaque.position.set(4.6, 2.2, 4.4); plaque.rotation.set(-0.5, -0.35, 0); const stand = cyl(0.12, 0.12, 2.0, std('#555'), 8, 4.6, 1.0, 4.2); g.add(stand, plaque);
  for (const x of [-5.5, 5.5]) { g.add(cyl(0.15, 0.25, 2.6, std('#c9ccd2', { metalness: 0.8, roughness: 0.3 }), 10, x, 1.3, 6)); g.add(sph(0.25, std('#c9ccd2', { metalness: 0.8, roughness: 0.3 }), x, 2.7, 6, 10)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(-5.5, 2.5, 6), V(0, 1.5, 6), V(5.5, 2.5, 6)), 20, 0.12, 8), std('#9b1b2a', { roughness: 0.6 })));
  // real aircraft hanging from the ceiling
  const plane = smallPlane(); plane.position.set(-6, 22, -2); plane.rotation.set(0.05, 0.7, -0.15); g.add(plane);
  const plane2 = smallPlane('#d8402f'); plane2.position.set(14, 26, -6); plane2.rotation.set(-0.05, -0.9, 0.2); plane2.scale.setScalar(0.8); g.add(plane2);
  for (const p of [plane, plane2]) { const w = cyl(0.03, 0.03, 12, std('#888'), 4, p.position.x, p.position.y + 6, p.position.z); w.castShadow = false; g.add(w); }
  const banner = label(18, 3, 1200, 200, (c, w, h) => { c.fillStyle = '#0f2a5a'; c.fillRect(0, 0, w, h); LG(c, 'AIR AND SPACE MUSEUM', w / 2, h / 2 + 6, 104, '#ffffff'); });
  banner.position.set(0, 29, -13.6); g.add(banner);
  const spot = new THREE.SpotLight('#fff6e0', 0, 50, 0.5, 0.5, 1.2); spot.position.set(0, 20, 8); spot.target.position.set(MUSEUM.x, 3, MUSEUM.z); spot.castShadow = true; g.add(spot); scene.add(spot.target);
  return { group: g, chair, spot };
}
// a little propeller plane, nose toward +z
export function smallPlane(color = '#f2c230') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.4 }), dark = std('#222', { roughness: 0.6 });
  const f = cyl(1.2, 0.6, 12, m, 16); f.rotation.x = Math.PI / 2; g.add(f);
  g.add(box(18, 0.35, 3, m, 0, 0.6, 1), box(6, 0.25, 1.6, m, 0, 0.3, -5.6), box(0.25, 2.6, 1.8, m, 0, 1.4, -5.6));
  const canopy = sph(1.2, std('#9fc6e8', { roughness: 0.1 }), 0, 1.0, 2.0, 16); canopy.scale.set(0.8, 0.6, 1.2); g.add(canopy);
  const p = box(4, 0.3, 0.2, dark, 0, 0, 6.3); g.add(p);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ======================================================= hand props =================================================
export function sandwich() {                     // held in the palm, bread edges along x
  const g = new THREE.Group(), bread = std('#e8c890', { roughness: 0.8 }), crust = std('#b9813f', { roughness: 0.8 });
  g.add(rbox(1.0, 0.18, 1.0, 0.06, bread, 0, 0.0, 0), rbox(1.0, 0.18, 1.0, 0.06, bread, 0, 0.36, 0));
  g.add(box(1.06, 0.08, 1.04, std('#63b84a', { roughness: 0.7 }), 0, 0.14, 0), box(0.98, 0.08, 0.98, std('#d8564a', { roughness: 0.6 }), 0, 0.22, 0));
  g.add(box(0.92, 0.04, 0.02, crust, 0, 0.46, 0.5));
  g.rotation.x = 0; return g;
}
export function pistol() {                       // a small pellet pistol; grip at the origin, barrel along +z
  const g = new THREE.Group(), m = std('#2a2c31', { metalness: 0.6, roughness: 0.35 }), w = std('#6a4428', { roughness: 0.7 });
  g.add(box(0.26, 0.7, 0.36, w, 0, 0, 0)); const gr = g.children[0]; gr.rotation.x = 0.25;
  g.add(box(0.26, 0.32, 1.3, m, 0, 0.42, 0.42), cyl(0.07, 0.07, 0.5, m, 8, 0, 0.46, 1.25).rotateX(Math.PI / 2));
  g.add(box(0.06, 0.2, 0.18, m, 0, 0.1, 0.25));
  g.userData.muzzle = V(0, 0.46, 1.5);
  return g;
}
export function radioMic() {                     // a pilot's handheld radio mic with its curly cord
  const g = new THREE.Group(); g.add(rbox(0.5, 0.9, 0.3, 0.12, std('#1d1f24', { roughness: 0.5 }), 0, 0.1, 0)); g.add(box(0.12, 0.25, 0.05, std('#c8202b'), 0.18, 0.15, 0.17)); return g;
}
export function microphone() {                   // a reporter's mic: handle down, the ball on top (+y)
  const g = new THREE.Group(); g.add(cyl(0.12, 0.1, 1.3, std('#1d1f24', { roughness: 0.5 }), 10, 0, 0.3, 0)); g.add(sph(0.28, std('#555b66', { roughness: 0.6, metalness: 0.5 }), 0, 1.05, 0, 14));
  const flag = label(0.55, 0.42, 110, 84, (c, w, h) => { c.fillStyle = '#c8202b'; c.fillRect(0, 0, w, h); MS(c, 'NEWS', w / 2, h / 2 + 2, 30, '#fff'); }); flag.position.set(0, 0.62, 0.13); g.add(flag);
  return g;
}
export function pressCamera() {                  // an old press camera with a flash bulb; grip at the origin
  const g = new THREE.Group(), b = std('#26282d', { roughness: 0.5 });
  g.add(box(1.0, 0.75, 0.6, b, 0, 0.3, 0.2), cyl(0.24, 0.26, 0.45, std('#111'), 14, 0, 0.3, 0.6).rotateX(Math.PI / 2));
  const bulb = sph(0.26, std('#fffbe6', { emissive: '#ffffff', emissiveIntensity: 0 }), 0.42, 0.95, 0.25, 12); g.add(bulb); g.add(cyl(0.05, 0.05, 0.4, std('#aaa'), 6, 0.42, 0.7, 0.25));
  g.userData.bulb = bulb; return g;
}
export function letter() {                       // a folded official letter (front +z)
  const t = canvasTexture(400, 520, (c, w, h) => { c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d3d8a'; c.fillRect(0, 0, w, 70); MS(c, 'NOTICE', w / 2, 38, 34, '#fff'); for (let i = 0; i < 9; i++) { c.fillStyle = '#9aa0aa'; c.fillRect(40, 120 + i * 36, w - 80 - (i % 3) * 40, 12); } c.strokeStyle = '#c8202b'; c.lineWidth = 8; c.strokeRect(220, 420, 140, 70); MS(c, 'FINE', 290, 455, 34, '#c8202b'); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), std('#ffffff', { map: t, roughness: 0.8, side: THREE.DoubleSide }));
  const g = new THREE.Group(); g.add(m); return g;
}
export function flashlight() {
  const g = new THREE.Group(); g.add(cyl(0.14, 0.14, 1.0, std('#2a2c31', { metalness: 0.5, roughness: 0.4 }), 10, 0, 0, 0.25).rotateX(Math.PI / 2));
  g.add(cyl(0.22, 0.16, 0.3, std('#fff6c8', { emissive: '#fff2b0', emissiveIntensity: 1.2 }), 12, 0, 0, 0.85).rotateX(Math.PI / 2));
  return g;
}
// breath puffs, balloon pop scraps, sparks
export function sparks(n = 24) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: '#fff3a0' }), n);
  m.frustumCulled = false; return m;
}
export function scraps(n = 10) {
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ color: '#efe7d4', roughness: 0.6, side: THREE.DoubleSide }), n);
  m.frustumCulled = false; return m;
}
