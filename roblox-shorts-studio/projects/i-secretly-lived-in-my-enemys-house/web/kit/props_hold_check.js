// kit-props hold check: every prop in a hand (both hands, Skye 1.0 / Lily 0.78 / Dad 1.12), worn props on heads and
// wrists, two-handed carries. Frame k shows ENTRIES[k-1] (label drawn top left).
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/kit/props_hold_check.js --out /tmp/hold --frames 1-N --scale 0.4 --samples 1 --skip-fit-check
import * as THREE from 'three';
import { loadRobloxCharacter } from '../../../../web/lib/robloxPack.js';
import { part } from '../../../../web/lib/world.js';
import { holdCheck } from '../../../../web/lib/holdcheck.js';
import { makeProp, hold, carry2, wearOnHead, wearWrist, place } from './props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// [prop id, opts, how, arm pitch (negative = raised forward), extra]
const SPECS = [
  ['flashlight', { beam: true }, 'palm', -1.45],
  ['flashlight', {}, 'side', 0],
  ['flashlight_small', { beam: true }, 'palm', -2.3, { chin: true }],
  ['lunchbox', {}, 'side', 0],
  ['lunchbox', { open: true, spider: true }, 'palm', -1.3],
  ['rubber_spider', {}, 'out', -1.5],
  ['spatula', {}, 'palm', -1.0],
  ['pancake', { grip: 'edge' }, 'palm', -1.4],
  ['magnet_letters', { letters: 'BENICE' }, 'palm', -1.3],
  ['sandwich', {}, 'palm', -1.3],
  ['sandwich', { half: true, bitten: 'half_eaten' }, 'palm', -1.3],
  ['cookie', {}, 'palm', -1.3],
  ['teddy', {}, 'side', -0.1],
  ['teapot', {}, 'palm', -1.2],
  ['cup', {}, 'palm', -1.2],
  ['hobby_horse', {}, 'palm', -0.9],
  ['pumpkin_bucket', {}, 'side', 0],
  ['broom', {}, 'side', 0],
  ['broom', {}, 'palm', -2.0],
  ['note', {}, 'palm', -1.3],
  ['note', { state: 'crumpled' }, 'palm', -0.7],
  ['phone', { screen: 'record' }, 'out', -2.0],
  ['phone', { screen: 'call' }, 'out', -1.4],
  ['bedsheet', { state: 'bunched' }, 'side', 0],
  ['scissors', {}, 'palm', -1.2],
  ['glow_sticks', {}, 'palm', -1.1],
  ['milk', {}, 'palm', -1.2],
  ['ham', {}, 'side', -0.15],
  ['syrup', {}, 'palm', -1.2],
  ['pan', { pancake: true }, 'palm', -1.0],
  ['knife', {}, 'palm', -1.0],
  ['vacuum', {}, 'wand', -1.0],
];
const WHO = [['skye', 'R'], ['skye', 'L'], ['lily', 'R'], ['lily', 'L'], ['dad', 'R'], ['dad', 'L']];
export const ENTRIES = [];
for (const s of SPECS) for (const [who, hand] of (s[0] === 'teddy' ? [['lily', 'L'], ['lily', 'R'], ['skye', 'L']] : s[0] === 'vacuum' ? [['dad', 'R'], ['dad', 'L']] : [WHO[ENTRIES.length % 2], WHO[2 + (ENTRIES.length % 2)], WHO[4]])) ENTRIES.push({ spec: s, who, hand });
// two-handed, worn
for (const who of ['skye', 'lily', 'dad']) ENTRIES.push({ c2: ['plate', { with: 'ham_sandwich' }, -1.15], who, hand: 'R' });
ENTRIES.push({ c2: ['bedsheet', { state: 'held', holes: 2 }, -1.35], who: 'skye', hand: 'R' });
ENTRIES.push({ c2: ['drawing', {}, -1.3], who: 'skye', hand: 'R' });
ENTRIES.push({ c2: ['note', { state: 'open' }, -1.4], who: 'skye', hand: 'R' });
ENTRIES.push({ hug: 'teddy', who: 'lily', hand: 'L' });
for (const t of [[0.25, -0.2], [0, 0]]) ENTRIES.push({ head: 'pumpkin_bucket', tilt: t, who: 'skye', hand: 'R', cam: { dist: 4.5, side: -1.5, up: 2.6 } });
ENTRIES.push({ head: 'pumpkin_bucket', tilt: [0, 0], who: 'skye', hand: 'R', cam: { dist: -5, side: 2, up: 2.6 } });
ENTRIES.push({ head: 'cobweb', who: 'skye', hand: 'R', cam: { dist: 4, side: -2.5, up: 2.8 } });
ENTRIES.push({ wrist: true, who: 'skye', hand: 'R', arms: -1.2 });
ENTRIES.push({ place: true, who: 'skye', hand: 'R', cam: { dist: 6, side: -1, up: 2.5 } });

