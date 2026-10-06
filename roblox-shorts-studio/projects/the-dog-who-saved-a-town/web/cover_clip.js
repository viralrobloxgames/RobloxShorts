// Cover for The Dog Who Saved A Town (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Togo leading the team through the snow toward the camera, the headline around him.
import * as THREE from 'three';
import * as base from './dog_clip.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(base.TIMES.dogs + 0.9, stage);              // the team bursting in through the snow
  const cam = stage.camera;
  stage.scene.updateMatrixWorld(true);
  const lead = base.leadPos();
  cam.position.copy(lead).add(V(7.5, 2.4, 2.6)); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(lead.clone().add(V(-3.0, 1.0, 0.4)));
  stage.aimSun(lead.clone(), 16);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'THE DOG WHO', 540, 340, 120, '#ffffff', -0.03);
  big(g, s, 'SAVED A TOWN', 540, 480, 130, '#ffd23f', -0.03);
  big(g, s, '...AND GOT NO STATUE', 540, 1470, 80, '#9fd3ff', -0.02);
}
