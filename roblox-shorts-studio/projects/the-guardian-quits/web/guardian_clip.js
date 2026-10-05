// The Guardian Quits (standalone): Steal an Egg told by the guardian. Web renderer + Roblox R6 pack + the game's own
// T-rex and eggs (creatures/trex, props/egg_trex). Beat times come from web/beats.js (source/beats.py: narration word
// timings), so the clip retimes itself.
// The T-rex loses its egg at the safe-zone wall every day (BONK), gets a one-star review after 400 thefts, puts on
// sunglasses, a hoodie and a "Player" name tag, is waved through the safe zone and takes every egg back from the bases
// (Leo bonks off him). All 400 hatch at once, so he quits to guard Leo's base from a treadmill with snacks and brainrot
// videos; his kids guard the egg now (a baby bonks the wall in the last shot).
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, cloud, sign, puff, canvasTexture, neonMaterial } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem } from '../../../web/lib/robloxPack.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { makeNest } from '../../../web/lib/trex.js';
import { loadCreature, poseCreature, creatureLowest, creaturePoint, attachToBody } from '../../../web/lib/creature.js';
import { trexIdle, trexSleep, trexRoar, trexRun, trexHeadbutt, mixPose, TREX_STRIDE } from '../../../web/lib/trexPoses.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Guardian Quits' };
export const sky = { zenith: '#3d7fd6', horizon: '#ffd9a8', below: '#f3e6d0', fog: '#f2dcc0' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));

// ---------- layout (nest at the origin; the safe zone at +Z; the bases behind it) ----------
const REXS = 1.6, BABY = 0.26, HEAD = 12.9 * REXS;              // HEAD: snout reach in front of the root
const EGG_HOME = V(0, 0.8, 0), NEST_R = 5.5;
const GUARD = V(-9, 0, -10), GUARD_ROT = face(V(-9, 0, -10), V(0, 0, 4));
const SAFE_Z = 44, WALL_STOP = SAFE_Z - HEAD + 1.5;               // root z where the snout meets the wall
const LEO_BASE = V(0, 0, 64), BASE_ROWS = [64, 98, 132], BASE_COLS = [-40, 0, 40];
const PEDS = []; for (const z of [-5, 1]) for (const x of [-9, -3, 3, 9]) PEDS.push(LEO_BASE.clone().add(V(x, 0, z)));
const JOB = V(0, 0, 86), TV_AT = V(-27, 0, 86);                  // treadmill job behind Leo's base

// ---------- beats (all from narration words) ----------
const B = {
  grab: W.steals + 0.05, run: W.steals + 0.35, chase: W.chase - 0.3, cross: W.safe + 0.1, bonk: W.bonk,
  day2: W.cross - 0.3, stolen: W.month - 0.2, review: W.boss - 0.1,
  glasses: W.sunglasses - 0.05, hoodie: W.hoodie - 0.05, tag: W.tag - 0.05, scan: W.read - 0.2, through: W.through - 0.1,
  bases: W.behind - 0.25, leo: W.leos - 0.25, took: W.took - 0.1, leoRun: W.chased - 0.3, leoBonk: W.stop + 0.1,
  home: W.home - 0.3, five: W.stars - 0.2, wobble: W.hatched - 0.8, hatch: W.hatched + 0.05, swarm: W.baby - 0.2,
  quit: W.quit - 0.2, hired: W.hired, job: W.snacks - 0.35, best: W.best - 0.25, kids: W.kids - 0.6, cta: W.follow,
};
const babyBonk = () => B.kids + 2.0;

const SHOTS = [
  [0, 'hook'], [W.steals - 0.25, 'steal'], [B.chase, 'chase'], [W.safe - 0.5, 'bonk'], [B.day2, 'line'], [B.stolen, 'stolen'], [B.review, 'review'],
  [W.disguise - 0.3, 'disguise'], [B.scan, 'scan'], [B.bases, 'bases'], [B.leo, 'leoBase'], [B.leoRun, 'leoChase'], [B.home, 'home'],
  [B.wobble, 'hatch'], [B.swarm, 'swarm'], [B.quit, 'quit'], [B.hired - 0.1, 'hired'], [B.job, 'job'], [B.best, 'best'], [B.kids, 'kids'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, rex, babies = [], leo, max, mia, noob, cam, heroEgg, pedEggs = [], backEggs = [], moundEggs = [], farEggs = [], wall, wallMat, scanMat, scan,
  glasses, hoodie, tread, treadBelt, tv, tvCtx, tvTex, snacks, SHOT = 'hook', BODIES;
const puffs = [], shells = [];

function palm(scene, x, z, h, r) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) { const s = part(1.4 - i * 0.08, h / 6 + 0.1, 1.4 - i * 0.08, i % 2 ? '#8a5a32' : '#7a4e2a', { center: true }); s.position.set(i * 0.25, (i + 0.5) * h / 6, 0); g.add(s); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + r, leaf = part(1.6, 0.3, 7, '#3f8f3a', { center: true }); leaf.position.set(1.5 + Math.cos(a) * 3, h + 0.2, Math.sin(a) * 3); leaf.rotation.set(0.35, -a + Math.PI / 2, 0); g.add(leaf); }
  g.position.set(x, 0, z); scene.add(g);
}
function fern(scene, x, z, s) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, f = part(0.8 * s, 0.2, 3.4 * s, i % 2 ? '#4fa046' : '#3c8a37', { center: true }); f.position.set(Math.cos(a) * 1.4 * s, 0.9 * s, Math.sin(a) * 1.4 * s); f.rotation.set(-0.5, -a + Math.PI / 2, 0); g.add(f); }
  g.position.set(x, 0, z); scene.add(g);
}
function makeTreadmill() {
  const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.6 }), steel = new THREE.MeshStandardMaterial({ color: '#b9c0cc', metalness: 0.6, roughness: 0.3 });
  const beltTex = canvasTexture(64, 512, (x, w, h) => { x.fillStyle = '#16181d'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a3f4a'; for (let i = 0; i < 8; i++) x.fillRect(0, i * 64, w, 14); });
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping; beltTex.repeat.set(1, 4);
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(12, 1.6, 46), dark, 0, 0.8, 0);
  treadBelt = add(new THREE.BoxGeometry(10.4, 0.1, 44), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 }), 0, 1.66, 0);
  for (const x of [-6, 6]) { add(new THREE.BoxGeometry(0.5, 6, 0.5), steel, x, 4.6, -21); add(new THREE.BoxGeometry(0.5, 0.5, 10), steel, x, 7.4, -16.5); }
  add(new THREE.BoxGeometry(12.5, 2.6, 0.8), dark, 0, 7.6, -21.5);
  return g;
}
function drawTV(t) {
  const c = tvCtx, w = 768, h = 432;
  c.fillStyle = `hsl(${(t * 80) % 360},80%,55%)`; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) {
    const a = t * (1.3 + i * 0.4) + i, x = w / 2 + Math.cos(a) * (120 + i * 30), y = h / 2 + Math.sin(a * 1.3) * (80 + i * 10), r = 34 + 12 * Math.sin(t * 5 + i);
    c.fillStyle = `hsl(${(i * 53 + t * 120) % 360},90%,60%)`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.15, r * 0.14, 0, 7); c.arc(x + r * 0.3, y - r * 0.15, r * 0.14, 0, 7); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = 5; c.beginPath(); c.arc(x, y + r * 0.1, r * 0.45, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.font = '64px "Luckiest Guy"'; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = '#111'; c.fillStyle = '#fff';
  const words = ['SKIBIDI?', 'SO RANDOM', 'NO WAY', 'BRAINROT TV'], wd = words[Math.floor(t * 1.5) % words.length];
  c.strokeText(wd, w / 2, 80); c.fillText(wd, w / 2, 80);
  tvTex.needsUpdate = true;
}
async function placed(kind, name, pos, k = 1, ry = 0) { const o = await packItem(kind, name); o.position.copy(pos); o.scale.setScalar(k); o.rotation.y = ry; return o; }

