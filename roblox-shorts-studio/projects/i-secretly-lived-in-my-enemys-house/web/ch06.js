// Ch6: The Practice (THURSDAY 10:15 PM). Upstairs hallway at night, cutting inside Max's room. Plan: production/shots/ch06.md.
// Skye creeps to Max's door and overhears him practising asking someone to the dance; Lily sneaks up ("You like him");
// Dad's broom patrol; Lily pulls Skye into the linen closet; "I'm checking every single box." "Every box?" "Uh-oh."
// Everything is a pure function of t, keyed to the spoken lines (lines.json indexes are 1-based).
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 6;
const CARD = { day: 'THURSDAY', time: '10:15 PM' };
const EST = [
  { index: 1, speaker: 'VO', text: 'Thursday night. I had my best haunting planned yet. Then I heard him through his bedroom door.', start: 0.0, end: 5.0 },
  { index: 2, speaker: 'MAX', note: 'behind door', text: 'Hey. So. Do you want to go to the Halloween dance with me?', start: 5.35, end: 9.0 },
  { index: 3, speaker: 'MAX', note: 'behind door', text: 'No. Too serious.', start: 9.25, end: 10.5 },
  { index: 4, speaker: 'MAX', note: 'behind door', text: 'Yo! Dance? You? Me? Ugh. No.', start: 10.75, end: 13.8 },
  { index: 5, speaker: 'MAX', note: 'behind door', text: "Okay. This weekend, I just ask her. What's the worst she can say? Gross?", start: 14.05, end: 18.4 },
  { index: 6, speaker: 'SKYE', note: 'whisper', text: 'Who is he asking?', start: 18.65, end: 19.9 },
  { index: 7, speaker: 'SKYE', note: 'whisper', text: 'Who would even say yes to him?', start: 20.15, end: 21.9 },
  { index: 8, speaker: 'LILY', note: 'whisper', text: 'You like him.', start: 22.75, end: 23.9 },
  { index: 9, speaker: 'SKYE', note: 'whisper', text: "Lily! Don't sneak up on me.", start: 24.15, end: 25.8 },
  { index: 10, speaker: 'SKYE', note: 'whisper', text: 'And I do not like him.', start: 26.05, end: 27.5 },
  { index: 11, speaker: 'LILY', note: 'whisper', text: 'Then why is your face all red?', start: 27.75, end: 29.6 },
  { index: 12, speaker: 'SKYE', note: 'whisper', text: "It's dusty up there. It's a very dusty attic.", start: 29.85, end: 32.8 },
  { index: 13, speaker: 'DAD', text: "Hello? Mister Ghost? This is a friendly house. We're friendly people.", start: 33.85, end: 38.6 },
  { index: 14, speaker: 'DAD', text: 'But you have eaten nine of my pancakes, and that is where I draw the line.', start: 38.85, end: 43.4 },
  { index: 15, speaker: 'DAD', text: 'Max, was that you?', start: 44.25, end: 45.5 },
  { index: 16, speaker: 'MAX', note: 'behind door', text: 'Go to bed, Dad!', start: 45.75, end: 46.9 },
  { index: 17, speaker: 'DAD', text: "I'm a grown man. I go to bed when I want.", start: 47.15, end: 50.0 },
  { index: 18, speaker: 'DAD', text: "Tomorrow, I'm going up into that attic, and I'm checking every single box.", start: 50.25, end: 55.0 },
  { index: 19, speaker: 'SKYE', note: 'whisper', text: 'Every box?', start: 55.25, end: 56.1 },
  { index: 20, speaker: 'LILY', note: 'whisper', text: 'Uh-oh.', start: 56.35, end: 57.0 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
const LAST = Math.max(...L.lines.map((l) => l.end));
export const meta = K.chapterMeta(LAST + 0.8);        // last line + 0.8 s room tone (boundary sheet: 0.5-1.0 s)
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ln = (i) => L.line(i);
const at = (i, off = 0) => ln(i).start + off;
const end = (i, off = 0) => ln(i).end + off;
// start time of the k-th word (0-based) of spoken line i (measured words when narration exists, else spread evenly)
function wordT(i, k) {
  const l = ln(i), ws = L.words.filter((w) => w.start >= l.start - 0.05 && w.start < l.end);
  if (ws.length > k) return ws[k].start;
  const n = l.text.split(/\s+/).length; return l.start + (l.end - l.start) * k / n;
}

// ---------- key times ----------
const T = {
  heard: () => wordT(1, 11),                 // "heard"
  whats: () => wordT(5, 7),                  // "What's": cut back to Skye at the door
  tap: () => end(7, 0.2),                    // Lily's tap (the +0.6 pause)
  creak: () => end(12, 0.12),                // floorboard creak, Dad's beam (the +0.8 pause)
  hide: () => end(14, 0.08),                 // Lily pulls Skye into the closet (the +0.6 pause)
  hatch: () => wordT(18, 1),                 // "I'm going up": Dad steps under the hatch
};

// ---------- marks (fallbacks are offsets from the set origin, until kit-sets-a defines them) ----------
// Hallway runs along x; the open camera side is +z; back wall at z -9: linen closet (x -6), Max's door (x -1),
// attic hatch in the ceiling (x +3), stairs top at the right end (x +10).
const M = {
  creep: () => K.mark('hallway', 'hall_creep_start', { pos: V(-10, 0, -5.6), heading: 1.45 }),
  door: () => K.mark('hallway', 'max_door_out', { pos: V(-1.9, 0, -7.0), heading: 1.25 }),
  lilyStart: () => K.mark('hallway', 'lily_start', { pos: V(-11, 0, -5.0), heading: 1.5 }),
  lily: () => K.mark('hallway', 'lily_behind', { pos: V(-4.2, 0, -6.3), heading: 1.5 }),
  linenSkye: () => K.mark('hallway', 'linen_in_R', { pos: V(-5.6, 0, -8.2), heading: 0.55 }),
  linenLily: () => K.mark('hallway', 'linen_in_L', { pos: V(-6.6, 0, -7.7), heading: 0.55 }),
  stairs: () => K.mark('hallway', 'stairs_top', { pos: V(10, 0, -4.5), heading: -1.57 }),
  dadMid: () => K.mark('hallway', 'dad_mid', { pos: V(4.5, 0, -4.8), heading: -1.2 }),
  hatch: () => K.mark('hallway', 'under_hatch', { pos: V(3.2, 0, -4.4), heading: -0.35 }),
  mirror: () => K.mark('bedroom', 'mirror_stand', { pos: V(5, 0, -3.5), heading: -0.5 }),
};
const HALL_Z = () => K.mark('hallway', 'hall_line', { pos: V(0, 4, -6), heading: 0 }).pos.z;

// ---------- setup ----------
let C, A, P = {}, beamSkye, beamDad;
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'bedroom']);
  K.setState({ chapter: CH });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs'); K.dress(C.dad, 'dad_robe');
  A = await K.loadAnims(['idle', 'walk', 'run', 'shock', 'point_forward', 'point_up', 'facepalm', 'think', 'horror_listen', 'look_up']);
  P.torchSkye = K.makeProp('flashlight', { color: 'pink' }); stage.scene.add(P.torchSkye); K.hold(P.torchSkye, C.skye, 'R');
  P.torchDad = K.makeProp('flashlight'); stage.scene.add(P.torchDad); K.hold(P.torchDad, C.dad, 'L');
  P.broom = K.makeProp('broom'); stage.scene.add(P.broom); K.hold(P.broom, C.dad, 'R');
  beamSkye = K.flashlightBeam(stage); beamDad = K.flashlightBeam(stage);
}
export const cast = () => ({ skye: C.skye, max: C.max, lily: C.lily, dad: C.dad });

