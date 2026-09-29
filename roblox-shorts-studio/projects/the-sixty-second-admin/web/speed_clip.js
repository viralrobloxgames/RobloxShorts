// "Command one: speed" - 10 s test clip for The Sixty Second Admin, rendered with web/ (no Blender).
// Leo types :speed 100, rockets past Max and Mia, overshoots the whole obby, falls off the map and respawns.
// World: Y up, the course runs along +X. Every value below is a pure function of t (seconds).
import * as THREE from 'three';
import { makeCharacter, pose, actionPose, mixPose, setExpression, soleHeight } from '../../../web/lib/rig.js';
import { part, spawnPad, sign, checkpoint, cloud, crown, forceField, puff, neonMaterial, rng } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { caption, adminTimer, chat, speedLines, flash } from '../../../web/lib/overlay.js';

export const meta = { seconds: 10, fps: 30, width: 1080, height: 1920, title: 'Command One Speed' };

// ---- timing (seconds) ----
const T = {
  typeFrom: 0.25, typeTo: 1.15, send: 1.3, turn: [1.35, 1.8], crouch: [1.5, 2.2], go: 2.7,
  jump: 0, respawn: 8.12,
};
const RUN_V = 26, SPAWN = new THREE.Vector3(-4.5, 0.35, 0), EDGE_X = 9, VY = 22, G = 7; // y = VY*tf - G*tf^2
const runX = (tau) => (tau < 0.1 ? (RUN_V * tau * tau) / 0.2 : RUN_V * (tau - 0.05));
T.jump = T.go + (EDGE_X - SPAWN.x) / RUN_V + 0.05;                        // leaves the island edge

const SHOTS = [
  { start: 0.0, end: 2.7, name: 'hook: Leo types :speed' },
  { start: 2.7, end: 3.35, name: 'side-on streak past Max and Mia' },
  { start: 3.35, end: 5.6, name: 'chase: launches and overshoots the course' },
  { start: 5.6, end: 6.4, name: 'Max and Mia, dizzy, look up' },
  { start: 6.4, end: 8.0, name: 'falling off the map' },
  { start: 8.0, end: 10.0, name: 'respawn' },
];

let leo, max, mia, crownMesh, ff, dust = [], cloudsNear = [];
const POS = { max: new THREE.Vector3(0.8, 0, -4.3), mia: new THREE.Vector3(4.6, 0, -4.9), maxEnd: new THREE.Vector3(-0.6, 0, -3.3), miaEnd: new THREE.Vector3(-0.2, 0, 3.3) };

export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };

export async function setup(stage) {
  const { scene } = stage;
  const r = rng(11);

  // Spawn island + course. Tops are at the group's y.
  const island = part(20, 2.4, 16, '#c3cbdb', { studs: true, rough: 0.55 }); island.position.set(0, 0, 0); scene.add(island);
  const pad = spawnPad(6); pad.position.set(SPAWN.x, 0.35, SPAWN.z); scene.add(pad);
  const s1 = sign('STAGE 1', { w: 5.2, h: 1.7, post: 3.4 }); s1.position.set(7.2, 0, -6.2); s1.rotation.y = -0.5; scene.add(s1);
  const cp = checkpoint('#3ddc97'); cp.position.set(8.2, 0, 6.3); scene.add(cp);
  const course = [
    [15, 0.6, 0, 4, 4, '#ff5a5f'], [21.5, 1.6, -1.4, 4, 4, '#ffb400'], [28, 2.6, 1.2, 4, 4, '#3ddc97'],
    [42, 3.6, 0, 4, 4, '#4f8cff'], [48.5, 4.4, -1.2, 4, 4, '#b36bff'],
  ];
  for (const [x, y, z, w, d, c] of course) { const p = part(w, 1, d, c, { studs: true }); p.position.set(x, y, z); scene.add(p); }
  const lava = part(7, 0.6, 1.6, '#ff2d3d', { material: neonMaterial('#ff2d3d', 1.6), radius: 0.08 }); lava.position.set(35, 3.0, 0); scene.add(lava);
  for (const x of [32, 38]) { const post = part(1.2, 0.6, 1.2, '#39414f', {}); post.position.set(x, 3.05, 0); scene.add(post); }
  const island2 = part(12, 2.4, 10, '#c3cbdb', { studs: true, rough: 0.55 }); island2.position.set(60, 5, 0); scene.add(island2);
  const s2 = sign('STAGE 2', { w: 5.2, h: 1.7, post: 3.4 }); s2.position.set(58, 5, -3.8); scene.add(s2);
  const win = part(3.6, 0.3, 3.6, '#ffd23f', { material: neonMaterial('#ffd23f', 0.7) }); win.position.set(63, 5.3, 1.5); scene.add(win);
  // Truss tower and pillars for Roblox flavour.
  for (let i = 0; i < 8; i++) { const b = part(1, 1, 1, '#8a93a6', { radius: 0.06 }); b.position.set(-8.3, 1 + i, -6.8); scene.add(b); }
  const beam = part(1, 1, 7, '#8a93a6', { radius: 0.06 }); beam.position.set(-8.3, 9, -3.8); scene.add(beam);

  // Distant floating obbies for depth (fogged).
  const cols = ['#ff5a5f', '#ffb400', '#3ddc97', '#4f8cff', '#b36bff', '#ff8fd6'];
  for (let i = 0; i < 26; i++) {
    const w = 3 + r() * 9, p = part(w, 1 + r() * 2, 3 + r() * 8, cols[i % cols.length], { studs: false, castShadow: false });
    p.position.set(-60 + r() * 200, -6 + r() * 30, -60 - r() * 120); scene.add(p);
  }
  // Clouds: a sea far below, plus the layer Leo falls through, plus a few at eye level.
  for (let i = 0; i < 70; i++) { const c = cloud(100 + i, 8 + r() * 10); c.position.set(-120 + r() * 320, -70 - r() * 30, -160 + r() * 220); scene.add(c); }
  for (let i = 0; i < 26; i++) { const c = cloud(300 + i, 5 + r() * 6); c.position.set(-80 + r() * 240, 2 + r() * 20, -90 - r() * 60); scene.add(c); }
  for (let i = 0; i < 30; i++) {
    const tf = 3.4 + r() * 1.3, c = cloud(500 + i, 3 + r() * 4);
    c.position.set(EDGE_X + RUN_V * tf + (r() - 0.5) * 30, -26 - r() * 18, (r() - 0.5) * 30); scene.add(c); cloudsNear.push(c);
  }

  leo = makeCharacter('Leo'); max = makeCharacter('Max'); mia = makeCharacter('Mia');
  scene.add(leo.root, max.root, mia.root);
  crownMesh = crown(); crownMesh.position.set(0, 1.5, 0.02); crownMesh.rotation.z = 0.08; crownMesh.scale.setScalar(0.95); leo.bones.Head.add(crownMesh);
  ff = forceField(); scene.add(ff);
  for (let i = 0; i < 14; i++) { const d = puff(); scene.add(d); dust.push(d); }
}

