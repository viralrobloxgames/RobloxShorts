// Roblox-style locomotion for pack actors. The pack's walk/run is Roblox's R6 run cycle, which Roblox's Animate script
// plays at (speed / 14.5): one anim-second of the cycle carries the character 14.5 studs. Driving the cycle from the
// distance actually travelled keeps the feet planted on the ground: nobody slides, nobody "walks on the spot", and the legs
// stop the moment the character arrives. Move at Roblox speeds (walk ~12, run ~16 studs/s), not slow drifts.
export const STRIDE = 14.5;

// Constant-speed move from `from` to `to`, starting at t0. Returns { pos, moving, done, u, heading, anim, arrive }.
// `anim` is the cycle time to feed robloxPose ([[A.run, m.anim]]) while `moving`.
export function travel(from, to, t0, s, speed = 12) {
  const dist = from.distanceTo(to), dur = Math.max(1e-3, dist / speed);
  const u = Math.min(1, Math.max(0, (s - t0) / dur));
  return {
    pos: from.clone().lerp(to, u), moving: u > 0 && u < 1, done: u >= 1, u, arrive: t0 + dur,
    heading: Math.atan2(to.x - from.x, to.z - from.z), anim: (u * dist) / STRIDE,
  };
}
// Same, but timed to arrive at `arriveAt`.
export const travelTo = (from, to, arriveAt, s, speed = 12) => travel(from, to, arriveAt - from.distanceTo(to) / speed, s, speed);
