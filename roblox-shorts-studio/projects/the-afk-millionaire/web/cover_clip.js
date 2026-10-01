// Cover image for The AFK Millionaire (render one frame): low angle up at the noob tumbling through the sky after the
// rocket, "AFK" over his head, the hook title and the prize. Reuses the video's scene at story time 43.8 s.
import * as THREE from 'three';
import * as base from './afk_clip.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
export const setup = base.setup;
export function samples() { return 6; }
let cam, headPos;
export function update(t, stage) {
  base.update(0.16, stage);                              // hook time 0.16 s = story 43.45 s: the rocket has just exploded
  const noob = base.cast().noob.root;
  // A still can be posed freely: lift him above the blast, tumbling but facing the camera.
  noob.position.set(4, 4.6, 0.6); noob.rotation.set(-0.15, 0.35, 0.42, 'YXZ'); noob.updateMatrixWorld(true);
  const c = new THREE.Vector3(4, 7, 0.6);
  stage.camera.position.set(5.6, 3.2, 13.5); stage.camera.fov = 50; stage.camera.updateProjectionMatrix();
  stage.camera.lookAt(c.clone().add(new THREE.Vector3(0, -0.6, 0)));
  stage.aimSun(new THREE.Vector3(4, 0, 0.6), 20); stage.bloom.strength = 0.45;
  headPos = new THREE.Vector3(0, 6.3, 0).applyQuaternion(noob.quaternion).add(noob.position); cam = stage.camera;   // above his head
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.5, { cx: 540, cy: 960, seed: 5 });
  // A still: the tag sits just above-right of his head (placed by eye on the rendered frame).
  const x = 410, y = 560;
  g.save(); g.translate(x * s, y * s); g.rotate(0.1); g.font = `${64 * s}px "Luckiest Guy"`; const w = g.measureText('AFK').width + 56 * s;
  roundRect(g, -w / 2, -48 * s, w, 96 * s, 28 * s); g.fillStyle = 'rgba(40,40,48,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AFK', 0, 4 * s); g.restore();
  big(g, s, "HE WASN'T", 540, 300, 150, '#ffffff', -0.04);
  big(g, s, 'EVEN PLAYING', 540, 450, 150, '#FFD23F', -0.04);
  g.save(); g.translate(540 * s, 1440 * s); g.rotate(0.05);
  roundRect(g, -340 * s, -100 * s, 680 * s, 200 * s, 44 * s); g.fillStyle = '#152435'; g.fill(); g.lineWidth = 10 * s; g.strokeStyle = '#FFD23F'; g.stroke(); g.restore();
  big(g, s, '1,000,000 COINS', 540, 1445, 96, '#FFD23F', 0.05);
}
