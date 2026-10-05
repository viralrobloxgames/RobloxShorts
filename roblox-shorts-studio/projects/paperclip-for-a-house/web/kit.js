// He Traded A Paperclip For A House: sets and props built in code (no pack accessories, so the fit check has nothing to fit).
// World layout (studs, floor y 0). Places are far apart so they never share a frame:
//   STREET  origin. A suburban street along x: sidewalk z -0.4..3.4 (path z 1.5), lawns and houses to -z, road to +z.
//           Max's house at x -40; the four traders wait on the sidewalk at TRADER_X.
//   PLAZA   (0, 0, -300). A round studded trading plaza with a TRADE arch: the montage and the snow-globe trade.
//   ROOM    (240, 0, 0). The actor's snow-globe room: floor-to-ceiling shelves of globes, one empty glowing slot.
//   TOWN    (-240, 0, 0). A tiny prairie town: WELCOME sign, audition stage, and the two-storey house (with the giant
//           red paperclip the town later put up in the yard).
// Every prop is built with its origin where the hand holds it (see GRIP notes per prop) and its front facing +z.
import * as THREE from 'three';
import { canvasTexture, rng, studs } from '../../../web/lib/world.js';
import { roundedCylinder } from '../../../web/lib/rig.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = true; return s; };
const label = (w, h, pw, ph, draw, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o })); return m; };
const font = (px, f = '"Luckiest Guy"') => `${px}px ${f}`;
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = font(px); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const STREET = V(0, 0, 0), PLAZA = V(0, 0, -300), ROOM = V(240, 0, 0), TOWN = V(-240, 0, 0);
export const PATH_Z = 1.5, HOME_X = -40, TRADER_X = [0, 9, 18, 27];

// ======================================================= props =======================================================
const RED = () => std('#d7262e', { roughness: 0.25, metalness: 0.35 });

// The red paperclip: a wire bent into the classic three-loop shape, in the xy plane. GRIP: origin at the bottom bend;
// `size` is its length. Held upright in the fist, so the loops stand above the hand.
export function paperclip(size = 1.9, wire = 0.075, m = RED()) {
  const s = size / 1.9, pts = [];
  const line = (a, b, n = 8) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push(V((a[0] + (b[0] - a[0]) * u) * s, (a[1] + (b[1] - a[1]) * u) * s, 0)); } };
  const arc = (cx, cy, r, a0, a1, n = 16) => { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push(V((cx + Math.cos(a) * r) * s, (cy + Math.sin(a) * r) * s, 0)); } };
  line([0.16, 0.55], [0.16, 1.55]); arc(0, 1.55, 0.16, 0, Math.PI);
  line([-0.16, 1.55], [-0.16, 0.32]); arc(0.07, 0.32, 0.23, Math.PI, 2 * Math.PI);
  line([0.30, 0.32], [0.30, 1.62]); arc(0, 1.62, 0.30, 0, Math.PI);
  line([-0.30, 1.62], [-0.30, 0.62], 6); pts.push(V(-0.30 * s, 0.62 * s, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 260, wire * s, 10, false), m); tube.castShadow = true;
  const g = new THREE.Group(); tube.position.y = 0.09 * s; g.add(tube);                          // bottom bend sits on the fist
  for (const p of [pts[0], pts[pts.length - 1]]) g.add(sph(wire * s, m, p.x, p.y + 0.09 * s, 0, 10));
  return g;
}

// A ballpoint pen with a fish on top. GRIP: origin 0.25 up the barrel (the fist), pen stands upright.
export function fishPen() {
  const g = new THREE.Group(), body = std('#3a86ff', { roughness: 0.3 }), fish = std('#ff8c2a', { roughness: 0.35 });
  g.add(cyl(0.075, 0.075, 1.05, body, 12, 0, 0.18, 0), cyl(0.075, 0.0, 0.2, std('#d9dde3', { metalness: 0.7, roughness: 0.3 }), 12, 0, -0.44, 0));
  const f = new THREE.Group(); f.position.set(0, 0.95, 0); g.add(f);
  const b = sph(0.3, fish, 0, 0, 0); b.scale.set(1.5, 0.95, 0.6); f.add(b);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 4), fish); tail.rotation.z = Math.PI / 2; tail.position.set(-0.6, 0, 0); tail.scale.set(1, 1, 0.35); tail.castShadow = true; f.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), fish); fin.position.set(0, 0.32, 0); fin.scale.set(1, 1, 0.3); f.add(fin);
  for (const z of [-0.17, 0.17]) { f.add(sph(0.075, std('#ffffff'), 0.25, 0.06, z, 10), sph(0.042, std('#111111'), 0.29, 0.06, z * 1.3, 8)); }
  return g;
}

// A brass doorknob with a face on it (eyes, smile and blush are geometry on the +z side, so the face always reads).
// GRIP: origin at the bottom of the rose plate; the spindle sits in the fist.
export function doorknob() {
  const g = new THREE.Group(), brass = std('#d9a93a', { metalness: 0.6, roughness: 0.32 }), ink = std('#4a2c06', { roughness: 0.6 });
  const knob = sph(0.4, brass, 0, 0.64, 0, 32); g.add(knob);
  for (const x of [-0.14, 0.14]) { const e = sph(0.055, ink, x, 0.74, 0.37, 12); e.scale.set(1, 1.6, 0.6); g.add(e); }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.028, 8, 20, Math.PI), ink); smile.rotation.z = Math.PI; smile.position.set(0, 0.6, 0.355); smile.rotation.x = -0.25; g.add(smile);
  for (const x of [-0.25, 0.25]) { const c = sph(0.06, std('#ff8a7a', { roughness: 0.7 }), x, 0.6, 0.31, 10); c.scale.set(1.3, 0.7, 0.5); g.add(c); }
  g.add(cyl(0.11, 0.11, 0.3, brass, 12, 0, 0.18, 0), cyl(0.3, 0.3, 0.07, brass, 24, 0, 0.035, 0));
  g.userData.knob = knob;
  return g;
}

