// She Raced Around The World: sets and props built in code (no pack accessories, so the fit check has nothing to fit).
// World layout (studs, floor y 0); each place is its own group, shown only in its shots:
//   DOCK    origin. A New York pier along x (deck top y 1.5), water at y 0, the steamship moored at +z of the pier.
//   OFFICE  (300, 0, 0). The newspaper editor's office (open toward +z): desk, papers, THE WORLD sign, window.
//   AMIENS  (-300, 0, 0). The author's house front: stone facade, green door, steps (door on +z).
//   SEA     (0, 0, 600). Open ocean (the ship sails along +x through it); the Hong Kong and storm shots use it too.
//   PRAIRIE (0, 0, -600). A railway along x across flat grassland; the special train runs along +x.
//   STATION (600, 0, 0). The Jersey City platform (top y 1.2) along x with a canopy, a crowd area and the arrival clock.
// Props are built with their origin where the hand holds them and their front facing +z.
import * as THREE from 'three';
import { canvasTexture, rng, puff } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 18) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const DOCK = V(0, 0, 0), OFFICE = V(300, 0, 0), AMIENS = V(-300, 0, 0), SEA = V(0, 0, 600), PRAIRIE = V(0, 0, -600), STATION = V(600, 0, 0);
export const PIER_Y = 1.5, PLAT_Y = 1.2;

