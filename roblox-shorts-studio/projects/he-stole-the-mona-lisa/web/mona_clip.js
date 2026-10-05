// He Stole The Mona Lisa. Web renderer + Roblox R6 pack. True story (Vincenzo Peruggia, 21 August 1911): a former Louvre
// worker in a staff smock lifts the Mona Lisa off its four pegs, dumps the frame and glass on a service staircase, and a
// plumber unlocks the door for him. The guards assume she's being photographed; the museum shuts for a week, sixty police
// search it, Picasso is questioned, a detective leans on the table she's hidden in, crowds queue to stare at the empty
// wall. Two years later a Florence dealer checks she's real and calls the police. The theft made her the most famous
// painting in the world. Max is the thief (white smock); Skye the guard; the Noob the plumber; Leo the artist and the
// dealer; Mia the detective; recoloured Noobs are police, visitors, the questioned artist and today's crowd.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import {
  gallery, stair, front, office, attic, shop, today, stairY, dress, stripes, loadMonaLisa, monaImage,
  monaLisa, frameAndGlass, wrench, toolbox, ironKey, brush, palette, easel, notebook, pencil, magnifier, candlestickPhone, trunk, smartphone, newspaper,
  GALLERY, STAIR, FRONT, OFFICE, ATTIC, SHOP, TODAY, ML_Y, ML_Z, LANDING_Y, DOOR_X, TABLE, PEGS,
} from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Stole The Mona Lisa' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const G = at(GALLERY), S = at(STAIR), F = at(FRONT), O = at(OFFICE), A_ = at(ATTIC), H = at(SHOP), D = at(TODAY);

