// Every Lie Comes True. Web renderer + Roblox R6 pack. Whatever Leo lies about comes true: a dragon eats his homework
// (and the teacher's desk), he's the fastest kid in school, cash pours out of his backpack, Mia waves. Then he crashes
// Max's new bike and blurts "I've never seen you before": Max forgets him. "You're my best friend" brings Max back, but
// Max asks who broke the bike; Leo nearly blames a dragon (one lands on the roof), tells the truth and pays up.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Lip sync: web/lipsync.js (source/lipsync.py).
import * as THREE from 'three';
import { puff, rng } from '../../../web/lib/world.js';
import { clamp, lerp, inv, smooth, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { loadCreature, poseCreature, creaturePoint } from '../../../web/lib/creature.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { W } from './beats.js';
import { LIPS } from './lipsync.js';
import { FY, ROOF, classroom, school, yard, bike, setBike, backpack, cash, cashStack, makeTalkingFace } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 1.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Every Lie Comes True' };
export const sky = { zenith: '#3f7fe0', horizon: '#cfe8ff', below: '#e9f4ff', fog: '#dcecff', sunDir: new THREE.Vector3(0.45, 0.62, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p);
const head = (a, b) => Math.atan2(b[0] - a[0], b[2] - a[2]);
const lipAt = (t) => LIPS[Math.floor(t * 30 + 1e-6)] || '-';

// ---------- key times ----------
const T = {
  cold: W.so1 - 0.12,                                    // cold open ends (rewind into the story)
  ask: W.teacher - 0.1, lie1: W.dragon1 - 0.12, true1: W.ate + 0.45,
  boom: W.explodes - 0.04, hw: W.homework2 - 0.05, dsk: W.desk + 0.05,
  track: W.im - 0.35, true2: W.school + 0.45, zoom: W.now1 - 0.1,
  cashShot: W.ive - 0.3, true3: W.dollars1 + 0.35,
  miaShot: W.mia - 0.3, true4: W.cool + 0.3, wave: W.waves - 0.05,
  bike: W.then2 - 0.25, crash: W.tree - 0.02,
  forget: W.stops - 0.2, remember: W.now3 - 0.12, hug: W.hugs - 0.05,
  see: W.sees - 0.1, land: W.lands + 0.05, shut: W.shuts - 0.05, truth: W.iDid - 0.05,
  give: W.dollars2 + 0.15, cta: W.follow - 0.15,
};
// The cold open shows the dragon chewing the teacher's desk, then rewinds into the story.
const COLD_STORY = T.dsk + 0.75, REW = 0.4;
function story(t) {
  if (t >= T.cold) return t;
  const hold = (x) => Math.min(COLD_STORY + x * 0.3, T.track - 0.05);
  if (t < T.cold - REW) return hold(t);
  const u = inv(T.cold - REW, T.cold, t), from = hold(T.cold - REW);
  return lerp(from, W.so1 - 0.3, easeIn(u));
}
const INSIDE = (st) => st < T.track;

// ---------- places ----------
const SEAT = { Leo: [-3, -4.6], Max: [-3, -0.6], Skye: [-3, 3.4], Mia: [3, -4.6] };
const sitAt = (n) => [SEAT[n][0] + 1.55, FY, SEAT[n][1]];
const TEACH = [-9.4, FY, -0.4];
const TRACK0 = { Leo: [-31, 0, 42.5], Max: [-31, 0, 45.0], Skye: [-31, 0, 47.5] }, FINISH = 60;
const LEO_CASH = [0, 0, 32], MIA_YARD = [-5, 0, 35];
const TREE = [13, 0, 21.6], BIKE_HIT = [9.65, 0, 21.6], RIDE0 = [-40, 0, 21.6];
const LEO_C = [9.4, 0, 23.4], MAX_C = [5.4, 0, 23.9], MAX_RACK = [-8, 0, 17.5];
const LEO_HUG = [9.0, 0, 23.6], MAX_HUG = [6.6, 0, 22.6];
// The hug: square on, 1.3 apart (Max faces +x, Leo -x), seen from the side (+z). Criss-cross arms so the blocky R6
// arms interlock instead of colliding: each has his left arm high over the other's shoulder (40 degrees up) and his
// right arm low round the waist (35 down). Heads turn to the camera, cheek to cheek; the pair sways as one.
// Max steps back to MAX_HUG when he lets go, so everything after the hug is unchanged.
const MAX_IN = [LEO_HUG[0] - 1.3, 0, LEO_HUG[2]], HUG_MID = V(LEO_HUG[0] - 0.65, 0, LEO_HUG[2]);
const hugSway = (s) => 0.06 * Math.sin((s - T.hug) * 5.5), HUG_ROLL = -0.2;   // sideways lean: heads past each other
const swayed = (p, a) => VA(p).sub(HUG_MID).applyAxisAngle(V(0, 1, 0), a).add(HUG_MID);
const ROOFSPOT = [-3, ROOF + 1.1, -3.5];
// Where the dragon's jaw tip goes for the two bites (homework on Leo's desk, the teacher's desk top).
const HW_AT = V(-3.3, FY + 3.25, -4.6), TD_TOP = V(-8.2, FY + 3.0, -5.0);
const HOVER_HW = HW_AT.clone().add(V(0.2, 2.4, -1.4)), BITE_HW = HW_AT.clone().add(V(0, 0.3, -0.15)), PULL_HW = HW_AT.clone().add(V(0.4, 4.2, -3.2));
const HOVER_TD = TD_TOP.clone().add(V(0.3, 2.6, -1.6)), BITE_TD = TD_TOP.clone().add(V(0, 0.25, 0));

// ---------- scene ----------
let A = {}, leo, max, mia, skye, noob, dragon, dragonRig, room, sch, yd, bk, bills, stack, pack, cam, SHOT = 'cold', talk = {}, dust = [], leaves = [];
const FACES = {
  Leo: ['smug', 'happy', 'cool', 'laugh', 'shocked', 'nervous', 'scared', 'dizzy', 'determined', 'scheming', 'sad', 'neutral', 'surprised', 'love', 'squeezed'],
  Max: ['happy', 'neutral', 'angry', 'shocked', 'confused', 'suspicious', 'annoyed', 'laugh', 'surprised', 'determined', 'scared', 'sad'],
  Mia: ['neutral', 'love', 'happy', 'surprised'],
  Skye: ['neutral', 'shocked', 'surprised', 'happy'],
  Noob: ['annoyed', 'neutral', 'shocked', 'scared', 'surprised'],
};

export async function setup(stage) {
  const { scene } = stage;
  stage.renderer.toneMappingExposure = 1.0;
  [leo, max, mia, skye, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Skye', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: FACES[n], hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, skye.root, noob.root);
  for (const n of ['idle', 'run', 'walk', 'sit', 'proud', 'laugh_big', 'shock', 'look_up', 'dizzy', 'talk', 'point_forward', 'shrug']) A[n] = await loadAnimation(n);
  talk.Leo = await makeTalkingFace(leo, FACES.Leo); talk.Max = await makeTalkingFace(max, FACES.Max);
  pack = backpack(leo);

  room = classroom(scene); sch = school(scene); yd = yard(scene);
  dragon = await loadCreature('saber_tooth_wyvern'); dragon.root.rotation.y = -Math.PI / 2; dragon.root.scale.setScalar(0.85);
  dragonRig = new THREE.Group(); dragonRig.add(dragon.root); scene.add(dragonRig);
  bk = bike(); scene.add(bk);
  bills = cash(170); scene.add(bills);
  stack = cashStack(); scene.add(stack);
  const r = rng(77);
  for (let i = 0; i < 14; i++) { const p = puff(); p.material = p.material.clone(); p.userData.d = [(r() - 0.5) * 2, r(), (r() - 0.5) * 2, 0.6 + r() * 0.8]; scene.add(p); dust.push(p); }
  for (let i = 0; i < 16; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: i % 2 ? '#3f9a4a' : '#5fbf5a', roughness: 0.8 })); l.userData.d = [(r() - 0.5) * 5, 9 + r() * 4, (r() - 0.5) * 5, r() * 6, 0.6 + r() * 0.6]; l.castShadow = true; scene.add(l); leaves.push(l); }
}

