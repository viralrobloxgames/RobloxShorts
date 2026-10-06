// He Won The Marathon By Car. Web renderer + Roblox R6 pack. True story (St. Louis Olympic marathon, 30 August 1904):
// in 90-degree heat, dust from the officials' cars and one water stop, Fred Lorz quits at mile nine and rides eleven miles
// in a car; when it breaks down at mile nineteen he jogs the rest, crosses the line first and is about to get the gold
// when officials hear about the car: banned. The Cuban mailman Andarin Carvajal runs in cut-off street clothes, chats
// with the crowd, eats rotten orchard apples, naps, and still finishes fourth; Len Taunyane is chased a mile off course
// by a dog. Max is the car-rider, Leo the mailman, Skye the runner the dog chases, Mia hands out the medal, Noob drives
// the car and is the official. Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear } from '../../../web/lib/robloxPack.js';
import { loadCreature, poseCreature, creatureLowest } from '../../../web/lib/creature.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { rng } from '../../../web/lib/world.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Won The Marathon By Car' };
export const sky = { zenith: '#4f8fe6', horizon: '#f2e3c0', below: '#c9b48a', fog: '#e9dcc0', sunDir: new THREE.Vector3(-0.35, 0.8, 0.5) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2, PX = R90, NX = -R90;            // headings: +x is the way out, -x the way home

// ---------- key times (all on the narration) ----------
const T = {
  medal: W.and1 - 0.1, heat: W.st - 0.1, dust: W.cars - 0.1, water: W.theres - 0.1, quit: W.at1 - 0.1, mail: W.behind - 0.1,
  chat: W.stops - 0.1, apple: W.eats - 0.1, nap: W.rotten - 0.1, dog: W.another - 0.1, brk: W.then - 0.1, jog: W.so2 - 0.1,
  cross: W.crosses - 0.1, caught: W.about - 0.1, banned: W.banned - 0.1, fourth: W.and3 - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.medal, 'medal'], [T.heat, 'heat'], [T.dust, 'dust'], [T.water, 'water'], [T.quit, 'quit'], [T.mail, 'mail'],
  [T.chat, 'chat'], [T.apple, 'apple'], [T.nap, 'nap'], [T.dog, 'dog'], [T.brk, 'brk'], [T.jog, 'jog'], [T.cross, 'cross'],
  [T.caught, 'caught'], [T.banned, 'banned'], [T.fourth, 'fourth'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, dog, car, fin, dust, steamC, medal, appleG, appleR, SHOT = 'hook', cam, NOW = 0;
const S = {}; let head2D = {};
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'smug', 'neutral', 'surprised', 'shocked', 'nervous', 'sad', 'determined', 'cool', 'laugh', 'scared', 'confused'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'talking', 'neutral', 'surprised', 'disgusted', 'sleeping', 'laugh', 'determined', 'nervous', 'confused', 'dizzy', 'cool'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'suspicious', 'smug', 'talking', 'laugh'], hairLift: 0.2 }),
    loadRobloxCharacter('Skye', { expressions: ['scared', 'determined', 'neutral', 'surprised', 'nervous', 'shocked', 'happy', 'confused'] }),
    loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised', 'shocked', 'angry', 'determined', 'nervous', 'talking', 'confused'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root);
  // race kit: Max and Skye in running vests with numbers, Leo in the mailman's long-sleeved white shirt and dark trousers
  // cut at the knee, Noob in a driver's cap
  K.shirt(max, { color: '#f4f1e8', sleeves: false, num: 31 });
  K.shirt(skye, { color: '#f4f1e8', sleeves: false, num: 35 });
  K.shirt(leo, { color: '#fbfaf4', sleeves: true, num: 3 }); K.cutTrousers(leo);
  await wear(noob, 'cap');
  for (const n of ['idle', 'walk', 'run', 'sit', 'proud', 'shrug', 'shock', 'laugh_big', 'point_forward', 'talk', 'clap', 'knocked_out', 'defeated', 'facepalm', 'hold', 'dizzy']) A[n] = await loadAnimation(n);

  S.ground = K.ground(scene); K.road(scene); K.fences(scene);
  // trees: scattered both sides, an orchard on the +z side at ORCHARD
  const r = rng(4), spots = [];
  for (let i = 0; i < 160; i++) { const x = -150 + r() * 1150, side = r() < 0.5 ? -1 : 1, z = side * (16 + r() * 140); if (Math.abs(x - K.FIELD_X) < 60 && side > 0 && z < 80) continue; if (Math.abs(x - K.ORCHARD.x) < 50 && side > 0) continue; if (x > -60 && x < 60 && side < 0 && z > -60) continue; spots.push([x, z, 0.9 + r() * 0.6]); }
  K.trees(scene, spots, 9);
  const orch = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) orch.push([K.ORCHARD.x - 30 + i * 12 + (j % 2) * 5, K.ORCHARD.z + j * 10, 0.85]);
  K.trees(scene, orch, 12, { apples: true });
  fin = K.finish(scene);
  const m9 = K.milePost(9); m9.position.set(K.MILE9_X, 0, K.ROAD_W / 2 + 2); m9.rotation.y = R90; scene.add(m9);
  const m19 = K.milePost(19); m19.position.set(K.MILE19_X, 0, -K.ROAD_W / 2 - 2); m19.rotation.y = R90; scene.add(m19); S.m19 = m19;
  const wl = K.well(); wl.position.copy(K.WELL); scene.add(wl);
  car = K.car(); scene.add(car);
  dust = K.dustCloud(16, 3); scene.add(dust);
  steamC = K.steam(10); steamC.children.forEach((m) => m.material.color.set('#f4f4f4')); scene.add(steamC);
  medal = K.medal(); scene.add(medal);
  appleG = K.apple(false); appleR = K.apple(true); scene.add(appleG, appleR);
  dog = await loadCreature('animal_collie_parts'); dog.root.scale.setScalar(0.75); scene.add(dog.root);
  dog.obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above)
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
// running along the road the whole shot (no start or stop inside the shot): x position = x0 + dir * speed * (s - t0)
function runAlong(x, x0, z, t0, s, speed, dir = 1) {
  const d = speed * (s - t0); x.pos = V(x0 + dir * d, 0, z); x.heading = dir > 0 ? PX : NX; x.layers = [[speed >= 14 ? 'run' : 'walk', Math.abs(d) / STRIDE]]; x.moving = true; return x;
}

