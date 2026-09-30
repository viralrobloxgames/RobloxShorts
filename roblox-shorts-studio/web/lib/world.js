// Stage for web-rendered shorts: renderer + post (AO, bloom, AgX), sky and image lighting,
// sun with soft shadows, and Roblox-style obby building blocks (studded parts, spawn pad, signs, clouds).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { roundedBox, roundedCylinder, mat } from './rig.js';

export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5 | 0), ((s ^ (s >>> 14)) >>> 0) / 4294967296); }

const SKY_VERT = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix*vec4(position,1.)).xyz - cameraPosition); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }`;
const SKY_FRAG = `uniform vec3 zenith, horizon, below, sunDir, sunColor; varying vec3 vDir;
void main(){ vec3 d = normalize(vDir); float h = d.y;
  vec3 c = mix(horizon, zenith, pow(smoothstep(0.0, 1.0, h), 0.6));
  c = mix(c, below, smoothstep(0.0, -0.35, h));
  float s = max(dot(d, sunDir), 0.0);
  c += sunColor * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.25);
  gl_FragColor = vec4(c, 1.0); }`;

export function skyMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: new THREE.Color(o.zenith || '#2f7fe6') }, horizon: { value: new THREE.Color(o.horizon || '#bfe4ff') },
      below: { value: new THREE.Color(o.below || '#e9f4ff') }, sunDir: { value: (o.sunDir || new THREE.Vector3(0.5, 0.55, 0.4)).clone().normalize() },
      sunColor: { value: new THREE.Color(o.sunColor || '#fff1d6') },
    },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
  });
}

export function createStage({ width = 1080, height = 1920, scale = 1, sky = {} } = {}) {
  const W = Math.round(width * scale), H = Math.round(height * scale);
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 2000);
  const sunDir = sky.sunDir || new THREE.Vector3(0.55, 0.62, 0.45).normalize();

  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), skyMaterial({ ...sky, sunDir }));
  skyMesh.frustumCulled = false; skyMesh.renderOrder = -1; scene.add(skyMesh);
  scene.fog = new THREE.Fog(sky.fog || '#cfe8ff', 90, 520);

  // Image-based light from the same sky, so reflections and ambient colour agree with the background.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMaterial({ ...sky, sunDir })));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: '#c9d6e6', side: THREE.DoubleSide }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -3; envScene.add(ground);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture; scene.environmentIntensity = 0.55;

  const hemi = new THREE.HemisphereLight('#d9ecff', '#8a93a6', 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0dc', 3.1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#a9d2ff', 0.7); fill.position.set(-8, 4, 6); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffd6f2', 1.1); rim.position.set(-4, 7, -10); scene.add(rim);

  // Keep the sun's shadow box centred on the action so shadows stay sharp at 4k map size.
  function aimSun(target, extent = 18) {
    sun.target.position.copy(target);
    sun.position.copy(target).addScaledVector(sunDir, 80);
    const c = sun.shadow.camera; c.left = c.bottom = -extent; c.right = c.top = extent; c.near = 1; c.far = 200; c.updateProjectionMatrix();
    fill.target.position.copy(target); rim.target.position.copy(target);
    fill.position.copy(target).add(new THREE.Vector3(-8, 4, 6)); rim.position.copy(target).add(new THREE.Vector3(-4, 7, -10));
    scene.add(fill.target, rim.target);
  }
  aimSun(new THREE.Vector3());

  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  // Ambient occlusion at half resolution (denoised, then upsampled): most of the look for a quarter of the cost.
  const ao = new GTAOPass(scene, camera, W / 2, H / 2);
  const aoSetSize = ao.setSize.bind(ao); ao.setSize = (w, h) => aoSetSize(Math.round(w / 2), Math.round(h / 2));
  ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 8 });
  ao.blendIntensity = 0.85;
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.28, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return { W, H, scale, canvas, renderer, scene, camera, composer, sun, sunDir, hemi, fill, rim, aimSun, ao, bloom, skyMesh };
}

// ---------- obby parts ----------
const STUD = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14, 1); // low poly: hundreds per island
export function studs(w, d, y, material, spacing = 1) {
  const nx = Math.max(1, Math.floor(w / spacing)), nz = Math.max(1, Math.floor(d / spacing));
  const inst = new THREE.InstancedMesh(STUD, material, nx * nz);
  const m = new THREE.Matrix4(); let i = 0;
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
    m.makeTranslation(-w / 2 + spacing * (a + 0.5), y + 0.06, -d / 2 + spacing * (b + 0.5)); inst.setMatrixAt(i++, m);
  }
  inst.castShadow = false; inst.receiveShadow = true; return inst;
}

// A Roblox "Part": smooth plastic block, top at y = 0 of the returned group unless opts.center.
export function part(w, h, d, color, o = {}) {
  const g = new THREE.Group();
  const m = o.material || mat(color.replace('#', ''), o.rough ?? 0.42, { clearcoat: o.clearcoat ?? 0.35, clearcoatRoughness: 0.35, ...(o.extra || {}) });
  const mesh = new THREE.Mesh(roundedBox(w, h, d, o.radius ?? 0.12), m);
  mesh.position.y = o.center ? 0 : -h / 2; mesh.castShadow = o.castShadow ?? true; mesh.receiveShadow = true; g.add(mesh);
  if (o.studs) g.add(studs(w, d, o.center ? h / 2 : 0, m));
  g.userData = { w, h, d, mesh };
  return g;
}

export function neonMaterial(color, intensity = 2.2) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
}

// Canvas texture helper (fonts must be loaded first by the runner).
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function spawnPad(size = 6) {
  const g = part(size, 0.35, size, '#9aa3b5', { rough: 0.5 });
  const decal = canvasTexture(512, 512, (x, w) => {
    x.clearRect(0, 0, w, w); x.translate(w / 2, w / 2);
    x.strokeStyle = 'rgba(255,255,255,.92)'; x.lineWidth = 34; x.beginPath(); x.arc(0, 0, 190, 0, 7); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(-42, -60); x.lineTo(42, -60); x.lineTo(0, -140); x.closePath(); x.fill(); }
    x.beginPath(); x.arc(0, 0, 38, 0, 7); x.fill();
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.86, size * 0.86), new THREE.MeshStandardMaterial({ map: decal, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.005; top.receiveShadow = true; g.add(top);
  return g;
}

// Stage sign on two posts, text in Luckiest Guy.
export function sign(text, { w = 5, h = 1.6, bg = '#1f2a44', fg = '#ffffff', accent = '#ffd23f', post = 3.2 } = {}) {
  const g = new THREE.Group();
  const tex = canvasTexture(1024, Math.round(1024 * h / w), (x, W, H) => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = accent; x.lineWidth = 18; x.strokeRect(14, 14, W - 28, H - 28);
    x.font = `${Math.round(H * 0.62)}px "Luckiest Guy"`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = fg; x.fillText(text, W / 2, H / 2 + H * 0.06);
  });
  const board = new THREE.Mesh(roundedBox(w, h, 0.25, 0.06), mat('1f2a44', 0.5));
  board.position.y = post + h / 2; board.castShadow = true; g.add(board);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.18 }));
  face.position.set(0, post + h / 2, 0.13); g.add(face);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(roundedBox(0.28, post, 0.28, 0.05), mat('6b4a2e', 0.7)); p.position.set(s * (w / 2 - 0.5), post / 2, 0); p.castShadow = true; g.add(p); }
  return g;
}

export function checkpoint(color = '#3ddc97') {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(roundedCylinder(0.09, 5, 0.03, 16), mat('e8e8e8', 0.3, { metalness: 0.6 })); pole.position.y = 2.5; pole.castShadow = true; g.add(pole);
  const flag = new THREE.Mesh(roundedBox(1.8, 1.1, 0.06, 0.02), mat(color.replace('#', ''), 0.6)); flag.position.set(0.95, 4.35, 0); flag.castShadow = true; g.add(flag);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 12), mat('ffd23f', 0.25, { metalness: 0.8 })); ball.position.y = 5.05; g.add(ball);
  return g;
}

// Puffy cloud: merged spheres, soft white, lit by the sun.
const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#dfeaff', emissiveIntensity: 0.25 });
export function cloud(seed, size = 6) {
  const r = rng(seed), geos = [];
  const n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const s = size * (0.35 + r() * 0.35);
    const g = new THREE.IcosahedronGeometry(s, 2);
    g.translate((r() - 0.5) * size * 1.8, (r() - 0.2) * size * 0.35, (r() - 0.5) * size * 0.9);
    geos.push(g);
  }
  const base = new THREE.CylinderGeometry(size * 1.1, size * 1.1, 0.01, 24); base.scale(1.3, 1, 0.7); base.translate(0, -size * 0.25, 0);
  const m = new THREE.Mesh(mergeGeometries(geos), cloudMat);
  m.scale.y = 0.62; m.receiveShadow = false; m.castShadow = false;
  return m;
}

// Gold crown that sits on a character's head (attach to actor.bones.Head).
export function crown() {
  const g = new THREE.Group();
  const gold = new THREE.MeshPhysicalMaterial({ color: '#ffc83d', metalness: 1, roughness: 0.22, clearcoat: 0.5 });
  const band = new THREE.Mesh(roundedCylinder(0.62, 0.36, 0.05, 48), gold); band.castShadow = true; g.add(band);
  const gemCols = ['#ff3b5c', '#3ba3ff', '#35e08a', '#ff3b5c', '#b36bff'];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 10;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 4), gold);
    spike.position.set(Math.sin(a) * 0.55, 0.4, Math.cos(a) * 0.55); spike.rotation.y = a; spike.castShadow = true; g.add(spike);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), gold); ball.position.set(Math.sin(a) * 0.55, 0.68, Math.cos(a) * 0.55); g.add(ball);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshPhysicalMaterial({ color: gemCols[i], roughness: 0.05, transmission: 0.2, emissive: gemCols[i], emissiveIntensity: 0.35 }));
    gem.position.set(Math.sin(a) * 0.63, 0, Math.cos(a) * 0.63); gem.scale.set(1, 1.3, 0.5); gem.rotation.y = a; g.add(gem);
  }
  return g;
}

// Roblox-style ForceField bubble: fresnel shell, additive.
export function forceField() {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color('#6fd3ff') }, opacity: { value: 1 }, time: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); vP = position; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 color; uniform float opacity, time; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vV)), 2.2); float bands = 0.5 + 0.5*sin(vP.y*9.0 - time*8.0);
      gl_FragColor = vec4(color * (f*2.2 + bands*0.12), (f*0.9 + 0.06) * opacity); }`,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), m); s.renderOrder = 5; return s;
}

// Soft puff for dust / poof effects (fades with opacity).
export function puff() {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.9, depthWrite: false, emissive: '#ffffff', emissiveIntensity: 0.15 });
  const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), m); s.castShadow = false; return s;
}