// ---------- actor states (story time s) ----------
// s: { pos, heading, layers, face, mouth (lip code), y (absolute root height, skips grounding), roll, pitch, yaw, lie
//      (lying on the back, 0..1), arms: [[side, up, fwd]], wave, visible, lean }
const base = (pos, heading, face) => ({ pos, heading, layers: [['idle', 0]], face, arms: [], visible: true });
const SPEAK = {
  Leo: [[W.dragon1 - 0.12, W.window - 0.25], [W.im - 0.12, W.now1 - 0.12], [W.ive - 0.12, W.pours - 0.4], [W.mia - 0.12, W.she - 0.12],
    [W.dude - 0.12, W.stops - 0.25], [W.youre1 - 0.12, W.wasnt - 0.2], [W.dragon3 - 0.12, W.something - 0.2], [W.iDid - 0.12, W.then4 - 0.2], [W.fine - 0.12, W.two - 0.2]],
  Max: [[W.did1 - 0.12, W.panics - 0.2], [W.sorry - 0.12, W.lies2 - 0.2], [W.bro - 0.12, W.almost - 0.2], [W.then4 - 0.12, W.fine - 0.2]],
};
const speaking = (who, s) => SPEAK[who].some(([a, b]) => s >= a && s < b);

function along(from, to, t0, s, speed) {
  const a = VA(from), b = VA(to), d = a.distanceTo(b), u = clamp((s - t0) * speed / Math.max(d, 1e-3));
  return { pos: a.clone().lerp(b, u), moving: u > 0 && u < 1, done: u >= 1, heading: Math.atan2(b.x - a.x, b.z - a.z), anim: (u * d) / STRIDE, arrive: t0 + d / speed };
}
const RIDE_V = 17, RIDE_T0 = () => T.crash - VA(RIDE0).distanceTo(VA(BIKE_HIT)) / RIDE_V;

function leoAt(s) {
  if (INSIDE(s)) {
    const x = { ...base(sitAt('Leo'), -Math.PI / 2, 'smug'), layers: [['sit', 0.5]], y: FY + 0.32 };
    if (s >= W.teacher) x.face = 'smug';
    if (s >= T.lie1) x.face = 'cool';
    if (s >= T.true1) x.face = 'smug';
    if (s >= T.boom - 0.1) { x.face = 'shocked'; x.yaw = 0.9 * smooth(inv(T.boom - 0.1, T.boom + 0.15, s)); x.lean = -0.12 * smooth(inv(T.boom - 0.1, T.boom + 0.2, s)); }
    if (s >= T.boom + 0.9) { x.face = 'laugh'; x.yaw = 0.7; }
    if (s >= T.hw - 0.4) { x.face = 'shocked'; x.lean = -0.25; x.yaw = 0.4; }
    if (s >= T.hw + 0.6) { x.face = 'smug'; x.lean = 0; x.yaw = -0.5; }
    if (s >= T.dsk + 0.3) { x.face = 'laugh'; x.yaw = -0.6; }
    return x;
  }
  if (s < T.cashShot) {                                    // the race
    const x = base(TRACK0.Leo, Math.PI / 2, 'cool');
    if (s >= T.true2 - 0.1) x.face = 'determined';
    if (s >= T.zoom) {
      const m = along(TRACK0.Leo, [FINISH, 0, 42.5], T.zoom, s, 130);
      x.pos = m.pos; x.layers = m.moving ? [['run', m.anim * 0.35]] : [['proud', s - m.arrive, 1, false]]; x.face = m.moving ? 'determined' : 'smug';
      x.lean = m.moving ? 0.35 : 0;
    }
    return x;
  }
  if (s < T.bike) {                                        // cash, then Mia
    const x = base(LEO_CASH, 0, 'smug');
    if (s >= T.true3) { x.face = 'laugh'; x.layers = [['laugh_big', s - T.true3]]; }
    if (s >= T.miaShot) { x.heading = head(LEO_CASH, MIA_YARD); x.face = 'smug'; x.layers = [['idle', s]]; }
    if (s >= T.true4) x.face = 'cool';
    if (s >= T.wave + 0.2) x.face = 'love';
    return x;
  }
  // the bike, the crash and the talk by the tree
  const t0 = RIDE_T0();
  if (s < T.crash) {
    const m = along(RIDE0, BIKE_HIT, t0, s, RIDE_V);
    const x = base(m.pos.clone().add(V(0, 0, 0)), Math.PI / 2, 'laugh');
    x.ride = m.pos.distanceTo(VA(RIDE0)); x.layers = [['idle', 0]]; x.y = 1.05;
    if (s > T.crash - 0.45) x.face = 'shocked';
    return x;
  }
  const x = base(LEO_C, -Math.PI / 2, 'dizzy');
  const k = s - T.crash;
  if (k < 0.75) {                                          // over the bars into the trunk, slide down
    const fly = clamp(k / 0.18);
    x.pos = V(lerp(BIKE_HIT[0] + 0.2, TREE[0] - 1.25, easeOut(fly)), 0, TREE[2]); x.heading = Math.PI / 2;
    x.y = lerp(1.6, 0.6, smooth(inv(0.2, 0.75, k))) + 1.4 * Math.sin(Math.PI * fly) * 0.3;
    x.face = 'squeezed'; x.arms = [['L', 1.2, -0.6], ['R', 1.2, -0.6]];
    return x;
  }
  if (s < W.panics - 0.55) {                               // flat on his back, dizzy
    x.pos = V(TREE[0] - 2.1, 0, TREE[2] + 0.4); x.heading = Math.PI / 2; x.lie = smooth(inv(0.75, 1.05, k)); x.face = 'dizzy';
    return x;
  }
  if (s < W.panics) {                                      // scrambles up
    const u = smooth(inv(W.panics - 0.55, W.panics - 0.1, s));
    x.pos = V(lerp(TREE[0] - 2.1, LEO_C[0], u), 0, lerp(TREE[2] + 0.4, LEO_C[2], u)); x.heading = lerp(Math.PI / 2, -Math.PI / 2 + 0.55, u); x.lie = 1 - u; x.face = 'nervous';
    return x;
  }
  x.heading = -Math.PI / 2 + 0.55; x.face = 'nervous'; x.layers = [['idle', s]];
  if (s >= W.dude - 0.1) x.face = 'nervous';
  if (s >= T.forget + 0.3) x.face = 'shocked';
  if (s >= W.sorry + 0.4) x.face = 'sad';
  if (s >= W.lies2 - 0.1) x.face = 'determined';
  if (s >= T.remember + 0.15) x.face = 'happy';
  if (s >= T.hug - 0.25) {                                   // turns square to Max and hugs him back
    const u = smooth(inv(T.hug - 0.25, T.hug + 0.15, s)), arms = smooth(inv(T.hug - 0.05, T.hug + 0.35, s)), sw = hugSway(s) * arms;
    x.pos = swayed(VA(LEO_C).lerp(VA(LEO_HUG), u), sw); x.heading = lerp(-Math.PI / 2 + 0.55, -Math.PI / 2, u) + sw; x.face = 'laugh';
    x.hugPose = arms; x.yaw = -0.55 * arms; x.roll = HUG_ROLL * arms;
  }
  if (s >= T.see) {
    const r = smooth(inv(T.see, T.see + 0.45, s)), held = 1 - smooth(inv(T.see, T.see + 0.25, s)); x.face = 'nervous'; x.pos = VA(LEO_HUG);
    x.hugPose = held; x.yaw = -0.55 * held; x.roll = HUG_ROLL * held;
    x.heading = lerp(-Math.PI / 2, 0.25, r) - 0.9 * smooth(inv(T.see + 0.3, T.see + 0.6, s));
  }
  if (s >= W.almost - 0.1) { x.face = 'scheming'; x.heading = -0.85; }
  if (s >= T.land) { x.face = 'scared'; x.pitch = -0.45 * smooth(inv(T.land, T.land + 0.25, s)); x.layers = [['shock', s - T.land, 1, false]]; }
  if (s >= T.shut) { x.face = 'squeezed'; x.mouthShut = true; x.pitch = -0.2 * (1 - smooth(inv(T.shut + 0.2, T.shut + 0.6, s))); x.layers = [['idle', s]]; }
  if (s >= W.first - 0.1) { x.face = 'sad'; x.mouthShut = false; }
  if (s >= W.then4) x.face = 'nervous';
  if (s >= W.fine - 0.1) x.face = 'neutral';
  if (s >= W.million2 - 0.2) x.cash = 'hand';
  if (s >= T.give) x.cash = 'give';
  if (s >= T.give + 0.5) { x.cash = null; x.face = 'smug'; }
  if (s >= W.two - 0.1) { x.face = 'happy'; x.layers = [['proud', s - W.two + 0.1, 1, false]]; }
  if (s >= W.record - 0.1) x.face = 'laugh';
  return x;
}

