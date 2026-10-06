// 2D overlay for the long-form video, drawn on the 1920x1080 frame (every coordinate below is in 1920x1080 units and
// multiplied by s). Captions are NOT drawn here: finish_longform.py burns them in from captions.json.
// Keep the lower third (y > 760) clear of overlay elements: that is where captions sit.
import { clamp, inv, easeOutBack, easeOut } from '../../../../web/lib/anim.js';
import { roundRect } from '../../../../web/lib/overlay.js';

export { roundRect };
export const OV = { W: 1920, H: 1080, captionTop: 760 };

// Full-width day card over the first shot of Ch2-11 (a band across the top: y 35-265; frame the first shot's faces
// below it): DAY big, clock time below. Visible from t0 (frame 0) for `dur` s:
// pops in over 0.2 s, slides away over the last 0.3 s. K.dayCard(g, s, t, { day: 'TUESDAY', time: '6:04 AM' })
export function dayCard(g, s, t, { day, time, t0 = 0, dur = 2.1 } = {}) {
  const u = t - t0; if (u < 0 || u > dur) return;
  const inU = t0 === 0 ? 1 : easeOutBack(inv(0, 0.2, u), 1.6);        // from frame 0 of a chapter it is already there
  const outU = easeOut(inv(dur - 0.3, dur, u));
  g.save();
  g.globalAlpha = 1 - outU;
  const cy = 150 * s, bh = 230 * s;
  g.translate(-outU * 1920 * s * 0.25, 0);
  g.fillStyle = 'rgba(12,10,28,0.78)'; g.fillRect(0, cy - bh / 2, 1920 * s, bh);
  g.fillStyle = '#ff5fa2'; g.fillRect(0, cy - bh / 2, 1920 * s, 8 * s); g.fillRect(0, cy + bh / 2 - 8 * s, 1920 * s, 8 * s);
  g.translate(960 * s, cy); g.scale(inU, inU);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  g.font = `${150 * s}px "Luckiest Guy"`;
  g.strokeStyle = '#1a0f2e'; g.lineWidth = 14 * s; g.strokeText(day, 0, 30 * s);
  g.fillStyle = '#ffffff'; g.fillText(day, 0, 30 * s);
  g.font = `800 ${58 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText(time, 0, 100 * s);
  g.restore();
}

// Small time stamp, top left (Ch1 from frame 0, and mid-chapter "earlier that day" cards). alpha for fades.
// K.timeStamp(g, s, 'MONDAY 9:47 PM')
export function timeStamp(g, s, text, { alpha = 1, x = 48, y = 44 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;
  g.font = `800 ${34 * s}px Montserrat`; g.textBaseline = 'middle';
  const w = g.measureText(text).width + 44 * s, h = 58 * s;
  g.fillStyle = 'rgba(12,10,28,0.72)'; roundRect(g, x * s, y * s, w, h, 12 * s); g.fill();
  g.fillStyle = '#ff5fa2'; roundRect(g, x * s, y * s, 8 * s, h, 4 * s); g.fill();
  g.fillStyle = '#ffffff'; g.fillText(text, x * s + 24 * s, y * s + h / 2 + 1 * s);
  g.restore();
}

// Hand-drawn red circle drawn on over 0.35 s from t0, then held until t1 (x, y, r in 1920x1080 units; ry optional).
// K.redCircle(g, s, t, 1010, 420, 120, { t0: 2.5, t1: 4.0 })
export function redCircle(g, s, t, x, y, r, { t0 = 0, t1 = Infinity, ry = r * 0.82, draw = 0.35, width = 11 } = {}) {
  if (t < t0 || t > t1) return;
  const u = easeOut(clamp((t - t0) / draw)), a0 = -2.2, sweep = Math.PI * 2 * 1.08 * u;
  g.save(); g.strokeStyle = '#ff2a2a'; g.lineWidth = width * s; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 6 * s;
  g.beginPath();
  for (let i = 0; i <= 80; i++) {
    const a = a0 + sweep * (i / 80), k = 1 + 0.045 * Math.sin(a * 3 + 1.3) + 0.06 * (i / 80);   // wobble + not quite closing
    const px = (x + Math.cos(a) * r * k) * s, py = (y + Math.sin(a) * ry * k) * s;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke(); g.restore();
}

// End screen, the last ~12 s of Ch11: SUBSCRIBE @viralrobloxgames at the top; the area below (y 330-1000) is left
// clear for YouTube's end-screen elements (two video tiles and the subscribe button). K.endScreen(g, s, t, { t0 })
export function endScreen(g, s, t, { t0 = 0, dur = 12 } = {}) {
  const u = t - t0; if (u < 0 || u > dur + 1) return;
  const a = clamp(u / 0.5);
  g.save(); g.globalAlpha = a;
  const grd = g.createLinearGradient(0, 0, 0, 1080 * s);
  grd.addColorStop(0, 'rgba(10,8,26,0.82)'); grd.addColorStop(0.35, 'rgba(10,8,26,0.55)'); grd.addColorStop(1, 'rgba(10,8,26,0.55)');
  g.fillStyle = grd; g.fillRect(0, 0, 1920 * s, 1080 * s);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const k = easeOutBack(clamp(u / 0.4), 1.6);
  g.translate(960 * s, 165 * s); g.scale(k, k);
  g.font = `${120 * s}px "Luckiest Guy"`; g.strokeStyle = '#1a0f2e'; g.lineWidth = 14 * s;
  g.strokeText('SUBSCRIBE', 0, 0); g.fillStyle = '#ff2a2a'; g.fillText('SUBSCRIBE', 0, 0);
  g.font = `800 ${56 * s}px Montserrat`; g.fillStyle = '#ffffff'; g.fillText('@viralrobloxgames', 0, 80 * s);
  g.restore();
}