// ---------- the car ----------
// Hook and quit: driving out (+x); breakdown: driving home (-x). dist drives the wheels.
const CAR_Z = 2.6, CAR_V = 26;
function carAt(s) {
  const c = { visible: false, pos: V(0, -50, 0), heading: PX, dist: 0, bounce: 0, max: false, noob: true };
  switch (SHOT) {
    case 'hook': { const d = CAR_V * s; c.visible = true; c.pos = V(70 + d, 0, CAR_Z); c.dist = d; c.bounce = 1; c.max = true; break; }
    case 'quit': {                                                       // rolls up beside Max, waits, then drives off with him
      const tArr = T.quit + 1.0, tGo = W.car2 + 0.15, stopX = K.MILE9_X + 4;
      let x, dist;
      if (s < tArr) { const k = (tArr - s); x = stopX - (CAR_V * 0.5) * k * k / 1.0 - 0; dist = x; }          // decelerating in
      else if (s < tGo) { x = stopX; dist = x; }
      else { const k = s - tGo; x = stopX + 0.5 * 30 * k * k; dist = x; }                                       // pulls away
      c.visible = true; c.pos = V(x, 0, CAR_Z); c.dist = dist; c.bounce = s > tArr && s < tGo ? 0.4 : 1; c.max = s > W.climbs + 0.55; break;
    }
    case 'dust': { const d = 22 * (s - T.dust); c.visible = true; c.pos = V(K.WELL.x - 120 + d, 0, 1.5); c.dist = d; c.bounce = 1; c.noob = true; c.official = true; break; }
    case 'brk': {                                                        // homeward, slowing, stops at the MILE 19 post
      const tStop = W.breaks + 0.35, stopX = K.MILE19_X + 1.5, dur = tStop - (T.brk - 0.3), v0 = 2 * 34 / dur;
      const k = clamp((s - (T.brk - 0.3)) / dur), x = stopX + 34 * (1 - k) * (1 - k);
      c.visible = true; c.heading = NX; c.pos = V(x, 0, -CAR_Z); c.dist = -x; c.bounce = s < tStop ? 1 : 1.6 * Math.max(0, 1 - (s - tStop) / 0.8); c.max = true; c.steam = s > W.breaks - 0.1; break;
    }
    case 'jog': { c.visible = true; c.heading = NX; c.pos = V(K.MILE19_X + 1.5, 0, -CAR_Z); c.steam = true; c.max = false; break; }
  }
  return c;
}
const seatWorld = (local) => { car.updateMatrixWorld(true); return local.clone().applyMatrix4(car.matrixWorld); };

