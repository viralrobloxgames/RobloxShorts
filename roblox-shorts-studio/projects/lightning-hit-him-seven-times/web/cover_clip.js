// Cover for Lightning Hit Him Seven Times (one frame, 1080x1920; everything that must read inside y 290..1560,
// x 60..1020). The hook moment: the bolt hitting Max in the clearing, his hat flying off, sparks; the headline around him.
import * as THREE from 'three';
import * as base from './lightning_clip.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(0.0, stage);                               // the bolt lands on him
  const cam = stage.camera;
  cam.position.set(1.6, 3.4, 11.5); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(V(0.1, 5.6, 0));
  stage.aimSun(V(0, 3, 0), 14);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
function boltIcon(g, x, y, h, fill) {
  const k = h / 10; g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); g.moveTo(1.2, -5); g.lineTo(-2.6, 0.6); g.lineTo(-0.2, 0.6); g.lineTo(-1.4, 5); g.lineTo(2.8, -1.2); g.lineTo(0.3, -1.2); g.lineTo(1.6, -5); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 1.2; g.strokeStyle = '#0c1020'; g.stroke(); g.fillStyle = fill; g.fill(); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HIT BY LIGHTNING', 540, 360, 104, '#ffffff', -0.03);
  big(g, s, '7 TIMES', 540, 520, 190, '#ffd23f', -0.03);
  for (let i = 0; i < 7; i++) boltIcon(g, (180 + i * 120) * s, 1330 * s, 96 * s, '#ffd23f');
  big(g, s, 'AND SURVIVED', 540, 1470, 112, '#7CFC9A', -0.02);
}
