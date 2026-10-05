// Which Max Is Real? (After Hours, Part 2 of 2: the finale). Story timeline shared by web/finale_clip.js and
// source/sound_cues.py / source/score.py. Pure (no three.js). Positions are [x, z] in studs, in Part 1's set, staged in
// the LOBBY (20 studs wide, open front: room for wide portrait shots): back wall with the EXIT door at z = -8, x = 0
// (here hinged at x = -3 and opening INTO the lobby), the corridor beyond it, the lobby front at z = +8 and the apron
// to z = +22. Everything is real time t, keyed to narration words (W); nothing ever rewinds between camera angles.
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
export const DOOR_Z = -8, DOOR_OPEN = 1, HINGE = [-3, -8];
export const DOOR_EDGE = [HINGE[0] + 6 * Math.cos((100 * Math.PI) / 180), HINGE[1] + 6 * Math.sin((100 * Math.PI) / 180)];   // open: [-4.04, -2.09]
export const TL = [-3.4, -1.5], TR = [2.4, -1.5];            // the twins (real Max LEFT, copy RIGHT), facing Mia (+z)
export const MIA0 = [5.6, 10.5], MIA1 = [5.6, 6.6], MIA2 = [6.4, 7.8], MIA_SLAM = [-5.6, -1.6];   // watching from the front-right
export const C1 = [0.9, 0.6];                                 // the copy lunges at Mia...
export const M1 = [0.7, 3.4], MJUMP = [TL, [-3.3, 1.9], M1];  // ...Max dives round it, between them
export const STEP = 1.6;
export const STEPS = [W.step1, W.step2, W.another1, W.another2];          // both step: Max back, the mirror back too
export const LAST = W.oneStep + 0.35;                                       // Max steps again; it doesn't
export const SPRINT = W.sprinted - 0.1;                                     // Max sprints backwards at full speed
export const PULL = [W.sprinted + 0.15, W.through - 0.1];                   // the mirror drags it, fighting, to the doorway
export const FLING = [W.through - 0.1, W.through + 0.55];                   // then it's flung through into the corridor
export const MAX_FAR = 17.8, COPY_PULLED = -7.3, COPY_FAR = -13.5;
export const WAVE_AT = [0.4, -4.2];
const stepped = (t, list) => list.reduce((acc, s) => acc + STEP * smooth(inv(s, s + 0.3, t)), 0);
const stepping = (t, list) => list.find((s) => t > s && t < s + 0.3);

export const T = {
  sync: W.late - 0.1,
  raise: [W.leftMax - 0.25, W.stared - 0.35],
  tilt: [W.stared - 0.05, W.stared + 0.45],                  // its head tips sideways, too far
  lunge: W.came + 0.05,
  jump: W.came + 0.12,                                       // Max is already moving as it lunges
  miaWalk: W.mirrors + 0.4, miaAside: W.jumped + 0.3,
  lock: [W.jumped + 0.3, W.jumped + 0.8],
  gone: W.updated + 0.05,
  miaRun: W.through - 0.05,
  slam: [W.slammed - 0.12, W.slammed + 0.06],
};
T.rattle = [T.slam[1] + 0.55, T.slam[1] + 0.95];             // it tries the door from the other side
T.maxWalk = W.updated - 0.6;

// ---------- Max ----------
export function maxAt(t) {
  const s = { pos: TL, heading: 0, layers: [['idle', t]], face: t < T.sync ? 'scared' : 'neutral', raise: 0, wave: 0, hop: 0 };
  if (t >= T.raise[0] && t < T.raise[1]) s.raise = smooth(inv(T.raise[0], T.raise[0] + 0.2, t)) * (1 - smooth(inv(T.raise[1] - 0.2, T.raise[1], t)));
  if (t >= W.stared) s.face = 'scared';
  const j = along(MJUMP, T.jump, t, RUN);
  if (t >= T.jump) {
    s.pos = j.pos; s.heading = j.moving ? j.heading : Math.PI; s.layers = j.moving ? [['run', j.anim]] : [['idle', t]];
    s.hop = j.moving ? 1.3 * Math.sin(Math.PI * clamp((j.u - 0.5) / 0.5)) : 0; s.face = 'determined';
  }
  const back = stepped(t, [...STEPS, LAST]);
  if (t >= STEPS[0]) {                                       // walks backwards (+z), facing the copy
    s.pos = [M1[0], M1[1] + back]; s.heading = Math.PI;
    s.layers = stepping(t, [...STEPS, LAST]) !== undefined ? [['walk', -back / STRIDE, 0.6], ['idle', t, 0.4]] : [['idle', t]];
  }
  if (t >= SPRINT) {
    const z0 = M1[1] + STEP * 5, r = along([[M1[0], z0], [M1[0], MAX_FAR]], SPRINT, t, RUN);
    s.pos = r.pos; s.heading = Math.PI; s.layers = r.moving ? [['run', -r.anim]] : [['idle', t]];
  }
  if (t >= T.maxWalk) {
    const w = along([[M1[0], MAX_FAR], WAVE_AT], T.maxWalk, t, WALK);
    s.pos = w.pos; s.heading = Math.PI; s.layers = w.moving ? [['walk', w.anim]] : [['idle', t]]; s.face = 'neutral';
  }
  if (t >= W.waved - 0.1 && t < W.waved + 1.7) s.wave = 1;
  if (t >= W.nothing) s.face = 'sad';
  return s;
}

