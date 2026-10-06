// Camera rules. The camera is on whoever speaks; framings cu / mcu / ms / ws; two-shots and over-the-shoulders keep to
// one side of the scene's line (no 180-degree crossing); the camera never sits inside set geometry (it is pulled in
// front of the first wall between it and its subject).
//   K.setLine(max, skye, +1);                       // once per scene: the line runs max -> skye, cameras stay on side +1
//   K.camOn(stage, skye, 'mcu');                    // Skye speaks
//   K.twoShot(stage, max, skye);  K.overShoulder(stage, max, skye, 'mcu');
//   K.setCam(stage, set.cams.closet_pov);           // a set's named camera
// Each returns the shot { pos, target, fov } and applies it (camera, sky dome, shadow box). Pure functions of their
// inputs: call one per frame from the shot table.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
// How much of the subject the frame shows vertically (studs, at scale 1) and where the eyes sit (fraction above the
// frame centre). Roblox R6: feet 0, eyes ~4.6, top of head ~5.1.
export const FRAMINGS = {
  cu: { span: 2.6, eyeUp: 0.04 },     // the whole head with its hair
  mcu: { span: 3.8, eyeUp: 0.1 },     // head and shoulders
  ms: { span: 4.8, eyeUp: 0.18 },     // waist up
  ws: { span: 9, eyeUp: 0.22 },       // whole body with room around it
};

// Eye-level point of an actor's head (world): 0.75 studs above the neck pivot (x scale).
export function headPos(actor, out = V()) {
  actor.root.updateMatrixWorld(true);
  return actor.bones.Head.localToWorld(out.set(0, 0.75 * actor.scale, 0));
}
export const heading = (actor) => actor.root.rotation.y;
const fwd = (h) => V(Math.sin(h), 0, Math.cos(h));

// ---------- the 180-degree line ----------
let LINE = null;
// setLine(a, b, side): a and b are actors (or Vector3s); cameras stay on `side` (+1 / -1) of the line a -> b until the
// next setLine / clearLine. Side +1 = the camera is to the right of a looking at b... use whichever reads; keep it per scene.
export function setLine(a, b, side = 1) { LINE = { a, b, side }; }
export function clearLine() { LINE = null; }
const P = (x) => (x.isVector3 ? x.clone() : headPos(x));
const sideOf = (p) => { if (!LINE) return 0; const A = P(LINE.a), B = P(LINE.b); const d = B.sub(A), q = p.clone().sub(A); return Math.sign(d.x * q.z - d.z * q.x) || 1; };
const onSide = (p) => !LINE || sideOf(p) === LINE.side;

// ---------- applying a shot ----------
const ray = new THREE.Raycaster();
// Pull pos towards target until nothing in `blockers` (the current set's group by default) is between them.
export function clearShot(target, pos, blockers, margin = 0.35, skip = []) {
  if (!blockers) return pos;
  blockers = [].concat(blockers).filter((b) => b && b.visible && !skip.includes(b));
  if (!blockers.length) return pos;
  const d = pos.clone().sub(target), len = d.length(); if (len < 1e-3) return pos;
  ray.set(target, d.divideScalar(len)); ray.near = 0.2; ray.far = len;
  const hits = ray.intersectObjects(blockers, true).filter((h) => h.object.visible && visibleChain(h.object) && !h.object.userData.noCamBlock && !(h.object.material?.transparent && h.object.material.opacity < 0.5));
  if (!hits.length) return pos;
  return target.clone().addScaledVector(ray.ray.direction, Math.max(0.6, hits[0].distance - margin));
}
const visibleChain = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };

let BLOCKERS = null;
// What cameras must stay out of: the shown set's group plus the actors (an actor is never a blocker in its own shot).
// Every frame: K.setBlockers(set.group, C.skye, C.max, ...). No arguments disables it.
export function setBlockers(...objs) { BLOCKERS = objs.flat().map((o) => (o?.root ? o.root : o)).filter(Boolean); if (!BLOCKERS.length) BLOCKERS = null; }

export function applyShot(stage, shot, { roll = 0 } = {}) {
  const c = stage.camera;
  c.position.copy(shot.pos); c.fov = shot.fov; c.up.copy(UP); c.updateProjectionMatrix(); c.lookAt(shot.target);
  if (roll) c.rotateZ(roll);
  stage.skyMesh.position.copy(c.position);
  stage.aimSun(shot.target.clone(), shot.shadow || 22);
  return shot;
}
export function setCam(stage, cam, opts = {}) {
  const shot = { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov || 40 };
  if (opts.clear !== false) shot.pos = clearShot(shot.target, shot.pos, opts.blockers ?? BLOCKERS);
  return applyShot(stage, shot, opts);
}
// Blend two shots (a slow push or a pan): u 0..1.
export function blendShot(a, b, u) { return { pos: a.pos.clone().lerp(b.pos, u), target: a.target.clone().lerp(b.target, u), fov: a.fov + (b.fov - a.fov) * u }; }

const distFor = (span, fov) => span / 2 / Math.tan(THREE.MathUtils.degToRad(fov) / 2);

