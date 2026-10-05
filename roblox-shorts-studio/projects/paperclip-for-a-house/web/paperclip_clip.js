// He Traded A Paperclip For A House. Web renderer + Roblox R6 pack. True story (Kyle MacDonald, 2005-06): one red
// paperclip, traded up 14 times: fish pen, doorknob, camp stove, generator ... a year's rent, an afternoon with a rock
// star, then "the dumbest trade ever" (a snow globe), which a snow-globe-collecting actor swaps for a movie part, which a
// tiny Canadian town swaps for a two-storey house. Max is the trader; Mia, Leo, Skye and the Noob trade with him; Leo is
// the actor; the Noob is the mayor; recoloured Noobs are the townsfolk.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack } from '../../../web/lib/anim.js';
import { shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect, chat } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import {
  street, plaza, globeRoom, town, paperclip, fishPen, doorknob, campStove, generator, snowmobile, ticket, boxTruck, goldRecord,
  keyWithTag, vipPass, snowGlobe, clapperboard, STREET, PLAZA, ROOM, TOWN, HOUSE, TOWN_STAGE, PORCH_Y, PATH_Z, HOME_X, TRADER_X,
} from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Traded A Paperclip For A House' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2, CHEAT = 0.4;              // traders face each other along x, both cheated 0.4 rad toward the camera (+z)
const FACE_R = R90 - CHEAT, FACE_L = -R90 + CHEAT;  // heading to face +x / -x

// ---------- key times (all on the narration) ----------
const SW = [W.fish + 0.05, W.knob1 + 0.05, W.stove1 + 0.05, W.generator + 0.05];          // the four street swaps
const T = {
  plan: W.plan - 0.15, someone: W.someone - 0.1, tbt: W.tbt - 0.1, then: W.then - 0.1,
  passIn: W.then + 0.25, skyeArrive: W.rock - 0.1, globe: W.globe1 + 0.05, people: W.people - 0.1,
  but: W.but - 0.1, want: W.wants1 - 0.1, so: W.so - 0.1, role: W.movie2 + 0.05, tiny: W.tiny - 0.1, aud: W.auditions - 0.1,
  pay: W.pay - 0.1, house: W.house2 + 0.05, final: W.oneyear - 0.1, cta: W.follow - 0.15,
};
const MONTAGE = [[W.snowmobile, 6], [W.trip, 7], [W.truck, 8], [W.record, 9], [W.rent, 10], [T.passIn, 11]];

// item index -> name (the 14 trades; #5, the "instant party", isn't in the narration and is never shown)
const ITEMS = ['RED PAPERCLIP', 'FISH PEN', 'DOORKNOB WITH A FACE', 'CAMPING STOVE', 'GENERATOR', 'INSTANT PARTY', 'SNOWMOBILE', 'TRIP',
  'BOX TRUCK', 'RECORD DEAL', '1 YEAR FREE RENT', 'AFTERNOON WITH A ROCK STAR', 'SNOW GLOBE', 'MOVIE ROLE', 'HOUSE'];
const LEVEL = [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7, 0.77, 0.3, 0.87, 1];
// What Max has at time t (index into ITEMS) and when he got it.
const EVENTS = [[SW[0], 1], [SW[1], 2], [SW[2], 3], [SW[3], 4], ...MONTAGE, [T.globe, 12], [T.role, 13], [T.house, 14]];
function itemAt(t) { let k = 0, at = -1; for (const [e, i] of EVENTS) if (t >= e) { k = i; at = e; } return { k, at }; }

