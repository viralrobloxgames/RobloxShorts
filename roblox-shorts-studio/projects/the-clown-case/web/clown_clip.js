// Detective Max Sniffwell: The Clown Case. Beat times come from web/beats.js (source/beats.py: narration word timings,
// or an estimate until the narration exists), so the clip retimes itself.
// A girl at the beach bar flirts (Tempting. But I'm on a case.). The Chief, putting on the dock: the candidate's wife was
// kidnapped on election day. The candidate is a clown. One sniff of the ransom note: waffle cone, hot fudge, mint choc
// chip -> Big Scoop's Ice Cream. A free sundae (Tempting...), whipped cream on his nose. Out back the wife runs the till:
// she faked it for an ice cream truck. A flying sundae; he takes her back. Her big smile at the rally; the clown wins.
// Back at the bar at dusk: a black eye, a free sundae. "Tempting." He picks up the spoon.
// Layout (each set far from the others): the beach bar at BAR, the dock at DOCK, the dressing room at DR, the parlour
// at PL, the rally at RL. Every set faces +Z.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, puff, canvasTexture } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { makeTalkingFace, wearOutfit, makeNose, setNose, makeSunglasses, convertible, rollWheels, handcuffs, setCuffs } from '../../the-super-nose-detective/web/kit.js';
import { lockup } from '../../super-nose-case-2/web/vampire_clip.js';
import { wearOutfitHere, tintHair, clownFace, blackEye, creamBlob, faceSplat, paperHat, apron, putter, photo, ransomNote, sundae, spoon, microphone,
  beachBar, dock, voteBanner, boat, balloon, dressingRoom, parlour, stage as rallyStage, winnerBanner, fan, palm, std, mesh, box } from './kit.js';
import { W } from './beats.js';
import { LIPS } from './lipsync.js';
const lipAt = (t) => LIPS[Math.floor(t * 30 + 1e-6)] || '-';
const FLAP = 'swnoesnwcsoe';
let talkMax, talkSky, talkGig, talkWife, talkScoop;

