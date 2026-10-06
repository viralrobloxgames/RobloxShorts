// The Clown Case: props and sets built in code (no pack accessories, so nothing to fit-check). Every held prop is
// authored with its grip at the origin, so the clip can put that origin at a palm (gripR/gripL in clown_clip.js).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { part, canvasTexture, rng } from '../../../web/lib/world.js';

export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
export const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
export const box = (w, h, d, col, x = 0, y = 0, z = 0, o = {}) => mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(0.06, w / 4, h / 4, d / 4)), std(col, o), x, y, z);
const plane = (w, h, tex, x = 0, y = 0, z = 0, o = {}) => mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, ...o }), x, y, z);

export async function wearOutfitHere(actor, file) {
  const tex = await new THREE.TextureLoader().loadAsync(new URL(`./outfits/${file}`, import.meta.url).href);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  actor.root.traverse((o) => {
    if (!o.isMesh || o.name === 'Face' || o.name === 'Hair') return;
    if (o.material.map) { o.material = o.material.clone(); o.material.map = tex; }
  });
}
export function tintHair(actor, color) {
  actor.root.traverse((o) => { if (o.isMesh && o.name === 'Hair') { o.material = o.material.clone(); o.material.color.set(color); } });
}

// ---------- the clown candidate ----------
// Head-local: the head bone pivot is the neck at y 4; the face is the +Z side at z 0.6; eyes ~y 0.78, mouth ~0.26.
export function clownFace(actor) {
  const g = new THREE.Group(); g.name = 'ClownFace';
  g.add(mesh(new THREE.SphereGeometry(0.2, 20, 14), std('#e8202c', { roughness: 0.25, clearcoat: 1 }), 0, 0.55, 0.66));   // red nose
  for (const sx of [-1, 1]) {                                                                                          // blue diamonds over the eyes
    const d = mesh(new THREE.PlaneGeometry(0.16, 0.34), std('#2f6fe0'), sx * 0.24, 0.84, 0.612); d.rotation.z = Math.PI / 4; d.scale.set(0.7, 1, 1); g.add(d);
  }
  const wig = std('#ff7a1a', { roughness: 0.9 }), r = rng(9);                                                          // big orange wig: puffs round the head
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, up = r() * 0.6;
    const p = mesh(new THREE.SphereGeometry(0.34 + r() * 0.12, 12, 10), wig, Math.cos(a) * (0.72 + 0.1 * r()), 0.75 + up + 0.25 * Math.max(0, -Math.sin(a)), Math.sin(a) * 0.62 - 0.12);
    if (Math.sin(a) > 0.35) continue;                                                                                    // keep the face clear
    g.add(p);
  }
  for (let i = 0; i < 9; i++) g.add(mesh(new THREE.SphereGeometry(0.36, 12, 10), wig, (i - 4) * 0.17, 1.3 + 0.08 * Math.sin(i), -0.1 + 0.18 * Math.cos(i * 1.7)));
  actor.bones.Head.add(g);
  return g;
}

