// The lion: the pack's own lion cut into hinged parts (creatures/animal_lion_parts, tools/cut_lion.py): Body, Mane (fixed
// to the body), Head (turns inside the mane), Jaw (the whole muzzle, hinged at its top back), Tail, FrontL/R, RearL/R
// (each leg one rigid block hinged at the shoulder/hip). Part angles [rx, ry, rz] are in the lion's model frame:
// rz > 0 = nose / jaw / leg tip down-and-back, rz < 0 = forward-up; ry > 0 = turn to its left; rx rolls.
// Extras: a dark mouth with fangs behind the muzzle (seen when the jaw drops), a pencil-sketch look (paper white with
// graphite edges, 0..1) and a clip plane that reveals it head-to-tail as it is drawn.
import * as THREE from 'three';
import { loadCreature, poseCreature } from '../../../web/lib/creature.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const LION_SCALE = 0.7, LENGTH = 11.8;           // 8.3 studs long, 5 tall at the shoulder of the mane

export async function makeLion(scene) {
  const c = await loadCreature('animal_lion_parts');
  const rig = new THREE.Group(); rig.add(c.root); scene.add(rig);
  const U = { uSketch: { value: 0 } };
  const clip = new THREE.Plane(V(-1, 0, 0), 1e4);
  // Ink outline for the sketch look: each part drawn again, back faces only, pushed out along the normals.
  const U2 = { uThick: { value: 0.07 } };
  const edgeM = new THREE.MeshBasicMaterial({ color: '#26262b', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: true, clippingPlanes: [clip] });
  edgeM.onBeforeCompile = (sh) => { sh.uniforms.uThick = U2.uThick; sh.vertexShader = 'uniform float uThick;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normal * uThick;'); };
  edgeM.customProgramCacheKey = () => 'lion-ink';
  const sketchify = (m) => {
    m.clippingPlanes = [clip]; m.customProgramCacheKey = () => 'lion-sketch';
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSketch = U.uSketch;
      sh.fragmentShader = 'uniform float uSketch;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n  float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));\n' +
        '  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.95, 0.94, 0.9) * (0.82 + 0.35 * lum), uSketch);');
    };
  };
  const seen = new Set(), inks = [];
  for (const b of Object.values(c.bodies)) for (const m of [...b.meshes]) {
    m.castShadow = true;
    for (const mm of [].concat(m.material)) if (!seen.has(mm)) { seen.add(mm); sketchify(mm); }
    const ink = new THREE.Mesh(m.geometry, edgeM); ink.matrixAutoUpdate = false; ink.visible = false; c.obj.add(ink); b.meshes.push(ink); inks.push(ink);
  }
  // The mouth: a dark box inside the muzzle (Head) with upper fangs, and lower fangs on the Jaw (model space, before the
  // loader's half turn; the muzzle spans x -5.65..-4.43, y 3.53..4.84, z -1..1).
  const addTo = (body, mesh) => { mesh.geometry.rotateY(Math.PI); mesh.castShadow = true; mesh.matrixAutoUpdate = false; c.obj.add(mesh); c.bodies[body].meshes.push(mesh); };   // geometry turned like the loader's
  const mouthM = new THREE.MeshStandardMaterial({ color: '#4a1414', roughness: 0.9 }), toothM = new THREE.MeshStandardMaterial({ color: '#fbf6e8', roughness: 0.35 });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 1.7), mouthM); mouth.geometry.translate(-5.0, 4.12, 0); addTo('Head', mouth);
  const fang = (x, y, z, down) => { const g = new THREE.ConeGeometry(0.13, 0.42, 4); if (!down) g.rotateX(Math.PI); g.translate(x, y, z); return g; };
  for (const z of [-0.55, 0.55]) {
    addTo('Head', new THREE.Mesh(fang(-5.42, 4.38, z, false), toothM));
    addTo('Jaw', new THREE.Mesh(fang(-5.38, 3.85, z * 0.8, true), toothM));
  }
  return { c, rig, U, clip, edgeM, inks, groundY: 0 };
}

// Walk cycle from the distance walked (never on the spot): diagonal pairs swing together.
export function gait(dist, amp = 0.42, stride = 3.2) {
  const a = Math.sin((dist / stride) * Math.PI * 2) * amp;
  return { FrontL: [0, 0, -a], RearR: [0, 0, -a * 0.8], FrontR: [0, 0, a], RearL: [0, 0, a * 0.8], Head: [0, 0, 0.04 * Math.sin((dist / stride) * Math.PI * 4)], Tail: [0, 0.25 * a, -0.3] };
}