// ---- Leo ----
function leoState(t) {
  const st = { pos: new THREE.Vector3(), rotY: 0, rotX: 0, rotZ: 0, pose: {}, face: 'happy', scale: 1, floor: 0.35, grounded: true };
  if (t < T.go) {
    st.pos.copy(SPAWN);
    const faceCam = -0.57, turn = easeInOut(inv(...T.turn, t));
    st.rotY = lerp(faceCam, Math.PI / 2, turn);
    const idle = actionPose('Idle', (t * 0.6) % 1);
    const hero = { ...idle, 'Arm.L': [0, 0, -14], 'Arm.R': [0, 0, 14], Head: [-4 + 2 * Math.sin(t * 3), 0, 0] };
    const crouch = { Torso: [20, 0, 0], Head: [-14, 0, 0], 'Arm.L': [45, 0, -12], 'Arm.R': [45, 0, 12], 'Leg.L': [-28, 0, 0], 'Leg.R': [24, 0, 0] };
    const k = easeOutBack(inv(...T.crouch, t), 1.4);
    st.pose = mixPose(hero, crouch, k); st.rootDrop = -0.35 * clamp(k);
    st.face = t < T.send ? 'happy' : 'angry';
    st.shake = t > 2.2 ? 0.03 * Math.sin(t * 90) : 0;
  } else if (t < T.jump) {
    const tau = t - T.go;
    st.pos.set(SPAWN.x + runX(tau), 0, 0);
    st.floor = st.pos.x < SPAWN.x + 3 ? 0.35 : 0;
    st.rotY = Math.PI / 2;
    const run = actionPose('Run', (tau * 5.5) % 1);
    st.pose = mixPose(run, { Torso: [26, 0, 0], Head: [-18, 0, 0], 'Arm.L': [60, 0, -10], 'Arm.R': [60, 0, 10] }, 0.55);
    st.face = 'angry';
  } else {
    const tf = t - T.jump;
    st.grounded = false;
    st.pos.set(EDGE_X + RUN_V * tf, VY * tf - G * tf * tf, 0);
    const turnBack = easeInOut(inv(4.8, 5.35, t));
    st.rotY = lerp(Math.PI / 2, -0.45, turnBack);
    const flail = Math.sin(t * 22), kick = Math.sin(t * 17);
    const glide = { Torso: [12, 0, 0], Head: [-10, 0, 0], 'Arm.L': [60, 0, -40], 'Arm.R': [60, 0, 40], 'Leg.L': [-10, 0, 0], 'Leg.R': [30, 0, 0] };
    const panic = { Torso: [-8, 0, 0], Head: [-12, 0, 0], 'Arm.L': [0, 0, -150 - 18 * flail], 'Arm.R': [0, 0, 150 + 18 * flail], 'Leg.L': [30 * kick, 0, 0], 'Leg.R': [-30 * kick, 0, 0] };
    st.pose = mixPose(glide, panic, easeInOut(inv(4.85, 5.4, t)));
    st.face = t < 4.85 ? 'laugh' : t < 6.55 ? 'surprised' : 'sad';
    st.rotZ = 0.12 * Math.sin(t * 2.3) * inv(6, 7, t);
    st.rotX = -0.25 * inv(6.0, 7.5, t);
  }
  if (t >= 8.0) {
    // Respawn on the pad inside a ForceField.
    st.pos.copy(SPAWN); st.grounded = true; st.floor = 0.35; st.rotX = st.rotZ = 0;
    st.rotY = -1.25;
    const lt = t - T.respawn;
    st.scale = t < T.respawn ? 0.001 : lerp(0.2, 1, easeOutBack(clamp(lt / 0.32), 2.2));
    const shrug = { 'Arm.L': [-10, 0, -32], 'Arm.R': [-10, 0, 32], Head: [4, 0, 12], Torso: [0, 0, -3] };
    st.pose = mixPose(actionPose('Idle', 0), shrug, easeOutBack(inv(8.9, 9.3, t)));
    st.face = t < 8.85 ? 'surprised' : 'sad';
  }
  return st;
}

function placeActor(a, st) {
  a.root.position.copy(st.pos); a.root.rotation.set(st.rotX || 0, st.rotY, st.rotZ || 0, 'YXZ');
  a.root.scale.setScalar(st.scale ?? 1);
  pose(a, st.pose);
  if (st.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += st.floor - soleHeight(a) + (st.rootDrop || 0); }
  if (st.shake) a.root.position.x += st.shake;
  setExpression(a, st.face);
}

