// He Flew The Wrong Way: sets, props and the plane, built in code.
// World layout (studs, floor y 0). Each place is its own group (with its own floor), shown only in its shots:
//   NYC      origin. Floyd Bennett Field at dawn: a runway along x (east = +x), grass, a hangar, a signpost whose
//            CALIFORNIA arrow points west (-x), a far Manhattan skyline.
//   EIRE     (0, 0, 3000). Baldonnel Aerodrome: green fields, rolling hills, stone walls, a low building, a tricolour.
//   OFFICE   (0, 0, -3000). The Bureau of Air Commerce: desk, wall sign, flag, window, map with a red X (open +z side).
//   SKY      (3000, 0, 0). The plane at altitude (fixed), clouds and the sea far below moving past.
//   COCKPIT  (-3000, 0, 0). The cabin interior (open +x side): seat, panel with the old compass, the empty radio slot,
//            the extra fuel tank in front, the floor (where the hole goes).
//   SEA      (0, 0, 6000). Open water, the liner sailing toward the far New York skyline and the statue.
//   STREET   (6000, 0, 0). Broadway: a canyon of tall buildings along z, sidewalks, the parade car, ticker tape.
// The plane faces +z, origin on the ground under the wing centre.
import * as THREE from 'three';
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

export const NYC = V(0, 0, 0), EIRE = V(0, 0, 3000), OFFICE = V(0, 0, -3000), SKY = V(3000, 0, 0), COCKPIT = V(-3000, 0, 0), SEA = V(0, 0, 6000), STREET = V(6000, 0, 0);
export const RUNWAY_Z = 0;                       // runway centre line (along x) at both fields
export const SKY_ALT = 0;                        // the plane sits at the sky place's origin; the sea is far below