// A black eye for Max (left eye): a purple ring over the eye on the face.
export function blackEye(actor) {
  const g = new THREE.Group();
  const ring = mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: '#5b2a6e', transparent: true, opacity: 0.75, roughness: 0.8 }), -0.24, 0.8, 0.615);   // his right eye
  g.add(ring); g.visible = false; actor.bones.Head.add(g); return g;
}
// Whipped cream on the tip of Max's nose (attach to the nose pivot's tip).
export function creamBlob() {
  const g = new THREE.Group(), m = std('#fffaf2', { roughness: 0.35 });
  g.add(mesh(new THREE.SphereGeometry(0.16, 14, 10), m, 0, 0.06, 0), mesh(new THREE.SphereGeometry(0.1, 12, 8), m, 0.05, 0.17, -0.02), mesh(new THREE.ConeGeometry(0.06, 0.14, 8), m, 0.04, 0.28, -0.02));
  return g;
}
// The flying sundae's splat on Max's face: cream blobs and sprinkles (head-local).
export function faceSplat(actor) {
  const g = new THREE.Group(), m = std('#fffaf2', { roughness: 0.35 }), r = rng(4);
  for (let i = 0; i < 9; i++) g.add(mesh(new THREE.SphereGeometry(0.12 + r() * 0.12, 12, 8), m, (r() - 0.5) * 0.9, 0.35 + r() * 0.6, 0.6 + r() * 0.06));
  const cols = ['#ff4d7a', '#5ab0ff', '#ffd23f', '#7dff6a'];
  for (let i = 0; i < 16; i++) { const s = mesh(new THREE.BoxGeometry(0.12, 0.035, 0.035), std(cols[i % 4]), (r() - 0.5) * 0.9, 0.3 + r() * 0.7, 0.7); s.rotation.z = r() * 3; g.add(s); }
  g.visible = false; actor.bones.Head.add(g); return g;
}
export function paperHat(actor, col = '#ffffff') {
  const g = new THREE.Group(); g.add(box(1.25, 0.45, 1.25, col, 0, 1.3, 0)); g.add(box(1.28, 0.12, 1.28, '#ff8fb8', 0, 1.12, 0));
  actor.bones.Head.add(g); return g;
}
// An apron over a character's front (torso-local: the torso is 2 wide, 2 tall, 1 deep, centred at y 3).
export function apron(actor, col = '#ffffff', stripe = '#ff8fb8') {
  const tex = canvasTexture(128, 160, (c) => { c.fillStyle = col; c.fillRect(0, 0, 128, 160); c.fillStyle = stripe; for (let x = 6; x < 128; x += 22) c.fillRect(x, 0, 10, 160); });
  const g = plane(1.6, 1.7, tex, 0, -0.25, 0.52); actor.bones.Torso.add(g); return g;
}

