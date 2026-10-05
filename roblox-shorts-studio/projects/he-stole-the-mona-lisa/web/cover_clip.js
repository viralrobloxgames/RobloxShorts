// Cover for He Stole The Mona Lisa (one frame, 1080x1920; everything that must read inside y 240..1680, x 60..1020).
// Max in his white smock holding the Mona Lisa, smug, the four empty pegs on the wall behind him; the headline around him.
import * as THREE from 'three';
import * as base from './mona_clip.js';
import { GALLERY, ML_Y } from './kit.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(2.6, stage);                               // in the gallery, painting in hands, facing us
  const { max, skye } = base.cast(); skye.root.visible = false;
  const g = GALLERY.clone(), cam = stage.camera;
  max.root.position.set(g.x + 0.9, max.root.position.y, g.z - 6.4); max.root.rotation.y = -0.12; max.root.updateMatrixWorld(true);
  const P = base.props(), L = max.bones['Arm.L'], R = max.bones['Arm.R'];
  const gl = V(0.5, -1.3, 0).applyMatrix4(L.matrixWorld), gr = V(-0.5, -1.3, 0).applyMatrix4(R.matrixWorld);
  P.ml.position.copy(gl.lerp(gr, 0.5)).add(V(0, 0.05, 0)); P.ml.rotation.set(0, -0.12, 0);
  cam.position.copy(g).add(V(0.4, 4.2, 6.2)); cam.fov = 50; cam.up.set(0, 1, 0); cam.updateProjectionMatrix();
  cam.lookAt(g.clone().add(V(0.2, 3.6, -8)));
  stage.aimSun(g.clone().add(V(0, 3, -6)), 14);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'HE STOLE THE', 540, 330, 118, '#ffffff', -0.03);
  big(g, s, 'MONA LISA', 540, 475, 170, '#ffd23f', -0.03);
  big(g, s, 'AND MADE HER', 540, 1440, 104, '#ffffff', -0.03);
  big(g, s, 'FAMOUS', 540, 1575, 150, '#ff4d5a', -0.03);
}
