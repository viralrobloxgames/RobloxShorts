// Cover for Whatever Mia Draws (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Leo's perfect lion, just off the page, roaring at the class. Headline: the premise; tag: the pencil did it.
import * as THREE from 'three';
import * as base from './mia_clip.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES;
  base.update(T.roar + 0.45, stage);                     // mid-roar, jaws wide
  const cam = stage.camera; cam.position.set(0.0, 4.2, 9.2); cam.fov = 54; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(-7.0, 3.9, 6.4);
  stage.aimSun(V(-7, 4, 6.4), 22); stage.bloom.strength = 0.25;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 960 * s, 420 * s, 540 * s, 960 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  big(g, s, 'WHATEVER', 540, 380, 140, '#ffffff', -0.03);
  big(g, s, 'SHE DRAWS', 540, 530, 140, '#ffffff', -0.03);
  big(g, s, 'COMES ALIVE', 540, 690, 128, '#ffd23f', -0.03);
  // the tag: a pencil-yellow label
  g.save(); g.translate(540 * s, 1460 * s); g.rotate(0.03);
  g.font = `${76 * s}px "Luckiest Guy"`; const w = g.measureText('HE DREW IT TOO WELL').width + 80 * s, h = 140 * s;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 38 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 9 * s; g.strokeStyle = '#ffb703'; g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HE DREW IT TOO WELL', 0, 6 * s);
  g.restore();
}