export async function setup(stage) {
  const { scene } = stage; const r = rng(17);
  scene.fog.near = 220; scene.fog.far = 820;
  scene.add(part(520, 4, 520, '#6aa84f'));
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(22, 48), new THREE.MeshStandardMaterial({ color: '#a68a5a', roughness: 1 })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, 0.03, -2); dirt.receiveShadow = true; scene.add(dirt);
  const volc = new THREE.Mesh(new THREE.ConeGeometry(80, 100, 9, 1, true), new THREE.MeshStandardMaterial({ color: '#5a4a44', roughness: 1, flatShading: true })); volc.position.set(-90, 34, -240); scene.add(volc);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 4, 9), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a10', emissiveIntensity: 2 })); glow.position.set(-90, 83, -240); scene.add(glow);
  for (let i = 0; i < 11; i++) { const c = part(24 + r() * 20, 24 + r() * 40, 22, i % 2 ? '#8a7360' : '#7a6552', { center: true }); c.position.set(-190 + i * 38, 12, -140 - r() * 30); scene.add(c); }
  for (const [x, z, h] of [[-46, -26, 19], [40, -34, 21], [56, 8, 17], [-56, 20, 18], [-28, -58, 23], [26, -64, 20], [70, 40, 18], [-70, 40, 19]]) palm(scene, x, z, h, r() * 3);
  for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, d = 26 + r() * 40; fern(scene, Math.cos(a) * d, Math.sin(a) * d * 0.6 - 8, 0.8 + r() * 0.8); }
  for (let i = 0; i < 14; i++) { const c = cloud(300 + i, 10 + r() * 10); c.position.set(-220 + r() * 440, 80 + r() * 60, -280 + r() * 140); scene.add(c); }

  // Nest and the egg (the game's T-rex egg).
  const nest = makeNest(NEST_R); scene.add(nest.group);
  heroEgg = await placed('props', 'egg_trex', EGG_HOME, 0.42); scene.add(heroEgg);
  const halo = new THREE.PointLight('#ffc040', 26, 12, 2); halo.position.copy(EGG_HOME).add(V(0, 5, 0)); scene.add(halo);

  // The safe zone: glowing strip, the wall the guardian can't pass, and a scanner frame.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(200, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: '#3cff8a', emissive: '#2cff7a', emissiveIntensity: 1.6 })); strip.position.set(0, 0.08, SAFE_Z); scene.add(strip);
  wallMat = new THREE.MeshBasicMaterial({ color: '#5dff9e', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 28), wallMat); wall.position.set(0, 14, SAFE_Z); wall.renderOrder = 6; scene.add(wall);
  const zs = sign('SAFE ZONE', { w: 9, h: 2.2, post: 5, bg: '#123d24', accent: '#3cff8a' }); zs.position.set(-24, 0, SAFE_Z + 1); scene.add(zs);
  scanMat = new THREE.MeshBasicMaterial({ color: '#3cff8a', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  scan = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.2), scanMat); scan.rotation.x = -Math.PI / 2; scan.renderOrder = 7; scene.add(scan);

  // The bases behind the safe zone: plots with pedestals, every one holding one of his eggs.
  const eggProto = await packItem('props', 'egg_trex');
  const egg = (p, k = 0.3) => { const e = eggProto.clone(); e.position.copy(p); e.scale.setScalar(k); scene.add(e); return e; };
  const names = { '0,64': "LEO'S BASE", '-40,64': 'NOOB', '40,64': 'MIA', '-40,98': 'MAX', '0,98': 'BACON', '40,98': 'GUEST', '-40,132': 'ZOE', '0,132': 'KAI', '40,132': 'PRO' };
  for (const z of BASE_ROWS) for (const x of BASE_COLS) {
    const plot = part(30, 0.6, 22, x === 0 && z === 64 ? '#d7c9a6' : '#cfd5de'); plot.position.set(x, 0.6, z); scene.add(plot);
    const sg = sign(names[`${x},${z}`], { w: 8, h: 2, post: 3.4, bg: '#152435', accent: x === 0 && z === 64 ? '#ff9e80' : '#7fe3dd' }); sg.position.set(x - 9, 0.6, z - 11.6); sg.rotation.y = Math.PI; scene.add(sg);
    if (x === 0 && z === 64) continue;
    for (let i = 0; i < 6; i++) { const p = V(x - 10 + (i % 3) * 10, 0, z - 3 + Math.floor(i / 3) * 7); const ped = part(2.4, 1.4, 2.4, '#f4f4f8', { center: true }); ped.position.copy(p).add(V(0, 1.3, 0)); scene.add(ped); farEggs.push(egg(p.clone().add(V(0, 2.0, 0)), 0.26)); }
  }
  for (const p of PEDS) { const ped = part(2.4, 1.4, 2.4, '#f4f4f8', { center: true }); ped.position.copy(p).add(V(0, 1.3, 0)); scene.add(ped); const ring = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 2.6), neonMaterial('#ff9e80', 2.2)); ring.position.copy(p).add(V(0, 2.0, 0)); scene.add(ring); }
  PEDS.forEach((p) => pedEggs.push(egg(p.clone().add(V(0, 2.0, 0)), 0.3)));
  farEggs.forEach((e) => (e.userData.home = e.position.clone()));
  // A mound of his eggs back home (he sits on it), and the pile he carries on his back.
  for (let i = 0; i < 46; i++) { const ring = i < 18 ? 0 : i < 32 ? 1 : i < 41 ? 2 : 3, n = [18, 14, 9, 5][ring], k = i - [0, 18, 32, 41][ring], a = (k / n) * Math.PI * 2 + ring; moundEggs.push(egg(V(Math.cos(a) * (6.5 - ring * 1.7), 0.3 + ring * 1.45, Math.sin(a) * (6.5 - ring * 1.7)), 0.34)); }

  // The job: a T-rex-sized treadmill, a TV with brainrot, snacks.
  tread = makeTreadmill(); tread.position.copy(JOB); tread.rotation.y = -Math.PI / 2; scene.add(tread);
  const cvs = document.createElement('canvas'); cvs.width = 768; cvs.height = 432; tvCtx = cvs.getContext('2d'); tvTex = new THREE.CanvasTexture(cvs); tvTex.colorSpace = THREE.SRGBColorSpace;
  tv = new THREE.Group(); const frame = new THREE.Mesh(new THREE.BoxGeometry(17, 10, 0.8), new THREE.MeshStandardMaterial({ color: '#15181e' })); frame.position.y = 11; tv.add(frame);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map: tvTex })); scr.position.set(0, 11, 0.45); tv.add(scr);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 1), new THREE.MeshStandardMaterial({ color: '#15181e' })); leg.position.y = 3; tv.add(leg);
  tv.position.copy(TV_AT); tv.rotation.y = Math.PI / 2; scene.add(tv);
  snacks = new THREE.Group(); { const bowl = new THREE.Mesh(new THREE.CylinderGeometry(3, 2.2, 1.6, 20), new THREE.MeshStandardMaterial({ color: '#d9443c' })); bowl.position.y = 0.8; snacks.add(bowl);
    for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 2.2), new THREE.MeshStandardMaterial({ color: i % 2 ? '#b8732e' : '#c98a3a' })); d.position.set(Math.cos(i * 2.1) * 1.4, 1.9 + (i % 3) * 0.35, Math.sin(i * 2.1) * 1.4); d.rotation.set(i, i * 0.7, 0); snacks.add(d); } }
  snacks.position.copy(JOB).add(V(-19, 1.6, 6)); scene.add(snacks);
  const job = sign('GUARD', { w: 6, h: 2, post: 6, bg: '#152435', accent: '#FFD23F' }); job.position.copy(JOB).add(V(4, 0, -8)); scene.add(job);

  // The T-rex, his disguise (attached to the head and torso), the pile on his back, the babies.
  rex = await loadCreature('trex'); rex.root.scale.setScalar(REXS); scene.add(rex.root);
  BODIES = Object.keys(rex.bodies).filter((n) => rex.bodies[n].meshes.length);
  glasses = new THREE.Group(); { const blk = new THREE.MeshStandardMaterial({ color: '#0b0c10', metalness: 0.6, roughness: 0.15 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.35, 0.5), blk); bar.position.set(0, 0.35, -2.1); glasses.add(bar);
    for (const sx of [-1, 1]) { const lens = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 2.2), blk); lens.position.set(sx * 2.25, 0, -1.0); glasses.add(lens); const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 2.6), blk); arm.position.set(sx * 2.25, 0.3, 1.2); glasses.add(arm); } }
  glasses.position.set(0, 10.25, -9.9); attachToBody(rex, 'head', glasses);
  hoodie = new THREE.Group(); { const red = new THREE.MeshStandardMaterial({ color: '#e0423a', roughness: 0.8 }), white = new THREE.MeshStandardMaterial({ color: '#f4f4f4' });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.9, 7.4, 9.9), red); body.position.set(0, 7.6, -1.4); hoodie.add(body);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 3.2), red); hood.position.set(0, 10.6, 2.4); hoodie.add(hood);
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.2, 4), new THREE.MeshStandardMaterial({ color: '#c3352e' })); pocket.position.set(0, 5.4, -3.2); hoodie.add(pocket);
    for (const sx of [-0.7, 0.7]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), white); st.position.set(sx, 9.4, -6.4); hoodie.add(st); } }
  attachToBody(rex, 'torso', hoodie);
  for (let i = 0; i < 12; i++) { const e = eggProto.clone(); e.scale.setScalar(0.3 / REXS); e.position.set((i % 3 - 1) * 1.3, 11.2 + Math.floor(i / 6) * 1.2, -3 + Math.floor(i / 3) % 2 * 2.4 + (i % 2) * 0.6); e.rotation.y = i; attachToBody(rex, 'torso', e); backEggs.push(e); }
  for (let i = 0; i < 26; i++) { const b = await loadCreature('trex'); b.root.scale.setScalar(BABY); scene.add(b.root); babies.push(b); }

  const ex = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'nervous', 'confused', 'blink', 'sad'];
  [leo, max, mia, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'knocked_out', 'point_forward', 'laugh_big', 'wave', 'proud', 'dizzy', 'cheer'])
    A[n] = await loadAnimation(n);
  for (let i = 0; i < 24; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  const shellM = new THREE.MeshStandardMaterial({ color: '#f0e2c8', roughness: 0.6 });
  for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.2), shellM); c.userData.v = V(Math.cos(i * 2.4) * (4 + (i % 5)), 6 + (i % 4) * 2, Math.sin(i * 2.4) * (4 + (i % 5))); scene.add(c); shells.push(c); }
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const runL = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
const hide = (b) => { b.visible = false; return b; };
function fling(b, s, t0, a, to, h, dur, faceE = 'scared') {
  const u = (s - t0) / dur;
  if (u < 1) { b.grounded = false; b.pos = a.clone().lerp(to, u).add(V(0, h * 4 * u * (1 - u), 0)); b.rotX = -u * 9; b.rotZ = u * 3.5; b.layers = [[A.shock, 0.3]]; b.face = faceE; }
  else { b.grounded = false; b.pos = to.clone(); b.layers = [[A.knocked_out, 1]]; b.face = 'dizzy'; }
  return b;
}
// Max: the thief in the opening (tiptoes in, grabs, runs over the line, laughs); in the last shot he grabs it again.
const GRAB = V(1.2, 0, 7.4), CROSS = V(3, 0, SAFE_Z + 7);
function maxState(s) {
  const b = st(V(18, 0, 18), face(V(18, 0, 18), GRAB), idle(s), 'scheming');
  if (s < B.grab) { const from = V(9, 0, 20), m = travelTo(from, GRAB, B.grab - 0.1, s, 5); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(GRAB, EGG_HOME); b.layers = m.moving ? walkL(m, from.distanceTo(GRAB)) : [[A.hold, 0.3]]; return b; }
  if (s < B.day2) {
    const d = GRAB.distanceTo(CROSS), m = travel(GRAB, CROSS, B.run, s, d / (B.cross + 0.3 - B.run));
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(CROSS, V(3, 0, SAFE_Z - 20)); b.layers = m.moving ? [[A.run, (m.u * d) / STRIDE], [A.hold, 0.3, 0.6]] : [[A.laugh_big, s]]; b.face = m.moving ? 'scared' : 'laugh'; b.egg = true;
    if (s < B.run) { b.pos = GRAB.clone(); b.rotY = face(GRAB, EGG_HOME); b.layers = [[A.hold, 0.3]]; b.face = 'evil_grin'; }
    return b;
  }
  if (s > B.kids && s < B.cta + 2) {                 // last shot: grabs it, runs, laughs over the line
    const from = V(9, 0, 20), m0 = travelTo(from, GRAB, B.kids + 0.5, s, 9);
    if (s < B.kids + 0.5) { b.pos = m0.pos; b.rotY = m0.heading; b.layers = runL(m0, from.distanceTo(GRAB)); return b; }
    const d = GRAB.distanceTo(CROSS), m = travel(GRAB, CROSS, B.kids + 0.6, s, d / (babyBonk() - B.kids - 0.4)); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(CROSS, V(3, 0, 0)); b.layers = m.moving ? [[A.run, (m.u * d) / STRIDE], [A.hold, 0.3, 0.6]] : [[A.laugh_big, s]]; b.face = 'laugh'; b.egg = true;
    return b;
  }
  return hide(b);
}
// Day 2 and 3: Mia and the Noob stroll past on the safe side with eggs while the T-rex stares at the line.
function miaState(s) { const b = st(V(-30, 0, SAFE_Z + 6), Math.PI / 2, idle(s), 'smug'); if (s < B.day2 || s > B.stolen) return hide(b); const m = travel(V(-26, 0, SAFE_Z + 5), V(30, 0, SAFE_Z + 5), B.day2, s, 9); b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.walk, (m.u * 56) / STRIDE], [A.hold, 0.3, 0.6]]; b.egg = true; return b; }
function noobState(s) { const b = st(V(-30, 0, SAFE_Z + 9), Math.PI / 2, idle(s), 'happy'); if (s < B.day2 || s > B.stolen) return hide(b); const m = travel(V(-36, 0, SAFE_Z + 9), V(30, 0, SAFE_Z + 9), B.day2 + 0.4, s, 9); b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.walk, (m.u * 66) / STRIDE], [A.hold, 0.3, 0.6]]; b.egg = true; b.wave = s > W.nobody - 0.2; return b; }
// Leo: on his base when the T-rex arrives, chases him, bonks off; later hires him.
function leoState(s) {
  const b = st(LEO_BASE.clone().add(V(6, 0.6, 8)), Math.PI, idle(s), 'happy', { floor: 0.6 });
  if (s < B.leo - 0.3) return hide(b);
  if (s < B.leoRun) { b.pos = LEO_BASE.clone().add(V(13, 0, 6)); b.rotY = face(b.pos, LEO_BASE); b.layers = [[A.shock, 0.3]]; b.face = 'shocked'; b.floor = 0; return b; }
  if (s < B.home) {
    const from = LEO_BASE.clone().add(V(13, 0, 6)), hit = rexAt(B.leoBonk - 0.15).pos.clone().add(V(2.5, 0, 4)), d = from.distanceTo(hit), m = travelTo(from, hit, B.leoBonk - 0.15, s, Math.max(14, d / (B.leoBonk - B.leoRun - 0.2)));
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(hit, rexAt(B.leoBonk).pos); b.layers = m.moving ? runL(m, d) : [[A.shock, 0.3]]; b.face = 'angry'; b.floor = 0;
    if (s > B.leoBonk) fling(b, s, B.leoBonk, hit, hit.clone().add(V(9, 0, 13)), 10, 1.0);
    return b;
  }
  if (s > B.quit && s < B.kids) {                    // hires him at his base, then cheers at the treadmill
    b.pos = JOB.clone().add(V(14, 0, 9)); b.rotY = face(b.pos, JOB.clone().add(V(-6, 0, 0))); b.floor = 0;
    b.layers = s < B.hired + 0.8 ? [[A.point_forward, 0.25]] : s < B.job ? [[A.proud, 0.4]] : [[A.cheer, s]]; b.face = 'laugh';
    if (s < B.hired - 0.1) { b.layers = [[A.wave, s]]; b.face = 'happy'; }
    return b;
  }
  return hide(b);
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  robloxPose(a, x.layers);
  if (x.wave) a.bones['Arm.R'].quaternion.setFromEuler(new THREE.Euler(0.1, 0, -2.4 - 0.18 * Math.sin(x.pos.x * 2)));
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- the T-rex ----------
const run = (from, to, t0, s, speed) => { const d = from.distanceTo(to), m = travel(from, to, t0, s, speed); return { pos: m.pos, rotY: m.moving ? m.heading : face(from, to), pose: m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexIdle(s), m }; };
const walk = (from, to, t0, s, speed) => { const r = run(from, to, t0, s, speed); if (r.m.moving) { const p = r.pose; for (const k of ['leg_L', 'leg_R']) p[k] = p[k].map((x) => x * 0.7); } return r; };
let rexCache = { t: -1 };
function rexAt(s) {
  if (rexCache.t === s) return rexCache;
  let pos = GUARD.clone(), rotY = GUARD_ROT, pose = trexIdle(s), sit = 0;
  const WALL = V(3, 0, WALL_STOP);
  if (s < B.grab + 0.1) { pose = trexIdle(s); pose.neck2 = [0.12, 0, 0]; }                          // proud, on guard
  else if (s < B.chase) { pose = mixPose(trexIdle(s), trexRoar(s), Math.min(seg(s, B.grab + 0.1, B.grab + 0.35), 1 - seg(s, B.chase - 0.2, B.chase))); rotY = lerp(GUARD_ROT, face(GUARD, WALL), seg(s, B.grab, B.chase)); }
  else if (s < B.day2) {                                                                              // the chase, the BONK
    const r = run(GUARD, WALL, B.chase, s, GUARD.distanceTo(WALL) / (B.bonk - B.chase - 0.15)); pos = r.pos; rotY = r.rotY; pose = r.pose;
    if (s > B.bonk - 0.15) { const u = seg(s, B.bonk - 0.15, B.bonk + 0.6); pos = WALL.clone().add(V(0, 0, -2.2 * easeOut(seg(s, B.bonk, B.bonk + 0.25)))); rotY = face(GUARD, WALL); pose = mixPose(trexHeadbutt(Math.min(1, u * 1.4)), trexIdle(s), seg(s, B.bonk + 0.5, B.day2)); pose.head = [0.1, 0.18 * Math.sin((s - B.bonk) * 18) * (1 - seg(s, B.bonk, B.day2)), 0]; }
  }
  else if (s < B.stolen) { pos = WALL.clone().add(V(0, 0, -2.2)); rotY = face(GUARD, WALL); pose = trexIdle(s); pose.head = [0.05, 0, 0.35]; pose.neck2 = [-0.1, 0, 0.1]; } // head tilted: why?
  else if (s < W.disguise - 0.3) { pos = V(-3, 0, -9); rotY = 0.15; pose = trexIdle(s); const sad = seg(s, B.review, B.review + 0.4); pose.neck2 = [-0.35 * sad, 0, 0]; pose.neck1 = [-0.2 * sad, 0, 0]; pose.head = [-0.15 * sad, 0, 0]; pose.tail01 = [-0.15 * sad, 0, 0]; }
  else if (s < B.scan) { pos = V(-3, 0, -9); rotY = 0.15; pose = trexIdle(s); pose.neck2 = [0.18, 0, 0]; pose.head = [0.1, 0.12 * Math.sin(s * 3), 0]; }   // shows off the disguise
  else if (s < B.bases) { const from = V(3, 0, WALL_STOP - 3), to = V(3, 0, SAFE_Z + 8), r = walk(from, to, B.through - 0.3, s, 12); pos = r.pos; rotY = 0; pose = r.pose; if (!r.m.moving && !r.m.done) pose = trexIdle(s); }
  else if (s < B.leoRun) {                                                                            // at Leo's base: takes them all back
    pos = LEO_BASE.clone().add(V(-3, 0, -18)); rotY = 0; pose = trexIdle(s);
    if (s > B.took - 0.3) { const u = seg(s, B.took - 0.3, B.took + 1.0); pose = mixPose(trexIdle(s), { neck2: [-0.5, 0, 0], neck1: [-0.3, 0, 0], head: [-0.2, 0.3 * Math.sin(u * 12), 0], mouth: [-0.3, 0, 0] }, Math.sin(Math.PI * clamp(u * 1.1))); }
  }
  else if (s < B.home) { const from = LEO_BASE.clone().add(V(-3, 0, -18)), to = V(-3, 0, SAFE_Z - 40), r = walk(from, to, B.leoRun + 0.1, s, 9); pos = r.pos; rotY = Math.PI; pose = r.pose; }
  else if (s < B.quit) {                                                                              // on the mound of eggs; the hatch; babies everywhere
    pos = V(0, 0, 0); rotY = 0.35; sit = 4.2; pose = trexSleep(s); pose.neck2 = [0.15, 0, 0]; pose.neck1 = [0.1, 0, 0]; pose.head = [0.25, 0, 0]; pose.mouth = [0.3, 0, 0];
    if (s > B.hatch) { pose.neck2 = [0.35, 0.25 * Math.sin((s - B.hatch) * 6), 0]; pose.mouth = [-0.6, 0, 0]; pose.head = [0.1, 0, 0]; }
  }
  else if (s < B.kids) {                                                                              // the job
    pos = JOB.clone().add(V(0, 1.7, 0)); rotY = -Math.PI / 2; const ph = (s - B.quit) * 0.55; pose = trexRun(ph); for (const k of ['leg_L', 'leg_R']) pose[k] = pose[k].map((x) => x * 0.55);
    pose.neck2 = [0.05, 0, 0]; pose.head = [0.05 + 0.04 * Math.sin(s * 2), 0.08 * Math.sin(s * 1.3), 0]; pose.mouth = [0.25, 0, 0];
    if (s < B.hired + 0.5) { pos = LEO_BASE.clone().add(V(-6, 0, 14)); rotY = Math.PI / 2; pose = trexIdle(s); }
  }
  else { pos = JOB.clone().add(V(0, 1.7, 0)); rotY = -Math.PI / 2; pose = trexRun((s - B.quit) * 0.55); }
  rexCache = { t: s, pos, rotY, pose, sit };
  return rexCache;
}
function placeRex(c, pos, rotY, pose, sit = 0) {
  c.root.position.copy(pos); c.root.rotation.set(0, rotY, 0); poseCreature(c, pose);
  c.root.position.y -= creatureLowest(c, BODIES); c.root.position.y += sit + pos.y; c.root.updateMatrixWorld(true);
}
const rexHead = () => creaturePoint(rex, 'head', 0, 12.2, -9.5);

// ---------- samples ----------
export function samples(t) { return [B.bonk, B.leoBonk, B.hatch, babyBonk()].some((b) => t > b - 0.1 && t < b + 0.9) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; cam = stage.camera;
  const R = rexAt(s); placeRex(rex, R.pos, R.rotY, R.pose, R.sit);
  rex.root.visible = !(s > B.kids && s < B.cta);
  const M = maxState(s), MI = miaState(s), NO = noobState(s), L = leoState(s);
  place(max, M); place(mia, MI); place(noob, NO); place(leo, L);
  glasses.visible = s > B.glasses; glasses.scale.setScalar(s < B.glasses + 0.25 ? easeOutBack(seg(s, B.glasses, B.glasses + 0.25), 2.5) : 1);
  hoodie.visible = s > B.hoodie && s < B.home; hoodie.scale.setScalar(s < B.hoodie + 0.25 ? Math.max(0.01, easeOutBack(seg(s, B.hoodie, B.hoodie + 0.25), 2.5)) : 1);
  rex.attached.forEach((a) => a.obj.updateMatrixWorld(true));
  if (glasses.visible || hoodie.visible) poseCreature(rex, R.pose);

  // The egg: on the nest / in Max's hands / back on the nest the next day.
  const hand = (a) => a.root.position.clone().add(V(Math.sin(a.root.rotation.y) * 1.6, 0.9, Math.cos(a.root.rotation.y) * 1.6));
  heroEgg.visible = true; heroEgg.position.copy(EGG_HOME); heroEgg.rotation.set(0, s * 0.3, 0);
  if (M.egg && max.root.visible) heroEgg.position.copy(hand(max));
  if (s > B.stolen && s < B.kids) heroEgg.visible = s > B.quit;           // gone (stolen) until the kids guard it
  // Eggs carried by Mia and the Noob reuse two far-base eggs.
  for (const [who, st2, e] of [[mia, MI, farEggs[0]], [noob, NO, farEggs[1]]]) { if (st2.egg && who.root.visible) { e.position.copy(hand(who)); e.userData.carried = true; } else if (e.userData.carried) { e.userData.carried = false; e.position.copy(e.userData.home); } }
  // Leo's pedestals: eggs fly onto the T-rex's back one by one.
  pedEggs.forEach((e, i) => {
    const t0 = B.took - 0.2 + i * 0.1, u = seg(s, t0, t0 + 0.45); e.visible = s < t0 + 0.45 || s > B.quit;
    const home = PEDS[i].clone().add(V(0, 2.0, 0)), back = backEggs[i % backEggs.length].getWorldPosition(V(0, 0, 0));
    e.position.copy(home.clone().lerp(back, easeInOut(u))).add(V(0, 6 * Math.sin(Math.PI * u), 0));
    if (s > B.quit) e.position.copy(home);
  });
  backEggs.forEach((e, i) => { e.visible = s > B.took - 0.2 + i * 0.1 + 0.45 && s < B.home; });
  // The mound at home, and the hatch: eggs wobble, burst, babies.
  moundEggs.forEach((e, i) => { e.visible = s > B.home - 0.1 && s < B.hatch; e.rotation.set(s > B.wobble ? 0.18 * Math.sin(s * 40 + i) : 0, i, 0); });
  shells.forEach((c, i) => { const u = s - B.hatch; c.visible = u > 0 && u < 1.4; if (!c.visible) return; const a = moundEggs[i % moundEggs.length].position; c.position.copy(a).add(c.userData.v.clone().multiplyScalar(u * 0.6)).add(V(0, -9 * u * u * 0.6, 0)); c.position.y = Math.max(0.1, c.position.y); c.rotation.set(u * 6 + i, u * 5, 0); });
  babies.forEach((b, i) => {
    const showA = s > B.hatch && s < B.quit + 0.2, showB = s > B.kids - 0.1;
    b.root.visible = showA || (showB && i < 6);
    if (!b.root.visible) return;
    if (showA) {
      const a = (i / babies.length) * Math.PI * 2 * 3.1, rr = 3 + (i % 9) * 1.6, home = V(Math.cos(a) * rr, 0, Math.sin(a) * rr + 2), wob = s - B.hatch;
      const pose = (i % 3 === 0) ? trexRoar(s * 1.3 + i) : trexRun(s * 1.6 + i * 0.37);
      const k = easeOutBack(seg(s, B.hatch + (i % 6) * 0.04, B.hatch + 0.35 + (i % 6) * 0.04), 2);
      b.root.scale.setScalar(BABY * Math.max(0.01, k)); placeRex(b, home.clone().add(V(Math.sin(wob * 2 + i) * 1.2, 0, Math.cos(wob * 2.3 + i) * 1.2)), wob * (i % 2 ? 1 : -1) + i, pose);
    } else {                                                                 // the kids guard the egg; one chases Max and bonks the wall
      b.root.scale.setScalar(BABY);
      if (i === 0) { const from = V(-4, 0, -3), to = V(3, 0, SAFE_Z - HEAD * BABY / REXS - 0.2), d = from.distanceTo(to), m = travel(from, to, B.kids + 0.7, s, d / (babyBonk() - B.kids - 0.75));
        let p = m.pos, rot = m.moving ? m.heading : face(from, to), pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * BABY)) : trexIdle(s);
        if (s > babyBonk()) { p = to.clone().add(V(0, 0, -1.2 * easeOut(seg(s, babyBonk(), babyBonk() + 0.25)))); pose = trexHeadbutt(Math.min(1, seg(s, babyBonk() - 0.1, babyBonk() + 0.5) * 1.4)); pose.head = [0.1, 0.25 * Math.sin((s - babyBonk()) * 18) * (1 - seg(s, babyBonk(), babyBonk() + 1.2)), 0]; }
        placeRex(b, p, rot, pose); return; }
      const a = (i / 6) * Math.PI * 2, p = V(Math.cos(a) * 6.5, 0, Math.sin(a) * 6.5); placeRex(b, p, a + Math.PI, trexIdle(s * 1.4 + i));
    }
  });
  // The wall: bonks ripple it red; the scanner sweeps the disguised T-rex and it turns green.
  const hit = (at) => (s > at && s < at + 0.7 ? 0.45 * (1 - (s - at) / 0.7) : 0);
  wallMat.opacity = 0.12 + hit(B.bonk) + hit(babyBonk()) + (s > B.through && s < B.through + 0.9 ? 0.35 * Math.abs(Math.sin((s - B.through) * 10)) * (1 - (s - B.through) / 0.9) : 0);
  wallMat.color.set(s > B.scan && s < B.through + 0.9 ? '#5dff9e' : (s > B.bonk && s < B.bonk + 0.7) || (s > babyBonk() && s < babyBonk() + 0.7) ? '#ff5d7a' : '#5dff9e');
  scan.visible = s > B.scan + 0.1 && s < B.through - 0.05; if (scan.visible) { const u = seg(s, B.scan + 0.1, B.through - 0.1); scan.position.set(3, 22 - 21 * u, SAFE_Z - 6); scanMat.opacity = 0.4 + 0.3 * Math.sin(s * 30); }
  drawTV(s); snacks.rotation.y = s * 0.2;
  treadBelt.material.map.offset.y = -(s - B.quit) * 0.35;

  // Puffs: bonks, the hatch, Leo's bonk.
  const events = [[B.bonk, V(3, 12, SAFE_Z - 1), 2.6, 0.7, '#ffffff'], [B.leoBonk, leo.root.position.clone().add(V(0, 3, 0)), 1.8, 0.6, '#ffffff'], [B.hatch, V(0, 3, 0), 6, 0.9, '#fff4d8'], [B.hatch + 0.05, V(3, 2, 4), 4, 0.8, '#fff4d8'],
    [babyBonk(), V(3, 2.6, SAFE_Z - 0.5), 1.2, 0.6, '#ffffff'], [B.through, V(3, 8, SAFE_Z), 3.5, 0.8, '#9dffc4']];
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur, col] = ev, u = (s - at) / dur, a = i * 0.7;
    p.material.color.set(col); p.material.emissive.set(col);
    p.position.set(c.x + Math.cos(a) * size * 1.3 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.3 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.8 * (1 - u) ** 2;
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const look = (p, tg, fov = 46, ext = 50) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const rp = rex.root.position, hc = rexHead(), mp = max.root.position, lp = leo.root.position;
  stage.bloom.strength = 0.3;
  switch (shot.id) {
    case 'hook': look(V(lerp(22, 20, u), 7.5, 30), V(-2, 7, 0), 48, 50); break;                 // the T-rex over its egg, Max creeping in
    case 'steal': look(V(20, 6, 24), V(0, 5, 4), 46); break;
    case 'chase': look(V(rp.x + 34, 10, rp.z + 8), V(rp.x + 2, 7, rp.z + 10), 50, 60); break;
    case 'bonk': look(V(30, 10, SAFE_Z + 10).add(jolt(B.bonk, 0.9)), V(2, 10, SAFE_Z - 6), 50, 60); break;
    case 'line': look(V(-22, 9, SAFE_Z + 18), V(2, 9, SAFE_Z - 4), 52, 60); break;              // from the safe side: the rex at the line, Mia and the Noob strolling past
    case 'stolen': look(V(9, 6, 16), V(0, 2, 0), 44); break;                                      // the empty nest
    case 'review': look(rexHead().add(V(10, -2, 20)), hc.clone().add(V(0, -3, 0)), 46); break;
    case 'disguise': look(hc.clone().add(V(8, -3, 28)), hc.clone().add(V(0, -5, 0)), 46); break;
    case 'scan': look(V(26, 8, SAFE_Z + 14), V(3, 10, SAFE_Z - 4), 54, 60); break;
    case 'bases': look(V(lerp(20, 10, u), lerp(70, 64, u), lerp(20, 30, u)), V(0, 0, 92), 52, 90); break;   // aerial: rows of bases full of his eggs
    case 'leoBase': look(LEO_BASE.clone().add(V(30, 15, -2)), LEO_BASE.clone().add(V(-4, 7, -10)), 54, 60); break;
    case 'leoChase': look(V(rp.x + 30, 9, rp.z + 6).add(jolt(B.leoBonk, 0.6)), V(rp.x + 3, 6, rp.z + 4), 52, 60); break;
    case 'home': case 'hatch': case 'swarm': look(V(lerp(20, 24, u), 9, 26).add(jolt(B.hatch, 0.8, 0.5)), V(0, 6, 1), 50, 50); break;
    case 'quit': look(LEO_BASE.clone().add(V(14, 7, 34)), LEO_BASE.clone().add(V(-4, 6, 14)), 50, 50); break;
    case 'hired': look(JOB.clone().add(V(26, 8, 22)), JOB.clone().add(V(4, 6, 2)), 52, 60); break;
    case 'job': look(JOB.clone().add(V(10, 9, 36)), JOB.clone().add(V(-8, 9, 0)), 52, 60); break;   // the T-rex on the treadmill, the TV, snacks
    case 'best': look(hc.clone().add(V(10, -1, 20)), hc.clone().add(V(-2, -3, 0)), 46); break;
    case 'kids': case 'cta': { const b0 = babies[0].root.position; look(V(18, 5, b0.z - 4).add(jolt(babyBonk(), 0.4)), V(2, 2.5, b0.z + 4), 50, 60); break; }
    default: look(V(26, 11, 40), V(-3, 4.5, 2), 46);
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
const pop = (t, at, d = 0.15, k = 3) => easeOutBack(clamp((t - at) / d), k);
const fade = (t, at, hold) => 1 - inv(at + hold - 0.2, at + hold, t);
function word(g, s, t, at, hold, text, col, size = 140, y = 780, rot = -0.06) { const a = t - at; if (a < 0 || a > hold) return; bigText(g, s, text, 540, y, size, col, { k: pop(t, at), alpha: fade(t, at, hold), rot }); }
function pill(g, s, x, y, text, bg, fg = '#ffffff', size = 42) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s;
  roundRect(g, x * s, y * s, w, (size + 34) * s, 20 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, x * s + 20 * s, (y + (size + 34) / 2 + 3) * s); g.restore();
}
function tagOver(g, s, p3, text, bg, alpha = 1, k = 1, size = 36, fg = '#ffffff') {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.globalAlpha = alpha; g.translate(p.x, p.y); g.scale(k, k); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 32 * s, h = size * 1.55;
  roundRect(g, -w / 2, -h / 2 * s, w, h * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
function card(g, s, t, at, title, stars, sub, col) {
  const k = pop(t, at, 0.25, 2);
  g.save(); g.translate(540 * s, 1000 * s); g.scale(k, k); g.rotate(-0.03);
  roundRect(g, -390 * s, -160 * s, 780 * s, 320 * s, 36 * s); g.fillStyle = 'rgba(21,36,53,.95)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = col; g.stroke();
  g.font = `${50 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(title, 0, -95 * s);
  for (let i = 0; i < 5; i++) { const on = i < stars, kk = on ? pop(t, at + 0.15 + i * 0.08, 0.15, 3) : 1; g.save(); g.translate((-200 + i * 100) * s, -5 * s); g.scale(kk, kk); g.font = `${92 * s}px sans-serif`; g.fillStyle = on ? '#FFD23F' : '#4a5568'; g.fillText('★', 0, 0); g.restore(); }
  g.font = `${40 * s}px "Luckiest Guy"`; g.fillStyle = col; g.fillText(sub, 0, 95 * s); g.restore();
}
function hud(g, s, t) {
  pill(g, s, 60, 250, 'PREHISTORIC', 'rgba(21,36,53,.88)');
  if (t < B.quit) { const n = t < B.stolen ? 0 : Math.floor(lerp(0, 400, easeOut(seg(t, B.stolen + 0.2, B.review - 0.2)))); pill(g, s, 60, 350, `EGGS STOLEN: ${t < B.home ? n : 0}`, 'rgba(190,50,60,.9)', '#ffffff', 34); }
}
export function overlay(g, s, t) {
  hud(g, s, t);
  if (t < B.chase && rex.root.visible) tagOver(g, s, rexHead().add(V(0, 5, 0)), 'GUARDIAN', 'rgba(220,40,60,.94)', 1, pop(t, 0.1, 0.2, 2.5), 40);
  if (t > B.grab && t < B.chase + 0.3) word(g, s, t, B.grab + 0.15, 0.9, 'ROAAAR', '#ff4d5e', 160, 760, 0.04);
  word(g, s, t, B.bonk, 0.9, 'BONK!', '#FFD23F', 200, 760, -0.08);
  if (t > B.bonk && t < B.day2 + 0.2) for (let i = 0; i < 3; i++) { const p = project(rexHead().add(V(Math.cos(t * 6 + i * 2.1) * 3, 4, Math.sin(t * 6 + i * 2.1) * 3)), s); if (p.on) bigText(g, s, '*', p.x / s, p.y / s, 70, '#FFD23F'); }
  if (t > B.day2 && t < B.stolen) { bigText(g, s, '?', project(rexHead().add(V(0, 6, 0)), s).x / s, project(rexHead().add(V(0, 6, 0)), s).y / s, 160, '#ffffff', { k: pop(t, B.day2 + 0.2, 0.2, 3) }); word(g, s, t, B.day2 + 0.1, 0.9, 'DAY 2', '#7FE3DD', 110, 1080); word(g, s, t, B.day2 + 1.1, 0.9, 'DAY 3', '#7FE3DD', 110, 1080); }
  if (t > B.stolen + 0.2 && t < B.review) bigText(g, s, String(Math.floor(lerp(0, 400, easeOut(seg(t, B.stolen + 0.2, B.review - 0.2))))), 540, 900, 260, '#ff4d5e', { k: pop(t, B.stolen + 0.2, 0.2, 2) });
  if (t > B.review && t < W.disguise - 0.3) card(g, s, t, B.review, 'GUARDIAN REVIEW', 1, '"KEEPS BONKING THE WALL"', '#ff6b78');
  word(g, s, t, B.glasses, 0.8, 'SUNGLASSES', '#ffffff', 110, 1100); word(g, s, t, B.hoodie, 0.8, 'HOODIE', '#ff6b78', 130, 1100);
  if (rex.root.visible && t > B.tag && t < B.home) tagOver(g, s, rexHead().add(V(0, 5.5, 0)), 'Player', 'rgba(0,0,0,.35)', 1, pop(t, B.tag, 0.2, 2.5), 48);
  if (t > B.scan + 0.1 && t < B.through + 0.6) bigText(g, s, t < B.through - 0.1 ? 'SCANNING...' : 'PLAYER: OK!', 540, 760, 110, t < B.through - 0.1 ? '#ffffff' : '#3cff8a', { k: pop(t, t < B.through - 0.1 ? B.scan + 0.1 : B.through - 0.1, 0.2, 2) });
  if (t > W.full - 0.2 && t < B.leo) { word(g, s, t, W.full - 0.2, B.leo - W.full + 0.2, 'MY EGGS!', '#FFD23F', 150, 1080); }
  if (t > B.took - 0.2 && t < B.leoRun) tagOver(g, s, rex.root.position.clone().add(V(0, 26, 0)), `+${Math.min(12, Math.max(0, Math.floor((t - B.took + 0.2) / 0.1)))} EGGS`, 'rgba(40,150,80,.95)', 1, 1, 42);
  word(g, s, t, B.leoBonk, 0.9, 'BONK!', '#FFD23F', 200, 760, 0.08);
  if (t > B.five && t < B.wobble) card(g, s, t, B.five, 'GUARDIAN REVIEW', 5, '"GOT THEM ALL BACK"', '#3cff8a');
  if (t > B.swarm && t < B.quit) { bigText(g, s, 'x400', 540, 760, 200, '#ff9be8', { k: pop(t, B.swarm, 0.2, 3), rot: -0.06 }); if (t > W.jobs - 0.3) bigText(g, s, '400 JOBS', 540, 1000, 120, '#ff4d5e', { k: pop(t, W.jobs - 0.3, 0.2, 3) }); }
  word(g, s, t, B.quit, 1.0, 'I QUIT', '#ff4d5e', 170, 760, -0.06);
  word(g, s, t, B.hired + 0.1, 1.1, 'HIRED!', '#3cff8a', 180, 760, 0.06);
  if (t > B.job && t < B.kids) { tagOver(g, s, rexHead().add(V(0, 6, 0)), '+$1,000/s', 'rgba(40,150,80,.95)', 1, pop(t, B.job, 0.2, 2.5), 44); }
  if (t > W.snacks - 0.1 && t < B.best) { word(g, s, t, W.snacks - 0.1, 0.8, 'SNACKS', '#ff9e3d', 120, 1100); word(g, s, t, W.treadmill - 0.1, 0.8, 'TREADMILL', '#7FE3DD', 110, 1100); word(g, s, t, W.brainrot - 0.1, 1.0, 'BRAINROT', '#ff9be8', 120, 1100); }
  if (t > B.kids && t < B.cta) { const b0 = babies[0]; if (b0.root.visible) tagOver(g, s, b0.root.position.clone().add(V(0, 5, 0)), 'GUARDIAN JR.', 'rgba(220,40,60,.94)', 1, pop(t, B.kids + 0.2, 0.2, 2.5), 36); }
  word(g, s, t, babyBonk(), 0.9, 'bonk', '#FFD23F', 150, 760, -0.08);
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 640 * s); g.scale(k2, k2);
    roundRect(g, -420 * s, -190 * s, 840 * s, 380 * s, 46 * s); g.fillStyle = 'rgba(18,28,44,.92)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    roundRect(g, -150 * s, 70 * s, 300 * s, 90 * s, 22 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${54 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOLLOW', 0, 118 * s);
    g.restore();
    bigText(g, s, 'FOLLOW FOR MORE', 540, 520, 66, '#FFD23F', { k: k2 });
    bigText(g, s, '@viralrobloxgames', 540, 625, 66, '#ffffff', { k: k2 });
  }
  flash(g, s, [B.bonk, B.leoBonk, B.hatch].some((b) => t >= b && t < b + 0.1) ? 0.35 : 0, '#ffffff');
  if (['chase', 'leoChase'].includes(SHOT)) speedLines(g, s, t, 0.25, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max, rex, babies });
