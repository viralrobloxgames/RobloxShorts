// kit-sets-b: the attic (Ch2 top of the ladder, Ch5, Ch7, Ch8, Ch9). World offset (600, 0, 0); the attic floor is y 0.
// Layout (local studs; the group sits at OFFSET; marks and cams are returned in world coordinates):
//   a gabled room x -13..13, z -10..14; the ridge (y 13) runs along z, the knee walls at x = +-13 are 3 high.
//   back gable wall z -10: the round window (centre y 7.2, r 1.9); Skye's nest under it (x 0, z -8).
//   right side (x > 0): the HALLOWEEN box (6.2, -6.7) with the skeleton (3.6, -3.5) and the witch (8.9, -3.5) standing
//     in front of it (the Ch7 pose mark is between them), XMAS (10, 0.5), MAX - OLD STUFF (9.2, 4.4), the hobby horse
//     leaning on XMAS; the floor hatch (centre 4.5, 9.0; hole x 2.2..6.8, z 7.3..10.7) with the ladder going down,
//     the vacuum spot beside it (7.8, 10.6).
//   left side: the upturned box table (-3.5, 2) with the tea places round it, the rocking chair (-8, -4).
// Lights (`lights`): sun (warm spot through the round window + additive shafts), moon (cold spot + shafts),
// hatchGlow (light coming up from the hallway), flashlight (Skye's small flashlight standing on end, Ch8), glow (glow
// sticks). setState({ time }) switches them; the stage-wide preset comes from lighting.js.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../../../web/lib/world.js';
import { roundedBox } from '../../../../../web/lib/rig.js';
import { makeProp, place } from '../props.js';

// a kit prop (props.js) standing with its rest point on the holder's origin; the attic's own builder if props.js lacks it
function kitProp(id, opts, fallback) {
  const h = new THREE.Group();
  try { const p = makeProp(id, opts); place(p, V(0, 0, 0), 0); h.add(p); h.userData.prop = p; }
  catch (e) { h.add(fallback()); }
  return h;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const OFFSET = V(600, 0, 0);
export const RIDGE = 13, EAVE = 3, HALF = 13, Z0 = -10, Z1 = 14;
const SLOPE = (RIDGE - EAVE) / HALF;
export const roofY = (x) => RIDGE - SLOPE * Math.abs(x);       // underside of the roof at local x
export const WINDOW = V(0, 7.2, Z0), WIN_R = 1.9;
export const HATCH = { x0: 2.2, x1: 6.8, z0: 7.3, z1: 10.7, c: V(4.5, 0, 9.0) };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
  const b = new THREE.Mesh(r ? roundedBox(w, h, d, r) : new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b;
}
function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, n = 20) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; return c; }
function sph(r, m, x = 0, y = 0, z = 0, n = 20) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, n, Math.max(8, n * 0.6 | 0)), m); s.position.set(x, y, z); s.castShadow = s.receiveShadow = true; return s; }
const grp = (...kids) => { const g = new THREE.Group(); kids.forEach((k) => g.add(k)); return g; };
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

