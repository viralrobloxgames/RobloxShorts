// Cover for Feeding the Prism Kitsune (one frame, 1080x1920; key content inside the 3:4 band y 240-1680): the giant Prism
// Kitsune on its plinth with the Prism Blade turning beside it and Max staring up; "FEEDING THE / PRISM KITSUNE".
// Standalone promo: no part tag.
import * as THREE from 'three';
import * as base from './kitsune_clip.js';
import { W } from './beats.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.prize, stage);
  const { blade, max } = base.cast(), cam = stage.camera;
  blade.position.set(8.2, 6.8, 15); blade.rotation.set(0, -0.3, 0.14); blade.scale.setScalar(1.7);
  max.root.visible = true; max.root.position.set(6.6, 0, 17.6); max.root.rotation.y = Math.PI + 0.3; max.root.updateMatrixWorld(true);
  cam.position.set(2.5, 2.2, 38); cam.fov = 54; cam.updateProjectionMatrix(); cam.lookAt(V(3.6, 9.8, 8));
  stage.aimSun(V(2, 0, 8), 40); stage.bloom.strength = 0.55;
}
function big(g, s, text, x, y, size, fill, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#1a1440'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  if (fill === 'prism') { const w = g.measureText(text).width, gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5ae6ff'); gr.addColorStop(1, '#b48cff'); g.fillStyle = gr; } else g.fillStyle = fill;
  g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'FEEDING THE', 540, 350, 120, '#ffffff', -0.04);
  big(g, s, 'PRISM KITSUNE', 540, 495, 140, 'prism', -0.04);
  g.save(); g.translate(540 * s, 1490 * s); g.rotate(0.05); g.font = `${62 * s}px "Luckiest Guy"`; const txt = 'PRISM BLADE: 5%', w = g.measureText(txt).width + 54 * s;
  roundRect(g, -w / 2, -50 * s, w, 100 * s, 26 * s); const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5ae6ff'); gr.addColorStop(1, '#965aff'); g.fillStyle = gr; g.fill();
  g.lineWidth = 7 * s; g.strokeStyle = '#ffffff'; g.stroke(); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.strokeStyle = '#1a1440'; g.lineWidth = 10 * s; g.strokeText(txt, 0, 5 * s); g.fillText(txt, 0, 5 * s); g.restore();
}