// Shot of one actor. opts: angle (radians off their facing, default 0.35; the sign is flipped when needed to stay on the
// line's side), height (camera above eye level, default 0.15 x span), fov (default 35), dist (override), look (Vector3
// offset of the aim point), apply (default true), blockers.
export function camOn(stage, actor, framing = 'mcu', opts = {}) {
  const f = FRAMINGS[framing]; if (!f) throw new Error(`kit: framing "${framing}" (cu, mcu, ms, ws)`);
  const S = actor.scale || 1, fov = opts.fov ?? 35, span = f.span * S * (opts.zoom ?? 1);
  const eye = headPos(actor), d = opts.dist ?? distFor(span, fov);
  const target = eye.clone().add(V(0, -f.eyeUp * span, 0)); if (opts.look) target.add(opts.look);
  const h = heading(actor);
  const place = (ang) => target.clone().addScaledVector(fwd(h + ang), d).add(V(0, opts.height ?? 0.12 * span, 0));
  let ang = opts.angle ?? 0.35, pos = place(ang);
  if (LINE && !onSide(pos)) { ang = -ang; pos = place(ang); }
  const shot = { pos: clearShot(target, pos, opts.blockers ?? BLOCKERS, 0.35, [actor.root]), target, fov };
  return opts.apply === false ? shot : applyShot(stage, shot, opts);
}

// Two actors in one frame, camera square to the line between them (on the line's side). opts: framing ('ms' default:
// how tall the frame is around the taller head), bias (0..1: aim towards b), angle (radians to swing off square), fov.
export function twoShot(stage, a, b, opts = {}) {
  const fov = opts.fov ?? 35, f = FRAMINGS[opts.framing || 'ms'];
  const A = headPos(a), B = headPos(b), mid = A.clone().lerp(B, opts.bias ?? 0.5);
  const ab = B.clone().sub(A); ab.y = 0; const wdt = ab.length();
  let n = V(-ab.z, 0, ab.x).normalize();                         // perpendicular
  if (LINE ? sideOf(mid.clone().add(n)) !== LINE.side : n.dot(fwd(heading(a)).add(fwd(heading(b)))) < 0) n.negate();
  if (opts.angle) n.applyAxisAngle(UP, opts.angle);
  const span = Math.max(f.span * Math.max(a.scale || 1, b.scale || 1), (wdt + 3) * 9 / 16 * 1.0);
  const target = mid.clone().add(V(0, -f.eyeUp * span, 0)); if (opts.look) target.add(opts.look);
  const pos = target.clone().addScaledVector(n, opts.dist ?? distFor(span, fov)).add(V(0, opts.height ?? 0.1 * span, 0));
  const shot = { pos: clearShot(target, pos, opts.blockers ?? BLOCKERS, 0.35, [a.root, b.root]), target, fov };
  return opts.apply === false ? shot : applyShot(stage, shot, opts);
}

// Over `from`'s shoulder onto `to` (who is speaking / reacting). Keeps to the line's side. framing is for `to`.
export function overShoulder(stage, from, to, framing = 'mcu', opts = {}) {
  const fov = opts.fov ?? 35, f = FRAMINGS[framing], S = to.scale || 1, span = f.span * S;
  const F = headPos(from), T = headPos(to);
  const dir = F.clone().sub(T); dir.y = 0; const gap = dir.length(); dir.normalize();
  let side = V(-dir.z, 0, dir.x);
  if (LINE ? sideOf(F.clone().add(side)) !== LINE.side : false) side.negate();
  const target = T.clone().add(V(0, -f.eyeUp * span, 0)); if (opts.look) target.add(opts.look);
  const back = Math.max(distFor(span, fov) - gap, 3.4);           // far enough behind `from` for the framing
  const pos = F.clone().addScaledVector(dir, back).addScaledVector(side, (opts.shoulder ?? 1.9) * (from.scale || 1)).add(V(0, opts.height ?? 0.1, 0));
  const shot = { pos: clearShot(target, pos, opts.blockers ?? BLOCKERS, 0.35, [from.root, to.root]), target, fov };
  return opts.apply === false ? shot : applyShot(stage, shot, opts);
}

// Small handheld drift for tense shots (deterministic): adds to a shot before applyShot. amp in studs.
export function drift(shot, t, amp = 0.05) {
  const o = V(Math.sin(t * 1.3) + 0.5 * Math.sin(t * 3.1), 0.6 * Math.sin(t * 1.7 + 1), Math.sin(t * 0.9 + 2)).multiplyScalar(amp);
  return { ...shot, pos: shot.pos.clone().add(o) };
}

// Where a world point lands on the 1920x1080 frame (for overlays such as redCircle): { x, y, visible }.
export function screenOf(stage, p) {
  const c = stage.camera; c.updateMatrixWorld(true);
  const v = p.clone().project(c);
  return { x: (v.x + 1) / 2 * 1920, y: (1 - v.y) / 2 * 1080, visible: v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
}

// Heading that makes something at `from` (Vector3 or mark) face `to` (Vector3, mark or actor).
export function faceTo(from, to) {
  const a = from.pos || from, b = to.root ? to.root.position : to.pos || to;
  return Math.atan2(b.x - a.x, b.z - a.z);
}