function maxAt(s) {
  if (INSIDE(s)) {
    const x = { ...base(sitAt('Max'), -Math.PI / 2, 'neutral'), layers: [['sit', 0.9]], y: FY + 0.32 };
    if (s >= T.lie1 + 0.2) { x.face = 'suspicious'; x.yaw = 0.5; }
    if (s >= T.boom) { x.face = 'shocked'; x.yaw = 1.0; x.lean = -0.2; }
    if (s >= T.dsk - 0.3) { x.face = 'scared'; x.yaw = 0.6; }
    return x;
  }
  if (s < T.cashShot) {
    const x = base(TRACK0.Max, Math.PI / 2, 'determined');
    if (s >= T.zoom + 0.1) { x.face = 'shocked'; x.layers = [['shock', s - T.zoom - 0.1, 1, false]]; x.heading = Math.PI / 2 + 0.2; }
    return x;
  }
  if (s < T.bike) return { ...base(MAX_RACK, 0, 'neutral'), visible: false };
  if (s < T.crash + 0.35) {                                 // waiting by the bike rack, waves him off
    const x = base(MAX_RACK, head(MAX_RACK, [0, 0, 22]), 'happy');
    if (s >= T.crash - 0.5) x.face = 'shocked';
    x.wave = s < RIDE_T0() + 0.9;
    return x;
  }
  const m = along(MAX_RACK, MAX_C, T.crash + 0.35, s, 16);
  const x = base(m.pos, m.moving ? m.heading : Math.PI / 2 - 0.55, 'angry');
  x.layers = m.moving ? [['run', m.anim]] : [['idle', s + 0.3]];
  if (s >= W.did1 - 0.1) x.face = 'angry';
  if (s >= T.forget) { x.face = 'neutral'; x.pitch = 0.05; }
  if (s >= W.stares) x.face = 'confused';
  if (s >= W.sorry - 0.1) x.face = 'neutral';
  if (s >= T.remember) x.face = 'surprised';
  if (s >= W.grins - 0.1) x.face = 'laugh';
  if (s >= T.hug - 0.25) {                                   // walks in and hugs him: left arm over the shoulder, right round the waist
    const u = smooth(inv(T.hug - 0.25, T.hug + 0.2, s)), arms = smooth(inv(T.hug - 0.1, T.hug + 0.3, s)), sw = hugSway(s) * arms;
    const d = Math.hypot(MAX_IN[0] - MAX_C[0], MAX_IN[2] - MAX_C[2]);
    x.pos = swayed(VA(MAX_C).lerp(VA(MAX_IN), u), sw); x.heading = lerp(Math.PI / 2 - 0.55, Math.PI / 2, u) + sw;
    x.hugPose = arms; x.yaw = 0.4 * arms; x.roll = HUG_ROLL * 0.75 * arms;
    x.layers = u < 1 ? [['walk', u * d / STRIDE * 1.2]] : [['idle', s]];
  }
  if (s >= T.see) {                                          // lets go, steps back and turns to the bike
    const u = smooth(inv(T.see, T.see + 0.3, s)), back = smooth(inv(T.see + 0.05, T.see + 0.45, s)), held = 1 - smooth(inv(T.see, T.see + 0.22, s)); x.face = 'shocked';
    x.hugPose = held; x.yaw = 0.4 * held; x.roll = HUG_ROLL * 0.75 * held;
    x.heading = lerp(Math.PI / 2, head(MAX_HUG, BIKE_HIT), u); x.pos = VA(MAX_IN).lerp(VA(MAX_HUG), back);
    x.layers = back > 0 && back < 1 ? [['walk', back * 1.5 / STRIDE]] : [['idle', s]];
  }
  if (s >= W.bro - 0.15) { const u = smooth(inv(W.bro - 0.15, W.bro + 0.15, s)); x.heading = lerp(head(MAX_HUG, BIKE_HIT), Math.PI / 2 - 0.2, u); x.face = 'suspicious'; }
  if (s >= T.land) { x.face = 'scared'; x.pitch = -0.45 * smooth(inv(T.land, T.land + 0.25, s)); x.heading = Math.PI / 2 - 0.6; x.layers = [['shock', s - T.land, 1, false]]; }
  if (s >= T.shut + 0.2) { x.pitch = 0; x.face = 'suspicious'; x.heading = Math.PI / 2 - 0.1; x.layers = [['idle', s]]; }
  if (s >= W.iDid + 0.2) x.face = 'annoyed';
  if (s >= W.then4 - 0.05) { x.face = 'annoyed'; x.palm = smooth(inv(W.then4, W.then4 + 0.3, s)); }
  if (s >= T.give + 0.35) { x.palm = 0; x.cash = true; x.face = 'surprised'; }
  if (s >= W.two) { x.face = 'happy'; }
  if (s >= W.record) x.face = 'laugh';
  return x;
}

