// Lightning Hit Him Seven Times: sets, props and lightning effects built in code.
// World layout (studs, floor y 0). One big stormy grass plain; each place is its own group, shown only in its shots:
//   FOREST  origin. Pine clearing (the hook), a dirt trail along x (z 0), a park bench at BENCH.
//   TOWER   (300, 0, 0). A grassy hill with a stone-based fire lookout tower; door on the +z side.
//   ROAD    (0, 0, 300). A mountain road along x (z = ROAD.z), pines uphill (-z), a cliff edge and valley at +z.
//   YARD    (-300, 0, 0). Max's little house, picket fence, garden path, mailbox and a power pole with a transformer.
//   STATION (0, 0, -300). Ranger station: exterior with door on +z; the office interior (open +z wall) at STATION_IN.
//   POND    (300, 0, 300). A pond with reeds and rocks; Max fishes from the bank at POND_SPOT.
//   MUSEUM  (-300, 0, 300). A dark exhibit hall: a glass case with two scorched ranger hats and a record plaque.
// Props are built with their origin where the hand holds them and their front facing +z.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';
import { packItem } from '../../../web/lib/robloxPack.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const FOREST = V(0, 0, 0), TOWER = V(300, 0, 0), ROAD = V(0, 0, 300), YARD = V(-300, 0, 0), STATION = V(0, 0, -300),
  POND = V(300, 0, 300), MUSEUM = V(-300, 0, 300);
export const BENCH = V(26, 0, -4);                   // forest: the bench faces +z
export const TOWER_DOOR = V(300, 6, 3.6);           // tower: the door (on the hilltop, which is at y 6)
export const HILL_Y = 6;
export const STATION_IN = V(0, 0, -340);            // the office interior (its open side faces +z)
export const POND_SPOT = V(300, 0.6, 305);          // where Max stands to fish (facing -z, the water)
export const ROAD_Z = 300, CLIFF_Z = 309;

// ======================================================= ground and trees ============================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#5d8a3e'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${92 + r() * 22},${34 + r() * 18}%,${26 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / 11.25, 1 / 11.25);
  // one big plain with a hole beyond the road's cliff edge (x -200..200, z CLIFF_Z..700), so the valley shows below
  const sh = new THREE.Shape([V(-900, -900), V(900, -900), V(900, 900), V(-900, 900)].map((v) => new THREE.Vector2(v.x, v.y)));
  sh.holes.push(new THREE.Path([[-200, -CLIFF_Z], [-200, -700], [200, -700], [200, -CLIFF_Z]].map(([x, y]) => new THREE.Vector2(x, y))));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
  return m;
}
// Stylised pines: a trunk and three stacked cones (one instanced mesh each, so hundreds cost one draw call).
export function pines(scene, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 3, 7), std('#5b3a24', { roughness: 0.9 }), n);
  const cones = [0, 1, 2].map((k) => new THREE.InstancedMesh(new THREE.ConeGeometry(2.6 - k * 0.65, 3.4 - k * 0.3, 8), std(['#2f5a35', '#356640', '#3d7348'][k], { roughness: 0.85, flatShading: true }), n));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1, y = 0], i) => {
    const sc = s * (0.85 + r() * 0.35), rot = r() * 6.28;
    q.setFromEuler(e.set(0, rot, 0));
    m.compose(V(x, y + 1.5 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    cones.forEach((c, k) => { m.compose(V(x, y + (3.6 + k * 2.0) * sc, z), q, V(sc, sc, sc)); c.setMatrixAt(i, m); });
  });
  for (const o of [trunk, ...cones]) { o.castShadow = true; o.receiveShadow = true; scene.add(o); }
  return [trunk, ...cones];
}
// Random tree spots in a ring/rectangle around a place, avoiding a clear zone.
export function scatter(seed, cx, cz, rx, rz, n, clear = () => false, s = 1) {
  const r = rng(seed), out = [];
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const x = cx + (r() * 2 - 1) * rx, z = cz + (r() * 2 - 1) * rz;
    if (clear(x, z)) continue;
    out.push([x, z, s * (0.8 + r() * 0.6)]);
  }
  return out;
}

// ======================================================= places ======================================================
// The forest: a clearing at the origin, a dirt trail along x, the bench.
export function forest(scene) {
  const g = new THREE.Group(); scene.add(g);
  const dirt = std('#8a6b47', { roughness: 0.95 });
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(160, 3.2), dirt); trail.rotation.x = -Math.PI / 2; trail.position.set(0, 0.02, 0); trail.receiveShadow = true; g.add(trail);
  for (let i = 0; i < 40; i++) { const r = rng(40 + i); g.add(box(0.5 + r(), 0.25, 0.4 + r() * 0.6, std('#7d7f86', { roughness: 0.9 }), -60 + i * 3.1 + r(), 0.12, 2.2 + r() * 0.8)); }
  // bench at BENCH, seat 1.6 high, facing +z
  const b = bench(); b.position.copy(BENCH); g.add(b);
  g.userData.trees = pines(g, scatter(5, 0, -6, 70, 26, 150, (x, z) => (Math.abs(z) < 4.5) || (Math.abs(x - BENCH.x) < 6 && z > -9 && z < 2) || (x * x + z * z < 120)));
  g.userData.treesFront = pines(g, scatter(6, 0, 30, 70, 12, 45, (x, z) => Math.abs(z) < 6, 1.1));
  return g;
}
export function bench() {
  const g = new THREE.Group(), wood = std('#9a6a3d', { roughness: 0.8 }), iron = std('#2c2f36', { roughness: 0.5, metalness: 0.5 });
  for (let i = 0; i < 3; i++) g.add(box(6.5, 0.18, 0.45, wood, 0, 1.55, -0.55 + i * 0.5));
  for (let i = 0; i < 2; i++) { const s = box(6.5, 0.4, 0.14, wood, 0, 2.35 + i * 0.55, -0.95); s.rotation.x = -0.18; g.add(s); }
  for (const x of [-2.9, 2.9]) { g.add(box(0.2, 1.55, 1.3, iron, x, 0.78, -0.3)); g.add(box(0.2, 1.4, 0.2, iron, x, 2.5, -1.0)); }
  return g;
}

