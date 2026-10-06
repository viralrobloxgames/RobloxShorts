// Stage for the long-form video: 1920x1080 at 30 fps, the six sets built once, one set shown at a time.
// A chapter: `export const meta = K.chapterMeta(seconds); export const sky = K.SKY;` then in setup()
// `await K.buildSets(stage, ['bedroom', 'classroom'])` and in update() `K.showSet('bedroom')`.
import * as THREE from 'three';
import * as SETS from './sets/index.js';
import { loadAnimation, robloxPose } from '../../../../web/lib/robloxPack.js';
import { travel } from '../../../../web/lib/locomotion.js';

export const META = { width: 1920, height: 1080, fps: 30 };
export const FPS = META.fps;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const SET_IDS = ['bedroom', 'hallway', 'attic', 'kitchen', 'classroom', 'exterior'];
export const SET_ORIGIN = { bedroom: V(0, 0, 0), hallway: V(300, 0, 0), attic: V(600, 0, 0), kitchen: V(900, 0, 0), classroom: V(1200, 0, 0), exterior: V(1500, 0, 0) };

// The sky the stage is created with (night). applyLight() recolours it per preset, so this only matters before the first
// applyLight() call; every chapter exports it unchanged: `export const sky = K.SKY;`.
export const SKY = { zenith: '#0b1533', horizon: '#2a3a66', below: '#0b1020', fog: '#141c33', sunColor: '#c9d8ff', sunDir: V(-0.35, 0.75, 0.55) };

// meta for a chapter of `seconds` (rounded up to whole frames). Frames are 1-based in render.mjs: frame f is at t = (f-1)/30.
export function chapterMeta(seconds, extra = {}) { return { ...META, seconds: Math.ceil(seconds * FPS) / FPS, ...extra }; }
export const frameAt = (t) => Math.round(t * FPS) + 1;
export const timeOf = (frame) => (frame - 1) / FPS;

// ---------- sets ----------
const K = { stage: null, sets: {}, current: null };
// Build the sets this chapter uses (all six when ids is omitted). Returns { id: set }. A set module that fails to load or
// build is reported and replaced by an empty box room so a chapter can be blocked out before its set lands.
export async function buildSets(stage, ids = SET_IDS, state = null) {
  K.stage = stage;
  for (const id of ids) {
    if (K.sets[id]) continue;
    let set;
    try { if (!SETS[id]) throw new Error('module missing'); set = await SETS[id].build(stage.scene); }
    catch (e) { console.warn(`kit: set "${id}" not available (${e.message}); using a box room`); set = boxRoom(id); stage.scene.add(set.group); }
    set.id ||= id; set.marks ||= {}; set.cams ||= {}; set.lights ||= {}; set.setState ||= () => {};
    if (!set.group.parent) stage.scene.add(set.group);
    set.group.visible = false;
    if (state) set.setState(state);
    K.sets[id] = set;
  }
  return K.sets;
}
export const getSet = (id) => K.sets[id];
export const currentSet = () => K.sets[K.current];
// Show one set group, hide the others. Call it in update() on every frame (cheap) from the shot table.
export function showSet(id) {
  if (!K.sets[id]) throw new Error(`kit: set "${id}" was not built (buildSets(stage, [... '${id}' ...]))`);
  for (const [k, s] of Object.entries(K.sets)) s.group.visible = k === id;
  K.current = id;
  return K.sets[id];
}
// setState on every built set (persistent things: fridge letters, attic boxes, garlic, ...). See KIT_SPEC.md.
export function setState(state) { for (const s of Object.values(K.sets)) s.setState(state); }

// A mark as a world position + heading: K.mark('bedroom', 'bed_sit') -> { pos: Vector3, heading }.
// fallback ({ pos: offset from the set origin, heading }) is used, with a warning, while a set doesn't have the mark yet.
const warned = new Set();
export function mark(setId, name, fallback = null) {
  const s = K.sets[setId]; let m = s?.marks[name];
  if (!m && fallback) {
    if (!warned.has(setId + name)) { warned.add(setId + name); console.warn(`kit: set "${setId}" has no mark "${name}" yet; using the fallback`); }
    m = { pos: (SET_ORIGIN[setId] || V()).clone().add(fallback.pos), heading: fallback.heading ?? 0 };
  }
  if (!m) throw new Error(`kit: no mark "${name}" in set "${setId}" (has: ${Object.keys(s?.marks || {}).join(', ')})`);
  return { pos: m.pos.clone(), heading: m.heading ?? 0 };
}

// Placeholder room (24 x 12 x 24 studs, open towards -z... the camera side) used until a set module exists.
export function boxRoom(id) {
  const o = SET_ORIGIN[id] || V(), group = new THREE.Group(); group.name = id + '_box'; group.position.copy(o);
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const box = (w, h, d, c, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c)); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; group.add(b); return b; };
  box(24, 0.4, 24, '#8a6a4a', 0, -0.2, 0); box(24, 12, 0.4, '#c9c2b4', 0, 6, 12); box(0.4, 12, 24, '#bdb6a8', -12, 6, 0); box(0.4, 12, 24, '#bdb6a8', 12, 6, 0);
  const W = (x, y, z) => V(x, y, z).add(o);
  const lamp = new THREE.PointLight('#ffcf8a', 0, 30, 1.6); lamp.position.copy(W(6, 4, 8)); group.add(lamp); lamp.position.sub(o);
  return {
    id, group, lights: { bedside_lamp: lamp },
    marks: { a: { pos: W(-3, 0, 4), heading: 0.5 }, b: { pos: W(3, 0, 6), heading: -2.6 }, c: { pos: W(0, 0, 0), heading: Math.PI } },
    cams: { wide: { pos: W(0, 6, -16), target: W(0, 3, 4), fov: 45 } },
    setState() {},
  };
}

