// The Tornado Came Back: sets, props and the tornado, built in code.
// World layout (studs, floor y 0). One big flat prairie; each place is its own group, shown only in its shots:
//   BASE     origin. The flight line: a concrete apron (x -170..170, z -48..48), a row of bombers (z BOMBER_Z) and a row
//            of fighters (z FIGHTER_Z), three arched hangars behind (front at z -62), the control tower, the weather
//            station building (front -z, at WX_BLDG), the shelter mound (door -z, at SHELTER), the siren pole, the gate.
//   OFFICE   (0, 0, -700). The weather office interior (open +z side): map board, desk with typewriter, radar console,
//            notice board, wall clock, calendar, window with rain, the door on the left wall.
//   ELEVATOR (400, 0, -700). The daydream: a brass 1940s elevator car (open +z side) with a gate, buttons and a dial.
//   TABLE    (-400, 0, -700). A kitchen table with a phone (the last shot).
// Planes face +z, origin on the ground under the wing centre. Props face +z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const BASE = V(0, 0, 0), OFFICE = V(0, 0, -700), ELEVATOR = V(400, 0, -700), TABLE = V(-400, 0, -700);
export const BOMBER_Z = -16, FIGHTER_Z = 22, HANGAR_Z = -62;
export const HANGARS = [-72, 0, 72];                       // hangar centres (x); each 60 wide, door 52 x 17
export const WX_BLDG = V(-92, 0, 80);                     // weather station: front (door) faces -z, door at its x
export const SHELTER = V(112, 0, 64);                      // shelter door (opening faces -z)
export const GATE = V(-200, 0, 92);                        // the base gate (posts on the fence line z 84) on the lane out to the road (along x at z 92)
export const SIREN = V(92, 0, 56);

// ======================================================= ground ======================================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#7d9a4a'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${70 + r() * 30},${30 + r() * 18}%,${30 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(160, 160);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
  return m;
}
// Low round prairie trees (instanced), a far tree line.
export function trees(scene, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.55, 3.2, 7), std('#5b3a24', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.2, 1), std('#4d6e33', { roughness: 0.9, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.8 + r() * 0.5); q.setFromEuler(e.set(0, r() * 6.28, 0));
    m.compose(V(x, 1.6 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 5.2 * sc, z), q, V(sc * 1.15, sc * 0.85, sc * 1.15)); crown.setMatrixAt(i, m);
  });
  for (const o of [trunk, crown]) { o.castShadow = true; o.receiveShadow = true; scene.add(o); }
  return [trunk, crown];
}

