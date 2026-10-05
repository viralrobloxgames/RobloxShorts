// He Stole The Mona Lisa: sets, props and clothing shells built in code (no pack accessories, so the fit check has
// nothing to fit). World layout (studs, floor y 0). Places are far apart so they never share a frame:
//   GALLERY  origin. The Salon Carre, 1911: dark red walls, gold frames, skylight. The Mona Lisa hangs on the back wall
//            (z -10) at x 0 on four iron pegs; benches at z 4. Also the 1911 flashback and the empty-wall queue.
//   STAIR    (200, 0, 0). The service staircase: a landing (y 7) on the right with student canvases, 14 steps down
//            toward -x, the locked service door on the back wall at the bottom (DOOR_X), bright street behind it.
//   FRONT    (0, 0, -300). The museum front: columns, arched windows, shut doors with a CLOSED sign.
//   OFFICE   (300, 0, 0). The police office: desk, hanging lamp, MISSING poster.
//   ATTIC    (-300, 0, 0). The thief's room: bed, window, the table with the hidden compartment under its top.
//   SHOP     (0, 0, 300). The Florence dealer's shop, 1913: ochre walls, arched window onto a red dome, counter, phone.
//   TODAY    (600, 0, 0). The Louvre today: the painting behind glass on a free-standing wall, a barrier, the crowd.
// Every prop is built with its origin where it is held (see GRIP notes) and its front facing +z.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };

export const GALLERY = V(0, 0, 0), STAIR = V(200, 0, 0), FRONT = V(0, 0, -300), OFFICE = V(300, 0, 0), ATTIC = V(-300, 0, 0), SHOP = V(0, 0, 300), TODAY = V(600, 0, 0);
export const ML_Y = 3.55, ML_Z = -9.55;                 // the Mona Lisa's centre on the gallery wall
export const LANDING_Y = 7, DOOR_X = -11;              // stair set (relative to STAIR)

