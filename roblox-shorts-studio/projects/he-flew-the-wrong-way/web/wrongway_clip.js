// He Flew The Wrong Way. Web renderer + Roblox R6 pack. True story (17-18 July 1938): refused permission to fly the
// Atlantic, Douglas Corrigan files a flight plan to California, takes off from Floyd Bennett Field at dawn, keeps flying
// east into the clouds (no radio, a 20-year-old compass, fuel leaking into the cockpit: a screwdriver through the floor),
// lands at Baldonnel near Dublin 28 hours later ("Just got in from New York. Where am I?"), blames his compass, gets a
// 600-word telegram of broken rules and a suspension that ends the day his ship gets home, and a ticker-tape parade
// bigger than Lindbergh's. He never admitted a thing.
// Max is Corrigan, Mia the official (officer_cap), Leo the Irish officer (officer_cap), Skye, Noob and extras the crew
// and the crowd. Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.5) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Flew The Wrong Way' };
export const sky = { zenith: '#3d6fb0', horizon: '#ffc58a', below: '#5a6a50', fog: '#e8c8a8', sunDir: new THREE.Vector3(0.8, 0.25, 0.3) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;
const at = (base) => (x, y, z) => base.clone().add(V(x, y, z));
const NY = at(K.NYC), EI = at(K.EIRE), OF = at(K.OFFICE), SK = at(K.SKY), CK = at(K.COCKPIT), SE = at(K.SEA), ST = at(K.STREET);

// ---------- key times (all on the narration) ----------
const T = {
  ire: W.twentyeight - 0.1, ask: W.for - 0.1, denied: W.officials1 - 0.1, patched: W.his1 - 0.1, plan: W.so - 0.1, takeoff: W.at - 0.1,
  east: W.kept - 0.1, radio: W.no2 - 0.1, leak: W.then - 0.1, screw: W.punched - 0.1, dublin: W.lands2 - 0.1, whereami: W.just - 0.15,
  excuse: W.excuse - 0.1, telegram: W.officials2 - 0.1, ship: W.punishment - 0.1, parade: W.new3 - 0.1, bigger: W.bigger - 0.1,
  name: W.they - 0.1, admit: W.and4 - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.ire, 'ireland'], [T.ask, 'ask'], [T.denied, 'denied'], [T.patched, 'patched'], [T.plan, 'plan'], [T.takeoff, 'takeoff'],
  [T.east, 'east'], [T.radio, 'radio'], [T.leak, 'leak'], [T.screw, 'screw'], [T.dublin, 'dublin'], [T.whereami, 'whereami'],
  [T.excuse, 'excuse'], [T.telegram, 'telegram'], [T.ship, 'ship'], [T.parade, 'parade'], [T.bigger, 'bigger'], [T.name, 'name'],
  [T.admit, 'admit'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = {
  hook: 'ny', ireland: 'eire', ask: 'office', denied: 'office', patched: 'ny', plan: 'office', takeoff: 'ny', east: 'sky', radio: 'cockpit',
  leak: 'cockpit', screw: 'cockpit', dublin: 'eire', whereami: 'eire', excuse: 'eire', telegram: 'eire', ship: 'sea', parade: 'street',
  bigger: 'street', name: 'street', admit: 'street', cta: 'street',
};
const MODE_OF = { hook: 'dawn', patched: 'dawn', takeoff: 'dawn', ireland: 'eire', dublin: 'eire', whereami: 'eire', excuse: 'eire', telegram: 'eire',
  ask: 'office', denied: 'office', plan: 'office', east: 'sky', radio: 'cockpit', leak: 'cockpit', screw: 'cockpit', ship: 'sea',
  parade: 'street', bigger: 'street', name: 'street', admit: 'street', cta: 'street' };

// ---------- the plane's path per shot (world position, heading, pitch, prop spin) ----------
// Plane model faces +z; heading +R90 points it east (+x).
function planeAt(s) {
  switch (SHOT) {
    case 'hook': { const u = s; const x = -46 + 5 * u + 3.2 * u * u, y = Math.max(0, u - 2.0) ** 2 * 2.2; return { pos: NY(x, y, K.RUNWAY_Z), heading: R90, pitch: -0.14 * smooth(inv(1.8, 2.6, u)), prop: 1, vis: true }; }
    case 'takeoff': { const u = s - T.takeoff; const x = 10 + 26 * u, y = 4 + 3.0 * u + 1.2 * u * u; return { pos: NY(x, y, K.RUNWAY_Z), heading: R90, pitch: -0.2, roll: 0, prop: 1, vis: true }; }
    case 'ireland': {                                              // touches down and rolls toward the camera side
      const u = s - T.ire, x = -70 + 30 * u - 3.2 * u * u, y = Math.max(0, 9 - 7 * u) * (u < 1.3 ? 1 : 0) + (u > 1.3 ? 0.6 * Math.max(0, Math.sin((u - 1.3) * 7)) * Math.exp(-(u - 1.3) * 3) : 0);
      return { pos: EI(x, Math.max(0, y), K.RUNWAY_Z), heading: R90, pitch: u < 1.3 ? -0.05 : 0, prop: 1, vis: true };
    }
    case 'dublin': case 'whereami': case 'excuse': case 'telegram': return { pos: EI(-2, 0, K.RUNWAY_Z), heading: R90 - 0.35, pitch: 0, prop: SHOT === 'dublin' ? Math.max(0, 1 - (s - T.dublin) / 1.5) : 0, vis: true };
    case 'patched': return { pos: NY(-60, 0, -14), heading: -0.6, pitch: 0, prop: 0, vis: true };
    case 'east': return { pos: SK(0, 0, 0), heading: 0, pitch: 0.02 * Math.sin(s * 1.7), roll: 0.05 * Math.sin(s * 1.1), prop: 1, vis: true };
  }
  return { vis: false };
}

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, extras = [], plane, car, stampM, screw, tgram, P = {}, S = {}, PLACES = {}, SHOT = 'hook', NOW = 0;
let head2D = {};
export async function setup(stage) {
  const { scene } = stage;
  const ex = ['happy', 'neutral', 'surprised', 'laugh'];
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'determined', 'sad', 'nervous', 'confused', 'laugh', 'smug', 'cool', 'scared', 'talking'] }),
    loadRobloxCharacter('Leo', { expressions: ['shocked', 'surprised', 'neutral', 'confused', 'happy', 'suspicious', 'talking', 'laugh'].filter(Boolean), hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['angry', 'neutral', 'annoyed', 'suspicious', 'surprised', 'talking', 'smug', 'happy', 'determined'], hairLift: 0.2 }),
    loadRobloxCharacter('Skye', { expressions: ex }),
    loadRobloxCharacter('Noob', { expressions: ex }),
  ]);
  extras = await Promise.all(['Noob', 'Skye', 'Noob', 'Leo', 'Skye', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root, ...extras.map((e) => e.root));
  await wear(mia, 'officer_cap'); await wear(leo, 'officer_cap');
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'laugh_big', 'point_forward', 'think', 'talk', 'clap', 'facepalm', 'look_up', 'laugh']) A[n] = await loadAnimation(n);

  PLACES.ny = K.nyField(scene); PLACES.eire = K.eireField(scene); PLACES.office = K.office(scene);
  PLACES.sky = K.skyPlace(scene); PLACES.cockpit = K.cockpit(scene); PLACES.sea = K.seaPlace(scene); PLACES.street = K.street(scene);
  for (const k of Object.keys(PLACES)) S[k] = PLACES[k].userData;
  plane = K.robin(); scene.add(plane); plane.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  car = K.paradeCar(); PLACES.street.add(car); car.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  stampM = K.rubberStamp(); mia.bones['Arm.R'].add(stampM); stampM.position.set(0, -1.8, 0); stampM.rotation.x = 1.207;
  screw = K.screwdriver(); max.bones['Arm.R'].add(screw); screw.position.set(0, -1.8, 0);
  tgram = K.telegram(); scene.add(tgram);
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const sitIn = (x) => { x.sit = true; x.layers = [['sit', 0, 1, false]]; return x; };
// Mia's stamp arm: at STAMP_HIT the palm is 1.68 forward and the stamp (tilted by -STAMP_HIT in the fist so it stands
// upright there) meets the form on the desk (top 2.3); at rest it is held up over the form
const STAMP_HIT = -1.207, STAMP_REST = -1.45;
// office spots: desk centre (0, 0, -3) local; Mia behind it, the visitor in front
const MIA_DESK = OF(0.6, 0, -6.0), MAX_DESK = OF(0.2, 0, -0.3);
const MAX_H = Math.PI - 0.75, MIA_H = 0.55;                 // facing each other across the desk, cheated toward the +x camera
// Ireland: the plane stops at EI(-2, 0, 0) heading east-ish; Leo waits on the grass in front of it
const LEO_EI = EI(6.0, 0, 6.0), MAX_EI = EI(3.3, 0, 8.0);
const MAX_TALK_H = 1.7, LEO_TALK_H = -0.43;                   // facing each other, cheated toward the camera on the +x+z side

function maxAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  const pl = planeAt(s);
  switch (SHOT) {
    case 'hook': case 'ireland': case 'takeoff': {                          // in his seat
      if (!pl.vis) return x;
      x = sitIn(st(V(), 0, SHOT === 'hook' ? 'happy' : 'cool')); x.inPlane = true;
      if (SHOT === 'hook') { x.look = [-0.85, -0.05]; x.face = s > 1.6 ? 'laugh' : 'happy'; }
      if (SHOT === 'ireland') { x.look = [-0.7, 0]; x.face = 'happy'; }
      return x;
    }
    case 'ask': { x = st(MAX_DESK, MAX_H, 'nervous'); x.layers = [['talk', s, 1, true]]; x.face = 'talking'; if (s > W.atlantic + 0.2) { x.layers = [['idle', s]]; x.face = 'nervous'; } return x; }
    case 'denied': { x = st(MAX_DESK, MAX_H, 'nervous'); if (s > W.no1 + 0.1) x.face = 'sad'; return x; }
    case 'plan': { x = st(MAX_DESK, MAX_H, 'smug'); if (s > W.california2 + 0.15) x.face = 'cool'; return x; }
    case 'patched': {                                                     // beside his plane, patting the wing strut
      x = st(NY(-53.5, 0, -3.5), 0.75, 'nervous'); x.look = [0.0, 0];
      if (s > W.patched - 0.1) { x.face = 'scared'; }
      return x;
    }
    case 'radio': case 'leak': case 'screw': {
      x = sitIn(st(CK(0, -0.3, -0.75), 0, 'neutral'));
      if (SHOT === 'radio') { x.look = [0, -0.15]; x.face = s > W.twenty - 0.1 ? 'confused' : 'neutral'; }
      if (SHOT === 'leak') { x.look = [0, lerp(-0.1, 0.5, smooth(inv(W.leaked - 0.2, W.leaked + 0.3, s)))]; x.face = s > W.leaked ? 'shocked' : 'surprised'; }
      if (SHOT === 'screw') {
        // raise, then stab down onto the floor at the drip puddle (two jabs), then sit back and watch it drain
        const t0 = T.screw, k = s - t0;
        const jab = (a, b) => Math.sin(clamp((k - a) / (b - a)) * Math.PI);
        // leaning 0.5 forward, arm at -1.205 puts the screwdriver tip (3.9 from the shoulder) on the floor at the puddle
        const down = Math.max(jab(0.35, 0.75), jab(0.85, 1.25));
        const f = k < 0.3 ? lerp(-0.6, -1.9, smooth(k / 0.3)) : k < 1.4 ? lerp(-1.9, -1.205, down) : lerp(-1.9, -0.6, smooth(inv(1.4, 1.8, k)));
        x.arms = [['R', 0.18, f]]; x.look = [0, 0.4]; x.face = k > 1.4 ? 'happy' : 'determined'; x.lean = 0.5 * smooth(inv(0.05, 0.3, k)) * (1 - smooth(inv(1.5, 1.9, k)));
      }
      return x;
    }
    case 'dublin': {                                                       // steps down out of the door, walks to Leo
      const a = EI(-2.1, 0, 3.4), b = MAX_EI;
      x = st(a, 0.3, 'happy'); moveTo(x, a, b, T.dublin + 0.9, s, 12, MAX_TALK_H);
      if (s < T.dublin + 0.9) x.visible = s > T.dublin + 0.55;
      x.face = 'happy'; return x;
    }
    case 'whereami': { x = st(MAX_EI, MAX_TALK_H, 'talking'); x.layers = [['talk', s, 1, true]]; x.face = s > W.where - 0.05 ? 'happy' : 'talking'; if (s > W.am + 0.3) x.layers = [['idle', s]]; return x; }
    case 'excuse': { x = st(MAX_EI, 1.0, 'happy'); x.layers = [['shrug', clamp(s - W.misread + 0.1, 0, 0.7), 1, false]]; x.face = s > W.misread ? 'smug' : 'happy'; return x; }
    case 'telegram': {
      x = st(MAX_EI, 0.9, 'surprised'); x.arms = [['L', 0.25, -1.15], ['R', 0.25, -1.15]]; x.look = [0, 0.32];
      x.face = s > W.rules ? 'nervous' : 'surprised'; x.telegram = true; return x;
    }
    case 'ship': { x = st(V(), 0, 'happy'); x.onShip = true; x.wave = true; return x; }
    case 'parade': case 'bigger': case 'name': { x = sitIn(st(V(), 0, 'laugh')); x.inCar = true; if (SHOT !== 'name' || s > W.wrong) x.wave = true; x.face = SHOT === 'name' ? 'happy' : 'laugh'; if (SHOT === 'bigger') x.look = [0.3, -0.05]; return x; }
    case 'admit': {
      x = st(ST(-2.6, 0, 13.2), 0.65, 'happy'); x.look = [0.25, 0];
      if (s > W.admitted - 0.1) { x.layers = [['shrug', clamp(s - W.admitted + 0.1, 0, 0.7), 1, false]]; x.face = 'smug'; }
      return x;
    }
    case 'cta': { x = st(ST(-2.6, 0, 13.2), 0.35, 'happy'); x.wave = true; return x; }
  }
  return x;
}
function leoAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'ireland': { x = st(EI(-4.0, 0, 19.5), 0.45, 'surprised'); x.look = [lerp(-0.9, 0.5, smooth(inv(T.ire + 0.2, T.ask - 0.4, s))), 0]; x.face = s > W.ireland ? 'shocked' : 'surprised'; return x; }
    case 'dublin': { x = st(LEO_EI, -1.88, 'suspicious'); return x; }
    case 'whereami': { x = st(LEO_EI, LEO_TALK_H, 'surprised'); x.face = s > W.where ? 'shocked' : 'surprised'; return x; }
    case 'excuse': { x = st(LEO_EI, LEO_TALK_H, 'suspicious'); x.face = s > W.misread + 0.3 ? 'confused' : 'suspicious'; return x; }
  }
  return x;
}
function miaAt(s) {
  let x = st(V(0, -50, 0), 0, 'neutral'); x.visible = false;
  const stampArm = (t0, face) => {                                             // lift, then slam the stamp down on the form
    const k = s - t0, f = k < 0.45 ? lerp(STAMP_REST, -2.0, smooth(inv(0, 0.35, k))) : lerp(-2.0, STAMP_HIT, easeIn(inv(0.45, 0.6, k)));
    x.arms = [['R', 0.12, f]]; x.face = k > 0.55 ? face : 'determined'; x.stampHit = k > 0.58;
  };
  switch (SHOT) {
    case 'ask': { x = st(MIA_DESK, MIA_H, 'suspicious'); x.arms = [['R', 0.12, STAMP_REST]]; x.face = 'suspicious'; return x; }
    case 'denied': { x = st(MIA_DESK, MIA_H, 'annoyed'); stampArm(W.no1 - 0.55, 'angry'); return x; }
    case 'plan': { x = st(MIA_DESK, MIA_H, 'neutral'); x.arms = [['R', 0.12, STAMP_REST]]; if (s > W.california2 - 0.6) stampArm(W.california2 - 0.6, 'happy'); return x; }
    case 'admit': {
      x = st(ST(1.6, 0, 11.0), -0.95, 'suspicious'); x.layers = [['talk', s, 1, true]]; x.face = 'talking';
      if (s > W.never + 0.2) { x.layers = [['idle', s]]; x.face = 'suspicious'; }
      if (s > W.thing + 0.1) x.face = 'annoyed';
      return x;
    }
    case 'cta': { x = st(ST(1.6, 0, 11.0), -0.75, 'annoyed'); x.layers = [['facepalm', s - T.cta, 1, false]]; return x; }
  }
  return x;
}
// Ground crew in New York (Skye waves him off in the hook, Noob by the hangar), the crowd on Broadway
const CROWD = [  // [actor index (0 skye, 1 noob, 2.. extras), street-local x, z, heading, mode]
  [0, -11.0, 2, R90 - 0.3, 'clap'], [1, -12.4, 6.5, R90 - 0.1, 'wave'], [2, -11.2, 11, R90 - 0.2, 'clap'], [3, -13.0, 16, R90 + 0.1, 'laugh'],
  [4, 11.0, 4, -R90 + 0.3, 'wave'], [5, 12.6, 8.5, -R90 + 0.1, 'clap'], [6, 11.2, 14, -R90 + 0.2, 'laugh'], [7, 13.2, -2, -R90, 'clap'],
];
function crewAt(i, s) {
  let x = st(V(0, -50, 0), 0, 'neutral'); x.visible = false;
  if (SHOT === 'hook' && i === 0) { x = st(NY(4, 0, 13.5), Math.PI * 0.85, 'happy'); x.wave = true; return x; }
  if (SHOT === 'patched' && i === 1) { x = st(NY(-64.5, 0, -2.5), 0.3, 'surprised'); x.look = [0.0, -0.45]; return x; }
  if (['parade', 'bigger', 'name', 'admit', 'cta'].includes(SHOT)) {
    const c = CROWD.find((q) => q[0] === i); if (!c) return x;
    x = st(ST(c[1], 0.5, c[2]), c[3], 'happy');
    const ph = i * 0.37;
    if (c[4] === 'clap') x.layers = [['clap', s + ph, 1, true]];
    if (c[4] === 'laugh') { x.layers = [['laugh', s + ph, 1, true]]; x.face = 'laugh'; }
    if (c[4] === 'wave') x.wave = true;
    x.face = c[4] === 'laugh' ? 'laugh' : i % 2 ? 'happy' : 'surprised';
    return x;
  }
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false && !x.gone;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11 + (a.name.length)), 0.1);
  if (x.lean) a.bones.Torso.quaternion.multiply(Q.setFromEuler(EUL.set(x.lean, 0, 0, 'XYZ')));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const handPos = (a, sd) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(0, -1.8, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };

// ---------- lighting ----------
const MODES = {
  dawn: { sun: 2.2, sunC: '#ffc890', hemi: 0.7, env: 0.45, fill: 0.55, rim: 1.2, z: '#3d6fb0', h: '#ffc58a', fog: '#e8c8a8', near: 160, far: 900, dir: [0.8, 0.25, 0.3] },
  eire: { sun: 2.4, sunC: '#fff4e0', hemi: 0.8, env: 0.5, fill: 0.6, rim: 0.9, z: '#5d8fd0', h: '#dbe8f2', fog: '#cfdde8', near: 200, far: 1000, dir: [0.4, 0.7, 0.55] },
  office: { sun: 0, sunC: '#ffffff', hemi: 0.75, env: 0.45, fill: 0.55, rim: 0.4, z: '#d9cfb8', h: '#efe8d8', fog: '#d9cfb8', near: 300, far: 1000, lamp: 60, dir: [0.3, 0.8, 0.5] },
  sky: { sun: 2.6, sunC: '#fff2dc', hemi: 0.9, env: 0.6, fill: 0.6, rim: 0.9, z: '#3f78c8', h: '#cfe4f7', fog: '#cfe4f7', near: 200, far: 1400, dir: [0.5, 0.6, -0.3] },
  cockpit: { sun: 0, sunC: '#ffffff', hemi: 0.75, env: 0.5, fill: 0.5, rim: 0.5, z: '#cfd8e0', h: '#e8eef4', fog: '#e8eef4', near: 300, far: 1000, ck: 40, dir: [0.3, 0.8, 0.5] },
  sea: { sun: 2.6, sunC: '#fff0dc', hemi: 0.8, env: 0.55, fill: 0.6, rim: 1.0, z: '#4f8fe6', h: '#d7ecff', fog: '#cfe3f5', near: 300, far: 1600, dir: [-0.5, 0.6, 0.6] },
  street: { sun: 2.4, sunC: '#fff0dc', hemi: 0.85, env: 0.55, fill: 0.7, rim: 1.0, z: '#4f8fe6', h: '#d7ecff', fog: '#d8e4ee', near: 250, far: 900, dir: [0.35, 0.85, 0.4] },
};
function light(stage, mode) {
  const L = MODES[mode], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  if (stage.sunDir) stage.sunDir.set(...L.dir).normalize();
  u.zenith.value.set(L.z); u.horizon.value.set(L.h);
  sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
  S.office.lamp.intensity = L.lamp || 0; S.cockpit.light.intensity = L.ck || 0;
}
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); stage.skyMesh.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

