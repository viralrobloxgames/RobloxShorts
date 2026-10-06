// He Won By Not Sleeping. Web renderer + Roblox R6 pack. True story (Cliff Young, 1983 Sydney to Melbourne
// Ultramarathon): world-class runners line up, and so does a 61-year-old potato farmer in overalls. He shuffles; by
// nightfall he's miles behind. The pros sleep six hours; he wakes by mistake at 2 a.m., shuffles past their tents and
// leads by morning. He decides not to sleep at all, wins by ten hours, nearly two days under the record, and gives most
// of his $10,000 prize to the runners he beat. The Noob is the farmer; Max, Mia, Leo and Skye are the pros; recoloured
// Noobs are the starter, the crowd and the official. Beats: web/beats.js (source/beats.py). Sets: web/kit.js.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import { start, road, farm, finish, dress, pistol, cheque, cash, sheep, START, ROAD, FARM, FINISH, TENT_X, TENT_Z } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Won By Not Sleeping' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2, PI = Math.PI;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const S = at(START), R = at(ROAD), F = at(FARM), M = at(FINISH);

// ---------- key times ----------
const T = {
  farmer: W.potato - 0.15, chance: W.nobody - 0.12, gun: W.gun - 0.12, shuffle: W.shuffles1 - 0.12, dusk: W.nightfall - 0.12,
  camp: W.night - 0.12, wakes: W.wakes - 0.15, again: W.starts - 0.12, tents: W.shuffles2 - 0.12, lead: W.morning2 - 0.15,
  farm: W.back - 0.12, decides: W.decides - 0.12, faster: W.faster1 - 0.35, resting: W.stopping - 0.1, finish: W.five2 - 0.12,
  record: W.nearly - 0.12, cheque: W.hand - 0.15, gives: W.gives - 0.12, cta: W.follow - 0.15,
};
T.bang = W.gun + 0.15;          // the starter fires
T.tape = W.ten1 - 0.2;          // he breaks the tape
const SHUF = 6;                 // the farmer's shuffle, studs/s (the legs follow distance, so the steps are short and slow)

