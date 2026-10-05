// He Mailed Himself Home. Web renderer + Roblox R6 pack. True story (Reg Spiers, October 1964): an Australian athlete,
// broke in London, has his friend nail him into a crate labelled paint, sent cash on delivery to a company that doesn't
// exist. Fog in London, upside down on the tarmac in Bombay; 63 hours later he cuts his way out in Perth, puts on his
// suit, walks out of the airport and hitchhikes home for his daughter's birthday. He forgets to tell his friend he
// survived; the friend calls a newspaper, the world finds out and the airline drops the bill. Max is the athlete; Leo
// the friend; Mia the wife; a small Skye the daughter; Skye the airline clerk; recoloured Noobs the handlers, the guard
// and the reporters. Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of
// time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { puff } from '../../../web/lib/world.js';
import { W } from './beats.js';
import {
  garage, field, apron, shed, outback, home, flatRoom, office, dress, partyHat,
  crate, cutFront, hammer, torch, bottle, tins, pillow, blanket, javelin, saw, cake, rotaryPhone, pressCamera, invoice, newspaper, notebook,
  jet, loader, setLoader, truck,
  GARAGE, FIELD, APRON, SHED, OUTBACK, HOME, FLAT, OFFICE, CRATE, TERMINAL_Z, PORCH_Y, DOOR_Z, CAKE_AT, PHONE_AT, DESK_AT,
} from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Mailed Himself Home' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const R90 = Math.PI / 2, PI = Math.PI;
const at = (o) => (x, y, z) => V(o.x + x, y, o.z + z);
const G = at(GARAGE), F = at(FIELD), A_ = at(APRON), S = at(SHED), O = at(OUTBACK), H = at(HOME), L = at(FLAT), C = at(OFFICE);

// ---------- key times (all on the narration) ----------
const T = {
  inside: W.inside - 0.12, bottles: W.bottles - 0.12, later: W.later1 - 0.2, athlete: W.athlete - 0.15, daughter: W.daughters - 0.12, mailing: W.mailing - 0.12,
  label: W.label - 0.12, cod: W.cash - 0.12, fog: W.fog - 0.12, bombay: W.bombay - 0.12, burn: W.burning - 0.15, lands: W.sixty - 0.12, cuts: W.cuts - 0.12,
  suit: W.puts - 0.1, walks: W.airport - 0.25, hitch: W.hitchhikes - 0.12, makes: W.makes - 0.12, forgets: W.forgets - 0.12, panics: W.panics - 0.15,
  whole: W.whole - 0.12, airline: W.airline - 0.12, afford: W.afford - 0.12, cta: W.follow - 0.15,
};
T.sink = W.crate + 0.15;                   // Max sinks into the crate
T.lidOn = W.nails - 0.25;                  // the lid drops on
T.plug = W.cuts + 0.75;                    // the cut square falls out
T.change = W.suit - 0.05;                  // puff: he's in his suit
T.tear = W.drops;                          // the bill is torn in half
T.lift = W.hours1 + 0.2;                   // (fog) the loader starts lifting

// ---------- scene ----------
let A = {}, max, mia, leo, skye, kid, folk = [], GA, FI, AP, SH, OB, HO, FL, OF, cam, SHOT = 'hook', NOW = 0;
const PROPS = {}, DRESS = {};
let puffs = [];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#d29a66', '#f5d0a9'];
export async function setup(stage) {
  const { scene } = stage;
  [max, mia, leo, skye, kid] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'nervous', 'neutral', 'determined', 'annoyed', 'smug', 'scared', 'dizzy', 'surprised', 'cool', 'laugh', 'sad', 'shocked'] }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'shocked', 'surprised', 'laugh', 'neutral'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'nervous', 'scared', 'shocked', 'determined', 'surprised', 'sad'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['neutral', 'surprised', 'happy', 'shocked', 'smug', 'suspicious'] }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'laugh', 'surprised'], scale: 0.62 }),
  ]);
  scene.add(max.root, mia.root, leo.root, skye.root, kid.root);
  DRESS.vest = dress(max, { color: '#f4f2ec', hem: 0.1, sleeves: false });
  DRESS.suit = dress(max, { color: '#3a3f4a', hem: 0.25, buttons: '#16181f', collar: '#f4f2ec', tie: '#c8202b', lapels: '#2e323b' });
  DRESS.clerk = dress(skye, { color: '#16304f', hem: 0.2, buttons: '#d9b44a', collar: '#f4f2ec' });
  DRESS.kid = dress(kid, { color: '#ff8fb8', hem: 0.45, sleeves: false });
  const hat = partyHat(); hat.position.set(0, 1.12 * kid.scale, 0); hat.scale.setScalar(kid.scale); kid.bones.Head.add(hat); DRESS.hat = hat;
  for (let i = 0; i < 6; i++) {                          // recoloured Noobs: handlers, the guard, the reporters
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'sleeping', 'annoyed', 'laugh'] });
    const mats = { shirt: [], pants: [], skin: [] };
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      (o.name === 'Torso' ? mats.shirt : /Leg/.test(o.name) ? mats.pants : mats.skin).push(o.material);
    });
    e.mats = mats;
    e.hivis = dress(e, { color: '#ff8c1a', hem: 0.15, sleeves: false, collar: '#e0e0e0' });
    e.uniform = dress(e, { color: '#3a4a3a', hem: 0.2, buttons: '#d9b44a', collar: '#2a3a2a' });
    e.coat = dress(e, { color: ['#7a6a4a', '#5a4636', '#3a3f4a', '#6b5a3a', '#4a3a2a', '#5f6b78'][i], hem: 0.7, buttons: '#2b2d33' });
    scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'laugh_big', 'point_forward', 'talk', 'think', 'facepalm', 'clap', 'idle_lookaround', 'look_up']) A[n] = await loadAnimation(n);
  GA = garage(scene); FI = field(scene); AP = apron(scene); SH = shed(scene); OB = outback(scene); HO = home(scene); FL = flatRoom(scene); OF = office(scene);
  const add = (k, o) => { PROPS[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh && !m.material.transparent) m.castShadow = true; }); return o; };
  add('crate', crate()); add('cut', cutFront()); add('hammer', hammer()); add('torch', torch());
  add('water', bottle('WATER')); add('later', bottle(null)); add('tins', tins()); add('pillow', pillow()); add('blanket', blanket());
  add('javelin', javelin()); add('flyJav', javelin()); add('saw', saw()); add('cake', cake()); add('phone', rotaryPhone());
  add('jet', jet()); add('loader', loader()); add('truck', truck()); add('invoice', invoice()); add('deskPaper', newspaper('MAN POSTS HIMSELF HOME'));
  for (let i = 0; i < 3; i++) add('cam' + i, pressCamera());
  add('note', notebook());
  for (let i = 0; i < 9; i++) { const p = puff(); p.visible = false; scene.add(p); puffs.push(p); }
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above)
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const a = VA(from), b = VA(to), d = Math.hypot(b.x - a.x, b.z - a.z), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = a.clone().lerp(b, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading; x.layers = [['idle', s]]; }
  else { x.heading = Math.atan2(b.x - a.x, b.z - a.z); x.layers = [['idle', s]]; }
  x.moving = moving;
  return { moving, done: u >= 1, arrive: t0 + d / speed };
}
const mixArms = (a, b, k) => { const out = b.map(([sd, u, f]) => { const o = a.find((q) => q[0] === sd) || [sd, 0, 0]; return [sd, lerp(o[1], u, k), lerp(o[2], f, k)]; }); for (const o of a) if (!b.find((q) => q[0] === o[0])) out.push([o[0], lerp(o[1], 0, k), lerp(o[2], 0, k)]); return out; };
const hide = () => ({ visible: false });

// Max sitting in the crate: the sit pose with its legs on the crate floor (seat 1.5 above the root), facing +z.
const FLOOR = CRATE.t, SIT_Y = FLOOR - 1.5, SIT_Z = -0.45;
const IN_CRATE = (o) => V(o.x, o.y + SIT_Y, o.z + SIT_Z);

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.lean) a.bones.Torso.quaternion.premultiply(Q.setFromEuler(EUL.set(x.lean, 0, 0)));
  if (x.nod) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.nod, 0, 0)));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(0, x.look, 0)));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
