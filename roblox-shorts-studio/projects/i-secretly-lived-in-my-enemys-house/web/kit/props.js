// kit-props: every hand-held or worn prop of "I Secretly Lived In My Enemy's House" (makeProp), and the helpers that
// put them in hands (hold, carry2), on heads (wearOnHead), on wrists (wearWrist) and on tables (place).
//
// Conventions (all props): units are studs at real size for the cast (characters ~5 studs tall, a fist is 1 stud);
// +y up, the prop's front faces +z, the origin is the GRIP (the point that sits in the palm). userData:
//   id, bottom (local point that rests on a table, for place()), handles {L, R} (for carry2), holdDefaults
//   {mode: opts | (hand) => opts}, plus per-prop switches (setOn, setGlow, setCount, ...) documented in web/kit/README.md.
//
// Hand frames (measured on the pack mesh; the arm bone hangs at rest, -y down the arm, +z the character's front):
//   palm: grip V(sd === 'R' ? -0.5 : 0.5, -1.3, 0) * scale, rotated Rx(90) so the prop's +z points out of the fist along
//         the arm and its +y is the arm's front (world up when the arm is raised forward) - for aiming / holding out.
//   out:  the same rotation just past the fist at (-+0.5, -1.75, 0) * scale - for things held up in front of a raised arm.
//   side: the grip with no rotation (prop +y up the arm, +z forward) - for things carried at the side with the arm down.
//   hug:  on the torso front (teddy), the arms posed by the chapter.
// opts.level keeps the prop upright (world +y) facing along the arm (or the actor's heading when the arm hangs).
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { mat, roundedBox, roundedCylinder } from '../../../../web/lib/rig.js';
import { canvasTexture } from '../../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const M = (hex, rough = 0.55, extra = {}) => mat(hex.replace('#', ''), rough, extra);
const glowMat = (hex, k = 2.2) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, roughness: 0.35 });
function add(parent, geo, m, p = [0, 0, 0], r = [0, 0, 0], s) {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); if (s) o.scale.set(...s);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
const box = (w, h, d, r = 0.03) => roundedBox(w, h, d, r);
const cyl = (rt, rb, h, n = 24) => new THREE.CylinderGeometry(rt, rb, h, n);
const sph = (r, n = 20) => new THREE.SphereGeometry(r, n, Math.max(8, n * 0.7 | 0));
const group = (id) => { const g = new THREE.Group(); g.name = id; return g; };
// deterministic noise for crumpled things
function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5 | 0), ((s ^ (s >>> 14)) >>> 0) / 4294967296); }
function crumple(geo, amt, seed = 3) {
  const r = rnd(seed), p = geo.attributes.position, v = new THREE.Vector3(), cache = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const k = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!cache.has(k)) cache.set(k, 1 + (r() - 0.5) * 2 * amt);
    v.multiplyScalar(cache.get(k)); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// smooth cloth folds: radial ripples (vertical creases) plus a soft lumpy wobble
function folds(geo, amt, seed = 1) {
  const p = geo.attributes.position, v = new THREE.Vector3(), r = rnd(seed), ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const a = Math.atan2(v.x, v.z);
    const k = 1 + amt * (Math.sin(a * 7 + ph[0] + v.y * 2) * 0.6 + Math.sin(a * 3 + ph[1] - v.y * 3) * 0.5 + Math.sin(v.y * 9 + ph[2]) * 0.3);
    p.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  geo.computeVertexNormals(); return geo;
}

// ---------- fonts (magnet letters) ----------
const FONT = await new FontLoader().loadAsync(new URL('../../../../web/node_modules/three/examples/fonts/helvetiker_bold.typeface.json', import.meta.url).href);
export const LETTER_COLORS = ['#e8413c', '#2f7de1', '#f6c22b', '#3bb54a', '#f07c1e', '#9b59d0'];
const letterGeo = new Map();
// One fridge magnet letter, standing up, front +z, origin at its bottom-centre back (the face that touches the fridge).
// Size 0.42 studs tall. Sets may use it for the fridge door.
export function magnetLetter(ch, color = LETTER_COLORS[ch.charCodeAt(0) % LETTER_COLORS.length], size = 0.42) {
  const key = ch + size;
  if (!letterGeo.has(key)) {
    const g = new TextGeometry(ch, { font: FONT, size, depth: 0.07, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 });
    g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -b.min.z); letterGeo.set(key, g);
  }
  const g = group('letter_' + ch); add(g, letterGeo.get(key), M(color, 0.35, { clearcoat: 0.6, clearcoatRoughness: 0.25 }));
  g.userData = { id: 'magnet_letter', ch, color }; return g;
}

// ---------- canvas decals ----------
function textTex(w, h, draw) { return canvasTexture(w, h, draw); }
const decal = (tex, w, h, extra = {}) => { const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true, ...extra }); return [new THREE.PlaneGeometry(w, h), m]; };

// ---------- flashlight ----------
// Max's: dark-grey metal torch, 1.25 long. { pink: true } (or id flashlight_small): Skye's small pink one, 0.85 long.
// { beam: true } adds a soft visible cone (length opts.beamLength, default 12); { light: true } adds a SpotLight.
// setOn(on) switches lens glow, cone and light. The grip is the middle of the body; the beam points +z.
function flashlight(o = {}) {
  const small = o.pink || o.small, g = group('flashlight'), k = small ? 0.68 : 1;
  const body = M(small ? '#ff7fbf' : '#2d323c', small ? 0.4 : 0.3, small ? { clearcoat: 0.6 } : { metalness: 0.6 });
  const trim = M(small ? '#ffffff' : '#9aa2ad', 0.3, { metalness: 0.7 });
  add(g, roundedCylinder(0.15 * k, 1.0 * k, 0.03), body, [0, 0, 0.05 * k], [Math.PI / 2, 0, 0]);
  add(g, cyl(0.26 * k, 0.16 * k, 0.32 * k), body, [0, 0, 0.71 * k], [Math.PI / 2, 0, 0]);
  add(g, new THREE.TorusGeometry(0.25 * k, 0.03 * k, 8, 28), trim, [0, 0, 0.87 * k]);
  add(g, box(0.09 * k, 0.06 * k, 0.18 * k, 0.02), M(small ? '#ffffff' : '#d23b2f', 0.4), [0, 0.15 * k, 0.15 * k]);
  add(g, cyl(0.155 * k, 0.155 * k, 0.05 * k), trim, [0, 0, -0.45 * k], [Math.PI / 2, 0, 0]);
  const lensOn = glowMat('#fff3c9', 3.2), lensOff = M('#cfd6dd', 0.15, { transmission: 0, metalness: 0.2 });
  const lens = add(g, new THREE.CircleGeometry(0.235 * k, 28), lensOn, [0, 0, 0.875 * k]); lens.castShadow = false;
  const L = o.beamLength ?? (small ? 7 : 12), R = o.beamRadius ?? L * 0.24;
  const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(o.beamColor ?? '#ffe7b0') }, strength: { value: o.beamStrength ?? 0.22 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 color; uniform float strength; varying vec2 vUv; varying vec3 vN, vV; void main(){ float along = pow(vUv.y, 1.4); float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.5); gl_FragColor = vec4(color * strength * along * edge, 1.); }',
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(R, L, 40, 1, true), coneMat);
  cone.rotation.x = -Math.PI / 2; cone.position.z = 0.88 * k + L / 2; cone.castShadow = cone.receiveShadow = false; cone.renderOrder = 5;
  cone.visible = !!o.beam; g.add(cone);
  let spot = null;
  if (o.light) {
    spot = new THREE.SpotLight(o.beamColor ?? '#ffe2a8', o.intensity ?? 40, o.lightDistance ?? 40, o.angle ?? 0.38, 0.55, 1.6);
    spot.position.set(0, 0, 0.9 * k); spot.target.position.set(0, 0, 6); g.add(spot, spot.target); spot.castShadow = !!o.shadow;
  }
  g.userData = {
    beam: cone, lens, spot, on: o.on ?? true, bottom: V(0, 0, -0.475 * k), // standing on its tail: rotation.x = -PI/2, place() handles it
    setOn(on) { g.userData.on = on; lens.material = on ? lensOn : lensOff; cone.visible = on && g.userData.beamWanted; if (spot) spot.visible = on; },
    setBeam(on) { g.userData.beamWanted = on; cone.visible = on && g.userData.on; },
    beamWanted: !!o.beam,
  };
  g.userData.setOn(g.userData.on);
  return g;
}

// ---------- lunchbox ----------
// Skye's lilac lunchbox with a pink cloud sticker, 1.3 x 0.9 x 0.6, handle on top (the grip, bar along x).
// { open: true } lid hinged back, the crustless sandwich inside ({ sandwich: false } to empty it, { spider: true } adds
// the rubber spider on the sandwich). userData.setOpen(a) with a in 0..1; userData.sandwich / .spider are the contents.
function lunchbox(o = {}) {
  const g = group('lunchbox'), W = 1.3, H = 0.85, D = 0.62, top = -0.26; // box top 0.26 below the grip
  const shell = M('#b89cf0', 0.38, { clearcoat: 0.5, clearcoatRoughness: 0.3 }), inner = M('#eee6ff', 0.6);
  const base = new THREE.Group(); base.position.y = top - H; g.add(base);
  add(base, box(W, H * 0.78, D, 0.08), shell, [0, H * 0.39, 0]);
  add(base, box(W - 0.1, 0.02, D - 0.1, 0.005), inner, [0, H * 0.78 - 0.02, 0]);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, H * 0.78, -D / 2); base.add(lidPivot);
  add(lidPivot, box(W, H * 0.22, D, 0.07), shell, [0, H * 0.11, D / 2]);
  add(lidPivot, box(0.2, 0.08, 0.06, 0.02), M('#ffffff', 0.4), [0, 0.02, D + 0.01]); // latch
  const sticker = textTex(256, 160, (x, w, h) => {
    x.fillStyle = '#ff8fc6'; for (const [cx, cy, r] of [[86, 96, 40], [130, 72, 52], [176, 96, 40], [128, 110, 34]]) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
    x.fillStyle = '#ffffff'; x.font = 'bold 30px "Luckiest Guy", sans-serif'; x.textAlign = 'center'; x.fillText('SKYE', 130, 108);
  });
  add(base, ...decal(sticker, 0.7, 0.44), [0, H * 0.4, D / 2 + 0.006]);
  // handle (grip): a rounded bar along x on two posts
  const hm = M('#7d5fd1', 0.4);
  add(g, roundedCylinder(0.075, 0.62, 0.03), hm, [0, 0, 0], [0, 0, Math.PI / 2]);
  for (const s of [-1, 1]) add(g, box(0.1, 0.3, 0.12, 0.03), hm, [s * 0.3, -0.13, 0]);
  const contents = new THREE.Group(); contents.position.y = H * 0.78 - 0.02; base.add(contents);
  const sw = sandwich({ crusts: false, filling: 'jam' }); sw.rotation.y = 0.15; sw.position.set(-0.1, 0.0, 0.16); sw.userData.place = true;
  // the sandwich's grip is its back edge; sit it centred on the floor of the box
  sw.position.add(V(0, -sw.userData.bottom.y, -sw.userData.center.z)); sw.visible = o.sandwich ?? true; contents.add(sw);
  const sp = rubberSpider(); sp.position.set(0.12, 0.22, 0.05); sp.rotation.y = 0.7; sp.visible = !!o.spider; contents.add(sp);
  contents.visible = false;
  g.userData = {
    lid: lidPivot, sandwich: sw, spider: sp, bottom: V(0, top - H, 0),
    setOpen(a) { lidPivot.rotation.x = -1.95 * a; contents.visible = a > 0.05; },
    holdDefaults: { side: (hand) => ({ rot: [0, hand === 'R' ? -Math.PI / 2 : Math.PI / 2, 0] }), palm: { level: true } },
  };
  g.userData.setOpen(o.open ? 1 : 0);
  return g;
}