// ---- Max and Mia ----
function buddyState(who, t) {
  const base = who === 'max' ? POS.max : POS.mia, end = who === 'max' ? POS.maxEnd : POS.miaEnd;
  const passT = T.go + (base.x - SPAWN.x) / RUN_V;         // when Leo whooshes past
  const st = { pos: base.clone(), rotY: -Math.PI / 2 + 0.6, pose: actionPose('Idle', ((t + (who === 'max' ? 0 : 0.4)) * 0.6) % 1), face: 'neutral', grounded: true, floor: 0 };
  if (t < passT - 0.05) {
    st.face = t > 1.4 ? 'surprised' : 'neutral';
    if (t < 1.4) st.pose = actionPose('Idle', (t * 0.6) % 1);
  } else if (t < 8.0) {
    const u = clamp((t - passT) / 2.0);
    st.rotY += easeOut(u) * (5 * Math.PI - 0.9);             // spun two and a half turns by the gust, ends facing +X
    const shock = actionPose('Shock', 0);
    const lookUp = { ...shock, Torso: [-8, 0, 0], Head: [-24, who === 'max' ? 6 : -6, 0], 'Arm.L': who === 'max' ? [-150, 0, -25] : shock['Arm.L'], 'Arm.R': who === 'max' ? [-150, 0, 25] : shock['Arm.R'] };
    st.pose = mixPose(shock, lookUp, easeInOut(inv(4.9, 5.5, t)));
    st.face = 'surprised';
    st.pos.y += 0.3 * Math.sin(Math.PI * clamp(u * 2.2));    // lifted off their feet a little
    if (u > 0 && u < 0.45) st.grounded = false;
  } else {
    // Walked back to the spawn while Leo was gone; now laughing / shaking head at him.
    st.pos.copy(end);
    st.rotY = Math.atan2(SPAWN.x - end.x, SPAWN.z - end.z);
    if (who === 'max') {
      st.pose = t > 8.75 ? mixPose(actionPose('Laugh', (t * 2.2) % 1), { 'Arm.R': [-70, 0, 20] }, 0.35) : actionPose('Shock', 0);
      st.face = t > 8.75 ? 'laugh' : 'surprised';
    } else {
      const shake = t > 9.0 ? Math.sin((t - 9.0) * 16) * 16 * clamp((10 - t) * 2) : 0;
      st.pose = t > 8.9 ? { 'Arm.L': [0, 0, -4], 'Arm.R': [0, 0, 4], Head: [8, shake, 0], Torso: [3, 0, 0] } : actionPose('Shock', 0);
      st.face = t > 8.9 ? 'neutral' : 'surprised';
    }
  }
  return st;
}

// ---- cameras ----
function lookCam(stage, pos, target, fov) {
  const c = stage.camera; c.position.copy(pos); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(target);
}

// Sub-samples per frame: heavy motion blur on the streak, light blur while the camera tracks him, MSAA only elsewhere.
export function samples(t) { return t >= 2.7 && t < 3.35 ? 6 : (t >= 3.35 && t < 5.6) || (t >= 6.4 && t < 8.0) ? 3 : 1; }
export function shutter(t) { return t >= 2.7 && t < 8.0 ? 0.5 : 0; }

export function update(t, stage) {
  const L = leoState(t);
  placeActor(leo, L);
  placeActor(max, buddyState('max', t));
  placeActor(mia, buddyState('mia', t));

  // Crown glint: slight bob on landing / respawn pop.
  crownMesh.rotation.y = t * 0.8;

  // ForceField bubble after respawn.
  const ffT = t - T.respawn;
  ff.visible = ffT > 0 && ffT < 1.7;
  if (ff.visible) {
    ff.position.set(SPAWN.x, 2.9, SPAWN.z);
    ff.scale.setScalar(3.6 * easeOutBack(clamp(ffT / 0.25), 2));
    ff.material.uniforms.opacity.value = 1 - inv(1.2, 1.7, ffT);
    ff.material.uniforms.time.value = t;
  }

  // Dust kicked up along the run line.
  dust.forEach((d, i) => {
    const born = T.go + 0.02 + i * 0.035, age = t - born;
    d.visible = age > 0 && age < 1.2 && born < T.jump;
    if (!d.visible) return;
    const x = SPAWN.x + runX(born - T.go);
    const floor = x < SPAWN.x + 3 ? 0.35 : 0;
    d.position.set(x - 0.6, floor + 0.3 + age * 0.9, (i % 2 ? 0.7 : -0.7) * (1 + age));
    d.scale.setScalar(0.18 + age * 0.55);
    d.material.opacity = 0.45 * (1 - age / 1.2) ** 2;
  });

  const { index, u, lt } = shotAt(SHOTS, t);
  const lp = leo.root.position;
  if (index === 0) {
    // Leo full figure in the lower two thirds, clear of the HUD and chat.
    lookCam(stage, new THREE.Vector3(lerp(-12.6, -11.4, easeOut(u)), lerp(3.0, 3.3, u), lerp(10.8, 9.6, easeOut(u))), new THREE.Vector3(-4.3, 4.3, 0.1), 40);
    stage.aimSun(new THREE.Vector3(-2, 0, 0), 14);
  } else if (index === 1) {
    // Side-on: Leo streaks left to right in front of Max and Mia.
    const kick = 0.1 * Math.exp(-Math.max(0, t - 2.95) * 6) * (t > 2.95 ? 1 : 0);
    lookCam(stage, new THREE.Vector3(2.6 + kick * Math.sin(t * 90), 3.0 + kick * Math.cos(t * 75), 15), new THREE.Vector3(2.6, 3.7, -2.4), 44);
    stage.aimSun(new THREE.Vector3(2, 0, -2), 14);
  } else if (index === 2) {
    // Chase cam behind and above: the course slides by underneath, then there is nothing left.
    const cam = lp.clone().add(new THREE.Vector3(lerp(-14, -13, u), lerp(6.0, 7.5, u), lerp(4.5, 7.0, easeInOut(u))));
    lookCam(stage, cam, lp.clone().add(new THREE.Vector3(3, lerp(0.7, -0.3, u), 0)), 46);
    stage.aimSun(lp.clone().add(new THREE.Vector3(6, -6, 0)), 24);
  } else if (index === 3) {
    lookCam(stage, new THREE.Vector3(lerp(12.5, 12.0, u), 3.4, lerp(3.4, 3.0, u)), new THREE.Vector3(2.4, 4.6, -3.9), 46);
    stage.aimSun(new THREE.Vector3(2.7, 0, -4.6), 10);
  } else if (index === 4) {
    const dir = new THREE.Vector3(Math.sin(-0.45), 0, Math.cos(-0.45));
    const cam = lp.clone().addScaledVector(dir, lerp(15, 13, u)).add(new THREE.Vector3(0, lerp(2.5, 3.5, u), 0));
    lookCam(stage, cam, lp.clone().add(new THREE.Vector3(0, 4.4, 0)), 40);
    stage.aimSun(lp.clone(), 12);
  } else {
    lookCam(stage, new THREE.Vector3(lerp(-21.5, -20.5, easeOut(u)), lerp(4.0, 3.8, u), lerp(3.6, 3.2, u)), new THREE.Vector3(-2.2, 4.4, 0.0), 46);
    stage.aimSun(new THREE.Vector3(-2, 0, 0), 12);
  }
  stage.bloom.strength = index === 5 ? 0.4 : 0.28;
}

