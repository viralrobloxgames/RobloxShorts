// The Postman's Palace. Web renderer + Roblox R6 pack. True story (Ferdinand Cheval, Hauterives, 1879-1912): a country
// postman trips on a strange stone, pockets it, and spends 33 years building a palace from the stones on his 30 km round
// (pockets, baskets, a wheelbarrow), working at night by an oil lamp while the village laughs. Refused burial in it, he
// builds his own tomb in eight more years. Today it's a protected monument and the village is famous because of him.
// Max is the postman (postman_kepi, satchel); Leo, Mia, Skye and Noob are villagers, then tourists and the stall keeper.
// Beats: web/beats.js (source/beats.py). Sets, props and the palace: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: "The Postman's Palace" };
export const sky = { zenith: '#3f86e6', horizon: '#cfe8ff', below: '#e9f4ff', fog: '#d6e9f7', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;
const S_ = (x, y, z) => K.SITE.clone().add(V(x, y, z));          // site-local to world
const C_ = (x, y, z) => K.CEMETERY.clone().add(V(x, y, z));

// ---------- key times (on the narration) ----------
const T = {
  pocket: W.kick - 0.1, dream: W.reminds - 0.15, round: W.so1 - 0.1, pockets: W.first - 0.1, baskets: W.baskets - 0.25, barrow: W.brings - 0.15,
  night: W.night - 0.1, laugh: W.whole - 0.1, keeps: W.keeps - 0.1, walls: W.twenty - 0.1, deco: W.animals - 0.1, done: W.later - 0.1,
  carved: W.writes - 0.1, law: W.asks - 0.1, tomb: W.so2 - 0.1, today: W.today - 0.1, famous: W.village2 - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.pocket, 'pocket'], [T.dream, 'dream'], [T.round, 'round'], [T.pockets, 'pockets'], [T.baskets, 'baskets'], [T.barrow, 'barrow'],
  [T.night, 'night'], [T.laugh, 'laugh'], [T.keeps, 'keeps'], [T.walls, 'walls'], [T.deco, 'deco'], [T.done, 'done'], [T.carved, 'carved'],
  [T.law, 'law'], [T.tomb, 'tomb'], [T.today, 'today'], [T.famous, 'famous'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'lane', pocket: 'lane', dream: 'site', round: 'lane', pockets: 'lane', baskets: 'lane', barrow: 'lane', night: 'site', laugh: 'site',
  keeps: 'site', walls: 'site', deco: 'site', done: 'site', carved: 'site', law: 'site', tomb: 'cemetery', today: 'site', famous: 'site', cta: 'site' };
const MODE_OF = { night: 'night', laugh: 'night', keeps: 'night', walls: 'lapse', deco: 'lapse', law: 'day', tomb: 'grey', dream: 'dream' };

// how much of the palace exists (walls, deco heights in world units) at time s
const YEAR0 = 1879, YEAR1 = 1912;
function palaceH(s) {
  if (s < T.night) return [0, 0];
  if (s < T.walls) return [1.5 + 1.2 * smooth(inv(T.night, T.walls, s)), 0];        // the first low courses
  if (s < T.deco) return [lerp(2.7, 16, smooth(inv(T.walls + 0.1, T.deco - 0.1, s))), 0];
  if (s < T.done) return [16, lerp(0, 30, smooth(inv(T.deco + 0.05, T.done - 0.1, s)))];
  return [100, 100];
}
function yearAt(s) {
  if (s < T.walls) return YEAR0;
  if (s < T.deco) return Math.round(lerp(YEAR0, 1899, smooth(inv(T.walls, T.deco - 0.1, s))));
  if (s < T.done) return Math.round(lerp(1899, YEAR1, smooth(inv(T.deco, T.done - 0.1, s))));
  return YEAR1;
}

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, kepi, P = {}, S = {}, PLACES = {}, SHOT = 'hook', cam, head2D = {};
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['surprised', 'happy', 'neutral', 'shocked', 'determined', 'smug', 'cool', 'sad', 'laugh', 'scared', 'confused'] }),
    loadRobloxCharacter('Leo', { expressions: ['laugh', 'happy', 'neutral', 'surprised', 'smug'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['laugh', 'happy', 'neutral', 'surprised', 'smug'], hairLift: 0.2 }),
    loadRobloxCharacter('Skye', { expressions: ['laugh', 'happy', 'neutral', 'surprised'] }),
    loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'annoyed'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root);
  kepi = await wear(max, 'postman_kepi');
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'laugh_big', 'point_forward', 'think', 'talk', 'look_up']) A[n] = await loadAnimation(n);

  S.ground = K.ground(scene);
  const ln = K.lane(scene); PLACES.lane = ln.group; S.ln = ln;
  const st = K.site(scene, stage.renderer); PLACES.site = st.group; S.st = st;
  const cm = K.cemetery(scene, stage.renderer); PLACES.cemetery = cm.group; S.cm = cm;
  const add = (k, o) => { P[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('stone', K.theStone()); add('basket', K.basket()); add('barrow', K.wheelbarrow());
  // satchel and strap ride Max's torso
  // (Torso bone space: the torso runs y 0..2, front face z +0.5; the bag hangs behind the left hip, clear of the arm)
  P.satchel = K.satchel(); P.satchel.position.set(0.45, 0.45, -0.8); max.bones.Torso.add(P.satchel);
  for (const z of [0.53, -0.53]) { const sp = K.strap(); sp.scale.y = 2.3 / 3.4; sp.position.set(-0.05, 1.15, z); sp.rotation.z = 0.8; max.bones.Torso.add(sp); }
  // the stones he's collected bulging his pockets (the pockets shot): little pebbles stuck to the hoodie pocket
  P.pocketStones = new THREE.Group(); max.bones.Torso.add(P.pocketStones);
  for (let i = 0; i < 6; i++) { const r = (i * 0.37) % 1; const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r * 0.06, 0), K.std('#a99476', { roughness: 0.9, flatShading: true })); p.position.set(-0.45 + i * 0.18, 0.55 + (i % 2) * 0.12, 0.56); P.pocketStones.add(p); }
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; x.dist = u * d; return x;
}
const headTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
// arm poses: [side, up, fwd] (fwd < 0 raises the arm in front)
const PLACE_STONE = (s) => [['L', 0.1, -1.15 + 0.12 * Math.sin(s * 5)], ['R', 0.1, -1.15 + 0.12 * Math.sin(s * 5 + 1.2)]];
const BARROW = [['L', 0.0, -0.55], ['R', 0.0, -0.55]];
const STUMBLE_T = 0.45;
const NIGHT_SPOT = K.PALACE.clone().add(V(-34.4, 0, 3.6));          // at the platform's left end, facing it and the camera 3/4                                          // the moment he catches his balance

function maxAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'hook': {                                               // mid-stumble on frame 1, steadies, looks down at the stone
      x = st(K.THE_STONE.clone().add(V(-1.1, 0, -0.2)), R90 - 0.55, 'shocked');
      x.layers = [['shock', 0.3, 1, false]]; x.lean = 0.32 * (1 - smooth(inv(0.0, STUMBLE_T, s)));
      x.pos.x += 0.6 * easeOut(clamp(s / STUMBLE_T));
      if (s > STUMBLE_T) { x.layers = [['idle', s]]; x.face = 'surprised'; x.look = [0.25, 0.35 * smooth(inv(STUMBLE_T, STUMBLE_T + 0.4, s))]; }
      return x;
    }
    case 'pocket': {                                             // picks it up and turns it over in his hand
      x = st(K.THE_STONE.clone().add(V(-0.5, 0, -0.2)), R90 - 0.55, 'surprised');
      const k = smooth(inv(T.pocket, T.pocket + 0.45, s));
      x.arms = [['R', 0.12, lerp(-0.3, -1.25, k)]]; x.stone = 'hand'; x.look = [0.2, lerp(0.45, 0.15, k)];
      if (s > W.puts - 0.2) { const p = smooth(inv(W.puts - 0.2, W.puts + 0.3, s)); x.arms = [['R', lerp(0.12, 0.35, p), lerp(-1.25, -0.2, p)]]; x.face = 'happy'; x.stone = p > 0.9 ? 'gone' : 'hand'; }
      return x;
    }
    case 'round': {                                              // walking his round, stops to pick up a stone
      const a = V(-40, 0, 0), b = V(14, 0, 0);
      x = st(a, R90, 'happy'); moveTo(x, a, b, T.round - 0.6, s, 12, R90 - 0.2); x.face = 'happy';
      if (!x.moving) { const k = smooth(inv(T.round + 4.0 - 0.8, T.round + 4.0, s)); x.arms = [['R', 0.1, -0.2 - 0.9 * k]]; x.look = [0, 0.4 * k]; }
      return x;
    }
    case 'pockets': {
      x = st(V(6, 0, 0.6), R90 - 0.7, 'smug'); x.layers = [['proud', clamp(s - T.pockets, 0, 0.35), 1, false]]; x.pockets = true; return x;
    }
    case 'baskets': {                                            // a basket of stones on his arm, walking
      const a = V(-8, 0, 0.3), b = V(16, 0, 0.3);
      x = st(a, R90, 'determined'); moveTo(x, a, b, T.baskets - 0.2, s, 12, R90); x.arms = [['R', 0.12, -0.35]]; x.carry = 'basket'; x.pockets = true; return x;
    }
    case 'barrow': {                                             // pushing a loaded wheelbarrow
      const a = V(-14, 0, 0.3), b = V(16, 0, 0.3);
      x = st(a, R90, 'determined'); moveTo(x, a, b, T.barrow - 0.3, s, 12, R90); x.arms = BARROW; x.carry = 'barrow'; return x;
    }
    case 'night': case 'keeps': {                                // setting stones on the low wall by the lamp
      x = st(NIGHT_SPOT, 1.0, 'determined'); x.arms = PLACE_STONE(s); x.stone = 'hand'; return x;
    }
    case 'laugh': { x = st(NIGHT_SPOT, 1.0, 'determined'); x.arms = PLACE_STONE(s); x.stone = 'hand'; return x; }
    case 'walls': case 'deco': {
      x = st(K.PALACE.clone().add(V(6, 0, 15.5)), Math.PI + 0.3, 'determined'); x.carry = 'barrowPark';
      x.arms = PLACE_STONE(s); return x;
    }
    case 'done': { x = st(K.PALACE.clone().add(V(-10, 0, 17)), 0.3, 'happy'); x.layers = [['proud', clamp(s - T.done, 0, 0.35), 1, false]]; if (s > W.ten) x.face = 'cool'; return x; }
    case 'carved': { x = st(K.PALACE.clone().add(V(-17.5, 0, 14.2)), 0.55, 'smug'); x.layers = [['point_forward', 0.2, 1, false]]; x.heading = headTo(x.pos, K.PALACE.clone().add(V(-13, 0, 7))) + 0.0; x.lookCam = true; return x; }
    case 'law': { x = st(S_(-2.0, 0, 10), R90 - 0.7, 'neutral'); if (s > W.no) x.face = 'sad'; return x; }
    case 'tomb': { x = st(C_(5.6, 0, -4.2), -0.97, 'determined'); x.arms = PLACE_STONE(s); x.stone = 'hand'; return x; }
    case 'cta': { x = st(K.PALACE.clone().add(V(0, 0, 23)), 0, 'happy'); x.wave = true; return x; }
  }
  return x;
}
// villagers: laughing at the fence at night; tourists and the stall keeper today
function villagerAt(a, s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  const fence = (dx) => K.SITE.clone().add(V(dx, 0, K.FENCE_Z + 1.6));
  switch (SHOT) {
    case 'night': case 'laugh': case 'keeps': {
      if (a === noob) return x;
      const dx = a === leo ? -6.4 : a === mia ? -4.0 : -1.6; x = st(fence(dx), Math.PI + (a === leo ? 0.35 : a === mia ? 0.05 : -0.3), 'laugh');
      if (SHOT === 'laugh') { x.layers = [['laugh_big', s - T.laugh + (a === mia ? 0.15 : 0), 1, true]]; if (a === leo) x.layers = [['point_forward', 0.2, 1, false]]; }
      if (SHOT === 'night') x.face = 'surprised';
      return x;
    }
    case 'law': { if (a !== noob) return x; x = st(S_(2.0, 0, 10.4), -R90 + 0.7, 'annoyed'); x.shake = s > W.law - 0.1 && s < W.no + 0.4; return x; }
    case 'today': case 'famous': case 'cta': {
      if (a === noob) return x;
      if (a === leo) { x = st(K.STAND.clone().add(V(0.5, 0, -2.2)), Math.PI - 0.4, 'happy'); if (SHOT === 'famous') { x.face = 'smug'; x.layers = [['point_forward', 0.2, 1, false]]; } return x; }
      const p = SHOT === 'cta' ? K.PALACE.clone().add(V(a === mia ? 3.7 : -3.7, 0, 21.5)) : a === mia ? K.PALACE.clone().add(V(1.5, 0, 20)) : K.PALACE.clone().add(V(-2.2, 0, 20.5));
      x = st(p, a === mia ? -0.25 : 0.3, 'happy');
      if (a === mia) x.layers = [['proud', 0.35, 1, false]]; else x.waveL = true;
      return x;
    }
  }
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
  if (x.waveL) setArm(a, 'L', 2.4 + 0.18 * Math.sin(NOW * 10 + 1), 0.1);
  if (x.lean) a.bones.Root.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  if (x.shake) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(0, 0.35 * Math.sin(NOW * 16), 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };

// ---------- lighting ----------
const MODES = {
  day: { sun: 2.8, sunC: '#fff0dc', hemi: 0.6, env: 0.55, fill: 0.7, rim: 1.0, z: '#3f86e6', h: '#cfe8ff', fog: '#d6e9f7', near: 150, far: 900 },
  dream: { sun: 2.4, sunC: '#ffe8c8', hemi: 0.9, env: 0.7, fill: 0.8, rim: 1.0, z: '#9ec7f5', h: '#fff1d6', fog: '#fff1d6', near: 120, far: 700 },
  night: { sun: 0.35, sunC: '#9fb4ff', hemi: 0.35, env: 0.25, fill: 0.25, rim: 0.6, z: '#0b1226', h: '#22304e', fog: '#141c30', near: 60, far: 400, lamp: 1 },
  grey: { sun: 1.4, sunC: '#e8ecf2', hemi: 0.85, env: 0.5, fill: 0.6, rim: 0.7, z: '#7f8ea3', h: '#d5dbe3', fog: '#cfd6df', near: 100, far: 600 },
};
function light(stage, mode, s) {
  let L = MODES[mode] || MODES.day;
  if (mode === 'lapse') {                                         // days flicking past: blend day and night
    const k = 0.5 + 0.5 * Math.cos(s * 9); const D = MODES.day, N = MODES.night;
    L = {}; for (const key of Object.keys(D)) L[key] = typeof D[key] === 'number' ? lerp(N[key] ?? D[key], D[key], k) : D[key];
    L.z = '#' + new THREE.Color(N.z).lerp(new THREE.Color(D.z), k).getHexString(); L.h = '#' + new THREE.Color(N.h).lerp(new THREE.Color(D.h), k).getHexString(); L.fog = '#' + new THREE.Color(N.fog).lerp(new THREE.Color(D.fog), k).getHexString();
    L.lamp = 1 - k;
  }
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; u.zenith.value.set(L.z); u.horizon.value.set(L.h);
  sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
  const lp = L.lamp || 0; S.st.lamp.light.intensity = 80 * lp; S.st.lamp.flameM.emissiveIntensity = 3 * lp; S.st.group.userData.cottageWin.material.emissiveIntensity = 1.5 * lp;
}

// ---------- cameras ----------
function look(stage, p, tg, fov = 40, ext = 18) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg); stage.aimSun(tg.clone(), ext); return tg; }
export function samples() { return 1; }

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  light(stage, MODE_OF[SHOT] || 'day', s);

  const mx = maxAt(s); place(max, mx);
  for (const a of [leo, mia, skye, noob]) place(a, villagerAt(a, s));
  P.pocketStones.visible = !!mx.pockets && max.root.visible;

  // the palace and the tomb
  const [hw, hd] = SHOT === 'dream' ? [100, 100] : palaceH(s);
  S.st.palace.walls(hw); S.st.palace.deco(hd);
  S.st.plaque.visible = SHOT === 'today' || SHOT === 'famous' || SHOT === 'cta';
  S.st.stand.visible = S.st.plaque.visible;
  S.st.pile.visible = !S.st.plaque.visible && SHOT !== 'dream';
  S.cm.build(SHOT === 'tomb' ? lerp(0.2, 11, smooth(inv(T.tomb + 0.1, T.today - 0.2, s))) : 100);

  // props
  for (const k of ['stone', 'basket', 'barrow']) P[k].visible = false;
  S.ln.stone.visible = SHOT === 'hook' || (SHOT === 'pocket' && mx.stone === 'ground');
  if ((mx.stone === 'hand') && max.root.visible) { P.stone.visible = true; P.stone.position.copy(grip(max, 'R')).add(V(0, 0.15, 0)); P.stone.rotation.set(s * 0.6, s * 0.9, 0); P.stone.scale.setScalar(SHOT === 'pocket' ? 1 : 0.7); }
  if (mx.carry === 'basket') { P.basket.visible = true; P.basket.position.copy(grip(max, 'R')).add(V(0, 0.1, 0)); P.basket.rotation.set(0, max.root.rotation.y, 0); }
  if (mx.carry === 'barrow') {                                   // posed from both hands every frame
    const gl = grip(max, 'L'), gr = grip(max, 'R'), mid = gl.clone().lerp(gr, 0.5), fwd = V(Math.sin(max.root.rotation.y), 0, Math.cos(max.root.rotation.y));
    P.barrow.visible = true; P.barrow.position.copy(mid); P.barrow.rotation.set(0, max.root.rotation.y, 0);
    const drop = mid.y - P.barrow.userData.groundDrop; P.barrow.rotation.x = -Math.asin(clamp(drop / 4.4, -0.5, 0.5));
    P.barrow.userData.wheel.rotation.x = (mx.dist || 0) / 0.75;
  }
  if (mx.carry === 'barrowPark') { P.barrow.visible = true; P.barrow.position.copy(K.PALACE).add(V(13.5, 2.0, 16.5)); P.barrow.rotation.set(0.0, -0.9, 0); }

  // cameras
  const mp = max.root.position.clone(), hdM = max.root.visible ? headPos(max) : V();
  switch (SHOT) {
    case 'hook': { const k = easeOut(clamp(t / T.pocket)); look(stage, V(lerp(5.0, 4.4, k), lerp(2.6, 2.9, k), lerp(11.5, 10.8, k)), V(1.3, 2.8, 0.2), 50, 10); break; }
    case 'pocket': look(stage, V(5.6, 4.6, 7.8), V(2.0, 4.0, 0.6), 46, 8); break;
    case 'dream': { const k = easeOut(u); look(stage, K.PALACE.clone().add(V(lerp(30, 22, k), lerp(14, 11, k), lerp(56, 50, k))), K.PALACE.clone().add(V(0, 11, 0)), 46, 50); break; }
    case 'round': look(stage, V(mp.x + 4, 3.6, 13), V(mp.x - 0.5, 3.8, 0), 46, 14); break;
    case 'pockets': look(stage, V(10.2, 4.4, 7.0), V(6.2, 3.7, 0.6), 48, 8); break;
    case 'baskets': look(stage, V(mp.x + 3, 3.8, 9.5), V(mp.x - 0.2, 3.4, 0), 46, 12); break;
    case 'barrow': look(stage, V(mp.x + 6, 4.4, 11), V(mp.x + 1.5, 3.0, 0), 46, 14); break;
    case 'night': look(stage, NIGHT_SPOT.clone().add(V(6.5, 4.8, 13.5)), NIGHT_SPOT.clone().add(V(1.2, 3.0, -0.5)), 48, 16); break;
    case 'laugh': look(stage, K.PALACE.clone().add(V(-3.6, 4.6, 17)), K.SITE.clone().add(V(-4, 4.4, K.FENCE_Z + 1.6)), 46, 14); break;
    case 'keeps': { const f = V(Math.sin(max.root.rotation.y), 0, Math.cos(max.root.rotation.y)), r = V(-f.z, 0, f.x); look(stage, hdM.clone().addScaledVector(f, 6.6).addScaledVector(r, -2.2).add(V(0, 0.2, 0)), hdM.clone().add(V(0, -1.0, 0)).addScaledVector(r, -0.6), 46, 8); break; }
    case 'walls': { const k = easeOut(u); look(stage, K.PALACE.clone().add(V(lerp(36, 30, k), lerp(9, 12, k), lerp(46, 42, k))), K.PALACE.clone().add(V(0, 6, 0)), 46, 50); break; }
    case 'deco': { const k = easeOut(u); look(stage, K.PALACE.clone().add(V(lerp(30, 18, k), lerp(12, 15, k), lerp(42, 50, k))), K.PALACE.clone().add(V(0, 10, 0)), 46, 50); break; }
    case 'done': look(stage, K.PALACE.clone().add(V(lerp(-24, -20, u), 7, lerp(44, 40, u))), K.PALACE.clone().add(V(-4, 11, 4)), 48, 50); break;
    case 'carved': look(stage, K.PALACE.clone().add(V(-12.5, 7.2, 21)), K.PALACE.clone().add(V(-13.2, 7.0, 7)), 40, 14); break;
    case 'law': look(stage, S_(0, 4.8, 22.5), S_(0, 4.4, 10.2), 46, 12); break;
    case 'tomb': look(stage, C_(lerp(11, 9, u), 6.0, 16), C_(2.0, 4.4, -4.5), 46, 20); break;
    case 'today': { const k = easeOut(u); look(stage, K.PALACE.clone().add(V(lerp(3, 1, k), 5.0, lerp(36, 33, k))), K.PALACE.clone().add(V(-0.5, 9, 6)), 50, 50); break; }
    case 'famous': look(stage, K.STAND.clone().add(V(3.5, 4.6, -11)), K.STAND.clone().add(V(0.5, 4.4, -1.5)), 44, 14); break;
    case 'cta': look(stage, K.PALACE.clone().add(V(-1, 5.6, 34)), K.PALACE.clone().add(V(-2, 8.5, 12)), 50, 40); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera; head2D = {};
  for (const [k, a] of Object.entries({ max, leo, mia, noob })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, t0, d = 0.22, sc = 2.2) => easeOutBack(clamp((t - t0) / d), sc);
function pill(g, s, text, x, y, k, color = '#ffd23f', bg = 'rgba(14,18,34,.85)', size = 46) {
  if (k <= 0) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70, h = size * 1.9;
  g.translate(x * s, y * s); g.scale(k, k);
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 26 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
function bubble(g, s, lines, x, y, k, size = 56) {
  if (k <= 0) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) / s + 80, h = lines.length * size * 1.12 + 60;
  const bx = clamp(x - w / 2, 50, 900 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  const tx = clamp(x, bx + 50, bx + w - 50);
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h - 3) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h) * s); g.stroke();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, (bx + w / 2) * s, (by + 30 + size * 0.56 + i * size * 1.12 + 4) * s));
  g.restore();
}
function dreamFrame(g, s, t, t0) {
  const k = clamp((t - t0) / 0.2);
  g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath(); g.rect(0, 0, 1080 * s, 1920 * s);
  const cx = 540, cy = 900, rx = 470, ry = 700, n = 22; g.moveTo((cx + rx) * s, cy * s);
  for (let i = 1; i <= n; i++) { const a0 = ((i - 1) / n) * Math.PI * 2, a1 = (i / n) * Math.PI * 2, am = (a0 + a1) / 2; g.quadraticCurveTo((cx + Math.cos(am) * (rx + 70)) * s, (cy + Math.sin(am) * (ry + 70)) * s, (cx + Math.cos(a1) * rx) * s, (cy + Math.sin(a1) * ry) * s); }
  g.fill('evenodd'); g.lineWidth = 8 * s; g.strokeStyle = 'rgba(40,46,70,.6)'; g.stroke();
  for (const [x, y, r] of [[240, 1700, 34], [170, 1790, 22], [120, 1855, 14]]) { g.beginPath(); g.arc(x * s, y * s, r * s, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.stroke(); }
  g.restore();
}
function datePill(g, s, text, k) {
  if (k <= 0) return;
  g.save(); g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60;
  g.translate((60 + w / 2) * s, 270 * s); g.scale(k, k);
  roundRect(g, -w / 2 * s, -42 * s, w * s, 84 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'dream') dreamFrame(g, s, t, T.dream);
  // the year (big counter in the time-lapse; a small pill elsewhere in the past)
  if (SHOT === 'walls' || SHOT === 'deco') { bigText(g, s, String(yearAt(t)), 540, 330, 150, '#ffffff', 1, -0.03); }
  else if (SHOT === 'dream' || SHOT === 'night' || SHOT === 'laugh' || SHOT === 'keeps') datePill(g, s, SHOT === 'dream' ? '1879' : '1879 · NIGHT', 1);
  if (SHOT === 'hook' && t > 0) {}
  if (SHOT === 'pocket' && t > W.puts - 0.1) pill(g, s, '+1 STONE', 540, 340, pop(t, W.puts - 0.1), '#7CFC9A');
  if (SHOT === 'dream') bigText(g, s, 'A PALACE', 540, 400, 120, '#2b3550', pop(t, W.palace1 - 0.1), -0.04, '#ffffff');
  if (SHOT === 'round') { const km = Math.round(30 * smooth(inv(T.round, T.pockets - 0.1, t))); pill(g, s, `${km} KM`, 540, 360, pop(t, T.round, 0.2), '#ffd23f', 'rgba(14,18,34,.85)', 70); }
  if (SHOT === 'pockets') pill(g, s, 'POCKETS', 540, 340, pop(t, T.pockets + 0.05), '#ffd23f');
  if (SHOT === 'baskets') pill(g, s, 'BASKETS', 540, 340, pop(t, T.baskets + 0.05), '#ffd23f');
  if (SHOT === 'barrow') pill(g, s, 'WHEELBARROW', 540, 340, pop(t, W.wheelbarrow - 0.1), '#ffd23f');
  if (SHOT === 'laugh') { bigText(g, s, 'HA HA HA', 540, 470, 120, '#ffffff', pop(t, W.laughs - 0.15), -0.05); }
  if (SHOT === 'walls' && t > W.outer - 0.1) pill(g, s, '20 YEARS: OUTER WALLS', 540, 490, pop(t, W.outer - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 50);
  if (SHOT === 'deco') { const items = [[W.animals, 'ANIMALS'], [W.giants, 'GIANTS'], [W.towers, 'TOWERS']]; items.forEach(([t0, txt], i) => { if (t > t0 - 0.1) pill(g, s, txt, 540, 470 + i * 110, pop(t, t0 - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 50); }); }
  if (SHOT === 'done') {
    bigText(g, s, '33 YEARS', 540, 380, 140, '#ffd23f', pop(t, T.done + 0.05), -0.04);
    if (t > W.ten - 0.1) bigText(g, s, '10,000 DAYS', 540, 520, 92, '#ffffff', pop(t, W.ten - 0.1), -0.03);
    if (t > W.hours - 0.5) bigText(g, s, '93,000 HOURS', 540, 640, 92, '#ffffff', pop(t, W.hours - 0.5), -0.03);
  }
  if (SHOT === 'law' && head2D.noob && t > W.law - 0.15) bubble(g, s, ['NOT IN THERE.'], head2D.noob[0], Math.min(head2D.noob[1] - 150, 760), pop(t, W.law - 0.15, 0.2, 2), 60);
  if (SHOT === 'tomb') { bigText(g, s, '+8 YEARS', 540, 420, 130, '#ffd23f', pop(t, W.eight - 0.1), -0.04); }
  if (SHOT === 'today' || SHOT === 'famous') datePill(g, s, 'TODAY', 1);
  if (SHOT === 'today' && t > W.protected - 0.1) bigText(g, s, 'HISTORIC MONUMENT', 540, 430, 92, '#ffffff', pop(t, W.protected - 0.1), -0.03);
  if (SHOT === 'famous' && t > W.famous - 0.1) bigText(g, s, 'WHO\'S LAUGHING NOW?', 540, 450, 84, '#ffd23f', pop(t, W.famous - 0.1), -0.03);
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

export const cast = () => ({ max, leo, mia, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
