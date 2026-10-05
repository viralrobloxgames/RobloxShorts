// Say Their Name: the set. A spiral obby tower in a lava sea, Roblox style.
// Steps spiral twice round a pillar (12 steps, 3.5 studs apart); step 0 and step 11 both face the camera (+Z).
// Mia's plank sticks out of step 7 over the lava. The top holds the prize: a coin pile under a "1,000,000 COINS" board.
import * as THREE from 'three';
import { part, canvasTexture, cloud, rng } from '../../../web/lib/world.js';
import { roundedCylinder, mat } from '../../../web/lib/rig.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const R = 7.5, DY = 3.5, STEPS = 12, DA = (720 / 11) * Math.PI / 180;
export const ang = (i) => (i - 11) * DA;
export const stepTop = (i) => DY * (i + 1);
export const TOPY = DY * 13;                                            // 45.5: the top platform's surface
export const PILLAR_R = 5.3, TOP_R = 5.8;
// Standing spot on step i, `off` studs along the tangent (+ = anticlockwise seen from above).
export function stepPos(i, off = 0) {
  const a = ang(i);
  return V(Math.sin(a) * R + Math.cos(a) * off, stepTop(i), Math.cos(a) * R - Math.sin(a) * off);
}
export const radial = (i) => { const a = ang(i); return V(Math.sin(a), 0, Math.cos(a)); };
export const tangent = (i) => { const a = ang(i); return V(Math.cos(a), 0, -Math.sin(a)); };
// The plank: out of step 7, along its radial direction, from r = 9.8 to r = 21.
export const LEDGE_STEP = 7, LEDGE_R = [9.6, 21], LEDGE_W = 2.2;
export const ledgeAt = (r) => radial(LEDGE_STEP).multiplyScalar(r).setY(stepTop(LEDGE_STEP));
export const BASE = { x: [-15, 15], z: [-16, 26] };                     // the ground island (top at y = 0)
export const LAVA_Y = -0.45;

export function lavaTexture() {
  return canvasTexture(512, 512, (x, w, h) => {
    const r = rng(5); x.fillStyle = '#ff4a12'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const cx = r() * w, cy = r() * h, rad = 10 + r() * 46;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const hot = r() > 0.5; g.addColorStop(0, hot ? 'rgba(255,214,80,.9)' : 'rgba(170,20,0,.7)'); g.addColorStop(1, 'rgba(255,80,20,0)');
      x.fillStyle = g; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { x.beginPath(); x.arc(cx + ox, cy + oy, rad, 0, 7); x.fill(); }
    }
  });
}

function boardTexture(lines, { w = 1024, h = 300, bg = '#152435', accent = '#ffd23f' } = {}) {
  return canvasTexture(w, h, (x, W, H) => {
    x.fillStyle = bg; x.fillRect(0, 0, W, H); x.strokeStyle = accent; x.lineWidth = 16; x.strokeRect(12, 12, W - 24, H - 24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach(([text, color, size, y]) => { x.font = `${size}px "Luckiest Guy"`; x.fillStyle = color; x.fillText(text, W / 2, H * y); });
  });
}
function board(scene, tex, w, h, pos, ry, post = 0) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.3), mat('1f2a44', 0.5)); back.castShadow = true; g.add(back);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.3 }));
  face.position.z = 0.16; g.add(face);
  if (post) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, post, 0.35), mat('6b4a2e', 0.7)); p.position.set(s * (w / 2 - 0.6), -h / 2 - post / 2, 0); p.castShadow = true; g.add(p); }
  g.position.copy(pos); g.rotation.y = ry; scene.add(g); return g;
}

