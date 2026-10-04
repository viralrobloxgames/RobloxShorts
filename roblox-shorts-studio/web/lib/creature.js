// Rigged creatures from the pack (creatures/<name>/: one OBJ object per rigid body + rig.json). Each body is posed
// about its joint the Roblox way: delta = parentDelta * pivot * Transform * pivot^-1 (pivot = the joint's rest frame in
// model space). loadPackOBJ turns geometry by PI about Y so items face +Z; the deltas are conjugated by the same turn.
import * as THREE from 'three';
import { packItem, PACK } from './robloxPack.js';

const cfm = (c) => new THREE.Matrix4().set(c[3], c[4], c[5], c[0], c[6], c[7], c[8], c[1], c[9], c[10], c[11], c[2], 0, 0, 0, 1);
const RY = new THREE.Matrix4().makeRotationY(Math.PI), RYi = RY.clone().invert();
const I = new THREE.Matrix4();

export async function loadCreature(name, kind = 'creatures') {
  const obj = await packItem(kind, name);
  const rig = await fetch(`${PACK}${kind}/${name}/rig.json`).then((r) => r.json());
  const root = new THREE.Group(); root.name = name; root.add(obj);
  const meshes = {};
  obj.traverse((o) => { if (o.isMesh) { (meshes[o.name.replace(/_decal\d+$/, '')] ||= []).push(o); o.matrixAutoUpdate = false; } });   // decals ride their body
  const bodies = {};
  for (const b of rig.bodies) { const P = cfm(b.pivot); bodies[b.name] = { name: b.name, parent: b.parent, P, Pi: P.clone().invert(), meshes: meshes[b.name] || [], D: new THREE.Matrix4() }; }
  const order = [], seen = new Set();
  const visit = (n) => { if (seen.has(n)) return; const b = bodies[n]; if (b.parent) visit(b.parent); seen.add(n); order.push(n); };
  Object.keys(bodies).forEach(visit);
  const c = { name, root, obj, rig, bodies, order, gait: rig.gait, size: rig.size };
  poseCreature(c, {});
  return c;
}

// pose: { bodyName: [rx, ry, rz] | { r: [rx, ry, rz], p: [x, y, z] } }  (radians, in the joint's own frame; p in studs)
const E = new THREE.Euler(), T = new THREE.Matrix4(), Tp = new THREE.Matrix4();
export function poseCreature(c, pose) {
  for (const n of c.order) {
    const b = c.bodies[n], parent = b.parent ? c.bodies[b.parent].D : I, v = pose[n];
    const r = Array.isArray(v) ? v : v?.r, p = Array.isArray(v) ? null : v?.p;
    if (r || p) {
      T.makeRotationFromEuler(E.set(...(r || [0, 0, 0]), 'XYZ'));
      if (p) T.premultiply(Tp.makeTranslation(...p));
      b.D.copy(parent).multiply(b.P).multiply(T).multiply(b.Pi);
    } else b.D.copy(parent);
    for (const m of b.meshes) { m.matrix.copy(RY).multiply(b.D).multiply(RYi); m.matrixWorldNeedsUpdate = true; }
  }
}
// Lowest world-space point of the given bodies (e.g. the feet), for grounding.
const box = new THREE.Box3();
export function creatureLowest(c, names) {
  c.root.updateMatrixWorld(true); let min = Infinity;
  for (const n of names) for (const m of c.bodies[n].meshes) { box.setFromObject(m, false); min = Math.min(min, box.min.y); }
  return min;
}
// World position of a point given in a body's original model space (e.g. an attachment or a joint pivot).
export function creaturePoint(c, body, x, y, z) {
  const v = new THREE.Vector3(x, y, z).applyMatrix4(c.bodies[body].D).applyMatrix4(RY);
  return v.applyMatrix4(c.root.matrixWorld);
}
