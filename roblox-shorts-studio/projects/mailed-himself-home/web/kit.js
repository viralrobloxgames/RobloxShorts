// He Mailed Himself Home: sets, props and clothing shells built in code (no pack accessories, so the fit check has
// nothing to fit). World layout (studs, floor y 0). Places are far apart so they never share a frame:
//   GARAGE   origin. A London lock-up at night: brick walls, workbench, a bare bulb, the crate at the centre.
//   FIELD    (0, 0, -3000). An English athletics field under a grey sky: grass, a running track, a fence.
//   APRON    (400, 0, 0). An airport apron and runway with a 1960s four-engine jet, a cargo loader and a terminal.
//   SHED     (-400, 0, 0). The Perth cargo shed: corrugated walls, stacked freight, one door with daylight.
//   OUTBACK  (0, 0, 400). A red-dirt road across the outback.
//   HOME     (800, 0, 0). The family's house in Adelaide: porch, door, lawn, picket fence, birthday banner.
//   FLAT     (-800, 0, 0). The friend's London flat at night: a phone on a little table, a calendar, a window.
//   OFFICE   (0, 0, -800). The airline's cargo office: a desk, a wall poster, filing cabinets.
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

export const GARAGE = V(0, 0, 0), FIELD = V(0, 0, -3000), APRON = V(3000, 0, 0), SHED = V(-3000, 0, 0), OUTBACK = V(0, 0, 3000);
export const HOME = V(3000, 0, 3000), FLAT = V(-3000, 0, 3000), OFFICE = V(-3000, 0, -3000);

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, map = null, buttons = null, collar = null, tie = null, lapels = null } = {}) {
  const m = std(color, { roughness: 0.75, map }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 3; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, tie ? 0.38 : 0, 1.5 - i * 0.48 - hem * 0.2, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (lapels) { const s = box(0.7, 1.1, 0.04, std(lapels, { roughness: 0.6 }), 0, 1.45, 0.565); actor.bones.Torso.add(s); parts.push(s); }
  if (tie) { const k = box(0.22, 0.2, 0.06, std(tie, { roughness: 0.5 }), 0, 1.88, 0.6), b = box(0.3, 0.95, 0.05, std(tie, { roughness: 0.5 }), 0, 1.3, 0.6); actor.bones.Torso.add(k, b); parts.push(k, b); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  const k = actor.scale || 1;                          // a scaled actor (the daughter): scale the shell with her
  if (k !== 1) for (const p of parts) { p.scale.multiplyScalar(k); p.position.multiplyScalar(k); }
  for (const p of parts) p.castShadow = true;
  return { parts, material: m, set visible(v) { for (const p of parts) p.visible = v; } };
}
// A paper party hat (the birthday girl). Sits on the head bone: origin at the top of the head.
export function partyHat() {
  const g = new THREE.Group(), c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 20), std('#ff4d8d', { roughness: 0.5 }));
  c.position.y = 0.5; c.castShadow = true; g.add(c, sph(0.12, std('#ffd23f'), 0, 1.02, 0, 10));
  return g;
}

// ======================================================= the crate ===================================================
// The crate: 5.2 wide (x), 4.0 tall, 3.4 deep (z), origin at the bottom centre, front (+z) has the stencils. The front
// panel and the lid are separate groups so they can be hidden (the cut-away inside shots), lifted on or cut out.
// "THIS WAY UP" arrows point up the front. Labels: PAINT (front), the C.O.D. tag and the address card (left side).
export const CRATE = { w: 5.2, h: 4.0, d: 3.4, t: 0.16 };
function planks(w, h, seed, dark = false) {
  return canvasTexture(256, Math.round(256 * h / w), (x, W, H) => {
    const r = rng(seed); const n = 5;
    for (let i = 0; i < n; i++) { const c = (dark ? 120 : 176) + r() * 26; x.fillStyle = `rgb(${c},${c * 0.74 | 0},${c * 0.46 | 0})`; x.fillRect(0, i * H / n, W, H / n); x.fillStyle = 'rgba(60,35,15,.45)'; x.fillRect(0, i * H / n, W, 3); }
    for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(90,55,25,.18)'; x.beginPath(); const y = r() * H; x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y + 6, W * 0.6, y - 6, W, y + 2); x.stroke(); }
  });
}
export function crate() {
  const { w, h, d, t } = CRATE, g = new THREE.Group();
  const wood = (ww, hh, s) => std('#ffffff', { map: planks(ww, hh, s), roughness: 0.8 });
  const slat = std('#8a5a32', { roughness: 0.8 });
  g.add(box(w, t, d, wood(w, d, 1), 0, t / 2, 0));                               // floor
  g.add(box(w, h, t, wood(w, h, 2), 0, h / 2, -d / 2 + t / 2));                    // back
  const left = box(t, h, d, wood(d, h, 3), -w / 2 + t / 2, h / 2, 0), right = box(t, h, d, wood(d, h, 4), w / 2 - t / 2, h / 2, 0);
  g.add(left, right);
  // corner battens on the sides and back
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.26, h, 0.26, slat, sx * (w / 2 - 0.05), h / 2, sz * (d / 2 - 0.05)));
  // the front panel (stencilled)
  const front = new THREE.Group(); front.position.set(0, 0, d / 2 - t / 2); g.add(front);
  const fp = box(w - 0.1, h, t, wood(w, h, 5), 0, h / 2, 0); front.add(fp);
  for (const y of [0.25, h - 0.25]) front.add(box(w - 0.1, 0.3, 0.1, slat, 0, y, t / 2 + 0.03));
  const sten = label(3.4, 2.6, 512, 392, (x, W, H) => {
    x.clearRect(0, 0, W, H); x.globalAlpha = 0.86;
    LG(x, 'PAINT', W / 2, 110, 150, '#1b1b1b');
    x.font = '800 44px Montserrat'; x.textAlign = 'center'; x.fillStyle = '#1b1b1b'; x.fillText('THIS WAY UP', W / 2, 250);
    for (const ax of [70, W - 70]) { x.beginPath(); x.moveTo(ax, 190); x.lineTo(ax + 34, 250); x.lineTo(ax + 12, 250); x.lineTo(ax + 12, 330); x.lineTo(ax - 12, 330); x.lineTo(ax - 12, 250); x.lineTo(ax - 34, 250); x.closePath(); x.fill(); }
    x.font = '700 34px Montserrat'; x.fillText('FRAGILE  ·  HANDLE WITH CARE', W / 2, 345);
  }, { transparent: true, roughness: 0.85 });
  sten.position.set(0, h / 2 + 0.05, t / 2 + 0.005); front.add(sten);
  // the cut-out square (Perth): a separate piece of the front that falls out
  const lid = new THREE.Group(); lid.position.set(0, h, 0); g.add(lid);
  lid.add(box(w + 0.1, t, d + 0.1, wood(w, d, 6), 0, t / 2, 0), box(w + 0.1, 0.12, 0.3, slat, 0, t + 0.06, -d / 2 + 0.3), box(w + 0.1, 0.12, 0.3, slat, 0, t + 0.06, d / 2 - 0.3));
  // left side labels: red C.O.D. tag and the address card
  const tag = label(1.2, 0.8, 240, 160, (x, W, H) => { x.fillStyle = '#d62828'; x.fillRect(0, 0, W, H); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(10, 10, W - 20, H - 20); LG(x, 'C.O.D.', W / 2, H / 2 + 4, 76, '#ffffff'); });
  tag.position.set(-w / 2 - 0.005, h * 0.68, 0.6); tag.rotation.y = -Math.PI / 2; tag.rotation.z = 0.06; g.add(tag);
  const card = label(1.7, 1.1, 340, 220, (x, W, H) => { x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, W, H); MS(x, 'TO:', 22, 30, 26, '#333', 'left'); x.font = 'italic 600 30px "Playfair Display"'; x.fillStyle = '#1b2a6b'; x.textAlign = 'left'; x.fillText('Shoe Company', 30, 84); x.fillText('Perth', 30, 128); x.fillText('Western Australia', 30, 172); });
  card.position.set(-w / 2 - 0.005, h * 0.42, -0.55); card.rotation.y = -Math.PI / 2; g.add(card);
  g.userData = { front, lid, left, right, sten };
  return g;
}
// The front panel for the cut-out shot: the stencilled front with a square hole sawn into it; `plug` is the square.
export function cutFront() {
  const { w, h, t } = CRATE, g = new THREE.Group(), m = std('#ffffff', { map: planks(w, h, 5), roughness: 0.8 });
  const hx0 = -1.2, hx1 = 1.2, hy0 = 0.5, hy1 = 3.5;
  g.add(box(hx0 + w / 2 - 0.05, h, t, m, (-w / 2 + 0.05 + hx0) / 2, h / 2, 0), box(w / 2 - 0.05 - hx1, h, t, m, (w / 2 - 0.05 + hx1) / 2, h / 2, 0));
  g.add(box(hx1 - hx0, hy0, t, m, 0, hy0 / 2, 0), box(hx1 - hx0, h - hy1, t, m, 0, (h + hy1) / 2, 0));
  const plug = new THREE.Group(); plug.position.set(0, hy0, 0); g.add(plug);
  plug.add(box(hx1 - hx0 - 0.04, hy1 - hy0 - 0.04, t, m, 0, (hy1 - hy0) / 2, 0));
  const sten = label(1.7, 0.7, 340, 140, (x, W, H) => { x.clearRect(0, 0, W, H); x.globalAlpha = 0.86; LG(x, 'PAINT', W / 2, H / 2 + 6, 110, '#1b1b1b'); }, { transparent: true });
  sten.position.set(0, 1.5, t / 2 + 0.01); plug.add(sten);
  g.userData = { plug, hole: [hx0, hx1, hy0, hy1] };
  return g;
}

