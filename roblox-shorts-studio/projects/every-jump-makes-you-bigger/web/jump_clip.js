// Every Jump Makes You Bigger (Part 1 of "Every ___ Makes You ___"), web renderer + Roblox R6 pack. Beat times come from
// web/beats.js (source/beats.py: the narration's word timings via script alignment, or an estimate until it exists).
// An obby where every jump makes you bigger. Leo jumps fifty times and strides over the course; the finish is a tiny
// door. He blocks it; Max baits him to a hundred jumps, the floor breaks and Leo falls out of the map - and respawns at
// his last checkpoint, right next to the door, tiny again. He wins, then does a victory jump in a very small room.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, forceField, part, sign, canvasTexture, neonMaterial } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, holdItem } from '../../../web/lib/robloxPack.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.55) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Every Jump Makes You Bigger' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

// ---------- the rule ----------
// Visual size after j jumps: the first jump doubles you, then it keeps growing but slows down (x10 at 50, x14 at 100) so
// the giants still fit the shots. The leaderstats show SIZE = jumps + 1, like the incremental games it parodies.
export const SIZE = (j) => (j <= 1 ? 1 + j : 2 * Math.pow(j, 0.42));
const POP = 0.14;                                                   // seconds for a size pop

// ---------- layout (course along +X, camera usually on +Z looking -Z) ----------
const LAVA = [14, 56], MIDP = [56, 72], LANE = [72, 136], SLAB = [140, 168], PORCH = [168, 176], ROOM = [176, 184];
const LEO0 = V(-4, 0, 0), MAX0 = V(8, 0, 7.5), SPAWN = V(0, 0, 3);
const MID = V(64, 0, 0), LANE_END = V(133, 0, 0);                    // Leo leans over the room from LANE_END
const SIT = V(162.8, 0, 0), JUMP_AT = V(154, 0, 0), CP = V(171.5, 0, 1.2), INSIDE = V(179.2, 0, 0.6), SQUASH = V(180, 0, 1.6);
const EDGE = V(13.2, 0, 4), B1 = V(19.5, 0, 4);                      // Max's tiny block
const MAX_END = V(131, 0, 0);
const DOOR = { x: ROOM[0], w: 3.6, h: 6 }, ROOM_H = 7.2;
const PEDESTAL = V(181.6, 0, -1.3);

// ---------- beats ----------
const B = {
  hookPop: 0.2,
  leoHops: [1.05, 1.8, W.plan - 0.1, W.skip + 0.15, W.skip + 0.95],               // jumps 2-6
  mont1: [W.jumped - 0.05, W.fifty + 0.6, 6, 50],                                 // fast-forward to 50
  walk1: W.stepped - 0.3, walk2end: W.steps + 0.25,
  maxRun: [W.tried - 0.25], maxHop1: W.tried + 0.5, maxHop2: W.grew - 0.3, topple: W.didnt - 0.05,
  maxRespawn: W.back + 0.1, peek: [W.tinyDoor - 0.55, W.tinyDoor + 0.25], unpeek: [W.reset - 0.1, W.reset + 0.45],
  sitDown: [W.sat + 0.35, W.sat + 0.75], typed: [W.typed - 0.15, W.hundred + 0.2], standUp: [W.say + 0.05, W.say + 0.4],
  mont2: [W.say + 0.55, W.ninety - 0.45, 50, 98], hop99: W.ninety - 0.3, hop100: W.oneHundred - 0.4,
  mont3: [W.clear + 0.15, W.giant + 0.35, 0, 50], maxWalk: W.stomped - 0.25,
  leoRespawn: W.respawned - 0.1, walkIn: W.walked - 0.15, grab: W.grabbed, vhop: W.victory + 0.2, cta: W.follow,
};
const HOP_LEO = 0.5;
B.landed99 = B.hop99 + HOP_LEO * 0.9; B.break = B.hop100 + HOP_LEO * 0.9;
// Round clock: 1:00 at the start, 0:03 as Leo grabs the trophy.
const clock = track([[0, 60, (u) => u], [B.grab, 3, (u) => u]]);

// Jump schedules: discrete hops [takeoff, duration, height factor] and fast-forward montages [t0, t1, j0, j1].
const LEO_J = {
  hops: [[B.hookPop - 0.42, 0.85, 1.5, 0.42], ...B.leoHops.map((t) => [t, 0.5, 0.9]), [B.hop99, HOP_LEO, 0.7], [B.hop100, HOP_LEO, 0.7]],
  mont: [B.mont1, B.mont2],
  resets: [[B.leoRespawn, 0]],
  after: [[B.vhop, 0.42, 0]],                                   // the victory hop (after the respawn)
};
const MAX_J = { hops: [[B.maxHop1, 0.55, 1.1], [B.maxHop2, 0.5, 0.9]], mont: [B.mont3], resets: [[B.maxRespawn, 0]], after: [] };

// Jumps done by time s (continuous inside a montage) and the current hop lift.
function jumpsAt(spec, s) {
  const ev = [];
  for (const h of spec.hops) ev.push({ t: h[0], kind: 'hop', h });
  for (const m of spec.mont) ev.push({ t: m[0], kind: 'mont', m });
  for (const r of spec.resets) ev.push({ t: r[0], kind: 'reset', j: r[1] });
  for (const h of spec.after) ev.push({ t: h[0], kind: 'hop', h });
  ev.sort((a, b) => a.t - b.t);
  let j = 0, jPrev = 0, popAt = -9, lift = 0, airborne = false, mont = null;
  for (const e of ev) {
    if (e.t > s) break;
    if (e.kind === 'reset') { j = e.j; jPrev = j; popAt = -9; continue; }
    if (e.kind === 'hop') {
      const [t0, dur, hk, popOff = 0] = e.h, u = (s - t0) / dur;
      if (s >= t0 + popOff) { jPrev = j; j += 1; popAt = t0 + popOff; }
      if (u < 1) { lift = hk * 4 * u * (1 - u); airborne = true; }
      continue;
    }
    const [t0, t1, j0, j1] = e.m;
    if (s < t1) { const u = (s - t0) / (t1 - t0); j = lerp(j0, j1, u); jPrev = j; popAt = -9; mont = { u, t0, t1 }; lift = 0.55 * Math.abs(Math.sin(Math.PI * 3.4 * (s - t0))); airborne = lift > 0.05; }
    else { j = j1; jPrev = j; }
  }
  const k = popAt > -9 ? easeOutBack(clamp((s - popAt) / POP), 2.6) : 1;
  const size = lerp(SIZE(jPrev), SIZE(j), k);
  return { j, jumps: Math.floor(j + 1e-6), size, lift, airborne, mont, popAt };
}
export const leoJ = (s) => jumpsAt(LEO_J, s);
export const maxJ = (s) => jumpsAt(MAX_J, s);

const SHOTS = [
  [0, 'hook'], [W.plan - 0.3, 'spam'], [W.jumped - 0.15, 'montage'], [W.stepped - 0.4, 'step'], [W.tried - 0.45, 'maxTry'],
  [W.grew - 0.55, 'maxGrow'], [W.back - 0.15, 'maxRespawn'], [W.reached - 0.35, 'stride'], [W.door - 0.55, 'tinyDoor'],
  [W.trophy - 0.3, 'peekIn'], [W.shrink - 0.35, 'reset'], [W.sat - 0.3, 'sit'], [W.typed - 0.45, 'bait'],
  [W.say - 0.25, 'accept'], [B.mont2[0] + 0.25, 'jumps100'], [B.hop100 - 0.25, 'break'], [W.clear - 0.2, 'maxGiant'],
  [W.stomped - 0.05, 'maxStomp'], [W.respawned - 0.3, 'leoRespawn'], [W.shrunk - 0.3, 'maxShock'], [W.walked - 0.3, 'walkIn'],
  [W.victory - 0.3, 'squash'], [W.room + 0.35, 'reveal'], [W.nextGame - 0.25, 'next'], [W.follow - 0.1, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD' };
const typed = (name, text, from, to, at = to + 0.06) => ({ name, text, typed: [from, to], at });
const CHAT = [
  { name: 'Server', text: 'Every jump = +1 size!', at: -1 },
  { name: 'Server', text: 'First to the trophy wins.', at: -1 },
  typed('Max', 'bet u cant hit 100 jumps', ...B.typed),
  { name: 'Leo', text: 'watch me', at: W.say + 0.05 },
  { name: 'Server', text: 'Leo fell out of the map.', at: W.fell },
  { name: 'Server', text: 'Leo respawned at Checkpoint 20.', at: W.respawned },
  { name: 'Server', text: 'Leo got the trophy!', at: B.grab + 0.1 },
];

// ---------- scene ----------
let A = {}, leo, max, cam, ff, trophy, lavaTex, cpPad, cpPadMat, SHOT = 'hook', roomLight;
const puffs = [], sparkles = [], chunks = [], cracks = [];

function lavaTexture() {
  return canvasTexture(512, 512, (x, w, h) => {
    const r = rng(5); x.fillStyle = '#ff4a12'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const cx = r() * w, cy = r() * h, rad = 10 + r() * 46;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const hot = r() > 0.5; g.addColorStop(0, hot ? 'rgba(255,214,80,.9)' : 'rgba(170,20,0,.7)'); g.addColorStop(1, 'rgba(255,80,20,0)');
      x.fillStyle = g; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { x.beginPath(); x.arc(cx + ox, cy + oy, rad, 0, 7); x.fill(); }
    }
  });
}

async function put(kind, name, x, y, z, { ry = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const o = await packItem(kind, name); o.position.set(x, y, z); o.rotation.y = ry; o.scale.set(sx, sy, sz); return o;
}

export async function setup(stage) {
  const { scene } = stage; const r = rng(41);
  scene.fog.near = 240; scene.fog.far = 900;
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'suspicious', 'nervous', 'confused', 'blink', 'sad'];
  [leo, max] = await Promise.all(['Leo', 'Max'].map((n) => loadRobloxCharacter(n, { expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root);
  for (const n of ['idle', 'walk', 'run', 'shock', 'sit', 'typing', 'proud', 'laugh_big', 'scheming', 'point_forward', 'tool_hold', 'look_up', 'fall'])
    A[n] = await loadAnimation(n);

  // Start platform + spawn + the rule sign.
  const grass = '#5fb44a', stone = '#a3a9b6', dark = '#6b7385';
  const start = part(30, 4, 26, grass, { studs: true }); start.position.set(0, 0, 0); scene.add(start);
  scene.add(await put('map', 'spawn_location', 0, -0.98, 0));
  // The rule, on a two-line board so it reads whole in the opening close-up.
  const rule = sign(' ', { w: 14, h: 6.4, post: 9, bg: '#152435', accent: '#ffd23f' }); rule.position.set(-4, 0, -15); scene.add(rule);
  const ruleTex = canvasTexture(1024, 468, (x, w, h) => {
    x.fillStyle = '#152435'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffd23f'; x.lineWidth = 18; x.strokeRect(14, 14, w - 28, h - 28);
    x.font = '170px "Luckiest Guy"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillText('EVERY JUMP', w / 2, h * 0.33);
    x.fillStyle = '#8BE36B'; x.fillText('= BIGGER', w / 2, h * 0.73);
  });
  const ruleFace = new THREE.Mesh(new THREE.PlaneGeometry(13.9, 6.3), new THREE.MeshStandardMaterial({ map: ruleTex, emissive: '#ffffff', emissiveMap: ruleTex, emissiveIntensity: 0.22, roughness: 0.5 }));
  ruleFace.position.set(-4, 9 + 3.2, -15 + 0.14); scene.add(ruleFace);
  const islA = await put('map', 'island_large', 0, -3.9, 0, { sx: 1.6, sy: 1.3, sz: 1.4 }); scene.add(islA);

  // Lava level: a lava pool with small studded blocks to hop across.
  lavaTex = lavaTexture(); lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping; lavaTex.repeat.set(4, 2.4);
  const lavaMat = new THREE.MeshStandardMaterial({ map: lavaTex, emissive: '#ff5a1a', emissiveMap: lavaTex, emissiveIntensity: 1.3, roughness: 0.6 });
  const lava = new THREE.Mesh(new THREE.BoxGeometry(LAVA[1] - LAVA[0] + 2, 3, 26), lavaMat); lava.position.set((LAVA[0] + LAVA[1]) / 2, -1.2 - 1.5, 0); lava.receiveShadow = true; scene.add(lava);
  const basin = part(LAVA[1] - LAVA[0] + 4, 3, 30, dark); basin.position.set((LAVA[0] + LAVA[1]) / 2, -3.9, 0); scene.add(basin);
  for (const s of [-1, 1]) { const rim = part(LAVA[1] - LAVA[0] + 4, 3.6, 2, dark); rim.position.set((LAVA[0] + LAVA[1]) / 2, -0.4, s * 14); scene.add(rim); }
  const cols = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
  const blocks = [[B1.x, B1.z], [26, -3], [32, 4.5], [38, -4], [44, 2], [50, -5], [24, 9], [36, -10], [47, 9]];
  for (const [i, [x, z]] of blocks.entries()) scene.add(await put('map', `obby_block_${cols[i % cols.length]}_studs`, x, -1, z));
  const islL = await put('map', 'island_large', 35, -4.4, 0, { sx: 2.6, sy: 1, sz: 1.6 }); scene.add(islL);

  // Mid checkpoint platform (stage 10) and the lane to the finish, with flush kill bricks and side props.
  const midp = part(MIDP[1] - MIDP[0], 4, 26, stone, { studs: true }); midp.position.set((MIDP[0] + MIDP[1]) / 2, 0, 0); scene.add(midp);
  scene.add(await put('map', 'checkpoint', 64, 0, -7));
  const lane = part(LANE[1] - LANE[0], 3, 12, '#c9ced8', { studs: true }); lane.position.set((LANE[0] + LANE[1]) / 2, 0, 0); scene.add(lane);
  for (const x of [80, 92, 104, 116, 128]) scene.add(await put('map', 'kill_brick', x, -0.97, (x / 4) % 2 ? 2 : -2));
  for (const [x, z] of [[86, -8], [110, 8], [122, -8]]) scene.add(await put('map', 'truss', x, -6, z));
  for (const [i, [x, y, z]] of [[78, 4, -11], [96, 7, 11], [102, 2, -13], [118, 9, -12], [130, 5, 12], [90, -3, 13]].entries()) scene.add(await put('map', `obby_block_${cols[(i + 2) % 6]}_studs`, x, y, z));
  const islM = await put('map', 'island_large', 104, -3.2, 0, { sx: 3.4, sy: 0.8, sz: 0.9 }); scene.add(islM);
  const finSign = sign('FINISH', { w: 7, h: 2.2, post: 4.5, bg: '#152435', accent: '#3ddc97' }); finSign.position.set(134, 0, -8); finSign.rotation.y = 0.3; scene.add(finSign);

  // Finish slab (breaks into chunks at 100 jumps): 4 x 4 chunks with crack lines on top.
  const sr = rng(77), cw = (SLAB[1] - SLAB[0]) / 4, cd = 28 / 4;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
    const c = part(cw - 0.06, 3, cd - 0.06, '#b8bfcc', { studs: true }); const home = V(SLAB[0] + cw * (a + 0.5), 0, -14 + cd * (b + 0.5));
    c.position.copy(home); scene.add(c);
    const centre = Math.hypot(home.x - JUMP_AT.x, home.z) / 20;
    chunks.push({ m: c, home, delay: centre * 0.18 + sr() * 0.06, spin: V(sr() - 0.5, sr() - 0.5, sr() - 0.5).multiplyScalar(3), drift: V((home.x - JUMP_AT.x) * 0.25, 0, home.z * 0.25) });
  }
  const crackMat = new THREE.MeshBasicMaterial({ color: '#2a2f3a' });
  // Each crack: a jagged polyline from near the centre outwards; `at` is its share of the cracking progress.
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(); let p = V(JUMP_AT.x + (sr() - 0.5) * 6, 0.07, (sr() - 0.5) * 6);
    const a0 = (i / 14) * Math.PI * 2 + sr() * 0.3, segs = [];
    for (let k = 0; k < 6; k++) {
      const a = a0 + (sr() - 0.5) * 0.9, len = 1.6 + sr() * 2.4, q = p.clone().add(V(Math.cos(a) * len, 0, Math.sin(a) * len));
      if (q.x < SLAB[0] + 0.5 || q.x > SLAB[1] - 0.5 || Math.abs(q.z) > 13.5) break;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(p.distanceTo(q), 0.04, 0.32 - k * 0.03), crackMat);
      seg.position.copy(p).lerp(q, 0.5); seg.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); g.add(seg); segs.push(seg); p = q;
    }
    scene.add(g); cracks.push({ g, segs, at: i / 14 });
  }

  // Porch with the last checkpoint pad (stage 20), on the island that holds the trophy room.
  const porch = part(PORCH[1] - PORCH[0] + 16, 3, 18, '#9aa0ad', { studs: true }); porch.position.set(PORCH[0] + (PORCH[1] - PORCH[0] + 16) / 2, 0, 0); scene.add(porch);
  const islF = await put('map', 'island_large', 180, -2.9, 0, { sx: 1.3, sy: 1.2, sz: 1.1 }); scene.add(islF);
  cpPadMat = new THREE.MeshStandardMaterial({ color: '#3a4152', emissive: '#3ddc97', emissiveIntensity: 0, roughness: 0.4 });
  cpPad = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 3.6), cpPadMat); cpPad.position.set(CP.x, 0.1, CP.z); scene.add(cpPad);
  const cpFlag = await put('map', 'checkpoint', CP.x, 0, -5.6, { sx: 0.6, sy: 0.6, sz: 0.6 }); scene.add(cpFlag);

  // The tiny trophy room: 8 x 8 x 8 outside, a door 3.6 wide x 6 tall on the -X side, a glass front on +Z.
  const wallC = '#ffcf3f', T = 0.5, x0 = ROOM[0], x1 = ROOM[1], z0 = -4, z1 = 4, H = ROOM_H + T;
  const box = (w, h, d, x, y, z, color = wallC, o = {}) => { const p = part(w, h, d, color, { center: true, ...o }); p.position.set(x, y, z); scene.add(p); return p; };
  box(T, H, (z1 - z0 - DOOR.w) / 2, x0 + T / 2, H / 2, z0 + (z1 - z0 - DOOR.w) / 4);                 // door wall, left of the door
  box(T, H, (z1 - z0 - DOOR.w) / 2, x0 + T / 2, H / 2, z1 - (z1 - z0 - DOOR.w) / 4);                 // right of the door
  box(T, H - DOOR.h, DOOR.w, x0 + T / 2, DOOR.h + (H - DOOR.h) / 2, 0);                               // above the door
  box(T, H, z1 - z0, x1 - T / 2, H / 2, 0);                                                           // back wall
  box(x1 - x0, H, T, (x0 + x1) / 2, H / 2, z0 + T / 2);                                               // far side
  // Glass front (+Z) in a gold frame.
  box(x1 - x0, 1, T, (x0 + x1) / 2, 0.5, z1 - T / 2); box(x1 - x0, H - 6.6, T, (x0 + x1) / 2, 6.6 + (H - 6.6) / 2, z1 - T / 2);
  box(0.8, H, T, x0 + 0.4, H / 2, z1 - T / 2); box(0.8, H, T, x1 - 0.4, H / 2, z1 - T / 2);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 1.6, 5.6), new THREE.MeshStandardMaterial({ color: '#cfefff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false }));
  glass.position.set((x0 + x1) / 2, 3.8, z1 - 0.05); glass.renderOrder = 4; scene.add(glass);
  // Roof: a gold frame around a glass skylight (Leo looks in from above).
  box(x1 - x0 + 0.6, T, 1, (x0 + x1) / 2, H + T / 2, z0 + 0.2, '#e8b520'); box(x1 - x0 + 0.6, T, 1, (x0 + x1) / 2, H + T / 2, z1 - 0.2, '#e8b520');
  box(1, T, z1 - z0 + 0.6, x0 + 0.2, H + T / 2, 0, '#e8b520'); box(1, T, z1 - z0 + 0.6, x1 - 0.2, H + T / 2, 0, '#e8b520');
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 1.4, z1 - z0 - 1.4), glass.material); sky.rotation.x = -Math.PI / 2; sky.position.set((x0 + x1) / 2, H + 0.02, 0); sky.renderOrder = 4; scene.add(sky);
  const pad = await put('map', 'finish_pad', (x0 + x1) / 2, -0.97, 0, { sx: 0.85, sz: 0.85 }); scene.add(pad);
  const ped = part(1.6, 2.4, 1.6, '#f4f4f8', { center: true }); ped.position.set(PEDESTAL.x, 1.2, PEDESTAL.z); scene.add(ped);
  const label = sign('FINISH', { w: 4.6, h: 1.2, post: 0.01, bg: '#152435', accent: '#ffd23f' }); label.position.set(x0 - 0.05, H - 1.25, 0); label.rotation.y = -Math.PI / 2; scene.add(label);
  trophy = await packItem('props', 'trophy'); scene.add(trophy);
  roomLight = new THREE.PointLight('#fff2cc', 30, 14, 2); roomLight.position.set(180, 6, 0.5); scene.add(roomLight);

  // Sky dressing.
  for (let i = 0; i < 7; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 220 + r() * 140; isl.position.set(90 + Math.cos(a) * d, -20 + r() * 40, Math.sin(a) * d - 60); isl.scale.setScalar(1 + r()); scene.add(isl); }
  for (let i = 0; i < 46; i++) { const c = cloud(600 + i, 10 + r() * 14); c.position.set(-80 + r() * 340, -70 - r() * 50, -150 + r() * 260); scene.add(c); }
  for (let i = 0; i < 24; i++) { const c = cloud(800 + i, 8 + r() * 8); const a = r() * Math.PI * 2, d = 180 + r() * 160; c.position.set(90 + Math.cos(a) * d, 30 + r() * 60, Math.sin(a) * d - 80); scene.add(c); }

  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 22; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, scale: 1, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const toCam = (p) => face(p, p.clone().add(V(0, 0, 10)));
// Distance-driven walk for a scaled actor: the cycle carries STRIDE * size studs per anim-second, so the feet stay planted.
const walkAnim = (m, size, dist) => (m.u * dist) / (STRIDE * size);
const AIR = (s) => [[A.run, 0.18], [A.idle, s, 0.35]];                  // airborne: legs mid-stride, arms low (never both up)

function leoState(s) {
  const J = leoJ(s), S = J.size, b = st(LEO0, toCam(LEO0), idle(s), 'happy', { scale: S });
  const hopPose = () => { if (J.airborne) { b.floor = J.lift * S * (J.mont ? 1 : 1.4); b.layers = s - J.popAt < 0.22 ? [[A.shock, 0.3]] : AIR(s); } };
  if (s < B.walk1) {
    b.face = s - J.popAt < 0.3 ? 'surprised' : J.mont ? 'evil_grin' : 'laugh';
    hopPose();
    if (J.mont) b.layers = [[A.proud, 0.35]];
  } else if (s < B.walk2end - 1.85) {
    const d = LEO0.distanceTo(MID), m = travel(LEO0, MID, B.walk1, s, 48); b.pos = m.pos; b.rotY = m.moving ? m.heading : toCam(MID);
    b.layers = m.moving ? [[A.walk, walkAnim(m, S, d)]] : idle(s); b.face = 'evil_grin';
  } else if (s < B.peek[0]) {
    const d = MID.distanceTo(LANE_END), m = travelTo(MID, LANE_END, B.walk2end, s, 48); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(LANE_END, V(200, 0, 0));
    b.layers = m.moving ? [[A.walk, walkAnim(m, S, d)]] : idle(s); b.face = m.moving ? 'evil_grin' : 'happy';
    if (!m.moving && s > W.door - 0.2) { b.lookDown = 0.5; b.face = 'surprised'; }
  } else if (s < B.unpeek[1]) {
    // Leans right over the tiny room (its roof is glass): he can see the trophy; shakes his head at "shrink? reset".
    b.pos = LANE_END.clone(); b.rotY = face(LANE_END, V(200, 0, 0));
    const k = s < B.unpeek[0] ? easeInOut(inv(...B.peek, s)) : 1 - easeInOut(inv(...B.unpeek, s));
    b.lean = 1.22 * k; b.lookDown = 0.35 * k; b.layers = [[A.idle, 0.2]]; b.face = s > W.fit - 0.1 ? 'sad' : 'surprised';
    if (s > W.shrink + 0.2 && s < B.unpeek[0] + 0.3) { b.headShake = 0.3 * Math.sin((s - W.shrink) * 15); b.face = 'angry'; }
  } else if (s < B.standUp[0]) {
    // Walks to the door and sits with his back to it.
    const d = LANE_END.distanceTo(SIT), m = travelTo(LANE_END, SIT, B.sitDown[0] - 0.15, s, 40); b.pos = m.pos;
    const turn = easeInOut(inv(B.sitDown[0] - 0.15, B.sitDown[0] + 0.1, s));
    b.rotY = m.moving ? m.heading : lerp(face(LANE_END, SIT), face(SIT, V(0, 0, 4)) + 0.25, turn);
    b.layers = m.moving ? [[A.walk, walkAnim(m, S, d)]] : [[A.idle, s], [A.sit, 0.5, inv(...B.sitDown, s) * 3 + 1e-3]];
    b.face = s > W.nobody ? 'smug' : 'annoyed';
    if (s > W.hundred - 0.2) { b.face = 'suspicious'; }
  } else if (s < B.break) {
    // Stands up, steps onto the middle of the slab, then 51 -> 100.
    const m = travel(SIT, JUMP_AT, B.standUp[1], s, 36); b.pos = m.pos;
    const up = easeInOut(inv(...B.standUp, s));
    b.rotY = s < B.standUp[1] ? face(SIT, V(0, 0, 4)) + 0.25 : m.moving ? m.heading : lerp(face(SIT, JUMP_AT), toCam(JUMP_AT), easeInOut(inv(m.arrive, m.arrive + 0.2, s)));
    b.layers = s < B.standUp[1] ? [[A.idle, s], [A.sit, 0.5, (1 - up) * 3 + 1e-3]] : m.moving ? [[A.walk, walkAnim(m, S, SIT.distanceTo(JUMP_AT))]] : idle(s);
    b.face = s < W.say + 0.25 ? 'evil_grin' : 'determined';
    if (J.mont) { b.layers = [[A.proud, 0.35]]; b.face = 'evil_grin'; }
    hopPose();
    if (s > B.landed99) b.face = 'scared';
  } else if (s < B.leoRespawn) {
    // Falls through the broken slab, out of the map.
    const u = s - B.break; b.grounded = false; b.pos = JUMP_AT.clone().add(V(0, -0.5 * 70 * u * u, 0)); b.layers = [[A.shock, 0.3]]; b.face = 'scared';
    b.rotX = -u * 0.9; b.visible = u < 2.2;
  } else {
    // Respawned at Checkpoint 20, size 1: looks up at Max, walks in, grabs the trophy, victory hop -> squashed in the room.
    b.scale = J.size; b.pos = CP.clone(); b.rotY = toCam(CP) - 0.3; b.face = s < W.tinyAgain ? 'surprised' : 'smug';
    if (s > W.shrunk - 0.3) { b.rotY = face(CP, V(150, 0, 6)); b.lookUp = 0.55; b.face = 'laugh'; }
    if (s > B.walkIn) {
      const d = CP.distanceTo(INSIDE), m = travel(CP, INSIDE, B.walkIn, s, 12); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(INSIDE, PEDESTAL);
      b.layers = m.moving ? [[A.walk, walkAnim(m, 1, d)]] : idle(s); b.lookUp = 0; b.face = 'happy';
      if (s > B.grab - 0.25) { b.layers = [[A.tool_hold, s]]; b.face = 'laugh'; b.rotY = lerp(face(INSIDE, PEDESTAL), toCam(INSIDE), easeInOut(inv(B.grab + 0.2, B.grab + 0.5, s))); }
    }
    if (s > B.vhop) {
      // The victory hop pops him to SIZE 2 in a room 7.2 studs tall: squashed against the ceiling and the glass.
      const k = clamp((s - B.vhop) / POP), S2 = lerp(1, SIZE(1), easeOutBack(k, 2.6));
      const maxH = ROOM_H - 0.15, sy = Math.min(S2, maxH / 5.15);
      b.pos = INSIDE.clone().lerp(SQUASH, easeOut(k)); b.rotY = toCam(SQUASH); b.scale = S2; b.scaleY = sy; b.scaleXZ = S2 * (1 + 0.12 * clamp((S2 - sy) / 0.6));
      b.layers = [[A.tool_hold, s]]; b.face = s < B.vhop + 0.35 ? 'shocked' : 'dizzy';
      b.floor = s < B.vhop + 0.06 ? 0.6 : 0;
    }
  }
  return b;
}

function maxState(s) {
  const J = maxJ(s), S = J.size, b = st(MAX0, face(MAX0, LEO0), idle(s, 0.5), 'neutral', { scale: S });
  if (s < B.maxRun[0]) {
    b.face = s < W.plan ? 'surprised' : 'shocked'; b.lookUp = clamp(leoJ(s).size / 6) * 0.7;
    if (s > W.stepped) { b.rotY = face(MAX0, MID); b.face = 'annoyed'; b.lookUp = 0.2; }
  } else if (s < B.maxHop1) {
    const d = MAX0.distanceTo(EDGE), m = travelTo(MAX0, EDGE, B.maxHop1, s, 16); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(EDGE, B1);
    b.layers = m.moving ? [[A.run, walkAnim(m, 1, d)]] : idle(s); b.face = 'determined';
  } else if (s < B.topple) {
    // Hop 1: edge -> block (pops to x2). Hop 2: straight up (x2.7) and lands half off the block.
    const LAND2 = B1.clone().add(V(1.6, 0, 0.2));
    const u1 = clamp((s - B.maxHop1) / 0.55), u2 = clamp((s - B.maxHop2) / 0.5);
    b.pos = s < B.maxHop2 ? EDGE.clone().lerp(B1, easeInOut(u1)) : B1.clone().lerp(LAND2, easeOut(u2));
    b.rotY = face(EDGE, B1); b.face = s < B.maxHop2 ? 'happy' : 'nervous';
    if (J.airborne) { b.floor = J.lift * 2.6; b.layers = s - J.popAt < 0.2 ? [[A.shock, 0.3]] : AIR(s); }
    else if (s > B.maxHop2) { b.layers = [[A.shock, 0.3]]; b.rotZ = -0.06 * Math.sin((s - B.maxHop2) * 18) * clamp((s - B.maxHop2 - 0.5) * 2); b.face = 'scared'; }
  } else if (s < B.maxRespawn) {
    // Topples off into the lava.
    const u = s - B.topple, LAND2 = B1.clone().add(V(1.6, 0, 0.2));
    b.grounded = false; b.pos = LAND2.clone().add(V(u * 4, Math.max(-9, 2.6 * 0 - 0.5 * 40 * u * u), 0)); b.rotY = face(EDGE, B1);
    b.rotZ = -Math.min(1.4, u * 3.2); b.layers = [[A.shock, 0.3]]; b.face = 'scared'; b.visible = u < 0.85;
  } else if (s < B.maxWalk) {
    b.pos = SPAWN.clone(); b.rotY = toCam(SPAWN) + 0.2; b.face = s < W.reached ? 'annoyed' : 'determined';
    if (s > B.typed[0] - 0.3) { b.layers = [[A.typing, s * 1.8]]; b.face = s < B.typed[1] + 0.3 ? 'scheming' : 'evil_grin'; b.rotY = toCam(SPAWN) - 0.15; }
    if (s > W.fell) { b.layers = [[A.laugh_big, s]]; b.face = 'laugh'; }
    if (J.mont || s > B.mont3[0]) { b.layers = J.mont ? [[A.proud, 0.35]] : idle(s); b.face = 'evil_grin'; if (J.airborne) b.floor = J.lift * S; }
  } else {
    // Stomps to the end of the lane, then leans over the room: shocked to see tiny Leo by the door.
    const d = SPAWN.distanceTo(MAX_END), m = travel(SPAWN, MAX_END, B.maxWalk, s, 52); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(MAX_END, V(200, 0, 0));
    b.layers = m.moving ? [[A.walk, walkAnim(m, S, d)]] : idle(s); b.face = m.moving ? 'evil_grin' : 'happy';
    if (s > W.respawned + 0.3) b.face = 'surprised';
    if (s > W.shrunk - 0.3) { b.face = 'shocked'; b.lean = 0.35 * easeInOut(inv(W.shrunk - 0.3, W.shrunk + 0.2, s)); b.layers = [[A.shock, 0.3]]; }
    if (s > W.walked - 0.2) { b.lean = lerp(0.35, 1.0, easeInOut(inv(W.walked - 0.2, B.grab, s))); b.layers = [[A.point_forward, 0.2]]; b.face = 'angry'; b.lookDown = 0.4; }
    if (s > B.grab + 0.2) b.face = 'shocked';
    if (s > B.vhop + 0.3) { b.face = 'laugh'; b.layers = [[A.laugh_big, s]]; }
  }
  return b;
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  const S = x.scale, sy = x.scaleY ?? S, sxz = x.scaleXZ ?? S;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6 * S, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  if (x.lean) a.root.rotateX(x.lean);                        // tip forward about the feet
  if (x.prone) { a.root.rotateX(Math.PI / 2 * x.prone); a.root.position.y += 0.5 * S * x.prone; }
  a.root.scale.set(sxz, sy, sxz);
  robloxPose(a, x.layers);
  if (x.lookUp) a.bones.Head.rotateX(-x.lookUp);
  if (x.lookDown) a.bones.Head.rotateX(x.lookDown);
  if (x.headUp) a.bones.Head.rotateX(-x.headUp);
  if (x.headShake) a.bones.Head.rotateY(x.headShake);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40, ext = 28) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); }
function orbit(stage, tg, az, el, d, fov = 40, ext) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov, ext); }
// Frame a width `w` (studs) across the 9:16 picture.
function frame(stage, tg, az, el, w, fov = 40, ext) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov, ext ?? Math.max(24, w * 1.2)); }
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);

// Landing thuds (camera shake + SFX): every discrete hop of a size >= 2, and montage bounces are covered by a rumble.
export const EVENTS = {
  leoLand: LEO_J.hops.map(([t, d]) => t + d * 0.9),
  maxLand: MAX_J.hops.map(([t, d]) => t + d * 0.9),
  leoPops: [...LEO_J.hops, ...LEO_J.after].map(([t, , , o = 0]) => t + o), maxPops: MAX_J.hops.map(([t]) => t),
  break: 0, montages: [B.mont1, B.mont2, B.mont3],
};
EVENTS.break = B.break;

export function samples(t) { return (t > B.walk1 && t < B.walk1 + 1.5) || (t > B.break - 0.1 && t < B.break + 1.4) || (t > B.maxWalk && t < B.maxWalk + 2.7) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

let lastShake = 0;
export function update(t, stage) {
  const s = t;
  const L = leoState(s), M = maxState(s);
  place(leo, L); place(max, M);
  cam = stage.camera;
  lavaTex.offset.set((t * 0.03) % 1, (t * 0.017) % 1);

  // Trophy: on the pedestal until Leo grabs it, then in his hand.
  if (s < B.grab) { if (trophy.parent !== stage.scene) stage.scene.add(trophy); trophy.position.set(PEDESTAL.x, 2.4 + 0.8, PEDESTAL.z); trophy.rotation.set(0, t * 1.2, 0); trophy.scale.setScalar(1.3); }
  else if (trophy.parent === stage.scene) holdItem(leo, trophy, 'right');
  if (s < B.grab && trophy.parent !== stage.scene) { trophy.parent.remove(trophy); stage.scene.add(trophy); }

  // Checkpoint 20 lights up when Leo's chin reaches it (peek) and again at the respawn.
  const cpGlow = Math.max(s > B.sitDown[1] - 0.1 && s < B.sitDown[1] + 1.2 ? 1 - inv(B.sitDown[1] + 0.6, B.sitDown[1] + 1.2, s) : 0, s > B.leoRespawn - 0.1 && s < B.leoRespawn + 1.2 ? 1 - inv(B.leoRespawn + 0.6, B.leoRespawn + 1.2, s) : 0);
  cpPadMat.emissiveIntensity = 1.6 * cpGlow; cpPadMat.color.set(cpGlow > 0.05 ? '#3ddc97' : '#3a4152');

  // Slab: cracks spread over 51 -> 99, fully at 99; it breaks at 100.
  const crackK = s < B.mont2[0] ? 0 : s < B.landed99 ? 0.65 * inv(B.mont2[0], B.mont2[1], s) : 1;
  for (const c of cracks) c.segs.forEach((seg, k) => { seg.visible = crackK > c.at * 0.6 + (k / c.segs.length) * 0.4 && s < B.break + 0.05; });
  for (const c of chunks) {
    const u = s - B.break - c.delay;
    if (u <= 0) { c.m.position.copy(c.home); c.m.rotation.set(0, 0, 0); c.m.visible = true; continue; }
    c.m.position.copy(c.home).add(c.drift.clone().multiplyScalar(u)).add(V(0, -0.5 * 60 * u * u, 0)); c.m.rotation.set(c.spin.x * u, c.spin.y * u, c.spin.z * u); c.m.visible = u < 3;
  }

  // ForceFields: Max's respawn at the start, Leo's at Checkpoint 20.
  ff.visible = false;
  for (const [at, pos, size] of [[B.maxRespawn, SPAWN, 3.6], [B.leoRespawn, CP, 3.6]]) {
    const fa = s - at; if (fa < 0 || fa > 2) continue;
    ff.visible = true; ff.position.copy(pos).add(V(0, 2.9, 0)); ff.scale.setScalar(size * easeOutBack(clamp(fa / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(1.5, 2, fa); ff.material.uniforms.time.value = t;
  }
  // Puffs: landing dust (scaled with the jumper), the lava splash, the slab breaking, both respawns.
  const events = [];
  for (const lt of EVENTS.leoLand) { const J = leoJ(lt); events.push([lt, (lt < B.walk1 ? LEO0 : JUMP_AT).clone().add(V(0, 0.4, 0)), 0.5 * J.size, 0.7, '#ffffff']); }
  events.push([B.maxHop1 + 0.5, B1.clone().add(V(0, 0.3, 0)), 0.8, 0.6, '#ffffff']);
  events.push([B.topple + 0.45, B1.clone().add(V(3.5, -1, 0.2)), 2.2, 0.9, '#ff7a2a']);
  events.push([B.break, JUMP_AT.clone().add(V(0, 0.5, 0)), 6, 1.1, '#e8e8ee']);
  events.push([B.maxRespawn, SPAWN.clone().add(V(0, 0.4, 0)), 1.2, 0.6, '#ffffff'], [B.leoRespawn, CP.clone().add(V(0, 0.4, 0)), 1.2, 0.6, '#ffffff']);
  events.push([B.vhop + 0.02, SQUASH.clone().add(V(0, 3, 0)), 1.0, 0.5, '#ffe36b']);
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur, col] = ev, u = (s - at) / dur, a = i * 0.7;
    p.material.color.set(col); p.material.emissive.set(col);
    p.position.set(c.x + Math.cos(a) * size * 1.4 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.4 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  // Sparkles: every size pop (around the head) and the trophy grab.
  const sparkAt = [];
  for (const pt of EVENTS.leoPops) if (s >= pt && s < pt + 0.8) sparkAt.push([pt, head(leo), 0.6 * leoJ(pt + 0.2).size]);
  for (const pt of EVENTS.maxPops) if (s >= pt && s < pt + 0.8) sparkAt.push([pt, head(max), 0.6 * maxJ(pt + 0.2).size]);
  if (s >= B.grab && s < B.grab + 1) sparkAt.push([B.grab, INSIDE.clone().add(V(0.6, 3, 0.4)), 0.8]);
  sparkles.forEach((m, i) => {
    const sp = sparkAt[i % Math.max(1, sparkAt.length)]; m.visible = !!sp; if (!sp) return;
    const u = s - sp[0], a = i * 2.39996, k = sp[2];
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (0.6 + 2 * u) * k, ((i % 6) * 0.3 + u * 1.2) * k, Math.sin(a + u * 3) * (0.6 + 2 * u) * k));
    m.scale.setScalar(1.1 * (1 - u) * Math.max(1, k * 0.7)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const lh = head(leo), xh = head(max), LS = L.scale, MS = M.scale;
  stage.bloom.strength = 0.3;
  const shake = (at, k, dur = 0.3) => (s > at && s < at + dur ? jolt(t, k * (1 - (s - at) / dur)) : V(0, 0, 0));
  const landShake = (lands, k) => lands.reduce((v, lt) => v.add(shake(lt, k)), V(0, 0, 0));
  const rumble = (k) => V(k * Math.sin(t * 61), k * Math.sin(t * 47 + 1), 0);
  switch (shot.id) {
    case 'hook': {           // crash zoom in on Leo mid-jump; widens as he doubles
      const k = easeOut(clamp((t - B.hookPop) / 0.3));
      frame(stage, V(LEO0.x, lerp(6.6, 7.6, k), 0).add(landShake(EVENTS.leoLand, 0.25)), 0.05, 0.02, lerp(13, 17, k) * lerp(0.82, 1, easeOut(clamp(t / 0.3))), 38); break;
    }
    case 'spam': frame(stage, V(1.5, 4.5 + LS * 1.2, 2).add(landShake(EVENTS.leoLand, 0.3)), 0.35, 0.08, lerp(16, 19, u), 40); break;    // Max in front, Leo hopping behind
    case 'montage': {        // low angle past Max, pulling back and tilting up as Leo grows
      const k = easeInOut(u), p = V(lerp(14, 18, k), 2.5, lerp(48, 82, k)), tg = V(LEO0.x + 2, LS * 2.6, 0).add(rumble(0.25));
      look(stage, p, tg, 56, 80); break;
    }
    case 'step': {           // wide side view: the giant strides over the whole lava level
      const x = lerp(10, 48, easeInOut(u)); look(stage, V(x, 34, 120), V(x + 4, 20, 0), 44, 90); break;
    }
    case 'maxTry': frame(stage, V(15.5, 2.6, 4), 0.15, 0.1, 13, 40); break;
    case 'maxGrow': { const k = easeOut(clamp(u * 3)); frame(stage, V(B1.x + 1.5, lerp(5, 5.6, k), 4).add(shake(B.maxHop2 + 0.45, 0.15)), 0.12, 0.08, lerp(15, 17, k), 40); break; }
    case 'maxRespawn': frame(stage, SPAWN.clone().add(V(0, 3, 0)), 0.1, 0.12, 9, 40); break;
    case 'stride': {         // tracking the giant along the lane
      const p = leo.root.position; look(stage, V(p.x - 14, 32, 140), V(p.x + 10, 27, 0), 44, 100); break;
    }
    case 'tinyDoor': {       // porch level, looking back past the tiny door at the giant towering over it
      const k = easeInOut(clamp(u * 1.5)); look(stage, V(lerp(160, 163, k), 2.2, lerp(9, 6, k)), V(178, lerp(5, 9, k), 0), 64, 60); break;
    }
    case 'peekIn': look(stage, V(183.2, 0.8, 3.0), V(179.5, 7.5, -1.5), 72, 40); break;   // inside, looking up: the trophy, and a giant face over the glass roof
    case 'reset': frame(stage, V(160, 14, 0), 0.55, 0.1, 58, 40, 70); break;
    case 'sit': frame(stage, V(158, 18, 0), -0.55, 0.06, lerp(58, 52, u), 40, 70); break;
    case 'bait': frame(stage, SPAWN.clone().add(V(0, 3.8, 0)), 0.15, 0.06, lerp(7, 6, u), 36); break;
    case 'accept': frame(stage, lh.clone().add(V(0, -0.6 * LS, 0)), L.rotY + 0.45, 0.08, lerp(30, 26, u), 38, 60); break;
    case 'jumps100': {
      const lands = s > B.mont2[0] && s < B.mont2[1] ? rumble(0.5) : landShake([B.landed99], 1.2);
      frame(stage, V(157, 30, 0).add(lands), 0.02, 0.1, lerp(80, 88, u), 40, 90); break;
    }
    case 'break': {          // the slab gives way; the camera tilts down after him
      const k = easeInOut(inv(B.break, B.break + 1.3, s));
      look(stage, V(157, lerp(40, 10, k), 120).add(shake(B.break, 2.5, 0.6)), V(156, lerp(30, -40, k), 0), 44, 100); break;
    }
    case 'maxGiant': frame(stage, V(0, 3 + MS * 2.4, 3).add(M.floor ? rumble(0.2) : V(0, 0, 0)), 0.12, 0.08, lerp(14, 70, easeInOut(u)), 40, 80); break;
    case 'maxStomp': { const p = max.root.position; look(stage, V(p.x - 20, 30, 108), V(p.x + 10, 24, 0), 44, 90); break; }
    case 'leoRespawn': frame(stage, CP.clone().add(V(0, 3, 0)), 0.15, 0.08, lerp(10, 11.5, u), 40); break;
    case 'maxShock': { look(stage, V(184, 2.5, 10), V(150, 17, -3), 74, 70); break; }   // low behind tiny Leo, up at giant Max
    case 'walkIn': look(stage, V(180, 3.8, 15), V(179.5, 4.0, -0.5), 46, 20); break;
    case 'squash': look(stage, V(180, 4.4, 21).add(shake(B.vhop + 0.04, 0.25)), V(180, 4.6, 0), 50, 20); break;
    case 'reveal': { const k = easeInOut(clamp(u * 1.3)); look(stage, V(lerp(180, 198, k), lerp(4.4, 12, k), lerp(21, 56, k)), V(lerp(180, 175, k), lerp(4.6, 17, k), 0), lerp(50, 46, k), 60); break; }
    case 'next': look(stage, V(198, 12, 56), V(175, 17, 0), 46, 60); break;
    default: look(stage, V(198, 12, 56), V(175, 17, 0), 46, 60);
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
const pop = (t, at, d = 0.15, k = 3) => easeOutBack(clamp((t - at) / d), k);
const fade = (t, at, hold) => 1 - inv(at + hold - 0.2, at + hold, t);
function word(g, s, t, at, hold, text, col, size = 140, y = 780, rot = -0.06) { const a = t - at; if (a < 0 || a > hold) return; bigText(g, s, text, 540, y, size, col, { k: pop(t, at), alpha: fade(t, at, hold), rot }); }

// Stage of a player from where they are on the course (obby leaderstats).
function stageOf(x, who, t) {
  if (who === 'leo' && t >= B.sitDown[1] - 0.1) return 20;
  if (x < LAVA[0]) return 1; if (x < LAVA[1]) return 1 + Math.min(8, Math.floor(((x - LAVA[0]) / (LAVA[1] - LAVA[0])) * 9));
  if (x < LANE[0]) return 10; if (x < SLAB[0]) return 10 + Math.min(9, Math.floor(((x - LANE[0]) / (LANE[1] - LANE[0])) * 9)); return 19;
}
function hud(g, s, t) {
  // Round timer + PART 1 tag.
  const v = Math.max(0, Math.ceil(clock(t))), mm = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`, done = t > B.grab;
  g.save(); g.font = `${50 * s}px "Luckiest Guy"`;
  const label = done ? 'ROUND OVER' : `TIME ${mm}`, w = g.measureText(label).width + 70 * s, x = 60 * s, y = 250 * s;
  roundRect(g, x, y, w, 88 * s, 26 * s); g.fillStyle = done ? 'rgba(70,70,80,.9)' : v <= 10 && Math.floor(t * 4) % 2 ? 'rgba(220,40,60,.92)' : 'rgba(21,36,53,.88)'; g.fill();
  g.lineWidth = 5 * s; g.strokeStyle = '#FFC83D'; g.stroke(); g.fillStyle = '#ffffff'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(label, x + 35 * s, y + 48 * s);
  g.font = `${42 * s}px "Luckiest Guy"`; const tw = g.measureText('PART 1').width + 40 * s, px = x + w + 22 * s;
  roundRect(g, px, 260 * s, tw, 70 * s, 20 * s); g.fillStyle = '#FFD23F'; g.fill(); g.fillStyle = '#152435'; g.fillText('PART 1', px + 20 * s, 297 * s);
  g.restore();
  // Leaderstats (Roblox player list): Stage and Size per player; a value that just changed pops.
  const L = leoJ(t), M = maxJ(t), lx = leo.root.position.x, mx = max.root.position.x;
  const rows = [['Leo', C.Leo, stageOf(lx, 'leo', t), L.jumps + 1, L.popAt], ['Max', C.Max, stageOf(mx, 'max', t), M.jumps + 1, M.popAt]];
  const X = 60 * s, Y = 360 * s, RW = 520 * s, RH = 58 * s;
  g.save(); g.globalAlpha = clamp((t - 0.9) / 0.25); roundRect(g, X, Y, RW, RH * 3 + 16 * s, 18 * s); g.fillStyle = 'rgba(12,18,28,.62)'; g.fill();
  g.font = `800 ${26 * s}px Montserrat`; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.75)';
  g.textAlign = 'left'; g.fillText('Player', X + 24 * s, Y + RH / 2 + 6 * s); g.textAlign = 'center'; g.fillText('Stage', X + 330 * s, Y + RH / 2 + 6 * s); g.fillText('Size', X + 450 * s, Y + RH / 2 + 6 * s);
  rows.forEach(([n, col, stg, size, popAt], i) => {
    const yy = Y + RH * (i + 1.5) + 8 * s;
    g.font = `800 ${34 * s}px Montserrat`; g.textAlign = 'left'; g.fillStyle = col; g.fillText(n, X + 24 * s, yy);
    g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(String(stg), X + 330 * s, yy);
    const k = 1 + 0.45 * (1 - clamp((t - popAt) / 0.25));
    g.save(); g.translate(X + 450 * s, yy); g.scale(k, k); g.font = `${40 * s}px "Luckiest Guy"`; g.fillStyle = k > 1.02 ? '#8BE36B' : '#FFD23F'; g.fillText(String(size), 0, 3 * s); g.restore();
  });
  g.restore();
}
function chatBox(g, s, t, { x = 60, y = 570, w = 820, rows = 3 } = {}) {
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
    g.fillStyle = '#ffffff'; g.fillText(txt + (Math.floor(t * 5) % 2 ? '|' : ''), x * s + pad * 1.2 + ox, yy + 4 * s);
  }
  g.restore();
}
function tagOver(g, s, p3, text, bg, fg, alpha = 1, k = 1) {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.globalAlpha = alpha; g.translate(p.x, p.y); g.scale(k, k); g.font = `${38 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 34 * s;
  roundRect(g, -w / 2, -30 * s, w, 60 * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
// "+1 SIZE" popping up over a jumper's head.
function plusOnes(g, s, t, actor, J, pops) {
  for (const pt of pops) {
    const a = t - pt; if (a < 0 || a > 0.8) continue;
    const p = project(head(actor).add(V(0, 0.8 * actor.root.scale.y, 0)), s); if (!p.on) continue;
    bigText(g, s, '+1 SIZE', p.x / s, p.y / s - 140 * a, 58, '#8BE36B', { alpha: 1 - inv(0.5, 0.8, a), k: easeOutBack(clamp(a / 0.12), 3) });
  }
  if (J.mont) {     // a stream of +1s during the fast-forward
    for (let i = 0; i < 4; i++) {
      const a = ((t * 2.6 + i * 0.25) % 1), p = project(head(actor).add(V(0, 0.6 * actor.root.scale.y, 0)), s); if (!p.on) continue;
      bigText(g, s, '+1', p.x / s + [-160, 120, -60, 190][i], p.y / s - 200 * a, 64, '#8BE36B', { alpha: 1 - a });
    }
  }
}
function fastForward(g, s, t, J) {
  if (!J.mont) return;
  g.save(); g.globalAlpha = 0.9; g.font = `${64 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.textBaseline = 'middle';
  g.lineWidth = 12 * s; g.strokeStyle = '#152435'; g.strokeText('x10 >>', 880 * s, 520 * s); g.fillText('x10 >>', 880 * s, 520 * s); g.restore();
  bigText(g, s, `JUMPS ${J.jumps}`, 540, 800, 120, '#FFD23F', { k: 1 + 0.04 * Math.sin(t * 30) });
}

export function overlay(g, s, t) {
  hud(g, s, t);
  const L = leoJ(t), M = maxJ(t);
  if (t > W.typed - 0.6 && t < W.fell + 2) chatBox(g, s, t);
  if (t < 0.45) speedLines(g, s, t, 0.5 * (1 - t / 0.45), { cx: 540, cy: 900 });
  plusOnes(g, s, t, leo, L, EVENTS.leoPops); plusOnes(g, s, t, max, M, EVENTS.maxPops);
  fastForward(g, s, t, SHOT === 'montage' || SHOT === 'jumps100' ? L : SHOT === 'maxGiant' ? M : {});
  word(g, s, t, B.hookPop, 1.1, 'POP!', '#8BE36B', 170, 760);
  if (t > B.mont1[1] && t < W.stepped - 0.2) word(g, s, t, B.mont1[1], 0.9, 'SIZE 51', '#FFD23F', 150);
  // One step over the whole lava level: the stage counter flies.
  if (SHOT === 'step') { const n = stageOf(leo.root.position.x, 'leo', t); bigText(g, s, `STAGE ${n}`, 540, 760, 130, '#ffffff', { k: 1 + 0.05 * Math.sin(t * 20) }); }
  word(g, s, t, B.maxHop2 + 0.5, 1.1, 'TOO BIG', '#ff4d5e', 140);
  word(g, s, t, B.topple + 0.45, 0.9, 'OOF', '#ff7a2a', 170);
  if (t > B.maxRespawn && t < W.reached - 0.4) tagOver(g, s, head(max).add(V(0, 1.7, 0)), 'CHECKPOINT: START', 'rgba(40,170,80,.92)', '#ffffff', clamp((t - B.maxRespawn) / 0.2));
  if (SHOT === 'stride') { const st = Math.min(4, 1 + Math.floor(inv(W.reached - 0.2, B.walk2end - 0.1, t) * 4)); bigText(g, s, `STEP ${st}`, 540, 760, 130, '#ffffff', { k: 1 + 0.05 * Math.sin(t * 20) }); }
  if (SHOT === 'tinyDoor' && t > W.tinyDoor - 0.1) { const p = project(V(ROOM[0], DOOR.h + 1.6, 0), s); if (p.on) { bigText(g, s, 'TINY DOOR', p.x / s, p.y / s - 120, 84, '#FFD23F', { k: pop(t, W.tinyDoor - 0.1) }); bigText(g, s, 'v', p.x / s, p.y / s - 40, 80, '#FFD23F', { k: pop(t, W.tinyDoor - 0.1) }); } }
  if (t > B.sitDown[1] - 0.1 && t < B.sitDown[1] + 1.6) bigText(g, s, 'CHECKPOINT 20', 540, 1010, 90, '#3ddc97', { k: pop(t, B.sitDown[1] - 0.1), alpha: fade(t, B.sitDown[1] - 0.1, 1.7) });
  word(g, s, t, W.fit - 0.05, 1.0, "CAN'T FIT", '#ff4d5e', 150, 1000);
  if (t > W.shrink - 0.1 && t < W.sat - 0.35) {
    const k = pop(t, W.shrink - 0.1, 0.25, 2.2);
    g.save(); g.translate(540 * s, 780 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -380 * s, -80 * s, 760 * s, 160 * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#152435'; g.stroke();
    g.font = `${78 * s}px "Luckiest Guy"`; g.fillStyle = '#152435'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SHRINK = RESET', 0, 6 * s); g.restore();
  }
  word(g, s, t, W.nobody - 0.1, 1.2, 'BLOCKED', '#ff4d5e', 150);
  if (t > B.mont2[0] && t < B.landed99 - 0.2) { /* the fast-forward counter covers 51 -> 98 */ }
  word(g, s, t, B.landed99 - 0.05, 1.0, '99', '#FFD23F', 220);
  word(g, s, t, W.cracked - 0.05, 0.9, 'CRACK', '#ffffff', 130, 980, 0.05);
  word(g, s, t, B.break - 0.08, 0.8, '100!', '#FFD23F', 230);
  if (t > W.fell - 0.1 && t < W.clear - 0.3) {
    const k = pop(t, W.fell - 0.1, 0.25, 2);
    g.save(); g.translate(540 * s, 800 * s); g.scale(k, k);
    roundRect(g, -440 * s, -70 * s, 880 * s, 140 * s, 30 * s); g.fillStyle = 'rgba(12,18,28,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ff4d5e'; g.stroke();
    g.font = `${62 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText('LEO FELL OUT OF THE MAP', 0, 6 * s); g.restore();
  }
  word(g, s, t, W.clear - 0.15, 0.9, 'DOOR CLEAR', '#8BE36B', 140);
  if (t > B.leoRespawn && t < W.walked - 0.3) tagOver(g, s, head(leo).add(V(0, 1.7, 0)), 'SIZE 1', 'rgba(232,80,60,.92)', '#ffffff', clamp((t - B.leoRespawn) / 0.2), pop(t, W.tinyAgain - 0.1, 0.2, 2.5));
  word(g, s, t, W.tinyAgain - 0.1, 1.0, 'TINY AGAIN', '#FF9E80', 140);
  word(g, s, t, W.free - 0.2, 1.0, 'FOR FREE', '#7FE3DD', 150);
  if (t > B.grab && t < W.victory - 0.3) bigText(g, s, 'LEO WINS!', 540, 1060, 150, '#FFD23F', { k: pop(t, B.grab, 0.2, 2.6), rot: -0.05 });
  word(g, s, t, B.vhop, 0.9, 'POP!', '#8BE36B', 190, 740);
  if (t > W.small - 0.1 && t < W.nextGame - 0.3) bigText(g, s, 'STUCK', 540, 1060, 160, '#ff4d5e', { k: pop(t, W.small - 0.1), rot: 0.05 });
  // Next game teaser card.
  if (t > W.nextGame - 0.25 && t < B.cta) {
    const k = pop(t, W.nextGame - 0.25, 0.3, 2);
    g.save(); g.translate(540 * s, 760 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -420 * s, -130 * s, 840 * s, 260 * s, 40 * s); g.fillStyle = 'rgba(21,36,53,.94)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#7FE3DD'; g.stroke();
    g.font = `${54 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7FE3DD'; g.fillText('NEXT GAME', 0, -60 * s);
    g.font = `${74 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('EVERY STEP =', 0, 15 * s); g.fillStyle = '#FFD23F'; g.fillText('FASTER', 0, 85 * s); g.restore();
  }
  // Call to action end card.
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -190 * s, 840 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'PART 2: EVERY STEP = FASTER', 540, 520, 56, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k: k2 });
  }
  flash(g, s, t >= B.break && t < B.break + 0.15 ? 0.4 * (1 - (t - B.break) / 0.15) : t >= B.vhop && t < B.vhop + 0.12 ? 0.35 : t >= B.hookPop && t < B.hookPop + 0.1 ? 0.3 : 0, '#ffffff');
  if (SHOT === 'break' && t > B.break) speedLines(g, s, t, 0.45, { cx: 540, cy: 900 });
  if (SHOT === 'step' || SHOT === 'stride' || SHOT === 'maxStomp') speedLines(g, s, t, 0.18, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max });
