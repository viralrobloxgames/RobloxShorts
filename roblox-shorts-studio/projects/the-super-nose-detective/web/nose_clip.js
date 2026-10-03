// The Super Nose Detective (Case 1: The Golden Donut). A Roblox take on the 70s Miami detective parody: Detective Max
// Sniffwell has the Super Nose gamepass. Beat times come from web/beats.js (source/beats.py: narration word timings via
// script alignment, or an estimate until the narration exists), so the clip retimes itself.
// Max sniffs the only clue (a sock), resists Skye ("are you single?") and Mia ("stay for a swim?") - "Tempting. But I'm on a
// case." - follows the green smell trail to a Noob in sunglasses, sneezes him into the pool (he has both socks: not him),
// and follows the trail back to Chief Leo: one sock, sprinkles on his face, half the Golden Donut. Leo slides him the other
// half. "Tempting." He eats it. Case closed. Then his nose twitches: the next case.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, puff, canvasTexture, sign } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { makeTalkingFace, wearOutfit, makeNose, setNose, makeSunglasses, donut, sock, evidenceBag, convertible, rollWheels, policeCar, flashLights, tape, palm } from './kit.js';
import { W } from './beats.js';
import { LIPS } from './lipsync.js';
const lipAt = (t) => LIPS[Math.floor(t * 30 + 1e-6)] || '-';
const FLAP = 'swnoesnwcsoe';
let talkMax, talkLeo, talkMia;

export const meta = { seconds: Math.ceil((W.end + 0.7) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Super Nose Detective' };
export const sky = { zenith: '#3b2c78', horizon: '#ff9e7a', below: '#f2d2b8', fog: '#f0b49c', sunDir: new THREE.Vector3(0.62, 0.32, 0.55), sunColor: '#ffd2a0' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));
const win = (s, a, b) => s >= a && s < b;

// ---------- layout ----------
// Station front (crime scene) at the origin, the road runs +Z to the Flamingo Hotel pool; the office interior is a set at OFF.
const DOOR = V(0, 0, -7.5), MAX_SCENE = V(0, 0, 2), COP = V(9.5, 0, 4.5), SKYE_AT = V(6.4, 0, 8.6), CAR0 = V(-9, 0, 11);
const POOL = { x0: -16, x1: 16, z0: 333, z1: 347 }, WATER_Y = -0.7;
const CAR1 = V(-14, 0, 318), MAXP = V(-6, 0, 330.6), MIA_AT = V(-6, 0, 337.5);
const NOOB0 = V(8, 0, 330.2), MAXF = V(8, 0, 322.2), NOOB_L = V(8, WATER_Y, 341.5), MAXE = V(8, 0, 331.6), PALM_N = V(-1.5, 0, 331.6);
const OFF = V(-300, 0, 0), DESK = OFF.clone().add(V(6, 0, -1.5)), LEO_SIT = OFF.clone().add(V(6, 0, -4.7)), MAXD = OFF.clone().add(V(6, 0, 2.6));
const ENTER = OFF.clone().add(V(-9, 0, 3)), EXIT = OFF.clone().add(V(-16, 0, 4)), CASE_AT = OFF.clone().add(V(-11, 0, -7));
const DESK_TOP = 3.25;

// ---------- beats (all from narration words) ----------
const B = {
  logo: W.this - 0.05, pass: W.super - 0.15, caseIn: W.case1 - 0.3, chief: W.chief1 - 0.3, slam: W.tonight - 0.05, scene: W.scene - 0.3,
  think1: W.tempting1 - 0.1, stop1: W.case2 - 0.55, r1: W.case2, clue: W.only - 0.3, sniff: W.cheap - 0.3,
  trailOn: W.trail1 - 0.3, drive: W.trail1 + 0.35, party: W.party + 0.45, miaShot: W.mia - 0.25, think2: W.tempting2 - 0.1, stop2: W.case3 - 0.55,
  r2: W.case3, follow: W.case3 + 0.35, suspect: W.ended - 0.3, stare: W.sunglasses - 0.1, fight: W.threw - 0.3, throw: W.threw + 0.05,
  achoo: W.achoo, splash: W.achoo + 0.75, socks: W.both - 0.3, shake: W.guy2 - 0.2, trailBack: W.guy2 + 0.15, driveBack: W.trail2 - 0.3,
  office: W.back + 0.2, feet: W.one2 - 0.3, faceS: W.sprinkles - 0.3, halfS: W.half - 0.3, talk: W.said - 0.3,
  slide: W.slid - 0.1, tempt3: W.tempting3 - 0.4, principle: W.always - 0.3, bite: W.fighting - 0.15, closed: W.closed - 0.35,
  twitch: W.twitched - 0.35, cta: W.follow - 0.1,
};
const resisted = (s) => (s < B.r1 ? 0 : s < B.r2 ? 1 : 2);

const SHOTS = [
  [0, 'hook'], [W.super - 0.2, 'gamepass'], [W.smell - 0.25, 'wisps'], [W.map - 0.2, 'map'], [B.caseIn, 'caseEmpty'], [B.chief, 'chief'],
  [B.scene, 'skye'], [W.tempting1 - 0.15, 'tempt1'], [B.clue, 'clue'], [B.sniff, 'sniff'], [B.trailOn, 'trailOn'], [B.drive, 'drive'],
  [B.party, 'party'], [B.miaShot, 'mia'], [W.tempting2 - 0.15, 'tempt2'], [B.suspect, 'suspect'], [B.stare, 'stare'], [B.fight, 'fight'],
  [B.achoo - 0.15, 'achoo'], [B.socks, 'socks'], [B.driveBack, 'driveBack'], [B.office, 'office'], [B.feet, 'feet'],
  [B.faceS, 'faceS'], [B.halfS, 'halfS'], [B.talk, 'talk'], [B.slide - 0.2, 'slide'], [B.tempt3, 'tempt3'], [B.principle, 'principle'],
  [B.bite - 0.5, 'bite'], [B.closed, 'closed'], [B.twitch, 'twitch'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- the smell trails ----------
// A glowing ribbon along a smooth path, revealed by distance. A: crime scene -> road -> pool party -> the Noob.
// B: the Noob -> back down the road -> the station door. C: in the office, door -> the Chief's desk. D: the next case.
const PATH_A = [MAX_SCENE, V(-1, 0, 12), V(2.5, 0, 40), V(-2.5, 0, 120), V(2.5, 0, 200), V(-1, 0, 280), V(-6, 0, 316), MAXP.clone().add(V(0, 0, -1.2)), V(1, 0, 327.5), NOOB0];
const PATH_B = [NOOB0, V(13, 0, 326), V(14, 0, 318), V(4, 0, 300), V(-3, 0, 220), V(3, 0, 120), V(-2, 0, 30), V(0, 0, 4), DOOR];
const PATH_C = [ENTER.clone().add(V(-6, 0, 0)), ENTER, OFF.clone().add(V(0, 0, 1.5)), MAXD.clone().add(V(-0.8, 0, -1)), DESK.clone().add(V(-1, 0, -0.5))];
const PATH_D = [MAXD.clone().add(V(-1, 0, 0)), OFF.clone().add(V(-4, 0, 3.5)), EXIT, EXIT.clone().add(V(-12, 0, 1))];
function makeTrail(points, width = 1.1, color = '#4dff7c') {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => p.clone().setY(0.12)), false, 'centripetal');
  const len = curve.getLength(), n = Math.max(8, Math.ceil(len / 0.5)), pos = [], dist = [];
  const pts = curve.getSpacedPoints(n);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], d = b.clone().sub(a).setY(0).normalize(), side = V(-d.z, 0, d.x).multiplyScalar(width / 2);
    const wob = 0.25 * Math.sin(i * 0.7), q = [a.clone().add(side).addScaledVector(side, wob), a.clone().sub(side).addScaledVector(side, -wob), b.clone().add(side), b.clone().sub(side)];
    pos.push(...q[0].toArray(), ...q[1].toArray(), ...q[2].toArray(), ...q[1].toArray(), ...q[3].toArray(), ...q[2].toArray());
    dist.push((i / n) * len);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 3; mesh.frustumCulled = false;
  return { mesh, mat, len, n, curve, reveal(d0, d1) { const a = Math.floor(clamp(d0 / len) * n), b = Math.ceil(clamp(d1 / len) * n); mesh.visible = b > a; geo.setDrawRange(a * 6, Math.max(0, b - a) * 6); } };
}

// ---------- scene ----------
let A = {}, max, leo, skye, mia, noob, nose, cam, car, cop, bag, heldDonut, leoDonut, slideDonut, crumbs = [], wisps = [], pepper = [], splash = [], puffs = [];
let frontWall, trailA, trailB, trailC, trailD, ring, alarm, alarmLight, waterTex, floatRing, SHOT = 'hook';
const WISP_SRC = [V(9.5, 3.5, 4.5), V(-6, 2.6, -4), V(14, 3, -3), V(6.4, 4.5, 8.6), V(-9, 2, 11)];
const MAP_SRC = [V(-30, 0, 40), V(30, 0, 80), V(-26, 0, 140), V(28, 0, 190), V(-30, 0, 250), V(20, 0, 30), V(0, 0, 300), V(-20, 0, 330), V(26, 0, 340), V(-8, 0, 100)];

