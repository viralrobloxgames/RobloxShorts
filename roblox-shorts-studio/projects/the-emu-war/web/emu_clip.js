// They Lost A War To Emus. Web renderer + Roblox R6 pack. True story (the Emu War, Western Australia, November 1932):
// twenty thousand emus eat the wheat; the veteran farmers ask the army for help; a major, two gunners, two machine guns
// and ten thousand bullets arrive. The emus scatter, the gun jams at the ambush, the truck-mounted gun can't keep up or
// aim, every flock has a lookout. A week and 2,500 bullets later most of the emus are fine, Parliament jokes about
// medals, the army pulls out and the major admits the birds face machine guns like tanks. Picture rule: no emu is ever
// shown hit. Max is the major (ranger_hat as the slouch hat); Leo and the Noob the gunners; Mia a farmer; Skye an MP;
// recoloured Noobs are farmers and MPs. Beats: web/beats.js (source/beats.py). Sets, props, emus: web/kit.js.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import { wheat, parliament, dress, emu, setEmu, lewisGun, ammoBox, armyTruck, WHEAT, PARL, DAM, MOUND } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'They Lost A War To Emus' };
export const sky = { zenith: '#3f86e0', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2, PI = Math.PI;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const G = at(WHEAT), P = at(PARL);

const T = {
  farmers: W.farmers - 0.12, sends: W.sends - 0.15, day1: W.day1 - 0.12, day3: W.day3 - 0.12, jams: W.jams - 0.15, bolts: W.bolts - 0.15,
  outrun: W.outrun - 0.2, ride: W.ride - 0.15, lookout: W.every - 0.12, week: W.after - 0.12, parl: W.parliament - 0.15, pulls: W.pulls - 0.12,
  admits: W.admits - 0.15, won: W.went - 0.12, cta: W.follow - 0.15,
};
T.scatter = W.split - 0.1;
T.jam = W.jams + 0.05;

// ---------- scene ----------
let A = {}, max, leo, noob, mia, skye, folk = [], WH, PA, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, EMUS = [];
let puffs = [];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9'];
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, noob, mia, skye] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['determined', 'shocked', 'annoyed', 'smug', 'surprised', 'sad', 'neutral', 'happy'] }),
    loadRobloxCharacter('Leo', { expressions: ['determined', 'shocked', 'scared', 'surprised', 'annoyed', 'happy'], hairLift: 0.16 }),
    loadRobloxCharacter('Noob', { expressions: ['determined', 'shocked', 'surprised', 'happy', 'neutral'] }),
    loadRobloxCharacter('Mia', { expressions: ['shocked', 'annoyed', 'determined', 'happy', 'surprised'] }),
    loadRobloxCharacter('Skye', { expressions: ['laugh', 'smug', 'happy', 'surprised'] }),
  ]);
  scene.add(max.root, leo.root, noob.root, mia.root, skye.root);
  await wear(max, 'ranger_hat'); await wear(leo, 'ranger_hat'); await wear(noob, 'ranger_hat');
  for (const [a, c] of [[max, '#7a6a42'], [leo, '#7a6a42'], [noob, '#7a6a42']]) dress(a, { color: c, hem: 0.2, buttons: '#c9a03a', collar: '#6a5a36', belt: '#4a3a22' });
  dress(mia, { color: '#9a6a4a', hem: 0.1, collar: '#7a4a2a' });
  dress(skye, { color: '#2b2d42', hem: 0.3, buttons: '#c9a03a', collar: '#f4f2ec' });
  for (let i = 0; i < 6; i++) {                          // recoloured Noobs: farmers, MPs
    const e = await loadRobloxCharacter('Noob', { expressions: ['laugh', 'happy', 'surprised', 'annoyed'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats; e.suit = dress(e, { color: '#2b2d42', hem: 0.3, collar: '#f4f2ec' });
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shock', 'laugh_big', 'point_forward', 'facepalm', 'clap', 'shrug', 'think', 'look_up', 'duck', 'sit']) A[n] = await loadAnimation(n);
  WH = wheat(scene); PA = parliament(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  add('gun', lewisGun()); add('truck', armyTruck());
  for (let i = 0; i < 4; i++) add('ammo' + i, ammoBox(true));
  for (let i = 0; i < 44; i++) { const e = emu(i, i === 0 ? 1.18 : 0.92 + (i % 5) * 0.04); scene.add(e); EMUS.push(e); }
  for (let i = 0; i < 8; i++) { const p = puff(); p.visible = false; scene.add(p); puffs.push(p); }
}

// ---------- helpers ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
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
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - p.y;
  if (x.lift) a.root.position.y += x.lift;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal) {
  const i = folk.indexOf(f);
  for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i % SKIN.length]);
  f.suit.visible = !!pal.suit;
}
// a salute: right arm raised forward and turned in so the fist sits at the hat brim
const SALUTE = [['R', 0.18, -2.75]];

// ---------- the emus ----------
// Each emu has a home spot in the field; a shot decides what they do (graze, flee, charge, run beside the truck).
const r = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
const HOME = (i) => V(-40 + r(i, 1) * 80, 0, -6 - r(i, 2) * 40);
function emuStates(s) {
  const id = SHOT, out = [];
  const graze = (i, p, h) => out.push({ i, pos: p, h, run: null, peck: 0.5 + 0.5 * Math.sin(s * 3 + i * 1.7), look: 0 });
  if (id === 'hook' || id === 'farmers') EMUS.forEach((e, i) => graze(i, HOME(i), r(i, 3) * 6.28));
  else if (id === 'day1') EMUS.forEach((e, i) => {
    const h0 = HOME(i), k = clamp((s - T.scatter) / 3), group = i % 5, dir = -1.2 + group * 0.6;
    if (s < T.scatter) out.push({ i, pos: h0, h: PI, run: null, peck: 0, look: 0.4 * Math.sin(s * 2 + i), alert: 1 });
    else { const d = 14 * (s - T.scatter); out.push({ i, pos: h0.clone().add(V(Math.sin(dir + PI) * d, 0, Math.cos(dir + PI) * d)), h: dir + PI, run: (s - T.scatter) * 9 + i }); }
  });
  else if (id === 'day3' || id === 'jams') EMUS.forEach((e, i) => {                      // a big mob walks towards the dam
    const row = Math.floor(i / 8), col = i % 8, start = G(DAM.x + 50 + row * 4 + r(i, 4) * 2, 0, DAM.z + 4 + (col - 3.5) * 3.2);
    if (id === 'day3' || s < T.jam + 0.2) { const d = 3.2 * (s - T.day3 + 2); out.push({ i, pos: start.clone().add(V(-d, 0, 0)), h: -R90, run: d * 0.9 + i }); }
    else { const k = s - T.jam - 0.2, ang = r(i, 5) * 6.28; out.push({ i, pos: start.clone().add(V(-3.2 * (T.jam + 2.2 - T.day3) + Math.cos(ang) * 16 * k, 0, Math.sin(ang) * 16 * k)), h: Math.atan2(Math.cos(ang), Math.sin(ang)), run: k * 10 + i }); }
  });
  else if (id === 'bolts' || id === 'outrun' || id === 'ride') EMUS.slice(0, 14).forEach((e, i) => {
    const tr = truckX(s), lead = id === 'bolts' ? 6 + i * 2.2 : 2 + i * 1.2 + (s - T.outrun) * 4;
    out.push({ i, pos: G(tr + lead - 8, 0, -4 - (i % 4) * 3.2), h: R90, run: s * 11 + i });
  });
  else if (id === 'lookout') {
    out.push({ i: 0, pos: G(MOUND.x, 1.9, MOUND.z), h: 0.4, run: null, peck: 0, look: 0.8 * Math.sin((s - T.lookout) * 2.2), alert: 1 });
    EMUS.slice(1, 16).forEach((e, j) => graze(j + 1, G(MOUND.x - 8 + r(j, 6) * 16, 0, MOUND.z - 6 + r(j, 7) * 9), r(j, 8) * 6.28));
  }
  else if (id === 'week' || id === 'pulls') EMUS.slice(0, 18).forEach((e, i) => graze(i, G(-24 + i * 2.8, 0, -10 - (i % 3) * 3), r(i, 9) * 6.28));
  else if (id === 'admits' || id === 'won' || id === 'cta') EMUS.slice(0, 12).forEach((e, i) => out.push({ i, pos: G(-11 + i * 2.0, 0, -6 - (i % 2) * 2.6), h: 0.15 * (i - 6) * 0.1, run: null, peck: 0, look: 0.15 * Math.sin(s * 1.5 + i), alert: 1 }));
  return out;
}
const truckX = (s) => (SHOT === 'bolts' ? -30 + 8 * Math.max(0, s - T.bolts) : -30 + 8 * (T.outrun - T.bolts) + 10 * Math.max(0, s - T.outrun));

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.farmers, 'farmers'], [T.sends, 'sends'], [T.day1, 'day1'], [T.day3, 'day3'], [T.jams, 'jams'], [T.bolts, 'bolts'],
  [T.outrun, 'outrun'], [T.ride, 'ride'], [T.lookout, 'lookout'], [T.week, 'week'], [T.parl, 'parl'], [T.pulls, 'pulls'], [T.admits, 'admits'],
  [T.won, 'won'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }
function light(stage, inside) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = inside ? 0 : 3.3; stage.hemi.intensity = inside ? 0.5 : 0.6; stage.hemi.color.set(inside ? '#ffe9c8' : '#ffefd6'); sc.environmentIntensity = inside ? 0.35 : 0.6;
  stage.fill.intensity = 0.6; stage.rim.intensity = 1.0; PA.lamp.intensity = inside ? 60 : 0;
  u.zenith.value.set('#2f7fe6'); u.horizon.value.set('#d9ecff'); sc.fog.color.set('#e8eef2'); sc.fog.near = 180; sc.fog.far = 800;
}

// ---------- per-shot cast ----------
const FARMER = [{ shirt: '#8a5a3a', pants: '#3a3a3a' }, { shirt: '#5a7a4a', pants: '#2b2d33' }, { shirt: '#9a8a6a', pants: '#3a2e24' }];
const MP = { shirt: '#f4f2ec', pants: '#2b2d42', suit: true };
const GUN_AT = G(DAM.x + 18, 0, DAM.z + 5.5);
function castStates(s) {
  const M = new Map(), id = SHOT;
  if (id === 'hook') {
    const m = base(G(1.0, 0, 6.5), 0.45, 'shocked'); m.layers = [['shock', s - 0.2, 1, false]]; if (s > W.eating) m.face = 'annoyed'; M.set(mia, m);
  } else if (id === 'farmers') {
    const m = base(G(1.0, 0, 6.5), 0.25, 'determined'); m.arms = s > W.soldiers - 0.2 ? SALUTE : []; M.set(mia, m);
    [[-3.0, 6.2], [4.6, 6.8]].forEach(([x, z], i) => { const f = base(G(x, 0, z), 0.2 - i * 0.4, 'annoyed'); f.arms = s > W.soldiers ? SALUTE : []; f.pal = FARMER[i]; M.set(folk[i], f); });
  } else if (id === 'sends') {
    const L = [[max, 0, 'determined'], [leo, -2.8, 'determined'], [noob, 2.8, 'determined']];
    L.forEach(([a, x, f], i) => { const st = base(G(20 + x, 0, 9.5), PI - 0.15, f); moveTo(st, G(32 + x, 0, 10 + i * 0.5), G(18 + x * 1.1, 0, 9.5), T.sends - 0.1, s, 12, -0.2); if (i === 0 && !st.moving && s > W.major1) st.arms = SALUTE; M.set(a, st); });
  } else if (id === 'day1') {
    const x = base(G(-3, 0, 8), 0.6, 'determined'); moveTo(x, G(2, 0, 9), G(-3, 0, 8), T.day1 - 0.2, s, 12, 0.6); if (s > T.scatter) { x.layers = [['shock', s - T.scatter, 1, false]]; x.face = 'shocked'; } M.set(max, x);
  } else if (id === 'day3' || id === 'jams') {
    const g = base(GUN_AT.clone().add(V(-2.6, 0, 0.0)), R90, 'determined'); g.sit = true; g.pos.y = -0.9; g.layers = [['sit', 0, 1, false]]; g.arms = [['R', 0.05, -1.4], ['L', 0.05, -1.4]];
    if (id === 'jams' && s > T.jam) { g.face = 'shocked'; g.arms = [['R', 0.4, -1.0], ['L', 0.4, -1.0]]; }
    M.set(leo, g);
    const m = base(GUN_AT.clone().add(V(-4.0, 0, -3.6)), R90 - 0.2, 'determined'); m.layers = [['duck', 0.6, 1, false]]; if (id === 'jams' && s > T.jam + 0.1) { m.layers = [['facepalm', s - T.jam - 0.1, 1, false]]; m.face = 'annoyed'; } M.set(max, m);
  } else if (id === 'bolts' || id === 'outrun' || id === 'ride') {
    const tx = truckX(s), bump = Math.abs(Math.sin(s * 23)) * 0.25 + Math.abs(Math.sin(s * 9)) * 0.2;
    const g = base(G(tx - 3.4, 2.03 + bump, 4.4), R90, 'determined'); g.sit = false; g.arms = [['R', 0.05, -1.4], ['L', 0.05, -1.4]]; g.lean = 0.15 * Math.sin(s * 17);
    if (id === 'ride') g.face = 'scared';
    if (id === 'outrun') g.face = 'shocked';
    M.set(leo, g);
    const d = base(G(tx + 2.2, 2.0 + bump * 0.5, 5.4), R90, 'determined'); d.sit = true; d.pos.y = 0.6 + bump * 0.5; d.layers = [['sit', 0, 1, false]]; d.arms = [['R', 0.0, -1.3], ['L', 0.0, -1.3]]; M.set(max, d);
  } else if (id === 'week') {
    const m = base(G(2, 0, 7.0), 0.3, 'sad'); m.sit = true; m.pos.y = -0.55; m.layers = [['sit', 0, 1, false]]; if (s > W.arent - 0.1) m.face = 'annoyed'; M.set(max, m);
  } else if (id === 'parl') {
    const k = base(P(-3.4, 0, 3.0), 0.5, 'laugh'); k.layers = [['laugh_big', s - T.parl, 1, false]]; M.set(skye, k);
    [[-3.6, -4], [3.6, -4.5], [3.4, 2.4], [-3.8, 7.5], [3.6, 7.5]].forEach(([x, z], i) => { const f = base(P(x, 0, z), x < 0 ? 0.8 : -0.8, 'laugh'); f.layers = [[i % 2 ? 'laugh_big' : 'clap', s - T.parl + i * 0.2, 1, i % 2 === 0]]; f.pal = MP; M.set(folk[i], f); });
  } else if (id === 'pulls') {
    // the truck drives off down the track; the gunners in the back
  } else if (id === 'admits' || id === 'won' || id === 'cta') {
    const m = base(G(0, 0, 4.8), 0.2, 'surprised'); m.arms = s > W.admits + 0.2 ? SALUTE : []; if (s > W.tanks - 0.1) m.face = 'determined'; if (id !== 'admits') { m.arms = []; m.layers = [['shrug', s - T.won, 1, false]]; m.face = 'annoyed'; } M.set(max, m);
  }
  return M;
}

