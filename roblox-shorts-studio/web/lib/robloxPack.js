// Roblox R6 asset pack (assets/roblox_pack/) for the web renderer.
// Characters come back with the same shape as rig.js makeCharacter() - root, bones {Root, Torso, Head, Arm.L/R, Leg.L/R},
// facing +Z - so pose(), actionPose(), setExpression() and soleHeight() from rig.js drive them unchanged.
// The pack is Roblox-native (studs, faces -Z); every mesh is turned by pi about Y on load.
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export const PACK = '../assets/roblox_pack/';

// Joint pivots in character space after the turn (+Z forward, character's left at +X). R6 joints:
// neck (0,4,0), shoulders (+-1,3.5,0); hips at the leg centres (+-0.5,2,0) so leg swings match the old rig.
const PIVOTS = { Torso: [0, 2, 0], Head: [0, 4, 0], 'Arm.L': [1, 3.5, 0], 'Arm.R': [-1, 3.5, 0], 'Leg.L': [0.5, 2, 0], 'Leg.R': [-0.5, 2, 0] };
const PARENT = { Torso: 'Root', Head: 'Torso', 'Arm.L': 'Torso', 'Arm.R': 'Torso', 'Leg.L': 'Root', 'Leg.R': 'Root' };
const PART_BONE = { Head: 'Head', Face: 'Head', Hair: 'Head', Torso: 'Torso', 'Left Arm': 'Arm.L', 'Right Arm': 'Arm.R', 'Left Leg': 'Leg.L', 'Right Leg': 'Leg.R' };
const HAT_ATTACHMENT = 5.1;          // HatAttachment / HairAttachment height (head centre 4.5 + 0.6)

const textures = new Map();
function loaded(tex) {
  return new Promise((resolve) => { const check = () => (tex.image && tex.image.width ? resolve(tex) : setTimeout(check, 15)); check(); });
}
export async function packTexture(path) {
  if (!textures.has(path)) {
    const t = new THREE.TextureLoader().load(PACK + path);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    textures.set(path, t);
  }
  return loaded(textures.get(path));
}

// MTLLoader gives Phong materials; swap to standard PBR so pack items sit in the same light as the rest of the stage.
function toStandard(m) {
  const neon = m.emissive && m.emissive.getHex() !== 0;
  for (const t of [m.map, m.emissiveMap]) if (t) t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.MeshStandardMaterial({
    name: m.name, color: m.color, map: m.map || null, normalMap: m.normalMap || m.bumpMap || null,
    roughness: neon ? 0.35 : 0.58, metalness: 0,
    emissive: neon ? m.emissive : new THREE.Color(0), emissiveIntensity: neon ? 1.6 : 0,
    transparent: m.transparent, opacity: m.transparent ? 1 : m.opacity, alphaTest: m.transparent ? 0.02 : 0,
  });
  return s;
}

export async function loadPackOBJ(path) {
  const dir = path.slice(0, path.lastIndexOf('/') + 1), file = path.slice(dir.length);
  const mtl = await new MTLLoader().setPath(PACK + dir).loadAsync(file.replace(/\.obj$/, '.mtl'));
  mtl.preload();
  await Promise.all(Object.values(mtl.materials).flatMap((m) => [m.map, m.normalMap, m.bumpMap].filter(Boolean).map(loaded)));
  const obj = await new OBJLoader().setMaterials(mtl).setPath(PACK + dir).loadAsync(file);
  const cache = new Map();
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const conv = (m) => { if (!cache.has(m)) cache.set(m, toStandard(m)); return cache.get(m); };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    o.geometry.rotateY(Math.PI);
    o.castShadow = o.receiveShadow = true;
    if (o.material.transparent) { o.castShadow = false; o.renderOrder = 1; }
  });
  return obj;
}

// Pack item (accessory, prop, map piece) as a group, pivot at the origin, facing +Z.
export async function packItem(kind, name) {
  const g = await loadPackOBJ(`${kind}/${name}/${name}.obj`);
  g.name = name; return g;
}

// Every pack character a clip loads, with its options and what it wears; web/fit_check.mjs reads this.
export const packActors = [];

// Characters with their own face style (same expressions and eye positions, restyled): faces/<style>/<name>.png.
// Skye (ViralRoblox News presenter) has lashes, eye sparkle, blush and berry lips (tools/make_glam_faces.py).
export const FACE_STYLE = { Skye: 'glam', Unlisted: 'unlisted', UnlistedForest: 'unlisted' };

