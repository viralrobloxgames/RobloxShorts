// kit-sets-c preview: one frame per (set, cam) with stand-ins on the main marks. Frame n = SHOTS[n-1].
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/production/previews/kit-sets-c/set_preview.js --out <dir> --frames 1-N --scale 0.3 --samples 1 --skip-fit-check
import * as THREE from 'three';
import { loadRobloxCharacter } from '../../../../../web/lib/robloxPack.js';
import * as kitchen from '../../../web/kit/sets/kitchen.js';
import * as classroom from '../../../web/kit/sets/classroom.js';
import * as exterior from '../../../web/kit/sets/exterior.js';

export const meta = { seconds: 10, fps: 30, width: 1920, height: 1080 };
const MODS = { kitchen, classroom, exterior };
// [set, cam, state, light, placements {actor: [mark, pose]}]
const K2 = { chapter: 2 }, K3 = { chapter: 3 }, K11 = { chapter: 11 };
export const SHOTS = [
  ['kitchen', 'wide', K11, 'day', { dad: ['stove_three_quarter'], max: ['island_stool_2', 'sit'], lily: ['island_stool_1', 'sit'], skye: ['island_stool_3', 'sit'] }],
  ['kitchen', 'wide_island', K11, 'day', { dad: ['stove_three_quarter'], max: ['island_stool_2', 'sit'], lily: ['island_stool_1', 'sit'], skye: ['stairs_mid'] }],
  ['kitchen', 'end_screen', K11, 'day', { dad: ['stove_three_quarter'], max: ['island_stool_2', 'sit'], lily: ['island_stool_1', 'sit'], skye: ['island_stool_3', 'sit'] }],
  ['kitchen', 'island_two_shot', K11, 'day', { max: ['island_stool_2', 'sit'], skye: ['island_stool_3', 'sit'], dad: ['stove'] }],
  ['kitchen', 'behind_island', K2, 'dim', { skye: ['island_hide'], dad: ['stove'], max: ['island_stool_2', 'sit'], lily: ['island_stool_1', 'sit'] }],
  ['kitchen', 'behind_island_low', K2, 'dim', { skye: ['island_hide'], dad: ['stove'], max: ['island_stool_2', 'sit'], lily: ['island_stool_1', 'sit'] }],
  ['kitchen', 'pancake_reach', K2, 'dim', { skye: ['island_hide_reach', 'crouch'] }],
  ['kitchen', 'stove', K2, 'dim', { dad: ['stove_three_quarter'] }],
  ['kitchen', 'stairs', K2, 'dim', { skye: ['stairs_mid'] }],
  ['kitchen', 'stairs_wide', K2, 'dim', { skye: ['stairs_mid'], dad: ['stove'] }],
  ['kitchen', 'back_door', { chapter: 2, backDoor: 0.7 }, 'dim', { skye: ['back_door_crawl', 'crouch'] }],
  ['kitchen', 'fridge', { chapter: 3, fridgeOpen: 0, fridge: 'BE NI' }, 'night', { skye: ['fridge'] }],
  ['kitchen', 'fridge_letters', { chapter: 3, fridgeOpen: 0, fridge: 'BE NICE\n2 SKYE' }, 'night', {}],
  ['kitchen', 'fridge_pov', { chapter: 3, fridgeOpen: 1, fridge: 'BE NICE\n2 SKYE' }, 'night', { max: ['fridge_open'] }],
  ['kitchen', 'fridge_wide', { chapter: 3, fridgeOpen: 1, fridge: 'BE NICE\n2 SKYE' }, 'night', { max: ['fridge_open'], skye: ['pantry_slats'] }],
  ['kitchen', 'pantry_pov', { chapter: 3, fridgeOpen: 1, fridge: 'BE NICE\n2 SKYE' }, 'night', { max: ['fridge_open'], skye: ['pantry_inside'] }],
  ['kitchen', 'pantry_peek', { chapter: 3, fridgeOpen: 1, fridge: 'BE NICE\n2 SKYE', pantryDoors: 0.06 }, 'night', { skye: ['pantry_slats'] }],
  ['kitchen', 'fridge_ots', { chapter: 3, fridgeOpen: 0, fridge: 'BE NICE\n2 SKYE', plate: 'sandwich' }, 'night', { max: ['fridge_read'] }],
  ['kitchen', 'behind_island', { chapter: 3, fridgeOpen: 0, fridge: 'BE NICE\n2 SKYE', plate: 'empty' }, 'night', { skye: ['island_hide'], dad: ['fridge_side'] }],
  ['kitchen', 'reverse_from_stove', K11, 'day', { max: ['island_stool_2', 'sit'], skye: ['island_stool_3', 'sit'] }],
];
const extraShots = (mod) => (mod.PREVIEW_SHOTS || []);

