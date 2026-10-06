// Cover for She Raced Around The World (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Mia at the pier in front of the giant open book with its "80" crossed out, the headline around her.
import * as THREE from 'three';
import * as base from './race_clip.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.eight + 0.5, stage);                      // the book shot: 80 crossed out, Mia laughing
  const { mia } = base.cast();
  mia.bones['Arm.R'].quaternion.setFromEuler(new THREE.Euler(0.25, 0, -2.3, 'XYZ'));   // one fist up (not both)
  mia.bones['Arm.L'].quaternion.setFromEuler(new THREE.Euler(0.05, 0, 0.12, 'XYZ'));
  mia.root.updateMatrixWorld(true); mia.bones.Head.updateMatrixWorld(true);
  const h = V(0, 0.55, 0).applyMatrix4(mia.bones.Head.matrixWorld);
  const cam = stage.camera;
  cam.position.copy(h).add(V(13.2, -0.3, 4.2)); cam.fov = 50; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(h.clone().add(V(-1.5, -0.6, -1.2)));
  stage.aimSun(h.clone(), 16);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'SHE RACED', 540, 340, 150, '#ffffff', -0.03);
  big(g, s, 'AROUND THE WORLD', 540, 480, 104, '#ffd23f', -0.03);
  big(g, s, 'IN 72 DAYS', 540, 1470, 140, '#7CFC9A', -0.02);
}