const BURSTS = [];
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  light(stage, SHOT === 'parl');
  for (const a of [max, leo, noob, mia, skye, ...folk]) a.root.visible = false;
  const states = castStates(s);
  for (const a of [max, leo, noob, mia, skye]) if (states.has(a)) place(a, states.get(a));
  folk.forEach((f) => { const x = states.get(f); if (x) { paint(f, x.pal); place(f, x); } });
  // emus
  for (const e of EMUS) e.visible = false;
  for (const st of emuStates(s)) { const e = EMUS[st.i]; e.visible = true; e.position.copy(st.pos); e.rotation.set(0, st.h, 0); setEmu(e, st); }
  // props
  for (const p of Object.values(PROPS)) p.visible = false;
  BURSTS.length = 0;
  const show = (key, pos, yaw = 0) => { const o = PROPS[key]; o.visible = true; o.position.copy(pos); o.rotation.set(0, yaw, 0); return o; };
  if (SHOT === 'sends') { const tr = show('truck', G(lerp(60, 34, smooth(clamp((s - T.sends + 0.6) / 1.2))), 0, 13), PI); tr.rotation.y = PI; }
  if (SHOT === 'day3' || SHOT === 'jams') {
    show('gun', GUN_AT, R90);
    if (SHOT === 'jams' && s >= T.jam && s < T.jam + 0.8) BURSTS.push([GUN_AT.clone().add(V(0.4, 1.5, 0)), T.jam, 1.0]);
  }
  if (SHOT === 'bolts' || SHOT === 'outrun' || SHOT === 'ride') { const tx = truckX(s), b = Math.abs(Math.sin(s * 23)) * 0.25 + Math.abs(Math.sin(s * 9)) * 0.2; const tr = show('truck', G(tx, b * 0.5, 4.4), 0); tr.rotation.z = 0.04 * Math.sin(s * 19); BURSTS.push([G(tx - 7, 0.5, 4.4), s - ((s * 3) % 1) * 0.55, 1.2]); }
  if (SHOT === 'week') for (let i = 0; i < 4; i++) show('ammo' + i, G(-1.5 + i * 1.8, 0, 9.2 - (i % 2) * 0.8), 0.2 * i);
  if (SHOT === 'pulls') { const tr = show('truck', G(-2 - 6 * Math.max(0, s - T.pulls), 0, 8.4), PI); tr.rotation.y = PI; }
  let pi = 0; for (const p of puffs) p.visible = false;
  for (const [pos, t0, size] of BURSTS) {
    const a = (s - t0) / 0.55; if (a < 0 || a > 1) continue;
    for (let j = 0; j < 6 && pi < puffs.length; j++, pi++) { const p = puffs[pi], ang = j / 6 * 6.283; p.visible = true; p.position.copy(pos).add(V(Math.cos(ang) * size * 0.8 * easeOut(a), 0.4 * size * a, Math.sin(ang) * size * 0.5 * easeOut(a))); p.scale.setScalar(size * (0.35 + 0.5 * easeOut(a))); p.material.opacity = 0.75 * (1 - a); p.material.color.set(SHOT === 'jams' ? '#9aa0a8' : '#d9b48a'); }
  }
  // cameras
  switch (shot.id) {
    case 'hook': look(stage, G(lerp(4.0, 5.5, u), lerp(5.2, 6.2, u), lerp(17, 20, u)), G(0, 3.4, -4), 52, 30); break;
    case 'farmers': look(stage, G(lerp(1.4, 0.8, u), 4.8, lerp(17, 15.5, u)), G(0.8, 3.8, 6.5), 50, 18); break;
    case 'sends': look(stage, G(lerp(14, 15, u), 5.0, 24), G(20, 3.6, 10), 52, 30); break;
    case 'day1': look(stage, G(lerp(2, 3, u), 6.4, 24), G(-1, 3.0, -6), 54, 40); break;
    case 'day3': look(stage, GUN_AT.clone().add(V(-9.0, 4.4, 5.0)), GUN_AT.clone().add(V(12, 2.6, -1.0)), 52, 30); break;
    case 'jams': look(stage, GUN_AT.clone().add(V(5.0, 3.6, 4.0)), GUN_AT.clone().add(V(-1.6, 2.4, -0.6)), 48, 14); break;
    case 'bolts': case 'outrun': { const tx = truckX(t); look(stage, G(tx + 3, 5.5, 20), G(tx + 6, 2.6, 0), 54, 30); break; }
    case 'ride': { const tx = truckX(t), j = 0.15 * Math.sin(t * 31); look(stage, G(tx + 3.0 + j, 6.0 + j, 10.0), G(tx - 3.2, 4.4 + j, 4.4), 48, 16); break; }
    case 'lookout': look(stage, G(MOUND.x + lerp(3, 1.5, u), 6.2, MOUND.z + 15), G(MOUND.x, 5.2, MOUND.z), 50, 22); break;
    case 'week': look(stage, G(lerp(4.6, 4.0, u), 5.4, 19), G(1.0, 3.2, 4), 52, 26); break;
    case 'parl': look(stage, P(lerp(-1, 1, u), 7.2, 21), P(0, 3.6, 0), 56, 30); break;
    case 'pulls': look(stage, G(-4 - 3 * u, 5.0, 24), G(-8 - 6 * u, 3.0, 2), 54, 30); break;
    case 'admits': look(stage, G(lerp(1.2, 0.8, u), 4.8, lerp(13.5, 12.5, u)), G(0, 3.8, 1), 50, 20); break;
    case 'won': case 'cta': { const k = easeOut(clamp((t - T.won) / (meta.seconds - T.won))); look(stage, G(lerp(1.0, 1.6, k), lerp(5.0, 6.5, k), lerp(17, 22, k)), G(0, lerp(3.8, 5.0, k), -3), 50, 24); break; }
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
// the army's kit list, ticking in
function kitList(g, s, t) {
  const items = [[W.major1, '1 MAJOR'], [W.gunners, '2 GUNNERS'], [W.machine1, '2 MACHINE GUNS'], [W.ten, '10,000 BULLETS']];
  const a = clamp((t - W.major1 + 0.2) / 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate(540 * s, 520 * s);
  roundRect(g, -330 * s, -190 * s, 660 * s, 380 * s, 30 * s); g.fillStyle = 'rgba(58,64,40,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#e9e2cf'; g.stroke();
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#e9e2cf'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SENT TO FIGHT THE EMUS:', 0, -140 * s);
  items.forEach(([t0, txt], i) => { if (t < t0 - 0.1) return; const k = pop(t, t0 - 0.1); g.save(); g.translate(0, (-70 + i * 70) * s); g.scale(k, k); g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText(txt, 0, 0); g.restore(); });
  g.restore();
}
function medal(g, s, t, t0, x, y) {
  const k = pop(t, t0); if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k); g.rotate(0.08);
  g.fillStyle = '#c8202b'; g.beginPath(); g.moveTo(-50 * s, -170 * s); g.lineTo(50 * s, -170 * s); g.lineTo(30 * s, -40 * s); g.lineTo(-30 * s, -40 * s); g.fill();
  g.fillStyle = '#ffd23f'; g.strokeStyle = '#8a6a1a'; g.lineWidth = 8 * s; g.beginPath(); g.arc(0, 30 * s, 90 * s, 0, 7); g.fill(); g.stroke();
  // a little emu head on the medal
  g.fillStyle = '#5a4a3a'; g.fillRect(-14 * s, -10 * s, 26 * s, 70 * s); g.fillStyle = '#6f7f9a'; g.fillRect(-22 * s, -36 * s, 40 * s, 32 * s); g.fillStyle = '#2b2620'; g.fillRect(14 * s, -26 * s, 26 * s, 12 * s); g.fillStyle = '#111'; g.fillRect(-4 * s, -28 * s, 8 * s, 8 * s);
  g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'hook') { tag(g, s, t, 0.0, 'WESTERN AUSTRALIA, 1932'); if (t > W.twenty - 0.1) bigText(g, s, '20,000 EMUS', 540, 470, 120, '#ffffff', pop(t, W.twenty - 0.1), -0.04); }
  if (SHOT === 'farmers' && t > W.soldiers - 0.2) bigText(g, s, 'WAR VETERANS', 540, 470, 96, '#ffd23f', pop(t, W.soldiers - 0.2), -0.04);
  if (SHOT === 'sends') kitList(g, s, t);
  if (SHOT === 'day1') { tag(g, s, t, T.day1, 'DAY ONE'); if (t > T.scatter) bigText(g, s, 'SCATTER!', 540, 470, 120, '#ffffff', pop(t, T.scatter), -0.04); }
  if (SHOT === 'day3') { tag(g, s, t, T.day3, 'DAY THREE', 'the ambush at the dam'); if (t > W.thousand1 - 0.1) bigText(g, s, '1,000 EMUS', 540, 470, 120, '#ffffff', pop(t, W.thousand1 - 0.1), -0.04); }
  if (SHOT === 'jams') stamp(g, s, t, T.jam, 'JAMMED!', 540, 480, '#e63946', 130);
  if (SHOT === 'outrun') bigText(g, s, 'TOO SLOW!', 540, 470, 110, '#ffffff', pop(t, T.outrun + 0.2), -0.04);
  if (SHOT === 'ride') {
    if (t > W.aim - 0.25) { const jx = 70 * Math.sin(t * 29), jy = 60 * Math.cos(t * 23); g.save(); g.strokeStyle = '#e63946'; g.lineWidth = 8 * s; g.beginPath(); g.arc((540 + jx) * s, (820 + jy) * s, 90 * s, 0, 7); g.moveTo((540 + jx - 130) * s, (820 + jy) * s); g.lineTo((540 + jx + 130) * s, (820 + jy) * s); g.moveTo((540 + jx) * s, (820 + jy - 130) * s); g.lineTo((540 + jx) * s, (820 + jy + 130) * s); g.stroke(); g.restore(); }
    bigText(g, s, 'BUMP! BUMP!', 540, 330, 100, '#ffd23f', pop(t, T.ride + 0.1), 0.05 * Math.sin(t * 20));
  }
  if (SHOT === 'lookout' && cam && t > W.lookout - 0.1) {
    const v = EMUS[0].position.clone().add(V(0, 6.6, 0)).project(cam), x = (v.x + 1) / 2 * 1080, y = (1 - v.y) / 2 * 1920;
    bigText(g, s, 'LOOKOUT', x, y - 90, 80, '#ffd23f', pop(t, W.lookout - 0.1), -0.04);
    g.save(); g.fillStyle = '#ffd23f'; g.strokeStyle = '#16141f'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo((x - 26) * s, (y - 36) * s); g.lineTo((x + 26) * s, (y - 36) * s); g.lineTo(x * s, y * s); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
  if (SHOT === 'week') {
    tag(g, s, t, T.week, 'ONE WEEK LATER');
    const k = easeOut(clamp((t - W.half + 0.2) / 0.8)); if (t > W.half - 0.2) { bigText(g, s, `${Math.round(2500 * k).toLocaleString('en')}`, 540, 420, 150, '#ffffff', pop(t, W.half - 0.2), -0.04); bigText(g, s, 'BULLETS GONE', 540, 550, 70, '#ffd23f', pop(t, W.half), -0.04); }
    if (t > W.arent - 0.1) stamp(g, s, t, W.arent - 0.1, 'EMUS: FINE', 540, 700, '#1e9e55', 80, 0.06);
  }
  if (SHOT === 'parl') { tag(g, s, t, T.parl, 'PARLIAMENT'); if (t > W.medals - 0.2) { bigText(g, s, 'A MEDAL?', 540, 400, 110, '#ffffff', pop(t, W.medals - 0.2), -0.04); medal(g, s, t, W.medals - 0.1, 820, 560); } }
  if (SHOT === 'pulls') stamp(g, s, t, T.pulls + 0.15, 'RETREAT', 540, 470, '#e63946', 120);
  if (SHOT === 'admits' && t > W.birds - 0.2) {
    const k = pop(t, W.birds - 0.2); g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
    roundRect(g, -430 * s, -130 * s, 860 * s, 260 * s, 30 * s); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#16182a'; g.stroke();
    g.font = `${50 * s}px "Luckiest Guy"`; g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('"THEY CAN FACE MACHINE GUNS', 0, -40 * s); g.fillText('LIKE TANKS"', 0, 30 * s);
    g.font = `800 ${26 * s}px Montserrat`; g.fillStyle = '#5a6478'; g.fillText('- THE MAJOR, 1932', 0, 90 * s); g.restore();
  }
  if ((SHOT === 'won' || SHOT === 'cta') && t < T.cta + 0.1) {
    const a = 1 - clamp((t - T.cta) / 0.15); g.save(); g.globalAlpha = a;
    bigText(g, s, 'ARMY VS EMUS', 540, 380, 90, '#ffffff', pop(t, W.war - 0.2), -0.04);
    if (t > W.won - 0.15) { bigText(g, s, 'THE EMUS WON', 540, 510, 110, '#ffd23f', pop(t, W.won - 0.15), -0.04); medal(g, s, t, W.won, 860, 700); }
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

export const cast = () => ({ max, leo, noob, mia, skye, folk0: folk[0] });
export const TIMES = T;
export const props = () => PROPS;
