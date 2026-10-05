// Copy the Crown. Web renderer + Roblox R6 pack. Every player copies whoever wears the crown; whoever has it when the
// timer ends wins a million coins. Leo grabs it off the Noob and walks Max off the edge, walks backwards so Max can never
// reach him, makes the whole server spin and dance. Mia flatters him into a bow, bows too, bonks the crown onto her own
// head - then takes one step back, and so do Leo and Max, who have been walking backwards all game.
// Beats: web/beats.js (source/beats.py). The set: web/kit.js. Everything is a pure function of time.
//
// The copy rule is simulated, not hand-animated: COPY is the list of moves the crown holder makes; every other player
// (alive at that moment) makes the same move from where they stand, along their own facing. Start spots are chosen so the
// same moves put Max off the +X rim (beat 2) and Leo and Max off the -Z / +Z rims (the end), and nobody else.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { puff, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, smooth, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, fitAccessory } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { W } from './beats.js';
import { V, arena, R_ARENA, LAVA_Y, PAD, COIN_BOARD } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.3) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Copy the Crown' };
export const sky = { zenith: '#2a78e4', horizon: '#ffd9b8', below: '#ff9a5a', fog: '#f2c9a8', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const PI = Math.PI;
const fwdOf = (h) => V(Math.sin(h), 0, Math.cos(h));
const headTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const angLerp = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;
const G_FALL = 60, T_FALL = Math.sqrt((2 * -LAVA_Y) / G_FALL);

// ---------- places (heading 0 faces +Z, PI/2 faces +X) ----------
const START = {
  noob: [V(-1.2, 0, -4.6), PI / 2], leo: [V(-1.5, 0, -7.35), 0], max: [V(7.5, 0, 3), PI / 2],
  mia: [V(1, 0, 8), -PI / 2], skye: [V(-6, 0, -2), 0],
};
const BACK_D = 9.75, STEPS_D = 4.5, STEP1_D = 1.6, LAST_D = 2.6;   // see story.md for why these numbers
const MAX_REACH = V(-1.5, 0, 1.25);                                // where Max's charge stops, 2.5 in front of Leo
const MIA_SPOT = V(-1.5, 0, -6.6);                                 // in front of Leo for the bow (Leo is at z = -11)
const BOW_MAX = 0.78;                                              // torso tilt (rad) at the bonk

// ---------- key times ----------
const T = {
  slam: [0.04, 0.2],                                               // crown slams onto the Noob
  grab: W.grabs + 0.05, grabLand: W.grabs + 0.38,                  // Leo snatches it
  respawn: W.respawns - 0.1, charge: W.charges - 0.05,
  maxDrop1: W.splash1 - T_FALL,
  stop: W.stops - 0.1, miaGo: W.mia1 - 0.1,
  bow0: W.bows - 0.12, bonk: W.bonk, landMia: Math.max(W.bonk + 0.7, W.hers - 0.05),
  leoDrop: W.splash2 - T_FALL, maxDrop2: W.splash3 - T_FALL,
  win: W.splash3 + 0.35, cta: W.follow + 0.75,
};
// The holder's moves, copied by everyone alive. kind: arm | walk (d studs along facing) | jump | spin | dance | proud | bow | wave
const COPY = [
  { kind: 'arm', t0: W.copies - 0.12, dur: Math.max(1.4, W.step1 - 0.1 - (W.copies - 0.12)) },
  { kind: 'walk', t0: W.step1 - 0.06, d: STEP1_D, dur: 0.3 },
  { kind: 'jump', t0: W.jump1 - 0.08, dur: 0.55 },
  { kind: 'walk', t0: W.three1 - 0.05, d: STEPS_D, dur: STEPS_D / 9 },
  { kind: 'walk', t0: W.backwards1 - 0.18, d: -BACK_D, dur: BACK_D / 9 },
  { kind: 'spin', t0: W.spins1 - 0.08, dur: 0.7 },
  { kind: 'spin', t0: W.spins2 - 0.08, dur: 0.7 },
  { kind: 'dance', t0: W.dances1 - 0.12, dur: W.ten - 0.2 - (W.dances1 - 0.12) },
  { kind: 'proud', t0: T.stop, dur: 0.9 },
  { kind: 'bow', t0: T.bow0, dur: T.bonk - T.bow0 + 0.45 },
  { kind: 'walk', t0: W.back - 0.2, d: -LAST_D, dur: 0.38 },
  { kind: 'wave', t0: T.win + 0.25, dur: 30 },
];
export const holderAt = (s) => (s < T.grabLand ? 'noob' : s < T.bonk ? 'leo' : s < T.landMia ? null : 'mia');

// ---------- the simulation ----------
// Own moves: goto (walk/run to a point), hang (cartoon pause in mid-air), fall, gone, respawn.
const OWN = {
  max: [{ kind: 'respawn', t0: T.respawn, to: PAD, heading: PI }, { kind: 'goto', t0: T.charge, to: MAX_REACH, speed: 13, run: true }],
  mia: [{ kind: 'goto', t0: T.miaGo, to: MIA_SPOT, speed: 12, endHeading: PI }],
};
// A player sits out copies while dead (fallen, waiting to respawn).
function aliveFor(who, t0) {
  if (who === 'max' && t0 > W.three1 + 0.6 && t0 < T.respawn) return false;
  if ((who === 'max' || who === 'leo') && t0 > W.back + 0.3) return false;
  return true;
}
const PLAN = {};
for (const who of Object.keys(START)) {
  const list = COPY.filter((m) => aliveFor(who, m.t0)).map((m) => ({ ...m, copy: true })).concat(OWN[who] || []);
  PLAN[who] = list.sort((a, b) => a.t0 - b.t0);
}
// Base body state at time s: feet position, heading, the active move (with progress u), offRim (walked past the edge).
function body(who, s) {
  const [p0, h0] = START[who]; let pos = p0.clone(), heading = h0, active = null, offAt = null;
  for (const m of PLAN[who]) {
    if (s < m.t0) break;
    const u = m.dur ? clamp((s - m.t0) / m.dur) : 1;
    if (m.kind === 'walk') { const st = pos.clone(); pos.addScaledVector(fwdOf(heading), m.d * u); if (u < 1) active = { m, u, dist: m.d * u }; if (offAt === null && pos.length() > R_ARENA && st.length() <= R_ARENA) offAt = m.t0 + m.dur * u; }
    else if (m.kind === 'spin') { heading += 2 * PI * easeInOut(u); if (u < 1) active = { m, u }; }
    else if (m.kind === 'respawn') { pos = m.to.clone(); heading = m.heading; offAt = null; active = { m, u: clamp((s - m.t0) / 1.6) }; }
    else if (m.kind === 'goto') {
      const from = pos.clone(), dist = from.distanceTo(m.to), dur = dist / m.speed, k = clamp((s - m.t0) / dur);
      const dir = headTo(from, m.to); pos = from.lerp(m.to, k); heading = dir;
      if (k < 1) active = { m, u: k, dist: dist * k }; else if (m.endHeading !== undefined) heading = angLerp(dir, m.endHeading, smooth(clamp((s - m.t0 - dur) / 0.3)));
      m.arrive = m.t0 + dur;
    } else if (s < m.t0 + m.dur) active = { m, u };
  }
  if (pos.length() > R_ARENA && offAt === null) offAt = s;
  return { pos, heading, active, off: pos.length() > R_ARENA };
}
// Check once that the rule puts exactly the right players in the lava.
export const OFF_CHECK = Object.fromEntries(Object.keys(START).map((w) => [w, [W.splash1 - 0.6, T.respawn - 0.05, W.dances1, W.bonk, T.leoDrop - 0.05].map((t) => body(w, t).off)]));

// ---------- scene ----------
let A = {}, leo, max, mia, noob, skye, K, cam, SHOT = 'hook', ff;
const ACT = {}, crowns = {}, puffs = [], sparkles = [];
const FACES = ['neutral', 'happy', 'laugh', 'smug', 'cool', 'shocked', 'scared', 'surprised', 'nervous', 'determined', 'sad', 'love', 'annoyed', 'angry',
  'shouting', 'suspicious', 'confused', 'dizzy', 'evil_grin', 'wink', 'talking', 'scheming', 'blink', 'knocked_out'];
export async function setup(stage) {
  const { scene } = stage;
  scene.fog.near = 160; scene.fog.far = 700;
  stage.hemi.groundColor.set('#ff8a50'); stage.hemi.intensity = 0.65;
  [leo, max, mia, noob, skye] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob', 'Skye'].map((n) => loadRobloxCharacter(n, { expressions: FACES, hairLift: n === 'Leo' ? 0.16 : 0 })));
  Object.assign(ACT, { leo, max, mia, noob, skye });
  for (const a of Object.values(ACT)) scene.add(a.root);
  for (const n of ['idle', 'walk', 'run', 'jump', 'shock', 'proud', 'laugh_big', 'point_forward', 'talk', 'dance2', 'stomp', 'facepalm', 'look_up', 'shrug'])
    A[n] = await loadAnimation(n);
  K = await arena(scene, packItem);
  for (const k of ['noob', 'leo', 'mia']) { crowns[k] = await fitAccessory(ACT[k], 'crown_admin'); }
  for (const k of ['leo', 'mia']) crowns[k].item.visible = false;
  scene.add(crowns.noob.item);                                     // one crown in the world, placed by the fits each frame
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 36; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- the cast: base body + pose + face ----------
// Hanging past the rim (cartoon pause) until `drop`, then a gravity fall into the lava; hidden once under.
function fallState(x, s, drop) {
  if (s < drop) { x.free = true; x.layers = [['shock', 0.3, 1, false]]; x.wiggle = true; return x; }
  const u = s - drop; x.free = true; x.pos.y = -0.5 * G_FALL * u * u; x.visible = x.pos.y > LAVA_Y - 4.5;
  x.layers = [['shock', 0.3, 1, false]]; x.face = 'scared'; x.tilt = -0.45 * clamp(u * 2.5); return x;
}
function stateOf(who, s) {
  const b = body(who, s), x = { pos: b.pos, heading: b.heading, layers: [['idle', s + who.length]], face: 'neutral', visible: true, arms: [] };
  const m = b.active?.m, u = b.active?.u ?? 0;
  if (m) {
    if (m.kind === 'walk') x.layers = [['walk', b.active.dist / STRIDE]];
    else if (m.kind === 'goto') x.layers = [[m.run ? 'run' : 'walk', b.active.dist / STRIDE]];
    else if (m.kind === 'jump') { x.free = true; x.pos.y += 2.4 * 4 * u * (1 - u); x.layers = [['jump', 0.25]]; }
    else if (m.kind === 'arm') { const e = smooth(inv(0, 0.18, u)) * (1 - smooth(inv(0.82, 1, u))); x.arms = [['R', 2.35 * e, 0.12]]; }
    else if (m.kind === 'dance') x.layers = [['dance2', s - m.t0, 1, true]];
    else if (m.kind === 'proud') x.layers = [['proud', s - m.t0, 1, false]];
    else if (m.kind === 'bow') { const k = s - m.t0, down = T.bonk - m.t0; x.bow = k < down ? BOW_MAX * easeInOut(k / down) : BOW_MAX * (1 - easeOut(clamp((k - down) / 0.45))); }
    else if (m.kind === 'wave') x.wave = true;
  }
  return FACE[who](x, s, b);
}
const FACE = {
  noob(x, s) {
    x.tag = 'Noob';
    x.face = s < T.grab ? (s < W.copies ? 'happy' : 'cool') : s < T.grab + 0.9 ? 'shocked' : s < W.dances1 ? 'confused' : s < W.ten ? 'happy' : s < T.bonk ? 'neutral' : s < T.win ? 'surprised' : 'happy';
    if (s > W.grabs - 0.05 && s < T.grab + 0.8) x.lookAt = 'leo';
    return x;
  },
  skye(x, s) {
    x.tag = 'Skye';
    x.face = s < W.leo1 ? 'happy' : s < W.backwards1 ? 'surprised' : s < W.dances1 ? 'annoyed' : s < W.ten ? 'laugh' : s < T.bonk ? 'suspicious' : s < T.win ? 'surprised' : 'happy';
    return x;
  },
  leo(x, s) {
    x.tag = 'Leo';
    x.face = s < W.leo1 ? 'scheming' : s < T.grabLand ? 'evil_grin' : s < W.so1 ? 'smug' : s < T.respawn ? 'laugh' : s < W.backwards1 ? 'nervous' : s < W.shows ? 'smug' : s < W.ten ? 'laugh' : 'cool';
    if (s > W.grabs - 0.35 && s < T.grabLand + 0.1) { x.arms = [['L', 1.9 * smooth(inv(W.grabs - 0.35, W.grabs - 0.05, s)) * (1 - smooth(inv(T.grabLand - 0.05, T.grabLand + 0.1, s))), -0.5]]; x.lookAt = 'noob'; }
    if (s > W.so1 && s < T.respawn) x.layers = [['laugh_big', s - W.so1]];
    if (s > T.stop + 0.9 && s < T.bow0) { x.layers = [['proud', 1, 1, false]]; x.face = s > W.leo5 ? 'love' : 'cool'; }
    if (s > W.resist - 0.1 && s < T.bonk) x.face = 'happy';
    if (s >= T.bonk) x.face = s < T.bonk + 0.5 ? 'dizzy' : s < W.three2 ? 'shocked' : 'angry';
    if (s >= T.landMia && s < W.back - 0.2) x.lookAt = 'mia';
    if (s >= W.back + 0.2) {
      const drop = T.leoDrop; x.face = s < W.leo6 ? 'confused' : 'scared';
      if (s > W.so4 - 0.1) x.lookDown = 0.6 * smooth(inv(W.so4 - 0.1, W.so4 + 0.3, s));
      if (s > W.backwards2) { x.lookDown = 0; x.face = 'nervous'; }
      return fallState(x, s, drop);
    }
    return x;
  },
  max(x, s, b) {
    x.tag = 'Max';
    x.face = s < W.leo1 ? 'love' : s < W.three1 ? 'happy' : 'happy';
    if (s < W.three1 + 0.6) { x.lookUp = 0.18; }                    // admiring the coin board
    if (b.off && s < T.respawn) {                                   // walked off the rim: hangs, notices, drops
      x.face = s < W.standing ? 'happy' : s < W.lava ? 'surprised' : 'scared';
      if (s > W.standing) x.lookDown = 0.6 * smooth(inv(W.standing, W.edge, s));
      if (s > W.lava + 0.1) { x.lookDown = 0; x.lookAt = 'cam'; }
      return fallState(x, s, T.maxDrop1);
    }
    if (s >= T.respawn - 0.01 && s < W.backwards1) {
      x.ff = true; x.face = s < T.charge ? 'angry' : 'determined';
      if (s > W.touch - 0.2) { x.layers = [['point_forward', 0.3, 1, false]]; x.face = 'evil_grin'; }
    }
    if (s >= W.backwards1 - 0.18 && s < W.shows) {
      x.face = s < W.never ? 'shocked' : 'angry';
      if (s > W.never - 0.1 && s < W.shows - 0.05 && !b.active) x.layers = [['stomp', s - W.never + 0.1, 1, false]];
    }
    if (s >= W.shows) x.face = s < W.ten ? 'annoyed' : s < T.bonk ? 'suspicious' : 'surprised';
    if (s >= W.back + 0.2) {
      x.face = s < W.leo6 ? 'confused' : 'scared';
      if (s > W.so4 && s < W.backwards2 + 0.3) x.lookDown = 0.6 * smooth(inv(W.so4, W.so4 + 0.4, s));
      return fallState(x, s, T.maxDrop2);
    }
    return x;
  },
  mia(x, s, b) {
    x.tag = 'Mia';
    x.face = s < W.leo1 ? 'happy' : s < W.shows ? 'surprised' : s < W.ten ? 'annoyed' : 'scheming';
    if (s >= T.miaGo && b.active?.m.kind === 'goto') x.face = 'smug';
    if (s > W.leo5 - 0.15 && s < W.resist) { x.layers = [['talk', s * 1.4]]; x.face = 'talking'; }
    if (s > W.resist && s < T.bow0) x.face = 'wink';
    if (s >= T.bonk) x.face = s < T.bonk + 0.5 ? 'dizzy' : s < T.landMia + 0.2 ? 'surprised' : 'smug';
    if (s > W.three2 - 0.1 && s < W.back) x.face = 'evil_grin';
    if (s > T.win) x.face = 'happy';
    return x;
  },
};

// ---------- posing ----------
const EUL = new THREE.Euler();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
function place(a, x, s) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0); a.heading = x.heading;
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [side, up, fwd] of x.arms || []) if (up > 0.01) setArm(a, side, up, fwd);
  if (x.wave) waveArm(a, s);
  if (x.wiggle) { a.bones['Arm.L'].rotateZ(0.12 * Math.sin(s * 15)); a.bones['Arm.R'].rotateZ(0.12 * Math.sin(s * 15 + 2)); }
  if (x.bow) { a.bones.Torso.rotateX(x.bow); a.bones.Head.rotateX(-x.bow * 0.25); }
  if (x.lookUp) a.bones.Head.rotateX(-x.lookUp);
  if (x.lookDown) a.bones.Head.rotateX(x.lookDown);
  if (x.tilt) a.root.rotateX(x.tilt);
  a.root.updateMatrixWorld(true);
  if (!x.free) a.root.position.y -= a.soleHeight() - x.pos.y;
  else a.root.position.y -= a.soleHeight() - a.root.position.y + (a.root.position.y - x.pos.y);   // feet at pos.y
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [W.copies - 0.2, 'copyWide'], [W.step1 - 0.15, 'stepJump'], [W.whoever2 - 0.1, 'prize'],
  [W.leo1 - 0.15, 'grab'], [W.three1 - 0.15, 'threeSteps'], [W.so1 - 0.1, 'maxAir'], [W.standing - 0.1, 'maxLook'], [W.splash1 - 0.55, 'maxFall'],
  [W.respawns - 0.15, 'respawn'], [W.touch - 0.12, 'reach'], [W.leo2 - 0.12, 'backSide'], [W.never - 0.1, 'never'],
  [W.shows - 0.12, 'spin1'], [W.server - 0.15, 'spinWide'], [W.dances1 - 0.15, 'dance1'], [W.everyone2 - 0.12, 'danceWide'],
  [W.ten - 0.12, 'ten'], [W.stops - 0.12, 'soak'], [W.mia1 - 0.12, 'miaWalk'], [W.leo5 - 0.15, 'flatter'], [W.resist - 0.12, 'bowSide'], [W.so3 - 0.1, 'bowClose'], [W.hits - 0.1, 'crownHers'],
  [W.three2 - 0.12, 'miaStep'], [W.so4 - 0.12, 'stepWide'], [W.leo6 - 0.12, 'leoHang'], [W.backwards2 - 0.12, 'maxHang'], [W.splash2 - 0.55, 'leoFall'],
  [W.splash3 - 0.45, 'maxFall2'], [W.splash3 + 0.3, 'win'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
export const SHOT_LIST = SHOTS;
function look(stage, p, tg, fov = 40, ext = 28) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, Math.min(tg.y, 30), tg.z), ext); return tg;
}
const orbit = (stage, tg, az, el, d, fov = 40, ext) => look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov, ext ?? Math.max(22, d * 0.8));
const faceCam = (stage, a, side = 0.4, d = 6.5, el = 0.02, fov = 38, up = 0.2) => orbit(stage, head(a).add(V(0, up, 0)), a.heading + side, el, d, fov, 20);
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), k * 0.5 * Math.sin(t * 57));
const shake = (t, at, k, dur = 0.35) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples() { return 1; }

