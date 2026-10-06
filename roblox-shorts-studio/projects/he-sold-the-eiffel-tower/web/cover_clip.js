// Cover for He Sold The Eiffel Tower (one frame, 1080x1920; everything that must read sits inside y 290..1560).
// The hook: Max in his top hat handing over the bill of sale, the tower behind.
import * as THREE from 'three';
import * as base from './eiffel_clip.js';
import * as K from './kit.js';
export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(base.W_SOLD + 0.5, stage);
  const cam = stage.camera; cam.position.copy(K.PARIS).add(V(0.2, 2.2, 48.6)); cam.fov = 64; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(K.PARIS.clone().add(V(0, 30, 0))); stage.aimSun(K.PARIS.clone().add(V(0, 0, 40)), 30);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s; g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0);
  g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE SOLD THE', 540, 360, 96, '#ffffff', -0.03);
  big(g, s, 'EIFFEL TOWER', 540, 490, 128, '#ffd23f', -0.03);
  big(g, s, 'TRUE STORY · 1925', 540, 610, 64, '#ffffff', -0.02);
}