// A pack character driven by rig.js. `expressions` are preloaded face textures (faces/<name>.png).
// `hairLift` raises the Hair mesh (studs) when a fringe hides the eyes in close-ups.
export async function loadRobloxCharacter(name, { expressions = ['happy'], scale = 1, hairLift = 0 } = {}) {
  const obj = await loadPackOBJ(`characters/${name}/${name}.obj`);
  const root = new THREE.Group(); root.name = name;
  const bones = { Root: new THREE.Group() };
  root.add(bones.Root);
  const piv = (k) => new THREE.Vector3(...PIVOTS[k]).multiplyScalar(scale);
  for (const k of Object.keys(PIVOTS)) {
    const g = new THREE.Group(); g.name = k; bones[k] = g;
    g.position.copy(piv(k)).sub(PARENT[k] === 'Root' ? new THREE.Vector3() : piv(PARENT[k]));
  }
  for (const k of Object.keys(PIVOTS)) bones[PARENT[k]].add(bones[k]);
  let face = null;
  for (const mesh of [...obj.children]) {
    const bone = PART_BONE[mesh.name];
    if (!bone) continue;
    mesh.geometry.scale(scale, scale, scale);
    mesh.position.copy(piv(bone)).negate();
    bones[bone].add(mesh);
    if (mesh.name === 'Hair') mesh.position.y += hairLift * scale;
    if (mesh.name === 'Face') { face = mesh; mesh.material = mesh.material.clone(); mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; }
  }
  const faceTex = {};
  const faceDir = FACE_STYLE[name] ? `faces/${FACE_STYLE[name]}` : 'faces';
  await Promise.all(expressions.map(async (e) => { faceTex[e] = await packTexture(`${faceDir}/${e}.png`); }));
  const actor = {
    name, root, bones, face, faceTex, expression: null, pack: true, scale,
    options: { expressions, scale, hairLift }, worn: [],
    setFace(e) {
      const t = faceTex[e];
      if (!t) throw new Error(`Face "${e}" was not preloaded for ${name}`);
      face.material.map = t; actor.expression = e;     // set on whatever material the Face mesh has now (clips may clone it)
    },
    // Lowest point of the leg boxes (1x2x1 studs, centre 1 stud below the hip pivot) in world space.
    soleHeight() {
      root.updateMatrixWorld(true);
      let min = Infinity; const v = new THREE.Vector3();
      for (const side of ['Leg.L', 'Leg.R']) for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
        v.set(x * scale, -2 * scale, z * scale).applyMatrix4(bones[side].matrixWorld); min = Math.min(min, v.y);
      }
      return min;
    },
  };
  actor.setFace(expressions[0]);
  packActors.push(actor);
  return actor;
}

// ---------- accessory fitting ----------
// Every pack accessory attaches at head centre + 0.6 (Roblox's Hat/HairAttachment), which sits inside most hair.
// fitAccessory() places each one on each character so no hair or head pokes through it:
//   seat  - hats with an open or rigid crown (crown, top hat): lowest height where it clears the hair, grown up to 1.35x
//   cover - soft hats (cap): as low as possible, grown up to 1.35x; if nothing fits, the character's hair is hidden
//   band  - headphones: widened only (up to 1.6x across, height kept) until the band and cups clear the hair
//   float - halos: lowest height with nothing inside them
//   hair  - replacement hair, and hats with hair built in (the pack beanie has black hair): swaps out the character's Hair
// Check: the accessory's surface is binned by angle around the head axis and height; in every bin the accessory
// occupies, no hair/head surface point may lie further out than the accessory (tolerance FIT_TOLERANCE studs).
export const ACCESSORY_FIT = {
  crown_admin: 'seat', top_hat: 'seat', ranger_hat: 'seat', cap: 'cover', beanie: 'hair', headphones: 'band', admin_badge_halo: 'float',
  hair_leo: 'hair', hair_max: 'hair', hair_mia: 'hair', hair_skye: 'hair', spiky_hair: 'hair', long_hair: 'hair',
};
export const FIT_TOLERANCE = 0.02;
// How far above the attachment each kind may sit before it would look perched rather than worn.
const MAX_LIFT = { seat: 1.2, float: 1.5, cover: 0.3, band: 0.15 };
const A_BINS = 36, H_STEP = 0.04;

