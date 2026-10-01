// Cover image for Max Got Admin For One Round (render one frame): Max with the admin crown, typing the ban with one
// second left on his admin clock, Leo smirking over his shoulder. Reuses the video's scene at story time 52.8 s.
import * as THREE from 'three';
import * as base from './max_clip.js';
import { packActors, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression } from '../../../web/lib/rig.js';
import { roundRect, drawCrown } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
let proud;
export async function setup(stage) { await base.setup(stage); proud = await loadAnimation('proud'); }
export function samples() { return 6; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function update(t, stage) {
  base.update(52.8, stage);                              // Max typing ":ban leo", crown on, clock nearly out
  const actor = (n) => packActors.find((a) => a.name === n && a.root.parent);
  const max = actor('Max'), leo = actor('Leo');
  setExpression(max, 'evil_grin');
  // A still can be staged freely: Leo stands just behind Max's shoulder, smirking at the camera.
  leo.root.position.set(5.4, 0, 0.4); leo.root.rotation.set(0, -0.45, 0); leo.root.scale.setScalar(1); robloxPose(leo, [[proud, 0.35]]); setExpression(leo, 'smug');   // hands on hips, unbothered
  leo.root.updateMatrixWorld(true);
  const tg = max.bones.Head.localToWorld(V(0, 0.2, 0));
  stage.camera.position.copy(tg).add(V(0.6, -0.9, 12)); stage.camera.fov = 44; stage.camera.updateProjectionMatrix();
  stage.camera.lookAt(tg.clone().add(V(2.3, -0.9, 0)));
  stage.aimSun(V(tg.x, 0, tg.z), 20); stage.bloom.strength = 0.35;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE HAD 1 SECOND', 540, 260, 118, '#ffffff', -0.04);
  big(g, s, 'TO BAN HIM', 540, 400, 150, '#FFD23F', -0.04);
  // The ban being typed, and the admin clock about to run out.
  g.save(); g.translate(540 * s, 1380 * s); g.rotate(-0.03);
  roundRect(g, -430 * s, -95 * s, 860 * s, 190 * s, 34 * s); g.fillStyle = 'rgba(12,18,28,.9)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.font = `800 ${104 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(':ban leo', -380 * s, 4 * s); const w = g.measureText(':ban leo').width; g.fillRect(-380 * s + w + 10 * s, -55 * s, 10 * s, 110 * s);
  g.restore();
  g.save(); g.translate(540 * s, 1600 * s); g.rotate(0.03);
  roundRect(g, -300 * s, -70 * s, 600 * s, 140 * s, 36 * s); g.fillStyle = '#e8213a'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#ffffff'; g.stroke();
  drawCrown(g, -205 * s, 0, 44 * s);
  g.font = `${78 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('ADMIN 0:01', -150 * s, 6 * s);
  g.restore();
  g.save(); g.translate(540 * s, 115 * s); g.rotate(-0.04); g.font = `${54 * s}px "Luckiest Guy"`;
  roundRect(g, -110 * s, -42 * s, 220 * s, 84 * s, 22 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 2', 0, 4 * s); g.restore();
}
