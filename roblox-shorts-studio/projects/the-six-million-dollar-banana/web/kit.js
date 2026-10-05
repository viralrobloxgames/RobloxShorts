// The Six Million Dollar Banana: sets, props and clothing shells built in code (no pack accessories, so the fit check
// has nothing to fit). World layout (studs, floor y 0). Places are far apart so they never share a frame:
//   STAGE    origin. The buyer's stage (2024): dark floor, a big screen reading $6,200,000, spotlights, the crowd in front.
//   FAIR     (200, 0, 0). The Miami art fair booth (2019): white walls, the banana taped to the back wall at WALL_BANANA.
//   SEOUL    (300, 0, 0). A white museum room in Seoul with the banana on the wall.
//   AUCTION  (0, 0, 300). The New York auction room: podium, a bid board, rows of chairs, the banana on a display wall.
//   STAND    (-300, 0, 0). A New York street fruit stand: awning, crates of fruit, bunches of bananas, a 25 cent sign.
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
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

export const STAGE = V(0, 0, 0), FAIR = V(200, 0, 0), SEOUL = V(300, 0, 0), AUCTION = V(0, 0, 300), STAND = V(-300, 0, 0);
export const WALL_Z = -6, BANANA_Y = 4.6;                  // the banana on a wall: 1.6 m up (4.6 studs), wall face z -6

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, buttons = null, collar = null, tie = null } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 4; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, 0, 1.75 - i * 0.48 - hem * 0.2, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (tie) { const sh = box(0.62, 0.9, 0.04, std('#f4f2ec'), 0, 1.6, 0.56), ti = box(0.2, 0.8, 0.05, std(tie), 0, 1.58, 0.58); actor.bones.Torso.add(sh, ti); parts.push(sh, ti); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}
// A backpack (the student in Seoul), on the torso's back.
export function backpack(actor) {
  const m = std('#e63946', { roughness: 0.7 }), parts = [box(1.5, 1.6, 0.6, m, 0, 1.05, -0.85), box(1.1, 0.6, 0.3, std('#c1121f'), 0, 0.6, -1.2)];
  for (const s of [-0.45, 0.45]) parts.push(box(0.2, 1.9, 0.08, std('#2b2d42'), s, 1.1, 0.57));
  for (const p of parts) actor.bones.Torso.add(p);
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}