// ---------- key times (all on the narration) ----------
const T = {
  guard: W.nobody - 0.1, stair: W.staircase - 0.15, door: W.locked - 0.1, plumber: W.plumber - 0.1, morning: W.morning - 0.15,
  hooks: W.four - 0.1, guards: W.guards - 0.1, isnt: W.isnt - 0.1, front: W.museum1 - 0.1, search: W.sixty - 0.1,
  picasso: W.question - 0.1, attic: W.detective - 0.1, queue: W.reopens - 0.1, papers: W.face - 0.1, italy: W.two - 0.1,
  dealer: W.dealer - 0.1, calls: W.calls - 0.15, then: W.stole - 0.1, today: W.handed - 0.1, cta: W.follow - 0.15,
};
T.dump = W.dumps + 0.1;                        // frame and glass come off
T.open = W.opens + 0.05;                       // the door swings open
T.walkOut = W.used + 0.35;

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, folk = [], GL, ST, FR, OF, AT, SH, TD, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
let puffs = [];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9', '#a86b3c', '#e8b98a', '#c99064', '#7a4a2a'];
export async function setup(stage) {
  const { scene } = stage;
  const { tex } = await loadMonaLisa();
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['smug', 'happy', 'neutral', 'nervous', 'surprised', 'shocked', 'scheming', 'determined', 'cool', 'scared', 'laugh'] }),
    loadRobloxCharacter('Mia', { expressions: ['suspicious', 'neutral', 'determined', 'happy', 'surprised'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'confused', 'shocked', 'surprised', 'suspicious', 'smug'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'confused', 'sleeping', 'surprised'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'laugh'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  DRESS.smock = dress(max, { color: '#e4e0d6', hem: 0.35, buttons: '#d9d6cc' });
  DRESS.guard = dress(skye, { color: '#24304f', hem: 0.2, buttons: '#d9b44a', collar: '#1a2238' });
  DRESS.trench = dress(mia, { color: '#b08a5a', hem: 0.6, buttons: '#4a2c16', collar: '#8a6a40' });
  DRESS.vest = dress(leo, { color: '#5a3a22', hem: 0.1, sleeves: false, buttons: '#d9b44a' });
  for (let i = 0; i < 10; i++) {                         // recoloured Noobs: police, visitors, today's crowd
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'laugh'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face' || o.parent?.isGroup === false) return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats;
    e.uniform = dress(e, { color: '#1f2a44', hem: 0.2, buttons: '#d9b44a', collar: '#141b2e' });
    e.striped = i === 0 ? dress(e, { color: '#ffffff', hem: 0.1, map: stripes() }) : null;
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'duck', 'look_up', 'idle_lookaround', 'point_forward', 'talk', 'think', 'scheming', 'laugh', 'facepalm']) A[n] = await loadAnimation(n);
  GL = gallery(scene); ST = stair(scene); FR = front(scene); OF = office(scene, monaImage()); AT = attic(scene); SH = shop(scene); TD = today(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  add('ml', monaLisa(tex, true)); add('panel', monaLisa(tex, false)); add('wallML', monaLisa(tex, true)); add('todayML', monaLisa(tex, false));
  add('frameGlass', frameAndGlass()); add('wrench', wrench()); add('toolbox', toolbox()); add('key', ironKey());
  add('brush', brush()); add('palette', palette()); add('easel', easel()); add('notebook', notebook()); add('pencil', pencil());
  add('magnifier', magnifier()); add('phone', candlestickPhone()); add('trunk', trunk());
  for (let i = 0; i < 14; i++) add('sp' + i, smartphone());
  for (let i = 0; i < 6; i++) add('np' + i, newspaper(monaImage()));
  for (let i = 0; i < 7; i++) { const p = puff(); p.visible = false; scene.add(p); puffs.push(p); }
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above). `yAt` gives the
// floor height along the way (the stairs).
function moveTo(x, from, to, t0, s, speed, endHeading, yAt = null) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  if (yAt) x.pos.y = yAt(x.pos);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
// arm poses: [side, spread, forward] (forward < 0 raises the arm in front; spread < 0 brings it in)
const CARRY = [['L', -0.03, -0.78], ['R', -0.03, -0.78]];        // the framed painting in front, fists on its side edges
const CARRY_PANEL = [['L', -0.24, -0.82], ['R', -0.24, -0.82]];  // the bare panel: narrower, hands drawn in
const SIDE_GRIP = [['R', 0.1, -0.95]];                           // right fist on the frame's edge, beside him
const HOLD = [['R', 0.08, -0.55]];
const BOX = [['L', 0.02, -1.38], ['R', 0.02, -1.38]];             // the trunk on both forearms
const mixArms = (a, b, k) => { const out = b.map(([sd, u, f]) => { const o = a.find((q) => q[0] === sd) || [sd, 0, 0]; return [sd, lerp(o[1], u, k), lerp(o[2], f, k)]; }); for (const o of a) if (!b.find((q) => q[0] === o[0])) out.push([o[0], lerp(o[1], 0, k), lerp(o[2], 0, k)]); return out; };

// Max: the gallery, the staircase, the door; then his room; then Florence.
const M_WALL = G(0, 0, -8.05), M_HOOK = G(0, 0, -7.4), EXIT = G(19.5, 0, -3.0);
const LIFT = [['L', -0.03, -1.58], ['R', -0.03, -1.58]], LIFT2 = [['L', -0.03, -1.74], ['R', -0.03, -1.74]];
const LAND = S(7.5, LANDING_Y, -1.0), STAIR_BOT = S(4 - 0.8 * 14 - 0.6, 0, -1.0), AT_DOOR = S(DOOR_X + 2.6, 0, -1.2), OUT = S(DOOR_X, 0, -3.3);
const ATTIC_DOOR = A_(8.0, 0, -4.6), SHOP_IN = H(-9.5, 0, 3.0), SHOP_CTR = H(-1.8, 0, -1.0);
function maxAt(s) {
  let x = base(M_HOOK, 0.3, 'smug');
  if (s < T.stair) {                                         // the gallery: lifts it off the pegs, turns, shows it off
    x.pos = M_WALL.clone().lerp(M_HOOK, smooth(inv(0.25, 0.6, s))); x.layers = [['idle', s]];
    x.heading = lerp(Math.PI, 0.2, smooth(inv(0.55, 1.3, s)));
    x.arms = s < 0.55 ? mixArms(LIFT, LIFT2, smooth(inv(0, 0.4, s))) : mixArms(LIFT2, CARRY, smooth(inv(0.55, 1.2, s)));
    x.face = s < 1.3 ? 'scheming' : 'smug';
    if (s > W.nobody + 0.15 && s < T.walkOut) x.face = 'cool';
    if (s >= T.walkOut) { moveTo(x, M_HOOK, EXIT, T.walkOut, s, 12, R90); x.arms = CARRY; x.face = 'smug'; }
    return x;
  }
  if (s < T.morning) {                                       // the staircase and the door
    x = base(LAND, -R90 + 0.55, 'determined'); x.arms = s < T.dump ? CARRY : CARRY_PANEL;
    if (s < T.dump - 0.3) x.face = 'scheming';
    const d0 = LAND.distanceTo(STAIR_BOT) + STAIR_BOT.distanceTo(AT_DOOR), w0 = T.dump + 0.45;
    const speed = clamp(d0 / Math.max(0.6, T.door + 0.15 - w0), 12, 16);
    const m1 = moveTo(x, LAND, STAIR_BOT, w0, s, speed, -R90, (p) => stairY(p.x - STAIR.x));
    if (m1.done) moveTo(x, STAIR_BOT, AT_DOOR, m1.arrive, s, speed, -R90 + 0.45);
    if (x.moving) x.arms = CARRY_PANEL;
    if (s >= T.door) {                                        // shoves the door: locked
      x.face = 'nervous';
      const k = s < T.plumber ? Math.sin(clamp((s - T.door - 0.15) / 0.45) * Math.PI) : 0;
      x.pos.x -= 0.35 * k;
    }
    if (s >= T.plumber + 0.2) { x.heading = lerp(-R90 + 0.45, -0.25, smooth(inv(T.plumber + 0.2, T.plumber + 0.6, s))); x.face = 'surprised'; }
    if (s >= T.open + 0.25) x.face = 'happy';
    if (s >= T.open + 0.75) { moveTo(x, AT_DOOR, OUT, T.open + 0.75, s, 12, Math.PI); x.arms = CARRY_PANEL; }
    return x;
  }
  if (s >= T.attic && s < T.queue) {                          // his room: nervous by the door
    x = base(ATTIC_DOOR, -0.55, 'nervous'); x.layers = [['idle', s]];
    if (s > W.leaning) x.face = 'scared';
    if (s > W.hidden) x.face = 'nervous';
    return x;
  }
  if (s >= T.italy && s < T.then) {                           // Florence
    x = base(SHOP_IN, R90, 'happy');
    const m = moveTo(x, SHOP_IN, SHOP_CTR, T.italy + 0.15, s, 12, -0.35 + Math.PI * 0.85);
    x.arms = s < W.sell + 0.1 ? BOX : HOLD;
    if (!m.moving && s > m.arrive) { x.heading = lerp(R90, 2.55, smooth(inv(m.arrive, m.arrive + 0.35, s))); }
    if (s >= W.sell + 0.1) { x.arms = mixArms(BOX, [['L', -0.24, -0.82], ['R', -0.24, -0.82]], smooth(inv(W.sell + 0.1, W.sell + 0.4, s))); x.face = 'smug'; }
    if (s >= T.dealer + 0.25) { x.arms = mixArms(CARRY_PANEL, [], smooth(inv(T.dealer + 0.25, T.dealer + 0.55, s))); x.face = 'happy'; }
    if (s >= T.calls) { x.heading = lerp(2.55, 0.35, smooth(inv(T.calls, T.calls + 0.4, s))); x.layers = [['scheming', s - T.calls, 1, true]]; x.arms = []; x.face = 'scheming'; }
    if (s >= W.police2 - 0.1) { x.layers = [['shock', s - W.police2 + 0.1, 1, false]]; x.face = 'shocked'; x.heading = lerp(0.35, -0.6, smooth(inv(W.police2 - 0.1, W.police2 + 0.2, s))); }
    return x;
  }
  x.visible = false; return x;
}
// Skye, the guard: nods at the thief; shrugs the next morning; dozes in the 1911 flashback.
function skyeAt(s) {
  let x = base(G(-12, 0, -6.2), R90, 'neutral'); x.visible = false;
  if (s < T.stair) {
    x.visible = s > T.guard - 0.6;
    moveTo(x, G(-11, 0, -5.2), G(-4.2, 0, -5.2), T.guard - 0.55, s, 12, R90 - 0.55);
    if (!x.moving && s > T.guard) { x.face = 'happy'; x.wave = s < W.used + 0.2; }
    return x;
  }
  if (s >= T.guards && s < T.front) {
    x = base(G(3.0, 0, -4.4), -0.5, 'confused'); x.visible = true;
    x.layers = [['shrug', s - W.shrug + 0.1, 1, false]];
    if (s < W.shrug - 0.1) x.layers = [['idle', s]];
    if (s >= T.isnt) { x.face = 'surprised'; x.layers = [['idle', s]]; }
    return x;
  }
  if (s >= T.then && s < T.today) { x = base(G(-9, 0, -6.4), 0.45, 'sleeping'); x.visible = true; x.layers = [['idle', s]]; return x; }
  if (s >= T.today) return crowdAt(10, s, x);
  return x;
}
// The Noob, the plumber: walks up with a toolbox and a key, unlocks the door, holds it open.
function noobAt(s) {
  let x = base(S(-24, 0, -1.0), R90, 'happy'); x.visible = false;
  if (s >= T.plumber - 0.4 && s < T.morning) {
    x.visible = true;
    moveTo(x, S(-22, 0, 0.4), S(DOOR_X - 3.3, 0, 0.6), T.plumber - 0.4, s, 14, R90 - 0.3);
    x.arms = [['L', 0.06, 0.0], ['R', 0.08, -0.55]];
    if (!x.moving && s > W.plumber + 0.4) {
      x.arms = [['L', 0.06, 0.0], ['R', 0.0, lerp(-0.55, -1.35, smooth(inv(T.open - 0.5, T.open - 0.15, s)))]];
      if (s > T.open + 0.3) { x.arms = [['L', 0.06, 0.0]]; x.wave = s < T.open + 1.4; x.face = 'laugh'; }
    }
    return x;
  }
  if (s >= T.today) return crowdAt(11, s, x);
  return x;
}
// Leo: the artist the next morning; the dealer in Florence.
function leoAt(s) {
  let x = base(G(10, 0, -2.0), -R90, 'happy'); x.visible = false;
  if (s >= T.morning && s < T.front) {
    x.visible = true;
    const m = moveTo(x, G(9, 0, -2.6), G(-2.0, 0, -4.0), T.morning - 0.1, s, 12, 2.79);
    x.arms = [['L', 0.1, -0.7], ['R', 0.08, -0.55]];
    if (!m.moving && s > m.arrive) { x.layers = [['look_up', s - m.arrive, 1, false]]; x.face = 'confused'; }
    if (s >= T.hooks) { x.layers = [['shock', s - T.hooks, 1, false]]; x.face = 'shocked'; x.arms = []; }
    if (s >= T.guards) { x.pos = G(-2.6, 0, -3.0); x.heading = 0.75; x.layers = [['point_forward', s - T.guards, 1, false]]; x.face = 'shocked'; x.heading = 2.4; }
    if (s >= T.isnt) { x.layers = [['idle', s]]; x.heading = 0.6; x.face = 'shocked'; }
    return x;
  }
  if (s >= T.italy && s < T.then) {
    x = base(H(1.6, 0, -5.2), -0.75, 'neutral'); x.visible = true; x.arms = [];
    if (s >= T.dealer) { x.face = 'suspicious'; x.layers = [['idle', s]]; x.arms = [['R', 0.0, lerp(-0.4, -1.7, smooth(inv(T.dealer, T.dealer + 0.35, s)))]]; x.lean = 0.22 * smooth(inv(T.dealer, T.dealer + 0.35, s)); }
    if (s >= W.real - 0.05) { x.face = 'happy'; x.nod = Math.sin(clamp((s - W.real + 0.05) / 0.5) * Math.PI * 2) * 0.18; }
    if (s >= T.calls) { x.lean = 0; x.face = 'suspicious'; x.heading = lerp(-0.45, -0.95, smooth(inv(T.calls, T.calls + 0.3, s))); x.arms = [['L', 0.25, lerp(0, -2.25, smooth(inv(T.calls + 0.1, T.calls + 0.45, s)))]]; }
    if (s >= W.police2) x.face = 'smug';
    return x;
  }
  if (s >= T.today) return crowdAt(12, s, x);
  return x;
}
// Mia: the detective in the police office and the thief's room.
function miaAt(s) {
  let x = base(O(-1.6, 0, -3.4), 0.75, 'suspicious'); x.visible = false;
  if (s >= T.picasso && s < T.attic) { x.visible = true; x.layers = [['talk', s - T.picasso, 1, true]]; return x; }
  if (s >= T.attic && s < T.queue) {
    x.visible = true;
    const m = moveTo(x, A_(9.0, 0, -3.0), A_(3.65, 0, -1.0), T.attic + 0.05, s, 12, -R90 + 0.15);
    x.arms = [['L', 0.06, -0.55]];
    if (!m.moving && s > m.arrive) {
      const k = smooth(inv(m.arrive, m.arrive + 0.35, s));
      x.lean = 0.42 * k; x.face = 'determined';
      x.arms = mixArms([['L', 0.06, -0.55]], [['L', 0.05, -1.05], ['R', -0.05, -1.05]], k);
      if (s > W.report) x.arms = [['L', 0.05, -1.05], ['R', -0.05 + 0.04 * Math.sin(s * 22), -1.05 + 0.04 * Math.sin(s * 17)]];
    }
    return x;
  }
  if (s >= T.today) return crowdAt(13, s, x);
  return x;
}
// Recoloured Noobs.
const POLICE = { shirt: '#1f2a44', pants: '#1a2238', uniform: true };
const C1911 = [['#3a3f4a', '#2b2d33'], ['#5a4636', '#3a2e24'], ['#2f3b2f', '#2b2d33'], ['#6b4a5a', '#2b2d33'], ['#7a6a4a', '#3a3a3a'], ['#3a4a6a', '#2b2d33'], ['#4a3a2a', '#1d1f27'], ['#5f6b78', '#2b2d33'], ['#7a3a2a', '#3a2e24'], ['#2b3a4a', '#1d1f27']];
const CNOW = [['#e63946', '#264653'], ['#2a9d8f', '#1d3557'], ['#f4a261', '#495057'], ['#8338ec', '#2b2d42'], ['#3a86ff', '#1d1f27'], ['#ffbe0b', '#264653'], ['#ff7aa2', '#2b2d42'], ['#06d6a0', '#1d3557'], ['#fb5607', '#495057'], ['#118ab2', '#1d1f27']];
// Today's crowd: 14 places in rows facing the painting (at TODAY (0, ML_Y, -8)), phones up.
const CROWD = [[-4.6, -1.0], [-1.6, -0.6], [1.6, -0.6], [4.6, -1.0], [-6.4, 2.2], [-3.2, 2.6], [0, 2.8], [3.2, 2.6], [6.4, 2.2], [-4.8, 5.6], [-1.6, 6.0], [1.6, 6.0], [4.8, 5.6], [0, 9.0]];
function crowdAt(i, s, x) {
  const [cx, cz] = CROWD[i], p = D(cx, 0, cz + 1.5);
  x = base(p, Math.atan2(-cx, -9.5 - cz) + (i % 3 - 1) * 0.06, 'happy'); x.visible = true; x.layers = [['idle', s + i * 0.37]];
  const up = smooth(inv(T.today + 0.1 + (i % 5) * 0.12, T.today + 0.5 + (i % 5) * 0.12, s));
  x.arms = [[i % 2 ? 'L' : 'R', 0.05, lerp(-0.3, -2.05, up)]]; x.phone = i % 2 ? 'L' : 'R';
  return x;
}
function folkAt(i, s) {
  let x = base(G(0, 0, 0), 0, 'neutral'); x.visible = false; x.pal = null;
  const pal1911 = { shirt: C1911[i][0], pants: C1911[i][1] };
  if (s >= T.guards && s < T.front && i === 1) { x = base(G(5.2, 0, -3.2), -0.9, 'neutral'); x.layers = [['shrug', s - W.shrug, 1, false]]; if (s < W.shrug - 0.1) x.layers = [['idle', s]]; x.pal = POLICE; return x; }
  if (s >= T.front && s < T.search && i >= 1 && i <= 5) {     // police outside, people reading the sign
    if (i <= 3) { x = base(F(-10 + i * 2.2, 0, 3.0), R90, 'neutral'); moveTo(x, F(-20 + i * 2.6, 0, 7.0 + i * 0.7), F(-4 + i * 2.6, 0, 7.0 + i * 0.7), T.front - 0.2, s, 12, R90); x.pal = POLICE; }
    else { x = base(F(i === 4 ? 5.5 : 8.0, 0, 1.0), Math.PI - (i === 4 ? -0.35 : 0.35), 'surprised'); x.layers = [['look_up', s - T.front + i * 0.2, 1, false]]; x.pal = pal1911; }
    return x;
  }
  if (s >= T.search && s < T.picasso && i >= 1 && i <= 7) {  // sixty police search the gallery
    const SPOTS = [[G(-8, 0, 6.4), Math.PI, 'duck'], [G(8, 0, 6.4), Math.PI, 'duck'], [G(-15.5, 0, -2), -R90, 'look_up'], [G(15.5, 0, 3), R90, 'look_up'], [G(-4, 0, -7.2), Math.PI, 'look_up'], null, null];
    const sp = SPOTS[i - 1];
    if (sp) { x = base(sp[0], sp[1], 'neutral'); x.layers = [[sp[2], s - T.search + i * 0.15, 1, false]]; }
    else { x = base(G(-14, 0, 2), R90, 'neutral'); moveTo(x, i === 6 ? G(-16, 0, 3.5) : G(16, 0, -1.0), i === 6 ? G(14, 0, 3.5) : G(-12, 0, -1.0), T.search - 0.3, s, 12, R90); }
    x.pal = POLICE; return x;
  }
  if (s >= T.picasso && s < T.attic && i === 0) {             // the questioned artist (striped shirt)
    x = base(O(3.2, 0.6, -0.4), -R90 + 0.95, 'surprised'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.striped = true; x.pal = { shirt: '#ffffff', pants: '#2b2d33' }; return x;
  }
  if (s >= T.queue && s < T.papers) {                         // the queue at the empty wall
    const a = -0.9 + i * 0.2, r = 7.5 + (i % 2) * 2.6;
    x = base(G(Math.sin(a) * r, 0, -9.4 + Math.cos(a) * r), Math.PI + a * 0.8, 'surprised'); x.layers = [[i % 3 === 0 ? 'point_forward' : 'idle', s + i * 0.3, 1, i % 3 !== 0]];
    x.pal = pal1911; return x;
  }
  if (s >= T.papers && s < T.italy && i < 6) {                // reading the papers outside the museum
    x = base(F(-6 + i * 2.4, 0, 6 + (i % 2) * 2.2), 0.15 * (i - 2.5), i % 2 ? 'surprised' : 'neutral'); x.arms = [['L', -0.24, -0.95], ['R', -0.24, -0.95]]; x.paper = i; x.pal = pal1911; return x;
  }
  if (s >= W.police2 - 0.5 && s < T.then && (i === 1 || i === 2)) {   // police at the Florence shop door
    x = base(H(-13.5, 0, 3.0 + (i - 1) * 2.0), R90, 'neutral'); moveTo(x, H(-15, 0, 3.0 + (i - 1) * 2.2), H(-7.4 - (i - 1) * 1.4, 0, 1.8 + (i - 1) * 2.0), W.police2 - 0.5, s, 14, R90 - 0.3); x.pal = POLICE; return x;
  }
  if (s >= T.then && s < T.today && i < 4) {                  // 1911: visitors walk straight past her
    x = base(G(-14, 0, -5), R90, 'neutral'); const z = -7.4 + i * 0.8, dir = i % 2 ? 1 : -1;
    moveTo(x, G(-14 * dir - i * 3, 0, z), G(14 * dir - i * 3, 0, z), T.then - 0.6, s, 12, R90 * dir); x.pal = pal1911; return x;
  }
  if (s >= T.today && i < 10) { x = crowdAt(i, s, x); x.pal = { shirt: CNOW[i][0], pants: CNOW[i][1] }; return x; }
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
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  if (x.nod) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.nod, 0, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal, striped) {
  const i = folk.indexOf(f);
  for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i]);
  f.uniform.visible = !!pal.uniform; if (f.striped) f.striped.visible = !!striped;
}
// The palm, measured on the pack mesh: the fist is at (-+0.5, -1.3, 0) in the arm bone's frame (R: -0.5, L: +0.5).
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const between = (a, d = 1.3) => grip(a, 'L', d).lerp(grip(a, 'R', d), 0.5);

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.guard, 'guard'], [T.stair, 'stair'], [T.door, 'door'], [T.plumber, 'plumber'], [T.morning, 'morning'], [T.hooks, 'hooks'],
  [T.guards, 'guards'], [T.isnt, 'isnt'], [T.front, 'front'], [T.search, 'search'], [T.picasso, 'picasso'], [T.attic, 'attic'],
  [W.table - 0.15, 'table'], [T.queue, 'queue'], [T.papers, 'papers'], [T.italy, 'italy'], [T.dealer, 'dealer'], [T.calls, 'calls'],
  [T.then, 'then'], [T.today, 'today'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

const PLACE_OF = { hook: 'gallery', guard: 'gallery', stair: 'stair', door: 'stair', plumber: 'stair', morning: 'gallery', hooks: 'gallery', guards: 'gallery', isnt: 'gallery', front: 'front', search: 'gallery', picasso: 'office', attic: 'attic', table: 'attic', queue: 'gallery', papers: 'front', italy: 'shop', dealer: 'shop', calls: 'shop', then: 'gallery', today: 'today', cta: 'today' };
function light(stage, place) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const L = {
    gallery: { sun: 0, hemi: 0.5, hemiC: '#fff1e0', env: 0.45, fill: 0.55, rim: 0.7 },
    stair: { sun: 0, hemi: 0.45, hemiC: '#e8e4dc', env: 0.3, fill: 0.4, rim: 0.6 },
    front: { sun: 3.0, hemi: 0.55, hemiC: '#d9ecff', env: 0.55, fill: 0.7, rim: 1.1 },
    office: { sun: 0, hemi: 0.35, hemiC: '#fff1e0', env: 0.3, fill: 0.35, rim: 0.6 },
    attic: { sun: 0, hemi: 0.5, hemiC: '#ffe8c8', env: 0.35, fill: 0.45, rim: 0.7 },
    shop: { sun: 0, hemi: 0.6, hemiC: '#ffe8c8', env: 0.45, fill: 0.5, rim: 0.8 },
    today: { sun: 0, hemi: 0.6, hemiC: '#f4f8ff', env: 0.55, fill: 0.6, rim: 0.8 },
  }[place];
  stage.sun.intensity = L.sun; stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  GL.lamp.intensity = place === 'gallery' ? 45 : 0; GL.wash.intensity = place === 'gallery' ? 45 : 0;
  ST.lamp.intensity = place === 'stair' ? 55 : 0; ST.doorLight.intensity = place === 'stair' ? 0 : 0;
  OF.lamp.intensity = place === 'office' ? 40 : 0; AT.lamp.intensity = place === 'attic' ? 45 : 0;
  SH.lamp.intensity = place === 'shop' ? 55 : 0; TD.lamp.intensity = place === 'today' ? 70 : 0; TD.spot.intensity = place === 'today' ? 90 : 0;
  u.zenith.value.set('#4f8fe6'); u.horizon.value.set('#d7ecff');
}

