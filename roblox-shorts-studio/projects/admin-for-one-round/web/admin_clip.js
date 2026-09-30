// Admin For One Round - full 63.8 s short, rendered with web/ (no Blender, no farm).
// Leo gets admin for one round: fly, speed, giant, tiny Max, rainbow Mia, then an "explode" command that
// does nothing... until the round ends and all 47 queued blasts hit Leo. Next round Max kicks him.
// World: Y up, the obby course runs along +X from the lobby. Every value is a pure function of t (seconds).
// All times below come from the measured narration (audio/alignment/captions.json).
import * as THREE from 'three';
import { makeCharacter, pose, actionPose, mixPose, setExpression, soleHeight, mat, roundedBox } from '../../../web/lib/rig.js';
import { part, spawnPad, sign, checkpoint, cloud, crown, forceField, puff, neonMaterial, canvasTexture, rng } from '../../../web/lib/world.js';
import { clamp, lerp, inv, track, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { adminTimer, speedLines, flash, roundRect, drawCrown } from '../../../web/lib/overlay.js';

export const meta = { seconds: 63.8, fps: 30, width: 1080, height: 1920, title: 'Admin For One Round' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- timeline ----------
const T = {
  crownDrop: [0.0, 0.55],
  fly: { lift: [3.3, 4.6] },
  speed: { go: 5.3, finish: 7.75 },
  grow: [9.05, 9.65],
  unGiant: 12.4,
  tinyZap: 14.95,
  rainbowZap: 21.85,
  fizzles: [30.3, 32.8, 35.5, 36.45, 38.3],
  roundOver: 53.3,
  boom: [55.62, 58.9],
  round2: 59.25,
  kick: 62.9,
};
const BLASTS = Array.from({ length: 47 }, (_, i) => T.boom[0] + (T.boom[1] - T.boom[0]) * (i / 46) ** 1.15);

const SHOTS = [
  { start: 0.0, end: 2.8, id: 'hook' },
  { start: 2.8, end: 4.7, id: 'fly' },
  { start: 4.7, end: 5.3, id: 'speedReady' },
  { start: 5.3, end: 7.75, id: 'speedRun' },
  { start: 7.75, end: 8.45, id: 'speedFinish' },
  { start: 8.45, end: 10.25, id: 'grow' },
  { start: 10.25, end: 12.4, id: 'hand' },
  { start: 12.4, end: 15.6, id: 'ask' },
  { start: 15.6, end: 19.2, id: 'tinyMax' },
  { start: 19.2, end: 22.85, id: 'scold' },
  { start: 22.85, end: 25.8, id: 'rainbowMia' },
  { start: 25.8, end: 29.3, id: 'menu' },
  { start: 29.3, end: 30.15, id: 'aimLava' },
  { start: 30.15, end: 31.7, id: 'lava' },
  { start: 31.7, end: 32.6, id: 'aimTimer' },
  { start: 32.6, end: 34.4, id: 'timer' },
  { start: 34.4, end: 35.3, id: 'aimBoard' },
  { start: 35.3, end: 36.05, id: 'board' },
  { start: 36.05, end: 36.8, id: 'aimSky' },
  { start: 36.8, end: 37.75, id: 'aimNoob' },
  { start: 37.75, end: 38.95, id: 'noob' },
  { start: 38.95, end: 39.7, id: 'nothing' },
  { start: 39.7, end: 41.3, id: 'ten' },
  { start: 41.3, end: 44.6, id: 'spam' },
  { start: 44.6, end: 47.3, id: 'notice' },
  { start: 47.3, end: 51.0, id: 'system' },
  { start: 51.0, end: 51.7, id: 'three' },
  { start: 51.7, end: 52.4, id: 'two' },
  { start: 52.4, end: 53.3, id: 'one' },
  { start: 53.3, end: 55.4, id: 'roundOver' },
  { start: 55.4, end: 59.25, id: 'boom' },
  { start: 59.25, end: 63.8, id: 'round2' },
];

// Leo's admin clock: 60 -> 10 at "ten seconds left", then 3-2-1 on the spoken counts.
const clock = track([[0, 60, (u) => u], [39.9, 10, (u) => u], [51.05, 3, (u) => u], [51.7, 2, (u) => u], [52.4, 1, (u) => u], [53.3, 0, (u) => u]]);

// Chat: lines appear at `at`; typed lines show in the input box first.
const LEO = '#FF9E80', MAX = '#7FE3DD', MIA = '#C9A6FF', SERVER = '#FFD23F', NOOB = '#F5CD30';
const typed = (name, color, text, from, to) => ({ name, color, text, from, to, at: to + 0.08 });
const CHAT = [
  { name: 'Server', color: SERVER, text: 'Leo won ADMIN for 1 round!', at: -1 },
  typed('Leo', LEO, ':fly', 2.35, 2.85),
  typed('Leo', LEO, ':speed', 4.72, 5.1),
  typed('Leo', LEO, ':giant', 8.5, 8.9),
  { name: 'Max', color: MAX, text: 'can i have a turn??', at: 12.95 },
  typed('Leo', LEO, ':tiny max', 14.2, 14.75),
  { name: 'Max', color: MAX, text: 'LEOOOO', at: 16.4 },
  { name: 'Mia', color: MIA, text: 'leo be responsible', at: 19.7 },
  typed('Leo', LEO, ':rainbow mia', 21.1, 21.7),
  { name: 'Mia', color: MIA, text: '...', at: 23.4 },
  typed('Leo', LEO, ':explode lava', 29.35, 29.95),
  typed('Leo', LEO, ':explode timer', 31.8, 32.4),
  typed('Leo', LEO, ':explode leaderboard', 34.45, 35.1),
  typed('Leo', LEO, ':explode sky', 36.07, 36.3),
  typed('Leo', LEO, ':explode noob', 36.9, 37.5),
  { name: 'noob', color: NOOB, text: '???', at: 38.25 },
  ...[41.55, 41.8, 42.02, 42.3, 42.55, 42.78, 42.98, 43.2, 43.42, 43.66, 43.9, 44.15].map((at) => ({ name: 'Leo', color: LEO, text: ':explode', at })),
  { name: 'Server', color: SERVER, text: 'Round over! Admin removed.', at: 53.35 },
  { name: 'Server', color: SERVER, text: 'Max won ADMIN for 1 round!', at: 59.35 },
  typed('Max', MAX, ':kick leo', 61.4, 62.5),
  { name: 'Server', color: SERVER, text: 'Leo was kicked from the game.', at: 62.95 },
];

// ---------- world layout ----------
const PAD = V(0, 0.35, 1);                     // Leo's spawn pad (top at y 0.35)
const COURSE = [                                // [x0, x1, top y] surfaces Leo speed-runs across
  [-12, 12, 0], [14, 18, 0.6], [20, 24, 1.4], [26.5, 30.5, 2.2], [40, 44, 3.0], [46, 50, 3.8], [54, 66, 4.5],
];
const LAVA = V(35.2, 2.7, 0);
const TIMER_BOARD = V(-8.5, 0, -6.5), LEADER_BOARD = V(8.5, 0, -6.8), NOOB_AT = V(6.2, 0, 7.4);
const RUN_START = PAD.x, RUN_END = 60;

function courseY(x) {
  for (let i = 0; i < COURSE.length; i++) {
    const [a, b, y] = COURSE[i];
    if (x >= a && x <= b) return y;
    const n = COURSE[i + 1];
    if (n && x > b && x < n[0]) {
      const u = (x - b) / (n[0] - b), gap = n[0] - b;
      return lerp(y, n[2], u) + (1.2 + gap * 0.18) * 4 * u * (1 - u);
    }
  }
  return 0;
}

let leo, max, mia, noob, leoCrown, maxCrown, ff, timerTex, timerCanvas, miniLobby, blastPool = [], smoke = [], zapPuffs = [], sparkles = [];
let miaMeshes = [];

export async function setup(stage) {
  const { scene } = stage;
  const r = rng(7);

  // Lobby island + spawn pad + signs.
  const island = part(24, 2.4, 18, '#c3cbdb', { studs: true, rough: 0.55 }); scene.add(island);
  const pad = spawnPad(6); pad.position.set(PAD.x, 0.35, PAD.z); scene.add(pad);
  const lobbySign = sign('LOBBY', { w: 5.2, h: 1.7, post: 3.4 }); lobbySign.position.set(-4.5, 0, -7.6); scene.add(lobbySign);
  const cp = checkpoint('#3ddc97'); cp.position.set(10.5, 0, 7.5); scene.add(cp);

  // Round timer billboard (redrawn every frame).
  timerCanvas = document.createElement('canvas'); timerCanvas.width = 1024; timerCanvas.height = 560;
  timerTex = new THREE.CanvasTexture(timerCanvas); timerTex.colorSpace = THREE.SRGBColorSpace;
  scene.add(board(TIMER_BOARD, 0.55, 6.2, 3.4, timerTex));
  // Leaderboard.
  const lbTex = canvasTexture(1024, 800, (x, W, H) => {
    x.fillStyle = '#1f2a44'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffd23f'; x.lineWidth = 18; x.strokeRect(14, 14, W - 28, H - 28);
    x.font = '96px "Luckiest Guy"'; x.textAlign = 'center'; x.fillStyle = '#ffd23f'; x.fillText('LEADERBOARD', W / 2, 150);
    x.font = '78px "Luckiest Guy"'; x.textAlign = 'left';
    [['1. LEO', '9999', '#FF9E80'], ['2. MIA', '42', '#C9A6FF'], ['3. MAX', '41', '#7FE3DD'], ['4. NOOB', '0', '#F5CD30']].forEach(([n, s, c], i) => {
      x.fillStyle = c; x.fillText(n, 90, 290 + i * 128); x.textAlign = 'right'; x.fillStyle = '#ffffff'; x.fillText(s, W - 90, 290 + i * 128); x.textAlign = 'left';
    });
  });
  scene.add(board(LEADER_BOARD, -0.45, 6.2, 4.85, lbTex));

  // Obby course with a lava strip, and the finish island.
  const cols = ['#ff5a5f', '#ffb400', '#3ddc97', '#4f8cff', '#b36bff'];
  COURSE.slice(1, 6).forEach(([a, b, y], i) => { const p = part(b - a, 1, 4, cols[i], { studs: true }); p.position.set((a + b) / 2, y, i % 2 ? -1 : 1); scene.add(p); });
  const lava = part(7, 0.6, 2.2, '#ff2d3d', { material: neonMaterial('#ff2d3d', 1.8), radius: 0.08 }); lava.position.copy(LAVA); scene.add(lava);
  for (const x of [31.6, 38.8]) { const post = part(1.2, 0.6, 2.2, '#39414f', {}); post.position.set(x, 2.7, 0); scene.add(post); }
  const island2 = part(12, 2.4, 10, '#c3cbdb', { studs: true, rough: 0.55 }); island2.position.set(60, 4.5, 0); scene.add(island2);
  const fin = sign('FINISH', { w: 5.2, h: 1.7, post: 3.4, accent: '#3ddc97' }); fin.position.set(60, 4.5, -3.8); scene.add(fin);
  const win = part(3.6, 0.3, 3.6, '#ffd23f', { material: neonMaterial('#ffd23f', 0.7) }); win.position.set(60, 4.8, 1); scene.add(win);
  for (let i = 0; i < 8; i++) { const b = part(1, 1, 1, '#8a93a6', { radius: 0.06 }); b.position.set(-10.5, 1 + i, -7.5); scene.add(b); }

  // Distant floating obbies and clouds for depth.
  const far = ['#ff5a5f', '#ffb400', '#3ddc97', '#4f8cff', '#b36bff', '#ff8fd6'];
  for (let i = 0; i < 26; i++) {
    const p = part(3 + r() * 9, 1 + r() * 2, 3 + r() * 8, far[i % far.length], { castShadow: false });
    const a = r() * Math.PI * 2, d = 70 + r() * 120; p.position.set(Math.cos(a) * d, -6 + r() * 30, Math.sin(a) * d); scene.add(p);
  }
  for (let i = 0; i < 60; i++) { const c = cloud(100 + i, 8 + r() * 10); const a = r() * Math.PI * 2, d = 60 + r() * 200; c.position.set(Math.cos(a) * d, -60 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 24; i++) { const c = cloud(300 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 90 + r() * 80; c.position.set(Math.cos(a) * d, 10 + r() * 30, Math.sin(a) * d); scene.add(c); }

  // Cast.
  leo = makeCharacter('Leo'); max = makeCharacter('Max'); mia = makeCharacter('Mia');
  noob = makeCharacter('Noob', { skin: 'F5CD30', top: '0D69AC', dark: 'A4BD47', hair: 'F5CD31', accent: '0D69AC' });
  noob.root.traverse((o) => { if (o.isMesh && o.material === mat('F5CD31', 0.55)) o.visible = false; });   // bald classic noob
  scene.add(leo.root, max.root, mia.root, noob.root);
  // Mia gets her own materials so she can turn rainbow (face ink stays dark).
  mia.root.traverse((o) => {
    if (!o.isMesh || (o.parent && o.parent.name.startsWith('face_'))) return;
    o.material = o.material.clone(); const hsl = {}; o.material.color.getHSL(hsl); miaMeshes.push({ m: o.material, hsl, base: o.material.color.clone() });
  });

  leoCrown = crown(); scene.add(leoCrown);
  maxCrown = crown(); maxCrown.scale.setScalar(0.95); maxCrown.position.set(0, 1.5, 0.02); max.bones.Head.add(maxCrown);
  ff = forceField(); scene.add(ff);

  // Lobby "in his hand": small studded platform with a spawn pad; Max and Mia stand on it in that shot.
  miniLobby = new THREE.Group();
  const mp = part(9, 0.8, 7, '#c3cbdb', { studs: true, rough: 0.55 }); miniLobby.add(mp);
  const msp = spawnPad(3); msp.position.set(0, 0.2, 0.8); miniLobby.add(msp);
  const ms = sign('LOBBY', { w: 3.4, h: 1.1, post: 2.2 }); ms.position.set(0, 0, -2.8); miniLobby.add(ms);
  scene.add(miniLobby);

  // Explosion pool: hot core + shock shell, additive so bloom catches them.
  for (let i = 0; i < 14; i++) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ffb640', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ff4a1c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.renderOrder = shell.renderOrder = 6; scene.add(core, shell); blastPool.push({ core, shell });
  }
  for (let i = 0; i < 16; i++) { const p = puff(); p.material = p.material.clone(); p.material.color.set('#6b6f78'); p.material.emissive.set('#222222'); scene.add(p); smoke.push(p); }
  for (let i = 0; i < 12; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); zapPuffs.push(p); }
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

function board(pos, rotY, w, h, tex) {
  const g = new THREE.Group(), post = 3.2;
  const b = new THREE.Mesh(roundedBox(w, h, 0.3, 0.06), mat('1f2a44', 0.5)); b.position.y = post + h / 2; b.castShadow = true; g.add(b);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.22 }));
  face.position.set(0, post + h / 2, 0.16); g.add(face);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(roundedBox(0.3, post, 0.3, 0.05), mat('6b4a2e', 0.7)); p.position.set(s * (w / 2 - 0.6), post / 2, 0); p.castShadow = true; g.add(p); }
  g.position.copy(pos); g.rotation.y = rotY; return g;
}

