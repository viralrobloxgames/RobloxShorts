// Spaghetti Grows On Trees: sets and props, built in code.
// World layout (studs, floor y 0). Each place is its own group (with its own floor), shown only in its shots:
//   ORCHARD  origin. A sunny Ticino hillside: rows of spaghetti trees (strands hanging in bunches), a ladder against the
//            hero tree (HERO), a basket, the drying rail, a measuring board with strands of one length, mountains.
//   STUDIO   (0, 0, -3000). A 1950s TV studio (open +z side): the news desk with a microphone, a desk phone and a
//            flip calendar, a backdrop, a studio camera on a pedestal, lamps.
//   HOME     (3000, 0, 0). A 1950s British living room (open +z side): a TV cabinet whose screen shows the orchard,
//            two armchairs, a side table with a phone, a standard lamp, a window with curtains, a shelf with tins, the
//            little table where the tin of tomato sauce gets its sprig.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, rng, cloud } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
export const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };

export const ORCHARD = V(0, 0, 0), STUDIO = V(0, 0, -3000), HOME = V(3000, 0, 0);
export const HERO = V(0, 0, 0);                  // the hero tree (the ladder leans on its +z side)
export const PASTA = '#f2d58a';
const pastaM = std(PASTA, { roughness: 0.55 });

// A bunch of spaghetti strands hanging from its origin (top), length L, n strands: one merged mesh, swayable.
export function bunch(seed, n = 12, L = 2.6, spread = 0.35) {
  const r = rng(seed), geos = [];
  for (let i = 0; i < n; i++) {
    const l = L * (0.92 + r() * 0.12), g = new THREE.CylinderGeometry(0.035, 0.035, l, 5);
    g.translate((r() - 0.5) * spread, -l / 2, (r() - 0.5) * spread); g.rotateZ((r() - 0.5) * 0.12); g.rotateX((r() - 0.5) * 0.12); geos.push(g);
  }
  const m = new THREE.Mesh(mergeGeometries(geos), pastaM); m.castShadow = true;
  const grp = new THREE.Group(); grp.add(m); grp.userData.seed = seed; return grp;
}
// A spaghetti tree: a trunk and a leafy block crown, bunches hanging from the crown's underside.
export function spaghettiTree(seed, s = 1) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(box(1.3 * s, 6 * s, 1.3 * s, std('#6b4a2e', { roughness: 0.9 }), 0, 3 * s, 0));
  const leaf = std(r() < 0.5 ? '#4f8a3a' : '#5c9640', { roughness: 0.9 });
  g.add(box(8 * s, 4 * s, 8 * s, leaf, 0, 7.5 * s, 0), box(5.5 * s, 2.2 * s, 5.5 * s, leaf, 0.6 * s, 10.4 * s, -0.4 * s));
  const bunches = [];
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + r() * 0.5, d = (1.6 + r() * 2.0) * s, b = bunch(seed * 31 + i, 10, (2.0 + r() * 0.8) * s);
    b.position.set(Math.cos(a) * d, 5.5 * s, Math.sin(a) * d); g.add(b); bunches.push(b);
  }
  g.userData.bunches = bunches;
  return g;
}
export function swayTree(tree, t, k = 1) { tree.userData.bunches.forEach((b, i) => { b.rotation.z = k * 0.06 * Math.sin(t * 1.7 + i); b.rotation.x = k * 0.05 * Math.sin(t * 1.3 + i * 2); }); }

