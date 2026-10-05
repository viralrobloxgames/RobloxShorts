// Cover for Say Their Name (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Max at the foot of the tower yells "LEO!" and Leo, one jump from the top, vanishes in a POP.
import * as THREE from 'three';
import * as base from './tower_clip.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let P1, P2;
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES;
  base.update(T.tp1 + 0.06, stage);                      // the teleport: puffs at the top, Leo dropping in beside Max
  const { max, leo } = base.cast(); max.root.updateMatrixWorld(true);
  const mp = max.root.position.clone();
  const cam = stage.camera; cam.position.copy(mp).add(V(3.6, 1.6, 9.5)); cam.fov = 58; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(mp.clone().add(V(-1.2, 14, -9)));
  stage.aimSun(V(0, 10, 6), 40);
  cam.updateMatrixWorld();
  const pr = (v) => { const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920 }; };
  P1 = pr(max.bones.Head.localToWorld(V(0, 0.55, 0))); P2 = pr(V(0, 45.5 + 2.6, 1.4));
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 960 * s, 420 * s, 540 * s, 960 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  // "LEO!" from Max.
  const bx = Math.min(860, Math.max(220, P1.x - 120)), by = Math.max(900, P1.y - 330);
  g.save(); g.translate(bx * s, by * s); g.font = `${120 * s}px "Luckiest Guy"`;
  const w = g.measureText('LEO!').width / s + 90, h = 170;
  g.beginPath(); g.moveTo(-10 * s, (h / 2 - 4) * s); g.lineTo((P1.x - bx) * 0.5 * s, (h / 2 + 90) * s); g.lineTo(50 * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#fff'; g.fill(); g.lineWidth = 9 * s; g.strokeStyle = '#3a86ff'; g.stroke();
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 40 * s); g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LEO!', 0, 8 * s); g.restore();
  big(g, s, 'POP!', Math.min(900, Math.max(200, P2.x + 40)), Math.max(320, P2.y + 40), 120, '#9ff3ff', -0.08);
  big(g, s, 'SAY THEIR NAME', 540, 1300, 112, '#ffffff', -0.03);
  big(g, s, 'THEY TELEPORT', 540, 1425, 108, '#ffd23f', -0.03);
  big(g, s, 'TO YOU', 540, 1545, 108, '#ffd23f', -0.03);
}
