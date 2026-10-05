// The Backwards Umbrella. Web renderer + Roblox R6 pack. When Leo's umbrella is open it rains everywhere except under
// it. It soaks his friends, sharing only fits three (the Noob gets a private thunderstorm), so he keeps it shut - until
// Max's barbecue goes up like a volcano and the rain saves the park. Mia ducks under: "Room for one more?"
// Beats: web/beats.js (source/beats.py). Park, barbecue, umbrella and weather: web/kit.js.
// Weather is a pure function of time (storm(t)); wetness is integrated from it in fixed steps, so any frame renders alone.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { loadCreature } from '../../../web/lib/creature.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import { park, barbecue, umbrella, rain, cloud, bolt, particles, wettable, wetMaterials, LAWN, TABLE, GRILL, CASTLE, UMB_R } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 1.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Backwards Umbrella' };
export const sky = { zenith: '#4f8fe6', horizon: '#d7ecff', below: '#f0f6ff', fog: '#e8f2ff', sunDir: new THREE.Vector3(0.35, 0.75, 0.45) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VA = (p) => (Array.isArray(p) ? V(p[0], p[1] || 0, p[2]) : p.clone());
const headTo = (a, b) => Math.atan2(VA(b).x - VA(a).x, VA(b).z - VA(a).z);
const angLerp = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;

// ---------- key times (all on the narration) ----------
const T = {
  sunny: W.sky - 0.12, open1: W.opens1 + 0.05, close1: W.closes + 0.12, open1b: W.sharing + 0.12, close2: W.after - 0.12,
  walkIn: W.sharing + 0.35, noobIn: W.noob1 - 0.35, bump: W.fit + 0.05, cloud: W.noob2 - 0.1, zap: W.thunderstorm + 0.15,
  flip: W.flips - 0.05, boom: W.volcano - 0.05, toTable: W.table - 0.15, toNapkins: W.napkins - 0.1, toCastle: W.bouncy - 0.1,
  panic: W.screams - 0.15, open2: W.opens2 + 0.1, hiss: W.hisses - 0.15, out: W.gone + 0.1, cheer: W.thirty - 0.1,
  duck: W.ducks - 0.3, room: W.room - 0.05, move: W.moves, cta: W.follow - 0.15,
};
// When the umbrella is open (and so when it rains): [opens, closes].
const OPEN = [[-9, T.sunny], [T.open1, T.close1], [T.open1b, T.close2], [T.open2, 999]];
const openK = (t) => OPEN.reduce((k, [a, b]) => Math.max(k, (a < 0 ? 1 : easeOutBack(clamp((t - a) / 0.28), 1.4)) * (1 - smooth(inv(b, b + 0.22, t)))), 0);
const storm = (t) => OPEN.reduce((k, [a, b]) => Math.max(k, (a < 0 ? 1 : smooth(inv(a + 0.05, a + 0.55, t))) * (1 - smooth(inv(b + 0.05, b + 0.45, t)))), 0);

// ---------- places ----------
const L0 = LAWN.clone();                                              // the lawn: Leo opens it here
const MAX0 = L0.clone().add(V(3.5, 0, 0.9)), MIA0 = L0.clone().add(V(-3.5, 0, 0.9)), NOOB0 = L0.clone().add(V(6.8, 0, -1.6));
const MAX_UNDER = L0.clone().add(V(2.2, 0, -1.1)), MIA_UNDER = L0.clone().add(V(-3.2, 0, 0.2));   // squeezed in: Mia beside his umbrella arm, Max a half step behind (no arms through each other)
const NOOB_TRY = L0.clone().add(V(4.3, 0, 0.45)), NOOB_OUT = L0.clone().add(V(5.6, 0, 1.2));
const DOG0 = L0.clone().add(V(-7.5, 0, 3.5));
const WALK0 = L0.clone().add(V(-6, 0, 3)), WALK1 = L0.clone().add(V(10, 0, 3));   // "keeps it closed": strolls past them
const LEO_B = V(6.5, 0, 8.5);                                         // at the barbecue
const MAX_GRILL = GRILL.clone().add(V(2.0, 0, 0.2)), MIA_B = V(2.2, 0, 4.4), NOOB_B = CASTLE.clone().add(V(0.6, 0, 1.2));
const ringAt = (a, r) => LEO_B.clone().add(V(Math.sin(a) * r, 0, Math.cos(a) * r));
const MAX_R = ringAt(2.0, 5.2), MIA_R = ringAt(-1.75, 5.0), NOOB_R = ringAt(2.6, 7.4);
const MIA_UNDER2 = LEO_B.clone().add(V(-3.2, 0, 0.1)), LEO_MOVED = LEO_B.clone().add(V(0.6, 0, 0));   // beside his umbrella arm, clear of it

// ---------- scene ----------
let A = {}, leo, max, mia, noob, skye, extras = [], dog, P, B, U, R, R2, FIRE, STEAM, SPRAY, nCloud, nBolt, ceiling, spatula, cam, SHOT = 'hook', WETF = new Map(), setWorldWet;
const FACES = ['neutral', 'happy', 'laugh', 'smug', 'cool', 'shocked', 'scared', 'surprised', 'nervous', 'determined', 'sad', 'love', 'annoyed', 'angry'];
const SHIRTS = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#ff006e', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607', '#118ab2'];
const PANTS = ['#264653', '#1d3557', '#495057', '#5c4033', '#2b2d42'];
const SKINS = ['#f2c9a0', '#c68642', '#8d5524', '#ffd23f', '#e0ac69', '#f1c27d'];
export async function setup(stage) {
  const { scene } = stage;
  [leo, max, mia, noob, skye] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob', 'Skye'].map((n) => loadRobloxCharacter(n, { expressions: FACES, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root, skye.root);
  for (let i = 0; i < 12; i++) {                                     // the barbecue crowd: players in their own colours
    const e = await loadRobloxCharacter('Noob', { expressions: ['happy', 'laugh', 'scared', 'shocked', 'surprised', 'neutral'] });
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      const c = o.name === 'Torso' ? SHIRTS[i % 10] : /Leg/.test(o.name) ? PANTS[i % 5] : SKINS[(i * 7) % 6];
      o.material = o.material.clone(); o.material.map = null; o.material.color.set(c); o.material.needsUpdate = true;
    });
    scene.add(e.root); extras.push(e);
  }
  for (const n of ['idle', 'run', 'walk', 'shock', 'proud', 'laugh_big', 'shrug', 'jump']) A[n] = await loadAnimation(n);
  dog = await loadCreature('animal_golden_retriver'); scene.add(dog.root);
  P = park(scene); B = barbecue(scene); U = umbrella(); scene.add(U.root);
  R = rain(scene); R2 = rain(scene, { N: 260, R: 1.3, H: 7.5, splashes: 40 });
  FIRE = particles(scene, { kind: 'fire', N: 520 }); STEAM = particles(scene, { kind: 'steam', N: 260 }); SPRAY = particles(scene, { kind: 'steam', N: 60 });
  nCloud = cloud(1.3, 4, '#3d424d'); scene.add(nCloud.group); nBolt = bolt(5); scene.add(nBolt);
  const ct = (await import('../../../web/lib/world.js')).canvasTexture(512, 512, (x, w, h) => { x.fillStyle = '#5a6170'; x.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const r = 20 + Math.random() * 70; const g = x.createRadialGradient(0, 0, 0, 0, 0, r); x.save(); x.translate(Math.random() * w, Math.random() * h); g.addColorStop(0, 'rgba(40,44,54,.55)'); g.addColorStop(1, 'rgba(40,44,54,0)'); x.fillStyle = g; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); } });
  ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(4, 4);
  ceiling = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0, fog: false, depthWrite: false, side: THREE.DoubleSide }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 46; scene.add(ceiling);
  spatula = new THREE.Group();
  spatula.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: '#333' })));
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.55), new THREE.MeshStandardMaterial({ color: '#c0c6cc', metalness: 0.7, roughness: 0.3 })); blade.position.z = 0.8; spatula.add(blade); scene.add(spatula);
  for (const a of [max, mia, noob, skye, ...extras]) WETF.set(a, wettable(a.root));
  WETF.set(dog, wettable(dog.root));
  setWorldWet = wetMaterials([...P.wet, ...B.wet]);
  for (const a of [leo, max, mia, noob, skye, ...extras]) a.hair = a.root.getObjectByName('Hair');
}