// ======================================================= props =======================================================
// A banana, about 1.1 studs long (drawn a little bigger than life so it reads). Built along a curve in its own x-y
// plane: stem end at the origin, curving to the tip at +x. `left` (0..1) is how much is still there after bites: the
// tip end disappears first. GRIP: the stem end in the fist (origin), banana pointing forward along +x.
export function banana() {
  const g = new THREE.Group();
  const curve = new THREE.QuadraticBezierCurve3(V(0, 0, 0), V(0.55, -0.32, 0), V(1.1, 0.02, 0));
  const yellow = std('#f6d13a', { roughness: 0.45 }), brown = std('#5a3d1e', { roughness: 0.7 }), flesh = std('#f8efc6', { roughness: 0.6 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.13, 8, false), yellow); tube.castShadow = true; g.add(tube);
  const stem = cyl(0.05, 0.07, 0.18, std('#6b8e3a'), 8); stem.position.set(-0.07, 0.02, 0); stem.rotation.z = Math.PI / 2 + 0.4; g.add(stem);
  const tip = sph(0.07, brown, 1.1, 0.02, 0, 8); g.add(tip);
  const bite = new THREE.Mesh(new THREE.CircleGeometry(0.125, 12), flesh); g.add(bite); bite.visible = false;
  g.userData = { curve, yellow, tube, tip, bite, left: 1 };
  g.userData.setLeft = (k) => {
    k = Math.max(0.05, Math.min(1, k));
    if (Math.abs(k - g.userData.left) < 1e-3) return;
    g.userData.left = k; tube.geometry.dispose();
    const pts = curve.getPoints(24).slice(0, Math.max(2, Math.round(24 * k) + 1)), sub = new THREE.CatmullRomCurve3(pts);
    tube.geometry = new THREE.TubeGeometry(sub, 16, 0.13, 8, false);
    tip.visible = k > 0.98; bite.visible = k <= 0.98;
    const end = pts[pts.length - 1], tan = sub.getTangent(1); bite.position.copy(end); bite.lookAt(end.clone().add(tan));
  };
  g.userData.setBrown = (b) => { yellow.color.set(b ? '#7a5a1e' : '#f6d13a'); };
  return g;
}
// A strip of grey duct tape across the banana on the wall. Origin at its centre, flat against the wall (+z out).
export function tape() { const m = box(0.9, 0.24, 0.03, std('#a9adb5', { roughness: 0.4, metalness: 0.2 })); m.rotation.z = -0.55; const g = new THREE.Group(); g.add(m); return g; }
// A roll of duct tape. GRIP: origin in the fist.
export function tapeRoll() { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.12, 8, 18), std('#a9adb5', { roughness: 0.4, metalness: 0.2 })); r.castShadow = true; g.add(r); return g; }
// An auction paddle with a number. GRIP: origin in the fist, paddle above it facing +z.
export function paddle(n) {
  const g = new THREE.Group(); g.add(cyl(0.05, 0.05, 0.8, std('#3a2416'), 8, 0, 0.3, 0));
  const p = label(0.8, 0.8, 128, 128, (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 2, 0, 7); x.fill(); LG(x, String(n), w / 2, h / 2 + 4, 62, '#16182a'); });
  p.position.set(0, 1.05, 0.03); const back = p.clone(); back.rotation.y = Math.PI; back.position.z = -0.03; g.add(p, back); return g;
}
// A gavel. GRIP: origin in the fist, head forward.
export function gavel() { const g = new THREE.Group(), w = std('#5a3820', { roughness: 0.5 }); g.add(cyl(0.05, 0.05, 0.8, w, 8, 0, 0, 0.35)); g.children[0].rotation.x = Math.PI / 2; const h = cyl(0.14, 0.14, 0.5, w, 12, 0, 0, 0.78); g.add(h); return g; }
// A phone filming. GRIP: origin in the fist.
export function smartphone() {
  const g = new THREE.Group(); g.add(box(0.5, 0.95, 0.08, std('#16181f', { roughness: 0.3 }), 0, 0.42, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.86), new THREE.MeshStandardMaterial({ color: '#9fd0f5', emissive: '#6fb3ff', emissiveIntensity: 0.6 })); scr.position.set(0, 0.42, -0.045); scr.rotation.y = Math.PI; g.add(scr);
  return g;
}
// A bunch of bananas lying in a crate (fruit stand). Origin at its base.
function bunch(seed) { const g = new THREE.Group(), r = rng(seed); for (let i = 0; i < 5; i++) { const b = banana(); b.rotation.set(-Math.PI / 2 + 0.2, (i - 2) * 0.22 + (r() - 0.5) * 0.1, 0); b.position.set((i - 2) * 0.12, 0.15, 0.2); b.scale.setScalar(0.9); g.add(b); } return g; }

