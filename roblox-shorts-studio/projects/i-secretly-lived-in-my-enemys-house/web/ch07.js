// Ch7 "The Pumpkin Girl" (FRIDAY 4:05 PM). The attic in the afternoon: Dad comes up with the vacuum, Skye poses as a
// Halloween decoration (pumpkin bucket on her head, scarecrow arms out at shoulder height), Max sends Dad away and
// straightens her pumpkin. Shot plan: production/shots/ch07.md. Built from web/ch_template.js; everything is a pure
// function of t. Set: K.sets.attic (local layout in its header: tea box at (-3.5, 2), decorations at z -3.5, hatch at
// (4.5, 9)). Cameras stay on the tea-box (-x) side of the Skye-Dad line, so Dad is screen right of Skye.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 7;
const CARD = { day: 'FRIDAY', time: '4:05 PM' };
const EST = [
  { index: 1, speaker: 'VO', text: 'Friday. Day five. Dad kept his promise. And this time, he brought backup.', start: 0.0, end: 4.6 },
  { index: 2, speaker: 'SKYE', note: 'whisper', text: "Where do I hide? There's nowhere to hide!", start: 4.85, end: 7.3 },
  { index: 3, speaker: 'LILY', text: 'Quick! Be a decoration!', start: 7.55, end: 9.1 },
  { index: 4, speaker: 'SKYE', text: 'A what?', start: 9.35, end: 10.0 },
  { index: 5, speaker: 'LILY', text: "Stand still. Don't breathe. Think pumpkin thoughts.", start: 10.85, end: 13.8 },
  { index: 6, speaker: 'DAD', text: "Right, ghost. It's you, me, and the vacuum.", start: 14.65, end: 17.9 },
  { index: 7, speaker: 'DAD', text: 'Lily? What are you doing up here?', start: 18.15, end: 20.5 },
  { index: 8, speaker: 'LILY', text: 'Tea party. With the decorations.', start: 20.75, end: 22.6 },
  { index: 9, speaker: 'DAD', text: "You put the Halloween stuff out already? It's not even Halloween.", start: 22.85, end: 26.6 },
  { index: 10, speaker: 'LILY', text: 'I like to plan ahead.', start: 26.85, end: 28.4 },
  { index: 11, speaker: 'DAD', text: "That's my girl. Let's see. Skeleton. Witch. Giant pumpkin girl.", start: 28.65, end: 32.9 },
  { index: 12, speaker: 'DAD', text: "Hmm. I don't remember buying a pumpkin girl.", start: 33.15, end: 35.9 },
  { index: 13, speaker: 'DAD', text: 'Very realistic. Bit dusty. Smells like cinnamon.', start: 36.95, end: 39.8 },
  { index: 14, speaker: 'DAD', text: 'Lily, why do the decorations smell like cinnamon?', start: 40.05, end: 42.8 },
  { index: 15, speaker: 'LILY', text: "They're festive.", start: 43.05, end: 44.1 },
  { index: 16, speaker: 'DAD', text: "Well, she's filthy. Hold still, pumpkin girl. Time for a good hoover.", start: 44.35, end: 48.6 },
  { index: 17, speaker: 'MAX', note: 'offscreen', text: "Dad! I'll clean the attic. Your football's starting!", start: 49.45, end: 52.4 },
  { index: 18, speaker: 'DAD', text: "Already? You're a good lad, Max.", start: 52.65, end: 54.8 },
  { index: 19, speaker: 'MAX', text: 'Nice decoration. Very realistic.', start: 56.25, end: 58.1 },
  { index: 20, speaker: 'MAX', text: 'Lily. Dinner. Five minutes.', start: 58.35, end: 60.2 },
  { index: 21, speaker: 'SKYE', text: 'I almost got hoovered.', start: 61.25, end: 62.6 },
  { index: 22, speaker: 'LILY', text: 'He fixed your pumpkin.', start: 62.85, end: 64.3 },
  { index: 23, speaker: 'SKYE', text: "He didn't notice. Boys never notice anything.", start: 64.55, end: 67.0 },
  { index: 24, speaker: 'LILY', text: 'Sure.', start: 67.25, end: 67.9 },
];
const L = await K.loadLines(import.meta.url, CH, EST);   // spoken lines count from 1, as in lines.json
export const meta = K.chapterMeta(L.lines[L.lines.length - 1].end + 0.75);   // last line + 0.75 s room tone
export const sky = K.SKY;
export const samples = () => 1;
const at = (line, off = 0) => L.line(line).start + off;
const end = (line, off = 0) => L.line(line).end + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const { clamp, lerp } = THREE.MathUtils;
const inv = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
const smooth = (u) => u * u * (3 - 2 * u);
const sm = (a, b, t) => smooth(inv(a, b, t));
const ATT = V(600, 0, 0);
const W = (x, z, y = 0) => V(x, y, z).add(ATT);                          // attic local -> world
const pt = (x, z, h = 0) => ({ pos: W(x, z), heading: h });              // a spot as a mark
const towards = (a, b) => Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z);
// a word's start time in a line (first word matching re), else the line start + fallback offset
function wordT(line, re, fallback = 0) {
  const l = L.line(line), w = L.words.find((x) => x.start >= l.start - 0.05 && x.start < l.end && re.test(x.word));
  return w ? w.start : l.start + fallback;
}

