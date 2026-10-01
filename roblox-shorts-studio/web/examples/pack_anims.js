// Animation check for the Roblox pack player: several R6 animations side by side, with held tools.
// Frame 1 front view, frame 2 side view.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../lib/rig.js';
import { part } from '../lib/world.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, holdItem } from '../lib/robloxPack.js';

export const meta = { seconds: 1, fps: 30, width: 600, height: 800 };
const SET = [['walk', 0.2], ['sprint', 0.15], ['push', 0.3], ['tool_slash', 0.15], ['aim', 0.5], ['cheer', 0.5], ['dizzy', 0.4], ['typing', 0.3], ['facepalm', 0.8]];
let cast = [];
export async function setup(stage) {
  stage.scene.add(part(60, 1, 20, '#c3cbdb', { studs: true }));
  for (let i = 0; i < SET.length; i++) {
    const a = await loadRobloxCharacter(['Leo', 'Max', 'Mia', 'Noob'][i % 4], { expressions: ['happy'] });
    const anim = await loadAnimation(SET[i][0]);
    a.root.position.set((i - (SET.length - 1) / 2) * 4.2, 0, 0);
    stage.scene.add(a.root); cast.push({ a, anim, t: SET[i][1] });
    if (SET[i][0] === 'tool_slash') holdItem(a, await packItem('props', 'sword'));
    if (SET[i][0] === 'aim') holdItem(a, await packItem('props', 'rocket_launcher'));
  }
}
export function update(t, stage) {
  const f = Math.round(t * 30), i = f % SET.length, side = f >= SET.length;
  cast.forEach(({ a, anim, t: at }, k) => {
    robloxPose(a, [[anim, at]]);
    a.root.updateMatrixWorld(true); a.root.position.y -= soleHeight(a);
    a.root.visible = k === i;
  });
  const c = cast[i].a.root.position, az = side ? Math.PI / 2 : 0.6;
  stage.camera.fov = 30;
  stage.camera.position.set(c.x + Math.sin(az) * 16, 4, Math.cos(az) * 16);
  stage.camera.updateProjectionMatrix(); stage.camera.lookAt(c.x, 2.8, 0);
  stage.aimSun(new THREE.Vector3(c.x, 0, 0), 8);
}
export function samples() { return 1; }