// ======================================================= the air base ================================================
export function airbase(scene) {
  const g = new THREE.Group(); scene.add(g);
  // apron: concrete slabs with joints, yellow taxi lines
  const conc = canvasTexture(1024, 1024, (c, w) => {
    c.fillStyle = '#a9a69c'; c.fillRect(0, 0, w, w);
    const r = rng(21);
    for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '60,58,52' : '220,216,205'},${0.05 + r() * 0.08})`; c.fillRect(r() * w, r() * w, 2 + r() * 5, 2 + r() * 5); }
    c.strokeStyle = 'rgba(70,68,62,.55)'; c.lineWidth = 4;
    for (let k = 0; k <= 4; k++) { c.beginPath(); c.moveTo(k * w / 4, 0); c.lineTo(k * w / 4, w); c.stroke(); c.beginPath(); c.moveTo(0, k * w / 4); c.lineTo(w, k * w / 4); c.stroke(); }
    for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(40,38,34,.12)'; c.beginPath(); c.ellipse(r() * w, r() * w, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); c.fill(); }
  });
  conc.wrapS = conc.wrapT = THREE.RepeatWrapping; conc.repeat.set(340 / 40, 120 / 40);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(340, 120), std('#ffffff', { map: conc, roughness: 0.9 }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.03, -6); apron.receiveShadow = true; g.add(apron);
  // aprons in front of each hangar
  for (const x of HANGARS) { const a = new THREE.Mesh(new THREE.PlaneGeometry(58, 20), std('#ffffff', { map: conc, roughness: 0.9 })); a.rotation.x = -Math.PI / 2; a.position.set(x, 0.035, HANGAR_Z + 4); a.receiveShadow = true; g.add(a); }
  const yel = std('#e8c23a', { roughness: 0.6 });
  const stripe = (w, d, x, z) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), yel); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.05, z); g.add(s); };
  stripe(330, 0.5, 0, 3); stripe(330, 0.5, 0, 40);
  for (let x = -150; x <= 150; x += 30) stripe(0.5, 10, x, 3);
  // a road along x at z 92 out to the gate, and a road from the apron to the weather station
  const asph = std('#4a4b4f', { roughness: 0.9 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(600, 12), asph); road.rotation.x = -Math.PI / 2; road.position.set(-150, 0.03, GATE.z); road.receiveShadow = true; g.add(road);
  for (let x = -440; x < 140; x += 8) { const d = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), std('#f2f0e6')); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.05, GATE.z); g.add(d); }
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(12, 48), asph); lane.rotation.x = -Math.PI / 2; lane.position.set(GATE.x, 0.031, GATE.z - 22); lane.receiveShadow = true; g.add(lane);
  // hangars
  const hangars = HANGARS.map((x) => { const h = hangar(); h.group.position.set(x, 0, HANGAR_Z); g.add(h.group); return h; });
  // control tower
  const tw = controlTower(); tw.position.set(122, 0, -66); g.add(tw);
  // weather station (front faces -z)
  const wx = weatherStation(); wx.position.copy(WX_BLDG); g.add(wx);
  // shelter
  const sh = shelter(); sh.position.copy(SHELTER); g.add(sh);
  // siren pole with a rotating red beacon
  g.add(cyl(0.3, 0.35, 12, std('#6a6f76', { metalness: 0.5, roughness: 0.4 }), 10, SIREN.x, 6, SIREN.z));
  const beacon = new THREE.Group(); beacon.position.set(SIREN.x, 12.6, SIREN.z); g.add(beacon);
  const lampM = std('#ff2a2a', { emissive: '#ff1010', emissiveIntensity: 0, roughness: 0.3 });
  beacon.add(cyl(0.8, 0.9, 1.2, lampM, 16)); beacon.add(cyl(0.95, 0.95, 0.2, std('#2a2d33'), 16, 0, -0.7, 0));
  const beam = new THREE.SpotLight('#ff3030', 0, 60, 0.5, 0.5, 1.2); beam.position.set(0, 0, 0); beacon.add(beam); beam.target.position.set(10, -6, 0); beacon.add(beam.target);
  // wind sock
  g.add(cyl(0.15, 0.15, 10, std('#d8d8d8', { metalness: 0.5 }), 8, -40, 5, 56));
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 12, 1, true), std('#ff6a1a', { side: THREE.DoubleSide })); sock.rotation.z = Math.PI / 2; sock.position.set(-37.5, 9.4, 56); g.add(sock);
  // perimeter fence along the road, the gate
  const fenceM = std('#8d9096', { metalness: 0.4, roughness: 0.5 });
  for (let x = -420; x <= 160; x += 8) if (Math.abs(x - GATE.x) > 12) g.add(box(0.25, 4, 0.25, fenceM, x, 2, GATE.z - 8));
  g.add(box(160, 0.15, 0.1, fenceM, GATE.x - 92, 3.6, GATE.z - 8), box(340, 0.15, 0.1, fenceM, GATE.x + 182, 3.6, GATE.z - 8));
  const gate = baseGate(); gate.position.copy(GATE); g.add(gate);
  g.userData = { hangars, beacon, lampM, beam, sock };
  // floodlights on tall poles along the apron (lit at night)
  const flood = [];
  for (const x of [-140, -45, 45, 140]) {
    g.add(cyl(0.35, 0.45, 22, std('#6a6f76', { metalness: 0.5, roughness: 0.4 }), 10, x, 11, 50));
    const head = box(3, 1.2, 1.2, std('#f6f0d8', { emissive: '#fff2c8', emissiveIntensity: 0 }), x, 22.2, 49.4); g.add(head); flood.push(head);
  }
  g.userData.flood = flood;
  return g;
}

// An arched hangar: side walls, a barrel roof, a back wall, an open front with two door leaves sliding on a track.
// Origin at the front centre on the ground; the building runs back along -z. open(k): 1 open, 0 shut.
export function hangar() {
  const g = new THREE.Group(), W = 60, D = 44, Hw = 14;
  const wall = std('#a7aca4', { roughness: 0.75, metalness: 0.15 }), roof = std('#8e959a', { roughness: 0.55, metalness: 0.35 });
  const inner = std('#5d6264', { roughness: 0.9 });
  g.add(box(1, Hw, D, wall, -W / 2, Hw / 2, -D / 2), box(1, Hw, D, wall, W / 2, Hw / 2, -D / 2));
  // barrel roof: a half cylinder from the top of the walls
  const r = W / 2;
  const rf = new THREE.Mesh(new THREE.CylinderGeometry(r, r, D, 40, 1, true, -Math.PI / 2, Math.PI), std('#8e959a', { roughness: 0.55, metalness: 0.35, side: THREE.DoubleSide }));
  rf.rotation.x = Math.PI / 2; rf.rotation.y = 0; rf.scale.set(1, 1, 0.42); rf.position.set(0, Hw, -D / 2); rf.castShadow = rf.receiveShadow = true;
  rf.rotation.set(-Math.PI / 2, 0, 0); g.add(rf);
  // back wall and the front gable (an arch-shaped panel above the door opening)
  const arch = new THREE.Shape(); arch.moveTo(-r, 0); for (let i = 0; i <= 40; i++) { const a = Math.PI - (i / 40) * Math.PI; arch.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.42); } arch.lineTo(-r, 0);
  const archGeo = new THREE.ShapeGeometry(arch);
  const back = new THREE.Mesh(archGeo, wall); back.position.set(0, Hw, -D); g.add(back);
  g.add(box(W, Hw, 1, wall, 0, Hw / 2, -D));
  const front = new THREE.Mesh(archGeo, wall); front.position.set(0, Hw, 0.05); g.add(front);
  const lintel = box(W, 3, 1.2, wall, 0, Hw + 0.5, 0.2); g.add(lintel);
  // inside: a dark floor and a back light strip
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, D), inner); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.04, -D / 2); fl.receiveShadow = true; g.add(fl);
  // big number on the gable
  const n = label(8, 4, 256, 128, (c, w, h) => { c.fillStyle = '#a7aca4'; c.fillRect(0, 0, w, h); LG(c, 'HANGAR', w / 2, h / 2 + 4, 66, '#2b3550'); });
  n.position.set(0, Hw + 5.5, 0.1); g.add(n);
  // door leaves on a track (each 26 wide, 13 tall); shut: x = -13 and +13; open: slid out past the walls
  const doorM = std('#7f878c', { roughness: 0.5, metalness: 0.4 });
  const leaves = [-1, 1].map((s) => {
    const l = new THREE.Group(); g.add(l);
    l.add(box(26, 13.6, 0.6, doorM, 0, 6.8, 0));
    for (let k = -2; k <= 2; k++) l.add(box(0.3, 13.6, 0.7, std('#69707a', { metalness: 0.4, roughness: 0.5 }), k * 5, 6.8, 0.05));
    l.add(box(26, 0.4, 0.7, std('#69707a', { metalness: 0.4, roughness: 0.5 }), 0, 6.8, 0.05));
    l.userData.s = s; return l;
  });
  const open = (k) => { for (const l of leaves) l.position.set(l.userData.s * (13 + 26 * k), 0, 1.0); };
  open(1);
  return { group: g, leaves, open, W, D };
}

export function controlTower() {
  const g = new THREE.Group(), wall = std('#d9d4c4'), dark = std('#2b3550');
  g.add(box(10, 16, 10, wall, 0, 8, 0));
  g.add(box(13, 0.6, 13, dark, 0, 16.3, 0));
  const glass = std('#9fc6e8', { roughness: 0.15, metalness: 0.2, emissive: '#1d2c3a', emissiveIntensity: 0.5 });
  for (const s of [-1, 1]) { g.add(box(11, 4, 0.3, glass, 0, 18.6, s * 5.5)); g.add(box(0.3, 4, 11, glass, s * 5.5, 18.6, 0)); }
  g.add(box(12, 0.8, 12, dark, 0, 21, 0));
  g.add(cyl(0.08, 0.08, 5, std('#cfd2d6'), 6, 3, 23.5, 3));
  const sgn = label(8, 1.6, 640, 128, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); LG(c, 'CONTROL TOWER', w / 2, h / 2 + 4, 76, '#f2f0e6'); });
  sgn.position.set(0, 12, 5.06); g.add(sgn);
  return g;
}

// Weather station: a long low building; front (-z) with a door at x 0, windows, a WEATHER STATION sign, a porch roof.
export function weatherStation() {
  const g = new THREE.Group(), wall = std('#e2dccb', { roughness: 0.8 }), trim = std('#2b3550');
  g.add(box(34, 9, 14, wall, 0, 4.5, 7));
  g.add(box(35, 0.8, 15, trim, 0, 9.3, 7));
  g.add(box(3.2, 5.6, 0.3, std('#4a3424'), 0, 2.8, -0.1));                                 // door
  const win = std('#9fc6e8', { roughness: 0.2, emissive: '#ffd58a', emissiveIntensity: 0.0 });
  for (const x of [-12, -6, 6, 12]) g.add(box(3.6, 2.6, 0.3, win, x, 5, -0.1));
  const sgn = label(14, 2, 900, 128, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8c23a'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); LG(c, 'WEATHER STATION', w / 2, h / 2 + 4, 88, '#f2f0e6'); });
  sgn.position.set(0, 8.0, -0.2); sgn.rotation.y = Math.PI; g.add(sgn);
  // porch roof over the door on two posts
  g.add(box(10, 0.4, 5, trim, 0, 7.2, -2.4));
  for (const x of [-4.6, 4.6]) g.add(box(0.35, 7.2, 0.35, std('#d8d8d8'), x, 3.6, -4.6));
  const lamp = sph(0.35, std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 0 }), 0, 6.6, -1.0, 10); g.add(lamp);
  g.userData = { win, lamp };
  return g;
}

// Shelter: a grassy mound with a concrete entrance; the dark opening faces -z. Origin at the doorway on the ground.
export function shelter() {
  const g = new THREE.Group(), conc = std('#b8b4a8', { roughness: 0.9 });
  const mound = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std('#6f8f3e', { roughness: 0.95 }));
  mound.scale.set(1.2, 0.5, 1); mound.position.set(0, 0, 10); mound.receiveShadow = true; g.add(mound);
  g.add(box(10, 7.5, 3, conc, 0, 3.75, 1.2));
  g.add(box(6, 5.5, 0.2, std('#0b0b0d', { roughness: 1 }), 0, 2.75, -0.35));                  // the dark way in
  g.add(box(11, 0.8, 3.4, conc, 0, 7.6, 1.2));
  const sgn = label(7, 1.5, 560, 120, (c, w, h) => { c.fillStyle = '#e8c23a'; c.fillRect(0, 0, w, h); c.fillStyle = '#16141f'; for (let i = -2; i < 14; i++) { c.beginPath(); c.moveTo(i * 40, 0); c.lineTo(i * 40 + 20, 0); c.lineTo(i * 40 - 20, h); c.lineTo(i * 40 - 40, h); c.closePath(); c.globalAlpha = 0.18; c.fill(); } c.globalAlpha = 1; LG(c, 'SHELTER', w / 2, h / 2 + 4, 84, '#16141f'); });
  sgn.position.set(0, 6.4, -0.4); sgn.rotation.y = Math.PI; g.add(sgn);
  return g;
}

export function baseGate() {
  const g = new THREE.Group(), post = std('#e2dccb'), trim = std('#2b3550');
  for (const s of [-1, 1]) g.add(box(1.6, 9, 1.6, post, s * 9, 4.5, -8));
  const sgn = label(18, 2.4, 1200, 160, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8c23a'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'U.S. AIR FORCE BASE', w / 2, h / 2 + 6, 104, '#f2f0e6'); });
  sgn.position.set(0, 9.6, -8); g.add(sgn);
  const back = sgn.clone(); back.rotation.y = Math.PI; back.position.z = -8.05; g.add(back);
  g.add(box(19.6, 0.5, 0.5, trim, 0, 8.2, -8));
  // guard booth
  g.add(box(4, 6, 4, std('#e2dccb'), 13, 3, -2), box(4.6, 0.5, 4.6, trim, 13, 6.2, -2), box(2.6, 1.6, 0.2, std('#9fc6e8', { roughness: 0.2 }), 13, 4, -4.05));
  return g;
}

// ======================================================= planes ======================================================
const silver = () => std('#c9ced3', { roughness: 0.32, metalness: 0.75 });
const olive = () => std('#5b6338', { roughness: 0.6, metalness: 0.15 });
// US star insignia decal (white star on a blue disc with white bars).
function insignia(size) {
  return label(size * 2, size, 256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.fillRect(20, h * 0.36, w - 40, h * 0.28); c.fillStyle = '#c8202b'; c.fillRect(20, h * 0.46, w - 40, h * 0.08);
    c.fillStyle = '#1d3b8a'; c.beginPath(); c.arc(w / 2, h / 2, h * 0.46, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? h * 0.17 : h * 0.42; c.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); } c.closePath(); c.fill();
  }, { transparent: true, alphaTest: 0.1, roughness: 0.5 });
}
function prop3(m, r = 2.2) {
  const p = new THREE.Group();
  for (let i = 0; i < 3; i++) { const b = box(0.35, r * 2, 0.12, m, 0, 0, 0); b.geometry.translate(0, r * 0.5 - r * 0.5, 0); b.rotation.z = (i / 3) * Math.PI * 2; p.add(b); }
  p.add(sph(0.35, std('#d8d8d8', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0.1, 10));
  return p;
}
// A four-engine bomber (silver, glazed nose). Length ~34 (z), wingspan 48 (x). Origin on the ground under the wing.
export function bomber() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const m = silver(), dark = std('#2a2d33', { roughness: 0.6 }), glass = std('#a9cbe6', { roughness: 0.1, metalness: 0.3, emissive: '#223344', emissiveIntensity: 0.3 });
  const fus = cyl(2.3, 2.3, 30, m, 20); fus.rotation.x = Math.PI / 2; fus.position.set(0, 5.6, -2); body.add(fus);
  const nose = sph(2.3, glass, 0, 5.6, 13, 20); nose.scale.set(1, 1, 1.2); body.add(nose);
  const tailc = new THREE.Mesh(new THREE.ConeGeometry(2.3, 8, 20), m); tailc.rotation.x = -Math.PI / 2; tailc.position.set(0, 5.9, -21); tailc.castShadow = true; body.add(tailc);
  body.add(box(48, 0.7, 6.4, m, 0, 5.0, 1));                                                // wing
  body.add(box(18, 0.5, 4, m, 0, 6.2, -22.5));                                              // tail plane
  const fin = box(0.6, 9, 6, m, 0, 10.5, -22.5); fin.rotation.x = -0.12; body.add(fin);
  const props = [];
  for (const x of [-15, -7.5, 7.5, 15]) {
    const n = cyl(1.1, 1.3, 6, m, 14, x, 4.6, 3.5); n.rotation.x = Math.PI / 2; body.add(n);
    body.add(sph(1.15, dark, x, 4.6, 6.4, 12));
    const p = prop3(dark, 2.6); p.position.set(x, 4.6, 7.0); body.add(p); props.push(p);
  }
  // landing gear
  for (const x of [-7.5, 7.5]) { body.add(box(0.5, 3, 0.5, dark, x, 2.4, 2)); const w = cyl(1.2, 1.2, 1, std('#1b1b1d', { roughness: 0.9 }), 16, x, 1.2, 2); w.rotation.z = Math.PI / 2; body.add(w); }
  body.add(box(0.4, 3, 0.4, dark, 0, 2.4, 11)); { const w = cyl(0.9, 0.9, 0.8, std('#1b1b1d', { roughness: 0.9 }), 14, 0, 0.9, 11); w.rotation.z = Math.PI / 2; body.add(w); }
  for (const s of [-1, 1]) { const d = insignia(3); d.position.set(s * 16, 5.37, 0); d.rotation.x = -Math.PI / 2; d.rotation.z = s > 0 ? 0 : Math.PI; body.add(d); }
  const sd = insignia(1.8); sd.position.set(2.32, 5.6, -12); sd.rotation.y = Math.PI / 2; body.add(sd);
  const sd2 = insignia(1.8); sd2.position.set(-2.32, 5.6, -12); sd2.rotation.y = -Math.PI / 2; body.add(sd2);
  g.userData = { body, props, kind: 'bomber', span: 48, len: 36 };
  return g;
}
// A single-engine fighter (olive drab, big round nose, bubble canopy). Length ~18, wingspan 20, tail-dragger.
export function fighter() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const m = olive(), dark = std('#2a2d33', { roughness: 0.6 }), glass = std('#a9cbe6', { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.6 });
  body.rotation.x = -0.12;                                                                    // sits nose-up on its tail wheel
  const fus = cyl(1.5, 1.0, 13, m, 16); fus.rotation.x = Math.PI / 2; fus.position.set(0, 3.2, 0); body.add(fus);
  const cowl = cyl(1.75, 1.6, 3.6, m, 18, 0, 3.2, 7.6); cowl.rotation.x = Math.PI / 2; body.add(cowl);
  body.add(sph(0.7, std('#c8202b', { roughness: 0.4 }), 0, 3.2, 9.6, 12));
  const p = prop3(dark, 2.5); p.position.set(0, 3.2, 9.9); body.add(p);
  body.add(box(20, 0.45, 3.6, m, 0, 2.3, 2.5));
  body.add(box(7, 0.35, 2.2, m, 0, 3.6, -6.2));
  body.add(box(0.4, 3.0, 2.6, m, 0, 5.0, -6.0));
  const can = sph(1.0, glass, 0, 4.6, 1.5, 14); can.scale.set(0.9, 0.75, 1.6); body.add(can);
  for (const x of [-3.2, 3.2]) { body.add(box(0.35, 2, 0.35, dark, x, 1.6, 3)); const w = cyl(0.9, 0.9, 0.6, std('#1b1b1d', { roughness: 0.9 }), 14, x, 0.9, 3); w.rotation.z = Math.PI / 2; body.add(w); }
  { const w = cyl(0.4, 0.4, 0.3, std('#1b1b1d', { roughness: 0.9 }), 10, 0, 1.0, -6.4); w.rotation.z = Math.PI / 2; body.add(w); }
  for (const s of [-1, 1]) { const d = insignia(1.6); d.position.set(s * 7, 2.54, 2.5); d.rotation.x = -Math.PI / 2; body.add(d); }
  g.userData = { body, props: [p], kind: 'fighter', span: 20, len: 18 };
  return g;
}
// A plane's rest pose and its tossed pose: k (0..1) flight progress from (x0,z0) to (x1,z1), arcing up h, spinning.
// spin: [pitch wobble (rad), extra yaw (rad), whole roll turns (+-1, +-2)]; end: { rz (~PI: upside down), ry, y }.
export function tossPose(pl, from, to, h, k, spin, end, heading = 0) {
  const p = from.clone().lerp(to, k); p.y = 4 * h * k * (1 - k) + (end.y ?? 0) * k;
  pl.position.copy(p);
  pl.rotation.set(spin[0] * Math.sin(Math.PI * k), heading + (spin[1] + (end.ry ?? 0)) * k, (spin[2] * Math.PI * 2 + (end.rz ?? 0)) * k);
}

// ======================================================= the tornado =================================================
// A funnel of three spinning streaked shells (lathe), a dust skirt and orbiting debris, under a wall cloud.
// update(tor, t, o): o.strength 0..1 (touch-down), o.spin speed; place the group at the funnel's ground point.
function streakTex(seed, light) {
  return canvasTexture(512, 512, (c, w, h) => {
    const r = rng(seed);
    c.fillStyle = light ? '#d9d6cf' : '#55585e'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const y = r() * h, len = 60 + r() * 260, x = r() * w, th = 2 + r() * 9, v = light ? 170 + r() * 80 : 40 + r() * 90;
      c.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.25 + r() * 0.5})`;
      c.fillRect(x, y, len, th); c.fillRect(x - w, y, len, th);
    }
  });
}
function alphaTex(seed) {
  return canvasTexture(512, 512, (c, w, h) => {
    const r = rng(seed); c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      const y = r() * h, len = 80 + r() * 300, x = r() * w, th = 3 + r() * 14, v = 120 + r() * 135;
      c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x, y, len, th); c.fillRect(x - w, y, len, th);
    }
    // fade out at the very bottom (into the dust) and blend into the cloud at the top
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.06, 'rgba(0,0,0,0)'); gr.addColorStop(0.92, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  });
}
export function tornado({ height = 70, r0 = 2.6, r1 = 20, light = false, seed = 1 } = {}) {
  const g = new THREE.Group(), shells = [];
  const prof = (k, rs) => { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(new THREE.Vector2((r0 + (r1 - r0) * Math.pow(u, 2.3)) * rs * (1 + 0.08 * Math.sin(u * 9 + k)), u * height)); } return pts; };
  [[1.0, 0.95, 1.0], [1.18, 0.6, -0.7], [0.82, 0.9, 1.6]].forEach(([rs, op, sp], i) => {
    const geo = new THREE.LatheGeometry(prof(i * 2.1, rs), 56);
    const pos = geo.attributes.position;                                                  // lean: the top drifts back (-x)
    for (let k = 0; k < pos.count; k++) { const y = pos.getY(k), u = y / height; pos.setX(k, pos.getX(k) - 9 * u * u); }
    geo.computeVertexNormals();
    const map = streakTex(seed * 10 + i, light), am = alphaTex(seed * 10 + i + 5);
    map.wrapS = am.wrapS = THREE.RepeatWrapping; map.repeat.set(2, 1); am.repeat.set(2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: light ? '#f2efe8' : '#8a8d93', map, alphaMap: am, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, roughness: 1, emissive: light ? '#6d6a62' : '#202226', emissiveIntensity: 0.35 });
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 3 + i; m.frustumCulled = false; g.add(m); shells.push({ m, map, am, sp });
  });
  // dust skirt: puffs around the base
  const dustM = new THREE.MeshStandardMaterial({ color: light ? '#cbbfa6' : '#7b7466', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  const dust = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), dustM, 46); dust.frustumCulled = false; dust.renderOrder = 2; g.add(dust);
  // debris: planks and sheets
  const debM = std(light ? '#6b5a48' : '#3b3631', { roughness: 0.9 });
  const deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.25, 0.6), debM, 70); deb.castShadow = true; deb.frustumCulled = false; g.add(deb);
  // wall cloud above
  const wc = cloud(seed + 40, 34); wc.material = new THREE.MeshStandardMaterial({ color: light ? '#8d8a86' : '#3d4049', roughness: 1, emissive: '#15171c', emissiveIntensity: 0.4 });
  wc.position.set(-9, height + 4, 0); wc.scale.set(1.6, 0.5, 1.6); g.add(wc);
  g.userData = { shells, dust, deb, wc, height, r0, r1, seed };
  return g;
}
const tM = new THREE.Matrix4(), tQ = new THREE.Quaternion(), tE = new THREE.Euler();
export function updateTornado(tor, t, { strength = 1, spin = 1 } = {}) {
  const { shells, dust, deb, wc, height, r0, seed } = tor.userData, r = rng(seed * 7 + 3);
  shells.forEach((s, i) => { s.map.offset.x = -t * 0.55 * spin * s.sp; s.am.offset.x = -t * 0.55 * spin * s.sp + i * 0.13; s.am.offset.y = 0.02 * Math.sin(t * 2 + i); });
  // touch-down: the funnel grows down from the cloud (scale y about the top)
  const k = Math.max(0.001, strength);
  for (const s of shells) { s.m.scale.set(0.75 + 0.25 * k, k, 0.75 + 0.25 * k); s.m.position.y = height * (1 - k); }
  for (let i = 0; i < 46; i++) {
    const a = r() * 6.28 + t * (1.6 + r() * 1.2) * spin, rad = (3 + r() * 7) * (0.4 + 0.6 * k), life = (t * 0.6 + r()) % 1;
    const sc = (1.5 + r() * 2.5) * (0.6 + life) * k;
    tM.compose(V(Math.cos(a) * rad * (1 + life * 0.6), life * 7 * k, Math.sin(a) * rad * (1 + life * 0.6)), tQ.identity(), V(sc, sc * 0.8, sc)); dust.setMatrixAt(i, tM);
  }
  dust.instanceMatrix.needsUpdate = true; dust.material.opacity = 0.55 * k;
  for (let i = 0; i < 70; i++) {
    const hgt = Math.pow(r(), 1.4) * 36, rad = r0 + 2 + hgt * 0.35 + r() * 4, a = r() * 6.28 + t * (3.2 - hgt * 0.04) * spin;
    tE.set(t * (3 + r() * 6), t * (2 + r() * 4), r() * 6); tQ.setFromEuler(tE);
    const sc = (0.6 + r() * 1.4) * (k > 0.6 ? 1 : 0.001);
    tM.compose(V(Math.cos(a) * rad - 9 * (hgt / height) ** 2, hgt, Math.sin(a) * rad), tQ, V(sc, sc, sc)); deb.setMatrixAt(i, tM);
  }
  deb.instanceMatrix.needsUpdate = true;
  wc.rotation.y = -t * 0.12 * spin;
}