// The public-domain painting (Leonardo, c. 1503-19; Wikimedia Commons C2RMF retouched scan), loaded once.
const ML_URL = new URL('./tex/mona_lisa.jpg', import.meta.url).href;
let ML_TEX = null, ML_IMG = null;
export async function loadMonaLisa() {
  if (ML_TEX) return { tex: ML_TEX, img: ML_IMG };
  ML_IMG = new Image(); ML_IMG.src = ML_URL; await ML_IMG.decode();
  ML_TEX = new THREE.Texture(ML_IMG); ML_TEX.colorSpace = THREE.SRGBColorSpace; ML_TEX.anisotropy = 8; ML_TEX.needsUpdate = true;
  return { tex: ML_TEX, img: ML_IMG };
}
export const monaImage = () => ML_IMG;

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0),
// 1 x 2 x 1, shoulder top +0.5, fist from -1.05 down. `hem` extends the shell below the hips (a smock or a coat).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, map = null, buttons = null, collar = null } = {}) {
  const m = std(color, { roughness: 0.75, map }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 4; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, 0, 1.75 - i * 0.48 - hem * 0.2, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, material: m, set visible(v) { for (const p of parts) p.visible = v; } };
}
// Blue and white stripes (the questioned artist's shirt).
export const stripes = () => { const t = canvasTexture(64, 64, (x, w, h) => { x.fillStyle = '#f5f5f0'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f3a8a'; for (let y = 0; y < h; y += 16) x.fillRect(0, y, w, 8); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t; };

// ======================================================= props =======================================================
// The Mona Lisa. `framed`: in its gold frame (2.4 x 3.2) or the bare poplar panel (1.9 x 2.75). Origin at the centre,
// image facing +z. GRIP: both fists on the side edges at mid-height.
export function monaLisa(tex, framed = true) {
  const g = new THREE.Group(), W = 1.9, H = 2.75;
  const img = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
  img.position.z = 0.101; g.add(img, box(W, H, 0.2, std('#8a6a3a', { roughness: 0.8 })));
  if (framed) {
    const gold = std('#c9a03a', { metalness: 0.75, roughness: 0.32 }), dark = std('#6e5420', { metalness: 0.6, roughness: 0.4 });
    for (const s of [-1, 1]) { g.add(box(0.26, H + 0.52, 0.34, gold, s * (W / 2 + 0.13), 0, 0.06), box(W + 0.52, 0.26, 0.34, gold, 0, s * (H / 2 + 0.13), 0.06)); }
    for (const s of [-1, 1]) { g.add(box(0.06, H + 0.1, 0.36, dark, s * (W / 2 + 0.02), 0, 0.07), box(W + 0.1, 0.06, 0.36, dark, 0, s * (H / 2 + 0.02), 0.07)); }
  }
  g.userData.w = framed ? W + 0.52 : W;
  return g;
}
// The empty gold frame and the glass case, as dumped on the staircase. Origin at the bottom centre, leaning back.
export function frameAndGlass() {
  const g = new THREE.Group(), W = 1.9, H = 2.75, gold = std('#c9a03a', { metalness: 0.75, roughness: 0.32 });
  const f = new THREE.Group(); f.position.y = (H + 0.52) / 2; g.add(f);
  for (const s of [-1, 1]) { f.add(box(0.26, H + 0.52, 0.34, gold, s * (W / 2 + 0.13), 0, 0), box(W + 0.52, 0.26, 0.34, gold, 0, s * (H / 2 + 0.13), 0)); }
  f.add(box(W, H, 0.04, std('#5a1a22', { roughness: 0.9 }), 0, 0, -0.1));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, H + 0.7, 0.5), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false }));
  glass.position.set(0.9, (H + 0.7) / 2, -0.5); glass.rotation.y = -0.35; glass.renderOrder = 3; g.add(glass);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }));
  edge.position.copy(glass.position); edge.rotation.copy(glass.rotation); g.add(edge);
  f.rotation.x = -0.18;
  return g;
}
// A plumber's wrench. GRIP: origin in the fist, jaw up.
export function wrench() {
  const g = new THREE.Group(), steel = std('#b8bec8', { metalness: 0.85, roughness: 0.3 });
  g.add(box(0.16, 1.3, 0.1, steel, 0, 0.3, 0));
  const jaw = box(0.5, 0.22, 0.12, steel, 0.12, 1.0, 0); g.add(jaw, box(0.14, 0.32, 0.12, steel, 0.3, 1.18, 0), box(0.14, 0.28, 0.12, steel, -0.08, 1.16, 0));
  return g;
}
// A red metal toolbox. GRIP: origin at the handle (the box hangs below the fist).
export function toolbox() {
  const g = new THREE.Group(), red = std('#c1121f', { metalness: 0.3, roughness: 0.4 });
  g.add(box(1.4, 0.6, 0.6, red, 0, -0.55, 0), box(1.42, 0.08, 0.62, std('#7a0a12'), 0, -0.28, 0));
  g.add(box(0.08, 0.2, 0.08, std('#222'), -0.35, -0.12, 0), box(0.08, 0.2, 0.08, std('#222'), 0.35, -0.12, 0), box(0.78, 0.07, 0.1, std('#222'), 0, -0.02, 0));
  return g;
}
// A big iron key. GRIP: origin in the fist (bow), blade forward along +z.
export function ironKey() {
  const g = new THREE.Group(), iron = std('#4a4f5c', { metalness: 0.8, roughness: 0.35 });
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 18), iron); bow.castShadow = true; g.add(bow);
  const blade = box(0.07, 0.07, 0.75, iron, 0, 0, 0.5); g.add(blade, box(0.07, 0.18, 0.1, iron, 0, -0.08, 0.8), box(0.07, 0.12, 0.08, iron, 0, -0.06, 0.66));
  return g;
}
// The artist's brush and palette. GRIP: brush origin in the fist, tip up; palette origin at the thumb hole.
export function brush() {
  const g = new THREE.Group();
  g.add(cyl(0.04, 0.05, 1.1, std('#7a4b2c'), 8, 0, 0.3, 0), cyl(0.05, 0.05, 0.14, std('#c9ced6', { metalness: 0.8 }), 8, 0, 0.9, 0), cyl(0.06, 0.02, 0.2, std('#d7262e'), 8, 0, 1.06, 0));
  return g;
}
export function palette() {
  const g = new THREE.Group(), s = new THREE.Shape(); s.absellipse(0, 0, 0.75, 0.52, 0, Math.PI * 2);
  const hole = new THREE.Path(); hole.absarc(-0.42, -0.1, 0.1, 0, Math.PI * 2, true); s.holes.push(hole);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }), std('#c79a62', { roughness: 0.6 })); m.position.set(0.42, 0.1, 0); m.castShadow = true; g.add(m);
  ['#d7262e', '#ffd23f', '#3a86ff', '#2a9d8f', '#ffffff'].forEach((c, i) => { const d = sph(0.08, std(c, { roughness: 0.3 }), 0.42 + Math.cos(i * 0.9 + 0.5) * 0.45, 0.1 + Math.sin(i * 0.9 + 0.5) * 0.3, 0.07, 10); d.scale.z = 0.4; g.add(d); });
  return g;
}
// A wooden easel with a blank canvas, standing on the floor. Origin on the floor, canvas facing +z.
export function easel() {
  const g = new THREE.Group(), wood = std('#a0673a', { roughness: 0.6 });
  for (const s of [-1, 1]) { const l = box(0.14, 5.0, 0.14, wood, s * 0.75, 2.4, 0); l.rotation.z = s * 0.1; g.add(l); }
  const b = box(0.14, 4.8, 0.14, wood, 0, 2.3, -0.9); b.rotation.x = -0.25; g.add(b);
  g.add(box(2.0, 0.14, 0.3, wood, 0, 2.0, 0.08), box(1.8, 2.3, 0.08, std('#f6f1e4', { roughness: 0.9 }), 0, 3.2, 0.14));
  return g;
}
// A notebook and pencil (the detective). GRIP: origin in the fist.
export function notebook() {
  const g = new THREE.Group(); g.add(box(0.7, 0.95, 0.08, std('#2b2d42'), 0, 0.4, 0), box(0.62, 0.86, 0.02, std('#f6f1e4'), 0, 0.4, 0.05)); return g;
}
export function pencil() { const g = new THREE.Group(); g.add(cyl(0.04, 0.04, 0.8, std('#ffbe0b'), 6, 0, 0.25, 0), cyl(0.0, 0.04, 0.12, std('#2b2d42'), 6, 0, -0.21, 0)); g.children[1].rotation.x = Math.PI; return g; }
// A magnifying glass. GRIP: origin in the fist, lens up.
export function magnifier() {
  const g = new THREE.Group(); g.add(cyl(0.06, 0.07, 0.8, std('#1d1f27'), 10, 0, 0.2, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 10, 28), std('#c9a03a', { metalness: 0.8, roughness: 0.3 })); ring.position.y = 0.95; ring.castShadow = true; g.add(ring);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.33, 28), new THREE.MeshStandardMaterial({ color: '#cfefff', transparent: true, opacity: 0.35, roughness: 0.02, side: THREE.DoubleSide, depthWrite: false })); lens.position.y = 0.95; g.add(lens);
  return g;
}
// A candlestick telephone on the counter; its earpiece is a separate group (`ear`) that the dealer lifts.
// Origin on the counter top. GRIP (earpiece): origin in the fist.
export function candlestickPhone() {
  const g = new THREE.Group(), blk = std('#16181f', { roughness: 0.35, metalness: 0.4 }), brass = std('#c9a03a', { metalness: 0.75, roughness: 0.3 });
  g.add(cyl(0.32, 0.38, 0.14, blk, 18, 0, 0.07, 0), cyl(0.07, 0.07, 1.25, blk, 10, 0, 0.75, 0), cyl(0.18, 0.12, 0.26, blk, 14, 0, 1.4, 0.0));
  const mouth = cyl(0.16, 0.1, 0.18, blk, 14, 0, 1.42, 0.14); mouth.rotation.x = Math.PI / 2; g.add(mouth);
  g.add(box(0.06, 0.24, 0.06, brass, 0.14, 1.0, 0), box(0.18, 0.04, 0.06, brass, 0.2, 1.12, 0));
  const ear = new THREE.Group(); g.add(ear);
  ear.add(cyl(0.06, 0.06, 0.5, blk, 10, 0, 0.0, 0), cyl(0.13, 0.08, 0.16, blk, 14, 0, 0.32, 0));
  g.userData.ear = ear; g.userData.rest = V(0.26, 1.0, 0);
  return g;
}
// A wooden trunk with brass corners. Carried on the forearms: origin at the bottom centre, front +z. 2.0 wide.
export function trunk() {
  const g = new THREE.Group(), wood = std('#7a4b2c', { roughness: 0.6 }), brass = std('#c9a03a', { metalness: 0.7, roughness: 0.35 });
  g.add(box(2.0, 1.0, 1.1, wood, 0, 0.5, 0), box(2.04, 0.08, 1.14, brass, 0, 0.22, 0), box(2.04, 0.08, 1.14, brass, 0, 0.82, 0));
  g.add(box(0.2, 0.26, 0.06, brass, 0, 0.72, 0.57));
  return g;
}
// A modern phone held up to film (pack phone shape, built here so it can be instanced). GRIP: origin in the fist.
export function smartphone() {
  const g = new THREE.Group(); g.add(box(0.5, 0.95, 0.08, std('#16181f', { roughness: 0.3 }), 0, 0.42, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.86), new THREE.MeshStandardMaterial({ color: '#9fd0f5', emissive: '#6fb3ff', emissiveIntensity: 0.6 })); scr.position.set(0, 0.42, -0.045); scr.rotation.y = Math.PI; g.add(scr);
  return g;
}
// A folded newspaper (for the reopening: visitors hold one). GRIP: origin in the fist.
export function newspaper(img) {
  const g = new THREE.Group();
  const m = label(1.1, 1.5, 330, 450, (x, w, h) => {
    x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); LG(x, 'LE JOURNAL', w / 2, 40, 44, '#16182a'); x.fillStyle = '#16182a'; x.fillRect(16, 66, w - 32, 4);
    LG(x, 'STOLEN!', w / 2, 112, 60, '#b0121b'); if (img) x.drawImage(img, 85, 150, 160, 238);
    x.fillStyle = 'rgba(22,24,42,.4)'; for (let i = 0; i < 6; i++) { x.fillRect(16, 160 + i * 40, 58, 6); x.fillRect(256, 160 + i * 40, 58, 6); }
  });
  const back = label(1.1, 1.5, 330, 450, (x, w, h) => { x.fillStyle = '#efe6d2'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(22,24,42,.38)'; for (let c = 0; c < 3; c++) for (let i = 0; i < 18; i++) x.fillRect(18 + c * 104, 30 + i * 23, 90, 7); });
  back.rotation.y = Math.PI; back.position.set(0, 0.6, -0.005); m.position.y = 0.6; g.add(m, back); return g;
}

// ======================================================= sets ========================================================
function parquet() { const t = canvasTexture(256, 256, (x, w, h) => { const r = rng(4); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const c = 120 + r() * 30; x.fillStyle = `rgb(${c},${c * 0.62 | 0},${c * 0.36 | 0})`; x.fillRect(j * 64 + (i % 2) * 32 - 32, i * 32, 64, 32); x.fillRect(j * 64 + (i % 2) * 32 + 32, i * 32, 64, 32); x.strokeStyle = 'rgba(40,20,8,.35)'; x.strokeRect(j * 64 + (i % 2) * 32 - 32, i * 32, 64, 32); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function stone(base = '#9a978f', seed = 2) { const t = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rng(seed); x.strokeStyle = 'rgba(40,40,40,.25)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); for (let j = 0; j < 3; j++) { const xx = (j * 96 + (i % 2) * 48) % w; x.beginPath(); x.moveTo(xx, i * 64); x.lineTo(xx, i * 64 + 64); x.stroke(); } } for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.05)`; x.fillRect(r() * w, r() * h, 3, 3); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
// A generic painting in a gold frame (landscape / portrait / still life drawn on a canvas), origin at its centre.
function painting(w, h, seed, kind) {
  const g = new THREE.Group(), r = rng(seed);
  const pic = label(w, h, 256, Math.round(256 * h / w), (x, W, H) => {
    if (kind === 'land') { const sky = x.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7fa7c9'); sky.addColorStop(0.55, '#e6d8b0'); sky.addColorStop(0.56, '#5b7a3a'); sky.addColorStop(1, '#2f4a22'); x.fillStyle = sky; x.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(30,60,25,.8)`; x.beginPath(); x.arc(r() * W, H * 0.55, 10 + r() * 30, Math.PI, 0); x.fill(); } }
    else if (kind === 'sea') { x.fillStyle = '#9db7c9'; x.fillRect(0, 0, W, H * 0.5); x.fillStyle = '#2e5b78'; x.fillRect(0, H * 0.5, W, H); x.fillStyle = '#f2efe6'; x.beginPath(); x.moveTo(W * 0.4, H * 0.5); x.lineTo(W * 0.5, H * 0.15); x.lineTo(W * 0.6, H * 0.5); x.fill(); x.fillStyle = '#5a3a22'; x.fillRect(W * 0.35, H * 0.5, W * 0.3, H * 0.06); }
    else if (kind === 'fruit') { x.fillStyle = '#3a2a1e'; x.fillRect(0, 0, W, H); x.fillStyle = '#7a5a3a'; x.fillRect(0, H * 0.65, W, H); [['#c1121f', 0.35], ['#e9c46a', 0.5], ['#6a994e', 0.62], ['#c1121f', 0.45]].forEach(([c, u], i) => { x.fillStyle = c; x.beginPath(); x.arc(W * u, H * 0.62 - (i === 3 ? 25 : 0), 22, 0, 7); x.fill(); }); }
    else { x.fillStyle = '#2e2a24'; x.fillRect(0, 0, W, H); x.fillStyle = '#d7b48a'; x.beginPath(); x.ellipse(W / 2, H * 0.38, W * 0.17, H * 0.14, 0, 0, 7); x.fill(); x.fillStyle = ['#5a1a22', '#1f3a5a', '#3a4a22'][seed % 3]; x.beginPath(); x.moveTo(W * 0.15, H); x.quadraticCurveTo(W / 2, H * 0.35, W * 0.85, H); x.fill(); x.fillStyle = '#3a2416'; x.beginPath(); x.ellipse(W / 2, H * 0.3, W * 0.19, H * 0.12, 0, Math.PI, 0); x.fill(); }
  }, { roughness: 0.6 });
  pic.position.z = 0.09; g.add(pic);
  const gold = std('#c9a03a', { metalness: 0.75, roughness: 0.35 }), fw = 0.28;
  for (const s of [-1, 1]) { g.add(box(fw, h + 2 * fw, 0.22, gold, s * (w / 2 + fw / 2), 0, 0.04), box(w + 2 * fw, fw, 0.22, gold, 0, s * (h / 2 + fw / 2), 0.04)); }
  return g;
}
function bench(m) { const g = new THREE.Group(); g.add(box(4.2, 0.5, 1.4, m, 0, 1.25, 0)); for (const x of [-1.8, 1.8]) for (const z of [-0.5, 0.5]) g.add(box(0.18, 1.0, 0.18, std('#3a2416'), x, 0.5, z)); return g; }

// ---------- the gallery (Salon Carre) ----------
export const PEGS = [[-1.0, ML_Y - 1.25], [1.0, ML_Y - 1.25], [-1.0, ML_Y + 1.25], [1.0, ML_Y + 1.25]];
export function gallery(scene) {
  const g = new THREE.Group(); g.name = 'gallery'; g.position.copy(GALLERY); scene.add(g);
  const pt = parquet(); pt.repeat.set(9, 7);
  g.add(flat(40, 30, std('#ffffff', { map: pt, roughness: 0.45, metalness: 0.05 }), 0, 0, 3));
  const wallM = std('#5e1c26', { roughness: 0.9 }), dado = std('#3a1418', { roughness: 0.7 }), cream = std('#efe4cc', { roughness: 0.7 }), gold = std('#c9a03a', { metalness: 0.6, roughness: 0.4 });
  g.add(box(40, 15, 0.6, wallM, 0, 7.5, -10.3), box(0.6, 15, 30, wallM, -19.7, 7.5, 3), box(0.6, 15, 30, wallM, 19.7, 7.5, 3));
  g.add(box(40, 1.2, 0.7, dado, 0, 0.6, -10.25), box(0.7, 1.2, 30, dado, -19.6, 0.6, 3), box(0.7, 1.2, 30, dado, 19.6, 0.6, 3));
  g.add(box(40, 1.4, 1.2, cream, 0, 15.2, -10), box(1.2, 1.4, 30, cream, -19.4, 15.2, 3), box(1.2, 1.4, 30, cream, 19.4, 15.2, 3));
  g.add(box(40, 0.15, 0.75, gold, 0, 14.45, -9.95));
  // the skylight ceiling: a bright frosted panel
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), new THREE.MeshStandardMaterial({ color: '#fff8e8', emissive: '#fff4dc', emissiveIntensity: 0.45 })); sky.rotation.x = Math.PI / 2; sky.position.set(0, 16, 2); g.add(sky);
  // paintings: the back wall around the Mona Lisa, then the side walls
  const P = [[-6.5, 6.0, 4.2, 3.2, 3, 'land'], [6.5, 6.0, 4.2, 3.2, 5, 'sea'], [-13.5, 6.8, 5.0, 6.2, 7, 'port'], [13.5, 6.8, 5.0, 6.2, 8, 'port'], [-6.5, 11.4, 3.0, 2.4, 11, 'fruit'], [6.5, 11.4, 3.0, 2.4, 12, 'land'], [0, 11.6, 4.6, 2.6, 14, 'land']];
  for (const [x, y, w, h, s, k] of P) { const p = painting(w, h, s, k); p.position.set(x, y, -9.95); g.add(p); }
  for (const [z, s, k] of [[-4, 21, 'port'], [3.5, 22, 'land'], [11, 23, 'fruit']]) for (const side of [-1, 1]) { const p = painting(4.4, 3.6, s + side, k); p.position.set(side * 19.35, 6.4, z); p.rotation.y = -side * Math.PI / 2; g.add(p); }
  // the four iron pegs (visible only once the painting is gone)
  const iron = std('#2a2c33', { metalness: 0.7, roughness: 0.4 }), pegs = new THREE.Group(); g.add(pegs);
  for (const [x, y] of PEGS) { const p = cyl(0.09, 0.09, 0.45, iron, 10, x, y, -9.78); p.rotation.x = Math.PI / 2; pegs.add(p); const hd = cyl(0.14, 0.14, 0.06, iron, 12, x, y, -9.56); hd.rotation.x = Math.PI / 2; pegs.add(hd); }
  // a paler patch of wall where the painting hung (the wall darkened around it)
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 3.22), std('#8e3540', { roughness: 0.85 })); ghost.position.set(0, ML_Y, -9.99); g.add(ghost);
  const plate = label(1.5, 0.36, 300, 72, (x, w, h) => { x.fillStyle = '#c9a03a'; x.fillRect(0, 0, w, h); MS(x, 'LA JOCONDE', w / 2, h / 2 + 2, 30, '#2a1a08'); }, { metalness: 0.5, roughness: 0.4 });
  plate.position.set(0, ML_Y - 2.2, -9.98); g.add(plate);
  const bm = std('#5a1a22', { roughness: 0.9 });
  for (const x of [-8, 8]) { const b = bench(bm); b.position.set(x, 0, 4); g.add(b); }
  // a doorway on the right wall (to the service corridor)
  g.add(box(0.7, 7.2, 4.0, std('#2a1a12'), 19.45, 3.6, -3));
  const lamp = new THREE.PointLight('#fff1d6', 0, 60, 1.0); lamp.position.set(0, 13, 4); g.add(lamp);
  const wash = new THREE.SpotLight('#fff4e0', 0, 50, 0.6, 0.7, 1); wash.position.set(0, 13.5, 6); wash.target.position.set(0, 5, -10); g.add(wash, wash.target);
  return { group: g, pegs, ghost, lamp, wash };
}

// ---------- the service staircase ----------
export function stair(scene) {
  const g = new THREE.Group(); g.name = 'stair'; g.position.copy(STAIR); scene.add(g);
  const st = stone('#a9a59a', 3); st.repeat.set(6, 2);
  const wallM = std('#ffffff', { map: st, roughness: 0.9 }), stepM = std('#8a857a', { roughness: 0.8 }), plaster = std('#d9d2c0', { roughness: 0.9 });
  g.add(flat(60, 16, std('#7a756a', { roughness: 0.9 }), 0, 0, 4));
  const gl = DOOR_X - 1.7, gr = DOOR_X + 1.7;                                                     // back wall, with the doorway cut out
  g.add(box(gl + 29, 18, 0.6, wallM, (gl - 29) / 2, 9, -3.3), box(17 - gr, 18, 0.6, wallM, (17 + gr) / 2, 9, -3.3), box(gr - gl, 11.2, 0.6, wallM, DOOR_X, 12.4, -3.3));
  g.add(box(0.6, 18, 12, plaster, 13.3, 9, 2), box(0.6, 18, 12, plaster, -29.3, 9, 2));
  // landing on the right
  g.add(box(9, LANDING_Y, 3.6, stepM, 8.5, LANDING_Y / 2, -1.4));
  // 14 steps down toward -x
  for (let i = 0; i < 14; i++) { const top = LANDING_Y - 0.5 * (i + 1); g.add(box(0.8, top, 3.6, stepM, 4 - 0.8 * i - 0.4, top / 2, -1.4)); }
  // iron handrail along the front of the stair
  const iron = std('#2a2c33', { metalness: 0.6, roughness: 0.4 });
  // student canvases leaning on the landing wall
  const cols = ['#f6f1e4', '#e9e2cf', '#d8cfb9'];
  [[6.0, 2.6, 2.0], [7.0, 2.2, 1.6], [11.6, 3.0, 2.2], [12.3, 2.4, 1.8]].forEach(([x, h, w], i) => { const c = box(w, h, 0.12, std(cols[i % 3], { roughness: 0.9 }), x, LANDING_Y + h / 2, -2.7); c.rotation.x = -0.15; g.add(c); });
  // the service door at the bottom, in a deep frame; bright street behind it
  const door = new THREE.Group(); door.position.set(DOOR_X - 1.6, 0, -3.0); g.add(door);              // hinge on the left
  const dm = std('#4a3020', { roughness: 0.7 });
  door.add(box(3.2, 6.4, 0.25, dm, 1.6, 3.2, 0), box(2.6, 2.4, 0.3, std('#3a2416'), 1.6, 4.6, 0), box(2.6, 2.0, 0.3, std('#3a2416'), 1.6, 1.6, 0));
  const knob = sph(0.16, std('#c9a03a', { metalness: 0.8, roughness: 0.3 }), 2.85, 3.0, 0.22, 12); door.add(knob);
  g.add(box(0.5, 7.0, 0.8, std('#2a1a12'), DOOR_X - 1.85, 3.5, -3.1), box(0.5, 7.0, 0.8, std('#2a1a12'), DOOR_X + 1.85, 3.5, -3.1), box(4.2, 0.5, 0.8, std('#2a1a12'), DOOR_X, 6.75, -3.1));
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#fff1c8', emissiveIntensity: 1.6 })); outside.position.set(DOOR_X, 4, -4.4); g.add(outside);
  // a sign on the wall
  const sg = label(2.6, 0.7, 390, 105, (x, w, h) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); MS(x, 'SERVICE', w / 2, h / 2 + 2, 52, '#2a1a08'); }); sg.position.set(DOOR_X, 7.6, -2.98); g.add(sg);
  const lamp = new THREE.PointLight('#ffe7c2', 0, 40, 1.2); lamp.position.set(2, 12, 3); g.add(lamp);
  const doorLight = new THREE.SpotLight('#fff1c8', 0, 26, 0.75, 0.5, 1); doorLight.position.set(DOOR_X, 4, -3.4); doorLight.target.position.set(DOOR_X, 0, 6); g.add(doorLight, doorLight.target);
  return { group: g, door, doorLight, lamp };
}
// Height of the stair surface at x (relative to STAIR).
export function stairY(x) { if (x >= 4) return LANDING_Y; if (x <= 4 - 0.8 * 14) return 0; return LANDING_Y - 0.5 * (Math.floor((4 - x) / 0.8) + 1); }