// ---------- the shot table ----------
const H = 'hallway', B = 'bedroom';
const SHOTS = [
  { at: () => 0, id: 'creep', set: H, cam: (s) => camCreep(s) },
  { at: () => at(2, -0.15), id: 'mirror_mcu', set: B, cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.5 }) },
  { at: () => at(4, -0.15), id: 'mirror_ms', set: B, cam: (s) => K.camOn(s, C.max, 'ms', { angle: 0.45 }) },
  { at: () => at(5, -0.15), id: 'mirror_ask', set: B, cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.35 }) },
  { at: () => T.whats() - 0.1, id: 'door_listen', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.75 }) },
  { at: () => T.tap() - 0.45, id: 'tap', set: H, cam: (s) => K.twoShot(s, C.lily, C.skye, { framing: 'ms', bias: 0.6 }) },
  { at: () => at(9, -0.1), id: 'skye_mcu', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.5 }) },
  { at: () => at(11, -0.1), id: 'lily_mcu', set: H, cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.45 }) },
  { at: () => at(12, -0.1), id: 'skye_dusty', set: H, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.5 }) },
  { at: () => T.creak(), id: 'hall_wide', set: H, cam: (s) => camFixed(s, 'hall_wide', V(-2.0, 5.2, 9.0), V(3.0, 3.4, -5.5), 52) },
  { at: () => at(13, 0.6), id: 'dad_ms', set: H, cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.45 }) },
  { at: () => at(14, -0.1), id: 'dad_mcu', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.4 }) },
  { at: () => T.hide() - 0.05, id: 'hide_wide', set: H, cam: (s) => camFixed(s, 'hall_wide', V(-2.0, 5.2, 9.0), V(-1.0, 3.4, -5.5), 52) },
  { at: () => at(15, -0.1), id: 'dad_max', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.6 }) },
  { at: () => at(16, -0.1), id: 'max_bed', set: B, cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.3 }) },
  { at: () => at(17, -0.1), id: 'dad_grown', set: H, cam: (s) => K.camOn(s, C.dad, 'mcu', { angle: 0.4 }) },
  { at: () => T.hatch() - 0.1, id: 'dad_hatch', set: H, cam: (s) => K.camOn(s, C.dad, 'ms', { angle: 0.35, height: -1.6, look: V(0, 1.4, 0), fov: 46 }) },
  { at: () => at(19, -0.12), id: 'gap', set: H, cam: (s) => K.twoShot(s, C.lily, C.skye, { framing: 'mcu', bias: 0.6 }) },
  { at: () => at(20, -0.1), id: 'end', set: H, cam: (s) => camEnd(s) },
].map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// a set camera if kit-sets-a has it, else a fallback (offsets from the set origin)
function camFixed(stage, name, pos, target, fov) {
  const set = K.getSet(H), c = set?.cams?.[name];
  if (c) return K.setCam(stage, c, { blockers: [set.group] });
  const o = set?.group?.position || V(300, 0, 0);
  return K.setCam(stage, { pos: pos.clone().add(o), target: target.clone().add(o), fov }, { blockers: [set.group] });
}
// opening: a slow pan with Skye creeping to Max's door, her face 3/4 below the day card
function camCreep(stage) {
  const set = K.getSet(H);
  if (set?.cams?.door_approach) return K.setCam(stage, set.cams.door_approach, { blockers: [set.group] });
  const o = set.group.position, target = K.headPos(C.skye).add(V(0.6, 0.55, 0));
  return K.setCam(stage, { pos: o.clone().add(V(2.5, 4.3, 3.5)), target, fov: 34 }, { blockers: [set.group] });
}
// last frame: toward the linen-closet gap, Dad in the foreground (3/4) facing the hatch
function camEnd(stage) {
  const set = K.getSet(H);
  if (set?.cams?.linen_end) return K.setCam(stage, set.cams.linen_end);
  const d = K.headPos(C.dad), g = K.headPos(C.skye).lerp(K.headPos(C.lily), 0.4);
  const target = d.clone().lerp(g, 0.55).add(V(0, -0.6, 0));
  const pos = d.clone().add(V(4.2, -0.8, 8.5));
  return K.setCam(stage, { pos, target, fov: 42 });
}