const box = new THREE.Box3();
// st: { pos (Vector3, ground point), heading (facing (sin h, cos h)), parts, scale, pitch (nose up > 0), roll (about the
// long axis; PI = on its back), y (lift above the ground), flat (0..1: lying on its side, squashed into a drawing),
// ground (true: shift so the lowest point touches pos.y), sketch (0..1), reveal (0..1 drawn head to tail), visible }
export function placeLion(L, st) {
  const { rig } = L;
  rig.visible = st.visible !== false;
  if (!rig.visible) return;
  poseCreature(L.c, st.parts || {});
  const sc = st.scale ?? LION_SCALE, flat = st.flat || 0;
  rig.position.copy(st.pos); rig.rotation.set(0, (st.heading ?? Math.PI / 2) - Math.PI / 2, 0);
  if (st.pitch) rig.rotateZ(st.pitch);
  const roll = (st.roll || 0) - (Math.PI / 2) * flat;
  if (roll) rig.rotateX(roll);
  rig.scale.set(sc, sc, sc * (1 - 0.97 * flat));
  rig.updateMatrixWorld(true);
  if (st.ground) { box.setFromObject(rig); rig.position.y += st.pos.y - box.min.y; }
  rig.position.y += st.y || 0;
  rig.updateMatrixWorld(true);
  L.U.uSketch.value = st.sketch || 0; L.edgeM.opacity = Math.min(1, (st.sketch || 0) * 1.4);
  for (const k of L.inks) k.visible = (st.sketch || 0) > 0.02;
  // reveal: keep the part of the lion from its nose back to the given fraction of its length (rig-local x runs tail -> nose)
  const r = st.reveal ?? 1;
  if (r >= 1) L.clip.set(V(-1, 0, 0), 1e4);
  else {
    const nose = V(LENGTH / 2, 0, 0).applyMatrix4(rig.matrixWorld), tail = V(-LENGTH / 2, 0, 0).applyMatrix4(rig.matrixWorld);
    const n = nose.clone().sub(tail).normalize(), cut = nose.clone().lerp(tail, r);
    L.clip.setFromNormalAndCoplanarPoint(n, cut);           // keeps the nose side of the cut
  }
}

// A pencil drawing of this lion (side view, nose to the right) for the page: rendered once offscreen, then edge-detected
// and hatched. Returns a canvas with a transparent background, 1024 x 640 (12.8 x 8 studs at scale 1).
export function lionDrawing(renderer, L, mainScene) {
  const Wd = 1024, Hd = 640, rt = new THREE.WebGLRenderTarget(Wd, Hd), tmp = new THREE.Scene();
  tmp.add(new THREE.HemisphereLight('#ffffff', '#888888', 2.2)); const sun = new THREE.DirectionalLight('#ffffff', 1.6); sun.position.set(3, 8, 10); tmp.add(sun);
  tmp.add(L.rig); placeLion(L, { pos: V(0, 0, 0), heading: Math.PI / 2, scale: 1, parts: { Tail: [0, 0, -0.3], Head: [0, 0, -0.05] } });
  const cam = new THREE.OrthographicCamera(-6.4, 6.4, 7.6, -0.4, 0.1, 100); cam.position.set(0, 0, 30); cam.lookAt(0, 0, 0); cam.position.y = 0; cam.updateMatrixWorld(true);
  const prevC = new THREE.Color(); renderer.getClearColor(prevC); const prevA = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor('#ffffff', 1); renderer.clear(); renderer.render(tmp, cam);
  const px = new Uint8Array(Wd * Hd * 4); renderer.readRenderTargetPixels(rt, 0, 0, Wd, Hd, px);
  renderer.setRenderTarget(null); renderer.setClearColor(prevC, prevA); rt.dispose(); mainScene.add(L.rig);
  const lum = new Float32Array(Wd * Hd), ink = new Float32Array(Wd * Hd);
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const i = ((Hd - 1 - y) * Wd + x) * 4; lum[y * Wd + x] = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255; }
  const cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd; const g = cv.getContext('2d'), out = g.createImageData(Wd, Hd);
  const L_ = (x, y) => lum[Math.min(Hd - 1, Math.max(0, y)) * Wd + Math.min(Wd - 1, Math.max(0, x))];
  for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) {
    const gx = L_(x + 1, y - 1) + 2 * L_(x + 1, y) + L_(x + 1, y + 1) - L_(x - 1, y - 1) - 2 * L_(x - 1, y) - L_(x - 1, y + 1);
    const gy = L_(x - 1, y + 1) + 2 * L_(x, y + 1) + L_(x + 1, y + 1) - L_(x - 1, y - 1) - 2 * L_(x, y - 1) - L_(x + 1, y - 1);
    const e = Math.hypot(gx, gy), v = lum[y * Wd + x], inside = v < 0.985;
    let a = Math.min(1, Math.max(0, (e - 0.12) * 3.5));                                    // outlines and block edges
    if (inside && v < 0.62 && ((x + y) % 9 < 2)) a = Math.max(a, (0.62 - v) * 1.6);         // hatching in the shadows
    if (inside && v < 0.42 && ((x - y + 2000) % 9 < 2)) a = Math.max(a, (0.42 - v) * 1.8);  // cross-hatching in the darkest
    ink[y * Wd + x] = a;
  }
  const thick = new Float32Array(Wd * Hd);                                                 // pencil lines 3 px wide, darker
  for (let y = 1; y < Hd - 1; y++) for (let x = 1; x < Wd - 1; x++) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m = Math.max(m, ink[(y + dy) * Wd + x + dx]); thick[y * Wd + x] = Math.min(1, m * 1.35); }
  ink.set(thick);
  for (let i = 0; i < Wd * Hd; i++) { out.data[i * 4] = 40; out.data[i * 4 + 1] = 40; out.data[i * 4 + 2] = 46; out.data[i * 4 + 3] = Math.round(255 * ink[i]); }
  g.putImageData(out, 0, 0); return cv;
}