// ======================================================= water and ground ============================================
function waterMat(color = '#2f6f9a') { return std(color, { roughness: 0.18, metalness: 0.25, emissive: '#0d2638', emissiveIntensity: 0.35 }); }
export function water(g, w, d, color) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), waterMat(color)); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); return m; }
// rolling swell: a grid plane whose vertices are moved per frame (setWaves)
export function swell(g, w, d, n = 60, color = '#2c5f86') {
  const geo = new THREE.PlaneGeometry(w, d, n, n); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, std(color, { roughness: 0.25, metalness: 0.2, flatShading: true, emissive: '#0b2030', emissiveIntensity: 0.3 }));
  m.receiveShadow = true; m.userData.base = Float32Array.from(geo.attributes.position.array); g.add(m); return m;
}
export function setWaves(m, t, amp = 0.6) {
  const p = m.geometry.attributes.position, b = m.userData.base;
  for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; p.array[i * 3 + 1] = amp * (Math.sin(x * 0.12 + t * 1.3) + 0.6 * Math.sin(z * 0.17 - t * 1.7) + 0.3 * Math.sin((x + z) * 0.31 + t * 2.3)); }
  p.needsUpdate = true; m.geometry.computeVertexNormals();
}
export function grass(g, w, d, color = '#7aa04a') {
  const tex = canvasTexture(512, 512, (c, W) => { c.fillStyle = color; c.fillRect(0, 0, W, W); const r = rng(7); for (let i = 0; i < 4000; i++) { c.fillStyle = `hsl(${78 + r() * 20},${35 + r() * 20}%,${30 + r() * 18}%)`; c.fillRect(r() * W, r() * W, 2 + r() * 4, 4 + r() * 6); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 12, d / 12);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std('#ffffff', { map: tex, roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; g.add(m); return m;
}

// ======================================================= the steamship ===============================================
// Bow toward +x. Hull 34 long, 8 wide, deck at y 4.2 (relative to the waterline at 0). Two funnels, two masts, a rail.
// DECK_SPOT: where she stands at the rail on the near (+z) side, facing +z.
export const DECK_Y = 4.2, DECK_SPOT = V(2, DECK_Y, 3.2);
export function steamship() {
  const g = new THREE.Group(), black = std('#1d1f24', { roughness: 0.6 }), red = std('#a8262c', { roughness: 0.6 }), white = std('#f1efe8', { roughness: 0.6 }), wood = std('#a87a4a', { roughness: 0.8 });
  const hull = new THREE.Shape(); hull.moveTo(-17, -4); hull.lineTo(13, -4); hull.quadraticCurveTo(19, -1.5, 18, 0); hull.quadraticCurveTo(19, 1.5, 13, 4); hull.lineTo(-17, 4); hull.lineTo(-17, -4);
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 5.2, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -1.0, 0);
  const h = new THREE.Mesh(hg, black); h.castShadow = h.receiveShadow = true; g.add(h);
  const band = new THREE.Mesh(hg.clone(), red); band.scale.set(1.002, 0.22, 1.004); band.position.y = -0.8; g.add(band);
  const deckS = new THREE.Shape(); deckS.moveTo(-16.8, -3.8); deckS.lineTo(13, -3.8); deckS.quadraticCurveTo(18.6, -1.4, 17.6, 0); deckS.quadraticCurveTo(18.6, 1.4, 13, 3.8); deckS.lineTo(-16.8, 3.8);
  const dg = new THREE.ShapeGeometry(deckS); dg.rotateX(-Math.PI / 2); const deck = new THREE.Mesh(dg, wood); deck.position.y = DECK_Y + 0.01; deck.receiveShadow = true; g.add(deck);
  // superstructure and bridge
  g.add(box(14, 2.6, 5.4, white, -2, DECK_Y + 1.3, 0), box(5, 2.0, 5.8, white, 4.5, DECK_Y + 3.6, 0));
  for (let i = 0; i < 9; i++) g.add(box(0.7, 0.7, 0.05, std('#2a3448', { roughness: 0.2 }), -8 + i * 1.5, DECK_Y + 1.5, 2.73));
  const funnels = [];
  for (const x of [-4.5, 0.5]) { const f = cyl(1.0, 1.1, 6, std('#c7a02f', { roughness: 0.5 }), 20, x, DECK_Y + 5.6, 0); g.add(f, cyl(1.02, 1.02, 1.0, black, 20, x, DECK_Y + 8.2, 0)); funnels.push(V(x, DECK_Y + 8.8, 0)); }
  for (const x of [-12, 11]) g.add(cyl(0.18, 0.22, 13, wood, 8, x, DECK_Y + 6.5, 0));
  // rail along both sides
  for (const s of [-1, 1]) { g.add(box(26, 0.12, 0.12, white, -2, DECK_Y + 1.4, s * 3.75)); for (let x = -15; x <= 11; x += 1.3) g.add(box(0.1, 1.4, 0.1, white, x, DECK_Y + 0.7, s * 3.75)); }
  const name = label(6, 0.9, 600, 90, (c, w, hh) => { c.fillStyle = '#1d1f24'; c.fillRect(0, 0, w, hh); LG(c, 'AUGUSTA VICTORIA', w / 2, hh / 2 + 3, 62, '#f1efe8'); });
  name.position.set(12, 2.4, 4.05); g.add(name);
  g.userData = { funnels };
  return g;
}

// ======================================================= the dock (New York) =========================================
export function dock(scene) {
  const g = new THREE.Group(); g.position.copy(DOCK); scene.add(g);
  water(g, 900, 900, '#3b6f8f').position.y = 0.0;
  const plank = std('#8a6a48', { roughness: 0.9 });
  g.add(box(60, 0.4, 9, plank, 0, PIER_Y - 0.2, -2));
  for (let x = -29; x <= 29; x += 3) for (const z of [-6, 2]) g.add(cyl(0.35, 0.35, 3, std('#5a4330'), 8, x, 0, z));
  for (let i = 0; i < 6; i++) { const r = rng(10 + i); g.add(box(1.4, 1.2 + r() * 0.8, 1.4, std('#9a7448'), -18 + i * 2.6 + r(), PIER_Y + 0.7, -5 + r())); }
  // bollards and a rope to the ship
  for (const x of [-10, 8]) g.add(cyl(0.35, 0.45, 0.9, std('#2b2d33'), 12, x, PIER_Y + 0.45, 1.8));
  // the New York skyline behind (simple blocks in the haze)
  for (let i = 0; i < 26; i++) { const r = rng(40 + i); const hh = 14 + r() * 30; g.add(box(8 + r() * 8, hh, 8, std(['#8f8e9a', '#a19a8e', '#7d8494'][i % 3], { roughness: 0.9 }), -120 + i * 10, hh / 2 - 1, -80 - r() * 30)); }
  // the book: a giant open copy of the novel standing on the pier behind her (the hook)
  const book = new THREE.Group(); book.position.set(-5.5, PIER_Y, -2.5); book.rotation.y = Math.PI / 2; g.add(book);
  const cover = std('#7a1e24', { roughness: 0.6 });
  const pageL = label(5.2, 7, 520, 700, (c, w, hh) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, hh); LG(c, 'AROUND', w / 2, 150, 92, '#2b1d14'); LG(c, 'THE', w / 2, 260, 80, '#2b1d14'); LG(c, 'WORLD', w / 2, 370, 96, '#2b1d14'); MS(c, 'a novel', w / 2, 470, 40, '#5a4a3a'); });
  const pageR = label(5.2, 7, 520, 700, (c, w, hh) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, hh); MS(c, 'IN', w / 2, 120, 60, '#2b1d14'); LG(c, '80', w / 2, 330, 260, '#a8262c'); LG(c, 'DAYS', w / 2, 540, 110, '#2b1d14'); });
  const bl = new THREE.Group(); bl.position.set(0, 4.2, 0); bl.rotation.y = 0.32; book.add(bl); pageL.position.set(-2.6, 0, 0.06); bl.add(pageL, box(5.4, 7.3, 0.2, cover, -2.6, 0, -0.06));
  const br = new THREE.Group(); br.position.set(0, 4.2, 0); br.rotation.y = -0.32; book.add(br); pageR.position.set(2.6, 0, 0.06); br.add(pageR, box(5.4, 7.3, 0.2, cover, 2.6, 0, -0.06));
  book.add(box(0.5, 7.4, 0.5, cover, 0, 4.2, -0.2), box(0.25, 0.7, 2.4, std('#5a4330'), -3, 0.35, 1.0), box(0.25, 0.7, 2.4, std('#5a4330'), 3, 0.35, 1.0));
  // the "80" can be crossed out at the end: a red bar over the right page
  const cross = box(4.4, 0.6, 0.1, std('#e0283a', { emissive: '#e0283a', emissiveIntensity: 0.4 }), 2.6, 0.6, 0.2); cross.rotation.z = 0.5; cross.visible = false; br.add(cross);
  return { group: g, book, cross };
}

