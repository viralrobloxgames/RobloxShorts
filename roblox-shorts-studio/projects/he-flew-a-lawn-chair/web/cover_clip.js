// Cover for He Flew A Lawn Chair (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Max in the lawn chair high in the sky under the balloon cluster, the headline around him.
import * as THREE from 'three';
import * as base from './chair_clip.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.sixteen + 0.4, stage);                    // 16,000 ft, scared
  const { max } = base.cast(); max.bones.Head.updateMatrixWorld(true);
  const h = V(0, 0.55, 0).applyMatrix4(max.bones.Head.matrixWorld);
  const cam = stage.camera;
  cam.position.copy(h).add(V(3.0, -2.6, 14.5)); cam.fov = 50; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(h.clone().add(V(0, 2.4, 0)));
  stage.aimSun(h.clone(), 20);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE FLEW A', 540, 340, 120, '#ffffff', -0.03);
  big(g, s, 'LAWN CHAIR', 540, 490, 160, '#ffd23f', -0.03);
  big(g, s, 'TO 16,000 FT', 540, 1470, 130, '#ffffff', -0.02);
}
