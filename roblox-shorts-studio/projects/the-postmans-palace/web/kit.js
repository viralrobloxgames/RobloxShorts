// The Postman's Palace: sets, props and the palace, built in code.
// World layout (studs, floor y 0). One big countryside plain; each place is its own group, shown only in its shots:
//   LANE      origin. A dirt lane along x (z 0) between hedges, round trees, a milestone; THE_STONE lies on it.
//   SITE      (300, 0, 0). Max's garden: the palace (front +z, at PALACE), a fence along z FENCE_Z with the village
//             beyond it, his cottage, the oil lamp post, the souvenir stand and the monument plaque (today).
//   CEMETERY  (-300, 0, 0). A walled village cemetery with headstones and cypresses; the tomb at TOMB.
// The palace grows by clipping: walls(h) and deco(h) set the world height each part is drawn up to.
// Props face +z; held props have their origin where the hand holds them.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
export const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const cyl = (rt, rb, h, m, n = 16, x = 0, y = 0, z = 0) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; };
const sph = (r, m, x = 0, y = 0, z = 0, n = 20) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = s.receiveShadow = true; return s; };
export const label = (w, h, pw, ph, draw, o = {}) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: canvasTexture(pw, ph, draw), roughness: 0.6, ...o }));
const LG = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Luckiest Guy"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const MS = (g, text, x, y, px, color, align = 'center') => { g.font = `800 ${px}px Montserrat`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };
const SLAB = (g, text, x, y, px, color, align = 'center') => { g.font = `${px}px "Alfa Slab One"`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); };

export const LANE = V(0, 0, 0), SITE = V(300, 0, 0), CEMETERY = V(-300, 0, 0);
export const THE_STONE = V(2.2, 0, 0.4);
export const PALACE = SITE.clone().add(V(0, 0, -16));      // palace centre on the ground; front face at z +8 (local)
export const FENCE_Z = 14;                                  // site: the fence the villagers lean on (local z)
export const LAMP = SITE.clone().add(V(-31.5, 0, -9.5));       // just in front of where he works at night (the platform's left end)
export const STAND = SITE.clone().add(V(16, 0, 12));        // souvenir stand (today)
export const TOMB = CEMETERY.clone().add(V(0, 0, -6));

