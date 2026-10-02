// Cover for Mia Had Two Crowns (one frame, 1080x1920; everything inside the 3:4 band y 240-1680). Mia and her crowned
// alt side by side, "PLAYING" over one and "FROZEN" over the other; Leo and Max sneaking up with a fist bump. No spoilers.
import * as THREE from 'three';
import * as base from './mia_clip.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let A = {}, cam, tags = [];
export async function setup(stage) { await base.setup(stage); for (const n of ['typing', 'walk', 'point_forward', 'idle']) A[n] = await loadAnimation(n); }
export function samples() { return 6; }
function put(a, pos, rotY, layers, faceE) {
  a.root.visible = true; a.root.position.copy(pos); a.root.rotation.set(0, rotY, 0); a.root.scale.setScalar(1);
  robloxPose(a, layers); a.root.traverse((o) => { if (o.isMesh) o.visible = true; });
  a.root.updateMatrixWorld(true); a.root.position.y -= soleHeight(a); setExpression(a, faceE); a.root.updateMatrixWorld(true);
}
export function update(t, stage) {
  base.update(1.0, stage);
  const { leo, max, mia, noob, skye } = base.cast(), fits = base.crownFits();
  put(mia, V(-1.6, 0, 1.2), 0.15, [[A.typing, 0.4]], 'determined');
  put(noob, V(1.4, 0, 0.9), -0.15, [[A.walk, 0.35]], 'neutral');
  put(leo, V(-3.4, 0, -4.2), 0.5, [[A.point_forward, 0.6]], 'evil_grin');
  put(max, V(3.8, 0, -4.4), -0.5, [[A.point_forward, 0.6]], 'evil_grin');
  skye.root.visible = false;
  for (const a of [mia, noob, leo, max]) {
    const f = fits[a.name], c = f.item; c.visible = a === mia || a === noob;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(f.scale); c.position.copy(a.bones.Head.localToWorld(f.offset.clone()));
  }
  cam = stage.camera; cam.position.set(0, 3.6, 11.5); cam.fov = 54; cam.updateProjectionMatrix(); cam.lookAt(0, 4.6, -1.5);
  stage.aimSun(V(0, 0, 0), 26); stage.bloom.strength = 0.35;
  tags = [[mia.bones.Head.localToWorld(V(0, 2.2, 0)), 'PLAYING', 'rgba(40,170,80,.95)'], [noob.bones.Head.localToWorld(V(0, 2.2, 0)), 'FROZEN', 'rgba(70,90,120,.95)']];
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  speedLines(g, s, 0, 0.18, { cx: 540, cy: 1000, seed: 6 });
  cam.updateMatrixWorld();
  for (const [p3, txt, bg] of tags) {
    const p = p3.clone().project(cam), x = (p.x * 0.5 + 0.5) * 1080 * s, y = (-p.y * 0.5 + 0.5) * 1920 * s;
    g.save(); g.font = `${46 * s}px "Luckiest Guy"`; const w = g.measureText(txt).width + 40 * s;
    roundRect(g, x - w / 2, y - 36 * s, w, 72 * s, 20 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y + 4 * s); g.restore();
  }
  g.save(); g.translate(170 * s, 310 * s); g.rotate(-0.08); g.font = `${54 * s}px "Luckiest Guy"`;
  roundRect(g, -110 * s, -42 * s, 220 * s, 84 * s, 22 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 5', 0, 4 * s); g.restore();
  big(g, s, 'ONE PLAYER', 540, 1335, 140, '#ffffff', -0.04);
  big(g, s, 'TWO ADMINS', 540, 1480, 140, '#FFD23F', -0.04);
}