// The tower: a grassy hill, a stone base room with a door (+z), timber stilts and a lookout cab with windows.
export function tower(scene) {
  const g = new THREE.Group(); g.position.copy(TOWER); scene.add(g);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), std('#5b8a3c', { roughness: 0.95 }));
  hill.scale.set(1, 0.1, 1); hill.receiveShadow = true; g.add(hill);                                    // top at y 6
  const stone = std('#8d8a84', { roughness: 0.9 }), timber = std('#7a5634', { roughness: 0.85 }), roof = std('#5a2f25', { roughness: 0.7 });
  const y0 = HILL_Y;
  // stone base 8 x 5 x 8 with a door gap on +z
  g.add(box(8, 5, 0.8, stone, 0, y0 + 2.5, -3.6), box(0.8, 5, 8, stone, -3.6, y0 + 2.5, 0), box(0.8, 5, 8, stone, 3.6, y0 + 2.5, 0));
  g.add(box(2.6, 5, 0.8, stone, -2.7, y0 + 2.5, 3.6), box(2.6, 5, 0.8, stone, 2.7, y0 + 2.5, 3.6), box(2.8, 1.0, 0.8, stone, 0, y0 + 4.5, 3.6));
  g.add(box(8.4, 0.5, 8.4, stone, 0, y0 + 5.2, 0));
  const dark = box(6.2, 4.6, 6.2, std('#2a2522', { roughness: 1 }), 0, y0 + 2.3, -0.2); g.add(dark);       // dark inside
  // the door: hinged on its left edge (x -1.4), opens outward (rotation.y > 0 swings it toward +z on the right)
  const door = new THREE.Group(); door.position.set(-1.4, y0, 3.95); g.add(door);
  door.add(box(2.8, 4.0, 0.25, std('#6b4226', { roughness: 0.8 }), 1.4, 2.0, 0));
  door.add(box(0.25, 0.25, 0.3, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 2.4, 2.0, 0.2));
  // stilts and braces up to the cab
  for (const [x, z] of [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]]) g.add(box(0.6, 7, 0.6, timber, x, y0 + 8.8, z));
  for (const s of [-1, 1]) { const b1 = box(9, 0.3, 0.3, timber, 0, y0 + 9, s * 3.2); b1.rotation.z = 0.7; g.add(b1); const b2 = box(0.3, 0.3, 9, timber, s * 3.2, y0 + 9, 0); b2.rotation.x = 0.7; g.add(b2); }
  // cab: floor, walls with a band of windows, catwalk rail, pyramid roof
  const cy = y0 + 12.3;
  g.add(box(9, 0.4, 9, timber, 0, cy, 0));
  const wall = std('#c9b28a', { roughness: 0.8 }), glass = std('#9fc6e8', { roughness: 0.15, metalness: 0.2, emissive: '#1d2c3a', emissiveIntensity: 0.4 });
  for (const s of [-1, 1]) { g.add(box(7, 1.3, 0.3, wall, 0, cy + 0.85, s * 3.5), box(0.3, 1.3, 7, wall, s * 3.5, cy + 0.85, 0)); }
  for (const s of [-1, 1]) { g.add(box(7, 2.1, 0.12, glass, 0, cy + 2.55, s * 3.5), box(0.12, 2.1, 7, glass, s * 3.5, cy + 2.55, 0)); }
  for (const [x, z] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]) g.add(box(0.35, 3.6, 0.35, timber, x, cy + 1.9, z));
  for (const s of [-1, 1]) { g.add(box(9, 0.18, 0.18, timber, 0, cy + 1.2, s * 4.4), box(0.18, 0.18, 9, timber, s * 4.4, cy + 1.2, 0)); }
  const r = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.6, 4), roof); r.rotation.y = Math.PI / 4; r.position.set(0, cy + 4.9, 0); r.castShadow = true; g.add(r);
  const topY = cy + 6.2;
  // a sign by the door
  const sgn = label(3.6, 0.9, 512, 128, (c, w, h) => { c.fillStyle = '#3b2a1a'; c.fillRect(0, 0, w, h); LG(c, 'LOOKOUT TOWER', w / 2, h / 2 + 4, 62, '#f3e3c0'); });
  sgn.position.set(0, y0 + 5.9, 4.25); g.add(sgn);
  g.userData.trees = pines(g, scatter(7, 0, 0, 70, 70, 70, (x, z) => x * x + z * z < 40 * 40).map(([x, z, s]) => [x, z, s, Math.max(0, 6 * (1 - (x * x + z * z) / 3600))]));
  return { group: g, door, roofTop: V(TOWER.x, topY, TOWER.z), cabY: cy };
}