// ---------- the museum front ----------
export function front(scene) {
  const g = new THREE.Group(); g.name = 'front'; g.position.copy(FRONT); scene.add(g);
  const st = stone('#c8bfa6', 7); st.repeat.set(30, 6);
  g.add(flat(300, 120, std('#ffffff', { map: st, roughness: 0.9 }), 0, 0, 30));
  const facade = std('#e6dcc2', { roughness: 0.85 }), roofM = std('#5f6b78', { roughness: 0.6 });
  g.add(box(90, 22, 6, facade, 0, 11, -6), box(92, 1.2, 7, std('#d3c7a8'), 0, 22.4, -6));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 8, 7, 4, 1), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(9, 1, 0.6); roof.position.set(0, 26.4, -6); g.add(roof);
  for (let x = -40; x <= 40; x += 6) { if (Math.abs(x) < 6) continue; g.add(cyl(0.8, 0.9, 18, std('#efe6cf'), 16, x, 10, -2.5)); const w = box(3.0, 6.0, 0.2, std('#3b4a5c', { roughness: 0.2 }), x + 3, 9, -2.9); g.add(w); const arch = cyl(1.5, 1.5, 0.22, std('#3b4a5c', { roughness: 0.2 }), 20, x + 3, 12, -2.9); arch.rotation.x = Math.PI / 2; g.add(arch); }
  // the doors and the sign
  const dm = std('#3a2416', { roughness: 0.6 });
  g.add(box(9, 11, 0.4, dm, 0, 5.5, -2.8), box(0.2, 11, 0.5, std('#c9a03a', { metalness: 0.7 }), 0, 5.5, -2.6));
  const ped = label(16, 2.6, 1600, 260, (x, w, h) => { x.fillStyle = '#d3c7a8'; x.fillRect(0, 0, w, h); x.font = '700 150px "Playfair Display"'; x.fillStyle = '#3a2a14'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MUSÉE DU LOUVRE', w / 2, h / 2 + 8); });
  ped.position.set(0, 13.2, -2.85); g.add(ped);
  const sign = label(5.2, 3.4, 520, 340, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b0121b'; x.lineWidth = 16; x.strokeRect(10, 10, w - 20, h - 20); LG(x, 'FERMÉ', w / 2, 120, 130, '#b0121b'); LG(x, 'CLOSED', w / 2, 250, 100, '#16182a'); });
  sign.position.set(0, 7.4, -2.55); sign.rotation.z = -0.04; g.add(sign);
  // a chain across the doors
  for (let i = 0; i < 11; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 12), std('#9aa0a8', { metalness: 0.8, roughness: 0.3 })); l.position.set(-4 + i * 0.8, 3.6 - 0.6 * Math.sin(Math.PI * i / 10), -2.45); l.rotation.y = i % 2 ? Math.PI / 2 : 0; g.add(l); }
  // lamp posts
  for (const x of [-12, 12]) { g.add(cyl(0.18, 0.24, 9, std('#1d1f27', { metalness: 0.5 }), 10, x, 4.5, 4)); g.add(sph(0.6, std('#fff4d0', { emissive: '#ffe9b0', emissiveIntensity: 0.6 }), x, 9.4, 4, 14)); }
  return { group: g };
}

