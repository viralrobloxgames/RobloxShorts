// Cover for He Traded A Paperclip For A House (one frame, 1080x1920; everything that must read inside y 290..1560,
// x 60..1020). Max on the porch of the house holding up a giant red paperclip, the town cheering, the headline around him.
import * as THREE from 'three';
import * as base from './paperclip_clip.js';
import { HOUSE, PORCH_Y } from './kit.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.house3 + 0.4, stage);                    // on the porch, the yard clapping
  const { max } = base.cast(), P = base.props();
  P.key.visible = false;
  max.bones['Arm.R'].updateMatrixWorld(true);
  const g = V(0, -1.8, 0).applyMatrix4(max.bones['Arm.R'].matrixWorld);
  P.clip.visible = true; P.clip.position.copy(g).add(V(0, -0.35, 0)); P.clip.rotation.set(0, 0.1, 0); P.clip.scale.setScalar(2.3);
  const cam = stage.camera, h = HOUSE.clone();
  cam.position.copy(h).add(V(1.0, 6.2, 31)); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(h.clone().add(V(-0.6, 8.2, 1.4)));
  stage.aimSun(h.clone().add(V(0, 3, 3)), 24);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE TRADED', 540, 330, 112, '#ffffff', -0.03);
  big(g, s, '1 PAPERCLIP', 540, 470, 150, '#ff4d5a', -0.03);
  big(g, s, 'FOR A HOUSE', 540, 1500, 150, '#ffd23f', -0.03);
}
