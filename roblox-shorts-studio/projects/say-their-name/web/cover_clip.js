// Cover for Say Their Name (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Mia on the plank over the lava says "Max? Leo?" sweetly, and the boys POP in beside her - in mid-air.
import * as THREE from 'three';
import * as base from './tower_clip.js';
import { roundRect } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let PM, PX, PL;
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES, { LEDGE_END, SIDE, radial } = base.PLACES;
  base.update(T.tpLeo + 0.55, stage);
  const { mia, max, leo, noob } = base.cast(); noob.root.visible = false;
  const tg = LEDGE_END.clone().add(V(0, 1.2, 0));
  const cam = stage.camera; cam.position.copy(tg).addScaledVector(radial, -11.8).add(V(0, 3.2, 0)); cam.fov = 70; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(tg.clone().add(V(0, 0.2, 0)));
  stage.aimSun(tg, 24); cam.updateMatrixWorld();
  const pr = (a) => { const p = a.bones.Head.localToWorld(V(0, 0.55, 0)).project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920 }; };
  PM = pr(mia); PX = pr(max); PL = pr(leo);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 1000 * s, 420 * s, 540 * s, 1000 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  // Mia's bubble.
  const bx = 540, by = PM.y - 250, text = 'MAX? LEO?';
  g.save(); g.translate(bx * s, by * s); g.font = `${92 * s}px "Luckiest Guy"`;
  const w = g.measureText(text).width / s + 90, h = 150;
  g.beginPath(); g.moveTo(-30 * s, (h / 2 - 4) * s); g.lineTo((PM.x - bx) * 0.8 * s, (PM.y - by - 40) * s); g.lineTo(30 * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#fff'; g.fill(); g.lineWidth = 9 * s; g.strokeStyle = '#ff5c8a'; g.stroke();
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 40 * s); g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 8 * s); g.restore();
  big(g, s, 'POP!', Math.min(960, Math.max(120, PX.x)), PX.y - 130, 96, '#9ff3ff', -0.1);
  big(g, s, 'POP!', Math.min(960, Math.max(120, PL.x)), PL.y - 130, 96, '#9ff3ff', 0.1);
  big(g, s, 'SAY THEIR NAME', 540, 1250, 112, '#ffffff', -0.03);
  big(g, s, 'THEY TELEPORT', 540, 1375, 108, '#ffd23f', -0.03);
  big(g, s, 'TO YOU', 540, 1495, 108, '#ffd23f', -0.03);
}
