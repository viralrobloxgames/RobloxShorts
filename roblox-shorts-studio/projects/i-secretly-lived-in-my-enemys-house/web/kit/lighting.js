// Lighting presets and practical lights. One preset per scene time; chapters never set light colours themselves.
//   K.applyLight(stage, 'night_moon', { set: K.currentSet(), practicals: { bedside_lamp: false } });
// Call it in update() for every frame (it is cheap and keeps each frame a pure function of t).
// Practicals a set owns live in set.lights (name -> THREE.Light, optional light.userData.bulb = emissive mesh(es));
// movable ones (flashlight beam, phone glow, glow sticks) come from the factories below.
import * as THREE from 'three';
import { skyMaterial } from '../../../../web/lib/world.js';

// sky: background + image light; sun: the key (moon through the window at night); hemi: ambient; env: image-light
// strength; exposure: tone-mapping exposure; fog: [colour, near, far]; practicals: the set lights that are on by default.
export const PRESETS = {
  night_moon: {        // Max's room / hallway at night, moonlight through the window, cool and dark but readable
    sky: { zenith: '#070d22', horizon: '#1d2b52', below: '#080b18', sunColor: '#9fb6ff' },
    sun: ['#a9bfff', 1.5, [-0.45, 0.7, 0.55]], hemi: ['#5a6fa8', '#1a1a2a', 0.55], fill: ['#7f95d6', 0.35], rim: ['#b9c8ff', 0.55],
    env: 0.32, exposure: 1.05, fog: ['#0e1428', 140, 600], bloom: 0.35, practicals: { moon_window: true, nightlight: true },
  },
  midnight: {          // Ch10: darker than night_moon; the lamp click is the reveal
    sky: { zenith: '#04081a', horizon: '#121c3c', below: '#05070f', sunColor: '#8aa2f0' },
    sun: ['#8fa6f5', 1.1, [-0.45, 0.7, 0.55]], hemi: ['#3e4f86', '#101018', 0.4], fill: ['#6a7fc4', 0.25], rim: ['#a4b6ff', 0.45],
    env: 0.22, exposure: 1.0, fog: ['#080c1c', 140, 600], bloom: 0.45, practicals: { moon_window: 0.6, nightlight: true },
  },
  night_fridge: {      // kitchen at night: blue moon + the warm fridge light when the door is open (practical fridge_light)
    sky: { zenith: '#070d22', horizon: '#1d2b52', below: '#080b18', sunColor: '#9fb6ff' },
    sun: ['#a9bfff', 1.2, [0.5, 0.7, 0.45]], hemi: ['#4d5f96', '#18161e', 0.45], fill: ['#6f86c8', 0.3], rim: ['#b9c8ff', 0.5],
    env: 0.28, exposure: 1.05, fog: ['#0e1428', 140, 600], bloom: 0.4, practicals: { fridge_light: true, moon_window: true },
  },
  predawn: {           // Tuesday 6 am: deep blue windows, warm kitchen ceiling light on
    sky: { zenith: '#1a2350', horizon: '#6a5f8f', below: '#14162a', sunColor: '#ffb48a' },
    sun: ['#c8b8ff', 1.3, [0.6, 0.35, 0.5]], hemi: ['#8a8fc0', '#3a2f2a', 0.7], fill: ['#ffcf9e', 0.5], rim: ['#c9b8ff', 0.5],
    env: 0.45, exposure: 1.0, fog: ['#3a3d66', 140, 600], bloom: 0.3, practicals: { ceiling_light: true },
  },
  school_day: {        // classroom, bright neutral daylight through the windows
    sky: { zenith: '#2f7fe6', horizon: '#bfe4ff', below: '#e9f4ff', sunColor: '#fff1d6' },
    sun: ['#fff0dc', 3.0, [0.55, 0.62, 0.45]], hemi: ['#d9ecff', '#8a93a6', 0.7], fill: ['#a9d2ff', 0.7], rim: ['#ffe6c8', 0.8],
    env: 0.6, exposure: 0.95, fog: ['#cfe8ff', 160, 700], bloom: 0.22, practicals: {},
  },
  dusk: {              // Monday after school, the back of the house: low orange sun, purple sky
    sky: { zenith: '#2b2f6b', horizon: '#ff9a5c', below: '#3a2a3a', sunColor: '#ffae66' },
    sun: ['#ffb070', 2.4, [0.8, 0.22, 0.4]], hemi: ['#a58ac9', '#4a3426', 0.6], fill: ['#8a7fd6', 0.45], rim: ['#ffc48a', 1.0],
    env: 0.5, exposure: 1.0, fog: ['#7a5a7a', 140, 650], bloom: 0.3, practicals: {},
  },
  attic_afternoon: {   // the attic's own lights (set.lights.sun through the round window, bounce) carry it: the stage sun is off
    sky: { zenith: '#4f8fe0', horizon: '#ffe2b0', below: '#d8c8a8', sunColor: '#ffd9a0' },
    sun: ['#ffd9a8', 0.0, [0.75, 0.45, 0.35]], hemi: ['#ffe3c0', '#5a4636', 0.22], fill: ['#ffcf9a', 0.12], rim: ['#ffe0b8', 0.2],
    env: 0.18, exposure: 1.0, fog: ['#c9a882', 140, 650], bloom: 0.3, practicals: { sun: true, bounce: true },
  },
  sunday_morning: {    // Ch11 kitchen: soft warm morning, the happiest light in the film
    sky: { zenith: '#5aa8f0', horizon: '#fff0d0', below: '#f0ead8', sunColor: '#fff2c8' },
    sun: ['#fff1d0', 1.4, [0.6, 0.5, 0.5]], hemi: ['#fff2dc', '#9a8a76', 0.5], fill: ['#ffe2b8', 0.35], rim: ['#fff4dc', 0.6],
    env: 0.42, exposure: 0.9, fog: ['#f0e6d0', 160, 700], bloom: 0.22, practicals: {},   // the kitchen adds its own sun-in and room fill
  },
};

