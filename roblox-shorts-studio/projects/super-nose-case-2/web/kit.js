// The Vampire Case: sets, props and cast extras, all built in code (no pack accessories, so the fit check has nothing
// to fit; Case 1's nose, sunglasses, convertible and handcuffs come from its kit). Coordinates: studs, +Y up, +Z forward.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { part, canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
export const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
const box = (w, h, d, col, x, y, z, o = {}) => mesh(new THREE.BoxGeometry(w, h, d), std(col, o), x, y, z);

// Swap the body atlas for one of this project's outfits (source/make_outfits.py; head swatch painted too).
export async function wearOutfitHere(actor, file) {
  const tex = await new THREE.TextureLoader().loadAsync(new URL(`./outfits/${file}`, import.meta.url).href);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  actor.root.traverse((o) => {
    if (!o.isMesh || o.name === 'Face' || o.name === 'Hair') return;
    if (o.material.map) { o.material = o.material.clone(); o.material.map = tex; }
  });
}
// Tint a character's hair (multiplies the hair texture).
export function tintHair(actor, color) {
  actor.root.traverse((o) => { if (o.isMesh && o.name === 'Hair') { o.material = o.material.clone(); o.material.color.set(color); } });
}
// The head's own material (for a green "garlic sick" glow).
export const headMat = (actor) => actor.bones.Head.children.find((o) => o.name === 'Head')?.material;

// ---------- vampires ----------
// Two fangs under the top lip (head-local: neck pivot at y 4, face at z 0.6, mouth around y 0.2-0.3). Hidden by default.
export function makeFangs(actor) {
  const g = new THREE.Group(); g.name = 'Fangs'; const m = std('#ffffff', { roughness: 0.25, emissive: '#ffffff', emissiveIntensity: 0.15 });
  for (const sx of [-1, 1]) { const f = mesh(new THREE.ConeGeometry(0.045, 0.17, 10), m, sx * 0.13, 0.2, 0.615); f.rotation.x = Math.PI; f.castShadow = false; g.add(f); }
  g.visible = false; actor.bones.Head.add(g); return g;
}
// Vlad's cape: black outside, red lining, a tall stiff collar behind the head. On the Torso bone (moves with the body).
export function makeCape(actor) {
  const g = new THREE.Group(); g.name = 'Cape';
  const out = std('#0c0b10', { roughness: 0.7, side: THREE.DoubleSide }), lin = std('#8e1424', { roughness: 0.5, side: THREE.DoubleSide });
  const back = mesh(new THREE.BoxGeometry(2.5, 3.9, 0.08), out, 0, -0.05, -0.58); g.add(back);
  const lining = mesh(new THREE.BoxGeometry(2.4, 3.8, 0.04), lin, 0, -0.05, -0.53); g.add(lining);
  for (const sx of [-1, 1]) {
    const c = mesh(new THREE.BoxGeometry(1.1, 1.3, 0.07), out, sx * 0.62, 2.45, -0.5); c.rotation.set(-0.25, sx * 0.55, sx * 0.18); g.add(c);
    const cl = mesh(new THREE.BoxGeometry(1.0, 1.2, 0.04), lin, sx * 0.6, 2.42, -0.45); cl.rotation.copy(c.rotation); g.add(cl);
    const side = mesh(new THREE.BoxGeometry(0.08, 3.7, 0.9), out, sx * 1.24, -0.1, -0.15); g.add(side);
  }
  actor.bones.Torso.add(g); return g;
}
// Spinning "knocked out" stars over a head.
export function koStars(n = 5) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.12 : 0.3, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }); geo.center();
  const g = new THREE.Group(), m = std('#ffd23f', { emissive: '#ffb800', emissiveIntensity: 0.9, roughness: 0.3 });
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(geo, m); s.castShadow = false; g.add(s); }
  return g;
}
export function spinStars(g, center, t, r = 1.1) {
  g.children.forEach((s, i) => { const a = t * 3 + (i / g.children.length) * Math.PI * 2; s.position.set(center.x + Math.cos(a) * r, center.y + 0.15 * Math.sin(a * 2), center.z + Math.sin(a) * r * 0.6); s.rotation.set(0.3, t * 4 + i, 0); });
}

