// Pose sheet for the pack T-rex: one frame per pose, three-quarter view, Leo and the T-rex egg for scale. Not part of the short.
import * as THREE from 'three';
import { part } from '../../../web/lib/world.js';
import { loadCreature, poseCreature, creatureLowest } from '../../../web/lib/creature.js';
import { trexIdle, trexSleep, trexRoar, trexRun, trexHeadbutt, TREX_FEET } from '../../../web/lib/trexPoses.js';
import { packItem, loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { soleHeight } from '../../../web/lib/rig.js';
export const meta = { seconds: 0.3, fps: 30, width: 1080, height: 1920, title: 'pose sheet' };
const S = 1.6;
let rex, leo, cam, A = {};
const POSES = [['asleep', trexSleep(0), 'all'], ['idle', trexIdle(0)], ['roar', trexRoar(0.1)], ['run 0', trexRun(0)], ['run .25', trexRun(0.25)],
  ['run .5', trexRun(0.5)], ['run .75', trexRun(0.75)], ['headbutt', trexHeadbutt(0.5)], ['rest', {}]];
export async function setup(stage) {
  stage.scene.add(part(300, 2, 300, '#6aa84f', { studs: false }));
  rex = await loadCreature('trex'); rex.root.scale.setScalar(S); stage.scene.add(rex.root);
  const egg = await packItem('props', 'egg_trex'); egg.position.set(-9, 0, 14); egg.scale.setScalar(0.6); stage.scene.add(egg);
  leo = await loadRobloxCharacter('Leo', { hairLift: 0.16 }); stage.scene.add(leo.root); A.idle = await loadAnimation('idle');
}
export function update(t, stage) {
  const i = Math.round(t * 30) % POSES.length, [, pose, ground] = POSES[i];
  rex.root.position.set(0, 0, 0); poseCreature(rex, pose);
  const names = ground === 'all' ? Object.keys(rex.bodies).filter((n) => rex.bodies[n].meshes.length) : TREX_FEET;
  rex.root.position.y -= creatureLowest(rex, names);
  leo.root.position.set(-15, 0, 16); leo.root.rotation.y = 0.8; robloxPose(leo, [[A.idle, 0.2]]); leo.root.updateMatrixWorld(true); leo.root.position.y -= soleHeight(leo);
  cam = stage.camera; cam.position.set(-46, 14, 48); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(-4, 9, 4); stage.aimSun(new THREE.Vector3(0, 0, 0), 40);
}
export function overlay(g, s, t) { const i = Math.round(t * 30) % POSES.length; g.font = `${80 * s}px "Luckiest Guy"`; g.fillStyle = '#fff'; g.strokeStyle = '#152435'; g.lineWidth = 10 * s; g.strokeText(POSES[i][0], 60 * s, 300 * s); g.fillText(POSES[i][0], 60 * s, 300 * s); }
