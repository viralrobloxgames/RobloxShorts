// The Dog Who Found The World Cup. Web renderer + Roblox R6 pack. True story (March 1966): four months before England
// hosts the World Cup, the trophy is stolen from a guarded glass cabinet at a stamp exhibition in London. A ransom demand
// leads to an arrest at the handover, but the man says he's only a middleman and the trophy stays missing. A week later
// Pickles, a black-and-white collie, drags a newspaper parcel from under a hedge; his owner fears a bomb, tears the paper
// and reads BRAZIL, WEST GERMANY, URUGUAY. The police make him their main suspect and question him till 2:30 a.m. England
// win that summer and Pickles licks the players' plates at the victory dinner. In 1983 the trophy is stolen again in
// Rio, and with no Pickles it's never found. Max is the owner (work jacket); Pickles is the pack golden retriever cut into
// parts and recoloured (animal_collie_parts); Skye is the guard; Leo the football boss and the captain; the Noob the
// middleman; Mia the detective; recoloured Noobs are visitors, guards, police, players and dinner guests.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { loadCreature, poseCreature, creaturePoint, creatureLowest, attachToBody } from '../../../web/lib/creature.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import {
  street, hall, office, park, station, stadium, banquet, rio, dress, kit, trophy, parcel, smallParcel, badge, rotaryPhone, ransomNote,
  crowbar, plate, collar, tongue, medal, std,
  STREET, HALL, OFFICE, PARK, STATION, STADIUM, BANQUET, RIO, HEDGE_Z, PARCEL_SPOT, CASE, PLINTH_H, DESK_TOP, SARGE_DESK, INTERVIEW,
  LINEUP, TABLE_Y, TABLE_Z, RIO_CASE,
} from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Dog Who Found The World Cup' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const SS = at(STREET), HL = at(HALL), OF = at(OFFICE), PK = at(PARK), ST = at(STATION), SD = at(STADIUM), BQ = at(BANQUET), RI = at(RIO);
const DOG_SCALE = 0.62;

// ---------- key times (all on the narration) ----------
const T = {
  inside: W.inside - 0.1, hall: W.week - 0.35, guards: W.guards - 0.1, empty: W.sunday - 0.25, ransom: W.ransom - 0.15,
  handover: W.police1 - 0.1, middle: W.says - 0.15, missing: W.trophy1 - 0.25, walk: W.pickles2 - 0.3, bomb: W.owner - 0.2,
  tear: W.tears - 0.15, names: W.brazil1 - 0.15, desk: W.takes - 0.15, suspect: W.main - 0.2, interview: W.question - 0.15,
  stadium: W.summer - 0.2, dinner: W.players - 0.2, licks: W.licks - 0.15, rio: W.seventeen - 0.15, back: W.stolen2 - 0.1,
  nopickles: W.time - 0.25, never: W.never - 0.15, cta: W.follow - 0.15,
};
T.drag = T.walk + Math.max(1.6, (T.bomb - T.walk) * 0.55);       // the dog reaches the hedge and pulls the parcel out

// ---------- scene ----------
let A = {}, max, mia, leo, skye, noob, dog, folk = [], SX, HA, OFc, PKs, STn, SDm, BQt, RIo, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
let leash = null;
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9', '#a86b3c', '#e8b98a'];
export async function setup(stage) {
  const { scene } = stage;
  [max, mia, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'scared', 'nervous', 'confused', 'sad', 'sleeping', 'determined', 'laugh'] }),
    loadRobloxCharacter('Mia', { expressions: ['suspicious', 'neutral', 'determined', 'happy', 'surprised', 'angry'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'confused', 'shocked', 'surprised', 'laugh', 'determined'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'confused', 'surprised', 'shocked', 'laugh'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'neutral', 'nervous', 'surprised', 'scared'] }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, noob.root);
  DRESS.jacket = dress(max, { color: '#3b4252', hem: 0.25, buttons: '#c9ced6', collar: '#2b303b' });
  DRESS.guard = dress(skye, { color: '#24304f', hem: 0.2, buttons: '#d9b44a', collar: '#1a2238' });
  DRESS.trench = dress(mia, { color: '#b08a5a', hem: 0.6, buttons: '#4a2c16', collar: '#8a6a40' });
  DRESS.leoSuit = dress(leo, { color: '#4a4f5c', hem: 0.15, collar: '#3a3f4a', tie: '#1d3557' });
  DRESS.leoKit = kit(leo, '#d0202e', 6);
  DRESS.noobCoat = dress(noob, { color: '#6b5a44', hem: 0.35, buttons: '#2b2d33', collar: '#4a3e2e' });
  for (let i = 0; i < 6; i++) {                          // recoloured Noobs: visitors, guards, police, players, dinner guests
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'laugh', 'suspicious', 'determined'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats;
    e.shells = {
      police: dress(e, { color: '#1f2a44', hem: 0.2, buttons: '#d9b44a', collar: '#141b2e' }),
      guard: dress(e, { color: '#24304f', hem: 0.2, buttons: '#d9b44a', collar: '#1a2238' }),
      kit: kit(e, '#d0202e', [2, 4, 9, 16, 21, 5][i]),
      suit: dress(e, { color: ['#2b2d33', '#3a3f4a', '#2f3b4f', '#2b2d33', '#3a3f4a', '#2f3b4f'][i], hem: 0.15, collar: '#1d1f27', tie: ['#c1121f', '#1d3557', '#c1121f', '#2a9d8f', '#c1121f', '#1d3557'][i] }),
    };
    scene.add(e.root); folk.push(e);
  }
  dog = await loadCreature('animal_collie_parts'); dog.root.scale.setScalar(DOG_SCALE); scene.add(dog.root);
  const cl = collar(); cl.position.set(-1.1, 2.15, 0); attachToBody(dog, 'Head', cl);
  const tg = tongue(); tg.position.set(-2.72, 2.2, 0); attachToBody(dog, 'Head', tg); PROPS.tongue = tg;
  const md = medal(); md.position.set(-1.3, 1.9, 0); attachToBody(dog, 'Head', md); PROPS.medal = md;
  dog.obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  for (const n of ['idle', 'walk', 'run', 'shrug', 'shock', 'sit', 'talk', 'laugh', 'laugh_big', 'proud', 'point_forward', 'look_up', 'think', 'facepalm', 'idle_lookaround', 'duck', 'clap']) A[n] = await loadAnimation(n);
  SX = street(scene); HA = hall(scene); OFc = office(scene); PKs = park(scene); STn = station(scene); SDm = stadium(scene); BQt = banquet(scene); RIo = rio(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  add('cup', trophy()); add('parcel', parcel(false)); add('torn', parcel(true)); add('small', smallParcel()); add('badge', badge());
  add('phone', rotaryPhone()); add('note', ransomNote()); add('crowbar', crowbar());
  for (let i = 0; i < 7; i++) add('plate' + i, plate(true));
  add('dogPlate', plate(true));
  leash = new THREE.Mesh(new THREE.BufferGeometry(), std('#7a1f1f', { roughness: 0.6 })); leash.castShadow = true; scene.add(leash);
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above).
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed, u, dist: u * d };
}
// arm poses: [side, spread, forward] (forward < 0 raises the arm in front; spread < 0 brings it in)
const LEAD = [['L', 0.06, -0.45]];                                // the lead in the left hand, held low in front
const ARMS_OUT = [['L', -0.3, -1.15], ['R', -0.3, -1.15]];          // the parcel held at arm's length (a bomb?)
const CHEST = [['L', -0.5, -1.0], ['R', -0.5, -1.0]];           // the trophy held at chest height by its base
const DESK_SET = [['L', -0.5, -0.62], ['R', -0.5, -0.62]];        // setting it down on the desk
const mixArms = (a, b, k) => { const out = b.map(([sd, u, f]) => { const o = a.find((q) => q[0] === sd) || [sd, 0, 0]; return [sd, lerp(o[1], u, k), lerp(o[2], f, k)]; }); for (const o of a) if (!b.find((q) => q[0] === o[0])) out.push([o[0], lerp(o[1], 0, k), lerp(o[2], 0, k)]); return out; };