// ---------- rubber spider ----------
// Black rubber spider, 0.9 across the legs, red eyes. The grip is a pinch on its back (origin at the top of the body).
function rubberSpider() {
  const g = group('rubber_spider'), rub = M('#16161b', 0.45, { clearcoat: 0.8, clearcoatRoughness: 0.2 });
  add(g, sph(0.17), rub, [0, -0.17, -0.06], [0, 0, 0], [1, 0.8, 1.15]);
  add(g, sph(0.11), rub, [0, -0.17, 0.17]);
  for (const s of [-1, 1]) add(g, sph(0.025, 8), glowMat('#ff2a2a', 1.2), [s * 0.045, -0.12, 0.26]);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const a = (-0.75 + i * 0.5), up = new THREE.Group(); up.position.set(s * 0.1, -0.17, 0.04 - i * 0.07); up.rotation.set(0, s > 0 ? -a : Math.PI + a, 0); g.add(up);
    add(up, cyl(0.022, 0.022, 0.3, 8), rub, [0.14, 0.06, 0], [0, 0, -1.15]);
    add(up, cyl(0.02, 0.012, 0.32, 8), rub, [0.36, -0.03, 0], [0, 0, 0.75]);
  }
  g.userData = { bottom: V(0, -0.36, 0) };
  return g;
}

// ---------- spatula ----------
// Black handle, steel slotted blade; 1.5 long. Grip mid-handle, blade forward (+z) and tilted down a little.
function spatula() {
  const g = group('spatula'), black = M('#1d1d22', 0.5), steel = M('#c9ced6', 0.25, { metalness: 0.85 });
  add(g, roundedCylinder(0.065, 0.9, 0.03), black, [0, 0, 0.12], [Math.PI / 2, 0, 0]);
  add(g, cyl(0.025, 0.025, 0.36), steel, [0, -0.02, 0.58], [Math.PI / 2 + 0.12, 0, 0]);
  const blade = new THREE.Group(); blade.position.set(0, -0.06, 0.78); blade.rotation.x = 0.18; g.add(blade);
  add(blade, box(0.42, 0.025, 0.5, 0.01), steel, [0, 0, 0.25]);
  for (const x of [-0.11, 0, 0.11]) add(blade, box(0.04, 0.03, 0.28, 0.01), M('#3a3d44', 0.4), [x, 0.002, 0.24]);
  g.userData = { bottom: V(0, -0.07, 0) };
  return g;
}

// ---------- pancakes ----------
const PANCAKE_R = 0.42, PANCAKE_H = 0.09;
function pancakeMesh(seed = 1) {
  const g = group('pancake'), r = rnd(seed);
  const geo = roundedCylinder(PANCAKE_R * (0.96 + r() * 0.08), PANCAKE_H, 0.035, 40);
  add(g, geo, M('#d9a050', 0.7), [0, PANCAKE_H / 2, 0]);
  add(g, new THREE.CircleGeometry(PANCAKE_R * 0.83, 36), M('#b8742c', 0.75), [0, PANCAKE_H + 0.001, 0], [-Math.PI / 2, 0, 0]);
  return g;
}
// pancake: one, origin at its centre bottom (pinch it at the edge with opts.grip = 'edge').
function pancake(o = {}) {
  const g = group('pancake'), p = pancakeMesh(o.seed ?? 7); g.add(p);
  if (o.grip === 'edge') p.position.z = PANCAKE_R + 0.12;
  g.userData = { bottom: V(0, 0, o.grip === 'edge' ? PANCAKE_R + 0.12 : 0), holdDefaults: { palm: { level: true }, out: { level: true } } };
  return g;
}
// pancake_stack { count = 12, plate = true, butter = false, syrup = false }: on a white plate; setCount(n) hides from the
// top down (12 -> 11 when Skye takes one). userData.top(): world position of the top pancake's centre. Origin: plate bottom.
function pancakeStack(o = {}) {
  const g = group('pancake_stack'), n = o.count ?? 12, base = o.plate === false ? 0 : 0.07;
  if (o.plate !== false) g.add(plate({ size: 'big' }).children[0].clone());
  const cakes = [];
  for (let i = 0; i < Math.max(n, o.max ?? n); i++) {
    const p = pancakeMesh(i * 13 + 5); p.position.set(Math.sin(i * 2.3) * 0.025, base + i * PANCAKE_H * 0.92, Math.cos(i * 1.7) * 0.025); p.rotation.y = i; g.add(p); cakes.push(p);
  }
  const butter = add(g, box(0.16, 0.08, 0.16, 0.02), M('#ffe9a0', 0.4), [0, 0, 0]); butter.visible = !!o.butter;
  const syr = add(g, new THREE.CircleGeometry(0.3, 24), M('#7a3d10', 0.15, { clearcoat: 1 }), [0, 0, 0], [-Math.PI / 2, 0, 0]); syr.visible = !!o.syrup;
  g.userData = {
    cakes, bottom: V(0, 0, 0),
    setCount(k) {
      cakes.forEach((c, i) => { c.visible = i < k; }); const y = base + k * PANCAKE_H * 0.92 + 0.002;
      butter.position.y = y + 0.04; syr.position.y = y; g.userData.count = k;
    },
    top() { g.updateMatrixWorld(true); const c = cakes[Math.max(0, g.userData.count - 1)]; return c.localToWorld(V(0, PANCAKE_H / 2, 0)); },
  };
  g.userData.setCount(n);
  return g;
}

// ---------- magnet letters in a hand ----------
// magnet_letters { letters = 'BENICE' }: a fanned handful, faces +z. Origin in the fist; the letters stand out above it.
function magnetLetters(o = {}) {
  const g = group('magnet_letters'), s = (o.letters ?? 'BENICE').replace(/\s/g, ''), n = s.length;
  [...s].forEach((ch, i) => {
    const l = magnetLetter(ch, LETTER_COLORS[i % LETTER_COLORS.length], 0.36); const a = (i - (n - 1) / 2) * 0.32;
    l.position.set(Math.sin(a) * 0.32, 0.18 + Math.cos(a) * 0.12 - 0.12, 0.05 + i * 0.012); l.rotation.set(-0.15, 0, -a); g.add(l);
  });
  g.userData = { letters: s, bottom: V(0, 0, 0), holdDefaults: { palm: { level: true, offset: [0, 0.05, 0.3] }, out: { level: true } } };
  return g;
}

// ---------- plate ----------
// White plate, 1.5 across. { with: 'sandwich' | 'ham_sandwich' | 'pancakes' | 'crumbs' | null, size: 'big' }.
// Origin: bottom centre; handles at the left/right rim for carry2 (L = +x, the holder's left).
function plate(o = {}) {
  const g = group('plate'), R = o.size === 'big' ? 0.85 : 0.72;
  const pts = [V(0, 0, 0), V(R * 0.6, 0, 0), V(R * 0.66, 0.035, 0), V(R * 0.72, 0.03, 0), V(R, 0.08, 0), V(R + 0.015, 0.1, 0), V(R - 0.03, 0.1, 0), V(R * 0.7, 0.055, 0), V(0, 0.05, 0)].map((v) => new THREE.Vector2(v.x, v.y));
  const p = add(g, new THREE.LatheGeometry(pts, 48), M('#f6f6f2', 0.25, { clearcoat: 0.8, clearcoatRoughness: 0.15 }));
  p.name = 'plate_body';
  add(g, new THREE.TorusGeometry(R * 0.84, 0.008, 6, 48), M('#7fb3e8', 0.3), [0, 0.072, 0], [Math.PI / 2, 0, 0]);
  const what = o.with ?? null;
  if (what === 'sandwich' || what === 'ham_sandwich') {
    for (const [i, x] of [[0, -0.2], [1, 0.22]]) {
      const s = sandwich({ crusts: false, half: true, filling: what === 'ham_sandwich' ? 'ham' : (o.filling ?? 'ham') });
      s.position.set(x, 0.055 - s.userData.bottom.y, -s.userData.center.z); s.rotation.y = i ? 0.25 : -0.2; g.add(s);
    }
  } else if (what === 'pancakes') { for (let i = 0; i < (o.count ?? 3); i++) { const c = pancakeMesh(i + 3); c.position.y = 0.055 + i * PANCAKE_H * 0.92; g.add(c); } }
  else if (what === 'crumbs') { const r = rnd(4); for (let i = 0; i < 9; i++) add(g, box(0.05, 0.03, 0.04, 0.01), M('#e8d6b0', 0.8), [(r() - 0.5) * 0.8, 0.065, (r() - 0.5) * 0.8], [0, r() * 3, 0]); }
  g.userData = {
    bottom: V(0, 0, 0), handles: { L: V(R - 0.02, 0.06, 0), R: V(-R + 0.02, 0.06, 0) },
    holdDefaults: { palm: { level: true, offset: [0, -0.08, R - 0.15] }, out: { level: true, offset: [0, 0, R - 0.2] } },
  };
  return g;
}

// ---------- sandwich ----------
// White bread, 0.72 square. { crusts: false (default: Skye's way, no crusts), filling: 'ham' | 'jam' | 'cheese',
// half: false (half = cut down the middle), bitten: 0 (number of bites out of the front edge, 'half_eaten' = 3) }.
// The grip is the back edge (pinched), the sandwich lies flat pointing +z. userData.center: local centre.
function breadShape(w, d, bites, seed) {
  const s = new THREE.Shape(), r = rnd(seed);
  s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2);
  if (bites > 0) {
    // bites along the front edge (+z in the final prop), right to left
    const br = Math.min(0.17, w / (bites * 1.7)), xs = Array.from({ length: bites }, (_, i) => w / 2 - br * 0.9 - i * br * 1.55);
    let x = w / 2;
    for (const cx of xs) {
      s.lineTo(Math.min(x, cx + br), d / 2);
      const steps = 7; for (let k = 1; k < steps; k++) { const a = Math.PI * k / steps; s.lineTo(cx + Math.cos(a) * br, d / 2 - Math.sin(a) * br * (0.8 + r() * 0.3)); }
      x = cx - br;
    }
    s.lineTo(x, d / 2);
  }
  s.lineTo(-w / 2, d / 2); s.lineTo(-w / 2, -d / 2);
  return s;
}
function sandwich(o = {}) {
  const g = group('sandwich'), crusts = !!o.crusts, half = !!o.half, bites = o.bitten === 'half_eaten' ? 3 : (o.bitten ?? 0);
  const w = half ? 0.36 : 0.72, d = 0.72, t = 0.085;
  const inner = new THREE.Group(); inner.position.z = d / 2 + 0.16; g.add(inner); // back edge just past the grip
  const shape = breadShape(w, d, bites, 9);
  const slab = (thick) => { const e = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 }); e.rotateX(Math.PI / 2); e.translate(0, thick, 0); return e; };
  const bread = M('#f5e6c4', 0.85), crustM = M('#b9772f', 0.8);
  const filling = { ham: '#f0a3a8', jam: '#b3263a', cheese: '#f7c844' }[o.filling ?? 'ham'];
  add(inner, slab(t), bread, [0, 0, 0]);
  add(inner, slab(0.035), M(filling, 0.5), [0, t, 0], [0, 0, 0], [0.97, 1, 0.97]);
  if ((o.filling ?? 'ham') === 'ham') add(inner, slab(0.012), M('#9ccf5a', 0.6), [0, t + 0.035, 0], [0, 0, 0], [0.99, 1, 0.99]);
  add(inner, slab(t), bread, [0, t + 0.047, 0]);
  if (crusts) for (const [x, z, ww, dd] of [[0, -d / 2, w, 0.05], [w / 2, 0, 0.05, d], [-w / 2, 0, 0.05, d], ...(bites ? [] : [[0, d / 2, w, 0.05]])]) add(inner, box(ww + 0.03, t * 2 + 0.06, dd + 0.03, 0.02), crustM, [x, t + 0.02, z]);
  if (bites) { const r = rnd(2); for (let i = 0; i < 5; i++) add(inner, box(0.03, 0.02, 0.03, 0.005), bread, [(r() - 0.5) * w * 0.8, -0.005, d / 2 + 0.05 + r() * 0.1]); }
  inner.position.y = -t; // filling at the grip height
  g.userData = { bottom: V(0, -t, 0), center: V(0, 0, d / 2 + 0.16), holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } } };
  return g;
}

