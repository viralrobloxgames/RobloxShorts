// kit-sets-a preview: frame n shows set SET's n-th named cam with stand-ins on the main marks. ?set via SET below.
import * as THREE from 'three';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../../../web/lib/robloxPack.js';
import * as bedroom from '../../../web/kit/sets/bedroom.js';
import * as hallway from '../../../web/kit/sets/hallway.js';
import { applyLight } from '../../../web/kit/lighting.js';
const SET = new URL(import.meta.url).searchParams.get('set') || 'bedroom';
export const meta = { seconds: 40 / 30, fps: 30, width: 1920, height: 1080 };
export const sky = { zenith: '#05070f', horizon: '#0b1222', below: '#05070f', fog: '#05070f' };
let S, names, A = {}, cast = {};
export async function setup(stage) {
  const { scene } = stage;
  stage.hemi.intensity = 0.25; stage.hemi.color.set('#8ea6d8'); stage.sun.intensity = 0.0; stage.fill.intensity = 0.25; stage.rim.intensity = 0.15; scene.environmentIntensity = 0.25;
  const b = bedroom.build(scene), h = hallway.build(scene);
  S = SET === 'bedroom' ? b : h; (SET === 'bedroom' ? h : b).group.visible = false;
  names = Object.keys(S.cams); meta.names = names;
  for (const n of ['idle', 'sit']) A[n] = await loadAnimation(n);
  const want = SET === 'bedroom' ? [['Skye', 'closet_inside', 'idle'], ['Max', 'bed_edge', 'sit'], ['Mia', 'ghost_stop', 'idle'], ['Leo', 'closet_front', 'idle']]
    : [['Skye', 'max_door_listen', 'idle'], ['Mia', 'lily_behind_skye', 'idle'], ['Leo', 'dad_hatch', 'idle'], ['Max', 'stairs_top', 'idle']];
  for (const [who, mk, an] of want) {
    const a = await loadRobloxCharacter(who, { expressions: ['happy'], scale: who === 'Mia' ? 0.78 : who === 'Leo' ? 1.12 : 1 });
    const m = S.marks[mk]; if (!m) { console.error('missing mark ' + mk); continue; }
    a.root.position.copy(m.seat !== undefined ? bedroom.sitPos(m, a.root.scale.x) : m.pos); a.root.rotation.y = m.heading; scene.add(a.root); robloxPose(a, [[A[an], 0.5, 1, true]]); cast[who] = a;
  }
  S.setState({ chapter: SET === 'bedroom' ? 10 : 6, lamp: true, hall: true, underDoor: true, hatch: SET === 'hallway' ? 1 : 0, linen: 0.2, door: 0, closet: 0.3 });
  window.camNames = names;
}
export function update(t, stage) {
  const i = Math.min(names.length - 1, Math.round(t * 30));
  const c = S.useCam(stage.camera, names[i]);
  stage.camera.aspect = 1920 / 1080; stage.camera.updateProjectionMatrix();
  stage.aimSun(c.target, 30);
  applyLight(stage, SET === 'bedroom' ? 'midnight' : 'night_moon', { set: S, practicals: SET === 'bedroom' ? { bedside_lamp: true, moon_window: true } : { moon_window: true, under_door: true, nightlight: true, attic_glow: true, linen_fill: true } });
}
export function overlay(g, s, t) {
  const i = Math.min(names.length - 1, Math.round(t * 30));
  g.font = `${Math.round(40 * s / 0.3 * 0.3)}px sans-serif`; g.fillStyle = '#ffeb3b'; g.fillText(SET + ' : ' + names[i], 20 * s, 50 * s);
}