function building(scene, x, z, w, h, d, color, trim, rot = 0) {
  const g = new THREE.Group();
  const body = part(w, h, d, color, { center: true, rough: 0.8, clearcoat: 0 }); body.position.y = h / 2; g.add(body);
  for (let y = 3; y < h - 2; y += 4.2) {                                  // window rows + a trim band per floor
    const band = part(w + 0.4, 0.5, d + 0.4, trim, { center: true, clearcoat: 0 }); band.position.y = y - 0.9; g.add(band);
    for (let x0 = -w / 2 + 2.5; x0 < w / 2 - 1.5; x0 += 4.5) { const wn = part(2.4, 2.2, 0.2, '#2a3f5c', { center: true, rough: 0.15, clearcoat: 1 }); wn.position.set(x0, y + 0.8, d / 2 + 0.05); g.add(wn); }
  }
  const roof = part(w + 0.8, 0.8, d + 0.8, trim, { center: true, clearcoat: 0 }); roof.position.y = h; g.add(roof);
  g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); return g;
}
function lounger(scene, x, z, r) { const g = new THREE.Group(); const b = part(2, 0.4, 5, '#ffffff', { center: true }); b.position.y = 1; g.add(b); const back = part(2, 0.4, 2, '#ffffff', { center: true }); back.position.set(0, 1.6, -2.2); back.rotation.x = -0.9; g.add(back); for (const sx of [-0.8, 0.8]) for (const sz of [-2, 2]) { const l = part(0.2, 0.9, 0.2, '#cfd6de', { center: true }); l.position.set(sx, 0.45, sz); g.add(l); } const towel = part(1.8, 0.1, 3, '#ff7bc5', { center: true }); towel.position.set(0, 1.25, 0.5); g.add(towel); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g); }
function umbrella(scene, x, z, col) { const g = new THREE.Group(); const pole = part(0.25, 7, 0.25, '#ffffff', { center: true }); pole.position.y = 3.5; g.add(pole); const top = new THREE.Mesh(new THREE.ConeGeometry(4, 1.6, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })); top.position.y = 7.3; top.castShadow = true; g.add(top); g.position.set(x, 0, z); scene.add(g); }

