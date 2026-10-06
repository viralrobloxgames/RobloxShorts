// Upstairs hallway (kit-sets-a). World offset (300, 0, 0), floor y 0, studs. Chapters 2, 6, 8.
// Local layout (hall floor x -16.5..12, z -5..4.5, ceiling y 10; the camera side is +z, its wall hidden by default):
//   left end wall (x -16.5): the linen closet (opening z -3.5..-0.5, door hinged at z -3.5, opens outward a crack so
//     two can peek down the hall at the hatch). back wall (z -5), left to right: Max's door (x -9, lamplight can show under it), Lily's door (x 6), a landing rail, the top of the stairs.
//   ceiling: the attic hatch (x -4..0, z -1.5..1.5), hinged at x -4; it swings down and a ladder slides out to the
//     floor (foot at x ~0); above it a dark attic void (the attic itself is its own set at (600,0,0)).
//   a moonlit window in the back wall at x 1. Right end: stairs down along +x from x 12 (z -5..-0.6)
//     toward the kitchen, a landing (z -0.4..4.5) to x 17.5 with a banister along z -0.5.
// Heading convention: forward = (sin h, 0, cos h). Marks and cams are in world coordinates.
import * as THREE from 'three';
import { canvasTexture, rng } from '../../../../../web/lib/world.js';
import { V, std, box, cyl, sph, plane, texMat, LG, floorMat, wallMat, door, doorFrame } from './bedroom.js';

export const OFFSET = V(300, 0, 0);
const H = 10, HATCH_X0 = -4, HATCH_LEN = 4, HATCH_ANGLE = THREE.MathUtils.degToRad(68);
const LADDER_LEN = H / Math.sin(HATCH_ANGLE); // hinge to floor