// ---------- places ----------
// Every trade is staged along x: Max on the left facing +x (his right hand toward the camera), the other trader on the
// right facing -x using the LEFT hand (also toward the camera), GAP studs apart, both cheated toward the camera.
const GAP = 3.6;
const MAX_STOP = TRADER_X.map((x, i) => V(x - (i === 3 ? GAP + 1.0 : GAP), 0, PATH_Z));   // two carried boxes need more room
const TRADER_POS = TRADER_X.map((x) => V(x, 0, PATH_Z));
const HOME = V(HOME_X, 0, PATH_Z);
const PF = PLAZA.y + 0.5, P = (x, z, y = PF) => V(PLAZA.x + x, y, PLAZA.z + z);
const PMAX = P(0, 1.5), PSKYE0 = P(15, 1.5), PSKYE = P(GAP, 1.5), PED = P(-3.8, -1.6, 1.0);
const RM = (x, z, y = 0) => V(ROOM.x + x, y, ROOM.z + z);
const TW = (x, z, y = 0) => V(TOWN.x + x, y, TOWN.z + z);
const HS = (x, z, y = 0) => V(HOUSE.x + x, y, HOUSE.z + z);
const STAGE_TOP = 1.35;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);           // camera points: (x, y, z) relative to a place
const PC = at(PLAZA), RC = at(ROOM), TC = at(TOWN), HC = at(HOUSE);

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, folk = [], ST, PZ, RMS, TN, cam, SHOT = 'hook';
const PROPS = {};
let puffs = [];
const FOLK_SHIRT = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#3a86ff'], FOLK_PANTS = ['#264653', '#1d3557', '#495057', '#5c4033', '#2b2d42'];
const FOLK_SKIN = ['#c68642', '#f1c27d', '#8d5524', '#e0ac69', '#d29a66'];
export async function setup(stage) {
  const { scene } = stage;
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'surprised', 'determined', 'smug', 'laugh', 'nervous', 'confused', 'shocked', 'cool', 'love'] }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'laugh', 'wink'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'surprised', 'love', 'laugh', 'smug', 'cool'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'wink', 'laugh', 'surprised'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'surprised', 'laugh'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  for (let i = 0; i < 5; i++) {                           // townsfolk: Noob rigs in their own colours
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'surprised'] });
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      const c = o.name === 'Torso' ? FOLK_SHIRT[i] : /Leg/.test(o.name) ? FOLK_PANTS[i] : FOLK_SKIN[i];
      o.material = o.material.clone(); o.material.map = null; o.material.color.set(c); o.material.needsUpdate = true;
    });
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'clap', 'laugh_big', 'point_forward', 'talk', 'hero']) A[n] = await loadAnimation(n);
  ST = street(scene); PZ = plaza(scene); RMS = globeRoom(scene); TN = town(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); };
  add('clip', paperclip()); add('pen', fishPen()); add('knob', doorknob()); add('stove', campStove()); add('gen', generator());
  add('sled', snowmobile()); add('ticket', ticket()); add('truck', boxTruck()); add('record', goldRecord());
  add('rent', keyWithTag(['1 YEAR', 'FREE RENT'])); add('pass', vipPass()); add('globe', snowGlobe(0.42, 'star'));
  add('board', clapperboard()); add('key', keyWithTag(['HOUSE', 'KEY'], { size: 1.7, tagColor: '#ffffff' }));
  for (let i = 0; i < 7; i++) { const p = puff(); p.visible = false; scene.add(p); puffs.push(p); }
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above)
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = a.distanceTo(b), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
// arm poses: [side, spread, forward] (forward < 0 raises the arm in front). Written for the right hand; side() mirrors.
const HOLD = [['R', 0.08, -0.55]];                       // item upright in the fist, in front of the hip
const OFFER = [['R', 0.06, -1.45]];                      // arm straight out in front
const SHOW = [['R', 0.16, -2.3]];                        // held up high
const PRESENT = [['R', 0.3, -1.65]];                     // held up beside the face, to the camera
const CARRY = [['L', 0.02, -1.38], ['R', 0.02, -1.38]];  // both forearms out, something resting on them
const side = (arms, h) => (h === 'L' ? arms.map(([sd, u, f]) => [sd === 'R' ? 'L' : 'R', u, f]) : arms);
const mixArms = (a, b, k) => b.map(([sd, u, f]) => { const o = a.find((q) => q[0] === sd) || [sd, 0, 0]; return [sd, lerp(o[1], u, k), lerp(o[2], f, k)]; });
const TWO = new Set([3, 4]);                             // items carried on both forearms
// Arms around a handover at S (before: item held, after: item received): raise to OFFER, pass, lower again.
function tradeArms(s, S, before, after, h = 'R') {
  const up = smooth(inv(S - 0.7, S - 0.3, s)), down = smooth(inv(S + 0.25, S + 0.65, s));
  if (s < S) return TWO.has(before) ? CARRY : side(mixArms(HOLD, OFFER, up), h);
  if (TWO.has(after)) return CARRY;
  return side(mixArms(OFFER, HOLD, down), h);
}
const holdArms = (k, h = 'R') => (TWO.has(k) ? CARRY : side(HOLD, h));