// ---------- arm and head overrides (after playAnim; one arm high at most) ----------
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
// fwd: swing forward (rad, 0 hanging, PI/2 straight ahead, <= 2.4); out: away from the body (rad); twist about the arm
function arm(a, side, fwd, out = 0, twist = 0) {
  _e.set(-fwd, twist, side === 'L' ? out : -out, 'XYZ'); a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(_e);
}
function headTurn(a, yaw = 0, pitch = 0, roll = 0) {
  _e.set(-pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e); a.bones.Head.quaternion.multiply(_q);
}
const pulse = (t, t0, d) => (t >= t0 && t < t0 + d ? Math.sin(Math.PI * (t - t0) / d) : 0);

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  const idle = K.holdClock(t, L, [[0, T.heard() + 0.6], [T.tap() - 1.4, T.tap() + 0.7], [T.creak(), at(13, 1.6)], [T.hide(), T.hide() + 0.9], [T.hatch() - 0.4, T.hatch() + 0.9]]);
  const zl = HALL_Z(), o = set.group.position;
  if (sh.set === H) K.setLine(V(o.x - 14, 4, zl), V(o.x + 14, 4, zl), 1); else K.clearLine();
  if (sh.set === H) hallway(t, idle, sh); else bedroom(t, idle, sh);
  K.setBlockers(set.group, ...Object.values(cast()).filter((a) => a.root.visible));

  K.applyLight(stage, 'night_moon', { set, practicals: sh.set === H ? { door_light: true, max_door_light: true } : { bedside_lamp: true, desk_lamp: true } });
  sh.cam(stage, t);
  beams(t, sh);
  OVL = { t };
}