function drawTimer(t) {
  const x = timerCanvas.getContext('2d'), W = timerCanvas.width, H = timerCanvas.height;
  const left = t < T.roundOver ? Math.max(0, Math.ceil(clock(t))) : 0;
  const hot = t >= 39.7 && t < T.roundOver;
  x.fillStyle = hot && Math.floor(t * 4) % 2 ? '#5a1020' : '#1f2a44'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#ffd23f'; x.lineWidth = 18; x.strokeRect(14, 14, W - 28, H - 28);
  x.textAlign = 'center'; x.fillStyle = '#ffd23f'; x.font = '92px "Luckiest Guy"'; x.fillText('ROUND TIMER', W / 2, 150);
  x.fillStyle = hot ? '#ff5a6a' : '#ffffff'; x.font = '250px "Luckiest Guy"'; x.fillText(`0:${String(left).padStart(2, '0')}`, W / 2, 440);
  timerTex.needsUpdate = true;
}

// ---------- characters ----------
const face = (a, dx, dz) => Math.atan2(dx, dz);
const HERO = { 'Arm.L': [0, 0, -14], 'Arm.R': [0, 0, 14] };
const CHEER = (t) => ({ 'Arm.L': [0, 0, -150 - 12 * Math.sin(t * 9)], 'Arm.R': [0, 0, 150 + 12 * Math.sin(t * 9)], Head: [-8, 0, 0], Torso: [-4, 0, 0] });
const TYPE = (t) => ({ 'Arm.L': [-62 + 8 * Math.sin(t * 38), 0, -22], 'Arm.R': [-62 + 8 * Math.sin(t * 38 + 1.7), 0, 22], Head: [12, 0, 0], Torso: [4, 0, 0] });
const POINT = { 'Arm.R': [-88, 0, 12], 'Arm.L': [0, 0, -5], Head: [0, 0, -4] };
const POINT_UP = { 'Arm.R': [-168, 0, 8], 'Arm.L': [0, 0, -8], Head: [-22, 0, 0], Torso: [-4, 0, 0] };
const SCHEME = (t) => ({ 'Arm.L': [-55, 0, -30 + 6 * Math.sin(t * 7)], 'Arm.R': [-55, 0, 30 - 6 * Math.sin(t * 7)], Head: [6, 0, 0], Torso: [6, 0, 0] });
const HOLD = { 'Arm.R': [-80, 0, -25], 'Arm.L': [0, 0, -10], Head: [16, 0, 0], Torso: [3, 0, 0] };
const idle = (t, k = 0) => actionPose('Idle', ((t + k) * 0.6) % 1);

