// Cover for Every Lie Comes True (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// The dragon has just smashed through the classroom window, jaws open, right behind Leo, who looks very pleased with
// himself. Headline: his lie, and what it did.
import * as THREE from 'three';
import * as base from './lie_clip.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES;
  base.update(T.boom + 0.5, stage);                      // the roar, just through the window
  const { leo, max, noob, room } = base.cast(); noob.root.visible = false;
  for (const x of [...room.shards, ...room.chunks]) x.mesh.visible = false;           // debris off, the broken hole stays
  leo.setFace('smug'); max.setFace('shocked');
  const cam = stage.camera; cam.position.set(-6.2, 8 + 4.2, 3.4); cam.fov = 52; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(-2.2, 8 + 5.4, -6.6);
  stage.aimSun(V(-3, 8, -5), 22); stage.bloom.strength = 0.3;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 960 * s, 420 * s, 540 * s, 960 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  big(g, s, 'EVERY LIE', 540, 400, 150, '#ffffff', -0.03);
  big(g, s, 'COMES TRUE', 540, 560, 150, '#ffd23f', -0.03);
  // Leo's lie, as a speech bubble with the red LIE tag.
  g.save(); g.translate(540 * s, 1470 * s); g.rotate(0.03);
  g.font = `${78 * s}px "Luckiest Guy"`; const w = g.measureText('"A DRAGON ATE IT."').width + 80 * s, h = 150 * s;
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 9 * s; g.strokeStyle = '#9b5cff'; g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('"A DRAGON ATE IT."', 0, 6 * s);
  g.translate(-w / 2 + 20 * s, -h / 2); g.rotate(-0.12); g.font = `${48 * s}px "Luckiest Guy"`;
  const tw = g.measureText('LIE').width + 44 * s; g.beginPath(); g.roundRect(-10 * s, -38 * s, tw, 76 * s, 18 * s); g.fillStyle = '#ff3b5c'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#fff'; g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('LIE', 12 * s, 4 * s);
  g.restore();
}
