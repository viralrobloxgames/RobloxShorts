// T-rex + eggs look test (10.5 s): asleep around the nest, one eye opens, it stands, roars, runs a lap, then a turntable.
// Leo stands by the nest for scale. Not part of the short; it's for approving the build.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, cloud } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut } from '../../../web/lib/anim.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { makeNest } from '../../../web/lib/trex.js';
import { loadCreature, poseCreature, creatureLowest, creaturePoint } from '../../../web/lib/creature.js';
import { trexIdle, trexSleep, trexRoar, trexRun, mixPose, TREX_STRIDE } from '../../../web/lib/trexPoses.js';
import { packItem } from '../../../web/lib/robloxPack.js';
const REXS = 1.6;     // the game's T-rex at 1.6x: about 19 studs tall next to a 5-stud character

export const meta = { seconds: 10.5, fps: 30, width: 1080, height: 1920, title: 'T-Rex test' };
export const sky = { zenith: '#3d7fd6', horizon: '#ffd9a8', below: '#f3e6d0', fog: '#f2dcc0' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const NEST = V(0, 0, 13), CIRCLE = 30;
let rex, leo, A = {}, cam, golden, zzz = [];

function palm(scene, x, z, h, r) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) { const s = part(1.4 - i * 0.08, h / 6 + 0.1, 1.4 - i * 0.08, i % 2 ? '#8a5a32' : '#7a4e2a', { center: true }); s.position.set(i * 0.25, (i + 0.5) * h / 6, 0); g.add(s); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + r, leaf = part(1.6, 0.3, 7, '#3f8f3a', { center: true }); leaf.position.set(1.5 + Math.cos(a) * 3, h + 0.2, Math.sin(a) * 3); leaf.rotation.set(0.35, -a + Math.PI / 2, 0); g.add(leaf); }
  g.position.set(x, 0, z); scene.add(g);
}
function fern(scene, x, z, s) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, f = part(0.8 * s, 0.2, 3.4 * s, i % 2 ? '#4fa046' : '#3c8a37', { center: true }); f.position.set(Math.cos(a) * 1.4 * s, 0.9 * s, Math.sin(a) * 1.4 * s); f.rotation.set(-0.5, -a + Math.PI / 2, 0); g.add(f); }
  g.position.set(x, 0, z); scene.add(g);
}

export async function setup(stage) {
  const { scene } = stage; const r = rng(7);
  scene.fog.near = 160; scene.fog.far = 700;
  const ground = part(160, 4, 160, '#6aa84f', { studs: true }); scene.add(ground);
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshStandardMaterial({ color: '#a68a5a', roughness: 1 })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(NEST.x, 0.03, NEST.z - 4); dirt.receiveShadow = true; scene.add(dirt);
  // Volcano and cliffs in the distance.
  const volc = new THREE.Mesh(new THREE.ConeGeometry(70, 90, 9, 1, true), new THREE.MeshStandardMaterial({ color: '#5a4a44', roughness: 1, flatShading: true })); volc.position.set(-60, 30, -220); scene.add(volc);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 4, 9), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a10', emissiveIntensity: 2 })); glow.position.set(-60, 74, -220); scene.add(glow);
  for (let i = 0; i < 9; i++) { const c = part(20 + r() * 20, 20 + r() * 40, 20, i % 2 ? '#8a7360' : '#7a6552', { center: true }); c.position.set(-140 + i * 36, 10, -120 - r() * 30); scene.add(c); }
  for (const [x, z, h] of [[-60, -20, 18], [52, -36, 21], [64, 30, 16], [-62, 40, 19], [-24, -64, 23], [30, -70, 20]]) palm(scene, x, z, h, r() * 3);
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 20 + r() * 45; fern(scene, Math.cos(a) * d, NEST.z + Math.sin(a) * d * 0.8 - 8, 0.8 + r() * 0.8); }
  for (let i = 0; i < 10; i++) { const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + r() * 2.2), new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: 0.9, flatShading: true })); const a = r() * Math.PI * 2, d = 18 + r() * 30; rock.position.set(Math.cos(a) * d, 0.6, NEST.z + Math.sin(a) * d); rock.castShadow = rock.receiveShadow = true; scene.add(rock); }
  for (let i = 0; i < 14; i++) { const c = cloud(300 + i, 10 + r() * 10); c.position.set(-200 + r() * 400, 70 + r() * 60, -260 + r() * 120); scene.add(c); }

  // Nest with twelve of the game's eggs and its T-rex egg in the middle.
  const nest = makeNest(7); nest.group.position.copy(NEST); scene.add(nest.group);
  const small = [['egg_basic', 1.1], ['egg_rare', 0.8], ['egg_super_rare', 0.7], ['egg_velociraptor', 0.55], ['egg_prism', 0.5], ['egg_designer_2', 0.5]];
  for (const [i, p] of nest.slots.entries()) { const [n, k] = small[i % small.length]; const e = await packItem('props', n); e.scale.setScalar(k); e.position.copy(NEST).add(p); e.rotation.y = r() * 6; scene.add(e); }
  golden = await packItem('props', 'egg_trex'); golden.scale.setScalar(0.55); golden.position.copy(NEST).add(V(0, 0.8, 0)); scene.add(golden);
  const halo = new THREE.PointLight('#ffc040', 30, 14, 2); halo.position.copy(NEST).add(V(0, 6, 0)); scene.add(halo);

  rex = await loadCreature('trex'); rex.root.scale.setScalar(REXS); scene.add(rex.root);
  leo = await loadRobloxCharacter('Leo', { expressions: ['scared', 'shocked', 'nervous', 'happy'], hairLift: 0.16 }); scene.add(leo.root);
  for (const n of ['walk', 'idle', 'shock']) A[n] = await loadAnimation(n);
}