function typing(t) { return CHAT.find((c) => c.from !== undefined && t >= c.from - 0.1 && t < c.to + 0.1); }

function st(pos, rotY, poseA, faceE, extra = {}) { return { pos: pos.clone(), rotY, pose: poseA, face: faceE, scale: 1, floor: 0, grounded: true, ...extra }; }
const onPad = (p) => Math.abs(p.x - PAD.x) < 3 && Math.abs(p.z - PAD.z) < 3;

function leoState(t) {
  const ty = typing(t), isLeoTyping = ty && ty.name === 'Leo';
  const base = st(PAD, 0, idle(t), 'happy', { floor: 0.35 });
  if (t < 2.8) {
    base.rotY = -0.35;
    base.pose = mixPose(HERO, CHEER(t), easeOutBack(inv(0.35, 0.8, t)));
    base.face = t < 0.45 ? 'surprised' : 'laugh';
    if (isLeoTyping) { base.pose = TYPE(t); base.face = 'happy'; }
  } else if (t < 4.7) {
    base.rotY = -0.25;
    const lift = easeInOut(inv(...T.fly.lift, t));
    base.pos.y = PAD.y + 7.5 * lift + 0.25 * Math.sin(t * 3) * lift; base.grounded = lift <= 0;
    const fly = { 'Arm.R': [0, 0, 172], 'Arm.L': [0, 0, -40], 'Leg.L': [-8, 0, 0], 'Leg.R': [22, 0, 0], Head: [-12, 0, 0] };
    base.pose = isLeoTyping ? TYPE(t) : mixPose(idle(t), fly, easeOutBack(inv(3.1, 3.5, t)));
    base.face = t < 3.3 ? 'happy' : 'laugh';
  } else if (t < 8.45) {
    const g = T.speed.go, f = T.speed.finish;
    base.rotY = Math.PI / 2;
    if (t < g) { base.pose = isLeoTyping ? TYPE(t) : mixPose(idle(t), { Torso: [20, 0, 0], Head: [-14, 0, 0], 'Arm.L': [45, 0, -12], 'Arm.R': [45, 0, 12], 'Leg.L': [-28, 0, 0], 'Leg.R': [24, 0, 0] }, easeOutBack(inv(5.1, 5.3, t))); base.face = 'angry'; }
    else if (t < f) {
      const u = (t - g) / (f - g), x = lerp(RUN_START, RUN_END, u < 0.05 ? (u * u) / 0.1 : u - 0.025);
      base.pos.set(x, courseY(x) + (Math.abs(x - PAD.x) < 3 ? 0.35 : 0), 0); base.grounded = false;
      base.pose = mixPose(actionPose('Run', (t * 7) % 1), { Torso: [26, 0, 0], Head: [-18, 0, 0], 'Arm.L': [60, 0, -10], 'Arm.R': [60, 0, 10] }, 0.55);
      base.face = 'laugh';
    } else {
      base.pos.set(RUN_END, 4.8, 1); base.floor = 4.8; base.rotY = -0.5;
      base.pose = mixPose({ Torso: [20, 0, 0] }, CHEER(t), easeOutBack(inv(f, f + 0.3, t))); base.face = 'laugh';
    }
  } else if (t < T.unGiant) {
    base.pos.set(0, 0, 0); base.floor = 0; base.rotY = 0;
    base.scale = t < 10.25 ? lerp(1, 6, easeOutBack(inv(...T.grow, t), 1.6)) : 6;
    if (t < 10.25) { base.pose = isLeoTyping ? TYPE(t) : mixPose(idle(t), CHEER(t), inv(9.4, 9.8, t)); base.face = t < 9.05 ? 'happy' : 'laugh'; }
    else { base.pose = mixPose(HOLD, { Head: [22, 0, 0] }, 0.3); base.face = 'laugh'; }
  } else if (t < 25.8) {
    base.rotY = 0.35;
    if (t < 15.6) {
      base.rotY = lerp(0.35, -0.55, easeInOut(inv(12.6, 13.2, t)));
      base.pose = isLeoTyping ? TYPE(t) : t > T.tinyZap ? mixPose(POINT, { 'Arm.R': [-70, 0, 12] }, 0.3) : idle(t);
      base.face = t < 14.2 ? 'neutral' : t < T.tinyZap ? 'happy' : 'laugh';
    } else if (t < 19.2) { base.rotY = -0.55; base.pose = actionPose('Laugh', (t * 2.2) % 1); base.face = 'laugh'; }
    else if (t < 21.2) { base.rotY = 0.6; base.pose = idle(t); base.face = t < 20.0 ? 'neutral' : 'happy'; }
    else { base.rotY = 0.6; base.pose = isLeoTyping ? TYPE(t) : t < 22.85 ? POINT : actionPose('Laugh', (t * 2.2) % 1); base.face = t < 21.85 ? 'happy' : 'laugh'; }
  } else if (t < 29.3) {
    base.rotY = 0.05; base.pose = mixPose(idle(t), SCHEME(t), easeOutBack(inv(26.0, 26.4, t))); base.face = t < 26.6 ? 'happy' : 'laugh';
    if (t > 28.7) { base.pose = mixPose(SCHEME(t), CHEER(t), easeOutBack(inv(28.7, 28.95, t))); }
  } else if (t < 39.7) {
    // Explode attempts: aim at each target, fizzle, deflate.
    const targets = [[29.3, LAVA, 31.0], [31.7, V(TIMER_BOARD.x, 5, TIMER_BOARD.z), 33.56], [34.4, V(LEADER_BOARD.x, 5, LEADER_BOARD.z), 35.9], [36.05, V(2, 40, -6), 36.7], [36.8, NOOB_AT, 38.96]];
    let k = 0; for (let i = 0; i < targets.length; i++) if (t >= targets[i][0]) k = i;
    const [t0, tgt, nothing] = targets[k];
    base.rotY = face(0, tgt.x - PAD.x, tgt.z - PAD.z);
    const aim = k === 3 ? POINT_UP : POINT;
    base.pose = isLeoTyping ? TYPE(t) : mixPose(aim, { 'Arm.R': [-40, 0, 10], Head: [8, 0, 0], Torso: [6, 0, 0] }, easeInOut(inv(nothing, nothing + 0.3, t)));
    base.face = t < nothing - 0.4 ? 'laugh' : t < nothing ? 'surprised' : k === 4 ? 'angry' : 'neutral';
  } else if (t < 44.6) {
    base.rotY = 0.1;
    if (t < 41.3) { base.pose = mixPose(idle(t), actionPose('Shock', 0), easeOutBack(inv(39.8, 40.1, t))); base.face = 'surprised'; }
    else { base.pose = TYPE(t * 1.6); base.face = 'angry'; base.shake = 0.03 * Math.sin(t * 70); }
  } else if (t < 51.0) {
    base.rotY = 0.2; base.pose = t < 47.3 ? TYPE(t * 1.6) : mixPose(TYPE(t), actionPose('Shock', 0), easeOutBack(inv(49.1, 49.4, t)));
    base.face = t < 49.1 ? 'angry' : 'surprised';
  } else if (t < T.roundOver) {
    base.rotY = 0.1; base.pose = actionPose('Shock', 0); base.face = 'surprised'; base.shake = 0.025 * Math.sin(t * 60);
  } else if (t < BLASTS[0]) {
    base.rotY = 0.1; base.pose = mixPose(actionPose('Shock', 0), CHEER(t), easeOutBack(inv(54.3, 54.7, t))); base.face = t < 54.3 ? 'surprised' : 'happy';
  } else if (t < T.round2) {
    // Launched by 47 blasts: each one kicks him higher and spins him.
    const n = BLASTS.filter((b) => b <= t).length, last = BLASTS[n - 1];
    const kick = Math.exp(-(t - last) * 14);
    base.grounded = false;
    base.pos.set(PAD.x, PAD.y + 1.6 * n ** 0.92 + 0.8 * kick, PAD.z);
    base.rotY = 0.1 + (t - BLASTS[0]) * 5; base.rotX = Math.sin(t * 7) * 0.5; base.rotZ = Math.cos(t * 5) * 0.4;
    const flail = Math.sin(t * 24);
    base.pose = { Torso: [-8, 0, 0], Head: [-12, 0, 0], 'Arm.L': [0, 0, -150 - 20 * flail], 'Arm.R': [0, 0, 150 + 20 * flail], 'Leg.L': [30 * flail, 0, 0], 'Leg.R': [-30 * flail, 0, 0] };
    base.face = 'surprised';
  } else {
    // Round 2: back at spawn, singed and sulking; then kicked.
    base.pos.set(2.4, 0, 1.4); base.rotY = -0.5; base.floor = 0;
    base.pose = { 'Arm.L': [0, 0, -4], 'Arm.R': [0, 0, 4], Head: [14, 0, 0], Torso: [6, 0, 0] };
    base.face = t < 62.5 ? 'sad' : 'surprised';
    if (t > 62.5) base.pose = actionPose('Shock', 0);
    base.scale = t < T.kick ? 1 : Math.max(0.001, 1 - easeIn(inv(T.kick, T.kick + 0.18, t)));
  }
  return base;
}