// ======================================================= the editor's office ========================================
export function office(scene) {
  const g = new THREE.Group(); g.position.copy(OFFICE); scene.add(g);
  g.add(box(26, 0.3, 18, std('#6b4a2e', { roughness: 0.8 }), 0, -0.15, 0));
  const wall = std('#c9b994', { roughness: 0.9 });
  g.add(box(26, 12, 0.4, wall, 0, 6, -7), box(0.4, 12, 18, wall, -11, 6, 0), box(0.4, 12, 18, wall, 11, 6, 0));
  for (let y = 0.6; y < 3; y += 0.8) g.add(box(26, 0.1, 0.1, std('#5a4330'), 0, y, -6.75));
  g.add(box(5, 4, 0.2, std('#9fc6e8', { emissive: '#a9cfe8', emissiveIntensity: 0.45, roughness: 0.2 }), 6, 6.5, -6.75), box(5.4, 0.3, 0.4, std('#5a4330'), 6, 4.4, -6.6));
  const sign = label(9, 1.6, 900, 160, (c, w, h) => { c.fillStyle = '#1d1f24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d4af37'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'THE WORLD', w / 2, h / 2 + 6, 110, '#f1efe8'); });
  sign.position.set(-3, 9.2, -6.75); g.add(sign);
  // desk (the editor sits behind it, facing +z), papers, an inkwell and a stack of newspapers
  const wood = std('#5a3820', { roughness: 0.55 });
  g.add(box(7, 0.35, 3.2, wood, 0, 2.7, -2.0), box(7, 2.5, 0.2, wood, 0, 1.35, -0.45), box(0.3, 2.6, 3.0, wood, -3.3, 1.3, -2.0), box(0.3, 2.6, 3.0, wood, 3.3, 1.3, -2.0));
  for (let i = 0; i < 5; i++) { const r = rng(60 + i); const p = box(1.3, 0.04, 1.0, std('#f4f1e8'), -2.2 + i * 0.9 + r() * 0.2, 2.9 + i * 0.01, -2.0 + r() * 0.6); p.rotation.y = r() - 0.5; g.add(p); }
  g.add(cyl(0.2, 0.25, 0.4, std('#1d1f24', { metalness: 0.3 }), 12, 2.3, 3.05, -2.5));
  for (let i = 0; i < 6; i++) g.add(box(2.4, 0.18, 1.6, std(i % 2 ? '#e8e2d2' : '#f4efe2'), -8, 0.1 + i * 0.19, -4));
  g.add(box(2.0, 0.3, 2.0, std('#3a3330'), 0, 1.7, -4.6), box(2.0, 2.6, 0.25, std('#3a3330'), 0, 3.1, -5.6));   // his chair
  const lamp = new THREE.PointLight('#ffe2b0', 0, 30, 1.4); lamp.position.set(0, 8, 2); g.add(lamp);
  return { group: g, lamp };
}

