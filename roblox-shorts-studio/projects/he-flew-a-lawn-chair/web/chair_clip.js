// He Flew A Lawn Chair. Web renderer + Roblox R6 pack. True story (Larry Walters, 2 July 1982): a lawn chair on 42
// weather balloons, tied to a Jeep to float 100 ft up; the rope snaps and he rises to about 16,000 ft, freezing. He had
// never been allowed to be a pilot (his eyesight). Sandwiches and a pellet gun to pop balloons; airline pilots radio the
// tower; he pops a few, drops the gun, drifts into Long Beach power lines (a blackout), lands unhurt to waiting police;
// "A man can't just sit around."; fined for flying an aircraft without calling the tower; the chair is now in the Air and
// Space Museum. Max is the man (glasses drawn on his faces), Mia his girlfriend at the launch and a reporter, Leo the eye
// doctor, the captain and a press photographer, Skye the first officer and a police officer, Noob a police officer.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Flew A Lawn Chair' };
export const sky = { zenith: '#2f7fe6', horizon: '#bfe4ff', below: '#e9f4ff', fog: '#cfe8ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;

// ---------- key times (all on the narration) ----------
const T = {
  plan: W.plan - 0.1, snap: W.rope2 - 0.15, climb: W.thousand1 - 0.12, freeze: W.its - 0.1, eye: W.hed - 0.1,
  packed: W.packed - 0.1, liner: W.two - 0.1, cockpit: W.radio - 0.05, tower: W.passed - 0.1, pops: W.pops - 0.1,
  drop: W.then - 0.1, lines: W.drifts - 0.1, police: W.lands - 0.1, press: W.reporters - 0.1, fined: W.fined - 0.1,
  aircraft: W.aircraft2 - 0.1, never: W.never - 0.1, museum: W.today - 0.1, cta: W.follow - 0.15,
};
const SNAP = W.snaps + 0.05;                                   // the rope breaks
const POP_T = [W.pops + 0.05, W.few + 0.05, W.starts + 0.05];  // the three balloons he shoots
const POPPED = [27, 14, 31];                                   // which ones (front-facing in the pops shot)
const LEAKED = [3, 9, 22, 36, 40, 12, 18, 25];                 // gone by the time he reaches the power lines
const DROP = W.drops + 0.08;                                   // the gun slips out of his hand
const SNAG = W.lines - 0.05, DARK = W.dark - 0.05;             // the cables catch; the lights go out

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, caps = {}, P = {}, S = {}, PLACES = {}, SHOT = 'hook', chair, cluster, rope, ropeStub, ropeTail;
let puffs = [], spark, scrap, breath = [], groundMesh, flashLight;
export async function setup(stage) {
  const { scene } = stage;
  const G = (f) => 'glasses_' + f;
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'determined', 'smug', 'nervous', 'laugh', 'sad', 'annoyed',
      'confused', 'talking', 'mouth_o', 'frost_scared', 'frost_shocked', 'frost_nervous'].map(G) }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'nervous', 'talking'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'nervous', 'talking', 'determined', 'scared'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'nervous', 'talking', 'determined'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'surprised', 'determined', 'talking'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  caps.leo = await wear(leo, 'officer_cap'); caps.skye = await wear(skye, 'officer_cap'); caps.noob = await wear(noob, 'officer_cap');
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'laugh_big', 'point_forward', 'look_up', 'think', 'talk', 'facepalm']) A[n] = await loadAnimation(n);

  groundMesh = K.ground(scene);
  const yd = K.yard(scene); PLACES.yard = yd.group; S.hitch = yd.hitch;
  const sk = K.sky(scene); PLACES.sky = sk.group; S.sky = sk;
  const ey = K.eyeRoom(scene); PLACES.eye = ey.group; S.eye = ey;
  const nose = K.airlinerNose(); nose.position.copy(K.PLANE); scene.add(nose); PLACES.plane = nose; S.nose = nose;
  const tw = K.tower(scene); PLACES.tower = tw.group; S.tower = tw;
  const st = K.street(scene); PLACES.street = st.group; S.street = st;
  const mu = K.museum(scene); PLACES.museum = mu.group; S.mu = mu;
  const pc = K.policeCar(); pc.position.copy(K.STREET).add(V(22, 0, -14)); pc.rotation.y = -R90 - 0.25; scene.add(pc); S.police = pc; PLACES.policeCar = pc;
  const liner = K.airliner(); scene.add(liner); S.liner = liner;

  chair = K.lawnChair(); scene.add(chair); chair.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  cluster = K.balloons(42); scene.add(cluster);
  const ropeM = K.std('#e8e2d0', { roughness: 0.9 });
  rope = K.cyl(0.07, 0.07, 1, ropeM, 6); scene.add(rope); ropeStub = K.cyl(0.07, 0.07, 1, ropeM, 6); scene.add(ropeStub); ropeTail = K.cyl(0.07, 0.07, 1, ropeM, 6); scene.add(ropeTail);

  const add = (k, o) => { P[k] = o; o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  // hand props ride the arm bones: the fist is at (-+0.5, -1.3, 0) in the arm's frame; Rx(90) points a prop's +z down the arm
  const inHand = (a, sd, o, rx = R90, off = V(0, 0, 0)) => { o.position.set(sd === 'R' ? -0.5 : 0.5, -1.3, 0).add(off); o.rotation.set(rx, 0, 0); a.bones['Arm.' + sd].add(o); o.visible = false; return o; };
  inHand(max, 'R', add('sandwich', K.sandwich()), R90, V(0, -0.15, 0.1));
  inHand(max, 'R', add('pistol', K.pistol()));
  inHand(max, 'R', add('letter', K.letter()), R90 + 0.5, V(0.35, -0.25, 0.25));
  inHand(leo, 'R', add('radio', K.radioMic()), R90 + 0.3);
  inHand(leo, 'R', add('camera', K.pressCamera()), R90);
  inHand(mia, 'R', add('mic', K.microphone()), R90 + 0.25, V(0, -0.2, 0));
  inHand(noob, 'R', add('torch', K.flashlight()));
  // the pistol falling (a loose copy) and the chair/balloons in the museum come from the kit
  P.fallGun = add('fallGun', K.pistol()); scene.add(P.fallGun);
  flashLight = new THREE.SpotLight('#fff3c4', 0, 40, 0.35, 0.6, 1.2); scene.add(flashLight, flashLight.target);

  // pop puffs and scraps, sparks at the power line, breath clouds in the cold
  const pm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.8, depthWrite: false, emissive: '#ffffff', emissiveIntensity: 0.3 });
  for (let i = 0; i < 3; i++) { const p = puff(); p.material = pm.clone(); p.visible = false; scene.add(p); puffs.push(p); }
  scrap = K.scraps(24); scene.add(scrap);
  spark = K.sparks(30); scene.add(spark);
  for (let i = 0; i < 6; i++) { const p = puff(); p.material = pm.clone(); p.visible = false; scene.add(p); breath.push(p); }
}