// ======================================================= the orchard =================================================
export function orchard(scene) {
  const g = new THREE.Group(); g.position.copy(ORCHARD); scene.add(g);
  const gt = canvasTexture(1024, 1024, (c, w) => { c.fillStyle = '#6fa046'; c.fillRect(0, 0, w, w); const r = rng(5); for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; c.fillStyle = `hsl(${80 + r() * 30},${36 + r() * 18}%,${32 + r() * 16}%)`; c.fillRect(r() * w, r() * w, s, s * 2.2); } });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(120, 120);
  g.add(flat(2400, 2400, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 0, 0));
  // mountains with snow caps behind (-z), a lake glint
  const rock = std('#7d8a94', { roughness: 0.9, flatShading: true }), snow = std('#f4f6f8', { roughness: 0.6, flatShading: true }), r = rng(8);
  for (let i = 0; i < 9; i++) {
    const h = 160 + r() * 140, w = 120 + r() * 80, x = -560 + i * 140 + r() * 40, z = -520 - r() * 160;
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 6), rock); m.position.set(x, h / 2 - 10, z); m.rotation.y = r() * 3; g.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.32, h * 0.32, 6), snow); cap.position.set(x, h - 10 - h * 0.16 + 0.5, z); cap.rotation.y = m.rotation.y; g.add(cap);
  }
  // rows of spaghetti trees (the hero tree at the origin)
  const trees = [];
  const hero = spaghettiTree(3, 1); hero.position.copy(HERO); g.add(hero); trees.push(hero);
  for (let row = -2; row <= 2; row++) for (let col = -3; col <= 3; col++) {
    if (row === 0 && col === 0) continue;
    const t = spaghettiTree(100 + row * 10 + col, 0.9 + r() * 0.2); t.position.set(col * 16 + (r() - 0.5) * 2, 0, row * 18 - 6 + (r() - 0.5) * 2);
    if (Math.abs(col) <= 1 && row === 1) continue;                     // leave the front clear for the camera and the pickers
    g.add(t); trees.push(t);
  }
  // the ladder leaning on the hero tree's front (+z) side
  const lad = new THREE.Group(); lad.position.set(1.6, 0, 5.6); lad.rotation.x = -0.16; g.add(lad);        // outside the crown (z <= 4)
  const wood = std('#a0763f', { roughness: 0.8 });
  for (const s of [-1, 1]) lad.add(box(0.25, 8, 0.25, wood, s * 0.9, 4, 0));
  for (let i = 0; i < 7; i++) lad.add(box(1.8, 0.18, 0.25, wood, 0, 0.8 + i * 1.1, 0));
  // the drying rail: two posts and a pole, strands draped over (both sides) - right of the hero tree
  const rail = new THREE.Group(); rail.position.set(14, 0, 8); rail.rotation.y = -0.3; g.add(rail);
  for (const s of [-1, 1]) rail.add(box(0.35, 5.2, 0.35, wood, s * 5, 2.6, 0));
  { const p = cyl(0.12, 0.12, 10.4, wood, 8, 0, 5.1, 0); p.rotation.z = Math.PI / 2; rail.add(p); }
  const drape = [];
  for (let i = 0; i < 9; i++) { for (const sz of [-1, 1]) { const b = bunch(700 + i * 2 + (sz > 0 ? 1 : 0), 9, 2.4, 0.25); b.position.set(-4.2 + i * 1.05, 5.12, sz * 0.1); b.visible = false; rail.add(b); drape.push(b); } }
  // the measuring board with strands of exactly one length (hung from a bar) - left of the hero tree
  const mb = new THREE.Group(); mb.position.set(-9, 0, 9); mb.rotation.y = 0.35; g.add(mb);
  mb.add(box(0.3, 7, 0.3, wood, -2.6, 3.5, 0), box(0.3, 7, 0.3, wood, 2.6, 3.5, 0));
  const board = label(5, 5, 400, 400, (c, w, h) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2b1a0e'; c.lineWidth = 3; for (let i = 0; i <= 20; i++) { const y = 20 + i * 18; c.beginPath(); c.moveTo(0, y); c.lineTo(i % 5 ? 30 : 60, y); c.stroke(); c.beginPath(); c.moveTo(w, y); c.lineTo(w - (i % 5 ? 30 : 60), y); c.stroke(); } LG(c, 'PERFECT', w / 2, 40, 44, '#b22222'); LG(c, 'LENGTH', w / 2, 86, 44, '#b22222'); });
  board.position.set(0, 4.0, -0.2); mb.add(board); mb.add(box(5.2, 5.2, 0.15, std('#6b4a2e'), 0, 4.0, -0.32));
  mb.add(box(5.4, 0.25, 0.25, wood, 0, 6.6, 0.1));
  for (let i = 0; i < 7; i++) { const b = bunch(800 + i, 1, 4.6, 0); b.position.set(-1.8 + i * 0.6, 6.5, 0.15); mb.add(b); }
  // the basket (on the ground until carried)
  const basket = basketProp(); basket.position.set(-1.6, 0, 6); g.add(basket);
  g.userData = { trees, hero, ladder: lad, drape, rail, basket, board: mb };
  return g;
}
export function basketProp() {
  const g = new THREE.Group(), wick = std('#b58447', { roughness: 0.9 });
  const tex = canvasTexture(256, 64, (c, w, h) => { c.fillStyle = '#b58447'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6030'; c.lineWidth = 4; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 8, h); c.stroke(); } for (let y = 8; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const side = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.85, 1.0, 20, 1, true), std('#ffffff', { map: tex, roughness: 0.9, side: THREE.DoubleSide })); side.position.y = 0.5; side.castShadow = true; g.add(side);
  g.add(cyl(0.85, 0.85, 0.08, wick, 20, 0, 0.04, 0));
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 20), pastaM); fill.position.y = 0.82; g.add(fill);
  for (let i = 0; i < 4; i++) { const b = bunch(900 + i, 6, 0.9, 0.5); b.rotation.z = Math.PI / 2 + (i - 1.5) * 0.4; b.position.set(-0.4 + i * 0.3, 0.95, (i % 2 - 0.5) * 0.4); g.add(b); }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.07, 8, 24, Math.PI), wick); handle.position.y = 1.0; g.add(handle);
  g.userData.fill = fill; return g;
}
// the weevil: a cartoon beetle with a long snout; faces +z
export function weevil() {
  const g = new THREE.Group(), shell = std('#5a3b22', { roughness: 0.4, metalness: 0.2 }), dark = std('#2a1c12');
  const b = sph(0.45, shell, 0, 0.45, -0.1, 16); b.scale.set(0.9, 0.75, 1.2); g.add(b);
  g.add(sph(0.25, dark, 0, 0.55, 0.45, 12));
  const sn = cyl(0.05, 0.08, 0.6, dark, 8, 0, 0.5, 0.8); sn.rotation.x = Math.PI / 2 + 0.3; g.add(sn);
  for (const s of [-1, 1]) { g.add(sph(0.08, std('#ffffff'), s * 0.13, 0.66, 0.62, 8), sph(0.04, dark, s * 0.13, 0.67, 0.68, 6)); for (let i = 0; i < 3; i++) { const l = cyl(0.03, 0.03, 0.6, dark, 5, s * 0.45, 0.25, -0.3 + i * 0.3); l.rotation.z = s * 0.9; g.add(l); } const an = cyl(0.02, 0.02, 0.5, dark, 5, s * 0.15, 0.85, 0.75); an.rotation.set(0.6, 0, s * 0.4); g.add(an); }
  return g;
}