function miaAt(s) {
  if (INSIDE(s)) {
    const x = { ...base(sitAt('Mia'), -Math.PI / 2, 'neutral'), layers: [['sit', 1.3]], y: FY + 0.32 };
    if (s >= T.boom) x.face = 'surprised';
    return x;
  }
  if (s >= T.miaShot && s < T.bike) {
    const x = base(MIA_YARD, head(MIA_YARD, [-20, 0, 50]), 'neutral');
    if (s >= T.true4) { const u = smooth(inv(T.true4, T.true4 + 0.35, s)); x.heading = lerp(x.heading, head(MIA_YARD, LEO_CASH), u); x.face = 'love'; }
    x.wave = s >= T.wave;
    return x;
  }
  return { ...base(MIA_YARD, 0, 'neutral'), visible: false };
}
function skyeAt(s) {
  if (INSIDE(s)) {
    const x = { ...base(sitAt('Skye'), -Math.PI / 2, 'neutral'), layers: [['sit', 1.7]], y: FY + 0.32 };
    if (s >= T.boom) { x.face = 'shocked'; x.yaw = 0.8; }
    return x;
  }
  if (s < T.cashShot) {
    const x = base(TRACK0.Skye, Math.PI / 2, 'happy');
    if (s >= T.zoom + 0.1) { x.face = 'shocked'; x.layers = [['shock', s - T.zoom - 0.05, 1, false]]; }
    return x;
  }
  return { ...base(TRACK0.Skye, 0, 'neutral'), visible: false };
}
function noobAt(s) {
  if (!INSIDE(s)) return { ...base(TEACH, 0, 'neutral'), visible: false };
  const x = base(TEACH, head(TEACH, [SEAT.Leo[0], 0, SEAT.Leo[1]]), 'annoyed');
  x.layers = [['idle', s]];
  if (s >= T.ask - 0.1 && s < T.boom) x.arms = [['R', 0.25, -1.35]];          // hand out: "homework?"
  if (s >= T.lie1 + 0.5) x.face = 'annoyed';
  if (s >= T.boom) { x.face = 'shocked'; x.layers = [['shock', s - T.boom, 1, false]]; x.heading = head(TEACH, [-3, 0, -8]); }
  if (s >= T.dsk - 0.5) { x.face = 'scared'; const u = smooth(inv(T.dsk - 0.5, T.dsk, s)); x.pos = VA(TEACH).add(V(0, 0, 2.2 * u)); x.lean = -0.15 * u; }
  return x;
}

// ---------- the dragon ----------
const hinge = (a, h) => { const R = new THREE.Matrix4().makeRotationX(a), v = V(...h), w = v.clone().applyMatrix4(R); return { r: [a, 0, 0], p: v.sub(w).toArray() }; };
function dragonAt(s) {
  // { pos, yaw, pitch, open (0..1), visible }
  if (INSIDE(s)) {
    const d = { pos: V(-3, 2.6, -46), yaw: 0, pitch: 0, open: 0, visible: s >= T.true1 };
    if (s < T.boom) { d.pos.z = lerp(-60, -19.6, easeIn(inv(T.boom - 0.9, T.boom, s))); return d; }
    const k = s - T.boom;
    d.pos.set(-3, 2.6, lerp(-19.6, -20.6, smooth(inv(0, 0.5, k))));
    d.open = 0.9 * Math.sin(Math.PI * clamp((k - 0.05) / 0.9));                   // roar
    // The bites: the jaw tip is aimed at a point (placeDragon moves the whole rig so the tip lands there), nose down,
    // so the head stays above the desks: hover with the mouth open, strike down, snap shut, pull back up chewing.
    if (s >= T.hw - 0.6) {                                                         // homework: off Leo's desk
      const w = smooth(inv(T.hw - 0.6, T.hw - 0.3, s)), hit = smooth(inv(T.hw - 0.24, T.hw - 0.03, s)), back = smooth(inv(T.hw + 0.05, T.hw + 0.7, s));
      d.aim = HOVER_HW.clone().lerp(BITE_HW, hit).lerp(PULL_HW, back); d.aimW = w;
      d.pitch = 0.32 * w * (1 - back) + 0.16 * back;
      d.open = s < T.hw ? lerp(d.open, 1.0, smooth(inv(T.hw - 0.55, T.hw - 0.3, s))) * (1 - smooth(inv(T.hw - 0.07, T.hw, s)))
        : 0.2 * Math.max(0, Math.sin((s - T.hw) * 15)) * (s < T.hw + 0.9 ? 1 : 0);
    }
    if (s >= T.dsk - 0.75) {                                                       // the teacher's desk: bite the top, rip it up, shake
      const go = smooth(inv(T.dsk - 0.75, T.dsk - 0.32, s)), hit = smooth(inv(T.dsk - 0.3, T.dsk - 0.03, s)), up = smooth(inv(T.dsk + 0.08, T.dsk + 0.6, s));
      d.aim = PULL_HW.clone().lerp(HOVER_TD, go).lerp(BITE_TD, hit).add(V(0, 2.6 * up, -1.3 * up)); d.aimW = 1;
      if (s > T.dsk) d.aim.add(V(0.35 * Math.sin((s - T.dsk) * 19) * Math.exp(-(s - T.dsk) * 1.2), 0.15 * Math.sin((s - T.dsk) * 23), 0));
      d.pitch = lerp(0.16, 0.36, go) - 0.22 * up;
      d.open = s < T.dsk ? 1.0 * smooth(inv(T.dsk - 0.62, T.dsk - 0.3, s)) * (1 - smooth(inv(T.dsk - 0.06, T.dsk, s))) * 0.9 + 0.1 * (1 - go)
        : 0.12 + 0.06 * Math.sin((s - T.dsk) * 11);                                   // jaws clamped on the desk top
    }
    return d;
  }
  const d = { pos: V(...ROOFSPOT), yaw: 0.55, pitch: 0.25, scale: 1.15, open: 0, visible: s >= T.land - 1.6 && s < 1e9 };
  if (s < T.land) {                                                               // glides in from the north-west, high
    const u = inv(T.land - 1.6, T.land, s), e = easeOut(u);
    d.pos.set(lerp(-70, ROOFSPOT[0], e), lerp(60, ROOF, easeInOut(u)), lerp(-60, ROOFSPOT[2], e)); d.yaw = lerp(1.3, 0.55, e); d.pitch = lerp(-0.1, 0.25, smooth(u));
    return d;
  }
  const k = s - T.land;
  d.pos.y = ROOFSPOT[1] - 0.5 * Math.sin(Math.PI * clamp(k / 0.3)) * (k < 0.3 ? 1 : 0);
  d.open = k < 1.0 ? 0.6 * Math.sin(Math.PI * clamp(k / 1.0)) : 0.35 + 0.15 * Math.sin((s - T.land) * 3);   // hungry
  if (s >= T.truth + 0.4) { const u = smooth(inv(T.truth + 0.4, T.truth + 1.2, s)); d.open = lerp(d.open, 0, u); d.pitch = lerp(0.25, 0.05, u); d.yaw = 0.55 + 0.6 * u; }
  return d;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), box3 = new THREE.Box3();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
