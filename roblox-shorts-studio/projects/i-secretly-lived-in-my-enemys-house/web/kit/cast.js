// kit-cast: the four characters and the extras of "I Secretly Lived In My Enemy's House For A Week".
//   loadCast(scene) -> { skye, max, dad, lily, extras: [4] }   (every face in FACES preloaded for everyone)
//   dress(actor, id | [ids], on = true)                       (every wardrobe id of source/boundary_sheet.md; synchronous)
//   speak(actor, baseFace, t, words)                           (talking / mouth_o on the actor's word timings)
//   makeTeddy(), holdTeddy(lily, mode), makeSheetBunch()
// Wardrobe is painted into each character's R6 atlas (128 px per stud, the pack's own layout), so clothes follow the
// bones exactly and nothing can poke through. Only the sheet, the backpack and the glow bands are meshes, each parented
// to the bone it moves with. Heading convention: actor.root.rotation.y = h, forward = (sin h, 0, cos h).
import * as THREE from 'three';
import { loadRobloxCharacter, packTexture, wear } from '../../../../web/lib/robloxPack.js';
import { roundedBox } from '../../../../web/lib/rig.js';

export const FACES = ['scared', 'suspicious', 'scheming', 'nervous', 'happy', 'annoyed', 'shocked', 'smug', 'surprised', 'determined',
  'crying', 'sad', 'shouting', 'laugh', 'talking', 'mouth_o', 'neutral'];
export const WARDROBE = ['skye_hoodie', 'skye_sheet', 'backpack', 'max_school', 'max_pjs', 'dad_cardigan', 'dad_apron', 'dad_robe',
  'lily_day', 'lily_pjs', 'extras'];
// Caption speaker labels (captions.json) of each character; speak() only moves the mouth on these words (never on VO).
export const SPEAKER = { Skye: 'SKYE', Max: 'MAX', Leo: 'DAD', Mia: 'LILY' };
export const SCALE = { skye: 1, max: 1, dad: 1.12, lily: 0.78, extra: 1 };
export const COLORS = { skyeHair: '#ff7fbf', maxHair: '#342724', dadHair: '#3a2a22', lilyHair: '#16131a', glow: '#59ff6a' };

// ---------- atlas layout (assets/roblox_pack/tools/build_characters_local.py) ----------
const ATLAS = 1024;
const LAYOUT = {
  Torso: { R: [0, 0, 128, 256], F: [128, 0, 256, 256], L: [384, 0, 128, 256], B: [512, 0, 256, 256], U: [0, 896, 256, 128], D: [256, 896, 256, 128] },
  'Right Arm': { L: [0, 256, 128, 256], B: [128, 256, 128, 256], R: [256, 256, 128, 256], F: [384, 256, 128, 256], U: [0, 768, 128, 128], D: [128, 768, 128, 128] },
  'Left Arm': { F: [512, 256, 128, 256], L: [640, 256, 128, 256], B: [768, 256, 128, 256], R: [896, 256, 128, 256], U: [256, 768, 128, 128], D: [384, 768, 128, 128] },
  'Right Leg': { L: [0, 512, 128, 256], B: [128, 512, 128, 256], R: [256, 512, 128, 256], F: [384, 512, 128, 256], U: [512, 768, 128, 128], D: [640, 768, 128, 128] },
  'Left Leg': { F: [512, 512, 128, 256], L: [640, 512, 128, 256], B: [768, 512, 128, 256], R: [896, 512, 128, 256], U: [768, 768, 128, 128], D: [896, 768, 128, 128] },
};
const HEAD_SWATCH = [512, 896, 128, 128];
const ARMS = ['Right Arm', 'Left Arm'], LEGS = ['Right Leg', 'Left Leg'], SIDES = ['F', 'L', 'B', 'R'];
const BODY_MESHES = ['Head', 'Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'];

