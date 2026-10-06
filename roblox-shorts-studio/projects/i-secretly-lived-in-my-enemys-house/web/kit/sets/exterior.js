// House exterior (Ch1: the back of Max's house at dusk; optional establishing shots by day). World offset (1500, 0, 0).
// Local layout (studs): the back of the house faces +z, its back wall at z -8 (x -15..15), two storeys (eaves y 18) and a
// gable with the round attic window (Skye's attic) facing the garden. The back door (x 6, unlocked, opens inward) with
// a step and a porch lamp; the kitchen window beside it (x 11.5); the garden: lawn, stepping-stone path from the side
// gate (x -10, z 30) in the back fence to the back door, a tree, a shed, bins, a washing line; neighbours beyond the fence.
import { THREE, V, std, glow, box, rbox, cyl, picture, fontText, wallTexture, wallWithHoles,
  markMaker, camMaker, practical, setPractical, canvasTexture, rng } from './common_c.js';

export const OFFSET = V(1500, 0, 0);
const EAVES = 18, PEAK = 27, HX = 15;

export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_exterior'; group.position.copy(OFFSET); scene.add(group);
  const M = markMaker(OFFSET), C = camMaker(OFFSET);
  const PI = Math.PI;

  // ---------------------------------------------------------------- ground
  const grassTex = canvasTexture(1024, 1024, (g, w) => {
    g.fillStyle = '#5f9a3e'; g.fillRect(0, 0, w, w); const r = rng(6);
    for (let i = 0; i < 9000; i++) { const s = 2 + r() * 5; g.fillStyle = `hsl(${85 + r() * 22},${38 + r() * 18}%,${30 + r() * 15}%)`; g.fillRect(r() * w, r() * w, s, s * 2.2); }
  });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), std('#ffffff', { map: grassTex, roughness: 0.95 }));
  ground.rotation.x = -PI / 2; ground.receiveShadow = true; group.add(ground);

  // ---------------------------------------------------------------- the house
  const house = new THREE.Group(); group.add(house);
  const brickTex = canvasTexture(512, 512, (g, w) => {
    g.fillStyle = '#e6d6b8'; g.fillRect(0, 0, w, w); const r = rng(2);
    for (let y = 0; y < w; y += 32) { g.fillStyle = 'rgba(120,100,70,0.25)'; g.fillRect(0, y, w, 3); for (let x = (y / 32) % 2 ? 0 : -48; x < w; x += 96) { g.fillRect(x, y, 3, 32); g.fillStyle = `rgba(255,255,255,${r() * 0.08})`; g.fillRect(x + 3, y + 3, 93, 29); g.fillStyle = 'rgba(120,100,70,0.25)'; } }
  });
  brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.repeat.set(5, 3);
  const wallM = std('#ffffff', { map: brickTex, roughness: 0.85 });
  const trimM = std('#ffffff', { roughness: 0.5 });
  // back wall with holes: door x 4..8 (y 0..8.2), kitchen window x 9.5..13.5 (y 4..8.5), living-room window x -12..-4 (y 2.5..8.5),
  // upstairs windows x -10..-5 and 5..10 (y 11..15.5)
  const holes = [{ x0: 19, x1: 23, y0: 0.6, y1: 8.8 }, { x0: 24.5, x1: 28.5, y0: 4.2, y1: 8.6 }, { x0: 3, x1: 11, y0: 2.6, y1: 8.6 },
    { x0: 5, x1: 10, y0: 11, y1: 15.5 }, { x0: 20, x1: 25, y0: 11, y1: 15.5 }];
  const backWall = wallWithHoles(30, EAVES, 0.6, wallM, holes); backWall.position.set(-HX, 0, -8.3); house.add(backWall);
  // gable (triangle) above the eaves with the round attic window
  const gs = new THREE.Shape(); gs.moveTo(-HX - 0.3, 0); gs.lineTo(HX + 0.3, 0); gs.lineTo(0, PEAK - EAVES); gs.lineTo(-HX - 0.3, 0);
  const hole = new THREE.Path(); hole.absarc(0, 4.2, 1.8, 0, PI * 2, true); gs.holes.push(hole);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: 0.6, bevelEnabled: false }), std('#f1ece0', { roughness: 0.8 }));
  gable.position.set(0, EAVES, -8.6); gable.castShadow = gable.receiveShadow = true; house.add(gable);
  // round attic window: frame ring, cross, glass that can glow
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.25, 10, 32), trimM); ring.position.set(0, EAVES + 4.2, -7.9); house.add(ring);
  box(3.6, 0.18, 0.2, trimM, 0, EAVES + 4.2, -7.9, house); box(0.18, 3.6, 0.2, trimM, 0, EAVES + 4.2, -7.9, house);
  const atticGlassM = glow('#2a3550', 0); const atticGlass = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), atticGlassM); atticGlass.position.set(0, EAVES + 4.2, -8.0); house.add(atticGlass);
  // side walls and the rest of the volume (depth 26)
  box(0.6, EAVES, 26, wallM, -HX, EAVES / 2, -21, house); box(0.6, EAVES, 26, wallM, HX, EAVES / 2, -21, house);
  box(30, EAVES, 0.6, wallM, 0, EAVES / 2, -34, house);
  // roof: two slabs along z, ridge at x 0
  const roofM = std('#7a3b2e', { roughness: 0.75 });
  const slope = Math.atan2(PEAK - EAVES, HX), slab = Math.hypot(HX + 1.6, PEAK - EAVES + 1);
  for (const s of [-1, 1]) {
    const r = box(slab, 0.6, 28, roofM, s * (HX / 2 + 0.6), EAVES + (PEAK - EAVES) / 2 + 0.2, -20.5, house);
    r.rotation.z = -s * slope;
  }
  box(0.8, 0.8, 28, std('#5e2c22'), 0, PEAK + 0.5, -20.5, house);
  box(31.4, 0.5, 0.6, trimM, 0, EAVES, -7.7, house);                          // eaves board
  // chimney
  box(2.6, 8, 2.6, std('#a35a3e'), -9, PEAK - 1, -24, house);
  // windows: frames, glass that glows warm when the lights are on, curtains
  const winGlass = [];
  function win(x0, x1, y0, y1, color = '#ffcf7a') {
    const w = x1 - x0, h = y1 - y0, cx = -HX + (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const gm = glow(color, 0); gm.userData.color = color;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), gm); glass.position.set(cx, cy, -8.45); house.add(glass); winGlass.push(gm);
    box(w + 0.6, 0.35, 0.9, trimM, cx, y0 - 0.15, -7.75, house); box(w + 0.4, 0.3, 0.4, trimM, cx, y1 + 0.1, -7.95, house);
    box(0.25, h, 0.4, trimM, cx - w / 2 - 0.05, cy, -7.95, house); box(0.25, h, 0.4, trimM, cx + w / 2 + 0.05, cy, -7.95, house);
    box(0.15, h, 0.2, trimM, cx, cy, -8.0, house); box(w, 0.15, 0.2, trimM, cx, cy, -8.0, house);
    for (const s of [-1, 1]) box(w * 0.22, h * 0.95, 0.1, std('#c95a5a', { roughness: 0.9 }), cx + s * w * 0.38, cy, -8.6, house);
  }
  win(24.5, 28.5, 4.2, 8.6); win(3, 11, 2.6, 8.6, '#ffd79a'); win(5, 10, 11, 15.5, '#ffe2b0'); win(20, 25, 11, 15.5, '#9ad7ff');
  // a dark interior behind the door (seen when it opens): a hall box with a warm light
  const hall = new THREE.Group(); hall.position.set(6, 0, -12.5); house.add(hall);
  box(5, 9, 0.3, std('#d9c9a8'), 0, 4.5, -3.8, hall); box(0.3, 9, 8, std('#cbb994'), -2.5, 4.5, 0, hall); box(0.3, 9, 8, std('#cbb994'), 2.5, 4.5, 0, hall);
  box(5, 0.2, 8, std('#bfae8f'), 0, 0.6, 0, hall); box(5, 0.3, 8, std('#efe6d2'), 0, 9, 0, hall);
  const hallLight = practical(new THREE.PointLight('#ffd7a0', 0, 12, 2), 10); hallLight.position.set(0, 7.5, 0); hall.add(hallLight);
  // the back door: hinge at x 4 (left as seen from the garden), opens inward (-z)
  const doorPiv = new THREE.Group(); doorPiv.position.set(4.0, 0.6, -8.3); house.add(doorPiv);
  const doorM = std('#4f7f6f', { roughness: 0.5 });
  box(3.9, 3.9, 0.3, doorM, 2.0, 1.95, 0, doorPiv); box(0.5, 4.3, 0.3, doorM, 0.3, 6.05, 0, doorPiv); box(0.5, 4.3, 0.3, doorM, 3.7, 6.05, 0, doorPiv); box(3.9, 0.4, 0.3, doorM, 2, 8.0, 0, doorPiv);
  const dgl = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.9), glow('#ffcf7a', 0)); dgl.position.set(2.0, 6.0, 0.02); doorPiv.add(dgl); winGlass.push(dgl.material); dgl.material.userData.color = '#ffcf7a';
  box(0.12, 3.9, 0.12, doorM, 2.0, 6.0, 0.05, doorPiv); box(3.0, 0.12, 0.12, doorM, 2.0, 6.0, 0.05, doorPiv);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), std('#d8d8d8', { metalness: 0.8, roughness: 0.25 })); knob.position.set(3.5, 3.9, 0.25); doorPiv.add(knob);
  box(4.6, 0.4, 0.6, trimM, 6, 9.0, -7.9, house); box(0.3, 8.4, 0.6, trimM, 3.85, 4.8, -7.9, house); box(0.3, 8.4, 0.6, trimM, 8.15, 4.8, -7.9, house);
  // step + doormat + porch lamp
  box(6, 0.6, 3, std('#a9a49a', { roughness: 0.9 }), 6, 0.3, -6.6, house);
  box(3, 0.05, 1.6, std('#8a5a3a', { roughness: 0.95 }), 6, 0.63, -6.6, house);
  const lampM = glow('#ffd28a', 0);
  box(0.6, 0.9, 0.6, std('#2a2a2a'), 9.2, 8.2, -7.7, house); const lampG = box(0.4, 0.6, 0.4, lampM, 9.2, 8.2, -7.6, house); lampG.castShadow = false;
  const porch = practical(new THREE.PointLight('#ffcf8a', 0, 18, 1.8), 30); porch.position.set(9.2, 8.0, -6.6); house.add(porch);
  // bins + hose reel against the wall
  for (const [x, c] of [[12.6, '#2f5f3a'], [14.0, '#2f4f8a']]) { rbox(1.3, 2.6, 1.3, 0.1, std(c, { roughness: 0.6 }), x, 1.3, -6.9, house); box(1.4, 0.15, 1.45, std(c), x, 2.65, -6.9, house); }
  cyl(0.7, 0.7, 0.4, std('#3c8a3c'), -2, 2, -7.7, house).rotation.x = PI / 2;
  // drainpipe
  cyl(0.15, 0.15, EAVES, std('#e8e8e8'), -14.5, EAVES / 2, -7.7, house, 8);

  // ---------------------------------------------------------------- garden
  const gardenG = new THREE.Group(); group.add(gardenG);
  // patio
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), std('#c4bba9', { roughness: 0.9 })); patio.rotation.x = -PI / 2; patio.position.set(-4, 0.03, -5); patio.receiveShadow = true; gardenG.add(patio);
  // stepping stones gate (-10, 29) -> door (6, -5)
  const stoneM = std('#b9b3a6', { roughness: 0.9 });
  for (let i = 0; i <= 12; i++) { const u = i / 12; const s = cyl(0.9, 0.95, 0.12, stoneM, -10 + 16 * u + Math.sin(i * 1.7) * 0.4, 0.06, 28 - 33 * u, gardenG, 14); s.scale.z = 0.8; s.rotation.y = i; }
  // fence: back (z 31) with a gate at x -12..-8, sides at x +-30
  const fenceM = std('#b98a5a', { roughness: 0.85 });
  for (let x = -30; x <= 30; x += 1.25) { if (x > -12.2 && x < -7.8) continue; box(1.0, 5, 0.3, fenceM, x, 2.5, 31, gardenG); }
  box(60, 0.4, 0.3, std('#a0744a'), 0, 4, 30.8, gardenG); box(60, 0.4, 0.3, std('#a0744a'), 0, 1.2, 30.8, gardenG);
  for (const sx of [-30, 30]) for (let z = -8; z <= 31; z += 1.25) box(0.3, 5, 1.0, fenceM, sx, 2.5, z, gardenG);
  // the gate (open a little), hinged at x -12
  const gatePiv = new THREE.Group(); gatePiv.position.set(-12, 0, 31); gardenG.add(gatePiv);
  for (let x = 0.5; x < 4; x += 1.1) box(0.9, 4.6, 0.3, fenceM, x, 2.6, 0, gatePiv);
  box(4, 0.35, 0.35, std('#a0744a'), 2, 1.3, -0.1, gatePiv); box(4, 0.35, 0.35, std('#a0744a'), 2, 3.9, -0.1, gatePiv);
  // tree, shed, washing line, flower bed, a football
  const tree = new THREE.Group(); tree.position.set(18, 0, 14); gardenG.add(tree);
  cyl(0.8, 1.1, 9, std('#6b4a30', { roughness: 0.9 }), 0, 4.5, 0, tree);
  const crownM = std('#3f7a33', { roughness: 0.85, flatShading: true });
  for (const [x, y, z, r] of [[0, 11, 0, 5], [-3, 9.5, 1, 3.5], [3, 10, -1, 3.8], [0.5, 13.5, 0.5, 3.4]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), crownM); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; tree.add(c); }
  const shed = new THREE.Group(); shed.position.set(-22, 0, 10); gardenG.add(shed);
  box(8, 7, 7, std('#8a6a4a', { roughness: 0.8 }), 0, 3.5, 0, shed);
  const sr = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3, 4), std('#4a4a4a')); sr.rotation.y = PI / 4; sr.scale.set(1, 1, 0.9); sr.position.set(0, 8.5, 0); sr.castShadow = true; shed.add(sr);
  box(2.4, 5, 0.2, std('#6a4a32'), 1.5, 2.5, 3.55, shed);
  for (const x of [-20, 4]) cyl(0.12, 0.12, 7, std('#9a9a9a'), x, 3.5, 20, gardenG, 8);
  const line = cyl(0.03, 0.03, 24, std('#e8e8e8'), -8, 6.8, 20, gardenG, 4); line.rotation.z = PI / 2;
  for (const [x, c] of [[-14, '#2fa8c8'], [-11, '#ff8a8a'], [-7, '#ffffff'], [-3, '#f2d13a']]) { const t = box(2, 2.2, 0.06, std(c, { roughness: 0.9, side: THREE.DoubleSide }), x, 5.7, 20, gardenG); t.rotation.z = (x % 3) * 0.02; }
  const bed = new THREE.Group(); gardenG.add(bed);
  box(14, 0.6, 2.4, std('#5a3a22', { roughness: 0.95 }), -6, 0.3, -2.8, bed);
  const fr = rng(14); for (let i = 0; i < 22; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), std(['#ff4f6a', '#ffd23f', '#ffffff', '#b06aff'][i % 4])); f.position.set(-12.5 + fr() * 13, 1.1 + fr() * 0.5, -2.8 + (fr() - 0.5) * 1.6); bed.add(f); }
  // two pumpkins on the step (October)
  for (const [x, s] of [[3.0, 1], [2.0, 0.7]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.75 * s, 16, 12), std('#ff8a1f', { roughness: 0.6 })); p.scale.y = 0.75; p.position.set(x, 0.6 * s + 0.6, -6.2); p.castShadow = true; gardenG.add(p); cyl(0.08, 0.1, 0.35, std('#3a6a2a'), x, 1.15 * s + 0.6, -6.2, gardenG, 6); }
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), std('#ffffff', { flatShading: true })); ball.position.set(8, 0.6, 12); ball.castShadow = true; gardenG.add(ball);
  // beyond the fence: neighbours' houses and trees
  const far = new THREE.Group(); group.add(far);
  for (const [x, z, c, rc] of [[-40, 52, '#cfd8e6', '#5b6e8a'], [-6, 56, '#e9d8b6', '#8a5b4a'], [30, 52, '#d8e6cf', '#6e5b8a'], [-62, 10, '#e6d0cf', '#7a3b2e'], [62, 0, '#dcd2bc', '#4a5a6a']]) {
    const hgrp = new THREE.Group(); hgrp.position.set(x, 0, z); far.add(hgrp);
    box(22, 14, 16, std(c), 0, 7, 0, hgrp);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(16, 8, 4), std(rc)); rf.rotation.y = PI / 4; rf.scale.z = 0.75; rf.position.y = 18; rf.castShadow = true; hgrp.add(rf);
    for (const wx of [-6, 6]) { const gm = glow('#ffd79a', 0); gm.userData.color = '#ffd79a'; winGlass.push(gm); const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), gm); w.position.set(wx, 9, x > 50 || x < -50 ? 8.05 : -8.05); w.rotation.y = x > 50 || x < -50 ? 0 : PI; hgrp.add(w); }
  }
  const tr = rng(19);
  for (let i = 0; i < 14; i++) {
    const t = new THREE.Group(); const a = -1 + i / 13 * 2; t.position.set(a * 70, 0, 40 + tr() * 30); far.add(t);
    const sc = 0.8 + tr() * 0.6; cyl(0.6 * sc, 0.8 * sc, 6 * sc, std('#6b4a30'), 0, 3 * sc, 0, t);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(4 * sc, 1), std(`hsl(${20 + tr() * 90},45%,35%)`, { flatShading: true })); c.position.y = 8 * sc; c.castShadow = true; t.add(c);
  }

  // ---------------------------------------------------------------- marks / cams
  const toward = (x0, z0, x1, z1) => Math.atan2(x1 - x0, z1 - z0);
  const marks = {
    gate: M(-10, 0, 29.5, toward(-10, 29.5, 6, -5), { note: 'just inside the gate, facing the back door' }),
    gate_outside: M(-10, 0, 34, PI, { note: 'outside the fence at the gate' }),
    path_mid: M(-2, 0, 12, toward(-2, 12, 6, -5), { note: 'halfway up the garden path' }),
    path_near: M(3.8, 0, 1.5, toward(3.8, 1.5, 6, -5), { note: 'near the house, looking round before the door' }),
    porch_step: M(6, 0.6, -5.8, PI, { note: 'on the step facing the back door (feet at y 0.6)' }),
    back_door: M(6, 0.6, -7.2, PI, { note: 'at the door, hand on the handle' }),
    inside_door: M(6, 0.6, -10.2, PI, { note: 'just inside, slipping in (feet at y 0.6)' }),
    bins_hide: M(13.2, 0, -4.8, PI * 0.75, { note: 'beside the bins, ducked' }),
    lawn_center: M(0, 0, 10, PI, { note: 'middle of the lawn facing the house' }),
    back_step: M(6, 0.6, -5.6, 0, { note: 'on the step just outside the back door, facing the garden (Ch2: eating the pancake)' }),
  };
  marks.yard_start = marks.gate;
  const cams = {
    dusk_wide: C([2, 15, 50], [0, 7, -2], 50, { note: 'the back of the house and the garden; the gate bottom left' }),
    gate: C([-4.5, 5.2, 21.5], [-10, 4.4, 30], 44, { note: 'from the garden toward the gate: Skye slipping in, facing camera' }),
    garden_follow: C([-12, 5.5, 18], [4, 4.5, -4], 44, { note: 'along the path to the back door' }),
    back_door: C([14, 5, 5], [6, 4.6, -7], 42, { note: 'the back door 3/4 from the right; whoever stands at back_door' }),
    back_door_ots: C([7.4, 6.4, -1.8], [5.6, 4.6, -8.4], 44, { note: 'behind Skye at the door as it opens' }),
    back_door_low: C([1.0, 2.0, 1.0], [6.5, 4.2, -8], 46, { note: 'low angle: the door, the porch lamp and the pumpkins' }),
    from_inside: C([6, 5.2, -14.5], [6, 4, 0], 50, { note: 'from the hallway inside out through the open door (needs backDoor > 0.6)' }),
    establishing_day: C([-34, 26, 66], [0, 10, -10], 42, { note: 'high wide of the house and the garden (day establishing)' }),
    attic_window: C([2, 20, 14], [0, EAVES + 4.2, -8], 34, { note: 'the round attic window' }),
    back_step_mcu: C([8.6, 4.9, -1.2], [6, 4.6, -5.6], 34, { note: '3/4 MCU on whoever stands at back_step' }),
  };
  Object.assign(cams, { back_door_wide: cams.garden_follow, back_door_close: cams.back_door_ots });

  // ---------------------------------------------------------------- state
  const state = {};
  const lights = { porch, hall: hallLight };
  function setState(s = {}) {
    if (s.chapter !== undefined) { const ch = ({ 1: { time: 'dusk', backDoor: 0 }, 2: { time: 'predawn', backDoor: 0, windows: 0.6, porchLight: 0 } })[s.chapter]; if (!ch) return; Object.assign(state, ch, { chapter: s.chapter }); }
    for (const k of Object.keys(s)) if (k !== 'chapter') state[k] = s[k];
    const t = state.time || 'day';
    const winOn = state.windows ?? (t === 'dusk' ? 0.8 : t === 'night' || t === 'predawn' ? 1 : 0);
    for (const m of winGlass) { m.emissiveIntensity = 1.6 * winOn; m.color.set(winOn > 0 ? m.userData.color : '#3a4a60'); m.emissive.set(winOn > 0 ? m.userData.color : '#000000'); }
    atticGlassM.emissiveIntensity = state.atticGlow ?? 0; if (state.atticGlow) atticGlassM.emissive.set('#9fdcff');
    const pl = state.porchLight ?? (t === 'dusk' || t === 'night' ? 1 : 0);
    setPractical(porch, pl); lampM.emissiveIntensity = 2.2 * pl;
    setPractical(hallLight, state.hallLight ?? winOn);
    doorPiv.rotation.y = (state.backDoor ?? 0) * 1.5;       // positive = swings inward (into the house)
    gatePiv.rotation.y = (state.gate ?? 0.35) * 1.4;        // swings into the garden
  }
  setState({ time: 'day' });
  return { id: 'exterior', group, marks, cams, lights, setState, state, walls: [] };
}