// ---------- scene ----------
let A = {}, cliff, max, mia, leo, skye, folk = [], ST, RD, FA, FI, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
let puffs = [];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9'];
const PROS = () => [max, mia, leo, skye];
export async function setup(stage) {
  const { scene } = stage;
  [cliff, max, mia, leo, skye] = await Promise.all([
    loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'neutral', 'determined', 'sleeping', 'surprised', 'cool', 'nervous'] }),
    loadRobloxCharacter('Max', { expressions: ['smug', 'laugh', 'determined', 'shocked', 'surprised', 'happy', 'sleeping', 'annoyed'] }),
    loadRobloxCharacter('Mia', { expressions: ['smug', 'laugh', 'determined', 'shocked', 'surprised', 'happy', 'sleeping'] }),
    loadRobloxCharacter('Leo', { expressions: ['smug', 'laugh', 'determined', 'shocked', 'surprised', 'happy', 'sleeping'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['smug', 'laugh', 'determined', 'shocked', 'surprised', 'happy', 'sleeping'] }),
  ]);
  scene.add(cliff.root, max.root, mia.root, leo.root, skye.root);
  DRESS.overalls = dress(cliff, { color: '#3a6ea5', hem: 0.1, sleeves: false, straps: '#2f5a88', legs: '#3a6ea5', boots: '#4a2c16' });
  [['#e63946', '7'], ['#ffbe0b', '12'], ['#3a86ff', '3'], ['#06d6a0', '21']].forEach(([c, n], i) => { DRESS['vest' + i] = dress(PROS()[i], { color: c, hem: -0.2, sleeves: false, bib: n }); });
  for (let i = 0; i < 6; i++) {                          // recoloured Noobs: the starter / official, the crowd
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'surprised', 'neutral'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats; e.blazer = dress(e, { color: '#16304f', hem: 0.3, collar: '#f4f2ec' });
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shock', 'sit', 'laugh_big', 'point_forward', 'clap', 'think', 'look_up', 'facepalm']) A[n] = await loadAnimation(n);
  ST = start(scene); RD = road(scene); FA = farm(scene); FI = finish(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  add('pistol', pistol()); add('cheque', cheque());
  for (let i = 0; i < 4; i++) add('cash' + i, cash());
  for (let i = 0; i < 3; i++) add('sheep' + i, sheep());
  for (let i = 0; i < 6; i++) { const p = puff(); p.visible = false; scene.add(p); puffs.push(p); }
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE * (speed < 8 ? 1.9 : 1)]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  else { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal) {
  const i = folk.indexOf(f);
  for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i % SKIN.length]);
  f.blazer.visible = !!pal.blazer;
}
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const between = (a, d = 1.3) => grip(a, 'L', d).lerp(grip(a, 'R', d), 0.5);

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.farmer, 'farmer'], [T.chance, 'chance'], [T.gun, 'gun'], [T.shuffle, 'shuffle'], [T.dusk, 'dusk'], [T.camp, 'camp'],
  [T.wakes, 'wakes'], [T.again, 'again'], [T.tents, 'tents'], [T.lead, 'lead'], [T.farm, 'farm'], [T.decides, 'decides'], [T.faster, 'faster'],
  [T.resting, 'resting'], [T.finish, 'finish'], [T.record, 'record'], [T.cheque, 'cheque'], [T.gives, 'gives'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'start', farmer: 'start', chance: 'start', gun: 'start', shuffle: 'start', dusk: 'dusk', camp: 'night', wakes: 'night', again: 'night', tents: 'night', lead: 'dawn', farm: 'farm', decides: 'day', faster: 'day', resting: 'day', finish: 'finish', record: 'finish', cheque: 'finish', gives: 'finish', cta: 'finish' };
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }
const LIGHT = {
  start: { sun: 3.0, hemi: 0.6, hemiC: '#d9ecff', env: 0.6, fill: 0.7, rim: 1.0, sky: ['#3f86e0', '#cfe6ff', '#eef6ff', '#dcecff', 160, 700], sunC: '#fff0dc' },
  day: { sun: 3.2, hemi: 0.6, hemiC: '#ffefd6', env: 0.6, fill: 0.6, rim: 1.0, sky: ['#2f7fe6', '#bfe4ff', '#f4ecdc', '#e6eef4', 200, 900], sunC: '#fff0dc' },
  dusk: { sun: 2.2, hemi: 0.45, hemiC: '#ffb27a', env: 0.4, fill: 0.4, rim: 1.4, sky: ['#3a3f7a', '#ff9a5a', '#ffcf9a', '#f2a878', 180, 800], sunC: '#ff9a50' },
  night: { sun: 0.7, hemi: 0.35, hemiC: '#7a8cc8', env: 0.2, fill: 0.35, rim: 0.7, sky: ['#070b1e', '#1b2550', '#141a30', '#121a36', 60, 400], sunC: '#a9c0ff' },
  dawn: { sun: 2.2, hemi: 0.5, hemiC: '#ffd0b0', env: 0.45, fill: 0.5, rim: 1.2, sky: ['#5a7ad0', '#ffc59a', '#ffe0c0', '#f4c8a8', 180, 800], sunC: '#ffc080' },
  farm: { sun: 3.0, hemi: 0.6, hemiC: '#ffefd6', env: 0.6, fill: 0.6, rim: 1.0, sky: ['#2f7fe6', '#bfe4ff', '#eef6ff', '#dcecff', 200, 900], sunC: '#fff0dc' },
  finish: { sun: 3.0, hemi: 0.6, hemiC: '#d9ecff', env: 0.6, fill: 0.7, rim: 1.0, sky: ['#3f86e0', '#cfe6ff', '#eef6ff', '#dcecff', 160, 700], sunC: '#fff0dc' },
};
function light(stage, place) {
  const L = LIGHT[place], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  const [z, h, b, f, n, fa] = L.sky; u.zenith.value.set(z); u.horizon.value.set(h); u.below.value.set(b); sc.fog.color.set(f); sc.fog.near = n; sc.fog.far = fa;
  u.sunColor.value.set(place === 'night' ? '#000000' : '#fff1d6');
}