// ---------- canvas painting helpers ----------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
let NOISE = null;
function noisePattern(ctx) {
  if (!NOISE) {
    NOISE = canvas(128, 128); const g = NOISE.getContext('2d'), d = g.createImageData(128, 128);
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < d.data.length; i += 4) { const v = 118 + r() * 20; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
  }
  return ctx.createPattern(NOISE, 'repeat');
}
// Fill `fill` (colour or pattern) on a band of a part's four sides (fractions of the height, 0 = top), plus its top or bottom.
function band(g, part, fill, from = 0, to = 1, faces = SIDES) {
  g.fillStyle = fill;
  for (const f of faces) { const [x, y, w, h] = LAYOUT[part][f]; g.fillRect(x, y + from * h, w, (to - from) * h); }
  if (faces === SIDES && from === 0) { const [x, y, w, h] = LAYOUT[part].U; g.fillRect(x, y, w, h); }
  if (faces === SIDES && to === 1) { const [x, y, w, h] = LAYOUT[part].D; g.fillRect(x, y, w, h); }
}
function hline(g, part, color, at, px = 3, faces = SIDES) {
  g.fillStyle = color;
  for (const f of faces) { const [x, y, w, h] = LAYOUT[part][f]; g.fillRect(x, y + at * h - px / 2, w, px); }
}
function rect(part, face) { return LAYOUT[part][face]; }
// Subtle fabric grain over everything painted so far, inside the clothing rects only.
function grain(g, parts, alpha = 0.18) {
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = alpha; g.fillStyle = noisePattern(g);
  for (const p of parts) for (const r of Object.values(LAYOUT[p])) g.fillRect(...r);
  g.restore();
}
function plaid(base, a, b, step = 24) {
  const c = canvas(step * 4, step * 4), g = c.getContext('2d'), n = step * 4;
  g.fillStyle = base; g.fillRect(0, 0, n, n);
  g.globalAlpha = 0.55; g.fillStyle = a;
  g.fillRect(0, step * 0.6, n, step * 0.8); g.fillRect(step * 0.6, 0, step * 0.8, n);
  g.globalAlpha = 0.9; g.fillStyle = b;
  g.fillRect(0, step * 2.4, n, 3); g.fillRect(step * 2.4, 0, 3, n);
  g.globalAlpha = 0.35; g.fillStyle = '#000'; g.fillRect(0, step * 3.3, n, step * 0.3); g.fillRect(step * 3.3, 0, step * 0.3, n);
  return c;
}
function gingham(a, b, step = 14) {
  const c = canvas(step * 2, step * 2), g = c.getContext('2d');
  g.fillStyle = b; g.fillRect(0, 0, step * 2, step * 2);
  g.globalAlpha = 0.5; g.fillStyle = a; g.fillRect(0, 0, step, step * 2); g.fillRect(0, 0, step * 2, step);
  g.globalAlpha = 1; g.fillRect(0, 0, step, step);
  return c;
}
function stripes(base, line, step = 18, w = 5) {
  const c = canvas(step, step), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, step, step); g.fillStyle = line; g.fillRect(0, 0, w, step);
  return c;
}
function knitRib(base, dark) {
  const c = canvas(8, 8), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 8, 8); g.fillStyle = dark; g.fillRect(0, 0, 2, 8);
  return c;
}
const pat = (g, c) => g.createPattern(c, 'repeat');
function cloud(g, cx, cy, s, fill, edge) {
  const blobs = [[-0.55, 0.1, 0.38], [-0.15, -0.2, 0.48], [0.35, -0.1, 0.42], [0.65, 0.18, 0.3], [0.05, 0.2, 0.4]];
  g.save(); g.lineJoin = 'round';
  g.fillStyle = edge; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(cx + x * s, cy + y * s, r * s + 4, 0, 7); g.fill(); }
  g.fillStyle = fill; for (const [x, y, r] of blobs) { g.beginPath(); g.arc(cx + x * s, cy + y * s, r * s, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(cx - 0.15 * s, cy - 0.32 * s, 0.22 * s, 0.1 * s, -0.3, 0, 7); g.fill();
  g.restore();
}
function bunny(g, cx, cy, s) {
  g.save(); g.fillStyle = '#ffffff'; g.strokeStyle = '#d9c8ee'; g.lineWidth = 3;
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.22 * s, cy - 0.62 * s, 0.13 * s, 0.38 * s, sx * 0.15, 0, 7); g.fill(); g.stroke(); }
  g.beginPath(); g.ellipse(cx, cy, 0.42 * s, 0.36 * s, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#ffb3cf'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 0.22 * s, cy - 0.62 * s, 0.05 * s, 0.24 * s, sx * 0.15, 0, 7); g.fill(); }
  g.fillStyle = '#3a2e48'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 0.15 * s, cy - 0.04 * s, 0.045 * s, 0, 7); g.fill(); }
  g.fillStyle = '#ff8fb6'; g.beginPath(); g.arc(cx, cy + 0.08 * s, 0.05 * s, 0, 7); g.fill();
  g.restore();
}
function buttons(g, cx, y0, y1, n, color, r = 6) {
  g.fillStyle = color; for (let i = 0; i < n; i++) { g.beginPath(); g.arc(cx, y0 + ((y1 - y0) * i) / (n - 1), r, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < n; i++) { g.beginPath(); g.arc(cx + 1.5, y0 + ((y1 - y0) * i) / (n - 1) + 1.5, r * 0.35, 0, 7); g.fill(); }
}
// Shoes: the bottom `h` of both legs plus the soles.
function shoes(g, color, sole, h = 0.13, soleH = 0.035) {
  for (const p of LEGS) { band(g, p, color, 1 - h, 1); band(g, p, sole, 1 - soleH, 1); }
}
function hands(g, skin, from = 0.86) { for (const p of ARMS) band(g, p, skin, from, 1); }
function skinOf(img) {
  const c = canvas(1, 1), g = c.getContext('2d'); const [x, y, w, h] = HEAD_SWATCH;
  g.drawImage(img, x + w / 2, y + h / 2, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}
function seams(g, part, color, faces = ['L', 'R']) {
  g.fillStyle = color; for (const f of faces) { const [x, y, w, h] = rect(part, f); g.fillRect(x + w / 2 - 1, y, 2, h); }
}

// ---------- the looks (each paints the full clothing layer over the body atlas) ----------
const LOOKS = {
  skye_hoodie(g, skin) {
    const W = '#f3f3f6', RIB = '#dedee6';
    band(g, 'Torso', W); for (const p of ARMS) band(g, p, W, 0, 0.86);
    hline(g, 'Torso', RIB, 0.955, 22); g.fillStyle = pat(g, knitRib(RIB, '#cfcfd8')); for (const f of SIDES) { const [x, y, w, h] = rect('Torso', f); g.fillRect(x, y + h - 22, w, 22); }
    for (const p of ARMS) { g.fillStyle = pat(g, knitRib(RIB, '#cfcfd8')); for (const f of SIDES) { const [x, y, w, h] = rect(p, f); g.fillRect(x, y + h * 0.79, w, h * 0.07); } }
    const [fx, fy, fw, fh] = rect('Torso', 'F');
    // kangaroo pocket, drawstrings, neckline, the small pink cloud on the chest
    g.strokeStyle = '#d4d4dd'; g.lineWidth = 3; g.beginPath(); g.moveTo(fx + 60, fy + fh - 24); g.lineTo(fx + 76, fy + 160); g.lineTo(fx + fw - 76, fy + 160); g.lineTo(fx + fw - 60, fy + fh - 24); g.stroke();
    g.fillStyle = '#e4e4ea'; g.beginPath(); g.ellipse(fx + fw / 2, fy - 4, 58, 26, 0, 0, Math.PI); g.fill();
    g.strokeStyle = '#c8c8d2'; g.lineWidth = 3; g.beginPath(); g.ellipse(fx + fw / 2, fy - 4, 58, 26, 0, 0, Math.PI); g.stroke();
    g.strokeStyle = '#ff9ccb'; g.lineWidth = 4; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(fx + fw / 2 + s * 26, fy + 20); g.lineTo(fx + fw / 2 + s * 30, fy + 74); g.stroke(); }
    cloud(g, fx + fw / 2 + 4, fy + 108, 34, '#ff8fc4', '#ffffff');
    // hood lying on the back
    const [bx, by, bw] = rect('Torso', 'B');
    g.fillStyle = '#e9e9ef'; g.beginPath(); g.moveTo(bx + 38, by); g.quadraticCurveTo(bx + bw / 2, by + 150, bx + bw - 38, by); g.fill();
    g.strokeStyle = '#cdcdd6'; g.lineWidth = 3; g.stroke();
    // light-blue jeans + white trainers
    const J = '#8fb6de';
    for (const p of LEGS) { band(g, p, J); seams(g, p, '#7299c4'); hline(g, p, '#7a9fc8', 0.86, 3); }
    g.fillStyle = '#7a9fc8'; for (const p of LEGS) { const [x, y, w] = rect(p, 'F'); g.fillRect(x, y + 14, w, 3); }
    shoes(g, '#fbfbfd', '#c3c7d0', 0.12, 0.035); for (const p of LEGS) hline(g, p, '#ff9ccb', 0.915, 4, ['L', 'R']);
    hands(g, skin, 0.86);
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.14);
  },
  max_pjs(g, skin) {
    const T = '#9ea1a8';
    band(g, 'Torso', T); for (const p of ARMS) { band(g, p, skin); band(g, p, T, 0, 0.3); hline(g, p, '#8a8d95', 0.29, 5); }
    const [fx, fy, fw] = rect('Torso', 'F');
    g.strokeStyle = '#7d8088'; g.lineWidth = 9; g.beginPath(); g.ellipse(fx + fw / 2, fy - 2, 50, 24, 0, 0, Math.PI); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.ellipse(fx + fw / 2, fy - 2, 45, 19, 0, 0, Math.PI); g.fill();
    hline(g, 'Torso', '#8a8d95', 0.97, 5);
    const P = pat(g, plaid('#22305e', '#b8323a', '#e8e0d0', 22));
    for (const p of LEGS) { band(g, p, P, 0, 1); seams(g, p, 'rgba(0,0,0,0.25)'); }
    g.fillStyle = P; { const [x, y, w, h] = rect('Torso', 'D'); g.fillRect(x, y, w, h); }
    for (const p of LEGS) { band(g, p, '#2a2b33', 0.88, 1); hline(g, p, '#1c1d24', 0.88, 4); }
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.16);
  },
  dad_cardigan(g, skin) {
    const M = '#d3a12f', MD = '#b8891f', SH = '#f7f7f4';
    band(g, 'Torso', M);
    const [fx, fy, fw, fh] = rect('Torso', 'F');
    // white shirt in the V, collar points, placket buttons
    g.fillStyle = SH; g.beginPath(); g.moveTo(fx + fw / 2 - 64, fy); g.lineTo(fx + fw / 2 + 64, fy); g.lineTo(fx + fw / 2 + 10, fy + 150); g.lineTo(fx + fw / 2 - 10, fy + 150); g.fill();
    g.fillStyle = '#ffffff'; g.strokeStyle = '#d6d6d0'; g.lineWidth = 2;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(fx + fw / 2, fy + 6); g.lineTo(fx + fw / 2 + s * 46, fy); g.lineTo(fx + fw / 2 + s * 30, fy + 36); g.closePath(); g.fill(); g.stroke(); }
    g.strokeStyle = MD; g.lineWidth = 7; g.beginPath(); g.moveTo(fx + fw / 2 - 64, fy); g.lineTo(fx + fw / 2 - 8, fy + 150); g.lineTo(fx + fw / 2 - 8, fy + fh); g.stroke();
    g.beginPath(); g.moveTo(fx + fw / 2 + 64, fy); g.lineTo(fx + fw / 2 + 8, fy + 150); g.lineTo(fx + fw / 2 + 8, fy + fh); g.stroke();
    buttons(g, fx + fw / 2 - 18, fy + 160, fy + fh - 34, 3, '#7a5520', 7);
    g.fillStyle = MD; g.fillRect(fx + 26, fy + 168, 54, 6); g.fillRect(fx + fw - 80, fy + 168, 54, 6);   // pocket tops
    g.fillStyle = pat(g, knitRib(M, MD)); for (const f of SIDES) { const [x, y, w, h] = rect('Torso', f); g.fillRect(x, y + h - 24, w, 24); }
    for (const p of ARMS) { band(g, p, M, 0, 0.88); g.fillStyle = pat(g, knitRib(M, MD)); for (const f of SIDES) { const [x, y, w, h] = rect(p, f); g.fillRect(x, y + h * 0.8, w, h * 0.08); } }
    hands(g, skin, 0.88);
    const BR = '#6a4a30';
    for (const p of LEGS) { band(g, p, BR); seams(g, p, '#58391f'); hline(g, p, '#5a3d26', 0.62, 2, ['F']); }
    shoes(g, '#3b2719', '#1f140d', 0.11, 0.03);
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.2);
  },
  dad_apron(g, skin) {
    LOOKS.dad_cardigan(g, skin);
    const C = pat(g, gingham('#d0252f', '#ffffff', 13));
    const [fx, fy, fw, fh] = rect('Torso', 'F');
    g.fillStyle = C; g.beginPath(); g.moveTo(fx + 66, fy + 72); g.lineTo(fx + fw - 66, fy + 72); g.lineTo(fx + fw - 30, fy + fh); g.lineTo(fx + 30, fy + fh); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#d0252f'; g.lineWidth = 9; g.beginPath(); g.moveTo(fx + 70, fy + 74); g.lineTo(fx + 40, fy); g.moveTo(fx + fw - 70, fy + 74); g.lineTo(fx + fw - 40, fy); g.stroke();   // neck strap
    // waist ties round the sides and back, a bow on the back
    for (const f of ['L', 'R', 'B']) { const [x, y, w, h] = rect('Torso', f); g.fillStyle = '#d0252f'; g.fillRect(x, y + h * 0.78, w, 12); }
    const [bx, by, bw, bh] = rect('Torso', 'B'); g.fillStyle = '#b81e28';
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(bx + bw / 2 + s * 18, by + bh * 0.78 + 6, 18, 10, 0, 0, 7); g.fill(); }
    g.fillRect(bx + bw / 2 - 5, by + bh * 0.78 + 8, 4, 40); g.fillRect(bx + bw / 2 + 3, by + bh * 0.78 + 8, 4, 34);
    // the skirt of the apron on the front of both thighs
    for (const p of LEGS) {
      const [x, y, w, h] = rect(p, 'F'); g.fillStyle = C; g.fillRect(x, y, w, h * 0.5);
      g.fillStyle = '#ffffff'; g.fillRect(x, y + h * 0.5 - 4, w, 5);
    }
    grain(g, ['Torso', ...LEGS], 0.1);
  },
  dad_robe(g, skin) {
    const R = '#7a1f30', RD = '#5e1523', PJ = pat(g, stripes('#5b84c4', '#dbe6f7', 16, 5));
    band(g, 'Torso', R);
    const [fx, fy, fw, fh] = rect('Torso', 'F');
    g.fillStyle = PJ; g.beginPath(); g.moveTo(fx + fw / 2 - 58, fy); g.lineTo(fx + fw / 2 + 58, fy); g.lineTo(fx + fw / 2, fy + 132); g.fill();
    // shawl collar lapels, darker
    g.strokeStyle = RD; g.lineWidth = 22; g.beginPath(); g.moveTo(fx + fw / 2 - 70, fy - 4); g.lineTo(fx + fw / 2 + 6, fy + 150); g.stroke();
    g.beginPath(); g.moveTo(fx + fw / 2 + 70, fy - 4); g.lineTo(fx + fw / 2 - 2, fy + 158); g.lineTo(fx + fw / 2 - 2, fy + fh); g.stroke();
    // belt with a knot
    for (const f of SIDES) { const [x, y, w, h] = rect('Torso', f); g.fillStyle = RD; g.fillRect(x, y + h * 0.72, w, 16); }
    g.fillStyle = RD; g.beginPath(); g.ellipse(fx + fw / 2 + 30, fy + fh * 0.72 + 8, 14, 12, 0, 0, 7); g.fill();
    g.fillRect(fx + fw / 2 + 22, fy + fh * 0.72 + 12, 7, 46); g.fillRect(fx + fw / 2 + 34, fy + fh * 0.72 + 12, 7, 38);
    for (const p of ARMS) { band(g, p, R, 0, 0.82); hline(g, p, RD, 0.8, 10); band(g, p, PJ, 0.82, 0.88); }
    hands(g, skin, 0.88);
    // robe to the knee, striped pyjamas below, felt slippers
    for (const p of LEGS) { band(g, p, PJ); band(g, p, R, 0, 0.5); hline(g, p, RD, 0.49, 8); }
    shoes(g, '#4a3427', '#2a1d16', 0.11, 0.03); for (const p of LEGS) hline(g, p, '#d8c7b0', 0.89, 6);
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.2);
  },
  lily_day(g, skin) {
    const Y = '#ffd23f', YD = '#e6b522';
    band(g, 'Torso', Y);
    const [fx, fy, fw, fh] = rect('Torso', 'F');
    // white Peter Pan collar
    g.fillStyle = '#ffffff'; g.strokeStyle = '#e2ddd0'; g.lineWidth = 3;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(fx + fw / 2 + s * 36, fy + 8, 42, 30, s * 0.25, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.fillStyle = skin; g.beginPath(); g.ellipse(fx + fw / 2, fy - 6, 30, 18, 0, 0, Math.PI); g.fill();
    buttons(g, fx + fw / 2, fy + 70, fy + 140, 3, '#ffffff', 6);
    hline(g, 'Torso', YD, 0.66, 5);                      // waist seam
    for (const p of ARMS) { band(g, p, skin); band(g, p, Y, 0, 0.3); hline(g, p, '#ffffff', 0.3, 7); }
    // the skirt runs onto the thighs, then pink leggings and red shoes
    for (const p of LEGS) { band(g, p, '#f59cc4'); band(g, p, Y, 0, 0.36); hline(g, p, '#ffffff', 0.355, 8); }
    g.fillStyle = Y; { const [x, y, w, h] = rect('Torso', 'D'); g.fillRect(x, y, w, h); }
    shoes(g, '#c8314f', '#7d1c30', 0.12, 0.035);
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.14);
  },
  lily_pjs(g, skin) {
    const P = '#c4a6ea', PD = '#ab8bd6';
    band(g, 'Torso', P); for (const p of ARMS) { band(g, p, P, 0, 0.86); hline(g, p, PD, 0.84, 8); }
    const [fx, fy, fw] = rect('Torso', 'F');
    g.strokeStyle = PD; g.lineWidth = 8; g.beginPath(); g.ellipse(fx + fw / 2, fy - 2, 48, 22, 0, 0, Math.PI); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.ellipse(fx + fw / 2, fy - 2, 44, 18, 0, 0, Math.PI); g.fill();
    bunny(g, fx + fw / 2, fy + 150, 72);
    hline(g, 'Torso', PD, 0.97, 6);
    hands(g, skin, 0.86);
    for (const p of LEGS) { band(g, p, P); seams(g, p, PD); hline(g, p, PD, 0.86, 6); }
    // small white dots on the trousers
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (const p of LEGS) for (const f of SIDES) { const [x, y, w, h] = rect(p, f); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(x + w * (0.27 + 0.46 * j) + (i % 2) * 14, y + h * (0.1 + 0.13 * i), 4, 0, 7); g.fill(); } }
    for (const p of LEGS) band(g, p, '#f6f2fb', 0.89, 1);          // socks
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.14);
  },
};
// Classmates: recoloured Noobs.
export const EXTRA_LOOKS = [
  { skin: null, shirt: null, pants: null, wear: 'cap', cap: true },                                // the Noob himself, cap on
  { skin: '#c68642', shirt: '#e63946', pants: '#264653', wear: 'spiky_hair', stripe: '#ffffff' },
  { skin: '#f1c27d', shirt: '#8338ec', pants: '#1d3557', wear: 'long_hair', stripe: '#ffd23f' },
  { skin: '#8d5524', shirt: '#2a9d8f', pants: '#3d405b', wear: 'beanie', stripe: '#f4a261' },
];
function extraLook(look) {
  return (g, skin) => {
    if (!look.shirt) return;
    const s = look.skin;
    g.fillStyle = s; g.fillRect(...HEAD_SWATCH);
    band(g, 'Torso', look.shirt); for (const p of ARMS) { band(g, p, s); band(g, p, look.shirt, 0, 0.32); }
    hline(g, 'Torso', look.stripe, 0.42, 22);
    const [fx, fy, fw] = rect('Torso', 'F'); g.fillStyle = s; g.beginPath(); g.ellipse(fx + fw / 2, fy - 2, 44, 20, 0, 0, Math.PI); g.fill();
    for (const p of LEGS) { band(g, p, look.pants); seams(g, p, 'rgba(0,0,0,0.25)'); }
    shoes(g, '#f2f2f2', '#9aa0a8', 0.11, 0.03);
    grain(g, ['Torso', ...ARMS, ...LEGS], 0.14);
  };
}

