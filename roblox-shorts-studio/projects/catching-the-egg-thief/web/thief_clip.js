// Catching the Egg Thief (standalone): a Steal an Egg parody about the base-stealing side of the game. Web renderer +
// Roblox R6 pack + the game's own eggs and spinosaurus (props/egg_*, creatures/spinosaurus, creatures/animal_capybara).
// Beat times come from web/beats.js (source/beats.py: narration word timings), so the clip retimes itself.
// A hooded 50,000-speed thief empties Leo's base every night; a stake-out, a laser door and a capybara guard all fail.
// Leo spends everything on one Mythic egg with a 60 s hatch timer and a DO NOT STEAL sign. The thief takes it right on
// time; it hatches in their arms into a giant spinosaurus that knows its owner and carries the thief back by the hood.
// Hood off: Max. He repays it on the treadmill in four seconds (50,000 speed) and breaks it.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, sign, puff, canvasTexture, neonMaterial } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem } from '../../../web/lib/robloxPack.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { loadCreature, poseCreature, creatureLowest, creaturePoint } from '../../../web/lib/creature.js';
import { spinoIdle, spinoWalk, spinoRoar, spinoBend, mixPose, addPose, SPINO_STRIDE } from '../../../web/lib/spinoPoses.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Catching the Egg Thief' };
export const sky = { zenith: '#070d24', horizon: '#26346a', below: '#0b1020', fog: '#121a36', sunColor: '#cfe0ff', sunDir: new THREE.Vector3(-0.35, 0.75, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));

// ---------- layout (Leo's base at the origin, door at +Z, the road beyond it along X) ----------
const PEDS = []; for (const z of [-10, -5]) for (const x of [-10, -5, 0, 5, 10]) PEDS.push(V(x, 0, z));
const PED_H = 1.4, MYTH = V(0, 0, 3), DOOR_Z = 13, ROAD_Z = 27;
const BUSH = V(-9, 0, 19.5), HIDE = V(-9, 0, 19.2), STOP = V(-3.5, 0, 21.5);       // thief's freeze spot, right by the bush
const CHAIR = V(-9, 0, 5), CHAIR_ROT = 0.75, SIGN_AT = V(3.8, 0, 5.2);
const HATCH_AT = V(-62, 0, ROAD_Z), SPS = 0.9;                                    // where the egg hatches; spinosaurus scale
const SPINO_STOP = V(-3, 0, 33), DROP = V(-3.5, 0, 14.4);                          // it stops on the road, Max dropped at the door
const TREAD = V(9, 0, 6), SPINO_TREAD = V(36, 0, -6), SPINO_TREAD_ROT = face(V(36, 0, -6), V(11, 0, 6));
const CAPY_AT = V(0, 0, 14.6), CAPY_FACE = -Math.PI / 2;

// ---------- beats (all from narration words) ----------
const B = {
  bush: W.tonight - 0.3, zipIn: W.hooded - 0.25, grab0: W.grabs - 0.15, grab1: W.every + 0.55, freeze: W.checked - 0.15, pop: W.mine - 0.15,
  chase: W.chased - 0.1, gone: W.gone - 0.25,
  night2: W.night2 - 0.45, limbo: [W.limboed - 0.5, W.under + 0.35], empty2: W.under + 0.6,
  night3: W.night3 - 0.45, apple: W.bribed - 0.25, take: W.apple - 0.05, zip3: W.apple + 0.45,
  think: W.stopped - 0.3, buy: W.spent - 0.1, egg: W.mythic - 0.05, timer: W.hatches - 0.2, sign: W.sign - 0.15,
  theft: W.right - 0.35, grab: W.grabbed - 0.1, ran: W.ran - 0.1, sit: W.didnt - 0.3,
  hatch: W.hatched - 0.05, roar: W.giant - 0.1, owner: W.owner - 0.35, bend: W.picked - 0.3, lift: W.hood + 0.15, carry: W.carried - 0.1, arrive: W.me + 0.1,
  hoodOff: W.hoodoff - 0.05, max: W.max - 0.1, quote: W.said - 0.15, tread: W.pays - 0.45, fast: W.fifty2 - 0.1, paid: W.seconds + 0.2,
  broke: W.broke - 0.1, cta: W.follow,
};
// The Mythic egg's hatch timer: 60 at "sixty", fast-forwards to the theft, then real seconds down to 3-2-1 and the hatch.
const hatchLeft = (s) => s < W.hatches ? 60 : s < B.theft ? lerp(60, 9, easeInOut(seg(s, W.hatches, B.theft))) : s < W.three ? lerp(9, 3, seg(s, B.theft, W.three))
  : s < W.two ? lerp(3, 2, seg(s, W.three, W.two)) : s < W.one ? lerp(2, 1, seg(s, W.two, W.one)) : s < B.hatch ? lerp(1, 0, seg(s, W.one, B.hatch)) : 0;
// Eggs on Leo's pedestals at time s, and which ones are in the thief's stack.
function eggCount(s) {
  if (s < B.bush) return 0;
  if (s < B.grab0) return 10;
  if (s < B.night2) return 10 - grabbed(s);
  if (s < B.empty2) return 10;
  if (s < B.night3) return 0;
  if (s < B.zip3 + 0.5) return 10;
  if (s < B.tread) return 0;
  return 10;
}
const grabbed = (s) => Math.floor(10 * clamp((s - B.grab0) / (B.grab1 - B.grab0)) + 1e-6);

