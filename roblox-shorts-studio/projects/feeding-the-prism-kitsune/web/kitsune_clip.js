// Feeding the Prism Kitsune (standalone): a promo for the user's own game Hunt For Eggs! about its Prism Kitsune event.
// Web renderer + Roblox R6 pack + the game's own assets (creatures/prism_kitsune, props/prism_plinth, props/prism_blade,
// props/gift_chest as the Prism Chest, props/egg_prism, creatures/trex as the Prism beasts and the Prism Alpha).
// Beat times come from web/beats.js (source/beats.py: narration word timings), so the clip retimes itself.
// The giant Kitsune drops onto its plinth; it only eats Prism eggs (from crystal beasts under a dawn beam). Leo feeds it
// five for a chest (2X coins). Max wants the 5% Prism Blade: the Kitsune's walk turns beasts Prism, the hourly Prism Alpha
// bursts into eggs; Max gets two, Mia gets the rest. Max's chests: 2X training, 2X coins. Mia's first chest: the Blade.
// The Kitsune is ONE skinned mesh in rest pose, so it is animated whole: drop, squash, hop, gulp bob, slide-walk.
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, rng, puff, canvasTexture, neonMaterial } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, easeOutElastic, shotAt } from '../../../web/lib/anim.js';
import { roundRect, speedLines, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem, holdItem } from '../../../web/lib/robloxPack.js';
import { travel, STRIDE } from '../../../web/lib/locomotion.js';
import { loadCreature, poseCreature, creatureLowest, attachToBody } from '../../../web/lib/creature.js';
import { trexIdle, trexRoar, trexHeadbutt, mixPose } from '../../../web/lib/trexPoses.js';
import { waveArm } from '../../../web/lib/gestures.js';
import { W } from './beats.js';

export const meta = { seconds: Math.ceil((W.end + 0.6) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Feeding the Prism Kitsune' };
export const sky = { zenith: '#3f86e8', horizon: '#cbe8ff', below: '#e9f4ff', fog: '#d6ecff', sunColor: '#fff1d6', sunDir: new THREE.Vector3(0.45, 0.62, 0.62) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const seg = (s, a, b) => clamp((s - a) / (b - a));
const CYAN = '#5ae6ff', VIOLET = '#965aff';            // event colours (90,230,255) and (150,90,255)

// ---------- layout (plinth at the origin, the Kitsune faces +Z; corridor along +X at z = CORR_Z) ----------
const PL_TOP = 1.4, KIT_HOME = V(0, PL_TOP, 0), MOUTH = V(0, 6.6, 12.4);   // mouth in the Kitsune's own space
const FEED = V(4.2, 0, 19.5), CHEST_AT = V(-5.2, 0, 20.5), BLADE_AT = V(18, 5.5, 3);
const CORR_Z = 26, HOP_TO = V(8, 0, CORR_Z);
const DAWN_BEAST = V(104, 0, 40), DAWN_LEO = V(93.5, 0, 38.5);
const PENS = [[46, 10, 0], [62, 42, Math.PI], [78, 10, 0], [94, 42, Math.PI], [112, 10, 0]];   // x, z, rotY of corridor beasts
const ALPHA_AT = V(-2, 0, 34), ALPHA_ROT = -0.55;
const BEAST_S = 0.62, ALPHA_S = BEAST_S * 1.8;
const RING = [V(-12, 0, 40), V(8, 0, 42), V(-15, 0, 28), V(10, 0, 27), V(-3, 0, 46)];   // server around the Alpha

// ---------- beats (all from narration words) ----------
const B = {
  land: W.fell + 0.15, blown: W.sky - 0.15, hungry: W.its - 0.15, speech: W.only - 0.25,
  dawn: W.dawn - 0.45, sparkle: W.sparkle - 0.15, fight: W.beat - 0.3, hit1: W.beat + 0.15, hit2: W.beat + 0.65, poof: W.drops - 0.25, egg: W.drops - 0.05,
  feed1: W.leo - 0.3, toss1: W.fed + 0.1, gulp1: W.one, g2: W.two + 0.1, g3: W.three + 0.1, g4: W.four + 0.1, nothing: W.nothing - 0.1,
  g5: W.five + 0.1, drop: W.chest - 0.3, open: W.inside - 0.05, coins: W.double - 0.1,
  maxLook: W.but - 0.15, blade: W.blade - 0.35, pct: W.five2 - 0.1, need: W.so - 0.15,
  hopShot: W.good - 0.2, thirty: W.thirty - 0.1, hop: W.thirty + 0.25, walk: W.walk - 0.05, passes: W.passes - 0.3,
  warn: W.better - 0.2, fall: W.lands - 0.45, lands: W.lands, fightA: W.whole - 0.2, burst: W.bursts - 0.05,
  maxTwo: W.grabbed - 0.3, mia: W.mia - 0.25,
  maxFeed: W.fed2 - 0.3, chest2: W.chest2 - 0.05, train: W.training - 0.1, again: W.again - 0.15, coins2: W.coins2 - 0.1,
  miaFeed: W.opened - 0.35, chest3: W.chest3 - 0.1, rise: W.chest3 + 0.2, blade2: W.blade2 - 0.1,
  hurry: W.hurry - 0.25, look: W.leaves - 0.25, friday: W.friday - 0.2, cta: W.play - 0.15,
};
const MAX_STREAM = [B.maxFeed + 0.15, B.chest2 - 0.45], MAX_STREAM2 = [B.again + 0.05, B.coins2 - 0.5], MIA_STREAM = [B.miaFeed + 0.05, B.chest3 - 0.45];
// Gulps (time, strength, duration): Leo's slow down each time; the streams are quick.
const GULPS = [[B.gulp1, 1, 0.55], [B.g2, 0.8, 0.6], [B.g3, 0.6, 0.75], [B.g4, 0.45, 0.95], [B.g5, 1, 0.5]];
for (const [a, b] of [MAX_STREAM, MAX_STREAM2, MIA_STREAM]) for (let k = 0; k < 5; k++) GULPS.push([lerp(a, b, (k + 1) / 5) + 0.05, 0.5, 0.3]);
const streamCount = (s, [a, b]) => Math.floor(clamp((s - a) / (b - a)) * 5 + 1e-6);
function meter(s) {
  if (s < B.gulp1) return 0; if (s < B.g2) return 1; if (s < B.g3) return 2; if (s < B.g4) return 3; if (s < B.g5) return 4; if (s < B.open + 0.5) return 5;
  if (s < MAX_STREAM2[0] - 0.1) return s < B.maxFeed ? 0 : s < B.chest2 + 0.25 ? streamCount(s, MAX_STREAM) : 0;
  if (s < B.miaFeed) return s < B.coins2 + 0.25 ? streamCount(s, MAX_STREAM2) : 0;
  return s < B.chest3 + 0.3 ? streamCount(s, MIA_STREAM) : 0;
}
const meterOn = (s) => (s > B.hungry + 0.3 && s < B.dawn) || (s > B.feed1 && s < B.open + 0.6) || (s > B.maxFeed && s < B.coins2 + 0.6) || (s > B.miaFeed && s < B.chest3 + 0.5);

const SHOTS = [
  [0, 'hook'], [B.blown, 'blown'], [B.hungry, 'hungry'], [B.dawn, 'dawn'], [B.fight, 'fight'], [B.feed1, 'feed1'],
  [W.two - 0.15, 'feed2'], [W.three - 0.15, 'feed3'], [W.four - 0.15, 'feed4'], [B.nothing, 'nothing'], [W.five - 0.15, 'feed5'],
  [B.drop - 0.05, 'chest'], [B.maxLook, 'maxLook'], [B.blade, 'blade'], [B.need, 'need'], [B.hopShot, 'hop'], [B.walk, 'patrol'],
  [B.warn, 'warn'], [B.fall - 0.1, 'alphaLand'], [B.fightA, 'fightA'], [B.burst - 0.25, 'burst'], [B.maxTwo, 'maxTwo'], [B.mia, 'miaTower'],
  [B.maxFeed, 'maxFeed'], [B.again, 'again'], [B.miaFeed, 'miaChest'], [B.hurry, 'deadline'], [B.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let kitTrail, kit, kitTilt, kitMesh, plinth, blade, blade2, chest, chestLid, beam, beamRing, alpha, alphaGem = [], cam, SHOT = 'hook', STAGE;
let leo, max, mia, noobs = [], swords = {}, A = {}, BODIES;
const beasts = [], eggs = [], puffs = [], sparks = [], shards = [], ripples = [];

const prismMat = (c, k = 2.4) => neonMaterial(c, k);
// Four neon block crystals along a T-rex's back (model space, front -Z), alternating cyan / violet; returns them.
function crystalise(rex) {
  const out = [];
  [[-3.6, 10.9, 0.18], [-1.4, 10.9, -0.1], [0.9, 10.3, 0.15], [3.0, 9.0, -0.12]].forEach(([z, y, tilt], i) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 1.1), prismMat(i % 2 ? VIOLET : CYAN, 2.6));
    c.position.set(i % 2 ? 0.25 : -0.25, y + 0.9, z); c.rotation.set(-0.25, 0.6 * i, tilt); c.castShadow = false;
    out.push(attachToBody(rex, 'torso', c));
  });
  return out;
}
// Splits the gift chest into body + lid (triangles above the seam at y = 2.9) and repaints it in prism colours.
async function makeChest() {
  const src = await packItem('props', 'gift_chest'), g = new THREE.Group(), lid = new THREE.Group();
  const paint = { c_d69e2e: '#8a5cf0', c_a0701c: '#4b2fa0', c_ffd65c: CYAN, c_60d6ff_neon: '#ffffff' };
  const HINGE = V(0, 2.9, -1.75);                     // back top edge (after the load turn the lock faces +Z)
  src.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const newMats = mats.map((m) => { const c = paint[m.name] || '#8a5cf0', neon = m.name.includes('neon') || m.name === 'c_ffd65c'; return neon ? prismMat(c, m.name === 'c_ffd65c' ? 1.4 : 2.5) : new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.1, emissive: c, emissiveIntensity: 0.04 }); });
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = geo.attributes.position, groups = geo.groups.length ? geo.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
    for (const grp of groups) {
      const lo = [], hi = [], nlo = [], nhi = [];
      for (let i = grp.start; i < grp.start + grp.count; i += 3) {
        const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3, dst = cy > 2.9 ? hi : lo, nd = cy > 2.9 ? nhi : nlo;
        for (let k = 0; k < 3; k++) { dst.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k)); nd.push(geo.attributes.normal.getX(i + k), geo.attributes.normal.getY(i + k), geo.attributes.normal.getZ(i + k)); }
      }
      for (const [arr, nrm, parent, off] of [[lo, nlo, g, null], [hi, nhi, lid, HINGE]]) {
        if (!arr.length) continue;
        const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        if (off) bg.translate(-off.x, -off.y, -off.z);
        const m = new THREE.Mesh(bg, newMats[grp.materialIndex] || newMats[0]); m.castShadow = m.receiveShadow = true; parent.add(m);
      }
    }
  });
  lid.position.copy(HINGE); g.add(lid);
  const glow = new THREE.PointLight('#b9f4ff', 0, 14, 1.6); glow.position.set(0, 3.5, 0.5); g.add(glow);
  g.userData = { lid, glow };
  return g;
}
async function placed(kind, name, h) { const o = await packItem(kind, name); const b = new THREE.Box3().setFromObject(o); const k = h / (b.max.y - b.min.y); o.scale.setScalar(k); o.userData.k = k; return o; }