// ---------- the gardener ----------
export function strawHat(actor) {
  const g = new THREE.Group(); g.name = 'StrawHat';
  const tex = canvasTexture(128, 128, (c) => { c.fillStyle = '#e7c66f'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#c9a24a'; c.lineWidth = 3; for (let i = 0; i < 128; i += 9) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 30, 128); c.stroke(); } });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  g.add(mesh(new THREE.CylinderGeometry(1.55, 1.6, 0.08, 32), m, 0, 1.22, 0));            // brim (clear of the face: head top is y 1.2)
  g.add(mesh(new THREE.CylinderGeometry(0.66, 0.72, 0.62, 24), m, 0, 1.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.735, 0.735, 0.14, 24), std('#7a3b2a'), 0, 1.32, 0));
  actor.bones.Head.add(g); return g;
}
// Hedge clippers (handles toward -Y, blades +Y), held at a hand.
export function clippers() {
  const g = new THREE.Group(), steel = std('#c9ced6', { metalness: 0.9, roughness: 0.25 }), red = std('#c8283c');
  for (const sx of [-1, 1]) {
    const h = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8), red, sx * 0.1, -0.4, 0); h.rotation.z = sx * 0.12; g.add(h);
    const b = mesh(new THREE.BoxGeometry(0.08, 1.5, 0.22), steel, sx * 0.05, 0.85, 0); b.rotation.z = -sx * 0.08; g.add(b);
  }
  g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), steel, 0, 0.1, 0));
  return g;
}
export function tomato(scale = 1, sad = false) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.22, 14, 10), std(sad ? '#9a8f5e' : '#e23b2a', { roughness: sad ? 0.85 : 0.35 })));
  g.children[0].scale.set(1, 0.85, 1);
  g.add(mesh(new THREE.ConeGeometry(0.1, 0.08, 6), std('#4b6b34'), 0, 0.2, 0));
  g.scale.setScalar(scale); return g;
}
// A droopy tomato plant: a cane, sagging grey-green leaves, a few small grey tomatoes.
export function tomatoPlant(seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(box(0.12, 3.4, 0.12, '#8a6a42', 0, 1.7, 0));
  for (let i = 0; i < 6; i++) {
    const leaf = box(0.9, 0.06, 0.32, '#6f7f5a', 0, 1 + i * 0.4, 0, { roughness: 0.9 }); leaf.rotation.set(0, i * 2.1, -0.75 - 0.3 * r()); leaf.position.x = 0.35 * Math.cos(i * 2.1); leaf.position.z = -0.35 * Math.sin(i * 2.1); g.add(leaf);
  }
  for (let i = 0; i < 3; i++) { const t = tomato(0.7, true); t.position.set(0.3 * Math.cos(i * 2.4), 0.7 + i * 0.5, 0.3 * Math.sin(i * 2.4)); g.add(t); }
  return g;
}
export function roseBush(seed = 1) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.IcosahedronGeometry(1.0 + 0.3 * r(), 1), std('#2f4a2a', { roughness: 0.9, flatShading: true }), (r() - 0.5) * 1.2, 1.0 + r() * 0.5, (r() - 0.5) * 1.2); g.add(b); }
  for (let i = 0; i < 7; i++) { const a = r() * Math.PI * 2, rr = 1.0 + r() * 0.4; g.add(mesh(new THREE.IcosahedronGeometry(0.22, 1), std('#a3202f', { roughness: 0.6 }), Math.cos(a) * rr, 1.1 + r() * 1.0, Math.sin(a) * rr)); }
  return g;
}
export function garlicBulb(scale = 1) {
  const g = new THREE.Group(), m = std('#f3eee2', { roughness: 0.6 });
  const b = mesh(new THREE.SphereGeometry(0.32, 16, 12), m); b.scale.set(1, 0.85, 1); g.add(b);
  for (let i = 0; i < 6; i++) { const c = mesh(new THREE.SphereGeometry(0.16, 10, 8), m, 0.2 * Math.cos(i), 0, 0.2 * Math.sin(i)); c.scale.set(0.8, 1.2, 0.8); g.add(c); }
  g.add(mesh(new THREE.ConeGeometry(0.1, 0.3, 8), m, 0, 0.36, 0));
  g.scale.setScalar(scale); return g;
}
// The secret garlic patch: rows of green shoots and bulbs poking out of dark soil; one freshly dug hole.
export function garlicPatch(seed = 3) {
  const g = new THREE.Group(), r = rng(seed);
  g.add(box(4.2, 0.25, 7, '#4a3423', 0, 0.12, 0, { roughness: 1 }));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) {
    if (i === 1 && j === 2) continue;                              // the dug-up one
    const x = -1.3 + i * 1.3, z = -2.8 + j * 1.1, b = garlicBulb(0.8); b.position.set(x, 0.3, z); g.add(b);
    for (let k = 0; k < 3; k++) { const s = box(0.08, 1.1, 0.08, '#5a9a3a', x + (k - 1) * 0.08, 0.95, z, { roughness: 0.8 }); s.rotation.z = (k - 1) * 0.25 + (r() - 0.5) * 0.2; g.add(s); }
  }
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.1, 14), std('#2a1c12', { roughness: 1 }), 0, 0.26, -0.6));
  const heap = mesh(new THREE.SphereGeometry(0.5, 12, 8), std('#4a3423', { roughness: 1 }), 0.7, 0.25, -0.4); heap.scale.set(1, 0.4, 1); g.add(heap);
  return g;
}
export function hedge(w, h = 3, d = 1.8, col = '#2d4a2c') { const p = part(w, h, d, col, { rough: 0.95, clearcoat: 0 }); p.position.y = h; return p; }

