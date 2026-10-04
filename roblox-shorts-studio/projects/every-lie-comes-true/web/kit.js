// Every Lie Comes True: sets and props built in code (no pack accessories, so nothing to fit-check beyond the cast).
// World layout (studs): the school is a two-storey block x -22..22, z -10..10, roof at y 16.5. The classroom is its
// upper floor (floor y FY = 8, interior x -12..12, z -8..8) with the window wall on the north side (z = -8); the dragon
// stands outside to the north. The yard, path, track and the crash tree are on the south side (+z).
import * as THREE from 'three';
import { part, canvasTexture, rng, cloud } from '../../../web/lib/world.js';
import { mat, roundedCylinder } from '../../../web/lib/rig.js';
import { packTexture } from '../../../web/lib/robloxPack.js';

export const FY = 8, ROOF = 16.5;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

function plankTexture(base = '#b9844f') {
  const t = canvasTexture(512, 512, (x, w, h) => {
    const r = rng(5); x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = `rgba(${r() > 0.5 ? '90,50,20' : '255,220,170'},${0.08 + r() * 0.08})`; x.fillRect(0, i * 64, w, 64);
      x.fillStyle = 'rgba(60,30,10,.35)'; x.fillRect(0, i * 64, w, 3); x.fillRect(((i * 197) % 400) + 40, i * 64, 3, 64);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- the classroom (upper floor) ----------
// Returns handles: glass (pane), shards [{mesh, v, spin, p0}], chunks (wall bits that blow in), homework (paper),
// teacherDesk (group), desks {Leo, Max, Mia, Skye} positions, chairs.
export function classroom(scene) {
  const g = new THREE.Group(); g.name = 'classroom'; scene.add(g);
  const floorTex = plankTexture(); floorTex.repeat.set(4, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 16), std('#ffffff', { map: floorTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FY + 0.01, 0); floor.receiveShadow = true; g.add(floor);
  const wallM = std('#f3e6c8', { roughness: 0.85 }), trimM = std('#6a8fd6', { roughness: 0.6 });
  // West wall + blackboard, east wall + door, south wall (corridor side) with a clock and posters.
  g.add(box(0.6, 8, 16.6, wallM, -12.3, FY + 4, 0), box(0.6, 8, 16.6, wallM, 12.3, FY + 4, 0), box(25.2, 8, 0.6, wallM, 0, FY + 4, 8.3));
  for (const [w, x, z, ry] of [[16.6, -11.98, 0, Math.PI / 2], [16.6, 11.98, 0, -Math.PI / 2], [25, 0, 7.98, Math.PI]]) {
    const skirt = box(w, 0.6, 0.08, trimM, x, FY + 0.3, z); skirt.rotation.y = ry; g.add(skirt);
  }
  const boardTex = canvasTexture(1536, 640, (x, w, h) => {
    x.fillStyle = '#244a3a'; x.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.05})`; x.fillRect(r() * w, r() * h, 30 + r() * 120, 6); }
    x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '110px "Luckiest Guy"'; x.textAlign = 'center';
    x.fillText('HOMEWORK DUE', w / 2, 230); x.fillText('TODAY!', w / 2, 370);
    x.font = '70px "Luckiest Guy"'; x.fillStyle = 'rgba(255,230,120,.9)'; x.fillText('NO EXCUSES', w / 2, 520);
    x.strokeStyle = 'rgba(255,230,120,.9)'; x.lineWidth = 8; x.beginPath(); x.moveTo(w / 2 - 260, 548); x.lineTo(w / 2 + 260, 548); x.stroke();
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), std('#ffffff', { map: boardTex, roughness: 0.9 }));
  board.rotation.y = Math.PI / 2; board.position.set(-11.95, FY + 4.6, 0); g.add(board);
  const frameM = std('#8a5a32');
  g.add(box(0.2, 0.3, 12.4, frameM, -11.9, FY + 2.0, 0), box(0.2, 0.3, 12.4, frameM, -11.9, FY + 7.2, 0), box(0.4, 0.15, 12, frameM, -11.8, FY + 1.95, 0));
  const door = box(0.12, 6.4, 3.4, std('#c0763a'), 11.95, FY + 3.2, 4.6); g.add(door);
  const clockTex = canvasTexture(256, 256, (x, w) => {
    x.fillStyle = '#fff'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 14; x.strokeStyle = '#223'; x.stroke();
    x.lineWidth = 10; x.beginPath(); x.moveTo(128, 128); x.lineTo(128, 50); x.moveTo(128, 128); x.lineTo(185, 150); x.stroke();
  });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), std('#ffffff', { map: clockTex })); clock.rotation.y = Math.PI; clock.position.set(-4, FY + 6.4, 7.95); g.add(clock);
  for (const [x, col, txt] of [[3, '#ff7a59', 'READ!'], [7.5, '#5ab0ff', 'MATH']]) {
    const pt = canvasTexture(256, 320, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '64px "Luckiest Guy"'; c.textAlign = 'center'; c.fillText(txt, w / 2, h / 2 + 20); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), std('#fff', { map: pt })); p.rotation.y = Math.PI; p.position.set(x, FY + 4.4, 7.95); g.add(p);
  }

  // North wall with the big window: opening x -11..3, y FY+2.5..FY+7. Bits around the opening (x -12..5, y FY+1.4..FY+8)
  // are separate chunks that blow in when the dragon comes through.
  const ox0 = -11, ox1 = 3, oy0 = FY + 2.5, oy1 = FY + 7, z = -8.3;
  g.add(box(25.2 - 17.6 + 0.6, 8, 0.6, wallM, (5 + 12.6) / 2, FY + 4, z));            // x 5..12.6, solid
  g.add(box(0.6, 8, 0.6, wallM, -12.3, FY + 4, z));
  g.add(box(17, 1.4, 0.6, wallM, -3.5, FY + 0.7, z));                                   // below the chunk band
  const chunks = [], r = rng(21);
  const addChunk = (w, h, x, y) => {
    const c = box(w, h, 0.6, wallM, x, y, z); g.add(c);
    chunks.push({ mesh: c, p0: c.position.clone(), v: V((x + 4) * 0.35 + (r() - 0.5) * 3, 3 + r() * 5, 7 + r() * 6), spin: V(r() * 8 - 4, r() * 8 - 4, r() * 8 - 4) });
  };
  for (let x = -12; x < 5; x += 1.7) { addChunk(1.7, 1.1, x + 0.85, FY + 1.95); addChunk(1.7, 1.0, x + 0.85, FY + 7.5); }
  addChunk(1.0, 4.5, -11.5, FY + 4.75); addChunk(2.0, 4.5, 4.0, FY + 4.75);
  // Window frame (mullions) and glass.
  const frameW = std('#ffffff', { roughness: 0.4 });
  const frame = new THREE.Group(); g.add(frame);
  frame.add(box(ox1 - ox0, 0.25, 0.4, frameW, (ox0 + ox1) / 2, oy0, z), box(ox1 - ox0, 0.25, 0.4, frameW, (ox0 + ox1) / 2, oy1, z));
  for (let i = 0; i <= 4; i++) frame.add(box(0.25, oy1 - oy0, 0.4, frameW, ox0 + (i * (ox1 - ox0)) / 4, (oy0 + oy1) / 2, z));
  frame.add(box(ox1 - ox0, 0.4, 0.9, frameW, (ox0 + ox1) / 2, oy0 - 0.1, z + 0.3));   // sill
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#cfe9ff', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.22, metalness: 0, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ox1 - ox0, oy1 - oy0), glassM); glass.position.set((ox0 + ox1) / 2, (oy0 + oy1) / 2, z); glass.renderOrder = 2; g.add(glass);
  const shardM = new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: '#9fd8ff', emissiveIntensity: 0.25 });
  const shards = [];
  for (let i = 0; i < 70; i++) {
    const s = 0.25 + r() * 0.55, geo = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(s, r() * 0.3 * s, 0), V(r() * s, s, 0)]); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, shardM); m.renderOrder = 2; g.add(m);
    const p0 = V(ox0 + r() * (ox1 - ox0), oy0 + r() * (oy1 - oy0), z);
    shards.push({ mesh: m, p0, v: V((p0.x + 4) * 0.4 + (r() - 0.5) * 6, 2 + r() * 6, 8 + r() * 10), spin: V(r() * 14 - 7, r() * 14 - 7, r() * 14 - 7), rest: r() });
  }

  // Desks and chairs; students face west (-x).
  const deskM = std('#d7b07a', { roughness: 0.5 }), legM = std('#5a6478', { roughness: 0.4, metalness: 0.4 });
  const desk = (x, zz) => {
    const d = new THREE.Group(); d.position.set(x, FY, zz);
    d.add(box(2.2, 0.25, 3.0, deskM, 0, 3.1, 0));
    for (const [a, b] of [[-0.9, -1.3], [0.9, -1.3], [-0.9, 1.3], [0.9, 1.3]]) d.add(box(0.18, 3.0, 0.18, legM, a, 1.5, b));
    g.add(d); return d;
  };
  const chair = (x, zz) => {
    const c = new THREE.Group(); c.position.set(x, FY, zz);
    c.add(box(1.9, 0.22, 2.0, std('#3a78d8'), 0, 1.7, 0), box(0.22, 2.0, 2.0, std('#3a78d8'), 1.05, 2.8, 0));
    for (const [a, b] of [[-0.8, -0.85], [0.8, -0.85], [-0.8, 0.85], [0.8, 0.85]]) c.add(box(0.15, 1.6, 0.15, legM, a, 0.8, b));
    g.add(c); return c;
  };
  const SEATS = { Leo: [-3, -4.6], Max: [-3, -0.6], Skye: [-3, 3.4], Mia: [3, -4.6], Extra: [3, -0.6] };
  const desks = {};
  for (const [n, [x, zz]] of Object.entries(SEATS)) { desks[n] = desk(x, zz); chair(x + 2.1, zz); }
  // Books on the other desks, Leo's homework sheet (the one the dragon eats).
  const bookCols = ['#e8505b', '#4aa3df', '#f6c445', '#7bd389'];
  Object.entries(SEATS).forEach(([n, [x, zz]], i) => { if (n !== 'Leo') g.add(box(1.0, 0.25, 1.4, std(bookCols[i % 4]), x - 0.2, FY + 3.35, zz + 0.3)); });
  const hwTex = canvasTexture(256, 340, (x, w, h) => {
    x.fillStyle = '#fbfbf4'; x.fillRect(0, 0, w, h); x.fillStyle = '#d33'; x.font = '40px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('HOMEWORK', w / 2, 52);
    x.strokeStyle = '#9ab8e8'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(16, 90 + i * 27); x.lineTo(w - 16, 90 + i * 27); x.stroke(); }
    x.fillStyle = '#334'; x.font = '30px "Luckiest Guy"'; x.textAlign = 'left'; x.fillText('LEO', 20, 118);
  });
  const homework = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), std('#ffffff', { map: hwTex, side: THREE.DoubleSide, roughness: 0.8 }));
  homework.castShadow = true; homework.rotation.x = -Math.PI / 2; homework.rotation.z = Math.PI / 2; g.add(homework);
  homework.userData.rest = V(SEATS.Leo[0] - 0.3, FY + 3.25, SEATS.Leo[1]);

  // Teacher's desk (front, by the window) with an apple and a mug; it gets eaten.
  const teacherDesk = new THREE.Group(); g.add(teacherDesk);
  teacherDesk.add(box(2.4, 0.3, 4.2, std('#9b5e34', { roughness: 0.45 }), 0, 2.85, 0), box(2.2, 2.7, 0.2, std('#8a5330'), 0, 1.35, -1.9), box(2.2, 2.7, 0.2, std('#8a5330'), 0, 1.35, 1.9), box(0.2, 2.7, 4.0, std('#8a5330'), 0.95, 1.35, 0));
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), std('#e8322b', { roughness: 0.3 })); apple.position.set(-0.3, 3.3, 1.2); apple.castShadow = true; teacherDesk.add(apple);
  const mug = new THREE.Mesh(roundedCylinder(0.25, 0.55, 0.05, 20), std('#ffd23f')); mug.position.set(0.2, 3.28, -1.2); teacherDesk.add(mug);
  teacherDesk.add(box(1.0, 0.35, 1.3, std('#4aa3df'), 0.1, 3.18, 0));
  teacherDesk.userData.rest = V(-8.2, FY, -4.6);
  teacherDesk.position.copy(teacherDesk.userData.rest);

  // Ceiling lights hang on thin rods (no ceiling, so the sun reaches in), a soft fill light for the room.
  const lamp = new THREE.PointLight('#fff2dc', 40, 30, 1.4); lamp.position.set(0, FY + 7.5, 1); g.add(lamp);
  return { group: g, glass, frame, shards, chunks, homework, teacherDesk, SEATS };
}

// ---------- the school from outside + the yard ----------
function facadeTexture(w, h, door = false) {
  return canvasTexture(1024, Math.round(1024 * h / w), (x, W, H) => {
    x.fillStyle = '#d9694f'; x.fillRect(0, 0, W, H);
    const r = rng(3); const bh = H / (h / 0.6), bw = W / (w / 1.4);
    for (let j = 0; j * bh < H; j++) for (let i = -1; i * bw < W; i++) {
      x.fillStyle = `rgb(${200 + r() * 30},${90 + r() * 25},${70 + r() * 20})`; x.fillRect(i * bw + (j % 2) * bw / 2 + 2, j * bh + 2, bw - 4, bh - 4);
    }
    const sx = W / w, sy = H / h;
    x.fillStyle = '#e9e1cf'; x.fillRect(0, H - 8.2 * sy, W, 0.5 * sy);                                   // floor band
    for (let i = 0; i < Math.floor(w / 6); i++) {
      const cx = (i + 0.5) * (W / Math.floor(w / 6));
      for (const fy of [2.2, 10.2]) {
        if (door && fy < 5 && Math.abs(cx - W / 2) < 6 * sx) continue;
        x.fillStyle = '#f4f0e6'; x.fillRect(cx - 2.1 * sx, H - (fy + 4.3) * sy, 4.2 * sx, 4.6 * sy);
        x.fillStyle = '#7fb4e0'; x.fillRect(cx - 1.8 * sx, H - (fy + 4.0) * sy, 3.6 * sx, 4.0 * sy);
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(cx - 1.6 * sx, H - (fy + 3.8) * sy, 1.0 * sx, 3.6 * sy);
        x.fillStyle = '#f4f0e6'; x.fillRect(cx - 0.08 * sx, H - (fy + 4.0) * sy, 0.16 * sx, 4.0 * sy);
      }
    }
    if (door) {
      x.fillStyle = '#e9e1cf'; x.fillRect(W / 2 - 4.4 * sx, H - 6.4 * sy, 8.8 * sx, 6.4 * sy);
      x.fillStyle = '#2e5aa8'; x.fillRect(W / 2 - 3.8 * sx, H - 5.8 * sy, 3.6 * sx, 5.8 * sy); x.fillRect(W / 2 + 0.2 * sx, H - 5.8 * sy, 3.6 * sx, 5.8 * sy);
      x.fillStyle = '#9fd0f5'; x.fillRect(W / 2 - 3.4 * sx, H - 5.4 * sy, 2.8 * sx, 2.4 * sy); x.fillRect(W / 2 + 0.6 * sx, H - 5.4 * sy, 2.8 * sx, 2.4 * sy);
      x.fillStyle = '#1d2a4a'; x.fillRect(W / 2 - 7 * sx, H - 8.0 * sy, 14 * sx, 1.4 * sy);
      x.fillStyle = '#ffd23f'; x.font = `${1.1 * sy}px "Luckiest Guy"`; x.textAlign = 'center'; x.fillText('BLOXVILLE SCHOOL', W / 2, H - 6.95 * sy);
    }
  });
}
export function school(scene) {
  const g = new THREE.Group(); g.name = 'school'; scene.add(g);
  const wM = (w, h, door) => std('#ffffff', { map: facadeTexture(w, h, door), roughness: 0.85 });
  const side = std('#c9604a', { roughness: 0.85 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(44, ROOF, 20), [wM(20, ROOF), wM(20, ROOF), side, side, wM(44, ROOF, true), wM(44, ROOF)]);
  shell.position.set(0, ROOF / 2, 0); shell.castShadow = shell.receiveShadow = true; g.add(shell);
  // Roof: flat top with a parapet, an AC unit and a flag.
  g.add(box(44.6, 0.5, 20.6, std('#8d8f99', { roughness: 0.9 }), 0, ROOF + 0.25, 0));
  for (const [w, d, x, z] of [[44.6, 0.6, 0, 10.0], [44.6, 0.6, 0, -10.0], [0.6, 20.6, 22.0, 0], [0.6, 20.6, -22.0, 0]]) g.add(box(w, 1.2, d, std('#e9e1cf'), x, ROOF + 0.9, z));
  g.add(box(4, 2.2, 3, std('#b7bcc6', { metalness: 0.3, roughness: 0.5 }), -15, ROOF + 1.6, -4));
  const pole = box(0.25, 9, 0.25, std('#d9dde3', { metalness: 0.6, roughness: 0.3 }), 19, ROOF + 5, 7); g.add(pole);
  const flagTex = canvasTexture(256, 160, (x, w, h) => { x.fillStyle = '#2e5aa8'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23f'; x.font = '90px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('B', w / 2, 120); });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.9), std('#fff', { map: flagTex, side: THREE.DoubleSide })); flag.position.set(20.5, ROOF + 8.4, 7); g.add(flag);
  // Front steps.
  g.add(box(10, 0.4, 2.4, std('#cfc8b8'), 0, 0.2, 11.2), box(10, 0.4, 1.2, std('#cfc8b8'), 0, 0.5, 10.6));
  return { group: g, flag };
}

// Ground, path, running track, trees, fence, distant houses and clouds. Returns { tree (the crash tree, position) }.
export function yard(scene) {
  const g = new THREE.Group(); g.name = 'yard'; scene.add(g);
  const grassTex = canvasTexture(256, 256, (x, w, h) => {
    x.fillStyle = '#5fae4a'; x.fillRect(0, 0, w, h); const r = rng(4);
    for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '30,90,30' : '150,210,110'},0.2)`; x.fillRect(r() * w, r() * h, 2, 3); }
  });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), std('#ffffff', { map: grassTex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  // Path along the front (z 22..26) and a walk to the doors.
  const pathM = std('#d8d2c4', { roughness: 0.9 });
  g.add(at(box(120, 0.1, 4, pathM), 0, 0.05, 24), at(box(5, 0.1, 12, pathM), 0, 0.05, 16));
  // Running track (z 40..50): red lanes, white lines, start/finish line.
  const trackTex = canvasTexture(1024, 128, (x, w, h) => {
    x.fillStyle = '#c4473a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff';
    for (let i = 0; i <= 4; i++) x.fillRect(0, i * (h - 4) / 4, w, 4);
  });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(160, 0.12, 10), std('#ffffff', { map: trackTex, roughness: 0.85 })), 0, 0.06, 45));
  g.children[g.children.length - 1].receiveShadow = true;
  g.add(at(box(0.5, 0.13, 10, std('#ffffff')), -30, 0.07, 45));
  const ftex = canvasTexture(64, 64, (x) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#fff'; x.fillRect(i * 16, j * 16, 16, 16); } });
  ftex.wrapT = THREE.RepeatWrapping; ftex.repeat.set(1, 10);
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 10), std('#fff', { map: ftex })), 60, 0.07, 45));
  // Bleachers by the track, a bench and a bike rack by the path.
  for (let i = 0; i < 4; i++) g.add(at(box(24, 0.5, 1.4, std(i % 2 ? '#3a78d8' : '#4b8be8')), -10, 0.6 + i * 0.9, 54 + i * 1.3));
  g.add(at(box(4, 0.3, 1.2, std('#9b5e34')), -14, 1.4, 19), at(box(0.3, 1.4, 1.0, legM()), -15.6, 0.7, 19), at(box(0.3, 1.4, 1.0, legM()), -12.4, 0.7, 19));
  for (let i = 0; i < 5; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 20, Math.PI), std('#9aa3b5', { metalness: 0.6, roughness: 0.3 })); a.position.set(-8 + i * 1.2, 0, 18); a.rotation.y = Math.PI / 2; g.add(a); }
  // Trees: blocky trunks and leaf cubes. The crash tree stands on the path's north edge.
  const tree = blockTree(1); tree.position.set(13, 0, 21.6); g.add(tree);
  for (const [x, z, s] of [[-30, 18, 2], [30, 16, 3], [-48, 30, 4], [46, 34, 5], [-20, 64, 6], [24, 66, 7], [-60, -30, 8], [40, -34, 9], [-12, -48, 10], [16, -60, 11], [60, 0, 12], [-64, 4, 13]]) {
    const t = blockTree(s); t.position.set(x, 0, z); t.scale.setScalar(0.9 + (s % 3) * 0.15); g.add(t);
  }
  // Fence and little houses all round, so every angle has something behind it.
  const houseCols = ['#f2c14e', '#7fb4e0', '#e88b8b', '#9ad18b', '#c9a7f0'];
  const r = rng(17);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, R = 120 + r() * 30, h = new THREE.Group();
    h.add(at(box(14, 9, 12, std(houseCols[i % 5], { roughness: 0.8 })), 0, 4.5, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 6, 4), std('#7a4b3a', { roughness: 0.8 })); roof.position.y = 12; roof.rotation.y = Math.PI / 4; roof.castShadow = true; h.add(roof);
    h.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); h.rotation.y = -a + Math.PI / 2; g.add(h);
  }
  for (let i = 0; i < 9; i++) { const c = cloud(40 + i, 9 + (i % 3) * 3); c.position.set(-160 + i * 42, 60 + (i % 4) * 10, (i % 2 ? -1 : 1) * (150 + (i % 3) * 40)); g.add(c); }
  return { group: g, tree };
}
const legM = () => std('#5a6478', { roughness: 0.4, metalness: 0.4 });

