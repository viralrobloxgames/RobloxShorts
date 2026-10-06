// He Won The Marathon By Car: sets and props, built in code.
// World layout (studs, ground y 0). One long dusty country road along +x at z 0 (width ROAD_W), fences both sides.
//   FINISH  x 0: the stadium finish line (tape across the road, FINISH banner on two posts, stands with a crowd at z -16).
//   START   x 40: where the field lines up (same stadium end).
//   MILE9   x 260: a MILE 9 post on the +z verge.
//   WELL    x 380, z 9: the one water stop (stone well, roof, bucket, WATER sign).
//   CHAT    x 470: farmers leaning on the -z fence (Leo chats).
//   ORCHARD x 560, z 10..40: apple trees on the +z side.
//   FIELD   x 700: open meadow on the +z side (the dog chase).
//   MILE19  x 820: a MILE 19 post on the +z verge (the car breaks down).
// Runners move +x. The car is built facing +z (props face +z); a heading of PI/2 drives it along +x.
import * as THREE from 'three';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const ROAD_W = 12, ROAD_Y = 0.1;                      // the road surface sits 0.1 above the meadow (no z-fighting)
export const level = (p) => (Math.abs(p.z) < ROAD_W / 2 + 0.3 ? ROAD_Y : 0);
export const FINISH_X = 0, START_X = 40, MILE9_X = 260, WELL = V(380, 0, 10), CHAT_X = 470, ORCHARD = V(560, 0, 16), FIELD_X = 700, MILE19_X = 820;