// Deterministic surface samples (about `density` points per square stud) in the object's parent space.
function surfacePoints(meshes, density = 900) {
  const out = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (const m of meshes) {
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, p = g.attributes.position;
    for (let i = 0; i + 2 < p.count; i += 3) {
      a.fromBufferAttribute(p, i).applyMatrix4(m.matrix); b.fromBufferAttribute(p, i + 1).applyMatrix4(m.matrix); c.fromBufferAttribute(p, i + 2).applyMatrix4(m.matrix);
      const area = e1.subVectors(b, a).cross(e2.subVectors(c, a)).length() / 2;
      const n = Math.max(1, Math.ceil(Math.sqrt(area * density)));
      for (let u = 0; u <= n; u++) for (let v = 0; v <= n - u; v++) {
        const w = 1 - u / n - v / n;
        out.push(a.x * w + b.x * (u / n) + c.x * (v / n), a.y * w + b.y * (u / n) + c.y * (v / n), a.z * w + b.z * (u / n) + c.z * (v / n));
      }
    }
  }
  return new Float32Array(out);
}

const binOf = (x, z) => Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * A_BINS) % A_BINS;

// Max depth by which any obstacle point sticks out through the placed accessory (<= 0 means nothing pokes through).
// `s` is a uniform scale or [sx, sy, sz].
function penetration(itemPts, obstPts, s, y) {
  const [sx, sy, sz] = Array.isArray(s) ? s : [s, s, s];
  const env = new Map();
  for (let i = 0; i < itemPts.length; i += 3) {
    const x = itemPts[i] * sx, yy = itemPts[i + 1] * sy + y, z = itemPts[i + 2] * sz;
    const key = binOf(x, z) * 10000 + Math.floor(yy / H_STEP), r = Math.hypot(x, z);
    if (!(env.get(key) >= r)) env.set(key, r);
  }
  let depth = -Infinity, count = 0;
  for (let i = 0; i < obstPts.length; i += 3) {
    const x = obstPts[i], yy = obstPts[i + 1], z = obstPts[i + 2];
    const r0 = env.get(binOf(x, z) * 10000 + Math.floor(yy / H_STEP));
    if (r0 === undefined) continue;
    const d = Math.hypot(x, z) - r0;
    if (d > depth) depth = d;
    if (d > FIT_TOLERANCE) count++;
  }
  return { depth: depth === -Infinity ? 0 : depth, count };
}

const itemCache = new Map();
async function itemSamples(name) {
  if (!itemCache.has(name)) itemCache.set(name, packItem('accessories', name).then((g) => ({ g, pts: surfacePoints(g.children.filter((o) => o.isMesh)) })));
  return itemCache.get(name);
}

// Returns { name, mode, item (fresh group), offset (Head-bone local), scale, hideHair, check: {depth, count, passed, note} }.
export async function fitAccessory(actor, name) {
  const mode = ACCESSORY_FIT[name];
  if (!mode) throw new Error(`No fit rule for accessory "${name}" (add it to ACCESSORY_FIT)`);
  const { pts } = await itemSamples(name);
  const item = await packItem('accessories', name);
  const y0 = (HAT_ATTACHMENT - PIVOTS.Head[1]) * actor.scale;
  const hair = actor.bones.Head.children.find((o) => o.name === 'Hair'), head = actor.bones.Head.children.find((o) => o.name === 'Head');
  const obstacles = (withHair) => surfacePoints([head, ...(withHair && hair ? [hair] : [])]);
  const fit = { name, mode, item, offset: new THREE.Vector3(0, y0, 0), scale: actor.scale, hideHair: false, check: null };
  if (mode === 'hair') {
    fit.hideHair = true;
    fit.check = { depth: 0, count: 0, passed: true, note: 'replaces the character hair; review the sheet' };
  } else {
    const search = (obst) => {
      const scales = mode === 'float' ? [1] : mode === 'band' ? [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6] : [1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35];
      const vec = (k) => (mode === 'band' ? [k, 1, 1] : [k, k, k]).map((v) => v * actor.scale);
      let best = null;
      for (const k of scales) {
        for (let y = y0 - 0.1; y <= y0 + MAX_LIFT[mode]; y += 0.02) {
          const r = penetration(pts, obst, vec(k), y);
          if (r.depth <= FIT_TOLERANCE) {
            const cost = (k - 1) * 4 + (y - y0);
            if (!best || cost < best.cost) best = { k, y, r, cost };
            break;          // lowest passing height for this size
          }
        }
      }
      return best;
    };
    let best = search(obstacles(true));
    if (!best && mode === 'cover' && hair) { best = search(obstacles(false)); fit.hideHair = !!best; }
    if (best) {
      fit.offset.y = best.y; fit.scale = mode === 'band' ? actor.scale : best.k * actor.scale;
      if (mode === 'band') fit.stretch = best.k;          // extra width only (x)
      fit.check = { depth: +best.r.depth.toFixed(3), count: best.r.count, passed: true, note: fit.hideHair ? 'hair hidden under it' : '' };
    } else {
      const r = penetration(pts, obstacles(true), actor.scale, y0);
      fit.check = { depth: +r.depth.toFixed(3), count: r.count, passed: false, note: 'no placement clears the hair' };
    }
  }
  item.scale.setScalar(fit.scale); if (fit.stretch) item.scale.x *= fit.stretch; item.position.copy(fit.offset);
  actor.worn.push({ name, mode, offset: fit.offset.toArray(), scale: fit.scale, stretch: fit.stretch || 1, hideHair: fit.hideHair, check: fit.check });
  return fit;
}