export function blockTree(seed = 1) {
  const g = new THREE.Group(), r = rng(seed * 31 + 7);
  const trunk = box(1.4, 8, 1.4, std('#8a5a32', { roughness: 0.9 }), 0, 4, 0); g.add(trunk);
  const leaf = [std('#3f9a4a', { roughness: 0.8 }), std('#4fb15a', { roughness: 0.8 }), std('#358a40', { roughness: 0.8 })];
  for (let i = 0; i < 7; i++) g.add(box(3.4 + r() * 2, 3 + r() * 1.5, 3.4 + r() * 2, leaf[i % 3], (r() - 0.5) * 3.6, 9 + r() * 3.2, (r() - 0.5) * 3.6));
  g.userData.leaves = g.children.slice(1);
  return g;
}

// ---------- Max's brand-new bike ----------
// Faces +z, wheels on the ground (y 0 at the tyres' bottom). userData: front, rear (wheel groups), bend(k) crumples it.
export function bike() {
  const g = new THREE.Group(), red = std('#e8322b', { roughness: 0.3, metalness: 0.3 }), blk = std('#1c1f26', { roughness: 0.7 }), chrome = std('#dfe4ea', { metalness: 0.9, roughness: 0.2 });
  const wheel = () => {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.14, 12, 40), blk); tyre.rotation.y = Math.PI / 2; tyre.castShadow = true; w.add(tyre);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.05, 8, 40), chrome); rim.rotation.y = Math.PI / 2; w.add(rim);
    for (let i = 0; i < 8; i++) { const s = box(0.04, 1.62, 0.04, chrome); s.rotation.x = (i / 8) * Math.PI; w.add(s); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 14), chrome); hub.rotation.z = Math.PI / 2; w.add(hub);
    return w;
  };
  const front = wheel(), rear = wheel(); front.position.set(0, 1.09, 1.7); rear.position.set(0, 1.09, -1.7); g.add(front, rear);
  const tube = (a, b, rr = 0.1, m = red) => { const d = b.clone().sub(a), c = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, d.length(), 12), m); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); c.castShadow = true; return c; };
  const BB = V(0, 1.0, -0.1), SEAT = V(0, 2.55, -0.75), HEAD = V(0, 2.6, 1.25);
  const frame = new THREE.Group(); g.add(frame);
  frame.add(tube(BB, SEAT), tube(SEAT, HEAD), tube(BB, HEAD, 0.12), tube(BB, V(0, 1.09, -1.7), 0.07), tube(SEAT, V(0, 1.09, -1.7), 0.07), tube(HEAD, V(0, 1.09, 1.7), 0.08, chrome));
  const seat = box(0.45, 0.16, 0.9, blk, 0, 2.72, -0.8); frame.add(seat);
  const bars = new THREE.Group(); bars.position.copy(HEAD);
  bars.add(tube(V(0, 0, 0), V(0, 0.5, -0.15), 0.07, chrome), tube(V(-0.9, 0.5, -0.25), V(0.9, 0.5, -0.25), 0.07, chrome));
  for (const sx of [-1, 1]) bars.add(box(0.2, 0.2, 0.45, blk, sx * 0.85, 0.5, -0.25));
  frame.add(bars);
  const crank = new THREE.Group(); crank.position.copy(BB); frame.add(crank);
  crank.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), chrome)); crank.children[0].rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { const arm = box(0.08, 0.7, 0.12, chrome, s * 0.25, -s * 0.3, 0); crank.add(arm); crank.add(box(0.4, 0.08, 0.3, blk, s * 0.42, -s * 0.62, 0)); }
  // A big gift bow on the handlebars and a "NEW!" tag: it's brand new.
  const bowM = std('#ffd23f', { roughness: 0.4 }), bow = new THREE.Group();
  for (const s of [-1, 1]) { const loop = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 8, 16), bowM); loop.position.x = s * 0.3; loop.scale.set(1, 0.7, 0.6); bow.add(loop); }
  bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), bowM)); bow.position.set(0, 3.25, 1.1); frame.add(bow);
  const tagTex = canvasTexture(256, 128, (x, w, h) => { x.fillStyle = '#ffd23f'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8322b'; x.font = '84px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('NEW!', w / 2, 100); });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), std('#fff', { map: tagTex, side: THREE.DoubleSide })); tag.position.set(0.25, 2.8, 1.45); tag.rotation.y = 0.3; frame.add(tag);
  g.userData = { front, rear, frame, bars, crank, bow, tag, SEAT, HEAD, BB };
  return g;
}
// Spin the wheels/cranks for distance d travelled; crumple k 0..1 (front wheel tacoed, bars twisted, frame bent).
export function setBike(b, d, k = 0) {
  const u = b.userData, a = d / 0.95;
  u.front.rotation.x = a; u.rear.rotation.x = a; u.crank.rotation.x = a * 0.45;
  u.front.scale.set(1, 1 - 0.35 * k, 1 + 0.15 * k); u.front.rotation.z = 0.5 * k; u.front.position.z = 1.7 - 0.5 * k;
  u.bars.rotation.y = 0.9 * k; u.bars.rotation.z = 0.25 * k;
  u.frame.rotation.x = -0.12 * k;
  u.bow.visible = k < 0.5; u.tag.rotation.z = 0.8 * k;
}