// ======================================================= the author's house (Amiens) =================================
export function amiens(scene) {
  const g = new THREE.Group(); g.position.copy(AMIENS); scene.add(g);
  grass(g, 200, 200, '#76984a');
  const stone = std('#d8cdb6', { roughness: 0.9 }), trim = std('#8f8370', { roughness: 0.8 });
  g.add(box(22, 14, 10, stone, 0, 7, -7), box(22.4, 0.5, 10.4, trim, 0, 14.2, -7));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(16, 6, 4), std('#4a5260', { roughness: 0.7 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.55); roof.position.set(0, 17.4, -7); roof.castShadow = true; g.add(roof);
  g.add(box(3.2, 5.6, 0.3, std('#2f5a3a', { roughness: 0.5 }), 0, 3.6, -1.85), box(3.8, 0.4, 0.6, trim, 0, 6.6, -1.8));
  for (let i = 0; i < 3; i++) g.add(box(5 - i * 0.6, 0.3, 1.2 - i * 0.2, trim, 0, 0.15 + i * 0.3, -1.0 + i * 0.2));
  for (const x of [-7, 7]) for (const y of [4, 10]) { g.add(box(2.6, 3.2, 0.2, std('#9fc6e8', { roughness: 0.2 }), x, y, -1.88), box(3.0, 0.3, 0.4, trim, x, y - 1.75, -1.75)); }
  const plate = label(3.2, 0.9, 320, 90, (c, w, h) => { c.fillStyle = '#1d3d8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.strokeRect(5, 5, w - 10, h - 10); LG(c, 'AMIENS', w / 2, h / 2 + 4, 56, '#ffffff'); });
  plate.position.set(4.2, 4.6, -1.7); g.add(plate);
  for (let i = 0; i < 14; i++) { const r = rng(80 + i); const x = (i % 2 ? 1 : -1) * (13 + r() * 30), z = -10 + r() * 40; g.add(cyl(0.4, 0.5, 4, std('#5b3a24'), 7, x, 2, z), sph(2.6 + r(), std('#3d7348', { roughness: 0.85 }), x, 5.4, z, 10)); }
  return { group: g };
}

// ======================================================= the sea =====================================================
export function sea(scene) {
  const g = new THREE.Group(); g.position.copy(SEA); scene.add(g);
  const s = swell(g, 400, 400, 80);
  return { group: g, swell: s };
}

// ======================================================= the prairie railway =========================================
export function prairie(scene) {
  const g = new THREE.Group(); g.position.copy(PRAIRIE); scene.add(g);
  grass(g, 1200, 400, '#a3a14e');
  const ballast = new THREE.Mesh(new THREE.PlaneGeometry(1200, 3.6), std('#8a7f72', { roughness: 0.95 })); ballast.rotation.x = -Math.PI / 2; ballast.position.y = 0.03; g.add(ballast);
  const tie = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.2, 3.2), std('#5a4330', { roughness: 0.9 }), 600);
  const m = new THREE.Matrix4(); for (let i = 0; i < 600; i++) { m.makeTranslation(-600 + i * 2, 0.12, 0); tie.setMatrixAt(i, m); } tie.receiveShadow = true; g.add(tie);
  for (const z of [-0.75, 0.75]) g.add(box(1200, 0.18, 0.14, std('#7d828a', { metalness: 0.7, roughness: 0.35 }), 0, 0.3, z));
  for (let i = 0; i < 60; i++) { const r = rng(120 + i); g.add(cyl(0.12, 0.12, 6, std('#6b5a44'), 6, -590 + i * 20, 3, -6)); }   // telegraph poles
  const wire = box(1200, 0.05, 0.05, std('#222'), 0, 5.8, -6); g.add(wire);
  for (let i = 0; i < 8; i++) { const r = rng(140 + i); const mtn = new THREE.Mesh(new THREE.ConeGeometry(40 + r() * 30, 30 + r() * 25, 5), std('#8f8aa0', { roughness: 1, flatShading: true })); mtn.position.set(-500 + i * 140, 12, -190 - r() * 40); g.add(mtn); }
  return { group: g };
}
// The special train along +x: a 4-4-0 locomotive (front at +x) with its tender and one carriage behind.
// Origin at the rail head under the locomotive's middle. WINDOW: where she leans out of the carriage (local).
export function train() {
  const g = new THREE.Group(), black = std('#1d1f24', { roughness: 0.5, metalness: 0.3 }), red = std('#a8262c', { roughness: 0.5 }), brass = std('#c7a02f', { metalness: 0.7, roughness: 0.3 });
  const boiler = cyl(1.3, 1.3, 8, black, 24, 1.2, 3.0, 0); boiler.rotation.z = Math.PI / 2; g.add(boiler);
  g.add(cyl(0.45, 0.7, 2.2, black, 16, 4.0, 4.9, 0), cyl(0.5, 0.5, 0.8, brass, 16, 1.4, 4.5, 0));
  const cow = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 4), red); cow.rotation.z = -Math.PI / 2; cow.rotation.x = Math.PI / 4; cow.position.set(5.9, 1.1, 0); g.add(cow);
  g.add(box(3.2, 3.6, 3.0, red, -3.8, 4.0, 0), box(3.6, 0.3, 3.4, black, -3.8, 5.95, 0));
  g.add(box(0.1, 1.2, 1.4, std('#2a3448', { roughness: 0.2 }), -2.2, 4.6, 1.52));
  g.add(sph(0.45, std('#fff4c8', { emissive: '#ffe08a', emissiveIntensity: 2 }), 5.2, 3.2, 0, 14));
  const wheels = [];
  for (const [x, r] of [[3.6, 0.7], [2.0, 0.7], [-0.6, 1.2], [-3.0, 1.2]]) for (const z of [-1.2, 1.2]) { const w = cyl(r, r, 0.3, red, 20, x, r + 0.3, z); w.rotation.x = Math.PI / 2; g.add(w); wheels.push(w); }
  const tender = box(4.6, 3.0, 3.0, black, -8.4, 2.6, 0); g.add(tender);
  const car = new THREE.Group(); car.position.set(-17.5, 0, 0); g.add(car);
  car.add(box(12, 4.4, 3.4, std('#6b2a1e', { roughness: 0.6 }), 0, 3.4, 0), box(12.6, 0.4, 3.8, black, 0, 5.8, 0));
  for (let i = 0; i < 5; i++) car.add(box(1.4, 1.3, 0.1, std('#e8d9a8', { emissive: '#ffd27a', emissiveIntensity: 0.3 }), -4.5 + i * 2.25, 4.0, 1.72));
  const sign = label(6, 0.8, 600, 80, (c, w, h) => { c.fillStyle = '#1d1f24'; c.fillRect(0, 0, w, h); LG(c, 'MISS NELLIE BLY SPECIAL', w / 2, h / 2 + 3, 48, '#e8d9a8'); }); sign.position.set(0, 2.2, 1.75); car.add(sign);
  car.add(box(2.2, 0.25, 3.4, black, -7.1, 1.45, 0));                                   // rear platform
  for (const z of [-1.6, 1.6]) car.add(box(2.2, 0.1, 0.1, brass, -7.1, 2.9, z));
  car.add(box(0.1, 0.1, 3.3, brass, -8.15, 2.9, 0)); for (const z of [-1.6, -0.8, 0, 0.8, 1.6]) car.add(box(0.08, 1.4, 0.08, brass, -8.15, 2.2, z));
  for (const x of [-4, 4]) for (const z of [-1.2, 1.2]) { const w = cyl(0.6, 0.6, 0.3, black, 16, x, 0.9, z); w.rotation.x = Math.PI / 2; car.add(w); wheels.push(w); }
  g.userData = { wheels, sign, stack: V(4.0, 6.2, 0), WINDOW: V(-17.5 + 2.25, 0, 1.75), PLATFORM: V(-17.5 - 7.0, 1.58, 0.5) };
  return g;
}