// ---------- meshes ----------
const cloth = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
function shade(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }
// A group on `bone` whose children are placed in character space (studs, before the actor's scale).
function boneSpace(actor, bone) {
  const piv = { Torso: [0, 2, 0], Head: [0, 4, 0], 'Arm.L': [1, 3.5, 0], 'Arm.R': [-1, 3.5, 0], 'Leg.L': [0.5, 2, 0], 'Leg.R': [-0.5, 2, 0] }[bone];
  const g = new THREE.Group(); g.scale.setScalar(actor.scale); g.position.set(-piv[0], -piv[1], -piv[2]).multiplyScalar(actor.scale);
  actor.bones[bone].add(g); return g;
}

function makeBackpack(actor) {
  const g = boneSpace(actor, 'Torso'); g.name = 'backpack';
  const L = cloth('#bfa0e6'), LD = cloth('#a585d4'), Z = cloth('#7e62a8', { roughness: 0.5 });
  const body = new THREE.Mesh(roundedBox(1.5, 1.6, 0.62, 0.2), L); body.position.set(0, 2.95, -0.5 - 0.33); g.add(body);
  const pocket = new THREE.Mesh(roundedBox(1.1, 0.7, 0.2, 0.08), LD); pocket.position.set(0, 2.5, -0.5 - 0.68); g.add(pocket);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.03), Z); zip.position.set(0, 2.78, -0.5 - 0.785); g.add(zip);
  const pull = new THREE.Mesh(roundedBox(0.07, 0.16, 0.04, 0.02), Z); pull.position.set(0.32, 2.71, -0.5 - 0.79); g.add(pull);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI), LD); handle.position.set(0, 3.72, -0.86); g.add(handle);
  for (const sx of [-1, 1]) {           // straps over both shoulders and down the front
    const top = new THREE.Mesh(roundedBox(0.26, 0.07, 1.12, 0.03), LD); top.position.set(sx * 0.52, 4.03, -0.02); g.add(top);
    const front = new THREE.Mesh(roundedBox(0.26, 1.32, 0.07, 0.03), LD); front.position.set(sx * 0.52, 3.38, 0.535); g.add(front);
    const buckle = new THREE.Mesh(roundedBox(0.3, 0.1, 0.05, 0.02), Z); buckle.position.set(sx * 0.52, 2.95, 0.57); g.add(buckle);
  }
  return shade(g);
}

