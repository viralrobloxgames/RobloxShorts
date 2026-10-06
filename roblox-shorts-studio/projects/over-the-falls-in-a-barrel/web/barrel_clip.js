// She Went Over Niagara Falls In A Barrel. Web renderer + Roblox R6 pack. True story (24 October 1901): on her 63rd
// birthday, Annie Edson Taylor, a broke schoolteacher who claimed to be about twenty years younger, went over the
// Horseshoe Falls in an oak barrel after her cat had gone over first as a test (it survived); friends pumped air in
// with a bicycle pump and set her adrift; rescuers pulled the barrel out about twenty minutes later and she climbed out
// with a cut on her head ("never again"). Then her manager ran off with the barrel, and she spent her savings on
// detectives to get it back. Mia is Annie, Leo and Noob her friends (Noob later the detective), Skye the rescuer, Max
// the manager (top hat), and the pack cat the cat. Beats: web/beats.js (source/beats.py). Sets: web/kit.js.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, wear, packItem } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { rng } from '../../../web/lib/world.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'She Went Over Niagara Falls In A Barrel' };
export const sky = { zenith: '#5a92d8', horizon: '#dfe9ef', below: '#9fb3bd', fog: '#d9e4ea', sunDir: new THREE.Vector3(-0.4, 0.75, 0.5) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;

// ---------- key times ----------
const T = {
  nobody: W.nobody - 0.1, bday: W.its - 0.1, younger: W.tells - 0.1, broke: W.shes2 - 0.1, catin: W.two - 0.1, catover: W.first - 0.1,
  catok: W.cat2 - 0.1, pump: W.so - 0.1, seal: W.they - 0.1, current: W.current - 0.1, over: W.over3 - 0.1, rescue: W.about - 0.1,
  alive: W.climbs2 - 0.1, verdict: W.verdict - 0.1, famous: W.shes3 - 0.1, manager: W.then - 0.1, detect: W.spends - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.nobody, 'nobody'], [T.bday, 'bday'], [T.younger, 'younger'], [T.broke, 'broke'], [T.catin, 'catin'], [T.catover, 'catover'],
  [T.catok, 'catok'], [T.pump, 'pump'], [T.seal, 'seal'], [T.current, 'current'], [T.over, 'over'], [T.rescue, 'rescue'], [T.alive, 'alive'],
  [T.verdict, 'verdict'], [T.famous, 'famous'], [T.manager, 'manager'], [T.detect, 'detect'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- places ----------
const D = K.DOCK, BARREL_DOCK = V(D.x, D.y, 52.5), PUMP_AT = V(D.x + 3.6, D.y, 53.2);
const LEDGE = K.LEDGE;                                                     // the barrel is landed here (lower river, +z side)
const PATH = (x) => V(x - 230, 0, K.PATH_Z);                              // upstream, clear of the dock and the crowd

// ---------- scene ----------
let A = {}, mia, max, leo, skye, noob, maxHat, brl, cat, pmp, hoseM, cakeG, boat, post, river, lower, fallsC, mistG, crowdA, crowdB, plaster, SHOT = 'hook', cam, NOW = 0;
const S = {}; let head2D = {};
export async function setup(stage) {
  const { scene } = stage;
  [mia, max, leo, skye, noob] = await Promise.all([
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'shocked', 'nervous', 'determined', 'wink', 'scheming', 'dizzy', 'angry', 'sad', 'laugh', 'smug', 'talking'], hairLift: 0.2 }),
    loadRobloxCharacter('Max', { expressions: ['happy', 'scheming', 'smug', 'neutral', 'laugh', 'evil_grin'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'determined', 'neutral', 'surprised', 'nervous', 'laugh'], hairLift: 0.16 }),
    loadRobloxCharacter('Skye', { expressions: ['determined', 'happy', 'surprised', 'neutral', 'laugh'] }),
    loadRobloxCharacter('Noob', { expressions: ['happy', 'determined', 'neutral', 'surprised', 'confused', 'nervous'] }),
  ]);
  scene.add(mia.root, max.root, leo.root, skye.root, noob.root);
  maxHat = await wear(max, 'top_hat');
  dressMia(mia);
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'laugh_big', 'point_forward', 'talk', 'clap', 'think', 'sit', 'dizzy', 'idle_lookaround', 'push']) A[n] = await loadAnimation(n);

  K.land(scene); river = K.upperRiver(scene); lower = K.lowerRiver(scene); fallsC = K.curtain(scene); mistG = K.mist(scene);
  const r = rng(4), spots = [];
  for (let i = 0; i < 150; i++) { const x = -600 + r() * 1200, s = r() < 0.5 ? -1 : 1, z = s * (95 + r() * 260); if (x > K.brinkX(70) && Math.abs(z) < 135) continue; if (s > 0 && z < 128) continue; spots.push([x, z, 0.9 + r() * 0.7]); }
  K.trees(scene, spots, 11);
  crowdA = K.crowd(scene, -75, -20, -96, 3, 9, 1);                         // -z bank by the brink, across the river
  crowdB = K.crowd(scene, -85, -25, 134, 2, 13, -1);                       // behind the stage (famous shot)
  K.dock(scene);
  brl = K.barrel(); scene.add(brl);
  pmp = K.pump(); scene.add(pmp); hoseM = K.hose(scene);
  cakeG = K.cake(); scene.add(cakeG);
  boat = K.rowboat(); scene.add(boat);
  post = K.poster(); scene.add(post);
  const stage0 = K.box(14, 1.2, 8, K.std('#8a6a48', { roughness: 0.85 }), K.STAGE.x, 0.6, K.STAGE.z); scene.add(stage0); S.stage = stage0;
  cat = await packItem('creatures', 'animal_cat'); cat.scale.setScalar(0.42); scene.add(cat); cat.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  plaster = makePlaster(); mia.bones.Head.add(plaster);
  const ledge = K.box(30, 8, 24, K.std('#9a9286', { roughness: 1, flatShading: true }), K.LEDGE.x, K.LEDGE.y - 4, K.LEDGE.z + 4); scene.add(ledge);
}
// Mia's long dark schoolteacher's dress: a sleeved bodice over the torso and a bell skirt from the waist (hides the legs).
function dressMia(a) {
  const navy = K.std('#2b2f45', { roughness: 0.75 }), white = K.std('#f2efe6', { roughness: 0.7 });
  const t = K.box(2.08, 2.06, 1.08, navy, 0, 1.03, 0); a.bones.Torso.add(t);
  const col = K.box(1.0, 0.22, 1.12, white, 0, 1.96, 0); a.bones.Torso.add(col);
  for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const sl = K.box(1.07, 1.6, 1.07, navy, sx * 0.5, -0.2, 0); a.bones[bone].add(sl); }
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.75, 1.95, 20), navy); skirt.position.set(0, -0.95, 0); skirt.scale.z = 0.72; skirt.castShadow = true; a.bones.Torso.add(skirt);
  a.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