// ---------- update ----------
const SEAT = V(0, 2.2, -0.75);                                   // plane-local root for the seated pilot (seat top 3.7 = root + 1.5)
const CAR_SEAT = V(0, 2.05, -4.6);
function carAt(s) {                                              // street-local position along z (driving toward +z)
  if (SHOT === 'parade') return ST(0, 0, -60 + 6 * (s - T.parade));
  if (SHOT === 'bigger') return ST(0, 0, -6 + 6 * (s - T.bigger));
  if (SHOT === 'name') return ST(0, 0, -50 + 6 * (s - T.name));
  return ST(-1, 0, 4);
}
export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  light(stage, MODE_OF[SHOT]);

  // the plane
  const pl = planeAt(s);
  plane.visible = !!pl.vis;
  if (pl.vis) {
    plane.position.copy(pl.pos); plane.rotation.set(0, pl.heading, 0, 'YXZ'); plane.rotation.x = pl.pitch || 0; plane.rotation.z = pl.roll || 0;
    plane.userData.prop.rotation.z = pl.prop > 0 ? s * 40 * pl.prop : 0.4;
    plane.userData.door.rotation.y = SHOT === 'dublin' ? 1.4 * smooth(inv(T.dublin + 0.2, T.dublin + 0.6, s)) : ['whereami', 'excuse', 'telegram'].includes(SHOT) ? 1.4 : 0;
    plane.userData.loose.rotation.x = SHOT === 'patched' ? -0.25 - 0.35 * Math.abs(Math.sin(s * 6)) : SHOT === 'east' || SHOT === 'takeoff' ? -0.3 - 0.4 * Math.abs(Math.sin(s * 14)) : -0.05;
  }

  // the cast
  const mx = maxAt(s);
  place(max, mx);
  if (mx.inPlane && pl.vis) {                                      // ride along in the seat
    plane.updateMatrixWorld(true);
    max.root.position.copy(SEAT).applyMatrix4(plane.matrixWorld); max.root.quaternion.copy(plane.quaternion);
    max.root.updateMatrixWorld(true);
  }
  if (mx.inCar) { const cp = carAt(s); car.position.copy(cp).sub(K.STREET); max.root.position.copy(cp).add(CAR_SEAT); max.root.rotation.set(0, 0, 0); max.root.updateMatrixWorld(true); }
  if (place0 === 'sea') { const sh = S.sea.ship; sh.position.set(0, 0, -40 + 9 * (s - T.ship)); sh.rotation.set(0.006 * Math.sin(s * 1.3), 0, 0.01 * Math.sin(s * 0.9)); S.sea.wt.offset.set(0, s * 0.02); }
  if (mx.onShip) { const sh = S.sea.ship; sh.parent.updateMatrixWorld(true); max.root.position.copy(V(2.4, sh.userData.deckY + 0.25, 21).applyMatrix4(sh.matrixWorld)); max.root.rotation.set(0, sh.rotation.y + 0.5, 0); max.root.position.y -= max.soleHeight() - (sh.position.y + sh.userData.deckY + 0.25); max.root.updateMatrixWorld(true); }
  screw.visible = SHOT === 'screw';
  place(leo, leoAt(s)); place(mia, miaAt(s));
  stampM.visible = mia.root.visible && ['ask', 'denied', 'plan'].includes(SHOT);
  [skye, noob, ...extras].forEach((a, i) => place(a, crewAt(i, s)));

  // car
  car.visible = ['parade', 'bigger', 'name', 'admit', 'cta'].includes(SHOT);
  if (car.visible) { const cp = carAt(s); car.position.copy(cp).sub(K.STREET); car.rotation.y = SHOT === 'admit' || SHOT === 'cta' ? 0.15 : 0; K.rollWheels(car, cp.z); }

  // office form
  if (place0 === 'office') {
    const f = S.office.form, tx = f.userData.tex, m = miaAt(s);
    f.material.map = SHOT === 'plan' ? (m.stampHit ? tx.approved : tx.plan) : (SHOT === 'denied' && m.stampHit ? tx.denied : tx.atlantic);
  }
  // the telegram
  tgram.visible = SHOT === 'telegram';
  if (tgram.visible) {
    const hl = handPos(max, 'L'), hr = handPos(max, 'R'), mid = hl.clone().add(hr).multiplyScalar(0.5);
    tgram.position.set(mid.x, K.EIRE.y, mid.z); tgram.rotation.set(0, max.root.rotation.y, 0);
    K.setTelegram(tgram, mid.y - K.EIRE.y + 0.15, 0, 9 * easeOut(inv(T.telegram + 0.1, W.broke + 0.3, s)));
  }
  // cockpit: compass swing, drips, puddle, hole, clouds outside
  if (place0 === 'cockpit') {
    const ck = S.cockpit;
    ck.card.rotation.y = 0.6 * Math.sin(s * 2.3) + 0.35 * Math.sin(s * 5.1) + (s > W.twenty ? 0.5 * Math.sin(s * 9) : 0);
    const leakOn = SHOT === 'leak' || SHOT === 'screw';
    const hole = SHOT === 'screw' && s > T.screw + 0.75;
    ck.drips.forEach((d, i) => {
      d.visible = leakOn && !(SHOT === 'screw' && s > T.screw + 1.6);
      const ph = ((s * 1.6 + i / ck.drips.length) % 1); d.position.copy(ck.drip).add(V(0, -ph * (ck.drip.y - 0.1), 0));
    });
    const pk = SHOT === 'leak' ? smooth(inv(T.leak + 0.2, T.screw, s)) : SHOT === 'screw' ? 1 - smooth(inv(T.screw + 0.85, T.screw + 1.8, s)) : 0;
    ck.puddle.visible = pk > 0.02; ck.puddle.scale.setScalar(0.3 + 1.3 * pk);
    ck.hole.visible = hole;
    ck.outside.forEach((c) => { const h = c.userData.home; c.position.set(h.x, h.y, ((h.z - s * 30) % 60 + 60) % 60 - 30); });
  }
  // sky: clouds stream past the plane (it flies +z); the bank arrives at the "clouds" word
  if (place0 === 'sky') {
    const sk = S.sky;
    sk.clouds.forEach((c) => { const h = c.userData.home; c.position.set(h.x, h.y, ((h.z - s * 140 * c.userData.speed) % 900 + 900 + 450) % 900 - 450); });
    sk.wt.offset.set(0, -s * 0.05);
    sk.bank.position.set(0, 0, lerp(260, -10, smooth(inv(T.east + 0.4, W.clouds1 + 0.3, s))));
  }
  // sea: the liner sails toward New York (+z); punishment ends as it arrives
  // street: ticker tape
  if (place0 === 'street') { const c = carAt(s).sub(K.STREET); K.updateTape(S.street.tape, s, V(0, 0, c.z + 10), SHOT === 'parade' ? 1 : 0.8); }
  // flag ripple
  if (place0 === 'eire') S.eire.flag.children.forEach((p, i) => { p.rotation.y = 0.15 * Math.sin(s * 5 + i * 1.2); });
  if (place0 === 'ny') S.ny.sock.rotation.y = 0.2 * Math.sin(s * 2);

  // ---------- cameras ----------
  const pp = plane.position;
  switch (SHOT) {
    case 'hook': { look(stage, pp.clone().add(V(8.0 + 1.0 * u, 5.9, 10.0)), pp.clone().add(V(-0.4, 6.1, 0.9)), 48, 26); break; }
    case 'ireland': { look(stage, EI(0.5, 4.6, 29), pp.clone().add(V(4, 3.5, 0)).lerp(EI(-4.0, 4.5, 19.5), 0.4), 54, 50); break; }
    case 'ask': look(stage, OF(15.5, 6.2, 0.5), OF(0.4, 4.4, -3.1), 42, 16); break;
    case 'denied': look(stage, OF(5.0, 6.6, -0.6), OF(0.2, 3.4, -4.6), 46, 12); break;
    case 'patched': look(stage, NY(lerp(-41, -43, u), 15, 15), NY(-57, 4.0, -9), 50, 40); break;
    case 'plan': look(stage, OF(15.3, 5.8, -0.4), OF(0.4, 4.2, -3.1), 46, 16); break;
    case 'takeoff': look(stage, NY(-2, 3.2, 26), pp.clone().add(V(-6, 0, 0)), 52, 80); break;
    case 'east': { look(stage, SK(lerp(-17, -14, u), lerp(10, 9, u), lerp(-16, -12, u)), SK(0, 5.0, 4), 50, 40); break; }
    case 'radio': look(stage, CK(lerp(4.6, 4.2, u), 6.3, lerp(0.4, 0.8, u)), CK(0.3, 5.2, 3.0), 50, 10); break;
    case 'leak': look(stage, CK(4.6, 4.4, 4.6), CK(-0.6, 2.4, 0.6), 56, 12); break;
    case 'screw': look(stage, CK(5.6, 2.5, 3.9), CK(-0.7, 2.3, 0.9), 58, 10); break;
    case 'dublin': look(stage, EI(-13, 5.0, 22), EI(1.5, 4.0, 5), 50, 40); break;
    case 'whereami': look(stage, EI(11.2, 5.0, 15.6), EI(4.65, 4.5, 7.0), 46, 16); break;
    case 'excuse': look(stage, EI(lerp(8.6, 8.2, u), 4.9, lerp(12.0, 11.4, u)), EI(3.6, 4.6, 7.8), 42, 14); break;
    case 'telegram': look(stage, EI(lerp(13.5, 13.0, u), 6.0, lerp(18.0, 17.4, u)), EI(5.4, 3.0, 10.6), 48, 16); break;
    case 'ship': { const sh = S.sea.ship.position; look(stage, SE(26, 15, sh.z + 52), SE(1, 9.5, sh.z + 17), 46, 60); break; }
    case 'parade': { const c = carAt(s); look(stage, ST(0, lerp(30, 24, u), c.z - K.STREET.z + 40), ST(0, 3, c.z - K.STREET.z - 2), 50, 60); break; }
    case 'bigger': { const c = carAt(s); look(stage, ST(-7.5, 6.0, c.z - K.STREET.z + 19), ST(-0.5, 4.8, c.z - K.STREET.z - 3), 50, 30); break; }
    case 'name': look(stage, ST(2.0, 3.0, -16), ST(0, 13.5, -46), 54, 50); break;
    case 'admit': look(stage, ST(-0.6, 5.0, 23.5), ST(-0.4, 4.6, 12.0), 44, 16); break;
    case 'cta': look(stage, ST(-0.6, 5.0, 25), ST(-0.4, 5.6, 12.0), 46, 16); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  const cam = stage.camera;
  head2D = {};
  for (const [k, a] of Object.entries({ max, leo, mia })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
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
const out = (t, t1, d = 0.2) => 1 - clamp((t - (t1 - d)) / d);
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
  const bx = clamp(x - w / 2, 50, 1030 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  const tx = clamp(x, bx + 50, bx + w - 50);
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h - 3) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h) * s); g.stroke();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, (bx + w / 2) * s, (by + 30 + size * 0.56 + i * size * 1.12 + 4) * s));
  g.restore();
}
function stamp(g, s, text, x, y, k, color = '#e0262b', rot = -0.12, size = 120) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); const sc = 1 + 1.6 * (1 - Math.min(1, k)); g.scale(sc, sc); g.globalAlpha = Math.min(1, k * 1.4);
  g.font = `${size * s}px "Alfa Slab One"`; const w = g.measureText(text).width / s + 70, h = size * 1.45;
  g.lineWidth = 12 * s; g.strokeStyle = color; roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 18 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6 * s); g.restore();
}
// the route card: CALIFORNIA <- NEW YORK -> IRELAND, the little plane sliding the wrong way
function routeCard(g, s, t, t0, k) {
  if (k <= 0) return;
  g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
  roundRect(g, -470 * s, -120 * s, 940 * s, 240 * s, 34 * s); g.fillStyle = 'rgba(14,18,34,.86)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${40 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText('CALIFORNIA', -320 * s, -50 * s); g.fillStyle = '#ffffff'; g.fillText('NEW YORK', 0, -50 * s); g.fillStyle = '#7CFC9A'; g.fillText('IRELAND', 320 * s, -50 * s);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6 * s; g.setLineDash([16 * s, 14 * s]); g.beginPath(); g.moveTo(-420 * s, 30 * s); g.lineTo(420 * s, 30 * s); g.stroke(); g.setLineDash([]);
  for (const x of [-320, 0, 320]) { g.beginPath(); g.arc(x * s, 30 * s, 12 * s, 0, 7); g.fillStyle = '#ffffff'; g.fill(); }
  const px = lerp(0, 320, smooth(inv(t0 + 0.2, t0 + 2.2, t)));
  g.save(); g.translate(px * s, 30 * s); g.font = `${70 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(34 * s, 0); g.lineTo(-22 * s, -14 * s); g.lineTo(-22 * s, 14 * s); g.closePath(); g.fill(); g.fillRect(-10 * s, -34 * s, 14 * s, 68 * s); g.fillRect(-30 * s, -14 * s, 8 * s, 28 * s);
  g.restore(); g.restore();
}
// a big round compass whose needle spins (the excuse)
function compassCard(g, s, t, t0, k) {
  if (k <= 0) return;
  const cx = 540, cy = 520, r = 170;
  g.save(); g.translate(cx * s, cy * s); g.scale(k, k);
  g.beginPath(); g.arc(0, 0, (r + 22) * s, 0, 7); g.fillStyle = '#b8893a'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#16141f'; g.stroke();
  g.beginPath(); g.arc(0, 0, r * s, 0, 7); g.fillStyle = '#f2ead6'; g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${54 * s}px "Luckiest Guy"`;
  [['N', 0, -1, '#c0392b'], ['E', 1, 0, '#16141f'], ['S', 0, 1, '#16141f'], ['W', -1, 0, '#16141f']].forEach(([l, x, y, c]) => { g.fillStyle = c; g.fillText(l, x * (r - 40) * s, y * (r - 40) * s + 4 * s); });
  const a = (t - t0) * 9 + 1.6 * Math.sin((t - t0) * 4);
  g.rotate(a); g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(0, -(r - 70) * s); g.lineTo(18 * s, 0); g.lineTo(-18 * s, 0); g.closePath(); g.fill();
  g.fillStyle = '#2b3550'; g.beginPath(); g.moveTo(0, (r - 70) * s); g.lineTo(18 * s, 0); g.lineTo(-18 * s, 0); g.closePath(); g.fill();
  g.beginPath(); g.arc(0, 0, 14 * s, 0, 7); g.fillStyle = '#16141f'; g.fill();
  g.restore();
}
const DATES = [[0, T.ire, 'NEW YORK · JULY 17, 1938'], [T.ire, T.ask, '28 HOURS LATER'], [T.takeoff, T.east, 'DAWN · 5:15 A.M.'], [T.dublin, T.whereami, 'DUBLIN, IRELAND · JULY 18']];
function dateTag(g, s, t) {
  for (const [a, b, text] of DATES) {
    if (t < a || t >= b) continue;
    const k = (a === 0 ? 1 : pop(t, a, 0.2, 1.8)) * out(t, b, 0.12);
    g.save(); g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60;
    g.translate((60 + w / 2) * s, 270 * s); g.scale(k, k);
    roundRect(g, -w / 2 * s, -42 * s, w * s, 84 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
  }
}
export function overlay(g, s, t) {
  // white-out as he flies into the cloud bank (end of 'east'), clearing in the cockpit
  if (SHOT === 'east') { const w = smooth(inv(W.clouds1 - 0.1, T.radio, t)); if (w > 0) { g.save(); g.globalAlpha = 0.85 * w; g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); } }
  dateTag(g, s, t);
  if (SHOT === 'hook') {
    pill(g, s, 'FLIGHT PLAN: CALIFORNIA', 540, 420, 1, '#ffd23f', 'rgba(14,18,34,.85)', 50);
  }
  if (SHOT === 'ireland' && t > W.ireland - 0.1) bigText(g, s, 'IRELAND?!', 540, 470, 170, '#7CFC9A', pop(t, W.ireland - 0.1), -0.05);
  if (SHOT === 'ask' && head2D.max) bubble(g, s, ['CAN I FLY', 'THE ATLANTIC?'], head2D.max[0], head2D.max[1] - 80, pop(t, T.ask + 0.05, 0.2, 2) * out(t, T.denied, 0.1), 56);
  if (SHOT === 'denied' && t > W.no1 - 0.05) stamp(g, s, 'DENIED', 540, 470, clamp((t - W.no1 + 0.05) / 0.18), '#e0262b', -0.1, 130);
  if (SHOT === 'patched') {
    if (t > W.old - 0.15) bigText(g, s, 'TOO OLD', 540, 400, 120, '#ffffff', pop(t, W.old - 0.15), -0.04);
    if (t > W.patched - 0.15) bigText(g, s, 'TOO PATCHED UP', 540, 540, 96, '#ffd23f', pop(t, W.patched - 0.15), 0.03);
  }
  if (SHOT === 'plan') {
    pill(g, s, 'FLIGHT PLAN: CALIFORNIA', 540, 420, pop(t, W.flight - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 50);
    if (miaAtStamp(t)) stamp(g, s, 'APPROVED', 540, 600, clamp((t - (W.california2 - 0.02)) / 0.18), '#2fbf5a', -0.1, 110);
  }
  if (SHOT === 'takeoff' && t > W.took) { bigText(g, s, 'CALIFORNIA', 300, 1530, 64, '#ffd23f', pop(t, W.took), 0); bigText(g, s, '<<<', 300, 1610, 64, '#ffd23f', pop(t, W.took), 0); }
  if (SHOT === 'east') { routeCard(g, s, t, T.east, pop(t, T.east, 0.2, 1.8) * out(t, W.clouds1 + 0.2, 0.15)); if (t > W.east - 0.1) bigText(g, s, 'EAST!', 540, 720, 130, '#7CFC9A', pop(t, W.east - 0.1) * out(t, W.clouds1 + 0.2, 0.15), -0.05); }
  if (SHOT === 'radio') {
    if (t > W.radio - 0.15) bigText(g, s, 'NO RADIO', 540, 420, 120, '#ff6b6b', pop(t, W.radio - 0.15), -0.04);
    if (t > W.twenty - 0.1) pill(g, s, '20-YEAR-OLD COMPASS', 540, 580, pop(t, W.twenty - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 50);
  }
  if (SHOT === 'leak' && t > W.fuel - 0.1) bigText(g, s, 'FUEL LEAK!', 540, 440, 130, '#ff6b6b', pop(t, W.fuel - 0.1), -0.04);
  if (SHOT === 'screw' && t > W.screwdriver - 0.1) pill(g, s, 'A HOLE IN THE FLOOR', 540, 440, pop(t, W.screwdriver - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 52);
  if (SHOT === 'whereami' && head2D.max) bubble(g, s, ['JUST GOT IN FROM', 'NEW YORK.', 'WHERE AM I?'], head2D.max[0] - 40, Math.min(head2D.max[1] - 90, 760), pop(t, T.whereami + 0.05, 0.2, 2), 56);
  if (SHOT === 'excuse') { compassCard(g, s, t, T.excuse, pop(t, W.clouds2 - 0.1, 0.25, 1.8)); if (t > W.compass2 - 0.1) bigText(g, s, '"MY COMPASS!"', 540, 790, 96, '#ffd23f', pop(t, W.compass2 - 0.1), -0.04); }
  if (SHOT === 'telegram') {
    const n = Math.round(lerp(0, 600, smooth(inv(W.sent, W.broke, t))));
    pill(g, s, `${n} WORDS`, 540, 420, pop(t, W.sent - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 60);
    if (t > W.rules - 0.1) bigText(g, s, 'RULES BROKEN', 540, 580, 104, '#ff6b6b', pop(t, W.rules - 0.1), -0.04);
  }
  if (SHOT === 'ship') {
    if (t > W.flying2 - 0.15) stamp(g, s, 'NO FLYING', 540, 440, clamp((t - W.flying2 + 0.15) / 0.18) * out(t, W.home - 0.05, 0.15), '#e0262b', -0.1, 110);
    if (t > W.until - 0.1) { const d = Math.min(14, 1 + Math.floor(13 * inv(W.until, W.home - 0.1, t))); pill(g, s, `DAY ${d} OF 14`, 540, 610, pop(t, W.until - 0.1) * out(t, W.home - 0.05, 0.12), '#ffffff', 'rgba(14,18,34,.85)', 54); }
    if (t > W.home - 0.1) bigText(g, s, 'PUNISHMENT OVER!', 540, 470, 96, '#7CFC9A', pop(t, W.home - 0.1), -0.04);
  }
  if (SHOT === 'parade' && t > W.parade - 0.15) bigText(g, s, 'TICKER-TAPE PARADE', 540, 440, 88, '#ffd23f', pop(t, W.parade - 0.15), -0.03);
  if (SHOT === 'bigger') { bigText(g, s, 'BIGGER THAN', 540, 400, 100, '#ffffff', pop(t, T.bigger + 0.05), -0.03); bigText(g, s, "LINDBERGH'S", 540, 530, 120, '#ffd23f', pop(t, W.lindberghs - 0.1), -0.03); }
  if (SHOT === 'name' && t > W.wrong - 0.1) pill(g, s, '"WRONG WAY" CORRIGAN', 540, 440, pop(t, W.wrong - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 56);
  if (SHOT === 'admit') {
    if (head2D.mia && t < W.never + 0.6) bubble(g, s, ['DID YOU MEAN TO?'], head2D.mia[0], Math.min(head2D.mia[1] - 70, 760), pop(t, T.admit + 0.05, 0.2, 2) * out(t, W.never + 0.6, 0.12), 56);
    if (t > W.admitted - 0.1) { bigText(g, s, 'HE NEVER', 540, 400, 110, '#ffffff', pop(t, W.admitted - 0.1), -0.03); bigText(g, s, 'ADMITTED IT', 540, 530, 120, '#ffd23f', pop(t, W.thing - 0.1), -0.03); }
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
const miaAtStamp = (t) => t > W.california2 - 0.02;

export const cast = () => ({ max, leo, mia, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