// A storm cloud deck: wide dark merged puffs (for the sky over the base).
export function cloudDeck(seed, n, spread, y, color = '#4a4f5a') {
  const g = new THREE.Group(), r = rng(seed), mat = new THREE.MeshStandardMaterial({ color, roughness: 1, emissive: '#15171c', emissiveIntensity: 0.3 });
  for (let i = 0; i < n; i++) { const c = cloud(seed * 10 + i, 26 + r() * 22); c.material = mat; c.position.set((r() - 0.5) * spread, y + r() * 14, (r() - 0.5) * spread); c.scale.multiply(V(1.4, 0.7, 1.4)); g.add(c); }
  g.userData.mat = mat; return g;
}

// A ribbon on the ground (the paths of the two tornadoes in the "same spot" shot): from a to b, width w; grow(k) draws it.
export function pathRibbon(a, b, w, color) {
  const len = a.distanceTo(b), m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, fog: false, toneMapped: false });
  const geo = new THREE.PlaneGeometry(1, w); geo.translate(0.5, 0, 0);
  const r = new THREE.Mesh(geo, m); r.rotation.x = -Math.PI / 2; r.position.copy(a).add(V(0, 0.3, 0)); r.rotation.z = -Math.atan2(b.z - a.z, b.x - a.x);
  r.userData.len = len; r.renderOrder = 6;
  r.userData.grow = (k) => { r.scale.x = Math.max(0.001, len * k); };
  r.userData.grow(1); return r;
}

