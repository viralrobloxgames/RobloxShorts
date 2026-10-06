// Spaghetti Grows On Trees. Web renderer + Roblox R6 pack. True story (1 April 1957): Britain's most serious news show
// reports a bumper spaghetti harvest in Switzerland (a mild winter, the spaghetti weevil almost wiped out, every strand
// the same length thanks to careful breeding); eight million watch, hundreds phone in asking how to grow their own, and
// are told to place a sprig of spaghetti in a tin of tomato sauce and hope for the best. It was April Fools' Day.
// Max is the presenter, Mia and Skye the pickers, Leo and Noob the viewers at home. Beats: web/beats.js
// (source/beats.py). Sets and props: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.5) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Spaghetti Grows On Trees' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#6a7a5a', fog: '#cfe3f5', sunDir: new THREE.Vector3(0.45, 0.7, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;
const at = (base) => (x, y, z) => base.clone().add(V(x, y, z));
const OR = at(K.ORCHARD), SD = at(K.STUDIO), HM = at(K.HOME);
// Held props sit at the palm, measured on the pack mesh: (-0.5, -1.3, 0) in the right arm bone's frame (left: +0.5).
const PALM_R = V(-0.5, -1.3, 0), PALM_L = V(0.5, -1.3, 0);

// ---------- key times (all on the narration) ----------
const T = {
  watch: W.eight - 0.1, studio: W.its1 - 0.1, swiss: W.in_sw - 0.1, dry: W.pickers - 0.1, weevil: W.dreaded - 0.1, length: W.and1 - 0.1,
  tin: W.back - 0.1, calls: W.so - 0.1, ask: W.is - 0.1, answer: W.the_answer - 0.1, sprig: W.place - 0.1, calendar: W.date - 0.1,
  fool: W.it_was - 0.1, hoax: W.and_its - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.watch, 'watch'], [T.studio, 'studio'], [T.swiss, 'swiss'], [T.dry, 'dry'], [T.weevil, 'weevil'], [T.length, 'length'],
  [T.tin, 'tin'], [T.calls, 'calls'], [T.ask, 'ask'], [T.answer, 'answer'], [T.sprig, 'sprig'], [T.calendar, 'calendar'], [T.fool, 'fool'],
  [T.hoax, 'hoax'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = { hook: 'orchard', watch: 'home', studio: 'studio', swiss: 'orchard', dry: 'orchard', weevil: 'orchard', length: 'orchard', tin: 'home',
  calls: 'home', ask: 'home', answer: 'studio', sprig: 'home', calendar: 'studio', fool: 'studio', hoax: 'orchard', cta: 'orchard' };

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, P = {}, S = {}, PLACES = {}, SHOT = 'hook', NOW = 0, head2D = {};
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['neutral', 'happy', 'laugh', 'smug', 'talking', 'determined', 'cool', 'surprised'] }),
    loadRobloxCharacter('Leo', { expressions: ['surprised', 'shocked', 'happy', 'neutral', 'confused', 'talking', 'nervous', 'determined', 'laugh', 'sad'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'laugh', 'smug', 'surprised', 'determined', 'talking'], hairLift: 0.2 }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'surprised', 'laugh', 'determined'] }),
    loadRobloxCharacter('Noob', { expressions: ['surprised', 'happy', 'neutral', 'laugh', 'determined'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root);
  for (const n of ['idle', 'walk', 'sit', 'talk', 'point_forward', 'laugh', 'laugh_big', 'facepalm', 'think', 'shrug', 'clap', 'proud']) A[n] = await loadAnimation(n);
  PLACES.orchard = K.orchard(scene); PLACES.studio = K.studio(scene); PLACES.home = K.livingRoom(scene);
  for (const k of Object.keys(PLACES)) S[k] = PLACES[k].userData;
  S.wb = S.orchard.hero.userData.bunches.reduce((m, b) => (b.position.z > m.position.z ? b : m));
  P.tin = K.tin('spaghetti'); scene.add(P.tin);
  P.hank = K.bunch(77, 12, 2.2, 0.3); scene.add(P.hank);                       // the hank in Mia's hand
  P.basket = K.basketProp(); scene.add(P.basket);                                // carried by Skye (by its handle)
  P.strand = K.bunch(78, 5, 1.5, 0.1); P.strand.scale.set(1.8, 1, 1.8); scene.add(P.strand);                     // Leo's sprig
  P.hsLeo = K.handset(); leo.bones['Arm.L'].add(P.hsLeo); P.hsLeo.position.copy(PALM_L); P.hsLeo.rotation.z = R90;
  P.hsMax = K.handset(); max.bones['Arm.R'].add(P.hsMax); P.hsMax.position.copy(PALM_R); P.hsMax.rotation.z = R90;
  P.weevil = K.weevil(); scene.add(P.weevil);
  P.handDrape = K.bunch(79, 9, 2.4, 0.25); scene.add(P.handDrape);               // the hank Skye drapes on the rail
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [['walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const sitIn = (x) => { x.sit = true; x.layers = [['sit', 0, 1, false]]; return x; };
// the ladder: Mia stands on the third rung (top 3.1) facing +x, her left arm reaching up into the tree
const MIA_LADDER = OR(1.6, 2.0, 5.55), SKYE_HOOK = OR(-0.9, 0, 7.8);       // Mia on the second rung, head clear of the crown
// home: the armchairs (seat top 1.8, root 0.3), the phone on the side table, the sauce tin
const LEO_CHAIR = HM(-2.0, 0.3, 4.3), NOOB_CHAIR = HM(2.0, 0.3, 4.3);
const LEO_PHONE = HM(-4.4, 0, 2.0), LEO_TIN = HM(10.8, 0, 3.7), NOOB_TIN = HM(12.4, 0, 0.9);
const MAX_DESK = SD(0, 0, -5.8);

function maxAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'studio': { x = st(MAX_DESK, 0, 'neutral'); x.layers = [['talk', s, 1, true]]; x.face = 'talking'; return x; }
    case 'answer': {
      x = st(MAX_DESK, 0, 'neutral'); const k = smooth(inv(T.answer + 0.05, T.answer + 0.35, s));
      x.arms = [['R', lerp(0, 0.5, k), lerp(0, -2.55, k)]]; x.phone = k > 0.5; x.face = 'neutral'; return x;
    }
    case 'calendar': { x = st(MAX_DESK, 0, 'neutral'); return x; }
    case 'fool': { x = st(MAX_DESK, 0, 'smug'); if (s > W.fools - 0.1) { x.layers = [['laugh_big', s - W.fools + 0.1, 1, true]]; x.face = 'laugh'; } return x; }
  }
  return x;
}
function miaAt(s) {
  let x = st(V(0, -50, 0), 0, 'happy'); x.visible = false;
  switch (SHOT) {
    case 'hook': case 'swiss': {                                   // on the ladder, picking: the left arm reaches up, pulls down
      x = st(MIA_LADDER, R90 - 0.25, 'happy'); x.sit = true;
      const k = 0.5 + 0.5 * Math.sin(s * 2.2);
      x.arms = [['L', lerp(1.9, 2.4, k), 0.15], ['R', 1.25, -0.25]]; x.hank = true; x.look = [-0.15, 0.15];   // one hand in the tree, the other holds out a hank
      x.face = SHOT === 'hook' && s > 1.2 ? 'laugh' : 'happy'; return x;
    }
    case 'length': { x = st(OR(-5.6, 0, 12.4), 0.45, 'happy'); x.arms = [['R', lerp(0.1, 1.45, smooth(inv(T.length + 0.1, T.length + 0.4, s))), 0.1]]; x.look = [-0.45, 0]; if (s > W.careful) { x.face = 'smug'; x.look = [0, 0]; } return x; }
    case 'hoax': case 'cta': { x = st(OR(-1.6, 0, 7.2), 0.45, 'laugh'); x.layers = [['laugh_big', s + 0.4, 1, true]]; if (SHOT === 'cta') { x.layers = [['idle', s]]; x.wave = true; x.face = 'happy'; } return x; }
  }
  return x;
}
function skyeAt(s) {
  let x = st(V(0, -50, 0), 0, 'happy'); x.visible = false;
  switch (SHOT) {
    case 'hook': { x = st(SKYE_HOOK, 0.55, 'happy'); x.look = [-0.5, -0.35]; x.basket = true; x.face = s > 1.4 ? 'laugh' : 'happy'; return x; }
    case 'swiss': { const a = OR(-14, 0, 14), b = OR(-3, 0, 9); x = st(a, 0, 'happy'); moveTo(x, a, b, T.swiss + 0.2, s, 12, 0.7); x.basket = true; return x; }
    case 'dry': {                                                  // walks to the rail with a hank, drapes it over the pole
      const a = OR(17.5, 0, 14.5), b = OR(12.0, 0, 13.0);
      x = st(a, 0, 'happy'); moveTo(x, a, b, T.dry - 0.3, s, 12, -0.45);
      x.arms = [['L', -0.12, -1.05], ['R', -0.12, -1.05]]; x.drape = 0;
      x.face = 'happy'; return x;
    }
    case 'hoax': case 'cta': { x = st(OR(1.6, 0, 7.4), -0.4, 'laugh'); x.layers = [['laugh_big', s, 1, true]]; if (SHOT === 'cta') { x.layers = [['proud', s - T.cta, 1, false]]; x.face = 'happy'; } return x; }
  }
  return x;
}
function leoAt(s) {
  let x = st(V(0, -50, 0), 0, 'surprised'); x.visible = false;
  switch (SHOT) {
    case 'watch': { x = sitIn(st(LEO_CHAIR, Math.PI + 0.12, 'surprised')); x.face = s > W.watching ? 'shocked' : 'surprised'; return x; }
    case 'calls': {                                                // up out of the chair to the phone, handset up
      const a = HM(-2.0, 0, 2.2), b = LEO_PHONE;
      x = st(a, Math.PI, 'determined'); moveTo(x, a, b, T.calls + 0.05, s, 12, 2.7);
      const k = smooth(inv(T.calls + 0.45, T.calls + 0.75, s));
      if (!x.moving && s > T.calls + 0.4) { x.arms = [['L', lerp(0, 0.5, k), lerp(0, -2.55, k)]]; x.phone = k > 0.4; }
      x.face = 'determined'; return x;
    }
    case 'ask': { x = st(LEO_PHONE, 2.7, 'talking'); x.arms = [['L', 0.5, -2.55]]; x.phone = true; x.layers = [['talk', s, 1, true]]; x.face = s > W.how ? 'confused' : 'talking'; return x; }
    case 'sprig': {                                                // lowers the strand into the tin, then waits, hoping
      x = st(LEO_TIN, -R90, 'determined'); const k = smooth(inv(W.sprig - 0.2, W.tomato, s));
      x.arms = [['R', 0.0, lerp(-2.4, -1.8, k)]]; x.strand = true; x.face = s > W.hope - 0.1 ? 'nervous' : 'determined';
      if (s > W.best) x.look = [0.5, 0];
      return x;
    }
  }
  return x;
}
function noobAt(s) {
  let x = st(V(0, -50, 0), 0, 'surprised'); x.visible = false;
  switch (SHOT) {
    case 'watch': { x = sitIn(st(NOOB_CHAIR, Math.PI - 0.12, 'surprised')); x.face = 'surprised'; return x; }
    case 'tin': { x = st(HM(-8.6, 0, -4.4), 0.55, 'surprised'); x.arms = [['R', -0.05, -1.25]]; x.tin = true; x.look = [0, 0.25]; x.face = s > W.tin1 - 0.2 ? 'happy' : 'surprised'; return x; }
    case 'calls': case 'ask': { x = sitIn(st(NOOB_CHAIR, Math.PI - 0.6, 'surprised')); x.look = [-0.5, 0]; return x; }
    case 'sprig': { x = st(NOOB_TIN, -1.6, 'surprised'); x.look = [0.2, 0.25]; if (s > W.hope) x.face = 'happy'; return x; }
  }
  return x;
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
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11 + a.name.length), 0.1);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const palm = (a, sd) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return (sd === 'R' ? PALM_R : PALM_L).clone().applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };

// ---------- lighting ----------
const MODES = {
  sun: { sun: 2.6, sunC: '#fff2dc', hemi: 0.85, env: 0.55, fill: 0.6, rim: 1.0, z: '#4f8fe6', h: '#d7ecff', fog: '#cfe3f5', near: 250, far: 1300 },
  studio: { sun: 0, sunC: '#ffffff', hemi: 0.55, env: 0.4, fill: 0.5, rim: 0.7, z: '#2a2d33', h: '#3a3d44', fog: '#2a2d33', near: 300, far: 1000, key: 160 },
  home: { sun: 0, sunC: '#ffffff', hemi: 0.75, env: 0.45, fill: 0.55, rim: 0.5, z: '#e6d6b0', h: '#efe8d8', fog: '#e6d6b0', near: 300, far: 1000 },
};
const MODE_OF = { orchard: 'sun', studio: 'studio', home: 'home' };
function light(stage, mode) {
  const L = MODES[mode], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi; sc.environmentIntensity = L.env;
  stage.fill.intensity = L.fill; stage.rim.intensity = L.rim;
  u.zenith.value.set(L.z); u.horizon.value.set(L.h);
  sc.fog.color.set(L.fog); sc.fog.near = L.near; sc.fog.far = L.far;
  S.studio.key.intensity = L.key || 0;
}
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); stage.skyMesh.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) g.visible = k === place0;
  light(stage, MODE_OF[place0]);

  const mx = maxAt(s), ma = miaAt(s), sk = skyeAt(s), lo = leoAt(s), nb = noobAt(s);
  place(max, mx); place(mia, ma); place(skye, sk); place(leo, lo); place(noob, nb);
  // props
  P.hank.visible = !!ma.hank && mia.root.visible; if (P.hank.visible) { P.hank.position.copy(palm(mia, 'R')); P.hank.rotation.set(0.05 * Math.sin(s * 3), 0, 0.06 * Math.sin(s * 2.4)); }
  P.basket.visible = !!sk.basket && skye.root.visible;
  if (P.basket.visible) { P.basket.position.copy(palm(skye, 'R')).add(V(0, -1.9, 0)); P.basket.rotation.set(0, skye.root.rotation.y, 0); }
  S.orchard.basket.visible = !(P.basket.visible);
  P.strand.visible = !!lo.strand && leo.root.visible; if (P.strand.visible) { P.strand.position.copy(palm(leo, 'R')); P.strand.rotation.set(0, 0, 0); }
  P.tin.visible = !!nb.tin && noob.root.visible; if (P.tin.visible) { P.tin.position.copy(palm(noob, 'R')).add(V(0, -0.6, 0)); P.tin.rotation.set(0, noob.root.rotation.y, 0); }
  P.hsLeo.visible = !!lo.phone && leo.root.visible; P.hsMax.visible = !!mx.phone && max.root.visible;
  S.home.phone.userData.handset.visible = !P.hsLeo.visible; S.studio.phone.userData.handset.visible = !P.hsMax.visible;
  P.handDrape.visible = SHOT === 'dry' && skye.root.visible;
  if (P.handDrape.visible) { P.handDrape.position.copy(palm(skye, 'L').lerp(palm(skye, 'R'), 0.5)); }
  // the drying rail fills up through the shot (and stays full after)
  const nDrape = SHOT === 'dry' ? Math.floor(4 + 14 * inv(T.dry + 1.0, T.weevil - 0.2, s)) : ['weevil', 'length', 'hoax', 'cta', 'swiss'].includes(SHOT) ? 18 : 6;
  S.orchard.drape.forEach((b, i) => { b.visible = i < nDrape; b.rotation.z = 0.04 * Math.sin(s * 1.5 + i); });
  if (place0 === 'orchard') S.orchard.trees.forEach((tr, i) => K.swayTree(tr, s + i * 0.7, 1));
  S.orchard.ladder.visible = SHOT !== 'weevil';                  // its rail would sit right in front of the close-up
  // the weevil: climbs a bunch on the hero tree, then scuttles off when it's "wiped out"
  P.weevil.visible = SHOT === 'weevil';
  if (P.weevil.visible) {
    const b = S.wb; b.updateMatrixWorld(true);
    const top = b.getWorldPosition(V()), k = s - T.weevil, y = top.y - 2.0 + Math.min(1.2, k * 0.6);
    const off = smooth(inv(W.wiped, W.wiped + 0.5, s));                // "wiped out": it faints, flips over and slides down
    P.weevil.position.set(top.x + 0.25, y - off * 0.9, top.z + 0.35); P.weevil.rotation.set(-R90, 0, off * Math.PI * 0.9);
    P.weevil.scale.setScalar(0.9);
  }
  // living room: the sprig goes into the tin; studio: the calendar flips
  S.home.sprig.visible = false;
  const page = S.studio.cal.userData.page; page.material.map = SHOT === 'calendar' && s > W.april1 - 0.15 ? page.userData.tex.apr : SHOT === 'fool' ? page.userData.tex.apr : page.userData.tex.mar;
  if (SHOT === 'calendar') page.rotation.x = -0.25 - (s > W.april1 - 0.35 && s < W.april1 - 0.15 ? 1.2 * Math.sin(inv(W.april1 - 0.35, W.april1 - 0.15, s) * Math.PI) : 0);

  // ---------- cameras ----------
  switch (SHOT) {
    case 'hook': look(stage, OR(lerp(5.6, 5.0, u), lerp(4.6, 4.9, u), lerp(17.5, 16.5, u)), OR(0.5, 5.2, 5.6), 50, 18); break;
    case 'watch': look(stage, HM(0, 4.6, lerp(-4.9, -4.4, u)), HM(0, 3.5, 4.3), 60, 14); break;
    case 'studio': look(stage, SD(0.8, 5.0, lerp(7.0, 5.8, u)), SD(0, 4.8, -5.0), 42, 14); break;
    case 'swiss': { const k = easeOut(u); look(stage, OR(-8, lerp(36, 30, k), lerp(64, 56, k)), OR(-2, 0, -2), 50, 60); break; }
    case 'dry': look(stage, OR(lerp(7.4, 7.8, u), 4.8, lerp(23.5, 22.5, u)), OR(12.6, 4.3, 10.6), 50, 20); break;
    case 'weevil': { const b = S.wb.getWorldPosition(V()); look(stage, b.clone().add(V(1.4, -1.0, 6.4)), b.clone().add(V(0.3, -1.7, 0)), 42, 8); break; }
    case 'length': look(stage, OR(-3.4, 4.8, 22.5), OR(-7.0, 4.3, 10.6), 48, 18); break;
    case 'tin': look(stage, HM(-5.4, 5.2, 3.6), HM(-9.0, 4.6, -5.0), 52, 12); break;
    case 'calls': look(stage, HM(lerp(-1.2, -1.6, u), 5.0, lerp(-4.4, -3.8, u)), HM(-3.4, 4.2, 2.6), 54, 14); break;
    case 'ask': look(stage, HM(-2.4, 5.0, -3.0), HM(-4.2, 4.6, 2.0), 46, 12); break;
    case 'answer': look(stage, SD(-1.2, 5.0, 2.6), SD(0, 4.8, -5.6), 46, 12); break;
    case 'sprig': look(stage, HM(lerp(4.6, 5.2, u), 4.6, lerp(10.5, 9.8, u)), HM(9.6, 3.0, 3.0), 50, 12); break;
    case 'calendar': { const c = S.studio.cal.getWorldPosition(V()); look(stage, c.clone().add(V(1.3, 1.5, 3.4)), c.clone().add(V(0, 0.75, 0)), 40, 6); break; }
    case 'fool': look(stage, SD(lerp(1.2, 0.6, u), 5.0, lerp(7.5, 6.6, u)), SD(0, 4.8, -5.4), 44, 14); break;
    case 'hoax': case 'cta': look(stage, OR(lerp(0.8, 0.4, u), 5.0, lerp(18.5, 17.5, u)), OR(0, 4.8, 6.5), 50, 18); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  const cam = stage.camera; head2D = {};
  for (const [k, a] of Object.entries({ max, leo, mia, skye, noob })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
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
// the hook's "you are watching TV" frame: dark rounded-corner bezel and faint scanlines
function tvFrame(g, s, k) {
  if (k <= 0) return;
  g.save(); g.globalAlpha = k;
  g.fillStyle = 'rgba(40,26,14,0.92)'; g.beginPath(); g.rect(0, 0, 1080 * s, 1920 * s);
  const [x0, y0, w0, h0, r0] = [46 * s, 330 * s, 988 * s, 1380 * s, 120 * s];
  g.moveTo(x0 + r0, y0); g.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, r0); g.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, r0); g.arcTo(x0, y0 + h0, x0, y0, r0); g.arcTo(x0, y0, x0 + w0, y0, r0); g.closePath();
  g.fill('evenodd');
  g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2 * s; for (let y = 330; y < 1710; y += 8) { g.beginPath(); g.moveTo(46 * s, y * s); g.lineTo(1034 * s, y * s); g.stroke(); }
  g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'hook') { tvFrame(g, s, 1); pill(g, s, 'ON THE NEWS', 540, 420, 1, '#ffffff', 'rgba(14,18,34,.85)', 46); if (t > W.tree1 - 0.15) bigText(g, s, 'OFF A TREE?!', 540, 560, 110, '#ffd23f', pop(t, W.tree1 - 0.15), -0.04); }
  if (SHOT === 'watch') {
    const n = Math.round(lerp(0, 8000000, smooth(inv(T.watch + 0.1, W.watching, t))));
    pill(g, s, `${n.toLocaleString('en-GB')} WATCHING`, 540, 420, pop(t, T.watch + 0.05, 0.2, 1.8), '#ffd23f', 'rgba(14,18,34,.85)', 52);
  }
  if (SHOT === 'studio') { pill(g, s, 'BRITAIN · 1957', 540, 300, pop(t, T.studio + 0.05, 0.2, 1.8), '#ffffff', 'rgba(14,18,34,.85)', 44); if (t > W.serious1 - 0.15) { bigText(g, s, "BRITAIN'S MOST", 540, 440, 84, '#ffffff', pop(t, W.serious1 - 0.15), -0.03); bigText(g, s, 'SERIOUS NEWS SHOW', 540, 540, 80, '#ffd23f', pop(t, W.show1 - 0.15), -0.03); } }
  if (SHOT === 'swiss') {
    pill(g, s, 'SWITZERLAND', 540, 420, pop(t, W.switzerland - 0.1, 0.2, 1.8), '#ff6b6b', 'rgba(14,18,34,.85)', 54);
    if (t > W.mild - 0.1) bigText(g, s, 'MILD WINTER', 540, 570, 96, '#ffffff', pop(t, W.mild - 0.1) * out(t, W.bumper - 0.05, 0.12), -0.03);
    if (t > W.bumper - 0.1) bigText(g, s, 'BUMPER HARVEST!', 540, 570, 104, '#ffd23f', pop(t, W.bumper - 0.1), -0.03);
  }
  if (SHOT === 'dry' && t > W.sun - 0.15) pill(g, s, 'DRYING IN THE SUN', 540, 420, pop(t, W.sun - 0.15), '#ffd23f', 'rgba(14,18,34,.85)', 52);
  if (SHOT === 'weevil') {
    pill(g, s, 'THE SPAGHETTI WEEVIL', 540, 420, pop(t, W.weevil - 0.15), '#ff6b6b', 'rgba(14,18,34,.85)', 50);
    if (t > W.wiped - 0.1) stamp(g, s, 'ALMOST GONE', 540, 760, clamp((t - W.wiped + 0.1) / 0.18), '#e0262b', -0.1, 80);
  }
  if (SHOT === 'length') {
    if (t > W.same - 0.15) bigText(g, s, 'ALL THE SAME LENGTH?', 540, 420, 78, '#ffffff', pop(t, W.same - 0.15), -0.03);
    if (t > W.careful - 0.15) bigText(g, s, 'CAREFUL BREEDING', 540, 540, 96, '#ffd23f', pop(t, W.careful - 0.15), -0.03);
  }
  if (SHOT === 'tin') {
    if (t > W.rare - 0.15) pill(g, s, 'SPAGHETTI IN BRITAIN: RARE', 540, 420, pop(t, W.rare - 0.15), '#ffd23f', 'rgba(14,18,34,.85)', 48);
    if (t > W.tin1 - 0.15) bigText(g, s, 'ONLY IN A TIN', 540, 1060, 100, '#ffffff', pop(t, W.tin1 - 0.15), -0.03);
  }
  if (SHOT === 'calls') {
    const n = Math.round(lerp(1, 300, easeIn(inv(T.calls + 0.3, T.ask - 0.1, t))));
    pill(g, s, n >= 300 ? 'CALLS: HUNDREDS!' : `CALLS: ${n}`, 540, 420, pop(t, T.calls + 0.1, 0.2, 1.8), '#ff6b6b', 'rgba(14,18,34,.85)', 54);
  }
  if (SHOT === 'ask' && head2D.leo) {
    const b2 = t > W.how - 0.15;
    bubble(g, s, b2 ? ['HOW DO I GROW', 'MY OWN', 'SPAGHETTI TREE?'] : ['IS IT REAL?'], clamp(head2D.leo[0] + 60, 200, 880), Math.min(head2D.leo[1] - 100, 820), pop(t, b2 ? W.how - 0.15 : T.ask + 0.05, 0.2, 2), 56);
  }
  if (SHOT === 'answer') pill(g, s, 'THE ANSWER:', 540, 420, pop(t, T.answer + 0.05, 0.2, 1.8), '#ffd23f', 'rgba(14,18,34,.85)', 56);
  if (SHOT === 'sprig') {
    bubble(g, s, ['PLACE A SPRIG', 'OF SPAGHETTI IN A TIN', 'OF TOMATO SAUCE...'], 330, 900, pop(t, T.sprig + 0.05, 0.2, 2) * out(t, W.hope - 0.1, 0.12), 54);
    if (t > W.hope - 0.15) bigText(g, s, '...AND HOPE', 540, 470, 104, '#ffffff', pop(t, W.hope - 0.15), -0.03), bigText(g, s, 'FOR THE BEST', 540, 590, 104, '#ffd23f', pop(t, W.best - 0.15), -0.03);
  }
  if (SHOT === 'calendar') pill(g, s, 'THE DATE OF THE SHOW?', 540, 300, pop(t, T.calendar + 0.05, 0.2, 1.8), '#ffffff', 'rgba(14,18,34,.85)', 48);
  if (SHOT === 'fool' && t > W.fools - 0.15) stamp(g, s, 'APRIL FOOL!', 540, 470, clamp((t - W.fools + 0.15) / 0.18), '#e0262b', -0.1, 120);
  if (SHOT === 'hoax') { bigText(g, s, 'THE BIGGEST HOAX', 540, 400, 88, '#ffffff', pop(t, W.biggest - 0.1), -0.03); bigText(g, s, 'A SERIOUS NEWS SHOW', 540, 510, 74, '#ffd23f', pop(t, W.hoax), -0.03); bigText(g, s, 'EVER PULLED', 540, 610, 88, '#ffd23f', pop(t, W.pulled - 0.1), -0.03); }
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
