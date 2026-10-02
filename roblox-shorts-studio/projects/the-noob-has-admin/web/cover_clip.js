// Cover image for The Noob Has Admin (render one frame, 1080x1920). Everything that matters sits inside the centre
// 3:4 band (y 240-1680) that TikTok's profile grid keeps. No spoiler: the noob, crowned and typing, Leo flung through the
// air behind him, Max shocked; Mia stands still at the back (the clue, for anyone who looks).
import * as THREE from 'three';
import * as base from './noob_clip.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { panicArms } from '../../../web/lib/gestures.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let A = {}, cam;
export async function setup(stage) { await base.setup(stage); for (const n of ['typing', 'fall', 'idle', 'shock']) A[n] = await loadAnimation(n); }
export function samples() { return 6; }

function put(a, pos, rot, layers, faceE, scale = 1, ground = true) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(rot[0], rot[1], rot[2], 'YXZ'); a.root.scale.setScalar(scale);
  robloxPose(a, layers); a.root.traverse((o) => { if (o.isMesh) o.visible = true; });
  if (ground) { a.root.updateMatrixWorld(true); a.root.position.y -= soleHeight(a); }
  setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(20, stage);
  const { leo, max, mia, noob } = base.cast(), fits = base.crownFits();
  put(noob, V(0, 0, 2.6), [0, 0.1, 0], [[A.typing, 0.4]], 'evil_grin');
  put(leo, V(-2.2, 6.0, -4.5), [0.2, 0.5, 0.5], [[A.fall, 0.2]], 'scared', 1, false); panicArms(leo, 0.3); leo.root.updateMatrixWorld(true);
  put(max, V(3.4, 0, -2.0), [0, -0.45, 0], [[A.shock, 0.3]], 'shocked');
  put(mia, V(6.4, 0, -8.5), [0, -0.5, 0], [], 'neutral');
  for (const a of [noob, mia]) {
    const f = fits[a.name], c = f.item; c.visible = true;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(f.scale); c.position.copy(a.bones.Head.localToWorld(f.offset.clone()));
  }
  cam = stage.camera; cam.position.set(0.8, 3.0, 11.5); cam.fov = 62; cam.updateProjectionMatrix(); cam.lookAt(0.1, 4.6, -2);
  stage.aimSun(V(0, 0, 0), 26); stage.bloom.strength = 0.35;
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.22, { cx: 540, cy: 1000, seed: 4 });
  g.save(); g.translate(880 * s, 470 * s); g.rotate(0.06); g.font = `${54 * s}px "Luckiest Guy"`;
  roundRect(g, -110 * s, -42 * s, 220 * s, 84 * s, 22 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 4', 0, 4 * s); g.restore();
  // The command sticker.
  g.save(); g.translate(790 * s, 330 * s); g.rotate(0.07); g.scale(0.6, 0.6);
  roundRect(g, -380 * s, -90 * s, 760 * s, 180 * s, 32 * s); g.fillStyle = 'rgba(12,18,28,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#F5CD30'; g.stroke();
  g.font = `800 ${100 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(':fling leo', 0, 6 * s); g.restore();
  big(g, s, 'THE NOOB', 540, 1335, 150, '#ffffff', -0.04);
  big(g, s, 'GOT ADMIN', 540, 1480, 150, '#FFD23F', -0.04);
}