export const meta = { seconds: Math.ceil((W.end + 1.1) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Clown Case' };
export const sky = { zenith: '#3f7fd8', horizon: '#ffcf9a', below: '#f2dcc0', fog: '#f6d2ae', sunDir: new THREE.Vector3(0.6, 0.42, 0.68).normalize(), sunColor: '#ffd9a8' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));
const win = (s, a, b) => s >= a && s < b;

// ---------- layout ----------
const BAR = V(0, 0, 0), DOCK = V(160, 0, 0), DR = V(-300, 0, 0), PL = V(300, 0, 0), RL = V(-160, 0, 160);
const MAX_BAR = BAR.clone().add(V(1.5, 0, 2.5)), SKY_BAR = BAR.clone().add(V(-1.3, 0, 2.5));
const DF = 1.0;                                                     // the dock's deck height
const CHIEF_D = DOCK.clone().add(V(-2, DF, 2.2)), MAX_D = DOCK.clone().add(V(2.2, DF, 3.0)), HOLE = DOCK.clone().add(V(-2, DF, -5.5));
// The putt: he stands side-on (facing +X), the ball on the hole's line in front of his feet, the hole 6.2 away along -Z.
const CHIEF_P = DOCK.clone().add(V(-3.3, DF, 1.0)), BALL0 = DOCK.clone().add(V(-2, DF + 0.13, 0.7)), PUTT_T = V(0, 0, -1);
// The stroke: address, a slow backswing, an accelerating stroke through the ball, the follow-through held.
// sw is the putter head's distance back from address (+ = away from the hole); hands and head move together, the head more.
function swingAt(s) {
  const t0 = B.putt + 0.3, t1 = t0 + 0.55, t2 = t1 + 0.28;
  if (s < t0) return 0;
  if (s < t1) return easeInOut(seg(s, t0, t1));
  if (s < t2) return 1 - 1.65 * easeIn(seg(s, t1, t2));
  return lerp(-0.65, 0, easeInOut(seg(s, B.sink + 0.2, B.sink + 0.9)));
}
const IMPACT = () => { const t1 = B.putt + 0.85; return t1 + 0.28 * Math.cbrt(1.25 / 1.65); };   // when the head reaches the ball (sw = -0.25)
const GIG = DR.clone().add(V(0, 0.3, -3.4)), MAX_DR = DR.clone().add(V(3.4, 0.3, -0.6)), CHIEF_DR = DR.clone().add(V(-3.4, 0.3, -0.4));
const CAR_A = PL.clone().add(V(-3, 0, 70)), CAR_B = PL.clone().add(V(-3, 0, 17));
const SCOOP_AT = PL.clone().add(V(-2, 0.3, -6.7)), MAX_CTR = PL.clone().add(V(-2, 0.3, -2.7)), MAX_IN = PL.clone().add(V(-2, 0.3, 8)), SUN_CTR = PL.clone().add(V(-2, 3.46, -4.55));
const CREW = [PL.clone().add(V(-7.6, 0.3, 2.5)), PL.clone().add(V(-4.4, 0.3, 2.5))], TABLE = PL.clone().add(V(-6, 0.3, 2.5));
const WIFE_TILL = PL.clone().add(V(6.9, 0.3, -7.1)), MAX_TILL = PL.clone().add(V(6.4, 0.3, -2.9)), EXIT_A = PL.clone().add(V(5.5, 0.3, 9)), EXIT_B = PL.clone().add(V(7.5, 0.3, 9));
const MIC = RL.clone().add(V(0, 3.1, 2.2)), WIFE_RL = RL.clone().add(V(0, 3.1, 1.2)), GIG_RL = RL.clone().add(V(3.2, 3.1, 0.6)), MAX_RL = RL.clone().add(V(-8.6, 3.1, 1.6));
const MAX_DUSK = BAR.clone().add(V(1.5, 0, 2.3));
const WIFE_SIDE = PL.clone().add(V(5.85, 0.3, -7.1)), WIFE_FRONT = PL.clone().add(V(5.85, 0.3, -3.9)), WIFE_CUFF = PL.clone().add(V(8.4, 0.3, -3.5));   // the gap between the counters; out in front (behind Max); at Max's right

// ---------- beats (all from narration words) ----------
const B = {
  ask: W.girl - 0.1, think1: W.tempting1 - 0.1, stop1: W.case1 - 0.55, r1: W.case1, title: W.case1 + 0.25,
  dock: W.somebody - 0.2, photo: W.kidnapped1 - 0.1, putt: W.chief - 0.2, sink: W.speech1 + 0.55, reveal: W.candidate - 0.25, working: W.figure - 0.3,
  note: W.ransom1 - 0.2, sniff: W.sniffed - 0.25, i1: W.waffle - 0.05, i2: W.fudge - 0.05, i3: W.mint - 0.1, drive: W.only - 0.25, inside: W.big1 - 0.2,
  offer: W.owner - 0.2, slide: W.free1 - 0.1, lean: W.sundae1 + 0.1, think2: W.tempting2 - 0.1, stop2: W.case2 - 0.55, r2: W.case2,
  back: W.out - 0.2, wipe: W.ransom2 - 0.1, crew: W.crew - 0.2, throw: W.threw + 0.15, splat: W.right + 0.1, cuff: W.cuffed - 0.15,
  rally: W.made - 0.25, won: W.clown2 - 0.15, drop: W.won - 0.05, coda: W.me - 0.25, slideIn: W.free2 - 0.4, tempt3: W.tempting3 - 0.05, eat: W.tempting3 + 0.35,
  cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [W.tempting1 - 0.15, 'tempt1'], [B.dock, 'dock'], [B.putt, 'putt'], [B.reveal, 'reveal'], [B.working, 'working'], [B.note, 'note'],
  [B.sniff, 'sniff'], [B.drive, 'drive'], [B.inside, 'inside'], [B.offer, 'offer'], [W.tempting2 - 0.15, 'tempt2'], [B.back, 'back'],
  [B.wipe, 'wipe'], [B.crew, 'scuffle'], [B.cuff - 0.2, 'cuff'], [B.rally, 'rally'], [B.won, 'won'], [B.coda, 'coda'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, max, sky2, chief, gig, wife, scoop, crew = [], nose, cam, cream, splatF, eye, put, pic, note, sunCtr, sunFly, sunBar, spn, mic, car, winner, banner;
let fans = [], balloons = [], confetti = [], ball, wifeApron, cuffs, SHOT = 'hook', sea;

export async function setup(stage) {
  const { scene } = stage; const r = rng(31);
  scene.fog.near = 180; scene.fog.far = 750;
  const flat = (w, d, x, z, col, y = 0.03, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o.material || new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, ...o })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  const sand = part(1600, 2, 1600, '#ecd3a4', { rough: 0.98, clearcoat: 0, radius: 0.01 }); scene.add(sand);
  const seaTex = canvasTexture(256, 256, (c) => { c.fillStyle = '#2fa6d6'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.beginPath(); const y = (i * 41) % 256; for (let x = 0; x <= 256; x += 16) c.lineTo(x, y + 5 * Math.sin(x * 0.06 + i)); c.stroke(); } });
  seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(30, 30); stage.seaTex = seaTex;
  sea = new THREE.MeshPhysicalMaterial({ map: seaTex, color: '#bfefff', roughness: 0.08, clearcoat: 1, emissive: '#1a7fb0', emissiveIntensity: 0.2 });
  flat(600, 400, 0, -230, null, 0.06, { material: sea });                                                  // behind the bar
  flat(120, 200, DOCK.x, DOCK.z, null, 0.25, { material: sea });                                           // round the dock
  // The beach bar.
  const bar = beachBar(); bar.position.copy(BAR); scene.add(bar);
  for (const [x, z, h] of [[-10, -4, 16], [11, -6, 17], [-16, 10, 15], [18, 12, 16], [-30, -20, 17], [30, -18, 15]]) { const p = palm(h, x); p.position.set(x, 0, z); scene.add(p); }
  // The dock with boats.
  const dk = dock(); dk.position.copy(DOCK); scene.add(dk);
  for (const [x, z, col] of [[-11, -6, '#f4f2ee'], [11, 4, '#ffe9a8']]) { const b = boat(col); b.position.copy(DOCK).add(V(x, 0.2, z)); b.rotation.y = x < 0 ? 0 : Math.PI; scene.add(b); }
  for (const [x, z] of [[-22, 30], [22, 26]]) { const p = palm(16, x); p.position.copy(DOCK).add(V(x, 0, z)); scene.add(p); }
  // The dressing room.
  const dr = dressingRoom(); dr.position.copy(DR); scene.add(dr);
  // The parlour, the street to it, palms.
  const pl = parlour(); pl.position.copy(PL); scene.add(pl);
  flat(12, 140, PL.x - 3, PL.z + 70, '#4a4e58', 0.04);
  for (let z = 14; z < 140; z += 6) flat(0.4, 2.6, PL.x - 3, PL.z + z, '#f4f2ee', 0.05);
  for (let z = 20; z < 130; z += 18) for (const sx of [-1, 1]) { const p = palm(15 + (z % 3), z + sx); p.position.copy(PL).add(V(-3 + sx * 10, 0, z)); scene.add(p); }
  // The rally.
  const st = rallyStage(); st.position.copy(RL); scene.add(st);
  for (let i = 0; i < 26; i++) { const f = fan(i + 1); const row = Math.floor(i / 9), col = i % 9; f.position.copy(RL).add(V(-11 + col * 2.75 + (row % 2) * 1.3, 0, 9 + row * 3.4)); f.rotation.y = Math.PI + (r() - 0.5) * 0.3; scene.add(f); fans.push(f); }
  winner = winnerBanner(); scene.add(winner);
  const cols = ['#d2283c', '#ffd23f', '#2f6fe0', '#ff8fb8', '#3fae4a'];
  for (let i = 0; i < 18; i++) { const b = balloon(cols[i % 5]); scene.add(b); balloons.push(b); }
  for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.4), new THREE.MeshStandardMaterial({ color: cols[i % 5], side: THREE.DoubleSide })); scene.add(c); confetti.push(c); }
  mic = microphone(); mic.position.copy(MIC); scene.add(mic);
  // Cast.
  const ex = ['neutral', 'happy', 'smug', 'love', 'cool', 'determined', 'suspicious', 'sleeping', 'shocked', 'scared', 'surprised', 'sad', 'annoyed', 'angry', 'talking', 'laugh', 'dizzy', 'scheming', 'evil_grin', 'nervous', 'wink', 'blink', 'disgusted', 'crying'];
  const load = (n, lift = 0) => loadRobloxCharacter(n, { expressions: ex, hairLift: lift });
  [max, sky2, chief, gig, wife, scoop, crew[0], crew[1]] = await Promise.all([load('Max'), load('Skye'), load('Leo', 0.16), load('Leo', 0.16), load('Mia'), load('Noob'), load('Noob'), load('Noob')]);
  for (const a of [max, sky2, chief, gig, wife, scoop, ...crew]) scene.add(a.root);
  await wearOutfit(max, 'max_miami.png'); await wearOutfit(chief, 'leo_chief.png'); await wearOutfit(sky2, 'skye_70s.png');
  await wearOutfitHere(gig, 'giggles.png'); await wearOutfitHere(wife, 'wife.png'); await wearOutfitHere(scoop, 'scoop.png');
  for (const c of crew) await wearOutfitHere(c, 'crew.png');
  tintHair(gig, '#ff7a1a'); tintHair(wife, '#5a2e14');
  nose = makeNose(max); clownFace(gig); makeSunglasses(chief); for (const c of crew) makeSunglasses(c); paperHat(scoop); for (const c of crew) paperHat(c);
  wifeApron = apron(wife);
  eye = blackEye(max); splatF = faceSplat(max);
  cream = creamBlob(); scene.add(cream);
  talkMax = await makeTalkingFace(max, ['determined', 'suspicious', 'smug', 'surprised', 'neutral', 'sleeping', 'scared', 'shocked', 'nervous', 'happy', 'disgusted', 'sad']);
  talkSky = await makeTalkingFace(sky2, ['love', 'happy']);
  talkGig = await makeTalkingFace(gig, ['neutral', 'nervous', 'happy']);
  talkWife = await makeTalkingFace(wife, ['happy', 'smug', 'laugh']);
  talkScoop = await makeTalkingFace(scoop, ['happy', 'smug']);
  for (const n of ['idle', 'walk', 'run', 'shock', 'think', 'point_forward', 'sit', 'laugh', 'shrug', 'proud', 'look_up', 'idle_lookaround']) A[n] = await loadAnimation(n);
  // Props.
  put = putter(); scene.add(put); pic = photo(); scene.add(pic); note = ransomNote(); scene.add(note);
  sunCtr = sundae(0.9); scene.add(sunCtr); sunFly = sundae(0.8); scene.add(sunFly); sunBar = sundae(0.9); scene.add(sunBar); spn = spoon(); scene.add(spn);
  ball = mesh(new THREE.SphereGeometry(0.13, 12, 8), std('#ffffff', { roughness: 0.3 })); scene.add(ball);
  car = convertible(); scene.add(car); cuffs = handcuffs(); scene.add(cuffs);
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: pos.y, arms: [], ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
function armFwd(a, side, ang, spread = 0) { const e = new THREE.Euler(-ang, 0, side === 'L' ? spread : -spread, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(e); }
function moveTo(b, s, from, to, at, speed, endRot = null) {
  const d = from.distanceTo(to), m = travelTo(from, to, at, s, speed);
  b.pos = m.pos; b.floor = from.y; b.rotY = m.moving ? m.heading : (endRot ?? b.rotY); if (m.moving) b.layers = walkL(m, d);
  return m;
}
const carAt = (s) => { const m = travelTo(CAR_A, CAR_B, B.inside - 0.25, s, 30); return { pos: m.pos, rotY: Math.PI, dist: m.u * CAR_A.distanceTo(CAR_B) }; };
const SEAT = V(1.1, 0.2, -0.3);

function maxState(s) {
  const b = st(MAX_BAR, face(MAX_BAR, SKY_BAR), idle(s), 'neutral');
  if (s < B.dock) {                                                // the bar: the flirt, the think, the hand up
    b.rotY = face(MAX_BAR, SKY_BAR) + (SHOT === 'hook' ? 0.55 : 0); b.face = s > W.single ? 'surprised' : 'neutral';
    if (s > B.think1) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop1) { b.layers = idle(s); b.arms.push(['R', 1.75, 0.05]); b.face = 'determined'; }
  } else if (s < B.reveal) {                                       // the dock: listening to the Chief
    b.pos = MAX_D.clone(); b.floor = DF; b.rotY = face(MAX_D, CHIEF_D); b.face = 'suspicious';
  } else if (s < B.drive) {                                        // the dressing room: the clown; the note; the sniff
    b.pos = MAX_DR.clone(); b.floor = MAX_DR.y; b.rotY = face(MAX_DR, GIG); b.face = s > W.clown1 ? 'neutral' : 'determined';
    if (s > B.note) { b.arms = [['R', 1.05, 0.25]]; b.note = 'hand'; b.face = 'determined'; }
    if (s > B.sniff) { const k = easeInOut(seg(s, B.sniff, B.sniff + 0.45)); b.arms = [['R', lerp(1.05, 1.62, k), lerp(0.25, 0.45, k)]]; b.note = 'nose'; b.nod = 0.1 * k; b.face = s > B.sniff + 0.4 ? 'sleeping' : 'determined'; }
    if (s > W.mint + 0.5) { b.face = 'smug'; b.arms = [['R', 1.2, 0.3]]; b.note = 'hand'; b.nod = 0; }
  } else if (s < B.inside) {                                       // the drive
    const c = carAt(s); b.grounded = false; b.pos = c.pos.clone().add(SEAT.clone().applyAxisAngle(V(0, 1, 0), c.rotY)); b.rotY = c.rotY; b.layers = [[A.sit, 0.5]]; b.face = 'determined'; b.inCar = true;
  } else if (s < B.back) {                                         // the parlour counter: the sundae, the lean, the hand up
    b.face = 'suspicious'; moveTo(b, s, MAX_IN, MAX_CTR, B.offer - 0.1, 12, Math.PI);
    if (s > B.lean && s < B.think2) { const k = Math.sin(clamp((s - B.lean) / 0.7) * Math.PI); b.rotX = 0.42 * k; b.face = 'sleeping'; }
    if (s > B.think2) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop2) { b.layers = idle(s); b.arms = [['R', 1.75, 0.05]]; b.face = 'determined'; }
  } else if (s < B.rally) {                                        // out back: the wife at the till; the wipe; the sundae in the eye; the cuffs
    b.face = 'surprised'; moveTo(b, s, MAX_CTR, MAX_TILL, B.back + 0.95, 12, face(MAX_TILL, WIFE_TILL));
    if (s > B.wipe + 0.6 && s < B.wipe + 1.2) { b.arms = [['R', 2.05, 0.55]]; b.face = 'annoyed'; }             // wipes the cream off
    if (s > B.wipe + 1.2) b.face = 'determined';
    if (s > B.crew) { b.rotY = lerp(face(MAX_TILL, WIFE_TILL), face(MAX_TILL, CREW[1]), easeInOut(seg(s, B.crew, B.crew + 0.4))); b.face = 'suspicious'; }
    if (s > B.splat) { b.face = 'shocked'; b.splat = s < B.cuff - 0.3; b.eye = s > B.splat + 0.3; b.layers = [[A.shock, 0.25]]; }   // the glass lands on his eye
    if (s > B.cuff - 0.3) {                                         // turns to her and cuffs her: "I cuffed her anyway."
      b.layers = idle(s); b.eye = true; b.face = 'determined'; b.rotY = lerp(face(MAX_TILL, CREW[1]), face(MAX_TILL, WIFE_CUFF) - 0.6, easeInOut(seg(s, B.cuff - 0.3, B.cuff)));   // both cheated 3/4 to the camera
      if (s < B.cuff + 0.5) b.arms = [['R', lerp(0.3, 1.05, easeOut(seg(s, B.cuff - 0.3, B.cuff))), -0.25], ['L', lerp(0.3, 1.05, easeOut(seg(s, B.cuff - 0.3, B.cuff))), -0.25]];
      if (s > B.cuff + 0.6) b.face = 'smug';
    }
  } else if (s < B.coda) {                                         // side of the stage, arms folded
    b.pos = MAX_RL.clone(); b.floor = MAX_RL.y; b.rotY = face(MAX_RL, WIFE_RL) + 0.4; b.face = s > B.won ? 'sad' : 'neutral'; b.eye = true;
  } else {                                                         // dusk at the bar: the black eye, the sundae, the spoon
    b.pos = MAX_DUSK.clone(); b.rotY = Math.PI; b.face = 'sad'; b.eye = true;
    if (s > B.slideIn + 0.6) b.face = 'surprised';
    if (s > B.tempt3) b.face = 'suspicious';
    if (s > B.eat) { const ch = Math.max(0, Math.sin((s - B.eat) * 5)); b.arms = [['R', 1.45 + 0.75 * ch, -0.35 * ch]]; b.spoon = true; b.face = ch > 0.6 ? 'happy' : 'smug'; }
  }
  return b;
}
function skyState(s) {
  const b = st(SKY_BAR, face(SKY_BAR, MAX_BAR) - (SHOT === 'hook' ? 0.55 : 0), idle(s, 0.3), 'love', { lean: -0.08 });
  b.talk = win(s, W.girl, W.single + 0.3);
  if (s > B.r1 - 0.1) { b.face = 'sad'; b.lean = 0; b.talk = false; }
  if (s > B.dock) b.visible = false;
  return b;
}
function chiefState(s) {
  const b = st(CHIEF_D, face(CHIEF_D, HOLE), idle(s), 'smug');
  if (win(s, B.dock, B.reveal)) {
    b.floor = DF; b.put = 'ground';
    if (s < B.putt) { b.rotY = face(CHIEF_D, MAX_D) + 0.5; b.arms = [['R', 1.15, -0.25]]; b.photo = true; b.talk = win(s, W.kidnapped1 - 0.2, W.election + 0.5); }
    else {                                                         // the putt: both hands on the grip, a swing, the ball drops
      b.pos = CHIEF_P.clone(); b.rotY = Math.PI / 2; b.put = 'hands'; b.layers = [[A.idle, 0]]; const sw = swingAt(s);
      // Hands together on the grip (negative spread brings either hand in: the shoulders pivot 1.0 off centre); the
      // backswing rocks both hands towards his right (+Z, away from the hole), the stroke through to his left.
      b.arms = [['R', 0.6, -0.55 + 0.22 * sw], ['L', 0.6, -0.55 - 0.22 * sw]];
      b.face = s > B.sink ? 'smug' : 'determined'; b.lookDown = 0.25;
    }
    return b;
  }
  if (win(s, B.reveal, B.drive)) { b.pos = CHIEF_DR.clone(); b.floor = CHIEF_DR.y; b.rotY = face(CHIEF_DR, GIG) - 0.3; b.face = 'neutral'; return b; }
  b.visible = false; return b;
}
function gigState(s) {
  const b = st(GIG, 0.15, idle(s), 'neutral');
  if (win(s, B.reveal, B.drive)) {
    b.face = s > B.working ? 'nervous' : 'neutral'; b.talk = win(s, B.working + 0.1, B.working + 1.3);
    if (win(s, B.working, B.note)) b.arms = [['R', 2.25, 0.35]];                                                  // points at his own face: "Is it working?"
    if (s > B.sniff + 0.3) { b.face = 'disgusted'; b.lean = 0.1; b.rotY = face(GIG, MAX_DR); }
    return b;
  }
  if (win(s, B.rally, B.coda)) {
    b.pos = GIG_RL.clone(); b.floor = GIG_RL.y; b.rotY = -0.25; b.face = 'happy'; if (s > B.drop) b.wave = true;
    return b;
  }
  b.visible = false; return b;
}
function wifeState(s) {
  const b = st(WIFE_TILL, 0, idle(s, 0.2), 'happy', { apron: true });
  if (win(s, B.back - 0.2, B.rally)) {
    b.arms = [['R', 0.9, 0.2], ['L', 0.9, -0.2]];                                                                // hands at the till
    if (s > B.back + 0.9) { b.rotY = face(WIFE_TILL, MAX_TILL); b.arms = []; b.face = 'smug'; }
    if (win(s, B.wipe, B.wipe + 0.8)) { b.arms = [['R', 1.55, 0.05]]; b.face = 'laugh'; b.talk = true; }         // "You've got a little... something."
    if (s > B.crew) b.face = 'smug';
    if (s > B.splat + 0.1) {                                        // out from behind the till counter (round its end, not through it), behind Max
      b.face = 'smug'; b.arms = [];
      const t1 = B.splat + 0.25, t2 = t1 + WIFE_SIDE.distanceTo(WIFE_FRONT) / 6, t3 = t2 + WIFE_FRONT.distanceTo(WIFE_CUFF) / 6;
      if (s < t1) moveTo(b, s, WIFE_TILL, WIFE_SIDE, t1, 6, face(WIFE_SIDE, WIFE_FRONT));
      else if (s < t2) moveTo(b, s, WIFE_SIDE, WIFE_FRONT, t2, 6, face(WIFE_FRONT, WIFE_CUFF));
      else moveTo(b, s, WIFE_FRONT, WIFE_CUFF, t3, 6, face(WIFE_CUFF, MAX_TILL));
    }
    if (s > B.cuff - 0.3) { b.pos = WIFE_CUFF.clone(); b.rotY = face(WIFE_CUFF, MAX_TILL) + 0.6; b.layers = idle(s, 0.2); b.arms = [['R', 0.55, -0.55], ['L', 0.55, -0.55]]; b.face = 'annoyed'; b.cuffs = s > B.cuff; }   // wrists together in front
    return b;
  }
  if (win(s, B.rally, B.coda)) {
    b.pos = WIFE_RL.clone(); b.floor = WIFE_RL.y; b.rotY = 0; b.face = 'happy'; b.apron = false; b.bigSmile = true; b.talk = win(s, B.rally + 0.3, B.won);
    b.arms = [['R', 0.55, -0.55], ['L', 0.55, -0.55]]; b.cuffs = true;                                           // the speech, in handcuffs
    return b;
  }
  b.visible = false; return b;
}
function scoopState(s) {
  const b = st(SCOOP_AT, 0, idle(s), 'happy');
  if (!win(s, B.inside, B.back + 0.3)) { b.visible = false; return b; }
  b.talk = win(s, W.owner, W.sundae1 + 0.4); if (win(s, B.slide - 0.3, B.slide + 0.5)) b.arms = [['R', 1.4, 0.2]];
  if (s > B.r2) b.face = 'smug';
  return b;
}
function crewState(s, i) {
  const at = CREW[i], b = st(at, face(at, TABLE), idle(s, i * 0.7), 'smug');
  if (!win(s, B.inside, B.rally)) { b.visible = false; return b; }
  b.arms = [['R', 1.0 + 0.1 * Math.sin(s * 7 + i), 0.15]];                                                        // counting cash
  if (s > B.crew) {                                                                                               // they come out back
    const to = MAX_TILL.clone().add(V(-4.4 - i * 1.3, 0, 1.0 + i * 1.6)); moveTo(b, s, at, to, B.crew + 0.75, 14, face(to, MAX_TILL)); b.face = 'angry'; b.arms = [];
    if (i === 1 && win(s, B.throw - 0.35, B.throw + 0.15)) { const k = seg(s, B.throw - 0.35, B.throw); b.arms = [['R', k < 1 ? lerp(1.5, 2.9, easeIn(k)) : 0.9, 0.1]]; }
  }
  return b;
}