// The mountain road along x at z = ROAD_Z: asphalt, a dashed centre line, guard posts and a drop at the cliff edge.
export function road(scene) {
  const g = new THREE.Group(); scene.add(g);
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), std('#3a3c42', { roughness: 0.9 })); asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(0, 0.03, ROAD_Z); asphalt.receiveShadow = true; g.add(asphalt);
  const dash = std('#f2d16b', { roughness: 0.6 });
  for (let x = -200; x < 200; x += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.25), dash); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.05, ROAD_Z); g.add(d); }
  // the drop: the plain ends at the cliff edge; beyond it a far valley floor and distant mountains
  const rock = std('#6e6a66', { roughness: 0.95 });
  const cliffTop = new THREE.Mesh(new THREE.PlaneGeometry(400, 3), std('#5d8a3e', { roughness: 0.95 })); cliffTop.rotation.x = -Math.PI / 2; cliffTop.position.set(0, 0.02, CLIFF_Z - 2); g.add(cliffTop);
  for (let x = -200; x < 200; x += 10) { const p = box(0.4, 1.2, 0.4, std('#e9e4da'), x, 0.6, CLIFF_Z - 3); g.add(p); }
  const rail = box(400, 0.3, 0.2, std('#cfd2d6', { metalness: 0.5, roughness: 0.4 }), 0, 1.0, CLIFF_Z - 3); g.add(rail);
  const cliff = box(400, 60, 2, rock, 0, -30, CLIFF_Z); g.add(cliff);
  const valley = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), std('#4f7a3a', { roughness: 0.95 })); valley.rotation.x = -Math.PI / 2; valley.position.set(0, -55, CLIFF_Z + 200); g.add(valley);
  for (let i = 0; i < 9; i++) { const r = rng(90 + i); const m = new THREE.Mesh(new THREE.ConeGeometry(40 + r() * 30, 50 + r() * 40, 5), std('#55607a', { roughness: 1, flatShading: true })); m.position.set(-200 + i * 50 + r() * 20, -55 + 20, CLIFF_Z + 260 + r() * 60); g.add(m); }
  g.userData.trees = pines(g, scatter(9, 0, ROAD_Z - 30, 200, 22, 230, (x, z) => z > ROAD_Z - 8));
  // a scenic lookout pull-off sign where the truck stops in strike five
  const s = label(4, 1.1, 512, 140, (c, w, h) => { c.fillStyle = '#5a3a20'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f3e3c0'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'SCENIC VIEW', w / 2, h / 2 + 4, 70, '#f3e3c0'); });
  s.position.set(66, 3.2, ROAD_Z - 6.2); g.add(s); g.add(box(0.25, 3, 0.25, std('#5a3a20'), 64.8, 1.5, ROAD_Z - 6.3), box(0.25, 3, 0.25, std('#5a3a20'), 67.2, 1.5, ROAD_Z - 6.3));
  return g;
}
// The roadside tree that strike two hits first (a lone tall pine at the road's uphill edge).
export const STRIKE_TREE = V(-14, 0, ROAD_Z - 6.5);

// The ranger truck: faces +x, driver's side on -z with the window open. Origin on the ground under the cab centre.
// Max sits at SEAT (local) and holds the wheel at WHEEL (local).
export function truck() {
  const g = new THREE.Group(), green = std('#2f6b45', { roughness: 0.45, metalness: 0.2 }), white = std('#eef0ec', { roughness: 0.5 });
  const dark = std('#1e2226', { roughness: 0.6 }), glass = std('#a9cbe6', { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.35 });
  // chassis and bed (behind the cab, -x)
  g.add(box(10.5, 0.8, 4.4, dark, -0.6, 1.2, 0));
  g.add(box(4.6, 1.8, 4.4, green, -3.4, 2.5, 0));                                  // bed
  g.add(box(4.0, 1.7, 4.4, green, 3.3, 2.45, 0));                                  // hood
  g.add(box(0.2, 0.6, 3.6, std('#c9ccd0', { metalness: 0.7, roughness: 0.3 }), 5.35, 2.0, 0));   // grille
  // cab: x -1.1..1.3, floor at 1.6, roof at 5.2. Driver's side (-z) has a door with an open window.
  const cab = new THREE.Group(); g.add(cab);
  cab.add(box(2.4, 1.6, 0.2, green, 0.1, 2.4, 2.1));                               // passenger door (low part)
  cab.add(box(2.4, 1.6, 0.2, green, 0.1, 2.4, -2.1));                              // driver door (low part)
  cab.add(box(0.2, 1.4, 4.2, green, -1.1, 3.9, 0));                                // back wall
  cab.add(box(2.6, 0.3, 4.4, white, 0.1, 5.2, 0));                                 // roof
  for (const [x, z] of [[-1.05, -2.1], [1.25, -2.1], [-1.05, 2.1], [1.25, 2.1]]) cab.add(box(0.22, 2.0, 0.22, green, x, 4.1, z));   // pillars
  const ws = box(0.1, 1.9, 4.0, glass, 1.3, 4.15, 0); ws.rotation.z = -0.25; ws.castShadow = false; cab.add(ws);   // windscreen
  cab.add(box(2.2, 1.6, 0.1, glass, 0.1, 4.1, 2.12));                               // passenger window (closed)
  // door decal
  const d = label(1.9, 0.9, 512, 240, (c, w, h) => { c.fillStyle = '#2f6b45'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2d16b'; c.beginPath(); c.moveTo(w / 2, 20); c.lineTo(w / 2 + 70, 80); c.lineTo(w / 2 + 70, 160); c.lineTo(w / 2, 220); c.lineTo(w / 2 - 70, 160); c.lineTo(w / 2 - 70, 80); c.closePath(); c.fill(); LG(c, 'PARK', 105, 120, 64, '#ffffff'); LG(c, 'RANGER', 400, 120, 64, '#ffffff'); }, { roughness: 0.5 });
  d.position.set(0.1, 2.45, -2.21); d.rotation.y = Math.PI; g.add(d);
  // seat and steering wheel inside
  g.add(box(1.4, 0.5, 3.6, std('#3a3330', { roughness: 0.8 }), -0.4, 2.15, 0), box(0.4, 1.8, 3.6, std('#3a3330', { roughness: 0.8 }), -0.95, 3.2, 0));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 8, 24), dark); wheel.position.set(0.95, 3.35, -1.0); wheel.rotation.y = Math.PI / 2; wheel.rotation.x = 0.0; wheel.rotation.z = 0; g.add(wheel);
  const col = cyl(0.06, 0.06, 0.9, dark, 8, 1.2, 3.1, -1.0); col.rotation.z = 0.9; g.add(col);
  // wheels
  const wheels = [];
  for (const [x, z] of [[3.3, -2.25], [3.3, 2.25], [-3.6, -2.25], [-3.6, 2.25]]) {
    const w = new THREE.Group(); w.position.set(x, 1.1, z); g.add(w);
    const tyre = cyl(1.1, 1.1, 0.7, std('#1b1b1d', { roughness: 0.9 }), 20); tyre.rotation.x = Math.PI / 2; w.add(tyre);
    const hub = cyl(0.55, 0.55, 0.74, std('#c9ccd0', { metalness: 0.7, roughness: 0.3 }), 6); hub.rotation.x = Math.PI / 2; w.add(hub);
    wheels.push(w);
  }
  // light bar on the roof
  g.add(box(0.5, 0.25, 2.4, std('#ffb000', { emissive: '#ff9000', emissiveIntensity: 0.6 }), 0.1, 5.5, 0));
  g.userData = { wheels, SEAT: V(-0.35, 2.4, -1.0), WHEEL: V(0.95, 3.35, -1.0), DOOR: V(0.1, 0, -2.2) };
  return g;
}

// The yard: a small house (+z front), white picket fence, garden path to a mailbox, power pole with a transformer.
export function yard(scene) {
  const g = new THREE.Group(); g.position.copy(YARD); scene.add(g);
  const wall = std('#d9c7a0'), trim = std('#ffffff'), roof = std('#6b3a2e');
  g.add(box(14, 7, 10, wall, 0, 3.5, -10));
  const r = new THREE.Mesh(new THREE.ConeGeometry(10.5, 4, 4), roof); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.75); r.position.set(0, 9, -10); r.castShadow = true; g.add(r);
  g.add(box(2.6, 4.6, 0.3, std('#7b3f2a'), 0, 2.3, -4.9), box(3, 2.4, 0.2, std('#9fc6e8', { roughness: 0.2 }), -4.5, 4, -4.9), box(3, 2.4, 0.2, std('#9fc6e8', { roughness: 0.2 }), 4.5, 4, -4.9));
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 14), std('#b9b1a3', { roughness: 0.9 })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, 2); path.receiveShadow = true; g.add(path);
  for (let x = -14; x <= 14; x += 1.2) if (Math.abs(x) > 1.6) g.add(box(0.35, 2.2, 0.15, trim, x, 1.1, 9));
  g.add(box(12.4, 0.25, 0.12, trim, -8.0, 1.6, 9.05), box(12.4, 0.25, 0.12, trim, 8.0, 1.6, 9.05));
  // flowers along the path
  for (let i = 0; i < 18; i++) { const rr = rng(200 + i); const z = -3 + (i % 9) * 1.4, x = i < 9 ? -2.2 : 2.2; g.add(sph(0.3, std(['#ff5d8f', '#ffd23f', '#ff8c42'][i % 3], { roughness: 0.6 }), x, 0.5 + rr() * 0.2, z, 10)); }
  // mailbox at the gate
  g.add(box(0.3, 3, 0.3, std('#5a3a20'), 3.2, 1.5, 10.2), box(1.6, 1.0, 0.9, std('#2c62a8', { roughness: 0.4, metalness: 0.3 }), 3.2, 3.4, 10.2));
  // power pole with crossarm and transformer (a grey can), wires off to the street
  const pole = std('#6a4a30', { roughness: 0.9 });
  g.add(cyl(0.3, 0.38, 16, pole, 10, 7, 8, 7));
  g.add(box(5, 0.35, 0.35, pole, 7, 15.3, 7));
  const tr = cyl(0.75, 0.75, 1.8, std('#9aa0a6', { roughness: 0.4, metalness: 0.6 }), 16, 7.9, 13.2, 7.0); g.add(tr);
  for (const x of [5.2, 7, 8.8]) g.add(cyl(0.1, 0.1, 0.5, std('#d8dde2'), 8, x, 15.7, 7));
  const wireM = std('#151515');
  for (const x of [5.2, 8.8]) { const w = cyl(0.04, 0.04, 60, wireM, 4, x, 15.6, 7); w.rotation.x = Math.PI / 2; w.position.z = 7; g.add(w); }
  g.userData.trees = pines(g, scatter(13, 0, -10, 60, 40, 60, (x, z) => Math.abs(x) < 22 && z > -22 && z < 14));
  return { group: g, transformer: V(YARD.x + 7.9, 13.2, YARD.z + 7.0) };
}

