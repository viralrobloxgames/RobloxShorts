// Cover for The Six Million Dollar Banana (one frame, 1080x1920; everything that must read inside y 290..1560,
// x 60..1020). Leo on the stage holding up the banana, smug, the $6,200,000 screen behind; the headline around him.
import * as THREE from 'three';
import * as base from './banana_clip.js';
import { STAGE } from './kit.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(0.5, stage);                                // the hook: on stage, banana held up
  const cam = stage.camera, g = STAGE;
  cam.position.copy(g).add(V(1.4, 7.4, 9.0)); cam.fov = 44; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();   // high enough to clear the stage lip
  cam.lookAt(g.clone().add(V(1.0, 5.0, -2.0)));
  stage.aimSun(g.clone().add(V(1, 4, -2)), 14);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE PAID', 540, 340, 110, '#ffffff', -0.03);
  big(g, s, '$6,200,000', 540, 470, 150, '#ffd23f', -0.03);
  big(g, s, 'FOR A BANANA', 540, 1440, 120, '#ffffff', -0.03);
}