// ---------- geometry ----------
// Skye freezes at the decor gap (the set's decor_pose), cheated toward the cameras on the -x side. Everyone who deals
// with her stands IN FRONT of her (never beside her: her scarecrow arms are out); the skeleton and witch are kept clear
// of her arms (critic-4 C7-1). Offsets: off(m, forward, left) in the mark's frame.
const SKYE_CHEAT = -0.9;
const off = (m, f, l, heading = m.heading) => ({ pos: m.pos.clone().add(V(Math.sin(m.heading) * f + Math.cos(m.heading) * l, 0, Math.cos(m.heading) * f - Math.sin(m.heading) * l)), heading });
const M = {
  teaSkye: () => pt(-6.4, 4.0, 0.45), teaLily: () => pt(-1.5, 3.9, -0.5),   // either side of the tea box's front, faces to the opening camera
  pose: () => { const m = K.mark('attic', 'decor_pose'); m.heading += SKYE_CHEAT; return m; },
  hatchTop: () => K.mark('attic', 'hatch_top'), climb: () => K.mark('attic', 'hatch_climb'),
  vac: () => K.mark('attic', 'vacuum'),
};
// facing her, but turned `cheat` (0..1) of the way toward the pair camera (a stage cheat so both faces read 3/4)
const faceHer = (m, cheat = 0) => {
  const h0 = towards(m, M.pose()), c = pairCamPos(m.pos), hc = Math.atan2(c.x - m.pos.x, c.z - m.pos.z);
  const d = Math.atan2(Math.sin(hc - h0), Math.cos(hc - h0));
  return { pos: m.pos, heading: h0 + d * cheat };
};
// the pair camera sits at her front-left (50 deg off her facing), so she reads 3/4 and her partner (at her front-right) too
const PAIR_ANG = -0.87;   // toward her left (the open side of the room; the skeleton is on her right)
function pairCamPos(near, dist = 6.0) {
  const p = M.pose(), h = p.heading - PAIR_ANG;           // rotate her facing toward her right
  const mid = p.pos.clone().lerp(near, 0.5);
  return mid.add(V(Math.sin(h) * dist, 0, Math.cos(h) * dist));
}
const S = {                                                         // spots around her
  inspect: () => faceHer(off(M.pose(), 3.05, -1.6), 0.45),          // Dad at her front-right, nose to nose
  hoover: () => faceHer(off(M.pose(), 4.0, 0.6), 0.3),             // backed off: the wand's nozzle stops short of her face
  maxFront: () => faceHer(off(M.pose(), 2.6, 0.15), 0.25),          // Max fixing the bucket
  maxBack: () => faceHer(off(M.pose(), 2.7, 0.5), 0.45),
  lilyJam: () => faceHer(off(M.pose(), 1.2, 2.0)),                  // at her left-front, close enough to reach her head
  lilyWait: () => faceHer(off(M.pose(), 0.9, 3.4)),                 // waiting, clear of her path and her arms                  // Lily hops and jams the bucket on
  lilyOrders: () => ({ pos: off(M.pose(), 2.6, 1.5).pos, heading: -0.9 }),   // stepped back, giving orders to the camera
  lilyEnd: () => ({ pos: off(M.pose(), 1.6, 1.7).pos, heading: -0.6 }),     // beside her (her open side), a step in front of her lowered left arm
};
const GRAB = () => pt(6.4, -4.45, Math.PI);                          // in front of the HALLOWEEN box, facing it (before Skye gets there)
const DAD_OUT = () => pt(3.9, 5.0, -2.2);
const DOWN = () => { const m = M.climb(); m.pos.z -= 0.6; return { pos: m.pos, heading: 0 }; };   // going down: facing the ladder, a step nearer the room edge of the hole                           // on the boards beside the hatch (not over the hole)
const DAD_NEAR = () => pt(3.4, 1.4, 2.6);                           // stops short of the decorations
const VAC_SPOT = () => pt(7.6, 8.4, -2.4);                          // where the vacuum stays (beside the hatch)