// The ranger station: exterior (door on +z at STATION) and, separately, its office interior at STATION_IN.
export function station(scene) {
  const g = new THREE.Group(); scene.add(g);
  const log = std('#8a5a34', { roughness: 0.85 }), roof = std('#3d5a3a', { roughness: 0.6 });
  const ex = new THREE.Group(); ex.position.copy(STATION); g.add(ex);
  ex.add(box(16, 7, 10, log, 0, 3.5, -5));
  for (let y = 0.6; y < 7; y += 0.9) ex.add(box(16.3, 0.12, 10.3, std('#6d4527'), 0, y, -5));
  const r = new THREE.Mesh(new THREE.ConeGeometry(11.6, 4, 4), roof); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, 0.7); r.position.set(0, 9, -5); r.castShadow = true; ex.add(r);
  ex.add(box(2.8, 4.8, 0.3, std('#4a2e1a'), 0, 2.4, 0.05));
  const s = label(7, 1.4, 900, 180, (c, w, h) => { c.fillStyle = '#2f4a2c'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2d16b'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20); LG(c, 'RANGER STATION', w / 2, h / 2 + 6, 104, '#f2d16b'); });
  s.position.set(0, 6.0, 0.25); ex.add(s);
  ex.add(box(3, 2.2, 0.2, std('#9fc6e8', { roughness: 0.2 }), -5, 3.8, 0.05), box(3, 2.2, 0.2, std('#9fc6e8', { roughness: 0.2 }), 5, 3.8, 0.05));
  ex.add(box(20, 0.4, 5, std('#8f8a80', { roughness: 0.9 }), 0, 0.2, 3));
  ex.userData.trees = pines(ex, scatter(17, 0, -10, 60, 40, 70, (x, z) => Math.abs(x) < 20 && z > -20 && z < 30));
  // interior: floor, back and side walls (open toward +z), window with storm light, desk, chair, lamp, hat peg
  const inn = new THREE.Group(); inn.position.copy(STATION_IN); g.add(inn);
  inn.add(box(16, 0.3, 12, std('#7a5638', { roughness: 0.8 }), 0, -0.15, 0));
  const wl = std('#b98b5c', { roughness: 0.85 });
  inn.add(box(16, 9, 0.4, wl, 0, 4.5, -6), box(0.4, 9, 12, wl, -8, 4.5, 0), box(0.4, 9, 12, wl, 8, 4.5, 0), box(16, 0.4, 12, wl, 0, 9, 0));
  for (let y = 0.9; y < 9; y += 0.9) inn.add(box(16, 0.08, 0.1, std('#8d633e'), 0, y, -5.75));
  const win = box(4.5, 3, 0.2, std('#5a6a8a', { emissive: '#8fa3c9', emissiveIntensity: 0.6, roughness: 0.2 }), 3.8, 5, -5.75); inn.add(win);
  inn.add(box(4.9, 0.3, 0.4, std('#5a3a20'), 3.8, 3.4, -5.6), box(0.25, 3.2, 0.3, std('#5a3a20'), 3.8, 5, -5.6), box(4.9, 0.25, 0.3, std('#5a3a20'), 3.8, 6.6, -5.6));
  // desk with papers and a radio
  const deskM = std('#6b4a2e', { roughness: 0.7 });
  inn.add(box(5.5, 0.3, 2.6, deskM, -1.5, 2.6, -3.0)); for (const x of [-4, 1]) for (const z of [-4.1, -1.9]) inn.add(box(0.3, 2.6, 0.3, deskM, x, 1.3, z));
  inn.add(box(1.4, 0.06, 1.0, std('#f4f1e8'), -2.4, 2.8, -2.7), box(1.0, 0.7, 0.6, std('#30363c', { metalness: 0.4, roughness: 0.5 }), 0.4, 3.1, -3.4));
  inn.add(box(0.1, 0.4, 0.05, std('#c0c4c8'), 0.75, 3.6, -3.4));
  // chair (Max sits on it, facing -z toward the desk)
  inn.add(box(1.8, 0.3, 1.8, std('#3a3330'), -1.5, 1.6, -0.3), box(1.8, 2.0, 0.25, std('#3a3330'), -1.5, 2.7, 0.65));
  for (const x of [-2.2, -0.8]) for (const z of [-1.0, 0.4]) inn.add(box(0.2, 1.5, 0.2, std('#22252a'), x, 0.75, z));
  // ceiling lamp
  inn.add(cyl(0.05, 0.05, 1.4, std('#22252a'), 6, -1.5, 8.1, -1.5));
  const shade = cyl(0.4, 1.0, 0.7, std('#2f5a35', { roughness: 0.5 }), 16, -1.5, 7.2, -1.5); inn.add(shade);
  const bulb = sph(0.3, std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 2 }), -1.5, 6.8, -1.5, 12); inn.add(bulb);
  // a peg rack on the left wall for the hat
  inn.add(box(0.2, 0.3, 2.6, std('#5a3a20'), -7.7, 6, -1.5)); inn.add(cyl(0.07, 0.07, 0.6, std('#5a3a20'), 6, -7.4, 6, -1.5).rotateZ(Math.PI / 2));
  // a park map poster
  const map = label(3.2, 2.2, 512, 352, (c, w, h) => { c.fillStyle = '#e8dfc4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5a3a20'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); c.fillStyle = '#7fa66a'; c.beginPath(); c.ellipse(w / 2, h / 2 + 20, 200, 110, 0.2, 0, 7); c.fill(); c.fillStyle = '#5b8fc4'; c.beginPath(); c.ellipse(w / 2 + 60, h / 2 + 30, 50, 30, 0, 0, 7); c.fill(); LG(c, 'PARK MAP', w / 2, 40, 46, '#5a3a20'); });
  map.position.set(-4.5, 5.6, -5.75); inn.add(map);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 30, 1.6); lamp.position.set(-1.5, 6.5, -1.5); inn.add(lamp);
  const winLight = new THREE.PointLight('#b9c9ff', 0, 30, 1.5); winLight.position.set(3.8, 5, -4.5); inn.add(winLight);
  return { group: g, exterior: ex, interior: inn, lamp, winLight, bulb: V(STATION_IN.x - 1.5, 6.8, STATION_IN.z - 1.5), peg: V(STATION_IN.x - 7.25, 6.05, STATION_IN.z - 1.5), chair: V(STATION_IN.x - 1.5, 1.75, STATION_IN.z - 0.3), window: win };
}