// A green two-burner camping stove, lid up. Carried on the forearms: origin at the bottom centre, front +z.
export function campStove() {
  const g = new THREE.Group(), green = std('#2f8f46', { roughness: 0.45, metalness: 0.3 }), dark = std('#222630', { roughness: 0.4, metalness: 0.5 });
  g.add(box(1.6, 0.42, 0.9, green, 0, 0.21, 0));
  for (const x of [-0.4, 0.4]) { g.add(cyl(0.24, 0.24, 0.05, dark, 16, x, 0.44, 0)); g.add(box(0.5, 0.04, 0.06, dark, x, 0.48, 0), box(0.06, 0.04, 0.5, dark, x, 0.48, 0)); }
  const lid = box(1.6, 0.86, 0.06, green, 0, 0.84, -0.45); lid.rotation.x = -0.12; g.add(lid);
  for (const s of [-1, 1]) { const f = box(0.06, 0.5, 0.86, green, s * 0.8, 0.66, 0); g.add(f); }
  g.add(box(0.5, 0.16, 0.06, std('#ffd23f'), 0, 0.22, 0.46));
  return g;
}

// A red portable generator in a black tube frame. Carried on the forearms: origin at the bottom centre, front +z.
export function generator() {
  const g = new THREE.Group(), red = std('#e63946', { roughness: 0.4, metalness: 0.2 }), dark = std('#1d1f27', { roughness: 0.35, metalness: 0.6 });
  g.add(box(1.5, 0.95, 0.95, red, 0, 0.62, 0));
  for (const [x, z] of [[-0.82, -0.52], [0.82, -0.52], [-0.82, 0.52], [0.82, 0.52]]) g.add(box(0.1, 1.25, 0.1, dark, x, 0.62, z));
  for (const y of [0.05, 1.22]) for (const z of [-0.52, 0.52]) g.add(box(1.74, 0.1, 0.1, dark, 0, y, z));
  const panel = label(1.0, 0.5, 400, 200, (x, w, h) => { x.fillStyle = '#2b2d42'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(70, 100, 34, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(140, 70, 70, 60); x.fillRect(240, 70, 70, 60); MS(x, 'POWER', 300, 170, 30, '#ffd23f'); });
  panel.position.set(0, 0.64, 0.48); g.add(panel);
  return g;
}

// A blocky yellow snowmobile, 4.2 long along x. Origin on the ground under its middle.
export function snowmobile() {
  const g = new THREE.Group(), y = std('#ffbe0b', { roughness: 0.35, metalness: 0.2 }), dark = std('#1d1f27', { roughness: 0.5 }), steel = std('#c9ced6', { metalness: 0.8, roughness: 0.3 });
  g.add(box(2.4, 0.5, 1.3, dark, -0.4, 0.45, 0));                                                  // track
  g.add(box(3.0, 0.7, 1.4, y, 0.1, 1.0, 0), box(1.2, 0.5, 1.3, y, 1.4, 0.75, 0));
  g.add(box(1.5, 0.3, 0.9, std('#222630'), -0.5, 1.5, 0));                                         // seat
  const ws = box(0.08, 0.6, 1.1, std('#9fd0f5', { transparent: true, opacity: 0.55, roughness: 0.1 }), 0.9, 1.7, 0); ws.rotation.z = -0.4; g.add(ws);
  g.add(box(0.1, 0.1, 1.2, steel, 0.6, 1.65, 0));                                                  // handlebar
  for (const z of [-0.55, 0.55]) { g.add(box(2.0, 0.08, 0.3, steel, 1.5, 0.06, z)); const tip = box(0.4, 0.08, 0.3, steel, 2.55, 0.18, z); tip.rotation.z = 0.6; g.add(tip); g.add(box(0.1, 0.6, 0.1, steel, 1.5, 0.35, z)); }
  return g;
}

// A plane ticket. GRIP: origin at the bottom edge centre, card upright facing +z.
export function ticket() {
  const g = new THREE.Group();
  const m = label(1.5, 0.75, 600, 300, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a86ff'; x.fillRect(0, 0, w, 70);
    MS(x, 'BOARDING PASS', w / 2, 36, 36, '#ffffff'); LG(x, 'TRIP', 190, 170, 110, '#16182a');
    x.save(); x.translate(450, 170); x.fillStyle = '#3a86ff'; x.beginPath(); x.moveTo(-80, 0); x.lineTo(70, -10); x.lineTo(90, 0); x.lineTo(70, 10); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-10, 0); x.lineTo(-40, -60); x.lineTo(-20, -60); x.lineTo(30, 0); x.lineTo(-20, 60); x.lineTo(-40, 60); x.closePath(); x.fill(); x.restore();
    x.setLineDash([10, 10]); x.strokeStyle = '#9aa3b5'; x.lineWidth = 4; x.beginPath(); x.moveTo(330, 80); x.lineTo(330, h); x.stroke();
  }, { side: THREE.DoubleSide });
  m.position.y = 0.42; g.add(m); return g;
}

