// Cover for The Last Penalty (one frame, 1080x1920; everything inside the 3:4 band y 240-1680). Over Mia's shoulder
// from the goal line: Leo stands over the ball with his eyes squeezed shut. The question is which way he'll go.
import * as THREE from 'three';
import * as base from './penalty_clip.js';
import { W } from './beats.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression } from '../../../web/lib/rig.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let idle;
export async function setup(stage) { await base.setup(stage); idle = await loadAnimation('idle'); }
export function samples() { return 6; }
function put(a, pos, rotY, faceE) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, rotY, 0); a.root.scale.set(1, 1, 1);
  robloxPose(a, [[idle, 0.4]]);
  a.root.updateMatrixWorld(true); a.root.position.y -= a.soleHeight(); setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(W.stay - 0.4, stage);                      // the hush before the retake: ball on the spot
  const { mia, leo, max, noob } = base.cast();
  put(leo, V(-0.7, 0, 19.6), Math.PI, 'squeezed');
  put(mia, V(2.15, 0, 8.2), -0.1, 'suspicious');
  max.root.visible = false; noob.root.visible = false;
  const cam = stage.camera; cam.position.set(2.0, 6.0, 3.0); cam.fov = 34; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(-0.6, 3.4, 19.6);
  stage.aimSun(V(0, 0, 15), 30); stage.bloom.strength = 0.3;
}
function big(g, s, text, x, y, size, color) {
  g.save(); g.translate(x * s, y * s); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 900 * s, 400 * s, 540 * s, 900 * s, 1150 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  big(g, s, 'HE CLOSED', 540, 400, 140, '#ffffff');
  big(g, s, 'HIS EYES', 540, 560, 140, '#ffd23f');
}
