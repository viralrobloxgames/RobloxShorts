// 2D overlay drawn onto each finished frame: captions, HUD timer, Roblox-style chat, speed lines.
// Canvas is 1080x1920 (scaled by s). Keep text out of the bottom 20 % and right 15 % (TikTok UI).
import { clamp, easeOutBack, inv } from './anim.js';

export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// Big outlined caption in Luckiest Guy (matches the ASS "Words" style: white, navy outline, soft shadow).
export function caption(g, s, text, t0, t1, t, { y = 1180, size = 84, color = '#ffffff', hl = null, pop = true } = {}) {
  if (t < t0 || t > t1) return;
  const inU = inv(t0, t0 + 0.18, t), outU = inv(t1 - 0.12, t1, t);
  const k = pop ? easeOutBack(inU, 2.2) : 1;
  g.save(); g.globalAlpha = 1 - outU;
  g.translate(540 * s, y * s); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const ly = (i - (lines.length - 1)) * size * 1.08 * s;
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetY = 6 * s; g.shadowBlur = 10 * s;
    g.strokeStyle = '#152435'; g.lineWidth = 16 * s; g.strokeText(line, 0, ly);
    g.shadowColor = 'transparent';
    if (hl) {
      // Colour one word (hl = word) in amber, like the word-highlight captions.
      const words = line.split(' '); let x = -g.measureText(line).width / 2;
      g.textAlign = 'left';
      for (const w of words) { g.fillStyle = w === hl ? '#FFDA3D' : color; g.fillText(w, x, ly); x += g.measureText(w + ' ').width; }
      g.textAlign = 'center';
    } else { g.fillStyle = color; g.fillText(line, 0, ly); }
  });
  g.restore();
}

// Crown + "ADMIN 0:ss" pill, top-left under the For You tabs.
export function adminTimer(g, s, secondsLeft, t, { x = 60, y = 250, flash = 0 } = {}) {
  const txt = `ADMIN 0:${String(Math.max(0, Math.ceil(secondsLeft))).padStart(2, '0')}`;
  g.save(); g.font = `${54 * s}px "Luckiest Guy"`;
  const w = g.measureText(txt).width + 140 * s, h = 92 * s;
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 18 * s; g.shadowOffsetY = 6 * s;
  roundRect(g, x * s, y * s, w, h, 26 * s); g.fillStyle = flash > 0 ? `rgba(${200 + 55 * flash},40,60,.92)` : 'rgba(21,36,53,.86)'; g.fill();
  g.shadowColor = 'transparent';
  g.lineWidth = 5 * s; g.strokeStyle = '#FFC83D'; g.stroke();
  drawCrown(g, (x + 58) * s, (y + 47) * s, 34 * s);
  g.fillStyle = '#FFE7A0'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(txt, (x + 104) * s, (y + 52) * s);
  g.restore();
}

export function drawCrown(g, cx, cy, r) {
  g.save(); g.translate(cx, cy);
  const grad = g.createLinearGradient(0, -r, 0, r); grad.addColorStop(0, '#FFE680'); grad.addColorStop(1, '#F2A900');
  g.fillStyle = grad; g.strokeStyle = '#7a4b00'; g.lineWidth = r * 0.12; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-r, r * 0.6); g.lineTo(-r, -r * 0.5); g.lineTo(-r * 0.45, 0); g.lineTo(0, -r * 0.8); g.lineTo(r * 0.45, 0); g.lineTo(r, -r * 0.5); g.lineTo(r, r * 0.6); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = '#ff3b5c'; g.beginPath(); g.arc(0, r * 0.25, r * 0.16, 0, 7); g.fill();
  g.restore();
}

// Roblox-like chat window: lines = [{name, color, text, at}], typing = {name, color, text, from, to}.
export function chat(g, s, t, lines, typing, { x = 60, y = 370, w = 640, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  const visible = lines.filter((l) => t >= l.at);
  const isTyping = typing && t >= typing.from - 0.25 && t < typing.to + 0.1;
  if (!visible.length && !isTyping) return;
  g.save(); g.globalAlpha = alpha;
  const lh = 52 * s, pad = 22 * s, rows = visible.length + (isTyping ? 1 : 0);
  const h = pad * 2 + rows * lh + (isTyping ? 10 * s : 0);
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${34 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2;
  for (const l of visible) {
    const a = clamp((t - l.at) / 0.15);
    g.globalAlpha = a * alpha;
    const tag = `[${l.name}]: `; g.fillStyle = l.color; g.fillText(tag, x * s + pad, yy);
    g.fillStyle = '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy);
    yy += lh;
  }
  g.globalAlpha = alpha;
  if (isTyping) {
    const n = Math.floor(clamp((t - typing.from) / (typing.to - typing.from)) * typing.text.length);
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fill();
    const shown = typing.text.slice(0, n);
    g.fillStyle = '#ffffff'; g.fillText(shown, x * s + pad * 1.2, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0 || n < typing.text.length) {
      const cx = x * s + pad * 1.2 + g.measureText(shown).width + 4 * s;
      g.fillRect(cx, yy - 16 * s, 4 * s, 40 * s);
    }
  }
  g.restore();
}

// Anime-style radial speed lines around a focus point, deterministic per frame.
export function speedLines(g, s, t, amount, { cx = 540, cy = 900, seed = 3 } = {}) {
  if (amount <= 0) return;
  g.save(); g.globalAlpha = 0.55 * amount; g.fillStyle = '#ffffff';
  const frame = Math.floor(t * 30);
  let st = seed * 9301 + frame * 49297;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r0 = (420 + rnd() * 300) * s, len = (300 + rnd() * 600) * s, wdt = (2 + rnd() * 7) * s;
    g.save(); g.translate(cx * s, cy * s); g.rotate(a);
    g.beginPath(); g.moveTo(r0, -wdt); g.lineTo(r0 + len, 0); g.lineTo(r0, wdt); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
}

// Quick white flash / fade to colour.
export function flash(g, s, amount, color = '#ffffff') {
  if (amount <= 0) return;
  g.save(); g.globalAlpha = clamp(amount); g.fillStyle = color; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore();
}
