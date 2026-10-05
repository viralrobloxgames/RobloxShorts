// Cover for The Postman's Palace (one frame, 1080x1920; everything that must read sits inside y 290..1560).
// The finished pebble palace in the sun with Max proud in front of it.
import * as THREE from 'three';
import * as base from './palace_clip.js';
import { setExpression } from '../../../web/lib/rig.js';
import * as K from './kit.js';
export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(base.TIMES.done + 1.2, stage);
  const { max } = base.cast(); setExpression(max, 'cool');
  const cam = stage.camera; cam.position.copy(K.PALACE).add(V(-16, 5.5, 40)); cam.fov = 50; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(K.PALACE.clone().add(V(-6, 10, 6))); stage.aimSun(K.PALACE.clone(), 50);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s; g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0);
  g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'A POSTMAN BUILT THIS', 540, 360, 84, '#ffffff', -0.03);
  big(g, s, 'FROM PEBBLES', 540, 490, 128, '#ffd23f', -0.03);
  big(g, s, '33 YEARS · TRUE STORY', 540, 1500, 72, '#ffffff', -0.02);
}
