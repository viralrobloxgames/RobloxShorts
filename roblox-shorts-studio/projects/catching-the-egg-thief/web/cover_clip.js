// Cover for Catching the Egg Thief (one frame, 1080x1920; key content inside the 3:4 band y 240-1680): the hooded thief
// (glowing eyes) running at us with the Mythic egg a second from hatching; "CATCHING THE / EGG THIEF" and the timer.
// Standalone story: no part tag.
import * as THREE from 'three';
import * as base from './thief_clip.js';
import { W } from './beats.js';
import { speedLines, roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let cam, eggAt;
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.one - 0.1, stage);
  const { max } = base.cast(), mp = max.root.position.clone(), ry = max.root.rotation.y, f = V(Math.sin(ry), 0, Math.cos(ry));
  cam = stage.camera; cam.position.copy(mp).add(f.clone().multiplyScalar(17)).add(V(0, 2.4, 0)); cam.fov = 46; cam.updateProjectionMatrix(); cam.lookAt(mp.clone().add(V(0, 4.6, 0)));
  eggAt = mp.clone().add(f.clone().multiplyScalar(1.5)).add(V(0, 5.2, 0));
  stage.aimSun(mp.clone().setY(0), 30); stage.bloom.strength = 0.5;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.14, { cx: 540, cy: 1050, seed: 9 });
  big(g, s, 'CATCHING THE', 540, 330, 118, '#ffffff', -0.04);
  big(g, s, 'EGG THIEF', 540, 480, 150, '#FFD23F', -0.04);
  const x = 540, y = 1560;
  g.save(); g.translate(x * s, y * s); g.rotate(0.05); g.font = `${64 * s}px "Luckiest Guy"`; const w = g.measureText('HATCH: 0:01').width + 50 * s;
  roundRect(g, -w / 2, -48 * s, w, 96 * s, 24 * s); g.fillStyle = 'rgba(220,40,60,.96)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HATCH: 0:01', 0, 4 * s); g.restore();
}