// ---------- key times (on the narration) ----------
const T = {};
function times() {
  T.rattle = 0.35;                       // first rattle of the hatch lid
  T.lidLift = at(1, 3.6);
  T.skyeUp = at(2, 0.15);
  T.lilyUp = at(3, 0.0);
  T.goDecor = at(4, 0.45);
  T.lilyGo = end(3, 0.1);               // Lily runs for the bucket first
  T.grab = T.lilyGo + 0.85;
  T.jam = end(4, 1.15);
  T.pose = T.jam + 0.6;                 // her arms go out once Lily has stepped back
  T.lilyStep = T.jam + 0.25;             // steps back to give her orders
  T.lilyBack = end(5, 0.0);              // runs back to the tea box
  T.dadRise = end(5, 0.05);
  T.dadOut = at(6, 0.7);
  T.dadStep = T.dadOut + 0.15;           // steps off the hatch onto the boards
  T.vacDown = end(7, -0.4);              // sets the canister down, keeps the wand
  T.dadWalk1 = at(9, 0.3);
  T.skel = wordT(11, /Skeleton/i, 2.4);
  T.witch = T.skel + 0.6;
  T.dadWalk2 = T.skel - 0.2;
  T.girl = wordT(11, /Giant/i, 4.0);
  T.lean = end(12, 0.1);
  T.unlean = at(14, 0.4);
  T.stepBack = at(16, 0.2);
  T.nozzle = wordT(16, /Hold/i, 1.5);
  T.hum = end(16, 0.15);
  T.humOff = at(17, 0.05);
  T.dadGo = at(18, 0.5);                 // carries the vacuum to the hatch
  T.dadDown = T.dadGo + 1.4;             // climbs down facing the ladder
  T.maxUp = T.dadDown + 0.85;
  T.maxOut = at(19, 0.6);                // after a ~1 s look from the hatch
  T.fix = wordT(19, /Very/i, 1.6) + 0.15;
  T.maxBack = T.fix + 0.75;
  T.maxGo = end(20, 0.05);
  T.maxDown = T.maxGo + 1.35;
  T.lilyCome = at(21, -0.2);
  T.armsDown = at(23, 0.3);
}
times();

// ---------- setup ----------
let C, A, set, P = {};
export async function setup(stage) {
  await K.buildSets(stage, ['attic']);
  K.setState({ chapter: 7 });
  set = K.getSet('attic');
  // C7-1: keep the skeleton and the witch clear of her arms (no-op once the set itself is wider)
  const it = set.items, px = K.mark('attic', 'decor_pose').pos.x - 600;
  if (it.skeleton && px - it.skeleton.position.x < 3.9) it.skeleton.position.x = px - 3.9;
  if (it.witch && it.witch.position.x - px < 3.2) { it.witch.position.x = px + 3.2; it.witch.position.z = Math.min(it.witch.position.z, -4.2); }
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_school'); K.dress(C.dad, 'dad_cardigan'); K.dress(C.lily, 'lily_day');
  A = await K.loadAnims(['idle', 'walk', 'run']);
  P.scene = stage.scene;
  P.bucket = K.makeProp('pumpkin_bucket'); stage.scene.add(P.bucket);
  P.worn = K.makeProp('pumpkin_bucket', { worn: true }); stage.scene.add(P.worn);
  P.vac = K.makeProp('vacuum'); stage.scene.add(P.vac);
  P.cup = K.makeProp('cup'); stage.scene.add(P.cup);
}

// ---------- posing helpers (chapter blocking; looks come from the kit) ----------
function headTurn(actor, yaw, pitch = 0) { actor.bones.Head.rotation.set(pitch, yaw, 0); }
const headTo = (actor, target, max = 1.0) => {           // turn the head toward a world point (relative to the body)
  const a = actor.root.position, d = Math.atan2(target.x - a.x, target.z - a.z) - actor.root.rotation.y;
  return clamp(Math.atan2(Math.sin(d), Math.cos(d)), -max, max);
};
function sitFloor(actor, m, heading, pose = 'sit_cross') {
  K.putOn(actor, { pos: m.pos, heading: heading ?? m.heading }, { sit: true });
  const d = K.posture(actor, pose); actor.root.position.y = m.pos.y - d;
}
// on the attic ladder: k 0 = below the floor, 1 = standing on it. Legs from the kit climb gait; one hand on a rail,
// the other on the next rail (alternating, in front of the chest, never above the head) or holding something (busyL).
function climbAt(actor, m, heading, k, { busyL = false, reach = 78 } = {}) {
  K.putOn(actor, { pos: m.pos, heading }, { sit: true });
  const ph = (k * 4 * actor.scale) / 1.6, c = Math.sin(ph * Math.PI * 2);
  const g = K.gait('climb', ph);
  g['Arm.R'] = [-reach - 18 * c, 0, 8];
  g['Arm.L'] = busyL ? [-8, 0, -6] : [-reach + 18 * c, 0, -8];
  K.posture(actor, g);
  actor.root.position.y = set.hatchRise(actor.scale, k);
}
// walk through waypoints (marks or { pos }) from t0; returns the last leg's travel state
function walkPath(actor, pts, t0, t, { idleAt = 0, endHeading, speed = 12 } = {}) {
  let s0 = t0, m;
  for (let i = 0; i < pts.length - 1; i++) {
    const last = i === pts.length - 2;
    m = K.walk(actor, A, pts[i], pts[i + 1], s0, t, { idleAt, speed, endHeading: last ? endHeading : undefined });
    if (!m.done || last) return m;
    s0 = m.arrive;
  }
  return m;
}
// step backwards (facing `heading`) from a to b, legs driven by the distance (kit walk gait)
function backStep(actor, a, b, t0, t, heading, speed = 5) {
  const d = a.pos.distanceTo(b.pos), u = clamp((t - t0) / (d / speed), 0, 1);
  K.posture(actor, u > 0 && u < 1 ? K.gait('walk', -(u * d) / 14.5) : 'stand');
  K.putOn(actor, { pos: a.pos.clone().lerp(b.pos, u), heading });
  return u >= 1;
}

