// Max, Mia and Leo for three.js: a direct port of scripts/characters.py (same sizes, colours, pivots,
// expressions and action_pose clips), so web shorts and Blender shorts share one cast.
// Blender is Z-up facing -Y; here Y is up and characters face +Z. B(x, y, z) -> (x, z, -y).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const EXPRESSIONS = ['happy', 'neutral', 'surprised', 'angry', 'sad', 'laugh'];
export const PALETTES = {
  Max: { skin: 'F0B774', top: '15B7B1', dark: '123D54', hair: '342724', accent: 'F6B93B' },
  Mia: { skin: 'BA7B51', top: 'A56DFF', dark: '2D2452', hair: '241C25', accent: 'FFCA57' },
  Leo: { skin: 'F2C89A', top: 'FF7653', dark: '273A5D', hair: 'BD7032', accent: 'FFE05F' },
};
const B = (x, y, z) => new THREE.Vector3(x, z, -y);
const D2R = Math.PI / 180;

const matCache = new Map();
export function mat(hex, roughness = 0.6, extra = {}) {
  const key = hex + roughness + JSON.stringify(extra);
  if (!matCache.has(key)) {
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#' + hex), roughness, ...extra });
    matCache.set(key, m);
  }
  return matCache.get(key);
}
const cloth = (hex) => mat(hex, 0.8);

function shade(mesh) { mesh.castShadow = mesh.receiveShadow = true; return mesh; }

// Rounded cylinder (Blender cylinder + bevel), smooth sides, flat caps.
export function roundedCylinder(r, h, bevel, radial = 64) {
  const pts = [], n = 6;
  pts.push(new THREE.Vector2(0, -h / 2));
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(r - bevel + Math.cos(a) * bevel, -h / 2 + bevel + Math.sin(a) * bevel)); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(r - bevel + Math.cos(a) * bevel, h / 2 - bevel + Math.sin(a) * bevel)); }
  pts.push(new THREE.Vector2(0, h / 2));
  return new THREE.LatheGeometry(pts, radial);
}

export function roundedBox(w, h, d, r) {
  return new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
}

// Pivot rest positions (Blender bone heads) and each bone's rest frame relative to world.
const PIVOTS = {
  Torso: B(0, 0, 2.04), Head: B(0, 0, 4.03),
  'Arm.L': B(1.02, 0, 3.65), 'Arm.R': B(-1.02, 0, 3.65),
  'Leg.L': B(0.51, 0, 2.04), 'Leg.R': B(-0.51, 0, 2.04),
};
const PARENT = { Torso: 'Root', Head: 'Torso', 'Arm.L': 'Torso', 'Arm.R': 'Torso', 'Leg.L': 'Root', 'Leg.R': 'Root' };
const LIMB_FRAME = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); // local Y down, Z back
const LIMB_INV = LIMB_FRAME.clone().invert();

