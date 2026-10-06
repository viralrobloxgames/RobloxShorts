// Max's bedroom (kit-sets-a). World offset (0, 0, 0), floor y 0, studs. Chapters 1, 6, 8, 10.
// Local layout (the room is x -11..11, z -9..9, ceiling y 11; the camera side is +z, its wall hidden by default):
//   back wall (z -9):   the window (centre x -4, sill y 4.6), moon outside; the bed under it, headboard to the wall.
//   left wall (x -11):  the louvred closet (double doors, opening x -11, z -0.5..4.5), a walk-in recess to x -16.4
//                       with a rail of hoodies along z; a gap between the hoodies at z 2 where Skye stands.
//   right wall (x 11):  the desk with the mirror (z -5), the door to the hallway (z 3.5, hinged at z 1.5, opens inward).
//   bedside table + lamp right of the bed (x 0.6, z -7.8). Rug, posters, shelf, beanbag, laundry for detail.
// Heading convention: forward = (sin h, 0, cos h). Marks and cams are in world coordinates.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../../../web/lib/world.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const OFFSET = V(0, 0, 0);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
export function box(w, h, d, m, x = 0, y = 0, z = 0, cast = true) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; return b;
}
export function cyl(rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c;
}
export function sph(r, m, x = 0, y = 0, z = 0) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10), m); s.position.set(x, y, z); s.castShadow = true; return s; }
export function plane(w, h, m, x = 0, y = 0, z = 0) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.receiveShadow = true; return p; }
export const texMat = (pw, ph, draw, o = {}) => std('#ffffff', { map: canvasTexture(pw, ph, draw), ...o });
export const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

// plank floor and painted walls (repeat-wrapped canvas textures)
export function floorMat(base = '#a8754a', seed = 3, rep = [4, 4]) {
  const t = canvasTexture(512, 512, (c, W) => {
    const r = rng(seed); c.fillStyle = base; c.fillRect(0, 0, W, W);
    for (let i = 0; i < 8; i++) { c.fillStyle = `hsl(28,${38 + r() * 12}%,${34 + r() * 10}%)`; c.fillRect(0, i * 64 + 1, W, 62); c.fillStyle = 'rgba(40,20,8,0.55)'; c.fillRect(0, i * 64, W, 2); c.fillRect(((i * 197) % 400) + 40, i * 64, 2, 64); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return std('#ffffff', { map: t, roughness: 0.8 });
}
export function wallMat(base, stripe, seed = 1, rep = [3, 1]) {
  const t = canvasTexture(256, 256, (c, W) => { c.fillStyle = base; c.fillRect(0, 0, W, W); if (stripe) { c.fillStyle = stripe; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 12, W); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return std('#ffffff', { map: t, roughness: 0.9 });
}

// a panelled door, pivot at the hinge edge; the leaf extends along local +x (width w). rotation.y opens it.
export function door(w, h, color, { knobSide = 1, sign = null } = {}) {
  const pivot = new THREE.Group(), m = std(color, { roughness: 0.6 }), trim = std(new THREE.Color(color).multiplyScalar(0.85), { roughness: 0.6 });
  pivot.add(box(w, h, 0.25, m, w / 2, h / 2, 0));
  for (const y of [h * 0.28, h * 0.7]) for (const s of [-1, 1]) pivot.add(box(w * 0.7, h * 0.3, 0.06, trim, w / 2, y, s * 0.15));
  const kx = knobSide > 0 ? w - 0.45 : 0.45;
  for (const s of [-1, 1]) pivot.add(sph(0.16, std('#d9b34a', { metalness: 0.7, roughness: 0.3 }), kx, h * 0.48, s * 0.28));
  if (sign) { const p = plane(sign.w, sign.h, texMat(256, Math.round(256 * sign.h / sign.w), sign.draw), w / 2, h * 0.78, 0.2); pivot.add(p); pivot.userData.sign = p; }
  return pivot;
}
// a frame around a doorway in a wall plane facing +z (local), centred at x, width w, height h
export function doorFrame(w, h, m) { const g = new THREE.Group(); g.add(box(0.35, h + 0.35, 0.6, m, -w / 2 - 0.17, (h + 0.35) / 2, 0), box(0.35, h + 0.35, 0.6, m, w / 2 + 0.17, (h + 0.35) / 2, 0), box(w + 0.7, 0.35, 0.6, m, 0, h + 0.17, 0)); return g; }

// a hoodie on a hanger: shoulders along local x (width 2.3), front facing +z; origin at the hanger hook
export function hoodie(color) {
  const g = new THREE.Group(), m = std(color, { roughness: 0.95 }), dark = std(new THREE.Color(color).multiplyScalar(0.7), { roughness: 0.95 });
  g.add(box(0.06, 0.4, 0.06, std('#c8c8c8', { metalness: 0.6 }), 0, -0.2, 0, false));
  g.add(box(2.2, 2.7, 0.55, m, 0, -1.85, 0), box(0.55, 2.5, 0.5, m, -1.3, -1.95, 0.02), box(0.55, 2.5, 0.5, m, 1.3, -1.95, 0.02));
  g.add(box(1.1, 0.75, 0.5, dark, 0, -0.6, -0.12)); // hood folded at the back
  g.add(box(1.2, 0.6, 0.06, dark, 0, -2.6, 0.3)); // pocket
  for (const s of [-1, 1]) g.add(box(0.05, 0.7, 0.05, std('#f2f2f2'), s * 0.22, -1.0, 0.3, false)); // drawstrings
  return g;
}
// a louvred closet door leaf (pivot at hinge, along local +x)
function louvreDoor(w, h, m) {
  const pivot = new THREE.Group();
  pivot.add(box(0.25, h, 0.22, m, 0.12, h / 2, 0), box(0.25, h, 0.22, m, w - 0.12, h / 2, 0), box(w, 0.35, 0.22, m, w / 2, h - 0.17, 0), box(w, 0.35, 0.22, m, w / 2, 0.17, 0), box(w, 0.3, 0.22, m, w / 2, h * 0.5, 0));
  for (let y = 0.55; y < h - 0.4; y += 0.36) { if (Math.abs(y - h * 0.5) < 0.3) continue; const s = box(w - 0.4, 0.06, 0.3, m, w / 2, y, 0, true); s.rotation.x = -0.6; pivot.add(s); }
  for (const s of [-1, 1]) pivot.add(sph(0.12, std('#d9b34a', { metalness: 0.7, roughness: 0.3 }), w - 0.4, h * 0.48, s * 0.2));
  return pivot;
}
function poster(w, h, draw) { return plane(w, h, texMat(256, Math.round(256 * h / w), draw, { roughness: 0.6 })); }

// root position for a sitting mark at a given actor scale (hip height 2.0 x scale above the root)
export function sitPos(mark, scale = 1) { const p = mark.pos.clone(); if (mark.seat !== undefined) p.y = mark.seat - 2.0 * scale; return p; }

export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_bedroom'; group.position.copy(OFFSET); scene.add(group);
  const W = (x, y, z) => V(x, y, z).add(OFFSET);
  const wallM = wallMat('#7fa8c9', '#79a0c0', 1, [4, 1]), trimM = std('#f3efe6', { roughness: 0.6 }), woodM = std('#9c6b43', { roughness: 0.7 }), darkWood = std('#6b4428', { roughness: 0.7 });
  const H = 11;

  // ---- shell ----
  group.add(box(22, 0.4, 18, floorMat('#a8754a', 3, [4, 3]), 0, -0.2, 0, false));
  const walls = {};
  const mk = (name, ...parts) => { const g = new THREE.Group(); g.name = 'wall_' + name; parts.forEach((p) => { p.castShadow = false; g.add(p); }); group.add(g); walls[name] = g; return g; };
  // back wall with the window hole (x -6.5..-1.5, y 4.6..8.6)
  mk('back',
    box(4.5, H, 0.4, wallM, -8.75, H / 2, -9.2), box(12.5, H, 0.4, wallM, 4.75, H / 2, -9.2),
    box(5, 4.6, 0.4, wallM, -4, 2.3, -9.2), box(5, H - 8.6, 0.4, wallM, -4, (H + 8.6) / 2, -9.2),
    box(22, 0.6, 0.15, trimM, 0, 0.3, -8.95));
  // left wall with the closet opening (z -0.5..4.5, up to y 8)
  mk('left',
    box(0.4, H, 8, wallM, -11.2, H / 2, -5), box(0.4, H, 4, wallM, -11.2, H / 2, 7), box(0.4, H - 8, 6, wallM, -11.2, (H + 8) / 2, 2),
    box(0.15, 0.6, 8, trimM, -10.95, 0.3, -5), box(0.15, 0.6, 4, trimM, -10.95, 0.3, 7));
  // right wall with the door opening (z 1.5..5.5, up to y 7.6)
  mk('right',
    box(0.4, H, 10.5, wallM, 11.2, H / 2, -3.75), box(0.4, H, 3.5, wallM, 11.2, H / 2, 7.25), box(0.4, H - 7.6, 4, wallM, 11.2, (H + 7.6) / 2, 3.5),
    box(0.15, 0.6, 10.5, trimM, 10.95, 0.3, -3.75), box(0.15, 0.6, 3.5, trimM, 10.95, 0.3, 7.25));
  mk('front', box(22.8, H, 0.4, wallM, 0, H / 2, 9.2));
  mk('ceiling', box(22.8, 0.4, 18.8, std('#eef0f2', { roughness: 0.95 }), 0, H + 0.2, 0));
  walls.front.visible = false;
  group.userData.walls = walls;

  // ---- window, moon, curtains, garlic ----
  const win = new THREE.Group(); win.position.set(-4, 6.6, -9.2); group.add(win);
  win.add(box(5.4, 0.3, 0.7, trimM, 0, -2.15, 0.15), box(5.4, 0.3, 0.5, trimM, 0, 2.15, 0), box(0.3, 4.6, 0.5, trimM, -2.65, 0, 0), box(0.3, 4.6, 0.5, trimM, 2.65, 0, 0), box(0.15, 4, 0.2, trimM, 0, 0, 0), box(5, 0.15, 0.2, trimM, 0, 0, 0));
  win.add(box(5.8, 0.25, 1.1, trimM, 0, -2.35, 0.45)); // sill
  const nightM = new THREE.MeshBasicMaterial({ map: canvasTexture(512, 512, (c, S) => {
    const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#0c1636'); g.addColorStop(1, '#27406e'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    const r = rng(9); c.fillStyle = '#ffffff'; for (let i = 0; i < 60; i++) c.fillRect(r() * S, r() * S * 0.7, 2, 2);
    c.fillStyle = '#152238'; for (let i = 0; i < 6; i++) { const x = i * 95 - 20, h = 90 + r() * 80; c.beginPath(); c.moveTo(x, S); c.lineTo(x + 60, S - h); c.lineTo(x + 120, S); c.fill(); } // tree tops
  }) });
  const sky = plane(9, 7, nightM, -4, 6.6, -11.5); group.add(sky);
  const moonM = new THREE.MeshBasicMaterial({ color: '#fff7dc' }); const moon = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), moonM); moon.position.set(-2.6, 8.3, -11.4); group.add(moon);
  const glassM = std('#9fc2ff', { transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1 }); group.add(plane(5, 4, glassM, -4, 6.6, -9.05));
  const curtM = std('#2f4f7a', { roughness: 0.95 });
  for (const s of [-1, 1]) { const c = box(1.3, 5.6, 0.25, curtM, -4 + s * 3.4, 6.1, -8.75); group.add(c); for (let i = -1; i <= 1; i++) group.add(box(0.12, 5.6, 0.32, std('#26416a'), -4 + s * 3.4 + i * 0.4, 6.1, -8.72)); }
  { const rod = cyl(0.08, 0.08, 9, std('#3a3a3a', { metalness: 0.6 }), 8, -4, 9.2, -8.65); rod.rotation.z = Math.PI / 2; group.add(rod); }
  const garlic = new THREE.Group(); garlic.name = 'garlic'; group.add(garlic);
  const bulbM = std('#f4eedc', { roughness: 0.8 }), stringM = std('#b89a5e');
  for (const s of [-1, 1]) {
    const x0 = -4 + s * 2.2; garlic.add(box(0.05, 2.4, 0.05, stringM, x0, 7.6, -8.6, false));
    for (let i = 0; i < 4; i++) { const b = sph(0.3, bulbM, x0 + (i % 2 ? 0.18 : -0.18), 8.5 - i * 0.6, -8.5); b.scale.set(1, 0.85, 1); garlic.add(b, box(0.06, 0.22, 0.06, bulbM, b.position.x, b.position.y + 0.32, -8.5, false)); }
  }
  garlic.visible = false;

  // ---- bed under the window (x -6.5..-1.5, z -9..-1.8) ----
  const bed = new THREE.Group(); group.add(bed);
  bed.add(box(5.2, 1.1, 7.2, darkWood, -4, 0.75, -5.4), box(5.4, 4.0, 0.4, darkWood, -4, 2.0, -8.8), box(5.4, 2.0, 0.35, darkWood, -4, 1.0, -1.8));
  for (const x of [-6.4, -1.6]) for (const z of [-8.6, -2.0]) bed.add(box(0.4, 0.4, 0.4, darkWood, x, 0.2, z));
  bed.add(box(5.0, 0.8, 7.0, std('#f4f4f4', { roughness: 0.9 }), -4, 1.7, -5.4)); // mattress, top y 2.1
  const pillow = box(3.6, 0.6, 1.5, std('#ffffff', { roughness: 0.95 }), -4, 2.4, -7.9); bed.add(pillow);
  const blanketM = texMat(256, 256, (c, S) => { c.fillStyle = '#d24d4d'; c.fillRect(0, 0, S, S); c.fillStyle = '#b53b3b'; for (let i = 0; i < S; i += 64) { c.fillRect(i, 0, 26, S); c.fillRect(0, i, S, 26); } });
  const blanket = box(5.3, 0.3, 5.0, blanketM, -4, 2.25, -4.3); bed.add(blanket, box(5.3, 1.2, 0.2, blanketM, -4, 1.6, -1.75));
  for (const s of [-1, 1]) bed.add(box(0.2, 1.4, 5.0, blanketM, -4 + s * 2.65, 1.6, -4.3));
  // blanket raised over a sitter's legs (bed_sit): state blanket 'legs'
  const blanketLegs = new THREE.Group(); blanketLegs.visible = false; bed.add(blanketLegs);
  blanketLegs.add(box(5.3, 0.3, 4.4, blanketM, -4, 3.25, -4.0)); for (const s of [-1, 1]) blanketLegs.add(box(0.2, 1.4, 4.4, blanketM, -4 + s * 2.65, 2.6, -4.0)); blanketLegs.add(box(5.3, 1.3, 0.2, blanketM, -4, 2.65, -1.85));
  // a lump to pull over the head (Ch1 "yanks the blanket over his head"): chapters toggle parts.blanketUp
  const blanketUp = new THREE.Group(); blanketUp.visible = false; bed.add(blanketUp);
  blanketUp.add(box(5.3, 0.3, 7.0, blanketM, -4, 3.3, -5.3)); for (const s of [-1, 1]) blanketUp.add(box(0.2, 1.4, 7.0, blanketM, -4 + s * 2.65, 2.7, -5.3)); blanketUp.add(box(5.3, 1.3, 0.2, blanketM, -4, 2.7, -8.75));

  // ---- bedside table + lamp (x 0.6, z -7.8) ----
  group.add(box(2.2, 2.4, 2.0, woodM, 0.6, 1.2, -7.9), box(1.8, 0.6, 0.1, darkWood, 0.6, 1.5, -6.86), box(0.3, 0.15, 0.1, std('#d9b34a', { metalness: 0.6 }), 0.6, 1.5, -6.78));
  group.add(cyl(0.45, 0.55, 0.25, std('#3a3f4a'), 16, 0.3, 2.53, -8.1), cyl(0.08, 0.08, 1.4, std('#3a3f4a'), 8, 0.3, 3.3, -8.1));
  const shadeOff = std('#f0dfb4', { roughness: 0.8, side: THREE.DoubleSide, emissive: '#ffb860', emissiveIntensity: 0 });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 1.1, 20, 1, true), shadeOff); shade.position.set(0.3, 4.3, -8.1); group.add(shade);
  const bulb = sph(0.22, std('#fff2cc', { emissive: '#ffd27a', emissiveIntensity: 0 }), 0.3, 4.1, -8.1); group.add(bulb);
  group.add(box(0.6, 0.12, 0.9, std('#2b2b2b'), 1.3, 2.46, -7.6), box(0.5, 0.5, 0.5, std('#4fa3e0'), 1.3, 2.7, -8.3)); // phone-ish book + clock
  const clockFace = plane(0.42, 0.3, new THREE.MeshBasicMaterial({ map: canvasTexture(128, 96, (c) => { c.fillStyle = '#111'; c.fillRect(0, 0, 128, 96); c.font = 'bold 54px monospace'; c.fillStyle = '#ff4a3a'; c.textAlign = 'center'; c.fillText('12:00', 64, 66); }) }), 1.3, 2.72, -8.04);
  group.add(clockFace);

  // ---- closet: recess x -16.4..-11, z -0.5..4.5; louvred double doors at x -11 ----
  const closetM = std('#f1e9da', { roughness: 0.6 }), closetWall = std('#cdbfa8', { roughness: 0.9 });
  const closet = new THREE.Group(); closet.name = 'closet'; group.add(closet);
  closet.add(box(5.4, 0.4, 6.4, floorMat('#8a5c38', 5, [1, 1]), -13.7, -0.2, 2, false));
  closet.add(box(0.4, 8.4, 6.8, closetWall, -16.6, 4.2, 2, false), box(5.8, 8.4, 0.4, closetWall, -13.8, 4.2, -1.2, false), box(5.8, 8.4, 0.4, closetWall, -13.8, 4.2, 5.2, false), box(5.8, 0.4, 6.8, closetWall, -13.8, 8.4, 2, false));
  closet.add(box(1.5, 0.15, 6.2, closetM, -15.6, 7.6, 2)); // shelf over the rail
  { const rail = cyl(0.07, 0.07, 6.2, std('#c8c8c8', { metalness: 0.7, roughness: 0.3 }), 10, -14.4, 6.9, 2); rail.rotation.x = Math.PI / 2; closet.add(rail); }
  const HOODIE_COLORS = ['#3b5ba5', '#2d2d2d', '#3f8f5a', '#7a7f87', '#c0392b', '#e0a32e', '#5a3d7a'];
  const hoodieZ = [-0.7, -0.15, 0.4, 3.6, 4.15, 4.7]; // a 2.6-wide gap round z 2 is Skye's spot
  hoodieZ.forEach((z, i) => { const h = hoodie(HOODIE_COLORS[i % HOODIE_COLORS.length]); h.position.set(-14.4, 6.95, z); closet.add(h); }); // rail along z: shoulders along x, faces along z
  for (let i = 0; i < 3; i++) closet.add(box(1.2, 0.7 - i * 0.1, 1.0, std(['#e94d4d', '#ffffff', '#2c7be5'][i]), -15.6 + i * 0.1, 0.35 + i * 0.6, -0.6)); // shoe boxes
  closet.add(box(1.3, 0.8, 0.9, std('#3a3a3a'), -15.6, 0.4, 4.6)); // sneakers box
  for (const z of [0.6, 1.4]) closet.add(box(1.2, 0.8, 1.0, std('#d4c6a5'), -15.2, 7.9, z)); // boxes on the shelf
  const cfr = doorFrame(6, 8, trimM); cfr.rotation.y = Math.PI / 2; cfr.position.set(-11, 0, 2); closet.add(cfr);
  const louvreM = std('#f6f1e6', { roughness: 0.55 });
  const closetL = louvreDoor(2.98, 7.9, louvreM); closetL.position.set(-10.95, 0, -1); closetL.rotation.y = -Math.PI / 2; closet.add(closetL); // hinge z -0.5, leaf toward +z
  const closetR = louvreDoor(2.98, 7.9, louvreM); closetR.position.set(-10.95, 0, 5); closetR.rotation.y = Math.PI / 2; closet.add(closetR); // hinge z 5, leaf toward -z
  const closetLight = new THREE.PointLight('#ffe1a8', 0, 9, 2); closetLight.position.set(-13.8, 7.8, 2); closet.add(closetLight);

  // ---- desk with mirror against the right wall (z -7.5..-2.5) ----
  const desk = new THREE.Group(); group.add(desk);
  desk.add(box(2.6, 0.25, 5.0, woodM, 9.6, 3.0, -5));
  for (const z of [-7.3, -2.7]) desk.add(box(2.4, 2.9, 0.25, woodM, 9.6, 1.45, z));
  desk.add(box(2.4, 1.0, 1.8, darkWood, 9.6, 2.35, -6.3));
  const mirrorFrame = box(0.25, 4.2, 3.0, std('#e3c07a', { metalness: 0.4, roughness: 0.4 }), 10.85, 6.2, -5); desk.add(mirrorFrame);
  // a real mirror (Reflector renders the room from the mirrored camera); parts.mirror.visible = false to skip its cost
  const mirrorGlass = new Reflector(new THREE.PlaneGeometry(2.6, 3.8), { textureWidth: 768, textureHeight: 1024, color: '#c9d4dc', clipBias: 0.003 }); mirrorGlass.position.set(10.7, 6.2, -5); mirrorGlass.rotation.y = -Math.PI / 2; desk.add(mirrorGlass);
  desk.add(box(1.4, 0.1, 1.0, std('#ffffff'), 9.4, 3.17, -4.1), box(0.08, 0.08, 0.9, std('#e94d4d'), 9.0, 3.2, -4.3)); // paper, pencil
  desk.add(cyl(0.3, 0.25, 0.7, std('#2c7be5'), 12, 10.2, 3.47, -7.0)); // pencil cup
  desk.add(box(0.6, 0.9, 0.3, std('#ffd23f'), 10.2, 3.57, -2.9), box(0.6, 0.8, 0.3, std('#3f8f5a'), 10.2, 3.52, -3.25)); // books
  // chair (seat top y 1.9) facing the desk
  const chair = new THREE.Group(); chair.position.set(7.9, 0, -5); group.add(chair);
  chair.add(box(1.9, 0.3, 1.9, std('#e94d4d'), 0, 1.75, 0), box(0.3, 2.4, 1.9, std('#e94d4d'), -0.95, 3.0, 0), cyl(0.12, 0.12, 1.6, std('#333'), 8, 0, 0.8, 0), cyl(0.9, 0.9, 0.12, std('#333'), 5, 0, 0.1, 0));
  chair.rotation.y = 0;

  // ---- door to the hallway (right wall z 1.5..5.5), hallway stub behind ----
  const dfr = doorFrame(4, 7.6, trimM); dfr.rotation.y = -Math.PI / 2; dfr.position.set(11, 0, 3.5); group.add(dfr);
  const doorLeaf = door(3.9, 7.5, '#f3efe6', { knobSide: 1 }); doorLeaf.position.set(11, 0, 1.55); doorLeaf.rotation.y = -Math.PI / 2; group.add(doorLeaf); // shut: leaf along +z
  // the hallway outside (dim): floor, far wall, a skirting and a lamp glow
  const hallM = wallMat('#d9c9a3', '#d0bf97', 2, [2, 1]);
  group.add(box(8, 0.4, 8, floorMat('#946642', 4, [2, 2]), 15.2, -0.2, 3.5, false), box(0.4, H, 8, hallM, 19.2, H / 2, 3.5, false), box(8, H, 0.4, hallM, 15.2, H / 2, -0.7, false), box(8, H, 0.4, hallM, 15.2, H / 2, 7.7, false), box(8, 0.4, 8, std('#eee'), 15.2, H + 0.2, 3.5, false));
  const hallLight = new THREE.PointLight('#ffd9a0', 0, 14, 2); hallLight.position.set(16, 8.5, 3.5); group.add(hallLight);
  const hallPanel = plane(1.4, 0.9, std('#ffffff', { emissive: '#ffd59a', emissiveIntensity: 0 }), 18.95, 8.5, 3.5); hallPanel.rotation.y = -Math.PI / 2; group.add(hallPanel);

  // ---- details ----
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.6, 40), texMat(256, 256, (c, S) => { for (let i = 6; i > 0; i--) { c.fillStyle = i % 2 ? '#3d8fd1' : '#f2d36b'; c.beginPath(); c.arc(S / 2, S / 2, (S / 2) * i / 6, 0, Math.PI * 2); c.fill(); } }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(2.5, 0.02, 0); rug.receiveShadow = true; group.add(rug);
  const p1 = poster(3.2, 4.2, (c, w, h) => { c.fillStyle = '#1d2a4a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(w / 2, h * 0.4, w * 0.28, 0, 7); c.fill(); LG(c, 'SPACE', w / 2, h * 0.82, 52, '#ffffff'); });
  p1.position.set(3.8, 6.8, -8.95); group.add(p1);
  const p2 = poster(3.0, 2.2, (c, w, h) => { c.fillStyle = '#3f8f5a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(12, 12, w - 24, h - 24); c.beginPath(); c.arc(w / 2, h / 2, 34, 0, 7); c.stroke(); c.beginPath(); c.moveTo(w / 2, 12); c.lineTo(w / 2, h - 12); c.stroke(); });
  p2.position.set(7.6, 7.2, -8.95); group.add(p2);
  const p3 = poster(2.4, 3.2, (c, w, h) => { c.fillStyle = '#e94d4d'; c.fillRect(0, 0, w, h); LG(c, 'GAME', w / 2, h * 0.35, 60, '#fff'); LG(c, 'ON', w / 2, h * 0.62, 70, '#ffd23f'); });
  p3.rotation.y = Math.PI / 2; p3.position.set(-10.95, 6.4, -5.5); group.add(p3);
  // shelf with trophies on the back wall right
  group.add(box(4.5, 0.2, 1.0, woodM, 7.5, 4.6, -8.5));
  for (let i = 0; i < 3; i++) { const tx = 6.0 + i * 1.4; group.add(cyl(0.3, 0.2, 0.5, std('#e8c34a', { metalness: 0.7, roughness: 0.3 }), 12, tx, 5.2, -8.5), cyl(0.12, 0.12, 0.3, std('#e8c34a', { metalness: 0.7 }), 8, tx, 4.85, -8.5)); }
  // beanbag, laundry, football, backpack hook
  const bean = sph(1.4, std('#ff8c2e', { roughness: 0.95 }), 5.6, 1.0, 5.5); bean.scale.set(1, 0.7, 1); group.add(bean);
  group.add(box(1.4, 0.3, 1.0, std('#3b5ba5'), -8.6, 0.15, 6.8), box(1.0, 0.25, 0.8, std('#7a7f87'), -8.2, 0.4, 6.6)); // laundry pile
  const ball = sph(0.55, texMat(128, 64, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#222'; for (let i = 0; i < 6; i++) c.fillRect(i * 22 + 4, (i % 2) * 28 + 6, 14, 14); }), 3.6, 0.55, 6.6); group.add(ball);

  // ---- lights (practicals; the lighting presets switch them via setLamp etc.) ----
  const lamp = new THREE.PointLight('#ffc27a', 0, 26, 1.6); lamp.position.set(0.3, 4.1, -7.6); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.002; group.add(lamp);
  const moonLight = new THREE.SpotLight('#9db8ff', 0, 40, 0.5, 0.6, 1.2); moonLight.position.set(-2.5, 11.5, -16); moonLight.target.position.set(-3.5, 1.5, -2.5); moonLight.castShadow = true; moonLight.shadow.mapSize.set(1024, 1024); moonLight.shadow.bias = -0.001; group.add(moonLight, moonLight.target);
  const moonFill = new THREE.PointLight('#5b74b8', 0, 30, 1.5); moonFill.position.set(-4, 7, -6); group.add(moonFill);
  // authored (full) intensities; K.applyLight / K.setPractical scale them by userData.base (remembered on first use)
  lamp.intensity = 60; shadeOff.emissiveIntensity = 0.9; bulb.material.emissiveIntensity = 2.5; lamp.userData.bulb = [shade, bulb];
  moonLight.intensity = 260; moonFill.intensity = 10;
  const gapM = std('#ffd59a', { emissive: '#ffb860', emissiveIntensity: 1.8 }); const doorGap = box(0.3, 0.1, 3.9, gapM, 11.0, 0.06, 3.5, false); group.add(doorGap);
  hallLight.intensity = 40; hallPanel.material.emissiveIntensity = 1.5; hallLight.userData.bulb = [hallPanel, doorGap];
  closetLight.intensity = 6;
  const lights = { bedside_lamp: lamp, moon_window: { lights: [moonLight, moonFill] }, hall_under_door: hallLight, closet_light: closetLight };
  function prac(name, on, k = 1) { // same rule as lighting.js setPractical
    const l = lights[name]; const v = on === true ? k : on === false ? 0 : Number(on);
    for (const L of [].concat(l.isLight ? l : l.lights)) { L.userData.base ??= L.intensity; L.intensity = L.userData.base * v; L.visible = v > 0;
      for (const m of [].concat(L.userData.bulb || [])) { m.material.userData.base ??= m.material.emissiveIntensity; m.material.emissiveIntensity = m.material.userData.base * (v > 0 ? Math.max(v, 0.15) : 0); } }
  }
  const setLamp = (on, k) => prac('bedside_lamp', on, k), setMoon = (on, k) => prac('moon_window', on, k), setHall = (on, k) => prac('hall_under_door', on, k);

  function setClosetDoors(fl = 0, fr = fl) { closetL.rotation.y = -Math.PI / 2 + fl * 1.9; closetR.rotation.y = Math.PI / 2 - fr * 1.9; } // 0 shut, 1 swung wide into the room
  function setDoor(f = 0) { doorLeaf.rotation.y = -Math.PI / 2 - f * 1.7; } // 0 shut, 1 open into the room (toward -x, leaf swings toward the desk side)
  function setBlanket(mode = 'flat') { blanketUp.visible = mode === 'over_head'; blanketLegs.visible = mode === 'legs'; blanket.visible = mode === 'flat'; } // 'flat' | 'legs' | 'over_head'
  function setBlanketUp(up) { setBlanket(up ? 'over_head' : 'flat'); }
  function setClock(text) { const c = clockFace.material.map.image.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, 128, 96); c.font = 'bold 54px monospace'; c.fillStyle = '#ff4a3a'; c.textAlign = 'center'; c.fillText(text, 64, 66); clockFace.material.map.needsUpdate = true; }
  setLamp(false); setMoon(true); setHall(false); prac('closet_light', false); setClosetDoors(0); setDoor(0);

  // ---- marks (world) ----
  // sitting marks carry `seat` (the seat surface y, world) and pos.y = seat - 2.0 (R6 hip height at scale 1);
  // for another scale use sitPos(mark, scale). Lying: bed_lie.pos is on the mattress top.
  const M = (x, y, z, heading, note) => ({ pos: W(x, y, z), heading, note });
  const SIT = (x, seat, z, heading, note) => ({ pos: W(x, seat - 2.0, z), seat: seat + OFFSET.y, heading, note });
  const marks = {
    closet_inside: M(-12.1, 0, 3.2, -1.448, 'Ch1 hook: Skye pressed to the right-hand hoodies, turned 3/4 toward closet_pov (camera in the hoodie gap); Max is seen past her through the door gap'),
    closet_deep: M(-13.9, 0, 2.0, Math.PI / 2, 'Skye pressed back into the hoodie gap (when Max opens the doors; her hair pokes out between them)'),
    closet_crack: M(-11.8, 0, 2.0, Math.PI / 2, 'Skye just behind the closet doors, face at the centre gap (Ch1 end)'),
    closet_front: M(-8.6, 0, 2.0, -Math.PI / 2, 'Max facing the closet doors, arm length away'),
    bed_side: M(-0.4, 0, -4.2, -Math.PI / 2, 'standing beside the bed (right side), facing it'),
    bed_lie: M(-4, 2.1, -5.2, 0, 'lying on the mattress (top y 2.1): head on the pillow at z -7.6, feet toward +z; chapter lays the rig back'),
    bed_sit: SIT(-4, 2.1, -6.4, 0, 'sitting up in bed, back to the headboard, legs under the blanket toward +z'),
    bed_sit_door: SIT(-4, 2.1, -6.4, Math.atan2(15.0, 9.9), 'sitting up in bed, turned toward the door (Ch10)'),
    bed_edge: SIT(-1.3, 2.0, -4.6, Math.PI / 2 - 0.3, 'sitting on the right edge of the bed facing the room (toward ghost_stop, cheated to camera), feet on the floor'),
    desk_chair: SIT(7.9, 1.9, -5, Math.PI / 2, 'sitting on the desk chair (seat top y 1.9) facing the mirror'),
    desk_stand: M(8.0, 0, -5, Math.PI / 2, 'standing at the desk facing the mirror (Ch6 rehearsal; push the chair aside: parts.chair)'),
    room_center: M(2.5, 0, 0, 0, 'middle of the rug'),
    door_out: M(15.0, 0, 3.5, -Math.PI / 2, 'in the hallway stub outside the door, facing in'),
    door_in: M(9.0, 0, 3.5, -Math.PI / 2, 'just inside the door, facing into the room'),
    door_in_bed: M(8.2, 0, 2.8, -2.15, 'a step inside the door, facing the bed (Ch10 Skye)'),
    mid_room_bed: M(3.0, 0, -0.5, -2.2, 'halfway from the door to the bed, facing the bed (Ch10 Skye after gliding in)'),
    window: M(-4, 0, -1.0, Math.PI, 'at the foot of the bed facing the window'),
  };

  // ---- cams (world); hide = walls to hide for that camera (front is hidden by default) ----
  const C = (pos, target, fov, hide = [], note = '') => ({ pos: W(...pos), target: W(...target), fov, hide, note });
  const cams = {
    closet_pov: C([-15.6, 4.5, 2.3], [-5.0, 3.4, -1.4], 48, [], 'Ch1 hook: inside the closet behind Skye, past the hoodies at Max walking from the bed. Open the doors (setClosetDoors 0.25+) or the louvres hide him'),
    closet_pov_cu: C([-15.0, 4.6, 1.9], [-12.1, 4.3, 3.2], 36, [], 'Ch1 close-up on Skye inside the closet (closet_inside)'),
    closet_doors_ms: C([-3.5, 5.0, 5.8], [-11.0, 3.8, 1.8], 42, [], 'Max at the closet doors, from the room side'),
    closet_doors_cu: C([-7.2, 4.6, 4.8], [-11.2, 4.4, 2.0], 40, [], 'the closet door crack (Skye\'s face in the gap)'),
    two_shot_bed_closet: C([3.5, 7.0, 13.5], [-7.0, 2.8, -2.5], 44, [], 'Ch1: the bed and the closet in one frame'),
    wide: C([1.5, 8.5, 18.0], [-1.0, 3.0, -3.0], 50, [], 'the whole room from the open side'),
    bed_ms: C([2.5, 5.6, -0.5], [-4.0, 3.2, -6.0], 40, [], 'Max in bed, medium'),
    bed_cu: C([-1.2, 4.8, -2.4], [-4.0, 4.0, -6.4], 34, [], 'Max sitting up in bed, close (bed_sit)'),
    bed_edge_ms: C([5.5, 5.2, 1.5], [-1.3, 3.8, -4.6], 38, [], 'Ch8: Max on the bed edge with the phone'),
    desk_side: C([5.0, 5.6, 0.5], [9.6, 5.0, -5.0], 42, [], 'Ch6: Max at the desk mirror, 3/4 from behind-left, mirror in frame'),
    desk_profile: C([10.2, 5.6, 1.8], [8.2, 4.6, -5.0], 32, [], 'Ch6: Max at the mirror from the front-side (his face and the mirror)'),
    desk_cu: C([7.0, 5.2, -1.6], [9.0, 5.0, -5.2], 34, [], 'Ch6: close on Max at the mirror'),
    desk_wide: C([-2.0, 7.0, 8.0], [8.5, 3.6, -4.0], 46, [], 'Ch6: the room toward the desk, door in frame'),
    door_ws: C([-6.0, 6.0, 4.5], [10.5, 4.0, 3.2], 46, [], 'toward the door from the left side of the room'),
    two_shot_bed_door: C([-8.6, 5.6, -3.2], [7.5, 3.6, 3.0], 48, [], 'Ch10: from beside the bed toward the door, Max in the foreground'),
    ots_max_to_skye: C([-6.2, 5.9, -4.4], [6.0, 4.4, 1.0], 40, [], 'Ch10: over Max\'s shoulder (in bed) at Skye'),
    ots_skye_to_max: C([9.9, 6.4, 6.4], [-4.0, 3.6, -6.4], 38, [], 'Ch10: over Skye\'s shoulder (near the door) at Max in bed'),
    cu_skye_mid: C([-0.5, 5.0, -2.0], [3.0, 4.6, -0.5], 34, [], 'Ch10: Skye mid-room (mid_room_bed), close, same side of the line'),
    cu_skye_door: C([4.0, 5.0, 0.5], [8.2, 4.6, 2.8], 34, [], 'Ch10: Skye just inside the door (door_in_bed), close'),
    window_garlic: C([-1.0, 5.6, -1.5], [-4.0, 7.0, -9.0], 44, [], 'the window with the garlic (state garlic)'),
  };

  // ---- marks/cams asked for by the chapter plans (production/shots/chNN.md); aliases share the objects above ----
  Object.assign(marks, {
    ghost_stop: M(3.2, 0, -4.4, -Math.PI / 2 + 0.3, 'Ch10: Skye standing ~4.5 studs from the bed\'s long side, facing Max (cheated to camera)'),
    bedside_plate: M(0.9, 2.42, -7.5, 0, 'Ch10: plate spot on the bedside table top (y = table top)'),
    bedside_flashlight: M(1.2, 2.42, -7.2, -0.6, 'Ch1: flashlight lying on the bedside table'),
    lamp_switch: M(0.65, 2.75, -8.1, 0, 'Ch10: the lamp switch on the lamp base (hand point)'),
    closet_hide: marks.closet_deep,
    mirror_stand: marks.desk_stand, bed_sit_up: marks.bed_sit, door_outside: marks.door_out, door_inside: marks.door_in,
  });
  Object.assign(cams, {
    closet_skye_cu: cams.closet_pov_cu,
    closet_pov_reverse: C([-15.6, 5.2, 2.0], [-8.6, 4.2, 2.0], 44, [], 'Ch1: from the back of the closet over the hoodies at Max in the open doorway (Skye at closet_deep)'),
    closet_max_mcu: C([-14.2, 4.9, 2.6], [-8.6, 4.5, 2.0], 32, [], 'Ch1: inside the closet between the hoodies, MCU on Max at closet_front'),
    closet_door_ext: C([-10.2, 5.0, -2.8], [-8.6, 4.3, 2.0], 40, [], 'Ch1: room side, front 3/4 on Max at closet_front (camera by the side wall, near the bed)'),
    bed_max_ms: cams.bed_ms, bed_max_mcu: cams.bed_cu,
    bed_phone_mcu: C([-1.6, 5.0, -1.6], [-4.0, 4.6, -6.6], 32, [], 'Ch8: Max sitting up in bed (bed_sit) with the phone, 3/4, garlic window behind him'),
    bed_phone_ms: C([-0.6, 5.6, 0.2], [-4.0, 4.0, -6.4], 44, [], 'Ch8: wider, the window and garlic behind'),
    mirror_mcu: C([10.3, 5.3, -3.0], [8.0, 4.9, -5.0], 32, [], 'Ch6: beside the mirror, Max (mirror_stand) 3/4'),
    mirror_ms: C([10.4, 5.0, -0.8], [8.0, 4.1, -5.0], 40, [], 'Ch6: waist-up on Max at the mirror'),
    bed_to_door: C([-6.5, 4.6, 12.5], [3.5, 3.4, -1.8], 44, [], 'Ch10 start: from the open side, Max in bed frame-left (3/4) and the door frame-right'),
    two_shot_door: C([2.6, 5.2, 7.2], [1.4, 3.8, -4.2], 44, [], 'Ch10 end: Max at bed_edge and Skye at ghost_stop, both 3/4, the door toward the frame edge'),
    door_handle_cu: C([8.4, 4.0, 3.0], [10.9, 3.6, 5.0], 30, [], 'Ch10: the door handle (inside)'),
    ghost_front_mcu: C([-0.2, 5.0, -0.6], [3.2, 4.8, -4.2], 34, [], 'Ch10: Skye at ghost_stop from the front (bed side of her, camera side of the line)'),
  });

  const parts = { bed, blanket, blanketUp, blanketLegs, pillow, closet, closetL, closetR, doorLeaf, desk, chair, mirror: mirrorGlass, garlic, shade, bulb, moon, sky, rug, hallPanel };

  function setState(state = {}) {
    const ch = state.chapter ?? 1;
    garlic.visible = state.garlic ?? ch >= 5; // hung by Wednesday; visible in every later shot of Max's room
    if (state.lamp !== undefined) setLamp(state.lamp);
    if (state.moon !== undefined) setMoon(state.moon);
    if (state.hall !== undefined) setHall(state.hall);
    if (state.door !== undefined) setDoor(state.door);
    if (state.closet !== undefined) setClosetDoors(state.closet);
    if (state.blanketUp !== undefined) setBlanketUp(state.blanketUp);
    if (state.blanket !== undefined) setBlanket(state.blanket);
    if (state.clock) setClock(state.clock);
  }
  setState({ chapter: 1 });

  // apply a named cam to a three camera and hide the walls it lists (front always hidden unless a cam unhides it)
  function useCam(camera, name) {
    const c = cams[name]; if (!c) throw new Error('bedroom: no cam ' + name);
    for (const [k, w] of Object.entries(walls)) w.visible = k !== 'front' && !c.hide.includes(k);
    camera.position.copy(c.pos); camera.fov = c.fov; camera.lookAt(c.target); camera.updateProjectionMatrix();
    return c;
  }

  return { id: 'bedroom', group, marks, cams, lights, parts, walls, sitPos, setState, setLamp, setMoon, setHall, setDoor, setClosetDoors, setBlanketUp, setBlanket, setClock, useCam };
}
