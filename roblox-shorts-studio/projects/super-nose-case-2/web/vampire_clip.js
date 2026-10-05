// Detective Max Sniffwell: The Vampire Case. Beat times come from web/beats.js (source/beats.py: narration word timings
// via script alignment, or an estimate until the narration exists), so the clip retimes itself.
// The vampire's sister flirts at the door (Tempting. But I'm on a case.). Count Vlad is knocked out in his coffin next to
// a slice of garlic bread. The Chief offers a burger to drop it (Tempting...). One long sniff: butter, fresh garlic,
// compost: homegrown. Only the gardener grows anything; a garlic patch behind the roses; the mansion keeps his whole garden
// in the shade (sad tomatoes). Cuffs on. With the garlic bagged, Vlad wakes; his sister asks Max to stay for dinner; fangs.
// Tempting. But I'm on a case. He runs.
// Layout: the mansion at the origin (front +Z, door at x 0); its shaded garden on the -X side (the sun is behind the
// house, from +X/-Z, so the house's shadow falls across the garden); the hall interior is a set at OFF; the flashback
// beach at FB.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, puff, canvasTexture } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { travel, travelTo, STRIDE } from '../../../web/lib/locomotion.js';
import { makeTalkingFace, wearOutfit, makeNose, setNose, makeSunglasses, handcuffs, setCuffs } from '../../the-super-nose-detective/web/kit.js';
import { wearOutfitHere, tintHair, headMat, makeFangs, makeCape, koStars, spinStars, strawHat, clippers, tomato, tomatoPlant, roseBush, garlicPatch, hedge, garlicBread, garlicBulb, burger, poolRing, umbrella, evidenceBag, mansion, bat, candle, candelabra, coffin, palm, std, mesh, box } from './kit.js';
import { W } from './beats.js';
import { LIPS } from './lipsync.js';
const lipAt = (t) => LIPS[Math.floor(t * 30 + 1e-6)] || '-';
const FLAP = 'swnoesnwcsoe';
let talkMax, talkSis, talkLeo, talkGar;

export const meta = { seconds: Math.ceil((W.end + 0.75) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Vampire Case' };
export const sky = { zenith: '#3f7fd8', horizon: '#ffd7a6', below: '#f2dcc0', fog: '#f3d2b0', sunDir: new THREE.Vector3(0.85, 0.36, -0.38).normalize(), sunColor: '#ffd9a8' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));
const win = (s, a, b) => s >= a && s < b;

// ---------- layout ----------
const MAXD = V(0.6, 0, 3.6), SIS_D = V(0.3, 1.2, 0.95);                              // the front door (the top step is 1.2 up)
const GAR = V(-23, 0, 1.2), BUSH_AT = V(-21.4, 0, 1.0), ROSES_X = -28.5, PATCH = V(-32.5, 0, -1.5), TOMS_Z = 3.4;
const MAX_G = GAR.clone().add(V(2.5, 0, 1.0));
const OFF = V(-300, 0, 0), COF = OFF.clone().add(V(0, 0, -3)), HIP = COF.clone().add(V(0, 2.45, 0));
const MAXH = OFF.clone().add(V(-0.2, 0, 0.8)), SIS_H = OFF.clone().add(V(-6.2, 0, -0.6)), SIS_ASK = OFF.clone().add(V(-2.5, 0, -0.5));
const LEO0 = OFF.clone().add(V(16, 0, 8)), LEO_H = OFF.clone().add(V(4.4, 0, 1.8)), ENTER0 = OFF.clone().add(V(15, 0, 9)), EXIT = OFF.clone().add(V(19, 0, 7));
const WIN = OFF.clone().add(V(-9, 7.5, -12.55)), BREAD0 = OFF.clone().add(V(-1.3, 3.78, -1.62)), TABLE = OFF.clone().add(V(10, 0, -7));
const FB = V(140, 0, 40), KID = FB.clone().add(V(0, 0, 0)), VLAD_FB = FB.clone().add(V(-2.6, 0, 0));
const RUN0 = V(0.6, 0, 3.6), RUN1 = V(9, 0, 70);

// ---------- beats (all from narration words) ----------
const B = {
  ask: W.sister1, think1: W.tempting1 - 0.1, stop1: W.case1 - 0.55, r1: W.case1,
  enter: W.case1 + 0.45, coffinShot: W.count - 0.2, fb1: W.nicest - 0.1, fb2: W.town - 0.2, ko: W.knocked - 0.1,
  bread: W.next - 0.15, stopV: W.somebody - 0.15, chief: W.chief - 0.25, think2: W.tempting2 - 0.1, stop2: W.case2 - 0.55, r2: W.case2,
  sniff: W.sniffed - 0.25, pick: W.sniffed - 0.25, i1: W.extra - 0.1, i2: W.fresh - 0.1, i3: W.hint - 0.1, home: W.garlic3 - 0.2,
  turn: W.only - 0.2, reveal: W.gardener - 0.25, patch: W.patch - 0.2, motive: W.vlad2 - 0.2, tomato: W.twenty - 0.2, go: W.vlad3 - 0.2,
  cuffs: W.cuffs - 0.25, click: W.cuffs - 0.05, wake: W.gone - 0.2, sitUp: W.woke - 0.1, dinner: W.sister2 - 0.2, fangs: W.fangs - 0.25,
  tempt3: W.tempting3 - 0.1, flee: W.case3 - 0.3, r3: W.case3, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [W.tempting1 - 0.15, 'tempt1'], [B.enter, 'enter'], [B.coffinShot, 'coffin'], [B.fb1, 'fb1'], [B.fb2, 'fb2'], [B.ko, 'ko'],
  [B.bread, 'bread'], [B.stopV, 'stopV'], [B.chief, 'chief'], [W.tempting2 - 0.15, 'tempt2'], [B.sniff, 'sniff'], [B.i1, 'i1'], [B.i2, 'i2'],
  [B.i3, 'i3'], [B.home, 'home'], [B.turn, 'turn'], [B.reveal, 'reveal'], [B.patch, 'patch'], [B.motive, 'motive'], [B.tomato, 'tomato'],
  [B.go, 'go'], [B.cuffs, 'cuffs'], [B.wake, 'wake'], [B.dinner, 'dinner'], [B.fangs, 'fangs'], [B.tempt3, 'tempt3'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const INDOOR = new Set(['enter', 'coffin', 'ko', 'bread', 'stopV', 'chief', 'tempt2', 'sniff', 'i1', 'i2', 'i3', 'home', 'turn', 'wake', 'dinner', 'fangs', 'tempt3']);

// ---------- scene ----------
let A = {}, max, sis, vlad, leo, gar, kid, nose, cam, cuffs, bread, bag, burg, ring, clip, sadTom, umb, pup, stars, fangsS, fangsV, door;
let bats = [], wisps = [], dust = [], flames = [], hallLights = [], frontWall, SHOT = 'hook';

function puppy() {
  const g = new THREE.Group(), fur = std('#d9a352', { roughness: 0.8 }), dark = std('#8a5a2a');
  g.add(box(1.1, 0.6, 0.6, '#d9a352', 0, 0, 0));
  const hd = box(0.6, 0.55, 0.55, '#d9a352', 0.7, 0.25, 0); g.add(hd);
  for (const sz of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.15, 0.35, 0.2), dark, 0.62, 0.4, sz * 0.3); e.rotation.x = sz * 0.3; g.add(e); }
  g.add(mesh(new THREE.BoxGeometry(0.15, 0.12, 0.12), std('#1a1a1a'), 1.03, 0.25, 0));
  for (const sz of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), std('#111'), 1.0, 0.38, sz * 0.15));
  const tail = mesh(new THREE.BoxGeometry(0.4, 0.12, 0.12), fur, -0.7, 0.2, 0); tail.rotation.z = 0.7; g.add(tail);
  for (const x of [-0.4, 0.4]) for (const z of [-0.2, 0.2]) g.add(box(0.18, 0.4, 0.18, '#c89040', x, -0.4, z));
  g.userData.tail = tail; return g;
}

