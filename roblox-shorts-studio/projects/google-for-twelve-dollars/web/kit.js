// He Bought Google For 12 Dollars: sets and props built in code (no pack accessories, so the fit check has nothing to fit).
// World layout (studs, floor y 0). Each place is far from the others so they never share a frame:
//   BEDROOM  origin. Room x -11..11, z -9..9, ceiling y 11. Desk against the north wall (z -9), Leo sits facing -z.
//   GLOBE    (0, 0, -600). A small blocky Earth (radius GLOBE_R) in space; Leo stands on the top.
//   OFFICE   (120, 0, 0). Google's security office: two desks with monitors, a big wall screen, the REWARD button.
//   SCHOOL   (-160, 0, 0). A bright schoolhouse with palms, outdoors, daytime.
// Screens and the cheque are live canvas textures: call .draw(fn) every frame (fn(ctx, w, h)).
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../web/lib/world.js';
import { roundedCylinder } from '../../../web/lib/rig.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
const cyl = (rt, rb, h, m, n = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), m); c.castShadow = c.receiveShadow = true; return c; };

export const BEDROOM = V(0, 0, 0), GLOBE = V(0, 0, -600), OFFICE = V(120, 0, 0), SCHOOL = V(-160, 0, 0);
export const GLOBE_R = 9;

// A canvas texture you redraw each frame.
export function liveTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return { canvas: c, ctx: c.getContext('2d'), texture: t, w, h, draw(fn) { fn(this.ctx, w, h); t.needsUpdate = true; } };
}