function grassTex(seed, base = '#6f9a45', hue = [80, 30]) {
  const t = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w); const r = rng(seed);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${hue[0] + r() * hue[1]},${34 + r() * 18}%,${30 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function asphaltTex(seed) {
  const t = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = '#56575b'; g.fillRect(0, 0, w, w); const r = rng(seed);
    for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '30,30,32' : '150,150,150'},${0.06 + r() * 0.1})`; g.fillRect(r() * w, r() * w, 2 + r() * 3, 2 + r() * 3); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ======================================================= the plane ===================================================
// A 1929 Curtiss Robin, cartoon-sized: a silver high-wing cabin monoplane with a radial engine, struts, two big wheels
// and a tail skid; patched all over (darker squares) because his plane was "too old and too patched up". Faces +z.
// userData: body (tilt this), prop, door (hinged at its front edge, opens outward on the -x side with rotation.y +), seat (local
// position for a seated pilot's root), patches (the loose one flaps), panel.
export function robin() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = std('#c4c8cc', { roughness: 0.45, metalness: 0.35 }), trim = std('#1f3a6b', { roughness: 0.5 }), dark = std('#2a2d33', { roughness: 0.6 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#cfe6f5', roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false });
  const patchM = [std('#9a9a92', { roughness: 0.8 }), std('#b0a58c', { roughness: 0.85 }), std('#8f969c', { roughness: 0.7 })];
  const Y = 3.2;                                                                   // cabin floor height
  // cabin: floor, roof, front and back walls, low side panels with posts (windows above them)
  body.add(box(3.6, 0.3, 6, skin, 0, Y, 0.5));
  body.add(box(3.6, 0.3, 6, skin, 0, Y + 4.3, 0.5));
  body.add(box(3.6, 4.3, 0.3, skin, 0, Y + 2.15, 3.5));
  body.add(box(3.6, 4.3, 0.3, skin, 0, Y + 2.15, -2.5));
  for (const s of [-1, 1]) {
    body.add(box(0.2, 1.9, 6, skin, s * 1.7, Y + 1.1, 0.5));
    for (const z of [3.3, -2.35]) body.add(box(0.22, 4.3, 0.35, skin, s * 1.7, Y + 2.15, z));
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.3), glass); gl.rotation.y = s * Math.PI / 2; gl.position.set(s * 1.72, Y + 3.2, 0.5); body.add(gl);
    body.add(box(0.22, 0.3, 6, trim, s * 1.71, Y + 2.0, 0.5));                     // a blue stripe along the side
  }
  // the door on the model's -x side (the camera side when it flies east): a panel hinged at the front post, opens outward
  const door = new THREE.Group(); door.position.set(-1.82, Y + 0.05, 2.9); body.add(door);
  door.add(box(0.14, 1.8, 3.6, skin, 0, 0.9, -1.8));
  // nose: firewall, cowling, radial cylinders, spinner and prop
  const cowl = cyl(1.85, 1.75, 1.6, skin, 20, 0, Y + 2.0, 4.5); cowl.rotation.x = Math.PI / 2; body.add(cowl);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, c = cyl(0.32, 0.32, 0.9, dark, 8, Math.cos(a) * 1.35, Y + 2.0 + Math.sin(a) * 1.35, 5.45); c.rotation.x = Math.PI / 2; body.add(c); }
  body.add(sph(0.45, std('#d9dde2', { metalness: 0.7, roughness: 0.3 }), 0, Y + 2.0, 5.9, 12));
  const prop = new THREE.Group(); prop.position.set(0, Y + 2.0, 6.05); body.add(prop);
  { const b = box(0.35, 6.4, 0.12, std('#5b3a24', { roughness: 0.6 })); b.rotation.y = 0.25; prop.add(b); }
  // rear fuselage: a tapered square boom from the cabin back to the tail
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 2.5, 9.5, 4, 1), skin); boom.rotation.x = -Math.PI / 2; boom.rotation.y = Math.PI / 4;
  const boomG = new THREE.Group(); boomG.add(boom); boomG.position.set(0, Y + 2.6, -7.2); boomG.scale.set(1, 1, 1); body.add(boomG); boom.castShadow = true;
  boom.scale.set(1, 1, 1);
  // tail: stabiliser, fin and rudder, registration
  body.add(box(7, 0.22, 2.2, skin, 0, Y + 2.9, -11.4));
  body.add(box(0.22, 3.2, 2.4, skin, 0, Y + 4.4, -11.5));
  const reg = label(2.2, 1.2, 256, 128, (c, w, h) => { c.fillStyle = '#c4c8cc'; c.fillRect(0, 0, w, h); SLAB(c, 'NX', w / 2, 40, 44, '#1f3a6b'); SLAB(c, '9243', w / 2, 92, 44, '#1f3a6b'); });
  for (const s of [-1, 1]) { const r2 = reg.clone(); r2.rotation.y = s * Math.PI / 2; r2.position.set(s * 0.13, Y + 4.3, -11.5); body.add(r2); }
  // high wing on top of the cabin, with V struts down to the bottom of the fuselage
  const wing = box(26, 0.5, 4.4, skin, 0, Y + 4.7, 0.9); body.add(wing);
  body.add(box(26.1, 0.52, 0.5, trim, 0, Y + 4.7, 3.0));
  for (const s of [-1, 1]) for (const dz of [2.2, -0.4]) {
    const a = V(s * 1.6, Y + 0.2, dz), b = V(s * 8.5, Y + 4.45, dz), st = cyl(0.12, 0.12, a.distanceTo(b), dark, 6);
    st.position.copy(a).lerp(b, 0.5); st.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); body.add(st);
  }
  // landing gear: two big wheels on legs, a tail skid
  for (const s of [-1, 1]) {
    const a = V(s * 1.4, Y, 2.0), b = V(s * 2.6, 1.3, 2.0), leg = cyl(0.14, 0.14, a.distanceTo(b), dark, 6);
    leg.position.copy(a).lerp(b, 0.5); leg.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); body.add(leg);
    const w = cyl(1.3, 1.3, 0.55, std('#1b1b1d', { roughness: 0.9 }), 18, s * 2.75, 1.3, 2.0); w.rotation.z = Math.PI / 2; body.add(w);
    const hub = cyl(0.45, 0.45, 0.6, std('#d9dde2', { metalness: 0.6 }), 12, s * 2.78, 1.3, 2.0); hub.rotation.z = Math.PI / 2; body.add(hub);
  }
  { const sk = box(0.15, 1.6, 0.15, dark, 0, Y + 1.1, -11.6); sk.rotation.x = 0.4; body.add(sk); }
  // patches: on the wing top, fuselage sides and tail (slightly proud of the skin, never coplanar)
  const r = rng(9), patches = [];
  const addP = (w, h, d, x, y, z, i) => { const p = box(w, h, d, patchM[i % 3], x, y, z); p.castShadow = false; body.add(p); patches.push(p); return p; };
  for (let i = 0; i < 9; i++) addP(1.2 + r() * 1.4, 0.08, 0.9 + r() * 1.1, (r() - 0.5) * 22, Y + 4.98, 0.9 + (r() - 0.5) * 2.6, i);
  for (const s of [-1, 1]) {
    addP(0.08, 0.9 + r() * 0.5, 1.2 + r(), s * 1.84, Y + 0.9, 0.2 + r() * 2, 1);
    addP(0.08, 0.7, 1.1, s * 1.4, Y + 2.4, -5.6, 2);
    addP(0.08, 0.6, 0.9, s * 0.9, Y + 2.8, -8.6, 0);
  }
  const loose = new THREE.Group(); loose.position.set(-6.5, Y + 4.97, 1.6); body.add(loose);                 // the flapping one (hinged on its back edge)
  { const p = box(1.6, 0.06, 1.3, patchM[1], 0, 0, 0.65); p.castShadow = false; loose.add(p); }
  // inside: a seat and the instrument panel (for the side-window views)
  // (low seat: a seated R6 pilot is 3.5 studs from seat to head top, the cabin is 4.15 high inside)
  body.add(box(1.8, 0.35, 1.4, std('#5b3a24'), 0.0, Y + 0.33, -0.6), box(1.8, 2.0, 0.3, std('#5b3a24'), 0.0, Y + 1.4, -1.45));
  g.userData = { body, prop, door, loose, patches, seat: V(0.0, Y + 0.2, -0.45), Y };
  return g;
}

// ======================================================= New York ====================================================
export function nyField(scene) {
  const g = new THREE.Group(); g.position.copy(NYC); scene.add(g);
  const gt = grassTex(11, '#7a9a4c'); gt.repeat.set(120, 120);
  g.add(flat(2400, 2400, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 0, 0));
  const at = asphaltTex(3); at.repeat.set(60, 2);
  g.add(flat(900, 26, std('#ffffff', { map: at, roughness: 0.9 }), 100, 0.03, RUNWAY_Z));
  for (let x = -330; x < 540; x += 18) g.add(flat(8, 0.6, std('#f2f0e6'), x, 0.05, RUNWAY_Z));
  // a big painted arrow on the runway pointing east... no, west: the way he was supposed to go
  // the hangar (doors open, faces +z), behind the runway's west end
  const hg = new THREE.Group(); hg.position.set(-60, 0, -44); g.add(hg);
  const wall = std('#b9b3a3', { roughness: 0.8 }), roof = std('#7d6a58', { roughness: 0.6 });
  hg.add(box(1, 14, 30, wall, -20, 7, -15), box(1, 14, 30, wall, 20, 7, -15), box(41, 14, 1, wall, 0, 7, -30));
  { const rf = box(44, 1, 33, roof, 0, 14.3, -15); rf.rotation.z = 0; hg.add(rf); }
  hg.add(box(41, 3.5, 1.2, wall, 0, 12.3, 0));
  const hs = label(30, 3, 1200, 120, (c, w, h) => { c.fillStyle = '#2b3550'; c.fillRect(0, 0, w, h); LG(c, 'FLOYD BENNETT FIELD', w / 2, h / 2 + 4, 92, '#f2f0e6'); });
  hs.position.set(0, 12.3, 0.62); hg.add(hs);
  hg.add(flat(39, 29, std('#55524d', { roughness: 0.95 }), 0, 0.04, -15));
  // signpost by the runway's edge: CALIFORNIA points west (-x), and nothing points east
  const sp = signpost([['CALIFORNIA', -1, '#ffd23f'], ['2,500 MILES', -1, '#ffffff']]); sp.position.set(-4, 0, 17); g.add(sp);
  // a fuel truck and a windsock
  g.add(cyl(0.15, 0.15, 10, std('#d8d8d8', { metalness: 0.5 }), 8, 30, 5, -22));
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 12, 1, true), std('#ff6a1a', { side: THREE.DoubleSide })); sock.rotation.z = Math.PI / 2; sock.position.set(32.5, 9.4, -22); g.add(sock);
  // a low far skyline to the west (Manhattan), and a tree line
  const sky = skyline(5, 60, 160, 0.6); sky.position.set(-600, 0, -260); sky.rotation.y = 0.5; g.add(sky);
  const r = rng(6);
  for (let i = 0; i < 40; i++) { const t = blockTree(r); t.position.set(-500 + r() * 1100, 0, -150 - r() * 120); g.add(t); }
  for (let i = 0; i < 30; i++) { const t = blockTree(r); t.position.set(-500 + r() * 1100, 0, 120 + r() * 120); g.add(t); }
  g.userData = { sock, sign: sp };
  return g;
}
export function signpost(arms) {
  const g = new THREE.Group(), wood = std('#7a5534', { roughness: 0.85 });
  g.add(box(0.5, 9, 0.5, wood, 0, 4.5, 0));
  arms.forEach(([text, dir, col], i) => {
    const w = 8.5, a = label(w, 1.7, 680, 136, (c, W, H) => {
      c.fillStyle = '#1f2a44'; c.beginPath(); c.moveTo(dir < 0 ? 60 : 0, 0); c.lineTo(dir < 0 ? W : W - 60, 0); c.lineTo(dir < 0 ? W : W, dir < 0 ? 0 : H / 2); c.lineTo(dir < 0 ? W : W - 60, H); c.lineTo(dir < 0 ? 60 : 0, H); c.lineTo(dir < 0 ? 0 : 0, dir < 0 ? H / 2 : 0); c.closePath(); c.fill();
      if (dir < 0) { c.fillStyle = '#1f2a44'; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(62, 0); c.lineTo(62, H); c.closePath(); c.fill(); }
      LG(c, text, W / 2 + (dir < 0 ? 24 : -24), H / 2 + 6, 84, col);
    }, { transparent: true, side: THREE.DoubleSide });
    a.position.set(dir * (w / 2 - 0.4), 7.8 - i * 2.1, 0.3); g.add(a);
    const back = a.clone(); back.position.z = -0.3; back.rotation.y = Math.PI; g.add(back);
  });
  return g;
}
export function blockTree(r) {
  const g = new THREE.Group(), s = 0.8 + r() * 0.8;
  g.add(box(1.2 * s, 5 * s, 1.2 * s, std('#5b3a24', { roughness: 0.9 }), 0, 2.5 * s, 0));
  g.add(box(6 * s, 5 * s, 6 * s, std(r() < 0.5 ? '#3f6b30' : '#4d7a35', { roughness: 0.9 }), 0, 7 * s, 0));
  return g;
}
const winTex = (seed, col, lit = 0.25) => canvasTexture(128, 256, (c, w, h) => {
  c.fillStyle = col; c.fillRect(0, 0, w, h); const r = rng(seed);
  for (let y = 8; y < h - 8; y += 18) for (let x = 8; x < w - 8; x += 20) { c.fillStyle = r() < lit ? '#ffe7a8' : '#2c3442'; c.fillRect(x, y, 12, 11); }
});
// A row of tall boxes with window textures. n buildings, heights hMin..hMax, spacing
export function skyline(seed, hMin, hMax, fade = 1) {
  const g = new THREE.Group(), r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const h = hMin + r() * (hMax - hMin), w = 18 + r() * 20, d = 18 + r() * 14, t = winTex(seed * 100 + i, ['#8d8a84', '#a39c90', '#7b7f86', '#9a8f80'][i % 4]);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 14, h / 28);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std('#ffffff', { map: t, roughness: 0.8 })); b.position.set(i * 26 - 340 + r() * 8, h / 2, r() * 30); g.add(b);
    if (r() < 0.35) { const sp = cyl(0.2, w * 0.22, h * 0.25, std('#9ea3a8', { metalness: 0.5 }), 4, b.position.x, h + h * 0.125, b.position.z); g.add(sp); }
  }
  return g;
}

// ======================================================= Ireland =====================================================
export function eireField(scene) {
  const g = new THREE.Group(); g.position.copy(EIRE); scene.add(g);
  const gt = grassTex(21, '#5ea044', [90, 30]); gt.repeat.set(120, 120);
  g.add(flat(2400, 2400, std('#ffffff', { map: gt, roughness: 0.95 }), 0, 0, 0));
  // a mown grass strip (lighter) as the landing field
  const lt = grassTex(22, '#7dbb55', [85, 25]); lt.repeat.set(40, 3);
  g.add(flat(700, 40, std('#ffffff', { map: lt, roughness: 0.95 }), 0, 0.03, RUNWAY_Z));
  // rolling hills
  const hm = std('#4f8f3a', { roughness: 0.95 }), r = rng(31);
  for (let i = 0; i < 14; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hm); const s = 80 + r() * 90; h.scale.set(s * 1.6, 18 + r() * 26, s); h.position.set(-700 + i * 110 + r() * 40, 0, -260 - r() * 160); g.add(h); }
  for (let i = 0; i < 10; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hm); const s = 80 + r() * 90; h.scale.set(s * 1.6, 14 + r() * 20, s); h.position.set(-700 + i * 150 + r() * 40, 0, 300 + r() * 160); g.add(h); }
  // dry-stone walls
  const stone = std('#9a968c', { roughness: 0.95 });
  for (const z of [-60, 64]) for (let x = -300; x < 300; x += 6) { const b = box(6.2, 2 + r() * 0.5, 1.4, stone, x, 1.1, z + (r() - 0.5) * 0.4); b.rotation.y = (r() - 0.5) * 0.06; g.add(b); }
  // the aerodrome building with its sign, and a tricolour on a pole
  const bl = new THREE.Group(); bl.position.set(-40, 0, -34); g.add(bl);
  const wall = std('#e8e2d0', { roughness: 0.8 }), roof = std('#5a4a40', { roughness: 0.7 });
  bl.add(box(30, 9, 12, wall, 0, 4.5, -6), box(31, 1, 13, roof, 0, 9.4, -6));
  for (const x of [-10, -4, 4, 10]) bl.add(box(3, 2.6, 0.3, std('#9fc6e8', { roughness: 0.2 }), x, 5, 0.05));
  bl.add(box(3, 5.6, 0.3, std('#2f5a3a'), 0, 2.8, 0.05));
  const sg = label(24, 2.4, 1200, 120, (c, w, h) => { c.fillStyle = '#2f5a3a'; c.fillRect(0, 0, w, h); LG(c, 'BALDONNEL AERODROME', w / 2, h / 2 + 4, 84, '#f2f0e6'); });
  sg.position.set(0, 7.6, 0.25); bl.add(sg);
  g.add(cyl(0.15, 0.18, 14, std('#e8e8e8', { metalness: 0.5 }), 8, -8, 7, -30));
  const flag = new THREE.Group(); flag.position.set(-8, 12.6, -30); g.add(flag);
  ['#169b62', '#ffffff', '#ff883e'].forEach((col, i) => { const p = box(1.6, 2.6, 0.08, std(col, { roughness: 0.7 }), 0.95 + i * 1.6, 0, 0); p.castShadow = false; flag.add(p); });
  for (let i = 0; i < 30; i++) { const t = blockTree(r); t.position.set(-400 + r() * 800, 0, -100 - r() * 100); g.add(t); }
  g.userData = { flag };
  return g;
}

// ======================================================= the office ==================================================
// Interior, open +z side. Desk centre at local (0, 0, -3); Mia stands behind it (local z -5.6), the visitor in front.
export const DESK = V(0, 0, -3), DESK_TOP = 2.3;
export function office(scene) {
  const g = new THREE.Group(); g.position.copy(OFFICE); scene.add(g);
  const wallM = std('#d9cfb8', { roughness: 0.9 }), wood = std('#6b4428', { roughness: 0.6 }), floorM = std('#7a5a3e', { roughness: 0.8 });
  g.add(flat(40, 30, floorM, 0, 0.0, 0));
  g.add(box(40, 18, 0.6, wallM, 0, 9, -10));
  g.add(box(0.6, 18, 30, wallM, -16, 9, 2), box(0.6, 18, 30, wallM, 16, 9, 2));
  g.add(box(40, 0.6, 30, std('#efe8d8'), 0, 18, 2));
  g.add(box(40, 1.2, 0.7, std('#4a3424'), 0, 0.6, -9.6));
  // desk
  g.add(box(10, 0.4, 4.4, wood, DESK.x, DESK_TOP - 0.2, DESK.z));
  g.add(box(9.6, DESK_TOP - 0.4, 0.3, wood, DESK.x, (DESK_TOP - 0.4) / 2, DESK.z + 2.0));
  for (const s of [-1, 1]) g.add(box(0.3, DESK_TOP - 0.4, 4.2, wood, DESK.x + s * 4.8, (DESK_TOP - 0.4) / 2, DESK.z));
  const blotter = box(4.6, 0.06, 2.8, std('#2f5a3a', { roughness: 0.9 }), 0, DESK_TOP + 0.03, DESK.z - 0.9); g.add(blotter);
  // the application form on the blotter (its texture is set per shot) and a stamp pad
  const form = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.2), std('#ffffff', { roughness: 0.8 })); form.rotation.x = -Math.PI / 2; form.position.set(-0.4, DESK_TOP + 0.08, DESK.z - 1.3); form.rotation.z = 0.12; g.add(form);
  form.userData.tex = {
    atlantic: formTex('TRANSATLANTIC FLIGHT', 'ATLANTIC OCEAN', null), denied: formTex('TRANSATLANTIC FLIGHT', 'ATLANTIC OCEAN', 'DENIED'),
    plan: formTex('FLIGHT PLAN', 'CALIFORNIA', null), approved: formTex('FLIGHT PLAN', 'CALIFORNIA', 'APPROVED'),
  };
  g.add(box(1.1, 0.16, 0.8, std('#2a2d33'), 2.4, DESK_TOP + 0.08, DESK.z + 0.6), box(1.0, 0.04, 0.7, std('#b0202a', { roughness: 0.9 }), 2.4, DESK_TOP + 0.18, DESK.z + 0.6));
  g.add(cyl(0.3, 0.35, 0.8, std('#e8e2d0'), 12, -3.6, DESK_TOP + 0.4, DESK.z - 0.8));                // a pen pot
  // nameplate facing the visitor
  const np = label(3.2, 0.7, 320, 70, (c, w, h) => { c.fillStyle = '#c9a24a'; c.fillRect(0, 0, w, h); SLAB(c, 'OFFICIAL', w / 2, h / 2 + 2, 44, '#2b1a0e'); });
  np.position.set(1.6, DESK_TOP + 0.4, DESK.z + 1.6); np.rotation.x = -0.25; g.add(np); g.add(box(3.2, 0.7, 0.2, std('#2b1a0e'), 1.6, DESK_TOP + 0.35, DESK.z + 1.48));
  // wall sign, flag, window, the Atlantic map with its big red X, a filing cabinet, a clock
  const sg = label(20, 2.2, 1600, 176, (c, w, h) => { c.fillStyle = '#1f2a44'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a24a'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); LG(c, 'BUREAU OF AIR COMMERCE', w / 2, h / 2 + 6, 110, '#f2f0e6'); });
  sg.position.set(0, 14.6, -9.65); g.add(sg);
  const map = label(8, 5, 640, 400, (c, w, h) => {
    c.fillStyle = '#9cc7e8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#d8c58c'; c.beginPath(); c.moveTo(0, 40); c.lineTo(150, 30); c.lineTo(190, 160); c.lineTo(130, 260); c.lineTo(160, 400); c.lineTo(0, 400); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(520, 60); c.lineTo(600, 40); c.lineTo(640, 80); c.lineTo(640, 300); c.lineTo(560, 260); c.lineTo(540, 160); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(470, 130, 26, 34, 0.3, 0, 7); c.fill();
    LG(c, 'ATLANTIC', w / 2, h / 2, 64, '#2b5a86');
    c.strokeStyle = '#e0262b'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(230, 110); c.lineTo(420, 300); c.moveTo(420, 110); c.lineTo(230, 300); c.stroke();
  });
  map.position.set(-7, 9.4, -9.65); g.add(map); g.add(box(8.4, 5.4, 0.2, std('#4a3424'), -7, 9.4, -9.78));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), std('#bfe0ff', { emissive: '#bfe0ff', emissiveIntensity: 0.6, roughness: 0.3 })); win.position.set(7.5, 9.4, -9.65); g.add(win);
  g.add(box(6.6, 0.4, 0.4, std('#f2f0e6'), 7.5, 12.1, -9.6), box(6.6, 0.4, 0.4, std('#f2f0e6'), 7.5, 6.7, -9.6), box(0.3, 5, 0.3, std('#f2f0e6'), 7.5, 9.4, -9.55));
  g.add(cyl(0.12, 0.12, 9, std('#c9a24a', { metalness: 0.7 }), 8, -12.5, 4.5, -8));
  const fl = label(3.6, 2.4, 360, 240, (c, w, h) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#b22234'; c.fillRect(0, i * h / 13, w, h / 13 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, w * 0.42, h * 0.54); c.fillStyle = '#ffffff'; for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) c.fillRect(10 + x * 24, 10 + y * 25, 6, 6); }, { side: THREE.DoubleSide });
  fl.position.set(-10.7, 7.6, -8); g.add(fl);
  g.add(box(3, 6, 2.4, std('#6f7377', { metalness: 0.4, roughness: 0.5 }), 12.5, 3, -8.4));
  for (let i = 0; i < 3; i++) g.add(box(2.6, 0.12, 0.1, std('#c9cdd2', { metalness: 0.7 }), 12.5, 1.6 + i * 1.8, -7.15));
  const lamp = new THREE.PointLight('#fff1d6', 0, 60, 1.4); lamp.position.set(0, 15, 2); g.add(lamp);
  g.userData = { form, lamp };
  return g;
}
function formTex(title, dest, stampText) {
  return canvasTexture(340, 440, (c, w, h) => {
    c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h);
    SLAB(c, title, w / 2, 40, 26, '#1f2a44'); c.fillStyle = '#1f2a44'; c.fillRect(30, 62, w - 60, 3);
    c.font = '700 20px Montserrat'; c.textAlign = 'left'; c.fillStyle = '#333';
    c.fillText('PILOT: D. CORRIGAN', 30, 100); c.fillText('FROM: NEW YORK', 30, 140); c.fillText('TO:', 30, 180);
    SLAB(c, dest, w / 2 + 20, 180, 30, '#c0392b');
    for (let i = 0; i < 6; i++) { c.fillStyle = '#c9c4b4'; c.fillRect(30, 230 + i * 26, w - 60, 3); }
    if (stampText) { c.save(); c.translate(w / 2, 370); c.rotate(-0.15); c.strokeStyle = stampText === 'DENIED' ? '#d62828' : '#1e9e4a'; c.lineWidth = 7; c.strokeRect(-130, -36, 260, 72); SLAB(c, stampText, 0, 4, 52, c.strokeStyle); c.restore(); }
  });
}
export function rubberStamp() { const g = new THREE.Group(); g.add(sph(0.2, std('#7a4b2c'), 0, 0.15, 0, 12), cyl(0.06, 0.06, 0.45, std('#7a4b2c'), 8, 0, -0.15, 0), box(0.6, 0.12, 0.4, std('#3a3f48'), 0, -0.42, 0), box(0.58, 0.04, 0.38, std('#d62828'), 0, -0.5, 0)); return g; }

// ======================================================= sky and sea =================================================
export function waterTex(seed, base = '#2d6ea3') {
  const t = canvasTexture(512, 512, (c, w) => {
    c.fillStyle = base; c.fillRect(0, 0, w, w); const r = rng(seed);
    for (let i = 0; i < 700; i++) { c.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.18})`; c.lineWidth = 2 + r() * 2; const x = r() * w, y = r() * w, l = 10 + r() * 30; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function skyPlace(scene) {
  const g = new THREE.Group(); g.position.copy(SKY); scene.add(g);
  const wt = waterTex(41, '#2b5f8e'); wt.repeat.set(40, 40);
  const sea = flat(6000, 6000, std('#ffffff', { map: wt, roughness: 0.5, metalness: 0.1 }), 0, -260, 0); g.add(sea);
  // clouds: a field of puffy clouds that scroll past (their x/z wrap in the clip); some near, some far below
  const clouds = [], r = rng(44);
  for (let i = 0; i < 46; i++) { const c = cloud(300 + i, 10 + r() * 16); c.userData.home = V((r() - 0.5) * 500, -60 + r() * 90, (r() - 0.5) * 900); c.userData.speed = 0.8 + r() * 0.4; g.add(c); clouds.push(c); }
  // the cloud bank he plunges into (a wall of big clouds ahead, +x of the plane... the plane faces +z)
  const bank = new THREE.Group(); g.add(bank);
  for (let i = 0; i < 26; i++) { const c = cloud(600 + i, 26 + r() * 14); c.position.set((r() - 0.5) * 220, -30 + r() * 60, r() * 60); c.scale.multiplyScalar(1.2); bank.add(c); }
  g.userData = { sea, wt, clouds, bank };
  return g;
}
// The cockpit interior: open toward +x (the camera side). Origin at the seat on the floor. The pilot faces +z.
export function cockpit(scene) {
  const g = new THREE.Group(); g.position.copy(COCKPIT); scene.add(g);
  const skin = std('#8d8f8a', { roughness: 0.7 }), wood = std('#6b4428', { roughness: 0.6 }), dark = std('#22252a', { roughness: 0.6 });
  g.add(box(6, 0.4, 12, std('#6a6258', { roughness: 0.9 }), 0, -0.2, 1));           // floor (top at y 0)
  g.add(box(0.4, 9, 12, skin, -3.2, 4.5, 1));                                          // far wall (-x) with a window
  g.add(box(6.8, 0.4, 12, skin, 0, 9.2, 1));                                           // roof
  g.add(box(6.8, 9, 0.4, skin, 0, 4.5, -5));                                           // back wall
  const winM = std('#dfe8f0', { emissive: '#e8f0f8', emissiveIntensity: 0.9, roughness: 0.3 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), winM); win.rotation.y = Math.PI / 2; win.position.set(-2.98, 5.6, 1.5); g.add(win);
  // seat
  g.add(box(2.4, 0.6, 2.2, wood, 0, 0.9, -0.6), box(2.4, 3.4, 0.4, wood, 0, 2.6, -1.75));               // seat top at 1.2
  for (const s of [-1, 1]) g.add(box(0.3, 0.6, 0.3, dark, s * 1.0, 0.3, -0.6));
  // instrument panel in front (z +4.2), the extra fuel tank above it, the compass on top
  const panel = label(5.4, 2.6, 540, 260, (c, w, h) => {
    c.fillStyle = '#2b2620'; c.fillRect(0, 0, w, h);
    const dial = (x, y, r, t) => { c.fillStyle = '#f2ead6'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#c0392b'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(t) * r * 0.75, y + Math.sin(t) * r * 0.75); c.stroke(); };
    dial(90, 90, 56, -0.6); dial(230, 80, 44, 2.2); dial(90, 200, 40, 1.0);
    // the empty radio slot: a dark hole with two loose wires
    c.fillStyle = '#0c0c0c'; c.fillRect(300, 60, 190, 120); c.strokeStyle = '#7d7d7d'; c.lineWidth = 4; c.strokeRect(300, 60, 190, 120);
    c.strokeStyle = '#c0392b'; c.lineWidth = 5; c.beginPath(); c.moveTo(340, 70); c.quadraticCurveTo(350, 140, 330, 170); c.stroke();
    c.strokeStyle = '#2d6ea3'; c.beginPath(); c.moveTo(440, 70); c.quadraticCurveTo(420, 130, 455, 168); c.stroke();
    c.font = '700 26px Montserrat'; c.fillStyle = '#d8d2c2'; c.textAlign = 'center'; c.fillText('RADIO', 395, 215);
  });
  panel.position.set(0, 4.6, 4.2); panel.rotation.y = Math.PI; g.add(panel);
  g.add(box(5.6, 2.8, 0.3, dark, 0, 4.6, 4.38));
  g.add(box(5.6, 0.4, 2, dark, 0, 3.2, 4.4));
  const tank = cyl(1.7, 1.7, 5.6, std('#a8acb0', { metalness: 0.6, roughness: 0.35 }), 20, 0, 7.4, 5.2); tank.rotation.z = Math.PI / 2; g.add(tank);
  for (const x of [-2.2, 2.2]) { const b = cyl(1.75, 1.75, 0.25, dark, 20, x, 7.4, 5.2); b.rotation.z = Math.PI / 2; g.add(b); }
  // the fuel line: from the tank along the roof, then down a little beside the pilot's right knee; its joint leaks
  const pipeM = std('#b8893a', { metalness: 0.7, roughness: 0.35 });
  { const p = cyl(0.12, 0.12, 2.8, pipeM, 8, -1.7, 8.8, 3.9); p.rotation.x = Math.PI / 2; g.add(p); }
  g.add(cyl(0.12, 0.12, 0.8, pipeM, 8, -1.7, 8.4, 2.5), cyl(0.2, 0.2, 0.25, pipeM, 10, -1.7, 8.0, 2.5));
  const drip = V(-1.7, 7.8, 2.5);                                                                         // where the leak drips from (the joint)
  // the compass: a brass bowl on the panel top with a glass dome and a card that swings
  const comp = new THREE.Group(); comp.position.set(1.6, 6.1, 3.9); g.add(comp);
  comp.add(cyl(0.75, 0.6, 0.5, std('#b8893a', { metalness: 0.8, roughness: 0.3 }), 20, 0, 0, 0));
  const card = new THREE.Group(); card.position.y = 0.3; comp.add(card);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), std('#ffffff', { map: canvasTexture(128, 128, (c, w) => { c.fillStyle = '#f2ead6'; c.fillRect(0, 0, w, w); LG(c, 'N', w / 2, 20, 26, '#c0392b'); LG(c, 'S', w / 2, w - 18, 22, '#222'); LG(c, 'E', w - 18, w / 2, 22, '#222'); LG(c, 'W', 18, w / 2, 22, '#222'); }) }));
  face.rotation.x = -Math.PI / 2; card.add(face);
  const needle = box(0.12, 0.06, 1.0, std('#c0392b'), 0, 0.04, 0); card.add(needle);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#dff0ff', transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false }));
  dome.position.y = 0.25; comp.add(dome);
  // fuel: drips (small spheres) and a puddle (a thin disc that grows, then drains into the hole)
  const fuelM = new THREE.MeshStandardMaterial({ color: '#e6b85c', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.75 });
  const drips = []; for (let i = 0; i < 5; i++) { const d = sph(0.12, fuelM, 0, 0, 0, 10); d.scale.y = 1.5; g.add(d); drips.push(d); }
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), fuelM); puddle.rotation.x = -Math.PI / 2; puddle.position.set(-1.7, 0.03, 2.5); g.add(puddle);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), std('#050505', { roughness: 1 })); hole.rotation.x = -Math.PI / 2; hole.position.set(-1.7, 0.05, 2.5); g.add(hole);
  // clouds outside the window (beyond the far wall), scrolled in the clip
  const outside = [], r = rng(70);
  for (let i = 0; i < 8; i++) { const c = cloud(900 + i, 4 + r() * 3); c.userData.home = V(-14 - r() * 8, 3 + r() * 6, r() * 60 - 30); g.add(c); outside.push(c); }
  const light = new THREE.PointLight('#e8f0ff', 0, 30, 1.4); light.position.set(2, 8, 2); g.add(light);
  g.userData = { comp, card, drips, drip, puddle, hole, outside, light, winM };
  return g;
}
export function screwdriver() {
  // gripped at the origin (the fist), the shaft runs along -y (down out of the fist), the handle's end pokes out at +y
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.17, 1.0, std('#d62828', { roughness: 0.35 }), 12, 0, 0.05, 0));
  g.add(cyl(0.21, 0.21, 0.12, std('#1b1b1d'), 12, 0, -0.45, 0));
  g.add(cyl(0.05, 0.05, 1.5, std('#c9cdd2', { metalness: 0.9, roughness: 0.25 }), 8, 0, -1.25, 0));
  g.add(box(0.12, 0.2, 0.03, std('#c9cdd2', { metalness: 0.9, roughness: 0.25 }), 0, -2.05, 0));
  return g;
}