// ---------- the cast ----------
const base = (pos, heading, face) => ({ pos: VA(pos), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function along(from, to, t0, s, speed) {
  const a = VA(from), b = VA(to), d = a.distanceTo(b), u = clamp((s - t0) * speed / Math.max(d, 1e-3));
  return { pos: a.clone().lerp(b, u), moving: u > 0 && u < 1, done: u >= 1, heading: Math.atan2(b.x - a.x, b.z - a.z), anim: (u * d) / STRIDE };
}
const walkTo = (x, from, to, t0, s, speed, endHeading, anim = 'walk') => {
  const m = along(from, to, t0, s, speed); x.pos = m.pos;
  if (m.moving) { x.heading = m.heading; x.layers = [[anim, m.anim]]; }
  else if (m.done) { x.heading = endHeading; x.layers = [['idle', s]]; }
  return m;
};
const UMB_ARM = ['R', 0.12, -2.55];                                   // the umbrella arm, raised up-forward

function leoAt(s) {
  if (s < T.close2 + 0.2) {                                           // the lawn
    const x = base(L0, 0, 'smug'); x.umb = 'hold';
    if (s >= T.sunny) x.face = 'happy';
    if (s >= T.open1) x.face = 'smug';
    if (s >= T.close1) x.face = 'nervous';
    if (s >= T.open1b) { x.face = 'happy'; if (s < W.squeeze + 0.2) x.arms2 = [['L', 0.25, -1.1 - 0.35 * Math.sin(s * 9)]]; }   // come on in
    if (s >= T.bump) x.face = 'nervous';
    if (s >= T.zap) x.face = 'shocked';
    return x;
  }
  if (s < W.then - 0.15) {                                            // keeps it closed: strolls past, umbrella hanging
    const x = base(WALK0, Math.PI / 2, 'cool'); x.umb = 'carry';
    walkTo(x, WALK0, WALK1, W.after - 0.2, s, 7, Math.PI / 2);
    return x;
  }
  const x = base(LEO_B, Math.PI + 0.5, 'happy'); x.umb = 'carry';    // the barbecue
  if (s >= T.boom) x.face = 'shocked';
  if (s >= T.panic) { x.face = 'scared'; x.heading = Math.PI + 0.9; }
  if (s >= T.open2 - 0.35) { x.umb = 'hold'; x.face = 'determined'; x.heading = angLerp(Math.PI + 0.9, 0, smooth(inv(T.open2 - 0.35, T.open2, s))); }
  if (s >= T.cheer) x.face = 'smug';
  if (s >= T.duck) { x.face = 'happy'; x.yaw = -0.5 * smooth(inv(T.duck, T.duck + 0.5, s)); }
  if (s >= T.move) { const m = walkTo(x, LEO_B, LEO_MOVED, T.move, s, 3, 0); if (m.moving) x.layers = [['walk', m.anim]]; x.yaw = -0.45; x.face = 'love'; }
  if (s >= W.everyone4) { x.face = 'happy'; x.yaw = -0.3; }
  return x;
}
function maxAt(s) {
  if (s < T.close2 + 0.2) {
    const x = base(MAX0, -0.35, 'annoyed'); x.wet0 = 1;
    if (s >= T.sunny && s < T.open1 + 0.4) x.face = 'neutral';
    if (s >= W.max1 - 0.3 && s < T.close1) { x.heading = angLerp(-0.35, headTo(MAX0, L0), 0.55 * smooth(inv(W.max1 - 0.3, W.max1 + 0.1, s))); x.face = 'angry'; }
    if (s >= T.close1) x.face = 'annoyed';
    if (s >= T.walkIn) { walkTo(x, MAX0, MAX_UNDER, T.walkIn, s, 6, 0); x.face = s >= W.dry2 ? 'happy' : 'annoyed'; }
    if (s >= T.zap) x.face = 'shocked';
    return x;
  }
  if (s < W.then - 0.15) { const x = base(MAX0, headTo(MAX0, WALK1), 'annoyed'); return x; }
  const x = base(MAX_GRILL, -Math.PI / 2, 'happy');
  if (s >= T.flip - 0.3) { const k = s - T.flip; x.arms = [['R', 0.1, k < 0 ? -0.9 : lerp(-0.9, -1.7, smooth(clamp(k / 0.15))) + 0.8 * smooth(clamp((k - 0.15) / 0.3))]]; x.spatula = true; }
  else x.spatula = true, x.arms = [['R', 0.1, -0.9]];
  if (s >= T.boom) {                                                  // FWOOMP: hops back from the flame column
    const k = clamp((s - T.boom) / 0.45); x.pos = MAX_GRILL.clone().add(V(2.2 * easeOut(k), 0, 0)); x.y = 1.3 * Math.sin(Math.PI * k); x.layers = [['shock', s - T.boom, 1, false]]; x.face = 'shocked'; x.arms = []; x.spatula = false;
  }
  if (s >= T.panic + 0.1) { const from = MAX_GRILL.clone().add(V(2.2, 0, 0)); x.y = undefined; walkTo(x, from, MAX_R, T.panic + 0.1, s, 16, headTo(MAX_R, LEO_B), 'run'); x.face = 'scared'; }
  if (s >= T.open2 + 0.3) x.face = 'surprised';
  if (s >= T.cheer) { x.layers = [['laugh_big', s - T.cheer]]; x.face = 'laugh'; x.heading = headTo(MAX_R, LEO_B); }
  if (s >= T.duck + 0.4) { x.layers = [['idle', s]]; x.face = 'annoyed'; }
  return x;
}
function miaAt(s) {
  if (s < T.close2 + 0.2) {
    const x = base(MIA0, 0.35, 'annoyed'); x.wet0 = 1;
    if (s >= T.sunny && s < T.open1 + 0.4) x.face = 'neutral';
    if (s >= W.mia1 - 0.3 && s < T.close1) { x.heading = angLerp(0.35, headTo(MIA0, L0), 0.55 * smooth(inv(W.mia1 - 0.3, W.mia1 + 0.1, s))); x.face = 'annoyed'; }
    if (s >= T.walkIn + 0.1) { walkTo(x, MIA0, MIA_UNDER, T.walkIn + 0.1, s, 6, 0); x.face = s >= W.dry2 ? 'happy' : 'annoyed'; }
    if (s >= T.zap) x.face = 'shocked';
    return x;
  }
  if (s < W.then - 0.15) return base(MIA0, headTo(MIA0, WALK1), 'annoyed');
  const x = base(MIA_B, Math.PI - 0.5, 'happy');
  if (s >= T.boom) x.face = 'shocked';
  if (s >= T.panic + 0.25) { walkTo(x, MIA_B, MIA_R, T.panic + 0.25, s, 16, headTo(MIA_R, LEO_B), 'run'); x.face = 'scared'; }
  if (s >= T.open2 + 0.3) x.face = 'surprised';
  if (s >= T.cheer) { x.layers = [['proud', s - T.cheer, 1, false]]; x.face = 'happy'; }
  if (s >= T.duck) {                                                  // ducks under the umbrella, beside him
    const m = walkTo(x, MIA_R, MIA_UNDER2, T.duck, s, 7, 0); x.face = 'happy';
    if (m.moving) x.lean = 0.35 * Math.sin(Math.PI * clamp((s - T.duck) * 7 / MIA_R.distanceTo(MIA_UNDER2)));
    if (m.done) { x.yaw = 0.45; x.face = s >= T.move + 0.3 ? 'love' : 'happy'; }
  }
  return x;
}
function noobAt(s) {
  if (s < T.close2 + 0.2) {
    const x = base(NOOB0, -0.6, 'sad'); x.wet0 = 1;
    if (s >= T.sunny && s < T.noobIn) x.face = 'neutral';
    if (s >= T.noobIn) {                                              // tries to squeeze in beside Max: no room, bounced out
      const m = walkTo(x, NOOB0, NOOB_TRY, T.noobIn, s, 8, -Math.PI / 2 + 0.3); x.face = 'happy';
      if (s >= T.bump) { const k = clamp((s - T.bump) / 0.35); x.pos = NOOB_TRY.clone().lerp(NOOB_OUT, easeOut(k)); x.y = 0.6 * Math.sin(Math.PI * k); x.layers = [['idle', s]]; x.heading = -0.5; x.face = 'sad'; }
      if (s >= T.zap) { x.layers = [['shock', s - T.zap, 1, false]]; x.face = 'shocked'; x.y = 0.5 * Math.max(0, Math.sin(Math.PI * clamp((s - T.zap) / 0.3))); }
    }
    return x;
  }
  if (s < W.then - 0.15) return base(NOOB_OUT, headTo(NOOB_OUT, WALK1), 'sad');
  const x = base(NOOB_B, 0.4, 'happy');                              // bouncing in the castle
  const bounce = Math.abs(Math.sin((s - W.then) * 4.2));
  x.y = 1.2 + 1.6 * bounce; x.layers = [['jump', 0.3]];
  if (s >= T.toCastle + 0.3) {                                        // the castle catches: out and running
    const k = clamp((s - T.toCastle - 0.3) / 0.4); x.y = lerp(x.y, 0, k);
    if (k >= 1) { walkTo(x, NOOB_B, NOOB_R, T.toCastle + 0.7, s, 16, headTo(NOOB_R, LEO_B), 'run'); x.y = undefined; }
    x.face = 'scared';
  }
  if (s >= T.open2 + 0.3) x.face = 'surprised';
  if (s >= T.cheer) { x.layers = [['laugh_big', s - T.cheer + 0.4]]; x.face = 'laugh'; }
  return x;
}
// The crowd: spots round the table and the castle, running to a ring round Leo when the fire spreads.
const CROWD = Array.from({ length: 13 }, (_, i) => {
  const spots = [[-2.8, 4.2, Math.PI], [0.2, 4.6, Math.PI], [-1.5, -4.4, 0], [1.8, -4.3, 0], [4.8, 2.6, -1.9], [-4.4, -3.6, 0.3], [-12.5, -2.0, 1.4],
    [6.5, -3.2, -2.4], [13.2, -4.0, -1.0], [3.2, -8.5, 0.6], [11.5, -2.2, -2.2], [-6.5, -2.5, 1.2], [7.6, 1.2, -0.8]][i];
  const ang = [-2.3, -2.7, 3.0, 2.5, -2.0, 2.2, -1.6, 1.8, 2.9, -2.95, 1.45, -1.3, 2.75][i], r = 5.4 + (i % 4) * 1.15;
  return { p0: V(spots[0], 0, spots[1]), h0: spots[2], ring: ringAt(ang, r), delay: (i * 0.13) % 0.45, cheer: i % 3 };
});
function crowdAt(i, s) {
  const c = CROWD[i], x = base(c.p0, c.h0, 'happy'); x.visible = s >= W.then - 0.2;
  if (!x.visible) return x;
  x.layers = [['idle', s + i]];
  if (s >= T.boom) { x.face = 'shocked'; x.heading = angLerp(c.h0, headTo(c.p0, GRILL), smooth(inv(T.boom, T.boom + 0.4, s))); }
  if (s >= T.panic + c.delay) { walkTo(x, c.p0, c.ring, T.panic + c.delay, s, 15, headTo(c.ring, LEO_B), 'run'); x.face = 'scared'; }
  if (s >= T.open2 + 0.3) x.face = 'surprised';
  if (s >= T.cheer + c.delay * 0.5) { const k = s - T.cheer; x.layers = [[c.cheer === 2 ? 'proud' : 'laugh_big', k + i * 0.2, 1, c.cheer !== 2]]; x.face = c.cheer ? 'laugh' : 'happy'; if (c.cheer === 1) x.wave = true; }
  return x;
}

// ---------- wetness: integrated from the weather in fixed steps (exposed + raining -> soaks; sun or cover -> dries) ----------
const umbCentre = (s) => { const x = leoAt(s), h = x.heading; return VA(x.pos).add(V(Math.sin(h) * 0.75 - Math.cos(h) * 1.0, 0, Math.cos(h) * 0.75 + Math.sin(h) * 1.0)); };   // over his right hand
const wetCache = new Map();
function wetness(key, posAt, w0, s) {
  const k = key + '@' + s.toFixed(3); if (wetCache.has(k)) return wetCache.get(k);
  let w = w0; const dt = 0.1;
  for (let t = 0; t < s; t += dt) {
    const st = storm(t), p = posAt(t);
    const under = openK(t) > 0.5 && p.distanceTo(umbCentre(t)) < UMB_R * 1.25 && (p.y ?? 0) < 4;
    if (st > 0.5 && !under) w = Math.min(1, w + dt / 0.7); else w = Math.max(0, w - dt / (under ? 0.9 : 2.2));
  }
  wetCache.set(k, w); if (wetCache.size > 4000) wetCache.clear(); return w;
}
const posOf = (fn) => (t) => VA(fn(t).pos);

// ---------- posing ----------
const EUL = new THREE.Euler();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
const HAND = { L: V(0.5, -1.5, 0.15), R: V(-0.5, -1.5, 0.15) };
const handP = (a, side = 'R') => a.bones['Arm.' + side].localToWorld(HAND[side].clone());
function place(a, x, wet = 0) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  const p = VA(x.pos);
  a.root.position.copy(p); a.root.rotation.set(0, x.heading, 0); a.root.scale.setScalar(1);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [side, up, fwd] of [...x.arms, ...(x.arms2 || [])]) setArm(a, side, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(x.waveT ?? 0), 0.1);
  if (x.yaw) a.bones.Head.rotateY(x.yaw);
  if (x.lean) a.root.rotateX(x.lean);
  a.root.updateMatrixWorld(true);
  if (x.y !== undefined) a.root.position.y = p.y + x.y + (a.root.position.y - a.soleHeight()); else a.root.position.y -= a.soleHeight() - p.y;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
  const f = WETF.get(a); if (f) f(wet);
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [W.sky - 0.15, 'sky'], [W.max1 - 0.12, 'max'], [W.mia1 - 0.12, 'mia'], [W.passing - 0.12, 'dog'], [W.closes - 0.15, 'closes'],
  [W.sharing - 0.12, 'share'], [W.noob1 - 0.25, 'noob'], [W.noob2 - 0.12, 'thunder'], [W.after - 0.15, 'after'],
  [W.then - 0.15, 'bbq'], [W.flips - 0.3, 'flip'], [W.flames - 0.15, 'spread'], [W.screams - 0.12, 'screams'], [W.opens2 - 0.15, 'open2'],
  [W.rain - 0.1, 'rain'], [W.thirty - 0.12, 'cheer'], [W.ducks - 0.2, 'duck'], [W.room - 0.15, 'room'], [W.everyone4 - 0.15, 'wide'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
function look(stage, p, tg, fov = 40, ext = 26) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, Math.min(tg.y, 6), tg.z), ext); return tg;
}
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), k * 0.5 * Math.sin(t * 57));
const shake = (t, at, k, dur = 0.4) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples() { return 1; }