// Max: the hook at the hedge; the walk; the parcel; the police station; the interview; the end card.
const HOOK_MAX = SS(-1.9, 0, 1.0), WALK_A = SS(-16, 0, 0.6), WALK_B = SS(-2.2, 0, 0.8);
const DESK_MAX = ST(SARGE_DESK.x + 0.4, 0, SARGE_DESK.z + 4.4), DOOR_IN = ST(-14, 0, 6);
function maxAt(s) {
  let x = base(HOOK_MAX, 0.9, 'surprised'); x.arms = LEAD; x.lead = true;
  if (s < T.hall) {                                          // the hook: watching the dog drag the parcel out
    x.heading = lerp(1.7, 1.1, smooth(inv(0.2, 1.2, s)));
    x.face = s < 1.0 ? 'confused' : 'surprised';
    if (s > T.inside) { x.face = 'shocked'; x.layers = [['shock', clamp(s - T.inside, 0, 0.5), 1, false]]; x.arms = [['L', 0.06, -0.55]]; }
    return x;
  }
  if (s >= T.walk && s < T.desk) {                            // the walk, the parcel, the tearing
    x = base(WALK_A, R90, 'happy'); x.arms = LEAD; x.lead = true;
    const m = moveTo(x, WALK_A, WALK_B, T.walk + 0.05, s, 12, 0.9);
    if (m.moving) x.arms = mixArms(LEAD, LEAD, 1);
    if (!m.moving && s > m.arrive) { x.face = s > T.drag ? 'confused' : 'neutral'; x.heading = lerp(R90, 0.9, smooth(inv(m.arrive, m.arrive + 0.4, s))); }
    if (s >= T.bomb) {                                        // holding it at arm's length: a bomb?
      x.pos = SS(-1.0, 0, 1.3); x.heading = 0.35; x.face = 'scared'; x.arms = ARMS_OUT; x.lead = false;
      x.lean = -0.12;
    }
    if (s >= T.tear) { x.face = 'nervous'; x.arms = mixArms(ARMS_OUT, CHEST, smooth(inv(T.tear, T.tear + 0.3, s))); x.lean = 0; }
    if (s >= W.paper + 0.1) x.face = 'surprised';
    if (s >= T.names) { x.face = 'shocked'; x.arms = CHEST; }
    return x;
  }
  if (s >= T.desk && s < T.interview) {                       // hands it in; becomes the suspect
    x = base(DOOR_IN, R90, 'happy'); x.lead = false;
    const m = moveTo(x, DOOR_IN, DESK_MAX, T.desk + 0.05, s, 12, Math.PI);
    x.arms = CHEST;
    if (!m.moving && s > m.arrive) { x.arms = mixArms(CHEST, DESK_SET, smooth(inv(m.arrive, m.arrive + 0.3, s))); x.face = 'happy'; }
    if (s > m.arrive + 0.45) x.arms = mixArms(DESK_SET, [], smooth(inv(m.arrive + 0.45, m.arrive + 0.75, s)));
    if (s >= T.suspect) { x.face = 'shocked'; x.layers = [['shock', clamp(s - T.suspect, 0, 0.5), 1, false]]; x.arms = []; x.heading = lerp(Math.PI, 0.55, smooth(inv(T.suspect, T.suspect + 0.3, s))); }
    return x;
  }
  if (s >= T.interview && s < T.stadium) {                    // the interview: sitting under the lamp, getting sleepy
    x = base(ST(INTERVIEW.x + 3.4, 0.45, INTERVIEW.z), -R90, 'nervous'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.lead = false;
    if (s > W.half) x.face = 'sad';
    if (s > W.morning + 0.2) x.face = 'sleeping';
    return x;
  }
  if (s >= T.cta) {                                           // the end card: by the hedge with Pickles
    x = base(SS(-2.0, 0, 1.0), 0.45, 'happy'); x.arms = LEAD; x.lead = true; return x;
  }
  x.visible = false; return x;
}
// Pickles. d: { visible, pos, heading, dist (gait), moving, head [rx, ry, rz], sit, tail, lick, carry }
const dbase = (pos, heading) => ({ visible: true, pos: VA(pos), heading, dist: 0, moving: false, head: [0, 0, 0], sit: 0, wag: 1, lick: 0, carry: null });
function dmove(d, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), dd = Math.hypot(b.x - a.x, b.z - a.z), u = dd < 1e-3 ? 1 : clamp((s - t0) * speed / dd);
  d.pos = a.clone().lerp(b, u); d.dist = u * dd; d.moving = u > 0 && u < 1;
  d.heading = d.moving ? Math.atan2(b.x - a.x, b.z - a.z) : (u >= 1 ? endHeading : d.heading);
  return { done: u >= 1, arrive: t0 + dd / speed };
}
const HOLLOW = SS(PARCEL_SPOT.x, 0, HEDGE_Z + 0.4);
function dogAt(s) {
  const d = dbase(HOLLOW, 0); d.visible = false;
  if (s < T.hall) {                                          // comes out of the hedge carrying the parcel by its string
    d.visible = true;
    const m = dmove(d, SS(PARCEL_SPOT.x - 0.2, 0, HEDGE_Z + 0.2), SS(PARCEL_SPOT.x + 0.9, 0, HEDGE_Z + 2.9), 0.0, s, 1.9, 0.38);
    d.head = [0, 0, 0.05]; d.carry = 'mouth'; d.wag = 2;
    if (m.done) { const k = smooth(inv(m.arrive, m.arrive + 0.35, s)); d.head = [0, lerp(0, -0.35, k), lerp(0.05, -0.05, k)]; }
    if (s >= T.inside) { d.carry = 'drop'; d.pos = SS(3.8, 0, -0.2); d.heading = -0.9; d.sit = 1; d.head = [0, 0.3, -0.2]; d.moving = false; }
    return d;
  }
  if (s >= T.walk && s < T.desk) {                            // the walk; sniffs; drags it out; watches
    d.visible = true;
    const from = WALK_A.clone().add(V(2.4, 0, 0.6)), to = SS(PARCEL_SPOT.x, 0, HEDGE_Z + 1.0);
    const m = dmove(d, from, to, T.walk + 0.05, s, 12, Math.PI);
    if (!m.done) d.head = [0, 0, 0.08];
    if (m.done) {                                              // nose into the hollow, then backs out with the parcel
      d.head = [0, 0.15 * Math.sin(s * 9), lerp(0.65, 0.2, smooth(inv(T.drag - 0.2, T.drag, s)))];
      if (s >= T.drag) { const b = dmove(d, to, to.clone().add(V(1.2, 0, 1.4)), T.drag + 0.15, s, 3.0, 0.7); d.carry = 'mouth'; d.head = [0, 0, 0.05]; if (s < T.drag + 0.15) { d.heading = lerp(Math.PI, 0.7, smooth(inv(T.drag, T.drag + 0.15, s))); } }
    }
    if (s >= T.bomb) { d.pos = SS(1.5, 0, 0.5); d.heading = -0.6; d.carry = null; d.sit = 1; d.head = [0, -0.3, -0.25]; d.dist = 0; d.moving = false; }
    if (s >= T.names) d.head = [0, -0.3, -0.45];
    return d;
  }
  if (s >= T.desk && s < T.interview) {                       // follows Max in; sits by the desk
    d.visible = true;
    const m = dmove(d, DOOR_IN.clone().add(V(-2.6, 0, 1.2)), DESK_MAX.clone().add(V(2.4, 0, 0.6)), T.desk + 0.05, s, 12, -0.5);
    if (m.done) { d.sit = smooth(inv(m.arrive, m.arrive + 0.4, s)); d.head = [0, 0, -0.3]; }
    if (s >= T.suspect) d.head = [0, 0.3, -0.1];
    return d;
  }
  if (s >= T.interview && s < T.stadium) {                    // lying by Max's chair
    d.visible = true; d.pos = ST(INTERVIEW.x + 4.8, 0, INTERVIEW.z + 2.6); d.heading = -1.9; d.sit = 1; d.head = [0, 0, -0.1]; d.wag = 0.3; return d;
  }
  if (s >= T.dinner && s < T.rio) {                           // on the chair at the end of the table, then licking the plate
    d.visible = true; d.pos = BQ(BQt.chair.x, BQt.chairY, BQt.chair.z - 0.2); d.heading = -0.35; d.sit = 1; d.head = [0, -0.2, -0.2]; d.wag = 2;
    if (s >= T.licks - 0.1) { d.sit = 0; d.pos = BQ(BQt.chair.x + 0.2, 0, TABLE_Z + 4.2); d.heading = -R90; d.head = [0, 0, 0.62 + 0.07 * Math.sin(s * 16)]; d.lick = 1; d.wag = 3; }
    if (s >= W.clean + 0.15) { d.lick = 0; d.sit = 1; d.head = [0, -0.6, -0.3]; }
    return d;
  }
  if (s >= T.cta) { d.visible = true; d.pos = SS(0.4, 0, 1.2); d.heading = 0.2; d.sit = 1; d.head = [0, 0.15, -0.2]; d.wag = 2; return d; }
  return d;
}
// Skye, the guard: strolls past the trophy; finds the case empty.
function skyeAt(s) {
  let x = base(HL(-12, 0, 2), R90, 'neutral'); x.visible = false;
  if (s >= T.hall && s < T.ransom) {
    x.visible = true;
    if (s < T.empty) { moveTo(x, HL(-11, 0, 1.0), HL(11, 0, 1.0), T.guards - 0.6, s, 12, R90); if (s < T.guards - 0.6) x.pos = HL(-11, 0, 1.0); x.face = 'happy'; }
    else { x = base(HL(-3.0, 0, 0.2), 2.6, 'shocked'); x.visible = true; x.layers = [['shock', clamp(s - T.empty - 0.35, 0, 0.5), 1, false]]; if (s < T.empty + 0.35) x.layers = [['idle', s]]; x.face = s < T.empty + 0.35 ? 'neutral' : 'shocked'; }
    return x;
  }
  if (s >= T.missing && s < T.walk) { x = base(HL(3.2, 0, 0.6), -2.3, 'confused'); x.visible = true; x.layers = [['shrug', s - T.missing, 1, false]]; return x; }
  return x;
}
// Leo: the football boss on the phone; the captain with the trophy; at the dinner.
function leoAt(s) {
  let x = base(OF(0, 0, -4.0), 0, 'neutral'); x.visible = false;
  if (s >= T.ransom && s < T.handover) {
    x.visible = true; x.face = 'surprised';
    const k = smooth(inv(T.ransom + 0.35, T.ransom + 0.7, s));
    x.arms = [['R', 0.25, lerp(-0.4, -2.25, k)]];
    if (s > W.fifteen - 0.1) { x.face = 'shocked'; }
    return x;
  }
  if (s >= T.stadium && s < T.dinner) {                       // the captain: trophy held at chest height
    x = base(SD(0, 0, 0), 0.15, 'laugh'); x.visible = true; x.arms = CHEST; x.hop = 0.25 * Math.abs(Math.sin((s - T.stadium) * 5.5));
    return x;
  }
  if (s >= T.dinner && s < T.rio) {
    x = base(BQ(2.0, 0, TABLE_Z - 3.2), 0.05, 'laugh'); x.visible = true; x.layers = [['laugh_big', s - T.dinner, 1, true]];
    if (s >= T.licks) x.heading = 0.5;
    return x;
  }
  return x;
}
// The Noob: the middleman at the handover.
function noobAt(s) {
  let x = base(PK(-1.2, 0, 1.0), 0.9, 'nervous'); x.visible = false;
  if (s >= T.handover && s < T.missing) {
    x.visible = true; x.arms = [['L', -0.24, -0.9], ['R', -0.24, -0.9]]; x.heading = lerp(0.5, 0.95, smooth(inv(T.handover, T.handover + 0.4, s)));
    if (s >= W.arrest - 0.1) { x.face = 'scared'; }
    if (s >= T.middle) { x.arms = []; x.layers = [['shrug', s - T.middle, 1, false]]; x.face = 'nervous'; x.heading = 0.25; }
    return x;
  }
  return x;
}
// Mia: the undercover officer at the handover; the detective in the interview.
function miaAt(s) {
  let x = base(PK(6, 0, 1), -R90, 'determined'); x.visible = false;
  if (s >= T.handover && s < T.missing) {
    x.visible = true;
    const m = moveTo(x, PK(8.5, 0, 2.0), PK(2.2, 0, 1.6), T.handover - 0.2, s, 12, -0.97);
    if (!m.moving && s > m.arrive) { x.arms = [['R', 0.0, lerp(-0.3, -1.45, smooth(inv(m.arrive, m.arrive + 0.25, s)))]]; x.badge = true; x.face = 'determined'; }
    if (s >= T.middle) { x.face = 'suspicious'; x.arms = [['R', 0.0, -1.45]]; }
    return x;
  }
  if (s >= T.desk && s < T.interview && s >= T.suspect - 0.6) {     // walks up behind the sergeant
    x = base(ST(SARGE_DESK.x - 4.5, 0, SARGE_DESK.z - 1.5), 0.6, 'suspicious'); x.visible = true;
    moveTo(x, ST(SARGE_DESK.x - 9, 0, SARGE_DESK.z - 2.5), ST(SARGE_DESK.x - 2.6, 0, SARGE_DESK.z - 0.8), T.suspect - 0.6, s, 12, 0.35);
    if (!x.moving && s > T.suspect) x.layers = [['point_forward', s - T.suspect, 1, false]];
    return x;
  }
  if (s >= T.interview && s < T.stadium) {
    x = base(ST(INTERVIEW.x - 3.0, 0, INTERVIEW.z + 0.2), R90, 'angry'); x.visible = true; x.lean = 0.3; x.layers = [['talk', s - T.interview, 1, true]];
    x.arms = [['L', 0.05, -1.1], ['R', -0.05, -1.1]];
    if (s > W.half) x.face = 'suspicious';
    return x;
  }
  return x;
}
// Recoloured Noobs.
const PAL = { visitor: [['#5a4636', '#3a2e24'], ['#2f3b2f', '#2b2d33'], ['#6b4a5a', '#2b2d33']], kitPants: '#f4f4ec' };
function folkAt(i, s) {
  let x = base(HL(0, 0, 0), 0, 'neutral'); x.visible = false; x.wear = null; x.pal = { shirt: '#3a3f4a', pants: '#2b2d33' };
  if (s >= T.hall && s < T.guards && i < 3) {                // visitors at the stamp boards
    const P = [[HL(-8, 0, -8.8), Math.PI], [HL(8.5, 0, -8.6), Math.PI + 0.2], [HL(4.0, 0, -0.5), Math.PI + 0.4]];
    x = base(P[i][0], P[i][1], 'neutral'); x.layers = [['idle_lookaround', s + i, 1, true]]; x.pal = { shirt: PAL.visitor[i][0], pants: PAL.visitor[i][1] }; return x;
  }
  if (s >= T.guards && s < T.empty && i === 0) {             // the night guard, the other way round
    x = base(HL(11, 0, -1.6), -R90, 'neutral'); moveTo(x, HL(12, 0, -1.6), HL(-12, 0, -1.6), T.guards + 0.15, s, 12, -R90); x.wear = 'guard'; x.pal = { shirt: '#24304f', pants: '#1a2238' }; return x;
  }
  if (s >= T.handover && s < T.missing && (i === 1 || i === 2)) {   // police run in
    x = base(PK(-12, 0, 2), R90, 'determined'); moveTo(x, PK(i === 1 ? -14 : -12, 0, i === 1 ? 3.5 : -1.0), PK(i === 1 ? -4.2 : -3.6, 0, i === 1 ? 3.0 : -0.6), W.arrest - 0.9, s, 16, R90 - 0.2);
    x.wear = 'police'; x.pal = { shirt: '#1f2a44', pants: '#1a2238' }; return x;
  }
  if (s >= T.desk && s < T.interview && i === 3) {           // the desk sergeant
    x = base(ST(SARGE_DESK.x - 0.6, 0, SARGE_DESK.z - 0.4), 0.15, 'happy'); x.wear = 'police'; x.pal = { shirt: '#1f2a44', pants: '#1a2238' };
    if (s >= T.suspect) { x.face = 'suspicious'; x.layers = [['think', s - T.suspect, 1, false]]; }
    return x;
  }
  if (s >= T.stadium && s < T.dinner && i < 5) {             // players round the captain
    const P = [[-3.2, -1.0, 0.4], [3.4, -1.2, -0.3], [-5.6, -3.0, 0.5], [5.8, -3.2, -0.4], [0.2, -3.6, 0]][i];
    x = base(SD(P[0], 0, P[1]), P[2], 'laugh'); x.layers = [[i % 2 ? 'clap' : 'laugh_big', s - T.stadium + i * 0.2, 1, true]]; x.wear = 'kit'; x.pal = { shirt: '#d0202e', pants: PAL.kitPants };
    x.hop = 0.2 * Math.abs(Math.sin((s - T.stadium) * 5 + i)); return x;
  }
  if (s >= T.dinner && s < T.rio && i < 5) {                 // dinner guests behind the table
    x = base(BQ(-9 + i * 2.6, 0, TABLE_Z - 3.2), 0.0, 'laugh'); if (i === 4) x.pos = BQ(-11.6, 0, TABLE_Z - 3.2);
    x.layers = [[i % 2 ? 'laugh' : 'clap', s - T.dinner + i * 0.3, 1, true]]; x.wear = 'suit'; x.pal = { shirt: '#2b2d33', pants: '#1d1f27' };
    if (s >= T.licks) { x.heading = 0.35 + i * 0.05; x.layers = [['laugh_big', s - T.licks + i * 0.2, 1, true]]; }
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
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - p.y;
  if (x.hop) a.root.position.y += x.hop;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal, i) {
  for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i]);
}
const LEGS = ['FrontL', 'FrontR', 'RearL', 'RearR'];
function placeDog(d, s) {
  dog.root.visible = d.visible; if (!d.visible) return;
  dog.root.position.copy(d.pos); dog.root.rotation.set(0, d.heading - R90, 0);
  const ph = (d.dist / 2.4) * Math.PI * 2, sw = d.moving ? 0.5 : 0, sn = Math.sin(ph), k = d.sit;
  // sitting: the body tips back (nose up), the front legs stay upright, the hind legs fold forward under it
  const pose = {
    Body: { r: [0, 0, -0.5 * k], p: [0, d.moving ? 0.12 * Math.abs(Math.cos(ph)) : 0, 0] },
    FrontL: [0, 0, sw * sn + 0.5 * k], RearR: [0, 0, sw * sn - 0.45 * k], FrontR: [0, 0, -sw * sn + 0.5 * k], RearL: [0, 0, -sw * sn - 0.45 * k],
    Head: [d.head[0], d.head[1], d.head[2] + 0.5 * k * 0.6 + (d.moving ? 0.05 * Math.sin(ph * 2) : 0)],
    Tail: [0, 0.35 * Math.sin(s * 6 * d.wag + 1.0) * Math.min(1, d.wag), -0.2 * k],
  };
  poseCreature(dog, pose);
  dog.root.updateMatrixWorld(true);
  const low = creatureLowest(dog, [...LEGS, 'Body']);
  dog.root.position.y += d.pos.y - low;
  dog.root.updateMatrixWorld(true);
  PROPS.tongue.visible = d.lick > 0;
  PROPS.medal.visible = s >= T.dinner && s < T.rio;
}
// The palm, measured on the pack mesh: the fist is at (-+0.5, -1.3, 0) in the arm bone's frame (R: -0.5, L: +0.5).
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const between = (a, d = 1.3) => grip(a, 'L', d).lerp(grip(a, 'R', d), 0.5);
const mouth = () => creaturePoint(dog, 'Head', -2.72, 2.25, 0);
const collarPt = () => creaturePoint(dog, 'Head', -1.1, 2.0, 0);
function setLeash(on) {
  leash.visible = on; if (!on) return;
  const a = grip(max, 'L', 1.35), b = collarPt(), mid = a.clone().lerp(b, 0.5); mid.y = Math.min(a.y, b.y) - 0.35 * a.distanceTo(b) / 4;
  leash.geometry.dispose(); leash.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 16, 0.045, 6, false);
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.inside, 'inside'], [T.hall, 'hall'], [W.four - 0.15, 'hall2'], [T.guards, 'guards'], [T.empty, 'empty'], [T.ransom, 'ransom'],
  [T.handover, 'handover'], [T.middle, 'middle'], [T.missing, 'missing'], [T.walk, 'walk'], [T.bomb, 'bomb'], [T.tear, 'tear'],
  [T.names, 'names'], [T.desk, 'desk'], [T.suspect, 'suspect'], [T.interview, 'interview'], [W.half - 0.2, 'clock'], [T.stadium, 'stadium'], [T.dinner, 'dinner'],
  [T.licks, 'licks'], [T.rio, 'rio'], [T.back, 'back'], [T.nopickles, 'nopickles'], [T.never, 'never'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

const PLACE_OF = {
  hook: 'dusk', inside: 'dusk', hall: 'hall', hall2: 'hall', guards: 'hall', empty: 'hall', ransom: 'office', handover: 'park', middle: 'park', missing: 'hall',
  walk: 'dusk', bomb: 'dusk', tear: 'dusk', names: 'dusk', desk: 'station', suspect: 'station', interview: 'interview', clock: 'interview', stadium: 'stadium',
  dinner: 'banquet', licks: 'banquet', rio: 'rio', back: 'rio', nopickles: 'night', never: 'rio', cta: 'dusk',
};
const SUN_DAY = V(0.45, 0.7, 0.55).normalize(), SUN_DUSK = V(-0.75, 0.32, 0.55).normalize();
function light(stage, place) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const L = {
    dusk: { sun: 2.2, sunC: '#ffb27a', hemi: 0.6, hemiC: '#ffd9b8', env: 0.5, fill: 0.55, rim: 1.0, z: '#5a6fb0', h: '#ffb98a', dir: SUN_DUSK },
    night: { sun: 0.25, sunC: '#9fb7ff', hemi: 0.3, hemiC: '#7f9fd8', env: 0.25, fill: 0.35, rim: 0.6, z: '#0d1838', h: '#2a3a6a', dir: SUN_DUSK },
    hall: { sun: 0, hemi: 0.55, hemiC: '#fff1e0', env: 0.45, fill: 0.55, rim: 0.7 },
    office: { sun: 0, hemi: 0.5, hemiC: '#fff1e0', env: 0.4, fill: 0.5, rim: 0.7 },
    park: { sun: 3.0, sunC: '#fff0dc', hemi: 0.55, hemiC: '#d9ecff', env: 0.55, fill: 0.7, rim: 1.1, dir: SUN_DAY },
    station: { sun: 0, hemi: 0.5, hemiC: '#f4f8ff', env: 0.4, fill: 0.5, rim: 0.7 },
    interview: { sun: 0, hemi: 0.25, hemiC: '#ffe8c8', env: 0.2, fill: 0.25, rim: 0.6 },
    stadium: { sun: 3.2, sunC: '#fff0dc', hemi: 0.6, hemiC: '#d9ecff', env: 0.6, fill: 0.7, rim: 1.1, dir: SUN_DAY },
    banquet: { sun: 0, hemi: 0.4, hemiC: '#ffe8c8', env: 0.35, fill: 0.4, rim: 0.7 },
    rio: { sun: 0, hemi: 0.3, hemiC: '#8fa8e8', env: 0.25, fill: 0.35, rim: 0.7 },
  }[place];
  stage.sun.intensity = L.sun; if (L.sunC) stage.sun.color.set(L.sunC); if (L.dir) stage.sunDir.copy(L.dir);
  stage.hemi.intensity = L.hemi; stage.hemi.color.set(L.hemiC); sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  u.zenith.value.set(L.z || '#4f8fe6'); u.horizon.value.set(L.h || '#d7ecff');
  const outdoorLamp = place === 'dusk' ? 18 : place === 'night' ? 40 : 0;
  for (const l of SX.lamps) l.intensity = outdoorLamp;
  HA.lamp.intensity = place === 'hall' ? 50 : 0; HA.spot.intensity = place === 'hall' ? 80 : 0;
  OFc.lamp.intensity = place === 'office' ? 45 : 0;
  STn.lamp.intensity = place === 'station' ? 45 : 0; STn.lampI.intensity = place === 'interview' ? 45 : 0; STn.lampL.intensity = place === 'station' ? 20 : 0;
  SDm.lamp.intensity = place === 'stadium' ? 20 : 0; BQt.lamp.intensity = place === 'banquet' ? 28 : 0;
  RIo.lamp.intensity = place === 'rio' ? 30 : 0; RIo.spot.intensity = place === 'rio' ? 70 : 0;
}

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  const where = PLACE_OF[SHOT];
  light(stage, where);

  // ---------- cast ----------
  for (const a of [max, mia, leo, skye, noob, ...folk]) a.root.visible = false;
  const mx = maxAt(s);
  const states = new Map([[max, mx], [skye, skyeAt(s)], [noob, noobAt(s)], [leo, leoAt(s)], [mia, miaAt(s)]]);
  DRESS.leoSuit.visible = !(s >= T.stadium && s < T.dinner); DRESS.leoKit.visible = s >= T.stadium && s < T.dinner;
  for (const [a, x] of states) place(a, x);
  folk.forEach((f, i) => { const x = folkAt(i, s); paint(f, x.pal, i); for (const [k, sh] of Object.entries(f.shells)) sh.visible = x.wear === k; place(f, x); f.state = x; });
  const d = dogAt(s); placeDog(d, s);
  setLeash(mx.visible !== false && mx.lead && d.visible && max.root.visible);

  // ---------- props ----------
  for (const p of Object.values(PROPS)) if (p !== PROPS.tongue && p !== PROPS.medal) p.visible = false;
  const show = (key, pos, yaw = 0, sc = 1) => { const o = PROPS[key]; o.visible = true; o.position.copy(pos); o.rotation.set(0, yaw, 0); o.scale.setScalar(sc); return o; };
  const hy = (a) => a.root.rotation.y;
  if (where === 'dusk' && SHOT !== 'cta') {
    if (SHOT === 'inside') { const o = show('torn', SS(0.6, 0, 0.3), 0.25); show('cup', o.position.clone(), 0.25); }
    else if (SHOT === 'hook' || (SHOT === 'walk' && s >= T.drag)) {
      // hanging from the dog's mouth by its string, the bottom just off the ground, tipped back as it's dragged along
      const m = mouth(), dir = V(Math.sin(d.heading), 0, Math.cos(d.heading));
      const o = show('parcel', V(m.x, 0.04, m.z).addScaledVector(dir, 0.1), d.heading, 0.8); o.rotation.set(-0.22, d.heading, 0, 'YXZ');
    } else if (SHOT === 'walk' && s >= T.drag - 0.6) show('parcel', SS(PARCEL_SPOT.x, 0.0, PARCEL_SPOT.z + 0.4), 0.2, 0.8);
    else if (SHOT === 'bomb') show('parcel', between(max, 1.35).add(V(0, -0.8, 0)), hy(max));
    else if (SHOT === 'tear' || SHOT === 'names') {
      const p = between(max, 1.35).add(V(0, 0.1, 0)), k = smooth(inv(W.paper - 0.1, W.paper + 0.25, s));
      if (k < 1 && s < W.paper + 0.05) show('parcel', p.clone().add(V(0, -0.35, 0)), hy(max)).scale.setScalar(1);
      else { if (SHOT === 'tear') show('torn', p.clone().add(V(0, -0.35, 0)), hy(max)); show('cup', p.clone().add(V(0, -0.35, 0)), hy(max)); }
    }
  }
  if (where === 'hall') {
    const has = s < T.empty;
    if (has) show('cup', HL(CASE.x, PLINTH_H + 0.08, CASE.z), 0.0, 1.0);
  }
  if (where === 'office') {
    show('phone', OF(1.4, DESK_TOP, -1.2), -0.3);
    const hand = PROPS.phone.userData.hand, rest = PROPS.phone.userData.rest;
    if (leo.root.visible && s >= T.ransom + 0.45) { const g = grip(leo, 'R', 1.15).add(V(Math.sin(hy(leo)), 0, Math.cos(hy(leo))).multiplyScalar(0.45)); hand.position.copy(PROPS.phone.worldToLocal(g)); hand.rotation.set(-0.15, hy(leo) + 0.3, 0.1); }
    else { hand.position.copy(rest.p); hand.rotation.copy(rest.r); hand.position.y += s < T.ransom + 0.45 ? 0.03 * Math.abs(Math.sin(s * 40)) : 0; }
    show('note', OF(-1.2, DESK_TOP + 0.02, -0.9), 0.25);
  }
  if (where === 'park' && noob.root.visible && s < T.middle) show('small', between(noob).add(V(0, 0.0, 0)), hy(noob));
  if (where === 'park' && s >= T.middle) show('small', PK(-1.2, 0.3, 2.2), 0.4);
  if (where === 'park' && mia.root.visible && states.get(mia).badge) show('badge', grip(mia, 'R'), hy(mia));
  if (where === 'station' && max.root.visible) {
    const mm = states.get(max);
    const onDesk = ST(SARGE_DESK.x + 0.4, 3.6, SARGE_DESK.z + 1.6);
    if (s < T.desk + 0.05 + DESK_MAX.distanceTo(DOOR_IN) / 12 + 0.3) show('cup', between(max, 1.35).add(V(0, -0.25, 0)), hy(max));
    else show('cup', onDesk, 0.0);
    void mm;
  }
  if (where === 'stadium') show('cup', between(leo, 1.35).add(V(0, -0.25, 0)), hy(leo));
  if (where === 'banquet') {
    for (let i = 0; i < 6; i++) { const o = show('plate' + i, BQ(-11 + i * 4.4, TABLE_Y, TABLE_Z + 0.9), 0); o.userData.food.forEach((f) => (f.visible = true)); }
    const dp = s >= T.licks - 0.1 ? show('dogPlate', BQ(BQt.chair.x - 0.85, 0.0, TABLE_Z + 4.2), 0) : show('dogPlate', BQ(BQt.chair.x, TABLE_Y, TABLE_Z + 0.9), 0);
    const gone = smooth(inv(T.licks + 0.2, W.clean, s)); dp.userData.food.forEach((f, j) => (f.visible = gone < (j + 1) / 4));
  }
  if (where === 'rio') show('crowbar', RI(RIO_CASE.x - 1.4, 0, RIO_CASE.z - 2.6), 0.6);
  RIo.back.rotation.y = s >= T.back ? -1.9 * smooth(inv(T.back, T.back + 0.5, s)) : -1.9 * (s >= T.never ? 1 : 0);
  if (where === 'rio' && SHOT === 'rio') RIo.back.rotation.y = -1.9;
  // the wall clock in the interview: hands sweep from 7 p.m. round to 2:30
  const hrs = lerp(19.0, 26.5, smooth(inv(T.interview, W.morning + 0.3, s)));
  STn.hour.rotation.z = -(hrs % 12) / 12 * Math.PI * 2; STn.min.rotation.z = -(hrs % 1) * Math.PI * 2;

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, SS(lerp(3.8, 3.4, u), 3.1, lerp(9.0, 8.2, u)), SS(-0.5, 2.3, -0.2), 50, 12); break;
    case 'inside': look(stage, SS(lerp(1.5, 1.2, u), 1.7, lerp(4.8, 4.0, easeOut(u))), SS(1.0, 0.95, 0.3), 42, 8); break;
    case 'hall': look(stage, HL(lerp(6.0, 3.0, u), 6.2, lerp(12, 8.5, easeOut(u))), HL(CASE.x, PLINTH_H + 0.8, CASE.z), 46, 18); break;
    case 'hall2': look(stage, HL(lerp(-7.5, -6.0, u), 3.2, 4.5), HL(CASE.x, PLINTH_H + 1.0, CASE.z), 40, 14); break;
    case 'guards': look(stage, HL(lerp(-1.5, 1.5, u), 5.5, 12), HL(0, 3.4, -2.5), 50, 18); break;
    case 'empty': look(stage, HL(0.6, PLINTH_H + 1.6, lerp(5.5, 2.6, easeOut(u))), HL(CASE.x, PLINTH_H + 0.9, CASE.z), 44, 10); break;
    case 'ransom': look(stage, OF(lerp(4.4, 3.8, u), 6.6, lerp(7.5, 6.8, u)), OF(0, 4.2, -2.4), 48, 12); break;
    case 'handover': look(stage, PK(lerp(1.0, 0.6, u), 4.8, 12.5), PK(0.6, 3.4, 1.2), 50, 16); break;
    case 'middle': look(stage, PK(-0.2, 4.6, 8.5), PK(-0.6, 3.6, 1.0), 46, 12); break;
    case 'missing': look(stage, HL(lerp(0.4, 0, u), PLINTH_H + 1.5, lerp(7.5, 5.5, u)), HL(CASE.x, PLINTH_H + 1.0, CASE.z), 46, 12); break;
    case 'walk': { const fx = clamp(mp.x, -14, -2); look(stage, SS(fx + 2.6, 3.9, 13.5), SS(fx + 1.6, 2.7, -0.4), 50, 14); break; }
    case 'bomb': look(stage, SS(lerp(2.6, 2.2, u), 4.2, lerp(8.4, 7.6, u)), SS(-0.6, 3.0, 1.0), 48, 10); break;
    case 'tear': look(stage, SS(1.2, 4.6, 6.2), SS(-0.8, 3.0, 1.2), 42, 8); break;
    case 'names': { const c = PROPS.cup.position.clone(); const f = V(Math.sin(hy(max)), 0, Math.cos(hy(max))); look(stage, c.clone().addScaledVector(f, lerp(3.4, 2.9, u)).add(V(0, 0.5, 0)), c.clone().add(V(0, 0.55, 0)), 40, 6); break; }
    case 'desk': look(stage, ST(lerp(-6.5, -4.0, u), 5.6, 13.5), ST(SARGE_DESK.x - 1.0, 3.2, SARGE_DESK.z + 2), 50, 16); break;
    case 'suspect': look(stage, ST(SARGE_DESK.x + 4.0, 5.0, SARGE_DESK.z + 11.0), ST(SARGE_DESK.x - 0.4, 3.8, SARGE_DESK.z + 2.0), 46, 14); break;
    case 'interview': look(stage, ST(INTERVIEW.x + lerp(0.6, 0.2, u), 6.0, INTERVIEW.z + 15.5), ST(INTERVIEW.x + 0.2, 4.0, INTERVIEW.z - 1.0), 52, 14); break;
    case 'clock': look(stage, ST(INTERVIEW.x + 3.5, 8.4, lerp(1.5, 0.0, u)), ST(INTERVIEW.x + 3.5, 9.4, -7.9), 40, 10); break;
    case 'stadium': look(stage, SD(lerp(1.2, 0.4, u), 4.6, lerp(12, 10.5, u)), SD(0, 3.6, -1.0), 50, 20); break;
    case 'dinner': look(stage, BQ(lerp(4.2, 4.6, u), 5.2, lerp(12.5, 11.5, u)), BQ(3.8, 4.0, TABLE_Z - 0.5), 52, 16); break;
    case 'licks': look(stage, BQ(BQt.chair.x - 1.2, 3.0, TABLE_Z + lerp(10.5, 9.6, u)), BQ(BQt.chair.x - 0.8, 1.3, TABLE_Z + 4.0), 46, 10); break;
    case 'rio': look(stage, RI(lerp(1.4, 0.4, u), 5.2, lerp(11.5, 9.5, u)), RI(RIO_CASE.x, 4.2, RIO_CASE.z), 46, 14); break;
    case 'back': look(stage, RI(lerp(-6.0, -5.2, u), 5.4, RIO_CASE.z - lerp(6.5, 5.5, u)), RI(RIO_CASE.x, 4.2, RIO_CASE.z - 0.5), 48, 14); break;
    case 'nopickles': look(stage, SS(PARCEL_SPOT.x + 0.6, 1.8, HEDGE_Z + lerp(7.0, 5.0, easeOut(u))), SS(PARCEL_SPOT.x, 0.8, HEDGE_Z), 44, 10); break;
    case 'never': look(stage, RI(0.4, 4.8, lerp(9.5, 8.0, u)), RI(RIO_CASE.x, 4.6, RIO_CASE.z), 46, 12); break;
    case 'cta': look(stage, SS(lerp(-0.6, -0.8, u), 3.4, lerp(10.0, 9.4, u)), SS(-0.8, 3.6, 0.2), 54, 12); break;
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
// a place / time tag in the top left
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
  roundRect(g, -w / 2 * s, -50 * s, w * s, 100 * s, 40 * s); g.fill(); g.stroke();
  g.fillRect(-28 * s, 34 * s, 46 * s, 14 * s);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#16182a'; g.fillText(text, 0, 4 * s); g.restore();
}
// sun and moon swapping: "day and night"
function dayNight(g, s, t) {
  const k = pop(t, W.watch - 0.1); if (k <= 0) return;
  const m = smooth(inv(W.night - 0.25, W.night + 0.1, t));
  g.save(); g.translate(820 * s, 470 * s); g.scale(k, k);
  roundRect(g, -110 * s, -110 * s, 220 * s, 220 * s, 50 * s); g.fillStyle = `rgba(${lerp(120, 20, m) | 0},${lerp(180, 30, m) | 0},${lerp(240, 70, m) | 0},.92)`; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16182a'; g.stroke();
  g.globalAlpha = 1 - m; g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(0, 0, 46 * s, 0, 7); g.fill();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.fillRect(Math.cos(a) * 66 * s - 6 * s, Math.sin(a) * 66 * s - 6 * s, 12 * s, 12 * s); }
  g.globalAlpha = m; g.fillStyle = '#f6f1d8'; g.beginPath(); g.arc(0, 0, 50 * s, 0, 7); g.fill(); g.fillStyle = `rgb(20,30,70)`; g.beginPath(); g.arc(24 * s, -14 * s, 44 * s, 0, 7); g.fill();
  g.restore();
}
function ransom(g, s, t) {
  if (SHOT !== 'ransom' || t < W.fifteen - 0.15) return;
  const L = '£15,000'.split(''), C = ['#c1121f', '#1d3557', '#2a9d8f', '#e9a23b', '#6a4c93', '#f4a261', '#264653'];
  L.forEach((ch, i) => {
    const k = pop(t, W.fifteen - 0.15 + i * 0.07, 0.2); if (k <= 0) return;
    g.save(); g.translate((240 + i * 100) * s, (440 + (i % 2) * 18) * s); g.rotate(i % 2 ? 0.12 : -0.1); g.scale(k, k);
    g.fillStyle = C[i]; g.strokeStyle = '#16182a'; g.lineWidth = 5 * s; g.fillRect(-44 * s, -66 * s, 88 * s, 124 * s); g.strokeRect(-44 * s, -66 * s, 88 * s, 124 * s);
    g.font = `${i % 2 ? '800' : '900'} ${96 * s}px ${i % 2 ? 'Montserrat' : '"Playfair Display"'}`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 2 * s);
    g.restore();
  });
}
function bombIcon(g, s, t) {
  if (SHOT !== 'bomb') return;
  const k = pop(t, W.bomb - 0.15); if (k <= 0) return;
  g.save(); g.translate(760 * s, 470 * s); g.scale(k, k); g.rotate(0.08 * Math.sin(t * 20));
  g.fillStyle = '#16182a'; g.beginPath(); g.arc(0, 20 * s, 70 * s, 0, 7); g.fill(); g.fillRect(-20 * s, -66 * s, 40 * s, 30 * s);
  g.strokeStyle = '#c9a66b'; g.lineWidth = 8 * s; g.beginPath(); g.moveTo(0, -66 * s); g.quadraticCurveTo(30 * s, -110 * s, 50 * s, -96 * s); g.stroke();
  g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(54 * s, -98 * s, 14 + 6 * Math.sin(t * 30), 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-24 * s, 0, 18 * s, 0, 7); g.fill();
  g.restore();
  bigText(g, s, '?', 900, 380, 150, '#ffd23f', pop(t, W.bomb), 0.15);
}
// The engraved names, one by one as they're read.
function names(g, s, t) {
  if (SHOT !== 'names') return;
  [['BRAZIL', W.brazil1], ['WEST GERMANY', W.west], ['URUGUAY', W.uruguay]].forEach(([n, w], i) => bigText(g, s, n, 540, 300 + i * 110, i === 1 ? 88 : 100, '#ffd23f', pop(t, w - 0.08), -0.03));
}
function clockTag(g, s, t) {
  if (SHOT !== 'clock' || t < W.half - 0.15) return;
  const k = pop(t, W.half - 0.15);
  g.save(); g.translate(540 * s, 420 * s); g.scale(k, k);
  roundRect(g, -230 * s, -90 * s, 460 * s, 180 * s, 30 * s); g.fillStyle = 'rgba(12,16,32,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#e63946'; g.stroke();
  g.font = `${110 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff4d5a'; g.fillText('2:30 AM', 0, 8 * s);
  g.restore();
}
function sparkle(g, s, t) {
  if (SHOT !== 'licks' || t < W.clean - 0.05) return;
  const a = clamp((t - W.clean + 0.05) / 0.5);
  for (const [x, y, r] of [[600, 1060, 1], [470, 1120, 0.7], [700, 1150, 0.8]]) {
    const k = Math.sin(a * Math.PI) * r * 60 * s; g.save(); g.translate(x * s, y * s); g.rotate(a * 2); g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(0, -k); g.lineTo(k * 0.2, 0); g.lineTo(0, k); g.lineTo(-k * 0.2, 0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-k, 0); g.lineTo(0, k * 0.2); g.lineTo(k, 0); g.lineTo(0, -k * 0.2); g.closePath(); g.fill(); g.restore();
  }
  stamp(g, s, t, W.clean, 'SPOTLESS!', 540, 470, '#1e9e55', 100, 0.08);
}
export function overlay(g, s, t) {
  if (t < T.inside) tag(g, s, t, 0.0, 'SOUTH LONDON, 1966');
  if (SHOT === 'inside') bigText(g, s, 'THE WORLD CUP', 540, 420, 112, '#ffd23f', pop(t, W.cup1 - 0.2), -0.04);
  if (SHOT === 'hall') tag(g, s, t, T.hall, 'ONE WEEK EARLIER', '4 months before the World Cup');
  if (SHOT === 'guards') dayNight(g, s, t);
  if (SHOT === 'empty') {
    tag(g, s, t, T.empty, 'SUNDAY');
    const a = clamp((t - W.empty + 0.1) / 0.15); g.save(); g.globalAlpha = 0.26 * a * (0.7 + 0.3 * Math.sin(t * 14)); const gr = g.createRadialGradient(540 * s, 960 * s, 300 * s, 540 * s, 960 * s, 1100 * s); gr.addColorStop(0, 'rgba(230,57,70,0)'); gr.addColorStop(1, 'rgba(230,57,70,1)'); g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    stamp(g, s, t, W.empty, 'STOLEN!', 540, 520, '#e63946', 140);
  }
  ransom(g, s, t);
  if (SHOT === 'handover' && t > W.arrest - 0.1) stamp(g, s, t, W.arrest - 0.1, 'ARRESTED', 540, 470, '#3a86ff', 110);
  if (SHOT === 'middle') bubble(g, s, t, W.middleman - 0.35, "I'M JUST THE MIDDLEMAN!", 540, 470, 470, 640);
  if (SHOT === 'missing') {
    const k = pop(t, W.missing - 0.15);
    g.save(); g.translate(540 * s, 440 * s); g.scale(k, k); roundRect(g, -330 * s, -80 * s, 660 * s, 160 * s, 30 * s); g.fillStyle = 'rgba(12,16,32,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.font = `800 ${36 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c9cfdc'; g.fillText('THE TROPHY:', 0, -30 * s);
    g.font = `${72 * s}px "Luckiest Guy"`; g.fillStyle = '#ff4d5a'; g.fillText('STILL MISSING', 0, 32 * s); g.restore();
  }
  if (t >= T.walk && t < T.bomb) tag(g, s, t, T.walk, 'ONE WEEK LATER', 'Pickles goes for his walk');
  bombIcon(g, s, t);
  names(g, s, t);
  if (SHOT === 'suspect') stamp(g, s, t, W.main - 0.1, 'MAIN SUSPECT', 540, 470, '#e63946', 110);
  clockTag(g, s, t);
  if (SHOT === 'stadium') { tag(g, s, t, T.stadium, 'SUMMER 1966'); if (t > W.win - 0.1) bigText(g, s, 'ENGLAND WIN!', 540, 450, 130, '#ffffff', pop(t, W.win - 0.1), -0.04, '#c1121f'); }
  if (SHOT === 'dinner' && t > W.dinner - 0.2) bigText(g, s, 'GUEST OF HONOUR', 540, 420, 92, '#ffd23f', pop(t, W.invite - 0.1), -0.04);
  sparkle(g, s, t);
  if (SHOT === 'rio' || SHOT === 'back') tag(g, s, t, T.rio, '1983', 'Rio de Janeiro, Brazil');
  if (SHOT === 'back') stamp(g, s, t, W.again - 0.1, 'STOLEN AGAIN', 540, 470, '#e63946', 110);
  if (SHOT === 'nopickles') {
    const a = clamp((t - T.nopickles) / 0.3); g.save(); g.globalAlpha = 0.3 * a; g.fillStyle = '#0b1430'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    if (t > W.pickles4 - 0.1) bigText(g, s, 'NO PICKLES', 540, 450, 120, '#ffffff', pop(t, W.pickles4 - 0.1), -0.04);
  }
  if (SHOT === 'never') stamp(g, s, t, W.found - 0.15, 'NEVER FOUND', 540, 470, '#c9cfdc', 120, -0.08);
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

export const cast = () => ({ max, mia, leo, skye, noob, folk0: folk[0], folk1: folk[1], folk2: folk[2], folk3: folk[3], folk4: folk[4] });
export const dogActor = () => dog;
export const TIMES = T;
export const props = () => PROPS;
// for the cover clip
export { placeDog, dbase, setLeash };