// ---------- the police office ----------
export function office(scene, img) {
  const g = new THREE.Group(); g.name = 'office'; g.position.copy(OFFICE); scene.add(g);
  const ft = parquet(); ft.repeat.set(4, 3);
  g.add(flat(26, 20, std('#ffffff', { map: ft, roughness: 0.6 }), 0, 0, 2));
  const wallM = std('#5c6b5a', { roughness: 0.9 });
  g.add(box(26, 14, 0.6, wallM, 0, 7, -8.3), box(0.6, 14, 20, wallM, -13, 7, 2), box(0.6, 14, 20, wallM, 13, 7, 2));
  g.add(box(26, 1.2, 0.7, std('#3a2a1e'), 0, 0.6, -8.25));
  // the desk between them (Mia stands behind it on the left, the suspect sits on the right)
  const wood = std('#6e4526', { roughness: 0.55 });
  g.add(box(6.2, 0.3, 3.0, wood, 0, 3.0, -1.5)); for (const x of [-2.8, 2.8]) for (const z of [-2.7, -0.3]) g.add(box(0.3, 2.85, 0.3, wood, x, 1.42, z));
  g.add(box(1.4, 0.5, 1.0, std('#f2ead8'), -1.6, 3.4, -1.6), box(0.9, 0.06, 1.2, std('#f6f1e4'), 1.2, 3.18, -1.2));
  // the chair for the suspect
  const chair = new THREE.Group(); chair.position.set(4.6, 0, 0.6); chair.rotation.y = -Math.PI / 2 + 0.35; g.add(chair);
  chair.add(box(2.1, 0.25, 2.0, wood, 0, 2.0, 0)); for (const x of [-0.9, 0.9]) for (const z of [-0.85, 0.85]) chair.add(box(0.2, 2.0, 0.2, wood, x, 1.0, z));
  chair.add(box(2.1, 2.4, 0.2, wood, 0, 3.3, -0.95));
  // the hanging lamp
  g.add(cyl(0.03, 0.03, 5, std('#111'), 6, 0, 11.5, -0.5));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.9, 20, 1, true), std('#2f6b3a', { side: THREE.DoubleSide, roughness: 0.4 })); shade.position.set(0, 8.9, -0.5); g.add(shade);
  g.add(sph(0.35, std('#fff6d8', { emissive: '#fff1c0', emissiveIntensity: 2.5 }), 0, 8.6, -0.5, 14));
  // MISSING poster with the painting on it
  const poster = label(3.2, 4.4, 320, 440, (x, w, h) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); LG(x, 'DISPARUE', w / 2, 52, 62, '#b0121b'); if (img) x.drawImage(img, 70, 96, 180, 268); MS(x, 'MISSING', w / 2, 402, 40, '#16182a'); });
  poster.position.set(-6.5, 7.2, -7.97); g.add(poster);
  const files = std('#8a8a7a', { roughness: 0.6 }); g.add(box(3.2, 5.2, 1.6, files, 8.5, 2.6, -7.2));
  const lamp = new THREE.PointLight('#ffe9b8', 0, 30, 1.2); lamp.position.set(0, 8.3, -0.5); g.add(lamp);
  return { group: g, lamp };
}