// ======================================================= sets ========================================================
function wallBanana(g, x, z, withTape = true) {
  const b = banana(); b.position.set(x - 0.5, BANANA_Y, z + 0.15); b.rotation.set(0, 0, -0.55); g.add(b);
  const t = tape(); t.position.set(x, BANANA_Y - 0.28, z + 0.3); if (withTape) g.add(t);
  return { banana: b, tape: t };
}
function plaque(text, sub) {
  return label(1.6, 0.6, 320, 120, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d0d0d0'; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4); MS(x, text, 16, 40, 30, '#16182a', 'left'); x.font = '600 22px Montserrat'; x.fillStyle = '#5a6478'; x.textAlign = 'left'; x.fillText(sub, 16, 84); });
}
// ---------- the buyer's stage ----------
export function stage(scene) {
  const g = new THREE.Group(); g.name = 'stage'; g.position.copy(STAGE); scene.add(g);
  g.add(flat(80, 60, std('#14161f', { roughness: 0.6 }), 0, 0, 10));
  g.add(box(22, 1.2, 10, std('#1f2230', { roughness: 0.5 }), 0, 0.6, -4));                     // the stage itself (top y 1.2)
  g.add(box(22, 0.08, 0.2, std('#ffd23f', { emissive: '#ffd23f', emissiveIntensity: 1.5 }), 0, 1.22, 0.95));
  const screen = label(16, 9, 1024, 576, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1d1a3a'); gr.addColorStop(1, '#3a1d5a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    LG(x, '$6,200,000', w / 2, h / 2 - 20, 170, '#ffd23f'); MS(x, 'ONE BANANA', w / 2, h / 2 + 120, 54, '#ffffff');
  }, { emissive: '#ffffff', emissiveIntensity: 0.55 });
  screen.position.set(0, 7.4, -8.8); g.add(screen, box(16.6, 9.6, 0.3, std('#0a0b10'), 0, 7.4, -9.0));
  const table = new THREE.Group(); table.position.set(2.6, 1.2, -2.6); g.add(table);
  table.add(box(2.6, 0.15, 1.4, std('#f4f2ec'), 0, 2.4, 0), cyl(0.12, 0.12, 2.4, std('#c9ced6', { metalness: 0.7 }), 10, 0, 1.2, 0));
  const lamp = new THREE.SpotLight('#fff1d6', 0, 40, 0.45, 0.5, 1); lamp.position.set(0, 16, 6); lamp.target.position.set(0, 2, -3); g.add(lamp, lamp.target);
  const wash = new THREE.PointLight('#8f7fff', 0, 40, 1.2); wash.position.set(0, 9, -6); g.add(wash);
  return { group: g, lamp, wash, top: 1.2, table };
}
// ---------- the Miami art fair booth ----------
export function fair(scene) {
  const g = new THREE.Group(); g.name = 'fair'; g.position.copy(FAIR); scene.add(g);
  g.add(flat(60, 40, std('#a9a49a', { roughness: 0.6 }), 0, 0, 4));
  const white = std('#e4e1da', { roughness: 0.9 });
  g.add(box(18, 12, 0.5, white, 0, 6, WALL_Z - 0.25), box(0.5, 12, 14, white, -9, 6, 1), box(0.5, 12, 14, white, 9, 6, 1));
  const sign = label(8, 1.2, 800, 120, (x, w, h) => { x.fillStyle = '#16182a'; x.fillRect(0, 0, w, h); MS(x, 'ART FAIR · MIAMI BEACH', w / 2, h / 2 + 2, 64, '#ffffff'); });
  sign.position.set(0, 10.5, WALL_Z + 0.02); g.add(sign);
  const pl = plaque('COMEDIAN, 2019', 'banana, duct tape'); pl.position.set(1.7, BANANA_Y - 0.9, WALL_Z + 0.02); g.add(pl);
  // a few other artworks on the side walls
  for (const [x, ry, c] of [[-8.7, Math.PI / 2, '#e63946'], [8.7, -Math.PI / 2, '#3a86ff']]) { const a = box(0.1, 3.6, 4.6, std(c, { roughness: 0.6 }), x, 5.6, -1); a.rotation.y = 0; g.add(a); }
  // palm trees through the hall's far window
  const win = label(10, 3, 500, 150, (x, w, h) => { const s = x.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#5fb8f0'); s.addColorStop(1, '#bfe7ff'); x.fillStyle = s; x.fillRect(0, 0, w, h); x.fillStyle = '#2a7a3a'; for (const px of [60, 220, 400]) { x.fillRect(px, 40, 10, 110); for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(px + 5 + Math.cos(i * 1.3) * 26, 40 + Math.sin(i * 1.3) * 10, 30, 8, i * 1.3, 0, 7); x.fill(); } } }, { emissive: '#ffffff', emissiveIntensity: 0.4 });
  win.position.set(0, 13.6, WALL_Z + 0.02); g.add(win);
  const lamp = new THREE.PointLight('#ffffff', 0, 60, 1.0); lamp.position.set(0, 13, 5); g.add(lamp);
  const spot = new THREE.SpotLight('#fff8ec', 0, 30, 0.3, 0.6, 1); spot.position.set(0, 12, 2); spot.target.position.set(0, BANANA_Y, WALL_Z); g.add(spot, spot.target);
  return { group: g, lamp, spot };
}
// ---------- the Seoul museum ----------
export function seoul(scene) {
  const g = new THREE.Group(); g.name = 'seoul'; g.position.copy(SEOUL); scene.add(g);
  g.add(flat(50, 40, std('#9a958b', { roughness: 0.5 }), 0, 0, 4));
  const white = std('#e6e4df', { roughness: 0.9 });
  g.add(box(24, 14, 0.5, white, 0, 7, WALL_Z - 0.25), box(0.5, 14, 16, white, -12, 7, 2), box(0.5, 14, 16, white, 12, 7, 2));
  const sign = label(7, 1.0, 700, 100, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); MS(x, 'MUSEUM · SEOUL', w / 2, h / 2 + 2, 60, '#16182a'); });
  sign.position.set(0, 11, WALL_Z + 0.02); g.add(sign);
  const pl = plaque('COMEDIAN', 'please do not touch'); pl.position.set(1.7, BANANA_Y - 0.9, WALL_Z + 0.02); g.add(pl);
  for (let i = 0; i < 4; i++) g.add(cyl(0.12, 0.12, 2.4, std('#c9a03a', { metalness: 0.7 }), 10, -3 + i * 2, 1.2, WALL_Z + 3));
  const lamp = new THREE.PointLight('#ffffff', 0, 60, 1.0); lamp.position.set(0, 13, 5); g.add(lamp);
  return { group: g, lamp };
}
// ---------- the auction room ----------
export const PODIUM = V(-5, 0, -2.5);
export function auction(scene) {
  const g = new THREE.Group(); g.name = 'auction'; g.position.copy(AUCTION); scene.add(g);
  g.add(flat(60, 50, std('#3a1d2a', { roughness: 0.9 }), 0, 0, 6));
  const wall = std('#1f2a44', { roughness: 0.85 });
  g.add(box(36, 16, 0.5, wall, 0, 8, -8.25), box(0.5, 16, 30, wall, -18, 8, 4), box(0.5, 16, 30, wall, 18, 8, 4));
  const sign = label(10, 1.4, 1000, 140, (x, w, h) => { x.fillStyle = '#1f2a44'; x.fillRect(0, 0, w, h); x.font = '700 84px "Playfair Display"'; x.fillStyle = '#e0b23a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AUCTION · NEW YORK', w / 2, h / 2 + 4); });
  sign.position.set(0, 13.6, -7.98); g.add(sign);
  // the display wall with the banana, and the podium
  g.add(box(6, 8, 0.4, std('#d9d4c8'), 2.5, 4, -7.6));
  const pod = new THREE.Group(); pod.position.copy(PODIUM); g.add(pod);
  pod.add(box(2.6, 3.6, 1.6, std('#5a3820', { roughness: 0.5 }), 0, 1.8, 0), box(2.8, 0.2, 1.8, std('#3a2416'), 0, 3.7, 0));
  const pl = label(2.0, 0.7, 200, 70, (x, w, h) => { x.fillStyle = '#e0b23a'; x.fillRect(0, 0, w, h); LG(x, 'LOT 1', w / 2, h / 2 + 3, 50, '#16182a'); }); pl.position.set(0, 2.6, 0.82); pod.add(pl);
  // rows of chairs (the bidders stand among them)
  const ch = std('#c9a03a', { metalness: 0.4, roughness: 0.4 }), seat = std('#9b1b30', { roughness: 0.8 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const c = new THREE.Group(); c.position.set(-7.5 + i * 3, 0, 4.5 + r * 3.4); c.add(box(1.8, 0.25, 1.8, seat, 0, 1.9, 0), box(1.8, 2.0, 0.2, ch, 0, 3.0, 0.85)); for (const dx of [-0.75, 0.75]) for (const dz of [-0.75, 0.75]) c.add(box(0.12, 1.9, 0.12, ch, dx, 0.95, dz)); g.add(c); }
  const lamp = new THREE.PointLight('#ffe9c8', 0, 60, 1.0); lamp.position.set(0, 13, 6); g.add(lamp);
  const spot = new THREE.SpotLight('#fff8ec', 0, 30, 0.35, 0.6, 1); spot.position.set(2.5, 13, 0); spot.target.position.set(2.5, BANANA_Y, -7.4); g.add(spot, spot.target);
  return { group: g, lamp, spot };
}
// ---------- the New York fruit stand ----------
export const COUNTER = V(0, 3.0, -1.2);
export function stand(scene) {
  const g = new THREE.Group(); g.name = 'stand'; g.position.copy(STAND); scene.add(g);
  g.add(flat(120, 40, std('#9a978f', { roughness: 0.9 }), 0, 0, 0));
  g.add(flat(120, 14, std('#3c3f45', { roughness: 0.9 }), 0, 0.01, 14));
  // buildings behind
  [[-20, '#8a5a44', 30], [-4, '#c9b28e', 36], [12, '#6b7a8a', 28], [28, '#9a4a3a', 34]].forEach(([x, c, h]) => {
    g.add(box(15, h, 6, std(c, { roughness: 0.9 }), x, h / 2, -12));
    for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) g.add(box(2, 2.4, 0.2, std('#2b3a4a', { emissive: '#ffcf80', emissiveIntensity: (r + i) % 3 ? 0.05 : 0.4 }), x - 5.5 + i * 3.6, 6 + r * 4, -8.95));
  });
  // the stand: counter, crates, awning, sign
  const wood = std('#7a4b2c', { roughness: 0.7 });
  g.add(box(9, COUNTER.y, 2.6, std('#3a6b3a', { roughness: 0.6 }), COUNTER.x, COUNTER.y / 2, COUNTER.z));
  const fruit = [['#f6d13a', 'ban'], ['#e63946', 'apple'], ['#f4a261', 'orange'], ['#6a994e', 'pear']];
  fruit.forEach(([c, k], i) => {
    const x = COUNTER.x - 3.3 + i * 2.2; const crate = box(2.0, 0.6, 1.8, wood, x, COUNTER.y + 0.3, COUNTER.z - 0.2); crate.rotation.x = -0.25; g.add(crate);
    if (k === 'ban') { for (let j = 0; j < 2; j++) { const b = bunch(i * 7 + j); b.position.set(x - 0.4 + j * 0.7, COUNTER.y + 0.55, COUNTER.z - 0.3); g.add(b); } }
    else for (let j = 0; j < 9; j++) g.add(sph(0.26, std(c, { roughness: 0.5 }), x - 0.6 + (j % 3) * 0.6, COUNTER.y + 0.75 + (j > 5 ? 0.15 : 0), COUNTER.z - 0.8 + Math.floor(j / 3) * 0.55, 10));
  });
  const awn = canvasTexture(256, 64, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#2a9d8f'; x.fillRect(i * 32, 0, 32, h); } });
  const aw = box(10, 0.2, 4, std('#ffffff', { map: awn }), COUNTER.x, 8.2, COUNTER.z - 0.4); aw.rotation.x = 0.25; g.add(aw);
  for (const x of [-4.7, 4.7]) g.add(cyl(0.1, 0.1, 8.2, std('#c9ced6', { metalness: 0.6 }), 8, COUNTER.x + x, 4.1, COUNTER.z - 2.2));
  const sg = label(3.4, 1.6, 340, 160, (x, w, h) => { x.fillStyle = '#16182a'; x.fillRect(0, 0, w, h); LG(x, 'BANANAS', w / 2, 52, 56, '#f6d13a'); LG(x, '25¢', w / 2, 116, 70, '#ffffff'); });
  sg.position.set(COUNTER.x - 2.2, 5.6, COUNTER.z + 0.2); g.add(sg);
  // a yellow cab at the kerb
  const cab = new THREE.Group(); cab.position.set(14, 0, 9.5); g.add(cab); const y = std('#f6c80e', { metalness: 0.3, roughness: 0.4 });
  cab.add(box(8, 1.6, 3.4, y, 0, 1.5, 0), box(4.4, 1.3, 3.1, y, 0.3, 2.9, 0), box(4, 1.0, 3.14, std('#2b3a4a', { roughness: 0.1 }), 0.3, 2.9, 0), box(1.2, 0.4, 0.6, std('#ffffff'), 0.3, 3.75, 0));
  for (const [x, z] of [[-2.6, 1.6], [-2.6, -1.6], [2.6, 1.6], [2.6, -1.6]]) { const w = cyl(0.75, 0.75, 0.5, std('#1a1a1a'), 16, x, 0.75, z); w.rotation.x = Math.PI / 2; cab.add(w); }
  const lamp = new THREE.PointLight('#fff1d6', 0, 40, 1.1); lamp.position.set(0, 9, 4); g.add(lamp);
  return { group: g, lamp };
}
export { wallBanana };
