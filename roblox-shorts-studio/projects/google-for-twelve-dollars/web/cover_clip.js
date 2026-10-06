// Cover for He Bought Google For 12 Dollars (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Leo on top of the world beside his OWNER: LEO / google.com flag, with the headline above.
import * as THREE from 'three';
import * as base from './google_clip.js';
import { GLOBE, GLOBE_R } from './kit.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES;
  base.update(T.flag + 1.4, stage);                       // on the globe, flag planted, laughing
  const top = GLOBE.clone().add(V(0, GLOBE_R, 0));
  const cam = stage.camera; cam.position.copy(top).add(V(5.0, 1.4, 17.5)); cam.fov = 48; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(top.clone().add(V(2.2, 4.4, 0)));
  stage.aimSun(top, 20);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE BOUGHT', 540, 340, 130, '#ffffff', -0.03);
  big(g, s, 'GOOGLE', 540, 480, 170, '#ffd23f', -0.03);
  big(g, s, 'FOR $12', 540, 1490, 160, '#7CFC9A', -0.03);
}
