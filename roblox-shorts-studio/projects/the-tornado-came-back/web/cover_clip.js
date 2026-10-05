// Cover for The Tornado Came Back (one frame, 1080x1920; everything that must read sits inside y 290..1560, x 60..1020).
// The hook moment: the funnel tearing through the planes at night, a fighter in the air, Max and Leo running for it.
import * as THREE from 'three';
import * as base from './tornado_clip.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(1.45, stage);                              // a lightning flash lights the funnel; both faces read
  const cam = stage.camera;
  cam.position.set(-92.6, 3.5, 71.5); cam.fov = 58; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(V(-93, 11.5, 0));
  stage.aimSun(V(-92, 3, 30), 70);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'THEY PREDICTED', 540, 360, 104, '#ffffff', -0.03);
  big(g, s, 'THE TORNADO', 540, 500, 140, '#ffd23f', -0.03);
  big(g, s, '1948 · TRUE STORY', 540, 1500, 78, '#ffffff', -0.02);
}