// A white box truck, 7.6 long along x. Origin on the ground under its middle.
export function boxTruck() {
  const g = new THREE.Group(), white = std('#f4f4f8', { roughness: 0.5 }), cab = std('#3a86ff', { roughness: 0.35, metalness: 0.2 }), dark = std('#1d1f27', { roughness: 0.6 }), glass = std('#9fd0f5', { roughness: 0.1 });
  g.add(box(5.0, 3.2, 2.8, white, -1.2, 2.6, 0), box(2.3, 2.2, 2.6, cab, 2.55, 2.0, 0), box(0.06, 1.0, 2.2, glass, 3.72, 2.5, 0), box(1.2, 0.9, 0.06, glass, 2.6, 2.5, 1.31));
  g.add(box(7.6, 0.4, 2.4, dark, 0, 0.9, 0));
  for (const x of [-2.8, -1.6, 2.6]) for (const z of [-1.2, 1.2]) { const w = cyl(0.62, 0.62, 0.4, dark, 18, x, 0.62, z); w.rotation.x = Math.PI / 2; g.add(w); }
  const side = label(4.4, 1.6, 880, 320, (x, w, h) => { x.fillStyle = '#f4f4f8'; x.fillRect(0, 0, w, h); LG(x, 'MOVING DAY!', w / 2, h / 2, 120, '#3a86ff'); });
  side.position.set(-1.2, 2.8, 1.41); g.add(side);
  return g;
}

// A framed gold record. GRIP: origin at the bottom edge centre, upright facing +z.
export function goldRecord() {
  const g = new THREE.Group(), frame = std('#1d1f27', { roughness: 0.4 });
  g.add(box(1.25, 1.5, 0.08, frame, 0, 0.75, 0));
  const disc = cyl(0.48, 0.48, 0.04, std('#f2c14e', { metalness: 0.9, roughness: 0.2 }), 32, 0, 0.88, 0.06); disc.rotation.x = Math.PI / 2; g.add(disc);
  const lab = cyl(0.14, 0.14, 0.045, std('#e63946'), 24, 0, 0.88, 0.07); lab.rotation.x = Math.PI / 2; g.add(lab);
  const plate = label(1.05, 0.24, 420, 96, (x, w, h) => { x.fillStyle = '#f2c14e'; x.fillRect(0, 0, w, h); LG(x, 'RECORD DEAL', w / 2, h / 2 + 4, 66, '#1d1f27'); });
  plate.position.set(0, 0.2, 0.045); g.add(plate);
  return g;
}

// A key with a paper tag. GRIP: origin at the bow (ring), key pointing up. `tag` text lines on the tag.
export function keyWithTag(lines, { size = 1, color = '#f2c14e', tagColor = '#fff6dc' } = {}) {
  const g = new THREE.Group(), gold = std(color, { metalness: 0.85, roughness: 0.25 });
  const k = new THREE.Group(); k.scale.setScalar(size); g.add(k);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 10, 24), gold); bow.position.y = 0.1; bow.castShadow = true; k.add(bow);
  k.add(box(0.1, 0.95, 0.08, gold, 0, 0.78, 0), box(0.24, 0.1, 0.08, gold, 0.12, 1.12, 0), box(0.18, 0.1, 0.08, gold, 0.1, 0.95, 0));
  const tag = label(0.62, 0.42, 310, 210, (x, w, h) => {
    x.fillStyle = tagColor; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a66b'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
    lines.forEach((t, i) => LG(x, t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 62, i === 0 ? 70 : 50, i === 0 ? '#e63946' : '#16182a'));
  }, { side: THREE.DoubleSide });
  tag.position.set(-0.42, 0.18, 0.02); tag.rotation.z = 0.25; k.add(tag);
  return g;
}

// A VIP pass on a lanyard: an afternoon with a rock star. GRIP: origin at the bottom edge centre, upright facing +z.
export function vipPass() {
  const g = new THREE.Group();
  const card = label(0.95, 1.3, 380, 520, (x, w, h) => {
    x.fillStyle = '#16182a'; x.fillRect(0, 0, w, h); x.fillStyle = '#8338ec'; x.fillRect(0, 0, w, 120);
    LG(x, 'VIP', w / 2, 66, 100, '#ffd23f');
    x.save(); x.translate(w / 2, 260); x.rotate(-0.6); x.fillStyle = '#e63946';                     // a guitar
    x.beginPath(); x.ellipse(0, 50, 46, 56, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, -5, 36, 40, 0, 0, 7); x.fill();
    x.fillStyle = '#16182a'; x.beginPath(); x.arc(0, 40, 14, 0, 7); x.fill(); x.fillStyle = '#c98a3a'; x.fillRect(-7, -150, 14, 160); x.fillStyle = '#1d1f27'; x.fillRect(-14, -178, 28, 34); x.restore();
    MS(x, 'AFTERNOON', w / 2, 400, 40, '#ffffff'); MS(x, 'WITH A', w / 2, 442, 30, '#ffffff'); LG(x, 'ROCK STAR', w / 2, 488, 50, '#ffd23f');
  }, { side: THREE.DoubleSide });
  card.position.y = 0.68; g.add(card);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24, Math.PI), std('#8338ec')); strap.position.y = 1.33; strap.castShadow = true; g.add(strap);
  return g;
}

