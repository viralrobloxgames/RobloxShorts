// He Declared Himself Emperor (web route, three.js). True story: Joshua Norton, San Francisco, 1859-1880.
// WORK IN PROGRESS (overnight 2026-10-06): only the set test exists so far: Leo in Norton's uniform on the 1859 street
// (one shot). Next: the cast (Skye the editor, Mia's shop, Max the police chief, recoloured Noobs as townsfolk and
// officers), the shots from source/story.md, overlays, hats (kit.js), then previews, hold and fit checks.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { W } from './beats.js';
import { sanFrancisco, nortonUniform, hat, headHat, STREET_Z } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Declared Himself Emperor' };
export const sky = { zenith: '#5a8fd6', horizon: '#e6dcc4', below: '#f0f6ff', fog: '#e8e0cc', sunDir: new THREE.Vector3(0.4, 0.62, 0.68) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let leo, SF;
const A = {};

export async function setup(stage) {
  const { scene } = stage;
  leo = await loadRobloxCharacter('Leo', { expressions: ['neutral', 'determined', 'happy', 'surprised'], hairLift: 0.16 });
  scene.add(leo.root); nortonUniform(leo); headHat(leo, hat({ feather: true }));
  for (const n of ['idle', 'walk']) A[n] = await loadAnimation(n);
  SF = sanFrancisco(scene);
}
export function samples() { return 1; }
export function update(t, stage) {
  stage.sun.intensity = 2.8; stage.hemi.intensity = 0.55;
  leo.root.visible = true; leo.root.position.set(-4, 0, STREET_Z); leo.root.rotation.set(0, 0.2, 0);
  robloxPose(leo, [[A.idle, t, 1, true]]);
  leo.root.updateMatrixWorld(true); leo.root.position.y -= leo.soleHeight(); leo.root.updateMatrixWorld(true);
  setExpression(leo, 'happy');
  const c = stage.camera; c.position.set(-2.6, 5.0, STREET_Z + 13); c.fov = 46; c.up.set(0, 1, 0); c.updateProjectionMatrix();
  c.lookAt(V(-3.6, 4.2, STREET_Z - 2)); stage.aimSun(V(-4, 2, 0), 16);
}
export function overlay() {}
export const cast = () => ({ leo });
