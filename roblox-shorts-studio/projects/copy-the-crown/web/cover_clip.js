// Cover for Copy the Crown (one frame, 1080x1920; everything that must read inside the 3:4 band y 240-1680).
// Leo in the crown at the front with one arm up; the whole server behind him in a V, copying the same arm, same moment.
import * as THREE from 'three';
import * as base from './crown_clip.js';
import { setExpression } from '../../../web/lib/rig.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SPOTS = { leo: [0, 0, 0], mia: [3.3, 0, 2.6], max: [-3.3, 0, 2.6], skye: [1.7, 0, 6.2], noob: [-1.7, 0, 6.2] };
const FACE = { leo: 'evil_grin', mia: 'annoyed', max: 'shocked', skye: 'surprised', noob: 'confused' };
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(W.copies + 0.55, stage);                            // everyone's right arm is up
  const cast = base.cast(), fits = base.crownFits();
  const ORIGIN = V(0, 0, -4);                                     // the middle of the arena, everyone facing the camera (-Z)
  for (const [k, a] of Object.entries(cast)) {
    const y = a.root.position.y;
    a.root.position.copy(ORIGIN).add(V(...SPOTS[k])); a.root.position.y = y; a.root.rotation.set(0, Math.PI, 0); a.root.visible = true;
    setExpression(a, FACE[k]); a.root.updateMatrixWorld(true);
  }
  // The crown on Leo.
  const fit = fits.leo, c = fits.noob.item, leo = cast.leo;
  c.position.copy(leo.bones.Head.localToWorld(fit.offset.clone())); c.quaternion.copy(leo.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(fit.scale);
  const tg = ORIGIN.clone().add(V(0, 4.6, 3));
  const cam = stage.camera; cam.position.copy(tg).add(V(-0.8, 2.2, -17.5)); cam.fov = 46; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(tg);
  stage.aimSun(tg, 24); cam.updateMatrixWorld();
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  const r = g.createRadialGradient(540 * s, 1000 * s, 420 * s, 540 * s, 1000 * s, 1200 * s);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
  big(g, s, 'EVERYONE COPIES', 540, 360, 104, '#ffffff', -0.03);
  big(g, s, 'THE CROWN', 540, 480, 132, '#ffd23f', -0.03);
  big(g, s, 'COPY!', 540, 1470, 120, '#8BE36B', 0.04);
}
