// Whatever Mia Draws: the classroom and the drawn things, built in code (no pack accessories).
// World (studs): classroom floor y 0, interior x -22..22, z -14..14 (room for an 8-stud lion). The board is on the west
// wall (x -22), the door on the east wall (x 22, z 9), windows on the north wall (z -14). Students face west (-x).
// Mia's desk is front centre.
// Drawn things (stick boyfriend, cage, yarn) are graphite "pencil lines": thin dark tubes with a hand-drawn wobble.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
export const PENCIL_M = new THREE.MeshStandardMaterial({ color: '#2d2d33', roughness: 0.85 });

function planks() {
  const t = canvasTexture(512, 512, (x, w, h) => {
    const r = rng(5); x.fillStyle = '#c08a55'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '90,50,20' : '255,220,170'},${0.08 + r() * 0.08})`; x.fillRect(0, i * 64, w, 64); x.fillStyle = 'rgba(70,40,20,.35)'; x.fillRect(0, i * 64, w, 3); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export const DESK_TOP = 3.225;
export const SEATS = { Mia: [-4, 1], Max: [4, -7], Noob: [4, 7.5], A: [-4, -7], C: [11, 1], D: [11, -7], E: [11, 8] };
export const PAPER = V(SEATS.Mia[0] - 0.15, DESK_TOP + 0.01, SEATS.Mia[1]);    // centre of Mia's drawing paper

export function classroom(scene) {
  const g = new THREE.Group(); g.name = 'classroom'; scene.add(g);
  const ft = planks(); ft.repeat.set(6, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 28), std('#ffffff', { map: ft, roughness: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wallM = std('#f6e7c6', { roughness: 0.85 }), trimM = std('#e8735a', { roughness: 0.6 });
  g.add(box(0.6, 9, 28.6, wallM, -22.3, 4.5, 0), box(0.6, 9, 28.6, wallM, 22.3, 4.5, 0), box(45.2, 9, 0.6, wallM, 0, 4.5, 14.3));
  for (const [w, x, z, ry] of [[28.6, -21.98, 0, Math.PI / 2], [28.6, 21.98, 0, -Math.PI / 2], [45, 0, 13.98, Math.PI]]) { const k = box(w, 0.6, 0.08, trimM, x, 0.3, z); k.rotation.y = ry; g.add(k); }
  // Board: ART CLASS, chalk doodles (a sun, a house, a cat).
  const bt = canvasTexture(1536, 640, (x, w, h) => {
    x.fillStyle = '#244a3a'; x.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 30 + r() * 120, 6); }
    x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '120px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('ART CLASS', w / 2, 200);
    x.font = '60px "Luckiest Guy"'; x.fillStyle = 'rgba(255,230,120,.9)'; x.fillText('DRAW ANYTHING!', w / 2, 300);
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.arc(260, 470, 60, 0, 7); x.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(260 + Math.cos(a) * 80, 470 + Math.sin(a) * 80); x.lineTo(260 + Math.cos(a) * 115, 470 + Math.sin(a) * 115); x.stroke(); }
    x.strokeRect(1150, 430, 170, 130); x.beginPath(); x.moveTo(1130, 430); x.lineTo(1235, 350); x.lineTo(1340, 430); x.stroke();
    x.beginPath(); x.arc(760, 500, 55, 0, 7); x.moveTo(720, 455); x.lineTo(730, 410); x.lineTo(752, 447); x.moveTo(800, 455); x.lineTo(790, 410); x.lineTo(768, 447); x.stroke();
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.8), std('#ffffff', { map: bt, roughness: 0.9 })); board.rotation.y = Math.PI / 2; board.position.set(-21.95, 4.9, 0); g.add(board);
  const frameM = std('#8a5a32');
  g.add(box(0.2, 0.3, 14.4, frameM, -21.9, 1.95, 0), box(0.2, 0.3, 14.4, frameM, -21.9, 7.85, 0), box(0.45, 0.15, 14, frameM, -21.8, 1.9, 0));
  g.add(box(0.12, 6.6, 3.6, std('#c0763a'), 21.95, 3.3, 9));                          // door
  g.add(box(0.2, 0.2, 0.5, std('#e0c060', { metalness: 0.6, roughness: 0.3 }), 21.8, 3.2, 7.6));
  // North wall with three windows (sky through them).
  const z = -14.3, skyM = std('#bfe3ff', { emissive: '#bfe3ff', emissiveIntensity: 0.55 });
  g.add(box(45.2, 2.6, 0.6, wallM, 0, 1.3, z), box(45.2, 1.6, 0.6, wallM, 0, 8.2, z));
  for (const [x, w] of [[-20.2, 4.2], [-7.4, 6.6], [7.4, 6.6], [20.2, 4.2]]) g.add(box(w, 4.8, 0.6, wallM, x, 5.0, z));
  for (const x of [-14.1, 0, 14.1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.8), skyM); p.position.set(x, 5.0, z - 0.25); g.add(p); g.add(box(7, 0.25, 0.9, std('#ffffff'), x, 2.6, z + 0.3), box(0.2, 4.8, 0.3, std('#ffffff'), x, 5.0, z + 0.05)); }
  // Posters on the south wall.
  for (const [x, col, txt] of [[-10, '#ff7a59', 'DRAW!'], [-3, '#5ab0ff', 'COLOUR'], [7, '#7bd389', 'ART!']]) {
    const pt = canvasTexture(256, 320, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '56px "Luckiest Guy"'; c.textAlign = 'center'; c.fillText(txt, w / 2, h / 2 + 20); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.75), std('#fff', { map: pt })); p.rotation.y = Math.PI; p.position.set(x, 4.6, 13.95); g.add(p);
  }
  // Desks (top y 3.225) with chairs behind them (east); Mia's has no chair (she stands to draw).
  const deskM = std('#d7b07a', { roughness: 0.5 }), legM = std('#5a6478', { roughness: 0.4, metalness: 0.4 }), chairM = std('#3a78d8');
  const desks = {};
  for (const [n, [x, zz]] of Object.entries(SEATS)) {
    const d = new THREE.Group(); d.position.set(x, 0, zz); g.add(d); desks[n] = d;
    d.add(box(2.2, 0.25, 3.0, deskM, 0, 3.1, 0));
    for (const [a, b] of [[-0.9, -1.3], [0.9, -1.3], [-0.9, 1.3], [0.9, 1.3]]) d.add(box(0.18, 3.0, 0.18, legM, a, 1.5, b));
    if (n === 'Mia') continue;
    const c = new THREE.Group(); c.position.set(x + 2.1, 0, zz); g.add(c);
    c.add(box(1.9, 0.22, 2.0, chairM, 0, 1.7, 0), box(0.22, 2.0, 2.0, chairM, 1.05, 2.8, 0));
    for (const [a, b] of [[-0.8, -0.85], [0.8, -0.85], [-0.8, 0.85], [0.8, 0.85]]) c.add(box(0.15, 1.6, 0.15, legM, a, 0.8, b));
  }
  // Loose drawing papers on the other desks (they fly when the lion roars).
  const papers = [], r = rng(31), papM = std('#fbfbf4', { side: THREE.DoubleSide, roughness: 0.8 });
  for (const [n, [x, zz]] of Object.entries(SEATS)) {
    if (n === 'Mia') continue;
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), papM); p.castShadow = true; g.add(p);
      p.userData = { p0: V(x - 0.2 + (r() - 0.5) * 0.6, DESK_TOP + 0.02 + i * 0.01, zz + (r() - 0.5) * 1.2), yaw: r() * 6.3, v: V(4 + r() * 6, 3 + r() * 4, (r() - 0.5) * 6), spin: V(r() * 6, r() * 6, r() * 6) };
      papers.push(p);
    }
  }
  for (const x of [-11, 9]) { const lamp = new THREE.PointLight('#fff2dc', 45, 40, 1.4); lamp.position.set(x, 8.5, 0); g.add(lamp); }
  return { group: g, desks, papers };
}

// Mia's drawing paper: a canvas redrawn when its contents change. draw(fn) clears to paper and calls fn(ctx, w, h).
export function drawingPaper(scene) {
  const W = 512, H = 680, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.5), std('#e8e8e4', { map: tex, roughness: 0.9 }));
  m.rotation.x = -Math.PI / 2; m.position.copy(PAPER); m.receiveShadow = true; scene.add(m);   // 1.9 along x, 2.5 along z
  let key = null;
  return {
    mesh: m,
    draw(k, fn) {
      if (k === key) return; key = k;
      ctx.fillStyle = '#efeee6'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(150,180,230,.35)'; ctx.lineWidth = 2; for (let y = 60; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = '#2d2d33'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      fn && fn(ctx, W, H); tex.needsUpdate = true;
    },
  };
}

// Pencil: yellow body, pink eraser, wood cone and graphite tip; tip at the origin, body along +Y.
export function pencil() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 6), std('#f2c230', { roughness: 0.45 })); body.position.y = 0.75; g.add(body);
  const er = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12), std('#f08aa0')); er.position.y = 1.38; g.add(er);
  const fe = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12), std('#c9ccd2', { metalness: 0.7, roughness: 0.3 })); fe.position.y = 1.28; g.add(fe);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 6), std('#e8c89a')); cone.rotation.x = Math.PI; cone.position.y = 0.1; g.add(cone);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 6), PENCIL_M); tip.rotation.x = Math.PI; tip.position.y = 0.035; g.add(tip);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

// A pencil line through points with a little hand wobble.
export function line(points, r = 0.08, seed = 1, wob = 0.06, mat = PENCIL_M) {
  const q = rng(seed), pts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], n = 6;
    for (let k = 0; k < n; k++) { const p = a.clone().lerp(b, k / n); if (k) p.add(V((q() - 0.5) * wob, (q() - 0.5) * wob, (q() - 0.5) * wob)); pts.push(p); }
  }
  pts.push(points[points.length - 1]);
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, r, 6), mat); m.castShadow = true; return m;
}
const ring = (rad, y, seed, wob = 0.12, n = 22) => { const q = rng(seed); return Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * Math.PI * 2; return V(Math.cos(a) * (rad + (q() - 0.5) * wob), y + (q() - 0.5) * wob, Math.sin(a) * (rad + (q() - 0.5) * wob)); }); };

// Stick figure (the boyfriend), 4.8 tall: pivots hips (root), chest, head, armL/R (at the shoulders), legL/R (at the hips).
// Faces +Z at rotation 0 like the R6 cast. A drawn smile.
export function stickFigure() {
  const root = new THREE.Group(), hips = new THREE.Group(); hips.position.y = 2.2; root.add(hips);
  const chest = new THREE.Group(); hips.add(chest);
  chest.add(line([V(0, 0, 0), V(0.02, 1.2, 0), V(0, 1.9, 0)], 0.09, 3));
  const head = new THREE.Group(); head.position.y = 2.55; chest.add(head);
  const hc = ring(0.62, 0, 4, 0.06, 18).map((p) => V(p.x, p.z, 0)); head.add(line(hc, 0.08, 5, 0.03));
  head.add(line([V(-0.3, -0.12, 0.05), V(0, -0.3, 0.05), V(0.3, -0.12, 0.05)], 0.05, 6, 0.02));
  for (const x of [-0.22, 0.22]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), PENCIL_M); e.position.set(x, 0.15, 0.05); head.add(e); }
  const limb = (len, seed) => { const g = new THREE.Group(); g.add(line([V(0, 0, 0), V(0.02, -len / 2, 0), V(0, -len, 0)], 0.08, seed)); return g; };
  const armL = limb(1.7, 7), armR = limb(1.7, 8); armL.position.set(0, 1.75, 0); armR.position.set(0, 1.75, 0); chest.add(armL, armR);
  const legL = limb(2.2, 9), legR = limb(2.2, 10); hips.add(legL, legR);
  return { root, hips, chest, head, armL, armR, legL, legR };
}
// pose: { walk (distance walked), armL/armR [x, z] (radians), lean, spin (whole body about Z), lift }
export function poseStick(f, p = {}) {
  const w = p.walk !== undefined ? Math.sin(p.walk * 2.4) : 0;
  f.legL.rotation.set(0.55 * w, 0, 0.18); f.legR.rotation.set(-0.55 * w, 0, -0.18);
  f.armL.rotation.set(...(p.armL ? [p.armL[0], 0, p.armL[1]] : [-0.4 * w, 0, 0.35])); f.armR.rotation.set(...(p.armR ? [p.armR[0], 0, p.armR[1]] : [0.4 * w, 0, -0.35]));
  f.chest.rotation.set(p.lean || 0, 0, 0); f.hips.rotation.set(0, 0, p.spin || 0); f.hips.position.y = 2.2 + (p.lift || 0);
}

// The cage Mia draws: wobbly bars round a circle, a wobbly rim at the bottom and the top, and no roof.
export function cage(radius = 5.0, height = 7.6, nBars = 16) {
  const g = new THREE.Group(), bars = [];
  g.add(line(ring(radius, 0.1, 11, 0.25, 26), 0.11, 12, 0.1));
  const top = line(ring(radius, height, 13, 0.3, 26), 0.11, 14, 0.12); g.add(top);
  for (let i = 0; i < nBars; i++) {
    const a = (i / nBars) * Math.PI * 2, q = rng(40 + i), b = new THREE.Group(); b.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    const pts = []; for (let k = 0; k <= 5; k++) pts.push(V((q() - 0.5) * 0.35, (k / 5) * height, (q() - 0.5) * 0.35));
    b.add(line(pts, 0.1, 60 + i, 0.08)); g.add(b); bars.push({ g: b, a });
  }
  return { group: g, bars, top, radius, height };
}

// Ball of yarn: a red sphere wound with scribble lines and a loose end.
export function yarnBall(r = 0.85) {
  const tex = canvasTexture(512, 256, (x, w, h) => {
    x.fillStyle = '#d7263d'; x.fillRect(0, 0, w, h); const q = rng(8);
    for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(${q() > 0.5 ? '255,120,130' : '120,10,25'},.75)`; x.lineWidth = 4 + q() * 4; x.beginPath(); const y0 = q() * h; x.moveTo(0, y0); x.bezierCurveTo(w * 0.3, y0 + (q() - 0.5) * 120, w * 0.7, y0 + (q() - 0.5) * 120, w, y0); x.stroke(); }
  });
  const g = new THREE.Group(), ball = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), std('#ffffff', { map: tex, roughness: 0.9 })); ball.castShadow = true; g.add(ball);
  const tail = line([V(0, -r * 0.6, r * 0.75), V(0.4, -r * 0.95, r * 1.3), V(1.0, -r, r * 1.6), V(1.6, -r * 0.98, r * 1.5)], 0.05, 21, 0.04, std('#d7263d'));
  g.add(tail); return { group: g, ball, r };
}
