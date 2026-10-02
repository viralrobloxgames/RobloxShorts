// The Noob Has Admin (Part 4), web renderer + Roblox R6 pack. Beat times come from web/beats.js (source/beats.py:
// the narration's word timings, or an estimate until the narration exists), so the clip retimes itself.
// The AFK noob gets admin and is a pro: counters everyone's signature move, a 4-command combo, dodges a charge. Mia never
// moves all round; Leo pokes her and she falls like a plank; the noob types gg and it posts under Mia's name: he's her alt.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, fitAccessory } from '../../../web/lib/robloxPack.js';
import { panicArms } from '../../../web/lib/gestures.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.55) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Noob Has Admin' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- layout ----------
const N0 = V(0, 0, 2.0), N_SAFE = V(2.2, 0, -6.2), LEO0 = V(-4.2, 0, 0.4), MAX0 = V(4.2, 0, 0.4);
const MIA = V(7.6, 0, -4.6), SPAWN = V(-6, 0, -6), FLUNG = V(-46, 34, -70);
const POKE = MIA.clone().add(V(-2.5, 0, 0.2));                   // where Leo stands to poke her: 2.5 to her left, so only the finger reaches
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const CAM = V(0, 0, 14);
// Derived beats.
const B = {
  wake: W.moved - 0.15, flung: [W.fling + 0.1, W.fling + 2.3], grow: [W.giant + 0.05, W.giant + 1.0], shrink: [W.tiny + 0.35, W.tiny + 0.75],
  hairIn: W.invisible - 0.25, fireOn: W.fire + 0.1, reset: W.freeze - 0.22, combo: [W.freeze, W.spin, W.sit, W.dance],
  charge: [W.charged + 0.1, W.intoEach + 0.05], zip: [W.speed + 0.05, W.speed + 0.35], bonk: W.intoEach + 0.05,
  getUp: W.ten - 0.5, walk: [W.walked - 0.1, W.poked - 0.25], poke: W.poked, fall: [W.fell, W.fell + 0.55],
  ggType: [W.gg - 0.9, W.gg - 0.15], ggPost: W.gg + 0.1, alt: W.alt, shades: W.partThree - 0.2, cta: W.follow,
};
// The round clock: 1:00 -> 0:10 on "ten seconds left" -> 0:00 as the gg posts.
const clock = track([[0, 60, (u) => u], [W.ten, 10, (u) => u], [B.ggPost, 0, (u) => u]]);

