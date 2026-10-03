// Which Max Is Real? (After Hours, Part 2 of 2: the finale). Story timeline shared by web/finale_clip.js and
// source/sound_cues.py. Pure (no three.js). Positions are [x, z] in studs, in Part 1's set: lobby (z > -8), the EXIT door
// in the back wall at x = 0 (z = -8, hinge at x = +3, open 100 degrees into the corridor), corridor z -8 .. -34.
// Everything is real time t, keyed to narration words (W). The one slow-motion stretch (the backwards sprint) is a
// single monotone curve, so nothing ever rewinds between camera angles.
//
// Canon from Part 1: the copy is its target's MIRROR image (scale.x = -1: its hoodie star is on the wrong side). It
// copies sideways moves in the same direction and moves along the line between them the opposite way. It has learned
// Max, so it is no longer late. The real Max is on the LEFT.
import { W } from './beats.js';

export const RUN = 16, WALK = 12, STRIDE = 14.5;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inv = (a, b, x) => clamp((x - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => u * u * (3 - 2 * u);
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const head = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const angLerp = (a, b, u) => { const d = ((b - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; return a + d * u; };
function along(pts, t0, t, speed) {
  const lens = pts.slice(1).map((p, i) => dist(pts[i], p)), total = lens.reduce((a, b) => a + b, 0);
  const d = clamp((t - t0) * speed, 0, total);
  let k = 0, rest = d;
  while (k < lens.length - 1 && rest > lens[k]) { rest -= lens[k]; k++; }
  const u = lens[k] ? rest / lens[k] : 1, a = pts[k], b = pts[k + 1];
  return { pos: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], heading: head(a, b), moving: t > t0 && d < total, done: d >= total, d, total, u: total ? d / total : 1, arrive: t0 + total / speed, anim: d / STRIDE };
}

// ---------- the set ----------
export const DOOR_Z = -8, DOOR_OPEN = 1;
export const TL = [-3.0, -13.5], TR = [1.4, -13.5];          // the twins (real Max LEFT, copy RIGHT), facing the doorway
export const MIA0 = [-0.5, -27], MIA1 = [-0.5, -22], MIA2 = [3.6, -21.5], MIA_SLAM = [4.8, -15.0];
export const C1 = [0.9, -14.6];                               // the copy stalks one step towards Mia
export const M1 = [0.7, -17.4], MJUMP = [[-3.0, -13.5], [-2.6, -16.2], M1];   // Max jumps round it, between them
export const STEP = 1.2;
export const STEPS = [W.step1, W.step2, W.another1, W.another2];          // both step: Max back, the mirror back too
export const LAST = W.oneStep + 0.35;                                       // Max steps again; it doesn't
export const SPRINT = [W.sprinted - 0.1, W.through + 0.25];                 // the backwards sprint (slow motion)
export const MAX_FAR = -30.0, COPY_FAR = -1.2;
export const WAVE_AT = [0.2, -10.6];
const stepped = (t, list) => list.reduce((acc, s) => acc + STEP * smooth(inv(s, s + 0.3, t)), 0);
const stepping = (t, list) => list.find((s) => t > s && t < s + 0.3);
// Sprint progress: a single eased curve, fast off the mark then slowing as the copy crosses the doorway.
const sprintP = (t) => { const u = inv(...SPRINT, t); return 0.35 * u + 0.65 * (1 - (1 - u) ** 2); };

export const T = {
  sync: W.late - 0.1,
  raise: [W.leftMax - 0.25, W.stared - 0.35],
  headTurn: [W.stared - 0.1, W.stared + 0.4],
  bodyTurn: [W.came - 0.15, W.came + 0.1],
  stalk: [W.came + 0.1, W.came + 0.6],
  jump: W.jumped - 0.25,
  miaWalk: W.mirrors + 0.4, miaAside: W.jumped + 0.45,
  lock: [W.jumped + 0.4, W.jumped + 0.9],
  gone: W.updated + 0.05,
};
T.miaRun = W.through + 0.05;
T.slam = [W.slammed - 0.12, W.slammed + 0.06];
T.maxWalk = W.slammed + 0.7;

// ---------- Max ----------
export function maxAt(t) {
  const s = { pos: TL, heading: 0, layers: [['idle', t]], face: t < T.sync ? 'scared' : 'neutral', raise: 0, wave: 0, hop: 0 };
  if (t >= T.raise[0] && t < T.raise[1]) s.raise = smooth(inv(T.raise[0], T.raise[0] + 0.2, t)) * (1 - smooth(inv(T.raise[1] - 0.2, T.raise[1], t)));
  if (t >= W.came) s.face = 'shocked';
  const j = along(MJUMP, T.jump, t, RUN);
  if (t >= T.jump) {
    s.pos = j.pos; s.heading = j.moving ? j.heading : 0; s.layers = j.moving ? [['run', j.anim]] : [['idle', t]];
    s.hop = j.moving ? 1.1 * Math.sin(Math.PI * clamp((j.u - 0.55) / 0.45)) : 0; s.face = 'determined';
  }
  const back = stepped(t, [...STEPS, LAST]);
  if (t >= STEPS[0]) {
    s.pos = [M1[0], M1[1] - back]; s.heading = 0;
    const st = stepping(t, [...STEPS, LAST]);
    s.layers = st !== undefined ? [['walk', -back / STRIDE, 0.6], ['idle', t, 0.4]] : [['idle', t]];   // backwards, legs keyed to distance
  }
  if (t >= SPRINT[0]) {
    const z0 = M1[1] - STEP * 5, p = sprintP(t), z = lerp(z0, MAX_FAR, p);
    s.pos = [M1[0], z]; s.heading = 0; s.layers = p < 1 ? [['run', -(z0 - z) / STRIDE]] : [['idle', t]];
  }
  if (t >= T.maxWalk) {
    const w = along([[M1[0], MAX_FAR], WAVE_AT], T.maxWalk, t, WALK);
    s.pos = w.pos; s.heading = w.moving ? w.heading : 0; s.layers = w.moving ? [['walk', w.anim]] : [['idle', t]]; s.face = 'neutral';
  }
  if (t >= W.waved - 0.1 && t < W.waved + 1.7) s.wave = 1;
  if (t >= W.nothing) s.face = 'sad';
  return s;
}

// ---------- the copy ----------
export function copyAt(t) {
  const m = maxAt(t);
  const s = { pos: TR, heading: 0, layers: m.layers, face: 'neutral', raise: m.raise, wave: 0, hop: 0, headTurn: 0, mirror: true, visible: t < T.gone, fall: 0, shake: 0 };
  if (t >= T.jump) s.layers = [['idle', t]];
  if (t >= W.stared - 0.4) s.face = 'evil_grin';
  // It turns its head all the way round to look at Mia, then its body follows.
  s.headTurn = smooth(inv(...T.headTurn, t)) * (1 - smooth(inv(...T.bodyTurn, t)));
  s.heading = angLerp(0, Math.PI, smooth(inv(...T.bodyTurn, t)));
  if (t >= T.stalk[0]) {                                     // one menacing step towards her (short step: shorter swing)
    const u = smooth(inv(...T.stalk, t)); s.pos = [lerp(TR[0], C1[0], u), lerp(TR[1], C1[1], u)];
    if (u > 0 && u < 1) s.layers = [['walk', (u * dist(TR, C1)) / STRIDE, 0.4], ['idle', t, 0.6]];
  }
  if (t >= T.lock[0]) s.pos = [lerp(C1[0], M1[0], smooth(inv(...T.lock, t))), C1[1]];   // locks onto Max's line
  if (t >= STEPS[0]) {                                       // the mirror: Max steps back, it steps back (towards the door)
    const fwd = stepped(t, STEPS); s.pos = [M1[0], C1[1] + fwd];
    const st = stepping(t, STEPS);
    s.layers = st !== undefined ? [['walk', -fwd / STRIDE, 0.6], ['idle', t, 0.4]] : [['idle', t]];
  }
  if (t >= LAST && t < SPRINT[0]) {                          // one step from the door it stops: fighting the mirror
    s.face = 'angry'; s.shake = smooth(inv(LAST, LAST + 0.4, t));
  }
  if (t >= SPRINT[0]) {                                      // a mirror has to follow: flung back through the doorway
    const z0 = C1[1] + STEP * 4, p = sprintP(t), z = lerp(z0, COPY_FAR, p);
    s.pos = [M1[0], z]; s.face = 'shocked'; s.shake = 0;
    s.layers = [['run', -(z - z0) / STRIDE]];
    s.fall = smooth(inv(0.62, 1, p));                        // tips over backwards once it's through
  }
  return s;
}

// ---------- Mia ----------
export function miaAt(t) {
  const s = { pos: MIA0, heading: 0, layers: [['idle', t + 0.7]], face: 'suspicious', raise: 0, wave: 0, hop: 0, visible: t >= W.mia - 0.15 };   // spectating: unseen until her light comes on
  const w = along([MIA0, MIA1], T.miaWalk, t, WALK);
  if (t >= T.miaWalk) { s.pos = w.pos; if (w.moving) s.layers = [['walk', w.anim]]; }
  if (t >= W.order) s.face = 'determined';
  if (t >= W.came - 0.1) s.face = 'scared';
  const a = along([MIA1, MIA2], T.miaAside, t, WALK);
  if (t >= T.miaAside) { s.pos = a.pos; s.heading = a.moving ? a.heading : 0; if (a.moving) s.layers = [['walk', a.anim]]; }
  if (t >= W.whispered - 0.2) s.face = 'determined';
  const r = along([MIA2, MIA_SLAM], T.miaRun, t, RUN);
  if (t >= T.miaRun) {
    s.pos = r.pos; s.heading = r.moving ? r.heading : head(MIA_SLAM, [4.04, -13.9]); s.layers = r.moving ? [['run', r.anim]] : [['idle', t]];
    if (t >= T.slam[0] - 0.08 && t < T.slam[1] + 0.35) { s.layers = [['push', (t - T.slam[0] + 0.08) * 1.4, 1, false]]; s.face = 'angry'; }
  }
  if (t >= T.slam[1] + 0.6) { s.face = 'neutral'; s.heading = angLerp(head(MIA_SLAM, [4.04, -13.9]), Math.PI, smooth(inv(T.slam[1] + 0.6, T.slam[1] + 0.9, t))); }
  return s;
}

// Door: open (the copy came through it in the dark), slammed by Mia.
export function doorAt(t) {
  if (t < T.slam[0]) return DOOR_OPEN;
  if (t < T.slam[1]) return DOOR_OPEN * (1 - inv(...T.slam, t) ** 2);
  return 0;
}

// Real times of events, for sound cues and overlays.
const copyThrough = (() => { let lo = SPRINT[0], hi = SPRINT[1]; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (copyAt(m).pos[1] < DOOR_Z) lo = m; else hi = m; } return lo; })();
export const EVENTS = {
  lightOn: W.mia - 0.1, sync: T.sync, raise: T.raise[0], headTurn: T.headTurn[0], bodyTurn: T.bodyTurn[0], stalk: T.stalk[0],
  jump: T.jump, land: along(MJUMP, T.jump, 0, RUN).arrive, steps: STEPS, last: LAST, fight: LAST + 0.1,
  sprint: SPRINT[0], through: copyThrough, fall: SPRINT[1] - 0.05, slam: T.slam[1], gone: T.gone,
  waved: W.waved - 0.1, nothing: W.nothing, cta: W.what - 0.1, end: W.end,
};
