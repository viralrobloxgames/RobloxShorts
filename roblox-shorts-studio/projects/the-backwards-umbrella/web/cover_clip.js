// Cover for The Backwards Umbrella (one frame, 1080x1920; everything that must read inside y 290..1560, x 60..1020).
// Leo, bone dry and grinning under his umbrella, in a downpour that soaks everyone around him.
import * as THREE from 'three';
import * as base from './umbrella_clip.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  const T = base.TIMES;
  base.update(T.cheer + 1.0, stage);                     // after the fire: everyone soaked and cheering, Leo dry
  const { leo } = base.cast(); leo.root.updateMatrixWorld(true);
  const lp = leo.root.position.clone();
  const cam = stage.camera; cam.position.copy(lp).add(V(-0.6, 4.2, 17)); cam.fov = 42; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(lp.clone().add(V(-0.6, 7.4, 0)));
  stage.aimSun(lp, 22);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 960 * s, 420 * s, 540 * s, 960 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  big(g, s, 'HIS UMBRELLA', 540, 330, 112, '#ffffff', -0.03);
  big(g, s, 'RAINS ON', 540, 460, 112, '#ffffff', -0.03);
  big(g, s, 'EVERYONE ELSE', 540, 590, 104, '#ffd23f', -0.03);
}