// A cross plaster on Mia's left cheek (the cut), shown once she's out of the barrel.
function makePlaster() {
  const g = new THREE.Group(), m = K.std('#f4e6cf', { roughness: 0.6 });
  for (const r of [0.6, -0.6]) { const b = K.box(0.42, 0.13, 0.04, m); b.rotation.z = r; g.add(b); }
  g.position.set(0.4, 0.9, 0.63); g.scale.setScalar(0.8); g.visible = false; return g;
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const OUT = V(0, -300, 0);

// ---------- the barrel ----------
// b: { pos (bottom centre), tilt [rx, rz], lid (0 shut .. 1 open), side (lying on its side, rolling), roll }
function barrelAt(s) {
  const b = { visible: true, pos: BARREL_DOCK.clone(), heading: 0, tilt: [0, 0], lid: 1, side: false, roll: 0, mia: true };
  switch (SHOT) {
    case 'hook': case 'bday': case 'younger': case 'broke': b.lid = 1; break;
    case 'nobody': b.visible = false; break;
    case 'catin': b.lid = s < W.first - 0.35 ? 1 : 1 - smooth(inv(W.first - 0.35, W.first - 0.15, s)); b.mia = false; break;
    case 'catover': {                                                    // the test: drifts to the brink and over
      const x0 = -20, xb = K.brinkX(4), v = 18, tb = T.catover + (xb - x0) / v;
      b.mia = false; b.lid = 0;
      if (s < tb) { b.pos = V(x0 + v * (s - T.catover), -1.6, 4); b.tilt = [0.08 * Math.sin(s * 5), 0.1 * Math.sin(s * 4)]; }
      else { const u = s - tb; b.pos = V(xb + 9 * u, -1.6 - 0.5 * 60 * u * u, 4); b.tilt = [0, -Math.min(1.6, u * 2.4)]; if (b.pos.y < K.LOW_Y - 6) b.visible = false; }
      break;
    }
    case 'catok': { b.mia = false; b.lid = 0; b.pos = V(70, K.LOW_Y - 1.8 + 0.25 * Math.sin(s * 3), 18); b.tilt = [0.12 * Math.sin(s * 2.2), 0.14 * Math.sin(s * 1.7)]; break; }
    case 'pump': b.lid = 1; break;
    case 'seal': {                                                       // lid shut, pushed off the end, splash, drifting
      b.mia = s < W.seal; b.lid = 1 - smooth(inv(W.seal - 0.15, W.seal + 0.25, s));
      const tp = W.adrift - 0.75, edge = 45.6;                          // the dock ends at z 45
      if (s > tp) {
        const u = s - tp, z = 52.5 - Math.min(52.5 - edge, u * 9);
        if (z > edge + 0.01) b.pos = V(D.x, D.y, z);
        else { const u2 = u - (52.5 - edge) / 9; const y = Math.max(-1.8, D.y - 0.5 * 40 * u2 * u2); b.pos = V(D.x + u2 * 3, y + (y <= -1.8 ? 0.2 * Math.sin(s * 3) : 0), edge - u2 * 4); b.tilt = [-Math.min(0.5, u2 * 2), 0]; if (y <= -1.8) b.tilt = [0.1 * Math.sin(s * 3), 0.08 * Math.sin(s * 2.5)]; }
      }
      break;
    }
    case 'current': {                                                    // racing through the rapids to the brink
      const x = lerp(-140, -6, easeIn(inv(T.current - 0.2, T.over + 0.05, s)) * 0.55 + inv(T.current - 0.2, T.over + 0.05, s) * 0.45);
      b.mia = false; b.lid = 0; b.pos = V(x, -1.8 + 0.25 * Math.sin(s * 6), 6); b.tilt = [0.16 * Math.sin(s * 5.3), 0.2 * Math.sin(s * 4.1)]; break;
    }
    case 'over': {                                                       // over the brink, down through the mist
      const xb = K.brinkX(6), u = Math.max(0, s - T.over - 0.25);
      b.mia = false; b.lid = 0; b.pos = V(xb - 4 + Math.min(4, (s - T.over) * 12) + 7 * u, -1.8 - 0.5 * 55 * u * u, 6); b.tilt = [0, -Math.min(2.6, u * 2.2)];
      if (b.pos.y < K.LOW_Y - 4) b.visible = false; break;
    }
    case 'rescue': { b.mia = false; b.lid = 0; b.pos = V(lerp(103.5, 100.4, smooth(inv(T.rescue, W.grab, s))), K.LOW_Y - 1.8 + 0.3 * Math.sin(s * 2.6), 74.0); b.tilt = [0.1 * Math.sin(s * 2), 0.12 * Math.sin(s * 1.6)]; break; }
    case 'alive': b.pos = LEDGE.clone(); b.heading = Math.PI; b.lid = smooth(inv(T.alive + 0.05, T.alive + 0.3, s)); break;
    case 'verdict': b.pos = LEDGE.clone(); b.heading = Math.PI; b.mia = false; b.lid = 1; break;
    case 'famous': b.pos = V(K.STAGE.x + 4.5, 1.2, K.STAGE.z); b.mia = false; b.lid = 0; break;
    case 'manager': {                                                    // on its side, rolled off along the path
      const d = Math.max(0, (s - W.manager + 0.1) * 7); b.mia = false; b.lid = 0; b.side = true;
      b.pos = PATH(-26 + d).add(V(0, K.BARREL_R + 0.05, 0)); b.roll = -d / (K.BARREL_R + 0.1); break;
    }
    default: b.visible = false;
  }
  return b;
}
function placeBarrel(b) {
  brl.visible = b.visible; if (!b.visible) return;
  brl.position.copy(b.pos); brl.rotation.set(b.tilt[0], b.heading, b.tilt[1], 'YXZ');
  if (b.side) { brl.quaternion.setFromAxisAngle(V(0, 0, 1), b.roll).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), R90)); brl.position.set(b.pos.x, b.pos.y, b.pos.z - K.BARREL_H / 2); }
  K.setLid(brl, b.lid);
  brl.updateMatrixWorld(true);
}