// ---------- cookie ----------
// Big chocolate-chip cookie, 0.62 across; { bitten: n }. Grip at the back edge, lying flat (level) - or held up facing +z
// with { upright: true }.
function cookie(o = {}) {
  const g = group('cookie'), R = 0.31, h = 0.07, inner = new THREE.Group(); g.add(inner);
  const s = new THREE.Shape(); const r = rnd(5), bites = o.bitten ?? 0;
  for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; let rr = R * (0.97 + r() * 0.05); if (bites && Math.cos(a - Math.PI / 2) > 0.85) rr *= 0.72; const p = [Math.cos(a) * rr, Math.sin(a) * rr]; i ? s.lineTo(...p) : s.moveTo(...p); }
  const e = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); e.rotateX(-Math.PI / 2);
  add(inner, e, M('#d49a4e', 0.8));
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = r() * R * 0.75; add(inner, box(0.06, 0.04, 0.06, 0.015), M('#3e2414', 0.6), [Math.cos(a) * d, h + 0.02, -Math.sin(a) * d], [0, a, 0]); }
  if (o.upright) { inner.rotation.x = Math.PI / 2; inner.position.set(0, R + 0.05, 0.05); }
  else inner.position.set(0, -h / 2, R + 0.2);
  g.userData = { bottom: o.upright ? V(0, -0.05, 0.05) : V(0, -h / 2 - 0.02, R + 0.2), center: V(0, 0, R + 0.2), holdDefaults: { palm: { level: true }, out: { level: true } } };
  return g;
}

// ---------- cobweb ----------
// A wisp of grey-white web, 0.7 across, slightly cupped, for Skye's hair (Ch4): wearOnHead(web, skye, { spot: 'left' }).
function cobweb(o = {}) {
  const g = group('cobweb');
  const tex = textTex(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(245,245,250,0.95)'; x.lineWidth = 4; x.lineCap = 'round';
    const cx = 128, cy = 128, r = rnd(11), spokes = 9;
    const ang = Array.from({ length: spokes }, (_, i) => i / spokes * TAU + r() * 0.3);
    for (const a of ang) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 124, cy + Math.sin(a) * 124); x.stroke(); }
    for (let k = 1; k <= 6; k++) { x.beginPath(); ang.forEach((a, i) => { const rr = k * 19 + r() * 6; const p = [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; i ? x.quadraticCurveTo(cx + Math.cos(a - 0.35) * rr * 0.85, cy + Math.sin(a - 0.35) * rr * 0.85, ...p) : x.moveTo(...p); }); x.closePath(); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 1; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(r() * w, r() * h); x.lineTo(r() * w, r() * h); x.stroke(); }
  });
  const geo = new THREE.PlaneGeometry(0.95, 0.95, 8, 8), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -(x * x + y * y) * 0.2); }
  geo.computeVertexNormals();
  const m = add(g, geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, roughness: 0.9, depthWrite: false }));
  m.castShadow = false; m.renderOrder = 3;
  g.userData = { bottom: V(0, 0, 0) };
  return g;
}

// ---------- teddy ----------
// Lily's brown teddy, 1.25 tall, cream muzzle and tummy, a red bow. Origin at the grip = the top of its raised left paw
// (held hanging in Lily's hand: hold(teddy, lily, 'L', 'side')); 'hug' mode sits it on her chest, facing out.
// { pose: 'sit' } builds it sitting (legs forward) for tables and laps; place() puts its bottom down.
function teddy(o = {}) {
  const g = group('teddy'), fur = M(o.fur ?? '#8a5a34', 0.95, { sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(o.sheen ?? '#c79a6b') }), cream = M(o.cream ?? '#e9cfa6', 0.9);
  const b = new THREE.Group(); g.add(b); // teddy body frame: origin at its seat, facing +z
  add(b, sph(0.3), fur, [0, 0.36, 0], [0, 0, 0], [1, 1.12, 0.88]);
  add(b, sph(0.2), cream, [0, 0.34, 0.14], [0, 0, 0], [1, 1.15, 0.5]);
  add(b, sph(0.27), fur, [0, 0.88, 0.02]);
  for (const s of [-1, 1]) { add(b, sph(0.1), fur, [s * 0.2, 1.1, 0], [0, 0, 0], [1, 1, 0.6]); add(b, sph(0.055), cream, [s * 0.2, 1.1, 0.04], [0, 0, 0], [1, 1, 0.5]); }
  add(b, sph(0.12), cream, [0, 0.82, 0.24], [0, 0, 0], [1.1, 0.85, 0.8]);
  add(b, sph(0.04), M('#1b1210', 0.3, { clearcoat: 1 }), [0, 0.86, 0.34], [0, 0, 0], [1.3, 1, 1]);
  for (const s of [-1, 1]) add(b, sph(0.042), M('#0d0a09', 0.15, { clearcoat: 1 }), [s * 0.1, 0.96, 0.25]);
  add(b, new THREE.TorusGeometry(0.035, 0.012, 6, 16, Math.PI), M('#1b1210', 0.5), [0, 0.77, 0.32], [0, 0, Math.PI]);
  const bow = new THREE.Group(); bow.position.set(0, 0.65, 0.2); b.add(bow);
  for (const s of [-1, 1]) add(bow, new THREE.ConeGeometry(0.08, 0.16, 12), M(o.bow ?? '#e03045', 0.5), [s * 0.08, 0, 0], [0, 0, s * Math.PI / 2]);
  add(bow, sph(0.045), M(o.bow ?? '#e03045', 0.5));
  const limb = (x, y, z, rx, rz, len = 0.32) => { const l = add(b, new THREE.CapsuleGeometry(0.09, len, 6, 12), fur, [x, y, z], [rx, 0, rz]); return l; };
  const sit = o.pose === 'sit';
  limb(-0.27, 0.48, 0.02, 0, -0.5);                       // right arm, relaxed
  const raised = !sit && o.hold !== false;
  if (raised) limb(0.24, 0.72, 0, 0, Math.PI - 0.25, 0.3); // left arm raised (the grip)
  else limb(0.27, 0.48, 0.02, 0, 0.5);
  for (const s of [-1, 1]) {
    if (sit) { limb(s * 0.15, 0.1, 0.2, Math.PI / 2, 0, 0.26); add(b, sph(0.085), cream, [s * 0.15, 0.1, 0.42], [0, 0, 0], [1, 1, 0.4]); }
    else limb(s * 0.15, 0.05, 0.01, 0, 0, 0.26);
  }
  if (raised) b.position.set(-0.29, -1.0, 0.12); // paw top at the origin, the body hanging outward of a right hand
  g.userData = {
    bottom: sit ? V(0, 0.01, 0) : raised ? V(-0.29, -1.18, 0.12) : V(0, -0.17, 0),
    holdDefaults: {
      side: (hand) => ({ mirror: hand === 'L', level: true }),
      palm: (hand) => ({ mirror: hand === 'L', level: true }),
      out: (hand) => ({ mirror: hand === 'L', level: true }),
    },
  };
  return g;
}

// ---------- tea set ----------
// teapot: toy teapot, white with pink spots, 0.6 tall. Grip = the handle (at -z); spout +z. tip(a) pours by rotating
// about its x axis (call after hold). cup: toy teacup ({ saucer: true } on a saucer, for the table), handle at the grip, the
// cup in front of the fist (+z).
function spotsTex(base, spot) {
  return textTex(256, 128, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); x.fillStyle = spot; const r = rnd(8); for (let i = 0; i < 22; i++) { x.beginPath(); x.arc(r() * w, 20 + r() * (h - 40), 6 + r() * 4, 0, TAU); x.fill(); } });
}
function teapot() {
  const g = group('teapot'), china = new THREE.MeshPhysicalMaterial({ map: spotsTex('#fbf6f8', '#ff8fc0'), roughness: 0.25, clearcoat: 0.9 }), pink = M('#ff8fc0', 0.3, { clearcoat: 0.8 });
  const pot = new THREE.Group(); pot.position.set(0, -0.12, 0.5); g.add(pot);
  add(pot, sph(0.26, 28), china, [0, 0.24, 0], [0, 0, 0], [1, 0.85, 1]);
  add(pot, cyl(0.14, 0.18, 0.05), pink, [0, 0.03, 0]);
  add(pot, cyl(0.15, 0.15, 0.05), pink, [0, 0.44, 0]);
  add(pot, sph(0.13, 20), china, [0, 0.45, 0], [0, 0, 0], [1, 0.45, 1]);
  add(pot, sph(0.045), pink, [0, 0.53, 0]);
  add(pot, cyl(0.035, 0.065, 0.32), china, [0, 0.33, 0.3], [0.85, 0, 0]);
  add(pot, new THREE.TorusGeometry(0.12, 0.03, 8, 20, Math.PI * 1.3), china, [0, 0.25, -0.28], [0, Math.PI / 2, Math.PI * 0.35]);
  g.userData = {
    pot, bottom: V(0, -0.12, 0.5),
    tip(a) { g.rotateX(a); },
    holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } },
  };
  return g;
}
function cup(o = {}) {
  const g = group('cup'), china = new THREE.MeshPhysicalMaterial({ map: spotsTex('#fbf6f8', '#ff8fc0'), roughness: 0.25, clearcoat: 0.9, side: THREE.DoubleSide });
  const c = new THREE.Group(); c.position.set(0, -0.1, 0.42); g.add(c);
  const pts = [[0, 0], [0.08, 0], [0.1, 0.02], [0.16, 0.1], [0.18, 0.2], [0.17, 0.2], [0.15, 0.11], [0.07, 0.04], [0, 0.04]].map(([x, y]) => new THREE.Vector2(x, y));
  add(c, new THREE.LatheGeometry(pts, 32), china);
  add(c, new THREE.CircleGeometry(0.15, 24), M('#c98a5a', 0.15, { clearcoat: 1 }), [0, 0.15, 0], [-Math.PI / 2, 0, 0]); // tea
  add(c, new THREE.TorusGeometry(0.06, 0.02, 8, 16), china, [0, 0.11, -0.19], [0, Math.PI / 2, 0]);
  if (o.saucer) add(c, new THREE.LatheGeometry([[0, -0.03], [0.25, -0.02], [0.27, 0.0], [0.25, 0], [0, -0.01]].map(([x, y]) => new THREE.Vector2(x, y)), 32), china);
  if (o.tea === false) c.children[1].visible = false;
  g.userData = { bottom: V(0, o.saucer ? -0.13 : -0.1, 0.42), holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } } };
  return g;
}

// ---------- hobby horse ----------
// Plush brown horse head with a yarn mane and red reins on a 3.4-stud stick. Authored upright (head up, facing +z),
// the grip 0.9 below the head. 'side' keeps it upright beside the holder; for "across her lap" rotate it flat with place().
function hobbyHorse() {
  const g = group('hobby_horse'), plush = M('#b5733f', 0.95, { sheen: 1, sheenColor: new THREE.Color('#e3b07a') }), wood = M('#c79a5b', 0.6), mane = M('#3a2416', 0.95);
  add(g, cyl(0.06, 0.06, 3.4, 12), wood, [0, -1.2, 0]);
  add(g, cyl(0.09, 0.09, 0.08, 12), M('#d33a2f', 0.5), [0, -2.9, 0]);
  const h = new THREE.Group(); h.position.set(0, 0.85, 0); g.add(h);
  add(h, new THREE.CapsuleGeometry(0.2, 0.36, 8, 16), plush, [0, 0, 0], [0.25, 0, 0]);       // neck
  add(h, new THREE.CapsuleGeometry(0.18, 0.4, 8, 16), plush, [0, 0.3, 0.22], [1.25, 0, 0]);  // head
  add(h, sph(0.17), M('#e8c9a0', 0.9), [0, 0.2, 0.5], [0, 0, 0], [1, 0.9, 0.9]);              // muzzle
  for (const s of [-1, 1]) {
    add(h, sph(0.05), M('#120c0a', 0.15, { clearcoat: 1 }), [s * 0.15, 0.42, 0.3]);
    add(h, new THREE.ConeGeometry(0.06, 0.18, 10), plush, [s * 0.1, 0.62, 0.05], [-0.2, 0, s * -0.25]);
    add(h, sph(0.025), M('#3b2418', 0.6), [s * 0.06, 0.25, 0.65]);
  }
  for (let i = 0; i < 9; i++) add(h, box(0.07, 0.16, 0.12, 0.03), mane, [0, 0.5 - i * 0.09, -0.12 - Math.sin(i / 8 * Math.PI) * 0.06], [-0.3, 0, 0]);
  add(h, new THREE.TorusGeometry(0.19, 0.022, 6, 24), M('#d33a2f', 0.5), [0, 0.24, 0.42], [0.35, 0, 0]);
  add(h, new THREE.TorusGeometry(0.35, 0.018, 6, 24, Math.PI), M('#d33a2f', 0.5), [0, 0.0, 0.2], [0, Math.PI / 2, Math.PI * 0.6]);
  add(g, cyl(0.075, 0.075, 0.6, 12), M('#2f4f9a', 0.6), [0, 0, 0]); // grip wrap
  g.userData = { bottom: V(0, -2.94, 0), holdDefaults: { side: { level: true }, palm: { level: true } } };
  return g;
}