// ---------- Max's room: rehearsing to the mirror ----------
function bedroom(t, idle, sh) {
  K.only(C, ['max']);
  const m = M.mirror(), mx = C.max;
  let face = 'nervous';
  if (t < at(3)) {                                    // "Hey. So. Do you want to go to the Halloween dance with me?"
    K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m);
    const k = smooth((t - at(2)) / 0.5) * (1 - smooth((t - wordT(2, 4)) / 0.4));      // hand to the back of his neck, nervous
    arm(mx, 'R', 2.1 * k, 0.55 * k, 0);
    const offer = smooth((t - wordT(2, 9)) / 0.35);                                    // open-hand offer on "with me?"
    if (offer > 0) arm(mx, 'L', 1.15 * offer, 0.25 * offer, 0);
    face = 'nervous';
  } else if (t < at(4)) {                             // "No. Too serious." head shake
    K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m);
    headTurn(mx, 0.35 * Math.sin((t - at(3)) * 14) * pulse(t, at(3), 0.8)); face = 'annoyed';
  } else if (t < at(5)) {                             // "Yo! Dance? You? Me? Ugh. No."
    K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m); face = 'happy';
    const you = wordT(4, 2), me = wordT(4, 3), ugh = wordT(4, 4);
    if (t >= you - 0.1 && t < me - 0.05) arm(mx, 'R', 1.55 * smooth((t - you + 0.1) / 0.15), 0.05);          // point at the mirror
    else if (t >= me - 0.05 && t < ugh - 0.05) arm(mx, 'R', 1.25, -0.55, 0);                                     // thumb to his chest
    if (t >= ugh - 0.05) { K.playAnim(mx, [[A.idle, idle], [A.facepalm, Math.min(0.3, t - ugh + 0.05), 1.6, false]]); face = 'annoyed'; }
  } else if (sh.id !== 'max_bed') {                   // "Okay. This weekend, I just ask her..." squares up
    K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m); face = 'determined';
    headTurn(mx, 0, 0.12 * pulse(t, wordT(5, 3), 0.5));
  } else {                                            // "Go to bed, Dad!" turned toward his door
    K.playAnim(mx, [[A.idle, idle]]); K.putOn(mx, m, { heading: m.heading - 1.1 }); face = 'annoyed';
  }
  K.speak(mx, face, t, L.said('MAX'));
}

