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
        g.fillStyle = (i + j) % 2 ? '#e9e1d2' : '#cfc3ae'; g.fillRect(i * 64, j * 64, 64, 64);
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
  g.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return g;
}

// Walls that hide when the camera is outside them (dollhouse): register { obj, point, normal } with the
// normal pointing into the room (world space). Checked on every render through scene.onBeforeRender, so a camera
// anywhere outside a wall sees straight in. Chapters don't need to do anything.
const registries = new WeakMap();
export function autoHideWalls(scene, walls, margin = 0.4) {
  let list = registries.get(scene);
  if (!list) {
    list = []; registries.set(scene, list);
    const prev = scene.onBeforeRender;
    const v = new THREE.Vector3();
    scene.onBeforeRender = function (renderer, sc, camera, rt) {
      for (const w of list) {
        if (w.forced !== undefined) { w.obj.visible = w.forced; continue; }
        v.copy(camera.getWorldPosition(v)).sub(w.point);
        w.obj.visible = v.dot(w.normal) > -margin;
      }
      if (prev) prev.call(this, renderer, sc, camera, rt);
    };
  }
  list.push(...walls);
}

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
// Sitting: hip at the seat top, so the actor's root y = seatTop - 2 * actorScale (R6 hip pivot is 2 studs up).
export const SIT_ROOT = (seatTop, scale = 1) => seatTop - 2 * scale;