export async function setup(stage) {
  const { scene } = stage; const r = rng(11);
  scene.fog.near = 160; scene.fog.far = 700;
  // Ground in four slabs round the pool hole; paving, road, sidewalks and the pool deck laid on top.
  const G = '#e8d3ae';
  for (const [x0, x1, z0, z1] of [[-500, 500, -500, POOL.z0], [-500, 500, POOL.z1, 900], [-500, POOL.x0, POOL.z0, POOL.z1], [POOL.x1, 500, POOL.z0, POOL.z1]]) {
    const p = part(x1 - x0, 2, z1 - z0, G, { rough: 0.95, clearcoat: 0, radius: 0.01 }); p.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(p);
  }
  const flat = (w, d, x, z, col, y = 0.03, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o.material || new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, ...o })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  const roadTex = canvasTexture(64, 256, (c) => { c.fillStyle = '#3e3f47'; c.fillRect(0, 0, 64, 256); c.fillStyle = '#ffd23f'; c.fillRect(29, 0, 6, 120); });
  roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 22);
  flat(22, 302, 0, 165, null, 0.03, { material: new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 }) });
  flat(5, 302, -13.5, 165, '#efe6da', 0.06); flat(5, 302, 13.5, 165, '#efe6da', 0.06);
  const tiles = canvasTexture(256, 256, (c) => { c.fillStyle = '#f6c9d6'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#fbe4ea'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) c.fillRect(i * 64, j * 64, 64, 64); });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(12, 8);
  flat(70, 30, 0, 0, null, 0.04, { material: new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.7 }) });   // station plaza
  const deckTex = canvasTexture(256, 256, (c) => { c.fillStyle = '#f7f2e8'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#e2d8c6'; c.lineWidth = 4; for (let i = 0; i <= 256; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); } });
  deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping; deckTex.repeat.set(16, 12);
  for (const [w, d, x, z] of [[70, 17, 0, 324.5], [70, 18, 0, 356], [24, 14, -28, 340], [24, 14, 28, 340]]) flat(w, d, x, z, null, 0.05, { material: new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.6 }) });

  // The pool: tiled walls, a floor, coping, and animated water.
  const pw = POOL.x1 - POOL.x0, pd = POOL.z1 - POOL.z0, pc = V((POOL.x0 + POOL.x1) / 2, 0, (POOL.z0 + POOL.z1) / 2);
  const tileM = new THREE.MeshStandardMaterial({ color: '#7fd3f0', roughness: 0.4 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.4, pd), tileM); floor.position.set(pc.x, -4.2, pc.z); scene.add(floor);
  for (const [w, d, x, z] of [[pw, 0.4, pc.x, POOL.z0], [pw, 0.4, pc.x, POOL.z1], [0.4, pd, POOL.x0, pc.z], [0.4, pd, POOL.x1, pc.z]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 4.2, d), tileM); m.position.set(x, -2, z); scene.add(m); }
  for (const [w, d, x, z] of [[pw + 2, 1, pc.x, POOL.z0 - 0.5], [pw + 2, 1, pc.x, POOL.z1 + 0.5], [1, pd, POOL.x0 - 0.5, pc.z], [1, pd, POOL.x1 + 0.5, pc.z]]) { const c = part(w, 0.3, d, '#ffffff', { center: true }); c.position.set(x, 0.15, z); scene.add(c); }
  waterTex = canvasTexture(256, 256, (c) => { c.fillStyle = '#2fb7e8'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { c.beginPath(); const y = (i * 37) % 256; for (let x = 0; x <= 256; x += 16) c.lineTo(x, y + 6 * Math.sin(x * 0.07 + i)); c.stroke(); } });
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(4, 2);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), new THREE.MeshPhysicalMaterial({ map: waterTex, color: '#bff0ff', roughness: 0.05, transparent: true, opacity: 0.86, emissive: '#1a8fc0', emissiveIntensity: 0.25, clearcoat: 1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(pc.x, WATER_Y, pc.z); scene.add(water);

  // Station: pastel art-deco front with a neon POLICE sign, glass doors, steps, the crime-scene tape and the police car.
  const st = building(scene, 0, -18, 44, 15, 20, '#f7c6d2', '#ffffff');
  const doorM = part(7, 7.5, 0.4, '#24344d', { center: true, rough: 0.1, clearcoat: 1 }); doorM.position.set(0, 3.75, -7.9); scene.add(doorM);
  for (const sx of [-1, 1]) { const f = part(0.5, 8, 0.6, '#ffffff', { center: true }); f.position.set(3.7 * sx, 4, -7.8); scene.add(f); }
  const step = part(12, 0.5, 3, '#ffffff', { center: true }); step.position.set(0, 0.25, -6.6); scene.add(step);
  const neon = sign('POLICE', { w: 14, h: 3, bg: '#14203a', accent: '#5ab0ff', fg: '#bfe3ff', post: 0 }); neon.position.set(0, 10.2, -7.6); scene.add(neon);
  neon.children.forEach((o) => { if (o.material && o.material.emissive) o.material.emissiveIntensity = 0.9; });
  scene.add(tape(V(-7, 0, -4.5), V(7, 0, -4.5), 3.2), tape(V(-7, 0, -4.5), V(-9, 0, 4), 3.2));
  for (const p of [V(-7, 0, -4.5), V(7, 0, -4.5), V(-9, 0, 4)]) { const post = part(0.3, 3.4, 0.3, '#ff9a1f', { center: true }); post.position.copy(p).setY(1.7); scene.add(post); }
  cop = policeCar(); cop.position.copy(COP); cop.rotation.y = Math.PI / 2 + 0.25; scene.add(cop);
  const bin = part(1.6, 2.6, 1.6, '#3f6b4a', { center: true }); bin.position.set(-6, 1.3, -4); scene.add(bin);
  const cart = new THREE.Group(); const cb = part(4, 2.2, 2.2, '#ffffff', { center: true }); cb.position.y = 2; cart.add(cb); const um = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#ff5d5d' })); um.position.y = 5.6; cart.add(um); const up = part(0.2, 3, 0.2, '#ccc', { center: true }); up.position.y = 4; cart.add(up); cart.position.set(14, 0, -3); scene.add(cart);
  // Street: palms both sides, pastel blocks, a few more palms by the station.
  for (let z = 22; z < 310; z += 22) for (const sx of [-1, 1]) { const p = palm(15 + r() * 4, r() * 6); p.position.set(sx * 17, 0, z + r() * 6); scene.add(p); }
  const PAST = ['#ffd1dc', '#c9f0e4', '#fff0b8', '#d6e4ff', '#ffd8b5', '#e8d4ff'];
  for (let z = 30, i = 0; z < 300; z += 34, i++) for (const sx of [-1, 1]) building(scene, sx * (36 + r() * 6), z, 22 + r() * 6, 10 + r() * 12, 18, PAST[(i * 2 + (sx > 0)) % 6], '#ffffff');
  for (const [x, z] of [[-24, -2], [24, -2], [-20, 14], [22, 14]]) { const p = palm(16, x); p.position.set(x, 0, z); scene.add(p); }
  // Flamingo Hotel and the pool party.
  building(scene, 0, 378, 70, 22, 18, '#c9f0e4', '#ffffff');
  const hs = sign('FLAMINGO HOTEL', { w: 30, h: 4, bg: '#1d1636', accent: '#ff7bc5', fg: '#ffb3dc', post: 0 }); hs.position.set(0, 23, 369); scene.add(hs);
  for (const [x, z] of [[-24, 330], [-30, 352], [30, 352], [PALM_N.x, PALM_N.z]]) { const p = palm(17, x * 0.3); p.position.set(x, 0, z); scene.add(p); }
  for (const [x, z, rr] of [[-24, 356, 0.1], [-18, 357, -0.1], [18, 357, 0.1], [24, 356, -0.05]]) lounger(scene, x, z, rr + Math.PI);
  umbrella(scene, -21, 361, '#ff7bc5'); umbrella(scene, 21, 361, '#ffd23f');
  floatRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.6, 14, 28), new THREE.MeshStandardMaterial({ color: '#ff7bc5', roughness: 0.35 })); floatRing.rotation.x = Math.PI / 2; scene.add(floatRing);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 12), new THREE.MeshStandardMaterial({ map: canvasTexture(64, 32, (c) => { ['#ff5d5d', '#ffffff', '#3fa9ff', '#ffd23f'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * 16, 0, 16, 32); }); }) })); ball.position.set(4, WATER_Y + 0.6, 344); ball.name = 'ball'; scene.add(ball);
  for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshStandardMaterial({ color: ['#ff7bc5', '#ffd23f', '#5ab0ff', '#7fe3dd'][i % 4], emissive: ['#ff7bc5', '#ffd23f', '#5ab0ff', '#7fe3dd'][i % 4], emissiveIntensity: 1.4 })); l.position.set(-26 + i * 4, 9 + Math.sin(i) * 0.6, 364); scene.add(l); }

  // Office interior set: lobby (left, the empty Golden Donut case) and the Chief's desk (right), open to the camera at +Z.
  const room = (w, h, d, x, y, z, col, o = {}) => { const p = part(w, h, d, col, { center: true, rough: 0.8, clearcoat: 0, ...o }); p.position.copy(OFF).add(V(x, y, z)); scene.add(p); return p; };
  room(48, 0.4, 26, 0, 0.05, -2, '#9a6b3a');                                         // 70s carpet
  room(48, 16, 0.6, 0, 8, -13, '#efe2c8'); room(48, 5, 0.7, 0, 2.5, -12.9, '#7a5534'); // back wall + wood panelling
  room(0.6, 16, 26, -24, 8, -2, '#efe2c8'); room(0.6, 16, 26, 24, 8, -2, '#efe2c8');
  room(48, 0.6, 26, 0, 16, -2, '#f6efe0');
  frontWall = room(48, 16, 0.6, 0, 8, 11, '#efe2c8');
  const blinds = canvasTexture(128, 128, (c) => { c.fillStyle = '#ffb36b'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#f2e4c4'; for (let y = 0; y < 128; y += 10) c.fillRect(0, y, 128, 6); });
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshStandardMaterial({ map: blinds, emissive: '#ffb36b', emissiveMap: blinds, emissiveIntensity: 0.5 })); bw.position.copy(OFF).add(V(8, 8.5, -12.6)); scene.add(bw);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.6), new THREE.MeshStandardMaterial({ map: canvasTexture(120, 78, (c) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#c8283c'; c.fillRect(0, i * 6, 120, 6); } c.fillStyle = '#2a3f80'; c.fillRect(0, 0, 50, 42); }) })); flag.position.copy(OFF).add(V(-2, 9, -12.55)); scene.add(flag);
  // Desk: top, sides, a modesty-free front (Leo's feet show), name plate, phone, papers.
  room(9, 0.4, 4.4, DESK.x - OFF.x, DESK_TOP - 0.2, DESK.z, '#5a3a20', { clearcoat: 0.5, rough: 0.4 });
  for (const sx of [-4.1, 4.1]) for (const sz of [-1.9, 1.9]) room(0.4, DESK_TOP - 0.4, 0.4, DESK.x - OFF.x + sx, (DESK_TOP - 0.4) / 2, DESK.z + sz, '#4a2f18');
  const under = new THREE.PointLight('#ffe2b0', 45, 10, 2); under.position.copy(DESK).add(V(0.5, 2.2, 2.6)); scene.add(under);
  const plate = sign('CHIEF', { w: 2.4, h: 0.6, bg: '#2a1a0c', accent: '#E8B931', fg: '#E8B931', post: 0 }); plate.position.copy(DESK).add(V(-2.4, DESK_TOP, 1.4)); plate.rotation.y = 0; scene.add(plate);
  room(1.6, 0.2, 2, DESK.x - OFF.x + 3, DESK_TOP + 0.1, DESK.z - 0.6, '#f4f1ea');
  const phone = room(1.2, 0.6, 1, DESK.x - OFF.x - 3.2, DESK_TOP + 0.3, DESK.z - 1.2, '#c8283c');
  room(3.6, 0.5, 3.4, LEO_SIT.x - OFF.x, 1.75, LEO_SIT.z - 0.2, '#2a2a30'); room(3.6, 4.4, 0.5, LEO_SIT.x - OFF.x, 3.6, LEO_SIT.z - 1.9, '#2a2a30');   // chair
  room(3, 7, 2.4, 20, 3.5, -11, '#8a8f99');                                            // filing cabinet
  // The empty display case on its pedestal, with a plaque and the alarm light.
  room(3, 4, 3, CASE_AT.x - OFF.x, 2, CASE_AT.z, '#f4f1ea');
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), new THREE.MeshPhysicalMaterial({ color: '#dff4ff', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false })); glass.position.copy(CASE_AT).setY(5.4); glass.renderOrder = 2; scene.add(glass);
  const plaque = sign('GOLDEN DONUT', { w: 2.8, h: 0.6, bg: '#2a1a0c', accent: '#E8B931', fg: '#E8B931', post: 0 }); plaque.position.copy(CASE_AT).add(V(0, 2.6, 1.55)); scene.add(plaque);
  const spot = new THREE.SpotLight('#fff3d0', 80, 18, 0.35, 0.5, 1.5); spot.position.copy(CASE_AT).add(V(0, 14, 2)); spot.target.position.copy(CASE_AT).setY(4); scene.add(spot, spot.target);
  alarm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.8, 16), new THREE.MeshStandardMaterial({ color: '#ff2a3a', emissive: '#ff1a2a', emissiveIntensity: 2 })); alarm.position.copy(CASE_AT).add(V(4, 12, -5.5)); scene.add(alarm);
  alarmLight = new THREE.SpotLight('#ff2a3a', 0, 40, 0.5, 0.6, 1); alarmLight.position.copy(alarm.position); scene.add(alarmLight, alarmLight.target);
  const lamp = new THREE.PointLight('#ffd9a0', 40, 30, 2); lamp.position.copy(OFF).add(V(4, 12, 2)); scene.add(lamp);

  // Cast.
  const ex = ['neutral', 'happy', 'smug', 'love', 'cool', 'determined', 'suspicious', 'sleeping', 'shocked', 'scared', 'surprised', 'sad', 'annoyed', 'angry', 'talking', 'laugh', 'dizzy', 'scheming', 'evil_grin', 'nervous', 'wink', 'blink'];
  [max, leo, skye, mia, noob] = await Promise.all(['Max', 'Leo', 'Skye', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(max.root, leo.root, skye.root, mia.root, noob.root);
  await wearOutfit(max, 'max_miami.png'); await wearOutfit(leo, 'leo_chief.png'); await wearOutfit(skye, 'skye_70s.png');
  nose = makeNose(max);
  makeSunglasses(noob); makeSunglasses(mia, '#ffffff', '#ff5d9a');
  talkMax = await makeTalkingFace(max, ['determined', 'suspicious', 'smug', 'surprised', 'neutral', 'sleeping', 'scared', 'shocked', 'annoyed', 'nervous', 'happy', 'laugh']);
  talkLeo = await makeTalkingFace(leo, ['angry', 'annoyed', 'smug', 'evil_grin', 'shocked', 'laugh', 'happy']);
  talkMia = await makeTalkingFace(mia, ['love']);
  // Leo's plants: sprinkles on his face, one striped sock (right foot), the other foot bare.
  const SPR = ['#ff5d7a', '#7fe3dd', '#ffffff', '#ffd23f', '#a56dff'];
  for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.08, 2, 6), new THREE.MeshStandardMaterial({ color: SPR[i % 5] })); sp.position.set(-0.32 + i * 0.1 + (i % 2) * 0.03, 0.22 + (i % 3) * 0.06, 0.625); sp.rotation.z = i * 1.3; leo.bones.Head.add(sp); }
  const sockM = new THREE.MeshStandardMaterial({ map: canvasTexture(64, 64, (c) => { c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 64, 64); for (const [y, col] of [[6, '#e0405a'], [20, '#2d7fd6']]) { c.fillStyle = col; c.fillRect(0, y, 64, 8); } }), roughness: 0.9 });
  const sockOn = (actor, bone) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.9, 1.08), sockM); m.position.set(0, -1.6, 0); actor.bones[bone].add(m); return m; };
  sockOn(leo, 'Leg.R'); sockOn(noob, 'Leg.L'); sockOn(noob, 'Leg.R');
  const bare = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.64, 1.05), new THREE.MeshStandardMaterial({ color: '#F2C89A', roughness: 0.6 })); bare.position.set(0, -1.73, 0); leo.bones['Leg.L'].add(bare);
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'think', 'point_forward', 'talk', 'sit', 'tool_lunge', 'knocked_out', 'scheming', 'laugh', 'push', 'look_up', 'shrug', 'proud', 'dizzy'])
    A[n] = await loadAnimation(n);

  // Props.
  bag = evidenceBag(sock(0.75)); scene.add(bag);
  heldDonut = donut('R', 0.55); scene.add(heldDonut);         // the half Max is given
  leoDonut = donut('L', 0.55); scene.add(leoDonut);           // the half Leo is eating
  car = convertible(); scene.add(car);
  trailA = makeTrail(PATH_A); trailB = makeTrail(PATH_B); trailC = makeTrail(PATH_C, 0.9); trailD = makeTrail(PATH_D, 0.9);
  scene.add(trailA.mesh, trailB.mesh, trailC.mesh, trailD.mesh);
  const wm = new THREE.MeshBasicMaterial({ color: '#4dff7c', transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 0; i < 60; i++) { const w = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), wm.clone()); w.renderOrder = 4; scene.add(w); wisps.push(w); }
  const pm = new THREE.MeshStandardMaterial({ color: '#b5462a', roughness: 1, transparent: true, opacity: 0.9, depthWrite: false });
  for (let i = 0; i < 26; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), pm.clone()); scene.add(p); pepper.push(p); }
  for (let i = 0; i < 24; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); splash.push(p); }
  for (let i = 0; i < 10; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: '#f2b630' })); scene.add(c); crumbs.push(c); }
  ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: '#d8ffe4', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(ring);
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, arms: [], ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const runL = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
// An arm raised forward from hanging (0) to straight out (PI/2) and on up; after robloxPose. `spread` turns it outwards.
function armFwd(a, side, ang, spread = 0) { const e = new THREE.Euler(-ang, 0, side === 'L' ? spread : -spread, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(e); }
// A walk/run from a to b arriving at `at`; holds the end pose after.
function moveTo(b, s, from, to, at, speed, run = false, endRot = null) {
  const d = from.distanceTo(to), m = travelTo(from, to, at, s, speed);
  b.pos = m.pos; b.rotY = m.moving ? m.heading : (endRot ?? b.rotY); if (m.moving) b.layers = run ? runL(m, d) : walkL(m, d);
  return m;
}
// Car: where it is and how far it has rolled.
function carAt(s) {
  const roadA = [CAR0, V(-5, 0, 24), V(-5, 0, 300), CAR1], roadB = [CAR1.clone().add(V(4, 0, -2)), V(5, 0, 300), V(5, 0, 24), CAR0];
  const along = (pts, u) => { const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), p = c.getPointAt(u), tg = c.getTangentAt(Math.min(0.999, u)); return { pos: p, rotY: Math.atan2(tg.x, tg.z), dist: u * c.getLength() }; };
  if (s < B.drive) return { pos: CAR0.clone(), rotY: 0, dist: 0 };
  if (s < B.party - 0.05) return along(roadA, easeInOut(seg(s, B.drive, B.party - 0.05)));
  if (s < B.driveBack) return { ...along(roadA, 1), dist: 400 };
  if (s < B.office + 0.6) { const k = along(roadB, easeOut(seg(s, B.driveBack, B.office + 0.6))); return { ...k, dist: 400 + k.dist }; }
  return { pos: CAR0.clone(), rotY: Math.PI, dist: 800 };
}
const SEAT = V(1.1, 0.2, -0.3);
function inCar(b, s, lean = 0.3) {
  const c = carAt(s); b.grounded = false; b.pos = c.pos.clone().add(SEAT.clone().applyAxisAngle(V(0, 1, 0), c.rotY)); b.rotY = c.rotY;
  b.layers = [[A.sit, 0.5]]; b.rotX = lean; b.face = 'determined'; b.inCar = true;
}

