// Cover for He Flew The Wrong Way (one frame, 1080x1920; everything that must read sits inside y 290..1560, x 60..1020).
// The hook moment: the little patched plane rolling at dawn, Max grinning out of the cabin window, the CALIFORNIA sign
// pointing the other way.
import * as THREE from 'three';
import * as base from './wrongway_clip.js';
import { setExpression } from '../../../web/lib/rig.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(1.0, stage);
  const { max } = base.cast(); setExpression(max, 'laugh');
  const cam = stage.camera, pp = max.root.position;
  cam.position.set(pp.x + 9.5, 6.0, 13.5); cam.fov = 54; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(V(pp.x - 1.5, 5.2, 0.5));
  stage.skyMesh.position.copy(cam.position);
  stage.aimSun(V(pp.x, 3, 0), 30);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE FLEW THE', 540, 360, 110, '#ffffff', -0.03);
  big(g, s, 'WRONG WAY', 540, 500, 150, '#ffd23f', -0.03);
  big(g, s, '...ON PURPOSE?', 540, 1380, 96, '#7CFC9A', -0.02);
  big(g, s, '1938 · TRUE STORY', 540, 1500, 72, '#ffffff', -0.02);
}