// ======================================================= the weather office ==========================================
// The chart on the map board (both days look the same: that is the point). label: the date in the corner.
export function drawChart(c, w, h, date, ghost = false) {
  if (!ghost) { c.fillStyle = '#efe6cc'; c.fillRect(0, 0, w, h); } else c.clearRect(0, 0, w, h);
  const ink = ghost ? 'rgba(200,40,40,.95)' : '#5a4a3a';
  // land outline (a generic continent blob)
  if (!ghost) {
    c.fillStyle = '#d9cfa8'; c.beginPath(); c.moveTo(60, 120); c.bezierCurveTo(300, 40, 700, 60, 960, 140); c.bezierCurveTo(990, 300, 900, 520, 760, 560); c.bezierCurveTo(600, 600, 420, 520, 300, 580); c.bezierCurveTo(160, 540, 40, 420, 60, 120); c.fill();
    c.strokeStyle = '#a89870'; c.lineWidth = 4; c.stroke();
  }
  // isobars round the low
  c.strokeStyle = ink; c.lineWidth = ghost ? 6 : 4;
  for (let i = 1; i <= 5; i++) { c.beginPath(); c.ellipse(420, 290, 50 * i, 34 * i, -0.3, 0, 7); c.stroke(); }
  // cold front (blue triangles) and warm front (red half-circles)
  c.strokeStyle = ghost ? 'rgba(200,40,40,.95)' : '#2257c4'; c.fillStyle = c.strokeStyle; c.lineWidth = 7;
  c.beginPath(); c.moveTo(440, 300); c.quadraticCurveTo(400, 430, 300, 560); c.stroke();
  for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.17, x = (1 - u) * (1 - u) * 440 + 2 * (1 - u) * u * 400 + u * u * 300, y = (1 - u) * (1 - u) * 300 + 2 * (1 - u) * u * 430 + u * u * 560; c.beginPath(); c.moveTo(x - 14, y - 6); c.lineTo(x + 14, y + 4); c.lineTo(x + 18, y - 18); c.closePath(); c.fill(); }
  c.strokeStyle = ghost ? 'rgba(200,40,40,.95)' : '#c8202b'; c.fillStyle = c.strokeStyle;
  c.beginPath(); c.moveTo(440, 300); c.quadraticCurveTo(600, 300, 720, 380); c.stroke();
  for (let i = 0; i < 4; i++) { const x = 500 + i * 55, y = 304 + i * 18; c.beginPath(); c.arc(x, y - 4, 12, Math.PI, 0); c.fill(); }
  // the low and the base
  c.font = `${ghost ? 110 : 120}px "Alfa Slab One"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ghost ? 'rgba(200,40,40,.95)' : '#c8202b'; c.fillText('L', 420, 292);
  c.fillStyle = ghost ? 'rgba(200,40,40,.95)' : '#16141f'; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 9 : 22; c.lineTo(520 + Math.cos(a) * rr, 420 + Math.sin(a) * rr); } c.closePath(); c.fill();
  c.font = '800 30px Montserrat'; c.fillText('BASE', 520, 456);
  // the date tag
  if (date) { c.fillStyle = ghost ? 'rgba(200,40,40,.95)' : '#2b3550'; c.font = `${ghost ? 54 : 50}px "Alfa Slab One"`; c.textAlign = ghost ? 'left' : 'right'; c.fillText(date, ghost ? 40 : w - 40, 50); }
}
export function office(scene) {
  const g = new THREE.Group(); g.position.copy(OFFICE); scene.add(g);
  const floorM = std('#6e6152', { roughness: 0.85 }), wl = std('#c9c2ad', { roughness: 0.85 }), trim = std('#2b3550', { roughness: 0.6 });
  g.add(box(24, 0.3, 16, floorM, 0, -0.15, 0));
  for (let x = -11; x <= 11; x += 2) g.add(box(0.06, 0.02, 16, std('#5a4e42'), x, 0.01, 0));
  g.add(box(24, 11, 0.4, wl, 0, 5.5, -8), box(0.4, 11, 16, wl, 12, 5.5, 0), box(24, 0.4, 16, wl, 0, 11, 0));
  g.add(box(0.4, 11, 6.6, wl, -12, 5.5, -4.7), box(0.4, 11, 6.0, wl, -12, 5.5, 5.0), box(0.4, 4.6, 3.4, wl, -12, 8.7, 0.3));
  const corr = std('#3a3530', { roughness: 1 });
  g.add(box(8, 0.3, 3.4, corr, -16.2, -0.15, 0.3), box(8, 0.3, 3.4, corr, -16.2, 6.55, 0.3), box(8, 6.4, 0.3, corr, -16.2, 3.2, -1.55), box(8, 6.4, 0.3, corr, -16.2, 3.2, 2.15), box(0.3, 6.4, 3.4, std('#26221e', { roughness: 1 }), -20.2, 3.2, 0.3));
  g.add(box(24, 1.2, 0.5, trim, 0, 0.6, -7.8));                                              // skirting
  // the map board on the back wall (left of centre): today's chart, plus a ghost chart (March 20) that slides over it
  const mapX = -4.2, mapY = 6.0;
  g.add(box(10.6, 6.8, 0.3, std('#3b2a1a'), mapX, mapY, -7.7));
  const chartTex = canvasTexture(1024, 640, (c, w, h) => drawChart(c, w, h, 'MARCH 25'));
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.25), std('#ffffff', { map: chartTex, roughness: 0.8 })); chart.position.set(mapX, mapY, -7.5); g.add(chart);
  const ghostTex = canvasTexture(1024, 640, (c, w, h) => drawChart(c, w, h, 'MARCH 20', true));
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.25), new THREE.MeshBasicMaterial({ map: ghostTex, transparent: true, opacity: 0.0, depthWrite: false, toneMapped: false })); ghost.position.set(mapX, mapY, -7.42); g.add(ghost);
  const mapSign = label(6, 0.9, 640, 96, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); LG(c, 'WEATHER MAP', w / 2, h / 2 + 4, 70, '#f2f0e6'); }); mapSign.position.set(mapX, mapY + 4.0, -7.6); g.add(mapSign);
  // notice board on the far left of the back wall, with the ruling pinned up
  const cork = label(4.6, 3.6, 512, 400, (c, w, h) => {
    c.fillStyle = '#b98b5c'; c.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(90,60,30,${r() * 0.25})`; c.fillRect(r() * w, r() * h, 3, 3); }
    c.fillStyle = '#f4f1e8'; c.fillRect(330, 40, 140, 110); c.fillStyle = '#e8e2c8'; c.fillRect(40, 280, 150, 90); c.fillStyle = '#ffd23f'; c.fillRect(350, 260, 120, 110);
    c.strokeStyle = '#5a3a20'; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
  }); cork.position.set(-9.4, 5.8, -7.75); g.add(cork);
  const notice = label(2.4, 3.0, 480, 600, (c, w, h) => {
    c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2b3550'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28);
    MS(c, 'OFFICIAL RULING', w / 2, 70, 34, '#2b3550'); c.fillStyle = '#2b3550'; c.fillRect(50, 100, w - 100, 5);
    SLAB(c, 'TORNADOES', w / 2, 175, 60, '#16141f'); SLAB(c, 'ARE', w / 2, 250, 46, '#16141f'); SLAB(c, 'IMPOSSIBLE', w / 2, 320, 60, '#c8202b'); SLAB(c, 'TO PREDICT', w / 2, 395, 56, '#c8202b');
    for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(40,40,40,.25)'; c.fillRect(60, 450 + i * 22, w - 120 - (i % 2) * 70, 9); }
  }); notice.position.set(-9.6, 5.7, -7.5); g.add(notice);
  g.add(sph(0.12, std('#c8202b', { roughness: 0.4 }), -9.6, 7.05, -7.42, 10));
  // calendar on the back wall right
  const calTex = {};
  for (const d of [20, 21, 22, 23, 24, 25]) calTex[d] = canvasTexture(256, 300, (c, w, h) => { c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8202b'; c.fillRect(0, 0, w, 80); LG(c, 'MARCH', w / 2, 44, 56, '#ffffff'); SLAB(c, String(d), w / 2, 180, 130, '#16141f'); MS(c, '1948', w / 2, 270, 30, '#5a4a3a'); });
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.0), std('#ffffff', { map: calTex[25], roughness: 0.7 })); cal.position.set(4.8, 6.6, -7.75); g.add(cal);
  // wall clock above the calendar
  const clockFace = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#fbf8ef'; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 7); c.fill(); c.strokeStyle = '#16141f'; c.lineWidth = 10; c.stroke(); for (let i = 1; i <= 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 6; SLAB(c, String(i), w / 2 + Math.cos(a) * 92, w / 2 + Math.sin(a) * 92 + 2, 30, '#16141f'); } });
  const clock = new THREE.Group(); clock.position.set(4.8, 9.2, -7.7); g.add(clock);
  clock.add(cyl(0.95, 0.95, 0.15, std('#2b3550'), 32, 0, 0, 0).rotateX(Math.PI / 2));
  const cf = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), std('#ffffff', { map: clockFace, roughness: 0.6 })); cf.position.z = 0.09; clock.add(cf);
  const hand = (len, wd) => { const h = new THREE.Group(); const b = box(wd, len, 0.04, std('#16141f'), 0, len / 2 - 0.08, 0); h.add(b); h.position.z = 0.13; clock.add(h); return h; };
  const hourH = hand(0.5, 0.09), minH = hand(0.72, 0.06);
  // window on the right wall with rain outside
  const winM = std('#58657a', { emissive: '#8a9bb8', emissiveIntensity: 0.5, roughness: 0.2 });
  g.add(box(0.2, 4, 6, winM, 11.75, 5.6, -2.5));
  g.add(box(0.4, 0.3, 6.6, std('#3b2a1a'), 11.7, 3.5, -2.5), box(0.4, 0.3, 6.6, std('#3b2a1a'), 11.7, 7.7, -2.5), box(0.4, 4.4, 0.3, std('#3b2a1a'), 11.7, 5.6, -2.5));
  // the door in the left wall (hinged at its back edge, swings in toward +x)
  const door = new THREE.Group(); door.position.set(-11.8, 0, -1.4); g.add(door);
  door.add(box(0.25, 6.4, 3.4, std('#4a3424'), 0, 3.2, 1.7)); door.add(sph(0.16, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 0.25, 3.1, 3.0, 10));
  g.add(box(0.5, 0.4, 4.2, std('#3b2a1a'), -11.8, 6.6, 0.3));
  // the desk (centre right, its front toward +z), typewriter, files, mugs; a chair behind it
  const deskM = std('#6b4a2e', { roughness: 0.7 });
  const DESK = V(3.0, 0, -1.6);
  g.add(box(7.5, 0.35, 3.2, deskM, DESK.x, 3.0, DESK.z));
  g.add(box(7.5, 2.8, 0.2, deskM, DESK.x, 1.5, DESK.z + 1.5)); for (const x of [-3.5, 3.5]) g.add(box(0.3, 3.0, 3.0, deskM, DESK.x + x, 1.5, DESK.z));
  const tw = typewriter(); tw.position.set(DESK.x + 1.2, 3.18, DESK.z + 0.3); g.add(tw);
  // file folders in stacks (shown one by one in the montage)
  const files = [];
  const fm = [std('#d8b878', { roughness: 0.8 }), std('#c9a35f', { roughness: 0.8 }), std('#e3c98e', { roughness: 0.8 })];
  for (let i = 0; i < 18; i++) { const st = i % 3, lvl = Math.floor(i / 3); const f = box(1.6, 0.32, 1.15, fm[i % 3], DESK.x - 2.8 + st * 1.75, 3.35 + lvl * 0.34, DESK.z - 0.7 + (lvl % 2) * 0.06); f.rotation.y = (rng(i)() - 0.5) * 0.3; g.add(f); files.push(f); }
  const mugs = [];
  for (let i = 0; i < 5; i++) { const m = cyl(0.22, 0.2, 0.5, std(['#f4f1e8', '#2b3550', '#c8202b', '#f4f1e8', '#5b6338'][i]), 12, DESK.x + 2.6 - i * 0.55, 3.43, DESK.z + 0.9 - (i % 2) * 0.4); g.add(m); mugs.push(m); }
  // chair behind the desk
  g.add(box(1.8, 0.3, 1.6, std('#3a3330'), DESK.x + 1.2, 1.7, DESK.z - 2.6), box(1.8, 2.2, 0.25, std('#3a3330'), DESK.x + 1.2, 2.9, DESK.z - 3.35));
  // a second chair for Leo at the desk's left end
  g.add(box(1.6, 0.3, 1.6, std('#3a3330'), DESK.x - 2.8, 1.7, DESK.z - 2.6), box(1.6, 2.2, 0.25, std('#3a3330'), DESK.x - 2.8, 2.9, DESK.z - 3.35));
  // radar console in the back right corner, screen facing -x+z
  const radar = radarConsole(); radar.group.position.set(9.0, 0, -5.4); radar.group.rotation.y = -0.65; g.add(radar.group);
  // ceiling lamp
  g.add(cyl(0.05, 0.05, 1.4, std('#22252a'), 6, 0, 10.3, -1.5));
  g.add(cyl(0.5, 1.2, 0.8, std('#2b3550', { roughness: 0.5 }), 16, 0, 9.4, -1.5));
  const bulb = sph(0.32, std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 2 }), 0, 9.0, -1.5, 12); g.add(bulb);
  const lamp = new THREE.PointLight('#ffe2b0', 0, 40, 1.4); lamp.position.set(0, 8.6, -1.0); g.add(lamp);
  const winLight = new THREE.PointLight('#b9c9ff', 0, 30, 1.5); winLight.position.set(10, 5.6, -2.5); g.add(winLight);
  const radarLight = new THREE.PointLight('#5dff8a', 0, 9, 1.6); radarLight.position.copy(OFFICE).add(V(7.6, 4.6, -4.2)); scene.add(radarLight);
  // a sign over the map board
  g.userData = { chart, ghost, cal, calTex, hourH, minH, door, tw, files, mugs, radar, lamp, winLight, radarLight, bulb, winM, DESK, mapX, mapY };
  return g;
}

