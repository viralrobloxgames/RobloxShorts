// The Last Penalty. Web renderer + Roblox R6 pack. Last kick of the final: Mia in goal, Leo on the spot. Leo always
// looks at the corner he's aiming for; Mia reads it and saves, but she left her line early, so it's retaken. Leo shuts
// his eyes, scuffs the kick into the grass and the ball rolls to Mia's boot. Story logic and timing: web/timeline.js;
// beats: web/beats.js. "Left" is the keeper's left (world +X), screen-left in the goal-side shots.
import * as THREE from 'three';
import { setExpression, mat, roundedCylinder } from '../../../web/lib/rig.js';
import { part, canvasTexture, rng, puff } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { roundRect, flash } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, packItem } from '../../../web/lib/robloxPack.js';
import { W } from './beats.js';
import * as TL from './timeline.js';

export const meta = { seconds: Math.ceil((W.end + 1.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Last Penalty' };
export const sky = { zenith: '#3f78d6', horizon: '#ffd7a6', below: '#9fb9cf', fog: '#e9cfae', sunDir: new THREE.Vector3(-0.45, 0.42, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const P = (p, y = 0) => V(p[0], y, p[1]);
const { T, EVENTS: E, REPLAY } = TL;
const HOME = '#8a5cff', AWAY = '#ff7a2f';

// ---------- shots (real time) ----------
const SHOTS = [
  [0, 'hook'], [W.save - 0.25, 'stakes'], [W.cup - 0.35, 'cup'], [W.miss - 0.2, 'miss'], [W.leo - 0.25, 'season'],
  [W.watched - 0.25, 'watched'], [REPLAY.from, 'replayA1'], [REPLAY.kickA - 0.55, 'replayA2'], [REPLAY.b, 'replayB1'],
  [REPLAY.kickB - 0.3, 'replayB2'], [REPLAY.to, 'flick'], [T.dive1 - 0.12, 'dive'], [T.hit1 - 0.3, 'slap'],
  [W.storms - 0.25, 'storm'], [W.referee - 0.25, 'whistle'], [T.freeze[0], 'freeze'], [T.reset, 'reading'],
  [W.anywhere - 0.25, 'anywhere'], [W.closes - 0.25, 'closes'], [W.clue - 0.25, 'noclue'], [W.hardest - 0.25, 'hardest'],
  [W.stay - 0.2, 'line'], [W.runs - 0.25, 'run2'], [T.kick2 - 0.35, 'scuff'], [W.rolls - 0.2, 'roll'],
  [W.stops - 0.3, 'boot'], [W.opens - 0.25, 'opens'], [W.waiting - 0.25, 'net'], [W.every2 - 0.25, 'season2'],
  [W.see - 0.25, 'see'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

// ---------- scene ----------
let A = {}, mia, leo, max, noob, ball, cam, SHOT = 'hook', crowd, clumps = [], dust = [], whistleProp;
const FACES = {
  Mia: ['determined', 'suspicious', 'shouting', 'laugh', 'shocked', 'sad', 'nervous', 'surprised', 'smug'],
  Leo: ['smug', 'cool', 'determined', 'shocked', 'angry', 'scheming', 'squeezed', 'happy', 'confused', 'crying'],
  Max: ['nervous', 'happy', 'laugh', 'shocked', 'determined'],
  Noob: ['neutral', 'shouting', 'annoyed'],
};

function netTexture(rx, ry) {
  const t = canvasTexture(128, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(0, 2); x.lineTo(w, 2); x.moveTo(2, 0); x.lineTo(2, h); x.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t;
}
function netPanel(w, h, cell = 0.55) {
  const m = new THREE.MeshStandardMaterial({ map: netTexture(w / cell, h / cell), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.castShadow = false; mesh.receiveShadow = true; return mesh;
}
function bar(a, b, r = 0.22, color = 'f4f4f0') {
  const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 20), mat(color, 0.35, { clearcoat: 0.6 }));
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = m.receiveShadow = true; return m;
}
function line(scene, x0, z0, x1, z1, w = 0.32) {
  const len = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, w), mat('f6f6f0', 0.7));
  m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); m.receiveShadow = true; scene.add(m);
}
function ballTexture() {
  // Classic panels: black patches at the 12 icosahedron vertex directions on a white equirect map.
  const phi = (1 + Math.sqrt(5)) / 2, dirs = [];
  for (const [a, b] of [[1, phi], [-1, phi], [1, -phi], [-1, -phi]]) dirs.push([0, a, b], [a, b, 0], [b, 0, a]);
  return canvasTexture(1024, 512, (x, w, h) => {
    x.fillStyle = '#f7f7f2'; x.fillRect(0, 0, w, h);
    const img = x.getImageData(0, 0, w, h), d = img.data;
    const n = dirs.map((v) => { const l = Math.hypot(...v); return v.map((c) => c / l); });
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const lon = (i / w) * 2 * Math.PI, lat = (0.5 - j / h) * Math.PI;
      const p = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
      let best = 0; for (const v of n) best = Math.max(best, p[0] * v[0] + p[1] * v[1] + p[2] * v[2]);
      const k = (j * w + i) * 4;
      if (best > 0.955) { d[k] = 24; d[k + 1] = 26; d[k + 2] = 32; } else if (best > 0.947) { d[k] = 120; d[k + 1] = 120; d[k + 2] = 120; }
    }
    x.putImageData(img, 0, 0);
  });
}

export async function setup(stage) {
  const { scene } = stage;
  stage.renderer.toneMappingExposure = 1.0;
  scene.fog = new THREE.Fog('#e9cfae', 120, 420);
  [mia, leo, max, noob] = await Promise.all(['Mia', 'Leo', 'Max', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions: FACES[n], hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(mia.root, leo.root, max.root, noob.root);
  for (const n of ['idle', 'run', 'walk', 'proud', 'laugh_big', 'point_forward']) A[n] = await loadAnimation(n);

  // Keeper gloves for Mia (and Max when he keeps goal in the season replay).
  for (const k of [mia, max]) for (const side of ['L', 'R']) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, 1.1), mat(k === mia ? 'c8ff3c' : 'ffd23f', 0.5));
    g.position.set(side === 'L' ? 0.5 : -0.5, -1.22, 0); g.castShadow = true; g.name = 'glove'; g.userData.keeper = true;
    k.bones['Arm.' + side].add(g);
  }
  whistleProp = new THREE.Group();
  const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 16), mat('c9ced6', 0.25, { metalness: 0.8 })); wb.rotation.z = Math.PI / 2; whistleProp.add(wb);
  const lanyard = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), mat('ff3b5c', 0.5)); lanyard.position.x = -0.32; whistleProp.add(lanyard);
  whistleProp.position.set(-0.5, -1.62, 0.25); noob.bones['Arm.R'].add(whistleProp);

  // Pitch: mown stripes, lines, the spot and the arc.
  const grassTex = canvasTexture(64, 512, (x, w, h) => {
    x.fillStyle = '#3f9b3a'; x.fillRect(0, 0, w, h / 2); x.fillStyle = '#4bab43'; x.fillRect(0, h / 2, w, h / 2);
    const r = rng(7); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '20,60,20' : '120,190,90'},0.18)`; x.fillRect(r() * w, r() * h, 2, 2); }
  });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(1, 220 / 16);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(160, 220), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92 }));
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, 0, 40); grass.receiveShadow = true; scene.add(grass);
  line(scene, -46, 0, 46, 0, 0.36);
  line(scene, -16, 9, 16, 9); line(scene, -16, 0, -16, 9); line(scene, 16, 0, 16, 9);
  line(scene, -32, 27, 32, 27); line(scene, -32, 0, -32, 27); line(scene, 32, 0, 32, 27);
  line(scene, -46, 0, -46, 120); line(scene, 46, 0, 46, 120);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), mat('f6f6f0', 0.7)); spot.rotation.x = -Math.PI / 2; spot.position.set(TL.SPOT[0], 0.013, TL.SPOT[1]); scene.add(spot);
  const a0 = Math.asin(9 / 15), arc = new THREE.Mesh(new THREE.RingGeometry(14.84, 15.16, 64, 1, Math.PI + a0, Math.PI - 2 * a0), mat('f6f6f0', 0.7));
  arc.rotation.x = -Math.PI / 2; arc.position.set(0, 0.012, TL.SPOT[1]); arc.material.side = THREE.DoubleSide; scene.add(arc);

  // The goal: posts, bar, sloping net.
  const { halfW: gw, bar: gh, depth: gd } = TL.GOAL;
  scene.add(bar(V(-gw, 0, 0), V(-gw, gh, 0)), bar(V(gw, 0, 0), V(gw, gh, 0)), bar(V(-gw - 0.22, gh, 0), V(gw + 0.22, gh, 0)));
  for (const s of [-1, 1]) {
    scene.add(bar(V(s * gw, gh, 0), V(s * gw, gh, -2.2), 0.07, 'dddddd'), bar(V(s * gw, gh, -2.2), V(s * gw, 0, -gd), 0.07, 'dddddd'), bar(V(s * gw, 0, 0), V(s * gw, 0, -gd), 0.07, 'dddddd'));
    const side = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, gh), new THREE.Vector2(2.2, gh), new THREE.Vector2(gd, 0)])),
      new THREE.MeshStandardMaterial({ map: netTexture(1, 1), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8 }));
    side.material.map.repeat.set(1 / 0.55, 1 / 0.55); side.rotation.y = Math.PI / 2; side.position.set(s * gw, 0, 0); scene.add(side);
  }
  scene.add(bar(V(-gw, gh, -2.2), V(gw, gh, -2.2), 0.07, 'dddddd'), bar(V(-gw, 0, -gd), V(gw, 0, -gd), 0.07, 'dddddd'));
  const roof = netPanel(gw * 2, 2.2); roof.rotation.x = -Math.PI / 2; roof.position.set(0, gh, -1.1); scene.add(roof);
  const backLen = Math.hypot(gh, gd - 2.2), back = netPanel(gw * 2, backLen);
  back.position.set(0, gh / 2, -(2.2 + gd) / 2); back.rotation.x = -Math.atan2(gd - 2.2, gh); scene.add(back);

  // Advertising boards, stands and the crowd.
  const boardTex = canvasTexture(2048, 128, (x, w, h) => {
    x.fillStyle = '#10162a'; x.fillRect(0, 0, w, h); x.font = '84px "Luckiest Guy"'; x.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#ffd23f' : '#ffffff'; x.fillText(i % 2 ? '@VIRALROBLOXGAMES' : 'THE FINAL ★', i * 520 + 20, h / 2 + 6); }
  });
  boardTex.wrapS = THREE.RepeatWrapping;
  const boardMat = (rep) => { const t = boardTex.clone(); t.needsUpdate = true; t.repeat.set(rep, 1); return new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.5 }); };
  const boards = [[0, -8, 92, 0], [-50, 40, 96, Math.PI / 2], [50, 40, 96, -Math.PI / 2], [0, 104, 100, Math.PI]];
  for (const [x, z, w, ry] of boards) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, 0.3), [mat('10162a'), mat('10162a'), mat('10162a'), mat('10162a'), boardMat(w / 24), mat('10162a')]);
    b.position.set(x, 0.75, z); b.rotation.y = ry; b.castShadow = true; scene.add(b);
  }
  const fans = [];
  const stand = (cx, cz, len, ry, home) => {
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; scene.add(g);
    const r = rng(Math.round(cx * 7 + cz * 13 + 99));
    for (let i = 0; i < 14; i++) {
      const step = part(len, 1.2 * (i + 1) + 1.2, 1.7, i % 2 ? '#2b3446' : '#323c50', { radius: 0.02, clearcoat: 0 });
      step.position.set(0, 1.2 * (i + 1) + 1.2, -2 - i * 1.7); g.add(step);
      for (let x = -len / 2 + 0.9; x < len / 2 - 0.9; x += 1.35) {
        if (r() < 0.16) continue;
        const team = r() < (home ? 0.82 : 0.18) ? HOME : AWAY;
        fans.push({ g, x: x + (r() - 0.5) * 0.3, y: 1.2 * (i + 1) + 1.2, z: -2 - i * 1.7 - 0.3, team, skin: ['#f0c79a', '#c98a5a', '#8a5a3a', '#f5d6b8', '#f2c94c'][Math.floor(r() * 5)], ph: r() * 6.28, sp: 6 + r() * 4 });
      }
    }
    const back = part(len, 22, 1, '#1d2433', { radius: 0.02, clearcoat: 0 }); back.position.set(0, 22, -2 - 14 * 1.7); g.add(back);
    const roofP = part(len, 0.8, 14, '#c7ccd6', { radius: 0.02, clearcoat: 0 }); roofP.position.set(0, 24, -14); g.add(roofP);
  };
  stand(0, -11, 104, 0, true); stand(0, 107, 108, Math.PI, false);
  stand(-53, 48, 100, Math.PI / 2, true); stand(53, 48, 100, -Math.PI / 2, false);
  const bodyG = new THREE.BoxGeometry(1.0, 1.2, 0.6), headG = new THREE.BoxGeometry(0.72, 0.72, 0.72);
  const bodies = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), fans.length);
  const heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ roughness: 0.7 }), fans.length);
  fans.forEach((f, i) => { bodies.setColorAt(i, new THREE.Color(f.team)); heads.setColorAt(i, new THREE.Color(f.skin)); });
  bodies.castShadow = heads.castShadow = false; bodies.receiveShadow = heads.receiveShadow = true;
  scene.add(bodies, heads); crowd = { fans, bodies, heads };
  // Floodlight towers.
  for (const [x, z] of [[-48, -12], [48, -12], [-48, 104], [48, 104]]) {
    const pole = part(1.2, 34, 1.2, '#9aa3b5', { radius: 0.05 }); pole.position.set(x, 34, z); scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 0.6), new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#fff4cc', emissiveIntensity: 2.4 }));
    lamp.position.set(x, 36, z); lamp.lookAt(0, 0, 40); scene.add(lamp);
  }
  // The cup, waiting by the touchline.
  const plinth = part(2.4, 3.2, 2.4, '#1c2540', { radius: 0.08 }); plinth.position.set(-14.5, 3.2, -3.2); scene.add(plinth);
  const cup = await packItem('props', 'trophy'); cup.scale.setScalar(1.9); cup.position.set(-14.5, 3.2 + 0.84 * 1.9, -3.2); cup.rotation.y = 0.5; scene.add(cup);
  const cupLight = new THREE.PointLight('#ffe7a0', 30, 9, 1.6); cupLight.position.set(-13, 7.5, -0.5); scene.add(cupLight);

  // Ball, divot clumps and dirt puffs.
  ball = new THREE.Mesh(new THREE.SphereGeometry(TL.BR, 48, 32), new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.42 }));
  ball.castShadow = true; scene.add(ball);
  const r = rng(31);
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.28 + r() * 0.2, 0.14 + r() * 0.1, 0.24 + r() * 0.2), mat(i % 3 ? '3f9b3a' : '6b4a2e', 0.9));
    c.userData.v = [(r() - 0.5) * 3.2, 5 + r() * 4.5, -2.5 - r() * 4]; c.userData.spin = [r() * 9, r() * 9, r() * 9]; c.castShadow = true; scene.add(c); clumps.push(c);
  }
  for (let i = 0; i < 6; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#8a6a48'); p.material.emissive.set('#3a2a1a'); p.userData.d = [(r() - 0.5) * 1.6, 0.2 + r() * 0.6, -0.4 - r() * 1.2]; scene.add(p); dust.push(p); }
}

// ---------- actors ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, side, up, fwd = 0.08) { EUL.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + side].quaternion.setFromEuler(EUL); }
const box = new THREE.Box3();
function place(a, s, t) {
  a.root.visible = s.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(P(s.pos)); a.root.rotation.set(0, s.heading, 0);
  robloxPose(a, s.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  if (s.crouch) {                                           // keeper's ready stance: arms out low, legs apart, leaning in
    setArm(a, 'L', 0.55 * s.crouch, -0.35 * s.crouch); setArm(a, 'R', 0.55 * s.crouch, -0.35 * s.crouch);
    a.bones['Leg.L'].rotateZ(0.13 * s.crouch); a.bones['Leg.R'].rotateZ(-0.13 * s.crouch);
  }
  if (s.arms) { setArm(a, 'L', 0.9 * s.arms, -0.3 * s.arms); setArm(a, 'R', 0.9 * s.arms, -0.3 * s.arms); }
  if (s.kick) { EUL.set(s.kick, 0, 0, 'XYZ'); a.bones['Leg.R'].quaternion.setFromEuler(EUL); }
  if (s.armUp) setArm(a, s.armSide === -1 ? 'R' : 'L', 2.5 * s.armUp, 0.15);       // one arm reaching for the ball
  if (s.blow) { EUL.set(-2.05 * s.blow, 0, 0.55 * s.blow, 'XYZ'); a.bones['Arm.R'].quaternion.setFromEuler(EUL); }   // whistle to mouth
  if (s.point === 'line' || s.point === 'spot') { EUL.set(-1.45, 0, 0, 'XYZ'); a.bones['Arm.R'].quaternion.setFromEuler(EUL); }
  if (s.yaw) a.bones.Head.rotateY(s.yaw);
  if (s.pitch) a.bones.Head.rotateX(s.pitch);
  if (s.lean) a.root.rotateX(s.lean);
  if (s.roll) a.root.rotateZ(-s.roll);
  a.root.updateMatrixWorld(true);
  if (s.roll) { box.setFromObject(a.root); a.root.position.y -= box.min.y; }
  else a.root.position.y -= a.soleHeight();
  a.root.position.y += s.lift || 0;
  setExpression(a, s.face);
  a.root.updateMatrixWorld(true);
}
const headP = (a) => a.bones.Head.localToWorld(V(0, 0.45, 0));
const eyes = (a) => a.bones.Head.localToWorld(V(0, 0.55, 0.62));
const glove = (a, side = 'L') => a.bones['Arm.' + side].localToWorld(V(side === 'L' ? 0.5 : -0.5, -1.3, 0));
const feet = (a) => a.bones.Root.localToWorld(V(0, 0.2, 0));

function placeBall(t) {
  const b = TL.ballAt(t); ball.visible = b.visible; ball.position.set(...b.p);
  ball.quaternion.setFromAxisAngle(V(Math.cos(b.dir), 0, -Math.sin(b.dir)), b.rot);
}
function placeCrowd(t) {
  const e = TL.crowdAt(t), m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1), p = V(0, 0, 0);
  crowd.fans.forEach((f, i) => {
    const hop = e > 0.55 ? (e - 0.55) * 1.6 * Math.abs(Math.sin(t * f.sp + f.ph)) : 0.04 * Math.sin(t * 1.3 + f.ph);
    p.set(f.x, f.y + 0.6 + hop, f.z); f.g.localToWorld(p); f.g.getWorldQuaternion(q); m.compose(p, q, sc); crowd.bodies.setMatrixAt(i, m);
    p.set(f.x, f.y + 1.6 + hop, f.z); f.g.localToWorld(p); m.compose(p, q, sc); crowd.heads.setMatrixAt(i, m);
  });
  crowd.bodies.instanceMatrix.needsUpdate = crowd.heads.instanceMatrix.needsUpdate = true;
}
function placeDivot(t) {
  const tau = t - T.kick2, on = tau > 0 && t > T.reset;
  for (const c of clumps) {
    c.visible = on && tau < 1.6;
    if (!c.visible) continue;
    const [vx, vy, vz] = c.userData.v, tt = Math.min(tau, vy / 15);
    c.position.set(-0.1 + vx * tau * 0.6, Math.max(0.08, 0.1 + vy * tt - 15 * tt * tt), 19.0 + vz * tau * 0.6);
    c.rotation.set(...c.userData.spin.map((w) => w * Math.min(tau, 0.7)));
    c.scale.setScalar(1 - smooth01(clamp((tau - 1.1) / 0.5)));
  }
  for (const p of dust) {
    p.visible = on && tau < 1.4;
    if (!p.visible) continue;
    const k = easeOut(clamp(tau / 0.9)), [dx, dy, dz] = p.userData.d;
    p.position.set(-0.1 + dx * k, 0.35 + dy * k * 2, 19.0 + dz * k * 2); p.scale.setScalar(0.25 + 0.75 * k); p.material.opacity = 0.75 * (1 - clamp(tau / 1.4));
  }
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40, roll = 0) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(Math.sin(roll), Math.cos(roll), 0); c.lookAt(tg);
  stage.aimSun(V(tg.x, 0, tg.z), 34);
}
const jolt = (t, k) => V(k * Math.sin(t * 83), k * Math.cos(t * 71), 0);
const shake = (t, at, k, dur = 0.35) => (t > at && t < at + dur ? jolt(t, k * (1 - (t - at) / dur)) : V(0, 0, 0));
export function samples(t) { const id = shotAt(SHOTS, t).shot.id; return ['dive', 'slap', 'storm', 'scuff', 'replayA2', 'replayB2'].includes(id) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }
const smooth01 = (u) => u * u * (3 - 2 * u);

export function update(t, stage) {
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const st = TL.inFreeze(t) ? T.kick1 + 0.02 : t;          // the freeze replays the kick moment
  place(mia, TL.miaAt(st), st); place(leo, TL.leoAt(st), st); place(max, TL.maxAt(st), st); place(noob, TL.refAt(st), st);
  placeBall(st); placeCrowd(st); placeDivot(st);
  for (const g of max.root.getObjectsByProperty('name', 'glove')) g.visible = TL.inReplay(t);
  stage.bloom.strength = 0.22;

  const mh = headP(mia), lh = headP(leo), b = ball.position.clone();
  const kick = shake(t, T.hit1, 0.18, 0.4).add(shake(t, T.kick2, 0.06, 0.3));
  switch (shot.id) {
    case 'hook': look(stage, V(lerp(2.2, 1.4, u), lerp(5.6, 5.2, u), -6.4), V(0, 2.8, 16), lerp(54, 46, easeInOut(u))); break;   // through the net: Mia, the ball, Leo
    case 'stakes': look(stage, mh.clone().add(V(1.8, 0.4, lerp(12, 10.5, u))), mh.clone().add(V(0, -1.6, 0)), 40); break;
    case 'cup': look(stage, V(lerp(-10.4, -11.0, u), 6.8, 3.2), V(-14.5, 5.6, -3.2), 36); break;
    case 'miss': look(stage, lh.clone().add(V(2.4, 0.2, lerp(-11, -9.5, u))), lh.clone().add(V(0, -1.6, 0)), 40); break;
    case 'season': look(stage, lh.clone().add(V(3.2, -3.0, -9.0)), lh.clone().add(V(0, -1.2, 0)), 46); break;          // hero angle, low
    case 'watched': look(stage, mh.clone().add(V(0.8, 0.3, lerp(9.0, 7.8, u))), mh.clone().add(V(0, -1.2, 0)), 40); break;
    case 'replayA1': case 'replayB1': look(stage, lh.clone().add(V(1.4, 0.3, -8.5)), lh.clone().add(V(0, -1.3, 0)), 40); break;
    case 'replayA2': case 'replayB2': look(stage, V(0, 12.0, -19.0), V(0, 2.2, 10), 50); break;
    case 'flick': look(stage, lh.clone().add(V(-0.6, 0.1, -4.8)), lh.clone().add(V(0, -0.45, 0)), 36); break;          // his eyes, from the goal side
    case 'dive': look(stage, V(lerp(-2.4, -1.6, u), lerp(7.6, 6.6, u), -9.2), V(2.6, 1.8, lerp(7, 5, u)), 48); break;   // slow motion, from behind the goal
    case 'slap': look(stage, V(17.0, 3.8, 12.5).add(kick), V(5.2, 1.6, 1.0), 42); break;
    case 'storm': look(stage, V(-7.5, 6.2, 21).add(kick), V(5.5, 2.4, 3.5), 46); break;
    case 'whistle': { const rh = headP(noob); look(stage, rh.clone().add(V(11.0, 1.0, -6.5)), rh.clone().add(V(0, -1.4, 0)), 42); break; }
    case 'freeze': look(stage, V(5.5, 8.0, 23.0), V(2.6, 1.2, 0.8), 44); break;                                         // the goal line and her boots
    case 'reading': look(stage, lh.clone().add(V(2.8, 0.5, -11.5)), lh.clone().add(V(0, -1.5, 0)), 42); break;
    case 'anywhere': look(stage, V(0.2, 4.9, 0.9), lh.clone().add(V(0, -1.2, 0)), lerp(26, 22, u)); break;             // Mia's eyes
    case 'closes': look(stage, lh.clone().add(V(1.0, 0.1, -4.4)), lh.clone().add(V(0, -0.45, 0)), 36); break;
    case 'noclue': look(stage, V(0.6, 6.0, 27.5), V(0, 3.0, 0), 52); break;
    case 'hardest': look(stage, mh.clone().add(V(-1.4, 0.3, lerp(10, 8.5, u))), mh.clone().add(V(0, -1.4, 0)), 40); break;
    case 'line': look(stage, V(5.0, 1.8, lerp(9.5, 8.5, u)), V(0, 2.2, 0.3), 44); break;
    case 'run2': look(stage, lh.clone().add(V(5.5, 0.8, -9.0)), lh.clone().add(V(0, -1.5, 0)), 44); break;
    case 'scuff': look(stage, V(9.5, 3.0, 8.0).add(kick), V(-0.3, 2.2, 18.9), 46); break;
    case 'roll': look(stage, V(b.x + 2.4, 2.2, Math.max(b.z + 7, 10)), V(0.2, 2.4, 0), 44); break;                        // behind the ball, low
    case 'boot': look(stage, V(4.6, 2.0, lerp(8.5, 7.8, u)), V(0.3, 1.8, 0.9), 42); break;
    case 'opens': look(stage, lh.clone().add(V(-2.4, 0.8, -12.0)), lh.clone().add(V(0, -1.4, 0)), 42); break;
    case 'net': look(stage, V(6.4, 4.6, -3.7), V(-0.5, 3.4, 19), 40); break;                                            // the still net, Leo waiting
    case 'season2': look(stage, lh.clone().add(V(2.2, 0.9, -10.5)), lh.clone().add(V(0, -1.4, 0)), 42); break;
    case 'see': look(stage, V(lerp(13, 12, u), 7.2, 23), V(1, 2.4, 9), 50); break;
    default: { const k = easeInOut(clamp(u * 1.4)); look(stage, V(lerp(12, 9, k), lerp(7.2, 10, k), lerp(23, 26, k)), V(1, 2.4, 9), 50); }
  }
  cam = stage.camera;
}

// ---------- overlay ----------
function project(v, s) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05 }; }
function label(g, s, p3, text, { bg = 'rgba(12,16,32,.9)', edge = '#ffd23f', fg = '#ffffff', size = 60, k = 1, dy = 0 } = {}) {
  const p = project(p3, s); if (!p.on || k <= 0) return;
  g.save(); g.translate(p.x, p.y + dy * s); g.scale(k, k); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width + 46 * s;
  roundRect(g, -w / 2, -size * 0.75 * s, w, size * 1.45 * s, 20 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = edge; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 3 * s); g.restore();
}
function ring(g, s, p3, r, color, k = 1) {
  const p = project(p3, s); if (!p.on || k <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = 9 * s; g.shadowColor = color; g.shadowBlur = 18 * s;
  g.beginPath(); g.arc(p.x, p.y, r * s * k, 0, Math.PI * 2); g.stroke(); g.restore();
}
function dashed(g, s, a3, b3, color, k = 1, w = 8) {
  const a = project(a3, s), b = project(b3, s); if (k <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = w * s; g.setLineDash([26 * s, 16 * s]); g.shadowColor = color; g.shadowBlur = 14 * s; g.lineCap = 'round';
  g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k); g.stroke(); g.restore();
  return { a, b };
}
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#0c1020') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function pill(g, s, x, y, text, { bg = 'rgba(12,16,32,.86)', fg = '#ffffff', edge = '#ffd23f', size = 44, dot = null } = {}) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const w = g.measureText(text).width + (dot ? 92 : 52) * s, h = size * 1.7 * s;
  roundRect(g, x * s, y * s, w, h, 22 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = edge; g.stroke();
  if (dot) { g.fillStyle = dot; g.beginPath(); g.arc((x + 38) * s, y * s + h / 2, 12 * s, 0, 7); g.fill(); }
  g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(text, (x + (dot ? 64 : 26)) * s, y * s + h / 2 + 3 * s); g.restore();
}
function ballIcon(g, cx, cy, r, color = '#f7f7f2', cross = false) {
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fillStyle = color; g.fill(); g.lineWidth = r * 0.16; g.strokeStyle = '#0c1020'; g.stroke();
  g.fillStyle = '#0c1020'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; g.lineTo(cx + Math.cos(a) * r * 0.38, cy + Math.sin(a) * r * 0.38); } g.closePath(); g.fill();
  if (cross) { g.strokeStyle = '#ff3b5c'; g.lineWidth = r * 0.34; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r); g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r); g.stroke(); }
  g.restore();
}
// "PENALTIES THIS SEASON 12/12" card; miss = true adds the 13th, crossed out.
function statCard(g, s, k, miss = false, kx = 1) {
  if (k <= 0) return;
  g.save(); g.translate(540 * s, 430 * s); g.scale(k, k);
  roundRect(g, -430 * s, -130 * s, 860 * s, 260 * s, 34 * s); g.fillStyle = 'rgba(12,16,32,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = AWAY; g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('LEO · PENALTIES THIS SEASON', 0, -78 * s);
  g.font = `${92 * s}px "Luckiest Guy"`; g.fillStyle = miss ? '#ff6b7d' : '#8be36b'; g.fillText(miss ? '12 / 13' : '12 / 12', 0, -4 * s);
  const n = miss ? 13 : 12;
  for (let i = 0; i < n; i++) ballIcon(g, (-(n - 1) * 31 + i * 62) * s, 84 * s, 24 * s, '#f7f7f2', miss && i === 12 && kx > 0);
  g.restore();
}

export function overlay(g, s, t) {
  // HUD: the final, last kick.
  if (t < T.cta && !TL.inReplay(t) && !TL.inFreeze(t)) {
    pill(g, s, 60, 250, 'THE FINAL', { dot: HOME });
    if (t < W.leo) pill(g, s, 60, 345, 'LAST KICK WINS', { size: 34, edge: AWAY });
  }
  if (SHOT === 'season') statCard(g, s, easeOutBack(clamp((t - W.season + 0.4) / 0.3), 1.6));
  if (SHOT === 'season2') statCard(g, s, easeOutBack(clamp((t - W.every2 + 0.1) / 0.3), 1.6), true, t > W.everyOne - 0.1 ? 1 : 0);

  // Season replay: tint, tag, and the tell (his eye-line to the corner).
  if (TL.inReplay(t)) {
    g.save(); g.fillStyle = 'rgba(40,80,150,.16)'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    pill(g, s, 60, 250, 'SEASON REPLAY', { dot: '#ff3b5c', edge: '#ffffff' });
    const A = t < REPLAY.b, look = A ? W.looks : REPLAY.b + 0.05, corner = A ? V(-6.8, 5.3, 0) : V(6.6, 1.4, 0);
    if ((SHOT === 'replayA1' || SHOT === 'replayB1') && t > look + 0.12) dashed(g, s, eyes(leo), corner, '#ffd23f', clamp((t - look - 0.12) / 0.25));
    const kickT = A ? REPLAY.kickA : REPLAY.kickB;
    if ((SHOT === 'replayA2' || SHOT === 'replayB2') && t > kickT + 0.35) bigText(g, s, 'GOAL!', 540, 560, 120, '#8be36b', easeOutBack(clamp((t - kickT - 0.35) / 0.2), 2));
    if (SHOT === 'replayB2' && t > W.everyTime - 0.05) bigText(g, s, 'EVERY TIME.', 540, 720, 80, '#ffd23f', easeOutBack(clamp((t - W.everyTime + 0.05) / 0.2), 2));
  }
  // The tell, live: his eyes flick to her left.
  if (SHOT === 'flick' && t > T.flick + 0.1) {
    dashed(g, s, eyes(leo), V(6.8, 1.6, 0), '#ffd23f', clamp((t - T.flick - 0.1) / 0.2));
    bigText(g, s, 'LEFT!', 540, 600, 110, '#ffd23f', easeOutBack(clamp((t - T.flick - 0.15) / 0.2), 2));
  }
  if (SHOT === 'dive' && t < T.kick1 + 0.1 && t > T.dive1 + 0.1) bigText(g, s, 'EARLY!', 540, 560, 96, '#ffffff', easeOutBack(clamp((t - T.dive1 - 0.1) / 0.25), 2));
  if (SHOT === 'slap' && t > T.hit1) bigText(g, s, 'SAVED!', 540, 560, 130, '#8be36b', easeOutBack(clamp((t - T.hit1) / 0.2), 2));
  if (t > T.hit1 && t < T.hit1 + 0.18) flash(g, s, 0.35 * (1 - (t - T.hit1) / 0.18));
  if (SHOT === 'whistle' && t > T.whistle) bigText(g, s, 'TWEEEET!', 540, 560, 104, '#ffffff', easeOutBack(clamp((t - T.whistle) / 0.2), 2), -0.06);

  // The freeze: off the line, retake.
  if (SHOT === 'freeze') {
    g.save(); g.fillStyle = 'rgba(40,80,150,.14)'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
    pill(g, s, 60, 250, 'REPLAY  ❚❚', { dot: '#ff3b5c', edge: '#ffffff' });
    dashed(g, s, V(-8.5, 0.05, 0), V(9.5, 0.05, 0), '#8be36b', clamp((t - T.freeze[0]) / 0.4), 9);
    const k = easeOutBack(clamp((t - W.early + 0.5) / 0.25), 2);
    ring(g, s, feet(mia), 80, '#ff3b5c', k); label(g, s, feet(mia).add(V(0, 2.6, 0)), 'OFF THE LINE', { edge: '#ff3b5c', fg: '#ff8e9b', size: 54, k });
    bigText(g, s, 'RETAKE', 540, 560, 150, '#ff3b5c', easeOutBack(clamp((t - W.retake) / 0.2), 2.2), -0.12, '#ffffff');
  }
  if (SHOT === 'noclue') {
    const k1 = easeOutBack(clamp((t - W.clue) / 0.2), 2), k2 = easeOutBack(clamp((t - W.noCorner) / 0.2), 2);
    label(g, s, V(6.2, 4.2, 0), '?', { size: 110, k: k1 }); label(g, s, V(-6.2, 4.2, 0), '?', { size: 110, k: k2 });
  }
  if (SHOT === 'line' && t > W.stay - 0.05) {
    const k = easeOutBack(clamp((t - W.stay + 0.05) / 0.25), 2);
    ring(g, s, V(0, 0.4, 0.3), 120, '#8be36b', k); bigText(g, s, 'ON THE LINE', 540, 560, 96, '#8be36b', k);
    if (t > W.wait) bigText(g, s, 'WAIT...', 540, 700, 80, '#ffffff', easeOutBack(clamp((t - W.wait) / 0.25), 2));
  }
  if (SHOT === 'scuff' && t > T.kick2) bigText(g, s, 'THUD.', 540, 560, 110, '#ffffff', easeOutBack(clamp((t - T.kick2) / 0.2), 2));
  if (SHOT === 'boot' && t > T.boot) bigText(g, s, 'SAVED.', 540, 560, 120, '#8be36b', easeOutBack(clamp((t - T.boot) / 0.25), 2));
  if (SHOT === 'see' && t > T.celebrate + 0.2) bigText(g, s, 'CHAMPIONS!', 540, 520, 120, '#ffd23f', easeOutBack(clamp((t - T.celebrate - 0.2) / 0.25), 2));

  // Call to action: follow.
  if (t >= T.cta) {
    const a = t - T.cta, k2 = easeOutBack(clamp(a / 0.3), 1.6);
    g.save(); g.translate(540 * s, 440 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ mia, leo, max, noob, ball });