// ---------- Skye ----------
function poseSkye(t, idle) {
  const s = C.skye, ts = M.teaSkye(), pose = M.pose();
  if (t < T.skyeUp) {                                   // at the tea box; her head snaps to the rattling hatch
    sitFloor(s, ts, ts.heading);
    headTurn(s, headTo(s, W(4.5, 9.0), 0.9) * sm(T.rattle, T.rattle + 0.25, t));
    return;
  }
  if (t < T.goDecor) {                                  // up, looking for somewhere to hide: one hand to her head
    K.posture(s, 'stand'); K.putOn(s, { pos: ts.pos, heading: ts.heading + 0.4 * Math.sin((t - T.skyeUp) * 3) });
    K.gesture(s, 'hair_pat', 'R', sm(T.skyeUp, T.skyeUp + 0.3, t));
    return;
  }
  const wp = pt(-1.0, 5.2);                             // round the front of the tea box (Lily stands by it)
  const m = walkPath(s, [{ pos: ts.pos, heading: ts.heading }, wp, pt(3.2, 1.0), off(M.pose(), 3.5, 0), pose], T.goDecor + 0.1, t, { idleAt: idle, endHeading: pose.heading, speed: 16 });
  if (!m.done) return;
  // the propped scarecrow (C7-2): arms ~30 deg below horizontal, a little forward, a slow sway; never above the head
  K.putOn(s, pose);
  let k = sm(T.pose - 0.2, T.pose + 0.15, t);
  k *= 1 - 0.12 * sm(at(21), end(21), t);               // a tired droop on "I almost got hoovered"
  k *= 1 - 0.5 * sm(T.armsDown, T.armsDown + 1.2, t);   // the arms come down at the end (the end frame)
  const sw = Math.sin(idle * 1.3) * 2.5;
  K.posture(s, { 'Arm.L': [-22 * Math.min(1, 2 * k), 0, -(60 * k + sw * k)], 'Arm.R': [-22 * Math.min(1, 2 * k), 0, 60 * k - sw * k], Torso: [0, sw * 0.4, 0] });   // a little forward: clear of the open box lid behind her
  const fl = sm(T.nozzle + 0.6, T.nozzle + 0.9, t) * (1 - sm(T.humOff, T.humOff + 0.4, t));
  headTurn(s, 0, -0.1 * fl);                            // a tiny flinch from the nozzle
}

// ---------- Lily ----------
function poseLily(t, idle) {
  const l = C.lily, tl = M.teaLily(), stand = pt(-0.6, 5.0, -1.2);
  const atTea = (tt) => {                               // kneeling at the box, cup in her left hand; sips on "plan ahead"
    sitFloor(l, tl, tl.heading, 'kneel');
    const sip = sm(at(10, 0.6), at(10, 0.9), tt) * (1 - sm(end(10), end(10, 0.3), tt));
    K.gesture(l, 'cup_hold', 'L', 0.35 + 0.65 * sip);
  };
  if (t < T.lilyUp) { sitFloor(l, tl, tl.heading, 'kneel'); headTurn(l, headTo(l, W(4.5, 9.0), 0.8) * sm(T.rattle + 0.1, T.rattle + 0.35, t)); return; }
  if (t < T.lilyGo) {                                   // "Quick! Be a decoration!": side-on, pointing across at the decorations
    K.playAnim(l, [[A.idle, idle]]); K.putOn(l, { pos: stand.pos, heading: -0.25 });   // to Skye and the camera
    K.gesture(l, [-35, 0, -80], 'L', sm(at(3), at(3, 0.25), t));                         // her left arm out sideways at the decorations (one arm)
    return;
  }
  if (t < T.lilyBack) {
    const m = walkPath(l, [stand, pt(3.0, 2.2), pt(5.6, -1.4), GRAB()], T.lilyGo, t, { idleAt: idle, speed: 16 });
    if (!m.done) return;
    const reach = sm(m.arrive, m.arrive + 0.12, t) * (1 - sm(m.arrive + 0.25, m.arrive + 0.35, t));
    const m2 = walkPath(l, [GRAB(), S.lilyWait()], m.arrive + 0.35, t, { idleAt: idle, speed: 14, endHeading: S.lilyWait().heading });
    if (!m2.done) { if (reach > 0) K.gesture(l, [-70, 0, -6], 'L', reach); return; }
    const m3 = walkPath(l, [S.lilyWait(), S.lilyJam()], Math.max(m2.arrive, T.jam - 0.45), t, { idleAt: idle, speed: 8, endHeading: S.lilyJam().heading });   // steps in once Skye stands still
    if (!m3.done) return;
    if (t < T.lilyStep) {                               // hops and jams it on (one arm up in front of her)
      const hop = Math.max(0, Math.sin(Math.PI * inv(T.jam - 0.3, T.jam + 0.05, t)));
      l.root.position.y += 0.8 * hop;
      if (t < T.jam + 0.15) K.gesture(l, 'reach_up', 'L');
      return;
    }
    const lo = S.lilyOrders(), ok = backStep(l, S.lilyJam(), lo, T.lilyStep, t, lerp(S.lilyJam().heading, lo.heading, sm(T.lilyStep, T.lilyStep + 0.4, t)));
    if (ok) K.gesture(l, 'finger_up', 'L', sm(at(5, 2.0), at(5, 2.3), t) * (1 - sm(end(5, -0.3), end(5), t)));
    return;
  }
  if (t < T.lilyCome) {                                 // back at the tea party (runs across, wide of the lens)
    const m = walkPath(l, [S.lilyOrders(), pt(2.0, 4.6), tl], T.lilyBack, t, { idleAt: idle, speed: 16 });
    if (m.done) atTea(t);
    return;
  }
  const le = S.lilyEnd();
  const m = walkPath(l, [tl, pt(2.0, 2.6), le], T.lilyCome, t, { idleAt: idle, endHeading: le.heading });
  if (m.done) headTurn(l, at(24, -0.3) < t ? headTo(l, C.skye.bones.Head.getWorldPosition(V()), 0.9) * 0.8 : 0);   // side-eye at Skye on "Sure."
}

