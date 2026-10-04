// Asset look-see for Catching the Egg Thief: spinosaurus, the hatchable HyperEgg, capybara, a few eggs, Leo for scale. Not part of the short.
import * as THREE from 'three';
import { part } from '../../../web/lib/world.js';
import { loadCreature, poseCreature, creatureLowest } from '../../../web/lib/creature.js';
import { packItem, loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { soleHeight } from '../../../web/lib/rig.js';
export const meta = { seconds: 0.2, fps: 30, width: 1080, height: 1920, title: 'probe' };
let sp, leo, cam, A = {}, egg, BOD;
const VIEWS = [[V3(40, 14, 40), V3(0, 9, 0)], [V3(-36, 10, -8), V3(0, 9, 0)], [V3(10, 5, 26), V3(10, 3, 14)], [V3(-20, 5, 30), V3(-14, 2, 16)]];
function V3(x, y, z) { return new THREE.Vector3(x, y, z); }
export async function setup(stage) {
  stage.scene.add(part(300, 2, 300, '#6aa84f', { studs: false }));
  sp = await loadCreature('spinosaurus'); stage.scene.add(sp.root); BOD = Object.keys(sp.bodies).filter((n) => sp.bodies[n].meshes.length);
  const e = await packItem('props', 'egg_hyper'); e.position.set(10, 0, 14); stage.scene.add(e);
  const c = await packItem('creatures', 'animal_capybara'); c.position.set(16, 0, 12); stage.scene.add(c);
  for (const [n, x] of [['egg_basic', -18], ['egg_rare', -15], ['egg_epic', -12], ['egg_ultra', -9], ['egg_magic_rabbit', -6]]) { const o = await packItem('props', n); o.position.set(x, 0, 16); stage.scene.add(o); }
  leo = await loadRobloxCharacter('Leo', { hairLift: 0.16 }); stage.scene.add(leo.root); A.idle = await loadAnimation('idle');
}
export function update(t, stage) {
  const i = Math.round(t * 30) % VIEWS.length;
  poseCreature(sp, {}); sp.root.position.set(0, 0, 0); sp.root.updateMatrixWorld(true); sp.root.position.y -= creatureLowest(sp, BOD);
  leo.root.position.set(6, 0, 12); leo.root.rotation.y = 0.8; robloxPose(leo, [[A.idle, 0.2]]); leo.root.updateMatrixWorld(true); leo.root.position.y -= soleHeight(leo);
  cam = stage.camera; cam.position.copy(VIEWS[i][0]); cam.fov = 45; cam.updateProjectionMatrix(); cam.lookAt(VIEWS[i][1]); stage.aimSun(V3(0, 0, 0), 40);
}
export function overlay() {}