// ======================================================= props =======================================================
// A claw hammer. GRIP: origin in the fist, head up (+y), striking face toward +z.
export function hammer() {
  const g = new THREE.Group();
  g.add(cyl(0.07, 0.08, 1.3, std('#a0673a'), 8, 0, 0.35, 0));
  g.add(box(0.2, 0.22, 0.75, std('#3a3f48', { metalness: 0.8, roughness: 0.3 }), 0, 1.02, 0.05));
  return g;
}
// A torch (flashlight). GRIP: origin in the fist, beam along +y. `beam` is a spot light at the lens.
export function torch() {
  const g = new THREE.Group();
  g.add(cyl(0.11, 0.11, 0.8, std('#c1121f', { roughness: 0.4, metalness: 0.3 }), 12, 0, 0.1, 0), cyl(0.17, 0.12, 0.25, std('#c9ced6', { metalness: 0.8, roughness: 0.3 }), 14, 0, 0.6, 0));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), new THREE.MeshStandardMaterial({ color: '#fff6c8', emissive: '#fff1b0', emissiveIntensity: 3 })); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.73; g.add(lens);
  const beam = new THREE.SpotLight('#ffe9b0', 0, 14, 0.6, 0.6, 1.2); beam.position.y = 0.75; const tg = new THREE.Object3D(); tg.position.y = 5; g.add(beam, tg); beam.target = tg;
  g.userData.beam = beam;
  return g;
}
// A plastic bottle; `tag` text on its label ('WATER' or blank). Origin on the floor.
export function bottle(tag) {
  const g = new THREE.Group(), pm = new THREE.MeshStandardMaterial({ color: tag ? '#bfe6ff' : '#e9f2f5', roughness: 0.15, transparent: true, opacity: 0.75 });
  g.add(cyl(0.26, 0.26, 1.0, pm, 16, 0, 0.5, 0), cyl(0.12, 0.26, 0.25, pm, 16, 0, 1.12, 0), cyl(0.1, 0.1, 0.16, std(tag ? '#1d6fd1' : '#e63946'), 12, 0, 1.32, 0));
  if (tag) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.42, 16, 1, true), std('#ffffff', { map: canvasTexture(512, 64, (x, W, H) => { x.fillStyle = '#1d6fd1'; x.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) MS(x, tag, W * (i + 0.5) / 4, H / 2 + 2, 30, '#ffffff'); }) })); l.position.y = 0.5; g.add(l); }
  return g;
}
// Tinned food: a little stack of tins. Origin on the floor.
export function tins() {
  const g = new THREE.Group(), lab = ['#e63946', '#2a9d8f', '#f4a261'];
  [[0, 0, 0], [0.5, 0, 0.1], [0.25, 0.5, 0.05]].forEach(([x, y, z], i) => { g.add(cyl(0.22, 0.22, 0.48, std('#c9ced6', { metalness: 0.8, roughness: 0.3 }), 14, x, y + 0.24, z), cyl(0.225, 0.225, 0.3, std(lab[i], { roughness: 0.5 }), 14, x, y + 0.24, z)); });
  return g;
}
// A pillow. Origin at its centre.
export function pillow() { const m = box(1.6, 0.9, 0.45, std('#f4f2ec', { roughness: 0.95 })); m.geometry = new THREE.BoxGeometry(1.6, 0.9, 0.45, 6, 4, 2); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) * (1 - (x * x) / 1.0 - (y * y) / 0.4) * 1.2); } m.geometry.computeVertexNormals(); return m; }
// A blanket folded on the floor of the crate. Origin on the floor.
export function blanket() { const g = new THREE.Group(); g.add(box(1.6, 0.25, 1.2, std('#4a6fa5', { roughness: 0.95 }), 0, 0.125, 0)); return g; }
// A javelin. GRIP: origin in the fist (a little behind its middle), tip along +y.
export function javelin() {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.05, 7.0, std('#d9dde3', { metalness: 0.7, roughness: 0.3 }), 8, 0, 0.9, 0), cyl(0.0, 0.05, 0.5, std('#3a3f48', { metalness: 0.8 }), 8, 0, 4.65, 0), cyl(0.075, 0.075, 0.7, std('#2b2d42'), 8, 0, 0, 0));
  return g;
}
// A hand saw. GRIP: origin in the fist (handle), blade along +y.
export function saw() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.7, 0.45, std('#a0522d', { roughness: 0.5 }), 0, 0, 0));
  const blade = new THREE.Mesh(new THREE.BufferGeometry(), std('#c9ced6', { metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide }));
  const s = new THREE.Shape(); s.moveTo(-0.25, 0.3); s.lineTo(0.25, 0.3); s.lineTo(0.06, 2.3); s.lineTo(-0.25, 2.3); s.closePath();
  blade.geometry = new THREE.ShapeGeometry(s); blade.rotation.y = Math.PI / 2; blade.castShadow = true; g.add(blade);
  return g;
}
// A birthday cake with candles (flames emissive). Origin at its bottom centre.
export function cake() {
  const g = new THREE.Group();
  g.add(cyl(1.0, 1.0, 0.12, std('#f4f2ec', { roughness: 0.3 }), 24, 0, 0.06, 0), cyl(0.85, 0.85, 0.6, std('#ffd6e7', { roughness: 0.5 }), 24, 0, 0.42, 0), cyl(0.87, 0.87, 0.12, std('#ff4d8d', { roughness: 0.5 }), 24, 0, 0.7, 0));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45; g.add(cyl(0.04, 0.04, 0.35, std(['#3a86ff', '#ffbe0b', '#06d6a0', '#ff4d8d', '#8338ec'][i]), 6, x, 0.93, z)); const f = sph(0.06, std('#ffb000', { emissive: '#ffcc33', emissiveIntensity: 2.5 }), x, 1.15, z, 8); f.scale.y = 1.6; g.add(f); }
  return g;
}
// A rotary telephone on a little table; its handset is a separate group (`hand`) the friend lifts. Origin on the table top.
// GRIP (handset): origin in the fist, earpiece up (+y).
export function rotaryPhone() {
  const g = new THREE.Group(), blk = std('#16181f', { roughness: 0.35, metalness: 0.2 });
  const b = box(1.2, 0.5, 1.0, blk, 0, 0.25, 0); g.add(b);
  const dial = cyl(0.36, 0.36, 0.06, std('#e9e2cf', { roughness: 0.4 }), 20, 0, 0.42, 0.3); dial.rotation.x = 0.5; g.add(dial);
  const hand = new THREE.Group(); g.add(hand);
  hand.add(box(0.2, 1.3, 0.24, blk, 0, 0, 0), box(0.3, 0.3, 0.34, blk, 0, 0.62, 0.08), box(0.3, 0.3, 0.34, blk, 0, -0.62, 0.08));
  g.userData.hand = hand; g.userData.rest = { pos: V(0, 0.68, -0.05), rot: new THREE.Euler(0, 0, Math.PI / 2) };
  return g;
}
// A press camera with a flash dish. GRIP: origin in the fist (side handle), lens toward +z. `bulb` flashes.
export function pressCamera() {
  const g = new THREE.Group(), blk = std('#1d1f27', { roughness: 0.4 });
  g.add(box(0.8, 0.7, 0.55, blk, 0.45, 0.25, 0.1), cyl(0.18, 0.2, 0.35, std('#3a3f48'), 14, 0.45, 0.25, 0.5));
  g.children[1].rotation.x = Math.PI / 2;
  const dish = cyl(0.42, 0.12, 0.2, std('#d9dde3', { metalness: 0.9, roughness: 0.2 }), 18, 0.0, 1.0, 0.25); dish.rotation.x = Math.PI / 2; g.add(dish, box(0.1, 0.7, 0.1, blk, 0.0, 0.6, 0.15));
  const bulb = sph(0.13, new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0 }), 0.0, 1.0, 0.32, 10); g.add(bulb);
  g.userData.bulb = bulb;
  return g;
}
// A sheet of paper (the invoice), origin at its centre, facing +z. Two halves so it can be torn.
export function invoice() {
  const g = new THREE.Group(), tex = canvasTexture(240, 320, (x, W, H) => {
    x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, W, H); MS(x, 'AIR FREIGHT', W / 2, 30, 24, '#16182a'); x.fillStyle = '#16182a'; x.fillRect(16, 50, W - 32, 3);
    MS(x, '1 CRATE · PAINT', W / 2, 90, 18, '#333'); MS(x, 'LONDON → PERTH', W / 2, 124, 18, '#333');
    x.fillStyle = 'rgba(22,24,42,.25)'; for (let i = 0; i < 5; i++) x.fillRect(24, 156 + i * 18, W - 48, 6);
    MS(x, 'C.O.D.', W / 2, 270, 40, '#d62828');
  });
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(0.5, 1.4); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + (s > 0 ? 0.5 : 0));
    const h = new THREE.Mesh(geo, std('#ffffff', { map: tex, roughness: 0.8, side: THREE.DoubleSide })); h.position.x = s * 0.25; h.castShadow = true;
    const piv = new THREE.Group(); piv.add(h); g.add(piv); g.userData[s > 0 ? 'R' : 'L'] = piv;
  }
  return g;
}
// A newspaper, held open. GRIP: origin between the fists, front page facing +z.
export function newspaper(head = 'MAN POSTS HIMSELF HOME') {
  const g = new THREE.Group();
  const m = label(1.3, 1.7, 330, 430, (x, w, h) => {
    x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); x.font = '700 34px "Playfair Display"'; x.fillStyle = '#16182a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('THE DAILY NEWS', w / 2, 34); x.fillRect(16, 58, w - 32, 4);
    const words = head.split(' '); LG(x, words.slice(0, 2).join(' '), w / 2, 100, 44, '#b0121b'); LG(x, words.slice(2).join(' '), w / 2, 148, 44, '#b0121b');
    x.fillStyle = '#c8a46a'; x.fillRect(90, 186, 150, 120); x.fillStyle = '#7a4b2c'; x.fillRect(100, 196, 130, 100); x.fillStyle = 'rgba(22,24,42,.4)'; for (let i = 0; i < 8; i++) { x.fillRect(16, 186 + i * 28, 62, 6); x.fillRect(252, 186 + i * 28, 62, 6); }
    for (let i = 0; i < 3; i++) x.fillRect(16, 330 + i * 28, w - 32, 6);
  });
  const back = label(1.3, 1.7, 330, 430, (x, w, h) => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(22,24,42,.38)'; for (let c = 0; c < 3; c++) for (let i = 0; i < 18; i++) x.fillRect(18 + c * 104, 30 + i * 22, 90, 7); });
  back.rotation.y = Math.PI; back.position.z = -0.005; g.add(m, back); return g;
}
// A reporter's notebook. GRIP: origin in the fist.
export function notebook() { const g = new THREE.Group(); g.add(box(0.6, 0.85, 0.08, std('#2b2d42'), 0, 0.35, 0), box(0.54, 0.78, 0.02, std('#f6f1e4'), 0, 0.35, 0.05)); return g; }
// A rubber stamp. GRIP: origin in the fist, pad down (-y).
export function rubberStamp() { const g = new THREE.Group(); g.add(sph(0.2, std('#7a4b2c'), 0, 0.15, 0, 12), cyl(0.06, 0.06, 0.45, std('#7a4b2c'), 8, 0, -0.15, 0), box(0.6, 0.12, 0.4, std('#3a3f48'), 0, -0.42, 0), box(0.58, 0.04, 0.38, std('#d62828'), 0, -0.5, 0)); return g; }

