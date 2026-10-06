// The Dog Who Saved A Town. Web renderer + Roblox R6 pack. True story (the 1925 serum run to Nome): kids in Nome get
// sick and the medicine is nearly 700 miles away; ships can't get through the ice and planes can't fly in the cold, so
// twenty sled teams relay it. Twelve-year-old Togo leads the hardest leg: 170 miles out to reach it, back across the
// frozen sea in a blizzard (that night the ice blows out to sea), 261 miles in all. The outbreak is stopped; the statue
// in New York goes to Balto, who led the last 53 miles; Togo waits 76 years for his.
// Max is the musher (Seppala), Leo the doctor, Skye the sick kid, the Noob the pilot, Mia the last musher with Balto;
// recoloured Noobs are the crowd. Dogs: animal_collie_parts recoloured as huskies. Beats: web/beats.js
// (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { loadCreature, poseCreature, creatureLowest } from '../../../web/lib/creature.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Dog Who Saved A Town' };
export const sky = { zenith: '#1b2a4a', horizon: '#6d7fa3', below: '#e9f4ff', fog: '#8a9bb8', sunDir: new THREE.Vector3(0.45, 0.65, 0.6) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;

// ---------- key times (all on the narration) ----------
const T = {
  sick: W.kids - 0.1, ships: W.ships - 0.1, planes: W.planes - 0.1, dogs: W.dogs - 0.75, relay: W.twenty - 0.1, hardest: W.one - 0.1,
  togo: W.leader - 0.1, run: W.run - 0.3, back: W.turn - 0.35, ice: W.togo2 - 0.1, night: W.night - 0.35, miles: W.two - 0.1,
  arrive: W.five - 0.1, statue: W.but - 0.1, wait: W.togo3 - 0.1, cta: W.follow - 0.15,
};

// ---------- scene ----------
let A = {}, max, leo, skye, noob, mia, crowd = [], dogs = [], balto, statues = [], P = {}, S = {}, PLACES = {}, SHOT = 'hook', NOW = 0, team;
const CROWD_SHIRT = ['#e63946', '#2a9d8f', '#f4a261', '#3a86ff'], CROWD_PANTS = ['#264653', '#1d3557', '#495057', '#2b2d42'], CROWD_SKIN = ['#c68642', '#f1c27d', '#8d5524', '#e0ac69'];
const FACES = ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'nervous', 'talking', 'determined', 'sad', 'smug', 'confused', 'mouth_o', 'laugh', 'annoyed'];
const DOG = 0.55;                                                // husky scale (the collie is 5.6 long, 4.2 tall)
// the team: Togo leads alone; three pairs behind him. Fur: [dark coat, light coat]
const COATS = [['#4f565e', '#e9ecef'], ['#6b5a4a', '#efe6da'], ['#3a3d42', '#f2f2f2'], ['#8a939c', '#f5f5f5'], ['#5c4a3a', '#e8dccb'], ['#757d86', '#ffffff'], ['#45494f', '#ececec']];
const SLOTS = [[17.2, 0], [13.4, -1.05], [13.4, 1.05], [9.6, -1.05], [9.6, 1.05], [5.8, -1.05], [5.8, 1.05]];   // team-frame x (forward), z
async function husky(coat) {
  const d = await loadCreature('animal_collie_parts'); d.root.scale.setScalar(DOG);
  d.obj.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    const out = ms.map((m) => { const c = m.clone(); if (/fur_black/.test(m.name)) { c.map = null; c.color.set(coat[0]); } else if (/fur_white/.test(m.name)) { c.map = null; c.color.set(coat[1]); } return c; });
    o.material = Array.isArray(o.material) ? out : out[0]; o.castShadow = true;
  });
  return d;
}
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, skye, noob, mia] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: FACES }), loadRobloxCharacter('Leo', { expressions: FACES, hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: FACES }), loadRobloxCharacter('Noob', { expressions: FACES }), loadRobloxCharacter('Mia', { expressions: FACES }),
  ]);
  scene.add(max.root, leo.root, skye.root, noob.root, mia.root);
  for (let i = 0; i < 4; i++) {
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'surprised'] });
    e.root.traverse((o) => { if (!o.isMesh || o.name === 'Face') return; const c = o.name === 'Torso' ? CROWD_SHIRT[i] : /Leg/.test(o.name) ? CROWD_PANTS[i] : CROWD_SKIN[i]; o.material = o.material.clone(); o.material.map = null; o.material.color.set(c); });
    scene.add(e.root); crowd.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'clap', 'laugh_big', 'point_forward', 'talk', 'look_up', 'facepalm']) A[n] = await loadAnimation(n);
  for (let i = 0; i < SLOTS.length; i++) { const d = await husky(COATS[i]); scene.add(d.root); dogs.push(d); }
  balto = await husky(['#1f2226', '#3a3d42']); scene.add(balto.root);
  for (let i = 0; i < 2; i++) {                                  // the bronze statues (Balto 1925, Togo 2001)
    const d = await loadCreature('animal_collie_parts'); d.root.scale.setScalar(DOG * 1.2);
    const br = K.BRONZE(); d.obj.traverse((o) => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(() => br) : br; o.castShadow = true; } });
    scene.add(d.root); statues.push(d);
  }
  const tw = K.town(scene); PLACES.town = tw.group; S.townLamp = tw.lamp;
  const rm = K.room(scene); PLACES.room = rm.group; S.roomLamp = rm.lamp;
  const hb = K.harbor(scene); PLACES.harbor = hb.group;
  PLACES.trail = K.trail(scene).group;
  const si = K.seaIce(scene); PLACES.ice = si.group; S.floes = si.floes; S.water = si.water; S.iceGround = si.ground; S.rhLamp = si.lamp;
  const pk = K.park(scene); PLACES.park = pk.group; S.cloth = pk.cloth; S.BALTO = pk.BALTO; S.TOGO = pk.TOGO;
  team = new THREE.Group(); scene.add(team);
  const sl = K.sled(); team.add(sl); S.sled = sl;
  const gl = K.box(18, 0.08, 0.08, K.std('#2a2a2a'), 3.9 + 9, 0.9, 0); team.add(gl);   // the gangline to Togo
  const add = (k, o) => { P[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('crate', K.crate()); add('bottle', K.cyl(0.22, 0.28, 0.75, K.std('#6a8f6a', { transparent: true, opacity: 0.75, roughness: 0.2 }), 12));
}

// ---------- the team (sled + dogs) ----------
// team state: origin = the sled's middle on the ground, heading (forward = (sin h, cos h)), dist travelled (for gaits)
const TR = (x, z) => K.TRAIL.clone().add(V(x, 0, z)), IC = (x, z) => K.ICE.clone().add(V(x, 0, z));
const TOWN_P = (x, z) => K.TOWN.clone().add(V(x, 0, z)), RM = (x, z, y = 0) => K.ROOM.clone().add(V(x, y, z));
const HB = (x, z, y = 0) => K.HARBOR.clone().add(V(x, y, z)), PK = (x, z, y = 0) => K.PARK.clone().add(V(x, y, z));
const SPEED = 15;
function teamAt(s) {
  const run = (from, t0, h = R90) => { const d = (s - t0) * SPEED; return { pos: from.clone().add(V(Math.sin(h) * d, 0, Math.cos(h) * d)), heading: h, dist: d, moving: true }; };
  switch (SHOT) {
    case 'dogs': return run(TR(-120, 0), T.dogs);
    case 'relay': return run(TR(-60, 0), T.relay);
    case 'hardest': return run(TR(0, 0), T.hardest);
    case 'togo': return run(TR(60, 0), T.togo);
    case 'run': return run(TR(120, 0), T.run);
    case 'back': {                                                // the U-turn: a half circle, then back along -x
      const t = s - T.back, r = 9, turnT = Math.PI * r / SPEED;
      if (t < 0.4) return run(TR(240, 0), T.back);
      const a = Math.min(Math.PI, (t - 0.4) * SPEED / r), c = TR(240 + 0.4 * SPEED, -r);
      if (t - 0.4 < turnT) return { pos: c.clone().add(V(Math.sin(a) * r, 0, Math.cos(a) * r)), heading: R90 + a, dist: t * SPEED, moving: true };
      const d = (t - 0.4 - turnT) * SPEED; return { pos: c.clone().add(V(-d, 0, -r)), heading: -R90, dist: t * SPEED, moving: true };
    }
    case 'ice': return run(IC(60, 0), T.ice, -R90);
    case 'night': return { pos: IC(112, 6), heading: -R90, dist: 0, moving: false };
    case 'miles': return { pos: TR(300, 0), heading: R90, dist: 0, moving: false };
    default: return null;
  }
}
function placeTeam(s) {
  const tm = teamAt(s); team.visible = !!tm;
  if (!tm) { dogs.forEach((d) => { d.root.visible = false; }); return null; }
  team.position.copy(tm.pos); team.rotation.set(0, tm.heading - R90, 0); team.updateMatrixWorld(true);
  dogs.forEach((d, i) => {
    const [x, z] = SLOTS[i], p = team.localToWorld(V(x, 0, z));
    placeDog(d, { pos: p, heading: tm.heading, dist: tm.dist + i * 0.7, moving: tm.moving, sit: tm.moving ? 0 : (SHOT === 'night' ? 1 : i === 0 ? 0 : 0.6), head: [0, 0, tm.moving ? -0.05 : 0.1], wag: tm.moving ? 0.5 : 1.2 }, s);
  });
  return tm;
}
function placeDog(d, x, s) {
  d.root.visible = x.visible !== false; if (!d.root.visible) return;
  d.root.position.copy(x.pos); d.root.rotation.set(0, x.heading - R90, 0);
  const ph = (x.dist / (2.4 * DOG / 0.62)) * Math.PI * 2, sw = x.moving ? 0.6 : 0, sn = Math.sin(ph), k = x.sit || 0;
  poseCreature(d, {
    Body: { r: [0, 0, -0.5 * k], p: [0, x.moving ? 0.15 * Math.abs(Math.cos(ph)) : 0, 0] },
    FrontL: [0, 0, sw * sn + 0.5 * k], RearR: [0, 0, sw * sn - 0.45 * k], FrontR: [0, 0, -sw * sn + 0.5 * k], RearL: [0, 0, -sw * sn - 0.45 * k],
    Head: [x.head[0], x.head[1], x.head[2] + 0.3 * k + (x.moving ? 0.05 * Math.sin(ph * 2) : 0)],
    Tail: [0, 0.35 * Math.sin(s * 6 * (x.wag || 1) + 1.0), -0.2 * k + (x.moving ? -0.3 : 0)],
  });
  d.root.updateMatrixWorld(true);
  const low = creatureLowest(d, ['FrontL', 'FrontR', 'RearL', 'RearR', 'Body']);
  d.root.position.y += x.pos.y - low; d.root.updateMatrixWorld(true);
}

// ---------- the cast ----------
const st = (pos, heading, face = 'happy') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
const HANDLE = [['L', 0.25, -1.2], ['R', 0.25, -1.2]];
function maxAt(s, tm) {                                           // the musher on the runners
  const x = st(V(0, 0, 0), 0, 'determined'); x.visible = !!tm && !['night', 'miles'].includes(SHOT);
  if (tm) {
    S.sled.updateMatrixWorld(true); x.pos = S.sled.localToWorld(S.sled.userData.STAND.clone()); x.heading = tm.heading; x.arms = HANDLE;
    x.layers = [['idle', 0]];
    if (SHOT === 'ice') { x.face = s > W.blizzard ? 'scared' : 'determined'; x.lean = 0.25; }
    if (SHOT === 'back') x.face = 'determined';
    if (SHOT === 'run' && s > W.reach) x.face = 'happy';
  }
  if (SHOT === 'miles') { x.visible = true; x.pos = TR(315.5, 2.8); x.heading = 0.3; x.face = 'happy'; x.layers = [['proud', clamp(s - T.miles, 0, 0.5), 1, false]]; }
  if (SHOT === 'cta') { x.visible = true; x.pos = PK(36.5, 4.5); x.heading = 0.25; x.face = 'happy'; x.wave = true; }
  if (SHOT === 'wait' && s > W.seventysix - 0.3) { x.visible = true; x.pos = PK(36.5, 4.5); x.heading = 0.25; x.face = 'happy'; }
  return x;
}
function leoAt(s) {                                               // the doctor
  const x = st(V(0, 0, 0), 0, 'nervous'); x.visible = false;
  if (SHOT === 'sick') { x.visible = true; x.pos = RM(1.6, -1.6); x.heading = -1.25; x.look = [0, 0.2]; x.face = s > W.seven ? 'scared' : 'nervous'; x.bottle = true; x.arms = [['R', 0.2, -0.9]]; }
  if (SHOT === 'arrive') { x.visible = true; x.pos = TOWN_P(-1, 1.6); x.heading = 0.1; x.face = s > W.stopped - 0.3 ? 'laugh' : 'happy'; x.crate = true; x.arms = [['L', 0.15, -1.25], ['R', 0.15, -1.25]]; }
  return x;
}
function skyeAt(s) {                                              // the sick kid
  const x = st(V(0, 0, 0), 0, 'sad'); x.visible = false;
  if (SHOT === 'sick') { x.visible = true; x.pos = RM(-2.5, -3.6, 2.2 - 1.5); x.heading = 0; x.sit = true; x.layers = [['sit', 0, 1, false]]; x.face = 'sad'; }
  if (SHOT === 'arrive') { x.visible = true; x.pos = TOWN_P(2.6, 2.4); x.heading = -0.35; x.face = s > W.stopped - 0.3 ? 'laugh' : 'happy'; if (s > W.stopped - 0.2) x.layers = [['clap', s - W.stopped, 1, true]]; }
  return x;
}
function noobAt(s) {                                              // the pilot by the frozen plane
  const x = st(V(0, 0, 0), 0, 'annoyed'); x.visible = SHOT === 'planes';
  if (x.visible) { x.pos = HB(11, 10.5); x.heading = 0.35; x.look = [0.35 * Math.sin((s - T.planes) * 8) * (s > W.cold - 0.6 ? 1 : 0), 0]; x.face = s > W.cold - 0.3 ? 'sad' : 'annoyed'; x.arms = [['L', 0.3, -0.4], ['R', 0.3, -0.4]]; }
  return x;
}
function miaAt(s) {                                               // the last musher, next to Balto's statue
  const x = st(V(0, 0, 0), 0, 'happy'); x.visible = SHOT === 'statue';
  if (x.visible) { x.pos = PK(-1.2, 4.6); x.heading = -0.25; x.wave = s > W.statue; x.face = s > W.balto - 0.2 ? 'laugh' : 'happy'; }
  return x;
}
const CROWD_AT = [[-13.5, 3.5], [-11.8, 6.4], [1.8, 6.8], [3.6, 3.8]];
function crowdAt(i, s) {
  const [dx, dz] = CROWD_AT[i], x = st(PK(dx, dz), dx < -6 ? 0.9 : -0.9, 'happy');
  x.visible = SHOT === 'statue'; x.layers = [['clap', s + i * 0.13, 1, true]]; x.face = i % 2 ? 'laugh' : 'happy';
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
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
const tip = (a, sd = 'R') => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -1.75, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.sick, 'sick'], [T.ships, 'ships'], [T.planes, 'planes'], [T.dogs, 'dogs'], [T.relay, 'relay'], [T.hardest, 'hardest'],
  [T.togo, 'togo'], [T.run, 'run'], [T.back, 'back'], [T.ice, 'ice'], [T.night, 'night'], [T.miles, 'miles'], [T.arrive, 'arrive'],
  [T.statue, 'statue'], [T.wait, 'wait'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'town', sick: 'room', ships: 'harbor', planes: 'harbor', dogs: 'trail', relay: 'trail', hardest: 'trail', togo: 'trail', run: 'trail',
  back: 'trail', ice: 'ice', night: 'ice', miles: 'trail', arrive: 'town', statue: 'park', wait: 'park', cta: 'park' };
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }
const MODES = {
  night: { zen: '#0f1a33', hor: '#3d4f78', fog: '#2a3654', sun: 0.5, sunC: '#a9c4ff', hemi: 0.55, env: 0.35, fill: 0.45, rim: 0.9, near: 60, far: 400, lamp: 60 },
  room: { zen: '#0f1a33', hor: '#3d4f78', fog: '#2a3654', sun: 0.3, sunC: '#a9c4ff', hemi: 0.55, env: 0.35, fill: 0.5, rim: 0.5, near: 200, far: 900, lamp: 55 },
  grey: { zen: '#8fa3bf', hor: '#dfe7f0', fog: '#d9e2ec', sun: 1.6, sunC: '#f4f7ff', hemi: 0.7, env: 0.5, fill: 0.6, rim: 0.8, near: 80, far: 520 },
  day: { zen: '#5d8fd6', hor: '#d9e9fb', fog: '#dfe9f4', sun: 2.6, sunC: '#fff4e2', hemi: 0.6, env: 0.5, fill: 0.6, rim: 1.0, near: 120, far: 700 },
  blizzard: { zen: '#b9c6d6', hor: '#e6edf4', fog: '#e3eaf2', sun: 0.9, sunC: '#f4f7ff', hemi: 0.95, env: 0.45, fill: 0.5, rim: 0.5, near: 8, far: 75 },
  dawn: { zen: '#5f7fc4', hor: '#ffc7a6', fog: '#f0d2c4', sun: 2.0, sunC: '#ffd2a8', hemi: 0.55, env: 0.45, fill: 0.6, rim: 1.3, near: 100, far: 600, lamp: 20 },
};
function light(stage, mode) {
  const L = MODES[mode], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  S.townLamp.intensity = PLACES.town.visible ? (L.lamp || 0) : 0; S.roomLamp.intensity = PLACES.room.visible ? (L.lamp || 0) : 0; S.rhLamp.intensity = PLACES.ice.visible ? (L.lamp || 0) : 0;
  u.zenith.value.set(L.zen); u.horizon.value.set(L.hor); sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
}
const SHOT_MODE = { hook: 'night', sick: 'room', ships: 'grey', planes: 'grey', dogs: 'grey', relay: 'grey', hardest: 'grey', togo: 'grey', run: 'grey', back: 'grey',
  ice: 'blizzard', night: 'night', miles: 'day', arrive: 'dawn', statue: 'day', wait: 'day', cta: 'day' };

