// He Won By Not Sleeping: sets, props and clothing shells built in code (no pack accessories). World layout (studs,
// floor y 0). Places are far apart so they never share a frame (the sky sphere follows the camera):
//   START    origin. A Sydney street: the start arch, barriers, shop fronts behind.
//   ROAD     (0, 0, -3000). A two-lane country highway along x (z 0), gum trees, km posts, the runners' camp of tents
//            on the verge (z -9) and a gum tree the farmer sleeps under.
//   FARM     (3000, 0, 0). A paddock with a fence and blocky sheep (the flashback).
//   FINISH   (-3000, 0, 0). A Melbourne street with the finish arch and tape.
// Every prop is built with its origin where it is held (see GRIP notes).
import * as THREE from 'three';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, transparent: !!o.transparent, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center', wgt = 800) => { g.font = `${wgt} ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

export const START = V(0, 0, 0), ROAD = V(0, 0, -3000), FARM = V(3000, 0, 0), FINISH = V(-3000, 0, 0);
export const TENT_X = (i) => -6 + i * 5.6, TENT_Z = -10;

// ======================================================= clothing ====================================================
// A clothing shell on the torso and upper arms (hands bare). Torso bone frame: centre (0, 1, 0), 2 x 2 x 1, hips y 0.
// `bib`: a race number on the chest. `straps`: overall straps. `legs`: trouser legs (overalls) on the leg bones,
// `boots`: boot boxes at the bottom of the legs.
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, bib = null, straps = null, legs = null, boots = null, collar = null } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (straps) for (const sx of [-0.55, 0.55]) { const s = box(0.3, 0.9, 1.16, std(straps, { roughness: 0.75 }), sx, 1.6, 0); actor.bones.Torso.add(s); parts.push(s); }
  if (straps) { const pocket = box(0.9, 0.6, 0.04, std(straps, { roughness: 0.75 }), 0, 1.2, 0.58); actor.bones.Torso.add(pocket); parts.push(pocket); }
  if (bib) { const b = label(1.1, 0.8, 220, 160, (x, W, H) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = '#d62828'; x.fillRect(0, 0, W, 26); LG(x, bib, W / 2, 96, 90, '#16182a'); }); b.position.set(0, 1.15, 0.565); actor.bones.Torso.add(b); parts.push(b); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  if (legs) for (const bone of ['Leg.L', 'Leg.R']) { const sx = bone === 'Leg.L' ? 0.5 : -0.5; const l = box(1.06, 1.5, 1.06, std(legs, { roughness: 0.8 }), sx, -0.55, 0); actor.bones[bone].add(l); parts.push(l); }
  if (boots) for (const bone of ['Leg.L', 'Leg.R']) { const sx = bone === 'Leg.L' ? 0.5 : -0.5; const b = box(1.1, 0.62, 1.2, std(boots, { roughness: 0.5 }), sx, -1.7, 0.05); actor.bones[bone].add(b); parts.push(b); }
  for (const p of parts) p.castShadow = true;
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}