let BODIES;
function placeRex(pos, rotY, pose) {
  rex.root.position.copy(pos); rex.root.rotation.set(0, rotY, 0); poseCreature(rex, pose);
  BODIES ||= Object.keys(rex.bodies).filter((n) => rex.bodies[n].meshes.length);
  rex.root.position.y -= creatureLowest(rex, BODIES);          // whatever is lowest (feet, or belly when asleep) on the ground
  rex.root.updateMatrixWorld(true);
}
const rexHead = () => creaturePoint(rex, 'head', 0, 9.6, -8.5);

export function samples(t) { return t > 5.6 && t < 9 ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

export function update(t, stage) {
  cam = stage.camera;
  const SLEEP_AT = V(-14, 0, -4), sleepRot = 0.7;    // lying beside the nest, chin next to the golden egg
  // Rex: sleep -> eye opens (3.0) -> stands (3.4-4.4) -> roar (4.4-5.6) -> runs a lap (5.6-9) -> turntable stand (9+).
  let pose, pos = SLEEP_AT.clone(), rotY = sleepRot;
  if (t < 3.0) pose = trexSleep(t);
  else if (t < 4.4) { const u = easeInOut(inv(3.0, 4.2, t)); pose = mixPose(trexSleep(t), trexIdle(t), u); }
  else if (t < 5.6) { const u = easeInOut(clamp((t - 4.4) / 0.3)); pose = mixPose(trexIdle(t), trexRoar(t), u * (1 - inv(5.3, 5.6, t))); }
  else if (t < 9.0) {
    // A lap round the nest, distance-driven run cycle.
    const speed = 30, d = (t - 5.6) * speed, a0 = Math.atan2(SLEEP_AT.z - NEST.z, SLEEP_AT.x - NEST.x), a = a0 - d / CIRCLE;
    const ramp = clamp((t - 5.6) / 0.4); pos = V(NEST.x + Math.cos(a) * CIRCLE * ramp + SLEEP_AT.x * (1 - ramp), 0, NEST.z + Math.sin(a) * CIRCLE * ramp + SLEEP_AT.z * (1 - ramp));
    rotY = lerp(sleepRot, Math.atan2(Math.sin(a), -Math.cos(a)) + Math.PI, ramp);
    pose = mixPose(trexIdle(t), trexRun(d / (TREX_STRIDE * REXS)), ramp);
  } else { pos = V(0, 0, -6); rotY = 0.4; pose = trexIdle(t); }
  placeRex(pos, rotY, pose);

  // Leo by the nest for scale: tiptoes in, freezes when the eye opens.
  const L0 = V(12, 0, 24), L1 = V(6.5, 0, 18), u = clamp(t / 2.8);
  leo.root.position.copy(L0.clone().lerp(L1, u)); leo.root.rotation.set(0, Math.atan2(NEST.x - L1.x, NEST.z - L1.z), 0);
  robloxPose(leo, t < 2.8 ? [[A.walk, u * L0.distanceTo(L1) / 14.5]] : [[A.shock, 0.3]]);
  leo.root.updateMatrixWorld(true); leo.root.position.y -= soleHeight(leo); setExpression(leo, t < 3.0 ? 'nervous' : 'scared');
  if (t > 9) { leo.root.position.set(10, 0, 10); leo.root.rotation.set(0, -0.6, 0); robloxPose(leo, [[A.idle, t]]); leo.root.updateMatrixWorld(true); leo.root.position.y -= soleHeight(leo); setExpression(leo, 'happy'); }
  golden.rotation.y = t * 0.6;

  // Camera.
  const look = (p, tg, fov = 40) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 45); };
  const hc = rexHead();
  const side = V(1, 0, 0).applyQuaternion(rex.root.quaternion), fwd = V(0, 0, 1).applyQuaternion(rex.root.quaternion);
  if (t < 3.0) look(V(lerp(40, 34, t / 3), 12, lerp(60, 52, t / 3)), V(-4, 4, 6), 42);
  else if (t < 4.4) look(hc.clone().add(side.clone().multiplyScalar(-26)).add(fwd.clone().multiplyScalar(20)).add(V(0, 4, 0)), hc.clone().add(V(0, -2, 0)), 40);
  else if (t < 5.6) { const j = t < 5.3 ? 0.3 * Math.sin(t * 70) : 0; look(hc.clone().add(fwd.clone().multiplyScalar(48)).add(side.clone().multiplyScalar(14)).add(V(j, -10, 0)), hc.clone().add(V(0, -6 + j, 0)), 46); }
  else if (t < 9.0) { const rp = rex.root.position, out = rp.clone().sub(NEST).setY(0).normalize(); look(rp.clone().add(out.multiplyScalar(75)).add(fwd.clone().multiplyScalar(18)).add(V(0, 14, 0)), rp.clone().add(fwd.clone().multiplyScalar(11)).add(V(0, 13, 0)), 44); }
  else { const a = 0.6 + (t - 9) * 1.2; look(V(Math.sin(a) * 78, 18, -6 + Math.cos(a) * 78), V(0, 13, -6), 40); }
  stage.bloom.strength = 0.32;
}

