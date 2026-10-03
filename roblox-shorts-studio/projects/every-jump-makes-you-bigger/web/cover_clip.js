// Cover for Every Jump Makes You Bigger (one frame, 1080x1920; everything inside the 3:4 band y 240-1680). Giant Leo
// leaning over the tiny trophy room, its door and trophy in the foreground; "EVERY JUMP = BIGGER" and a PART 1 tag.
import * as THREE from 'three';
import * as base from './jump_clip.js';
import { W } from './beats.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let cam, A = {};
export async function setup(stage) { await base.setup(stage); A.idle = await loadAnimation('idle'); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.tinyDoor - 1.0, stage);
  const { leo, max } = base.cast(); max.root.visible = false;
  // Giant Leo (50 jumps) behind the tiny room, looking down at it.
  const S = base.SIZE(50); leo.root.visible = true; leo.root.position.set(156, 0, -16); leo.root.rotation.set(0, Math.atan2(186 - 156, 14 + 16), 0); leo.root.scale.setScalar(S);
  robloxPose(leo, [[A.idle, 0.3]]); leo.bones.Head.rotateX(0.32); leo.root.updateMatrixWorld(true); leo.root.position.y -= soleHeight(leo); setExpression(leo, 'surprised'); leo.root.updateMatrixWorld(true);
  cam = stage.camera; cam.position.set(188, 2.6, 30); cam.fov = 70; cam.updateProjectionMatrix(); cam.lookAt(168, 25, -8);
  stage.aimSun(V(160, 0, 0), 70); stage.bloom.strength = 0.3;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.16, { cx: 540, cy: 900, seed: 6 });
  g.save(); g.translate(170 * s, 1600 * s); g.rotate(-0.08); g.font = `${54 * s}px "Luckiest Guy"`;
  roundRect(g, -110 * s, -42 * s, 220 * s, 84 * s, 22 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 1', 0, 4 * s); g.restore();
  big(g, s, 'EVERY JUMP', 540, 340, 150, '#ffffff', -0.04);
  big(g, s, '= BIGGER', 540, 495, 150, '#8BE36B', -0.04);
}