// ======================================================= ground ======================================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#9aa452'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${55 + r() * 30},${30 + r() * 18}%,${34 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(200, 200);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.position.set(400, -0.06, 0); m.receiveShadow = true; scene.add(m);
  return m;
}
// The dirt road, x -120..1000: packed dust with wheel ruts and stones.
export function road(scene) {
  const tex = canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = '#c9a874'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,92,60' : '235,214,170'},${0.08 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 4); }
    g.fillStyle = 'rgba(120,90,58,.28)'; for (const y of [0.3, 0.7]) g.fillRect(0, h * y - 10, w, 20);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(110,100,90,${0.4 + r() * 0.3})`; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 3, 0, 7); g.fill(); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1120 / 48, 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1120, ROAD_W), std('#ffffff', { map: tex, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.set(440, ROAD_Y, 0); m.receiveShadow = true; scene.add(m);
  // verges: a slightly darker dusty strip each side
  for (const z of [-ROAD_W / 2 - 1.5, ROAD_W / 2 + 1.5]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1120, 3), std('#a99a64', { roughness: 1 })); v.rotation.x = -Math.PI / 2; v.position.set(440, 0.03, z); v.receiveShadow = true; scene.add(v);
  }
  return m;
}
// Split-rail fences along both sides (gaps at the well, the chat spot, the orchard and the field).
export function fences(scene) {
  const wood = std('#8a6a48', { roughness: 0.9 }), g = new THREE.Group();
  const gaps = [[WELL.x - 10, WELL.x + 10, 1], [ORCHARD.x - 30, ORCHARD.x + 40, 1], [FIELD_X - 50, FIELD_X + 70, 1], [FIELD_X - 60, FIELD_X + 70, 0], [-40, 60, 0], [-40, 60, 1]];
  for (const side of [-1, 1]) {
    const z = side * (ROAD_W / 2 + 3.2);
    for (let x = 60; x < 1000; x += 8) {
      if (gaps.some(([a, b, s]) => x >= a && x <= b && (s === (side > 0 ? 1 : 0)))) continue;
      g.add(box(0.4, 3.0, 0.4, wood, x, 1.5, z));
      for (const y of [1.2, 2.4]) g.add(box(8, 0.3, 0.22, wood, x + 4, y, z));
    }
  }
  scene.add(g); return g;
}
// Round trees (instanced); apple trees get red apples.
export function trees(scene, spots, seed = 3, { apples = false } = {}) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.6, 3.6, 7), std('#6b4a2c', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4, 1), std(apples ? '#5f8a35' : '#55782f', { roughness: 0.9, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const fruit = apples ? new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 10, 8), std('#d6262b', { roughness: 0.45 }), n * 14) : null;
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.85 + r() * 0.3); q.setFromEuler(e.set(0, r() * 6.28, 0));
    m.compose(V(x, 1.8 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 5.6 * sc, z), q, V(sc * 1.15, sc * 0.85, sc * 1.15)); crown.setMatrixAt(i, m);
    if (fruit) for (let k = 0; k < 14; k++) {
      const a = r() * 6.28, y = (4.4 + r() * 2.6) * sc, rad = Math.sqrt(Math.max(0, 1 - ((y / sc - 5.6) / 3.0) ** 2)) * 3.75 * sc;
      m.compose(V(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad), q, V(1, 1, 1)); fruit.setMatrixAt(i * 14 + k, m);
    }
  });
  const out = [trunk, crown]; if (fruit) out.push(fruit);
  for (const o of out) { o.castShadow = true; o.receiveShadow = true; scene.add(o); }
  return out;
}

// ======================================================= the finish ==================================================
// Stands on the -z side (rows of benches with a flat crowd of block fans), the FINISH banner across the road, the tape.
export function finish(scene) {
  const g = new THREE.Group(); scene.add(g);
  const wood = std('#b08a5a', { roughness: 0.85 }), white = std('#f4f1e8'), dark = std('#4a3a2a');
  // stands: 6 steps, x -45..45, rising away from the road
  for (let i = 0; i < 6; i++) g.add(box(90, 1.2, 3, wood, 0, 0.6 + i * 1.2, -15 - i * 3));
  g.add(box(90, 7.2, 0.6, dark, 0, 3.6, -33.4));
  // a flat crowd: blocky fans (instanced torsos + heads) in shirt colours
  const r = rng(9), cols = ['#d94f3d', '#3d7bd9', '#f2c14e', '#5aa05a', '#8c5ad9', '#f4f1e8', '#e08a3a', '#2f9e9e'];
  const n = 150, tors = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 1.8, 0.9), std('#ffffff', { roughness: 0.8 }), n);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), std('#f2c79a', { roughness: 0.7 }), n);
  const hats = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 12), std('#3a2e24', { roughness: 0.8 }), n);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let k = 0;
  for (let row = 0; row < 6; row++) for (let i = 0; i < 25 && k < n; i++, k++) {
    const x = -42 + i * 3.5 + (r() - 0.5) * 1.2, y = 1.2 + row * 1.2, z = -15.4 - row * 3;
    M.compose(V(x, y + 0.9, z), q, V(1, 1, 1)); tors.setMatrixAt(k, M); tors.setColorAt(k, c.set(cols[(r() * cols.length) | 0]));
    M.compose(V(x, y + 2.35, z), q, V(1, 1, 1)); heads.setMatrixAt(k, M);
    M.compose(V(x, y + 2.95, z), q, r() < 0.6 ? V(1, 1, 1) : V(0, 0, 0)); hats.setMatrixAt(k, M);
  }
  for (const o of [tors, heads, hats]) { o.castShadow = true; g.add(o); }
  g.userData.fans = { tors, heads, hats, n };
  // banner on two posts
  const post = std('#e9e4d6');
  for (const z of [-ROAD_W / 2 - 1, ROAD_W / 2 + 1]) g.add(box(0.7, 13, 0.7, post, FINISH_X, 6.5, z));
  const ban = label(ROAD_W + 2.6, 3.0, 1024, 236, (x, w, h) => {
    x.fillStyle = '#1d3a7a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.fillRect(10, 10, w - 20, h - 20); x.fillStyle = '#1d3a7a'; x.fillRect(20, 20, w - 40, h - 40);
    SLAB(x, 'FINISH', w / 2, h / 2 + 6, 150, '#ffffff');
  });
  ban.position.set(FINISH_X + 0.36, 11.2, 0); ban.rotation.y = Math.PI / 2; g.add(ban);
  const ban2 = ban.clone(); ban2.position.x = FINISH_X - 0.36; ban2.rotation.y = -Math.PI / 2; g.add(ban2);
  g.add(box(0.5, 3.2, ROAD_W + 2.8, std('#1d3a7a'), FINISH_X, 11.2, 0));
  ban.position.x = FINISH_X + 0.27; ban2.position.x = FINISH_X - 0.27;
  // the finish line painted on the road
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.8, ROAD_W), std('#f4f1e8', { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 })); line.rotation.x = -Math.PI / 2; line.position.set(FINISH_X, ROAD_Y + 0.06, 0); g.add(line);
  // the tape: two halves that swing apart when broken
  const tapeM = std('#f4f1e8', { roughness: 0.5, side: THREE.DoubleSide });
  const tape = [-1, 1].map((sd) => { const p = new THREE.Group(); p.position.set(FINISH_X + 0.2, 3.6, sd * (ROAD_W / 2 + 0.6)); const m = box(0.06, 0.22, ROAD_W / 2 + 0.6, tapeM, 0, 0, -sd * (ROAD_W / 2 + 0.6) / 2); m.castShadow = false; p.add(m); g.add(p); return p; });
  for (const z of [-ROAD_W / 2 - 0.6, ROAD_W / 2 + 0.6]) g.add(box(0.3, 3.8, 0.3, post, FINISH_X + 0.2, 1.9, z));
  g.userData.tape = tape;
  // flags along the top of the stands
  for (let i = 0; i < 7; i++) {
    const x = -42 + i * 14; g.add(box(0.2, 5, 0.2, post, x, 9.7, -33));
    const f = box(2.4, 1.4, 0.06, std(i % 2 ? '#c8202a' : '#1d3a7a'), x + 1.3, 11.4, -33); g.add(f);
  }
  return g;
}
export function breakTape(fin, k) {                          // k 0..1: the halves swing back along the road
  fin.userData.tape.forEach((p, i) => { p.rotation.y = (i ? -1 : 1) * 1.35 * k; p.rotation.x = (i ? 1 : -1) * 0.2 * k; });
}

// ======================================================= the car =====================================================
// An open 1900s touring car: red body, black fenders, brass lamps and radiator, a front bench and a back bench, spoked
// wheels. Faces +z. Seats: front bench top y 2.55 at z 0.6 (driver on the left, x +1.0), back bench top y 2.75 at z -2.4.
export const CAR = { frontSeat: V(1.0, 2.55, 0.35), backSeat: V(-0.9, 2.75, -2.55), wheelR: 1.45 };
export function car() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const red = std('#b3261e', { roughness: 0.4, metalness: 0.2 }), black = std('#1b1b1e', { roughness: 0.5 }), brass = std('#d4a83a', { metalness: 0.85, roughness: 0.3 });
  const leather = std('#4a2c1c', { roughness: 0.6 }), tyre = std('#222226', { roughness: 0.8 }), spokeM = std('#e8d9b0', { roughness: 0.6 });
  body.add(box(4.2, 0.4, 10.4, black, 0, 1.55, 0));                                 // chassis
  body.add(box(3.8, 1.5, 4.6, red, 0, 2.5, 1.2));                                   // front tub
  body.add(box(4.0, 1.9, 3.8, red, 0, 2.7, -2.6));                                  // rear tonneau
  body.add(box(3.0, 1.8, 2.2, red, 0, 2.55, 4.6));                                  // bonnet
  const rad = box(3.0, 2.3, 0.35, brass, 0, 2.75, 5.85); body.add(rad);
  const grille = label(2.5, 1.8, 64, 64, (x, w, h) => { x.fillStyle = '#2a2420'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a8842c'; x.lineWidth = 3; for (let i = 6; i < w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } });
  grille.position.set(0, 2.75, 6.04); body.add(grille);
  // seats (cushions) and backs; the interiors are dark leather
  body.add(box(3.4, 0.5, 1.8, leather, 0, 2.3, 0.4));
  body.add(box(3.4, 1.7, 0.4, leather, 0, 3.2, -0.65));
  body.add(box(3.6, 0.5, 2.0, leather, 0, 2.5, -2.4));
  body.add(box(3.8, 2.2, 0.4, leather, 0, 3.6, -4.35));
  // steering column and wheel (driver on the +x side)
  const col = cyl(0.08, 0.08, 2.4, black, 8, 1.0, 3.2, 2.3); col.rotation.x = -0.6; body.add(col);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 28), black); sw.position.set(1.0, 4.05, 1.65); sw.rotation.x = -0.6 - Math.PI / 2 + Math.PI / 2; sw.rotation.x = 0.97; body.add(sw);
  // fenders + running boards
  for (const sx of [-1, 1]) {
    body.add(box(0.9, 0.2, 7.0, black, sx * 2.45, 1.55, 0.6));
    for (const z of [3.9, -3.3]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1.0, 20, 1, true, 0, Math.PI), black); f.rotation.z = Math.PI / 2; f.rotation.y = 0; f.position.set(sx * 2.45, 1.45, z); f.rotation.set(0, 0, Math.PI / 2); f.rotateY(Math.PI / 2); f.castShadow = true; body.add(f); }
    const lamp = cyl(0.35, 0.3, 0.6, brass, 14, sx * 1.75, 3.45, 5.6); lamp.rotation.x = Math.PI / 2; body.add(lamp);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), std('#fff6d0', { emissive: '#fff0b0', emissiveIntensity: 0.3 })); glass.position.set(sx * 1.75, 3.45, 5.91); body.add(glass);
  }
  // horn
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 12, 1, true), brass); horn.rotation.x = -Math.PI / 2; horn.position.set(2.2, 3.2, 3.6); body.add(horn);
  // wheels (spin about x)
  const wheels = [];
  for (const [x, z] of [[-2.35, 3.9], [2.35, 3.9], [-2.35, -3.3], [2.35, -3.3]]) {
    const w = new THREE.Group(); w.position.set(x, CAR.wheelR, z);
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.22, 10, 28), tyre); t.rotation.y = Math.PI / 2; t.castShadow = true; w.add(t);
    for (let i = 0; i < 10; i++) { const s = box(0.1, 2.4, 0.12, spokeM); s.rotation.x = (i / 10) * Math.PI; w.add(s); }
    const hub = cyl(0.25, 0.25, 0.5, brass, 12); hub.rotation.z = Math.PI / 2; w.add(hub);
    g.add(w); wheels.push(w);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { body, wheels };
  return g;
}
// place the car: pos on the ground, heading (0 = +z), dist driven (wheel spin), bounce (body jiggle)
export function setCar(c, pos, heading, dist, bounce = 0, t = 0) {
  c.position.copy(pos); c.position.y += ROAD_Y; c.rotation.set(0, heading, 0);
  for (const w of c.userData.wheels) w.rotation.x = dist / CAR.wheelR;
  c.userData.body.position.y = bounce * 0.08 * Math.sin(t * 31); c.userData.body.rotation.z = bounce * 0.012 * Math.sin(t * 23);
}

// ======================================================= roadside ====================================================
export function milePost(n) {
  const g = new THREE.Group(), wood = std('#8a6a48', { roughness: 0.9 });
  g.add(box(0.5, 6.2, 0.5, wood, 0, 3.1, 0));
  const s = label(4.6, 2.2, 512, 245, (x, w, h) => { x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a2a1a'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); SLAB(x, `MILE ${n}`, w / 2, h / 2 + 8, 112, '#3a2a1a'); });
  s.position.set(0, 5.4, 0.3); g.add(s);
  const b = s.clone(); b.rotation.y = Math.PI; b.position.z = -0.3; g.add(b);
  g.add(box(4.8, 2.4, 0.5, wood, 0, 5.4, 0));
  return g;
}
// The one water stop: a stone well with a little roof, a bucket on the rim and a WATER sign.
export function well() {
  const g = new THREE.Group(), stone = std('#9a948a', { roughness: 0.95, flatShading: true }), wood = std('#7a5a3c', { roughness: 0.9 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 2.6, 14, 1, true), stone); ring.position.y = 1.3; ring.castShadow = ring.receiveShadow = true; ring.material.side = THREE.DoubleSide; g.add(ring);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.3, 8, 20), stone); rim.rotation.x = Math.PI / 2; rim.position.y = 2.6; g.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.3, 20), std('#2d5f7a', { roughness: 0.15, metalness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 1.6; g.add(water);
  for (const x of [-2.2, 2.2]) g.add(box(0.4, 6.6, 0.4, wood, x, 3.3, 0));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 3.8, 1.8, 4, 1), std('#8b3b2a', { roughness: 0.8 })); roof.rotation.y = Math.PI / 4; roof.position.y = 7.4; roof.scale.set(1, 1, 0.75); roof.castShadow = true; g.add(roof);
  const axle = cyl(0.18, 0.18, 4.6, wood, 8, 0, 6.0, 0); axle.rotation.z = Math.PI / 2; g.add(axle);
  const rope = cyl(0.05, 0.05, 3.3, std('#c9b48a'), 5, -1.3, 4.35, 0); g.add(rope);
  const bucket = cyl(0.5, 0.4, 0.8, wood, 12, -1.3, 2.3, 0); g.add(bucket);
  const sign = label(4.2, 1.6, 512, 195, (x, w, h) => { x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1d3a7a'; x.lineWidth = 12; x.strokeRect(6, 6, w - 12, h - 12); SLAB(x, 'WATER', w / 2, h / 2 + 6, 120, '#1d3a7a'); });
  sign.position.set(0, 1.45, -2.86); sign.rotation.y = Math.PI; g.add(sign);
  g.add(box(4.4, 1.8, 0.1, std('#7a5a3c'), 0, 1.45, -2.75));
  return g;
}
// A gold medal on a ribbon. Origin = top of the ribbon loop (where the fist grips), the disc hangs 1.1 below. Faces +z.
export function medal() {
  const g = new THREE.Group(), gold = std('#e6b730', { metalness: 0.9, roughness: 0.25 });
  const rib = std('#1d3a7a', { roughness: 0.6, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) { const r = box(0.16, 1.0, 0.04, rib, sx * 0.14, -0.45, 0); r.rotation.z = sx * 0.18; g.add(r); }
  const d = cyl(0.42, 0.42, 0.1, gold, 28, 0, -1.15, 0); d.rotation.x = Math.PI / 2; g.add(d);
  const star = label(0.5, 0.5, 64, 64, (x, w, h) => { x.fillStyle = '#e6b730'; x.fillRect(0, 0, w, h); LG(x, '1', w / 2, h / 2 + 4, 52, '#9a7414'); }, { metalness: 0.6, roughness: 0.3 });
  star.position.set(0, -1.15, 0.06); g.add(star);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// A red apple, 0.5 across. Origin at its centre.
export function apple(rotten = false) {
  const g = new THREE.Group();
  const a = sph(0.27, std(rotten ? '#8a6a2a' : '#d6262b', { roughness: 0.45 }), 0, 0, 0, 16); a.scale.set(1, 0.92, 1); g.add(a);
  g.add(cyl(0.025, 0.03, 0.18, std('#5a3a20'), 6, 0, 0.3, 0));
  const leaf = box(0.16, 0.02, 0.08, std('#4a8a2a'), 0.08, 0.32, 0); leaf.rotation.z = 0.4; g.add(leaf);
  if (rotten) for (const [x, y, z] of [[0.18, 0.08, 0.16], [-0.12, -0.06, 0.22]]) g.add(sph(0.08, std('#3a2a12', { roughness: 1 }), x, y, z, 8));
  return g;
}
// A field of dust puffs that trail a car: n puffs, reused. update with dustAt().
export function dustCloud(n = 14, seed = 1) {
  const g = new THREE.Group(), r = rng(seed), mat = new THREE.MeshStandardMaterial({ color: '#d8c39a', roughness: 1, transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), mat.clone()); m.userData.r = [r(), r(), r(), r()]; m.castShadow = false; g.add(m); }
  return g;
}
// puffs along a line behind `from` (world) in direction `back`, life-cycled by time
export function dustAt(d, from, back, t, amount = 1, spread = 1) {
  d.children.forEach((m, i) => {
    const [a, b, c, e] = m.userData.r, life = (t * 0.9 + a) % 1;
    m.position.copy(from).addScaledVector(back, life * 16 * spread + 1).add(V((b - 0.5) * 4 * spread, 0.8 + life * 3.2, (c - 0.5) * 5 * spread));
    m.scale.setScalar((1.0 + life * 2.4) * (0.7 + e * 0.6) * spread);
    m.material.opacity = amount * 0.4 * Math.sin(Math.PI * Math.min(1, life * 1.15));
    m.visible = amount > 0.01;
  });
}
// Steam puffs from the radiator (breakdown).
export function steam(n = 8) { return dustCloud(n, 7); }
// Overlay helpers for dress: a shirt (torso + sleeves) and trousers to the knee.
export function shirt(actor, { color = '#f4f2ec', sleeves = true, num = null, hem = 0.1 } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.08, 2.04 + hem, 1.08, m, 0, 1.02 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.07, 1.5, 1.07, m, sx * 0.5, -0.22, 0); actor.bones[bone].add(s); parts.push(s); }
  if (num != null) {
    const n = label(0.95, 0.75, 128, 100, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#222'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); SLAB(x, String(num), w / 2, h / 2 + 4, 62, '#1a1a1a'); }, { roughness: 0.8 });
    n.position.set(0, 1.2, 0.56); actor.bones.Torso.add(n); parts.push(n);
  }
  for (const p of parts) p.castShadow = true;
  return parts;
}
// trousers cut at the knee: dark boxes over the top half of each leg (the leg box is 1x2x1, top at the hip pivot)
export function cutTrousers(actor, color = '#2e2a33') {
  const m = std(color, { roughness: 0.8 }), parts = [];
  for (const [bone, sx] of [['Leg.R', -1], ['Leg.L', 1]]) {
    const p = box(1.07, 1.1, 1.07, m, sx * 0.5 * 0 + (bone === 'Leg.R' ? 0.5 : -0.5) * 0, -0.55, 0); actor.bones[bone].add(p); parts.push(p);
    const fray = box(1.1, 0.12, 1.1, std('#4a4552', { roughness: 1 }), 0, -1.12, 0); actor.bones[bone].add(fray); parts.push(fray);
  }
  for (const p of parts) p.castShadow = true;
  return parts;
}
// A simple beret: a flattened disc with a stalk. Attach with fitAccessory? No: it's a soft cap, so it's placed on the
// hair top by measuring the hair (see clip). Not used if it fails the look check.
export function cloudPuff(seed, size) { return cloud(seed, size); }
