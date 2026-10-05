// Stealing a T-Rex Egg (standalone): a Steal an Egg parody. Web renderer + Roblox R6 pack + the game's own T-rex and eggs
// (creatures/trex, props/egg_*). Beat times come from web/beats.js (source/beats.py: narration word timings via script
// alignment, or an estimate until the narration exists), so the clip retimes itself.
// Leo and Max each get flung by the T-rex guarding the best egg (headbutt, higher fling, eaten bush, own bear trap), team
// up (Max = decoy, Leo carries the slow giant egg), make the safe zone and hatch a $1/s baby. Meanwhile Mia, visible in the
// background of every chase, has taken the other twelve eggs; they hatch and cry, and Mom walks straight through the safe
// zone ("safe zones stop guardians, not moms"), takes her babies and Mia. Last shot = first shot, with Mia as the egg.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, cloud, sign, puff, forceField } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem } from '../../../web/lib/robloxPack.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { makeNest } from '../../../web/lib/trex.js';
import { loadCreature, poseCreature, creatureLowest, creaturePoint } from '../../../web/lib/creature.js';
import { trexIdle, trexSleep, trexRoar, trexRun, trexHeadbutt, mixPose, TREX_STRIDE } from '../../../web/lib/trexPoses.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Stealing a T-Rex Egg' };
export const sky = { zenith: '#3d7fd6', horizon: '#ffd9a8', below: '#f3e6d0', fog: '#f2dcc0' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));

// ---------- layout (nest at the origin, the bases towards +Z behind the safe-zone line) ----------
const REXS = 1.6, BABY = 0.3;
const N = V(0, 0, 0), EGG_HOME = V(0, 0.8, 2.6), NEST_R = 5.5;
const SLEEP_ROT = 0.85, SLEEP_AT = V(-9.6, 0, -9.0);           // asleep beside the nest, chin by the egg
const GUARD = V(-5, 0, -11), GUARD_ROT = 0.35;                   // where it stands guard once awake
const GRAB = V(0.4, 0, 7.6);                                     // where a thief stands to lift the egg
const SAFE_Z = 46, BASE_LM = V(-14, 0, 62), BASE_MIA = V(16, 0, 62), PEDESTAL = V(-14, 0, 60);
const MIA_HIDE = V(-24, 0, 14), MIA_NEST = V(-6.5, 0, 3.5);
const TRAP = V(3, 0, 19), TEAM = V(13, 0, 30), DECOY = V(18, 0, 4), CIRCLE = 24;
const REACH = 11.5;                                              // rex root to the victim when it headbutts

// ---------- beats (all from narration words) ----------
const B = {
  tiptoe: [0, W.grabbed - 0.3], grab: W.grabbed - 0.2, wake: [W.woke - 0.25, W.woke + 0.45], roar: [W.woke + 0.45, W.problem + 0.15],
  run1: W.problem - 0.05, bonk1: W.bonk1, maxRun: W.laughed + 0.55, maxGrab: W.tried, bonk2: W.bonk2,
  bush: [W.three - 0.4, W.ate - 0.35], chomp: W.ate + 0.05, bonkBush: W.bush2 + 0.45,
  trapRun: W.stepped - 1.3, snap: W.stepped, bonkTrap: W.stepped + 0.65,
  dazed: [W.something - 0.35, W.teamwork - 0.25], bump: W.teamwork + 0.15, plan: [W.teamwork + 0.45, W.waving - 0.35],
  decoy: W.waving - 0.35, circle: W.chased - 0.35, grab2: W.grabbed2 - 0.1, turn: W.turned - 0.1,
  jump: W.jumped - 0.1, onTail: W.jumped + 0.35, whip: W.tail - 0.05, bonk3: W.bonk3, cross: W.safe2, wall: W.follow1 - 0.15,
  place: W.hatched - 0.7, hatch: W.hatched, high5: W.dollar + 0.2, mia: W.saw - 0.2, empty: W.took - 0.15,
  hatch12: W.hatched2, hear: W.turns - 0.2, through: W.moms, grabMia: W.mia2 - 0.25, end: W.now - 0.15, cta: W.follow,
};
// Mia's four background raids, each taking three eggs while the T-rex is busy.
const RAIDS = [[W.problem - 0.3, B.bonk1 + 1.7], [W.laughed - 0.1, W.higher + 0.9], [W.seven - 0.2, W.something - 0.6], [W.waving - 0.3, W.grabbed2 - 0.8]];
const eggsLeft = (s) => 12 - 3 * RAIDS.filter(([a, b]) => s > (a + b) / 2).length + (s < B.grab2 ? 1 : 0);
const tries = (s) => (s < B.bonk1 ? 0 : s < B.bonk2 ? 1 : s < W.three - 0.4 ? 2 : s < W.seven - 0.3 ? 3 : 7);

const SHOTS = [
  [0, 'hook'], [W.tiptoed - 0.4, 'tiptoe'], [W.woke - 0.3, 'wake'], [W.problem - 0.25, 'slow'], [B.bonk1 - 0.5, 'bonk1'],
  [W.laughed - 0.25, 'laugh'], [W.tried - 0.3, 'maxTry'], [B.bonk2 + 0.15, 'maxFly'], [W.three - 0.45, 'bush'], [W.ate - 0.4, 'chomp'],
  [W.seven - 0.35, 'trap'], [W.something - 0.4, 'dazed'], [W.teamwork + 0.4, 'plan'], [B.decoy, 'decoy'], [W.chased - 0.3, 'circles'],
  [W.grabbed2 - 0.35, 'grab2'], [W.turned - 0.3, 'turn'], [W.jumped - 0.3, 'tailJump'], [B.bonk3 + 0.1, 'maxFly3'], [W.made - 0.3, 'safe'],
  [W.hatched - 0.9, 'hatch'], [W.saw - 0.3, 'miaBase'], [W.chased2 - 0.3, 'emptyNest'], [W.twelve2 - 0.35, 'hatch12'], [W.turns - 0.3, 'mom'],
  [W.moms - 0.5, 'through'], [W.walked - 0.3, 'takeMia'], [B.end, 'end'], [W.follow - 0.1, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, rex, babies = [], myBaby, leo, max, mia, cam, heroEgg, nestEggs = [], miaEggs = [], bush, trap, wall, wallMat, ff, SHOT = 'hook', BODIES;
const puffs = [], leaves = [];

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
function makeBush() {
  const g = new THREE.Group(), r = rng(31), m1 = new THREE.MeshStandardMaterial({ color: '#3f9a3a', roughness: 0.9, flatShading: true }), m2 = new THREE.MeshStandardMaterial({ color: '#52b247', roughness: 0.9, flatShading: true });
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 + r() * 0.7, 0), i % 2 ? m1 : m2); const a = r() * Math.PI * 2, h = 0.8 + r() * 3.6; b.position.set(Math.cos(a) * (1.4 + r() * 0.5), h, Math.sin(a) * (1.4 + r() * 0.5)); b.castShadow = true; g.add(b); }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), m2); top.position.y = 4.7; g.add(top);
  return g;
}
function makeTrap() {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: '#7d8590', metalness: 0.7, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.25, 24), steel); base.position.y = 0.12; base.castShadow = true; g.add(base);
  const jaws = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(0, 0.25, 0); g.add(p);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24, Math.PI), steel); arc.rotation.set(0, s > 0 ? 0 : Math.PI, 0); p.add(arc);
    for (let i = 1; i < 8; i++) { const a = (i / 8) * Math.PI, tooth = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), steel); tooth.position.set(Math.cos(a) * 1.4 * s, Math.sin(a) * 1.4, 0); tooth.rotation.z = a - Math.PI / 2 * s; p.add(tooth); }
    jaws.push({ p, s });
  }
  g.userData.jaws = jaws; return g;
}

