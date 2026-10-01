// Leo Gave Everyone Admin (Part 3) - 63.3 s, web renderer + Roblox R6 pack. Timings from audio/alignment/captions.json.
// Leo means to kick everyone and types ":admin all": an admin war (explode, invisible, giant, rocket) while Mia types one
// long command that strips the boys of admin and makes them dance - but she forgot the AFK noob, who still has admin.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, fitAccessory } from '../../../web/lib/robloxPack.js';
import { cheerWave, waveArm, panicArms, hop } from '../../../web/lib/gestures.js';

export const meta = { seconds: 63.3, fps: 30, width: 1080, height: 1920, title: 'Leo Gave Everyone Admin' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- beats (seconds) ----------
const B = {
  crown: [0, 0.55], marks: [4.08, 4.33, 4.6], typeFast: [6.45, 8.35], tooFast: 7.66, admin: 8.59, enter: 9.57,
  crownsAll: [9.65, 9.85, 10.05], explodeType: [12.95, 13.95], boom: 14.78, respawn: 15.85, invisType: [16.7, 17.55],
  vanish: [18.25, 18.75], creep: [20.86, 22.5], spot: 22.95, giantType: [23.45, 24.25], grow: [24.5, 25.7],
  rocketType: [27.5, 28.4], rocketOn: 28.78, ignite: 29.45, liftoff: [29.7, 31.3], twinkle: 31.0, longCmd: 35.06,
  fall: [37.5, 39.5], twenty: 40.05, miaEnter: 42.26, shrink: [43.0, 43.55], leoBack: 43.93, dance: 45.7,
  crownsOff: [46.6, 46.95], roundOver: 51.0, miaWins: 52.0, noobAdmin: 56.76, back: 58.2, dinner: 58.8, wake: 59.05, cta: 59.94,
};
// The round clock: 1:00 -> 0:20 on "twenty seconds left" -> 0:00 as the round ends.
const clock = track([[0, 60, (u) => u], [B.twenty, 20, (u) => u], [B.roundOver, 0, (u) => u]]);
const P = { leo: V(0, 0, 2.2), max: V(-3.6, 0, 0.6), mia: V(6.4, 0, 2.4), noob: V(9, 0, -8) };
const SPAWN = V(0, 0, -3.5), HAIR = V(-3.6, 0, -3.4), LEO_BACK = V(3.8, 0, -3.4);      // 7.4 apart: dance2's outstretched arms (3.5 each side) never meet
const GIANT = 4, SKY = 260;
// Coming back down: drifts into view from high above, then drops the last stretch onto the hair.
const fallY = track([[37.5, 90, (u) => u], [38.7, 34, (u) => u], [39.5, 0, (u) => u * u]]);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const CAM = V(0, 0, 14);

const SHOTS = [
  [0, 'hook'], [3.16, 'plan'], [6.4, 'typing'], [8.55, 'typo'], [9.57, 'crowns'], [10.46, 'everyone'], [12.37, 'maxType'],
  [14.2, 'boom'], [15.7, 'respawn'], [18.15, 'vanish'], [19.6, 'hair'], [20.8, 'creep'], [22.8, 'spot'], [24.4, 'grow'],
  [27.25, 'rocketType'], [28.7, 'rocket'], [29.4, 'liftoff'], [30.45, 'space'], [31.35, 'mia'], [35.0, 'long'],
  [37.35, 'fallUp'], [39.15, 'fall'], [40.0, 'twenty'], [41.5, 'enter'], [42.85, 'remove'], [45.0, 'dance'], [46.3, 'crownsOff'],
  [47.9, 'danceWide'], [50.2, 'roundOver'], [51.95, 'miaWins'], [54.3, 'forgot'], [55.8, 'noob'], [57.7, 'back'], [59.9, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD', Mia: '#C9A6FF', noob: '#F5CD30' };
const typed = (name, text, from, to, at = to + 0.08) => ({ name, text, typed: [from, to], at });
const MIA_CMD = ':unadmin leo ; unadmin max ; dance leo ; dance max ; loopdance leo max ; nofly leo max ; nogiant max ; norocket max ; visible leo ; mute leo max';
const CHAT = [
  { name: 'Server', text: 'Leo won ADMIN for 1 round!', at: -1 },
  { name: 'Server', text: '1 round = 60 seconds.', at: 0.7 },
  typed('Leo', ':admin all', B.typeFast[0], B.typeFast[1], B.enter),
  { name: 'Server', text: 'Everyone is now an admin.', at: 9.8 },
  typed('Max', ':explode leo', ...B.explodeType),
  typed('Leo', ':invisible me', ...B.invisType),
  typed('Max', ':giant me', ...B.giantType),
  typed('Leo', ':rocket max', ...B.rocketType),
  { name: 'Mia', text: ':unadmin leo ; unadmin max ; dance leo ; da...', at: B.miaEnter },
  { name: 'Server', text: 'Leo is no longer an admin.', at: 43.95 },
  { name: 'Server', text: 'Max is no longer an admin.', at: 44.4 },
  { name: 'Server', text: 'Round over!', at: B.roundOver },
  { name: 'noob', text: 'sorry was eating dinner', at: B.dinner },
];
const miaTyped = (s) => MIA_CMD.slice(0, Math.floor(clamp((s - 12.0) / (B.miaEnter - 12.3)) * MIA_CMD.length));

// ---------- scene ----------
let A = {}, leo, max, mia, noob, cam, ff, rocket, flame, shadow, SHOT = 'hook', clockT = 0;
const crowns = {}, puffs = [], sparkles = [], blasts = [], smoke = [];

export async function setup(stage) {
  const { scene } = stage; const r = rng(53);
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'sleeping', 'blink', 'knocked_out', 'suspicious', 'confused'];
  [leo, max, mia, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (const n of ['idle', 'scheming', 'typing', 'walk', 'shock', 'panic', 'fall', 'dance2', 'dance2_b', 'proud', 'facepalm', 'laugh_big', 'point_forward', 'jump'])
    A[n] = await loadAnimation(n);

  const lobby = await packItem('map', 'lobby_platform'); lobby.position.y = -2.2; scene.add(lobby);
  const spawn = await packItem('map', 'spawn_location'); spawn.scale.set(0.5, 0.3, 0.5); spawn.position.copy(SPAWN); scene.add(spawn);
  for (const [x, z, sc] of [[-17, 7, 1], [16, -13, 0.9], [18, 9, 1.1], [-15, -14, 1]]) { const t = await packItem('map', 'tree_round'); t.position.set(x, 0, z); t.scale.setScalar(sc); scene.add(t); }
  for (let i = 0; i < 6; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 80 + r() * 60; isl.position.set(Math.cos(a) * d, -10 + r() * 25, Math.sin(a) * d); isl.scale.setScalar(0.8 + r()); scene.add(isl); }
  for (let i = 0; i < 40; i++) { const c = cloud(600 + i, 7 + r() * 9); const a = r() * Math.PI * 2, d = 90 + r() * 160; c.position.set(Math.cos(a) * d, -40 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 22; i++) { const c = cloud(800 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 70 + r() * 90; c.position.set(Math.cos(a) * d, 14 + r() * 40, Math.sin(a) * d); scene.add(c); }

  // Crowns: fitted per character (fitAccessory, checked by web/fit_check.mjs), placed in world space so they can drop on and pop off.
  for (const a of [leo, max, mia, noob]) { const fit = await fitAccessory(a, 'crown_admin'); crowns[a.name] = fit; scene.add(fit.item); }

  // Rocket strapped to Max's back: a child of his torso bone, so it grows with him.
  rocket = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#e9ecf2', roughness: 0.35 }), red = new THREE.MeshStandardMaterial({ color: '#e0302a', roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.4, 20), white); rocket.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.9, 20), red); nose.position.y = 1.65; rocket.add(nose);
  for (let i = 0; i < 3; i++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.55), red); const a = (i / 3) * Math.PI * 2; fin.position.set(Math.sin(a) * 0.45, -0.9, Math.cos(a) * 0.45); fin.rotation.y = a; rocket.add(fin); }
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.18, 20), red); band.position.y = 0.6; rocket.add(band);
  flame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.6, 16), new THREE.MeshBasicMaterial({ color: '#ffb640', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.rotation.x = Math.PI; flame.position.y = -2.0; rocket.add(flame);
  rocket.position.set(0, 1.2, -0.95); rocket.rotation.x = -0.12;
  max.bones.Torso.add(rocket);

  // The giant's shadow on the ground as he falls back down.
  shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.copy(HAIR).setY(0.03); scene.add(shadow);

  // Explosion: hot core + shock shell, additive so bloom catches them; smoke after.
  for (let i = 0; i < 3; i++) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ffb640', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ff4a1c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.renderOrder = shell.renderOrder = 6; scene.add(core, shell); blasts.push({ core, shell });
  }
  for (let i = 0; i < 14; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#6b6f78'); p.material.emissive.set('#222222'); scene.add(p); smoke.push(p); }
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 18; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 30; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, scale: 1, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const arc = (a, b, h, u) => a.clone().lerp(b, u).add(V(0, h * 4 * u * (1 - u), 0));
const typingNow = (name, s) => CHAT.some((c) => c.typed && c.name === name && s >= c.typed[0] - 0.15 && s < c.typed[1] + 0.1);

function leoState(s) {
  const b = st(P.leo, face(P.leo, CAM), idle(s), 'evil_grin');
  if (s < B.boom) {
    if (s > B.typeFast[0] - 0.1 && s < B.enter + 0.1) { b.layers = [[A.typing, s * 2.4]]; b.face = s > B.admin ? 'shocked' : 'determined'; }
    else if (s > 3.2 && s < 6.3) { b.layers = [[A.scheming, s]]; b.face = 'scheming'; }
    else if (s > B.enter) { b.layers = [[A.shock, s - B.enter]]; b.face = s > 12.9 ? 'scared' : 'shocked'; b.rotY = s > 12.6 ? face(P.leo, P.max) : b.rotY; }
    if (s > B.boom - 0.6) { b.layers = idle(s); b.gesture = 'panic'; b.face = 'scared'; }
  } else if (s < B.respawn) {
    // Roblox explosion: the joints break and the parts fly apart, then they're gone.
    b.layers = idle(s); b.face = 'knocked_out'; b.explode = (s - B.boom) / 0.9; b.visible = b.explode < 0.85;
  } else if (s < B.vanish[1]) {
    b.pos = SPAWN.clone(); b.rotY = face(SPAWN, CAM); b.face = s > B.invisType[0] ? 'evil_grin' : 'annoyed';
    b.layers = typingNow('Leo', s) ? [[A.typing, s]] : idle(s);
    if (s > B.vanish[0]) b.invisible = Math.floor((s - B.vanish[0]) / 0.06) % 2 === 0 || s > B.vanish[1] - 0.12;   // flicker out
  } else if (s < B.fall[1] + 0.05) {
    // Invisible: only the hair and crown show. Tiptoe from the spawn pad to just behind Max, then hide out there.
    b.invisible = true; b.face = 'evil_grin';
    const u = easeInOut(inv(...B.creep, s));
    b.pos = SPAWN.clone().lerp(HAIR, u);
    b.rotY = s < B.creep[0] ? face(SPAWN, CAM) : s < B.creep[1] ? face(SPAWN, HAIR) : face(HAIR, P.max);
    b.layers = s > B.creep[0] && s < B.creep[1] ? [[A.walk, s * 0.8]] : typingNow('Leo', s) ? [[A.typing, s]] : idle(s);
    if (s > B.creep[0] && s < B.creep[1]) b.bob = 0.12 * Math.abs(Math.sin(s * 9));     // tiptoeing
    if (s > B.fall[0]) { b.lookUp = 0.5; b.gesture = 'panic'; }
    if (s > B.fall[1] - 0.02) { b.squash = 0.1; b.spread = 1.6; }                        // flattened by the giant
  } else if (s < B.leoBack) { b.visible = false; }
  else {
    b.pos = LEO_BACK.clone(); b.rotY = face(LEO_BACK, CAM);
    if (s < B.dance) { b.layers = [[A.shock, s - B.leoBack]]; b.face = 'surprised'; }
    else { b.layers = [[A.dance2, s - B.dance, 1, true]]; b.face = s < 48.5 ? 'shocked' : 'annoyed'; }
  }
  return b;
}

function maxState(s) {
  const b = st(P.max, face(P.max, CAM), idle(s, 0.4), 'smug');
  if (s < 12.37) { b.face = s > B.crownsAll[0] + 0.3 ? 'evil_grin' : s > 3.2 ? 'neutral' : 'smug'; if (s > 10.5) b.rotY = face(P.max, P.leo); }
  else if (s < B.boom + 1) { b.layers = typingNow('Max', s) ? [[A.typing, s]] : s > B.boom ? [[A.laugh_big, s]] : idle(s); b.face = s > B.boom ? 'laugh' : 'evil_grin'; b.rotY = s > 14.0 ? face(P.max, P.leo) : face(P.max, CAM); }
  else if (s < B.spot) { b.layers = s < 18.5 ? [[A.laugh_big, s]] : idle(s); b.face = s < 18.5 ? 'laugh' : s > 21.5 ? 'suspicious' : 'smug'; b.rotY = face(P.max, CAM); }
  else if (s < B.liftoff[0]) {
    // Turns round, sees the floating hair, goes giant; a rocket appears on his back.
    b.rotY = lerp(face(P.max, CAM), face(P.max, HAIR), easeInOut(inv(B.spot, B.spot + 0.35, s)));
    b.layers = typingNow('Max', s) ? [[A.typing, s]] : s < B.grow[0] ? [[A.shock, s - B.spot]] : idle(s);
    b.face = s < B.giantType[0] ? 'shocked' : s < B.rocketOn ? 'evil_grin' : 'surprised';
    b.scale = lerp(1, GIANT, easeOutBack(inv(...B.grow, s), 1.3));
    if (s > B.rocketOn) { b.layers = [[A.shock, s - B.rocketOn]]; }
  } else if (s < B.shrink[0]) {
    b.scale = GIANT; b.rotY = face(P.max, HAIR); b.grounded = false;
    if (s < B.fall[0]) {          // up he goes
      const u = inv(...B.liftoff, s); b.pos = P.max.clone().add(V(0, SKY * easeIn(u), 0)); b.layers = idle(s); b.armsOut = 1.3; b.face = 'shocked';
      if (s < B.liftoff[0] + 0.05) b.grounded = true;
    } else if (s < B.fall[1]) {   // ...and back down on the hair
      b.pos = HAIR.clone().add(V(0, fallY(s), 0)); b.layers = idle(s); b.gesture = 'panic'; b.face = 'scared';
    } else { b.pos = HAIR.clone(); b.grounded = true; b.layers = idle(s); b.face = 'dizzy'; b.squash = 1 - 0.15 * Math.sin(Math.PI * inv(B.fall[1], B.fall[1] + 0.3, s)); }
  } else {
    b.pos = HAIR.clone(); b.rotY = face(HAIR, CAM);
    b.scale = lerp(GIANT, 1, easeInOut(inv(...B.shrink, s)));
    if (s < B.dance) { b.layers = idle(s); b.face = 'confused'; }
    else { b.layers = [[A.dance2, s - B.dance, 1, true]]; b.face = s < 48.5 ? 'angry' : 'annoyed'; }
  }
  return b;
}

function miaState(s) {
  const toAction = face(P.mia, V(-2, 0, -1.5));
  const b = st(P.mia, toAction, idle(s, 0.8), 'neutral');
  if (s > 12.0 && s < B.miaEnter + 0.2) { b.layers = [[A.typing, s * 0.9]]; b.face = 'annoyed'; }
  if (s < 12.0) { b.rotY = face(P.mia, CAM); b.face = s > B.crownsAll[1] + 0.3 ? 'suspicious' : 'neutral'; }
  if (s >= B.miaEnter + 0.2) { b.face = s > 47.9 ? 'cool' : 'smug'; b.layers = s > 47.9 ? [[A.proud, s - 47.9]] : idle(s); }
  if (s > 51.6) b.rotY = lerp(toAction, face(P.mia, CAM), easeInOut(inv(51.6, 52.0, s)));
  if (s > 54.3) { b.rotY = face(P.mia, P.noob); b.face = 'shocked'; }
  return b;
}

function noobState(s) {
  const b = st(P.noob, face(P.noob, V(12, 0, 6)), idle(s, 1.3), 'sleeping');
  if (s > B.back) b.face = s < B.back + 0.25 ? 'blink' : s < B.wake ? 'happy' : 'evil_grin';
  if (s > B.cta - 0.2) b.layers = [[A.typing, s]];
  return b;
}

const EXPLODE = { Head: [0, 2.2, 0.6], Torso: [0, 0.9, -1.1], 'Arm.L': [2.2, 0.6, 0.6], 'Arm.R': [-2.2, 0.8, 0.4], 'Leg.L': [1.2, -0.3, 1.0], 'Leg.R': [-1.2, -0.2, 0.8] };
function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.rotY, 0, 'YXZ');
  a.root.scale.set(x.scale * (x.spread || 1), x.scale * (x.squash || 1), x.scale * (x.spread || 1));
  robloxPose(a, x.layers);
  if (x.explode !== undefined) {               // parts fly out and tumble, gravity pulls them down
    const p = clamp(x.explode), k = easeOut(clamp(p * 1.4));
    for (const [bone, d] of Object.entries(EXPLODE)) {
      const bn = a.bones[bone]; bn.position.add(V(d[0] * k, d[1] * k - 3.2 * p * p, d[2] * k));
      bn.rotateX(d[2] * 3 * k); bn.rotateZ(d[0] * 2 * k);
    }
  }
  if (x.armsOut) { a.bones['Arm.L'].rotation.set(0, 0, x.armsOut); a.bones['Arm.R'].rotation.set(0, 0, -x.armsOut); }
  if (x.gesture) ({ cheer: cheerWave, wave: waveArm, panic: panicArms })[x.gesture](a, clockT + x.pos.x * 0.37);
  if (x.lookUp) a.bones.Head.rotateX(-x.lookUp);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  if (x.bob) a.root.position.y += x.bob;
  if (x.gesture === 'cheer') a.root.position.y += hop(clockT) * x.scale;
  // Invisible: everything but the hair (the crown is placed separately and stays).
  a.root.traverse((o) => { if (o.isMesh && o.name !== 'Hair') o.visible = !x.invisible; });
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 28); }
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
// frame(): orbit at the distance that makes the visible width (portrait 9:16) equal `w` world units.
function frame(stage, tg, az, el, w, fov = 40) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
const yaw = (a) => a.root.rotation.y;
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);

