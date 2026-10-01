// Max Got Admin For One Round (Part 2) - 67.5 s, web renderer + Roblox R6 pack. Timings from audio/alignment/captions.json.
// Max spends his admin round on revenge against Leo; every command backfires, the ban lands one second after his admin
// runs out, next round Leo gets admin again, then the call to action. Built on the lessons in references/workflow.md:
// premise on frame 1, ADMIN countdown throughout, a typed command with a payoff every 4-6 s.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, fitAccessory } from '../../../web/lib/robloxPack.js';

export const meta = { seconds: 67.5, fps: 30, width: 1080, height: 1920, title: 'Max Got Admin For One Round' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- beats (seconds) ----------
const B = {
  crown: [0.0, 0.55], revenge: 3.89,
  kick: 5.97, rejoin: 10.15,
  cageDrop: [13.55, 13.95], walkOut: [16.3, 17.5],
  ice: [19.35, 19.8], miaIn: [21.9, 22.75], sit: 22.8, laugh: 24.0,
  shatter: 28.05, tiny: [28.05, 28.4], stomp: 29.55, respawn: 30.75, wave: 32.57,
  fling: 34.95, land: 38.45, bow: 39.95,
  ten: 41.04, ban: 47.23, enter: 54.22, denied: 54.94, roundOver: 56.94, leoAdmin: 62.24, cta: 63.95,
};
// ADMIN clock: 60 -> 10 at "ten seconds left" -> 0 just as he finishes typing (he presses enter a second later).
const clock = track([[0, 60, (u) => u], [B.ten, 10, (u) => u], [53.25, 0, (u) => u]]);
const P = { max: V(-2.4, 0, 1.4), leo: V(2.8, 0, 0.2), mia: V(-7, 0, -4), noob: V(7.5, 0, -5) };
const PODIUM = V(-14, 0, -12), PODIUM_TOP = V(-14, 3, -12);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const STOMP = V(2.0, 0, 3.7);           // where Max stands after the stomp, right next to where tiny Leo was

const SHOTS = [
  [0, 'hook'], [3.89, 'revenge'], [4.66, 'kickType'], [5.95, 'kickGone'], [8.3, 'maxCheer'], [10.0, 'rejoin'],
  [11.5, 'jailType'], [13.5, 'cage'], [16.2, 'walkOut'], [18.25, 'freezeType'], [19.3, 'ice'], [22.4, 'chair'],
  [24.0, 'laugh'], [27.1, 'tinyType'], [28.0, 'tiny'], [29.2, 'stomp'], [30.4, 'respawn'], [33.7, 'flingType'],
  [34.9, 'flight'], [37.7, 'podium'], [41.0, 'ten'], [44.3, 'drama'], [47.2, 'banSlam'], [47.95, 'typing'],
  [54.9, 'denied'], [56.9, 'roundOver'], [59.4, 'stillHere'], [60.9, 'nextRound'], [63.9, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD', Mia: '#C9A6FF', noob: '#F5CD30' };
const typed = (name, text, from, to) => ({ name, text, typed: [from, to], at: to + 0.08 });
const CHAT = [
  { name: 'Server', text: 'Max won ADMIN for 1 round!', at: -1 },
  typed('Max', ':kick leo', 4.8, 5.55),
  { name: 'Server', text: 'Leo has left the game.', at: 6.0 },
  { name: 'Server', text: 'Leo has joined the game.', at: 10.1 },
  { name: 'Leo', text: 'back :)', at: 10.9 },
  typed('Max', ':jail leo', 11.6, 12.4),
  { name: 'Leo', text: 'nice cage', at: 17.3 },
  typed('Max', ':freeze leo', 18.35, 19.2),
  { name: 'Mia', text: 'comfy', at: 23.4 },
  typed('Max', ':tiny leo', 27.15, 27.9),
  { name: 'Leo', text: 'rude', at: 31.6 },
  typed('Max', ':fling leo', 33.8, 34.6),
  { name: 'Leo', text: 'gg ez', at: 40.3 },
  { name: 'Max', text: ':ban leo', at: 54.3, fail: true },
  { name: 'Server', text: 'You are not an admin.', at: B.denied, red: true },
  { name: 'Server', text: 'Round over!', at: B.roundOver },
  { name: 'Server', text: 'Leo won ADMIN for 1 round!', at: B.leoAdmin + 0.1 },
];
// ":ban leo" typed letter by letter on the narration's spelled letters.
const BAN_KEYS = [[49.9, ':'], [50.18, 'b'], [50.54, 'a'], [50.9, 'n'], [51.19, ' '], [52.09, 'l'], [52.37, 'e'], [52.66, 'o']];
const banText = (s) => BAN_KEYS.filter(([at]) => s >= at).map(([, k]) => k).join('');

// ---------- scene ----------
let A = {}, max, leo, mia, noob, maxCrown, maxFit, leoCrown, leoFit, cage, ice, ff, cam, podium;
let puffs = [], sparkles = [];

export async function setup(stage) {
  const { scene } = stage; const r = rng(31);
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'sad', 'determined', 'talking', 'dizzy'];
  [max, leo, mia, noob] = await Promise.all(['Max', 'Leo', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(max.root, leo.root, mia.root, noob.root);
  for (const n of ['idle', 'scheming', 'typing', 'cheer', 'celebrate', 'laugh_big', 'wave', 'shock', 'panic', 'facepalm', 'sit', 'stomp', 'walk', 'fly', 'proud', 'defeated', 'shrug', 'point_forward', 'hero', 'think', 'dizzy', 'jump'])
    A[n] = await loadAnimation(n);

  const lobby = await packItem('map', 'lobby_platform'); lobby.position.y = -2.2; scene.add(lobby);
  const spawn = await packItem('map', 'spawn_location'); spawn.scale.set(0.5, 0.3, 0.5); spawn.position.copy(P.leo); scene.add(spawn);
  podium = await packItem('map', 'winners_podium'); podium.position.copy(PODIUM); podium.rotation.y = face(PODIUM, V(0, 0, 8)); scene.add(podium);
  for (const [x, z, sc] of [[-16, 6, 1], [15, -12, 0.9], [17, 9, 1.1]]) { const t = await packItem('map', 'tree_round'); t.position.set(x, 0, z); t.scale.setScalar(sc); scene.add(t); }
  for (let i = 0; i < 6; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 70 + r() * 60; isl.position.set(Math.cos(a) * d, -10 + r() * 25, Math.sin(a) * d); isl.scale.setScalar(0.8 + r()); scene.add(isl); }
  for (let i = 0; i < 40; i++) { const c = cloud(600 + i, 7 + r() * 9); const a = r() * Math.PI * 2, d = 90 + r() * 160; c.position.set(Math.cos(a) * d, -40 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 18; i++) { const c = cloud(800 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 80 + r() * 90; c.position.set(Math.cos(a) * d, 12 + r() * 30, Math.sin(a) * d); scene.add(c); }

  // Crowns: fitted per character (robloxPack.js fitAccessory, checked by web/fit_check.mjs); placed in world space so they can drop on.
  maxFit = await fitAccessory(max, 'crown_admin'); maxCrown = maxFit.item; scene.add(maxCrown);
  leoFit = await fitAccessory(leo, 'crown_admin'); leoCrown = leoFit.item; scene.add(leoCrown);

  // Jail cage: dark bars on a frame, one bar missing on the front (the gap Leo walks out of).
  cage = new THREE.Group();
  const bar = new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.35, metalness: 0.6 });
  const W = 4, H = 6.4;
  for (const y of [0.15, H - 0.15]) for (const [x, z, w, d] of [[0, -W / 2, W, 0.3], [0, W / 2, W, 0.3], [-W / 2, 0, 0.3, W], [W / 2, 0, 0.3, W]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), bar); b.position.set(x, y, z); b.castShadow = true; cage.add(b);
  }
  for (let i = 0; i <= 6; i++) {
    const u = -W / 2 + (i / 6) * W;
    for (const [x, z, side] of [[u, -W / 2, 'back'], [u, W / 2, 'front'], [-W / 2, u, 'l'], [W / 2, u, 'r']]) {
      if (side === 'front' && (i === 3 || i === 4)) continue;        // the gap
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, H, 10), bar); b.position.set(x, H / 2, z); b.castShadow = true; cage.add(b);
    }
  }
  scene.add(cage);
  // Ice block around frozen Leo.
  ice = new THREE.Group();
  const iceMat = new THREE.MeshPhysicalMaterial({ color: '#bfeaff', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 1, emissive: '#7fd4ff', emissiveIntensity: 0.15, depthWrite: false });
  const blk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 6.2, 2.8), iceMat); blk.position.y = 3.1; blk.renderOrder = 3; ice.add(blk);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(blk.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); edges.position.y = 3.1; ice.add(edges);
  scene.add(ice);
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 16; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, scale: 1, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const typing = (s) => CHAT.find((c) => c.typed && c.name === 'Max' && s >= c.typed[0] - 0.15 && s < c.typed[1] + 0.15) || (s >= 49.7 && s < 54.4);
const arc = (a, b, h, u) => a.clone().lerp(b, u).add(V(0, h * 4 * u * (1 - u), 0));