const SHOTS = [
  [0, 'hook'], [B.bush, 'bush'], [W.midnight - 0.1, 'midnight'], [B.zipIn, 'zip'], [B.freeze, 'freeze'], [B.pop, 'pop'], [B.chase, 'chase'],
  [B.night2, 'laser'], [B.limbo[0] - 0.1, 'limbo'], [B.night3, 'capy'], [W.stopped - 0.35, 'think'], [B.buy, 'buy'], [W.sign - 0.3, 'sign'],
  [B.theft, 'theft'], [B.sit - 0.05, 'chair'], [W.three - 0.25, 'count'], [B.hatch - 0.35, 'hatch'], [B.owner, 'owner'], [B.bend, 'pick'],
  [B.carry, 'carry'], [B.hoodOff - 0.3, 'hoodOff'], [B.quote, 'quote'], [B.tread, 'tread'], [B.fast, 'fast'], [B.broke - 0.2, 'broke'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let thiefLight, mythPed, A = {}, leo, max, spino, SP_BODIES, capy, capyHat, eggs = [], myth, mythShell = [], hood, hoodFly, apple, lasers = [], laserPosts, bush, chair, tread, treadBelt, treadParts = [], signBoard, cam, SHOT = 'hook', moonLight;
const puffs = [], sparks = [];
let EGG_K = [];

function makeBush() {
  const g = new THREE.Group(), r = rng(31), m1 = new THREE.MeshStandardMaterial({ color: '#2f7a34', roughness: 0.9, flatShading: true }), m2 = new THREE.MeshStandardMaterial({ color: '#3f9443', roughness: 0.9, flatShading: true });
  for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 + r() * 0.45, 0), i % 2 ? m1 : m2); const a = r() * Math.PI * 2, h = 0.6 + r() * 1.5; b.position.set(Math.cos(a) * (1.4 + r() * 0.6), h, Math.sin(a) * (1.2 + r() * 0.5)); b.castShadow = true; g.add(b); }
  return g;
}
// The thief's hood (on Max's head bone; head centre is 0.5 above the bone). Front open, face in shadow, two glowing eyes.
function makeHood(withFace = true) {
  const g = new THREE.Group(), cloth = new THREE.MeshStandardMaterial({ color: '#4a5068', roughness: 0.8 });
  const box = (w, h, d, x, y, z, m = cloth) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  box(1.66, 0.22, 1.7, 0, 1.22, -0.05);                // top
  box(0.22, 1.5, 1.7, -0.72, 0.5, -0.05); box(0.22, 1.5, 1.7, 0.72, 0.5, -0.05);  // sides
  box(1.66, 1.6, 0.22, 0, 0.48, -0.82);                // back
  const peak = box(0.9, 0.5, 0.9, 0, 1.3, -0.62); peak.rotation.x = 0.7;
  box(1.66, 0.2, 0.25, 0, 1.08, 0.72);                 // brim over the face
  if (withFace) {
    box(1.22, 1.22, 0.02, 0, 0.5, 0.615, new THREE.MeshBasicMaterial({ color: '#05060a' }));
    for (const x of [-0.24, 0.24]) box(0.2, 0.09, 0.02, x, 0.6, 0.63, new THREE.MeshBasicMaterial({ color: '#bff6ff' }));
  }
  return g;
}
function makeLaserDoor(scene) {
  const g = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: '#5a6170', metalness: 0.6, roughness: 0.35 });
  for (const x of [-5.4, 5.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), steel); p.position.set(x, 3.5, DOOR_Z); p.castShadow = true; g.add(p); const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), neonMaterial('#ff2a3a', 2.5)); cap.position.set(x, 7.1, DOOR_Z); g.add(cap); }
  const lm = new THREE.MeshBasicMaterial({ color: '#ff2a3a' });
  for (const y of [2.1, 3.0, 3.9, 4.8, 5.7, 6.6]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 10.8, 6), lm); l.rotation.z = Math.PI / 2; l.position.set(0, y, DOOR_Z); g.add(l); lasers.push(l); }
  scene.add(g); return g;
}
function makeChair() {
  const g = new THREE.Group(), frame = new THREE.MeshStandardMaterial({ color: '#d9dde4', metalness: 0.5, roughness: 0.4 }), cloth = new THREE.MeshStandardMaterial({ color: '#2fa6c8', roughness: 0.8 });
  const b = (w, h, d, x, y, z, m, rx = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = true; g.add(o); };
  b(2.2, 0.15, 2.0, 0, 1.0, 0, cloth); b(2.2, 2.2, 0.15, 0, 2.0, -1.15, cloth, -0.35);
  for (const x of [-1.05, 1.05]) for (const z of [-0.9, 0.9]) b(0.12, 1.0, 0.12, x, 0.5, z, frame);
  for (const x of [-1.15, 1.15]) b(0.15, 0.12, 1.9, x, 1.6, 0.1, frame);
  return g;
}
function makeTreadmill() {
  const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.6 }), steel = new THREE.MeshStandardMaterial({ color: '#b9c0cc', metalness: 0.6, roughness: 0.3 });
  const beltTex = canvasTexture(64, 512, (x, w, h) => { x.fillStyle = '#16181d'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a3f4a'; for (let i = 0; i < 8; i++) x.fillRect(0, i * 64, w, 12); });
  beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;
  const parts = [];
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); parts.push(o); return o; };
  add(new THREE.BoxGeometry(3.2, 0.7, 7.2), dark, 0, 0.35, 0);
  treadBelt = add(new THREE.BoxGeometry(2.6, 0.05, 6.6), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.9 }), 0, 0.73, 0);
  for (const x of [-1.5, 1.5]) { add(new THREE.BoxGeometry(0.15, 2.6, 0.15), steel, x, 1.9, 3.1); add(new THREE.BoxGeometry(0.15, 0.15, 2.2), steel, x, 3.15, 2.05); }
  add(new THREE.BoxGeometry(3.2, 1.2, 0.3), dark, 0, 3.6, 3.15);
  const screen = canvasTexture(256, 96, (x, w, h) => { x.fillStyle = '#071a10'; x.fillRect(0, 0, w, h); x.fillStyle = '#3cff8a'; x.font = '56px "Luckiest Guy"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$$$', w / 2, h / 2 + 4); });
  add(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshStandardMaterial({ map: screen, emissive: '#ffffff', emissiveMap: screen, emissiveIntensity: 0.9 }), 0, 3.6, 2.99).rotation.y = Math.PI;
  return { g, parts };
}
function makeSign() {
  const g = new THREE.Group(), w = 4.4, h = 2.8;
  const tex = canvasTexture(880, 560, (x, W, H) => {
    x.fillStyle = '#fff6d8'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ff3b4e'; x.lineWidth = 26; x.strokeRect(13, 13, W - 26, H - 26);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '150px "Luckiest Guy"'; x.fillStyle = '#b8860b'; x.fillText('SUPER RARE', W / 2, 190);
    x.font = '120px "Luckiest Guy"'; x.fillStyle = '#ff3b4e'; x.fillText('DO NOT STEAL', W / 2, 390);
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), new THREE.MeshStandardMaterial({ color: '#6b4a2e' })); board.position.y = 2.6 + h / 2; board.castShadow = true; g.add(board);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 })); f.position.set(0, 2.6 + h / 2, 0.11); g.add(f);
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.7, 0.3), new THREE.MeshStandardMaterial({ color: '#6b4a2e' })); p.position.y = 1.35; g.add(p);
  return g;
}
async function placed(kind, name, h) { const o = await packItem(kind, name); const b = new THREE.Box3().setFromObject(o); const k = h / (b.max.y - b.min.y); o.scale.setScalar(k); o.userData.k = k; return o; }