// a poof burst: puffs around p, expanding and fading over 0.55 s after t0
const BURSTS = [];
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  const where = PLACE_OF[SHOT];
  light(stage, where);

  // ---------- cast ----------
  for (const a of [max, mia, leo, skye, noob, ...folk]) a.root.visible = false;
  const states = new Map([[max, maxAt(s)], [skye, skyeAt(s)], [noob, noobAt(s)], [leo, leoAt(s)], [mia, miaAt(s)]]);
  DRESS.vest.visible = s >= T.italy && s < T.then;
  DRESS.guard.visible = s < T.today; DRESS.trench.visible = s < T.today; DRESS.smock.visible = s < T.today;
  for (const [a, x] of states) place(a, x);
  folk.forEach((f, i) => { const x = folkAt(i, s); if (x.pal) paint(f, x.pal, x.striped); place(f, x); f.state = x; });

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  BURSTS.length = 0;
  const show = (key, pos, yaw = 0, sc = 1) => { const o = PROPS[key]; o.visible = true; o.position.copy(pos); o.rotation.set(0, yaw, 0); o.scale.setScalar(sc); return o; };
  const hy = (a) => a.root.rotation.y;
  // the painting on the wall (1911 scenes before the theft and the flashback); the empty pegs otherwise
  const onWall = SHOT === 'then';
  if (onWall) show('wallML', G(0, ML_Y, ML_Z + 0.2), 0);
  GL.pegs.visible = !onWall;
  if (s < T.stair) {                                          // the hook: in his hands; flipped round to face us
    const flip = s < 1.3 ? 1 : 1 - smooth(inv(1.3, 1.75, s));
    show('ml', between(max).add(V(0, 0.05, 0)), hy(max) + Math.PI * flip);
  } else if (s < T.morning) {                                 // the staircase
    if (s < T.dump) show('ml', between(max).add(V(0, 0.05, 0)), hy(max));
    else if (s < T.open + 2.5 && max.root.visible) show('panel', between(max).add(V(0, 0.05, 0)), hy(max));
    if (s >= T.dump - 0.02) show('frameGlass', S(10.2, LANDING_Y, -2.5), -0.25);
    if (noob.root.visible) {
      const g = grip(noob, 'L'); show('toolbox', g.clone().add(V(0, 0.05, 0)), hy(noob));
      if (s < T.open + 0.3) { const k = grip(noob, 'R'); show('key', k, hy(noob)); }
    }
  } else if (SHOT === 'morning' || SHOT === 'hooks' || SHOT === 'guards' || SHOT === 'isnt') {
    show('easel', G(-4.4, 0, -5.6), 0.55);
    if (leo.root.visible && s < T.hooks + 0.1) { show('brush', grip(leo, 'R'), hy(leo)).rotation.x = 1.25; }
  } else if (SHOT === 'attic' || SHOT === 'table') {
    const glow = SHOT === 'table' ? 0.6 + 0.4 * Math.sin(s * 6) : 0.0;
    AT.glow.intensity = 14 * glow;
    const pp = show('panel', A_(0, TABLE.y - 0.62, TABLE.z), 0); pp.rotation.set(-R90, 0, 0); pp.scale.setScalar(0.92);
    if (mia.root.visible && s > W.report - 0.3) { show('notebook', A_(2.0, TABLE.y + 0.17, -0.9), 0).rotation.set(-R90, 0, 0.4); show('pencil', grip(mia, 'R'), hy(mia)).rotation.x = 0.5; }
  } else if (where === 'shop') {
    show('phone', H(3.0, 3.6, -3.5), 0);
    const ear = PROPS.phone.userData.ear, rest = PROPS.phone.userData.rest;
    if (leo.root.visible && s >= T.calls + 0.25) { const g = grip(leo, 'L'); ear.position.copy(PROPS.phone.worldToLocal(g.clone())); ear.rotation.set(0, 0, 0.3); }
    else { ear.position.copy(rest); ear.rotation.set(0, 0, 0); }
    if (s < W.sell + 0.1) show('trunk', between(max, 1.4).add(V(0, -0.72, 0)), hy(max));
    else show('trunk', H(-4.3, 0, -0.4), 0.3);
    if (s >= W.sell + 0.1 && s < T.dealer + 0.25) show('panel', between(max).add(V(0, 0.05, 0)), hy(max));
    else if (s >= T.dealer + 0.25) { const pp = show('panel', H(-1.2, 3.6 + 1.42, -3.0), 0.75); pp.rotation.x = -0.12; }
    if (s >= T.dealer && s < T.calls + 0.1) show('magnifier', grip(leo, 'R'), hy(leo)).rotation.x = -0.6;
  } else if (where === 'today') {
    show('todayML', D(0, 5.9, -7.95), 0);
    for (const [a, i] of [...folk.map((f, j) => [f, j]), [skye, 10], [noob, 11], [leo, 12], [mia, 13]]) {
      const x = a === skye || a === noob || a === leo || a === mia ? states.get(a) : a.state;
      if (!a.root.visible || !x?.phone) continue;
      const g = grip(a, x.phone); show('sp' + i, g, hy(a)).rotation.x = 0.0;
    }
  } else if (SHOT === 'papers') {
    folk.forEach((f) => { const x = f.state; if (f.root.visible && x?.paper !== undefined) { const p = show('np' + x.paper, between(f).add(V(0, -0.35, 0)), hy(f) + Math.PI); p.rotation.x = 0.1; } });
  }
  // the staircase door: rattles when shoved, swings open when unlocked
  const shove = s >= T.door && s < T.plumber ? Math.sin(clamp((s - T.door - 0.15) / 0.45) * Math.PI) : 0;
  ST.door.rotation.y = -1.7 * smooth(inv(T.open, T.open + 0.45, s)) + 0.03 * shove * Math.sin(s * 60);
  ST.doorLight.intensity = 0;
  // poofs: the frame and glass come off on the landing; the trunk is opened
  if (s >= T.dump - 0.05 && s < T.dump + 0.6) BURSTS.push([between(max).add(V(0, 0.2, 0)), T.dump - 0.05, 1.4]);
  if (s >= W.sell + 0.05 && s < W.sell + 0.7) BURSTS.push([H(-4.3, 1.2, -0.4), W.sell + 0.05, 1.4]);
  let pi = 0; for (const p of puffs) p.visible = false;
  for (const [pos, t0, size] of BURSTS) {
    const a = (s - t0) / 0.55; if (a < 0 || a > 1) continue;
    for (let j = 0; j < 5 && pi < puffs.length; j++, pi++) {
      const p = puffs[pi], ang = j / 5 * 6.283 + t0 * 3;
      p.visible = true; p.position.copy(pos).add(V(Math.cos(ang) * size * 0.8 * easeOut(a), 0.4 * size * a, Math.sin(ang) * size * 0.5 * easeOut(a)));
      p.scale.setScalar(size * (0.35 + 0.5 * easeOut(a))); p.material.opacity = 0.85 * (1 - a);
    }
  }

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, G(lerp(7.6, 7.0, u), 4.8, lerp(-2.6, -1.8, u)), G(-0.4, 3.5, -8.6), 50, 14); break;
    case 'guard': { const fx = clamp(mp.x * 0.85, -1.2, 15); look(stage, G(fx + 0.6, 6.0, 13.5), G(fx, 3.4, -5.4), 54, 20); break; }
    case 'stair': { const fx = clamp(mp.x - STAIR.x, -8, 7); look(stage, S(fx - 2.0, mp.y + 4.6, 13), S(fx, mp.y + 2.6, -1.2), 50, 16); break; }
    case 'door': look(stage, S(DOOR_X - 2.5, 4.6, 8.5), S(DOOR_X + 1.8, 3.5, -1.4), 48, 12); break;
    case 'plumber': look(stage, S(DOOR_X + lerp(1.4, 0.8, u), 5.0, lerp(14.5, 13.5, u)), S(DOOR_X - 0.2, 3.6, -1.6), 50, 16); break;
    case 'morning': look(stage, G(lerp(5.0, 5.8, u), 5.2, -8.8), G(lerp(1.0, -1.6, smooth(u)), 4.3, -3.6), 50, 16); break;
    case 'hooks': look(stage, G(lerp(0.8, 0.3, u), ML_Y + 0.3, lerp(-2.5, -4.0, easeOut(u))), G(0, ML_Y, ML_Z), 44, 10); break;
    case 'guards': look(stage, G(lerp(2.0, 1.4, u), 5.0, lerp(9.0, 8.2, u)), G(1.5, 3.8, -5.5), 50, 14); break;
    case 'isnt': look(stage, G(0, ML_Y, lerp(-2.0, -5.2, easeOut(u))), G(0, ML_Y, ML_Z), 46, 10); break;
    case 'front': look(stage, F(lerp(-2.0, 1.0, u), 9.5, 26), F(0, 6.2, -2), 50, 24); break;
    case 'search': look(stage, G(lerp(-3.0, 3.0, u), 10.5, 19), G(0, 2.5, 0), 52, 24); break;
    case 'picasso': look(stage, O(lerp(1.0, 0.6, u), 5.6, 12.5), O(0.8, 3.4, -1.6), 50, 14); break;
    case 'attic': look(stage, A_(lerp(2.6, 1.6, u), 5.6, 13.5), A_(3.2, 3.4, -1.6), 50, 14); break;
    case 'table': look(stage, A_(lerp(0.9, 0.4, u), 3.6, lerp(8.0, 7.0, u)), A_(1.2, 2.9, -1.0), 44, 10); break;
    case 'queue': look(stage, G(lerp(6.5, 5.0, u), 9.0, 13.5), G(-0.3, 3.0, -7.5), 50, 20); break;
    case 'papers': look(stage, F(lerp(0.8, 0.2, u), 4.4, 19), F(0, 4.4, 4), 48, 18); break;
    case 'italy': look(stage, H(lerp(-2.0, -1.2, u), 6.0, 15.0), H(-2.2, 3.8, -2.2), 52, 18); break;
    case 'dealer': look(stage, H(lerp(4.6, 4.0, u), 5.4, lerp(6.4, 5.6, u)), H(0.0, 4.6, -3.4), 46, 10); break;
    case 'calls': look(stage, H(lerp(-3.2, -3.6, u), 6.4, 17.5), H(-3.4, 3.6, -1.5), 54, 20); break;
    case 'then': look(stage, G(lerp(1.5, 0.5, u), 7.0, lerp(12.5, 11.5, u)), G(0, ML_Y + 0.6, -8), 46, 16); break;
    case 'today': case 'cta': { const k = easeOut(clamp((t - T.today) / (meta.seconds - T.today))); look(stage, D(lerp(0.4, 1.2, k), lerp(8.4, 9.6, k), lerp(9.5, 15, k)), D(0, lerp(5.6, 5.0, k), -7.5), 44, 22); break; }
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
// a place / time tag in the top left
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
function cameraIcon(g, x, y, w) {
  g.save(); g.translate(x, y); g.fillStyle = '#16182a'; roundRect(g, -w / 2, -w * 0.32, w, w * 0.64, w * 0.1); g.fill(); g.fillRect(-w * 0.18, -w * 0.44, w * 0.36, w * 0.14);
  g.fillStyle = '#9fd0f5'; g.beginPath(); g.arc(0, 0, w * 0.22, 0, 7); g.fill(); g.fillStyle = '#16182a'; g.beginPath(); g.arc(0, 0, w * 0.12, 0, 7); g.fill(); g.restore();
}
// The ex-staff badge ("He used to work here").
function badge(g, s, t) {
  const t0 = W.used - 0.1; if (t < t0 || t > T.stair) return;
  const k = easeOutBack(clamp((t - t0) / 0.25), 1.6) * (1 - clamp((t - T.stair + 0.15) / 0.15));
  g.save(); g.translate(720 * s, 470 * s); g.rotate(0.06); g.scale(k, k);
  roundRect(g, -230 * s, -150 * s, 460 * s, 300 * s, 26 * s); g.fillStyle = '#f2ead8'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16182a'; g.stroke();
  g.fillStyle = '#24304f'; roundRect(g, -230 * s, -150 * s, 460 * s, 70 * s, 26 * s); g.fill(); g.fillRect(-230 * s, -100 * s, 460 * s, 20 * s);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${42 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText('LOUVRE · STAFF', 0, -113 * s);
  g.fillStyle = '#cfc6b0'; g.fillRect(-200 * s, -60 * s, 140 * s, 170 * s);
  g.fillStyle = '#e8b98a'; g.fillRect(-170 * s, -40 * s, 80 * s, 80 * s); g.fillStyle = '#f4f2ec'; g.fillRect(-190 * s, 45 * s, 120 * s, 65 * s);
  g.textAlign = 'left'; g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#16182a'; g.fillText('GLASS FITTER', -40 * s, -30 * s);
  g.font = `800 ${24 * s}px Montserrat`; g.fillStyle = '#5a6478'; g.fillText('fitted the glass', -40 * s, 12 * s); g.fillText('on HER case', -40 * s, 44 * s);
  g.restore();
  stamp(g, s, t, t0 + 0.35, 'FORMER', 760, 560, '#e63946', 64, -0.2);
}
// spinning newspaper fronts with her face
const HEADS = [['LE PETIT PARISIEN', 'VOLÉE !', '#b0121b'], ['THE DAILY NEWS', 'STOLEN!', '#16182a'], ['CORRIERE', 'RUBATA!', '#b0121b'], ['NEW YORK HERALD', 'WHERE IS SHE?', '#16182a']];
function papers(g, s, t) {
  if (SHOT !== 'papers') return;
  const img = monaImage();
  HEADS.forEach(([name, head, col], i) => {
    const t0 = T.papers + 0.05 + i * 0.32, a = clamp((t - t0) / 0.35); if (a <= 0) return;
    const k = easeOutBack(a, 1.4), spin = (1 - easeOut(a)) * 6.0;
    const [x, y, r] = [[300, 420, -0.12], [780, 470, 0.1], [330, 820, 0.08], [760, 860, -0.07]][i];
    g.save(); g.translate(x * s, y * s); g.rotate(r + spin); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 20 * s; g.fillStyle = '#f2ead8'; g.fillRect(-190 * s, -230 * s, 380 * s, 460 * s); g.shadowColor = 'transparent';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${30 * s}px "Playfair Display"`; g.fillStyle = '#16182a'; g.fillText(name, 0, -195 * s);
    g.fillRect(-170 * s, -172 * s, 340 * s, 4 * s);
    g.font = `${(head.length > 9 ? 46 : 60) * s}px "Luckiest Guy"`; g.fillStyle = col; g.fillText(head, 0, -125 * s);
    if (img) g.drawImage(img, -95 * s, -85 * s, 190 * s, 283 * s);
    g.fillStyle = 'rgba(22,24,42,.35)'; for (let j = 0; j < 7; j++) { g.fillRect(-175 * s, (-80 + j * 40) * s, 68 * s, 7 * s); g.fillRect(107 * s, (-80 + j * 40) * s, 68 * s, 7 * s); }
    g.restore();
  });
}
export function overlay(g, s, t) {
  if (t < T.guard + 0.3) tag(g, s, t, 0.0, 'PARIS, 1911', 'the Louvre');
  badge(g, s, t);
  if (SHOT === 'door' && t > W.locked) {                    // a padlock pops on the door
    const k = easeOutBack(clamp((t - W.locked) / 0.2), 2); g.save(); g.translate(330 * s, 560 * s); g.scale(k, k);
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#16182a'; g.lineWidth = 8 * s; g.beginPath(); g.arc(0, -30 * s, 46 * s, Math.PI, 0); g.stroke();
    roundRect(g, -70 * s, -30 * s, 140 * s, 110 * s, 16 * s); g.fill(); g.stroke(); g.fillStyle = '#16182a'; g.beginPath(); g.arc(0, 15 * s, 14 * s, 0, 7); g.fill(); g.fillRect(-6 * s, 15 * s, 12 * s, 34 * s); g.restore();
  }
  if (t >= T.morning && t < T.hooks) tag(g, s, t, T.morning, 'NEXT MORNING');
  if (SHOT === 'hooks' && cam) {                            // circle the four pegs where they really are
    const a = clamp((t - W.four) / 0.25);
    if (a > 0) { g.save(); g.globalAlpha = a; g.strokeStyle = '#ffd23f'; g.lineWidth = 9 * s; for (const [px, py] of PEGS) { const v = G(px, py, -9.56).project(cam); g.beginPath(); g.arc((v.x + 1) / 2 * 1080 * s, (1 - v.y) / 2 * 1920 * s, 70 * s * lerp(1.4, 1, easeOut(a)), 0, 7); g.stroke(); } g.restore(); }
  }
  if (SHOT === 'guards' && t > W.shrug - 0.2) {              // the guard's thought: she's off being photographed
    const k = easeOutBack(clamp((t - W.shrug + 0.2) / 0.25), 1.6); g.save(); g.translate(720 * s, 470 * s); g.scale(k, k);
    g.fillStyle = 'rgba(255,255,255,.96)'; g.strokeStyle = '#16182a'; g.lineWidth = 6 * s;
    roundRect(g, -200 * s, -120 * s, 400 * s, 240 * s, 110 * s); g.fill(); g.stroke();
    for (const [x, y, r] of [[-170, 150, 22], [-200, 195, 13]]) { g.beginPath(); g.arc(x * s, y * s, r * s, 0, 7); g.fill(); g.stroke(); }
    const img = monaImage(); if (img) g.drawImage(img, 30 * s, -80 * s, 108 * s, 160 * s);
    cameraIcon(g, -70 * s, 0, 150 * s);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-10 * s, -60 * s); g.lineTo(20 * s, -80 * s); g.lineTo(5 * s, -40 * s); g.fill();
    g.restore();
  }
  if (SHOT === 'isnt') { const a = clamp((t - T.isnt) / 0.15); g.save(); g.globalAlpha = 0.28 * a * (0.7 + 0.3 * Math.sin(t * 14)); const gr = g.createRadialGradient(540 * s, 960 * s, 300 * s, 540 * s, 960 * s, 1100 * s); gr.addColorStop(0, 'rgba(230,57,70,0)'); gr.addColorStop(1, 'rgba(230,57,70,1)'); g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); stamp(g, s, t, W.isnt + 0.15, 'STOLEN!', 540, 520, '#e63946', 140); }
  if (SHOT === 'front') { tag(g, s, t, T.front, 'CLOSED FOR A WEEK'); }
  if (SHOT === 'search' && t > W.sixty - 0.1) {
    const k = easeOut(clamp((t - W.sixty + 0.1) / 0.7)), n = Math.round(60 * k);
    bigText(g, s, `${n}`, 540, 380, 170, '#ffffff', easeOutBack(clamp((t - W.sixty + 0.1) / 0.2), 1.8), -0.04);
    bigText(g, s, 'POLICE', 540, 520, 90, '#9fd0ff', easeOutBack(clamp((t - W.sixty) / 0.2), 1.8), -0.04);
  }
  if (SHOT === 'picasso' && t > W.picasso - 0.15) {
    const k = easeOutBack(clamp((t - W.picasso + 0.15) / 0.25), 1.8); g.save(); g.translate(700 * s, 440 * s); g.rotate(0.05); g.scale(k, k);
    roundRect(g, -260 * s, -80 * s, 520 * s, 160 * s, 24 * s); g.fillStyle = 'rgba(14,18,34,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText('QUESTIONED:', 0, -36 * s);
    g.font = `${62 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('PABLO PICASSO', 0, 26 * s); g.restore();
  }
  if (SHOT === 'table' && t > W.table - 0.05) {             // she's right under his elbow
    const k = easeOutBack(clamp((t - W.table + 0.05) / 0.25), 1.8), bob = 10 * Math.sin(t * 8);
    bigText(g, s, "SHE'S RIGHT HERE!", 540, 520, 78, '#ffd23f', k, -0.04);
    g.save(); g.translate(540 * s, (640 + bob) * s); g.scale(k, k); g.fillStyle = '#ffd23f'; g.strokeStyle = '#16141f'; g.lineWidth = 8 * s;
    g.beginPath(); g.moveTo(-40 * s, 0); g.lineTo(40 * s, 0); g.lineTo(40 * s, 70 * s); g.lineTo(80 * s, 70 * s); g.lineTo(0, 140 * s); g.lineTo(-80 * s, 70 * s); g.lineTo(-40 * s, 70 * s); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
  if (SHOT === 'queue') tag(g, s, t, T.queue, 'THE MUSEUM REOPENS');
  papers(g, s, t);
  if (t >= T.italy && t < T.dealer + 0.4) tag(g, s, t, T.italy, '2 YEARS LATER', 'Florence, Italy');
  if (SHOT === 'dealer' && t > W.real - 0.05) stamp(g, s, t, W.real - 0.05, 'REAL', 760, 520, '#1e9e55', 110, 0.1);
  if (SHOT === 'calls' && t > W.police2 - 0.1) stamp(g, s, t, W.police2 - 0.1, 'ARRESTED!', 540, 520, '#e63946', 120);
  if (SHOT === 'then') {
    const a = clamp((t - T.then) / 0.15); g.save(); g.globalAlpha = 0.32 * a; g.fillStyle = '#a07a4a'; g.globalCompositeOperation = 'color'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    bigText(g, s, '1911', 540, 380, 150, '#f2ead8', easeOutBack(a, 1.6), -0.04);
    if (t > W.hardly - 0.1) bigText(g, s, '(nobody looking)', 540, 510, 56, '#ffffff', easeOutBack(clamp((t - W.hardly + 0.1) / 0.2), 1.6), -0.04);
  }
  if (t >= T.today && t < T.cta + 0.1) {
    const a = 1 - clamp((t - T.cta) / 0.15);
    g.save(); g.globalAlpha = a; bigText(g, s, 'TODAY', 540, 380, 150, '#ffd23f', easeOutBack(clamp((t - T.today) / 0.2), 1.6), -0.04);
    if (t > W.famous - 0.1) bigText(g, s, 'THE MOST FAMOUS', 540, 510, 74, '#ffffff', easeOutBack(clamp((t - W.famous + 0.1) / 0.2), 1.6), -0.04);
    if (t > W.world - 0.15) bigText(g, s, 'PAINTING ON EARTH', 540, 600, 74, '#ffffff', easeOutBack(clamp((t - W.world + 0.15) / 0.2), 1.6), -0.04);
    g.restore();
  }
  if (t >= T.cta) {                                       // call to action
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

export const cast = () => ({ max, mia, leo, skye, noob, folk0: folk[0], folk1: folk[1], folk2: folk[2] });
export const TIMES = T;
export const props = () => PROPS;