// The pond: water disc, a muddy bank, reeds (where the bear comes through), rocks, and pines behind.
export function pond(scene) {
  const g = new THREE.Group(); g.position.copy(POND); scene.add(g);
  const water = new THREE.Mesh(new THREE.CircleGeometry(16, 48), std('#3f6f8f', { roughness: 0.12, metalness: 0.3, emissive: '#10202c', emissiveIntensity: 0.4 }));
  water.rotation.x = -Math.PI / 2; water.scale.set(1.4, 1, 1); water.position.set(0, 0.06, -12); water.receiveShadow = true; g.add(water);
  const bank = new THREE.Mesh(new THREE.RingGeometry(16, 19, 48), std('#7a6448', { roughness: 0.95 })); bank.rotation.x = -Math.PI / 2; bank.scale.set(1.4, 1, 1); bank.position.set(0, 0.04, -12); g.add(bank);
  for (let i = 0; i < 26; i++) { const r = rng(300 + i), a = r() * 6.28; g.add(sph(0.6 + r() * 0.9, std('#7d7f86', { roughness: 0.9 }), Math.cos(a) * 18.5 * 1.4, 0.2, -12 + Math.sin(a) * 18.5, 8)); }
  // reeds clumps on the bank either side of the fishing spot
  const reedM = std('#6f8f3a', { roughness: 0.9 });
  const reedGeo = []; const rr = rng(77);
  for (let i = 0; i < 140; i++) { const x = (rr() < 0.5 ? -1 : 1) * (7 + rr() * 14), z = 3 + rr() * 4 - Math.abs(x) * 0.12; const h = 1.6 + rr() * 1.6; const c = new THREE.CylinderGeometry(0.05, 0.09, h, 5); c.translate(x, h / 2, z); reedGeo.push(c); }
  const reeds = new THREE.Mesh(mergeGeometries(reedGeo), reedM); reeds.castShadow = true; g.add(reeds);
  // a log to sit the fish bucket by and the rod rest
  const lg = cyl(0.6, 0.6, 5, std('#6b4a2e', { roughness: 0.9 }), 12, -4.5, 0.6, 7.5); lg.rotation.z = Math.PI / 2; g.add(lg);
  g.userData.trees = pines(g, scatter(19, 0, -10, 70, 50, 90, (x, z) => (x * x / 1.96 + (z + 12) * (z + 12)) < 30 * 30 || (Math.abs(x) < 26 && z > -4 && z < 30)));
  g.userData.trees2 = pines(g, scatter(21, 0, 40, 60, 12, 30, () => false));
  return { group: g, water };
}

