// Poses for the pack's spinosaurus (creatures/spinosaurus, R15-style bodies, posed with web/lib/creature.js).
// Each returns { body: [rx, ry, rz] | {r, p} }. Model front is -Z, so +X on a leg swings it forward, +X on UpperTorso /
// Head lifts the front, +X on Tail lowers it, +Y on Tail swings it sideways. Root body is LowerTorso.
// The walk is the game's CreatureGait: legs +-26 deg in antiphase, arms +-16 deg, tail sway +-11 deg, head bob 6 deg at
// twice the stride rate, root bob 0.55 studs with |sin|.
export const SPINO_STRIDE = 18;        // studs per walk cycle at scale 1
const D = Math.PI / 180;

export function spinoIdle(t = 0) {
  const b = Math.sin(t * 1.8);
  return { UpperTorso: [0.02 * b, 0, 0], Head: [0.03 * b, 0.06 * Math.sin(t * 0.7), 0], Tail: [0, 0.08 * Math.sin(t * 1.1), 0],
    LeftUpperArm: [0.05 * b, 0, 0], RightUpperArm: [0.05 * b, 0, 0], LowerTorso: { p: [0, 0.1 * b, 0] } };
}
export function spinoWalk(phase) {
  const a = phase * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), k = (x) => Math.max(0, x);
  return { LowerTorso: { r: [0, 0, 0.02 * s], p: [0, 0.55 * Math.abs(s) - 0.3, 0] },
    RightUpperLeg: [26 * D * s, 0, 0], LeftUpperLeg: [-26 * D * s, 0, 0],
    RightLowerLeg: [-0.5 * k(c), 0, 0], LeftLowerLeg: [-0.5 * k(-c), 0, 0],
    RightUpperArm: [16 * D * -s, 0, 0], LeftUpperArm: [16 * D * s, 0, 0],
    Tail: [0.04, 11 * D * Math.sin(a + 0.6), 0], Head: [6 * D * Math.sin(2 * a), 0, 0] };
}
export function spinoRoar(t = 0) {
  const j = 0.04 * Math.sin(t * 40);
  return { UpperTorso: [0.22, 0, 0], Head: [0.42, j, j], LeftUpperArm: [-0.6, 0, -0.3], RightUpperArm: [-0.6, 0, 0.3],
    Tail: [0.1, 0.06 * Math.sin(t * 12), 0], LowerTorso: { p: [0, 0.3, 0] } };
}
// Bends forward with the head down to the ground (u 0..1), e.g. to sniff or pick something up.
export function spinoBend(u, t = 0) {
  return { UpperTorso: [-0.42 * u, 0, 0], Head: [-0.25 * u + 0.02 * Math.sin(t * 3), 0, 0], Tail: [-0.2 * u, 0.05 * Math.sin(t), 0],
    LeftUpperLeg: [0.12 * u, 0, 0], RightUpperLeg: [0.12 * u, 0, 0], LeftLowerLeg: [-0.18 * u, 0, 0], RightLowerLeg: [-0.18 * u, 0, 0] };
}
export function mixPose(a, b, u) {
  const out = {}, keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const R = (v) => (Array.isArray(v) ? v : v?.r) || [0, 0, 0], P = (v) => (Array.isArray(v) ? null : v?.p) || [0, 0, 0];
  for (const k of keys) {
    const r = R(a[k]).map((x, i) => x + (R(b[k])[i] - x) * u), p = P(a[k]).map((x, i) => x + (P(b[k])[i] - x) * u);
    out[k] = p.some((x) => x) ? { r, p } : r;
  }
  return out;
}
// Add rotations of b on top of a (for layering a head turn on a walk).
export function addPose(a, b) { const o = { ...a }; for (const [k, v] of Object.entries(b)) { const ra = Array.isArray(o[k]) ? o[k] : o[k]?.r || [0, 0, 0], rb = Array.isArray(v) ? v : v.r; const r = ra.map((x, i) => x + rb[i]); o[k] = Array.isArray(o[k]) || !o[k] ? r : { ...o[k], r }; } return o; }