// ======================================================= ground ======================================================
export function ground(scene) {
  const tex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#6e9a3e'; g.fillRect(0, 0, w, w);
    const r = rng(11);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 6; g.fillStyle = `hsl(${78 + r() * 30},${36 + r() * 18}%,${30 + r() * 16}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(160, 160);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600), std('#ffffff', { map: tex, roughness: 0.95 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
  return m;
}
export function trees(parent, spots, seed = 3) {
  const r = rng(seed), n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 7), std('#5b3a24', { roughness: 0.9 }), n);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(3.4, 1), std('#4f7a33', { roughness: 0.9, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, z, s = 1], i) => {
    const sc = s * (0.8 + r() * 0.5); q.setFromEuler(e.set(0, r() * 6.28, 0));
    m.compose(V(x, 2 * sc, z), q, V(sc, sc, sc)); trunk.setMatrixAt(i, m);
    m.compose(V(x, 6.2 * sc, z), q, V(sc * 1.1, sc * 0.95, sc * 1.1)); crown.setMatrixAt(i, m);
  });
  for (const o of [trunk, crown]) { o.castShadow = true; o.receiveShadow = true; parent.add(o); }
  return [trunk, crown];
}
function cypresses(parent, spots, seed = 5) {
  const r = rng(seed), n = spots.length;
  const c = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 11, 8), std('#2f4f2a', { roughness: 0.9, flatShading: true }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  spots.forEach(([x, z], i) => { const s = 0.85 + r() * 0.4; m.compose(V(x, 5.5 * s, z), q, V(s, s, s)); c.setMatrixAt(i, m); });
  c.castShadow = true; parent.add(c); return c;
}

// The pebble mosaic: rounded stones in earthy colours set in pale mortar.
export function pebbleTex(seed = 7, scale = 1) {
  const t = canvasTexture(1024, 1024, (c, w) => {
    c.fillStyle = '#d8ccb0'; c.fillRect(0, 0, w, w);
    const r = rng(seed), cols = ['#b39b74', '#9c8360', '#c9b48c', '#8c7a63', '#a6987f', '#c2a27a', '#7f6f5a', '#b7a586'];
    for (let i = 0; i < 1500; i++) {
      const x = r() * w, y = r() * w, rx = 10 + r() * 22, ry = 8 + r() * 16, a = r() * 3;
      c.fillStyle = cols[i % cols.length]; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.4, ry * 0.3, a, 0, 7); c.fill();
      c.strokeStyle = 'rgba(60,50,40,.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 7); c.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(scale, scale); return t;
}

// ======================================================= the lane ====================================================
export function lane(scene) {
  const g = new THREE.Group(); g.position.copy(LANE); scene.add(g);
  const dirt = canvasTexture(512, 512, (c, w) => { c.fillStyle = '#b08f62'; c.fillRect(0, 0, w, w); const r = rng(3); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '90,70,45' : '220,200,160'},${0.15 + r() * 0.2})`; c.fillRect(r() * w, r() * w, 2 + r() * 4, 2 + r() * 4); } });
  dirt.wrapS = dirt.wrapT = THREE.RepeatWrapping; dirt.repeat.set(40, 1);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 6), std('#ffffff', { map: dirt, roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.y = 0.03; road.receiveShadow = true; g.add(road);
  const hedge = std('#3f6b2e', { roughness: 0.95 });
  for (const z of [-5.5, 5.5]) for (let x = -190; x < 190; x += 12) if (!(z > 0 && Math.abs(x) < 30)) { const r = rng(x * 7 + z); g.add(box(11.4, 2.4 + r() * 0.6, 2.2, hedge, x, 1.3, z)); }
  const ms = box(1.6, 3, 1, std('#e6e0d0', { roughness: 0.8 }), -14, 1.5, -4); g.add(ms);
  const sg = label(1.5, 1.1, 256, 190, (c, w, h) => { c.fillStyle = '#e6e0d0'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8202b'; c.fillRect(0, 0, w, 50); LG(c, 'VILLAGE', w / 2, 27, 40, '#ffffff'); SLAB(c, '2 KM', w / 2, 125, 64, '#16141f'); });
  sg.position.set(-14, 2.4, -3.48); g.add(sg);
  // the stone he trips on (a lumpy, odd shape)
  const st = theStone(); st.position.copy(THE_STONE).add(V(0, 0.22, 0)); g.add(st);
  g.userData.trees = trees(g, [...Array(60)].map((_, i) => { const r = rng(100 + i); return [-190 + i * 6.5 + r() * 3, (r() < 0.5 ? -1 : 1) * (14 + r() * 40), 1 + r() * 0.5]; }), 4);
  // rolling hills far off
  for (let i = 0; i < 10; i++) { const r = rng(60 + i); const h = new THREE.Mesh(new THREE.SphereGeometry(80 + r() * 60, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std('#5d8a3a', { roughness: 1 })); h.scale.y = 0.25; h.position.set(-300 + i * 70, 0, -220 - r() * 80); g.add(h); }
  return { group: g, stone: st };
}
// The odd stone: a lumpy pebble cluster (also the one he carries).
export function theStone() {
  const g = new THREE.Group(), m = std('#b39b74', { roughness: 0.8, map: pebbleTex(5, 0.4) });
  const geos = [];
  for (const [x, y, z, r] of [[0, 0, 0, 0.32], [0.24, 0.08, 0.05, 0.22], [-0.2, 0.1, -0.06, 0.2], [0.05, 0.25, 0.02, 0.18], [0.12, -0.05, 0.2, 0.16]]) { const s = new THREE.IcosahedronGeometry(r, 1); s.translate(x, y, z); geos.push(s); }
  const mesh = new THREE.Mesh(mergeGeometries(geos), m); mesh.castShadow = true; g.add(mesh); return g;
}

// ======================================================= the site and the palace =====================================
export function site(scene, renderer) {
  const g = new THREE.Group(); g.position.copy(SITE); scene.add(g);
  // garden ground: a packed-earth yard where the palace stands
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(90, 50), std('#a88f68', { roughness: 0.95 })); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.03, -10); yard.receiveShadow = true; g.add(yard);
  // fence along z FENCE_Z (gap in the middle), the village lane beyond
  const wood = std('#8a6440', { roughness: 0.85 });
  for (let x = -40; x <= 40; x += 2.4) if (Math.abs(x) > 3) g.add(box(0.3, 3, 0.3, wood, x, 1.5, FENCE_Z));
  g.add(box(37, 0.3, 0.2, wood, -21.5, 2.5, FENCE_Z), box(37, 0.3, 0.2, wood, 21.5, 2.5, FENCE_Z), box(37, 0.3, 0.2, wood, -21.5, 1.3, FENCE_Z), box(37, 0.3, 0.2, wood, 21.5, 1.3, FENCE_Z));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 6), std('#b08f62', { roughness: 0.95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, FENCE_Z + 5); road.receiveShadow = true; g.add(road);
  // village houses across the lane
  for (let i = 0; i < 6; i++) {
    const r = rng(300 + i), x = -60 + i * 24, h = new THREE.Group(); h.position.set(x, 0, FENCE_Z + 22 + r() * 6); g.add(h);
    h.add(box(12, 8, 9, std(['#e8dcc0', '#dccfae', '#efe4cc'][i % 3]), 0, 4, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.2, 4.5, 4), std('#b4553a', { roughness: 0.7 })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.78); roof.position.y = 10.2; roof.castShadow = true; h.add(roof);
    h.add(box(2, 4, 0.2, std('#6b4226'), 0, 2, -4.55), box(2, 2, 0.2, std('#9fc6e8', { roughness: 0.2 }), -3.5, 5, -4.55), box(2, 2, 0.2, std('#9fc6e8', { roughness: 0.2 }), 3.5, 5, -4.55));
  }
  // Max's cottage at the left
  const ct = new THREE.Group(); ct.position.set(-62, 0, -4); g.add(ct);
  ct.add(box(12, 8, 10, std('#efe4cc'), 0, 4, 0)); const cr = new THREE.Mesh(new THREE.ConeGeometry(9, 4.5, 4), std('#b4553a')); cr.rotation.y = Math.PI / 4; cr.scale.set(1, 1, 0.85); cr.position.y = 10.2; ct.add(cr);
  ct.add(box(2.2, 4.4, 0.2, std('#6b4226'), 3, 2.2, 5.1), box(2.2, 2, 0.2, std('#ffd98a', { emissive: '#ffcf6a', emissiveIntensity: 0 }), -2.5, 5, 5.1));
  g.userData.cottageWin = ct.children[ct.children.length - 1];
  // trees around
  g.userData.trees = trees(g, [[-60, -40], [-50, -55], [55, -45], [62, -30], [-70, -20], [70, -10], [40, -60], [-30, -62], [10, -66], [80, 20], [-85, 10]], 8);
  // the oil lamp on a post
  const lamp = new THREE.Group(); lamp.position.copy(LAMP).sub(SITE); g.add(lamp);
  lamp.add(cyl(0.12, 0.15, 5, std('#2a2522', { metalness: 0.4 }), 8, 0, 2.5, 0));
  lamp.add(box(0.9, 1.1, 0.9, std('#2a2522', { metalness: 0.5 }), 0, 5.4, 0));
  const flameM = std('#ffd27a', { emissive: '#ffb84a', emissiveIntensity: 0 }); const flame = sph(0.3, flameM, 0, 5.4, 0, 10); lamp.add(flame);
  const lampLight = new THREE.PointLight('#ffc070', 0, 40, 1.4); lampLight.position.set(0, 5.6, 0.6); lamp.add(lampLight);
  // the palace
  const pal = palace(renderer); pal.group.position.copy(PALACE).sub(SITE); g.add(pal.group);
  // a pile of collected stones beside it
  const pileGeos = []; const pr = rng(9);
  for (let i = 0; i < 70; i++) { const s = new THREE.IcosahedronGeometry(0.3 + pr() * 0.35, 0); s.translate((pr() - 0.5) * 6 * (1 - pr() * 0.5), pr() * 1.6 * (1 - pr()), (pr() - 0.5) * 4); pileGeos.push(s); }
  const pile = new THREE.Mesh(mergeGeometries(pileGeos), std('#a99476', { roughness: 0.9, flatShading: true })); pile.position.set(10, 0.2, 4); pile.castShadow = true; g.add(pile);
  // the souvenir stand (today) and the monument plaque on the palace wall
  const stand = souvenirStand(); stand.position.copy(STAND).sub(SITE); stand.rotation.y = -0.5; g.add(stand);
  const plaque = label(3.4, 2.2, 600, 390, (c, w, h) => {
    c.fillStyle = '#1f4fa8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffffff'; c.lineWidth = 12; c.strokeRect(16, 16, w - 32, h - 32);
    MS(c, 'MONUMENT', w / 2, 120, 64, '#ffffff'); MS(c, 'HISTORIQUE', w / 2, 200, 64, '#ffffff'); MS(c, '1969', w / 2, 300, 50, '#ffd23f');
  }, { roughness: 0.3, metalness: 0.2 });
  plaque.position.copy(PALACE).sub(SITE).add(V(-13, 4.2, 8.06)); g.add(plaque);
  return { group: g, palace: pal, lamp: { flameM, light: lampLight, group: lamp }, stand, plaque, pile };
}

// The palace: a platform, the main block with arches and a terrace, towers, three giants and a few animals, all in the
// pebble mosaic. Two clipping planes: walls (platform, block, arches, parapet) and deco (towers, giants, animals).
export function palace(renderer) {
  renderer.localClippingEnabled = true;
  const g = new THREE.Group();
  const wallsPlane = new THREE.Plane(V(0, -1, 0), 100), decoPlane = new THREE.Plane(V(0, -1, 0), 100);
  const tex = pebbleTex(7, 6), texS = pebbleTex(13, 2);
  const mk = (plane, t = tex, col = '#ffffff') => std(col, { map: t, roughness: 0.85, clippingPlanes: [plane], clipShadows: true, side: THREE.DoubleSide });
  const wallM = mk(wallsPlane), decoM = mk(decoPlane, texS), darkM = std('#2a2420', { roughness: 1, clippingPlanes: [wallsPlane], clipShadows: true });
  const decoDark = std('#3a3028', { roughness: 1, clippingPlanes: [decoPlane], clipShadows: true });
  const W = g; // walls
  W.add(box(64, 1.5, 24, wallM, 0, 0.75, 0));
  W.add(box(56, 12, 16, wallM, 0, 7.5, -1));
  // arches on the front (dark recesses) with columns between
  for (let i = 0; i < 6; i++) {
    const x = -20 + i * 8, sh = new THREE.Shape(); sh.moveTo(-2, 0); sh.lineTo(-2, 4.5); sh.absarc(0, 4.5, 2, Math.PI, 0, true); sh.lineTo(2, 0); sh.lineTo(-2, 0);
    const a = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), darkM); a.position.set(x, 1.5, 7.02); W.add(a);
    W.add(cyl(0.7, 0.8, 7.5, wallM, 12, x + 4, 5.25, 7.4));
  }
  // terrace parapet with merlons
  W.add(box(56, 1.2, 16, wallM, 0, 14.1, -1));
  for (let x = -27; x <= 27; x += 3) W.add(box(1.4, 1.2, 1.2, wallM, x, 15.3, 6.6));
  // stairs up the right side
  for (let k = 0; k < 10; k++) W.add(box(4, 1.35, 1.6, wallM, 30.5, 0.7 + k * 1.35, 5 - k * 1.5));
  // deco: towers
  const twr = (x, z, r, h, cap) => { const t = new THREE.Group(); t.position.set(x, 13.5, z); g.add(t); t.add(cyl(r * 0.9, r, h, decoM, 16, 0, h / 2, 0)); if (cap === 'dome') { const d = sph(r * 1.05, decoM, 0, h, 0, 18); d.scale.y = 0.9; t.add(d); t.add(cyl(0.12, 0.2, 2, decoM, 8, 0, h + r * 1.2, 0)); } else { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.3, r * 2.4, 4), decoM); c.position.y = h + r * 1.2; c.rotation.y = Math.PI / 4; c.castShadow = true; t.add(c); } for (let k = 0; k < 3; k++) { const w = box(0.9, 1.6, 0.2, decoDark, 0, h * (0.3 + k * 0.25), r * 0.92); t.add(w); } return t; };
  twr(-22, -2, 3.6, 9, 'dome'); twr(-12, -4, 2.4, 6, 'dome'); twr(21, -3, 3.2, 12.5, 'cap'); twr(9, -5, 2.0, 7, 'dome');
  // deco: three giants on the platform in front of the centre (legs, robe, head, folded arms)
  for (const [x, s] of [[-5.5, 1], [0, 1.12], [5.5, 1]]) {
    const gi = new THREE.Group(); gi.position.set(x, 1.5, 10.2); gi.scale.setScalar(s); g.add(gi);
    gi.add(box(1.0, 4, 1.1, decoM, -0.7, 2, 0), box(1.0, 4, 1.1, decoM, 0.7, 2, 0));
    gi.add(cyl(1.5, 1.9, 5.5, decoM, 12, 0, 6.75, 0)); gi.add(box(3.6, 1.1, 1.4, decoM, 0, 7.8, 0.9));
    const hd = sph(1.25, decoM, 0, 10.3, 0, 16); hd.scale.set(0.95, 1.1, 0.95); gi.add(hd);
    gi.add(box(0.25, 0.25, 0.1, decoDark, -0.42, 10.5, 1.2), box(0.25, 0.25, 0.1, decoDark, 0.42, 10.5, 1.2));
  }
  // deco: animals on the terrace (an elephant, a deer) and an octopus on the left end
  const el = new THREE.Group(); el.position.set(-6, 15.3, 1); g.add(el);
  const eb = sph(2.4, decoM, 0, 2.6, 0, 16); eb.scale.set(1.4, 1, 1); el.add(eb); el.add(sph(1.5, decoM, 3.3, 3.4, 0, 14));
  const tr = cyl(0.35, 0.5, 3, decoM, 10, 4.4, 2, 0); tr.rotation.z = 0.35; el.add(tr);
  for (const [x, z] of [[-1.8, -1], [-1.8, 1], [1.6, -1], [1.6, 1]]) el.add(cyl(0.5, 0.55, 1.8, decoM, 10, x, 0.9, z));
  for (const z of [-1.2, 1.2]) { const ear = sph(1.0, decoM, 3.0, 3.6, z, 10); ear.scale.set(0.3, 1, 0.9); el.add(ear); }
  const dr = new THREE.Group(); dr.position.set(7, 15.3, 2.5); dr.rotation.y = -0.6; g.add(dr);
  dr.add(box(3.4, 1.4, 1.2, decoM, 0, 2.6, 0)); for (const [x, z] of [[-1.3, -0.4], [-1.3, 0.4], [1.3, -0.4], [1.3, 0.4]]) dr.add(box(0.3, 2, 0.3, decoM, x, 1, z));
  const nk = box(0.6, 1.8, 0.6, decoM, 1.8, 3.6, 0); nk.rotation.z = -0.4; dr.add(nk); dr.add(box(1.1, 0.6, 0.6, decoM, 2.3, 4.5, 0));
  for (const z of [-0.25, 0.25]) { const an = box(0.12, 1.4, 0.12, decoM, 2.0, 5.4, z); an.rotation.x = z * 1.2; dr.add(an); }
  const oc = new THREE.Group(); oc.position.set(-30.5, 1.5, 6); g.add(oc);
  const oh = sph(1.6, decoM, 0, 3.6, 0, 16); oh.scale.y = 1.2; oc.add(oh);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, t = cyl(0.25, 0.4, 2.6, decoM, 8, Math.cos(a) * 1.2, 1.3, Math.sin(a) * 1.2); t.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); oc.add(t); }
  // the carved line (shown close in one shot) on the platform face, left of the giants
  const line = label(7, 1.6, 1100, 250, (c, w, h) => { c.fillStyle = '#d8ccb0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7f6f5a'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16); SLAB(c, 'LET THOSE WHO CAN', w / 2, 82, 78, '#4a3b2a'); SLAB(c, 'DO BETTER, TRY', w / 2, 170, 78, '#4a3b2a'); }, { roughness: 0.9, clippingPlanes: [wallsPlane] });
  line.position.set(-13, 9.2, 7.03); W.add(line);
  const walls = (h) => { wallsPlane.constant = h; }, deco = (h) => { decoPlane.constant = h; };
  return { group: g, walls, deco, line: V(-13, 9.2, 7.03), height: 27 };
}