// ======================================================= props =======================================================
// The starter's pistol. GRIP: origin in the fist, barrel along +y.
export function pistol() { const g = new THREE.Group(), m = std('#2a2d33', { metalness: 0.6, roughness: 0.4 }); g.add(box(0.25, 0.5, 0.3, m, 0, 0, 0), box(0.22, 0.9, 0.26, m, 0, 0.55, 0.15)); return g; }
// The giant cheque. Origin at its centre, front +z; held by both fists at the bottom corners.
export function cheque() {
  return label(4.4, 2.0, 660, 300, (x, W, H) => {
    x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, W, H); x.strokeStyle = '#1e9e55'; x.lineWidth = 12; x.strokeRect(6, 6, W - 12, H - 12);
    MS(x, 'PAY:  THE WINNER', 40, 60, 34, '#333', 'left'); LG(x, '$10,000', W / 2, 160, 110, '#1e9e55'); MS(x, 'TEN THOUSAND DOLLARS', W / 2, 250, 26, '#555');
  }, { side: THREE.DoubleSide });
}
// A wad of banknotes. GRIP: origin in the fist.
export function cash() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const n = box(1.0, 0.04, 0.5, std(['#3a9d5d', '#2f8a4f', '#46ab6b'][i], { roughness: 0.7 }), 0.25, 0.12 + i * 0.05, 0); n.rotation.y = (i - 1) * 0.15; g.add(n); } return g; }
// A tent (origin on the ground, door facing +z). `flap` opens.
export function tent(color = '#e76f51') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.8, side: THREE.DoubleSide });
  const shape = new THREE.Shape(); shape.moveTo(-2.4, 0); shape.lineTo(0, 3.2); shape.lineTo(2.4, 0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false }); geo.translate(0, 0, -2.5);
  const t = new THREE.Mesh(geo, m); t.castShadow = t.receiveShadow = true; g.add(t);
  const door = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-1.0, 0); s.lineTo(0, 1.9); s.lineTo(1.0, 0); s.closePath(); return s; })()), std('#2a2230', { side: THREE.DoubleSide }));
  door.position.z = 2.52; g.add(door);
  return g;
}
// A blocky sheep (origin on the ground, facing +z).
export function sheep() {
  const g = new THREE.Group(), wool = std('#f2efe6', { roughness: 0.95 }), blk = std('#2b2b2b', { roughness: 0.7 });
  g.add(box(2.0, 1.4, 2.8, wool, 0, 1.8, 0), box(0.9, 0.9, 0.9, blk, 0, 2.3, 1.7));
  for (const x of [-0.6, 0.6]) for (const z of [-0.9, 0.9]) g.add(box(0.35, 1.2, 0.35, blk, x, 0.6, z));
  g.add(box(0.06, 0.15, 0.06, std('#ffffff'), -0.2, 2.45, 2.16), box(0.06, 0.15, 0.06, std('#ffffff'), 0.2, 2.45, 2.16));
  return g;
}
// A gum tree (origin on the ground).
export function gumTree(seed = 1, h = 12) {
  const g = new THREE.Group(), r = rng(seed), bark = std('#d9d2c2', { roughness: 0.8 }), leaf = std('#7a9a6a', { roughness: 0.9 });
  const tr = cyl(0.45, 0.7, h, bark, 10, 0, h / 2, 0); tr.rotation.z = (r() - 0.5) * 0.2; g.add(tr);
  for (let i = 0; i < 5; i++) { const s = 2 + r() * 2.2; const b = sph(s, leaf, (r() - 0.5) * 5, h - 1 + r() * 3, (r() - 0.5) * 4, 10); b.scale.y = 0.6; g.add(b); }
  return g;
}

