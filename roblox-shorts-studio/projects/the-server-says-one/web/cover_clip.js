// Cover for The Server Says One (one frame, 1080x1920; everything inside the 3:4 band y 240-1680). Max, scared, in the
// dark lobby; the faceless copy right behind his shoulder with its eyes lit; the player list still says one.
import * as THREE from 'three';
import * as base from './server_clip.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression } from '../../../web/lib/rig.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let idle;
export async function setup(stage) { await base.setup(stage); idle = await loadAnimation('idle'); }
export function samples() { return 6; }
function put(a, pos, rotY, faceE, headY = 0) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, rotY, 0);
  robloxPose(a, [[idle, 0.4]]); a.bones.Head.rotateY(headY);
  a.root.updateMatrixWorld(true); a.root.position.y -= a.soleHeight(); setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(2.0, stage);
  const { max, copy, ent } = base.cast();
  put(max, V(-1.3, 0, 2.6), 0.3, 'shocked', 0.25);
  put(ent, V(1.5, 0, -0.8), -0.15, 'revealed');
  copy.root.visible = false;
  const cam = stage.camera; cam.position.set(0.1, 4.4, 15.5); cam.fov = 34; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(0.2, 3.1, 0);
  stage.aimSun(V(0, 0, 0), 20); stage.bloom.strength = 0.45;
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
  // The player list, large: the contradiction is readable on mute.
  g.save(); g.translate(540 * s, 330 * s);
  roundRect(g, -330 * s, -70 * s, 660 * s, 200 * s, 26 * s); g.fillStyle = 'rgba(10,18,24,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#78e4d8'; g.stroke();
  g.font = `800 ${46 * s}px Montserrat`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#78e4d8'; g.fillText('PLAYERS ONLINE: 1', -290 * s, -10 * s);
  g.fillStyle = '#4b6470'; g.fillRect(-290 * s, 50 * s, 46 * s, 46 * s); g.fillStyle = '#e8f4ed'; g.font = `800 ${52 * s}px Montserrat`; g.fillText('Max', -226 * s, 76 * s);
  g.restore();
  big(g, s, 'THE SERVER', 540, 1380, 150, '#ffffff');
  big(g, s, 'SAYS ONE', 540, 1540, 150, '#78e4d8');
}
