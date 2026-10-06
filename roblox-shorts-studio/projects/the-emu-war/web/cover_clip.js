// Cover for They Lost A War To Emus (one frame, 1080x1920; everything that must read inside y 240..1680).
// The major in his slouch hat, shocked, with the emu army in the wheat behind him; the headline around him.
import * as THREE from 'three';
import * as base from './emu_clip.js';
import { WHEAT } from './kit.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(base.TIMES.admits + 0.1, stage);            // the major facing us, the emus lined up behind
  const g = WHEAT.clone(), cam = stage.camera;
  cam.position.copy(g).add(V(0.8, 4.6, 12.5)); cam.fov = 50; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(g.clone().add(V(0, 4.0, 1)));
  stage.aimSun(g.clone().add(V(0, 3, 0)), 16);
  stage.skyMesh.position.copy(cam.position);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'THEY LOST A WAR', 540, 330, 120, '#ffffff', -0.03);
  big(g, s, 'TO EMUS', 540, 480, 170, '#ffd23f', -0.03);
  big(g, s, '(TRUE STORY)', 540, 1590, 80, '#ff8c42', -0.03);
}