// ---------- characters per shot ----------
// Mia standing in the barrel: her shoulders level with the rim (only head and shoulders show)
const inBarrel = (lift = 0) => { brl.updateMatrixWorld(true); return V(0, 1.0 + lift, 0).applyMatrix4(brl.matrixWorld); };
function miaAt(s, B) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'hook': {                                                       // stepping down into the barrel
      const k = smooth(inv(0.0, 1.1, s)); x = st(inBarrel(lerp(0.9, 0, k)), -1.35, 'determined'); x.raw = true;
      x.face = s > 2.2 ? 'happy' : 'determined'; return x;
    }
    case 'bday': { x = st(inBarrel(), -1.2, 'happy'); x.raw = true; x.face = s > W.birthday ? 'laugh' : 'happy'; return x; }
    case 'younger': { x = st(inBarrel(), -1.5, 'smug'); x.raw = true; x.face = s > W.twenty1 - 0.1 ? 'wink' : 'smug'; return x; }
    case 'broke': { x = st(inBarrel(), -1.5, 'nervous'); x.raw = true; x.face = s > W.thinks - 0.1 ? 'scheming' : 'sad'; return x; }
    case 'pump': { x = st(inBarrel(), -0.5, 'nervous'); x.raw = true; x.face = 'nervous'; x.look = [0.5 * Math.sin(s * 2.0), 0]; return x; }
    case 'seal': { if (!B.mia) return x; x = st(inBarrel(-smooth(inv(W.seal - 0.4, W.seal - 0.05, s)) * 1.4), -0.5, 'nervous'); x.raw = true; return x; }
    case 'alive': {                                                      // pops up dizzy, climbs out onto the ledge
      const up = smooth(inv(T.alive + 0.25, T.alive + 0.6, s)), out = smooth(inv(W.cut - 0.2, W.cut + 0.35, s));
      if (out <= 0) { x = st(inBarrel(lerp(-1.6, 0, up)), Math.PI - 0.2, 'dizzy'); x.raw = true; x.layers = [['dizzy', s, 1, true]]; return x; }
      const p = LEDGE.clone().add(V(lerp(0, -3.4, out), 0, lerp(0, 0.6, out)));
      x = st(p, Math.PI - 0.2, out < 1 ? 'dizzy' : (s > W.alive - 0.1 ? 'laugh' : 'dizzy')); x.lift = Math.max(0, (1 - out) * 2.2 + 1.2 * Math.sin(out * Math.PI)); x.plaster = true;
      if (out >= 1 && s > W.alive) x.layers = [['proud', s - W.alive, 1, false]]; return x;
    }
    case 'verdict': { x = st(LEDGE.clone().add(V(-3.4, 0, 0.6)), Math.PI - 0.15, 'angry'); x.plaster = true; x.layers = [['talk', s, 1, true]]; x.face = s > W.never - 0.1 ? 'angry' : 'determined'; return x; }
    case 'famous': { x = st(V(K.STAGE.x + 0.5, 1.2, K.STAGE.z + 1.0), Math.PI - 0.15, 'happy'); x.plaster = true; x.waveR = true; x.face = s > W.money ? 'laugh' : 'happy'; return x; }
    case 'manager': {
      x = st(PATH(-35).add(V(0, 0, -1.5)), 2.8, 'happy'); x.plaster = true; x.look = [0.5 * smooth(inv(W.runs - 0.2, W.runs + 0.3, s)), 0];
      if (s > W.runs - 0.1) { x.face = 'shocked'; x.layers = [['shock', clamp(s - W.runs + 0.1, 0, 0.3), 1, false]]; }
      return x;
    }
    case 'detect': case 'cta': {
      x = st(PATH(-58).add(V(0, 0, 2.5)), 2.2, 'sad'); x.plaster = true;
      if (SHOT === 'detect') { x.give = smooth(inv(W.savings - 0.3, W.savings + 0.1, s)) * (1 - smooth(inv(W.detectives + 0.4, W.detectives + 0.8, s))); x.face = s > W.back - 0.1 ? 'sad' : 'nervous'; }
      else { x.waveR = true; x.face = 'laugh'; }
      return x;
    }
  }
  return x;
}
function leoAt(s, B) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = st(BARREL_DOCK.clone().add(V(1.4, 0, 4.4)), -2.1, 'happy'); x.arms = [['L', 0.25, -0.9]]; return x; }
    case 'bday': { x = st(BARREL_DOCK.clone().add(V(3.6, 0, 2.2)), -1.9, 'laugh'); x.layers = [['clap', s, 1, true]]; return x; }
    case 'pump': { x = st(PUMP_AT.clone().add(V(0, 0, -1.4)), 0, 'determined'); x.pumping = true; return x; }
    case 'seal': {
      x = st(BARREL_DOCK.clone().add(V(1.8, 0, 3.2)), Math.PI - 0.5, 'determined');
      if (s > W.adrift - 0.9) { const z = Math.max(47.6, 56.1 - Math.max(0, s - (W.adrift - 0.75)) * 9); const p = V(D.x + 1.8, D.y, z); x = st(p, Math.PI - 0.3, 'determined'); x.arms = [['L', 0.1, -1.35], ['R', 0.1, -1.35]]; if (z > 47.61 && s > W.adrift - 0.75) x.layers = [['walk', (56.1 - z) / STRIDE]]; }
      return x;
    }
  }
  return x;
}
function noobAt(s) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'pump': { x = st(BARREL_DOCK.clone().add(V(-3.8, 0, 1.6)), 0.6, 'happy'); x.layers = [['clap', s, 1, true]]; return x; }
    case 'seal': {
      x = st(BARREL_DOCK.clone().add(V(-1.8, 0, 3.2)), Math.PI + 0.5, 'determined');
      if (s < W.adrift - 0.9) x.arms = [['R', 0.1, -2.0 + 0.4 * smooth(inv(W.seal - 0.15, W.seal + 0.25, s))]];
      else { const z = Math.max(47.6, 56.1 - Math.max(0, s - (W.adrift - 0.75)) * 9); x = st(V(D.x - 1.8, D.y, z), Math.PI + 0.3, 'determined'); x.arms = [['L', 0.1, -1.35], ['R', 0.1, -1.35]]; if (z > 47.61 && s > W.adrift - 0.75) x.layers = [['walk', (56.1 - z) / STRIDE]]; }
      return x;
    }
    case 'detect': case 'cta': {                                         // the detective
      x = st(PATH(-55.0).add(V(0, 0, 4.2)), -2.2, 'neutral');
      if (SHOT === 'detect') { x.layers = s > W.back - 0.3 ? [['shrug', clamp(s - W.back + 0.3, 0, 0.7), 1, false]] : [['idle_lookaround', s, 1, true]]; x.face = s > W.back - 0.3 ? 'confused' : 'determined'; }
      else { x.layers = [['shrug', 0.7, 1, false]]; x.face = 'confused'; }
      return x;
    }
  }
  return x;
}
function skyeAt(s, B) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'rescue': {                                                     // in the rowboat, reaching for the barrel
      x = st(V(96, K.LOW_Y + 0.35, 72.6), 0.35, 'determined'); x.raw = true; x.layers = [['sit', 0, 1, false]];
      x.reach = smooth(inv(W.rescuers - 0.3, W.grab - 0.05, s)); x.face = s > W.grab ? 'happy' : 'determined'; return x;
    }
    case 'alive': case 'verdict': { x = st(LEDGE.clone().add(V(3.6, 0, 1.8)), Math.PI + 0.5, 'surprised'); if (SHOT === 'alive' && s > W.alive - 0.1) { x.layers = [['clap', s, 1, true]]; x.face = 'laugh'; } return x; }
  }
  return x;
}
function maxAt(s, B) {
  let x = st(OUT, 0); x.visible = false;
  switch (SHOT) {
    case 'famous': { x = st(V(K.STAGE.x - 3.5, 1.2, K.STAGE.z + 0.6), Math.PI + 0.25, 'smug'); x.layers = [['proud', clamp(s - T.famous, 0, 0.6), 1, false]]; x.face = s > W.money - 0.1 ? 'scheming' : 'smug'; return x; }
    case 'manager': {                                                    // behind the rolling barrel, pushing it, glancing back
      const bx = B.pos.x - K.BARREL_R - 1.5; x = st(V(bx, 0, K.PATH_Z), R90, 'scheming');
      const d = Math.max(0, (s - W.manager + 0.1) * 7); x.layers = d > 0 ? [['walk', d / STRIDE]] : [['idle', s]]; x.arms = [['L', 0.1, -1.2], ['R', 0.1, -1.2]];
      if (s > W.runs) { x.look = [-0.6 * Math.sin(clamp((s - W.runs) / 0.8) * Math.PI), 0]; x.face = 'evil_grin'; }
      return x;
    }
  }
  return x;
}