const envCache = new Map();
function envFor(stage, id, sky) {
  if (!envCache.has(id)) {
    const pmrem = new THREE.PMREMGenerator(stage.renderer), envScene = new THREE.Scene();
    const sd = new THREE.Vector3(...PRESETS[id].sun[2]).normalize();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMaterial({ ...sky, sunDir: sd })));
    const tex = pmrem.fromScene(envScene, 0.02).texture; tex.name = 'env:' + id;   // a stable name for render.mjs's fingerprint
    envCache.set(id, tex);
  }
  return envCache.get(id);
}

// Apply preset `id` to the stage. opts.set: the set whose practicals to switch (default: every set light off except the
// preset's defaults); opts.practicals: { name: on | intensity factor } overriding the preset's defaults.
export function applyLight(stage, id, opts = {}) {
  const p = PRESETS[id];
  if (!p) throw new Error(`kit: no lighting preset "${id}" (have: ${Object.keys(PRESETS).join(', ')})`);
  const sunDir = new THREE.Vector3(...p.sun[2]).normalize();
  const u = stage.skyMesh.material.uniforms;
  u.zenith.value.set(p.sky.zenith); u.horizon.value.set(p.sky.horizon); u.below.value.set(p.sky.below); u.sunColor.value.set(p.sky.sunColor); u.sunDir.value.copy(sunDir);
  stage.scene.environment = envFor(stage, id, p.sky); stage.scene.environmentIntensity = p.env;
  stage.sunDir.copy(sunDir);                       // aimSun() places the sun along stage.sunDir
  stage.sun.color.set(p.sun[0]); stage.sun.intensity = p.sun[1];
  stage.hemi.color.set(p.hemi[0]); stage.hemi.groundColor.set(p.hemi[1]); stage.hemi.intensity = p.hemi[2];
  stage.fill.color.set(p.fill[0]); stage.fill.intensity = p.fill[1];
  stage.rim.color.set(p.rim[0]); stage.rim.intensity = p.rim[1];
  stage.renderer.toneMappingExposure = p.exposure;
  stage.scene.fog.color.set(p.fog[0]); stage.scene.fog.near = p.fog[1]; stage.scene.fog.far = p.fog[2];
  if (stage.bloom) stage.bloom.strength = p.bloom;
  if (opts.set) {
    const want = { ...p.practicals, ...(opts.practicals || {}) };
    for (const name of Object.keys(opts.set.lights || {})) setPractical(opts.set, name, want[name] ?? false);
  }
  return p;
}