// ---------- the hallway ----------
function hallway(t, idle, sh) {
  const sk = C.skye, li = C.lily, dd = C.dad;
  const lilyOn = t >= T.tap() - 1.3, dadOn = t >= T.creak() - 0.05;
  K.only(C, ['skye', ...(lilyOn ? ['lily'] : []), ...(dadOn ? ['dad'] : [])]);
  const door = M.door(), hide = T.hide();

  // --- Skye ---
  let skFace = 'scheming', chin = 1;                  // chin: 1 = flashlight under her chin, 0 = lowered
  if (t < hide) {
    const creepEnd = 2.7;
    const m = K.walk(sk, A, M.creep(), door, creepEnd - M.creep().pos.distanceTo(door.pos) / 3.4, t, { speed: 3.4, idleAt: idle, endHeading: door.heading });
    if (m.done) {
      const listen = t >= T.heard() - 0.1 && t < at(6, 0.1);
      const back = t >= at(6, 0.1);                   // pulls back from the door and turns her face out (3/4)
      let h = door.heading;
      if (back) h = door.heading - 0.75 * smooth((t - at(6, 0.1)) / 0.35);
      if (t >= T.tap()) h = door.heading - 0.75 - 1.35 * smooth((t - T.tap() - 0.25) / 0.35);   // turns to Lily
      if (t >= T.creak()) h = door.heading - 0.5 * smooth((t - T.creak() - 0.15) / 0.3) - 2.5 * (1 - smooth((t - T.creak() - 0.15) / 0.3));
      K.putOn(sk, { pos: door.pos, heading: h });
      K.playAnim(sk, listen ? [[A.idle, idle], [A.horror_listen, Math.min(1.2, t - T.heard() + 0.1), 1.5, false]] : [[A.idle, idle]]);
      if (listen) K.putOn(sk, { pos: door.pos.clone().add(V(0, 0, -0.25)), heading: h });
    }
    if (t < T.heard()) skFace = 'scheming';
    else if (t < at(6)) skFace = t < at(5) ? 'surprised' : 'suspicious';
    else if (t < at(7)) skFace = 'suspicious';
    else if (t < T.tap()) skFace = 'annoyed';
    else if (t < at(9)) skFace = 'shocked';
    else if (t < at(12)) skFace = 'annoyed';
    else if (t < T.creak()) skFace = 'nervous';
    else skFace = 'scared';
    // the jump when Lily taps her: arms out at shoulder height (shock), then back
    const jolt = pulse(t, T.tap() + 0.05, 0.8);
    if (jolt > 0) { K.playAnim(sk, [[A.idle, idle], [A.shock, 0.35, 2.5 * jolt, false]]); K.putOn(sk, { pos: door.pos, heading: sk.root.rotation.y }); chin = 1 - jolt; }
    if (t >= at(9, -0.1)) chin = 0;                  // flashlight lowered once she's talking to Lily
    if (t >= at(12) && t < T.creak()) {               // "up there": one arm points up at the ceiling (the left; the right holds the light)
      const u = pulse(t, wordT(12, 2) - 0.1, 1.3);
      if (u > 0) arm(sk, 'L', 2.3 * u, 0.15 * u);
    }
    if (t >= at(10) && t < at(11)) { arm(sk, 'L', 1.25, -0.7); }        // arms folded (left across)
  } else {                                            // pulled into the linen closet, peeking out
    const lin = M.linenSkye(), from = { pos: door.pos, heading: door.heading };
    const m = K.walk(sk, A, from, lin, hide + 0.12, t, { speed: 16, idleAt: idle, endHeading: lin.heading });
    if (m.moving) arm(sk, 'L', 1.1, 0.1);            // her hand in Lily's
    if (m.done) {
      K.playAnim(sk, [[A.idle, idle]]); K.putOn(sk, lin);
      headTurn(sk, 0.25, 0);
    }
    skFace = 'scared'; chin = 0;
  }
  K.speak(sk, skFace, t, L.said('SKYE'));
  P.torchSkye.userData.chin = chin;
  if (chin > 0.02) arm(sk, 'R', 1.25 * chin + 0.1, -0.35 * chin, 0);   // the torch held up in front of her chin

  // --- Lily ---
  if (lilyOn) {
    let lfFace = 'neutral';
    if (t < hide) {
      const lm = M.lily(), arrive = T.tap() - 0.05;
      const m = K.walk(li, A, M.lilyStart(), lm, arrive - M.lilyStart().pos.distanceTo(lm.pos) / 8, t, { speed: 8, idleAt: idle, endHeading: K.faceTo(lm, door) });
      if (m.done) {
        K.playAnim(li, [[A.idle, idle]]); K.putOn(li, { pos: lm.pos, heading: 1.0 });                    // cheated 3/4 to camera
        const tap = pulse(t, T.tap() - 0.05, 0.45);
        if (tap > 0) arm(li, 'L', 1.9 * tap, 0.1);    // the tap on Skye's shoulder
        if (t >= at(11) && t < at(12)) arm(li, 'L', 2.1 * smooth((t - wordT(11, 1)) / 0.2), 0.1);   // points up at Skye's red face
        headTurn(li, 0, 0.3);                         // looking up at Skye
      }
      if (t >= at(8, -0.2)) lfFace = 'smug';
      if (t >= T.creak()) { lfFace = 'surprised'; li.root.rotation.y = K.faceTo(lm, M.stairs()); headTurn(li, 0, 0); }
    } else {
      const lin = M.linenLily(), from = M.lily();
      const m = K.walk(li, A, from, lin, hide, t, { speed: 16, idleAt: idle, endHeading: lin.heading });
      if (m.moving) arm(li, 'L', 0.3, 0.1, 0) ;      // reaching back for Skye's hand
      if (m.done) { K.playAnim(li, [[A.idle, idle]]); K.putOn(li, lin); }
      lfFace = t < at(19) ? 'determined' : 'nervous';
    }
    K.speak(li, lfFace, t, L.said('LILY'));
  }

  // --- Dad ---
  if (dadOn) {
    let dFace = 'nervous', swordUp = 0, torchUp = 0;
    const st = M.stairs(), mid = M.dadMid(), hm = M.hatch();
    if (t < T.hatch()) {
      const m = K.walk(dd, A, st, mid, T.creak() + 0.15, t, { speed: 4, idleAt: idle, endHeading: mid.heading });
      if (m.done) {
        let h = mid.heading;
        if (t >= at(15, -0.2) && t < at(17)) h = K.faceTo(mid, door);                // "Max, was that you?" at Max's door
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, { pos: mid.pos, heading: h });
      }
      dFace = t < at(13, 1.6) ? 'nervous' : t < at(15) ? 'determined' : t < at(17) ? 'suspicious' : 'smug';
      if (t >= wordT(14, 11) && t < at(15)) swordUp = smooth((t - wordT(14, 11)) / 0.25);   // "draw the line"
      if (t >= at(17) && t < at(18)) headTurn(dd, 0, 0.18 * smooth((t - at(17)) / 0.3));    // chin up
    } else {
      const m = K.walk(dd, A, mid, hm, T.hatch(), t, { speed: 6, idleAt: idle, endHeading: hm.heading });
      if (m.done) {
        K.playAnim(dd, [[A.idle, idle]]); K.putOn(dd, hm);
        const u = smooth((t - m.arrive) / 0.4);
        headTurn(dd, 0, 0.55 * u); torchUp = u; swordUp = u;
      }
      dFace = 'determined';
    }
    // broom out in front like a sword (right), raised on "draw the line" / at the hatch; torch (left) forward, up at the hatch
    arm(dd, 'R', 1.25 + 0.55 * swordUp, 0.05, 0);
    arm(dd, 'L', 1.35 + 0.9 * torchUp, 0.12, 0);
    K.speak(dd, dFace, t, L.said('DAD'));
  }
}