// ---------- props: the cat, the pump, the cake, the boat, the poster ----------
function placeProps(s, B) {
  // cat: hops into the barrel on the dock; sits on the barrel below the falls
  cat.visible = false;
  if (SHOT === 'catin') {
    const k = inv(T.catin + 0.2, W.first - 0.45, s), p0 = BARREL_DOCK.clone().add(V(-4.5, 0, 2.5)), p1 = BARREL_DOCK.clone().add(V(0, 2.2, 0));
    cat.visible = k < 1; cat.position.copy(p0).lerp(p1, smooth(k)); cat.position.y = lerp(D.y, p1.y, k) + 3.6 * Math.sin(Math.min(1, k) * Math.PI);
    cat.rotation.set(0, Math.atan2(p1.x - p0.x, p1.z - p0.z), 0);
  }
  if (SHOT === 'catok') {
    brl.updateMatrixWorld(true); cat.visible = true; cat.position.copy(V(0, K.BARREL_H + 0.05, 0).applyMatrix4(brl.matrixWorld));
    cat.position.y += Math.max(0, 1.2 * Math.sin(clamp((s - W.survived2 + 0.2) / 0.45) * Math.PI)); cat.rotation.set(0, -1.2 + 0.15 * Math.sin(s * 3), 0);
  }
  // pump + hose (pump shot): the T-handle is set from Leo's fists (hands on the handle every frame)
  pmp.visible = hoseM.visible = SHOT === 'pump';
  if (SHOT === 'pump') { pmp.position.copy(PUMP_AT); pmp.rotation.set(0, 0, 0); K.setPump(pmp, pumpK(s)); pmp.updateMatrixWorld(true); K.setHose(hoseM, PUMP_AT.clone().add(V(0, 0.2, 0)), inBarrel(-0.2).add(V(K.BARREL_R + 0.25, 0, 0))); }
  cakeG.visible = SHOT === 'bday' || SHOT === 'younger'; if (cakeG.visible) { cakeG.position.copy(BARREL_DOCK).add(V(-3.6, 0, 2.6)); cakeG.userData.flames.forEach((f, i) => { f.scale.set(1, 1.7 + 0.3 * Math.sin(s * 17 + i), 1); }); }
  boat.visible = SHOT === 'rescue'; if (boat.visible) { boat.position.set(96, K.LOW_Y + 0.25 * Math.sin(s * 2.1 + 1), 72); boat.rotation.set(0.04 * Math.sin(s * 1.7), 0.15, 0.05 * Math.sin(s * 2.3)); }
  post.visible = SHOT === 'detect' || SHOT === 'cta'; if (post.visible) { post.position.copy(PATH(-61.2).add(V(0, 0, 6.5))); post.rotation.set(0, Math.PI - 0.25, 0); }
  S.stage.visible = SHOT === 'famous';
}
const pumpK = (s) => 0.5 - 0.5 * Math.cos(2 * Math.PI * Math.max(0, s - T.pump - 0.3) / 0.62);

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
// aim an arm so its palm (1.8 down the arm) points at a world target
function aimArm(a, sd, target) {
  const bone = a.bones['Arm.' + sd], par = bone.parent; par.updateMatrixWorld(true);
  const d = par.worldToLocal(target.clone()).sub(bone.position).normalize();
  const gamma = Math.asin(clamp(d.x, -1, 1)), alpha = Math.atan2(-d.z, -d.y);
  EUL.set(alpha, 0, gamma, 'XYZ'); bone.quaternion.setFromEuler(EUL);
}
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.waveR) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 9 + 1.3), 0.1);
  if (x.give != null) setArm(a, 'R', 0.15, lerp(-0.2, -1.4, x.give));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.raw) a.root.position.y -= a.soleHeight() - x.pos.y;
  else a.root.position.y -= a.soleHeight() - x.pos.y;                  // raw: the sole sits at pos.y (in the barrel / boat)
  if (x.lift) a.root.position.y += x.lift;
  a.root.updateMatrixWorld(true);
  if (x.reach) {                                                        // both palms onto the barrel's near hoops
    brl.updateMatrixWorld(true); const c = V(0, K.BARREL_H * 0.62, 0).applyMatrix4(brl.matrixWorld), sh = a.bones.Torso.getWorldPosition(V());
    const near = c.clone().add(sh.clone().sub(c).setY(0).normalize().multiplyScalar(K.BARREL_R + 0.1));
    for (const [sd, dy] of [['L', 0.45], ['R', -0.45]]) { const rest = a.bones['Arm.' + sd].getWorldPosition(V()).add(V(0, -1.8, 0)); aimArm(a, sd, rest.lerp(near.clone().add(V(0, dy, 0)), x.reach)); }
    a.root.updateMatrixWorld(true);
  }
  if (x.pumping) {                                                      // both palms on the T-handle ends; the handle rides the stroke
    const ends = handleEnds(); aimArm(a, 'L', ends[1]); aimArm(a, 'R', ends[0]); a.root.updateMatrixWorld(true);
  }
  setExpression(a, x.face);
  if (a === mia) plaster.visible = !!x.plaster;
}
function handleEnds() { pmp.updateMatrixWorld(true); const y = pmp.userData.handleY; return [V(-0.72, y, 0), V(0.72, y, 0)].map((p) => p.applyMatrix4(pmp.userData.rod.matrixWorld)); }
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };

// ---------- lighting and camera ----------
function light(stage) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = 2.6; stage.sun.color.set('#fff2e0'); stage.hemi.intensity = 0.75; sc.environmentIntensity = 0.55;
  stage.fill.intensity = 0.7; stage.rim.intensity = 0.9;
  u.zenith.value.set('#5a92d8'); u.horizon.value.set('#dfe9ef');
  sc.fog.color.set('#d9e4ea'); sc.fog.near = 160; sc.fog.far = 900;
}
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.near = 0.5; c.far = 2500; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  light(stage);
  K.flowWater(river, s); K.flowWater(lower, s); K.fallCurtain(fallsC, s); K.updateMist(mistG, s, SHOT === 'over' || SHOT === 'catover' || SHOT === 'nobody' ? 0.45 : 1);
  const B = barrelAt(s); placeBarrel(B);
  place(mia, miaAt(s, B)); place(leo, leoAt(s, B)); place(noob, noobAt(s)); place(skye, skyeAt(s, B)); place(max, maxAt(s, B));
  placeProps(s, B);
  if (SHOT === 'pump') { place(leo, leoAt(s, B)); }                     // pump placed first so the hands can reach it
  K.bounceCrowd(crowdA, s, SHOT === 'nobody' || SHOT === 'catover' ? 0 : 0.6);
  K.bounceCrowd(crowdB, s, SHOT === 'famous' ? 1 : 0);

  // ---------- cameras ----------
  const bp = brl.position.clone();
  switch (SHOT) {
    case 'hook': { const k = smooth(u); look(stage, BARREL_DOCK.clone().add(V(lerp(-17, -12.5, k), lerp(6.2, 5.8, k), lerp(3.0, 2.2, k))), BARREL_DOCK.clone().add(V(1.0, lerp(4.4, 4.8, k), 0.4)), 46, 22); break; }
    case 'nobody': { const k = easeOut(u); look(stage, V(lerp(80, 70, k), lerp(14, 10, k), lerp(-100, -92, k)), V(-14, -26, 6), 52, 150); break; }
    case 'bday': look(stage, BARREL_DOCK.clone().add(V(-14, 6.2, 3.4)), BARREL_DOCK.clone().add(V(-1.4, 4.0, 1.2)), 44, 16); break;
    case 'younger': case 'broke': look(stage, BARREL_DOCK.clone().add(V(-7.0, 6.4, 0.8)), BARREL_DOCK.clone().add(V(0, 6.0, 0)), 40, 10); break;
    case 'catin': look(stage, BARREL_DOCK.clone().add(V(-15, 6.4, 5.0)), BARREL_DOCK.clone().add(V(-1.5, 3.4, 0.8)), 46, 16); break;
    case 'catover': look(stage, V(42, 6, 66), V(-6, -10, 4), 50, 90); break;
    case 'catok': look(stage, V(56, K.LOW_Y + 4.0, 30), V(70, K.LOW_Y + 3.0, 18), 46, 20); break;
    case 'pump': look(stage, BARREL_DOCK.clone().add(V(1.2, 5.6, 13.5)), BARREL_DOCK.clone().add(V(1.6, 3.6, 0.8)), 44, 16); break;
    case 'seal': look(stage, V(D.x + 17, 6.0, 44.5), V(D.x, 2.0, 46.5), 50, 24); break;
    case 'current': look(stage, bp.clone().add(V(-14, 6.5, 14)), bp.clone().add(V(10, 1.5, -4)), 54, 40); break;
    case 'over': { const tg = V(lerp(K.brinkX(6) + 4, Math.min(bp.x, 14), 0.7), Math.max(-28, lerp(-22, bp.y - 3, 0.7)), 6); look(stage, V(92, 4, 74), tg, 34, 90); break; }
    case 'rescue': look(stage, V(98.6, K.LOW_Y + 5.2, 88), V(98.2, K.LOW_Y + 2.4, 73.5), 46, 20); break;
    case 'alive': look(stage, LEDGE.clone().add(V(-5.0, 5.4, -15)), LEDGE.clone().add(V(-2.4, 3.6, 0.4)), 46, 16); break;
    case 'verdict': look(stage, LEDGE.clone().add(V(-4.6, 5.0, -8.0)), LEDGE.clone().add(V(-3.4, 4.6, 0.6)), 40, 10); break;
    case 'famous': look(stage, V(K.STAGE.x - 1.0, 7.4, K.STAGE.z - 19), V(K.STAGE.x - 0.5, 6.4, K.STAGE.z + 1), 50, 24); break;
    case 'manager': { const k = smooth(inv(W.runs + 0.2, W.barrel5 + 0.5, s)); look(stage, PATH(-25).add(V(0, 6.4, -24)), V(lerp(PATH(-31).x, bp.x - 1, k), 3.2, K.PATH_Z), 52, 30); break; }
    case 'detect': case 'cta': look(stage, PATH(-57.5).add(V(0, 5.4, -14)), PATH(-58.5).add(V(0, 4.4, 3.0)), 50, 20); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
  head2D = {};
  for (const [k, a] of Object.entries({ mia, max, leo, skye, noob })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
  if (brl.visible) { const p = brl.position.clone().project(cam); head2D.barrel = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
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
function stamp(g, s, text, x, y, k, color = '#e0262b', rot = -0.12, size = 120) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); const sc = 1 + 1.6 * (1 - Math.min(1, k)); g.scale(sc, sc); g.globalAlpha = Math.min(1, k * 1.4);
  g.font = `${size * s}px "Alfa Slab One"`; const w = g.measureText(text).width / s + 70, h = size * 1.45;
  g.lineWidth = 12 * s; g.strokeStyle = color; roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 18 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6 * s); g.restore();
}
function thought(g, s, x, y, k, draw) {                                   // thought cloud above (x, y) with trailing dots
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.scale(k, k);
  g.fillStyle = '#ffffff'; g.strokeStyle = '#16141f'; g.lineWidth = 6 * s;
  for (const [cx, cy, r] of [[0, 0, 150], [-120, 30, 90], [120, 30, 90], [-60, -80, 90], [70, -80, 95]]) { g.beginPath(); g.arc(cx * s, cy * s, r * s, 0, 7); g.fill(); g.stroke(); }
  for (const [cx, cy, r] of [[0, 0, 146], [-120, 30, 86], [120, 30, 86], [-60, -80, 86], [70, -80, 91]]) { g.beginPath(); g.arc(cx * s, cy * s, r * s, 0, 7); g.fill(); }
  for (const [cx, cy, r] of [[-30, 190, 26], [-55, 245, 16]]) { g.beginPath(); g.arc(cx * s, cy * s, r * s, 0, 7); g.fill(); g.stroke(); }
  draw(g); g.restore();
}
function moneyBag(g, s, x, y, r) {
  g.save(); g.translate(x * s, y * s); g.fillStyle = '#c99a3b'; g.strokeStyle = '#16141f'; g.lineWidth = 5 * s;
  g.beginPath(); g.ellipse(0, 10 * s, r * s, r * 1.05 * s, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-r * 0.35 * s, -r * 0.8 * s); g.lineTo(r * 0.35 * s, -r * 0.8 * s); g.lineTo(r * 0.2 * s, -r * 1.25 * s); g.lineTo(-r * 0.2 * s, -r * 1.25 * s); g.closePath(); g.fill(); g.stroke();
  g.font = `${r * 1.1 * s}px "Luckiest Guy"`; g.fillStyle = '#2f7a35'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 0, 16 * s); g.restore();
}
function newspaper(g, s, t, t0) {                                         // spins in, holds
  const k = clamp((t - t0) / 0.4); if (k <= 0) return;
  g.save(); g.translate(540 * s, 470 * s); g.rotate((1 - k) * 6.28 * 1.5 - 0.06); g.scale(0.2 + 0.6 * easeOut(k), 0.2 + 0.6 * easeOut(k));
  g.fillStyle = '#f2ecdc'; g.strokeStyle = '#16141f'; g.lineWidth = 6 * s; g.fillRect(-380 * s, -260 * s, 760 * s, 520 * s); g.strokeRect(-380 * s, -260 * s, 760 * s, 520 * s);
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${40 * s}px "Alfa Slab One"`; g.fillText('THE DAILY FALLS · 1901', 0, -205 * s); g.fillRect(-350 * s, -175 * s, 700 * s, 6 * s);
  g.font = `${88 * s}px "Alfa Slab One"`; g.fillText('SHE DID IT!', 0, -100 * s);
  g.font = `${40 * s}px "Alfa Slab One"`; g.fillText('TEACHER, 63, GOES OVER', 0, -10 * s); g.fillText('NIAGARA IN A BARREL', 0, 45 * s);
  g.fillStyle = 'rgba(22,20,31,.25)'; for (let i = 0; i < 6; i++) { g.fillRect(-350 * s, (95 + i * 26) * s, 330 * s, 10 * s); g.fillRect(20 * s, (95 + i * 26) * s, 330 * s, 10 * s); }
  g.restore();
}
function ageCard(g, s, t) {
  const k = pop(t, W.tells - 0.05, 0.25); if (k <= 0) return;
  g.save(); g.translate(540 * s, 520 * s); g.scale(k, k); g.rotate(-0.04);
  roundRect(g, -300 * s, -130 * s, 600 * s, 260 * s, 30 * s); g.fillStyle = '#fff8e8'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#16141f'; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#16141f'; g.fillText('AGE:', -150 * s, 6 * s);
  const swap = clamp((t - W.twenty1 + 0.1) / 0.2);
  g.font = `${150 * s}px "Luckiest Guy"`; g.fillStyle = '#16141f'; g.globalAlpha = 1 - 0.4 * swap; g.fillText('63', 90 * s, 12 * s); g.globalAlpha = 1;
  if (swap > 0) { g.strokeStyle = '#e0262b'; g.lineWidth = 16 * s; g.beginPath(); g.moveTo(10 * s, 60 * s); g.lineTo((10 + 160 * swap) * s, -40 * s); g.stroke(); bigText(g, s, '43', 225, -95, 120, '#e0262b', easeOutBack(swap, 2), 0.1); }
  g.restore();
}
const DATES = [[T.catin, T.catok, '2 DAYS EARLIER'], [T.pump, T.seal, 'OCT 24, 1901'], [T.rescue, T.alive, '~20 MIN LATER']];
function dateTag(g, s, t) {
  for (const [a, b, text] of DATES) {
    if (t < a || t >= b) continue;
    const k = pop(t, a, 0.2, 1.8) * out(t, b, 0.12);
    g.save(); g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60;
    g.translate((60 + w / 2) * s, 270 * s); g.scale(k, k);
    roundRect(g, -w / 2 * s, -42 * s, w * s, 84 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
  }
}
function speed(g, s, t, amount) {
  if (amount <= 0) return; const fr = Math.floor(t * 30); let st0 = 7919 + fr * 104729; const rnd = () => ((st0 = (st0 * 16807) % 2147483647) / 2147483647);
  g.save(); g.strokeStyle = `rgba(255,255,255,${0.5 * amount})`; g.lineWidth = 5 * s; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const y = 300 + rnd() * 1300, x = rnd() * 1080, l = 120 + rnd() * 200; g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x + l) * s, (y + l * 0.15) * s); g.stroke(); }
  g.restore();
}
export function overlay(g, s, t) {
  dateTag(g, s, t);
  if (SHOT === 'hook') {
    g.save(); g.translate(540 * s, 450 * s);
    roundRect(g, -300 * s, -100 * s, 600 * s, 200 * s, 34 * s); g.fillStyle = 'rgba(14,18,34,.86)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${120 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.fillText('AGE 63', 0, -18 * s);
    g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('SCHOOLTEACHER', 0, 62 * s); g.restore();
  }
  if (SHOT === 'nobody') {
    pill(g, s, 'NIAGARA FALLS', 540, 330, pop(t, T.nobody), '#ffffff', 'rgba(14,18,34,.85)', 50);
    bigText(g, s, 'SURVIVORS IN', 540, 470, 86, '#ffffff', pop(t, W.ever - 0.1), -0.03); bigText(g, s, 'A BARREL: 0', 540, 580, 110, '#ff5a3a', pop(t, W.survived1 - 0.1), -0.03);
  }
  if (SHOT === 'bday') bigText(g, s, 'HAPPY BIRTHDAY!', 540, 450, 104, '#ff7ac8', pop(t, W.birthday - 0.15), -0.04);
  if (SHOT === 'younger') ageCard(g, s, t);
  if (SHOT === 'broke') {
    if (t > W.broke - 0.1) stamp(g, s, 'BROKE', 300, 400, clamp((t - W.broke + 0.1) / 0.18), '#e0262b', -0.1, 96);
    if (t > W.thinks - 0.1) thought(g, s, 760, 520, pop(t, W.thinks - 0.1, 0.25), (c) => { moneyBag(c, s, -80, 0, 70); moneyBag(c, s, 70, -20, 80); moneyBag(c, s, 0, -110, 55); });
  }
  if (SHOT === 'catin') bigText(g, s, 'TEST RUN', 540, 460, 120, '#ffd23f', pop(t, W.first - 0.6), -0.04);
  if (SHOT === 'catover') bigText(g, s, 'THE CAT GOES FIRST', 540, 470, 84, '#ffffff', pop(t, T.catover + 0.05), -0.03);
  if (SHOT === 'catok') stamp(g, s, 'THE CAT SURVIVED', 540, 470, clamp((t - W.survived2 + 0.15) / 0.18), '#2fbf5a', -0.08, 84);
  if (SHOT === 'pump' && t > W.bicycle - 0.1) bigText(g, s, 'PUMP! PUMP!', 540, 460, 110, '#ffffff', pop(t, W.bicycle - 0.1), -0.04);
  if (SHOT === 'seal') { if (t > W.seal - 0.1 && t < W.adrift - 0.7) stamp(g, s, 'SEALED', 540, 470, clamp((t - W.seal + 0.1) / 0.18) * out(t, W.adrift - 0.7, 0.15), '#e0262b', -0.1, 110); if (t > W.adrift + 0.3) bigText(g, s, 'SPLASH!', 540, 560, 130, '#6ec8ff', pop(t, W.adrift + 0.35), 0.05); }
  if (SHOT === 'current') { speed(g, s, t, 0.9); if (t > W.edge - 0.15) bigText(g, s, 'THE EDGE!', 540, 470, 140, '#ff5a3a', pop(t, W.edge - 0.15), -0.05); }
  if (SHOT === 'over') { bigText(g, s, 'HORSESHOE', 540, 430, 120, '#ffffff', pop(t, W.horseshoe - 0.1), -0.04); bigText(g, s, 'FALLS', 540, 560, 150, '#6ec8ff', pop(t, W.falls2 - 0.1), -0.04); }
  if (SHOT === 'rescue' && t > W.grab - 0.1) bigText(g, s, 'GOT IT!', 540, 470, 140, '#ffd23f', pop(t, W.grab - 0.1), -0.05);
  if (SHOT === 'alive' && t > W.alive - 0.1) stamp(g, s, 'ALIVE!', 540, 470, clamp((t - W.alive + 0.1) / 0.18), '#2fbf5a', -0.1, 140);
  if (SHOT === 'verdict' && head2D.mia) bubble(g, s, ['NEVER', 'AGAIN!'], head2D.mia[0], Math.min(head2D.mia[1] - 80, 820), pop(t, W.never - 0.1, 0.2, 2), 76);
  if (SHOT === 'famous') { newspaper(g, s, t, T.famous + 0.05); if (t > W.pouring - 0.2) bigText(g, s, '$ ... ?', 540, 900, 110, '#7CFC9A', pop(t, W.pouring - 0.2), 0.04); }
  if (SHOT === 'manager') { if (head2D.max) pill(g, s, 'HER MANAGER', clamp(head2D.max[0], 220, 860), head2D.max[1] - 150, pop(t, W.manager - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 46); if (t > W.barrel5 - 0.15) bigText(g, s, 'WITH THE BARREL!', 540, 460, 96, '#ff5a3a', pop(t, W.barrel5 - 0.15), -0.04); }
  if (SHOT === 'detect') {
    const n = Math.max(0, Math.round(lerp(500, 0, smooth(inv(W.savings - 0.1, W.back, t)))));
    g.save(); g.translate(540 * s, 450 * s); roundRect(g, -320 * s, -95 * s, 640 * s, 190 * s, 34 * s); g.fillStyle = 'rgba(14,18,34,.86)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = n === 0 ? '#ff5a3a' : '#7CFC9A'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${48 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('HER SAVINGS', 0, -40 * s);
    g.font = `${100 * s}px "Luckiest Guy"`; g.fillStyle = n === 0 ? '#ff5a3a' : '#7CFC9A'; g.fillText(`$${n}`, 0, 42 * s); g.restore();
    if (t > W.detectives - 0.1) pill(g, s, 'DETECTIVES', 540, 610, pop(t, W.detectives - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 50);
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

export const cast = () => ({ mia, max, leo, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
export const barrelObj = () => brl;