// ---------- pumpkin bucket ----------
// Orange plastic jack-o'-lantern bucket, 1.0 across, black handle. Origin = the top of the handle (the grip); the face
// is +z. Worn: wearOnHead(bucket, skye) turns it upside down over the crown (face right way up, rim at the brows,
// handle as a chin strap) and sizes it to the hair; opts { tilt } for crooked (before Max straightens it).
function pumpkinFace(upsideDown) {
  return textTex(1024, 256, (x, w, h) => {
    x.fillStyle = '#ff8a1c'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? 'rgba(200,80,0,0.18)' : 'rgba(255,190,90,0.12)'; x.fillRect(i * w / 16, 0, w / 32, h); }
    x.save(); if (upsideDown) { x.translate(w / 2, h / 2); x.rotate(Math.PI); x.translate(-w / 2, -h / 2); }
    x.fillStyle = '#1a1208'; const cx = w / 2;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 60, 70); x.lineTo(cx + s * 120, 120); x.lineTo(cx + s * 30, 125); x.closePath(); x.fill(); }
    x.beginPath(); x.moveTo(cx, 128); x.lineTo(cx + 18, 152); x.lineTo(cx - 18, 152); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(cx - 130, 170); x.quadraticCurveTo(cx, 250, cx + 130, 170); x.quadraticCurveTo(cx, 205, cx - 130, 170); x.fill();
    x.fillStyle = '#ff8a1c'; x.fillRect(cx - 45, 175, 22, 20); x.fillRect(cx + 25, 175, 22, 20);
    x.restore();
  });
}
function pumpkinBucket(o = {}) {
  const g = group('pumpkin_bucket'), R = 0.5, H = 0.72, up = !!o.worn;
  const prof = []; for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new THREE.Vector2(R * (0.72 + 0.28 * Math.sin(Math.PI * (0.15 + t * 0.8))) * (t === 0 ? 0 : 1), t * H)); }
  prof.push(new THREE.Vector2(prof.at(-1).x - 0.03, H));
  const geo = new THREE.LatheGeometry(prof, 64, Math.PI, TAU), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(x, z), k = 1 - 0.05 * Math.pow(Math.abs(Math.cos(a * 4)), 6); p.setX(i, x * k); p.setZ(i, z * k); }
  geo.computeVertexNormals();
  const body = new THREE.Group(); g.add(body);
  add(body, geo, new THREE.MeshPhysicalMaterial({ map: pumpkinFace(up), roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }));
  add(body, new THREE.TorusGeometry(prof.at(-2).x - 0.015, 0.025, 8, 48), M('#f07a10', 0.35), [0, H, 0], [Math.PI / 2, 0, 0]);
  const hr = prof.at(-2).x;
  const handle = add(body, new THREE.TorusGeometry(hr, 0.028, 8, 32, Math.PI), M('#16161a', 0.4), [0, H - 0.08, 0]);
  for (const s of [-1, 1]) add(body, sph(0.05), M('#16161a', 0.4), [s * hr, H - 0.08, 0]);
  body.position.y = -(H - 0.08 + hr);
  g.userData = {
    handle, body, rim: H, rimR: hr, height: H, bottom: V(0, body.position.y, 0),
    holdDefaults: { side: { level: true }, palm: { level: true, offset: [0, 0, 0.25] }, out: { level: true } },
  };
  return g;
}

// ---------- vacuum ----------
// Red canister vacuum on wheels (1.6 long, front +z) with a grey hose and a steel wand. makeProp('vacuum') returns the
// canister (origin on the floor under its middle); userData.wand is the wand prop (its grip is the handle; the nozzle
// points +z, 2.6 ahead). hold(vac.userData.wand, dad, 'R') and the hose re-routes itself; park() rests the wand on the
// canister.
function vacuum() {
  const g = group('vacuum'), red = M('#d8302c', 0.35, { clearcoat: 0.7 }), grey = M('#3b3f47', 0.55), steel = M('#c5cad2', 0.25, { metalness: 0.85 });
  add(g, box(1.0, 0.7, 1.55, 0.3), red, [0, 0.55, 0]);
  add(g, box(1.05, 0.14, 1.6, 0.06), grey, [0, 0.24, 0]);
  add(g, box(0.5, 0.12, 0.7, 0.05), grey, [0, 0.95, -0.15]);
  for (const s of [-1, 1]) add(g, roundedCylinder(0.24, 0.14, 0.04), grey, [s * 0.52, 0.24, -0.45], [0, 0, Math.PI / 2]);
  add(g, sph(0.08), grey, [0, 0.08, 0.6]);
  add(g, cyl(0.1, 0.1, 0.12), grey, [0, 0.65, 0.8], [Math.PI / 2, 0, 0]);
  const port = V(0, 0.65, 0.86);
  const wand = group('vacuum_wand');
  add(wand, box(0.16, 0.42, 0.16, 0.06), grey, [0, -0.04, 0], [0.2, 0, 0]);   // handle
  add(wand, cyl(0.07, 0.07, 0.25), grey, [0, -0.02, -0.25], [Math.PI / 2, 0, 0]);
  add(wand, cyl(0.055, 0.055, 2.2), steel, [0, 0, 1.2], [Math.PI / 2, 0, 0]);
  const nozzle = new THREE.Group(); nozzle.position.set(0, 0, 2.3); wand.add(nozzle);
  add(nozzle, cyl(0.07, 0.07, 0.2), grey, [0, 0, 0.05], [Math.PI / 2, 0, 0]);
  add(nozzle, box(0.7, 0.16, 0.24, 0.06), grey, [0, -0.02, 0.22]);
  add(nozzle, box(0.66, 0.04, 0.05, 0.015), M('#111111', 0.8), [0, -0.02, 0.35]);
  wand.userData = { owner: g, hoseEnd: V(0, -0.02, -0.38), bottom: V(0, -0.1, 2.5), onHold: () => g.userData.update() };
  g.add(wand);
  let hose = null; const hoseMat = M('#6b7078', 0.6);
  g.userData = {
    wand, port, bottom: V(0, 0, 0),
    update() {
      g.updateMatrixWorld(true); wand.updateMatrixWorld(true);
      const a = port.clone(), b = g.worldToLocal(wand.localToWorld(wand.userData.hoseEnd.clone()));
      const d = a.distanceTo(b), sag = Math.max(0.2, 3.2 - d * 0.5);
      const a1 = a.clone().add(V(0, 0, 0.4)), mid = a.clone().lerp(b, 0.5).add(V(0, -sag, 0)); mid.y = Math.max(mid.y, 0.12);
      const b1 = b.clone().add(wand.getWorldDirection(V()).transformDirection(new THREE.Matrix4().copy(g.matrixWorld).invert()).multiplyScalar(-0.4));
      const key = [a, b, b1].map((v) => v.toArray().map((x) => x.toFixed(3)).join()).join('|');
      if (hose && key === g.userData.hoseKey) return; g.userData.hoseKey = key; // same ends: keep the geometry (frame skipping)
      const curve = new THREE.CatmullRomCurve3([a, a1, mid, b1, b]);
      if (hose) { hose.geometry.dispose(); g.remove(hose); }
      hose = add(g, new THREE.TubeGeometry(curve, 48, 0.075, 10), hoseMat);
    },
    holdDefaults: { side: { level: true, offset: [0, -1.02, 0.15] } }, // carried up the ladder by the top handle
    onHold: () => g.userData.update(),
    park() { if (wand.parent !== g) g.add(wand); wand.position.set(0.3, 1.0, -0.6); wand.rotation.set(-0.3, 0, 0); g.userData.update(); },
  };
  g.userData.park();
  return g;
}

// ---------- broom ----------
// Wooden broom, 4.4 long, yellow straw head with a red band. Long axis +z: grip near the handle top (opts.grip 'end' for
// the very end), the bristles 2.3 ahead (in 'palm' it points along the arm: raised like a sword; in 'side' it points
// down and the bristles rest on the floor beside a hanging arm).
function broom(o = {}) {
  const g = group('broom'), wood = M('#b98a52', 0.55), straw = M('#e5bf52', 0.95), shift = o.grip === 'end' ? 1.45 : 0;
  const b = new THREE.Group(); b.position.z = shift; g.add(b);
  add(b, cyl(0.055, 0.055, 3.5, 12), wood, [0, 0, 0.0], [Math.PI / 2, 0, 0]);
  add(b, cyl(0.07, 0.07, 0.12, 12), M('#d33a2f', 0.5), [0, 0, -1.75], [Math.PI / 2, 0, 0]);
  add(b, cyl(0.1, 0.13, 0.25, 12), M('#d33a2f', 0.5), [0, 0, 1.8], [Math.PI / 2, 0, 0]);
  const head = new THREE.Group(); head.position.z = 1.9; b.add(head);
  const sg = new THREE.CylinderGeometry(0.15, 0.42, 0.95, 20, 6); sg.scale(1, 1, 0.45); crumple(sg, 0.05, 6);
  add(head, sg, straw, [0, 0, 0.48], [Math.PI / 2, 0, 0]);
  add(head, cyl(0.17, 0.2, 0.06, 20).scale(1, 1, 0.5), M('#d33a2f', 0.5), [0, 0, 0.3], [Math.PI / 2, 0, 0]);
  g.userData = { bottom: V(0, 0, 2.86 + shift), holdDefaults: { side: { rot: [Math.PI / 2 - 0.12, 0, 0] } } };
  return g;
}

// ---------- note ----------
// { state: 'folded' (default) | 'crumpled' | 'open' }. Folded: a white note folded in half, "Max" on the front, held
// pinched at its bottom edge (stands up out of the fist, faces +z). Crumpled: a 0.42 paper ball in the fist.
// Open: "Dear Max. The ghost was me. Sorry. Also, your dad's pancakes are amazing." in Skye's pen.
function note(o = {}) {
  const g = group('note'), st = o.state ?? (o.crumpled ? 'crumpled' : 'folded'), paper = M('#fbfaf5', 0.85);
  if (st === 'crumpled') {
    const geo = crumple(new THREE.IcosahedronGeometry(0.22, 2), 0.28, 5);
    add(g, geo, paper, [0, 0, 0.38], [0.3, 0.5, 0], [1, 0.9, 1.05]);
    add(g, crumple(new THREE.IcosahedronGeometry(0.08, 1), 0.3, 2), paper, [0.12, -0.08, 0.5]);
    g.userData = { bottom: V(0, -0.2, 0.38) };
    return g;
  }
  if (st === 'open') {
    const tex = textTex(512, 640, (x, w, h) => {
      x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, w, h); x.strokeStyle = '#bcd3ef'; x.lineWidth = 2; for (let y = 90; y < h; y += 54) { x.beginPath(); x.moveTo(20, y); x.lineTo(w - 20, y); x.stroke(); }
      x.fillStyle = '#d0408a'; x.font = '40px "Luckiest Guy", sans-serif';
      ['Dear Max.', 'The ghost was me.', 'Sorry.', 'Also, your dad\'s', 'pancakes are', 'amazing.', '- Skye'].forEach((l, i) => x.fillText(l, 36, 80 + i * 54));
    });
    add(g, new THREE.PlaneGeometry(0.62, 0.78), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }), [0, 0.42, 0.28]);
    g.userData = { bottom: V(0, 0.03, 0.28), handles: { L: V(0.3, 0.42, 0.28), R: V(-0.3, 0.42, 0.28) } };
    return g;
  }
  const tex = textTex(256, 200, (x, w, h) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, w, h); x.fillStyle = '#d0408a'; x.font = '64px "Luckiest Guy", sans-serif'; x.textAlign = 'center'; x.fillText('Max', w / 2, 125); });
  const front = add(g, new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), [0, 0.2, 0.47], [-0.08, 0, 0]);
  add(g, new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({ color: '#f0eee6', roughness: 0.85, side: THREE.DoubleSide }), [0, 0.2, 0.44], [0.1, Math.PI, 0]);
  add(g, box(0.5, 0.025, 0.035, 0.01), paper, [0, 0.4, 0.455]);
  front.castShadow = true;
  g.userData = { bottom: V(0, 0.0, 0.45), holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } } };
  return g;
}

