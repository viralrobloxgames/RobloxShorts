// Cover for Stealing a T-Rex Egg (one frame, 1080x1920; everything inside the 3:4 band y 240-1680): the opening shot -
// the sleeping T-rex's face over the glowing best egg, Leo tiptoeing in - with the headline (standalone: no part tag).
import * as base from './egg_clip.js';
import { W } from './beats.js';
export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) { base.update(W.tiptoed - 0.45, stage); }
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#152435'; g.lineWidth = size * 0.22 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'STEALING A', 540, 330, 120, '#ffffff', -0.04);
  big(g, s, 'T-REX EGG', 540, 470, 150, '#FFD23F', -0.04);

}