function maxState(s) {
  const b = st(P.max, face(P.max, V(1.5, 0, 14)), idle(s), 'smug');
  if (typing(s)) { b.layers = [[A.typing, s]]; b.face = s > 49 ? 'determined' : 'evil_grin'; b.rotY = face(P.max, V(0, 0, 14)); }
  else if (s < B.revenge) { b.layers = s > 0.6 ? [[A.scheming, s - 0.6]] : idle(s); b.face = s < 0.5 ? 'surprised' : 'evil_grin'; }
  else if (s < 4.66) { b.layers = [[A.scheming, s]]; b.face = 'evil_grin'; }
  else if (s < 10.1) { b.rotY = s > 7.2 ? face(P.max, V(0, 0, 14)) : face(P.max, P.leo); b.layers = s > 7.2 ? [[A.celebrate, s - 7.2]] : [[A.point_forward, s - 5.6]]; b.face = s > 7.2 ? 'laugh' : 'evil_grin'; }
  else if (s < 11.5) { b.rotY = face(P.max, P.leo); b.layers = [[A.shock, s - 10.1]]; b.face = 'shocked'; }
  else if (s < 18.2) { b.rotY = face(P.max, P.leo); b.layers = s > 16.8 ? [[A.facepalm, s - 16.8]] : s > 13.9 ? [[A.laugh_big, s]] : idle(s); b.face = s > 16.8 ? 'annoyed' : s > 13.9 ? 'laugh' : 'evil_grin'; }
  else if (s < 27.1) { b.rotY = s > B.laugh ? face(P.max, V(0, 0, 14)) : face(P.max, P.leo); b.layers = s > B.laugh ? [[A.laugh_big, s]] : s > 19.8 ? [[A.cheer, s - 19.8]] : idle(s); b.face = s > 19.8 ? 'laugh' : 'evil_grin'; }
  else if (s < 33.7) {
    const stompSpot = STOMP;
    b.rotY = face(P.max, P.leo);
    if (s > 28.6 && s < 30.4) { const u = easeInOut(inv(28.6, 29.3, s)); b.pos = P.max.clone().lerp(stompSpot, u); b.layers = s < 29.3 ? [[A.walk, s * 1.4]] : [[A.stomp, s - 29.3]]; b.face = 'angry'; }
    else if (s >= 30.4) { b.pos = stompSpot; b.rotY = face(stompSpot, P.leo); b.layers = s > 31.5 ? [[A.facepalm, s - 31.5]] : [[A.shock, s - 30.8]]; b.face = s > 31.5 ? 'annoyed' : 'shocked'; }
    else b.face = 'evil_grin';
  } else if (s < B.ten) {
    b.pos = STOMP.clone(); b.rotY = s < B.fling + 0.3 ? face(b.pos, P.leo) : face(b.pos, PODIUM);
    b.layers = s > 38.6 ? [[A.facepalm, s - 38.6]] : s > B.fling ? [[A.laugh_big, s]] : idle(s); b.face = s > 38.6 ? 'angry' : s > B.fling ? 'laugh' : 'evil_grin';
  } else if (s < 49.7) { b.pos = STOMP.clone(); b.rotY = face(b.pos, V(0, 0, 14)); b.layers = s > 42.3 ? [[A.scheming, s]] : [[A.shock, s - B.ten]]; b.face = s > 42.3 ? 'evil_grin' : 'shocked'; }
  else if (s < B.leoAdmin) {
    b.pos = STOMP.clone(); b.rotY = face(b.pos, V(0, 0, 14));
    if (s > 54.4) { b.layers = s > 56.9 ? [[A.defeated, s - 56.9]] : [[A.shock, s - 54.9]]; b.face = s > 56.9 ? 'sad' : 'shocked'; }
  } else { b.pos = STOMP.clone(); b.rotY = face(b.pos, PODIUM_TOP); b.layers = [[A.panic, s]]; b.face = 'scared'; }
  return b;
}