// Glow-stick bands round both wrists (Ch10): emissive green rings over the sleeve.
function makeGlowBands(actor) {
  const out = [];
  for (const [bone, x] of [['Arm.L', 1.5], ['Arm.R', -1.5]]) {
    const g = boneSpace(actor, bone); g.name = 'glow_bands';
    const m = new THREE.MeshStandardMaterial({ color: COLORS.glow, emissive: COLORS.glow, emissiveIntensity: 1.8, roughness: 0.3 });
    for (const [y, tilt] of [[1.86, 0.06], [1.72, -0.08]]) {
      const pts = []; for (let i = 0; i < 48; i++) { const [px, pz] = squircle(0.64, 0.64, 4, (i / 48) * Math.PI * 2); pts.push(new THREE.Vector3(px, 0, pz)); }
      const ring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.045, 8, true), m);
      ring.rotation.x = tilt; ring.position.set(x, y, 0); g.add(ring);
    }
    out.push(g);
  }
  return out;
}

// The bedsheet ghost: a dome over the head (Head bone) with two eye holes and Skye's pink lock poking out at the left
// of her face, a drape from the shoulders to below the knees (Torso bone) that covers the arms at rest and is pushed
// out by the legs as they swing, and sheet sleeves on both arms down to the wrist (hands stay free for the phone).
function sheetTexture() {
  const c = canvas(512, 512), g = c.getContext('2d');
  g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * 512 + Math.sin(i * 7.1) * 8, w = 6 + (i % 4) * 5;
    const gr = g.createLinearGradient(x - w, 0, x + w, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(150,150,160,${0.1 + (i % 3) * 0.04})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - w, 0, w * 2, 512);
  }
  g.globalAlpha = 0.12; g.fillStyle = noisePattern(g); g.fillRect(0, 0, 512, 512);
  const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function squircle(hx, hz, n, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [hx * Math.sign(c) * Math.abs(c) ** (2 / n), hz * Math.sign(s) * Math.abs(s) ** (2 / n)];
}
function makeSheet(actor) {
  const S = actor.scale, mat = cloth('#f5f5f2', { map: sheetTexture(), side: THREE.DoubleSide, shadowSide: THREE.BackSide, roughness: 0.92 });
  const parts = [];
  // head size from the Head mesh
  const head = actor.bones.Head.children.find((o) => o.name === 'Head');
  head.geometry.computeBoundingBox(); const hb = head.geometry.boundingBox.clone();
  const hx = (hb.max.x - hb.min.x) / 2 / S, hz = (hb.max.z - hb.min.z) / 2 / S, htop = hb.max.y / S;    // head geometry is in character space (studs x scale)
  const headTop = Math.max(htop, 5.1);
  // --- dome (lathe), Head bone
  const dome = boneSpace(actor, 'Head'); dome.name = 'sheet_dome';
  const R = Math.max(hx, hz) + 0.3, bottom = 4.1, top = headTop + 0.26, prof = [];
  const rAt = (y) => { const u = (y - bottom) / (top - bottom); return u > 0.4 ? R * Math.sqrt(Math.max(0, 1 - ((u - 0.4) / 0.6) ** 2)) : R + (0.4 - u) * 0.6; };
  for (let i = 0; i <= 28; i++) { const y = bottom + ((top - bottom) * i) / 28; prof.push(new THREE.Vector2(Math.max(rAt(y), 0.001), y)); }
  const lathe = new THREE.LatheGeometry(prof, 48);
  const dm = new THREE.Mesh(lathe, mat); dm.scale.set(1, 1, 0.92); dome.add(dm);
  // eye holes (dark, slightly inset look), at the face texture's eye centres
  const eyeY = 4.5 + 0.12, holeMat = new THREE.MeshBasicMaterial({ color: '#0d0d12' });
  for (const sx of [-1, 1]) {
    const x = sx * 0.24, r = rAt(eyeY), z = Math.sqrt(Math.max(0, r * r - x * x)) * 0.92 + 0.035;
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), holeMat);
    hole.scale.set(0.95, 1.3, 1); hole.position.set(x, eyeY, z); hole.rotation.y = Math.atan2(x, z) * 0.8; dome.add(hole);
  }
  // pink lock at the left of her face (her left = +X), out through the gap at the cheek and curling down
  const lockMat = cloth(COLORS.skyeHair, { roughness: 0.55 });
  for (const [dx, dy, dz, rr] of [[0, 0, 0, 0.1], [0.07, -0.06, -0.03, 0.08], [-0.05, 0.03, 0.03, 0.075]]) {
    const pts = [[0.4, 4.55, 0.5], [0.6, 4.45, 0.74], [0.74, 4.2, 0.86], [0.74, 3.92, 0.86], [0.64, 3.74, 0.84]].map((p, i) => new THREE.Vector3(p[0] + dx * (i > 0), p[1] + dy * (i > 1), p[2] + dz * (i > 1)));
    const curve = new THREE.CatmullRomCurve3(pts), tube = new THREE.TubeGeometry(curve, 40, rr, 8, false);
    const pos = tube.attributes.position, P = new THREE.Vector3();
    for (let i = 0; i <= 40; i++) {
      const c = curve.getPointAt(i / 40), k = 1 - 0.8 * (i / 40) ** 1.3;
      for (let j = 0; j <= 8; j++) { const idx = i * 9 + j; P.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(k).add(c); pos.setXYZ(idx, P.x, P.y, P.z); }
    }
    tube.computeVertexNormals();
    const lock = new THREE.Mesh(tube, lockMat); lock.name = 'pink_lock'; dome.add(lock);
  }
  parts.push(dome);
  // --- drape, Torso bone
  const drape = boneSpace(actor, 'Torso'); drape.name = 'sheet_drape';
  const rings = [], SEG = 72;
  // [y, hx, hz, n]: neck ring, shoulders, down to below the knees
  const prof2 = [[4.42, 0.74, 0.56, 2.4], [4.34, 1.4, 0.64, 2.6], [4.12, 2.1, 0.8, 3.0], [3.6, 2.26, 0.9, 3.0], [2.6, 2.36, 1.0, 2.7], [1.6, 2.42, 1.08, 2.5], [0.72, 2.48, 1.16, 2.4]];
  const ROWS = 34; const lerp = (a, b, u) => a + (b - a) * u;
  const sample = (u) => { const f = u * (prof2.length - 1), i = Math.min(Math.floor(f), prof2.length - 2), k = f - i; return prof2[i].map((v, j) => lerp(v, prof2[i + 1][j], k)); };
  const posArr = [], uv = [], idx = [];
  for (let r = 0; r <= ROWS; r++) {
    const [y, ax, az, n] = sample(r / ROWS);
    for (let s = 0; s <= SEG; s++) {
      const a = (s / SEG) * Math.PI * 2, [x, z] = squircle(ax, az, n, a);
      const hem = r === ROWS ? Math.sin(a * 9) * 0.05 : 0;
      posArr.push(x, y + hem, z); uv.push(s / SEG * 3, y / 3);
    }
  }
  for (let r = 0; r < ROWS; r++) for (let s = 0; s < SEG; s++) { const a = r * (SEG + 1) + s, b = a + SEG + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); dg.setIndex(idx);
  dg.computeVertexNormals();
  const base = Float32Array.from(posArr);
  const dmesh = new THREE.Mesh(dg, mat); drape.add(dmesh);
  // legs and arms push the drape out: every vertex in front of (behind) a limb that swings forward (back) is kept
  // outside that limb's surface, so a walk or an arm swing bulges the sheet instead of poking through it.
  const down = new THREE.Vector3(), q = new THREE.Quaternion();
  const pitch = (bone) => { q.copy(actor.bones[bone].quaternion); down.set(0, -1, 0).applyQuaternion(q); return Math.atan2(down.z, -down.y); };
  const LIMBS = [['Leg.L', 0.5, 2, 0.5, 0.5], ['Leg.R', -0.5, 2, 0.5, 0.5], ['Arm.L', 1.5, 3.5, 0.66, 0.7], ['Arm.R', -1.5, 3.5, 0.66, 0.7]];   // bone, x, pivot y, half depth, half width
  dmesh.updateMatrixWorld = function (force) {
    const ang = LIMBS.map((l) => pitch(l[0])), p = dg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1]; let z = base[i * 3 + 2];
      for (let k = 0; k < 4; k++) {
        const [, lx, py, hd, hw] = LIMBS[k], a = ang[k];
        if (Math.abs(a) < 0.02 || Math.abs(a) > 0.95 || y > py || Math.abs(x - lx) > hw + 0.45) continue;
        const sgn = Math.sign(a), ca = Math.cos(a), sa = Math.abs(Math.sin(a));
        const sAx = (py - y + hd * sa) / ca;
        if (sAx < 0 || sAx > 2.3) continue;
        const w = 1 - THREE.MathUtils.smoothstep(Math.abs(x - lx), hw, hw + 0.45);
        const zf = sgn * (sAx * sa + hd * ca + 0.1) * w + z * (1 - w);
        if (sgn > 0 && z > 0 && z < zf) z = zf; if (sgn < 0 && z < 0 && z > zf) z = zf;
      }
      p.setZ(i, z);
    }
    p.needsUpdate = true; dg.computeVertexNormals();
    THREE.Mesh.prototype.updateMatrixWorld.call(this, force);
  };
  parts.push(drape);
  // --- sleeves, arm bones
  for (const [bone, x] of [['Arm.L', 1.5], ['Arm.R', -1.5]]) {
    const g = boneSpace(actor, bone); g.name = 'sheet_sleeve';
    const sl = new THREE.Mesh(roundedBox(1.16, 1.78, 1.16, 0.2), mat); sl.position.set(x, 3.5 - 0.84, 0); g.add(sl);
    parts.push(g);
  }
  for (const p of parts) shade(p);
  return parts;
}

