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

// A pack character driven by rig.js. `expressions` are preloaded face textures (faces/<name>.png).
export async function loadRobloxCharacter(name, { expressions = ['happy'], scale = 1 } = {}) {
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
    if (mesh.name === 'Face') { face = mesh; mesh.material = mesh.material.clone(); mesh.material.polygonOffset = true; mesh.material.polygonOffsetFactor = -2; }
  }
  const faceTex = {};
  await Promise.all(expressions.map(async (e) => { faceTex[e] = await packTexture(`faces/${e}.png`); }));
  const actor = {
    name, root, bones, face, faceTex, expression: null, pack: true, scale,
    hatOffset: new THREE.Vector3(0, (HAT_ATTACHMENT - PIVOTS.Head[1]) * scale, 0),   // Head-bone local
    setFace(e) {
      const t = faceTex[e];
      if (!t) throw new Error(`Face "${e}" was not preloaded for ${name}`);
      face.material.map = t; actor.expression = e;     // set on whatever material the Face mesh has now (clips may clone it)
    },
    // Head-bone-local seat for a hat of the given band radius: the highest point where hair still sticks out wider
    // than the band, so the hat sits on the hair instead of cutting through it (head top when there is no hair).
    hatSeat(radius) {
      let y = (HAT_ATTACHMENT - PIVOTS.Head[1]) * scale;   // head top (centre 4.5 + 0.6)
      const hair = bones.Head.children.find((o) => o.name === 'Hair');
      if (hair) {
        const p = hair.geometry.attributes.position, o = hair.position;
        for (let i = 0; i < p.count; i++) {
          if (Math.hypot(p.getX(i) + o.x, p.getZ(i) + o.z) > radius) y = Math.max(y, p.getY(i) + o.y);
        }
      }
      return new THREE.Vector3(0, y, 0);
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
  return actor;
}