// ======================================================= the cemetery and tomb =======================================
export function cemetery(scene, renderer) {
  renderer.localClippingEnabled = true;
  const g = new THREE.Group(); g.position.copy(CEMETERY); scene.add(g);
  const wall = std('#c9c0aa', { roughness: 0.9, map: pebbleTex(41, 3) });
  g.add(box(60, 2.5, 1, wall, 0, 1.25, -30), box(1, 2.5, 60, wall, -30, 1.25, 0), box(1, 2.5, 60, wall, 30, 1.25, 0));
  const gravel = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), std('#c2b79f', { roughness: 1 })); gravel.rotation.x = -Math.PI / 2; gravel.position.y = 0.03; gravel.receiveShadow = true; g.add(gravel);
  const stoneM = std('#9a958a', { roughness: 0.8 });
  for (let i = 0; i < 18; i++) { const r = rng(500 + i), x = -24 + (i % 6) * 9 + (r() - 0.5), z = -22 + Math.floor(i / 6) * 9; if (Math.abs(x) < 8 && z > -14) continue; const hs = box(1.8, 2.2 + r() * 0.6, 0.4, stoneM, x, 1.2, z); g.add(hs); const top = cyl(0.9, 0.9, 0.4, stoneM, 16, x, 2.3 + r() * 0.3, z); top.rotation.x = Math.PI / 2; g.add(top); }
  cypresses(g, [[-26, -26], [26, -26], [-26, 10], [26, 10], [-14, -27], [14, -27]]);
  // the tomb: a pebble mosaic mausoleum with an arch, little columns and a dome, built up by clipping
  const plane = new THREE.Plane(V(0, -1, 0), 100), tm = std('#ffffff', { map: pebbleTex(23, 1.5), roughness: 0.85, clippingPlanes: [plane], clipShadows: true }), dk = std('#2a2420', { roughness: 1, clippingPlanes: [plane] });
  const t = new THREE.Group(); t.position.copy(TOMB).sub(CEMETERY); g.add(t);
  t.add(box(8, 1, 6, tm, 0, 0.5, 0), box(6.5, 5, 4.5, tm, 0, 3.5, 0));
  const sh = new THREE.Shape(); sh.moveTo(-1.2, 0); sh.lineTo(-1.2, 2.2); sh.absarc(0, 2.2, 1.2, Math.PI, 0, true); sh.lineTo(1.2, 0); sh.lineTo(-1.2, 0);
  const a = new THREE.Mesh(new THREE.ShapeGeometry(sh, 12), dk); a.position.set(0, 1, 2.27); t.add(a);
  for (const x of [-2.7, 2.7]) t.add(cyl(0.35, 0.4, 5, tm, 10, x, 3.5, 2.5));
  t.add(box(7.2, 0.8, 5.2, tm, 0, 6.4, 0)); const d = sph(2.2, tm, 0, 6.8, 0, 16); d.scale.y = 0.8; t.add(d);
  t.add(cyl(0.12, 0.15, 1.6, tm, 8, 0, 9.2, 0));
  const build = (h) => { plane.constant = h; };
  return { group: g, build, tombTop: 10 };
}