// ======================================================= vehicles ====================================================
// A 1960s four-engine jet airliner (generic white and red livery, no airline's name). Nose toward +z, length ~64,
// wingspan ~60, wheels on y 0. userData: hold (the cargo door position, left side, behind the wing), body.
export function jet() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const white = std('#f2f4f7', { roughness: 0.35, metalness: 0.2 }), red = std('#c8202b', { roughness: 0.4 }), grey = std('#9aa3ad', { metalness: 0.6, roughness: 0.35 });
  const dark = std('#2a2d33', { roughness: 0.6 }), glass = std('#22344a', { roughness: 0.1, metalness: 0.4 });
  const Y = 7.2, R = 3.4;
  const fus = cyl(R, R, 46, white, 28, 0, Y, 0); fus.rotation.x = Math.PI / 2; body.add(fus);
  const nose = sph(R, white, 0, Y, 23, 28); nose.scale.set(1, 0.95, 2.2); body.add(nose);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(R, 0.6, 14, 28), white); tail.rotation.x = -Math.PI / 2; tail.position.set(0, Y + 0.9, -30); tail.castShadow = true; body.add(tail);
  // red cheatline and windows
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 52, 28, 1, true, Math.PI * 0.42, Math.PI * 0.16), red); band.rotation.x = Math.PI / 2; band.position.set(0, Y, -2); body.add(band);
  const band2 = band.clone(); band2.rotation.z = Math.PI; body.add(band2);
  for (const s of [-1, 1]) for (let i = 0; i < 16; i++) body.add(box(0.06, 0.55, 0.45, glass, s * (R + 0.02), Y + 1.2, 16 - i * 2.4));
  const cock = box(2.6, 0.7, 1.4, glass, 0, Y + 2.0, 26.8); cock.rotation.x = -0.45; body.add(cock);
  // swept wings with four engines
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(28, 0.7, 7.5), white); wing.castShadow = true;
    wing.position.set(s * 16, Y - 1.4, -2); wing.rotation.y = s * 0.5; body.add(wing);
    for (const k of [0.38, 0.78]) {
      const ex = s * (3 + 26 * k * Math.cos(0.5)), ez = -2 + 2.2 - 26 * k * Math.sin(0.5) * 0.9 + 6;
      const pod = cyl(1.1, 0.9, 5.4, grey, 16, ex, Y - 3.6, ez); pod.rotation.x = Math.PI / 2; body.add(pod);
      body.add(box(0.4, 1.6, 2.6, white, ex, Y - 2.4, ez - 0.5));
      const intake = new THREE.Mesh(new THREE.CircleGeometry(0.95, 16), dark); intake.position.set(ex, Y - 3.6, ez + 2.71); body.add(intake);
    }
  }
  // tail plane and fin (red)
  for (const s of [-1, 1]) { const tp = box(10, 0.45, 4, white, s * 5.5, Y + 1.6, -33); tp.rotation.y = s * 0.45; body.add(tp); }
  const fin = box(0.6, 10, 7, red, 0, Y + 6.5, -33); fin.rotation.x = -0.45; body.add(fin);
  // landing gear
  for (const s of [-1, 1]) { body.add(box(0.5, Y - 4, 0.5, dark, s * 5, (Y - 4) / 2 + 1.2, -3)); for (const dz of [-0.8, 0.8]) { const w = cyl(1.2, 1.2, 0.8, std('#1b1b1d', { roughness: 0.9 }), 16, s * 5, 1.2, -3 + dz); w.rotation.z = Math.PI / 2; body.add(w); } }
  body.add(box(0.4, Y - 3.5, 0.4, dark, 0, (Y - 3.5) / 2 + 0.9, 19)); { const w = cyl(0.9, 0.9, 0.7, std('#1b1b1d', { roughness: 0.9 }), 14, 0, 0.9, 19); w.rotation.z = Math.PI / 2; body.add(w); }
  // the cargo door (open hold) on the left side behind the wing
  const door = box(0.1, 3.0, 4.2, dark, -R - 0.02, Y - 1.2, -14); body.add(door);
  g.userData = { body, hold: V(-R - 0.2, Y - 2.7, -14), len: 64, span: 60, Y };
  return g;
}
// A cargo loader: a flat deck on scissor legs that lifts the crate up to the hold. Origin on the floor; deck top at
// deck.position.y + 0.3.
export function loader() {
  const g = new THREE.Group(), yel = std('#f2b705', { roughness: 0.5 }), dark = std('#2a2d33');
  g.add(box(6, 1.0, 5, yel, 0, 0.9, 0)); for (const x of [-2.2, 2.2]) for (const z of [-2, 2]) { const w = cyl(0.55, 0.55, 0.5, std('#1b1b1d'), 12, x, 0.55, z); w.rotation.z = Math.PI / 2; g.add(w); }
  const deck = new THREE.Group(); deck.position.y = 1.6; g.add(deck); deck.add(box(6.2, 0.3, 5.2, std('#5f6b78', { metalness: 0.5 }), 0, 0.15, 0));
  for (const x of [-2.6, 2.6]) deck.add(box(0.15, 0.8, 5.2, yel, x, 0.55, 0));
  const legs = []; for (const s of [-1, 1]) { const l = box(0.3, 1, 0.3, dark, 0, 0, s * 1.4); g.add(l); legs.push(l); }
  g.userData = { deck, legs };
  return g;
}
export function setLoader(L, h) { L.userData.deck.position.y = 1.6 + h; for (const l of L.userData.legs) { l.scale.y = Math.max(0.01, h + 0.3); l.position.y = 1.4 + (h + 0.3) / 2; } }
// A 1960s flatbed truck (cab at +x). Origin on the ground. The driver's window is open.
export function truck() {
  const g = new THREE.Group(), body = std('#2d6a9f', { roughness: 0.45 }), dark = std('#1e2226'), chrome = std('#c9ccd0', { metalness: 0.8, roughness: 0.3 });
  const glass = std('#a9cbe6', { roughness: 0.1, transparent: true, opacity: 0.35 });
  g.add(box(13, 0.8, 4.4, dark, 0, 1.4, 0));
  g.add(box(7.2, 0.4, 4.6, std('#8a5a32', { roughness: 0.8 }), -2.8, 2.0, 0));
  for (const z of [-2.2, 2.2]) g.add(box(7.2, 0.8, 0.15, std('#8a5a32'), -2.8, 2.6, z));
  g.add(box(3.6, 2.0, 4.4, body, 4.6, 2.6, 0), box(2.8, 2.4, 4.4, body, 2.2, 3.4, 0), box(2.8, 0.25, 4.6, body, 2.2, 4.7, 0));
  const ws = box(0.1, 1.4, 3.8, glass, 3.62, 3.9, 0); ws.castShadow = false; g.add(ws);
  g.add(box(0.2, 1.2, 3.6, chrome, 6.45, 2.4, 0), box(0.3, 0.4, 4.6, chrome, 6.5, 1.5, 0));
  for (const z of [-1.6, 1.6]) g.add(sph(0.3, std('#fff6d8', { emissive: '#fff1c0', emissiveIntensity: 0.6 }), 6.5, 2.9, z, 10));
  for (const x of [4.6, -4.2]) for (const z of [-2.2, 2.2]) { const w = cyl(1.0, 1.0, 0.8, std('#1b1b1d', { roughness: 0.9 }), 16, x, 1.0, z); w.rotation.x = Math.PI / 2; g.add(w); }
  return g;
}