// Fit and attach to the head (clips that animate an accessory in world space use fitAccessory() and place it themselves).
export async function wear(actor, name) {
  const fit = await fitAccessory(actor, name);
  actor.bones.Head.add(fit.item);
  if (fit.hideHair) { const hair = actor.bones.Head.children.find((o) => o.name === 'Hair'); if (hair) hair.visible = false; }
  return fit;
}

// ---------- Roblox animations (assets/roblox_pack/animations) ----------
// Keyframes hold Motor6D.Transform per joint. With Part1 = Part0 * C0 * T * C1^-1 and parts axis-aligned at rest, a joint's
// effect is the rigid move D = C0 * T * C0^-1 in Part0 space. It is brought into this rig's character space
// (turned by pi about Y, Part0 origin at its rest centre) and written onto the matching bone. RootJoint drives the Root
// bone, so the legs follow the torso like in Roblox (the Torso bone stays at rest).
const cf = (c) => new THREE.Matrix4().set(c[3], c[4], c[5], c[0], c[6], c[7], c[8], c[1], c[9], c[10], c[11], c[2], 0, 0, 0, 1);
const FLIP = new THREE.Matrix4().makeRotationY(Math.PI);
const JOINTS = {   // joint -> [bone, C0 (Roblox), Part0 rest centre in Roblox character space]
  RootJoint: ['Root', [0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0], [0, 3, 0]],
  Neck: ['Head', [0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 1, 0], [0, 3, 0]],
  'Right Shoulder': ['Arm.R', [1, 0.5, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0], [0, 3, 0]],
  'Left Shoulder': ['Arm.L', [-1, 0.5, 0, 0, 0, -1, 0, 1, 0, 1, 0, 0], [0, 3, 0]],
  'Right Hip': ['Leg.R', [1, -1, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0], [0, 3, 0]],
  'Left Hip': ['Leg.L', [-1, -1, 0, 0, 0, -1, 0, 1, 0, 1, 0, 0], [0, 3, 0]],
};
const EASE = {
  Linear: (u) => u, Constant: () => 0,
  Cubic: { In: (u) => u * u * u, Out: (u) => 1 - (1 - u) ** 3, InOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2) },
  Elastic: { Out: (u) => (u === 0 || u === 1 ? u : 2 ** (-10 * u) * Math.sin((u * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1) },
  Bounce: { Out: (u) => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375; return n * (u -= 2.625 / d) * u + 0.984375; } },
};
function ease(style, dir, u) {
  const e = EASE[style] ?? EASE.Cubic;
  if (typeof e === 'function') return e(u);
  if (e[dir]) return e[dir](u);
  const out = e.Out; if (dir === 'In') return 1 - out(1 - u);
  return u < 0.5 ? (1 - out(1 - 2 * u)) / 2 : (1 + out(2 * u - 1)) / 2;
}

const animCache = new Map();
export async function loadAnimation(name) {
  if (!animCache.has(name)) {
    animCache.set(name, fetch(`${PACK}animations/${name}.json`).then((r) => r.json()).then((a) => {
      const tracks = {};
      for (const k of a.keyframes) for (const [joint, p] of Object.entries(k.poses)) {
        if (!JOINTS[joint] || p.weight === 0) continue;
        const m = cf(p.cframe), pos = new THREE.Vector3(), q = new THREE.Quaternion(); m.decompose(pos, q, new THREE.Vector3());
        (tracks[joint] ||= []).push({ time: k.time, pos, q, style: p.easingStyle, dir: p.easingDirection });
      }
      for (const t of Object.values(tracks)) t.sort((x, y) => x.time - y.time);
      return { name, length: a.length || 0.001, loop: !!a.loop, tracks };
    }));
  }
  return animCache.get(name);
}