// ======================================================= the telegram ================================================
// A long paper strip: the top (held) part hangs from y `top` straight down to the floor, then runs along the floor
// toward +z for `run` studs. Origin under the hands' midpoint, on the floor; local +z = the reader's forward.
export function telegram() {
  const tex = canvasTexture(256, 2048, (c, w, h) => {
    c.fillStyle = '#f6efc9'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c98f1c'; c.fillRect(0, 0, w, 70); LG(c, 'TELEGRAM', w / 2, 38, 44, '#ffffff');
    c.font = '700 15px Montserrat'; c.fillStyle = '#333'; c.textAlign = 'left';
    const words = ['RULE', 'BROKEN', 'NO', 'PERMIT', 'STOP', 'UNSAFE', 'AIRCRAFT', 'STOP', 'WRONG', 'DIRECTION', 'STOP', 'NO', 'RADIO', 'STOP', 'OCEAN', 'STOP'];
    const r = rng(5); let y = 100;
    while (y < h - 20) { let x = 14, line = ''; while (x < w - 40) { const wd = words[Math.floor(r() * words.length)]; line += wd + ' '; x += wd.length * 10 + 10; } c.fillText(line, 14, y); y += 24; }
  });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  const m = std('#ffffff', { map: tex, roughness: 0.85, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), m); g.add(hang);
  const run = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), m.clone()); run.material.map = tex.clone(); run.material.map.needsUpdate = true; run.rotation.x = -Math.PI / 2; g.add(run);
  const curl = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.6, 14), std('#f6efc9', { roughness: 0.85 })); curl.rotation.z = Math.PI / 2; g.add(curl);
  g.userData = { hang, run, curl };
  return g;
}
// lay the telegram out: top edge at height `top` (hand height), `z0` forward of the origin (the hands' forward
// reach), hanging to the floor, then `len` studs along the floor (unrolling)
export function setTelegram(tg, top, z0, len) {
  const { hang, run, curl } = tg.userData;
  hang.scale.y = top - 0.06; hang.position.set(0, (top + 0.06) / 2, z0);
  run.scale.y = Math.max(0.01, len); run.position.set(0, 0.06, z0 + len / 2); run.visible = len > 0.02;
  const L = 14;                                                       // the canvas stands for 14 studs of paper
  hang.material.map.repeat.set(1, Math.min(1, top / L)); hang.material.map.offset.set(0, 1 - Math.min(1, top / L));
  run.material.map.repeat.set(1, Math.min(1, len / L)); run.material.map.offset.set(0, Math.max(0, 1 - top / L - len / L));
  curl.position.set(0, 0.3, z0 + len + 0.2);
}

