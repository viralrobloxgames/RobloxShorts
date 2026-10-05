// The Backwards Umbrella: the park and its weather, built in code.
// World (studs): grass at y 0. The barbecue sits in the middle (table along x at the origin, grill west of it, the
// bouncy castle north-east); the lawn where the umbrella is first opened is south-west (LAWN). Trees ring the park.
// Weather: rain() is a field of falling streaks (instanced, additive) with splash rings, everywhere except inside the
// dry circles passed to it (Leo's umbrella). fire() / steam() are billboard particle systems. Every effect is a pure
// function of time (no simulation), so any frame renders the same on its own.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
const cyl = (rt, rb, h, m, n = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.castShadow = c.receiveShadow = true; return c; };

export const LAWN = V(-16, 0, 12);                  // where the umbrella first opens
export const TABLE = V(0, 0, 0), GRILL = V(-7.5, 0, 1.5), CASTLE = V(9, 0, -9);

// ---------- the park ----------
export function park(scene) {
  const g = new THREE.Group(); g.name = 'park'; scene.add(g);
  const gt = canvasTexture(1024, 1024, (x, w, h) => {
    const r = rng(3); x.fillStyle = '#6cc44e'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = r(); x.fillStyle = v > 0.5 ? `rgba(40,120,30,${0.18 + r() * 0.2})` : `rgba(170,230,110,${0.15 + r() * 0.2})`; x.fillRect(r() * w, r() * h, 2 + r() * 3, 5 + r() * 8); }
  });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(14, 14); gt.anisotropy = 8;
  const grassM = std('#ffffff', { map: gt, roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), grassM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  // a winding stone path
  const pathM = std('#d8cdb4', { roughness: 0.9 });
  const pts = [V(-60, 0, 26), V(-30, 0, 20), V(-12, 0, 21), V(6, 0, 14), V(24, 0, 10), V(60, 0, 2)];
  const curve = new THREE.CatmullRomCurve3(pts);
  for (let i = 0; i < 140; i++) { const p = curve.getPointAt(i / 140), q = rng(i + 7); const s = box(2.2 + q() * 0.6, 0.12, 1.6 + q() * 0.5, pathM, p.x + (q() - 0.5) * 1.2, 0.06, p.z + (q() - 0.5) * 1.2); s.rotation.y = q() * 0.6; s.castShadow = false; g.add(s); }
  // trees: chunky trunks with stacked leaf blocks
  const trunkM = std('#8a5a33', { roughness: 0.8 }), leafMs = ['#3f9e3a', '#4cad42', '#378f35'].map((c) => std(c, { roughness: 0.85 }));
  const trees = [];
  const r = rng(21);
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + r() * 0.1, d = 40 + r() * 24;
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9;
    if (Math.hypot(x - LAWN.x, z - LAWN.z) < 12) continue;
    trees.push(tree(g, x, z, 0.8 + r() * 0.6, trunkM, leafMs[i % 3], i));
  }
  for (const [x, z, s] of [[-32, -4, 1.2], [-36, 26, 1.0], [26, 30, 1.1], [30, -20, 1.3], [-8, -26, 1.15], [14, -30, 1.0]]) trees.push(tree(g, x, z, s, trunkM, leafMs[1], x * 7 + z));
  // bushes
  const bushM = std('#3c9a3f', { roughness: 0.9 });
  for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = 36 + r() * 10; const b = new THREE.Mesh(new THREE.SphereGeometry(1 + r() * 0.8, 10, 8), bushM); b.scale.y = 0.7; b.position.set(Math.cos(a) * d, 0.5, Math.sin(a) * d); b.castShadow = b.receiveShadow = true; g.add(b); }
  // a bench and a bin by the lawn
  const benchM = std('#b5793f', { roughness: 0.7 }), ironM = std('#3a3f4a', { roughness: 0.5, metalness: 0.5 });
  const bench = new THREE.Group(); bench.position.set(LAWN.x - 9, 0, LAWN.z - 6); bench.rotation.y = 0.3; g.add(bench);
  for (const z of [-0.35, 0, 0.35]) bench.add(box(5, 0.18, 0.3, benchM, 0, 1.7, z));
  for (const y of [2.4, 2.9]) bench.add(box(5, 0.3, 0.12, benchM, 0, y, -0.65));
  for (const x of [-2.2, 2.2]) bench.add(box(0.15, 1.7, 1.1, ironM, x, 0.85, 0), box(0.15, 1.6, 0.15, ironM, x, 2.4, -0.65));
  return { group: g, ground, grassM, trees, wet: [grassM, pathM, trunkM, ...leafMs, bushM, benchM] };
}
function tree(g, x, z, s, trunkM, leafM, seed) {
  const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
  const q = rng(seed + 100);
  t.add(box(1.4, 7, 1.4, trunkM, 0, 3.5, 0));
  t.add(box(7, 3.4, 7, leafM, 0, 8, 0), box(5.2, 2.6, 5.2, leafM, 0.4, 10.6, -0.3), box(3, 1.8, 3, leafM, -0.3, 12.4, 0.4));
  t.rotation.y = q() * 1.5; return t;
}