function place(a, x, tNow) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0); a.root.scale.setScalar(1);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [side, up, fwd] of x.arms) setArm(a, side, up, fwd);
  if (x.wave) waveArm(a, tNow, 'R');
  if (x.palm) setArm(a, 'R', 0.15 * x.palm, -1.35 * x.palm);
  if (x.hugPose > 0) {                                        // criss-cross: left arm up over the shoulder, right arm down round the waist
    const k = x.hugPose; setArm(a, 'L', -0.1 * k, -2.25 * k); setArm(a, 'R', 0, -0.97 * k);
  }
  if (x.cash === 'hand' || x.cash === 'give') setArm(a, 'R', 0.15, -1.1);
  if (x.cash === true) setArm(a, 'R', 0.15, -0.9);
  if (x.ride !== undefined) {                                  // standing on the pedals, hands on the bars
    const c = x.ride / 0.95 * 0.45;
    setArm(a, 'L', 0.12, -1.15); setArm(a, 'R', 0.12, -1.15);
    EUL.set(0.35 + 0.35 * Math.sin(c), 0, 0, 'XYZ'); a.bones['Leg.L'].quaternion.setFromEuler(EUL);
    EUL.set(0.35 - 0.35 * Math.sin(c), 0, 0, 'XYZ'); a.bones['Leg.R'].quaternion.setFromEuler(EUL);
  }
  if (x.yaw) a.bones.Head.rotateY(x.yaw);
  if (x.pitch) a.bones.Head.rotateX(x.pitch);
  if (x.lean) a.root.rotateX(x.lean);
  if (x.roll) a.root.rotateZ(x.roll);
  if (x.lie) a.root.rotateX(-Math.PI / 2 * x.lie);
  a.root.updateMatrixWorld(true);
  if (x.y !== undefined) a.root.position.y = x.y;
  else if (x.lie) { box3.setFromObject(a.root); a.root.position.y -= box3.min.y - p.y; }
  else a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
}
function face(a, x, s) {
  const who = a.name;
  if (talk[who]) {
    const code = x.mouthShut ? 'c' : speaking(who, s) ? lipAt(s) : '-';
    if (talk[who](x.face, code)) return;
  }
  a.setFace(x.face);
}
const handP = (a, side = 'R') => a.bones['Arm.' + side].localToWorld(V(side === 'L' ? 0.5 : -0.5, -1.55, 0.35));
const headP = (a) => a.bones.Head.localToWorld(V(0, 0.5, 0));
let mouthP = V();
function placeDragon(s) {
  const d = dragonAt(s); dragonRig.visible = d.visible;
  if (!d.visible) return;
  dragonRig.position.copy(d.pos); dragonRig.rotation.set(d.pitch, d.yaw, 0, 'YXZ'); dragonRig.scale.setScalar(d.scale || 1);
  const o = d.open;
  poseCreature(dragon, { 'Saber Tooth Wyvern': hinge(0.38 * o, [0, -1, 3.3]), 'Saber Tooth Wyvern.013': hinge(-0.5 * o, [0, 0, 1.8]) });
  dragonRig.updateMatrixWorld(true);
  mouthP = creaturePoint(dragon, 'Saber Tooth Wyvern.013', -17.0, 10.9, 0);
  if (d.aim && d.aimW > 0) {                                     // move the rig so the jaw tip lands on the aim point
    dragonRig.position.addScaledVector(d.aim.clone().sub(mouthP), d.aimW); dragonRig.updateMatrixWorld(true);
    mouthP = creaturePoint(dragon, 'Saber Tooth Wyvern.013', -17.0, 10.9, 0);
  }
}

// Classroom bits: glass, shards, chunks, homework, teacher's desk.
function fall(p0, v, tau, floor, g = -26) {
  const tl = (v.y + Math.sqrt(v.y * v.y - 2 * g * (p0.y - floor))) / -g, tt = Math.min(tau, tl);
  return { p: V(p0.x + v.x * tt, Math.max(floor, p0.y + v.y * tt + 0.5 * g * tt * tt), p0.z + v.z * tt), landed: tau >= tl, tt };
}
function placeRoom(s) {
  const inside = INSIDE(s);
  room.group.visible = inside; sch.group.visible = !inside;
  if (!inside) return;
  const tau = s - T.boom;
  room.glass.visible = tau < 0;
  for (const sh of room.shards) {
    sh.mesh.visible = tau >= 0;
    if (tau < 0) continue;
    const f = fall(sh.p0, sh.v, tau, FY + 0.03); sh.mesh.position.copy(f.p);
    sh.mesh.rotation.set(sh.spin.x * f.tt, sh.spin.y * f.tt, sh.spin.z * f.tt);
    if (f.landed) sh.mesh.rotation.set(-Math.PI / 2, sh.rest * 6, 0);
  }
  for (const c of room.chunks) {
    if (tau < 0) { c.mesh.position.copy(c.p0); c.mesh.rotation.set(0, 0, 0); continue; }
    const f = fall(c.p0, c.v.clone().multiplyScalar(0.55), tau, FY + 0.3); c.mesh.position.copy(f.p);
    c.mesh.rotation.set(c.spin.x * f.tt * 0.5, c.spin.y * f.tt * 0.5, c.spin.z * f.tt * 0.5);
  }
  room.frame.visible = tau < 0;
  // homework: on the desk until the jaws close on it, then held in the teeth, flapping, and swallowed
  const hw = room.homework, held = s >= T.hw - 0.04, gone = smooth(inv(T.hw + 0.35, T.hw + 0.55, s));
  hw.visible = s < T.hw + 0.55;
  if (!held) { hw.position.copy(hw.userData.rest); hw.rotation.set(-Math.PI / 2, 0, Math.PI / 2); hw.scale.setScalar(1); }
  else {
    const k = s - T.hw;
    hw.position.copy(mouthP).add(V(0.15, -0.35, 0.45)); hw.rotation.set(-0.9 + 0.3 * Math.sin(k * 21), 0.4 * Math.sin(k * 13), 1.3);
    hw.scale.setScalar(1 - gone);
  }
  // the teacher's desk: the jaws clamp the top, the desk hangs from that point and swings with the shake
  const td = room.teacherDesk;
  if (s < T.dsk) { td.position.copy(td.userData.rest); td.rotation.set(0, 0, 0); }
  else {
    const k = s - T.dsk, grip = BITE_TD.clone().sub(td.userData.rest);        // the bitten point, in the desk's frame
    td.rotation.set(0.25 * smooth(clamp(k / 0.5)) + 0.07 * Math.sin(k * 9), 0.15 * Math.sin(k * 5), 0.12 * Math.sin(k * 11) * Math.exp(-k));
    td.position.copy(mouthP).sub(grip.applyEuler(td.rotation)).add(V(0, -0.1, 0));
  }
}