// The pulled-off sheet, bunched (Ch10, in her left hand).
export function makeSheetBunch() {
  const g = new THREE.Group(); g.name = 'sheet_bunch'; const m = cloth('#f3f3f0', { roughness: 0.92 });
  const blobs = [[0, 0, 0, 0.55], [0.3, -0.25, 0.1, 0.42], [-0.28, -0.3, -0.05, 0.4], [0.05, -0.62, 0.05, 0.38], [0.12, -0.95, 0, 0.28], [-0.1, -1.2, 0.04, 0.2]];
  for (const [x, y, z, r] of blobs) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), m); s.position.set(x, y, z); s.scale.set(1, 0.85, 0.9); g.add(s); }
  return shade(g);
}

// Lily's brown teddy: ~1.1 studs tall. Pivot at the tip of its raised right paw (the grip), teddy hanging below, facing +Z.
export function makeTeddy() {
  const g = new THREE.Group(); g.name = 'teddy';
  const fur = cloth('#8a5a36', { roughness: 0.95 }), light = cloth('#d7b48a', { roughness: 0.95 }), dark = new THREE.MeshStandardMaterial({ color: '#1a1210', roughness: 0.3 });
  const t = new THREE.Group(); g.add(t);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 18), fur); body.scale.set(1, 1.15, 0.85); body.position.set(0, 0.32, 0); t.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), light); belly.scale.set(1, 1.15, 0.5); belly.position.set(0, 0.3, 0.17); t.add(belly);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), fur); headM.position.set(0, 0.78, 0); t.add(headM);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), light); snout.scale.set(1.1, 0.85, 0.9); snout.position.set(0, 0.73, 0.2); t.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), dark); nose.scale.set(1.3, 1, 1); nose.position.set(0, 0.76, 0.29); t.add(nose);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), dark); eye.position.set(sx * 0.09, 0.85, 0.2); t.add(eye);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10), fur); ear.scale.set(1, 1, 0.6); ear.position.set(sx * 0.17, 0.98, 0); t.add(ear);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), light); inner.scale.set(1, 1, 0.4); inner.position.set(sx * 0.17, 0.98, 0.04); t.add(inner);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.12, 6, 12), fur); leg.position.set(sx * 0.14, 0.07, 0.07); leg.rotation.x = -1.2; t.add(leg);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), light); pad.position.set(sx * 0.14, 0.03, 0.2); pad.rotation.x = -0.35; t.add(pad);
  }
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 6, 12), fur); armL.position.set(0.27, 0.42, 0.04); armL.rotation.z = 0.5; t.add(armL);
  // raised right arm (the teddy's right = -X), up to the grip
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 6, 12), fur); armR.position.set(-0.24, 0.72, 0); armR.rotation.z = -0.32; t.add(armR);
  t.position.set(0.18, -0.98, 0);           // grip (the paw tip, ~(-0.3, 0.98)) at the origin
  return shade(g);
}