// Typewriter: dark body, key rows, a carriage with a sheet of paper. The sheet's texture can be swapped (setPaper).
function paperTex(kind) {
  return canvasTexture(512, 680, (c, w, h) => {
    c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b3550'; c.font = '800 30px Montserrat'; c.textAlign = 'center'; c.fillText('WEATHER FORECAST', w / 2, 60);
    c.fillRect(40, 80, w - 80, 4);
    c.font = '30px "Courier New", monospace'; c.textAlign = 'left'; c.fillStyle = '#16141f';
    const lines = kind === 'banned' ? ['TONIGHT: SEVERE', 'LOCAL STORMS.', '', 'POSSIBLE', ''] : kind === 'forecast' ? ['MARCH 25, 1948', '2:50 P.M.', '', 'TORNADO', 'FORECAST:', 'THIS BASE,', '5 TO 6 P.M.'] : ['', '', '', '', ''];
    lines.forEach((l, i) => c.fillText(l, 50, 150 + i * 52));
    if (kind === 'banned') { c.font = 'bold 54px "Courier New", monospace'; c.fillStyle = '#16141f'; c.fillText('TORNADO', 50, 150 + 4 * 52 + 6); }
    if (kind === 'forecast') { c.font = 'bold 58px "Courier New", monospace'; c.fillStyle = '#c8202b'; c.fillText('TORNADO', 50, 150 + 3 * 52 + 6); }
  });
}
export function typewriter() {
  const g = new THREE.Group(), body = std('#22252a', { roughness: 0.35, metalness: 0.4 }), key = std('#e8e2c8', { roughness: 0.4 });
  g.add(box(2.4, 0.5, 1.8, body, 0, 0.25, 0));
  const top = box(2.4, 0.5, 1.0, body, 0, 0.7, -0.4); g.add(top);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) g.add(cyl(0.08, 0.08, 0.06, key, 8, -0.95 + k * 0.24 + (r % 2) * 0.12, 0.55 + r * 0.06, 0.65 - r * 0.2));
  g.add(cyl(0.18, 0.18, 2.8, std('#16141f', { roughness: 0.5 }), 14, 0, 1.05, -0.55).rotateZ(Math.PI / 2));
  const papers = { banned: paperTex('banned'), forecast: paperTex('forecast'), blank: paperTex('blank') };
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.25), std('#ffffff', { map: papers.blank, roughness: 0.8, side: THREE.DoubleSide }));
  sheet.position.set(0, 2.1, -0.62); sheet.rotation.x = -0.25; g.add(sheet);
  g.userData = { sheet, papers };
  return g;
}
export function setPaper(tw, kind) { tw.userData.sheet.material.map = tw.userData.papers[kind]; }