// ---------- where the chair is ----------
// Returns { pos (chair origin), yaw, place, ropes (bool), balloons (bool) }. Yard: lifting off on the rope, then shooting
// up after the snap. Sky: fixed at SKY (the clouds move instead). Street: drifting down into the power line and hanging
// from it. Then on the lawn, then back in the yard on the grass.
const LIFT = (s) => s < SNAP ? lerp(0.5, 11, smooth(clamp(s / SNAP))) : 11 + 60 * (s - SNAP) ** 2 + 30 * (s - SNAP);
const SNAG_PT = V(16.5, 17.6, K.POLE_Z);
function chairAt(s) {
  const id = SHOT;
  if (s < T.climb) return { pos: K.LAUNCH.clone().add(V(0.25 * Math.sin(s * 1.7), LIFT(s), 0.2 * Math.cos(s * 1.3))), yaw: 0.35 + 0.05 * Math.sin(s * 0.9), place: 'yard', ropes: true, balloons: true };
  if (s < T.lines || id === 'cta') {
    const yaw = { climb: 0.5, freeze: 0.2, packed: 0.35, liner: -0.5, pops: 0.15, drop: 0.5, cta: 0.3 }[id] ?? 0.3;
    return { pos: K.SKY.clone().add(V(0.3 * Math.sin(s * 0.8), 0.25 * Math.sin(s * 1.1), 0.3 * Math.cos(s * 0.7))), yaw, place: 'sky', ropes: true, balloons: true };
  }
  if (s < T.police) {                                          // drifting down into the line, then hanging from it
    const st = K.STREET, ring = K.RING.y;
    const u = clamp((s - T.lines) / (SNAG - T.lines));
    const from = SNAG_PT.clone().add(V(-26, 30, 0)), at = SNAG_PT.clone().add(V(0, -ring, 0)).add(V(0, 0, 0));
    let p = from.clone().lerp(at, easeOut(u));
    if (s > SNAG) p = at.clone().add(V(0.6 * Math.sin((s - SNAG) * 3) * Math.exp(-(s - SNAG) * 1.2), -0.5 * Math.exp(-(s - SNAG) * 3) * Math.sin((s - SNAG) * 12), 0));
    return { pos: p, yaw: 0.25, place: 'street', ropes: true, balloons: true };
  }
  if (s < T.fined) return { pos: K.STREET.clone().add(V(10, 0, -3.5)), yaw: -0.6, place: 'street', ropes: false, balloons: false };
  return { pos: K.LAUNCH.clone().add(V(-3, 0, 3)), yaw: 0.4, place: 'yard', ropes: false, balloons: false };
}