function maxState(s) {
  const b = st(MAX_SCENE, 0, idle(s), 'determined');
  if (s < B.scene) {                                              // crime scene: sniffing the bag; turning to the wisps
    const look = easeInOut(seg(s, 0.45, 0.95));                   // sniffing the bag at his right, then turns to camera
    b.layers = idle(s); b.arms.push(['R', 2.05, 0.22]); b.bag = 'side'; b.headTurn = -0.45 * (1 - look); b.nod = 0.22 * (1 - look);
    b.face = s < 0.5 ? 'sleeping' : s < B.logo ? 'suspicious' : 'determined';
    if (s > B.pass) b.face = 'smug';
    if (win(s, W.smell - 0.25, B.caseIn)) { b.layers = [[A.look_up, 0.3]]; b.arms = []; b.bag = null; b.headTurn = 0; b.nod = 0; b.rotY = 0.5 * Math.sin((s - W.smell) * 1.6); b.face = 'smug'; }
  } else if (s < B.clue) {                                        // Skye: turns to her, thinks, raises a hand
    b.rotY = face(MAX_SCENE, SKYE_AT); b.face = s > W.single ? 'surprised' : 'neutral';
    if (s > B.think1) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop1) { b.layers = idle(s); b.arms.push(['R', 1.75, 0.05]); b.face = 'determined'; }
  } else if (s < B.trailOn) {                                     // the clue and the sniff
    b.rotY = 0; b.layers = [[A.hold, 0.3]]; b.bag = s > B.sniff ? 'sniff' : 'show'; b.nod = s > B.sniff ? 0.3 : 0; b.face = s > B.sniff ? 'sleeping' : 'determined';
  } else if (s < B.drive) {                                       // runs to the convertible as the trail lights up
    b.face = 'determined'; const at = CAR0.clone().add(V(3.2, 0, 0)); moveTo(b, s, MAX_SCENE, at, B.drive - 0.05, 16, true, 0);
  } else if (s < B.party) inCar(b, s);
  else if (s < B.follow) {                                        // out of the car, to the pool edge; Mia; tempting; no
    b.face = 'happy'; moveTo(b, s, CAR1.clone().add(V(3.5, 0, 1)), MAXP, W.mia + 0.3, 16, true, face(MAXP, MIA_AT));
    if (s > B.think2) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop2) { b.layers = idle(s); b.arms.push(['R', 1.75, 0.05]); b.face = 'determined'; }
  } else if (s < B.fight) {                                       // follows the trail to the Noob
    b.face = 'suspicious'; moveTo(b, s, MAXP, MAXF, B.stare + 0.2, 12, false, 0);
  } else if (s < B.socks) {                                       // the fight: pepper, the swell, ACHOO
    b.pos = MAXF.clone(); b.rotY = 0; b.face = 'suspicious';
    if (s > B.throw + 0.35) { b.face = 'scared'; b.layers = [[A.shock, 0.3]]; }
    if (s > B.achoo - 0.35 && s < B.achoo) { b.rotX = -0.25 * easeOut(seg(s, B.achoo - 0.35, B.achoo - 0.05)); b.face = 'shocked'; }
    if (s >= B.achoo) { b.rotX = 0.35 * (1 - easeOut(seg(s, B.achoo, B.achoo + 0.6))); b.face = s > B.achoo + 0.7 ? 'smug' : 'shocked'; b.layers = idle(s); }
  } else if (s < B.driveBack) {                                   // to the pool edge: both socks; shakes his head
    b.face = 'suspicious'; moveTo(b, s, MAXF, MAXE, W.both + 0.4, 12, false, 0);
    if (s > B.shake) { b.face = 'annoyed'; b.headShake = Math.sin((s - B.shake) * 18) * 0.35 * (1 - seg(s, B.shake, B.shake + 0.7)); }
  } else if (s < B.office) inCar(b, s, 0.2);
  else {                                                        // the office
    b.face = 'suspicious'; b.rotY = Math.PI; moveTo(b, s, ENTER, MAXD, W.one2 - 0.4, 14, false, Math.PI);
    if (s > B.tempt3) b.face = 'nervous';
    if (s > B.principle) { b.arms.push(['R', 1.55, 0.3]); b.donut = 'hand'; b.face = 'think'; b.layers = idle(s); b.face = 'smug'; }
    if (s > B.bite - 0.25 && s < B.bite + 0.25) { b.arms[0] = ['R', 1.95, 0.42]; b.face = 'happy'; }
    if (s > B.bite + 0.25) b.face = 'laugh';
    if (s > B.closed) { const chew = Math.sin((s - B.closed) * 7); b.arms[0] = ['R', 1.55 + 0.4 * Math.max(0, chew), 0.3 + 0.12 * Math.max(0, chew)]; b.face = chew > 0.4 ? 'happy' : 'laugh'; }
    if (s > B.twitch) { b.face = 'surprised'; b.arms[0] = ['R', 1.4, 0.15]; }
    if (s > B.cta + 0.2) { b.arms = []; b.donut = 'gone'; b.face = 'determined'; moveTo(b, s, MAXD, EXIT, B.cta + 2.4, 12, false, -Math.PI / 2); }
  }
  return b;
}