// ---------- the barbecue ----------
export function barbecue(scene) {
  const g = new THREE.Group(); g.name = 'barbecue'; scene.add(g);
  const woodM = std('#b98552', { roughness: 0.75 });
  const clothT = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(220,40,50,.85)'; for (let i = 0; i < 8; i += 2) { x.fillRect(i * 32, 0, 32, h); x.fillRect(0, i * 32, w, 32); } });
  clothT.wrapS = clothT.wrapT = THREE.RepeatWrapping; clothT.repeat.set(3, 1);
  const clothM = std('#ffffff', { map: clothT, roughness: 0.9 });
  // picnic table (long along x) with benches either side
  const table = new THREE.Group(); table.position.copy(TABLE); g.add(table);
  table.add(box(9, 0.3, 3, woodM, 0, 3.0, 0)); const cloth = box(9.2, 0.06, 3.2, clothM, 0, 3.18, 0); table.add(cloth);
  for (const z of [-2.4, 2.4]) table.add(box(9, 0.25, 1.1, woodM, 0, 1.8, z));
  for (const x of [-3.8, 3.8]) for (const z of [-1, 1]) { const l = box(0.3, 3.2, 0.3, woodM, x, 1.5, z * 1.6); l.rotation.x = z * 0.25; table.add(l); }
  // things on the table: plates, cups, a ketchup bottle, a stack of napkins, a bowl of chips
  const plateM = std('#f7f7f7', { roughness: 0.4 }), cupMs = ['#ff5a5f', '#3fa9f5', '#ffd23f'].map((c) => std(c, { roughness: 0.4 }));
  for (let i = 0; i < 6; i++) { const p = cyl(0.55, 0.45, 0.08, plateM, 18); p.position.set(-3.4 + i * 1.35, 3.25, (i % 2 ? -0.75 : 0.75)); table.add(p); const c = cyl(0.2, 0.16, 0.5, cupMs[i % 3], 10); c.position.set(-3 + i * 1.35, 3.46, (i % 2 ? -0.2 : 0.2)); table.add(c); }
  const ketchup = cyl(0.18, 0.2, 0.8, std('#d62828', { roughness: 0.3 }), 10); ketchup.position.set(1.0, 3.6, 0); table.add(ketchup);
  const napkins = new THREE.Group(); napkins.position.set(-3.9, 3.21, 0.1); table.add(napkins);
  for (let i = 0; i < 6; i++) napkins.add(box(0.8, 0.05, 0.8, std(i % 2 ? '#fff6d6' : '#ffffff', { roughness: 0.95 }), (i % 3) * 0.02, 0.03 + i * 0.05, 0));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std('#3fa9f5', { side: THREE.DoubleSide })); bowl.position.set(2.6, 3.75, 0.2); table.add(bowl);
  // kettle grill: black bowl on three legs, grate, burgers
  const grill = new THREE.Group(); grill.position.copy(GRILL); g.add(grill);
  const blackM = std('#202226', { roughness: 0.35, metalness: 0.4 });
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), blackM); kettle.position.y = 3.4; kettle.material.side = THREE.DoubleSide; kettle.castShadow = true; grill.add(kettle);
  for (let i = 0; i < 3; i++) { const a = i * 2.094; const l = cyl(0.07, 0.07, 3.0, blackM, 6); l.position.set(Math.cos(a) * 0.9, 1.5, Math.sin(a) * 0.9); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); grill.add(l); }
  const grate = new THREE.Group(); grate.position.y = 3.38; grill.add(grate);
  for (let i = -5; i <= 5; i++) grate.add(box(0.04, 0.04, 2.6 * Math.sqrt(1 - (i / 5.6) ** 2), std('#9aa0a8', { metalness: 0.7, roughness: 0.3 }), i * 0.24, 0, 0));
  const coalM = new THREE.MeshStandardMaterial({ color: '#2a1a12', emissive: '#ff5a1a', emissiveIntensity: 0.6, roughness: 0.9 });
  const coals = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 18), coalM); coals.position.y = 2.9; grill.add(coals);
  const burgerM = std('#6b3b22', { roughness: 0.8 }), burgers = [];
  for (const [x, z] of [[-0.45, -0.35], [0.45, -0.35], [0, 0.45]]) { const b = cyl(0.42, 0.42, 0.2, burgerM, 14); b.position.set(x, 3.52, z); grill.add(b); burgers.push(b); }
  // bouncy castle: a soft box with four towers and a front arch
  const castle = new THREE.Group(); castle.position.copy(CASTLE); castle.rotation.y = -0.6; g.add(castle);
  const soft = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.6 });
  const red = soft('#e63946'), yel = soft('#ffd23f'), blu = soft('#3a86ff');
  const body = new THREE.Group(); castle.add(body);
  body.add(box(9, 1.2, 9, blu, 0, 0.6, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const tw = cyl(0.9, 0.9, 6.5, yel, 14); tw.position.set(x * 4, 3.25, z * 4); body.add(tw);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 14), red); cap.position.set(x * 4, 7.4, z * 4); cap.castShadow = true; body.add(cap);
  }
  for (const [x, z, w, d] of [[0, -4, 8, 0.6], [-4, 0, 0.6, 8], [4, 0, 0.6, 8]]) body.add(box(w, 4, d, red, x, 3.2, z));
  body.add(box(2.2, 2.6, 0.6, red, -2.9, 2.5, 4), box(2.2, 2.6, 0.6, red, 2.9, 2.5, 4), box(8, 1.4, 0.6, red, 0, 4.5, 4));
  // bunting between two poles over the table
  const poleM = std('#ffffff', { roughness: 0.5 });
  const bunt = new THREE.Group(); g.add(bunt);
  for (const x of [-6, 6]) { const p = cyl(0.1, 0.1, 9, poleM, 8); p.position.set(x, 4.5, -3.2); bunt.add(p); }
  const flagCols = ['#ff5a5f', '#ffd23f', '#3fa9f5', '#7bd389', '#c77dff'];
  for (let i = 0; i < 15; i++) {
    const u = (i + 0.5) / 15, x = -6 + 12 * u, y = 8.6 - 1.4 * Math.sin(Math.PI * u);
    const sh = new THREE.Shape(); sh.moveTo(-0.35, 0); sh.lineTo(0.35, 0); sh.lineTo(0, -0.8); sh.closePath();
    const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), std(flagCols[i % 5], { side: THREE.DoubleSide })); f.position.set(x, y, -3.2); bunt.add(f);
  }
  return { group: g, table, cloth, napkins, grill, kettle, burgers, coals, coalM, castle, castleBody: body, bunt, wet: [woodM, clothM, red, yel, blu] };
}