export async function setup(stage) {
  const { scene } = stage; const r = rng(7); STAGE = stage;
  scene.fog.near = 120; scene.fog.far = 520;
  // Ground, plaza and corridor.
  scene.add(part(700, 4, 700, '#5aa845'));
  const tiles = canvasTexture(512, 512, (x, w, h) => { x.fillStyle = '#d9dee8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b9c0cf'; x.lineWidth = 6; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(9, 9);
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(72, 0.3, 72), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.7 })); plaza.position.set(0, 0.05, 8); plaza.receiveShadow = true; scene.add(plaza);
  const corr = part(200, 0.2, 12, '#e3cf9a', { rough: 0.9 }); corr.position.set(135, 0.12, CORR_Z); scene.add(corr);
  for (const [x, z] of [[-36, 8], [36, -10], [36, 44]]) { const n = new THREE.Mesh(new THREE.BoxGeometry(x === -36 ? 0.5 : 0.5, 0.4, x === -36 ? 72 : 36), prismMat(CYAN, 1.6)); n.position.set(x, 0.3, z); scene.add(n); }
  // Prism lamps round the plaza.
  for (const [x, z] of [[-26, -18], [26, -18], [-26, 36], [26, 36], [-30, 10], [30, 10]]) {
    const p = part(0.7, 9, 0.7, '#3a3550', { center: true }); p.position.set(x, 4.5, z); scene.add(p);
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), prismMat((x + z) % 2 ? VIOLET : CYAN, 2.8)); c.position.set(x, 9.8, z); scene.add(c);
  }
  // Event arch sign behind the plinth.
  const signTex = canvasTexture(1400, 300, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#2a1b5a'); g.addColorStop(1, '#13204a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = CYAN; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h - 16); x.font = '150px "Luckiest Guy"'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tg = x.createLinearGradient(0, 0, w, 0); tg.addColorStop(0, CYAN); tg.addColorStop(1, '#c9a6ff'); x.fillStyle = tg; x.fillText('PRISM FEEDING', w / 2, h / 2 + 10); });
  const sb = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 0.6), new THREE.MeshStandardMaterial({ color: '#1d1840' })); sb.position.set(0, 21, -22); scene.add(sb);
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(27.6, 5.6), new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.7 })); sf.position.set(0, 21, -21.68); scene.add(sf);
  for (const x of [-13, 13]) { const p = part(1.2, 24, 1.2, '#2a2450', { center: true }); p.position.set(x, 12, -22); scene.add(p); }
  // Pens along the corridor (grass patches with low fences) and the dawn pen.
  for (const [x, z] of [...PENS.map(([x, z]) => [x, z]), [DAWN_BEAST.x - 4, DAWN_BEAST.z]]) {
    const g = part(16, 0.2, 13, '#4f9a3c', { rough: 0.95 }); g.position.set(x, 0.14, z); scene.add(g);
    for (const [dx, dz, w, d] of [[0, -6.5, 16, 0.4], [0, 6.5, 16, 0.4], [-8, 0, 0.4, 13], [8, 0, 0.4, 13]]) { if ((z < CORR_Z && dz > 0) || (z > CORR_Z && dz < 0)) continue; const f = part(w, 1.2, d, '#8a6a46'); f.position.set(x + dx, 1.25, z + dz); scene.add(f); }
  }
  // Trees and hills far off.
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 150 + r() * 110, x = Math.cos(a) * d + 60, z = Math.sin(a) * d + 20;
    const t = part(1.4, 6, 1.4, '#6b4a2e', { center: true }); t.position.set(x, 3, z); scene.add(t);
    const top = part(7, 7, 7, i % 2 ? '#3f8f3a' : '#4ea545', { center: true }); top.position.set(x, 9, z); scene.add(top);
  }

  // The plinth and the Kitsune (outer group = position + heading; tilt group = pivot, tilt and squash).
  plinth = await packItem('props', 'prism_plinth'); scene.add(plinth);
  kitMesh = await packItem('creatures', 'prism_kitsune');
  // The game tints its greyscale texture; here a prism tint: cyan at the front and feet, violet towards the tails and ears.
  kitMesh.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position, col = [], a = new THREE.Color('#9ff1ff'), b = new THREE.Color('#c7a8ff'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const u = clamp(0.5 - pos.getZ(i) / 30 + pos.getY(i) / 40 + 0.08 * Math.sin(pos.getX(i) * 0.9 + pos.getY(i) * 0.6)); c.copy(a).lerp(b, u); col.push(c.r, c.g, c.b); }
    o.geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    o.material = o.material.clone(); o.material.vertexColors = true; o.material.emissive = new THREE.Color('#5a46b8'); o.material.emissiveIntensity = 0.22; o.material.roughness = 0.35;
  });
  kit = new THREE.Group(); kitTilt = new THREE.Group(); kit.add(kitTilt); kitTilt.add(kitMesh); scene.add(kit);
  kitTrail = new THREE.Mesh(new THREE.BoxGeometry(9, 60, 9), new THREE.MeshBasicMaterial({ color: '#c9f6ff', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(kitTrail);
  const kitGlow = new THREE.PointLight('#a9f0ff', 30, 40, 1.5); kitGlow.position.set(0, 12, 8); kit.add(kitGlow);

  // Prism Blade beside the Kitsune (big) and the one that rises out of Mia's chest.
  blade = await packItem('props', 'prism_blade'); blade.scale.setScalar(2.3); scene.add(blade);
  const bl = new THREE.PointLight('#d6b8ff', 25, 22, 1.6); bl.position.set(0, 3, 1.5); blade.add(bl);
  blade2 = await packItem('props', 'prism_blade'); blade2.scale.setScalar(0.85); scene.add(blade2);
  const bl2 = new THREE.PointLight('#d6b8ff', 12, 12, 1.6); bl2.position.set(0, 3, 1); blade2.add(bl2);
  chest = await makeChest(); chest.scale.setScalar(0.85); scene.add(chest);

  // Beasts: the dawn one, the corridor ones (crystals grow as the Kitsune passes), and the Prism Alpha.
  const mk = async (s) => { const c = await loadCreature('trex'); c.root.scale.setScalar(s); scene.add(c.root); return c; };
  const dawnRex = await mk(BEAST_S); beasts.push({ c: dawnRex, home: DAWN_BEAST, rot: -Math.PI / 2, gems: crystalise(dawnRex), dawn: true });
  for (const [x, z, rot] of PENS) { const c = await mk(BEAST_S); beasts.push({ c, home: V(x, 0, z), rot, gems: crystalise(c) }); }
  BODIES = Object.keys(dawnRex.bodies).filter((n) => dawnRex.bodies[n].meshes.length);
  alpha = await mk(ALPHA_S); alphaGem = crystalise(alpha);
  // The dawn beam.
  beam = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, 90, 40, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { opacity: { value: 0.5 }, color: { value: new THREE.Color('#bff6ff') } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); vY = uv.y; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), vV)), 2.5); float h = pow(1.0 - vY, 1.6); gl_FragColor = vec4(color * f * h * opacity, 1.0); }` }));
  beam.position.copy(DAWN_BEAST).add(V(-2, 45, 0)); scene.add(beam);
  beamRing = new THREE.Mesh(new THREE.RingGeometry(6.2, 7.6, 40), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
  beamRing.rotation.x = -Math.PI / 2; beamRing.position.copy(DAWN_BEAST).add(V(-2, 0.3, 0)); scene.add(beamRing);

  // Prism eggs (one pool for every egg in the film).
  for (let i = 0; i < 26; i++) {
    const e = await placed('props', 'egg_prism', 2.0); scene.add(e); eggs.push(e);
    e.traverse((o) => { if (o.isMesh && o.material.transparent) { o.material = o.material.clone(); o.material.opacity = 0.14; o.material.emissiveIntensity = 0.5; } });   // thin the shimmer shell so the egg's own colours read
  }

  const ex = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'smug', 'evil_grin', 'scheming', 'scared', 'laugh', 'determined', 'dizzy', 'cool', 'nervous', 'confused', 'sad', 'blink'];
  [leo, max, mia] = await Promise.all(['Leo', 'Max', 'Mia'].map((n) => loadRobloxCharacter(n, { expressions: ex, hairLift: n === 'Leo' ? 0.16 : 0 })));
  for (let i = 0; i < 2; i++) noobs.push(await loadRobloxCharacter('Noob', { expressions: ['determined', 'shocked', 'happy'] }));
  scene.add(leo.root, max.root, mia.root, ...noobs.map((n) => n.root));
  for (const [k, a] of [['leo', leo], ['max', max], ['mia', mia], ['n0', noobs[0]], ['n1', noobs[1]]]) swords[k] = holdItem(a, await packItem('props', 'sword'));
  for (const n of ['idle', 'walk', 'run', 'shock', 'hold', 'facepalm', 'think', 'defeated', 'shrug', 'proud', 'look_up', 'laugh_big', 'point_forward', 'tool_slash', 'tool_hold', 'tool_lunge', 'dizzy'])
    A[n] = await loadAnimation(n);
  for (let i = 0; i < 28; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  for (let i = 0; i < 40; i++) { const k = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), prismMat(i % 2 ? VIOLET : CYAN, 3.5)); k.castShadow = false; scene.add(k); sparks.push(k); }
  for (let i = 0; i < 18; i++) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.7), prismMat(i % 2 ? VIOLET : CYAN, 3)); k.castShadow = false; scene.add(k); shards.push(k); }
  for (let i = 0; i < 2; i++) { const g = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 64), new THREE.MeshBasicMaterial({ color: i ? VIOLET : CYAN, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); g.rotation.x = -Math.PI / 2; scene.add(g); ripples.push(g); }
}

// ---------- the Kitsune (whole-mesh animation) ----------
function kitAt(s) {
  // returns { pos, rotY, tiltX, tiltZ, sy, sxz, pivotZ }
  const o = { pos: KIT_HOME.clone(), rotY: 0, tiltX: 0, tiltZ: 0, sy: 1 + 0.012 * Math.sin(s * 2.2), sxz: 1, pivotZ: 7, vis: true };
  // Falls out of the sky (from high above, accelerating) and lands squash-first on the plinth.
  if (s < B.land) { const u = s / B.land; o.pos.y = PL_TOP + 30 * (1 - u * u); o.tiltX = -0.08 * (1 - u); o.sy = 1.12; o.sxz = 0.94; return o; }
  const sq = s - B.land;
  if (sq < 0.9) { const k = (1 - easeOutElastic(clamp(sq / 0.9))); o.sy = 1 - 0.34 * k; o.sxz = 1 + 0.17 * k; }
  // Hungry: stomach rumble shakes.
  if (s > B.hungry + 0.3 && s < B.dawn) { const rm = seg(s, B.hungry + 0.3, B.hungry + 1.1) * (1 - seg(s, B.speech + 1.2, B.speech + 1.6)); o.tiltZ = 0.03 * Math.sin(s * 38) * rm; o.sy += 0.02 * Math.sin(s * 30) * rm; o.tiltX = 0.06; }
  // Gulps: bob forward about the front feet, squash, back up.
  for (const [g, k, d] of GULPS) { const u = (s - g) / d; if (u > 0 && u < 1) { const b = Math.sin(Math.PI * u); o.tiltX += 0.09 * k * b; o.sy -= 0.08 * k * b; o.sxz += 0.04 * k * b; } }
  // The walk: hops off the plinth, turns down the corridor, slides along with a bob and a waddle.
  if (s > B.hop && s < B.warn) {
    const hu = seg(s, B.hop, B.walk), from = KIT_HOME, to = HOP_TO.clone();
    if (s < B.walk) {
      o.pos = from.clone().lerp(to, easeInOut(hu)); o.pos.y = lerp(PL_TOP, 0, hu) + 9 * Math.sin(Math.PI * hu); o.rotY = lerp(0, Math.PI / 2, easeInOut(hu));
      o.tiltX = -0.12 * Math.sin(Math.PI * hu); const land = seg(s, B.walk - 0.12, B.walk); o.sy = 1 + 0.08 * Math.sin(Math.PI * hu) - 0.15 * Math.sin(Math.PI * land); o.pivotZ = 0;
    } else {
      const m = travel(to, V(400, 0, CORR_Z), B.walk, s, 15); o.pos = m.pos; o.rotY = Math.PI / 2;
      const ph = (s - B.walk) * 5.5; o.pos.y = 0.6 * Math.abs(Math.sin(ph)); o.tiltZ = 0.05 * Math.sin(ph); o.tiltX = 0.02; o.pivotZ = 0;
      const land = seg(s, B.walk, B.walk + 0.4); o.sy *= 1 - 0.12 * Math.sin(Math.PI * land);
    }
  }
  // Deadline: back on the plinth, rears up to look at the sky.
  if (s > B.hurry) { const u = easeInOut(seg(s, B.look, B.look + 0.6)); o.tiltX = -0.2 * u; o.pivotZ = -6; if (s > B.cta) o.tiltX = 0; }
  return o;
}
function placeKit(o) {
  kit.visible = o.vis; kit.position.copy(o.pos); kit.rotation.set(0, o.rotY, 0);
  kitTilt.position.set(0, 0, o.pivotZ); kitTilt.rotation.set(o.tiltX, 0, o.tiltZ); kitTilt.scale.set(o.sxz, o.sy, o.sxz);
  kitMesh.position.set(0, 0, -o.pivotZ); kit.updateMatrixWorld(true);
}
const kitPoint = (p) => kitMesh.localToWorld(p.clone());
const mouth = () => kitPoint(MOUTH);

// ---------- characters ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const slash = (s, k = 0) => [[A.tool_slash, (s + k) % A.tool_slash.length]];
const mv = (m, d) => [[A.run, (m.u * d) / STRIDE]];
const wk = (m, d) => [[A.walk, (m.u * d) / STRIDE]];
const H = { hide: (b) => ({ ...b, visible: false }) };
const toMouth = (p) => face(p, V(0, 0, 0));

function leoState(s) {
  const b = st(V(-1, 0, 25), Math.PI, idle(s), 'shocked');
  if (s < B.hungry) {                                    // hook: in the plaza, looks up; blown back a step by the landing
    const back = easeOut(seg(s, B.land, B.land + 0.35)); b.pos = V(-1.5, 0, 24 + 2 * back); b.rotY = Math.PI + 0.1;
    b.layers = s < B.land ? [[A.look_up, 0.5]] : [[A.shock, 0.35]]; b.face = s < B.land ? 'surprised' : 'shocked';
    if (s > B.blown + 0.8) { b.layers = [[A.look_up, 0.5]]; b.face = 'surprised'; }
  } else if (s < B.dawn) return H.hide(b);
  else if (s < B.feed1) {                                // dawn: walks up to the crystal beast, beats it
    const m = travel(DAWN_LEO.clone().add(V(-10, 0, 0)), DAWN_LEO, B.dawn, s, 12);
    b.pos = m.pos; b.rotY = m.moving ? m.heading : face(DAWN_LEO, DAWN_BEAST); b.layers = m.moving ? wk(m, 10) : [[A.tool_hold, 0.3]]; b.face = 'determined'; b.sword = true;
    if (s > B.hit1 - 0.25 && s < B.poof) b.layers = slash(s - B.hit1 + 0.25);
    if (s > B.poof) { b.layers = [[A.proud, 0.4]]; b.face = 'happy'; b.sword = false; }
  } else if (s < B.drop - 0.05) {                        // feeding: holds the egg up, tosses it, waits; slower and more tired each time
    b.pos = FEED.clone(); b.rotY = toMouth(FEED) + Math.PI * 0; b.rotY = face(FEED, V(0, 0, 12)); b.face = 'happy'; b.layers = [[A.hold, 0.3]]; b.holdEgg = true;
    const tired = s > B.g4 + 0.3 ? 3 : s > B.g3 ? 2 : s > B.g2 ? 1 : 0;
    const toss = [[B.toss1, B.gulp1], [B.g2 - 0.5, B.g2], [B.g3 - 0.5, B.g3], [B.g4 - 0.5, B.g4], [B.g5 - 0.45, B.g5]].find(([a, c]) => s > a && s < c + 0.4);
    if (toss) { b.layers = [[A.point_forward, 0.3]]; b.holdEgg = false; }
    b.face = ['happy', 'neutral', 'annoyed', 'sad'][tired];
    if (tired >= 2 && !toss) b.layers = [[A.defeated, 0.6]];
    if (s > B.nothing && s < W.five - 0.15) { b.layers = [[A.defeated, 1]]; b.face = 'sad'; b.holdEgg = false; }
    if (s > B.g5 - 0.45 && s < B.g5 + 0.4) b.face = 'determined';
  } else if (s < B.maxLook) {                            // the chest: proud
    b.pos = FEED.clone(); b.rotY = face(FEED, CHEST_AT.clone().add(V(0, 0, 3))); b.layers = s < B.coins ? [[A.shock, 0.3]] : [[A.proud, 0.5]]; b.face = s < B.coins ? 'surprised' : 'smug';
  } else if (s < B.fightA) return H.hide(b);
  else if (s < B.burst + 0.6) {                          // fighting the Alpha
    b.pos = RING[0].clone(); b.rotY = face(b.pos, ALPHA_AT); b.layers = slash(s, 0.1); b.face = 'determined'; b.sword = true;
  } else return H.hide(b);
  return b;
}

function maxState(s) {
  const b = st(V(3, 0, 25), Math.PI, idle(s), 'neutral');
  if (s < B.hungry) {
    const back = easeOut(seg(s, B.land, B.land + 0.35)); b.pos = V(3.5, 0, 23 + 2.2 * back); b.rotY = Math.PI - 0.15;
    b.layers = s < B.land ? [[A.look_up, 0.5]] : [[A.shock, 0.35]]; b.face = s < B.land ? 'surprised' : 'shocked';
    if (s > B.blown + 0.8) { b.layers = [[A.look_up, 0.5]]; b.face = 'happy'; }
  } else if (s < B.maxLook) return H.hide(b);
  else if (s < B.hopShot) {                              // stares up at the Blade, then determined
    b.pos = V(13, 0, 15); b.rotY = face(b.pos, BLADE_AT); b.layers = [[A.look_up, 0.5]]; b.face = s < B.blade + 0.4 ? 'surprised' : 'happy';
    if (s > B.pct) { b.face = 'shocked'; b.layers = [[A.shock, 0.3]]; }
    if (s > B.need) { b.pos = V(8, 0, 20); b.rotY = Math.PI + 0.25; b.layers = [[A.tool_hold, 0.3]]; b.face = 'determined'; b.sword = true; }
  } else if (s < B.warn) {                               // runs behind the walking Kitsune
    const k0 = HOP_TO.clone().add(V(-22, 0, 1.5)), m = travel(k0, V(400, 0, CORR_Z + 1.5), B.walk + 0.1, s, 15);
    if (s < B.walk + 0.1) { b.pos = k0.clone(); b.rotY = Math.PI / 2; b.layers = [[A.tool_hold, 0.3]]; b.face = 'determined'; }
    else { b.pos = m.pos; b.rotY = m.heading; b.layers = [[A.run, m.anim]]; b.face = 'determined'; }
    b.sword = true;
  } else if (s < B.maxTwo) {                             // fighting the Alpha
    b.pos = RING[1].clone(); b.rotY = face(b.pos, ALPHA_AT); b.layers = s < B.fightA ? [[A.tool_hold, 0.3]] : slash(s, 0.35); b.face = 'determined'; b.sword = true;
    if (s > B.lands && s < B.lands + 0.6) { b.layers = [[A.shock, 0.3]]; b.face = 'shocked'; }
  } else if (s < B.maxFeed) {                            // hugs his two eggs; Mia walks past with the rest
    b.pos = V(4, 0, 30); b.rotY = 0.35; b.layers = [[A.hold, 0.3]]; b.face = s < B.mia + 0.4 ? 'happy' : 'shocked'; b.eggs = 2;
    if (s > B.mia + 0.4) b.rotY = face(b.pos, miaState(s).pos);
  } else if (s < B.miaFeed) {                            // feeds the Kitsune twice; deflates each time
    b.pos = FEED.clone(); b.rotY = face(FEED, V(0, 0, 12)); b.layers = [[A.point_forward, 0.3]]; b.face = 'determined';
    if (s > B.chest2 + 0.2) { b.rotY = face(FEED, CHEST_AT.clone().add(V(0, 0, 3))); b.layers = [[A.shrug, s - B.chest2 - 0.2]]; b.face = 'annoyed'; }
    if (s > B.again) { b.rotY = face(FEED, V(0, 0, 12)); b.layers = [[A.point_forward, 0.3]]; b.face = 'nervous'; }
    if (s > B.coins2 + 0.15) { b.rotY = face(FEED, CHEST_AT.clone().add(V(0, 0, 3))); b.layers = [[A.defeated, 0.8]]; b.face = 'sad'; }
  } else if (s < B.hurry) {                              // watches Mia's chest: shock
    b.pos = V(3.6, 0, 24.5); b.rotY = face(b.pos, CHEST_AT); b.layers = [[A.defeated, 0.8]]; b.face = 'sad';
    if (s > B.rise) { b.layers = [[A.shock, 0.35]]; b.face = 'shocked'; }
  } else return H.hide(b);
  return b;
}

function miaState(s) {
  const b = st(V(-6, 0, 25), Math.PI, idle(s), 'neutral');
  if (s < B.hungry) {
    const back = easeOut(seg(s, B.land, B.land + 0.35)); b.pos = V(-6.5, 0, 22.5 + 2 * back); b.rotY = Math.PI + 0.3;
    b.layers = s < B.land ? [[A.look_up, 0.5]] : [[A.shock, 0.35]]; b.face = s < B.land ? 'surprised' : 'shocked';
    if (s > B.blown + 0.8) { b.layers = [[A.look_up, 0.5]]; b.face = 'smug'; }
  } else if (s < B.warn) return H.hide(b);
  else if (s < B.maxTwo) {                               // fighting the Alpha
    b.pos = RING[2].clone(); b.rotY = face(b.pos, ALPHA_AT); b.layers = s < B.fightA ? [[A.tool_hold, 0.3]] : slash(s, 0.6); b.face = 'determined'; b.sword = true;
    if (s > B.lands && s < B.lands + 0.6) { b.layers = [[A.shock, 0.3]]; b.face = 'shocked'; }
  } else if (s < B.maxFeed) {                            // walks past Max with a tower of eggs
    const from = V(-8, 0, 26.5), to = V(30, 0, 26.5), d = from.distanceTo(to), m = travel(from, to, B.mia - 0.3, s, 12);
    b.pos = m.pos; b.rotY = m.heading; b.layers = m.moving ? [[A.walk, m.anim], [A.hold, 0.3, 1.2]] : [[A.hold, 0.3]]; b.face = 'smug'; b.eggs = 11;
  } else if (s < B.miaFeed) return H.hide(b);
  else if (s < B.hurry) {                                // feeds her tower in one go, opens one chest: the Blade
    b.pos = CHEST_AT.clone().add(V(2, 0, 4.6)); b.rotY = face(b.pos, s < MIA_STREAM[1] ? V(0, 0, 12) : CHEST_AT); b.layers = s < MIA_STREAM[1] + 0.1 ? [[A.point_forward, 0.3]] : idle(s); b.face = 'smug';
    if (s > B.rise) { b.rotY = face(b.pos, V(lerp(b.pos.x, 0, 0.3), 0, 40)); b.layers = idle(s); b.wave = true; b.face = 'laugh'; }
  } else return H.hide(b);
  return b;
}
function noobState(i, s) {
  const b = st(RING[3 + i], 0, idle(s), 'determined', { visible: false });
  if (s > B.warn && s < B.maxTwo) { b.visible = true; b.rotY = face(b.pos, ALPHA_AT); b.layers = s < B.fightA ? [[A.tool_hold, 0.3]] : slash(s, 0.2 + 0.45 * i); b.sword = true; if (s > B.lands && s < B.lands + 0.6) { b.layers = [[A.shock, 0.3]]; b.face = 'shocked'; } }
  return b;
}

function place(a, x, key) {
  a.root.visible = x.visible !== false;
  a.root.position.copy(x.pos); a.root.rotation.set(x.rotX || 0, x.rotY, x.rotZ || 0, 'YXZ');
  robloxPose(a, x.layers);
  if (x.wave) waveArm(a, NOW, 'R');
  if (x.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += x.floor - soleHeight(a); }
  if (a.faceTex[x.face]) setExpression(a, x.face);
  if (swords[key]) swords[key].visible = !!x.sword;
  a.root.updateMatrixWorld(true);
}
// Where a character's held stack starts (in front of the chest, at hand height).
const holdBase = (a) => { const ry = a.root.rotation.y; return a.root.position.clone().add(V(Math.sin(ry) * 1.35, 2.3, Math.cos(ry) * 1.35)); };

// ---------- beasts ----------
function placeRex(c, pos, rotY, pose, scale) {
  c.root.visible = true; c.root.scale.setScalar(scale); c.root.position.copy(pos); c.root.rotation.set(0, rotY, 0); poseCreature(c, pose);
  c.root.position.y -= creatureLowest(c, BODIES); c.root.updateMatrixWorld(true);
}
// Crystal growth 0..1 for each corridor beast: when the walking Kitsune reaches it.
function beastGlow(bst, s, kx) {
  if (bst.dawn) return s < B.poof ? 1 : 0;
  if (s < B.walk) return 0;
  if (s > B.warn) return 1;
  const passAt = B.walk + Math.max(0, bst.home.x - 8 - HOP_TO.x) / 15;
  return easeOutBack(seg(s, passAt, passAt + 0.35), 2);
}

// ---------- samples (motion blur on the fast moves) ----------
const BLUR = () => [[0, B.land + 0.2], [B.hop, B.walk + 0.3], [B.fall, B.lands + 0.3], [B.burst - 0.05, B.burst + 0.5], [B.mia - 0.2, B.maxFeed]];
export function samples(t) { return BLUR().some(([a, b]) => t > a && t < b) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

// ---------- update ----------
let NOW = 0;
const DAY = { zenith: '#3f86e8', horizon: '#cbe8ff', sun: '#fff0dc', hemi: '#d9ecff' }, DAWN = { zenith: '#3b4f9e', horizon: '#ffb58a', sun: '#ffc79a', hemi: '#ffd2c0' };
export function update(t, stage) {
  const s = t; NOW = t; cam = stage.camera;
  const dawn = s > B.dawn && s < B.feed1;
  const L = dawn ? DAWN : DAY, U = stage.skyMesh.material.uniforms;
  U.zenith.value.set(L.zenith); U.horizon.value.set(L.horizon); stage.sun.color.set(L.sun); stage.hemi.color.set(L.hemi);
  stage.sun.intensity = dawn ? 2.4 : 3.1; stage.scene.fog.color.set(dawn ? '#e9b9a8' : '#d6ecff');

  const KO = kitAt(s); placeKit(KO);
  kitTrail.visible = s < B.land; kitTrail.position.copy(KO.pos).add(V(0, 38, 0)); kitTrail.material.opacity = 0.3 * (1 - seg(s, B.land - 0.3, B.land));
  plinth.position.set(0, 0, 0);

  // Characters.
  const Ls = leoState(s), Ms = maxState(s), Mi = miaState(s);
  place(leo, Ls, 'leo'); place(max, Ms, 'max'); place(mia, Mi, 'mia');
  noobs.forEach((n, i) => place(n, noobState(i, s), 'n' + i));

  // Beasts: the dawn one stands in its beam until Leo beats it (it flinches, then poofs); corridor ones idle in pens.
  beasts.forEach((bst, i) => {
    const glow = beastGlow(bst, s, KO.pos.x);
    let pose = trexIdle(s * 0.9 + i), pos = bst.home.clone(), rot = bst.rot, scale = BEAST_S;
    if (bst.dawn) {
      bst.c.root.visible = s > B.dawn - 0.1 && s < B.poof + 0.3;
      if (!bst.c.root.visible) return;
      if (s < W.beat) pose = mixPose(trexIdle(s), trexRoar(s), seg(s, B.sparkle, B.sparkle + 0.3) * (1 - seg(s, B.sparkle + 0.9, B.sparkle + 1.2)) * 0.6);
      for (const h of [B.hit1, B.hit2]) if (s > h && s < h + 0.3) { pose = mixPose(pose, trexHeadbutt(0.2), 0.8); pos.x += 0.6 * Math.sin(Math.PI * (s - h) / 0.3); }
      if (s > B.poof) scale = BEAST_S * (1 - easeIn(seg(s, B.poof, B.poof + 0.25)));
      scale = Math.max(scale, 0.001);
    } else bst.c.root.visible = s > B.hopShot - 0.2 && s < B.warn + 0.1;
    if (!bst.c.root.visible) return;
    placeRex(bst.c, pos, rot, pose, scale);
    bst.gems.forEach((g, k) => { g.visible = glow > 0.01; const sc = Math.max(0.001, glow * (bst.dawn ? 1 + 0.08 * Math.sin(s * 6 + k) : 1)); g.scale.setScalar(sc); });
    poseCreature(bst.c, pose);
  });
  beam.visible = beamRing.visible = s > B.dawn - 0.1 && s < B.poof + 0.2;
  beam.material.uniforms.opacity.value = 0.55 + 0.12 * Math.sin(s * 5); beamRing.material.opacity = 0.5 + 0.2 * Math.sin(s * 5);

  // The Prism Alpha: falls, lands with a slam, roars, gets hit, bursts.
  alpha.root.visible = s > B.fall && s < B.burst + 0.25;
  if (alpha.root.visible) {
    let pose = trexIdle(s), pos = ALPHA_AT.clone(), sc = ALPHA_S;
    if (s < B.lands) { const u = seg(s, B.fall, B.lands); pos.y = 120 * (1 - u * u); pose = mixPose(trexIdle(s), trexRoar(s), 0.5); }
    else if (s < B.fightA) pose = mixPose(trexIdle(s), trexRoar(s), seg(s, B.lands + 0.2, B.lands + 0.5));
    else pose = mixPose(trexRoar(s), trexHeadbutt(((s - B.fightA) * 1.3) % 1), 0.6);
    if (s > B.burst) sc = ALPHA_S * (1 + 0.25 * easeOut(seg(s, B.burst, B.burst + 0.2)));
    placeRex(alpha, pos, ALPHA_ROT, pose, sc);
    if (s < B.lands) alpha.root.position.y = pos.y;
    const land = s - B.lands; if (land > 0 && land < 0.5) { const k = Math.sin(Math.PI * land / 0.5); alpha.root.scale.set(sc * (1 + 0.12 * k), sc * (1 - 0.18 * k), sc * (1 + 0.12 * k)); }
    alphaGem.forEach((g) => g.scale.setScalar(1.2));
    poseCreature(alpha, pose);
  }

  // The Blade: turning beside the Kitsune (and on the end card); the one rising out of Mia's chest.
  blade.visible = (s > B.maxLook && s < B.hopShot) || s > B.cta;
  const bk = s > B.cta ? 2.3 : 2.3 * easeOutBack(seg(s, B.maxLook + 0.2, B.maxLook + 0.7), 1.8);
  blade.scale.setScalar(Math.max(0.001, bk)); blade.position.copy(BLADE_AT).add(V(0, 0.5 * Math.sin(s * 2.2), 0)); blade.rotation.set(0, s * 1.6, 0.12);
  if (s > B.cta) { blade.position.set(8.2, 3.2 + 0.5 * Math.sin(s * 2.2), 14); blade.scale.setScalar(1.6); }
  blade2.visible = s > B.rise && s < B.hurry;
  if (blade2.visible) { const u = easeOut(seg(s, B.rise, B.rise + 0.9)); blade2.position.copy(CHEST_AT).add(V(0, lerp(1.2, 5.6, u), 0.2)); blade2.rotation.set(0, s * 2.5, 0); blade2.scale.setScalar(0.85 * lerp(0.6, 1, u)); }

  // The Prism Chest: drops in, lid swings open with a glow (Leo's, Max's two, Mia's).
  const drops = [[B.drop, B.open], [B.chest2 - 0.25, B.chest2 + 0.2], [B.coins2 - 0.45, B.coins2], [B.chest3 - 0.3, B.chest3 + 0.1]];
  const cd = [...drops].reverse().find(([a]) => s > a);
  const chestOn = cd && ((s < B.maxLook && cd[0] === B.drop) || (s > B.maxFeed && s < B.miaFeed && cd[0] !== B.drop) || (s > B.miaFeed && s < B.hurry && cd[0] === drops[3][0]));
  chest.visible = !!chestOn;
  if (chest.visible) {
    const [a, op] = cd, u = seg(s, a, a + 0.3); chest.position.copy(CHEST_AT).add(V(0, 26 * (1 - easeIn(u)), 0)); chest.rotation.set(0, 0.25, 0);
    const sq = s - a - 0.3, k = sq > 0 && sq < 0.35 ? Math.sin(Math.PI * sq / 0.35) : 0; chest.scale.set(0.85 * (1 + 0.15 * k), 0.85 * (1 - 0.2 * k), 0.85 * (1 + 0.15 * k));
    const o = easeOutBack(seg(s, op, op + 0.35), 2); chest.userData.lid.rotation.x = -1.9 * o; chest.userData.glow.intensity = 10 * o;
  }

  // Eggs: Leo's dawn egg, the eggs he feeds, the Alpha's burst, the stacks, the streams into the mouth.
  const mo = mouth(); let ei = 0;
  const egg = (p, k = 1, rx = 0, rz = 0) => { const e = eggs[ei++]; if (!e) return; e.visible = true; e.position.copy(p); e.scale.setScalar(e.userData.k * k); e.rotation.set(rx, s * 0.6, rz); };
  const arc = (from, to, u, hgt = 5) => from.clone().lerp(to, u).add(V(0, hgt * Math.sin(Math.PI * u), 0));
  eggs.forEach((e) => { e.visible = false; });
  if (s > B.egg && s < B.feed1) { const u = seg(s, B.egg, B.egg + 0.6), from = DAWN_BEAST.clone().add(V(-3, 3, 0)), to = DAWN_LEO.clone().add(V(4, 0, 0.5)); egg(arc(from, to, u, 6).setY(Math.max(0, arc(from, to, u, 6).y)), 0.6 + 0.4 * easeOutBack(seg(s, B.egg, B.egg + 0.3), 2), 0, (1 - u) * 3); }
  if (s > B.feed1 && s < B.drop) {
    const tosses = [[B.toss1, B.gulp1], [B.g2 - 0.5, B.g2], [B.g3 - 0.5, B.g3], [B.g4 - 0.5, B.g4], [B.g5 - 0.45, B.g5]];
    const tt = tosses.find(([a, c]) => s > a && s < c);
    if (tt) egg(arc(holdBase(leo).add(V(0, 1.2, 0)), mo, easeIn(seg(s, tt[0], tt[1])), 3), lerp(0.8, 0.55, seg(s, tt[0], tt[1])), 0, s * 4);
    else if (Ls.holdEgg) egg(holdBase(leo).add(V(0, -0.3, 0)), 0.8);
  }
  if (s > B.burst && s < B.maxTwo) for (let i = 0; i < 14; i++) {     // ring of eggs bursting out of the Alpha
    const a = i / 14 * Math.PI * 2 + 0.2, u = seg(s, B.burst + 0.02 * i, B.burst + 0.02 * i + 0.7), to = ALPHA_AT.clone().add(V(Math.cos(a) * (9 + (i % 3) * 3), 0, Math.sin(a) * (7 + (i % 2) * 3)));
    const p = arc(ALPHA_AT.clone().add(V(0, 7, 0)), to, easeOut(u), 6); egg(p, 0.7, 0, (1 - u) * 5);
  }
  for (const [a, x] of [[max, Ms], [mia, Mi]]) if (x.eggs && a.root.visible) {
    const base = holdBase(a), ry = a.root.rotation.y;
    for (let k = 0; k < x.eggs; k++) { const sw = 0.06 * k * Math.sin(s * 6); egg(base.clone().add(V(Math.cos(ry) * sw + (x.eggs === 2 ? (k - 0.5) * 0.9 * Math.cos(ry) : 0), (x.eggs === 2 ? 0 : k * 0.98), -Math.sin(ry) * sw - (x.eggs === 2 ? (k - 0.5) * 0.9 * Math.sin(ry) : 0))), 0.5); }
  }
  for (const [st0, who] of [[MAX_STREAM, max], [MAX_STREAM2, max], [MIA_STREAM, mia]]) {
    if (s < st0[0] - 0.4 || s > st0[1] + 0.2 || !who.root.visible) continue;
    const pile = holdBase(who).add(V(0, 0.2, 0));
    for (let k = 0; k < 5; k++) { const a0 = lerp(st0[0], st0[1], k / 5) - 0.1, u = seg(s, a0, a0 + (st0[1] - st0[0]) / 5 + 0.1); if (u <= 0) { if (who === mia && k === 0) for (let j = 0; j < 5; j++) egg(pile.clone().add(V(0, j * 0.98, 0)), 0.5); else if (k === 0) egg(pile, 0.5); continue; } if (u < 1) egg(arc(pile, mo, easeIn(u), 3), lerp(0.5, 0.3, u)); }
  }

  // Shockwave ripples: the Kitsune landing, the Alpha slamming down.
  ripples.forEach((rp, i) => {
    const ev = [[B.land, V(0, 0.3, 0), 30], [B.lands, ALPHA_AT.clone().setY(0.3), 34]].find(([a]) => s > a + i * 0.12 && s < a + i * 0.12 + 0.8);
    rp.visible = !!ev; if (!ev) return; const u = (s - ev[0] - i * 0.12) / 0.8; rp.position.copy(ev[1]); rp.scale.setScalar(2 + ev[2] * easeOut(u)); rp.material.opacity = 0.85 * (1 - u);
  });
  // Puffs: landings, the poof, the burst, chest drops.
  const events = [[B.land, V(0, 1.5, 6), 6, 0.9, '#e8f2ff'], [B.land + 0.05, V(-8, 1.2, 10), 4, 0.8, '#ffffff'], [B.land + 0.05, V(8, 1.2, 10), 4, 0.8, '#ffffff'],
    [B.poof, DAWN_BEAST.clone().add(V(-2, 4, 0)), 4, 0.8, '#d9f6ff'], [B.poof + 0.05, DAWN_BEAST.clone().add(V(0, 6, 0)), 3.5, 0.8, '#e6d6ff'],
    [B.walk, HOP_TO.clone().add(V(0, 1, 0)), 4, 0.7, '#e8dcc0'], [B.lands, ALPHA_AT.clone().add(V(-7, 1, -2)), 3.5, 0.8, '#e8f2ff'], [B.lands + 0.05, ALPHA_AT.clone().add(V(8, 1, -2)), 3, 0.8, '#ffffff'],
    [B.burst, ALPHA_AT.clone().add(V(0, 7, 0)), 8, 0.9, '#e0d0ff'], [B.burst + 0.05, ALPHA_AT.clone().add(V(0, 9, 0)), 6, 0.9, '#c8f6ff'],
    ...drops.map(([a]) => [a + 0.3, CHEST_AT.clone().add(V(0, 0.5, -1.5)), 1.1, 0.45, '#ffffff'])];
  const evs = events.filter((e) => s >= e[0] && s < e[0] + e[3]);
  puffs.forEach((p, i) => {
    const ev = evs[i % Math.max(1, evs.length)]; p.visible = !!ev; if (!ev) return;
    const [at, c, size, dur, col] = ev, u = (s - at) / dur, a = i * 0.7;
    p.material.color.set(col); p.material.emissive.set(col);
    p.position.set(c.x + Math.cos(a) * size * 1.3 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.3 + u * size * 0.4, c.z + Math.sin(a) * size * 1.3 * easeOut(u));
    p.scale.setScalar(size * (0.3 + 0.5 * easeOut(u))); p.material.opacity = 0.8 * (1 - u) ** 2;
  });
  // Sparkles: landing, each gulp, the dawn beast, crystals growing, the chest opening, the Blade.
  const sp = [];
  if (s > B.land && s < B.land + 1.2) sp.push([B.land, V(0, 6, 4), 14, 1.2]);
  for (const [g] of GULPS) if (s > g && s < g + 0.7) sp.push([g, mo.clone(), 4, 0.7]);
  if (s > B.dawn && s < B.poof) sp.push([B.dawn + Math.floor((s - B.dawn) / 0.8) * 0.8, DAWN_BEAST.clone().add(V(-2, 5, 0)), 7, 0.8]);
  if (s > B.poof && s < B.poof + 0.8) sp.push([B.poof, DAWN_BEAST.clone().add(V(-2, 4, 0)), 8, 0.8]);
  for (const [a, op] of drops) if (s > op && s < op + 1.0) sp.push([op, CHEST_AT.clone().add(V(0, 3.5, 0)), 5, 1.0]);
  if (s > B.walk && s < B.warn) beasts.forEach((bst) => { if (bst.dawn) return; const g = B.walk + Math.max(0, bst.home.x - 8 - HOP_TO.x) / 15; if (s > g && s < g + 0.8) sp.push([g, bst.home.clone().add(V(0, 8, 0)), 5, 0.8]); });
  if (s > B.burst && s < B.burst + 0.9) sp.push([B.burst, ALPHA_AT.clone().add(V(0, 8, 0)), 16, 0.9]);
  sparks.forEach((k, i) => {
    const ev = sp[i % Math.max(1, sp.length)]; k.visible = !!ev && i < sp.length * 14; if (!k.visible) return;
    const [at, c, size, dur] = ev, u = (s - at) / dur, a = i * 2.39, el = (i % 7) / 7;
    k.position.set(c.x + Math.cos(a) * size * easeOut(u), c.y + (el - 0.3) * size * 0.8 * easeOut(u) - 2 * u * u, c.z + Math.sin(a) * size * easeOut(u));
    k.scale.setScalar(1.6 * (1 - u)); k.rotation.set(s * 3 + i, s * 2, 0);
  });
  // Shards flying off the Alpha when it bursts.
  shards.forEach((k, i) => { const u = s - B.burst; k.visible = u > 0 && u < 1.2 && s < B.maxTwo; if (!k.visible) return; const a = i * 0.35 * Math.PI, sp2 = 10 + (i % 4) * 4; k.position.copy(ALPHA_AT).add(V(Math.cos(a) * sp2 * u, 7 + 14 * u - 16 * u * u, Math.sin(a) * sp2 * u)); k.rotation.set(u * 9 + i, u * 7, 0); });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const look = (p, tg, fov = 42, ext = 40) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), ext); };
  const jolt = (at, k, dur = 0.35) => (s > at && s < at + dur ? V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0).multiplyScalar(1 - (s - at) / dur) : V(0, 0, 0));
  const kp = kit.position, lp = leo.root.position, mp = max.root.position, mip = mia.root.position;
  stage.bloom.strength = 0.5;
  switch (shot.id) {
    case 'hook': look(V(lerp(-6, -4, u), 3.6, 54).add(jolt(B.land, 1.2, 0.5)), V(0, lerp(17, 10, easeInOut(seg(s, 0, B.land + 0.3))), 4), 58, 50); break;     // low behind the trio: it drops onto the plinth
    case 'blown': look(V(7, 4.5, 50), V(0, 8, 6), 52, 40); break;                                                     // the trio blown back, the Kitsune behind
    case 'hungry': look(V(lerp(5, 3.5, u), 9.5, 33), V(0, 8.6, 10), 44, 40); break;                                      // close on its face
    case 'dawn': look(DAWN_BEAST.clone().add(V(-14, 4, 30)), DAWN_BEAST.clone().add(V(-5, 6.5, 0)), 50, 50); break;          // the crystal beast in its beam
    case 'fight': look(V(97, 4.5, 66), V(97, 4.2, 39), 50, 40); break;
    case 'feed1': look(V(14, 5, 34), V(1, 6.5, 14), 46, 40); break;                                                       // Leo at the feed spot, the face above
    case 'feed2': look(V(-10, 3.5, 30), V(2, 6, 15), 46, 40); break;
    case 'feed3': look(V(12, 9, 27), V(2, 5.5, 15), 44, 40); break;
    case 'feed4': look(V(3, 2.4, 29), V(2.5, 6.5, 14), 48, 40); break;
    case 'nothing': look(V(-14, 6, 40), V(0, 6, 12), 46, 40); break;
    case 'feed5': look(V(14, 5, 34), V(1, 6.5, 14), 46, 40); break;
    case 'chest': look(V(0, 5, 37), V(-0.5, 3.6, 19), 50, 40); break;                                                       // the chest drops between Leo and the Kitsune
    case 'maxLook': look(V(9, 3, 29), V(16, 8, 6), 52, 40); break;                                                      // behind Max, looking up at the Blade
    case 'blade': look(V(9, 7, 36), V(13, 11.5, 4), 48, 40); break;                                                        // the Blade turning beside the Kitsune, Max below
    case 'need': look(V(5, 4.6, 33), V(7.5, 4, 20), 40, 30); break;                                                       // Max, sword ready
    case 'hop': look(V(26, 6, 52), V(4, 7, 14), 50, 50); break;                                                              // the Kitsune hops off its plinth
    case 'patrol': { const x = kp.x; look(V(x + 30, 15, CORR_Z + 36), V(x + 11, 4.5, CORR_Z - 3), 56, 60); break; }       // behind and beside: it slides down the corridor, beasts light up
    case 'warn': look(V(0, 6, 72), V(0, 18, 20), 54, 60); break;                                                             // the plaza, the sky
    case 'alphaLand': look(V(18, 5, 70).add(jolt(B.lands, 1.5, 0.6)), V(-2, lerp(22, 9, seg(s, B.fall, B.lands)), 34), 52, 60); break;
    case 'fightA': look(V(lerp(24, 20, u), 7, 64), V(-2, 7, 34), 54, 60); break;
    case 'burst': look(V(16, 6, 66).add(jolt(B.burst, 1.0, 0.5)), V(-2, 6, 34), 56, 60); break;
    case 'maxTwo': look(V(9, 3.8, 42), V(3.2, 3.4, 30), 42, 40); break;
    case 'miaTower': look(V(9, 4.5, 46), V(4, 5, 31), 50, 40); break;
    case 'maxFeed': case 'again': look(V(2, 5, 42), V(1.2, 5.2, 17), 50, 40); break;
    case 'miaChest': look(V(1.5, 4.6, 39), V(-2.5, 4.6, 21), 48, 40); break;
    case 'deadline': look(V(lerp(10, 8, u), 3, 40), V(0, lerp(10, 13, easeInOut(seg(s, B.look, B.look + 0.8))), 6), 50, 40); break;
    case 'cta': look(V(4, 5, 50), V(3, 9, 6), 48, 40); break;                                                            // end card: the Kitsune and the Blade below the card
    default: look(V(20, 12, 40), V(0, 4, 8), 46);
  }
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 }; }
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#1a1440' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
const prismFill = (g, s, w) => { const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, CYAN); gr.addColorStop(1, '#b48cff'); return gr; };
const pop = (t, at, d = 0.15, k = 3) => easeOutBack(clamp((t - at) / d), k);
const fade = (t, at, hold) => 1 - inv(at + hold - 0.2, at + hold, t);
function word(g, s, t, at, hold, text, col, size = 140, y = 780, rot = -0.06) { const a = t - at; if (a < 0 || a > hold) return; bigText(g, s, text, 540, y, size, col, { k: pop(t, at), alpha: fade(t, at, hold), rot }); }
function pill(g, s, x, y, text, bg, fg = '#ffffff', size = 42) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 40 * s;
  roundRect(g, x * s, y * s, w, (size + 34) * s, 20 * s); g.fillStyle = bg; g.fill(); g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, x * s + 20 * s, (y + (size + 34) / 2 + 3) * s); g.restore();
  return w / s;
}
// Banner ribbon in the event colours.
function banner(g, s, t, at, lines, y = 560, { k0 = 1, size = 92, hold = 99, colA = CYAN, colB = '#9a6bff' } = {}) {
  const a = t - at; if (a < 0 || a > hold) return;
  const k = pop(t, at, 0.25, 2) * k0, al = fade(t, at, hold), w = 940, h = (size * 1.15) * lines.length + 60;
  g.save(); g.globalAlpha = al; g.translate(540 * s, y * s); g.scale(k, k); g.rotate(-0.025);
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 34 * s); const gr = g.createLinearGradient(-w / 2 * s, 0, w / 2 * s, 0); gr.addColorStop(0, colA); gr.addColorStop(1, colB); g.fillStyle = gr; g.fill();
  g.lineWidth = 9 * s; g.strokeStyle = '#ffffff'; g.stroke();
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  lines.forEach((ln, i) => { const yy = (i - (lines.length - 1) / 2) * size * 1.15 * s + 6 * s; g.lineWidth = size * 0.18 * s; g.strokeStyle = '#1a1440'; g.strokeText(ln, 0, yy); g.fillStyle = '#ffffff'; g.fillText(ln, 0, yy); });
  g.restore();
}
// The feed meter: five pips and "n / 5".
function drawMeter(g, s, t, n, y = 430) {
  const w = 620, x0 = 540 - w / 2, full = n >= 5, pulse = full ? 1 + 0.06 * Math.sin(t * 18) : 1;
  g.save(); g.translate(540 * s, (y + 50) * s); g.scale(pulse, pulse); g.translate(-540 * s, -(y + 50) * s);
  roundRect(g, x0 * s, y * s, w * s, 100 * s, 30 * s); g.fillStyle = 'rgba(26,20,64,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = full ? '#ffffff' : CYAN; g.stroke();
  for (let i = 0; i < 5; i++) { roundRect(g, (x0 + 24 + i * 70) * s, (y + 24) * s, 58 * s, 52 * s, 12 * s); g.fillStyle = i < n ? (i % 2 ? VIOLET : CYAN) : 'rgba(255,255,255,.14)'; g.fill(); }
  g.font = `${58 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(`${n} / 5`, (x0 + 480) * s, (y + 54) * s);
  g.restore();
  bigText(g, s, 'FEED ME', 540, y - 34, 44, '#ffffff', { stroke: '#1a1440' });
}
function speech(g, s, p3, lines, k = 1, dir = 1) {
  const p = project(p3, s); if (!p.on) return;
  g.save(); g.translate(p.x, p.y); g.scale(k, k);
  const w = 560, h = 70 * lines.length + 50;
  roundRect(g, -w / 2 * s, -h * s, w * s, h * s, 36 * s); g.fillStyle = 'rgba(255,255,255,.97)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#1a1440'; g.stroke();
  g.beginPath(); g.moveTo(-30 * dir * s, -4 * s); g.lineTo(10 * dir * s, 46 * s); g.lineTo(40 * dir * s, -4 * s); g.closePath(); g.fillStyle = 'rgba(255,255,255,.97)'; g.fill();
  g.font = `${58 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1a1440';
  lines.forEach((ln, i) => g.fillText(ln, 0, (-h + 55 + i * 70) * s)); g.restore();
}
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
function hud(g, s, t) {
  if (t >= B.cta) return;
  pill(g, s, 60, 250, 'PRISM FEEDING', 'rgba(70,40,150,.92)');
  let y = 350;
  const boost = (at, until, label) => { if (t > at && t < until) { pill(g, s, 60, y, `${label} ${clock(900 - (t - at))}`, label.includes('TRAINING') ? 'rgba(40,150,80,.92)' : 'rgba(210,150,20,.95)', '#ffffff', 36); y += 84; } };
  boost(B.coins + 1.2, B.maxLook, '2X COINS');
  boost(B.train + 1.0, B.miaFeed, '2X TRAINING'); boost(B.coins2 + 1.0, B.miaFeed, '2X COINS');
}
export function overlay(g, s, t) {
  hud(g, s, t);
  // Hook.
  banner(g, s, t, B.land, ['THE PRISM KITSUNE', 'ARRIVES'], 640, { hold: B.hungry - B.land });
  if (meterOn(t)) drawMeter(g, s, t, meter(t), SHOT === 'hungry' ? 470 : 470);
  if (t > B.speech && t < B.dawn) speech(g, s, kitPoint(V(-5.5, 6.5, 12)), ["I'M SO", 'HUNGRY...'], pop(t, B.speech, 0.25, 2), 1);
  if (t > W.only - 0.1 && t < B.dawn) bigText(g, s, 'ONLY PRISM EGGS!', 540, 1370, 76, CYAN, { k: pop(t, W.eats - 0.1, 0.2, 2.5), alpha: t > W.eats - 0.1 ? 1 : 0 });
  // Dawn.
  word(g, s, t, B.dawn + 0.1, 1.6, 'DAWN', '#ffcf9a', 150, 700);
  word(g, s, t, B.sparkle, 1.6, 'PRISM BEAST', CYAN, 110, 700, 0.04);
  word(g, s, t, B.egg, 1.4, '+1 PRISM EGG', '#c9a6ff', 100, 760);
  // Feeding.
  word(g, s, t, W.nom - 0.05, 0.8, 'NOM!', '#ffffff', 170, 900, 0.08);
  word(g, s, t, B.nothing + 0.2, Math.max(0.3, W.five - B.nothing - 0.45), '...', '#ffffff', 200, 900, 0);
  word(g, s, t, B.drop + 0.1, 1.2, 'PRISM CHEST!', CYAN, 120, 780);
  if (t > B.coins && t < B.maxLook) banner(g, s, t, B.coins, ['2X COINS', '15:00'], 660, { size: 100, colA: '#ffd23f', colB: '#ff9e3d', hold: 1.4 });
  // The Blade.
  if (t > B.blade && t < B.need) bigText(g, s, 'PRISM BLADE', 540, 700, 110, '#ffffff', { k: pop(t, B.blade, 0.2, 2) });
  if (t > B.pct && t < B.need) { const k = lerp(2.4, 1, easeOut(seg(t, B.pct, B.pct + 0.18))); bigText(g, s, '5%', 540, 920, 260, '#ffd23f', { k, rot: -0.12, alpha: seg(t, B.pct, B.pct + 0.08) }); }
  if (t > B.need + 0.1 && t < B.hopShot) bigText(g, s, 'NEED: LOTS OF EGGS', 540, 760, 86, '#ff9e80', { k: pop(t, B.need + 0.1, 0.2, 2) });
  // The walk.
  if (t > B.thirty && t < B.warn) pill(g, s, 640, 250, 'EVERY 30 MIN', 'rgba(20,120,170,.95)', '#ffffff', 36);
  word(g, s, t, B.thirty, 1.4, 'KITSUNE WALK', CYAN, 110, 720);
  if (t > B.passes && t < B.warn) bigText(g, s, 'BEASTS TURN PRISM!', 540, 720, 86, '#c9a6ff', { k: pop(t, B.passes, 0.2, 2) });
  // The Alpha.
  if (t > B.warn && t < B.lands) { const fl = Math.floor(t * 6) % 2; banner(g, s, t, B.warn, ['PRISM ALPHA', 'INCOMING'], 640, { colA: fl ? '#ff3b5e' : VIOLET, colB: fl ? VIOLET : '#ff3b5e' }); pill(g, s, 640, 250, 'EVERY HOUR', 'rgba(200,40,70,.95)', '#ffffff', 36); }
  if (t > B.lands + 0.2 && t < B.burst + 0.3) {
    const hp = t < B.fightA ? 1 : clamp(1 - (t - B.fightA) / (B.burst - B.fightA - 0.1)), w = 880, x0 = 100, y = 350;
    g.save(); roundRect(g, x0 * s, y * s, w * s, 64 * s, 20 * s); g.fillStyle = 'rgba(26,20,64,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffffff'; g.stroke();
    if (hp > 0) { roundRect(g, (x0 + 10) * s, (y + 10) * s, (w - 20) * hp * s, 44 * s, 14 * s); const gr = g.createLinearGradient(x0 * s, 0, (x0 + w) * s, 0); gr.addColorStop(0, hp < 0.3 ? '#ff3b5e' : CYAN); gr.addColorStop(1, hp < 0.3 ? '#ff8a3d' : VIOLET); g.fillStyle = gr; g.fill(); }
    g.font = `${40 * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(`PRISM ALPHA  ${Math.ceil(hp * 50000).toLocaleString('en-US')} HP`, 540 * s, (y + 34) * s); g.restore();
  }
  word(g, s, t, B.fightA + 0.2, 1.4, 'WHOLE SERVER!', '#ffffff', 110, 760);
  word(g, s, t, B.burst + 0.05, 1.2, 'POP!', '#c9a6ff', 190, 760, 0.06);
  // Eggs split.
  if (t > B.maxTwo + 0.2 && t < B.mia) { const p = project(max.root.position.clone().add(V(0, 7.3, 0)), s); if (p.on) bigText(g, s, 'x2', p.x / s, p.y / s, 90, '#ffffff', { k: pop(t, B.maxTwo + 0.2) }); }
  if (t > B.mia + 0.4 && t < B.maxFeed) { const p = project(mia.root.position.clone().add(V(0, 15.5, 0)), s); if (p.on) bigText(g, s, 'x11', p.x / s, p.y / s, 90, '#ffd23f', { k: pop(t, B.mia + 0.4) }); }
  // Max's chests and Mia's.
  if (t > B.train && t < B.again) banner(g, s, t, B.train, ['2X TRAINING'], 800, { size: 100, colA: '#3ddc84', colB: '#1f9e5a', hold: B.again - B.train });
  if (t > B.coins2 && t < B.miaFeed) banner(g, s, t, B.coins2, ['2X COINS'], 800, { size: 100, colA: '#ffd23f', colB: '#ff9e3d', hold: B.miaFeed - B.coins2 });
  if (t > B.rise + 0.3 && t < B.hurry) banner(g, s, t, B.rise + 0.3, ['PRISM BLADE!'], 700, { size: 110, hold: B.hurry - B.rise - 0.3 });
  // Deadline.
  if (t > B.friday && t < B.cta) { banner(g, s, t, B.friday, ['ENDS FRIDAY'], 640, { size: 120, colA: '#ff3b5e', colB: VIOLET }); }
  else if (t > B.hurry && t < B.cta) word(g, s, t, B.hurry, B.friday - B.hurry, 'HURRY!', '#ff6b78', 150, 640);
  // Call to action.
  if (t >= B.cta) {
    const a = t - B.cta, k2 = easeOutBack(clamp(a / 0.3), 1.8);
    g.save(); g.translate(540 * s, 560 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -250 * s, 880 * s, 500 * s, 46 * s); g.fillStyle = 'rgba(26,20,64,.93)'; g.fill(); g.lineWidth = 9 * s; const gr = g.createLinearGradient(-440 * s, 0, 440 * s, 0); gr.addColorStop(0, CYAN); gr.addColorStop(1, VIOLET); g.strokeStyle = gr; g.stroke();
    g.restore();
    bigText(g, s, 'PLAY HUNT FOR EGGS', 540, 430, 74, '#ffffff', { k: k2 });
    bigText(g, s, 'TODAY', 540, 515, 74, '#ffffff', { k: k2 });
    if (a > 0.15) { const k3 = easeOutBack(clamp((a - 0.15) / 0.3), 2); g.save(); g.translate(540 * s, 625 * s); g.scale(k3, k3); roundRect(g, -230 * s, -50 * s, 460 * s, 100 * s, 26 * s); const gg = g.createLinearGradient(-230 * s, 0, 230 * s, 0); gg.addColorStop(0, CYAN); gg.addColorStop(1, VIOLET); g.fillStyle = gg; g.fill(); g.restore(); bigText(g, s, 'LINK IN BIO', 540, 630, 66, '#ffffff', { k: k3 }); }
    bigText(g, s, '@viralrobloxgames', 540, 735, 52, CYAN, { k: k2 });
  }
  flash(g, s, (t >= B.land && t < B.land + 0.1) || (t >= B.lands && t < B.lands + 0.1) || (t >= B.burst && t < B.burst + 0.12) ? 0.5 : 0, '#ffffff');
  if (SHOT === 'hook' && t < B.land) speedLines(g, s, t, 0.35, { cx: 540, cy: 700 });
}

export const cast = () => ({ leo, max, mia, kit, blade });