// ---------- phone ----------
// Black phone, 0.56 x 0.3. Screen = +z face. { glow: true, screen: 'record' | 'call' | 'home' | 'off' }; setGlow(on)
// switches the screen's light (userData.light: a small cool PointLight for the face when { light: true }).
// The grip is the lower third of the phone; held 'out' it turns its screen to the holder (camera lens to the world).
function phone(o = {}) {
  const g = group('phone'), body = new THREE.Group(); body.position.set(0, 0.17, 0); g.add(body);
  add(body, box(0.3, 0.56, 0.045, 0.04), M('#16171b', 0.3, { clearcoat: 0.8 }));
  add(body, cyl(0.035, 0.035, 0.02, 16), M('#2a2d33', 0.2, { metalness: 0.6 }), [0.08, 0.2, -0.026], [Math.PI / 2, 0, 0]);
  const screens = {
    record: (x, w, h) => { x.fillStyle = '#20262e'; x.fillRect(0, 0, w, h); const gr = x.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, h * 0.6); gr.addColorStop(0, '#5a6b5e'); gr.addColorStop(1, '#1b2320'); x.fillStyle = gr; x.fillRect(0, 40, w, h - 130); x.fillStyle = '#ff2b2b'; x.beginPath(); x.arc(w / 2, h - 50, 30, 0, TAU); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2, h - 50, 38, 0, TAU); x.stroke(); x.fillStyle = '#ff2b2b'; x.fillRect(w / 2 - 54, 12, 108, 26); x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center'; x.fillText('0:07', w / 2, 32); },
    call: (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b4a6b'); gr.addColorStop(1, '#151b29'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = '#9fb3d9'; x.beginPath(); x.arc(w / 2, 120, 48, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('0:42', w / 2, 210); x.fillStyle = '#e8463a'; x.beginPath(); x.arc(w / 2, h - 70, 34, 0, TAU); x.fill(); },
    home: (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff9ccc'); gr.addColorStop(1, '#7cc4ff'); x.fillStyle = gr; x.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillRect(22 + (i % 4) * 58, 70 + (i / 4 | 0) * 70, 40, 40); } },
  };
  const tex = textTex(256, 480, screens[o.screen ?? 'record'] ?? screens.record);
  const on = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: o.brightness ?? 1.1, roughness: 0.2 });
  const off = new THREE.MeshStandardMaterial({ color: '#0b0c0f', roughness: 0.12, metalness: 0.3 });
  const scr = add(body, new THREE.PlaneGeometry(0.27, 0.5), on, [0, 0, 0.024]); scr.castShadow = false;
  let light = null; if (o.light) { light = new THREE.PointLight('#cfe3ff', o.lightIntensity ?? 1.5, 4, 2); light.position.set(0, 0, 0.3); body.add(light); }
  g.userData = {
    screen: scr, light, bottom: V(0, -0.11, 0),
    setGlow(v) { scr.material = v ? on : off; if (light) light.visible = v; g.userData.glow = v; },
    holdDefaults: { out: { level: true, rot: [0, Math.PI, 0], offset: [0, 0.38, 0] }, palm: { level: true, rot: [0, Math.PI, 0], offset: [0, 0.42, -0.3] } },
  };
  g.userData.setGlow(o.glow ?? (o.screen !== 'off'));
  return g;
}

// ---------- bedsheet ----------
// Dad's good white sheet. { state: 'flat' (default: lying across a lap, 3.2 x 2.6, draped) | 'held' (hanging from two
// fists, carry2 handles at its top corners) | 'bunched' (a crumpled armful hanging from one fist), holes: false }.
// Eye holes are cut 0.35 below the top edge's middle (Ch9 on). userData.setHoles(n): 0, 1 or 2 holes (cutting them).
function sheetAlpha(holes) {
  return textTex(256, 256, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#000'; const pts = [[-1, 0], [1, 0]].slice(0, holes); for (const [s] of pts) { x.beginPath(); x.ellipse(w / 2 + s * 15, 34, 9, 12, 0, 0, TAU); x.fill(); } });
}
function bedsheet(o = {}) {
  const g = group('bedsheet'), st = o.state ?? 'flat', cloth = (holes) => new THREE.MeshPhysicalMaterial({ color: '#f7f7f4', roughness: 0.9, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, alphaMap: sheetAlpha(holes), alphaTest: 0.5 });
  const nH = o.holes === true ? 2 : (o.holes || 0);
  if (st === 'bundle') { // an armful carried in both arms (carry2): a soft folded pile
    const cl = M('#f4f4f1', 0.92, { sheen: 0.6, sheenColor: new THREE.Color('#ffffff') });
    add(g, folds(new THREE.SphereGeometry(0.6, 40, 28), 0.06, 5), cl, [0, 0.1, 0.25], [0, 0, Math.PI / 2], [0.75, 1.25, 0.8]);
    add(g, folds(new THREE.CylinderGeometry(0.3, 0.45, 0.8, 32, 8, true), 0.06, 6), M('#f4f4f1', 0.92, { side: THREE.DoubleSide }), [0.15, -0.5, 0.3], [0, 0, 0.1]);
    g.userData = { bottom: V(0, -0.9, 0.3), handles: { L: V(0.62, 0.05, 0.15), R: V(-0.62, 0.05, 0.15) } };
    return g;
  }
  if (st === 'bunched') {
    const cl = M('#f4f4f1', 0.92, { sheen: 0.6, sheenColor: new THREE.Color('#ffffff') });
    add(g, folds(new THREE.SphereGeometry(0.5, 40, 28), 0.09, 1), cl, [0, -0.55, 0.12], [0, 0, 0], [1.05, 0.9, 0.85]);
    const tail = folds(new THREE.CylinderGeometry(0.42, 0.2, 1.5, 40, 16, true), 0.07, 2); add(g, tail, M('#f4f4f1', 0.92, { side: THREE.DoubleSide }), [0.05, -1.35, 0.08], [0, 0, 0.08]);
    add(g, folds(new THREE.SphereGeometry(0.28, 28, 20), 0.06, 3), cl, [0, -0.1, 0.05]);
    g.userData = { bottom: V(0, -2.1, 0.1) };
    return g;
  }
  const W = st === 'held' ? 3.0 : 3.2, Hh = st === 'held' ? 3.6 : 2.6;
  const geo = new THREE.PlaneGeometry(W, Hh, 40, 40), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), u = x / W + 0.5, v = 0.5 - y / Hh; // v: 0 at the top edge
    if (st === 'held') p.setXYZ(i, x * (1 - 0.25 * v) * (1 - 0.1 * Math.sin(u * Math.PI)), Hh / 2 - v * Hh - 0.25 * Math.sin(u * Math.PI) * (1 - v * 0.5) - Hh / 2, Math.sin(u * 13 + v * 2) * 0.1 * v + 0.2 * Math.sin(u * Math.PI) * (1 - v));
    else { const fold = Math.sin(u * 9 + 1) * 0.05 + Math.sin(v * 7) * 0.04; const drape = Math.max(0, Math.abs(u - 0.5) - 0.3) * 3; p.setXYZ(i, x, -drape * 0.9 + fold, y); }
  }
  geo.computeVertexNormals();
  const m = add(g, geo, cloth(nH));
  if (st === 'flat') m.rotation.y = Math.PI; // eye-hole edge toward the sitter (-z)... toward +z after this flip
  g.userData = {
    bottom: V(0, -1.0, 0),
    handles: st === 'held' ? { L: V(W / 2, -0.12, 0), R: V(-W / 2, -0.12, 0) } : { L: V(W / 2 - 0.3, 0, 0), R: V(-W / 2 + 0.3, 0, 0) },
    setHoles(n) { m.material.alphaMap = sheetAlpha(n); m.material.needsUpdate = true; },
  };
  return g;
}

// ---------- scissors ----------
// Kids' scissors: red plastic finger loops, steel blades, 0.75 long, blades +z. Grip = the loops; { open: 0.35 } angle.
function scissors(o = {}) {
  const g = group('scissors'), red = M('#e2353a', 0.35, { clearcoat: 0.6 }), steel = M('#d4d8de', 0.2, { metalness: 0.9 });
  const halves = [];
  for (const s of [-1, 1]) {
    const half = new THREE.Group(); half.position.z = 0.22; half.userData.s = s; halves.push(half); g.add(half);
    add(half, new THREE.TorusGeometry(0.13, 0.04, 8, 20), red, [s * 0.13, 0, -0.22], [Math.PI / 2, 0, 0], [1, 1.3, 1]);
    add(half, box(0.05, 0.03, 0.14, 0.01), red, [s * 0.05, 0, -0.08]);
    const bl = add(half, new THREE.ConeGeometry(0.06, 0.75, 4), steel, [-s * 0.012, 0, 0.37], [Math.PI / 2, 0, Math.PI / 4], [1, 1, 0.35]);
  }
  add(g, cyl(0.03, 0.03, 0.08, 10), M('#555', 0.4, { metalness: 0.6 }), [0, 0, 0.22]);
  for (const ch of [...g.children]) ch.position.z += 0.2; // loops in the fist, the hinge and blades out of it
  g.userData = { bottom: V(0, -0.04, 0.3), setOpen(a) { for (const h of halves) h.rotation.y = h.userData.s * a / 2; } }; // a: 0 shut .. 0.6 wide (snip by animating it)
  g.userData.setOpen(o.open ?? 0.3);
  return g;
}

// ---------- glow sticks ----------
// glow_sticks { lit: false, colors }: a bundle of six 0.8-long sticks with a rubber band, lying along x (origin centre).
// glow_band { color = '#5dff6a', lit = true }: one bent glow stick worn round a wrist: wearWrist(band, actor, hand).
// userData.setLit(on) on both; userData.light (with { light: true }) is a small PointLight in the glow colour.
function glowStickMat(c, lit) { return lit ? glowMat(c, 2.6) : new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, transmission: 0.3, thickness: 0.1, clearcoat: 0.8 }); }
function glowSticks(o = {}) {
  const g = group('glow_sticks'), cols = o.colors ?? ['#5dff6a', '#ff5ad1', '#4fd2ff', '#fff15a', '#5dff6a', '#ff9a3c'], sticks = [];
  cols.forEach((c, i) => { const a = (i / cols.length) * TAU; const s = add(g, new THREE.CapsuleGeometry(0.04, 0.72, 4, 10), glowStickMat(c, !!o.lit), [0, 0.09 + Math.sin(a) * 0.07, Math.cos(a) * 0.07], [0, 0, Math.PI / 2 + (i - 2.5) * 0.04]); s.userData.color = c; sticks.push(s); });
  add(g, new THREE.TorusGeometry(0.12, 0.02, 6, 20), M('#2c2c2c', 0.6), [0.15, 0.09, 0], [0, Math.PI / 2, 0]);
  g.userData = { sticks, bottom: V(0, 0, 0), setLit(on) { for (const s of sticks) s.material = glowStickMat(s.userData.color, on); }, holdDefaults: { palm: { rot: [0, Math.PI / 2, 0], offset: [-0.3, -0.09, 0] }, side: { rot: [0, Math.PI / 2, 0], offset: [-0.3, -0.09, 0] } } };
  return g;
}
function glowBand(o = {}) {
  const g = group('glow_band'), c = o.color ?? '#5dff6a', hs = 0.56, cr = 0.16;
  const pts = []; for (let i = 0; i < 4; i++) { const cx = (i === 0 || i === 3 ? 1 : -1) * (hs - cr), cz = (i < 2 ? 1 : -1) * (hs - cr), a0 = i * Math.PI / 2; for (let k = 0; k <= 6; k++) { const a = a0 + k / 6 * Math.PI / 2; pts.push(V(cx + Math.cos(a) * cr, 0, cz + Math.sin(a) * cr)); } }
  const band = add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.05, 8, true), glowStickMat(c, o.lit ?? true));
  add(g, cyl(0.06, 0.06, 0.12, 10), M('#e8e8e8', 0.4), [hs, 0, 0.12], [Math.PI / 2, 0, 0]); // the connector
  let light = null; if (o.light) { light = new THREE.PointLight(c, o.lightIntensity ?? 1.2, 5, 2); g.add(light); }
  g.userData = { band, light, setLit(on) { band.material = glowStickMat(c, on); if (light) light.visible = on; } };
  return g;
}