export async function setup(stage) {
  const { scene } = stage; const r = rng(23);
  scene.fog.near = 180; scene.fog.far = 750;
  // Beach: sand, wet sand and the sea toward +Z; a path to the door; the garden's dark earth on the -X side.
  const flat = (w, d, x, z, col, y = 0.03, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), o.material || new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, ...o })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  const sand = part(1400, 2, 1400, '#ecd3a4', { rough: 0.98, clearcoat: 0, radius: 0.01 }); sand.position.set(0, 0, 0); scene.add(sand);
  flat(1400, 40, 0, 75, '#d8bd8c', 0.02);
  const seaTex = canvasTexture(256, 256, (c) => { c.fillStyle = '#2fa6d6'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.beginPath(); const y = (i * 41) % 256; for (let x = 0; x <= 256; x += 16) c.lineTo(x, y + 5 * Math.sin(x * 0.06 + i)); c.stroke(); } });
  seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(40, 20);
  const sea = flat(1400, 700, 0, 445, null, 0.06, { material: new THREE.MeshPhysicalMaterial({ map: seaTex, color: '#bfefff', roughness: 0.08, clearcoat: 1, emissive: '#1a7fb0', emissiveIntensity: 0.2 }) });
  sea.name = 'sea'; stage.seaTex = seaTex;
  for (let i = 0; i < 9; i++) { const st = part(3, 0.2, 2.2, '#cbbfa8', { rough: 0.9, clearcoat: 0 }); st.position.set(0.6 + Math.sin(i) * 0.6, 0.1, 6 + i * 3.4); scene.add(st); }
  flat(24, 18, -30, -3.5, '#6a5640', 0.04);                                                                          // garden earth
  flat(24, 3, -30, 7.0, '#6f8a4a', 0.045);                                                                         // grass edge
  // The mansion and its garden.
  const house = mansion(); scene.add(house); door = house.userData.door;
  for (const [x, z, w] of [[-30, -8, 10], [-21, -8, 4]]) { const h = hedge(w, 3, 1.4); h.position.set(x, 0, z); scene.add(h); }
  const bush = hedge(2.2, 2.0, 1.6, '#2f4f2c'); bush.position.copy(BUSH_AT); scene.add(bush);
  for (let i = 0; i < 5; i++) { const b = roseBush(i + 1); b.position.set(ROSES_X + (i % 2) * 0.6, 0, -6.5 + i * 2.3); scene.add(b); }
  const gp = garlicPatch(); gp.position.copy(PATCH); scene.add(gp);
  for (let i = 0; i < 5; i++) { const tp = tomatoPlant(i + 3); tp.position.set(-24.5 - i * 1.9, 0, TOMS_Z); scene.add(tp); }
  const shed = part(5, 5, 4, '#6b5a44', { center: true, rough: 0.9, clearcoat: 0 }); shed.position.set(-44, 2.5, -14); scene.add(shed);
  const wb = new THREE.Group(); wb.add(box(1.6, 0.8, 2.6, '#7a7f88', 0, 1.0, 0, { metalness: 0.4 })); wb.add(mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 16), std('#1b1b1f'), 0, 0.45, 1.4)); wb.position.set(-34, 0, 4); wb.rotation.y = 0.5; scene.add(wb);
  // Sunny beach round it: palms, umbrellas, loungers, a beach ball.
  for (const [x, z, h] of [[24, 8, 17], [32, 22, 15], [18, 30, 16], [-8, 34, 15], [40, 4, 18], [-48, 22, 16], [60, 30, 17], [130, 22, 17], [150, 30, 16]]) { const p = palm(h, x); p.position.set(x, 0, z); scene.add(p); }
  for (const [x, z, col] of [[28, 40, '#ff7bc5'], [44, 44, '#ffd23f'], [-20, 46, '#5ab0ff'], [146, 46, '#ff7bc5']]) { const u = umbrella(col); u.scale.setScalar(1.8); u.position.set(x, 0, z); scene.add(u); }
  for (let i = 0; i < 6; i++) { const b = bat(); scene.add(b); bats.push(b); }
  const porch = new THREE.SpotLight('#ffd6a0', 260, 40, 0.6, 0.6, 1.4); porch.position.set(5, 11, 12); porch.target.position.set(0, 3, 1.5); scene.add(porch, porch.target);
  // Hall interior set at OFF: purple walls, a red rug, the coffin, candelabras, an arched window, the dinner table.
  const room = (w, h, d, x, y, z, col, o = {}) => { const p = part(w, h, d, col, { center: true, rough: 0.85, clearcoat: 0, ...o }); p.position.copy(OFF).add(V(x, y, z)); scene.add(p); return p; };
  room(46, 0.4, 32, 0, 0.05, 0, '#3a2a2e');
  room(20, 0.1, 9, 0, 0.27, -2, '#7a1626');
  frontWall = room(46, 18, 0.6, 0, 9, 14, '#3d3150'); frontWall.visible = false;
  room(46, 18, 0.6, 0, 9, -13, '#3d3150'); room(46, 4, 0.7, 0, 2, -12.9, '#2a1f2c');
  room(0.6, 18, 32, -23, 9, 0, '#3d3150'); room(0.6, 18, 32, 23, 9, 0, '#3d3150'); room(46, 0.6, 32, 0, 18, 0, '#2c2436');
  for (const x of [-16, 16]) for (const z of [-11]) room(1.4, 18, 1.4, x, 9, z, '#2a2236');
  const winTex = canvasTexture(256, 384, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#9fd2ff'); g.addColorStop(0.6, '#ffe6b8'); g.addColorStop(1, '#ffe6b8'); c.fillStyle = g; c.fillRect(0, 0, 256, 384);
    c.fillStyle = '#3b3326'; c.fillRect(0, 300, 256, 84); c.fillStyle = '#2d4a2c'; for (let x = 0; x < 256; x += 40) c.fillRect(x, 270, 34, 40);
    c.fillStyle = '#e7c66f'; c.fillRect(150, 228, 40, 10); c.fillStyle = '#f5cd30'; c.fillRect(158, 238, 24, 24); c.fillStyle = '#3e7b3a'; c.fillRect(156, 262, 28, 34);
  });
  const winM = new THREE.MeshStandardMaterial({ map: winTex, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.9 });
  const wpane = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), winM); wpane.position.copy(WIN); scene.add(wpane);
  const wtop = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24, 0, Math.PI), winM); wtop.position.copy(WIN).add(V(0, 3.5, 0)); scene.add(wtop);
  for (const x of [-2.6, 0, 2.6]) room(0.25, 7.2, 0.3, WIN.x - OFF.x + x, WIN.y, -12.4, '#1c1622');
  room(5.4, 0.3, 0.3, WIN.x - OFF.x, WIN.y, -12.4, '#1c1622'); room(5.6, 0.4, 0.9, WIN.x - OFF.x, WIN.y - 3.7, -12.2, '#1c1622');
  const wl = new THREE.SpotLight('#ffe8c0', 120, 40, 0.5, 0.7, 1.2); wl.position.copy(WIN).add(V(0, 0, 0.5)); wl.target.position.copy(OFF).add(V(-4, 0, 2)); scene.add(wl, wl.target);
  for (let i = 0; i < 2; i++) { const cur = room(2.2, 11, 0.4, WIN.x - OFF.x + (i ? 3.6 : -3.6), 8, -12.3, '#6a1222'); }
  const cf = coffin(); cf.position.x = COF.x; cf.position.z = COF.z; scene.add(cf);
  for (const [x, z] of [[-11, -8], [11, -9], [-5, -10], [5.5, -10]]) { const c = candelabra(true); c.position.copy(OFF).add(V(x, 0, z)); scene.add(c); flames.push(...c.userData.flames); hallLights.push(c.userData.light); }
  room(10, 0.4, 3.4, TABLE.x - OFF.x, 3.2, TABLE.z - OFF.z, '#2a1612', { clearcoat: 0.4, rough: 0.4 });
  for (const sx of [-4.5, 4.5]) for (const sz of [-1.4, 1.4]) room(0.35, 3, 0.35, TABLE.x - OFF.x + sx, 1.5, TABLE.z - OFF.z + sz, '#1c0f0c');
  room(10.2, 0.05, 1.6, TABLE.x - OFF.x, 3.43, TABLE.z - OFF.z, '#8e1424');
  for (const x of [-3, 0, 3]) { const plate = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 20), std('#f1efe9', { roughness: 0.3 })); plate.position.copy(TABLE).add(V(x, 3.47, 0.6)); scene.add(plate); }
  for (const x of [-4, 4]) { const c = candle(1.2); c.position.copy(TABLE).add(V(x, 3.4, -0.6)); scene.add(c); flames.push(c.userData.flame); }
  const dome = mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std('#cfd6de', { metalness: 0.9, roughness: 0.2 })); dome.position.copy(TABLE).add(V(0, 3.45, -0.3)); scene.add(dome);
  for (const [x, y, z, c, i] of [[0, 14, 4, '#c9a0ff', 18], [-8, 9, 6, '#ffb35a', 20]]) { const l = new THREE.PointLight(c, i, 34, 2); l.position.copy(OFF).add(V(x, y, z)); scene.add(l); }
  // Cast.
  const ex = ['neutral', 'happy', 'smug', 'love', 'cool', 'determined', 'suspicious', 'sleeping', 'shocked', 'scared', 'surprised', 'sad', 'annoyed', 'angry', 'talking', 'laugh', 'dizzy', 'scheming', 'evil_grin', 'nervous', 'wink', 'blink', 'knocked_out', 'disgusted', 'crying'];
  [max, sis, vlad, leo, gar, kid] = await Promise.all([['Max'], ['Mia'], ['Leo'], ['Leo', 0.16], ['Noob'], ['Skye', 0, 0.7]].map(([n, lift = 0, sc = 1]) => loadRobloxCharacter(n, { expressions: ex, hairLift: lift, scale: sc })));
  scene.add(max.root, sis.root, vlad.root, leo.root, gar.root, kid.root);
  await wearOutfit(max, 'max_miami.png'); await wearOutfit(leo, 'leo_chief.png');
  await wearOutfitHere(vlad, 'vlad.png'); await wearOutfitHere(sis, 'sister.png'); await wearOutfitHere(gar, 'gardener.png');
  tintHair(vlad, '#2b2b33'); tintHair(sis, '#3a3542');
  nose = makeNose(max); makeCape(vlad); fangsV = makeFangs(vlad); fangsS = makeFangs(sis); strawHat(gar); makeSunglasses(leo);
  talkMax = await makeTalkingFace(max, ['determined', 'suspicious', 'smug', 'surprised', 'neutral', 'sleeping', 'scared', 'shocked', 'nervous', 'happy', 'disgusted']);
  talkSis = await makeTalkingFace(sis, ['love', 'happy', 'evil_grin']);
  talkLeo = await makeTalkingFace(leo, ['smug', 'annoyed', 'happy']);
  talkGar = await makeTalkingFace(gar, ['angry', 'sad']);
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'think', 'point_forward', 'sit', 'knocked_out', 'scheming', 'laugh', 'shrug', 'proud', 'tool_hold', 'look_up', 'idle_lookaround', 'stomp'])
    A[n] = await loadAnimation(n);
  // Props.
  bread = garlicBread(0.9); scene.add(bread);
  bag = evidenceBag(garlicBread(0.75)); scene.add(bag);
  burg = burger(0.8); scene.add(burg);
  ring = poolRing(); scene.add(ring);
  clip = clippers(); scene.add(clip);
  sadTom = tomato(1.3, true); scene.add(sadTom);
  umb = umbrella(); umb.scale.setScalar(0.75); scene.add(umb);
  pup = puppy(); pup.scale.setScalar(1.4); scene.add(pup);
  stars = koStars(5); scene.add(stars);
  cuffs = handcuffs(); scene.add(cuffs);
  const wm = new THREE.MeshBasicMaterial({ color: '#7dff6a', transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 0; i < 40; i++) { const w = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), wm.clone()); w.renderOrder = 4; scene.add(w); wisps.push(w); }
  for (let i = 0; i < 10; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#e6d6c0'); scene.add(p); dust.push(p); }
}

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, arms: [], ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const runL = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const walkL = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
// An arm raised forward from hanging (0) to straight out (PI/2) and on up; after robloxPose. `spread` turns it outwards.
function armFwd(a, side, ang, spread = 0) { const e = new THREE.Euler(-ang, 0, side === 'L' ? spread : -spread, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(e); }
function moveTo(b, s, from, to, at, speed, run = false, endRot = null) {
  const d = from.distanceTo(to), m = travelTo(from, to, at, s, speed);
  b.pos = m.pos; b.rotY = m.moving ? m.heading : (endRot ?? b.rotY); if (m.moving) b.layers = run ? runL(m, d) : walkL(m, d);
  return m;
}

function maxState(s) {
  const b = st(MAXD, Math.PI, idle(s), 'neutral');
  if (s < B.enter) {                                              // the door: the sister, the think, the hand up
    b.rotY = face(MAXD, SIS_D) + 0.15; b.face = s > W.single ? 'surprised' : 'neutral';
    if (s > B.think1) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop1) { b.layers = idle(s); b.arms.push(['R', 1.75, 0.05]); b.face = 'determined'; }
  } else if (s < B.chief) {                                       // walks into the hall to the coffin
    moveTo(b, s, ENTER0, MAXH, B.coffinShot + 0.3, 12, false, Math.PI); b.face = 'suspicious';
    if (s > B.bread) b.face = 'determined';
  } else if (s < B.home + 0.05) {                                 // the Chief, then the sniff
    b.pos = MAXH.clone(); b.rotY = Math.PI + 0.9 * easeInOut(seg(s, B.chief + 0.2, B.chief + 0.7)); b.face = 'annoyed';
    if (s > B.think2) { b.layers = [[A.think, 0.4]]; b.face = 'suspicious'; }
    if (s > B.stop2) { b.layers = idle(s); b.arms.push(['R', 1.75, 0.05]); b.face = 'determined'; }
    if (s > B.pick - 0.15) {
      b.rotY = Math.PI - 0.15 + 0.9 * (1 - easeInOut(seg(s, B.pick - 0.15, B.pick + 0.3))); b.layers = idle(s);
      const k = easeInOut(seg(s, B.pick, B.pick + 0.45)); b.arms = [['R', lerp(0.9, 1.95, k), 0.5]];
      b.bread = s > B.pick + 0.2 ? 'nose' : 'rim'; b.face = s > B.pick + 0.4 ? 'sleeping' : 'determined'; b.nod = 0.12 * k;
      if (s > W.compost - 0.05) b.face = 'disgusted';
    }
  } else if (s < B.reveal) {                                      // homegrown: lowers it; turns to the window
    b.pos = MAXH.clone(); b.rotY = Math.PI - 0.15; b.face = 'suspicious'; b.bread = 'chest';
    b.arms = [['R', 1.2, 0.3]];
    if (s > B.turn) { b.rotY = lerp(Math.PI - 0.15, face(MAXH, WIN), easeInOut(seg(s, B.turn, B.turn + 0.6))); b.face = 'determined'; b.bread = 'gone'; b.arms = []; }
  } else if (s < B.wake) {                                        // the garden
    b.pos = MAX_G.clone(); b.rotY = face(MAX_G, GAR); b.face = 'determined';
    if (s < B.cuffs) { b.visible = false; }
    if (s > B.click + 0.3) b.face = 'smug';
  } else if (s < B.tempt3) {                                      // back in the hall with the bag
    b.pos = MAXH.clone(); b.rotY = Math.PI - 0.35; b.face = 'smug'; b.bag = true; b.arms = [['R', 1.25, 0.2]];
    if (s > B.dinner) { b.rotY = face(MAXH, SIS_ASK) + 0.2; b.face = 'happy'; }
    if (s > W.fangs - 0.05) { b.face = 'scared'; }
  } else if (s < B.cta) {                                         // "Tempting." backs off, runs for the exit
    b.pos = MAXH.clone(); b.rotY = face(MAXH, SIS_ASK) + 0.2; b.face = 'nervous'; b.layers = idle(s);
    if (s > B.flee) { b.face = 'scared'; moveTo(b, s, MAXH, EXIT, B.flee + MAXH.distanceTo(EXIT) / 16, 16, true, face(MAXH, EXIT)); }
  } else {                                                        // out of the front door and down the beach
    b.face = 'scared'; const m = travel(RUN0, RUN1, B.cta - 0.4, s, 16); b.pos = m.pos; b.rotY = m.heading; b.layers = runL(m, RUN0.distanceTo(RUN1));
  }
  return b;
}
function sisState(s) {
  const b = st(SIS_D, face(SIS_D, MAXD), idle(s, 0.3), 'love', { lean: -0.1, floor: 1.2 });
  if (s < B.enter) {
    if (s > B.r1 - 0.1) { b.face = 'sad'; b.lean = 0; }
  } else {
    b.pos = SIS_H.clone(); b.floor = 0; b.rotY = face(SIS_H, COF); b.face = 'sad'; b.lean = 0;
    if (win(s, B.sniff + 0.4, B.home)) { b.face = 'disgusted'; b.rotY = face(SIS_H, MAXH) - 0.5; b.lean = -0.18; }
    if (s > B.chief - 0.2 && s < B.sniff) b.rotY = face(SIS_H, LEO_H);
    if (s > B.sitUp) { b.face = 'happy'; b.rotY = face(SIS_H, COF); }
    if (s > B.dinner - 0.6) { moveTo(b, s, SIS_H, SIS_ASK, B.dinner + 0.2, 10, false, face(SIS_ASK, MAXH)); b.face = 'love'; b.talk = win(s, W.sister2, W.dinner + 0.4); }
    if (s > B.fangs) { b.face = 'evil_grin'; b.fangs = true; b.talk = false; }
    if (s > B.cta) b.visible = false;
  }
  if (s < B.dinner - 0.6 && s > B.enter && (SHOT === 'hook')) b.visible = false;
  return b;
}
// Vlad lies in the coffin (head toward -X, face up), then sits up about his hip.
function vladState(s) {
  const b = st(VLAD_FB, 0, idle(s), 'happy', { grounded: true });
  if (win(s, B.fb1, B.ko)) {                                      // flashbacks on the beach
    b.pos = VLAD_FB.clone(); b.rotY = face(VLAD_FB, KID) - 0.2; b.face = 'happy'; b.arms = [['R', 1.55, 0.25]];
    if (s > B.fb2) { b.arms = [['R', 1.4, 0.15], ['L', 1.4, -0.15]]; b.rotY = face(VLAD_FB, KID); }
    return b;
  }
  const up = easeInOut(seg(s, B.sitUp, B.sitUp + 0.6));
  b.lying = { up, layers: up > 0 ? [[A.idle, s, 1 - up], [A.sit, 0.5, up]] : [[A.idle, 0.2]] };
  b.grounded = false; b.face = up > 0.2 ? (s > B.fangs ? 'evil_grin' : 'happy') : 'knocked_out';
  if (s > B.fangs) b.fangs = true;
  if (s > B.cta) b.visible = false;
  return b;
}
function leoState(s) {
  const b = st(LEO0, face(LEO0, LEO_H), idle(s), 'smug');
  if (s < B.chief - 1.3 || s > B.sniff + 0.2) { b.visible = false; return b; }
  moveTo(b, s, LEO0, LEO_H, B.chief + 0.1, 12, false, face(LEO_H, MAXH));
  b.arms = [['R', 1.45, 0.15]]; b.ring = true; b.talk = win(s, W.chief, W.drop + 0.4); b.face = s > W.drop + 0.3 ? 'smug' : 'happy';
  if (s > B.r2) b.face = 'annoyed';
  return b;
}
function garState(s) {
  const b = st(GAR, Math.PI, [[A.tool_hold, 0.3]], 'annoyed');
  b.clip = 'hand';
  if (s < B.reveal) {                                             // clipping the hedge in the shade, glaring at the house
    b.rotY = face(GAR, V(0, 0, 0.5)); b.arms = [['R', 1.15 + 0.18 * Math.sin(s * 9), 0.1], ['L', 1.15 + 0.18 * Math.sin(s * 9 + 1), -0.1]];
    b.face = s < W.single ? 'annoyed' : 'angry';
  } else if (s < B.motive) {                                      // caught: freezes mid-snip
    b.rotY = face(GAR, V(-10, 0, 14)); b.face = 'shocked'; b.arms = [['R', 1.5, 0.1], ['L', 1.5, -0.1]];
  } else if (s < B.cuffs) {
    b.rotY = face(GAR, V(-10, 0, 14)); b.face = 'sad'; b.arms = [['R', 1.75, -0.3]]; b.clip = 'gone'; b.tom = true;
    if (s > B.go) { b.face = 'angry'; b.rotY = face(GAR, V(0, 0, -4)); b.arms = [['R', 2.2 + 0.15 * Math.sin(s * 14), 0.1]]; b.tom = false; }
  } else {
    b.rotY = face(GAR, MAX_G) - 0.4; b.face = s > B.click ? 'sad' : 'shocked'; b.arms = [['L', 1.5, -0.3], ['R', 1.5, -0.3]]; b.cuffs = s > B.click; b.clip = s > B.click ? 'drop' : 'hand';
  }
  return b;
}
function kidState(s) {
  const b = st(KID, face(KID, VLAD_FB), idle(s), 'happy');
  if (!win(s, B.fb1, B.ko)) b.visible = false;
  if (s > B.fb2) { b.face = 'love'; b.arms = [['R', 1.3, 0.2], ['L', 1.3, -0.2]]; }
  return b;
}

