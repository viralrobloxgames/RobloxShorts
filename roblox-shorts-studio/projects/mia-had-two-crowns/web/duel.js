// Account switching and the two duels (Max vs Mia, Leo vs the noob), as pure functions of story time. No three.js here,
// so source/sound_cues.py can read the same blast/hit events with node: the SFX land exactly on the picture.
// Rule: only one of Mia's accounts moves at a time. The live account blasts its attacker back (he flies, then runs back);
// the frozen one gets punched and its HP drains.
import { W } from './beats.js';

export const FLING_TYPE = [W.fling - 0.95, W.fling - 0.05];
export const CHARGE = [W.attacked + 0.2, W.attacked + 1.2];      // the boys split up and sprint at Mia's two accounts
export const DUEL_END = W.herself + 0.7;                          // then they regroup

// Which account is live. Before Mia types, both stand there; after, only one at a time.
export const SEG = (() => {
  const s = [[0, 'both'], [FLING_TYPE[0], 'mia'], [W.onlyPlay, 'noob'], [W.sw1, 'mia'], [W.sw2, 'noob'], [W.sw3, 'mia']];
  let t = W.faster - 0.15, k = 0, gap = 0.42;                    // "faster and faster"
  while (t < W.freeze - 0.75) { s.push([t, k++ % 2 ? 'mia' : 'noob']); t += gap; gap = Math.max(0.11, gap * 0.8); }
  s.push([W.freeze - 0.75, 'mia'], [W.herself + 0.05, 'noob']); // types :freeze on her own window; then only the noob is left
  return s;
})();
export const live = (s) => { let a = 'both'; for (const [t, who] of SEG) if (s >= t) a = who; return a; };
export const segStart = (s) => { let a = 0; for (const [t] of SEG) if (s >= t) a = t; return a; };
export const switches = (s) => SEG.filter(([t, w], i) => i >= 3 && t <= s && t >= W.sw1 - 0.01 && w !== 'both').length;
// Effective time of an account: the live one follows the clock; the idle one is frozen at the moment it lost focus.
export const eff = (who, s) => (live(s) === 'both' || live(s) === who ? s : segStart(s));

const DT = 1 / 120, KICK = 12, DRAG = 28, RUN = 7, HIT_EVERY = 0.34, DMG = 4.5;
const targetLive = (side, t) => (side === 'max' ? live(t) === 'mia' && t < W.herself : live(t) === 'noob');

function simulate(side) {
  const rows = [], blasts = [], hits = [];
  let x = 0, v = 0, hp = 100, lastBlast = -9, lastHit = -9, prev = null;
  for (let i = 0, t = CHARGE[1]; t <= DUEL_END + 1e-6; i++, t = CHARGE[1] + i * DT) {
    const L = targetLive(side, t);
    const becameLive = L && prev === false;
    const iceBounce = side === 'max' && t >= W.herself && lastBlast < W.herself;          // Max bounces off the ice
    if ((becameLive && x < 1.2) || (L && x < 0.15 && t - lastBlast > 0.85) || iceBounce) { v = KICK; lastBlast = t; blasts.push(+t.toFixed(3)); }
    prev = L;
    if (v > 0) { x += v * DT; v = Math.max(0, v - DRAG * DT); } else if (x > 0) x = Math.max(0, x - RUN * DT);
    if (!L && x === 0 && v === 0 && t < W.herself && t - lastHit >= HIT_EVERY) { lastHit = t; hp = Math.max(8, hp - DMG); hits.push(+t.toFixed(3)); }
    rows.push([x, v, hp, lastBlast, lastHit, L]);
  }
  return { rows, blasts, hits };
}
const SIM = { max: simulate('max'), leo: simulate('leo') };
export const EVENTS = { blasts: { max: SIM.max.blasts, leo: SIM.leo.blasts }, hits: { max: SIM.max.hits, leo: SIM.leo.hits } };

// Duel state for 'max' (vs Mia) or 'leo' (vs the noob) at story time s.
export function duelAt(side, s) {
  if (s < CHARGE[0]) return { phase: 'pre', x: 0, v: 0, hp: 100, lastBlast: -9, lastHit: -9 };
  if (s < CHARGE[1]) return { phase: 'charge', u: (s - CHARGE[0]) / (CHARGE[1] - CHARGE[0]), x: 0, v: 0, hp: 100, lastBlast: -9, lastHit: -9 };
  const r = SIM[side].rows, [x, v, hp, lastBlast, lastHit, L] = r[Math.min(r.length - 1, Math.round((s - CHARGE[1]) / DT))];
  const phase = s > DUEL_END ? 'done' : v > 0 ? 'fly' : x > 0 ? 'run' : !L && s < W.herself ? 'jab' : 'stand';
  return { phase, x, v, hp, lastBlast, lastHit };
}
export const HIT_PERIOD = HIT_EVERY;