// ---------- the chapter's timeline ----------
// Lines and words from audio/chapters/chNN/lines.json + captions.json (narrate_multi.py) when they exist, else the
// chapter's estimate. Returns { lines, words, end, measured, line(i), said(speaker) }:
//   lines: [{ index, speaker, note, text, start, end }] (spoken lines, in order; `index` as in lines.json)
//   words: [{ word, start, end, speaker }]   end: the last line's end (s)   measured: true when it came from narration
// Use in the clip module (web/chNN.js) at top level:  const L = await K.loadLines(import.meta.url, 1, EST);
export async function loadLines(clipUrl, ch, estimate = []) {
  const dir = new URL(`../audio/chapters/ch${String(ch).padStart(2, '0')}/`, clipUrl);
  const get = async (f) => { try { const r = await fetch(new URL(f, dir)); return r.ok ? await r.json() : null; } catch { return null; } };
  const [lj, cj] = await Promise.all([get('lines.json'), get('captions.json')]);
  let lines, words, measured = !!lj;
  if (lj) {
    const arr = Array.isArray(lj) ? lj : lj.lines || [];
    lines = arr.filter((x) => x.speaker && x.text && x.kind !== 'action' && x.type !== 'action').map((x, i) => ({ ...x, index: x.index ?? i }));
    const wa = cj ? (Array.isArray(cj) ? cj : cj.words || cj.captions || []) : [];
    words = wa.map((w) => ({ word: w.word ?? w.text, start: w.start, end: w.end, speaker: w.speaker }));
  } else {
    lines = estimate.map((x, i) => ({ index: x.index ?? i, ...x }));
    words = [];
    for (const l of lines) {                         // spread the line's words evenly over it (estimate only)
      const ws = l.text.split(/\s+/), d = (l.end - l.start) / ws.length;
      ws.forEach((w, k) => words.push({ word: w, start: l.start + k * d, end: l.start + (k + 0.85) * d, speaker: l.speaker }));
    }
  }
  const end = Math.max(0, ...lines.map((l) => l.end), lj?.duration ?? 0);
  const byIndex = new Map(lines.map((l) => [l.index, l]));
  return {
    lines, words, end, measured, actions: lj ? (Array.isArray(lj) ? [] : lj.actions || []) : [],
    line(i) { const l = byIndex.get(i); if (!l) throw new Error(`kit: no spoken line ${i} in ch${ch}`); return l; },
    said(speaker) { return words.filter((w) => w.speaker === speaker); },
    speakerAt(t) { const l = lines.find((x) => t >= x.start && t < x.end); return l ? l.speaker : null; },
  };
}

// Idle clock for the frame-skip speed-up: advances only while someone is speaking (when faces change anyway) and in
// the extra ranges you pass (actions); stands still in the silent gaps, so held frames are identical and render.mjs
// copies them instead of rendering. Feed it to idle animations: K.playAnim(a, [[A.idle, K.holdClock(t, L)]]).
export function holdClock(t, L, extra = []) {
  let c = 0;
  for (const [a, b] of [...L.lines.map((l) => [l.start, l.end]), ...extra]) c += Math.max(0, Math.min(t, b) - a);
  return c;
}

// ---------- actors ----------
// Load pack animations once in setup(): const A = await K.loadAnims(['idle', 'walk', 'talk']).
export async function loadAnims(names) { const A = {}; for (const n of names) A[n] = await loadAnimation(n); return A; }
// Pose an actor from animation layers [[anim, time, weight?, loop?], ...] (pack animations).
export function playAnim(actor, layers) { robloxPose(actor, layers); return actor; }
// Put an actor on a mark ({ pos, heading } from K.mark) or at pos/heading; feet on pos.y unless opts.sit.
export function putOn(actor, at, opts = {}) {
  actor.root.visible = opts.visible ?? true;
  actor.root.position.copy(at.pos); actor.root.rotation.set(0, opts.heading ?? at.heading ?? 0, 0);
  actor.root.updateMatrixWorld(true);
  if (!opts.sit && actor.soleHeight) { actor.root.position.y -= actor.soleHeight() - at.pos.y; actor.root.updateMatrixWorld(true); }
  return actor;
}
// Walk/run an actor between two marks from t0 (walk 12, run 16 studs/s; legs driven by the distance travelled).
// Returns the travel state; poses and places the actor. A: the loaded anims (needs walk / run / idle).
export function walk(actor, A, from, to, t0, t, { speed = 12, idleAt = 0, endHeading } = {}) {
  const m = travel(from.pos, to.pos, t0, t, speed);
  playAnim(actor, m.moving ? [[speed >= 14 ? A.run : A.walk, m.anim]] : [[A.idle, idleAt]]);
  const h = m.moving ? m.heading : m.done ? (endHeading ?? to.heading ?? m.heading) : (from.heading ?? m.heading);
  putOn(actor, { pos: m.pos, heading: h });
  return m;
}
// Hide everyone in the cast except the named ones: K.only(C, ['max', 'skye']).
export function only(C, names) {
  for (const [k, a] of Object.entries(C)) for (const x of [].concat(a)) if (x?.root) x.root.visible = names.includes(k);
}
