// The Server Says One (After Hours, horror pilot 1). Web renderer + Roblox R6 pack + the After Hours horror kit.
// Max is alone in an empty lobby, but someone is standing in front of him: the Unlisted, his mirror image half a second
// late. He fakes left, cuts right, barges through the EXIT door and slams it; the copy hits the other side. The player
// list says one player... then two: Max, and Max. Story logic and timing live in web/timeline.js (shared with the sound
// cues); beats come from web/beats.js (source/beats.py, the narration's word timings).
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { part } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { horrorAsset, horrorEntity, horrorLighting, replacePanel } from '../../../web/lib/horror.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { W } from './beats.js';
import * as T from './timeline.js';

export const meta = { seconds: Math.ceil((W.end + 0.55) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Server Says One' };
export const sky = { zenith: '#1d2c36', horizon: '#273a46', below: '#1a252d', fog: '#273a46' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const P = (p, y = 0) => V(p[0], y, p[1]);
const { G, E, D } = T;

// ---------- shots (real time) ----------
const SHOTS = [
  [0, 'hook'], [W.front + 0.5, 'face'], [W.light + 0.95, 'wave'], [W.waveBack - 0.3, 'waveBack'], [W.step - 0.45, 'steps'],
  [W.copying - 0.35, 'copying'], [W.every - 0.25, 'closer'], [W.door - 0.35, 'door'], [W.copyCan - 0.3, 'think'],
  ...T.CHASE.map(([id, a]) => [a, id]),
  [W.hit - 0.12, 'hit'], [W.silence - 0.3, 'silence'], [W.checked - 0.25, 'list'], [W.two - 0.2, 'two'],
  [W.max2 - 0.3, 'reveal'], [E.dark[0] - 0.05, 'dark'], [E.twins, 'twins'], [W.which - 0.2, 'question'], [E.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, max, copy, ent, door, cam, SHOT = 'hook', lamps = {}, glow = {};
export async function setup(stage) {
  const { scene } = stage;
  horrorLighting(stage, 'normal');
  const MAXFACES = ['nervous', 'confused', 'scared', 'suspicious', 'determined', 'angry', 'shocked', 'neutral', 'blink'];
  [max, copy, ent] = await Promise.all([loadRobloxCharacter('Max', { expressions: MAXFACES }), loadRobloxCharacter('Max', { expressions: ['neutral', 'shocked', 'scared'] }), horrorEntity()]);
  scene.add(max.root, copy.root, ent.root);
  for (const n of ['idle', 'walk', 'run', 'push', 'shock']) A[n] = await loadAnimation(n);

  // Lobby, with the back wall rebuilt around an EXIT door at x = 0, and a corridor behind it.
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
  replacePanel(lobby, 'NoticeFace', 'PLAYERS ONLINE\n1');
  const d = await horrorAsset('horror_door'); door = d; d.root.position.set(0, 0, T.DOOR_Z); scene.add(d.root);
  const corridor = (await horrorAsset('horror_corridor')).root; corridor.position.set(0, 0, -21); scene.add(corridor);
  const apron = part(22, 0.35, 14, '#1e2a33', { radius: 0.02, clearcoat: 0 }); apron.position.set(0, 0, 15); scene.add(apron);

  // Practical lights: warm lobby lamps, corridor tubes (the far one flickers on for the reveal).
  const pl = (name, color, x, y, z, i, dist = 26) => { const l = new THREE.PointLight(color, i, dist, 1.4); l.position.set(x, y, z); scene.add(l); lamps[name] = l; l.userData.base = i; };
  pl('lobbyL', '#ffcf8a', -7, 7.2, -6.8, 70); pl('lobbyR', '#ffcf8a', 7, 7.2, -6.8, 70); pl('lobbyFront', '#9fd8e6', 0, 7.5, 6, 35);
  pl('cor1', '#ffd9a0', 0, 8.0, -13, 55, 20); pl('cor2', '#ffd9a0', 0, 8.0, -21, 40, 20); pl('cor3', '#d8f3ff', 0, 8.0, -27, 18, 16);

  // Cyan chest signal: the Unlisted's mark, also on the copy of Max at the end.
  for (const [k, a] of [['ent', ent], ['copy', copy]]) {
    const sq = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.04), new THREE.MeshStandardMaterial({ color: '#78e4d8', emissive: '#78e4d8', emissiveIntensity: 3.2 }));
    sq.position.set(0, 1.3, 0.53); a.bones.Torso.add(sq);
    const l = new THREE.PointLight('#78e4d8', k === 'copy' ? 1.2 : 3, 5, 1.6); l.position.set(0, 1.3, 1.0); a.bones.Torso.add(l); glow[k] = { sq, l };
  }
}

// ---------- actors ----------
function place(a, s, t, waveSide) {
  a.root.visible = s.visible !== false;
  a.root.position.copy(P(s.pos)); a.root.rotation.set(0, s.heading, 0); a.root.scale.set(s.mirror ? -1 : 1, 1, 1);
  robloxPose(a, s.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  if (s.wave) waveArm(a, t, waveSide);
  if (s.headTurn) a.bones.Head.rotateY(Math.PI * s.headTurn);
  if (s.lookDown) a.bones.Head.rotateX(s.lookDown);
  a.root.updateMatrixWorld(true); a.root.position.y -= a.soleHeight();
  setExpression(a, s.face);
  a.root.updateMatrixWorld(true);
}
const head = (a) => a.bones.Head.localToWorld(V(0, 0.4, 0));
const torso = (a) => a.bones.Torso.localToWorld(V(0, 1, 0));

// The ending (after the bang) is played in real time.
function maxEnd(t, g) {
  const s = T.maxAt(g);
  if (t >= E.stepOff) {
    const u = clamp((t - E.stepOff) / (2 / 12)); s.pos = [T.BACK[0], lerp(T.BACK[1], T.FWD[1], u)];
    s.layers = u > 0 && u < 1 ? [['walk', u * 1.9 / T.STRIDE]] : [['idle', t]];
    s.face = t < W.two ? 'nervous' : 'scared';
    s.lookDown = t > W.checked - 0.1 && t < W.two + 0.2 ? 0.35 : 0;              // checking the list
    if (t > W.max2 - 0.05) { const a = t - W.max2 + 0.05; s.layers = [['shock', Math.min(a * 0.8, 0.3), 1, false]]; s.face = 'shocked'; }
  }
  if (t >= E.twins) Object.assign(s, twin(t, T.TWINS.real), { mirror: false });
  return s;
}
// Two of him: same pose, same idle phase, same face. They look at each other, then turn to us in perfect sync.
function twin(t, pos) {
  const k = 1 - easeInOut(clamp((t - E.sync) / 0.18));
  return { pos, heading: 0, layers: [['idle', t]], face: t < E.sync ? 'scared' : 'neutral', headTurn: 0.17 * k, lookDown: 0, wave: 0, visible: true };
}
function copyMaxAt(t) {
  const s = { pos: T.COPY_MAX, heading: 0, layers: [['idle', t]], face: 'neutral', visible: t > E.copyOn };
  const a = t - (W.max2 - 0.05) - D;                     // flinches with Max, half a second late
  if (a > 0) { s.layers = [['shock', Math.min(a * 0.8, 0.3), 1, false]]; s.face = 'shocked'; }
  if (t >= E.twins) Object.assign(s, twin(t, T.TWINS.copy), { mirror: true });   // its mirror image: the hoodie star flips
  return s;
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40, roll = 0) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, 0, tg.z), 26);
}
function orbit(stage, tg, az, el, d, fov = 40, roll = 0) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov, roll); }
function frame(stage, tg, az, el, w, fov = 40, roll = 0) { orbit(stage, tg, az, el, w / (2 * Math.tan((fov * Math.PI) / 360) * (9 / 16)), fov, roll); }
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);
// Frame actors (bounding sphere of their bodies) from a direction; past maxD the lens widens instead of backing
// through a wall.
function fit(stage, actors, az, el, { fov = 40, pad = 1.12, maxD = 11, aim = V(0, 0, 0) } = {}) {
  const box = new THREE.Box3(); for (const a of actors) { a.root.updateMatrixWorld(true); box.expandByObject(a.root); }
  const sph = box.getBoundingSphere(new THREE.Sphere()), half = (f) => Math.atan(Math.tan((f * Math.PI) / 360) * (9 / 16));
  let d = (sph.radius * pad) / Math.sin(half(fov));
  if (d > maxD) { const h = Math.asin(Math.min(0.95, (sph.radius * pad) / maxD)); fov = (Math.atan(Math.tan(h) * (16 / 9)) * 360) / Math.PI; d = maxD; }
  orbit(stage, sph.center.clone().add(aim), az, el, d, fov);
}

