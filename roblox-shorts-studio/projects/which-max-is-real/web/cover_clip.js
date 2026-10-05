// Cover for Which Max Is Real? (Part 2; one frame, 1080x1920; everything inside the 3:4 band y 240-1680). Both Maxes
// with a hand up (one of them raised the wrong one), Mia behind them, the question as the headline.
import * as THREE from 'three';
import * as base from './finale_clip.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression } from '../../../web/lib/rig.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let idle;
const ARM = new THREE.Euler();
export async function setup(stage) { await base.setup(stage); idle = await loadAnimation('idle'); }
export function samples() { return 6; }
function put(a, pos, rotY, faceE, { mirror = false, raise = false } = {}) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, rotY, 0); a.root.scale.set(mirror ? -1 : 1, 1, 1);
  robloxPose(a, [[idle, 0.4]]);
  if (raise) { ARM.set(0.1, 0, -2.45, 'XYZ'); a.bones['Arm.R'].quaternion.setFromEuler(ARM); }
  a.root.updateMatrixWorld(true); a.root.position.y -= a.soleHeight(); setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(2.0, stage);
  const { max, copy, mia } = base.cast();
  put(max, V(-2.3, 0, -13.5), 0.12, 'shocked', { raise: true });
  put(copy, V(2.1, 0, -13.5), -0.12, 'evil_grin', { mirror: true, raise: true });
  put(mia, V(-0.1, 0, -18.5), 0, 'suspicious');
  const cam = stage.camera; cam.position.set(-0.1, 4.8, 0.5); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(-0.1, 3.4, -13.5);
  stage.aimSun(V(0, 0, -13), 20); stage.bloom.strength = 0.45;
}
function big(g, s, text, x, y, size, color) {
  g.save(); g.translate(x * s, y * s); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0a1218'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 900 * s, 350 * s, 540 * s, 900 * s, 1100 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  g.save(); g.translate(540 * s, 300 * s); g.font = `${58 * s}px "Luckiest Guy"`;
  roundRect(g, -140 * s, -46 * s, 280 * s, 92 * s, 22 * s); g.fillStyle = '#78e4d8'; g.fill();
  g.fillStyle = '#0a1218'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 2', 0, 4 * s); g.restore();
  big(g, s, 'WHICH MAX', 540, 1380, 150, '#ffffff');
  big(g, s, 'IS REAL?', 540, 1540, 150, '#78e4d8');
}