// ---------- backpack (worn on the torso) and cash ----------
export function backpack(actor, color = '#2e5aa8') {
  const g = new THREE.Group(), m = std(color, { roughness: 0.7 });
  g.add(box(1.7, 1.9, 0.75, m, 0, 0, 0), box(1.4, 0.8, 0.3, std('#ffd23f', { roughness: 0.7 }), 0, -0.35, -0.5));
  const flap = new THREE.Group(); flap.position.set(0, 0.95, 0); flap.add(box(1.72, 0.25, 0.8, std('#24498a', { roughness: 0.7 }), 0, 0, 0)); g.add(flap);
  for (const s of [-1, 1]) g.add(box(0.2, 1.9, 0.12, std('#1d2a4a'), s * 0.55, 0, 0.42));
  g.position.set(0, 1.0, -0.95); actor.bones.Torso.add(g);
  g.userData = { flap };
  return g;
}
const billTex = () => canvasTexture(256, 128, (x, w, h) => {
  x.fillStyle = '#7fcf7a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2f7a35'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = '#2f7a35'; x.beginPath(); x.arc(w / 2, h / 2, 34, 0, 7); x.fill(); x.fillStyle = '#c9f0c0'; x.font = '56px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('$', w / 2, h / 2 + 20);
  x.fillStyle = '#2f7a35'; x.font = '30px "Luckiest Guy"'; x.fillText('100', 40, 44); x.fillText('100', w - 40, h - 20);
});
// N bills as one instanced mesh; place them with setMatrixAt each frame.
export function cash(n) {
  const geo = new THREE.BoxGeometry(1.0, 0.03, 0.5);
  const m = new THREE.InstancedMesh(geo, std('#ffffff', { map: billTex(), roughness: 0.7 }), n); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  return m;
}
// A banded stack of cash (held, handed over).
export function cashStack() {
  const g = new THREE.Group(), t = billTex();
  g.add(box(1.0, 0.5, 0.5, [std('#7fcf7a'), std('#7fcf7a'), std('#fff', { map: t }), std('#fff', { map: t }), std('#7fcf7a'), std('#7fcf7a')]));
  g.add(box(0.22, 0.52, 0.52, std('#ffd23f')));
  return g;
}