export function samples(t) { return (t > B.liftoff[0] && t < 30.45) || (t > B.fall[0] && t < B.fall[1]) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

export function update(t, stage) {
  const s = t; clockT = t;
  place(leo, leoState(s)); place(max, maxState(s)); place(mia, miaState(s)); place(noob, noobState(s));
  cam = stage.camera;

  // Crowns: Leo's from the start; everyone else's drops on with ":admin all"; Leo's and Max's pop off on Mia's command.
  for (const a of [leo, max, mia, noob]) {
    const fit = crowns[a.name], c = fit.item;
    const on = a === leo ? 0 : B.crownsAll[[max, mia, noob].indexOf(a)];
    const off = a === leo ? B.crownsOff[0] : a === max ? B.crownsOff[1] : 1e9;
    c.visible = s >= on - 0.01 && a.root.visible && s < off + 0.6;
    if (a === leo && s > B.fall[1] - 0.02 && s < B.leoBack) c.visible = false;     // crushed with him
    if (!c.visible) continue;
    const sc = a === max ? max.root.scale.x : 1;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(fit.scale * sc);
    c.position.copy(a.bones.Head.localToWorld(fit.offset.clone()));
    const drop = easeOutBack(inv(on, on + 0.5, s), 1.2); c.position.y += 5 * sc * (1 - drop);
    if (s > off) { const u = s - off; c.position.add(V(u * 1.5, 1.4 * u * 6 - 9 * u * u, 0)); c.rotation.set(u * 6, u * 4, u * 3); c.scale.multiplyScalar(1 - inv(0.35, 0.6, u)); }
  }

  // Rocket on Max's back: pops on, flame + smoke from ignition until he's gone.
  rocket.visible = s > B.rocketOn && s < B.fall[0];
  rocket.scale.setScalar(easeOutBack(inv(B.rocketOn, B.rocketOn + 0.25, s), 2) || 0.001);
  flame.visible = s > B.ignite; flame.scale.set(1, 0.8 + 0.4 * Math.sin(t * 60) + (s > B.liftoff[0] ? 0.8 : 0), 1);

  // Shadow of the falling giant.
  shadow.material.opacity = s > B.fall[0] && s < B.fall[1] + 0.2 ? 0.55 * inv(...B.fall, s) : 0;
  shadow.scale.setScalar(1 + 6 * inv(...B.fall, s) ** 2);

  // Explosion on Leo.
  const be = s - B.boom;
  blasts.forEach(({ core, shell }, i) => {
    const u = be - i * 0.06; core.visible = shell.visible = u > 0 && u < 0.8; if (!core.visible) return;
    const c = P.leo.clone().add(V((i - 1) * 0.6, 2.6 + i * 0.4, 0));
    core.position.copy(c); shell.position.copy(c);
    core.scale.setScalar(0.4 + 2.2 * easeOut(u / 0.3)); shell.scale.setScalar(0.8 + 3.6 * easeOut(u / 0.6));
    core.material.opacity = 1 - inv(0.08, 0.32, u); shell.material.opacity = 0.6 * (1 - inv(0.05, 0.5, u));
  });
  smoke.forEach((p, i) => {
    const u = be - 0.15; p.visible = u > 0 && u < 2.2; if (!p.visible) return;
    const a = i * 0.45; p.position.set(P.leo.x + Math.cos(a) * 2.2 * easeOut(u / 1.2), 2.4 + (i % 4) * 0.6 + u * 1.4, P.leo.z + Math.sin(a) * 2.2 * easeOut(u / 1.2));
    p.scale.setScalar(0.7 + 1.1 * easeOut(u / 1.5)); p.material.opacity = 0.75 * (1 - u / 2.2) ** 1.5;
  });

  // Respawn ForceFields (Leo at the spawn pad, and again when Mia's command brings him back).
  ff.visible = false;
  for (const [at, pos] of [[B.respawn, SPAWN], [B.leoBack, LEO_BACK]]) {
    const fa = s - at; if (fa < 0 || fa > 2) continue;
    ff.visible = true; ff.position.copy(pos).add(V(0, 2.9, 0)); ff.scale.setScalar(3.6 * easeOutBack(clamp(fa / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(1.5, 2, fa); ff.material.uniforms.time.value = t;
  }

  // Puffs: liftoff smoke, the giant landing, Max shrinking, crowns popping.
  const events = [[B.liftoff[0] - 0.2, P.max.clone().add(V(0, 0.5, 0)), 3.5, 1.4], [B.fall[1], HAIR.clone().add(V(0, 0.6, 0)), 5, 1.3], [B.shrink[0], HAIR.clone().add(V(0, 2, 0)), 3, 0.8], [B.leoBack - 0.1, LEO_BACK.clone().add(V(0, 1, 0)), 1.2, 0.6], [B.vanish[1] - 0.1, SPAWN.clone().add(V(0, 2.5, 0)), 1.1, 0.6]];
  let ev = null; for (const e of events) if (s >= e[0] && s < e[0] + e[3]) ev = e;
  puffs.forEach((p, i) => {
    p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur] = ev, u = (s - at) / dur, a = i * 0.35;
    p.position.set(c.x + Math.cos(a) * size * 1.6 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.6 * easeOut(u));
    p.scale.setScalar(size * (0.35 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  // Sparkles: crowns landing, crowns popping off.
  const sparkAt = [[0.45, head(leo).add(V(0, 0.6, 0))], [B.crownsAll[2] + 0.4, head(noob).add(V(0, 0.6, 0))], [B.crownsOff[0], LEO_BACK.clone().add(V(0, 5.6, 0))], [B.crownsOff[1], HAIR.clone().add(V(0, 5.6, 0))], [B.wake, head(noob).add(V(0, 0.8, 0))]];
  let sp = null; for (const e of sparkAt) if (s >= e[0] && s < e[0] + 1) sp = e;
  sparkles.forEach((m, i) => {
    m.visible = !!sp; if (!sp) return;
    const u = s - sp[0], a = i * 2.39996;
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (0.8 + 2.4 * u), (i % 6) * 0.3 + u * 1.4, Math.sin(a + u * 3) * (0.8 + 2.4 * u)));
    m.scale.setScalar(1.2 * (1 - u)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const lh = head(leo), xh = head(max), ih = head(mia), nh = head(noob);
  stage.bloom.strength = 0.3;
  switch (shot.id) {
    case 'hook': frame(stage, V(-0.6, 4.2, 1.6), 0.12, 0.08, lerp(8.5, 7.2, easeOut(u)), 40); break;
    case 'plan': frame(stage, V(2.8, 3.4, -2.6), 0.08, 0.1, 18.5, 42); break;
    case 'typing': frame(stage, lh.clone().add(V(0.2, 0.2, 0)), yaw(leo) + 0.35, 0.1, lerp(6, 4.8, u), 38); break;
    case 'typo': frame(stage, lh.clone().add(V(0, 0.4, 0)), yaw(leo) + 0.1, 0.06, 4.2, 36); break;
    case 'crowns': frame(stage, V(2.6, 3.4, -2.6), 0.08, 0.1, 21, 42); break;
    case 'everyone': frame(stage, lh.clone().add(V(-1.2, 0.2, 0)), yaw(leo) - 0.25, 0.08, 8.5, 38); break;
    case 'maxType': frame(stage, xh.clone().add(V(0.3, 0.1, 0)), face(P.max, CAM) + 0.3, 0.1, 6, 38); break;
    case 'boom': frame(stage, V(0, 3.4, 2.2).add(s > B.boom && s < B.boom + 0.4 ? jolt(t, 0.25 * (1 - (s - B.boom) / 0.4)) : V(0, 0, 0)), 0.12, 0.1, 11, 42); break;
    case 'respawn': frame(stage, SPAWN.clone().add(V(0, 3.6, 0)), 0.15, 0.1, lerp(8.5, 7.5, u), 40); break;
    case 'vanish': frame(stage, SPAWN.clone().add(V(0, 3.6, 0)), 0.15, 0.1, 6.5, 40); break;
    case 'hair': frame(stage, lh.clone().add(V(0, -0.2, 0)), yaw(leo) + 0.3, 0.06, 3.6, 36); break;
    case 'creep': frame(stage, V(-2.2, 3.6, -1.6), 0.28, 0.12, 12, 42); break;
    case 'spot': frame(stage, V(-3.6, 4.2, -1.6), Math.PI + 0.35, 0.08, 8.5, 40); break;         // from behind the hair: Max turns to face us
    case 'grow': { const k = easeOut(inv(B.grow[0], B.grow[1] + 0.3, s)); frame(stage, V(-3.6, lerp(4, 10.5, k), lerp(-1.5, 0, k)), Math.PI + 0.3, lerp(0.05, -0.12, k), lerp(9, 26, k), 44); break; }
    case 'rocketType': frame(stage, lh.clone().add(V(0, -0.3, 0)), -1.25, 0.12, 4.5, 36); break;
    case 'rocket': frame(stage, V(-3.6, 9.5, 0.2), -1.75, 0.08, 27, 44); break;
    case 'liftoff': { const p = max.bones.Torso.localToWorld(V(0, 1, 0)); look(stage, V(9, 3, 24), p.clone().lerp(V(-3.6, 10, 0.6), 0.25), 50); break; }
    case 'space': look(stage, V(4, 2, 16), V(-3.6, 160, -2), 58); break;
    case 'mia': frame(stage, ih.clone().add(V(0, -0.4, 0)), yaw(mia) + 0.25, 0.08, 6.5, 38); break;
    case 'long': frame(stage, ih.clone().add(V(0, 0.1, 0)), yaw(mia) + 0.15, 0.05, 4.6, 36); break;
    case 'fallUp': { const m = max.root.position.clone().add(V(0, 4, 0)); look(stage, V(-1.2, 1.0, 9.0), V(-3.6, 4, -3.4).lerp(m, 0.35).setY(Math.min(14, lerp(4, m.y, 0.35))), 64); break; }
    case 'fall': frame(stage, V(-3.4, 10, -3.4).add(s > B.fall[1] && s < B.fall[1] + 0.45 ? jolt(t, 0.5 * (1 - (s - B.fall[1]) / 0.45)) : V(0, 0, 0)), 0.75, 0.1, 28, 44); break;
    case 'twenty': frame(stage, V(-3.2, 9, -3.4), 0.6, 0.12, 27, 44); break;
    case 'enter': frame(stage, ih.clone().add(V(0, 0.2, 0)), yaw(mia) + 0.1, 0.06, 4.6, 36); break;
    case 'remove': { const k = easeInOut(inv(B.shrink[0], B.shrink[1] + 0.2, s)); frame(stage, V(0.1, lerp(9.5, 3.6, k), -3.4), 0.12, 0.1, lerp(28, 15, k), 42); break; }
    case 'dance': frame(stage, V(0.1, 3.6, -3.4), 0.1, 0.08, 15, 40); break;
    case 'crownsOff': frame(stage, V(0.1, 4.3, -3.4), 0.05, 0.06, 13.5, 40); break;
    case 'danceWide': look(stage, V(5, 6.5, 24), V(1.2, 3.0, -1.5), 47); break;     // over Mia's shoulder, boys clear of her
    case 'roundOver': frame(stage, V(0.1, 3.6, -3.4), 0.25, 0.1, lerp(15.5, 17, u), 40); break;
    case 'miaWins': frame(stage, ih.clone().add(V(0, 0.1, 0)), yaw(mia), 0.06, lerp(6, 5, u), 36); break;
    case 'forgot': { const k = easeInOut(inv(54.3, 54.95, s)); look(stage, V(12.5, 4.6, 8), ih.clone().lerp(nh.clone().add(V(0, -1, 0)), k), lerp(40, 30, k)); break; }
    case 'noob': frame(stage, nh.clone().add(V(0, 0.2, 0)), yaw(noob), 0.06, lerp(9, 5, easeInOut(u)), 36); break;
    case 'back': frame(stage, nh.clone().add(V(0, 0.3, 0)), yaw(noob), 0.05, 4.4, 36); break;
    default: frame(stage, nh.clone().add(V(0, -1.4, 0)), yaw(noob) + 0.15, 0.06, 7.5, 36);   // CTA: the noob, awake, typing
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
  let label, col = 'rgba(21,36,53,.86)', edge = '#FFC83D', ink = '#FFE7A0', crown = true;
  const v = Math.max(0, Math.ceil(clock(t))), mm = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  if (t < B.enter) label = `LEO ADMIN ${mm}`;
  else if (t < B.miaEnter) { label = `ALL ADMIN ${mm}`; col = 'rgba(214,92,24,.92)'; ink = '#ffffff'; }
  else if (t < B.roundOver) { label = `MIA ADMIN ${mm}`; col = 'rgba(112,64,190,.92)'; ink = '#ffffff'; }
  else if (t < B.noobAdmin) { label = 'ROUND OVER'; col = 'rgba(70,70,80,.9)'; edge = '#9a9aa5'; ink = '#d0d0d8'; crown = false; }
  else { label = 'NOOB ADMIN ?:??'; col = Math.floor(t * 4) % 2 ? 'rgba(220,40,60,.92)' : 'rgba(21,36,53,.9)'; ink = '#ffffff'; }
  g.save(); g.font = `${50 * s}px "Luckiest Guy"`;
  const w = g.measureText(label).width + (crown ? 140 : 70) * s, x = 60 * s, y = 250 * s;
  roundRect(g, x, y, w, 90 * s, 26 * s); g.fillStyle = col; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = edge; g.stroke();
  if (crown) drawCrown(g, x + 58 * s, y + 46 * s, 33 * s);
  g.fillStyle = ink; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(label, x + (crown ? 104 : 34) * s, y + 50 * s);
  g.restore();
  // PART 3 tag beside it.
  const px = (w / s + 80); g.save(); g.font = `${42 * s}px "Luckiest Guy"`; const tw = g.measureText('PART 3').width + 40 * s;
  roundRect(g, px * s, 260 * s, tw, 70 * s, 20 * s); g.fillStyle = '#FFD23F'; g.fill(); g.fillStyle = '#152435'; g.textBaseline = 'middle'; g.fillText('PART 3', px * s + 20 * s, 297 * s); g.restore();
}
function chatBox(g, s, t, { x = 60, y = 370, w = 820, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => t >= l.at).slice(-rows);
  const ty = CHAT.find((l) => l.typed && t >= l.typed[0] - 0.1 && t < l.typed[1] + 0.1);
  const miaTyping = t > 12.0 && t < B.miaEnter;
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
    g.fillStyle = '#ffffff'; g.fillText(txt, x * s + pad * 1.2, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0) g.fillRect(x * s + pad * 1.2 + g.measureText(txt).width + 4 * s, yy - 14 * s, 4 * s, 36 * s);
  }
  // Running gag: Mia has been typing the whole fight.
  if (miaTyping) {
    const by = y * s + h + 12 * s, dots = '.'.repeat(1 + (Math.floor(t * 3) % 3));
    g.font = `800 ${28 * s}px Montserrat`; const label = `Mia is typing${dots}`; const bw = g.measureText('Mia is typing...').width + 36 * s;
    roundRect(g, x * s, by, bw, 50 * s, 16 * s); g.fillStyle = 'rgba(112,64,190,.8)'; g.fill(); g.fillStyle = '#ffffff'; g.fillText(label, x * s + 18 * s, by + 27 * s);
  }
  g.restore();
}
// A big input box (below the caption line) for the moments the typing itself is the joke.
function bigInput(g, s, text, { y = 1330, red = null, cursor = true, size = 72, t = 0, w = 920 } = {}) {
  g.save(); g.font = `800 ${size * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const x = (1080 - w) / 2, lines = [], maxW = (w - 80) * s;
  let cur = '';
  for (const word of text.split(' ')) { const tryL = cur ? cur + ' ' + word : word; if (g.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = word; } else cur = tryL; }
  lines.push(cur);
  const lh = size * 1.25, h = 50 + lines.length * lh;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
  lines.forEach((ln, i) => {
    const ly = (y + 25 + lh * (i + 0.5)) * s;
    if (red && ln.includes(red)) {
      const pre = ln.slice(0, ln.indexOf(red)), px = (x + 40) * s + g.measureText(pre).width, rw = g.measureText(red).width;
      roundRect(g, px - 8 * s, ly - lh * 0.45 * s, rw + 16 * s, lh * 0.9 * s, 12 * s); g.fillStyle = '#e8213a'; g.fill();
    }
    g.fillStyle = '#ffffff'; g.fillText(ln, (x + 40) * s, ly);
    if (cursor && i === lines.length - 1 && Math.floor(t * 4) % 2 === 0) g.fillRect((x + 40) * s + g.measureText(ln).width + 8 * s, ly - lh * 0.4 * s, 7 * s, lh * 0.8 * s);
  });
  g.restore();
}
function tagOver(g, s, pos, text, bg, fg) {
  const p = project(pos, s); if (!p.on) return;
  g.save(); g.font = `${40 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 36 * s;
  roundRect(g, p.x - w / 2, p.y - 30 * s, w, 60 * s, 18 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, p.x, p.y + 3 * s); g.restore();
}

export function overlay(g, s, t) {
  // Space: darken the sky as Max leaves the atmosphere; a star twinkles where he vanished.
  if (SHOT === 'space') {
    const k = inv(30.45, 30.9, t), grd = g.createLinearGradient(0, 0, 0, 1920 * s);
    grd.addColorStop(0, `rgba(6,10,30,${0.95 * k})`); grd.addColorStop(0.6, `rgba(10,20,60,${0.7 * k})`); grd.addColorStop(1, 'rgba(10,20,60,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 1080 * s, 1920 * s);
    const r = rng(7); g.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) { g.globalAlpha = k * (0.4 + 0.6 * r()); g.fillRect(r() * 1080 * s, r() * 1300 * s, 3 * s, 3 * s); }
    g.globalAlpha = 1;
    const tw = t - B.twinkle;
    if (tw > 0 && tw < 0.6) {
      const p = project(max.bones.Torso.localToWorld(V(0, 1, 0)), s), k2 = Math.sin(Math.PI * tw / 0.6) * 60 * s;
      g.save(); g.translate(p.x, Math.max(p.y, 200 * s)); g.fillStyle = '#fff7c2';
      g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? k2 * 0.25 : k2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore();
    }
  }
  hud(g, s, t);
  if (t < B.cta && SHOT !== 'space' && SHOT !== 'fall') chatBox(g, s, t);

  // Opening: the stakes, one round is one minute.
  if (t > 0.55 && t < 3.1) {
    const k = easeOutBack(clamp((t - 0.55) / 0.25), 2.2), al = 1 - inv(2.85, 3.1, t);
    g.save(); g.globalAlpha = al; g.translate(540 * s, 1440 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -390 * s, -70 * s, 780 * s, 140 * s, 40 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#152435'; g.stroke();
    g.font = `${74 * s}px "Luckiest Guy"`; g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1 ROUND = 1 MINUTE', 0, 6 * s);
    g.restore();
  }
  // The plan: target markers on everyone else.
  if (SHOT === 'plan') {
    bigText(g, s, 'PLAN: KICK EVERYONE', 540, 760, 84, '#ff4d5e', { k: easeOutBack(clamp((t - 3.3) / 0.2), 2.4) });
    [[max, B.marks[0]], [mia, B.marks[1]], [noob, B.marks[2]]].forEach(([a, at]) => {
      if (t < at) return; const p = project(head(a).add(V(0, 0.9, 0)), s); if (!p.on) return;
      const k = easeOutBack(clamp((t - at) / 0.2), 2.4), r = 46 * s * k;
      g.save(); g.translate(p.x, p.y); g.strokeStyle = '#ff2b3d'; g.lineWidth = 8 * s; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
      g.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.moveTo(dx * r * 0.5, dy * r * 0.5); g.lineTo(dx * r * 1.35, dy * r * 1.35); } g.stroke(); g.restore();
    });
  }
  // Typing too fast: the big input, then the typo.
  if (t > B.typeFast[0] && t < B.enter + 0.6) {
    const txt = ':admin all'.slice(0, Math.floor(clamp((t - B.typeFast[0]) / (B.typeFast[1] - B.typeFast[0])) * 10));
    bigInput(g, s, txt, { red: t > B.admin ? 'admin' : null, t, cursor: t < B.enter });
    if (t > B.tooFast && t < B.admin) bigText(g, s, 'TOO FAST', 540, 760, 110, '#ffffff', { k: easeOutBack(clamp((t - B.tooFast) / 0.15), 3), rot: -0.06 });
    if (t > B.admin && t < B.enter) bigText(g, s, 'NOT KICK...', 540, 760, 96, '#ff4d5e', { k: easeOutBack(clamp((t - B.admin) / 0.15), 3), rot: -0.06 });
    if (t > B.enter) bigText(g, s, 'ENTER', 540, 760, 110, '#8BE36B', { k: easeOutBack(clamp((t - B.enter) / 0.15), 3) });
  }
  if (t > 10.3 && t < 12.3) bigText(g, s, 'EVERYONE IS ADMIN', 540, 760, 84, '#FFD23F', { k: easeOutBack(clamp((t - 10.3) / 0.2), 2.4) });
  // Payoff words.
  for (const [at, word, col, size] of [[B.boom, 'BOOM!', '#ffb640', 190], [B.respawn + 0.1, 'RESPAWNED', '#8BE36B', 100], [B.grow[0] + 0.3, 'GIANT!', '#7FE3DD', 160], [B.liftoff[0], 'LIFTOFF', '#ffb640', 130], [B.fall[1], 'SPLAT!', '#ffffff', 170], [B.dance, 'DANCE!', '#C9A6FF', 150]]) {
    const a = t - at; if (a < 0 || a > 0.95) continue;
    bigText(g, s, word, 540, 780, size, col, { k: easeOutBack(clamp(a / 0.15), 3), alpha: 1 - inv(0.75, 0.95, a), rot: -0.07 });
  }
  if (SHOT === 'hair' || SHOT === 'creep') { const p = project(head(leo).add(V(0, 1.3, 0)), s); if (p.on && t > 19.8) bigText(g, s, '?', p.x / s + 70, p.y / s, 80, '#ffffff', { k: 1 + 0.08 * Math.sin(t * 9) }); }
  // Mia's command, getting longer and longer.
  if (SHOT === 'long' || (SHOT === 'mia' && t > 33.8)) bigInput(g, s, miaTyped(t), { y: 1320, size: 46, t, w: 980 });
  if (t > B.twenty && t < 41.45) bigText(g, s, '0:20', 540, 780, 200, '#ff4d5e', { k: easeOutBack(clamp((t - B.twenty) / 0.2), 2.4) * (1 + 0.04 * Math.sin(t * 12)) });
  if (SHOT === 'enter') { bigInput(g, s, MIA_CMD, { y: 1320, size: 40, t, w: 1000, cursor: t < B.miaEnter }); if (t > B.miaEnter) bigText(g, s, 'ENTER', 540, 780, 130, '#8BE36B', { k: easeOutBack(clamp((t - B.miaEnter) / 0.15), 3) }); }
  if (t >= B.roundOver && t < 51.95) bigText(g, s, 'ROUND OVER', 540, 760, 118, '#FFD23F', { k: easeOutBack(clamp((t - B.roundOver) / 0.25), 2) });
  if (SHOT === 'miaWins') bigText(g, s, 'MIA WINS', 540, 760, 140, '#C9A6FF', { k: easeOutBack(clamp((t - 52.0) / 0.25), 2.2) });
  // The noob: AFK the whole round, then BACK.
  if (t < B.cta) tagOver(g, s, head(noob).add(V(0, 1.5, 0)), t < B.back ? 'AFK' : 'BACK', t < B.back ? 'rgba(40,40,48,.85)' : 'rgba(40,170,80,.92)', t < B.back ? '#d7d7de' : '#ffffff');
  if (SHOT === 'noob' && t > B.noobAdmin) bigText(g, s, 'STILL ADMIN', 540, 760, 110, '#ff4d5e', { k: easeOutBack(clamp((t - B.noobAdmin) / 0.2), 2.4) });

  // Call to action end card.
  if (t >= B.cta) {
    const a = t - B.cta, k = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k, k);
    roundRect(g, -420 * s, -190 * s, 840 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'PART 4: THE NOOB HAS ADMIN', 540, 520, 58, '#FFD23F', { k });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k });
  }
  flash(g, s, t >= B.boom && t < B.boom + 0.2 ? 0.6 * (1 - (t - B.boom) / 0.2) : t >= B.fall[1] && t < B.fall[1] + 0.15 ? 0.4 * (1 - (t - B.fall[1]) / 0.15) : 0, '#ffffff');
  if (SHOT === 'liftoff' || (SHOT === 'fall' && t < B.fall[1])) speedLines(g, s, t, 0.45, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max, mia, noob });