function leoState(s) {
  const b = st(LEO_SIT, 0, [[A.sit, 0.5]], 'neutral', { grounded: false, sit: true });
  b.pos = LEO_SIT.clone().setY(0.25);
  if (s < B.office) {                                             // "Not a word to the press!" + the desk slam
    b.face = s > W.wanted ? 'angry' : 'annoyed'; b.arms.push(['L', 0.5, -0.1], ['R', 0.6 + 0.25 * Math.sin(s * 9), 0.1]); b.talk = s > W.chief1 && s < W.scene;
    if (s > B.slam - 0.25 && s < B.slam + 0.4) { const k = seg(s, B.slam - 0.25, B.slam); b.arms[1] = ['R', lerp(2.4, 1.35, easeIn(k)), 0.1]; }
  } else {
    b.face = 'evil_grin'; b.arms.push(['R', 1.85 + 0.12 * Math.sin(s * 8), 0.35]); b.donut = 'mouth';
    if (s > B.office + 0.6) b.face = 'shocked';
    if (win(s, B.faceS, B.talk)) b.arms[0] = ['R', 1.45, 0.35];
    if (s > B.talk) { b.face = 'smug'; b.arms[0] = ['R', 1.3, 0.2]; b.donut = 'lowered'; b.talk = s < B.slide + 0.6 || win(s, W.cut - 0.3, W.cut + 0.5); }
    if (win(s, B.slide - 0.05, B.slide + 0.7)) b.arms.push(['L', lerp(1.0, 1.5, easeOut(seg(s, B.slide - 0.05, B.slide + 0.5))), 0]);
    if (s > B.bite) { b.face = 'laugh'; }
    if (s > B.closed) { const chew = Math.sin((s - B.closed) * 6 + 1); b.arms[0] = ['R', 1.6 + 0.3 * Math.max(0, chew), 0.35]; b.donut = 'mouth'; b.face = chew > 0.4 ? 'happy' : 'laugh'; }
    if (s > B.twitch) b.face = 'smug';
  }
  return b;
}