// ---------- Leo's umbrella ----------
// Origin at the handle grip; the shaft runs up +Y. open (0..1) spreads the canopy. Canopy rim ~2.9 above the grip.
export const UMB_R = 3.1, UMB_TOP = 3.7;
export function umbrella() {
  const root = new THREE.Group(), canopy = new THREE.Group(); root.add(canopy); canopy.position.y = UMB_TOP;
  const n = 8, cols = ['#ffb703', '#219ebc'];
  for (let i = 0; i < n; i++) {                            // one panel per segment, alternating colours
    const g = new THREE.ConeGeometry(UMB_R, 1.1, 2, 1, true, (i / n) * Math.PI * 2, (Math.PI * 2) / n);
    g.translate(0, -0.55, 0);
    const m = new THREE.Mesh(g, std(cols[i % 2], { roughness: 0.45, side: THREE.DoubleSide })); m.castShadow = true; canopy.add(m);
  }
  const tipM = std('#2b2d42', { roughness: 0.4, metalness: 0.3 });
  const tip = cyl(0.05, 0.08, 0.5, tipM, 8); tip.position.y = 0.2; canopy.add(tip);
  const shaft = cyl(0.06, 0.06, UMB_TOP, tipM, 8); shaft.position.y = UMB_TOP / 2; root.add(shaft);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 8, 16, Math.PI), std('#6b3b22', { roughness: 0.5 })); hook.rotation.z = Math.PI; hook.position.set(0.28, 0, 0); root.add(hook);
  return { root, canopy, setOpen(k) { canopy.scale.set(0.12 + 0.88 * k, 1 + 1.6 * (1 - k), 0.12 + 0.88 * k); canopy.position.y = UMB_TOP - 1.4 * (1 - k); } };
}