// The museum: a dark hall with a spot-lit glass case holding the two scorched hats and a record plaque.
export async function museum(scene) {
  const g = new THREE.Group(); g.position.copy(MUSEUM); scene.add(g);
  g.add(box(40, 0.3, 30, std('#3a2e2a', { roughness: 0.4 }), 0, -0.15, 0));
  const wall = std('#5b1f2a', { roughness: 0.9 });
  g.add(box(40, 16, 0.5, wall, 0, 8, -8), box(0.5, 16, 30, wall, -14, 8, 0), box(0.5, 16, 30, wall, 14, 8, 0));
  // pedestal and glass case
  g.add(box(6, 3.4, 3.6, std('#1e1b1a', { roughness: 0.5 }), 0, 1.7, 0));
  g.add(box(6.3, 0.2, 3.9, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 0, 3.5, 0));
  const glass = new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 0.16, depthWrite: false });
  const gcase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.4, 3.4), glass); gcase.position.set(0, 5.3, 0); g.add(gcase);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.8, 3.4, 3.4)), new THREE.LineBasicMaterial({ color: '#e8d48a' })); edges.position.copy(gcase.position); g.add(edges);
  // the two scorched hats on little stands
  const hats = [];
  for (const [x, ry] of [[-1.4, 0.4], [1.4, -0.5]]) {
    g.add(cyl(0.12, 0.12, 0.8, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 8, x, 4.0, 0));
    const h = await packItem('accessories', 'ranger_hat_burnt'); h.position.set(x, 4.45, 0); h.rotation.set(0.12, ry, 0.05); h.scale.setScalar(1.05); g.add(h); hats.push(h);
    // char marks: a few dark blobs on the crown
    for (let k = 0; k < 3; k++) { const rr = rng(400 + k + x * 10); const b = sph(0.18 + rr() * 0.12, std('#141110', { roughness: 1 }), x + (rr() - 0.5) * 0.9, 4.75 + rr() * 0.35, 0.35 + rr() * 0.2, 8); b.scale.set(1, 0.5, 0.4); g.add(b); }
  }
  // plaque on the pedestal front
  const pl = label(5.4, 2.4, 900, 400, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6dc7a'); gr.addColorStop(1, '#c79a2a'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#6b4a10'; c.lineWidth = 12; c.strokeRect(12, 12, w - 24, h - 24);
    LG(c, 'WORLD RECORD', w / 2, 90, 96, '#3b2a08'); MS(c, 'MOST LIGHTNING STRIKES', w / 2, 200, 54, '#3b2a08'); MS(c, 'SURVIVED BY ONE PERSON', w / 2, 262, 54, '#3b2a08');
    LG(c, '7', w / 2, 345, 90, '#8a1a1a');
  }, { roughness: 0.35, metalness: 0.4 });
  pl.position.set(0, 1.8, 1.82); g.add(pl);
  // velvet rope posts
  for (const x of [-5, 5]) { g.add(cyl(0.15, 0.25, 2.6, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 10, x, 1.3, 5)); g.add(sph(0.25, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), x, 2.7, 5, 10)); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(-5, 2.5, 5), V(0, 1.5, 5), V(5, 2.5, 5)), 20, 0.12, 8), std('#9b1b2a', { roughness: 0.6 })); g.add(rope);
  // framed lightning painting on the back wall
  const art = label(8, 5, 800, 500, (c, w, h) => { c.fillStyle = '#2a3048'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffe58a'; c.lineWidth = 16; c.beginPath(); c.moveTo(w * 0.55, 20); c.lineTo(w * 0.45, h * 0.45); c.lineTo(w * 0.58, h * 0.48); c.lineTo(w * 0.42, h - 20); c.stroke(); c.strokeStyle = '#d4af37'; c.lineWidth = 30; c.strokeRect(0, 0, w, h); });
  art.position.set(0, 10, -7.7); g.add(art);
  const spot = new THREE.SpotLight('#fff1d0', 0, 40, 0.42, 0.45, 1.2); spot.position.set(0, 15, 6); spot.target.position.set(MUSEUM.x, 4.5, MUSEUM.z); spot.castShadow = true; g.add(spot); scene.add(spot.target);
  return { group: g, hats, spot };
}

// ======================================================= props =======================================================
// Red water can (jerrycan) with WATER on the side. GRIP: origin at the top handle (held in one fist, can hangs below).
export function waterCan() {
  const g = new THREE.Group(), red = std('#c8202b', { roughness: 0.35, metalness: 0.25 });
  g.add(box(1.0, 1.3, 0.55, red, 0, -0.95, 0));
  g.add(box(0.7, 0.1, 0.12, std('#8f1820'), 0, -0.05, 0)); g.add(box(0.1, 0.25, 0.12, std('#8f1820'), -0.32, -0.15, 0), box(0.1, 0.25, 0.12, std('#8f1820'), 0.32, -0.15, 0));
  const sp = cyl(0.09, 0.12, 0.5, std('#8f1820'), 10, 0.42, -0.25, 0); sp.rotation.z = -0.6; g.add(sp);
  const l = label(0.8, 0.42, 256, 128, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); LG(c, 'WATER', w / 2, h / 2 + 4, 66, '#1f6fb8'); });
  l.position.set(0, -0.95, 0.28); g.add(l);
  const l2 = l.clone(); l2.position.z = -0.28; l2.rotation.y = Math.PI; g.add(l2);
  g.userData.spout = V(0.6, -0.1, 0);
  return g;
}
// Fishing rod: GRIP at the origin (the handle, in the right fist); rod runs forward-up along +z; the tip at TIP.
export function fishingRod() {
  const g = new THREE.Group(), cork = std('#b98b5c', { roughness: 0.9 }), blank = std('#2a2f36', { roughness: 0.4, metalness: 0.3 });
  const h = cyl(0.11, 0.11, 1.4, cork, 10); h.rotation.x = Math.PI / 2; h.position.z = 0.1; g.add(h);
  const reel = cyl(0.22, 0.22, 0.18, std('#9aa0a6', { metalness: 0.7, roughness: 0.3 }), 14); reel.rotation.z = Math.PI / 2; reel.position.set(0, -0.28, 0.45); g.add(reel);
  const rod = cyl(0.03, 0.07, 7.5, blank, 8); rod.rotation.x = Math.PI / 2; rod.position.z = 0.8 + 3.75; g.add(rod);
  g.userData.TIP = V(0, 0, 0.8 + 7.5);
  return g;
}
// A trout (silver-green, pink stripe), origin at the mouth (where the line hooks it), body hanging along -y.
export function fish() {
  const g = new THREE.Group(), m = std('#9fb3a0', { roughness: 0.35, metalness: 0.3 }), stripe = std('#e58fa3', { roughness: 0.5 });
  const b = sph(0.35, m, 0, -0.75, 0, 16); b.scale.set(0.55, 1.6, 0.9); g.add(b);
  const s = sph(0.36, stripe, 0, -0.75, 0, 16); s.scale.set(0.57, 1.25, 0.5); g.add(s);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.5, 4), m); tail.position.set(0, -1.55, 0); tail.scale.set(0.3, 1, 1); tail.castShadow = true; g.add(tail);
  for (const x of [-0.17, 0.17]) g.add(sph(0.07, std('#111111'), x, -0.28, 0.1, 8));
  return g;
}
// A fishing line from a to b (a thin cylinder, updated per frame).
export function line() { const l = cyl(0.015, 0.015, 1, std('#e8e8e8', { roughness: 0.5 }), 4); l.castShadow = false; return l; }
export function setLine(l, a, b) {
  const d = b.clone().sub(a), len = d.length(); l.position.copy(a).addScaledVector(d, 0.5); l.scale.set(1, len, 1);
  l.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
}
export function bobber() { const g = new THREE.Group(); g.add(sph(0.22, std('#e63946', { roughness: 0.4 }), 0, 0.05, 0, 12)); g.add(sph(0.2, std('#ffffff', { roughness: 0.4 }), 0, -0.1, 0, 12)); return g; }
// A tiny toenail chip (pops out of the boot).
export function toenail() { const m = sph(0.12, std('#f2e6d0', { roughness: 0.4 }), 0, 0, 0, 10); m.scale.set(1, 0.35, 0.8); const g = new THREE.Group(); g.add(m); return g; }
// Speech bubble sign (world space, faces +z).