// Radar console: a grey cabinet with a round green scope; the sweep turns and the squall line creeps in (update()).
export function radarConsole() {
  const g = new THREE.Group(), cab = std('#6f7a73', { roughness: 0.6, metalness: 0.3 });
  g.add(box(3.4, 3.4, 2.4, cab, 0, 1.7, 0));
  const hood = box(3.4, 2.6, 1.6, cab, 0, 4.3, -0.4); hood.rotation.x = -0.25; g.add(hood);
  const scope = new THREE.Group(); scope.position.set(0, 4.45, 0.42); scope.rotation.x = -0.25; g.add(scope);
  scope.add(cyl(1.2, 1.2, 0.12, std('#2c3330'), 32, 0, 0, -0.03).rotateX(Math.PI / 2));
  const screenM = new THREE.MeshBasicMaterial({ color: '#0d3a1c', toneMapped: false }); screenM.color.setRGB(0.04, 0.22, 0.09);
  const screen = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), screenM); screen.position.z = 0.04; scope.add(screen);
  const ringM = new THREE.MeshBasicMaterial({ color: '#3dff7a', transparent: true, opacity: 0.45, toneMapped: false });
  for (const r of [0.33, 0.66, 0.97]) { const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.012, r + 0.012, 48), ringM); ring.position.z = 0.05; scope.add(ring); }
  const sweepM = new THREE.MeshBasicMaterial({ color: '#7dffa8', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); sweepM.color.setRGB(1.2, 3.2, 1.6);
  const sweepGeo = new THREE.CircleGeometry(0.98, 16, 0, 0.5); const sweep = new THREE.Mesh(sweepGeo, sweepM); sweep.position.z = 0.06; scope.add(sweep);
  // the squall line: a bright arc of blobs that creeps toward the centre
  const blobM = new THREE.MeshBasicMaterial({ color: '#b8ffcf', transparent: true, opacity: 0.9, toneMapped: false }); blobM.color.setRGB(1.6, 3.6, 2.0);
  const squall = new THREE.Group(); squall.position.z = 0.07; scope.add(squall);
  for (let i = 0; i < 12; i++) { const a = -0.9 + i * 0.16, b = new THREE.Mesh(new THREE.CircleGeometry(0.06 + (i % 3) * 0.02, 10), blobM); b.position.set(Math.cos(a + Math.PI) * 0.75, Math.sin(a + Math.PI) * 0.75 * 0.5 + 0.05 * Math.sin(i), 0); squall.add(b); }
  const centre = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), blobM); centre.position.z = 0.07; scope.add(centre);
  // knobs
  for (const x of [-1, 0, 1]) g.add(cyl(0.16, 0.16, 0.2, std('#16141f'), 12, x, 2.4, 1.25).rotateX(Math.PI / 2));
  const update = (t, k) => { sweep.rotation.z = -t * 4.0; squall.position.x = 0.35 * (1 - k); squall.scale.setScalar(1 - 0.25 * k); };
  return { group: g, update, screenAt: () => scope.getWorldPosition(V()) };
}