// ---------- held props (grip at the origin, extending along -Y unless noted) ----------
// Putter: grip at the origin, shaft down to the head on the ground.
export function putter() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 10), std('#1b1b1f', { roughness: 0.8 }), 0, -0.2, 0));     // grip
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8), std('#c9ced6', { metalness: 0.9, roughness: 0.25 }), 0, -2.0, 0));
  g.add(box(0.9, 0.22, 0.3, '#c9ced6', 0.3, -3.6, 0, { metalness: 0.9, roughness: 0.25 }));
  return g;
}
// A photo (Mrs. Giggles posing), held by its bottom edge: the picture stands up from the origin.
export function photo() {
  const tex = canvasTexture(200, 260, (c) => {
    c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, 200, 260); const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#ffd9a6'); c.fillStyle = g; c.fillRect(12, 12, 176, 196);
    c.fillStyle = '#c98b5e'; c.fillRect(82, 48, 36, 36); c.fillStyle = '#4a2a12'; c.beginPath(); c.arc(100, 52, 30, Math.PI, 0); c.fill(); c.fillRect(70, 52, 14, 46); c.fillRect(116, 52, 14, 46);
    c.fillStyle = '#ff8a2a'; c.fillRect(72, 86, 56, 74); c.fillRect(62, 160, 76, 40); c.fillStyle = '#e8b931'; c.fillRect(72, 132, 56, 6);
    c.fillStyle = '#152435'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('MRS. GIGGLES', 100, 238);
  });
  const g = new THREE.Group(); g.add(plane(0.95, 1.24, tex, 0, 0.62, 0.02, { side: THREE.DoubleSide })); g.add(box(1.0, 1.3, 0.03, '#f4efe2', 0, 0.62, -0.01)); return g;
}
// The ransom note (cut-out letters), held by its bottom edge.
export function ransomNote() {
  const tex = canvasTexture(240, 300, (c) => {
    c.fillStyle = '#f6f1e3'; c.fillRect(0, 0, 240, 300); const r = rng(2), cols = ['#d2283c', '#152435', '#2f6fe0', '#1b7a3a', '#8a3fd1'];
    const line = (txt, y, sz) => { let x = 16; for (const ch of txt) { if (ch === ' ') { x += sz * 0.4; continue; } c.save(); c.translate(x, y); c.rotate((r() - 0.5) * 0.3); c.fillStyle = r() < 0.5 ? '#ffffff' : '#ffe9a8'; c.fillRect(-3, -sz, sz * 0.78, sz * 1.15); c.fillStyle = cols[Math.floor(r() * 5)]; c.font = `bold ${sz}px serif`; c.fillText(ch, 0, 0); c.restore(); x += sz * 0.8; } };
    line('$10,000', 70, 44); line('OR YOU', 140, 34); line('WONT SEE', 190, 30); line('HER AGAIN', 240, 30);
  });
  const g = new THREE.Group(); g.add(plane(1.1, 1.38, tex, 0, 0.69, 0, { side: THREE.DoubleSide })); return g;
}
// A sundae in a tall glass, held by the glass foot (origin at the base of the foot).
export function sundae(scale = 1) {
  const g = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: '#dff4ff', roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.55, clearcoat: 1 });
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 18), glass, 0, 0.04, 0), mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 10), glass, 0, 0.28, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.46, 0.22, 0.75, 20, 1, true), glass, 0, 0.84, 0));
  for (const [c, x, y, z] of [['#ff9cc1', -0.16, 1.28, 0.05], ['#6b3a1e', 0.17, 1.27, -0.04], ['#9df0c4', 0, 1.5, 0]]) g.add(mesh(new THREE.SphereGeometry(0.26, 16, 12), std(c, { roughness: 0.6 }), x, y, z));
  g.add(mesh(new THREE.ConeGeometry(0.22, 0.38, 14), std('#fffaf2', { roughness: 0.35 }), 0, 1.86, 0));          // whipped cream
  g.add(mesh(new THREE.SphereGeometry(0.1, 12, 8), std('#d00a2a', { roughness: 0.2, clearcoat: 1 }), 0.02, 2.1, 0));  // cherry
  const wafer = mesh(new THREE.BoxGeometry(0.08, 0.5, 0.2), std('#d9a352'), -0.32, 1.65, 0); wafer.rotation.z = 0.3; g.add(wafer);   // wafer
  const fudge = mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 20), std('#4a2610', { roughness: 0.3 }), 0, 1.36, 0); fudge.rotation.x = Math.PI / 2; g.add(fudge);
  const cols = ['#ff4d7a', '#5ab0ff', '#ffd23f', '#7dff6a'], r = rng(3);
  for (let i = 0; i < 14; i++) { const s = mesh(new THREE.BoxGeometry(0.07, 0.025, 0.025), std(cols[i % 4]), (r() - 0.5) * 0.5, 1.55 + r() * 0.35, (r() - 0.5) * 0.5); s.rotation.set(r() * 3, r() * 3, r() * 3); g.add(s); }
  g.scale.setScalar(scale); return g;
}
export function spoon() {
  const g = new THREE.Group(), m = std('#d9dde3', { metalness: 0.9, roughness: 0.2 });
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), m, 0, 0.25, 0));
  const bowl = mesh(new THREE.SphereGeometry(0.12, 12, 8), m, 0, 0.75, 0); bowl.scale.set(1, 1.4, 0.45); g.add(bowl); return g;
}
export function microphone() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 8), std('#2a2a30', { metalness: 0.6 }), 0, 2.1, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.12, 16), std('#2a2a30', { metalness: 0.6 }), 0, 0.06, 0));
  g.add(mesh(new THREE.SphereGeometry(0.18, 14, 10), std('#c9ced6', { metalness: 0.8, roughness: 0.3 }), 0, 4.35, 0.05));
  return g;
}