function maxAt(s) {
  const { k } = itemAt(s);
  let x = base(HOME, 0.25, 'happy');
  if (s < T.tbt) {                                          // the street
    if (s < T.plan) { x.arms = PRESENT; x.face = s > W.bigger - 0.3 ? 'laugh' : 'happy'; return x; }
    const d0 = HOME.distanceTo(MAX_STOP[0]), t0 = T.plan + 0.45;
    moveTo(x, HOME, MAX_STOP[0], t0, s, 12, FACE_R); x.arms = HOLD; x.face = 'determined';
    if (s < t0) { x.heading = lerp(0.25, R90, smooth(inv(T.plan, t0, s))); x.arms = mixArms(PRESENT, HOLD, smooth(inv(T.plan, t0, s))); }
    for (let i = 0; i < 4; i++) {
      const S = SW[i];
      if (i > 0) {
        if (s < SW[i - 1] + 0.45) break;                    // still at the previous trader
        const d = MAX_STOP[i - 1].distanceTo(MAX_STOP[i]), w0 = SW[i - 1] + 0.45, speed = clamp(d / Math.max(0.3, S - 0.5 - w0), 12, 16);
        moveTo(x, MAX_STOP[i - 1], MAX_STOP[i], w0, s, speed, FACE_R); x.arms = holdArms(i);
      }
      if (!x.moving && s >= S - 1.0) x.arms = tradeArms(s, S, i, i + 1);
      x.face = s > S + 0.15 ? (i === 1 ? 'laugh' : 'happy') : 'determined';
    }
    if (s > SW[3] + 0.3) x.face = 'smug';
    return x;
  }
  if (s < T.but) {                                          // the plaza
    x = base(PMAX, 0.15, 'happy');
    const ev = MONTAGE.filter(([e]) => s >= e).pop();
    if (s < W.snowmobile) { x.layers = [['point_forward', s - T.tbt, 1, false]]; x.heading = -0.5; }
    else if ([7, 9, 10, 11].includes(k)) { x.arms = mixArms(HOLD, PRESENT, smooth(inv(ev[0], ev[0] + 0.25, s))); x.face = k === 11 ? 'cool' : 'happy'; }
    else { x.layers = [['proud', s - ev[0], 1, false]]; x.face = k === 8 ? 'surprised' : 'laugh'; if (k === 6) x.heading = -0.35; }
    if (s >= W.afternoon - 0.3) {                          // turns to Skye and swaps the pass for the snow globe
      x.heading = lerp(0.15, FACE_R, smooth(inv(W.afternoon - 0.3, W.afternoon + 0.1, s))); x.layers = [['idle', s]];
      x.arms = s < T.globe - 0.7 ? mixArms(PRESENT, HOLD, smooth(inv(W.afternoon - 0.3, W.afternoon + 0.1, s))) : tradeArms(s, T.globe, 11, 12);
      x.face = s >= T.globe ? 'happy' : 'cool';
    }
    if (s >= T.people) { x.heading = lerp(FACE_R, 0.1, smooth(inv(T.people, T.people + 0.35, s))); x.layers = [['shrug', s - T.people, 1, false]]; x.arms = mixArms(HOLD, PRESENT, smooth(inv(T.people, T.people + 0.35, s))); x.face = 'nervous'; }
    if (s >= W.dumbest) x.face = 'confused';
    return x;
  }
  if (s < T.tiny) {                                         // the snow-globe room (comes into shot when Leo wants the globe)
    x = base(RM(-GAP / 2, 0.6), FACE_R, 'smug'); x.visible = s >= T.want - 0.05;
    x.arms = s < T.so + 0.3 ? mixArms(HOLD, PRESENT, smooth(inv(T.want, T.want + 0.3, s))) : tradeArms(s, T.role, 12, 13);
    if (s >= T.so + 0.3 && s < T.role) x.arms = mixArms(PRESENT, OFFER, smooth(inv(T.so + 0.3, T.role - 0.35, s)));
    if (s >= T.role) x.face = 'surprised';
    if (s >= T.role + 0.4) { x.face = 'laugh'; x.arms = mixArms(HOLD, PRESENT, smooth(inv(T.role + 0.4, T.role + 0.7, s))); }
    return x;
  }
  if (s < T.aud) {                                          // walks into town
    x = base(TW(-38, 1.0), R90, 'happy');
    moveTo(x, TW(-38, 1.0), TW(-16, 1.0), T.tiny + 0.5, s, 12, 0.5); x.arms = HOLD;
    if (!x.moving && s > T.tiny + 1) x.face = 'surprised';
    return x;
  }
  if (s < T.pay) {                                          // casting the part at the audition stage
    x = base(TW(-7.4, -1.4), R90 - 0.35, 'happy');
    const clapAt = W.auditions + 0.35;
    x.arms = mixArms(HOLD, PRESENT, smooth(inv(clapAt - 0.5, clapAt - 0.15, s)));
    x.face = s > clapAt ? 'laugh' : 'happy';
    return x;
  }
  if (s < T.final) {                                        // the mayor brings the house key
    x = base(HS(-GAP / 2, 6), FACE_R, 'happy'); x.arms = tradeArms(s, T.house, 13, 14);
    if (s > T.house + 0.2) x.face = 'shocked';
    if (s > T.house + 0.9) { x.face = 'laugh'; x.arms = mixArms(HOLD, SHOW, smooth(inv(T.house + 0.9, T.house + 1.2, s))); }
    return x;
  }
  x = base(HS(0, 1.4, PORCH_Y), 0.05, 'laugh');            // on the porch of his house
  x.arms = SHOW; if (s > W.clip2) x.face = 'happy'; if (s > T.cta) x.face = 'laugh';
  return x;
}

// the street traders: waiting with their item, swap, then walk home up the garden path
const TRADERS = () => [mia, leo, skye, noob];
const TRADER_FACE = [['happy', 'wink'], ['happy', 'laugh'], ['happy', 'wink'], ['happy', 'laugh']];
function traderAt(i, s) {
  const S = SW[i], x = base(TRADER_POS[i], FACE_L, TRADER_FACE[i][0]);
  x.arms = tradeArms(s, S, i + 1, i, 'L');                 // they give item i+1 and get item i
  if (s >= S + 0.1) x.face = TRADER_FACE[i][1];
  if (s >= S + 0.6) {                                       // home with it
    moveTo(x, TRADER_POS[i], V(TRADER_X[i], 0, -4.2), S + 0.6, s, 12, 0);
    if (x.moving) x.arms = holdArms(i, 'L');
  }
  return x;
}
function skyeAt(s) {                                        // Skye brings the snow globe to the plaza, leaves with the pass
  const x = base(PSKYE0, FACE_L, 'happy');
  x.visible = s >= W.afternoon - 1.2;
  moveTo(x, PSKYE0, PSKYE, T.skyeArrive - PSKYE0.distanceTo(PSKYE) / 12, s, 12, FACE_L);
  x.arms = x.moving ? holdArms(12, 'L') : tradeArms(s, T.globe, 12, 11, 'L');
  if (s >= T.globe + 0.1) x.face = 'wink';
  if (s >= T.people + 0.3) { moveTo(x, PSKYE, P(17, 4), T.people + 0.3, s, 12, R90); x.arms = holdArms(11, 'L'); x.face = 'laugh'; }
  return x;
}
function leoActorAt(s) {                                    // the actor in his snow-globe room
  const x = base(RM(GAP / 2, 0.6), -0.15, 'cool');
  x.layers = [['proud', s - T.but, 1, false]];
  if (s >= T.want - 0.1) { x.layers = [['idle', s]]; x.heading = lerp(-0.15, FACE_L, smooth(inv(T.want - 0.1, T.want + 0.3, s))); x.face = 'love'; }
  if (s >= T.so) { x.face = 'happy'; x.arms = tradeArms(s, T.role, 13, 12, 'L'); if (s < T.role - 0.7) x.arms = side(mixArms(HOLD, OFFER, smooth(inv(T.so, T.so + 0.4, s))), 'L'); }
  if (s >= T.role + 0.1) x.face = 'love';
  if (s >= T.role + 0.65) x.arms = side(mixArms(HOLD, PRESENT, smooth(inv(T.role + 0.65, T.role + 0.95, s))), 'L');
  return x;
}
// the mayor (the Noob): waiting by the walk with the key, swaps it for the movie part, then claps in the yard
function mayorAt(s) {
  const x = base(HS(GAP / 2, 6), FACE_L, 'happy');
  x.arms = tradeArms(s, T.house, 14, 13, 'L');
  if (s >= T.house + 0.1) x.face = 'laugh';
  if (s >= T.final) { x.pos = HS(4.2, 7.0); x.heading = -R90 - 0.5; x.layers = [['clap', s - T.final, 1, true]]; x.arms = []; }
  return x;
}
// townsfolk: on main street as Max walks in, two in the audition queue and one on stage, then cheering in the yard
const QUEUE = [TW(0.2, -1.2), TW(1.9, -1.2)];
const YARD = [HS(-3.6, 4.6), HS(-5.8, 5.6), HS(3.8, 4.4), HS(6.0, 5.4), HS(-4.2, 7.4)];
function folkAt(i, s) {
  const x = base(TW(-22 + i * 4.5, -2.6), 0.3 - i * 0.15, 'happy');
  if (s < T.aud) { x.layers = [[i % 2 ? 'idle' : 'talk', s + i]]; if (s > W.part2) x.face = 'surprised'; return x; }
  if (s < T.pay) {
    if (i === 4) { x.pos = TW(-4, -5.2, STAGE_TOP); x.heading = 0.15; x.layers = [[s < W.auditions + 0.5 ? 'hero' : 'laugh_big', s - T.aud, 1, false]]; x.face = 'laugh'; }
    else if (i < 2) { x.pos = QUEUE[i]; x.heading = FACE_L + 0.5; x.layers = [['idle', s + i]]; x.face = i === 0 ? 'surprised' : 'happy'; }
    else x.visible = false;
    return x;
  }
  if (s < T.final) { x.visible = false; return x; }
  x.pos = YARD[i]; x.heading = (YARD[i].x < HOUSE.x ? R90 : -R90) + (YARD[i].x < HOUSE.x ? 0.5 : -0.5);   // in profile, turned toward the porch and the camera x.layers = [['clap', s - T.final + i * 0.13, 1, true]]; x.face = i % 2 ? 'laugh' : 'happy';
  return x;
}