// ======================================================= the elevator (daydream) =====================================
export function elevator(scene) {
  const g = new THREE.Group(); g.position.copy(ELEVATOR); scene.add(g);
  const brass = std('#c8a24a', { roughness: 0.35, metalness: 0.8 }), wood = std('#7a4a2a', { roughness: 0.6 }), floorM = std('#3a2a20', { roughness: 0.6 });
  g.add(box(9, 0.3, 8, floorM, 0, -0.15, -4));
  g.add(box(9, 10, 0.3, wood, 0, 5, -8), box(0.3, 10, 8, wood, -4.5, 5, -4), box(0.3, 10, 8, wood, 4.5, 5, -4), box(9, 0.3, 8, wood, 0, 10, -4));
  for (const x of [-4.3, 4.3]) for (let y = 1; y < 10; y += 2.2) g.add(box(0.12, 0.12, 7.6, brass, x, y, -4));
  g.add(box(8.6, 0.12, 0.12, brass, 0, 1, -7.8), box(8.6, 0.12, 0.12, brass, 0, 3.2, -7.8));
  // control panel on the right wall with buttons
  g.add(box(0.2, 3, 1.6, brass, 4.3, 4.6, -2.2));
  const btnM = std('#fff3c4', { emissive: '#ffcf5a', emissiveIntensity: 0.4, roughness: 0.3 });
  const buttons = []; for (let i = 0; i < 6; i++) { const b = cyl(0.13, 0.13, 0.15, btnM.clone(), 12, 4.15, 3.6 + (i % 3) * 0.75, -2.6 + Math.floor(i / 3) * 0.8); b.rotation.z = Math.PI / 2; g.add(b); buttons.push(b); }
  // the floor dial over the opening (a half-disc with numbers and a turning arrow), seen from inside: on the back wall
  const dialTex = canvasTexture(512, 300, (c, w, h) => { c.fillStyle = '#e8d8a8'; c.beginPath(); c.arc(w / 2, h - 20, 230, Math.PI, 0); c.fill(); c.strokeStyle = '#6b4a10'; c.lineWidth = 12; c.stroke(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8; SLAB(c, i === 0 ? 'G' : String(i), w / 2 + Math.cos(a) * 185, h - 20 + Math.sin(a) * 185, 40, '#3b2a08'); } });
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.0), std('#ffffff', { map: dialTex, roughness: 0.5, metalness: 0.2 })); dial.position.set(0, 8.6, -7.8); g.add(dial);
  const arrow = new THREE.Group(); arrow.position.set(0, 7.75, -7.75); g.add(arrow);
  arrow.add(box(0.08, 1.2, 0.04, std('#16141f'), 0, 0.6, 0));
  // the gate: a folding brass lattice across the open front (z 0), slides from the right (x) to close
  const gate = new THREE.Group(); g.add(gate);
  for (let i = 0; i < 13; i++) gate.add(box(0.1, 9.6, 0.1, brass, -4.4 + i * 0.7, 4.9, 0));
  for (let i = 0; i < 12; i++) { const d = box(0.06, 1.0, 0.06, brass, -4.05 + i * 0.7, 2.5, 0.02); d.rotation.z = 0.6; gate.add(d); const d2 = d.clone(); d2.position.y = 7.4; d2.rotation.z = -0.6; gate.add(d2); }
  const setGate = (k) => { gate.scale.x = Math.max(0.02, k); gate.position.x = 4.4 * (1 - k); };
  setGate(0);
  const light = new THREE.PointLight('#ffd9a0', 0, 30, 1.5); light.position.set(0, 9, -3); g.add(light);
  g.add(sph(0.4, std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 2 }), 0, 9.7, -4, 12));
  return { group: g, arrow, setGate, buttons, light, panel: V(ELEVATOR.x + 4.15, 4.35, ELEVATOR.z - 2.2) };
}