// ---------- the cast ----------
const st = (pos, heading, face = 'happy') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true, hold: null });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const ARMREST = [['L', 0.14, -0.5], ['R', 0.14, -0.5]];
const _o = new THREE.Object3D();
function seated(c) {                                           // Max's root in the chair c
  _o.position.copy(c.pos); _o.rotation.set(0, c.yaw, 0); _o.updateMatrixWorld(true);
  return { pos: _o.localToWorld(K.SEAT.clone().add(V(0, -1.5, -0.05))), heading: c.yaw };
}
function maxAt(s) {
  const c = chairAt(s), seat = seated(c);
  let x = st(seat.pos, seat.heading, 'happy'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = ARMREST;
  switch (SHOT) {
    case 'hook': x.face = s < W.balloons1 ? 'happy' : 'smug'; x.look = [0.25, -0.15]; break;
    case 'plan': x.face = 'happy'; x.arms = [['L', 0.14, -0.5], ['R', 0.3, -2.0]]; x.thumb = true; break;
    case 'snap': x.face = s < SNAP + 0.2 ? 'happy' : 'shocked'; break;
    case 'climb': x.face = s < W.five ? 'shocked' : 'scared'; x.arms = [['L', 0.3, -0.4], ['R', 0.3, -0.4]]; x.shake = 0.03; x.look = [0, -0.35]; break;
    case 'freeze': x.face = s < W.freezing + 0.2 ? 'frost_scared' : 'frost_nervous'; x.arms = [['L', 0.05, -1.2], ['R', 0.05, -1.2]]; x.shake = 0.06; x.breath = 1; break;
    case 'eye': {                                               // standing at the eye chart, squinting
      x = st(K.EYE.clone().add(V(3.2, 0, 1.5)), -2.6, 'neutral'); x.lean = 0.12;
      if (s >= W.eyesight - 0.1) { x.face = 'confused'; x.lean = 0.25; }
      if (s >= W.enough) { x.face = 'sad'; x.lean = 0; }
      break;
    }
    case 'packed': {
      x.face = 'happy';
      if (s < W.pellet - 0.05) { x.hold = 'sandwich'; const k = smooth(inv(W.sandwiches - 0.4, W.sandwiches, s)); x.arms = [['L', 0.14, -0.5], ['R', lerp(0.14, 0.3, k), lerp(-0.5, -1.9, k)]]; if (s > W.sandwiches + 0.15) x.face = 'mouth_o'; if (s > W.sandwiches + 0.45) x.face = 'happy'; }
      else { x.hold = 'pistol'; const k = smooth(inv(W.pellet - 0.05, W.pellet + 0.25, s)), up = smooth(inv(W.pop - 0.2, W.pop + 0.1, s)); x.arms = [['L', 0.14, -0.5], ['R', lerp(0.2, 0.12, up), lerp(-1.5, -2.7, up) * Math.max(k, 0.3)]]; x.face = up > 0.5 ? 'determined' : 'smug'; }
      break;
    }
    case 'liner': x.face = s < W.airline + 0.2 ? 'surprised' : 'happy'; x.hold = 'pistol'; x.arms = [['R', 0.14, -0.5]]; x.waveL = s > W.airline; x.look = [-0.5, 0]; break;
    case 'pops': x.hold = 'pistol'; x.arms = [['L', 0.14, -0.5], ['R', 0.1, -2.75]]; x.face = 'determined'; x.look = [0, 0.35];
      if (s > W.sink - 0.1) { x.face = 'happy'; x.arms = [['L', 0.14, -0.5], ['R', 0.15, lerp(-2.75, -1.4, smooth(inv(W.sink, W.sink + 0.4, s)))]]; x.look = [0, 0]; }
      break;
    case 'drop': {
      x.hold = s < DROP ? 'pistol' : null; x.arms = [['L', 0.14, -0.5], ['R', 0.2, -1.4]];
      x.face = s < DROP + 0.1 ? 'happy' : s < W.gun2 + 0.5 ? 'shocked' : 'nervous';
      if (s > DROP + 0.1) x.look = [0, 0.55 * smooth(inv(DROP + 0.1, DROP + 0.4, s)) * (1 - smooth(inv(W.gun2 + 0.5, W.gun2 + 0.8, s)))];
      if (s > DROP) x.arms = [['L', 0.14, -0.5], ['R', 0.25, lerp(-1.4, -1.0, smooth(inv(DROP, DROP + 0.3, s)))]];
      break;
    }
    case 'lines': x.face = s < SNAG ? 'nervous' : s < DARK ? 'shocked' : 'scared'; x.arms = [['L', 0.3, -0.4], ['R', 0.3, -0.4]]; if (s > SNAG) x.shake = 0.04 * Math.exp(-(s - SNAG)); break;
    case 'police': {
      x = st(K.STREET.clone().add(V(13.5, 0, -1.5)), -0.3, 'happy'); x.sit = false;
      if (s < W.unhurt + 0.2) { x.layers = [['proud', s - T.police, 1, false]]; x.face = 'happy'; }
      if (s >= W.police - 0.1) { x.layers = [['idle', s]]; x.face = 'nervous'; x.heading = lerp(-0.3, 0.6, smooth(inv(W.police - 0.1, W.police + 0.3, s))); }
      break;
    }
    case 'press': {
      x = st(K.STREET.clone().add(V(13.5, 0, -1.5)), 0.2, 'neutral'); x.sit = false;
      if (s >= W.why) x.face = 'neutral';
      if (s >= W.man3 - 0.1) { x.layers = [['shrug', s - W.man3 + 0.1, 1, false]]; x.face = 'smug'; }
      break;
    }
    case 'fined': case 'aircraft': {
      x.hold = 'letter'; x.arms = [['L', 0.25, -1.3], ['R', 0.25, -1.3]]; x.face = SHOT === 'fined' ? (s < W.flying ? 'neutral' : 'surprised') : (s < W.chair3 ? 'confused' : 'smug');
      x.look = SHOT === 'fined' ? [0, 0.35] : [0.4 * smooth(inv(W.chair3 - 0.2, W.chair3 + 0.2, s)), 0.35 * (1 - smooth(inv(W.chair3 - 0.2, W.chair3 + 0.2, s)))];
      break;
    }
    case 'never': {
      x = st(K.LAUNCH.clone().add(V(-6.5, 0, 6.5)), 0.5, 'sad'); x.sit = false; x.layers = [['look_up', clamp(s - T.never, 0, 1.2), 1, false]];
      break;
    }
    case 'museum': x.visible = false; break;
    case 'cta': x.face = 'happy'; x.waveL = true; x.arms = [['R', 0.14, -0.5]]; break;
  }
  return x;
}
function miaAt(s) {
  const x = st(V(0, 0, 0), 0, 'happy'); x.visible = false;
  if (SHOT === 'hook' || SHOT === 'plan' || SHOT === 'snap') {
    x.visible = true; x.pos = S.hitch.clone().add(V(0.6, -S.hitch.y, 2.4)); x.heading = -0.9;
    x.layers = [['look_up', 1.2, 1, false]]; x.face = SHOT === 'snap' ? (s < SNAP ? 'nervous' : 'shocked') : 'happy';
    if (SHOT === 'hook') { x.layers = [['idle', s]]; x.look = [0, -0.35]; x.heading = -0.5; }
    if (SHOT === 'snap' && s >= SNAP) { x.layers = [['shock', clamp(s - SNAP, 0, 0.6), 1, false]]; }
  } else if (SHOT === 'press') {
    x.visible = true; x.pos = K.STREET.clone().add(V(9.2, 0, 1.4)); x.heading = 2.2; x.face = s < W.why + 0.3 ? 'talking' : 'surprised';
    x.hold = 'mic'; x.arms = [['R', 0.35, -1.45]];
    if (s >= W.man3) x.face = 'happy';
  }
  return x;
}
function leoAt(s) {
  const x = st(V(0, 0, 0), 0, 'happy'); x.visible = false;
  if (SHOT === 'eye') {
    x.visible = true; x.pos = K.EYE.clone().add(V(-3.6, 0, -4.8)); x.heading = 0.9; x.face = 'neutral';
    x.layers = [['point_forward', clamp(s - T.eye, 0, 0.6), 1, false]]; x.heading = 0.55;
    if (s >= W.enough) { x.layers = [['idle', s]]; x.face = 'sad'; x.heading = 0.9; }
  } else if (SHOT === 'cockpit') {
    x.visible = true; x.cap = true; x.sit = true; x.layers = [['sit', 0, 1, false]];
    S.nose.updateMatrixWorld(true); x.pos = S.nose.localToWorld(K.PSEAT_L.clone().add(V(0, -1.5, 0))); x.heading = 0.35;
    x.hold = 'radio'; x.arms = [['L', 0.18, -1.0], ['R', 0.3, -2.25]]; x.face = s < W.tower1 ? 'shocked' : 'talking';
    if (s > W.man2) x.face = 'shocked';
  } else if (SHOT === 'press') {
    x.visible = true; x.pos = K.STREET.clone().add(V(17.8, 0, 1.6)); x.heading = -2.2; x.face = 'happy'; x.hold = 'camera'; x.arms = [['R', 0.3, -1.55], ['L', 0.55, -1.45]];
  } else if (SHOT === 'museum') {
    x.visible = true; x.pos = K.MUSEUM.clone().add(V(-4.2, 0, 9.5)); x.heading = Math.PI - 0.5; x.face = 'surprised';
    if (s > W.museum - 0.2) { x.layers = [['point_forward', clamp(s - W.museum + 0.2, 0, 0.6), 1, false]]; x.face = 'happy'; }
  }
  return x;
}
function skyeAt(s) {
  const x = st(V(0, 0, 0), 0, 'happy'); x.visible = false;
  if (SHOT === 'cockpit') {
    x.visible = true; x.cap = true; x.sit = true; x.layers = [['sit', 0, 1, false]];
    S.nose.updateMatrixWorld(true); x.pos = S.nose.localToWorld(K.PSEAT_R.clone().add(V(0, -1.5, 0))); x.heading = -0.5;
    x.face = 'surprised'; x.arms = [['L', 0.18, -1.0], ['R', 0.6, -1.3]]; x.look = [-0.9, 0];
    if (s > W.passed) { x.face = 'shocked'; x.arms = [['L', 0.4, -1.5], ['R', 0.18, -1.0]]; }
  } else if (SHOT === 'police' || SHOT === 'press') {
    x.visible = true; x.cap = true; x.pos = K.STREET.clone().add(V(19.5, 0, -6.5)); x.heading = -1.0; x.face = 'determined';
    if (SHOT === 'police') { moveTo(x, K.STREET.clone().add(V(24, 0, -10)), K.STREET.clone().add(V(18.2, 0, -4.2)), W.police - 0.6, s, 12, -1.35); x.face = 'determined'; }
    else { x.pos = K.STREET.clone().add(V(18.2, 0, -4.2)); x.heading = -1.35; x.layers = [['idle', s]]; x.face = s > W.around ? 'surprised' : 'neutral'; }
  } else if (SHOT === 'museum') {
    x.visible = true; x.pos = K.MUSEUM.clone().add(V(4.6, 0, 9.0)); x.heading = Math.PI + 0.45; x.face = 'happy';
  }
  return x;
}
function noobAt(s) {
  const x = st(V(0, 0, 0), 0, 'neutral'); x.visible = false;
  if (SHOT === 'police' || SHOT === 'press') {
    x.visible = true; x.cap = true; x.face = 'determined'; x.hold = 'torch'; x.arms = [['R', 0.15, -1.5]];
    if (SHOT === 'police') { moveTo(x, K.STREET.clone().add(V(21, 0, -12)), K.STREET.clone().add(V(15.8, 0, -5.4)), W.police - 0.9, s, 12, -0.6); if (x.moving) x.arms = [['R', 0.15, -1.2]]; else x.arms = [['R', 0.15, -1.5]]; }
    else { x.pos = K.STREET.clone().add(V(15.8, 0, -5.4)); x.heading = -0.6; x.layers = [['idle', s]]; }
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
  if (x.waveL) setArm(a, 'L', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  if (x.lean) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  if (x.shake) a.root.position.x += x.shake * Math.sin(NOW * 63);
  a.root.updateMatrixWorld(true);
  setExpression(a, a === max ? 'glasses_' + x.face : x.face);
}
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.plan, 'plan'], [T.snap, 'snap'], [T.climb, 'climb'], [T.freeze, 'freeze'], [T.eye, 'eye'], [T.packed, 'packed'],
  [T.liner, 'liner'], [T.cockpit, 'cockpit'], [T.tower, 'tower'], [T.pops, 'pops'], [T.drop, 'drop'], [T.lines, 'lines'],
  [T.police, 'police'], [T.press, 'press'], [T.fined, 'fined'], [T.aircraft, 'aircraft'], [T.never, 'never'], [T.museum, 'museum'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = {
  hook: 'yard', plan: 'yard', snap: 'yard', climb: 'sky', freeze: 'sky', eye: 'eye', packed: 'sky', liner: 'sky', cockpit: 'plane', tower: 'tower',
  pops: 'sky', drop: 'sky', lines: 'street', police: 'street', press: 'street', fined: 'yard', aircraft: 'yard', never: 'yard', museum: 'museum', cta: 'sky',
};
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

// ---------- lighting ----------
const MODES = {
  day: { zen: '#2f7fe6', hor: '#bfe4ff', bel: '#e9f4ff', fog: '#cfe8ff', near: 90, far: 520, sun: 3.1, sunC: '#fff0dc', hemi: 0.55, env: 0.55, fill: 0.7, rim: 1.1 },
  high: { zen: '#1546b8', hor: '#9fd0ff', bel: '#dbe9f7', fog: '#cfe2f5', near: 140, far: 700, sun: 3.3, sunC: '#fff6ea', hemi: 0.7, env: 0.6, fill: 0.8, rim: 1.0 },
  dusk: { zen: '#2a2f6a', hor: '#f0905a', bel: '#3a3550', fog: '#7a5f72', near: 60, far: 420, sun: 1.5, sunC: '#ffb27a', hemi: 0.55, env: 0.35, fill: 0.5, rim: 1.2 },
  night: { zen: '#10142e', hor: '#3a2f55', bel: '#151528', fog: '#262338', near: 50, far: 380, sun: 0.35, sunC: '#9fb4ff', hemi: 0.4, env: 0.2, fill: 0.35, rim: 0.6 },
  museum: { zen: '#2f7fe6', hor: '#bfe4ff', bel: '#e9f4ff', fog: '#e8eef5', near: 200, far: 900, sun: 2.4, sunC: '#fff6ea', hemi: 0.8, env: 0.7, fill: 0.8, rim: 0.6 },
};
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function light(stage, mode, mix = null, k = 0) {
  const a = MODES[mode], b = mix ? MODES[mix] : a, L = (f) => lerp(a[f], b[f], k), C = (f) => _c1.set(a[f]).lerp(_c2.set(b[f]), k).clone();
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  u.zenith.value.copy(C('zen')); u.horizon.value.copy(C('hor')); u.below.value.copy(C('bel'));
  sc.fog.color.copy(C('fog')); sc.fog.near = L('near'); sc.fog.far = L('far');
  stage.sun.intensity = L('sun'); stage.sun.color.copy(C('sunC')); stage.hemi.intensity = L('hemi'); sc.environmentIntensity = L('env');
  stage.fill.intensity = L('fill'); stage.rim.intensity = L('rim');
}

// ---------- update ----------
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();
function setRod(m, a, b) { m.position.copy(a).lerp(b, 0.5); m.scale.set(1, Math.max(0.01, a.distanceTo(b)), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); }
export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0 || (k === 'policeCar' && place0 === 'street');
  groundMesh.visible = place0 === 'yard' || place0 === 'tower' || place0 === 'street' || place0 === 'eye' || place0 === 'museum';
  stage.skyMesh.position.copy(stage.camera.position);
  if (place0 === 'street') light(stage, 'dusk', 'night', smooth(inv(DARK, DARK + 0.4, s)));
  else if (place0 === 'sky' && SHOT !== 'cta') light(stage, 'high');
  else if (place0 === 'museum') light(stage, 'museum');
  else light(stage, 'day');

  // ---------- the chair, balloons and rope ----------
  const c = chairAt(s); chair.visible = c.place === place0 && place0 !== 'museum';
  chair.position.copy(c.pos); chair.rotation.set(0, c.yaw, 0); chair.updateMatrixWorld(true);
  chair.userData.ropes.visible = c.ropes;
  cluster.visible = chair.visible && c.balloons;
  if (cluster.visible) {
    const ring = chair.localToWorld(K.RING.clone()); cluster.position.copy(ring); cluster.rotation.set(0, c.yaw, 0);
    const gone = (i) => (POPPED.includes(i) && s >= POP_T[POPPED.indexOf(i)]) || (LEAKED.includes(i) && s >= T.lines);
    const shrink = s >= T.lines ? 0.86 : 1;
    K.setBalloons(cluster, (i) => (gone(i) ? 0 : shrink), s);
  }
  // in the street after landing, what's left of the cluster still hangs from the power line (strings slack)
  if (place0 === 'street' && s >= T.police) {
    cluster.visible = true; cluster.position.copy(SNAG_PT); cluster.rotation.set(0, 0.25, 0);
    K.setBalloons(cluster, (i) => (POPPED.includes(i) || LEAKED.includes(i) || i % 3 === 0 ? 0 : 0.8), s * 0.5);
  }
  // the tether: chair bottom to the Jeep's hitch, until it snaps; then a stub on the hitch and a tail under the chair
  rope.visible = ropeStub.visible = ropeTail.visible = false;
  if (place0 === 'yard' && s < T.climb) {
    const bottom = chair.localToWorld(V(0, 0.4, 0.1));
    if (s < SNAP) { rope.visible = true; setRod(rope, S.hitch, bottom); }
    else {
      ropeStub.visible = true; setRod(ropeStub, S.hitch, S.hitch.clone().add(V(0.25, -0.9, 0.35)));
      ropeTail.visible = true; const a = s - SNAP; setRod(ropeTail, bottom, bottom.clone().add(V(1.5 * Math.sin(a * 9) * Math.exp(-a), -6, 0.8 * Math.cos(a * 7))));
    }
  }
  if (place0 === 'sky' && SHOT !== 'cta') { const bottom = chair.localToWorld(V(0, 0.4, 0.1)); ropeTail.visible = true; setRod(ropeTail, bottom, bottom.clone().add(V(0.6 * Math.sin(s * 1.3), -6.5, 0.4 * Math.cos(s)))); }

  // ---------- cast ----------
  const mx = maxAt(s); place(max, mx);
  const xs = { mia: miaAt(s), leo: leoAt(s), skye: skyeAt(s), noob: noobAt(s) };
  place(mia, xs.mia); place(leo, xs.leo); place(skye, xs.skye); place(noob, xs.noob);
  caps.leo.item.visible = !!xs.leo.cap; caps.skye.item.visible = !!xs.skye.cap; caps.noob.item.visible = !!xs.noob.cap;
  for (const k of ['sandwich', 'pistol', 'letter']) P[k].visible = mx.hold === k && max.root.visible;
  P.radio.visible = xs.leo.hold === 'radio' && leo.root.visible; P.camera.visible = xs.leo.hold === 'camera' && leo.root.visible;
  P.mic.visible = xs.mia.hold === 'mic' && mia.root.visible; P.torch.visible = xs.noob.hold === 'torch' && noob.root.visible;

  // the falling pistol: from his hand at DROP, tumbling down
  P.fallGun.visible = false;
  if (SHOT === 'drop' && s >= DROP) {
    const a = s - DROP; max.bones['Arm.R'].updateMatrixWorld(true);
    const h0 = V(-0.5, -1.3, 0).applyMatrix4(max.bones['Arm.R'].matrixWorld);
    P.fallGun.visible = a < 1.6; P.fallGun.position.copy(h0).add(V(0.4 * a, -0.5 * a - 9 * a * a, 0.6 * a)); P.fallGun.rotation.set(a * 9, a * 4, a * 6);
  }
  // pops: a puff and paper scraps where each balloon was
  for (const p of puffs) p.visible = false;
  scrap.visible = false;
  if (place0 === 'sky' && SHOT === 'pops') {
    let n = 0;
    POP_T.forEach((pt, i) => {
      const a = s - pt; if (a < 0 || a > 0.7) return;
      const w = K.balloonWorld(cluster, POPPED[i]); const p = puffs[i]; p.visible = true; p.position.copy(w); p.scale.setScalar(1.2 + 3 * a); p.material.opacity = 0.75 * (1 - a / 0.7);
      for (let k = 0; k < 8; k++) {
        const th = k * 2.399 + i, d = V(Math.cos(th), 0.4 + 0.15 * (k % 3), Math.sin(th));
        tmpQ.setFromEuler(new THREE.Euler(a * 7 + k, a * 5, k)); tmpM.compose(w.clone().addScaledVector(d, 2 + 5 * a).add(V(0, -6 * a * a, 0)), tmpQ, V(1.4, 1.4, 1.4));
        scrap.setMatrixAt(n++, tmpM);
      }
    });
    for (; n < 24; n++) { tmpM.makeScale(0, 0, 0); scrap.setMatrixAt(n, tmpM); }
    scrap.instanceMatrix.needsUpdate = true; scrap.visible = true;
  }
  // sparks where the cables hit the line
  spark.visible = false;
  if (SHOT === 'lines' && s >= SNAG && s < SNAG + 0.7) {
    spark.visible = true; const a = s - SNAG, c0 = SNAG_PT.clone();
    for (let i = 0; i < 30; i++) {
      const th = i * 2.399, ph = -0.3 + (i % 7) * 0.2, sp = 6 + (i % 5) * 1.5;
      const d = V(Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph));
      tmpQ.setFromUnitVectors(V(0, 0, 1), d.clone().add(V(0, -1.5 * a, 0)).normalize());
      tmpM.compose(c0.clone().addScaledVector(d, sp * a).add(V(0, -9 * a * a, 0)), tmpQ, V(1, 1, a < 0.5 ? 1 : 0.001)); spark.setMatrixAt(i, tmpM);
    }
    spark.instanceMatrix.needsUpdate = true;
  }
  // blackout: windows and street lamps off at DARK (a flicker first)
  if (place0 === 'street') {
    const flick = s > DARK - 0.25 && s < DARK ? (Math.sin(s * 90) > 0 ? 1 : 0.2) : 1, on = s < DARK ? flick : 0;
    S.street.winM.emissiveIntensity = 1.4 * on; S.street.winM.color.set(on > 0.5 ? '#ffd98a' : '#3a4250');
    S.street.lampM.emissiveIntensity = 2.0 * on; S.street.glow.intensity = 0;
    // police lights
    const pu = S.police.userData, ph = Math.floor(s * 6) % 2, act = s >= T.police;
    pu.red.emissiveIntensity = act && ph ? 3 : 0; pu.blue.emissiveIntensity = act && !ph ? 3 : 0; pu.lr.intensity = act && ph ? 60 : 0; pu.lb.intensity = act && !ph ? 60 : 0;
  }
  // the flashlight beam
  flashLight.intensity = 0;
  if (P.torch.visible) { P.torch.updateMatrixWorld(true); flashLight.position.copy(P.torch.localToWorld(V(0, 0, 0.9))); flashLight.target.position.copy(P.torch.localToWorld(V(0, 0, 12))); flashLight.target.updateMatrixWorld(true); flashLight.intensity = 90; }
  // the press camera's flash bulb
  P.camera.userData.bulb.material.emissiveIntensity = SHOT === 'press' && [W.reporters + 0.2, W.why + 0.1, W.around + 0.2].some((f) => s > f && s < f + 0.12) ? 6 : 0;
  // breath puffs in the cold
  for (const p of breath) p.visible = false;
  if (mx.breath) {
    const h = headPos(max), f = V(Math.sin(max.root.rotation.y), 0, Math.cos(max.root.rotation.y));
    breath.forEach((p, i) => { const age = ((s * 0.8 + i / breath.length) % 1); p.visible = true; p.position.copy(h).add(V(0, -0.5 + age * 0.6, 0)).addScaledVector(f, 0.6 + age * 1.6); p.scale.setScalar(0.12 + age * 0.35); p.material.opacity = 0.55 * (1 - age); });
  }
  // the sky: clouds stream past (fast in the climb, a slow rise when he sinks)
  if (place0 === 'sky') {
    const climb = SHOT === 'climb' ? 260 * easeIn(clamp((s - T.climb) / 1.2)) * 0 + 140 * (s - T.climb) + 40 * (s - T.climb) ** 2 : 0;
    const sink = s > W.sink ? -6 * (s - W.sink) : 0;
    S.sky.clouds.forEach((cl) => { const b = cl.userData.base; let y = b.y - climb - sink - 1.5 * s; y = ((y + 160) % 330 + 330) % 330 - 160; cl.position.set(b.x, y, b.z); });
  }
  // the airliner passing behind him, and over the yard in "never"
  S.liner.visible = false;
  if (SHOT === 'liner') { const k = (s - T.liner) / (T.cockpit - T.liner); S.liner.visible = true; S.liner.position.copy(K.SKY).add(V(lerp(70, -50, k), 12, -90)); S.liner.rotation.set(0, -R90, 0.05); }
  if (SHOT === 'never') { const k = (s - T.never) / (T.museum - T.never); S.liner.visible = true; S.liner.position.set(lerp(-120, 60, k), 90, -60); S.liner.rotation.set(0, R90, 0); S.liner.scale.setScalar(1); }
  // the airliner nose flies with the camera; clouds rush past it
  if (SHOT === 'cockpit') S.nose.position.copy(K.PLANE);

  // ---------- cameras ----------
  const hd = headPos(max), cp = chair.position.clone();
  switch (shot.id) {
    case 'hook': { const k = easeOut(clamp(t / 2.5)); look(stage, V(lerp(7.5, 8.5, k), lerp(2.4, 2.8, k), lerp(14, 16.5, k)), V(1.5, lerp(9.5, 10.5, k), 0), 64, 30); break; }
    case 'plan': look(stage, V(16, 4, 30), V(2, 12 + 0.4 * LIFT(s), 0), 56, 34); break;
    case 'snap': look(stage, S.hitch.clone().add(V(3.2, 2.2, 5.6)), S.hitch.clone().add(V(0.4, 1.6, 0.6)), 50, 10); break;
    case 'climb': look(stage, cp.clone().add(V(5.5, 1.0, 8.5)), cp.clone().add(V(0, 5, 0)), 58, 30); break;
    case 'freeze': look(stage, hd.clone().add(V(1.0, -0.1, 4.4).applyAxisAngle(V(0, 1, 0), 0.2)), hd.clone().add(V(0, 0.1, 0)), 42, 8); break;
    case 'eye': look(stage, K.EYE.clone().add(V(-5.6, 5.2, 9.5)), K.EYE.clone().add(V(0.8, 5.4, -1.2)), 50, 16); break;
    case 'packed': look(stage, hd.clone().add(V(1.6, -0.6, 7.2).applyAxisAngle(V(0, 1, 0), 0.35)), hd.clone().add(V(0, -0.9, 0)), 44, 10); break;
    case 'liner': look(stage, cp.clone().add(V(-6, 3.0, 13)), cp.clone().add(V(-4, 7, -20)), 54, 30); break;
    case 'cockpit': look(stage, K.PLANE.clone().add(V(-1.0, 4.6, 14)), K.PLANE.clone().add(V(0, 3.4, 2.0)), 44, 14); break;
    case 'tower': { const k = smooth(u); look(stage, K.TOWER.clone().add(V(lerp(18, 14, k), 3, 42)), K.TOWER.clone().add(V(0, 24, 0)), 52, 40); break; }
    case 'pops': look(stage, cp.clone().add(V(2.0, 0.2, 9.5)), cp.clone().add(V(0, 9.5, 0)), 62, 30); break;
    case 'drop': look(stage, hd.clone().add(V(3.4, -1.6, 6.0)), hd.clone().add(V(0, -1.8, 0)), 50, 10); break;
    case 'lines': look(stage, K.STREET.clone().add(V(4, 7, -30)), K.STREET.clone().add(V(12, 14, -6)), 56, 40); break;
    case 'police': look(stage, K.STREET.clone().add(V(9, 4.0, -15)), K.STREET.clone().add(V(16, 4.2, -3)), 50, 18); break;
    case 'press': look(stage, K.STREET.clone().add(V(13, 4.2, -10.5)), K.STREET.clone().add(V(13.5, 4.6, -1)), 52, 16); break;
    case 'fined': look(stage, hd.clone().add(V(2.2, 0.4, 7.5).applyAxisAngle(V(0, 1, 0), 0.4)), hd.clone().add(V(0, -1.0, 0)), 46, 12); break;
    case 'aircraft': look(stage, hd.clone().add(V(0.6, 0.2, 5.5).applyAxisAngle(V(0, 1, 0), 0.4)), hd.clone().add(V(0, -0.3, 0)), 44, 10); break;
    case 'never': look(stage, K.LAUNCH.clone().add(V(-3.5, 1.4, 16)), K.LAUNCH.clone().add(V(-6.5, 8, 4)), 56, 20); break;
    case 'museum': { const k = easeOut(clamp((t - T.museum) / 3.2)); look(stage, K.MUSEUM.clone().add(V(lerp(4, 2, k), lerp(9, 6.5, k), lerp(26, 19, k))), K.MUSEUM.clone().add(V(0, lerp(9, 5.5, k), 0)), 52, 24); break; }
    case 'cta': look(stage, cp.clone().add(V(4, 4, 22)), cp.clone().add(V(0, 11, 0)), 54, 30); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  stage.skyMesh.position.copy(stage.camera.position);
  CAM = stage.camera;
  S.maxHead2D = null;
  if (max.root.visible) { const p = headPos(max).project(CAM); S.maxHead2D = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
  S.pop2D = POP_T.map((pt, i) => { const p = K.balloonWorld(cluster, POPPED[i]).project(CAM); return [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; });
}
let CAM = null;

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, t0, d = 0.22, s = 2.2) => easeOutBack(clamp((t - t0) / d), s);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
// altitude in feet (the HUD): rising on the rope to the plan, then the climb, then a slow sink, then the street
function altitude(t) {
  if (t < SNAP) return lerp(3, 60, smooth(clamp(t / SNAP)));
  if (t < W.thousand1) return lerp(60, 1000, easeIn(inv(SNAP, W.thousand1, t)));
  if (t < W.five) return lerp(1000, 5000, inv(W.thousand1, W.five, t));
  if (t < W.sixteen + 0.3) return lerp(5000, 16000, smooth(inv(W.five, W.sixteen + 0.3, t)));
  if (t < W.sink) return 16000 + 40 * Math.sin(t * 2);
  if (t < T.lines) return 16000 - 900 * (t - W.sink);
  if (t < SNAG) return lerp(320, 24, easeOut(inv(T.lines, SNAG, t)));
  return 24;
}
function hud(g, s, t) {
  if (t < T.plan || t >= T.police || SHOT === 'eye' || SHOT === 'cockpit' || SHOT === 'tower') return;
  const a = clamp((t - T.plan) / 0.25), x = 50, y = 236, w = 560, h = 150;
  g.save(); g.globalAlpha = a;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#5ab0ff'; g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#9fd0ff'; g.fillText('ALTITUDE', (x + 30) * s, (y + 36) * s);
  g.font = `${72 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText(`${fmt(altitude(t))} FT`, (x + 28) * s, (y + 96) * s);
  // the plan, struck through once the rope goes
  g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.textAlign = 'right'; g.fillText('PLAN: 100 FT', (x + w - 26) * s, (y + 36) * s);
  if (t > SNAP) { const k = clamp((t - SNAP) / 0.2); g.strokeStyle = '#ff4d4d'; g.lineWidth = 6 * s; g.beginPath(); g.moveTo((x + w - 240) * s, (y + 36) * s); g.lineTo((x + w - 240 + 220 * k) * s, (y + 36) * s); g.stroke(); }
  g.restore();
}
function hotbar(g, s, t) {                                    // a Roblox-style inventory: sandwich, pellet gun
  if (!['packed', 'liner', 'pops', 'drop'].includes(SHOT)) return;
  const items = [['SANDWICH', W.sandwiches - 0.1], ['PELLET GUN', W.pellet - 0.1]], x0 = 540 - 260, y = 1560;
  items.forEach(([name, t0], i) => {
    const k = t >= t0 ? pop(t, t0) : 0; if (k <= 0) return;
    const x = x0 + i * 280, sel = i === 1 ? t >= W.pellet - 0.1 : t < W.pellet - 0.1;
    g.save(); g.translate((x + 120) * s, (y + 70) * s); g.scale(k, k); g.translate(-(x + 120) * s, -(y + 70) * s);
    roundRect(g, x * s, y * s, 240 * s, 140 * s, 22 * s); g.fillStyle = 'rgba(20,24,36,.82)'; g.fill(); g.lineWidth = (sel ? 7 : 3) * s; g.strokeStyle = sel ? '#ffffff' : 'rgba(255,255,255,.35)'; g.stroke();
    g.font = `800 ${24 * s}px Montserrat`; g.fillStyle = 'rgba(255,255,255,.7)'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(String(i + 1), (x + 14) * s, (y + 10) * s);
    g.font = `${38 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, (x + 120) * s, (y + 84) * s);
    if (i === 1 && t >= DROP + 0.15) {                       // the gun is gone
      g.strokeStyle = '#ff4d4d'; g.lineWidth = 12 * s; g.beginPath(); g.moveTo((x + 30) * s, (y + 20) * s); g.lineTo((x + 210) * s, (y + 120) * s); g.moveTo((x + 210) * s, (y + 20) * s); g.lineTo((x + 30) * s, (y + 120) * s); g.stroke();
    }
    g.restore();
  });
}
function bubble(g, s, text, x, y, k, size = 54) {               // speech bubble with a tail down to (x, y)
  if (k <= 0) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70, h = size * 1.9;
  const bx = clamp(x - w / 2, 40, 1040 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  const tx = clamp(x, bx + 60, bx + w - 60);
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h - 3) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h) * s); g.stroke();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, (bx + w / 2) * s, (by + h / 2 + 4) * s);
  g.restore();
}
function stamp(g, s, text, x, y, k, color = '#e0283a', rot = -0.18, size = 96) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); const sc = lerp(2.2, 1, clamp(k)); g.scale(sc, sc); g.globalAlpha = clamp(k * 1.5);
  g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 60 * s, h = size * 1.35 * s;
  roundRect(g, -w / 2, -h / 2, w, h, 18 * s); g.lineWidth = 12 * s; g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6 * s);
  g.restore();
}
function radar(g, s, t) {                                     // the tower's radar screen with the blip
  const k = pop(t, T.tower, 0.25, 1.6), cx = 540, cy = 560, r = 250;
  g.save(); g.translate(cx * s, cy * s); g.scale(k, k);
  roundRect(g, -(r + 40) * s, -(r + 40) * s, (2 * r + 80) * s, (2 * r + 80) * s, 40 * s); g.fillStyle = 'rgba(10,20,14,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#3ddc7a'; g.stroke();
  g.strokeStyle = 'rgba(61,220,122,.45)'; g.lineWidth = 3 * s;
  for (const rr of [0.33, 0.66, 1]) { g.beginPath(); g.arc(0, 0, r * rr * s, 0, Math.PI * 2); g.stroke(); }
  g.beginPath(); g.moveTo(-r * s, 0); g.lineTo(r * s, 0); g.moveTo(0, -r * s); g.lineTo(0, r * s); g.stroke();
  const ang = (t * 3.2) % (Math.PI * 2);
  const grd = g.createConicGradient ? g.createConicGradient(ang - 0.8, 0, 0) : null;
  g.save(); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * s, -0.6, 0); g.closePath(); g.fillStyle = 'rgba(61,220,122,.28)'; g.fill(); g.restore();
  // blips: two airliners and the chair
  const blip = (x, y, label, col, kk) => { if (kk <= 0) return; g.fillStyle = col; g.beginPath(); g.arc(x * s, y * s, 13 * s * kk, 0, Math.PI * 2); g.fill(); if (label) { g.font = `${40 * s}px "Luckiest Guy"`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = 8 * s; g.strokeStyle = '#0a140e'; g.strokeText(label, (x + 26) * s, y * s); g.fillStyle = col; g.fillText(label, (x + 26) * s, y * s); } };
  blip(-150, -90, 'TWA', '#3ddc7a', 1); blip(120, 140, 'DELTA', '#3ddc7a', 1);
  blip(-40, 60, t > W.chair2 - 0.3 ? 'LAWN CHAIR?!' : '?', '#ffd23f', t > W.man2 - 0.3 ? pop(t, W.man2 - 0.3) : 0);
  g.restore();
}
function notice(g, s, t) {                                    // the FAA notice
  const k = easeOut(clamp((t - T.fined) / 0.35)), y0 = lerp(1920, 0, k);
  g.save(); g.translate(0, y0 * s);
  const x = 110, y = 300, w = 860, h = 620;
  g.save(); g.translate(540 * s, (y + h / 2) * s); g.rotate(-0.03); g.translate(-540 * s, -(y + h / 2) * s);
  roundRect(g, x * s, y * s, w * s, h * s, 14 * s); g.fillStyle = '#fbfaf4'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * s; g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#1d3d8a'; g.fillRect(x * s, y * s, w * s, 110 * s);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('NOTICE OF VIOLATION', 540 * s, (y + 60) * s);
  g.textAlign = 'left'; g.font = `700 ${38 * s}px Montserrat`; g.fillStyle = '#26324a';
  g.fillText('Flying an aircraft without', (x + 50) * s, (y + 180) * s); g.fillText('calling the control tower.', (x + 50) * s, (y + 232) * s);
  g.font = `800 ${40 * s}px Montserrat`; g.fillStyle = '#26324a'; g.fillText('AIRCRAFT:', (x + 50) * s, (y + 330) * s);
  if (t > W.lawn3 - 0.15) {
    const kk = clamp((t - W.lawn3 + 0.15) / 0.35); g.fillStyle = 'rgba(255,224,60,.7)'; g.fillRect((x + 290) * s, (y + 300) * s, 420 * kk * s, 64 * s);
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#c8202b'; g.save(); g.beginPath(); g.rect((x + 280) * s, (y + 290) * s, 440 * kk * s, 90 * s); g.clip(); g.fillText('LAWN CHAIR', (x + 300) * s, (y + 336) * s); g.restore();
  } else { g.fillStyle = '#9aa0aa'; g.fillRect((x + 300) * s, (y + 318) * s, 300 * s, 22 * s); }
  for (let i = 0; i < 3; i++) { g.fillStyle = '#c5cad3'; g.fillRect((x + 50) * s, (y + 420 + i * 40) * s, (w - 150 - i * 90) * s, 16 * s); }
  g.restore();
  if (t > W.fined + 0.15) stamp(g, s, 'FINED', 760, 820, pop(t, W.fined + 0.15, 0.18, 1.2), '#e0283a', -0.22, 110);
  g.restore();
}
export function overlay(g, s, t) {
  // the hook: readable on frame 1
  if (t < T.plan - 0.05) {
    const out = 1 - clamp((t - (T.plan - 0.35)) / 0.3);
    g.save(); g.globalAlpha = out;
    bigText(g, s, 'A LAWN CHAIR', 540, 330, 112, '#ffffff', 1, -0.03);
    bigText(g, s, '+ 42 BALLOONS', 540, 470, 120, '#ffd23f', t > W.fortytwo - 0.1 ? pop(t, W.fortytwo - 0.1) : 0, -0.03);
    g.restore();
  }
  if (SHOT === 'climb') speedLines(g, s, t, 0.8, { cx: 540, cy: 760 });
  hud(g, s, t);
  if (SHOT === 'snap' && t > SNAP) bigText(g, s, 'SNAP!', 540, 560, 170, '#ff4d4d', pop(t, SNAP, 0.15, 2.6) * (1 - clamp((t - SNAP - 0.9) / 0.2)), -0.08);
  if (SHOT === 'climb') {
    for (const [w, txt] of [[W.thousand1, '1,000 FT'], [W.five, '5,000 FT'], [W.sixteen, '16,000 FT']]) {
      const a = t - w + 0.05; if (a < 0 || a > 0.9) continue;
      bigText(g, s, txt, 540, 560, w === W.sixteen ? 150 : 120, w === W.sixteen ? '#ffd23f' : '#ffffff', pop(t, w - 0.05, 0.18) * (1 - clamp((a - 0.75) / 0.15)), -0.04);
    }
  }
  if (SHOT === 'freeze') {                                     // frost round the edges
    const k = clamp((t - T.freeze) / 0.4);
    const gr = g.createRadialGradient(540 * s, 960 * s, 380 * s, 540 * s, 960 * s, 1150 * s); gr.addColorStop(0, 'rgba(220,240,255,0)'); gr.addColorStop(1, `rgba(225,242,255,${0.8 * k})`);
    g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 1920 * s);
    bigText(g, s, 'FREEZING', 540, 520, 140, '#bfe6ff', pop(t, W.freezing - 0.1), -0.03, '#0e2a4a');
  }
  if (SHOT === 'eye' && t > W.enough - 0.05) stamp(g, s, 'PILOT? REJECTED', 540, 520, pop(t, W.enough - 0.05, 0.18, 1.2), '#e0283a', -0.14, 84);
  hotbar(g, s, t);
  if (SHOT === 'tower') radar(g, s, t);
  if (SHOT === 'pops' && S.pop2D) POP_T.forEach((pt, i) => { const a = t - pt; if (a < 0 || a > 0.6) return; const [x, y] = S.pop2D[i]; bigText(g, s, 'POP!', clamp(x, 160, 920), clamp(y, 300, 1500), 96, '#ffd23f', pop(t, pt, 0.12, 2.6) * (1 - clamp((a - 0.45) / 0.15)), (i - 1) * 0.15); });
  if (SHOT === 'lines' && t > DARK) bigText(g, s, 'BLACKOUT', 540, 480, 140, '#ffd23f', pop(t, DARK, 0.2, 2) * (1 - clamp((t - DARK - 1.4) / 0.2)), -0.04);
  if (SHOT === 'press' && S.maxHead2D && t > W.man3 - 0.15 && t < W.around + 0.9) {
    const k = pop(t, W.man3 - 0.15, 0.2, 2) * (1 - clamp((t - W.around - 0.7) / 0.2));
    bubble(g, s, "A MAN CAN'T JUST", S.maxHead2D[0], Math.min(S.maxHead2D[1] - 150, 640), k, 56);
    bubble(g, s, 'SIT AROUND.', S.maxHead2D[0], Math.min(S.maxHead2D[1] - 150, 640) + 115, k * (t > W.sit - 0.1 ? 1 : 0), 56);
  }
  if (SHOT === 'press') {                                      // camera flashes
    const f = [W.reporters + 0.2, W.why + 0.1, W.around + 0.2].map((x) => t - x).filter((a) => a >= 0 && a < 0.15);
    if (f.length) { g.save(); g.globalAlpha = 0.5 * (1 - f[0] / 0.15); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
  }
  if (SHOT === 'fined' || SHOT === 'aircraft') notice(g, s, t);
  if (SHOT === 'never' && t > W.pilot - 0.2) stamp(g, s, 'NEVER A PILOT', 540, 470, pop(t, W.pilot - 0.2, 0.2, 1.4), '#e0283a', -0.1, 88);
  if (SHOT === 'museum' && t > W.museum - 0.4) { const k = pop(t, W.museum - 0.4, 0.25, 2); bigText(g, s, 'NOW IN THE', 540, 380, 84, '#ffffff', k, -0.03); bigText(g, s, 'AIR AND SPACE MUSEUM', 540, 490, 84, '#ffd23f', k, -0.03); }
  if (t >= T.cta) {                                            // call to action
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

export const cast = () => ({ max, mia, leo, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
export const props = () => P;
