// He Sold The Eiffel Tower. Web renderer + Roblox R6 pack. True story (Victor Lustig, Paris 1925): the papers say the
// tower is rusting and costly to fix, so a con man fakes government letters, invites scrap dealers to a fancy hotel and
// whispers that it's secretly for sale. Andre Poisson pays, and a bribe; Lustig takes the train out of the country and
// Poisson is too embarrassed to tell anyone, so Lustig comes back and tries again. This time the police are called; he
// flees to America, tricks Al Capone, is caught making fake money, escapes down a rope and is caught again. His death
// certificate: apprentice salesman and counterfeiter.
// Max is Lustig (top_hat, dark suit); Leo is Poisson (brown suit); Mia and Skye are dealers (Mia calls the police);
// Noob is a dealer, then Capone (pinstripes), then the police officer (officer_cap).
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Sold The Eiffel Tower' };
export const sky = { zenith: '#3f86e6', horizon: '#cfe8ff', below: '#e9f4ff', fog: '#d6e9f7', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2, PI = Math.PI;
const P_ = (x, y, z) => K.PARIS.clone().add(V(x, y, z));
const H_ = (x, y, z) => K.HOTEL.clone().add(V(x, y, z));
const O_ = (x, y, z) => K.OFFICE.clone().add(V(x, y, z));
const S_ = (x, y, z) => K.STATION.clone().add(V(x, y, z));
const D_ = (x, y, z) => K.DOCK.clone().add(V(x, y, z));
const G_ = (x, y, z) => K.GANG.clone().add(V(x, y, z));
const J_ = (x, y, z) => K.JAIL.clone().add(V(x, y, z));

// ---------- key times (on the narration) ----------
const T = {
  buyer: W.buyer - 0.35, news: W.paris - 0.15, idea: W.victor - 0.1, letters: W.fakes - 0.1, stampT: W.letters - 0.1, hotel: W.fancy - 0.25,
  whisper: W.tower3 - 0.15, poisson: W.one - 0.1, bribe: W.so1 - 0.1, train: W.train - 0.35, shame: W.poisson3 - 0.3, again: W.so2 - 0.1,
  call: W.time - 0.2, flee: W.flees - 0.1, capone: W.tricks - 0.3, money: W.then - 0.1, rope: W.escapes - 0.1, cert: W.death - 0.25,
  cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.buyer, 'buyer'], [T.news, 'news'], [T.idea, 'idea'], [T.letters, 'letters'], [T.hotel, 'hotel'], [T.whisper, 'whisper'],
  [T.poisson, 'poisson'], [T.bribe, 'bribe'], [T.train, 'train'], [T.shame, 'shame'], [T.again, 'again'], [T.call, 'call'], [T.flee, 'flee'],
  [T.capone, 'capone'], [T.money, 'money'], [T.rope, 'rope'], [T.cert, 'cert'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'paris', buyer: 'paris', news: 'paris', idea: 'paris', letters: 'office', hotel: 'hotel', whisper: 'hotel', poisson: 'hotel',
  bribe: 'hotel', train: 'station', shame: 'paris', again: 'station', call: 'hotel', flee: 'dock', capone: 'gang', money: 'office', rope: 'jail',
  cert: 'office', cta: 'paris' };
const MODE_OF = { letters: 'indoor', hotel: 'hotel', whisper: 'hotel', poisson: 'hotel', bribe: 'hotel', call: 'hotel', capone: 'gang', money: 'indoor',
  cert: 'indoor', rope: 'night' };

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, hat, cap, P = {}, S = {}, PLACES = {}, SHOT = 'hook', cam, scr = {}, CL = {};
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['smug', 'cool', 'happy', 'neutral', 'scheming', 'evil_grin', 'shocked', 'surprised', 'talking', 'determined', 'scared'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'surprised', 'love', 'nervous', 'sad', 'shocked', 'crying'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['neutral', 'surprised', 'angry', 'suspicious', 'happy'], hairLift: 0.2 }),
    loadRobloxCharacter('Skye', { expressions: ['neutral', 'surprised', 'happy', 'suspicious'] }),
    loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'angry', 'suspicious', 'smug', 'shouting'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root);
  hat = await wear(max, 'top_hat');
  cap = await wear(noob, 'officer_cap');
  for (const n of ['idle', 'walk', 'run', 'sprint', 'talk', 'scheming', 'sit', 'typing', 'facepalm', 'climb', 'point_forward', 'point_up', 'shock', 'proud', 'hold', 'think', 'panic', 'defeated', 'shrug'])
    A[n] = await loadAnimation(n);
  // clothes: Max's dark suit, Leo's brown suit, Noob's three outfits (dealer, gangster, police)
  CL.max = K.dress(max, { color: '#23262f', collar: '#f2efe6', tie: '#8a1c2b', hem: 0.35 });
  CL.leo = K.dress(leo, { color: '#6b4a32', collar: '#f2efe6', tie: '#2b4f7a', hem: 0.3 });
  CL.noobSuit = K.dress(noob, { color: '#55585f', collar: '#f2efe6', tie: '#3a3d44', hem: 0.3 });
  CL.noobGang = K.dress(noob, { color: '#ffffff', map: K.pinstripe(), collar: '#f2efe6', tie: '#b3242c', hem: 0.35 });
  CL.noobCop = K.dress(noob, { color: '#1f2f5a', buttons: '#d4ab3c', hem: 0.35 });

  S.ground = K.ground(scene);
  const pa = K.paris(scene); PLACES.paris = pa.group; S.pa = pa;
  const ho = K.hotel(scene); PLACES.hotel = ho.group; S.ho = ho;
  const of = K.office(scene); PLACES.office = of.group; S.of = of;
  const stn = K.station(scene); PLACES.station = stn.group; S.stn = stn;
  const dk = K.dock(scene); PLACES.dock = dk.group; S.dk = dk;
  const gg = K.gang(scene); PLACES.gang = gg.group; S.gg = gg;
  const jl = K.jail(scene); PLACES.jail = jl.group; S.jl = jl;
  const add = (k, o) => { P[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('deed', K.deed()); add('paper', K.newspaper()); add('flyPaper', K.newspaper()); add('stamp', K.stamp()); add('bag', K.cashBag()); add('bag2', K.cashBag(0.55));
  add('phone', K.candlestickPhone()); add('case', K.briefcase()); add('stack', K.cashStack()); add('box', K.moneyBox()); add('cert', K.certificate());
  add('tw', K.typewriter()); add('rope', K.sheetRope(21));
  P.letters = []; for (let i = 0; i < 5; i++) P.letters.push(add('letter' + i, K.letter()));
  P.bills = []; for (let i = 0; i < 10; i++) { const b = K.bill(); scene.add(b); P.bills.push(b); }
  P.puffs = []; for (let i = 0; i < 10; i++) { const p = K.puff(); scene.add(p); P.puffs.push(p); }
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading, gait) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[gait || (speed >= 14 ? 'run' : 'walk'), (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; x.dist = u * d; return x;
}
const headTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const SIT_Y = 0.7;                                                 // root height that puts a seated R6 on a 2.2-high chair (hips 2 above the root)
const sitAt = (pos, heading, face) => { const x = st(pos, heading, face); x.sit = true; x.pos.y = pos.y + SIT_Y; x.layers = [['sit', 0, 1, false]]; return x; };
const HOOK_MAX = P_(-1.7, 0, 40), HOOK_LEO = P_(1.7, 0, 40);

function maxAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'hook': {                                               // handing the bill of sale over, the tower behind
      x = st(HOOK_MAX, R90 - 0.45, 'smug');
      const k = smooth(inv(0, W.sold + 0.2, s)); x.arms = [['L', 0.12, lerp(-0.95, -1.25, k)]]; x.deed = s < W.eiffel + 0.25 ? 'L' : null; return x;
    }
    case 'idea': {                                               // reading the paper by a lamp post, lowers it, gets the idea
      x = st(P_(-7.5, 0, 31), 0.35, 'neutral');
      const k = smooth(inv(W.reads + 0.25, W.reads + 0.7, s));
      x.arms = [['L', 0.25, lerp(-1.35, -0.55, k)], ['R', 0.25, lerp(-1.35, -0.55, k)]]; x.paper = true;
      if (s > W.idea - 0.15) { x.face = 'scheming'; x.layers = [['scheming', s - W.idea, 0.7]]; x.arms = [['L', 0.2, -0.5]]; x.paperL = true; }
      x.look = [0, -0.08]; return x;
    }
    case 'letters': {                                            // typing the fake letters, then the official stamp
      x = st(O_(0, 0, -7.0), 0, 'scheming');
      if (s < T.stampT) { x.layers = [['typing', s, 1, true]]; x.face = 'scheming'; return x; }
      const k = inv(T.stampT, T.stampT + 0.28, s), slam = k < 1 ? Math.sin(k * PI) : 0;
      x.arms = [['R', 0.1, -0.75 - 0.7 * slam]]; x.stampR = true; x.face = 'smug'; return x;
    }
    case 'hotel': { x = st(H_(-9.6, 0, 1.8), R90 - 0.6, 'smug'); x.layers = [['proud', 0.35, 1, false]]; return x; }
    case 'whisper': {
      x = st(H_(-9.6, 0, 0.4), R90 - 0.45, 'scheming'); x.layers = [['talk', s * 0.8, 1, true]]; x.lean = 0.28 * smooth(inv(T.whisper, T.whisper + 0.4, s));
      x.arms = [['L', 0.25, -0.7]]; return x;
    }
    case 'bribe': {                                              // palm out for the bribe, takes the bags, turns to go
      x = st(H_(-11.4, 0, 2.4), R90 - 0.35, 'smug');
      x.arms = [['L', 0.12, -0.95 + 0.06 * Math.sin(s * 9)]];
      if (s > W.bribe + 0.35) x.bag2 = 'L';
      if (s > W.grabs - 0.05) { x.bag = 'R'; x.arms = [['L', 0.12, -0.5], ['R', 0.12, -0.6]]; x.face = 'evil_grin'; x.heading = lerp(R90 - 0.35, -R90 + 0.9, smooth(inv(W.grabs + 0.1, W.grabs + 0.5, s))); }
      return x;
    }
    case 'train': {                                              // waving the bag from the carriage step as the train pulls out
      const tr = trainX(s); x = st(S_(tr + 3.6, 1.7, 1.55), PI, 'evil_grin'); x.air = true; x.bag = 'R'; x.wave = true; x.waveBag = true; return x;
    }
    case 'again': {                                              // steps down off the arriving train
      const tr = trainX(s), door = S_(tr + 3.6, 1.7, 1.55), plat = S_(tr + 3.6, K.PLAT_Y, -1.6);
      x = st(door, PI, 'evil_grin'); x.air = true;
      const k = smooth(inv(W.comes - 0.05, W.back + 0.1, s)); x.pos = door.clone().lerp(plat, k); x.pos.y = lerp(1.7, K.PLAT_Y, k) + Math.sin(k * PI) * 0.5;
      if (k > 0 && k < 1) x.layers = [['walk', (3.2 * k) / STRIDE]];
      if (s > W.again1 - 0.2) { x.face = 'evil_grin'; x.layers = [['proud', 0.35, 1, false]]; }
      return x;
    }
    case 'flee': {                                               // sprinting down the pier to the ship
      const a = D_(22, 2.2, 4.0), b = D_(-2, 2.2, 2.0);
      x = st(a, -R90, 'scared'); moveTo(x, a, b, T.flee - 0.4, s, 16, -R90 - 0.6, 'run'); x.face = 'scared'; return x;
    }
    case 'capone': {                                             // hands the briefcase back across the desk; takes the reward
      x = st(G_(-5.5, 0, -0.4), headTo(G_(-5.5, 0, -0.4), G_(1.0, 0, -5.6)), 'smug');
      const k = smooth(inv(T.capone + 0.1, W.gangster, s)); x.arms = [['R', 0.1, lerp(-0.3, -1.05, k)]]; x.case = k < 0.98 ? 'R' : null;
      if (s > W.capone + 0.3) { x.arms = [['R', 0.1, -1.0]]; x.face = 'cool'; }
      return x;
    }
    case 'money': {                                              // the money box spits bills; then the police
      x = st(O_(-1.2, 0, -7.0), 0.15, 'cool'); x.layers = [['scheming', s * 0.6, 1, true]];
      if (s > W.caught1 - 0.1) { x.face = 'shocked'; x.layers = [['shock', clamp(s - W.caught1, 0, 0.3), 1, false]]; x.heading = 0.6; }
      return x;
    }
    case 'rope': {                                               // climbing down the knotted sheets, lands, caught
      const t0 = T.rope + 0.05, t1 = W.caught2 - 0.55, k = clamp(inv(t0, t1, s));
      x = st(J_(0.6, lerp(19.5, 0, k), 0.15), PI, 'determined'); x.air = k < 1; x.layers = [['climb', s * 1.1, 1, true]];
      if (k >= 1) { x.air = false; x.pos.y = 0; x.heading = lerp(PI, 0.35, smooth(inv(t1, t1 + 0.3, s))); x.layers = [['shock', clamp(s - t1 - 0.2, 0, 0.3), 1, false]]; x.face = s > W.caught2 - 0.25 ? 'shocked' : 'determined'; }
      return x;
    }
    case 'cta': { x = st(HOOK_MAX.clone().add(V(1.7, 0, 0)), 0.2, 'cool'); x.wave = true; return x; }
  }
  return x;
}
function leoAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = st(HOOK_LEO, -R90 + 0.45, 'happy'); const k = smooth(inv(W.sold - 0.2, W.eiffel + 0.2, s)); x.arms = [['R', 0.12, lerp(-0.4, -1.2, k)]]; x.deed = s >= W.eiffel + 0.25 ? 'R' : null; return x; }
    case 'buyer': {                                              // clutching the deed; hides it as a policeman strolls past
      x = st(P_(1.2, 0, 34), -0.25, 'nervous'); x.arms = [['R', 0.12, -1.0]]; x.deed = 'R';
      if (s > W.police1 - 0.25) { const k = smooth(inv(W.police1 - 0.25, W.police1 + 0.15, s)); x.arms = [['R', 0.12, lerp(-1.0, 0.75, k)]]; x.face = 'nervous'; x.look = [0.5 * k, 0]; }
      return x;
    }
    case 'hotel': return sitAt(H_(-5, 0, -3.6), 0, 'happy');
    case 'whisper': { x = sitAt(H_(-5, 0, -3.6), 0, 'surprised'); x.lean = 0.18; x.heading = -0.5; return x; }
    case 'poisson': { x = sitAt(H_(-5, 0, -3.6), 0.15, 'love'); if (s > W.wants2 - 0.15) { x.layers = [['sit', 0, 1, false]]; x.arms = [['R', 0.15, -2.55]]; } return x; }
    case 'bribe': {
      x = st(H_(-8.2, 0, 2.4), -R90 + 0.35, 'happy');
      if (s > W.bribe - 0.2 && s < W.bribe + 0.35) { x.arms = [['R', 0.12, -1.05]]; x.bag2 = 'R'; }
      if (s > W.poisson2 - 0.1 && s < W.grabs - 0.05) { x.arms = [['R', 0.12, lerp(-0.4, -1.05, smooth(inv(W.poisson2 - 0.1, W.pays + 0.1, s)))]]; x.bag = 'R'; }
      if (s > W.grabs) x.face = 'surprised';
      return x;
    }
    case 'shame': { x = st(P_(2.5, 0, -6), 0.25, 'nervous'); x.layers = [['facepalm', clamp(s - T.shame - 0.15, 0, 0.3), 1, false]]; x.arms = [['L', 0.15, -0.8]]; x.deed = 'L'; return x; }
  }
  return x;
}
// Mia, Skye: dealers in the hotel (Mia calls the police). Noob: dealer, then Capone, then the policeman.
function extraAt(a, s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  const seats = { mia: [H_(0, 0, -3.6), 0], skye: [H_(5, 0, -3.6), -0.15], noob: [H_(9.6, 0, 0), -R90] };
  const k = a === mia ? 'mia' : a === skye ? 'skye' : 'noob';
  switch (SHOT) {
    case 'hotel': case 'whisper': case 'poisson': {
      const [p, h] = seats[k]; x = sitAt(p, h, 'neutral'); x.outfit = 'suit';
      if (SHOT === 'whisper') { x.lean = 0.18; x.face = 'surprised'; x.heading = h - (k === 'noob' ? 0 : 0.6); }
      if (SHOT === 'poisson') x.face = 'suspicious';
      return x;
    }
    case 'call': {
      if (k !== 'mia') return x;
      x = sitAt(H_(0, 0, -3.6), 0, 'angry'); const kk = smooth(inv(T.call + 0.05, T.call + 0.45, s));
      x.arms = [['R', lerp(0.12, 0.55, kk), lerp(-0.4, -2.35, kk)]]; x.ear = kk > 0.5; return x;
    }
  }
  if (k !== 'noob') return x;
  switch (SHOT) {
    case 'buyer': {                                              // the policeman strolling behind Leo
      const a0 = P_(-24, 0, 24), b0 = P_(24, 0, 26); x = st(a0, R90, 'neutral'); moveTo(x, a0, b0, T.buyer - 0.9, s, 12, R90); x.outfit = 'cop'; return x;
    }
    case 'flee': {                                               // chasing, too late
      const a0 = D_(44, 2.2, 4.0), b0 = D_(18, 2.2, 4.0); x = st(a0, -R90, 'angry'); moveTo(x, a0, b0, T.flee + 0.2, s, 16, -R90, 'run'); x.outfit = 'cop'; x.face = 'shouting';
      if (!x.moving && s > T.flee + 1) { x.layers = [['point_forward', 0.2, 1, false]]; }
      return x;
    }
    case 'capone': {
      x = st(G_(1.0, 0, -5.6), headTo(G_(1.0, 0, -5.6), G_(-5.5, 0, -0.4)), 'suspicious'); x.outfit = 'gang'; x.layers = [['idle', s]];
      if (s > W.capone - 0.1) { x.face = 'happy'; x.arms = [['R', 0.1, lerp(-0.3, -1.05, smooth(inv(W.capone - 0.1, W.capone + 0.3, s)))]]; x.stack = 'R'; }
      return x;
    }
    case 'money': {
      if (s < W.caught1 - 0.4) return x;
      const a0 = O_(11, 0, -1), b0 = O_(6.4, 0, -2.0); x = st(a0, -R90, 'angry'); moveTo(x, a0, b0, W.caught1 - 0.45, s, 16, -R90 - 0.3, 'run'); x.outfit = 'cop';
      if (!x.moving) x.layers = [['point_forward', 0.2, 1, false]];
      return x;
    }
    case 'rope': {
      if (s < W.caught2 - 0.6) return x;
      const a0 = J_(-9, 0, 8), b0 = J_(-3.2, 0, 4.8); x = st(a0, R90, 'smug'); moveTo(x, a0, b0, W.caught2 - 0.55, s, 16, R90 - 0.5, 'run'); x.outfit = 'cop';
      if (!x.moving) x.layers = [['point_forward', 0.2, 1, false]];
      return x;
    }
  }
  return x;
}
// the train's x (station-local): leaving accelerates toward -x; arriving decelerates in from +x and stops at 0
function trainX(s) {
  if (SHOT === 'train') { const d = Math.max(0, s - (W.train + 0.2)); return -1.6 * d * d - 1.2 * d; }
  if (SHOT === 'again') { const d = Math.max(0, (W.comes - 0.15) - s); return 1.5 * d * d + 1.5 * d; }
  return 0;
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
  if (x.lean) a.bones.Root.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const fwdOf = (a) => V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y));