// ---------- food ----------
// A slice of garlic bread (golden toast, butter, green parsley flecks, white garlic bits). Long side along X.
export function garlicBread(scale = 1) {
  const g = new THREE.Group();
  const tex = canvasTexture(128, 64, (c) => {
    c.fillStyle = '#f2c35c'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#ffe28a'; c.fillRect(8, 8, 112, 48);
    const r = rng(9); for (let i = 0; i < 40; i++) { c.fillStyle = i % 3 ? '#3f8a2e' : '#ffffff'; c.fillRect(8 + r() * 108, 8 + r() * 44, 3 + r() * 3, 3 + r() * 3); }
  });
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), crust = std('#b8742a', { roughness: 0.7 });
  const slice = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.35, 0.9, 2, 0.12), [crust, crust, top, crust, crust, crust]); slice.castShadow = slice.receiveShadow = true; g.add(slice);
  const butter = mesh(new RoundedBoxGeometry(0.4, 0.12, 0.3, 2, 0.05), std('#fff1a8', { roughness: 0.25, emissive: '#5a4a00', emissiveIntensity: 0.2 }), 0.25, 0.22, 0.05); g.add(butter);
  const clove = mesh(new THREE.SphereGeometry(0.12, 12, 8), std('#fbf6e8', { roughness: 0.45 }), -0.15, 0.21, -0.2); clove.scale.set(0.8, 0.7, 1.3); g.add(clove);
  const crumb = mesh(new THREE.IcosahedronGeometry(0.09, 0), std('#3a2616', { roughness: 1, flatShading: true }), -0.6, 0.2, 0.18); g.add(crumb);
  g.userData = { butter, clove, crumb }; g.scale.setScalar(scale); return g;
}
export function burger(scale = 1) {
  const g = new THREE.Group();
  const bun = std('#d9913f', { roughness: 0.5 });
  const b1 = mesh(new THREE.SphereGeometry(0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), bun, 0, 0.42, 0); g.add(b1);
  g.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 20), std('#5bb53a'), 0, 0.4, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.07, 20), std('#ffcc2a'), 0, 0.34, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.2, 20), std('#5a3220', { roughness: 0.8 }), 0, 0.22, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.52, 0.2, 20), bun, 0, 0.05, 0));
  g.scale.setScalar(scale); return g;
}
export function poolRing(color = '#ff7bc5') {
  const tex = canvasTexture(256, 32, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : color; c.fillRect(i * 32, 0, 32, 32); } });
  const m = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.42, 14, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }));
  m.rotation.x = Math.PI / 2; m.castShadow = true; const g = new THREE.Group(); g.add(m); return g;
}
export function umbrella(col = '#121016') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), std('#2a2a2a'), 0, 1.6, 0));
  const top = mesh(new THREE.ConeGeometry(2.0, 0.9, 10, 1, true), std(col, { roughness: 0.6, side: THREE.DoubleSide }), 0, 3.2, 0); g.add(top);
  return g;
}

// Clear evidence bag with a label (an item goes inside).
export function evidenceBag(item, label = 'GARLIC BREAD') {
  const g = new THREE.Group();
  const bag = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.6, 0.5, 2, 0.12), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }));
  bag.renderOrder = 2; g.add(bag);
  const lab = mesh(new THREE.PlaneGeometry(1.8, 0.42), new THREE.MeshStandardMaterial({ map: canvasTexture(256, 60, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 60); c.fillStyle = '#d02030'; c.fillRect(0, 0, 256, 18); c.font = 'bold 15px sans-serif'; c.fillStyle = '#ffffff'; c.fillText('EVIDENCE', 92, 14); c.fillStyle = '#152435'; c.font = 'bold 22px sans-serif'; c.fillText(label, 30, 46); }) }), 0, 0.5, 0.26);
  g.add(lab);
  if (item) { item.position.set(0, -0.2, 0); item.rotation.set(Math.PI / 2, 0, 0); g.add(item); }
  return g;
}