export function overlay(g, s, t) {
  // Zzz while asleep.
  if (t < 3.0) {
    cam.updateMatrixWorld(); const p = rexHead().add(V(0, 4, 0)).project(cam);
    const x = (p.x * 0.5 + 0.5) * 1080 * s, y = (-p.y * 0.5 + 0.5) * 1920 * s;
    for (let i = 0; i < 3; i++) { const a = ((t * 0.6 + i / 3) % 1); g.save(); g.globalAlpha = 1 - a; g.font = `${(46 + 30 * a) * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.strokeStyle = '#152435'; g.lineWidth = 8 * s; g.strokeText('Z', x + (40 + 60 * a) * s, y - 160 * a * s); g.fillText('Z', x + (40 + 60 * a) * s, y - 160 * a * s); g.restore(); }
  }
  g.save(); g.font = `${44 * s}px "Luckiest Guy"`; roundRect(g, 60 * s, 250 * s, 420 * s, 80 * s, 22 * s); g.fillStyle = 'rgba(21,36,53,.85)'; g.fill();
  g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.fillText(t < 3 ? 'ASLEEP' : t < 4.4 ? 'WAKING UP' : t < 5.6 ? 'ROAR' : t < 9 ? 'RUN CYCLE' : 'TURNAROUND', 90 * s, 292 * s); g.restore();
}