// ---------- Dad ----------
function poseDad(t, idle) {
  const d = C.dad, climb = M.climb();
  if (t < T.dadRise) { d.root.visible = false; return; }
  if (t < T.dadOut) { climbAt(d, climb, climb.heading, sm(T.dadRise, T.dadOut - 0.1, t), { busyL: true }); return; }
  if (t < T.dadWalk1) {
    const m = walkPath(d, [climb, DAD_OUT()], T.dadStep, t, { idleAt: idle, endHeading: towards(DAD_OUT(), M.teaLily()) });
    if (m.done && t > at(7) - 0.3) d.root.rotation.y = towards(DAD_OUT(), M.teaLily());
    return;
  }
  if (t < T.dadWalk2) {
    const m = walkPath(d, [DAD_OUT(), DAD_NEAR()], T.dadWalk1, t, { idleAt: idle, endHeading: towards(DAD_NEAR(), M.teaLily()) + 0.6 });
    if (m.done && t > at(9, 1.6) && t < end(9)) K.gesture(d, 'point', 'L', sm(at(9, 1.6), at(9, 1.9), t));   // side-on toward the decorations
    return;
  }
  const insp = S.inspect();
  if (t < T.stepBack) {
    // along the row: "Skeleton." (points at it), "Witch." (at her), "Giant pumpkin girl." (stops in front of Skye)
    const m = walkPath(d, [DAD_NEAR(), pt(4.6, 0.6), insp], T.dadWalk2, t, { idleAt: idle, endHeading: insp.heading, speed: 7 });
    const skel = set.items.skeleton.getWorldPosition(V()), wit = set.items.witch.getWorldPosition(V());
    if (t < T.witch) { K.gesture(d, 'point', 'L', sm(T.skel - 0.15, T.skel + 0.1, t)); headTurn(d, headTo(d, skel, 0.9)); }
    else if (t < T.girl - 0.25) { K.gesture(d, 'point', 'L', 1 - sm(T.girl - 0.5, T.girl - 0.25, t)); headTurn(d, headTo(d, wit, 0.9)); }
    if (!m.done) return;
    const lk = sm(T.lean, T.lean + 0.5, t) * (1 - sm(T.unlean, T.unlean + 0.4, t));
    if (lk > 0) K.posture(d, 'hip_bend', { mix: 0.65 * lk, reset: false });                       // nose to nose
    if (t > at(12) && t < end(12)) K.gesture(d, 'hand_on_hip', 'L', sm(at(12), at(12, 0.3), t) * (1 - sm(end(12, -0.3), end(12), t)));   // hand on his hip, mulling it over
    if (t > at(14) && t < at(16)) headTurn(d, headTo(d, M.teaLily().pos, 1.0) * sm(at(14), at(14, 0.3), t) * (1 - sm(at(16), at(16, 0.3), t)));
    return;
  }
  const hv = S.hoover();
  if (t < T.dadGo) {
    backStep(d, insp, hv, T.stepBack, t, lerp(insp.heading, hv.heading, sm(T.stepBack, T.stepBack + 0.5, t)));
    const nz = sm(T.nozzle, T.nozzle + 0.6, t) * (1 - sm(T.humOff + 0.2, T.humOff + 0.6, t));
    if (nz > 0) K.gesture(d, 'hold_out', 'R', nz);                                          // the wand up at her face
    if (t > T.humOff) { d.root.rotation.y += 0.9 * sm(T.humOff, T.humOff + 0.4, t); headTurn(d, 0.6 * sm(T.humOff, T.humOff + 0.4, t)); }   // freezes, turns to the hatch
    return;
  }
  if (t < T.dadDown) {                                   // carries the vacuum to the hatch, sets it down
    const vs = VAC_SPOT(), drop = { pos: vs.pos.clone().add(V(-1.2, 0, -0.9)), heading: 0 };
    const m = walkPath(d, [{ pos: hv.pos, heading: hv.heading + 0.9 }, drop, DOWN()], T.dadGo, t, { idleAt: idle, speed: 12, endHeading: 0 });
    return;
  }
  if (t < T.dadDown + 0.8) { climbAt(d, DOWN(), 0, 1 - sm(T.dadDown, T.dadDown + 0.75, t), { reach: 40 }); return; }   // facing the ladder
  d.root.visible = false;
}

