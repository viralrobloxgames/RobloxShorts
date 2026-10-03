// The Last Penalty: story timeline shared by web/penalty_clip.js and source/sound_cues.py / source/score.py.
// Pure (no three.js). Positions are [x, z] in studs on the pitch: the goal line is z = 0 (goal mouth x -8.5..8.5,
// crossbar 7.2 high, net back to z = -4.5), the penalty spot is at z = 18 and the pitch runs towards +z.
// Mia keeps goal facing +z; Leo shoots towards -z. "Left" in the script is the KEEPER's left (you are the keeper), which
// is world +X; the main kick angles are shot from the goal side, so it is also screen-left.
// Everything is real time t keyed to narration words (W), except the first kick, which plays in slow motion (game time
// G(t)) so the dive, the kick and the save land on "dive", "touches" and "slaps".
import { W } from './beats.js';

export const RUN = 16, WALK = 12, STRIDE = 14.5, BR = 0.55;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inv = (a, b, x) => clamp((x - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => u * u * (3 - 2 * u);
const easeOut = (u) => 1 - (1 - u) ** 3;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const head = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
function along(pts, t0, t, speed) {
  const lens = pts.slice(1).map((p, i) => dist(pts[i], p)), total = lens.reduce((a, b) => a + b, 0);
  const d = clamp((t - t0) * speed, 0, total);
  let k = 0, rest = d;
  while (k < lens.length - 1 && rest > lens[k]) { rest -= lens[k]; k++; }
  const u = lens[k] ? rest / lens[k] : 1, a = pts[k], b = pts[k + 1];
  return { pos: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], heading: head(a, b), moving: t > t0 && d < total, done: d >= total, u: total ? d / total : 1, arrive: t0 + total / speed, anim: d / STRIDE };
}

// ---------- the set ----------
export const GOAL = { halfW: 8.5, bar: 7.2, depth: 4.5 };
export const SPOT = [0, 18];
export const MIA_HOME = [0, 0.35];                    // heels on the line, facing the spot
export const LEO_RUN0 = [-4, 29.5];                   // run-up start
export const LEO_KICK = [-0.55, 19.35];               // plant: right boot behind the ball
export const MAX_SIDE = [15.5, 7], MAX_STORM = [5.6, 5.2], MAX_END = [3.4, 4.2];
export const REF = [-12.5, 12.5];
export const BOOT = [0.42, 1.42];                     // the scuffed ball stops against Mia's left boot
export const HIT = [7.0, 1.45, 1.1];                  // where her glove meets the first kick (x, y, z)

// ---------- slow motion for kick 1 ----------
const S0 = W.dive - 0.05;
const DIVE_G = S0 + 0.05, KICK_G = DIVE_G + 0.32, HIT_G = KICK_G + 0.42;
const HIT_REAL = W.slaps + 0.05;
const R = Math.min(1, (HIT_G - S0) / Math.max(0.01, HIT_REAL - S0));
const S1 = HIT_REAL + 0.3, GS1 = S0 + R * (S1 - S0);
export const G = (t) => (t < S0 ? t : t < S1 ? S0 + R * (t - S0) : GS1 + (t - S1));
export const realOf = (g) => (g < S0 ? g : g < GS1 ? S0 + (g - S0) / R : S1 + (g - GS1));
export const SLOWMO = { from: S0, to: S1, rate: R };

// ---------- key times (real) ----------
export const T = {
  flick: W.flick + 0.05,
  kick1: realOf(KICK_G), hit1: HIT_REAL, dive1: realOf(DIVE_G),
  storm: W.storms + 0.05, getUp: W.storms + 0.25,
  whistle: W.whistle - 0.05,
  freeze: [W.leftLine - 0.25, W.now - 0.35],          // replay of the kick moment: off the line
  reset: W.now - 0.35,
  glare: W.reading - 0.1, ahead: W.anywhere - 0.2, close: W.closes + 0.1,
  plant: W.stay - 0.1,
  kick2: W.kicks + 0.2,
  boot: W.boot + 0.05,
  opens: W.opens + 0.05, confused: W.move + 0.1, down: W.every2 + 0.1, cry: W.see + 0.05, celebrate: W.see - 0.1,
  cta: W.follow - 0.15,
};
const RUN2_D = dist(LEO_RUN0, LEO_KICK);
const RUN2_V = clamp(RUN2_D / Math.max(0.1, T.kick2 - W.runs - 0.05), 6, 12);
T.run2 = T.kick2 - RUN2_D / RUN2_V;
T.roll = T.kick2 + 0.1;

// Season replay (flashback): two old penalties, both scored, Leo looking at the corner first. Max kept goal and
// guessed wrong both times. Shown between "Right before he kicks" and "Every time."
export const REPLAY = { from: W.right - 0.25, b: W.everyTime - 0.25, to: W.flick - 0.3 };
const RA_START = [-2.6, 24.6], RA_RUN = W.looks + 0.35;
REPLAY.kickA = RA_RUN + dist(RA_START, LEO_KICK) / 13;
const RB_START = [-1.7, 22.4];
REPLAY.kickB = REPLAY.b + 0.45 + dist(RB_START, LEO_KICK) / 10;
export const inReplay = (t) => t >= REPLAY.from && t < REPLAY.to;
export const inFreeze = (t) => t >= T.freeze[0] && t < T.freeze[1];

// Leg swing for a kick: + is back (wind-up), - is forward. ph = time from contact (s).
function legSwing(ph) {
  if (ph < -0.24) return 0;
  if (ph < 0) return 0.95 * smooth(inv(-0.24, -0.08, ph)) * (1 - smooth(inv(-0.08, 0, ph))) - 0.25 * smooth(inv(-0.08, 0, ph));
  if (ph < 0.22) return lerp(-0.25, -1.45, easeOut(ph / 0.22));
  return lerp(-1.45, 0, smooth(inv(0.22, 0.65, ph)));
}

const leoBase = () => ({ pos: LEO_RUN0, heading: head(LEO_RUN0, SPOT), layers: [['idle', 0]], face: 'smug', yaw: 0, pitch: 0, kick: 0, lean: 0, visible: true, arms: 0 });

// ---------- Leo ----------
export function leoAt(t) {
  if (inReplay(t)) return leoReplay(t);
  const s = leoBase(); s.layers = [['idle', t]];
  if (t < T.reset) {                                   // the first kick, in game time
    const g = G(t), kg = KICK_G;
    if (t >= W.leo - 0.2) s.face = 'cool';
    if (t >= W.season + 0.6) s.face = 'smug';
    if (t >= T.flick) s.yaw = -0.55 * smooth(inv(T.flick, T.flick + 0.12, t)) * (1 - smooth(inv(kg + 0.25, kg + 0.6, g)));
    if (t >= T.flick) s.face = 'determined';
    const r = along([LEO_RUN0, LEO_KICK], kg - 0.02 - dist(LEO_RUN0, LEO_KICK) / 12, g, 12);
    if (g > kg - 0.02 - dist(LEO_RUN0, LEO_KICK) / 12) { s.pos = r.pos; s.heading = r.heading; s.layers = r.moving ? [['run', r.anim]] : [['idle', g]]; }
    s.kick = legSwing(g - kg);
    if (r.done) s.heading = head(LEO_KICK, SPOT);
    if (t >= T.hit1 + 0.2) s.face = 'shocked';
    if (t >= T.storm) { s.face = 'angry'; s.heading = head(LEO_KICK, [4, 2]); }
    if (t >= T.whistle + 0.15) s.face = 'smug';
    if (t >= T.whistle + 0.15) s.heading = head(LEO_KICK, REF);
  } else {                                             // the retake
    s.face = 'smug';
    if (t >= T.glare) s.face = 'scheming';
    if (t >= T.ahead) s.face = 'determined';
    if (t >= T.close) s.face = 'squeezed';
    const r = along([LEO_RUN0, LEO_KICK], T.run2, t, RUN2_V);
    if (t >= T.run2) { s.pos = r.pos; s.heading = r.heading; s.layers = r.moving ? [['run', r.anim]] : [['idle', t]]; s.arms = r.moving ? 0.35 : 0; }
    s.kick = legSwing(t - T.kick2);
    if (t >= T.kick2) {                                // scuffed: stumbles forward, arms out
      const k = inv(T.kick2, T.kick2 + 0.5, t);
      s.pos = [LEO_KICK[0] + 0.2 * k, LEO_KICK[1] - 1.1 * easeOut(k)]; s.heading = head(LEO_KICK, SPOT);
      s.lean = 0.28 * Math.sin(Math.PI * k); s.layers = [['idle', t]]; s.arms = 0.55 * (1 - smooth(inv(T.kick2 + 0.5, T.kick2 + 1.2, t)));
    }
    if (t >= T.opens) { s.face = 'happy'; s.yaw = -0.5 * smooth(inv(T.opens, T.opens + 0.2, t)); s.pitch = -0.12 * smooth(inv(T.opens, T.opens + 0.2, t)); }
    if (t >= T.confused) s.face = 'confused';
    if (t >= T.down) { const k = smooth(inv(T.down, T.down + 0.35, t)); s.yaw = lerp(-0.5, 0.05, k); s.pitch = lerp(-0.12, 0.42, k); s.face = 'shocked'; }
    if (t >= T.cry) s.face = 'crying';
  }
  return s;
}

function leoReplay(t) {
  const s = leoBase(); s.layers = [['idle', t]]; s.face = 'cool';
  if (t < REPLAY.b) {                                  // A: looks at HIS left corner (world -X), scores there
    s.pos = RA_START; s.heading = head(RA_START, SPOT);
    const r = along([RA_START, LEO_KICK], RA_RUN, t, 13);
    s.yaw = 0.55 * smooth(inv(W.looks, W.looks + 0.12, t)) * (1 - smooth(inv(REPLAY.kickA + 0.25, REPLAY.kickA + 0.6, t)));
    if (t >= RA_RUN) { s.pos = r.pos; s.heading = r.done ? head(LEO_KICK, SPOT) : r.heading; s.layers = r.moving ? [['run', r.anim]] : [['idle', t]]; }
    s.kick = legSwing(t - REPLAY.kickA);
    if (t > REPLAY.kickA + 0.5) s.face = 'smug';
  } else {                                             // B: looks at his right (world +X), scores there
    s.pos = RB_START; s.heading = head(RB_START, SPOT);
    s.yaw = -0.55 * smooth(inv(REPLAY.b + 0.05, REPLAY.b + 0.17, t)) * (1 - smooth(inv(REPLAY.kickB + 0.25, REPLAY.kickB + 0.6, t)));
    const r = along([RB_START, LEO_KICK], REPLAY.b + 0.45, t, 10);
    if (t >= REPLAY.b + 0.45) { s.pos = r.pos; s.heading = r.done ? head(LEO_KICK, SPOT) : r.heading; s.layers = r.moving ? [['run', r.anim]] : [['idle', t]]; }
    s.kick = legSwing(t - REPLAY.kickB);
    if (t > REPLAY.kickB + 0.5) s.face = 'smug';
  }
  return s;
}

// ---------- keepers: the dive ----------
// side +1 dives towards world +X (the keeper's left), -1 towards -X. u 0..1 over the dive. Returns placement extras.
export function diveAt(u, side, from = MIA_HOME, fwd = 1.5) {
  const k = easeOut(clamp(u));
  return {
    pos: [from[0] + side * 1.7 * k, from[1] + fwd * k], roll: side * (Math.PI / 2) * smooth(clamp(u * 1.25)),
    lift: 1.9 * Math.sin(Math.PI * clamp(u * 1.05)) * (u < 0.95 ? 1 : 0), armUp: smooth(clamp(u * 2.2)), grounded: u >= 0.95,
  };
}
const DIVE_DUR = 0.72;

// ---------- Mia ----------
export function miaAt(t) {
  const s = { pos: MIA_HOME, heading: 0, layers: [['idle', t + 0.4]], face: 'determined', yaw: 0, pitch: 0, roll: 0, lift: 0, armUp: 0, armSide: 1, visible: !inReplay(t), crouch: 0.0 };
  if (t < T.reset) {
    const g = G(t);
    if (t >= W.watched - 0.2) s.face = 'suspicious';
    if (t >= W.flick - 0.3) s.face = 'determined';
    s.crouch = 0.6 * smooth(inv(W.flick - 0.6, W.flick, t));
    if (g >= DIVE_G) {
      const d = diveAt((g - DIVE_G) / DIVE_DUR, 1);
      s.pos = d.pos; s.roll = d.roll; s.lift = d.lift; s.armUp = d.armUp; s.crouch = 0; s.face = 'shouting';
      s.layers = [['idle', 0]];
      if (t >= T.hit1 + 0.1) s.face = 'laugh';
    }
    if (t >= T.getUp) {                                // up again, celebrating... then the whistle
      const k = smooth(inv(T.getUp, T.getUp + 0.45, t)), d = diveAt(1, 1);
      s.roll = d.roll * (1 - k); s.lift = 0; s.armUp = 1 - k; s.pos = d.pos;
      if (k >= 1) { s.layers = [['proud', t - T.getUp - 0.45, 1, false]]; }
    }
    if (t >= T.whistle + 0.1) { s.face = 'shocked'; s.layers = [['idle', t]]; s.heading = head(diveAt(1, 1).pos, REF); }
    if (t >= W.leftLine + 0.3) s.face = 'sad';
  } else {
    s.face = 'determined';
    if (t >= W.anywhere) s.face = 'suspicious';
    if (t >= W.clue - 0.2) s.face = 'nervous';
    if (t >= W.hardest - 0.1) s.face = 'determined';
    s.crouch = 0.6 * smooth(inv(W.hardest, W.hardest + 0.5, t));
    if (t >= T.kick2 + 0.05) { s.face = 'surprised'; s.pitch = 0.35 * smooth(inv(T.kick2 + 0.3, T.kick2 + 1.2, t)); s.crouch = 0.6 * (1 - smooth(inv(T.kick2 + 0.3, T.kick2 + 1.0, t))); }
    if (t >= T.boot) s.face = 'smug';
    if (t >= T.opens) s.pitch = lerp(0.35, 0, smooth(inv(T.opens, T.opens + 0.4, t)));
    if (t >= T.down) { s.pitch = 0; s.face = 'smug'; }
    if (t >= T.celebrate) { s.face = 'laugh'; s.layers = [['proud', t - T.celebrate, 1, false]]; }
  }
  return s;
}

// ---------- Max (Mia's team; keeper in the season replay) ----------
export function maxAt(t) {
  const s = { pos: MAX_SIDE, heading: head(MAX_SIDE, [0, 9]), layers: [['idle', t + 1.1]], face: 'nervous', yaw: 0, pitch: 0, roll: 0, lift: 0, armUp: 0, armSide: 1, visible: true, crouch: 0 };
  if (inReplay(t)) {                                    // keeper, wrong way twice
    const A = t < REPLAY.b, kick = A ? REPLAY.kickA : REPLAY.kickB, side = A ? 1 : -1;
    s.pos = MIA_HOME; s.heading = 0; s.face = 'determined'; s.crouch = 0.5;
    if (t >= kick - 0.08) { const d = diveAt((t - kick + 0.08) / DIVE_DUR, side, MIA_HOME, 0.6); Object.assign(s, { pos: d.pos, roll: d.roll, lift: d.lift, armUp: d.armUp, armSide: side, crouch: 0, layers: [['idle', 0]], face: 'shocked' }); }
    return s;
  }
  if (t < T.reset) {
    if (t >= T.hit1 + 0.1) s.face = 'happy';
    const r = along([MAX_SIDE, MAX_STORM], T.storm, Math.min(t, T.whistle), RUN);
    if (t >= T.storm) { s.pos = r.pos; s.heading = r.heading; s.layers = r.moving && t < T.whistle ? [['run', r.anim]] : [['idle', t]]; s.face = 'laugh'; }
    if (t >= T.whistle) { s.face = 'shocked'; s.heading = head(s.pos, REF); }   // frozen mid-run
  } else {
    if (t >= T.boot + 0.2) s.face = 'happy';
    const r = along([MAX_SIDE, MAX_END], T.celebrate, t, RUN);
    if (t >= T.celebrate) { s.pos = r.pos; s.heading = r.moving ? r.heading : head(MAX_END, LEO_KICK); s.layers = r.moving ? [['run', r.anim]] : [['laugh_big', t - r.arrive]]; s.face = 'laugh'; }
  }
  return s;
}

// ---------- the referee (the Noob) ----------
export function refAt(t) {
  const s = { pos: REF, heading: head(REF, [0, 10]), layers: [['idle', t + 2.3]], face: 'neutral', blow: 0, point: null, visible: !inReplay(t), yaw: 0, pitch: 0 };
  if (t < T.reset) {
    if (t >= T.whistle - 0.25) s.blow = smooth(inv(T.whistle - 0.25, T.whistle, t)) * (1 - smooth(inv(W.leftLine - 0.1, W.leftLine + 0.15, t)));
    if (t >= T.whistle) s.face = 'shouting';
    if (t >= W.leftLine) { s.face = 'annoyed'; s.point = 'line'; s.heading = head(REF, [2, 0.5]); }
    if (t >= W.retake) { s.point = 'spot'; s.heading = head(REF, SPOT); }
  }
  return s;
}

// ---------- the ball ----------
// { p: [x, y, z], rot: rolled distance along heading, dir: heading of travel, visible }
export function ballAt(t) {
  const rest = { p: [SPOT[0], BR, SPOT[1]], rot: 0, dir: Math.PI, visible: true };
  if (inReplay(t)) {
    const A = t < REPLAY.b, kick = A ? REPLAY.kickA : REPLAY.kickB, to = A ? [-6.6, 5.3, -3.3] : [6.4, 1.3, -3.3];
    if (t < kick) return rest;
    const u = clamp((t - kick) / 0.38);
    const p = [lerp(SPOT[0], to[0], u), lerp(BR, to[1], u) + 1.2 * Math.sin(Math.PI * u) * (A ? 0.4 : 0.1), lerp(SPOT[1], to[2], u)];
    if (u >= 1) { const f = clamp((t - kick - 0.38) / 0.35); p[1] = Math.max(BR, to[1] - 9 * f * f); }
    return { p, rot: u * 22, dir: Math.atan2(to[0] - SPOT[0], to[2] - SPOT[1]), visible: true };
  }
  if (t < T.reset) {
    const g = G(t);
    if (g < KICK_G) return rest;
    if (g < HIT_G) {
      const u = (g - KICK_G) / (HIT_G - KICK_G);
      return { p: [lerp(SPOT[0], HIT[0], u), lerp(BR, HIT[1], u) + 0.5 * Math.sin(Math.PI * u), lerp(SPOT[1], HIT[2], u)], rot: u * 18, dir: Math.atan2(HIT[0], HIT[2] - SPOT[1]), visible: true };
    }
    // slapped wide: up and out past the post, then bouncing away behind the goal line
    const tau = g - HIT_G, v = [15, 7.5, -9], a = -34;
    let y = HIT[1] + v[1] * tau + 0.5 * a * tau * tau;
    const tLand = (v[1] + Math.sqrt(v[1] * v[1] - 2 * a * (HIT[1] - BR))) / -a;
    if (tau > tLand) { const t2 = tau - tLand, v2 = 0.4 * -(v[1] + a * tLand); y = Math.max(BR, BR + v2 * t2 + 0.5 * a * t2 * t2); }
    const k = 1 - Math.exp(-tau * 0.9);
    return { p: [HIT[0] + (v[0] / 0.9) * k, y, HIT[2] + (v[2] / 0.9) * k], rot: 18 + tau * 9, dir: Math.atan2(v[0], v[2]), visible: true };
  }
  if (t < T.roll) return rest;
  // the scuff: rolls forward, slowly, and stops against Mia's boot
  const total = dist(SPOT, BOOT), u = clamp((t - T.roll) / Math.max(0.5, T.boot - T.roll)), d = total * (1 - (1 - u) ** 2);
  const f = d / total;
  return { p: [lerp(SPOT[0], BOOT[0], f), BR, lerp(SPOT[1], BOOT[1], f)], rot: d / BR, dir: Math.atan2(BOOT[0] - SPOT[0], BOOT[1] - SPOT[1]), visible: true };
}

// The crowd's energy (0 hushed .. 1 roaring) and whether they're on their feet.
export function crowdAt(t) {
  if (inReplay(t)) return 0.5;
  const pts = [[0, 0.35], [T.hit1 - 0.1, 0.5], [T.hit1 + 0.1, 1], [T.whistle, 1], [T.whistle + 0.3, 0.15], [T.reset, 0.3],
    [W.stay - 0.3, 0.25], [W.stay + 0.3, 0.02], [T.kick2, 0.02], [T.kick2 + 0.3, 0.3], [T.boot - 0.1, 0.4], [T.boot + 0.2, 0.75],
    [T.celebrate, 0.8], [T.celebrate + 0.3, 1], [W.end + 1, 1]];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], inv(pts[i - 1][0], pts[i][0], t));
  return 1;
}

export const EVENTS = {
  flick: T.flick, dive1: T.dive1, kick1: T.kick1, hit1: T.hit1, slowFrom: S0, slowTo: S1, storm: T.storm, getUp: T.getUp,
  whistle: T.whistle, freeze: T.freeze, reset: T.reset, close: T.close, plant: T.plant, run2: T.run2, kick2: T.kick2,
  roll: T.roll, boot: T.boot, opens: T.opens, down: T.down, celebrate: T.celebrate, cta: T.cta, end: W.end,
  replay: [REPLAY.from, REPLAY.to], replayKicks: [REPLAY.kickA, REPLAY.kickB], replayB: REPLAY.b,
  ballOut: realOf(HIT_G + 0.42), run2Speed: RUN2_V,
};