const SHOTS = [
  [0, 'hook'], [W.leoLaughed - 0.2, 'leoType'], [W.typedFaster - 0.1, 'noobType'], [W.fling - 0.05, 'fling'], [W.gone + 0.7, 'smug'],
  [W.maxTried - 0.2, 'maxType'], [W.giant + 0.25, 'grow'], [W.shrank - 0.6, 'tiny'], [W.invisible - 0.35, 'hairBack'],
  [W.fire - 0.2, 'fire'], [W.freeze - 0.3, 'combo1'], [W.spin - 0.05, 'combo2'], [W.sit - 0.05, 'combo1'], [W.dance - 0.05, 'combo2'],
  [W.fourCmds + 0.4, 'combo1'], [W.charged - 0.2, 'charge'], [W.speed - 0.15, 'speed'], [W.intoEach - 0.55, 'collide'],
  [W.andMia - 0.2, 'mia'], [W.ten - 0.3, 'walk'], [W.poked - 0.45, 'poke'], [W.gg - 1.0, 'gg'], [W.popped - 0.3, 'chat'],
  [W.alt - 0.3, 'alt'], [W.partThree - 0.3, 'flashback'], [W.follow - 0.1, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD', Mia: '#C9A6FF', noob: '#F5CD30' };
const typed = (name, text, from, to, at = to + 0.06, upto = 1) => ({ name, text, typed: [from, to], at, upto });
const CHAT = [
  { name: 'Server', text: 'noob won ADMIN for 1 round!', at: -1 },
  { name: 'Server', text: '1 round = 60 seconds.', at: 0.7 },
  typed('Leo', ':kick noob', W.kick - 0.35, W.gone + 0.2, 1e9, 0.75),               // never finished
  { name: 'noob', text: ':fling leo', at: W.fling },
  typed('Max', ':giant me', W.giant - 0.7, W.giant - 0.02),
  { name: 'noob', text: ':tiny max', at: W.tiny + 0.3 },
  typed('Leo', ':invisible me', W.invisible - 0.9, W.invisible - 0.25),
  { name: 'noob', text: ':fire leo', at: W.fire },
  { name: 'noob', text: ':freeze all', at: W.freeze },
  { name: 'noob', text: ':spin all', at: W.spin },
  { name: 'noob', text: ':sit all', at: W.sit },
  { name: 'noob', text: ':dance all', at: W.dance },
  { name: 'noob', text: ':speed me', at: W.speed },
  { name: 'Mia', text: 'gg', at: B.ggPost },                                          // ...from the wrong account
];
// The noob's own commands, typed fast in the big box at the bottom just before each one lands.
const NOOB_CMDS = [[':fling leo', W.fling], [':tiny max', W.tiny + 0.3], [':fire leo', W.fire], [':freeze all', W.freeze], [':spin all', W.spin], [':sit all', W.sit], [':dance all', W.dance], [':speed me', W.speed], ['gg', B.ggType[1]]];

// ---------- scene ----------
let A = {}, leo, max, mia, noob, cam, ff, SHOT = 'hook', clockT = 0;
const crowns = {}, puffs = [], sparkles = [], stars = [], flames = [], smoke = [], ices = [];

export async function setup(stage) {
  const { scene } = stage; const r = rng(71);
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'sleeping', 'blink', 'knocked_out', 'suspicious', 'confused', 'wink'];
  [leo, max, mia, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (const n of ['idle', 'scheming', 'typing', 'walk', 'run', 'shock', 'fall', 'dance2', 'sit', 'laugh_big', 'point_forward', 'proud', 'facepalm'])
    A[n] = await loadAnimation(n);

  const lobby = await packItem('map', 'lobby_platform'); lobby.position.y = -2.2; scene.add(lobby);
  const spawn = await packItem('map', 'spawn_location'); spawn.scale.set(0.5, 0.3, 0.5); spawn.position.copy(SPAWN); scene.add(spawn);
  for (const [x, z, sc] of [[-17, 7, 1], [16, -13, 0.9], [18, 9, 1.1], [-15, -15, 1]]) { const t = await packItem('map', 'tree_round'); t.position.set(x, 0, z); t.scale.setScalar(sc); scene.add(t); }
  for (let i = 0; i < 6; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 80 + r() * 60; isl.position.set(Math.cos(a) * d, -10 + r() * 25, Math.sin(a) * d); isl.scale.setScalar(0.8 + r()); scene.add(isl); }
  for (let i = 0; i < 40; i++) { const c = cloud(600 + i, 7 + r() * 9); const a = r() * Math.PI * 2, d = 90 + r() * 160; c.position.set(Math.cos(a) * d, -40 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 22; i++) { const c = cloud(800 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 70 + r() * 90; c.position.set(Math.cos(a) * d, 14 + r() * 40, Math.sin(a) * d); scene.add(c); }

  // Crowns (fitted, checked by web/fit_check.mjs): the noob's and Mia's, carried over from Part 3.
  for (const a of [noob, mia]) { const fit = await fitAccessory(a, 'crown_admin'); crowns[a.name] = fit; scene.add(fit.item); }

  // Fire on Leo's floating hair: flickering additive cones + smoke.
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 10), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ff9a2e' : '#ffd23f', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    f.renderOrder = 6; scene.add(f); flames.push(f);
  }
  for (let i = 0; i < 10; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#5d6068'); p.material.emissive.set('#1c1c1c'); scene.add(p); smoke.push(p); }
  // Ice blocks for ":freeze all".
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    const iceMat = new THREE.MeshPhysicalMaterial({ color: '#bfeaff', roughness: 0.08, transparent: true, opacity: 0.55, clearcoat: 1, emissive: '#7fd4ff', emissiveIntensity: 0.15, depthWrite: false });
    const blk = new THREE.Mesh(new THREE.BoxGeometry(4.6, 6.0, 2.4), iceMat); blk.position.y = 3.0; blk.renderOrder = 3; g.add(blk);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(blk.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); edges.position.y = 3.0; g.add(edges);
    scene.add(g); ices.push(g);
  }
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 18; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
  for (let i = 0; i < 10; i++) {   // dizzy stars over the two boys after the bonk
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: '#fff27a' }));
    scene.add(s); stars.push(s);
  }
}

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, scale: 1, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const arc = (a, b, h, u) => a.clone().lerp(b, u).add(V(0, h * 4 * u * (1 - u), 0));
const typingNow = (name, s) => CHAT.some((c) => c.typed && c.name === name && s >= c.typed[0] - 0.1 && s < c.typed[1] + 0.05);
const noobTyping = (s) => NOOB_CMDS.some(([, at]) => s > at - 0.55 && s < at + 0.05);
const combo = (s) => (s < B.combo[0] ? -1 : s < B.combo[1] ? 0 : s < B.combo[2] ? 1 : s < B.combo[3] ? 2 : s < W.charged ? 3 : -1);
const meet = (side) => N0.clone().add(V(side * 0.6, 0, 0));          // where the charging boys collide

function comboState(b, s, who, home) {   // the four-command combo, applied to both boys
  const k = combo(s); if (k < 0) return false;
  b.pos = home.clone(); b.rotY = face(home, CAM);
  if (k === 0) { b.layers = [[A.shock, 0.3]]; b.face = 'shocked'; }
  if (k === 1) { b.layers = [[A.shock, 0.3]]; b.face = 'dizzy'; b.rotY += (s - B.combo[1]) * 14; }
  if (k === 2) { b.layers = [[A.sit, s]]; b.grounded = false; b.pos.y = -1.45; b.face = 'annoyed'; }
  if (k === 3) { b.layers = [[A.dance2, s - B.combo[3], 1, true]]; b.face = who === 'leo' ? 'annoyed' : 'angry'; }
  return true;
}

