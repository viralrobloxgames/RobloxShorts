// Clipping detector, page side (loaded by web/clip_check.mjs into runner.html). For each frame: pose the scene exactly as
// for a render (clip.update, matrices, the scene's before-render hooks) without drawing, then test every visible pack
// actor's body parts against the visible scene meshes and against the other actors.
//
// A body part (Head, Torso, arms, legs) is its mesh's bounding box in the bone's frame, shrunk by MARGIN on every side
// (so feet resting on a floor, hips on a seat or a back on a mattress are not counted), sampled on a small grid. A sample
// point inside an obstacle counts; its depth is the distance to the obstacle's nearest face. Obstacles: boxes and
// cylinders exactly (in their local frame), other closed shapes by their local bounding box. Not obstacles: anything
// under an actor (hair, held props), thin flat things (planes, decals, rugs, sheets), see-through / additive / light
// shafts / particles, invisible things.
import * as THREE from 'three';
import { packActors } from './robloxPack.js';

const PARTS = { Head: 'Head', Torso: 'Torso', 'Left Arm': 'Arm.L', 'Right Arm': 'Arm.R', 'Left Leg': 'Leg.L', 'Right Leg': 'Leg.R' };
const MARGIN = 0.14;
const REST = 0.45;          // studs a part may sink into the top of what it rests on (seat, desk, mattress)          // studs (x actor scale) shaved off each side of a body part before sampling
const GRID = [3, 7, 3];       // sample points per part along its local x, y, z
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _b = new THREE.Box3();

const isSolidHit = (o) => { const m = Array.isArray(o.material) ? o.material[0] : o.material; return !(m && (m.transparent && m.opacity < 0.5)); };
const visibleChain = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };
const label = (o) => { const n = []; for (let x = o; x && n.length < 4; x = x.parent) if (x.name) n.push(x.name); return n.join('<') || o.geometry?.type || 'mesh'; };

function actorName(a) {
  return a.key || { Skye: 'skye', Max: 'max', Leo: 'dad', Mia: 'lily' }[a.name] || a.name;
}

// Sample points (world) of every visible body part of every visible actor in the scene.
function bodyParts(scene) {
  const out = [];
  for (const a of packActors) {
    if (!a.root.parent || !visibleChain(a.root)) continue;
    let p = a.root; while (p.parent) p = p.parent; if (p !== scene) continue;
    for (const mesh of a.root.getObjectsByProperty('isMesh', true)) {
      const part = PARTS[mesh.name]; if (!part || !mesh.visible) continue;
      const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox, m = MARGIN * (a.scale || 1), pts = [];
      const lo = bb.min.clone().addScalar(m), hi = bb.max.clone().addScalar(-m);
      for (let i = 0; i < GRID[0]; i++) for (let j = 0; j < GRID[1]; j++) for (let k = 0; k < GRID[2]; k++) {
        const f = (n, c) => (GRID[n] === 1 ? 0.5 : c / (GRID[n] - 1));
        pts.push(new THREE.Vector3(lo.x + (hi.x - lo.x) * f(0, i), lo.y + (hi.y - lo.y) * f(1, j), lo.z + (hi.z - lo.z) * f(2, k)).applyMatrix4(mesh.matrixWorld));
      }
      const box = new THREE.Box3().setFromPoints(pts);
      const boxFull = bb.clone().applyMatrix4(mesh.matrixWorld);
      out.push({ actor: actorName(a), a, part, mesh, pts, box, boxFull, inv: mesh.matrixWorld.clone().invert(), lb: bb, m, ob: obb(bb, mesh.matrixWorld, m), obFull: obb(bb, mesh.matrixWorld, 0) });
    }
  }
  return out;
}