// ---- overlay: HUD timer, chat, captions, speed lines, transitions ----
export function overlay(g, s, t) {
  const { index } = shotAt(SHOTS, t);
  // Speed lines while he launches and while he falls.
  speedLines(g, s, t, index === 1 ? 0.9 : index === 4 ? 0.5 : index === 2 ? 0.4 * (1 - inv(4.6, 5.3, t)) : 0, { cx: 540, cy: 950 });
  // Cloud whiteout into the respawn.
  flash(g, s, index === 4 ? inv(7.55, 8.0, t) : index === 5 ? 1 - inv(8.0, 8.35, t) : 0);
  flash(g, s, t > 2.62 && t < 2.8 ? 0.55 * (1 - Math.abs(t - 2.7) / 0.08) : 0);

  adminTimer(g, s, 60 - t, t, { flash: t > 9.2 ? 0.5 + 0.5 * Math.sin(t * 18) : 0 });
  chat(g, s, t, [
    { name: 'Mia', color: '#C9A6FF', text: 'wait u have admin??', at: -1 },
    { name: 'Leo', color: '#FF9E80', text: ':speed 100', at: T.send },
  ], { name: 'Leo', text: ':speed 100', from: T.typeFrom, to: T.typeTo }, { alpha: 1 - inv(3.1, 3.5, t) });

  caption(g, s, 'LEO GOT ADMIN\nFOR 60 SECONDS', 0.0, 2.62, t, { y: 1390, pop: false });
  caption(g, s, 'COMMAND ONE:\nSPEED', 2.74, 3.9, t, { y: 1390, hl: 'SPEED' });
  caption(g, s, 'A LITTLE TOO\nMUCH SPEED', 3.95, 5.55, t, { y: 1390, hl: 'MUCH' });
  caption(g, s, 'AND OFF...', 5.62, 6.38, t, { y: 1390 });
  caption(g, s, '...THE MAP', 6.44, 7.75, t, { y: 1390, hl: 'MAP' });
  caption(g, s, 'RESPAWN.', 8.2, 9.15, t, { y: 1390 });
  caption(g, s, '50 SECONDS\nLEFT', 9.2, 10.0, t, { y: 1390, hl: '50' });
}
