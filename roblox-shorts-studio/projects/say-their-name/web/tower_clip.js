// Say Their Name. Web renderer + Roblox R6 pack. In this obby, saying a player's name teleports them next to you; first
// to the top of the tower wins a million coins. Leo and Max keep summoning each other back down, Leo's "Steve" name tag
// lasts one line, Mia summons both boys into thin air over the lava, then tries to summon the Noob - whose username
// takes so long to say that he wins first, and her "...nine" brings him to her, holding a million coins.
// Beats: web/beats.js (source/beats.py). The set: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { puff, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, smooth, easeInOut, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { W } from './beats.js';
import { V, tower, stepPos, stepTop, radial, tangent, ang, ledgeAt, TOPY, LAVA_Y, LEDGE_STEP } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 1.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Say Their Name' };
export const sky = { zenith: '#2a78e4', horizon: '#ffd9b8', below: '#ff9a5a', fog: '#f2c9a8', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const headTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const angLerp = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- places ----------
const G = { mia: V(-2.6, 0, 15.6), max: V(1.2, 0, 15.2), leo: V(4.6, 0, 14.6), noob: V(-8.5, 0, 9), spawn: V(0, 0, 19.5) };
const G_START = V(0, 0, 12.3);                                   // the run-up spot in front of step 0
const TOP = V(0, TOPY, 1.4);                                     // the winner's spot on top (in front of the coins)
const ML = (r) => ledgeAt(r);                                    // on the plank
const LEDGE_END = ML(19.4), PLANK0 = ML(10.4);
const SIDE = tangent(LEDGE_STEP);                                // across the plank
const AIR_MAX = LEDGE_END.clone().addScaledVector(SIDE, 3.3), AIR_LEO = LEDGE_END.clone().addScaledVector(SIDE, -3.3);
const NOOB_LEDGE = ML(15.6);
const OFF = { mia: 1.6, noob: -1.6 };                            // where on a step each one stands (Leo and Max use the middle)
const STEP = (i, who) => (i < 0 ? G_START.clone() : i >= 12 ? TOP.clone() : stepPos(i, OFF[who] || 0));
const toCamZ = 0;                                                // heading that faces the usual camera (+Z)

// ---------- key times ----------
const T = {
  tp0: 0.32,                                                     // hook: Mia says "Max!"
  leap: W.leo2 - 0.3, tp1: Math.min(W.pop1 - 0.02, W.leo2 + 0.75),
  maxUp: W.climbs - 0.25, tp2: W.pop2 - 0.02,
  leoUp: W.up1 - 0.12, tp3: W.down1 - 0.02, maxUp2: W.up2 - 0.12, tp4: W.down2 - 0.02,
  type0: W.changes - 0.1, steve: W.steve1, steveUp: W.steve1 + 0.45, tp5: W.pop3 - 0.02, unsteve: W.pop3 + 0.45,
  out: W.mia1 - 0.05, turn: W.turns - 0.1, tpMax: W.pop4 - 0.02, tpLeo: W.pop5 - 0.02, drop: W.straight + 0.05,
  respawn: W.now + 0.4, tpNoob: W.pop6 - 0.02, cta: W.follow - 0.15,
};
const G_FALL = 60, FALL_H = stepTop(LEDGE_STEP) - LAVA_Y, T_FALL = Math.sqrt((2 * FALL_H) / G_FALL);
T.splash = T.drop + T_FALL;

// Hop schedules: [step index list, takeoff times]. Step -1 = the run-up spot on the ground, 12 = the top.
function evenly(a, b, n) { return Array.from({ length: n }, (_, k) => (n === 1 ? a : lerp(a, b, k / (n - 1)))); }
const LEO_HOOK = { from: 4, to: 11, times: evenly(0.4, W.leo1 - 0.5, 7) };
const MAX_RUN = { from: -1, to: 7, times: evenly(T.maxUp, T.tp2 - 0.12, 8), air: 0.3 };
const LEO_PP = { from: -1, to: 4, times: evenly(T.leoUp, W.leo4 + 0.3, 5), air: 0.26 };
const MAX_PP = { from: -1, to: 4, times: evenly(T.maxUp2, W.max4 + 0.1, 5), air: 0.26 };
const LEO_STEVE = { from: -1, to: 5, times: evenly(T.steveUp, W.max5 - 0.4, 6), air: 0.4 };
const MIA_UP = { from: -1, to: 7, times: evenly(W.first + 0.2, T.out - 0.8, 8), air: 0.45 };
const NOOB_UP = { from: 0, to: 9, times: evenly(2.6, W.three - 0.55, 9), air: 0.5 };
const NOOB_TOP = { from: 9, to: 12, times: [W.dragon - 0.25, W.and2 - 0.6, W.jumps - 0.3], air: 0.5 };
T.noobLand = NOOB_TOP.times[2] + 0.5;

// Position along a hop schedule at time s.
function hopping(sch, who, s) {
  const pts = []; for (let i = sch.from; i <= sch.to; i++) pts.push(STEP(i, who));
  const gaps = sch.times.slice(1).map((t, i) => t - sch.times[i]), air = Math.min(sch.air ?? 0.42, 0.92 * Math.min(9, ...gaps));
  let k = 0; while (k < sch.times.length && s >= sch.times[k] + air) k++;
  if (k < sch.times.length && s >= sch.times[k]) {
    const a = pts[k], b = pts[k + 1], u = (s - sch.times[k]) / air;
    const p = a.clone().lerp(b, u), c = Math.max(a.y, b.y) - (a.y + b.y) / 2 + 1.4;
    p.y = lerp(a.y, b.y, u) + 4 * c * u * (1 - u);
    return { pos: p, air: true, u, heading: headTo(a, b), k };
  }
  const p = pts[Math.min(k, pts.length - 1)], nx = pts[Math.min(k + 1, pts.length - 1)];
  const head = k + 1 < pts.length ? headTo(p, nx) : k > 0 ? headTo(pts[k - 1], p) : toCamZ;
  return { pos: p.clone(), air: false, heading: head, k, landed: k > 0 ? s - (sch.times[k - 1] + air) : 9 };
}

// ---------- scene ----------
let A = {}, leo, max, mia, noob, K, cam, SHOT = 'hook', ff, held;
const puffs = [], sparkles = [], coins = [];
const FACES = ['neutral', 'happy', 'laugh', 'smug', 'cool', 'shocked', 'scared', 'surprised', 'nervous', 'determined', 'sad', 'love', 'annoyed', 'angry',
  'shouting', 'suspicious', 'confused', 'dizzy', 'evil_grin', 'wink', 'talking', 'scheming', 'blink'];
export async function setup(stage) {
  const { scene } = stage;
  scene.fog.near = 160; scene.fog.far = 700;
  stage.hemi.groundColor.set('#ff8a50'); stage.hemi.intensity = 0.65;
  [leo, max, mia, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: FACES, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (const n of ['idle', 'walk', 'run', 'jump', 'shock', 'proud', 'laugh_big', 'point_up', 'talk', 'typing', 'shrug', 'look_up', 'think', 'facepalm', 'dizzy', 'sit'])
    A[n] = await loadAnimation(n);
  K = await tower(scene, packItem);
  // The Noob's prize armful: a second coin pile, held in front of him once he wins.
  held = await packItem('props', 'coin_pile'); held.scale.setScalar(K.pileScale * 0.8); held.visible = false; scene.add(held);
  for (let i = 0; i < 18; i++) { const c = await packItem('props', 'gold_coin'); c.visible = false; scene.add(c); coins.push(c); }
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 36; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: '#9ff3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

// ---------- the cast ----------
// State: pos (feet), heading, layers [[anim, t, w, loop]], face, free (pos.y is the feet height, no grounding), arms.
const st = (pos, heading, face, extra = {}) => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, visible: true, ...extra });
const idleAt = (x, s, k = 0) => { x.layers = [['idle', s + k]]; return x; };
const fromHop = (x, h, s) => { x.pos = h.pos; x.heading = h.heading; if (h.air) { x.free = true; x.layers = [['jump', 0.25]]; } else x.layers = [['idle', s]]; return x; };
// Arriving by teleport: pops in 1.4 studs up in the jump pose, drops onto the spot.
function arrive(x, spot, at, s, heading) {
  const u = clamp((s - at) / 0.28); x.pos = spot.clone(); x.heading = heading;
  if (u < 1) { x.free = true; x.pos.y = spot.y + 1.4 * (1 - u * u); x.layers = [['jump', 0.25]]; }
  return u >= 1;
}
const shout = (x, s, at, face = 'shouting') => { if (s >= at - 0.25 && s < at + 0.9) { x.layers = [['point_up', 0.5, 1, false]]; x.face = face; x.lookUp = 0.12; } };
const SHOUT_ARM = (x) => { x.arms = [['R', 2.2, 0.35]]; };     // one arm up towards the tower (never both)

function leoAt(s) {
  const x = st(STEP(4), 0, 'happy'); x.tag = 'Leo';
  if (s < T.leap) {                                              // racing up, then one jump from the top
    const h = hopping(LEO_HOOK, 'leo', s); fromHop(x, h, s); x.face = h.air ? 'happy' : 'determined';
    if (s > W.leo1 - 0.3 && !h.air) { x.heading = angLerp(h.heading, ang(11) + Math.PI, smooth(inv(W.leo1 - 0.3, W.leo1, s))); x.face = 'evil_grin'; x.lookUp = 0.4; }
    if (s > W.top2) { x.crouch = 0.25 * smooth(inv(W.top2, T.leap, s)); x.face = 'determined'; }
    return x;
  }
  if (s < T.tp1) {                                               // the big leap for the top
    const a = STEP(11), b = TOP.clone(), u = clamp((s - T.leap) / 1.1);
    x.free = true; x.pos = a.clone().lerp(b, u * 0.8); x.pos.y = lerp(a.y, b.y, u) + 4 * 2.6 * u * (1 - u); x.heading = headTo(a, b);
    x.layers = [['jump', 0.25]]; x.face = 'laugh'; x.arms = [['R', 2.35, 0.6]];
    return x;
  }
  if (s < T.leoUp) {                                             // dumped at the bottom, next to Max
    const done = arrive(x, G.leo, T.tp1, s, headTo(G.leo, G.max) - 0.4);
    x.face = s < T.tp1 + 0.6 ? 'shocked' : 'angry';
    if (done) idleAt(x, s);
    if (s > T.tp1 + 0.6 && s < W.max2) x.heading = headTo(G.leo, G.max);
    if (s >= T.tp2 - 0.3 || s >= W.yells - 0.3) { x.heading = headTo(G.leo, V(0, 0, 0)); x.face = 'determined'; }
    if (s >= W.yells - 0.1) shout(x, s, W.max3);
    if (s >= T.tp2 + 0.3) { x.face = 'evil_grin'; x.heading = headTo(G.leo, G.max); x.layers = [['laugh_big', s - T.tp2]]; x.lookUp = 0; }
    return x;
  }
  if (s < T.tp3) { const h = hopping(LEO_PP, 'leo', s); fromHop(x, h, s); x.face = 'determined'; x.speed = true; return x; }
  if (s < T.steve) {                                             // down again; then shouts Max down; then the name change
    const done = arrive(x, G.leo, T.tp3, s, headTo(G.leo, G.max)); if (done) idleAt(x, s);
    x.face = s < T.tp3 + 0.4 ? 'shocked' : 'angry';
    if (s >= W.max4 - 0.35 && s < T.tp4 + 0.3) { x.heading = headTo(G.leo, V(0, 0, 0)); shout(x, s, W.max4); }
    if (s >= T.tp4 + 0.3) { x.face = 'smug'; x.heading = headTo(G.leo, G.max); }
    if (s >= T.type0) { x.layers = [['typing', s * 1.6]]; x.face = 'scheming'; x.heading = 0.25; }
    return x;
  }
  if (s < T.steveUp) { const xx = idleAt(x, s); xx.pos = G.leo.clone(); xx.heading = 0.25; xx.face = 'cool'; xx.tag = 'Steve'; return xx; }
  if (s < T.tp5) { const h = hopping(LEO_STEVE, 'leo', s); fromHop(x, h, s); x.face = 'cool'; x.tag = 'Steve'; if (!h.air && h.k === 6) x.heading = angLerp(h.heading, ang(5), smooth(clamp(h.landed / 0.3))); return x; }
  if (s < T.tpLeo) {                                             // found out; tag back to Leo; arguing with Max
    const done = arrive(x, G.leo, T.tp5, s, headTo(G.leo, G.max)); if (done) idleAt(x, s);
    x.tag = s < T.unsteve ? 'Steve' : 'Leo'; x.face = s < T.tp5 + 0.4 ? 'shocked' : 'annoyed';
    if (s > T.unsteve - 0.4 && s < T.unsteve + 0.3) { x.layers = [['typing', s * 1.6]]; x.face = 'annoyed'; }
    if (s > W.ledge) { x.layers = [['talk', s * 1.3]]; x.face = 'angry'; }
    return x;
  }
  return fallAt(x, s, T.tpLeo, AIR_LEO, 'leo');
}
function maxAt(s) {
  const x = st(G.max, 0, 'annoyed'); x.tag = 'Max';
  if (s < T.tp0) { const h = hopping({ from: 1, to: 3, times: [-0.4, 0.15], air: 0.42 }, 'max', s); fromHop(x, h, s); x.face = 'happy'; return x; }
  if (s < T.maxUp) {
    const done = arrive(x, G.max, T.tp0, s, headTo(G.max, G.mia) + 0.3); if (done) idleAt(x, s, 0.4);
    x.face = s < T.tp0 + 0.55 ? 'shocked' : 'annoyed';
    if (s > W.first - 0.2) { x.heading = ang(11) + Math.PI * 0.95; x.face = 'determined'; x.lookUp = 0.3; }
    if (s >= W.max1 - 0.2) { x.heading = headTo(G.max, V(0, 0, 0)); SHOUT_ARM(x); shout(x, s, W.leo2); }
    if (s >= T.tp1 + 0.2) { x.layers = [['laugh_big', s - T.tp1]]; x.face = 'laugh'; x.heading = headTo(G.max, G.leo); x.lookUp = 0; x.arms = []; }
    return x;
  }
  if (s < T.tp2) { const h = hopping(MAX_RUN, 'max', s); fromHop(x, h, s); x.face = 'laugh'; x.speed = true; return x; }
  if (s < T.maxUp2) {
    const done = arrive(x, G.max, T.tp2, s, headTo(G.max, G.leo)); if (done) idleAt(x, s);
    x.face = s < T.tp2 + 0.4 ? 'shocked' : 'angry';
    if (s > T.leoUp - 0.1) { x.heading = headTo(G.max, V(0, 0, 0)); shout(x, s, W.leo4); SHOUT_ARM(x); }
    if (s > T.tp3 + 0.25) { x.face = 'evil_grin'; x.arms = []; x.heading = headTo(G.max, G.leo); }
    return x;
  }
  if (s < T.tp4) { const h = hopping(MAX_PP, 'max', s); fromHop(x, h, s); x.face = 'determined'; x.speed = true; return x; }
  if (s < T.tpMax) {
    const done = arrive(x, G.max, T.tp4, s, headTo(G.max, G.leo)); if (done) idleAt(x, s);
    x.face = s < T.tp4 + 0.4 ? 'shocked' : 'annoyed';
    if (s > T.steve - 0.2) { x.face = 'confused'; x.heading = headTo(G.max, G.leo); }
    if (s > T.steveUp) { x.heading = headTo(G.max, V(0, 0, 0)); x.face = 'determined'; }
    if (s >= W.leo6 - 0.3 && s < W.nothing) { shout(x, s, W.leo6); SHOUT_ARM(x); }
    if (s >= W.nothing) { x.layers = [['shrug', s - W.nothing, 1, false]]; x.face = 'confused'; x.arms = []; x.lookUp = 0.3; }
    if (s >= W.max5 - 0.2) { x.layers = [['idle', s]]; x.face = 'suspicious'; x.lookUp = 0.45; x.lean = 0.12 * smooth(inv(W.max5 - 0.2, W.squints + 0.3, s)); }
    if (s >= W.steve2 - 0.3 && s < T.tp5 + 0.3) { shout(x, s, W.steve2); SHOUT_ARM(x); x.lean = 0; }
    if (s >= T.tp5 + 0.3) { x.layers = [['laugh_big', s - T.tp5]]; x.face = 'laugh'; x.heading = headTo(G.max, G.leo); x.arms = []; x.lookUp = 0; }
    if (s > W.ledge) { x.layers = [['talk', s * 1.2 + 0.5]]; x.face = 'angry'; }
    return x;
  }
  return fallAt(x, s, T.tpMax, AIR_MAX, 'max');
}
// Summoned into thin air beside the plank, a cartoon beat, then straight down into the lava; respawn on the pad.
function fallAt(x, s, at, spot, who) {
  const lookAtMia = headTo(spot, LEDGE_END);
  if (s < T.drop) {
    const u = clamp((s - at) / 0.22); x.free = true; x.pos = spot.clone(); x.pos.y += 0.6 * (1 - u); x.heading = lookAtMia;
    x.layers = [['idle', 0.2]]; x.face = 'surprised';
    if (s > W.midair - 0.25) { x.face = 'scared'; x.lookDown = 0.6 * smooth(inv(W.midair - 0.25, W.midair + 0.1, s)); x.layers = [['shock', 0.3, 1, false]]; }
    x.wiggle = s > W.midair ? 1 : 0;
    return x;
  }
  if (s < T.respawn) {
    const u = s - T.drop; x.free = true; x.pos = spot.clone(); x.pos.y = spot.y - 0.5 * G_FALL * u * u; x.heading = lookAtMia;
    x.layers = [['shock', 0.3, 1, false]]; x.face = 'scared'; x.visible = x.pos.y > LAVA_Y - 4.5; x.tilt = -0.5 * clamp(u * 2);
    return x;
  }
  const p = who === 'leo' ? G.spawn.clone().add(V(1.6, 0, 0)) : G.spawn.clone().add(V(-1.6, 0, 0));
  x.pos = p; x.heading = Math.PI * 0.95; idleAt(x, s); x.face = 'annoyed'; x.lookUp = 0.4; x.ff = T.respawn;
  return x;
}
function miaAt(s) {
  const x = st(G.mia, 0.5, 'shouting'); x.tag = 'Mia';
  if (s < W.first + 0.2) {                                       // the hook: "MAX!"
    x.heading = lerp(0.9, 0.7, clamp(s / 0.8)); x.layers = [['point_up', 0.5, 1, false]]; x.arms = [['R', 1.4, 0.1]];
    if (s > T.tp0 + 0.35) { x.face = 'smug'; x.layers = [['idle', s]]; x.arms = []; x.heading = headTo(G.mia, G.max); }
    return x;
  }
  if (s < T.out) { const h = hopping(MIA_UP, 'mia', s); fromHop(x, h, s); x.face = h.air ? 'happy' : 'scheming'; return x; }
  // Out along the plank, turns back, says it sweetly.
  const a = STEP(7, 'mia'), d1 = a.distanceTo(PLANK0), d2 = PLANK0.distanceTo(LEDGE_END), sp = 9;
  const k = (s - T.out) * sp;
  if (k < d1 + d2) {
    x.pos = k < d1 ? a.clone().lerp(PLANK0, k / d1) : PLANK0.clone().lerp(LEDGE_END, (k - d1) / d2);
    x.heading = k < d1 ? headTo(a, PLANK0) : headTo(PLANK0, LEDGE_END); x.layers = [['walk', k / STRIDE]]; x.face = 'scheming';
    return x;
  }
  x.pos = LEDGE_END.clone(); idleAt(x, s);
  const out = headTo(PLANK0, LEDGE_END), back = out + Math.PI * 0.82;
  x.heading = angLerp(out, back, smooth(inv(T.turn, T.turn + 0.45, s))); x.face = 'scheming';
  if (s > W.sweetly - 0.2) { x.face = 'wink'; x.layers = [['talk', s * 1.4]]; }
  if (s > W.leo7 + 0.4) { x.face = 'smug'; x.layers = [['idle', s]]; }
  if (s > T.drop + 0.1) { x.face = 'laugh'; x.wave = [T.drop + 0.1, T.respawn - 0.3]; x.lookDown = 0.45; }
  if (s > W.now - 0.2) { x.face = 'determined'; x.wave = null; x.lookDown = 0; x.lookUp = 0.55 * smooth(inv(W.now - 0.2, W.now + 0.3, s)); x.heading = angLerp(back, headTo(LEDGE_END, STEP(9)), smooth(inv(W.now - 0.2, W.now + 0.4, s))); }
  if (s > W.easy - 0.1) x.face = 'smug';
  if (s > W.reads - 0.1) x.face = 'suspicious';
  if (s > W.x1 - 0.15) { x.layers = [['talk', s * 1.5]]; x.face = s < W.slayer ? 'talking' : 'nervous'; }
  if (s > W.and2 + 0.1) x.face = 'shocked';
  if (s > W.nine - 0.1) { x.face = 'talking'; }
  if (s > T.tpNoob) { x.face = s < T.tpNoob + 0.5 ? 'surprised' : 'annoyed'; x.layers = [['idle', s]]; x.lookUp = 0; x.heading = angLerp(x.heading, headTo(LEDGE_END, NOOB_LEDGE), smooth(inv(T.tpNoob + 0.15, T.tpNoob + 0.55, s))); }
  return x;
}
function noobAt(s) {
  const x = st(G_START, 0, 'neutral'); x.tag = 'xX_DarkShadowDragonSlayer_Xx2009';
  if (s < W.three) { const h = hopping(NOOB_UP, 'noob', s); fromHop(x, h, s); x.face = h.air ? 'happy' : 'neutral'; if (!h.air && h.k === 9) x.heading = ang(9) + 0.35; return x; }
  if (s < T.noobLand + 0.05) {
    const h = hopping(NOOB_TOP, 'noob', s); fromHop(x, h, s); x.face = h.air ? 'happy' : 'determined';
    if (!h.air && h.k === 0) { x.heading = ang(9) + 0.35; x.lookUp = 0.25; }
    return x;
  }
  if (s < T.tpNoob) {                                            // wins: the coins jump into his arms
    x.pos = TOP.clone(); x.heading = 0; x.face = 'laugh'; x.layers = [['proud', s - T.noobLand, 1, false]];
    if (s > T.noobLand + 0.55) { x.layers = [['idle', s]]; x.carry = true; x.face = 'happy'; }
    return x;
  }
  const done = arrive(x, NOOB_LEDGE, T.tpNoob, s, headTo(NOOB_LEDGE, LEDGE_END) + 0.45); if (done) idleAt(x, s);
  x.carry = true; x.face = 'happy';
  return x;
}
const STATE = { leo: leoAt, max: maxAt, mia: miaAt, noob: noobAt };

// ---------- teleports (computed from the states, so effects always sit where they happen) ----------
const TPS = [['max', T.tp0], ['leo', T.tp1], ['max', T.tp2], ['leo', T.tp3], ['max', T.tp4], ['leo', T.tp5], ['max', T.tpMax], ['leo', T.tpLeo], ['noob', T.tpNoob]]
  .map(([who, t]) => ({ who, t, from: STATE[who](t - 1e-3).pos.clone(), to: STATE[who](t + 1e-3).pos.clone() }));
export const TELEPORTS = TPS.map((x) => x.t);

// ---------- posing ----------
const EUL = new THREE.Euler();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
function place(a, x, s) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0); a.root.scale.setScalar(1); a.heading = x.heading;
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [side, up, fwd] of x.arms || []) setArm(a, side, up, fwd);
  if (x.wave && s > x.wave[0] && s < x.wave[1]) setArm(a, 'R', 2.4 + 0.18 * Math.sin(s * 11), 0.1);
  if (x.carry) { setArm(a, 'L', 0.18, -1.25); setArm(a, 'R', 0.18, -1.25); }
  if (x.crouch) { a.bones.Torso.rotateX(x.crouch); }
  if (x.lookUp) a.bones.Head.rotateX(-x.lookUp);
  if (x.lookDown) a.bones.Head.rotateX(x.lookDown);
  if (x.lean) a.root.rotateX(x.lean);
  if (x.tilt) a.root.rotateX(x.tilt);
  if (x.wiggle) { setArm(a, 'L', 1.5 + 0.35 * Math.sin(s * 19), 0.1); setArm(a, 'R', 1.5 + 0.35 * Math.sin(s * 19 + 2), 0.1); }
  a.root.updateMatrixWorld(true);
  if (!x.free) a.root.position.y -= a.soleHeight() - x.pos.y;
  else a.root.position.y -= a.soleHeight() - a.root.position.y + (a.root.position.y - x.pos.y);   // feet at pos.y
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const head = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0));

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [W.first - 0.15, 'rule'], [W.leo1 - 0.15, 'leoTop'], [W.max1 - 0.1, 'maxShout'], [Math.max(W.leo2 + 0.4, T.tp1 - 0.45), 'leoAir'],
  [T.tp1, 'leoArrive'], [W.max2 - 0.1, 'maxClimb'], [W.yells - 0.1, 'leoShout'], [T.tp2, 'maxArrive'],
  [W.up1 - 0.12, 'pp1'], [W.leo4 - 0.12, 'pp2'], [W.down1 - 0.12, 'pp3'], [W.up2 - 0.12, 'pp4'], [W.max4 - 0.12, 'pp5'],
  [W.so - 0.12, 'steve'], [W.leo6 - 0.15, 'nothing'], [W.max5 - 0.12, 'squint'], [W.tag2 - 0.1, 'tagPov'], [W.steve2 - 0.15, 'steveShout'],
  [T.tp5 + 0.1, 'steveArrive'], [W.mia1 - 0.15, 'ledge'], [W.turns - 0.12, 'sweet'], [W.pop4 - 0.2, 'midair'], [W.midair - 0.1, 'below'], [W.straight - 0.12, 'fall'],
  [W.now - 0.12, 'nowMia'], [W.noob1 - 0.15, 'now'], [W.easy - 0.12, 'easy'], [W.reads + 0.1, 'noobTag'], [W.x1 - 0.12, 'read1'], [W.dragon - 0.4, 'noobHop'],
  [W.x3 - 0.5, 'read2'], [W.and2 - 0.95, 'noobHop2'], [W.jumps - 0.45, 'win'], [W.nine - 0.2, 'nine'], [W.pop6 - 0.12, 'arrive'], [T.cta, 'end'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
export const SHOT_LIST = SHOTS;
function look(stage, p, tg, fov = 40, ext = 28) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, Math.min(tg.y, 40), tg.z), ext); return tg;
}
// Camera at distance d from target tg, at azimuth az (0 = +Z) and elevation el.
const orbit = (stage, tg, az, el, d, fov = 40, ext) => look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov, ext ?? Math.max(20, d * 0.7));
// In front of an actor (along its facing), low, looking up past it: a shout with the tower above.
function shoutCam(stage, a, side = 0.4, d = 6.5, fov = 54) {
  const h = a.heading, hp = head(a), f = V(Math.sin(h + side), 0, Math.cos(h + side));
  return look(stage, hp.clone().addScaledVector(f, d).add(V(0, 0.9, 0)), hp.clone().add(V(0, 1.0, 0)), fov, 30);
}
// A face close-up: camera in front of the actor at azimuth offset `side`.
const faceCam = (stage, a, side = 0.4, d = 6.5, el = 0.02, fov = 38, up = 0.2) => orbit(stage, head(a).add(V(0, up, 0)), a.heading + side, el, d, fov, 20);
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), k * 0.5 * Math.sin(t * 57));
const shake = (t, at, k, dur = 0.35) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples() { return 1; }