let tNow = 0;
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (x.lying) {                                                  // about the hip: lying (rotX -PI/2) -> sitting (rotX 0)
    robloxPose(a, x.lying.layers);
    const R = new THREE.Euler(lerp(-Math.PI / 2, 0, x.lying.up), Math.PI / 2, 0, 'YXZ'); a.root.rotation.copy(R);
    a.root.position.copy(HIP).sub(V(0, 2, 0).applyEuler(R)); a.root.updateMatrixWorld(true);
  } else {
    a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, (x.rotZ || 0) + (x.lean || 0), 'YXZ');
    if (x.rotX || x.rotZ || x.lean) { const c = V(0, 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }
    robloxPose(a, x.layers);
  }
  for (const [side, ang, spread] of x.arms) armFwd(a, side, ang, spread);
  if (x.wave) { a.bones['Arm.L'].quaternion.setFromEuler(new THREE.Euler(-2.3 - 0.15 * Math.sin(tNow * 10), 0, 0.15, 'XYZ')); }
  if (x.nod) a.bones.Head.rotation.x += x.nod;
  if (x.talk) a.bones.Head.rotation.x += 0.06 * Math.sin(tNow * 17);
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  setExpression(a, x.face);
  if (a === max) talkMax(x.face, lipAt(tNow));                   // Max narrates: his mouth follows the voice
  else if (x.talk && a === sis) talkSis(x.face, FLAP[Math.floor(tNow * 10) % FLAP.length]);
  else if (x.talk && a === leo) talkLeo(x.face, FLAP[Math.floor(tNow * 10) % FLAP.length]);
  a.root.updateMatrixWorld(true);
}
const local = (a, x, y, z) => { a.root.updateMatrixWorld(true); return V(x, y, z).applyMatrix4(a.root.matrixWorld); };
const handR = (a) => { a.bones['Arm.R'].updateMatrixWorld(true); return V(0, -2.05, 0).applyMatrix4(a.bones['Arm.R'].matrixWorld); };
const handL = (a) => { a.bones['Arm.L'].updateMatrixWorld(true); return V(0, -2.05, 0).applyMatrix4(a.bones['Arm.L'].matrixWorld); };
const headAt = (a, y = 0.5) => { a.bones.Head.updateMatrixWorld(true); return V(0, y, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const noseTip = () => { nose.updateMatrixWorld(true); return nose.userData.tip.clone().applyMatrix4(nose.matrixWorld); };

// ---------- samples ----------
const ACTION = () => [[B.enter, B.coffinShot + 0.3], [B.chief - 0.6, B.chief + 0.5], [B.click - 0.1, B.click + 0.3], [B.dinner - 0.6, B.dinner + 0.2], [B.flee, meta.seconds]];
export function samples(t) { return ACTION().some(([a, b]) => t > a && t < b) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
export function update(t, stage) {
  const s = t; tNow = t; cam = stage.camera;
  SHOT = shotAt(SHOTS, t).shot.id;
  const M = maxState(s), S = sisState(s), VL = vladState(s), L = leoState(s), G = garState(s), K = kidState(s);
  place(max, M); place(sis, S); place(vlad, VL); place(leo, L); place(gar, G); place(kid, K);
  fangsS.visible = !!S.fangs; fangsV.visible = !!VL.fangs;
  // Garlic-sick green on Vlad's face until the bread is bagged.
  const sick = 1 - seg(s, B.wake, B.sitUp); const hm = headMat(vlad); if (hm) { hm.emissive = hm.emissive || new THREE.Color(); hm.emissive.set('#3cff5a'); hm.emissiveIntensity = win(s, B.fb1, B.ko) ? 0 : 0.22 * sick; }
  // The nose: a faint glow while sniffing.
  setNose(nose, { glow: win(s, B.pick + 0.2, B.home) ? 0.8 + 0.2 * Math.sin(s * 12) : 0, inflate: win(s, B.pick + 0.3, B.i1) ? 0.06 * Math.max(0, Math.sin((s - B.pick) * 9)) : 0 });
  // Door, bats, candles, sea.
  door.visible = false;                                          // the door stands open (inward): a dark doorway
  bats.forEach((b, i) => { const a = s * (0.6 + i * 0.07) + i * 1.1, rr = 9 + (i % 3) * 4; b.position.set(Math.cos(a) * rr, 24 + 3 * Math.sin(a * 1.7 + i), -8 + Math.sin(a) * rr * 0.6); b.rotation.y = -a; b.scale.setScalar(1.4); b.userData.flap(s + i); });
  flames.forEach((f, i) => { f.scale.set(1, 1 + 0.18 * Math.sin(s * 13 + i * 2.1), 1); }); hallLights.forEach((l, i) => { l.intensity = 40 * (0.9 + 0.1 * Math.sin(s * 11 + i)); });
  stage.seaTex.offset.set(s * 0.01, s * 0.02);

  // Garlic bread: on the coffin rim; in Max's hands at his nose; held lower; then bagged (the bag in his right hand).
  bread.visible = !['gone'].includes(M.bread) && s < B.turn + 0.6 && s > B.enter - 0.1;
  if (!M.bread || M.bread === 'rim') { bread.position.copy(BREAD0); bread.rotation.set(0, 0.1, 0); }
  else if (M.bread === 'nose') { const p = handR(max); const tip = noseTip(); bread.position.copy(p.lerp(tip.clone().add(V(0, -0.35, 0)), 0.7)); bread.rotation.set(0, max.root.rotation.y + Math.PI / 2, 0.15); bread.rotateX(0.55); }
  else if (M.bread === 'chest') { bread.position.copy(handR(max).add(V(0, 0.15, 0))); bread.rotation.set(0, max.root.rotation.y + Math.PI / 2, 0); }
  bread.userData.butter.scale.y = 1 + (win(s, B.i1, B.i2) ? 0.4 * Math.sin((s - B.i1) * 8) : 0);
  bag.visible = !!M.bag && SHOT !== 'fangs'; if (M.bag) { bag.position.copy(handR(max)).add(V(0, -0.3, 0)); bag.rotation.set(0, max.root.rotation.y + 0.3, 0); }
  // Chief's burger and pool ring.
  burg.visible = ring.visible = !!L.ring && leo.root.visible;
  if (burg.visible) { burg.position.copy(handR(leo)).add(V(0, 0.15, 0)); ring.position.copy(local(leo, 0, 2.1, 0)); ring.rotation.set(0.08, 0, 0.05); }
  // Gardener's clippers, his sad tomato, the cuffs.
  clip.visible = G.clip !== 'gone' && gar.root.visible;
  if (G.clip === 'hand') { clip.position.copy(handR(gar).lerp(handL(gar), 0.5)); clip.quaternion.copy(gar.bones['Arm.R'].getWorldQuaternion(new THREE.Quaternion())); clip.rotateX(Math.PI); }
  else if (G.clip === 'drop') { const u = seg(s, B.click, B.click + 0.4); clip.position.copy(GAR.clone().add(V(0.6, lerp(3.2, 0.15, easeIn(u)), 1.2))); clip.rotation.set(lerp(0, Math.PI / 2, u), 0.3, 0); }
  sadTom.visible = !!G.tom; if (G.tom) { sadTom.position.copy(handR(gar)).add(V(0, 0.25, 0)); sadTom.scale.setScalar(1.3 * (1 - 0.06 * Math.sin(s * 30) * (s > W.tomatoes ? 1 : 0))); }
  cuffs.visible = !!G.cuffs;
  if (G.cuffs) {
    const wrist = (side) => { const bone = gar.bones[side === 'L' ? 'Arm.L' : 'Arm.R']; bone.updateMatrixWorld(true); return [V(0, -1.6, 0).applyMatrix4(bone.matrixWorld), bone.getWorldQuaternion(new THREE.Quaternion())]; };
    const [pl, ql] = wrist('L'), [pr, qr] = wrist('R'); setCuffs(cuffs, pl, pr, ql, qr);
    const k = easeOutBack(clamp((s - B.click) / 0.15), 3); cuffs.userData.rings.forEach((r) => r.scale.setScalar(Math.max(0.01, k * 1.1)));
  }
  // Flashback props: the umbrella over the kid, then the puppy handed back.
  umb.visible = win(s, B.fb1, B.fb2); if (umb.visible) { umb.position.copy(handR(vlad)).add(V(0, -0.4, 0)); umb.rotation.set(0, 0, -0.35); }
  pup.visible = win(s, B.fb2, B.ko); if (pup.visible) { const p = handR(vlad).lerp(handL(vlad), 0.5).lerp(handR(kid).lerp(handL(kid), 0.5), easeInOut(seg(s, B.fb2 + 0.1, B.ko - 0.15))); pup.position.copy(p).add(V(0, 0.3, 0)); pup.rotation.set(0, face(VLAD_FB, KID) - Math.PI / 2, 0); pup.userData.tail.rotation.y = 0.6 * Math.sin(s * 20); }
  // KO stars over Vlad until he wakes; green stink rising off the bread.
  stars.visible = s > B.enter && s < B.sitUp + 0.1 && !win(s, B.fb1, B.ko); stars.scale.setScalar(1); if (stars.visible) spinStars(stars, headAt(vlad, 0.6).add(V(0, 0.9, 0)), s, 0.8);
  wisps.forEach((w, i) => {
    const sniffing = win(s, B.pick + 0.2, B.i1), onRim = win(s, B.bread - 0.1, B.pick + 0.2);
    w.visible = sniffing || onRim; if (!w.visible) return;
    const ph = ((s * 0.7 + i * 0.137) % 1);
    if (sniffing) { const tip = noseTip(), src = bread.position.clone(); w.position.copy(src.clone().lerp(tip, ph)).add(V(0.1 * Math.sin(i + s * 5), 0.08 * Math.cos(i * 2 + s * 6), 0.1 * Math.cos(i))); w.scale.setScalar(0.5 * (1 - ph) + 0.2); w.material.opacity = 0.55 * (1 - ph * 0.5); return; }
    const src = bread.position; w.position.set(src.x + Math.sin(ph * 7 + i) * 0.4, src.y + 0.2 + ph * 3.2, src.z + Math.cos(ph * 7 + i) * 0.4 - ph * 0.6); w.scale.setScalar(0.5 + 0.9 * ph); w.material.opacity = 0.45 * (1 - ph);
  });
  dust.forEach((p, i) => { const u = (s - B.flee) / 0.8; p.visible = SHOT === 'tempt3' && u > 0 && u < 1; if (!p.visible) return; const a = i * 0.7; p.position.copy(MAXH).add(V(Math.cos(a) * (1 + 2 * u), 0.6 + u, Math.sin(a) * 1.5 * u)); p.scale.setScalar(0.6 + u); p.material.opacity = 0.6 * (1 - u); });

  // ---------- shots ----------
  const { u } = shotAt(SHOTS, t);
  const look = (p, tg, fov = 40, ext = 30) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const mh = headAt(max), sh = headAt(sis), vh = headAt(vlad), lh = headAt(leo), gh = headAt(gar);
  stage.bloom.strength = 0.35;
  // Cameras are placed in a character's own frame where it matters: local(a, x, y, z) has x = the character's left,
  // z = where it faces, so a "profile from his right" stays a profile whichever way he's turned.
  const wp = (o) => o.getWorldPosition(V(0, 0, 0)), rightOf = (a) => local(a, -1, 0, 0).sub(local(a, 0, 0, 0)), fwdOf = (a) => local(a, 0, 0, 1).sub(local(a, 0, 0, 0));
  const mid = sh.clone().lerp(vh, 0.5);
  switch (SHOT) {
    case 'hook': { const k = easeInOut(u); look(V(lerp(14, 13, k), 5.2, 2.3), V(-6, 3.9, 1.6), 42, 45); break; }   // side-on: Max's nose, the sister in the door, the gardener glaring in the shaded garden between them
    case 'tempt1': look(local(max, 5.6, 4.5, 1.6), local(max, 0, 4.1, 0.7), 40, 25); break;   // his left: the raised right hand stays out of the lens
    case 'enter': { const mp = max.root.position; look(mp.clone().add(V(4.5, 5.8, 11)), mp.clone().lerp(COF, 0.35).add(V(0, 3.2, 0)), 48, 30); break; }   // tracks him in
    case 'coffin': { const k = easeInOut(u); look(COF.clone().add(V(lerp(-7, -6, k), lerp(11, 10, k), lerp(9.5, 8.5, k))), COF.clone().add(V(-0.6, 2.4, 0)), 42, 20); break; }
    case 'fb1': look(FB.clone().add(V(-1.3, 3.6, 14)), FB.clone().add(V(-1.3, 3.4, -0.2)), 42, 20); break;
    case 'fb2': look(FB.clone().add(V(-1.3, 2.4, 11.5)), FB.clone().add(V(-1.3, 2.6, -0.2)), 40, 20); break;
    case 'ko': look(vh.clone().add(V(1.4, 5.0, 3.6)), vh.clone().add(V(0.4, 0.1, 0)), 40, 15); break;
    case 'bread': { const k = easeInOut(u); look(BREAD0.clone().add(V(lerp(-2.8, -2.0, k), lerp(2.0, 1.5, k), lerp(5.0, 3.8, k))), BREAD0.clone().add(V(-0.6, 0.1, -0.7)), 38, 12); break; }
    case 'stopV': look(OFF.clone().add(V(-2.2, 6.2, -9.5)), OFF.clone().add(V(-1.6, 3.7, 0.5)), 46, 25); break;   // reverse: over the coffin at Max and the sister
    case 'chief': look(OFF.clone().add(V(2.2, 5.6, 15.5)), OFF.clone().add(V(2.2, 3.9, 1.2)), 44, 25); break;
    case 'tempt2': look(local(max, 5.6, 4.5, 2.0), local(max, 0, 4.1, 0.8), 40, 20); break;
    case 'sniff': { const k = easeInOut(u); look(local(max, lerp(5.8, 4.8, k), 4.4, 1.1), local(max, 0, 4.15, 0.75), lerp(38, 34, k), 15); break; }   // his right profile, the nose in the bread; the sister leaning away behind
    case 'i1': { const c = bread.position.clone(); look(c.clone().addScaledVector(fwdOf(max), 2.6).addScaledVector(rightOf(max), 0.6).add(V(0, 1.6, 0)), c.clone().add(V(0, 0.2, 0)), 34, 10); break; }
    case 'i2': { const c = wp(bread.userData.clove); look(c.clone().addScaledVector(fwdOf(max), 1.7).addScaledVector(rightOf(max), -0.5).add(V(0, 1.1, 0)), c, 30, 10); break; }
    case 'i3': { const c = wp(bread.userData.crumb); look(c.clone().addScaledVector(fwdOf(max), 1.6).add(V(0, 0.85, 0)), c, 28, 10); break; }
    case 'home': { const k = easeInOut(u); look(local(max, -1.2, 4.4, lerp(7.4, 6.2, k)), local(max, 0, 4.0, 0.3), 40, 15); break; }
    case 'turn': look(MAXH.clone().add(V(4.5, 6.5, 6)), WIN.clone().add(V(0, -1.5, 0)), 48, 25); break;
    case 'reveal': { const k = easeOut(seg(s, B.reveal, B.reveal + 0.25)); look(local(gar, 0.6, lerp(4.8, 4.4, k), lerp(15, 9.5, k)).add(jolt(B.reveal + 0.25, 0.08)), local(gar, 0, 3.6, 0), 40, 25); break; }
    case 'patch': { const k = easeInOut(u); look(PATCH.clone().add(V(lerp(9, 7.5, k), lerp(6, 5, k), lerp(6, 4, k))), PATCH.clone().add(V(0, 0.6, 0)), 42, 20); break; }
    case 'motive': { const k = easeInOut(u); look(V(lerp(-4, -7, k), lerp(36, 32, k), lerp(40, 36, k)), V(-18, 0, -4), 44, 70); break; }   // the house's shadow over the garden, sun on the sand beyond
    case 'tomato': look(local(gar, -0.2, 4.3, 8), local(gar, -0.4, 3.8, 0.6), 38, 15); break;
    case 'go': look(local(gar, 5.5, 4.2, 6.5), local(gar, -0.6, 4.2, 0), 44, 30); break;
    case 'cuffs': { const m0 = GAR.clone().lerp(MAX_G, 0.5); look(m0.clone().add(V(-3.0, 5.6, 8.6)).add(jolt(B.click, 0.1, 0.3)), m0.clone().add(V(0, 3.0, 0)), 42, 20); break; }   // side-on to the pair: the cuffs between them
    case 'wake': { const k = easeInOut(u); look(OFF.clone().add(V(lerp(10, 9, k), 6.0, lerp(1.5, 0.8, k))), COF.clone().add(V(-0.4, 3.6, 0.6)), 44, 25); break; }
    case 'dinner': look(local(max, -2.2, 5.4, -5.5), sh.clone().lerp(vh, 0.3).add(V(0, -1.0, 0)), 44, 25); break;   // over Max's shoulder
    case 'fangs': { const k = easeInOut(u); look(local(sis, lerp(2.6, 2.2, k), 5.0, lerp(11.5, 9.5, k)), mid.clone().add(V(0, -0.4, 0)), 50, 20); break; }   // where Max stands: both grinning at him
    case 'tempt3': { if (s < B.flee) look(local(max, 0.8, 4.5, 6.6), local(max, 0, 4.0, 0.3), 40, 20); else look(OFF.clone().add(V(4, 7, 22)), OFF.clone().add(V(9, 3.2, 3.5)), 54, 30); break; }
    case 'cta': { const p = max.root.position; look(p.clone().add(V(9, 5.5, 16)), p.clone().add(V(-2, 5.2, -12)), 46, 60); break; }   // Max low in frame, the mansion behind him
    default: look(V(0, 6, 25), V(0, 3, 0), 44);
  }
  max.root.visible = max.root.visible && SHOT !== 'fangs';
  frontWall.visible = SHOT === 'stopV';
  // Indoors: no fog (the set is open to the camera side), dimmer sun.
  const indoors = INDOOR.has(SHOT);
  stage.scene.fog.near = indoors ? 3000 : 180; stage.scene.fog.far = indoors ? 6000 : 750;
  stage.sun.intensity = indoors ? 0.25 : 3.1; stage.hemi.intensity = indoors ? 0.25 : 0.55;
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
// The show's lock-up (lower left, over a live shot, under the captions): white serif "Detective", the name in big
// distressed yellow slab letters with a dark drop shadow, then the case name in white serif.
export function lockup(g, s, { x = 70, y = 1330, alpha = 1, k = 1, caseName = 'The Vampire Case' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.scale(k, k);
  const txt = (text, font, size, dy, color, shadow) => {
    g.font = `${font.replace('SIZE', size * s)}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    if (shadow) { g.fillStyle = 'rgba(20,12,4,.85)'; g.fillText(text, 7 * s, dy * s + 7 * s); }
    g.fillStyle = color; g.fillText(text, 0, dy * s);
  };
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14 * s;
  txt('Detective', '700 SIZEpx "Playfair Display"', 58, 0, '#ffffff', false);
  g.shadowBlur = 0;
  txt('MAX SNIFFWELL', 'SIZEpx "Alfa Slab One"', 92, 96, '#FFD23F', true);
  // distress: knock small specks out of the yellow letters
  g.globalCompositeOperation = 'source-atop'; const r = rng(5);
  for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.6 ? 'rgba(150,100,10,.55)' : 'rgba(255,240,170,.6)'; g.fillRect(r() * 860 * s, (14 + r() * 82) * s, (2 + r() * 5) * s, (1 + r() * 3) * s); }
  g.globalCompositeOperation = 'source-over';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 12 * s;
  txt(caseName, '700 SIZEpx "Playfair Display"', 52, 168, '#ffffff', false);
  g.restore();
}
function title(g, s, t) {
  const t0 = W.case1 + 0.35, t1 = W.nicest - 0.15; if (t < t0 || t > t1) return;
  const a = Math.min(inv(t0, t0 + 0.25, t), 1 - inv(t1 - 0.25, t1, t));
  lockup(g, s, { alpha: a, k: 1 + 0.03 * (1 - inv(t0, t0 + 0.4, t)) });
}
function counter(g, s, t) {
  let text, at;
  for (const [n, w] of [[1, B.r1], [2, B.r2], [3, B.r3]]) if (t > w - 0.05 && t < w + 1.5) { text = `TEMPTATIONS RESISTED: ${n}`; at = w - 0.05; }
  if (!text || t > B.cta) return;
  g.save(); g.font = `${36 * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s; g.restore();
  pill(g, s, 540 - w / s / 2, 250, text, 'rgba(214,52,110,.92)', '#ffffff', 36, pop(t, at, 0.2, 2.5));
}
function flashbackTint(g, s) {
  if (!['fb1', 'fb2'].includes(SHOT)) return;
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,214,150,.55)'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
  const v = g.createRadialGradient(540 * s, 900 * s, 300 * s, 540 * s, 900 * s, 1100 * s); v.addColorStop(0, 'rgba(255,240,210,0)'); v.addColorStop(1, 'rgba(255,230,190,.75)');
  g.fillStyle = v; g.fillRect(0, 0, 1080 * s, 1920 * s);
}
export function overlay(g, s, t) {
  flashbackTint(g, s);
  counter(g, s, t); title(g, s, t);
  if (SHOT === 'hook') bubble(g, s, t, headAt(sis, 1), ['Are you single,', 'detective?'], W.vampires - 0.1, W.tempting1 - 0.1, { heart: true });
  if (SHOT === 'chief') bubble(g, s, t, headAt(leo, 1), ['Nobody cares.', 'Drop it.'], W.chief, B.think2, { size: 52 });
  if (SHOT === 'dinner') bubble(g, s, t, headAt(sis, 1), ['Stay for', 'dinner?'], W.sister2 - 0.05, B.fangs, { heart: true, size: 54 });
  if (SHOT === 'cuffs' && t > B.click) bigText(g, s, 'CASE CLOSED', 540, 1060, 120, '#e0303a', { k: t - B.click < 0.12 ? lerp(2.6, 1, easeIn((t - B.click) / 0.12)) : 1, rot: -0.14, stroke: '#ffffff', sw: 0.12 });
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
  flash(g, s, (t >= B.reveal && t < B.reveal + 0.08) || (t >= B.fangs + 0.1 && t < B.fangs + 0.18) ? 0.35 : 0, '#ffffff');
}

export const cast = () => ({ max, sis, vlad, leo, gar, kid });
export const fx = () => ({ wisps, stars, bread, nose });