// ---------- practicals: flashlight beams ----------
const _p = V(0, 0, 0), _d = V(0, 0, 0);
function handPos(a, side, out) { a.root.updateMatrixWorld(true); return a.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].localToWorld(out.set(side === 'R' ? -0.5 : 0.5, -1.9, 0).multiplyScalar(1)); }
function beams(t, sh) {
  if (sh.set !== H) { beamSkye.set(false); beamDad.set(false); return; }
  const sk = C.skye;
  if (sk.root.visible) {
    handPos(sk, 'R', _p);
    const chin = P.torchSkye.userData.chin ?? 0;
    if (chin > 0.5) { const h = sk.root.rotation.y; _d.set(-0.12 * Math.sin(h), 1, -0.12 * Math.cos(h)).normalize(); }   // straight up past her face
    else { const h = sk.root.rotation.y; _d.set(Math.sin(h), -1.4, Math.cos(h)).normalize(); }   // down at the floor
    beamSkye.set(true, _p.clone(), _d.clone());
  } else beamSkye.set(false);
  if (C.dad.root.visible) {
    const a = C.dad; handPos(a, 'L', _p);
    const s0 = a.bones['Arm.L'].localToWorld(V(0.5, 0, 0)); _d.copy(_p).sub(s0).normalize();   // along the arm
    if (t < at(13)) { const sw = Math.sin((t - T.creak()) * 2.2) * 0.6; _d.applyAxisAngle(V(0, 1, 0), sw); }  // the beam swings in
    beamDad.set(true, _p.clone(), _d.clone());
  } else beamDad.set(false);
}

// ---------- overlay ----------
let OVL = {};
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// moments for web/ch06_hold.js
export const HOLD_TIMES = {
  creep: 1.2, listen: at(6, 0.2), lowered: at(10, 0.3), lily: at(8, 0.3), closet: at(20, 0.2),
  dadWalk: at(13, 0.8), line: end(14, -0.2), hatch: end(20, 0.3),
};