// ---------- lighting ----------
const MODES = {
  day: { sun: 2.8, sunC: '#fff0dc', hemi: 0.6, env: 0.55, fill: 0.7, rim: 1.0, z: '#3f86e6', h: '#cfe8ff', fog: '#d6e9f7', near: 160, far: 1000 },
  indoor: { sun: 1.2, sunC: '#fff0dc', hemi: 1.1, env: 0.9, fill: 0.9, rim: 0.8, z: '#3f86e6', h: '#cfe8ff', fog: '#d6e9f7', near: 160, far: 1000 },
  hotel: { sun: 1.0, sunC: '#ffe2b8', hemi: 1.0, env: 0.85, fill: 0.9, rim: 0.9, z: '#3f86e6', h: '#ffe9c8', fog: '#f2e2c8', near: 160, far: 1000 },
  gang: { sun: 0.5, sunC: '#ffd9a0', hemi: 0.7, env: 0.55, fill: 0.7, rim: 1.0, z: '#2a2f45', h: '#5a4a3a', fog: '#3a3028', near: 160, far: 1000 },
  night: { sun: 0.35, sunC: '#9fb4ff', hemi: 0.45, env: 0.3, fill: 0.35, rim: 0.7, z: '#0b1226', h: '#22304e', fog: '#141c30', near: 80, far: 500 },
};
function light(stage, mode) {
  const L = MODES[mode] || MODES.day;
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; u.zenith.value.set(L.z); u.horizon.value.set(L.h);
  sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
}