export async function setup(stage) {
  const { scene } = stage; const r = rng(11);
  scene.fog.near = 60; scene.fog.far = 330;
  // Night: low cool moonlight, faint sky light; the bases glow.
  stage.sun.color.set('#9fb6ff'); stage.sun.intensity = 1.35; stage.hemi.color.set('#6d7fb8'); stage.hemi.groundColor.set('#1a1f2e'); stage.hemi.intensity = 0.42;
  stage.fill.intensity = 0.35; stage.fill.color.set('#7f9cff'); stage.rim.intensity = 0.9; stage.rim.color.set('#8fb0ff'); scene.environmentIntensity = 0.3;
  scene.add(part(500, 4, 500, '#2f5a33'));
  const road = part(500, 0.1, 9, '#2c2f37', { rough: 0.9 }); road.position.set(0, 0.06, ROAD_Z); scene.add(road);
  for (let x = -240; x < 240; x += 8) { const d = part(3.4, 0.05, 0.35, '#e8d58a'); d.position.set(x, 0.13, ROAD_Z); scene.add(d); }
  // Moon and stars.
  const moon = new THREE.Mesh(new THREE.SphereGeometry(22, 32, 16), new THREE.MeshBasicMaterial({ color: '#f4f1df', fog: false })); moon.position.set(-170, 230, -520); scene.add(moon);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: '#8fa6ff', transparent: true, opacity: 0.12, fog: false, depthWrite: false })); glow.position.copy(moon.position); scene.add(glow);
  const sp = []; for (let i = 0; i < 700; i++) { const a = r() * Math.PI * 2, e = 0.08 + r() * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 900, Math.sin(e) * 900, Math.sin(a) * Math.cos(e) * 900); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })));

  // Leo's base: studded plot, glowing pedestals, name sign, lamp.
  const plot = part(36, 0.3, 28, '#8a93a8', { studs: true }); plot.position.set(0, 0.08, -1); scene.add(plot);
  for (const [x, z, w, d] of [[-18.2, -1, 0.6, 28.6], [18.2, -1, 0.6, 28.6], [0, -15.2, 37, 0.6], [-11.5, 13, 13, 0.6], [11.5, 13, 13, 0.6]]) { const w2 = part(w, 1.4, d, '#c9cfdb'); w2.position.set(x, 1.4, z); scene.add(w2); const n = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.12, d + 0.05), neonMaterial('#46c8ff', 2.2)); n.position.set(x, 1.45, z); scene.add(n); }
  const nm = sign("LEO'S BASE", { w: 9, h: 2.2, post: 4.6, bg: '#152435', accent: '#46c8ff' }); nm.position.set(-12, 0, -16.4); scene.add(nm);
  for (const p of PEDS) {
    const ped = part(2.6, PED_H, 2.6, '#eef1f6', { center: true }); ped.position.copy(p).add(V(0, PED_H / 2, 0)); scene.add(ped);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.14, 2.75), neonMaterial('#46c8ff', 2.4)); ring.position.copy(p).add(V(0, PED_H - 0.05, 0)); scene.add(ring);
  }
  mythPed = new THREE.Group(); const mp = part(3.4, 1.8, 3.4, '#ffd23f', { center: true, extra: { metalness: 0.5 } }); mp.position.set(0, 0.9, 0); mythPed.add(mp);
  const mring = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 3.6), neonMaterial('#ff5ad8', 2.6)); mring.position.set(0, 1.75, 0); mythPed.add(mring); mythPed.position.copy(MYTH); scene.add(mythPed);
  const lamp1 = new THREE.PointLight('#ffd9a0', 60, 40, 1.6); lamp1.position.set(0, 9, 0); scene.add(lamp1);
  const lamp2 = new THREE.PointLight('#ffcf8a', 50, 34, 1.6); lamp2.position.set(-17, 7, ROAD_Z - 4); scene.add(lamp2);
  for (const x of [-17, 30, -52]) { const pole = part(0.4, 8, 0.4, '#3a3f4a', { center: true }); pole.position.set(x, 4, ROAD_Z - 5.4); scene.add(pole); const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.4), neonMaterial('#ffe2a8', 3)); bulb.position.set(x, 8.1, ROAD_Z - 5); scene.add(bulb); }
  const lampFar = new THREE.PointLight('#ffcf8a', 60, 40, 1.6); lampFar.position.set(-52, 7, ROAD_Z - 4); scene.add(lampFar);
  moonLight = lamp1;
  // Neighbours' bases along the road (dim, for depth), trees behind.
  for (const [x, z, col] of [[-48, -1, '#ff7ab6'], [48, -1, '#8bff7a'], [-96, -1, '#ffb347'], [96, -1, '#b98bff'], [-30, 58, '#7af0ff'], [30, 58, '#ff6b6b'], [-80, 58, '#ffe066']]) {
    const p2 = part(36, 0.3, 28, '#6f778a'); p2.position.set(x, 0.08, z); scene.add(p2);
    for (let i = 0; i < 4; i++) { const pd = part(2.6, 1.4, 2.6, '#d6dbe4', { center: true }); pd.position.set(x - 9 + i * 6, 0.7, z - 6 * Math.sign(z || 1) * -1); scene.add(pd); const n = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.14, 2.75), neonMaterial(col, 2.2)); n.position.set(x - 9 + i * 6, 1.35, z - 6 * Math.sign(z || 1) * -1); scene.add(n); }
  }
  for (let i = 0; i < 40; i++) { const x = -220 + r() * 440, z = -30 - r() * 80; const t = part(1.2, 6, 1.2, '#4a3524', { center: true }); t.position.set(x, 3, z); scene.add(t); const top = part(6, 6, 6, i % 2 ? '#1f4a2a' : '#245733', { center: true }); top.position.set(x, 8, z); scene.add(top); }

  // Eggs: ten on the pedestals (they also make the thief's stack and fall out of the hood), the Mythic one.
  const NAMES = ['egg_basic', 'egg_rare', 'egg_epic', 'egg_super_rare', 'egg_prism', 'egg_magic_rabbit', 'egg_fennec_fox', 'egg_ninja_dog', 'egg_cowboy_cow', 'egg_little_monster'];
  for (let i = 0; i < 10; i++) { const e = await placed('props', NAMES[i], 2.3); scene.add(e); eggs.push(e); }
  EGG_K = eggs.map((e) => e.userData.k);
  myth = await placed('props', 'egg_spinosaurus', 3.4); scene.add(myth);
  const shellM = [new THREE.MeshStandardMaterial({ color: '#b8424a', roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#2a2433', roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: '#f0e2c8', roughness: 0.6 })];
  for (let i = 0; i < 18; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6 + r() * 0.5, 0.6 + r() * 0.5, 0.3), shellM[i % 3]); c.castShadow = true; c.userData.v = V(Math.cos(i * 2.4) * (5 + r() * 5), 7 + r() * 6, Math.sin(i * 2.4) * (5 + r() * 5)); c.userData.w = V(r() * 9, r() * 9, r() * 9); scene.add(c); mythShell.push(c); }
  signBoard = makeSign(); signBoard.position.copy(SIGN_AT); signBoard.rotation.y = 0.35; scene.add(signBoard);

  bush = makeBush(); bush.position.copy(BUSH); scene.add(bush);
  laserPosts = makeLaserDoor(scene);
  chair = makeChair(); chair.position.copy(CHAIR); chair.rotation.y = CHAIR_ROT; scene.add(chair);
  tread = makeTreadmill(); tread.g.position.copy(TREAD); tread.g.rotation.y = -Math.PI / 2; scene.add(tread.g); treadParts = tread.parts.map((p) => ({ p, home: p.position.clone(), v: V((r() - 0.5) * 14, 6 + r() * 10, (r() - 0.5) * 14), w: V(r() * 8, r() * 8, r() * 8) }));

  capy = await placed('creatures', 'animal_capybara', 2.1); scene.add(capy);
  capyHat = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: '#1d2a5a', roughness: 0.6 }); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.5, 16), m); top.position.y = 0.25; capyHat.add(top); const brim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: '#111522' })); brim.position.set(0, 0.04, 0.45); capyHat.add(brim); const badge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.05), neonMaterial('#ffd23f', 1.5)); badge.position.set(0, 0.3, 0.6); capyHat.add(badge); }
  scene.add(capyHat);
  apple = new THREE.Group(); { const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.62), new THREE.MeshStandardMaterial({ color: '#e0283a', roughness: 0.45 })); apple.add(a1); const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), new THREE.MeshStandardMaterial({ color: '#5a3a1a' })); st2.position.y = 0.38; apple.add(st2); const lf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.14), new THREE.MeshStandardMaterial({ color: '#3fa34a' })); lf.position.set(0.15, 0.42, 0); apple.add(lf); }
  scene.add(apple);

  spino = await loadCreature('spinosaurus'); spino.root.scale.setScalar(SPS); scene.add(spino.root);
  SP_BODIES = Object.keys(spino.bodies).filter((n) => spino.bodies[n].meshes.length);

  const ex = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'suspicious', 'nervous', 'confused', 'knocked_out', 'blink', 'sad'];
  [leo, max] = await Promise.all(['Leo', 'Max'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root);
  // The thief's outfit: black cloak over Max's clothes (stays on after the reveal), hood on the head bone.
  const cloak = new THREE.MeshStandardMaterial({ color: '#4a5068', roughness: 0.8 }), trousers = new THREE.MeshStandardMaterial({ color: '#30344a', roughness: 0.85 });
  thiefLight = new THREE.PointLight('#b9ccff', 16, 12, 1.6); scene.add(thiefLight);
  max.root.traverse((o) => { if (!o.isMesh) return; if (['Torso', 'Left Arm', 'Right Arm'].includes(o.name)) o.material = cloak; if (['Left Leg', 'Right Leg'].includes(o.name)) o.material = trousers; });
  const cape = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 0.12), cloak); cape.position.set(0, -1.35, -0.58); cape.rotation.x = 0.08; cape.castShadow = true; max.bones.Torso.add(cape);
  hood = makeHood(true); max.bones.Head.add(hood);
  hoodFly = makeHood(false); scene.add(hoodFly);
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'facepalm', 'think', 'sit', 'scheming', 'point_forward', 'defeated', 'knocked_out', 'shrug', 'fall', 'proud', 'look_up', 'panic', 'laugh'])
    A[n] = await loadAnimation(n);
  for (let i = 0; i < 26; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 24; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.6), neonMaterial('#ffd23f', 4)); scene.add(k); sparks.push(k); }
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const runL = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
// Path along points at constant speed starting at t0 (or arriving by tEnd). Returns {pos, heading, moving, dist}.
function path(pts, t0, s, speed) {
  const lens = pts.slice(1).map((p, i) => p.distanceTo(pts[i])), total = lens.reduce((a, b) => a + b, 0);
  let d = clamp((s - t0) * speed, 0, total), i = 0; const dist = d;
  while (i < lens.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
  const u = lens[i] ? d / lens[i] : 1;
  return { pos: pts[i].clone().lerp(pts[i + 1], u), heading: face(pts[i], pts[i + 1]), moving: s > t0 && dist < total, dist, done: dist >= total, end: t0 + total / speed };
}

function leoState(s) {
  const b = st(V(2, 0, 4), Math.PI, idle(s), 'shocked');
  if (s < B.bush) {                                     // hook: in the empty base, facing us; the thief vanishing down the road
    b.pos = V(-1.6, 0, -0.5); b.rotY = face(b.pos, V(2.5, 0, -15)); b.layers = s < W.again - 0.15 ? idle(s) : [[A.facepalm, s - W.again + 0.15]]; b.face = s < W.again - 0.15 ? 'shocked' : 'annoyed';
  } else if (s < B.chase) {                             // in the bush: only the head pokes out, then he pops up
    b.pos = HIDE.clone(); b.rotY = face(HIDE, V(0, 0, 8)); b.grounded = false; b.layers = idle(s); b.face = s > B.zipIn ? 'shocked' : 'determined';
    const up = s > B.pop ? easeOutBack(seg(s, B.pop, B.pop + 0.3)) : 0;
    b.pos.y = lerp(-1.85, 0, up) + (s > W.footsteps - 0.2 && s < B.zipIn ? 0.15 * Math.abs(Math.sin(s * 12)) : 0);
    if (s > B.freeze) b.rotY = face(HIDE, STOP);
    if (s > B.pop) b.face = 'angry';
  } else if (s < B.night2) {                            // chases for one second, then gives up, panting
    const to = HIDE.clone().add(V(-6, 0, 5)), m = travel(HIDE, to, B.chase, s, 16);
    b.pos = m.pos; b.rotY = m.heading; b.layers = m.moving ? runL(m, 9) : [[A.defeated, s - m.arrive]]; b.face = m.moving ? 'determined' : 'dizzy';
  } else if (s < B.night3) {                            // night 2: behind his laser door, smug, then shocked
    b.pos = V(-4, 0, 6); b.rotY = face(b.pos, V(0, 0, DOOR_Z)); b.layers = s < B.limbo[0] ? [[A.proud, 0.4]] : [[A.shock, 0.3]]; b.face = s < B.limbo[0] ? 'smug' : 'shocked';
  } else if (s < W.stopped - 0.35) {                    // night 3: watching from the base
    b.pos = V(-5, 0, 4); b.rotY = face(b.pos, CAPY_AT); b.layers = s < B.take ? idle(s) : [[A.facepalm, s - B.take]]; b.face = s < B.take ? 'cool' : 'annoyed';
  } else if (s < B.theft) {                             // the idea, buying the egg, the sign
    b.pos = V(-2.4, 0, 6.2); b.rotY = face(b.pos, s < B.buy ? V(-1, 0, 16) : V(6, 0, 16)); b.layers = s < B.buy ? [[A.think, s - W.stopped]] : idle(s); b.face = s < B.buy ? 'scheming' : s < B.egg ? 'determined' : 'evil_grin';
    if (s > W.sign - 0.3) { b.rotY = face(b.pos, V(0, 0, 14)); b.layers = [[A.point_forward, 0.2]]; b.face = 'scheming'; }
  } else if (s < B.arrive + 0.2) {                      // in the lawn chair, not chasing, counting
    b.pos = CHAIR.clone().add(V(0, 0, 0)); b.rotY = CHAIR_ROT; b.layers = [[A.sit, 0.5]]; b.floor = 0.95; b.face = s > B.hatch ? 'laugh' : 'smug';
  } else if (s < B.tread) {                             // stands, faces the dropped thief
    const from = CHAIR.clone().add(V(1.2, 0, 1.2)), to = V(-8.6, 0, 11.4), d = from.distanceTo(to), m = travel(from, to, B.arrive + 0.2, s, 10);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(to, DROP); b.layers = m.moving ? walkL(m, d) : idle(s); b.face = s > B.max ? 'shocked' : 'angry';
    if (s > B.quote + 0.6) { b.layers = [[A.facepalm, s - B.quote - 0.6]]; b.face = 'annoyed'; }
  } else {                                              // watches Max repay; facepalm when it breaks
    b.pos = TREAD.clone().add(V(-5.5, 0, 4.2)); b.rotY = face(b.pos, TREAD); b.layers = s < B.broke ? [[A.proud, 0.4]] : [[A.facepalm, s - B.broke]]; b.face = s < B.fast ? 'smug' : s < B.broke ? 'surprised' : 'annoyed';
  }
  return b;
}

function maxState(s) {
  const b = st(V(80, 0, ROAD_Z), -Math.PI / 2, idle(s), 'neutral', { visible: false, hood: true, stack: 0 });
  const FAST = 70;
  if (s < B.bush) {                                     // hook: sprinting off down the road with the tower of eggs
    const m = path([V(6, 0, ROAD_Z - 1), V(-90, 0, ROAD_Z + 1)], 0.0, s, 11);
    b.visible = s > 0.15 && !m.done; b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.run, m.dist / STRIDE], [A.hold, 0.3, 0.7]]; b.stack = 10;
    b.visible = !m.done;
  } else if (s < B.night2) {
    if (s < B.zipIn) return b;
    // zips in from the road, round the ten pedestals, out to the bush
    const route = [V(70, 0, ROAD_Z), V(0, 0, ROAD_Z - 2), V(0, 0, 15), ...PEDS.slice(5).reverse().map((p) => p.clone().add(V(0, 0, 2.2))), ...PEDS.slice(0, 5).map((p) => p.clone().add(V(0, 0, -2.2))), V(14, 0, -3), V(0, 0, 15), STOP];
    const inEnd = B.grab0, m1 = path(route.slice(0, 3), B.zipIn, s, 70 / Math.max(0.3, inEnd - B.zipIn) * 1.0);
    b.visible = true;
    if (s < inEnd) { b.pos = m1.pos; b.rotY = m1.heading; b.layers = [[A.run, m1.dist / STRIDE]]; }
    else {
      const r2 = route.slice(2), len = r2.slice(1).reduce((a, p, i) => a + p.distanceTo(r2[i]), 0), m2 = path(r2, inEnd, s, len / (B.freeze - inEnd));
      b.pos = m2.pos; b.rotY = m2.moving ? m2.heading : face(STOP, V(-30, 0, ROAD_Z)); b.layers = m2.moving ? [[A.run, m2.dist / STRIDE], [A.hold, 0.3, 0.6]] : [[A.hold, 0.3]];
    }
    b.stack = grabbed(s); b.face = 'neutral';
    if (s > B.freeze) { b.pos = STOP.clone(); b.rotY = s < B.pop ? 0.25 : lerp(0.25, face(STOP, HIDE), seg(s, B.pop, B.pop + 0.3)); b.layers = [[A.hold, 0.3]]; }
    if (s > B.chase + 0.15) { const m3 = path([STOP, V(-12, 0, ROAD_Z), V(-120, 0, ROAD_Z)], B.chase + 0.15, s, FAST * 1.4); b.pos = m3.pos; b.rotY = m3.heading; b.layers = [[A.run, m3.dist / STRIDE], [A.hold, 0.3, 0.6]]; b.visible = !m3.done; }
  } else if (s < B.night3) {                            // night 2: the limbo under the lasers
    const from = V(40, 0, ROAD_Z), mid = V(0, 0, 19), past = V(0, 0, 7), m = path([from, mid], B.night2 + 0.2, s, from.distanceTo(mid) / (B.limbo[0] - B.night2 - 0.2));
    b.visible = true; b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.run, m.dist / STRIDE]];
    if (s > B.limbo[0]) {
      const u = seg(s, B.limbo[0], B.limbo[1]), lean = Math.sin(Math.PI * clamp(u * 1.15)) ;
      b.pos = mid.clone().lerp(past, u); b.rotY = Math.PI; b.layers = [[A.idle, 0.2]]; b.grounded = false;
      const L = clamp(lean * 1.6); b.rotX = -1.38 * L; b.pos.y = -1.55 * L;
    }
    if (s > B.limbo[1] + 0.05) { b.layers = [[A.run, s * 3]]; b.rotX = 0; b.grounded = true; const m4 = path([past, V(0, 0, -6)], B.limbo[1] + 0.05, s, 40); b.pos = m4.pos; b.rotY = Math.PI; b.visible = s < B.empty2 - 0.05; }
  } else if (s < W.stopped - 0.35) {                    // night 3: offers the capybara an apple, then zips in
    const from = V(40, 0, ROAD_Z), at = V(0, 0, 18.4), m = path([from, at], B.night3 + 0.2, s, from.distanceTo(at) / Math.max(0.3, B.apple - B.night3 - 0.6));
    b.visible = true; b.pos = m.pos; b.rotY = m.moving ? m.heading : Math.PI; b.layers = m.moving ? [[A.run, m.dist / STRIDE]] : idle(s);
    if (s > B.apple - 0.2 && s < B.take + 0.2) b.layers = [[A.point_forward, 0.25]];
    b.apple = s > B.apple - 0.2 && s < B.take;
    if (s > B.zip3) { const m5 = path([at, V(0, 0, -2), V(-14, 0, -4)], B.zip3, s, 60); b.pos = m5.pos; b.rotY = m5.heading; b.layers = [[A.run, m5.dist / STRIDE]]; b.visible = !m5.done; }
  } else if (s < B.theft) { /* off screen */ }
  else if (s < B.hatch) {                               // zips in, grabs the Mythic egg, runs off slowly (heavy egg)
    const grabAt = MYTH.clone().add(V(0, 0, 2.6));
    const m = path([V(40, 0, ROAD_Z), V(0, 0, ROAD_Z - 2), grabAt], B.theft, s, 70 / Math.max(0.3, B.grab - B.theft - 0.1));
    b.visible = true; b.pos = m.pos; b.rotY = m.moving ? m.heading : Math.PI; b.layers = m.moving ? [[A.run, m.dist / STRIDE]] : [[A.hold, 0.3]];
    if (s > B.grab) { b.layers = [[A.hold, 0.3]]; b.mythHeld = true; }
    if (s > B.ran) { const m2 = path([grabAt, V(-2, 0, ROAD_Z - 1), HATCH_AT], B.ran, s, (grabAt.distanceTo(V(-2, 0, ROAD_Z - 1)) + V(-2, 0, ROAD_Z - 1).distanceTo(HATCH_AT)) / (B.hatch - B.ran)); b.pos = m2.pos; b.rotY = m2.heading; b.layers = [[A.run, m2.dist / STRIDE], [A.hold, 0.3, 0.6]]; }
    b.face = 'neutral';
  } else if (s < B.lift) {                              // knocked flat by the hatch, staring up at it
    const u = seg(s, B.hatch, B.hatch + 0.45), to = HATCH_AT.clone().add(V(-5, 0, 0));
    b.visible = true; b.grounded = false; b.pos = HATCH_AT.clone().lerp(to, easeOut(u)).add(V(0, 2.5 * Math.sin(Math.PI * u), 0)); b.rotY = Math.PI / 2; b.layers = [[A.knocked_out, 1]]; b.face = 'scared';
    b.rotX = 0;
  } else if (s < B.hoodOff + 0.45) {                    // dangling from the snout by the hood
    b.visible = true; b.grounded = false; b.dangle = 0.12 * Math.sin(s * 6); b.layers = [[A.panic, s]]; b.face = 'scared'; b.hang = true;
  } else if (s < B.tread) {                             // dropped at the door: Max, sheepish
    const u = seg(s, B.hoodOff + 0.45, B.hoodOff + 0.75);
    b.visible = true; b.hood = false; b.pos = DROP.clone(); b.rotY = face(DROP, V(-8.6, 0, 11.4)); b.layers = u < 1 ? [[A.fall, 0.3]] : idle(s); b.face = s < B.max + 0.4 ? 'shocked' : 'nervous';
    if (u < 1) { b.grounded = false; b.pos.y = 8.5 * (1 - easeIn(u)); }
    if (s > B.quote) { b.layers = [[A.shrug, s - B.quote]]; b.face = 'nervous'; }
  } else {                                              // treadmill: runs to pay it back, then launched
    b.visible = true; b.hood = false; b.pos = TREAD.clone().add(V(0, 0.76, 0)); b.floor = 0.76; b.rotY = -Math.PI / 2;
    const rate = s < B.fast ? 1.2 : s < B.broke ? 4.5 : 0;
    b.layers = [[A.run, s < B.fast ? (s - B.tread) * rate : (B.fast - B.tread) * 1.2 + (Math.min(s, B.broke) - B.fast) * rate]]; b.face = s < B.fast ? 'sad' : 'determined';
    b.belt = s < B.broke ? (s < B.fast ? (s - B.tread) * 17 : (B.fast - B.tread) * 17 + (s - B.fast) * 64) : null;
    if (s > B.broke) { const u = seg(s, B.broke, B.broke + 1.3), land = V(15.5, 0, 3.5); b.grounded = u >= 1; b.pos = TREAD.clone().add(V(0, 0.76, 0)).lerp(land, u); b.pos.y = u < 1 ? 0.76 + 26 * u * (1 - u) * 1.0 + (0 - 0.76) * u : 0; b.rotX = u < 1 ? -u * 8 : 0; b.layers = u < 1 ? [[A.fall, 0.4]] : [[A.knocked_out, 1]]; b.face = u < 1 ? 'scared' : 'dizzy'; if (u >= 1) { b.grounded = false; b.pos.y = 0; } b.floor = 0; }
  }
  return b;
}