// ---------- weather ----------
const additive = (o = {}) => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, ...o });
// Rain over a square field (half-size R) around a centre that follows the camera target. dry: [{x, z, r}] circles with
// no rain (and no splashes). amount 0..1 thins the drops.
export function rain(scene, { N = 5000, R = 26, H = 24, splashes = 700 } = {}) {
  const geo = new THREE.BoxGeometry(0.035, 1.0, 0.035);
  const mesh = new THREE.InstancedMesh(geo, additive({ color: '#9fb6d8', opacity: 0.55 }), N); mesh.frustumCulled = false; scene.add(mesh);
  const sg = new THREE.RingGeometry(0.06, 0.1, 12); sg.rotateX(-Math.PI / 2);
  const spl = new THREE.InstancedMesh(sg, additive({ color: '#cfdcef', opacity: 0.35 }), splashes); spl.frustumCulled = false; scene.add(spl);
  const r = rng(77), drops = Array.from({ length: N }, () => [r() * 2 - 1, r() * 2 - 1, r(), 0.9 + r() * 0.3, r()]);
  const sps = Array.from({ length: splashes }, () => [r() * 2 - 1, r() * 2 - 1, r()]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, 0, 0.05)), s = V(1, 1, 1), p = V(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  const dryAt = (x, z, dry) => dry.some((d) => (x - d.x) ** 2 + (z - d.z) ** 2 < d.r * d.r);
  return {
    mesh, spl,
    update(t, { centre = V(), amount = 1, dry = [], R: R2 = R, H: H2 = H, base = 0 } = {}) {
      mesh.visible = spl.visible = amount > 0.01;
      if (!mesh.visible) return;
      drops.forEach(([u, v, ph, sp, k], i) => {
        if (k > amount) { mesh.setMatrixAt(i, Z); return; }
        const x = centre.x + u * R2, z = centre.z + v * R2, y = base + H2 - (((t * 32 * sp + ph * H2) % H2) + H2) % H2;
        if (dryAt(x, z, dry) && y < (dry[0]?.top ?? 99)) { mesh.setMatrixAt(i, Z); return; }
        s.set(1, 1.1 * sp, 1); m.compose(p.set(x, y, z), q, s); mesh.setMatrixAt(i, m);
      });
      sps.forEach(([u, v, ph], i) => {
        const x = centre.x + u * R2 * 0.8, z = centre.z + v * R2 * 0.8, a = ((t * 2.5 + ph) % 1);
        if (ph > amount || dryAt(x, z, dry)) { spl.setMatrixAt(i, Z); return; }
        const k = 0.5 + a * 1.6; s.set(k, 1, k); m.compose(p.set(x + Math.floor(t * 2.5 + ph) * 0.37 % 1.5, base + 0.04, z), new THREE.Quaternion(), s); spl.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = spl.instanceMatrix.needsUpdate = true;
    },
  };
}

// A dark storm cloud: lumpy grey blobs (for the Noob's personal storm, and the low clouds over the park).
export function cloud(r = 1, seed = 1, color = '#4a4f5c') {
  const g = new THREE.Group(), m = std(color, { roughness: 1 }), q = rng(seed);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(r * (0.45 + q() * 0.35), 12, 9), m); b.position.set((q() - 0.5) * r * 2.2, (q() - 0.3) * r * 0.5, (q() - 0.5) * r * 1.2); g.add(b); }
  return { group: g, material: m };
}
// A zigzag lightning bolt (unit length down from its origin).
export function bolt(seed = 3) {
  const q = rng(seed), pts = [V(0, 0, 0)];
  for (let i = 1; i <= 6; i++) pts.push(V((q() - 0.5) * 0.5, -i / 6, (q() - 0.5) * 0.3));
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#fff9c4', fog: false });
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, a.distanceTo(b), 6), m); c.position.copy(a).lerp(b, 0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(c); }
  return g;
}

