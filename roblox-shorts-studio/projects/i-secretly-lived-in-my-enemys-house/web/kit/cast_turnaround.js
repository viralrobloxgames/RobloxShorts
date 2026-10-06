// kit-cast check sheet: one frame per wardrobe look, the same character four times (front, 3/4, side, back).
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/kit/cast_turnaround.js --out <dir> --frames 1-16 --scale 0.4 --samples 1
import * as THREE from 'three';
import { pose, actionPose } from '../../../../web/lib/rig.js';
import { loadCast, dress, holdTeddy, makeSheetBunch } from './cast.js';

export const meta = { seconds: 20 / 30, fps: 30, width: 1920, height: 1080, title: 'cast turnaround' };
// [label, who, ids, pose, camera {y, dist}]
export const SHEETS = [
  ['skye_hoodie', 'skye', ['skye_hoodie'], 'idle'],
  ['skye_hoodie + backpack', 'skye', ['skye_hoodie', 'backpack'], 'idle'],
  ['skye_hoodie + backpack (walk)', 'skye', ['skye_hoodie', 'backpack'], 'walk'],
  ['skye_sheet', 'skye', ['skye_sheet'], 'idle'],
  ['skye_sheet + glow_sticks (walk, phone arm up)', 'skye', ['skye_sheet', 'glow_sticks'], 'phone'],
  ['max_school', 'max', ['max_school'], 'idle'],
  ['max_pjs', 'max', ['max_pjs'], 'idle'],
  ['dad_cardigan', 'dad', ['dad_cardigan'], 'idle'],
  ['dad_apron', 'dad', ['dad_apron'], 'idle'],
  ['dad_robe', 'dad', ['dad_robe'], 'idle'],
  ['lily_day + teddy', 'lily', ['lily_day'], 'idle'],
  ['lily_day + teddy (walk)', 'lily', ['lily_day'], 'walk'],
  ['lily_pjs + teddy', 'lily', ['lily_pjs'], 'idle'],
  ['extras (each at front, 3/4, side, back across frames 14-17)', 'extras', [], 'idle'],
  ['skye_sheet head close-up', 'skye', ['skye_sheet'], 'idle', { y: 4.4, dist: 9 }],
  ['lineup', 'lineup', [], 'idle'],
  ['dad_robe close-up', 'dad', ['dad_robe'], 'idle', { y: 3.8, dist: 13 }],
  ['lily_pjs close-up', 'lily', ['lily_pjs'], 'idle', { y: 2.6, dist: 10 }],
  ['dad_apron close-up', 'dad', ['dad_apron'], 'idle', { y: 3.6, dist: 13 }],
];
const VIEWS = [0, -Math.PI / 4, -Math.PI / 2, Math.PI];
let casts = [], frameLabel = '';
export const sky = { zenith: '#9fb7d6', horizon: '#e7eef7', below: '#e7eef7', fog: '#e7eef7' };
export async function setup(stage) {
  for (let i = 0; i < 4; i++) casts.push(await loadCast(stage.scene));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#c9c3b8', roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; stage.scene.add(floor);
  stage.camera.fov = 30;
}
function all(c) { return [c.skye, c.max, c.dad, c.lily, ...c.extras]; }
export function update(t, stage) {
  const f = Math.min(SHEETS.length - 1, Math.round(t * 30));
  const [label, who, ids, ps, cam] = SHEETS[f];
  frameLabel = label;
  for (const c of casts) for (const a of all(c)) { a.root.visible = false; pose(a, {}); a.root.rotation.set(0, 0, 0); }
  const place = (a, x, h, p) => {
    a.root.visible = true; a.root.position.set(x, 0, 0); a.root.rotation.y = h;
    if (p === 'walk') pose(a, actionPose('Walk', 0.25));
    if (p === 'phone') pose(a, { ...actionPose('Walk', 0.25), 'Arm.R': [-80, 0, 8] });
    a.setFace('happy');
  };
  if (who === 'extras') {
    for (let i = 0; i < 4; i++) place(casts[i].extras[i], -9 + 6 * i, VIEWS[i], ps);
  } else if (who === 'lineup') {
    const c = casts[0]; for (const o of ['skye_sheet', 'glow_sticks']) if (c.skye.overlays[o]) dress(c.skye, o, false); dress(c.skye, ['skye_hoodie', 'backpack']); dress(c.max, 'max_pjs'); dress(c.dad, 'dad_apron'); dress(c.lily, 'lily_day');
    [c.skye, c.max, c.dad, c.lily].forEach((a, i) => place(a, -9 + 6 * i, -0.3, ps));
  } else {
    casts.forEach((c, i) => {
      const a = c[who];
      for (const o of ['backpack', 'skye_sheet', 'glow_sticks']) if (a.overlays[o]) dress(a, o, false);
      for (const id of ids) dress(a, id);
      place(a, -9 + 6 * i, VIEWS[i], ps);
    });
  }
  const y = cam?.y ?? 2.9, d = cam?.dist ?? 33;
  if (cam) { stage.camera.position.set(-9, y, d); stage.camera.lookAt(-9, y, 0); }
  else { stage.camera.position.set(0, y, d); stage.camera.lookAt(0, y - 0.3, 0); }
  stage.camera.updateProjectionMatrix();
  stage.aimSun(new THREE.Vector3(0, 2, 0), 16);
}
export function overlay(g, s) {
  g.font = `${Math.round(44 * s)}px Montserrat`; g.fillStyle = '#1b1b1f'; g.fillText(frameLabel, 30 * s, 60 * s);
}
export function samples() { return 1; }