// ======================================================= the studio ==================================================
// Open +z. The presenter stands behind the desk (desk front at z -2, top 3.0); the camera pedestal at the left.
export const DESK_TOP = 3.0;
export function studio(scene) {
  const g = new THREE.Group(); g.position.copy(STUDIO); scene.add(g);
  g.add(flat(60, 40, std('#3a3a40', { roughness: 0.8 }), 0, 0, 0));
  // backdrop: a grey panel with a globe-grid and a NEWS sign
  const back = label(30, 16, 960, 512, (c, w, h) => {
    c.fillStyle = '#6d7480'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo(i * w / 12, 0); c.lineTo(i * w / 12, h); c.stroke(); }
    c.beginPath(); c.arc(w / 2, h / 2 + 30, 170, 0, 7); c.stroke(); c.beginPath(); c.ellipse(w / 2, h / 2 + 30, 80, 170, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(w / 2 - 170, h / 2 + 30); c.lineTo(w / 2 + 170, h / 2 + 30); c.stroke();
  });
  back.position.set(0, 8, -8); g.add(back);
  const sg = label(9, 2.2, 720, 176, (c, w, h) => { c.fillStyle = '#1b1f2a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f2f0e6'; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16); SLAB(c, 'THE NEWS', w / 2, h / 2 + 6, 104, '#f2f0e6'); });
  sg.position.set(0, 12.6, -7.9); g.add(sg);
  // desk
  const wood = std('#4a3424', { roughness: 0.6 });
  g.add(box(9, 0.4, 3.2, wood, 0, DESK_TOP - 0.2, -3.6));
  g.add(box(8.8, DESK_TOP - 0.4, 0.3, wood, 0, (DESK_TOP - 0.4) / 2, -2.1));
  for (const s of [-1, 1]) g.add(box(0.3, DESK_TOP - 0.4, 3, wood, s * 4.35, (DESK_TOP - 0.4) / 2, -3.6));
  const front = label(6, 1.2, 600, 120, (c, w, h) => { c.fillStyle = '#d9c9a0'; c.fillRect(0, 0, w, h); SLAB(c, 'TONIGHT', w / 2, h / 2 + 4, 70, '#2b1a0e'); });
  front.position.set(0, 1.5, -1.93); g.add(front);
  // microphone on a little stand, papers, the desk phone, the flip calendar
  const mic = new THREE.Group(); mic.position.set(-1.2, DESK_TOP, -3.0); g.add(mic);
  mic.add(cyl(0.35, 0.4, 0.12, std('#2a2d33', { metalness: 0.6 }), 16, 0, 0.06, 0), cyl(0.05, 0.05, 1.3, std('#c9cdd2', { metalness: 0.9 }), 8, 0, 0.7, 0));
  { const h = cyl(0.22, 0.18, 0.6, std('#c9cdd2', { metalness: 0.9, roughness: 0.25 }), 14, 0, 1.55, 0.1); h.rotation.x = 0.5; mic.add(h); }
  g.add(box(1.4, 0.04, 1.8, std('#fbf8ef'), 0.9, DESK_TOP + 0.02, -3.2));
  const phone = deskPhone(); phone.position.set(3.0, DESK_TOP, -3.4); phone.rotation.y = -0.4; g.add(phone);
  const cal = calendar(); cal.position.set(-3.1, DESK_TOP, -3.2); cal.rotation.y = 0.35; g.add(cal);
  // a 1950s studio camera on a pedestal, and two lamps
  const cam = new THREE.Group(); cam.position.set(-9, 0, 4); cam.rotation.y = 2.4; g.add(cam);
  cam.add(cyl(0.3, 0.5, 4.4, std('#2a2d33', { metalness: 0.5 }), 10, 0, 2.2, 0), box(1.8, 1.6, 2.6, std('#5a6068', { metalness: 0.4, roughness: 0.4 }), 0, 5.2, 0));
  for (let i = 0; i < 4; i++) { const l = cyl(0.22, 0.22, 0.7, std('#1b1b1d', { metalness: 0.5 }), 12, (i % 2 - 0.5) * 0.9, 5.2 + (i < 2 ? 0.35 : -0.35), 1.6); l.rotation.x = Math.PI / 2; cam.add(l); }
  for (const x of [-12, 12]) { g.add(cyl(0.12, 0.12, 9, std('#2a2d33'), 8, x, 4.5, 2)); const hd = cyl(0.9, 1.3, 1.6, std('#2a2d33', { metalness: 0.5 }), 14, x, 9.3, 2); hd.rotation.x = 0.9; g.add(hd); }
  const key = new THREE.SpotLight('#fff3dc', 0, 80, 0.6, 0.6, 1.0); key.position.set(6, 12, 10); key.target.position.set(0, 4, -4); g.add(key, key.target);
  g.userData = { mic, phone, cal, key };
  return g;
}
// a black bakelite desk phone (1950s style): body, dial, handset in its cradle. userData.handset can be re-parented.
export function deskPhone() {
  const g = new THREE.Group(), bk = std('#141416', { roughness: 0.25, metalness: 0.1 });
  const body = box(1.3, 0.55, 1.1, bk, 0, 0.3, 0); g.add(body);
  { const top = box(1.1, 0.25, 0.8, bk, 0, 0.62, -0.05); top.rotation.x = -0.2; g.add(top); }
  const dial = cyl(0.38, 0.38, 0.06, std('#e8e2d0'), 20, 0, 0.6, 0.38); dial.rotation.x = Math.PI / 2 - 0.5; g.add(dial);
  const hs = handset(); hs.position.set(0, 0.95, -0.05); hs.rotation.z = Math.PI / 2; g.add(hs);
  g.userData.handset = hs; return g;
}
// handset: grip at the origin, along y: earpiece at +y, mouthpiece at -y
export function handset() {
  const g = new THREE.Group(), bk = std('#141416', { roughness: 0.25, metalness: 0.1 });
  g.add(cyl(0.12, 0.12, 1.2, bk, 10, 0, 0, 0));
  for (const s of [-1, 1]) { const c = cyl(0.24, 0.2, 0.3, bk, 14, 0, s * 0.68, 0.12); c.rotation.x = Math.PI / 2; g.add(c); }
  return g;
}
// a flip calendar: a little easel with a page whose texture is set per shot (march 31 / april 1)
export function calendar() {
  const g = new THREE.Group();
  g.add(box(1.2, 0.1, 0.8, std('#4a3424'), 0, 0.05, 0));
  const page = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), std('#cfc9bb', { roughness: 0.9 })); page.position.set(0, 0.8, 0.05); page.rotation.x = -0.25; g.add(page);
  { const bk = box(1.14, 1.34, 0.06, std('#2b2b2b'), 0, 0.79, 0.0); bk.rotation.x = -0.25; g.add(bk); }
  const pg = (m, d) => canvasTexture(220, 260, (c, w, h) => { c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, 64); LG(c, m, w / 2, 36, 46, '#ffffff'); LG(c, d, w / 2, 160, 130, '#222'); });
  page.userData.tex = { mar: pg('MARCH', '31'), apr: pg('APRIL', '1') };
  page.material.map = page.userData.tex.mar; g.userData.page = page;
  return g;
}