// ---------- cameras ----------
function look(stage, p, tg, fov = 40, ext = 18) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg); stage.aimSun(tg.clone(), ext); return tg; }
export function samples() { return 1; }

function holdAt(a, sd, obj, off = V(0, 0, 0), faceCam = false) {
  obj.visible = true; obj.position.copy(grip(a, sd)).add(off); obj.rotation.set(0, faceCam ? 0 : a.root.rotation.y, 0);
}
function puffs(src, s, n0, n, spread = 1) {                         // steam: each puff rises and grows over 1.6 s, staggered
  for (let i = 0; i < n; i++) {
    const p = P.puffs[n0 + i], ph = ((s * 0.9 + i / n) % 1);
    p.visible = true; p.position.copy(src).add(V(-ph * 4 * spread, ph * 6, Math.sin(i * 2.1) * 0.6)); p.scale.setScalar(0.6 + ph * 2.2); p.material.opacity = 0.75 * (1 - ph);
  }
}

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  S.ground.visible = place0 === 'paris' || place0 === 'station' || place0 === 'jail';
  light(stage, MODE_OF[SHOT] || 'day');

  const mx = maxAt(s), lx = leoAt(s); place(max, mx); place(leo, lx);
  const ex = {}; for (const [k, a] of [['mia', mia], ['skye', skye], ['noob', noob]]) { ex[k] = extraAt(a, s); place(a, ex[k]); }
  const outfit = ex.noob.outfit || 'suit';
  CL.noobSuit.visible = outfit === 'suit'; CL.noobGang.visible = outfit === 'gang'; CL.noobCop.visible = outfit === 'cop'; cap.item.visible = outfit === 'cop';

  // sets
  S.pa.tower.userData.rust(SHOT === 'news' ? smooth(inv(W.rusting - 0.1, W.rusting + 0.9, s)) : 0);
  const tx = trainX(s); S.stn.train.position.set(tx, 0, 4); S.stn.train.rotation.y = PI;
  for (const w of [...S.stn.loco.userData.wheels, ...S.stn.car.userData.wheels]) w.rotation.y = -tx / 1.2;
  S.ho.group.userData.phone = null;

  // props
  for (const k of ['deed', 'paper', 'flyPaper', 'stamp', 'bag', 'bag2', 'phone', 'case', 'stack', 'box', 'cert', 'tw', 'rope']) P[k].visible = false;
  for (const l of P.letters) l.visible = false; for (const b of P.bills) b.visible = false; for (const p of P.puffs) p.visible = false;
  const deedOn = (a, x) => { if (x.deed && a.root.visible) holdAt(a, x.deed, P.deed, V(0, -0.15, 0), true); };
  deedOn(max, mx); deedOn(leo, lx);
  if (mx.paper) {                                                   // open in both hands, facing him
    const gl = grip(max, 'L'), gr = grip(max, 'R'), mid = gl.clone().lerp(gr, 0.5);
    P.paper.visible = true; P.paper.position.copy(mid).add(V(0, -0.35, 0)).addScaledVector(fwdOf(max), 0.25); P.paper.rotation.set(0, max.root.rotation.y + PI, 0);
    if (mx.paperL) { P.paper.position.copy(grip(max, 'L')).add(V(0, -0.6, 0)); P.paper.rotation.set(0.2, max.root.rotation.y + PI * 0.75, 0); P.paper.scale.setScalar(0.6); } else P.paper.scale.setScalar(1);
  }
  if (SHOT === 'letters' || SHOT === 'money' || SHOT === 'cert') {   // the desk
    if (SHOT === 'letters') { P.tw.visible = true; P.tw.position.copy(K.DESK).add(V(s < T.stampT ? -0.6 : -3.0, K.DESK_Y, -0.9)); P.tw.rotation.set(0, s < T.stampT ? PI : PI - 0.5, 0); }
    if (mx.stampR) { P.stamp.visible = true; P.stamp.position.copy(grip(max, 'R')).add(V(0, 0.1, 0)); P.stamp.rotation.set(0, 0, 0); }
    if (SHOT === 'money') { P.box.visible = true; P.box.position.copy(K.DESK).add(V(2.4, K.DESK_Y, 0.4)); P.box.rotation.set(0, 0, 0);
      const out = K.DESK.clone().add(V(2.4, K.DESK_Y + 1.2, 1.5));
      P.bills.forEach((b, i) => { const ph = ((s * 1.4 + i / P.bills.length) % 1); b.visible = true; b.position.copy(out).add(V(Math.sin(i * 2.7) * 2.2 * ph, 1.6 * ph - 2.6 * ph * ph, 2.2 * ph)); b.rotation.set(-1.2 + ph * 3, i, ph * 4); }); }
    if (SHOT === 'cert') { P.cert.visible = true; P.cert.position.copy(K.DESK).add(V(0, K.DESK_Y + 0.03, 0.2)); P.cert.rotation.set(0, 0, 0); }
  }
  if (SHOT === 'letters' && s > W.invites - 0.2) {                   // the letters fly out to the dealers (toward camera)
    P.letters.forEach((l, i) => { const k = clamp(inv(W.invites - 0.2 + i * 0.12, W.invites + 0.5 + i * 0.12, s)); if (k <= 0) return; l.visible = true;
      l.position.copy(K.DESK).add(V(lerp(0.4, (i - 2) * 3.4 + (i === 2 ? 4 : 0), k), K.DESK_Y + 0.4 + Math.sin(k * PI) * 2.5 + k * 2, lerp(0.2, 9, k))); l.rotation.set(-0.3, k * 6 + i, 0.4 * Math.sin(k * 5)); });
  }
  if (mx.bag && max.root.visible) holdAt(max, mx.bag, P.bag);
  if (mx.bag2 && max.root.visible) holdAt(max, mx.bag2, P.bag2);
  if (lx.bag && leo.root.visible) holdAt(leo, lx.bag, P.bag);
  if (lx.bag2 && leo.root.visible) holdAt(leo, lx.bag2, P.bag2);
  if (SHOT === 'call') { P.phone.visible = true; P.phone.position.copy(H_(0.9, 3.65, -1.6)); P.phone.rotation.set(0, 0, 0); const ear = P.phone.userData.ear;
    if (ex.mia.ear) { const g = grip(mia, 'R'); ear.position.copy(g).sub(P.phone.position).add(V(0, 0.05, 0)); ear.rotation.set(0, 0, 0); } else { ear.position.copy(P.phone.userData.rest); ear.rotation.set(0, 0, 0); } }
  if (mx.case) holdAt(max, 'R', P.case);
  if (SHOT === 'capone' && !mx.case && s > W.gangster - 0.05) { P.case.visible = true; P.case.position.copy(G_(-1.6, 3.6 + 1.85, -2.6)); P.case.rotation.set(0, 0.5, 0); }
  if (ex.noob.stack && noob.root.visible) { P.stack.visible = true; P.stack.position.copy(grip(noob, 'R')).add(V(0, 0.1, 0)); P.stack.rotation.set(0, noob.root.rotation.y, 0); }
  if (SHOT === 'rope') { P.rope.visible = true; P.rope.position.copy(J_(0, 21.7, 0.4)); P.rope.rotation.set(0, 0, 0); }
  if (SHOT === 'train' || SHOT === 'again') { const ch = S.stn.loco.userData.chimney.clone(); S.stn.loco.localToWorld(ch); puffs(ch, s, 0, 6, SHOT === 'train' ? 1 : -1); }
  if (SHOT === 'flee') { const f = S.dk.ship.userData.funnels; const a0 = f[0].clone(), a1 = f[1].clone(); S.dk.ship.localToWorld(a0); S.dk.ship.localToWorld(a1); puffs(a0, s, 0, 5); puffs(a1, s + 0.3, 5, 5); }

  // cameras
  const mp = max.root.position.clone(), hdM = max.root.visible ? headPos(max) : V();
  switch (SHOT) {
    case 'hook': { const k = easeOut(clamp(t / T.buyer)); look(stage, P_(lerp(0.6, 0.3, k), 2.4, lerp(51.5, 50.5, k)), P_(0, 25, 0), 62, 30); break; }
    case 'buyer': look(stage, P_(4.6, 5.0, 47.5), P_(0.2, 4.2, 29), 46, 22); break;
    case 'news': {
      if (s < W.rusting - 0.1) {                                    // the paper spins in toward the camera
        look(stage, P_(6, 3.0, 4), P_(10, 30, -28), 56, 60);
        const c = stage.camera, f = V(0, 0, -1).applyQuaternion(c.quaternion), k = easeOut(clamp(inv(T.news, T.news + 0.55, s)));
        P.flyPaper.visible = true; P.flyPaper.position.copy(c.position).addScaledVector(f, lerp(30, 3.7, k)).add(V(0, -1.05, 0).applyQuaternion(c.quaternion));
        P.flyPaper.quaternion.copy(c.quaternion); P.flyPaper.rotateZ((1 - k) * 6.3); P.flyPaper.scale.setScalar(1);
      } else { const k = easeOut(clamp(inv(W.rusting - 0.1, T.idea, s))); look(stage, P_(lerp(4, 6, k), 2.6, lerp(-2, 0, k)), P_(16, lerp(10, 18, k), -24), 50, 40); }
      break;
    }
    case 'idea': look(stage, P_(-4.6, 4.8, 39.5), P_(-7.3, 4.6, 31.4), 40, 14); break;
    case 'letters': {
      if (s < T.stampT) look(stage, O_(2.0, 8.0, -8.5), O_(-0.6, 3.6, -3.8), 46, 12);
      else look(stage, O_(2.2, 6.4, 6.5), O_(0, 4.5, -5.2), 46, 14);
      break;
    }
    case 'hotel': { const k = easeOut(u); look(stage, H_(lerp(-17.5, -16.5, k), 7.4, lerp(10.5, 9.5, k)), H_(1, 3.6, -2.5), 50, 26); break; }
    case 'whisper': look(stage, H_(-4.0, 6.0, 8.5), H_(-7.6, 4.6, -1.2), 48, 16); break;
    case 'poisson': look(stage, H_(-4.4, 6.0, 6.5), H_(-5, 5.0, -2.9), 44, 10); break;
    case 'bribe': look(stage, H_(-9.8, 5.4, 14.5), H_(-9.8, 4.4, 2.2), 46, 14); break;
    case 'train': look(stage, S_(-5, 4.6, -13), S_(-1, 4.4, 2.5), 52, 24); break;
    case 'shame': { const k = easeOut(u); look(stage, P_(lerp(5.8, 4.6, k), 4.2, lerp(5.0, 3.2, k)), P_(2.2, 5.2, -6), 50, 30); break; }
    case 'again': look(stage, S_(9, 4.8, -12), S_(3, 4.0, 0.5), 50, 20); break;
    case 'call': look(stage, H_(1.2, 5.6, 5.8), H_(0.2, 4.6, -2.6), 44, 10); break;
    case 'flee': look(stage, D_(mp.x - 9, 6.0, 16), D_(mp.x + 1, 4.5, 2), 52, 30); break;
    case 'capone': look(stage, G_(3.0, 6.6, 12.5), G_(-2.2, 4.6, -2.6), 58, 14); break;
    case 'money': look(stage, O_(1.2, 6.4, 7.5), O_(1.0, 4.6, -4.6), 50, 14); break;
    case 'rope': { const yy = Math.max(hdM.y, 4.6); look(stage, J_(6.5, yy + 1.0, 15.5), J_(-0.5, yy - 0.8, 0), 50, 20); break; }
    case 'cert': { const c = stage.camera; c.position.copy(K.DESK).add(V(0, K.DESK_Y + 10.2, 0.6)); c.fov = 64; c.updateProjectionMatrix(); c.up.set(0, 0, -1); c.lookAt(K.DESK.clone().add(V(0, K.DESK_Y, 0.55))); stage.aimSun(K.DESK.clone(), 10); break; }
    case 'cta': look(stage, P_(0.6, 2.4, 51.5), P_(0, 25, 0), 62, 30); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera; scr = {};
  const proj = (p) => { const q = p.clone().project(cam); return [(q.x + 1) / 2 * 1080, (1 - q.y) / 2 * 1920]; };
  for (const [k, a] of Object.entries({ max, leo, mia, noob })) if (a.root.visible) scr[k] = proj(headPos(a));
  if (SHOT === 'cert') { const base = P.cert.position; scr.occ = proj(base.clone().add(V(-2.5, 0, -0.7))); scr.l1 = proj(base.clone().add(V(-2.5, 0, 0.15))); scr.l2 = proj(base.clone().add(V(-2.5, 0, 0.95))); }
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
function stampText(g, s, text, x, y, k, rot = -0.18, color = '#e0262f', size = 110) {     // a rubber-stamp word
  if (k <= 0) return;
  const sc = lerp(2.2, 1, clamp(k)); g.save(); g.globalAlpha = clamp(k * 1.5); g.translate(x * s, y * s); g.rotate(rot); g.scale(sc, sc);
  g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60, h = size * 1.35;
  g.lineWidth = 12 * s; g.strokeStyle = color; roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 18 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6 * s); g.restore();
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
function datePill(g, s, text, k = 1) {
  if (k <= 0) return;
  g.save(); g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60;
  g.translate((60 + w / 2) * s, 270 * s); g.scale(k, k);
  roundRect(g, -w / 2 * s, -42 * s, w * s, 84 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
function nameTag(g, s, name, role, x, y, k) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  g.font = `${54 * s}px "Luckiest Guy"`; const w1 = g.measureText(name).width / s; g.font = `800 ${30 * s}px Montserrat`; const w2 = g.measureText(role).width / s;
  const w = Math.max(w1, w2) + 70;
  roundRect(g, -w / 2 * s, -62 * s, w * s, 124 * s, 24 * s); g.fillStyle = 'rgba(14,18,34,.88)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText(name, 0, -14 * s);
  g.font = `800 ${30 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText(role, 0, 34 * s); g.restore();
}
function bulb(g, s, x, y, k) {                                      // the idea lightbulb
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  g.strokeStyle = '#ffd23f'; g.lineWidth = 8 * s; for (let i = 0; i < 8; i++) { const a = -PI / 2 + (i - 3.5) * 0.38; g.beginPath(); g.moveTo(Math.cos(a) * 78 * s, Math.sin(a) * 78 * s); g.lineTo(Math.cos(a) * 108 * s, Math.sin(a) * 108 * s); g.stroke(); }
  g.beginPath(); g.arc(0, 0, 58 * s, 0, 7); g.fillStyle = '#fff3a6'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#16141f'; g.stroke();
  g.fillStyle = '#9aa0ad'; g.fillRect(-26 * s, 52 * s, 52 * s, 34 * s); g.strokeRect(-26 * s, 52 * s, 52 * s, 34 * s); g.restore();
}
function typed(g, s, text, x, y, size, color, k) {                  // typewriter reveal on the certificate
  const n = Math.round(text.length * clamp(k)); if (n <= 0) return;
  g.save(); g.font = `bold ${size * s}px "Courier New", monospace`; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text.slice(0, n), x * s, y * s); g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'hook' && t > W.sold - 0.1) stampText(g, s, 'SOLD!', 540, 420, pop(t, W.sold - 0.1, 0.18, 1.6), -0.14);
  if (SHOT === 'buyer' && scr.leo && t > W.police1 - 0.2) bigText(g, s, '?!', Math.min(scr.leo[0] + 120, 960), scr.leo[1] - 170, 110, '#ffd23f', pop(t, W.police1 - 0.2), 0.1);
  if (SHOT === 'news' || SHOT === 'idea') datePill(g, s, 'PARIS · 1925', 1);
  if (SHOT === 'news' && t > W.fortune - 0.15) bigText(g, s, 'A FORTUNE!', 540, 430, 120, '#ffd23f', pop(t, W.fortune - 0.15), -0.04);
  if (SHOT === 'idea') { nameTag(g, s, 'VICTOR LUSTIG', 'CON MAN', 540, 440, pop(t, W.victor - 0.05)); if (t > W.idea - 0.15 && scr.max) bulb(g, s, scr.max[0], scr.max[1] - 230, pop(t, W.idea - 0.15, 0.2, 2.4)); }
  if (SHOT === 'letters' && t > T.stampT) stampText(g, s, 'OFFICIAL', 540, 420, pop(t, T.stampT + 0.15, 0.16, 1.6), -0.12, '#2a62c9', 100);
  if (SHOT === 'letters' && t > W.dealers1 - 0.1) pill(g, s, 'TO: SCRAP DEALERS', 540, 560, pop(t, W.dealers1 - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 46);
  if (SHOT === 'hotel') pill(g, s, 'FANCY HOTEL', 540, 360, pop(t, W.hotel - 0.2), '#ffd23f');
  if (SHOT === 'whisper') {
    if (t > W.secret - 0.1) stampText(g, s, 'TOP SECRET', 540, 400, pop(t, W.secret - 0.1, 0.16, 1.6), -0.12);
    if (t > W.wants1 - 0.15 && scr.max) bubble(g, s, ['WHO WANTS', 'THE METAL?'], scr.max[0], Math.min(scr.max[1] - 120, 900), pop(t, W.wants1 - 0.15, 0.2, 2), 56);
  }
  if (SHOT === 'poisson') nameTag(g, s, 'ANDRE POISSON', 'SCRAP DEALER', 540, 420, pop(t, W.poisson1 - 0.1));
  if (SHOT === 'bribe') { if (t > W.bribe - 0.15) pill(g, s, '+ A LITTLE BRIBE', 540, 380, pop(t, W.bribe - 0.15), '#7CFC9A'); if (t > W.pays - 0.1) pill(g, s, 'PAID!', 540, 500, pop(t, W.pays - 0.1), '#ffd23f'); }
  if (SHOT === 'train' && t > W.country - 0.3) pill(g, s, 'BYE, FRANCE!', 540, 380, pop(t, W.country - 0.3), '#ffd23f', 'rgba(14,18,34,.85)', 52);
  if (SHOT === 'shame' && t > W.embarrassed - 0.15) stampText(g, s, 'SCAMMED', 540, 420, pop(t, W.embarrassed - 0.15, 0.16, 1.6), -0.14);
  if (SHOT === 'again' && t > W.again1 - 0.25) bigText(g, s, 'AGAIN?!', 540, 420, 150, '#ffd23f', pop(t, W.again1 - 0.25), -0.05);
  if (SHOT === 'call' && t > W.police2 - 0.2) stampText(g, s, 'POLICE!', 540, 420, pop(t, W.police2 - 0.2, 0.16, 1.6), -0.1, '#2a62c9', 120);
  if (SHOT === 'flee' && t > W.america - 0.2) pill(g, s, 'NEXT STOP: AMERICA', 540, 380, pop(t, W.america - 0.2), '#ffd23f', 'rgba(14,18,34,.85)', 50);
  if (SHOT === 'capone' && t > W.gangster - 0.15) nameTag(g, s, 'AL CAPONE', 'GANGSTER', 540, 400, pop(t, W.gangster - 0.15));
  if (SHOT === 'money') { datePill(g, s, 'AMERICA · 1935', 1); if (t > W.caught1 - 0.1) stampText(g, s, 'CAUGHT!', 540, 440, pop(t, W.caught1 - 0.1, 0.16, 1.6), -0.12); }
  if (SHOT === 'rope') { if (t > W.rope - 0.1 && t < W.caught2 - 0.3) pill(g, s, 'ESCAPE!', 540, 380, pop(t, W.rope - 0.1), '#7CFC9A'); if (t > W.caught2 - 0.2) stampText(g, s, 'CAUGHT AGAIN', 540, 420, pop(t, W.caught2 - 0.2, 0.16, 1.6), -0.12, '#e0262f', 96); }
  if (SHOT === 'cert' && scr.l1) {
    typed(g, s, 'APPRENTICE SALESMAN', scr.l1[0], scr.l1[1], 44, '#1c2a4a', inv(W.apprentice - 0.1, W.salesman + 0.35, t));
    if (t > W.counterfeiter - 0.2) bigText(g, s, '...AND COUNTERFEITER', 540, scr.l2[1] + 10, 64, '#e0262f', pop(t, W.counterfeiter - 0.2), -0.03, '#ffffff');
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

export const cast = () => ({ max, leo, mia, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
export const W_SOLD = W.sold;