const META = { width: 1920, height: 1080, fps: 30, seconds: 1 };
export const sky = {};
let cast, props = [];
export async function setup(stage) {
  stage.scene.add(part(30, 1, 30, '#b9a58c', { rough: 0.8, clearcoat: 0 }));
  const skye = await loadRobloxCharacter('Skye', { expressions: ['happy'] });
  const lily = await loadRobloxCharacter('Mia', { expressions: ['happy'], scale: 0.78 });
  const dad = await loadRobloxCharacter('Leo', { expressions: ['happy'], scale: 1.12 });
  cast = { skye, lily, dad };
  for (const a of Object.values(cast)) { a.root.rotation.y = 0.35; stage.scene.add(a.root); }
  stage.aimSun(V(0, 2, 0), 8);
}
const armPose = (a, sd, pitch, inward = 0) => { const b = a.bones['Arm.' + sd]; b.rotation.set(pitch, 0, (sd === 'R' ? 1 : -1) * -inward); };
function base_update(i) {
  for (const p of props) p.removeFromParent(); props = [];
  const e = ENTRIES[Math.max(0, Math.min(ENTRIES.length - 1, Math.round(i)))], a = cast[e.who];
  for (const x of Object.values(cast)) { x.root.visible = true; for (const sd of ['L', 'R']) armPose(x, sd, 0); x.bones.Head.rotation.set(0, 0, 0); }
  if (e.spec) {
    const [id, o, how, pitch, extra = {}] = e.spec;
    armPose(a, e.hand, pitch, how === 'palm' || how === 'out' ? 0.12 : 0);
    a.root.updateMatrixWorld(true);
    if (how === 'wand') { const v = makeProp('vacuum'); a.root.parent.add(v); place(v, a.root.position.clone().add(V(e.hand === 'R' ? -2.2 : 2.2, 0, 0.5)), 0.3); hold(v.userData.wand, a, e.hand, 'palm'); props.push(v); }
    else { const p = makeProp(id, o); hold(p, a, e.hand, how); props.push(p); }
  } else if (e.c2) {
    const [id, o, pitch] = e.c2; armPose(a, 'L', pitch, 0.32); armPose(a, 'R', pitch, 0.32);
    const p = makeProp(id, o); carry2(p, a); props.push(p);
  } else if (e.hug) {
    armPose(a, 'L', -0.7, 0.55); const p = makeProp('teddy', { hold: false }); hold(p, a, 'L', 'hug'); props.push(p);
  } else if (e.head) {
    const p = makeProp(e.head, e.head === 'pumpkin_bucket' ? { worn: true } : {}); wearOnHead(p, a, { tilt: e.tilt }); props.push(p);
  } else if (e.wrist) {
    armPose(a, 'R', e.arms, 0); armPose(a, 'L', -0.3, 0);
    for (const sd of ['L', 'R']) { const p = makeProp('glow_band'); wearWrist(p, a, sd); props.push(p); }
  } else if (e.place) {
    const sc = a.root.parent, t = a.root.position.clone().add(V(0, 0, 3));
    const items = [['pancake_stack', { count: 11 }], ['plate', { with: 'sandwich' }], ['glow_sticks', {}], ['bedsheet', { state: 'flat', holes: 2 }], ['drawing', {}], ['cup', {}], ['teapot', {}], ['flashlight_small', {}], ['teddy', { pose: 'sit' }], ['pumpkin_bucket', {}], ['lunchbox', { open: true }]];
    items.forEach(([id, o], k) => { const p = makeProp(id, o); sc.add(p); place(p, t.clone().add(V((k % 4 - 1.5) * 1.9, 0, -(k / 4 | 0) * 2.2 + 2)), 0.2); if (id === 'flashlight_small') { p.rotation.x = -Math.PI / 2; p.position.y = 0.48 * 0.68; } props.push(p); });
  }
  return e;
}
export const ENTRY_COUNT = ENTRIES.length;
const hc = holdCheck({ meta: META, sky, setup, update: (tt) => base_update(tt), cast: () => cast },
  ENTRIES.map((e, i) => [i, e.who, e.hand, '', e.cam ?? (e.c2 ? { dist: 5.5, side: -1.5, up: 1.0 } : {})]));
export const update = hc.update, meta = hc.meta;
export const samples = () => 1;
export function overlay(g, s, t) {
  const i = Math.round(t * 30), e = ENTRIES[Math.min(ENTRIES.length - 1, i)];
  const label = `${i + 1}: ${e.spec ? `${e.spec[0]} ${JSON.stringify(e.spec[1])} ${e.spec[2]}` : e.c2 ? `carry2 ${e.c2[0]}` : e.hug ? 'hug teddy' : e.head ? `wearOnHead ${e.head}` : e.wrist ? 'glow bands' : 'place()'} - ${e.who} ${e.hand}`;
  g.font = `${Math.round(34 * s)}px sans-serif`; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, g.measureText(label).width + 30 * s, 50 * s); g.fillStyle = '#fff'; g.fillText(label, 14 * s, 36 * s);
}