// ---------- the drawing ----------
// Crayon on paper (1.1 x 0.85, a little curled): two stick kids holding hands, one with pink hair, a sun, grass, a heart,
// "ME AND SKYE." / "BEST FRENDS." (Ch9). Faces +z, origin at the bottom-middle edge; carry2 handles at the side edges.
function drawingTex() {
  return textTex(1024, 792, (x, w, h) => {
    x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h);
    x.lineCap = 'round'; x.lineJoin = 'round'; const r = rnd(21);
    const crayon = (col, lw, f) => { for (let k = 0; k < 3; k++) { x.save(); x.translate((r() - 0.5) * 3, (r() - 0.5) * 3); x.strokeStyle = col; x.fillStyle = col; x.globalAlpha = 0.55; x.lineWidth = lw; f(); x.restore(); } };
    crayon('#f2c21b', 10, () => { x.beginPath(); x.arc(890, 120, 60, 0, TAU); x.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; x.beginPath(); x.moveTo(890 + Math.cos(a) * 75, 120 + Math.sin(a) * 75); x.lineTo(890 + Math.cos(a) * 110, 120 + Math.sin(a) * 110); x.stroke(); } });
    crayon('#3fae3a', 12, () => { x.beginPath(); for (let i = 0; i <= 50; i++) { const X = i * w / 50; x.lineTo(X, 690 + (i % 2 ? -22 : 6)); } x.stroke(); });
    const kid = (cx, hair) => {
      crayon('#222', 9, () => { x.beginPath(); x.arc(cx, 330, 52, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(cx, 382); x.lineTo(cx, 540); x.moveTo(cx, 540); x.lineTo(cx - 50, 660); x.moveTo(cx, 540); x.lineTo(cx + 50, 660); x.stroke();
        x.beginPath(); x.arc(cx - 18, 318, 5, 0, TAU); x.arc(cx + 18, 318, 5, 0, TAU); x.fill(); x.beginPath(); x.arc(cx, 342, 22, 0.2, Math.PI - 0.2); x.stroke(); });
      if (hair) crayon(hair, 16, () => { x.beginPath(); for (let i = 0; i < 9; i++) { const a = Math.PI + 0.15 + i / 8 * (Math.PI - 0.3); x.moveTo(cx + Math.cos(a) * 50, 330 + Math.sin(a) * 50); x.lineTo(cx + Math.cos(a) * 92, 330 + Math.sin(a) * 92 + (i === 0 || i === 8 ? 60 : 0)); } x.stroke(); });
      else crayon('#4a2e1c', 12, () => { x.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI + 0.4 + i / 6 * (Math.PI - 0.8); x.moveTo(cx + Math.cos(a) * 50, 330 + Math.sin(a) * 50); x.lineTo(cx + Math.cos(a) * 66, 330 + Math.sin(a) * 66); } x.stroke(); });
    };
    kid(350, null); kid(640, '#ff4fb0');
    crayon('#222', 9, () => { x.beginPath(); x.moveTo(350, 430); x.lineTo(270, 500); x.moveTo(350, 430); x.lineTo(495, 470); x.lineTo(640, 430); x.moveTo(640, 430); x.lineTo(720, 500); x.stroke(); });
    crayon('#e8343c', 10, () => { x.beginPath(); x.moveTo(495, 250); x.bezierCurveTo(470, 215, 430, 240, 495, 290); x.bezierCurveTo(560, 240, 520, 215, 495, 250); x.fill(); });
    x.font = '74px "Luckiest Guy", sans-serif'; x.textAlign = 'center';
    crayon('#2f5fd1', 1, () => { x.fillText('ME AND SKYE.', w / 2 - 40, 112); x.fillText('BEST FRENDS.', w / 2 - 40, 772 - 22); });
    x.globalAlpha = 1; x.font = '40px "Luckiest Guy", sans-serif'; x.fillStyle = '#7a7a7a'; x.textAlign = 'right'; x.fillText('MAX', w - 40, h - 26);
  });
}
function drawing() {
  const g = group('drawing'), W = 1.1, H = 0.85, geo = new THREE.PlaneGeometry(W, H, 20, 6), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -0.06 * Math.pow(Math.abs(x) / (W / 2), 2) + 0.02 * Math.sin(y * 4)); }
  geo.computeVertexNormals(); geo.translate(0, H / 2, 0);
  add(g, geo, new THREE.MeshStandardMaterial({ map: drawingTex(), roughness: 0.9 }));
  const back = geo.clone(); add(g, back, new THREE.MeshStandardMaterial({ color: '#f1ede2', roughness: 0.9, side: THREE.BackSide }));
  g.userData = { bottom: V(0, 0, 0), handles: { L: V(W / 2 - 0.05, H * 0.45, 0), R: V(-W / 2 + 0.05, H * 0.45, 0) }, holdDefaults: { out: { level: true }, palm: { level: true, offset: [0, -0.4, 0.15] } } };
  return g;
}

// ---------- kitchen things ----------
// milk: a gable-top carton, 0.42 x 0.95, blue "MILK" label; ham: a cooked ham joint with the bone end as the grip (Dad
// carries it off by the bone); syrup: a maple syrup bottle with a red cap; pan: frying pan, handle grip, pan +z
// ({ pancake: true } with one in it); knife: a rounded butter knife (Max cutting the crusts off).
function milk() {
  const g = group('milk'), c = new THREE.Group(); c.position.set(0, -0.35, 0.42); g.add(c);
  const tex = textTex(256, 256, (x, w, h) => { x.fillStyle = '#fafafa'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f7de1'; x.fillRect(0, h * 0.55, w, h * 0.45); x.fillStyle = '#ffffff'; x.font = 'bold 64px "Luckiest Guy", sans-serif'; x.textAlign = 'center'; x.fillText('MILK', w / 2, h * 0.86); x.fillStyle = '#2f7de1'; x.beginPath(); x.ellipse(w / 2, h * 0.3, 60, 40, 0, 0, TAU); x.fill(); });
  const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  add(c, new THREE.BoxGeometry(0.42, 0.72, 0.42), side, [0, 0.36, 0]);
  const roof = new THREE.BufferGeometry().setFromPoints([V(-0.21, 0, 0.21), V(0.21, 0, 0.21), V(0, 0.2, 0.21), V(0.21, 0, -0.21), V(-0.21, 0, -0.21), V(0, 0.2, -0.21)]);
  roof.setIndex([0, 1, 2, 3, 4, 5, 1, 3, 5, 1, 5, 2, 4, 0, 2, 4, 2, 5]); roof.computeVertexNormals();
  add(c, roof, M('#fafafa', 0.6, { side: THREE.DoubleSide }), [0, 0.72, 0], [0, Math.PI / 2, 0]);
  add(c, box(0.04, 0.08, 0.42, 0.01), M('#fafafa', 0.6), [0, 0.95, 0], [0, Math.PI / 2, 0]);
  g.userData = { bottom: V(0, -0.35, 0.42), holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } } };
  return g;
}
function ham(o = {}) {
  const g = group('ham'), meat = M('#d9787a', 0.55, { clearcoat: 0.3 }), glaze = M('#a8502c', 0.45, { clearcoat: 0.5 });
  add(g, cyl(0.06, 0.06, 0.35, 12), M('#f1e6d0', 0.5), [0, 0, 0.12], [Math.PI / 2, 0, 0]);
  add(g, sph(0.08, 12), M('#f1e6d0', 0.5), [0, 0, -0.06], [0, 0, 0], [1.3, 1, 1]);
  add(g, new THREE.CapsuleGeometry(0.32, 0.35, 8, 20), glaze, [0, 0, 0.72], [Math.PI / 2, 0, 0], [1, 1, 0.9]);
  add(g, new THREE.CircleGeometry(0.3, 28), meat, [0, 0, 1.24], [0, 0, 0]);
  add(g, sph(0.33, 24), meat, [0, 0, 1.06], [0, 0, 0], [0.92, 0.82, 0.55]);
  if (o.raided) { g.children.at(-1).position.z = 0.86; g.children.at(-2).position.z = 1.0; g.children.at(-3).scale.set(1, 1, 0.55); g.children.at(-3).position.z = 0.6; } // a big chunk gone
  g.userData = { bottom: V(0, -0.3, 0.7), holdDefaults: { side: { rot: [0.25, 0, 0] } } };
  return g;
}
function syrup() {
  const g = group('syrup'), c = new THREE.Group(); c.position.set(0, -0.3, 0.36); g.add(c);
  const pts = [[0, 0], [0.15, 0], [0.16, 0.02], [0.16, 0.45], [0.12, 0.56], [0.06, 0.62], [0.06, 0.7], [0, 0.7]].map(([x, y]) => new THREE.Vector2(x, y));
  add(c, new THREE.LatheGeometry(pts, 28), new THREE.MeshPhysicalMaterial({ color: '#8a3f0f', roughness: 0.1, clearcoat: 1, transmission: 0.2, thickness: 0.3 }));
  add(c, cyl(0.07, 0.07, 0.1, 16), M('#d0322c', 0.4), [0, 0.74, 0]);
  const tex = textTex(256, 128, (x, w, h) => { x.fillStyle = '#f3e3c0'; x.fillRect(0, 0, w, h); x.fillStyle = '#b5321f'; x.font = 'bold 48px "Luckiest Guy", sans-serif'; x.textAlign = 'center'; x.fillText('SYRUP', w / 2, 84); });
  add(c, new THREE.CylinderGeometry(0.162, 0.162, 0.2, 28, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), [0, 0.24, 0]);
  g.userData = { bottom: V(0, -0.3, 0.36), holdDefaults: { palm: { level: true }, out: { level: true }, side: { level: true } } };
  return g;
}
function pan(o = {}) {
  const g = group('pan'), black = M('#22242a', 0.35, { metalness: 0.5 });
  add(g, roundedCylinder(0.065, 0.75, 0.03), black, [0, 0, -0.05], [Math.PI / 2, 0, 0]);
  const p = new THREE.Group(); p.position.set(0, -0.08, 0.95); g.add(p);
  const pts = [[0, 0], [0.5, 0], [0.56, 0.03], [0.6, 0.16], [0.57, 0.16], [0.53, 0.04], [0, 0.04]].map(([x, y]) => new THREE.Vector2(x, y));
  add(p, new THREE.LatheGeometry(pts, 40), black);
  add(g, cyl(0.04, 0.04, 0.3, 8), black, [0, -0.04, 0.38], [Math.PI / 2 + 0.25, 0, 0]);
  const cake = pancakeMesh(31); cake.position.y = 0.04; cake.visible = !!o.pancake; p.add(cake);
  g.userData = { panPivot: p, pancake: cake, bottom: V(0, -0.08, 0.95), holdDefaults: { palm: { level: true }, side: { level: true } } };
  return g;
}
function knife() {
  const g = group('knife'), steel = M('#d6dae0', 0.2, { metalness: 0.9 });
  add(g, roundedCylinder(0.05, 0.6, 0.02), M('#f2f2f2', 0.4), [0, 0, 0.1], [Math.PI / 2, 0, 0]);
  add(g, box(0.1, 0.02, 0.6, 0.02), steel, [0, 0, 0.7]);
  g.userData = { bottom: V(0, -0.05, 0.3) };
  return g;
}

// ---------- backpack (loose) ----------
// Skye's lilac backpack off her back: 1.3 wide, 1.5 tall, 0.6 deep, front pocket +z, straps at the back (-z), a grab
// loop on top (the grip). place() stands it on the floor; hold(bp, skye, 'R', 'side') carries it by the loop.
function backpack() {
  const g = group('backpack'), lil = M('#c3a6ec', 0.75), dark = M('#8e6cc9', 0.7), body = new THREE.Group(); body.position.y = -1.62; g.add(body);
  add(body, box(1.3, 1.45, 0.6, 0.28), lil, [0, 0.75, 0]);
  add(body, box(1.0, 0.62, 0.22, 0.12), dark, [0, 0.45, 0.36]);
  add(body, box(0.9, 0.04, 0.04, 0.02), M('#f0f0f0', 0.4), [0, 0.78, 0.48]);
  for (const sx of [-1, 1]) add(body, box(0.2, 1.1, 0.12, 0.05), dark, [sx * 0.36, 0.78, -0.36]);
  add(body, new THREE.TorusGeometry(0.12, 0.035, 6, 16, Math.PI), dark, [0, 1.47, 0]);
  g.userData = { bottom: V(0, -1.62, 0), holdDefaults: { side: { level: true } } };
  return g;
}