// Obstacles: visible solid meshes not under an actor, with a local inside test.
function obstacles(scene, actorRoots) {
  const out = [];
  scene.traverseVisible((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    for (let x = o; x; x = x.parent) if (actorRoots.has(x)) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!mat || mat.blending === THREE.AdditiveBlending || mat.depthWrite === false || (mat.transparent && mat.opacity < 0.5) || mat.visible === false) return;
    if (o.userData.noClipCheck) return;
    const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox();
    const s = new THREE.Vector3(); g.boundingBox.getSize(s);
    const ws = new THREE.Vector3(); o.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), ws);
    const dims = [s.x * Math.abs(ws.x), s.y * Math.abs(ws.y), s.z * Math.abs(ws.z)].sort((p, q) => p - q);
    if (dims[0] < 0.03) return;                                   // flat things: planes, decals, posters
    const t = g.type;
    if (['PlaneGeometry', 'CircleGeometry', 'RingGeometry', 'ShapeGeometry'].includes(t)) return;
    if (o === scene.getObjectByName?.('__sky__')) return;
    if (dims[2] > 400) return;                                     // the sky dome / ground disc
    const kind = t === 'CylinderGeometry' ? 'cyl' : t === 'SphereGeometry' || t === 'IcosahedronGeometry' ? 'sph' : 'box';
    if (o.isInstancedMesh) {
      const im = new THREE.Matrix4();
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, im); const mw = o.matrixWorld.clone().multiply(im); out.push(mk(o, g, mw, kind, i)); }
    } else out.push(mk(o, g, o.matrixWorld, kind));
  });
  return out;
}
// Unnamed meshes are described by shape, size and where they sit in their set: "box 3.0x0.2x2.0 @set_classroom(4.5,2.6,-3.0)".
function mk(o, g, mw, kind, idx) {
  const box = g.boundingBox.clone().applyMatrix4(mw);
  let set = null; for (let x = o; x; x = x.parent) if (/^set_/.test(x.name)) { set = x; break; }
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  if (set) c.sub(set.getWorldPosition(new THREE.Vector3()));
  const own = o.name || (o.parent && o.parent.name && !/^set_/.test(o.parent.name) ? o.parent.name : '');
  const f = (v) => v.toFixed(1);
  const name = `${own ? own + ' ' : ''}${kind} ${f(sz.x)}x${f(sz.y)}x${f(sz.z)} @${set ? set.name : 'world'}(${f(c.x)},${f(c.y)},${f(c.z)})` + (idx !== undefined ? '#' + idx : '');
  return { o, g, mw, inv: mw.clone().invert(), kind, box, name, lb: g.boundingBox, ob: obb(g.boundingBox, mw, kind === 'box' ? 0 : 0.08) };
}

// Depth (studs, local units scaled roughly to world) of world point p inside obstacle ob, or 0.
function depthIn(ob, p) {
  const l = _v.copy(p).applyMatrix4(ob.inv), b = ob.lb;
  if (l.x <= b.min.x || l.x >= b.max.x || l.y <= b.min.y || l.y >= b.max.y || l.z <= b.min.z || l.z >= b.max.z) return 0;
  const sx = ob.mw.elements, scl = Math.cbrt(Math.abs(new THREE.Matrix3().setFromMatrix4(ob.mw).determinant())) || 1;
  if (ob.kind === 'cyl') {
    const pr = ob.g.parameters || {}, r = Math.max(pr.radiusTop ?? 1, pr.radiusBottom ?? 1), cy = (b.min.y + b.max.y) / 2;
    const d = Math.hypot(l.x - (b.min.x + b.max.x) / 2, l.z - (b.min.z + b.max.z) / 2);
    if (d >= r) return 0;
    return Math.min(r - d, l.y - b.min.y, b.max.y - l.y) * scl;
  }
  if (ob.kind === 'sph') {
    const c = new THREE.Vector3(); b.getCenter(c); const r = (b.max.x - b.min.x) / 2, d = l.distanceTo(c);
    return d < r ? (r - d) * scl : 0;
  }
  return Math.min(l.x - b.min.x, b.max.x - l.x, l.y - b.min.y, b.max.y - l.y, l.z - b.min.z, b.max.z - l.z) * scl;
}

// Oriented box from a local bounding box (shrunk by m on every side) and a world matrix.
function obb(lb, mw, m = 0) {
  const e = mw.elements, ax = [], half = [];
  const c = lb.getCenter(new THREE.Vector3()).applyMatrix4(mw), hs = lb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  [[e[0], e[1], e[2], hs.x], [e[4], e[5], e[6], hs.y], [e[8], e[9], e[10], hs.z]].forEach(([x, y, z, h]) => {
    const v = new THREE.Vector3(x, y, z), l = v.length() || 1; ax.push(v.divideScalar(l)); half.push(Math.max(0, h * l - m));
  });
  return { c, ax, half };
}
// Separating-axis test: penetration depth (smallest overlap over the 15 axes), 0 when the boxes don't overlap.
const _L = new THREE.Vector3(), _d = new THREE.Vector3();
function satDepth(A, B) {
  _d.subVectors(B.c, A.c); let best = Infinity;
  const test = (L) => {
    const n = L.length(); if (n < 1e-6) return true; L.divideScalar(n);
    let ra = 0, rb = 0; for (let i = 0; i < 3; i++) { ra += A.half[i] * Math.abs(A.ax[i].dot(L)); rb += B.half[i] * Math.abs(B.ax[i].dot(L)); }
    const o = ra + rb - Math.abs(_d.dot(L)); if (o <= 0) return false; if (o < best) best = o; return true;
  };
  for (let i = 0; i < 3; i++) { if (!test(_L.copy(A.ax[i]))) return 0; if (!test(_L.copy(B.ax[i]))) return 0; }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!test(_L.crossVectors(A.ax[i], B.ax[j]))) return 0;
  return best === Infinity ? 0 : best;
}

