// Copy the Crown: the set. A round studded arena floating over a lava sea, Roblox style.
// Arena radius 13 studs, top at y = 0; the lava sea is 6 studs below. The spawn pad sits on the +Z rim, the million-coin
// board hangs over the lava past the +X rim (Max admires it from the edge), the rule board stands far off past -Z.
import * as THREE from 'three';
import { part, canvasTexture, cloud, rng, spawnPad } from '../../../web/lib/world.js';
import { roundedCylinder, mat } from '../../../web/lib/rig.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const R_ARENA = 13, LAVA_Y = -6;
export const PAD = V(-1.5, 0, 11.5);
export const COIN_BOARD = V(21, 7.5, 3);

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

// The arena floor: grey studded plastic with a ring of coloured tiles round the rim (a clear "edge" line).
function floorTexture() {
  return canvasTexture(2048, 2048, (x, W, H) => {
    const c = W / 2, rad = W / 2;
    x.fillStyle = '#b8bfcc'; x.fillRect(0, 0, W, H);
    const cols = ['#e63946', '#ffbe0b', '#3a86ff', '#06d6a0'];
    for (let i = 0; i < 32; i++) {                                  // rim tiles, 1.6 studs deep
      x.beginPath(); x.moveTo(c, c); x.arc(c, c, rad, (i / 32) * Math.PI * 2, ((i + 1) / 32) * Math.PI * 2); x.closePath();
      x.fillStyle = cols[i % 4]; x.fill();
    }
    x.beginPath(); x.arc(c, c, rad * (11.4 / 13), 0, Math.PI * 2); x.fillStyle = '#b8bfcc'; x.fill();
    x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(c, c, rad * (11.4 / 13), 0, Math.PI * 2); x.stroke();
    // A big crown painted in the middle.
    x.save(); x.translate(c, c); x.scale(2.6, 2.6); x.fillStyle = 'rgba(255,200,61,.5)';
    x.beginPath(); x.moveTo(-90, 50); x.lineTo(-100, -50); x.lineTo(-50, -5); x.lineTo(0, -70); x.lineTo(50, -5); x.lineTo(100, -50); x.lineTo(90, 50); x.closePath(); x.fill();
    x.restore();
    // Studs: soft highlight dots every stud (2048 px = 26 studs).
    const step = W / 26;
    for (let i = 0; i < 26; i++) for (let j = 0; j < 26; j++) {
      const px = (i + 0.5) * step, py = (j + 0.5) * step;
      x.beginPath(); x.arc(px, py, step * 0.27, 0, 7); x.fillStyle = 'rgba(255,255,255,.16)'; x.fill();
      x.beginPath(); x.arc(px + step * 0.05, py + step * 0.06, step * 0.27, 0, 7); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 3; x.stroke();
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

export async function arena(scene, packItem) {
  const r = rng(11), out = {};
  const lavaTex = lavaTexture(); lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping; lavaTex.repeat.set(30, 30);
  const lavaMat = new THREE.MeshStandardMaterial({ map: lavaTex, emissive: '#ff5a1a', emissiveMap: lavaTex, emissiveIntensity: 1.25, roughness: 0.6 });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), lavaMat); lava.rotation.x = -Math.PI / 2; lava.position.y = LAVA_Y; lava.receiveShadow = true; scene.add(lava);
  out.lavaTex = lavaTex;
  // The arena: a thick disc with a studded top and a darker underside.
  const ftex = floorTexture();
  const side = mat('6b7385', 0.5), top = new THREE.MeshPhysicalMaterial({ map: ftex, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R_ARENA, R_ARENA, 2.4, 96, 1, false), [side, top, side]);
  disc.position.y = -1.2; disc.castShadow = disc.receiveShadow = true; scene.add(disc);
  const under = new THREE.Mesh(new THREE.ConeGeometry(R_ARENA * 0.92, 9, 48), mat('5a6272', 0.6)); under.rotation.x = Math.PI; under.position.y = -2.4 - 4.5; under.castShadow = true; scene.add(under);
  const lip = new THREE.Mesh(roundedCylinder(R_ARENA + 0.12, 0.5, 0.1, 96), mat('2b3242', 0.5)); lip.position.y = -2.2; scene.add(lip);
  // Spawn pad on the +Z rim.
  const pad = spawnPad(3.4); pad.position.copy(PAD).add(V(0, 0.02, 0)); scene.add(pad);
  // The prize: "1,000,000 COINS" over the lava past the +X rim, a coin pile floating under it.
  out.prizeTex = boardTexture([['1,000,000', '#ffd23f', 150, 0.4], ['COINS', '#ffffff', 110, 0.78]], { h: 420 });
  out.prize = board(scene, out.prizeTex, 10, 4.1, COIN_BOARD, -Math.PI / 2);
  out.pile = await packItem('props', 'coin_pile');
  const pb = new THREE.Box3().setFromObject(out.pile), ps = pb.getSize(V(0, 0, 0));
  out.pileScale = 3.6 / Math.max(ps.x, ps.z); out.pile.scale.setScalar(out.pileScale);
  out.pile.position.copy(COIN_BOARD).add(V(0.4, -5.2, 0)); scene.add(out.pile);
  const ledge = part(4.4, 0.6, 4.4, '#ffc83d', { studs: true }); ledge.position.copy(COIN_BOARD).add(V(0.4, -5.2, 0)); scene.add(ledge);
  // The rule board far past -Z, above the lava.
  const ruleTex = boardTexture([['EVERYONE COPIES', '#ffffff', 112, 0.33], ['THE CROWN', '#ffd23f', 130, 0.72]], { h: 380 });
  out.rule = board(scene, ruleTex, 16, 6, V(0, 10, -30), 0);
  // Sky dressing: clouds and far islands.
  for (let i = 0; i < 26; i++) { const c = cloud(300 + i, 9 + r() * 12); const a = r() * Math.PI * 2, d = 170 + r() * 200; c.position.set(Math.cos(a) * d, 20 + r() * 70, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 5; i++) { try { const isl = await packItem('map', 'island_large'); const a = i * 1.26 + 0.3, d = 200 + r() * 80; isl.position.set(Math.cos(a) * d, -14 + r() * 18, Math.sin(a) * d); isl.scale.setScalar(1.4 + r()); scene.add(isl); } catch (e) { break; } }
  return out;
}