// ---------- textures ----------
function planks(w, h, { base = '#8b6a48', n = 8, seed = 3, vertical = false } = {}) {
  return canvasTexture(w, h, (c, W, H) => {
    const r = rng(seed); c.fillStyle = base; c.fillRect(0, 0, W, H);
    const L = vertical ? W : H, step = L / n;
    for (let i = 0; i < n; i++) {
      const l = 40 + r() * 14, hue = 26 + r() * 8;
      c.fillStyle = `hsl(${hue},${34 + r() * 10}%,${l - 10}%)`;
      if (vertical) c.fillRect(i * step, 0, step, H); else c.fillRect(0, i * step, W, step);
      for (let k = 0; k < 40; k++) {           // grain
        c.strokeStyle = `hsla(${hue},40%,${l - 22}%,${0.12 + r() * 0.15})`; c.lineWidth = 1 + r() * 2; c.beginPath();
        if (vertical) { const x = i * step + r() * step; c.moveTo(x, 0); c.lineTo(x + (r() - 0.5) * 6, H); }
        else { const y = i * step + r() * step; c.moveTo(0, y); c.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 6, W * 0.6, y + (r() - 0.5) * 6, W, y + (r() - 0.5) * 4); }
        c.stroke();
      }
      c.fillStyle = 'rgba(30,18,10,.55)';
      if (vertical) c.fillRect(i * step, 0, 3, H); else c.fillRect(0, i * step, W, 3);
      for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(40,25,12,.6)'; const x = r() * W, y = r() * H; c.fillRect(x, y, 4, 4); }   // nails
    }
    for (let k = 0; k < 400; k++) { c.fillStyle = `rgba(255,240,220,${r() * 0.05})`; c.fillRect(r() * W, r() * H, 6 + r() * 30, 2 + r() * 8); }   // dust
  });
}
const LG = (c, text, x, y, px, color) => { c.font = `${px}px "Luckiest Guy", Montserrat, sans-serif`; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y); };
function cardboard(seed = 1) {
  return canvasTexture(256, 256, (c, W, H) => {
    const r = rng(seed); c.fillStyle = '#c19a64'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${90 + r() * 40},${60 + r() * 30},30,${r() * 0.12})`; c.fillRect(r() * W, r() * H, 2 + r() * 20, 1 + r() * 3); }
    c.fillStyle = 'rgba(80,55,25,.25)'; c.fillRect(0, H * 0.48, W, 6);
  });
}
// the marker-pen label on a box: big, dark, readable at 1080p from the wides
function boxLabel(text, w, h, { ink = '#1d1a18', tape = null } = {}) {
  const tex = canvasTexture(1024, Math.round(1024 * h / w), (c, W, H) => {
    c.clearRect(0, 0, W, H);
    if (tape) { c.fillStyle = tape; c.globalAlpha = 0.85; c.fillRect(W * 0.04, H * 0.12, W * 0.92, H * 0.76); c.globalAlpha = 1; }
    let px = H * 0.62; c.font = `${px}px "Luckiest Guy", Montserrat, sans-serif`;
    while (c.measureText(text).width > W * 0.86 && px > 10) { px -= 4; c.font = `${px}px "Luckiest Guy", Montserrat, sans-serif`; }
    LG(c, text, W / 2, H / 2 + px * 0.06, px, ink);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: tex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.receiveShadow = true; return m;
}

const DOT = canvasTexture(32, 32, (c, W) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
// ---------- light shafts (additive, soft edges, fade along the beam) ----------
const SHAFT_VERT = `varying vec3 vN; varying vec3 vV; varying float vU; uniform float len;
void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz);
  vU = 0.5 - position.y/len; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const SHAFT_FRAG = `uniform vec3 color; uniform float strength; varying vec3 vN; varying vec3 vV; varying float vU;
void main(){ float edge = pow(abs(dot(normalize(vN), vV)), 2.0); float fade = smoothstep(0.0, 0.08, vU) * pow(1.0 - vU, 1.3);
  gl_FragColor = vec4(color * edge * fade * strength, 1.0); }`;
function shaft(from, dir, len, r0, r1, color, strength) {
  const geo = new THREE.CylinderGeometry(r1, r0, len, 40, 1, true);         // top = window end (r0) at +y
  const m = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(color) }, strength: { value: strength }, len: { value: len } },
    vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  // CylinderGeometry: +y is the r1? (radiusTop = r1 here so the far end is wide); flip so +y = window
  geo.rotateX(Math.PI);
  const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = false; mesh.renderOrder = 4;
  const d = dir.clone().normalize();
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().negate());
  mesh.position.copy(from).addScaledVector(d, len / 2);
  return mesh;
}
function motes(from, dir, len, r, color, n, seed) {
  const r_ = rng(seed), pts = [], d = dir.clone().normalize();
  const a = new THREE.Vector3(1, 0, 0).cross(d).normalize(), b = d.clone().cross(a).normalize();
  for (let i = 0; i < n; i++) {
    const u = 0.08 + r_() * 0.8, rr = r * (0.4 + u * 0.9) * Math.sqrt(r_()), th = r_() * Math.PI * 2;
    pts.push(from.clone().addScaledVector(d, u * len).addScaledVector(a, Math.cos(th) * rr).addScaledVector(b, Math.sin(th) * rr));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.03, map: DOT, alphaTest: 0.01, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.renderOrder = 5; return p;
}

// ---------- props built here (kit-props versions replace them where props.js has them) ----------
function teddyToy(color, seed) {          // the attic's own old toys at the tea party (Lily's teddy comes from the cast)
  const m = std(color, { roughness: 1 }), dark = std('#1b1410', { roughness: 0.5 });
  const g = grp(sph(0.42, m, 0, 0.42, 0), sph(0.3, m, 0, 1.02, 0.02), sph(0.11, m, -0.22, 1.27, 0), sph(0.11, m, 0.22, 1.27, 0),
    sph(0.13, m, -0.34, 0.5, 0.12), sph(0.13, m, 0.34, 0.5, 0.12), sph(0.14, m, -0.2, 0.1, 0.28), sph(0.14, m, 0.2, 0.1, 0.28),
    sph(0.035, dark, -0.1, 1.08, 0.27), sph(0.035, dark, 0.1, 1.08, 0.27), sph(0.05, dark, 0, 0.98, 0.3));
  if (seed === 2) { g.add(box(0.12, 0.45, 0.06, m, -0.12, 1.45, 0, 0.05), box(0.12, 0.45, 0.06, m, 0.12, 1.45, 0, 0.05)); g.children[2].visible = g.children[3].visible = false; }   // a bunny
  return g;
}
function teapot() {
  const m = std('#f3e6ee', { roughness: 0.3 }), rose = std('#e98ab5', { roughness: 0.35 });
  const body = sph(0.32, m, 0, 0.3, 0); body.scale.y = 0.82;
  const spout = cyl(0.04, 0.07, 0.36, m, 0.36, 0.34, 0); spout.rotation.z = -0.9;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 20, Math.PI * 1.2), m); handle.position.set(-0.33, 0.33, 0); handle.rotation.z = Math.PI * 0.4;
  return grp(body, spout, handle, cyl(0.16, 0.2, 0.06, rose, 0, 0.56, 0), sph(0.06, rose, 0, 0.63, 0), cyl(0.2, 0.22, 0.04, rose, 0, 0.3, 0));
}
function teacup() {
  const m = std('#f3e6ee', { roughness: 0.3 }), rose = std('#e98ab5', { roughness: 0.35 });
  const cup = cyl(0.13, 0.09, 0.15, m, 0, 0.1, 0); const tea = cyl(0.115, 0.115, 0.01, std('#8a5a2b', { roughness: 0.2 }), 0, 0.165, 0);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12), m); h.position.set(0.15, 0.1, 0);
  return grp(cyl(0.2, 0.2, 0.02, rose, 0, 0.01, 0), cup, tea, h);
}
function hobbyHorse() {                   // origin at the bottom of the stick, stick along +y, head facing +z
  const wood = std('#b07a46', { roughness: 0.6 }), brown = std('#7b4a2a', { roughness: 0.9 }), mane = std('#2a1a12', { roughness: 1 });
  const head = box(0.5, 0.9, 1.1, brown, 0, 4.15, 0.25, 0.18); head.rotation.x = 0.5;
  const snout = box(0.44, 0.45, 0.55, brown, 0, 3.85, 0.75, 0.15);
  const g = grp(cyl(0.06, 0.06, 3.7, wood, 0, 1.85, 0, 10), head, snout,
    box(0.1, 0.9, 0.24, mane, 0, 4.35, -0.12, 0.04), box(0.12, 0.22, 0.08, brown, -0.15, 4.7, 0.05, 0.03), box(0.12, 0.22, 0.08, brown, 0.15, 4.7, 0.05, 0.03),
    sph(0.06, std('#111'), -0.26, 4.25, 0.42), sph(0.06, std('#111'), 0.26, 4.25, 0.42),
    box(0.54, 0.08, 0.08, std('#c0392b'), 0, 3.9, 0.55), cyl(0.12, 0.12, 0.08, std('#333'), 0, 0.04, 0, 12));
  return g;
}
function pumpkinBucket() {                // origin at its base, opening up
  const o = std('#f28a1d', { roughness: 0.45 }), blk = std('#1a1a1a', { roughness: 0.5 });
  const body = cyl(0.62, 0.55, 0.85, o, 0, 0.42, 0, 24); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 28), o); rim.rotation.x = Math.PI / 2; rim.position.y = 0.85;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), std('#ffffff', { transparent: true, map: canvasTexture(256, 160, (c) => { c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(50, 70); c.lineTo(90, 70); c.lineTo(70, 30); c.fill(); c.beginPath(); c.moveTo(166, 70); c.lineTo(206, 70); c.lineTo(186, 30); c.fill(); c.beginPath(); c.moveTo(40, 100); c.quadraticCurveTo(128, 170, 216, 100); c.lineTo(190, 110); c.lineTo(175, 95); c.lineTo(150, 115); c.lineTo(128, 98); c.lineTo(105, 115); c.lineTo(80, 95); c.lineTo(65, 110); c.closePath(); c.fill(); }) }));
  face.position.set(0, 0.45, 0.61);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.025, 6, 24, Math.PI), blk); handle.position.y = 0.85;
  return grp(body, rim, face, handle, cyl(0.5, 0.5, 0.01, std('#3a1d06'), 0, 0.8, 0));
}
function vacuum() {                       // canister vacuum, origin on the floor, front +z
  const red = std('#c7262e', { roughness: 0.35 }), grey = std('#3b3f45', { roughness: 0.5 }), chrome = std('#c9cdd2', { metalness: 0.8, roughness: 0.25 });
  const body = box(1.0, 0.8, 1.5, red, 0, 0.55, 0, 0.3);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.7, 0.75), V(0, 1.1, 1.2), V(0.4, 0.9, 1.5), V(0.6, 0.4, 1.2)]), 20, 0.09, 8), grey);
  const wand = cyl(0.06, 0.06, 2.6, chrome, 0.7, 1.55, 1.15, 10); wand.rotation.x = -0.1;
  return grp(body, hose, wand, box(0.7, 0.12, 0.3, grey, 0.75, 0.15, 1.0, 0.04), cyl(0.16, 0.16, 0.12, grey, -0.5, 0.16, -0.5), cyl(0.16, 0.16, 0.12, grey, 0.5, 0.16, -0.5));
}
function glowBundle() {
  const cols = ['#57ff6a', '#57ff6a', '#ff5bd1', '#57ff6a', '#ffe84d', '#5bc7ff', '#57ff6a'];
  const g = new THREE.Group(); const r = rng(9);
  cols.forEach((c, i) => { const s = cyl(0.045, 0.045, 1.1, std(c, { emissive: c, emissiveIntensity: 0.25, roughness: 0.3 }), (i - 3) * 0.1, 0.06, (r() - 0.5) * 0.1, 8); s.rotation.z = Math.PI / 2; s.rotation.y = (r() - 0.5) * 0.4; g.add(s); });
  g.add(box(0.12, 0.13, 0.75, std('#e8e2c8'), 0, 0.07, 0));        // rubber band / label
  return g;
}
function drawing() {
  const tex = canvasTexture(512, 460, (c, W, H) => {
    c.fillStyle = '#fbf6e6'; c.fillRect(0, 0, W, H);
    c.lineCap = 'round'; c.lineWidth = 7;
    const kid = (x, hair) => { c.strokeStyle = '#2b2b2b'; c.beginPath(); c.arc(x, 120, 34, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x, 154); c.lineTo(x, 250); c.moveTo(x, 250); c.lineTo(x - 30, 320); c.moveTo(x, 250); c.lineTo(x + 30, 320); c.stroke();
      c.strokeStyle = hair; c.lineWidth = 12; c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(x + i * 10, 92); c.lineTo(x + i * 13, 68); } c.stroke(); c.lineWidth = 7; };
    kid(170, '#ff7ac8'); kid(340, '#5a3a22');
    c.strokeStyle = '#2b2b2b'; c.beginPath(); c.moveTo(170, 190); c.lineTo(120, 230); c.moveTo(170, 190); c.lineTo(255, 205); c.lineTo(340, 190); c.moveTo(340, 190); c.lineTo(390, 230); c.stroke();
    c.fillStyle = '#f2c230'; c.beginPath(); c.arc(455, 55, 32, 0, 7); c.fill();
    c.font = '40px "Luckiest Guy", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#3157d6'; c.fillText('ME AND SKYE.', W / 2, 385); c.fillStyle = '#e0362c'; c.fillText('BEST FRENDS.', W / 2, 440);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.35), std('#ffffff', { map: tex, roughness: 0.95, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return grp(m);
}
function backpack() {                     // lilac, lying in the nest
  const l = std('#b59ae0', { roughness: 0.8 }), d = std('#8f73c2', { roughness: 0.8 });
  return grp(box(1.3, 1.6, 0.7, l, 0, 0.8, 0, 0.3), box(1.0, 0.7, 0.25, d, 0, 0.6, 0.42, 0.12), box(0.14, 1.3, 0.1, d, -0.35, 0.85, -0.38, 0.04), box(0.14, 1.3, 0.1, d, 0.35, 0.85, -0.38, 0.04), box(0.9, 0.06, 0.06, std('#e8e2f8', { metalness: 0.5 }), 0, 1.3, 0.36));
}
function flashlightSmall() {              // her small pink flashlight; origin at its base, beam along +y
  const p = std('#ff7ab8', { roughness: 0.35 });
  return grp(cyl(0.11, 0.11, 0.62, p, 0, 0.31, 0, 14), cyl(0.15, 0.12, 0.2, p, 0, 0.72, 0, 14), cyl(0.13, 0.13, 0.02, std('#fff6d8', { emissive: '#fff2c8', emissiveIntensity: 0 }), 0, 0.83, 0, 14));
}

// ---------- big set pieces ----------
function skeleton() {                     // Halloween decoration, ~5.4 tall, on a little stand; faces +z
  const b = std('#b3aa94', { roughness: 0.9 }), k = std('#1b1b1b', { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(cyl(0.6, 0.7, 0.12, k, 0, 0.06, 0), cyl(0.05, 0.05, 2.6, k, 0, 1.3, -0.25, 8));
  const skull = box(0.95, 0.95, 0.95, b, 0, 4.75, 0, 0.3); g.add(skull);
  g.add(box(0.2, 0.22, 0.05, k, -0.2, 4.85, 0.47), box(0.2, 0.22, 0.05, k, 0.2, 4.85, 0.47), box(0.08, 0.12, 0.05, k, 0, 4.66, 0.48), box(0.5, 0.06, 0.05, k, 0, 4.48, 0.47));
  g.add(cyl(0.07, 0.07, 1.9, b, 0, 3.2, -0.1, 8));             // spine
  for (let i = 0; i < 4; i++) { const w = 1.3 - i * 0.12; g.add(box(w, 0.1, 0.55, b, 0, 3.95 - i * 0.28, 0, 0.04)); }
  g.add(box(0.9, 0.3, 0.45, b, 0, 2.25, 0, 0.1));              // pelvis
  for (const s of [-1, 1]) {
    g.add(box(0.14, 1.0, 0.14, b, s * 0.82, 3.45, 0, 0.05), box(0.12, 0.95, 0.12, b, s * 0.92, 2.5, 0.12, 0.05), sph(0.1, b, s * 0.95, 1.98, 0.2));   // arms
    g.add(box(0.16, 1.05, 0.16, b, s * 0.28, 1.6, 0, 0.05), box(0.14, 0.95, 0.14, b, s * 0.28, 0.62, 0, 0.05), box(0.24, 0.1, 0.4, b, s * 0.28, 0.17, 0.12, 0.04));
  }
  g.add(box(1.75, 0.16, 0.3, b, 0, 4.0, 0, 0.06));             // shoulders
  return g;
}
function witch() {                        // Halloween decoration, ~5.6 tall with the hat; faces +z; a broom at her side
  const robe = std('#3a2348', { roughness: 0.9 }), blk = std('#141414', { roughness: 0.7 }), skin = std('#7ec850', { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(cyl(0.6, 0.7, 0.12, blk, 0, 0.06, 0));
  const dress = cyl(0.45, 1.0, 2.9, robe, 0, 1.55, 0, 24); g.add(dress);
  g.add(box(1.5, 0.5, 0.75, robe, 0, 3.05, 0, 0.18));
  for (const s of [-1, 1]) g.add(box(0.4, 1.5, 0.45, robe, s * 0.88, 2.5, 0.05, 0.12), box(0.3, 0.3, 0.3, skin, s * 0.88, 1.7, 0.1, 0.08));
  g.add(box(0.95, 0.95, 0.95, skin, 0, 3.8, 0, 0.25));         // block head
  g.add(box(0.14, 0.14, 0.04, blk, -0.2, 3.9, 0.48), box(0.14, 0.14, 0.04, blk, 0.2, 3.9, 0.48), box(0.16, 0.3, 0.2, skin, 0, 3.72, 0.55, 0.05));
  g.add(box(0.42, 0.06, 0.04, blk, 0, 3.53, 0.48));
  g.add(box(1.25, 0.9, 0.4, std('#202020', { roughness: 0.9 }), 0, 3.7, -0.4, 0.15));   // hair
  g.add(cyl(1.0, 1.0, 0.08, blk, 0, 4.3, 0, 28));
  const cone = cyl(0.02, 0.55, 1.3, blk, 0, 5.0, -0.05, 20); cone.rotation.x = -0.15; g.add(cone);
  g.add(cyl(0.56, 0.56, 0.14, std('#7a3fb0', { roughness: 0.6 }), 0, 4.42, 0, 24));
  const broom = grp(cyl(0.05, 0.05, 4.2, std('#8a5a2b'), 0, 2.1, 0, 8), cyl(0.1, 0.38, 0.9, std('#d8b45a', { roughness: 1 }), 0, 0.45, 0, 12));
  broom.position.set(1.15, 0.05, 0.25); broom.rotation.z = -0.08; g.add(broom);
  return g;
}
function rockingChair() {                 // seat top y 1.6, seat centre at origin, faces +z
  const w = std('#6e4527', { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(box(2.0, 0.18, 1.8, w, 0, 1.5, 0, 0.05), box(1.8, 0.1, 1.6, std('#a8433a', { roughness: 1 }), 0, 1.63, 0.02, 0.08));
  for (const s of [-1, 1]) {
    const rock = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.09, 8, 40, 0.75), w); rock.rotation.y = Math.PI / 2; rock.rotation.z = Math.PI * 1.5 - 0.375; rock.position.set(s * 0.85, 4.1, 0); rock.castShadow = true; g.add(rock);
    g.add(box(0.14, 1.35, 0.14, w, s * 0.85, 0.82, 0.75), box(0.14, 1.35, 0.14, w, s * 0.85, 0.82, -0.75));
    g.add(box(0.14, 3.3, 0.16, w, s * 0.85, 2.95, -0.9), box(0.16, 0.12, 1.7, w, s * 0.95, 2.45, -0.05), box(0.12, 0.85, 0.12, w, s * 0.95, 2.0, 0.75));
  }
  for (let i = -2; i <= 2; i++) g.add(box(0.09, 2.6, 0.09, w, i * 0.3, 2.9, -0.9));
  g.add(box(1.84, 0.25, 0.16, w, 0, 4.5, -0.9, 0.05), box(1.84, 0.14, 0.14, w, 0, 1.75, -0.9));
  return g;
}
// a cardboard box with a readable label and two lid flaps that open (flaps hinge on the long top edges)
function cardBox(w, h, d, text, { seed = 1, tape = null, ink } = {}) {
  const tex = cardboard(seed), m = std('#c19a64', { map: tex, roughness: 0.95 }), inner = std('#7a5a34', { roughness: 1, side: THREE.DoubleSide });
  const g = new THREE.Group(), t = 0.06;
  g.add(box(w, t, d, m, 0, t / 2, 0), box(w, h, t, m, 0, h / 2, d / 2 - t / 2), box(w, h, t, m, 0, h / 2, -d / 2 + t / 2), box(t, h, d, m, w / 2 - t / 2, h / 2, 0), box(t, h, d, m, -w / 2 + t / 2, h / 2, 0));
  const inside = box(w - 0.2, 0.02, d - 0.2, inner, 0, h * 0.6, 0); inside.name = 'contents_top'; g.add(inside);   // what's inside reaches up to here
  const flaps = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(0, h, s * d / 2);
    const f = box(w - 0.02, 0.05, d / 2, m, 0, 0.02, -s * d / 4); hinge.add(f); hinge.userData.s = s; g.add(hinge); flaps.push(hinge);
  }
  g.add(box(0.06, 0.02, d + 0.02, std('#d8c9a0', { roughness: 0.4 }), 0, h + 0.05, 0));   // tape strip (hidden when open)
  const lab = boxLabel(text, w * 0.92, Math.min(h * 0.5, 0.9), { tape, ink }); lab.position.set(0, h * 0.58, d / 2 + 0.01); g.add(lab);
  const lab2 = boxLabel(text, d * 0.92, Math.min(h * 0.45, 0.8), { tape, ink }); lab2.position.set(-w / 2 - 0.01, h * 0.58, 0); lab2.rotation.y = -Math.PI / 2; g.add(lab2);
  g.userData = { w, h, d, flaps, tape: g.children[g.children.length - 3] };
  g.userData.setOpen = (k) => { flaps.forEach((f) => { f.rotation.x = f.userData.s * k * 2.0; }); g.children.find((c) => c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.02 && c.position.y > h).visible = k < 0.05; };
  return g;
}
function gableShape(withWindow) {
  const s = new THREE.Shape(); s.moveTo(-HALF - 0.4, 0); s.lineTo(HALF + 0.4, 0); s.lineTo(HALF + 0.4, EAVE - 0.3); s.lineTo(0, RIDGE + 0.4); s.lineTo(-HALF - 0.4, EAVE - 0.3); s.closePath();
  if (withWindow) { const h = new THREE.Path(); h.absarc(WINDOW.x, WINDOW.y, WIN_R, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}

// ======================================================= build =======================================================
export function build(scene) {
  const group = new THREE.Group(); group.name = 'attic'; group.position.copy(OFFSET); scene.add(group);
  const items = {};
  const add = (name, o, parent = group) => { o.name = name; parent.add(o); items[name] = o; o.traverse((m) => { if (m.isMesh && m.castShadow !== false && !m.material.blending) m.castShadow = true; }); return o; };

  // floor: planks, with the hatch hole
  const floorTex = planks(1024, 1024, { n: 10, seed: 4 }); floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  const floorMat = (rx, rz) => { const t = floorTex.clone(); t.needsUpdate = true; t.repeat.set(rx / 8, rz / 8); return std('#ffffff', { map: t, roughness: 0.85 }); };
  const slab = (x0, x1, z0, z1) => { const b = box(x1 - x0, 0.4, z1 - z0, floorMat(x1 - x0, z1 - z0), (x0 + x1) / 2, -0.2, (z0 + z1) / 2); return b; };
  const floor = grp(slab(-HALF, HATCH.x0, Z0, Z1), slab(HATCH.x1, HALF, Z0, Z1), slab(HATCH.x0, HATCH.x1, Z0, HATCH.z0), slab(HATCH.x0, HATCH.x1, HATCH.z1, Z1));
  add('floor', floor);
  // the hatch frame (trim round the hole) and the shaft below with the ladder
  const trim = std('#5e4128', { roughness: 0.7 });
  add('hatch_frame', grp(box(HATCH.x1 - HATCH.x0 + 0.4, 0.08, 0.2, trim, HATCH.c.x, 0.04, HATCH.z0 - 0.1), box(HATCH.x1 - HATCH.x0 + 0.4, 0.08, 0.2, trim, HATCH.c.x, 0.04, HATCH.z1 + 0.1),
    box(0.2, 0.08, HATCH.z1 - HATCH.z0, trim, HATCH.x0 - 0.1, 0.04, HATCH.c.z), box(0.2, 0.08, HATCH.z1 - HATCH.z0, trim, HATCH.x1 + 0.1, 0.04, HATCH.c.z)));
  const shaftM = std('#d9cfbf', { roughness: 0.95 });
  add('hatch_shaft', grp(box(0.2, 1.2, HATCH.z1 - HATCH.z0, shaftM, HATCH.x0 - 0.1, -1.0, HATCH.c.z), box(0.2, 1.2, HATCH.z1 - HATCH.z0, shaftM, HATCH.x1 + 0.1, -1.0, HATCH.c.z),
    box(HATCH.x1 - HATCH.x0, 1.2, 0.2, shaftM, HATCH.c.x, -1.0, HATCH.z0 - 0.1), box(HATCH.x1 - HATCH.x0, 1.2, 0.2, shaftM, HATCH.c.x, -1.0, HATCH.z1 + 0.1),
    box(16, 0.2, 16, std('#8d7a62', { roughness: 0.9 }), HATCH.c.x, -10.2, HATCH.c.z + 2), box(16, 9, 0.2, std('#e6dccb'), HATCH.c.x, -5.7, HATCH.c.z - 5)));    // the hallway below: its floor and a wall
  const ladder = new THREE.Group(), lw = std('#b98a55', { roughness: 0.6 });
  const top = V(0, 0, HATCH.z0 + 0.25), bot = V(0, -10, HATCH.z0 + 5.2), len = top.distanceTo(bot), ang = Math.atan2(bot.z - top.z, top.y - bot.y);
  for (const s of [-1, 1]) { const r = box(0.16, len, 0.3, lw, s * 1.15, 0, 0); ladder.add(r); }
  for (let i = 1; i < 12; i++) ladder.add(box(2.3, 0.1, 0.32, lw, 0, -len / 2 + i * len / 12, 0));
  ladder.position.set(HATCH.c.x, (top.y + bot.y) / 2, (top.z + bot.z) / 2); ladder.rotation.x = ang;
  add('ladder', ladder);
  // the hatch lid: hinged on the far edge (z1), lifts up toward +z
  const lidHinge = new THREE.Group(); lidHinge.position.set(HATCH.c.x, 0, HATCH.z1);
  const lidT = planks(256, 256, { n: 4, seed: 11, base: '#7b5a3a' });
  lidHinge.add(box(HATCH.x1 - HATCH.x0 - 0.06, 0.18, HATCH.z1 - HATCH.z0 - 0.06, std('#ffffff', { map: lidT, roughness: 0.8 }), 0, -0.09, -(HATCH.z1 - HATCH.z0) / 2));
  lidHinge.add(box(0.5, 0.1, 0.3, std('#333', { metalness: 0.6, roughness: 0.4 }), 0, 0.02, -(HATCH.z1 - HATCH.z0) + 0.4));    // pull ring plate
  add('hatch_lid', lidHinge);

  // walls: two gables (back with the round window), knee walls, roof with boards underneath, rafters, ridge
  const wallTex = planks(1024, 1024, { n: 12, seed: 6, base: '#9b7a55', vertical: true });
  const wallMat = std('#ffffff', { map: wallTex, roughness: 0.9, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(gableShape(true), { depth: 0.5, bevelEnabled: false }), wallMat); back.position.z = Z0 - 0.5; back.castShadow = back.receiveShadow = true;
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(gableShape(false), { depth: 0.5, bevelEnabled: false }), wallMat); front.position.z = Z1; front.castShadow = front.receiveShadow = true;
  [back, front].forEach((w) => { const uv = w.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 12, uv.getY(i) / 12); });
  add('wall_back', back); add('wall_front', front);
  const kneeL = box(0.4, EAVE, Z1 - Z0, wallMat, -HALF - 0.2, EAVE / 2, (Z0 + Z1) / 2), kneeR = box(0.4, EAVE, Z1 - Z0, wallMat, HALF + 0.2, EAVE / 2, (Z0 + Z1) / 2);
  add('wall_left', kneeL); add('wall_right', kneeR);
  const roofTex = planks(1024, 1024, { n: 14, seed: 8, base: '#7d5d3f' }); roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping; roofTex.repeat.set(2, 2.5);
  const roofMat = std('#ffffff', { map: roofTex, roughness: 0.9, side: THREE.DoubleSide });
  const slopeLen = Math.hypot(HALF + 0.6, RIDGE - EAVE + 0.45), slopeAng = Math.atan2(RIDGE - EAVE, HALF);
  for (const s of [-1, 1]) {
    const r = box(slopeLen, 0.3, Z1 - Z0 + 1, roofMat, s * (HALF / 2), (RIDGE + EAVE) / 2 + 0.15, (Z0 + Z1) / 2);
    r.rotation.z = -s * slopeAng; add(s < 0 ? 'roof_left' : 'roof_right', r);
  }
  const beamM = std('#5a3b22', { roughness: 0.75 });
  const rafters = new THREE.Group();
  for (let z = Z0 + 1.2; z < Z1; z += 3.2) for (const s of [-1, 1]) {
    const r = box(slopeLen - 0.4, 0.55, 0.35, beamM, s * (HALF / 2), (RIDGE + EAVE) / 2 - 0.25, z); r.rotation.z = -s * slopeAng; rafters.add(r);
  }
  rafters.add(box(0.45, 0.6, Z1 - Z0, beamM, 0, RIDGE - 0.15, (Z0 + Z1) / 2));                  // ridge beam
  for (const z of [Z0 + 4.4, Z0 + 10.8, Z0 + 17.2]) rafters.add(box(5.0, 0.4, 0.3, beamM, 0, RIDGE - 2.1, z));   // collar ties, high (y ~11)
  add('rafters', rafters);
  // floor joist edge along the knee walls and dust/cobwebs in the corners
  const web = std('#e8e8e8', { transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 1, map: canvasTexture(256, 256, (c, W) => { c.clearRect(0, 0, W, W); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5; for (let i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(W * Math.cos(i / 6 * Math.PI / 2), W * Math.sin(i / 6 * Math.PI / 2)); c.stroke(); } for (let k = 1; k < 7; k++) { c.beginPath(); c.arc(0, 0, k * 36, 0, Math.PI / 2); c.stroke(); } }) });
  const cob = (x, y, z, ry, rz) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), web); m.position.set(x, y, z); m.rotation.set(0, ry, rz); return m; };
  add('cobwebs', grp(cob(-HALF + 0.7, EAVE + 0.3, Z0 + 0.3, 0, -Math.PI / 2 - 0.4), cob(HALF - 0.7, EAVE + 0.3, Z0 + 0.3, 0, 0.4), cob(0.6, RIDGE - 1.0, Z0 + 0.3, 0, Math.PI), cob(-HALF + 0.7, EAVE + 0.3, Z1 - 0.3, Math.PI, -Math.PI / 2 - 0.4)));

  // the round window: frame ring, cross mullions, glass
  const frameM = std('#efe6d6', { roughness: 0.6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(WIN_R + 0.05, 0.2, 12, 48), frameM); ring.position.set(WINDOW.x, WINDOW.y, Z0 + 0.08); ring.castShadow = true;
  const glassMat = std('#ffe2b0', { transparent: true, opacity: 0.18, roughness: 0.05, emissive: '#ffd59a', emissiveIntensity: 0.6, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.CircleGeometry(WIN_R, 48), glassMat); glass.position.set(WINDOW.x, WINDOW.y, Z0 - 0.25);
  add('window', grp(ring, box(0.14, WIN_R * 2, 0.14, frameM, WINDOW.x, WINDOW.y, Z0 - 0.2), box(WIN_R * 2, 0.14, 0.14, frameM, WINDOW.x, WINDOW.y, Z0 - 0.2), glass,
    box(WIN_R * 2 + 0.6, 0.18, 0.5, frameM, WINDOW.x, WINDOW.y - WIN_R - 0.25, Z0 + 0.2)));
  // outside the window: a sky disc (afternoon / night) so the window never shows the hallway or the void
  const outsideMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', fog: false });
  const outside = new THREE.Mesh(new THREE.CircleGeometry(WIN_R * 3, 32), outsideMat); outside.position.set(WINDOW.x, WINDOW.y, Z0 - 3.0); add('window_sky', outside);
  const branch = grp(box(5, 0.22, 0.22, std('#2b1d14'), -0.5, WINDOW.y + 0.9, Z0 - 2.4), box(1.8, 0.14, 0.14, std('#2b1d14'), 1.0, WINDOW.y + 1.5, Z0 - 2.4)); branch.children[1].rotation.z = 0.6;
  add('window_branch', branch);

  // ---------- Skye's nest (under the window) ----------
  const nest = new THREE.Group(); nest.position.set(0, 0, -7.7); add('nest', nest);
  const quilt = canvasTexture(256, 256, (c, W) => { const cols = ['#6f8fb8', '#9db6d1', '#c9a26b', '#7f9f7a', '#b8746f', '#e6dcc2']; const r = rng(21); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(i * 32, j * 32, 32, 32); } c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([4, 4]); for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, W); c.moveTo(0, i * 32); c.lineTo(W, i * 32); c.stroke(); } });
  const b1 = box(5.2, 0.16, 3.8, std('#ffffff', { map: quilt, roughness: 1 }), 0, 0.08, 0.1, 0.06); b1.rotation.y = 0.06;
  const b2 = box(3.6, 0.22, 2.4, std('#8e3b46', { roughness: 1 }), -0.9, 0.2, -0.4, 0.1); b2.rotation.y = -0.18;
  const roll = cyl(0.35, 0.35, 3.4, std('#8e3b46', { roughness: 1 }), 0.4, 0.4, -1.4, 16); roll.rotation.z = Math.PI / 2; roll.rotation.y = 0.12;
  const pillow = box(1.9, 0.55, 1.15, std('#f2ede2', { roughness: 0.95 }), -1.1, 0.42, -1.25, 0.25); pillow.rotation.y = 0.15;
  nest.add(b1, b2, roll, pillow);
  const crackers = grp(box(0.9, 0.16, 0.55, std('#e8b730', { roughness: 0.5 }), 0, 0.08, 0, 0.04), (() => { const l = boxLabel('CRACKERS', 0.8, 0.3, { ink: '#b2261f' }); l.rotation.x = -Math.PI / 2; l.position.y = 0.17; return l; })(),
    box(0.3, 0.08, 0.12, std('#f0d9a0'), 0.55, 0.05, 0.15, 0.03), box(0.3, 0.08, 0.12, std('#f0d9a0'), 0.5, 0.05, -0.15, 0.03));
  add('crackers', at(crackers, -2.7, 0.18, -0.3, 0.4), nest);
  const fl = kitProp('flashlight_small', { beam: false, light: false }, flashlightSmall); const flKit = fl.userData.prop; add('flashlight', fl, nest);
  const bp = backpack(); add('backpack', at(bp, 2.15, 0.05, -1.2, -0.35), nest);
  const gs = kitProp('glow_sticks', {}, glowBundle); add('glow_sticks', at(gs, 1.6, 0.16, 1.9, 0.5), nest);

  // ---------- Halloween corner: HALLOWEEN box, skeleton, witch ----------
  const hallo = cardBox(3.2, 2.2, 2.6, 'HALLOWEEN', { seed: 2, tape: '#f28a1d', ink: '#111' }); add('box_halloween', at(hallo, 6.2, 0, -6.7, -0.08));
  const skel = skeleton(); add('skeleton', at(skel, 3.6, 0, -3.5, 0.15));
  const wit = witch(); add('witch', at(wit, 8.9, 0, -3.5, -0.2));
  const pump = kitProp('pumpkin_bucket', {}, pumpkinBucket); add('pumpkin_bucket', pump);
  // ---------- XMAS, MAX - OLD STUFF, hobby horse ----------
  const xmas = cardBox(3.0, 2.0, 2.6, 'XMAS', { seed: 3, tape: '#2f8f4e', ink: '#b3121f' }); add('box_xmas', at(xmas, 10.0, 0, 0.5, -0.45));
  add('box_small', at(cardBox(1.8, 1.2, 1.6, '', { seed: 5 }), 10.4, 2.0, 0.3, -0.2));
  const maxBox = cardBox(2.8, 2.0, 2.4, 'MAX - OLD STUFF', { seed: 4, ink: '#1a2a6a' }); add('box_max', at(maxBox, 9.2, 0, 4.6, -0.6));
  const drw = kitProp('drawing', {}, drawing); if (drw.userData.prop) { drw.userData.prop.rotation.x = -Math.PI / 2; drw.userData.prop.position.set(0, 0.01, 0.42); } add('drawing', drw, maxBox); drw.position.set(0, 2.0 * 0.6 + 0.03, 0); drw.rotation.y = 0.1;
  const hh = kitProp('hobby_horse', {}, hobbyHorse); add('hobby_horse', hh);
  // ---------- tea party: upturned box table, teddies, tea set ----------
  const table = new THREE.Group(); table.position.set(-3.5, 0, 2.0);
  const tm = std('#b48d58', { map: cardboard(7), roughness: 0.95 });
  table.add(box(2.6, 1.4, 2.2, tm, 0, 0.7, 0), box(2.62, 0.04, 0.05, std('#8f6c3c'), 0, 1.41, 0), box(0.3, 1.0, 0.04, std('#8f6c3c'), 0.9, 0.7, 1.11));
  add('table_box', table);
  add('teddy_left', at(teddyToy('#c9b18a', 1), -5.6, 0, 2.0, Math.PI / 2));
  add('teddy_right', at(teddyToy('#b9b9c4', 2), -1.4, 0, 2.0, -Math.PI / 2));
  const tea = new THREE.Group(); tea.position.set(-3.5, 1.42, 2.0);
  add('teapot', at(kitProp('teapot', {}, teapot), 0.1, 0, 0.1, 0.4), tea); add('cup_1', at(kitProp('cup', {}, teacup), -0.6, 0, -0.6, Math.PI), tea); add('cup_2', at(kitProp('cup', {}, teacup), 0.6, 0, 0.65), tea);   // cup_1 Skye's side, cup_2 Lily's
  add('tea_set', tea);
  // ---------- rocking chair, vacuum, clutter ----------
  const rc = rockingChair(); const rcPivot = grp(rc); add('rocking_chair', at(rcPivot, -8.0, 0, -4.0, 0.7)); items.rocking_chair_rock = rc;
  const vac = kitProp('vacuum', {}, vacuum); add('vacuum', at(vac, 8.2, 0, 10.4, -2.4));
  const suitcase = grp(box(2.6, 0.9, 1.7, std('#5b6e8f', { roughness: 0.6 }), 0, 0.45, 0, 0.12), box(0.8, 0.12, 0.2, std('#2b2b2b'), 0, 0.95, 0.5, 0.04), box(2.62, 0.1, 1.72, std('#3f4d66'), 0, 0.6, 0));
  add('suitcase', at(suitcase, -10.2, 0, 8.5, 0.3));
  const lampshade = grp(cyl(0.6, 0.9, 0.9, std('#d9c49a', { roughness: 1 }), 0, 2.4, 0, 18), cyl(0.06, 0.06, 2.0, std('#6b5638'), 0, 1.0, 0, 8), cyl(0.5, 0.55, 0.12, std('#6b5638'), 0, 0.06, 0, 18));
  add('old_lamp', at(lampshade, -10.8, 0, 4.0));
  const books = new THREE.Group(); const bc = ['#7a2e2e', '#2e4f7a', '#3f6b3a', '#a2783a', '#5a3a6b']; bc.forEach((c, i) => books.add(box(1.2, 0.22, 0.85, std(c), (i % 2) * 0.12, 0.11 + i * 0.22, 0)));
  add('books', at(books, -9.6, 0, 6.6, 0.5));
  add('box_left', at(cardBox(2.4, 1.6, 2.0, '', { seed: 8 }), -10.6, 0, -1.0, 0.35));
  add('rug_roll', at(grp((() => { const c = cyl(0.4, 0.4, 4.2, std('#7c3b2e', { roughness: 1 }), 0, 0.4, 0, 16); c.rotation.z = Math.PI / 2; return c; })()), -9.2, 0, 11.6, 0.2));

  // ---------- lights ----------
  const sunDir = V(0.15, -0.62, 1).normalize(), moonDir = V(-0.1, -0.85, 1).normalize();
  const sun = new THREE.SpotLight('#ffc37a', 0, 60, 0.2, 0.55, 0.6);
  sun.position.copy(WINDOW).addScaledVector(sunDir, -7); sun.target.position.copy(WINDOW).addScaledVector(sunDir, 14);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0004; sun.shadow.camera.near = 2; sun.shadow.camera.far = 50;
  const moon = new THREE.SpotLight('#9fb8ff', 0, 60, 0.2, 0.55, 0.6);
  moon.position.copy(WINDOW).addScaledVector(moonDir, -7); moon.target.position.copy(WINDOW).addScaledVector(moonDir, 10);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0004; moon.shadow.camera.near = 2; moon.shadow.camera.far = 40;
  group.add(sun, sun.target, moon, moon.target);
  const bounce = new THREE.PointLight('#ffb36b', 0, 26, 1.4); bounce.position.set(0.5, 3.5, 3.5); group.add(bounce);      // warm bounce off the lit floor
  const hatchGlow = new THREE.PointLight('#ffe7c4', 0, 14, 1.5); hatchGlow.position.set(HATCH.c.x, -2.5, HATCH.c.z); group.add(hatchGlow);
  const flashL = new THREE.PointLight('#fff0d0', 0, 9, 1.6); flashL.position.set(0, 1.4, 0); fl.add(flashL);
  const flashCone = new THREE.SpotLight('#fff0d0', 0, 16, 0.5, 0.6, 1.2); flashCone.position.set(0, 0.85, 0); flashCone.target.position.set(0, 10, 0); fl.add(flashCone, flashCone.target);
  const glowL = new THREE.PointLight('#5cff7a', 0, 6, 1.8); glowL.position.set(0, 0.4, 0); gs.add(glowL);
  const shaftSun = shaft(WINDOW.clone().add(V(0, 0, 0.2)), sunDir, 17, WIN_R * 0.95, WIN_R * 1.5, '#ffbe73', 0.32);
  const shaftSun2 = shaft(WINDOW.clone().add(V(0, 0, 0.2)), sunDir, 15, WIN_R * 0.6, WIN_R * 0.9, '#ffd59a', 0.22);
  const motesSun = motes(WINDOW.clone().add(V(0, 0, 0.3)), sunDir, 14, WIN_R * 1.1, '#ffe2b0', 220, 31);
  const shaftMoon = shaft(WINDOW.clone().add(V(0, 0, 0.2)), moonDir, 10, WIN_R * 0.95, WIN_R * 1.35, '#8fb0ff', 0.22);
  add('shafts_sun', grp(shaftSun, shaftSun2, motesSun)); add('shafts_moon', grp(shaftMoon));
  const lights = { sun, moon, bounce, hatchGlow, flashlight: flashL, flashlightCone: flashCone, glow: glowL, shafts: { sun: items.shafts_sun, moon: items.shafts_moon } };
  group.traverse((o) => { if (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending) o.castShadow = false; });
  [shaftSun, shaftSun2, shaftMoon].forEach((m) => { m.castShadow = false; });
  // camera clearance (camera.js clearShot) ignores light shafts, dust motes, cobwebs, window glass and the sky disc
  for (const n of ['shafts_sun', 'shafts_moon', 'cobwebs', 'window_sky', 'window_branch']) items[n].traverse((o) => { o.userData.noCamBlock = true; });
  glass.userData.noCamBlock = true;
  glass.castShadow = false; outside.castShadow = false; web.side = THREE.DoubleSide; items.cobwebs.traverse((m) => { if (m.isMesh) m.castShadow = false; });

  // ---------- marks (world), heading: forward = (sin h, 0, cos h) ----------
  const w = (x, y, z) => V(x, y, z).add(OFFSET);
  const mk = (x, z, heading, extra = {}) => ({ pos: w(x, extra.y || 0, z), heading, ...extra });
  const towards = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  const marks = {
    nest: mk(0.2, -7.2, 0, { note: 'sit cross-legged in the nest, facing the hatch side (+z)' }),
    nest_stand: mk(0.3, -5.6, 0),
    window: mk(0, -8.4, Math.PI, { note: 'standing at the round window looking out' }),
    tea_skye: mk(-3.5, -0.1, 0, { note: 'cross-legged at the upturned box, nest side, facing +z (the round window behind her)' }),
    tea_lily: mk(-3.5, 4.1, Math.PI, { note: 'kneeling opposite Skye, hatch side, facing -z' }),
    tea_teddy_lily: mk(-2.2, 4.3, Math.PI, { note: "where Lily's teddy sits beside her" }),
    tea_teddy_left: mk(-5.6, 2.0, Math.PI / 2), tea_teddy_right: mk(-1.4, 2.0, -Math.PI / 2),
    tea_table: mk(-3.5, 2.0, 0, { y: 1.42, note: 'top of the upturned box (y 1.42)' }),
    rocking_chair: mk(-8.0, -4.0, 0.7, { seatY: 1.65, note: 'seat centre; seat top y 1.65; the chair faces heading 0.7' }),
    rocking_chair_front: mk(-8.0 + Math.sin(0.7) * 2.2, -4.0 + Math.cos(0.7) * 2.2, 0.7),
    decor_pose: mk(6.2, -3.5, 0, { note: 'Ch7: between the skeleton (x 3.6) and the witch (x 8.9), facing +z; arms out at shoulder height clear both' }),
    skeleton: mk(3.6, -3.5, 0.15), witch: mk(8.9, -3.5, -0.2),
    decor_front: mk(6.2, -1.1, Math.PI, { note: 'Dad nose to nose with the pumpkin girl (stand here facing her)' }),
    box_halloween: mk(6.2, -5.0, Math.PI, { note: 'in front of the HALLOWEEN box, facing it' }),
    box_xmas: mk(8.6, 1.9, towards(8.6, 1.9, 10, 0.5)),
    box_max: mk(7.6, 6.0, towards(7.6, 6.0, 9.2, 4.6), { note: 'in front of MAX - OLD STUFF, facing it (Ch9)' }),
    box_max_kneel: mk(7.9, 5.7, towards(7.9, 5.7, 9.2, 4.6)),
    hobby_horse: mk(7.2, 2.7, towards(7.2, 2.7, 8.4, 2.0)),
    hatch_top: mk(4.5, 6.4, Math.PI, { note: 'standing on the floor at the nest side of the hatch, facing into the room' }),
    hatch_side: mk(1.4, 9.0, Math.PI / 2, { note: 'beside the hatch, facing it' }),
    hatch_climb: mk(4.5, 9.4, Math.PI, { note: 'root over the hole; use hatchRise(scale, k) for the height (k 0 = feet at floor - 4*scale - 1, 1 = standing on the floor)' }),
    hatch_head_lily: mk(4.5, 9.4, Math.PI, { y: -(4 * 0.78) + 0.55, note: 'Lily (0.78): head and shoulders up through the hatch' }),
    hatch_head_dad: mk(4.5, 9.4, Math.PI, { y: -(4 * 1.12) + 0.55, note: 'Dad (1.12): head and shoulders up through the hatch' }),
    hatch_head_max: mk(4.5, 9.4, Math.PI, { y: -4 + 0.55 }),
    ladder_foot: mk(4.5, 14.2, Math.PI, { y: -10, note: 'the hallway floor below (not normally seen)' }),
    vacuum: mk(8.2, 10.4, -2.4, { note: 'where the vacuum stays after Ch7' }),
    centre: mk(0, 2, Math.PI),
  };
  // names the chapter shot plans use (aliases and additions from production/requests.md)
  const P = (o) => o.getWorldPosition(new THREE.Vector3());
  group.updateMatrixWorld(true);
  Object.assign(marks, {
    nest_sit: marks.nest, hatch_stand: marks.hatch_top, hatch_head: mk(4.5, 9.4, Math.PI, { y: -4 + 0.55, note: 'scale 1 head and shoulders; Lily: hatch_head_lily, Dad: hatch_head_dad, or hatchRise(scale, k)' }),
    hatch_below: marks.hatch_climb, vacuum_by_hatch: marks.vacuum,
    nest_front: mk(0.5, -3.4, Math.PI, { note: 'standing ~4 studs in front of the nest, facing it' }),
    nest_backpack: { pos: P(items.backpack), heading: items.backpack.rotation.y, note: 'where the loose backpack lies in the nest' },
    horse_lean: { pos: w(7.9, 0, 2.6), heading: -2.0, note: 'foot of the hobby horse leaning on the XMAS box' },
    tea_box: marks.tea_table, box_table: marks.tea_table, tea_teddy: marks.tea_teddy_lily, tea_toy_1: marks.tea_teddy_left, tea_toy_2: marks.tea_teddy_right,
    decor_gap: marks.decor_pose, decor_inspect: marks.decor_front, decor_lily: mk(1.9, -2.6, 0.35, { note: 'Lily standing beside the decorations (left of the skeleton)' }),
    old_stuff_box: marks.box_max, old_stuff_inside: { pos: P(items.drawing), heading: items.box_max.rotation.y, note: 'top of the contents inside MAX - OLD STUFF (where the drawing lies)' },
  });
  marks.nest_beside = mk(2.3, -6.9, -0.35, { note: 'Lily sitting next to Skye in the nest, frame-right of her from the +z cams (Ch8)' });
  const hatchRise = (scale = 1, k = 1) => lerp(-(4 * scale) - 1, 0, k);

  // ---------- cams (world): { pos, target, fov } ----------
  const cam = (p, t, fov, note) => ({ pos: w(...p), target: w(...t), fov, note });
  const cams = {
    wide: cam([0, 6.2, 13.2], [0, 3.0, -5], 52, 'the whole attic from the front gable toward the window'),
    wide_low: cam([-2, 3.2, 12.5], [0.5, 3.4, -6], 50, 'low wide toward the window, shafts above'),
    nest_to_hatch: cam([-3.2, 4.2, -9.6], [3.6, 1.2, 9.0], 50, 'Ch5 start: from beside the nest toward the hatch (Skye foreground, hatch far)'),
    nest_to_hatch_tight: cam([-2.2, 3.9, -9.6], [4.4, 1.2, 9.2], 26, 'tighter: the hatch and Lily popping up'),
    hatch_to_nest: cam([5.6, 3.0, 11.2], [0.2, 1.6, -7.2], 38, 'reverse: from behind the hatch toward the nest'),
    hatch_lily_cu: cam([3.4, 2.2, 5.0], [4.5, 1.4, 9.4], 36, 'close on the hatch: a head coming up (eye level of the hatch)'),
    hatch_down: cam([4.5, 5.4, 5.2], [4.5, -4.5, 10.5], 50, 'Ch2: looking down the hatch to the ladder and the hallway'),
    nest_ms: cam([1.0, 3.0, -2.6], [0.0, 1.8, -7.6], 38, 'Skye in the nest, medium'),
    nest_two: cam([0.0, 3.3, -1.4], [-0.9, 1.7, -7.4], 42, 'Ch8: Skye and Lily side by side in the nest'),
    nest_cu: cam([0.7, 3.3, -3.8], [0.2, 2.9, -7.2], 34, 'close-up in the nest'),
    tea_two: cam([3.4, 3.5, 2.2], [-3.5, 1.8, 2.0], 40, 'tea party two-shot across the box from the +x side (Lily frame-left, Skye frame-right)'),
    tea_wide: cam([-7.0, 4.4, -6.6], [-3.0, 1.4, 2.4], 46, 'tea party wide 3/4 from window-left (Ch5 S12)'),
    tea_wide_front: cam([4.0, 5.2, 9.0], [-3.5, 1.4, 1.2], 44, 'tea party wide from the hatch side'),
    tea_lily_ots: cam([-1.6, 3.7, -2.0], [-3.7, 2.2, 4.1], 34, "over Skye's left shoulder onto Lily"),
    tea_skye_ots: cam([-2.2, 3.4, 6.4], [-3.5, 2.5, -0.1], 40, "over Lily's right shoulder onto Skye"),
    tea_lily_cu: cam([-1.6, 2.7, 1.0], [-3.5, 2.4, 4.1], 30, 'Lily close (kneeling)'),
    tea_skye_cu: cam([-1.6, 2.9, 3.1], [-3.5, 2.6, -0.1], 30, 'Skye close (cross-legged)'),
    tea_hatch: cam([-9.0, 4.6, -3.0], [1.5, 1.5, 6.5], 48, 'Ch7 start: the tea party in front, the hatch in frame behind'),
    decor_wide: cam([6.2, 4.2, 7.0], [6.2, 2.9, -4.5], 42, 'Ch7: skeleton, Skye (pumpkin girl), witch in a row, HALLOWEEN box behind'),
    decor_ms: cam([5.9, 4.3, 2.0], [6.2, 3.6, -3.5], 38, 'Ch7: the pumpkin girl, medium'),
    decor_cu: cam([6.2, 5.0, -0.2], [6.2, 4.8, -3.5], 34, 'Ch7: the pumpkin girl close (her face)'),
    decor_to_hatch: cam([8.0, 5.4, -6.0], [4.5, 2.0, 9.0], 44, 'Ch7: from behind the pumpkin girl toward the hatch (Dad climbing in)'),
    decor_side: cam([10.6, 4.0, -0.9], [5.9, 4.2, -2.3], 40, 'Ch7: Dad and the pumpkin girl nose to nose, from the side'),
    boxes: cam([2.2, 4.0, 6.6], [9.4, 1.6, 2.2], 44, 'XMAS and MAX - OLD STUFF with the hobby horse'),
    box_max_cu: cam([6.4, 5.0, 2.4], [9.2, 1.4, 4.8], 36, 'Ch9: into the MAX - OLD STUFF box (the drawing on top)'),
    drawing_insert: cam([9.0, 4.4, 4.7], [9.2, 1.2, 4.6], 30, 'Ch9: top-down insert of the drawing in the open box'),
    rocking_nest: cam([-1.0, 4.4, 3.0], [-3.6, 1.8, -6.2], 46, 'Ch9: Lily on the rocking chair and Skye in the nest'),
    rocking_ms: cam([-3.2, 3.4, 1.2], [-8.0, 2.6, -4.0], 38, 'Lily on the rocking chair, medium'),
    window: cam([0.0, 3.0, -1.0], [0.0, 6.2, -10.0], 46, 'toward the round window and the light shafts'),
    hatch_wide: cam([-4.0, 4.4, -1.0], [4.5, 1.2, 9.0], 44, 'toward the hatch and the vacuum'),
  };
  Object.assign(cams, {
    tea_party: cams.tea_two, decor_line: cams.decor_wide, hatch_mcu: cams.hatch_lily_cu, nest_mcu: cams.nest_cu, nest_two_shot: cams.nest_two,
    wide_nest_to_hatch: cam([-6.0, 4.4, -9.4], [2.0, 1.5, 3.0], 52, 'Ch7: tea party foreground, the hatch and the decorations in frame'),
    wide_nest_hatch: cam([-5.5, 4.4, -9.6], [2.5, 1.2, 1.5], 58, 'the nest (right) and the hatch (left) in one wide'),
    nest_from_window: cam([-6.0, 4.2, -8.6], [3.0, 1.2, 2.0], 50, 'Ch8: nest frame-left, hatch frame-right'),
    nest_mcu_skye: cam([-0.6, 3.0, -3.6], [0.2, 2.5, -7.2], 32, 'Skye in the nest, MCU'),
    nest_mcu_lily: cam([1.3, 3.2, -2.8], [2.3, 2.3, -6.9], 30, 'Lily beside her in the nest, MCU'),
    lily_ms: cam([3.0, 3.2, 1.6], [4.5, 2.4, 6.4], 38, 'Lily standing at hatch_top, MS'),
    old_stuff: cams.box_max_cu,
  });
  for (const c of Object.values(cams)) c.pos.y = Math.min(c.pos.y, roofY(c.pos.x - OFFSET.x) - 1.2);

  // ---------- state ----------
  const S = { chapter: 5 };
  function chapterDefaults(ch) {
    return {
      time: ch === 8 ? 'night' : ch <= 2 ? 'predawn' : 'afternoon',
      hatch: 'shut',
      backpack: !(ch <= 2 || ch === 5),          // Ch5 opens with it ON her back; the chapter sets backpack: true when it comes off
      flashlight: ch === 8 ? 'standing' : 'lying',
      boxes: true, decorations: true,
      tea: ch >= 6,                              // from the end of Ch5 (Ch5 sets tea: true for its tea-party shots)
      halloween: ch === 7 ? 'open' : 'closed',
      pumpkin: ch === 7 ? 'box' : ch > 7 ? 'lid' : 'inside',
      vacuum: ch >= 8,
      glowSticks: ch === 9,
      maxBox: 'closed', drawing: ch === 9 ? 'box' : 'none',
      hobbyHorse: 'boxes', teddies: ch >= 5,
      hide: [],
    };
  }
  function apply(st) {
    const vis = (n, v) => { if (items[n]) items[n].visible = !!v; };
    // light mood
    const day = st.time === 'afternoon', night = st.time === 'night', pre = st.time === 'predawn';
    sun.intensity = day ? 420 : 0; bounce.intensity = day ? 14 : night ? 4 : 1;
    bounce.color.set(day ? '#ffb36b' : '#8fa6e0');
    moon.intensity = night ? 320 : pre ? 60 : 0;
    vis('shafts_sun', day); vis('shafts_moon', night);
    outsideMat.color.set(day ? '#ffd29a' : night ? '#1c2c55' : '#2a3f78');
    glassMat.emissive.set(day ? '#ffd59a' : '#5a74b8'); glassMat.emissiveIntensity = day ? 0.6 : 0.25;
    hatchGlow.intensity = st.hatch === 'shut' || st.hatch === 0 ? 0 : (day ? 10 : night ? 3 : 4);
    // hatch lid
    const k = st.hatch === 'shut' ? 0 : st.hatch === 'open' ? 1 : clamp(+st.hatch || 0, 0, 1);
    items.hatch_lid.rotation.x = k * 1.95;
    // nest
    vis('backpack', st.backpack);
    const fl = items.flashlight;
    const standing = st.flashlight === 'standing';
    if (flKit) {                                 // kit flashlight: beam along its +z, tail at z -0.32
      if (standing) { at(fl, -2.6, 0.17, 1.5); flKit.rotation.set(-Math.PI / 2, 0, 0); flKit.position.set(0, 0.33, 0); }
      else { at(fl, -1.7, 0.27, 0.6, 0.9); flKit.rotation.set(0, 0, 0); flKit.position.set(0, 0, 0); }
      flKit.userData.setOn?.(standing);
    } else if (standing) { at(fl, -2.6, 0.17, 1.5); fl.rotation.set(0, 0, 0); fl.children[0].children[2].material.emissiveIntensity = 3; }
    else { at(fl, -1.7, 0.33, 0.6, 0.9); fl.rotation.z = Math.PI / 2; fl.children[0].children[2].material.emissiveIntensity = 0; }
    flashL.intensity = standing ? 1.1 : 0; flashCone.intensity = standing ? 14 : 0;
    vis('flashlight', st.flashlight !== 'none');
    vis('glow_sticks', st.glowSticks); glowL.intensity = st.glowSticks === 'lit' ? 2 : 0; gs.userData.prop?.userData.setLit?.(st.glowSticks === 'lit');
    // boxes and decorations
    for (const n of ['box_halloween', 'box_xmas', 'box_max', 'box_small']) vis(n, st.boxes);
    vis('skeleton', st.decorations); vis('witch', st.decorations);
    items.box_halloween.userData.setOpen(st.halloween === 'open' ? 1 : typeof st.halloween === 'number' ? st.halloween : 0);
    items.box_max.userData.setOpen(st.maxBox === 'open' ? 1 : typeof st.maxBox === 'number' ? st.maxBox : 0);
    const pb = items.pumpkin_bucket, hb = items.box_halloween;
    if (st.pumpkin === 'box') { pb.visible = true; pb.position.set(hb.position.x + 0.2, 2.2 * 0.6 + 0.02, hb.position.z + 0.1); pb.rotation.set(0.15, 0.3, 0); }
    else if (st.pumpkin === 'lid') { pb.visible = true; pb.position.set(hb.position.x - 0.3, 2.22, hb.position.z + 0.2); pb.rotation.set(0, 0.5, 0); }
    else pb.visible = false;                     // 'inside' (box closed) or 'none' (the chapter has it)
    vis('drawing', st.drawing === 'box');
    // hobby horse: leaning on the boxes, or hidden ('none': someone is holding the kit prop)
    const hh = items.hobby_horse;
    if (st.hobbyHorse === 'boxes') { hh.visible = true; hh.position.set(7.9, 0, 2.6); hh.rotation.set(0, -2.0, 0); hh.rotateX(-0.42); }
    else if (st.hobbyHorse === 'floor') { hh.visible = true; hh.position.set(-1.6, 0.07, 3.6); hh.rotation.set(0, 0.5, 0); hh.rotateZ(Math.PI / 2); }
    else hh.visible = false;
    vis('table_box', st.boxes); vis('tea_set', st.tea); vis('teddy_left', st.teddies); vis('teddy_right', st.teddies);
    vis('vacuum', st.vacuum);
    for (const n of Object.keys(items)) if (st.hide.includes(n)) items[n].visible = false;
    if (st.show) for (const n of st.show) vis(n, true);
  }
  // Stateless: every call is the chapter's defaults plus the overrides passed (so frames render in any order).
  function setState(state = {}) {
    const ch = state.chapter ?? 5;
    const st = { ...chapterDefaults(ch), ...state, chapter: ch };
    if (state.night === true) st.time = 'night';
    if (state.teaSet != null) st.tea = state.teaSet;
    if (state.oldStuffOpen != null) st.maxBox = state.oldStuffOpen === true ? 'open' : state.oldStuffOpen === false ? 'closed' : state.oldStuffOpen;
    if (state.pumpkin === false) st.pumpkin = 'none';
    if (state.hobbyHorse === false) st.hobbyHorse = 'none';
    if (state.rock != null) items.rocking_chair_rock.rotation.x = state.rock; else items.rocking_chair_rock.rotation.x = 0;
    st.hide = state.hide || [];
    apply(st); S.current = st; return st;
  }
  // put the stage camera on a named set-up
  function useCam(camera, name, { fov } = {}) {
    const c = cams[name]; if (!c) throw new Error(`attic: no cam ${name}`);
    camera.position.copy(c.pos); camera.fov = fov || c.fov; camera.updateProjectionMatrix(); camera.lookAt(c.target); return c;
  }
  setState({ chapter: 5 });
  group.userData.walls = { back, front, left: kneeL, right: kneeR };
  const setHatch = (k) => { items.hatch_lid.rotation.x = clamp(k, 0, 1) * 1.95; hatchGlow.intensity = k > 0.02 ? Math.max(hatchGlow.intensity, 4) : 0; };
  const rockChair = (a) => { items.rocking_chair_rock.rotation.x = a; };
  return { id: 'attic', group, marks, cams, lights, items, setState, setHatch, rockChair, useCam, hatchRise, roofY: (x) => roofY(x - OFFSET.x) };
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