// One frame: [{ actor, part, object, depth, onscreen }]
export function checkFrame(frame, { minDepth = 0.06 } = {}) {
  const clip = window.clipModule, stage = window.clipStage, meta = window.clipMeta;
  const t = (frame - 1) / meta.fps;
  clip.update(t, stage);
  stage.scene.updateMatrixWorld(true); stage.camera.updateMatrixWorld(true);
  stage.scene.onBeforeRender(stage.renderer, stage.scene, stage.camera, null);
  const cam = stage.camera, frustum = new THREE.Frustum().setFromProjectionMatrix(_m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const parts = bodyParts(stage.scene);
  const roots = new Set(packActors.map((a) => a.root));
  const obs = obstacles(stage.scene, roots);
  const hits = new Map();
  const add = (bp, object, depth, cover, onscreen) => {
    const k = bp.actor + '|' + bp.part + '|' + object, h = hits.get(k);
    if (!h || depth > h.depth) hits.set(k, { actor: bp.actor, part: bp.part, object, depth, cover, onscreen: onscreen || h?.onscreen });
  };
  // visible: some overlapping sample point is in the frame and the camera can see it (no scenery in between)
  const occluders = obs.map((x) => x.o), camPos = cam.getWorldPosition(new THREE.Vector3()), ray = new THREE.Raycaster();
  const seen = (p, skip) => {
    if (!frustum.containsPoint(p)) return false;
    const dir = p.clone().sub(camPos), len = dir.length(); ray.set(camPos, dir.divideScalar(len)); ray.far = len - 0.35;
    return !ray.intersectObjects(occluders, false).some((h) => h.object !== skip && isSolidHit(h.object));
  };
  const coverOf = (bp, inside, skip) => {
    let n = 0, on = false, tried = 0;
    for (const p of bp.pts) if (inside(p)) { n++; if (!on && tried < 4) { tried++; on = seen(p, skip); } }
    if (!n) { const c = bp.box.getCenter(new THREE.Vector3()); on = seen(c, skip); }   // thin overlap between samples
    return [Math.round((100 * n) / bp.pts.length), on];
  };
  for (const bp of parts) {
    const partOn = frustum.intersectsBox(bp.box);
    for (const ob of obs) {
      if (!ob.box.intersectsBox(bp.box)) continue;
      const d = satDepth(bp.ob, ob.ob); if (d <= minDepth) continue;
      // resting contact: a part whose middle is above the object's top and that sinks less than REST into it (thighs on
      // a seat, a hand on a desk, a back on a mattress, feet on a step)
      const top = ob.box.max.y, sink = top - bp.boxFull.min.y, mid = (bp.boxFull.min.y + bp.boxFull.max.y) / 2;
      if (mid > top && sink < REST) continue;
      const [cover, on] = coverOf(bp, (p) => depthIn(ob, p) > 0, ob.o);
      add(bp, ob.name, d, cover, on);
    }
    // other actors: this part (shrunk) against the other actor's parts (full size)
    for (const other of parts) {
      if (other.a === bp.a || !other.box.intersectsBox(bp.box)) continue;
      const d = satDepth(bp.ob, other.obFull); if (d <= minDepth) continue;
      const ob = { inv: other.inv, lb: other.lb, mw: other.mesh.matrixWorld, kind: 'box' };
      const [cover, on] = coverOf(bp, (p) => depthIn(ob, p) > 0, null);
      add(bp, other.actor + '.' + other.part, d, cover, on);
    }
  }
  return [...hits.values()].map((h) => ({ actor: h.actor, part: h.part, object: h.object, onscreen: h.onscreen, depth: Math.round(h.depth * 100) / 100, cover: h.cover }));
}