function leoState(s) {
  const b = st(P.leo, face(P.leo, V(-1, 0, 14)), idle(s, 0.3), 'scared');
  if (s < B.kick) { b.face = s < 1 ? 'happy' : 'scared'; b.layers = s > 1 ? [[A.panic, s]] : idle(s); }
  else if (s < B.rejoin) { b.visible = false; }
  else if (s < 11.5) { b.layers = [[A.wave, s - B.rejoin, 1, true]]; b.face = 'happy'; }
  else if (s < B.walkOut[0]) { b.layers = s > 13.9 ? [[A.shock, s - 13.9]] : idle(s); b.face = s > 13.9 ? 'surprised' : 'happy'; }
  else if (s < 18.2) {
    const out = P.leo.clone().add(V(0, 0, 3.2)), u = easeInOut(inv(...B.walkOut, s));
    b.pos = P.leo.clone().lerp(out, u); b.rotY = face(P.leo, V(P.leo.x, 0, 14));
    b.layers = s < B.walkOut[1] ? [[A.walk, s]] : [[A.proud, s - B.walkOut[1]]]; b.face = 'smug';
  } else if (s < B.shatter) {
    b.pos = P.leo.clone().add(V(0, 0, 3.2)); b.rotY = face(P.leo, V(P.leo.x, 0, 14));
    b.layers = s < B.ice[0] ? idle(s) : [[A.shock, 0.3]]; b.face = s < B.ice[0] ? 'smug' : 'shocked';
  } else if (s < 29.9) {
    b.pos = P.leo.clone().add(V(0, 0, 3.2)); b.rotY = face(b.pos, P.max.clone().add(V(-1, 0, 0)));
    b.scale = lerp(1, 0.22, easeOutBack(inv(...B.tiny, s), 2)); b.layers = [[A.panic, s]]; b.face = 'scared';
    if (s > B.stomp) b.squash = Math.max(0.08, 1 - easeIn(inv(B.stomp, B.stomp + 0.12, s)));
    b.visible = s < B.stomp + 0.35;
  } else if (s < B.respawn) { b.visible = false; }
  else if (s < B.fling) {
    b.scale = easeOutBack(clamp((s - B.respawn) / 0.3), 2); b.rotY = face(P.leo, V(-1, 0, 14));
    b.layers = s > B.wave ? [[A.wave, s - B.wave, 1, true]] : [[A.proud, s - B.respawn]]; b.face = 'smug';
  } else if (s < B.land) {
    const u = inv(B.fling, B.land, s); b.grounded = false;
    b.pos = arc(P.leo, PODIUM_TOP, 22, easeInOut(u)); b.pos.y += 1.2 * (1 - u);
    b.rotX = u * 10; b.rotZ = Math.sin(u * 9) * 0.5; b.layers = [[A.fly, 0.2]]; b.face = 'shocked';
  } else if (s < B.leoAdmin) {
    b.pos = PODIUM_TOP.clone(); b.floor = 3; b.rotY = face(PODIUM, V(0, 0, 8));
    if (s > B.bow && s < B.bow + 1.1) { b.layers = idle(s); b.bow = Math.sin(Math.PI * inv(B.bow, B.bow + 1.1, s)) * 0.6; b.face = 'happy'; }
    else { b.layers = s > 59.3 ? [[A.wave, s - 59.3, 1, true]] : [[A.celebrate, s]]; b.face = s > 59.3 ? 'smug' : 'laugh'; }
  } else {
    b.pos = PODIUM_TOP.clone(); b.floor = 3; b.rotY = face(PODIUM, V(0, 0, 8));
    b.layers = s > 63.4 ? [[A.typing, s]] : [[A.scheming, s]]; b.face = 'evil_grin';
  }
  return b;
}

