// Mia Had Two Crowns (Part 5), web renderer + Roblox R6 pack. Beat times come from web/beats.js (source/beats.py: the
// narration's word timings via script alignment, or an estimate until the narration exists), so the clip retimes itself.
// Mia plays two accounts (herself and the noob) and only one can move at a time: the other freezes mid-pose. Leo and Max
// team up, spot it, attack both at once; she ALT+TABs faster and faster, freezes herself on the wrong window, typos
// "admin leo max" on the noob, and the boys' alliance lasts one second. Skye joins the game.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, fitAccessory } from '../../../web/lib/robloxPack.js';
import { cheerWave, panicArms, hop } from '../../../web/lib/gestures.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.55) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Mia Had Two Crowns' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- layout ----------
const MIA = V(-4.4, 0, 0.6), NOOB = V(-1.4, 0, -0.6);                 // Mia's two accounts, left
const LEO0 = V(2.8, 0, 0.8), MAX0 = V(6.4, 0, 0.0);                  // the team, right (3.7 apart: the fist bump meets in the middle)
const SPAWN = V(5.5, 0, -7.5), FLUNG = V(42, 30, -60);
const POKE = NOOB.clone().add(V(2.3, 0, 0.6));                        // Leo pokes the noob from here
const AT_NOOB = NOOB.clone().add(V(2.5, 0, -0.3)), AT_MIA = MIA.clone().add(V(2.5, 0, -0.3));   // from the side, so the camera sees both faces
const LC = V(2.0, 0, 2.0), MC = V(7.0, 0, 1.8);                      // where the boys regroup for the ending (apart, facing each other)
const CAM = V(0, 0, 14);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

// Derived beats.
const B = {
  flingType: [W.fling - 0.95, W.fling - 0.05], flung: [W.fling + 0.15, W.fling + 1.8], respawn: W.plank + 0.3,
  pokeWalk: [W.noticed + 0.5, W.poked - 0.2], plank: [W.poked + 0.05, W.poked + 0.55], getUp: [W.onlyPlay, W.onlyPlay + 0.45],
  charge: [W.attacked - 0.1, W.maxFor + 0.3], ice: [W.herself, W.herself + 0.35], regroup: [W.herself + 0.6, W.ten + 0.2],
  typoType: [W.meant - 0.2, W.typo + 0.6], crownsOn: W.newCrowns, kickType: [W.kickMax - 0.1, W.enter - 0.05], kicked: W.kicked,
  roundOver: W.roundOver, skye: W.joined - 0.1, cta: W.follow,
};
// Which of Mia's accounts is live. Before the fling both just stand there; after it, only one at a time.
const SEG = (() => {
  const s = [[0, 'both'], [B.flingType[0], 'mia'], [W.onlyPlay, 'noob'], [W.sw1, 'mia'], [W.sw2, 'noob'], [W.sw3, 'mia']];
  let t = W.faster - 0.15, k = 0, gap = 0.42;                          // "faster and faster"
  while (t < W.freeze - 0.75) { s.push([t, k++ % 2 ? 'mia' : 'noob']); t += gap; gap = Math.max(0.11, gap * 0.8); }
  s.push([W.freeze - 0.75, 'mia'], [W.herself + 0.05, 'noob']);       // types :freeze on her own window; then the noob is all she has
  return s;
})();
const live = (s) => { let a = 'both'; for (const [t, who] of SEG) if (s >= t) a = who; return a; };
const switches = (s) => SEG.filter(([t, w], i) => i >= 3 && t <= s && t >= W.sw1 - 0.01 && w !== 'both').length;
// Effective time of an account: the live one follows the clock, the idle one is frozen at the moment it lost focus.
function eff(who, s) {
  if (live(s) === 'both' || live(s) === who) return s;
  let start = 0; for (const [t] of SEG) { if (t > s) break; start = t; }      // it lost focus when the current segment began
  return start;
}
// The round clock: 1:00 -> 0:10 on "ten seconds left" -> 0:00 at "round over".
const clock = track([[0, 60, (u) => u], [W.ten, 10, (u) => u], [W.roundOver, 0, (u) => u]]);