// ---------- the copy ----------
export function copyAt(t) {
  const m = maxAt(t);
  const s = { pos: TR, heading: 0, layers: m.layers, face: 'neutral', raise: m.raise, wave: 0, hop: 0, tilt: 0, mirror: true, visible: t < T.gone, fall: 0, shake: 0, lean: 0 };
  if (t >= T.jump) s.layers = [['idle', t]];
  if (t >= W.stared - 0.3) s.face = 'evil_grin';
  s.tilt = smooth(inv(...T.tilt, t)) * (1 - smooth(inv(T.lunge - 0.05, T.lunge + 0.1, t)));
  const l = along([TR, C1], T.lunge, t, RUN);                 // the lunge, full speed at Mia
  if (t >= T.lunge) { s.pos = l.pos; s.heading = l.moving ? l.heading : 0; if (l.moving) s.layers = [['run', l.anim]]; }
  if (t >= T.lock[0]) s.pos = [lerp(C1[0], M1[0], smooth(inv(...T.lock, t))), C1[1]];   // locks onto Max's line
  if (t >= STEPS[0]) {                                       // the mirror: Max steps back, it steps back (to the door)
    const fwd = stepped(t, STEPS); s.pos = [M1[0], C1[1] - fwd]; s.heading = 0;
    s.layers = stepping(t, STEPS) !== undefined ? [['walk', -fwd / STRIDE, 0.6], ['idle', t, 0.4]] : [['idle', t]];
  }
  if (t >= LAST && t < SPRINT) { s.face = 'angry'; s.shake = smooth(inv(LAST, LAST + 0.4, t)); }   // fighting the mirror
  if (t >= SPRINT) {                                         // dragged, braced, to the doorway; then flung through
    const z0 = C1[1] - STEP * 4, pull = smooth(inv(...PULL, t)), fl = inv(...FLING, t);
    const z = fl > 0 ? lerp(COPY_PULLED, COPY_FAR, 1 - (1 - fl) ** 2) : lerp(z0, COPY_PULLED, pull);
    s.pos = [M1[0], z]; s.face = fl > 0 ? 'shocked' : 'angry'; s.shake = fl > 0 ? 0 : 0.8;
    s.layers = [['idle', 0]]; s.lean = fl > 0 ? 0 : 0.2 * pull; s.fall = smooth(inv(0.35, 1, fl));
  }
  return s;
}

// ---------- Mia ----------
export function miaAt(t) {
  const s = { pos: MIA0, heading: Math.PI, layers: [['idle', t + 0.7]], face: 'suspicious', raise: 0, wave: 0, hop: 0, visible: t >= W.mia - 0.15 };
  const w = along([MIA0, MIA1], T.miaWalk, t, WALK);
  if (t >= T.miaWalk) { s.pos = w.pos; if (w.moving) s.layers = [['walk', w.anim]]; }
  if (t >= W.order) s.face = 'determined';
  if (t >= W.stared) s.face = 'scared';
  const a = along([MIA1, MIA2], T.miaAside, t, WALK);
  if (t >= T.miaAside) { s.pos = a.pos; s.heading = a.moving ? a.heading : head(MIA2, [M1[0], 0]); if (a.moving) s.layers = [['walk', a.anim]]; }
  if (t >= W.whispered - 0.2) s.face = 'determined';
  const r = along([MIA2, MIA_SLAM], T.miaRun, t, RUN);
  if (t >= T.miaRun) {
    s.pos = r.pos; s.heading = r.moving ? r.heading : head(MIA_SLAM, DOOR_EDGE); s.layers = r.moving ? [['run', r.anim]] : [['idle', t]];
    if (t >= T.slam[0] - 0.08 && t < T.rattle[1] + 0.3) { s.layers = [['push', Math.min((t - T.slam[0] + 0.08) * 1.4, 0.3), 1, false]]; s.face = 'angry'; }   // holds it shut
  }
  if (t >= T.rattle[1] + 0.6) { s.face = 'neutral'; s.heading = angLerp(head(MIA_SLAM, DOOR_EDGE), 0, smooth(inv(T.rattle[1] + 0.6, T.rattle[1] + 0.9, t))); }
  return s;
}

// Door: open (the copy came through it in Part 1's blackout), slammed by Mia, rattled from the other side.
export function doorAt(t) {
  if (t < T.slam[0]) return DOOR_OPEN;
  if (t < T.slam[1]) return DOOR_OPEN * (1 - inv(...T.slam, t) ** 2);
  if (t > T.rattle[0] && t < T.rattle[1]) return 0.025 * Math.abs(Math.sin((t - T.rattle[0]) * 38));
  return 0;
}

// Ceiling lights over the walk-back go out one per step: the dark closes in.
export const LIGHTS_OUT = [...STEPS, LAST];

// Real times of events, for sound cues, score and overlays.
const copyThrough = (() => { let lo = SPRINT, hi = FLING[1]; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (copyAt(m).pos[1] > DOOR_Z) lo = m; else hi = m; } return lo; })();
export const EVENTS = {
  lightOn: W.mia - 0.1, sync: T.sync, raise: T.raise[0], tilt: T.tilt[0], lunge: T.lunge, jump: T.jump,
  land: along(MJUMP, T.jump, 0, RUN).arrive, steps: STEPS, last: LAST, fight: LAST + 0.1, sprint: SPRINT, pull: PULL[0],
  through: copyThrough, fall: FLING[1] - 0.05, slam: T.slam[1], rattle: T.rattle, gone: T.gone,
  waved: W.waved - 0.1, nothing: W.nothing, cta: W.what - 0.1, end: W.end,
};