export function makeCharacter(name, palette) {
  const p = palette || PALETTES[name];
  const root = new THREE.Group(); root.name = name;
  const bones = { Root: new THREE.Group() };
  root.add(bones.Root);
  for (const k of Object.keys(PIVOTS)) {
    const g = new THREE.Group(); g.name = k; bones[k] = g;
    const parentRest = PARENT[k] === 'Root' ? new THREE.Vector3() : PIVOTS[PARENT[k]];
    g.position.copy(PIVOTS[k]).sub(parentRest);
    bones[PARENT[k]].add(g);
  }
  const restOf = (bone) => bone === 'Root' ? new THREE.Vector3() : PIVOTS[bone];
  const place = (mesh, bone, worldPos) => { mesh.position.copy(worldPos).sub(restOf(bone)); bones[bone].add(shade(mesh)); return mesh; };
  const box = (pos, size, material, bone, bevel = 0.035) =>
    place(new THREE.Mesh(roundedBox(size[0], size[2], size[1], bevel), material), bone, B(...pos));

  const skin = mat(p.skin, 0.62);
  const top = cloth(p.top), dark = cloth(p.dark), hair = mat(p.hair, 0.55);
  const accent = mat(p.accent, 0.35, { metalness: 0.2 }), ink = mat('172335', 0.5);
  const white = mat('FFF8E9', 0.6), shoe = mat('F4F1EA', 0.45, { clearcoat: 0.3 }), pink = mat('D35770', 0.6);

  box([0, 0, 3.04], [2.02, 1.06, 1.98], top, 'Torso', 0.055);
  box([0, 0, 2.13], [2.04, 1.075, 0.16], dark, 'Torso', 0.025);
  box([0, -0.551, 2.65], [0.86, 0.08, 0.38], top, 'Torso', 0.04);
  box([0, -0.598, 2.72], [0.56, 0.012, 0.023], dark, 'Torso', 0.005);
  for (const x of [-0.23, 0.23]) {
    box([x, -0.555, 3.67], [0.033, 0.035, 0.42], white, 'Torso', 0.01);
    box([x, -0.578, 3.46], [0.055, 0.045, 0.09], accent, 'Torso', 0.01);
  }
  box([0.65, -0.559, 3.48], [0.26, 0.055, 0.24], accent, 'Torso', 0.018).rotation.z = -8 * D2R;
  place(new THREE.Mesh(roundedCylinder(0.32, 0.24, 0.04, 32), skin), 'Head', B(0, 0, 4.07));
  place(new THREE.Mesh(roundedCylinder(0.715, 1.17, 0.09, 64), skin), 'Head', B(0, 0, 4.73));
  for (const [sign, side] of [[1, 'L'], [-1, 'R']]) {
    let x = sign * 1.53;
    box([x, 0, 3.26], [0.94, 1.02, 1.45], top, 'Arm.' + side, 0.045);
    box([x, 0, 2.57], [0.965, 1.04, 0.18], dark, 'Arm.' + side, 0.025);
    box([x, 0, 2.31], [0.9, 0.96, 0.5], skin, 'Arm.' + side, 0.055);
    x = sign * 0.51;
    box([x, 0, 1.2], [0.96, 1.04, 1.64], dark, 'Leg.' + side, 0.035);
    box([x, -0.1, 0.3], [0.98, 1.27, 0.49], shoe, 'Leg.' + side, 0.065);
    box([x, -0.1, 0.095], [1.0, 1.29, 0.12], dark, 'Leg.' + side, 0.028);
    box([x, -0.744, 0.32], [0.74, 0.028, 0.1], mat(p.top, 0.5), 'Leg.' + side, 0.012);
    for (const yy of [-0.45, -0.26]) box([x, yy, 0.553], [0.49, 0.043, 0.023], white, 'Leg.' + side, 0.005);
  }
  // Angular hair keeps the block-game silhouette.
  place(new THREE.Mesh(roundedCylinder(0.737, 0.24, 0.045, 16), hair), 'Head', B(0, 0.02, 5.29));
  [[-0.48, 5.16, -12], [-0.15, 5.24, -18], [0.2, 5.3, -22], [0.48, 5.3, -15]].forEach(([x, z, tilt]) => {
    box([x, -0.43, z], [0.4, 0.53, 0.36], hair, 'Head', 0.035).rotation.z = -tilt * D2R;
  });
  for (const s of [-1, 1]) box([s * 0.635, 0.09, 5.0], [0.17, 0.6, 0.42], hair, 'Head', 0.055);

  // Faces: ink strokes and ovals sitting on the head cylinder, one group per expression.
  const faceY = (x, off = 0.02) => -Math.sqrt(Math.max(0.01, 0.715 ** 2 - x * x)) - off;
  const faces = {};
  for (const e of EXPRESSIONS) { faces[e] = new THREE.Group(); faces[e].name = 'face_' + e; bones.Head.add(faces[e]); }
  const stroke = (e, xz, r = 0.027, m = ink) => {
    const pts = xz.map(([x, z]) => B(x, faceY(x, 0.025), z).sub(PIVOTS.Head));
    const curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts) : new THREE.LineCurve3(pts[0], pts[1]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 3), r, 10, false), m);
    faces[e].add(tube);
    for (const end of [pts[0], pts[pts.length - 1]]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); cap.position.copy(end); faces[e].add(cap); }
  };
  const oval = (e, x, z, w, h, m = ink) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), m);
    o.scale.set(w, h, 0.025); o.position.copy(B(x, faceY(x, 0.025), z).sub(PIVOTS.Head));
    o.rotation.y = Math.asin(x / 0.715); faces[e].add(o); return o;
  };
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  for (const e of EXPRESSIONS) {
    for (const x of [-0.24, 0.24]) {
      if (e === 'laugh') stroke(e, range(11, (i) => [x - 0.085 + i * 0.017, 4.8 + 0.06 * Math.sin((i * Math.PI) / 10)]));
      else oval(e, x, 4.81, 0.051, e === 'surprised' ? 0.12 : 0.092);
    }
    if (e === 'happy') stroke(e, range(21, (i) => [-0.23 + i * 0.023, 4.56 - 0.13 * Math.sin((i * Math.PI) / 20)]), 0.026);
    else if (e === 'neutral') stroke(e, [[-0.13, 4.48], [0.13, 4.48]], 0.024);
    else if (e === 'surprised') {
      oval(e, 0, 4.48, 0.085, 0.13);
      for (const x of [-0.24, 0.24]) stroke(e, [[x - 0.08, 5.015], [x + 0.08, 5.015]], 0.02);
    } else if (e === 'angry') {
      stroke(e, [[-0.17, 4.46], [0, 4.49], [0.17, 4.46]]);
      stroke(e, [[-0.35, 5.025], [-0.14, 4.94]], 0.03); stroke(e, [[0.14, 4.94], [0.35, 5.025]], 0.03);
    } else if (e === 'sad') {
      stroke(e, range(21, (i) => [-0.17 + i * 0.017, 4.4 + 0.09 * Math.sin((i * Math.PI) / 20)]));
      stroke(e, [[-0.35, 4.96], [-0.14, 5.04]], 0.023); stroke(e, [[0.14, 5.04], [0.35, 4.96]], 0.023);
    } else {
      oval(e, 0, 4.47, 0.22, 0.17);
      const t = oval(e, 0, 4.39, 0.13, 0.048, pink); t.position.z += 0.025;
    }
  }
  const actor = { name, root, bones, faces, palette: p, expression: 'happy' };
  setExpression(actor, 'happy');
  return actor;
}