// Yard bits: bike, bills, the cash stack, crash dust and leaves.
function placeYard(s, lx, mx) {
  const t0 = RIDE_T0();
  bk.visible = !INSIDE(s) && s >= T.bike;
  if (bk.visible) {
    if (s < T.crash) {
      const m = along(RIDE0, BIKE_HIT, t0, s, RIDE_V); bk.position.copy(m.pos); bk.rotation.set(0, Math.PI / 2, 0);
      setBike(bk, m.pos.distanceTo(VA(RIDE0)), 0);
    } else {
      const k = s - T.crash, tip = smooth(inv(0.15, 0.6, k));
      bk.position.set(BIKE_HIT[0] - 0.3 * tip, 0.1 * tip, BIKE_HIT[2] + 0.4 * tip); bk.rotation.set(0, Math.PI / 2 - 0.3 * tip, 0); bk.rotateZ(-1.45 * tip);
      setBike(bk, VA(RIDE0).distanceTo(VA(BIKE_HIT)), smooth(inv(0, 0.15, k)));
    }
  }
  // bills: a fountain out of the backpack, settling into a pile round Leo's feet
  const showBills = !INSIDE(s) && s >= T.true3 - 0.1 && s < T.bike;
  bills.visible = showBills;
  if (showBills) {
    const r = rng(5), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1);
    const src = V(LEO_CASH[0], 4.3, LEO_CASH[2] - 0.95);
    for (let i = 0; i < bills.count; i++) {
      const ti = T.true3 + (i / bills.count) * 2.4, v = V((r() - 0.5) * 7, 10 + r() * 6, -1.5 - r() * 5), sp = [r() * 9, r() * 9, r() * 9], pileH = 0.03 + r() * 0.5, yaw = r() * 6.3, sway = r() * 6;
      const tau = s - ti;
      if (tau < 0) { m.makeScale(0, 0, 0); bills.setMatrixAt(i, m); continue; }
      const dragged = V(v.x * 0.75, v.y, v.z * 0.75);
      const f = fall(src, dragged, tau, pileH * (1 - Math.min(1, Math.hypot(v.x, v.z) / 9)), -18);
      f.p.x += Math.sin(tau * 5 + sway) * 0.4 * (f.landed ? 0 : 1);
      if (f.landed) e.set(0, yaw, 0); else e.set(sp[0] * tau, sp[1] * tau, sp[2] * tau);
      m.compose(f.p, q.setFromEuler(e), one); bills.setMatrixAt(i, m);
    }
    bills.instanceMatrix.needsUpdate = true;
  }
  stack.visible = !INSIDE(s) && (lx.cash === 'hand' || lx.cash === 'give' || mx.cash === true);
  if (stack.visible) {
    if (mx.cash === true) stack.position.copy(handP(max)).add(V(0, 0.1, 0));
    else if (lx.cash === 'give') stack.position.copy(handP(leo)).lerp(handP(max), smooth(inv(T.give, T.give + 0.35, s)));
    else stack.position.copy(handP(leo));
    stack.rotation.set(0, 0.4, 0);
  }
  // dust: crash at the tree, the dragon landing on the roof
  const dk = s - T.crash, lk = s - T.land;
  dust.forEach((p, i) => {
    let on = false, c, k, spread = 1;
    if (!INSIDE(s) && dk > 0 && dk < 1.4 && i < 7) { on = true; c = V(TREE[0] - 1.4, 0.6, TREE[2]); k = dk / 1.4; spread = 2.5; }
    else if (!INSIDE(s) && lk > 0 && lk < 1.6 && i >= 7) { on = true; c = V(ROOFSPOT[0], ROOF + 1, ROOFSPOT[2] + 9); k = lk / 1.6; spread = 6; }
    p.visible = on; if (!on) return;
    const [dx, dy, dz, sz] = p.userData.d, e = easeOut(k);
    p.position.set(c.x + dx * spread * e, c.y + dy * 2 * e, c.z + dz * spread * e); p.scale.setScalar(sz * (i < 7 ? 0.45 : 1) * (0.5 + 1.6 * e)); p.material.opacity = 0.8 * (1 - k);
    p.material.color.set(i < 7 ? '#c9b48f' : '#d8d4cc');
  });
  leaves.forEach((l) => {
    const [dx, dy, dz, sp, sz] = l.userData.d, k = s - T.crash - 0.05;
    l.visible = !INSIDE(s) && k > 0 && k < 3.5;
    if (!l.visible) return;
    const y = Math.max(0.05, dy - 3.2 * k), landed = y <= 0.05;
    l.position.set(TREE[0] + dx * 0.6 + (landed ? 0 : Math.sin(k * 3 + sp) * 0.6), y, TREE[2] + dz * 0.6); l.rotation.set(landed ? 0 : k * 2 + sp, sp, landed ? 0 : k * 3);
    l.scale.setScalar(sz);
  });
}