// ---------- small extras ----------
// cracker_packet: a half-eaten packet of crackers (red wrapper, crackers sliding out), grip at its closed end, lies flat.
// bread: one crustless white slice (lying flat, grip at the back edge like the sandwich). napkin: folded paper napkin.
// apple, juice_box (with a straw): extras' lunches.
function crackerPacket() {
  const g = group('cracker_packet'), p = new THREE.Group(); p.position.z = 0.35; g.add(p);
  add(p, box(0.42, 0.14, 0.62, 0.05), M('#d8342f', 0.45, { clearcoat: 0.6 }), [0, 0, 0]);
  add(p, box(0.44, 0.02, 0.2, 0.01), M('#f6d34a', 0.5), [0, 0.07, 0.05]);
  for (let i = 0; i < 3; i++) add(p, box(0.34, 0.06, 0.34, 0.02), M('#e7b35f', 0.8), [0.02 * i, 0.03 + i * 0.01, 0.38 + i * 0.12], [0, i * 0.2, 0]);
  g.userData = { bottom: V(0, -0.07, 0.35), holdDefaults: { palm: { level: true }, out: { level: true } } };
  return g;
}
function bread() {
  const g = group('bread'), s = new THREE.Shape(); s.moveTo(-0.36, -0.36); s.lineTo(0.36, -0.36); s.lineTo(0.36, 0.25); s.quadraticCurveTo(0.36, 0.42, 0.18, 0.42); s.quadraticCurveTo(0, 0.36, -0.18, 0.42); s.quadraticCurveTo(-0.36, 0.42, -0.36, 0.25); s.lineTo(-0.36, -0.36);
  const e = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }); e.rotateX(Math.PI / 2); e.translate(0, 0.08, 0);
  add(g, e, M('#f5e6c4', 0.85), [0, -0.04, 0.55]);
  g.userData = { bottom: V(0, -0.04, 0.55), holdDefaults: { palm: { level: true }, out: { level: true } } };
  return g;
}
function napkin() {
  const g = group('napkin'); add(g, box(0.55, 0.03, 0.55, 0.01), M('#ffffff', 0.9), [0, 0.015, 0.4], [0, 0.3, 0]);
  g.userData = { bottom: V(0, 0, 0.4) }; return g;
}
function apple(o = {}) {
  const g = group('apple'), a = new THREE.Group(); a.position.set(0, 0, 0.4); g.add(a);
  add(a, sph(0.22, 24), M(o.color ?? '#d7262b', 0.3, { clearcoat: 0.8 }), [0, 0.2, 0], [0, 0, 0], [1, 0.9, 1]);
  add(a, cyl(0.015, 0.015, 0.12, 6), M('#5a3b1c', 0.6), [0, 0.43, 0]);
  add(a, sph(0.06, 10), M('#4caf3d', 0.5), [0.06, 0.42, 0], [0, 0, 0.6], [1.4, 0.3, 0.7]);
  g.userData = { bottom: V(0, 0, 0.4), holdDefaults: { palm: { level: true }, out: { level: true } } }; return g;
}
function juiceBox(o = {}) {
  const g = group('juice_box'), j = new THREE.Group(); j.position.set(0, -0.2, 0.36); g.add(j);
  const tex = textTex(128, 160, (x, w, h) => { x.fillStyle = o.color ?? '#ff9a1f'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 70, 34, 0, TAU); x.fill(); x.fillStyle = o.color ?? '#ff9a1f'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('JUICE', 64, 80); });
  add(j, new THREE.BoxGeometry(0.3, 0.45, 0.18), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), [0, 0.225, 0]);
  add(j, cyl(0.015, 0.015, 0.3, 6), M('#ffffff', 0.4), [0.08, 0.55, 0], [0, 0, 0.25]);
  g.userData = { bottom: V(0, -0.2, 0.36), holdDefaults: { palm: { level: true }, out: { level: true } } }; return g;
}

// ---------- registry ----------
export const PROPS = {
  flashlight: { build: flashlight, what: "Max's torch (beam: true for the cone, light: true for a SpotLight); { pink: true } Skye's" },
  flashlight_small: { build: (o) => flashlight({ ...o, pink: true }), what: "Skye's small pink flashlight" },
  lunchbox: { build: lunchbox, what: "Skye's lilac lunchbox (open, sandwich, spider)" },
  rubber_spider: { build: rubberSpider, what: 'black rubber spider' },
  spatula: { build: spatula, what: "Dad's spatula" },
  pancake: { build: pancake, what: 'one pancake' },
  pancake_stack: { build: pancakeStack, what: 'a stack on a plate, { count: 12 }, setCount(n)' },
  magnet_letters: { build: magnetLetters, what: "a handful of Lily's fridge letters, { letters: 'BENICE' }" },
  plate: { build: plate, what: "white plate, { with: 'sandwich' | 'ham_sandwich' | 'pancakes' | 'crumbs' }" },
  sandwich: { build: sandwich, what: "crustless sandwich, { half, bitten: n | 'half_eaten', filling, crusts }" },
  cookie: { build: cookie, what: 'chocolate-chip cookie' },
  cobweb: { build: cobweb, what: 'cobweb wisp for the hair (wearOnHead)' },
  teddy: { build: teddy, what: "Lily's brown teddy ({ pose: 'sit' })" },
  teapot: { build: teapot, what: 'toy teapot' },
  cup: { build: cup, what: 'toy teacup ({ saucer: true } for the table)' },
  hobby_horse: { build: hobbyHorse, what: 'hobby horse' },
  pumpkin_bucket: { build: pumpkinBucket, what: "jack-o'-lantern bucket (wearOnHead for Ch7)" },
  vacuum: { build: vacuum, what: 'canister vacuum; userData.wand is the held part' },
  broom: { build: broom, what: 'broom ({ grip: "end" })' },
  note: { build: note, what: "Skye's note, { state: 'folded' | 'crumpled' | 'open' }" },
  phone: { build: phone, what: "phone, { screen: 'record' | 'call' | 'home' | 'off' }, setGlow(on)" },
  bedsheet: { build: bedsheet, what: "Dad's good sheet, { state: 'flat' | 'held' | 'bunched', holes: 0..2 }" },
  scissors: { build: scissors, what: "kids' scissors, { open }" },
  glow_sticks: { build: glowSticks, what: 'a bundle of six, { lit }' },
  glow_band: { build: glowBand, what: 'one green glow stick round a wrist (wearWrist)' },
  drawing: { build: drawing, what: 'ME AND SKYE. BEST FRENDS. crayon drawing' },
  milk: { build: milk, what: 'milk carton' },
  ham: { build: ham, what: "Dad's ham" },
  syrup: { build: syrup, what: 'syrup bottle' },
  pan: { build: pan, what: 'frying pan ({ pancake: true })' },
  knife: { build: knife, what: 'butter knife' },
  sandwich_plate: { build: (o) => plate({ with: 'ham_sandwich', ...o }), what: 'plate with a crustless ham sandwich (two halves)' },
  sheet_bunched: { build: (o) => bedsheet({ ...o, state: 'bunched' }), what: "Dad's sheet scrunched in one fist" },
  note_crumpled: { build: (o) => note({ ...o, state: 'crumpled' }), what: 'the crumpled note' },
  toy_teddy_a: { build: (o) => teddy({ pose: 'sit', fur: '#efe6d6', cream: '#ffffff', sheen: '#ffffff', bow: '#6aa8ff', ...o }), what: 'tea-party toy: a cream teddy, sitting' },
  toy_teddy_b: { build: (o) => teddy({ pose: 'sit', fur: '#f2a7c8', cream: '#ffe4f0', sheen: '#ffd0e6', bow: '#ffd23f', ...o }), what: 'tea-party toy: a pink teddy, sitting' },
  cracker_packet: { build: crackerPacket, what: "Skye's cracker packet (nest)" },
  bread: { build: bread, what: 'one slice of white bread' },
  napkin: { build: napkin, what: 'folded paper napkin' },
  apple: { build: apple, what: "an extra's apple ({ color })" },
  juice_box: { build: juiceBox, what: "an extra's juice box ({ color })" },
  sandwich_crustless: { build: (o) => sandwich({ crusts: false, ...o }), what: 'alias of sandwich' },
  sandwich_half: { build: (o) => sandwich({ half: true, ...o }), what: 'half a crustless sandwich' },
  butter_knife: { build: knife, what: 'alias of knife' },
  backpack: { build: backpack, what: "Skye's lilac backpack as a loose prop (floor, nest, hanging on a chair)" },
};

// makeProp(id, opts): a fresh THREE.Group (shadows on), userData.id = id.
export function makeProp(id, opts = {}) {
  const p = PROPS[id];
  if (!p) throw new Error(`makeProp: unknown prop "${id}" (have: ${Object.keys(PROPS).join(', ')})`);
  const g = p.build(opts);
  g.name = id; g.userData.id = id; g.userData.opts = opts;
  return g;
}

// ---------- placing ----------
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
const UP = V(0, 1, 0);
// place(prop, pos, heading = 0): stand the prop with its userData.bottom on pos (in the prop's parent space), turned to
// heading (rotation about y). Leaves the prop where it is in the tree.
// opts.flat: lay it on its back (screen / face up: phone, note, drawing, flashlight on its side), front toward heading.
export function place(prop, pos, heading = 0, opts = {}) {
  const sc = prop.userData.scale ?? 1;
  prop.scale.setScalar(sc);
  if (opts.flat) {
    prop.rotation.set(-Math.PI / 2, 0, 0, 'YXZ'); prop.rotation.y = heading; prop.updateMatrix();
    const c = prop.clone(); c.position.set(0, 0, 0); c.updateMatrixWorld(true); const box3 = new THREE.Box3().setFromObject(c, true);
    prop.position.copy(pos).add(V(-(box3.min.x + box3.max.x) / 2, -box3.min.y + 0.002, -(box3.min.z + box3.max.z) / 2));
    return prop;
  }
  prop.rotation.set(0, heading, 0);
  const b = (prop.userData.bottom ?? V(0, 0, 0)).clone().multiplyScalar(sc).applyAxisAngle(UP, heading);
  prop.position.copy(pos).sub(b);
  return prop;
}

function setWorld(obj, pos, quat, scale = 1) {
  // write a world transform onto obj in its parent's space
  const parent = obj.parent; parent.updateMatrixWorld(true);
  _m.compose(pos, quat, _s.set(scale, scale, scale)).premultiply(new THREE.Matrix4().copy(parent.matrixWorld).invert());
  _m.decompose(obj.position, obj.quaternion, obj.scale);
}
const sideOf = (hand) => (hand === 'L' || hand === 'left' ? 'L' : 'R');
function defaults(prop, mode, hand) { const d = prop.userData.holdDefaults?.[mode]; return typeof d === 'function' ? d(hand) : (d ?? {}); }