async function placed(kind, name, pos, k = 1, ry = 0) { const o = await packItem(kind, name); o.position.copy(pos); o.scale.setScalar(k); o.rotation.y = ry; return o; }

export async function setup(stage) {
  const { scene } = stage; const r = rng(7);
  scene.fog.near = 200; scene.fog.far = 800;
  // Plain grass all round; studs only where the action is (nest to bases) - 100k studs made every frame several times slower.
  scene.add(part(420, 4, 420, '#6aa84f'));
  // (Studs only on the base plots: a studded ground was most of the render time.)
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(20, 48), new THREE.MeshStandardMaterial({ color: '#a68a5a', roughness: 1 })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, 0.03, -2); dirt.receiveShadow = true; scene.add(dirt);
  const volc = new THREE.Mesh(new THREE.ConeGeometry(80, 100, 9, 1, true), new THREE.MeshStandardMaterial({ color: '#5a4a44', roughness: 1, flatShading: true })); volc.position.set(-90, 34, -240); scene.add(volc);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 4, 9), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff4a10', emissiveIntensity: 2 })); glow.position.set(-90, 83, -240); scene.add(glow);
  for (let i = 0; i < 11; i++) { const c = part(24 + r() * 20, 24 + r() * 40, 22, i % 2 ? '#8a7360' : '#7a6552', { center: true }); c.position.set(-190 + i * 38, 12, -140 - r() * 30); scene.add(c); }
  for (const [x, z, h] of [[-46, -26, 19], [40, -34, 21], [52, 12, 17], [-50, 30, 18], [-28, -58, 23], [26, -64, 20], [60, 70, 18], [-60, 74, 19]]) palm(scene, x, z, h, r() * 3);
  for (let i = 0; i < 34; i++) { const a = r() * Math.PI * 2, d = 26 + r() * 50; fern(scene, Math.cos(a) * d, Math.sin(a) * d * 0.7 - 6, 0.8 + r() * 0.8); }
  for (let i = 0; i < 12; i++) { const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + r() * 2.2), new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: 0.9, flatShading: true })); const a = r() * Math.PI * 2, d = 24 + r() * 30; rock.position.set(Math.cos(a) * d, 0.6, Math.sin(a) * d * 0.6 - 10); rock.castShadow = rock.receiveShadow = true; scene.add(rock); }
  for (let i = 0; i < 16; i++) { const c = cloud(300 + i, 10 + r() * 10); c.position.set(-220 + r() * 440, 80 + r() * 60, -280 + r() * 140); scene.add(c); }

  // Nest: twelve of the game's eggs round the rim and its T-rex egg at the front.
  const nest = makeNest(NEST_R); nest.group.position.copy(N); scene.add(nest.group);
  const small = [['egg_basic', 1.1], ['egg_rare', 0.8], ['egg_super_rare', 0.7], ['egg_velociraptor', 0.55], ['egg_prism', 0.5], ['egg_designer_2', 0.5]];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.3, rr = NEST_R * (i % 2 ? 0.45 : 0.72), [n, k] = small[i % small.length]; nestEggs.push(await placed('props', n, V(Math.cos(a) * rr, 0.8, Math.sin(a) * rr - 0.8), k, r() * 6)); scene.add(nestEggs[i]); }
  heroEgg = await placed('props', 'egg_trex', EGG_HOME, 0.42); scene.add(heroEgg);
  const halo = new THREE.PointLight('#ffc040', 26, 12, 2); halo.position.copy(EGG_HOME).add(V(0, 5, 0)); scene.add(halo);
  // Mia's stolen eggs (same twelve) in rows on her plot.
  for (let i = 0; i < 12; i++) { const [n, k] = small[i % small.length]; miaEggs.push(await placed('props', n, BASE_MIA.clone().add(V(-6 + (i % 4) * 4, 0.6, -3 + Math.floor(i / 4) * 3.6)), k)); scene.add(miaEggs[i]); }

  // The safe zone: a glowing strip on the ground and a faint wall the guardian can't pass.
  const strip = new THREE.Mesh(new THREE.BoxGeometry(160, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: '#3cff8a', emissive: '#2cff7a', emissiveIntensity: 1.6 })); strip.position.set(0, 0.08, SAFE_Z); scene.add(strip);
  wallMat = new THREE.MeshBasicMaterial({ color: '#5dff9e', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  wall = new THREE.Mesh(new THREE.PlaneGeometry(160, 22), wallMat); wall.position.set(0, 11, SAFE_Z); wall.renderOrder = 6; scene.add(wall);
  const zoneSign = sign('SAFE ZONE', { w: 9, h: 2.2, post: 5, bg: '#123d24', accent: '#3cff8a' }); zoneSign.position.set(-26, 0, SAFE_Z + 1); scene.add(zoneSign);
  // Two base plots with name signs, and the boys' pedestal.
  for (const [p, label, col] of [[BASE_LM, 'LEO & MAX', '#ff9e80'], [BASE_MIA, 'MIA', '#c9a6ff']]) {
    const plot = part(22, 0.6, 16, '#d7c9a6', { studs: true }); plot.position.copy(p).add(V(0, 0.6, 0)); scene.add(plot);
    const sg = sign(label, { w: 9, h: 2.2, post: 3.6, bg: '#152435', accent: col }); sg.position.copy(p).add(V(0, 0.6, 7)); sg.rotation.y = Math.PI; scene.add(sg);
  }
  const ped = part(3, 1.6, 3, '#f4f4f8', { center: true }); ped.position.copy(PEDESTAL).add(V(0, 1.4, 0)); scene.add(ped);

  rex = await loadCreature('trex'); rex.root.scale.setScalar(REXS); scene.add(rex.root);
  BODIES = Object.keys(rex.bodies).filter((n) => rex.bodies[n].meshes.length);
  for (let i = 0; i < 12; i++) { const b = await loadCreature('trex'); b.root.scale.setScalar(BABY); scene.add(b.root); babies.push(b); }
  myBaby = await loadCreature('trex'); myBaby.root.scale.setScalar(BABY); scene.add(myBaby.root);
  const ex = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'suspicious', 'nervous', 'confused', 'knocked_out', 'blink', 'sad'];
  [leo, max, mia] = await Promise.all(['Leo', 'Max', 'Mia'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root);
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'laugh_big', 'knocked_out', 'point_forward', 'dance2', 'sit', 'proud', 'scheming', 'look_up', 'dizzy'])
    A[n] = await loadAnimation(n);
  bush = makeBush(); scene.add(bush);
  trap = makeTrap(); trap.position.copy(TRAP); scene.add(trap);
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 24; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  const lm = new THREE.MeshStandardMaterial({ color: '#4fae45', roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 18; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), lm); scene.add(l); leaves.push(l); }
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const runL = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
// A ragdoll fling: arc from `a` to `b` with peak `h`, tumbling, then flat on the back (knocked_out) where it lands.
function fling(b, s, t0, a, to, h, dur, faceE = 'scared') {
  const u = (s - t0) / dur;
  if (u < 1) { b.grounded = false; b.pos = a.clone().lerp(to, u).add(V(0, h * 4 * u * (1 - u), 0)); b.rotX = -u * 9; b.rotZ = u * 3.5; b.layers = [[A.shock, 0.3]]; b.face = faceE; }
  else { b.grounded = false; b.pos = to.clone(); b.layers = [[A.knocked_out, 1]]; b.face = 'dizzy'; }
  return b;
}
// Raid path for Mia: hide -> nest -> hide within [a, b].
function raidPos(s) {
  for (const [a, b] of RAIDS) if (s >= a && s <= b) {
    const half = (b - a) / 2, d = MIA_HIDE.distanceTo(MIA_NEST);
    if (s < a + half) { const m = travel(MIA_HIDE, MIA_NEST, a, s, d / (half - 0.25)); return { pos: m.pos, rotY: m.moving ? m.heading : face(MIA_NEST, N), layers: m.moving ? runL(m, d) : [[A.hold, 0.3]], carry: false }; }
    const m = travel(MIA_NEST, MIA_HIDE, a + half + 0.15, s, d / (half - 0.25)); return { pos: m.pos, rotY: m.moving ? m.heading : face(MIA_HIDE, N), layers: m.moving ? runL(m, d) : [[A.hold, 0.3]], carry: true };
  }
  return null;
}