// ======================================================= props =======================================================
// Satchel: a leather mail bag on a strap, parented to the torso (left hip, strap over the right shoulder).
export function satchel() {
  const g = new THREE.Group(), lea = std('#7a4a26', { roughness: 0.6 });
  g.add(box(1.5, 1.2, 0.55, lea, 0, 0, 0)); g.add(box(1.52, 0.5, 0.58, std('#653c1e', { roughness: 0.6 }), 0, 0.38, 0.0));
  g.add(box(0.3, 0.2, 0.05, std('#d4af37', { metalness: 0.8, roughness: 0.3 }), 0, 0.2, 0.3));
  return g;
}
export function strap() { const s = box(0.22, 3.4, 0.08, std('#653c1e', { roughness: 0.6 })); s.castShadow = false; return s; }
// Basket: wicker, carried from the handle (origin at the top of the handle arc, where the fist holds it).
export function basket() {
  const g = new THREE.Group(), wick = std('#b88a4a', { roughness: 0.9 });
  const b = cyl(0.85, 0.65, 0.9, wick, 16, 0, -1.55, 0); g.add(b);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 6, 18, Math.PI), wick); h.position.y = -1.1; h.rotation.y = Math.PI / 2; g.add(h);
  for (let i = 0; i < 9; i++) { const r = rng(70 + i); g.add(sph(0.22 + r() * 0.12, std('#a99476', { roughness: 0.9, flatShading: true }), (r() - 0.5) * 1, -1.0 + r() * 0.15, (r() - 0.5) * 1, 6)); }
  return g;
}
// Wheelbarrow: tray, one wheel in front, two handles; origin midway between the handle grips (3.0 apart, at the back),
// facing +z (the wheel end). Its stones are a child group (shown when loaded).
export function wheelbarrow() {
  const g = new THREE.Group(), wood = std('#8a6440', { roughness: 0.85 }), iron = std('#3a3d42', { metalness: 0.5, roughness: 0.5 });
  for (const s of [-1, 1]) { const h = box(0.18, 0.18, 4.6, wood, s * 1.5, 0, 2.1); h.rotation.x = -0.12; g.add(h); }
  const tray = new THREE.Group(); tray.position.set(0, -0.3, 2.6); g.add(tray);
  tray.add(box(2.6, 0.15, 2.4, wood, 0, -0.2, 0)); for (const s of [-1, 1]) tray.add(box(0.15, 1.0, 2.4, wood, s * 1.3, 0.3, 0));
  tray.add(box(2.6, 1.0, 0.15, wood, 0, 0.3, 1.2)); tray.add(box(2.6, 1.0, 0.15, wood, 0, 0.3, -1.2));
  const wheel = new THREE.Group(); wheel.position.set(0, -1.35, 4.4); g.add(wheel);
  const tyre = cyl(0.75, 0.75, 0.25, iron, 16); tyre.rotation.z = Math.PI / 2; wheel.add(tyre); const hub = cyl(0.2, 0.2, 0.3, wood, 8); hub.rotation.z = Math.PI / 2; wheel.add(hub);
  for (const s of [-1, 1]) g.add(box(0.12, 1.4, 0.12, iron, s * 1.1, -1.2, 1.8));
  const load = new THREE.Group(); tray.add(load);
  for (let i = 0; i < 14; i++) { const r = rng(90 + i); load.add(sph(0.28 + r() * 0.18, std('#a99476', { roughness: 0.9, flatShading: true }), (r() - 0.5) * 2, 0.25 + r() * 0.5, (r() - 0.5) * 1.9, 6)); }
  g.userData = { wheel, load, groundDrop: 2.1 };            // the wheel touches the ground 2.1 below the handle grips
  return g;
}
export function souvenirStand() {
  const g = new THREE.Group(), wood = std('#9a6a3d', { roughness: 0.8 });
  g.add(box(6, 0.3, 2.4, wood, 0, 3.0, 0)); for (const [x, z] of [[-2.8, -1], [2.8, -1], [-2.8, 1], [2.8, 1]]) g.add(box(0.25, 3, 0.25, wood, x, 1.5, z));
  g.add(box(6, 0.2, 2.4, std('#d84b3a', { roughness: 0.6 }), 0, 6.2, 0)); for (const x of [-2.8, 2.8]) g.add(box(0.2, 3.2, 0.2, wood, x, 4.6, -1));
  const sg = label(5.4, 1.2, 800, 180, (c, w, h) => { c.fillStyle = '#fff3d6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d84b3a'; c.lineWidth = 10; c.strokeRect(6, 6, w - 12, h - 12); LG(c, 'SOUVENIRS', w / 2, h / 2 + 6, 110, '#d84b3a'); });
  sg.position.set(0, 5.4, -0.95); sg.rotation.y = Math.PI; g.add(sg); const sg2 = sg.clone(); sg2.rotation.y = 0; sg2.position.z = 1.15; g.add(sg2);
  const card = canvasTexture(256, 180, (c, w, h) => { c.fillStyle = '#fbf8ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#7fb3e6'; c.fillRect(10, 10, w - 20, h - 50); c.fillStyle = '#c9b48c'; c.fillRect(30, 70, w - 60, 70); c.fillStyle = '#b39b74'; c.fillRect(50, 40, 30, 40); c.fillRect(170, 30, 26, 50); LG(c, 'GREETINGS!', w / 2, h - 20, 30, '#c8202b'); });
  for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), std('#ffffff', { map: card, roughness: 0.6 })); p.position.set(-2.4 + (i % 4) * 1.4, 3.6 + Math.floor(i / 4) * 0.85, 1.18); p.rotation.x = -0.15; g.add(p); }
  return g;
}