// ---------- crown placement ----------
function crownAt(fit, a) {
  const q = a.bones.Head.getWorldQuaternion(new THREE.Quaternion()), p = a.bones.Head.localToWorld(fit.offset.clone());
  return { p, q, sc: fit.scale };
}
function placeCrown(s) {
  const c = crowns.noob.item; c.visible = true;
  const on = (k) => crownAt(crowns[k], ACT[k]);
  let p, q, sc;
  const arc = (A0, B0, u, h, spins = 0) => {
    p = A0.p.clone().lerp(B0.p, u); p.y += h * 4 * u * (1 - u); q = A0.q.clone().slerp(B0.q, u);
    if (spins) q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), spins * 2 * PI * u)); sc = lerp(A0.sc, B0.sc, u);
  };
  if (s < T.grab) { ({ p, q, sc } = on('noob')); p.y += 1.9 * (1 - easeIn(inv(T.slam[0], T.slam[1], s))); }
  else if (s < T.grabLand) arc(on('noob'), on('leo'), easeInOut(inv(T.grab, T.grabLand, s)), 1.6, 1);
  else if (s < T.bonk) ({ p, q, sc } = on('leo'));
  else if (s < T.landMia) { const u = inv(T.bonk, T.landMia, s); arc(on('leo'), on('mia'), u, 4.5, 2); }
  else ({ p, q, sc } = on('mia'));
  c.position.copy(p); c.quaternion.copy(q); c.scale.setScalar(sc);
}