// Fire and steam: camera-facing sprites from a soft radial texture. emitters: [{p: Vector3, size, k (0..1 strength), w (spread)}].
function softTex(inner, outer) {
  return canvasTexture(128, 128, (x, w, h) => { const gr = x.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, inner); gr.addColorStop(1, outer); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
}
export function particles(scene, { N = 400, kind = 'fire' } = {}) {
  const fire = kind === 'fire';
  const tex = fire ? softTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)') : softTex('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: fire ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
  const pool = Array.from({ length: N }, () => { const s = new THREE.Sprite(mat.clone()); s.visible = false; scene.add(s); return s; });
  const r = rng(fire ? 5 : 6), seeds = pool.map(() => [r(), r(), r(), r()]);
  const C = [new THREE.Color('#fff3b0'), new THREE.Color('#ffb703'), new THREE.Color('#fb5607'), new THREE.Color('#9d0208')];
  return {
    update(t, emitters) {
      let i = 0;
      for (const e of emitters) {
        if (e.k <= 0.01) continue;
        const n = Math.round((fire ? 60 : 40) * e.k * (e.n || 1));
        for (let j = 0; j < n && i < N; j++, i++) {
          const [a, b, c, d] = seeds[i], life = fire ? 0.7 + a * 0.5 : 1.6 + a, age = ((t + d * life) % life) / life;
          const sp = pool[i], w = e.w || 1;
          const ang = b * 6.283, rad = c * w * (fire ? 1 - age * 0.6 : 1 + age);
          sp.position.set(e.p.x + Math.cos(ang) * rad + (fire ? Math.sin(t * 7 + a * 9) * 0.12 : age * 0.8), e.p.y + age * (fire ? 3.2 : 4.5) * (e.h || 1), e.p.z + Math.sin(ang) * rad);
          const sz = (e.size || 1) * (fire ? (1.1 - age * 0.8) * (0.7 + a * 0.6) : 0.8 + age * 2.2);
          sp.scale.set(sz, sz * (fire ? 1.4 : 1), 1);
          if (fire) { const ci = Math.min(2.999, age * 3); sp.material.color.copy(C[Math.floor(ci)]).lerp(C[Math.floor(ci) + 1], ci % 1); sp.material.opacity = (1 - age) * 0.9 * Math.min(1, e.k * 1.5); }
          else { sp.material.color.set('#f2f4f7'); sp.material.opacity = (1 - age) * 0.55 * e.k; }
          sp.visible = true;
        }
      }
      for (; i < N; i++) pool[i].visible = false;
    },
  };
}

// Wet look for a character (or any meshes): darker, glossier; materials cloned per actor the first time.
export function wettable(root) {
  const mats = [];
  root.traverse((o) => { if (o.isMesh && o.material && !o.name.startsWith('Face')) { o.material = o.material.clone(); mats.push([o.material, o.material.color.clone(), o.material.roughness ?? 0.6]); } });
  return (w) => { for (const [m, c, r] of mats) { m.color.copy(c).multiplyScalar(1 - 0.38 * w); if ('roughness' in m) m.roughness = r + (0.18 - r) * w; } };
}
export function wetMaterials(list) {
  const saved = list.map((m) => [m, m.color.clone(), m.roughness]);
  return (w) => { for (const [m, c, r] of saved) { m.color.copy(c).multiplyScalar(1 - 0.3 * w); m.roughness = r + (0.25 - r) * w; } };
}