// ---------- posing ----------
const EUL = new THREE.Euler();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  a.root.updateMatrixWorld(true);
  a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
// Where a held thing sits: in the palm, 1.8 down the arm (the fingertip end is at 2.05).
const grip = (a, sd = 'R', d = 1.8) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(0, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
// Carried in both hands: the box is sized to fit exactly between the forearms (2.0 studs) and centred on them, so the
// hands clasp its sides. CARRY_SCALE / CARRY_DROP: per item, scale and how far its origin (bottom) sits below the arms.
const CARRY_SCALE = { 3: 1.25, 4: 1.15 }, CARRY_DROP = { 3: 0.3, 4: 0.72 };
const onArms = (a, k) => grip(a, 'L', 1.4).lerp(grip(a, 'R', 1.4), 0.5).add(V(0, -CARRY_DROP[k], 0));
// Flat cards are pinched in the fist: their bottom edge sits inside the hand.
const SINK = { 7: 0.32, 9: 0.3, 11: 0.3, 13: 0.3 };
const PROP_OF = ['clip', 'pen', 'knob', 'stove', 'gen', null, 'sled', 'ticket', 'truck', 'record', 'rent', 'pass', 'globe', 'board', 'key'];
const handOf = (a) => (a === max ? 'R' : 'L');
// where item k sits when actor a holds it
function heldAt(a, k) { return TWO.has(k) ? onArms(a, k) : grip(a, handOf(a)).add(V(0, -(SINK[k] || 0), 0)); }

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.plan, 'plan'], [T.someone, 'mia'], [W.same - 0.1, 'leo'], [W.face - 0.15, 'knob'], [W.knob2 - 0.1, 'skye'],
  [W.stove2 - 0.1, 'noob'], [T.tbt, 'mont1'], [W.truck - 0.12, 'mont2'], [W.record - 0.12, 'mont3'], [W.afternoon - 0.15, 'globe'],
  [T.people, 'flood'], [T.but, 'shelves'], [T.want, 'want'], [T.so, 'role'], [T.tiny, 'town'], [T.aud, 'aud'], [T.pay, 'house'],
  [T.final, 'final'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

function light(stage, mode) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const L = {
    day: { sun: 3.1, hemi: 0.55, hemiC: '#d9ecff', env: 0.55, fill: 0.7, rim: 1.1, lamp: 0, wash: 0, slot: 0 },
    room: { sun: 0.0, hemi: 0.5, hemiC: '#fff1e0', env: 0.35, fill: 0.45, rim: 0.7, lamp: 120, wash: 260, slot: 9 },
    golden: { sun: 3.0, hemi: 0.5, hemiC: '#ffe8c8', env: 0.5, fill: 0.6, rim: 1.4, lamp: 0, wash: 0, slot: 0 },
  }[mode];
  stage.sun.intensity = L.sun; stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim; RMS.lamp.intensity = L.lamp; RMS.wash.intensity = L.wash; RMS.slotLight.intensity = L.slot;
  stage.sun.color.set(mode === 'golden' ? '#ffe2b8' : '#fff0dc');
  u.zenith.value.set(mode === 'golden' ? '#5f8fe0' : '#4f8fe6'); u.horizon.value.set(mode === 'golden' ? '#ffe6c4' : '#d7ecff');
}
const SHOT_MODE = { shelves: 'room', want: 'room', role: 'room', town: 'golden', aud: 'golden', house: 'golden', final: 'golden', cta: 'golden' };

