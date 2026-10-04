// Cover for The Super Nose Detective (one frame, 1080x1920; everything inside y 290-1560). Max mid-sniff over the evidence
// bag, nose glowing, green smell streaming in; the yellow 70s logo and a CASE #1 tag.
import * as THREE from 'three';
import * as base from './nose_clip.js';
import { W } from './beats.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.cologne + 0.25, stage);                   // the sniff: eyes closed, nose glowing, smell streaming in
  const { max } = base.cast(); max.bones.Head.rotation.x -= 0.38; max.bones.Head.updateMatrixWorld(true);   // lift the sniffing nod so the face reads
  const h = V(0, 0.5, 0).applyMatrix4(max.bones.Head.matrixWorld);
  const cam = stage.camera; cam.position.copy(h).add(V(4.9, -0.4, 2.9)); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(h.clone().add(V(0.1, 0.25, 0.9)));   // side-on so the long nose reads in profile
  stage.aimSun(V(h.x, 0, h.z), 20); stage.bloom.strength = 0.45;
}
function big(g, s, text, x, y, size, color, rot = 0, stroke = '#1a1208') {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'DETECTIVE', 540, 345, 76, '#ffffff', -0.05, '#152435');
  big(g, s, 'MAX', 470, 450, 150, '#FFD23F', -0.05);
  big(g, s, 'SNIFFWELL', 540, 580, 150, '#FFD23F', -0.05);
  g.save(); g.translate(540 * s, 1500 * s); g.rotate(-0.03); g.font = `${58 * s}px "Luckiest Guy"`;
  const w = g.measureText('CASE #1: THE GOLDEN DONUT').width + 60 * s;
  roundRect(g, -w / 2, -48 * s, w, 96 * s, 24 * s); g.fillStyle = 'rgba(214,52,110,.95)'; g.fill();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CASE #1: THE GOLDEN DONUT', 0, 4 * s); g.restore();
}