// ======================================================= the phone on the table ======================================
export function table(scene) {
  const g = new THREE.Group(); g.position.copy(TABLE); scene.add(g);
  const wood = canvasTexture(512, 512, (c, w) => { c.fillStyle = '#9a6a3d'; c.fillRect(0, 0, w, w); const r = rng(8); for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(70,40,20,${0.1 + r() * 0.2})`; c.lineWidth = 1 + r() * 3; c.beginPath(); const y = r() * w; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 30, w * 0.7, y + (r() - 0.5) * 30, w, y + (r() - 0.5) * 20); c.stroke(); } });
  g.add(box(20, 0.6, 12, std('#ffffff', { map: wood, roughness: 0.6 }), 0, 3.0, 0));
  g.add(box(30, 14, 0.4, std('#cfd8dc', { roughness: 0.9 }), 0, 7, -10));                    // a wall behind
  const winM = std('#58657a', { emissive: '#a9b9d6', emissiveIntensity: 0.6, roughness: 0.2 }); g.add(box(8, 6, 0.2, winM, 5, 8, -9.7));
  const phone = new THREE.Group(); phone.position.set(-0.5, 3.36, 0.8); phone.rotation.set(-Math.PI / 2, 0, 0.18); g.add(phone);
  phone.add(box(2.0, 4.1, 0.24, std('#16181c', { roughness: 0.3, metalness: 0.5 }), 0, 0, 0));
  const scr = canvasTexture(400, 820, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d2a4a'); gr.addColorStop(1, '#0c1222'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    MS(c, '6:00', w / 2, 120, 96, '#ffffff');
    c.fillStyle = 'rgba(245,245,250,.96)'; c.beginPath(); c.roundRect(24, 260, w - 48, 300, 34); c.fill();
    c.fillStyle = '#e02b2b'; c.beginPath(); c.arc(70, 310, 22, 0, 7); c.fill(); MS(c, '!', 70, 312, 30, '#ffffff');
    MS(c, 'EMERGENCY ALERT', 106, 312, 26, '#16141f', 'left');
    LG(c, 'TORNADO', w / 2, 395, 74, '#c8202b'); LG(c, 'WARNING', w / 2, 465, 74, '#c8202b');
    MS(c, 'Take shelter now.', w / 2, 525, 26, '#3a3a44');
  });
  const screenM = new THREE.MeshBasicMaterial({ map: scr, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 3.85), screenM); screen.position.z = 0.125; phone.add(screen);
  g.add(cyl(0.45, 0.4, 1.0, std('#f4f1e8', { roughness: 0.4 }), 16, 3.2, 3.8, -0.8));
  return { group: g, phone, screen };
}

// ======================================================= props =======================================================
// A sheet of paper (flies in the montage).
export function sheet() { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), std('#fbf8ef', { roughness: 0.8, side: THREE.DoubleSide })); m.castShadow = true; return m; }
// Max's coat? no: a hat for the walk home would be extra; his own look carries him.
// Tie-down rope from a wing tip to a ground stake (updated per frame).
export function rope() { const l = cyl(0.06, 0.06, 1, std('#c9b48a', { roughness: 0.9 }), 5); l.castShadow = false; return l; }
export function setRope(l, a, b) { const d = b.clone().sub(a), len = d.length(); l.position.copy(a).addScaledVector(d, 0.5); l.scale.set(1, len, 1); l.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
export function steelSheet() { const m = box(3.2, 0.12, 1.6, std('#8b9096', { metalness: 0.6, roughness: 0.4 })); return m; }