function plank(base = '#a47148', n = 8) {
  const t = canvasTexture(512, 512, (x, w, h) => {
    const r = rng(5); x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(${r() > 0.5 ? '70,40,15' : '255,220,170'},${0.07 + r() * 0.08})`; x.fillRect(0, i * (h / n), w, h / n);
      x.fillStyle = 'rgba(50,25,10,.35)'; x.fillRect(0, i * (h / n), w, 3); x.fillRect(((i * 197) % 400) + 40, i * (h / n), 3, h / n);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- a laptop (origin at the base centre, screen faces +z when unrotated) ----------
// Screen 3.0 x 1.9 studs, its own live texture (1024 x 648).
export function laptop() {
  const g = new THREE.Group(), body = std('#2b2f38', { roughness: 0.35, metalness: 0.5 });
  g.add(box(3.4, 0.14, 2.3, body, 0, 0.07, 0));
  const keys = canvasTexture(512, 320, (x, w, h) => {
    x.fillStyle = '#1b1e25'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) { x.fillStyle = '#3a3f4a'; x.fillRect(14 + c * 37.5, 14 + r * 38, 31, 31); }
    x.fillStyle = '#3a3f4a'; x.fillRect(150, 214, 210, 31); x.fillStyle = '#2a2e36'; x.fillRect(180, 262, 150, 50);
  });
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.9), std('#ffffff', { map: keys, roughness: 0.6 })); kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.145, 0.1); g.add(kb);
  const lid = new THREE.Group(); lid.position.set(0, 0.14, -1.12); lid.rotation.x = -0.22; g.add(lid);   // tilted back a little
  lid.add(box(3.4, 2.25, 0.1, body, 0, 1.12, -0.05));
  const screen = liveTexture(1024, 648);
  const sm = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false });
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(3.08, 1.95), sm); sp.position.set(0, 1.14, 0.006); lid.add(sp);
  return { group: g, lid, screenMesh: sp, screen };
}

// ---------- the bedroom ----------
export function bedroom(scene) {
  const g = new THREE.Group(); g.name = 'bedroom'; g.position.copy(BEDROOM); scene.add(g);
  const ft = plank('#9c6b45'); ft.repeat.set(4, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), std('#ffffff', { map: ft, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wallM = std('#5d6aa8', { roughness: 0.9 }), ceilM = std('#e8e6f0', { roughness: 0.95 }), trimM = std('#f2f2f7', { roughness: 0.5 });
  // walls: north (z -9) has the window, east (x 11) the door
  g.add(box(22.6, 11, 0.6, wallM, 0, 5.5, 9.3), box(0.6, 11, 18.6, wallM, -11.3, 5.5, 0));
  g.add(box(0.6, 11, 5.6, wallM, 11.3, 5.5, -6.4), box(0.6, 11, 7.6, wallM, 11.3, 5.5, 5.4), box(0.6, 3.6, 5.2, wallM, 11.3, 9.2, -1.4));   // door gap z -4..1.2, y 0..7.4
  g.add(box(10, 11, 0.6, wallM, -6.3, 5.5, -9.3), box(4.6, 11, 0.6, wallM, 8.7, 5.5, -9.3), box(8.2, 3, 0.6, wallM, 2.3, 1.5, -9.3), box(8.2, 2.8, 0.6, wallM, 2.3, 9.6, -9.3));   // window x -1.8..6.4, y 3..8.2
  g.add(box(22.6, 0.4, 18.6, ceilM, 0, 11.2, 0));
  for (const [w, x, z, d] of [[22, 0, 8.95, 0.1], [22, 0, -8.95, 0.1], [0.1, -10.95, 0, 18], [0.1, 10.95, 0, 18]]) g.add(box(w, 0.5, d, trimM, x, 0.25, z));
  // the window: night sky, moon and a few city lights, with a frame
  const night = canvasTexture(820, 520, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#08102a'); gr.addColorStop(1, '#1b2a5c'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; x.fillRect(r() * w, r() * h * 0.7, 2, 2); }
    x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(640, 120, 52, 0, 7); x.fill(); x.fillStyle = '#0d1636'; x.beginPath(); x.arc(664, 104, 48, 0, 7); x.fill();
    for (let i = 0; i < 14; i++) { const bw = 40 + r() * 50, bh = 60 + r() * 150, bx = i * 60 - 10; x.fillStyle = '#0b1230'; x.fillRect(bx, h - bh, bw, bh); for (let k = 0; k < 10; k++) if (r() > 0.55) { x.fillStyle = 'rgba(255,214,120,.85)'; x.fillRect(bx + 6 + (k % 3) * 12, h - bh + 10 + Math.floor(k / 3) * 22, 6, 9); } }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.2), new THREE.MeshBasicMaterial({ map: night, toneMapped: false })); win.position.set(2.3, 5.6, -9.25); g.add(win);
  const day = canvasTexture(820, 520, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5aa8ff'); gr.addColorStop(1, '#d5ecff'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.9)'; for (const [cx, cy, s] of [[180, 140, 1], [560, 90, 0.8], [700, 220, 0.6]]) for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(cx + k * 40 * s, cy + (k % 2) * 12 * s, 38 * s, 0, 7); x.fill(); }
    const r = rng(9); for (let i = 0; i < 14; i++) { const bw = 40 + r() * 50, bh = 60 + r() * 150; x.fillStyle = '#8aa0c8'; x.fillRect(i * 60 - 10, h - bh, bw, bh); }
  });
  const fm = std('#f4f4f8', { roughness: 0.4 });
  g.add(box(8.6, 0.3, 0.5, fm, 2.3, 3.0, -9.0), box(8.6, 0.3, 0.5, fm, 2.3, 8.2, -9.0), box(0.3, 5.4, 0.5, fm, -1.8, 5.6, -9.0), box(0.3, 5.4, 0.5, fm, 6.4, 5.6, -9.0), box(0.2, 5.2, 0.4, fm, 2.3, 5.6, -9.0));
  // wall clock (east of the window) - hands set by setClock()
  const clock = new THREE.Group(); clock.position.set(8.4, 7.4, -8.95); g.add(clock);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), std('#ffffff', { roughness: 0.4, map: canvasTexture(256, 256, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#223'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(128 + Math.sin(a) * 100 - 5, 128 - Math.cos(a) * 100 - 5, 10, 10); } }) }));
  clock.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.12, 10, 40), std('#e63946')); clock.add(rim);
  const hand = (len, w) => { const p = new THREE.Group(); const m = box(w, len, 0.04, std('#16182a'), 0, len / 2, 0.05); m.castShadow = false; p.add(m); clock.add(p); return p; };
  const hourH = hand(0.6, 0.12), minH = hand(0.9, 0.08);
  // desk + chair (Leo faces -z): desk centre z -6.6 (z -8.0..-5.2), Leo's seat root z -5.05, chair centre z -4.5
  const deskM = std('#c99a63', { roughness: 0.5 }), legM = std('#3a3f4a', { roughness: 0.4, metalness: 0.4 });
  const desk = new THREE.Group(); desk.position.set(0, 0, -6.6); g.add(desk);
  desk.add(box(6.4, 0.25, 2.8, deskM, 0, 3.1, 0));
  for (const [a, b] of [[-3, -1.25], [3, -1.25], [-3, 1.25], [3, 1.25]]) desk.add(box(0.2, 3.0, 0.2, legM, a, 1.5, b));
  desk.add(box(1.8, 2.4, 2.4, std('#b3874f'), 2.1, 1.6, 0));                                                         // drawers
  const lap = laptop(); lap.group.position.set(-0.4, 3.225, -6.5); g.add(lap.group);
  const mug = new THREE.Mesh(roundedCylinder(0.24, 0.5, 0.05, 20), std('#ffd23f')); mug.position.set(1.9, 3.48, -6.6); g.add(mug);
  const lampM = std('#1d1f27', { roughness: 0.4 });
  const lamp = new THREE.Group(); lamp.position.set(-2.6, 3.22, -6.8); g.add(lamp);
  lamp.add(cyl(0.45, 0.5, 0.15, lampM), (() => { const s = cyl(0.06, 0.06, 2, lampM, 8); s.position.y = 1; return s; })(), (() => { const s = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.7, 16, 1, true), std('#ff7a59', { side: THREE.DoubleSide })); s.position.set(0.3, 2, 0.2); s.rotation.z = -0.6; return s; })());
  const chairM = std('#e63946', { roughness: 0.5 });
  const chair = new THREE.Group(); chair.position.set(0, 0, -4.5); g.add(chair);
  chair.add(box(2.0, 0.22, 1.9, chairM, 0, 1.7, 0), box(2.0, 2.4, 0.22, chairM, 0, 3.0, 1.05));
  chair.add(cyl(0.12, 0.12, 1.6, legM, 8)); chair.children[chair.children.length - 1].position.y = 0.8; chair.add(cyl(0.9, 0.9, 0.12, legM, 5));
  // bed (west), rug, poster, shelf with a trophy-ish box
  const bed = new THREE.Group(); bed.position.set(-7.6, 0, 3.5); g.add(bed);
  bed.add(box(5, 1.6, 9, std('#8a5a33'), 0, 0.8, 0), box(4.8, 0.8, 8.8, std('#f2f2f7'), 0, 2.0, 0), box(4.9, 0.5, 6, std('#3a86ff'), 0, 2.55, 1.4), box(3.4, 0.7, 1.8, std('#ffffff'), 0, 2.7, -3.3), box(5, 3.8, 0.4, std('#8a5a33'), 0, 1.9, -4.6));
  const rug = new THREE.Mesh(new THREE.CircleGeometry(4, 40), std('#ffb703', { roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(2, 0.02, 3); g.add(rug);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), std('#ffffff', { map: canvasTexture(300, 400, (x, w, h) => { x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd23f'; x.font = '64px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('CODE', w / 2, 170); x.fillText('ALL', w / 2, 240); x.fillText('NIGHT', w / 2, 310); }) }));
  poster.rotation.y = Math.PI / 2; poster.position.set(-10.95, 6.2, -4.5); g.add(poster);
  const shelf = box(4, 0.25, 1.2, deskM, -7, 6.5, -8.4); g.add(shelf);
  for (let i = 0; i < 5; i++) g.add(box(0.35, 1.1 + (i % 2) * 0.3, 0.9, std(['#e63946', '#3a86ff', '#ffd23f', '#2a9d8f', '#8338ec'][i]), -8.4 + i * 0.45, 7.2, -8.4));
  // door (opens inward, hinged at z 1.2)
  const doorPivot = new THREE.Group(); doorPivot.position.set(11.0, 0, 1.2); g.add(doorPivot);
  const door = box(0.25, 7.4, 5.2, std('#c0763a'), 0, 3.7, -2.6); doorPivot.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), std('#ffd23f', { metalness: 0.7, roughness: 0.3 })); knob.position.set(-0.2, 3.6, -4.7); doorPivot.add(knob);
  // lights: the screen glow on Leo, a ceiling lamp (off at night), moonlight through the window
  const glow = new THREE.PointLight('#bfdcff', 0, 14, 1.6); glow.position.set(-0.4, 4.6, -5.6); g.add(glow);
  const ceiling = new THREE.PointLight('#fff1d6', 0, 40, 1.2); ceiling.position.set(0, 10.2, 0); g.add(ceiling);
  const moon = new THREE.SpotLight('#7f9cff', 0, 40, 0.6, 0.6, 1); moon.position.set(2.3, 9, -14); moon.target.position.set(0, 0, 2); g.add(moon, moon.target);
  return {
    group: g, laptop: lap, desk, chair, door: doorPivot, glow, ceilingLight: ceiling, moon, win, night, day,
    setClock(h, m) { minH.rotation.z = -m / 60 * Math.PI * 2; hourH.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; },
    setDay(isDay) { win.material.map = isDay ? day : night; },
  };
}

// ---------- the globe in space ----------
export function globe(scene) {
  const g = new THREE.Group(); g.name = 'globe'; g.position.copy(GLOBE); scene.add(g);
  const tex = canvasTexture(1024, 512, (x, w, h) => {
    x.fillStyle = '#2f80ed'; x.fillRect(0, 0, w, h);
    const r = rng(17);
    const blob = (cx, cy, s) => { x.fillStyle = '#4caf50'; for (let i = 0; i < 26; i++) x.fillRect(cx + (r() - 0.5) * s * 2, cy + (r() - 0.5) * s, s * (0.3 + r() * 0.5), s * (0.2 + r() * 0.4)); };
    for (const [cx, cy, s] of [[200, 170, 70], [260, 330, 55], [520, 150, 80], [560, 300, 60], [760, 190, 90], [860, 360, 45]]) blob(cx, cy, s);
    x.fillStyle = '#f2f6ff'; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 26, w, 26);
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R, 48, 32), std('#ffffff', { map: tex, roughness: 0.75 })); earth.castShadow = earth.receiveShadow = true; g.add(earth);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R * 1.06, 48, 32), new THREE.MeshBasicMaterial({ color: '#7fc4ff', transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false })); g.add(atmo);
  // stars: a big shell of points
  const r = rng(4), pts = [];
  for (let i = 0; i < 1500; i++) { const u = r() * 2 - 1, a = r() * 6.283, d = 300 + r() * 100; pts.push(Math.sqrt(1 - u * u) * Math.cos(a) * d, u * d, Math.sqrt(1 - u * u) * Math.sin(a) * d); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false })); g.add(stars);
  // the flag Leo plants: a pole and a cloth with OWNER: LEO / google.com
  const flag = new THREE.Group(); g.add(flag);
  const pole = cyl(0.08, 0.08, 6, std('#d9dde3', { metalness: 0.6, roughness: 0.3 }), 8); pole.position.y = 3; flag.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2, 12, 4), std('#ffffff', { side: THREE.DoubleSide, map: canvasTexture(512, 296, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#e63946'; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 18, w, 18);
    x.fillStyle = '#16182a'; x.textAlign = 'center'; x.font = '62px "Luckiest Guy"'; x.fillText('OWNER: LEO', w / 2, 120); x.font = '800 54px Montserrat'; x.fillStyle = '#2f80ed'; x.fillText('google.com', w / 2, 210);
  }) }));
  cloth.position.set(1.95, 4.8, 0); flag.add(cloth);
  const base = cloth.geometry.attributes.position.array.slice();
  return {
    group: g, earth, flag, cloth,
    wave(t) { const p = cloth.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x0 = base[i * 3]; p.setZ(i, Math.sin(x0 * 1.6 - t * 6) * 0.18 * (x0 + 1.9) / 3.8); } p.needsUpdate = true; cloth.geometry.computeVertexNormals(); },
  };
}

// ---------- the security office ----------
// Two desks side by side facing -z (Max left, Mia right), monitors on them, the big SECURITY wall screen behind the
// monitors (z -9), the REWARD button on Mia's desk. Seats: SEAT.Max / SEAT.Mia (root positions, heading PI).
export const OFFICE_SEAT = { Max: V(OFFICE.x - 3.4, 0, OFFICE.z - 1.0), Mia: V(OFFICE.x + 3.4, 0, OFFICE.z - 1.0) };
export function office(scene) {
  const g = new THREE.Group(); g.name = 'office'; g.position.copy(OFFICE); scene.add(g);
  const ft = canvasTexture(512, 512, (x, w, h) => { x.fillStyle = '#c9ced8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(80,90,110,.35)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } });
  ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(5, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 26), std('#ffffff', { map: ft, roughness: 0.4 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wallM = std('#eef1f6', { roughness: 0.85 }), accent = std('#34a853', { roughness: 0.6 }), dark = std('#1d2230', { roughness: 0.4 });
  g.add(box(30, 12, 0.6, wallM, 0, 6, -9.5), box(0.6, 12, 22, wallM, -15, 6, 1), box(0.6, 12, 22, wallM, 15, 6, 1), box(30.6, 0.4, 22, std('#f7f8fb'), 0, 12.2, 1));
  g.add(box(30, 0.6, 0.2, accent, 0, 0.3, -9.15));
  // wall screen
  const wall = liveTexture(1280, 560);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshBasicMaterial({ map: wall.texture, toneMapped: false })); ws.position.set(0, 7.2, -9.15); g.add(ws);
  g.add(box(16.6, 7.6, 0.2, dark, 0, 7.2, -9.3));
  // desks, monitors, chairs
  const deskM = std('#f2f2f2', { roughness: 0.35 }), legM = std('#5a6478', { roughness: 0.4, metalness: 0.4 });
  const monitors = {};
  for (const [n, sx] of [['Max', -3.4], ['Mia', 3.4]]) {
    const d = new THREE.Group(); d.position.set(sx, 0, -3.1); g.add(d);
    d.add(box(5.6, 0.25, 2.2, deskM, 0, 3.1, 0)); for (const [a, b] of [[-2.6, -0.95], [2.6, -0.95], [-2.6, 0.95], [2.6, 0.95]]) d.add(box(0.18, 3.0, 0.18, legM, a, 1.5, b));
    const mon = liveTexture(800, 480);
    const m = new THREE.Group(); m.position.set(0, 3.22, -0.5); d.add(m);
    m.add(box(0.5, 0.12, 0.5, dark, 0, 0.06, 0), box(0.15, 0.9, 0.15, dark, 0, 0.5, 0), box(3.3, 2.05, 0.14, dark, 0, 1.95, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.86), new THREE.MeshBasicMaterial({ map: mon.texture, toneMapped: false })); scr.position.set(0, 1.95, 0.075); m.add(scr);
    monitors[n] = { tex: mon, group: m };
    d.add(box(1.8, 0.08, 0.6, dark, 0, 3.27, 0.4));                                                                    // keyboard
    const ch = new THREE.Group(); ch.position.set(sx, 0, -1.0 + 0.55); g.add(ch);
    ch.add(box(2.0, 0.22, 1.9, std('#2b2d42'), 0, 1.7, 0), box(2.0, 2.4, 0.22, std('#2b2d42'), 0, 3.0, 1.05), (() => { const c = cyl(0.12, 0.12, 1.6, legM, 8); c.position.y = 0.8; return c; })());
  }
  // the REWARD button (on Mia's desk, right of her keyboard)
  const btn = new THREE.Group(); btn.position.set(5.6, 3.22, -2.6); g.add(btn);
  btn.add(cyl(0.6, 0.65, 0.3, dark, 24)); btn.children[0].position.y = 0.15;
  const cap = cyl(0.45, 0.45, 0.3, new THREE.MeshStandardMaterial({ color: '#e63946', emissive: '#e63946', emissiveIntensity: 0.4, roughness: 0.3 }), 24); cap.position.y = 0.42; btn.add(cap);
  // plants and a water cooler
  for (const x of [-12.5, 12.5]) { const p = new THREE.Group(); p.position.set(x, 0, -7.5); g.add(p); p.add(cyl(0.8, 0.6, 1.6, std('#e9e1cf'))); p.children[0].position.y = 0.8; for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), std('#3c9a3f')); l.position.set(Math.sin(i) * 0.5, 2.2 + (i % 3) * 0.5, Math.cos(i) * 0.5); l.castShadow = true; p.add(l); } }
  const lamp = new THREE.PointLight('#ffffff', 0, 40, 1.1); lamp.position.set(0, 11, 0); g.add(lamp);
  return { group: g, wall, monitors, button: cap, lamp };
}

// ---------- the free school ----------
export function school(scene) {
  const g = new THREE.Group(); g.name = 'school'; g.position.copy(SCHOOL); scene.add(g);
  const gt = canvasTexture(256, 256, (x, w, h) => { x.fillStyle = '#d9b77c'; x.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '160,120,70' : '240,215,160'},0.25)`; x.fillRect(r() * w, r() * h, 2, 2); } });
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), std('#ffffff', { map: gt, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const grassM = std('#5fae4a', { roughness: 0.9 });
  for (const [x, z, w, d] of [[-20, 8, 18, 10], [20, 8, 18, 10]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), grassM); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.02, z); p.receiveShadow = true; g.add(p); }
  // the schoolhouse: one storey, bright walls, a pitched roof, big doors at the front (z = 0), FREE SCHOOL sign
  const wall = std('#ffd6a5', { roughness: 0.8 }), roofM = std('#e76f51', { roughness: 0.7 }), trim = std('#ffffff', { roughness: 0.5 });
  g.add(box(24, 9, 12, wall, 0, 4.5, -6));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 9.2, 4.5, 4, 1), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(1.9, 1, 0.95); roof.position.set(0, 11.25, -6); roof.castShadow = true; g.add(roof);
  g.add(box(6.4, 7.0, 0.3, std('#2a9d8f'), 0, 3.5, 0.05));                                                               // doorway (dark teal)
  const doors = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(s * 3.2, 0, 0.25); g.add(p); p.add(box(3.1, 6.8, 0.2, std('#264653'), -s * 1.55, 3.4, 0)); return p; });
  for (const x of [-8.5, 8.5]) { g.add(box(4, 3.4, 0.3, trim, x, 5, 0.05)); g.add(box(3.4, 2.8, 0.32, std('#9fd0f5', { roughness: 0.1 }), x, 5, 0.08)); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.2), std('#ffffff', { map: canvasTexture(1000, 220, (x, w, h) => { x.fillStyle = '#2a9d8f'; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = '#ffffff'; x.font = '120px "Luckiest Guy"'; x.textAlign = 'center'; x.fillText('FREE SCHOOL', w / 2, 150); }) }));
  sign.position.set(0, 8.4, 0.25); g.add(sign);
  // palms and bushes
  const trunk = std('#9c6b45'), leaf = std('#3f9e3a', { side: THREE.DoubleSide });
  for (const [x, z, s] of [[-17, 3, 1], [17, 3, 1.1], [-26, -10, 1.2], [26, -9, 0.9], [-9, 14, 0.8]]) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
    for (let i = 0; i < 6; i++) { const b = box(0.8, 1.6, 0.8, trunk, Math.sin(i * 0.4) * 0.3, 0.8 + i * 1.6, 0); b.rotation.z = 0.05 * i; p.add(b); }
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 5), leaf); l.position.set(Math.sin(i / 7 * 6.28) * 2, 10, Math.cos(i / 7 * 6.28) * 2); l.rotation.set(-1.1, i / 7 * 6.28, 0, 'YXZ'); l.castShadow = true; p.add(l); }
  }
  // a little bunting over the doors
  const cols = ['#e63946', '#ffd23f', '#2a9d8f', '#3a86ff', '#ff7a59'];
  for (let i = 0; i < 11; i++) { const u = (i + 0.5) / 11; const sh = new THREE.Shape(); sh.moveTo(-0.35, 0); sh.lineTo(0.35, 0); sh.lineTo(0, -0.8); sh.closePath(); const f = new THREE.Mesh(new THREE.ShapeGeometry(sh), std(cols[i % 5], { side: THREE.DoubleSide })); f.position.set(-5 + 10 * u, 7.6 - 0.8 * Math.sin(Math.PI * u), 0.4); g.add(f); }
  return { group: g, doors };
}

// ---------- the giant cheque (origin at its centre; 4.6 x 2.2 studs; front faces +z) ----------
export function cheque() {
  const g = new THREE.Group();
  const tex = liveTexture(1150, 550);
  const m = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.2, 0.06), [std('#e9f5ec'), std('#e9f5ec'), std('#e9f5ec'), std('#e9f5ec'), new THREE.MeshStandardMaterial({ map: tex.texture, roughness: 0.7 }), std('#e9f5ec')]);
  m.castShadow = true; g.add(m);
  return { group: g, tex };
}