let actors, sets = {};
export async function setup(stage) {
  for (const [k, m] of Object.entries(MODS)) sets[k] = m.build(stage.scene);
  for (const [k, m] of Object.entries(MODS)) for (const s of extraShots(m)) SHOTS.push([k, ...s]);
  const mk = async (name, scale, tint) => { const a = await loadRobloxCharacter(name, { expressions: ['happy'], scale }); stage.scene.add(a.root); return a; };
  actors = { skye: await mk('Skye', 1), max: await mk('Max', 1), lily: await mk('Mia', 0.78), dad: await mk('Leo', 1.12),
    x1: await mk('Noob', 1), x2: await mk('Noob', 1), x3: await mk('Noob', 1), x4: await mk('Noob', 1) };
  window.__SHOTS = SHOTS.length;
}
function pose(a, kind) {
  const b = a.bones; for (const k of ['Leg.L', 'Leg.R', 'Arm.L', 'Arm.R', 'Torso', 'Head']) b[k].rotation.set(0, 0, 0);
  if (kind === 'sit') { b['Leg.L'].rotation.x = b['Leg.R'].rotation.x = -Math.PI / 2; }
  if (kind === 'crouch') { b['Leg.L'].rotation.x = b['Leg.R'].rotation.x = Math.PI / 2; }
}
export function update(t, stage) {
  const i = Math.min(SHOTS.length - 1, Math.round(t * 30));
  const [setId, camName, state, light, place] = SHOTS[i];
  const set = sets[setId];
  set.setState(state);
  for (const [k, a] of Object.entries(actors)) a.root.visible = false;
  for (const [k, [markName, kind]] of Object.entries(place)) {
    const a = actors[k], m = set.marks[markName]; if (!m) throw new Error(`no mark ${setId}.${markName}`);
    a.root.visible = true; pose(a, kind || (m.sit ? 'sit' : m.crouch ? 'crouch' : ''));
    a.root.position.copy(m.pos); a.root.rotation.set(0, m.heading, 0);
    if (m.sit) a.root.position.y = m.seatTop - 2 * a.scale;
    if (m.floorSit) { pose(a, 'sit'); a.root.position.y = m.pos.y - 2 * a.scale; }
    else if (kind === 'crouch' || m.crouch || m.crawl) a.root.position.y = m.pos.y - 1.5 * a.scale;
  }
  const c = set.cams[camName]; if (!c) throw new Error(`no cam ${setId}.${camName}`);
  stage.camera.position.copy(c.pos); stage.camera.fov = c.fov; stage.camera.up.set(0, 1, 0); stage.camera.lookAt(c.target); stage.camera.updateProjectionMatrix();
  stage.skyMesh.position.copy(c.pos);
  const L = { day: [3.1, 0.55, 0.55], dim: [0.5, 0.18, 0.2], night: [0.05, 0.05, 0.06], dusk: [1.4, 0.35, 0.4] }[light];
  stage.sun.intensity = L[0]; stage.hemi.intensity = L[1]; stage.scene.environmentIntensity = L[2];
  stage.fill.intensity = L[1]; stage.rim.intensity = L[1];
  stage.aimSun(set.marks[Object.keys(set.marks)[0]].pos, 40);
}
export function overlay(g, s, t) {
  const i = Math.min(SHOTS.length - 1, Math.round(t * 30));
  g.font = `${Math.round(40 * s)}px Montserrat`; g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4 * s;
  const txt = `${i + 1}: ${SHOTS[i][0]}.${SHOTS[i][1]}`; g.strokeText(txt, 20 * s, 50 * s); g.fillText(txt, 20 * s, 50 * s);
}