// fire: where it burns and how hard (0..1+), by time
const NAPKINS = TABLE.clone().add(V(-3.9, 3.35, 0.1)), TABLE_FIRE = TABLE.clone().add(V(-2.6, 3.3, 0.2));
const CASTLE_FIRE = [V(-3, 1.4, 4.4), V(0, 4.8, 4.4), V(3, 1.4, 4.4), V(4, 7.8, 4)].map((p) => p.applyAxisAngle(V(0, 1, 0), -0.6).add(CASTLE));
const douse = (s) => 1 - smooth(inv(T.hiss, T.out, s));
function fires(s) {
  const e = [], d = douse(s);
  const g = s < T.boom ? 0.25 : s < T.boom + 0.9 ? 1.9 : 1.15;        // coals, the volcano, then a steady blaze
  e.push({ p: GRILL.clone().add(V(0, 3.4, 0)), size: s < T.boom ? 0.6 : s < T.boom + 0.9 ? 1.9 : 1.4, k: g * d, w: s < T.boom ? 0.5 : 1.0, h: s < T.boom ? 0.4 : s < T.boom + 0.9 ? 2.6 : 1.4, n: s < T.boom ? 0.4 : 1.4 });
  const fly = (a, b, at, dur) => { const k = (s - at) / dur; if (k > 0 && k < 1) e.push({ p: a.clone().lerp(b, k).add(V(0, 3.5 * Math.sin(Math.PI * k), 0)), size: 0.6, k: 0.7, w: 0.15, h: 0.25, n: 0.4 }); };
  fly(GRILL.clone().add(V(0, 4, 0)), TABLE_FIRE, T.toTable - 0.35, 0.35);
  if (s >= T.toTable) e.push({ p: TABLE_FIRE, size: 1.5, k: Math.min(1, (s - T.toTable) * 3) * d, w: 1.1, h: 0.9 });
  if (s >= T.toNapkins) e.push({ p: NAPKINS, size: 1.2, k: Math.min(1.2, (s - T.toNapkins) * 4) * d, w: 0.5, h: 1.2 });
  fly(NAPKINS, CASTLE_FIRE[1], T.toCastle - 0.55, 0.55);                  // a burning napkin sails over to the castle
  CASTLE_FIRE.forEach((p, i) => { if (s >= T.toCastle + i * 0.18) e.push({ p, size: 2.2, k: Math.min(1, (s - T.toCastle - i * 0.18) * 2.5) * d, w: 1.6, h: 1.6, n: 1.2 }); });
  return e;
}
function steams(s) {
  const k = Math.sin(Math.PI * clamp((s - T.hiss) / (T.out + 2.2 - T.hiss)));
  if (s < T.hiss || k <= 0) return [];
  return [{ p: GRILL.clone().add(V(0, 3.5, 0)), size: 1.6, k: k * 1.4, w: 0.8, n: 1.3 }, { p: TABLE_FIRE, size: 1.3, k, w: 1.0 }, { p: NAPKINS, size: 1.1, k: k * 0.8, w: 0.5 }, ...CASTLE_FIRE.slice(0, 3).map((p) => ({ p, size: 1.8, k, w: 1.4 }))];
}

