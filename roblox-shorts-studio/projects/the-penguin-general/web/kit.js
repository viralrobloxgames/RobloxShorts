// The Penguin General: sets, props, clothing shells and the penguin, all built in code (no pack accessories, so the fit
// check has nothing to fit). One place, the zoo (origin, floor y 0): the penguin pool on the left (x < -6), the paved
// parade path along z 3 in front of a low wall and trees, the castle on the skyline, the statue plinth at STATUE.
// Every prop is built with its origin where it is held (see GRIP notes) and its front facing +z.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

export const ZOO = V(0, 0, 0), POOL = V(-14, 0, -2), STATUE = V(12, 0, -3.5), PATH_Z = 3.2, LINE_Z = 0.6;

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, buttons = null, collar = null, belt = null } = {}) {
  const m = std(color, { roughness: 0.75 }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 4; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.6, roughness: 0.3 }), 12, 0, 1.75 - i * 0.4, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (belt) { const b = box(2.16, 0.26, 1.16, std(belt, { roughness: 0.5 }), 0, 0.28, 0), bk = box(0.36, 0.3, 0.06, std('#e0b23a', { metalness: 0.8, roughness: 0.3 }), 0, 0.28, 0.6); actor.bones.Torso.add(b, bk); parts.push(b, bk); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, set visible(v) { for (const p of parts) p.visible = v; } };
}
export const guardUniform = (a) => dress(a, { color: '#1b2235', hem: 0.3, buttons: '#e0b23a', collar: '#c1121f', belt: '#f4f2ec' });

