// Whatever Mia Draws. Web renderer + Roblox R6 pack. Anything drawn with Mia's pencil comes to life exactly as drawn;
// Leo draws a perfect lion, Mia's cage has no roof, her stick boyfriend gets batted about, and a scribble (a ball of
// yarn) saves the day. Beats: web/beats.js (source/beats.py). Sets and drawn props: web/kit.js. Lion: web/lion.js.
// Built so far: the lion section (Leo draws it -> it purrs with the yarn), W.draws1 .. W.wants.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import { classroom, drawingPaper, pencil, stickFigure, poseStick, cage, yarnBall, PAPER, SEATS, DESK_TOP } from './kit.js';
import { makeLion, placeLion, gait, lionDrawing, LION_SCALE } from './lion.js';

export const meta = { seconds: Math.ceil((W.end + 1.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Whatever Mia Draws' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.35, 0.75, 0.45) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const headTo = (a, b) => Math.atan2(VA(b).x - VA(a).x, VA(b).z - VA(a).z);
const angLerp = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- key times (all on the narration) ----------
const T = {
  draw: W.draws1 - 0.1, drawn: W.perfect - 0.25, alive: W.perfect + 0.05, land: W.perfect + 0.9, roar: W.roars - 0.05,
  run: W.screams - 0.45, stalk: W.screams + 0.1, grab: W.grabs2, cageDraw: W.draws2 - 0.15, cage: W.cage, cageLand: W.cage + 0.38,
  swat1: W.wobbly - 0.15, swat2: W.hold - 0.3, roof: W.forgot, crouch: W.jumps - 0.55, leap: W.jumps, out: W.out + 0.15,
  bfGo: W.lion3 + 0.6, bat1: W.bats, bat2: W.toy - 0.2, stops: W.stops, cat: W.just - 0.2, one: W.one,
  scrib: W.scribbles - 0.15, yarn: W.ball, pounce: W.pounces - 0.2, roll: W.purrs - 0.25, slide: W.purrs, end: W.wants - 0.15,
};
T.bfIn = T.bfGo + 2.0; T.yarnDown = T.yarn + 0.38; T.yarnStop = T.pounce - 0.15;

// ---------- places ----------
const LEO_DESK = V(-1.8, 0, 0.1), MIA_DESK = V(-1.6, 0, 2.7), MIA_DRAW = V(-1.8, 0, 1.0);
const LEO_PIN = V(-20.6, 0, -1.0);                       // backed against the board
const L_LAND = V(-9.5, 0, 6.5), L_STALK = V(-12, 0, -0.8), L_OUT = V(-15.5, 0, 8.0);
const L_BAT2 = V(-11.8, 0, 8.2), L_PLAY = V(-12.2, 0, 9.6), L_POUNCE = V(-8.8, 0, 9.5);
const BF0 = V(-1.0, 0, 4.6), BF1 = V(-17.6, 0, 3.6), BF2 = V(-9.0, 0, 6.6), BF3 = V(-1.6, 0, 6.2);
const Y_DROP = V(-5.4, 0, 2.0), Y_END = V(-7.0, 0, 9.4);
const DRAW_SCALE = 0.184;                                 // the page drawing's size (lion length 2.17 on the paper)
const DOOR = V(21.5, 0, 9);
const sitAt = (n) => V(SEATS[n][0] + 1.55, 0, SEATS[n][1]);

// ---------- scene ----------
let A = {}, leo, mia, max, noob, lion, room, paper, pen, bf, cg, yarn, cam, SHOT = 'draw', DRAWING;
const FACES = {
  Leo: ['smug', 'happy', 'shocked', 'scared', 'nervous', 'determined', 'neutral', 'surprised', 'squeezed', 'laugh'],
  Mia: ['neutral', 'happy', 'shocked', 'scared', 'surprised', 'determined', 'smug'],
  Max: ['neutral', 'happy', 'shocked', 'scared'], Noob: ['neutral', 'shocked', 'scared'],
};
export async function setup(stage) {
  const { scene } = stage;
  stage.renderer.localClippingEnabled = true;
  [leo, mia, max, noob] = await Promise.all(['Leo', 'Mia', 'Max', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: FACES[n], hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, mia.root, max.root, noob.root);
  for (const n of ['idle', 'run', 'walk', 'sit', 'shock', 'proud', 'laugh_big', 'think']) A[n] = await loadAnimation(n);
  room = classroom(scene); paper = drawingPaper(scene);
  lion = await makeLion(scene);
  DRAWING = lionDrawing(stage.renderer, lion, scene);
  pen = pencil(); scene.add(pen);
  bf = stickFigure(); scene.add(bf.root);
  cg = cage(); scene.add(cg.group);
  yarn = yarnBall(); scene.add(yarn.group);
}

// ---------- the lion ----------
const swat = (s, at, side, dur = 0.42) => {              // a paw swipe: up and out, then across
  const k = s - at; if (k < 0 || k > dur) return null;
  const u = k / dur, up = Math.sin(Math.PI * u), across = smooth(clamp((u - 0.25) / 0.5));
  return [lerp(0.55, -0.35, across) * up * (side === 'FrontR' ? -1 : 1), 0, -1.25 * up];
};
function lionAt(s) {
  const st = { pos: L_LAND.clone(), heading: Math.PI / 2, parts: {}, visible: s >= T.alive };   // before that it is the drawing on the paper
  const P = st.parts;
  if (s < T.alive) return st;
  if (s < T.land) {                                        // steps off the page: puffs up, grows, lands on the floor
    const u = inv(T.alive, T.land, s), a = smooth(clamp(u / 0.4)), b = smooth(inv(0.3, 1, u));
    st.flat = 1 - a; st.scale = lerp(DRAW_SCALE, 0.34, a) + (LION_SCALE - 0.34) * b; st.sketch = 1 - smooth(inv(0.35, 1, u));
    st.pos = PAPER.clone().lerp(L_LAND, b); st.y = (1 - b) * (0.012 + 1.8 * a) + 3.2 * Math.sin(Math.PI * b) * (1 - b * 0.3);
    st.heading = angLerp(0, Math.PI / 2, b); st.centerOn = a < 1 ? PAPER : null;
    P.FrontL = P.FrontR = [0, 0, -0.5 * Math.sin(Math.PI * b)]; P.RearL = P.RearR = [0, 0, 0.5 * Math.sin(Math.PI * b)];
    return st;
  }
  st.ground = true;
  const breathe = 0.03 * Math.sin(s * 2.4);
  P.Tail = [0, 0.3 * Math.sin(s * 1.7), -0.25];
  P.Head = [0, 0, breathe];
  if (s < T.stalk) {                                       // lands, then ROARS at the class
    const r = s - T.roar, open = s < T.roar ? 0 : smooth(clamp(r / 0.14)) * (1 - smooth(clamp((r - 0.85) / 0.25)));
    P.Jaw = [0, 0, 0.62 * open]; P.Head = [0, 0, -0.2 * open + breathe]; P.Tail = [0, 0.15 * Math.sin(s * 9) * open, -0.7 * open - 0.2];
    P.FrontL = P.FrontR = [0, 0, -0.12 * open]; st.pitch = 0.05 * open;
    const k = s - T.land; if (k < 0.3) st.y = -0.35 * Math.sin(Math.PI * k / 0.3);
    return st;
  }
  if (s < T.cage) {                                        // turns and stalks Leo into the corner
    const d0 = L_LAND.distanceTo(L_STALK), dist = clamp((s - T.stalk - 0.35) * 3.4, 0, d0), u = dist / d0;
    st.pos = L_LAND.clone().lerp(L_STALK, u);
    const toward = headTo(L_STALK, LEO_PIN);
    st.heading = s < T.stalk + 0.35 ? angLerp(Math.PI / 2, headTo(L_LAND, L_STALK), smooth(inv(T.stalk, T.stalk + 0.35, s))) : u < 1 ? headTo(L_LAND, L_STALK) : angLerp(headTo(L_LAND, L_STALK), toward, smooth(inv(0, 0.4, s - (T.stalk + 0.35 + d0 / 3.4))));
    if (dist > 0 && u < 1) Object.assign(P, gait(dist, 0.38, 3.0));
    P.Head = [0, 0, 0.14 + breathe]; P.Tail = [0, 0.35 * Math.sin(s * 3), 0.1];
    if (u >= 1) P.Jaw = [0, 0, 0.08 + 0.06 * Math.sin(s * 7)];     // a low growl
    return st;
  }
  if (s < T.crouch) {                                      // caged: flinches, swats the bars twice, looks up at the open top
    st.pos = L_STALK.clone(); st.heading = headTo(L_STALK, LEO_PIN);
    const fl = s - T.cageLand; if (fl > 0 && fl < 0.5) { P.Head = [0, 0, -0.25 * Math.sin(Math.PI * fl / 0.5)]; P.Jaw = [0, 0, 0.3 * Math.sin(Math.PI * fl / 0.5)]; }
    const sw1 = swat(s, T.swat1, 'FrontR'), sw2 = swat(s, T.swat2, 'FrontL');
    if (sw1) { P.FrontR = sw1; P.Jaw = [0, 0, 0.35]; }
    if (sw2) { P.FrontL = sw2; P.Jaw = [0, 0, 0.35]; }
    if (s >= T.roof + 0.25) { const k = smooth(inv(T.roof + 0.25, T.roof + 0.6, s)); P.Head = [0, 0.15 * Math.sin(s * 2), -0.42 * k]; P.Tail = [0, 0.6 * Math.sin(s * 5), -0.3]; }
    return st;
  }
  if (s < T.out + 0.35) {                                  // crouch, leap straight up and out over the bars, land
    const dir = headTo(L_STALK, L_OUT);
    if (s < T.leap) {
      const k = smooth(inv(T.crouch, T.crouch + 0.35, s));
      st.pos = L_STALK.clone(); st.heading = angLerp(headTo(L_STALK, LEO_PIN), dir, k);
      P.FrontL = P.FrontR = [0, 0, -0.45 * k]; P.RearL = P.RearR = [0, 0, 0.55 * k]; P.Head = [0, 0, -0.2 * k]; P.Tail = [0, 0.5 * Math.sin(s * 9), 0.2];
      return st;
    }
    const u = inv(T.leap, T.out, s), k = s - T.out;
    st.ground = false; st.heading = dir;
    st.pos = L_STALK.clone().lerp(L_OUT, smooth(u)); st.y = 9.2 * Math.sin(Math.PI * clamp(u)) * (u < 1 ? 1 : 0);
    st.pitch = u < 1 ? lerp(0.45, -0.35, u) : 0;
    P.FrontL = P.FrontR = [0, 0, u < 1 ? lerp(-1.0, -0.6, u) : -0.3 * (1 - smooth(clamp(k / 0.3)))];
    P.RearL = P.RearR = [0, 0, u < 1 ? lerp(0.9, 0.2, u) : 0];
    P.Tail = [0, 0, lerp(0.3, -0.6, clamp(u))];
    if (u >= 1) { st.ground = true; st.y = -0.3 * Math.sin(Math.PI * clamp(k / 0.3)); }
    return st;
  }
  if (s < T.bat1 + 0.6) {                                  // faces the stick boyfriend, swats him
    st.pos = L_OUT.clone();
    const bfP = bfAt(s).pos; st.heading = angLerp(headTo(L_STALK, L_OUT), headTo(L_OUT, bfP), smooth(inv(T.out + 0.35, T.out + 1.2, s)));
    P.Head = [0, 0.1 * Math.sin(s * 1.3), 0.08]; P.Tail = [0, 0.5 * Math.sin(s * 4), 0];
    const sw = swat(s, T.bat1, 'FrontR', 0.36); if (sw) P.FrontR = sw;
    return st;
  }
  if (s < T.cat) {                                         // bounds after him like a cat with a toy, bats him again
    const u = smooth(inv(T.bat1 + 0.6, T.bat2 - 0.1, s));
    st.pos = L_OUT.clone().lerp(L_BAT2, u); st.heading = headTo(L_OUT, L_BAT2);
    if (u > 0 && u < 1) { st.ground = false; st.y = 1.6 * Math.sin(Math.PI * u); st.pitch = lerp(0.25, -0.2, u); P.FrontL = P.FrontR = [0, 0, -0.6]; P.RearL = P.RearR = [0, 0, 0.5]; }
    const sw = swat(s, T.bat2, 'FrontL', 0.36); if (sw) P.FrontL = sw;
    if (s > T.bat2 + 0.4) {                                // watches him land; turns toward him and drifts over to play
      const k = smooth(inv(T.bat2 + 0.4, T.cat, s));
      st.pos = L_BAT2.clone().lerp(L_PLAY, k); st.heading = angLerp(headTo(L_OUT, L_BAT2), headTo(L_PLAY, BF3), k);
      if (k > 0 && k < 1) Object.assign(P, gait(k * L_BAT2.distanceTo(L_PLAY), 0.3, 2.6));
    }
    P.Tail = [0, 0.6 * Math.sin(s * 5), -0.2];
    return st;
  }
  if (s < T.pounce) {                                      // just a big cat: play bow, tail flicking, then the yarn
    st.pos = L_PLAY.clone(); const yp = yarnAt(s).pos;
    const watchYarn = s > T.yarnDown ? smooth(inv(T.yarnDown, T.yarnDown + 0.3, s)) : 0;
    st.heading = angLerp(headTo(L_PLAY, BF3), headTo(L_PLAY, yp), watchYarn);
    const bow = smooth(inv(T.cat, T.cat + 0.35, s));
    P.FrontL = P.FrontR = [0, 0, -0.55 * bow]; P.RearL = P.RearR = [0, 0, -0.1 * bow]; st.pitch = -0.1 * bow;
    P.Head = [0.18 * Math.sin(s * 2.2), 0, -0.1]; P.Tail = [0, 0.7 * Math.sin(s * 6), -0.55];
    const tap = s - (T.cat + 0.6); if (tap > 0 && tap < 0.35) P.FrontR = [0, 0, -0.55 - 0.5 * Math.sin(Math.PI * tap / 0.35)];
    if (s > T.yarnStop - 0.6) P.RearL = P.RearR = [0.12 * Math.sin(s * 18), 0, -0.1];   // the butt wiggle before the pounce
    return st;
  }
  // pounce onto the yarn, roll onto its back with it, purring
  const u = inv(T.pounce, T.pounce + 0.45, s);
  st.pos = L_PLAY.clone().lerp(L_POUNCE, smooth(u)); st.heading = headTo(L_PLAY, L_POUNCE);
  if (u < 1) { st.ground = false; st.y = 2.2 * Math.sin(Math.PI * u); st.pitch = lerp(0.35, -0.3, u); P.FrontL = P.FrontR = [0, 0, lerp(-1.0, -0.5, u)]; P.RearL = P.RearR = [0, 0, 0.6]; return st; }
  const r = smooth(inv(T.roll, T.roll + 0.5, s)), purr = s > T.roll + 0.5 ? 1 : 0;
  st.roll = Math.PI * r + 0.08 * Math.sin(s * 9) * purr;
  P.FrontL = [0, 0, -0.9 * r + 0.12 * Math.sin(s * 7)]; P.FrontR = [0, 0, -0.9 * r - 0.12 * Math.sin(s * 7)];
  P.RearL = P.RearR = [0, 0, 0.4 * r]; P.Tail = [0, 0.6 * Math.sin(s * 4), -0.3]; P.Jaw = [0, 0, 0.12 * purr]; P.Head = [0, 0.15 * Math.sin(s * 3) * purr, -0.1];
  return st;
}

// ---------- the stick boyfriend ----------
function bfAt(s) {
  const st = { pos: BF0.clone(), heading: -Math.PI / 2, pose: {}, visible: true };
  if (s < T.bfGo) return st;
  const d = BF0.distanceTo(BF1), u = clamp((s - T.bfGo) / (T.bfIn - T.bfGo));
  st.pos = BF0.clone().lerp(BF1, u); st.heading = headTo(BF0, BF1); st.pose = { walk: u * d * 0.9 };
  if (u >= 1) { st.heading = headTo(BF1, L_OUT); st.pose = { armR: [-1.4, -0.2], armL: [0, 0.35] }; }    // one arm out: "stop"
  if (s >= T.bat1 + 0.12) {                                // batted: spins away, slides, gets up; batted again; lands sitting, thumbs up
    const fly = (from, to, at, dur, spins) => { const k = clamp((s - at) / dur); return { pos: from.clone().lerp(to, easeOut(k)), y: 2.4 * Math.sin(Math.PI * k), spin: spins * Math.PI * 2 * easeOut(k), k }; };
    const f = s < T.bat2 + 0.12 ? fly(BF1, BF2, T.bat1 + 0.12, 0.6, 1.5) : fly(BF2, BF3, T.bat2 + 0.12, 0.65, 2);
    st.pos = f.pos; st.y = f.y; st.pose = { spin: f.spin, armL: [0, 1.2], armR: [0, -1.2], lift: 0 };
    st.heading = headTo(L_OUT, BF2);
    if (f.k >= 1) {
      st.y = 0; st.pose = { spin: 0, armL: [0, 0.35], armR: [-1.0, -0.3] };
      if (s >= T.bat2 + 0.9) { st.pose = { spin: 0, lift: -1.1, armL: [0, 0.35], armR: [-2.6, -0.2] }; st.heading = headTo(BF3, V(0, 0, 30)); }   // sitting, thumbs up
    }
  }
  return st;
}

// ---------- the yarn ----------
function yarnAt(s) {
  const st = { pos: PAPER.clone().add(V(0, 0.9, 0)), roll: 0, visible: s >= T.yarn && s < 1e9, scale: 1 };
  if (s < T.yarn) return st;
  if (s < T.yarnDown) { const u = inv(T.yarn, T.yarnDown, s); st.scale = easeOutBack(clamp(u / 0.4), 2); st.pos = PAPER.clone().lerp(Y_DROP, easeIn(u)).add(V(0, yarn.r + (DESK_TOP + 0.6) * (1 - easeIn(u)) + 0.6 * Math.sin(Math.PI * u), 0)); return st; }
  const d0 = Y_DROP.distanceTo(Y_END), u = smooth(inv(T.yarnDown, T.yarnStop, s));
  st.pos = Y_DROP.clone().lerp(Y_END, u).add(V(0, yarn.r + 0.25 * Math.abs(Math.sin(u * 9)) * (1 - u), 0)); st.roll = (u * d0) / yarn.r;
  if (s >= T.roll + 0.25) st.held = true;
  return st;
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function along(from, to, t0, s, speed) {
  const a = VA(from), b = VA(to), d = a.distanceTo(b), u = clamp((s - t0) * speed / Math.max(d, 1e-3));
  return { pos: a.clone().lerp(b, u), moving: u > 0 && u < 1, done: u >= 1, heading: Math.atan2(b.x - a.x, b.z - a.z), anim: (u * d) / STRIDE };
}
function leoAt(s) {
  const x = base(LEO_DESK, -Math.PI / 2, 'smug');
  if (s < T.run) {
    x.lean = 0.28; x.draw = s >= T.draw && s < T.drawn + 0.15;
    if (s >= T.alive) { x.face = 'surprised'; x.lean = 0.28 * (1 - smooth(inv(T.alive, T.alive + 0.4, s))); x.yaw = -0.5 * smooth(inv(T.alive + 0.3, T.land, s)); }
    if (s >= T.roar) { x.face = 'scared'; x.layers = [['shock', s - T.roar, 1, false]]; }
    return x;
  }
  const m = along(LEO_DESK, LEO_PIN, T.run, s, 10);
  x.pos = m.pos; x.heading = m.moving ? m.heading : Math.PI / 2; x.face = 'scared';
  x.layers = m.moving ? [['run', m.anim]] : [['shock', 0.6]];
  if (s >= T.slide) {                                      // safe: slides down the board to the floor
    const k = smooth(inv(T.slide, T.slide + 0.6, s)); x.face = k > 0.6 ? 'happy' : 'nervous';
    if (k > 0) { x.layers = [['sit', 0.5]]; x.y = lerp(0.9, -1.1, k); }
  }
  return x;
}
function miaAt(s) {
  const x = base(MIA_DESK, -Math.PI / 2 - 0.35, 'neutral');
  if (s >= T.alive) x.face = 'shocked';
  if (s >= T.roar) { x.face = 'scared'; x.layers = [['shock', s - T.roar, 1, false]]; }
  if (s >= T.grab - 0.4) {                                 // snatches the pencil, draws the cage
    const u = smooth(inv(T.grab - 0.4, T.grab + 0.1, s)); x.pos = MIA_DESK.clone().lerp(MIA_DRAW, u); x.heading = -Math.PI / 2; x.face = 'determined'; x.layers = [['idle', s]];
    x.draw = s >= T.cageDraw - 0.2 && s < T.cage + 0.05; x.lean = x.draw ? 0.25 : 0.1;
  }
  if (s >= T.cage + 0.1) { x.face = 'happy'; x.lean = 0; x.yaw = -0.6; }
  if (s >= T.roof) x.face = 'shocked';
  if (s >= T.crouch) x.face = 'scared';
  if (s >= T.bfGo) x.face = 'surprised';
  if (s >= T.stops - 0.1) { x.face = 'neutral'; x.yaw = -0.7; }
  if (s >= T.one) { x.face = 'smug'; x.yaw = -0.3; x.arms = [['R', 0.25, -1.9]]; }      // one idea: pencil up
  if (s >= T.scrib - 0.25) { x.face = 'determined'; x.arms = []; x.yaw = 0; x.draw = s < T.yarn; x.lean = x.draw ? 0.25 : 0; x.scribble = true; }
  if (s >= T.yarn) { x.face = 'happy'; x.yaw = -0.55; }
  if (s >= T.roll + 0.3) { x.face = 'happy'; x.layers = [['proud', s - T.roll - 0.3, 1, false]]; }
  return x;
}
function runner(seat, s, delay, face) {
  const sat = sitAt(seat), x = base(sat, -Math.PI / 2, 'neutral');
  if (s < T.run + delay) { x.layers = [['sit', 0.5]]; x.y = 0.32; if (s >= T.roar) x.face = 'shocked'; return x; }
  const m = along(sat, DOOR, T.run + delay, s, 11);
  x.pos = m.pos; x.heading = m.heading; x.face = face; x.layers = [['run', m.anim]]; x.visible = !m.done;
  return x;
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
  if (x.draw) setArm(a, 'R', 0.12 + 0.05 * Math.sin(tNow * (x.scribble ? 31 : 13)), -1.15 + 0.08 * Math.sin(tNow * (x.scribble ? 23 : 9)));
  if (x.yaw) a.bones.Head.rotateY(x.yaw);
  if (x.lean) a.root.rotateX(x.lean);
  a.root.updateMatrixWorld(true);
  if (x.y !== undefined) a.root.position.y = x.y; else a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const handP = (a, side = 'R') => a.bones['Arm.' + side].localToWorld(V(side === 'L' ? 0.5 : -0.5, -1.75, 0.2));

// The pencil: in the drawer's hand with its tip on the drawing point, or lying on the desk.
function placePencil(s, lx, ix) {
  let tip = null, hand = null;
  if (s < T.run && lx.draw) {                              // Leo: the tip follows the drawing front across the page
    const r = easeInOut(inv(T.draw + 0.1, T.drawn, s)), q = PAPER.clone().add(V(0.55 * Math.sin(s * 9) * Math.abs(Math.sin(s * 2.3)), 0, lerp(1.08, -1.08, r)));
    tip = q.add(V(0, 0.02, 0)); hand = handP(leo);
  } else if (s >= T.grab && ix.draw) {                     // Mia: wobbly bars, or a scribble
    const k = s * (ix.scribble ? 24 : 11); tip = PAPER.clone().add(V(0.45 * Math.sin(k), 0.02, 0.6 * Math.sin(k * 0.71 + 1))); hand = handP(mia);
  } else if (s >= T.grab) { hand = handP(mia); tip = hand.clone().add(V(-0.2, -0.6, 0.1)); }
  if (!tip) { pen.position.copy(PAPER).add(V(0.7, 0.1, 0.4)); pen.rotation.set(Math.PI / 2, 0, 0.3); return; }   // lying on the desk
  pen.position.copy(tip); const dir = hand.clone().sub(tip).normalize(); pen.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
}

// Mia's paper: blank -> the wobbly cage being drawn -> blank (it came to life) -> a scribble -> blank (yarn).
function drawPaper(s) {
  if (s >= T.draw && s < T.alive) {                        // Leo's lion: the pencil drawing appears nose first
    const r = easeInOut(inv(T.draw + 0.1, T.drawn, s)), n = Math.round(r * 80);
    paper.draw('lion' + n, (c, w, h) => {
      const Wd = DRAWING.width, Hd = DRAWING.height, sx = Wd * (1 - n / 80);
      c.save(); c.translate(w / 2, h / 2); c.rotate(Math.PI / 2);              // feet toward Leo, nose toward +z
      if (n > 0) c.drawImage(DRAWING, sx, 0, Wd - sx, Hd, -320 + 640 * (1 - n / 80), -200, 640 * n / 80, 400);
      c.restore();
    });
  } else if (s >= T.cageDraw && s < T.cage) {
    const n = Math.floor(clamp((s - T.cageDraw) / (T.cage - T.cageDraw)) * 12);
    paper.draw('cage' + n, (c, w, h) => {
      c.lineWidth = 7; c.beginPath(); c.ellipse(w / 2, h * 0.78, w * 0.32, h * 0.06, 0, 0, 7); c.stroke();
      for (let i = 0; i < n; i++) { const x = w * 0.2 + (i / 11) * w * 0.6; c.beginPath(); c.moveTo(x, h * 0.78); c.bezierCurveTo(x + 18, h * 0.6, x - 18, h * 0.4, x + 6, h * 0.22); c.stroke(); }
    });
  } else if (s >= T.scrib && s < T.yarn) {
    const n = Math.floor(clamp((s - T.scrib) / (T.yarn - T.scrib)) * 40);
    paper.draw('scrib' + n, (c, w, h) => {
      c.lineWidth = 7; c.strokeStyle = '#2d2d33'; c.beginPath(); let a = 0;
      for (let i = 0; i <= n * 9; i++) { a += 0.47; const r = 80 + 70 * Math.sin(i * 0.23) + 25 * Math.sin(i * 1.7); const px = w / 2 + Math.cos(a) * r, py = h / 2 + Math.sin(a * 1.07) * r * 1.1; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    });
  } else paper.draw('blank');
}

// ---------- shots (real time) ----------
const SHOTS = [
  [0, 'draw'], [W.every1 - 0.15, 'page'], [W.every2 - 0.12, 'tooth'], [T.alive - 0.1, 'alive'], [T.roar - 0.15, 'roar'],
  [T.run + 0.25, 'screams'], [W.lion2 - 0.1, 'corner'], [T.grab - 0.3, 'grab'], [T.cage - 0.1, 'cage'], [W.bars - 0.15, 'bars'],
  [T.roof - 0.1, 'roof'], [T.crouch - 0.1, 'leap'], [W.stick2 - 0.15, 'steps'], [T.bat1 - 0.35, 'bats'], [T.stops - 0.15, 'stops'],
  [T.cat - 0.1, 'cat'], [W.one - 0.25, 'idea'], [T.scrib - 0.1, 'scribble'], [T.yarn + 0.15, 'yarn'], [T.pounce - 0.3, 'pounce'],
  [W.once - 0.15, 'perfect'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 26) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, Math.min(tg.y, 6), tg.z), ext);
}
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), k * 0.5 * Math.sin(t * 57));
const shake = (t, at, k, dur = 0.4) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples() { return 1; }

let LST = null;
export function update(t, stage) {
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const s = t;
  const lx = leoAt(s), ix = miaAt(s);
  place(leo, lx, t); place(mia, ix, t); place(max, runner('Max', s, 0.05, 'scared'), t); place(noob, runner('Noob', s, 0.2, 'scared'), t);
  placePencil(s, lx, ix); drawPaper(s);
  // the lion
  const L = lionAt(s); LST = L;
  placeLion(lion, L);
  if (L.centerOn && lion.rig.visible) { box3.setFromObject(lion.rig); const c = box3.getCenter(V()); lion.rig.position.x += L.centerOn.x - c.x; lion.rig.position.z += L.centerOn.z - c.z; lion.rig.updateMatrixWorld(true); }
  // the cage: drops at T.cage, bars wobble when swatted; stays when the lion leaps out
  cg.group.visible = s >= T.cage;
  if (cg.group.visible) {
    const k = s - T.cage, y = k < 0.38 ? 13 * (1 - easeIn(k / 0.38)) : 0.35 * Math.exp(-(k - 0.38) * 7) * Math.abs(Math.sin((k - 0.38) * 20));
    cg.group.position.set(L_STALK.x, y, L_STALK.z);
    const face = headTo(L_STALK, LEO_PIN);
    for (const b of cg.bars) {
      let w = 0;
      for (const at of [T.swat1 + 0.18, T.swat2 + 0.18]) { const d = s - at; if (d > 0) w += 0.22 * Math.exp(-d * 5) * Math.sin(d * 26); }
      const facing = Math.cos(b.a - (Math.PI / 2 - face));          // bars in front of the lion take the hits
      b.g.rotation.set(0, 0, w * Math.max(0, facing));
      b.g.rotation.x = 0.04 * Math.sin(k * 3 + b.a * 3);            // a hand-drawn shimmer
    }
  }
  // the stick boyfriend
  const B = bfAt(s); bf.root.visible = B.visible; bf.root.position.copy(B.pos).add(V(0, B.y || 0, 0)); bf.root.rotation.set(0, B.heading, 0); poseStick(bf, B.pose);
  // the yarn
  const Y = yarnAt(s); yarn.group.visible = Y.visible;
  if (Y.visible) {
    if (Y.held) { const paws = V(2.4, -0.9, 0).applyMatrix4(lion.rig.matrixWorld); yarn.group.position.copy(paws); yarn.group.rotation.set(0, s * 2, s * 3); }   // between its front paws, on its back
    else { yarn.group.position.copy(Y.pos); yarn.group.rotation.set(0, 0, -Y.roll); }
    yarn.group.scale.setScalar(Y.scale ?? 1);
  }
  // flying papers at the roar
  for (const p of room.papers) {
    const k = s - T.roar - 0.1, d = p.userData;
    if (k <= 0) { p.position.copy(d.p0); p.rotation.set(-Math.PI / 2, 0, d.yaw); continue; }
    const tt = Math.min(k, 1.6), fl = Math.max(0, d.p0.y + d.v.y * tt - 4 * tt * tt);
    p.position.set(d.p0.x + d.v.x * tt * 0.8, fl < 0.02 ? 0.02 : fl, d.p0.z + d.v.z * tt * 0.8);
    p.rotation.set(-Math.PI / 2 + d.spin.x * tt, d.spin.y * tt, d.yaw + d.spin.z * tt);
  }

  // ---------- cameras ----------
  const roarShake = shake(t, T.roar + 0.1, 0.35, 0.8), landShake = shake(t, T.out, 0.3, 0.4), cageShake = shake(t, T.cageLand, 0.25, 0.35);
  const lp = lion.rig.position.clone();
  switch (shot.id) {                                       // every camera inside the room (x -22..22, z -14..14)
    case 'draw': look(stage, V(lerp(-10.8, -10.2, u), 6.8, 3.6), V(-3.2, 3.8, 0.8), 40); break;                                 // Leo drawing, from the board side
    case 'page': { const c = PAPER.clone(); look(stage, V(c.x - lerp(2.6, 2.3, u), c.y + lerp(3.5, 3.2, u), c.z), c.clone().add(V(0.25, 0, 0)), 46); break; }   // across the desk at the drawing, Leo behind it
    case 'tooth': { const c = PAPER.clone().add(V(0.15, 0, 0.75)); look(stage, V(c.x - 1.3, c.y + lerp(1.9, 1.6, u), c.z + 0.2), c, 44); break; }
    case 'alive': look(stage, V(-1.5, 6.2, 13.2), lp.clone().add(V(0, 1.6 + 1.2 * smooth(u), 0)), 54); break;          // follows it off the page
    case 'roar': look(stage, V(lerp(1.2, 0.6, u), 4.4, 7.4).add(roarShake), V(-7.0, 4.0, 6.5), 46); break;                    // in front of it
    case 'screams': look(stage, V(17, 8.6, 12.5), V(-2, 2.4, 1), 62); break;
    case 'corner': look(stage, V(-8.0, 5.5, lerp(10, 9, u)), V(-16.0, 3.0, -1.0), 52); break;
    case 'grab': look(stage, V(-9.2, 6.0, 4.2), V(-2.6, 3.6, 1.3), 44); break;                                                 // Mia, from the board side
    case 'cage': look(stage, V(-2.5, 7.5, 12.5).add(cageShake), V(-12, 3.4, -0.6), 54); break;
    case 'bars': look(stage, V(-19.0, 4.6, 7.0), V(-13.6, 3.2, -1.0), 50); break;                                              // its face through the bars
    case 'roof': look(stage, V(-10.5, lerp(13, 15, u), 6.5), V(-12, 1.5, -0.8), 52); break;                                    // high: no roof
    case 'leap': look(stage, V(-5.5, 7.5, 13.4).add(landShake), V(-13.6, 6.0, 3.6), 64); break;
    case 'steps': look(stage, V(-3.0, 6.0, 13.2), V(-14.0, 2.8, 4.5), 58); break;
    case 'bats': look(stage, V(-3.5, 5.5, 13.4), V(-11.5, 2.6, 6.0), 58); break;
    case 'stops': look(stage, mia.root.position.clone().add(V(-5.5, 4.6, 2.2)), mia.root.position.clone().add(V(0, 4.0, 0)), 38); break;
    case 'cat': look(stage, V(-3.0, 7.6, 13.6), V(-11.8, 2.2, 9.0), 60); break;                                         // three-quarter front: the play bow
    case 'idea': look(stage, mia.root.position.clone().add(V(-5.0, 4.4, 3.0)), mia.root.position.clone().add(V(0, 4.0, 0)), 40); break;
    case 'scribble': { const c = PAPER.clone(); look(stage, V(c.x - 2.4, c.y + 3.3, c.z), c.clone().add(V(0.25, 0, 0)), 46); break; }
    case 'yarn': look(stage, V(1.5, 4.2, 12.8), V(-6.5, 1.4, 6.5), 52); break;
    case 'pounce': look(stage, V(-0.5, 6.4, 13.6), V(-8.6, 2.0, 9.0), 62); break;
    case 'perfect': look(stage, V(lerp(3, 2, u), 8.0, 13.2), V(-12, 2.0, 4.5), 62); break;
    default: look(stage, V(4, 7, 13), V(-6, 3, 2), 50);
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080, y: (-p.y * 0.5 + 0.5) * 1920, on: p.z < 1 }; }
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function sparkles(g, s, p3, t, k) {                      // the "comes to life" shimmer
  if (k <= 0) return; const p = project(p3); if (!p.on) return;
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4 + t * 3, r = (120 + 90 * Math.sin(i * 1.7 + t * 5)) * k, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 1.2, sz = (10 + 10 * Math.abs(Math.sin(t * 9 + i))) * k;
    g.save(); g.translate(x * s, y * s); g.rotate(t * 2 + i); g.fillStyle = i % 3 ? '#ffffff' : '#ffe27a';
    g.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? sz * 0.3 : sz, aj = (j / 8) * Math.PI * 2; g.lineTo(Math.cos(aj) * rr * s, Math.sin(aj) * rr * s); } g.closePath(); g.fill(); g.restore();
  }
}
function heart(g, s, x, y, r, a) { g.save(); g.globalAlpha = a; g.translate(x * s, y * s); g.fillStyle = '#ff5c8a'; g.beginPath(); g.moveTo(0, r * 0.35 * s); g.bezierCurveTo(-r * s, -r * 0.4 * s, -r * 0.4 * s, -r * 1.1 * s, 0, -r * 0.45 * s); g.bezierCurveTo(r * 0.4 * s, -r * 1.1 * s, r * s, -r * 0.4 * s, 0, r * 0.35 * s); g.fill(); g.restore(); }
export function overlay(g, s, t) {
  const st = LST;
  if (st && t > T.alive - 0.1 && t < T.land + 0.5) sparkles(g, s, lion.rig.position.clone().add(V(0, 2.5, 0)), t, Math.sin(Math.PI * inv(T.alive - 0.1, T.land + 0.5, t)));
  if (SHOT === 'roar' && t > T.roar + 0.05) bigText(g, s, 'ROAR!', 540, 520, 190, '#ffd23f', easeOutBack(clamp((t - T.roar - 0.05) / 0.2), 2.2), -0.06);
  if (SHOT === 'cage' && t > T.cageLand) bigText(g, s, 'CLANG!', 540, 520, 130, '#ffffff', easeOutBack(clamp((t - T.cageLand) / 0.2), 2));
  if (SHOT === 'roof' && t > W.roof - 0.1) bigText(g, s, 'NO ROOF', 540, 1300, 130, '#ff5c5c', easeOutBack(clamp((t - W.roof + 0.1) / 0.2), 2), 0.04);
  if (SHOT === 'bats') for (const at of [T.bat1, T.bat2]) if (t > at + 0.1 && t < at + 0.8) bigText(g, s, 'BOP!', 380 + (at === T.bat2 ? 300 : 0), 640, 110, '#ffffff', easeOutBack(clamp((t - at - 0.1) / 0.15), 2), -0.1);
  if (SHOT === 'yarn' && t > T.yarn + 0.15 && t < T.yarn + 1.2) sparkles(g, s, yarn.group.position.clone(), t, 0.7);
  if ((SHOT === 'pounce' || SHOT === 'perfect') && t > T.roll + 0.4) {
    const p = project(lion.rig.position.clone().add(V(0, 3.2, 0)));
    bigText(g, s, 'PURRR...', clamp(p.x, 260, 820), clamp(p.y - 260, 400, 1400), 92, '#ffb3cf', easeOutBack(clamp((t - T.roll - 0.4) / 0.25), 2), -0.05);
    for (let i = 0; i < 5; i++) { const k = ((t * 0.6 + i / 5) % 1); heart(g, s, p.x + Math.sin(i * 2.1 + t) * 120, p.y - 120 - k * 300, 30 + 10 * Math.sin(i), 1 - k); }
  }
}