// ---------- the thief's room ----------
// The table at TABLE (relative): top at y 3.0; a hollow under the top, open on the camera side (+z) in the cutaway,
// where the painting lies flat.
export const TABLE = V(0, 3.0, -1.0);
export function attic(scene) {
  const g = new THREE.Group(); g.name = 'attic'; g.position.copy(ATTIC); scene.add(g);
  const ft = parquet(); ft.repeat.set(3, 3);
  g.add(flat(24, 18, std('#ffffff', { map: ft, roughness: 0.7 }), 0, 0, 1));
  const wallM = std('#c9b28e', { roughness: 0.9 });
  g.add(box(24, 12, 0.6, wallM, 0, 6, -7.3), box(0.6, 12, 18, wallM, -12, 6, 1), box(0.6, 12, 18, wallM, 12, 6, 1));
  const slope = box(24, 0.4, 9, std('#a8916c', { roughness: 0.9 }), 0, 12.5, -3.5); slope.rotation.x = 0.5; g.add(slope);
  // window with Paris rooftops
  const win = label(3.2, 3.2, 256, 256, (x, w, h) => { const sk = x.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#6f9fd8'); sk.addColorStop(1, '#d9e8f5'); x.fillStyle = sk; x.fillRect(0, 0, w, h); x.fillStyle = '#5f6b78'; for (let i = 0; i < 6; i++) x.fillRect(i * 46, 150 + (i % 3) * 18, 40, 120); x.fillStyle = '#8a5a33'; x.fillRect(120, 120, 10, 40); x.strokeStyle = '#ffffff'; x.lineWidth = 12; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); }, { emissive: '#ffffff', emissiveIntensity: 0.25 });
  win.position.set(-6, 7, -6.98); g.add(win);
  // the bed
  const bed = new THREE.Group(); bed.position.set(-7.5, 0, -3.5); g.add(bed);
  bed.add(box(4.0, 1.4, 7, std('#6e4526'), 0, 0.7, 0), box(3.8, 0.6, 6.8, std('#f2ead8'), 0, 1.7, 0), box(3.9, 0.3, 4.6, std('#4a6fa5', { roughness: 0.9 }), 0, 2.1, 1.1), box(2.6, 0.5, 1.2, std('#ffffff'), 0, 2.2, -2.6), box(4.0, 3.2, 0.3, std('#6e4526'), 0, 1.6, -3.4));
  // the table with the false bottom: top slab, an apron box under it with its +z side cut away
  const wood = std('#7a4b2c', { roughness: 0.55 }), dark = std('#3a2416', { roughness: 0.8 });
  const tb = new THREE.Group(); tb.position.copy(TABLE); g.add(tb);
  tb.add(box(5.2, 0.3, 3.4, wood, 0, 0, 0));
  tb.add(box(5.0, 0.12, 3.2, dark, 0, -0.75, 0), box(5.0, 0.7, 0.12, wood, 0, -0.42, -1.55), box(0.12, 0.7, 3.2, wood, -2.45, -0.42, 0), box(0.12, 0.7, 3.2, wood, 2.45, -0.42, 0));
  for (const x of [-2.35, 2.35]) for (const z of [-1.45, 1.45]) tb.add(box(0.28, 3.0, 0.28, wood, x, -1.5, z));
  const cut = box(5.0, 0.7, 0.06, new THREE.MeshStandardMaterial({ color: '#7a4b2c', transparent: true, opacity: 0.18, depthWrite: false }), 0, -0.42, 1.58); cut.castShadow = false; tb.add(cut);
  const glow = new THREE.PointLight('#ffd98a', 0, 4, 1.5); glow.position.set(0, -0.4, 1.0); tb.add(glow);
  // a cup and a candle on the table top
  g.add(cyl(0.2, 0.16, 0.4, std('#e9e2cf'), 12, 1.6, 3.35, -1.6), cyl(0.12, 0.12, 0.7, std('#f6f1e4'), 10, -1.8, 3.5, -1.8));
  // the door on the right
  g.add(box(3.0, 6.2, 0.3, std('#5a3a22'), 9.4, 3.1, -7.0));
  const lamp = new THREE.PointLight('#ffe2b0', 0, 34, 1.1); lamp.position.set(0, 9, 3); g.add(lamp);
  return { group: g, table: tb, glow, lamp };
}

// ---------- the Florence shop ----------
export function shop(scene) {
  const g = new THREE.Group(); g.name = 'shop'; g.position.copy(SHOP); scene.add(g);
  const ft = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#b5653c' : '#c97a4c'; x.fillRect(i * 64, j * 64, 64, 64); } }); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(6, 5);
  g.add(flat(28, 22, std('#ffffff', { map: ft, roughness: 0.6 }), 0, 0, 2));
  const wallM = std('#e2b866', { roughness: 0.9 });
  g.add(box(28, 14, 0.6, wallM, 0, 7, -8.3), box(0.6, 14, 22, wallM, -14, 7, 2), box(0.6, 14, 22, wallM, 14, 7, 2));
  // arched window onto Florence: the red dome
  const view = label(5.2, 6.4, 260, 320, (x, w, h) => {
    const sk = x.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#5f97d6'); sk.addColorStop(1, '#f2dcb0'); x.fillStyle = sk; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e9d9b8'; x.fillRect(0, 210, w, 110); x.fillStyle = '#c4572d'; x.beginPath(); x.ellipse(130, 210, 80, 95, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#f6f1e4'; x.fillRect(122, 102, 16, 22); x.strokeStyle = '#f6f1e4'; x.lineWidth = 4; for (const dx of [-45, 0, 45]) { x.beginPath(); x.moveTo(130 + dx * 0.4, 118); x.quadraticCurveTo(130 + dx, 160, 130 + dx * 1.7, 210); x.stroke(); }
    x.fillStyle = '#d98c5f'; for (let i = 0; i < 6; i++) x.fillRect(i * 46, 240 + (i % 2) * 14, 40, 90);
  }, { emissive: '#ffffff', emissiveIntensity: 0.3 });
  view.position.set(6.5, 7.4, -7.98); g.add(view);
  const frameM = std('#7a4b2c'); g.add(box(5.6, 0.3, 0.3, frameM, 6.5, 4.2, -7.9), box(0.3, 6.4, 0.3, frameM, 3.75, 7.4, -7.9), box(0.3, 6.4, 0.3, frameM, 9.25, 7.4, -7.9));
  // paintings for sale
  for (const [x, y, w, h, s, k] of [[-8, 7.5, 3.6, 2.8, 31, 'land'], [-3, 8.2, 2.6, 3.4, 32, 'port'], [-10.5, 3.6, 2.4, 1.8, 33, 'fruit']]) { const p = painting(w, h, s, k); p.position.set(x, y, -7.95); g.add(p); }
  // the counter (dealer behind, on -z side), top at y 3.4
  const wood = std('#6e4526', { roughness: 0.5 });
  g.add(box(8, 3.4, 2.0, wood, -1.0, 1.7, -3.2), box(8.3, 0.2, 2.3, std('#4a2c16', { roughness: 0.4 }), -1.0, 3.5, -3.2));
  const sign = label(6.4, 1.2, 640, 120, (x, w, h) => { x.fillStyle = '#3a2416'; x.fillRect(0, 0, w, h); x.font = '700 76px "Playfair Display"'; x.fillStyle = '#e9c46a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ANTICHITÀ · FIRENZE', w / 2, h / 2 + 4); });
  sign.position.set(-5.5, 11.6, -7.97); g.add(sign);
  // the shop door on the left wall (the police come in here)
  g.add(box(0.3, 6.6, 3.2, std('#5a3a22'), -13.7, 3.3, 3.0));
  const lamp = new THREE.PointLight('#ffe6b8', 0, 40, 1.1); lamp.position.set(0, 10, 3); g.add(lamp);
  return { group: g, lamp, counterY: 3.6 };
}

// ---------- the Louvre today ----------
export function today(scene) {
  const g = new THREE.Group(); g.name = 'today'; g.position.copy(TODAY); scene.add(g);
  const ft = parquet(); ft.repeat.set(10, 8);
  g.add(flat(50, 40, std('#ffffff', { map: ft, roughness: 0.4 }), 0, 0, 4));
  const wallM = std('#9aa3ad', { roughness: 0.85 });
  g.add(box(50, 18, 0.6, wallM, 0, 9, -12.3), box(0.6, 18, 40, wallM, -24.7, 9, 4), box(0.6, 18, 40, wallM, 24.7, 9, 4));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f4f8ff', emissiveIntensity: 0.4 })); sky.rotation.x = Math.PI / 2; sky.position.set(0, 18, 2); g.add(sky);
  // the free-standing dark wall, the case and the curved wooden barrier
  g.add(box(12, 12, 1.0, std('#2b3340', { roughness: 0.6 }), 0, 6, -8.5));
  const caseM = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.2, 0.8), new THREE.MeshStandardMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.1, roughness: 0.03, depthWrite: false }));
  caseM.position.set(0, 5.9, -7.6); caseM.renderOrder = 3; g.add(caseM);
  const barrier = new THREE.Mesh(new THREE.TorusGeometry(9, 0.25, 8, 40, Math.PI), std('#8a5a33', { roughness: 0.4 })); barrier.rotation.x = Math.PI / 2; barrier.rotation.z = Math.PI; barrier.position.set(0, 3.2, -7.0); g.add(barrier);
  for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; g.add(cyl(0.12, 0.12, 3.2, std('#8a5a33'), 8, Math.cos(a) * 9, 1.6, -7.0 + Math.sin(a) * 9)); }
  const lamp = new THREE.PointLight('#ffffff', 0, 60, 1.0); lamp.position.set(0, 15, 6); g.add(lamp);
  const spot = new THREE.SpotLight('#fff8ec', 0, 40, 0.3, 0.6, 1); spot.position.set(0, 15, 2); spot.target.position.set(0, ML_Y, -8); g.add(spot, spot.target);
  return { group: g, lamp, spot };
}