export function update(t, stage) {
  const s = t, { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const lawn = s < W.then - 0.15;
  // weather and light
  const st = storm(s), ok = openK(s);
  const uni = stage.skyMesh.material.uniforms;
  uni.zenith.value.set('#4f8fe6').lerp(new THREE.Color('#3b4250'), st); uni.horizon.value.set('#d7ecff').lerp(new THREE.Color('#7e8794'), st);
  stage.scene.fog.color.set('#e8f2ff').lerp(new THREE.Color('#7e8794'), st); stage.scene.fog.near = lerp(90, 30, st); stage.scene.fog.far = lerp(520, 170, st);
  stage.sun.intensity = lerp(3.1, 0.7, st); stage.hemi.intensity = lerp(0.55, 0.75, st); stage.hemi.color.set('#d9ecff').lerp(new THREE.Color('#9aa6b8'), st);
  stage.rim.intensity = lerp(1.1, 0.4, st); stage.scene.environmentIntensity = lerp(0.55, 0.35, st);
  ceiling.material.opacity = 0.95 * st; ceiling.visible = st > 0.01;
  setWorldWet(Math.min(1, st * 1.3));

  // cast
  const lx = leoAt(s); place(leo, lx, 0);
  const mx = maxAt(s), ix = miaAt(s), nx = noobAt(s);
  place(max, mx, wetness('max', posOf(maxAt), 1, s)); place(mia, ix, wetness('mia', posOf(miaAt), 1, s)); place(noob, nx, wetness('noob', posOf(noobAt), 1, s));
  const sx = crowdAt(12, s); place(skye, sx, wetness('skye', posOf((q) => crowdAt(12, q)), 0, s));
  extras.forEach((e, i) => { const x = crowdAt(i, s); x.waveT = s * 11 + i; place(e, x, x.visible ? wetness('ex' + i, posOf((q) => crowdAt(i, q)), 0, s) : 0); });
  // the umbrella: open overhead in his raised right hand, or carried closed at his side
  if (lx.umb === 'hold') {
    setArm(leo, ...UMB_ARM); leo.root.updateMatrixWorld(true);
    const h = handP(leo); U.root.position.copy(h); U.root.rotation.set(0, lx.heading, 0); U.setOpen(ok);
  } else {
    setArm(leo, 'R', 0.08, -0.15); leo.root.updateMatrixWorld(true);
    const h = handP(leo); U.root.position.copy(h); U.root.rotation.set(0, lx.heading, 0); U.root.rotateX(2.75); U.setOpen(0);
  }
  U.root.updateMatrixWorld(true);
  const cc = U.canopy.getWorldPosition(V());
  // spatula in Max's hand, the flipped burger
  spatula.visible = !!mx.spatula && !lawn;
  if (spatula.visible) { max.root.updateMatrixWorld(true); spatula.position.copy(handP(max)); spatula.quaternion.copy(max.bones['Arm.R'].getWorldQuaternion(new THREE.Quaternion())); spatula.rotateX(Math.PI / 2); }
  const b0 = B.burgers[0], fk = clamp((s - T.flip) / 0.55);
  b0.position.set(-0.45, 3.52 + 2.4 * Math.sin(Math.PI * fk), -0.35); b0.rotation.set(fk * Math.PI * 2, 0, 0);
  B.coalM.emissiveIntensity = s < T.boom ? 0.6 : lerp(2.5, 0, smooth(inv(T.hiss, T.out, s)));
  const sag = smooth(inv(T.toCastle + 0.4, T.panic + 1.6, s)) * (1 - 0.4 * smooth(inv(T.hiss, T.out + 1, s)));
  B.castleBody.scale.set(1 + 0.05 * sag, 1 - 0.32 * sag, 1 + 0.05 * sag); B.castleBody.rotation.z = 0.06 * sag;
  B.cloth.material.color.set('#ffffff').lerp(new THREE.Color('#5a4a40'), 0.6 * smooth(inv(T.toTable, T.hiss, s)));
  B.napkins.visible = s < T.toNapkins + 1.0;
  // the dog (lawn only): soaked, then shakes itself
  dog.root.visible = lawn && s < T.close2 + 0.2;
  const shakeK = s > W.soaked4 + 0.05 && s < W.soaked4 + 0.95 ? Math.sin((s - W.soaked4) * 40) * 0.32 * Math.sin(Math.PI * (s - W.soaked4 - 0.05) / 0.9) : 0;
  dog.root.position.copy(DOG0); dog.root.rotation.set(0, -0.93, 0); dog.root.rotateX(shakeK); dog.root.scale.setScalar(0.9);   // the pack dog faces +X at rest: three-quarter to the camera; shakes about its long axis
  WETF.get(dog)(wetness('dog', () => DOG0, 1, s) * (s > W.soaked4 + 0.9 ? 0.55 : 1));
  SPRAY.update(s, Math.abs(shakeK) > 0.05 ? [{ p: DOG0.clone().add(V(0, 1.8, 0)), size: 0.35, k: 0.9, w: 1.6, n: 1 }] : []);
  // the Noob's private thunderstorm
  const nc = clamp((s - T.cloud) / 0.35) * (1 - smooth(inv(T.close2 - 0.2, T.close2 + 0.2, s)));
  nCloud.group.visible = nc > 0.01 && lawn;
  const np = noob.root.position.clone();
  if (nCloud.group.visible) { nCloud.group.position.set(np.x, 8.2 + 0.1 * Math.sin(s * 3), np.z); nCloud.group.scale.setScalar(easeOutBack(nc, 1.6)); }
  nBolt.visible = s > T.zap - 0.04 && s < T.zap + 0.18;
  if (nBolt.visible) { nBolt.position.set(np.x + 0.1, 7.6, np.z); nBolt.scale.set(1.4, 2.6, 1.4); }
  R2.update(s, { centre: np, amount: nCloud.group.visible ? nc : 0, H: 7.5 });
  // fire and steam
  FIRE.update(s, lawn ? [] : fires(s)); STEAM.update(s, lawn ? [] : steams(s));

  // ---------- cameras ----------
  const lp = leo.root.position.clone(), mp = max.root.position.clone(), ip = mia.root.position.clone(), boomShake = shake(t, T.boom, 0.35, 0.6), zapShake = shake(t, T.zap, 0.18, 0.3);
  let tg;
  switch (shot.id) {
    case 'hook': tg = look(stage, V(L0.x + lerp(0.6, 0, u), 4.4, L0.z + lerp(16.5, 15, u)), L0.clone().add(V(0, 3.4, 0)), 44); break;      // dry Leo, soaked friends
    case 'sky': tg = look(stage, V(L0.x - 1, 3.0, L0.z + 17.5), L0.clone().add(V(0, 5.2, -2)), 50); break;                                  // blue sky; it opens; the storm rolls in
    case 'max': tg = look(stage, mp.clone().add(V(-2.2, 4.4, 5.8)), mp.clone().add(V(0, 4.1, 0)), 36); break;
    case 'mia': tg = look(stage, ip.clone().add(V(2.2, 4.4, 5.8)), ip.clone().add(V(0, 4.1, 0)), 36); break;
    case 'dog': tg = look(stage, DOG0.clone().add(V(2.6, 2.6, 10.0)), DOG0.clone().add(V(0, 1.9, 0)), 36); break;
    case 'closes': tg = look(stage, L0.clone().add(V(-1.5, 3.6, 9.5)), L0.clone().add(V(0, 4.4, 0)), 44); break;
    case 'share': tg = look(stage, L0.clone().add(V(-0.4, 4.8, 16.5)), L0.clone().add(V(-0.4, 3.7, -0.3)), 48); break;
    case 'noob': tg = look(stage, L0.clone().add(V(5.0, 4.6, 14.0)), L0.clone().add(V(3.4, 3.8, 0.4)), 46); break;
    case 'thunder': tg = look(stage, np.clone().add(V(1.5, 0, 9.5)).setY(5.4).add(zapShake), np.clone().setY(6.4), 52); break;
    case 'after': tg = look(stage, lp.clone().add(V(-3.5, 4.4, 12.5)), lp.clone().add(V(1.8, 3.2, -1)), 46); break;
    case 'bbq': tg = look(stage, V(lerp(4, 1, u), lerp(15, 13, u), 31), V(1, 2.4, -1.5), 50); break;
    case 'flip': tg = look(stage, GRILL.clone().add(V(-2.8, 4.8, 8.8)).add(boomShake), GRILL.clone().add(V(1.1, 4.0, 0)), 46); break;
    case 'spread': tg = look(stage, V(-6, 17, 19).add(shake(t, T.toCastle, 0.2, 0.4)), V(0.5, 2, -3), 56); break;
    case 'screams': tg = look(stage, V(lerp(9, 7, u), 6.5, 24), V(3, 3, 2), 52); break;
    case 'open2': tg = look(stage, LEO_B.clone().add(V(0.8, 1.6, 7.5)), LEO_B.clone().add(V(0, 5.2, 0)), 52); break;                       // low, heroic
    case 'rain': tg = look(stage, V(-13, 6.8, 10), V(-3.5, 3.4, 0.5), 52); break;
    case 'cheer': tg = look(stage, LEO_B.clone().add(V(0, 7, 19)), LEO_B.clone().add(V(0, 3.4, -1.5)), 48); break;
    case 'duck': tg = look(stage, LEO_B.clone().add(V(-2.4, 4.8, 13.5)), LEO_B.clone().add(V(-1.8, 3.6, 0)), 48); break;
    case 'room': { const mid = lp.clone().lerp(ip, 0.5); tg = look(stage, mid.clone().add(V(0, 4.8, 12.5)), mid.clone().setY(4.2), 42); break; }
    case 'wide': case 'cta': tg = look(stage, LEO_B.clone().add(V(lerp(1.5, 0, u), lerp(7, 9, u), lerp(17, 21, u))), LEO_B.clone().add(V(0, 3.0, -2)), 50); break;
    default: tg = look(stage, V(0, 8, 24), V(0, 3, 0), 50);
  }
  cam = stage.camera;
  const dry = ok > 0.3 ? [{ x: cc.x, z: cc.z, r: UMB_R * 1.25 * ok, top: cc.y }] : [];   // a little wider than the canopy: whoever squeezes in at its edge stays dry
  R.update(s, { centre: V(tg.x, 0, tg.z).lerp(cam.position.clone().setY(0), 0.35), amount: st, dry, R: 22, H: 22 });
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
function bubble(g, s, p3, text, t0, t, { size = 64, edge = '#9b5cff', y = null } = {}) {
  const k = easeOutBack(clamp((t - t0) / 0.22), 1.8); if (k <= 0) return;
  const p = project(p3); g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const w = g.measureText(text).width / s + 80, h = size * 1.15 + 50, bx = clamp(p.x, 70 + w / 2, 1010 - w / 2), by = clamp(y ?? p.y - 250, 330 + h / 2, 1050 - h / 2);
  g.translate(bx * s, by * s); g.scale(k, k);
  const tx = clamp(p.x - bx, -w / 2 + 50, w / 2 - 50);
  g.beginPath(); g.moveTo((tx - 32) * s, (h / 2 - 4) * s); g.lineTo(clamp(p.x - bx, -w, w) * 0.85 * s, (h / 2 + 70) * s); g.lineTo((tx + 32) * s, (h / 2 - 4) * s); g.closePath();
  g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = edge; g.stroke();
  roundRect(g, (-w / 2) * s, (-h / 2) * s, w * s, h * s, 34 * s); g.fillStyle = '#ffffff'; g.fill(); g.stroke();
  g.fillStyle = '#16182a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
export function overlay(g, s, t) {
  if (t > T.zap - 0.03 && t < T.zap + 0.25) { g.save(); g.globalAlpha = 0.55 * (1 - (t - T.zap + 0.03) / 0.28); g.fillStyle = '#fffbe0'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
  if (SHOT === 'thunder' && t > T.zap) bigText(g, s, 'ZAP!', 540, 560, 150, '#fff3a0', easeOutBack(clamp((t - T.zap) / 0.18), 2.2), -0.08);
  if (SHOT === 'noob' && t > T.bump && t < T.bump + 0.8) bigText(g, s, 'BOING', 760, 640, 90, '#ffffff', easeOutBack(clamp((t - T.bump) / 0.15), 2), 0.1);
  if (SHOT === 'flip' && t > T.boom) bigText(g, s, 'FWOOMP!', 540, 520, 150, '#ffb703', easeOutBack(clamp((t - T.boom) / 0.18), 2.2), -0.06);
  if ((SHOT === 'rain') && t > T.hiss + 0.1) bigText(g, s, 'HISSSS', 540, 560, 120, '#e9f1fb', easeOutBack(clamp((t - T.hiss - 0.1) / 0.2), 2), 0.04, '#2a3140');
  if (SHOT === 'room' && t > T.room) bubble(g, s, mia.root.position.clone().add(V(0, 5.4, 0)), 'Room for one more?', T.room, t, { size: 60, edge: '#ff5c8a', y: 470 });
  if (t >= T.cta) {                                        // call to action
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

export const cast = () => ({ leo, mia, max, noob, dog, U, B, P });
export const TIMES = T;
