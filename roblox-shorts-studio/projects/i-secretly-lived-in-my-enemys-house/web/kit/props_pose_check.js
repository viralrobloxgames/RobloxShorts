// PR1 check: every held prop in its holdPose() poses, on the real kit cast (Skye 1.0, Lily 0.78, Dad 1.12; both hands),
// from in front of the holder. The label shows the clearance slide and what is still inside the body (clip, studs).
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/kit/props_pose_check.js --out /tmp/pc --frames 1-N --scale 0.5 --samples 1 --skip-fit-check
import * as THREE from 'three';
import { part } from '../../../../web/lib/world.js';
import { loadCast } from './cast.js';
import { makeProp, holdPose, hold, reach2, carry2 } from './props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// [id, opts, poses]
const SPECS = [
  ['teapot', {}, ['chest', 'pour', 'low']],
  ['cup', {}, ['chest', 'sip', 'carry']],
  ['hobby_horse', {}, ['low', 'carry', 'offer']],
  ['broom', {}, ['low', 'carry', 'raise']],
  ['pancake', { grip: 'edge' }, ['carry', 'chest', 'offer']],
  ['plate', { with: 'ham_sandwich' }, ['carry', 'chest']],
  ['spatula', {}, ['carry', 'chest', 'raise']],
  ['phone', { screen: 'record' }, ['chest', 'raise', 'ear']],
  ['note', { state: 'folded' }, ['carry', 'chest', 'offer']],
  ['note', { state: 'crumpled' }, ['low', 'carry', 'chest']],
  ['drawing', {}, ['chest', 'offer']],
  ['teddy', {}, ['low', 'carry']],
  ['sandwich', {}, ['carry', 'chest', 'offer']],
  ['sandwich', { half: true, bitten: 'half_eaten' }, ['chest']],
  ['flashlight', {}, ['low', 'carry', 'chest', 'raise']],
  ['cookie', {}, ['carry', 'offer']],
];
const WHO = [['skye', 'R'], ['lily', 'L'], ['dad', 'R'], ['skye', 'L']];
const ENTRIES = [];
SPECS.forEach((s, i) => s[2].forEach((pose, j) => { const [who, hand] = WHO[(i + j) % WHO.length]; ENTRIES.push({ id: s[0], o: s[1], pose, who, hand }); }));
ENTRIES.push({ id: 'teddy', o: { hold: false }, pose: 'hug', who: 'lily', hand: 'L' });
ENTRIES.push({ id: 'plate', o: { with: 'ham_sandwich' }, pose: 'two', who: 'skye', hand: 'R' });
ENTRIES.push({ id: 'drawing', o: {}, pose: 'two', who: 'skye', hand: 'R' });
export const meta = { width: 1920, height: 1080, fps: 30, seconds: (ENTRIES.length + 1) / 30 };
export const sky = {};
export const samples = () => 1;
let cast, cur = null;
export async function setup(stage) {
  stage.scene.add(part(30, 1, 30, '#b9a58c', { rough: 0.8, clearcoat: 0 }));
  cast = await loadCast(stage.scene);
  for (const a of [cast.skye, cast.max, cast.dad, cast.lily, ...cast.extras]) { a.root.visible = false; a.root.rotation.y = 0.35; a.setFace('happy'); }
  cast.lily.teddy.visible = false;
  stage.aimSun(V(0, 2, 0), 8);
}
export function update(t, stage) {
  const e = ENTRIES[Math.min(ENTRIES.length - 1, Math.max(0, Math.round(t * 30)))];
  if (cur) cur.removeFromParent();
  for (const k of ['skye', 'lily', 'dad']) { const a = cast[k]; a.root.visible = k === e.who; for (const b of Object.values(a.bones)) b.rotation.set(0, 0, 0); }
  const a = cast[e.who]; a.root.updateMatrixWorld(true);
  cur = makeProp(e.id, e.o);
  if (e.pose === 'two') { reach2(a, cur, -1.2); carry2(cur, a); }
  else if (e.pose === 'hug') { a.bones['Arm.L'].rotation.set(-0.75, 0, -0.55); a.bones['Arm.R'].rotation.set(-0.7, 0, 0.5); hold(cur, a, 'L', 'hug'); }
  else holdPose(cur, a, e.hand, e.pose);
  e.clip = cur.userData.clipDepth ?? 0; e.shift = cur.userData.clearShift ?? 0;
  a.root.updateMatrixWorld(true);
  const fwd = V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y)), right = V(-fwd.z, 0, fwd.x);
  const tg = V(0, 0, 0).applyMatrix4(cur.matrixWorld).lerp(V(0, 3.2 * a.scale, 0).applyMatrix4(a.root.matrixWorld), 0.35);
  const c = stage.camera; c.position.copy(tg).addScaledVector(fwd, 7.5).addScaledVector(right, e.hand === 'R' ? -2.6 : 2.6).add(V(0, 0.9, 0)); c.lookAt(tg); c.fov = 40; c.updateProjectionMatrix();
}
export function overlay(g, s, t) {
  const i = Math.min(ENTRIES.length - 1, Math.round(t * 30)), e = ENTRIES[i];
  const label = `${i + 1}: ${e.id} ${JSON.stringify(e.o)} ${e.pose} - ${e.who} ${e.hand}   slide ${e.shift}  clip ${e.clip}`;
  g.font = `${Math.round(34 * s)}px sans-serif`; g.fillStyle = e.clip > 0.05 ? 'rgba(170,0,0,0.75)' : 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, g.measureText(label).width + 30 * s, 50 * s); g.fillStyle = '#fff'; g.fillText(label, 14 * s, 36 * s);
}