const shake = (t, at, k, dur = 0.35) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));

export function samples(t) { const id = shotAt(SHOTS, t).shot.id; return ['cut', 'cutLow', 'ran', 'barge', 'dove'].includes(id) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// Lighting per section; flicker is deterministic.
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
function flickerAt(t, rate = 18) { return hash(Math.floor(t * rate)) > 0.55 ? 1 : 0.15; }

export function update(t, stage) {
  const g = T.gameAt(t);
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const ending = t >= W.hit - 0.12;
  const ms = ending ? maxEnd(t, g) : T.maxAt(g), es = T.copyAt(g);
  place(max, ms, t, 'R'); place(ent, es, t, 'L');
  ent.root.visible = !ending || ['slam'].includes(SHOT);
  place(copy, copyMaxAt(t), t, 'R');
  door.controls.door(T.doorAt(g));

  // Light: calm night, warning (warmer, darker) for the chase, then flicker for the reveal.
  const chase = T.CHASE.some(([id]) => id === SHOT);
  horrorLighting(stage, chase ? 'warning' : 'normal');
  for (const l of Object.values(lamps)) l.intensity = l.userData.base;
  if (t > E.flicker[0] && t < E.flicker[1]) for (const l of Object.values(lamps)) l.intensity = l.userData.base * flickerAt(t);
  if (t > W.silence - 0.3 && t < W.checked) lamps.cor1.intensity *= 0.55 + 0.45 * flickerAt(t + 3, 7);
  lamps.cor3.intensity = t > E.copyOn ? lamps.cor3.userData.base * (t < E.copyOn + 0.35 ? flickerAt(t, 24) : 1) : 0;
  glow.copy.sq.visible = glow.copy.l.visible = copy.root.visible && t < E.twins;     // it isn't marked any more
  if (t > E.dark[0] && t < E.dark[1]) for (const l of Object.values(lamps)) l.intensity = 0;
  if (t > E.twins && t < E.twins + 0.35) for (const l of Object.values(lamps)) l.intensity *= flickerAt(t, 22);
  stage.bloom.strength = 0.35;

  const mh = head(max), eh = head(ent), mid = mh.clone().lerp(eh, 0.5);
  switch (shot.id) {
    case 'hook': {         // over Max's shoulder: a faceless player straight ahead, the EXIT door behind it
      const k = easeOut(clamp(t / (shot.end - shot.start)));
      look(stage, mh.clone().add(V(lerp(2.3, 2.0, k), lerp(0.2, 0.1, k), lerp(5.6, 4.8, k))), eh.clone().add(V(0.3, -1.0, 0)), 46); break;
    }
    case 'face': {         // push in on the blank face, then tilt to the light in its chest
      const k = easeInOut(inv(W.light - 0.35, W.light + 0.25, t));
      frame(stage, eh.clone().lerp(torso(ent).add(V(0, 0.2, 0)), k), 0, 0.03, lerp(lerp(3.4, 2.7, u), 3.4, k), 32); break;
    }
    case 'wave': look(stage, V(5.6, 3.8, 13.6), V(-0.8, 3.0, -1.5), 46); break;                                // behind Max: the wave, the copy beyond
    case 'waveBack': frame(stage, torso(ent).add(V(0, 0.6, 0)), 0.35, 0.06, lerp(7, 6.2, u), 36); break;     // ...it waves back, late
    case 'steps': frame(stage, mid.clone().add(V(0, -1.4, 0)), 0.7, 0.45, 17, 40); break;                     // both step left
    case 'copying': look(stage, eh.clone().add(V(-2.6, 1.0, -5.0)), mh.clone().add(V(0, -0.3, 0)), 34); break;  // over its shoulder
    case 'closer': fit(stage, [max, ent], Math.PI / 2, 0.05, { maxD: 10.5, pad: 1.05 }); break;                   // side on: the gap shrinking
    case 'door': look(stage, V(lerp(3.4, 2.6, u), lerp(10.5, 9.5, u), lerp(16, 14.5, u)), V(-0.6, 3.2, -5), 40); break;   // door behind it
    case 'think': frame(stage, mh.clone().add(V(0, -0.15, 0)), Math.PI + 0.2, 0.04, lerp(3.6, 3.1, u), 34); break;
    // --- chase ---
    case 'fake': fit(stage, [max, ent], 0.15, 0.32, { maxD: 13 }); break;
    case 'fakeCopy': fit(stage, [ent, max], 0.55, 0.1, { maxD: 9, pad: 0.9, aim: V(0.4, 0, -1.2) }); break;
    case 'cut': fit(stage, [max, ent], 0.75, 0.14, { maxD: 10, pad: 1.0 }); break;
    case 'cutLow': { const p = torso(max); look(stage, V(4.8, 1.1, -3.2), p.clone().lerp(torso(ent), 0.25), 46, 0.05); break; }
    case 'finishing': fit(stage, [ent, max], lerp(0.2, 1.0, easeInOut(u)), 0.12, { maxD: 10, pad: 0.95 }); break;    // bullet time
    case 'ran': fit(stage, [max, ent], 0.45, 0.16, { maxD: 13, pad: 1.0 }); break;
    case 'barge': look(stage, V(4.8, 4.4, 17), V(0, 3.6, -8), 22); break;                                     // long lens down the lobby
    case 'dove': look(stage, V(3.6, 4.4, -23), V(-0.2, 3.4, -9.5).add(shake(t, T.EVENTS.slam, 0.12)), 50); break;   // corridor side
    case 'slam': look(stage, V(-1.3, 4.5, 19).add(shake(t, T.EVENTS.hit - 0.02, 0.25)), V(-1.6, 3.9, 0), 30); break;   // its face, then its back
    // --- after the bang ---
    case 'hit': look(stage, V(3.2, 4.6, -17.2).add(shake(t, T.EVENTS.hit, 0.3, 0.5)), V(0.4, 3.8, -9).add(shake(t, T.EVENTS.hit, 0.2, 0.5)), 46); break;
    case 'silence': frame(stage, mh.clone().add(V(0, -0.9, 0)), Math.PI, 0.06, lerp(7.5, 6.5, u), 40); break;
    case 'list': frame(stage, mh.clone().add(V(0, -0.2, 0)), Math.PI + 0.25, 0.08, lerp(4.2, 3.6, u), 36); break;
    case 'two': frame(stage, mh.clone().add(V(0, -0.1, 0)), Math.PI - 0.15, 0.04, lerp(3.4, 2.7, u), 34, 0.04 * Math.sin(t * 31) * (t < W.two + 0.4 ? 1 : 0)); break;
    case 'reveal': case 'dark': look(stage, V(2.9, 5.1, -9.0), head(copy).add(V(0, -1.6, 0)).lerp(V(0.4, 4.4, -11), 0.1), 46); break;   // over his shoulder: the far end
    case 'twins': look(stage, V(0, 4.4, lerp(-8.9, -9.7, u)), V(0, 4.6, -21), 60); break;                     // two of him
    case 'question': look(stage, V(0, 4.4, lerp(-9.7, -10.1, u)), V(0, 4.9, -21), 60); break;
    default: look(stage, V(0, 4.4, lerp(-10.1, -10.4, clamp((t - E.cta) / 3))), V(0, 4.9, -21), 60);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05 }; }
// Roblox-style display name over a player's head (the Unlisted has none).
function nameTag(g, s, a, name) {
  if (!a.root.visible) return; const p = project(head(a).add(V(0, 1.15, 0)), s); if (!p.on) return;
  const d = cam.position.distanceTo(head(a)), size = clamp(260 / d, 18, 54) * s;
  g.save(); g.font = `800 ${size}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(20,24,30,.85)'; g.lineWidth = size * 0.18; g.strokeText(name, p.x, p.y); g.fillStyle = '#ffffff'; g.fillText(name, p.x, p.y); g.restore();
}
// The player list: the story's one clue, always in the same place (top right, clear of captions and platform UI).
function playerList(g, s, t, names, { k = 1, glitch = 0, highlight = -1 } = {}) {
  g.save(); g.translate(1020 * s, 250 * s); g.scale(k, k);
  if (glitch) g.translate((hash(Math.floor(t * 30)) - 0.5) * 40 * glitch * s, 0);
  const w = 470, rh = 66, h = 92 + names.length * rh;
  roundRect(g, -w * s, 0, w * s, h * s, 18 * s); g.fillStyle = 'rgba(10,18,24,.86)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#78e4d8'; g.stroke();
  g.font = `800 ${34 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#78e4d8';
  g.fillText(`PLAYERS ONLINE: ${names.length}`, (-w + 28) * s, 48 * s);
  names.forEach((n, i) => {
    const y = 92 + i * rh + rh / 2;
    if (i === highlight) { roundRect(g, (-w + 12) * s, (y - rh / 2 + 6) * s, (w - 24) * s, (rh - 12) * s, 10 * s); g.fillStyle = 'rgba(255,60,80,.28)'; g.fill(); }
    g.fillStyle = '#e8f4ed'; g.font = `800 ${40 * s}px Montserrat`; g.fillText(n, (-w + 86) * s, (y + 2) * s);
    g.fillStyle = '#4b6470'; g.fillRect((-w + 30) * s, (y - 18) * s, 36 * s, 36 * s);       // avatar square
  });
  if (glitch > 0.5) { g.fillStyle = 'rgba(120,228,216,.35)'; for (let i = 0; i < 4; i++) g.fillRect(-w * s, hash(Math.floor(t * 30) + i) * h * s, w * s, 5 * s); }
  g.restore();
}
function tag(g, s, a, text, at, t) {
  const al = clamp((t - at) / 0.12) * (1 - inv(at + 0.9, at + 1.2, t)); if (al <= 0) return;
  const p = project(head(a).add(V(0, 1.3, 0)), s); if (!p.on) return;
  g.save(); g.globalAlpha = al; g.font = `800 ${40 * s}px Montserrat`; const w = g.measureText(text).width + 36 * s;
  roundRect(g, p.x - w / 2, p.y - 32 * s, w, 64 * s, 16 * s); g.fillStyle = 'rgba(10,18,24,.88)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#78e4d8'; g.stroke();
  g.fillStyle = '#78e4d8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, p.x, p.y + 2 * s); g.restore();
}
function vignette(g, s, amount, color = '0,0,0') {
  const r = g.createRadialGradient(540 * s, 960 * s, 380 * s, 540 * s, 960 * s, 1150 * s);
  r.addColorStop(0, `rgba(${color},0)`); r.addColorStop(1, `rgba(${color},${amount})`); g.fillStyle = r; g.fillRect(0, 0, 1080 * s, 1920 * s);
}

export function overlay(g, s, t) {
  const chase = T.CHASE.some(([id]) => id === SHOT);
  vignette(g, s, chase ? 0.55 : 0.45, chase ? '40,0,8' : '0,0,0');
  if (['cut', 'cutLow', 'ran', 'barge'].includes(SHOT)) speedLines(g, s, t, 0.3, { cx: 540, cy: 900 });
  if (t < W.which - 0.2 && !(t > E.dark[0] && t < E.dark[1])) { nameTag(g, s, max, 'Max'); if (t > E.copyOn) nameTag(g, s, copy, 'Max'); }

  // The clue: one player online (opening), then the list after the escape.
  if (t < W.light + 0.95) playerList(g, s, t, ['Max']);                       // on screen from frame 1
  if (t > W.checked - 0.1 && t < E.dark[0]) {
    const k = easeOutBack(clamp((t - W.checked + 0.1) / 0.25), 1.6);
    const names = t < W.two - 0.05 ? ['Max'] : t < W.max2 - 0.05 ? ['Max', '...'] : ['Max', 'Max'];
    const glitch = t > E.flicker[0] && t < E.flicker[1] ? 1 : 0;
    playerList(g, s, t, names, { k, glitch, highlight: t > W.max2 - 0.05 ? 1 : -1 });
  }
  // Half a second late: a small timer tag on the first copies.
  tag(g, s, ent, '+0.5s', T.EVENTS.copyWave, t); tag(g, s, ent, '+0.5s', T.EVENTS.copyStep, t);

  // Impact: a white hit on the bang, and a red pulse.
  if (t > T.EVENTS.hit && t < T.EVENTS.hit + 0.5) { flash(g, s, 0.55 * (1 - (t - T.EVENTS.hit) / 0.5), '#ffffff'); vignette(g, s, 0.6 * (1 - (t - T.EVENTS.hit) / 0.5), '140,0,20'); }
  if (t > E.copyOn && t < E.copyOn + 0.25) flash(g, s, 0.35, '#78e4d8');

  // Blackout: only its chest light, then that goes too.
  if (t > E.dark[0] && t < E.dark[1]) {
    g.fillStyle = 'rgba(2,4,6,.94)'; g.fillRect(0, 0, 1080 * s, 1920 * s);
    const p = project(copy.bones.Torso.localToWorld(V(0, 1.3, 0.55)), s), a = 1 - inv(E.dark[0] + 0.35, E.dark[0] + 0.55, t);
    if (p.on && a > 0) { g.save(); g.globalAlpha = a; g.shadowColor = '#78e4d8'; g.shadowBlur = 40 * s; g.fillStyle = '#9ff3ea'; g.fillRect(p.x - 9 * s, p.y - 9 * s, 18 * s, 18 * s); g.restore(); }
  }
  // The question: which one is real? A tag over each, then the comment prompt.
  for (const [a, label, at] of [[max, 'LEFT', E.left], [copy, 'RIGHT', E.right]]) {
    if (t < at - 0.05) continue;
    const p = project(head(a).add(V(0, 1.5, 0)), s); if (!p.on) continue;
    const k = easeOutBack(clamp((t - at + 0.05) / 0.2), 2.2), bob = Math.sin(t * 6) * 6 * s;
    g.save(); g.translate(p.x, p.y + bob); g.scale(k, k);
    g.font = `${66 * s}px "Luckiest Guy"`; const w = g.measureText(label).width + 50 * s;
    roundRect(g, -w / 2, -52 * s, w, 96 * s, 22 * s); g.fillStyle = 'rgba(10,18,24,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#78e4d8'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, 2 * s);
    g.beginPath(); g.moveTo(-20 * s, 50 * s); g.lineTo(20 * s, 50 * s); g.lineTo(0, 78 * s); g.closePath(); g.fillStyle = '#78e4d8'; g.fill();
    g.restore();
  }
  const ask = (y, k) => {
    g.save(); g.translate(540 * s, y * s); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = `${74 * s}px "Luckiest Guy"`; g.strokeStyle = '#0a1218'; g.lineWidth = 15 * s; g.strokeText('WHICH MAX IS REAL?', 0, 0); g.fillStyle = '#ffffff'; g.fillText('WHICH MAX IS REAL?', 0, 0);
    g.font = `${54 * s}px "Luckiest Guy"`; g.strokeText('COMMENT LEFT OR RIGHT', 0, 74 * s); g.fillStyle = '#78e4d8'; g.fillText('COMMENT LEFT OR RIGHT', 0, 74 * s);
    g.restore();
  };
  if (t > W.which - 0.1 && t < E.cta) ask(400, easeOutBack(clamp((t - W.which + 0.1) / 0.25), 1.8));
  // Call to action, after the question: follow for part 2, and the question stays up.
  if (t >= E.cta) {
    const a = t - E.cta, k2 = easeOutBack(clamp(a / 0.3), 1.6);
    g.save(); g.translate(540 * s, 330 * s); g.scale(k2, k2);
    roundRect(g, -430 * s, -110 * s, 860 * s, 250 * s, 36 * s); g.fillStyle = 'rgba(10,18,24,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#78e4d8'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${64 * s}px "Luckiest Guy"`; g.fillStyle = '#78e4d8'; g.fillText('FOLLOW FOR PART 2', 0, -50 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.fillText('@viralrobloxgames', 0, 18 * s);
    roundRect(g, -140 * s, 58 * s, 280 * s, 70 * s, 18 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 96 * s);
    g.restore();
    ask(560, 0.8);
  }
}

export const cast = () => ({ max, copy, ent });