function paint(f, pal) {
  const i = folk.indexOf(f);
  for (const m of f.mats.shirt) m.color.set(pal.shirt); for (const m of f.mats.pants) m.color.set(pal.pants); for (const m of f.mats.skin) m.color.set(SKIN[i % SKIN.length]);
  f.hivis.visible = pal.wear === 'hivis'; f.uniform.visible = pal.wear === 'uniform'; f.coat.visible = pal.wear === 'coat';
}
// The palm, measured on the pack mesh: the fist is at (-+0.5, -1.3, 0) in the arm bone's frame (R: -0.5, L: +0.5).
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); const k = a.scale || 1; return V((sd === 'R' ? -0.5 : 0.5) * k, -d * k, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const between = (a, d = 1.3) => grip(a, 'L', d).lerp(grip(a, 'R', d), 0.5);
// orient a held prop along the forearm (its +y away from the shoulder), turned by `roll` about that axis
const armDir = (a, sd) => { const b = a.bones['Arm.' + sd]; b.updateMatrixWorld(true); return V(0, -1, 0).transformDirection(b.matrixWorld); };
function alongArm(o, a, sd, extra = null) {
  const b = a.bones['Arm.' + sd]; b.updateMatrixWorld(true);
  const q = new THREE.Quaternion(); b.getWorldQuaternion(q);
  o.quaternion.copy(q).multiply(Q.setFromEuler(EUL.set(PI, 0, 0)));      // the bone's -y (down the arm) becomes the prop's +y
  if (extra) o.quaternion.multiply(Q.setFromEuler(extra));
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.inside, 'inside'], [T.bottles, 'bottles'], [T.later, 'later'], [T.athlete, 'athlete'], [T.daughter, 'daughter'], [T.mailing, 'mailing'], [T.label, 'label'], [T.cod, 'cod'],
  [T.fog, 'fog'], [T.bombay, 'bombay'], [T.burn, 'burn'], [T.lands, 'lands'], [T.cuts, 'cuts'], [T.suit, 'suit'], [T.walks, 'walks'],
  [T.hitch, 'hitch'], [T.makes, 'makes'], [T.forgets, 'forgets'], [T.panics, 'panics'], [T.whole, 'whole'], [T.airline, 'airline'],
  [T.afford, 'afford'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'garage', inside: 'crate', bottles: 'crate', later: 'crate', athlete: 'field', daughter: 'garage', mailing: 'garage', label: 'garage', cod: 'garage', fog: 'fog', bombay: 'bombay', burn: 'hot', lands: 'perth', cuts: 'shed', suit: 'shed', walks: 'perth', hitch: 'outback', makes: 'home', forgets: 'flat', panics: 'flat', whole: 'home', airline: 'office', afford: 'home', cta: 'home' };
function look(stage, p, tg, fov = 40, ext = 18, roll = 0) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

const SKIES = {
  garage: ['#1a2238', '#3a4466', '#1a1f2e', '#2a3048', 60, 400], crate: ['#1a2238', '#3a4466', '#1a1f2e', '#2a3048', 60, 400],
  field: ['#8d97a6', '#d5d9de', '#e6e8ea', '#c9ced4', 120, 520], fog: ['#a6abb2', '#c9ccd0', '#d4d6d9', '#c3c6ca', 4, 70],
  bombay: ['#e08a3a', '#ffd08a', '#ffe2b0', '#f2b874', 90, 420], hot: ['#e08a3a', '#ffd08a', '#ffe2b0', '#f2b874', 90, 420],
  perth: ['#3f86e0', '#cfe6ff', '#eef6ff', '#dcecff', 140, 600], shed: ['#3f86e0', '#cfe6ff', '#eef6ff', '#dcecff', 140, 600],
  outback: ['#2f7fe6', '#bfe4ff', '#f4dcc4', '#f1d8bc', 160, 700], home: ['#3f8ef0', '#cfe8ff', '#eef6ff', '#dcecff', 140, 600],
  flat: ['#1a2238', '#3a4466', '#1a1f2e', '#2a3048', 60, 400], office: ['#3f86e0', '#cfe6ff', '#eef6ff', '#dcecff', 140, 600],
};
function light(stage, place) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  const Lt = {
    garage: { sun: 0, hemi: 0.35, hemiC: '#ffe8c8', env: 0.25, fill: 0.35, rim: 0.6 },
    crate: { sun: 0, hemi: 0.18, hemiC: '#ffe8c8', env: 0.12, fill: 0.25, rim: 0.35 },
    field: { sun: 1.4, hemi: 0.75, hemiC: '#e6ebf2', env: 0.6, fill: 0.6, rim: 0.6 },
    fog: { sun: 0.6, hemi: 0.8, hemiC: '#d9dde2', env: 0.6, fill: 0.5, rim: 0.3 },
    bombay: { sun: 3.6, hemi: 0.6, hemiC: '#ffd8a0', env: 0.6, fill: 0.5, rim: 1.2 },
    hot: { sun: 0, hemi: 0.4, hemiC: '#ffb070', env: 0.25, fill: 0.5, rim: 0.6 },
    perth: { sun: 3.0, hemi: 0.6, hemiC: '#d9ecff', env: 0.6, fill: 0.7, rim: 1.1 },
    shed: { sun: 0, hemi: 0.4, hemiC: '#e8e4dc', env: 0.3, fill: 0.45, rim: 0.6 },
    outback: { sun: 3.4, hemi: 0.6, hemiC: '#ffe8cc', env: 0.6, fill: 0.6, rim: 1.1 },
    home: { sun: 3.0, hemi: 0.6, hemiC: '#d9ecff', env: 0.6, fill: 0.7, rim: 1.0 },
    flat: { sun: 0, hemi: 0.35, hemiC: '#ffe2b0', env: 0.25, fill: 0.4, rim: 0.6 },
    office: { sun: 0, hemi: 0.4, hemiC: '#f4f8ff', env: 0.3, fill: 0.45, rim: 0.7 },
  }[place];
  stage.sun.intensity = Lt.sun; stage.hemi.intensity = Lt.hemi; stage.hemi.color.set(Lt.hemiC); sc.environmentIntensity = Lt.env;
  stage.fill.intensity = Lt.fill; stage.rim.intensity = Lt.rim;
  GA.lamp.intensity = place === 'garage' ? 55 : 0; SH.lamp.intensity = place === 'shed' ? 45 : 0; SH.shaft.intensity = place === 'shed' ? 60 : 0;
  FL.lamp.intensity = place === 'flat' ? 45 : 0; OF.lamp.intensity = place === 'office' ? 32 : 0; HO.porchLamp.intensity = 0;
  const [z, h, b, f, n, fa] = SKIES[place];
  u.zenith.value.set(z); u.horizon.value.set(h); u.below.value.set(b); sc.fog.color.set(f); sc.fog.near = n; sc.fog.far = fa;
}