// ---------- Max ----------
function poseMax(t, idle) {
  const x = C.max, climb = M.climb();
  if (t < T.maxUp) { x.root.visible = false; return; }
  if (t < T.maxOut) {                                   // up the ladder to head and shoulders, then the long look at her
    const k = 0.62 * sm(T.maxUp, T.maxUp + 0.5, t);
    climbAt(x, climb, towards(climb, M.pose()), k);
    if (t > T.maxUp + 0.5) K.posture(x, 'stand', { reset: false, extra: { 'Arm.L': [-60, 0, -6], 'Arm.R': [-60, 0, 6] } });   // hands on the hatch rim
    return;
  }
  const mf = S.maxFront(), mb = S.maxBack();
  if (t < T.maxGo) {
    if (t < T.maxBack) {
      const m = walkPath(x, [climb, pt(5.6, 4.0), mf], T.maxOut, t, { idleAt: idle, endHeading: mf.heading });
      if (!m.done) return;
      const fx = sm(T.fix - 0.3, T.fix, t) * (1 - sm(T.fix + 0.45, T.fix + 0.7, t));
      if (fx > 0) K.gesture(x, [-147, 0, 8], 'L', fx);  // his right hand up on the bucket, turning it level
      return;
    }
    backStep(x, mf, mb, T.maxBack, t, mf.heading);
    if (t > at(20, -0.35)) x.root.rotation.y = lerp(mf.heading, towards(mb, M.teaLily()), sm(at(20, -0.35), at(20, 0.0), t));
    return;
  }
  if (t < T.maxDown) { walkPath(x, [mb, pt(4.6, 2.2), DOWN()], T.maxGo, t, { idleAt: idle, endHeading: 0 }); return; }
  if (t < T.maxDown + 0.8) { climbAt(x, DOWN(), 0, 1 - sm(T.maxDown, T.maxDown + 0.75, t), { reach: 40 }); return; }
  x.root.visible = false;
}

// ---------- props ----------
function placeProps(t) {
  let lid = 0;
  if (t < T.lidLift) lid = 0.03 * Math.max(0, Math.sin(t * 23)) * (Math.sin(t * 2.7) > 0.2 ? 1 : 0);
  else if (t < T.dadRise) lid = 0.12 * sm(T.lidLift, T.lidLift + 0.6, t);
  else lid = lerp(0.12, 1, sm(T.dadRise - 0.1, T.dadRise + 0.35, t));
  const lilyCup = (t >= T.lilyBack + 0.9 && t < T.lilyCome) || t < T.lilyUp;
  // Lily flips the HALLOWEEN lid shut once she has the bucket (it would be in Skye's way behind her)
  const shut = sm(T.grab + 0.05, T.grab + 0.3, t);
  K.setState({ chapter: 7, hatch: lid, halloween: 1 - shut, pumpkin: t < T.grab ? 'box' : 'none', vacuum: false, hide: ['teddy_right', ...(lilyCup ? ['cup_2'] : [])] });
  // the hatch light: softer while someone climbs through it (no neon bloom on the hoodies)
  const hg = set.lights?.hatchGlow; if (hg && hg.intensity > 0) hg.intensity *= 0.35;
  // Lily's cup (her own, from the box) while she kneels at the tea party
  P.cup.visible = lilyCup;
  if (lilyCup) K.hold(P.cup, C.lily, 'L', 'palm');
  // pumpkin: lifted out of the HALLOWEEN box in Lily's left hand, then worn by Skye, crooked until Max straightens it
  P.bucket.visible = t >= T.grab && t < T.jam;
  if (P.bucket.visible) K.hold(P.bucket, C.lily, 'L', 'side');
  P.worn.visible = t >= T.jam;
  if (P.worn.visible) {
    const k = 1 - sm(T.fix, T.fix + 0.4, t), drop = 0.25 * (1 - sm(T.jam, T.jam + 0.12, t));
    K.wearOnHead(P.worn, C.skye, { tilt: [0.22 * k, -0.2 * k], rim: 0.55 + drop });
  }
  // vacuum: carried up in Dad's left hand, set down, its wand in his right palm the whole scene, left beside the hatch
  const v = P.vac, wand = v.userData.wand;
  v.visible = t >= T.dadRise;
  if (!v.visible) return;
  const d = C.dad.root, h = d.rotation.y, left = V(Math.cos(h), 0, -Math.sin(h)), fwd = V(Math.sin(h), 0, Math.cos(h));
  const carried = t < T.vacDown || (t >= T.dadGo && t < T.dadDown - 0.45);
  if (carried) { K.hold(v, C.dad, 'L', 'side'); }
  else {
    if (v.parent !== P.scene) P.scene.add(v);
    if (t < T.dadGo) { const p = d.position.clone().addScaledVector(left, -1.9).addScaledVector(fwd, -0.2); p.y = 0; K.place(v, p, h); }   // at his right side, the hose up to the wand in his right hand
    else { const vs = VAC_SPOT(); K.place(v, vs.pos, vs.heading); }
  }
  if (t >= T.dadOut && t < T.dadDown - 0.45) {
    const nz = sm(T.nozzle, T.nozzle + 0.6, t) * (1 - sm(T.humOff + 0.2, T.humOff + 0.6, t));
    if (nz > 0.05) K.hold(wand, C.dad, 'R', 'palm', { aim: K.headPos(C.skye) });
    else {                                              // held like a real wand: angled down, nozzle on the boards ahead of him
      const fl = d.position.clone().addScaledVector(fwd, 2.1).addScaledVector(left, -0.9); fl.y = 0.15;
      K.hold(wand, C.dad, 'R', 'palm', { aim: fl });
    }
  } else v.userData.park();
}