function maxState(t) {
  const tiny = t >= T.tinyZap && t < T.round2;
  const s = st(V(-4.2, 0, -1.2), 0.5, idle(t, 0.3), 'neutral');
  s.scale = t < T.tinyZap ? 1 : tiny ? lerp(1, 0.24, easeOutBack(inv(T.tinyZap, T.tinyZap + 0.35, t), 2)) : 1;
  if (t < 2.8) { s.pos.set(-2.8, 0, -2.4); s.rotY = 0.7; s.face = t < 1.2 ? 'neutral' : 'surprised'; s.pose = t > 1.2 ? actionPose('Shock', 0) : idle(t); }
  else if (t < 8.45) { s.pos.set(-5.5, 0, -2.5); s.rotY = t < 4.7 ? 0.5 : Math.PI / 2 - 0.3; s.face = 'surprised'; s.pose = actionPose('Shock', 0); }
  else if (t < 10.25) { s.pos.set(-6.5, 0, 6.5); s.rotY = 2.4; s.pose = mixPose(actionPose('Shock', 0), { Head: [-30, 0, 0] }, inv(9.2, 9.6, t)); s.face = 'surprised'; }
  else if (t < T.unGiant) { s.pos.set(-1.8, 0, 0.9); s.rotY = Math.PI - 0.2; s.pose = actionPose('Shock', 0); s.face = 'surprised'; s.onMini = true; }
  else if (t < 19.2) {
    s.pos.set(-3.0, 0, 3.4); s.rotY = face(0, PAD.x - -3.0, PAD.z - 3.4);
    if (t < 14.2) { s.pose = actionPose('Talk', (t * 1.8) % 1); s.face = 'happy'; }
    else if (t < T.tinyZap) { s.pose = idle(t); s.face = 'surprised'; }
    else {
      // Tiny, stomping and hopping mad.
      const hop = Math.abs(Math.sin((t - 15.3) * 7.5)) * (t > 15.3 ? 1 : 0);
      s.pos.y = hop * 0.35; s.grounded = hop < 0.02;
      s.pose = { 'Arm.L': [0, 0, -150 + 25 * Math.sin(t * 15)], 'Arm.R': [0, 0, 150 - 25 * Math.sin(t * 15)], Head: [-18, 0, 0], 'Leg.L': [20 * Math.sin(t * 15), 0, 0], 'Leg.R': [-20 * Math.sin(t * 15), 0, 0] };
      s.face = t < 15.35 ? 'surprised' : 'angry';
    }
  } else if (t < 44.6) { s.pos.set(-3.0, 0, 3.4); s.rotY = face(0, PAD.x + 3, PAD.z - 3.4); s.pose = idle(t); s.face = 'angry'; if (t >= 29.3 && t < 39.7) { s.pos.set(-2.6, 0, 3.8); } }
  else if (t < T.roundOver) {
    s.pos.set(-2.6, 0, 3.8); s.rotY = face(0, PAD.x + 2.6, PAD.z - 3.8);
    const point = { 'Arm.R': [-150, 0, 20], Head: [-24, 0, 0] };
    s.pose = t < 45.3 ? idle(t) : mixPose(actionPose('Shock', 0), point, easeOutBack(inv(45.3, 45.6, t)));
    s.face = t < 45.3 ? 'neutral' : 'surprised';
    if (t >= 51.7) { s.pos.x -= 1.2 * easeOut(inv(51.7, 52.4, t)); s.pose = actionPose('Walk', (t * 2) % 1); }
  } else if (t < T.round2) { s.pos.set(-3.8, 0, 3.8); s.rotY = face(0, PAD.x + 3.8, PAD.z - 3.8); s.pose = mixPose(actionPose('Shock', 0), { Head: [-40, 0, 0] }, inv(56, 57, t)); s.face = t < 57.6 ? 'surprised' : 'laugh'; }
  else {
    s.pos.set(-1.2, 0, 3.4); s.rotY = 0.25; s.scale = 1;
    const ty = typing(t);
    s.pose = ty && ty.name === 'Max' ? TYPE(t) : t > T.kick ? actionPose('Laugh', (t * 2.2) % 1) : mixPose(idle(t), CHEER(t), easeOutBack(inv(59.5, 59.9, t)));
    s.face = ty ? 'happy' : 'laugh';
  }
  return s;
}

