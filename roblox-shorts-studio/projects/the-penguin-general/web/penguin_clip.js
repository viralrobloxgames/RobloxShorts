// The Penguin General. Web renderer + Roblox R6 pack. True story: Sir Nils Olav, the king penguin at Edinburgh Zoo
// adopted by the Norwegian King's Guard in 1972 as a lance corporal and promoted on every visit since: corporal,
// sergeant, regimental sergeant major; the penguins change but the name and rank carry on; knighted in 2008 (130
// guardsmen on parade, a citation "in every way qualified"); a bronze statue; brigadier 2016; major general 2023.
// The penguin is built in code (kit.js). Max, Leo, Skye and recoloured Noobs are guardsmen (dark blue tunics, white
// belts); Mia is the keeper; the Noob is the officer with the ceremonial sword; Leo reads the citation.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import { zoo, dress, guardUniform, penguin, posePenguin, sword, scroll, ZOO, POOL, STATUE, PATH_Z, LINE_Z } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Penguin General' };
export const sky = { zenith: '#5a8fd6', horizon: '#dbe8f2', below: '#f0f6ff', fog: '#e3edf5', sunDir: new THREE.Vector3(0.4, 0.62, 0.68) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2;

// ---------- key times (all on the narration) ----------
const T = {
  close: W.outranks - 0.2, y1972: W.started - 0.15, name: W.name1 - 0.15, visits: W.every - 0.15, change: W.penguins - 0.15,
  knight: W.king - 0.15, march: W.hundred - 0.15, citation: W.citation - 0.15, statue: W.bronze - 0.35, brigadier: W.brigadier - 0.2,
  general: W.twentythree - 0.25, trained: W.trained - 0.15, dive: W.past + 0.1, cta: W.follow - 0.15,
};

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, folk = [], ZO, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
let peng, peng2, bronze, splash = [];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9', '#a86b3c', '#e8b98a'];
export async function setup(stage) {
  const { scene } = stage;
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['neutral', 'determined', 'happy', 'surprised', 'smug'] }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'laugh', 'surprised'] }),
    loadRobloxCharacter('Leo', { expressions: ['neutral', 'determined', 'happy', 'surprised', 'laugh'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['neutral', 'determined', 'happy', 'surprised'] }),
    loadRobloxCharacter('Noob', { expressions: ['neutral', 'determined', 'happy'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  for (const a of [max, leo, skye, noob]) DRESS[a.name] = guardUniform(a);
  noob.root.traverse((o) => { if (o.isMesh && /Leg/.test(o.name)) { o.material = o.material.clone(); o.material.map = null; o.material.color.set('#1b2235'); } });
  DRESS.keeper = dress(mia, { color: '#3a6b3a', hem: 0.2, buttons: '#e9e2c8', collar: '#2a4f2a' });
  for (let i = 0; i < 8; i++) {                          // recoloured Noobs in guard uniform
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'determined', 'happy', 'surprised'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    for (const m of mats.pants) m.color.set('#1b2235'); for (const m of mats.skin) m.color.set(SKIN[i]);
    guardUniform(e); scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'laugh', 'proud', 'point_forward', 'look_up', 'talk', 'clap']) A[n] = await loadAnimation(n);
  ZO = zoo(scene);
  peng = penguin(); peng2 = penguin(); bronze = penguin({ bronze: true }); scene.add(peng, peng2, bronze);
  bronze.position.set(STATUE.x, 2.85, STATUE.z); bronze.rotation.y = 0.15; posePenguin(bronze, { flap: 0.15 });
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('sword', sword()); add('scroll', scroll());
  for (let i = 0; i < 6; i++) { const p = puff(); p.visible = false; scene.add(p); splash.push(p); }
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [['walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
const SALUTE = [['R', 2.45, -0.4]];                      // right hand raised beside the brow (one arm; checked in previews)
const ATTN = [['L', 0.02, 0.0], ['R', 0.02, 0.0]];
// The guard line: 8 places along LINE_Z facing the path (+z).
const LINE_X = [-8.4, -6.2, -4.0, -1.8, 0.4, 2.6, 4.8, 7.0];
const salutes = (s) => (s >= W.salute1 - 0.15 && s < T.y1972) || (s >= T.general && s < T.cta + 0.1 && s >= W.twentythree - 0.25) || s >= T.cta;
function guardAt(i, s, who) {
  let x = base([LINE_X[i], 0, LINE_Z], 0, 'determined'); x.visible = false; x.arms = ATTN;
  const inLine = s < T.y1972 || (s >= T.visits && s < T.knight) || (s >= T.brigadier && s < T.dive + 1.2) || s >= T.cta;
  if (inLine) { x.visible = true; if (salutes(s)) x.arms = SALUTE; if (who === 'max' && s >= W.outranks && s < T.y1972) x.face = 'surprised'; return x; }
  if (s >= T.march && s < T.citation) {                     // marching into the zoo in two columns of five
    x.visible = true; const col = i % 2, row = Math.floor(i / 2);
    const z = PATH_Z - 1.0 + col * 2.4, from = V(-34 - row * 2.6, 0, z), to = V(10 - row * 2.6, 0, z);
    moveTo(x, from, to, T.march - 0.6, s, 10, R90); x.arms = []; return x;
  }
  if (s >= T.knight && s < T.march && i < 6) {               // the knighting: guards in a line behind
    x.visible = true; x.pos = V(LINE_X[i + 1], 0, LINE_Z - 1.6); return x;
  }
  if (s >= T.citation && s < T.statue && i < 7 && i !== 2) { x.visible = true; x.pos = V(LINE_X[i], 0, LINE_Z - 1.6); return x; }
  return x;
}
// Pickings for the two cast-only roles
function miaAt(s) {
  let x = base([POOL.x + 9.0, 1.0, POOL.z + 3.0], -R90 + 0.4, 'happy'); x.visible = false;
  if (s >= T.y1972 && s < T.visits) { x.visible = true; x.pos = V(POOL.x + 9.0, 0, POOL.z - 1.4); x.heading = -0.5; x.layers = [['clap', s - T.y1972, 1, true]]; return x; }
  if (s >= T.cta) { x.visible = true; x.pos = V(-10.8, 0, LINE_Z); x.heading = 0.1; x.face = 'laugh'; return x; }
  return x;
}
function noobAt(s) {                                          // the officer with the ceremonial sword
  let x = base([1.9, 0, PATH_Z], -R90, 'determined'); x.visible = false;
  if (s >= T.knight && s < T.march) {
    x.visible = true; x.pos = V(2.1, 0, PATH_Z - 0.2); x.heading = -R90 + 0.25;
    const tap = (t0) => Math.sin(clamp((s - t0) / 0.35) * Math.PI);
    const k = Math.max(tap(W.king + 0.2), tap(W.knight - 0.1));
    x.arms = [['R', 0.0, lerp(-1.1, -1.5, smooth(inv(T.knight, T.knight + 0.3, s))) - 0.25 * k]]; x.sword = true; return x;
  }
  return x;
}
function leoCitation(s) {
  if (s < T.citation || s >= T.statue) return null;
  const x = base([-2.6, 0, PATH_Z - 0.4], R90 - 0.3, 'determined'); x.arms = [['L', -0.36, -1.05], ['R', -0.36, -1.05]]; x.scroll = true;
  if (s > W.qualified - 0.2) x.face = 'happy'; return x;
}
// The 1972 visit (Max, Leo, Skye): they march in single file from off-screen right and halt facing the penguin on the rim
const PEN72 = V(POOL.x + 3.0, 1.0, POOL.z + 4.1);          // the penguin's spot on the pool's front rim (rim top y = 1.0)
function guard1972(i, s) {
  const x = base([0, 0, 0], -R90, 'happy'), z = PEN72.z + 1.3 + (i % 2) * 0.4;
  const m = moveTo(x, V(-1.0 + i * 1.7, 0, z), V(PEN72.x + 2.0 + i * 1.7, 0, z), W.norways - 0.1, s, 5, -R90 + (i === 0 ? 0.75 : 0));   // the nearest turns half to camera so his salute shows
  if (!m.moving && s > W.lance - 0.1 && i === 0) { x.arms = SALUTE; x.face = 'determined'; }
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, t, w = 1, loop]) => [A[n], t, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  a.root.updateMatrixWorld(true);
  a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const between = (a, d = 1.3) => grip(a, 'L', d).lerp(grip(a, 'R', d), 0.5);
const armQ = (a, sd) => { const q = new THREE.Quaternion(); a.bones['Arm.' + sd].getWorldQuaternion(q); return q; };

// The penguin(s): a pure function of time; returns state for camera framing.
const WSPEED = 2.4, WSTRIDE = 0.9;
function pengWalk(p, from, to, t0, s, endHeading, opts = {}) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * WSPEED / d), moving = u > 0 && u < 1;
  p.visible = true; p.position.copy(from).lerp(to, u);
  p.rotation.set(0, moving || u < 1 ? Math.atan2(to.x - from.x, to.z - from.z) : endHeading, 0);
  if (u >= 1) p.rotation.y = endHeading;
  posePenguin(p, { phase: (u * d) / WSTRIDE, moving: moving ? 1 : 0, ...opts });
  return { done: u >= 1, arrive: t0 + d / WSPEED };
}
function pengStand(p, pos, heading, opts = {}) { p.visible = true; p.position.copy(pos); p.rotation.set(0, heading, 0); posePenguin(p, opts); }
function penguins(s) {
  peng.visible = peng2.visible = false;
  if (s < T.y1972) { pengWalk(peng, V(-7.5, 0, PATH_Z), V(5.0, 0, PATH_Z), 0.0, s, 0.4, { look: s > W.outranks ? 0.5 : 0 }); return peng; }
  if (s < T.visits) {                                        // 1972: on the pool's front rim, facing the guards as they arrive
    pengWalk(peng, PEN72, PEN72.clone().add(V(0, 0, 0.01)), T.y1972, s, R90 - 0.6, { flap: s > W.adopts && s < W.adopts + 0.6 ? 0.6 : 0 }); return peng;
  }
  if (s < T.change) { pengStand(peng, V(0.4, 0, PATH_Z), 0.1, { flap: 0.25 * Math.max(0, Math.sin((s - T.visits) * 6)) * (s > W.corporal2 - 0.1 ? 1 : 0), look: 0.15 * Math.sin(s * 2) }); return peng; }
  if (s < T.knight) {                                        // one walks off, a lookalike walks in
    pengWalk(peng, V(0.4, 0, PATH_Z), V(-12, 0, PATH_Z), W.dies - 0.2, s, -R90);
    pengWalk(peng2, V(12, 0, PATH_Z), V(0.4, 0, PATH_Z), W.lookalike - 0.5, s, 0.1);
    if (s < W.lookalike - 0.5) peng2.visible = false;
    return peng2;
  }
  if (s < T.march) { pengStand(peng2, V(0.0, 0, PATH_Z), R90 - 0.25, { bow: s > W.knight - 0.2 && s < W.knight + 0.6 ? 0.35 : 0 }); return peng2; }
  if (s < T.citation) { pengStand(peng2, V(12.5, 0, PATH_Z + 0.4), -R90 + 0.3, { look: -0.3 }); return peng2; }
  if (s < T.statue) { pengStand(peng2, V(0.0, 0, PATH_Z), -0.6, { flap: s > W.qualified ? 0.5 * Math.abs(Math.sin((s - W.qualified) * 8)) : 0 }); return peng2; }
  if (s < T.brigadier) { pengStand(peng2, V(STATUE.x - 2.4, 0, STATUE.z + 3.0), 1.0, { look: 0.5, bow: -0.35 }); return peng2; }
  if (s < T.trained) { pengStand(peng2, V(0.4, 0, PATH_Z), 0.0, { flap: s > T.general + 0.2 ? 0.3 : 0 }); return peng2; }
  if (s < T.dive) { pengWalk(peng2, V(5.0, 0, PATH_Z), V(-9.0, 0, PATH_Z), T.trained - 0.2, s, -R90); return peng2; }
  if (s < T.cta) {                                            // a belly flop into the pool
    const k = smooth(inv(T.dive, T.dive + 0.6, s));
    pengStand(peng2, V(lerp(-9.0, -11.5, k), lerp(0, 0.6, Math.sin(k * Math.PI)) + lerp(0, 0.5, k), lerp(PATH_Z, POOL.z + 2.0, k)), -R90 - 0.6, { lean: lerp(0, 1.45, k), flap: 1 });
    return peng2;
  }
  pengStand(peng2, V(-0.2, 0, PATH_Z + 0.6), 0.15, { flap: 0.3 * Math.abs(Math.sin((s - T.cta) * 5)) }); return peng2;
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.close, 'close'], [T.y1972, 'y1972'], [T.name, 'name'], [T.visits, 'visits'], [T.change, 'change'], [T.knight, 'knight'],
  [T.march, 'march'], [T.citation, 'citation'], [T.statue, 'statue'], [T.brigadier, 'brigadier'], [T.general, 'general'], [T.trained, 'trained'],
  [T.dive, 'dive'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  stage.sun.intensity = 2.8; stage.hemi.intensity = 0.55;

  // ---------- cast ----------
  for (const a of [max, mia, leo, skye, noob, ...folk]) a.root.visible = false;
  const guards = [folk[0], folk[1], max, folk[2], leo, folk[3], skye, folk[4]];
  const states = new Map();
  guards.forEach((a, i) => states.set(a, guardAt(i, s, a === max ? 'max' : '')));
  if (s >= T.march && s < T.citation) [folk[5], folk[6]].forEach((a, j) => states.set(a, guardAt(8 + j < 10 ? 8 + j : 9, s)));
  if (s >= T.y1972 && s < T.visits) { [max, leo, skye].forEach((a, i) => states.set(a, guard1972(i, s))); }
  const lc = leoCitation(s); if (lc) states.set(leo, lc);
  states.set(mia, miaAt(s)); states.set(noob, noobAt(s));
  for (const [a, x] of states) place(a, x);
  const P = penguins(s);

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  if (noob.root.visible && states.get(noob).sword) { const sw = PROPS.sword; sw.visible = true; sw.position.copy(grip(noob, 'R')); sw.quaternion.copy(armQ(noob, 'R')); }
  if (lc && leo.root.visible) { const sc = PROPS.scroll; sc.visible = true; sc.position.copy(between(leo, 1.35)).add(V(0, 0.15, 0)); sc.rotation.set(-0.35, leo.root.rotation.y, 0, 'YXZ'); }
  for (const p of splash) p.visible = false;
  if (s >= T.dive + 0.45 && s < T.dive + 1.3) splash.forEach((p, j) => { const a = (s - T.dive - 0.45) / 0.85, ang = j / 6 * 6.283; p.visible = true; p.position.set(-11.5 + Math.cos(ang) * 1.6 * easeOut(a), 1.0 + 1.2 * Math.sin(a * Math.PI), POOL.z + 2.0 + Math.sin(ang) * 1.0 * easeOut(a)); p.scale.setScalar(0.5 + 0.5 * easeOut(a)); p.material.opacity = 0.9 * (1 - a); p.material.color.set('#dff3ff'); });

  // ---------- cameras ----------
  const pp = P.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, V(pp.x + 3.4, 3.6, PATH_Z + 10.5), V(pp.x - 0.4, 3.1, LINE_Z), 50, 14); break;
    case 'close': look(stage, V(pp.x + 1.6, 2.4, PATH_Z + 4.2), V(pp.x - 0.2, 2.9, PATH_Z - 1.0), 44, 10); break;
    case 'y1972': look(stage, V(POOL.x + 5.7, 4.4, POOL.z + 20.0), V(POOL.x + 5.7, 2.4, POOL.z + 4.6), 50, 16); break;
    case 'name': look(stage, V(POOL.x + 4.0, 3.8, POOL.z + 17.0), V(POOL.x + 4.0, 3.6, POOL.z + 5.0), 42, 10); break;   // headroom for NILS OLAV and the rank card
    case 'visits': look(stage, V(lerp(1.6, 0.8, u), 2.8, PATH_Z + lerp(8.0, 6.4, u)), V(0.4, 2.6, LINE_Z), 46, 12); break;
    case 'change': look(stage, V(0.4, 3.2, PATH_Z + 12.5), V(0.4, 2.4, PATH_Z), 52, 16); break;
    case 'knight': look(stage, V(0.4, 3.4, PATH_Z + 10.0), V(0.9, 2.8, PATH_Z - 0.4), 48, 12); break;
    case 'march': look(stage, V(13.5, 4.0, PATH_Z + 9.0), V(-2, 2.6, PATH_Z), 46, 22); break;
    case 'citation': look(stage, V(lerp(-0.2, -0.8, u), 3.4, PATH_Z + 7.6), V(-1.4, 3.0, PATH_Z - 0.5), 46, 12); break;
    case 'statue': look(stage, V(STATUE.x - 4.2, 3.0, STATUE.z + 9.5), V(STATUE.x - 0.8, 3.6, STATUE.z), 46, 12); break;
    case 'brigadier': look(stage, V(lerp(1.8, 1.2, u), 2.4, PATH_Z + 5.6), V(0.4, 2.6, PATH_Z - 0.6), 44, 10); break;
    case 'general': look(stage, V(0.4, 3.0, PATH_Z + lerp(9.5, 8.0, u)), V(0.4, 3.0, LINE_Z), 48, 14); break;
    case 'trained': look(stage, V(pp.x + 1.8, 2.8, PATH_Z + 6.4), V(pp.x - 1.2, 3.2, LINE_Z), 46, 12); break;
    case 'dive': look(stage, V(-6.0, 4.0, PATH_Z + 8.5), V(-11.0, 1.4, POOL.z + 2.5), 48, 14); break;
    case 'cta': look(stage, V(-0.4, 3.0, PATH_Z + 10.5), V(-0.4, 3.6, LINE_Z), 50, 14); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f', font = '"Luckiest Guy"') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px ${font}`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function tag(g, s, t, t0, text, sub) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate((60 - 30 * (1 - easeOut(a))) * s, 250 * s);
  g.font = `800 ${34 * s}px Montserrat`; const w = Math.max(g.measureText(text).width, sub ? g.measureText(sub).width : 0) / s + 56;
  roundRect(g, 0, 0, w * s, (sub ? 108 : 66) * s, 18 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 10 * s, (sub ? 108 : 66) * s);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, 30 * s, 34 * s);
  if (sub) { g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText(sub, 30 * s, 76 * s); }
  g.restore();
}
const pop = (t, t0, d = 0.22) => easeOutBack(clamp((t - t0) / d), 1.7);
// rank insignia: chevrons, a crown, stars, crossed sword and baton
function insignia(g, s, kind, k) {
  g.save(); g.scale(k, k); g.fillStyle = '#ffd23f'; g.strokeStyle = '#16182a'; g.lineWidth = 6 * s;
  const chev = (y) => { g.beginPath(); g.moveTo(-70 * s, y * s); g.lineTo(0, (y + 46) * s); g.lineTo(70 * s, y * s); g.lineTo(70 * s, (y + 24) * s); g.lineTo(0, (y + 70) * s); g.lineTo(-70 * s, (y + 24) * s); g.closePath(); g.fill(); g.stroke(); };
  const star = (x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -R90 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo((x + Math.cos(a) * rr) * s, (y + Math.sin(a) * rr) * s); } g.closePath(); g.fill(); g.stroke(); };
  const crown = (x, y) => { g.beginPath(); g.moveTo((x - 50) * s, (y + 30) * s); g.lineTo((x - 50) * s, (y - 20) * s); g.lineTo((x - 25) * s, y * s); g.lineTo(x * s, (y - 35) * s); g.lineTo((x + 25) * s, y * s); g.lineTo((x + 50) * s, (y - 20) * s); g.lineTo((x + 50) * s, (y + 30) * s); g.closePath(); g.fill(); g.stroke(); };
  if (kind <= 3) for (let i = 0; i < kind; i++) chev(-60 + i * 40);
  if (kind === 4) crown(0, 0);
  if (kind === 5) for (const [x0, y0, w, h] of [[-9, -88, 18, 128], [-46, 40, 92, 16], [-8, 56, 16, 32]]) { g.fillRect(x0 * s, y0 * s, w * s, h * s); g.strokeRect(x0 * s, y0 * s, w * s, h * s); }   // a sword
  if (kind === 6) { crown(0, -30); star(0, 50, 30); }
  if (kind === 7) { g.save(); for (const r of [-0.6, 0.6]) { g.save(); g.rotate(r); g.fillRect(-8 * s, -70 * s, 16 * s, 140 * s); g.strokeRect(-8 * s, -70 * s, 16 * s, 140 * s); g.restore(); } g.restore(); star(0, -95, 30); }
  g.restore();
}
const RANKS = () => [[W.lance - 0.1, 'LANCE CORPORAL', 1], [W.corporal2 - 0.1, 'CORPORAL', 2], [W.sergeant1 - 0.1, 'SERGEANT', 3], [W.regimental - 0.1, 'REGIMENTAL SERGEANT MAJOR', 4],
  [W.knight - 0.1, 'SIR NILS OLAV', 5], [W.brigadier - 0.1, 'BRIGADIER', 6], [W.general - 0.15, 'MAJOR GENERAL', 7]];