// ======================================================= sets ========================================================
function brick(base = '#7a3b2a', seed = 2) { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = '#5a5248'; x.fillRect(0, 0, w, h); for (let j = 0; j < 16; j++) for (let i = -1; i < 5; i++) { const c = new THREE.Color(base).offsetHSL(0, 0, (r() - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(i * 64 + (j % 2) * 32 + 2, j * 16 + 2, 60, 12); } }); }
function concrete(base = '#8a8a86', seed = 3) { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.05)`; x.fillRect(r() * w, r() * h, 3, 3); } x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 2; x.strokeRect(0, 0, w, h); }); }

// ---------- the London lock-up (night) ----------
export const CRATE_AT = V(0, 0, 0);
export function garage(scene) {
  const g = new THREE.Group(); g.name = 'garage'; g.position.copy(GARAGE); scene.add(g);
  g.add(flat(40, 30, std('#ffffff', { map: rep(concrete('#77746d', 3), 6, 5), roughness: 0.85 }), 0, 0, 3));
  const bm = std('#ffffff', { map: rep(brick('#7a3b2a', 2), 6, 3), roughness: 0.9 });
  g.add(box(40, 14, 0.6, bm, 0, 7, -8.3), box(0.6, 14, 30, bm, -16, 7, 3), box(0.6, 14, 30, bm, 16, 7, 3));
  // workbench with tools, a tin of nails, planks
  const wood = std('#6e4526', { roughness: 0.6 });
  g.add(box(8, 0.35, 2.6, wood, -9, 3.0, -6.6)); for (const x of [-12.6, -5.4]) g.add(box(0.3, 3.0, 2.2, wood, x, 1.5, -6.6));
  g.add(cyl(0.35, 0.35, 0.55, std('#9aa0a8', { metalness: 0.7 }), 12, -7, 3.45, -6.4));
  for (let i = 0; i < 4; i++) { const p = box(0.5, 6.5, 0.18, std('#c8a46a', { roughness: 0.8 }), -13.5 + i * 0.6, 3.2, -7.7); p.rotation.z = 0.12; g.add(p); }
  // pegboard with tool shapes
  const peg = label(6, 3, 360, 180, (x, w, h) => { x.fillStyle = '#c9b48a'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(60,40,20,.5)'; for (let i = 0; i < 36; i++) for (let j = 0; j < 18; j++) x.fillRect(i * 10 + 4, j * 10 + 4, 2, 2); x.fillStyle = '#3a3f48'; x.fillRect(40, 40, 18, 100); x.fillRect(30, 40, 38, 20); x.fillRect(110, 30, 12, 110); x.fillRect(180, 40, 90, 14); x.fillRect(300, 50, 16, 80); });
  peg.position.set(-9, 6.5, -7.98); g.add(peg);
  // a garage roller door on the right (closed), a calendar on the wall
  const roll = label(9, 9, 256, 256, (x, w, h) => { x.fillStyle = '#5f6b78'; x.fillRect(0, 0, w, h); for (let i = 0; i < 24; i++) { x.fillStyle = i % 2 ? '#56616d' : '#6b7682'; x.fillRect(0, i * 11, w, 9); } });
  roll.position.set(15.65, 4.5, 2); roll.rotation.y = -Math.PI / 2; g.add(roll);
  const cal = label(2.2, 2.8, 220, 280, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8202b'; x.fillRect(0, 0, w, 60); MS(x, 'OCTOBER 1964', w / 2, 32, 22, '#ffffff'); x.fillStyle = '#333'; for (let i = 0; i < 31; i++) { MS(x, String(i + 1), 22 + (i % 7) * 30, 86 + Math.floor(i / 7) * 40, 16, i === 16 ? '#c8202b' : '#333', 'center', 700); } x.strokeStyle = '#c8202b'; x.lineWidth = 3; x.beginPath(); x.arc(22 + 2 * 30, 86 + 2 * 40, 15, 0, 7); x.stroke(); });
  cal.position.set(7, 7.2, -7.98); g.add(cal);
  // the bare bulb
  g.add(cyl(0.03, 0.03, 4, std('#111'), 6, 0, 12.5, 0.5), sph(0.35, std('#fff6d8', { emissive: '#ffe9b0', emissiveIntensity: 3 }), 0, 10.3, 0.5, 14));
  const lamp = new THREE.PointLight('#ffd9a0', 0, 36, 1.1); lamp.position.set(0, 10, 0.5); g.add(lamp);
  return { group: g, lamp };
}

// ---------- the athletics field ----------
export function field(scene) {
  const g = new THREE.Group(); g.name = 'field'; g.position.copy(FIELD); scene.add(g);
  const grass = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#4f8a3a' : '#5a9643'; x.fillRect(0, i * 32, w, 32); } });
  g.add(flat(300, 300, std('#ffffff', { map: rep(grass, 12, 12), roughness: 0.95 }), 0, 0, -60));
  const track = std('#b5483a', { roughness: 0.9 }); g.add(flat(300, 10, track, 0, 0.02, 14));
  for (let i = 0; i < 6; i++) g.add(flat(300, 0.12, std('#ffffff'), 0, 0.03, 9.3 + i * 1.6));
  // throwing arc lines and distance flags
  for (let i = 1; i <= 4; i++) { const f = new THREE.Group(); f.position.set(-8 + i * 0, 0, -18 * i); g.add(f); f.add(cyl(0.06, 0.06, 2.4, std('#ddd'), 6, 0, 1.2, 0)); const fl = box(0.8, 0.5, 0.04, std(['#ffbe0b', '#e63946', '#3a86ff', '#06d6a0'][i - 1]), 0.42, 2.2, 0); f.add(fl); }
  // fence and a little stand
  for (let x = -60; x <= 60; x += 3) g.add(box(0.2, 2.4, 0.2, std('#e9e2cf'), x, 1.2, 22));
  g.add(box(120, 0.2, 0.15, std('#e9e2cf'), 0, 2.2, 22), box(120, 0.2, 0.15, std('#e9e2cf'), 0, 1.2, 22));
  const stand = new THREE.Group(); stand.position.set(-30, 0, -40); g.add(stand);
  for (let i = 0; i < 4; i++) stand.add(box(30, 1.0, 2.4, std('#8a8f96'), 0, 0.5 + i, -i * 2.4));
  stand.add(box(32, 0.4, 12, std('#3a4a6a'), 0, 8, -4)); for (const x of [-15, 15]) stand.add(box(0.4, 8, 0.4, std('#3a4a6a'), x, 4, 1));
  for (let i = 0; i < 6; i++) { const c = cloud(40 + i, 14); c.position.set(-120 + i * 50, 70 + (i % 2) * 10, -260); c.material = c.material.clone(); c.material.color.set('#b9bec6'); g.add(c); }
  return { group: g };
}

// ---------- the airport apron ----------
// Runway along x at z -40; the apron in front (z -10..30); terminal at z 60 (its front faces -z, door at x 0).
export const TERMINAL_Z = 60;
export function apron(scene) {
  const g = new THREE.Group(); g.name = 'apron'; g.position.copy(APRON); scene.add(g);
  g.add(flat(800, 600, std('#ffffff', { map: rep(concrete('#8d8c88', 7), 60, 45), roughness: 0.9 }), 0, 0, 0));
  g.add(flat(800, 24, std('#4a4b4f', { roughness: 0.85 }), 0, 0.02, -40));
  for (let x = -380; x < 380; x += 16) g.add(flat(8, 0.6, std('#f2f2f2'), x, 0.03, -40));
  for (let x = -120; x < 120; x += 7) g.add(flat(0.5, 0.5, std('#ffd23f', { emissive: '#ffd23f', emissiveIntensity: 0.4 }), x, 0.03, -27.5));
  g.add(flat(0.4, 80, std('#ffd23f'), -40, 0.03, 10));
  // grass beyond the runway
  g.add(flat(800, 120, std('#6d8a4a', { roughness: 0.95 }), 0, 0.01, -120));
  // terminal (modern 1960s glass box), with a sign that each place swaps
  const term = new THREE.Group(); term.position.set(0, 0, TERMINAL_Z); g.add(term);
  term.add(box(90, 14, 16, std('#d9d4c7', { roughness: 0.8 }), 0, 7, 8), box(92, 1.2, 18, std('#e9e4d6'), 0, 14.6, 8));
  for (let x = -42; x <= 42; x += 4) term.add(box(3.6, 8, 0.2, std('#3b4a5c', { roughness: 0.15, metalness: 0.3 }), x, 6, -0.05));
  const doorM = std('#2b3a4a', { roughness: 0.1, metalness: 0.3, emissive: '#fff1c8', emissiveIntensity: 0.25 });
  term.add(box(8, 7, 0.3, doorM, 0, 3.5, -0.2));
  const tower = new THREE.Group(); tower.position.set(38, 0, 12); term.add(tower); tower.add(box(5, 26, 5, std('#d9d4c7'), 0, 13, 0), box(8, 4, 8, std('#3b4a5c', { roughness: 0.1 }), 0, 28, 0), box(9, 0.6, 9, std('#e9e4d6'), 0, 30.3, 0));
  const signs = {};
  for (const [k, txt] of [['london', 'LONDON AIRPORT'], ['bombay', 'BOMBAY · SANTACRUZ'], ['perth', 'PERTH AIRPORT']]) {
    const s = label(30, 3.2, 1500, 160, (x, w, h) => { x.fillStyle = '#16304f'; x.fillRect(0, 0, w, h); x.font = '800 110px Montserrat'; x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6); });
    s.position.set(0, 11.6, -0.4); term.add(s); signs[k] = s;
  }
  const exit = label(5, 1.4, 400, 112, (x, w, h) => { x.fillStyle = '#1e9e55'; x.fillRect(0, 0, w, h); LG(x, 'EXIT →', w / 2, h / 2 + 6, 84, '#ffffff'); }); exit.position.set(0, 7.9, -0.45); term.add(exit);
  // the freight shed beside the terminal (the Perth cargo shed is inside it)
  const shed = new THREE.Group(); shed.position.set(-70, 0, 40); g.add(shed);
  shed.add(box(30, 12, 22, std('#a7adb4', { metalness: 0.4, roughness: 0.5 }), 0, 6, 0)); const sl = label(16, 2, 800, 100, (x, w, h) => { x.fillStyle = '#c8202b'; x.fillRect(0, 0, w, h); MS(x, 'AIR FREIGHT', w / 2, h / 2 + 3, 64, '#ffffff'); }); sl.position.set(0, 10, -11.05); sl.rotation.y = Math.PI; shed.add(sl);
  // a guard hut by the exit
  const hut = new THREE.Group(); hut.position.set(8.6, 0, TERMINAL_Z - 4); g.add(hut);
  hut.add(box(3.4, 5.6, 3.4, std('#e9e4d6'), 0, 2.8, 0), box(3.0, 1.6, 0.1, std('#3b4a5c', { roughness: 0.1 }), 0, 3.8, -1.72), box(4, 0.4, 4, std('#16304f'), 0, 5.8, 0));
  return { group: g, signs, terminal: term };
}

// ---------- the Perth cargo shed (inside) ----------
export function shed(scene) {
  const g = new THREE.Group(); g.name = 'shed'; g.position.copy(SHED); scene.add(g);
  g.add(flat(40, 30, std('#ffffff', { map: rep(concrete('#6f6d68', 9), 6, 5), roughness: 0.9 }), 0, 0, 3));
  const corr = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#7d858e' : '#949ca5'; x.fillRect(i * 16, 0, 16, h); } });
  const cm = std('#ffffff', { map: rep(corr, 6, 1), roughness: 0.55, metalness: 0.4 });
  g.add(box(40, 16, 0.4, cm, 0, 8, -8.3), box(0.4, 16, 30, cm, -16, 8, 3), box(0.4, 16, 30, cm, 16, 8, 3));
  // stacked freight: boxes and sacks
  const r = rng(11), wood = std('#a87a4c', { roughness: 0.8 }), card = std('#c8a46a', { roughness: 0.9 });
  for (let i = 0; i < 14; i++) { const w = 2 + r() * 2.5, h = 1.5 + r() * 2, d = 2 + r() * 1.5; const x = -14 + (i % 7) * 4.2, z = -6 + Math.floor(i / 7) * 3.0; if (Math.abs(x) < 4 && z > -4) continue; g.add(box(w, h, d, i % 3 ? wood : card, x, h / 2, z)); if (i % 2) g.add(box(w * 0.8, h * 0.7, d * 0.8, card, x, h + h * 0.35, z)); }
  // the door on the right with daylight
  const day = new THREE.Mesh(new THREE.PlaneGeometry(6, 9), new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#fff1c8', emissiveIntensity: 1.6 })); day.position.set(15.75, 4.5, 4); day.rotation.y = -Math.PI / 2; g.add(day);
  const shaft = new THREE.SpotLight('#fff1c8', 0, 40, 0.5, 0.6, 1); shaft.position.set(15, 8, 4); shaft.target.position.set(0, 0, 3); g.add(shaft, shaft.target);
  const sign = label(5, 1, 500, 100, (x, w, h) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); MS(x, 'BOND STORE · PERTH', w / 2, h / 2 + 2, 40, '#16182a'); }); sign.position.set(0, 11, -8.05); g.add(sign);
  const lamp = new THREE.PointLight('#e8e4dc', 0, 34, 1.2); lamp.position.set(0, 12, 3); g.add(lamp);
  return { group: g, lamp, shaft };
}

// ---------- the outback road ----------
export function outback(scene) {
  const g = new THREE.Group(); g.name = 'outback'; g.position.copy(OUTBACK); scene.add(g);
  const dirt = canvasTexture(256, 256, (x, w, h) => { const r = rng(5); x.fillStyle = '#b8562d'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,200,150' : '90,30,10'},0.12)`; x.fillRect(r() * w, r() * h, 4, 4); } });
  g.add(flat(900, 900, std('#ffffff', { map: rep(dirt, 40, 40), roughness: 0.95 }), 0, 0, 0));
  g.add(flat(900, 10, std('#3d3b3a', { roughness: 0.9 }), 0, 0.03, 0));
  for (let x = -440; x < 440; x += 12) g.add(flat(5, 0.35, std('#f2f2f2'), x, 0.04, 0));
  const r = rng(9);
  for (let i = 0; i < 60; i++) { const x = (r() - 0.5) * 400, z = (r() > 0.5 ? 1 : -1) * (10 + r() * 140); const s = 0.8 + r() * 1.6; const b = sph(s, std(['#7a8a4a', '#8a9a5a', '#6a7a3a'][i % 3], { roughness: 0.9 }), x, s * 0.6, z, 10); b.scale.y = 0.6; g.add(b); }
  // a road sign
  const sg = new THREE.Group(); sg.position.set(16, 0, -8); g.add(sg); sg.add(cyl(0.12, 0.12, 6, std('#bbb'), 8, 0, 3, 0));
  const sl = label(5.6, 2.4, 560, 240, (x, w, h) => { x.fillStyle = '#1e7a3a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); MS(x, 'ADELAIDE', w / 2 - 20, 80, 64, '#ffffff'); MS(x, '2,700 km', w / 2, 170, 56, '#ffffff'); x.beginPath(); x.moveTo(w - 60, 60); x.lineTo(w - 24, 80); x.lineTo(w - 60, 100); x.fillStyle = '#fff'; x.fill(); });
  sl.position.set(0, 6.6, 0.15); sg.add(sl);
  for (let i = 0; i < 4; i++) { const c = cloud(70 + i, 16); c.position.set(-150 + i * 100, 90, -300); g.add(c); }
  return { group: g };
}

// ---------- the house in Adelaide ----------
// The front of the house faces +z; porch floor at y PORCH_Y, the door at x 0, z DOOR_Z.
export const PORCH_Y = 1.0, DOOR_Z = -3.0;
export function home(scene) {
  const g = new THREE.Group(); g.name = 'home'; g.position.copy(HOME); scene.add(g);
  const grass = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#6aa84f' : '#74b35a'; x.fillRect(0, i * 32, w, 32); } });
  g.add(flat(200, 160, std('#ffffff', { map: rep(grass, 10, 8), roughness: 0.95 }), 0, 0, 20));
  g.add(flat(4, 20, std('#c9c2b0', { roughness: 0.9 }), 0, 0.02, 7));
  const board = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#f2ead8' : '#e6dcc2'; x.fillRect(0, i * 16, w, 16); } });
  const wallM = std('#ffffff', { map: rep(board, 4, 2), roughness: 0.8 });
  g.add(box(30, 10, 14, wallM, 0, 5, -10));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 12, 6, 4, 1), std('#a33a2a', { roughness: 0.7 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1.8, 1, 0.9); roof.position.set(0, 13, -10); roof.castShadow = true; g.add(roof);
  // porch
  g.add(box(16, PORCH_Y, 5, std('#8a6a4a', { roughness: 0.8 }), 0, PORCH_Y / 2, -0.6));
  for (const x of [-7.6, 7.6]) g.add(box(0.4, 8, 0.4, std('#f4f2ec'), x, PORCH_Y + 4, 1.6));
  g.add(box(16.4, 0.5, 5.4, std('#f4f2ec'), 0, PORCH_Y + 8.2, -0.6));
  g.add(box(4, 0.5, 2, std('#8a6a4a'), 0, 0.25, 2.6));
  // door (hinged left) and windows
  const door = new THREE.Group(); door.position.set(-1.6, PORCH_Y, DOOR_Z + 0.05); g.add(door);
  door.add(box(3.2, 6.6, 0.25, std('#2d6a9f', { roughness: 0.5 }), 1.6, 3.3, 0), sph(0.16, std('#c9a03a', { metalness: 0.8 }), 2.8, 3.2, 0.2, 10));
  g.add(box(3.8, 0.4, 0.4, std('#f4f2ec'), 0, PORCH_Y + 6.8, DOOR_Z + 0.1));
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6.6), std('#5a3a22', { emissive: '#ffcc88', emissiveIntensity: 0.15 })); inside.position.set(0, PORCH_Y + 3.3, DOOR_Z - 0.1); g.add(inside);
  for (const x of [-9, 9]) { g.add(box(4.4, 3.6, 0.2, std('#3b4a5c', { roughness: 0.1, emissive: '#ffcc88', emissiveIntensity: 0.12 }), x, 5.6, -2.95)); g.add(box(5, 0.3, 0.5, std('#f4f2ec'), x, 3.7, -2.8)); }
  // picket fence along the front
  for (let x = -40; x <= 40; x += 1.4) if (Math.abs(x) > 2.4) g.add(box(0.4, 2.6, 0.2, std('#f4f2ec'), x, 1.3, 16));
  g.add(box(80, 0.25, 0.15, std('#f4f2ec'), 0, 1.9, 16.1));
  // birthday banner across the porch, balloons
  const banner = label(12, 1.4, 1200, 140, (x, w, h) => { x.clearRect(0, 0, w, h); const t = 'HAPPY BIRTHDAY!'; const cols = ['#ff4d8d', '#3a86ff', '#ffbe0b', '#06d6a0', '#8338ec']; for (let i = 0; i < t.length; i++) { const cx = 40 + i * (w - 80) / (t.length - 1); x.fillStyle = cols[i % 5]; x.beginPath(); x.moveTo(cx - 36, 10); x.lineTo(cx + 36, 10); x.lineTo(cx, 130); x.fill(); LG(x, t[i], cx, 52, 56, '#ffffff'); } }, { transparent: true });
  banner.position.set(0, PORCH_Y + 7.2, 1.75); g.add(banner);
  const balloons = new THREE.Group(); balloons.position.set(7.6, PORCH_Y + 6.5, 2.0); g.add(balloons);
  ['#ff4d8d', '#ffbe0b', '#3a86ff'].forEach((c, i) => { const b = sph(0.7, std(c, { roughness: 0.25 }), (i - 1) * 0.9, 1.4 + (i % 2) * 0.5, 0.3, 16); b.scale.y = 1.2; balloons.add(b); balloons.add(cyl(0.015, 0.015, 1.6, std('#ddd'), 4, (i - 1) * 0.45, 0.4, 0.15)); });
  // a little table on the porch for the cake
  g.add(box(2.6, 0.2, 1.8, std('#f4f2ec'), 4.6, PORCH_Y + 2.6, -0.4)); for (const dx of [-1.1, 1.1]) for (const dz of [-0.7, 0.7]) g.add(box(0.16, 2.6, 0.16, std('#f4f2ec'), 4.6 + dx, PORCH_Y + 1.3, -0.4 + dz));
  // a tree
  g.add(cyl(0.6, 0.8, 8, std('#6e4526'), 10, -16, 4, 6)); for (const [dx, dy, s] of [[0, 9, 4], [2, 8, 3], [-2, 8.5, 3.2]]) { const b = sph(s, std('#4f8a3a', { roughness: 0.9 }), -16 + dx, dy, 6, 14); g.add(b); }
  const sunL = new THREE.PointLight('#fff1d6', 0, 50, 1.0); sunL.position.set(0, PORCH_Y + 7.5, 2); g.add(sunL);
  return { group: g, door, porchLamp: sunL };
}
export const CAKE_AT = V(4.6, PORCH_Y + 2.7, -0.4);

