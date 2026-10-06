// kit-sets-b check clip: one frame per (chapter state, named cam) with stand-ins on the marks.
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/previews/attic_preview.js --out <dir> --scale 0.3 --samples 1 --skip-fit-check
import * as THREE from 'three';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../../web/lib/robloxPack.js';
import { build } from '../kit/sets/attic.js';

export const SHOTS = [
  ['ch5', 'nest_to_hatch', { chapter: 5, hatch: 0.9 }, { skye: 'nest/sit', lily: 'hatch_head_lily' }],
  ['ch5', 'nest_to_hatch_tight', { chapter: 5, hatch: 0.9 }, { skye: 'nest/sit', lily: 'hatch_head_lily' }],
  ['ch5', 'hatch_lily_cu', { chapter: 5, hatch: 1 }, { lily: 'hatch_head_lily' }],
  ['ch5', 'hatch_to_nest', { chapter: 5, hatch: 1 }, { skye: 'nest/sit', lily: 'hatch_head_lily' }],
  ['ch5', 'nest_ms', { chapter: 5 }, { skye: 'nest/sit' }],
  ['ch5 end', 'tea_two', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5 end', 'tea_wide', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5 end', 'tea_lily_ots', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5 end', 'tea_skye_ots', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5 end', 'tea_lily_cu', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5 end', 'tea_skye_cu', { chapter: 5, tea: true, backpack: true, hobbyHorse: 'none' }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch7', 'tea_hatch', { chapter: 7, hatch: 0.25 }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch7', 'decor_wide', { chapter: 7, pumpkin: 'none' }, { skye: 'decor_pose', lily: 'decor_front' }],
  ['ch7', 'decor_ms', { chapter: 7, pumpkin: 'none' }, { skye: 'decor_pose' }],
  ['ch7', 'decor_cu', { chapter: 7, pumpkin: 'none' }, { skye: 'decor_pose' }],
  ['ch7', 'decor_to_hatch', { chapter: 7, pumpkin: 'none', hatch: 1 }, { skye: 'decor_pose', dad: 'hatch_head_dad' }],
  ['ch7', 'decor_side', { chapter: 7, pumpkin: 'none', hatch: 1 }, { skye: 'decor_pose', dad: 'decor_front' }],
  ['ch7 end', 'wide', { chapter: 7, pumpkin: 'none', vacuum: true, halloween: 'closed' }, { skye: 'decor_pose', lily: 'hatch_top' }],
  ['ch8', 'nest_two', { chapter: 8 }, { skye: 'nest/sit', lily: 'nest_beside/sit' }],
  ['ch8', 'wide', { chapter: 8 }, { skye: 'nest/sit', lily: 'nest_beside/sit' }],
  ['ch8', 'hatch_wide', { chapter: 8, hatch: 1 }, { lily: 'hatch_head_lily' }],
  ['ch9', 'rocking_nest', { chapter: 9 }, { skye: 'nest/sit', lily: 'rocking_chair/sit' }],
  ['ch9', 'rocking_ms', { chapter: 9 }, { lily: 'rocking_chair/sit' }],
  ['ch9', 'boxes', { chapter: 9 }, {}],
  ['ch9', 'box_max_cu', { chapter: 9, maxBox: 'open' }, { skye: 'box_max' }],
  ['ch9', 'drawing_insert', { chapter: 9, maxBox: 'open' }, {}],
  ['ch9', 'wide_low', { chapter: 9 }, { skye: 'nest/sit', lily: 'rocking_chair/sit' }],
  ['ch9', 'window', { chapter: 9 }, { skye: 'nest/sit' }],
  ['ch2', 'hatch_down', { chapter: 2, hatch: 1 }, {}],
  ['ch8', 'nest_cu', { chapter: 8 }, { skye: 'nest/sit' }],
  ['ch7', 'wide_nest_to_hatch', { chapter: 7 }, { skye: 'tea_skye/sit', lily: 'tea_lily/sit' }],
  ['ch5', 'wide_nest_hatch', { chapter: 5, hatch: 1 }, { skye: 'nest/sit', lily: 'hatch_head_lily' }],
  ['ch8', 'nest_from_window', { chapter: 8, hatch: 1 }, { skye: 'nest/sit', lily: 'hatch_head_lily' }],
  ['ch8', 'nest_mcu_skye', { chapter: 8 }, { skye: 'nest/sit', lily: 'nest_beside/sit' }],
  ['ch8', 'nest_mcu_lily', { chapter: 8 }, { skye: 'nest/sit', lily: 'nest_beside/sit' }],
  ['ch5', 'lily_ms', { chapter: 5, hatch: 1 }, { lily: 'hatch_top' }],
  ['ch7', 'decor_line', { chapter: 7, pumpkin: false }, { skye: 'decor_gap', lily: 'decor_lily' }],
  ['ch9', 'rocking_ms', { chapter: 9, rock: 0.12 }, { lily: 'rocking_chair/sit' }],
];
export const meta = { seconds: SHOTS.length / 30, fps: 30, width: 1920, height: 1080, title: 'attic preview' };
export const sky = { zenith: '#3a5d9a', horizon: '#f2c48a', below: '#5a4632', fog: '#3a3028' };
let set, C = {}, A = {};
export async function setup(stage) {
  const { scene } = stage;
  set = build(scene);
  const F = ['neutral', 'happy'];
  [C.skye, C.lily, C.dad, C.max] = await Promise.all([loadRobloxCharacter('Skye', { expressions: F }), loadRobloxCharacter('Mia', { expressions: F, scale: 0.78 }), loadRobloxCharacter('Leo', { expressions: F, scale: 1.12, hairLift: 0.16 }), loadRobloxCharacter('Max', { expressions: F })]);
  Object.values(C).forEach((c) => scene.add(c.root));
  A.idle = await loadAnimation('idle'); A.sit = await loadAnimation('sit');
  scene.fog = null;
}
export function update(t, stage) {
  const i = Math.min(SHOTS.length - 1, Math.round(t * 30)), [, cam, st, who] = SHOTS[i];
  set.setState(st);
  const night = set.lights.moon.intensity > 0 && set.lights.sun.intensity === 0;
  stage.hemi.intensity = night ? 0.1 : 0.22; stage.hemi.color.set(night ? '#6f86c8' : '#ffe2c0'); stage.hemi.groundColor.set('#4a3a2a');
  stage.scene.environmentIntensity = night ? 0.08 : 0.18;
  stage.sun.intensity = 0; stage.fill.intensity = night ? 0.03 : 0.12; stage.rim.intensity = 0;
  for (const [k, c] of Object.entries(C)) {
    const spec = who[k]; c.root.visible = !!spec; if (!spec) continue;
    const [mark, pose] = spec.split('/'); const m = set.marks[mark];
    c.root.position.copy(m.pos); c.root.rotation.y = m.heading;
    if (pose === 'sit') c.root.position.y += mark === 'rocking_chair' ? m.seatY - 2 * c.scale * 0.95 : -2 * c.scale * 0.95;   // floor sit: hips on the floor
    robloxPose(c, [[pose === 'sit' ? A.sit : A.idle, 0.5, 1, true]]);
  }
  set.useCam(stage.camera, cam);
}
export function overlay(ctx, s, t) {
  const i = Math.min(SHOTS.length - 1, Math.round(t * 30)), [lab, cam] = SHOTS[i];
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, 900 * s, 70 * s); ctx.fillStyle = '#fff'; ctx.font = `${44 * s}px Montserrat`; ctx.fillText(`${i + 1}. ${lab} | ${cam}`, 16 * s, 50 * s);
}