function miaState(s) {
  const b = st(P.mia, face(P.mia, P.leo), idle(s, 0.6), 'neutral');
  const seat = P.leo.clone().add(V(-0.2, 4.2, 4.0)), beside = P.leo.clone().add(V(-2.3, 0, 4.2));
  if (s > 21.0 && s < B.shatter) {
    const u = easeInOut(inv(21.0, 22.35, s));
    b.pos = P.mia.clone().lerp(beside, u);
    b.rotY = face(P.mia, beside);
    b.layers = s < 22.35 ? [[A.walk, s]] : [[A.jump, s - 22.35]];
    if (s > 22.35) {      // hop up onto the ice block
      const k = inv(22.35, B.sit, s); b.grounded = false; b.pos = arc(beside, seat, 2.2, easeInOut(k)); b.rotY = lerp(face(P.mia, beside), 0, k);
    }
    if (s > B.sit) {
      // Sitting on the front edge of the ice block, facing the camera, Roblox sit animation.
      b.pos = seat.clone(); b.rotY = 0; b.layers = [[A.sit, s]]; b.grounded = false;
    }
    b.face = s > B.sit ? 'smug' : 'neutral';
  } else if (s >= B.shatter) { b.pos = V(-7, 0, 4.5); b.rotY = face(b.pos, V(0, 0, 0)); b.layers = s > 54.9 && s < 60 ? [[A.laugh_big, s]] : idle(s); b.face = s > 54.9 && s < 60 ? 'laugh' : 'annoyed'; }
  return b;
}