// ---------- update ----------
const S = {};
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  for (const [k, a] of [['leo', leo], ['max', max], ['mia', mia], ['noob', noob]]) { S[k] = STATE[k](s); place(a, S[k], s); }
  K.lavaTex.offset.set((t * 0.012) % 1, (t * 0.007) % 1);
  // The prize: on top until the Noob wins, then in his arms.
  const won = s > T.noobLand + 0.55;
  K.pile.visible = !won;
  held.visible = !!S.noob.carry && noob.root.visible;
  if (held.visible) {
    const hd = noob.root.rotation.y, fwd = V(Math.sin(hd), 0, Math.cos(hd));
    held.position.copy(noob.root.position).addScaledVector(fwd, 1.7).add(V(0, 2.1, 0)); held.rotation.set(0, hd, 0);
  }
  // Coin burst when he lands on top.
  coins.forEach((c, i) => {
    const u2 = s - T.noobLand; c.visible = u2 > 0 && u2 < 1.4;
    if (!c.visible) return;
    const a = i * 2.39996, sp = 5 + (i % 5) * 1.6;
    c.position.set(TOP.x + Math.cos(a) * sp * u2, TOPY + 1 + 14 * u2 - 0.5 * 26 * u2 * u2, TOP.z - 1.6 + Math.sin(a) * sp * u2); c.rotation.set(u2 * 9 + i, u2 * 7, 0); c.scale.setScalar(1.3);
  });
  // ForceField on the respawn.
  ff.visible = s > T.respawn && s < T.respawn + 1.6;
  if (ff.visible) { const fa = s - T.respawn; ff.position.copy(G.spawn).add(V(0, 2.9, 0)); ff.scale.set(5.2 * easeOutBack(clamp(fa / 0.25), 2), 3.6, 3.6); ff.material.uniforms.opacity.value = 1 - inv(1.1, 1.6, fa); ff.material.uniforms.time.value = t; }
  // Puffs: every teleport (blue-white at both ends), the lava splashes (orange), the Noob's landing on top (gold).
  const ev = [];
  for (const p of TPS) { ev.push([p.t, p.from.clone().add(V(0, 2.6, 0)), 1.3, 0.55, '#bff6ff']); ev.push([p.t, p.to.clone().add(V(0, 2.6, 0)), 1.3, 0.55, '#ffffff']); }
  for (const sp of [AIR_MAX, AIR_LEO]) ev.push([T.splash, V(sp.x, LAVA_Y + 0.6, sp.z), 2.2, 0.9, '#ff7a2a']);
  ev.push([T.noobLand, TOP.clone().add(V(0, 0.4, 0)), 1.6, 0.7, '#ffe36b']);
  const evs = ev.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const e = evs[i % Math.max(1, evs.length)]; p.visible = !!e && i < evs.length * 6; if (!p.visible) return;
    const [at, c, size, dur, col] = e, uu = (s - at) / dur, a = i * 0.9;
    p.material.color.set(col); p.material.emissive.set(col); p.material.emissiveIntensity = col === '#ff7a2a' ? 0.9 : 0.25;
    p.position.set(c.x + Math.cos(a) * size * 1.2 * easeOut(uu), c.y + Math.sin(a * 2.3) * size * 0.9 + uu * size * 0.5, c.z + Math.sin(a) * size * 1.2 * easeOut(uu));
    p.scale.setScalar(size * (0.35 + 0.45 * easeOut(uu))); p.material.opacity = 0.85 * (1 - uu) ** 2;
  });
  const spk = [];
  for (const p of TPS) for (const c of [p.from, p.to]) if (s >= p.t && s < p.t + 0.8) spk.push([p.t, c.clone().add(V(0, 2.6, 0)), 1]);
  if (s >= T.noobLand && s < T.noobLand + 1) spk.push([T.noobLand, TOP.clone().add(V(0, 3, 0)), 1.4]);
  if (s >= T.steve && s < T.steve + 0.8) spk.push([T.steve, head(leo).add(V(0, 1.2, 0)), 0.6]);
  if (s >= T.unsteve && s < T.unsteve + 0.8) spk.push([T.unsteve, head(leo).add(V(0, 1.2, 0)), 0.6]);
  sparkles.forEach((m, i) => {
    const sp = spk[i % Math.max(1, spk.length)]; m.visible = !!sp; if (!sp) return;
    const uu = s - sp[0], a = i * 2.39996, k = sp[2];
    m.position.copy(sp[1]).add(V(Math.cos(a + uu * 3) * (0.6 + 2.4 * uu) * k, ((i % 6) * 0.4 - 1 + uu * 1.5) * k, Math.sin(a + uu * 3) * (0.6 + 2.4 * uu) * k));
    m.scale.setScalar(1.2 * (1 - uu)); m.material.opacity = 1 - uu; m.material.color.set(sp[0] === T.noobLand ? '#ffe36b' : '#9ff3ff'); m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- cameras ----------
  const lp = leo.root.position.clone(), mp = max.root.position.clone(), ip = mia.root.position.clone(), np = noob.root.position.clone();
  const lh = head(leo), mh = head(max), ih = head(mia), nh = head(noob);
  const mid = (a, b) => a.clone().lerp(b, 0.5);
  switch (shot.id) {
    case 'hook': { const tg = mid(G.mia, G.max).add(V(0, 3.6, 0)); orbit(stage, tg, 0.08, 0.1, lerp(19.5, 18, easeOut(u)), 42); break; }
    case 'rule': {                                               // the tower, tilting up from the pad to the prize
      const k = easeInOut(u); look(stage, V(lerp(-6, -2, k), lerp(8, 28, k), lerp(52, 48, k)), V(0, lerp(14, 33, k), 0), 52, 50); break;
    }
    case 'leoTop': { const p = STEP(11); look(stage, V(-1.8, TOPY + 2.4, 1.2), p.clone().add(V(0.3, 3.0, 0)), 50, 22); break; }
    case 'maxShout': shoutCam(stage, max, 0.85, 6, 46); break;   // low behind-front: Max and the tower above
    case 'leoAir': orbit(stage, STEP(11).lerp(TOP, 0.6).add(V(0, 3.4, 0)), -1.15, 0.12, 13, 46, 22); break;
    case 'leoArrive': { const tg = mid(G.leo, G.max).add(V(0, 3.2, 0)); orbit(stage, tg, -0.2, 0.1, 18.5, 42); break; }
    case 'maxClimb': { const y = Math.max(4, mp.y + 2.5); look(stage, V(mp.x * 0.5 - 2, y + 4, 34), V(mp.x * 0.6, y, 0), 44, 30); break; }
    case 'leoShout': shoutCam(stage, leo, 0.85, 6, 46); break;
    case 'maxArrive': case 'pp5': { const tg = mid(G.leo, G.max).add(V(0, 3.2, 0)); orbit(stage, tg, 0.22, 0.1, 18, 42); break; }
    case 'pp1': { const y = Math.max(4, lp.y + 2.5); look(stage, V(lp.x * 0.5 + 3, y + 3, 32), V(lp.x * 0.6, y, 0), 44, 30); break; }
    case 'pp4': { const y = Math.max(4, mp.y + 2.5); look(stage, V(mp.x * 0.5 - 3, y + 3, 32), V(mp.x * 0.6, y, 0), 44, 30); break; }
    case 'pp2': shoutCam(stage, max, 0.85, 6, 46); break;
    case 'pp3': { const tg = mid(G.leo, G.max).add(V(0, 3.2, 0)); orbit(stage, tg, -0.25, 0.1, 18, 42); break; }
    case 'steve': { const tg = lh.clone().add(V(0, 1.4, 0)); orbit(stage, tg, 0.3, 0.05, lerp(10.5, 9.5, u), 40); break; }
    case 'nothing': { const tg = mh.clone(); look(stage, tg.clone().add(V(4.5, 0.2, 11)), V(lp.x * 0.4, Math.max(5, lp.y - 3), lp.z * 0.4), 56, 30); break; }
    case 'squint': faceCam(stage, max, 0.35, lerp(7.5, 6.2, u), -0.05, 36); break;
    case 'tagPov': { const tg = lh.clone().add(V(0, 0.4, 0)); faceCam(stage, leo, 0.25, lerp(9, 7, u), 0.12, 34, 1.0); break; }
    case 'steveShout': shoutCam(stage, max, 0.85, 6, 46); break;
    case 'steveArrive': { const tg = mid(G.leo, G.max).add(V(0, 3.2, 0)); orbit(stage, tg, 0.1, 0.1, lerp(18.5, 17, u), 42); break; }
    case 'ledge': {                                              // from the side: Mia walking out, the lava far below
      const tg = ML(15.5).add(V(0, 1.5, 0)); look(stage, tg.clone().addScaledVector(SIDE, -21).add(V(0, 3, 0)), tg.clone().add(V(0, -3, 0)), 52, 34); break;
    }
    case 'sweet': { const tg = ih.clone(); look(stage, tg.clone().add(radial(LEDGE_STEP).multiplyScalar(-7)).addScaledVector(SIDE, -2.2).add(V(0, 0.4, 0)), tg.clone().add(V(0, -0.4, 0)), 40, 20); break; }
    case 'midair': { const tg = LEDGE_END.clone().add(V(0, 2.2, 0)); look(stage, tg.clone().add(radial(LEDGE_STEP).multiplyScalar(17)).addScaledVector(SIDE, -5).add(V(0, -2.5, 0)), tg.clone().add(V(0, -1.2, 0)), 50, 24); break; }
    case 'fall': {                                               // high, looking down the drop
      const tg = LEDGE_END.clone().setY(lerp(20, 4, easeInOut(clamp((s - T.drop) / (T_FALL + 0.3))))); look(stage, LEDGE_END.clone().add(radial(LEDGE_STEP).multiplyScalar(12)).add(V(0, 12, 0)).add(shake(t, T.splash, 0.5, 0.5)), tg, 56, 34); break;
    }
    case 'nowMia': faceCam(stage, mia, 0.55, 7.5, -0.18, 46, 0.6); break;
    case 'now': orbit(stage, V(3.5, 31, -3), 2.75, 0.06, lerp(44, 40, u), 50, 40); break;
    case 'easy': faceCam(stage, mia, 0.4, 6.5, -0.08, 38); break;
    case 'noobTag': orbit(stage, nh.clone().add(V(0, 0.6, 0)), ang(9) + 0.3, -0.08, lerp(12, 11, u), 40, 20); break;
    case 'read1': case 'nine': faceCam(stage, mia, -0.45, 7, -0.1, 40, 0.5); break;
    case 'noobHop': case 'noobHop2': { const tg = np.clone().add(V(0, 3, 0)); orbit(stage, tg, ang(SHOT === 'noobHop' ? 10 : 11) + 0.55, 0.12, 16, 44); break; }
    case 'below': { const tg = LEDGE_END.clone().add(V(0, 2.6, 0)); look(stage, LEDGE_END.clone().add(radial(LEDGE_STEP).multiplyScalar(7)).add(V(0, -11, 0)), tg, 56, 30); break; }
    case 'read2': faceCam(stage, mia, 0.5, lerp(6, 5, u), -0.05, 36, 0.4); break;
    case 'win': { const tg = TOP.clone().add(V(0, 4.6, -0.8)); orbit(stage, tg.add(shake(t, T.noobLand, 0.25)), -0.2, 0.05, 18, 46); break; }
    case 'arrive': { const tg = mid(ip, np).add(V(0, 3, 0)); look(stage, tg.clone().addScaledVector(SIDE, -13).add(V(0, 1.2, 0)).add(radial(LEDGE_STEP).multiplyScalar(2)), tg, 40, 22); break; }
    case 'end': { const k = easeInOut(u); const tg = mid(ip, np).add(V(0, lerp(3, 0, k), 0)); look(stage, tg.clone().addScaledVector(SIDE, lerp(-13, -30, k)).add(V(0, lerp(1.2, 9, k), 0)).add(radial(LEDGE_STEP).multiplyScalar(lerp(2, 8, k))), tg, 44, 36); break; }
    default: look(stage, V(0, 20, 60), V(0, 20, 0), 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920, on: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05, z: p.z }; }
function bigText(g, s, text, x, y, size, color, { k = 1, rot = 0, alpha = 1, edge = '#16141f' } = {}) {
  if (k <= 0) return;
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, at, d = 0.15, k = 2.6) => easeOutBack(clamp((t - at) / d), k);
// Speech bubble pointing at a 3D point; when the speaker is off screen the bubble sits at `y` with its tail to the edge.
function bubble(g, s, p3, text, t0, t, { size = 70, edge = '#3a86ff', y = null, maxW = 940 } = {}) {
  const k = easeOutBack(clamp((t - t0) / 0.2), 1.8); if (k <= 0) return;
  const p = project(p3, s); g.save();
  let fs = size; g.font = `${fs * s}px "Luckiest Guy"`;
  while (g.measureText(text).width / s + 80 > maxW && fs > 30) { fs -= 2; g.font = `${fs * s}px "Luckiest Guy"`; }
  const w = g.measureText(text).width / s + 80, h = fs * 1.15 + 48;
  const bx = clamp(p.x, 70 + w / 2, 1010 - w / 2), by = clamp(y ?? p.y - 230, 420 + h / 2, 1080 - h / 2);
  g.translate(bx * s, by * s); g.scale(k, k);
  const tx = clamp(p.x - bx, -w / 2 + 50, w / 2 - 50), tipX = clamp(p.x - bx, -w, w) * 0.85, tipY = clamp(p.y - by - 40, h / 2 + 30, h / 2 + 90);
  g.beginPath(); g.moveTo((tx - 30) * s, (h / 2 - 4) * s); g.lineTo(tipX * s, tipY * s); g.lineTo((tx + 30) * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = edge; g.stroke();
  roundRect(g, (-w / 2) * s, (-h / 2) * s, w * s, h * s, 34 * s); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
// Roblox name tag over a head: white bold text with a dark edge, sized by distance.
function nameTag(g, s, a, text, { min = 24, max = 64, k = 1, color = '#ffffff' } = {}) {
  if (!a.root.visible || !text) return;
  const hp = head(a).add(V(0, 1.15, 0)), p = project(hp, s); if (!p.on) return;
  const d = cam.position.distanceTo(hp), size = clamp(720 / d, min, max) * k;
  if (720 / d < min * 0.7) return;                             // too far: Roblox hides it too
  g.save(); g.font = `800 ${size * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(10,12,24,.85)'; g.lineWidth = size * 0.22 * s; g.strokeText(text, p.x * s, p.y * s);
  g.fillStyle = color; g.fillText(text, p.x * s, p.y * s); g.restore();
}
// Roblox chat, top left.
const CHAT = [
  { text: "Say a player's name to teleport them to you!", at: -1, until: W.leo1 - 0.2 },
  { text: 'First to the top wins 1,000,000 coins!', at: W.first - 0.05, until: W.leo1 - 0.2 },
  { text: 'xX_DarkShadowDragonSlayer_Xx2009 won 1,000,000 coins!', at: T.noobLand + 0.15, until: W.pop6 - 0.15 },
];
function chat(g, s, t) {
  const lines = CHAT.filter((l) => t >= l.at && t < l.until); if (!lines.length) return;
  const x = 50, y = 240, w = 900, lh = 50, pad = 20, h = pad * 2 + lines.length * lh;
  g.save(); roundRect(g, x * s, y * s, w * s, h * s, 20 * s); g.fillStyle = 'rgba(12,18,28,.58)'; g.fill();
  g.font = `800 ${28 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  lines.forEach((l, i) => {
    const yy = (y + pad + lh * (i + 0.5)) * s; g.globalAlpha = clamp((t - l.at) / 0.12);
    g.fillStyle = '#FFD23F'; g.fillText('[Server]: ', (x + pad) * s, yy); const ox = g.measureText('[Server]: ').width;
    g.fillStyle = '#FFE9A8'; g.fillText(l.text, (x + pad) * s + ox, yy);
  });
  g.restore();
}
// The display-name box Leo types into.
function nameEditor(g, s, t) {
  const t0 = T.type0, t1 = T.steve + 0.7; if (t < t0 || t > t1) return;
  const k = pop(t, t0, 0.2, 1.8) * (1 - inv(t1 - 0.15, t1, t));
  const typed = t < W.tag1 ? 'Leo'.slice(0, Math.max(0, 3 - Math.floor((t - t0) / 0.12))) : 'Steve'.slice(0, Math.ceil(clamp((t - W.tag1) / Math.max(0.2, T.steve - W.tag1)) * 5));
  g.save(); g.translate(540 * s, 450 * s); g.scale(k, k);
  roundRect(g, -380 * s, -120 * s, 760 * s, 240 * s, 30 * s); g.fillStyle = 'rgba(25,27,33,.95)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#5a6070'; g.stroke();
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#c9ced8'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('DISPLAY NAME', -340 * s, -72 * s);
  roundRect(g, -340 * s, -40 * s, 470 * s, 92 * s, 14 * s); g.fillStyle = '#ffffff'; g.fill();
  g.font = `800 ${50 * s}px Montserrat`; g.fillStyle = '#16182a'; g.fillText(typed + (Math.floor(t * 4) % 2 ? '|' : ''), -312 * s, 8 * s);
  const saved = t > T.steve;
  roundRect(g, 160 * s, -40 * s, 180 * s, 92 * s, 14 * s); g.fillStyle = saved ? '#3ddc97' : '#3a86ff'; g.fill();
  g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText(saved ? 'SAVED' : 'SAVE', 250 * s, 10 * s);
  g.restore();
}
// Mia reads the name out, word by word.
const NAME_STEPS = [[W.x1 - 0.05, 'x'], [W.x1 + 0.22, 'xX'], [W.underscore1, 'xX_'], [W.dark, 'xX_Dark'], [W.shadow, 'xX_DarkShadow'], [W.dragon, 'xX_DarkShadowDragon'],
  [W.slayer, 'xX_DarkShadowDragonSlayer'], [W.underscore2, 'xX_DarkShadowDragonSlayer_'], [W.x3, 'xX_DarkShadowDragonSlayer_X'], [W.x3 + 0.22, 'xX_DarkShadowDragonSlayer_Xx'],
  [W.two, 'xX_DarkShadowDragonSlayer_Xx2'], [W.thousand, 'xX_DarkShadowDragonSlayer_Xx20'], [W.and2, 'xX_DarkShadowDragonSlayer_Xx200...'], [W.nine, 'xX_DarkShadowDragonSlayer_Xx2009!']];
const nameSoFar = (t) => NAME_STEPS.filter(([at]) => t >= at).pop()?.[1] ?? '';

export function overlay(g, s, t) {
  // Name tags.
  const tags = { leo: S.leo.tag, max: 'Max', mia: SHOT === 'arrive' || SHOT === 'end' ? '' : 'Mia', noob: SHOT === 'tagPov' ? '' : 'xX_DarkShadowDragonSlayer_Xx2009' };
  const big = { noobTag: 'noob', tagPov: 'leo' }[SHOT];
  for (const [k, a] of [['leo', leo], ['max', max], ['mia', mia], ['noob', noob]]) {
    let kk = 1;
    if (k === 'leo' && (Math.abs(t - T.steve) < 0.25 || Math.abs(t - T.unsteve) < 0.25)) kk = 1 + 0.4 * (1 - Math.min(Math.abs(t - T.steve), Math.abs(t - T.unsteve)) / 0.25);
    nameTag(g, s, a, tags[k], { k: kk, max: big === k ? (k === 'noob' ? 50 : 78) : 64, min: big === k ? 40 : 24, color: k === 'leo' && tags.leo === 'Steve' ? '#bff6ff' : '#ffffff' });
  }
  chat(g, s, t);
  // Shouts.
  const sh = (who, text, a, b, o = {}) => { if (t >= a && t < b) bubble(g, s, head(who).add(V(0, 1.6, 0)), text, a, t, o); };
  sh(mia, 'MAX!', -1, T.tp0 + 0.7, { edge: '#ff5c8a', size: 90 });
  sh(max, 'LEO!', W.leo2 - 0.12, Math.max(W.leo2 + 0.6, T.tp1 - 0.45), { size: 96 });
  sh(leo, 'MAX!', W.max3 - 0.12, T.tp2 + 0.12, { edge: '#ff9e3d', size: 96 });
  sh(max, 'LEO!', W.leo4 - 0.12, W.down1 - 0.12, { size: 96 });
  sh(leo, 'MAX!', W.max4 - 0.12, W.down2 - 0.12, { edge: '#ff9e3d', size: 96 });
  sh(max, 'LEO!', W.leo6 - 0.12, W.climbing + 0.2, { size: 96 });
  sh(max, 'STEVE!', W.steve2 - 0.12, T.tp5 + 0.1, { size: 96 });
  if (t >= W.max6 - 0.12 && t < W.midair) bubble(g, s, head(mia).add(V(0, 1.6, 0)), t < W.leo7 - 0.1 ? 'Max?' : 'Max? Leo?', W.max6 - 0.12, t, { edge: '#ff5c8a', size: 84 });
  if (t >= W.x1 - 0.1 && t < W.pop6 + 0.35) bubble(g, s, head(mia).add(V(0, 1.6, 0)), nameSoFar(t), W.x1 - 0.1, t, { edge: '#ff5c8a', size: 60, y: 430 });
  // "Nothing.": a lonely question mark over Max.
  if (t > W.nothing && t < W.max5 - 0.12 && SHOT === 'nothing') { const p = project(head(max).add(V(0, 2.2, 0)), s); if (p.on) bigText(g, s, '?', p.x, p.y - 30, 110, '#ffffff', { k: pop(t, W.nothing) }); }
  // POP! on every arrival in the shot that shows it.
  for (const p of TPS) {
    const a = t - p.t; if (a < -0.02 || a > 0.75) continue;
    if (SHOTS.find((x) => x.id === SHOT && x.start <= t && t < x.end).start > p.t + 0.12) continue;   // only in the shot that saw it happen
    const q = project(p.to.clone().add(V(0, 5.2, 0)), s); if (!q.on) continue;
    bigText(g, s, 'POP!', clamp(q.x, 200, 880), clamp(q.y - 60, 340, 1060), 120, '#9ff3ff', { k: pop(t, p.t, 0.14, 3), alpha: 1 - inv(0.55, 0.75, a), rot: -0.08 });
  }
  if (SHOT === 'fall' && t > T.splash) bigText(g, s, 'OOF', 540, 760, 170, '#ff7a2a', { k: pop(t, T.splash, 0.16, 2.4), rot: 0.06, alpha: 1 - inv(T.splash + 0.8, T.splash + 1.1, t) });
  if (SHOT === 'win' && t > T.noobLand) {
    bigText(g, s, 'WINNER!', 540, 1440, 150, '#FFD23F', { k: pop(t, T.noobLand, 0.2), rot: -0.05 });
    bigText(g, s, '+1,000,000', 540, 1060, 96, '#8BE36B', { k: pop(t, T.noobLand + 0.2, 0.2) });
  }
  nameEditor(g, s, t);
  if (SHOT === 'pp1' || SHOT === 'pp4' || SHOT === 'maxClimb') speedLines(g, s, t, 0.22, { cx: 540, cy: 900 });
  flash(g, s, TPS.some((p) => t >= p.t && t < p.t + 0.08) ? 0.18 : t >= T.noobLand && t < T.noobLand + 0.12 ? 0.35 : 0, '#e8fbff');
  if (t >= T.cta) {                                              // call to action
    const k2 = easeOutBack(clamp((t - T.cta) / 0.3), 1.6);
    g.save(); g.translate(540 * s, 520 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ leo, max, mia, noob });
export const TIMES = T;
export const PLACES = { LEDGE_END, SIDE, radial: radial(LEDGE_STEP) };
