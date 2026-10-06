// Cover for The Penguin General (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// The penguin passing the guard line as they salute him; the headline around him.
import * as THREE from 'three';
import * as base from './penguin_clip.js';
import { PATH_Z, LINE_Z } from './kit.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
const T0 = W.salute1 + 0.4;                                // the line salutes as he passes
export function update(t, stage) {
  base.update(T0, stage);
  base.penguinObj().rotation.y = 0.15;                     // turned to camera: white front and face
  const px = -7.5 + 2.4 * T0, cam = stage.camera;          // his hook walk: pengWalk from x -7.5 at 2.4 units/s
  cam.position.set(px + 2.0, 3.0, PATH_Z + 8.0); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(V(px - 0.2, 3.0, LINE_Z));
  stage.aimSun(V(px, 2, PATH_Z), 12);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'THIS PENGUIN IS A', 540, 340, 90, '#ffffff', -0.03);
  big(g, s, 'MAJOR GENERAL', 540, 470, 115, '#ffd23f', -0.03);
  big(g, s, 'THEY SALUTE HIM', 540, 1440, 100, '#ffffff', -0.03);
}