// ======================================================= the liner ===================================================
// An ocean liner (no real line's livery: black hull, red boot top, white decks, two buff funnels), faces +z, ~70 long.
// The crated plane sits on the fore deck. userData: deck (y of the main deck), crate, rail (where Max stands).
export function liner() {
  const g = new THREE.Group();
  const black = std('#1d1f24', { roughness: 0.6 }), red = std('#a3262b', { roughness: 0.7 }), white = std('#f2f0ea', { roughness: 0.6 }), buff = std('#d8a548', { roughness: 0.5 });
  const sh = new THREE.Shape(); sh.moveTo(-7, -34); sh.lineTo(7, -34); sh.lineTo(7, 18); sh.quadraticCurveTo(6, 30, 0, 38); sh.quadraticCurveTo(-6, 30, -7, 18); sh.closePath();
  const hullG = new THREE.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false }); hullG.rotateX(-Math.PI / 2);
  const hull = new THREE.Mesh(hullG, black); hull.castShadow = hull.receiveShadow = true; hull.position.y = -2; g.add(hull);
  const bootG = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }); bootG.rotateX(-Math.PI / 2); bootG.scale(1.01, 1, 1.005);
  const boot = new THREE.Mesh(bootG, red); boot.position.y = -2.4; g.add(boot);
  const deckY = 7;
  g.add(box(13.6, 0.3, 50, std('#c9b48a', { roughness: 0.8 }), 0, deckY + 0.1, -8));
  // superstructure: three white tiers with windows, two funnels
  const winT = canvasTexture(512, 64, (c, w, h) => { c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, w, h); for (let x = 10; x < w; x += 22) { c.fillStyle = '#2c3442'; c.beginPath(); c.arc(x, h / 2, 6, 0, 7); c.fill(); } });
  const tier = (w, h, d, y, z) => { const m = std('#ffffff', { map: winT, roughness: 0.6 }); const b = box(w, h, d, m, 0, y, z); g.add(b); return b; };
  tier(12, 3.4, 30, deckY + 1.9, -12); tier(10, 3, 24, deckY + 5.1, -12); tier(8, 2.6, 10, deckY + 7.9, -4);
  for (const z of [-6, -18]) { g.add(cyl(1.9, 2.1, 10, buff, 18, 0, deckY + 11, z)); g.add(cyl(1.95, 1.95, 1.4, black, 18, 0, deckY + 15.4, z)); }
  // railings round the fore deck
  const railM = std('#f2f0ea');
  for (const s of [-1, 1]) g.add(box(0.15, 0.15, 30, railM, s * 6.7, deckY + 1.6, 12));
  for (let z = -3; z <= 27; z += 2) for (const s of [-1, 1]) g.add(box(0.12, 1.6, 0.12, railM, s * 6.7, deckY + 0.8, z));
  // the crated plane on the fore deck
  const crate = new THREE.Group(); crate.position.set(0, deckY + 0.25, 14); g.add(crate);
  const ct = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#c9a26a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a6a3c'; c.lineWidth = 8; for (let y = 0; y < h; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h); c.stroke(); LG(c, 'PLANE', w / 2, h / 2, 64, '#2b1a0e'); });
  crate.add(box(8, 5, 9, std('#ffffff', { map: ct, roughness: 0.85 }), 0, 2.5, 0));
  // masts
  g.add(cyl(0.25, 0.3, 16, std('#c9b48a'), 8, 0, deckY + 8, 26), cyl(0.25, 0.3, 14, std('#c9b48a'), 8, 0, deckY + 7, -30));
  g.userData = { deckY, crate, len: 72 };
  return g;
}
export function statue() {
  const g = new THREE.Group(), green = std('#5fa59a', { roughness: 0.7 }), stone = std('#b3aa96', { roughness: 0.9 });
  g.add(box(14, 10, 14, stone, 0, 5, 0), box(9, 14, 9, stone, 0, 17, 0));
  g.add(cyl(2.4, 3.6, 16, green, 10, 0, 32, 0));                       // robe
  g.add(sph(1.8, green, 0, 41.5, 0, 12));                               // head
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.4; const sp = cyl(0.05, 0.35, 1.6, green, 5, Math.cos(a) * 1.6, 43.4 + Math.sin(a + Math.PI / 2) * 0.2, Math.sin(a) * 0.5); g.add(sp); }
  const arm = cyl(0.7, 0.7, 9, green, 8, 1.6, 44, 0); arm.rotation.z = -0.2; g.add(arm);
  g.add(cyl(0.9, 0.5, 2, green, 10, 2.5, 49, 0), sph(0.9, std('#ffd27a', { emissive: '#ffb030', emissiveIntensity: 1.5 }), 2.5, 50.4, 0, 10));
  return g;
}
export function seaPlace(scene) {
  const g = new THREE.Group(); g.position.copy(SEA); scene.add(g);
  const wt = waterTex(52, '#2f74a8'); wt.repeat.set(60, 60);
  g.add(flat(4000, 4000, std('#ffffff', { map: wt, roughness: 0.4, metalness: 0.1 }), 0, 0, 0));
  const ship = liner(); g.add(ship);
  const sk = skyline(8, 70, 220); sk.position.set(0, 0, 900); sk.rotation.y = Math.PI; g.add(sk);
  const land = flat(1400, 200, std('#7a8a5a'), 0, 0.3, 980); g.add(land);
  const st = statue(); st.position.set(-90, 0, 560); st.rotation.y = Math.PI; g.add(st);
  const islet = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 1.5, 20), std('#7a8a5a')); islet.position.set(-90, 0.4, 560); g.add(islet);
  g.userData = { ship, wt };
  return g;
}