export function update(t, stage) {
  const s = t; NOW = s; const { shot } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  light(stage, SHOT_MODE[SHOT]);

  // the ice blows out to sea at night
  const drift = SHOT === 'night' ? smooth(inv(W.storm - 0.2, W.crossed, s)) : 0;
  S.water.visible = SHOT === 'night'; S.iceGround.visible = SHOT !== 'night';
  S.floes.forEach((f) => { f.visible = SHOT === 'night'; f.position.copy(f.userData.base).add(V(-drift * 70 * f.userData.k, -0.1 * drift, drift * 8 * (f.userData.k - 1))); f.rotation.y = f.userData.k * drift * 0.5; });
  // the statues: the cloth lifts off Balto's; Togo's appears at the end of the wait
  const lift = smooth(inv(W.statue - 0.2, W.statue + 0.5, s));
  S.cloth.visible = SHOT === 'statue' && lift < 1; S.cloth.position.y = 5.6 + lift * 12; S.cloth.scale.setScalar(1 - 0.6 * lift);
  const togoUp = smooth(inv(W.seventysix - 0.4, W.seventysix + 0.1, s));
  statues.forEach((d, i) => {
    const show = place0 === 'park' && (i === 0 || togoUp > 0);
    placeDog(d, { visible: show, pos: (i ? S.TOGO : S.BALTO).clone().add(K.PARK).add(V(0, i ? (1 - togoUp) * -3 : 0, 0)), heading: i ? -R90 + 0.45 : R90 - 0.45, dist: 0, moving: false, sit: 0, head: [0, 0, -0.15], wag: 0 }, 0);
    if (show) d.root.scale.setScalar(DOG * 1.2 * (i ? Math.max(0.01, togoUp) : 1));
  });

  // the team
  const tm = placeTeam(s);
  const crateOn = tm && (SHOT === 'run' ? s > W.reach : ['back', 'ice', 'night'].includes(SHOT));
  // the cast
  place(max, maxAt(s, tm)); place(leo, leoAt(s)); place(skye, skyeAt(s)); place(noob, noobAt(s)); place(mia, miaAt(s));
  crowd.forEach((c, i) => place(c, crowdAt(i, s)));
  // Balto with Mia (statue shot); Togo next to his own statue (wait, cta), the team's lead dog elsewhere
  placeDog(balto, { visible: SHOT === 'statue', pos: PK(-3.2, 5.4), heading: 0.3, dist: 0, moving: false, sit: 1, head: [0, 0, 0.1], wag: 1.5 }, s);
  if (SHOT === 'wait' || SHOT === 'cta') placeDog(dogs[0], { pos: PK(43.5, 4.8), heading: -0.3, dist: 0, moving: false, sit: 1, head: [0, 0.2, SHOT === 'wait' && togoUp < 1 ? 0.25 : 0.05], wag: SHOT === 'cta' ? 2 : 0.6 }, s);
  if (SHOT === 'statue') placeDog(dogs[0], { pos: PK(-16, 3.2), heading: 0.9, dist: 0, moving: false, sit: 1, head: [0, -0.3, 0.3], wag: 0 }, s);   // Togo watches from the side
  // props
  const lx = leoAt(s);
  P.crate.visible = !!crateOn || !!lx.crate;
  if (crateOn) { S.sled.updateMatrixWorld(true); P.crate.position.copy(S.sled.localToWorld(S.sled.userData.CRATE.clone())); P.crate.rotation.set(0, tm.heading - R90 + R90, 0); }
  else if (lx.crate && leo.root.visible) { P.crate.position.copy(grip(leo, 'L').lerp(grip(leo, 'R'), 0.5)).add(V(0, -0.1, 0.35)); P.crate.rotation.set(0, leo.root.rotation.y, 0); }
  P.bottle.visible = !!lx.bottle && leo.root.visible; if (P.bottle.visible) P.bottle.position.copy(grip(leo, 'R')).add(V(0, 0.3, 0));

  // cameras
  const tp = tm ? tm.pos : V(0, 0, 0), h = tm ? tm.heading : 0, fw = V(Math.sin(h), 0, Math.cos(h)), rt = V(-fw.z, 0, fw.x);
  const lead = tm ? team.localToWorld(V(17.2, 0, 0)) : V();
  switch (shot.id) {
    case 'hook': { const k = easeOut(clamp(t / (T.sick - 0.1))); look(stage, TOWN_P(lerp(-30, -6, k), 22 - 4 * k).add(V(0, lerp(9, 6.5, k), 0)), TOWN_P(lerp(-12, 0, k), -6).add(V(0, 5.5, 0)), 44, 30); break; }
    case 'sick': look(stage, RM(2.4, 9.5, 6.2), RM(-1.6, -2.8, 4.0), 44, 14); break;
    case 'ships': { const k = clamp((t - T.ships) / 3); look(stage, HB(lerp(-2, -6, k), 2, 7.5), HB(-4, -42, 7), 40, 40); break; }
    case 'planes': look(stage, HB(4, 24, 5.0), HB(13, 8, 3.6), 42, 20); break;
    case 'dogs': look(stage, lead.clone().add(fw.clone().multiplyScalar(16 - 6 * clamp((t - T.dogs) / 2))).add(rt.clone().multiplyScalar(3)).add(V(0, 2.2, 0)), lead.clone().add(fw.clone().multiplyScalar(-6)).add(V(0, 1.6, 0)), 48, 26); break;
    case 'relay': look(stage, tp.clone().add(rt.clone().multiplyScalar(-34)).add(fw.clone().multiplyScalar(18)).add(V(0, 22, 0)), tp.clone().add(fw.clone().multiplyScalar(10)), 46, 40); break;
    case 'hardest': look(stage, tp.clone().add(rt.clone().multiplyScalar(-15)).add(fw.clone().multiplyScalar(6)).add(V(0, 4, 0)), tp.clone().add(fw.clone().multiplyScalar(7)).add(V(0, 2.6, 0)), 46, 24); break;
    case 'togo': look(stage, lead.clone().add(rt.clone().multiplyScalar(-5.8)).add(fw.clone().multiplyScalar(3.2)).add(V(0, 2.0, 0)), lead.clone().add(fw.clone().multiplyScalar(1.7)).add(V(0, 1.6, 0)), 44, 10); break;
    case 'run': look(stage, tp.clone().add(rt.clone().multiplyScalar(-9)).add(fw.clone().multiplyScalar(-9)).add(V(0, 5.5, 0)), tp.clone().add(fw.clone().multiplyScalar(9)).add(V(0, 2.0, 0)), 48, 24); break;
    case 'back': { const c = TR(240 + 0.4 * SPEED - 4, 26); look(stage, c.clone().add(V(0, 14, 0)), tp.clone().add(V(0, 2, 0)), 48, 40); break; }
    case 'ice': look(stage, tp.clone().add(rt.clone().multiplyScalar(-13)).add(fw.clone().multiplyScalar(4)).add(V(0, 4, 0)), tp.clone().add(fw.clone().multiplyScalar(6)).add(V(0, 2.4, 0)), 48, 22); break;
    case 'night': look(stage, IC(126, 14).add(V(0, 12, 0)), IC(40, -10).add(V(0, 0, 0)), 46, 60); break;
    case 'miles': look(stage, TR(318, 15).add(V(0, 5.4, 0)), TR(316.5, 0).add(V(0, 4.4, 0)), 46, 20); break;
    case 'arrive': look(stage, TOWN_P(0.8, 12).add(V(0, 4.6, 0)), TOWN_P(0.6, 0).add(V(0, 4.2, 0)), 46, 16); break;
    case 'statue': look(stage, PK(-5, 30).add(V(0, 6.5, 0)), PK(-5, 0).add(V(0, 4.5, 0)), 46, 24); break;
    case 'wait': { const k = smooth(clamp((t - T.wait) / 1.2)); look(stage, PK(lerp(-5, 41.5, k), lerp(30, 21, k)).add(V(0, 5.5, 0)), PK(lerp(-5, 41.5, k), 0).add(V(0, 4.8, 0)), 46, 20); break; }
    case 'cta': look(stage, PK(41.5, 21).add(V(0, 5.5, 0)), PK(41.5, 0).add(V(0, 4.8, 0)), 46, 20); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
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
function snow(g, s, t, n, wind, alpha, len = 0) {
  const frame = Math.floor(t * 30); let st = 1013 + frame * 7919; const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  g.save(); g.fillStyle = `rgba(255,255,255,${alpha})`; g.strokeStyle = `rgba(255,255,255,${alpha})`; g.lineWidth = 3 * s;
  for (let i = 0; i < n; i++) {
    const r0 = ((i * 0.6180339) % 1), r1 = ((i * 0.7548776) % 1), sp = 120 + r1 * 160;
    const x = ((r0 * 1300 + wind * t * sp) % 1300 + 1300) % 1300 - 110, y = ((r1 * 2100 + t * sp * 1.4) % 2100) - 90, rad = 3 + ((i * 37) % 7);
    if (len) { g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x - wind * len) * s, (y - len * 0.5) * s); g.stroke(); }
    else { g.beginPath(); g.arc(x * s, y * s, rad * s, 0, 7); g.fill(); }
  }
  rnd(); g.restore();
}
function stamp(g, s, t, t0, text, y, color = '#ff4d4d') {      // a red X with a word: NO SHIPS / NO PLANES
  const k = pop(t, t0, 0.22, 2.6); if (k <= 0) return;
  g.save(); g.translate(540 * s, y * s); g.scale(k, k); g.rotate(-0.06);
  g.lineWidth = 26 * s; g.strokeStyle = '#16141f'; g.lineCap = 'round';
  const X = () => { g.beginPath(); g.moveTo(-120 * s, -120 * s); g.lineTo(120 * s, 120 * s); g.moveTo(120 * s, -120 * s); g.lineTo(-120 * s, 120 * s); g.stroke(); };
  X(); g.lineWidth = 16 * s; g.strokeStyle = color; X();
  g.restore();
  bigText(g, s, text, 540, y + 190, 96, '#ffffff', k, -0.04);
}
// the relay strip: NENANA ... NOME with 20 stops; the crate hops along it
function relayStrip(g, s, t, prog, hi = -1) {
  const x0 = 110, x1 = 970, y = 640;
  g.save(); roundRect(g, 70 * s, (y - 90) * s, 940 * s, 190 * s, 28 * s); g.fillStyle = 'rgba(12,18,34,.85)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.lineWidth = 6 * s; g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([10 * s, 10 * s]); g.beginPath(); g.moveTo(x0 * s, y * s); g.lineTo(x1 * s, y * s); g.stroke(); g.setLineDash([]);
  for (let i = 0; i < 20; i++) {
    const x = lerp(x0, x1, i / 19), on = i / 19 <= prog + 1e-3, isHi = hi >= 0 && (i === hi || i === hi + 1);
    g.beginPath(); g.arc(x * s, y * s, (isHi ? 15 : 10) * s, 0, 7); g.fillStyle = isHi ? '#ff4d4d' : on ? '#7CFC9A' : '#ffffff'; g.fill();
  }
  const cx = lerp(x0, x1, prog); g.fillStyle = '#b88a52'; g.fillRect((cx - 22) * s, (y - 58) * s, 44 * s, 32 * s); g.fillStyle = '#d62828'; g.fillRect((cx - 4) * s, (y - 54) * s, 8 * s, 24 * s); g.fillRect((cx - 12) * s, (y - 46) * s, 24 * s, 8 * s);
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('NENANA', 84 * s, (y + 52) * s);
  g.textAlign = 'right'; g.fillText('NOME', 996 * s, (y + 52) * s);
  g.restore();
}
function counter(g, s, text, sub, k = 1) {
  if (k <= 0) return; const x = 50, y = 236, w = 560, h = 104;
  g.save(); g.globalAlpha = Math.min(1, k);
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#7CFC9A'; g.stroke();
  g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#7CFC9A'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, (x + 28) * s, (y + 56) * s);
  g.font = `800 ${26 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.textAlign = 'right'; g.fillText(sub, (x + w - 26) * s, (y + 58) * s);
  g.restore();
}
export function overlay(g, s, t) {
  const sh = SHOT;
  if (['hook', 'arrive'].includes(sh)) snow(g, s, t, 70, 0.25, 0.7);
  if (['ships', 'planes', 'dogs', 'relay', 'hardest', 'togo', 'run', 'back'].includes(sh)) snow(g, s, t, 60, 0.5, 0.6);
  if (sh === 'night') snow(g, s, t, 90, 1.2, 0.6);
  if (sh === 'ice') { snow(g, s, t, 160, 2.2, 0.75, 40); g.save(); g.fillStyle = 'rgba(235,242,250,.15)'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
  if (['dogs', 'run', 'back'].includes(sh)) speedLines(g, s, t, 0.35, { cx: 540, cy: 1000 });

  if (sh === 'hook') {
    bigText(g, s, '1925', 540, 330, 120, '#ffffff', pop(t, 0.05), -0.03);
    if (t > W.time1 - 0.35) bigText(g, s, 'RUNNING OUT', 540, 480, 104, '#ffd23f', pop(t, W.time1 - 0.35), -0.03);
    if (t > W.time1 - 0.15) bigText(g, s, 'OF TIME', 540, 590, 104, '#ffd23f', pop(t, W.time1 - 0.15), -0.03);
  }
  if (sh === 'sick') {
    if (t > W.medicine1 - 0.2) {                                   // a card: the medicine is far away
      const k = pop(t, W.medicine1 - 0.2, 0.25, 1.6);
      g.save(); g.translate(540 * s, 440 * s); g.scale(k, k);
      roundRect(g, -430 * s, -130 * s, 860 * s, 260 * s, 28 * s); g.fillStyle = 'rgba(12,18,34,.88)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
      g.font = `${46 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffffff'; g.fillText('NOME', -300 * s, -40 * s); g.fillStyle = '#7CFC9A'; g.fillText('MEDICINE', 270 * s, -40 * s);
      g.setLineDash([12 * s, 10 * s]); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.beginPath(); g.moveTo(-200 * s, -40 * s); g.lineTo(150 * s, -40 * s); g.stroke(); g.setLineDash([]);
      if (t > W.seven - 0.2) { g.font = `${70 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText('700 MILES', 0, 60 * s); }
      g.restore();
    }
  }
  if (sh === 'ships' && t > W.ice1 - 0.4) stamp(g, s, t, W.ice1 - 0.4, 'NO SHIPS', 560);
  if (sh === 'planes' && t > W.cold - 0.4) stamp(g, s, t, W.cold - 0.4, 'NO PLANES', 560);
  if (sh === 'dogs' && t > W.dogs - 0.15) bigText(g, s, 'SO... DOGS!', 540, 500, 130, '#ffd23f', pop(t, W.dogs - 0.15), -0.04);
  if (sh === 'relay') {
    relayStrip(g, s, t, clamp((t - T.relay) / Math.max(0.5, T.hardest - T.relay - 0.2)));
    if (t > W.twenty - 0.1) bigText(g, s, '20 TEAMS', 540, 420, 110, '#ffffff', pop(t, W.twenty - 0.1), -0.03);
    if (t > W.relay - 0.2) bigText(g, s, 'A RELAY!', 540, 860, 96, '#7CFC9A', pop(t, W.relay - 0.2), 0.03);
  }
  if (sh === 'hardest') {
    relayStrip(g, s, t, 0.45, 12);
    if (t > W.hardest - 0.25) bigText(g, s, 'THE HARDEST PART', 540, 420, 90, '#ff4d4d', pop(t, W.hardest - 0.25), -0.03);
  }
  if (sh === 'togo') {
    if (t > W.togo1 - 0.2) bigText(g, s, 'TOGO', 540, 470, 150, '#ffd23f', pop(t, W.togo1 - 0.2), -0.04);
    if (t > W.twelve - 0.2) bigText(g, s, 'AGE 12', 540, 610, 90, '#ffffff', pop(t, W.twelve - 0.2), 0.03);
  }
  if (sh === 'run') {
    const m = Math.round(170 * smooth(clamp((t - T.run) / Math.max(0.5, W.reach - T.run))));
    counter(g, s, `${m} MILES`, 'JUST TO REACH IT', 1);
    if (t > W.reach) bigText(g, s, 'GOT IT!', 540, 520, 120, '#7CFC9A', pop(t, W.reach), -0.04);
  }
  if (sh === 'back') { counter(g, s, '170 MILES', 'NOW BACK AGAIN', 1); if (t > W.back - 0.2) bigText(g, s, 'RACE BACK!', 540, 520, 120, '#ffd23f', pop(t, W.back - 0.2), -0.04); }
  if (sh === 'ice') {
    if (t > W.shortcut - 0.2) bigText(g, s, 'SHORTCUT', 540, 420, 110, '#ffd23f', pop(t, W.shortcut - 0.2), -0.03);
    if (t > W.frozen - 0.1) bigText(g, s, 'ACROSS A FROZEN SEA', 540, 540, 70, '#ffffff', pop(t, W.frozen - 0.1), 0.02);
    if (t > W.blizzard - 0.15) bigText(g, s, '-85°F WIND CHILL', 540, 660, 70, '#9fd3ff', pop(t, W.blizzard - 0.15), -0.02);
  }
  if (sh === 'night' && t > W.crossed - 0.2) bigText(g, s, 'JUST IN TIME', 540, 470, 120, '#ffd23f', pop(t, W.crossed - 0.2), -0.04);
  if (sh === 'miles') {                                            // bar chart: Togo's team vs the others
    const k = pop(t, T.miles + 0.05, 0.3, 1.4);
    g.save(); g.translate(540 * s, 560 * s); g.scale(k, k);
    roundRect(g, -440 * s, -230 * s, 880 * s, 460 * s, 28 * s); g.fillStyle = 'rgba(12,18,34,.88)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    const g0 = smooth(clamp((t - T.miles - 0.2) / 1.2));
    for (let i = 0; i < 6; i++) { const hgt = i === 0 ? 300 : [52, 38, 60, 44, 30][i - 1]; const x = -330 + i * 130;
      g.fillStyle = i === 0 ? '#7CFC9A' : 'rgba(255,255,255,.55)'; g.fillRect(x * s, (170 - hgt * g0) * s, 90 * s, hgt * g0 * s); }
    g.font = `${34 * s}px "Luckiest Guy"`; g.fillStyle = '#7CFC9A'; g.textAlign = 'center'; g.fillText('TOGO', -285 * s, 205 * s);
    g.fillStyle = '#ffffff'; g.fillText('OTHER TEAMS', 110 * s, 205 * s);
    g.restore();
    if (t > W.sixtyone - 0.2) bigText(g, s, '261 MILES', 540, 300, 120, '#7CFC9A', pop(t, W.sixtyone - 0.2), -0.03);
  }
  if (sh === 'arrive') {
    if (t > W.five - 0.1) bigText(g, s, '5½ DAYS', 540, 420, 110, '#ffffff', pop(t, W.five - 0.1), -0.03);
    if (t > W.stopped - 0.25) bigText(g, s, 'OUTBREAK STOPPED', 540, 560, 84, '#7CFC9A', pop(t, W.stopped - 0.25), 0.02);
  }
  if (sh === 'statue') {
    if (t > W.fiftythree - 0.2) bigText(g, s, 'LAST 53 MILES', 540, 420, 90, '#ffffff', pop(t, W.fiftythree - 0.2), -0.03);
    if (t > W.balto - 0.2) bigText(g, s, 'BALTO', 540, 560, 140, '#ffd23f', pop(t, W.balto - 0.2), -0.04);
  }
  if (sh === 'wait') {
    const y = Math.round(lerp(1925, 2001, smooth(clamp((t - W.wait) / Math.max(0.6, W.seventysix - W.wait)))));
    bigText(g, s, String(y), 540, 440, 150, y === 2001 ? '#7CFC9A' : '#ffffff', 1, -0.03);
    if (t > W.seventysix - 0.1) bigText(g, s, '76 YEARS LATER', 540, 590, 80, '#ffd23f', pop(t, W.seventysix - 0.1), 0.03);
  }
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

export const cast = () => ({ max, leo, skye, noob, mia });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
export const props = () => P;
export const leadPos = () => { dogs[0].root.updateMatrixWorld(true); return dogs[0].root.getWorldPosition(new THREE.Vector3()); };