// ---------- update ----------
const S = {};
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  for (const k of Object.keys(ACT)) S[k] = stateOf(k, s);
  // Heads that turn to look at someone (after the base pose; small, so it never fights the body).
  for (const k of Object.keys(ACT)) place(ACT[k], S[k], s);
  for (const k of Object.keys(ACT)) {
    const x = S[k], a = ACT[k]; if (!x.lookAt || !a.root.visible) continue;
    const tgt = x.lookAt === 'cam' ? stage.camera.position : ACT[x.lookAt].root.position;
    const d = Math.atan2(Math.sin(headTo(a.root.position, tgt) - x.heading), Math.cos(headTo(a.root.position, tgt) - x.heading));
    a.bones.Head.rotateY(clamp(d, -0.8, 0.8)); a.root.updateMatrixWorld(true);
  }
  K.lavaTex.offset.set((t * 0.012) % 1, (t * 0.007) % 1);
  placeCrown(s);
  // ForceField on Max's respawn.
  ff.visible = s > T.respawn && s < T.respawn + 1.6 && max.root.visible;
  if (ff.visible) { const fa = s - T.respawn; ff.position.copy(max.root.position).add(V(0, 2.9, 0)); ff.scale.set(3.4 * easeOutBack(clamp(fa / 0.25), 2), 3.6, 3.4); ff.material.uniforms.opacity.value = 1 - inv(1.1, 1.6, fa); ff.material.uniforms.time.value = t; }
  // Puffs: splashes (orange), the bonk (white), the crown landing on the Noob (gold).
  const ev = [];
  const splashAt = (who, at) => { const p = body(who, at).pos; ev.push([at, V(p.x, LAVA_Y + 0.6, p.z), 2.2, 0.9, '#ff7a2a']); };
  splashAt('max', W.splash1); splashAt('leo', W.splash2); splashAt('max', W.splash3);
  ev.push([T.bonk, MIA_SPOT.clone().lerp(V(-1.5, 0, -11), 0.5).add(V(0, 3.7, 0)), 0.8, 0.45, '#ffffff']);
  const evs = ev.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const e = evs[i % Math.max(1, evs.length)]; p.visible = !!e && i < evs.length * 8; if (!p.visible) return;
    const [at, c, size, dur, col] = e, uu = (s - at) / dur, a = i * 0.9;
    p.material.color.set(col); p.material.emissive.set(col); p.material.emissiveIntensity = col === '#ff7a2a' ? 0.9 : 0.25;
    p.position.set(c.x + Math.cos(a) * size * 1.2 * easeOut(uu), c.y + Math.sin(a * 2.3) * size * 0.9 + uu * size * 0.8, c.z + Math.sin(a) * size * 1.2 * easeOut(uu));
    p.scale.setScalar(size * (0.35 + 0.45 * easeOut(uu))); p.material.opacity = 0.85 * (1 - uu) ** 2;
  });
  // Sparkles: the crown slam, the snatch, the bonk stars, the crown landing on Mia, the win.
  const spk = [];
  const cp = crowns.noob.item.position;
  for (const [at, dur, k, col] of [[T.slam[1], 0.7, 0.8, '#ffe36b'], [T.grabLand, 0.7, 0.7, '#ffe36b'], [T.bonk, 0.9, 0.9, '#ffffff'], [T.landMia, 0.8, 0.8, '#ffe36b'], [T.win, 1.2, 1.3, '#ffe36b']])
    if (s >= at && s < at + dur) spk.push([at, at === T.bonk ? MIA_SPOT.clone().lerp(V(-1.5, 0, -11), 0.5).add(V(0, 3.9, 0)) : cp.clone().add(V(0, 0.4, 0)), k, col, dur]);
  sparkles.forEach((m, i) => {
    const sp = spk[i % Math.max(1, spk.length)]; m.visible = !!sp; if (!sp) return;
    const uu = (s - sp[0]) / sp[4], a = i * 2.39996, k = sp[2];
    m.position.copy(sp[1]).add(V(Math.cos(a + uu * 3) * (0.5 + 2.6 * uu) * k, ((i % 6) * 0.3 - 0.7 + uu * 1.2) * k, Math.sin(a + uu * 3) * (0.5 + 2.6 * uu) * k));
    m.scale.setScalar(1.1 * (1 - uu)); m.material.opacity = 1 - uu; m.material.color.set(sp[3]); m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- cameras ----------
  const lh = head(leo), mh = head(max), ih = head(mia), nh = head(noob);
  const P = (k) => ACT[k].root.position.clone();
  const mid = (a, b) => a.clone().lerp(b, 0.5);
  const centre = V(0, 1.5, 0);
  switch (shot.id) {
    case 'hook': {                                                 // crash zoom onto the Noob as the crown slams down
      const k = easeOut(clamp(s / 0.9));
      orbit(stage, nh.clone().add(V(0, lerp(1.6, 0.3, k), 0)).add(shake(t, T.slam[1], 0.18)), PI / 2 + 0.35, 0.1, lerp(8.5, 6.2, k), 42, 20); break;
    }
    case 'copyWide': orbit(stage, V(1, 1.5, -0.5), 0.12, 0.62, lerp(36, 34, u), 50, 30); break;
    case 'stepJump': orbit(stage, V(1, 2, -0.5), 0.3, 0.3, lerp(33, 31, u), 50, 30); break;
    case 'prize': {                                                // past Max at the edge to the coin board over the lava
      const k = easeInOut(u), tg = mh.clone().lerp(COIN_BOARD, lerp(0.4, 0.5, k)).add(V(0, -0.4, 0));
      look(stage, mh.clone().add(V(lerp(-9.5, -8.5, k), 1.2, 4.5)), tg, 55, 24); break;
    }
    case 'grab': { const tg = mid(lh, nh).add(V(0, 0.1, 0)); orbit(stage, tg, 0.2, 0.3, 9.5, 42, 20); break; }
    case 'threeSteps': look(stage, V(-10, 11, -7), V(7, 0.5, 1.5), 50, 32); break;
    case 'maxAir': { const tg = mh.clone().add(V(0, -1.6, 0)); look(stage, tg.clone().add(V(7, -0.6, 7.5)), tg, 46, 24); break; }
    case 'maxLook': faceCam(stage, max, -0.6, 6.5, 0.32, 40, 0); break;
    case 'maxFall': {
      const p = START.max[0].clone().add(V(STEP1_D + STEPS_D, 0, 0));
      const tg = p.clone().setY(lerp(1, LAVA_Y + 2, easeInOut(clamp((s - T.maxDrop1) / (T_FALL + 0.25)))));
      look(stage, p.clone().add(V(5, 3, 10)).add(shake(t, W.splash1, 0.45, 0.5)), tg, 54, 30); break;
    }
    case 'respawn': { const tg = P('leo').add(V(0, 2.5, 0)); look(stage, PAD.clone().add(V(3, 6.5, 12)), tg, 44, 30); break; }
    case 'reach': { const tg = mid(lh, mh).add(V(0, -0.2, 0)); orbit(stage, tg, 1.15, 0.08, 13, 40, 22); break; }
    case 'backSide': orbit(stage, V(-1.5, 0, -0.5), 0.1, 0.72, lerp(38, 40, u), 50, 30); break;
    case 'never': faceCam(stage, max, 0.15, lerp(7.5, 6.5, u), 0.02, 40, 0.1); break;
    case 'spin1': faceCam(stage, leo, 0.2, 8.5, 0.05, 44, -0.6); break;
    case 'spinWide': orbit(stage, V(0, 0, 0), 0.15 + 0.1 * u, 0.95, 40, 52, 32); break;
    case 'danceWide': orbit(stage, V(-2, 2, -4), 0.4 + 0.3 * u, 0.52, 27, 50, 32); break;
    case 'dance1': faceCam(stage, leo, 0.35, 10, 0.08, 46, -1.2); break;
    case 'ten': faceCam(stage, leo, 0.15, lerp(7.2, 6.2, u), 0.02, 40, 0); break;
    case 'miaWalk': { const ip0 = P('mia'), dir = P('leo').sub(ip0).setY(0).normalize(); look(stage, ip0.clone().addScaledVector(dir, -7).add(V(2.5, 6, 0)), lh.clone().add(V(0, -1.5, 0)), 50, 30); break; }
    case 'flatter': { const tg = ih.clone().add(V(0, -0.5, 0)); look(stage, lh.clone().add(V(3.4, 0.7, -3.6)), tg, 38, 20); break; }
    case 'bowSide': case 'bowClose': case 'crownHers': {
      const tg = MIA_SPOT.clone().lerp(V(-1.5, 0, -11), 0.5).add(V(0, SHOT === 'crownHers' ? 4.2 : SHOT === 'bowClose' ? 3.4 : 3, 0));
      const d = SHOT === 'crownHers' ? 15 : SHOT === 'bowClose' ? lerp(13.5, 12.5, u) : 16;
      orbit(stage, tg.add(shake(t, T.bonk, 0.25)), SHOT === 'bowClose' ? PI / 2 - 0.25 : PI / 2 + 0.12, 0.05, d, 42, 22); break;
    }
    case 'soak': { const tg = lh.clone().add(V(0, -1.2, 0)); orbit(stage, tg, 0.65, 0.16, lerp(13, 11.5, u), 46, 26); break; }
    case 'miaStep': faceCam(stage, mia, 0.95, lerp(8, 9.5, u), 0.06, 42, -0.3); break;
    case 'stepWide': orbit(stage, V(0, 0, -0.5), 0.12, 1.0, 44, 52, 34); break;
    case 'leoHang': { const tg = lh.clone().add(V(0, -1.6, 0)); look(stage, tg.clone().add(V(3.5, -0.8, 9)), tg, 46, 22); break; }
    case 'maxHang': { const tg = mh.clone().add(V(0, -1.6, 0)); look(stage, tg.clone().add(V(3.5, -0.8, -9)), tg, 46, 22); break; }
    case 'leoFall': case 'maxFall2': {
      const who = SHOT === 'leoFall' ? 'leo' : 'max', p = body(who, T.leoDrop - 0.01).pos, dz = Math.sign(p.z);
      const drop = who === 'leo' ? T.leoDrop : T.maxDrop2, splash = who === 'leo' ? W.splash2 : W.splash3;
      const tg = p.clone().setY(lerp(1, LAVA_Y + 2, easeInOut(clamp((s - drop) / (T_FALL + 0.25)))));
      look(stage, p.clone().add(V(7, 3, dz * 10)).add(shake(t, splash, 0.45, 0.5)), tg, 54, 30); break;
    }
    case 'win': { const k = easeInOut(inv(T.cta - 0.7, T.cta + 0.4, s)); const tg = ih.clone().add(V(0, lerp(-0.4, 1.6, k), 0)); orbit(stage, tg, PI + 0.3, 0.1, lerp(8, 13, k), 44, 24); break; }
    default: orbit(stage, centre, 0.3, 0.4, 30, 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920, on: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05, z: p.z }; }
function bigText(g, s, text, x, y, size, color, { k = 1, rot = 0, alpha = 1, edge = '#16141f' } = {}) {
  if (k <= 0) return;
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, at, d = 0.15, k = 2.6) => easeOutBack(clamp((t - at) / d), k);
function bubble(g, s, p3, text, t0, t, { size = 70, edge = '#ff5c8a', y = null, maxW = 940 } = {}) {
  const k = easeOutBack(clamp((t - t0) / 0.2), 1.8); if (k <= 0) return;
  const p = project(p3); g.save();
  let fs = size; g.font = `${fs * s}px "Luckiest Guy"`;
  while (g.measureText(text).width / s + 80 > maxW && fs > 30) { fs -= 2; g.font = `${fs * s}px "Luckiest Guy"`; }
  const w = g.measureText(text).width / s + 80, h = fs * 1.15 + 48;
  const bx = clamp(p.x, 70 + w / 2, 1010 - w / 2), by = clamp(y ?? p.y - 230, 420 + h / 2, 1080 - h / 2);
  g.translate(bx * s, by * s); g.scale(k, k);
  const tx = clamp(p.x - bx, -w / 2 + 50, w / 2 - 50), tipX = clamp(p.x - bx, -w, w) * 0.85, tipY = clamp(p.y - by - 40, h / 2 + 30, h / 2 + 90);
  g.beginPath(); g.moveTo((tx - 30) * s, (h / 2 - 4) * s); g.lineTo(tipX * s, tipY * s); g.lineTo((tx + 30) * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = edge; g.stroke();
  roundRect(g, (-w / 2) * s, (-h / 2) * s, w * s, h * s, 34 * s); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
function nameTag(g, s, a, text, { min = 24, max = 60 } = {}) {
  if (!a.root.visible || !text) return;
  const hp = head(a).add(V(0, 1.5, 0)), p = project(hp); if (!p.on || p.y < 370 || (p.y < 560 && p.x < 840 && chatOn)) return;
  const d = cam.position.distanceTo(hp), size = clamp(720 / d, min, max);
  if (720 / d < min * 0.7) return;
  g.save(); g.font = `800 ${size * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(10,12,24,.85)'; g.lineWidth = size * 0.22 * s; g.strokeText(text, p.x * s, p.y * s);
  g.fillStyle = '#ffffff'; g.fillText(text, p.x * s, p.y * s); g.restore();
}
const CHAT = [
  { text: 'Everyone copies the crown!', at: W.copies - 0.25, until: W.leo1 - 0.2 },
  { text: 'Crown at 0:00 wins 1,000,000 coins!', at: W.whoever2 - 0.05, until: W.leo1 - 0.2 },
  { text: 'Mia won 1,000,000 coins!', at: T.win + 0.1, until: T.cta },
];
let chatOn = false;
function chat(g, s, t) {
  const lines = CHAT.filter((l) => t >= l.at && t < l.until); chatOn = lines.length > 0; if (!lines.length) return;
  const x = 50, y = 400, w = 760, lh = 50, pad = 20, h = pad * 2 + lines.length * lh;
  g.save(); roundRect(g, x * s, y * s, w * s, h * s, 20 * s); g.fillStyle = 'rgba(12,18,28,.58)'; g.fill();
  g.font = `800 ${28 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  lines.forEach((l, i) => {
    const yy = (y + pad + lh * (i + 0.5)) * s; g.globalAlpha = clamp((t - l.at) / 0.12);
    g.fillStyle = '#FFD23F'; g.fillText('[Server]: ', (x + pad) * s, yy); const ox = g.measureText('[Server]: ').width;
    g.fillStyle = '#FFE9A8'; g.fillText(l.text, (x + pad) * s + ox, yy);
  });
  g.restore();
}
// The round timer (story time, not clock time): 45 at the start, 10 at "Ten seconds left", 3 at "Three seconds", 0 after the last splash.
const TIMER_KEYS = [[0, 45], [W.ten, 10], [W.three2, 3], [T.win, 0]];
export function timerAt(t) {
  for (let i = 1; i < TIMER_KEYS.length; i++) { const [a, va] = TIMER_KEYS[i - 1], [b, vb] = TIMER_KEYS[i]; if (t < b) return lerp(va, vb, clamp((t - a) / (b - a))); }
  return 0;
}
function hud(g, s, t) {
  const left = Math.ceil(timerAt(t) - 1e-6), holder = holderAt(t), name = holder ? holder.toUpperCase() : '...';
  const urgent = left <= 10, pulse = urgent ? 1 + 0.08 * Math.max(0, Math.sin((t - W.ten) * PI * 2)) : 1;
  g.save(); g.translate(540 * s, 270 * s); g.scale(pulse, pulse);
  const w = 640, h = 112;
  roundRect(g, (-w / 2) * s, (-h / 2) * s, w * s, h * s, 30 * s); g.fillStyle = urgent ? 'rgba(200,30,40,.9)' : 'rgba(20,26,48,.86)'; g.fill();
  g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  drawCrown(g, (-w / 2 + 70) * s, 2 * s, 36 * s);
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff';
  g.fillText(name, (-w / 2 + 125) * s, 6 * s);
  g.textAlign = 'right'; g.font = `${66 * s}px "Luckiest Guy"`; g.fillStyle = urgent ? '#ffffff' : '#ffd23f';
  g.fillText(`0:${String(left).padStart(2, '0')}`, (w / 2 - 34) * s, 6 * s);
  g.restore();
}

export function overlay(g, s, t) {
  chatOn = CHAT.some((l) => t >= l.at && t < l.until);
  for (const [k, a] of Object.entries(ACT)) nameTag(g, s, a, S[k].tag, SHOT === 'stepWide' || SHOT === 'copyWide' || SHOT === 'spinWide' || SHOT === 'danceWide' ? { min: 24, max: 34 } : {});
  hud(g, s, t);
  chat(g, s, t);
  // Mia's flattery.
  if (t >= W.leo5 - 0.15 && t < W.bows - 0.1) bubble(g, s, head(mia).add(V(0, 1.6, 0)), t < W.take - 0.12 ? 'Leo, that was amazing.' : 'Take a bow.', W.leo5 - 0.15, t, { size: 74 });
  // Copies: a "COPY!" pop over the crowd on the first demonstration of each move.
  for (const [at, txt] of [[W.copies - 0.05, 'COPY!'], [W.step1, 'STEP!'], [W.jump1, 'JUMP!']])
    if (t > at && t < at + 0.7 && (SHOT === 'copyWide' || SHOT === 'stepJump')) bigText(g, s, txt, 540, 1420, 130, '#ffd23f', { k: pop(t, at), rot: -0.06, alpha: 1 - inv(0.5, 0.7, t - at) });
  for (const [sh, at] of [['maxFall', W.splash1], ['leoFall', W.splash2], ['maxFall2', W.splash3]])
    if (SHOT === sh && t > at) bigText(g, s, 'OOF', 540, 820, 170, '#ff7a2a', { k: pop(t, at, 0.16, 2.4), rot: 0.06, alpha: 1 - inv(at + 0.8, at + 1.1, t) });
  if ((SHOT === 'bowSide' || SHOT === 'crownHers') && t > T.bonk && t < T.bonk + 1.1) bigText(g, s, 'BONK!', 540, 700, 180, '#ffffff', { k: pop(t, T.bonk, 0.14, 3), rot: -0.08, alpha: 1 - inv(T.bonk + 0.8, T.bonk + 1.1, t) });
  if (SHOT === 'ten' && t < W.stops) bigText(g, s, '10 SECONDS!', 540, 1450, 120, '#ff4d5e', { k: pop(t, W.ten - 0.05) });
  if (SHOT === 'miaStep' && t < W.back) bigText(g, s, '3 SECONDS', 540, 1450, 120, '#ff4d5e', { k: pop(t, W.three2 - 0.05) });
  if (SHOT === 'win' && t > T.win) {
    bigText(g, s, 'WINNER: MIA', 540, 1420, 130, '#FFD23F', { k: pop(t, T.win, 0.2), rot: -0.05 }); bigText(g, s, '+1,000,000', 540, 1560, 96, '#8BE36B', { k: pop(t, T.win + 0.2, 0.2) });
  }
  flash(g, s, t >= T.bonk && t < T.bonk + 0.08 ? 0.35 : t >= T.slam[1] && t < T.slam[1] + 0.07 ? 0.3 : t >= T.win && t < T.win + 0.1 ? 0.3 : 0, '#fff6d8');
  if (t >= T.cta) {
    const k2 = easeOutBack(clamp((t - T.cta) / 0.3), 1.6);
    g.save(); g.translate(540 * s, 560 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ ...ACT });
export const TIMES = T;
export const crownFits = () => crowns;
