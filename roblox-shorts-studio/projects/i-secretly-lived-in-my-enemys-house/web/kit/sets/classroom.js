// Classroom (Ch1 lunch, Ch2 before the bell, Ch4 lunch). World offset (1200, 0, 0). Local layout (studs):
//   front wall z -16: the whiteboard (students face -z, heading PI); the teacher's desk front right
//   left wall x -20: three big windows (daylight, paper Halloween decorations)
//   right wall x 20: the door (front end); back wall z 16: cubbies, coat hooks, the HALLOWEEN DANCE poster
//   4 x 4 desks: columns c1..c4 at x -13, -5, 3, 11 (c1 by the windows), rows r1..r4 at z -7, -1, 5, 11 (r1 nearest the board)
//   Skye: r2 c1 (by the window). Max: r3 c2 (diagonally behind her, on her right). Same in every chapter.
// Walls and ceiling hide automatically when the camera is outside them.
import { THREE, V, std, glow, box, rbox, cyl, picture, fontText, floorTexture, wallTexture, wallWithHoles,
  autoHideWalls, markMaker, camMaker, practical, setPractical, canvasTexture, rng } from './common_c.js';

export const OFFSET = V(1200, 0, 0);
const H = 13, DESK_TOP = 3.1, SEAT_TOP = 1.7;
export const COLS = [-13, -5, 3, 11], ROWS = [-7, -1, 5, 11];
const CHAIR_DZ = 1.9;                 // the seated root is this far behind (+z) the desk centre