function miaState(t) {
  const s = st(V(4.2, 0, -1.4), -0.5, idle(t, 0.7), 'neutral');
  if (t < 2.8) { s.pos.set(2.9, 0, -2.6); s.rotY = -0.7; s.face = t < 1.4 ? 'neutral' : 'surprised'; s.pose = t > 1.4 ? actionPose('Shock', 0) : idle(t); }
  else if (t < 8.45) { s.pos.set(-4.2, 0, -4.5); s.rotY = t < 4.7 ? 0.4 : Math.PI / 2 - 0.2; s.face = 'surprised'; s.pose = actionPose('Shock', 0); }
  else if (t < 10.25) { s.pos.set(6.8, 0, 6.2); s.rotY = -2.4; s.pose = mixPose(actionPose('Shock', 0), { Head: [-30, 0, 0] }, inv(9.2, 9.6, t)); s.face = 'surprised'; }
  else if (t < T.unGiant) { s.pos.set(1.9, 0, 0.6); s.rotY = Math.PI + 0.25; s.pose = actionPose('Wave', (t * 1.5) % 1); s.face = 'happy'; s.onMini = true; }
  else if (t < 19.2) { s.pos.set(4.0, 0, -2.0); s.rotY = -0.9; s.pose = t > T.tinyZap ? actionPose('Laugh', (t * 2) % 1) : idle(t); s.face = t > T.tinyZap + 0.3 ? 'laugh' : 'neutral'; }
  else if (t < 22.85) {
    s.pos.set(3.2, 0, 4.2); s.rotY = face(0, PAD.x - 3.2, PAD.z - 4.2);
    const walkIn = inv(19.2, 19.7, t);
    s.pos.x += 1.5 * (1 - easeOut(walkIn));
    s.pose = t < 19.7 ? actionPose('Walk', (t * 2.2) % 1) : t < T.rainbowZap ? mixPose(actionPose('Talk', (t * 1.8) % 1), { 'Arm.R': [-70, 0, 10] }, 0.5) : actionPose('Shock', 0);
    s.face = t < T.rainbowZap ? 'angry' : 'surprised';
  } else if (t < 25.8) { s.pos.set(3.2, 0, 4.2); s.rotY = face(0, PAD.x - 3.2, PAD.z - 4.2) + 0.5; s.pose = { 'Arm.L': [0, 0, -4], 'Arm.R': [0, 0, 4], Head: [0, 0, 0] }; s.face = 'neutral'; }
  else if (t < T.round2) {
    s.pos.set(-4.2, 0, -2.6); s.rotY = face(0, PAD.x + 4.2, PAD.z + 2.6); s.pose = idle(t, 0.7); s.face = 'neutral';
    if (t >= 51.7 && t < T.roundOver) { s.pos.x += 1.3 * easeOut(inv(51.7, 52.4, t)); s.pose = actionPose('Walk', (t * 2) % 1); s.face = 'surprised'; }
    if (t >= T.roundOver) { s.pos.set(5.0, 0, 5.0); s.pose = t > 57.3 ? actionPose('Laugh', (t * 2.2) % 1) : mixPose(actionPose('Shock', 0), { Head: [-40, 0, 0] }, inv(56, 57, t)); s.face = t > 57.3 ? 'laugh' : 'surprised'; }
  } else { s.pos.set(-3.8, 0, 0.8); s.rotY = 0.6; s.pose = t > T.kick ? actionPose('Laugh', (t * 2.2) % 1) : idle(t, 0.7); s.face = t > T.kick ? 'laugh' : 'happy'; }
  return s;
}

function noobState(t) {
  const s = st(NOOB_AT, face(0, PAD.x - NOOB_AT.x, PAD.z - NOOB_AT.z), idle(t, 1.1), 'neutral');
  if (t >= 37.6 && t < 39.7) {
    const look = Math.sin((t - 37.6) * 5) * 30 * clamp((39.4 - t) * 2);
    s.pose = { ...actionPose('Shock', 0), Head: [0, look, 0] }; s.face = 'surprised';
  }
  return s;
}

function placeActor(a, s) {
  a.root.position.copy(s.pos); a.root.rotation.set(s.rotX || 0, s.rotY, s.rotZ || 0, 'YXZ');
  a.root.scale.setScalar(s.scale ?? 1);
  pose(a, s.pose);
  if (s.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += (s.floor || 0) - soleHeight(a); }
  if (s.shake) a.root.position.x += s.shake;
  setExpression(a, s.face);
  a.root.updateMatrixWorld(true);
}

// ---------- cameras ----------
function lookCam(stage, pos, target, fov = 42) { const c = stage.camera; c.position.copy(pos); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(target); }
const headOf = (a) => { const v = new THREE.Vector3(); a.bones.Head.getWorldPosition(v); return v; };
function shake(amount, t) { return V(amount * Math.sin(t * 83), amount * Math.cos(t * 71), 0); }

export function samples(t) { return (t >= 5.3 && t < 7.75) || (t >= 55.4 && t < 59.25) ? 3 : 1; }
export function shutter(t) { return (t >= 5.3 && t < 7.75) || (t >= 55.4 && t < 59.25) ? 0.5 : 0; }

