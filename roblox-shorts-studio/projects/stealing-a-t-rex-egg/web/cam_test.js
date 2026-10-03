// Camera angle test on the sleeping T-rex (not part of the short).
import * as THREE from 'three';
import * as base from './egg_clip.js';
export const meta = { ...base.meta, seconds: 0.2 };
export const sky = base.sky;
export async function setup(stage) { await base.setup(stage); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = 0.85, F = V(Math.sin(R), 0, Math.cos(R)), S = V(Math.cos(R), 0, -Math.sin(R)), REX = V(-9.6, 0, -9.0);
const CAMS = [
  [REX.clone().add(S.clone().multiplyScalar(46)).add(F.clone().multiplyScalar(16)).add(V(0, 7, 0)), REX.clone().add(F.clone().multiplyScalar(14)).add(V(0, 5, 0))],
  [REX.clone().add(S.clone().multiplyScalar(-46)).add(F.clone().multiplyScalar(16)).add(V(0, 7, 0)), REX.clone().add(F.clone().multiplyScalar(14)).add(V(0, 5, 0))],
  [REX.clone().add(S.clone().multiplyScalar(34)).add(F.clone().multiplyScalar(30)).add(V(0, 6, 0)), REX.clone().add(F.clone().multiplyScalar(14)).add(V(0, 5, 0))],
  [REX.clone().add(S.clone().multiplyScalar(-34)).add(F.clone().multiplyScalar(30)).add(V(0, 6, 0)), REX.clone().add(F.clone().multiplyScalar(14)).add(V(0, 5, 0))],
];
export function update(t, stage) {
  base.update(1.0, stage); const i = Math.round(t * 30) % CAMS.length, c = stage.camera;
  c.position.copy(CAMS[i][0]); c.fov = 44; c.updateProjectionMatrix(); c.lookAt(CAMS[i][1]);
}