// A snow globe. GRIP: origin at the bottom of the base; rests on the palm. `kind` 'star' is the trade globe (purple base,
// gold stars, a tiny stage with a guitar inside); 'plain' globes fill the shelves.
export function snowGlobe(r = 0.42, kind = 'star', baseColor = '#8338ec') {
  const g = new THREE.Group();
  g.add(cyl(r * 0.85, r * 0.95, r * 0.55, std(baseColor, { roughness: 0.35, metalness: 0.3 }), 24, 0, r * 0.275, 0));
  const glass = sph(r, new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false }), 0, r * 0.55 + r * 0.9, 0, 28);
  glass.castShadow = false; glass.renderOrder = 3; g.add(glass);
  const inside = new THREE.Group(); inside.position.y = r * 0.6; g.add(inside);
  inside.add(cyl(r * 0.75, r * 0.75, r * 0.12, std('#ffffff', { roughness: 0.9 }), 20, 0, r * 0.06, 0));
  if (kind === 'star') {
    inside.add(box(r * 0.9, r * 0.12, r * 0.5, std('#16182a'), 0, r * 0.18, 0));
    const gt = box(r * 0.16, r * 0.7, r * 0.08, std('#e63946'), 0, r * 0.6, 0); gt.rotation.z = 0.5; inside.add(gt);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; const st = sph(r * 0.07, std('#ffd23f', { emissive: '#ffd23f', emissiveIntensity: 0.4 }), Math.cos(a) * r * 0.86, r * 0.28, Math.sin(a) * r * 0.86, 8); g.add(st); }
  } else {
    inside.add(box(r * 0.5, r * 0.45, r * 0.4, std('#e63946'), 0, r * 0.35, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 0.42, r * 0.3, 4), std('#264653')); roof.rotation.y = Math.PI / 4; roof.position.y = r * 0.72; inside.add(roof);
  }
  const fl = rng(r * 1000 | 0), pts = [];
  for (let i = 0; i < 40; i++) { const u = fl() * 2 - 1, a = fl() * 6.283, d = Math.cbrt(fl()) * r * 0.85; pts.push(Math.sqrt(1 - u * u) * Math.cos(a) * d, r * 1.45 + u * d, Math.sqrt(1 - u * u) * Math.sin(a) * d); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.045, sizeAttenuation: true })); g.add(snow);
  g.userData = { snow, r };
  return g;
}

// A film clapperboard reading MOVIE ROLE. GRIP: origin at the bottom edge centre, upright facing +z. userData.arm opens.
export function clapperboard() {
  const g = new THREE.Group(), black = std('#16182a', { roughness: 0.5 });
  const slate = label(1.3, 0.95, 520, 380, (x, w, h) => {
    x.fillStyle = '#16182a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28);
    LG(x, 'MOVIE', w / 2, 120, 110, '#ffffff'); LG(x, 'ROLE', w / 2, 240, 110, '#ffd23f'); MS(x, 'SCENE 1   TAKE 1', w / 2, 330, 30, '#9aa3b5');
  });
  slate.position.set(0, 0.52, 0.051); g.add(slate, box(1.3, 0.95, 0.1, black, 0, 0.52, 0));
  const stripes = canvasTexture(520, 64, (x, w, h) => { x.fillStyle = '#16182a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; for (let i = -1; i < 9; i++) { x.beginPath(); x.moveTo(i * 64, h); x.lineTo(i * 64 + 32, h); x.lineTo(i * 64 + 64, 0); x.lineTo(i * 64 + 32, 0); x.closePath(); x.fill(); } });
  const sm = new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5 });
  g.add((() => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.1), [black, black, black, black, sm, black]); b.position.set(0, 1.08, 0); b.castShadow = true; return b; })());
  const arm = new THREE.Group(); arm.position.set(-0.65, 1.16, 0); g.add(arm);
  const a = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.1), [black, black, black, black, sm, black]); a.position.set(0.65, 0.08, 0); a.castShadow = true; arm.add(a);
  g.userData.arm = arm;
  return g;
}

