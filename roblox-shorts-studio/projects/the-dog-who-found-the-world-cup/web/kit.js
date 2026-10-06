// The Dog Who Found The World Cup: sets, props and clothing shells built in code (no pack accessories, so the fit check
// has nothing to fit). World layout (studs, floor y 0). Places are far apart so they never share a frame:
//   STREET   origin. Beulah Hill, south London, 1966, at dusk: a garden hedge along the back of the pavement (z -1.4),
//            a parked car at the kerb, brick houses behind, lamp posts. The parcel lies under the hedge by the car.
//   HALL     (200, 0, 0). The stamp exhibition in Westminster Central Hall: stamp boards, a banner, the trophy's glass
//            cabinet on a plinth at (0, 0, -4).
//   OFFICE   (300, 0, 0). The football boss's office: desk, a rotary phone with a liftable handset, the ransom note.
//   PARK     (0, 0, 300). The handover in a park: path, trees, a bench.
//   STATION  (-300, 0, 0). The police station: the front desk (x < 0), the interview table under a lamp with a wall
//            clock (x ~ 12), and the line-up wall with height marks (x ~ 26).
//   STADIUM  (600, 0, 0). The final: the pitch, the stands full of crowd, bunting.
//   BANQUET  (0, 0, -300). The victory dinner: a long table with plates and glasses, chandeliers.
//   RIO      (-600, 0, 0). Rio de Janeiro, 1983, at night: the cabinet with a glass front and its wooden back forced open.
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
const PF = (g, text, x, y, px, color, align = 'center') => { g.font = `700 ${px}px "Playfair Display"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

export const STREET = V(0, 0, 0), HALL = V(200, 0, 0), OFFICE = V(300, 0, 0), PARK = V(0, 0, 300), STATION = V(-300, 0, 0),
  STADIUM = V(600, 0, 0), BANQUET = V(0, 0, -300), RIO = V(-600, 0, 0);
export const HEDGE_Z = -1.4, PARCEL_SPOT = V(0.6, 0, -1.9), CASE = V(0, 0, -4), PLINTH_H = 3.0, DESK_TOP = 3.4;

// ======================================================= clothing ====================================================
// A clothing shell: boxes a little bigger than the R6 torso and the upper arms, parented to the bones, so the hands stay
// bare. Torso bone frame: torso centre (0, 1, 0), 2 x 2 x 1, hips at y 0. Arm bone frame: arm centre (-+0.5, -0.5, 0),
// 1 x 2 x 1, shoulder top +0.5, fist from -1.05 down. `hem` extends the shell below the hips (a coat).
export function dress(actor, { color = '#f4f2ec', hem = 0.25, sleeves = true, map = null, buttons = null, collar = null, tie = null } = {}) {
  const m = std(color, { roughness: 0.75, map }), parts = [];
  const t = box(2.1, 2.06 + hem, 1.1, m, 0, 1.03 - hem / 2 + 0.02, 0); actor.bones.Torso.add(t); parts.push(t);
  if (buttons) for (let i = 0; i < 4; i++) { const b = cyl(0.07, 0.07, 0.04, std(buttons, { metalness: 0.5, roughness: 0.35 }), 12, 0, 1.75 - i * 0.48 - hem * 0.2, 0.56); b.rotation.x = Math.PI / 2; actor.bones.Torso.add(b); parts.push(b); }
  if (collar) { const c = box(1.2, 0.18, 1.14, std(collar, { roughness: 0.7 }), 0, 1.98, 0); actor.bones.Torso.add(c); parts.push(c); }
  if (tie) { const sh = box(0.62, 0.9, 0.04, std('#f4f2ec'), 0, 1.6, 0.56), ti = box(0.2, 0.8, 0.05, std(tie), 0, 1.58, 0.58); actor.bones.Torso.add(sh, ti); parts.push(sh, ti); }
  if (sleeves) for (const [bone, sx] of [['Arm.R', -1], ['Arm.L', 1]]) { const s = box(1.08, 1.56, 1.08, m, sx * 0.5, -0.25, 0); actor.bones[bone].add(s); parts.push(s); }
  for (const p of parts) p.castShadow = true;
  return { parts, material: m, set visible(v) { for (const p of parts) p.visible = v; } };
}
// A football shirt with a white crew collar and a number on the back (England 1966 played the final in red).
export function kit(actor, color = '#d0202e', num = 6) {
  const map = canvasTexture(128, 128, (x, w, h) => { x.fillStyle = color; x.fillRect(0, 0, w, h); });
  const d = dress(actor, { color, hem: 0.0, collar: '#ffffff' });
  const n = label(1.0, 1.0, 128, 128, (x, w, h) => { x.fillStyle = color; x.fillRect(0, 0, w, h); LG(x, String(num), w / 2, h / 2 + 6, 100, '#ffffff'); }, { roughness: 0.75 });
  n.position.set(0, 1.15, -0.56); n.rotation.y = Math.PI; actor.bones.Torso.add(n); d.parts.push(n);
  return d;
}

// ======================================================= props =======================================================
const GOLD = () => std('#e0b23a', { metalness: 0.85, roughness: 0.28 });
// The Jules Rimet Trophy, simplified (no likeness of any modern trophy): a blue base with gold plates on four sides (the
// front one engraved BRAZIL / WEST GERMANY / URUGUAY), a gold winged figure holding an octagonal cup above her head.
// 1.45 studs tall. Origin at the bottom centre, front +z. GRIP: both fists on the base's sides.
export function trophy() {
  const g = new THREE.Group(), gold = GOLD(), lapis = std('#23408e', { roughness: 0.3, metalness: 0.2 });
  g.add(box(0.66, 0.4, 0.66, lapis, 0, 0.2, 0), box(0.7, 0.05, 0.7, gold, 0, 0.42, 0), box(0.7, 0.05, 0.7, gold, 0, 0.02, 0));
  const names = label(0.54, 0.28, 270, 140, (x, w, h) => {
    x.fillStyle = '#e6be52'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a6a1a'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
    MS(x, 'BRAZIL', w / 2, 34, 30, '#4a3608'); MS(x, 'WEST GERMANY', w / 2, 72, 28, '#4a3608'); MS(x, 'URUGUAY', w / 2, 108, 30, '#4a3608');
  }, { metalness: 0.5, roughness: 0.35 });
  names.position.set(0, 0.21, 0.335); g.add(names);
  for (const r of [Math.PI / 2, Math.PI, -Math.PI / 2]) { const p = box(0.5, 0.26, 0.01, gold); p.position.set(Math.sin(r) * 0.335, 0.21, Math.cos(r) * 0.335); p.rotation.y = r; g.add(p); }
  g.add(cyl(0.16, 0.22, 0.12, gold, 8, 0, 0.5, 0));                                // pedestal
  g.add(cyl(0.11, 0.17, 0.5, gold, 12, 0, 0.8, 0), sph(0.08, gold, 0, 1.12, 0.02, 12));   // robed figure and head
  for (const s of [-1, 1]) {
    const wing = box(0.05, 0.5, 0.22, gold, s * 0.14, 1.02, -0.07); wing.rotation.set(-0.35, 0, s * -0.42); g.add(wing);
    const arm = cyl(0.03, 0.03, 0.3, gold, 6, s * 0.1, 1.2, 0.02); arm.rotation.z = s * -0.35; g.add(arm);
  }
  g.add(cyl(0.24, 0.12, 0.2, gold, 8, 0, 1.38, 0));                                // the octagonal cup
  const inner = cyl(0.21, 0.21, 0.02, std('#a07a20', { metalness: 0.8, roughness: 0.4 }), 8, 0, 1.475, 0); g.add(inner);
  g.userData.top = 1.48;
  return g;
}
// Newsprint (also the wrapping): columns of grey lines and a headline.
function newsprint(seed = 1) {
  return canvasTexture(256, 256, (x, w, h) => {
    x.fillStyle = '#ece4cf'; x.fillRect(0, 0, w, h); const r = rng(seed);
    x.fillStyle = 'rgba(30,30,30,.55)'; for (let c = 0; c < 4; c++) for (let i = 0; i < 26; i++) if (r() > 0.08) x.fillRect(8 + c * 62, 40 + i * 8.2, 50 - r() * 10, 3);
    x.font = '700 30px "Playfair Display"'; x.fillStyle = '#222'; x.fillText('DAILY NEWS', 20, 26);
  });
}
// The parcel: newspaper wrapped round the trophy, tied with string. `torn` = the top half torn away, the trophy showing
// (show the trophy at the same origin). Origin at the bottom centre. GRIP: both fists on the sides at mid-height.
export function parcel(torn = false) {
  const g = new THREE.Group(), m = std('#ffffff', { map: newsprint(3), roughness: 0.9 }), str = std('#c9a66b', { roughness: 0.9 });
  if (!torn) {
    const b = box(0.86, 1.6, 0.8, m, 0, 0.8, 0); b.rotation.y = 0.05; g.add(b);
    const top = box(0.62, 0.22, 0.6, m, 0, 1.68, 0); top.rotation.y = -0.2; g.add(top);
    g.add(box(0.9, 0.04, 0.84, str, 0, 0.55, 0), box(0.9, 0.04, 0.84, str, 0, 1.15, 0), box(0.05, 1.64, 0.84, str, 0, 0.82, 0), box(0.9, 1.64, 0.05, str, 0, 0.82, 0));
  } else {
    for (const [x, z, ry] of [[0, 0.42, 0], [0, -0.42, 0], [0.43, 0, Math.PI / 2], [-0.43, 0, Math.PI / 2]]) { const p = box(0.9, 0.1, 0.04, m, x, 0.05, z); p.rotation.y = ry; g.add(p); }
    for (const [x, z, rz, ry] of [[0.55, 0.2, 1.1, Math.PI / 2], [-0.55, -0.1, -1.1, Math.PI / 2], [0.1, -0.56, 0.0, 0]]) { const f = box(0.5, 0.36, 0.03, m, x, 0.12, z); f.rotation.set(ry ? 0 : 1.2, ry, rz); g.add(f); }
  }
  return g;
}
// A small brown-paper package (the middleman's). GRIP: both fists on its sides.
export function smallParcel() { const g = new THREE.Group(); g.add(box(0.9, 0.6, 0.6, std('#b08a5a', { roughness: 0.9 }), 0, 0, 0), box(0.94, 0.04, 0.64, std('#6b4a2a'), 0, 0, 0), box(0.05, 0.64, 0.64, std('#6b4a2a'), 0, 0, 0)); return g; }
// A police warrant card held up. GRIP: origin in the fist, card above it facing +z.
export function badge() {
  const g = new THREE.Group(); g.add(box(0.75, 0.55, 0.06, std('#1d1f27'), 0, 0.42, 0));
  const c = label(0.62, 0.44, 160, 112, (x, w, h) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f2a44'; x.fillRect(0, 0, w, 30); MS(x, 'POLICE', w / 2, 16, 22, '#ffffff'); x.fillStyle = '#c9a03a'; x.beginPath(); x.arc(40, 70, 24, 0, 7); x.fill(); x.fillStyle = 'rgba(22,24,42,.5)'; for (let i = 0; i < 3; i++) x.fillRect(76, 52 + i * 16, 70, 6); });
  c.position.set(0, 0.42, 0.035); g.add(c); return g;
}
// A 1960s rotary desk phone: body on the desk, handset (`hand`) a separate group the boss lifts. Origin on the desk top.
// GRIP (handset): origin in the fist, earpiece up.
export function rotaryPhone() {
  const g = new THREE.Group(), blk = std('#16181f', { roughness: 0.3, metalness: 0.2 });
  g.add(box(1.1, 0.42, 0.95, blk, 0, 0.21, 0)); const top = box(0.9, 0.2, 0.7, blk, 0, 0.5, -0.02); top.rotation.x = -0.25; g.add(top);
  const dial = cyl(0.27, 0.27, 0.05, std('#e8e2d0', { roughness: 0.5 }), 20, 0, 0.5, 0.3); dial.rotation.x = 1.3; g.add(dial);
  const hand = new THREE.Group(); g.add(hand);
  hand.add(box(0.14, 1.0, 0.16, blk, 0, 0, 0), box(0.26, 0.22, 0.24, blk, 0, 0.5, 0.06), box(0.26, 0.22, 0.24, blk, 0, -0.5, 0.06));
  g.userData.hand = hand; g.userData.rest = { p: V(0, 0.72, 0), r: new THREE.Euler(0, 0, Math.PI / 2) };
  return g;
}
// The ransom note on the desk, cut-out letters: GBP 15,000. Origin at its centre, lying flat.
export function ransomNote() {
  const m = label(1.3, 1.0, 260, 200, (x, w, h) => {
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h);
    const L = '£15,000'.split(''), C = ['#c1121f', '#1d3557', '#2a9d8f', '#e9c46a', '#6a4c93', '#f4a261', '#264653'];
    L.forEach((ch, i) => { x.save(); x.translate(26 + i * 31, 90); x.rotate((i % 2 ? 0.12 : -0.1)); x.fillStyle = C[i % C.length]; x.fillRect(-14, -26, 30, 48); x.font = `${i % 3 ? '700' : '900'} 38px ${i % 2 ? 'Montserrat' : '"Playfair Display"'}`; x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 1, 0); x.restore(); });
    x.fillStyle = 'rgba(22,24,42,.45)'; x.fillRect(30, 150, 200, 8); x.fillRect(30, 170, 140, 8);
  });
  m.rotation.x = -Math.PI / 2; const g = new THREE.Group(); g.add(m); return g;
}
// A crowbar lying on the floor (Rio). Origin at its centre, lying along x.
export function crowbar() { const g = new THREE.Group(), m = std('#7a1f1f', { metalness: 0.6, roughness: 0.4 }); const b = box(2.0, 0.09, 0.09, m, 0, 0.05, 0); g.add(b); const h = box(0.35, 0.09, 0.09, m, -1.08, 0.12, 0); h.rotation.z = 0.7; g.add(h); return g; }
// Dinner plate (with or without scraps). Origin on the table top.
export function plate(full = true) {
  const g = new THREE.Group(); g.add(cyl(0.48, 0.38, 0.06, std('#fbfaf6', { roughness: 0.25 }), 24, 0, 0.03, 0));
  if (full) { g.add(sph(0.14, std('#8a5a33'), 0.08, 0.1, 0.05, 10), sph(0.1, std('#e9c46a'), -0.15, 0.09, -0.06, 10), sph(0.08, std('#6a994e'), -0.05, 0.08, 0.16, 10)); g.children.slice(1).forEach((c) => (c.scale.y = 0.45)); }
  g.userData.food = g.children.slice(1);
  return g;
}
// The collie's red collar (attached to the collie's Head body in clip setup).
export function collar() { const g = new THREE.Group(); g.add(box(0.22, 0.22, 1.12, std('#c1121f', { roughness: 0.5 }), 0, 0, 0)); const t = cyl(0.09, 0.09, 0.04, std('#e0b23a', { metalness: 0.8, roughness: 0.3 }), 12, -0.14, -0.18, 0); t.rotation.z = Math.PI / 2; g.add(t); return g; }
// The pink tongue (plate licking). Attached to the Head body.
export function tongue() { return box(0.34, 0.06, 0.2, std('#ff7aa2', { roughness: 0.4 })); }
// A medal ribbon for the banquet (on the collar).
export function medal() { const g = new THREE.Group(); g.add(box(0.06, 0.34, 0.18, std('#1d3557'), 0, 0.0, 0), cyl(0.15, 0.15, 0.05, std('#c9ced6', { metalness: 0.85, roughness: 0.25 }), 16, 0, -0.26, 0)); g.children[1].rotation.z = Math.PI / 2; return g; }

// ======================================================= sets ========================================================
function brick(base = '#9a4a3a', seed = 2) { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = '#c9c0ad'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 5; j++) { const c = new THREE.Color(base).offsetHSL(0, 0, (r() - 0.5) * 0.08); x.fillStyle = '#' + c.getHexString(); x.fillRect(j * 56 + (i % 2) * 28 - 28, i * 16 + 1, 54, 14); x.fillRect(j * 56 + (i % 2) * 28 + 28, i * 16 + 1, 54, 14); } }); }
function leaves(seed = 5, base = '#2f6b2a') { return canvasTexture(256, 256, (x, w, h) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const c = new THREE.Color(base).offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.45) * 0.2); x.fillStyle = '#' + c.getHexString(); x.beginPath(); x.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 3, r() * 3, 0, 7); x.fill(); } }); }
function stone(base = '#9a978f', seed = 2) { return canvasTexture(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rng(seed); x.strokeStyle = 'rgba(40,40,40,.22)'; x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); for (let j = 0; j < 3; j++) { const xx = (j * 96 + (i % 2) * 48) % w; x.beginPath(); x.moveTo(xx, i * 64); x.lineTo(xx, i * 64 + 64); x.stroke(); } } for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},0.05)`; x.fillRect(r() * w, r() * h, 3, 3); } }); }
function parquet() { return canvasTexture(256, 256, (x, w, h) => { const r = rng(4); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { const c = 120 + r() * 30; x.fillStyle = `rgb(${c},${c * 0.62 | 0},${c * 0.36 | 0})`; x.fillRect(j * 64 + (i % 2) * 32 - 32, i * 32, 64, 32); x.fillRect(j * 64 + (i % 2) * 32 + 32, i * 32, 64, 32); x.strokeStyle = 'rgba(40,20,8,.35)'; x.strokeRect(j * 64 + (i % 2) * 32 - 32, i * 32, 64, 32); } }); }
function lampPost(g, x, z, on = true) {
  g.add(cyl(0.16, 0.22, 9, std('#2a2d35', { metalness: 0.5 }), 10, x, 4.5, z), box(1.4, 0.16, 0.16, std('#2a2d35'), x - 0.6, 8.9, z));
  const bulb = sph(0.4, std('#fff4d0', { emissive: '#ffd98a', emissiveIntensity: on ? 1.6 : 0 }), x - 1.2, 8.6, z, 14); g.add(bulb);
  const l = new THREE.PointLight('#ffd9a0', 0, 22, 1.3); l.position.set(x - 1.2, 8.2, z); g.add(l); return l;
}
// A boxy 1960s saloon car (no make). Origin at the ground centre, front toward -x. Front wheel near x -2.0.
function car(color = '#7fa6c9') {
  const g = new THREE.Group(), body = std(color, { metalness: 0.4, roughness: 0.35 }), chrome = std('#d9dde3', { metalness: 0.9, roughness: 0.2 }), glass = std('#2b3a4a', { roughness: 0.1, metalness: 0.3 });
  g.add(box(7.4, 1.5, 3.2, body, 0, 1.45, 0), box(4.0, 1.25, 2.9, body, 0.4, 2.8, 0));
  g.add(box(3.6, 1.0, 2.94, glass, 0.4, 2.8, 0), box(0.2, 0.5, 3.24, chrome, -3.72, 1.2, 0), box(0.2, 0.5, 3.24, chrome, 3.72, 1.2, 0));
  for (const s of [-1, 1]) { const hl = cyl(0.3, 0.3, 0.1, std('#fff6d8', { emissive: '#ffe9b0', emissiveIntensity: 0.4 }), 14, -3.75, 1.65, s * 1.0); hl.rotation.z = Math.PI / 2; g.add(hl); }
  for (const [x, z] of [[-2.2, 1.45], [-2.2, -1.45], [2.4, 1.45], [2.4, -1.45]]) { const w = cyl(0.75, 0.75, 0.5, std('#1a1a1a', { roughness: 0.8 }), 18, x, 0.75, z); w.rotation.x = Math.PI / 2; g.add(w); const hub = cyl(0.32, 0.32, 0.52, chrome, 14, x, 0.75, z); hub.rotation.x = Math.PI / 2; g.add(hub); }
  return g;
}
function house(g, x, z, w, color, seed) {
  const bt = rep(brick(color, seed), w / 8, 2);
  g.add(box(w, 12, 6, std('#ffffff', { map: bt, roughness: 0.9 }), x, 6, z));
  const roof = box(w + 0.6, 0.6, 7.6, std('#4a3a38', { roughness: 0.8 }), x, 12.6, z + 0.2); g.add(roof);
  for (const dx of [-w / 4, w / 4]) for (const y of [4, 9]) { g.add(box(2.2, 2.6, 0.2, std('#e8ddc0', { emissive: '#ffcf80', emissiveIntensity: y === 4 ? 0.35 : 0.15 }), x + dx, y, z + 3.05)); g.add(box(2.5, 0.25, 0.3, std('#efe9dc'), x + dx, y - 1.4, z + 3.1)); }
  g.add(box(1.8, 3.6, 0.2, std(['#1f4a7a', '#7a1f2a', '#2a5a3a'][seed % 3]), x, 1.8, z + 3.05));
}
// ---------- the street (Beulah Hill) ----------
export function street(scene) {
  const g = new THREE.Group(); g.name = 'street'; g.position.copy(STREET); scene.add(g);
  g.add(flat(200, 30, std('#3c3f45', { roughness: 0.9 }), 0, 0, 14));                      // road
  const pv = rep(stone('#a8a49b', 9), 25, 2);
  g.add(box(200, 0.3, 4.2, std('#ffffff', { map: pv, roughness: 0.9 }), 0, -0.15 + 0.0, 0.7));   // pavement top at y 0
  g.add(box(200, 0.32, 0.4, std('#8a867c'), 0, -0.14, 2.9));                                   // kerb
  for (let x = -90; x < 90; x += 6) g.add(flat(3, 0.3, std('#e8e2c8'), x, 0.01, 9));
  // the hedge along the back of the pavement, with a hollow underneath where the parcel lies; gardens and houses behind
  const hm = std('#ffffff', { map: rep(leaves(5), 6, 1), roughness: 0.95 });
  const hx0 = PARCEL_SPOT.x - 1.5, hx1 = PARCEL_SPOT.x + 1.5, hz = HEDGE_Z - 1.0;               // hollow from hx0 to hx1
  g.add(box(hx0 + 45, 3.6, 2.0, hm, (hx0 - 45) / 2, 1.8, hz), box(45 - hx1, 3.6, 2.0, hm, (45 + hx1) / 2, 1.8, hz));
  g.add(box(hx1 - hx0, 2.8, 2.0, hm, PARCEL_SPOT.x, 2.2, hz));                                   // hedge over the hollow
  g.add(box(hx1 - hx0, 0.8, 0.4, std('#1d2a17', { roughness: 1 }), PARCEL_SPOT.x, 0.4, hz - 0.8));  // shadowy back of the hollow
  for (let i = 0; i < 9; i++) g.add(cyl(0.07, 0.09, 0.8, std('#4a3a22'), 6, hx0 + 0.3 + i * 0.3, 0.4, hz - 0.4 + (i % 2) * 0.5));   // stems
  g.add(flat(200, 14, std('#4f7f3a', { roughness: 1 }), 0, 0.02, -10));                    // gardens
  [[-34, '#8a3b2e', 1], [-17, '#9a4a3a', 2], [0, '#7a3a2a', 3], [17, '#9a5040', 4], [34, '#86402f', 5]].forEach(([x, c, s]) => house(g, x, -16, 15, c, s));
  const c = car('#7fa6c9'); c.position.set(11.5, 0, 5.0); g.add(c);
  const lamps = [lampPost(g, -12, 2.2), lampPost(g, 14, 2.2)];
  return { group: g, lamps };
}
// ---------- the exhibition hall ----------
function stampBoard(seed) {
  return label(6, 4, 384, 256, (x, w, h) => {
    x.fillStyle = '#2b3a55'; x.fillRect(0, 0, w, h); const r = rng(seed);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const sx = 22 + i * 58, sy = 22 + j * 58; x.fillStyle = '#f6f1e4'; x.fillRect(sx, sy, 44, 50);
      x.fillStyle = ['#c1121f', '#1d3557', '#2a9d8f', '#e9c46a', '#6a4c93', '#f4a261'][(r() * 6) | 0]; x.fillRect(sx + 5, sy + 5, 34, 40);
      x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(sx + 22, sy + 22, 9, 0, 7); x.fill();
    }
  }, { roughness: 0.7 });
}
export function hall(scene) {
  const g = new THREE.Group(); g.name = 'hall'; g.position.copy(HALL); scene.add(g);
  g.add(flat(50, 40, std('#ffffff', { map: rep(parquet(), 10, 8), roughness: 0.5 }), 0, 0, 4));
  const wall = std('#e8dcc0', { roughness: 0.9 }), trim = std('#b89a5a', { metalness: 0.4, roughness: 0.5 });
  g.add(box(50, 18, 0.6, wall, 0, 9, -12.3), box(0.6, 18, 40, wall, -24.7, 9, 4), box(0.6, 18, 40, wall, 24.7, 9, 4), box(50, 0.5, 0.8, trim, 0, 14, -12));
  for (const x of [-16, -8, 8, 16]) { const b = stampBoard(x + 40); b.position.set(x, 6, -11.95); g.add(b); g.add(box(6.3, 4.3, 0.15, std('#1d1f27'), x, 6, -12.05)); }
  for (const [x, ry] of [[-24.3, Math.PI / 2], [24.3, -Math.PI / 2]]) for (const z of [-4, 4]) { const b = stampBoard(z * 3 + x); b.position.set(x, 6, z); b.rotation.y = ry; g.add(b); }
  const banner = label(18, 2.4, 1440, 192, (x, w, h) => { x.fillStyle = '#1f2a44'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e0b23a'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20); LG(x, 'SPORT WITH STAMPS · 1966', w / 2, h / 2 + 8, 110, '#ffffff'); });
  banner.position.set(0, 11.5, -11.9); g.add(banner);
  // the plinth and the glass cabinet; the trophy stands inside on the plinth top
  g.add(box(2.6, PLINTH_H, 2.6, std('#5a1a22', { roughness: 0.7 }), CASE.x, PLINTH_H / 2, CASE.z), box(2.8, 0.15, 2.8, trim, CASE.x, PLINTH_H, CASE.z));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), new THREE.MeshStandardMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.14, roughness: 0.03, depthWrite: false }));
  glass.position.set(CASE.x, PLINTH_H + 1.15, CASE.z); glass.renderOrder = 3; g.add(glass);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); edge.position.copy(glass.position); g.add(edge);
  g.add(box(2.3, 0.12, 2.3, trim, CASE.x, PLINTH_H + 2.3, CASE.z));
  // velvet ropes
  for (const x of [-3.5, 3.5]) g.add(cyl(0.12, 0.18, 2.6, trim, 10, x, 1.3, CASE.z + 3));
  const rope = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.08, 6, 24, Math.PI), std('#9b1b30')); rope.rotation.z = Math.PI; rope.position.set(0, 2.4, CASE.z + 3); rope.scale.y = 0.18; g.add(rope);
  const lamp = new THREE.PointLight('#fff1d6', 0, 70, 1.0); lamp.position.set(0, 15, 4); g.add(lamp);
  const spot = new THREE.SpotLight('#fff4e0', 0, 30, 0.35, 0.6, 1); spot.position.set(0, 14, 2); spot.target.position.set(CASE.x, PLINTH_H, CASE.z); g.add(spot, spot.target);
  return { group: g, lamp, spot };
}
// ---------- the football boss's office ----------
export function office(scene) {
  const g = new THREE.Group(); g.name = 'office'; g.position.copy(OFFICE); scene.add(g);
  g.add(flat(26, 20, std('#ffffff', { map: rep(parquet(), 4, 3), roughness: 0.6 }), 0, 0, 2));
  const wall = std('#4f6a5a', { roughness: 0.9 });
  g.add(box(26, 14, 0.6, wall, 0, 7, -8.3), box(0.6, 14, 20, wall, -13, 7, 2), box(0.6, 14, 20, wall, 13, 7, 2), box(26, 1.2, 0.7, std('#3a2a1e'), 0, 0.6, -8.25));
  const wood = std('#6e4526', { roughness: 0.55 });
  g.add(box(7, 0.3, 3.0, wood, 0, DESK_TOP - 0.15, -1.5), box(6.6, DESK_TOP - 0.3, 2.6, std('#5a3820'), 0, (DESK_TOP - 0.3) / 2, -1.6));
  // shelves of football trophies (small generic cups) and a pennant
  g.add(box(8, 0.25, 1.4, wood, -6.5, 7, -7.6), box(8, 0.25, 1.4, wood, -6.5, 9.6, -7.6));
  for (let i = 0; i < 5; i++) { const c = new THREE.Group(); c.add(cyl(0.3, 0.15, 0.6, GOLD(), 12, 0, 0.6, 0), cyl(0.1, 0.1, 0.4, GOLD(), 8, 0, 0.15, 0), box(0.4, 0.15, 0.4, std('#1d1f27'), 0, 0.02, 0)); c.position.set(-9.5 + i * 1.5, 7.15 + (i % 2) * 2.6, -7.4); g.add(c); }
  const pen = label(3, 2, 300, 200, (x, w, h) => { x.fillStyle = '#c1121f'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, h / 2); x.lineTo(0, h); x.fill(); LG(x, 'FOOTBALL', 100, h / 2, 46, '#ffffff'); }); pen.position.set(6, 9, -7.95); g.add(pen);
  const win = label(4, 3.6, 256, 230, (x, w, h) => { const s = x.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#8fb3d9'); s.addColorStop(1, '#dfe9f2'); x.fillStyle = s; x.fillRect(0, 0, w, h); x.fillStyle = '#7d8590'; for (let i = 0; i < 6; i++) x.fillRect(i * 44, 120 + (i % 3) * 20, 40, 120); x.strokeStyle = '#ffffff'; x.lineWidth = 12; x.strokeRect(0, 0, w, h); }, { emissive: '#ffffff', emissiveIntensity: 0.3 });
  win.position.set(5, 7, -7.98); g.add(win);
  g.add(box(2.4, 0.3, 2.2, wood, 0, 2.3, -4.6), box(2.4, 3.0, 0.3, wood, 0, 3.8, -5.6));       // chair behind the desk
  const lamp = new THREE.PointLight('#ffe9b8', 0, 34, 1.1); lamp.position.set(0, 10, 3); g.add(lamp);
  return { group: g, lamp };
}
// ---------- the park ----------
function tree(g, x, z, s = 1, seed = 1) {
  g.add(cyl(0.35 * s, 0.5 * s, 5 * s, std('#5a3d24', { roughness: 0.9 }), 10, x, 2.5 * s, z));
  const lm = std('#ffffff', { map: leaves(seed, '#3f7f32'), roughness: 0.95 });
  for (const [dx, dy, dz, r] of [[0, 6.2, 0, 2.6], [1.3, 5.4, 0.6, 1.9], [-1.4, 5.5, -0.4, 2.0], [0.2, 7.4, -0.3, 1.8]]) g.add(sph(r * s, lm, x + dx * s, dy * s, z + dz * s, 14));
}
export function park(scene) {
  const g = new THREE.Group(); g.name = 'park'; g.position.copy(PARK); scene.add(g);
  g.add(flat(160, 120, std('#ffffff', { map: rep(leaves(11, '#5d9a45'), 30, 22), roughness: 1 }), 0, 0, 0));
  g.add(flat(120, 5, std('#cbb994', { roughness: 0.95 }), 0, 0.02, 1));
  [[-14, -8, 1.2, 2], [-6, -12, 1.4, 3], [8, -9, 1.3, 4], [17, -6, 1.1, 5], [-20, 6, 1.0, 6], [22, 7, 1.2, 7], [2, -20, 1.5, 8], [-12, -22, 1.4, 9]].forEach(([x, z, s, k]) => tree(g, x, z, s, k));
  const wood = std('#7a4b2c', { roughness: 0.7 }), iron = std('#1d1f27', { metalness: 0.5 });
  const b = new THREE.Group(); b.position.set(0, 0, -2.6); g.add(b);
  for (let i = 0; i < 3; i++) b.add(box(5, 0.16, 0.42, wood, 0, 1.9, -0.5 + i * 0.5));
  for (let i = 0; i < 2; i++) b.add(box(5, 0.16, 0.42, wood, 0, 2.6 + i * 0.55, -0.85));
  for (const x of [-2.2, 2.2]) b.add(box(0.2, 1.9, 1.4, iron, x, 0.95, -0.2));
  for (const [x, z] of [[-10, -3], [11, -3.5]]) { const bush = sph(1.8, std('#ffffff', { map: leaves(x + 30, '#2f6b2a'), roughness: 1 }), x, 1.2, z, 14); bush.scale.y = 0.8; g.add(bush); }
  const sign = label(3.2, 1.1, 320, 110, (x, w, h) => { x.fillStyle = '#1f4a2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e9e2c8'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12); MS(x, 'THE PARK', w / 2, h / 2 + 2, 46, '#e9e2c8'); });
  sign.position.set(-6, 3.4, -4.5); g.add(sign, cyl(0.1, 0.1, 3, std('#3a2a1e'), 8, -6, 1.5, -4.6));
  return { group: g };
}
// ---------- the police station ----------
export const SARGE_DESK = V(-2, 0, -2.5), INTERVIEW = V(12, 0, -2), LINEUP = V(26, 0, -5.6);
export function station(scene) {
  const g = new THREE.Group(); g.name = 'station'; g.position.copy(STATION); scene.add(g);
  g.add(flat(70, 24, std('#ffffff', { map: rep(stone('#9a978f', 4), 14, 5), roughness: 0.8 }), 10, 0, 2));
  const wall = std('#c9cdb8', { roughness: 0.9 }), dado = std('#2f4a5a', { roughness: 0.8 });
  g.add(box(70, 14, 0.6, wall, 10, 7, -8.3), box(70, 3.0, 0.65, dado, 10, 1.5, -8.25), box(0.6, 14, 24, wall, -25, 7, 2), box(0.6, 14, 24, wall, 45, 7, 2));
  for (const x of [5.5, 19.5]) g.add(box(0.6, 14, 10, wall, x, 7, -3.5));                   // partitions between the three rooms
  // front desk with a bell and a ledger; the blue lamp sign
  const wood = std('#5a3820', { roughness: 0.55 });
  g.add(box(9, 3.4, 2.0, wood, SARGE_DESK.x, 1.7, SARGE_DESK.z + 1.5), box(9.3, 0.2, 2.3, std('#3a2416'), SARGE_DESK.x, 3.5, SARGE_DESK.z + 1.5));
  g.add(box(1.4, 0.12, 1.0, std('#1d3557'), SARGE_DESK.x - 2.8, 3.66, SARGE_DESK.z + 1.4));
  const sg = label(5, 1.4, 500, 140, (x, w, h) => { x.fillStyle = '#16244a'; x.fillRect(0, 0, w, h); LG(x, 'POLICE', w / 2, h / 2 + 6, 100, '#ffffff'); }, { emissive: '#ffffff', emissiveIntensity: 0.15 });
  sg.position.set(SARGE_DESK.x, 9.5, -7.95); g.add(sg);
  const notice = label(2.6, 3.4, 260, 340, (x, w, h) => { x.fillStyle = '#f2ead8'; x.fillRect(0, 0, w, h); LG(x, 'STOLEN', w / 2, 46, 56, '#b0121b'); x.fillStyle = '#e0b23a'; x.fillRect(100, 90, 60, 120); x.fillStyle = '#23408e'; x.fillRect(90, 210, 80, 40); MS(x, 'REWARD', w / 2, 300, 40, '#16182a'); });
  notice.position.set(-9, 6.5, -7.95); g.add(notice);
  // interview room: table, two chairs, hanging lamp, the wall clock (hands set in the clip)
  const iz = INTERVIEW;
  g.add(box(5, 0.3, 3, wood, iz.x, 3.0, iz.z), ...[[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]].map(([x, z]) => box(0.3, 2.85, 0.3, wood, iz.x + x, 1.42, iz.z + z)));
  for (const s of [-1, 1]) { const ch = new THREE.Group(); ch.position.set(iz.x + s * 3.6, 0, iz.z); ch.rotation.y = s * Math.PI / 2; ch.add(box(2.0, 0.25, 2.0, wood, 0, 2.0, 0), box(2.0, 2.4, 0.2, wood, 0, 3.3, -0.95)); for (const x of [-0.85, 0.85]) for (const z of [-0.85, 0.85]) ch.add(box(0.2, 2.0, 0.2, wood, x, 1.0, z)); g.add(ch); }
  g.add(cyl(0.03, 0.03, 5, std('#111'), 6, iz.x, 11.5, iz.z));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.9, 20, 1, true), std('#2a2c33', { side: THREE.DoubleSide, roughness: 0.4 })); shade.position.set(iz.x, 8.9, iz.z); g.add(shade);
  g.add(sph(0.35, std('#fff6d8', { emissive: '#fff1c0', emissiveIntensity: 2.5 }), iz.x, 8.6, iz.z, 14));
  const clock = new THREE.Group(); clock.position.set(iz.x + 3.5, 9.6, -7.9); g.add(clock);
  clock.add(cyl(1.3, 1.3, 0.2, std('#1d1f27'), 32, 0, 0, 0)); clock.children[0].rotation.x = Math.PI / 2;
  const face = label(2.3, 2.3, 230, 230, (x, w, h) => { x.fillStyle = '#fbfaf2'; x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, 7); x.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = '#16182a'; x.fillRect(w / 2 + Math.sin(a) * 96 - 4, h / 2 - Math.cos(a) * 96 - 10, 8, 20); } MS(x, '12', w / 2, 40, 26, '#16182a'); MS(x, '6', w / 2, h - 40, 26, '#16182a'); MS(x, '3', w - 40, h / 2, 26, '#16182a'); MS(x, '9', 40, h / 2, 26, '#16182a'); }, { roughness: 0.4 });
  face.position.z = 0.11; clock.add(face);
  const hour = new THREE.Group(), min = new THREE.Group(); hour.position.z = 0.14; min.position.z = 0.16; clock.add(hour, min);
  hour.add(box(0.12, 0.6, 0.04, std('#16182a'), 0, 0.28, 0)); min.add(box(0.08, 0.95, 0.04, std('#16182a'), 0, 0.45, 0));
  // line-up wall with height marks
  const lu = label(14, 9, 700, 450, (x, w, h) => { x.fillStyle = '#d9dcd0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2b2d33'; x.fillStyle = '#2b2d33'; for (let i = 0; i <= 9; i++) { const y = h - i * 50; x.lineWidth = i % 2 ? 2 : 5; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); if (i % 2 === 0 && i) MS(x, `${i}`, 26, y - 16, 26, '#2b2d33'); } [1, 2, 3, 4, 5].forEach((n, i) => { x.beginPath(); x.arc(110 + i * 120, h - 30, 22, 0, 7); x.fill(); MS(x, String(n), 110 + i * 120, h - 29, 28, '#ffffff'); }); });
  lu.position.set(LINEUP.x, 4.5, -7.95); g.add(lu);
  const lamp = new THREE.PointLight('#fff0d0', 0, 40, 1.1); lamp.position.set(-2, 10, 3); g.add(lamp);
  const lampI = new THREE.PointLight('#ffe9b8', 0, 26, 1.2); lampI.position.set(iz.x, 8.3, iz.z); g.add(lampI);
  const lampL = new THREE.PointLight('#f4f8ff', 0, 34, 1.0); lampL.position.set(LINEUP.x, 11, 2); g.add(lampL);
  return { group: g, lamp, lampI, lampL, clock, hour, min };
}
// ---------- the stadium ----------
export function stadium(scene) {
  const g = new THREE.Group(); g.name = 'stadium'; g.position.copy(STADIUM); scene.add(g);
  const pitch = canvasTexture(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#3f8a3a' : '#4a9a42'; x.fillRect(0, i * 32, w, 32); } });
  g.add(flat(140, 100, std('#ffffff', { map: rep(pitch, 4, 4), roughness: 0.95 }), 0, 0, 0));
  g.add(flat(120, 0.4, std('#f4f4ec'), 0, 0.02, 6), flat(0.4, 60, std('#f4f4ec'), -30, 0.02, -20));
  const crowd = canvasTexture(512, 128, (x, w, h) => { const r = rng(21); x.fillStyle = '#3a3d48'; x.fillRect(0, 0, w, h); for (let i = 0; i < 520; i++) { x.fillStyle = ['#c1121f', '#ffffff', '#1d3557', '#e9c46a', '#f1c27d', '#c68642', '#2b2d42'][(r() * 7) | 0]; x.fillRect(r() * w, r() * h, 6, 7); } });
  for (let i = 0; i < 6; i++) g.add(box(160, 2.2, 3.2, std('#ffffff', { map: rep(crowd.clone(), 6, 1), roughness: 0.9 }), 0, 1.1 + i * 2.2, -38 - i * 3.2));
  g.add(box(160, 3, 22, std('#5a5f6a'), 0, 16, -52), box(160, 1.4, 1, std('#e9e2c8'), 0, 1.0, -35));
  // bunting
  for (let i = 0; i < 26; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 3), std(['#c1121f', '#ffffff', '#1d3557'][i % 3], { roughness: 0.6 })); f.rotation.z = Math.PI; f.position.set(-26 + i * 2, 9.6 - 0.8 * Math.sin(Math.PI * (i % 13) / 12), -30); g.add(f); }
  g.add(box(54, 0.08, 0.08, std('#2b2d33'), 0, 10.3, -30));
  for (const x of [-27, 27]) g.add(cyl(0.2, 0.2, 12, std('#e9e2c8'), 8, x, 6, -30));
  const lamp = new THREE.PointLight('#ffffff', 0, 80, 1.0); lamp.position.set(0, 20, 10); g.add(lamp);
  return { group: g, lamp };
}
// ---------- the banquet ----------
export const TABLE_Y = 3.3, TABLE_Z = -1.0;
export function banquet(scene) {
  const g = new THREE.Group(); g.name = 'banquet'; g.position.copy(BANQUET); scene.add(g);
  g.add(flat(50, 30, std('#7a1f2a', { roughness: 0.95 }), 0, 0, 2));
  const wall = std('#f0e2c2', { roughness: 0.85 }), gold = GOLD();
  g.add(box(50, 18, 0.6, wall, 0, 9, -10.3), box(0.6, 18, 30, wall, -24.7, 9, 2), box(0.6, 18, 30, wall, 24.7, 9, 2));
  for (let x = -20; x <= 20; x += 8) g.add(box(0.8, 18, 0.6, std('#d9c7a0'), x, 9, -9.9));
  const ban = label(16, 2.2, 1280, 176, (x, w, h) => { x.fillStyle = '#1d3557'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e0b23a'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20); LG(x, 'WORLD CHAMPIONS 1966', w / 2, h / 2 + 8, 104, '#ffffff'); });
  ban.position.set(0, 12.5, -9.9); g.add(ban);
  // the long table: white cloth
  g.add(box(26, 0.3, 4.0, std('#e9e2d4', { roughness: 0.85 }), 0, TABLE_Y - 0.15, TABLE_Z), box(26, TABLE_Y - 0.3, 3.7, std('#ddd5c4', { roughness: 0.9 }), 0, (TABLE_Y - 0.3) / 2, TABLE_Z));
  for (let i = 0; i < 6; i++) { const x = -11 + i * 4.4; g.add(cyl(0.12, 0.08, 0.6, std('#e6f6ff', { transparent: true, opacity: 0.5, roughness: 0.05 }), 10, x + 0.9, TABLE_Y + 0.3, TABLE_Z - 0.9)); g.add(cyl(0.18, 0.2, 0.9, std('#fffbe8', { emissive: '#ffd98a', emissiveIntensity: 0.25 }), 10, x + 2.2, TABLE_Y + 0.45, TABLE_Z - 1.2)); }
  // chandeliers
  for (const x of [-10, 10]) { g.add(cyl(0.05, 0.05, 4, gold, 6, x, 15, 0)); const r = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24), gold); r.rotation.x = Math.PI / 2; r.position.set(x, 13, 0); g.add(r); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(sph(0.22, std('#fff6d8', { emissive: '#ffe2a0', emissiveIntensity: 2 }), x + Math.cos(a) * 1.4, 13.3, Math.sin(a) * 1.4, 10)); } }
  // the dog's chair at the right end of the table
  const ch = new THREE.Group(); ch.position.set(5.6, 0, TABLE_Z + 2.6); g.add(ch); const wood = std('#5a3820');
  ch.add(box(2.4, 0.25, 2.4, wood, 0, 2.1, 0));   // a stool (no back, so the camera sees him) for (const x of [-1, 1]) for (const z of [-1, 1]) ch.add(box(0.2, 2.1, 0.2, wood, x, 1.05, z));
  const lamp = new THREE.PointLight('#ffe6b8', 0, 50, 1.0); lamp.position.set(0, 12, 6); g.add(lamp);
  return { group: g, lamp, chairY: 2.22, chair: ch.position.clone() };
}
// ---------- Rio, 1983 ----------
export const RIO_CASE = V(0, 0, -5);
export function rio(scene) {
  const g = new THREE.Group(); g.name = 'rio'; g.position.copy(RIO); scene.add(g);
  g.add(flat(40, 30, std('#ffffff', { map: rep(stone('#8a8478', 12), 6, 5), roughness: 0.8 }), 0, 0, 2));
  const wall = std('#2f5a3a', { roughness: 0.9 });
  g.add(box(40, 16, 0.6, wall, 0, 8, -12.3), box(0.6, 16, 30, wall, -19.7, 8, 2), box(0.6, 16, 30, wall, 19.7, 8, 2), box(40, 0.5, 0.7, std('#e0b23a'), 0, 12, -12));
  // window: the bay at night, the sugarloaf hill, the moon
  const win = label(8, 6, 400, 300, (x, w, h) => {
    const s = x.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#0b1430'); s.addColorStop(1, '#2a3a6a'); x.fillStyle = s; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f6f1d8'; x.beginPath(); x.arc(310, 70, 26, 0, 7); x.fill(); x.fillStyle = '#0a0f20'; x.beginPath(); x.moveTo(150, h); x.quadraticCurveTo(200, 70, 250, h); x.fill(); x.beginPath(); x.moveTo(0, h); x.quadraticCurveTo(70, 170, 160, h); x.fill();
    x.fillStyle = '#1a2a4a'; x.fillRect(0, 240, w, 60); x.fillStyle = '#ffd98a'; const r = rng(3); for (let i = 0; i < 40; i++) x.fillRect(r() * w, 230 + r() * 40, 3, 3);
    x.strokeStyle = '#d9d2c0'; x.lineWidth = 12; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
  }, { emissive: '#ffffff', emissiveIntensity: 0.4 });
  win.position.set(-10, 8, -11.95); g.add(win);
  const sg = label(9, 1.3, 900, 130, (x, w, h) => { x.fillStyle = '#e0b23a'; x.fillRect(0, 0, w, h); MS(x, 'FOOTBALL HEADQUARTERS · RIO', w / 2, h / 2 + 2, 52, '#16244a'); });
  sg.position.set(6, 10.6, -11.95); g.add(sg);
  // the cabinet on its stand, front glass toward the camera (+z); the wooden back (-z side) hinged open
  const c = RIO_CASE, wood = std('#6e4526', { roughness: 0.6 });
  g.add(box(3.2, 3.0, 2.4, wood, c.x, 1.5, c.z), box(3.0, 0.2, 2.2, std('#e9e2c8'), c.x, 3.1, c.z));
  const frame = std('#3a2416'); for (const x of [-1.45, 1.45]) g.add(box(0.15, 3.0, 0.15, frame, c.x + x, 4.6, c.z + 1.05), box(0.15, 3.0, 0.15, frame, c.x + x, 4.6, c.z - 1.05));
  g.add(box(3.05, 0.15, 2.25, frame, c.x, 6.1, c.z), box(0.1, 3.0, 2.1, wood, c.x - 1.48, 4.6, c.z), box(0.1, 3.0, 2.1, wood, c.x + 1.48, 4.6, c.z));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.9, 0.08), new THREE.MeshStandardMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.18, roughness: 0.03, depthWrite: false }));
  glass.position.set(c.x, 4.6, c.z + 1.08); glass.renderOrder = 3; g.add(glass);
  const back = new THREE.Group(); back.position.set(c.x + 1.45, 3.15, c.z - 1.08); g.add(back);
  back.add(box(2.9, 2.9, 0.12, wood, -1.45, 1.45, 0));
  const plaque = label(2.4, 0.5, 480, 100, (x, w, h) => { x.fillStyle = '#e6be52'; x.fillRect(0, 0, w, h); MS(x, 'TAÇA JULES RIMET', w / 2, h / 2 + 2, 44, '#4a3608'); }, { metalness: 0.5, roughness: 0.35 });
  plaque.position.set(c.x, 2.5, c.z + 1.21); g.add(plaque);
  const lamp = new THREE.PointLight('#9fb7ff', 0, 40, 1.2); lamp.position.set(-6, 9, 4); g.add(lamp);
  const spot = new THREE.SpotLight('#fff1d6', 0, 22, 0.35, 0.5, 1); spot.position.set(c.x + 2, 11, c.z + 5); spot.target.position.set(c.x, 4, c.z); g.add(spot, spot.target);
  return { group: g, lamp, spot, back };
}
