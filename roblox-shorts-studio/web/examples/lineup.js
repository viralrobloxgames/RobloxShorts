// Character check: Max, Mia and Leo side by side (compare with assets/Character_Lineup.png).
import * as THREE from 'three';
import { makeCharacter, pose, actionPose } from '../lib/rig.js';
import { part } from '../lib/world.js';
export const meta = { seconds: 1, width: 1080, height: 1920 };
let cast;
export async function setup(stage) {
  const floor = part(40, 1, 40, '#c7cee0', { studs: false, rough: 0.8, clearcoat: 0 }); stage.scene.add(floor);
  cast = ['Max', 'Mia', 'Leo'].map((n, i) => { const a = makeCharacter(n); a.root.position.set((i - 1) * 4.6, 0, (i - 1) * -1.2); a.root.rotation.y = -0.35; stage.scene.add(a.root); return a; });
  stage.aimSun(new THREE.Vector3(0, 2, 0), 12);
}
export function update(t, stage) {
  cast.forEach((a) => pose(a, actionPose('Idle', 0)));
  stage.camera.fov = 30; stage.camera.position.set(5, 7, 26); stage.camera.lookAt(0, 2.6, 0); stage.camera.updateProjectionMatrix();
}