export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_hallway'; group.position.copy(OFFSET); scene.add(group);
  const W = (x, y, z) => V(x, y, z).add(OFFSET);
  const wallM = wallMat('#e6d3a8', '#dcc79a', 2, [6, 1]), trimM = std('#f3efe6', { roughness: 0.6 }), woodM = std('#9c6b43', { roughness: 0.7 }), darkWood = std('#6b4428', { roughness: 0.7 });
  const walls = {};
  const mk = (name, ...parts) => { const g = new THREE.Group(); g.name = 'wall_' + name; parts.forEach((p) => { p.castShadow = false; g.add(p); }); group.add(g); walls[name] = g; return g; };

  // ---- floors ----
  group.add(box(28.5, 0.4, 9.5, floorMat('#946642', 4, [6, 2]), -2.25, -0.2, -0.25, false)); // x -16.5..12
  group.add(box(5.5, 0.4, 4.9, floorMat('#946642', 4, [1, 1]), 14.75, -0.2, 2.05, false)); // landing x 12..17.5, z -0.4..4.5
  const runner = box(22, 0.05, 3.2, texMat(512, 64, (c, w, h) => { c.fillStyle = '#7a2e3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8b25a'; c.fillRect(0, 6, w, 4); c.fillRect(0, h - 10, w, 4); }), -3.5, 0.03, 0.6, false); group.add(runner);

  // ---- back wall (z -5) with openings: linen x -16..-13 (y<7.2), Max x -11..-7 (y<7.6), Lily x 4..8 (y<7.6) ----
  const bw = (x0, x1, y0 = 0, y1 = H) => box(x1 - x0, y1 - y0, 0.4, wallM, (x0 + x1) / 2, (y0 + y1) / 2, -5.2);
  mk('back', bw(-16.9, -11), bw(-7, -0.6), bw(2.6, 4), bw(-0.6, 2.6, 0, 4.4), bw(-0.6, 2.6, 7.6), bw(8, 17.9), bw(-11, -7, 7.6), bw(4, 8, 7.6),
    box(10, 12, 0.4, wallM, 12.9, -6, -5.2), // stairwell side continues down
    box(29, 0.6, 0.15, trimM, -2.5, 0.3, -4.95), box(29, 0.25, 0.12, trimM, -2.5, 3.4, -4.95)); // skirting + dado rail
  mk('left', box(0.4, H, 1.9, wallM, -16.9, H / 2, -4.45), box(0.4, H, 5.4, wallM, -16.9, H / 2, 2.2), box(0.4, H - 7.2, 3, wallM, -16.9, (H + 7.2) / 2, -2));
  mk('right', box(0.4, H + 12, 10, wallM, 17.9, H / 2 - 6, -0.3));
  mk('front', box(35, H, 0.4, wallM, 0.5, H / 2, 4.9));
  // ceiling with the hatch hole (x -4..0, z -1.5..1.5)
  const ceilM = std('#f1efe9', { roughness: 0.95 });
  mk('ceiling',
    box(12.9, 0.4, 10, ceilM, -10.45, H + 0.2, -0.25), box(18.1, 0.4, 10, ceilM, 9.05, H + 0.2, -0.25),
    box(4, 0.4, 3.5, ceilM, -2, H + 0.2, -3.25), box(4, 0.4, 3, ceilM, -2, H + 0.2, 3.0),
    box(4.5, 0.12, 0.3, trimM, -2, H - 0.05, -1.6), box(4.5, 0.12, 0.3, trimM, -2, H - 0.05, 1.6), box(0.3, 0.12, 3.5, trimM, -4.1, H - 0.05, 0), box(0.3, 0.12, 3.5, trimM, 0.1, H - 0.05, 0));
  walls.front.visible = false;
  group.userData.walls = walls;
  // the dark attic void above the hatch, with two rafters
  const voidM = std('#1a130d', { roughness: 1 });
  group.add(box(8, 0.3, 7, voidM, -2, H + 4.5, 0, false), box(0.3, 4.5, 7, voidM, -6, H + 2.4, 0, false), box(0.3, 4.5, 7, voidM, 2, H + 2.4, 0, false), box(8, 4.5, 0.3, voidM, -2, H + 2.4, -3.5, false), box(8, 4.5, 0.3, voidM, -2, H + 2.4, 3.5, false));
  for (const x of [-3, -0.8]) group.add(box(0.4, 0.4, 7, std('#5a4027'), x, H + 3.8, 0, false));

  // ---- the attic hatch + pull-down ladder ----
  const hatch = new THREE.Group(); hatch.position.set(HATCH_X0, H - 0.02, 0); group.add(hatch); // pivot at the hinge edge
  const panelM = std('#f1efe9', { roughness: 0.8 }), ladM = std('#c49a62', { roughness: 0.7 });
  hatch.add(box(HATCH_LEN - 0.1, 0.25, 2.9, panelM, HATCH_LEN / 2, -0.12, 0));
  const cord = new THREE.Group(); cord.position.set(HATCH_LEN - 0.5, -0.25, 0); hatch.add(cord);
  cord.add(box(0.04, 1.4, 0.04, std('#e8e2d0'), 0, -0.7, 0, false), sph(0.13, std('#e94d4d'), 0, -1.45, 0));
  const upper = new THREE.Group(); upper.position.y = 0.15; hatch.add(upper); // ladder on the panel's top side: hidden in the attic when shut, toward the climber when open
  const ladderSection = (len) => { const g = new THREE.Group(); for (const s of [-1, 1]) g.add(box(len, 0.25, 0.18, ladM, len / 2, 0, s * 1.0)); for (let x = 0.5; x < len - 0.2; x += 1.0) g.add(box(0.35, 0.12, 2.0, ladM, x, 0.05, 0)); return g; };
  upper.add(ladderSection(HATCH_LEN));
  const L2 = LADDER_LEN - HATCH_LEN, lower = ladderSection(L2); lower.position.y = 0.0; upper.add(lower);
  function setHatch(f = 0) {
    const fp = THREE.MathUtils.clamp(f / 0.6, 0, 1), fe = THREE.MathUtils.clamp((f - 0.6) / 0.4, 0, 1);
    const ease = (x) => x * x * (3 - 2 * x);
    hatch.rotation.z = -HATCH_ANGLE * ease(fp);
    lower.position.x = HATCH_LEN - L2 + L2 * ease(fe); // slides out of the top section toward the floor
    lower.visible = fp > 0.02;
    cord.visible = fp < 0.98;
    hatchGlow.intensity = hatchGlowK * fp;
  }
  // a point on the ladder for climbing: u 0 = floor, 1 = hinge (ceiling). The root goes on the rung, facing the ladder (-x).
  const hinge = V(HATCH_X0, H, 0), foot = V(HATCH_X0 + LADDER_LEN * Math.cos(HATCH_ANGLE), 0, 0);
  const outward = V(Math.sin(HATCH_ANGLE), Math.cos(HATCH_ANGLE), 0); // perpendicular to the ladder, toward the climber
  function ladderPoint(u, standoff = 0.55) { const p = foot.clone().lerp(hinge, u).addScaledVector(outward, standoff); p.y = Math.max(0, p.y); return { pos: p.add(OFFSET), heading: -Math.PI / 2 }; }

  // ---- doors ----
  const signMax = { w: 2.2, h: 1.2, draw: (c, w, h) => { c.fillStyle = '#1f2a44'; c.fillRect(0, 0, w, h); LG(c, 'MAX', w / 2, h * 0.38, 58, '#ffd23f'); LG(c, 'KEEP OUT!', w / 2, h * 0.78, 30, '#ff5a5a'); } };
  const signLily = { w: 2.0, h: 1.3, draw: (c, w, h) => { c.fillStyle = '#ffd1e6'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffb3d1'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(20 + i * 36, i % 2 ? 22 : h - 22, 10, 0, 7); c.fill(); } LG(c, 'LILY', w / 2, h / 2 + 4, 70, '#d63384'); } };
  const fMax = doorFrame(4, 7.6, trimM); fMax.position.set(-9, 0, -5); group.add(fMax);
  const maxDoor = door(3.9, 7.4, '#f3efe6', { sign: signMax }); maxDoor.position.set(-10.95, 0.15, -5); group.add(maxDoor); // hinge x -10.95, leaf toward +x; opens into Max's room (-z)
  const fLily = doorFrame(4, 7.6, trimM); fLily.position.set(6, 0, -5); group.add(fLily);
  const lilyDoor = door(3.9, 7.4, '#f8e8f0', { sign: signLily }); lilyDoor.position.set(4.05, 0.15, -5); group.add(lilyDoor);
  // rooms behind the doors (shallow, so an open door shows something)
  const maxRoomM = wallMat('#7fa8c9', null, 1, [1, 1]), lilyRoomM = wallMat('#f6c6dc', null, 1, [1, 1]);
  group.add(box(5, H, 0.4, maxRoomM, -9, H / 2, -9.5, false), box(0.4, H, 4.5, maxRoomM, -11.5, H / 2, -7.2, false), box(0.4, H, 4.5, maxRoomM, -6.5, H / 2, -7.2, false), box(5, 0.4, 4.5, floorMat('#a8754a', 3, [1, 1]), -9, -0.2, -7.2, false));
  group.add(box(5, H, 0.4, lilyRoomM, 6, H / 2, -9.5, false), box(0.4, H, 4.5, lilyRoomM, 3.5, H / 2, -7.2, false), box(0.4, H, 4.5, lilyRoomM, 8.5, H / 2, -7.2, false), box(5, 0.4, 4.5, floorMat('#b98c5e', 3, [1, 1]), 6, -0.2, -7.2, false));
  // lamplight under Max's door: a bright strip in the gap and a warm spill on the floor; a light inside the room
  const gapM = std('#ffd59a', { emissive: '#ffb860', emissiveIntensity: 0 }); const gap = box(3.9, 0.12, 0.3, gapM, -9, 0.07, -5.05, false); group.add(gap);
  const spillM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, map: canvasTexture(256, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, 0, 4, w / 2, 0, w * 0.55); g.addColorStop(0, 'rgba(255,190,110,1)'); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }) });
  const spill = plane(6.5, 3.2, spillM, -9, 0.06, -3.4); spill.rotation.x = -Math.PI / 2; group.add(spill);
  const roomLight = new THREE.PointLight('#ffc27a', 0, 9, 1.8); roomLight.position.set(-9, 2.5, -7.5); group.add(roomLight);
  const underLight = new THREE.PointLight('#ffb86a', 0, 6, 2); underLight.position.set(-9, 0.4, -4.3); group.add(underLight);

  // ---- linen closet (left end wall: opening z -3.5..-0.5, interior x -20.6..-16.9), door hinged at z -3.5 opening outward (+x) ----
  const linen = new THREE.Group(); group.add(linen);
  const lcM = std('#e9e1cf', { roughness: 0.9 });
  // the inside runs wider than the opening (z -3.9..1.6) so two can stand right behind the crack at z ~-0.5
  linen.add(box(4, H, 0.4, lcM, -18.9, H / 2, -3.9, false), box(4, H, 0.4, lcM, -18.9, H / 2, 1.6, false), box(0.4, H, 5.9, lcM, -20.8, H / 2, -1.15, false), box(4, 0.4, 5.5, floorMat('#946642', 4, [1, 1]), -18.8, -0.2, -1.15, false), box(4, 0.4, 5.9, lcM, -18.9, 8.4, -1.15, false));
  const towelCols = ['#6fb7e0', '#ffffff', '#f2a65a', '#9bd18a', '#e57373', '#f7e08a'];
  for (const y of [5.6, 7.0]) { linen.add(box(1.5, 0.15, 3.4, std('#f6f1e6'), -20.0, y, -2)); for (let i = 0; i < 4; i++) linen.add(box(1.2, 0.55, 0.75, std(towelCols[(i + (y > 6 ? 2 : 0)) % 6], { roughness: 1 }), -20.0, y + 0.35, -3.1 + i * 0.75)); }
  linen.add(box(1.0, 1.4, 1.1, std('#b9a27a'), -20.0, 0.7, -3.2)); // laundry basket
  const fLin = doorFrame(3, 7.2, trimM); fLin.rotation.y = Math.PI / 2; fLin.position.set(-16.9, 0, -2); group.add(fLin);
  const linenDoor = door(2.95, 7.1, '#f3efe6', { knobSide: 1 }); linenDoor.position.set(-16.7, 0.05, -3.48); linenDoor.rotation.y = -Math.PI / 2; group.add(linenDoor); // leaf toward +z when shut
  const linenLight = new THREE.PointLight('#cfd9ff', 0, 6, 2); linenLight.position.set(-18.0, 5.5, -1.5); linen.add(linenLight); // faint, so faces in the gap read

  // ---- stairs down (x 12..17.4, z -5..-0.6), the landing rail, newel posts ----
  const stairM = std('#8a5c38', { roughness: 0.75 }), riserM = std('#f3efe6', { roughness: 0.7 });
  for (let i = 0; i < 6; i++) { const x = 12 + 0.9 * i + 0.45, y = -0.8 * (i + 1); group.add(box(0.95, 0.2, 4.4, stairM, x, y - 0.1, -2.8), box(0.08, 0.8, 4.4, riserM, x - 0.45, y + 0.4, -2.8, false), box(0.9, 0.8 * (i + 1), 4.4, riserM, x, y - 0.4 * (i + 1) - 0.2, -2.8, false)); }
  group.add(box(5.5, 7, 0.3, wallM, 14.75, -3.5, -0.45, false)); // under the landing
  group.add(box(0.4, 14, 4.6, std('#2a1f16'), 17.6, -7.3, -2.8, false)); // the stairwell turns away into the dark
  const rail = new THREE.Group(); group.add(rail);
  rail.add(box(5.6, 0.3, 0.35, darkWood, 14.75, 3.5, -0.45));
  for (let x = 12.4; x < 17.4; x += 0.6) rail.add(box(0.15, 3.4, 0.15, trimM, x, 1.7, -0.45));
  rail.add(box(0.6, 4.2, 0.6, darkWood, 12, 2.1, -0.45), sph(0.35, darkWood, 12, 4.4, -0.45));
  rail.add(box(0.5, 3.8, 0.5, darkWood, 11.9, 1.9, -4.7));
  // a sloping handrail on the wall side down the stairs
  { const hr = box(6.6, 0.22, 0.22, darkWood, 14.6, 0.6, -4.8); hr.rotation.z = -Math.atan2(0.8, 0.9); group.add(hr); }

  // ---- details: window (left end), photos, a side table + plant, a nightlight ----
  const winG = new THREE.Group(); winG.position.set(1, 6, -5); group.add(winG);
  winG.add(box(3.6, 0.25, 0.6, trimM, 0, -1.7, 0.1), box(3.6, 0.25, 0.5, trimM, 0, 1.7, 0), box(0.25, 3.4, 0.5, trimM, -1.7, 0, 0), box(0.25, 3.4, 0.5, trimM, 1.7, 0, 0), box(0.12, 3.2, 0.2, trimM, 0, 0, 0), box(4.0, 0.2, 0.9, trimM, 0, -1.85, 0.3));
  const nightTex = canvasTexture(256, 256, (c, S) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#0c1636'); g.addColorStop(1, '#2a4474'); c.fillStyle = g; c.fillRect(0, 0, S, S); const r = rng(4); c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect(r() * S, r() * S * 0.8, 2, 2); c.fillStyle = '#fff7dc'; c.beginPath(); c.arc(S * 0.7, S * 0.25, 22, 0, 7); c.fill(); });
  const winSky = plane(5, 5, new THREE.MeshBasicMaterial({ map: nightTex }), 1, 6, -6.2); group.add(winSky);
  const photo = (x, y, w, h, col) => { const g = new THREE.Group(); g.add(box(w, h, 0.12, darkWood, 0, 0, 0)); const p = plane(w - 0.3, h - 0.3, texMat(128, Math.round(128 * h / w), (c, cw, ch) => { c.fillStyle = col; c.fillRect(0, 0, cw, ch); c.fillStyle = '#ffe2b8'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cw * (0.25 + i * 0.25), ch * 0.45, cw * 0.09, 0, 7); c.fill(); c.fillRect(cw * (0.25 + i * 0.25) - cw * 0.08, ch * 0.55, cw * 0.16, ch * 0.35); } }), 0, 0, 0.07); g.add(p); g.position.set(x, y, -4.92); group.add(g); };
  photo(-3.5, 6.0, 2.2, 1.6, '#87b5e0'); photo(-1.0, 5.6, 1.4, 1.8, '#9bd18a'); photo(10.2, 6.0, 1.6, 2.0, '#e0a0c0');
  group.add(box(2.6, 0.2, 1.4, woodM, -4.5, 2.8, -4.2), box(0.2, 2.7, 0.2, woodM, -5.6, 1.35, -4.7), box(0.2, 2.7, 0.2, woodM, -3.4, 1.35, -4.7), box(0.2, 2.7, 0.2, woodM, -5.6, 1.35, -3.7), box(0.2, 2.7, 0.2, woodM, -3.4, 1.35, -3.7));
  group.add(cyl(0.45, 0.35, 0.8, std('#d9774a'), 12, -4.0, 3.3, -4.2)); for (let i = 0; i < 5; i++) { const l = sph(0.45, std('#4f9a4a'), -4.0 + Math.sin(i * 1.3) * 0.3, 4.1 + (i % 2) * 0.3, -4.2 + Math.cos(i * 1.3) * 0.3); l.scale.set(0.8, 1.2, 0.8); group.add(l); }
  const nl = box(0.4, 0.4, 0.15, std('#fff3c4', { emissive: '#ffd27a', emissiveIntensity: 0 }), 9.5, 1.2, -4.9); group.add(nl);
  const nlLight = new THREE.PointLight('#ffd27a', 0, 6, 2); nlLight.position.set(9.5, 1.2, -4.4); group.add(nlLight);
  const ceilLamp = new THREE.Group(); ceilLamp.position.set(5.5, H, 0); group.add(ceilLamp);
  const ceilShadeM = std('#fff6e0', { emissive: '#ffe2a8', emissiveIntensity: 0 }); ceilLamp.add(cyl(0.9, 1.1, 0.5, ceilShadeM, 20, 0, -0.3, 0));
  const ceilLight = new THREE.PointLight('#ffe2b0', 0, 30, 1.5); ceilLight.position.set(5.5, H - 1.2, 0); group.add(ceilLight);

  // ---- lights ----
  const moon = new THREE.SpotLight('#9db8ff', 0, 40, 0.55, 0.7, 1.2); moon.position.set(2, 12, -16); moon.target.position.set(-1, 0, 2.5); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.bias = -0.001; group.add(moon, moon.target);
  const moonFill = new THREE.PointLight('#5b74b8', 0, 40, 1.4); moonFill.position.set(-6, 8, 2); group.add(moonFill);
  const hatchGlowK = 6; const hatchGlow = new THREE.PointLight('#8a7a6a', 0, 10, 2); hatchGlow.position.set(-2, H + 1.5, 0); group.add(hatchGlow);
  const lights = { moon, moonFill, underDoor: underLight, maxRoom: roomLight, nightlight: nlLight, ceiling: ceilLight, hatchGlow, linen: linenLight };

  function setMoon(on, k = 1) { const v = on ? k : 0; moon.intensity = 300 * v; moonFill.intensity = 8 * v; }
  function setUnderDoor(on, k = 1) { const v = on ? k : 0; gapM.emissiveIntensity = 2.2 * v; spillM.opacity = 0.55 * v; underLight.intensity = 6 * v; roomLight.intensity = 25 * v; }
  function setNightlight(on) { nl.material.emissiveIntensity = on ? 1.5 : 0; nlLight.intensity = on ? 3 : 0; }
  function setCeiling(on, k = 1) { const v = on ? k : 0; ceilShadeM.emissiveIntensity = 1.2 * v; ceilLight.intensity = 80 * v; }
  function setMaxDoor(f = 0) { maxDoor.rotation.y = f * 1.6; } // opens into Max's room (-z)
  function setLilyDoor(f = 0) { lilyDoor.rotation.y = f * 1.6; }
  function setLinen(f = 0) { linenDoor.rotation.y = -Math.PI / 2 + f * 1.7; linenLight.intensity = f > 0.02 && f < 0.6 ? 1.2 : 0; } // 0 shut, ~0.12 a crack to peek through, 1 wide open (outward, +z)
  setMoon(true); setUnderDoor(false); setNightlight(true); setCeiling(false); setMaxDoor(0); setLilyDoor(0); setLinen(0); setHatch(0);

  // ---- marks (world) ----
  const M = (x, y, z, heading, note) => ({ pos: W(x, y, z), heading, note });
  const lp = ladderPoint(0); const lp1 = ladderPoint(0.55);
  const marks = {
    ladder_foot: M(foot.x + 1.1, 0, 0, -Math.PI / 2, 'at the foot of the ladder, facing it (-x); use ladderPoint(u) for the climb'),
    ladder_mid: { pos: lp1.pos, heading: -Math.PI / 2, note: 'on the ladder halfway (ladderPoint(0.55)); climbing pose by the chapter' },
    hatch_below: M(0.5, 0, 2.6, Math.atan2(-2.5, -2.6), 'under the hatch, looking up at it (Dad with the broom and flashlight, Ch6)'),
    dad_hatch: M(1.2, 0, 2.4, Math.atan2(-3.2, -2.4), 'Dad facing the attic hatch, broom raised, flashlight up (Ch6)'),
    hall_mid: M(0, 0, 1.2, 0, 'middle of the hall facing the camera side'),
    max_door: M(-9, 0, -3.3, Math.PI, 'in front of Max\'s door, facing it'),
    max_door_listen: M(-6.6, 0, -4.3, Math.PI / 2 - 0.3, 'Skye listening at Max\'s door (Ch6): just right of the door, left ear to it, facing +x (face toward the camera side)'),
    max_door_kneel: M(-9.0, 0, -3.6, Math.PI, 'kneeling at Max\'s door to slide the note under (Ch8); chapter poses the kneel'),
    max_door_back: M(-7.0, 0, -1.0, Math.PI - 0.6, 'a few steps back from Max\'s door (Ch8 "backs away")'),
    lily_behind_skye: M(-5.0, 0, -3.6, -Math.PI / 2 - 0.3, 'Lily right behind/beside Skye at Max\'s door, facing her (Ch6 tap on the shoulder)'),
    skye_creep: M(2.5, 0, 1.0, Math.atan2(-11.5, -4.3), 'Skye creeping from the hatch end toward Max\'s door (Ch6 start)'),
    linen_skye: M(-18.1, 0, -0.1, Math.PI / 2 + 0.15, 'inside the linen closet, face at the crack (free edge at z -0.5), looking down the hall'),
    linen_lily: M(-17.4, 0, -0.8, Math.PI / 2 + 0.2, 'Lily in the linen closet in front of/below Skye, peeking too'),
    linen_front: M(-14.5, 0, -1.6, -Math.PI / 2, 'in front of the linen closet door (Lily pulls Skye in from here)'),
    lily_door: M(6, 0, -3.3, Math.PI, 'in front of Lily\'s door, facing it'),
    lily_door_out: M(6, 0, -3.0, 0, 'just out of Lily\'s door, facing the hall'),
    stairs_top: M(11.0, 0, -2.8, Math.PI / 2, 'top of the stairs facing down them (+x, toward the kitchen)'),
    stairs_step2: M(13.35, -1.6, -2.8, Math.PI / 2, 'two steps down, facing down'),
    stairs_up: M(13.35, -1.6, -2.8, -Math.PI / 2, 'two steps down, coming up (facing the hall)'),
    dad_enter: M(11.0, 0, -1.8, -Math.PI / 2 - 0.25, 'Dad arriving at the top of the stairs, facing down the hall (Ch6 flashlight swing)'),
    landing: M(14.5, 0, 2.0, -Math.PI / 2, 'on the landing beside the banister, facing down the hall'),
  };

  // ---- cams (world); hide = walls to hide (front is hidden by default) ----
  const C = (pos, target, fov, hide = [], note = '') => ({ pos: W(...pos), target: W(...target), fov, hide, note });
  const cams = {
    wide: C([-2.0, 8.0, 21.0], [-2.0, 4.0, -3.0], 50, [], 'the whole hall from the open side'),
    wide_to_max_door: C([4.0, 6.2, 9.0], [-9.5, 3.6, -4.0], 46, [], 'down the hall toward Max\'s door (Ch6/Ch8 opening)'),
    wide_to_stairs: C([-12.0, 6.5, 6.5], [9.0, 3.0, -2.0], 46, [], 'down the hall toward the stairs (Dad\'s flashlight arrives from there)'),
    hatch_low: C([6.0, 2.6, 4.2], [-2.0, 8.0, 0.0], 50, [], 'low, looking up at the hatch and ladder (Ch2 hatch eases down)'),
    ladder_ms: C([6.0, 5.0, 8.5], [-0.5, 4.5, 0.0], 44, [], 'the ladder from the side (someone climbing down)'),
    max_door_ms: C([-4.5, 5.2, 5.0], [-9.0, 3.6, -3.6], 42, [], 'Max\'s door and whoever stands at it'),
    max_door_cu: C([-3.4, 4.7, -1.0], [-6.6, 4.4, -4.2], 34, [], 'close on Skye at Max\'s door (max_door_listen)'),
    under_door: C([-7.4, 1.6, -0.6], [-9.0, 0.3, -5.0], 40, [], 'the lamplight under Max\'s door / the note sliding under'),
    two_shot_skye_lily: C([-3.0, 4.8, 3.6], [-6.0, 3.6, -4.0], 42, [], 'Ch6: Skye at the door with Lily behind her'),
    linen_gap: C([-12.6, 4.4, 4.6], [-17.0, 3.8, -0.5], 38, [], 'Ch6: the linen-closet crack with Skye and Lily peeking'),
    linen_pov: C([-19.8, 6.0, -0.8], [1.0, 4.6, 2.0], 46, [], 'Ch6: from inside the linen closet, over Skye, out through the crack at Dad under the hatch (setLinen 0.2-0.3)'),
    dad_ms: C([-4.5, 5.0, 6.5], [1.0, 4.8, 2.2], 42, [], 'Ch6: Dad under the hatch, medium'),
    dad_low: C([-2.4, 1.8, 6.2], [1.0, 6.0, 1.6], 44, [], 'Ch6: Dad from low, broom up, hatch above'),
    stairs_top: C([6.0, 8.0, 1.6], [15.0, -2.0, -2.8], 46, [], 'the top of the stairs'),
  };

  const parts = { hatch, upperLadder: upper, lowerLadder: lower, cord, maxDoor, lilyDoor, linenDoor, gap, spill, rail, runner };

  function setState(state = {}) {
    const ch = state.chapter;
    if (ch !== undefined) { // chapter defaults: Ch2 hatch open (ladder down), Ch6 lamplight under Max's door + hatch shut, Ch8 Max's room lit
      setHatch(ch === 2 ? 1 : 0); setUnderDoor(ch === 6 || ch === 8); setLinen(0);
    }
    if (state.hatch !== undefined) setHatch(state.hatch === 'open' ? 1 : state.hatch === 'shut' ? 0 : state.hatch);
    if (state.underDoor !== undefined) setUnderDoor(state.underDoor);
    if (state.linen !== undefined) setLinen(state.linen);
    if (state.maxDoor !== undefined) setMaxDoor(state.maxDoor);
    if (state.lilyDoor !== undefined) setLilyDoor(state.lilyDoor);
    if (state.moon !== undefined) setMoon(state.moon);
    if (state.ceiling !== undefined) setCeiling(state.ceiling);
    if (state.nightlight !== undefined) setNightlight(state.nightlight);
  }

  function useCam(camera, name) {
    const c = cams[name]; if (!c) throw new Error('hallway: no cam ' + name);
    for (const [k, w] of Object.entries(walls)) w.visible = k !== 'front' && !c.hide.includes(k);
    camera.position.copy(c.pos); camera.fov = c.fov; camera.lookAt(c.target); camera.updateProjectionMatrix();
    return c;
  }

  return { id: 'hallway', group, marks, cams, lights, parts, walls, setState, setHatch, ladderPoint, setMoon, setUnderDoor, setNightlight, setCeiling, setMaxDoor, setLilyDoor, setLinen, useCam };
}
