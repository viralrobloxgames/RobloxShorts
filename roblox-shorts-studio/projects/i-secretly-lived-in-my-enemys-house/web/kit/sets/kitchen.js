// Kitchen (Ch2, Ch3, Ch11). World offset (900, 0, 0). Local layout (studs; +z is the open camera side):
//   back wall z -12: fridge (x -11, Lily's magnet letters on the door), counter run x -8.5..+6 with the stove (x -2)
//                    and the sink under a window (x +3)
//   left wall x -16: the slatted pantry (doors x -16, z -3..+2), a character can stand inside and peek through the slats
//   right wall x 16: the stairs coming down from the hallway (top at the back, bottom step at z +2); the back door
//                    (z +4..+8) with a window in its top half (moonlight at night)
//   middle: the island (x -5.5..5.5, z -2.1..1.8, top y 3.6), four stools on its back (stove) side facing +z
//           (kids face the camera, Dad at the stove behind them); a character hides crouched on its front side.
// Walls and ceiling hide automatically when the camera is outside them.
import { THREE, V, std, glow, box, rbox, cyl, picture, fontText, floorTexture, wallTexture, wallWithHoles,
  autoHideWalls, onSceneRender, makeRouter, alongRoute, routeLength, proxyLight, proxyLevel, markMaker, camMaker, practical, setPractical, canvasTexture, rng } from './common_c.js';

export const OFFSET = V(900, 0, 0);
const H = 12;                         // ceiling
const ISLAND_TOP = 3.6, STOOL_TOP = 2.2, COUNTER_TOP = 3.4;
// stairs: 16 steps, rise 0.75, run 0.8; step i (1..16) top at y 0.75 i over z 2.0-0.8 i .. 2.0-0.8 (i-1); x 12..16
const STEP_RISE = 0.75, STEP_RUN = 0.8, STAIR_Z0 = 2.0, STAIR_X = 13.5, STAIR_W = 5;   // treads x 11..16
export function stairFootY(z) { const i = Math.ceil((STAIR_Z0 - z) / STEP_RUN); return Math.max(0, Math.min(16, i)) * STEP_RISE; }

const LETTER_COLORS = ['#e8302f', '#ffcc1f', '#2f7be8', '#2fbf4f', '#ff8a1f', '#9a4fe0', '#ff4fa3'];

