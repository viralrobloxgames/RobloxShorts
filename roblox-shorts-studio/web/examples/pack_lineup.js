// Cast check for the Roblox pack characters: pose, faces, grounding and the admin crown.
import * as THREE from 'three';
import { pose, actionPose, setExpression, soleHeight } from '../lib/rig.js';
import { part, spawnPad } from '../lib/world.js';
import { loadRobloxCharacter, packItem } from '../lib/robloxPack.js';

export const meta = { seconds: 1, fps: 30, width: 1080, height: 1920 };
let cast = [];

export async function setup(stage) {
  stage.scene.add(part(30, 1, 20, '#c3cbdb', { studs: true }));
  const names = ['Max', 'Leo', 'Mia', 'Noob'], faces = ['happy', 'evil_grin', 'surprised', 'confused'];
  const poses = [actionPose('Wave', 0.25), actionPose('Point', 0), actionPose('Shock', 0), actionPose('Idle', 0)];
  for (let i = 0; i < names.length; i++) {
    const a = await loadRobloxCharacter(names[i], { expressions: [faces[i]] });
    a.root.position.set((i - 1.5) * 3.4, 0, i % 2 ? 1.2 : 0); a.root.rotation.y = (1.5 - i) * 0.18;
    pose(a, poses[i]); a.root.updateMatrixWorld(true); a.root.position.y -= soleHeight(a);
    setExpression(a, faces[i]);
    stage.scene.add(a.root); cast.push(a);
  }
  const crown = await packItem('accessories', 'crown_admin');
  crown.position.copy(cast[1].hatOffset); cast[1].bones.Head.add(crown);
}
export function update(t, stage) {
  stage.camera.position.set(0, 4.2, 17); stage.camera.fov = 40; stage.camera.updateProjectionMatrix(); stage.camera.lookAt(0, 3.4, 0);
  stage.aimSun(new THREE.Vector3(0, 0, 0), 12);
}