function leoState(s) {
  const b = st(V(30, 0, 40), 0, idle(s), 'nervous');
  if (s < B.grab) {                                    // tiptoes in
    const from = V(6, 0, 26), d = from.distanceTo(GRAB), m = travelTo(from, GRAB, B.grab - 0.15, s, 6);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(GRAB, EGG_HOME); b.layers = m.moving ? walkL(m, d) : idle(s); b.face = 'nervous';
  } else if (s < B.bonk1) {                            // grabs it, freezes as it wakes, then waddles off slowly
    b.pos = GRAB.clone(); b.rotY = face(GRAB, EGG_HOME); b.layers = [[A.hold, 0.3]]; b.face = s > W.woke ? 'scared' : 'evil_grin';
    if (s > B.run1) { const to = GRAB.clone().add(V(0, 0, 30)), m = travel(GRAB, to, B.run1, s, 3.2); b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.run, (m.u * 30) / STRIDE], [A.hold, 0.3, 0.6]]; b.face = 'scared'; }
  } else if (s < W.three - 0.45) {                     // BONK 1, lies in the grass while Max tries
    const at = GRAB.clone().add(V(0, 0, 3.2 * (B.bonk1 - B.run1)));
    fling(b, s, B.bonk1, at, at.clone().add(V(10, 0, 14)), 9, 1.1);
  } else if (s < W.seven - 0.35) {                     // the bush disguise
    const from = V(5, 0, 24), to = V(1.2, 0, 13), d = from.distanceTo(to), m = travelTo(from, to, B.bush[1], s, 3);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(to, EGG_HOME); b.layers = m.moving ? walkL(m, d) : idle(s); b.face = s > B.chomp ? 'shocked' : 'smug';
    if (s > B.bonkBush) fling(b, s, B.bonkBush, to, to.clone().add(V(9, 0, 12)), 7, 0.9);
  } else if (s < B.dazed[1]) {                         // lying dazed next to Max
    b.grounded = false; b.pos = TEAM.clone().add(V(-1.8, 0, 0)); b.rotY = -Math.PI / 2; b.layers = [[A.knocked_out, 1]]; b.face = 'dizzy';
  } else if (s < B.grab2 + 0.1) {                      // up, fist bump, plan, then sneaks to the egg while Max distracts
    b.pos = TEAM.clone().add(V(-1.8, 0, 0)); b.rotY = face(b.pos, TEAM.clone().add(V(1.8, 0, 0))); b.layers = idle(s); b.face = 'determined';
    if (s > B.bump - 0.2 && s < B.bump + 0.6) b.layers = [[A.point_forward, 0.2]];
    if (s > B.decoy + 0.5) { const from = TEAM.clone().add(V(-1.8, 0, 0)), d = from.distanceTo(GRAB), m = travelTo(from, GRAB, B.grab2, s, 8); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(GRAB, EGG_HOME); b.layers = m.moving ? walkL(m, d) : idle(s); b.face = 'nervous'; }
  } else if (s < B.place) {                            // waddles for the safe zone, then on to the pedestal
    const crossAt = V(-4, 0, SAFE_Z + 0.5), d1 = GRAB.distanceTo(crossAt), m = travelTo(GRAB, crossAt, B.cross, s, d1 / (B.cross - B.grab2 - 0.3));
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(crossAt, PEDESTAL); b.layers = [[A.run, (m.u * d1) / STRIDE], [A.hold, 0.3, 0.6]]; b.face = s > B.turn ? 'scared' : 'determined';
    if (s > B.cross) { const to = PEDESTAL.clone().add(V(0, 0, -2.6)), d2 = crossAt.distanceTo(to), m2 = travelTo(crossAt, to, B.place, s, 7); b.pos = m2.pos; b.rotY = m2.moving ? m2.heading : face(to, PEDESTAL); b.layers = m2.moving ? [[A.walk, (m2.u * d2) / STRIDE], [A.hold, 0.3, 0.6]] : [[A.hold, 0.3]]; b.face = 'laugh'; }
  } else {                                             // at the base: hatch, high five, sees Mia's base, freezes as Mom walks past
    b.pos = PEDESTAL.clone().add(V(0, 0, -2.6)); b.rotY = face(b.pos, PEDESTAL); b.layers = idle(s); b.face = s > B.hatch ? 'happy' : 'determined';
    if (s > B.high5 - 0.2 && s < B.high5 + 0.6) { b.rotY = face(b.pos, V(-9, 0, 57)); b.layers = [[A.point_forward, 0.2]]; b.face = 'laugh'; }
    if (s > B.mia) { b.rotY = face(b.pos, BASE_MIA); b.face = 'shocked'; }
    if (s > B.hear) { b.rotY = face(b.pos, V(-5, 0, 30)); b.layers = [[A.shock, 0.3]]; b.face = 'scared'; }
  }
  return b;
}