// ======================================================= the living room =============================================
export const TV_AT = V(0, 0, -6.5);              // home-local: the TV cabinet (screen faces +z)
export function livingRoom(scene) {
  const g = new THREE.Group(); g.position.copy(HOME); scene.add(g);
  const paper = canvasTexture(256, 256, (c, w) => { c.fillStyle = '#e6d6b0'; c.fillRect(0, 0, w, w); c.fillStyle = '#c9a97a'; for (let y = 0; y < w; y += 32) for (let x = (y / 32 % 2) * 16; x < w; x += 32) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } });
  paper.wrapS = paper.wrapT = THREE.RepeatWrapping; paper.repeat.set(8, 4);
  const wallM = std('#ffffff', { map: paper, roughness: 0.9 });
  g.add(flat(40, 30, std('#6b4a2e', { roughness: 0.8 }), 0, 0, 0));
  g.add(flat(18, 10, std('#8c2f2f', { roughness: 0.95 }), 0, 0.03, 0));               // rug
  g.add(box(40, 16, 0.6, wallM, 0, 8, -10), box(0.6, 16, 30, wallM, -16, 8, 2), box(0.6, 16, 30, wallM, 16, 8, 2), box(40, 0.6, 30, std('#efe8d8'), 0, 16, 2));
  g.add(box(40, 1, 0.7, std('#5a3b22'), 0, 0.5, -9.6));
  // TV cabinet with a rounded screen (the screen's picture is a texture set per shot)
  const tv = new THREE.Group(); tv.position.copy(TV_AT); g.add(tv);
  const wood = std('#6b4428', { roughness: 0.5 });
  tv.add(box(5.2, 4.2, 2.6, wood, 0, 3.3, 0));
  for (const s of [-1, 1]) tv.add(box(0.3, 1.2, 0.3, wood, s * 2.2, 0.6, 0));
  tv.add(box(4.2, 0.9, 0.1, std('#2a1c12'), 0, 1.75, 1.32));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.3 }));
  scr.position.set(0, 3.7, 1.32); tv.add(scr);
  const tvPic = canvasTexture(340, 260, (c, w, h) => {
    c.fillStyle = '#c9d2c4'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa69a'; c.fillRect(0, h * 0.6, w, h * 0.4);
    for (const x of [70, 170, 270]) { c.fillStyle = '#4a4a44'; c.fillRect(x - 6, 120, 12, 60); c.fillStyle = '#5f6b5a'; c.fillRect(x - 40, 60, 80, 64); c.strokeStyle = '#efe6c8'; c.lineWidth = 2; for (let i = -30; i <= 30; i += 6) { c.beginPath(); c.moveTo(x + i, 124); c.lineTo(x + i + 2, 150 + Math.abs(i) * 0.3); c.stroke(); } }
    const v = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 200); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
  });
  scr.material.map = tvPic; scr.material.emissiveMap = tvPic;
  tv.add(box(0.4, 0.4, 0.1, std('#c9a24a', { metalness: 0.7 }), 1.5, 1.75, 1.4), box(0.4, 0.4, 0.1, std('#c9a24a', { metalness: 0.7 }), 0.8, 1.75, 1.4));
  // two armchairs facing the TV (their fronts face -z), the side table with a phone between them
  const chair = (x) => { const c = new THREE.Group(); c.position.set(x, 0, 4.6); c.scale.set(0.95, 1, 1); g.add(c); const fab = std('#3f6b5a', { roughness: 0.9 }); c.add(box(3.4, 1.8, 3.0, fab, 0, 0.9, 0), box(3.4, 3.2, 0.8, fab, 0, 2.6, 1.1)); for (const s of [-1, 1]) c.add(box(0.6, 2.6, 3.0, fab, s * 1.4, 1.3, 0)); return c; };
  chair(-2.0); chair(2.0);
  g.add(box(1.6, 2.4, 1.6, wood, -5.4, 1.2, 3.6));
  const phone = deskPhone(); phone.position.set(-5.4, 2.4, 3.5); phone.rotation.y = Math.PI * 0.8; g.add(phone);
  // standard lamp, window with curtains, a shelf of tins (one SPAGHETTI), a small table with the tomato tin
  g.add(cyl(0.12, 0.12, 7, std('#c9a24a', { metalness: 0.7 }), 8, 12.5, 3.5, -6), cyl(0.9, 1.5, 1.4, std('#f2e3b8', { emissive: '#ffd27a', emissiveIntensity: 0.4 }), 16, 12.5, 7.4, -6));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.5), std('#cfe6ff', { emissive: '#cfe6ff', emissiveIntensity: 0.6 })); win.position.set(8, 8.5, -9.65); g.add(win);
  for (const s of [-1, 1]) g.add(box(1.4, 5.6, 0.3, std('#8c2f2f'), 8 + s * 3.1, 8.4, -9.5));
  g.add(box(6, 0.3, 1.4, wood, -9.5, 7.5, -9.0));
  const tins = [];
  for (let i = 0; i < 4; i++) { const t = tin(i === 1 ? 'spaghetti' : ['beans', 'spaghetti', 'peas', 'soup'][i]); t.position.set(-11.6 + i * 1.4, 7.65, -9.0); g.add(t); tins.push(t); }
  g.add(box(3, 1.6, 2, wood, 9.5, 0.8, 2));
  const sauce = tin('sauce'); sauce.position.set(9.5, 1.6, 2.2); g.add(sauce);
  const sprig = bunch(950, 3, 1.4, 0.06); sprig.visible = false; g.add(sprig);          // the sprig in the tin (shown in the payoff)
  g.userData = { tv, scr, tvPic, phone, tins, sauce, sprig };
  return g;
}
export function tin(kind) {
  const g = new THREE.Group();
  const lab = { spaghetti: ['#c0392b', 'SPAGHETTI', '#ffd23f'], beans: ['#2e6db4', 'BEANS', '#ffffff'], peas: ['#3f8f3f', 'PEAS', '#ffffff'], soup: ['#c97a1f', 'SOUP', '#ffffff'], sauce: ['#b3201c', 'TOMATO SAUCE', '#ffffff'] }[kind];
  const tx = canvasTexture(256, 96, (c, w, h) => { c.fillStyle = lab[0]; c.fillRect(0, 0, w, h); LG(c, lab[1], w / 2, h / 2 + 4, lab[1].length > 9 ? 22 : 30, lab[2]); });
  const side = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 20), [std('#ffffff', { map: tx, roughness: 0.5 }), std('#c9cdd2', { metalness: 0.8, roughness: 0.3 }), std('#c9cdd2', { metalness: 0.8, roughness: 0.3 })]);
  side.position.y = 0.6; side.rotation.y = -Math.PI / 2; side.castShadow = true; g.add(side);
  if (kind === 'sauce') { const top = new THREE.Mesh(new THREE.CircleGeometry(0.46, 20), std('#a51d14', { roughness: 0.3 })); top.rotation.x = -Math.PI / 2; top.position.y = 1.215; g.add(top); }
  return g;
}