// ======================================================= the station (Jersey City) ===================================
export function station(scene) {
  const g = new THREE.Group(); g.position.copy(STATION); scene.add(g);
  g.add(box(70, 0.3, 40, std('#7d7f86', { roughness: 0.9 }), 0, -0.15, 0));
  g.add(box(60, PLAT_Y, 10, std('#b9b1a3', { roughness: 0.9 }), 0, PLAT_Y / 2, 2));
  for (const z of [-4.2, -2.7]) g.add(box(70, 0.18, 0.14, std('#7d828a', { metalness: 0.7, roughness: 0.35 }), 0, 0.3, z));
  const iron = std('#2b2d33', { roughness: 0.5, metalness: 0.4 });
  for (let x = -27; x <= 27; x += 9) g.add(cyl(0.25, 0.25, 9, iron, 10, x, PLAT_Y + 4.5, 5.5));
  g.add(box(60, 0.4, 9, std('#5a3a2a', { roughness: 0.7 }), 0, PLAT_Y + 9.2, 3.0));
  const sign = label(14, 2, 1400, 200, (c, w, h) => { c.fillStyle = '#1d3d8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'JERSEY CITY', w / 2, h / 2 + 6, 120, '#ffffff'); });
  sign.position.set(0, PLAT_Y + 7.6, 7.5); g.add(sign);
  // bunting
  for (let i = 0; i < 24; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 3), std(['#e63946', '#ffffff', '#1d3d8a'][i % 3], { side: THREE.DoubleSide })); f.rotation.z = Math.PI; f.position.set(-26 + i * 2.25, PLAT_Y + 8.4, 7.4); g.add(f); }
  // the wall behind the platform with a big clock
  g.add(box(70, 16, 0.6, std('#a4513f', { roughness: 0.85 }), 0, 8, 7.8 + 3));
  const clock = label(4, 4, 300, 300, (c, w, h) => { c.fillStyle = '#fbfaf2'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 6, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = '#1d1f24'; c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.fillStyle = '#1d1f24'; c.fillRect(w / 2 + Math.sin(a) * 120 - 4, h / 2 - Math.cos(a) * 120 - 10, 8, 20); } c.lineCap = 'round'; c.lineWidth = 10; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 60, h / 2 + 50); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + 40, h / 2 + 100); c.stroke(); });
  clock.position.set(10, PLAT_Y + 12, 10.45); clock.rotation.y = Math.PI; g.add(clock);
  return { group: g };
}