export async function tower(scene, packItem) {
  const r = rng(11), out = {};
  // Lava sea and the ground island.
  const lavaTex = lavaTexture(); lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping; lavaTex.repeat.set(30, 30);
  const lavaMat = new THREE.MeshStandardMaterial({ map: lavaTex, emissive: '#ff5a1a', emissiveMap: lavaTex, emissiveIntensity: 1.25, roughness: 0.6 });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), lavaMat); lava.rotation.x = -Math.PI / 2; lava.position.y = LAVA_Y; lava.receiveShadow = true; scene.add(lava);
  out.lavaTex = lavaTex;
  const bw = BASE.x[1] - BASE.x[0], bd = BASE.z[1] - BASE.z[0];
  const base = part(bw, 6, bd, '#5fb44a', { studs: true }); base.position.set((BASE.x[0] + BASE.x[1]) / 2, 0, (BASE.z[0] + BASE.z[1]) / 2); scene.add(base);
  const rimC = '#6b7385';
  const skirt = part(bw + 0.6, 1.2, bd + 0.6, rimC); skirt.position.set(base.position.x, -0.25, base.position.z); scene.add(skirt);
  // Pillar, steps, top.
  const pillarMat = mat('a3a9b6', 0.45, { clearcoat: 0.3 });
  const pillar = new THREE.Mesh(roundedCylinder(PILLAR_R, TOPY - 0.6, 0.15, 64), pillarMat); pillar.position.y = (TOPY - 0.6) / 2; pillar.castShadow = pillar.receiveShadow = true; scene.add(pillar);
  for (let k = 1; k < 13; k++) {                                       // darker bands every level
    const band = new THREE.Mesh(roundedCylinder(PILLAR_R + 0.04, 0.35, 0.05, 64), mat('7c8394', 0.5)); band.position.y = DY * k - 0.6; band.receiveShadow = true; scene.add(band);
  }
  const cols = ['#e63946', '#3a86ff', '#ffbe0b', '#06d6a0', '#8338ec', '#fb5607'];
  out.steps = [];
  for (let i = 0; i < STEPS; i++) {
    const p = part(6, 1, 5, cols[i % 6], { studs: true }); const a = ang(i);
    p.position.copy(stepPos(i)); p.rotation.y = a; scene.add(p); out.steps.push(p);
  }
  const top = new THREE.Mesh(roundedCylinder(TOP_R, 1, 0.12, 64), mat('ffc83d', 0.35, { metalness: 0.2, clearcoat: 0.5 }));
  top.position.y = TOPY - 0.5; top.castShadow = top.receiveShadow = true; scene.add(top);
  // The plank over the lava (and two little brackets under it).
  const len = LEDGE_R[1] - LEDGE_R[0], mid = ledgeAt((LEDGE_R[0] + LEDGE_R[1]) / 2);
  const plank = part(LEDGE_W, 0.6, len, '#b07a46', { studs: false, rough: 0.7 }); plank.position.copy(mid); plank.rotation.y = ang(LEDGE_STEP); scene.add(plank);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 5), mat('6b4a2e', 0.7)); brace.position.copy(ledgeAt(LEDGE_R[0] + 2).add(V(0, -1.6, 0))); brace.rotation.y = ang(LEDGE_STEP); brace.rotateX(-0.6); brace.castShadow = true; scene.add(brace);
  // The prize on top: coin pile, trophy and the board.
  out.pile = await packItem('props', 'coin_pile');
  const pb = new THREE.Box3().setFromObject(out.pile), ps = pb.getSize(V(0, 0, 0));
  out.pileScale = 3.4 / Math.max(ps.x, ps.z); out.pileBox = ps;
  out.pile.scale.setScalar(out.pileScale); out.pile.position.set(0, TOPY, -1.6); scene.add(out.pile);
  out.prizeTex = boardTexture([['1,000,000', '#ffd23f', 150, 0.4], ['COINS', '#ffffff', 110, 0.78]], { h: 420 });
  out.prize = board(scene, out.prizeTex, 10, 4.1, V(0, TOPY + 6.2, -3.4), 0, 4);
  // The rule board by the spawn, and a spawn pad.
  const ruleTex = boardTexture([['SAY A NAME', '#ffffff', 120, 0.33], ['= THEY TELEPORT TO YOU', '#8BE36B', 76, 0.72]], { h: 380 });
  out.rule = board(scene, ruleTex, 10, 3.7, V(-9.5, 6.2, 9.5), 0.55, 4.3);
  try { const sp = await packItem('map', 'spawn_location'); const b = new THREE.Box3().setFromObject(sp); sp.position.set(0, -b.min.y - 0.95, 19.5); scene.add(sp); } catch (e) { /* optional */ }
  // Sky dressing: clouds and a couple of far islands.
  for (let i = 0; i < 26; i++) { const c = cloud(300 + i, 9 + r() * 12); const a = r() * Math.PI * 2, d = 170 + r() * 200; c.position.set(Math.cos(a) * d, 25 + r() * 70, Math.sin(a) * d - 60); scene.add(c); }
  for (let i = 0; i < 4; i++) { try { const isl = await packItem('map', 'island_large'); const a = -2.2 + i * 1.1, d = 230 + r() * 80; isl.position.set(Math.cos(a) * d, -12 + r() * 20, Math.sin(a) * d); isl.scale.setScalar(1.4 + r()); scene.add(isl); } catch (e) { break; } }
  return out;
}