function noobState(s) { return st(P.noob, face(P.noob, V(0, 0, 14)), idle(s, 0.9), 'happy'); }

function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6 * (x.scale || 1), 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  a.root.scale.set(x.scale, x.scale * (x.squash || 1), x.scale);
  robloxPose(a, x.layers);
  if (x.bow) { a.bones.Root.rotateX(x.bow); }                 // a stiff R6 bow from the hips down
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 24); }
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
// frame(): orbit at the distance that makes the visible width (portrait 9:16) equal `w` world units.
function frame(stage, tg, az, el, w, fov = 40) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);

export function samples(t) { return (t > B.fling && t < B.land) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

let SHOT = 'hook';
export function update(t, stage) {
  const s = t;
  place(max, maxState(s)); place(leo, leoState(s)); place(mia, miaState(s)); place(noob, noobState(s));
  cam = stage.camera;

  // Crowns: Max's drops on at the start and pops off when his admin runs out; Leo's drops on next round.
  const mh = head(max), lh = head(leo);
  maxCrown.visible = s < 55.8;
  if (s < 53.25) {
    const drop = easeOutBack(inv(...B.crown, s), 1.2), q = max.bones.Head.getWorldQuaternion(new THREE.Quaternion());
    maxCrown.quaternion.copy(q); maxCrown.scale.setScalar(maxFit.scale);
    maxCrown.position.copy(max.bones.Head.localToWorld(maxFit.offset.clone())).add(V(0, 5 * (1 - drop), 0));
  } else {
    const u = s - 53.25; maxCrown.position.copy(mh).add(V(u * 2, 1.2 + 7 * u - 4 * u * u, 0)); maxCrown.rotation.set(u * 5, u * 3, u * 2);
    maxCrown.scale.setScalar(maxFit.scale * (1 - inv(2.1, 2.5, u)));
  }
  leoCrown.visible = s > B.leoAdmin - 0.6;
  if (leoCrown.visible) {
    const drop = easeOutBack(inv(B.leoAdmin - 0.6, B.leoAdmin, s), 1.2), q = leo.bones.Head.getWorldQuaternion(new THREE.Quaternion());
    leoCrown.quaternion.copy(q); leoCrown.scale.setScalar(leoFit.scale);
    leoCrown.position.copy(leo.bones.Head.localToWorld(leoFit.offset.clone())).add(V(0, 5 * (1 - drop), 0));
  }

  // Cage drops on Leo; stays until the freeze. Ice forms, shatters on :tiny.
  cage.visible = s > B.cageDrop[0] && s < 18.3;
  cage.position.set(P.leo.x, 14 * (1 - easeIn(inv(...B.cageDrop, s))), P.leo.z);
  ice.visible = s > B.ice[0] && s < B.shatter;
  ice.position.copy(P.leo).add(V(0, 0, 3.2)); ice.scale.setScalar(easeOutBack(inv(...B.ice, s), 1.6) || 0.001);

  // Respawn ForceField.
  const fa = s - B.respawn; ff.visible = fa > 0 && fa < 2.2;
  if (ff.visible) { ff.position.copy(P.leo).add(V(0, 2.9, 0)); ff.scale.setScalar(3.6 * easeOutBack(clamp(fa / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(1.7, 2.2, fa); ff.material.uniforms.time.value = t; }

  // Puffs: kick, shatter, stomp, landing.
  const events = [[B.kick, P.leo.clone().add(V(0, 2.5, 0)), 1.2], [B.shatter, P.leo.clone().add(V(0, 3, 3.2)), 1.5], [B.stomp + 0.1, P.leo.clone().add(V(0, 0.4, 3.2)), 0.8], [B.land, PODIUM_TOP.clone().add(V(0, 0.4, 0)), 1.0], [B.cageDrop[1], P.leo.clone().add(V(0, 0.3, 0)), 1.2]];
  let ev = null; for (const e of events) if (s >= e[0] && s < e[0] + 0.9) ev = e;
  puffs.forEach((p, i) => {
    p.visible = !!ev; if (!ev) return;
    const [at, c, size] = ev, u = (s - at) / 0.9, a = i * 0.39;
    p.position.set(c.x + Math.cos(a) * size * 1.8 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.5 + u * size * 0.6, c.z + Math.sin(a) * size * 1.8 * easeOut(u));
    p.scale.setScalar(size * (0.35 + 0.55 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
    p.material.color.set(at === B.shatter ? '#d6f3ff' : '#ffffff');
  });
  // Sparkles: crown landings and the podium.
  const sparkAt = [[0.45, mh.clone().add(V(0, 0.6, 0))], [B.land, PODIUM_TOP.clone().add(V(0, 3, 0))], [B.leoAdmin, lh.clone().add(V(0, 0.6, 0))]];
  let sp = null; for (const e of sparkAt) if (s >= e[0] && s < e[0] + 1) sp = e;
  sparkles.forEach((m, i) => {
    m.visible = !!sp; if (!sp) return;
    const u = s - sp[0], a = i * 2.39996;
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (0.8 + 2.5 * u), (i % 6) * 0.35 + u * 1.5, Math.sin(a + u * 3) * (0.8 + 2.5 * u)));
    m.scale.setScalar(1.2 * (1 - u)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const xh = head(max), lhh = head(leo), ih = head(mia);
  const two = V((P.max.x + P.leo.x) / 2, 3, 0.8);
  stage.bloom.strength = 0.3;
  const F = (a) => face(a.root.position, V(a.root.position.x * 0.5, 0, 14));         // toward the camera side
  switch (shot.id) {
    case 'hook': frame(stage, V(lerp(-0.6, -0.9, u), 3.4, 1.0), -0.12, 0.06, lerp(10.5, 9, easeOut(u)), 40); break;   // Max + crown front, Leo behind
    case 'revenge': frame(stage, xh.clone().add(V(0, 0.3, 0)), F(max) + 0.2, 0.05, lerp(5, 4.4, u), 34); break;
    case 'kickType': case 'jailType': case 'freezeType': case 'tinyType': case 'flingType': frame(stage, xh.clone().add(V(0.3, -0.3, 0)), F(max) + 0.35, 0.1, 6, 38); break;
    case 'kickGone': frame(stage, V(0.5, 3.4, 0.8), 0, 0.08, 9.5, 42); break;
    case 'maxCheer': frame(stage, xh.clone().add(V(0, -0.6, 0)), F(max), 0.08, 7, 38); break;
    case 'rejoin': frame(stage, lhh.clone().add(V(0, -0.6, 0)), F(leo), 0.08, lerp(7.5, 6.5, u), 38); break;
    case 'cage': frame(stage, V(P.leo.x, 3.3, P.leo.z), -0.1, 0.12, 8, 42); break;
    case 'walkOut': frame(stage, V(P.leo.x, 3.1, lerp(1.2, 2.6, u)), 0.15, 0.1, 8.5, 42); break;
    case 'ice': frame(stage, V(P.leo.x, 3.2, 3.4), -0.15, 0.1, 7.5, 40); break;
    case 'chair': frame(stage, V(P.leo.x - 0.6, 6.4, 3.6), -0.2, 0.1, 9, 42); break;
    case 'laugh': frame(stage, xh.clone().add(V(0, -0.5, 0)), F(max) - 0.2, 0.08, 7, 40); break;
    case 'tiny': frame(stage, V(P.leo.x - 0.5, lerp(2.4, 1.1, easeOut(clamp(u * 3))), 3.4), -0.1, 0.14, lerp(6, 3.6, easeOut(clamp(u * 3))), 42); break;
    case 'stomp': frame(stage, V(2.5, 2.6, 3.5), 0.9, 0.1, 8, 42); break;
    case 'respawn': frame(stage, V(P.leo.x, 3.0, P.leo.z), 0.95, 0.1, lerp(8, 7, u), 42); break;
    case 'flight': { const p = leo.bones.Torso.localToWorld(V(0, 1, 0)); look(stage, p.clone().add(V(10, 4, 15)), p.clone().add(V(-1.5, 0.5, 0)), 48); stage.aimSun(p.clone().setY(0), 34); break; }
    case 'podium': frame(stage, PODIUM_TOP.clone().add(V(0, 2.2, 0)), face(PODIUM, V(0, 0, 8)) + 0.15, 0.12, lerp(11, 9, u), 42); break;
    case 'ten': frame(stage, xh.clone().add(V(0, -0.4, 0)), F(max), 0.05, lerp(7, 6, u), 36); break;
    case 'drama': frame(stage, xh.clone().add(V(0, 0.3, 0)), F(max) + 0.1, -0.05, lerp(6, 4, easeIn(u)), 34); break;
    case 'banSlam': frame(stage, xh.clone().add(V(0, 0.4, 0)).add(jolt(t, 0.08)), F(max), -0.05, 4, 34); break;
    case 'typing': frame(stage, xh.clone().add(V(0, -0.7, 0)), F(max) - 0.25, 0.12, 6.5, 38); break;
    case 'denied': frame(stage, xh.clone().add(V(0, 0.0, 0)), F(max), 0.05, 5.5, 36); break;
    case 'roundOver': frame(stage, xh.clone().add(V(0, -0.8, 0)), F(max) + 0.3, 0.12, lerp(7.5, 9, u), 38); break;
    case 'stillHere': frame(stage, PODIUM_TOP.clone().add(V(0, 2.2, 0)), face(PODIUM, V(0, 0, 8)), 0.1, 9, 40); break;
    case 'nextRound': frame(stage, lhh.clone().add(V(0, 0.2, 0)), face(PODIUM, V(0, 0, 8)), 0.06, lerp(8, 5, easeInOut(u)), 36); break;
    default: frame(stage, lhh.clone().add(V(0, -0.8, 0)), face(PODIUM, V(0, 0, 8)) - 0.15, 0.06, 7, 36);  // CTA: Leo with the crown, typing
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
function adminHud(g, s, who, secs, t, { grey = false, flashing = false } = {}) {
  const txt = `${who} ADMIN 0:${String(Math.max(0, Math.ceil(secs))).padStart(2, '0')}`;
  g.save(); g.font = `${50 * s}px "Luckiest Guy"`;
  const w = g.measureText(txt).width + 140 * s, h = 90 * s, x = 60 * s, y = 250 * s;
  roundRect(g, x, y, w, h, 26 * s);
  g.fillStyle = grey ? 'rgba(70,70,80,.9)' : flashing && Math.floor(t * 4) % 2 ? 'rgba(220,40,60,.92)' : 'rgba(21,36,53,.86)'; g.fill();
  g.lineWidth = 5 * s; g.strokeStyle = grey ? '#9a9aa5' : '#FFC83D'; g.stroke();
  if (!grey) drawCrown(g, x + 58 * s, y + 46 * s, 33 * s);
  g.fillStyle = grey ? '#d0d0d8' : '#FFE7A0'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(txt, x + (grey ? 34 : 104) * s, y + 50 * s);
  g.restore();
  return w / s + 60;
}
function partTag(g, s, x) {
  g.save(); g.font = `${42 * s}px "Luckiest Guy"`; const w = g.measureText('PART 2').width + 40 * s, h = 70 * s;
  roundRect(g, x * s, 260 * s, w, h, 20 * s); g.fillStyle = '#FFD23F'; g.fill(); g.fillStyle = '#152435'; g.textBaseline = 'middle'; g.fillText('PART 2', x * s + 20 * s, 297 * s); g.restore();
}
function chatBox(g, s, t, { x = 60, y = 370, w = 820, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => t >= l.at).slice(-rows);
  const ty = CHAT.find((l) => l.typed && t >= l.typed[0] - 0.1 && t < l.typed[1] + 0.1);
  const banTyping = t >= 49.7 && t < 54.3 ? banText(t) : null;
  const n = shown.length + (ty || banTyping !== null ? 1 : 0); if (!n) return;
  g.save();
  const lh = 50 * s, pad = 20 * s, h = pad * 2 + n * lh + 8 * s;
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${31 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2;
  for (const l of shown) {
    g.globalAlpha = clamp((t - l.at) / 0.12);
    const tag = `[${l.name}]: `; g.fillStyle = l.name === 'Server' ? SERVER : C[l.name]; g.fillText(tag, x * s + pad, yy);
    g.fillStyle = l.red ? '#ff6b7a' : l.name === 'Server' ? '#FFE9A8' : '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy); yy += lh;
  }
  g.globalAlpha = 1;
  const typingText = ty ? ty.text.slice(0, Math.floor(clamp((t - ty.typed[0]) / (ty.typed[1] - ty.typed[0])) * ty.text.length)) : banTyping;
  if (typingText !== null && typingText !== undefined) {
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
    g.fillStyle = '#ffffff'; g.fillText(typingText, x * s + pad * 1.2, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0) g.fillRect(x * s + pad * 1.2 + g.measureText(typingText).width + 4 * s, yy - 14 * s, 4 * s, 36 * s);
  }
  g.restore();
}

export function overlay(g, s, t) {
  // HUD: Max's admin clock until it runs out (grey after), Leo's from next round.
  let hudW = 0;
  if (t < B.leoAdmin) hudW = adminHud(g, s, 'MAX', t < 53.25 ? clock(t) : 0, t, { grey: t >= 53.25, flashing: t >= B.ten });
  else hudW = adminHud(g, s, 'LEO', 60, t);
  partTag(g, s, hudW + 20);
  if (t < B.cta) chatBox(g, s, t);

  // Command cards ("COMMAND ONE" ...) as each one is typed.
  for (const [at, n] of [[4.66, 'ONE'], [11.55, 'TWO'], [18.29, 'THREE'], [27.13, 'FOUR'], [33.73, 'FIVE']]) {
    const a = t - at; if (a < 0 || a > 1.3) continue;
    bigText(g, s, `COMMAND ${n}`, 540, 700, 92, '#FFD23F', { k: easeOutBack(clamp(a / 0.2), 2.4), alpha: 1 - inv(1.05, 1.3, a) });
  }
  // Payoff words.
  for (const [at, word, y, col] of [[B.kick, 'KICKED!', 820, '#ff6b7a'], [B.rejoin + 0.1, 'REJOINED', 820, '#8BE36B'], [B.cageDrop[1], 'CLANK!', 820, '#e8f4ff'], [B.ice[1], 'FROZEN!', 820, '#9fe3ff'], [B.stomp, 'STOMP!', 860, '#ffffff'], [B.land, 'PERFECT LANDING', 800, '#FFD23F'], [B.ban, 'BAN', 760, '#ff4d5e']]) {
    const a = t - at; if (a < 0 || a > 0.9) continue;
    bigText(g, s, word, 540, y, word === 'BAN' ? 220 : 110, col, { k: easeOutBack(clamp(a / 0.15), 3), alpha: 1 - inv(0.7, 0.9, a), rot: -0.08 });
  }
  // Timer gag while Max laughs: the clock drains in big numbers.
  if (t > B.laugh && t < 27.0) { const a = t - B.laugh; bigText(g, s, `0:${String(Math.ceil(clock(t))).padStart(2, '0')}`, 540, 760, 150, '#ff6b7a', { k: 1 + 0.06 * Math.sin(t * 10), alpha: clamp(a / 0.3) }); }
  // Ten seconds left.
  if (t > B.ten && t < 44.2) bigText(g, s, '10 SECONDS LEFT', 540, 740, 86, '#ff4d5e', { k: easeOutBack(clamp((t - B.ten) / 0.2), 2.4) });

  // The ban: big typing box and the clock side by side.
  if (t >= 49.7 && t < 54.9) {
    g.save(); roundRect(g, 120 * s, 700 * s, 840 * s, 170 * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.85)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.font = `800 ${92 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; const txt = banText(t);
    g.fillText(txt, 170 * s, 790 * s); if (Math.floor(t * 4) % 2 === 0) g.fillRect(170 * s + g.measureText(txt).width + 8 * s, 735 * s, 8 * s, 110 * s); g.restore();
    const left = Math.max(0, Math.ceil(clock(t))); bigText(g, s, `0:0${left}`, 540, 990, 130, left > 0 ? '#ffffff' : '#ff4d5e', { k: 1 + 0.05 * Math.sin(t * 12) });
    if (t > B.enter) bigText(g, s, 'ENTER', 540, 1110, 90, '#8BE36B', { k: easeOutBack(clamp((t - B.enter) / 0.15), 3) });
  }
  if (t >= B.denied && t < 56.9) bigText(g, s, 'YOU ARE NOT AN ADMIN', 540, 760, 74, '#ff4d5e', { k: easeOutBack(clamp((t - B.denied) / 0.2), 2.4) });
  if (t >= B.roundOver && t < 59.3) { bigText(g, s, 'ROUND OVER', 540, 700, 118, '#FFD23F', { k: easeOutBack(clamp((t - B.roundOver) / 0.25), 2) }); if (t > 57.9) bigText(g, s, '1 SECOND TOO LATE', 540, 830, 76, '#ff4d5e', { k: easeOutBack(clamp((t - 57.9) / 0.2), 2.4) }); }
  if (t >= 61.0 && t < B.leoAdmin) bigText(g, s, 'NEXT ROUND...', 540, 740, 104, '#ffffff', { alpha: clamp((t - 61) / 0.3) });

  // Call to action end card.
  if (t >= B.cta) {
    const a = t - B.cta, k = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k, k);
    roundRect(g, -400 * s, -190 * s, 800 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    // Follow button.
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'PART 3 IS COMING', 540, 520, 76, '#FFD23F', { k });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k });
  }
  flash(g, s, t >= 53.25 && t < 53.5 ? 0.35 * (1 - (t - 53.25) / 0.25) : 0, '#ff3344');
  if (SHOT === 'flight') speedLines(g, s, t, 0.45, { cx: 540, cy: 1000 });
}
