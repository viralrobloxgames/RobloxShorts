// The Six Million Dollar Banana. Web renderer + Roblox R6 pack. True story: Maurizio Cattelan's Comedian, a banana
// duct-taped to a wall, sold twice for $120,000 at Art Basel Miami Beach in 2019; another artist ate it days later and
// the gallery taped up a new one (the buyer owns a certificate and instructions, not a banana); a student in Seoul ate one
// in 2023; in November 2024 one sold at auction in New York for $6.2m and the buyer ate it on stage. The banana came from
// a street fruit stand for 25 cents. Leo is the buyer (suit); the Noob the artist who tapes it up; Max the hungry artist;
// Skye the gallery assistant and the auctioneer; Mia the student; recoloured Noobs are collectors, bidders, the crowd, the
// auction-house runner and the fruit-stand man. Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import {
  stage as buildStage, fair, seoul, auction, stand, dress, backpack, banana, tape, tapeRoll, paddle, gavel, smartphone,
  STAGE, FAIR, SEOUL, AUCTION, STAND, WALL_Z, BANANA_Y, PODIUM, COUNTER,
} from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Six Million Dollar Banana' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const SG = at(STAGE), FR = at(FAIR), SE = at(SEOUL), AU = at(AUCTION), ST = at(STAND);

// ---------- key times (all on the narration) ----------
const T = {
  eats: W.then1 - 0.1, fair: W.started - 0.15, tape: W.artist1 - 0.1, collectors: W.collectors - 0.15, hungry: W.days - 0.15,
  panic: W.gallery - 0.1, cert: W.because - 0.15, seoul: W.years - 0.15, breakfast: W.skipped - 0.25, auction: W.then2 - 0.1,
  bids: W.bids - 0.1, sold: W.six2 - 0.1, buyer: W.buyer - 0.1, itself: W.itself - 0.45, stand: W.street - 0.35, cents: W.sold - 0.15,
  cta: W.follow - 0.15,
};

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, folk = [], SGs, FRs, SEs, AUs, STs, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9', '#a86b3c', '#e8b98a'];
export async function setup(stage) {
  const { scene } = stage;
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'smug', 'laugh', 'surprised', 'cool'] }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'smug', 'laugh'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'smug', 'cool', 'laugh', 'surprised'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'determined', 'shocked', 'surprised', 'cool'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'smug', 'cool', 'determined'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  DRESS.suit = dress(leo, { color: '#2b2d33', hem: 0.15, collar: '#1d1f27', tie: '#f6d13a' });
  DRESS.turtle = dress(noob, { color: '#1d1f27', hem: 0.1, collar: '#1d1f27' });
  DRESS.skyeBlack = dress(skye, { color: '#16182a', hem: 0.2, collar: '#16182a' });
  DRESS.maxShirt = dress(max, { color: '#e9c46a', hem: 0.1 });
  DRESS.bag = backpack(mia);
  for (let i = 0; i < 8; i++) {                          // recoloured Noobs: collectors, crowd, bidders, the stand man
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'laugh', 'shocked'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats;
    e.shells = { suit: dress(e, { color: ['#2b2d33', '#3a3f4a', '#5a3a22', '#2f3b4f', '#3a3f4a', '#2b2d33', '#4a4f5c', '#2b2d33'][i], hem: 0.15, collar: '#1d1f27', tie: ['#c1121f', '#1d3557', '#2a9d8f', '#e9c46a', '#6a4c93', '#c1121f', '#1d3557', '#2a9d8f'][i] }), apron: dress(e, { color: '#2a9d8f', hem: 0.45, sleeves: false }) };
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'shrug', 'shock', 'talk', 'laugh', 'laugh_big', 'proud', 'point_forward', 'look_up', 'think', 'clap', 'idle_lookaround', 'facepalm']) A[n] = await loadAnimation(n);
  SGs = buildStage(scene); FRs = fair(scene); SEs = seoul(scene); AUs = auction(scene); STs = stand(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  for (const k of ['held', 'held2', 'wallFair', 'wallSeoul', 'wallAuction']) add(k, banana());
  for (const k of ['tapeFair', 'tapeSeoul', 'tapeAuction']) add(k, tape());
  add('roll', tapeRoll()); add('gavel', gavel());
  for (let i = 0; i < 5; i++) add('paddle' + i, paddle([12, 27, 41, 58, 63][i]));
  for (let i = 0; i < 6; i++) add('sp' + i, smartphone());
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
const mixArms = (a, b, k) => { const out = b.map(([sd, u, f]) => { const o = a.find((q) => q[0] === sd) || [sd, 0, 0]; return [sd, lerp(o[1], u, k), lerp(o[2], f, k)]; }); for (const o of a) if (!b.find((q) => q[0] === o[0])) out.push([o[0], lerp(o[1], 0, k), lerp(o[2], 0, k)]); return out; };
const HOLD = [['R', 0.05, -0.9]];                       // the banana held up in front
const MOUTH = [['R', -0.45, -1.55]];                     // the banana up at the mouth (fist under the chin)
const REACH = [['R', 0.0, -1.95]];                       // reaching to the wall at banana height
// eating: the arm swings between HOLD and MOUTH; k(s) 0..1 = at the mouth
const bite = (s, t0, n = 2, gap = 0.55) => { let k = 0; for (let i = 0; i < n; i++) k = Math.max(k, Math.sin(clamp((s - t0 - i * gap) / 0.45) * Math.PI)); return k; };

// Leo, the buyer: on stage with the banana (hook and the payoff); a bidder at the auction.
function leoAt(s) {
  let x = base(SG(1.2, 1.2, -1.6), 0.3, 'smug'); x.visible = false;
  if (s < T.fair || (s >= T.buyer && s < T.itself)) {
    x.visible = true; const t0 = s < T.fair ? T.eats : T.buyer;
    const k = bite(s, t0 + 0.05, 2, 0.6); x.arms = mixArms(HOLD, MOUTH, k); x.eatK = k; x.face = k > 0.5 ? 'happy' : (s > t0 ? 'laugh' : 'smug');
    x.held = 'R'; return x;
  }
  if (s >= T.auction && s < T.buyer) {
    x = base(AU(4.5, 0, 6.2), Math.PI + 0.35, 'cool'); x.visible = true;
    const up = bidUp(s, 4); x.arms = [['R', 0.05, lerp(-0.2, -2.3, up)]]; x.paddle = 4; if (up > 0.5) x.face = 'smug';
    return x;
  }
  return x;
}
// paddles go up in turn on "one million", "three", "five", "six point two": who raises when
const BIDS = () => [[W.million2 - 0.25, 1], [W.three - 0.15, 2], [W.five - 0.15, 3], [W.six2 - 0.15, 4]];
function bidUp(s, who) { let k = 0; for (const [t0, w] of BIDS()) if (w === who) k = Math.max(k, smooth(inv(t0, t0 + 0.2, s)) * (1 - smooth(inv(t0 + 1.0, t0 + 1.3, s)))); return k; }
// The Noob: the artist who tapes the banana up.
function noobAt(s) {
  let x = base(FR(3.0, 0, -3.6), Math.PI, 'determined'); x.visible = false;
  if (s >= T.fair && s < T.collectors) {
    x.visible = true;
    const m = moveTo(x, FR(5.0, 0, -1.0), FR(1.5, 0, WALL_Z + 1.7), T.fair + 0.1, s, 12, Math.PI + 0.35);
    if (!m.moving && s > m.arrive) {
      const k = smooth(inv(m.arrive, m.arrive + 0.3, s)) * (1 - smooth(inv(W.calls - 0.1, W.calls + 0.2, s)));
      x.arms = [['R', 0.0, lerp(-0.4, -1.95, k)], ['L', 0.0, lerp(0, -1.7, k)]]; x.roll = 'L'; x.held = s < W.banana2 + 0.35 ? 'R' : null;
      if (s >= W.calls) { x.face = 'smug'; x.heading = lerp(Math.PI + 0.25, 0.4, smooth(inv(W.calls, W.calls + 0.3, s))); x.layers = [['proud', s - W.calls, 1, false]]; x.arms = []; x.roll = null; }
    } else x.held = 'R';
    if (m.moving) x.arms = HOLD;
    return x;
  }
  return x;
}
// Max: the hungry artist at the fair.
function maxAt(s) {
  let x = base(FR(-5, 0, 0), R90, 'happy'); x.visible = false;
  if (s >= T.hungry && s < T.cert) {
    x.visible = true;
    const m = moveTo(x, FR(-7.0, 0, 0.5), FR(-0.6, 0, WALL_Z + 2.0), T.hungry + 0.05, s, 12, Math.PI - 0.3);
    if (!m.moving && s > m.arrive) {
      if (s < W.peels + 0.25) { x.arms = mixArms([], REACH, smooth(inv(m.arrive, m.arrive + 0.25, s))); x.face = 'smug'; }
      else { x.heading = lerp(Math.PI - 0.3, 0.45, smooth(inv(W.peels + 0.25, W.peels + 0.55, s))); x.held = 'R'; x.arms = mixArms(HOLD, MOUTH, bite(s, W.eats2 - 0.2, 3, 0.5)); x.face = 'happy'; }
    }
    if (s >= T.panic) { x = base(FR(-0.6, 0, WALL_Z + 2.0), 0.45, 'happy'); moveTo(x, FR(-0.6, 0, WALL_Z + 2.0), FR(-2.2, 0, WALL_Z + 7.0), T.panic, s, 12, 0.2); }
    return x;
  }
  return x;
}
// Skye: the gallery assistant who tapes up a new one; the auctioneer.
function skyeAt(s) {
  let x = base(FR(5, 0, 0), -R90, 'cool'); x.visible = false;
  if (s >= T.hungry && s < T.cert) {
    x.visible = true;
    if (s < T.panic) { x.pos = FR(5.4, 0, -2.6); x.heading = -0.9; x.face = 'neutral'; return x; }
    const m = moveTo(x, FR(5.4, 0, -2.6), FR(1.5, 0, WALL_Z + 1.7), T.panic + 0.2, s, 12, Math.PI + 0.35);
    x.face = 'cool'; x.held = s < W.tape + 0.3 ? 'R' : null; x.roll = 'L'; x.arms = [['L', 0.05, -0.6]];
    if (!m.moving && s > m.arrive) { const k = smooth(inv(m.arrive, m.arrive + 0.25, s)) * (1 - smooth(inv(W.new + 0.2, W.new + 0.45, s))); x.arms = [['R', 0.0, lerp(-0.4, -1.95, k)], ['L', 0.0, lerp(-0.6, -1.7, k)]]; }
    if (m.moving) x.arms = [['R', 0.05, -0.9], ['L', 0.05, -0.6]];
    return x;
  }
  if (s >= T.auction && s < T.buyer) {
    x = base(AU(PODIUM.x, 0, PODIUM.z - 1.5), 0.3, 'determined'); x.visible = true;
    const knock = s >= W.dollars3 - 0.25 ? Math.max(0, Math.sin(clamp((s - W.dollars3 + 0.25) / 0.3) * Math.PI)) : 0;
    x.arms = [['R', 0.0, -1.2 - 0.9 * knock]]; x.gavel = true; x.layers = [['talk', s - T.auction, 1, true]];
    if (s >= W.dollars3 - 0.25) { x.face = 'shocked'; x.layers = [['idle', s]]; }
    return x;
  }
  return x;
}
// Mia: the student in Seoul.
function miaAt(s) {
  let x = base(SE(-5, 0, 0), R90, 'happy'); x.visible = false;
  if (s >= T.seoul && s < T.auction) {
    x.visible = true;
    const m = moveTo(x, SE(-7.5, 0, 1.0), SE(-0.6, 0, WALL_Z + 2.0), T.seoul + 0.05, s, 12, Math.PI - 0.3);
    if (!m.moving && s > m.arrive) {
      if (s < W.eats3 - 0.05) { x.arms = mixArms([], REACH, smooth(inv(m.arrive, m.arrive + 0.25, s))); x.face = 'happy'; }
      else { x.heading = lerp(Math.PI - 0.3, 0.35, smooth(inv(W.eats3 - 0.05, W.eats3 + 0.25, s))); x.held = 'R'; x.arms = mixArms(HOLD, MOUTH, bite(s, W.eats3 + 0.15, 3, 0.5)); x.face = s > T.breakfast ? 'smug' : 'happy'; }
    }
    return x;
  }
  return x;
}
// Recoloured Noobs.
const PALS = [['#2b2d33', '#1d1f27'], ['#3a3f4a', '#2b2d33'], ['#5a3a22', '#2b2d33'], ['#2f3b4f', '#1d1f27'], ['#3a3f4a', '#2b2d33'], ['#2b2d33', '#1d1f27'], ['#4a4f5c', '#2b2d33'], ['#2b2d33', '#1d1f27']];
function folkAt(i, s) {
  let x = base(FR(0, 0, 0), 0, 'neutral'); x.visible = false; x.wear = 'suit'; x.pal = { shirt: PALS[i][0], pants: PALS[i][1] };
  if (s < T.fair && i < 6) {                                 // the crowd in front of the stage, phones up
    const P = [[-5, 7], [-1.8, 7.6], [1.6, 7.4], [5.0, 7.0], [-3.4, 10.2], [3.2, 10.4]][i];
    x = base(SG(P[0], 0, P[1]), Math.PI + (i % 3 - 1) * 0.15, 'surprised'); x.wear = 'suit'; x.pal = { shirt: PALS[i][0], pants: PALS[i][1] };
    x.arms = [[i % 2 ? 'L' : 'R', 0.05, -2.0]]; x.phone = i % 2 ? 'L' : 'R'; if (s > T.eats + 0.2) x.face = 'shocked'; return x;
  }
  if (s >= T.buyer && s < T.itself && i < 6) { const y = folkAt(i, 0); y.face = 'shocked'; return y; }
  if (s >= T.collectors && s < T.hungry && (i === 0 || i === 1)) {  // the two collectors
    x = base(FR(i ? 2.3 : -1.7, 0, WALL_Z + 2.8), i ? -0.35 : 0.35, 'happy'); x.wear = 'suit'; x.pal = { shirt: PALS[i][0], pants: PALS[i][1] };
    x.layers = [['think', s - T.fair + i, 1, true]]; if (s >= T.collectors) { x.layers = [['clap', s - T.collectors + i * 0.2, 1, true]]; x.face = 'laugh'; } return x;
  }
  if (s >= T.hungry && s < T.cert && i < 3) {                 // fair visitors, shocked
    x = base(FR([-6.2, 5.6, 6.8][i], 0, WALL_Z + [4.2, 3.6, 6.0][i]), [2.3, -2.2, -2.5][i], 'surprised'); x.wear = 'suit'; x.pal = { shirt: PALS[i + 2][0], pants: PALS[i + 2][1] };
    if (s > W.eats2) { x.face = 'shocked'; x.layers = [['shock', clamp(s - W.eats2, 0, 0.5), 1, false]]; } return x;
  }
  if (s >= T.auction && s < T.buyer && i < 4) {              // bidders among the chairs
    const P = [[-4.5, 5.0], [-1.2, 8.4], [1.8, 5.2], [-6.5, 8.6]][i];
    x = base(AU(P[0], 0, P[1] - 1.2), Math.PI + (i % 2 ? 0.2 : -0.2), 'neutral'); x.wear = 'suit'; x.pal = { shirt: PALS[i][0], pants: PALS[i][1] };
    const who = i < 3 ? i + 1 : 0, up = who ? bidUp(s, who) : 0; x.arms = [['R', 0.05, lerp(-0.2, -2.3, up)]]; x.paddle = i; if (up > 0.5) x.face = 'happy';
    if (s >= W.dollars3) x.face = 'shocked'; return x;
  }
  if (s >= T.stand && s < T.cta && i === 6) {                  // the fruit-stand man
    x = base(ST(COUNTER.x + 1.2, 0, COUNTER.z - 2.6), 0.15, 'happy'); x.wear = 'apron'; x.pal = { shirt: '#f4f2ec', pants: '#2b2d33' };
    x.arms = s < W.sold + 0.2 ? [['R', 0.0, lerp(-0.4, -1.45, smooth(inv(T.stand + 0.3, T.stand + 0.7, s)))]] : []; x.held = s < W.sold + 0.2 ? 'R' : null;
    if (s >= W.sold + 0.2) { x.layers = [['shrug', s - W.sold - 0.2, 1, false]]; x.face = 'neutral'; }
    if (s >= W.cents) x.face = 'happy';
    return x;
  }
  if (s >= T.stand && s < T.cta && i === 7) {                  // the auction-house runner takes the banana
    x = base(ST(COUNTER.x + 3.6, 0, COUNTER.z + 2.2), -2.2, 'neutral'); x.wear = 'suit'; x.pal = { shirt: '#2b2d33', pants: '#1d1f27' };
    if (s >= W.sold + 0.2) { x.held = 'R'; x.arms = [['R', 0.05, -0.9]]; moveTo(x, ST(COUNTER.x + 3.6, 0, COUNTER.z + 2.2), ST(COUNTER.x + 16, 0, COUNTER.z + 4.0), W.sold + 0.5, s, 12, R90); if (x.moving) x.arms = [['R', 0.05, -0.9]]; }
    return x;
  }
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
  robloxPose(a, x.layers.map(([n, t, w = 1, loop]) => [A[n], t, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  a.root.updateMatrixWorld(true);
  a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal, i) { for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i]); }
// The palm, measured on the pack mesh: the fist is at (-+0.5, -1.3, 0) in the arm bone's frame (R: -0.5, L: +0.5).
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const armQ = (a, sd) => { const q = new THREE.Quaternion(); a.bones['Arm.' + sd].getWorldQuaternion(q); return q; };
// A banana in a fist: stem end in the palm, the banana pointing along the arm's "down" (out of the fist), curving up.
// The fist wraps round the banana: it comes out of the front of the fist (the arm's local +z), so a hanging arm holds it
// pointing forward and a raised forearm holds it up to the mouth.
const RY_90 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -R90, 0));
function holdBanana(o, a, sd, left = 1) {
  const q = armQ(a, sd), z = V(0, 0, 1).applyQuaternion(q);
  o.visible = true; o.scale.setScalar(1.4); o.quaternion.copy(q).multiply(RY_90);
  o.position.copy(grip(a, sd, 1.35)).addScaledVector(z, 0.3);
  o.userData.setLeft(left);
}
// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.eats, 'eats'], [T.fair, 'fair'], [T.tape, 'tape'], [T.collectors, 'collectors'], [T.hungry, 'hungry'], [W.eats2 - 0.1, 'munch'],
  [T.panic, 'panic'], [T.cert, 'cert'], [T.seoul, 'seoul'], [T.breakfast, 'breakfast'], [T.auction, 'auction'], [T.bids, 'bids'],
  [T.sold, 'sold'], [T.buyer, 'buyer'], [T.itself, 'itself'], [T.stand, 'stand'], [T.cents, 'cents'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }
const PLACE_OF = { hook: 'stage', eats: 'stage', fair: 'fair', tape: 'fair', collectors: 'fair', hungry: 'fair', munch: 'fair', panic: 'fair', cert: 'fair', seoul: 'seoul', breakfast: 'seoul', auction: 'auction', bids: 'auction', sold: 'auction', buyer: 'stage', itself: 'auction', stand: 'stand', cents: 'stand', cta: 'stand' };
function light(stage, place) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const L = {
    stage: { sun: 0, hemi: 0.3, hemiC: '#b8b0ff', env: 0.25, fill: 0.4, rim: 1.0 },
    fair: { sun: 0, hemi: 0.35, hemiC: '#ffffff', env: 0.3, fill: 0.35, rim: 0.5 },
    seoul: { sun: 0, hemi: 0.35, hemiC: '#f4f8ff', env: 0.3, fill: 0.35, rim: 0.5 },
    auction: { sun: 0, hemi: 0.4, hemiC: '#ffe8c8', env: 0.35, fill: 0.45, rim: 0.7 },
    stand: { sun: 3.0, hemi: 0.55, hemiC: '#d9ecff', env: 0.55, fill: 0.7, rim: 1.1 },
  }[place];
  stage.sun.intensity = L.sun; stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; u.zenith.value.set('#4f8fe6'); u.horizon.value.set('#d7ecff');
  SGs.lamp.intensity = place === 'stage' ? 120 : 0; SGs.wash.intensity = place === 'stage' ? 40 : 0;
  FRs.lamp.intensity = place === 'fair' ? 14 : 0; FRs.spot.intensity = place === 'fair' ? 18 : 0;
  SEs.lamp.intensity = place === 'seoul' ? 14 : 0;
  AUs.lamp.intensity = place === 'auction' ? 35 : 0; AUs.spot.intensity = place === 'auction' ? 22 : 0;
  STs.lamp.intensity = place === 'stand' ? 20 : 0;
}

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  const where = PLACE_OF[SHOT];
  light(stage, where);

  // ---------- cast ----------
  for (const a of [max, mia, leo, skye, noob, ...folk]) a.root.visible = false;
  const states = new Map([[max, maxAt(s)], [skye, skyeAt(s)], [noob, noobAt(s)], [leo, leoAt(s)], [mia, miaAt(s)]]);
  for (const [a, x] of states) place(a, x);
  folk.forEach((f, i) => { const x = folkAt(i, s); paint(f, x.pal, i); for (const [k, sh] of Object.entries(f.shells)) sh.visible = x.wear === k; place(f, x); f.state = x; });

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  const onWall = (b, tp, o, show) => { if (!show) return; const bb = PROPS[b]; bb.visible = true; bb.position.copy(o).add(V(-0.75, BANANA_Y + 0.2, WALL_Z + 0.2)); bb.rotation.set(0, 0, -0.55); bb.scale.setScalar(1.5); bb.userData.setLeft(1); bb.userData.setBrown(false); const tt = PROPS[tp]; tt.visible = true; tt.position.copy(o).add(V(0, BANANA_Y - 0.3, WALL_Z + 0.36)); tt.scale.setScalar(1.4); };
  if (where === 'fair') {
    const taped = s >= W.banana2 + 0.35 && (s < W.peels + 0.25 || s >= W.tape + 0.3);
    onWall('wallFair', 'tapeFair', FAIR, taped || SHOT === 'cert');
    if (SHOT === 'cert') PROPS.wallFair.userData.setBrown(s >= W.brown - 0.1);
  }
  if (where === 'seoul') onWall('wallSeoul', 'tapeSeoul', SEOUL, s < W.eats3 - 0.05);
  if (where === 'auction') onWall('wallAuction', 'tapeAuction', V(AUCTION.x + 2.5, 0, AUCTION.z - 1.4), true);
  // bananas in hands
  let hi = 0;
  for (const [a, x] of [...states, ...folk.map((f) => [f, f.state])]) {
    if (!a.root.visible || !x.held) continue;
    let left = 1;
    if (a === leo) left = 1 - 0.32 * smooth(inv((s < T.fair ? T.eats : T.buyer) + 0.2, (s < T.fair ? T.eats : T.buyer) + 0.4, s)) - 0.3 * smooth(inv((s < T.fair ? T.eats : T.buyer) + 0.8, (s < T.fair ? T.eats : T.buyer) + 1.0, s));
    if (a === max) left = 1 - 0.3 * smooth(inv(W.eats2, W.eats2 + 0.2, s)) - 0.3 * smooth(inv(W.eats2 + 0.5, W.eats2 + 0.7, s)) - 0.25 * smooth(inv(W.eats2 + 1.0, W.eats2 + 1.2, s));
    if (a === mia) left = 1 - 0.3 * smooth(inv(W.eats3 + 0.3, W.eats3 + 0.5, s)) - 0.3 * smooth(inv(W.eats3 + 0.8, W.eats3 + 1.0, s)) - 0.25 * smooth(inv(W.eats3 + 1.3, W.eats3 + 1.5, s));
    holdBanana(PROPS[hi ? 'held2' : 'held'], a, x.held, left); hi++;
    if (hi > 1) break;
  }
  for (const [a, x] of states) if (a.root.visible && x.roll) { const r = PROPS.roll; r.visible = true; r.position.copy(grip(a, x.roll)); r.quaternion.copy(armQ(a, x.roll)); }
  if (skye.root.visible && states.get(skye).gavel) { const g = PROPS.gavel; g.visible = true; g.position.copy(grip(skye, 'R')); g.quaternion.copy(armQ(skye, 'R')).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(R90, 0, 0))); }
  let pi = 0, si = 0;
  for (const [a, x] of [[leo, states.get(leo)], ...folk.map((f) => [f, f.state])]) {
    if (!a.root.visible) continue;
    if (x.paddle !== undefined && pi < 5) { const p = PROPS['paddle' + pi++]; p.visible = true; p.position.copy(grip(a, 'R')).add(V(0, -0.2, 0)); p.quaternion.identity(); p.rotation.set(0, a.root.rotation.y, 0); }
    if (x.phone && si < 6) { const p = PROPS['sp' + si++]; p.visible = true; p.position.copy(grip(a, x.phone)).add(V(0, -0.2, 0)); p.quaternion.identity(); p.rotation.set(0, a.root.rotation.y + Math.PI, 0); }
  }

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, SG(lerp(4.0, 3.4, u), 5.6, lerp(9.0, 8.0, u)), SG(0.8, 5.0, -2.0), 50, 16); break;
    case 'eats': look(stage, SG(2.6, 6.2, 4.6), SG(1.2, 5.6, -1.6), 40, 10); break;
    case 'fair': look(stage, FR(lerp(3.0, 2.0, u), 5.0, 13.5), FR(1.0, 4.0, WALL_Z + 1), 50, 18); break;
    case 'tape': look(stage, FR(lerp(-6.4, -5.8, u), 5.0, WALL_Z + 4.2), FR(0.6, 4.4, WALL_Z + 0.8), 46, 10); break;
    case 'collectors': look(stage, FR(0.3, 5.6, WALL_Z + 15.0), FR(0.3, 4.2, WALL_Z + 1.5), 48, 14); break;
    case 'hungry': { const fx = clamp(mp.x - FAIR.x, -6, 0); look(stage, FR(fx + 2.0, 5.4, 11.5), FR(fx * 0.6, 4.2, WALL_Z + 1.5), 50, 16); break; }
    case 'munch': look(stage, FR(-0.2, 5.0, WALL_Z + 9.0), FR(-0.6, 4.3, WALL_Z + 2.0), 42, 10); break;
    case 'panic': look(stage, FR(lerp(-6.6, -6.0, u), 5.0, WALL_Z + 4.4), FR(0.8, 4.4, WALL_Z + 0.8), 46, 12); break;
    case 'cert': look(stage, FR(0.2, BANANA_Y, WALL_Z + lerp(4.4, 3.4, u)), FR(0.0, BANANA_Y - 0.1, WALL_Z), 40, 8); break;
    case 'seoul': { const mx = clamp(mia.root.position.x - SEOUL.x, -6, 0); look(stage, SE(mx + 2.2, 5.4, 11.5), SE(mx * 0.6, 4.2, WALL_Z + 1.5), 50, 16); break; }
    case 'breakfast': look(stage, SE(0.8, 5.6, WALL_Z + 7.4), SE(-0.4, 5.0, WALL_Z + 2.0), 42, 10); break;
    case 'auction': look(stage, AU(lerp(-1.0, 1.0, u), 7.5, 17), AU(0, 4.2, 0), 52, 22); break;
    case 'bids': look(stage, AU(lerp(-3.0, 0.0, u), 5.4, -3.5), AU(0, 3.6, 6.5), 52, 16); break;
    case 'sold': look(stage, AU(PODIUM.x + 2.4, 5.6, PODIUM.z + 6.5), AU(PODIUM.x, 4.6, PODIUM.z - 0.8), 44, 10); break;
    case 'buyer': look(stage, SG(lerp(3.4, 2.8, u), 5.8, lerp(8.0, 7.0, u)), SG(1.0, 5.0, -1.8), 46, 14); break;
    case 'itself': look(stage, AU(2.5, BANANA_Y, -1.4 + WALL_Z + lerp(3.6, 2.6, u)), AU(2.2, BANANA_Y - 0.1, -1.4 + WALL_Z), 40, 8); break;
    case 'stand': look(stage, ST(lerp(-3.0, -2.0, u), 5.0, 13.0), ST(0.8, 3.8, COUNTER.z), 50, 18); break;
    case 'cents': look(stage, ST(2.6, 5.2, 7.5), ST(1.2, 4.6, COUNTER.z - 1.5), 44, 12); break;
    case 'cta': look(stage, ST(1.6, 5.0, 12.5), ST(0.6, 4.0, COUNTER.z), 50, 16); break;
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
const pop = (t, t0, d = 0.22) => easeOutBack(clamp((t - t0) / d), 1.7);
function bubble(g, s, t, t0, text, x, y, tailX, tailY) {
  const k = pop(t, t0); if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  g.font = `${54 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70;
  g.fillStyle = '#ffffff'; g.strokeStyle = '#16182a'; g.lineWidth = 6 * s;
  g.beginPath(); g.moveTo(-30 * s, 40 * s); g.lineTo((tailX - x) * s, (tailY - y) * s); g.lineTo(20 * s, 40 * s); g.closePath(); g.fill(); g.stroke();
  roundRect(g, -w / 2 * s, -50 * s, w * s, 100 * s, 40 * s); g.fill(); g.stroke(); g.fillRect(-28 * s, 34 * s, 46 * s, 14 * s);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#16182a'; g.fillText(text, 0, 4 * s); g.restore();
}
function flashes(g, s, t) {
  if (SHOT !== 'hook' && SHOT !== 'eats' && SHOT !== 'buyer') return;
  for (let i = 0; i < 5; i++) { const ph = ((t * 1.7 + i * 0.37) % 1); if (ph > 0.08) continue; const x = [180, 860, 320, 720, 520][i], y = [1300, 1250, 1420, 1380, 1500][i]; g.save(); g.globalAlpha = 1 - ph / 0.08; const gr = g.createRadialGradient(x * s, y * s, 0, x * s, y * s, 160 * s); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
}
function certificate(g, s, t) {
  if (SHOT !== 'cert') return;
  const k = pop(t, T.cert + 0.1, 0.3);
  g.save(); g.translate(540 * s, 760 * s); g.rotate(-0.04); g.scale(k, k);
  g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * s; g.fillStyle = '#fbf6e8'; g.fillRect(-380 * s, -300 * s, 760 * s, 600 * s); g.shadowColor = 'transparent';
  g.strokeStyle = '#c9a03a'; g.lineWidth = 14 * s; g.strokeRect(-350 * s, -270 * s, 700 * s, 540 * s);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${52 * s}px "Playfair Display"`; g.fillStyle = '#16182a'; g.fillText('Certificate of', 0, -200 * s); g.fillText('Authenticity', 0, -140 * s);
  g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#9b1b30'; g.fillText('"COMEDIAN"', 0, -60 * s);
  if (t > W.instructions - 0.1) { g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#5a6478'; g.fillText('INSTRUCTIONS:', 0, 10 * s); }
  if (t > W.brown - 0.1) { g.font = `800 ${34 * s}px Montserrat`; g.fillStyle = '#16182a'; g.fillText('WHEN IT GOES BROWN,', 0, 70 * s); }
  if (t > W.replace - 0.1) { g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#1e9e55'; g.fillText('REPLACE IT', 0, 140 * s); }
  g.fillStyle = '#c9a03a'; g.beginPath(); g.arc(250 * s, 210 * s, 50 * s, 0, 7); g.fill(); g.fillStyle = '#9b1b30'; g.fillRect(230 * s, 250 * s, 16 * s, 60 * s); g.fillRect(256 * s, 250 * s, 16 * s, 60 * s);
  g.restore();
}
function bidBoard(g, s, t) {
  if (SHOT !== 'bids' && SHOT !== 'sold') return;
  const steps = [[W.million2 - 0.2, '$1,000,000'], [W.three - 0.1, '$3,000,000'], [W.five - 0.1, '$5,000,000'], [W.six2 - 0.1, '$6,200,000']];
  let cur = null, t0 = 0; for (const [a, v] of steps) if (t >= a) { cur = v; t0 = a; }
  if (!cur) return;
  const k = pop(t, t0, 0.18);
  g.save(); g.translate(540 * s, 420 * s);
  roundRect(g, -380 * s, -110 * s, 760 * s, 220 * s, 34 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.font = `800 ${30 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c9cfdc'; g.fillText('CURRENT BID', 0, -62 * s);
  g.scale(k, k); g.font = `${104 * s}px "Luckiest Guy"`; g.fillStyle = cur === '$6,200,000' ? '#ffd23f' : '#ffffff'; g.fillText(cur, 0, 24 * s);
  g.restore();
}
export function overlay(g, s, t) {
  flashes(g, s, t);
  if (SHOT === 'hook') { bigText(g, s, '$6,200,000', 540, 380, 150, '#ffd23f', pop(t, W.six1 - 0.1), -0.04); if (t > W.banana1 - 0.1) bigText(g, s, 'FOR A BANANA', 540, 510, 84, '#ffffff', pop(t, W.banana1 - 0.1), -0.04); }
  if (SHOT === 'eats') stamp(g, s, t, W.eats1, 'CHOMP', 540, 470, '#e63946', 120);
  if (SHOT === 'fair') tag(g, s, t, T.fair, 'MIAMI, 2019', 'an art fair');
  if (SHOT === 'tape' && t > W.art2 - 0.1) bigText(g, s, '"IT\'S ART"', 540, 430, 110, '#ffffff', pop(t, W.art2 - 0.1), -0.04);
  if (SHOT === 'collectors' && t > W.hundred - 0.2) { bigText(g, s, '$120,000', 540, 400, 130, '#ffd23f', pop(t, W.hundred - 0.2), -0.04); if (t > W.each - 0.1) bigText(g, s, 'x 2', 540, 520, 90, '#ffffff', pop(t, W.each - 0.1), -0.04); }
  if (SHOT === 'hungry') tag(g, s, t, T.hungry, 'DAYS LATER');
  if (SHOT === 'munch') stamp(g, s, t, W.eats2, 'EATEN!', 540, 470, '#e63946', 120);
  if (SHOT === 'panic' && t > W.tape - 0.1) bigText(g, s, 'NEW BANANA', 540, 430, 104, '#ffffff', pop(t, W.tape - 0.1), -0.04);
  certificate(g, s, t);
  if (SHOT === 'seoul') tag(g, s, t, T.seoul, 'SEOUL, 2023', 'a museum');
  if (SHOT === 'breakfast') bubble(g, s, t, W.skipped - 0.2, 'I SKIPPED BREAKFAST!', 540, 430, 520, 620);
  if (SHOT === 'auction') tag(g, s, t, T.auction, 'NEW YORK, 2024', 'the auction');
  bidBoard(g, s, t);
  if (SHOT === 'sold' && t > W.dollars3 - 0.15) stamp(g, s, t, W.dollars3 - 0.15, 'SOLD!', 540, 650, '#e63946', 140);
  if (SHOT === 'buyer') stamp(g, s, t, W.stage - 0.1, 'EATEN AGAIN', 540, 430, '#e63946', 110);
  if (SHOT === 'itself') bigText(g, s, '?', 540, 430, 220, '#ffd23f', pop(t, W.itself - 0.2), 0.08);
  if (SHOT === 'stand') tag(g, s, t, T.stand, 'A STREET FRUIT STAND', 'New York');
  if (SHOT === 'cents') { bigText(g, s, '$0.25', 540, 400, 160, '#1e9e55', pop(t, W.cents - 0.15), -0.04, '#0c1a10'); if (t > W.cents + 0.5) bigText(g, s, 'vs $6,200,000', 540, 530, 76, '#ffd23f', pop(t, W.cents + 0.5), -0.04); }
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

export const cast = () => ({ max, mia, leo, skye, noob, folk0: folk[0], folk1: folk[1], folk6: folk[6], folk7: folk[7] });
export const TIMES = T;
export const props = () => PROPS;
