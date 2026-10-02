// The Server Says One (After Hours pilot 1): story timeline shared by web/server_clip.js and source/sound_cues.py.
// Pure (no three.js), so node can import it. Positions are [x, z] in studs (lobby floor y = 0, back wall z = -8, EXIT door
// at x = 0 in the back wall, corridor behind it). Everything is a function of GAME time g; game time equals real time
// except during the chase, where each shot plays its own slow-motion window (CHASE) and windows may overlap
// (the same instant seen from two angles).
//
// The Unlisted's one rule: it is Max's MIRROR image, half a second late (D). Facing him, a mirror copies sideways moves
// in the same direction but moves along the line between them the opposite way; "every copy brings it one step closer"
// is the mirror plane creeping towards Max. When Max sprints for the door the copy sprints the other way, and when he is
// out of sight it has nothing left to copy: it freezes, turns its head, and charges the door too late.
import { W } from './beats.js';

export const D = 0.5, WALK = 12, RUN = 16, STRIDE = 14.5;
export const DOOR_Z = -8, HINGE = [3, -8], DOOR_OPEN = 0.8;     // door control value 0.8 = 80 degrees into the corridor
const K = W.fake - 0.3;                                          // chase origin (game time = real time before this)

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inv = (a, b, x) => clamp((x - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => u * u * (3 - 2 * u);
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const head = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const angLerp = (a, b, u) => { const d = ((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; return a + d * u; };

// Constant-speed move along a polyline from g0. anim = cycle time driven by distance (feet stay planted).
function along(pts, g0, g, speed) {
  const lens = pts.slice(1).map((p, i) => dist(pts[i], p)), total = lens.reduce((a, b) => a + b, 0);
  const d = clamp((g - g0) * speed, 0, total);
  let k = 0, rest = d;
  while (k < lens.length - 1 && rest > lens[k]) { rest -= lens[k]; k++; }
  const u = lens[k] ? rest / lens[k] : 1, a = pts[k], b = pts[k + 1];
  return { pos: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], heading: head(a, b), moving: g > g0 && d < total, done: d >= total,
    d, total, arrive: g0 + total / speed, anim: d / STRIDE, at: (dd) => g0 + dd / speed };
}

// ---------- Max ----------
export const M0 = [0, 5.8], M1 = [-2.4, 5.8], M2 = [-2.4, 7.0], MF = [-6.4, 7.0];
export const PATH = [MF, [-2.6, 3.6], [-0.8, -6.2], [-0.8, -9.2], [-0.5, -13.0], [1.21, -14.66]];
export const BACK = [0.4, -9.1], FWD = [0.4, -11.0];                    // back against the door; one step off it
const FACING = Math.PI;                                                    // towards the copy (-z)
export const G = {
  wave: [W.wave - 0.15, W.wave + 1.05],
  step: W.step - 0.12, back: W.every - 0.2,
  lunge: K + 0.2, cut: K + 0.75,
};
G.lungeEnd = G.lunge + dist(M2, MF) / RUN;
const run = (g) => along(PATH, G.cut, g, RUN);
const R0 = run(0);
// Path distance where Max's front reaches the door (z = -7.6) and crosses the doorway (z = -8).
function distToZ(z) { let acc = 0; for (let i = 1; i < PATH.length; i++) { const a = PATH[i - 1], b = PATH[i]; if (b[1] <= z) return acc + dist(a, b) * (a[1] - z) / (a[1] - b[1]); acc += dist(a, b); } return acc; }
G.barge = R0.at(distToZ(-7.3));
G.through = R0.at(distToZ(DOOR_Z));                // out of the copy's sight
G.arrive = R0.arrive;
G.push = [G.arrive + 0.02, G.arrive + 0.24];
G.slam = [G.push[0] + 0.06, G.push[0] + 0.2];     // door 80 deg -> shut
G.turnBack = [G.slam[1] + 0.12, G.slam[1] + 0.3];
G.backUp = G.turnBack[1];
G.hit = K + 3.6;                                    // the copy hits the closed door
G.leanArrive = G.backUp + dist(PATH.at(-1), BACK) / WALK;

export function maxAt(g) {
  const s = { pos: M0, heading: FACING, layers: [['idle', g]], face: 'nervous', wave: 0 };
  if (g >= G.wave[0] && g < G.wave[1]) { s.wave = 1; s.face = 'confused'; }
  if (g >= W.waveBack - 0.2) s.face = 'scared';
  const st = along([M0, M1], G.step, g, WALK);
  if (g >= G.step) { s.pos = st.pos; if (st.moving) s.layers = [['walk', st.anim]]; }        // strafe, facing the copy
  const bk = along([M1, M2], G.back, g, WALK);
  if (g >= G.back) { s.pos = bk.pos; if (bk.moving) s.layers = [['walk', -bk.anim]]; }      // backs away
  if (g >= W.copyCan - 0.2) s.face = 'suspicious';
  if (g >= W.seen) s.face = 'determined';
  const lg = along([M2, MF], G.lunge, g, RUN);
  if (g >= G.lunge) { s.pos = lg.pos; s.layers = lg.moving ? [['run', lg.anim]] : [['idle', g]]; s.crouch = lg.moving ? 0 : 0.6; }
  if (g >= G.cut) {
    const r = run(g); s.pos = r.pos; s.face = 'scared'; s.crouch = 0;
    s.heading = r.moving ? r.heading : head(r.pos, [1.96, -13.9]);
    s.layers = r.moving ? [['run', r.anim]] : [['idle', g]];
    if (g >= G.push[0] && g < G.turnBack[0] + 0.1) { s.layers = [['push', (g - G.push[0]) * 1.4, 1, false]]; s.face = 'angry'; }
  }
  if (g >= G.turnBack[0]) {
    const u = smooth(inv(...G.turnBack, g)), from = head(PATH.at(-1), [1.96, -13.9]);
    s.heading = angLerp(from, FACING, u);
    s.face = 'scared';
  }
  if (g >= G.backUp) {
    const b = along([PATH.at(-1), BACK], G.backUp, g, WALK); s.pos = b.pos; s.heading = FACING;
    s.layers = b.moving ? [['walk', -b.anim]] : [['idle', g]];
  }
  if (g >= G.hit) {                                   // the bang: jolted off the door, then pinned back against it
    const a = g - G.hit; s.layers = a < 0.55 ? [['shock', a * 0.8, 1, false]] : [['idle', g]]; s.face = a < 1.2 ? 'shocked' : 'scared';
    s.pos = [BACK[0], BACK[1] - 0.7 * Math.sin(Math.PI * clamp(a / 0.5))];
  }
  return s;
}

// ---------- the copy ----------
const ZM0 = (M0[1] + -3.0) / 2;                                  // the Unlisted starts at z = -3
export const CREEP = [W.waveBack + 0.9, W.stepBack + 0.55, W.every + 0.3, W.closer + 0.05, W.seen - 0.25];
export const ZM_END = 4.1;                                        // mirror plane at the fake: copy at z = 1.2, Max at 7.0
const CSTEP = (ZM_END - ZM0) / CREEP.length, CDUR = 0.3;
const creepAt = (g) => CREEP.reduce((acc, c) => acc + CSTEP * smooth(inv(c, c + CDUR, g)), 0);
export const zm = (g) => ZM0 + creepAt(g);
const creeping = (g) => CREEP.find((c) => g > c && g < c + CDUR);
const mirror = (p, g) => [p[0], 2 * zm(g) - p[1]];
export const DF = [-0.8, -7.15];                                  // where it hits the door (lobby side)

export function copyAt(g) {
  const gs = Math.min(g, G.through) - D, m = maxAt(gs);
  const s = { pos: mirror(m.pos, g), heading: Math.PI - m.heading, layers: m.layers, face: 'neutral', wave: m.wave, headTurn: 0, crouch: m.crouch };
  if (m.layers[0][0] === 'push' || m.layers[0][0] === 'shock') s.layers = [['idle', g]];
  const c = creeping(g);
  if (c !== undefined && s.layers[0][0] === 'idle') s.layers = [['walk', (2 * CSTEP * smooth(inv(c, c + CDUR, g))) / STRIDE, 0.4], ['idle', g, 0.6]];   // a short step: shorter swing
  if (g >= G.through) {                                   // Max is gone: nothing left to copy
    s.layers = [['idle', 0]]; s.face = 'revealed';
    s.headTurn = smooth(inv(G.slam[0] - 0.05, G.slam[0] + 0.3, g));      // the head goes first...
    const frozen = mirror(maxAt(G.through - D).pos, G.through);
    const runStart = G.hit - dist(frozen, DF) / RUN;
    const r = along([frozen, DF], runStart, g, RUN);
    if (g >= runStart - 0.15) { s.heading = angLerp(s.heading, head(frozen, DF), smooth(inv(runStart - 0.15, runStart, g))); s.headTurn = 1 - smooth(inv(runStart - 0.15, runStart, g)); }
    s.pos = r.pos; if (r.moving) { s.layers = [['run', r.anim]]; s.heading = r.heading; s.headTurn = 0; }
    if (g >= G.hit) { const a = g - G.hit; s.pos = [DF[0], DF[1] + 1.3 * Math.sin(Math.PI / 2 * clamp(a / 0.3))]; s.heading = head(frozen, DF); s.layers = [['shock', Math.min(a, 0.25), 1, false]]; s.headTurn = 0; }
    s.runStart = runStart; s.frozen = frozen;
  }
  return s;
}

// Door: shut, shoulder-barged open, slammed, bumped by the hit.
export function doorAt(g) {
  let v = 0;
  if (g >= G.barge) v = DOOR_OPEN * (1 - (1 - inv(G.barge, G.barge + 0.17, g)) ** 3);
  if (g >= G.slam[0]) v = DOOR_OPEN * (1 - inv(...G.slam, g) ** 2);
  if (g >= G.slam[1]) v = 0;
  if (g >= G.hit) v = 0.022 * Math.exp(-(g - G.hit) * 9) * Math.abs(Math.cos((g - G.hit) * 40));
  return v;
}

// ---------- real time -> game time ----------
// Chase shots: [id, real start, real end, game start, game end]. Each plays its own window in slow motion with a speed
// ramp (fast in, slowing down); windows overlap where the same instant is shown again from a second angle.
const mid = (a, b, u = 0.5) => a + (b - a) * u;
export const CHASE = [
  ['fake', W.fake - 0.3, W.fakeCopy - 0.3, K, K + 0.62],
  ['fakeCopy', W.fakeCopy - 0.3, W.cut - 0.25, K + 0.45, K + 0.98],
  ['cut', W.cut - 0.25, mid(W.cut, W.finishing, 0.45), K + 0.68, K + 1.12],
  ['cutLow', mid(W.cut, W.finishing, 0.45), W.finishing - 0.3, K + 0.88, K + 1.3],
  ['finishing', W.finishing - 0.3, W.ran - 0.2, K + 0.7, K + 1.05],
  ['ran', W.ran - 0.2, mid(W.ran, W.dove, 0.55), K + 1.15, K + 1.62],
  ['barge', mid(W.ran, W.dove, 0.55), W.dove - 0.3, K + 1.45, G.through - 0.1],
  ['dove', W.dove - 0.3, W.slammed - 0.25, G.through - 0.16, G.slam[1] + 0.05],
  ['slam', W.slammed - 0.25, W.hit - 0.12, G.slam[0] - 0.25, G.hit - 0.12],
];
const POST = W.hit - 0.12;
const ramp = (u) => 0.45 * u + 0.55 * (1 - (1 - u) ** 2);
export function gameAt(t) {
  if (t < CHASE[0][1]) return t;
  for (const [id, a, b, g0, g1] of CHASE) if (t < b) return lerp(g0, g1, id === 'slam' ? (t - a) / (b - a) : ramp((t - a) / (b - a)));
  return G.hit - 0.12 + (t - POST);
}
export const shotOf = (t) => (CHASE.find(([, a, b]) => t >= a && t < b) || [null])[0];
// Inverse of the ramp (bisection), so a game event can be placed in real time within a given shot.
const realIn = (id, g) => {
  const [, a, b, g0, g1] = CHASE.find((c) => c[0] === id), f = id === 'slam' ? (u) => u : ramp, want = (g - g0) / (g1 - g0);
  let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m) < want) lo = m; else hi = m; }
  return a + (b - a) * lo;
};
const postReal = (g) => POST + (g - (G.hit - 0.12));

// ---------- the ending (real time) ----------
export const COPY_MAX = [-0.6, -30.5];              // the second "Max", at the far end of the corridor
export const E = {
  stepOff: W.checked - 0.5,                         // Max steps off the door to check the list
  flicker: [W.updated - 0.1, W.two + 0.3],
  copyOn: W.max2 - 0.1,                             // lights flash: it is standing at the end of the corridor
  cta: W.follow - 0.1,
};

// Real times of game events, for sound cues and overlays.
export const EVENTS = {
  wave: G.wave[0], copyWave: G.wave[0] + D, step: G.step, copyStep: G.step + D, back: G.back, copyBack: G.back + D,
  creeps: CREEP, lunge: realIn('fake', G.lunge), copyLunge: realIn('fakeCopy', G.lunge + D),
  cut: realIn('cut', G.cut), copyRun: realIn('ran', G.cut + D),
  barge: realIn('dove', G.barge), copyLungeAgain: realIn('finishing', G.lunge + D), slam: realIn('slam', G.slam[1]), freeze: realIn('slam', G.slam[0] - 0.05),
  copyCharge: realIn('slam', G.hit - 0.9), hit: postReal(G.hit),
  ...E, end: W.end,
};
export { K };
