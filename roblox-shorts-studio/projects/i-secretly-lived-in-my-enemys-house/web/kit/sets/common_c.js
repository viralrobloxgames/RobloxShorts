// Shared helpers for the kitchen, classroom and exterior sets (kit-sets-c).
// Geometry is Roblox-scale: characters are ~5 studs tall (feet y 0, hip 2, shoulders 4), Dad ~5.6.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTexture, rng } from '../../../../../web/lib/world.js';

export { THREE, canvasTexture, rng };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const glow = (color, intensity = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
export function box(w, h, d, m, x = 0, y = 0, z = 0, parent = null) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true;
  if (parent) parent.add(b); return b;
}
export function rbox(w, h, d, r, m, x = 0, y = 0, z = 0, parent = null) {
  const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true;
  if (parent) parent.add(b); return b;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, parent = null, n = 20) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true;
  if (parent) parent.add(c); return c;
}
// A flat picture (canvas) facing +z.
export function picture(w, h, pw, ph, draw, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.65, ...o }));
  m.receiveShadow = true; return m;
}
export function fontText(g, text, x, y, px, color, { font = '"Luckiest Guy"', align = 'center', stroke = null, lw = 0 } = {}) {
  g.font = `${px}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); }
  g.fillStyle = color; g.fillText(text, x, y);
}
// Wood-plank / tile floor texture.
export function floorTexture(kind, repeat) {
  const t = canvasTexture(512, 512, (g, w) => {
    const r = rng(kind === 'tile' ? 5 : 9);
    if (kind === 'tile') {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        g.fillStyle = (i + j) % 2 ? '#dcd2c0' : '#b9ab94'; g.fillRect(i * 64, j * 64, 64, 64);
      }
      g.strokeStyle = 'rgba(90,80,70,0.35)'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, w); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    } else if (kind === 'lino') {
      g.fillStyle = '#b9b4a6'; g.fillRect(0, 0, w, w);
      for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,90,80' : '240,240,230'},${0.08 + r() * 0.1})`; g.fillRect(r() * w, r() * w, 3, 3); }
      g.strokeStyle = 'rgba(80,80,70,0.25)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.strokeRect(0, 0, i * 128, i * 128); }
    } else {
      for (let row = 0; row < 8; row++) {
        let x = -r() * 200;
        while (x < w) { const len = 140 + r() * 160; g.fillStyle = `hsl(${28 + r() * 8},${38 + r() * 12}%,${44 + r() * 10}%)`; g.fillRect(x, row * 64, len, 64); g.fillStyle = 'rgba(40,25,10,0.35)'; g.fillRect(x, row * 64, 3, 64); x += len; }
        g.fillStyle = 'rgba(40,25,10,0.4)'; g.fillRect(0, row * 64, w, 3);
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); return t;
}
export function wallTexture(base, stripe = null) {
  const t = canvasTexture(256, 256, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    if (stripe) { g.fillStyle = stripe; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, w); }
    const r = rng(3); for (let i = 0; i < 800; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.03})`; g.fillRect(r() * w, r() * w, 4, 4); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// A wall panel with rectangular holes (windows, doors): built from boxes around the holes.
// Lies in the local x-y plane, thickness along z, from x 0..len, y 0..h. holes: [{ x0, x1, y0, y1 }].
export function wallWithHoles(len, h, thick, m, holes = []) {
  const g = new THREE.Group();
  const xs = [...new Set([0, len, ...holes.flatMap((o) => [o.x0, o.x1])])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], mid = (a + b) / 2;
    const hs = holes.filter((o) => o.x0 <= a + 1e-6 && o.x1 >= b - 1e-6).sort((p, q) => p.y0 - q.y0);
    let y = 0;
    for (const o of hs) { if (o.y0 > y) box(b - a, o.y0 - y, thick, m, mid, (y + o.y0) / 2, 0, g); y = o.y1; }
    if (y < h) box(b - a, h - y, thick, m, mid, (y + h) / 2, 0, g);
  }
  return g;
}

// Walls that hide when the camera is outside them (dollhouse): register { obj, point, normal } with the
// normal pointing into the room (world space). Checked on every render through scene.onBeforeRender, so a camera
// anywhere outside a wall sees straight in. Chapters don't need to do anything.
const registries = new WeakMap();
function registry(scene, margin = 0.4) {
  let reg = registries.get(scene);
  if (!reg) {
    reg = { walls: [], fns: [] }; registries.set(scene, reg);
    const prev = scene.onBeforeRender;
    const v = new THREE.Vector3();
    scene.onBeforeRender = function (renderer, sc, camera, rt) {
      for (const w of reg.walls) {
        if (w.forced !== undefined) { w.obj.visible = w.forced; continue; }
        camera.getWorldPosition(v).sub(w.point);
        w.obj.visible = v.dot(w.normal) > -margin;
      }
      for (const f of reg.fns) f(camera);
      if (prev) prev.call(this, renderer, sc, camera, rt);
    };
  }
  return reg;
}
// Walls never block the kit cameras' clearShot (they hide whenever the camera is outside them).
export function autoHideWalls(scene, walls) { for (const w of walls) w.obj.traverse((o) => { o.userData.noCamBlock = true; }); registry(scene).walls.push(...walls); }
// Run fn(camera) right before every render of the scene (after all of update()).
export function onSceneRender(scene, fn) { registry(scene).fns.push(fn); }

// Practicals for K.applyLight / K.setPractical (lighting.js): each entry in set.lights is a proxy light (never added to
// the scene) whose intensity the kit switches (0..1+); the set multiplies its real lights by it right before each
// render, together with its own state (e.g. the fridge light only shines while the door is open). A proxy nobody has
// switched (intensity -1) uses the set's time-of-day default.
// The proxy is a black, zero-range light added to the set group so render.mjs's frame fingerprint sees its level.
// Untouched = intensity -1 and hidden (a hidden light never reaches the shader).
export function proxyLight(parent) { const p = new THREE.PointLight('#000000', -1, 0.01); p.visible = false; p.userData.base = 1; p.userData.proxy = true; if (parent) parent.add(p); return p; }
export function proxyLevel(p, fallback) { return p.intensity < 0 ? fallback : (p.visible === false ? 0 : p.intensity); }

// Marks / cams in world space from set-local numbers.
export function markMaker(offset) {
  return (x, y, z, heading, extra = {}) => ({ pos: V(x + offset.x, y + offset.y, z + offset.z), heading, ...extra });
}
export function camMaker(offset) {
  return (pos, target, fov = 40, extra = {}) => ({ pos: V(pos[0] + offset.x, pos[1] + offset.y, pos[2] + offset.z), target: V(target[0] + offset.x, target[1] + offset.y, target[2] + offset.z), fov, ...extra });
}
// Apply a named cam: c = set.cams[name]; useCam(stage.camera, c).
export function useCam(camera, c) {
  camera.position.copy(c.pos); camera.fov = c.fov; camera.up.set(0, 1, 0); camera.lookAt(c.target); camera.updateProjectionMatrix();
}
// A practical light with a base intensity; set via setPractical(light, level 0..1).
export function practical(light, base) { light.userData.base = base; light.userData.practical = true; light.intensity = base; return light; }
export function setPractical(light, level) { light.intensity = light.userData.base * level; light.visible = level > 0; }
// Sitting (kit-cast seatY): root y = seatTop - 1.5 * actorScale (thighs horizontal on the seat).
export const SIT_ROOT = (seatTop, scale = 1) => seatTop - 1.5 * scale;

// ---------------------------------------------------------------- walking routes (SC1/SC2)
// Obstacles are floor rectangles in set-local coordinates { x0, x1, z0, z1 } already inflated by the walker's half
// size. route(a, b) returns world-space waypoints [a, ..., b] (Vector3, y 0) along straight segments that never cross an
// obstacle: a visibility graph over the rectangle corners, shortest path by Dijkstra. An endpoint inside an obstacle
// (a seat, a mark at a counter) first steps out to the nearest free point on that rectangle's edge.
export function makeRouter(offset, rects, bounds) {
  const EPS = 0.02;
  const inside = (x, z, r, e = 0) => x > r.x0 + e && x < r.x1 - e && z > r.z0 + e && z < r.z1 - e;
  const free = (x, z) => x >= bounds.x0 && x <= bounds.x1 && z >= bounds.z0 && z <= bounds.z1 && !rects.some((r) => inside(x, z, r, -EPS / 2));
  function segHits(ax, az, bx, bz, r) {   // Liang-Barsky against the open rectangle
    let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
    for (const [p, q] of [[-dx, ax - r.x0], [dx, r.x1 - ax], [-dz, az - r.z0], [dz, r.z1 - az]]) {
      if (Math.abs(p) < 1e-9) { if (q <= EPS) return false; continue; }
      const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 1e-4 && inside(ax + dx * (t0 + t1) / 2, az + dz * (t0 + t1) / 2, r, EPS);
  }
  const clear = (a, b) => !rects.some((r) => segHits(a[0], a[1], b[0], b[1], r));
  const corners = [];
  for (const r of rects) for (const [x, z] of [[r.x0 - EPS, r.z0 - EPS], [r.x1 + EPS, r.z0 - EPS], [r.x0 - EPS, r.z1 + EPS], [r.x1 + EPS, r.z1 + EPS]]) if (free(x, z)) corners.push([x, z]);
  function escape(p) {
    const r = rects.find((q) => inside(p[0], p[1], q)); if (!r) return null;
    const c = [[r.x0 - EPS, p[1]], [r.x1 + EPS, p[1]], [p[0], r.z0 - EPS], [p[0], r.z1 + EPS]].filter((q) => free(q[0], q[1]));
    c.sort((u, v) => Math.hypot(u[0] - p[0], u[1] - p[1]) - Math.hypot(v[0] - p[0], v[1] - p[1]));
    return c[0] || null;
  }
  return function route(aW, bW) {
    const A = [aW.x - offset.x, aW.z - offset.z], B = [bW.x - offset.x, bW.z - offset.z];
    const ea = escape(A), eb = escape(B), s = ea || A, g = eb || B;
    const nodes = [s, g, ...corners], n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
    dist[0] = 0;
    for (;;) {
      let u = -1; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || u === 1) break; done[u] = true;
      for (let v = 0; v < n; v++) if (!done[v] && v !== u) {
        const d = dist[u] + Math.hypot(nodes[v][0] - nodes[u][0], nodes[v][1] - nodes[u][1]);
        if (d < dist[v] && clear(nodes[u], nodes[v])) { dist[v] = d; prev[v] = u; }
      }
    }
    const pts = [];
    if (dist[1] === Infinity) pts.push(s, g); else { for (let v = 1; v >= 0; v = prev[v]) { pts.unshift(nodes[v]); if (v === 0) break; } }
    if (ea) pts.unshift(A); if (eb) pts.push(B);
    return pts.map(([x, z]) => new THREE.Vector3(x + offset.x, 0, z + offset.z));
  };
}
// Position along a waypoint list at distance d (studs) from the start: { pos, heading, done }.
export function alongRoute(pts, d) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = a.distanceTo(b);
    if (d <= L || i === pts.length - 2) { const u = L > 0 ? Math.min(1, d / L) : 1; return { pos: a.clone().lerp(b, u), heading: Math.atan2(b.x - a.x, b.z - a.z), done: d >= L && i === pts.length - 2 }; }
    d -= L;
  }
  return { pos: pts[0].clone(), heading: 0, done: true };
}
export const routeLength = (pts) => pts.reduce((s, p, i) => (i ? s + p.distanceTo(pts[i - 1]) : 0), 0);