// ---------- sets ----------
// Beach bar: a thatched bamboo hut bar facing +Z (the counter top at y 3.4), stools, bottles, a sign.
export function beachBar() {
  const g = new THREE.Group(), bamboo = '#c9a35e', thatch = '#b98d4a';
  g.add(box(10, 3.3, 1.6, bamboo, 0, 1.65, 0, { roughness: 0.8 }));
  g.add(box(10.6, 0.25, 2.2, '#8a5a2a', 0, 3.4, 0, { roughness: 0.6 }));
  for (let i = 0; i < 12; i++) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), std('#a7843f', { roughness: 0.85 }), -4.6 + i * 0.84, 1.6, 0.82));
  for (const [x, z] of [[-4.8, -3.2], [4.8, -3.2], [-4.8, 0.6], [4.8, 0.6]]) g.add(mesh(new THREE.CylinderGeometry(0.18, 0.22, 8.5, 10), std('#8a6a3a'), x, 4.25, z));
  const roof = mesh(new THREE.ConeGeometry(8.6, 3.2, 4, 1), std(thatch, { roughness: 0.95 }), 0, 9.8, -1.3); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.7); g.add(roof);
  g.add(box(9, 0.2, 0.8, '#7a5a30', 0, 6.4, -3.0)); g.add(box(9, 0.2, 0.8, '#7a5a30', 0, 5.0, -3.0)); g.add(box(10, 6, 0.3, '#9a7b45', 0, 4.5, -3.4));
  const cols = ['#2a8f5a', '#d2283c', '#e8b931', '#5ab0ff', '#ff8a2a'];
  for (let i = 0; i < 14; i++) g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.7, 10), std(cols[i % 5], { roughness: 0.15, clearcoat: 1 }), -4 + i * 0.6, i % 2 ? 6.85 : 5.45, -2.9));
  for (const x of [-3, 0, 3]) { g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 16), std('#d2283c'), x, 2.4, 1.9)); g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 8), std('#c9ced6', { metalness: 0.8 }), x, 1.15, 1.9)); }
  const sign = plane(4.2, 1.1, canvasTexture(320, 84, (c) => { c.fillStyle = '#2a8f8f'; c.fillRect(0, 0, 320, 84); c.fillStyle = '#ffe08a'; c.font = 'bold 50px serif'; c.textAlign = 'center'; c.fillText('TIKI BAR', 160, 62); }), 0, 8.0, 0.9);
  g.add(sign); return g;
}
// The marina dock: planks, a strip of fake putting green with a hole and flag, bollards, two boats with VOTE GIGGLES.
export function dock() {
  const g = new THREE.Group();
  g.add(box(14, 0.5, 40, '#9a7650', 0, 0.75, 0, { roughness: 0.9 }));
  for (let z = -19; z < 20; z += 1.2) g.add(box(14, 0.05, 0.08, '#6e5236', 0, 1.02, z));
  g.add(box(3, 0.08, 14, '#3fae4a', -2, 1.06, 0, { roughness: 1 }));
  const hole = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16), std('#101010'), -2, 1.08, -5.5); g.add(hole);
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), std('#f4f2ee'), -2, 2.6, -5.5));
  const flag = mesh(new THREE.PlaneGeometry(0.9, 0.6), std('#d2283c', { side: THREE.DoubleSide }), -1.55, 3.8, -5.5); g.add(flag);
  for (const z of [-15, -5, 5, 15]) for (const x of [-6.6, 6.6]) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 10), std('#2a2a30'), x, 1.6, z));
  return g;
}
export function voteBanner(w = 8, h = 1.8, text = 'VOTE GIGGLES!') {
  const tex = canvasTexture(512, 116, (c) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, 512, 116); c.fillStyle = '#d2283c'; c.fillRect(0, 0, 512, 14); c.fillRect(0, 102, 512, 14); c.fillStyle = '#1e2a4a'; c.font = 'bold 66px sans-serif'; c.textAlign = 'center'; c.fillText(text, 256, 82); c.fillStyle = '#e8202c'; c.beginPath(); c.arc(40, 58, 22, 0, 7); c.fill(); c.beginPath(); c.arc(472, 58, 22, 0, 7); c.fill(); });
  return plane(w, h, tex, 0, 0, 0, { side: THREE.DoubleSide });
}
export function boat(col = '#f4f2ee') {
  const g = new THREE.Group();
  g.add(box(4.2, 1.6, 11, col, 0, 0.8, 0, { roughness: 0.4 })); g.add(box(3.6, 1.6, 3.4, '#2f6fe0', 0, 2.2, -1, { roughness: 0.3 }));
  const b = voteBanner(4, 0.9); b.position.set(2.15, 1.0, 0.5); b.rotation.y = Math.PI / 2; g.add(b); return g;
}
export function balloon(col) {
  const g = new THREE.Group(); const b = mesh(new THREE.SphereGeometry(0.55, 16, 12), std(col, { roughness: 0.25, clearcoat: 1 }), 0, 0, 0); b.scale.set(1, 1.2, 1); g.add(b);
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.2, 4), std('#f4f2ee'), 0, -1.75, 0)); return g;
}
// The campaign trailer's dressing room: a bulb-lit mirror and a dressing table (the room faces +Z).
export function dressingRoom() {
  const g = new THREE.Group();
  g.add(box(18, 0.3, 14, '#6a4e3a', 0, 0.15, 0)); g.add(box(18, 12, 0.4, '#d6b98c', 0, 6, -7)); g.add(box(0.4, 12, 14, '#c9ab7e', -9, 6, 0)); g.add(box(0.4, 12, 14, '#c9ab7e', 9, 6, 0));
  g.add(box(7, 0.3, 2.4, '#f4efe2', 0, 3.2, -5.6)); g.add(box(6.6, 3, 2.2, '#e5dcc8', 0, 1.6, -5.6));
  const mir = mesh(new THREE.PlaneGeometry(5.4, 4.0), new THREE.MeshPhysicalMaterial({ color: '#b9c9d6', metalness: 0.9, roughness: 0.05 }), 0, 6.2, -6.75); g.add(mir);
  g.add(box(6.0, 0.3, 0.3, '#f4efe2', 0, 8.35, -6.7)); g.add(box(6.0, 0.3, 0.3, '#f4efe2', 0, 4.05, -6.7)); g.add(box(0.3, 4.6, 0.3, '#f4efe2', -2.9, 6.2, -6.7)); g.add(box(0.3, 4.6, 0.3, '#f4efe2', 2.9, 6.2, -6.7));
  const bulb = std('#fff6d0', { emissive: '#ffe9a8', emissiveIntensity: 1.6 });
  for (let i = 0; i < 7; i++) g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), bulb, -2.7 + i * 0.9, 8.35, -6.5));
  for (let i = 0; i < 4; i++) for (const x of [-2.9, 2.9]) g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), bulb, x, 4.6 + i * 1.1, -6.5));
  const l = new THREE.PointLight('#ffe9b8', 30, 14, 2); l.position.set(0, 6.5, -4.5); g.add(l);
  const poster = voteBanner(5, 1.1); poster.position.set(-6, 8.5, -6.7); g.add(poster);
  return g;
}
// Big Scoop's Ice Cream: a pastel parlour (front +Z) with a giant cone on the roof, an open front so the camera can see in.
// Inside: a display counter of tubs along the back, a table with cash, the till out back (x +), a truck poster.
export function parlour() {
  const g = new THREE.Group(), pink = '#ffb6d0', mint = '#a8f0d4';
  g.add(box(24, 0.3, 18, '#f6eadf', 0, 0.15, 0));
  g.add(box(24, 11, 0.5, pink, 0, 5.5, -9)); g.add(box(0.5, 11, 18, pink, -12, 5.5, 0)); g.add(box(0.5, 11, 18, pink, 12, 5.5, 0)); g.add(box(24.4, 0.5, 18.4, '#ffd6e6', 0, 11.2, 0));
  for (let x = -11; x <= 11; x += 2) g.add(box(1.0, 0.04, 17.6, x % 4 ? '#ffffff' : '#ff8fb8', x, 0.33, 0));
  const front = box(24.4, 2.6, 0.5, mint, 0, 10.2, 9); g.add(front); g.userData.front = front;
  // giant cone on the roof
  const cone = mesh(new THREE.ConeGeometry(2.6, 7, 20), std('#d9a352', { roughness: 0.7 }), 0, 15.2, 2); cone.rotation.x = Math.PI; g.add(cone);
  for (const [c, x, y] of [['#ff9cc1', -1.2, 19.3], ['#9df0c4', 1.2, 19.3], ['#6b3a1e', 0, 21.2]]) g.add(mesh(new THREE.SphereGeometry(2.0, 20, 14), std(c, { roughness: 0.55 }), x, y, 2));
  const sign = plane(12, 2.4, canvasTexture(512, 104, (c) => { c.fillStyle = '#ff4d8d'; c.fillRect(0, 0, 512, 104); c.fillStyle = '#ffffff'; c.font = 'bold 70px sans-serif'; c.textAlign = 'center'; c.fillText("BIG SCOOP'S", 256, 76); }), 0, 10.2, 9.3);
  g.add(sign);
  // the counter with tubs (along the back, facing +Z), stools, a table with cash
  g.add(box(14, 3.2, 2.2, '#ffffff', -2, 1.6, -5.2)); g.add(box(14.4, 0.25, 2.6, mint, -2, 3.3, -5.2));
  const tubs = ['#ff9cc1', '#6b3a1e', '#9df0c4', '#fff3c4', '#ffd23f', '#b07cff'];
  for (let i = 0; i < 12; i++) g.add(mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.4, 14), std(tubs[i % 6], { roughness: 0.6 }), -8 + i * 1.1, 3.55, -5.2));
  g.add(box(4.2, 0.2, 3.0, '#ffffff', -6, 2.8, 2.5)); g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.7, 8), std('#c9ced6', { metalness: 0.8 }), -6, 1.35, 2.5));
  for (let i = 0; i < 6; i++) g.add(box(0.9, 0.18, 0.45, '#5fa86a', -7 + (i % 3) * 1.0, 3.0 + Math.floor(i / 3) * 0.2, 2.2 + (i % 2) * 0.5));   // cash stacks
  // out back: the till on a counter, the truck poster
  g.add(box(3.6, 3.2, 1.8, '#ffffff', 8.5, 1.6, -5.6)); g.add(box(4, 0.25, 2.2, mint, 8.5, 3.3, -5.6));
  const till = new THREE.Group(); till.add(box(1.4, 0.8, 1.2, '#4a4f5a', 0, 0.4, 0, { metalness: 0.4 })); till.add(box(1.2, 0.5, 0.2, '#2a2f38', 0, 1.05, -0.4)); till.add(box(1.0, 0.25, 0.4, '#e8b931', 0, 0.15, 0.55)); till.position.set(8.5, 3.45, -5.6); g.add(till);
  const poster = plane(4.4, 3.2, canvasTexture(330, 240, (c) => {
    c.fillStyle = '#fff6dc'; c.fillRect(0, 0, 330, 240); c.fillStyle = '#d2283c'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('ICE CREAM TRUCK', 165, 44);
    c.fillStyle = '#7fd0ff'; c.fillRect(60, 80, 200, 90); c.fillStyle = '#ffffff'; c.fillRect(70, 92, 80, 40); c.fillStyle = '#ff8fb8'; c.fillRect(60, 150, 200, 20); c.fillStyle = '#222'; c.beginPath(); c.arc(100, 178, 16, 0, 7); c.fill(); c.beginPath(); c.arc(220, 178, 16, 0, 7); c.fill();
    c.fillStyle = '#d9a352'; c.beginPath(); c.moveTo(240, 80); c.lineTo(256, 40); c.lineTo(272, 80); c.fill(); c.fillStyle = '#ff9cc1'; c.beginPath(); c.arc(256, 38, 14, 0, 7); c.fill();
    c.fillStyle = '#1b7a3a'; c.font = 'bold 40px sans-serif'; c.fillText('$10,000', 165, 228);
  }), 8.5, 7.2, -8.7);
  g.add(poster);
  return g;
}
// The rally: a stage (top at y 3) with a podium, banners and a backdrop, facing +Z.
export function stage() {
  const g = new THREE.Group();
  g.add(box(22, 3, 10, '#1e2a4a', 0, 1.5, 0)); g.add(box(22.4, 0.2, 10.4, '#d2283c', 0, 3.05, 0));
  g.add(box(24, 14, 0.5, '#2a3a6a', 0, 10, -5)); const b = voteBanner(18, 3.4); b.position.set(0, 13.5, -4.7); g.add(b);
  for (const x of [-8, 8]) { const s = voteBanner(5, 1.2, 'GIGGLES 4 MAYOR'); s.position.set(x, 8, -4.7); g.add(s); }
  for (let i = 0; i < 18; i++) { const st = mesh(new THREE.ConeGeometry(0.25, 0.5, 5), std(i % 2 ? '#ffd23f' : '#f4f2ee'), -10 + i * 1.2, 4.8 + (i % 3) * 0.3, -4.6); st.rotation.x = Math.PI / 2; g.add(st); }
  return g;
}
// The WINNER banner that drops from the top of the backdrop.
export function winnerBanner() {
  return plane(12, 3, canvasTexture(512, 128, (c) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#d2283c'; c.font = 'bold 92px sans-serif'; c.textAlign = 'center'; c.fillText('WINNER!', 256, 98); }), 0, 0, 0, { side: THREE.DoubleSide });
}
// A simple crowd member (block figure in a clown nose) for the rally; faces +Z unless turned.
export function fan(seed) {
  const r = rng(seed), g = new THREE.Group(), shirt = ['#d2283c', '#2f6fe0', '#ffd23f', '#3fae4a', '#ff8fb8', '#ffffff'][Math.floor(r() * 6)];
  const skin = ['#f2c79e', '#c98b5e', '#8a5a3a', '#f5d5b0'][Math.floor(r() * 4)];
  g.add(box(2, 2, 1, shirt, 0, 3, 0)); g.add(box(1.2, 1.2, 1.2, skin, 0, 4.6, 0)); g.add(box(0.95, 2, 0.95, '#3a3f55', -0.5, 1, 0)); g.add(box(0.95, 2, 0.95, '#3a3f55', 0.5, 1, 0));
  g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), std('#e8202c', { clearcoat: 1 }), 0, 4.6, 0.62));
  const wig = ['#ff7a1a', '#2f6fe0', '#3fae4a', '#ff4d8d'][Math.floor(r() * 4)];
  if (r() < 0.6) for (let i = 0; i < 6; i++) g.add(mesh(new THREE.SphereGeometry(0.32, 8, 6), std(wig, { roughness: 0.9 }), (i - 2.5) * 0.25, 5.3 + 0.1 * Math.sin(i * 2), -0.1));
  const arm = box(0.95, 2, 0.95, skin, 1.45, 3.4, 0); arm.rotation.z = 2.6; g.userData.arm = arm; g.add(arm); g.add(box(0.95, 2, 0.95, skin, -1.45, 3, 0));
  return g;
}
export function palm(h = 16, seed = 0) {
  const g = new THREE.Group(), r = rng(seed + 7);
  for (let i = 0; i < 8; i++) { const s = mesh(new THREE.CylinderGeometry(0.42 - i * 0.02, 0.48 - i * 0.02, h / 8, 8), std('#8a6a43', { roughness: 0.9 }), Math.sin(i * 0.3) * 0.3, (i + 0.5) * h / 8, 0); g.add(s); }
  for (let i = 0; i < 7; i++) { const l = mesh(new THREE.BoxGeometry(0.5, 0.12, 6), std('#2f8a3a', { roughness: 0.7 }), 0, h, 0); l.geometry.translate(0, 0, 3); l.rotation.set(0.35 + r() * 0.2, (i / 7) * Math.PI * 2, 0); g.add(l); }
  return g;
}