export function update(t, stage) {
  drawTimer(t);
  const L = leoState(t), M = maxState(t), A = miaState(t);
  // Mini lobby follows Leo's giant hand.
  const handShot = t >= 10.25 && t < T.unGiant;
  placeActor(leo, L);
  miniLobby.visible = handShot;
  if (handShot) {
    const hand = new THREE.Vector3(-0.51, -1.34, 0); leo.bones['Arm.R'].localToWorld(hand);
    miniLobby.position.set(hand.x, hand.y + 0.5 * 6 + 0.8, hand.z);
    M.floor = A.floor = miniLobby.position.y; M.pos.add(miniLobby.position).setY(miniLobby.position.y); A.pos.add(miniLobby.position).setY(miniLobby.position.y);
  }
  placeActor(max, M); placeActor(mia, A); placeActor(noob, noobState(t));
  noob.root.visible = t >= 34.4 && t < 39.7 || t < 2.8;
  if (t < 2.8) { noob.root.position.set(9, 0, -2); noob.root.rotation.y = -1.2; }

  // Crowns: Leo's drops on at the start, pops off at round over. Max's appears in round 2.
  const lh = headOf(leo);
  leoCrown.visible = t < T.roundOver + 1.2;
  if (t < T.roundOver) {
    const drop = easeOutBack(inv(...T.crownDrop, t), 1.2);
    const sc = leo.root.scale.x;
    leo.bones.Head.getWorldQuaternion(leoCrown.quaternion);
    const on = new THREE.Vector3(0, 1.5, 0.02).applyQuaternion(leoCrown.quaternion).multiplyScalar(sc).add(lh);
    leoCrown.position.copy(on).add(V(0, 4 * (1 - drop), 0)); leoCrown.scale.setScalar(0.95 * sc);
    leoCrown.rotateY(t * 0.8);
  } else {
    const u = t - T.roundOver;
    leoCrown.position.set(lh.x + u * 3, lh.y + 1.5 + 9 * u - 4 * u * u, lh.z); leoCrown.rotation.set(u * 6, u * 4, u * 3); leoCrown.scale.setScalar(0.95 * (1 - inv(0.9, 1.2, u)));
  }
  maxCrown.visible = t >= T.round2;
  if (maxCrown.visible) maxCrown.position.y = 1.5 + 4 * (1 - easeOutBack(inv(T.round2, T.round2 + 0.5, t), 1.2));

  // Rainbow Mia.
  const rb = t >= T.rainbowZap;
  miaMeshes.forEach(({ m, hsl, base }, i) => {
    if (!rb) { m.color.copy(base); m.emissive?.set('#000000'); return; }
    const h = (t * 0.45 + i * 0.045) % 1; m.color.setHSL(h, 0.85, 0.58); m.emissive?.setHSL(h, 0.9, 0.12);
  });

  // ForceField on respawn in round 2.
  const ffT = t - T.round2;
  ff.visible = ffT > 0 && ffT < 1.6;
  if (ff.visible) { const lp = leo.root.position; ff.position.set(lp.x, 2.9, lp.z); ff.scale.setScalar(3.6 * easeOutBack(clamp(ffT / 0.25), 2)); ff.material.uniforms.opacity.value = 1 - inv(1.1, 1.6, ffT); ff.material.uniforms.time.value = t; }

  // Sparkles: crown landing and each admin zap.
  const zaps = [[0.4, leo], [3.3, leo], [5.2, leo], [9.05, leo], [T.tinyZap, max], [T.rainbowZap, mia], [T.round2 + 0.3, max]];
  let active = null; for (const [z, who] of zaps) if (t >= z && t < z + 0.8) active = [z, who];
  sparkles.forEach((s, i) => {
    s.visible = !!active; if (!active) return;
    const [z, who] = active, u = (t - z) / 0.8, a = i * 2.39996, c = who.root.position, sc = who.root.scale.x;
    s.position.set(c.x + Math.cos(a + u * 3) * (1.2 + 2.2 * u) * Math.max(sc, 0.5), c.y + (1 + (i % 6) * 0.9) * sc + u * 1.5, c.z + Math.sin(a + u * 3) * (1.2 + 2.2 * u) * Math.max(sc, 0.5));
    s.scale.setScalar(Math.max(0.3, sc) * (1 - u)); s.material.opacity = 1 - u; s.rotation.set(t * 5 + i, t * 3, 0);
  });

  // Poofs: Leo un-giants, Max shrinks, fizzles at each target, kick.
  const lpos = leo.root.position;
  const fizzleAt = [LAVA, V(TIMER_BOARD.x, 4.8, TIMER_BOARD.z + 0.8), V(LEADER_BOARD.x, 5.5, LEADER_BOARD.z + 0.8), V(2, 22, -6), V(NOOB_AT.x, 4.8, NOOB_AT.z)];
  const poofs = [[T.unGiant, PAD.clone().setY(2.5), 1.4], [T.tinyZap, V(-3.0, 1.5, 3.4), 1.0], ...T.fizzles.map((f, i) => [f, fizzleAt[i], 0.7]), [T.kick, V(2.4, 2.6, 1.4), 1.2]];
  let pf = null; for (const p of poofs) if (t >= p[0] && t < p[0] + 0.9) pf = p;
  zapPuffs.forEach((p, i) => {
    p.visible = !!pf; if (!pf) return;
    const [z, c, size] = pf, u = (t - z) / 0.9, a = i * 0.5236;
    p.position.set(c.x + Math.cos(a) * size * 1.6 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.6 + u * size, c.z + Math.sin(a) * size * 1.6 * easeOut(u));
    p.scale.setScalar(size * (0.35 + 0.5 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });

  // 47 blasts under Leo, plus smoke.
  blastPool.forEach(({ core, shell }) => { core.visible = shell.visible = false; });
  if (t >= BLASTS[0] - 0.01 && t < T.round2) {
    BLASTS.forEach((b, i) => {
      const age = t - b; if (age < 0 || age > 0.42) return;
      const { core, shell } = blastPool[i % blastPool.length], r = rng(i + 5);
      const at = V(PAD.x + (r() - 0.5) * 2.5, PAD.y + 1.6 * (i + 1) ** 0.92 - 1.2 + (r() - 0.5), PAD.z + (r() - 0.5) * 2.5);
      const u = age / 0.42;
      core.visible = shell.visible = true;
      core.position.copy(at); shell.position.copy(at);
      core.scale.setScalar(0.4 + 2.2 * easeOut(clamp(u * 2))); core.material.opacity = 1 - u;
      shell.scale.setScalar(0.8 + 3.8 * easeOut(u)); shell.material.opacity = 0.55 * (1 - u) ** 1.5;
    });
  }
  const smokeOn = t >= BLASTS[0] && t < T.round2 + 2.0;
  smoke.forEach((p, i) => {
    p.visible = smokeOn; if (!smokeOn) return;
    if (t < T.round2) {
      const age = ((t - BLASTS[0]) + i * 0.21) % 3.2, r = rng(i + 50);
      p.position.set(PAD.x + (r() - 0.5) * 5, PAD.y + 1 + age * 5 + (lpos.y - PAD.y) * 0.5, PAD.z + (r() - 0.5) * 5);
      p.scale.setScalar(0.8 + age * 0.9); p.material.opacity = 0.5 * (1 - age / 3.2);
    } else {
      // Little smoke wisps over singed Leo.
      const age = ((t - T.round2) + i * 0.13) % 1.4;
      p.visible = i < 6 && t < T.kick; p.position.set(lpos.x + Math.sin(i * 2.1) * 0.5, lpos.y + 6.2 + age * 1.8, lpos.z + Math.cos(i * 2.1) * 0.5);
      p.scale.setScalar(0.25 + age * 0.35); p.material.opacity = 0.55 * (1 - age / 1.4);
    }
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t);
  const lead = leo.root.position;
  stage.bloom.strength = 0.28;
  // Camera on a sphere around a target: az 0 looks from +Z, el lifts the camera.
  const orbit = (tg, az, el, dist, fov = 40, jolt = 0) => {
    const p = tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist));
    lookCam(stage, p.add(shake(jolt, t)), tg, fov);
    stage.aimSun(V(tg.x, Math.max(0, tg.y - 5), tg.z), clamp(dist * 0.9, 12, 40));
  };
  const at = (p, tg, fov = 40) => { lookCam(stage, p, tg, fov); stage.aimSun(V(tg.x, Math.max(0, tg.y - 5), tg.z), 18); };
  const aimAt = (tgt) => Math.atan2(tgt.x - PAD.x, tgt.z - PAD.z);
  const aimShot = (tgt, up = false) => orbit(V(PAD.x, up ? 5.2 : 4.3, PAD.z), aimAt(tgt) - 1.15, up ? -0.12 : 0.08, 14, 40);
  const boardShot = (pos, rotY, h) => { const c = V(pos.x, 3.2 + h / 2, pos.z); at(c.clone().add(V(Math.sin(rotY) * 12, 0.6, Math.cos(rotY) * 12)), c.clone().add(V(0, -0.8, 0)), 40); };
  switch (shot.id) {
    case 'hook': orbit(V(0, 4.0, 0.3), lerp(-0.28, -0.2, u), 0.06, lerp(16.5, 14.5, easeOut(u)), 40); break;
    case 'fly': orbit(V(0, lerp(4.2, 10.5, easeInOut(inv(3.3, 4.6, t))), 1), -0.25, -0.12, 17, 44); break;
    case 'speedReady': orbit(V(0, 3.8, 1), 0.55, 0.08, 14, 40); break;
    case 'speedRun': at(lead.clone().add(V(-2.5, 3.4, 17)), lead.clone().add(V(2.5, 2.8, 0)), 46); stage.aimSun(lead.clone(), 24); break;
    case 'speedFinish': orbit(V(60, 8.6, 1), -0.35, 0.08, 15, 40); break;
    case 'grow': { const k = easeOut(inv(9.0, 9.75, t)); orbit(V(0, lerp(4, 17.5, k), 0), 0, lerp(0.02, -0.05, k), lerp(17, 60, k), 44); break; }
    case 'hand': { const m = miniLobby.position, tg = m.clone().add(V(-1.5, 3.2, 0)).lerp(headOf(leo), 0.4); at(tg.clone().add(V(lerp(6.5, 5.5, u), -2, lerp(31, 29, u))), tg, 44); stage.aimSun(m.clone(), 30); break; }
    case 'ask': at(V(10.4, 4.2, 17), V(-1.5, 3.4, 2.2), 42); break;
    case 'tinyMax': at(V(lerp(-5.6, -5.9, u), 0.75, lerp(7.9, 8.2, u)), V(-1.6, 2.2, 1.0), 46); stage.aimSun(V(-2, 0, 2), 10); break;
    case 'scold': at(V(-12.5, 4.2, 16.7), V(1.6, 3.6, 2.6), 42); break;
    case 'rainbowMia': { const r = mia.root.rotation.y + 0.9, mp = mia.root.position; at(mp.clone().add(V(Math.sin(r) * lerp(11, 10, u), 3.9, Math.cos(r) * lerp(11, 10, u))), mp.clone().add(V(0, 3.9, 0)), 38); break; }
    case 'menu': orbit(V(-1.2, 4.2, 1), 0.05, 0.04, lerp(16, 15, u), 40); break;
    case 'aimLava': aimShot(LAVA); break;
    case 'lava': orbit(V(LAVA.x, 3.5, 0), 0.5, 0.22, 16, 40); break;
    case 'aimTimer': aimShot(TIMER_BOARD); break;
    case 'timer': boardShot(TIMER_BOARD, 0.55, 3.4); break;
    case 'aimBoard': aimShot(LEADER_BOARD); break;
    case 'board': boardShot(LEADER_BOARD, -0.45, 4.85); break;
    case 'aimSky': aimShot(V(2, 40, -6), true); break;
    case 'aimNoob': aimShot(NOOB_AT); break;
    case 'noob': { const r = Math.atan2(PAD.x - NOOB_AT.x, PAD.z - NOOB_AT.z); orbit(NOOB_AT.clone().setY(3.6), r + 0.6, 0.05, 13, 40); break; }
    case 'nothing': orbit(V(0, 4.6, 1), aimAt(NOOB_AT) - 0.35, 0.04, 10, 40); break;
    case 'ten': orbit(V(0, 4.4, 1), 0.1, 0.03, lerp(15, 11, easeOut(u)), 40); break;
    case 'spam': orbit(V(0, 4.2, 1), 0.15, 0.05, 12.5, 40, 0.08); break;
    case 'notice': { const m = max.root.position; at(m.clone().add(V(1.2, 0.9, 3.6)), m.clone().add(V(0, 1.0, 0)), 44); stage.aimSun(m.clone(), 10); break; }
    case 'system': orbit(V(0, 4.4, 1), 0.2, 0.05, lerp(16, 13, u), 40); break;
    case 'three': orbit(V(0, 4.8, 1), 0.1, 0.02, 8, 36, 0.05); break;
    case 'two': orbit(V(0, 3.5, 2.5), 0, 0.12, 21, 44, 0.05); break;
    case 'one': orbit(V(0, 2.5, 1), 0, 0.4, 28, 44, 0.05); break;
    case 'roundOver': orbit(V(0, 4.8, 1), lerp(-0.15, -0.05, u), 0.05, 14, 40); break;
    case 'boom': {
      const k = inv(BLASTS[0], BLASTS[46], t), ty = lerp(4.5, lead.y + 2, easeOut(k));
      orbit(V(0, ty, 1), 0, lerp(0.05, -0.1, k), lerp(20, 42, easeOut(k)), 46, t < BLASTS[46] ? 0.25 : 0);
      stage.bloom.strength = 0.5; break;
    }
    default: orbit(V(-0.6, 3.6, 2), lerp(0.05, -0.05, u), 0.06, lerp(21, 18, u), 42);
  }
}

// ---------- overlay: HUD, chat, panels, counters, flashes ----------
function chatBox(g, s, t, { x = 60, y = 370, w = 700, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => t >= l.at).slice(-rows);
  const ty = typing(t);
  if (!shown.length && !ty) return;
  g.save();
  const lh = 50 * s, pad = 20 * s, n = shown.length + (ty ? 1 : 0), h = pad * 2 + n * lh + (ty ? 8 * s : 0);
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${32 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2;
  for (const l of shown) {
    g.globalAlpha = clamp((t - l.at) / 0.12);
    const tag = `[${l.name}]: `; g.fillStyle = l.color; g.fillText(tag, x * s + pad, yy);
    g.fillStyle = l.name === 'Server' ? '#FFE9A8' : '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy); yy += lh;
  }
  g.globalAlpha = 1;
  if (ty) {
    const k = Math.floor(clamp((t - ty.from) / (ty.to - ty.from)) * ty.text.length), shownT = ty.text.slice(0, k);
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
    g.fillStyle = '#ffffff'; g.fillText(shownT, x * s + pad * 1.2, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0 || k < ty.text.length) g.fillRect(x * s + pad * 1.2 + g.measureText(shownT).width + 4 * s, yy - 14 * s, 4 * s, 36 * s);
  }
  g.restore();
}

function panel(g, s, x, y, w, h, alpha, border = '#FFC83D') {
  g.save(); g.globalAlpha = alpha; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 8 * s;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(18,28,44,.9)'; g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = 6 * s; g.strokeStyle = border; g.stroke(); g.restore();
}

function bigText(g, s, text, x, y, size, color, alpha = 1, k = 1, align = 'center') {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}

export function overlay(g, s, t) {
  const id = shotAt(SHOTS, t).shot.id;
  if (id === 'speedRun') speedLines(g, s, t, 0.8, { cx: 540, cy: 900 });
  if (id === 'boom') speedLines(g, s, t, 0.35 * (t < BLASTS[46] ? 1 : 0), { cx: 540, cy: 800, seed: 9 });

  // Admin HUD (Leo until round over, Max in round 2).
  if (t < T.roundOver) adminTimer(g, s, clock(t), t, { flash: t >= 39.7 ? 0.5 + 0.5 * Math.sin(t * 16) : 0 });
  else if (t >= T.round2) adminTimer(g, s, 60 - (t - T.round2), t);
  chatBox(g, s, t, { y: 370 });

  // Command list (25.8 - 29.3): every command ticked, EXPLODE glowing.
  if (t >= 25.95 && t < 29.3) {
    const a = clamp((t - 25.95) / 0.2) * (1 - inv(29.1, 29.3, t));
    const k = easeOutBack(inv(25.95, 26.25, t));
    g.save(); g.translate(275 * s, 870 * s); g.scale(k, k); g.translate(-275 * s, -870 * s);
    panel(g, s, 40, 640, 470, 460, a);
    bigText(g, s, 'COMMANDS', 275, 700, 52, '#FFD23F', a);
    [':fly', ':speed', ':giant', ':tiny', ':rainbow'].forEach((c, i) => {
      const y = 770 + i * 50; g.save(); g.globalAlpha = a * 0.75; g.font = `800 ${34 * s}px Montserrat`; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = '#ffffff'; g.fillText(c, 90 * s, y * s); g.fillStyle = '#3ddc97'; g.fillText('USED', 360 * s, y * s); g.restore();
    });
    const glow = t > 27.0 ? 0.6 + 0.4 * Math.sin(t * 10) : 0.4;
    g.save(); g.globalAlpha = a; roundRect(g, 70 * s, 1016 * s, 410 * s, 66 * s, 16 * s); g.fillStyle = `rgba(255,70,40,${0.35 * glow + 0.2})`; g.fill(); g.restore();
    bigText(g, s, ':EXPLODE', 275, 1052, t > 28.7 ? 58 : 48, '#FFB640', a, t > 28.7 ? easeOutBack(inv(28.7, 28.95, t), 2.5) : 1);
    g.restore();
  }

  // Tiny corner notice that Max spots, then the full system message.
  if (t >= 44.6 && t < 47.3) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 9);
    panel(g, s, 60, 640, 330, 70, 0.9 * clamp((t - 44.8) / 0.2), `rgba(255,90,90,${pulse})`);
    g.save(); g.globalAlpha = clamp((t - 44.8) / 0.2); g.font = `800 ${24 * s}px Montserrat`; g.fillStyle = '#FFB0A0'; g.textBaseline = 'middle';
    g.fillText('! :explode  target: me  x47', 80 * s, 676 * s); g.restore();
  }
  if (t >= 47.3 && t < 51.0) {
    const a = clamp((t - 47.3) / 0.15) * (1 - inv(50.8, 51.0, t)), k = easeOutBack(inv(47.3, 47.55, t));
    g.save(); g.translate(540 * s, 850 * s); g.scale(k, k); g.translate(-540 * s, -850 * s);
    panel(g, s, 170, 660, 740, 420, a, '#ff5a6a');
    bigText(g, s, 'SYSTEM', 540, 720, 44, '#ff9aa4', a);
    if (t >= 47.46) bigText(g, s, ':EXPLODE', 540, 800, 72, '#FFB640', a, easeOutBack(inv(47.46, 47.7, t), 2));
    if (t >= 48.5) bigText(g, s, 'TARGET:', 430, 900, 66, '#ffffff', a, easeOutBack(inv(48.5, 48.72, t), 2));
    if (t >= 49.14) bigText(g, s, 'ME', 700, 900, 84, '#ff4d5e', a, easeOutBack(inv(49.14, 49.36, t), 2.6));
    if (t >= 50.16) bigText(g, s, 'x47', 540, 1005, 96, '#FFD23F', a, easeOutBack(inv(50.16, 50.4, t), 2.6));
    g.restore();
  }

  // Countdown numbers, ROUND OVER, boom counter, ROUND 2.
  [[51.1, '3'], [51.74, '2'], [52.44, '1']].forEach(([at, n]) => { if (t >= at && t < at + 0.6) bigText(g, s, n, 820, 760, 240, '#ffffff', 1 - inv(at + 0.45, at + 0.6, t), easeOutBack(inv(at, at + 0.2, t), 2.4)); });
  if (t >= T.roundOver && t < 55.3) bigText(g, s, 'ROUND OVER', 540, 760, 118, '#FFD23F', 1 - inv(55.1, 55.3, t), easeOutBack(inv(T.roundOver, T.roundOver + 0.3, t), 2));
  if (t >= BLASTS[0] && t < T.round2) {
    const n = BLASTS.filter((b) => b <= t).length, last = BLASTS[n - 1];
    bigText(g, s, `BOOM x${n}`, 540, 700, n === 47 ? 128 : 104, n === 47 ? '#FFD23F' : '#FFB640', 1 - inv(59.0, 59.25, t), 1 + 0.18 * Math.exp(-(t - last) * 12));
  }
  if (t >= T.round2 && t < 61.2) bigText(g, s, 'ROUND 2', 540, 760, 118, '#7FE3DD', 1 - inv(61.0, 61.2, t), easeOutBack(inv(T.round2, T.round2 + 0.3, t), 2));

  // Flashes: zaps, fizzles, blasts, kick.
  for (const z of [T.rainbowZap]) flash(g, s, 0.55 * (1 - clamp((t - z) / 0.25)) * (t >= z ? 1 : 0), '#ffffff');
  if (t >= BLASTS[0] && t < T.round2) {
    const n = BLASTS.filter((b) => b <= t).length, last = BLASTS[n - 1];
    flash(g, s, 0.28 * Math.exp(-(t - last) * 18), '#ffb640');
  }
  flash(g, s, t >= T.roundOver ? 0.5 * (1 - clamp((t - T.roundOver) / 0.2)) : 0, '#ffffff');
  flash(g, s, t >= T.kick ? 0.4 * (1 - clamp((t - T.kick) / 0.2)) : 0, '#ffffff');
}
