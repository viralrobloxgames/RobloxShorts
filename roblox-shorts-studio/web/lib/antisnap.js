// Anti-snap filter: eases one-frame pose snaps inside a shot. A pack actor's bone (Torso, Head, arms, legs, Root) or
// facing (root rotation) that turns suddenly from one frame to the next (more than `hardDeg`, or more than `boneDeg` /
// `rootDeg` when the frame before turned less than half as much: a snap, not a fast continuous move like a run cycle) is
// crossfaded from the pose shown on the frame before to the clip's pose over 6-12 frames (more for bigger turns, so no
// frame turns much more than ~22 degrees), with smoothstep timing. Never across a camera cut (camera moves
// > cutStuds or turns > cutDeg in one frame) or set change, never for an actor that was hidden on the frame before or
// moved more than `teleport` studs (re-placed), and root *positions* are never touched (marks, seats and contacts stay
// exactly where the clip puts them). Held props follow the hands; nothing else is changed.
//
// The clip never sees the filtered pose: before each clip.update the bones get the clip's own values back, so a clip
// poses exactly as it would without the filter, and every frame away from a snap is identical to an unfiltered render.
// The filter depends on the frames before (where a crossfade started), so frames are stepped in order from frame 1:
// update(t) for a frame further on first steps through the frames in between, and going back re-runs from frame 1.
// runner.html wraps clip.update with it when the clip (or its kit) turns it on: window.__antiSnap = { on: true, ... }.
// Opt-outs: window.__antiSnap.on = false (whole clip), window.__antiSnap.windows = [[t0, t1], ...] (no new crossfades
// start inside these times, for a meant instant change such as a jump scare).
import * as THREE from 'three';
import { packActors } from './robloxPack.js';

const BONES = ['Root', 'Torso', 'Head', 'Arm.L', 'Arm.R', 'Leg.L', 'Leg.R'];
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const DEG = 180 / Math.PI;

