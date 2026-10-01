// Cover image for Leo Gave Everyone Admin (render one frame, 1080x1920). Everything that matters sits inside the
// centre 3:4 band (y 240-1680) that TikTok's profile grid keeps: headline, faces, the ":admin all" typo.
// A still is staged freely: shocked Leo in front, a giant crowned Max looming behind, Mia in shades, the AFK noob.
import * as THREE from 'three';
import * as base from './leo_clip.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let A = {}, cam, noobHead;
export async function setup(stage) { await base.setup(stage); for (const n of ['shock', 'typing', 'scheming', 'idle', 'proud']) A[n] = await loadAnimation(n); }
export function samples() { return 6; }

function put(a, pos, rotY, layers, faceE, scale = 1) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, rotY, 0); a.root.scale.setScalar(scale);
  robloxPose(a, layers); a.root.traverse((o) => { if (o.isMesh) o.visible = true; });
  a.root.updateMatrixWorld(true); a.root.position.y -= soleHeight(a); setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(26.5, stage);                                // giant Max, rocket not on yet
  const { leo, max, mia, noob } = base.cast(), fits = base.crownFits();
  put(leo, V(0.2, 0, 2.2), 0.12, [[A.shock, 0.3]], 'shocked');
  put(max, V(-1.0, 0, -24), 0.05, [[A.scheming, 0.35]], 'evil_grin', 4);
  put(mia, V(3.3, 0, -1.2), -0.3, [[A.proud, 0.3]], 'cool');
  put(noob, V(-3.4, 0, -2.2), 0.3, [[A.idle, 0.2]], 'sleeping');
  for (const a of [leo, max, mia, noob]) {
    const f = fits[a.name], c = f.item; c.visible = true;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(f.scale * a.root.scale.x);
    c.position.copy(a.bones.Head.localToWorld(f.offset.clone()));
  }
  cam = stage.camera; cam.position.set(0.6, 3.6, 10.5); cam.fov = 62; cam.updateProjectionMatrix(); cam.lookAt(0.2, 6.9, -4);
  stage.aimSun(V(0, 0, 0), 26); stage.bloom.strength = 0.35;
  noobHead = noob.bones.Head.localToWorld(V(0, 2.0, 0));
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.25, { cx: 540, cy: 1000, seed: 9 });
  // PART 3 tag in the sky; the headline low in the safe band.
  g.save(); g.translate(170 * s, 310 * s); g.rotate(-0.08); g.font = `${54 * s}px "Luckiest Guy"`;
  roundRect(g, -110 * s, -42 * s, 220 * s, 84 * s, 22 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 3', 0, 4 * s); g.restore();
  big(g, s, 'HE GAVE', 540, 1335, 140, '#ffffff', -0.04);
  big(g, s, 'EVERYONE ADMIN', 540, 1475, 108, '#FFD23F', -0.04);
  // AFK tag over the noob.
  cam.updateMatrixWorld(); const p = noobHead.clone().project(cam), nx = (p.x * 0.5 + 0.5) * 1080 * s, ny = (-p.y * 0.5 + 0.5) * 1920 * s;
  g.save(); g.font = `${40 * s}px "Luckiest Guy"`; const w = g.measureText('AFK').width + 36 * s;
  roundRect(g, nx - w / 2, ny - 30 * s, w, 60 * s, 18 * s); g.fillStyle = 'rgba(40,40,48,.85)'; g.fill(); g.fillStyle = '#d7d7de'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AFK', nx, ny + 3 * s); g.restore();
  // The typo, as a sticker in the sky beside Max's head.
  g.save(); g.translate(800 * s, 400 * s); g.rotate(0.08); g.scale(0.56, 0.56);
  roundRect(g, -400 * s, -95 * s, 800 * s, 190 * s, 34 * s); g.fillStyle = 'rgba(12,18,28,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.font = `800 ${104 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const x0 = -330 * s, wc = g.measureText(':').width, wa = g.measureText('admin').width;
  roundRect(g, x0 + wc - 8 * s, -62 * s, wa + 16 * s, 124 * s, 16 * s); g.fillStyle = '#e8213a'; g.fill();
  g.fillStyle = '#ffffff'; g.fillText(':admin all', x0, 6 * s); g.restore();
}