// ---------- shots ----------
const SHOTS = [
  [0, 'cold'], [T.cold, 'ask'], [W.says - 0.15, 'lie1'], [T.boom - 0.75, 'boom'], [W.eats - 0.35, 'hw'], [W.then1 - 0.2, 'desk'],
  [T.track, 'track'], [T.zoom + 0.05, 'zoom'], [T.cashShot, 'cash'], [T.miaShot, 'mia'], [T.bike, 'ride'], [T.crash - 0.4, 'crash'],
  [W.did1 - 0.3, 'did'], [W.panics - 0.25, 'panic'], [W.stops - 0.3, 'stop'], [W.because - 0.2, 'stranger'], [W.lies2 - 0.2, 'friend'],
  [W.wasnt - 0.2, 'remember'], [W.grins - 0.25, 'hug'], [W.then3 - 0.2, 'sees'], [W.almost - 0.2, 'almost'], [T.land - 0.75, 'land'], [W.shuts - 0.2, 'shut'],
  [W.first - 0.2, 'truth'], [W.then4 - 0.2, 'buy'], [W.dollars2 - 0.45, 'pay'], [W.two - 0.2, 'record'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

function look(stage, p, tg, fov = 40, ext = 22) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, Math.min(tg.y, 10), tg.z), ext);
}
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), k * 0.5 * Math.sin(t * 57));
const shake = (t, at, k, dur = 0.4) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples(t) { const id = shotAt(SHOTS, t).shot.id; return ['zoom', 'ride', 'crash', 'boom'].includes(id) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

let LX = null, MX = null;
export function update(t, stage) {
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const s = story(t);
  const lx = leoAt(s), mx = maxAt(s), sx = skyeAt(s), ix = miaAt(s), nx = noobAt(s);
  LX = lx; MX = mx;
  place(leo, lx, s); place(max, mx, s); place(mia, ix, s); place(skye, sx, s); place(noob, nx, s);
  face(leo, lx, s); face(max, mx, s); mia.setFace(ix.face); skye.setFace(sx.face); noob.setFace(nx.face);
  placeDragon(s); placeRoom(s); placeYard(s, lx, mx);
  pack.userData.flap.rotation.x = s >= T.true3 - 0.2 && s < T.bike ? -1.9 * smooth(inv(T.true3 - 0.2, T.true3, s)) : s >= W.million2 - 0.3 && s < T.give ? -1.2 : 0;
  stage.bloom.strength = 0.2;

  const L = headP(leo), M = headP(max), boom = shake(t, T.boom, 0.45, 0.6), land = shake(t, T.land, 0.6, 0.7), crash = shake(t, T.crash, 0.25, 0.4);
  const mid = L.clone().lerp(M, 0.5);
  switch (shot.id) {
    case 'cold': look(stage, V(lerp(-2.4, -2.9, u), FY + 3.8, lerp(4.4, 3.6, u)), V(-8, FY + 5.5, -6.5), 58); break;
    case 'ask': look(stage, V(lerp(10.5, 9.5, u), FY + 6.6, 6.5), V(-5, FY + 3.4, -2), 50); break;
    case 'lie1': look(stage, L.clone().add(V(-6.4, 0.8, 2.6)), L.clone().add(V(0, -0.9, -0.6)), 42); break;
    case 'boom': look(stage, V(7.5, FY + 4.8, 5.5).add(boom), V(-4, FY + 4.4, -7), lerp(56, 50, u)); break;
    case 'hw': look(stage, V(-8.5, FY + 6.6, 1.5).add(boom.multiplyScalar(0.3)), V(-2.5, FY + 3.6, -5.5), 46); break;
    case 'desk': look(stage, V(lerp(-2.8, -2.3, u), FY + 6.4, 5.2), V(-8, FY + 4.4, -5.5), 52); break;
    case 'track': look(stage, V(-22, 3.6, lerp(30, 31, u)), V(-31, 3.0, 45), 44, 30); break;
    case 'zoom': { const lp = leo.root.position; look(stage, V(-10, 6, 22), V(clamp(lp.x, -31, 40), 2.5, 44), 52, 50); break; }
    case 'cash': look(stage, V(LEO_CASH[0] + 2.5, 4.6, LEO_CASH[2] + lerp(13, 11.5, u)), V(LEO_CASH[0], 4.6, LEO_CASH[2]), 48, 20); break;
    case 'mia': look(stage, V(6.2, 4.4, 48.5), V(-2.5, 3.0, 33.5), 50, 25); break;
    case 'ride': { const lp = leo.root.position; look(stage, V(lp.x - 2, 4.2, lp.z + 13), V(lp.x + 2, 2.8, lp.z), 46, 25); break; }
    case 'crash': look(stage, V(4.5, 4.0, 33.5).add(crash), V(10.5, 3.2, 21.6), 46, 25); break;
    case 'did': look(stage, V(7.6, 3.6, 37), V(7.6, 2.4, 23.2), 46, 25); break;
    case 'panic': look(stage, V(7.4, 4.4, 37.5), mid.clone().add(V(0, -0.9, 0)), 40, 25); break;
    case 'stop': look(stage, M.clone().add(V(4.2, 0.4, 5.5)), M.clone().add(V(0, -0.5, 0)), 36, 20); break;
    case 'stranger': look(stage, V(lerp(7.2, 7.6, u), 4.4, lerp(37.5, 36.5, u)), mid.clone().add(V(0, -0.8, 0)), 44, 25); break;
    case 'friend': look(stage, L.clone().add(V(-4.6, 0.3, 5.4)), L.clone().add(V(0, -0.6, 0)), 38, 20); break;
    case 'remember': look(stage, V(lerp(7.6, 7.4, u), 4.4, lerp(36.5, 35, u)), mid.clone().add(V(0, -0.8, 0)), 44, 25); break;
    case 'hug': { const r = lerp(11.8, 10.6, easeInOut(u)), q = 290 * Math.PI / 180; look(stage, V(8.35 + r * Math.sin(q), 7.4, 23.6 + r * Math.cos(q)), V(8.0, 3.5, 23.6), 42, 25); break; }   // over Max's shoulder: Leo's face
    case 'sees': look(stage, V(2, 4.6, 33), V(8.4, 2.0, 22.4), 48, 25); break;
    case 'almost': look(stage, L.clone().add(V(-3.8, 0.2, 5.6)), L.clone().add(V(0, -0.5, 0)), 38, 20); break;
    case 'land': look(stage, V(7.5, 1.8, 34).add(land), V(4.5, 14, 12), 66, 40); break;
    case 'shut': look(stage, V(8.6, 3.0, 30).add(land.multiplyScalar(0.3)), V(5.5, 12, 13), 56, 30); break;
    case 'truth': look(stage, V(7, 2.6, lerp(38, 34, easeInOut(u))), V(5, 11, 15), 60, 40); break;
    case 'buy': look(stage, M.clone().add(V(2.0, 0.4, 6.4)), M.clone().add(V(0.9, -0.9, 0)), 40, 20); break;
    case 'pay': look(stage, V(8, 4.0, 32), V(8, 2.8, 23.6), 40, 25); break;
    case 'record': look(stage, V(7, lerp(3, 5, u), lerp(37, 41, u)), V(5, 10, 14), 60, 40); break;
    default: look(stage, V(7, 6, 44), V(5, 10, 14), 60, 40);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#0c1020') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function check(g, x, y, r, color) { g.save(); g.strokeStyle = color; g.lineWidth = r * 0.36; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - r * 0.6, y); g.lineTo(x - r * 0.15, y + r * 0.45); g.lineTo(x + r * 0.7, y - r * 0.5); g.stroke(); g.restore(); }
// Speech bubble pointing at a 3D point. kind: 'lie' (purple, LIE tag that flips to NOW TRUE), 'truth' (green), 'cut' (torn off).
function bubble(g, s, p3, text, t0, t, { kind = 'lie', trueAt = null, y = null, x = null, size = 58, cutAt = null } = {}) {
  const k = easeOutBack(clamp((t - t0) / 0.22), 1.8); if (k <= 0) return;
  const p = project(p3); g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const lines = text.split('\n'), w = Math.max(...lines.map((l) => g.measureText(l).width)) / s + 70, h = lines.length * size * 1.12 + 46;
  const bx = clamp(x ?? p.x, 60 + w / 2, 900 - w / 2), by = clamp(y ?? p.y - 260, 330 + h / 2, 1020 - h / 2);
  const edge = kind === 'truth' ? '#35c46a' : '#9b5cff';
  g.translate(bx * s, by * s); g.scale(k, k);
  // tail to the speaker
  const tx = clamp(p.x - bx, -w / 2 + 40, w / 2 - 40), ty = Math.min(p.y - by - 40, h / 2 + 150);
  g.beginPath(); g.moveTo((tx - 34) * s, (h / 2 - 4) * s); g.lineTo(clamp(p.x - bx, -w, w) * s * 0.85, Math.max(h / 2 + 40, ty) * s); g.lineTo((tx + 34) * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = edge; g.stroke();
  roundRect(g, (-w / 2) * s, (-h / 2) * s, w * s, h * s, 34 * s); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * size * 1.12 * s + 4 * s));
  // tag
  const isTrue = trueAt !== null && t >= trueAt, tag = kind === 'truth' ? 'TRUTH' : isTrue ? 'NOW TRUE' : 'LIE';
  const tk = isTrue ? easeOutBack(clamp((t - trueAt) / 0.25), 2.4) : 1, col = kind === 'truth' || isTrue ? '#35c46a' : '#ff3b5c';
  g.save(); g.translate((-w / 2 + 30) * s, (-h / 2) * s); g.rotate(-0.12); g.scale(tk, tk);
  g.font = `${40 * s}px "Luckiest Guy"`; const tw = g.measureText(tag).width + (kind === 'truth' || isTrue ? 80 : 40) * s;
  roundRect(g, -10 * s, -32 * s, tw, 64 * s, 16 * s); g.fillStyle = col; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(tag, (kind === 'truth' || isTrue ? 56 : 10) * s, 3 * s);
  if (kind === 'truth' || isTrue) check(g, 28 * s, 0, 20 * s, '#ffffff');
  g.restore();
  g.restore();
}
// Gold/purple burst on whoever the lie just changed.
function sparkle(g, s, p3, t0, t, scale = 1) {
  const a = t - t0; if (a < 0 || a > 0.9) return;
  const p = project(p3); if (!p.on) return;
  const k = easeOut(clamp(a / 0.9)), fade = 1 - clamp((a - 0.35) / 0.55);
  g.save(); g.globalAlpha = fade; g.translate(p.x * s, p.y * s);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 12 * s * (1 - k); g.shadowColor = '#b36bff'; g.shadowBlur = 30 * s;
  g.beginPath(); g.arc(0, 0, (60 + 260 * k) * scale * s, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 + 0.3, rr = (40 + 300 * k) * scale * s, sz = (26 - 14 * k) * scale * s;
    g.fillStyle = i % 2 ? '#ffd23f' : '#d6b3ff'; g.save(); g.translate(Math.cos(ang) * rr, Math.sin(ang) * rr); g.rotate(a * 6);
    g.beginPath(); for (let j = 0; j < 8; j++) { const r2 = j % 2 ? sz * 0.35 : sz, aj = (j / 8) * Math.PI * 2; g.lineTo(Math.cos(aj) * r2, Math.sin(aj) * r2); } g.closePath(); g.fill(); g.restore();
  }
  g.restore();
}
// Roblox-style name tag over Max: "Max" + the relationship line.
function nameTag(g, s, p3, rel, glitch) {
  const p = project(p3); if (!p.on) return;
  g.save(); g.translate(p.x * s, (p.y - 40) * s); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (glitch > 0) g.translate(Math.sin(glitch * 91) * 14 * s, 0);
  g.font = `800 ${46 * s}px Montserrat`; g.lineWidth = 8 * s; g.strokeStyle = 'rgba(0,0,0,.65)'; g.strokeText('Max', 0, -50 * s); g.fillStyle = '#ffffff'; g.fillText('Max', 0, -50 * s);
  const best = rel === 'best', label = best ? 'BEST FRIEND' : 'STRANGER';
  g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(label).width + (best ? 96 : 50) * s;
  roundRect(g, -w / 2, -22 * s, w, 60 * s, 18 * s); g.fillStyle = best ? 'rgba(255,59,92,.92)' : 'rgba(90,96,110,.92)'; g.fill();
  g.fillStyle = '#ffffff'; g.fillText(label, best ? 22 * s : 0, 10 * s);
  if (best) { const hx = -w / 2 + 36 * s, hy = 8 * s, r = 13 * s; g.beginPath(); g.moveTo(hx, hy + r); g.bezierCurveTo(hx - r * 2, hy - r * 0.2, hx - r * 0.8, hy - r * 1.6, hx, hy - r * 0.5); g.bezierCurveTo(hx + r * 0.8, hy - r * 1.6, hx + r * 2, hy - r * 0.2, hx, hy + r); g.fill(); }
  if (glitch > 0) { g.globalAlpha = 0.5; g.fillStyle = '#9b5cff'; g.fillRect(-w / 2, (-30 + (glitch * 1000 % 50)) * s, w, 10 * s); }
  g.restore();
}
function pill(g, s, x, y, text, { bg = 'rgba(12,16,32,.88)', fg = '#ffffff', edge = '#ffd23f', size = 46 } = {}) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 56 * s, h = size * 1.7 * s;
  roundRect(g, x * s - w / 2, y * s, w, h, 22 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = edge; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x * s, y * s + h / 2 + 3 * s); g.restore();
}

export function overlay(g, s, t) {
  const st = story(t), L = headP(leo).add(V(0, 0.8, 0)), M = headP(max).add(V(0, 0.8, 0));
  // Cold open: title, then the rewind.
  if (SHOT === 'cold') {
    if (t < T.cold - REW) {
      pill(g, s, 540, 250, 'EVERY LIE COMES TRUE', { size: 54 });
    } else {
      g.save(); g.fillStyle = 'rgba(30,40,90,.25)'; g.fillRect(0, 0, 1080 * s, 1920 * s);
      for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, ((t * 4000 + i * 240) % 1920) * s, 1080 * s, 8 * s); } g.restore();
      bigText(g, s, '◀◀ REWIND', 540, 600, 96, '#ffffff', 1);
    }
  }
  // Lies and the truth.
  if (SHOT === 'lie1') bubble(g, s, L, 'A DRAGON\nATE IT.', T.lie1, t, { trueAt: T.true1 });
  if (SHOT === 'lie1') sparkle(g, s, headP(leo), T.true1, t, 0.8);
  if (SHOT === 'boom' && t > T.boom && t < T.boom + 0.15) flash(g, s, 0.45 * (1 - (t - T.boom) / 0.15));
  if (SHOT === 'boom' && t > T.boom + 0.1) bigText(g, s, 'CRASH!', 540, 560, 140, '#ffd23f', easeOutBack(clamp((t - T.boom - 0.1) / 0.2), 2), -0.08);
  if (SHOT === 'hw' && t > T.hw) bigText(g, s, 'CHOMP!', 540, 560, 130, '#ffffff', easeOutBack(clamp((t - T.hw) / 0.2), 2), 0.06);
  if (SHOT === 'desk' && t > T.dsk) bigText(g, s, 'CHOMP!', 540, 560, 150, '#ffd23f', easeOutBack(clamp((t - T.dsk) / 0.2), 2), -0.06);
  if (SHOT === 'track') { bubble(g, s, L, "I'M THE FASTEST\nKID IN SCHOOL.", W.im - 0.1, t, { trueAt: T.true2 }); sparkle(g, s, headP(leo), T.true2, t, 0.8); }
  if (SHOT === 'zoom') { const lp = leo.root.position; if (lp.x > 40) bigText(g, s, '0.7 SECONDS', 540, 560, 100, '#ffd23f', easeOutBack(clamp((t - T.zoom - 0.75) / 0.2), 2)); }
  if (SHOT === 'cash') { bubble(g, s, L, "I'VE GOT A\nMILLION DOLLARS.", W.ive - 0.1, t, { trueAt: T.true3 }); sparkle(g, s, headP(leo), T.true3 - 0.1, t, 0.9); }
  if (SHOT === 'mia') { bubble(g, s, L, "MIA THINKS\nI'M COOL.", W.mia - 0.1, t, { trueAt: T.true4, x: 640 }); sparkle(g, s, headP(mia), T.true4, t, 0.7); }
  if (SHOT === 'did' || SHOT === 'panic') nameTag(g, s, M, 'best', 0);
  if (SHOT === 'panic' && st >= W.dude - 0.1) bubble(g, s, L, "DUDE, I'VE NEVER\nSEEN YOU BEFORE.", W.dude - 0.1, t, { trueAt: T.forget, x: 600 });
  if (SHOT === 'stop') { nameTag(g, s, M, st < T.forget + 0.25 ? 'best' : 'stranger', st > T.forget - 0.05 && st < T.forget + 0.45 ? st : 0); sparkle(g, s, headP(max), T.forget, t, 0.9); }
  if (SHOT === 'stranger') nameTag(g, s, M, 'stranger', 0);
  if (SHOT === 'friend') bubble(g, s, L, "YOU'RE MY\nBEST FRIEND.", W.youre1 - 0.1, t, { trueAt: T.remember, x: 560 });
  if (SHOT === 'remember') { nameTag(g, s, M, st < T.remember + 0.25 ? 'stranger' : 'best', st > T.remember - 0.05 && st < T.remember + 0.45 ? st : 0); sparkle(g, s, headP(max), T.remember, t, 0.9); }
  if (SHOT === 'hug') nameTag(g, s, M, 'best', 0);
  if (SHOT === 'sees') nameTag(g, s, M, 'best', 0);
  if (SHOT === 'almost' && st >= W.dragon3 - 0.1) bubble(g, s, L, 'A DRAG—', W.dragon3 - 0.1, t, { trueAt: null });
  if (SHOT === 'land' && t > T.land) bigText(g, s, 'THUD.', 540, 1020, 130, '#ffffff', easeOutBack(clamp((t - T.land) / 0.2), 2));
  if (SHOT === 'truth' && st >= W.iDid - 0.1) bubble(g, s, L, 'I DID.', W.iDid - 0.1, t, { kind: 'truth', y: 900 });
  if (SHOT === 'pay' && st >= T.give) bubble(g, s, L, "I'VE GOT A\nMILLION DOLLARS.", W.million2 - 0.5, t, { kind: 'truth', y: 520, x: 560 });
  if (SHOT === 'record') {
    const k1 = easeOutBack(clamp((t - W.two + 0.1) / 0.25), 2), k2 = easeOutBack(clamp((t - W.record + 0.05) / 0.25), 2.2);
    if (k1 > 0) { g.save(); g.translate(540 * s, 470 * s); g.scale(k1, k1); roundRect(g, -380 * s, -110 * s, 760 * s, 220 * s, 30 * s); g.fillStyle = 'rgba(12,16,32,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#35c46a'; g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('TRUE THINGS LEO SAID TODAY', 0, -48 * s);
      g.font = `${100 * s}px "Luckiest Guy"`; g.fillStyle = '#8be36b'; g.fillText(t > W.two + 0.35 ? '2' : '1', 0, 40 * s); g.restore(); }
    bigText(g, s, 'NEW RECORD!', 540, 700, 110, '#ffd23f', k2, -0.06);
  }
  // Call to action: follow.
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

export const cast = () => ({ leo, max, mia, skye, noob, dragon, room });
export const TIMES = T;