// ---------- per-shot cast ----------
// Returns a Map actor -> state; anyone not in it is hidden. `folk` states carry a palette.
const HANDLER = { shirt: '#ff8c1a', pants: '#2b2d33', wear: 'hivis' }, CREW = { shirt: '#f4f2ec', pants: '#6b5a3a', wear: null };
const GUARD = { shirt: '#3a4a3a', pants: '#2a3a2a', wear: 'uniform' };
const PRESS = [{ shirt: '#7a6a4a', pants: '#3a3a3a', wear: 'coat' }, { shirt: '#5a4636', pants: '#2b2d33', wear: 'coat' }, { shirt: '#3a3f4a', pants: '#1d1f27', wear: 'coat' }];
const CRATE_G = G(0, 0, 0);
function castStates(s) {
  const M = new Map();
  const id = SHOT;
  if (id === 'hook') {
    // Max stands in the open crate, then sinks in; Leo beside it with the hammer, nails the lid on.
    const x = base(G(0, FLOOR, -0.2), 0.35, 'nervous');
    if (s < T.sink) { x.layers = [['idle', s]]; x.arms = [['L', 0.35, -0.5]]; x.face = s < W.climbs + 0.3 ? 'nervous' : 'happy'; if (s > 0.6 && s < T.sink - 0.1) { x.arms = []; x.wave = true; } }
    else { const k = smooth(inv(T.sink, T.sink + 0.45, s)); x.sit = true; x.pos = V(0, lerp(FLOOR, SIT_Y, k), lerp(-0.2, SIT_Z, k)); x.layers = [['idle', s, 1 - k], ['sit', 0, k + 1e-3, false]]; x.heading = lerp(0.35, 0, k); x.face = 'determined'; }
    if (s >= T.lidOn + 0.2) x.visible = false;            // the lid is on; nothing pokes through
    M.set(max, x);
    const l = base(G(3.9, 0, 2.3), -0.75, 'happy');
    l.arms = [['R', 0.1, -0.55]];
    if (s > T.lidOn) { l.face = 'determined'; const k = smooth(inv(T.lidOn, T.lidOn + 0.3, s)); l.pos = G(lerp(3.9, 3.7, k), 0, lerp(2.3, 1.3, k)); l.heading = lerp(-0.75, -1.2, k); }
    if (s > W.nails) { const ph = ((s - W.nails) / 0.32) % 1; l.arms = [['R', 0.05, lerp(-2.3, -1.05, ph < 0.4 ? easeOut(ph / 0.4) : 1 - smooth((ph - 0.4) / 0.6))], ['L', 0.0, -0.9]]; l.lean = 0.25; }
    M.set(leo, l);
  } else if (id === 'inside' || id === 'bottles' || id === 'later') {
    const x = base(IN_CRATE(CRATE_G), 0, 'neutral'); x.sit = true; x.layers = [['sit', 0, 1, false]];
    x.arms = [['R', 0.15, -1.25]];                         // the torch, up by his face
    if (s > W.water - 0.1) x.look = -0.35 * smooth(inv(W.water - 0.1, W.water + 0.2, s));
    if (s > W.later1 - 0.15) { x.look = lerp(-0.35, 0.55, smooth(inv(W.later1 - 0.15, W.later1 + 0.15, s))); x.face = 'nervous'; }
    if (s > W.later1 + 0.55) { x.look = lerp(0.55, 0, smooth(inv(W.later1 + 0.55, W.later1 + 0.85, s))); x.face = 'annoyed'; }
    M.set(max, x);
  } else if (id === 'athlete') {
    // the javelin throw: run-up, throw, the javelin sails away
    const x = base(F(-4, 0, 6), -R90 + 0.6, 'determined');
    const m = moveTo(x, F(4, 0, 9), F(-1.5, 0, 6.5), T.athlete - 0.1, s, 16, -2.3);
    x.arms = [['R', 0.25, -2.6]];                          // javelin held up by the ear
    if (m.done) { const k = smooth(inv(m.arrive, m.arrive + 0.25, s)); x.arms = [['R', 0.2, lerp(-2.6, -1.0, k)]]; x.heading = -2.3; x.lean = 0.25 * k; x.face = k > 0.5 ? 'happy' : 'determined'; }
    if (s > W.broke - 0.05) { const k = smooth(inv(W.broke - 0.05, W.broke + 0.3, s)); x.heading = lerp(-2.3, -0.75, k); x.lean = 0; x.arms = []; x.layers = [['shrug', s - W.broke + 0.05, 1, false]]; x.face = 'sad'; }
    M.set(max, x);
  } else if (id === 'daughter') {
    const x = base(G(-2.5, 0, 2.5), 0.25, 'nervous'); x.layers = [['idle', s]];
    if (s > W.birthday1 - 0.1) x.face = 'determined';
    M.set(max, x);
  } else if (id === 'mailing') {
    const x = base(G(-3.3, 0, 2.6), 0.75, 'smug'); x.layers = [['point_forward', s - T.mailing, 1, false]]; M.set(max, x);
    const l = base(G(3.4, 0, 2.7), -0.7, 'shocked'); l.layers = [['shock', s - T.mailing - 0.2, 1, false]]; M.set(leo, l);
  } else if (id === 'label' || id === 'cod') {
    if (id === 'cod') { const l = base(G(-4.4, 0, -3.6), -0.75, 'happy'); l.layers = [['idle', s]]; l.arms = [['R', 0.1, -0.55]]; l.face = s > W.exist - 0.1 ? 'nervous' : 'happy'; M.set(leo, l); }
  } else if (id === 'fog') {
    const f = base(A_(-14, 0, 6), 0.4, 'annoyed'); f.layers = [['shrug', s - W.hours1 + 0.2, 1, false]]; if (s < W.hours1 - 0.2) f.layers = [['idle', s]]; f.pal = HANDLER; M.set(folk[0], f);
  } else if (id === 'bombay') {
    const f = base(A_(10, 0, 4), -R90, 'annoyed'); moveTo(f, A_(12, 0, -5.0), A_(-14, 0, -5.0), T.bombay - 0.2, s, 9, -R90); f.arms = [['R', 0.0, lerp(-1.6, -1.9, 0.5 + 0.5 * Math.sin(s * 16))]]; f.pal = CREW; M.set(folk[1], f);
  } else if (id === 'burn') {
    const x = base(IN_CRATE(CRATE_G), 0, 'dizzy'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = [['L', 0.6, -0.4], ['R', 0.6, -0.4]];
    if (s > W.sun - 0.1) x.face = 'scared';
    M.set(max, x);
  } else if (id === 'cuts') {
    const x = base(IN_CRATE(S(0, 0, 0)), 0, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = [['R', 0.1, -1.4]];
    if (s > T.plug + 0.2) { x.face = 'happy'; x.arms = []; }
    M.set(max, x);
  } else if (id === 'suit') {
    const x = base(S(3.6, 0, 3.2), -0.35, 'happy'); x.layers = [['idle', s]];
    if (s < T.change) { x.layers = [['proud', s - T.suit, 1, false]]; }
    if (s > T.change + 0.15) { x.face = 'cool'; x.arms = [['R', -0.12, lerp(-0.4, -1.55, smooth(inv(T.change + 0.2, T.change + 0.45, s)))]]; }
    if (s > W.walks - 0.1) { moveTo(x, S(3.6, 0, 3.2), S(14.5, 0, 4.0), W.walks - 0.1, s, 12, R90); x.arms = []; x.face = 'cool'; }
    M.set(max, x);
  } else if (id === 'walks') {
    const x = base(A_(0, 0, TERMINAL_Z + 2), PI, 'cool');
    moveTo(x, A_(1.5, 0, TERMINAL_Z + 1.0), A_(1.5, 0, TERMINAL_Z - 26), T.walks - 0.25, s, 12, PI);
    x.face = 'cool'; M.set(max, x);
    const g = base(A_(5.6, 0, TERMINAL_Z - 7.0), PI + 0.45, 'sleeping'); g.layers = [['idle', s * 0.4]]; g.nod = 0.25 + 0.05 * Math.sin(s * 2); g.pal = GUARD; M.set(folk[2], g);
  } else if (id === 'hitch') {
    const x = base(O(0, 0, -6.5), -1.9, 'happy'); x.layers = [['idle', s]]; x.arms = [['R', 1.35, -0.25]];      // thumb out
    if (s > W.australia2 + 0.2) { x.arms = []; x.wave = true; x.face = 'laugh'; }
    M.set(max, x);
  } else if (id === 'makes') {
    const x = base(H(-3.4, PORCH_Y, 0.4), 1.05, 'happy'); x.layers = [['idle', s]];
    const m = moveTo(x, H(-3.2, 0, 7.5), H(-3.0, 0, 3.4), T.makes - 0.3, s, 12, 0.95);
    if (m.done && s > W.birthday2 - 0.05) { x.layers = [['proud', s - W.birthday2 + 0.05, 1, false]]; x.face = 'laugh'; }
    M.set(max, x);
    const y = base(H(0.4, PORCH_Y, DOOR_Z - 0.2), -0.75, 'surprised'); y.layers = [['idle', s]];
    if (s > T.makes + 0.45) { y.layers = [['shock', s - T.makes - 0.45, 1, false]]; y.face = 'shocked'; }
    if (s > W.birthday2 + 0.2) { y.layers = [['idle', s]]; y.face = 'laugh'; }
    M.set(mia, y);
    const k = base(H(1.6, PORCH_Y, DOOR_Z), -0.7, 'happy');
    const mk = moveTo(k, H(1.2, PORCH_Y, DOOR_Z - 0.6), H(-1.6, 0, 3.0), T.makes + 0.55, s, 14, -1.9);
    if (mk.done) { k.face = 'laugh'; }
    M.set(kid, k);
  } else if (id === 'forgets') {
    // Leo paces in his flat, back and forth; stops and stares at the phone on "survived"
    const x = base(L(-4.0, 0, -2.0), 0.3, 'nervous');
    const m = moveTo(x, L(-4.5, 0, -2.4), L(0.8, 0, 2.6), T.forgets + 0.1, s, 12, 0.25);
    if (m.done) { x.layers = [['think', s - m.arrive, 1, true]]; x.face = 'nervous'; }
    if (s > W.survived - 0.1) { x.layers = [['idle', s]]; x.heading = lerp(0.25, 0.6, smooth(inv(W.survived - 0.1, W.survived + 0.2, s))); x.face = 'scared'; }
    M.set(leo, x);
  } else if (id === 'panics') {
    const x = base(L(1.0, 0, 0.0), 0.35, 'shocked'); x.layers = [['idle', s]];
    const k = smooth(inv(T.panics, T.panics + 0.3, s));
    x.arms = [['L', lerp(0, -0.35, k), lerp(0, -2.0, k)]];  // the handset up in front of his face
    if (s > W.calls) x.layers = [['talk', s - W.calls, 1, true]];
    M.set(leo, x);
  } else if (id === 'whole') {
    const x = base(H(-1.2, 0, 4.2), 0.15, 'happy'); x.layers = [['proud', s - T.whole, 1, false]]; M.set(max, x);
    const y = base(H(-3.6, 0, 3.2), 0.45, 'happy'); y.layers = [['idle', s]]; M.set(mia, y);
    const k = base(H(1.0, 0, 4.4), -0.2, 'laugh'); k.layers = [['idle', s]]; M.set(kid, k);
    for (let i = 0; i < 3; i++) {
      const p = [H(-6.8, 0, 9.0), H(5.8, 0, 10.0), H(7.2, 0, 6.6)][i];
      const f = base(p, [2.4, -2.35, -1.85][i], ['surprised', 'happy', 'laugh'][i]); f.layers = [['idle', s + i]];
      f.arms = i === 1 ? [['L', 0.1, -0.9], ['R', -0.05, -0.95]] : [['R', 0.05, -1.75], ['L', 0.15, -1.6]];
      f.pal = PRESS[i]; M.set(folk[3 + i], f);
    }
  } else if (id === 'airline') {
    const x = base(C(0, 0, -4.2), 0, 'neutral'); x.layers = [['idle', s]];
    x.arms = [['L', -0.12, -1.25], ['R', -0.12, -1.25]];  // the bill in both hands
    if (s > W.airline + 0.1) x.face = 'surprised';
    if (s > T.tear) { const k = smooth(inv(T.tear, T.tear + 0.25, s)); x.arms = [['L', lerp(-0.12, 0.35, k), -1.25], ['R', lerp(-0.12, 0.35, k), -1.25]]; x.face = 'smug'; }
    if (s > W.bill + 0.3) x.face = 'happy';
    M.set(skye, x);
  } else if (id === 'afford' || id === 'cta') {
    const x = base(H(-0.4, 0, 6.2), 0.1, 'happy'); x.layers = [['idle', s]]; if (s > W.never - 0.1 && s < T.cta) { x.layers = [['laugh_big', s - W.never + 0.1, 1, false]]; x.face = 'laugh'; } M.set(max, x);
    const y = base(H(-2.8, 0, 5.6), 0.35, 'happy'); y.layers = [['idle', s + 1]]; M.set(mia, y);
    const k = base(H(1.8, 0, 6.8), -0.2, 'laugh'); k.layers = [['idle', s + 2]]; if (s > T.afford + 0.3) k.wave = true; M.set(kid, k);
  }
  return M;
}

// a poof burst: puffs around p, expanding and fading over 0.55 s after t0
const BURSTS = [];
export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id; NOW = s;
  const where = PLACE_OF[SHOT];
  light(stage, where);

  // ---------- cast ----------
  for (const a of [max, mia, leo, skye, kid, ...folk]) a.root.visible = false;
  const states = castStates(s);
  const isVest = (SHOT === 'burn' || SHOT === 'cuts' || (SHOT === 'suit' && s < T.change));
  DRESS.vest.visible = isVest; DRESS.suit.visible = !isVest && s >= T.change;
  DRESS.clerk.visible = SHOT === 'airline';
  for (const a of [max, mia, leo, skye, kid]) if (states.has(a)) place(a, states.get(a));
  folk.forEach((f) => { const x = states.get(f); if (x) { paint(f, x.pal); place(f, x); f.state = x; } });

  // ---------- props ----------
  for (const p of Object.values(PROPS)) p.visible = false;
  BURSTS.length = 0;
  const show = (key, pos, yaw = 0, sc = 1) => { const o = PROPS[key]; o.visible = true; o.position.copy(pos); o.rotation.set(0, yaw, 0); o.scale.setScalar(sc); return o; };
  const hy = (a) => a.root.rotation.y;
  const CR = PROPS.crate, cu = CR.userData; cu.front.visible = true; cu.lid.visible = true; cu.lid.position.set(0, CRATE.h, 0); cu.lid.rotation.set(0, 0, 0);
  const contents = (o, flipped = false) => {      // the things in the crate (relative to crate origin o)
    if (!flipped) {
      show('pillow', o.clone().add(V(-1.85, FLOOR + 0.5, -1.3)), 0).rotation.set(0.25, 0.6, R90);
      show('tins', o.clone().add(V(-2.1, FLOOR, 0.6)), 0.3);
      show('water', o.clone().add(V(1.85, FLOOR, 0.9)), 0); show('later', o.clone().add(V(2.15, FLOOR, -0.2)), 0);
      show('blanket', o.clone().add(V(1.9, FLOOR, -1.1)), 0.2);
    } else {                                       // upside down: everything has fallen onto the lid
      const top = CRATE.h - FLOOR;
      show('tins', o.clone().add(V(-1.9, top, 0.7)), 1.2).rotation.x = PI;
      const w = show('water', o.clone().add(V(1.6, top - 0.27, 0.9)), 0); w.rotation.set(0, 0.3, R90 + 0.1);
      const l = show('later', o.clone().add(V(2.05, top, -0.4)), 0); l.rotation.set(PI, 0, 0);
      show('pillow', o.clone().add(V(0, top - 0.25, -0.5)), 0).rotation.set(R90, 0, 0.2);
      show('blanket', o.clone().add(V(-1.6, top, -1.0)), 0.5).rotation.x = PI;
    }
  };
  if (SHOT === 'hook') {
    show('crate', CRATE_G, 0);
    const k = smooth(inv(T.lidOn, T.lidOn + 0.25, s));
    if (k <= 0) { cu.lid.position.set(CRATE.w / 2 + 0.9, 1.9, 0.6); cu.lid.rotation.set(0, 0, -1.25); }      // leaning on the side
    else { cu.lid.position.set(lerp(CRATE.w / 2 + 0.9, 0, k), lerp(1.9, CRATE.h, k) + 0.6 * Math.sin(k * PI), lerp(0.6, 0, k)); cu.lid.rotation.set(0, 0, lerp(-1.25, 0, k)); }
    if (leo.root.visible) { const h = show('hammer', grip(leo, 'R'), 0); alongArm(h, leo, 'R', EUL.set(0, R90, 0)); }
    if (max.root.visible) contents(CRATE_G);
  } else if (where === 'crate' || SHOT === 'burn') {
    show('crate', CRATE_G, 0); cu.front.visible = false;
    contents(CRATE_G, SHOT === 'burn');
    if (SHOT !== 'burn') { const tc = show('torch', grip(max, 'R').add(V(0, -0.1, 0)), 0, 1.6); tc.rotation.set(-0.35, 0, 0); tc.userData.beam.intensity = 18; }   // held upright, lighting his face
  } else if (SHOT === 'athlete') {
    if (max.root.visible) {
      const m = moveTo({}, F(4, 0, 9), F(-1.5, 0, 6.5), T.athlete - 0.1, s, 16, 0);
      const rel = m.arrive + 0.15;
      if (s < rel) { const j = show('javelin', grip(max, 'R'), 0); alongArm(j, max, 'R', EUL.set(R90 + 0.25, 0, 0)); }
      else { const k = s - rel, j = show('flyJav', F(-2.5 - 14 * k, 5.2 + 9 * k - 9.8 * k * k, 6.5 - 10 * k), 0); j.rotation.set(0, -2.3 + PI, 0); j.rotateX(R90 - Math.atan2(9 - 19.6 * k, 17)); }
    }
  } else if (SHOT === 'daughter' || SHOT === 'mailing' || SHOT === 'label' || SHOT === 'cod') {
    show('crate', CRATE_G, 0);
    if (SHOT === 'daughter') { cu.lid.position.set(CRATE.w / 2 + 0.9, 1.9, 0.6); cu.lid.rotation.set(0, 0, -1.25); }
  } else if (where === 'fog') {
    const J = show('jet', A_(10, 0, -6), R90); J.userData.body.position.y = 0;
    const Lo = show('loader', A_(-10.5, 0, -6), 0); const h = 1.6 * smooth(inv(T.lift, T.lift + 2.0, s)); setLoader(Lo, h);
    show('crate', A_(-10.5, 1.9 + h, -6), 0.15);
  } else if (where === 'bombay') {
    show('jet', A_(30, 0, -18), R90 + 0.3);
    const c = show('crate', A_(0, CRATE.h, 0), 0.25); c.rotation.set(0, 0.25, PI);
  } else if (SHOT === 'lands') {
    const k = clamp((s - T.lands) / Math.max(0.5, T.cuts - T.lands)), J = show('jet', A_(lerp(-120, 30, k), lerp(26, 0, Math.min(1, k * 1.25)), -40), R90);
    J.userData.body.rotation.x = -0.12 * (1 - smooth(clamp(k * 1.3)));
  } else if (SHOT === 'cuts') {
    const o = S(0, 0, 0); show('crate', o, 0); cu.front.visible = false;
    const cf = show('cut', o.clone().add(V(0, 0, CRATE.d / 2 - CRATE.t / 2)), 0), [hx0, hx1, hy0, hy1] = cf.userData.hole, plug = cf.userData.plug;
    const fall = smooth(inv(T.plug, T.plug + 0.35, s)); plug.rotation.x = R90 * fall; plug.position.z = 0.05 * fall;
    if (s < T.plug + 0.05) {                       // the saw runs round the square, its blade poking through
      const per = 2 * (hx1 - hx0 + hy1 - hy0), d = ((s - T.cuts) * 4.2) % per; let px, py;
      const w = hx1 - hx0, h = hy1 - hy0;
      if (d < w) { px = hx0 + d; py = hy1; } else if (d < w + h) { px = hx1; py = hy1 - (d - w); } else if (d < 2 * w + h) { px = hx1 - (d - w - h); py = hy0; } else { px = hx0; py = hy0 + (d - 2 * w - h); }
      const sw = show('saw', o.clone().add(V(px, py, CRATE.d / 2 - 1.2 + 0.25 * Math.sin(s * 30))), 0); sw.rotation.set(R90, 0, 0);
    }
  } else if (SHOT === 'suit') {
    const o = S(0, 0, 0); show('crate', o, 0); cu.front.visible = false;
    const cf = show('cut', o.clone().add(V(0, 0, CRATE.d / 2 - CRATE.t / 2)), 0); cf.userData.plug.rotation.x = R90; cf.userData.plug.position.z = 0.05;
    if (s >= T.change - 0.05 && s < T.change + 0.6) BURSTS.push([max.root.position.clone().add(V(0, 2.8, 0.6)), T.change - 0.05, 1.3]);
  } else if (SHOT === 'hitch') {
    const k = clamp((s - T.hitch + 0.4) / Math.max(0.6, W.australia2 - T.hitch + 0.2));
    show('truck', O(lerp(-70, 4, easeOut(k)), 0, 2.4), 0);
  } else if (SHOT === 'makes') {
    show('cake', H(CAKE_AT.x, CAKE_AT.y, CAKE_AT.z), 0);
  } else if (where === 'flat') {
    const P = show('phone', L(PHONE_AT.x, PHONE_AT.y, PHONE_AT.z), -0.3), hd = P.userData.hand;
    if (SHOT === 'panics' && leo.root.visible && s > T.panics + 0.12) { const g = grip(leo, 'L'); hd.position.copy(P.worldToLocal(g.clone())); hd.quaternion.copy(P.quaternion.clone().invert()).multiply(Q.setFromEuler(EUL.set(-0.25, hy(leo), 0, 'YXZ'))); }   // upright in his fist, earpiece up
    else { hd.position.copy(P.userData.rest.pos); hd.rotation.copy(P.userData.rest.rot); }
  } else if (SHOT === 'whole') {
    show('cake', H(CAKE_AT.x, CAKE_AT.y, CAKE_AT.z), 0);
    folk.slice(3, 6).forEach((f, i) => {
      if (!f.root.visible) return;
      if (i === 1) { show('note', grip(f, 'L'), hy(f)).rotation.x = -0.4; return; }
      const c = show('cam' + i, grip(f, 'R'), hy(f)); c.rotation.x = -0.1;
      const fl = ((s - T.whole + i * 0.37) % 0.9) < 0.08; c.userData.bulb.material.emissiveIntensity = fl ? 8 : 0;
    });
  } else if (SHOT === 'airline') {
    const pd = show('deskPaper', C(1.6, DESK_AT.y + 0.03, DESK_AT.z + 0.2), 0); pd.rotation.set(-R90, 0, 0.25);
    const inv0 = show('invoice', between(skye).add(V(0, 0.45, 0.05)), hy(skye)); const k = smooth(inv(T.tear, T.tear + 0.25, s));
    inv0.userData.L.rotation.z = 0.5 * k; inv0.userData.L.position.x = -0.35 * k; inv0.userData.R.rotation.z = -0.5 * k; inv0.userData.R.position.x = 0.35 * k;
  } else if (SHOT === 'afford' || SHOT === 'cta') {
    const o = H(3.6, 0, 2.2); const c = show('crate', o, -0.35); c.userData.front.visible = false; c.userData.lid.visible = true;
    const cf = show('cut', o.clone().add(V(Math.sin(-0.35) * (CRATE.d / 2 - CRATE.t / 2), 0, Math.cos(-0.35) * (CRATE.d / 2 - CRATE.t / 2))), -0.35); cf.userData.plug.visible = false;
    show('cake', H(CAKE_AT.x, CAKE_AT.y, CAKE_AT.z), 0);
  }
  if (PROPS.cut.visible) PROPS.cut.userData.plug.visible = !(SHOT === 'afford' || SHOT === 'cta');

  // the door at home opens for Mia
  HO.door.rotation.y = SHOT === 'makes' ? -1.6 * smooth(inv(T.makes + 0.15, T.makes + 0.5, s)) : 0;
  // the flat's clock hands spin while Leo waits
  if (where === 'flat') { const sp = SHOT === 'forgets' ? (s - T.forgets) * 9 : 0; FL.clockHands[0].rotation.z = -sp * 0.15 - 1; FL.clockHands[1].rotation.z = -sp * 1.8; }
  // airport sign by place
  for (const [k, m] of Object.entries(AP.signs)) m.visible = k === (where === 'fog' ? 'london' : where === 'bombay' ? 'bombay' : 'perth');
  // the lid lands with a puff
  if (SHOT === 'hook' && s >= T.lidOn + 0.22 && s < T.lidOn + 0.8) BURSTS.push([G(0, CRATE.h + 0.2, 0), T.lidOn + 0.22, 1.6]);
  if (SHOT === 'cuts' && s >= T.plug + 0.3 && s < T.plug + 0.9) BURSTS.push([S(0, 0.4, CRATE.d / 2 + 1.5), T.plug + 0.3, 1.3]);
  let pi = 0; for (const p of puffs) p.visible = false;
  for (const [pos, t0, size] of BURSTS) {
    const a = (s - t0) / 0.55; if (a < 0 || a > 1) continue;
    for (let j = 0; j < 6 && pi < puffs.length; j++, pi++) {
      const p = puffs[pi], ang = j / 6 * 6.283 + t0 * 3;
      p.visible = true; p.position.copy(pos).add(V(Math.cos(ang) * size * 0.8 * easeOut(a), 0.4 * size * a, Math.sin(ang) * size * 0.5 * easeOut(a)));
      p.scale.setScalar(size * (0.35 + 0.5 * easeOut(a))); p.material.opacity = 0.85 * (1 - a);
    }
  }

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  switch (shot.id) {
    case 'hook': look(stage, G(lerp(2.4, 2.8, u), lerp(7.0, 7.8, u), lerp(15.0, 16.2, u)), G(1.0, 3.4, 0.4), 50, 14); break;
    case 'inside': look(stage, G(lerp(0.3, 0.0, u), 3.2, lerp(10.0, 9.2, u)), G(0, 2.0, 0), 52, 8); break;
    case 'bottles': look(stage, G(lerp(1.1, 0.9, u), 3.0, lerp(7.4, 6.8, u)), G(1.0, 2.1, 0.0), 50, 8); break;
    case 'later': look(stage, G(lerp(1.9, 1.7, u), 3.0, lerp(4.6, 4.2, u)), G(0.7, 2.5, -0.3), 48, 8); break;
    case 'athlete': { const fx = clamp(mp.x - FIELD.x, -3, 4); look(stage, F(fx + 1.5, 4.6, 18.5), F(fx - 1.2, 4.0, 6.5), 50, 20); break; }
    case 'daughter': look(stage, G(lerp(-1.2, -0.6, u), 5.0, 11.5), G(-0.8, 3.8, 0.5), 52, 14); break;
    case 'mailing': look(stage, G(lerp(0.6, 0.0, u), lerp(7.6, 7.0, u), lerp(18.0, 16.8, u)), G(0, 4.6, 0.5), 52, 16); break;
    case 'label': look(stage, G(lerp(0.6, 0.3, u), 2.6, lerp(6.6, 5.9, u)), G(0, 2.1, 0), 50, 8); break;
    case 'cod': look(stage, G(lerp(-9.4, -8.6, u), 3.6, lerp(1.6, 1.0, u)), G(-2.6, 2.8, -0.6), 50, 10); break;
    case 'fog': look(stage, A_(lerp(-21, -19.5, u), 6.5, 17), A_(-6, 6.0, -6), 50, 30); break;
    case 'bombay': look(stage, A_(lerp(6.5, 5.6, u), 4.0, lerp(10.5, 9.5, u)), A_(-0.5, 2.6, 0), 50, 14); break;
    case 'burn': look(stage, G(lerp(0.3, -0.2, u), 3.1, lerp(6.4, 5.8, u)), G(0, 2.2, 0), 52, 8, PI); break;
    case 'lands': look(stage, A_(lerp(18, 26, u), 4.0, 22), A_(lerp(-40, 20, u), 6.0, -40), 48, 60); break;
    case 'cuts': look(stage, S(lerp(6.0, 5.4, u), 3.4, lerp(8.6, 7.8, u)), S(0, 2.0, 1.4), 50, 10); break;
    case 'suit': { const fx = clamp(mp.x - SHED.x, 2, 9); look(stage, S(fx + 1.6, 4.4, 12.5), S(fx - 1.0, 3.4, 2.4), 50, 14); break; }
    case 'walks': { const fz = mp.z - APRON.z; look(stage, A_(lerp(4.8, 4.2, u), 4.2, fz - 13.5), A_(3.0, 3.8, fz), 52, 22); break; }
    case 'hitch': look(stage, O(lerp(-12.5, -11.5, u), 4.8, -14.5), O(-0.6, 3.6, -5.6), 52, 26); break;
    case 'makes': look(stage, H(lerp(2.2, 1.6, u), 5.6, lerp(15.5, 14.5, u)), H(-0.8, 3.6, 0.6), 52, 18); break;
    case 'forgets': look(stage, L(lerp(-0.6, 0.2, u), 5.4, 14), L(0.2, 4.2, 0), 54, 16); break;
    case 'panics': look(stage, L(lerp(3.6, 3.2, u), 4.8, lerp(7.6, 6.8, u)), L(1.2, 4.2, -0.6), 48, 12); break;
    case 'whole': look(stage, H(lerp(-0.6, 0.6, u), 7.0, lerp(24, 23, u)), H(-0.2, 5.6, 4), 52, 22); break;
    case 'airline': look(stage, C(lerp(0.8, 0.4, u), 5.4, lerp(4.6, 3.8, u)), C(0, 4.6, -4.2), 48, 12); break;
    case 'afford': case 'cta': { const k = easeOut(clamp((t - T.afford) / (meta.seconds - T.afford))); look(stage, H(lerp(0.2, 0.6, k), lerp(5.8, 6.6, k), lerp(17.5, 20.5, k)), H(0.3, lerp(4.4, 5.2, k), 4.8), 50, 22); break; }
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  stage.skyMesh.position.copy(stage.camera.position);
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
// a pointer label at a 3D point (projected), popping in at t0
function pointAt(g, s, t, t0, p, text, dx, dy, color = '#ffffff') {
  if (!cam || t < t0) return;
  const v = p.clone().project(cam), x = (v.x + 1) / 2 * 1080, y = (1 - v.y) / 2 * 1920, k = easeOutBack(clamp((t - t0) / 0.2), 1.7);
  g.save(); g.globalAlpha = clamp((t - t0) / 0.12);
  g.strokeStyle = '#ffffff'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x + dx * 0.8) * s, (y + dy * 0.8) * s); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x * s, y * s, 9 * s, 0, 7); g.fill();
  g.restore();
  bigText(g, s, text, x + dx, y + dy, 60, color, k, 0);
}
// the world map card: a dotted route from a to b with a crate (or a thumb) moving along it
function routeCard(g, s, t, t0, t1, from, to, mode) {
  const a = clamp((t - t0) / 0.25); if (a <= 0) return;
  const k = easeOutBack(a, 1.5), p = smooth(clamp((t - t0 - 0.2) / Math.max(0.4, t1 - t0 - 0.4)));
  g.save(); g.translate(540 * s, 600 * s); g.scale(k, k);
  roundRect(g, -430 * s, -250 * s, 860 * s, 500 * s, 34 * s); g.fillStyle = '#9fd0f5'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#16182a'; g.stroke();
  g.save(); g.beginPath(); roundRect(g, -426 * s, -246 * s, 852 * s, 492 * s, 30 * s); g.clip();
  g.fillStyle = '#7dbb6a'; g.strokeStyle = '#3f7a3a'; g.lineWidth = 4 * s;
  const blob = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s))); g.closePath(); g.fill(); g.stroke(); };
  if (mode === 'world') {
    blob([[-400, -200], [-250, -230], [-180, -120], [-120, -40], [-40, -80], [40, -150], [180, -200], [300, -150], [260, -40], [150, 0], [60, 40], [-30, 30], [-120, 60], [-200, 10], [-300, -40], [-400, -60]]);   // Europe + Asia
    blob([[-220, 40], [-120, 70], [-90, 160], [-150, 240], [-230, 160]]);                                     // Africa
    blob([[180, 120], [300, 100], [380, 150], [370, 220], [260, 240], [180, 200]]);                             // Australia
  } else {
    blob([[-420, -230], [420, -230], [420, 220], [250, 160], [80, 210], [-60, 140], [-220, 210], [-420, 120]]); // Australia, close
    g.fillStyle = '#9fd0f5'; g.beginPath(); g.ellipse(40 * s, 230 * s, 160 * s, 60 * s, 0, 0, 7); g.fill();
  }
  g.restore();
  const [ax, ay, an] = from, [bx, by, bn] = to;
  const qx = (ax + bx) / 2, qy = Math.min(ay, by) - (mode === 'world' ? 110 : 80);
  const P = (u) => [(1 - u) ** 2 * ax + 2 * (1 - u) * u * qx + u * u * bx, (1 - u) ** 2 * ay + 2 * (1 - u) * u * qy + u * u * by];
  g.fillStyle = '#e63946'; for (let i = 0; i <= 40; i++) { const u = i / 40; if (u > p) break; const [x, y] = P(u); g.beginPath(); g.arc(x * s, y * s, 6 * s, 0, 7); g.fill(); }
  for (const [x, y, n] of [[ax, ay, an], [bx, by, bn]]) { g.fillStyle = '#16182a'; g.beginPath(); g.arc(x * s, y * s, 13 * s, 0, 7); g.fill(); g.font = `800 ${32 * s}px Montserrat`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8 * s; g.strokeStyle = '#ffffff'; g.strokeText(n, x * s, (y + 40) * s); g.fillStyle = '#16182a'; g.fillText(n, x * s, (y + 40) * s); }
  const [cx, cy] = P(p);
  if (mode === 'world') { g.fillStyle = '#b07a46'; g.strokeStyle = '#5a3a1a'; g.lineWidth = 5 * s; g.fillRect((cx - 34) * s, (cy - 26) * s, 68 * s, 52 * s); g.strokeRect((cx - 34) * s, (cy - 26) * s, 68 * s, 52 * s); g.beginPath(); g.moveTo((cx - 34) * s, (cy - 26) * s); g.lineTo((cx + 34) * s, (cy + 26) * s); g.stroke(); }
  else { g.fillStyle = '#2d6a9f'; g.strokeStyle = '#16182a'; g.lineWidth = 5 * s; g.fillRect((cx - 40) * s, (cy - 20) * s, 52 * s, 34 * s); g.strokeRect((cx - 40) * s, (cy - 20) * s, 52 * s, 34 * s); g.fillRect((cx + 12) * s, (cy - 8) * s, 28 * s, 22 * s); g.strokeRect((cx + 12) * s, (cy - 8) * s, 28 * s, 22 * s); g.fillStyle = '#16182a'; for (const wx of [-26, 26]) { g.beginPath(); g.arc((cx + wx) * s, (cy + 16) * s, 10 * s, 0, 7); g.fill(); } }
  g.restore();
}
// the "broke" wallet
function wallet(g, s, t, t0) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return; const k = easeOutBack(a, 1.7);
  g.save(); g.translate(760 * s, 520 * s); g.rotate(0.08); g.scale(k, k);
  roundRect(g, -150 * s, -100 * s, 300 * s, 200 * s, 24 * s); g.fillStyle = '#6e4526'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#16182a'; g.stroke();
  g.fillStyle = '#4a2c16'; roundRect(g, -150 * s, -100 * s, 300 * s, 70 * s, 24 * s); g.fill();
  g.restore();
  bigText(g, s, '£0', 760, 530, 120, '#ffffff', k, 0.08);
  // a moth flutters out
  const m = clamp((t - t0 - 0.2) / 1.2); if (m > 0) { g.save(); g.translate((760 + 120 * m) * s, (440 - 160 * m) * s); g.fillStyle = '#d9cfb8'; const f = Math.abs(Math.sin(t * 22)); g.beginPath(); g.ellipse(-16 * s, 0, 18 * s, 11 * s * f + 2 * s, 0.4, 0, 7); g.ellipse(16 * s, 0, 18 * s, 11 * s * f + 2 * s, -0.4, 0, 7); g.fill(); g.restore(); }
}
// the birthday postcard
function postcard(g, s, t, t0) {
  const a = clamp((t - t0) / 0.25); if (a <= 0) return; const k = easeOutBack(a, 1.6);
  g.save(); g.translate(740 * s, 560 * s); g.rotate(0.06); g.scale(k, k);
  g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 18 * s; g.fillStyle = '#fbf8ef'; g.fillRect(-230 * s, -170 * s, 460 * s, 340 * s); g.shadowColor = 'transparent';
  g.fillStyle = '#ffd6e7'; g.fillRect(-210 * s, -150 * s, 200 * s, 300 * s);
  // a little block girl in a party hat
  g.fillStyle = '#f5d0a9'; g.fillRect(-140 * s, -80 * s, 60 * s, 60 * s); g.fillStyle = '#ff8fb8'; g.fillRect(-150 * s, -20 * s, 80 * s, 90 * s); g.fillStyle = '#2b2d42'; g.fillRect(-140 * s, 70 * s, 26 * s, 50 * s); g.fillRect(-106 * s, 70 * s, 26 * s, 50 * s);
  g.fillStyle = '#ff4d8d'; g.beginPath(); g.moveTo(-136 * s, -80 * s); g.lineTo(-84 * s, -80 * s); g.lineTo(-110 * s, -140 * s); g.fill();
  g.fillStyle = '#16182a'; g.fillRect(-126 * s, -60 * s, 8 * s, 8 * s); g.fillRect(-104 * s, -60 * s, 8 * s, 8 * s);
  g.font = `${44 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff4d8d'; g.fillText('HAPPY', 110 * s, -90 * s); g.fillText('BIRTHDAY', 110 * s, -40 * s);
  g.font = `800 ${26 * s}px Montserrat`; g.fillStyle = '#16182a'; g.fillText('ADELAIDE,', 110 * s, 40 * s); g.fillText('AUSTRALIA', 110 * s, 76 * s);
  g.restore();
}
// the fog delay board
function delayBoard(g, s, t) {
  const a = clamp((t - W.grounds + 0.1) / 0.2); if (a <= 0) return; const k = easeOutBack(a, 1.6);
  g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
  roundRect(g, -340 * s, -110 * s, 680 * s, 220 * s, 20 * s); g.fillStyle = '#16182a'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.font = `800 ${34 * s}px Montserrat`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffd23f'; g.fillText('FREIGHT · PERTH', -300 * s, -50 * s);
  const blink = Math.sin(t * 9) > -0.3; g.font = `${76 * s}px "Luckiest Guy"`; g.fillStyle = blink ? '#ff5a5f' : '#7a2a2e'; g.fillText('DELAYED', -300 * s, 40 * s);
  // a clock whose hands race
  g.translate(220 * s, 0); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 80 * s, 0, 7); g.fill(); g.strokeStyle = '#16182a'; g.lineWidth = 6 * s; g.stroke();
  const r = (t - W.grounds) * 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(r) * 62 * s, -Math.cos(r) * 62 * s); g.stroke(); g.lineWidth = 8 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(r / 12) * 40 * s, -Math.cos(r / 12) * 40 * s); g.stroke();
  g.restore();
}
// heat: a thermometer and sweat drops
function heat(g, s, t, t0) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha = 0.22 * a; const gr = g.createRadialGradient(540 * s, 960 * s, 260 * s, 540 * s, 960 * s, 1100 * s); gr.addColorStop(0, 'rgba(255,120,30,0)'); gr.addColorStop(1, 'rgba(255,90,20,1)'); g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
  const k = easeOutBack(a, 1.6), lvl = smooth(clamp((t - t0) / 1.4));
  g.save(); g.translate(900 * s, 560 * s); g.scale(k, k);
  roundRect(g, -36 * s, -200 * s, 72 * s, 330 * s, 36 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16182a'; g.stroke();
  g.fillStyle = '#e63946'; g.beginPath(); g.arc(0, 140 * s, 58 * s, 0, 7); g.fill(); g.stroke(); g.fillRect(-18 * s, (120 - 300 * lvl) * s, 36 * s, 300 * lvl * s);
  g.restore();
}
function sweat(g, s, t, t0) {
  if (t < t0) return;
  for (let i = 0; i < 5; i++) { const ph = ((t - t0) * 1.3 + i * 0.21) % 1; const x = [430, 520, 600, 470, 640][i], y = 700 + ph * 300; g.save(); g.globalAlpha = 1 - ph; g.fillStyle = '#8fd3ff'; g.strokeStyle = '#16182a'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x * s, (y - 30) * s); g.quadraticCurveTo((x + 18) * s, y * s, x * s, (y + 14) * s); g.quadraticCurveTo((x - 18) * s, y * s, x * s, (y - 30) * s); g.fill(); g.stroke(); g.restore(); }
}
// a speech bubble
function bubble(g, s, t, t0, lines, x, y, w = 560, tail = [-1, 1]) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return; const k = easeOutBack(a, 1.7);
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  const h = 70 + 70 * lines.length;
  g.fillStyle = '#ffffff'; g.strokeStyle = '#16182a'; g.lineWidth = 7 * s;
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 46 * s); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(tail[0] * 60 * s, (h / 2 - 4) * s); g.lineTo(tail[0] * 120 * s, (h / 2 + 70) * s); g.lineTo(tail[0] * 10 * s, (h / 2 - 4) * s); g.fill(); g.stroke();
  g.fillStyle = '#ffffff'; g.fillRect(tail[0] * 64 * s - 24 * s * (tail[0] < 0 ? -1 : 0), (h / 2 - 12) * s, 0, 0);
  g.font = `${56 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#16182a';
  lines.forEach((l, i) => g.fillText(l, 0, (-(lines.length - 1) * 35 + i * 70 + 4) * s));
  g.restore();
}
// spinning newspaper fronts
const HEADS = [['THE DAILY NEWS', 'MAN POSTS', 'HIMSELF HOME'], ['THE ADVERTISER', '63 HOURS', 'IN A BOX!'], ['EVENING STAR', 'THE HUMAN', 'PARCEL'], ['THE WEST', 'HE FLEW', 'AS FREIGHT']];
function papers(g, s, t) {
  HEADS.forEach(([name, h1, h2], i) => {
    const t0 = W.whole - 0.05 + i * 0.3, a = clamp((t - t0) / 0.35); if (a <= 0) return;
    const k = easeOutBack(a, 1.4), spin = (1 - easeOut(a)) * 6.0;
    const [x, y, r] = [[300, 420, -0.12], [780, 470, 0.1], [330, 820, 0.08], [760, 860, -0.07]][i];
    g.save(); g.translate(x * s, y * s); g.rotate(r + spin); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 20 * s; g.fillStyle = '#f2ead8'; g.fillRect(-190 * s, -230 * s, 380 * s, 460 * s); g.shadowColor = 'transparent';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${32 * s}px "Playfair Display"`; g.fillStyle = '#16182a'; g.fillText(name, 0, -195 * s);
    g.fillRect(-170 * s, -172 * s, 340 * s, 4 * s);
    g.font = `${50 * s}px "Luckiest Guy"`; g.fillStyle = i % 2 ? '#16182a' : '#b0121b'; g.fillText(h1, 0, -125 * s); g.fillText(h2, 0, -70 * s);
    g.fillStyle = '#c8a46a'; g.fillRect(-100 * s, -30 * s, 200 * s, 150 * s); g.fillStyle = '#7a4b2c'; g.fillRect(-88 * s, -18 * s, 176 * s, 126 * s);
    g.font = `${34 * s}px "Luckiest Guy"`; g.fillStyle = '#16182a'; g.fillText('PAINT', 0, 46 * s);
    g.fillStyle = 'rgba(22,24,42,.35)'; for (let j = 0; j < 3; j++) { g.fillRect(-175 * s, (150 + j * 22) * s, 350 * s, 7 * s); }
    g.restore();
  });
}
export function overlay(g, s, t) {
  if (SHOT === 'hook' && t < T.inside) tag(g, s, t, 0.0, 'LONDON, 1964');
  const o = GARAGE;
  if (SHOT === 'inside') {
    pointAt(g, s, t, W.pillow - 0.05, V(o.x - 1.85, FLOOR + 0.6, o.z - 1.3), 'PILLOW', 40, -330);
    pointAt(g, s, t, W.torch - 0.05, grip(max, 'R').add(armDir(max, 'R').multiplyScalar(-0.6)), 'TORCH', 170, -260);
    pointAt(g, s, t, W.tinned - 0.05, V(o.x - 2.0, FLOOR + 0.7, o.z + 0.6), 'FOOD', -160, 200);
  }
  if (SHOT === 'bottles') {
    pointAt(g, s, t, W.water - 0.1, V(o.x + 1.85, FLOOR + 0.9, o.z + 0.9), 'WATER', -40, 300, '#8fd3ff');
  }
  if (SHOT === 'later') bigText(g, s, 'ONE FOR... LATER', 540, 330, 82, '#ffd23f', easeOutBack(clamp((t - T.later) / 0.2), 1.6), -0.04);
  if (SHOT === 'athlete') { tag(g, s, t, T.athlete, 'JAVELIN THROWER'); if (t > W.broke - 0.05) wallet(g, s, t, W.broke - 0.05); }
  if (SHOT === 'daughter') postcard(g, s, t, T.daughter);
  if (SHOT === 'mailing') routeCard(g, s, t, W.mailing - 0.05, T.label, [-120, -110, 'LONDON'], [270, 170, 'PERTH'], 'world');
  if (SHOT === 'label' && t > W.paint - 0.05) stamp(g, s, t, W.paint - 0.05, '(NOT PAINT)', 540, 600, '#e63946', 70, -0.08);
  if (SHOT === 'cod') {
    if (t > W.cash - 0.05) stamp(g, s, t, W.cash - 0.05, 'C.O.D.', 540, 420, '#d62828', 110, -0.06);
    if (t > W.delivery - 0.05) bigText(g, s, 'THEY PAY ON ARRIVAL', 540, 560, 50, '#ffffff', easeOutBack(clamp((t - W.delivery + 0.05) / 0.2), 1.6), -0.04);
    if (t > W.exist - 0.1) stamp(g, s, t, W.exist - 0.1, "DOESN'T EXIST", 540, 1340, '#e63946', 90, 0.08);
  }
  if (SHOT === 'fog') { tag(g, s, t, T.fog, 'LONDON AIRPORT'); delayBoard(g, s, t); }
  if (SHOT === 'bombay') { tag(g, s, t, T.bombay, 'BOMBAY, INDIA'); if (t > W.upside - 0.05) stamp(g, s, t, W.upside - 0.05, 'UPSIDE DOWN', 540, 520, '#e63946', 90, 0.1); }
  if (SHOT === 'burn') { heat(g, s, t, T.burn); sweat(g, s, t, T.burn + 0.2); }
  if (SHOT === 'lands') {
    tag(g, s, t, T.lands, 'PERTH, AUSTRALIA');
    const k = easeOut(clamp((t - W.sixty + 0.1) / 0.9)), n = Math.round(63 * k);
    bigText(g, s, `${n}`, 540, 420, 190, '#ffffff', easeOutBack(clamp((t - W.sixty + 0.1) / 0.2), 1.8), -0.04);
    bigText(g, s, 'HOURS IN A BOX', 540, 570, 80, '#ffd23f', easeOutBack(clamp((t - W.sixty) / 0.2), 1.8), -0.04);
  }
  if (SHOT === 'walks' && t > W.airport - 0.2) bigText(g, s, 'NOBODY STOPS HIM', 540, 470, 74, '#ffffff', easeOutBack(clamp((t - W.airport + 0.2) / 0.2), 1.6), -0.04);
  if (SHOT === 'hitch') routeCard(g, s, t, W.hitchhikes - 0.05, T.makes, [-300, -40, 'PERTH'], [250, 40, 'ADELAIDE'], 'aus');
  if (SHOT === 'makes' && t > W.birthday2 - 0.1) bigText(g, s, 'JUST IN TIME', 540, 440, 100, '#ffd23f', easeOutBack(clamp((t - W.birthday2 + 0.1) / 0.2), 1.6), -0.04);
  if (SHOT === 'forgets') {
    tag(g, s, t, T.forgets, 'MEANWHILE, LONDON');
    if (t > W.telling - 0.1) { const k = easeOutBack(clamp((t - W.telling + 0.1) / 0.2), 1.6); bigText(g, s, 'NO CALL.', 540, 520, 100, '#ffffff', k, -0.04); }
    if (t > W.survived - 0.1) bigText(g, s, 'NO LETTER.', 540, 640, 100, '#ffffff', easeOutBack(clamp((t - W.survived + 0.1) / 0.2), 1.6), 0.03);
  }
  if (SHOT === 'panics') bubble(g, s, t, W.calls - 0.1, ['MY MATE', 'POSTED HIMSELF', 'TO AUSTRALIA!'], 520, 470, 660, [-1, 1]);
  if (SHOT === 'whole') papers(g, s, t);
  if (SHOT === 'airline') { if (t > T.tear + 0.1) stamp(g, s, t, T.tear + 0.1, 'NO CHARGE', 540, 470, '#1e9e55', 110, -0.08); }
  if (t >= T.afford && t < T.cta + 0.1) {
    const a = 1 - clamp((t - T.cta) / 0.15);
    g.save(); g.globalAlpha = a;
    bigText(g, s, 'TICKET HOME', 540, 360, 110, '#ffffff', easeOutBack(clamp((t - W.ticket + 0.2) / 0.2), 1.6), -0.04);
    if (t > W.never - 0.1) bigText(g, s, 'PAID: £0', 540, 500, 130, '#ffd23f', easeOutBack(clamp((t - W.never + 0.1) / 0.2), 1.6), -0.04);
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

export const cast = () => ({ max, mia, leo, skye, kid, folk0: folk[0], folk1: folk[1], folk2: folk[2], folk3: folk[3], folk4: folk[4], folk5: folk[5] });
export const TIMES = T;
export const props = () => PROPS;