function maxState(s) {
  const b = st(V(12, 0, 30), face(V(12, 0, 30), GRAB), idle(s, 0.4), 'smug');
  if (s < B.maxRun) { b.visible = s > B.bonk1 + 0.2; if (s > B.bonk1 + 0.3) { b.layers = [[A.laugh_big, s]]; b.face = 'laugh'; } }
  else if (s < B.bonk2) {                              // sprints in, grabs, runs (slow with the egg)
    const from = V(12, 0, 30), d = from.distanceTo(GRAB), m = travelTo(from, GRAB, B.maxGrab, s, 18);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(GRAB, EGG_HOME); b.layers = m.moving ? runL(m, d) : [[A.hold, 0.3]]; b.face = 'determined';
    if (s > B.maxGrab) { const to = GRAB.clone().add(V(0, 0, 20)), m2 = travel(GRAB, to, B.maxGrab + 0.1, s, 4); b.pos = m2.pos; b.rotY = m2.heading; b.layers = [[A.run, (m2.u * 20) / STRIDE], [A.hold, 0.3, 0.6]]; b.face = 'scared'; }
  } else if (s < W.seven - 0.35) {                     // flung HIGHER
    const at = GRAB.clone().add(V(0, 0, 4 * (B.bonk2 - B.maxGrab - 0.1)));
    fling(b, s, B.bonk2, at, at.clone().add(V(18, 0, 22)), 38, 2.2);
  } else if (s < B.dazed[0]) {                         // try 7: runs with the egg into his own bear trap
    const to = TRAP.clone(), d = GRAB.distanceTo(to), m = travelTo(GRAB, to, B.snap, s, d / (B.snap - B.trapRun));
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(GRAB, TRAP); b.layers = m.moving ? [[A.run, (m.u * d) / STRIDE], [A.hold, 0.3, 0.6]] : [[A.shock, 0.3]]; b.face = s > B.snap ? 'shocked' : 'smug';
    if (s > B.bonkTrap) fling(b, s, B.bonkTrap, TRAP, TRAP.clone().add(V(10, 0, 9)), 8, 0.9);
  } else if (s < B.dazed[1]) {
    b.grounded = false; b.pos = TEAM.clone().add(V(1.8, 0, 0)); b.rotY = -Math.PI / 2; b.layers = [[A.knocked_out, 1]]; b.face = 'dizzy';
  } else if (s < B.decoy) {                            // up, fist bump
    b.pos = TEAM.clone().add(V(1.8, 0, 0)); b.rotY = face(b.pos, TEAM.clone().add(V(-1.8, 0, 0))); b.layers = idle(s); b.face = 'determined';
    if (s > B.bump - 0.2 && s < B.bump + 0.6) b.layers = [[A.point_forward, 0.2]];
  } else if (s < B.circle) {                           // runs in front of the rex: waving, dancing, anything
    const from = TEAM.clone().add(V(1.8, 0, 0)), d = from.distanceTo(DECOY), m = travelTo(from, DECOY, B.decoy + d / 16, s, 16);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(DECOY, GUARD); b.layers = m.moving ? runL(m, d) : [[A.dance2, s, 1, true]]; b.face = 'laugh';
    b.wave = !m.moving && s < W.dancing;
  } else if (s < B.jump) {                             // leads it round the nest
    const a = circleAngle(s); b.pos = V(Math.sin(a) * CIRCLE, 0, Math.cos(a) * CIRCLE); b.rotY = a + Math.PI / 2; b.layers = [[A.run, (CIRCLE * (a - A0)) / STRIDE]]; b.face = 'laugh';
    if (s > B.turn) { const from = V(Math.sin(circleAngle(B.turn)) * CIRCLE, 0, Math.cos(circleAngle(B.turn)) * CIRCLE), to = tailPoint(B.jump).setY(0).add(V(0, 0, 0)), d = from.distanceTo(to), m = travelTo(from, to, B.jump, s, 16); b.pos = m.pos; b.rotY = m.moving ? m.heading : face(to, rexAt(s).pos); b.layers = m.moving ? runL(m, d) : idle(s); b.face = 'determined'; }
  } else if (s < B.bonk3) {                            // jumps onto its tail and holds on while it spins
    const from = tailPoint(B.jump).setY(0), u = seg(s, B.jump, B.onTail), on = tailPoint(s).add(V(0, 0.4, 0));
    b.grounded = false; b.pos = u < 1 ? from.clone().lerp(on, easeOut(u)).add(V(0, 4 * Math.sin(Math.PI * u), 0)) : on; b.rotY = rexAt(s).rotY + Math.PI; b.layers = [[A.hold, 0.3]]; b.face = s > B.whip ? 'scared' : 'evil_grin';
  } else if (s < B.place + 0.2) {                      // flung the highest, over the camera
    const at = tailPoint(B.bonk3); fling(b, s, B.bonk3, at, at.clone().add(V(60, 0, 20)), 46, 2.0);
  } else {                                             // limps back to the base for the hatch
    const from = V(-2, 0, 66), to = PEDESTAL.clone().add(V(3.4, 0, -1.2)), d = from.distanceTo(to), m = travelTo(from, to, B.hatch - 0.1, s, 6);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(to, PEDESTAL); b.layers = m.moving ? walkL(m, d) : idle(s); b.face = s > B.hatch ? 'happy' : 'dizzy';
    if (s > B.high5 - 0.2 && s < B.high5 + 0.6) { b.layers = [[A.point_forward, 0.2]]; b.face = 'laugh'; b.rotY = face(b.pos, PEDESTAL.clone().add(V(0, 0, -2.6))); }
    if (s > B.mia) { b.rotY = face(b.pos, BASE_MIA); b.face = 'shocked'; }
    if (s > B.hear) { b.rotY = face(b.pos, V(-5, 0, 30)); b.layers = [[A.shock, 0.3]]; b.face = 'scared'; }
  }
  return b;
}

function miaState(s) {
  const b = st(MIA_HIDE, face(MIA_HIDE, N), idle(s), 'scheming', { visible: false });
  const r = raidPos(s);
  if (r) { b.visible = true; b.pos = r.pos; b.rotY = r.rotY; b.layers = r.carry ? [...r.layers, [A.hold, 0.3, 0.7]] : r.layers; b.carry = r.carry; b.face = 'scheming'; }
  if (s > B.mia - 0.5) { b.visible = true; b.pos = BASE_MIA.clone().add(V(3, 0.6, -6)); b.rotY = face(b.pos, BASE_LM); b.layers = idle(s); b.face = 'smug'; b.wave = s > W.mias && s < W.mias + 1.4; b.floor = 0.6; }
  if (s > B.hatch12) { b.face = 'shocked'; b.rotY = face(b.pos, BASE_MIA); }
  if (s > B.hear) { b.face = 'scared'; b.rotY = face(b.pos, rexAt(s).pos); b.layers = [[A.shock, 0.3]]; }
  if (s > B.grabMia) {                                 // carried off by the hoodie in the T-rex's jaws
    const u = seg(s, B.grabMia, B.grabMia + 0.35), mouth = mouthPoint();
    b.grounded = false; b.pos = b.pos.clone().lerp(mouth.clone().add(V(0, -4.6, 0)), easeOut(u)); b.rotY = rexAt(s).rotY; b.layers = [[A.idle, 0.3]]; b.face = 'annoyed'; b.dangle = 0.08 * Math.sin(s * 5);
  }
  if (s > B.end) { b.grounded = true; b.floor = 0.8; b.pos = EGG_HOME.clone().setY(0); b.rotY = SLEEP_ROT + Math.PI * 0.85; b.layers = [[A.sit, 0.5]]; b.face = 'annoyed'; b.dangle = 0; }
  return b;
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, (x.rotZ || 0) + (x.dangle || 0), 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  robloxPose(a, x.layers);
  if (x.wave) waveArm(a, x.pos.x + x.pos.z + performanceSafeT, 'R');
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}
let performanceSafeT = 0;