// ---------- per-shot cast ----------
const LINE = [[-6.0, 'max'], [-3.0, 'mia'], [0.0, 'leo'], [3.0, 'skye']];
const GIVE_X = [-2.9, 2.9, -5.6, 5.6];                        // the pros either side of him at the finish    // the start line (x), facing -z
const CROWD = [{ shirt: '#e76f51', pants: '#264653' }, { shirt: '#2a9d8f', pants: '#1d3557' }, { shirt: '#f4a261', pants: '#495057' }, { shirt: '#8338ec', pants: '#2b2d42' }, { shirt: '#ffbe0b', pants: '#264653' }];
const OFFICIAL = { shirt: '#f4f2ec', pants: '#16304f', blazer: true };
function castStates(s) {
  const Mp = new Map(), id = SHOT, pros = PROS();
  const crowd = (o, spots, from = 1) => spots.forEach(([x, z, h], i) => { const f = base(o(x, 0, z), h, i % 2 ? 'laugh' : 'happy'); f.layers = [[i % 3 === 0 ? 'clap' : 'idle', s + i * 0.3, 1, true]]; if (i % 3 === 1) f.wave = true; f.pal = CROWD[i % CROWD.length]; Mp.set(folk[from + i], f); });
  if (id === 'hook' || id === 'farmer' || id === 'chance' || id === 'gun' || id === 'shuffle') {
    LINE.forEach(([x], i) => {
      const p = base(S(x, 0, 1.6), PI, 'determined'); p.layers = [['idle', s + i * 0.4]];
      if (id === 'chance') { p.heading = PI - 0.9 + i * 0.12; p.layers = [[i % 2 ? 'laugh_big' : 'point_forward', s - T.chance + i * 0.1, 1, false]]; p.face = 'laugh'; }
      if (id === 'gun' || id === 'shuffle') { moveTo(p, S(x, 0, 1.6), S(x * 0.3, 0, -90), T.bang + i * 0.05, s, 16, PI); p.face = 'determined'; }
      Mp.set(pros[i], p);
    });
    const c = base(S(7.0, 0, 1.8), PI - 0.25, 'happy'); c.layers = [['idle', s]];
    if (id === 'hook' && s > 0.5 && s < 2.2) c.wave = true;
    if (id === 'gun' || id === 'shuffle') { moveTo(c, S(7.0, 0, 1.8), S(4.0, 0, -60), T.bang + 0.3, s, SHUF, PI); c.face = 'happy'; }
    Mp.set(cliff, c);
    if (id === 'gun') { const o = base(S(10.5, 0, -1.2), PI - 1.0, 'neutral'); o.arms = [['R', 0.1, -2.9]]; o.pal = OFFICIAL; Mp.set(folk[0], o); }
    crowd(S, [[-12, -6, R90], [-12, -1, R90], [12, -6, -R90], [12, -2, -R90], [-12, 4, R90]]);
  } else if (id === 'dusk') {
    const c = base(R(0, 0, -2), R90, 'determined'); moveTo(c, R(-8, 0, -2), R(30, 0, -2), T.dusk, s, SHUF, R90); Mp.set(cliff, c);
  } else if (id === 'wakes' || id === 'again') {
    const c = base(R(-15.0, 0, -8.6), 0.4, 'sleeping'); c.sit = true; c.pos.y = -0.55; c.layers = [['sit', 0, 1, false]];      // against the gum tree
    if (s > W.mistake - 0.1) c.face = 'surprised';
    if (id === 'again') {
      const k = smooth(inv(T.again, T.again + 0.45, s)); c.sit = k < 0.5; c.pos.y = lerp(-0.55, 0, k); c.layers = [['sit', 0, 1 - k, false], ['idle', s, k + 1e-3]]; c.face = 'determined';
      if (s > T.again + 0.5) { c.sit = false; c.pos.y = 0; moveTo(c, R(-15.0, 0, -8.6), R(-6, 0, -4.2), T.again + 0.5, s, SHUF, R90); c.face = 'determined'; }
    }
    Mp.set(cliff, c);
  } else if (id === 'tents') {
    const c = base(R(-8, 0, -4.4), R90, 'cool'); moveTo(c, R(-9, 0, -4.4), R(40, 0, -4.4), T.tents - 0.3, s, 8, R90); Mp.set(cliff, c);
  } else if (id === 'lead') {
    const c = base(R(20, 0, -2), R90, 'happy'); moveTo(c, R(18, 0, -2), R(40, 0, -2), T.lead - 0.3, s, SHUF, R90); Mp.set(cliff, c);
    pros.forEach((p, i) => { const x = base(R(TENT_X(i + 1), 0, TENT_Z + 3.4), 0.6 - i * 0.3, 'shocked'); x.layers = [['shock', s - T.lead - 0.3 - i * 0.12, 1, false]]; if (s < T.lead + 0.3 + i * 0.12) { x.layers = [['idle', s]]; x.face = 'sleeping'; } Mp.set(p, x); });
  } else if (id === 'farm') {
    const c = base(F(-10, 0, 0), R90, 'laugh'); moveTo(c, F(-16, 0, 1), F(20, 0, 3), T.farm - 0.2, s, 12, R90); Mp.set(cliff, c);
  } else if (id === 'decides') {
    const c = base(R(80, 0, -2), R90, 'determined'); moveTo(c, R(76, 0, -2), R(120, 0, -2), T.decides - 0.4, s, SHUF, R90); Mp.set(cliff, c);
  } else if (id === 'faster') {
    const c = base(R(90, 0, -2), R90, 'happy'); moveTo(c, R(90, 0, -2), R(130, 0, -2), T.faster, s, SHUF, R90); Mp.set(cliff, c);
    pros.forEach((p, i) => { const x = base(R(70, 0, 1.5), R90, 'determined'); moveTo(x, R(70 - i * 3, 0, 1.0 + (i % 2) * 2.2), R(170, 0, 1.0 + (i % 2) * 2.2), T.faster + 0.2, s, 18, R90); Mp.set(p, x); });
  } else if (id === 'resting') {
    const c = base(R(140, 0, -2), R90, 'happy'); moveTo(c, R(140, 0, -2), R(180, 0, -2), T.resting - 0.6, s, SHUF, R90); if (s > W.never - 0.1) c.wave = true; Mp.set(cliff, c);
    pros.forEach((p, i) => { const x = base(R(150 + i * 3.4, 0, 7.6), PI + 0.15 - i * 0.1, 'sleeping'); x.sit = true; x.pos.y = -1.0; x.layers = [['sit', 0, 1, false]]; if (s > W.never) x.face = 'shocked'; Mp.set(p, x); });
  } else if (id === 'finish' || id === 'record') {
    const c = base(M(0, 0, 8), PI, 'happy'); moveTo(c, M(0.5, 0, 14), M(0, 0, -8), T.finish - 0.5, s, SHUF, PI);
    if (id === 'record') { c.pos = M(0, 0, -6); c.heading = PI; c.layers = [['proud', s - T.record, 1, false]]; c.face = 'laugh'; c.moving = false; }
    Mp.set(cliff, c);
    crowd(M, [[-12, -8, R90], [-12, -3, R90], [12, -8, -R90], [12, -3, -R90], [-12, 2, R90]]);
  } else if (id === 'cheque' || id === 'gives' || id === 'cta') {
    const c = base(M(0, 0, -6), PI, 'happy'); c.layers = [['idle', s]];
    if (id === 'cheque') { c.arms = [['L', 0.25, -1.45], ['R', 0.25, -1.45]]; c.face = 'surprised'; if (s > W.dollars) c.face = 'laugh'; }
    if (id === 'gives' || id === 'cta') { const k = Math.floor(clamp((s - T.gives) / 0.35, 0, 3.99)); c.heading = GIVE_X[k] < 0 ? PI + 0.8 : PI - 0.8; c.arms = [['R', 0.0, -1.45]]; c.face = 'happy'; if (s > T.gives + 1.6) { c.heading = PI; c.arms = []; c.layers = [['proud', s - T.gives - 1.6, 1, false]]; c.face = 'laugh'; } }
    Mp.set(cliff, c);
    if (id === 'cheque') { const o = base(M(3.2, 0, -7.6), PI - 0.6, 'happy'); o.arms = [['L', -0.1, lerp(-1.4, 0, smooth(inv(W.hand + 0.4, W.hand + 0.8, s)))]]; o.pal = OFFICIAL; Mp.set(folk[0], o); }
    if (id === 'gives' || id === 'cta') pros.forEach((p, i) => {
      const gx = GIVE_X[i], x = base(M(gx, 0, -5.4), gx < 0 ? R90 - 0.45 : -R90 + 0.45, 'neutral'); x.layers = [['idle', s + i]];
      const got = s > T.gives + i * 0.35 + 0.2; x.face = got ? (i % 2 ? 'surprised' : 'happy') : 'neutral'; x.arms = got ? [['R', 0.0, -1.2]] : []; x.got = got; Mp.set(p, x);
    });
    crowd(M, [[-12, -8, R90], [12, -8, -R90], [-12, -3, R90]]);
  }
  return Mp;
}