function skyeState(s) {
  const b = st(SKYE_AT, face(SKYE_AT, MAX_SCENE), idle(s, 0.3), 'love', { lean: -0.12 });
  if (s > W.girl - 0.1 && s < W.single + 0.8) b.wave = 'L';
  if (s > B.r1 - 0.1) b.face = 'sad';
  return b;
}
function miaState(s) {
  const bob = 0.12 * Math.sin(s * 2.2), b = st(MIA_AT, face(MIA_AT, MAXP), [[A.sit, 0.5]], 'love', { grounded: false });
  b.pos = MIA_AT.clone().setY(WATER_Y - 0.65 + bob); b.rotZ = 0.05 * Math.sin(s * 1.7);
  if (s > W.liked - 0.1 && s < W.stay + 0.6) { b.wave = 'R'; b.talk = true; }
  if (s > B.r2 - 0.1) { b.face = 'sad'; b.wave = null; }
  return b;
}
function noobState(s) {
  const b = st(NOOB0, Math.PI, [[A.scheming, 0.5]], 'cool');
  if (s < B.throw - 0.2) { b.lean = 0.12; }
  else if (s < B.achoo) { b.layers = [[A.tool_lunge, clamp(s - B.throw + 0.2, 0, 1.5)]]; b.face = 'evil_grin'; if (s > B.achoo - 0.45) { b.layers = idle(s); b.face = 'scared'; } }
  else if (s < B.splash) {                                        // blasted into the pool
    const u = seg(s, B.achoo, B.splash); b.grounded = false; b.pos = NOOB0.clone().lerp(NOOB_L, u).add(V(0, 7 * 4 * u * (1 - u) + (1 - u) * 0, 0));
    b.rotX = -u * 5; b.layers = [[A.shock, 0.3]]; b.face = 'scared';
  } else {                                                        // floating on his back, both socked feet up
    b.grounded = false; b.pos = NOOB_L.clone().add(V(0, -0.15 + 0.1 * Math.sin(s * 2), 0)); b.rotY = 0.4; b.layers = [[A.knocked_out, 1]]; b.face = 'dizzy'; b.feetUp = true;
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
  if (x.wave) waveArm(a, tNow, x.wave);
  if (x.headShake) a.bones.Head.rotation.y += x.headShake;
  if (x.headTurn) a.bones.Head.rotation.y += x.headTurn;
  if (x.nod) a.bones.Head.rotation.x += x.nod;
  if (x.talk) a.bones.Head.rotation.x += 0.06 * Math.sin(tNow * 17);
  if (x.feetUp) { a.bones['Leg.L'].rotation.x -= 1.25; a.bones['Leg.R'].rotation.x -= 1.05; }
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face === 'think' ? 'suspicious' : x.face);
  if (a === max) talkMax(x.face, lipAt(tNow));                   // Max narrates: his mouth follows the voice
  else if (x.talk && a === leo) talkLeo(x.face, FLAP[Math.floor(tNow * 10) % FLAP.length]);
  else if (x.talk && a === mia) talkMia('love', FLAP[Math.floor(tNow * 10) % FLAP.length]);
  a.root.updateMatrixWorld(true);
}
// A point in an actor's space (x right, y up, z forward) in world space.
const local = (a, x, y, z) => { a.root.updateMatrixWorld(true); return V(x, y, z).applyMatrix4(a.root.matrixWorld); };
const handR = (a) => { a.bones['Arm.R'].updateMatrixWorld(true); return V(0, -2.05, 0).applyMatrix4(a.bones['Arm.R'].matrixWorld); };
const headAt = (a, y = 0.5) => { a.bones.Head.updateMatrixWorld(true); return V(0, y, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const noseTip = () => { nose.updateMatrixWorld(true); return V(0, -0.2, 0.62).applyMatrix4(nose.matrixWorld); };

// ---------- samples ----------
const ACTION = () => [[B.slam - 0.2, B.slam + 0.4], [B.drive, B.party], [B.throw, B.throw + 0.6], [B.achoo - 0.1, B.splash + 0.6], [B.driveBack, B.office], [B.bite - 0.2, B.bite + 0.4]];
export function samples(t) { return ACTION().some(([a, b]) => t > a && t < b) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; tNow = t; cam = stage.camera;
  const M = maxState(s), L = leoState(s), S = skyeState(s), MI = miaState(s), N = noobState(s);
  place(max, M); place(leo, L); place(skye, S); place(mia, MI); place(noob, N);
  // Nose: glows with the gamepass and when sniffing/following; swells for the sneeze; twitches at the end.
  const sniffPulse = (a, b) => (win(s, a, b) ? 0.07 * Math.max(0, Math.sin((s - a) * 9)) : 0);
  let glow = Math.max(0.75 * seg(s, B.logo, B.logo + 0.15), seg(s, B.pass, B.pass + 0.5)) * (1 - seg(s, B.caseIn - 0.3, B.caseIn));
  if (win(s, B.sniff, B.drive) || win(s, B.trailBack - 0.2, B.trailBack + 1)) glow = 0.8 + 0.2 * Math.sin(s * 12);
  if (s > B.twitch) glow = 0.9 + 0.1 * Math.sin(s * 15);
  const swell = win(s, B.throw + 0.4, B.achoo) ? 0.55 * easeIn(seg(s, B.throw + 0.4, B.achoo - 0.05)) + 0.04 * Math.sin(s * 40) : win(s, B.achoo, B.achoo + 0.25) ? 0.55 * (1 - seg(s, B.achoo, B.achoo + 0.25)) : 0;
  setNose(nose, { glow, inflate: swell + sniffPulse(0, B.logo + 0.5) + sniffPulse(B.sniff, B.trailOn), twitch: s > B.twitch ? Math.sin((s - B.twitch) * 30) * (1 - seg(s, B.twitch + 0.8, B.twitch + 1.4)) : 0 });

  // Mia's float, the police car lights, the alarm, water.
  floatRing.position.copy(MIA_AT).setY(WATER_Y + 0.15 + 0.12 * Math.sin(s * 2.2)); floatRing.rotation.z = s * 0.2;
  flashLights(cop, s, 1);
  alarmLight.intensity = 120; alarmLight.target.position.copy(alarm.position).add(V(Math.cos(s * 6) * 10, -8, Math.sin(s * 6) * 10));
  waterTex.offset.set(s * 0.03, s * 0.05);

  // Car + Max riding in it.
  const C = carAt(s); car.position.copy(C.pos); car.rotation.y = C.rotY; rollWheels(car, C.dist);

  // The evidence bag (with the sock): in Max's hands at nose height while sniffing; on show for the clue.
  bag.visible = !!M.bag;
  if (M.bag === 'side') { bag.position.copy(handR(max)).add(V(-0.15, -2.42, 0.25)); bag.rotation.set(0, max.root.rotation.y + 0.3, 0); }
  else if (M.bag) { const z = M.bag === 'show' ? 1.95 : 1.75; bag.position.copy(local(max, 0, M.bag === 'show' ? 2.55 : 1.75 + 0.06 * Math.sin(s * 9), z)); bag.rotation.set(0, max.root.rotation.y + (M.bag === 'show' ? 0.4 * Math.sin(s * 1.2) : 0), 0); }

  // Donut halves: Leo's (eaten through the reveal), the one slid across, then in Max's hand and bitten.
  const inOffice = s > B.office - 0.1;
  leoDonut.visible = inOffice; heldDonut.visible = inOffice && M.donut !== 'gone';
  if (inOffice) {
    if (L.donut === 'lowered') leoDonut.position.copy(local(leo, -0.9, 3.55, 1.6)); else leoDonut.position.copy(handR(leo).add(V(0, 0.15, 0)));
    leoDonut.rotation.set(1.2, 0.4, 0);
    const from = DESK.clone().add(V(0.6, DESK_TOP + 0.12, -1.4)), to = DESK.clone().add(V(0.3, DESK_TOP + 0.12, 1.5));
    if (M.donut === 'hand') { heldDonut.position.copy(handR(max).add(V(0, 0.2, 0))); heldDonut.rotation.set(1.3, 0, 0.2); }
    else { heldDonut.position.copy(from.clone().lerp(to, easeOut(seg(s, B.slide, B.slide + 0.6)))); heldDonut.rotation.set(0, s < B.slide ? 0 : -2 * easeOut(seg(s, B.slide, B.slide + 0.6)), 0); heldDonut.visible = heldDonut.visible && s > B.slide - 0.3; }
    heldDonut.scale.setScalar(0.55 * (s > B.bite ? 0.72 : 1) * (s > B.closed + 1.2 ? 0.75 : 1));
  }
  crumbs.forEach((c, i) => { const u = s - B.bite; c.visible = u > 0 && u < 0.9; if (!c.visible) return; const p0 = headAt(max, 0.2); const a = i * 0.8; c.position.set(p0.x + Math.cos(a) * u * 2, p0.y - 4 * u * u + 0.5 * u, p0.z + 0.8 + Math.sin(a) * u * 1.5); c.rotation.set(u * 9, i, u * 7); });

  // Smell trails.
  const lenA = trailA.len;
  if (s < B.trailOn) trailA.reveal(0, 0);
  else if (s < B.socks) {                                          // streams out ahead of Max; the end is wherever the Noob stands
    const head = s < B.drive ? lenA * 0.1 * easeOut(seg(s, B.trailOn, B.drive)) : s < B.party ? lerp(lenA * 0.1, lenA * 0.92, seg(s, B.drive, B.party)) : lenA;
    trailA.reveal(0, head);
  } else trailA.reveal(0, s < B.driveBack + 0.4 ? lenA : 0);
  trailA.mat.opacity = 0.75 + 0.15 * Math.sin(s * 8);
  trailB.reveal(0, s < B.trailBack ? 0 : s < B.driveBack ? trailB.len * 0.08 * seg(s, B.trailBack, B.driveBack) : s < B.office ? trailB.len : 0);
  trailB.mat.opacity = trailA.mat.opacity;
  trailC.reveal(0, inOffice && s < B.twitch ? trailC.len : 0); trailC.mat.opacity = 0.6;
  trailD.reveal(0, s > B.twitch + 0.3 ? trailD.len * easeOut(seg(s, B.twitch + 0.3, B.twitch + 1.2)) : 0); trailD.mat.opacity = 0.85;

  // Wisps: green smells rising from things at the crime scene, then all over the map.
  wisps.forEach((w, i) => {
    const near = win(s, W.smell - 0.4, W.map - 0.2), far = win(s, W.map - 0.2, B.caseIn), sniffing = win(s, B.sniff, B.trailOn);
    w.visible = near || far || sniffing; if (!w.visible) return;
    const ph = ((s * 0.6 + i * 0.137) % 1);
    if (sniffing) { const tip = noseTip(), src = bag.position.clone().add(V(0, 1.4, 0)); const p = src.clone().lerp(tip, ph); w.position.copy(p).add(V(0.2 * Math.sin(i + s * 5), 0.15 * Math.cos(i * 2 + s * 6), 0)); w.scale.setScalar(0.35 * (1 - ph) + 0.1); w.material.opacity = 0.7 * (1 - ph * 0.5); return; }
    const srcs = far ? MAP_SRC : WISP_SRC, src = srcs[i % srcs.length], k = far ? 4 : 1;
    w.position.set(src.x + Math.sin(ph * 8 + i) * 0.8 * k, src.y + ph * 6 * k, src.z + Math.cos(ph * 8 + i) * 0.8 * k);
    w.scale.setScalar((0.9 + 1.2 * ph) * k); w.material.opacity = 0.75 * (1 - ph);
  });
  // Pepper: thrown from the Noob's hand into Max's nose, then hanging round it until the sneeze.
  pepper.forEach((p, i) => {
    const u = s - B.throw; p.visible = u > 0 && s < B.achoo + 0.15; if (!p.visible) return;
    const from = NOOB0.clone().add(V(0, 3.6, -1.6)), to = noseTip(), k = clamp(u / 0.45), a = i * 2.4;
    p.position.copy(from.clone().lerp(to, easeOut(k))).add(V(Math.cos(a) * (0.2 + 0.6 * k), Math.sin(a * 1.3) * (0.2 + 0.5 * k), Math.sin(a) * 0.3));
    p.scale.setScalar(0.6 + 0.8 * k); p.material.opacity = 0.85;
  });
  // ACHOO shockwave ring.
  const ru = (s - B.achoo) / 0.5; ring.visible = ru > 0 && ru < 1;
  if (ring.visible) { ring.position.copy(noseTip()); ring.rotation.set(0, 0, 0); ring.scale.setScalar(1 + 9 * easeOut(ru)); ring.material.opacity = 0.85 * (1 - ru); }
  // Splash where the Noob lands; dust puffs for the car skid.
  splash.forEach((p, i) => {
    const u = (s - B.splash) / 1.0; p.visible = u > 0 && u < 1; if (!p.visible) return;
    const a = i * 2.39, r2 = (0.6 + (i % 5) * 0.5) * (0.4 + 2 * easeOut(u)), h = (1.5 + (i % 4) * 1.4) * 4 * u * (1 - u);
    p.material.color.set('#e8fbff'); p.material.emissive.set('#bfefff'); p.position.set(NOOB_L.x + Math.cos(a) * r2, WATER_Y + h, NOOB_L.z + Math.sin(a) * r2);
    p.scale.setScalar((0.25 + 0.2 * (i % 3)) * (1 - 0.5 * u)); p.material.opacity = 0.85 * (1 - u);
  });
  puffs.forEach((p, i) => {
    const u = (s - B.office) / 0.8; p.visible = false; if (!p.visible || u > 1) return;
    p.material.color.set('#e6d6c0'); const a = i * 0.7; p.position.set(CAR0.x + 2 + Math.cos(a) * (2 + 3 * u), 0.8 + u, CAR0.z + Math.sin(a) * 2 * u); p.scale.setScalar(1.2 + u); p.material.opacity = 0.7 * (1 - u);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const look = (p, tg, fov = 40, ext = 30) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const mh = headAt(max), mp = max.root.position, lh = headAt(leo);
  stage.bloom.strength = 0.35;
  switch (shot.id) {
    case 'hook': { const k = easeInOut(seg(s, B.logo - 0.12, B.logo + 0.08));    // crash zoom onto the nose on "this"
      look(mh.clone().add(V(lerp(2.6, 1.8, k), lerp(-0.8, -0.55, k), lerp(5.4, 3.8, k))).add(jolt(B.logo, 0.12, 0.4)), mh.clone().add(V(lerp(-0.75, -0.1, k), lerp(-0.75, -0.3, k), lerp(0.6, 0.9, k))), lerp(40, 38, k), 25); break; }
    case 'gamepass': look(mh.clone().add(V(2.4, -0.8, 5.0)), mh.clone().add(V(-0.2, -0.75, 0.6)), 40); break;
    case 'wisps': look(V(-5, 5.5, 15), V(4, 3.5, 1), 50, 30); break;
    case 'map': look(V(lerp(-60, -40, u), 110, lerp(-40, -20, u)), V(0, 0, 150), 48, 200); break;
    case 'caseEmpty': look(CASE_AT.clone().add(V(5, 9, 15)), CASE_AT.clone().add(V(0, 7.2, 0)), 44); break;
    case 'chief': look(lh.clone().add(V(-2.2, 0.6, 6.5)).add(jolt(B.slam, 0.25)), lh.clone().add(V(0, -1, 0)), 42); break;
    case 'skye': look(V(-3.9, 5.4, -0.2), headAt(skye, 0).add(V(0, -0.6, 0)), 40, 25); break;
    case 'tempt1': look(V(9.8, 5.3, 10.4), mh.clone().add(V(0, -0.7, 0)), 40, 25); break;
    case 'clue': look(bag.position.clone().add(V(lerp(1.5, 0.8, u), 1.3, 4.2)), bag.position.clone().add(V(0, 1.1, 0)), 40); break;
    case 'sniff': look(mh.clone().add(V(2.8, 0.1, 3.2)), mh.clone().add(V(0, -0.5, 1.0)), 40); break;
    case 'trailOn': look(V(14, 14, 30), V(-2, 0, 12), 48, 40); break;
    case 'drive': { const c = C.pos; look(c.clone().add(V(10, 4.5, 8)), c.clone().add(V(0, 2.4, 1)), 46, 30); break; }
    case 'party': look(V(14, 12, 300), V(-6, 2, 334), 50, 50); break;
    case 'mia': look(MIA_AT.clone().add(V(6, 3.4, -9.5)), MIA_AT.clone().add(V(0, 1.2, 0)), 40); break;
    case 'tempt2': look(mh.clone().add(V(-4, 0.4, 3.6)), mh.clone().add(V(0, -0.8, 0)), 40); break;
    case 'suspect': { const nh = headAt(noob), k = easeInOut(seg(s, W.guy1, W.guy1 + 0.2)); look(nh.clone().add(V(-2.5, lerp(-2.6, -0.8, k), lerp(-9, -4.5, k))), nh.clone().add(V(0, -0.6 + 0.4 * k, 0)), 40); break; }
    case 'stare': look(mh.clone().add(V(-0.6, 0.05, 2.6)), mh.clone().add(V(0, 0, 0.5)), 34); break;
    case 'fight': look(V(12.5, 6.2, lerp(312, 314.5, u)), V(7.6, 3.4, 329), 42, 30); break;
    case 'achoo': look(V(12.5, lerp(6.2, 8, u), lerp(314.5, 312, u)).add(jolt(B.achoo, 0.9, 0.6)).add(jolt(B.splash, 0.5)), V(7.6, 2.6, 334), 46, 30); break;
    case 'socks': look(MAXE.clone().add(V(9, 7, -3)), NOOB_L.clone().add(V(-1.5, 0.5, -2.5)), 44); break;
    case 'driveBack': { const c = C.pos; look(c.clone().add(V(-11, 5, -9)), c.clone().add(V(0, 2.2, -1)), 46, 30); break; }
    case 'office': look(OFF.clone().add(V(-2, 7.5, 20)), OFF.clone().add(V(2, 4, -3)), 46, 30); break;
    case 'feet': look(DESK.clone().add(V(2.6, 2.1, 5.6)), DESK.clone().add(V(0, 2.3, -1.4)), 40, 10); break;
    case 'faceS': look(lh.clone().add(V(-0.9, 0.1, 4.4)), lh.clone().add(V(0, -0.2, 0.4)), 36); break;
    case 'halfS': look(leoDonut.position.clone().add(V(1.6, 0.9, 4.4)), leoDonut.position.clone().add(V(0.4, 0.6, 0)), 38); break;
    case 'talk': look(lh.clone().add(V(2.4, 0.4, 6)), lh.clone().add(V(0, -0.9, 0)), 40); break;
    case 'slide': look(DESK.clone().add(V(5.2, 8, 3)), DESK.clone().add(V(0, DESK_TOP, 0.4)), 44); break;
    case 'tempt3': { const k = easeInOut(u); look(DESK.clone().add(V(lerp(-1.6, -1.0, k), DESK_TOP + lerp(0.9, 1.3, k), lerp(-0.6, 0.2, k))), mh.clone().add(V(0, -0.8 + 0.3 * k, 0)).lerp(heldDonut.position, 0.25 * (1 - k)), 40); break; }
    case 'principle': case 'bite': look(mh.clone().add(V(2.4, -0.4, -5.4)), mh.clone().add(V(0.4, -1.0, -0.8)), 40); break;
    case 'closed': look(OFF.clone().add(V(-1, 6.5, 15)), OFF.clone().add(V(5, 4, -1.5)), 44); break;
    case 'twitch': look(mh.clone().add(V(2.2, 0.15, -4.2)), mh.clone().add(V(0.2, -0.2, -0.6)), 38); break;
    case 'cta': look(OFF.clone().add(V(4, 9, 22)), OFF.clone().add(V(-4, 2.5, 0)), 48, 35); break;
    default: look(V(0, 6, 25), V(0, 3, 0), 44);
  }
  // Don't let the interior set show the outdoor sky through the open side: fog off indoors.
  if (SHOT === 'feet') max.root.visible = false;            // the insert under the desk: Max stands where the camera is
  const indoors = inOffice || win(s, B.caseIn, B.scene);
  frontWall.visible = ['tempt3', 'principle', 'bite', 'twitch'].includes(SHOT);
  stage.scene.fog.near = indoors ? 3000 : 160; stage.scene.fog.far = indoors ? 6000 : 700;
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435', font = 'Luckiest Guy', sw = 0.2 } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "${font}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * sw * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
const pop = (t, at, d = 0.15, k = 3) => easeOutBack(clamp((t - at) / d), k);
const fade = (t, at, hold) => 1 - inv(at + hold - 0.2, at + hold, t);
function word(g, s, t, at, hold, text, col, size = 140, y = 780, rot = -0.06) { const a = t - at; if (a < 0 || a > hold) return; bigText(g, s, text, 540, y, size, col, { k: pop(t, at), alpha: fade(t, at, hold), rot }); }
function pill(g, s, x, y, text, bg, fg = '#ffffff', size = 40, k = 1) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s;
  g.translate(x * s, y * s); g.scale(k, k);
  roundRect(g, 0, 0, w, (size + 34) * s, 20 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, 20 * s, ((size + 34) / 2 + 3) * s); g.restore();
  return w / s;
}
function tagOver(g, s, p3, text, bg, k = 1, dy = 0) {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.translate(p.x, p.y + dy * s); g.scale(k, k); g.font = `${38 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 34 * s;
  roundRect(g, -w / 2, -30 * s, w, 60 * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s);
  g.beginPath(); g.moveTo(-12 * s, 30 * s); g.lineTo(12 * s, 30 * s); g.lineTo(0, 50 * s); g.fillStyle = bg; g.fill(); g.restore();
}
// Speech bubble above a character (projected head), clamped clear of the captions and the right-hand UI.
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
function logo(g, s, t) {
  const a = t - B.logo, end = W.super + 0.05; if (a < 0 || t > end) return;
  const k = a < 0.14 ? lerp(2.4, 1, easeIn(a / 0.14)) : 1 + 0.04 * Math.exp(-(a - 0.14) * 8) * Math.sin((a - 0.14) * 50), al = fade(t, B.logo, end - B.logo);
  bigText(g, s, 'DETECTIVE', 520, 380, 64, '#ffffff', { k, alpha: al, rot: -0.06 });
  bigText(g, s, 'MAX', 470, 470, 150, '#FFD23F', { k, alpha: al, rot: -0.06, stroke: '#1a1208', sw: 0.18 });
  bigText(g, s, 'SNIFFWELL', 520, 600, 150, '#FFD23F', { k, alpha: al, rot: -0.06, stroke: '#1a1208', sw: 0.18 });
}
function gamepass(g, s, t) {
  if (t < B.pass + 0.1 || t > W.smell - 0.1) return; const k = pop(t, B.pass + 0.1, 0.25, 2), a = fade(t, B.pass, W.smell - 0.1 - B.pass);
  g.save(); g.globalAlpha = a; g.translate(540 * s, 960 * s); g.scale(0.85 * k, 0.85 * k);
  roundRect(g, -380 * s, -230 * s, 760 * s, 460 * s, 30 * s); g.fillStyle = 'rgba(30,32,38,.95)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#4b4f5a'; g.stroke();
  g.fillStyle = '#ffffff'; g.font = `800 ${34 * s}px Montserrat`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('Gamepass', -340 * s, -180 * s);
  g.beginPath(); g.arc(-220 * s, -10 * s, 110 * s, 0, 7); g.fillStyle = '#1e7a3c'; g.fill(); g.fillStyle = '#7dffa0';
  g.beginPath(); g.moveTo(-250 * s, -90 * s); g.lineTo(-175 * s, 40 * s); g.quadraticCurveTo(-170 * s, 80 * s, -215 * s, 75 * s); g.lineTo(-262 * s, 60 * s); g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.font = `${60 * s}px "Luckiest Guy"`; g.fillText('SUPER NOSE', -80 * s, -60 * s);
  g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9ccd6'; g.fillText('Smell anything', -80 * s, 0); g.fillText('on the map.', -80 * s, 38 * s);
  roundRect(g, -340 * s, 125 * s, 680 * s, 76 * s, 16 * s); g.fillStyle = '#2fbf5b'; g.fill();
  g.fillStyle = '#ffffff'; g.font = `${44 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.fillText(t > B.pass + 0.45 ? 'OWNED ✓' : 'BUY', 0, 166 * s);
  g.restore();
}
function caseFile(g, s, t) {
  const t0 = W.golden1 - 0.2; if (t < t0 || t > B.chief) return; const k = pop(t, t0, 0.22, 2), a = fade(t, t0, B.chief - t0);
  g.save(); g.globalAlpha = a; g.translate(540 * s, 520 * s); g.rotate(-0.04); g.scale(0.8 * k, 0.8 * k);
  roundRect(g, -360 * s, -200 * s, 720 * s, 400 * s, 18 * s); g.fillStyle = '#e9c98b'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#8a6a2a'; g.stroke();
  roundRect(g, -360 * s, -240 * s, 260 * s, 60 * s, 14 * s); g.fillStyle = '#e9c98b'; g.fill();
  g.fillStyle = '#3a2a10'; g.font = `${48 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CASE #1', 0, -130 * s);
  g.font = `${76 * s}px "Luckiest Guy"`; g.fillStyle = '#b8860b'; g.fillText('THE GOLDEN DONUT', 0, -40 * s);
  g.restore();
  if (t > W.stole - 0.05) bigText(g, s, 'STOLEN', 600, 640, 110, '#e0303a', { k: pop(t, Math.max(W.stole, W.donut1 - 0.1), 0.12, 4), rot: -0.15, stroke: '#5a0a10', alpha: a });
}
function smellIcon(g, s, t, at, kind, x, y) {
  if (t < at || t > B.trailOn) return; const k = pop(t, at, 0.2, 3); g.save(); g.translate(x * s, y * s); g.scale(k, k); g.rotate(Math.sin(t * 3 + x) * 0.06);
  g.beginPath(); g.arc(0, 0, 105 * s, 0, 7); g.fillStyle = 'rgba(24,60,36,.9)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#5dff8a'; g.stroke();
  if (kind === 'cologne') { roundRect(g, -40 * s, -20 * s, 80 * s, 85 * s, 16 * s); g.fillStyle = '#c18cff'; g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(-16 * s, -52 * s, 32 * s, 32 * s); g.fillStyle = '#ffffff'; g.globalAlpha = 0.5; g.fillRect(-28 * s, -10 * s, 12 * s, 60 * s); }
  if (kind === 'bad') { g.fillStyle = '#ff4d5e'; g.font = `${130 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?!', 0, 12 * s); }
  if (kind === 'tue') { roundRect(g, -55 * s, -50 * s, 110 * s, 110 * s, 12 * s); g.fillStyle = '#ffffff'; g.fill(); g.fillStyle = '#e0303a'; g.fillRect(-55 * s, -50 * s, 110 * s, 30 * s); g.fillStyle = '#152435'; g.font = `${44 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TUE', 0, 22 * s); g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(46 * s, -62 * s, 24 * s, 0, 7); g.fill(); g.fillStyle = 'rgba(24,60,36,1)'; g.beginPath(); g.arc(58 * s, -70 * s, 20 * s, 0, 7); g.fill(); }
  g.restore();
}
function hpBars(g, s, t) {
  if (!win(t, B.fight, B.socks)) return;
  const bar = (x, label, hp, col) => { pill(g, s, x, 300, label, 'rgba(21,36,53,.9)', '#ffffff', 34); roundRect(g, x * s, 380 * s, 360 * s, 34 * s, 12 * s); g.fillStyle = 'rgba(21,36,53,.85)'; g.fill(); roundRect(g, (x + 4) * s, 384 * s, 352 * hp * s, 26 * s, 10 * s); g.fillStyle = col; g.fill(); };
  bar(60, 'MAX', 1 - 0.15 * seg(t, B.throw + 0.4, B.throw + 0.6), '#3cdc6a');
  bar(500, 'SUNGLASSES GUY', 1 - seg(t, B.splash - 0.1, B.splash + 0.2), '#ff4d5e');
  if (t > B.splash && t < B.splash + 1) bigText(g, s, '-100', 700, 470 - 80 * (t - B.splash), 90, '#ff4d5e', { alpha: 1 - (t - B.splash) });
}
function hud(g, s, t) {
  if (t < B.caseIn || t > B.cta) return;
  pill(g, s, 60, 250, 'CASE #1: GOLDEN DONUT', 'rgba(21,36,53,.88)', '#FFD23F', 36);
  let y = 330;
  if (t > B.r1 - 0.05 && !win(t, B.fight, B.socks)) {
    const n = resisted(t), eaten = t > B.bite + 0.1, glitch = win(t, B.bite + 0.1, B.bite + 0.45);
    const text = eaten && !glitch ? 'DONUTS EATEN: 1' : glitch && Math.floor(t * 30) % 2 ? 'TEMPTATIONS RESIS?#!' : `TEMPTATIONS RESISTED: ${n}`;
    const k = 1 + 0.3 * (1 - clamp((t - (n === 1 ? B.r1 : B.r2)) / 0.3)) * (t < B.r2 + 0.3 ? 1 : 0);
    pill(g, s, 60, y, text, eaten ? 'rgba(232,170,40,.95)' : 'rgba(214,52,110,.92)', '#ffffff', 36, k);
    if (win(t, B.tempt3, B.bite) && Math.floor(t * 3) % 2) bigText(g, s, '...', 640, y + 32, 64, '#ffffff');
    y += 80;
  }
  if (win(t, B.trailOn, B.office + 0.6)) {
    let m;
    if (t < B.socks) m = Math.round(lerp(1200, 0, clamp((t - B.trailOn) / (W.ended - B.trailOn)))); else if (t < B.trailBack) m = 0;
    else m = Math.round(lerp(1200, 0, seg(t, B.trailBack, B.office)));
    if (t > B.socks && t < B.trailBack) m = 0;
    pill(g, s, 60, y, `TRAIL: ${m.toLocaleString('en-US')} M`, 'rgba(30,140,70,.92)', '#ffffff', 36);
  }
}
export function overlay(g, s, t) {
  hud(g, s, t);
  logo(g, s, t); gamepass(g, s, t); caseFile(g, s, t);
  if (SHOT === 'chief') bubble(g, s, t, headAt(leo, 1), ['NOT A WORD', 'TO THE PRESS!'], W.wanted - 0.2, B.scene, { size: 54 });
  if (SHOT === 'skye') bubble(g, s, t, headAt(skye, 1), ['I like your vibe.', 'Are you single?'], W.girl - 0.1, B.scene + 20, { heart: true });
  if (SHOT === 'tempt1' && t > B.stop1) tagOver(g, s, headAt(max, 1.6), 'ON A CASE', 'rgba(21,36,53,.92)', pop(t, B.stop1, 0.2, 2.5));
  if (SHOT === 'clue') { tagOver(g, s, bag.position.clone().add(V(0, 3.0, 0)), 'CLUE: 1 SOCK', 'rgba(224,48,58,.95)', pop(t, W.sock1 - 0.1, 0.2, 2.5)); }
  smellIcon(g, s, t, W.cologne - 0.1, 'cologne', 230, 560); smellIcon(g, s, t, W.decisions - 0.15, 'bad', 540, 470); smellIcon(g, s, t, W.tuesday - 0.1, 'tue', 830 - 60, 600);
  if (SHOT === 'mia') bubble(g, s, t, headAt(mia, 1), ['Love the nose, detective.', 'Stay for a swim?'], W.liked - 0.15, B.miaShot + 20, { heart: true, size: 44 });
  if (SHOT === 'tempt2' && t > B.stop2) tagOver(g, s, headAt(max, 1.6), 'ON A CASE', 'rgba(21,36,53,.92)', pop(t, B.stop2, 0.2, 2.5));
  if (SHOT === 'suspect' && t > W.guy1) tagOver(g, s, noob.root.position.clone().add(V(0, 0.4, 0)), 'TRAIL ENDS', 'rgba(30,140,70,.92)', pop(t, W.guy1, 0.2, 2.5));
  hpBars(g, s, t);
  word(g, s, t, B.throw + 0.1, 0.8, 'PEPPER!', '#ff8a3a', 120, 520, 0.05);
  word(g, s, t, B.achoo, 1.0, 'ACHOO!', '#9dffb8', 190, 640, -0.08);
  if (SHOT === 'socks' && t > W.socks - 0.2) { tagOver(g, s, local(noob, 0.5, 0.2, 0).add(V(0, 2.2, 0)), 'SOCK ✓', 'rgba(30,140,70,.92)', pop(t, W.socks - 0.2, 0.2, 2.5)); tagOver(g, s, local(noob, -0.5, 0.2, 0).add(V(0, 3.4, 0)), 'SOCK ✓', 'rgba(30,140,70,.92)', pop(t, W.socks, 0.2, 2.5)); }
  if (SHOT === 'socks' && t > W.guy2 - 0.1) bigText(g, s, 'NOT MY GUY', 540, 520, 110, '#ffffff', { k: pop(t, W.guy2 - 0.1, 0.18, 2.5), rot: -0.05 });
  if (SHOT === 'feet') tagOver(g, s, local(leo, -0.5, 2.0, 2.3), '1 SOCK', 'rgba(224,48,58,.95)', pop(t, B.feet + 0.2, 0.2, 2.5));
  if (SHOT === 'faceS') tagOver(g, s, headAt(leo, 1.4), 'SPRINKLES', 'rgba(224,48,58,.95)', pop(t, W.sprinkles, 0.2, 2.5));
  if (SHOT === 'halfS') tagOver(g, s, leoDonut.position.clone().add(V(0, 0.9, 0)), '½ GOLDEN DONUT', 'rgba(224,48,58,.95)', pop(t, W.half, 0.2, 2.5));
  if (SHOT === 'talk') bubble(g, s, t, headAt(leo, 1), ['This case is', 'going away.'], W.said - 0.15, B.slide + 5);
  if (SHOT === 'slide') bubble(g, s, t, headAt(leo, 1), ["Here's your cut."], W.cut - 0.4, B.tempt3 + 5);
  if (t > B.closed) { const k = t - B.closed < 0.12 ? lerp(2.6, 1, easeIn((t - B.closed) / 0.12)) : 1; if (t < B.twitch + 0.3) { g.save(); g.globalAlpha = 0.92; bigText(g, s, 'CASE CLOSED', 540, 720, 140, '#e0303a', { k, rot: -0.14, stroke: '#ffffff', sw: 0.12 }); g.restore(); } }
  if (t > B.twitch + 0.1 && t < B.cta) word(g, s, t, B.twitch + 0.1, B.cta - B.twitch, '!', '#5dff8a', 220, 560);
  // Call to action.
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 700 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -200 * s, 840 * s, 400 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 80 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 128 * s);
    g.restore();
    bigText(g, s, 'NEXT CASE...', 540, 570, 76, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 680, 64, '#ffffff', { k: k2 });
  }
  flash(g, s, (t >= B.logo && t < B.logo + 0.08) || (t >= B.achoo && t < B.achoo + 0.1) ? 0.4 : 0, '#ffffff');
  if (['drive', 'driveBack'].includes(SHOT)) speedLines(g, s, t, 0.35, { cx: 540, cy: 900 });
}

export const cast = () => ({ max, leo, skye, mia, noob });