function rankCard(g, s, t) {
  const show = ['name', 'visits', 'knight', 'brigadier', 'general', 'close'].includes(SHOT); if (!show) return;
  let cur = SHOT === 'close' ? [0, 'MAJOR GENERAL', 7] : null; if (SHOT !== 'close') for (const r of RANKS()) if (t >= r[0]) cur = r;
  if (!cur || (SHOT === 'general' && cur[2] !== 7)) return;
  const k = SHOT === 'close' ? pop(t, W.outranks - 0.1) : pop(t, cur[0], 0.25);
  g.save(); g.translate(540 * s, 440 * s);
  roundRect(g, -400 * s, -150 * s, 800 * s, 300 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.save(); g.translate(-260 * s, 0); insignia(g, s, cur[2], k); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText('RANK', 110 * s, -80 * s);
  const fs = cur[1].length > 16 ? 50 : 70; g.font = `${fs * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff';
  if (cur[1].length > 16) { const [a, b] = cur[1] === 'REGIMENTAL SERGEANT MAJOR' ? ['REGIMENTAL', 'SERGEANT MAJOR'] : [cur[1], '']; g.fillText(a, 110 * s, -10 * s); g.fillText(b, 110 * s, 50 * s); }
  else g.fillText(cur[1], 110 * s, 10 * s);
  g.restore();
}
function years(g, s, t) {
  if (SHOT !== 'visits') return;
  const Y = [[W.corporal2 - 0.2, '1982'], [W.sergeant1 - 0.2, '1987'], [W.regimental - 0.2, '1993']];
  let cur = null, t0 = 0; for (const [a, y] of Y) if (t >= a) { cur = y; t0 = a; }
  if (cur) bigText(g, s, cur, 540, 1520, 120, '#ffd23f', pop(t, t0), -0.03);
}
export function overlay(g, s, t) {
  if (SHOT === 'hook' && t > W.salute1 - 0.2) bigText(g, s, 'SALUTE!', 540, 380, 120, '#ffffff', pop(t, W.salute1 - 0.2), -0.04);
  if (SHOT === 'y1972' || SHOT === 'name') {
    const a = clamp((t - T.y1972) / 0.15); g.save(); g.globalAlpha = 0.3 * a; g.fillStyle = '#a07a4a'; g.globalCompositeOperation = 'color'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    tag(g, s, t, T.y1972, '1972', 'a zoo in Scotland');
  }
  if (SHOT === 'name' && t > W.nils - 0.2 && t < W.lance - 0.1) bigText(g, s, 'NILS OLAV', 540, 440, 130, '#ffffff', pop(t, W.nils - 0.2), -0.04);
  rankCard(g, s, t); years(g, s, t);
  if (SHOT === 'change') {
    if (t < W.lookalike - 0.3) bigText(g, s, 'NILS OLAV I', 540, 420, 100, '#ffffff', pop(t, T.change + 0.1), -0.04);
    else bigText(g, s, 'NILS OLAV II', 540, 420, 100, '#ffd23f', pop(t, W.lookalike - 0.3), -0.04);
    if (t > W.rank - 0.2) bigText(g, s, 'SAME RANK', 540, 540, 70, '#ffffff', pop(t, W.rank - 0.2), -0.04);
  }
  if (SHOT === 'march' && t > W.hundred - 0.1) { const n = Math.round(130 * easeOut(clamp((t - W.hundred + 0.1) / 0.9))); bigText(g, s, `${n}`, 540, 380, 170, '#ffffff', pop(t, W.hundred - 0.1), -0.04); bigText(g, s, 'SOLDIERS', 540, 510, 84, '#ffd23f', pop(t, W.hundred), -0.04); }
  if (SHOT === 'citation' && t > W.qualified - 0.5) { bigText(g, s, '"IN EVERY WAY', 540, 400, 84, '#ffffff', pop(t, W.qualified - 0.5), -0.04); bigText(g, s, 'QUALIFIED"', 540, 500, 100, '#ffd23f', pop(t, W.qualified - 0.25), -0.04); }
  if (SHOT === 'statue' && t > W.statue - 0.2) bigText(g, s, 'HIS OWN STATUE', 540, 420, 96, '#ffd23f', pop(t, W.statue - 0.2), -0.04);
  if (SHOT === 'brigadier') tag(g, s, t, T.brigadier, '2016');
  if (SHOT === 'general') tag(g, s, t, T.general, '2023');
  if (SHOT === 'trained' && t > W.waddles - 0.15) bigText(g, s, '*waddle waddle*', 540, 420, 80, '#ffffff', pop(t, W.waddles - 0.15), -0.04);
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

export const cast = () => ({ max, mia, leo, skye, noob, folk0: folk[0] });
export const TIMES = T;
export const props = () => PROPS;