// ======================================================= sets ========================================================
function grassTex(base = '#6dbb4f', seed = 3) {
  const t = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const r = rng(seed); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '40,110,30' : '170,230,120'},0.22)`; x.fillRect(r() * w, r() * h, 2, 3); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function tiles(base = '#d9dbe2', line = 'rgba(90,95,110,.35)', n = 4) {
  const t = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.strokeStyle = line; x.lineWidth = 3; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * w / n, 0); x.lineTo(i * w / n, h); x.moveTo(0, i * h / n); x.lineTo(w, i * h / n); x.stroke(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const flat = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };

// A small suburban house, front door facing +z, origin at the middle of its front wall on the ground.
function cottage(wallC, roofC, doorC, seed) {
  const g = new THREE.Group(), wall = std(wallC, { roughness: 0.8 }), roof = std(roofC, { roughness: 0.7 }), trim = std('#ffffff', { roughness: 0.5 });
  g.add(box(11, 7, 8, wall, 0, 3.5, -4));
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 7.6, 3.6, 4, 1), roof); r.rotation.y = Math.PI / 4; r.scale.set(1.15, 1, 0.82); r.position.set(0, 8.8, -4); r.castShadow = true; g.add(r);
  g.add(box(2.4, 4.6, 0.2, std(doorC), 0, 2.3, 0.05), box(2.9, 0.3, 0.3, trim, 0, 4.75, 0.1));
  for (const x of [-3.4, 3.4]) { g.add(box(2.4, 2.2, 0.2, trim, x, 4.2, 0.05), box(2.0, 1.8, 0.24, std('#9fd0f5', { roughness: 0.1 }), x, 4.2, 0.08)); }
  g.add(box(0.2, 0.2, 0.2, std('#ffd23f', { metalness: 0.7 }), 0.8, 2.3, 0.2));
  const rr = rng(seed);
  for (const x of [-4.6, 4.6]) { const b = sph(0.9 + rr() * 0.3, std('#3c9a3f'), x, 0.7, 1.2, 12); b.scale.y = 0.8; g.add(b); }
  return g;
}
function tree(s = 1) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  g.add(box(0.8, 4, 0.8, std('#8a5a33'), 0, 2, 0));
  for (const [x, y, z, r] of [[0, 5.2, 0, 2.2], [1.2, 4.6, 0.4, 1.5], [-1.1, 4.7, -0.3, 1.6], [0.2, 6.4, 0.2, 1.4]]) g.add(sph(r, std('#4caf50', { roughness: 0.8 }), x, y, z, 12));
  return g;
}

// ---------- the street ----------
export function street(scene) {
  const g = new THREE.Group(); g.name = 'street'; g.position.copy(STREET); scene.add(g);
  const gt = grassTex(); gt.repeat.set(40, 8);
  g.add(flat(200, 40, std('#ffffff', { map: gt, roughness: 0.95 }), -10, 0, -20.4));
  const st = tiles(); st.repeat.set(50, 1);
  g.add(flat(200, 3.8, std('#ffffff', { map: st, roughness: 0.8 }), -10, 0.03, 1.5));
  g.add(box(200, 0.25, 0.3, std('#b8bcc8'), -10, 0.12, 3.5));                                         // kerb
  g.add(flat(200, 14, std('#3d4250', { roughness: 0.85 }), -10, 0.01, 10.6));
  for (let x = -100; x < 90; x += 8) g.add(flat(3.6, 0.35, std('#ffd23f', { roughness: 0.6 }), x, 0.02, 10.6));
  const gt2 = grassTex('#6dbb4f', 8); gt2.repeat.set(40, 4);
  g.add(flat(200, 20, std('#ffffff', { map: gt2, roughness: 0.95 }), -10, 0, 27.6));
  // houses behind the sidewalk (one per trader, plus Max's at HOME_X), each with a garden path
  const COL = [['#ffd6a5', '#e76f51', '#3a86ff'], ['#bde0fe', '#264653', '#e63946'], ['#ffc8dd', '#6d597a', '#2a9d8f'], ['#caffbf', '#8a5a33', '#8338ec'], ['#fdffb6', '#e63946', '#264653'], ['#e9edc9', '#3a5a40', '#ff7a59']];
  const xs = [HOME_X, -26, ...TRADER_X, 40, 52];
  xs.forEach((x, i) => {
    const c = COL[i % COL.length], h = cottage(c[0], c[1], c[2], i + 1); h.position.set(x, 0, -9); g.add(h);
    g.add(flat(1.8, 8.6, std('#c9b79c', { roughness: 0.9 }), x, 0.025, -4.7));
  });
  for (const [x, z, s] of [[-33, -5, 1], [-20, -6, 0.9], [4.5, -5.5, 0.8], [13.5, -6, 0.85], [22.5, -5, 0.8], [33, -6, 1], [-48, -5, 1.1], [46, -5, 0.9]]) { const t = tree(s); t.position.set(x, 0, z); g.add(t); }
  // fences along the lawns between houses
  const fence = std('#ffffff', { roughness: 0.6 });
  for (let x = -60; x < 60; x += 1.2) { if (xs.some((h) => Math.abs(x - h) < 1.4)) continue; g.add(box(0.18, 1.1, 0.12, fence, x, 0.55, -0.9)); }
  g.add(box(120, 0.14, 0.1, fence, 0, 0.85, -0.9), box(120, 0.14, 0.1, fence, 0, 0.45, -0.9));
  // across the road: more houses facing -z
  [-44, -30, -16, -2, 12, 26, 40].forEach((x, i) => { const c = COL[(i + 3) % COL.length], h = cottage(c[0], c[1], c[2], 20 + i); h.position.set(x, 0, 30); h.rotation.y = Math.PI; g.add(h); });
  // a mailbox reading MAX at his house
  const mb = new THREE.Group(); mb.position.set(HOME_X + 2.6, 0, -0.2); g.add(mb);
  mb.add(box(0.2, 2.4, 0.2, std('#8a5a33'), 0, 1.2, 0), box(1.0, 0.7, 0.6, std('#3a86ff', { metalness: 0.3, roughness: 0.4 }), 0, 2.6, 0));
  const ml = label(0.9, 0.36, 300, 120, (x, w, h) => { x.fillStyle = '#3a86ff'; x.fillRect(0, 0, w, h); LG(x, 'MAX', w / 2, h / 2 + 4, 90, '#ffffff'); }); ml.position.set(0, 2.6, 0.31); mb.add(ml);
  return { group: g };
}

// ---------- the trading plaza ----------
export function plaza(scene) {
  const g = new THREE.Group(); g.name = 'plaza'; g.position.copy(PLAZA); scene.add(g);
  const gt = grassTex('#74c35a', 11); gt.repeat.set(30, 30);
  g.add(flat(300, 300, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 0, 0));
  const padM = std('#9aa3b5', { roughness: 0.45 });
  const pad = new THREE.Mesh(roundedCylinder(11, 0.5, 0.12, 64), padM); pad.position.y = 0.25; pad.castShadow = pad.receiveShadow = true; g.add(pad);
  const ring = new THREE.Mesh(new THREE.RingGeometry(10.2, 10.8, 64), std('#ffd23f', { roughness: 0.4 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.51; g.add(ring);
  const st = studs(18, 18, 0.5, padM, 1.2); g.add(st);
  // the arch behind
  const archM = std('#8338ec', { roughness: 0.4 }), gold = std('#ffd23f', { roughness: 0.35, metalness: 0.3 });
  g.add(box(1.4, 12, 1.4, archM, -9, 6, -9), box(1.4, 12, 1.4, archM, 9, 6, -9), box(20, 2.6, 1.4, archM, 0, 12.4, -9));
  const sign = label(17, 2.2, 1700, 220, (x, w, h) => { x.fillStyle = '#8338ec'; x.fillRect(0, 0, w, h); LG(x, 'TRADING PLAZA', w / 2, h / 2 + 8, 170, '#ffd23f'); }); sign.position.set(0, 12.4, -8.28); g.add(sign);
  for (const x of [-9, 9]) g.add(sph(0.8, gold, x, 12.6, -9, 14));
  // display pedestal (stage right of Max) for the items that don't fit in a hand
  const ped = new THREE.Group(); ped.position.set(-3.8, 0.5, -1.6); g.add(ped);
  ped.add(cyl(2.6, 2.8, 0.5, std('#ffffff', { roughness: 0.3 }), 32, 0, 0.25, 0));
  const pring = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.08, 8, 48), gold); pring.rotation.x = Math.PI / 2; pring.position.y = 0.5; ped.add(pring);
  for (const [x, z, s] of [[-16, -14, 1.2], [15, -15, 1], [-22, 2, 0.9], [22, 0, 1.1], [-12, -24, 1], [10, -26, 1.2]]) { const t = tree(s); t.position.set(x, 0, z); g.add(t); }
  // bunting between the pillars
  const cols = ['#e63946', '#ffd23f', '#2a9d8f', '#3a86ff', '#ff7a59'];
  for (let i = 0; i < 15; i++) { const u = (i + 0.5) / 15; const sh = new THREE.Shape(); sh.moveTo(-0.45, 0); sh.lineTo(0.45, 0); sh.lineTo(0, -1); sh.closePath(); const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), std(cols[i % 5], { side: THREE.DoubleSide })); f.position.set(-8.3 + 16.6 * u, 10.9 - 1.2 * Math.sin(Math.PI * u), -8.2); g.add(f); }
  return { group: g, pedestal: ped, floorY: 0.5 };
}

// ---------- the snow-globe room ----------
// Back wall z -9 is all shelves (6 rows); side walls too. One slot in the middle of row 3 is empty and glows (EMPTY_SLOT).
export const ROOM_SLOT = V(ROOM.x + 0.0, 0, ROOM.z - 8.4);
export function globeRoom(scene) {
  const g = new THREE.Group(); g.name = 'room'; g.position.copy(ROOM); scene.add(g);
  const ft = tiles('#7a4b2c', 'rgba(40,20,8,.35)', 6); ft.repeat.set(5, 4);
  g.add(flat(26, 22, std('#ffffff', { map: ft, roughness: 0.55 }), 0, 0, 1));
  const wallM = std('#2b2d42', { roughness: 0.85 }), wood = std('#a0673a', { roughness: 0.5 });
  g.add(box(26, 14, 0.6, wallM, 0, 7, -9.6), box(0.6, 14, 22, wallM, -13, 7, 1), box(0.6, 14, 22, wallM, 13, 7, 1), box(26.6, 0.4, 22, std('#1d1f27'), 0, 14.2, 1));
  const rug = new THREE.Mesh(new THREE.CircleGeometry(5, 40), std('#e63946', { roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, 0.5); g.add(rug);
  // shelves: rows at these heights, back wall from x -12..12, side walls z -8..6
  const ROWS = [0.9, 2.7, 4.5, 6.3, 8.1, 9.9, 11.7];
  for (const y of ROWS) { g.add(box(24.4, 0.18, 1.3, wood, 0, y - 0.09, -8.75)); for (const s of [-1, 1]) g.add(box(1.3, 0.18, 14.4, wood, s * 12.25, y - 0.09, -1)); }
  for (const x of [-12.2, -6, 0, 6, 12.2]) g.add(box(0.2, 12, 1.3, wood, x, 6.2, -8.75));
  // globes: instanced bases and glass, a few snow-house insides
  const slots = [];
  ROWS.forEach((y, ri) => {
    for (let i = 0; i < 26; i++) { const x = -11.6 + i * 0.93; if (ri === 3 && Math.abs(x - 0.0) < 0.5) continue; slots.push([x, y, -8.75]); }
    for (const s of [-1, 1]) for (let i = 0; i < 15; i++) slots.push([s * 12.25, y, -7.6 + i * 0.93]);
  });
  const n = slots.length, r = 0.36;
  const baseI = new THREE.InstancedMesh(new THREE.CylinderGeometry(r * 0.85, r * 0.95, r * 0.55, 14), std('#ffffff', { roughness: 0.4 }), n);
  const glassI = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false }), n);
  const inI = new THREE.InstancedMesh(new THREE.BoxGeometry(r * 0.6, r * 0.6, r * 0.6), std('#ffffff', { roughness: 0.6 }), n);
  const snowI = new THREE.InstancedMesh(new THREE.CylinderGeometry(r * 0.75, r * 0.75, r * 0.1, 12), std('#ffffff', { roughness: 0.9 }), n);
  const M = new THREE.Matrix4(), C = new THREE.Color(), rr = rng(21), BASES = ['#8338ec', '#e63946', '#2a9d8f', '#3a86ff', '#ffbe0b', '#264653', '#ff7aa2', '#6d597a'], INS = ['#e63946', '#4caf50', '#ffd23f', '#3a86ff', '#ff7a59', '#ffffff'];
  slots.forEach(([x, y, z], i) => {
    M.makeTranslation(x, y + r * 0.275, z); baseI.setMatrixAt(i, M); baseI.setColorAt(i, C.set(BASES[(rr() * BASES.length) | 0]));
    M.makeTranslation(x, y + r * 1.45, z); glassI.setMatrixAt(i, M);
    M.makeTranslation(x, y + r * 0.66, z); snowI.setMatrixAt(i, M);
    M.makeRotationY(rr() * 3).setPosition(x, y + r * 1.0, z); inI.setMatrixAt(i, M); inI.setColorAt(i, C.set(INS[(rr() * INS.length) | 0]));
  });
  for (const m of [baseI, inI, snowI]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  glassI.renderOrder = 3; g.add(glassI);
  // the empty slot: a soft glowing ring and a spotlight on it
  const glowM = new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#ffd23f', emissiveIntensity: 2.4 });
  const slotRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 8, 32), glowM); slotRing.position.set(0, ROWS[3] + 0.55, -9.0); g.add(slotRing);   // upright, on the wall behind the gap
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.9, toneMapped: false })); halo.position.set(0, ROWS[3] + 0.55, -9.04); g.add(halo);
  const slotLight = new THREE.PointLight('#ffd98a', 0, 6, 1.5); slotLight.position.set(0, ROWS[3] + 0.9, -8.0); g.add(slotLight);
  // a director's chair and a film poster frame on the left wall
  const chair = new THREE.Group(); chair.position.set(-7, 0, 2); chair.rotation.y = 0.6; g.add(chair);
  const cm = std('#1d1f27'), canvasM = std('#e63946', { roughness: 0.8 });
  for (const [a, b] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) chair.add(box(0.12, 2.0, 0.12, cm, a, 1.0, b));
  chair.add(box(1.9, 0.12, 1.5, canvasM, 0, 2.0, 0), box(1.9, 1.0, 0.1, canvasM, 0, 3.0, -0.75));
  const back = label(1.7, 0.6, 340, 120, (x, w, h) => { x.fillStyle = '#e63946'; x.fillRect(0, 0, w, h); LG(x, 'DIRECTOR', w / 2, h / 2 + 4, 70, '#ffffff'); }); back.position.set(0, 3.0, -0.69); chair.add(back);
  const lamp = new THREE.PointLight('#fff1d6', 0, 50, 1.1); lamp.position.set(0, 12.5, 2); g.add(lamp);
  const wash = new THREE.SpotLight('#fff4e0', 0, 40, 0.7, 0.6, 1); wash.position.set(0, 12, 6); wash.target.position.set(0, 5, -9); g.add(wash, wash.target);
  return { group: g, slotRing, slotLight, lamp, wash, slotY: ROWS[3] };
}

// ---------- the town ----------
// Main street along x (road z 2..12); the WELCOME sign at x -30; the audition stage at (-4, 0, -6) facing +z;
// the two-storey house at (18, 0, -10), porch facing +z (porch floor y 1.0, z -10..-7); giant paperclip in its yard.
export const TOWN_STAGE = V(TOWN.x - 4, 0, TOWN.z - 6), HOUSE = V(TOWN.x + 18, 0, TOWN.z - 10), PORCH_Y = 1.0;
export function town(scene) {
  const g = new THREE.Group(); g.name = 'town'; g.position.copy(TOWN); scene.add(g);
  const gt = grassTex('#b9c96a', 5); gt.repeat.set(40, 40);                                        // prairie grass, a little golden
  g.add(flat(400, 400, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 0, 0));
  g.add(flat(220, 10, std('#4a4f5c', { roughness: 0.85 }), 0, 0.02, 7));
  for (let x = -100; x < 100; x += 8) g.add(flat(3.6, 0.35, std('#ffffff', { roughness: 0.6 }), x, 0.03, 7));
  const st = tiles('#d6d1c4'); st.repeat.set(50, 1);
  g.add(flat(220, 3.4, std('#ffffff', { map: st, roughness: 0.8 }), 0, 0.03, 0.4));
  // WELCOME sign with a maple leaf, behind the sidewalk, board above head height (people walk in front of it)
  const ws = new THREE.Group(); ws.position.set(-30, 0, -2.4); g.add(ws);
  ws.add(box(0.4, 8.4, 0.4, std('#8a5a33'), -3.2, 4.2, -0.1), box(0.4, 8.4, 0.4, std('#8a5a33'), 3.2, 4.2, -0.1));
  const wl = label(7.4, 3.2, 740, 320, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#d7262e'; x.fillRect(0, 0, 90, h); x.fillRect(w - 90, 0, 90, h);
    MS(x, 'WELCOME TO', w / 2, 70, 46, '#16182a'); LG(x, 'KIPLING', w / 2, 170, 128, '#d7262e'); MS(x, 'SASKATCHEWAN, CANADA', w / 2, 262, 34, '#16182a');
    x.fillStyle = '#ffffff'; for (const cx of [45, w - 45]) { x.save(); x.translate(cx, h / 2); x.beginPath(); for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + i / 11 * 6.283, rr = i % 2 ? 14 : 34; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.fillRect(-3, 20, 6, 22); x.restore(); }
  });
  wl.position.set(0, 7.0, 0.07); ws.add(wl, box(7.6, 3.4, 0.2, std('#8a5a33'), 0, 7.0, -0.1));
  // main-street shops behind the sidewalk
  const SH = [['#e9c46a', 'GENERAL STORE'], ['#a8dadc', 'CAFE'], ['#f4a261', 'HARDWARE'], ['#cdb4db', 'POST OFFICE']];
  SH.forEach(([c, t], i) => {
    const x = -40 + i * 11 - (i > 1 ? 0 : 0), b = new THREE.Group(); b.position.set(x - 6, 0, -5); g.add(b);
    b.add(box(9.6, 7 + (i % 2) * 1.5, 7, std(c, { roughness: 0.8 }), 0, (7 + (i % 2) * 1.5) / 2, -3.5));
    b.add(box(2.2, 4, 0.2, std('#5c4033'), 0, 2, 0.05), box(2.6, 2.0, 0.2, std('#9fd0f5', { roughness: 0.1 }), -3, 3, 0.05), box(2.6, 2.0, 0.2, std('#9fd0f5', { roughness: 0.1 }), 3, 3, 0.05));
    const sl = label(8, 1.3, 800, 130, (x2, w, h) => { x2.fillStyle = '#ffffff'; x2.fillRect(0, 0, w, h); LG(x2, t, w / 2, h / 2 + 6, 96, '#16182a'); }); sl.position.set(0, 5.6, 0.12); b.add(sl);
  });
  // grain elevator in the distance (prairie skyline)
  const el = new THREE.Group(); el.position.set(-70, 0, -60); g.add(el);
  el.add(box(8, 26, 8, std('#c1121f', { roughness: 0.8 }), 0, 13, 0), box(5, 6, 5, std('#c1121f', { roughness: 0.8 }), 0, 29, 0));
  // the audition stage
  const stg = new THREE.Group(); stg.position.set(-4, 0, -6); g.add(stg);
  stg.add(box(10, 1.2, 6, std('#8a5a33', { roughness: 0.6 }), 0, 0.6, 0), box(10.4, 0.2, 6.4, std('#5c4033'), 0, 1.25, 0));
  stg.add(box(0.5, 7, 0.5, std('#5c4033'), -5, 3.5, -2.8), box(0.5, 7, 0.5, std('#5c4033'), 5, 3.5, -2.8), box(10.5, 0.6, 0.5, std('#5c4033'), 0, 7.2, -2.8));
  const curtain = std('#9b2226', { roughness: 0.85 }); stg.add(box(10, 6, 0.2, curtain, 0, 4.2, -3.0));
  const ab = label(7, 1.4, 700, 140, (x, w, h) => { x.fillStyle = '#ffd23f'; x.fillRect(0, 0, w, h); LG(x, 'AUDITIONS TODAY', w / 2, h / 2 + 6, 92, '#16182a'); }); ab.position.set(0, 7.2, -2.5); stg.add(ab);
  // steps up to the stage (right side)
  for (let i = 0; i < 3; i++) stg.add(box(1.6, 0.4 * (i + 1), 0.8, std('#8a5a33'), 5.9, 0.2 * (i + 1), 1.6 - i * 0.8));
  // the house: two storeys, porch, gable roof, paperclip sculpture in the yard
  const H = new THREE.Group(); H.position.set(18, 0, -10); g.add(H);
  const hw = std('#f1faee', { roughness: 0.8 }), siding = std('#a8c5da', { roughness: 0.8 }), roofM = std('#3d405b', { roughness: 0.7 }), trim = std('#ffffff', { roughness: 0.5 });
  H.add(box(14, 13, 10, siding, 0, 6.5, -6));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 9.6, 5, 4, 1), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(1.08, 1, 0.78); roof.position.set(0, 15.5, -6); roof.castShadow = true; H.add(roof);
  H.add(box(2.6, 4.6, 0.2, std('#e63946'), 0, PORCH_Y + 2.3, -0.95));                              // front door (red)
  for (const x of [-4.4, 4.4]) for (const y of [4.0, 9.8]) { H.add(box(2.6, 2.6, 0.2, trim, x, y, -0.95), box(2.2, 2.2, 0.24, std('#9fd0f5', { roughness: 0.1 }), x, y, -0.92)); }
  H.add(box(2.6, 2.6, 0.2, trim, 0, 9.8, -0.95), box(2.2, 2.2, 0.24, std('#9fd0f5', { roughness: 0.1 }), 0, 9.8, -0.92));
  // porch: floor (top at PORCH_Y), posts, roof, steps down to z +0.8 (house-relative z 0..3 is the porch)
  H.add(box(14.4, PORCH_Y, 3.4, std('#c8b6a6', { roughness: 0.7 }), 0, PORCH_Y / 2, 0.7));
  for (const x of [-6.8, -2.2, 2.2, 6.8]) H.add(box(0.35, 6.2, 0.35, trim, x, PORCH_Y + 3.1, 2.2));
  H.add(box(14.6, 0.35, 3.8, roofM, 0, PORCH_Y + 6.35, 0.7));   // high enough to clear a head on the porch
  for (const [hgt, z] of [[PORCH_Y * 2 / 3, 2.75], [PORCH_Y / 3, 3.45]]) H.add(box(3.2, hgt, 0.7, std('#c8b6a6', { roughness: 0.7 }), 0, hgt / 2, z));
  for (let x = -7; x <= 7; x += 0.7) { if (Math.abs(x) < 1.8) continue; H.add(box(0.12, 1.2, 0.12, trim, x, PORCH_Y + 0.6, 2.25)); }
  H.add(box(5.2, 0.14, 0.14, trim, -4.4, PORCH_Y + 1.2, 2.25), box(5.2, 0.14, 0.14, trim, 4.4, PORCH_Y + 1.2, 2.25));
  const num = label(1.6, 0.6, 320, 120, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); LG(x, '503', w / 2, h / 2 + 4, 96, '#16182a'); }); num.position.set(2.4, PORCH_Y + 3.6, -0.83); H.add(num);
  // giant red paperclip sculpture on a plinth, left of the walk
  const sculpt = new THREE.Group(); sculpt.position.set(-5.6, 0, 8.6); sculpt.rotation.y = 0.5; H.add(sculpt);
  sculpt.add(box(2.4, 0.8, 1.6, std('#b8bcc8', { roughness: 0.6 }), 0, 0.4, 0));
  const big = paperclip(7.0, 0.075); big.position.set(0, 0.6, 0); sculpt.add(big);
  // a front path and a white picket fence
  H.add(flat(3, 10, std('#c9b79c', { roughness: 0.9 }), 0, 0.03, 8.2));
  for (let x = -12; x <= 12; x += 0.8) { if (Math.abs(x) < 1.8) continue; H.add(box(0.16, 1.2, 0.12, trim, x, 0.6, 13)); }
  for (const [x, z, s] of [[-14, -2, 1.1], [14, -1, 1.2], [-30, -14, 1], [38, -6, 1.1], [-12, -28, 1.3]]) { const t = tree(s); t.position.set(x, 0, z); H.add(t); }
  return { group: g, house: H, sculpt };
}