let tNow = 0;
function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, (x.rotZ || 0) + (x.lean || 0), 'YXZ');
  if (x.rotX || x.rotZ || x.lean) { const c = V(0, x.inCar ? 1.6 : 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  robloxPose(a, x.layers);
  for (const [side, ang, spread] of x.arms) armFwd(a, side, ang, spread);
  if (x.wave) { a.bones['Arm.L'].quaternion.setFromEuler(new THREE.Euler(-2.3 - 0.15 * Math.sin(tNow * 10), 0, 0.15, 'XYZ')); }
  if (x.nod) a.bones.Head.rotation.x += x.nod;
  if (x.lookDown) a.bones.Head.rotation.x += x.lookDown;
  if (x.talk) a.bones.Head.rotation.x += 0.06 * Math.sin(tNow * 17);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  const flap = FLAP[Math.floor(tNow * 10) % FLAP.length];
  if (a === max) talkMax(x.face, lipAt(tNow));
  else if (x.talk && a === sky2) talkSky(x.face, flap);
  else if (x.talk && a === gig) talkGig(x.face, flap);
  else if (x.talk && a === wife) talkWife(x.face, flap);
  else if (x.talk && a === scoop) talkScoop(x.face, flap);
  a.root.updateMatrixWorld(true);
}
const local = (a, x, y, z) => { a.root.updateMatrixWorld(true); return V(x, y, z).applyMatrix4(a.root.matrixWorld); };
// Where a held thing sits: in the palm, 1.8 down the arm (the fingertip end is at 2.05).
const gripR = (a) => { a.bones['Arm.R'].updateMatrixWorld(true); return V(0, -1.8, 0).applyMatrix4(a.bones['Arm.R'].matrixWorld); };
const gripL = (a) => { a.bones['Arm.L'].updateMatrixWorld(true); return V(0, -1.8, 0).applyMatrix4(a.bones['Arm.L'].matrixWorld); };
const headAt = (a, y = 0.5) => { a.bones.Head.updateMatrixWorld(true); return V(0, y, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const noseTip = () => { nose.updateMatrixWorld(true); return nose.userData.tip.clone().applyMatrix4(nose.matrixWorld); };
const fwdOf = (a) => V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y));
const rightOf = (a) => { const f = fwdOf(a); return V(-f.z, 0, f.x); };   // the character's right

// ---------- samples ----------
const ACTION = () => [[B.dock - 0.1, B.dock + 0.3], [B.drive, B.inside], [B.throw - 0.1, B.splat + 0.4], [B.drop - 0.1, B.drop + 0.8]];
export function samples(t) { return ACTION().some(([a, b]) => t > a && t < b) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; tNow = t; cam = stage.camera;
  SHOT = shotAt(SHOTS, t).shot.id;
  const M = maxState(s), K = skyState(s), C = chiefState(s), G = gigState(s), Wf = wifeState(s), S = scoopState(s), CR = [crewState(s, 0), crewState(s, 1)];
  place(max, M); place(sky2, K); place(chief, C); place(gig, G); place(wife, Wf); place(scoop, S); place(crew[0], CR[0]); place(crew[1], CR[1]);
  wifeApron.visible = !!Wf.apron;
  // The handcuffs on the wife's wrists (snap shut on "cuffed", stay on for the speech).
  cuffs.visible = !!Wf.cuffs && wife.root.visible;
  if (cuffs.visible) {
    const wrist = (side) => { const bone = wife.bones[side === 'L' ? 'Arm.L' : 'Arm.R']; bone.updateMatrixWorld(true); return [V(0, -1.6, 0).applyMatrix4(bone.matrixWorld), bone.getWorldQuaternion(new THREE.Quaternion())]; };
    const [pl, ql] = wrist('L'), [pr, qr] = wrist('R'); setCuffs(cuffs, pl, pr, ql, qr);
    const k = s > B.rally ? 1 : easeOutBack(clamp((s - B.cuff) / 0.15), 3); cuffs.userData.rings.forEach((r) => r.scale.setScalar(Math.max(0.01, k * 0.85)));
  }
  eye.visible = !!M.eye; splatF.visible = !!M.splat;
  setNose(nose, { glow: win(s, B.sniff + 0.2, B.drive) ? 0.8 + 0.2 * Math.sin(s * 12) : 0, inflate: win(s, B.sniff + 0.3, B.i1) ? 0.06 * Math.max(0, Math.sin((s - B.sniff) * 9)) : 0 });
  stage.seaTex.offset.set(s * 0.01, s * 0.02);

  // The Chief's putter: on the green, then in both hands (grip between the palms, the head on the deck in front).
  put.visible = !!C.put && chief.root.visible;
  if (C.put === 'ground') { put.position.copy(CHIEF_D).add(V(0.9, 0.12, -1.0)); put.quaternion.setFromAxisAngle(V(0, 0, 1), Math.PI / 2); }
  else if (C.put === 'hands') {                                  // grip in the hands, head on the green just behind the ball, swinging along the line
    const g = gripR(chief).lerp(gripL(chief), 0.5), sw = swingAt(s);
    const head = BALL0.clone().setY(DF + 0.12).addScaledVector(PUTT_T, -0.25 - sw).add(V(0, 0.1 * sw * sw, 0));
    const yAx = g.clone().sub(head).normalize(), f = fwdOf(chief), xAx = f.clone().addScaledVector(yAx, -f.dot(yAx)).normalize(), zAx = xAx.clone().cross(yAx);
    put.position.copy(g); put.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, yAx, zAx)); put.scale.setScalar(g.distanceTo(head) / 3.6);
  }
  if (C.put !== 'hands') put.scale.setScalar(1);
  pic.visible = !!C.photo && chief.root.visible;
  if (pic.visible) { pic.position.copy(gripR(chief)).add(V(0, 0.15, 0)); pic.rotation.set(0, chief.root.rotation.y - 0.3, 0); }   // held up at chest height, turned to camera
  // The golf ball rolls into the hole on the putt.
  ball.visible = win(s, B.dock, B.reveal);
  if (ball.visible) { const k = easeOut(seg(s, IMPACT(), B.sink)); ball.position.copy(BALL0.clone().lerp(HOLE.clone().add(V(0, 0.13, 0)), k)); ball.rotation.set(k * 30, 0, 0); if (s > B.sink) ball.position.y = DF - 0.2; }   // struck at impact, drops on the beat
  // The ransom note: in Max's hand, then at his nose for the sniff.
  note.visible = !!M.note && max.root.visible;
  if (note.visible) {                                            // the writing faces his left, where the cameras are; held by its bottom edge
    note.position.copy(gripR(max)).addScaledVector(rightOf(max), -0.55).add(V(0, 0.5, 0)); note.rotation.set(0, max.root.rotation.y + Math.PI / 2, 0);   // pinched by its bottom edge on the camera side of the fist; for the sniff the arm comes up and the nose runs along it
  }
  // The sundaes: on the counter (slid to Max), the flying one, and the one that slides down the bar at dusk.
  sunCtr.visible = win(s, B.inside, B.back + 1.0);
  if (sunCtr.visible) { const k = easeOut(seg(s, B.slide, B.slide + 0.5)); sunCtr.position.copy(SUN_CTR.clone().add(V(0, 0, -1.4)).lerp(SUN_CTR, k)); sunCtr.rotation.set(0, 0, 0); }
  cream.visible = win(s, B.lean + 0.35, B.wipe + 0.9) && max.root.visible;
  if (cream.visible) { cream.position.copy(noseTip()).add(V(0, 0.05, 0)); }
  sunFly.visible = win(s, B.throw - 0.35, B.splat);
  if (sunFly.visible) {
    if (s < B.throw) { sunFly.position.copy(gripR(crew[1])).add(V(0, 0.1, 0)); sunFly.rotation.set(0, 0, 0); }
    else { const k = seg(s, B.throw, B.splat), a = gripR(crew[1]), bb = headAt(max, 0.5).add(fwdOf(max).multiplyScalar(0.6)); sunFly.position.copy(a.lerp(bb, k)).add(V(0, 1.2 * Math.sin(k * Math.PI), 0)); sunFly.rotation.set(k * 6, k * 3, 0); }
  }
  sunBar.visible = s > B.coda;
  if (sunBar.visible) { const k = easeOut(seg(s, B.slideIn, B.slideIn + 0.8)), to = BAR.clone().add(V(2.3, 3.53, 0.6)); sunBar.position.copy(BAR.clone().add(V(-7, 3.53, 0.6)).lerp(to, k)); sunBar.rotation.set(0, 0, 0); }
  spn.visible = !!M.spoon;
  if (spn.visible) { spn.position.copy(gripR(max)); spn.quaternion.copy(max.bones['Arm.R'].getWorldQuaternion(new THREE.Quaternion())); spn.rotateX(Math.PI); }
  // The convertible.
  car.visible = win(s, B.drive, B.inside + 0.6);
  if (car.visible) { const c = carAt(s); car.position.copy(c.pos); car.rotation.set(0, c.rotY, 0); rollWheels(car, c.dist); }
  // The rally: the WINNER banner drops; balloons rise; confetti falls; fans cheer with one arm.
  const dk = easeOutBack(seg(s, B.drop, B.drop + 0.5), 1.4);
  winner.position.copy(RL).add(V(0, lerp(19, 10.8, dk), -4.4)); winner.visible = win(s, B.rally, B.coda);
  balloons.forEach((b, i) => { const u = s - B.drop, r0 = (i * 37) % 11; b.visible = win(s, B.rally, B.coda); b.position.copy(RL).add(V(-10 + (i % 9) * 2.4 + Math.sin(i) * 0.6, 4 + (u > 0 ? u * (2.5 + r0 * 0.3) : 0) + (i % 3) * 0.6, 3.4 + (i % 4) * 1.6)); });
  confetti.forEach((c, i) => { const u = s - B.drop; c.visible = win(s, B.drop, B.coda); if (!c.visible) return; c.position.copy(RL).add(V(-11 + (i * 7.3) % 22, 16 - ((u * (3 + (i % 5))) % 14), 2 + (i * 3.1) % 10)); c.rotation.set(u * 4 + i, u * 3, i); });
  fans.forEach((f, i) => { f.visible = win(s, B.rally, B.coda); f.userData.arm.rotation.z = 2.6 + (s > B.drop ? 0.3 * Math.sin(s * 9 + i) : 0); });

  // ---------- shots ----------
  const { u } = shotAt(SHOTS, t);
  const look = (p, tg, fov = 40, ext = 30) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const mh = headAt(max), kh = headAt(sky2), ch = headAt(chief), gh = headAt(gig), wh = headAt(wife);
  stage.bloom.strength = 0.35;
  const dusk = SHOT === 'coda' || SHOT === 'cta';
  stage.sun.color.set(dusk ? '#ff9a5a' : '#ffd9a8'); stage.sun.intensity = dusk ? 2.2 : 3.1; stage.hemi.intensity = dusk ? 0.42 : 0.55;
  switch (SHOT) {
    case 'hook': { const k = easeOut(seg(s, 0, 1.1)); const mid = mh.clone().lerp(kh, 0.5); look(mid.clone().add(V(0.2, 0.9, lerp(14, 11, k))), mid.clone().add(V(0, 0.4, 0)), 40, 25); break; }   // push-in: both faces cheated 3/4 to camera
    case 'tempt1': look(local(max, 5.6, 4.7, 3.4), local(max, 0, 4.0, 1.1), 38, 20); break;                        // his left profile (the raised right hand stays out of the lens); the nose fills a third of the frame
    case 'dock': { const k = easeInOut(u); look(DOCK.clone().add(V(lerp(9, 7, k), DF + 6.5, lerp(14, 12, k))), CHIEF_D.clone().lerp(MAX_D, 0.4).add(V(0, 3.4, 0)), 42, 30); break; }
    case 'putt': { const k = easeInOut(u); look(HOLE.clone().add(V(lerp(5.6, 5.1, k), 4.9, lerp(-6.4, -5.9, k))), HOLE.clone().lerp(CHIEF_P, 0.6).add(V(1.0, 1.5, 0)), 46, 25); break; }   // past the cup, front side: his face, the stroke, the ball rolling into the hole   // in front of him (he faces the open side of the dock): his face, the putt, the hole
    case 'reveal': { const k = easeOut(seg(s, B.reveal, B.reveal + 0.3)); look(DR.clone().add(V(0.4, lerp(5.0, 4.6, k), lerp(11, 8.5, k))).add(jolt(B.reveal + 0.3, 0.06)), GIG.clone().add(V(0, 3.8, 0)), 42, 20); break; }
    case 'working': look(gh.clone().add(V(0.4, 0.4, 8.0)), gh.clone().add(V(0, 0.9, 0)), 38, 15); break;   // aimed above his wig, so his face sits low and the bubble has room
    case 'note': { const n = note.position.clone().add(V(0, 0.7, 0)); look(n.clone().addScaledVector(rightOf(max), -3.8).addScaledVector(fwdOf(max), 0.4).add(V(0, 0.4, 0)), n, 38, 12); break; }   // from his left
    case 'sniff': { const k = easeInOut(u), at = (x, y, z) => MAX_DR.clone().add(V(x, y, z).applyAxisAngle(V(0, 1, 0), face(MAX_DR, GIG))); look(at(lerp(4.4, 3.8, k), 4.5, 0.9), at(-0.2, 4.15, 1.4), lerp(42, 38, k), 15); break; }   // his left profile: the note at his nose, the clown appalled behind
    case 'drive': { const c = car.position; look(c.clone().add(V(9, 4.5, -10)), c.clone().add(V(0, 2.2, 0)), 46, 30); break; }
    case 'inside': { const k = easeInOut(u); look(PL.clone().add(V(lerp(-10.8, -10.2, k), 7.6, lerp(12.5, 11.5, k))), TABLE.clone().add(V(1.6, 2.0, -1.2)), 44, 25); break; }   // the suspicious crew counting cash; Max walks in on the right
    case 'offer': look(MAX_CTR.clone().add(V(3.2, 5.6, -5.6)), MAX_CTR.clone().add(V(0.4, 3.8, -1.0)), 46, 20); break;   // front-right of Max: him, the sundae, Scoop behind the counter
    case 'tempt2': look(local(max, 5.0, 4.7, 3.6), local(max, 0, 4.1, 1.2), 40, 15); break;                     // his left: cream on the nose, hand up
    case 'back': { const k = easeInOut(u), m0 = MAX_TILL.clone().lerp(WIFE_TILL, 0.5); look(PL.clone().add(V(lerp(0.2, 0.8, k), 5.2, -0.6)), m0.clone().add(V(0.4, 3.8, 0)), 46, 20); break; }   // front-left 3/4: Max arriving, the wife beside the till, the poster
    case 'wipe': { const m0 = MAX_TILL.clone().lerp(WIFE_TILL, 0.5); look(PL.clone().add(V(-1.6, 5.8, -3.4)), m0.clone().add(V(0, 3.9, 1.1)), 50, 20); break; }   // her point, his nose, the truck poster behind
    case 'scuffle': look(PL.clone().add(V(3.9, 6.0, 9.4)).add(jolt(B.splat, 0.18, 0.4)), PL.clone().add(V(3.9, 3.4, -2.0)), 52, 25); break;   // from the doorway: the crew, the throw, the splat
    case 'cuff': { const k = easeInOut(u), m0 = MAX_TILL.clone().lerp(WIFE_CUFF, 0.5); look(m0.clone().add(V(0, 4.4, lerp(8.8, 8.0, k))), m0.clone().add(V(0, 3.0, 0)), 44, 20); break; }   // from the front, both cheated 3/4: his black eye, her cuffed wrists between them
    case 'rally': { const k = easeInOut(u); look(WIFE_RL.clone().add(V(lerp(-3.0, -2.5, k), 2.6, lerp(7.2, 6.6, k))), WIFE_RL.clone().add(V(1.5, 4.4, 0)), 50, 25); break; }   // her big fixed smile, the clown beside her, past the microphone
    case 'won': look(RL.clone().add(V(0, 9, 34)), RL.clone().add(V(0, 7.5, 0)), 46, 45); break;                    // over the crowd: the banner drops
    case 'coda': { const k = easeInOut(seg(s, B.coda, B.coda + 1.5)); look(BAR.clone().add(V(lerp(-0.2, 0.4, k), 5.0, -3.0)), mh.clone().add(V(0.3, -1.4, 0)), 62, 20); break; }   // from behind the bar: his black eye and the sundae on the counter
    case 'cta': look(BAR.clone().add(V(1.4, 6.6, -2.6)), MAX_DUSK.clone().add(V(0, 6.2, 0)), 54, 30); break;   // from behind the bar: Max low in frame eating, the sunset beyond, under the end card
    default: look(V(0, 6, 25), V(0, 3, 0), 44);
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435', font = 'Luckiest Guy', sw = 0.2, align = 'center' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "${font}"`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * sw * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
const pop = (t, at, d = 0.15, k = 3) => easeOutBack(clamp((t - at) / d), k);
const fade = (t, at, hold) => 1 - inv(at + hold - 0.2, at + hold, t);
function pill(g, s, x, y, text, bg, fg = '#ffffff', size = 40, k = 1) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s;
  g.translate(x * s, y * s); g.scale(k, k);
  roundRect(g, 0, 0, w, (size + 34) * s, 20 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, 20 * s, ((size + 34) / 2 + 3) * s); g.restore();
  return w / s;
}
function bubble(g, s, t, head3, lines, t0, t1, { bg = '#ffffff', fg = '#152435', heart = false, size = 50 } = {}) {
  if (t < t0 || t > t1) return; const p = project(head3, s); if (!p.on) return;
  const k = pop(t, t0, 0.18, 2.2), a = fade(t, t0, t1 - t0);
  g.save(); g.globalAlpha = a; g.font = `800 ${size * s}px Montserrat`;
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 70 * s, h = (lines.length * size * 1.22 + 46) * s;
  let cx = clamp(p.x, w / 2 + 40 * s, 900 * s - w / 2), cy = clamp(p.y - 120 * s - h / 2, 300 * s + h / 2, 1050 * s - h / 2);
  g.translate(cx, cy); g.scale(k, k);
  g.beginPath(); g.moveTo(-26 * s, h / 2 - 4 * s); g.lineTo(clamp(p.x - cx, -w / 2 + 30 * s, w / 2 - 30 * s), Math.max(h / 2 + 50 * s, p.y - cy - 60 * s)); g.lineTo(26 * s, h / 2 - 4 * s); g.fillStyle = bg; g.fill();
  roundRect(g, -w / 2, -h / 2, w, h, 34 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#152435'; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 0, (-((lines.length - 1) / 2) + i) * size * 1.22 * s + 3 * s));
  if (heart) { g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ff4d7a'; g.fillText('♥', w / 2 - 10 * s, -h / 2 + 4 * s); }
  g.restore();
}
function counter(g, s, t) {
  let text, at, bg = 'rgba(214,52,110,.92)';
  for (const [n, w] of [[1, B.r1], [2, B.r2]]) if (t > w - 0.05 && t < w + 1.5) { text = `TEMPTATIONS RESISTED: ${n}`; at = w - 0.05; }
  if (t > B.eat - 0.1 && t < B.cta + 1.6) { const glitch = t < B.eat + 0.35; text = glitch ? (Math.floor(t * 30) % 2 ? 'TEMPTATIONS RESIS?#!' : 'TEMPTATIONS RESISTED: 2') : 'SUNDAES EATEN: 1'; at = B.eat - 0.1; if (!glitch) bg = 'rgba(232,170,40,.95)'; }
  if (!text) return;
  g.save(); g.font = `${36 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s; g.restore();
  pill(g, s, 540 - w / s / 2, 250, text, bg, '#ffffff', 36, pop(t, at, 0.2, 2.5));
}
// The three notes of the sniff, popping up beside his head: a waffle cone, a fudge drip, a mint choc chip scoop.
function smellIcons(g, s, t) {
  if (SHOT !== 'sniff') return;
  const icon = (at, x, y, draw) => { if (t < at) return; const k = pop(t, at, 0.2, 3); g.save(); g.translate(x * s, y * s); g.scale(k, k);
    g.beginPath(); g.arc(0, 0, 92 * s, 0, 7); g.fillStyle = 'rgba(255,248,236,.95)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#ff8fb8'; g.stroke(); draw(); g.restore(); };
  icon(B.i1, 210, 520, () => { g.fillStyle = '#d9a352'; g.beginPath(); g.moveTo(-34 * s, -10 * s); g.lineTo(34 * s, -10 * s); g.lineTo(0, 62 * s); g.fill(); g.strokeStyle = '#a8742e'; g.lineWidth = 3 * s; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 12 * s - 20 * s, -10 * s); g.lineTo(i * 12 * s + 14 * s, 40 * s); g.stroke(); } g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(0, -22 * s, 32 * s, Math.PI, 0); g.fill(); });
  icon(B.i2, 540, 420, () => { g.fillStyle = '#4a2610'; g.beginPath(); g.arc(0, -10 * s, 44 * s, Math.PI, 0); g.fill(); for (const [x, l] of [[-30, 40], [-6, 60], [20, 34], [36, 50]]) { g.fillRect((x - 7) * s, -12 * s, 14 * s, l * s); g.beginPath(); g.arc(x * s, (l - 12) * s, 7 * s, 0, 7); g.fill(); } });
  icon(B.i3, 860, 520, () => { g.fillStyle = '#9df0c4'; g.beginPath(); g.arc(0, 0, 48 * s, 0, 7); g.fill(); g.fillStyle = '#3b2010'; for (const [x, y] of [[-20, -14], [12, -24], [22, 8], [-10, 16], [-30, 8], [6, 30]]) g.fillRect(x * s, y * s, 9 * s, 6 * s); });
}
export function overlay(g, s, t) {
  counter(g, s, t); smellIcons(g, s, t);
  if (t > B.title && t < B.title + 3.2) lockup(g, s, { alpha: Math.min(1, (t - B.title) / 0.25, (B.title + 3.2 - t) / 0.3), k: pop(t, B.title, 0.3, 1.6), caseName: 'The Clown Case', y: 1490 });   // below the caption band
  if (SHOT === 'hook') bubble(g, s, t, headAt(sky2, 1), ['Are you single,', 'detective?'], W.girl - 0.1, W.tempting1 - 0.1, { heart: true });
  if (SHOT === 'working') bubble(g, s, t, headAt(gig, 1.2), ['Is it', 'working?'], B.working + 0.05, B.note, { size: 56 });
  if (SHOT === 'offer') bubble(g, s, t, headAt(scoop, 1), ['On the', 'house!'], W.owner, W.tempting2 - 0.15, { size: 56 });
  if (SHOT === 'wipe') bubble(g, s, t, headAt(wife, 1), ["You've got a little...", 'something.'], B.wipe, B.wipe + 1.3, { size: 44 });
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 700 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -200 * s, 840 * s, 400 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 80 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 128 * s);
    g.restore();
    bigText(g, s, 'MORE CASES...', 540, 570, 76, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 680, 64, '#ffffff', { k: k2 });
  }
  flash(g, s, (t >= B.reveal + 0.3 && t < B.reveal + 0.38) || (t >= B.splat && t < B.splat + 0.1) ? 0.35 : 0, '#ffffff');
}

export const cast = () => ({ max, sky: sky2, chief, gig, wife, scoop, crew0: crew[0], crew1: crew[1] });