const BURSTS = [];
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  const where = PLACE_OF[SHOT];
  light(stage, where);
  for (const a of [cliff, ...PROS(), ...folk]) a.root.visible = false;
  const states = castStates(s);
  for (const a of [cliff, ...PROS()]) if (states.has(a)) place(a, states.get(a));
  folk.forEach((f) => { const x = states.get(f); if (x) { paint(f, x.pal); place(f, x); } });

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  BURSTS.length = 0;
  const show = (key, pos, yaw = 0, sc = 1) => { const o = PROPS[key]; o.visible = true; o.position.copy(pos); o.rotation.set(0, yaw, 0); o.scale.setScalar(sc); return o; };
  const hy = (a) => a.root.rotation.y;
  if (SHOT === 'gun' && folk[0].root.visible) {
    const pg = show('pistol', grip(folk[0], 'R'), hy(folk[0])); const q = new THREE.Quaternion(); folk[0].bones['Arm.R'].getWorldQuaternion(q); pg.quaternion.copy(q).multiply(Q.setFromEuler(EUL.set(PI, 0, 0)));
    if (s >= T.bang && s < T.bang + 0.6) BURSTS.push([grip(folk[0], 'R', 2.4), T.bang, 0.9]);
  }
  if (SHOT === 'farm') [[-12, 1.2], [-9, -1.8], [-6.5, 2.4]].forEach(([x0, z], i) => { const sp = show('sheep' + i, F(x0 + (s - T.farm) * 13, 0, z), R90); sp.position.y = Math.abs(Math.sin((s + i) * 9)) * 0.5; });
  if (SHOT === 'cheque') {
    const k = smooth(inv(W.hand + 0.1, W.hand + 0.5, s));
    const from = grip(folk[0], 'L').add(V(0, 0.2, 0)), to = between(cliff).add(V(0, 0.75, 0.05));
    show('cheque', from.lerp(to, k), PI);
  }
  if (SHOT === 'gives' || SHOT === 'cta') PROS().forEach((p, i) => { const x = states.get(p); if (x?.got) show('cash' + i, grip(p, 'R'), hy(p)); });
  // the finish tape breaks
  const br = smooth(inv(T.tape, T.tape + 0.35, s));
  FI.tape.L.rotation.y = -1.3 * br; FI.tape.R.rotation.y = 1.3 * br; FI.tape.L.rotation.z = -0.3 * br; FI.tape.R.rotation.z = 0.3 * br;
  // confetti after the win
  FI.conf.visible = s > T.tape;
  if (FI.conf.visible) FI.conf.children.forEach((c) => { const [a, b, d] = c.userData.v; const tt = s - T.tape; c.position.y = 16 - ((tt * (1.5 + a * 1.5) + b * 16) % 16); c.rotation.set(tt * (2 + a * 4), tt * (1 + b * 3), d * 6); });
  let pi = 0; for (const p of puffs) p.visible = false;
  for (const [pos, t0, size] of BURSTS) {
    const a = (s - t0) / 0.55; if (a < 0 || a > 1) continue;
    for (let j = 0; j < 6 && pi < puffs.length; j++, pi++) { const p = puffs[pi], ang = j / 6 * 6.283; p.visible = true; p.position.copy(pos).add(V(Math.cos(ang) * size * 0.8 * easeOut(a), 0.4 * size * a, Math.sin(ang) * size * 0.5 * easeOut(a))); p.scale.setScalar(size * (0.35 + 0.5 * easeOut(a))); p.material.opacity = 0.85 * (1 - a); }
  }

  // ---------- cameras ----------
  const cp = cliff.root.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, S(lerp(0.0, 1.2, u), 6.0, lerp(-27, -24, u)), S(0.6, 3.4, 1.6), 50, 20); break;
    case 'farmer': look(stage, S(lerp(5.4, 5.8, u), 5.0, lerp(-5.6, -4.8, u)), S(6.8, 4.3, 1.8), 46, 10); break;
    case 'chance': look(stage, S(9.5, 5.0, -8.5), S(1.5, 3.6, 1.2), 50, 18); break;
    case 'gun': look(stage, S(lerp(20, 22, u), 6.0, lerp(-8, -12, u)), S(1.0, 3.4, -4), 52, 30); break;
    case 'shuffle': { const fz = cp.z - START.z; look(stage, S(lerp(5.0, 4.5, u), 3.6, fz - 9), S(cp.x - START.x, 3.4, fz), 50, 18); break; }
    case 'dusk': { const fx = cp.x - ROAD.x; look(stage, R(fx + 9, 4.2, 9), R(fx, 3.6, -2), 50, 22); break; }
    case 'camp': look(stage, R(lerp(4, 9, u), 6.0, 10), R(8, 2.4, TENT_Z), 52, 24); break;
    case 'wakes': look(stage, R(-11.5, 3.6, -1.5), R(-15, 2.4, -8.6), 48, 12); break;
    case 'again': look(stage, R(lerp(-5, -3, u), 4.0, 6), R(cp.x - ROAD.x, 3.0, cp.z - ROAD.z), 50, 16); break;
    case 'tents': { const fx = cp.x - ROAD.x; look(stage, R(fx + 7, 4.4, 6.5), R(fx + 1, 3.0, -6), 52, 20); break; }
    case 'lead': look(stage, R(lerp(32, 34, u), 5.2, 9), R(lerp(14, 16, u), 3.0, -5), 54, 30); break;
    case 'farm': { const fx = cp.x - FARM.x; look(stage, F(fx + 6, 5.0, 17), F(fx + 3.5, 3.0, 1), 52, 24); break; }
    case 'decides': { const fx = cp.x - ROAD.x; look(stage, R(fx + 5.5, 4.6, 3.5), R(fx, 4.2, -2), 46, 12); break; }
    case 'faster': { const fx = cp.x - ROAD.x; look(stage, R(fx + 10, 4.8, 12), R(fx + 2, 3.4, 0), 52, 26); break; }
    case 'resting': { const fx = cp.x - ROAD.x; look(stage, R(fx + 4, 4.6, -12), R(fx + 3, 3.0, 2), 54, 26); break; }
    case 'finish': look(stage, M(lerp(1.5, 1.0, u), 4.8, -22), M(0, 4.4, 2), 52, 26); break;
    case 'record': look(stage, M(1.4, 4.6, -14.5), M(0, 4.2, -6), 48, 16); break;
    case 'cheque': look(stage, M(-2.6, 5.0, -15.5), M(1.0, 4.4, -6.5), 50, 16); break;
    case 'gives': case 'cta': { const k = easeOut(clamp((t - T.gives) / (meta.seconds - T.gives))); look(stage, M(lerp(0.4, 0.8, k), lerp(5.6, 7.0, k), lerp(-19, -24, k)), M(0, lerp(4.2, 5.4, k), -5.6), 50, 22); break; }
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  stage.skyMesh.position.copy(stage.camera.position);
  cam = stage.camera;
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, t0) => easeOutBack(clamp((t - t0) / 0.2), 1.6);
function tag(g, s, t, t0, text, sub) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate((60 - 30 * (1 - easeOut(a))) * s, 250 * s);
  g.font = `800 ${34 * s}px Montserrat`; const w = Math.max(g.measureText(text).width, sub ? g.measureText(sub).width : 0) / s + 56;
  roundRect(g, 0, 0, w * s, (sub ? 108 : 66) * s, 18 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 10 * s, (sub ? 108 : 66) * s);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, 30 * s, 34 * s);
  if (sub) { g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText(sub, 30 * s, 76 * s); }
  g.restore();
}
function stamp(g, s, t, t0, text, x, y, color = '#e63946', size = 110, rot = -0.12) {
  const a = clamp((t - t0) / 0.18); if (a <= 0) return;
  const k = lerp(1.8, 1, easeOut(a));
  g.save(); g.globalAlpha = a; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 50 * s;
  g.lineWidth = 10 * s; g.strokeStyle = color; roundRect(g, -w / 2, -size * 0.62 * s, w, size * 1.2 * s, 18 * s); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(text, 0, 6 * s); g.restore();
}
// the race bar: Sydney -> Melbourne with the pros' dot and the farmer's dot
function raceBar(g, s, t, t0, pros, him, label) {
  const a = clamp((t - t0) / 0.25); if (a <= 0) return; const k = easeOutBack(a, 1.4);
  g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
  roundRect(g, -440 * s, -110 * s, 880 * s, 220 * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.font = `800 ${28 * s}px Montserrat`; g.textBaseline = 'middle'; g.fillStyle = '#c9cfdc'; g.textAlign = 'left'; g.fillText('SYDNEY', -400 * s, -60 * s); g.textAlign = 'right'; g.fillText('MELBOURNE', 400 * s, -60 * s);
  g.fillStyle = '#3a3f55'; roundRect(g, -400 * s, -14 * s, 800 * s, 28 * s, 14 * s); g.fill();
  const P = (u) => -400 + 800 * u, dot = (u, c, txt, dy) => { g.fillStyle = c; g.beginPath(); g.arc(P(u) * s, 0, 24 * s, 0, 7); g.fill(); g.font = `${30 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.fillText(txt, P(u) * s, dy * s); };
  dot(pros, '#ff5a5f', 'PROS', 62); dot(him, '#ffd23f', 'HIM', 62);
  if (label) { g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText(label, 0, -62 * s); }
  g.restore();
}
function zzz(g, s, t, p, i) {
  if (!cam) return; const v = p.clone().project(cam); if (v.z > 1) return;
  const x = (v.x + 1) / 2 * 1080, y = (1 - v.y) / 2 * 1920;
  for (let j = 0; j < 3; j++) { const ph = ((t * 0.8 + i * 0.27 + j / 3) % 1); g.save(); g.globalAlpha = Math.sin(ph * PI); bigText(g, s, 'z', x + 30 * ph + j * 8, y - 120 * ph, 34 + j * 10, '#ffffff', 1, 0.2); g.restore(); }
}
function clock(g, s, t, t0, text) {
  const k = pop(t, t0); if (k <= 0) return;
  g.save(); g.translate(760 * s, 480 * s); g.scale(k, k);
  roundRect(g, -220 * s, -90 * s, 440 * s, 180 * s, 26 * s); g.fillStyle = '#111'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ff5a5f'; g.stroke();
  g.font = `${110 * s}px "Luckiest Guy"`; g.fillStyle = Math.sin(t * 10) > -0.4 ? '#ff5a5f' : '#7a2a2e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 8 * s);
  g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'hook') {
    if (t > W.five - 0.1) bigText(g, s, '544 MILES', 540, 400, 130, '#ffffff', pop(t, W.five - 0.1), -0.04);
    if (t > W.sydney - 0.1) bigText(g, s, 'SYDNEY → MELBOURNE', 540, 520, 64, '#ffd23f', pop(t, W.sydney - 0.1), -0.04);
  }
  if (SHOT === 'farmer') { tag(g, s, t, T.farmer, 'AGE: 61', 'potato farmer'); }
  if (SHOT === 'chance' && t > W.chance - 0.3) stamp(g, s, t, W.chance - 0.3, 'NO CHANCE', 540, 460, '#e63946', 100, -0.08);
  if (SHOT === 'shuffle') bigText(g, s, 'SHUFFLE... SHUFFLE...', 540, 440, 72, '#ffffff', pop(t, T.shuffle + 0.1), -0.04);
  if (SHOT === 'dusk') { tag(g, s, t, T.dusk, 'DAY ONE'); raceBar(g, s, t, T.dusk + 0.2, 0.22, 0.12 + 0.01 * clamp(t - T.dusk), "MILES BEHIND"); }
  if (SHOT === 'camp') { tag(g, s, t, T.camp, 'NIGHT ONE'); if (cam) RD.tents.forEach((tn, i) => zzz(g, s, t, tn.position.clone().add(V(0, 3.6, 0)), i)); if (t > W.six - 0.1) bigText(g, s, 'SLEEP: 6 HOURS', 540, 470, 90, '#9fd0ff', pop(t, W.six - 0.1), -0.04); }
  if (SHOT === 'wakes' && t > W.two - 0.2) clock(g, s, t, W.two - 0.2, '2:00 AM');
  if (SHOT === 'tents' && cam) RD.tents.forEach((tn, i) => zzz(g, s, t, tn.position.clone().add(V(0, 3.6, 0)), i));
  if (SHOT === 'lead') { tag(g, s, t, T.lead, 'MORNING'); raceBar(g, s, t, T.lead + 0.1, 0.24, lerp(0.24, 0.3, smooth(clamp((t - T.lead - 0.2) / 0.8))), 'IN THE LEAD!'); }
  if (SHOT === 'farm') {
    const a = clamp((t - T.farm) / 0.15); g.save(); g.globalAlpha = 0.3 * a; g.fillStyle = '#a07a4a'; g.globalCompositeOperation = 'color'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    tag(g, s, t, T.farm, 'BACK HOME', 'rounding up sheep for days');
  }
  if (SHOT === 'decides' && t > W.sleep2 - 0.15) bigText(g, s, 'SLEEP: 0', 540, 420, 150, '#ffd23f', pop(t, W.sleep2 - 0.15), -0.04);
  if (SHOT === 'resting' && t > W.never - 0.1) bigText(g, s, 'NON-STOP', 540, 420, 120, '#ffffff', pop(t, W.never - 0.1), -0.04);
  if (SHOT === 'finish') { tag(g, s, t, T.finish, '5 DAYS LATER', 'Melbourne'); if (t > W.ten1 - 0.1) bigText(g, s, '10 HOURS AHEAD', 540, 470, 100, '#ffd23f', pop(t, W.ten1 - 0.1), -0.04); }
  if (SHOT === 'record') stamp(g, s, t, T.record + 0.1, 'RECORD SMASHED', 540, 460, '#1e9e55', 92, -0.08);
  if (SHOT === 'record' && t > W.record - 0.1) bigText(g, s, 'BY NEARLY 2 DAYS', 540, 600, 70, '#ffffff', pop(t, W.record - 0.1), -0.04);
  if ((SHOT === 'gives' || SHOT === 'cta') && t < T.cta + 0.1) {
    const a = 1 - clamp((t - T.cta) / 0.15); g.save(); g.globalAlpha = a;
    if (t > W.most - 0.1) bigText(g, s, 'NOBODY GAVE HIM A CHANCE', 540, 380, 60, '#ffffff', pop(t, W.most - 0.1), -0.04);
    if (t > W.beat - 0.15) bigText(g, s, 'HE GAVE THEM HIS PRIZE', 540, 480, 70, '#ffd23f', pop(t, W.beat - 0.15), -0.04);
    g.restore();
  }
  if (t >= T.cta) {
    const k2 = easeOutBack(clamp((t - T.cta) / 0.3), 1.6);
    g.save(); g.translate(540 * s, 440 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ cliff, max, mia, leo, skye, folk0: folk[0] });
export const TIMES = T;
export const props = () => PROPS;
