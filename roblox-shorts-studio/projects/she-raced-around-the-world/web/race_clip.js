// She Raced Around The World. Web renderer + Roblox R6 pack. True story (Nellie Bly, 1889-90): a famous book says
// eighty days; her editor wants to send a man ("start the man, and I'll beat him"); she sails two days later with one
// dress, one coat and one small bag, meets the author in Amiens, crosses Suez, Ceylon and Singapore, learns in Hong Kong
// that a magazine sent a rival the other way the same day, loses two days to Pacific storms, races across America on a
// special train and finishes in 72 days, 6 hours, 11 minutes; the rival comes home four and a half days later.
// Mia is the reporter, Leo her editor, Max the author, Skye the rival, the Noob the train driver; recoloured Noobs are
// the crowd. Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'She Raced Around The World' };
export const sky = { zenith: '#3f86e0', horizon: '#cfe6ff', below: '#e9f4ff', fog: '#d6e6f5', sunDir: new THREE.Vector3(0.45, 0.65, 0.6) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;

// ---------- key times (all on the narration) ----------
const T = {
  editor: W.editor - 0.1, reply: W.start - 0.15, sail: W.two1 - 0.1, verne: W.france - 0.1, route: W.suez - 0.15, hong: W.hong - 0.1,
  rival: W.magazine - 0.1, race: W.papers - 0.1, storm: W.storms - 0.1, train: W.newspaper - 0.1, finish: W.seventytwo - 0.1,
  book: W.beat2 - 0.1, rival2: W.rival2 - 0.1, cta: W.follow - 0.15,
};
// the journey day shown on the counter at each beat (her real dates, roughly)
const DAYS = [[W.sails, 0], [W.france, 8], [W.suez, 13], [W.ceylon, 22], [W.singapore, 34], [W.hong, 39], [W.storms, 55], [W.newspaper, 68], [W.seventytwo, 72]];
function dayAt(t) {
  if (t < DAYS[0][0]) return 0;
  for (let i = 1; i < DAYS.length; i++) if (t < DAYS[i][0]) { const [a, da] = DAYS[i - 1], [b, db] = DAYS[i]; return Math.floor(lerp(da, db, smooth(clamp((t - a) / Math.min(1.0, b - a))))); }
  return 72;
}

// ---------- scene ----------
let A = {}, mia, leo, max, skye, noob, crowd = [], P = {}, S = {}, PLACES = {}, SHOT = 'hook', ship, trn, smokes = [];
const CROWD_SHIRT = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#3a86ff', '#264653'], CROWD_PANTS = ['#264653', '#1d3557', '#495057', '#5c4033', '#2b2d42', '#3d405b'];
const CROWD_SKIN = ['#c68642', '#f1c27d', '#8d5524', '#e0ac69', '#d29a66', '#f1c27d'];
const FACES = ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'nervous', 'talking', 'determined', 'sad', 'smug', 'confused', 'mouth_o', 'laugh', 'annoyed'];
export async function setup(stage) {
  const { scene } = stage;
  [mia, leo, max, skye, noob] = await Promise.all([
    loadRobloxCharacter('Mia', { expressions: FACES }), loadRobloxCharacter('Leo', { expressions: FACES, hairLift: 0.16 }),
    loadRobloxCharacter('Max', { expressions: FACES }), loadRobloxCharacter('Skye', { expressions: FACES }), loadRobloxCharacter('Noob', { expressions: FACES }),
  ]);
  scene.add(mia.root, leo.root, max.root, skye.root, noob.root);
  for (let i = 0; i < 6; i++) {
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'surprised'] });
    e.root.traverse((o) => { if (!o.isMesh || o.name === 'Face') return; const c = o.name === 'Torso' ? CROWD_SHIRT[i] : /Leg/.test(o.name) ? CROWD_PANTS[i] : CROWD_SKIN[i]; o.material = o.material.clone(); o.material.map = null; o.material.color.set(c); });
    scene.add(e.root); crowd.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'clap', 'laugh_big', 'point_forward', 'talk', 'look_up', 'facepalm']) A[n] = await loadAnimation(n);
  const dk = K.dock(scene); PLACES.dock = dk.group; S.book = dk.book; S.cross = dk.cross;
  const of = K.office(scene); PLACES.office = of.group; S.lamp = of.lamp;
  PLACES.amiens = K.amiens(scene).group;
  const se = K.sea(scene); PLACES.sea = se.group; S.swell = se.swell;
  PLACES.prairie = K.prairie(scene).group;
  PLACES.station = K.station(scene).group;
  ship = K.steamship(); scene.add(ship); ship.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  trn = K.train(); scene.add(trn); trn.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const add = (k, o) => { P[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('bag', K.travelBag()); add('book', K.smallBook()); add('tele', K.telegram());
  smokes = K.smoke(12); smokes.forEach((p) => { p.visible = false; scene.add(p); });
}

// ---------- the ship and the train ----------
const SHIP_DOCK = V(0, 0, 7.6);                                   // moored beside the pier (+z of it)
function shipAt(s) {
  if (SHOT === 'hook' || SHOT === 'book') return { pos: SHIP_DOCK.clone(), roll: 0, pitch: 0, place: 'dock' };
  if (SHOT === 'sail') { const u = clamp((s - W.sails + 0.3) / 6); return { pos: SHIP_DOCK.clone().add(V(14 * u * u + 2 * u, 0, 3 * u * u)), roll: 0.01 * Math.sin(s * 1.3), pitch: 0, place: 'dock' }; }
  if (['route', 'hong', 'race', 'storm', 'cta'].includes(SHOT)) {
    const storm = SHOT === 'storm';
    return { pos: K.SEA.clone().add(V(6 * (s - T.route) - 60, (storm ? 0.9 : 0.25) * Math.sin(s * (storm ? 1.6 : 0.9)), 0)), roll: (storm ? 0.16 : 0.025) * Math.sin(s * (storm ? 1.3 : 0.8)), pitch: (storm ? 0.09 : 0.012) * Math.sin(s * (storm ? 1.9 : 1.1) + 1), place: 'sea' };
  }
  return null;
}
function trainAt(s) {
  if (SHOT === 'train') return { x: 34 * (s - T.train) - 80, dir: 1 };
  if (SHOT === 'rival') return { x: 60 - 30 * (s - T.rival), dir: -1 };
  return null;
}

// ---------- the cast ----------
const st = (pos, heading, face = 'happy') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const BAG_L = [['L', 0.1, -0.1]];                                // the bag hangs from her left hand
const onShip = (local) => { ship.updateMatrixWorld(true); return ship.localToWorld(local.clone()); };
const HOOK_POS = V(-1.2, K.PIER_Y, -1.8);
const OF = (x, z, y = 0) => K.OFFICE.clone().add(V(x, y, z));
const AM = (x, z, y = 0) => K.AMIENS.clone().add(V(x, y, z));
const STN = (x, z) => K.STATION.clone().add(V(x, K.PLAT_Y, z));

function miaAt(s) {
  let x = st(HOOK_POS, R90 - 0.35, 'happy'); x.bag = 'L'; x.arms = BAG_L;
  switch (SHOT) {
    case 'hook':
      if (s > W.reporter - 0.2) { x.face = 'smug'; x.arms = [...BAG_L, ['R', 0.25, -1.5]]; }
      if (s > W.faster - 0.1) { x.layers = [['point_forward', clamp(s - W.faster + 0.1, 0, 0.6), 1, false]]; x.arms = BAG_L; x.face = 'determined'; }
      break;
    case 'editor': case 'reply': {
      x = st(OF(1.8, 2.6), Math.PI - 0.55, 'neutral'); x.bag = null;
      if (SHOT === 'editor') x.face = s > W.job - 0.1 ? 'annoyed' : 'neutral';
      else { x.face = 'determined'; const k = smooth(inv(W.start - 0.1, W.start + 0.15, s)) * (1 - smooth(inv(W.start + 0.3, W.start + 0.5, s))); x.arms = [['R', 0.2, lerp(-0.6, -1.9, k)]]; if (s > W.beat1 - 0.1) x.face = 'smug'; }
      break;
    }
    case 'sail': {
      x = st(onShip(K.DECK_SPOT), ship.rotation.y, 'happy'); x.bag = 'L'; x.arms = BAG_L; x.wave = true; x.pos.y = onShip(K.DECK_SPOT).y;
      if (s > W.dress - 0.2) x.face = 'laugh';
      break;
    }
    case 'verne': {
      x = st(AM(-2.2, 4.4), 0.9, 'happy'); moveTo(x, AM(-9, 7), AM(-2.0, 2.6), T.verne, s, 12, 0.85); x.bag = 'L'; x.arms = BAG_L;
      if (!x.moving && s > W.meet) x.face = 'laugh';
      break;
    }
    case 'route': case 'race': case 'cta': {
      x = st(onShip(K.DECK_SPOT), 0, SHOT === 'race' ? 'determined' : 'happy'); x.bag = 'L'; x.arms = BAG_L;
      if (SHOT === 'cta') { x.wave = true; x.face = 'happy'; }
      break;
    }
    case 'hong': {
      x = st(onShip(K.DECK_SPOT), 0.1, 'neutral'); x.bag = null; x.tele = true;
      x.arms = [['R', 0.2, -1.25], ['L', 0.1, -0.2]]; x.face = s > W.news + 0.2 ? 'surprised' : 'neutral';
      break;
    }
    case 'storm': {
      x = st(onShip(K.DECK_SPOT.clone().add(V(-1, 0, -0.4))), -0.2, 'scared'); x.bag = 'L'; x.arms = [...BAG_L, ['R', 0.5, -0.9]];
      if (s > W.two2 - 0.2) x.face = 'annoyed';
      break;
    }
    case 'train': {
      const tr = trainAt(s); trn.updateMatrixWorld(true);
      x = st(trn.localToWorld(trn.userData.PLATFORM.clone()), 0.35, 'determined'); x.bag = null; x.wave = true;
      if (s > W.races - 0.2) x.face = 'laugh';
      break;
    }
    case 'finish': {
      x = st(STN(0, 1.5), Math.PI - 0.2, 'happy'); x.layers = [['proud', clamp(s - T.finish, 0, 0.5), 1, false]]; x.bag = null;
      if (s > W.minutes - 0.2) x.face = 'laugh';
      break;
    }
    case 'book': {
      x = st(HOOK_POS.clone().add(V(1.0, 0, 0.6)), R90 - 0.35, 'smug'); x.layers = [['proud', clamp(s - T.book, 0, 0.5), 1, false]]; x.bag = null;
      if (s > W.eight - 0.2) x.face = 'laugh';
      break;
    }
    case 'rival2': {
      x = st(STN(-2.5, 1.6), Math.PI + 0.45, 'smug'); x.bag = null; x.layers = [['idle', s]];
      if (s > W.half) x.face = 'laugh';
      break;
    }
    default: x.visible = false;
  }
  return x;
}
function leoAt(s) {                                                // the editor behind his desk
  const x = st(OF(0, -4.6), 0.35, 'neutral'); x.visible = SHOT === 'editor' || SHOT === 'reply';
  x.sit = true; x.pos.y = 1.85 - 1.5; x.layers = [['sit', 0, 1, false]]; x.arms = [['L', 0.1, -1.2], ['R', 0.1, -1.2]];
  if (SHOT === 'editor') { x.face = s > W.job - 0.2 ? 'smug' : 'neutral'; x.look = [0.25 * Math.sin((s - T.editor) * 9) * (s > W.job - 0.3 && s < W.man1 + 0.4 ? 1 : 0), 0]; }
  if (SHOT === 'reply') { x.face = s > W.start ? 'surprised' : 'smug'; if (s > W.beat1) x.face = 'shocked'; }
  return x;
}
function maxAt(s) {                                                // the author at his door
  const x = st(AM(1.2, 1.4), -0.75, 'happy'); x.visible = SHOT === 'verne'; x.book = true; x.arms = [['R', 0.25, -1.45]];
  if (s > W.wrote - 0.2) x.face = 'laugh';
  return x;
}
function skyeAt(s) {
  const x = st(V(0, 0, 0), 0, 'smug'); x.visible = false;
  if (SHOT === 'rival') {
    trn.updateMatrixWorld(true); x.visible = true; x.pos = trn.localToWorld(trn.userData.PLATFORM.clone());
    x.heading = Math.PI - 0.35; x.face = s > W.same - 0.2 ? 'smug' : 'determined'; x.wave = true;
  }
  if (SHOT === 'rival2') { x.visible = true; moveTo(x, STN(14, 1.8), STN(3.2, 1.6), T.rival2 - 0.2, s, 12, Math.PI - 0.5); x.face = x.moving ? 'scared' : 'sad'; if (!x.moving) x.layers = [['shrug', clamp(s - W.home, 0, 0.7), 1, false]]; }
  return x;
}
function noobAt(s) {                                               // the train driver in the cab
  const x = st(V(0, 0, 0), 0, 'determined'); x.visible = SHOT === 'train';
  if (x.visible) { trn.updateMatrixWorld(true); x.pos = trn.localToWorld(V(-3.8, 0, 0.7)); x.pos.y = trn.position.y + 2.3; x.sit = true; x.heading = 0.6; x.face = 'laugh'; x.layers = [['idle', 0]]; }
  return x;
}
const CROWD_AT = [[-6, 5.0], [-3.8, 6.0], [4, 5.4], [6.4, 4.4], [-8.4, 3.6], [8.6, 6.2]];
function crowdAt(i, s) {
  const [dx, dz] = CROWD_AT[i], x = st(STN(dx, dz), (dx < 0 ? 0.6 : -0.6) + Math.PI, 'happy');
  x.visible = SHOT === 'finish' || SHOT === 'rival2';
  x.layers = [['clap', s + i * 0.13, 1, true]]; x.face = i % 2 ? 'laugh' : 'happy';
  if (SHOT === 'rival2') { x.layers = [['idle', s + i]]; x.face = 'surprised'; }
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
let NOW = 0;
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
// the palm (measured on the pack mesh): (-+0.5, -1.3, 0) in the arm bone frame
const grip = (a, sd = 'R') => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -1.3, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
// just past the fist, for things held out in front of a raised arm (book, telegram)
const tip = (a, sd = 'R') => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -1.75, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.editor, 'editor'], [T.reply, 'reply'], [T.sail, 'sail'], [T.verne, 'verne'], [T.route, 'route'], [T.hong, 'hong'],
  [T.rival, 'rival'], [T.race, 'race'], [T.storm, 'storm'], [T.train, 'train'], [T.finish, 'finish'], [T.book, 'book'], [T.rival2, 'rival2'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'dock', editor: 'office', reply: 'office', sail: 'dock', verne: 'amiens', route: 'sea', hong: 'sea', rival: 'prairie', race: 'sea',
  storm: 'sea', train: 'prairie', finish: 'station', book: 'dock', rival2: 'station', cta: 'sea' };
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }
const MODES = {
  day: { zen: '#3f86e0', hor: '#cfe6ff', fog: '#d6e6f5', sun: 3.0, sunC: '#fff0dc', hemi: 0.6, env: 0.55, fill: 0.7, rim: 1.0, near: 120, far: 700 },
  office: { zen: '#3f86e0', hor: '#cfe6ff', fog: '#d6e6f5', sun: 0.6, sunC: '#fff0dc', hemi: 0.6, env: 0.4, fill: 0.5, rim: 0.6, near: 200, far: 900, lamp: 50 },
  dusk: { zen: '#2a2f6a', hor: '#f0905a', fog: '#7a5f72', sun: 1.6, sunC: '#ffb27a', hemi: 0.5, env: 0.35, fill: 0.5, rim: 1.2, near: 80, far: 500 },
  storm: { zen: '#252b3a', hor: '#5d6577', fog: '#4a5263', sun: 0.6, sunC: '#cfd8ff', hemi: 0.8, env: 0.35, fill: 0.5, rim: 0.6, near: 40, far: 260 },
  golden: { zen: '#5f8fe0', hor: '#ffe6c4', fog: '#f0dcc0', sun: 3.0, sunC: '#ffe2b8', hemi: 0.5, env: 0.5, fill: 0.6, rim: 1.4, near: 150, far: 800 },
};
function light(stage, mode, flash = 0) {
  const L = MODES[mode], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi + 2 * flash; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; S.lamp.intensity = L.lamp || 0;
  u.zenith.value.set(L.zen).lerp(new THREE.Color('#dfe6ff'), 0.6 * flash); u.horizon.value.set(L.hor); sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
}
const SHOT_MODE = { editor: 'office', reply: 'office', hong: 'dusk', storm: 'storm', train: 'golden', rival: 'golden', cta: 'golden' };

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  const flash = SHOT === 'storm' ? Math.max(0, 1 - Math.abs(((s - T.storm) % 1.7) - 0.85) * 12) * 0.5 : 0;
  light(stage, SHOT_MODE[SHOT] || 'day', flash);
  if (place0 === 'sea') K.setWaves(S.swell, s, SHOT === 'storm' ? 2.2 : 0.45);

  // ship and train
  const sh = shipAt(s); ship.visible = !!sh;
  if (sh) { ship.position.copy(sh.pos); ship.rotation.set(sh.roll, 0, sh.pitch); ship.updateMatrixWorld(true); }
  const tr = trainAt(s); trn.visible = !!tr;
  if (tr) {
    trn.position.copy(K.PRAIRIE).add(V(tr.x, 0, 0)); trn.rotation.set(0, tr.dir > 0 ? 0 : Math.PI, 0); trn.updateMatrixWorld(true);
    for (const w of trn.userData.wheels) w.rotation.y = tr.x / 0.8;
    trn.userData.sign.visible = tr.dir > 0;                      // the rival's train isn't the Nellie Bly Special
  }
  // cast
  place(mia, miaAt(s)); place(leo, leoAt(s)); place(max, maxAt(s)); place(skye, skyeAt(s)); place(noob, noobAt(s));
  crowd.forEach((c, i) => place(c, crowdAt(i, s)));
  // props in hands
  const mx = miaAt(s);
  P.bag.visible = !!mx.bag && mia.root.visible; if (P.bag.visible) { P.bag.position.copy(grip(mia, 'L')); P.bag.rotation.set(0, mia.root.rotation.y, 0); }
  P.tele.visible = !!mx.tele && mia.root.visible; if (P.tele.visible) { P.tele.position.copy(tip(mia, 'R')).add(V(0, -0.3, 0)); P.tele.rotation.set(-0.2, mia.root.rotation.y, 0); }
  P.book.visible = max.root.visible; if (P.book.visible) { P.book.position.copy(tip(max, 'R')).add(V(0, -0.45, 0)); P.book.rotation.set(0, max.root.rotation.y, 0); }
  // the "80" crossed out at the end
  S.cross.visible = SHOT === 'book' && s > W.eight - 0.15;
  // smoke from the funnels or the locomotive
  smokes.forEach((p) => { p.visible = false; });
  const src = sh && ship.visible ? ship.userData.funnels.map((f) => ship.localToWorld(f.clone())) : tr ? [trn.localToWorld(trn.userData.stack.clone())] : [];
  if (src.length) smokes.forEach((p, i) => {
    const a = ((s * 0.7 + i / smokes.length) % 1), o = src[i % src.length], drift = tr ? V(-tr.dir * 14 * a, 0, 0) : V(-5 * a, 0, 0);
    p.visible = true; p.position.copy(o).add(V(0, a * 5, 0)).add(drift); p.scale.setScalar(0.6 + a * 2.2); p.material.opacity = 0.55 * (1 - a);
  });

  // cameras
  const hd = mia.root.visible ? headPos(mia) : V(0, 5, 0);
  switch (shot.id) {
    case 'hook': { const k = easeOut(clamp(t / 2.2)); look(stage, V(lerp(8.5, 12.5, k), K.PIER_Y + lerp(2.8, 3.6, k), lerp(-0.6, 0.2, k)), V(-2.5, K.PIER_Y + lerp(4.4, 5.2, k), -2.2), 50, 14); break; }
    case 'editor': look(stage, OF(10.5, -0.6, 4.6), OF(0.8, -0.8, 4.4), 48, 14); break;
    case 'reply': look(stage, OF(-0.4, -1.4, 5.0), OF(1.8, 2.6, 4.9), 46, 10); break;
    case 'sail': { const sp = ship.position; look(stage, V(sp.x + 6, 6.5, sp.z + 24), V(sp.x + 2, 8.0, sp.z + 2), 50, 26); break; }
    case 'verne': look(stage, AM(4.5, 13.5, 4.2), AM(-0.5, 2.0, 4.6), 50, 16); break;
    case 'route': { const sp = ship.position; look(stage, V(sp.x + 10, 9, sp.z + 32), V(sp.x, 6, sp.z), 52, 34); break; }
    case 'hong': look(stage, hd.clone().add(V(1.8, -0.4, 7.4)), hd.clone().add(V(0, -0.6, 0)), 44, 10); break;
    case 'race': look(stage, hd.clone().add(V(-2.4, 0.2, 7.2)), hd.clone().add(V(0, 1.0, 0)), 46, 12); break;
    case 'storm': { const sp = ship.position; look(stage, V(sp.x + 14, 5, sp.z + 26), V(sp.x + 1, 6, sp.z), 54, 30); break; }
    case 'train': case 'rival': { const tp = trn.position, d = tr ? tr.dir : 1, pf = trn.localToWorld(trn.userData.PLATFORM.clone()); look(stage, pf.clone().add(V(-3 * d, 3.2, 13 * d)), pf.clone().add(V(4 * d, 3.6, 0)), 50, 26); break; }
    case 'finish': look(stage, STN(1.5, -9.5).add(V(0, 3.0, 0)), STN(0, 2.5).add(V(0, 4.0, 0)), 52, 18); break;
    case 'book': look(stage, V(10.5, K.PIER_Y + 3.4, 1.0), V(-2.5, K.PIER_Y + 5.2, -2.0), 50, 14); break;
    case 'rival2': look(stage, STN(1.5, -10).add(V(0, 3.0, 0)), STN(1.5, 2.0).add(V(0, 4.0, 0)), 52, 18); break;
    case 'cta': { const sp = ship.position; look(stage, V(sp.x + 6, 7, sp.z + 22), V(sp.x + 2, 8.5, sp.z + 2), 50, 26); break; }
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  S.miaHead2D = null; S.leoHead2D = null;
  if (mia.root.visible) { const p = headPos(mia).project(stage.camera); S.miaHead2D = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
  if (leo.root.visible) { const p = headPos(leo).project(stage.camera); S.leoHead2D = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, t0, d = 0.22, sp = 2.2) => easeOutBack(clamp((t - t0) / d), sp);
function bubble(g, s, text, x, y, k, size = 54) {
  if (k <= 0 || x == null) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70, h = size * 1.9;
  const bx = clamp(x - w / 2, 60, 900 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  const tx = clamp(x, bx + 40, bx + w - 40);
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h - 3) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, (bx + w / 2) * s, (by + h / 2 + 4) * s);
  g.restore();
}
// the journey counter: DAY n / 80 with a bar, top left under the For You tabs
function dayHud(g, s, t) {
  if (t < W.sails - 0.2 || t >= T.cta) return;
  const d = dayAt(t), a = clamp((t - W.sails + 0.2) / 0.25), x = 50, y = 236, w = 620, h = 104;
  g.save(); g.globalAlpha = a;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.font = `${50 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`DAY ${d}`, (x + 26) * s, (y + 54) * s);
  const bx = x + 250, bw = 330; roundRect(g, bx * s, (y + 40) * s, bw * s, 26 * s, 13 * s); g.fillStyle = 'rgba(255,255,255,.15)'; g.fill();
  roundRect(g, bx * s, (y + 40) * s, bw * clamp(d / 80) * s, 26 * s, 13 * s); g.fillStyle = d > 72 ? '#ff4d4d' : '#7CFC9A'; g.fill();
  g.font = `800 ${24 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.fillText('80', (bx + bw) * s, (y + 86) * s);
  g.restore();
}
// the route map: a small world map card with the route dots, the ship on the line, place names popping in
const ROUTE = [[0.27, 0.42, 'NEW YORK'], [0.47, 0.36, 'FRANCE'], [0.55, 0.5, 'SUEZ CANAL'], [0.69, 0.62, 'CEYLON'], [0.77, 0.66, 'SINGAPORE'], [0.82, 0.52, 'HONG KONG']];
function routeMap(g, s, t) {
  const k = pop(t, T.route, 0.25, 1.6) * (1 - clamp((t - T.hong + 0.2) / 0.2)); if (k <= 0) return;
  const x = 90, y = 380, w = 900, h = 470;
  g.save(); g.translate(540 * s, (y + h / 2) * s); g.scale(k, k); g.translate(-540 * s, -(y + h / 2) * s);
  roundRect(g, x * s, y * s, w * s, h * s, 28 * s); g.fillStyle = '#e9dcb8'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#5a4330'; g.stroke();
  g.fillStyle = '#9db36a';                                                   // crude continents
  const blob = (cx, cy, rx, ry) => { g.beginPath(); g.ellipse((x + cx * w) * s, (y + cy * h) * s, rx * w * s, ry * h * s, 0, 0, 7); g.fill(); };
  blob(0.2, 0.35, 0.12, 0.22); blob(0.27, 0.72, 0.06, 0.18); blob(0.5, 0.33, 0.07, 0.12); blob(0.52, 0.62, 0.08, 0.2); blob(0.72, 0.4, 0.17, 0.18); blob(0.85, 0.78, 0.07, 0.08);
  const idx = t < W.suez ? 1 : t < W.ceylon ? 2 : t < W.singapore ? 3 : 4, prog = idx + smooth(clamp((t - [W.suez, W.ceylon, W.singapore, W.hong][Math.min(3, idx - 1)] + 0.4) / 0.6)) * 0;
  g.setLineDash([10 * s, 10 * s]); g.lineWidth = 6 * s; g.strokeStyle = '#a8262c'; g.beginPath();
  ROUTE.slice(0, idx + 1).forEach(([px, py], i) => { const X = (x + px * w) * s, Y = (y + py * h) * s; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); g.setLineDash([]);
  ROUTE.forEach(([px, py, name], i) => {
    if (i > idx) return; const X = (x + px * w) * s, Y = (y + py * h) * s;
    g.beginPath(); g.arc(X, Y, 11 * s, 0, 7); g.fillStyle = i === idx ? '#ffd23f' : '#a8262c'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#2b1d14'; g.stroke();
    if (i >= 2 && i === idx) { g.font = `${44 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 9 * s; g.strokeStyle = '#2b1d14'; g.strokeText(name, X, Y - 36 * s); g.fillStyle = '#ffffff'; g.fillText(name, X, Y - 36 * s); }
  });
  g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'storm') {                                         // rain
    const frame = Math.floor(t * 30); let st = 7919 + frame * 104729; const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
    g.save(); g.strokeStyle = 'rgba(210,220,240,.3)'; g.lineWidth = 2.2 * s; for (let i = 0; i < 110; i++) { const x = rnd() * 1180 - 50, y = rnd() * 1920, l = 40 + rnd() * 50; g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x - l * 0.3) * s, (y + l) * s); g.stroke(); } g.restore();
  }
  if (SHOT === 'train' || SHOT === 'rival') speedLines(g, s, t, 0.55, { cx: 540, cy: 1000 });
  dayHud(g, s, t);
  if (SHOT === 'hook') {
    bigText(g, s, '80 DAYS?', 540, 400, 140, '#ffd23f', 1, -0.03);
    if (t > W.faster - 0.1) bigText(g, s, 'SHE SAYS: FASTER', 540, 560, 76, '#ffffff', pop(t, W.faster - 0.1), 0.02);
  }
  if (SHOT === 'editor' && t > W.job - 0.3) bubble(g, s, 'A JOB FOR A MAN!', S.leoHead2D?.[0], Math.min((S.leoHead2D?.[1] ?? 900) - 40, 760), pop(t, W.job - 0.3));
  if (SHOT === 'reply' && t > W.start - 0.15) {
    const y = Math.min((S.miaHead2D?.[1] ?? 900) - 40, 700);
    bubble(g, s, 'START THE MAN...', S.miaHead2D?.[0], y, pop(t, W.start - 0.15));
    if (t > W.beat1 - 0.4) bubble(g, s, "I'LL BEAT HIM.", S.miaHead2D?.[0], y + 120, pop(t, W.beat1 - 0.4));
  }
  if (SHOT === 'sail') {                                          // what she packed
    [['1 DRESS', W.dress], ['1 COAT', W.coat], ['1 BAG', W.bag]].forEach(([txt, t0], i) => { if (t > t0 - 0.1) bigText(g, s, txt, 540, 470 + i * 120, 96, ['#ffffff', '#ffd23f', '#7CFC9A'][i], pop(t, t0 - 0.1), -0.03); });
  }
  if (SHOT === 'verne' && t > W.wrote - 0.3) bigText(g, s, 'THE AUTHOR!', 540, 470, 104, '#ffd23f', pop(t, W.wrote - 0.3), -0.04);
  routeMap(g, s, t);
  if (SHOT === 'hong' && t > W.news - 0.1) bigText(g, s, 'NEWS...', 540, 470, 110, '#ffffff', pop(t, W.news - 0.1), -0.03);
  if (SHOT === 'rival') {
    if (t > W.rival1 - 0.2) bigText(g, s, 'THE RIVAL', 540, 430, 110, '#ff6b9a', pop(t, W.rival1 - 0.2), -0.03);
    if (t > W.other - 0.2) bigText(g, s, '<- THE OTHER WAY', 540, 560, 80, '#ffffff', pop(t, W.other - 0.2), 0.02);
    if (t > W.same - 0.2) bigText(g, s, 'SAME DAY!', 540, 690, 96, '#ffd23f', pop(t, W.same - 0.2), -0.04);
  }
  if (SHOT === 'race' && t > W.papers - 0.1) {                    // the front page
    const k = pop(t, W.papers - 0.1, 0.35, 1.5);
    g.save(); g.translate(540 * s, 560 * s); g.rotate((1 - k) * 2.5 - 0.05); g.scale(k, k);
    g.fillStyle = '#f4efe2'; g.fillRect(-380 * s, -240 * s, 760 * s, 480 * s); g.strokeStyle = '#2b1d14'; g.lineWidth = 6 * s; g.strokeRect(-380 * s, -240 * s, 760 * s, 480 * s);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#2b1d14'; g.fillText('THE DAILY NEWS', 0, -190 * s);
    g.fillRect(-340 * s, -158 * s, 680 * s, 5 * s); g.font = `${92 * s}px "Luckiest Guy"`; g.fillStyle = '#a8262c'; g.fillText('THE GREAT RACE', 0, -80 * s);
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#2b1d14'; g.fillText('AROUND THE WORLD!', 0, 10 * s);
    for (let i = 0; i < 5; i++) g.fillRect(-340 * s, (80 + i * 28) * s, (i % 2 ? 620 : 680) * s, 10 * s);
    g.restore();
  }
  if (SHOT === 'storm' && t > W.two2 - 0.25) bigText(g, s, '-2 DAYS', 540, 470, 140, '#ff4d4d', pop(t, W.two2 - 0.25), 0.04, '#2a0a0a');
  if (SHOT === 'train' && t > W.special - 0.2) bigText(g, s, 'SPECIAL TRAIN!', 540, 470, 104, '#ffd23f', pop(t, W.special - 0.2), -0.03);
  if (SHOT === 'finish') {
    [['72 DAYS', W.seventytwo, 140], ['6 HOURS', W.six, 110], ['11 MINUTES', W.eleven, 100]].forEach(([txt, t0, sz], i) => { if (t > t0 - 0.1) bigText(g, s, txt, 540, 430 + i * 140, sz, i ? '#ffffff' : '#ffd23f', pop(t, t0 - 0.1), -0.03); });
  }
  if (SHOT === 'book' && t > W.eight - 0.2) bigText(g, s, 'ALMOST 8 DAYS FASTER', 540, 470, 76, '#7CFC9A', pop(t, W.eight - 0.2), -0.03);
  if (SHOT === 'rival2' && t > W.four - 0.2) bigText(g, s, '+4.5 DAYS', 540, 470, 130, '#ff6b9a', pop(t, W.four - 0.2), 0.04);
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

export const cast = () => ({ mia, leo, max, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
export const props = () => P;