// ---------- the T-rex ----------
const A0 = Math.atan2(DECOY.x, DECOY.z);
function circleAngle(s) { return A0 + Math.max(0, s - B.circle) * (16 / CIRCLE); }
const hitPos = (victim, from) => victim.clone().sub(victim.clone().sub(from).setY(0).normalize().multiplyScalar(REACH));
let rexCache = { t: -1 };
// Where the T-rex is and what it's doing at time s (pos, rotY, pose). Pure function of s.
function rexAt(s) {
  if (rexCache.t === s) return rexCache;
  let pos = SLEEP_AT.clone(), rotY = SLEEP_ROT, pose = trexSleep(s);
  const chase = (from, fromRot, victimAt, tHit, speed = 26) => {
    const target = hitPos(victimAt, from), d = from.distanceTo(target), m = travelTo(from, target, tHit - 0.3, s, Math.max(speed, d / 1.6));
    if (s < tHit - 0.3) { pos = m.pos; rotY = m.moving ? m.heading : fromRot; pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexIdle(s); }
    else { pos = target; rotY = face(target, victimAt); pose = trexHeadbutt(seg(s, tHit - 0.3, tHit + 0.5)); }
  };
  const back = (from, t0) => { const d = from.distanceTo(GUARD), m = travel(from, GUARD, t0, s, 14); pos = m.pos; rotY = m.moving ? m.heading + Math.PI * 0 : GUARD_ROT; pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexIdle(s); };
  const leoRun = (t) => GRAB.clone().add(V(0, 0, 3.2 * Math.max(0, t - B.run1)));
  const maxRun = (t) => GRAB.clone().add(V(0, 0, 4 * Math.max(0, t - B.maxGrab - 0.1)));
  if (s < B.wake[0]) { /* asleep */ }
  else if (s < B.roar[0]) pose = mixPose(trexSleep(s), trexIdle(s), easeInOut(seg(s, ...B.wake)));
  else if (s < B.roar[1]) pose = mixPose(trexIdle(s), trexRoar(s), Math.min(easeInOut(seg(s, B.roar[0], B.roar[0] + 0.25)), 1 - seg(s, B.roar[1] - 0.2, B.roar[1])));
  else if (s < B.bonk1 + 0.5) chase(SLEEP_AT, SLEEP_ROT, leoRun(B.bonk1), B.bonk1, 24);
  else if (s < B.maxGrab) back(hitPos(leoRun(B.bonk1), SLEEP_AT), B.bonk1 + 0.5);
  else if (s < B.bonk2 + 0.5) chase(GUARD, GUARD_ROT, maxRun(B.bonk2), B.bonk2, 30);
  else if (s < B.bush[0]) back(hitPos(maxRun(B.bonk2), GUARD), B.bonk2 + 0.5);
  else if (s < W.seven - 0.35) {                       // sniffs the bush, eats it, then BONK
    const bushAt = V(1.2, 0, 13), bite = hitPos(bushAt, GUARD), d = GUARD.distanceTo(bite), m = travelTo(GUARD, bite, B.chomp - 0.45, s, 10);
    pos = m.pos; rotY = m.moving ? m.heading : face(bite, bushAt); pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexIdle(s);
    if (s > B.chomp - 0.45) pose = trexHeadbutt(seg(s, B.chomp - 0.45, B.chomp + 0.4));
    if (s > B.bonkBush - 0.3) pose = trexHeadbutt(seg(s, B.bonkBush - 0.3, B.bonkBush + 0.5));
  }
  else if (s < B.trapRun) back(hitPos(V(1.2, 0, 13), GUARD), W.seven - 0.35);
  else if (s < B.bonkTrap + 0.5) chase(GUARD, GUARD_ROT, TRAP, B.bonkTrap, 14);
  else if (s < B.decoy) back(hitPos(TRAP, GUARD), B.bonkTrap + 0.5);
  else if (s < B.circle) { pos = GUARD.clone(); rotY = face(GUARD, DECOY); pose = trexIdle(s); if (s > W.dancing) pose = mixPose(trexIdle(s), trexRoar(s), 0.5); }
  else if (s < B.turn) {                               // chases Max round the nest, a little behind him
    const a = circleAngle(s) - 0.55, ramp = easeInOut(seg(s, B.circle, B.circle + 0.8)), onC = V(Math.sin(a) * CIRCLE, 0, Math.cos(a) * CIRCLE);
    pos = GUARD.clone().lerp(onC, ramp); rotY = lerp(face(GUARD, DECOY), a + Math.PI / 2, ramp); pose = trexRun((CIRCLE * Math.max(0, circleAngle(s) - A0)) / (TREX_STRIDE * REXS));
  } else if (s < B.whip) {                             // stops, sniffs, turns towards Leo
    const a = circleAngle(B.turn) - 0.55; pos = V(Math.sin(a) * CIRCLE, 0, Math.cos(a) * CIRCLE);
    rotY = lerp(a + Math.PI / 2, face(pos, leoState(B.turn).pos), easeInOut(seg(s, B.turn, B.turn + 0.6))); pose = trexIdle(s); pose.head = [0.15, 0.15 * Math.sin(s * 9), 0];
  } else if (s < B.bonk3 + 0.4) {                      // Max on its tail: it whips round and flings him
    const a = circleAngle(B.turn) - 0.55; pos = V(Math.sin(a) * CIRCLE, 0, Math.cos(a) * CIRCLE);
    const r0 = face(pos, leoState(B.turn).pos); rotY = r0 + 2.6 * easeInOut(seg(s, B.whip, B.bonk3)); pose = trexRoar(s);
    pose.tail01 = [0.2, 0.5 * Math.sin((s - B.whip) * 14), 0]; pose.tail02 = [0, 0.4 * Math.sin((s - B.whip) * 14 - 0.5), 0];
  } else if (s < W.follow1 + 0.6) {                    // charges after Leo and hits the safe-zone wall
    const a = circleAngle(B.turn) - 0.55, from = V(Math.sin(a) * CIRCLE, 0, Math.cos(a) * CIRCLE), stop = V(-4, 0, SAFE_Z - 12.5), d = from.distanceTo(stop), m = travelTo(from, stop, B.wall, s, Math.max(20, d / (B.wall - B.bonk3 - 0.4)));
    pos = m.pos; rotY = m.moving ? m.heading : face(stop, V(-4, 0, SAFE_Z + 10)); pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexRoar(s);
    if (s > B.wall) { pos = stop.clone().add(V(0, 0, -1.8 * easeOut(seg(s, B.wall, B.wall + 0.3)))); pose = mixPose(trexRoar(s), trexHeadbutt(0.2), 0.5); }
  } else if (s < B.hear) back(V(-4, 0, SAFE_Z - 14.3), W.follow1 + 0.6);
  else if (s < B.grabMia + 0.6) {                      // Mom: hears the babies, walks straight through the safe zone to Mia's base
    const to = BASE_MIA.clone().add(V(0, 0, -14)), d = GUARD.distanceTo(to), tz = (SAFE_Z - GUARD.z) / (to.z - GUARD.z), m = travel(GUARD, to, B.hear + 0.4, s, (d * tz) / (B.through - B.hear - 0.4));
    pos = m.pos; rotY = m.moving ? m.heading : face(to, BASE_MIA); pose = m.moving ? trexRun((m.u * d) / (TREX_STRIDE * REXS)) : trexIdle(s);
    if (s < B.hear + 0.4) { pos = GUARD.clone(); rotY = lerp(GUARD_ROT, face(GUARD, to), seg(s, B.hear, B.hear + 0.4)); pose = trexIdle(s); pose.neck2 = [0.25, 0, 0]; }
    if (s > B.grabMia - 0.4) pose = trexHeadbutt(seg(s, B.grabMia - 0.4, B.grabMia + 0.6) * 0.6);
  } else if (s < B.end) { const to = BASE_MIA.clone().add(V(0, 0, -14)); pos = to; rotY = face(to, GUARD); pose = trexIdle(s); pose.mouth = [0.25, 0, 0]; }
  rexCache = { t: s, pos, rotY, pose };
  return rexCache;
}
function placeRex(c, pos, rotY, pose) {
  c.root.position.copy(pos); c.root.rotation.set(0, rotY, 0); poseCreature(c, pose);
  c.root.position.y -= creatureLowest(c, BODIES); c.root.updateMatrixWorld(true);
}
const rexHead = () => creaturePoint(rex, 'head', 0, 9.6, -8.5);
const mouthPoint = () => creaturePoint(rex, 'head', -0.02, 7.82, -10.43);
// A point on the tail (for Max to land on). Uses the current pose: call after placing the rex for time s.
function tailPoint(s) { const r = rexAt(s); placeRex(rex, r.pos, r.rotY, r.pose); return creaturePoint(rex, 'tail03', 0.01, 6.2, 9.6); }

