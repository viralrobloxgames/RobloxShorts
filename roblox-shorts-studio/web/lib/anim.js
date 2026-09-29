// Deterministic timeline helpers: every value is a pure function of time t (seconds).
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeIn = (t) => t * t * t;
export const easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
export const easeOutElastic = (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);

// keys: [[t, value], ...] with value a number or array; per-segment ease (default smooth).
export function track(keys, ease = smooth) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
        const u = (e || ease)((t - t0) / (t1 - t0));
        return Array.isArray(a) ? a.map((x, k) => lerp(x, b[k], u)) : lerp(a, b, u);
      }
    }
    return keys[keys.length - 1][1];
  };
}

// Shot list lookup: shots = [{start, end, ...}] -> {shot, index, local t, u 0..1}
export function shotAt(shots, t) {
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    if (t < s.end || i === shots.length - 1) return { shot: s, index: i, lt: t - s.start, u: clamp((t - s.start) / (s.end - s.start)) };
  }
}