const SHOTS = [
  [0, 'hook'], [W.teamed - 0.5, 'team'], [W.fling - 1.0, 'miaType'], [W.flying - 0.35, 'fling'], [W.noticed - 0.3, 'notice'],
  [W.froze - 0.4, 'frozen'], [W.poked - 0.9, 'poke'], [W.onlyPlay - 0.3, 'rule'], [W.attacked - 0.2, 'charge'],
  [W.sw1 - 0.1, 'swMia'], [W.sw2 - 0.1, 'swNoob'], [W.sw3 - 0.1, 'swMia'], [W.faster - 0.2, 'frenzy'], [W.freeze - 0.4, 'miaFreeze'],
  [W.herself - 0.2, 'ice'], [W.ten - 0.3, 'ten'], [W.meant - 0.3, 'noobType'], [W.newCrowns - 0.4, 'crowns'],
  [W.lasted - 0.2, 'faceOff'], [W.kickMax - 0.25, 'kickType'], [W.kicked - 0.2, 'kicked'], [W.roundOver - 0.2, 'wins'],
  [W.chat - 0.3, 'skye'], [W.follow - 0.1, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD', Mia: '#C9A6FF', noob: '#F5CD30', Skye: '#FF8AC8' };
const typed = (name, text, from, to, at = to + 0.06) => ({ name, text, typed: [from, to], at });
const CHAT = [
  { name: 'Server', text: 'Mia won ADMIN for 1 round!', at: -1 },
  { name: 'Server', text: '...and so did noob.', at: -1 },
  { name: 'Server', text: '1 round = 60 seconds.', at: 0.7 },
  typed('Mia', ':fling max', ...B.flingType),
  typed('Mia', ':freeze', W.freeze - 0.6, W.justFreeze + 0.25),
  typed('noob', ':admin leo max', ...B.typoType),
  { name: 'Server', text: 'leo and max are now admins.', at: W.newCrowns },
  { name: 'Leo', text: ':kick max', at: W.enter }, { name: 'Max', text: ':kick leo', at: W.enter },
  { name: 'Server', text: 'Leo and Max have left the game.', at: W.kicked + 0.1 },
  { name: 'Server', text: 'Round over!', at: W.roundOver },
  { name: 'Server', text: 'Skye has joined the game.', at: W.joined },
];

// ---------- scene ----------
let A = {}, leo, max, mia, noob, skye, cam, ff, ice, SHOT = 'hook', clockT = 0;
const crowns = {}, puffs = [], sparkles = [];

export async function setup(stage) {
  const { scene } = stage; const r = rng(97);
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'suspicious', 'confused', 'knocked_out', 'blink'];
  [leo, max, mia, noob, skye] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob', 'Skye'].map((n) => loadRobloxCharacter(n, { expressions: n === 'Skye' ? ['happy', 'surprised', 'smug', 'neutral'] : expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root, skye.root);
  for (const n of ['idle', 'typing', 'walk', 'run', 'shock', 'fall', 'dance2', 'point_forward', 'proud', 'scheming', 'laugh_big', 'facepalm'])
    A[n] = await loadAnimation(n);

  const lobby = await packItem('map', 'lobby_platform'); lobby.position.y = -2.2; scene.add(lobby);
  const spawn = await packItem('map', 'spawn_location'); spawn.scale.set(0.5, 0.3, 0.5); spawn.position.copy(SPAWN); scene.add(spawn);
  for (const [x, z, sc] of [[-17, 7, 1], [16, -14, 0.9], [19, 8, 1.1], [-15, -15, 1]]) { const t = await packItem('map', 'tree_round'); t.position.set(x, 0, z); t.scale.setScalar(sc); scene.add(t); }
  for (let i = 0; i < 6; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 80 + r() * 60; isl.position.set(Math.cos(a) * d, -10 + r() * 25, Math.sin(a) * d); isl.scale.setScalar(0.8 + r()); scene.add(isl); }
  for (let i = 0; i < 40; i++) { const c = cloud(600 + i, 7 + r() * 9); const a = r() * Math.PI * 2, d = 90 + r() * 160; c.position.set(Math.cos(a) * d, -40 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 22; i++) { const c = cloud(800 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 70 + r() * 90; c.position.set(Math.cos(a) * d, 14 + r() * 40, Math.sin(a) * d); scene.add(c); }

  // Crowns (fitted, checked by web/fit_check.mjs): Mia's and the noob's from the start, Leo's and Max's from the typo.
  for (const a of [mia, noob, leo, max]) { const fit = await fitAccessory(a, 'crown_admin'); crowns[a.name] = fit; scene.add(fit.item); }
  // Ice block for Mia.
  ice = new THREE.Group();
  const iceMat = new THREE.MeshPhysicalMaterial({ color: '#bfeaff', roughness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1, emissive: '#7fd4ff', emissiveIntensity: 0.15, depthWrite: false });
  const blk = new THREE.Mesh(new THREE.BoxGeometry(4.6, 6.6, 2.6), iceMat); blk.position.y = 3.3; blk.renderOrder = 3; ice.add(blk);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(blk.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); edges.position.y = 3.3; ice.add(edges);
  scene.add(ice);
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 18; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, scale: 1, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const arc = (a, b, h, u) => a.clone().lerp(b, u).add(V(0, h * 4 * u * (1 - u), 0));
const switching = (s) => s >= W.sw1 - 0.05 && s < W.herself;
const toCam = (p) => face(p, CAM);

// Mia and the noob, as played (state at their effective time).
function miaRaw(s) {
  const b = st(MIA, face(MIA, V(6, 0, 6)), idle(s, 0.6), 'smug');
  if (s > B.flingType[0] && s < B.flingType[1] + 0.1) { b.layers = [[A.typing, s * 1.2]]; b.face = 'evil_grin'; }
  else if (s > B.flingType[1] && s < W.attacked) { b.layers = [[A.laugh_big, s]]; b.face = 'laugh'; }
  if (s >= W.attacked) { b.layers = [[A.typing, s * 2.4]]; b.face = s > W.faster ? 'scared' : 'determined'; b.rotY = toCam(MIA); }
  if (s > W.freeze - 0.75) { b.layers = [[A.typing, s * 2.4]]; b.face = s > W.herself ? 'shocked' : 'determined'; b.rotY = toCam(MIA); }
  return b;
}
function noobRaw(s) {
  // A slow walk on the spot at the start, so freezing mid-step reads.
  const b = st(NOOB, face(NOOB, V(6, 0, 7)), [[A.walk, s * 0.6]], 'happy');
  if (s >= W.onlyPlay) { b.layers = [[A.typing, s * 2.4]]; b.face = 'determined'; b.rotY = toCam(NOOB); }
  if (s >= W.herself) { b.rotY = toCam(NOOB); b.face = s > W.typo ? 'surprised' : 'scared'; b.layers = [[A.typing, s * 2.6]]; }
  if (s >= B.typoType[1] + 0.2) { b.layers = idle(s); b.face = s > W.newCrowns + 0.3 ? 'shocked' : 'surprised'; }
  if (s >= B.kicked + 0.4) { b.layers = [[A.dance2, s - B.kicked, 1, true]]; b.face = 'happy'; }
  if (s >= B.skye) { b.layers = idle(s); b.face = 'surprised'; b.rotY = face(NOOB, SPAWN); }
  return b;
}
function miaState(s) {
  return miaRaw(s > W.herself ? Math.min(eff('mia', s), W.herself + 0.05) : eff('mia', s));   // in the ice she stays put
}
function noobState(s) {
  const b = noobRaw(eff('noob', s));
  // Poked: a stiff plank fall while frozen; back up when she switches to him.
  if (s > B.plank[0] && s < B.getUp[1]) { b.plank = s < B.getUp[0] ? easeIn(inv(...B.plank, s)) : 1 - easeOut(inv(...B.getUp, s)); b.grounded = false; }
  return b;
}

function leoState(s) {
  const b = st(LEO0, face(LEO0, MAX0), idle(s, 0.3), 'determined');
  if (s < W.teamed - 0.6) { b.rotY = toCam(LEO0); b.face = 'annoyed'; }
  else if (s < W.fling) { b.layers = [[A.point_forward, 0.6]]; b.face = 'evil_grin'; }                       // fist bump
  else if (s < W.noticed) { b.rotY = face(LEO0, V(20, 6, -30)); b.layers = [[A.shock, s - W.fling]]; b.face = 'shocked'; }
  else if (s < W.attacked) {
    const u = easeInOut(inv(...B.pokeWalk, s)); b.pos = LEO0.clone().lerp(POKE, u);
    b.rotY = face(b.pos, NOOB); b.face = 'suspicious';
    b.layers = s > B.pokeWalk[0] && s < B.pokeWalk[1] ? [[A.walk, s]] : s > W.poked - 0.25 && s < W.poked + 0.6 ? [[A.point_forward, s - W.poked + 0.25]] : idle(s);
    if (s > W.onlyPlay) b.face = 'evil_grin';
  } else if (s < W.herself + 0.6) {
    b.pos = POKE.clone().lerp(AT_NOOB, easeInOut(inv(...B.charge, s))); b.rotY = face(b.pos, NOOB); b.face = 'angry';
    b.layers = s < B.charge[1] ? [[A.run, s * 1.4]] : [[A.point_forward, (s * 3.2) % 0.6]];                // jabs
    if (switching(s) && live(s) === 'noob') { b.layers = [[A.shock, 0.25]]; b.face = 'shocked'; b.pos.add(V(0.5, 0, 0.2)); }  // pushed back
  } else {
    const u = easeInOut(inv(...B.regroup, s)); b.pos = AT_NOOB.clone().lerp(LC, u); b.rotY = s < B.regroup[1] ? face(AT_NOOB, LC) : face(LC, NOOB);
    b.layers = s < B.regroup[1] ? [[A.walk, s]] : idle(s); b.face = 'evil_grin';
    if (s > W.newCrowns - 0.2) { b.lookUp = s < W.newCrowns + 0.6 ? 0.45 : 0; b.face = 'happy'; if (s > W.newCrowns + 0.6) { b.gesture = 'cheer'; b.face = 'laugh'; } }
    if (s > W.lasted - 0.1) { b.gesture = null; b.rotY = face(LC, MC); b.face = 'scheming'; b.layers = idle(s); }
    if (s > B.kickType[0]) { b.layers = [[A.typing, s * 2]]; b.face = 'evil_grin'; }
    if (s > W.enter) b.face = 'shocked';
    b.visible = s < B.kicked;
  }
  return b;
}

function maxState(s) {
  const b = st(MAX0, face(MAX0, LEO0), idle(s, 0.6), 'determined');
  if (s < W.teamed - 0.6) { b.rotY = toCam(MAX0); b.face = 'smug'; }
  else if (s < B.flung[0]) { b.layers = [[A.point_forward, 0.6]]; b.face = 'evil_grin'; if (s > W.fling - 0.4) { b.face = 'shocked'; b.layers = [[A.shock, s - W.fling + 0.4]]; } }
  else if (s < B.flung[1]) { const u = inv(...B.flung, s); b.grounded = false; b.pos = arc(MAX0, FLUNG, 10, easeIn(u)); b.layers = [[A.fall, 0.2]]; b.gesture = 'panic'; b.face = 'scared'; b.rotX = u * 7; b.rotZ = u * 2.5; }
  else if (s < B.respawn) b.visible = false;
  else if (s < W.attacked) {
    const u = easeInOut(inv(B.respawn + 0.8, W.attacked - 0.3, s)); b.pos = SPAWN.clone().lerp(MAX0, u);
    b.rotY = u > 0 && u < 1 ? face(SPAWN, MAX0) : face(MAX0, MIA); b.layers = u > 0 && u < 1 ? [[A.walk, s]] : idle(s); b.face = 'angry';
  } else if (s < W.herself + 0.6) {
    b.pos = MAX0.clone().lerp(AT_MIA, easeInOut(inv(...B.charge, s))); b.rotY = face(b.pos, MIA); b.face = 'angry';
    b.layers = s < B.charge[1] ? [[A.run, s * 1.4 + 0.3]] : [[A.point_forward, (s * 3.2 + 0.3) % 0.6]];
    if (switching(s) && live(s) === 'mia') { b.layers = [[A.shock, 0.25]]; b.face = 'shocked'; b.pos.add(V(0.5, 0, 0.2)); }
    if (s > W.herself) { b.layers = [[A.shock, s - W.herself]]; b.face = 'dizzy'; b.pos.add(V(0.9 * easeOut(inv(W.herself, W.herself + 0.3, s)), 0, 0)); }  // bounces off the ice
  } else {
    const from = AT_MIA.clone().add(V(0.9, 0, 0)), u = easeInOut(inv(...B.regroup, s)); b.pos = from.clone().lerp(MC, u);
    b.rotY = s < B.regroup[1] ? face(from, MC) : face(MC, NOOB); b.layers = s < B.regroup[1] ? [[A.walk, s]] : idle(s); b.face = 'evil_grin';
    if (s > W.newCrowns - 0.2) { b.lookUp = s < W.newCrowns + 0.6 ? 0.45 : 0; b.face = 'happy'; if (s > W.newCrowns + 0.6) { b.gesture = 'cheer'; b.face = 'laugh'; } }
    if (s > W.lasted - 0.1) { b.gesture = null; b.rotY = face(MC, LC); b.face = 'scheming'; b.layers = idle(s); }
    if (s > B.kickType[0]) { b.layers = [[A.typing, s * 2 + 0.2]]; b.face = 'evil_grin'; }
    if (s > W.enter) b.face = 'shocked';
    b.visible = s < B.kicked;
  }
  return b;
}

function skyeState(s) {
  const b = st(SPAWN, toCam(SPAWN), idle(s), 'surprised');
  b.visible = s > B.skye;
  if (s > B.skye + 1.2) { b.face = 'smug'; b.rotY = face(SPAWN, NOOB) * 0.5 + toCam(SPAWN) * 0.5; }
  return b;
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6 * x.scale, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  if (x.plank) a.root.rotateX(-Math.PI / 2 * x.plank);
  a.root.scale.setScalar(x.scale);
  robloxPose(a, x.layers);
  if (x.gesture === 'cheer') cheerWave(a, clockT + x.pos.x * 0.3);
  if (x.gesture === 'panic') panicArms(a, clockT + x.pos.x * 0.37);
  if (x.lookUp) a.bones.Head.rotateX(-x.lookUp);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  if (x.gesture === 'cheer') a.root.position.y += hop(clockT) * x.scale;
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 28); }
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
function frame(stage, tg, az, el, w, fov = 40) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);

export function samples(t) { return t > B.flung[0] && t < B.flung[0] + 0.9 ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

export function update(t, stage) {
  const s = t; clockT = t;
  const states = { Mia: miaState(s), Noob: noobState(s), Leo: leoState(s), Max: maxState(s) };
  place(mia, states.Mia); place(noob, states.Noob); place(leo, states.Leo); place(max, states.Max); place(skye, skyeState(s));
  cam = stage.camera;

  // Crowns: Mia's and the noob's from the start; Leo's and Max's drop on at "two new crowns" and go with them when kicked.
  for (const a of [mia, noob, leo, max]) {
    const fit = crowns[a.name], c = fit.item, on = a === leo || a === max ? B.crownsOn - 0.5 : -1;
    c.visible = a.root.visible && s >= on;
    if (!c.visible) continue;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(fit.scale * a.root.scale.x);
    c.position.copy(a.bones.Head.localToWorld(fit.offset.clone()));
    if (on > 0) c.position.y += 5 * (1 - easeOutBack(inv(on, on + 0.5, s), 1.2));
  }
  ice.visible = s > B.ice[0]; ice.position.copy(MIA); ice.rotation.y = mia.root.rotation.y; ice.scale.setScalar(easeOutBack(inv(...B.ice, s), 1.6) || 0.001);

  // ForceFields: Max's respawn, Skye joining.
  ff.visible = false;
  for (const [at, pos] of [[B.respawn, SPAWN], [B.skye, SPAWN]]) {
    const fa = s - at; if (fa < 0 || fa > 2) continue;
    ff.visible = true; ff.position.copy(pos).add(V(0, 2.9, 0)); ff.scale.setScalar(3.6 * easeOutBack(clamp(fa / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(1.5, 2, fa); ff.material.uniforms.time.value = t;
  }
  // Puffs: the plank landing, ice forming, both boys kicked.
  const events = [[B.plank[1], NOOB.clone().add(V(0, 0.3, -2.4)), 1.4, 0.8], [B.ice[0], MIA.clone().add(V(0, 2, 0)), 2.2, 0.8], [B.kicked, LC.clone().add(V(0, 2.5, 0)), 1.6, 0.8], [B.kicked, MC.clone().add(V(0, 2.5, 0)), 1.6, 0.8]];
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur] = ev, u = (s - at) / dur, a = i * 0.7;
    p.position.set(c.x + Math.cos(a) * size * 1.4 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.4 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  // Sparkles: the new crowns, Skye arriving.
  const sparkAt = [[B.crownsOn, LC.clone().add(V(0, 6, 0))], [B.crownsOn, MC.clone().add(V(0, 6, 0))], [B.skye, SPAWN.clone().add(V(0, 5.5, 0))]];
  const sps = sparkAt.filter((e) => s >= e[0] && s < e[0] + 1);
  sparkles.forEach((m, i) => {
    const sp = sps[i % Math.max(1, sps.length)]; m.visible = !!sp; if (!sp) return;
    const u = s - sp[0], a = i * 2.39996;
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (0.6 + 2 * u), (i % 6) * 0.3 + u * 1.2, Math.sin(a + u * 3) * (0.6 + 2 * u)));
    m.scale.setScalar(1.1 * (1 - u)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const ih = head(mia), nh = head(noob), lh = head(leo), xh = head(max);
  const pair = MIA.clone().lerp(NOOB, 0.5);
  stage.bloom.strength = 0.3;
  switch (shot.id) {
    case 'hook': frame(stage, V(0.9, 3.4, 0.3), 0.06, 0.08, lerp(15, 13.5, easeOut(u)), 40); break;      // all four: two crowns vs the team
    case 'team': frame(stage, LEO0.clone().lerp(MAX0, 0.5).add(V(0, 3.4, 0)), -0.15, 0.08, 7.5, 40); break;
    case 'miaType': frame(stage, pair.clone().add(V(0, 3.6, 0.2)), 0.25, 0.08, 8, 40); break;
    case 'fling': { const p = max.root.visible ? max.bones.Torso.localToWorld(V(0, 1, 0)) : FLUNG.clone(); const k = easeOut(inv(B.flung[0], B.flung[0] + 1.2, s)); look(stage, V(lerp(2, -4, k), lerp(4, 8, k), lerp(16, 12, k)), MAX0.clone().add(V(0, 3.5, 0)).lerp(p, 0.55 * k), 50); break; }
    case 'notice': frame(stage, lh.clone().add(V(0, -0.2, 0)), toCam(LEO0) - 0.5, 0.06, 5.5, 36); break;
    case 'frozen': frame(stage, pair.clone().add(V(0, 3.6, 0)), 0.2, 0.08, 8.5, 40); break;
    case 'poke': frame(stage, NOOB.clone().lerp(POKE, 0.4).add(V(-0.4, 2.4, -0.6)).add(s > B.plank[1] && s < B.plank[1] + 0.3 ? jolt(t, 0.18 * (1 - (s - B.plank[1]) / 0.3)) : V(0, 0, 0)), 0.1, 0.12, 9, 40); break;
    case 'rule': frame(stage, pair.clone().add(V(0, 3.6, 0)), 0.15, 0.1, 9.5, 40); break;
    case 'charge': frame(stage, V(0.4, 3.4, 0.2), 0.05, 0.12, 14, 40); break;
    case 'swMia': case 'swNoob': frame(stage, pair.clone().add(V(0.9, 3.3, 0)), 0.05, 0.07, lerp(11, 10, u), 40); break;   // two-shot: one plays, one freezes
    case 'frenzy': { const last = SEG.filter(([tt]) => tt <= s).pop()[0], j = s - last < 0.08 ? jolt(t, 0.08) : V(0, 0, 0); frame(stage, pair.clone().add(V(0.9, 3.3, 0)).add(j), 0.05, 0.07, 9.5, 40); break; }   // a jolt on every switch
    case 'miaFreeze': frame(stage, ih.clone().add(V(0.8, -0.6, 0)), 0.1, 0.06, 6.5, 38); break;
    case 'ice': frame(stage, MIA.clone().add(V(1.0, 3.3, 0.3)).add(s > B.ice[0] && s < B.ice[0] + 0.3 ? jolt(t, 0.15 * (1 - (s - B.ice[0]) / 0.3)) : V(0, 0, 0)), 0.3, 0.1, 10, 40); break;
    case 'ten': frame(stage, V(0, 3.4, 0.6), 0.05, 0.1, 14, 40); break;
    case 'noobType': frame(stage, nh.clone().add(V(-0.2, -0.2, 0)), toCam(NOOB) - 0.15, 0.06, 5.5, 36); break;
    case 'crowns': frame(stage, LC.clone().lerp(MC, 0.5).add(V(0, 4.3, 0)), 0.05, 0.08, 11.5, 40); break;
    case 'faceOff': frame(stage, LC.clone().lerp(MC, 0.5).add(V(0, 3.6, 0)), 0.0, 0.06, 10.5, 38); break;
    case 'kickType': frame(stage, LC.clone().lerp(MC, 0.5).add(V(0, 3.4, 0)), 0.0, 0.06, 11, 38); break;
    case 'kicked': frame(stage, LC.clone().lerp(MC, 0.5).add(V(0, 3.4, 0)).add(s > B.kicked && s < B.kicked + 0.3 ? jolt(t, 0.2 * (1 - (s - B.kicked) / 0.3)) : V(0, 0, 0)), 0.0, 0.08, 12, 40); break;
    case 'wins': frame(stage, pair.clone().add(V(0.3, 3.6, 0.2)), 0.15, 0.08, lerp(9.5, 8.5, u), 40); break;
    case 'skye': frame(stage, SPAWN.clone().add(V(0, 3.5, 0)), 0.15, 0.08, lerp(9, 7, easeInOut(u)), 38); break;
    default: frame(stage, SPAWN.clone().add(V(0, 5.0, 0)), 0.15, 0.06, 7, 36);           // CTA: Skye's face just under the end card
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
function hud(g, s, t) {
  let label, col = 'rgba(112,64,190,.92)', edge = '#FFC83D', ink = '#ffffff', crowns = 2;
  const v = Math.max(0, Math.ceil(clock(t))), mm = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  if (t < W.newCrowns) { label = `MIA ADMIN x2 ${mm}`; if (t > W.ten) col = Math.floor(t * 4) % 2 ? 'rgba(220,40,60,.92)' : col; }
  else if (t < W.roundOver) { label = `4 ADMINS ${mm}`; crowns = 4; col = 'rgba(214,92,24,.92)'; }
  else if (t < B.skye) { label = 'ROUND OVER'; col = 'rgba(70,70,80,.9)'; edge = '#9a9aa5'; ink = '#d0d0d8'; crowns = 0; }
  else { label = 'NEW PLAYER'; col = 'rgba(232,80,160,.92)'; crowns = 0; }
  g.save(); g.font = `${50 * s}px "Luckiest Guy"`;
  const pad = crowns ? 104 + (crowns - 1) * 40 : 34, w = g.measureText(label).width + (pad + 36) * s, x = 60 * s, y = 250 * s;
  roundRect(g, x, y, w, 90 * s, 26 * s); g.fillStyle = col; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = edge; g.stroke();
  for (let i = 0; i < crowns; i++) drawCrown(g, x + (58 + 40 * i) * s, y + 46 * s, 30 * s);
  g.fillStyle = ink; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(label, x + pad * s, y + 50 * s);
  g.restore();
  const px = (w / s + 80); g.save(); g.font = `${42 * s}px "Luckiest Guy"`; const tw = g.measureText('PART 5').width + 40 * s;
  if (px * s + tw < 1060 * s) { roundRect(g, px * s, 260 * s, tw, 70 * s, 20 * s); g.fillStyle = '#FFD23F'; g.fill(); g.fillStyle = '#152435'; g.textBaseline = 'middle'; g.fillText('PART 5', px * s + 20 * s, 297 * s); }
  g.restore();
}
function chatBox(g, s, t, { x = 60, y = 370, w = 820, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => t >= l.at).slice(-rows);
  const ty = CHAT.find((l) => l.typed && t >= l.typed[0] - 0.1 && t < l.typed[1] + 0.1);
  const n = shown.length + (ty ? 1 : 0); if (!n) return;
  g.save();
  const lh = 50 * s, pad = 20 * s, h = pad * 2 + n * lh + 8 * s;
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${31 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2;
  for (const l of shown) {
    g.globalAlpha = clamp((t - l.at) / 0.12);
    const tag = `[${l.name}]: `; g.fillStyle = l.name === 'Server' ? SERVER : C[l.name]; g.fillText(tag, x * s + pad, yy);
    g.fillStyle = l.name === 'Server' ? '#FFE9A8' : '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy); yy += lh;
  }
  g.globalAlpha = 1;
  if (ty) {
    const txt = ty.text.slice(0, Math.floor(clamp((t - ty.typed[0]) / (ty.typed[1] - ty.typed[0])) * ty.text.length));
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
    g.fillStyle = C[ty.name]; g.fillText(`${ty.name}:`, x * s + pad * 1.2, yy + 4 * s); const ox = g.measureText(`${ty.name}: `).width;
    g.fillStyle = '#ffffff'; g.fillText(txt, x * s + pad * 1.2 + ox, yy + 4 * s);
  }
  g.restore();
}
function inputBox(g, s, text, { x = 110, y = 1330, w = 860, size = 72, label = 'noob', color = '#F5CD30', t = 0, cursor = true } = {}) {
  g.save(); g.font = `800 ${size * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const h = size * 1.25 + 50;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = color; g.stroke();
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = color; g.fillText(label, (x + 30) * s, (y - 22) * s);
  g.font = `800 ${size * s}px Montserrat`; g.fillStyle = '#ffffff'; const ly = (y + h / 2) * s; g.fillText(text, (x + 36) * s, ly);
  const end = (x + 36) * s + g.measureText(text).width;
  if (cursor && Math.floor(t * 5) % 2 === 0) g.fillRect(end + 8 * s, ly - size * 0.5 * s, 7 * s, size * s);
  g.restore();
  return { x0: (x + 36) * s, ly, measure: (str) => { g.save(); g.font = `800 ${size * s}px Montserrat`; const m = g.measureText(str).width; g.restore(); return m; } };
}
function tagOver(g, s, a, text, bg, fg, alpha = 1) {
  const p = project(head(a).add(V(0, 1.6, 0)), s); if (!p.on) return;
  g.save(); g.globalAlpha = alpha; g.font = `${36 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 32 * s;
  roundRect(g, p.x - w / 2, p.y - 28 * s, w, 56 * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, p.x, p.y + 3 * s); g.restore();
}

export function overlay(g, s, t) {
  hud(g, s, t);
  if (t < B.cta) chatBox(g, s, t);
  // Opening: one round is one minute.
  if (t > 0.55 && t < W.teamed - 0.6) {
    const k = easeOutBack(clamp((t - 0.55) / 0.25), 2.2), al = 1 - inv(W.teamed - 0.85, W.teamed - 0.6, t);
    g.save(); g.globalAlpha = al; g.translate(540 * s, 1440 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -390 * s, -70 * s, 780 * s, 140 * s, 40 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#152435'; g.stroke();
    g.font = `${74 * s}px "Luckiest Guy"`; g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1 ROUND = 1 MINUTE', 0, 6 * s);
    g.restore();
  }
  // PLAYING / FROZEN tags over Mia's two accounts once the rule is in play.
  if (t > W.froze - 0.2 && t < W.newCrowns) {
    const al = clamp((t - W.froze + 0.2) / 0.2), lv = live(t), iced = t > W.herself;
    tagOver(g, s, mia, iced ? 'FROZEN' : lv === 'mia' ? 'PLAYING' : 'FROZEN', iced || lv !== 'mia' ? 'rgba(70,90,120,.9)' : 'rgba(40,170,80,.92)', '#ffffff', al);
    tagOver(g, s, noob, lv === 'noob' ? 'PLAYING' : 'FROZEN', lv === 'noob' ? 'rgba(40,170,80,.92)' : 'rgba(70,90,120,.9)', '#ffffff', al);
  }
  if (t > W.teamed && t < W.teamed + 1.0) bigText(g, s, 'TEAM UP!', 540, 780, 150, '#FFD23F', { k: easeOutBack(clamp((t - W.teamed) / 0.15), 3), alpha: 1 - inv(0.8, 1.0, t - W.teamed), rot: -0.06 });
  if (SHOT === 'notice') { const p = project(head(leo).add(V(0, 1.3, 0)), s); if (p.on) bigText(g, s, '?', p.x / s + 90, p.y / s, 110, '#ffffff', { k: 1 + 0.08 * Math.sin(t * 9) }); }
  // Payoff words.
  for (const [at, word, col, size] of [[B.flung[0] + 0.1, 'FLUNG!', '#7FE3DD', 150], [B.plank[1], 'THUD', '#ffffff', 150], [W.wrong, 'WRONG WINDOW', '#ff4d5e', 110], [W.herself, 'FROZEN!', '#9fe3ff', 150], [W.kicked, 'BOTH KICKED', '#ff4d5e', 120]]) {
    const a = t - at; if (a < 0 || a > 0.95) continue;
    bigText(g, s, word, 540, 780, size, col, { k: easeOutBack(clamp(a / 0.15), 3), alpha: 1 - inv(0.75, 0.95, a), rot: -0.07 });
  }
  if (t > W.onlyPlay && t < W.attacked - 0.1) bigText(g, s, '1 ACCOUNT AT A TIME', 540, 770, 84, '#ffffff', { k: easeOutBack(clamp((t - W.onlyPlay) / 0.2), 2.4) });
  // ALT+TAB counter.
  if (switching(t) && t < W.freeze - 0.2) {
    const n = switches(t), last = SEG.filter(([tt]) => tt <= t).pop()[0], a = t - last;
    g.save(); g.translate(540 * s, 780 * s); g.rotate(-0.05); g.scale(1 + 0.25 * (1 - clamp(a / 0.15)), 1 + 0.25 * (1 - clamp(a / 0.15)));
    g.font = `${70 * s}px "Luckiest Guy"`; const kw = (txt) => g.measureText(txt).width + 40 * s;
    const keys = ['ALT', '+', 'TAB'], ws = keys.map((k) => (k === '+' ? 40 * s : kw(k))), tot = ws.reduce((x, y) => x + y, 0) + 20 * s;
    let xx = -tot / 2;
    keys.forEach((k, i) => {
      if (k !== '+') { roundRect(g, xx, -50 * s, ws[i], 100 * s, 18 * s); g.fillStyle = '#f2f4f8'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#152435'; g.stroke(); }
      g.fillStyle = k === '+' ? '#ffffff' : '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, xx + ws[i] / 2, 6 * s); xx += ws[i] + 10 * s;
    });
    g.restore();
    bigText(g, s, `x${n}`, 540, 900, 110, '#FFD23F', { k: 1 + 0.2 * (1 - clamp(a / 0.15)) });
  }
  // The :freeze on the wrong window, in Mia's own input box.
  if (t > W.freeze - 0.6 && t < W.herself + 0.4) inputBox(g, s, ':freeze'.slice(0, Math.ceil(clamp((t - W.freeze + 0.6) / 0.5) * 7)), { label: 'Mia', color: '#C9A6FF', t, cursor: t < W.justFreeze + 0.25 });
  if (t > W.ten && t < W.ten + 1.2) bigText(g, s, '0:10', 540, 780, 190, '#ff4d5e', { k: easeOutBack(clamp((t - W.ten) / 0.2), 2.4) });
  // The typo: ":admin leo max" with the missing "un" marked.
  if (t > B.typoType[0] && t < W.newCrowns + 0.3) {
    const full = ':admin leo max', txt = full.slice(0, Math.ceil(clamp((t - B.typoType[0]) / (B.typoType[1] - B.typoType[0])) * full.length));
    const box = inputBox(g, s, txt, { t, cursor: t < B.typoType[1] });
    if (t > W.typo) {
      const x = box.x0 + box.measure(':'), k = easeOutBack(clamp((t - W.typo) / 0.2), 2.4);
      g.save(); g.translate(x, box.ly - 110 * s); g.scale(k, k); g.font = `${64 * s}px "Luckiest Guy"`; g.fillStyle = '#ff2b3d'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('UN?', 0, 0); g.beginPath(); g.moveTo(0, 30 * s); g.lineTo(-16 * s, 62 * s); g.lineTo(16 * s, 62 * s); g.closePath(); g.fill(); g.restore();
      bigText(g, s, 'FORGOT THE "UN"', 540, 780, 96, '#ff4d5e', { k });
    }
  }
  if (t > W.newCrowns && t < W.lasted - 0.2) bigText(g, s, '+2 ADMINS', 540, 780, 130, '#FFD23F', { k: easeOutBack(clamp((t - W.newCrowns) / 0.2), 2.4) });
  if (t > W.lasted && t < B.kickType[0]) bigText(g, s, 'TEAM-UP: 1 SECOND', 540, 780, 88, '#ffffff', { k: easeOutBack(clamp((t - W.lasted) / 0.2), 2.4) });
  // Two input boxes, side by side, typed at once.
  if (t > B.kickType[0] && t < W.kicked) {
    const u = clamp((t - B.kickType[0]) / (B.kickType[1] - B.kickType[0]));
    inputBox(g, s, ':kick max'.slice(0, Math.ceil(u * 9)), { x: 40, w: 490, size: 54, label: 'Leo', color: '#FF9E80', t, cursor: t < W.enter });
    inputBox(g, s, ':kick leo'.slice(0, Math.ceil(u * 9)), { x: 550, w: 490, size: 54, label: 'Max', color: '#7FE3DD', t, cursor: t < W.enter });
    if (t > W.enter) bigText(g, s, 'ENTER', 540, 780, 130, '#8BE36B', { k: easeOutBack(clamp((t - W.enter) / 0.15), 3) });
  }
  if (t >= W.roundOver && t < W.chat - 0.3) { bigText(g, s, 'ROUND OVER', 540, 700, 118, '#FFD23F', { k: easeOutBack(clamp((t - W.roundOver) / 0.25), 2) }); if (t > W.wins) bigText(g, s, 'MIA WINS (AGAIN)', 540, 830, 84, '#C9A6FF', { k: easeOutBack(clamp((t - W.wins) / 0.2), 2.4) }); }
  // Skye joins: a big join banner and her name tag.
  if (t > W.joined - 0.1 && t < B.cta) {
    const a = t - W.joined + 0.1; g.save(); g.translate(540 * s, 780 * s); g.scale(easeOutBack(clamp(a / 0.25), 2), easeOutBack(clamp(a / 0.25), 2));
    roundRect(g, -430 * s, -70 * s, 860 * s, 140 * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#FF8AC8'; g.stroke();
    g.font = `800 ${50 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFE9A8'; g.fillText('Skye has joined the game.', 0, 4 * s); g.restore();
  }
  if (t > W.joined + 0.4) tagOver(g, s, skye, 'Skye', 'rgba(232,80,160,.92)', '#ffffff', clamp((t - W.joined - 0.4) / 0.2));
  // Call to action end card.
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -190 * s, 840 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'PART 6: SKYE GETS ADMIN?', 540, 520, 62, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k: k2 });
  }
  flash(g, s, t >= B.kicked && t < B.kicked + 0.15 ? 0.4 * (1 - (t - B.kicked) / 0.15) : t >= B.ice[0] && t < B.ice[0] + 0.12 ? 0.35 : 0, '#ffffff');
  if (SHOT === 'fling') speedLines(g, s, t, 0.45, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max, mia, noob, skye });
export const crownFits = () => crowns;