// ======================================================= sets ========================================================
function asphalt(seed = 3) { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = '#4a4b4f'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.06)`; x.fillRect(r() * w, r() * h, 3, 3); } }); }
function grassTex(a = '#7a9a4a', b = '#86a656') { return canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(0, i * 32, w, 32); } }); }
function arch(text, sub, colors) {
  const g = new THREE.Group(), m = std(colors[0], { roughness: 0.5 });
  for (const x of [-11, 11]) g.add(box(1.2, 11, 1.2, m, x, 5.5, 0));
  const b = label(23.2, 3.2, 1160, 160, (x, w, h) => { x.fillStyle = colors[0]; x.fillRect(0, 0, w, h); LG(x, text, w / 2, 70, 110, '#ffffff'); MS(x, sub, w / 2, 135, 34, colors[1]); });
  b.position.set(0, 11.6, 0.65); g.add(b); g.add(box(23.4, 3.4, 1.0, m, 0, 11.6, 0));
  return g;
}
function shopFronts(g, z, seed) {
  const r = rng(seed), cols = ['#e9c46a', '#f4a261', '#8ab17d', '#2a9d8f', '#e76f51', '#c9b28e'];
  for (let i = 0; i < 9; i++) { const w = 9, h = 10 + r() * 10, x = -40 + i * 10; g.add(box(w, h, 6, std(cols[i % cols.length], { roughness: 0.8 }), x, h / 2, z)); g.add(box(w - 2, 3, 0.2, std('#3b4a5c', { roughness: 0.15 }), x, 2.5, z + 3.05)); for (let j = 0; j < 2; j++) g.add(box(2, 2, 0.2, std('#3b4a5c', { roughness: 0.15 }), x - 2 + j * 4, 7.5, z + 3.05)); }
}
function crowdBarrier(g, x0, x1, z) { for (let x = x0; x <= x1; x += 4) { g.add(box(3.8, 0.25, 0.15, std('#c9ccd0', { metalness: 0.6 }), x + 2, 2.2, z)); g.add(box(0.15, 2.4, 0.15, std('#c9ccd0', { metalness: 0.6 }), x, 1.2, z)); } }

// ---------- the start in Sydney ----------
export function start(scene) {
  const g = new THREE.Group(); g.name = 'start'; g.position.copy(START); scene.add(g);
  g.add(flat(300, 300, std('#ffffff', { map: rep(asphalt(3), 30, 30), roughness: 0.9 }), 0, 0, 0));
  g.add(flat(30, 0.8, std('#ffffff'), 0, 0.02, 0.6));                                                  // the start line
  const a = arch('START', 'SYDNEY → MELBOURNE  ·  875 KM', ['#16304f', '#ffd23f']); a.position.set(0, 0, -0.4); a.rotation.y = Math.PI; g.add(a);
  const sh = new THREE.Group(); sh.rotation.y = Math.PI; g.add(sh); shopFronts(sh, -30, 4);
  for (const x of [-13, 13]) { const b = new THREE.Group(); b.position.x = x; b.rotation.y = Math.PI / 2; g.add(b); crowdBarrier(b, -12, 26, 0); }
  return { group: g };
}
// ---------- the highway, the camp ----------
export function road(scene) {
  const g = new THREE.Group(); g.name = 'road'; g.position.copy(ROAD); scene.add(g);
  g.add(flat(900, 600, std('#ffffff', { map: rep(grassTex('#9aa56a', '#a6b076'), 60, 40), roughness: 0.95 }), 0, 0, 0));
  g.add(flat(900, 10, std('#ffffff', { map: rep(asphalt(5), 90, 1), roughness: 0.85 }), 0, 0.02, 0));
  for (let x = -440; x < 440; x += 10) g.add(flat(4.5, 0.3, std('#f2f2f2'), x, 0.03, 0));
  for (const z of [-4.8, 4.8]) g.add(flat(900, 0.25, std('#f2f2f2'), 0, 0.03, z));
  const r = rng(7);
  for (let i = 0; i < 26; i++) { const t = gumTree(i + 3, 10 + r() * 6); t.position.set(-200 + i * 16 + r() * 6, 0, (i % 2 ? -1 : 1) * (16 + r() * 18)); g.add(t); }
  // km posts
  for (let i = 0; i < 6; i++) { const p = new THREE.Group(); p.position.set(-60 + i * 30, 0, 6.5); g.add(p); p.add(box(0.6, 2.4, 0.2, std('#ffffff'), 0, 1.2, 0)); p.add(label(0.56, 0.9, 64, 100, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#e9c46a'; x.fillRect(0, 0, w, 30); MS(x, String(612 - i), w / 2, 66, 26, '#16182a'); })).position.set(0, 1.8, 0.11); }
  // the camp: six tents on the verge, and the farmer's gum tree a little before them
  const tents = [];
  ['#e76f51', '#2a9d8f', '#e9c46a', '#8338ec', '#3a86ff', '#f4a261'].forEach((c, i) => { const t = tent(c); t.position.set(TENT_X(i), 0, TENT_Z); g.add(t); tents.push(t); });
  const camp = gumTree(99, 13); camp.position.set(-16, 0, -9.5); g.add(camp);
  for (let i = 0; i < 5; i++) { const c = cloud(30 + i, 18); c.position.set(-200 + i * 100, 80, -320); g.add(c); }
  return { group: g, tents };
}
// ---------- the farm (flashback) ----------
export function farm(scene) {
  const g = new THREE.Group(); g.name = 'farm'; g.position.copy(FARM); scene.add(g);
  g.add(flat(500, 500, std('#ffffff', { map: rep(grassTex('#6aa84f', '#74b35a'), 40, 40), roughness: 0.95 }), 0, 0, 0));
  for (let x = -60; x <= 60; x += 4) { g.add(box(0.3, 2.4, 0.3, std('#8a6a4a'), x, 1.2, -14)); }
  g.add(box(124, 0.2, 0.15, std('#8a6a4a'), 0, 2.0, -14), box(124, 0.2, 0.15, std('#8a6a4a'), 0, 1.1, -14));
  const barn = new THREE.Group(); barn.position.set(-26, 0, -30); g.add(barn); barn.add(box(16, 10, 12, std('#a33a2a'), 0, 5, 0));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 10, 5, 4, 1), std('#5f6b78')); roof.rotation.y = Math.PI / 4; roof.scale.set(1.1, 1, 0.85); roof.position.y = 12.5; barn.add(roof);
  for (let i = 0; i < 5; i++) { const t = gumTree(50 + i, 12); t.position.set(-40 + i * 22, 0, -40 - (i % 2) * 10); g.add(t); }
  for (let i = 0; i < 4; i++) { const c = cloud(60 + i, 16); c.position.set(-150 + i * 100, 80, -300); g.add(c); }
  return { group: g };
}
// ---------- the finish in Melbourne ----------
export function finish(scene) {
  const g = new THREE.Group(); g.name = 'finish'; g.position.copy(FINISH); scene.add(g);
  g.add(flat(300, 300, std('#ffffff', { map: rep(asphalt(9), 30, 30), roughness: 0.9 }), 0, 0, 0));
  const a = arch('FINISH', 'MELBOURNE', ['#c8202b', '#ffffff']); a.position.set(0, 0, -0.4); a.rotation.y = Math.PI; g.add(a);
  const chk = canvasTexture(64, 16, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); } });
  g.add(flat(22, 1.2, std('#ffffff', { map: rep(chk, 6, 1) }), 0, 0.02, -0.4));
  const sh = new THREE.Group(); sh.rotation.y = Math.PI; g.add(sh); shopFronts(sh, -30, 12);
  for (const x of [-13, 13]) { const b = new THREE.Group(); b.position.x = x; b.rotation.y = Math.PI / 2; g.add(b); crowdBarrier(b, -26, 12, 0); }
  // the tape: two halves that swing apart when broken
  const tape = new THREE.Group(); tape.position.set(0, 3.6, -0.4); g.add(tape);
  const tm = std('#ffd23f', { roughness: 0.5, side: THREE.DoubleSide });
  const L = new THREE.Group(), R = new THREE.Group(); L.position.x = -10.4; R.position.x = 10.4; tape.add(L, R);
  L.add(box(10.4, 0.25, 0.04, tm, 5.2, 0, 0)); R.add(box(10.4, 0.25, 0.04, tm, -5.2, 0, 0));
  // confetti specks (shown after the win)
  const conf = new THREE.Group(); g.add(conf); const r = rng(5);
  for (let i = 0; i < 120; i++) { const c = box(0.25, 0.25, 0.04, std(['#ff4d8d', '#ffd23f', '#3a86ff', '#06d6a0', '#ffffff'][i % 5], { roughness: 0.4 }), (r() - 0.5) * 30, r() * 14, (r() - 0.5) * 16); c.userData.v = [r(), r(), r()]; c.castShadow = false; conf.add(c); }
  return { group: g, tape: { L, R }, conf };
}
