// Cover for The Guardian Quits (one frame, 1080x1920; key content inside the 3:4 band y 290-1560): the T-rex in his
// disguise (sunglasses, hoodie, "Player" tag) with a pile of stolen-back eggs on his back; "THE GUARDIAN / QUITS".
// Standalone story: no part tag.
import * as THREE from 'three';
import * as base from './guardian_clip.js';
import { W } from './beats.js';
import { speedLines, roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.took + 1.0, stage);
  const { rex, leo } = base.cast(), rp = rex.root.position.clone();
  leo.root.visible = false;
  const cam = stage.camera; cam.position.copy(rp).add(V(24, 15, 60)); cam.fov = 44; cam.updateProjectionMatrix(); cam.lookAt(rp.clone().add(V(1, 17, 10)));
  stage.aimSun(rp.clone().setY(0), 40); stage.bloom.strength = 0.35;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.12, { cx: 540, cy: 1000, seed: 4 });
  big(g, s, 'THE GUARDIAN', 540, 360, 124, '#ffffff', -0.04);
  big(g, s, 'QUITS', 540, 520, 190, '#FFD23F', -0.04);
  g.save(); g.translate(540 * s, 1500 * s); g.rotate(0.04); g.font = `${60 * s}px "Luckiest Guy"`; const txt = 'GUARDIAN REVIEW: ★☆☆☆☆', w = g.measureText(txt).width + 50 * s;
  roundRect(g, -w / 2, -46 * s, w, 92 * s, 24 * s); g.fillStyle = 'rgba(220,40,60,.96)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 4 * s); g.restore();
}