// Joint transforms T at time t (seconds; looped or held at the end).
function sampleTracks(anim, t, loop = anim.loop) {
  const len = anim.length, tt = loop ? ((t % len) + len) % len : Math.min(Math.max(t, 0), len), out = {};
  for (const [joint, ks] of Object.entries(anim.tracks)) {
    let i = ks.findIndex((k) => k.time > tt);
    let a, b, u;
    if (i === -1) { a = b = ks[ks.length - 1]; u = 0; }
    else if (i === 0) { a = b = ks[0]; u = 0; }
    else { a = ks[i - 1]; b = ks[i]; u = ease(a.style, a.dir, (tt - a.time) / Math.max(1e-6, b.time - a.time)); }
    out[joint] = { pos: a.pos.clone().lerp(b.pos, u), q: a.q.clone().slerp(b.q, u) };
  }
  return out;
}

// Blend several [anim, t, weight] layers (weights normalised) into joint transforms, then write them onto the actor.
// Clears the rig first, like rig.js pose().
export function robloxPose(actor, layers) {
  const joints = {};
  let wsum = 0;
  for (const [anim, t, w = 1, loop] of layers) {
    if (!anim || w <= 0) continue;
    const s = sampleTracks(anim, t, loop ?? anim.loop);
    wsum += w;
    for (const [j, v] of Object.entries(s)) {
      if (!joints[j]) joints[j] = { pos: v.pos.clone(), q: v.q.clone(), w };
      else { const k = w / (joints[j].w + w); joints[j].pos.lerp(v.pos, k); joints[j].q.slerp(v.q, k); joints[j].w += w; }
    }
  }
  for (const k of Object.keys(PIVOTS)) { actor.bones[k].quaternion.identity(); actor.bones[k].position.copy(new THREE.Vector3(...PIVOTS[k]).sub(PARENT[k] === 'Root' ? new THREE.Vector3() : new THREE.Vector3(...PIVOTS[PARENT[k]]))).multiplyScalar(actor.scale); }
  actor.bones.Root.position.set(0, 0, 0); actor.bones.Root.quaternion.identity();
  const S = actor.scale;
  for (const [joint, v] of Object.entries(joints)) {
    const [bone, c0, centre] = JOINTS[joint];
    const C0 = cf(c0), T = new THREE.Matrix4().compose(v.pos, v.q, new THREE.Vector3(1, 1, 1));
    const D = C0.clone().multiply(T).multiply(C0.clone().invert());                          // Part0 space
    const toChar = new THREE.Matrix4().makeTranslation(centre[0], centre[1], centre[2]);
    let Dc = FLIP.clone().multiply(toChar).multiply(D).multiply(toChar.clone().invert()).multiply(FLIP.clone().invert()); // our char space
    if (S !== 1) Dc = new THREE.Matrix4().makeScale(S, S, S).multiply(Dc).multiply(new THREE.Matrix4().makeScale(1 / S, 1 / S, 1 / S));
    // Bone local matrix L with  Tr(parentPivot) * L * Tr(-pivot) = Dc  (rest bones are unrotated).
    const piv = bone === 'Root' ? new THREE.Vector3() : new THREE.Vector3(...PIVOTS[bone]).multiplyScalar(S);
    const par = bone === 'Root' || PARENT[bone] === 'Root' ? new THREE.Vector3() : new THREE.Vector3(...PIVOTS[PARENT[bone]]).multiplyScalar(S);
    const L = new THREE.Matrix4().makeTranslation(-par.x, -par.y, -par.z).multiply(Dc).multiply(new THREE.Matrix4().makeTranslation(piv.x, piv.y, piv.z));
    L.decompose(actor.bones[bone].position, actor.bones[bone].quaternion, new THREE.Vector3());
  }
}

// Hold a tool (pack props with a "grip" pivot) the way Roblox does: RightGrip C0 = (0,-1,0) below the arm centre,
// rotated so the tool's +Y points forward. `hand` is 'right' or 'left'.
export function holdItem(actor, item, hand = 'right') {
  const bone = actor.bones[hand === 'right' ? 'Arm.R' : 'Arm.L'], sx = hand === 'right' ? -1 : 1, S = actor.scale;
  const grip = FLIP.clone().multiply(cf([0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0])).multiply(FLIP.clone().invert());
  item.quaternion.setFromRotationMatrix(grip);
  item.position.set(sx * 0.5 * S, -1.5 * S, 0);          // arm centre (0.5 out, 0.5 below the shoulder) + 1 stud down
  item.scale.setScalar(S);
  bone.add(item);
  return item;
}