// Switch one of a set's practical lights: on = true/false or an intensity factor (0..1+). The light's authored intensity
// is remembered on first use; light.userData.bulb (a mesh or array of meshes) gets its emissive switched with it.
export function setPractical(set, name, on) {
  const l = set.lights?.[name]; if (!l) return;
  const lights = [].concat(l.isLight ? l : (l.lights || l.light || []));
  const k = on === true ? 1 : on === false ? 0 : Number(on);
  for (const L of lights) {
    L.userData.base ??= L.intensity; L.intensity = L.userData.base * k; L.visible = k > 0;
    for (const b of [].concat(L.userData.bulb || [])) { b.material.userData.base ??= b.material.emissiveIntensity; b.material.emissiveIntensity = b.material.userData.base * (k > 0 ? Math.max(k, 0.15) : 0); }
  }
}

// ---------- movable practicals ----------
// Flashlight beam: a spot light plus a faint visible cone (cone: false for none, e.g. a torch under a chin at MCU).
//   beam.set(on, fromWorld, dirWorld)      on = true/false or an intensity factor
//   beam.fromProp(on, prop, axis?)         from a held prop: its world position, along its local axis (default +z)
export function flashlightBeam(stage, { color = '#fff3c4', intensity = 60, range = 40, distance, angle = 0.32, cone = 0.06, penumbra = 0.5 } = {}) {
  const light = new THREE.SpotLight(color, 0, distance ?? range, angle, penumbra, 1.4); light.userData.base = intensity;
  let mesh = null;
  if (cone) {
    const len = 9, geo = new THREE.ConeGeometry(Math.tan(angle) * len, len, 24, 1, true); geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);
    mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: cone, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    mesh.userData.noCamBlock = true; stage.scene.add(mesh);
  }
  stage.scene.add(light, light.target);
  const set = (on, from, dir) => {
    light.visible = !!on; if (mesh) mesh.visible = !!on; light.intensity = on ? intensity * (on === true ? 1 : on) : 0;
    if (!on) return;
    light.position.copy(from); light.target.position.copy(from).addScaledVector(dir.clone().normalize(), 10);
    if (mesh) { mesh.position.copy(from); mesh.lookAt(light.target.position); }
  };
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion();
  const fromProp = (on, prop, axis = new THREE.Vector3(0, 0, 1)) => {
    if (!on) return set(false);
    prop.updateWorldMatrix(true, false); prop.getWorldPosition(_p); prop.getWorldQuaternion(_q);
    set(on, _p, axis.clone().applyQuaternion(_q));
  };
  set(false);
  return { light, mesh, set, fromProp };
}
// Torch under the chin (Ch6): a soft warm up-light just below and in front of a face, short range, no cone.
//   chin.set(on, actor)   (uses the head's world position and the actor's facing)
export function chinLight(stage, { color = '#ffd9a0', intensity = 9, range = 4.5 } = {}) {
  const light = new THREE.PointLight(color, 0, range, 2); stage.scene.add(light);
  const _h = new THREE.Vector3();
  const set = (on, actor) => {
    light.visible = !!on; light.intensity = on ? intensity * (on === true ? 1 : on) : 0;
    if (!on) return;
    actor.root.updateMatrixWorld(true); actor.bones.Head.localToWorld(_h.set(0, 0.1 * actor.scale, 0));
    const h = actor.root.rotation.y; light.position.copy(_h).add(new THREE.Vector3(Math.sin(h) * 0.9, -0.6 * actor.scale, Math.cos(h) * 0.9));
  };
  set(false);
  return { light, set };
}
// Phone glow: a small cool light in front of a face. glow.set(on, phoneWorldPos)
export function phoneGlow(stage, { color = '#cfe2ff', intensity = 6, range = 5 } = {}) {
  const light = new THREE.PointLight(color, 0, range, 2); stage.scene.add(light);
  const set = (on, pos) => { light.visible = !!on; light.intensity = on ? intensity * (on === true ? 1 : on) : 0; if (on && pos) light.position.copy(pos); };
  set(false);
  return { light, set };
}
// Glow sticks (Ch9 bundle, Ch10 round Skye's wrists): a green light per stick. sticks.set(on, [worldPos, ...])
export function glowSticks(stage, n = 2, { color = '#5dff7a', intensity = 4, range = 6 } = {}) {
  const lights = Array.from({ length: n }, () => { const l = new THREE.PointLight(color, 0, range, 2); stage.scene.add(l); return l; });
  const set = (on, positions = []) => lights.forEach((l, i) => { l.visible = !!on && !!positions[i]; l.intensity = l.visible ? intensity : 0; if (l.visible) l.position.copy(positions[i]); });
  set(false);
  return { lights, set };
}