function noobState(s) {
  const b = st(N0, face(N0, CAM), idle(s, 1.3), 'sleeping');
  if (s > B.wake) { b.face = s < B.wake + 0.2 ? 'blink' : 'determined'; b.layers = s < B.wake + 1.4 ? [[A.scheming, s - B.wake]] : idle(s); }
  if (noobTyping(s) || (s > B.combo[0] - 0.3 && s < W.charged)) { b.layers = [[A.typing, s * 2.2]]; b.face = 'determined'; }
  if (s > B.combo[0] && s < W.charged) b.face = 'smug';
  if (s > B.zip[0]) {                         // zips out of the way, then stays put
    b.pos = N0.clone().lerp(N_SAFE, easeOut(inv(...B.zip, s))); b.rotY = face(N_SAFE, CAM); b.face = 'smug';
    b.layers = s < B.zip[1] ? [[A.run, s * 3]] : noobTyping(s) ? [[A.typing, s * 2.2]] : idle(s);
  }
  if (s > B.ggPost) { b.face = s > W.wholeTime ? 'wink' : 'surprised'; b.layers = s > B.shades ? [[A.proud, s - B.shades]] : idle(s); }
  if (s > B.shades) b.face = 'cool';
  return b;
}

function leoState(s) {
  const b = st(LEO0, face(LEO0, CAM), idle(s, 0.3), 'smug');
  if (s < B.flung[0]) {
    if (s > W.leoLaughed - 0.1) { b.layers = typingNow('Leo', s) ? [[A.typing, s]] : [[A.laugh_big, s]]; b.face = s > W.typedFaster ? 'surprised' : 'laugh'; }
  } else if (s < B.flung[1]) {
    const u = inv(...B.flung, s); b.grounded = false; b.pos = arc(LEO0, FLUNG, 10, easeIn(u)); b.layers = [[A.fall, 0.2]]; b.gesture = 'panic'; b.face = 'scared'; b.rotX = u * 8; b.rotZ = u * 3;
  } else if (s < B.hairIn) { b.visible = false; }
  else if (s < B.reset) {
    // Back invisible (hair only) at the spawn; types; then the hair catches fire and runs in circles.
    b.invisible = true; b.pos = SPAWN.clone(); b.rotY = face(SPAWN, CAM); b.face = 'evil_grin';
    b.layers = typingNow('Leo', s) ? [[A.typing, s]] : idle(s);
    if (s > B.fireOn) {
      const a = (s - B.fireOn) * 3.4; b.pos = SPAWN.clone().add(V(Math.sin(a) * 2.6, 0, Math.cos(a) * 2.6 - 2.6));
      b.rotY = a + Math.PI / 2; b.layers = [[A.run, s * 1.6]]; b.gesture = 'panic'; b.face = 'scared';
    }
  } else if (s < B.combo[0]) { b.layers = idle(s); b.face = 'annoyed'; }                 // back (ForceField) just before the combo
  else if (comboState(b, s, 'leo', LEO0)) { /* combo */ }
  else if (s < B.bonk) {
    const u = inv(...B.charge, s); b.pos = LEO0.clone().lerp(meet(-1), easeIn(u)); b.rotY = face(LEO0, N0); b.layers = [[A.run, s * 1.5]]; b.face = s > W.speed ? 'shocked' : 'angry';
  } else if (s < B.getUp) {
    b.pos = meet(-1).add(V(-0.6, 0, 0)); b.rotY = face(LEO0, N0); b.layers = idle(s); b.face = 'knocked_out'; b.fallBack = easeOut(inv(B.bonk, B.bonk + 0.35, s)); b.grounded = false;
  } else {
    const from = meet(-1).add(V(-0.6, 0, 0)), u = easeInOut(inv(...B.walk, s));
    b.pos = from.clone().lerp(POKE, u); b.rotY = s < B.walk[0] ? face(from, MIA) : face(from, POKE);
    b.layers = s > B.walk[0] && s < B.walk[1] ? [[A.walk, s]] : idle(s); b.face = 'suspicious';
    if (s > B.walk[1]) { b.rotY = face(POKE, MIA); b.layers = s < B.poke + 0.7 && s > B.poke - 0.25 ? [[A.point_forward, s - B.poke + 0.25]] : idle(s); b.face = s > B.fall[0] ? 'shocked' : 'suspicious'; }
    if (s > B.ggPost) { b.pos = POKE.clone().add(V(0.4, 0, 4.2 * easeOut(inv(B.ggPost, B.ggPost + 0.5, s)))); b.rotY = face(b.pos, N_SAFE); b.face = s > B.alt ? 'angry' : 'shocked'; }   // stumbles back
  }
  return b;
}

function maxState(s) {
  const b = st(MAX0, face(MAX0, CAM), idle(s, 0.6), 'smug');
  if (s < W.maxTried - 0.3) { b.face = s > B.flung[0] ? 'shocked' : 'smug'; b.rotY = s > B.flung[0] && s < B.flung[0] + 1.5 ? face(MAX0, LEO0) : face(MAX0, CAM); }
  else if (s < B.reset) {
    b.layers = typingNow('Max', s) ? [[A.typing, s]] : idle(s); b.face = s < B.shrink[0] ? 'evil_grin' : 'shocked';
    b.scale = s < B.shrink[0] ? lerp(1, 2.6, easeOut(inv(...B.grow, s))) : lerp(lerp(1, 2.6, easeOut(inv(...B.grow, B.shrink[0]))), 0.28, easeOutBack(inv(...B.shrink, s), 1.6));
    if (s > B.shrink[1]) b.gesture = 'panic';
  } else if (s < B.combo[0]) { b.layers = idle(s); b.face = 'annoyed'; }
  else if (comboState(b, s, 'max', MAX0)) { /* combo */ }
  else if (s < B.bonk) {
    const u = inv(...B.charge, s); b.pos = MAX0.clone().lerp(meet(1), easeIn(u)); b.rotY = face(MAX0, N0); b.layers = [[A.run, s * 1.5 + 0.3]]; b.face = s > W.speed ? 'shocked' : 'angry';
  } else {
    b.pos = meet(1).add(V(0.6, 0, 0)); b.rotY = face(MAX0, N0); b.face = 'knocked_out';
    if (s < B.getUp + 0.4) { b.layers = idle(s); b.fallBack = easeOut(inv(B.bonk, B.bonk + 0.35, s)); b.grounded = false; }
    else { b.rotY = s > B.ggPost ? face(b.pos, N_SAFE) : face(b.pos, MIA); b.face = s > B.alt ? 'angry' : s > B.ggPost ? 'shocked' : 'confused'; }
  }
  return b;
}

function miaState(s) {
  // Not one movement all round: rest pose, same face, no idle sway. Then the plank.
  const b = st(MIA, face(MIA, V(0, 0, 6)), [], 'neutral');
  if (s > B.fall[0]) { b.plank = easeIn(inv(...B.fall, s)); b.grounded = false; }
  return b;
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6 * x.scale, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  if (x.plank) a.root.rotateX(-Math.PI / 2 * x.plank);                    // stiff fall backwards, pivoting on the heels
  if (x.fallBack) { a.root.rotateX(-1.45 * x.fallBack); a.root.position.y += 0.5 * x.fallBack; }
  a.root.scale.setScalar(x.scale);
  robloxPose(a, x.layers);
  if (x.gesture === 'panic') panicArms(a, clockT + x.pos.x * 0.37);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  a.root.traverse((o) => { if (o.isMesh && o.name !== 'Hair') o.visible = !x.invisible; });
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 28); }
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
function frame(stage, tg, az, el, w, fov = 40) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
const yaw = (a) => a.root.rotation.y;
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);