// ---------- the friend's flat in London (night) ----------
export const PHONE_AT = V(2.6, 3.1, -2.0);
export function flatRoom(scene) {
  const g = new THREE.Group(); g.name = 'flat'; g.position.copy(FLAT); scene.add(g);
  const carpet = canvasTexture(128, 128, (x, w, h) => { x.fillStyle = '#6b3a3a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7d4848'; x.lineWidth = 6; for (let i = 0; i < 4; i++) x.strokeRect(i * 32 + 8, 8, 16, h - 16); });
  g.add(flat(30, 24, std('#ffffff', { map: rep(carpet, 6, 5), roughness: 0.95 }), 0, 0, 2));
  const paper = canvasTexture(128, 128, (x, w, h) => { x.fillStyle = '#c9b88a'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8a476'; for (let i = 0; i < 8; i++) x.fillRect(i * 16, 0, 6, h); });
  const wm = std('#ffffff', { map: rep(paper, 8, 4), roughness: 0.9 });
  g.add(box(30, 13, 0.6, wm, 0, 6.5, -6.3), box(0.6, 13, 24, wm, -12, 6.5, 2), box(0.6, 13, 24, wm, 12, 6.5, 2));
  // window onto London at night
  const win = label(5, 4.4, 300, 264, (x, w, h) => { x.fillStyle = '#0d1630'; x.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 9; i++) { const bx = i * 34, bh = 80 + r() * 120; x.fillStyle = '#1b2440'; x.fillRect(bx, h - bh, 30, bh); x.fillStyle = '#ffd98a'; for (let j = 0; j < 8; j++) if (r() > 0.55) x.fillRect(bx + 6 + (j % 2) * 12, h - bh + 10 + Math.floor(j / 2) * 22, 7, 10); } x.fillStyle = '#e6e9f0'; x.beginPath(); x.arc(240, 50, 22, 0, 7); x.fill(); x.strokeStyle = '#f4f2ec'; x.lineWidth = 12; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); }, { emissive: '#ffffff', emissiveIntensity: 0.2 });
  win.position.set(-5, 7.4, -5.98); g.add(win);
  // the phone table and an armchair
  const wood = std('#6e4526', { roughness: 0.55 });
  g.add(box(2.6, 0.2, 1.8, wood, PHONE_AT.x, PHONE_AT.y - 0.1, PHONE_AT.z)); for (const dx of [-1.1, 1.1]) for (const dz of [-0.7, 0.7]) g.add(box(0.16, 3.0, 0.16, wood, PHONE_AT.x + dx, 1.5, PHONE_AT.z + dz));
  const ch = new THREE.Group(); ch.position.set(-6, 0, -1.5); ch.rotation.y = 0.5; g.add(ch); const cm = std('#4a6a4a', { roughness: 0.9 });
  ch.add(box(3.2, 1.6, 3, cm, 0, 0.8, 0), box(3.2, 3.2, 0.8, cm, 0, 2.4, -1.2), box(0.7, 2.2, 3, cm, -1.6, 1.4, 0), box(0.7, 2.2, 3, cm, 1.6, 1.4, 0));
  // a calendar with days crossed off, a clock
  const cal = label(2.0, 2.6, 200, 260, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8202b'; x.fillRect(0, 0, w, 50); MS(x, 'OCTOBER', w / 2, 27, 26, '#ffffff'); for (let i = 0; i < 31; i++) { const cx = 18 + (i % 7) * 27, cy = 76 + Math.floor(i / 7) * 38; MS(x, String(i + 1), cx, cy, 15, '#333', 'center', 700); if (i >= 16 && i <= 21) { x.strokeStyle = '#c8202b'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 10, cy - 10); x.lineTo(cx + 10, cy + 10); x.moveTo(cx + 10, cy - 10); x.lineTo(cx - 10, cy + 10); x.stroke(); } } });
  cal.position.set(6.5, 7.0, -5.98); g.add(cal);
  const clock = new THREE.Group(); clock.position.set(2.6, 9.3, -5.95); g.add(clock);
  clock.add(cyl(0.9, 0.9, 0.15, std('#f4f2ec'), 24)); clock.children[0].rotation.x = Math.PI / 2;
  const hh = box(0.08, 0.5, 0.04, std('#111'), 0, 0.25, 0.1), mh = box(0.06, 0.75, 0.04, std('#111'), 0, 0.37, 0.12);
  const hp = new THREE.Group(), mp = new THREE.Group(); hp.add(hh); mp.add(mh); clock.add(hp, mp);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 30, 1.2); lamp.position.set(2, 9, 2); g.add(lamp);
  // standard lamp
  g.add(cyl(0.08, 0.08, 6, std('#333'), 6, 7.5, 3, -3.5)); const shade = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.0, 16, 1, true), std('#e9d9b0', { side: THREE.DoubleSide, emissive: '#ffcc88', emissiveIntensity: 0.4 })); shade.position.set(7.5, 6.3, -3.5); g.add(shade);
  return { group: g, lamp, clockHands: [hp, mp] };
}