// ---------- cameras ----------
// the two-shot on Skye and whoever stands in front of her, from the -x side, square to the pair (both faces cheated 3/4)
function pairShot(s, other, { dist = 6.0, up = 0.25, fov = 36, bias = 0.5, spot = null } = {}) {
  const a = K.headPos(C.skye), b = K.headPos(other), mid = a.clone().lerp(b, bias);
  const c = pairCamPos((spot ? spot() : other.root).pos ?? other.root.position, dist); c.y = mid.y + up;   // placed from the partner's mark, so it holds still while they walk
  return K.setCam(s, { pos: c, target: mid.clone().add(V(0, -0.35, 0)), fov });
}
const HATCH_CAM = (s) => K.setCam(s, { pos: W(-2.6, 0.6, 5.8), target: W(4.3, 7.4, 2.8), fov: 44 });
const HATCH_SIDE = (s) => K.setCam(s, { pos: W(0.6, 8.0, 5.4), target: W(4.6, 0.6, 4.0), fov: 44 });   // from beside the hatch, back at the room
const LILY_TEA = (s) => K.setCam(s, { pos: W(-4.8, 8.6, 3.8), target: W(-1.5, 3.9, 2.0), fov: 40 });
const OPEN = (s) => K.setCam(s, { pos: W(-5.0, 12.4, 5.6), target: W(2.8, 0.6, 1.4), fov: 52 });
const SHOTS = [
  { line: 1, off: 0, id: 'open', cam: OPEN },
  { line: 2, off: 0, id: 'hide', cam: (s) => K.setCam(s, { pos: W(-3.3, 11.2, 4.8), target: W(-3.2, 4.2, 3.0), fov: 46 }) },
  { line: 3, off: 0, id: 'lily_quick', cam: (s) => K.setCam(s, { pos: W(-1.4, 10.4, 4.0), target: W(-0.8, 5.0, 2.8), fov: 38 }) },
  { line: 4, off: 0, id: 'skye_what', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.3 }) },
  { line: 4, off: 0.6, id: 'decor_jam', cam: (s) => K.setCam(s, { pos: W(1.6, 3.4, 4.6), target: W(6.8, -3.0, 3.0), fov: 46 }) },
  { line: 5, off: 0, id: 'lily_orders', cam: (s) => K.setCam(s, { pos: W(1.6, 2.6, 4.4), target: W(6.4, -2.6, 3.4), fov: 40 }) },
  { line: 6, off: -0.85, id: 'back_wide', cam: OPEN },
  { line: 6, off: 0.15, id: 'dad_rises', cam: HATCH_CAM },
  { line: 7, off: 0, id: 'dad_lily', cam: (s) => K.camOn(s, C.dad, 'ms', { angle: -0.4 }) },
  { line: 8, off: 0, id: 'lily_tea', cam: LILY_TEA },
  { line: 9, off: 0, id: 'dad_halloween', cam: (s) => K.setCam(s, { pos: W(-3.6, 6.0, 5.4), target: W(4.4, -1.0, 3.0), fov: 46 }) },
  { line: 10, off: 0, id: 'lily_plan', cam: LILY_TEA },
  { line: 11, off: 0, id: 'row', cam: (s) => pairShot(s, C.dad, { dist: 10.5, fov: 46, up: 0.6, spot: S.inspect }) },   // the row and Dad walking up to her
  { line: 12, off: 0, id: 'two_hmm', cam: (s) => pairShot(s, C.dad, { spot: S.inspect }) },
  { line: 13, off: -0.8, id: 'nose', cam: (s) => pairShot(s, C.dad, { dist: 6.5, fov: 24, spot: S.inspect }) },
  { line: 14, off: 0, id: 'dad_asks', cam: (s) => pairShot(s, C.dad, { spot: S.inspect }) },
  { line: 15, off: 0, id: 'lily_festive', cam: LILY_TEA },
  { line: 16, off: 0, id: 'hoover', cam: (s) => pairShot(s, C.dad, { dist: 7.5, fov: 40, spot: S.hoover }) },
  { line: 16, off: 2.4, id: 'nozzle_cu', cam: (s) => pairShot(s, C.dad, { dist: 4.6, fov: 30, bias: 0.15, spot: S.hoover }) },
  { line: 17, off: 0, id: 'max_off', cam: (s) => pairShot(s, C.dad, { dist: 7.5, fov: 40, spot: S.hoover }) },
  { line: 18, off: 0, id: 'dad_leaves', cam: HATCH_SIDE },
  { line: 18, off: 1.2, id: 'dad_down', cam: HATCH_CAM },
  { line: 19, off: 0.7, id: 'max_fix', cam: (s) => pairShot(s, C.max, { dist: 5.2, fov: 36, spot: S.maxFront }) },
  { line: 20, off: 0, id: 'max_dinner', cam: (s) => pairShot(s, C.max, { dist: 5.8, fov: 38, spot: S.maxBack }) },
  { line: 21, off: 0, id: 'skye_hoovered', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.25, fov: 36, look: V(0, 0.35, 0) }) },
  { line: 22, off: 0, id: 'end_two', cam: (s) => pairShot(s, C.lily, { dist: 6.4, fov: 44, up: -0.2, bias: 0.4, spot: S.lilyEnd }) },
  { line: 24, off: -0.05, id: 'lily_sure', cam: (s) => pairShot(s, C.lily, { dist: 4.6, fov: 40, up: -0.4, bias: 0.6, spot: S.lilyEnd }) },
].map((x) => ({ ...x, start: x.line === 1 && x.off === 0 ? 0 : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- faces: one base emotion per line (lip sync from the kit on the words) ----------
function faces(t) {
  const posed = t >= T.pose;
  const skye = t < at(2) ? 'shocked' : t < T.pose ? 'scared' : t < at(21) ? (t > T.nozzle + 0.5 && t < T.humOff + 0.3 ? 'scared' : 'neutral') : t < at(23) ? 'annoyed' : 'smug';
  const lily = t < at(2) ? 'surprised' : t < at(5) ? 'happy' : t < T.dadRise ? 'smug' : t < at(10) ? 'happy' : t < at(15) ? 'smug' : t < at(21) ? 'neutral' : t < at(24) ? 'smug' : 'suspicious';
  const dad = t < at(7) ? 'determined' : t < at(9) ? 'surprised' : t < at(11) ? 'suspicious' : t < at(12) ? 'happy' : t < at(14) ? 'suspicious' : t < at(16) ? 'confused' : t < at(17) ? 'determined' : t < at(18) ? 'surprised' : 'happy';
  const max = t < T.fix - 0.1 ? 'suspicious' : t < at(20) ? 'smug' : 'neutral';
  K.speak(C.skye, skye, t, posed && t < at(21) ? [] : L.said('SKYE'));
  K.speak(C.lily, lily, t, L.said('LILY'));
  K.speak(C.dad, dad, t, L.said('DAD'));
  K.speak(C.max, max, t, L.said('MAX').filter((w) => w.start > at(18)));   // his offscreen call isn't lip-synced
}

export const cast = () => ({ skye: C.skye, lily: C.lily, dad: C.dad, max: C.max });   // for web/ch07_hold.js
export const HOLD_TIMES = T;

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  set = K.showSet('attic');
  K.applyLight(stage, 'attic_afternoon', { set });
  K.only(C, ['skye', 'lily', 'dad', 'max']);
  const idle = K.holdClock(t, L, [[T.goDecor, T.pose + 0.3], [T.lilyStep, T.lilyStep + 0.6], [T.dadRise, T.dadOut + 1], [T.dadWalk1, T.dadWalk1 + 1], [T.dadWalk2, T.girl + 0.5], [T.stepBack, T.stepBack + 0.5], [T.dadGo, T.maxOut + 1.2], [T.maxBack, T.maxBack + 0.4], [T.maxGo, T.maxDown + 0.8], [T.lilyCome, T.lilyCome + 1.2]]);
  poseSkye(t, idle); poseLily(t, idle + 0.7); poseDad(t, idle + 1.3); poseMax(t, idle + 2.1);
  placeProps(t);
  faces(t);
  K.setBlockers(set.group);
  K.setLine(C.skye, C.dad.root.visible ? C.dad : C.lily, 1);
  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }
