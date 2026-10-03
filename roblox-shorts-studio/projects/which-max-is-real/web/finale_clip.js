// Which Max Is Real? (After Hours, Part 2 of 2: the finale). Web renderer + Roblox R6 pack + the After Hours horror kit,
// in Part 1's set. Two identical Maxes; Mia, who was spectating, exposes the mirror ("raise your right hand"); it comes
// for her, Max jumps between them and walks backwards so the mirror backs towards the EXIT door; one step from the door
// it fights it; Max sprints backwards, the mirror is flung through the doorway, Mia slams the door. Two players online.
// Max waves goodbye; nothing waves back. Story logic and timing: web/timeline.js; beats: web/beats.js.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { part } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { horrorAsset, horrorLighting, replacePanel } from '../../../web/lib/horror.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { W } from './beats.js';
import * as TL from './timeline.js';

export const meta = { seconds: Math.ceil((W.end + 0.55) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Which Max Is Real' };
export const sky = { zenith: '#1d2c36', horizon: '#273a46', below: '#1a252d', fog: '#273a46' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const P = (p, y = 0) => V(p[0], y, p[1]);
const { T, EVENTS: E } = TL;

// ---------- shots (real time) ----------
const SHOTS = [
  [0, 'hook'], [W.mia - 0.25, 'mia'], [W.mirrors - 0.3, 'mirror'], [W.order - 0.3, 'order'], [W.leftMax - 0.4, 'hands'],
  [W.star - 0.3, 'star'], [W.saidLeft - 0.25, 'answer'], [W.stared - 0.3, 'stare'], [W.came - 0.25, 'came'],
  [W.whispered - 0.25, 'whisper'], [W.step1 - 0.35, 'steps'], [W.oneStep - 0.3, 'stopped'], [W.sprinted - 0.25, 'sprint'], [W.hasTo - 0.35, 'pull'],
  [W.slammed - 0.6, 'slam'], [W.updated - 0.25, 'list'], [W.waved - 0.35, 'wave'], [W.nothing - 0.15, 'nothing'],
  [E.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, max, copy, mia, door, cam, SHOT = 'hook', lamps = {};
export async function setup(stage) {
  const { scene } = stage;
  horrorLighting(stage, 'normal');
  const MAXFACES = ['scared', 'neutral', 'shocked', 'determined', 'angry', 'evil_grin', 'sad'];
  [max, copy, mia] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: MAXFACES }), loadRobloxCharacter('Max', { expressions: MAXFACES }),
    loadRobloxCharacter('Mia', { expressions: ['suspicious', 'determined', 'scared', 'angry', 'neutral', 'shocked'] }),
  ]);
  scene.add(max.root, copy.root, mia.root);
  for (const n of ['idle', 'walk', 'run', 'push']) A[n] = await loadAnimation(n);

  // Part 1's set: lobby with the back wall rebuilt around the EXIT door at x = 0, the corridor behind it.
  const lobby = (await horrorAsset('horror_lobby')).root; scene.add(lobby);
  for (const [name, h, y, d] of [['BackWall', 9, 4.5, 0.4], ['BackSkirt', 0.6, 0.3, 0.5], ['BackRail', 0.17, 2.7, 0.45]]) {
    const m = lobby.getObjectByName(name); if (!m) continue; m.visible = false;
    const mat = [].concat(m.material)[0];
    for (const [x0, x1] of [[-10, -3.5], [3.5, 10]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, d), mat); b.position.set((x0 + x1) / 2, y, -8); b.castShadow = b.receiveShadow = true; scene.add(b);
    }
    if (name === 'BackWall') { const top = new THREE.Mesh(new THREE.BoxGeometry(7, 1.5, d), mat); top.position.set(0, 8.25, -8); scene.add(top); }
  }
  replacePanel(lobby, 'ExitFace', 'EXIT  →', { background: '#0f3a2c', foreground: '#7dffb8' });
  replacePanel(lobby, 'NoticeFace', 'PLAYERS ONLINE\n2');
  const d = await horrorAsset('horror_door'); door = d; d.root.position.set(0, 0, TL.DOOR_Z); scene.add(d.root);
  const corridor = (await horrorAsset('horror_corridor')).root; corridor.position.set(0, 0, -21); scene.add(corridor);
  const apron = part(22, 0.35, 14, '#1e2a33', { radius: 0.02, clearcoat: 0 }); apron.position.set(0, 0, 15); scene.add(apron);

  const pl = (name, color, x, y, z, i, dist = 26) => { const l = new THREE.PointLight(color, i, dist, 1.4); l.position.set(x, y, z); scene.add(l); lamps[name] = l; l.userData.base = i; };
  pl('lobbyL', '#ffcf8a', -7, 7.2, -6.8, 70); pl('lobbyR', '#ffcf8a', 7, 7.2, -6.8, 70); pl('lobbyFront', '#9fd8e6', 0, 7.5, 6, 35);
  pl('cor1', '#ffd9a0', 0, 8.0, -13, 55, 20); pl('cor2', '#ffd9a0', 0, 8.0, -21, 40, 20); pl('cor3', '#d8f3ff', 0, 8.0, -27, 30, 16);
}

// ---------- actors ----------
const ARM = new THREE.Euler();
function raiseArm(a, k) { ARM.set(0.1 * k, 0, -2.45 * k, 'XYZ'); a.bones['Arm.R'].quaternion.setFromEuler(ARM); }   // one arm up (allowed)
function place(a, s, t) {
  a.root.visible = s.visible !== false;
  a.root.position.copy(P(s.pos)); a.root.rotation.set(0, s.heading, 0); a.root.scale.set(s.mirror ? -1 : 1, 1, 1);
  robloxPose(a, s.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  if (s.raise) raiseArm(a, s.raise);
  if (s.wave) waveArm(a, t, 'R');
  if (s.headTurn) a.bones.Head.rotateY(Math.PI * s.headTurn);
  if (s.lean) a.root.rotateX(s.lean);                                                           // braced, leaning away
  if (s.shake) { a.bones.Head.rotateZ(0.12 * s.shake * Math.sin(t * 47)); a.root.position.x += 0.06 * s.shake * Math.sin(t * 61); a.bones.Torso.rotateZ(0.04 * s.shake * Math.sin(t * 37)); }
  a.root.updateMatrixWorld(true);
  if (s.fall) { a.root.rotateX(-Math.PI / 2 * s.fall); a.root.position.y = 0.5 * s.fall; }   // tips over onto its back
  else a.root.position.y -= a.soleHeight();
  a.root.position.y += s.hop || 0;
  setExpression(a, s.face);
  a.root.updateMatrixWorld(true);
}
const head = (a) => a.bones.Head.localToWorld(V(0, 0.4, 0));
const torso = (a) => a.bones.Torso.localToWorld(V(0, 1, 0));
const hand = (a) => a.bones['Arm.R'].localToWorld(V(-0.5, -1.7, 0));
const star = (a) => a.bones.Torso.localToWorld(V(0.48, 1.45, 0.52));

// ---------- camera ----------
function look(stage, p, tg, fov = 40, roll = 0) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, 0, tg.z), 26);
}
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
function frame(stage, tg, az, el, w, fov = 40) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov); }
// Frame actors (bounding sphere); past maxD the lens widens instead of backing through a wall.
function fit(stage, actors, az, el, { fov = 40, pad = 1.1, maxD = 5.4, aim = V(0, 0, 0) } = {}) {
  const box = new THREE.Box3(); for (const a of actors) { a.root.updateMatrixWorld(true); box.expandByObject(a.root); }
  const sph = box.getBoundingSphere(new THREE.Sphere()), half = (f) => Math.atan(Math.tan((f * Math.PI) / 360) * (9 / 16));
  let d = (sph.radius * pad) / Math.sin(half(fov));
  if (d > maxD) { const h = Math.asin(Math.min(0.95, (sph.radius * pad) / maxD)); fov = (Math.atan(Math.tan(h) * (16 / 9)) * 360) / Math.PI; d = maxD; }
  orbit(stage, sph.center.clone().add(aim), az, el, d, Math.min(fov, 95));
}
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);
const shake = (t, at, k, dur = 0.35) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples(t) { const id = shotAt(SHOTS, t).shot.id; return ['came', 'sprint', 'pull'].includes(id) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const flickerAt = (t, rate = 18) => (hash(Math.floor(t * rate)) > 0.55 ? 1 : 0.15);

export function update(t, stage) {
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  place(max, TL.maxAt(t), t); place(copy, TL.copyAt(t), t); place(mia, TL.miaAt(t), t);
  door.controls.door(TL.doorAt(t));

  const tense = t > W.came - 0.3 && t < W.slammed + 0.4;
  horrorLighting(stage, tense ? 'warning' : 'normal');
  for (const l of Object.values(lamps)) l.intensity = l.userData.base;
  lamps.cor3.intensity = t < E.lightOn ? 0 : lamps.cor3.userData.base * (t < E.lightOn + 0.3 ? flickerAt(t, 24) : 1);   // Mia in the dark
  if (t > E.last && t < E.sprint) lamps.cor1.intensity *= 0.4 + 0.6 * flickerAt(t, 14);                                 // it fights the mirror
  if (t > E.nothing + 0.6 && t < E.nothing + 0.9) { lamps.lobbyL.intensity *= flickerAt(t, 20); lamps.lobbyR.intensity *= flickerAt(t + 1, 20); }
  stage.bloom.strength = 0.35;

  const mh = head(max), ch = head(copy), ih = head(mia);
  switch (shot.id) {
    case 'hook': look(stage, V(-0.8, 4.4, lerp(-1.2, -2.4, u)), V(-0.8, 3.4, -13.5), 62); break;           // through the doorway: two Maxes
    case 'mia': look(stage, V(-0.7, 4.6, -12.4), ih.clone().add(V(0, -0.8, 0)), lerp(34, 28, u)); break;     // between their heads: someone at the far end
    case 'mirror': look(stage, V(-0.8, 4.4, -2.6), V(-0.8, 3.6, -13.5), 58); break;
    case 'order': frame(stage, ih.clone().add(V(0, -0.3, 0)), 0.12, 0.04, 2.8, 50); break;
    case 'hands': look(stage, V(-0.8, 4.6, -4.2), V(-0.8, 4.6, -13.5), 56); break;
    case 'star': frame(stage, star(copy), 0.05, 0.02, lerp(4.2, 2.6, easeInOut(u)), 40); break;
    case 'answer': look(stage, V(-0.8, 4.4, -3.0), V(-0.8, 3.8, -13.5), 58); break;
    case 'stare': frame(stage, ch.clone().add(V(0, -0.2, 0)), 0.1, 0.03, lerp(3.4, 2.8, u), 40); break;          // the head turns all the way round
    case 'came': fit(stage, [copy, max], Math.PI / 2 - 0.3, 0.12, { maxD: 5.0, pad: 1.0 }); break;           // side on: it goes for Mia, Max cuts in
    case 'whisper': look(stage, V(-4.6, 4.3, -16.4), V(2.2, 3.9, -19.8), 48); break;
    case 'steps': look(stage, mh.clone().add(V(-1.8, 0.9, -3.8)), ch.clone().add(V(0, -0.8, 0)), 46); break;      // over Max's shoulder: it backs towards the door
    case 'stopped': frame(stage, ch.clone().add(V(0, -0.4, 0)).add(shake(t, E.last, 0.08, 2)), Math.PI, 0.03, lerp(4.2, 3.0, u), 40); break;
    case 'sprint': look(stage, V(2.2, 4.8, -6.4), V(0.7, 3.2, -22), 40); break;                                  // over its shoulder: Max sprints backwards
    case 'pull': look(stage, V(2.6, 3.4, 7.5).add(shake(t, E.through, 0.15)), V(0.7, 3.2, lerp(-8.5, -4, easeInOut(clamp((t - E.through + 0.3) / 0.8)))), lerp(28, 42, easeInOut(clamp((t - E.through + 0.3) / 0.8)))); break;   // lobby side: dragged, then flung out
    case 'slam': look(stage, V(-3.2, 4.4, -23.0).add(shake(t, E.slam, 0.15)), V(2.0, 3.6, -11.6), 56); break;
    case 'list': look(stage, V(-2.6, 4.4, -24), V(1.2, 3.8, -14), 46); break;
    case 'wave': look(stage, V(2.4, 4.6, -19.5), V(0.2, 3.8, -9), 44); break;
    default: look(stage, V(-3.2, 4.6, lerp(8, 6.5, clamp((t - E.nothing) / 6))), V(0, 3.6, -8), 40);          // lobby side: nothing there
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05 }; }
function nameTag(g, s, a, name) {
  if (!a.root.visible) return; const p = project(head(a).add(V(0, 1.15, 0)), s); if (!p.on) return;
  const d = cam.position.distanceTo(head(a)), size = clamp(260 / d, 18, 54) * s;
  g.save(); g.font = `800 ${size}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(20,24,30,.85)'; g.lineWidth = size * 0.18; g.strokeText(name, p.x, p.y); g.fillStyle = '#ffffff'; g.fillText(name, p.x, p.y); g.restore();
}
const hash2 = (n) => hash(n + 0.5);
function playerList(g, s, t, names, { k = 1, glitch = 0, highlight = -1, joined = -1 } = {}) {
  g.save(); g.translate(1020 * s, 250 * s); g.scale(k, k);
  if (glitch) g.translate((hash2(Math.floor(t * 30)) - 0.5) * 40 * glitch * s, 0);
  const w = 470, rh = 66, h = 92 + names.length * rh;
  roundRect(g, -w * s, 0, w * s, h * s, 18 * s); g.fillStyle = 'rgba(10,18,24,.86)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#78e4d8'; g.stroke();
  g.font = `800 ${34 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#78e4d8';
  g.fillText(`PLAYERS ONLINE: ${names.length}`, (-w + 28) * s, 48 * s);
  names.forEach((n, i) => {
    const y = 92 + i * rh + rh / 2;
    if (i === highlight) { roundRect(g, (-w + 12) * s, (y - rh / 2 + 6) * s, (w - 24) * s, (rh - 12) * s, 10 * s); g.fillStyle = 'rgba(255,60,80,.28)'; g.fill(); }
    if (i === joined) { roundRect(g, (-w + 12) * s, (y - rh / 2 + 6) * s, (w - 24) * s, (rh - 12) * s, 10 * s); g.fillStyle = 'rgba(120,228,216,.22)'; g.fill(); }
    g.fillStyle = '#e8f4ed'; g.font = `800 ${40 * s}px Montserrat`; g.fillText(n, (-w + 86) * s, (y + 2) * s);
    g.fillStyle = '#4b6470'; g.fillRect((-w + 30) * s, (y - 18) * s, 36 * s, 36 * s);
  });
  if (glitch > 0.5) { g.fillStyle = 'rgba(120,228,216,.35)'; for (let i = 0; i < 4; i++) g.fillRect(-w * s, hash2(Math.floor(t * 30) + i) * h * s, w * s, 5 * s); }
  g.restore();
}
function label(g, s, p3, text, { bg = 'rgba(10,18,24,.9)', edge = '#78e4d8', fg = '#ffffff', size = 60, k = 1, dy = 0 } = {}) {
  const p = project(p3, s); if (!p.on || k <= 0) return;
  g.save(); g.translate(p.x, p.y + dy * s); g.scale(k, k); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 46 * s;
  roundRect(g, -w / 2, -size * 0.75 * s, w, size * 1.45 * s, 20 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = edge; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
function ring(g, s, p3, r, color, k = 1) {
  const p = project(p3, s); if (!p.on || k <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = 9 * s; g.shadowColor = color; g.shadowBlur = 18 * s;
  g.beginPath(); g.arc(p.x, p.y, r * s * k, 0, Math.PI * 2); g.stroke(); g.restore();
}
function vignette(g, s, amount, color = '0,0,0') {
  const r = g.createRadialGradient(540 * s, 960 * s, 380 * s, 540 * s, 960 * s, 1150 * s);
  r.addColorStop(0, `rgba(${color},0)`); r.addColorStop(1, `rgba(${color},${amount})`); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
}
function bigText(g, s, text, x, y, size, color, k = 1, sub = null) {
  g.save(); g.translate(x * s, y * s); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.strokeStyle = '#0a1218'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0);
  if (sub) { g.font = `${size * 0.7 * s}px "Luckiest Guy"`; g.strokeText(sub, 0, size * 1.0 * s); g.fillStyle = '#78e4d8'; g.fillText(sub, 0, size * 1.0 * s); }
  g.restore();
}

export function overlay(g, s, t) {
  const tense = t > W.came - 0.3 && t < W.slammed + 0.4;
  vignette(g, s, tense ? 0.55 : 0.45, tense ? '40,0,8' : '0,0,0');
  if (SHOT === 'sprint' || (SHOT === 'pull' && t > E.through - 0.1 && t < E.through + 0.6)) speedLines(g, s, t, 0.3, { cx: 540, cy: 900 });
  // Name tags: both Maxes say "Max" until the copy is exposed.
  if (t < W.nothing - 0.15) { nameTag(g, s, max, 'Max'); if (mia.root.visible && t > E.lightOn + 0.3) nameTag(g, s, mia, 'Mia'); if (copy.root.visible && !(TL.copyAt(t).fall > 0.3)) nameTag(g, s, copy, 'Max'); }

  // The player list: 2 (Max, Max) -> Mia was spectating (3) -> after the slam, 2 (Max, Mia).
  if (t < W.mirrors + 0.2) {
    const names = t < E.lightOn ? ['Max', 'Max'] : ['Max', 'Max', 'Mia (spectating)'];
    playerList(g, s, t, names, { joined: t > E.lightOn && t < E.lightOn + 1.5 ? 2 : -1 });
  }
  if (t > W.updated - 0.15 && t < E.cta) {
    const names = t < E.gone ? ['Max', 'Max', 'Mia'] : ['Max', 'Mia'];
    playerList(g, s, t, names, { k: easeOutBack(clamp((t - W.updated + 0.15) / 0.25), 1.6), glitch: t > E.gone - 0.15 && t < E.gone + 0.3 ? 1 : 0 });
  }
  // Opening: Part 1's question, still open. PART 2 tag.
  if (t < W.mia - 0.25) {
    label(g, s, head(max).add(V(0, 1.6, 0)), 'LEFT', { size: 56 }); label(g, s, head(copy).add(V(0, 1.6, 0)), 'RIGHT', { size: 56 });
    g.save(); g.translate(80 * s, 260 * s); g.font = `${48 * s}px "Luckiest Guy"`; roundRect(g, 0, 0, 220 * s, 80 * s, 20 * s); g.fillStyle = '#78e4d8'; g.fill();
    g.fillStyle = '#0a1218'; g.textBaseline = 'middle'; g.fillText('PART 2', 24 * s, 44 * s); g.restore();
  }
  if (t > W.late - 0.1 && t < W.late + 1.3 && SHOT === 'hook') bigText(g, s, '0.0s DELAY', 540, 560, 84, '#ffffff', easeOutBack(clamp((t - W.late + 0.1) / 0.2), 2));
  // It mirrors you: a dashed mirror line between them.
  if (SHOT === 'mirror' && t > W.mirrors - 0.1) {
    const a = project(V(-0.8, 0.2, -13.5), s), b = project(V(-0.8, 7.0, -13.5), s), k = clamp((t - W.mirrors + 0.1) / 0.4);
    g.save(); g.strokeStyle = '#78e4d8'; g.lineWidth = 8 * s; g.setLineDash([28 * s, 18 * s]); g.shadowColor = '#78e4d8'; g.shadowBlur = 16 * s;
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); g.stroke(); g.restore();
    bigText(g, s, 'MIRROR', 540, 520, 96, '#78e4d8', easeOutBack(clamp((t - W.mirrors - 0.2) / 0.2), 2));
  }
  // The test: ring the raised hands; RIGHT vs LEFT.
  if (SHOT === 'hands') {
    const k1 = easeOutBack(clamp((t - W.leftMax) / 0.2), 2), k2 = easeOutBack(clamp((t - W.raisedLeft) / 0.2), 2);
    ring(g, s, hand(max), 70, '#8BE36B', k1); label(g, s, hand(max).add(V(0, 1.3, 0)), 'RIGHT', { edge: '#8BE36B', k: k1, size: 50 });
    ring(g, s, hand(copy), 70, '#ff4d5e', k2); label(g, s, hand(copy).add(V(0, 1.3, 0)), 'LEFT', { edge: '#ff4d5e', k: k2, size: 50 });
  }
  if (SHOT === 'star') ring(g, s, star(copy), 64, '#ff4d5e', easeOutBack(clamp((t - W.star) / 0.25), 2));
  if (SHOT === 'answer') {
    const k = easeOutBack(clamp((t - W.saidLeft) / 0.2), 2), k2 = easeOutBack(clamp((t - W.wereRight) / 0.2), 2);
    label(g, s, head(max).add(V(0, 1.6, 0)), 'REAL', { edge: '#8BE36B', fg: '#8BE36B', k, size: 58 });
    label(g, s, head(copy).add(V(0, 1.6, 0)), 'COPY', { edge: '#ff4d5e', fg: '#ff4d5e', k: k2, size: 58 });
  }
  // It fights the mirror: its delay readout breaks.
  if (SHOT === 'stopped' && t > E.last) {
    const vals = ['0.0s', '+0.2s', '+0.5s', 'ERR', '0.0s', '+0.1s'];
    label(g, s, head(copy).add(V(0, 1.5, 0)), vals[Math.floor(t * 9) % vals.length], { edge: '#ff4d5e', fg: '#ff4d5e', size: 50, dy: (hash(Math.floor(t * 30)) - 0.5) * 12 });
  }
  if (t > E.slam && t < E.slam + 0.25) flash(g, s, 0.35 * (1 - (t - E.slam) / 0.25), '#ffffff');
  if (t > E.gone - 0.05 && t < E.gone + 0.25) flash(g, s, 0.3, '#78e4d8');

  // Call to action: what next + follow.
  if (t >= E.cta) {
    const a = t - E.cta, k2 = easeOutBack(clamp(a / 0.3), 1.6);
    g.save(); g.translate(540 * s, 420 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(10,18,24,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#78e4d8'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${62 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('WHAT SHOULD WE MAKE NEXT?', 0, -100 * s);
    g.font = `${48 * s}px "Luckiest Guy"`; g.fillStyle = '#78e4d8'; g.fillText('COMMENT BELOW', 0, -36 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.fillText('@viralrobloxgames', 0, 34 * s);
    roundRect(g, -150 * s, 78 * s, 300 * s, 74 * s, 18 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
  }
}

export const cast = () => ({ max, copy, mia });