function place(a, x) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, (x.rotZ || 0) + (x.dangle || 0), 'YXZ');
  if (x.rotX || x.rotZ) { const c = V(0, 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
  robloxPose(a, x.layers);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  a.root.updateMatrixWorld(true);
}

// ---------- the spinosaurus ----------
function spinoAt(s) {
  // hatch: grows out of the egg facing the thief; roars; bends for the hood; walks back to the base; drops him.
  const grow = easeOutBack(seg(s, B.hatch, B.hatch + 0.7), 1.4), rot0 = -Math.PI / 2;
  let pos = HATCH_AT.clone().add(V(10, 0, 0)), rotY = rot0, pose = spinoIdle(s), scale = SPS * lerp(0.06, 1, grow), vis = s > B.hatch && s < B.tread + 0 || s > B.tread;
  if (s < B.roar) pose = mixPose(spinoIdle(s), spinoRoar(s), 0.3);
  else if (s < B.owner) pose = mixPose(spinoIdle(s), spinoRoar(s), Math.min(seg(s, B.roar, B.roar + 0.25), 1 - seg(s, B.owner - 0.3, B.owner)));
  else if (s < B.carry) pose = mixPose(mixPose(spinoIdle(s), { Head: [-0.25, 0.15, 0] }, 0.7), spinoBend(1, s), Math.min(seg(s, B.bend, B.bend + 0.5), 1 - seg(s, B.lift, B.lift + 0.45)));
  else if (s < B.tread) {
    const from = pos.clone(), mid = V(-12, 0, ROAD_Z + 6), m = path([from, mid, SPINO_STOP], B.carry, s, (from.distanceTo(mid) + mid.distanceTo(SPINO_STOP)) / Math.max(0.5, B.arrive - B.carry));
    pos = m.pos; rotY = m.moving ? m.heading : Math.PI; pose = m.moving ? spinoWalk(m.dist / (SPINO_STRIDE * SPS)) : spinoIdle(s);
    if (!m.moving && m.done) { rotY = lerp(m.heading, Math.PI, seg(s, B.arrive, B.arrive + 0.4)); pose = mixPose(spinoIdle(s), spinoBend(0.55 - 0.4 * seg(s, B.hoodOff + 0.45, B.hoodOff + 1.0), s), seg(s, B.arrive, B.arrive + 0.4)); if (s > B.hoodOff - 0.2 && s < B.hoodOff + 0.45) pose = addPose(pose, { Head: [0, 0.35 * Math.sin((s - B.hoodOff) * 30), 0] }); }
    if (m.moving) rotY = lerp(m.heading, m.heading, 1);
  } else { pos = SPINO_TREAD.clone(); rotY = SPINO_TREAD_ROT; pose = addPose(spinoIdle(s), { Head: [-0.15, 0.1, 0], UpperTorso: [-0.1, 0, 0] }); scale = SPS; if (s > B.broke + 1.2) pose = mixPose(pose, spinoBend(0.5, s), seg(s, B.broke + 1.2, B.broke + 1.7)); }
  return { pos, rotY, pose, scale, vis };
}
function placeSpino(c, x) {
  c.root.visible = x.vis; c.root.scale.setScalar(x.scale); c.root.position.copy(x.pos); c.root.rotation.set(0, x.rotY, 0); poseCreature(c, x.pose);
  c.root.position.y -= creatureLowest(c, SP_BODIES); c.root.updateMatrixWorld(true);
}
const snout = () => creaturePoint(spino, 'Head', 0, 8.4, -20.5);
const spinoHead = () => creaturePoint(spino, 'Head', 0, 16, -12);

// ---------- samples (motion blur on the zips and the hatch) ----------
const BLUR = () => [[B.zipIn, B.freeze], [B.chase, B.chase + 0.8], [B.theft, B.grab], [B.hatch - 0.1, B.hatch + 0.5], [B.fast, B.broke + 0.6]];
export function samples(t) { return BLUR().some(([a, b]) => t > a && t < b) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
let NOW = 0;
export function update(t, stage) {
  const s = t; NOW = t; cam = stage.camera;
  const SPN = spinoAt(s); placeSpino(spino, SPN);
  const L = leoState(s), M = maxState(s);
  place(leo, L);
  if (M.hang) {                                         // hangs from the snout by the hood: head just under it
    const sn = snout(); M.pos = sn.clone().add(V(0, -5.6, 0)); M.rotY = SPN.rotY + Math.PI; M.grounded = false;
  }
  place(max, M);
  thiefLight.visible = max.root.visible; thiefLight.position.copy(max.root.position).add(V(2.5, 7.5, 3.5));
  hood.visible = M.hood !== false;
  max.bones.Head.children.forEach((o) => { if (o.name === 'Hair') o.visible = M.hood === false; });

  // Hood flies off when the spinosaurus shakes him loose.
  const hu = seg(s, B.hoodOff, B.hoodOff + 1.0); hoodFly.visible = s > B.hoodOff && hu < 1 && s < B.tread;
  if (hoodFly.visible) { const p0 = snout().add(V(0, -0.8, 0)); hoodFly.position.copy(p0).add(V(-6 * hu, 6 * hu - 9 * hu * hu, 4 * hu)); hoodFly.rotation.set(hu * 7, hu * 5, 0); hoodFly.scale.setScalar(1); }

  // Eggs: pedestals / the thief's stack / dropped out of the hood.
  const n = eggCount(s), hand = (a, f = 1.6, up = 0.9) => a.root.position.clone().add(V(Math.sin(a.root.rotation.y) * f, up, Math.cos(a.root.rotation.y) * f));
  eggs.forEach((e, i) => {
    e.visible = true; e.rotation.set(0, 0.4 * i, 0); e.scale.setScalar(EGG_K[i]);
    const order = i < 5 ? 9 - i : i - 5;                // the order the thief grabs them (front row first)
    const onPed = PEDS[i].clone().add(V(0, PED_H, 0));
    if (s >= B.tread) { e.position.copy(onPed); return; }
    if (s > B.hoodOff && s < B.tread) {                // fell out of the hood round Max
      const u = seg(s, B.hoodOff + 0.05 * i, B.hoodOff + 0.05 * i + 0.55), a = i * 0.63, to = DROP.clone().add(V(Math.cos(a) * (2.4 + (i % 3)), 0, Math.sin(a) * (2.2 + (i % 2))));
      const from = snout().add(V(0, -5, 0)); e.visible = u > 0; e.position.copy(from.clone().lerp(to, u)).add(V(0, 3 * Math.sin(Math.PI * u), 0)); e.position.y = Math.max(0, e.position.y); e.rotation.z = u * 4; return;
    }
    const inStack = (s < B.bush && max.root.visible) || (s >= B.grab0 && s < B.night2 && order < grabbed(s) && max.root.visible);
    if (inStack) {
      const k = order, ry = max.root.rotation.y, base = hand(max, 0.8, 1.7).add(V(-Math.cos(ry) * 1.7, 0, Math.sin(ry) * 1.7)), sway = 0.05 * k * Math.sin(s * 7);
      e.scale.setScalar(EGG_K[i] * 0.42); e.position.copy(base).add(V(Math.cos(ry) * sway, k * 0.95, -Math.sin(ry) * sway)); e.rotation.set(0, max.root.rotation.y, sway * 0.4); return;
    }
    e.visible = (s >= B.bush && s < B.night2 && order >= grabbed(s)) || (s >= B.night2 && s < B.night3 && s < B.empty2) || (s >= B.night3 && s < B.zip3 + 0.5) ;
    if (s >= B.bush && s < B.grab0) e.visible = true;
    e.position.copy(onPed);
  });

  // Mythic egg: pops onto its pedestal, carried off, hatches.
  myth.visible = s > B.egg && s < B.hatch; const mk = myth.userData.k;
  myth.scale.setScalar(mk * (s < B.egg + 0.35 ? easeOutBack(seg(s, B.egg, B.egg + 0.35), 2.5) : 1));
  myth.position.copy(MYTH).add(V(0, 1.8, 0)); myth.rotation.set(0, s * 0.5, 0);
  if (M.mythHeld) { myth.position.copy(hand(max, 1.5, 0.7)); myth.rotation.set(0, max.root.rotation.y, 0); }
  if (s > B.hatch - 0.8 && s < B.hatch) myth.rotation.z = 0.12 * Math.sin(s * 55) * seg(s, B.hatch - 0.8, B.hatch);
  const hatchPos = HATCH_AT.clone().add(V(0, 1.4, 0));
  mythShell.forEach((c, i) => { const u = s - B.hatch; c.visible = u > 0 && u < 1.6 && s < B.tread; if (!c.visible) return; c.position.copy(hatchPos).add(c.userData.v.clone().multiplyScalar(u)).add(V(0, -14 * u * u, 0)); if (c.position.y < 0.2) c.position.y = 0.2; c.rotation.set(c.userData.w.x * u, c.userData.w.y * u, c.userData.w.z * u); });
  mythPed.visible = s > B.buy - 0.1; mythPed.scale.setScalar(s < B.buy + 0.25 ? Math.max(0.01, easeOutBack(seg(s, B.buy - 0.1, B.buy + 0.25), 2)) : 1);
  signBoard.visible = s > B.sign && s < B.hatch; signBoard.scale.setScalar(s < B.sign + 0.3 ? easeOutBack(seg(s, B.sign, B.sign + 0.3), 2) : 1);

  // Bush, lasers (night 2 only), chair, treadmill.
  bush.visible = s < W.stopped; bush.scale.setScalar(1 + (s > B.pop && s < B.pop + 0.3 ? 0.08 * Math.sin((s - B.pop) * 40) : 0));
  laserPosts.visible = s > B.night2 - 0.1 && s < B.night3;
  lasers.forEach((l, i) => { l.material.color.set(Math.floor(s * 6 + i) % 2 ? '#ff2a3a' : '#ff6a76'); });
  chair.visible = s > B.sit - 1 && s < B.tread;
  treadBelt.material.map.offset.y = M.belt != null ? -M.belt / 6.6 : treadBelt.material.map.offset.y;
  treadParts.forEach((q) => { const u = s - B.broke; if (u > 0) { const k = Math.min(u, 1.6); q.p.position.copy(q.home).add(q.v.clone().multiplyScalar(k * 0.5)).add(V(0, -7 * k * k * 0.5, 0)); q.p.position.y = Math.max(q.home.y * 0.3, q.p.position.y); q.p.rotation.set(q.w.x * k * 0.4, q.w.y * k * 0.4, 0); } else { q.p.position.copy(q.home); q.p.rotation.set(0, 0, 0); } });
  if (treadParts[0]) treadParts.forEach((q, i) => { if (i === 6 && s < B.broke) q.p.rotation.y = Math.PI; });

  // Capybara guard (night 3): sits at the door in its hat, takes the apple, waddles off munching.
  capy.visible = capyHat.visible = s > B.night3 - 0.1 && s < W.stopped - 0.35;
  const capyFrom = CAPY_AT.clone(), capyTo = V(5.5, 0, 16.5);
  let cp = capyFrom.clone(), cr = 0;
  if (s > B.take) { const u = seg(s, B.take + 0.1, B.take + 1.0); cp = capyFrom.clone().lerp(capyTo, easeInOut(u)); cr = lerp(0, -1.3, seg(s, B.take + 0.05, B.take + 0.35)); cp.y = 0.25 * Math.abs(Math.sin(u * 14)); }
  capy.position.copy(cp); capy.rotation.set(0, cr + CAPY_FACE, 0);
  capyHat.position.copy(cp).add(V(Math.sin(cr) * 0.9, 2.45, Math.cos(cr) * 0.9)); capyHat.rotation.set(-0.15, cr, 0);
  apple.visible = (!!M.apple) || (s > B.take && s < B.take + 1.8 && capy.visible);
  if (M.apple) { const h = new THREE.Vector3(-0.5, -2.0, 0).applyMatrix4(max.bones['Arm.R'].matrixWorld); apple.position.copy(h); }
  else if (apple.visible) { apple.position.copy(cp).add(V(Math.sin(cr) * 1.35, 0.95, Math.cos(cr) * 1.35)); apple.scale.setScalar(1 - 0.5 * seg(s, B.take + 0.4, B.take + 1.8)); }

  // Puffs: dust trail of the zips, the hatch, the egg drop, the treadmill blowing up.
  const events = [[B.chase + 0.15, STOP.clone().add(V(-3, 0.8, 1)), 2.6, 0.9, '#c9c2b0'], [B.hatch, hatchPos, 4.5, 0.9, '#fff4d8'], [B.hatch + 0.05, hatchPos.clone().add(V(3, 1, 2)), 3.5, 0.8, '#ffffff'],
    [B.broke, TREAD.clone().add(V(0, 1.5, 0)), 3, 1.2, '#8a8f99'], [B.broke + 0.1, TREAD.clone().add(V(0, 2.5, 0)), 3.5, 1.2, '#5d626b'], [B.egg, MYTH.clone().add(V(0, 3.5, 0)), 1.6, 0.6, '#ffd6ff'], [B.zip3 + 0.15, V(0, 0.5, 18.5), 1.1, 0.5, '#c9c2b0'], [B.empty2 - 0.2, V(0, 1.6, -7), 4, 0.6, '#c9c2b0'],
    [B.hoodOff + 0.75, DROP.clone().add(V(0, 0.6, 0)), 2, 0.6, '#c9c2b0']];
  if (s < B.bush) for (let k = 0; k < 7; k++) events.push([k * 0.4, V(6 - k * 4.4, 0.6, ROAD_Z - 1), 1.4, 0.8, '#c9c2b0']);
  if (s > B.zipIn && s < B.freeze) for (let k = 0; k < 6; k++) events.push([B.zipIn + k * 0.25, maxState(B.zipIn + k * 0.25).pos.clone().add(V(0, 0.6, 0)), 1.4, 0.7, '#c9c2b0']);
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur, col] = ev, u = (s - at) / dur, a = i * 0.7;
    p.material.color.set(col); p.material.emissive.set(col);
    p.position.set(c.x + Math.cos(a) * size * 1.3 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.3 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.8 * (1 - u) ** 2;
  });
  sparks.forEach((k, i) => { const u = s - (B.broke - 0.35 + (i % 4) * 0.06); k.visible = u > 0 && u < 0.9 && s < B.cta; if (!k.visible) return; const a = i * 1.7; k.position.copy(TREAD).add(V(Math.cos(a) * u * 9, 1 + u * 7 - 9 * u * u, Math.sin(a) * u * 9)); k.lookAt(TREAD.clone().add(V(0, 1, 0))); });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const look = (p, tg, fov = 42, ext = 40) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const mp = max.root.position, lp = leo.root.position, sp = spino.root.position;
  stage.bloom.strength = 0.45;
  switch (shot.id) {
    case 'hook': look(V(lerp(3, 2.2, u), 5.4, -14.5), V(-0.8, 3.6, 12), 50, 50); break;                                   // over the empty pedestals: Leo, the thief vanishing down the road
    case 'bush': look(V(-6, 3.2, 31), V(-8.6, 2.6, 19.4), 40); break;                                               // from the road: Leo's head in the bush by his door
    case 'midnight': look(V(lerp(6, 4, u), 1.2, 30), V(-5, 1.6, 20), 40); break;                                      // low on the road, waiting
    case 'zip': look(V(16, 13, 30), V(0, 1.5, 4), 52, 50); break;                                                    // high over the base: the thief whips round the pedestals
    case 'freeze': look(STOP.clone().add(V(-3.2, 4.4, 14)), STOP.clone().add(V(-0.6, 5.0, 0)), 50); break;            // the thief with the tower of eggs
    case 'pop': look(STOP.clone().lerp(HIDE, 0.5).add(V(2, 4.4, 19)), STOP.clone().lerp(HIDE, 0.5).add(V(0, 3.8, 0)), 50); break;
    case 'chase': look(V(lp.x + 7, 4.2, lp.z + 15), V(lp.x - 1.5, 2.8, lp.z - 1), 50, 50); break;           // follows Leo: one second of running, then panting
    case 'laser': look(V(10, 5, 30), V(0, 3.2, 14), 46); break;
    case 'limbo': look(V(12, 1.3, 19.5), V(0, 2.0, 13.5), 48); break;                                               // side-on at the door: under the beams
    case 'capy': look(V(-5.5, 3.2, 8.5), V(0.4, 2.0, 16.6), 46); break;
    case 'think': { const f = V(Math.sin(leo.root.rotation.y), 0, Math.cos(leo.root.rotation.y)); look(lp.clone().add(f.multiplyScalar(10)).add(V(0, 4.4, 0)), lp.clone().add(V(0, 4.0, 0)), 44); break; }
    case 'buy': look(V(8, 7, 17), V(-1, 3, 4), 50); break;
    case 'sign': look(V(-2, 5, 17), V(2.4, 3.8, 4.6), 48); break;
    case 'theft': look(V(-17, 7, 15), V(-1, 2, 4), 52, 50); break;                                               // from behind Leo's chair
    case 'chair': look(CHAIR.clone().add(V(6.4, 4, 6.4)), CHAIR.clone().add(V(0, 2.8, 0)), 44); break;
    case 'count': { const fm = mp.clone(); look(fm.clone().add(V(-9, 3.4, 3)), fm.clone().add(V(0, 2.6, 0)), 46, 40); break; }   // running at us with the egg, timer overhead
    case 'hatch': look(HATCH_AT.clone().add(V(-30, 6 + 6 * u, 18)).add(jolt(B.hatch, 0.8, 0.5)), HATCH_AT.clone().add(V(4, 4 + 8 * easeOut(seg(s, B.hatch, B.hatch + 0.7)), 0)), 54, 70); break;
    case 'owner': look(HATCH_AT.clone().add(V(-28, 4, 14)), HATCH_AT.clone().add(V(2, 10, 0)), 56, 70); break;
    case 'pick': look(HATCH_AT.clone().add(V(-22, 3, 18)), HATCH_AT.clone().add(V(-1, 5, 0)), 56, 70); break;
    case 'carry': { const sn = snout(); look(sn.clone().add(V(-7, 0, 30)), sn.clone().add(V(0, -2.5, 0)), 50, 60); break; }
    case 'hoodOff': look(V(-8.2, 4.2, 6.2), V(-3.5, 7 - 2.6 * seg(s, B.hoodOff + 0.3, B.max), 14.4), 54, 60); break;     // from inside the base, looking out at the spinosaurus
    case 'quote': look(V(-8.2, 3.8, 6.6), V(-3.5, 4.2, 14.4), 48); break;
    case 'tread': case 'fast': look(TREAD.clone().add(V(-4, 5, 16)), TREAD.clone().add(V(5, 6, -2)), 56, 50); break;
    case 'broke': look(TREAD.clone().add(V(-6, 7, 22)).add(jolt(B.broke, 0.6, 0.5)), TREAD.clone().add(V(7, 5, -2)), 58, 50); break;
    case 'cta': look(TREAD.clone().add(V(-6, 7, 22)), TREAD.clone().add(V(7, 5, -2)), 58, 50); break;
    default: look(V(20, 12, 30), V(0, 2, 2), 46);
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
function tagOver(g, s, p3, text, bg, alpha = 1, k = 1, size = 36, fg = '#ffffff') {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.globalAlpha = alpha; g.translate(p.x, p.y); g.scale(k, k); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 32 * s, h = size * 1.55;
  roundRect(g, -w / 2, -h / 2 * s, w, h * s, 16 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
const PRICE = 1250000;
function cash(t) { if (t < B.buy) return PRICE; if (t < B.egg) return lerp(PRICE, 0, easeIn(seg(t, B.buy, B.egg))); return 0; }
function hud(g, s, t) {
  pill(g, s, 60, 250, "LEO'S BASE", 'rgba(21,36,53,.88)');
  if (t < B.tread + 0.2 && t < B.hoodOff) {
    const n = eggCount(t), col = n ? '#FFE9A8' : '#ff6b78';
    pill(g, s, 60, 350, `EGGS: ${n}/10`, n ? 'rgba(21,36,53,.8)' : 'rgba(200,30,50,.9)', n ? col : '#ffffff', 36);
  }
  const night = t < B.bush ? 'LAST NIGHT' : t < B.night2 ? 'NIGHT 1' : t < B.night3 ? 'NIGHT 2' : t < W.stopped - 0.35 ? 'NIGHT 3' : t < B.hoodOff ? 'NIGHT 4' : null;
  if (night) pill(g, s, 640, 250, night, 'rgba(70,60,160,.9)', '#ffffff', 34);
  if (t > W.stopped - 0.35 && t < B.theft) pill(g, s, 60, 432, `CASH: ${money(cash(t))}`, cash(t) ? 'rgba(40,150,80,.9)' : 'rgba(200,30,50,.9)', '#ffffff', 34);
}
export function overlay(g, s, t) {
  hud(g, s, t);
  // Hook: "AGAIN?!" and the thief's tag in the distance.
  if (t < B.bush) { if (max.root.visible) tagOver(g, s, max.root.position.clone().add(V(0, 7.6, 0)), '???', 'rgba(10,10,14,.9)', 1, 1, 34); word(g, s, t, W.again - 0.1, 1.2, 'AGAIN?!', '#ff4d5e', 170, 1240); }
  if (t > W.midnight - 0.15 && t < B.zipIn) { bigText(g, s, '12:00 AM', 540, 760, 130, '#bfe0ff', { k: pop(t, W.midnight - 0.15, 0.2, 2) }); }
  if (t > W.footsteps - 0.1 && t < B.zipIn) for (let i = 0; i < 3; i++) word(g, s, t, W.footsteps + i * 0.22, 0.5, 'TAP', '#ffffff', 70, 980 - i * 30, (i % 2 ? 0.1 : -0.1));
  // The thief's nametag, speed pills.
  if (max.root.visible && t >= B.bush && t < B.hoodOff && !['hatch', 'owner', 'pick', 'carry'].includes(SHOT)) tagOver(g, s, max.root.position.clone().add(V(0, max.root.rotation.x ? 3 : 6.2, 0)), '???', 'rgba(10,10,14,.9)', 1, 1, 34);
  if (t > W.fifty - 0.15 && t < B.chase + 0.3) tagOver(g, s, max.root.position.clone().add(V(0, 7.4, 0)), 'SPEED: 50,000', 'rgba(220,40,60,.95)', 1, pop(t, W.fifty - 0.15, 0.2, 2.5), 46);
  if (t > W.nine - 0.15 && t < B.night2) tagOver(g, s, leo.root.position.clone().add(V(0, 6.6, 0)), 'SPEED: 900', 'rgba(60,110,200,.95)', 1, pop(t, W.nine - 0.15, 0.2, 2.5), 40);
  if (t > B.chase && t < B.gone - 0.05) bigText(g, s, `${(t - B.chase).toFixed(1)}s`, 540, 1080, 90, '#ffffff');
  word(g, s, t, B.gone, 1.0, 'GONE', '#ff4d5e', 190, 1120);
  word(g, s, t, B.night2, 0.9, 'NIGHT 2', '#C9A6FF', 150, 760);
  word(g, s, t, W.laser - 0.1, 1.2, 'LASER DOOR', '#ff4d5e', 120, 1000);
  word(g, s, t, W.limboed - 0.1, 1.2, 'LIMBO!', '#FFD23F', 160, 760, 0.05);
  word(g, s, t, B.night3, 0.9, 'NIGHT 3', '#C9A6FF', 150, 760);
  if (capy.visible && t < B.take) tagOver(g, s, capy.position.clone().add(V(0, 4.4, 0)), 'GUARD', 'rgba(30,60,140,.95)', 1, pop(t, W.capybara - 0.2, 0.2, 2.5));
  word(g, s, t, W.bribed - 0.05, 1.3, 'BRIBED', '#ff4d5e', 150, 1000, 0.06);
  // The idea.
  if (t > W.stopped - 0.3 && t < B.buy) { const p = project(leo.root.position.clone().add(V(0, 7, 0)), s), k = pop(t, W.stopped - 0.2, 0.25, 2.5); if (p.on) { g.save(); g.translate(p.x, p.y); g.scale(k, k); g.fillStyle = '#ffe066'; g.strokeStyle = '#152435'; g.lineWidth = 8 * s; g.beginPath(); g.arc(0, 0, 50 * s, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#c9cfdb'; g.fillRect(-22 * s, 42 * s, 44 * s, 30 * s); g.strokeRect(-22 * s, 42 * s, 44 * s, 30 * s); g.restore(); } }
  word(g, s, t, W.faster - 0.1, 1.0, 'SMARTER', '#7FE3DD', 150, 1000);
  // The shop card.
  if (t > B.buy - 0.1 && t < B.egg + 0.4) {
    const k = pop(t, B.buy - 0.1, 0.25, 2);
    g.save(); g.translate(540 * s, 980 * s); g.scale(k, k); g.rotate(-0.02);
    roundRect(g, -380 * s, -170 * s, 760 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(21,36,53,.95)'; g.fill(); g.lineWidth = 8 * s; g.strokeStyle = '#ff5ad8'; g.stroke();
    g.font = `${60 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff9be8'; g.fillText('MYTHIC EGG', 0, -95 * s);
    g.fillStyle = '#ffffff'; g.font = `${76 * s}px "Luckiest Guy"`; g.fillText(money(PRICE), 0, -5 * s);
    roundRect(g, -130 * s, 60 * s, 260 * s, 84 * s, 22 * s); g.fillStyle = t > B.egg - 0.3 ? '#2fbf62' : '#3cff8a'; g.fill(); g.fillStyle = '#0d2a18'; g.font = `${54 * s}px "Luckiest Guy"`; g.fillText(t > B.egg - 0.3 ? 'BOUGHT!' : 'BUY', 0, 106 * s); g.restore();
  }
  if (myth.visible && t > B.egg + 0.2 && t < B.theft) tagOver(g, s, myth.position.clone().add(V(0, 4.2, 0)), 'MYTHIC', 'rgba(200,60,190,.95)', 1, pop(t, B.egg + 0.2, 0.2, 2.5), 40);
  // Hatch timer: over the egg, then over the thief.
  if (myth.visible && t > B.timer) { const left = Math.ceil(hatchLeft(t) - 1e-6), txt = `HATCH: 0:${String(left).padStart(2, '0')}`; tagOver(g, s, myth.position.clone().add(V(0, M_TAG(t), 0)), txt, left <= 3 ? 'rgba(220,40,60,.95)' : 'rgba(21,36,53,.92)', 1, pop(t, B.timer, 0.2, 2.5) * (left <= 3 ? 1 + 0.12 * Math.abs(Math.sin(t * 9)) : 1), 44, left <= 3 ? '#ffffff' : '#FFD23F'); }
  if (t > B.ran && t < B.hatch && SHOT === 'count') tagOver(g, s, max.root.position.clone().add(V(0, 9.6, 0)), 'HEAVY EGG: SPEED -90%', 'rgba(220,40,60,.9)', 1, 1, 30);
  word(g, s, t, W.three - 0.05, 0.6, '3', '#FFD23F', 260, 900); word(g, s, t, W.two - 0.05, 0.6, '2', '#FFD23F', 260, 900); word(g, s, t, W.one - 0.05, 0.6, '1', '#ff4d5e', 260, 900);
  word(g, s, t, B.hatch, 1.0, 'HATCHED!', '#ff9be8', 150, 700);
  if (t > B.owner && t < B.tread) tagOver(g, s, spinoHead().add(V(0, 5, 0)), 'OWNER: LEO', 'rgba(40,150,80,.95)', 1, pop(t, B.owner, 0.2, 2.5), 46);
  word(g, s, t, W.max - 0.05, 1.3, 'MAX?!', '#ff9e80', 190, 760, -0.08);
  if (t > B.quote + 0.25 && t < B.tread) {
    const k = pop(t, B.quote + 0.25, 0.25, 2);
    g.save(); g.translate(540 * s, 1010 * s); g.scale(k, k); g.rotate(0.02);
    roundRect(g, -400 * s, -110 * s, 800 * s, 220 * s, 40 * s); g.fillStyle = 'rgba(255,255,255,.96)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#152435'; g.stroke();
    g.font = `${56 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#152435'; g.fillText('"I WAS KEEPING', 0, -34 * s); g.fillText('THEM SAFE"', 0, 40 * s); g.restore();
  }
  // The treadmill debt.
  if (t > B.tread + 0.2 && t < B.cta) {
    const v = t < B.fast ? PRICE : lerp(PRICE, 0, clamp((t - B.fast) / Math.max(0.3, B.paid - B.fast))), done = v <= 0;
    if (t < B.broke) bigText(g, s, done ? 'PAID!' : `DEBT: ${money(v)}`, 540, 760, done ? 150 : 96, done ? '#3cff8a' : '#ff6b78', { k: done ? pop(t, B.paid, 0.2, 3) : pop(t, B.tread + 0.2, 0.2, 2) });
    if (t > B.fast && t < B.broke) bigText(g, s, `${Math.min(4, (t - B.fast) * 4 / Math.max(0.3, B.paid - B.fast)).toFixed(1)}s`, 540, 880, 80, '#ffffff');
    if (t < B.fast + 0.1 && t > B.tread + 0.4) tagOver(g, s, max.root.position.clone().add(V(0, 6.6, 0)), 'SPEED: 50,000', 'rgba(220,40,60,.95)', 1, pop(t, W.fifty2 - 0.2, 0.2, 2.5), 40);
  }
  word(g, s, t, B.broke + 0.1, 1.1, 'KABOOM', '#ff9e3d', 170, 1080, 0.06);
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
  flash(g, s, (t >= B.hatch && t < B.hatch + 0.12) || (t >= B.broke && t < B.broke + 0.1) ? 0.45 : 0, '#ffffff');
  if (['zip', 'chase'].includes(SHOT) || (SHOT === 'fast')) speedLines(g, s, t, 0.3, { cx: 540, cy: 900 });
}
const M_TAG = (t) => (t > B.grab ? 3.2 : 4.6);

export const cast = () => ({ leo, max, spino });