export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_kitchen'; group.position.copy(OFFSET); scene.add(group);
  const M = markMaker(OFFSET), C = camMaker(OFFSET);
  const W = (x, y, z) => V(x, y, z).add(OFFSET);

  // ---------------------------------------------------------------- materials
  const wallTex = wallTexture('#f3e7c9'); wallTex.repeat.set(4, 2);
  const wallM = std('#ffffff', { map: wallTex, roughness: 0.85 });
  const tileM = std('#ffffff', { map: floorTexture('tile', [6, 5]), roughness: 0.55 });
  const cabM = std('#6f9a8d', { roughness: 0.55 });        // sage cabinets
  const cabDark = std('#557a6f', { roughness: 0.55 });
  const topM = std('#efeae2', { roughness: 0.6 });           // light stone counter top
  const woodM = std('#a8723f', { roughness: 0.6 });
  const woodDark = std('#7a4f2a', { roughness: 0.65 });
  const steelM = std('#c9ced4', { roughness: 0.3, metalness: 0.6 });
  const blackM = std('#26262a', { roughness: 0.4 });
  const handleM = std('#d8d8d8', { roughness: 0.25, metalness: 0.8 });
  const trimM = std('#ffffff', { roughness: 0.5 });

  // ---------------------------------------------------------------- floor, walls, ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 24), tileM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
  const walls = [];
  const addWall = (obj, point, normal, name) => { obj.name = name; group.add(obj); walls.push({ obj, point: W(...point), normal: normal.clone() }); return obj; };
  // back wall (z -12), window over the sink x 0.8..5.2, y 5..9
  const back = wallWithHoles(32, H, 0.5, wallM, [{ x0: 16.8, x1: 21.2, y0: 5, y1: 9 }]); back.position.set(-16, 0, -12.25);
  addWall(back, [0, 0, -12], V(0, 0, 1), 'wall_back');
  // left wall (x -16), pantry opening z -3..+2, y 0..8
  const left = wallWithHoles(24, H, 0.5, wallM, [{ x0: 10, x1: 15, y0: 0, y1: 8 }]); left.rotation.y = Math.PI / 2; left.position.set(-16.25, 0, 12);
  addWall(left, [-16, 0, 0], V(1, 0, 0), 'wall_left');
  // right wall (x 16), back door z 4..8, y 0..8.2
  const right = wallWithHoles(24, H, 0.5, wallM, [{ x0: 4, x1: 8, y0: 0, y1: 8.2 }]); right.rotation.y = Math.PI / 2; right.position.set(16.25, 0, 12);
  addWall(right, [16, 0, 0], V(-1, 0, 0), 'wall_right');
  // front wall (z 12): a doorway to the living room (x -4..0) and a window (x 6..11); only seen from cameras looking +z
  const front = wallWithHoles(32, H, 0.5, wallM, [{ x0: 12, x1: 16.5, y0: 0, y1: 8.4 }, { x0: 22, x1: 27, y0: 4.5, y1: 9 }]); front.position.set(-16, 0, 12.25);
  addWall(front, [0, 0, 12], V(0, 0, -1), 'wall_front');
  // ceiling with the stairwell hole (x 12..16, z -12..-2)
  const ceil = new THREE.Group();
  box(27, 0.4, 24, std('#f7f1e3'), -2.5, H + 0.2, 0, ceil);
  box(5, 0.4, 14, std('#f7f1e3'), 13.5, H + 0.2, 5, ceil);
  ceil.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  addWall(ceil, [0, H, 0], V(0, -1, 0), 'ceiling');
  // skirting boards (part of their walls)
  box(32, 0.6, 0.15, trimM, 0, 0.3, -11.92, back);
  // a dark upstairs volume above the stairwell so the hole never shows sky
  const up = new THREE.Group(); group.add(up);
  box(6, 0.3, 1.6, std('#5a4636'), 13.5, H - 0.15, -11.6, up);            // upstairs landing (beyond the top tread, z < -10.8)
  box(6, 7, 0.3, std('#3b2f2a'), 13.5, H + 3.5, -12.3, up);
  box(0.3, 7, 11, std('#3b2f2a'), 10.7, H + 3.5, -7, up);
  box(0.3, 7, 11, std('#3b2f2a'), 16.4, H + 3.5, -7, up);
  box(6, 0.3, 11, std('#2a221e'), 13.5, H + 7, -7, up);
  const upLight = practical(new THREE.PointLight('#ffd7a0', 0, 14, 2), 6); upLight.position.set(14, H + 5, -8); up.add(upLight);

  // ---------------------------------------------------------------- outside, seen through windows / the back door
  const outside = {};
  const outsideTex = (top, bottom, extra) => canvasTexture(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (extra) extra(g, w, h);
  });
  const garden = (dark) => (g, w, h) => {
    const r = rng(4); g.fillStyle = dark ? '#0b1410' : '#4f8f3a'; g.fillRect(0, h * 0.72, w, h);
    g.fillStyle = dark ? '#121b17' : '#8a6a44'; for (let x = 0; x < w; x += 22) g.fillRect(x, h * 0.6, 16, h * 0.14);   // fence
    g.fillStyle = dark ? '#0e1a14' : '#3f7a33'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(r() * w, h * 0.55, 30 + r() * 30, 0, 7); g.fill(); }
  };
  const OUT = {
    night: outsideTex('#08122a', '#1d2f55', (g, w, h) => { g.fillStyle = '#eef3ff'; g.beginPath(); g.arc(w * 0.72, h * 0.25, 18, 0, 7); g.fill(); const r = rng(8); g.fillStyle = '#cfe0ff'; for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h * 0.5, 2, 2); garden(true)(g, w, h); }),
    predawn: outsideTex('#1a2550', '#5a5f93', garden(true)),
    morning: outsideTex('#8ccaff', '#e9f6ff', garden(false)),
    day: outsideTex('#7cc0ff', '#dff1ff', garden(false)),
  };
  const outM = new THREE.MeshBasicMaterial({ map: OUT.night, fog: false });
  const outPlane = (w, h, x, y, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), outM); p.userData.noCamBlock = true; p.position.set(x, y, z); p.rotation.y = ry; group.add(p); return p; };
  outPlane(14, 9, 3, 7, -15, 0);                  // behind the sink window
  outPlane(16, 12, 22, 5, 6, -Math.PI / 2);       // behind the back door
  front.add(outPlane(14, 9, 24.5, 7, 3.75, Math.PI));   // behind the front window (hides with the front wall)
  // window frames + glass + sill
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#dfeeff', transmission: 0, transparent: true, opacity: 0.12, roughness: 0.05 });
  function windowFrame(parent, w, h, x, y, z, ry = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    box(w + 0.5, 0.3, 0.7, trimM, 0, -h / 2 - 0.1, 0.1, g); box(w + 0.3, 0.25, 0.4, trimM, 0, h / 2 + 0.1, 0, g);
    box(0.25, h, 0.4, trimM, -w / 2 - 0.1, 0, 0, g); box(0.25, h, 0.4, trimM, w / 2 + 0.1, 0, 0, g);
    box(0.15, h, 0.2, trimM, 0, 0, 0, g); box(w, 0.15, 0.2, trimM, 0, 0, 0, g);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassM); g.add(gl);
    return g;
  }
  windowFrame(back, 4.4, 4, 19, 7, 0);                 // (back wall local coords: x from -16)
  windowFrame(front, 5, 4.5, 24.5, 6.75, 0);

  // ---------------------------------------------------------------- back counter run, stove, sink
  const kit = new THREE.Group(); group.add(kit);
  const counterRun = (x0, x1) => {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    box(w, COUNTER_TOP - 0.25 - 0.4, 2.3, cabM, cx, 0.4 + (COUNTER_TOP - 0.65) / 2, -10.75, kit);
    box(w, 0.4, 2.0, std('#3f5a52'), cx, 0.2, -10.95, kit);                     // toe kick
    box(w + 0.1, 0.25, 2.6, topM, cx, COUNTER_TOP - 0.125, -10.7, kit);
    for (let x = x0 + 0.1; x < x1 - 0.5; x += 2.1) {                           // door fronts + handles
      const dw = Math.min(2.0, x1 - 0.1 - x);
      box(dw - 0.12, COUNTER_TOP - 1.25, 0.08, cabDark, x + dw / 2, 0.45 + (COUNTER_TOP - 1.25) / 2 + 0.05, -9.57, kit);
      box(dw - 0.12, 0.55, 0.08, cabDark, x + dw / 2, COUNTER_TOP - 0.62, -9.57, kit);
      box(0.6, 0.1, 0.12, handleM, x + dw / 2, COUNTER_TOP - 0.62, -9.48, kit);
    }
  };
  counterRun(-8.6, -3.7); counterRun(-0.3, 6.2);
  // stove x -3.7..-0.3
  box(3.4, COUNTER_TOP - 0.2, 2.4, steelM, -2, (COUNTER_TOP - 0.2) / 2, -10.75, kit);
  box(2.8, 1.6, 0.08, blackM, -2, 1.4, -9.52, kit);                            // oven glass
  box(2.2, 0.12, 0.15, handleM, -2, 2.45, -9.45, kit);
  box(3.4, 0.2, 2.5, blackM, -2, COUNTER_TOP - 0.1, -10.7, kit);                // cooktop
  for (const [x, z] of [[-2.85, -10.1], [-1.15, -10.1], [-2.85, -11.3], [-1.15, -11.3]]) cyl(0.55, 0.55, 0.06, std('#3a3a3e', { roughness: 0.3 }), x, COUNTER_TOP + 0.03, z, kit);
  for (let i = 0; i < 4; i++) cyl(0.12, 0.12, 0.15, handleM, -3.2 + i * 0.4 + 0.3, COUNTER_TOP - 0.4, -9.45, kit).rotation.x = Math.PI / 2;
  box(3.8, 0.9, 2.2, steelM, -2, 8.6, -10.9, kit);                              // hood
  box(1.6, 3.3, 1.2, steelM, -2, 10.7, -11.4, kit);
  // frying pan on the front-left burner
  const pan = new THREE.Group(); pan.position.set(-2.85, COUNTER_TOP + 0.08, -10.1); kit.add(pan);
  cyl(0.6, 0.5, 0.22, blackM, 0, 0.11, 0, pan); box(1.2, 0.1, 0.18, blackM, 0, 0.18, 0.95, pan).rotation.y = Math.PI / 2; pan.children[1].position.set(0, 0.18, 0.95);
  // sink under the window
  box(2.6, 0.1, 1.6, steelM, 3, COUNTER_TOP + 0.01, -10.6, kit);
  box(2.2, 0.12, 1.2, std('#9aa1a8', { roughness: 0.25, metalness: 0.5 }), 3, COUNTER_TOP + 0.05, -10.6, kit);
  const tap = new THREE.Group(); tap.position.set(3, COUNTER_TOP, -11.6); kit.add(tap);
  cyl(0.1, 0.12, 1.4, handleM, 0, 0.7, 0, tap); box(0.2, 0.15, 0.8, handleM, 0, 1.4, 0.35, tap);
  // upper cabinets
  for (const [x0, x1] of [[-8.6, -4.6], [5.4, 6.2]]) { const w = x1 - x0; box(w, 3.2, 1.4, cabM, (x0 + x1) / 2, 8.4, -11.3, kit); }
  for (const x of [-7.6, -5.6]) { box(1.9, 3.0, 0.08, cabDark, x, 8.4, -10.57, kit); box(0.1, 0.6, 0.12, handleM, x + 0.7, 7.3, -10.5, kit); }
  // things on the counters: a toaster, a fruit bowl, a utensil pot with a whisk, a kettle
  const toast = rbox(1.2, 0.9, 0.8, 0.15, std('#e8443b', { roughness: 0.35 }), 4.9, COUNTER_TOP + 0.45, -10.9, kit);
  const bowl = cyl(0.8, 0.45, 0.45, std('#f2f2ee'), -4.6, COUNTER_TOP + 0.23, -10.7, kit);
  for (const [dx, dz, c] of [[-0.25, 0, '#ff9a1f'], [0.25, 0.1, '#ff9a1f'], [0, -0.25, '#e83030'], [0.05, 0.25, '#7ac943']]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), std(c, { roughness: 0.45 })); s.position.set(-4.6 + dx, COUNTER_TOP + 0.6, -10.7 + dz); s.castShadow = true; kit.add(s); }
  cyl(0.35, 0.3, 0.8, std('#4b6fa8'), 0.6, COUNTER_TOP + 0.4, -11.2, kit);
  for (const a of [-0.3, 0.1, 0.4]) { const u = cyl(0.04, 0.04, 1.3, woodM, 0.6 + a * 0.3, COUNTER_TOP + 0.9, -11.2, kit); u.rotation.z = a * 0.4; }
  cyl(0.45, 0.55, 0.9, std('#2f8f83', { roughness: 0.35 }), -7.6, COUNTER_TOP + 0.45, -11.0, kit);
  // a calendar and a clock on the back wall, a kid's drawing
  const clock = picture(1.4, 1.4, 256, 256, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = '#333'; g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = '#333'; g.fillRect(128 + Math.sin(a) * 96 - 4, 128 - Math.cos(a) * 96 - 4, 8, 8); } });
  clock.position.set(9.5, 9, -11.95); group.add(clock);
  const clockHands = new THREE.Group(); clockHands.position.set(9.5, 9, -11.9); group.add(clockHands);
  const hourH = box(0.08, 0.38, 0.03, blackM, 0, 0.19, 0, new THREE.Group()); const minH = box(0.06, 0.55, 0.03, blackM, 0, 0.27, 0, new THREE.Group());
  const hourG = hourH.parent, minG = minH.parent; clockHands.add(hourG, minG);
  const setClock = (hh, mm) => { minG.rotation.z = -mm / 60 * Math.PI * 2; hourG.rotation.z = -((hh % 12) + mm / 60) / 12 * Math.PI * 2; };
  const cal = picture(1.6, 2.2, 256, 352, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff7a1a'; g.fillRect(0, 0, w, 90); fontText(g, 'OCTOBER', 128, 48, 46, '#fff'); g.strokeStyle = '#ccc'; for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) g.strokeRect(10 + j * 34, 100 + i * 40, 34, 40); fontText(g, '🎃', 10 + 6 * 34 + 17, 100 + 4 * 40 + 20, 26, '#000'); });
  cal.position.set(-14, 6.5, -11.95); group.add(cal);
  const drawing = picture(1.5, 1.1, 256, 188, (g, w, h) => { g.fillStyle = '#fffbe8'; g.fillRect(0, 0, w, h); g.lineWidth = 6; g.strokeStyle = '#e83030'; g.beginPath(); g.arc(70, 90, 30, 0, 7); g.stroke(); g.strokeStyle = '#2f7be8'; g.strokeRect(130, 60, 80, 70); g.fillStyle = '#ffcc1f'; g.beginPath(); g.arc(220, 30, 22, 0, 7); g.fill(); });
  drawing.position.set(-11, 2.4, -8.93); group.add(drawing);      // on the fridge side? moved below to fridge door group

  // ---------------------------------------------------------------- fridge (x -13..-9, z -12..-9, h 8.6) with the door hinged at x -13
  const FR = { x0: -13, x1: -9, z0: -12, z1: -9.1, h: 8.6 };
  const fridge = new THREE.Group(); group.add(fridge);
  const frM = std('#e9edf0', { roughness: 0.3, metalness: 0.15 });
  const frIn = std('#f6f8fa', { roughness: 0.5, emissive: '#dfefff', emissiveIntensity: 0 });
  // hollow body: back, sides, top, bottom
  box(4, FR.h, 0.2, frM, -11, FR.h / 2, -11.9, fridge);
  box(0.2, FR.h, 2.9, frM, FR.x0 + 0.1, FR.h / 2, -10.55, fridge); box(0.2, FR.h, 2.9, frM, FR.x1 - 0.1, FR.h / 2, -10.55, fridge);
  box(4, 0.25, 2.9, frM, -11, FR.h - 0.12, -10.55, fridge); box(4, 0.6, 2.9, frM, -11, 0.3, -10.55, fridge);
  // inside: liner, shelves, food
  box(3.5, FR.h - 1, 0.05, frIn, -11, FR.h / 2, -11.75, fridge);
  for (const y of [2.6, 4.4, 6.2]) box(3.5, 0.08, 2.4, std('#e8f2ff', { transparent: true, opacity: 0.6, roughness: 0.1 }), -11, y, -10.6, fridge).castShadow = false;
  box(3.6, 0.15, 2.6, frM, -11, 7.4, -10.6, fridge);                           // freezer divider
  const food = [[-12, 2.65, -10.8, 0.9, 1.4, 0.9, '#ffffff'], [-10.6, 2.65, -10.9, 0.7, 1.0, 0.7, '#ffcc1f'], [-9.9, 2.65, -10.5, 0.6, 0.6, 0.6, '#e8302f'],
    [-12.1, 4.45, -10.7, 1.0, 0.6, 0.8, '#f2a07a'], [-11.0, 4.45, -10.9, 0.8, 1.1, 0.5, '#2f7be8'], [-10.1, 4.45, -10.5, 0.7, 0.5, 0.7, '#7ac943'],
    [-11.6, 6.25, -10.8, 1.4, 0.7, 0.9, '#f5e6c8'], [-10.2, 6.25, -10.6, 0.7, 0.9, 0.7, '#ff8a1f'], [-11.9, 0.6, -10.6, 1.2, 1.0, 1.2, '#b9e08a']];
  for (const [x, y, z, w, h, d, c] of food) box(w, h, d, std(c, { roughness: 0.5 }), x, y + h / 2, z, fridge);
  // milk carton
  box(0.7, 1.4, 0.7, std('#ffffff'), -12.1, 2.65 + 0.7, -10.8, fridge);
  box(0.72, 0.5, 0.72, std('#2f7be8'), -12.1, 2.65 + 0.6, -10.8, fridge);
  // the door: pivot at the hinge (x -13, z -9.05); swings open toward +z (rotation.y negative opens toward the room)
  const doorPivot = new THREE.Group(); doorPivot.position.set(FR.x0, 0, FR.z1 + 0.05); fridge.add(doorPivot);
  box(4, FR.h - 0.1, 0.35, frM, 2, FR.h / 2, 0.17, doorPivot);
  box(4.02, 0.05, 0.37, std('#c4c9ce'), 2, 7.4, 0.17, doorPivot);              // freezer seam
  box(0.18, 2.6, 0.25, handleM, 3.6, 5.6, 0.47, doorPivot);                    // handle on the free (right) edge
  box(0.18, 1.0, 0.25, handleM, 3.6, 8.0, 0.47, doorPivot);
  // door shelves (seen when open)
  for (const y of [2.0, 3.8, 5.6]) box(3.4, 0.5, 0.5, std('#e8f2ff', { roughness: 0.4 }), 2, y, -0.2, doorPivot);
  box(3.6, FR.h - 1.2, 0.05, frIn, 2, FR.h / 2, -0.02, doorPivot);
  // magnet letters: a canvas plane on the door front
  const LETTER_W = 3.2, LETTER_H = 4.4, LCV = [640, 880];   // stops short of the handle (door x 3.5..3.7)
  const lettersCanvas = document.createElement('canvas'); lettersCanvas.width = LCV[0]; lettersCanvas.height = LCV[1];
  const lettersTex = new THREE.CanvasTexture(lettersCanvas); lettersTex.colorSpace = THREE.SRGBColorSpace; lettersTex.anisotropy = 8;
  const lettersMesh = new THREE.Mesh(new THREE.PlaneGeometry(LETTER_W, LETTER_H), new THREE.MeshStandardMaterial({ map: lettersTex, transparent: true, roughness: 0.35, alphaTest: 0.05 }));
  lettersMesh.position.set(1.75, 4.6, 0.36); lettersMesh.castShadow = false; doorPivot.add(lettersMesh);
  // a kid's drawing held by a magnet
  drawing.position.set(2.6, 7.0, 0.36); drawing.rotation.z = 0.06; doorPivot.add(drawing);
  const letterState = { text: null, scatter: null };
  function drawLetters(text, scatter) {
    const g = lettersCanvas.getContext('2d'), [w, h] = LCV; g.clearRect(0, 0, w, h);
    const r = rng(17);
    const letter = (ch, x, y, px, i) => {
      g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.35);
      g.font = `${px}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillText(ch, 4, 6);
      g.lineWidth = px * 0.08; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(ch, 0, 0);
      g.fillStyle = LETTER_COLORS[i % LETTER_COLORS.length]; g.fillText(ch, 0, 0); g.restore();
    };
    let n = 0;
    if (scatter) {   // loose letters along the top and bottom of the door, plus a few in the middle edges
      const pool = 'AQMXZRTOPKWGHUJDF';
      const spots = [];
      for (let i = 0; i < 9; i++) spots.push([60 + r() * (w - 120), 50 + r() * 110]);
      for (let i = 0; i < 10; i++) spots.push([60 + r() * (w - 120), h - 60 - r() * 130]);
      for (const [x, y] of spots) letter(pool[(r() * pool.length) | 0], x, y, 70 + r() * 16, n++);
    }
    if (text) {   // fixed grid: 7 columns x up to 3 rows, lines left-aligned, so a growing string never moves placed letters
      const px = 108, step = 80, lh = 140, x0 = w / 2 - 3 * step, y0 = h / 2 - lh * 0.5;
      String(text).toUpperCase().split('\n').forEach((line, li) => [...line].forEach((ch, ci) => {
        if (ch === ' ') return;
        const k = li * 16 + ci, rr = rng(101 + k * 7 + ch.charCodeAt(0));
        const x = x0 + ci * step + (rr() - 0.5) * 8, y = y0 + li * lh + (rr() - 0.5) * 10;
        g.save(); g.translate(x, y); g.rotate((rr() - 0.5) * 0.3);
        g.font = `${px}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillText(ch, 4, 6);
        g.lineWidth = px * 0.08; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(ch, 0, 0);
        g.fillStyle = LETTER_COLORS[(k * 3 + ch.charCodeAt(0)) % LETTER_COLORS.length]; g.fillText(ch, 0, 0); g.restore();
      }));
    }
    lettersTex.needsUpdate = true;
  }
  // fridge light: a spot inside the top of the fridge shining out into the room (Ch3 key light)
  const fridgeLight = practical(new THREE.SpotLight('#dbe9ff', 0, 26, 0.95, 0.6, 1.4), 45);
  fridgeLight.position.set(-11, 7.1, -9.5); fridgeLight.target.position.set(-11, 3.4, -3.5);
  fridgeLight.castShadow = true; fridgeLight.shadow.mapSize.set(1024, 1024); fridgeLight.shadow.bias = -0.0004; fridgeLight.shadow.camera.near = 0.5;
  group.add(fridgeLight, fridgeLight.target);
  const fridgeFill = practical(new THREE.PointLight('#e6f1ff', 0, 7, 2), 10); fridgeFill.position.set(-11, 4.5, -10.4); group.add(fridgeFill);

  // ---------------------------------------------------------------- island + stools
  const island = new THREE.Group(); group.add(island);
  box(10.4, ISLAND_TOP - 0.3 - 0.35, 2.6, std('#3f6f8a', { roughness: 0.55 }), 0, 0.35 + (ISLAND_TOP - 0.65) / 2, 0.45, island);   // body z -0.85..1.75
  box(10.0, 0.35, 2.3, std('#2f566b'), 0, 0.17, 0.45, island);
  box(11.0, 0.3, 3.9, topM, 0, ISLAND_TOP - 0.15, -0.15, island);                // top z -2.1..1.8 (overhang on the stool side)
  for (let x = -4.2; x <= 4.3; x += 2.1) box(1.9, 2.2, 0.08, std('#36627b', { roughness: 0.55 }), x, 1.75, 1.77, island);   // panels on the hiding side
  // stools on the back side (z -3.2), seat top 2.4
  const STOOL_X = [-3.6, -1.2, 1.2, 3.6], STOOL_Z = -3.2, stools = [];
  for (const x of STOOL_X) {
    const s = new THREE.Group(); s.position.set(x, 0, STOOL_Z); island.add(s); stools.push(s);
    cyl(0.8, 0.8, 0.3, woodM, 0, STOOL_TOP - 0.15, 0, s);
    for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) { const l = cyl(0.08, 0.1, STOOL_TOP - 0.3, woodDark, dx * 0.95, (STOOL_TOP - 0.3) / 2, dz * 0.95, s); l.rotation.set(dz * 0.12, 0, -dx * 0.12); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 20), woodDark); ring.rotation.x = Math.PI / 2; ring.position.y = 0.8; s.add(ring);
  }
  // pendant lamps over the island
  const pendants = [];
  for (const x of [-3, 3]) {
    cyl(0.03, 0.03, 2.6, blackM, x, H - 1.3, 0, island);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.9, 20, 1, true), std('#2c3e3a', { side: THREE.DoubleSide, roughness: 0.4 }));
    shade.position.set(x, H - 3, 0); island.add(shade);
    const bulbM = glow('#ffe2a8', 0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), bulbM); bulb.position.set(x, H - 3.35, 0); island.add(bulb);
    const L = practical(new THREE.PointLight('#ffd9a0', 0, 18, 2), 30); L.position.set(x, H - 3.7, 0); island.add(L);
    pendants.push({ L, bulbM });
  }
  const hoodLight = practical(new THREE.PointLight('#ffcf8a', 0, 6, 2), 6); hoodLight.position.set(-2, 7.6, -10.6); kit.add(hoodLight);

  // pancake stack (on a plate on the island, toward the hiding side so a hand can reach it from the front)
  const STACK = V(0.6, ISLAND_TOP, 1.12);   // plate rim at the front edge (z 1.8) so a hand from the front can reach it
  const stack = new THREE.Group(); stack.position.copy(STACK); island.add(stack);
  // opt-in side counter against the left wall just right of the pantry opening (x -16..-14.6, z 2.5..5.0, top 3.4);
  // hidden unless setState({ stackAt: 'side' }), which also moves the pancake stack onto it (ch02's pancake steal)
  const SIDE_STACK = V(-15.25, COUNTER_TOP, 3.4);
  const sideG = new THREE.Group(); sideG.visible = false; group.add(sideG);
  box(1.3, COUNTER_TOP - 0.25 - 0.4, 2.5, cabM, -15.35, 0.4 + (COUNTER_TOP - 0.65) / 2, 3.75, sideG);
  box(1.1, 0.4, 2.3, std('#3f5a52'), -15.45, 0.2, 3.75, sideG);
  box(1.45, 0.25, 2.6, topM, -15.3, COUNTER_TOP - 0.125, 3.75, sideG);
  box(0.08, COUNTER_TOP - 1.25, 2.2, cabDark, -14.68, 0.45 + (COUNTER_TOP - 1.25) / 2 + 0.05, 3.75, sideG);
  box(0.12, 0.1, 0.6, handleM, -14.6, COUNTER_TOP - 0.62, 3.75, sideG);
  cyl(0.66, 0.56, 0.1, std('#ffffff', { roughness: 0.3 }), 0, 0.05, 0, stack);
  const cakeM = std('#d9a05b', { roughness: 0.7 }), cakeTop = std('#c4823d', { roughness: 0.6 });
  const cakes = []; const CAKE_H = 0.11;
  const r0 = rng(21);
  for (let i = 0; i < 12; i++) {
    const c = cyl(0.56, 0.58, CAKE_H, cakeM, (r0() - 0.5) * 0.06, 0.1 + CAKE_H / 2 + i * CAKE_H, (r0() - 0.5) * 0.08, stack, 22);
    c.rotation.y = r0() * 6; cakes.push(c);
  }
  const butter = box(0.26, 0.1, 0.26, std('#ffe98a', { roughness: 0.3 }), 0, 0, 0, stack);
  const syrup = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 22), std('#8a4a12', { roughness: 0.15, transparent: true, opacity: 0.85 })); stack.add(syrup);

  // plate on the back counter (Ch3: the ghost's crustless sandwich, then empty)
  const PLATE = V(-6.3, COUNTER_TOP, -10.0);
  const plate = new THREE.Group(); plate.position.copy(PLATE); kit.add(plate);
  cyl(0.8, 0.7, 0.08, std('#ffffff', { roughness: 0.3 }), 0, 0.04, 0, plate);
  const sandwich = new THREE.Group(); sandwich.position.y = 0.08; plate.add(sandwich);
  for (const [y, c, h] of [[0, '#f3e1b6', 0.14], [0.14, '#f2a7a7', 0.08], [0.22, '#f3e1b6', 0.14]]) { const t = box(0.95, h, 0.95, std(c, { roughness: 0.8 }), 0, y + h / 2, 0, sandwich); t.rotation.y = 0.785; }

  // ---------------------------------------------------------------- pantry (left wall, x -19..-16, z -3..+2), slatted double doors
  const pantry = new THREE.Group(); group.add(pantry);
  const pantryM = std('#e8dcc4', { roughness: 0.8 });
  box(0.3, 8.6, 5.6, pantryM, -19.4, 4.3, -0.5, pantry);                         // back
  box(3.4, 8.6, 0.3, pantryM, -17.6, 4.3, -3.3, pantry); box(3.4, 8.6, 0.3, pantryM, -17.6, 4.3, 2.3, pantry);
  box(3.4, 0.3, 5.6, pantryM, -17.6, 8.6, -0.5, pantry); box(3.6, 0.1, 5.6, std('#bfae8f'), -17.6, 0.05, -0.5, pantry);
  for (const y of [3.8, 5.6, 7.3]) box(1.4, 0.12, 5.2, woodM, -18.6, y, -0.5, pantry);    // shelves at the back
  const jars = [['#ffcc1f', 3.9], ['#e8302f', 3.9], ['#7ac943', 5.7], ['#ff8a1f', 5.7], ['#f5e6c8', 7.4], ['#2f7be8', 7.4]];
  jars.forEach(([c, y], i) => box(0.8, 1.1, 0.7, std(c, { roughness: 0.5 }), -18.7, y + 0.6, -2.4 + (i % 3) * 1.9 + (i > 2 ? 0.5 : 0), pantry));
  const pantryLight = practical(new THREE.PointLight('#ffe0b0', 0, 5, 2), 2); pantryLight.position.set(-18, 7.5, -0.5); pantry.add(pantryLight);
  // frame
  box(0.5, 0.4, 5.8, trimM, -15.95, 8.2, -0.5, pantry);
  box(0.5, 8.4, 0.3, trimM, -15.95, 4.2, -3.15, pantry); box(0.5, 8.4, 0.3, trimM, -15.95, 4.2, 2.15, pantry);
  // two louvred doors, hinged at the outer edges; open = swing into the room
  const slatM = std('#f4efe4', { roughness: 0.6 });
  const pantryDoors = [];
  for (const side of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(-16.05, 0, side < 0 ? -3.0 : 2.0); pantry.add(piv);
    const dz = side < 0 ? 1.25 : -1.25;
    const d = new THREE.Group(); d.position.z = dz; piv.add(d);
    box(0.18, 7.9, 0.22, slatM, 0, 4.0, -1.13, d); box(0.18, 7.9, 0.22, slatM, 0, 4.0, 1.13, d);
    box(0.18, 0.3, 2.5, slatM, 0, 0.2, 0, d); box(0.18, 0.3, 2.5, slatM, 0, 7.8, 0, d); box(0.18, 0.35, 2.5, slatM, 0, 4.0, 0, d);
    for (let y = 0.55; y < 7.6; y += 0.42) { if (Math.abs(y - 4.0) < 0.3) continue; const s = box(0.05, 0.3, 2.1, slatM, 0, y, 0, d); s.rotation.z = -1.15; s.userData.noCamBlock = true; }
    box(0.12, 0.6, 0.12, handleM, 0.15, 4.0, side < 0 ? 1.0 : -1.0, d);
    // opaque back panel behind the louvres (pantry side), so a shut pantry hides whoever is inside; moves with its leaf,
    // so the centre gap between the leaves still opens when they are ajar (pantryDoors 0.3)
    box(0.06, 7.4, 2.2, std('#2b2420', { roughness: 0.9 }), -0.13, 4.0, 0, d);
    pantryDoors.push({ piv, side });
  }

  // ---------------------------------------------------------------- stairs (right wall, x 12..16)
  const stairs = new THREE.Group(); group.add(stairs);
  const treadM = std('#9b6a3e', { roughness: 0.6 }), riserM = std('#f4efe4', { roughness: 0.7 });
  for (let i = 1; i <= 16; i++) {
    const zf = STAIR_Z0 - STEP_RUN * (i - 1), y = STEP_RISE * i;
    box(STAIR_W, STEP_RISE, STEP_RUN, riserM, STAIR_X, y - STEP_RISE / 2, zf - STEP_RUN / 2, stairs);
    box(STAIR_W + 0.1, 0.14, STEP_RUN + 0.12, treadM, STAIR_X, y + 0.02, zf - STEP_RUN / 2 + 0.04, stairs);
  }
  // the side (stringer) under the steps, facing the room: a solid wall panel shaped as a staircase profile
  const prof = new THREE.Shape(); prof.moveTo(STAIR_Z0, 0);
  for (let i = 1; i <= 16; i++) { const zf = STAIR_Z0 - STEP_RUN * (i - 1); prof.lineTo(zf, STEP_RISE * i); prof.lineTo(zf - STEP_RUN, STEP_RISE * i); }
  prof.lineTo(-12, STEP_RISE * 16); prof.lineTo(-12, 0); prof.lineTo(STAIR_Z0, 0);
  const sideGeo = new THREE.ExtrudeGeometry(prof, { depth: 0.25, bevelEnabled: false });
  const sideMesh = new THREE.Mesh(sideGeo, std('#efe6d2', { roughness: 0.8 })); sideMesh.rotation.y = -Math.PI / 2; sideMesh.position.set(10.9, 0, 0);
  sideMesh.castShadow = sideMesh.receiveShadow = true; stairs.add(sideMesh);
  // cupboard door under the stairs
  box(0.1, 3.4, 2.2, std('#d8ccb4'), 10.8, 1.7, -4.5, stairs); box(0.15, 0.15, 0.15, handleM, 10.72, 1.7, -3.6, stairs);
  // banister on the room side: newel post at the bottom, sloped rail, balusters
  const railM = std('#7a4f2a', { roughness: 0.5 });
  box(0.45, 4.2, 0.45, railM, 11.2, 2.1, 1.6, stairs);
  const len = Math.hypot(STEP_RUN * 15, STEP_RISE * 15);
  const rail = box(0.3, 0.25, len, railM, 11.2, 3.3 + STEP_RISE * 7.5, STAIR_Z0 - STEP_RUN * 7.5, stairs);
  rail.rotation.x = Math.atan2(STEP_RISE, STEP_RUN);
  for (let i = 1; i <= 15; i++) { const zf = STAIR_Z0 - STEP_RUN * (i - 0.5); box(0.12, 3.2, 0.12, std('#f4efe4'), 11.2, STEP_RISE * i + 1.6, zf, stairs); }

  // ---------------------------------------------------------------- back door (right wall, z 4..8), window in its top half
  const doorPivot2 = new THREE.Group(); doorPivot2.position.set(16.0, 0, 4.0); group.add(doorPivot2);   // hinge at z 4
  const bd = new THREE.Group(); doorPivot2.add(bd);
  const doorM = std('#4f7f6f', { roughness: 0.5 });
  box(0.3, 3.9, 3.9, doorM, 0, 1.95, 2.0, bd);                         // lower half
  box(0.3, 4.2, 0.5, doorM, 0, 6.0, 0.3, bd); box(0.3, 4.2, 0.5, doorM, 0, 6.0, 3.7, bd); box(0.3, 0.4, 3.9, doorM, 0, 7.9, 2.0, bd);
  box(0.12, 4.0, 0.12, doorM, 0, 6.0, 2.0, bd); box(0.12, 0.12, 3.0, doorM, 0, 6.0, 2.0, bd);   // muntins
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.8), glassM); dg.rotation.y = Math.PI / 2; dg.position.set(0, 6.0, 2.0); bd.add(dg);
  for (const s of [1, -1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), handleM); k.position.set(0.25 * -s, 3.9, 3.5); bd.add(k); }
  // frame + mat
  box(0.5, 0.35, 4.6, trimM, 15.95, 8.35, 6.0, group); box(0.5, 8.4, 0.3, trimM, 15.95, 4.2, 3.85, group); box(0.5, 8.4, 0.3, trimM, 15.95, 4.2, 8.15, group);
  box(1.6, 0.05, 3.2, std('#8a5a3a', { roughness: 0.95 }), 14.9, 0.03, 6.0, group);
  // outside step under the door
  box(4, 0.4, 5, std('#9a9a92'), 18, -0.2, 6, group);
  // moonlight through the back-door window and the sink window
  const moon = practical(new THREE.SpotLight('#9fb8ff', 0, 60, 0.5, 0.5, 1.2), 900);
  moon.position.set(30, 16, 2); moon.target.position.set(4, 0, 6); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.0004;
  group.add(moon, moon.target);
  const moonSink = practical(new THREE.SpotLight('#9fb8ff', 0, 50, 0.45, 0.8, 1.2), 160);
  moonSink.position.set(3, 14, -26); moonSink.target.position.set(2, 0, -6); group.add(moonSink, moonSink.target);
  // daylight through the windows (Ch11 Sunday morning): broad warm spots
  const sunIn = practical(new THREE.SpotLight('#fff0d0', 0, 70, 0.6, 0.7, 1.0), 150);
  sunIn.position.set(30, 18, -2); sunIn.target.position.set(0, 0, 2); sunIn.castShadow = true; sunIn.shadow.mapSize.set(1024, 1024); sunIn.shadow.bias = -0.0004;
  group.add(sunIn, sunIn.target);
  const sunSink = practical(new THREE.SpotLight('#fff0d0', 0, 60, 0.5, 0.7, 1.0), 150);
  sunSink.position.set(4, 15, -28); sunSink.target.position.set(0, 0, -3); group.add(sunSink, sunSink.target);
  // a soft room fill for every time of day (scaled by setState time)
  const roomFill = practical(new THREE.PointLight('#fff4e0', 0, 40, 1.5), 14); roomFill.position.set(0, 10.5, 4); group.add(roomFill);

  // ---------------------------------------------------------------- dressing: rug, bin, dog-free bowl, a plant, front-room glimpse
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.5), std('#ffffff', { map: canvasTexture(256, 150, (g, w, h) => { g.fillStyle = '#b8483b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2d39a'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28); g.fillStyle = '#f2d39a'; for (let x = 40; x < w - 30; x += 30) g.fillRect(x, h / 2 - 4, 14, 8); }), roughness: 0.95 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-1, 0.02, 7); rug.receiveShadow = true; group.add(rug);
  cyl(0.7, 0.6, 2.2, steelM, 7.3, 1.1, -10.6, group);       // bin by the counter end
  const plant = new THREE.Group(); plant.position.set(-14.5, 0, 9.5); group.add(plant);
  cyl(0.8, 0.6, 1.6, std('#c8643b'), 0, 0.8, 0, plant);
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), std('#3f8a3a')); l.scale.set(0.6, 1.4, 0.6); const a = i / 7 * 6.28; l.position.set(Math.sin(a) * 0.5, 2.6 + (i % 2) * 0.4, Math.cos(a) * 0.5); l.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); l.castShadow = true; plant.add(l); }
  // beyond the front doorway: a dim living-room wall and sofa back
  box(10, H, 0.3, std('#d9c9a8'), 14, H / 2, 5.75, front); rbox(6, 2.6, 2, 0.4, std('#7a8fb8'), 14, 1.3, 4.25, front);   // (front-wall local coords)

  // ---------------------------------------------------------------- the dollhouse walls
  autoHideWalls(scene, walls);
  group.userData.walls = walls.map((w) => w.obj);

  // ---------------------------------------------------------------- marks (heading: forward = (sin h, 0, cos h))
  const PI = Math.PI;
  const sit = (x, z, h = 0) => M(x, STOOL_TOP - 1.5, z, h, { sit: true, seatTop: STOOL_TOP + OFFSET.y });
  const marks = {
    fridge: M(-11, 0, -7.4, PI, { note: 'facing the fridge door (letters), arm length from it' }),
    fridge_open: M(-10.2, 0, -6.6, PI, { note: 'in the open fridge light, facing in; the door swings to his left' }),
    fridge_read: M(-11, 0, -6.4, PI, { note: 'a step back from the door, reading the letters' }),
    fridge_side: M(-8.0, 0, -8.0, -PI / 2, { note: 'to the right of the fridge, facing it' }),
    stove: M(-2, 0, -7.9, PI, { note: 'Dad at the stove, cooking (back to the room)' }),
    stove_turned: M(-2, 0, -7.9, 0, { note: 'Dad at the stove turned to the room' }),
    stove_three_quarter: M(-1.6, 0, -7.8, PI * 0.8, { note: 'Dad cooking, cheated 3/4 toward the front-left camera' }),
    counter_sandwich: M(-6.3, 0, -8.3, PI, { note: 'at the back counter, at the plate (Ch3 sandwich)' }),
    counter_right: M(4.5, 0, -8.3, PI, { note: 'at the sink / toaster counter' }),
    island_stool_1: sit(STOOL_X[0], STOOL_Z), island_stool_2: sit(STOOL_X[1], STOOL_Z),
    island_stool_3: sit(STOOL_X[2], STOOL_Z), island_stool_4: sit(STOOL_X[3], STOOL_Z),
    island_back_stand: M(0, 0, -3.6, 0, { note: 'standing at the island on the stool side, facing +z' }),
    island_end_right: M(7.0, 0, -0.2, -PI / 2, { note: 'at the right end of the island, facing it' }),
    island_end_left: M(-7.0, 0, -0.2, PI / 2, { note: 'at the left end of the island, facing it' }),
    island_hide: M(0.4, 0, 2.9, 0, { floorSit: true, note: 'sitting on the floor (hip at y 0, legs out) on the front (camera) side, back to the island panels, facing +z; head stays under the top (3.6)' }),
    island_hide_reach: M(0.6, 0, 2.5, PI, { crouch: true, note: 'crouched facing the island, under the pancake stack, to reach up over the top' }),
    island_hide_left: M(-3.8, 0, 2.9, 0, { floorSit: true, note: 'sitting on the floor at the left of the front side' }),
    island_front_stand: M(0, 0, 3.4, PI, { note: 'standing at the front of the island facing it' }),
    pantry_inside: M(-17.5, 0, -0.5, PI / 2, { note: 'inside the pantry facing out (+x)' }),
    pantry_slats: M(-16.75, 0, -0.5, PI / 2, { note: 'nose to the slats, peeking out; the camera pantry_peek sees the eyes through the gap' }),
    pantry_front: M(-13.5, 0, -0.5, -PI / 2, { note: 'outside the pantry doors facing them' }),
    pantry_step_out: M(-13.5, 0, 2.3, Math.atan2(-1.75, 1.1), { note: 'one step out of the ajar pantry, facing the side counter stack (opt-in stackAt: side); stack top ~2.1 away' }),
    stairs_top: M(STAIR_X, stairFootY(-9.6 - 0.45), -9.6, 0, { note: 'top of the visible stairs (head in the stairwell), facing down (+z)' }),
    stairs_mid: M(STAIR_X, stairFootY(-4.0 - 0.45), -4.0, 0, { note: 'halfway down (Ch2 freeze)' }),
    stairs_low: M(STAIR_X, stairFootY(0.4 - 0.45), 0.4, 0, { note: 'two steps from the bottom' }),
    stairs_bottom: M(STAIR_X, 0, 3.4, 0, { note: 'at the foot of the stairs on the floor' }),
    back_door_inside: M(13.6, 0, 6.0, PI / 2, { note: 'inside, facing the back door' }),
    back_door_crawl: M(14.4, 0, 6.0, PI / 2, { crawl: true, note: 'on hands and knees going out the back door' }),
    back_door_outside: M(19.0, 0, 6.0, PI / 2, { note: 'just outside the back door (offscreen side)' }),
    front_doorway: M(-2, 0, 11.0, PI, { note: 'in the living-room doorway (front wall), facing in' }),
    kitchen_center: M(0, 0, 6.0, PI, { note: 'open floor in front of the island' }),
    pantry_gap: M(-16.35, 0, -0.5, PI / 2, { note: 'just inside the pantry with the doors ajar (pantryDoors ~0.15), face in the centre gap' }),
    island_counter: M(0, 0, -3.0, 0, { note: 'behind the island on the stove side, facing the camera side (making the sandwich; use stools: tucked)' }),
    island_crouch: M(0.4, 0, 2.7, 0, { crouch: true, note: 'crouched low on the front side (head must stay below 3.6)' }),
    island_max: M(-1.2, 0, -4.8, 0, { note: 'standing behind stool 2 facing the island' }),
    island_lily: M(-3.6, 0, -4.8, 0, { note: 'standing behind stool 1 facing the island' }),
    island_end: M(7.0, 0, -0.6, -PI / 2, { note: 'standing at the right (stool 3-4) end of the island, facing it' }),
    cupboard: M(-6.6, 0, -8.3, PI, { note: 'at the upper cupboards left of the stove (the syrup)' }),
    phone_corner: M(10.0, 0, 9.0, -PI * 0.8, { note: 'the front-right corner by the back door, facing into the room (phone call)' }),
    stairs_exit: M(STAIR_X, 12, -10.6, PI, { note: 'top of the stairs, out of frame (walk up to here)' }),
    pan: M(-2.85, COUNTER_TOP + 0.3, -10.1, PI, { note: 'the pan surface on the front-left burner (pos = top of the pan)' }),
    island_plate_1: M(STOOL_X[0], ISLAND_TOP, -1.5, 0, { note: 'island top in front of stool 1 (y = top surface)' }),
    island_plate_2: M(STOOL_X[1], ISLAND_TOP, -1.5, 0), island_plate_3: M(STOOL_X[2], ISLAND_TOP, -1.5, 0), island_plate_4: M(STOOL_X[3], ISLAND_TOP, -1.5, 0),
    island_phone_3: M(STOOL_X[2] + 0.8, ISLAND_TOP, -1.2, 0, { note: 'island top beside stool 3\'s plate' }),
    backpack_floor_3: M(STOOL_X[2] + 1.0, 0, -4.6, 0, { note: 'floor beside stool 3' }),
  };
  // SC2: reach, hide and crawl spots out of the family's sight lines (seated eyes on stools ~y 4.5-5.2 at z -3.2 see over the
  // island top edge (z 1.8, y 3.6) down to about y 3.3 at z 2.3, y 2.8 at z 3.5). Check any frame with set.sightBlocked(eye, head).
  Object.assign(marks, {
    island_reach: M(STACK.x, 0, 2.35, PI, { kneel: true, note: 'kneeling (kneel_up) against the island front, facing it, under the stack: torso front 1.85 clears the panel (1.77); one arm straight up beside the edge, the hand comes over at y ~4.3 in front of the stack (z 1.12, rim 1.78)' }),
    island_hide_low: M(0.4, 0, 2.6, 0, { crawl: true, note: 'crouched low / hands and knees against the island front (crawl pose, head ~2.6): below every seated sight line' }),
    island_hide_crawl_end: M(6.2, 0, 3.4, PI / 2, { crawl: true, note: 'crawl waypoint past the right end of the island, still shadowed by it from the stools' }),
    island_hide_crawl_door: M(10.2, 0, 5.4, PI / 2, { crawl: true, note: 'crawl waypoint toward the back door (in the open: only safe while the family looks at Dad / the stack)' }),
    stairs_foot_out: M(STAIR_X, 0, 4.4, 0, { note: 'one step clear of the foot of the stairs (start walks into the room from here; the newel post is at x 11.2, z 1.6)' }),
  });
  marks.stairs_foot = marks.stairs_bottom; marks.back_door = marks.back_door_inside;
  // a walk path down the stairs: u 0 (top) .. 1 (floor at the bottom); y follows the steps
  // A stair-descent gait for posture(): legs swing only FORWARD (downhill), one leg per tread, so the trailing leg never
  // reaches back into the higher tread (a flat-ground walk cycle does). Pose dict in kit-cast's convention (degrees;
  // negative x = forward). Use with stairsPath(u): K.posture(actor, set.stairsGait(u)); root at stairsPath(u).pos.
  function stairsGait(u) {
    const z = -9.6 + (3.4 + 9.6) * u, ph = Math.max(0, (z + 9.6) / STEP_RUN), k = Math.floor(ph), f = ph - k;
    const sw = -24 * Math.sin(Math.PI * f), lead = k % 2 === 0;
    const onFloor = z > STAIR_Z0 + 0.4;               // past the bottom step: a normal walk can take over
    return { 'Leg.L': [onFloor ? 0 : (lead ? sw : 0), 0, 0], 'Leg.R': [onFloor ? 0 : (lead ? 0 : sw), 0, 0],
      'Arm.L': [lead ? 8 * Math.sin(Math.PI * f) : -6 * Math.sin(Math.PI * f), 0, -3], 'Arm.R': [lead ? -6 * Math.sin(Math.PI * f) : 8 * Math.sin(Math.PI * f), 0, 3], Torso: [4, 0, 0] };
  }
  function stairsPath(u) {
    const z = -9.6 + (3.4 + 9.6) * u; return { pos: W(STAIR_X, stairFootY(z - 0.45), z), heading: 0 };   // the higher tread under the body (no leg through a tread)
  }

  // SC2 routing on the floor: island + stools, back counters, fridge, stairs (with the newel/banister), the bin
  const rects = [
    { x0: -5.6 - 1.2, x1: 5.6 + 1.2, z0: -4.0 - 0.9, z1: 1.8 + 0.9 },        // island + stools (stools out)
    { x0: -16, x1: 8.0, z0: -12, z1: -9.4 + 0.9 },                           // back counters, stove, bin
    { x0: -16, x1: -9 + 1.2, z0: -12, z1: -9.1 + 0.9 },                       // fridge (shut)
    { x0: 10.9 - 1.2, x1: 16, z0: -12, z1: 2.0 + 0.9 },                       // stairs, stringer, newel (x 11.2, z 1.6)
  ];
  const route = makeRouter(OFFSET, rects, { x0: -14.6, x1: 14.8, z0: -8.4, z1: 10.8 });
  // walk from the stairs (u 0 = top) to a floor point: stairsPath down, then route() from the foot
  const fromStairs = (toW) => [W(STAIR_X, 0, 3.4), ...route(W(STAIR_X, 0, 4.4), toW)];
  // true when the island (or the stools' backs) blocks the straight line between two world points (eyes -> head)
  const ISL = { x0: -5.5, x1: 5.5, y0: 0, y1: ISLAND_TOP, z0: -2.1, z1: 1.8 };
  function sightBlocked(eyeW, targetW) {
    const a = eyeW.clone().sub(OFFSET), d = targetW.clone().sub(OFFSET).sub(a); let t0 = 0, t1 = 1;
    for (const [p, q] of [[-d.x, a.x - ISL.x0], [d.x, ISL.x1 - a.x], [-d.y, a.y - ISL.y0], [d.y, ISL.y1 - a.y], [-d.z, a.z - ISL.z0], [d.z, ISL.z1 - a.z]]) {
      if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
      const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t0 <= t1;
  }

  // ---------------------------------------------------------------- cams
  const cams = {
    wide: C([0, 9.5, 26], [0, 3.6, -3], 44),
    wide_island: C([-13, 9.5, 19], [1.5, 3.4, -3.5], 42, { note: 'Ch11 end screen: island, stools, Dad at the stove, the stairs at right' }),
    end_screen: C([-9, 8.5, 16], [1.5, 4.4, -3.5], 40, { note: 'Ch11 end screen: Skye and Max on stools 2-3 in the left half, room for YouTube elements on the right' }),
    island_two_shot: C([0, 5.4, 8.5], [0, 4.0, -3.2], 38, { note: 'the stools (kids face the camera) over the island top' }),
    island_stools_left: C([-3.5, 5.2, 6.5], [-2.4, 4.0, -3.2], 36, { note: 'stools 1-2 (Lily, Max)' }),
    island_stools_right: C([3.5, 5.2, 6.5], [2.4, 4.0, -3.2], 36, { note: 'stools 3-4' }),
    behind_island: C([2.5, 2.6, 9.5], [-0.5, 2.6, 0], 42, { note: 'low behind the island: the hider in the foreground, the stove and Dad beyond' }),
    behind_island_low: C([5.5, 1.6, 6.5], [-1.0, 3.0, -4], 46, { note: 'floor level at the island front: the hider close, the stack edge and the stools above' }),
    island_hide_cu: C([2.2, 2.9, 6.0], [0.4, 2.6, 2.7], 34, { note: 'close-up of the crouched hider (island_hide)' }),
    pancake_reach: C([3.2, 4.5, 3.6], [0.6, 3.9, 0.75], 34, { note: 'the stack on the island and the hand coming up from the front' }),
    stove: C([4.5, 5.6, -2.5], [-2, 4.9, -9.5], 38, { note: 'Dad at the stove, 3/4 from the right' }),
    stove_front: C([-2, 5.4, -3.0], [-2, 4.8, -9], 40, { note: 'over the stools toward Dad at the stove' }),
    fridge: C([-6.6, 5.2, -2.8], [-11, 4.4, -9], 40, { note: 'the fridge and whoever stands at it, 3/4 from the right' }),
    fridge_wide: C([-3, 6.5, 5], [-10, 4.0, -8], 42, { note: 'the fridge corner, pantry at left, island edge at right' }),
    fridge_letters: C([-11, 4.7, -4.6], [-11, 4.7, -9], 34, { note: 'the magnet letters fill the frame' }),
    fridge_pov: C([-11.1, 4.9, -9.35], [-10.4, 4.6, -3], 54, { note: 'from inside the fridge out (door open): the face at fridge_open lit by the fridge light' }),
    fridge_ots: C([-8.6, 5.9, -3.6], [-11, 4.6, -9], 40, { note: 'over the shoulder of someone at fridge_read toward the letters' }),
    pantry_pov: C([-17.2, 4.6, -0.5], [-11, 4.0, -7.5], 54, { note: 'from inside the pantry through the slats toward the fridge' }),
    pantry_pov_island: C([-17.2, 4.6, -0.5], [-2, 3.6, 0], 54, { note: 'from inside the pantry through the slats toward the island' }),
    pantry_peek: C([-10.5, 4.7, 2.5], [-16.3, 4.6, -0.6], 34, { note: 'the pantry doors from outside: eyes behind the slats' }),
    stairs: C([2, 5.2, 4], [13.5, 5.2, -4], 46, { note: 'the stairs from the island' }),
    stairs_wide: C([-6, 6.5, 10], [12, 5.0, -3], 44, { note: 'the stairs and the island together (entrances)' }),
    stairs_bottom: C([7, 3.6, 7.5], [14, 5.5, -3], 46, { note: 'low at the foot of the stairs looking up' }),
    back_door: C([4, 4.5, 3], [16, 3.0, 6.2], 46, { note: 'the back door and whoever crawls out' }),
    back_door_wide: C([-4, 5.5, 8], [15, 2.6, 5.5], 44, { note: 'island front to the back door: the crawl route' }),
    reverse_from_stove: C([-1, 6.0, -8.5], [0, 3.6, 4], 50, { note: 'from the stove toward the island and the front (shows the front wall)' }),
    kitchen_wide: C([0, 9.5, 24], [-1.5, 4.0, -4], 52, { note: 'pantry (left wall) L, fridge centre-L, island fg, stairs R' }),
    fridge_side: C([-6.6, 5.2, -2.8], [-11, 4.4, -9], 40, { note: '3/4 on whoever is at the fridge, fridge left (same as fridge)' }),
    fridge_cu: C([-9.6, 5.0, -5.2], [-11, 4.7, -9], 38, { note: 'closer on the fridge door (letters readable) and a face beside it' }),
    pantry_gap: C([-11.5, 4.8, 3.0], [-16.3, 4.6, -0.5], 32, { note: 'outside the pantry, 3/4: the face in the gap of the ajar doors' }),
    island_counter: C([0.8, 5.6, 7.5], [0, 4.3, -3.0], 38, { note: 'over the island onto whoever stands at island_counter' }),
    island_low_behind: C([-0.5, 2.4, 7.5], [-8, 3.6, -8], 46, { note: 'low on the front side: the crouched hider fg, the fridge bg' }),
    back_door_floor: C([3, 1.1, 3.5], [16, 1.6, 6], 48, { note: 'floor level toward the back door (the crawl out)' }),
    stairs_side: C([2, 5.2, 4], [13.5, 5.2, -4], 46, { note: 'the stairs from the island (old stairs)' }),
    stove_ms: C([3.5, 5.4, -3.2], [-1.8, 4.8, -9.2], 36, { note: 'MS of Dad at the stove' }),
    island_two: C([3.0, 5.4, 5.0], [2.0, 4.2, -2.6], 40, { note: 'stools 2-3 and the island_end spot' }),
    island_two_seated: C([0, 5.0, 6.0], [0, 4.0, -3.2], 34, { note: 'tight two-shot of stools 2 and 3, faces to camera' }),
    island_wide: C([7.5, 8.5, 17], [-3.0, 4.2, -5], 44, { note: 'end screen: the four at the island, fridge letters readable at left, room at right' }),
  };
  cams.stairs_wide = C([-12, 9, 19], [2.5, 4.6, -3.5], 44, { note: 'frame 0 of Ch11: stairs R, island, stove, fridge L all readable' });

  // ---------------------------------------------------------------- lights the presets switch
  // set.lights: the practicals K.applyLight / K.setPractical switch (proxies; see common_c.js). fridge_light only shines
  // while the door is open; ceiling_light = the two pendants + the hood light (bulbs glow with it).
  const lights = { fridge_light: proxyLight(group), ceiling_light: proxyLight(group), pantry_light: proxyLight(group), upstairs_light: proxyLight(group) };
  // the room's own time-of-day lights (moon / sun through the windows, a soft fill) follow setState({ time }), not the presets
  const internal = { moon, moonSink, sunIn, sunSink, roomFill };

  // ---------------------------------------------------------------- state
  const state = {};
  const TIME = {
    night: { out: 'night', clock: [11, 52], lv: { moon: 1, moonSink: 1, roomFill: 0.06, pendantL: 0, pendantR: 0, hood: 0, upstairs: 0 } },
    predawn: { out: 'predawn', clock: [6, 4], lv: { moon: 0.35, moonSink: 0.4, roomFill: 0.25, pendantL: 1, pendantR: 1, hood: 1, upstairs: 0.6 } },
    morning: { out: 'morning', clock: [8, 30], lv: { sunIn: 1, sunSink: 1, roomFill: 0.5, pendantL: 0, pendantR: 0, hood: 0, upstairs: 0.6 } },
    day: { out: 'day', clock: [12, 0], lv: { sunIn: 1, sunSink: 1, roomFill: 1 } },
  };
  function setState(s = {}) {
    if (s.chapter !== undefined) {
      const ch = { 2: { time: 'predawn', fridge: 'LILY', fridgeScatter: true, pancakes: 12, plate: null, fridgeOpen: 0, stools: 'out', backDoor: 0, stoolX: null },
        3: { time: 'night', fridge: 'BE NI', fridgeScatter: true, pancakes: null, plate: null, fridgeOpen: 1, stools: 'tucked', backDoor: 0, stoolX: null },
        11: { time: 'morning', fridge: 'BE NICE\n2 SKYE', fridgeScatter: true, pancakes: 8, plate: null, fridgeOpen: 0, stools: 'out', backDoor: 0, stoolX: 'three' } }[s.chapter];
      if (!ch) return;          // another set's chapter: nothing to do here
      Object.assign(state, ch, { chapter: s.chapter });
    }
    for (const k of Object.keys(s)) if (k !== 'chapter') state[k] = s[k];
    // time of day: outside backdrop, clock, practical defaults (explicit s.practicals win)
    const T = TIME[state.time || 'day'];
    outM.map = OUT[T.out]; outM.needsUpdate = true;
    setClock(...(state.clock || T.clock));
    const text = state.letters ?? state.fridge ?? '', scatter = state.fridgeScatter ?? true;
    if (text !== letterState.text || scatter !== letterState.scatter) { drawLetters(text, scatter); letterState.text = text; letterState.scatter = scatter; }
    doorPivot.rotation.y = -Math.max(0, Math.min(1, state.fridgeOpen ?? 0)) * 1.75;
    const tucked = (state.stools ?? 'out') === 'tucked';
    stools.forEach((st) => { st.position.z = tucked ? -1.75 : STOOL_Z; });
    // stoolX: the stools' x positions (1-4 entries, left to right); stools beyond the list are hidden. The sit marks
    // island_stool_N, island_plate_N, island_phone_3 and backpack_floor_3 move with them. 'three' = [-4.2, 0, 4.2]
    // (neighbours' arms clear at 4.2 apart); default = the four at -3.6/-1.2/1.2/3.6.
    const sx = state.stoolX === 'three' ? [-4.2, 0, 4.2] : (state.stoolX || STOOL_X);
    stools.forEach((st, i) => { st.visible = i < sx.length; if (i < sx.length) st.position.x = sx[i]; });
    sx.forEach((x, i) => {
      const n = i + 1, wx = OFFSET.x + x;
      if (marks[`island_stool_${n}`]) marks[`island_stool_${n}`].pos.x = wx;
      if (marks[`island_plate_${n}`]) marks[`island_plate_${n}`].pos.x = wx;
      if (n === 3) { marks.island_phone_3.pos.x = wx + 0.8; marks.backpack_floor_3.pos.x = wx + 1.0; }
    });
    // stackAt: 'island' (default) | 'side' (shows the side counter and moves the stack onto it)
    const sideOn = state.stackAt === 'side'; sideG.visible = sideOn;
    if (sideOn) { stack.position.copy(SIDE_STACK); } else { stack.position.copy(STACK); }
    // pancakes: null hides the plate; n shows n pancakes
    const n = state.pancakes;
    stack.visible = n !== null && n !== undefined;
    if (stack.visible) {
      cakes.forEach((c, i) => { c.visible = i < n; });
      const topY = 0.1 + Math.max(0, n) * CAKE_H;
      butter.position.set(0.05, topY + 0.06, -0.05); syrup.position.set(0, topY + 0.015, 0);
      butter.visible = syrup.visible = n > 0;
    }
    // counter plate: null, 'empty', 'sandwich'
    plate.visible = !!state.plate; sandwich.visible = state.plate === 'sandwich';
    // doors 0..1
    doorPivot2.rotation.y = (state.backDoor ?? 0) * 1.6;      // swings outward
    const pd = state.pantryDoors ?? state.pantryDoor ?? 0;
    for (const { piv, side } of pantryDoors) piv.rotation.y = -side * pd * 1.6;   // swing into the room
    // walls: force one visible/hidden, e.g. { walls: { wall_front: false } } (default: automatic)
    if (state.walls) for (const w of walls) { const v = state.walls[w.obj.name]; w.forced = v === undefined || v === 'auto' ? undefined : v; }
  }
  // real light levels, right before each render: explicit setState({ practicals }) > K.applyLight proxies > time default
  function level(name, timeDefault) { const x = state.practicals?.[name]; return x !== undefined ? Number(x) : proxyLevel(lights[name], timeDefault); }
  onSceneRender(scene, () => {
    if (!group.visible) return;
    const T = TIME[state.time || 'day'];
    for (const [k, L] of Object.entries(internal)) setPractical(L, state.practicals?.[k] ?? T.lv[k] ?? 0);
    const open = Math.max(0, Math.min(1, state.fridgeOpen ?? 0));
    const fl = level('fridge_light', 1) * Math.min(1, open * 3);
    setPractical(fridgeLight, fl); setPractical(fridgeFill, fl); frIn.emissiveIntensity = 0.12 * fl;
    const cl = level('ceiling_light', T.lv.pendantL ?? 0);
    for (const p of pendants) { setPractical(p.L, cl); p.bulbM.emissiveIntensity = 2.5 * cl; }
    setPractical(hoodLight, cl);
    setPractical(pantryLight, level('pantry_light', 0)); setPractical(upLight, level('upstairs_light', T.lv.upstairs ?? 0));
  });
  setState({ time: 'day', fridge: '', pancakes: null, plate: null });

  // world-space helpers for chapters
  const anchors = { pancakeStackTop: () => W(stack.position.x, stack.position.y + 0.1 + (state.pancakes || 0) * 0.11, stack.position.z),
    sideStackTop: () => W(SIDE_STACK.x, SIDE_STACK.y + 0.1 + (state.pancakes || 0) * 0.11, SIDE_STACK.z), plate: W(PLATE.x, PLATE.y, PLATE.z), fridgeLetters: W(-11, 4.6, -8.7) };
  // door helper: setDoor('back_door' | 'pantry' | 'fridge', 0..1)
  const setDoor = (name, u) => setState({ [{ back_door: 'backDoor', pantry: 'pantryDoors', fridge: 'fridgeOpen' }[name] || name]: u });
  return { id: 'kitchen', group, marks, cams, lights, setState, setDoor, state, stairsPath, stairsGait, route, fromStairs, alongRoute, routeLength, sightBlocked,
    seatY: (scale = 1) => STOOL_TOP - 1.5 * scale, STOOL_TOP, ISLAND_TOP, sideStackTop: anchors.sideStackTop, stairFootY: (zWorld) => stairFootY(zWorld - OFFSET.z), anchors, walls: walls.map((w) => w.obj) };
}