// Teddy placement. 'R' / 'L': held by its paw in Lily's fist, hanging at her side; 'hug': against her chest
// (pose her arms in front, e.g. Arm.L/Arm.R about -40 deg pitch, 25 deg in); 'free': detached (the chapter places it).
export function holdTeddy(lily, mode = 'R') {
  const t = lily.teddy; if (t.parent) t.parent.remove(t);
  t.position.set(0, 0, 0); t.rotation.set(0, 0, 0); t.scale.setScalar(1);
  const S = lily.scale;
  if (mode === 'R' || mode === 'L') {
    const sx = mode === 'R' ? -1 : 1;
    t.position.set(sx * 0.5 * S, -1.3 * S, 0.05 * S); t.rotation.set(0, 0, sx * -0.1);
    if (mode === 'L') t.scale.set(-1, 1, 1);
    lily.bones[mode === 'R' ? 'Arm.R' : 'Arm.L'].add(t);
  } else if (mode === 'hug') {
    t.position.set(-0.1 * S, (3.55 - 2) * S, 0.82 * S); t.rotation.set(0.1, 0, 0);
    lily.bones.Torso.add(t);
  }
  lily.teddyMode = mode; return t;
}

// ---------- hair tint ----------
function tintImage(img, color) {
  const c = canvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data, h = parseInt(color.slice(1), 16);
  const R = (h >> 16) & 255, G = (h >> 8) & 255, B = h & 255;
  let mean = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 10) { mean += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; n++; }
  mean = mean / Math.max(n, 1) || 1;
  for (let i = 0; i < px.length; i += 4) {
    const l = Math.min(1.5, Math.max(0.5, (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / mean));
    px[i] = Math.min(255, R * l); px[i + 1] = Math.min(255, G * l); px[i + 2] = Math.min(255, B * l);
  }
  g.putImageData(d, 0, 0); return texOf(c);
}
function tintHair(actor, color) {
  const hair = actor.bones.Head.children.find((o) => o.name === 'Hair'); if (!hair) return;
  const mats = Array.isArray(hair.material) ? hair.material : [hair.material];
  hair.material = mats.map((m) => { const n = m.clone(); if (m.map && m.map.image) n.map = tintImage(m.map.image, color); else n.color.set(color); return n; });
  if (hair.material.length === 1) hair.material = hair.material[0];
}