export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_classroom'; group.position.copy(OFFSET); scene.add(group);
  const M = markMaker(OFFSET), C = camMaker(OFFSET);
  const W = (x, y, z) => V(x, y, z).add(OFFSET);
  const PI = Math.PI;

  const wallTex = wallTexture('#dfe9e4'); wallTex.repeat.set(5, 2);
  const wallM = std('#ffffff', { map: wallTex, roughness: 0.9 });
  const dadoM = std('#7fa8b8', { roughness: 0.8 });
  const floorM = std('#ffffff', { map: floorTexture('lino', [5, 4]), roughness: 0.6 });
  const trimM = std('#ffffff', { roughness: 0.5 });
  const deskTopM = std('#d9b483', { roughness: 0.5 }), metalM = std('#5d6670', { roughness: 0.4, metalness: 0.5 });
  const chairM = std('#3f7fc4', { roughness: 0.45 });

  // ---------------------------------------------------------------- shell
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 32), floorM); floor.rotation.x = -PI / 2; floor.receiveShadow = true; group.add(floor);
  const walls = [];
  const addWall = (obj, point, normal, name) => { obj.name = name; group.add(obj); walls.push({ obj, point: W(...point), normal: normal.clone() }); return obj; };
  const front = wallWithHoles(40, H, 0.5, wallM); front.position.set(-20, 0, -16.25); addWall(front, [0, 0, -16], V(0, 0, 1), 'wall_front');
  const back = wallWithHoles(40, H, 0.5, wallM); back.position.set(-20, 0, 16.25); addWall(back, [0, 0, 16], V(0, 0, -1), 'wall_back');
  // left wall (x -20), rotated: local x 0..32 runs z 16 -> -16. Windows at z 6..12, -3..3, -12..-6 => local x 4..10, 13..19, 22..28
  const winHoles = [[4, 10], [13, 19], [22, 28]].map(([a, b]) => ({ x0: a, x1: b, y0: 3.6, y1: 10.4 }));
  const left = wallWithHoles(32, H, 0.5, wallM, winHoles); left.rotation.y = PI / 2; left.position.set(-20.25, 0, 16); addWall(left, [-20, 0, 0], V(1, 0, 0), 'wall_left');
  // right wall (x 20): door at z -13..-9 => local x 25..29
  const right = wallWithHoles(32, H, 0.5, wallM, [{ x0: 25, x1: 29, y0: 0, y1: 8.4 }]); right.rotation.y = PI / 2; right.position.set(20.25, 0, 16); addWall(right, [20, 0, 0], V(-1, 0, 0), 'wall_right');
  const ceil = new THREE.Group(); box(40, 0.4, 32, std('#f4f4ef'), 0, H + 0.2, 0, ceil); ceil.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  addWall(ceil, [0, H, 0], V(0, -1, 0), 'ceiling');
  // dado rail band low on each wall (part of each wall so it hides with it)
  box(40, 2.6, 0.1, dadoM, 20, 1.3, 0.3, front); box(40, 2.6, 0.1, dadoM, 20, 1.3, -0.3, back);
  box(32, 2.6, 0.1, dadoM, 16, 1.3, 0.3, left);  box(32, 2.6, 0.1, dadoM, 16, 1.3, -0.3, right);
  for (const [a, b] of [[4, 10], [13, 19], [22, 28]]) {               // window frames + sills (left wall local)
    box(b - a + 0.6, 0.35, 1.0, trimM, (a + b) / 2, 3.45, 0.35, left); box(b - a + 0.4, 0.3, 0.4, trimM, (a + b) / 2, 10.5, 0.1, left);
    box(0.25, 6.8, 0.4, trimM, a, 7, 0.1, left); box(0.25, 6.8, 0.4, trimM, b, 7, 0.1, left);
    box(0.15, 6.8, 0.2, trimM, (a + b) / 2, 7, 0, left); box(b - a, 0.15, 0.2, trimM, (a + b) / 2, 7, 0, left);
  }
  // Halloween paper cut-outs stuck on the windows (inside face of the left wall)
  const cut = (draw) => { const m = picture(1.6, 1.6, 128, 128, draw, { transparent: true, alphaTest: 0.1 }); m.material.side = THREE.DoubleSide; return m; };
  const pumpkin = (g) => { g.fillStyle = '#ff8a1f'; g.beginPath(); g.ellipse(64, 72, 54, 46, 0, 0, 7); g.fill(); g.fillStyle = '#3a8a2f'; g.fillRect(58, 14, 12, 20); g.fillStyle = '#2a1a0a'; g.beginPath(); g.moveTo(40, 62); g.lineTo(52, 50); g.lineTo(56, 66); g.fill(); g.beginPath(); g.moveTo(88, 62); g.lineTo(76, 50); g.lineTo(72, 66); g.fill(); g.fillRect(40, 84, 48, 8); };
  const bat = (g) => { g.fillStyle = '#1d1d24'; g.beginPath(); g.moveTo(64, 70); g.quadraticCurveTo(30, 30, 4, 60); g.quadraticCurveTo(24, 62, 30, 80); g.quadraticCurveTo(46, 70, 64, 88); g.quadraticCurveTo(82, 70, 98, 80); g.quadraticCurveTo(104, 62, 124, 60); g.quadraticCurveTo(98, 30, 64, 70); g.fill(); };
  [[7, 8.4, pumpkin], [16, 5.0, bat], [16.8, 9.0, pumpkin], [25, 6.0, pumpkin], [26.5, 9.2, bat]].forEach(([x, y, d]) => { const m = cut(d); m.position.set(x, y, 0.32); left.add(m); });
  // outside the windows: sky, trees and a playground fence on a backdrop
  const outTex = (sky0, sky1, g2) => canvasTexture(1024, 384, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, sky0); gr.addColorStop(1, sky1); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(12); g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const x = r() * w, y = 30 + r() * 80; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + k * 26, y + (k % 2) * 8, 22, 0, 7); g.fill(); } }
    g.fillStyle = g2; g.fillRect(0, h * 0.75, w, h);
    g.fillStyle = '#8a8f96'; for (let x = 0; x < w; x += 18) g.fillRect(x, h * 0.62, 4, h * 0.15); g.fillRect(0, h * 0.62, w, 4);
    for (let i = 0; i < 9; i++) { const x = r() * w; g.fillStyle = `hsl(${20 + r() * 25},70%,${40 + r() * 12}%)`; g.beginPath(); g.arc(x, h * 0.5, 40 + r() * 30, 0, 7); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(x - 6, h * 0.55, 12, h * 0.25); }
  });
  const OUT = { lunch: outTex('#6fb6ff', '#d8efff', '#5a9a3e'), morning: outTex('#9fd0ff', '#fff2dc', '#5a9a3e') };
  const outM = new THREE.MeshBasicMaterial({ map: OUT.lunch, fog: false });
  const outP = new THREE.Mesh(new THREE.PlaneGeometry(40, 15), outM); outP.position.set(16, 7, -6); left.add(outP);   // left-wall local: -z is outside

  // ---------------------------------------------------------------- the whiteboard (front wall), clock, teacher's desk
  const boardCanvas = document.createElement('canvas'); boardCanvas.width = 1600; boardCanvas.height = 600;
  const boardTex = new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace = THREE.SRGBColorSpace; boardTex.anisotropy = 8;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(20, 7.5), std('#ffffff', { map: boardTex, roughness: 0.25 }));
  board.position.set(-1, 7.4, -15.9); group.add(board);
  box(20.6, 0.35, 0.3, std('#b8bec6', { metalness: 0.5, roughness: 0.3 }), -1, 11.25, -15.85, group);
  box(20.6, 0.3, 0.8, std('#b8bec6', { metalness: 0.5, roughness: 0.3 }), -1, 3.55, -15.6, group);    // marker tray
  for (const [x, c] of [[-6, '#e8302f'], [-5.4, '#2f7be8'], [-4.8, '#2fbf4f']]) cyl(0.08, 0.08, 0.5, std(c), x, 3.8, -15.5, group).rotation.z = PI / 2;
  function drawBoard(text) {
    const g = boardCanvas.getContext('2d'), w = 1600, h = 600;
    g.fillStyle = '#f7f9fa'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9aa3ad'; g.lineWidth = 14; g.strokeRect(0, 0, w, h);
    const lines = String(text).split('\n');
    lines.forEach((l, i) => fontText(g, l, 70, 100 + i * 105, i === 0 ? 80 : 64, i === 0 ? '#c9302c' : '#1e4f9a', { align: 'left' }));
    boardTex.needsUpdate = true;
  }
  const clock = picture(1.8, 1.8, 256, 256, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = '#222'; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = '#222'; g.fillRect(128 + Math.sin(a) * 96 - 5, 128 - Math.cos(a) * 96 - 5, 10, 10); } });
  clock.position.set(13, 10.5, -15.9); group.add(clock);
  const hourG = new THREE.Group(), minG = new THREE.Group(); hourG.position.set(13, 10.5, -15.85); minG.position.copy(hourG.position); group.add(hourG, minG);
  box(0.1, 0.5, 0.03, std('#222'), 0, 0.25, 0, hourG); box(0.07, 0.72, 0.03, std('#222'), 0, 0.36, 0.01, minG);
  const setClock = (hh, mm) => { minG.rotation.z = -mm / 60 * PI * 2; hourG.rotation.z = -((hh % 12) + mm / 60) / 12 * PI * 2; };
  // teacher's desk (front right) with an apple and a pile of books
  const td = new THREE.Group(); td.position.set(13, 0, -11.5); group.add(td);
  box(6, 0.3, 3, std('#8a5a34', { roughness: 0.5 }), 0, 3.3, 0, td); box(5.8, 3.15, 0.2, std('#7a4f2a'), 0, 1.6, 1.3, td);
  box(0.3, 3.15, 2.8, std('#7a4f2a'), -2.8, 1.6, 0, td); box(0.3, 3.15, 2.8, std('#7a4f2a'), 2.8, 1.6, 0, td);
  const apple = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), std('#d9282a', { roughness: 0.35 })); apple.position.set(-1.8, 3.8, 0.3); apple.castShadow = true; td.add(apple);
  [['#2f7be8', 0], ['#ffcc1f', 0.3], ['#2fbf4f', 0.55]].forEach(([c, y]) => box(1.6, 0.28, 1.1, std(c), 1.5, 3.6 + y, -0.2, td));
  box(2, 4.4, 1.2, std('#5d6670'), 2, 2.2, -2.4, td);          // a filing cabinet behind it

  // ---------------------------------------------------------------- the door (right wall) and the back wall
  box(0.3, 8.2, 3.9, std('#3f7fc4', { roughness: 0.5 }), 20.0, 4.1, -11, group);
  box(0.25, 2.0, 1.2, std('#dff0ff', { roughness: 0.1 }), 19.8, 6.2, -11, group);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), std('#cfcfcf', { metalness: 0.8, roughness: 0.25 })); knob.position.set(19.75, 3.8, -9.6); group.add(knob);
  box(0.4, 0.35, 4.6, trimM, 19.9, 8.35, -11, group);
  // cubbies with backpacks along the back wall (back-wall local: x 0..40 -> world x -20..20, z -0.3 inward is -z world)
  const cub = new THREE.Group(); cub.position.set(20, 0, -1.6); back.add(cub);
  box(24, 4.2, 2.4, std('#c79a62', { roughness: 0.6 }), 0, 2.1, 0, cub);
  const bagColors = ['#e8302f', '#2f7be8', '#ffcc1f', '#9a4fe0', '#2fbf4f', '#ff8a1f', '#ff4fa3', '#30c0c8'];
  for (let i = 0; i < 8; i++) { const x = -10.5 + i * 3; box(2.6, 1.6, 0.2, std('#8a6a44'), x, 2.9, -1.15, cub); rbox(1.6, 1.4, 1.0, 0.3, std(bagColors[i], { roughness: 0.6 }), x, 1.15, -1.0, cub); }
  // posters on the back wall
  const poster = (w, h, draw, x, y) => { const p = picture(w, h, Math.round(w * 64), Math.round(h * 64), draw); p.rotation.y = PI; p.position.set(x, y, -0.32); back.add(p); };
  poster(6, 4, (g, w, h) => { g.fillStyle = '#2a1a3a'; g.fillRect(0, 0, w, h); fontText(g, 'HALLOWEEN', w / 2, h * 0.3, 62, '#ff8a1f', { stroke: '#000', lw: 6 }); fontText(g, 'DANCE', w / 2, h * 0.58, 78, '#ffcc1f', { stroke: '#000', lw: 6 }); fontText(g, 'FRI 31 OCT  🎃', w / 2, h * 0.84, 34, '#ffffff'); }, 10, 8);
  poster(4, 5, (g, w, h) => { g.fillStyle = '#fff6d8'; g.fillRect(0, 0, w, h); fontText(g, 'CLASS RULES', w / 2, 40, 34, '#c9302c'); ['1. Be kind', '2. Listen', '3. No pranks', '4. Try your best'].forEach((t, i) => fontText(g, t, 30, 100 + i * 52, 28, '#1e4f9a', { align: 'left' })); }, 18, 8);
  poster(5, 3.6, (g, w, h) => { g.fillStyle = '#d8f0ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#4f8f3a'; g.beginPath(); g.ellipse(w * 0.45, h * 0.55, w * 0.3, h * 0.28, 0.3, 0, 7); g.fill(); fontText(g, 'OUR WORLD', w / 2, 30, 30, '#1e4f9a'); }, 27, 8);
  // a bookshelf on the right wall, a plant on the windowsill
  const shelf = new THREE.Group(); shelf.position.set(18.6, 0, 6); group.add(shelf);
  box(2.4, 6, 7, std('#c79a62'), 0, 3, 0, shelf);
  const r = rng(30);
  for (const y of [0.8, 2.8, 4.8]) for (let z = -3; z < 3; z += 0.55) box(1.6, 1.2 + r() * 0.5, 0.45, std(`hsl(${r() * 360},55%,50%)`), -0.4, y + 0.7, z + 0.25, shelf);
  const pot = new THREE.Group(); pot.position.set(-19.3, 3.65, -9); group.add(pot);
  cyl(0.5, 0.4, 0.8, std('#c8643b'), 0, 0.4, 0, pot); const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), std('#3f8a3a')); leaf.position.y = 1.2; leaf.castShadow = true; pot.add(leaf);

  // ---------------------------------------------------------------- desks + chairs (4 x 4)
  const desks = {};
  function deskUnit(x, z, colorIdx) {
    const d = new THREE.Group(); d.position.set(x, 0, z); group.add(d);
    box(3.6, 0.22, 2.3, deskTopM, 0, DESK_TOP - 0.11, 0, d);
    box(3.3, 0.35, 0.08, metalM, 0, 2.8, -1.05, d);
    for (const sx of [-1.6, 1.6]) for (const sz of [-1.0, 1.0]) cyl(0.07, 0.07, DESK_TOP - 0.2, metalM, sx, (DESK_TOP - 0.2) / 2, sz, d, 8);
    // chair behind the desk (seated root at z + CHAIR_DZ)
    const c = new THREE.Group(); c.position.set(0, 0, CHAIR_DZ); d.add(c);
    box(1.9, 0.22, 1.7, std(['#3f7fc4', '#e8643b', '#2fa86a', '#e8b42f'][colorIdx % 4], { roughness: 0.45 }), 0, SEAT_TOP - 0.11, 0.15, c);
    box(1.9, 1.5, 0.2, chairM, 0, SEAT_TOP + 1.1, 1.0, c);
    for (const sx of [-0.85, 0.85]) for (const sz of [-0.55, 0.85]) cyl(0.06, 0.06, SEAT_TOP - 0.2, metalM, sx, (SEAT_TOP - 0.2) / 2, sz, c, 8);
    for (const sx of [-0.85, 0.85]) cyl(0.06, 0.06, 1.3, metalM, sx, SEAT_TOP + 0.55, 1.0, c, 8);
    return { group: d, chair: c, top: W(x, DESK_TOP, z) };
  }
  ROWS.forEach((z, ri) => COLS.forEach((x, ci) => { desks[`r${ri + 1}c${ci + 1}`] = deskUnit(x, z, ri + ci); }));
  // desk dressing: pencil cases / books on some desks (not Skye's: Ch4 has nothing on it)
  const deskStuff = new THREE.Group(); group.add(deskStuff);
  for (const [k, c] of [['r1c1', '#ff4fa3'], ['r2c3', '#2f7be8'], ['r3c3', '#ffcc1f'], ['r4c2', '#2fbf4f'], ['r1c3', '#9a4fe0'], ['r4c4', '#e8302f']]) {
    const t = desks[k].top.clone().sub(OFFSET); box(1.4, 0.18, 1.0, std(c), t.x + 0.6, DESK_TOP + 0.09, t.z - 0.2, deskStuff).rotation.y = 0.3;
  }
  // lunch on the extras' desks (Ch1, Ch4): a lunchbox, a sandwich, a juice box; never on Skye's or Max's desk
  const lunch = new THREE.Group(); group.add(lunch);
  for (const [k, c] of [['r1c1', '#2fbf4f'], ['r2c3', '#ff8a1f'], ['r3c3', '#2f7be8'], ['r4c2', '#e8302f'], ['r1c2', '#9a4fe0']]) {
    const t = desks[k].top.clone().sub(OFFSET);
    rbox(1.3, 0.7, 0.9, 0.12, std(c, { roughness: 0.4 }), t.x - 0.7, DESK_TOP + 0.35, t.z + 0.1, lunch);
    const sw = box(0.8, 0.25, 0.8, std('#f3e1b6', { roughness: 0.8 }), t.x + 0.6, DESK_TOP + 0.13, t.z + 0.3, lunch); sw.rotation.y = 0.785;
    box(0.4, 0.7, 0.3, std('#ffd23f'), t.x + 1.25, DESK_TOP + 0.35, t.z - 0.5, lunch);
  }
  // Max's desk: an exercise book with doodles
  const mx = desks.r3c2.top.clone().sub(OFFSET);
  const doodle = picture(1.5, 1.1, 192, 140, (g, w, h) => { g.fillStyle = '#fffef6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8fb5e8'; for (let y = 20; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = '#333'; g.lineWidth = 3; g.beginPath(); g.arc(60, 70, 22, 0, 7); g.stroke(); fontText(g, 'BOO', 130, 70, 30, '#c9302c'); });
  doodle.rotation.x = -PI / 2; doodle.rotation.z = 0.15; doodle.position.set(mx.x - 0.5, DESK_TOP + 0.01, mx.z - 0.1); group.add(doodle);

  // ---------------------------------------------------------------- lights
  const panels = [];
  for (const x of [-10, 0, 10]) for (const z of [-8, 4]) {
    const p = box(4, 0.15, 2, glow('#f4f8ff', 1.2), x, H - 0.1, z, group); p.castShadow = false; panels.push(p);
  }
  const fills = [-8, 8].map((x) => { const L = practical(new THREE.PointLight('#f2f6ff', 0, 40, 1.4), 30); L.position.set(x, H - 1.5, 0); group.add(L); return L; });
  const windowSun = practical(new THREE.SpotLight('#fff1d6', 0, 90, 0.55, 0.6, 1.0), 520);
  windowSun.position.set(-45, 26, -8); windowSun.target.position.set(-6, 0, 2); windowSun.castShadow = true; windowSun.shadow.mapSize.set(1024, 1024); windowSun.shadow.bias = -0.0004;
  group.add(windowSun, windowSun.target);
  const lights = { fillL: fills[0], fillR: fills[1], windowSun };

  autoHideWalls(scene, walls);
  group.userData.walls = walls.map((w) => w.obj);

  // ---------------------------------------------------------------- marks
  const sit = (key) => { const t = desks[key].top.clone().sub(OFFSET); return M(t.x, SEAT_TOP - 1.5, t.z + CHAIR_DZ, PI, { sit: true, seatTop: SEAT_TOP, desk: key }); };
  const marks = {};
  ROWS.forEach((z, ri) => COLS.forEach((x, ci) => { marks[`desk_r${ri + 1}c${ci + 1}`] = sit(`r${ri + 1}c${ci + 1}`); }));
  Object.assign(marks, {
    desk_skye: { ...sit('r2c1'), note: 'Skye: row 2, by the window' },
    desk_max: { ...sit('r3c2'), note: 'Max: row 3, diagonally behind Skye on her right' },
    desk_extra_1: sit('r1c1'), desk_extra_2: sit('r2c3'), desk_extra_3: sit('r3c3'), desk_extra_4: sit('r4c2'),
    skye_desk_side: M(-9.4, 0, -0.4, -PI / 2, { note: 'standing in the aisle beside Skye\'s desk, facing her (Max in Ch1 and Ch4)' }),
    skye_desk_front: M(-10.6, 0, -3.2, -PI * 0.8, { note: 'standing at the front corner of Skye\'s desk, facing her' }),
    max_desk_side: M(-8.4, 0, 5.4, PI / 2, { note: 'standing at the left of Max\'s desk leaning on it, facing him (Skye in Ch2)' }),
    max_desk_front: M(-5, 0, 2.6, 0, { note: 'standing in front of Max\'s desk facing him' }),
    aisle_mid: M(-9, 0, 2.2, PI, { note: 'the aisle between Skye\'s and Max\'s columns' }),
    door_inside: M(17.5, 0, -11, -PI / 2, { note: 'just inside the door, facing into the room' }),
    board: M(-1, 0, -13.5, 0, { note: 'at the whiteboard facing the class' }),
    teacher_desk: M(13, 0, -14.2, 0, { note: 'behind the teacher\'s desk' }),
  });
  // aliases asked for by the chapters
  Object.assign(marks, { aisle_skye: marks.skye_desk_side, desk_skye_aisle: marks.skye_desk_side, desk_max_side: marks.max_desk_side, door: marks.door_inside });

  // ---------------------------------------------------------------- cams
  const cams = {
    wide_front: C([15, 9.5, -14], [-4, 2.8, 4], 52, { note: 'from the board corner over the whole class (faces)' }),
    wide_back: C([8, 9, 15], [-4, 4, -8], 50, { note: 'from the back toward the board' }),
    skye_max_diag: C([-16.5, 6.2, -10], [-8.5, 3.8, 3.5], 42, { note: 'Skye (front) and Max (diagonal behind) seated, from the front window corner' }),
    two_shot_desk: C([-5.5, 5.3, -8], [-11.2, 4.3, 0.2], 40, { note: 'Skye seated + whoever stands at skye_desk_side, from the front right' }),
    ots_max_on_skye: C([-7.2, 6.1, 0.6], [-13, 4.2, 0.9], 38, { note: 'over the shoulder of skye_desk_side onto Skye' }),
    ots_skye_on_max: C([-15.4, 5.7, 4.6], [-9.4, 5.0, -0.4], 40, { note: 'over seated Skye\'s shoulder onto skye_desk_side' }),
    cu_skye_desk: C([-11.3, 4.5, -3.6], [-13, 4.25, 0.9], 30, { note: 'close-up on Skye at her desk' }),
    cu_max_desk: C([-3.6, 4.5, 2.4], [-5, 4.25, 6.9], 30, { note: 'close-up on Max at his desk' }),
    cu_side_stand: C([-12.4, 5.3, -1.3], [-9.4, 5.0, -0.4], 32, { note: 'close-up on whoever stands at skye_desk_side' }),
    max_desk_two_shot: C([-2.5, 5.3, -1.8], [-6.8, 4.4, 6.2], 40, { note: 'Max seated and Skye leaning at max_desk_side (Ch2)' }),
    ots_skye_on_max_desk: C([-10.6, 6.3, 4.4], [-5, 4.2, 6.9], 38, { note: 'over the shoulder of max_desk_side onto seated Max' }),
    lunchbox_top: C([-13, 8.6, -3.4], [-13, DESK_TOP, -0.7], 34, { note: 'top-down onto Skye\'s desk (lunchbox, spider)' }),
    window_in: C([-18.8, 5.0, -5.5], [-11, 4.2, 2.5], 44, { note: 'from the window corner looking along Skye\'s column' }),
    board_reverse: C([-1, 6.5, -14.5], [-5, 3.5, 6], 48, { note: 'from the board over the rows (all faces)' }),
    two_shot_close: C([-8.4, 5.3, -5.6], [-11.2, 4.5, 0.2], 34, { note: 'tighter two-shot: Skye seated + skye_desk_side, board side' }),
    mcu_skye: C([-11.0, 4.6, -4.6], [-13, 4.3, 0.9], 34, { note: 'MCU Skye at her desk (board side)' }),
    mcu_max: C([-3.0, 4.6, 1.3], [-5, 4.3, 6.9], 34, { note: 'MCU Max at his desk (board side)' }),
    mcu_max_stand: C([-12.6, 5.4, -3.6], [-9.4, 5.1, -0.4], 34, { note: 'MCU on whoever stands at skye_desk_side (board side of the line)' }),
    end_front: C([-14.5, 5.0, -4.2], [-8.0, 4.3, 4.2], 40, { note: 'Skye MCU fg left, Max at desk_max bg right' }),
  };
  Object.assign(cams, { classroom_wide: cams.wide_front, cu_skye: cams.cu_skye_desk, cu_max: cams.cu_max_desk, ots_skye_to_max: cams.ots_skye_on_max,
    ots_max_to_skye: cams.ots_max_on_skye, desk_skye_insert: cams.lunchbox_top, two_shot_desks: cams.skye_max_diag });

  // ---------------------------------------------------------------- state
  const state = {};
  const TIME = { lunch: { clock: [12, 15], out: 'lunch', board: 'WEDNESDAY\nSpelling: friends, haunted, pumpkin\nHomework: p. 31' },
    morning: { clock: [8, 25], out: 'morning', board: 'TUESDAY\nGood morning, class!\nSpelling test Friday' } };
  function setState(s = {}) {
    if (s.chapter !== undefined) {
      const ch = { 1: { time: 'lunch', board: 'MONDAY\nSpelling: friends, haunted, pumpkin\nHomework: p. 31' }, 2: { time: 'morning' },
        4: { time: 'lunch', board: 'WEDNESDAY\nSpelling: friends, haunted, pumpkin\nDANCE tickets on sale!' } }[s.chapter];
      if (!ch) return;
      Object.assign(state, ch, { chapter: s.chapter });
    }
    for (const k of Object.keys(s)) if (k !== 'chapter') state[k] = s[k];
    const T = TIME[state.time || 'lunch'];
    setClock(...(state.clock || T.clock));
    outM.map = OUT[T.out]; outM.needsUpdate = true;
    const b = state.board ?? T.board; if (b !== state._board) { drawBoard(b); state._board = b; }
    const lv = state.practicals || {};
    lunch.visible = state.lunch ?? state.time === 'lunch'; deskStuff.visible = !lunch.visible;
    setPractical(fills[0], lv.fillL ?? 1); setPractical(fills[1], lv.fillR ?? 1); setPractical(windowSun, lv.windowSun ?? (state.time === 'morning' ? 0.7 : 1));
    for (const p of panels) p.material.emissiveIntensity = 1.2 * (lv.fillL ?? 1);
    if (state.walls) for (const w of walls) { const v = state.walls[w.obj.name]; w.forced = v === undefined || v === 'auto' ? undefined : v; }
  }
  setState({ time: 'lunch' });

  const anchors = { deskTop: (key) => desks[key].top.clone(), skyeDeskTop: desks.r2c1.top.clone(), maxDeskTop: desks.r3c2.top.clone(),
    desk_skye_top: desks.r2c1.top.clone(), desk_max_top: desks.r3c2.top.clone(),
    // the backpack hangs off the back of Skye's chair: this is the top of the backrest (hang point), backpack facing -z
    skye_chair_hang: desks.r2c1.top.clone().add(V(0, SEAT_TOP + 1.85 - DESK_TOP, CHAIR_DZ + 1.15)) };
  marks.chair_skye_back = { pos: anchors.skye_chair_hang.clone(), heading: 0, note: 'top of Skye\'s chair backrest (backpack hang point), facing away from her desk' };
  marks.desk_skye_top = M(COLS[0], DESK_TOP, ROWS[1], PI, { note: 'top of Skye\'s desk (y = surface)' });
  return { id: 'classroom', group, marks, cams, lights, setState, state, anchors, walls: walls.map((w) => w.obj) };
}