// ======================================================= effects =====================================================
// A lightning bolt from `a` (sky) to `b` (ground/target): a jagged core plus a soft glow, with 2-3 forks.
export function bolt(seed, a, b, { width = 0.22, forks = 3 } = {}) {
  const r = rng(seed), g = new THREE.Group(), core = [], glow = [];
  const seg = (p, q, wd, list) => {
    const d = q.clone().sub(p), len = d.length(), m = new THREE.BoxGeometry(wd, len, wd);
    const o = new THREE.Object3D(); o.position.copy(p).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); o.updateMatrix();
    m.applyMatrix4(o.matrix); list.push(m);
  };
  const path = (p, q, n, jit, wd) => {
    const pts = [p.clone()], len = p.distanceTo(q);
    for (let i = 1; i < n; i++) { const u = i / n; pts.push(p.clone().lerp(q, u).add(V((r() - 0.5) * jit * len, (r() - 0.5) * jit * len * 0.3, (r() - 0.5) * jit * len))); }
    pts.push(q.clone());
    for (let i = 0; i < pts.length - 1; i++) { seg(pts[i], pts[i + 1], wd, core); seg(pts[i], pts[i + 1], wd * 5, glow); }
    return pts;
  };
  const main = path(a, b, 16, 0.07, width);
  for (let f = 0; f < forks; f++) {
    const i = 2 + Math.floor(r() * 8), p = main[i], dir = b.clone().sub(a).normalize();
    const q = p.clone().add(V((r() - 0.5) * 14, -6 - r() * 8, (r() - 0.5) * 14)).addScaledVector(dir, 2);
    path(p, q, 6, 0.12, width * 0.6);
  }
  const coreM = new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false, toneMapped: false });
  coreM.color.setRGB(6, 6.5, 8);                                  // HDR white so the bloom catches it
  const glowM = new THREE.MeshBasicMaterial({ color: '#8fb6ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const c = new THREE.Mesh(mergeGeometries(core), coreM), gl = new THREE.Mesh(mergeGeometries(glow), glowM);
  c.frustumCulled = gl.frustumCulled = false; g.add(c, gl); g.userData = { coreM, glowM };
  return g;
}
// Flames for burning hair: a ring of flickering cones (additive). Attach to the head bone; set .userData.t each frame.
export function flames() {
  const g = new THREE.Group(), cols = ['#ff5a1f', '#ff9a1f', '#ffd23f'];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, m = new THREE.MeshBasicMaterial({ color: cols[i % 3], transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    m.color.multiplyScalar(2.2);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.75, 7), m); c.position.set(Math.cos(a) * 0.42, 0.3, Math.sin(a) * 0.42); c.userData.a = a; g.add(c);
  }
  const mid = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 8), new THREE.MeshBasicMaterial({ color: '#ffb02e', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); mid.material.color.multiplyScalar(2.2); mid.position.y = 0.45; g.add(mid);
  return g;
}
export function flicker(f, t, k = 1) {
  f.children.forEach((c, i) => { const s = (0.75 + 0.35 * Math.sin(t * 23 + i * 2.1) + 0.2 * Math.sin(t * 37 + i)) * k; c.scale.set(Math.max(0.01, k), Math.max(0.01, s), Math.max(0.01, k)); });
}
// Small glowing sparks (instanced), placed per frame.
export function sparks(n = 24) {
  const m = new THREE.MeshBasicMaterial({ color: '#fff2a8', toneMapped: false }); m.color.setRGB(5, 4.4, 2);
  const s = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), m, n); s.frustumCulled = false; return s;
}
// A dark storm cloud (merged puffs, grey, slightly lit underneath).
const stormMat = new THREE.MeshStandardMaterial({ color: '#4a5263', roughness: 1, emissive: '#1b2030', emissiveIntensity: 0.4 });
export function stormCloud(seed, size = 8) { const c = cloud(seed, size); c.material = stormMat; return c; }
export { stormMat };
