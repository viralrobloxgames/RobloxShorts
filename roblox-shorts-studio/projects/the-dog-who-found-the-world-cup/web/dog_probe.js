// Probe: the collie (animal_collie_parts) beside Max, in a few poses. Frame 1 side, 2 front 3/4, 3 trot, 4 sniff, 5 sit.
import * as THREE from 'three';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { loadCreature, poseCreature } from '../../../web/lib/creature.js';
export const meta = { seconds: 6 / 30, fps: 30, width: 1080, height: 1920 };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
let max, dog, A = {};
export async function setup(stage) {
  max = await loadRobloxCharacter('Max', { expressions: ['happy'] }); stage.scene.add(max.root);
  dog = await loadCreature('animal_collie_parts'); dog.root.scale.setScalar(0.62); stage.scene.add(dog.root);
  dog.obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  A.idle = await loadAnimation('idle');
  const g = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#6aa84f' })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; stage.scene.add(g);
}
export function samples() { return 1; }
export function update(t, stage) {
  const f = Math.round(t * 30);
  max.root.position.set(-2.5, 0, 0); max.root.rotation.y = 0.3; robloxPose(max, [[A.idle, 0]]); max.root.updateMatrixWorld(true); max.root.position.y -= max.soleHeight();
  dog.root.position.set(1.5, 0, 0); dog.root.rotation.set(0, 0 - Math.PI / 2, 0);   // heading 0 = facing +z (camera)
  let pose = {};
  if (f === 3) { const sn = Math.sin(1.2); pose = { FrontL: [0, 0, 0.45 * sn], RearR: [0, 0, 0.45 * sn], FrontR: [0, 0, -0.45 * sn], RearL: [0, 0, -0.45 * sn], Tail: [0, 0.3, 0] }; }
  if (f === 4) pose = { Head: [0, 0, 0.75], Tail: [0, 0, -0.4] };
  if (f === 5) pose = { Body: { r: [0, 0, -0.45], p: [0, -0.35, 0] }, RearL: [0, 0, 1.0], RearR: [0, 0, 1.0], FrontL: [0, 0, -0.45], FrontR: [0, 0, -0.45], Head: [0, 0, -0.35] };
  poseCreature(dog, pose);
  const c = stage.camera; c.fov = 40;
  if (f <= 1) c.position.set(0, 3, 16); else if (f === 2) c.position.set(9, 4, 10); else c.position.set(0.5, 3, 14);
  if (f >= 3) { dog.root.rotation.y = -Math.PI / 2 + -Math.PI / 2; }   // side-on
  c.updateProjectionMatrix(); c.lookAt(0, 2.2, 0); stage.aimSun(new THREE.Vector3(0, 2, 0), 10);
}