export function createAntiSnap(clip, stage, meta, opts = {}) {
  const o = { boneDeg: 25, rootDeg: 25, hardDeg: 50, sudden: 0.5, minFrames: 6, maxFrames: 12, degPerFrame: 15, cutStuds: 0.5, cutDeg: 10, teleport: 3, ...opts };
  const fps = meta.fps || 30;
  let cur = 0;                      // last frame stepped (detection done)
  let prevRaw = null, prevShown = null, prevCam = null;
  const lastDelta = new Map();      // actor -> { part: degrees it turned on the frame before (raw) }
  const blends = new Map();         // actor -> { bones: { k: { F: {p, q}, s, n } }, root: { F: q, s, n } | null }
  let saved = null;                 // raw values replaced by apply(), put back by restore()
  const events = [];                // [{ frame, actor, part, deg, n }] for tools and reports

  const inScene = (a) => { let x = a.root; while (x) { if (!x.visible) return false; if (x === stage.scene) return true; x = x.parent; } return false; };
  const frameOf = (t) => Math.round(t * fps) + 1;
  const windows = () => (globalThis.__antiSnap && globalThis.__antiSnap.windows) || [];
  const blocked = (f) => windows().some(([a, b]) => (f - 1) / fps >= a - 1e-6 && (f - 1) / fps <= b + 1e-6);

  function capture() {
    stage.camera.updateMatrixWorld(true);
    const cam = { pos: stage.camera.getWorldPosition(new THREE.Vector3()), dir: stage.camera.getWorldDirection(new THREE.Vector3()) };
    const actors = new Map();
    for (const a of packActors) {
      if (!a.bones || !a.root) continue;
      const vis = inScene(a), bones = {};
      for (const k of BONES) if (a.bones[k]) bones[k] = { p: a.bones[k].position.clone(), q: a.bones[k].quaternion.clone() };
      actors.set(a, { vis, pos: a.root.position.clone(), q: a.root.quaternion.clone(), bones });
    }
    return { cam, actors };
  }

  function restore() {
    if (!saved) return;
    for (const [a, s] of saved) {
      for (const [k, v] of Object.entries(s.bones)) { a.bones[k].position.copy(v.p); a.bones[k].quaternion.copy(v.q); }
      if (s.q) a.root.quaternion.copy(s.q);
      a.root.updateMatrixWorld(true);
    }
    saved = null;
  }

  // Start crossfades at frame f from what the clip just posed (raw) against the frame before.
  function detect(f, raw) {
    const cut = !prevCam || raw.cam.pos.distanceTo(prevCam.pos) > o.cutStuds || raw.cam.dir.angleTo(prevCam.dir) * DEG > o.cutDeg;
    for (const [a, r] of raw.actors) {
      const pr = prevRaw && prevRaw.get(a), ps = prevShown && prevShown.get(a);
      if (!r.vis || cut || !pr || !pr.vis || !ps || r.pos.distanceTo(pr.pos) > o.teleport) { blends.delete(a); lastDelta.delete(a); continue; }
      const ld = lastDelta.get(a) || {}, nd = {}; lastDelta.set(a, nd);
      const snap = (part, deg, min) => { nd[part] = deg; return deg > o.hardDeg || (deg > min && (ld[part] ?? 0) < o.sudden * deg); };
      if (blocked(f)) { for (const [k, v] of Object.entries(r.bones)) if (pr.bones[k]) nd[k] = v.q.angleTo(pr.bones[k].q) * DEG; continue; }
      let b = blends.get(a);
      for (const [k, v] of Object.entries(r.bones)) {
        const pv = pr.bones[k]; if (!pv) continue;
        const deg = v.q.angleTo(pv.q) * DEG;
        if (snap(k, deg, o.boneDeg)) {
          if (!b) { b = { bones: {}, root: null }; blends.set(a, b); }
          const n = Math.min(o.maxFrames, Math.max(o.minFrames, Math.round(deg / o.degPerFrame)));
          b.bones[k] = { F: { p: ps.bones[k].p.clone(), q: ps.bones[k].q.clone() }, s: f, n };
          events.push({ frame: f, actor: a.key || a.name, part: k, deg: Math.round(deg), n });
        }
      }
      const rdeg = r.q.angleTo(pr.q) * DEG;
      if (snap('facing', rdeg, o.rootDeg)) {
        if (!b) { b = { bones: {}, root: null }; blends.set(a, b); }
        const n = Math.min(o.maxFrames, Math.max(o.minFrames, Math.round(rdeg / o.degPerFrame)));
        b.root = { F: ps.q.clone(), s: f, n };
        events.push({ frame: f, actor: a.key || a.name, part: 'facing', deg: Math.round(rdeg), n });
      }
    }
    prevRaw = raw.actors; prevCam = raw.cam;
  }

  // Show frame f: each running crossfade blends from its frozen pose F to the clip's current pose.
  function apply(f) {
    saved = new Map();
    for (const [a, b] of blends) {
      const s = { bones: {}, q: null };
      for (const [k, x] of Object.entries(b.bones)) {
        const u = smooth((f - x.s + 1) / x.n);
        if (u >= 1 || f < x.s) { delete b.bones[k]; continue; }
        const bone = a.bones[k]; s.bones[k] = { p: bone.position.clone(), q: bone.quaternion.clone() };
        bone.position.lerpVectors(x.F.p, s.bones[k].p, u); bone.quaternion.slerpQuaternions(x.F.q, s.bones[k].q, u);
      }
      if (b.root) {
        const x = b.root, u = smooth((f - x.s + 1) / x.n);
        if (u >= 1 || f < x.s) b.root = null;
        else { s.q = a.root.quaternion.clone(); a.root.quaternion.slerpQuaternions(x.F, s.q, u); }
      }
      if (Object.keys(s.bones).length || s.q) { saved.set(a, s); a.root.updateMatrixWorld(true); }
      if (!Object.keys(b.bones).length && !b.root) blends.delete(a);
    }
  }

  function shownNow() {
    const m = new Map();
    for (const a of packActors) {
      if (!a.bones || !a.root) continue;
      const bones = {};
      for (const k of BONES) if (a.bones[k]) bones[k] = { p: a.bones[k].position.clone(), q: a.bones[k].quaternion.clone() };
      m.set(a, { q: a.root.quaternion.clone(), bones });
    }
    return m;
  }

  // One frame in order: pose it with the clip, start crossfades, show it, remember what was shown.
  function step(f, keep) {
    restore();
    clip.update((f - 1) / fps, stage);
    const raw = capture();
    detect(f, raw); apply(f);
    prevShown = shownNow(); cur = f;
    if (!keep) restore();
  }

  function reset() { restore(); cur = 0; prevRaw = prevShown = prevCam = null; blends.clear(); lastDelta.clear(); events.length = 0; }

  // Drop-in for clip.update(t, stage).
  function update(t, st = stage) {
    const on = !globalThis.__antiSnap || globalThis.__antiSnap.on !== false;
    if (!on) { restore(); return clip.update(t, st); }
    const f = frameOf(t);
    if (f < cur) reset();
    while (cur < f - 1) step(cur + 1, false);
    if (cur === f - 1 && Math.abs((f - 1) / fps - t) < 1e-9) { step(f, true); return; }
    if (cur === f - 1) step(f, false);          // the frame's own time first, so a sub-sample can't change where fades start
    restore();
    clip.update(t, st);
    apply(f);
  }

  return { update, reset, events, frame: () => cur, options: o };
}