// ======================================================= the penguin =================================================
// A block-style king penguin about 3 studs tall, facing +z, origin at its feet. Parts: body (rolls for the waddle),
// head (turns), flippers (flap), feet (step). `bronze` makes the statue.
export function penguin({ bronze = false } = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(), fl = new THREE.Group(), fr = new THREE.Group(), ftL = new THREE.Group(), ftR = new THREE.Group();
  const M = bronze ? (() => { const b = std('#8a5a2b', { metalness: 0.85, roughness: 0.35 }); return { blk: b, wht: b, org: b, yel: b, eye: b, ewh: b }; })()
    : { blk: std('#1d1f27', { roughness: 0.5 }), wht: std('#f6f4ee', { roughness: 0.6 }), org: std('#f08a24', { roughness: 0.45 }), yel: std('#f6c84a', { roughness: 0.5 }), eye: std('#0b0b0f', { roughness: 0.2 }), ewh: std('#ffffff', { roughness: 0.3 }) };
  g.add(body); body.position.y = 0.25;
  body.add(box(1.5, 2.0, 1.25, M.blk, 0, 1.0, 0), box(1.15, 1.75, 0.12, M.wht, 0, 0.95, 0.62), box(1.3, 0.3, 1.0, M.wht, 0, 0.12, 0.08));
  body.add(box(0.9, 0.35, 0.1, M.yel, 0, 1.75, 0.63));                     // the golden bib at the top of the chest
  body.add(head); head.position.set(0, 2.0, 0.05);
  head.add(box(1.1, 0.95, 1.0, M.blk, 0, 0.45, 0));
  for (const s of [-1, 1]) head.add(box(0.08, 0.45, 0.35, M.yel, s * 0.56, 0.3, -0.05));   // the orange ear patches
  const beak = box(0.22, 0.2, 0.75, M.blk, 0, 0.38, 0.8); head.add(beak); head.add(box(0.2, 0.08, 0.5, M.org, 0, 0.3, 0.75));
  for (const s of [-1, 1]) { head.add(box(0.24, 0.24, 0.05, M.ewh, s * 0.28, 0.6, 0.5), box(0.12, 0.14, 0.06, M.eye, s * 0.28, 0.6, 0.53)); }
  for (const [grp, s] of [[fl, 1], [fr, -1]]) { body.add(grp); grp.position.set(s * 0.78, 1.65, 0); grp.add(box(0.14, 1.4, 0.5, M.blk, 0, -0.7, 0)); }
  for (const [grp, s] of [[ftL, 1], [ftR, -1]]) { g.add(grp); grp.position.set(s * 0.38, 0, 0.1); grp.add(box(0.42, 0.25, 0.75, M.org, 0, 0.125, 0.2)); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { body, head, fl, fr, ftL, ftR };
  return g;
}
// Pose: phase = distance walked / stride (waddle cycle); moving 0..1; look = head yaw; flap = flipper lift 0..1.
export function posePenguin(p, { phase = 0, moving = 0, look = 0, flap = 0, bow = 0, lean = 0 } = {}) {
  const { body, head, fl, fr, ftL, ftR } = p.userData, a = Math.sin(phase * Math.PI * 2);
  body.rotation.set(lean, 0, 0.16 * a * moving); head.rotation.set(bow, look, 0);
  fl.rotation.z = 0.25 + 0.2 * Math.abs(a) * moving + 0.9 * flap; fr.rotation.z = -(0.25 + 0.2 * Math.abs(a) * moving + 0.9 * flap);
  ftL.position.y = 0.18 * Math.max(0, a) * moving; ftR.position.y = 0.18 * Math.max(0, -a) * moving;
}

// ======================================================= props =======================================================
// A ceremonial sword. GRIP: origin in the fist, blade along -y (out of the bottom of the fist).
export function sword() { const g = new THREE.Group(); g.add(box(0.12, 0.5, 0.12, std('#5a3820'), 0, 0.05, 0), box(0.6, 0.08, 0.14, std('#e0b23a', { metalness: 0.8, roughness: 0.3 }), 0, -0.22, 0), box(0.1, 2.6, 0.04, std('#d9dde3', { metalness: 0.9, roughness: 0.2 }), 0, -1.55, 0)); return g; }
// A rolled-open scroll held in both hands. GRIP: origin between the fists, paper facing +z.
export function scroll() {
  const g = new THREE.Group(), p = label(1.5, 1.1, 300, 220, (x, w, h) => { x.fillStyle = '#f4ead2'; x.fillRect(0, 0, w, h); x.font = '700 30px "Playfair Display"'; x.fillStyle = '#3a2416'; x.textAlign = 'center'; x.fillText('By order of the King', w / 2, 40); x.fillStyle = 'rgba(58,36,22,.45)'; for (let i = 0; i < 6; i++) x.fillRect(30, 70 + i * 22, w - 60, 6); x.fillStyle = '#9b1b30'; x.beginPath(); x.arc(w / 2, 196, 16, 0, 7); x.fill(); });
  p.position.y = -0.1; g.add(p); for (const s of [-1, 1]) { const r = cyl(0.08, 0.08, 1.3, std('#e8dcc0'), 10, s * 0.78, -0.1, 0); g.add(r); }
  return g;
}

// ======================================================= the set =====================================================
function leaves(seed = 5, base = '#2f6b2a') { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < 1200; i++) { const c = new THREE.Color(base).offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.45) * 0.2); x.fillStyle = '#' + c.getHexString(); x.beginPath(); x.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3, r() * 3, 0, 7); x.fill(); } }); }
function paving() { return canvasTexture(256, 256, (x, w, h) => { x.fillStyle = '#b9b3a6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,60,60,.25)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); } }); }
function tree(g, x, z, s, seed) { g.add(cyl(0.35 * s, 0.5 * s, 5 * s, std('#5a3d24'), 10, x, 2.5 * s, z)); const lm = std('#ffffff', { map: leaves(seed, '#3f7f32'), roughness: 0.95 }); for (const [dx, dy, dz, r] of [[0, 6.2, 0, 2.6], [1.3, 5.4, 0.6, 1.9], [-1.4, 5.5, -0.4, 2.0]]) g.add(sph(r * s, lm, x + dx * s, dy * s, z + dz * s, 14)); }
export function zoo(scene) {
  const g = new THREE.Group(); g.name = 'zoo'; scene.add(g);
  g.add(flat(160, 120, std('#ffffff', { map: rep(leaves(11, '#5d9a45'), 30, 22), roughness: 1 }), 0, 0, 0));
  g.add(flat(70, 6, std('#ffffff', { map: rep(paving(), 12, 1), roughness: 0.9 }), 0, 0.02, PATH_Z));
  g.add(flat(70, 3.4, std('#ffffff', { map: rep(paving(), 12, 1), roughness: 0.9 }), 0, 0.02, LINE_Z - 0.6));
  // the penguin pool: a blue basin with rocks, a slide-in edge toward the path
  const P = POOL;
  const rim = std('#e9e4d8', { roughness: 0.8 });                          // a rim round the water, open in the middle
  g.add(box(14, 1.0, 0.8, rim, P.x, 0.5, P.z - 4.1), box(14, 1.0, 0.8, rim, P.x, 0.5, P.z + 4.1), box(0.8, 1.0, 9, rim, P.x - 6.6, 0.5, P.z), box(0.8, 1.0, 9, rim, P.x + 6.6, 0.5, P.z));
  g.add(box(12.4, 0.2, 7.4, std('#2a6f9a'), P.x, 0.1, P.z));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 7.4), new THREE.MeshStandardMaterial({ color: '#3fa0d8', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2; water.position.set(P.x, 0.75, P.z); g.add(water);
  for (const [x, z, s] of [[-19, -5, 1.6], [-10, -5.5, 1.2], [-17, 0.8, 0.9]]) { const r = box(2.2 * s, 1.6 * s, 1.8 * s, std('#8a8478', { roughness: 0.9 }), x, 0.8 * s + 0.6, z); r.rotation.y = x * 0.3; g.add(r); }
  // a low wall and hedge behind the parade path, trees, the castle on the skyline
  g.add(box(70, 1.6, 0.8, std('#9a8f7c', { roughness: 0.9 }), 0, 0.8, -7.5));
  [[-24, -12, 1.3, 2], [-8, -13, 1.5, 3], [4, -14, 1.2, 4], [20, -12, 1.4, 5], [30, -9, 1.1, 6]].forEach(([x, z, s, k]) => tree(g, x, z, s, k));
  const castle = new THREE.Group(); castle.position.set(-4, 0, -70); g.add(castle); const cm = std('#7d7466', { roughness: 0.95 });
  castle.add(box(60, 14, 10, std('#5f6b4f'), 0, 7, 0), box(30, 10, 8, cm, 0, 19, 0), box(6, 16, 6, cm, -14, 22, 0), box(6, 18, 6, cm, 12, 23, 0), box(10, 6, 6, cm, 0, 26, 0));
  const sign = label(7, 1.6, 700, 160, (x, w, h) => { x.fillStyle = '#1f4a2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e9e2c8'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); MS(x, 'THE ZOO · EDINBURGH', w / 2, h / 2 + 2, 62, '#e9e2c8'); });
  sign.position.set(-14, 4.6, -6.8); g.add(sign, cyl(0.12, 0.12, 4, std('#3a2a1e'), 8, -17, 2, -7.0), cyl(0.12, 0.12, 4, std('#3a2a1e'), 8, -11, 2, -7.0));
  // the statue plinth
  const S = STATUE; g.add(box(3.2, 2.6, 3.2, std('#c9c2b2', { roughness: 0.8 }), S.x, 1.3, S.z), box(3.6, 0.25, 3.6, std('#b5ad9a'), S.x, 2.72, S.z));
  const pl = label(2.2, 0.6, 330, 90, (x, w, h) => { x.fillStyle = '#8a5a2b'; x.fillRect(0, 0, w, h); MS(x, 'SIR NILS OLAV', w / 2, h / 2 + 2, 40, '#f6e2b0'); }, { metalness: 0.6, roughness: 0.35 });
  pl.position.set(S.x, 1.6, S.z + 1.62); g.add(pl);
  // flagpoles: Norway and Scotland flags drawn simply (no crests)
  for (const [x, f] of [[-4, 'no'], [4, 'sc']]) {
    g.add(cyl(0.1, 0.12, 11, std('#d9dde3', { metalness: 0.6 }), 8, x, 5.5, -6.6));
    const fl = label(3.2, 2.1, 160, 105, (c, w, h) => { if (f === 'no') { c.fillStyle = '#ba0c2f'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(40, 0, 26, h); c.fillRect(0, 40, w, 26); c.fillStyle = '#00205b'; c.fillRect(46, 0, 14, h); c.fillRect(0, 46, w, 14); } else { c.fillStyle = '#005eb8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); } }, { side: THREE.DoubleSide });
    fl.position.set(x + 1.65, 9.8, -6.6); g.add(fl);
  }
  return { group: g, water };
}