// ---------- characters per shot ----------
const OUT = V(0, -50, 0);
function maxAt(s, C) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = st(OUT, PX, 'laugh'); x.seat = K.CAR.backSeat; x.layers = [['sit', 0, 1, false]]; x.waveR = true; x.face = s > 1.6 ? 'smug' : 'laugh'; return x; }
    case 'medal': {
      x = st(V(-4.4, 0, 0.3), -0.85, 'happy'); x.layers = [['proud', clamp(s - T.medal - 0.2, 0, 0.6), 1, false]]; x.face = s > W.gold ? 'cool' : 'happy'; return x;
    }
    case 'heat': {
      const at = V(K.START_X, 0, -3.2); x = st(at, PX, 'nervous'); if (s > W.degrees) runAlong(x, K.START_X, -3.2, W.degrees, s, 16); return x;
    }
    case 'dust': { x = runAlong(st(OUT, PX, 'confused'), K.WELL.x - 128, -2.5, T.dust, s, 16); x.face = 'confused'; return x; }
    case 'quit': {
      const stopAt = V(K.MILE9_X + 2.5, 0, -1.0), from = V(K.MILE9_X - 3.4, 0, -1.0);
      x = st(from, PX, 'sad'); moveTo(x, from, stopAt, T.quit - 0.05, s, 16, -2.3);
      if (!x.moving && s < W.climbs) { x.layers = [['defeated', clamp(s - T.quit - 0.4, 0, 0.6), 1, false]]; x.face = 'sad'; }
      if (s >= W.climbs) {                                               // climbs over the side into the back seat
        const k = clamp((s - W.climbs) / 0.6), seat = seatWorld(K.CAR.backSeat);
        if (k < 0.6) {                                                   // up over the side (the soles clear its top, y 3.65)
          x.pos = stopAt.clone().lerp(V(seat.x, 0, seat.z), smooth(clamp((k - 0.2) / 0.4)));
          x.lift = 4.0 * Math.sin(clamp(k / 0.4) * R90); x.heading = lerp(-2.3, PX - 2 * Math.PI, smooth(clamp(k / 0.6))); x.layers = [['idle', s]]; x.face = 'smug';
        } else { x.seat = K.CAR.backSeat; x.layers = [['sit', 0, 1, false]]; x.heading = PX; x.face = 'smug'; x.lift = 2.6 * (1 - smooth((k - 0.6) / 0.4)); if (s > W.car2 + 0.3) x.waveR = true; }
      }
      return x;
    }
    case 'brk': { x = st(OUT, NX, 'happy'); x.seat = K.CAR.backSeat; x.layers = [['sit', 0, 1, false]]; x.face = s > W.breaks + 0.2 ? 'shocked' : 'cool'; return x; }
    case 'jog': {                                                        // hops out on the -z side and jogs off home
      const seat = seatWorld(K.CAR.backSeat), out = V(seat.x, 0, -CAR_Z - 3.4), k = clamp((s - T.jog) / 0.7);
      if (k < 1) {
        x = st(V(seat.x, 0, lerp(seat.z, out.z, smooth(clamp((k - 0.1) / 0.5)))), NX - 0.6, 'smug');
        x.lift = k < 0.25 ? lerp(3.65, 4.6, smooth(k / 0.25)) : Math.max(0, 4.6 * (1 - easeIn(clamp((k - 0.25) / 0.45)))); return x;
      }
      x = st(out, NX, 'smug'); runAlong(x, out.x, out.z, T.jog + 0.7, s, 12, -1); x.face = 'smug'; return x;
    }
    case 'cross': {                                                      // through the tape and on a few steps
      const from = V(K.FINISH_X + 26, 0, -0.5), to = V(K.FINISH_X - 5.5, 0, -0.5);
      x = st(from, NX, 'happy'); moveTo(x, from, to, W.first2 - 26 / 15, s, 15, NX + 0.3); x.face = s > W.roars ? 'laugh' : 'happy';
      if (!x.moving) { x.layers = [['proud', clamp(s - (W.first2 - 26 / 15 + 31.5 / 15), 0, 0.6), 1, false]]; }
      return x;
    }
    case 'caught': { x = st(V(K.FINISH_X - 5.5, 0, -0.5), NX + 0.9, 'cool'); x.layers = [['proud', 1, 1, false]]; if (s > W.officials) { x.layers = [['idle', s]]; x.face = 'nervous'; x.heading = lerp(NX + 0.9, -1.1, smooth(inv(W.officials, W.officials + 0.4, s))); } return x; }
    case 'banned': { x = st(V(K.FINISH_X - 5.5, 0, -0.5), NX + 1.4, 'sad'); x.layers = [['shrug', clamp(s - T.banned - 0.1, 0, 0.7), 1, false]]; return x; }
  }
  return x;
}
function leoAt(s) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = runAlong(st(OUT, PX), 73, -1.3, 0, s, 16); x.face = s > 2.0 ? 'surprised' : 'determined'; if (s > 2.0) x.look = [-0.5 * smooth(inv(2.0, 2.4, s)), 0]; return x; }
    case 'heat': { x = st(V(K.START_X, 0, 0.0), PX, 'happy'); if (s > W.degrees) runAlong(x, K.START_X, 0.0, W.degrees + 0.1, s, 16); x.face = 'happy'; return x; }
    case 'dust': { x = runAlong(st(OUT, PX), K.WELL.x - 132, 1.0, T.dust, s, 16); x.face = 'confused'; return x; }
    case 'mail': { x = runAlong(st(OUT, PX), 300, -1.0, T.mail, s, 14); x.face = 'happy'; return x; }
    case 'chat': {
      x = st(V(K.CHAT_X - 1.6, 0, -7.6), 1.25, 'talking'); x.layers = [['talk', s, 1, true]]; x.face = Math.floor(s * 3) % 2 ? 'laugh' : 'talking'; return x;
    }
    case 'apple': { x = st(V(K.ORCHARD.x - 3, 0, 8.6), 0.55, 'happy'); x.eat = clamp((s - T.apple - 0.3) / 0.35); x.face = s > W.orchard ? 'laugh' : 'happy'; return x; }
    case 'nap': {
      const at = V(K.ORCHARD.x - 3, 0, 8.6); x = st(at, 0.55, 'disgusted'); x.eatRotten = s < W.so1;
      if (s >= W.lies - 0.1) { x.layers = [['knocked_out', clamp(s - W.lies + 0.1, 0, 0.35), 1, false]]; x.flat = true; x.face = 'sleeping'; x.heading = 0.55; }
      return x;
    }
    case 'fourth': case 'cta': {
      const from = V(K.FINISH_X + 20, 0, 0.8), to = V(K.FINISH_X - 4.5, 0, 0.8);
      x = st(from, NX, 'sleeping'); if (SHOT === 'fourth') moveTo(x, from, to, T.fourth - 0.1, s, 12, NX + 0.3); else x = st(to, NX + 0.3, 'laugh');
      x.face = SHOT === 'cta' ? 'laugh' : s > W.still ? 'happy' : 'sleeping';
      if (SHOT === 'fourth' && !x.moving) { x.layers = [['laugh_big', s, 1, true]]; x.face = 'laugh'; }
      if (SHOT === 'cta') x.waveR = true;
      return x;
    }
  }
  return x;
}
function skyeAt(s) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = runAlong(st(OUT, PX), 66, -3.3, 0, s, 16); x.face = s > 1.6 ? 'shocked' : 'determined'; return x; }
    case 'heat': { x = st(V(K.START_X, 0, 3.2), PX, 'nervous'); if (s > W.degrees) runAlong(x, K.START_X, 3.2, W.degrees + 0.05, s, 16); return x; }
    case 'dust': { x = runAlong(st(OUT, PX), K.WELL.x - 136, -0.8, T.dust, s, 16); x.face = 'scared'; return x; }
    case 'water': {
      const a = V(K.WELL.x - 24, 0, 1.5), b = V(K.WELL.x - 4.6, 0, 13.2), c = V(K.WELL.x + 0.4, 0, 13.4), t0 = T.water - 0.5, tb = t0 + a.distanceTo(b) / 16;
      x = st(a, PX, 'determined');
      if (s < tb) moveTo(x, a, b, t0, s, 16, PX); else moveTo(x, b, c, tb, s, 12, Math.PI);
      x.face = x.moving ? 'determined' : s > W.whole ? 'shocked' : 'surprised'; return x;
    }
    case 'dog': {                                                        // along the road, then off across the field
      const tr = skyeTrail(s); x = st(tr.pos, tr.heading, 'determined'); x.layers = [['run', tr.dist / STRIDE]]; x.moving = true;
      x.face = s > W.chased - 0.1 ? 'scared' : 'determined'; return x;
    }
  }
  return x;
}
function miaAt(s) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'medal': { x = st(V(-7.4, 0, 0.3), 0.85, 'happy'); x.medal = 'up'; return x; }
    case 'chat': { x = st(V(K.CHAT_X + 0.2, 0, -10.8), -0.45, 'laugh'); x.face = Math.floor(s * 2.4) % 2 ? 'laugh' : 'happy'; return x; }
    case 'caught': {
      const from = V(K.FINISH_X - 10.0, 0, -2.6), to = V(K.FINISH_X - 8.1, 0, -1.6);
      x = st(from, 0.9, 'happy'); moveTo(x, from, to, T.caught, s, 6, 1.1); x.layers = x.moving ? x.layers : [['idle', s]];
      x.medal = s > W.medal2 - 0.1 && s < W.officials ? 'up' : 'low'; if (s > W.officials) { x.face = 'shocked'; x.heading = lerp(1.1, -0.6, smooth(inv(W.officials, W.officials + 0.4, s))); } return x;
    }
    case 'banned': { x = st(V(K.FINISH_X - 8.1, 0, -1.6), 1.1, 'angry'); x.medal = 'back'; return x; }
    case 'fourth': case 'cta': { x = st(V(K.FINISH_X - 7.5, 0, -1.9), -0.9, 'happy'); x.layers = [['clap', s, 1, true]]; if (SHOT === 'cta') x.layers = [['proud', s - T.cta, 1, false]]; return x; }
  }
  return x;
}
function noobAt(s, C) {
  let x = st(OUT, 0); x.visible = false;
  if (C.visible && C.noob) { x = st(OUT, C.heading, 'happy'); x.seat = K.CAR.frontSeat; x.layers = [['sit', 0, 1, false]]; x.face = SHOT === 'brk' && s > W.breaks + 0.2 ? 'shocked' : SHOT === 'jog' ? 'confused' : 'happy'; x.drive = true; return x; }
  switch (SHOT) {
    case 'chat': { x = st(V(K.CHAT_X + 2.8, 0, -10.8), -0.6, 'happy'); return x; }
    case 'caught': case 'banned': {                                      // the official runs in, pointing
      const from = V(K.FINISH_X - 24.5, 0, 2.0), to = V(K.FINISH_X - 10.9, 0, 1.0);
      x = st(SHOT === 'banned' ? to : from, PX, 'angry');
      if (SHOT === 'caught') moveTo(x, from, to, W.until - 0.9, s, 16, 1.2);
      else x.heading = 1.2;
      if (!x.moving && (SHOT === 'banned' || s > W.until)) { x.layers = [['point_forward', 0.3, 1, false]]; x.face = 'angry'; }
      return x;
    }
  }
  return x;
}

