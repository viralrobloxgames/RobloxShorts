// Poses for the pack's T-rex (creatures/trex, posed with web/lib/creature.js). Each returns { body: [rx, ry, rz] | {r, p} }.
// Axes read from a probe render: +X on neck2/head lifts the head, +X on a leg swings it forward, +X on mouth closes the
// jaw (rest is half open; -X opens wide), +Y on the tail swings it sideways, torso {p} moves the whole body.
// The run cycle is the game's own CreatureGait: legs +-26 deg in antiphase, arms +-16 deg, tail sway +-11 deg,
// head bob 6 deg at twice the stride rate, root bob 0.55 studs with |sin|; knees added so the feet clear the ground.
export const TREX_STRIDE = 12.5;     // studs travelled per run cycle at scale 1 (multiply by the creature's scale)
export const TREX_FEET = ['leg_L_Hand', 'leg_R_Hand'];
const D = Math.PI / 180;

export function trexIdle(t = 0) {
  const b = Math.sin(t * 2.0);
  return { neck2: [0.03 * b, 0.04 * Math.sin(t * 0.7), 0], head: [0.02 * b, 0, 0], mouth: [0.15 + 0.05 * b, 0, 0],
    tail01: [0, 0.06 * Math.sin(t * 1.1), 0], tail02: [0, 0.06 * Math.sin(t * 1.1 - 0.5), 0], tail03: [0, 0.07 * Math.sin(t * 1.1 - 1), 0],
    torso: { p: [0, 0.08 * b, 0] } };
}
// Asleep: body down on the ground, legs folded under, head resting low, jaw shut, tail curled round, slow breathing.
export function trexSleep(t = 0) {
  const br = 0.5 + 0.5 * Math.sin(t * 1.6);
  return { torso: { r: [-0.05, 0, 0], p: [0, -3.1 + 0.12 * br, 0] },
    leg_L: [1.05, 0, 0], leg_R: [1.05, 0, 0], leg_L_lower: [-1.9, 0, 0], leg_R_lower: [-1.9, 0, 0], leg_L_D: [0.85, 0, 0], leg_R_D: [0.85, 0, 0],
    neck2: [-0.62, 0.1, 0], neck1: [-0.35, 0.06, 0], head: [1.0 + 0.03 * br, 0.06, 0.05], mouth: [0.32, 0, 0],
    arm_L: [0.3, 0, 0], arm_R: [0.3, 0, 0],
    tail01: [-0.08, 0.28, 0], tail02: [-0.05, 0.32, 0], tail03: [0, 0.38, 0], tail04: [0, 0.42, 0] };
}
export function trexRoar(t = 0) {
  const j = 0.04 * Math.sin(t * 40);
  return { torso: { r: [0.06, 0, 0], p: [0, 0.3, 0] }, neck2: [0.3, j, 0], neck1: [0.15, 0, 0], head: [0.2, 0, j], mouth: [-0.75, 0, 0],
    arm_L: [-0.4, 0, 0], arm_R: [-0.4, 0, 0], tail01: [0.12, 0.05 * Math.sin(t * 12), 0], tail02: [0.08, 0, 0] };
}
// Run cycle, phase in cycles (= distance / (TREX_STRIDE * scale)).
export function trexRun(phase) {
  const a = phase * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), leg = (k) => Math.max(0, k);
  return { torso: { r: [-0.06, 0, 0.03 * s], p: [0, 0.55 * Math.abs(Math.sin(a)) - 0.25, 0] },
    leg_R: [26 * D * s, 0, 0], leg_L: [-26 * D * s, 0, 0],
    leg_R_lower: [-0.55 * leg(c), 0, 0], leg_L_lower: [-0.55 * leg(-c), 0, 0],
    arm_R: [16 * D * -s, 0, 0], arm_L: [16 * D * s, 0, 0],
    tail01: [0.05, 11 * D * Math.sin(a + 0.6), 0], tail02: [0, 11 * D * Math.sin(a), 0], tail03: [0, 11 * D * Math.sin(a - 0.6), 0], tail04: [0, 11 * D * Math.sin(a - 1.2), 0],
    neck2: [-0.12 + 6 * D * Math.sin(2 * a), 0, 0], head: [0.05, 0, 0], mouth: [-0.3, 0, 0] };
}
// Headbutt / swipe, u 0..1: wind up (head back), strike (head down and forward, jaw open), recover.
export function trexHeadbutt(u) {
  const k = u < 0.35 ? -Math.sin((u / 0.35) * Math.PI / 2) : u < 0.55 ? -1 + 2.2 * ((u - 0.35) / 0.2) : 1.2 * (1 - (u - 0.55) / 0.45);
  return { torso: { r: [-0.12 * Math.max(0, k), 0, 0] }, neck2: [-0.35 * k, 0, 0], neck1: [-0.15 * k, 0, 0], head: [-0.1 * k, 0, 0], mouth: [k > 0.3 ? -0.6 : 0.1, 0, 0],
    tail01: [0.15 * Math.max(0, k), 0, 0] };
}
// Blend two poses (missing bodies count as rest).
export function mixPose(a, b, u) {
  const out = {}, keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const R = (v) => (Array.isArray(v) ? v : v?.r) || [0, 0, 0], P = (v) => (Array.isArray(v) ? null : v?.p) || [0, 0, 0];
  for (const k of keys) {
    const r = R(a[k]).map((x, i) => x + (R(b[k])[i] - x) * u), p = P(a[k]).map((x, i) => x + (P(b[k])[i] - x) * u);
    out[k] = p.some((x) => x) ? { r, p } : r;
  }
  return out;
}