// ---------- samples ----------
export function samples(t) { return [B.bonk1, B.bonk2, B.bonkBush, B.bonkTrap, B.bonk3].some((b) => t > b - 0.1 && t < b + 1.2) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; performanceSafeT = t; cam = stage.camera;
  const R = rexAt(s); placeRex(rex, R.pos, R.rotY, R.pose);
  const L = leoState(s), M = maxState(s), MI = miaState(s);
  const R2 = rexAt(s); placeRex(rex, R2.pos, R2.rotY, R2.pose);            // (tailPoint may have re-posed it)
  place(leo, L); place(max, M); place(mia, MI);

  // Eggs: the hero egg goes nest -> hands -> back... -> pedestal -> hatches. Nest eggs vanish raid by raid; Mia carries three.
  const hand = (a) => a.root.position.clone().add(V(Math.sin(a.root.rotation.y) * 1.7, 0.9, Math.cos(a.root.rotation.y) * 1.7));
  const flyBack = (from, t0) => from.clone().lerp(EGG_HOME, easeInOut(seg(s, t0, t0 + 0.8))).add(V(0, 6 * Math.sin(Math.PI * seg(s, t0, t0 + 0.8)), 0));
  let ep = EGG_HOME.clone();
  if (s > B.grab && s < B.bonk1) ep = hand(leo);
  else if (s >= B.bonk1 && s < B.bonk1 + 0.8) ep = flyBack(GRAB.clone().add(V(0, 0.9, 3.2 * (B.bonk1 - B.run1) + 1.7)), B.bonk1);
  else if (s > B.maxGrab && s < B.bonk2) ep = hand(max);
  else if (s >= B.bonk2 && s < B.bonk2 + 0.8) ep = flyBack(GRAB.clone().add(V(0, 0.9, 4 * (B.bonk2 - B.maxGrab - 0.1) + 1.7)), B.bonk2);
  else if (s > B.trapRun && s < B.bonkTrap) ep = hand(max);
  else if (s >= B.bonkTrap && s < B.bonkTrap + 0.8) ep = flyBack(TRAP.clone().add(V(0, 0.9, 1.7)), B.bonkTrap);
  else if (s > B.grab2 && s < B.place) ep = hand(leo);
  else if (s >= B.place) ep = PEDESTAL.clone().add(V(0, 2.2, 0));
  heroEgg.position.copy(ep); heroEgg.rotation.set(s > B.hatch - 0.5 && s < B.hatch ? 0.15 * Math.sin(s * 50) : 0, s * 0.3, 0);
  heroEgg.visible = s < B.hatch;
  const left = eggsLeft(s) - (s < B.grab2 ? 1 : 0);
  nestEggs.forEach((e, i) => { e.visible = i < left; });
  miaEggs.forEach((e, i) => { e.visible = s < B.hatch12; e.rotation.z = s > B.hatch12 - 0.5 ? 0.15 * Math.sin(s * 45 + i) : 0; });

  // Babies: ours on the pedestal; Mia's twelve on her plot, then they run to Mom, then asleep round her in the last shot.
  myBaby.root.visible = s >= B.hatch; if (myBaby.root.visible) placeRex(myBaby, PEDESTAL.clone().add(V(0, 2.2, 0)), Math.PI + 0.3, trexIdle(s * 1.5));
  babies.forEach((b, i) => {
    b.root.visible = s >= B.hatch12;
    if (!b.root.visible) return;
    const home = miaEggs[i].position.clone().setY(0.6), cry = trexRoar(s * 1.3 + i), last = s > B.end;
    if (last) { const a = (i / 12) * Math.PI * 2; placeRex(b, V(Math.cos(a) * 9.5, 0, Math.sin(a) * 9.5 - 2), a + 1.6, trexSleep(s + i)); return; }
    let p = home, rot = Math.PI, pose = mixPose(trexIdle(s), cry, s > W.cried - 0.3 && s < B.hear + 0.5 ? 1 : 0.2);
    if (s > W.babies - 0.4) { const to = rexAt(s).pos.clone().add(V((i % 4 - 1.5) * 2.4, 0, -4 - Math.floor(i / 4) * 2.2)), m = travel(home, to, W.babies - 0.4, s, 10); p = m.pos; rot = m.moving ? m.heading : rot; pose = m.moving ? trexRun((m.u * home.distanceTo(to)) / (TREX_STRIDE * BABY)) : trexIdle(s); }
    placeRex(b, p, rot, pose);
  });
  // Last shot = first shot: the rex asleep in the same place and pose.
  if (s > B.end) placeRex(rex, SLEEP_AT, SLEEP_ROT, trexSleep(s));

  // Bush round Leo until the chomp; leaves burst. Bear trap snaps shut on Max.
  bush.visible = s > B.bush[0] - 0.2 && s < B.chomp; if (bush.visible) { bush.position.copy(leo.root.position).setY(0); bush.rotation.y = leo.root.rotation.y; bush.scale.setScalar(1 + 0.03 * Math.sin(s * 9)); }
  leaves.forEach((l, i) => { const u = s - B.chomp; l.visible = u > 0 && u < 1.2; if (!l.visible) return; const a = i * 2.4; l.position.set(1.2 + Math.cos(a) * u * 6, 3 + Math.sin(i) * 1.5 + u * 3 - 6 * u * u, 13 + Math.sin(a) * u * 6); l.rotation.set(u * 9 + i, u * 7, i); });
  trap.visible = s > W.seven - 0.6 && s < B.dazed[0];
  const shut = easeOut(seg(s, B.snap - 0.05, B.snap + 0.05));
  trap.userData.jaws.forEach(({ p, s: sd }) => { p.rotation.x = 0; p.rotation.z = 0; p.rotation.set(0, 0, 0); p.rotateY(Math.PI / 2); p.rotateX(sd * (Math.PI / 2 - (Math.PI / 2 - 0.15) * shut)); });

  // Safe-zone wall ripples when the guardian hits it (stops) and when Mom walks through (doesn't).
  const hit = s - B.wall, thru = s - B.through;
  wallMat.opacity = 0.1 + (hit > 0 && hit < 0.8 ? 0.45 * (1 - hit / 0.8) : 0) + (thru > 0 && thru < 1.2 ? 0.3 * Math.abs(Math.sin(thru * 12)) * (1 - thru / 1.2) : 0);
  wallMat.color.set(thru > 0 && thru < 1.2 ? '#ff5d7a' : '#5dff9e');

  // Puffs: BONK dust at every hit, leaves at the chomp, shell bits at each hatch.
  const events = [];
  for (const bt of [B.bonk1, B.bonk2, B.bonkBush, B.bonkTrap, B.bonk3]) events.push([bt, rexHead(), 2.2, 0.6, '#ffffff']);
  events.push([B.chomp, V(1.2, 3, 13), 2.4, 0.7, '#7ccf5a'], [B.hatch, PEDESTAL.clone().add(V(0, 3, 0)), 1.8, 0.7, '#fff4d8'], [B.hatch12, BASE_MIA.clone().add(V(-4, 2, -1)), 1.6, 0.7, '#fff4d8'], [B.hatch12, BASE_MIA.clone().add(V(4, 2, 1)), 1.6, 0.7, '#fff4d8'], [B.hatch12 + 0.05, BASE_MIA.clone().add(V(0, 2, 3)), 1.6, 0.7, '#fff4d8'], [B.wall, V(-4, 8, SAFE_Z), 4, 0.7, '#9dffc4']);
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur, col] = ev, u = (s - at) / dur, a = i * 0.7;
    p.material.color.set(col); p.material.emissive.set(col);
    p.position.set(c.x + Math.cos(a) * size * 1.4 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.4 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  ff.visible = false;

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const look = (p, tg, fov = 42, ext = 50) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const hc = rexHead(), lp = leo.root.position, mp = max.root.position;
  stage.bloom.strength = 0.3;
  switch (shot.id) {
    case 'hook': case 'end': { const F = V(Math.sin(SLEEP_ROT), 0, Math.cos(SLEEP_ROT)), S = V(Math.cos(SLEEP_ROT), 0, -Math.sin(SLEEP_ROT)), k = shot.id === 'hook' ? u : 1 - u;
      look(SLEEP_AT.clone().add(S.clone().multiplyScalar(-lerp(29, 26, k))).add(F.clone().multiplyScalar(lerp(27, 24, k))).add(V(0, 6, 0)), SLEEP_AT.clone().add(F.clone().multiplyScalar(13)).add(V(1, 4.2, 2)), 46); break; }   // the sleeping T-rex's face over the nest, Leo tiptoeing in
    case 'tiptoe': look(V(16, 5.5, 22), V(1, 3, 5), 40); break;
    case 'wake': look(hc.clone().add(V(16, -2, 22)), hc.clone().add(V(0, -2, 0)).add(jolt(B.roar[0], 0.4, 1.2)), 44); break;
    case 'slow': look(V(lp.x + 34, 9, lp.z + 6), V(lp.x - 4, 7, lp.z - 6), 44); break;
    case 'bonk1': look(V(46, 13, 22).add(jolt(B.bonk1, 0.8)), V(2, 6, 14), 44); break;
    case 'laugh': look(mp.clone().add(V(-5, 3.4, -7)), mp.clone().add(V(0, 2.6, 0)), 40); break;
    case 'maxTry': look(V(44, 12, 18).add(jolt(B.bonk2, 0.8)), V(2, 7, 9), 44); break;
    case 'maxFly': look(V(30, 8, 50), mp.clone().add(V(0, 2, 0)), 46); break;                       // tiny against the sky
    case 'bush': look(V(20, 6, 30), V(2, 4, 13), 42); break;
    case 'chomp': look(V(26, 9, 26).add(jolt(B.chomp, 0.5)).add(jolt(B.bonkBush, 0.7)), V(-1, 7, 10), 44); break;
    case 'trap': look(V(32, 7, 26).add(jolt(B.snap, 0.5)).add(jolt(B.bonkTrap, 0.7)), V(3, 4, 16), 44); break;
    case 'dazed': look(TEAM.clone().add(V(0, 15, 6)), TEAM.clone().add(V(0, 0.5, 0)), 40); break;  // from above: the two of them flat out
    case 'plan': look(TEAM.clone().add(V(0, 4.5, 14)), TEAM.clone().add(V(0, 3, 0)), 44); break;
    case 'decoy': look(V(38, 10, 24), V(6, 7, -2), 44); break;
    case 'circles': look(V(0, 46, 64), V(0, 2, 0), 44, 70); break;                                // high: the rex chasing Max round the nest (Mia below)
    case 'grab2': look(V(20, 6, 18), V(1, 3, 7), 42); break;
    case 'turn': look(lp.clone().lerp(R2.pos, 0.5).add(V(36, 14, 14)), lp.clone().lerp(hc, 0.5), 48, 70); break;
    case 'tailJump': look(R2.pos.clone().add(V(46, 16, 36)).add(jolt(B.bonk3, 0.8)), R2.pos.clone().add(V(0, 9, 0)), 46, 70); break;
    case 'maxFly3': look(V(lerp(20, 30, u), lerp(14, 34, u), lerp(60, 80, u)), mp.clone().lerp(V(0, 30, 60), 0.3), 50, 80); break;   // over the camera
    case 'safe': look(V(30, 9, SAFE_Z + 8).add(jolt(B.wall, 0.9)), V(-4, 8, SAFE_Z - 2), 46, 60); break;
    case 'hatch': look(PEDESTAL.clone().add(V(-7, 6, 10)), PEDESTAL.clone().add(V(0.8, 3, -1)), 44); break;
    case 'miaBase': { const k = easeInOut(seg(s, W.saw - 0.3, W.mias + 0.3)); look(PEDESTAL.clone().lerp(BASE_MIA, k).add(V(0, 9, -18)), PEDESTAL.clone().lerp(BASE_MIA, k).add(V(0, 2, 0)), 44); break; }
    case 'emptyNest': look(V(12, 10, 18), V(0, 2, 0), 42); break;
    case 'hatch12': look(BASE_MIA.clone().add(V(0, 8, -16)), BASE_MIA.clone().add(V(0, 2, 0)), 44); break;
    case 'mom': look(GUARD.clone().add(V(20, 8, 26)), hc.clone().add(V(0, -3, 0)), 44); break;
    case 'through': look(V(-30, 8, SAFE_Z + 22), V(4, 9, SAFE_Z), 46, 70); break;                  // past the frozen boys at the wall
    case 'takeMia': look(BASE_MIA.clone().add(V(-32, 13, -10)), BASE_MIA.clone().add(V(1, 7, -7)), 50, 70); break;
    default: look(V(26, 11, 40), V(-3, 4.5, 2), 44);
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
  return w / s;
}
function tagOver(g, s, p3, text, bg, alpha = 1, k = 1) {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.globalAlpha = alpha; g.translate(p.x, p.y); g.scale(k, k); g.font = `${36 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 32 * s;
  roundRect(g, -w / 2, -28 * s, w, 56 * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
function hud(g, s, t) {
  pill(g, s, 60, 250, 'PREHISTORIC', 'rgba(21,36,53,.88)');      // standalone story: no PART tag (user rule)
  if (t < B.end) {
    const asleep = t < B.wake[0], label = asleep ? 'GUARDIAN: ASLEEP' : 'GUARDIAN: AWAKE';
    pill(g, s, 60, 350, label, asleep ? 'rgba(60,110,200,.9)' : Math.floor(t * 4) % 2 && t < B.bonk1 ? 'rgba(220,40,60,.95)' : 'rgba(190,50,60,.9)', '#ffffff', 34);
    pill(g, s, 60, 432, `NEST: ${eggsLeft(t)} EGG${eggsLeft(t) === 1 ? "" : "S"}`, 'rgba(21,36,53,.8)', '#FFE9A8', 34);
    const n = tries(t); if (n && t < B.dazed[1]) { const k = 1 + 0.4 * (1 - clamp((t - [0, B.bonk1, B.bonk2, W.three - 0.4, 0, 0, 0, W.seven - 0.3][n]) / 0.3)); bigText(g, s, `TRIES ${n}`, 850, 300, 70, '#ff4d5e', { k }); }
  } else pill(g, s, 60, 350, 'BEST EGG: MIA', 'rgba(167,109,255,.92)', '#ffffff', 36);
}

export function overlay(g, s, t) {
  hud(g, s, t);
  // Zzz while asleep (opening and last shot).
  if (t < B.wake[0] || t > B.end) {
    const p = project(rexHead().add(V(0, 4, 0)), s);
    if (p.on) for (let i = 0; i < 3; i++) { const a = (t * 0.6 + i / 3) % 1; g.save(); g.globalAlpha = 1 - a; g.font = `${(50 + 30 * a) * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.strokeStyle = '#152435'; g.lineWidth = 8 * s; const x = p.x + (40 + 60 * a) * s, y = p.y - 170 * a * s; g.strokeText('Z', x, y); g.fillText('Z', x, y); g.restore(); }
  }
  if (t < 2.4) { const p = project(EGG_HOME.clone().add(V(0, 5.5, 0)), s); if (p.on) { bigText(g, s, 'BEST EGG', p.x / s, p.y / s - 40, 54, '#FFD23F', { k: pop(t, 0.2, 0.25, 2) }); bigText(g, s, 'v', p.x / s, p.y / s + 14, 54, '#FFD23F'); } }
  word(g, s, t, W.woke - 0.1, 1.1, 'ROAAAR', '#ff4d5e', 170, 760, 0.04);
  if (t > B.run1 && t < B.bonk1) tagOver(g, s, leo.root.position.clone().add(V(0, 7.5, 0)), 'SPEED -80%', 'rgba(220,40,60,.92)', 1, pop(t, B.run1, 0.2, 2.4));
  for (const bt of [B.bonk1, B.bonk2, B.bonkBush, B.bonkTrap, B.bonk3]) word(g, s, t, bt, 0.8, 'BONK!', '#FFD23F', 190, 760, -0.08);
  word(g, s, t, W.higher - 0.1, 1.0, 'HIGHER', '#7FE3DD', 150, 980);
  word(g, s, t, B.chomp, 0.8, 'CHOMP', '#8BE36B', 170, 980, 0.06);
  word(g, s, t, B.snap, 0.6, 'SNAP', '#ffffff', 170, 980, 0.06);
  if (t > B.plan[0] && t < B.plan[1]) {
    const k = pop(t, B.plan[0], 0.25, 2);
    g.save(); g.translate(540 * s, 1000 * s); g.scale(k, k); g.rotate(-0.03);
    roundRect(g, -400 * s, -150 * s, 800 * s, 300 * s, 36 * s); g.fillStyle = 'rgba(21,36,53,.94)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#FFD23F'; g.stroke();
    g.font = `${54 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFD23F'; g.fillText('THE PLAN', 0, -92 * s);
    g.font = `${70 * s}px "Luckiest Guy"`; g.fillStyle = '#7FE3DD'; g.fillText('MAX = DECOY', 0, -10 * s); g.fillStyle = '#FF9E80'; g.fillText('LEO = EGG', 0, 74 * s); g.restore();
  }
  word(g, s, t, W.teamwork - 0.1, 0.6, 'TEAMWORK', '#FFD23F', 150, 1000);
  if (t > B.grab2 && t < B.cross) tagOver(g, s, leo.root.position.clone().add(V(0, 7.5, 0)), 'SPEED -80%', 'rgba(220,40,60,.92)');
  if (t > B.turn && t < B.whip) word(g, s, t, B.turn, B.whip - B.turn, '!', '#ff4d5e', 200, 700);
  word(g, s, t, B.cross, 1.2, 'SAFE!', '#3cff8a', 180, 760);
  if (t > B.hatch && t < B.mia) tagOver(g, s, PEDESTAL.clone().add(V(0, 7, 0)), '+$1/s', 'rgba(40,170,80,.92)', 1, pop(t, B.hatch, 0.2, 2.5));
  if (t > W.mias - 0.2 && t < B.hatch12) {
    const money = Math.floor(lerp(12, 4800, seg(t, W.mias - 0.2, B.hatch12)) * 12);
    tagOver(g, s, BASE_MIA.clone().add(V(0, 7, 0)), `+$${money.toLocaleString('en-US')}/s`, 'rgba(167,109,255,.94)', 1, pop(t, W.mias - 0.2, 0.2, 2.5));
    word(g, s, t, W.twelve - 0.1, 1.2, '12 EGGS', '#C9A6FF', 160, 1000);
  }
  if (t > B.empty && t < B.hatch12) bigText(g, s, 'NEST: 0', 540, 1000, 130, '#ff4d5e', { k: pop(t, B.empty, 0.2, 2.5) });
  if (t > W.cried - 0.3 && t < B.hear + 0.4) for (let i = 0; i < 5; i++) { const b = babies[i * 2]; if (!b?.root.visible) continue; const p = project(b.root.position.clone().add(V(0, 5, 0)), s); if (p.on) bigText(g, s, 'WAAH', p.x / s, p.y / s - 30 * Math.sin(t * 9 + i), 46, '#ffffff'); }
  if (t > B.through - 0.4 && t < W.walked) { bigText(g, s, 'SAFE ZONE', 540, 700, 96, '#3cff8a', { k: pop(t, B.through - 0.4) }); bigText(g, s, 'GUARDIANS ONLY', 540, 800, 80, '#ffffff', { k: pop(t, B.through - 0.3) }); if (t > W.moms - 0.1) bigText(g, s, 'NOT MOMS', 540, 920, 110, '#ff4d5e', { k: pop(t, W.moms - 0.1, 0.2, 3), rot: -0.08 }); }
  // Call to action.
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
  flash(g, s, [B.bonk1, B.bonk2, B.bonkBush, B.bonkTrap, B.bonk3].some((b) => t >= b && t < b + 0.1) ? 0.35 : 0, '#ffffff');
  if (['maxFly', 'maxFly3', 'slow'].includes(SHOT)) speedLines(g, s, t, 0.3, { cx: 540, cy: 900 });
}

export const cast = () => ({ leo, max, mia, rex });