// ======================================================= Broadway ====================================================
// A street along z (the parade comes toward the camera, +z), sidewalks at |x| 9..17, buildings beyond |x| 17.
export function street(scene) {
  const g = new THREE.Group(); g.position.copy(STREET); scene.add(g);
  const at = asphaltTex(8); at.repeat.set(2, 40);
  g.add(flat(18, 600, std('#ffffff', { map: at, roughness: 0.9 }), 0, 0, 0));
  for (const s of [-1, 1]) {
    g.add(box(8, 0.5, 600, std('#b9b4aa', { roughness: 0.9 }), s * 13, 0.25, 0));
    const r = rng(s > 0 ? 81 : 82);
    for (let z = -300; z < 300;) {
      const w = 22 + r() * 16, h = 60 + r() * 110, t = winTex(Math.floor(z + 400 + s * 7), ['#9a8f80', '#a39c90', '#8d8a84', '#b5a68e', '#7b7f86'][Math.floor(r() * 5)], 0.15);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 14, h / 28);
      const b = new THREE.Mesh(new THREE.BoxGeometry(18, h, w), std('#ffffff', { map: t, roughness: 0.8 })); b.position.set(s * 26.5, h / 2, z + w / 2); b.receiveShadow = true; g.add(b);
      z += w + 0.4;
    }
  }
  // the banner across the street
  const banner = label(18, 3.6, 1200, 240, (c, w, h) => { c.fillStyle = '#f2f0e6'; c.fillRect(0, 0, w, h); c.fillStyle = '#b22234'; c.fillRect(0, 0, w, 26); c.fillRect(0, h - 26, w, 26); LG(c, 'WELCOME HOME', w / 2, 80, 70, '#3c3b6e'); LG(c, 'WRONG WAY CORRIGAN', w / 2, 168, 96, '#b22234'); }, { side: THREE.DoubleSide });
  banner.position.set(0, 22, -40); g.add(banner);
  for (const s of [-1, 1]) g.add(box(0.1, 0.1, 0.1, std('#333'), s * 9, 23.8, -40));
  // ticker tape: instanced small strips, positions set per frame in the clip
  const N = 900;
  const tape = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.35, 0.9), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide }), N);
  const r = rng(91), cols = ['#ffffff', '#ffffff', '#f6efc9', '#ffd23f', '#ffffff', '#cfe6ff'];
  const seeds = []; for (let i = 0; i < N; i++) { tape.setColorAt(i, new THREE.Color(cols[i % cols.length])); seeds.push([r(), r(), r(), r(), r()]); }
  tape.userData.seeds = seeds; tape.frustumCulled = false; g.add(tape);
  g.userData = { banner, tape };
  return g;
}
const TM = new THREE.Matrix4(), TQ = new THREE.Quaternion(), TE = new THREE.Euler(), TS = V(1, 1, 1), TP = V();
// ticker tape falling in a box round `centre` (street-local), deterministic in t
export function updateTape(tape, t, centre, amount = 1) {
  const sd = tape.userData.seeds, H = 60;
  sd.forEach(([a, b, c, d, e], i) => {
    const on = i / sd.length < amount;
    const fall = (t * (2.2 + c * 1.6) + a * H) % H;
    TP.set(centre.x + (b - 0.5) * 30 + 1.2 * Math.sin(t * (1.5 + d) + e * 6), centre.y + H - fall, centre.z + (d - 0.5) * 120 + 0.8 * Math.cos(t * (1.2 + c) + a * 6));
    TE.set(t * (2 + a * 4) + e * 6, t * (1 + b * 3), t * (3 + d * 2)); TQ.setFromEuler(TE);
    TS.setScalar(on ? 1 : 0); TM.compose(TP, TQ, TS); tape.setMatrixAt(i, TM);
  });
  tape.instanceMatrix.needsUpdate = true;
}
// the open parade car (two-tone, generic 1930s), faces +z, wheels on y 0; userData.wheels roll by distance
export function paradeCar() {
  const g = new THREE.Group(), body = std('#1d2a44', { metalness: 0.4, roughness: 0.35 }), cream = std('#efe6d0', { roughness: 0.6 }), chrome = std('#e8eef4', { metalness: 1, roughness: 0.15 });
  g.add(box(5.6, 1.6, 13, body, 0, 1.9, 0));
  g.add(box(4.6, 1.3, 4.4, body, 0, 3.1, 4.2));                                          // bonnet
  g.add(box(5.0, 2.2, 0.4, chrome, 0, 2.6, 6.6));                                        // grille
  for (const s of [-1, 1]) { const f = box(1.4, 1.0, 4.4, body, s * 2.9, 1.6, 4.4); g.add(f); const f2 = box(1.4, 1.0, 3.6, body, s * 2.9, 1.6, -4.4); g.add(f2); }
  g.add(box(4.8, 0.9, 1.4, cream, 0, 3.1, -1.0), box(4.8, 1.8, 0.4, cream, 0, 3.6, -1.6));   // front bench
  g.add(box(4.8, 0.9, 1.6, cream, 0, 3.1, -4.4), box(4.8, 2.6, 0.5, cream, 0, 4.0, -5.3)); // back bench (raised: the hero sits up high)
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.2, 0.08), new THREE.MeshPhysicalMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false })); glass.position.set(0, 4.4, 1.9); g.add(glass);
  g.add(box(4.8, 0.15, 0.15, chrome, 0, 5.05, 1.9));
  const wheels = [];
  for (const [x, z] of [[-2.9, 4.4], [2.9, 4.4], [-2.9, -4.4], [2.9, -4.4]]) {
    const w = new THREE.Group(); w.position.set(x, 1.2, z); g.add(w);
    const tr = cyl(1.2, 1.2, 0.8, std('#1b1b1d', { roughness: 0.9 }), 18); tr.rotation.z = Math.PI / 2; w.add(tr);
    const hb = cyl(0.6, 0.6, 0.85, cream, 14); hb.rotation.z = Math.PI / 2; w.add(hb);
    w.add(box(0.9, 0.2, 1.3, std('#9aa3ad', { metalness: 0.8 }))); wheels.push(w);
  }
  for (const s of [-1, 1]) { const hl = cyl(0.45, 0.45, 0.3, std('#fff7d6', { emissive: '#fff2b0', emissiveIntensity: 0.6 }), 14, s * 2.0, 3.6, 6.7); hl.rotation.x = Math.PI / 2; g.add(hl); }
  // small flags on the front wings
  for (const s of [-1, 1]) { g.add(cyl(0.05, 0.05, 2.2, chrome, 6, s * 2.6, 3.2, 6.2)); const f = label(1.2, 0.8, 120, 80, (c, w, h) => { for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#b22234'; c.fillRect(0, i * h / 7, w, h / 7 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, w * 0.45, h * 0.55); }, { side: THREE.DoubleSide }); f.rotation.y = Math.PI / 2; f.position.set(s * 2.6, 4.0, 5.6); g.add(f); }
  g.userData = { wheels, seat: V(0, 2.75, -4.4) };
  return g;
}
export const rollWheels = (car, dist) => car.userData.wheels.forEach((w) => { w.rotation.x = dist / 1.2; });