// a poof burst: puffs around p, expanding and fading over 0.5 s after t0
const BURSTS = [];
function burst(p, t0, s, size = 1) { BURSTS.push([p, t0, size]); }

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  light(stage, SHOT_MODE[SHOT] || 'day');

  // ---------- cast: only the place we're in ----------
  for (const a of [max, mia, leo, skye, noob, ...folk]) a.root.visible = false;
  place(max, maxAt(s));
  if (s < T.tbt) TRADERS().forEach((a, i) => place(a, traderAt(i, s)));
  else if (s < T.but) place(skye, skyeAt(s));
  else if (s < T.tiny) place(leo, leoActorAt(s));
  else { if (s >= T.pay) place(noob, mayorAt(s)); folk.forEach((f, i) => place(f, folkAt(i, s))); }

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  BURSTS.length = 0;
  const show = (key, pos, heading, scale = 1) => { const o = PROPS[key]; if (!o) return; o.visible = true; o.position.copy(pos); o.rotation.set(0, heading, 0); o.scale.setScalar(scale); };
  const hold = (a, k) => show(PROP_OF[k], heldAt(a, k), a.root.rotation.y, CARRY_SCALE[k] || 1);
  const { k: mk } = itemAt(s);
  // a handover at S: the two items cross between the hands over [S-0.15, S+0.25]; false outside that window
  const swap = (S, giver, gk, taker, tk) => {
    if (s < S - 0.15 || s > S + 0.25) return false;
    const kk = smooth(inv(S - 0.15, S + 0.25, s));
    show(PROP_OF[gk], heldAt(giver, gk).lerp(heldAt(taker, gk), kk), lerp(giver.root.rotation.y, taker.root.rotation.y, kk), CARRY_SCALE[gk] || 1);
    show(PROP_OF[tk], heldAt(taker, tk).lerp(heldAt(giver, tk), kk), lerp(taker.root.rotation.y, giver.root.rotation.y, kk), CARRY_SCALE[tk] || 1);
    return true;
  };
  if (s < T.tbt) {                                          // the street trades
    let busy = false;
    TRADERS().forEach((tr, i) => {
      if (swap(SW[i], max, i, tr, i + 1)) { busy = true; return; }
      if (tr.root.visible) hold(tr, s < SW[i] ? i + 1 : i);
    });
    if (!busy) {
      hold(max, mk);
      if (SHOT === 'knob') PROPS.knob.rotation.y = 0.55 + 0.2 * Math.sin(s * 4);       // turns the face to the camera
    }
  } else if (s < T.but) {                                   // the plaza
    const ev = MONTAGE.filter(([e]) => s >= e).pop();
    if (s < W.snowmobile) show('gen', PED, 0.5 + s * 0.5, 1.5);
    else if (mk === 6) show('sled', PED, 0.5 + s * 0.5, 0.9);
    else if (mk === 8) show('truck', P(2.4, -8.5), 0);
    else if (mk === 11 || mk === 12) {
      if (!swap(T.globe, max, 11, skye, 12)) { hold(max, mk); if (skye.root.visible) hold(skye, s < T.globe ? 12 : 11); }
    } else hold(max, mk);
    if (ev) {
      const n = ev[1], pos = n === 6 ? PED.clone().add(V(0, 1.2, 0)) : n === 8 ? P(2.4, -8.5, 3.0) : heldAt(max, n).add(V(0, 0.7, 0));
      burst(pos, ev[0], s, n === 8 ? 3.2 : n === 6 ? 2.2 : 0.9);
    }
    burst(PED.clone().add(V(0, 1.2, 0)), W.snowmobile, s, 2.2);   // the generator goes
    if (mk === 6) burst(PED.clone().add(V(0, 1.2, 0)), W.trip, s, 2.2);
    if (mk === 8) burst(P(2.4, -8.5, 3.0), W.record, s, 3.2);
  } else if (s < T.tiny) {                                  // the room
    if (!swap(T.role, max, 12, leo, 13)) {
      if (max.root.visible) hold(max, mk);
      if (s >= T.role) hold(leo, 12); else if (s >= T.so) hold(leo, 13);
    }
  } else if (s < T.final) {                                 // town
    if (!swap(T.house, max, 13, noob, 14)) { hold(max, mk); if (noob.root.visible) hold(noob, s < T.house ? 14 : 13); }
  } else hold(max, 14);
  // the clapperboard: snaps shut for "action" at the auditions, and once when Max gets it
  if (PROPS.board.visible) {
    const ca = W.auditions + 0.35, cr = T.role + 0.6;
    let open = 0;
    if (s >= T.aud && s < T.pay) open = 0.6 * (1 - smooth(inv(ca - 0.08, ca, s))) * smooth(inv(ca - 0.6, ca - 0.3, s));
    if (s >= T.role + 0.3 && s < T.tiny) open = 0.6 * smooth(inv(T.role + 0.3, cr - 0.1, s)) * (1 - smooth(inv(cr - 0.08, cr, s)));
    PROPS.board.userData.arm.rotation.z = open;
  }
  PROPS.globe.userData.snow.rotation.y = s * 0.8;
  // poofs
  let pi = 0;
  for (const p of puffs) p.visible = false;
  for (const [pos, t0, size] of BURSTS) {
    const a = (s - t0) / 0.55; if (a < 0 || a > 1) continue;
    for (let j = 0; j < 5 && pi < puffs.length; j++, pi++) {
      const p = puffs[pi], ang = j / 5 * 6.283 + t0 * 3;
      p.visible = true; p.position.copy(pos).add(V(Math.cos(ang) * size * 0.8 * easeOut(a), 0.4 * size * a, Math.sin(ang) * size * 0.5 * easeOut(a)));
      p.scale.setScalar(size * (0.35 + 0.5 * easeOut(a))); p.material.opacity = 0.85 * (1 - a);
    }
  }
  // the empty slot in the room glows brighter when Leo wants the globe
  RMS.slotRing.material.emissiveIntensity = 1.2 + 1.4 * smooth(inv(T.want - 0.1, T.want + 0.4, s)) * (0.8 + 0.2 * Math.sin(s * 8));

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  // a trade two-shot: centred between the pair, wide enough for both (9:16 is narrow)
  const two = (c, d = 15, side = 0) => look(stage, c.clone().add(V(side, 4.7, d)), c.clone().add(V(0, 4.3, -0.3)), 50, 18);
  switch (shot.id) {
    case 'hook': look(stage, HOME.clone().add(V(lerp(-0.4, -0.6, u), 4.8, lerp(9.8, 9.0, u))), HOME.clone().add(V(-0.7, 4.5, 0)), 44, 12); break;
    case 'plan': look(stage, V(mp.x + 8.5, 4.6, PATH_Z + 6.5), V(mp.x + 1.2, 3.9, PATH_Z - 0.4), 48, 16); break;
    case 'mia': two(TRADER_POS[0].clone().add(V(-GAP / 2, 0, 0)), lerp(15.5, 14.5, u)); break;
    case 'leo': two(TRADER_POS[1].clone().add(V(-GAP / 2, 0, 0)), lerp(15.2, 14.4, u)); break;
    case 'knob': { const g = PROPS.knob.position.clone().add(V(0, 0.62, 0)); look(stage, g.clone().add(V(1.9, 0.55, 3.1)), g, 40, 8); break; }
    case 'skye': two(TRADER_POS[2].clone().add(V(-GAP / 2, 0, 0)), lerp(15.2, 14.4, u)); break;
    case 'noob': two(TRADER_POS[3].clone().add(V(-GAP / 2 - 0.5, 0, 0)), lerp(17, 16, u), 0.4); break;
    case 'mont1': look(stage, PC(lerp(-1.2, -1.5, u), 5.2, lerp(18.5, 17, u)), PC(-1.6, 3.4, -1), 50, 20); break;
    case 'mont2': look(stage, PC(lerp(2.0, 1.6, u), 6.6, lerp(23, 22, u)), PC(1.6, 3.8, -3.5), 50, 24); break;
    case 'mont3': look(stage, PC(lerp(0.4, 0.2, u), 5.0, lerp(12, 11, u)), PC(-0.4, 4.5, 1.5), 46, 12); break;
    case 'globe': two(P(GAP / 2, 1.5), lerp(15.2, 14.4, u)); break;
    case 'flood': look(stage, PC(lerp(0.4, 0.2, u), 5.0, lerp(13, 12, u)), PC(0, 4.6, 1.5), 46, 12); break;
    case 'shelves': look(stage, RC(lerp(-1.2, 0.4, u), lerp(6.0, 5.6, u), lerp(18, 16, u)), RC(0, 5.4, -5), 50, 20); break;
    case 'want': two(RM(0, 0.6), lerp(15.2, 14.4, u)); break;
    case 'role': two(RM(0, 0.6), lerp(14.6, 13.8, u), -0.4); break;
    case 'town': { const tx = lerp(-31, -19, smooth(u)); look(stage, TC(tx + 2.5, 4.6, 15.5), TC(tx, 4.6, -0.6), 54, 22); break; }
    case 'aud': look(stage, TC(-3.4, 5.6, 20.5), TC(-3.6, 4.4, -3), 52, 22); break;
    case 'house': look(stage, HC(lerp(0.6, 0.3, u), 4.4, lerp(21.5, 20.5, u)), HC(0, 5.8, 2), 52, 22); break;
    case 'final': case 'cta': { const k = easeOut(clamp((t - T.final) / (T.cta + 1.2 - T.final))); look(stage, HC(lerp(0.5, 3.5, k), lerp(5.2, 9.5, k), lerp(11, 36, k)), HC(lerp(0, -1.2, k), lerp(5.4, 8.0, k), lerp(1.4, 0, k)), 46, 32); break; }
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function clipIcon(g, x, y, h, color = '#e63946', lw = 7) {     // a paperclip outline, h tall, centred at x,y
  const k = h / 1.9; g.save(); g.translate(x, y + h / 2); g.scale(k, -k); g.strokeStyle = color; g.lineWidth = lw / k; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(0.16, 0.55); g.lineTo(0.16, 1.55); g.arc(0, 1.55, 0.16, 0, Math.PI); g.lineTo(-0.16, 0.32); g.arc(0.07, 0.32, 0.23, Math.PI, 2 * Math.PI); g.lineTo(0.3, 1.62); g.arc(0, 1.62, 0.3, 0, Math.PI); g.lineTo(-0.3, 0.62); g.stroke(); g.restore();
}
function houseIcon(g, x, y, w, color = '#ffd23f') {
  g.save(); g.translate(x, y); g.fillStyle = color; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(0, -w * 0.45); g.lineTo(w / 2, 0); g.closePath(); g.fill();
  g.fillRect(-w * 0.36, 0, w * 0.72, w * 0.5); g.fillStyle = '#16182a'; g.fillRect(-w * 0.1, w * 0.2, w * 0.2, w * 0.3); g.restore();
}
function wrap(g, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
// The Roblox-style trade window: TRADE #n, GIVE (left) for GET (right), ACCEPT ticks, then TRADED!
function tradeWindow(g, s, t, n, give, get, S, k) {
  if (k <= 0) return;
  g.save(); g.translate(540 * s, 420 * s); g.scale(k, k);
  roundRect(g, -470 * s, -170 * s, 940 * s, 340 * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText(`TRADE #${n}`, 0, -122 * s);
  const accepted = t >= S - 0.05;
  for (const [side, title, item] of [[-1, 'GIVE', give], [1, 'GET', get]]) {
    const cx = side * 235 * s;
    roundRect(g, cx - 205 * s, -85 * s, 410 * s, 215 * s, 22 * s); g.fillStyle = side < 0 ? 'rgba(255,255,255,.08)' : 'rgba(124,252,154,.14)'; g.fill();
    g.lineWidth = 4 * s; g.strokeStyle = accepted ? '#7CFC9A' : 'rgba(255,255,255,.35)'; g.stroke();
    g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText(title, cx, -55 * s);
    g.font = `${46 * s}px "Luckiest Guy"`; const ls = wrap(g, item, 380 * s);
    ls.forEach((l, i) => { g.fillStyle = side < 0 ? '#ffffff' : '#7CFC9A'; g.fillText(l, cx, (25 + (i - (ls.length - 1) / 2) * 52) * s); });
    if (accepted) { const a = easeOutBack(clamp((t - S + 0.05 + (side < 0 ? 0 : 0.12)) / 0.2), 2); if (a > 0) { g.save(); g.translate(cx + 165 * s, 95 * s); g.scale(a, a); g.beginPath(); g.arc(0, 0, 30 * s, 0, 7); g.fillStyle = '#1e9e55'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 7 * s; g.beginPath(); g.moveTo(-13 * s, 0); g.lineTo(-3 * s, 11 * s); g.lineTo(15 * s, -12 * s); g.stroke(); g.restore(); } }
  }
  g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('→', 0, 22 * s);
  g.restore();
}
// The ladder: a horizontal bar under the trade window, paperclip on the left, house on the right, Max's marker at the
// value of what he has now (it drops on the snow globe).
function ladder(g, s, t) {
  if (t < W.plan || t >= T.final + 0.5) return;
  const a = clamp((t - W.plan) / 0.3) * (1 - clamp((t - T.final - 0.2) / 0.3));
  const { k, at } = itemAt(t), prevK = EVENTS.filter(([e]) => e < at).map(([, i]) => i).pop() ?? 0;
  const lv = lerp(LEVEL[prevK], LEVEL[k], easeOutBack(clamp((t - at) / 0.4), 1.4)), x0 = 190, x1 = 880, y = 668, x = lerp(x0, x1, lv);
  const down = k === 12 && t < T.role;
  g.save(); g.globalAlpha = a;
  roundRect(g, (x0 - 24) * s, (y - 22) * s, (x1 - x0 + 48) * s, 44 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.78)'; g.fill();
  const gr = g.createLinearGradient(x0 * s, 0, x * s, 0); gr.addColorStop(0, '#ffd23f'); gr.addColorStop(1, down ? '#ff4d4d' : '#7CFC9A');
  roundRect(g, (x0 - 12) * s, (y - 11) * s, (x - x0 + 24) * s, 22 * s, 11 * s); g.fillStyle = gr; g.fill();
  roundRect(g, 64 * s, (y - 54) * s, 96 * s, 108 * s, 20 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); clipIcon(g, 112 * s, (y - 44) * s, 88 * s);
  roundRect(g, 910 * s, (y - 54) * s, 108 * s, 108 * s, 20 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); houseIcon(g, 964 * s, (y + 6) * s, 72 * s, '#ffd23f');
  if (t < T.final) bigText(g, s, '?', 1010, y - 52, 40, '#ffffff', 1, 0.1);
  g.beginPath(); g.moveTo(x * s, (y - 16) * s); g.lineTo((x - 18) * s, (y - 46) * s); g.lineTo((x + 18) * s, (y - 46) * s); g.closePath(); g.fillStyle = down ? '#ff4d4d' : '#ffffff'; g.fill();
  g.restore();
  if (down && SHOT === 'flood') bigText(g, s, 'DOWNGRADE!', 540, 760, 76, '#ff4d4d', easeOutBack(clamp((t - T.people) / 0.25), 2), -0.06);
}
const FLOOD = [['Noob_2006', '#ffd23f', 'WORST TRADE EVER'], ['xXBloxXx', '#7CFC9A', 'a SNOW GLOBE??'], ['Lily_Plays', '#ff7aa2', 'NOOOOO'], ['ProTrader', '#5ab0ff', 'dumbest decision ever'], ['Kev', '#ffb36b', 'he had a ROCK STAR'], ['Gamer_101', '#c9a0ff', 'its over, no house']];
export function overlay(g, s, t) {
  // hook: the post
  if (t < T.plan + 0.2) {
    const k = t < 0.05 ? 1 : 1, a = 1 - clamp((t - T.plan) / 0.2);
    g.save(); g.globalAlpha = a; g.translate(540 * s, 410 * s); g.scale(k, k);
    roundRect(g, -440 * s, -175 * s, 880 * s, 350 * s, 30 * s); g.fillStyle = 'rgba(255,255,255,.96)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#3a86ff'; g.stroke();
    g.beginPath(); g.arc(-360 * s, -105 * s, 40 * s, 0, 7); g.fillStyle = '#3a86ff'; g.fill(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${44 * s}px "Luckiest Guy"`; g.fillStyle = '#fff'; g.fillText('M', -360 * s, -100 * s);
    g.textAlign = 'left'; g.font = `800 ${34 * s}px Montserrat`; g.fillStyle = '#16182a'; g.fillText('Max  ·  just now', -300 * s, -105 * s);
    g.font = `${72 * s}px "Luckiest Guy"`; g.fillStyle = '#e63946'; g.fillText('FOR TRADE:', -390 * s, -5 * s);
    g.fillStyle = '#16182a'; g.font = `${60 * s}px "Luckiest Guy"`; g.fillText('1 RED PAPERCLIP', -390 * s, 72 * s);
    g.font = `800 ${32 * s}px Montserrat`; g.fillStyle = '#5a6478'; g.fillText(t > W.offers - 0.2 ? 'want something BIGGER!' : '', -390 * s, 130 * s);
    clipIcon(g, 330 * s, -40 * s, 150 * s, '#e63946', 9);
    g.restore();
  }
  ladder(g, s, t);
  // trade windows
  const STREET_TR = SW.map((S, i) => [S, i + 1, ITEMS[i], ITEMS[i + 1]]);
  for (const [S, n, give, get] of STREET_TR) {
    const on = t > S - 1.0 && t < S + 0.85 && SHOT !== 'knob';
    if (on) tradeWindow(g, s, t, n, give, get, S, easeOutBack(clamp((t - S + 1.0) / 0.2), 1.6) * (1 - clamp((t - S - 0.7) / 0.15)));
  }
  if (t >= W.snowmobile - 0.1 && t < W.afternoon - 0.2) {     // montage: the window flips through each trade
    const ev = MONTAGE.filter(([e]) => t >= e - 0.1).pop();
    const n = ev[1], k = Math.min(1, 0.85 + 0.15 * easeOutBack(clamp((t - ev[0] + 0.1) / 0.15), 2));
    tradeWindow(g, s, t, n, ITEMS[n === 6 ? 4 : n - 1], ITEMS[n], ev[0], k);
  }
  if (t > T.globe - 1.0 && t < T.people - 0.05) tradeWindow(g, s, t, 12, ITEMS[11], ITEMS[12], T.globe, easeOutBack(clamp((t - T.globe + 1.0) / 0.2), 1.6));
  if (t > T.role - 1.0 && t < T.role + 0.9) tradeWindow(g, s, t, 13, ITEMS[12], ITEMS[13], T.role, easeOutBack(clamp((t - T.role + 1.0) / 0.2), 1.6) * (1 - clamp((t - T.role - 0.75) / 0.15)));
  if (t > T.house - 1.0 && t < T.final) tradeWindow(g, s, t, 14, ITEMS[13], ITEMS[14], T.house, easeOutBack(clamp((t - T.house + 1.0) / 0.2), 1.6) * (1 - clamp((t - T.final + 0.15) / 0.15)));
  // the internet reacts
  if (SHOT === 'flood') {
    const lines = FLOOD.map(([name, color, text], i) => ({ name, color, text, at: T.people + 0.1 + i * ((W.made - T.people) / FLOOD.length) }));
    chat(g, s, t, lines, null, { x: 190, y: 250, w: 760 });
  }
  // the collection counter
  if (SHOT === 'shelves' && t > W.six - 0.15) {
    const k = easeOut(clamp((t - W.six + 0.15) / 0.9)), n = Math.round(6000 * k);
    bigText(g, s, (n >= 6000 ? '6,000+' : n.toLocaleString('en-US')), 540, 360, 150, '#ffffff', easeOutBack(clamp((t - W.six + 0.15) / 0.2), 1.8), -0.03);
    bigText(g, s, 'SNOW GLOBES', 540, 500, 84, '#9fe3ff', easeOutBack(clamp((t - W.six) / 0.2), 1.8), -0.03);
  }
  if (SHOT === 'want' && t > W.this1 - 0.1) bigText(g, s, 'THE MISSING ONE!', 540, 380, 84, '#ffd23f', easeOutBack(clamp((t - W.this1 + 0.1) / 0.2), 2), -0.05);
  if (SHOT === 'town' && t > W.canada - 0.1) bigText(g, s, 'TINY TOWN, CANADA', 540, 380, 80, '#ffffff', easeOutBack(clamp((t - W.canada + 0.1) / 0.2), 1.8), -0.03);
  // the payoff
  if (t >= T.final && t < T.cta + 0.1) {
    const a = 1 - clamp((t - T.cta) / 0.15);
    g.save(); g.globalAlpha = a;
    if (t > W.oneyear - 0.05) bigText(g, s, '1 YEAR', 300, 360, 110, '#ffffff', easeOutBack(clamp((t - W.oneyear + 0.05) / 0.2), 2), -0.05);
    if (t > W.fourteen - 0.05) bigText(g, s, '14 TRADES', 720, 470, 110, '#ffd23f', easeOutBack(clamp((t - W.fourteen + 0.05) / 0.2), 2), 0.04);
    if (t > W.clip2 - 0.1) {
      const k = easeOutBack(clamp((t - W.clip2 + 0.1) / 0.25), 1.8);
      g.save(); g.translate(540 * s, 660 * s); g.scale(k, k);
      roundRect(g, -330 * s, -95 * s, 660 * s, 190 * s, 40 * s); g.fillStyle = 'rgba(14,18,34,.88)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
      clipIcon(g, -200 * s, -70 * s, 140 * s, '#e63946', 9);
      g.font = `${100 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('→', 0, 8 * s);
      if (t > W.house3 - 0.1) houseIcon(g, 200 * s, 10 * s, 150 * s * easeOutBack(clamp((t - W.house3 + 0.1) / 0.2), 2), '#ffd23f');
      g.restore();
    }
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

export const cast = () => ({ max, mia, leo, skye, noob });
export const TIMES = T;
export const props = () => PROPS;
