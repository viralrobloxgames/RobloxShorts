// Cover for He Won The Marathon By Car (one frame, 1080x1920; everything that must read sits inside y 290..1560,
// x 60..1020). The hook moment: Max waving from the back seat of the car as it putters past Leo on foot.
import * as THREE from 'three';
import * as base from './marathon_clip.js';
import { setExpression } from '../../../web/lib/rig.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(0.5, stage);                               // the car alongside Leo; both faces read
  const { max, leo } = base.cast(); setExpression(max, 'laugh'); setExpression(leo, 'surprised');
  const cam = stage.camera, mp = max.root.position.clone(), k = Math.round(t * 30);     // mp: Max in the back seat
  const CAMS = [[V(10, 5.8, 6.5), V(-0.5, 4.6, -1.6), 50], [V(13, 7.5, 3.5), V(0.5, 4.4, -1.8), 46], [V(9, 5.0, 8.5), V(0, 4.4, -2.6), 52]];
  const [o, tg, fov] = CAMS[Math.min(k, CAMS.length - 1)];
  cam.position.copy(mp).add(o); cam.fov = fov; cam.near = 0.5; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(mp.clone().add(tg)); const car = mp;
  stage.aimSun(V(car.x, 3, 0), 40);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE "WON" THE', 540, 350, 100, '#ffffff', -0.03);
  big(g, s, 'MARATHON', 540, 475, 140, '#ffd23f', -0.03);
  big(g, s, 'BY CAR', 540, 610, 130, '#ff5a3a', -0.03);
  big(g, s, '1904 · TRUE STORY', 540, 1490, 76, '#ffffff', -0.02);
}