// ======================================================= props =======================================================
// Her one small travel bag: GRIP at the handle (held in one fist, the bag hangs below).
export function travelBag() {
  const g = new THREE.Group(), leather = std('#6b3a1e', { roughness: 0.6 });
  g.add(box(1.1, 0.85, 0.55, leather, 0, -0.62, 0), box(1.14, 0.12, 0.6, std('#4a2814'), 0, -0.22, 0));
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16, Math.PI), std('#3a2010', { roughness: 0.5 })); h.position.y = -0.18; g.add(h);
  g.add(box(0.14, 0.12, 0.04, std('#c7a02f', { metalness: 0.7, roughness: 0.3 }), 0, -0.3, 0.3));
  return g;
}
// The book (small, for the author): GRIP at its spine bottom, held upright, cover facing +z.
export function smallBook() {
  const g = new THREE.Group();
  g.add(box(0.75, 1.0, 0.18, std('#7a1e24', { roughness: 0.6 }), 0, 0.45, 0));
  const c = label(0.6, 0.85, 120, 170, (x, w, h) => { x.fillStyle = '#7a1e24'; x.fillRect(0, 0, w, h); LG(x, '80', w / 2, h / 2, 70, '#e8c45a'); MS(x, 'DAYS', w / 2, h / 2 + 50, 24, '#e8c45a'); });
  c.position.set(0, 0.45, 0.095); g.add(c);
  return g;
}
// A telegram: GRIP at its bottom edge, held up facing +z.
export function telegram() {
  const g = new THREE.Group();
  const p = label(1.2, 0.85, 240, 170, (x, w, h) => { x.fillStyle = '#f4ecd0'; x.fillRect(0, 0, w, h); x.fillStyle = '#c7a02f'; x.fillRect(0, 0, w, 30); MS(x, 'TELEGRAM', w / 2, 16, 22, '#1d1f24'); MS(x, 'RIVAL SENT', w / 2, 80, 26, '#1d1f24'); MS(x, 'THE OTHER WAY', w / 2, 120, 26, '#1d1f24'); }, { side: THREE.DoubleSide });
  p.position.y = 0.42; g.add(p);
  return g;
}
// smoke puffs for the funnels and the locomotive
export function smoke(n = 10) { const out = []; for (let i = 0; i < n; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#55565c'); out.push(p); } return out; }