// ---------- dog ----------
// Skye's run in the dog shot (pure function of time): along the road at 16, then off across the field at 17.
function skyeTrail(s) {
  const a = V(K.FIELD_X - 40, 0, -1), b = V(K.FIELD_X - 8, 0, -1), c = V(K.FIELD_X + 30, 0, 60), t0 = T.dog - 0.4, ab = a.distanceTo(b), t1 = t0 + ab / 16;
  if (s < t1) { const d = Math.max(0, (s - t0) * 16); return { pos: a.clone().lerp(b, d / ab), heading: PX, dist: d }; }
  const bc = b.distanceTo(c), d = Math.min(bc, (s - t1) * 17);
  return { pos: b.clone().lerp(c, d / bc), heading: Math.atan2(c.x - b.x, c.z - b.z), dist: ab + d };
}
// The dog bursts in from the -z meadow (through the fence gap) onto Skye's trail and closes to about 6 studs behind her.
const LEGS = ['FrontL', 'FrontR', 'RearL', 'RearR'];
const DOG_IN = () => W.chased - 0.8;
function dogPos(s) {
  const lag = lerp(1.0, 0.36, smooth(inv(DOG_IN(), W.chased + 0.4, s))), side = 12 * (1 - smooth(inv(DOG_IN(), W.chased + 0.1, s)));
  const tr = skyeTrail(s - lag); return { pos: tr.pos.clone().add(V(0, 0, -side)), dist: tr.dist + (12 - side) };
}
function dogAt(s) {
  const d = { visible: false, pos: OUT, heading: 0, dist: 0, moving: false };
  if (SHOT !== 'dog' || s < DOG_IN()) return d;
  const a = dogPos(s), b = dogPos(s + 1 / 30);
  d.visible = true; d.pos = a.pos; d.heading = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z); d.dist = a.dist; d.moving = true; return d;
}
function placeDog(d, s) {
  dog.root.visible = d.visible; if (!d.visible) return;
  dog.root.position.copy(d.pos); dog.root.rotation.set(0, d.heading - R90, 0);
  const ph = (d.dist / 3.2) * Math.PI * 2, sw = d.moving ? 0.6 : 0, sn = Math.sin(ph);
  poseCreature(dog, {
    Body: { r: [0, 0, 0], p: [0, d.moving ? 0.15 * Math.abs(Math.cos(ph)) : 0, 0] },
    FrontL: [0, 0, sw * sn], RearR: [0, 0, sw * sn], FrontR: [0, 0, -sw * sn], RearL: [0, 0, -sw * sn],
    Head: [0, 0, -0.15 + 0.06 * Math.sin(ph * 2)], Tail: [0, 0.4 * Math.sin(s * 14), 0.3],
  });
  dog.root.updateMatrixWorld(true);
  dog.root.position.y += d.pos.y + K.level(d.pos) - creatureLowest(dog, [...LEGS, 'Body']);
  dog.root.updateMatrixWorld(true);
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.waveR) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 9 + 1.3), 0.1);
  if (x.drive) { setArm(a, 'L', -0.2, -1.05); setArm(a, 'R', -0.2, -1.05); }
  if (x.eat != null || x.eatRotten) {                                 // apple to the mouth (right fist in front of the face)
    const k = x.eatRotten ? 1 : x.eat; setArm(a, 'R', lerp(0.1, 0.32, k), lerp(-0.3, -2.25, k));
  }
  if (x.medal === 'up') setArm(a, 'R', 0.18, -1.55);
  if (x.medal === 'low') setArm(a, 'R', 0.12, -0.8);
  if (x.medal === 'back') setArm(a, 'R', 0.05, 0.5);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (x.seat) {                                                         // hips on the seat cushion
    const seat = seatWorld(x.seat), hip = a.bones['Leg.L'].getWorldPosition(V()).add(a.bones['Leg.R'].getWorldPosition(V())).multiplyScalar(0.5);
    a.root.position.add(seat.clone().add(V(0, 0.5, 0)).sub(hip));
  } else if (!x.flat) a.root.position.y -= a.soleHeight() - (x.pos.y + K.level(x.pos));
  if (x.lift) a.root.position.y += x.lift;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const grip = (a, sd = 'R') => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(0, -1.8, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };

// ---------- lighting ----------
function light(stage) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = 2.9; stage.sun.color.set('#fff0d6'); stage.hemi.intensity = 0.7; sc.environmentIntensity = 0.55;
  stage.fill.intensity = 0.7; stage.rim.intensity = 1.0;
  u.zenith.value.set('#4f8fe6'); u.horizon.value.set('#f2e3c0');
  sc.fog.color.set('#e9dcc0'); sc.fog.near = 120; sc.fog.far = 700;
}
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.near = 0.5; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  light(stage); S.m19.visible = SHOT !== 'brk';
  // car first (passengers sit in it)
  const C = carAt(s);
  car.visible = C.visible; if (C.visible) { K.setCar(car, C.pos, C.heading, C.dist, C.bounce, s); car.updateMatrixWorld(true); }
  const M = maxAt(s, C); if (M.seat && !(C.visible && C.max)) M.visible = M.visible && !!C.visible;
  place(max, M); place(leo, leoAt(s)); place(mia, miaAt(s)); place(skye, skyeAt(s)); place(noob, noobAt(s, C));
  placeDog(dogAt(s), s);

  // dust behind any car on the move, and kicked up in the dust shot
  const moving = C.visible && (SHOT === 'hook' || SHOT === 'dust' || (SHOT === 'quit' && (s < T.quit + 1.0 || s > W.car2 + 0.15)) || (SHOT === 'brk' && s < W.breaks + 0.35));
  if (moving) { const back = V(-Math.sin(C.heading), 0, -Math.cos(C.heading)); K.dustAt(dust, C.pos.clone().addScaledVector(back, 5), back, s, SHOT === 'dust' ? 0.9 : 0.8, SHOT === 'dust' ? 1.2 : 1); }
  else K.dustAt(dust, OUT, V(1, 0, 0), s, 0);
  if (C.steam) { const f = V(Math.sin(C.heading), 0, Math.cos(C.heading)), p = C.pos.clone().addScaledVector(f, 6).add(V(0, 2.4, 0)); K.dustAt(steamC, p, V(0, 1, 0), s * 1.3, 0.9, 0.35); }
  else K.dustAt(steamC, OUT, V(1, 0, 0), s, 0);

  // finish dressing: the tape breaks when Max reaches it; the fans bounce when the crowd roars
  const tapeBroke = SHOT === 'cross' ? clamp((max.root.position.x > K.FINISH_X ? 0 : 1) * smooth(inv(0, 0.25, (K.FINISH_X - max.root.position.x) / 15))) : (SHOT === 'caught' || SHOT === 'banned' || SHOT === 'medal' || SHOT === 'fourth' || SHOT === 'cta') ? 1 : 0;
  K.breakTape(fin, tapeBroke);
  const roar = SHOT === 'cross' ? smooth(inv(W.crosses, W.crowd2, s)) : (SHOT === 'medal' || SHOT === 'fourth' || SHOT === 'cta') ? 1 : 0;
  bounceFans(s, roar);

  // props in hands
  medal.visible = !!mia.root.visible && miaAt(s).medal != null;
  if (medal.visible) { medal.position.copy(grip(mia, 'R')); medal.rotation.set(0, mia.root.rotation.y, 0); }
  const lx = leoAt(s);
  appleG.visible = SHOT === 'apple' && lx.eat != null; appleR.visible = SHOT === 'nap' && !!lx.eatRotten;
  for (const ap of [appleG, appleR]) if (ap.visible) { ap.position.copy(grip(leo, 'R')); ap.rotation.set(0, leo.root.rotation.y, 0); if (SHOT === 'apple' && s > W.apples + 0.2) ap.scale.set(1, 1, Math.max(0.55, 1 - 0.45 * inv(W.apples + 0.2, W.apples + 0.5, s))); }

  // ---------- cameras ----------
  const cp = car.position.clone(), mp = max.root.position.clone(), lp = leo.root.position.clone();
  switch (SHOT) {
    case 'hook': look(stage, cp.clone().add(V(20, 5.6, 1.4 - CAR_Z)), cp.clone().add(V(-3, 3.4, 0.4 - CAR_Z)), 50, 30); break;
    case 'medal': look(stage, V(-5.9, 4.8, 14.5 - 1.2 * u), V(-5.9, 4.3, 0.3), 42, 14); break;
    case 'heat': look(stage, V(K.START_X + 14, 4.6, 14), V(K.START_X + 2, 4.0, 0), 46, 20); break;
    case 'dust': { const rx = lerp(K.WELL.x - 128, K.WELL.x - 128 + 16 * (shot.end - shot.start), u); look(stage, V(rx + 20, 4.0, -7.6), V(rx + 6, 3.8, 0.5), 54, 30); break; }
    case 'water': look(stage, V(K.WELL.x + 2.0, 5.8, -7.0), V(K.WELL.x + 0.3, 3.9, 12.0), 42, 20); break;
    case 'quit': look(stage, V(K.MILE9_X - 9, 4.8, -8.4), V(K.MILE9_X + 3, 3.8, 0.5), 56, 20); break;
    case 'mail': look(stage, lp.clone().add(V(9.5, 3.6, 3.2)), lp.clone().add(V(0, 3.2, 0)), 44, 14); break;
    case 'chat': look(stage, V(K.CHAT_X + 0.5, 5.0, 6.5), V(K.CHAT_X + 0.4, 4.3, -9.0), 46, 14); break;
    case 'apple': look(stage, V(K.ORCHARD.x + 0.6, 5.0, 17.5), V(K.ORCHARD.x - 3, 4.4, 8.6), 40, 10); break;
    case 'nap': look(stage, V(K.ORCHARD.x - 0.6, lerp(5.6, 8.0, smooth(inv(W.lies - 0.1, W.nap + 0.3, s))), 15.2), V(K.ORCHARD.x - 3, lerp(4.4, 1.2, smooth(inv(W.lies - 0.1, W.nap + 0.3, s))), 8.6), 44, 12); break;
    case 'dog': { const sp = skye.root.position; look(stage, sp.clone().add(V(16, 7, -15)), sp.clone().add(V(-4, 2.6, 1)), 50, 30); break; }
    case 'brk': look(stage, V(K.MILE19_X - 11, 4.6, -8.6), V(K.MILE19_X + 2.5, 3.6, -1.5), 52, 20); break;
    case 'jog': look(stage, V(K.MILE19_X - 20 - 3 * u, 4.6, -8.4), V(mp.x - 0.5, 3.8, mp.z), 48, 20); break;
    case 'cross': look(stage, V(K.FINISH_X - 22, 5.0, 0.6), V(K.FINISH_X + 4, 5.2, -0.6), 50, 26); break;
    case 'caught': look(stage, V(K.FINISH_X - 8.2, 4.8, 15), V(K.FINISH_X - 8.2, 4.2, -0.5), 50, 16); break;
    case 'banned': look(stage, V(K.FINISH_X - 3.7, 4.8, 9.0), V(K.FINISH_X - 6.1, 4.6, -0.6), 42, 12); break;
    case 'fourth': case 'cta': look(stage, V(K.FINISH_X - 22, 5.0, 0.8), V(K.FINISH_X + 4, 5.0, -0.2), 50, 26); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
  head2D = {};
  for (const [k, a] of Object.entries({ max, leo, mia, skye, noob })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
  if (SHOT === 'dog' && dog.root.visible) { const p = dog.root.position.clone().project(cam); head2D.dog = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
}
const FM = new THREE.Matrix4(), FQ = new THREE.Quaternion(), FS = V(1, 1, 1), FP = V();
let FAN0 = null;
function bounceFans(s, k) {
  const f = fin.userData.fans;
  if (!FAN0) { FAN0 = []; for (let i = 0; i < f.n; i++) { f.tors.getMatrixAt(i, FM); const p = V().setFromMatrixPosition(FM); f.hats.getMatrixAt(i, FM); const hs = V(); FM.decompose(V(), FQ, hs); FAN0.push([p, hs.x]); } }
  for (let i = 0; i < f.n; i++) {
    const [p, hs] = FAN0[i], h = k * 0.5 * Math.abs(Math.sin(s * 9 + i * 1.7));
    FM.compose(FP.copy(p).add(V(0, h, 0)), FQ.identity(), FS.set(1, 1, 1)); f.tors.setMatrixAt(i, FM);
    FM.compose(FP.copy(p).add(V(0, 1.45 + h, 0)), FQ, FS); f.heads.setMatrixAt(i, FM);
    FM.compose(FP.copy(p).add(V(0, 2.05 + h, 0)), FQ, FS.setScalar(hs)); f.hats.setMatrixAt(i, FM);
  }
  f.tors.instanceMatrix.needsUpdate = f.heads.instanceMatrix.needsUpdate = f.hats.instanceMatrix.needsUpdate = true;
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
function bubble(g, s, lines, x, y, k, size = 56) {                     // speech bubble with a tail down to (x, y)
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
// heat shimmer: a warm vignette at the top in outdoor shots
function heat(g, s, a) {
  if (a <= 0) return;
  const gr = g.createLinearGradient(0, 0, 0, 700 * s); gr.addColorStop(0, `rgba(255,170,60,${0.28 * a})`); gr.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 1080 * s, 700 * s);
}
function thermometer(g, s, x, y, k, fill) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  roundRect(g, -34 * s, -230 * s, 68 * s, 300 * s, 34 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#16141f'; g.stroke();
  g.beginPath(); g.arc(0, 90 * s, 58 * s, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
  g.beginPath(); g.arc(0, 90 * s, 44 * s, 0, 7); g.fillStyle = '#e0262b'; g.fill();
  const top = lerp(60, -200, fill); roundRect(g, -16 * s, top * s, 32 * s, (100 - top) * s, 16 * s); g.fill();
  g.restore();
}
function zzz(g, s, t, x, y, k) {
  if (k <= 0) return;
  for (let i = 0; i < 3; i++) { const a = ((t * 0.7 + i / 3) % 1); bigText(g, s, 'Z', x + a * 120 + i * 10, y - a * 220, 60 + a * 50, '#ffffff', k * Math.sin(a * Math.PI), 0.2, '#2b3550'); }
}
function stink(g, s, t, x, y, k) {
  if (k <= 0) return;
  g.save(); g.strokeStyle = `rgba(110,170,60,${0.85 * k})`; g.lineWidth = 9 * s; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); for (let j = 0; j <= 12; j++) { const yy = y - j * 14, xx = x + (i - 1) * 40 + 12 * Math.sin(j * 0.9 + t * 8 + i); j ? g.lineTo(xx * s, yy * s) : g.moveTo(xx * s, yy * s); } g.stroke(); }
  g.restore();
}
function arrow(g, s, x0, y0, x1, y1, k, color = '#ffd23f') {
  if (k <= 0) return;
  const x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y - y0, x - x0);
  g.save(); g.strokeStyle = '#16141f'; g.lineWidth = 30 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0 * s, y0 * s); g.lineTo(x * s, y * s); g.stroke(); g.strokeStyle = color; g.lineWidth = 18 * s; g.stroke();
  g.translate(x * s, y * s); g.rotate(a); g.beginPath(); g.moveTo(40 * s, 0); g.lineTo(-24 * s, -34 * s); g.lineTo(-24 * s, 34 * s); g.closePath();
  g.fillStyle = color; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke(); g.restore();
}
const DATES = [[0, T.medal, 'OLYMPIC MARATHON · 1904'], [T.heat, T.dust, 'ST. LOUIS · AUG 30, 1904'], [T.quit, T.mail, 'MILE 9'], [T.brk, T.jog, 'MILE 19']];
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
const HOT = { hook: 0.6, heat: 1, dust: 0.8, water: 0.8, quit: 0.6, mail: 0.6, dog: 0.5, brk: 0.6, jog: 0.5 };
export function overlay(g, s, t) {
  heat(g, s, HOT[SHOT] || 0);
  dateTag(g, s, t);
  if (SHOT === 'hook') {
    const k = 1 + 0.12 * Math.max(0, Math.sin(clamp((t - W.eleven + 0.1) / 0.3) * Math.PI));
    g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
    roundRect(g, -390 * s, -105 * s, 780 * s, 210 * s, 34 * s); g.fillStyle = 'rgba(14,18,34,.86)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${110 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText('11 MILES', 0, -26 * s);
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('IN A CAR', 0, 62 * s); g.restore();
  }
  if (SHOT === 'medal') { bigText(g, s, 'NEARLY GOT', 540, 420, 100, '#ffffff', pop(t, W.nearly - 0.1), -0.03); bigText(g, s, 'THE GOLD', 540, 545, 140, '#ffd23f', pop(t, W.gold - 0.1), -0.03); }
  if (SHOT === 'heat') {
    const k = pop(t, W.over - 0.1, 0.25); thermometer(g, s, 860, 640, k, smooth(inv(W.over, W.degrees + 0.3, t)));
    if (t > W.ninety - 0.1) bigText(g, s, '90°F+', 600, 560, 150, '#ff5a3a', pop(t, W.ninety - 0.1), -0.05);
  }
  if (SHOT === 'dust' && t > W.dust - 0.1) bigText(g, s, 'DUST!', 540, 470, 150, '#e8c98a', pop(t, W.dust - 0.1), -0.05);
  if (SHOT === 'water') {
    bigText(g, s, '1 WATER STOP', 540, 430, 100, '#6ec8ff', pop(t, W.one1 - 0.1), -0.03);
    if (t > W.whole - 0.1) bigText(g, s, 'IN THE WHOLE RACE', 540, 550, 66, '#ffffff', pop(t, W.whole - 0.1), -0.03);
  }
  if (SHOT === 'quit') {
    if (t > W.quits - 0.1 && t < W.climbs) stamp(g, s, 'QUITS', 540, 560, clamp((t - W.quits + 0.1) / 0.18), '#e0262b', -0.1, 110);
    if (t > W.car2 - 0.1) bigText(g, s, 'TAXI!', 540, 470, 140, '#ffd23f', pop(t, W.car2 - 0.1), -0.05);
  }
  if (SHOT === 'mail') {
    pill(g, s, 'CUBAN MAILMAN', 540, 430, pop(t, W.cuban - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 60);
    if (t > W.cut - 0.1 && head2D.leo) bigText(g, s, 'CUT AT THE KNEE', 540, 560, 76, '#ffffff', pop(t, W.cut - 0.1), -0.03);
  }
  if (SHOT === 'chat' && head2D.leo) bubble(g, s, ['NICE DAY', 'FOR A RUN!'], head2D.leo[0], Math.min(head2D.leo[1] - 90, 820), pop(t, W.chat - 0.1, 0.2, 2), 58);
  if (SHOT === 'apple' && t > W.apples - 0.1) bigText(g, s, 'SNACK TIME', 540, 440, 110, '#ff5a3a', pop(t, W.apples - 0.1), -0.04);
  if (SHOT === 'nap') {
    if (t < W.lies) { stamp(g, s, 'ROTTEN', 540, 470, clamp((t - T.nap - 0.05) / 0.18), '#5aa02a', -0.1, 120); if (head2D.leo) stink(g, s, t, head2D.leo[0], head2D.leo[1] - 120, 1); }
    if (t > W.nap - 0.1 && head2D.leo) { bigText(g, s, 'NAP TIME', 540, 440, 120, '#ffffff', pop(t, W.nap - 0.1), -0.04, '#2b3550'); zzz(g, s, t, head2D.leo[0] + 40, head2D.leo[1] - 60, 1); }
  }
  if (SHOT === 'dog') {
    if (t > W.chased - 0.1) bigText(g, s, 'CHASED!', 540, 430, 140, '#ff5a3a', pop(t, W.chased - 0.1), -0.05);
    if (t > W.mile2 - 0.1) pill(g, s, '1 MILE OFF COURSE', 540, 590, pop(t, W.mile2 - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 56);
  }
  if (SHOT === 'brk' && t > W.breaks - 0.1) stamp(g, s, 'BROKE DOWN', 540, 470, clamp((t - W.breaks + 0.1) / 0.18), '#e0262b', -0.08, 100);
  if (SHOT === 'jog' && t > W.jogs - 0.1) bigText(g, s, 'JUST JOGS IN', 540, 440, 110, '#ffd23f', pop(t, W.jogs - 0.1), -0.04);
  if (SHOT === 'cross') { bigText(g, s, '1ST ACROSS', 540, 660, 120, '#ffd23f', pop(t, W.first2 - 0.1), -0.04); if (t > W.roars - 0.1) bigText(g, s, 'HOORAY!', 540, 780, 96, '#ffffff', pop(t, W.roars - 0.1), 0.04); }
  if (SHOT === 'caught' && t > W.officials - 0.1 && head2D.noob) bubble(g, s, ['HE RODE', 'IN A CAR!'], head2D.noob[0], Math.min(head2D.noob[1] - 80, 760), pop(t, W.officials - 0.1, 0.2, 2), 62);
  if (SHOT === 'banned') stamp(g, s, 'BANNED', 540, 520, clamp((t - T.banned - 0.05) / 0.18), '#e0262b', -0.12, 150);
  if (SHOT === 'fourth') {
    if (t > W.fourth - 0.15) stamp(g, s, '4TH PLACE', 540, 700, clamp((t - W.fourth + 0.15) / 0.18), '#2fbf5a', -0.08, 120);
    if (t < W.still && head2D.leo) zzz(g, s, t, head2D.leo[0] + 40, head2D.leo[1] - 60, 0.9);
    if (t > W.napped - 0.1 && t < W.fourth - 0.15) bigText(g, s, 'THE NAPPER', 540, 680, 110, '#ffffff', pop(t, W.napped - 0.1), -0.04);
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

export const cast = () => ({ max, leo, mia, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
