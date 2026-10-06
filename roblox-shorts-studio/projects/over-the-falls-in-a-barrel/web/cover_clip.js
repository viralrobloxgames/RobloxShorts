// Cover for She Went Over Niagara Falls In A Barrel (one frame, 1080x1920; everything that must read sits inside
// y 290..1560, x 60..1020). The hook moment: Mia in the barrel on the dock, the falls' mist behind, Leo beside her.
import * as THREE from 'three';
import * as base from './barrel_clip.js';
import { setExpression } from '../../../web/lib/rig.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(1.6, stage);                               // Mia settled in the barrel; both faces read
  const { mia, leo } = base.cast(); setExpression(mia, 'determined'); setExpression(leo, 'surprised');
  const cam = stage.camera, b = mia.root.position.clone();
  cam.position.copy(b).add(V(-10.5, 4.4, 2.6)); cam.fov = 48; cam.near = 0.5; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(b.clone().add(V(1.0, 3.6, 0.2)));
  stage.aimSun(b.clone(), 30);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'AGE 63.', 540, 350, 110, '#ffd23f', -0.03);
  big(g, s, 'NIAGARA FALLS.', 540, 480, 104, '#ffffff', -0.03);
  big(g, s, 'IN A BARREL.', 540, 605, 116, '#6ec8ff', -0.03);
  big(g, s, '1901 · TRUE STORY', 540, 1490, 76, '#ffffff', -0.02);
}