// ---------- lip sync (same scheme as The Super Nose Detective) ----------
const REST_OWN = new Set(['happy', 'laugh', 'shocked', 'scared', 'surprised', 'smug', 'sleeping', 'love', 'evil_grin', 'squeezed', 'crying']);
const MOUTH = { c: 'mouth_closed', s: 'mouth_small', w: 'mouth_wide', o: 'mouth_o', e: 'mouth_e', n: 'neutral' };
export async function makeTalkingFace(actor, exprs) {
  const eyes = {}, mouths = {}, cache = new Map();
  await Promise.all(exprs.map(async (e) => { eyes[e] = (await packTexture(`faces/layers/eyes/${e}.png`)).image; mouths[e] = (await packTexture(`faces/layers/mouth/${e}.png`)).image; }));
  await Promise.all(Object.values(MOUTH).map(async (m) => { mouths[m] = (await packTexture(`faces/layers/mouth/${m}.png`)).image; }));
  return (expr, code) => {
    if (!eyes[expr]) return false;
    const rest = REST_OWN.has(expr) ? expr : 'neutral';
    const m = code === '-' || !MOUTH[code] ? rest : MOUTH[code], key = expr + '|' + m;
    if (!cache.has(key)) cache.set(key, canvasTexture(1024, 1024, (g) => { g.drawImage(eyes[expr], 0, 0, 1024, 1024); g.drawImage(mouths[m], 0, 0, 1024, 1024); }));
    actor.face.material.map = cache.get(key); actor.face.material.needsUpdate = true; return true;
  };
}