// ---------- loading ----------
const BODY_PNG = { Skye: 'skye', Max: 'max', Leo: 'leo', Mia: 'mia', Noob: 'noob' };
async function prepare(actor, key) {
  actor.key = key; actor.speaker = SPEAKER[actor.name] || null;
  actor.bodyImg = (await packTexture(`characters/${actor.name}/${BODY_PNG[actor.name]}_body.png`)).image;
  actor.skin = skinOf(actor.bodyImg);
  actor.bodyMeshes = [];
  actor.root.traverse((o) => {
    if (o.isMesh && BODY_MESHES.includes(o.name)) { o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); actor.bodyMeshes.push(o); }
  });
  actor.defaultMap = actor.bodyMeshes.find((o) => o.name === 'Torso').material.map;
  actor.atlas = {}; actor.overlays = {}; actor.outfit = null;
  actor.hairMesh = actor.bones.Head.children.find((o) => o.name === 'Hair') || null;
  return actor;
}
function atlasFor(actor, id) {
  if (!actor.atlas[id]) {
    const c = canvas(ATLAS, ATLAS), g = c.getContext('2d'); g.drawImage(actor.bodyImg, 0, 0, ATLAS, ATLAS);
    const look = id === 'extras' ? extraLook(actor.extraLook || EXTRA_LOOKS[0]) : LOOKS[id];
    look(g, actor.skin);
    actor.atlas[id] = texOf(c);
  }
  return actor.atlas[id];
}
function setMap(actor, map) { for (const m of actor.bodyMeshes) { m.material.map = map; m.material.needsUpdate = true; } }

