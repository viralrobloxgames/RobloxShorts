// Pose sheet for the lion rig (preview only).
import * as THREE from 'three';
import { makeLion, lionPose, lionStand, lionRoar, lionCrouch, lionLeap, lionSwat, lionBelly, lionWalk, lionSole } from './lion.js';
export const meta = { seconds: 6, fps: 1, width: 1080, height: 1920 };
let L;
export async function setup(stage) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#c9a77a' })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; stage.scene.add(g);
  L = makeLion(); stage.scene.add(L.root);
}
const P = [() => lionStand(0), () => lionRoar(0), () => lionCrouch(0), () => lionLeap(0), () => lionSwat(0.5), () => lionBelly(0)];
export function update(t, stage) {
  const i = Math.min(5, Math.floor(t)); lionPose(L, P[i]());
  L.root.rotation.set(0, 0.7, i === 5 ? Math.PI : 0); L.root.position.set(0, 0, 0); L.root.updateMatrixWorld(true);
  if (i === 5) { const b = new THREE.Box3().setFromObject(L.root); L.root.position.y -= b.min.y; } else L.root.position.y -= lionSole(L);
  const c = stage.camera; c.position.set(9, 6, 13); c.fov = 40; c.updateProjectionMatrix(); c.lookAt(0, 3, 0); stage.aimSun(new THREE.Vector3(0, 2, 0), 12);
}
