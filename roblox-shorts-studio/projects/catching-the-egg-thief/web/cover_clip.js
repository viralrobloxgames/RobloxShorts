// Cover for Catching the Egg Thief (one frame, 1080x1920; key content inside the 3:4 band y 240-1680): the giant
// spinosaurus holding the hooded thief up by the hood at night, Leo smug in front; "CATCHING THE / EGG THIEF".
// Standalone story: no part tag.
import * as THREE from 'three';
import * as base from './thief_clip.js';
import { W } from './beats.js';
import { speedLines } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.me - 0.2, stage);                       // carried home, dangling from the snout
  const { leo, max } = base.cast(), cam = stage.camera, mp = max.root.position.clone();
  cam.position.copy(mp).add(V(-7, 1.5, 17)); cam.fov = 58; cam.updateProjectionMatrix(); cam.lookAt(mp.clone().add(V(0, 5.5, 0)));
  stage.aimSun(mp.clone().setY(0), 50); stage.bloom.strength = 0.5;
  leo.root.visible = false;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.12, { cx: 540, cy: 1000, seed: 9 });
  big(g, s, 'CATCHING THE', 540, 350, 118, '#ffffff', -0.04);
  big(g, s, 'EGG THIEF', 540, 500, 150, '#FFD23F', -0.04);
}