const BASE_OWNER = { skye_hoodie: 'Skye', skye_sheet: 'Skye', backpack: 'Skye', max_school: 'Max', max_pjs: 'Max', dad_cardigan: 'Leo', dad_apron: 'Leo', dad_robe: 'Leo', lily_day: 'Mia', lily_pjs: 'Mia', extras: 'Noob' };

// dress(actor, id, on = true). Base looks (skye_hoodie, max_school, max_pjs, dad_cardigan, dad_apron, dad_robe, lily_day,
// lily_pjs, extras) replace the outfit; a base look on Skye also takes the sheet off. Overlays: 'backpack' and
// 'skye_sheet' (on/off with `on`), 'glow_sticks' (green bands round both wrists). Arrays apply in order.
// Synchronous and cached, so a chapter can change clothes inside update(t).
export function dress(actor, id, on = true) {
  if (Array.isArray(id)) { for (const i of id) dress(actor, i, on); return actor; }
  const owner = BASE_OWNER[id];
  if (owner && owner !== actor.name) throw new Error(`Wardrobe "${id}" is for ${owner}, not ${actor.name}`);
  if (id === 'backpack') { overlay(actor, 'backpack', on, () => [makeBackpack(actor)]); return actor; }
  if (id === 'glow_sticks') { overlay(actor, 'glow_sticks', on, () => makeGlowBands(actor)); return actor; }
  if (id === 'skye_sheet') {
    if (on && actor.outfit !== 'skye_hoodie') dress(actor, 'skye_hoodie');
    overlay(actor, 'skye_sheet', on, () => makeSheet(actor));
    if (actor.hairMesh) actor.hairMesh.visible = !on;
    if (actor.face) actor.face.visible = !on;
    if (on) overlay(actor, 'backpack', false);
    actor.sheetOn = on; return actor;
  }
  if (!LOOKS[id] && id !== 'extras' && id !== 'max_school') throw new Error(`Unknown wardrobe id "${id}"`);
  setMap(actor, id === 'max_school' ? actor.defaultMap : atlasFor(actor, id));
  actor.outfit = id;
  if (actor.name === 'Skye' && actor.sheetOn) dress(actor, 'skye_sheet', false);
  return actor;
}
function overlay(actor, key, on, make) {
  if (on && !actor.overlays[key]) actor.overlays[key] = make();
  for (const o of actor.overlays[key] || []) o.visible = !!on;
}

// Lift the sheet off the head (Ch10, "Skye pulls the sheet off her head"): u 0 = on, 1 = clear above her head.
// At u = 1 hide it with dress(skye, 'skye_sheet', false) and give her makeSheetBunch() in her left hand.
export function sheetLift(skye, u) {
  const k = Math.min(Math.max(u, 0), 1), e = k * k * (3 - 2 * k);
  for (const o of skye.overlays.skye_sheet || []) {
    if (o.userData.base === undefined) o.userData.base = o.position.clone();
    o.position.copy(o.userData.base); o.position.y += e * 3.2 * skye.scale; o.position.z += e * 0.6 * skye.scale;
  }
  if (skye.hairMesh) skye.hairMesh.visible = k > 0.35;
  if (skye.face) skye.face.visible = k > 0.35;
}

export async function loadCast(scene) {
  const [skye, max, dad, lily] = await Promise.all([
    loadRobloxCharacter('Skye', { expressions: FACES }),
    loadRobloxCharacter('Max', { expressions: FACES }),
    loadRobloxCharacter('Leo', { expressions: FACES, scale: SCALE.dad, hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: FACES, scale: SCALE.lily }),
  ]);
  const extras = await Promise.all(EXTRA_LOOKS.map(() => loadRobloxCharacter('Noob', { expressions: FACES })));
  await Promise.all([prepare(skye, 'skye'), prepare(max, 'max'), prepare(dad, 'dad'), prepare(lily, 'lily'), ...extras.map((e) => prepare(e, 'extra'))]);
  tintHair(dad, COLORS.dadHair); tintHair(lily, COLORS.lilyHair);
  for (let i = 0; i < extras.length; i++) { extras[i].extraLook = EXTRA_LOOKS[i]; extras[i].key = 'extra' + i; await wear(extras[i], EXTRA_LOOKS[i].wear); }
  dress(skye, 'skye_hoodie'); dress(max, 'max_school'); dress(dad, 'dad_cardigan'); dress(lily, 'lily_day');
  for (const e of extras) dress(e, 'extras');
  lily.teddy = makeTeddy(); holdTeddy(lily, 'R');
  for (const a of [skye, max, dad, lily, ...extras]) { a.setFace('neutral'); if (scene) scene.add(a.root); }
  return { skye, max, dad, lily, extras };
}

// Lip flap: while one of the actor's words is playing, alternate `talking` / `mouth_o` (switching inside long words every
// ~0.14 s); between words and outside their lines the base face. `words` = captions.json words ({ word, start, end,
// speaker }) - all of them or just this actor's; only words whose speaker matches the actor (SKYE/MAX/DAD/LILY) count.
export function speak(actor, baseFace, t, words = []) {
  const list = Array.isArray(words) ? words : words.words || [];
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    if (t < w.start || t >= w.end) continue;
    if (w.speaker && actor.speaker && String(w.speaker).toUpperCase() !== actor.speaker) continue;
    const k = Math.floor((t - w.start) / 0.14);
    actor.setFace((i + k) % 2 ? 'mouth_o' : 'talking'); return 'talking';
  }
  actor.setFace(baseFace); return baseFace;
}