// ---------- the airline's cargo office ----------
export const DESK_AT = V(0, 3.2, -1.6);
export function office(scene) {
  const g = new THREE.Group(); g.name = 'office'; g.position.copy(OFFICE); scene.add(g);
  g.add(flat(30, 24, std('#ffffff', { map: rep(concrete('#9aa3ad', 13), 6, 5), roughness: 0.6 }), 0, 0, 2));
  const wm = std('#e6e2d4', { roughness: 0.9 });
  g.add(box(30, 13, 0.6, wm, 0, 6.5, -7.3), box(0.6, 13, 24, wm, -12, 6.5, 2), box(0.6, 13, 24, wm, 12, 6.5, 2));
  g.add(box(30, 1.2, 0.7, std('#16304f'), 0, 0.6, -7.25));
  const wood = std('#6e4526', { roughness: 0.5 });
  g.add(box(7, 0.3, 3.0, wood, DESK_AT.x, DESK_AT.y - 0.15, DESK_AT.z), box(6.8, DESK_AT.y - 0.3, 0.2, wood, DESK_AT.x, (DESK_AT.y - 0.3) / 2, DESK_AT.z + 1.35));
  g.add(box(1.4, 0.5, 1.0, std('#f2ead8'), DESK_AT.x - 2.4, DESK_AT.y + 0.25, DESK_AT.z - 0.6), box(0.5, 0.9, 0.5, std('#16181f'), DESK_AT.x + 2.6, DESK_AT.y + 0.45, DESK_AT.z - 0.8));
  // a poster of the jet, filing cabinets, a wall sign
  const poster = label(5, 3.4, 400, 272, (x, w, h) => { const sk = x.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#3a86ff'); sk.addColorStop(1, '#bfe4ff'); x.fillStyle = sk; x.fillRect(0, 0, w, h); x.fillStyle = '#f2f4f7'; x.beginPath(); x.ellipse(200, 120, 150, 20, -0.12, 0, 7); x.fill(); x.beginPath(); x.moveTo(170, 120); x.lineTo(110, 190); x.lineTo(150, 190); x.lineTo(230, 120); x.fill(); x.fillStyle = '#c8202b'; x.beginPath(); x.moveTo(60, 135); x.lineTo(40, 70); x.lineTo(80, 128); x.fill(); MS(x, 'FLY THE WORLD', w / 2, 236, 34, '#ffffff'); });
  poster.position.set(-5, 7.5, -6.98); g.add(poster);
  for (const x of [6.5, 9.0]) { g.add(box(2.2, 5.4, 2.0, std('#7d858e', { metalness: 0.5, roughness: 0.4 }), x, 2.7, -5.8)); for (let i = 0; i < 3; i++) g.add(box(1.2, 0.2, 0.1, std('#c9ced6', { metalness: 0.8 }), x, 1.2 + i * 1.6, -4.78)); }
  const sign = label(6, 1.0, 600, 100, (x, w, h) => { x.fillStyle = '#16304f'; x.fillRect(0, 0, w, h); MS(x, 'CARGO ACCOUNTS', w / 2, h / 2 + 2, 52, '#ffffff'); }); sign.position.set(4, 10.5, -6.98); g.add(sign);
  const lamp = new THREE.PointLight('#f4f8ff', 0, 34, 1.0); lamp.position.set(0, 10, 2); g.add(lamp);
  return { group: g, lamp };
}