// ---------- sets ----------
// The haunted mansion: a slate-purple gothic house (front +Z, door at the origin of its front face), two towers with
// pointed roofs, arched glowing windows, steps, and a front door on a hinge (userData.door: rotate .rotation.y).
export function mansion() {
  const g = new THREE.Group(), wall = '#4b4260', trim = '#2a2436', roofC = '#221d2c';
  const W = 30, H = 20, D = 18;
  const body = part(W, H, D, wall, { center: true, rough: 0.85, clearcoat: 0 }); body.position.set(0, H / 2, -D / 2); g.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.62, 9, 4), std(roofC, { roughness: 0.8 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, D / W); roof.position.set(0, H + 4.5, -D / 2); roof.castShadow = true; g.add(roof);
  for (const sx of [-1, 1]) {
    const tw = part(7, H + 8, 7, '#3f3752', { center: true, rough: 0.85, clearcoat: 0 }); tw.position.set(sx * (W / 2 - 1), (H + 8) / 2, -2.5); g.add(tw);
    const tr = new THREE.Mesh(new THREE.ConeGeometry(5.2, 9, 8), std(roofC)); tr.position.set(sx * (W / 2 - 1), H + 8 + 4.5, -2.5); tr.castShadow = true; g.add(tr);
  }
  const glow = std('#ffb35a', { emissive: '#ff9a3a', emissiveIntensity: 0.75, roughness: 0.3 });
  const arch = (x, y, w = 2.6, h = 4.2) => {
    const fr = mesh(new THREE.BoxGeometry(w + 0.5, h + 0.5, 0.3), std(trim), x, y, 0.08); g.add(fr);
    const gl = mesh(new THREE.BoxGeometry(w, h, 0.3), glow, x, y, 0.16); g.add(gl);
    const top = mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.3, 16, 1, false, 0, Math.PI), glow, x, y + h / 2, 0.16); top.rotation.set(Math.PI / 2, 0, Math.PI / 2); g.add(top);
    g.add(mesh(new THREE.BoxGeometry(0.12, h, 0.35), std(trim), x, y, 0.2));
  };
  for (const x of [-9, -5, 5, 9]) { arch(x, 5, 2.4, 3.8); arch(x, 13, 2.4, 3.8); }
  arch(0, 13, 3, 4.4);
  // Door frame, hinged door (pivot on its left edge), steps, lanterns.
  g.add(mesh(new THREE.BoxGeometry(6, 8.6, 0.4), std(trim), 0, 4.3, 0.15));
  g.add(mesh(new THREE.BoxGeometry(4.4, 7.4, 0.3), std('#0d0a12', { roughness: 0.9 }), 0, 3.7, 0.12));      // dark doorway
  const door = new THREE.Group(); door.position.set(-2.2, 0, 0.42);
  const dp = mesh(new THREE.BoxGeometry(4.4, 7.4, 0.3), std('#5a2230', { roughness: 0.6 }), 2.2, 3.7, 0); door.add(dp);
  door.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), std('#d9b44a', { metalness: 0.8, roughness: 0.3 }), 3.9, 3.6, 0.2));
  for (const y of [2, 5.4]) door.add(mesh(new THREE.BoxGeometry(3.6, 0.15, 0.1), std('#3a1620'), 2.2, y, 0.17));
  g.add(door);
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(9 - i * 1.4, 0.4, 2.4 - i * 0.6), std('#6a6276', { roughness: 0.9 }), 0, 0.2 + i * 0.4, 1.4 - i * 0.3));
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), std('#141018'), sx * 3.8, 6.6, 0.6));
    g.add(mesh(new THREE.BoxGeometry(0.36, 0.7, 0.36), std('#ffcf7a', { emissive: '#ffb84a', emissiveIntensity: 1.5 }), sx * 3.8, 6.6, 0.6));
  }
  g.userData.door = door;
  return g;
}
// A small black bat; flap(t) beats the wings.
export function bat() {
  const g = new THREE.Group(), m = std('#151219', { roughness: 0.6, side: THREE.DoubleSide });
  g.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), m));
  const wings = [];
  for (const sx of [-1, 1]) {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(sx * 1.1, 0.35); shape.lineTo(sx * 0.95, -0.05); shape.lineTo(sx * 0.7, 0.05); shape.lineTo(sx * 0.5, -0.15); shape.lineTo(sx * 0.25, 0); shape.lineTo(0, -0.1);
    const w = new THREE.Mesh(new THREE.ShapeGeometry(shape), m); w.rotation.x = -Math.PI / 2; const piv = new THREE.Group(); piv.add(w); g.add(piv); wings.push([piv, sx]);
  }
  for (const sx of [-1, 1]) g.add(mesh(new THREE.ConeGeometry(0.08, 0.2, 4), m, sx * 0.13, 0.3, 0));
  g.userData.flap = (t) => wings.forEach(([p, sx]) => { p.rotation.z = sx * 0.7 * Math.sin(t * 16); });
  return g;
}
export function candle(h = 1.2) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, h, 12), std('#efe7d2', { roughness: 0.6 }), 0, h / 2, 0));
  const fl = mesh(new THREE.ConeGeometry(0.09, 0.3, 10), std('#ffd27a', { emissive: '#ffb02a', emissiveIntensity: 3 }), 0, h + 0.15, 0); fl.castShadow = false; g.add(fl);
  g.userData.flame = fl; return g;
}
export function candelabra(light = true) {
  const g = new THREE.Group(), iron = std('#2a2430', { metalness: 0.6, roughness: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.5, 5, 10), iron, 0, 2.5, 0));
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.15, 0.15), iron, 0, 5, 0));
  const flames = [];
  for (const x of [-1.1, 0, 1.1]) { const c = candle(0.9); c.position.set(x, 5.05, 0); g.add(c); flames.push(c.userData.flame); }
  if (light) { const l = new THREE.PointLight('#ffb35a', 40, 22, 2); l.position.set(0, 6.3, 0); g.add(l); g.userData.light = l; }
  g.userData.flames = flames; return g;
}
// The open coffin (long side along X): dark wood box, red satin lining, the lid propped behind it.
export function coffin() {
  const g = new THREE.Group(), wood = std('#3a1f17', { roughness: 0.45, metalness: 0.1 }), satin = std('#9a1426', { roughness: 0.35 });
  const L = 7.4, Wd = 3.0, H = 2.2, t = 0.25;
  g.add(mesh(new THREE.BoxGeometry(L, 0.4, Wd), wood, 0, 0.2, 0));
  g.add(mesh(new THREE.BoxGeometry(L - 0.4, 0.1, Wd - 0.4), satin, 0, 0.45, 0));
  for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(L, H, t), wood, 0, H / 2, sz * (Wd / 2 - t / 2)));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(t, H, Wd), wood, sx * (L / 2 - t / 2), H / 2, 0));
  for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(L - 0.5, H - 0.5, 0.06), satin, 0, H / 2 + 0.1, sz * (Wd / 2 - t - 0.03)));
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), satin, -L / 2 + 1.1, 0.75, 0));        // pillow
  const lid = mesh(new THREE.BoxGeometry(L, 0.3, Wd), wood, 0, 2.1, -Wd / 2 - 0.9); lid.rotation.x = 1.15; g.add(lid);
  g.add(mesh(new THREE.BoxGeometry(0.3, 1.4, 0.1), std('#c9a23a', { metalness: 0.8, roughness: 0.3 }), 0.2, 2.1, -Wd / 2 - 1.05));
  // Stand.
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.5, 1.4, Wd - 0.6), std('#1d1418'), sx * 2.6, -0.7, 0));
  g.position.y = 1.4; return g;
}
// Blocky palm tree (same as Case 1's).
export function palm(h = 16, seed = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) { const s = part(1.3 - i * 0.07, h / 7 + 0.1, 1.3 - i * 0.07, i % 2 ? '#8a5a32' : '#7a4e2a', { center: true }); s.position.set(Math.sin(i * 0.4 + seed) * 0.25 * i, (i + 0.5) * h / 7, 0); g.add(s); }
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + seed, leaf = part(1.4, 0.25, 6.5, i % 2 ? '#3f9a4a' : '#2f8a3e', { center: true }); leaf.position.set(Math.cos(a) * 2.8, h + 0.3 - 0.6, Math.sin(a) * 2.8); leaf.rotation.set(0.4, -a + Math.PI / 2, 0); g.add(leaf); }
  return g;
}
export { V, box };