// hold(prop, actor, hand = 'R', mode = 'palm', opts): parent the prop to the arm bone at the measured grip and orient it
// (see the hand frames at the top). opts (merged over the prop's own holdDefaults for that mode):
//   level  - keep the prop upright, facing along the arm's horizontal direction (or the actor's heading if the arm hangs)
//   rot    - [x, y, z] extra rotation in the prop's own frame;  offset - [x, y, z] in the prop's frame (studs)
//   mirror - mirror the prop in x (props authored for the right hand, e.g. the teddy, use it for 'L')
//   scale  - prop scale (default 1: props keep their real size whoever holds them)
// Call every frame after posing the actor (the pose moves the bones). Returns the prop.
export function hold(prop, actor, hand = 'R', mode = 'palm', opts = {}) {
  const sd = sideOf(hand), o = { ...defaults(prop, mode, sd), ...opts }, S = actor.scale ?? 1, sc = o.scale ?? 1;
  if (mode === 'hug') return hug(prop, actor, sd, o);
  if (mode === 'ear') return atEar(prop, actor, sd, o);
  if (mode === 'mouth') return inMouth(prop, actor, o);
  const bone = actor.bones['Arm.' + sd];
  if (prop.parent !== bone) bone.add(prop);
  prop.position.set(sd === 'R' ? -0.5 * S : 0.5 * S, (mode === 'out' ? -1.75 : -1.3) * S, 0);
  if (mode === 'side') prop.quaternion.identity(); else prop.quaternion.setFromAxisAngle(V(1, 0, 0), Math.PI / 2);
  prop.scale.set(o.mirror ? -sc : sc, sc, sc);
  if (o.level) {
    actor.root.updateMatrixWorld(true);
    const armDown = V(0, -1, 0).transformDirection(bone.matrixWorld); armDown.y = 0;
    const heading = armDown.length() > 0.35 && mode !== 'side' ? Math.atan2(armDown.x, armDown.z) : actor.root.getWorldQuaternion(_q2) && new THREE.Euler().setFromQuaternion(_q2, 'YXZ').y;
    _q.setFromAxisAngle(UP, heading + (o.yaw ?? 0));
    bone.getWorldQuaternion(_q2); prop.quaternion.copy(_q2.invert().multiply(_q));
  }
  if (o.aim) { // point the prop's +z at a world point (keeps it as upright as it can)
    actor.root.updateMatrixWorld(true); const gw = bone.localToWorld(prop.position.clone()), dir = o.aim.clone().sub(gw).normalize();
    const up0 = Math.abs(dir.y) > 0.97 ? V(0, 0, 1).applyQuaternion(actor.root.getWorldQuaternion(new THREE.Quaternion())).multiplyScalar(-Math.sign(dir.y)) : UP;
    const xw = new THREE.Vector3().crossVectors(up0, dir).normalize(), yw = new THREE.Vector3().crossVectors(dir, xw);
    _q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xw, yw, dir)); bone.getWorldQuaternion(_q2); prop.quaternion.copy(_q2.invert().multiply(_q));
  }
  if (o.rot) prop.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rot)));
  if (o.offset) prop.position.add(V(...o.offset).multiplyScalar(sc).applyQuaternion(prop.quaternion));
  prop.visible = o.visible ?? true;
  prop.updateMatrixWorld(true);
  prop.userData.onHold?.();
  return prop;
}
// 'ear': a phone against the side of the head (on the Head bone), screen inward; pose the arm up beside the head yourself.
function atEar(prop, actor, sd, o) {
  const S = actor.scale ?? 1, head = actor.bones.Head, sc = o.scale ?? 1;
  if (prop.parent !== head) head.add(prop);
  prop.position.set((sd === 'R' ? -0.68 : 0.68) * S, 0.38 * S, 0.22 * S);
  prop.quaternion.setFromEuler(new THREE.Euler(0, sd === 'R' ? -Math.PI / 2 : Math.PI / 2, 0)); // screen (+z) faces the head
  prop.rotateX(-0.25); prop.scale.set(sc, sc, sc);
  if (o.offset) prop.position.add(V(...o.offset));
  prop.updateMatrixWorld(true);
  return prop;
}
// 'mouth': clamped in the teeth (a pancake as Skye crawls out): on the Head bone at the mouth, sticking out forward,
// prop level with the head. The pancake's centre goes 0.45 in front of the face.
function inMouth(prop, actor, o) {
  const S = actor.scale ?? 1, head = actor.bones.Head, sc = o.scale ?? 1;
  if (prop.parent !== head) head.add(prop);
  const b = prop.userData.bottom ?? V(0, 0, 0);
  prop.quaternion.setFromEuler(new THREE.Euler(...(o.rot ?? [0.25, 0, 0]))); prop.scale.set(sc, sc, sc);
  prop.position.set(0, 0.3 * S, 0.62 * S).sub(b.clone().setY(0).multiplyScalar(sc).applyQuaternion(prop.quaternion)).add(V(0, 0, 0.36));
  if (o.offset) prop.position.add(V(...o.offset));
  prop.updateMatrixWorld(true);
  return prop;
}
// facePoint(actor): a world point on the face - hold(flashlight_small, skye, "R", "palm", { aim: facePoint(skye) })
// with the arm raised in front of the chest lights her face from below.
export function facePoint(actor) { actor.root.updateMatrixWorld(true); return actor.bones.Head.localToWorld(V(0, 0.55 * (actor.scale ?? 1), 0.6 * (actor.scale ?? 1))); }
export const chinPoint = facePoint;
function hug(prop, actor, sd, o) {
  const S = actor.scale ?? 1, torso = actor.bones.Torso, sc = o.scale ?? 1;
  if (prop.parent !== torso) torso.add(prop);
  // torso pivot is the hip centre; the chest front is z = +0.5 * S, the chest 1.2 * S up. Put the teddy's tummy there.
  const b = prop.userData.bottom ?? V(0, 0, 0);
  prop.quaternion.identity(); prop.scale.set(sc, sc, sc);
  prop.position.set(0, 0.05 * S, 0.5 * S + 0.3 * sc).sub(V(b.x * sc, b.y * sc + 0, b.z * sc));
  if (o.rot) prop.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.rot)));
  if (o.offset) prop.position.add(V(...o.offset));
  prop.updateMatrixWorld(true);
  return prop;
}

// carry2(prop, actor, opts): two-handed things (plate, held bedsheet, the drawing, the open note). The prop's
// userData.handles.L / .R go into the left / right fists: its x axis runs along the line between the fists, kept
// upright; it is centred between them. opts.at = 'palm' (default) | 'out' picks the fist point; opts.parent (default the
// actor's parent) is where the prop lives. Pose both arms (mirror-symmetric) first. Returns the gap error (studs).
export function carry2(prop, actor, opts = {}) {
  const S = actor.scale ?? 1, y = (opts.at === 'out' ? -1.75 : -1.3) * S, sc = opts.scale ?? 1;
  actor.root.updateMatrixWorld(true);
  const gL = actor.bones['Arm.L'].localToWorld(V(0.5 * S, y, 0)), gR = actor.bones['Arm.R'].localToWorld(V(-0.5 * S, y, 0));
  const h = prop.userData.handles ?? { L: V(0.4, 0, 0), R: V(-0.4, 0, 0) };
  const parent = opts.parent ?? actor.root.parent;
  if (prop.parent !== parent) parent.add(prop);
  const xw = gL.clone().sub(gR); const span = xw.length(); xw.normalize();
  const zw = new THREE.Vector3().crossVectors(xw, UP).normalize(); if (zw.lengthSq() < 1e-6) zw.set(0, 0, 1);
  const yw = new THREE.Vector3().crossVectors(zw, xw).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xw, yw, zw));
  if (opts.tilt) q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), opts.tilt));
  const midLocal = h.L.clone().add(h.R).multiplyScalar(0.5 * sc);
  const pos = gL.clone().add(gR).multiplyScalar(0.5).sub(midLocal.applyQuaternion(q));
  setWorld(prop, pos, q, sc);
  prop.updateMatrixWorld(true);
  return Math.abs(span - h.L.distanceTo(h.R) * sc);
}

// reach2(actor, width, pitch): pose both arms forward by pitch (radians, negative = raised) and swing them in until the
// two fists are `width` studs apart (grip to grip; given a prop, its handle span plus a fist so the fists pinch its edges) - e.g. reach2(max, plate, -1.1) then carry2(plate, max). Pass the prop
// instead of a number to use its handle spacing. Returns the inward angle (Arm.L rotation.z; Arm.R gets the negative).
export function reach2(actor, width, pitch = -1.2) {
  if (typeof width !== 'number') { const h = width.userData.handles; width = h.L.distanceTo(h.R) * (width.scale?.x ?? 1) + 0.9 * (actor.scale ?? 1); } // fists pinch the edges: their centres sit just outside the handles
  const S = actor.scale ?? 1, set = (a) => { actor.bones['Arm.L'].rotation.set(pitch, 0, a); actor.bones['Arm.R'].rotation.set(pitch, 0, -a); actor.root.updateMatrixWorld(true);
    return actor.bones['Arm.L'].localToWorld(V(0.5 * S, -1.3 * S, 0)).distanceTo(actor.bones['Arm.R'].localToWorld(V(-0.5 * S, -1.3 * S, 0))); };
  const sgn = set(0.2) < set(0) ? 1 : -1; let lo = 0, hi = 1.3;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (set(sgn * m) > width) lo = m; else hi = m; }
  set(sgn * (lo + hi) / 2); return sgn * (lo + hi) / 2;
}

// ---------- worn props ----------
// Head measurements (head-bone frame) from the actor's own Head + Hair meshes, cached per actor.
function headPoints(actor) {
  if (actor._propHead) return actor._propHead;
  const head = actor.bones.Head, pts = [];
  head.updateMatrixWorld(true);
  head.traverse((m) => {
    if (!m.isMesh || !m.visible || !(m.name === 'Head' || m.name === 'Hair' || /hair/i.test(m.name))) return;
    const p = m.geometry.attributes.position, v = V(0, 0, 0), toHead = new THREE.Matrix4().copy(head.matrixWorld).invert().multiply(m.matrixWorld);
    for (let i = 0; i < p.count; i += Math.max(1, (p.count / 4000) | 0)) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(toHead).clone());
  });
  let cy = 0, top = -Infinity; for (const p of pts) top = Math.max(top, p.y);
  const S = actor.scale ?? 1; cy = 0.5 * S; // head centre: 0.5 above the neck pivot
  return (actor._propHead = { pts, top, cy, S });
}
// wearOnHead(prop, actor, opts): attach to the Head bone.
//   pumpkin_bucket: upside down over the crown, rim at the brows (opts.rim, studs above head centre, default 0.55 * scale),
//     sized so no hair pokes through above the rim; opts.tilt [x, z] radians for crooked; the handle hangs as a chin strap.
//   cobweb (or anything else): on the hair surface at opts.spot 'left' (default) | 'top' | 'right', facing out.
export function wearOnHead(prop, actor, opts = {}) {
  const H = headPoints(actor), head = actor.bones.Head, S = H.S;
  if (prop.parent !== head) head.add(prop);
  if (prop.userData.id === 'pumpkin_bucket') {
    const rimY = H.cy + (opts.rim ?? 0.55) * S; let rad = 0;
    for (const p of H.pts) if (p.y > rimY - 0.05 * S) rad = Math.max(rad, Math.hypot(p.x, p.z * 1.0));
    const need = Math.max(rad * 1.04 + 0.02, 0.3), k = need / prop.userData.rimR, depth = H.top - rimY + 0.06;
    const ky = Math.max(k * 0.9, depth / (prop.userData.height * 0.92));
    const body = prop.userData.body; body.rotation.set(0, 0, Math.PI); body.position.set(0, prop.userData.height, 0); // Rz(180): rim at y 0, dome up, face still +z
    prop.userData.handle.rotation.set(-1.25, 0, 0); // flipped with the body it hangs below the rim, swung back behind the head
    prop.position.set(0, rimY, 0); prop.scale.set(k, ky, k);
    prop.rotation.set(opts.tilt?.[0] ?? 0, opts.yaw ?? 0, opts.tilt?.[1] ?? 0);
    prop.userData.worn = { k, ky, rimY };
  } else {
    const spot = opts.spot ?? 'left', dir = (spot === 'top' ? V(0, 1, 0.15) : spot === 'right' ? V(-0.75, 0.75, 0.1) : V(0.75, 0.75, 0.1)).normalize();
    let best = null, bd = -Infinity; const c = V(0, H.cy, 0);
    for (const p of H.pts) { const d = p.clone().sub(c).dot(dir); if (d > bd) { bd = d; best = p; } }
    prop.position.copy(best).addScaledVector(dir, 0.07 * S);
    prop.quaternion.setFromUnitVectors(V(0, 0, 1), dir); prop.rotateZ(opts.spin ?? 0.4);
    prop.scale.setScalar((opts.scale ?? 1) * S);
  }
  prop.updateMatrixWorld(true);
  return prop;
}
// wearWrist(band, actor, hand): a glow_band round the wrist (arm bone, 1.05 below the shoulder pivot... just above the fist).
export function wearWrist(band, actor, hand = 'R', opts = {}) {
  const sd = sideOf(hand), S = actor.scale ?? 1, bone = actor.bones['Arm.' + sd];
  if (band.parent !== bone) bone.add(band);
  band.position.set(sd === 'R' ? -0.5 * S : 0.5 * S, (opts.y ?? -0.95) * S, 0); band.rotation.set(0, opts.spin ?? 0.3, 0); band.scale.setScalar(S);
  band.updateMatrixWorld(true);
  return band;
}
// glowBands(actor, opts): both wrists at once; returns [left, right].
export function glowBands(actor, opts = {}) { return ['L', 'R'].map((h) => wearWrist(makeProp('glow_band', opts), actor, h, opts)); }