export function setExpression(actor, e) {
  if (!EXPRESSIONS.includes(e)) throw new Error('Unknown expression ' + e);
  for (const k of EXPRESSIONS) actor.faces[k].visible = k === e;
  actor.expression = e;
}

// Blender XYZ Euler (degrees, bone-local) -> three quaternion on the pivot.
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
function boneQuat(bone, [x, y, z]) {
  _e.set(x * D2R, y * D2R, z * D2R, 'ZYX');
  _q.setFromEuler(_e);
  if (bone.startsWith('Arm') || bone.startsWith('Leg')) return LIMB_FRAME.clone().multiply(_q).multiply(LIMB_INV);
  return _q.clone();
}

// Same meaning as characters.pose(): clears the previous pose; root is a Blender-space offset.
export function pose(actor, angles = {}, root = [0, 0, 0]) {
  for (const k of Object.keys(PIVOTS)) actor.bones[k].quaternion.identity();
  actor.bones.Root.position.copy(B(...root));
  for (const [k, v] of Object.entries(angles)) if (actor.bones[k]) actor.bones[k].quaternion.copy(boneQuat(k, v));
}

// Blend two angle dictionaries (degrees). Missing bones count as rest.
export function mixPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const u = a[k] || [0, 0, 0], v = b[k] || [0, 0, 0];
    out[k] = u.map((x, i) => x + (v[i] - x) * t);
  }
  return out;
}

// Port of characters.action_pose: phase 0..1, degrees.
export function actionPose(kind, phase) {
  const cyc = Math.sin(phase * 2 * Math.PI);
  if (kind === 'Walk' || kind === 'Run') {
    const s = kind === 'Walk' ? 25 : 43;
    return { 'Leg.L': [s * cyc, 0, 0], 'Leg.R': [-s * cyc, 0, 0], 'Arm.L': [-s * 0.7 * cyc, 0, -3], 'Arm.R': [s * 0.7 * cyc, 0, 3], Torso: [0, 0, 3 * cyc], Head: [0, 0, -2 * cyc] };
  }
  if (kind === 'Wave') return { 'Arm.R': [-8, 0, 125 + 10 * cyc], 'Arm.L': [0, 0, -6], Head: [0, -5, 6] };
  if (kind === 'Talk') return { 'Arm.L': [-20 + 10 * cyc, 0, -18], 'Arm.R': [-12 - 8 * cyc, 0, 12], Head: [3 * cyc, 0, 0] };
  if (kind === 'Point') return { 'Arm.R': [-88, 0, 12], 'Arm.L': [0, 0, -5], Head: [0, 0, -8] };
  if (kind === 'Shock') return { 'Arm.R': [-18, 0, 45], 'Arm.L': [-18, 0, -45], Head: [-9, 0, 0], Torso: [-5, 0, 0] };
  if (kind === 'Laugh') return { Torso: [8 + 3 * cyc, 0, 0], Head: [-10 + 3 * cyc, 0, 0], 'Arm.L': [-18, 0, -10], 'Arm.R': [-18, 0, 10] };
  return { Head: [0, 0, 1.5 * cyc], 'Arm.L': [0, 0, -3], 'Arm.R': [0, 0, 3] };
}

// Lowest shoe-sole point in world space, for grounding like characters.ground_actor.
export function soleHeight(actor) {
  actor.root.updateMatrixWorld(true);
  let min = Infinity; const v = new THREE.Vector3();
  for (const side of ['Leg.L', 'Leg.R']) {
    const leg = actor.bones[side];
    for (const [x, z] of [[-0.5, 0.745], [0.5, 0.745], [-0.5, -0.545], [0.5, -0.545]]) {
      v.set(x, -2.04 + 0.035, z).applyMatrix4(leg.matrixWorld); min = Math.min(min, v.y);
    }
  }
  return min;
}