export function samples(t) { return (t > B.flung[0] && t < B.flung[0] + 0.8) || (t > B.zip[0] && t < B.zip[1] + 0.1) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

export function update(t, stage) {
  const s = t; clockT = t;
  place(noob, noobState(s)); place(leo, leoState(s)); place(max, maxState(s)); place(mia, miaState(s));
  cam = stage.camera;

  // Crowns on the noob and Mia (Mia's goes down with her).
  for (const a of [noob, mia]) {
    const fit = crowns[a.name], c = fit.item; c.visible = a.root.visible;
    c.quaternion.copy(a.bones.Head.getWorldQuaternion(new THREE.Quaternion())); c.scale.setScalar(fit.scale * a.root.scale.x);
    c.position.copy(a.bones.Head.localToWorld(fit.offset.clone()));
  }
  // Fire on the running hair.
  const fireOn = s > B.fireOn && s < B.reset;
  const hp = head(leo);
  flames.forEach((f, i) => {
    f.visible = fireOn; if (!fireOn) return;
    const a = i * 0.7, k = 0.7 + 0.5 * Math.abs(Math.sin(t * 13 + i * 1.7));
    f.position.copy(hp).add(V(Math.cos(a) * 0.45, 0.35 + 0.25 * (i % 3), Math.sin(a) * 0.45)); f.scale.set(k, k * (1.2 + 0.6 * Math.sin(t * 17 + i)), k);
  });
  smoke.forEach((p, i) => {
    p.visible = fireOn; if (!fireOn) return;
    const u = ((t * 1.3 + i / smoke.length) % 1);
    p.position.copy(hp).add(V(Math.sin(i * 2.1) * 0.5 * u, 1 + 3.2 * u, Math.cos(i * 1.3) * 0.5 * u)); p.scale.setScalar(0.25 + 0.8 * u); p.material.opacity = 0.55 * (1 - u);
  });
  // Ice on both boys during ":freeze all" and ":spin all".
  ices.forEach((g, i) => {
    const on = s >= B.combo[0] && s < B.combo[2]; g.visible = on; if (!on) return;
    const a = i ? max : leo; g.position.copy(a.root.position).setY(0); g.rotation.y = a.root.rotation.y;
    g.scale.setScalar(easeOutBack(inv(B.combo[0], B.combo[0] + 0.15, s), 1.6) || 0.001);
  });
  // ForceField on Leo when he's back for the combo.
  const fa = s - B.reset; ff.visible = fa > 0 && fa < 1.2;
  if (ff.visible) { ff.position.copy(LEO0).add(V(0, 2.9, 0)); ff.scale.setScalar(3.6 * easeOutBack(clamp(fa / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(0.8, 1.2, fa); ff.material.uniforms.time.value = t; }

  // Puffs: Max shrinking, both boys reset for the combo, the noob's zip, the bonk, Mia hitting the floor.
  const events = [[B.shrink[0], MAX0.clone().add(V(0, 2.5, 0)), 1.6, 0.8], [B.reset, MAX0.clone().add(V(0, 1.5, 0)), 1.2, 0.6], [B.zip[0], N0.clone().add(V(0, 1.5, 0)), 1.4, 0.7], [B.bonk, N0.clone().add(V(0, 3.2, 0)), 1.0, 0.6], [B.fall[1], MIA.clone().add(V(0, 0.3, -2.4)), 1.6, 0.9]];
  let ev = null; for (const e of events) if (s >= e[0] && s < e[0] + e[3]) ev = e;
  puffs.forEach((p, i) => {
    p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur] = ev, u = (s - at) / dur, a = i * 0.35;
    p.position.set(c.x + Math.cos(a) * size * 1.5 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.5 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  // Sparkles as the noob wakes up and when the alt is revealed.
  const sparkAt = [[B.wake, head(noob).add(V(0, 0.6, 0))], [B.alt, head(noob).add(V(0, 0.6, 0))]];
  let sp = null; for (const e of sparkAt) if (s >= e[0] && s < e[0] + 1) sp = e;
  sparkles.forEach((m, i) => {
    m.visible = !!sp; if (!sp) return;
    const u = s - sp[0], a = i * 2.39996;
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (0.8 + 2.2 * u), (i % 6) * 0.3 + u * 1.3, Math.sin(a + u * 3) * (0.8 + 2.2 * u)));
    m.scale.setScalar(1.1 * (1 - u)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });
  // Dizzy stars over the boys while they're down.
  const down = s > B.bonk && s < B.getUp;
  stars.forEach((m, i) => {
    m.visible = down; if (!down) return;
    const who = i < 5 ? leo : max, c = who.bones.Head.localToWorld(V(0, 1.2, 0)), a = t * 4 + (i % 5) * 1.256;
    m.position.copy(c).add(V(Math.cos(a) * 0.9, 0.5 + 0.15 * Math.sin(a * 2), Math.sin(a) * 0.9)); m.rotation.set(t * 4, t * 6, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const nh = head(noob), lh = head(leo), xh = head(max), ih = head(mia);
  stage.bloom.strength = 0.3;
  switch (shot.id) {
    case 'hook': frame(stage, nh.clone().add(V(0, -0.4, 0)), 0.12, 0.06, lerp(9, 6.5, easeOut(u)), 38); break;
    case 'leoType': frame(stage, lh.clone().add(V(0.3, 0, 0)), face(LEO0, CAM) + 0.35, 0.08, 6, 38); break;
    case 'noobType': frame(stage, nh.clone().add(V(0, 0.1, 0)), 0.2, 0.06, 4.6, 36); break;
    case 'fling': { const p = s < B.flung[1] ? leo.bones.Torso.localToWorld(V(0, 1, 0)) : FLUNG.clone(); const k = easeOut(inv(B.flung[0], B.flung[0] + 1.2, s)); look(stage, V(lerp(1, -6, k), lerp(4, 9, k), lerp(14, 10, k)), V(-4.2, 3.5, 0.4).lerp(p, 0.55 * k), 50); break; }
    case 'smug': frame(stage, nh.clone().add(V(0, -0.1, 0)), yaw(noob) + 0.5, 0.06, 5, 36); break;
    case 'maxType': frame(stage, xh.clone().add(V(-0.3, 0, 0)), face(MAX0, CAM) - 0.35, 0.08, 6, 38); break;
    case 'grow': frame(stage, MAX0.clone().add(V(0, lerp(3.5, 6.5, easeOut(inv(...B.grow, s))), 0)), -0.25, 0.1, lerp(9, 15, easeOut(inv(...B.grow, s))), 42); break;
    case 'tiny': frame(stage, MAX0.clone().add(V(0, lerp(4.5, 1.2, easeInOut(inv(B.shrink[0], B.shrink[1] + 0.3, s))), 0)), 0.5, 0.35, lerp(13, 4.2, easeInOut(inv(B.shrink[0], B.shrink[1] + 0.3, s))), 40); break;
    case 'hairBack': frame(stage, SPAWN.clone().add(V(0, 4.2, 0)), 0.2, 0.06, 5.5, 38); break;
    case 'fire': frame(stage, lh.clone().add(V(0, -0.2, 0)), 0.25, 0.15, 7, 40); break;
    case 'combo1': frame(stage, V(0, 3.4, 0.6), 0.04, 0.08, 15, 40); break;
    case 'combo2': frame(stage, V(0, 3.0, 0.6), -0.3, -0.04, 13.5, 42); break;
    case 'charge': frame(stage, V(0, 3.2, 1.2), 0.05, 0.1, 16, 40); break;
    case 'speed': frame(stage, V(0.2, 3.4, 1.0), 0.1, 0.08, 9, 40); break;
    case 'collide': frame(stage, N0.clone().add(V(0, 3.0, 0)).add(s > B.bonk && s < B.bonk + 0.3 ? jolt(t, 0.25 * (1 - (s - B.bonk) / 0.3)) : V(0, 0, 0)), 0.35, 0.1, 9.5, 40); break;
    case 'mia': frame(stage, ih.clone().add(V(0, -0.6, 0)), face(MIA, V(0, 0, 6)) + 0.7, 0.05, lerp(8, 5.5, easeInOut(u)), 36); break;
    case 'walk': look(stage, V(9.5, 5, 9), V(4.5, 3, -1.5), 44); break;
    case 'poke': frame(stage, MIA.clone().lerp(POKE, 0.5).add(V(0, 2.6, 0)).add(s > B.fall[1] && s < B.fall[1] + 0.3 ? jolt(t, 0.2 * (1 - (s - B.fall[1]) / 0.3)) : V(0, 0, 0)), 0.12, 0.1, 10, 40); break;     // from the front: Leo and Mia side by side, the gap between them reads
    case 'gg': frame(stage, nh.clone().add(V(0, 0.1, 0)), yaw(noob) - 0.5, 0.05, 4.6, 36); break;
    case 'chat': frame(stage, V(3.6, 3.4, -0.8), -0.15, 0.1, 13, 40); break;
    case 'alt': { const m = N_SAFE.clone().lerp(MIA.clone().add(V(0.3, 0, -2.4)), 0.5).setY(0.5); look(stage, m.clone().add(V(0, 25, 3.5)), m, 44); break; }      // from above: the noob standing over flat Mia
    case 'flashback': frame(stage, nh.clone().add(V(0, 0.3, 0)), yaw(noob) - 0.5, 0.05, 4.4, 36); break;
    default: { const mid = lh.clone().lerp(xh, 0.5); frame(stage, mid.clone().add(V(0, 0.9, 0)), face(mid, N_SAFE), 0.05, 9, 38); }   // CTA: Leo and Max glaring at the noob
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
  let label, col = 'rgba(21,36,53,.86)', edge = '#FFC83D', ink = '#FFE7A0', crowns = 1;
  const v = Math.max(0, Math.ceil(clock(t))), mm = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
  if (t < B.ggPost) { label = `NOOB ADMIN ${mm}`; if (t > W.ten) col = Math.floor(t * 4) % 2 ? 'rgba(220,40,60,.92)' : col; }
  else if (t < B.alt) { label = 'ROUND OVER'; col = 'rgba(70,70,80,.9)'; edge = '#9a9aa5'; ink = '#d0d0d8'; crowns = 0; }
  else { label = 'MIA ADMIN x2'; col = 'rgba(112,64,190,.92)'; ink = '#ffffff'; crowns = 2; }
  g.save(); g.font = `${50 * s}px "Luckiest Guy"`;
  const pad = crowns ? 104 + (crowns - 1) * 56 : 34, w = g.measureText(label).width + (pad + 36) * s, x = 60 * s, y = 250 * s;
  roundRect(g, x, y, w, 90 * s, 26 * s); g.fillStyle = col; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = edge; g.stroke();
  for (let i = 0; i < crowns; i++) drawCrown(g, x + (58 + 56 * i) * s, y + 46 * s, 33 * s);
  g.fillStyle = ink; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(label, x + pad * s, y + 50 * s);
  g.restore();
  const px = (w / s + 80); g.save(); g.font = `${42 * s}px "Luckiest Guy"`; const tw = g.measureText('PART 4').width + 40 * s;
  roundRect(g, px * s, 260 * s, tw, 70 * s, 20 * s); g.fillStyle = '#FFD23F'; g.fill(); g.fillStyle = '#152435'; g.textBaseline = 'middle'; g.fillText('PART 4', px * s + 20 * s, 297 * s); g.restore();
}
function chatBox(g, s, t, { x = 60, y = 370, w = 820, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => t >= l.at).slice(-rows);
  const ty = CHAT.find((l) => l.typed && t >= l.typed[0] - 0.1 && t < l.typed[1] + 0.1);
  const n = shown.length + (ty ? 1 : 0); if (!n) return null;
  g.save();
  const lh = 50 * s, pad = 20 * s, h = pad * 2 + n * lh + 8 * s;
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${31 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2, miaLine = null;
  for (const l of shown) {
    g.globalAlpha = clamp((t - l.at) / 0.12);
    const tag = `[${l.name}]: `; g.fillStyle = l.name === 'Server' ? SERVER : C[l.name]; g.fillText(tag, x * s + pad, yy);
    if (l.name === 'Mia' && l.text === 'gg') miaLine = { x: x * s + pad, y: yy, w: g.measureText(tag).width };
    g.fillStyle = l.name === 'Server' ? '#FFE9A8' : '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy); yy += lh;
  }
  g.globalAlpha = 1;
  if (ty) {
    const n2 = Math.floor(clamp((t - ty.typed[0]) / (ty.typed[1] - ty.typed[0])) * ty.text.length * ty.upto), txt = ty.text.slice(0, n2);
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
    g.fillStyle = C[ty.name]; g.fillText(`${ty.name}:`, x * s + pad * 1.2, yy + 4 * s); const ox = g.measureText(`${ty.name}: `).width;
    g.fillStyle = '#ffffff'; g.fillText(txt, x * s + pad * 1.2 + ox, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0) g.fillRect(x * s + pad * 1.2 + ox + g.measureText(txt).width + 4 * s, yy - 14 * s, 4 * s, 36 * s);
  }
  g.restore();
  return miaLine;
}
function bigInput(g, s, text, { y = 1330, cursor = true, size = 76, t = 0, w = 860, label = 'noob' } = {}) {
  g.save(); g.font = `800 ${size * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const x = (1080 - w) / 2, h = size * 1.25 + 50;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#F5CD30'; g.stroke();
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#F5CD30'; g.fillText(label, (x + 30) * s, (y - 22) * s);
  g.font = `800 ${size * s}px Montserrat`; g.fillStyle = '#ffffff'; const ly = (y + h / 2) * s; g.fillText(text, (x + 40) * s, ly);
  if (cursor && Math.floor(t * 5) % 2 === 0) g.fillRect((x + 40) * s + g.measureText(text).width + 8 * s, ly - size * 0.5 * s, 7 * s, size * s);
  g.restore();
}

export function overlay(g, s, t) {
  hud(g, s, t);
  const miaLine = t < B.cta ? chatBox(g, s, t) : null;

  // Opening: one round is one minute; the AFK tag pops when he moves.
  if (t > 0.55 && t < B.wake + 0.3) {
    const k = easeOutBack(clamp((t - 0.55) / 0.25), 2.2), al = 1 - inv(B.wake, B.wake + 0.3, t);
    g.save(); g.globalAlpha = al; g.translate(540 * s, 1440 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -390 * s, -70 * s, 780 * s, 140 * s, 40 * s); g.fillStyle = '#FFD23F'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#152435'; g.stroke();
    g.font = `${74 * s}px "Luckiest Guy"`; g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1 ROUND = 1 MINUTE', 0, 6 * s);
    g.restore();
  }
  { // AFK tag over the noob until he wakes (it pops); over Mia from "hadn't moved" on - the clue.
    const tags = [];
    if (t < B.wake + 0.25) tags.push([noob, 'AFK', t < B.wake ? 1 : 1 - (t - B.wake) / 0.25, t < B.wake ? 1 : 1 + 2 * (t - B.wake)]);
    if (t > W.hadnt && t < B.fall[0]) tags.push([mia, 'AFK?', clamp((t - W.hadnt) / 0.2), 1]);
    for (const [a, txt, al, k] of tags) {
      const p = project(head(a).add(V(0, 1.5, 0)), s); if (!p.on) continue;
      g.save(); g.globalAlpha = al; g.translate(p.x, p.y); g.scale(k, k); g.font = `${40 * s}px "Luckiest Guy"`; const w = g.measureText(txt).width + 36 * s;
      roundRect(g, -w / 2, -30 * s, w, 60 * s, 18 * s); g.fillStyle = 'rgba(40,40,48,.85)'; g.fill(); g.fillStyle = '#d7d7de'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 3 * s); g.restore();
    }
  }
  // The noob's commands, typed fast in his own big box.
  const cmd = NOOB_CMDS.find(([, at]) => t > at - 0.55 && t < at + 0.35);
  if (cmd && t < B.ggPost + 0.4) { const [txt, at] = cmd; bigInput(g, s, txt.slice(0, Math.ceil(clamp((t - (at - 0.5)) / 0.42) * txt.length)), { t, cursor: t < at }); }
  // Payoff words.
  for (const [at, word, col, size] of [[B.flung[0] + 0.15, 'FLUNG!', '#ff9e80', 150], [B.shrink[1] - 0.1, 'TINY!', '#7FE3DD', 150], [B.fireOn + 0.1, 'ON FIRE!', '#ffb640', 140], [B.bonk, 'BONK!', '#ffffff', 170], [B.fall[1], 'THUD', '#ffffff', 150]]) {
    const a = t - at; if (a < 0 || a > 0.95) continue;
    bigText(g, s, word, 540, 780, size, col, { k: easeOutBack(clamp(a / 0.15), 3), alpha: 1 - inv(0.75, 0.95, a), rot: -0.07 });
  }
  // Combo counter.
  const k = combo(t);
  if (k >= 0) {
    const at = B.combo[k], a = t - at, names = ['FREEZE', 'SPIN', 'SIT', 'DANCE'];
    bigText(g, s, `COMBO x${k + 1}`, 540, 740, 120, ['#9fe3ff', '#ffe36b', '#8BE36B', '#C9A6FF'][k], { k: (1 + 0.25 * (1 - clamp(a / 0.2))) * easeOutBack(clamp(a / 0.12), 2.6), rot: -0.05 });
    bigText(g, s, names[k], 540, 860, 80, '#ffffff', { k: easeOutBack(clamp(a / 0.12), 2.6) });
  }
  if (SHOT === 'hairBack' || SHOT === 'fire') { const p = project(head(leo).add(V(0, 1.4, 0)), s); if (p.on && t > B.fireOn) bigText(g, s, 'AAAA!', p.x / s + 40, p.y / s - 30, 70, '#ffffff', { k: 1 + 0.1 * Math.sin(t * 20), rot: 0.1 * Math.sin(t * 9) }); }
  if (t > W.ten && t < W.ten + 1.3) bigText(g, s, '0:10', 540, 780, 190, '#ff4d5e', { k: easeOutBack(clamp((t - W.ten) / 0.2), 2.4) });
  // The reveal: the gg lands under Mia's name - circle it, then stamp ALT ACCOUNT.
  if (miaLine && t > W.popped - 0.1) {
    const r = easeOutBack(clamp((t - (W.popped - 0.1)) / 0.25), 2);
    g.save(); g.strokeStyle = '#ff2b3d'; g.lineWidth = 7 * s; g.beginPath(); g.ellipse(miaLine.x + miaLine.w * 0.42, miaLine.y, miaLine.w * 0.75 * r, 34 * s * r, -0.05, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  if (SHOT === 'chat' && t > W.popped) { bigText(g, s, '[Mia]: gg', 540, 800, 120, '#C9A6FF', { k: easeOutBack(clamp((t - W.popped) / 0.2), 2.4) }); bigText(g, s, '...WRONG ACCOUNT', 540, 930, 72, '#ffffff', { k: easeOutBack(clamp((t - W.popped - 0.5) / 0.2), 2.4), alpha: clamp((t - W.popped - 0.5) / 0.1) }); }
  if (t > B.alt && t < B.shades) {
    const a = t - B.alt; g.save(); g.translate(540 * s, 1010 * s); g.rotate(-0.12); g.scale(1 + 1.4 * (1 - easeOut(clamp(a / 0.18))), 1 + 1.4 * (1 - easeOut(clamp(a / 0.18))));
    g.globalAlpha = clamp(a / 0.1); g.lineWidth = 12 * s; g.strokeStyle = '#ff2b3d'; roundRect(g, -380 * s, -95 * s, 760 * s, 190 * s, 24 * s); g.stroke();
    g.font = `${118 * s}px "Luckiest Guy"`; g.fillStyle = '#ff2b3d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ALT ACCOUNT', 0, 8 * s); g.restore();
  }
  // Part 3 callback card: "she forgot one player" -> FORGOT crossed out.
  if (SHOT === 'flashback') {
    const a = t - (W.partThree - 0.3);
    g.save(); g.translate(540 * s, 1460 * s); g.rotate(0.04); g.scale(easeOutBack(clamp(a / 0.25), 1.8), easeOutBack(clamp(a / 0.25), 1.8));
    roundRect(g, -420 * s, -150 * s, 840 * s, 300 * s, 26 * s); g.fillStyle = 'rgba(18,28,44,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#FFD23F'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PART 3:', 0, -95 * s);
    g.font = `${62 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('SHE FORGOT ONE PLAYER', 0, -20 * s);
    if (t > W.didnt - 0.1) {
      const fw = g.measureText('FORGOT').width, sx = -g.measureText('SHE FORGOT ONE PLAYER').width / 2 + g.measureText('SHE ').width;
      g.strokeStyle = '#ff2b3d'; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(sx, -20 * s); g.lineTo(sx + fw * easeOut(clamp((t - W.didnt + 0.1) / 0.2)), -20 * s); g.stroke();
      g.font = `${64 * s}px "Luckiest Guy"`; g.fillStyle = '#ff2b3d'; g.fillText("SHE DIDN'T FORGET", 0, 80 * s);
    }
    g.restore();
  }
  // Call to action end card.
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -190 * s, 840 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'PART 5: LEO & MAX VS MIA', 540, 520, 62, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k: k2 });
  }
  flash(g, s, t >= B.bonk && t < B.bonk + 0.15 ? 0.4 * (1 - (t - B.bonk) / 0.15) : 0, '#ffffff');
  if (SHOT === 'fling' || SHOT === 'speed') speedLines(g, s, t, SHOT === 'speed' && t < B.zip[0] ? 0 : 0.45, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max, mia, noob });
export const crownFits = () => crowns;
