// Ch3 "A Useful Ghost" (TUESDAY 11:52 PM): the dark kitchen lit by the open fridge. Skye spells BE NICE 2 SKYE with
// Lily's magnet letters, hides in the pantry; Max comes down for milk, reads it, agrees, leaves the ghost a crustless
// ham sandwich; Skye takes it; Dad's midnight snack ("Who's Skye?" / "Nobody!"); Dad leaves with the ham.
// Shot plan: production/shots/ch03.md. Boundary: Start of Ch3 / End of Ch3 in source/boundary_sheet.md.
// Everything is a pure function of t.
import * as THREE from 'three';
import * as K from './kit/index.js';
import { travel } from '../../../web/lib/locomotion.js';

// ---------- CHAPTER ----------
const CH = 3;
const CARD = { day: 'TUESDAY', time: '11:52 PM' };
// Estimated lines (index as lines.json) until audio/chapters/ch03/lines.json lands: ~2.5 words/s, 0.25 s between
// lines plus the script's [+N] pauses (before the line they precede).
const SCRIPT = [
  ['VO', '', "Tuesday night. If I was going to be a ghost, I was going to be a useful one."],
  ['SKYE', 'whisper', "Lily's fridge letters. Perfect."],
  ['SKYE', 'whisper', 'Be. Nice. To. Skye.', 0, 3.0],
  ['MAX', '', "Hello? Ghost? I just want some milk. Please don't eat me.", 0.6],
  ['MAX', '', "And if you're a vampire, we've got garlic."],
  ['MAX', '', 'Be nice to Skye?', 0.8],
  ['MAX', '', "Okay, ghost. That's weirdly specific."],
  ['SKYE', 'whisper', 'Be scared. Be very scared.'],
  ['MAX', '', "Fine. Deal. I'll be nice to Skye. But only because you asked."],
  ['MAX', '', 'Not because I... Never mind. Who even is Skye? I mean, I know who Skye is. Obviously.'],
  ['MAX', '', 'There. One sandwich, for the ghost. Please stay out of my closet.', 1.0],
  ['SKYE', '', 'He cut the crusts off.', 0.6],
  ['SKYE', '', "Max made the ghost a sandwich. He's so scared, he's feeding it."],
  ['DAD', '', 'Midnight snack, midnight snack, who wants a midnight snack?', 0.6],
  ['DAD', '', "Be nice to Skye? Who's Skye?"],
  ['MAX', 'offscreen', 'Nobody! Go to bed, Dad!'],
  ['DAD', '', "And who's been at my ham?"],
  ['DAD', '', "Lily, if that's you, I'm not angry. I'm just hungry."],
  ['SKYE', 'whisper', 'Best. Haunting. Ever.', 0.8, 2.0],
];
const EST = []; {
  let t = 0;
  SCRIPT.forEach(([speaker, note, text, pause = 0, dur], index) => {
    t += (index ? 0.25 : 0) + pause;
    const d = dur ?? text.split(/\s+/).length / 2.5;
    EST.push({ index, speaker, note, text, start: t, end: t + d }); t += d;
  });
}
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.8);
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const at = (i, off = 0) => L.line(i).start + off;
const endOf = (i, off = 0) => L.line(i).end + off;
const inv = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (u) => u * u * (3 - 2 * u);
const word = (i, k) => { const l = L.line(i), ws = L.words.filter((w) => w.speaker === l.speaker && w.start >= l.start - 0.05 && w.end <= l.end + 0.05); return ws[Math.min(k, ws.length - 1)] || { start: l.start, end: l.end }; };

// ---------- marks (kitchen; fallbacks are offsets from the kitchen origin, used until kit-sets-c has the mark) ----------
const PI = Math.PI;
const M = {
  fridge: () => K.mark('kitchen', 'fridge', { pos: V(-7, 0, 8), heading: 0 }),
  pantryIn: () => K.mark('kitchen', 'pantry_inside', { pos: V(-1.5, 0, 11), heading: PI }),
  pantryGap: () => K.mark('kitchen', 'pantry_gap', { pos: V(-1.5, 0, 10.2), heading: PI - 0.5 }),
  counter: () => K.mark('kitchen', 'island_counter', { pos: V(1, 0, 3.6), heading: PI }),
  pickup: () => K.mark('kitchen', 'island_pickup', { pos: V(-4.2, 0, 1.6), heading: PI / 2 }),
  crouch: () => K.mark('kitchen', 'island_crouch', { pos: V(-0.5, 0, -1.4), heading: PI + 0.6 }),
  stairsBottom: () => K.mark('kitchen', 'stairs_bottom', { pos: V(8, 0, 6), heading: -PI / 2 }),
  stairsExit: () => K.mark('kitchen', 'stairs_exit', { pos: V(10.5, 5, 12), heading: 0 }),
  plate: () => K.mark('kitchen', 'island_plate', { pos: V(0.5, 3.1, 1.8), heading: 0 }),
};
const mk = {}; const m = (k) => (mk[k] ||= M[k]());

// ---------- key times ----------
const T = {};
function times() {
  T.reach1 = 0.5; T.reach2 = 2.0;                                         // C, then E go up during the VO
  T.letters = [word(2, 0).start, word(2, 1).start, word(2, 2).start, word(2, 3).start]; // BE / NICE / 2 / SKYE land
  T.freeze = endOf(2, 0.05); T.shut1 = T.freeze + 0.25; T.dive = T.shut1 + 0.2;
  T.maxIn = at(3, -1.0);                                                  // Max appears at the top of the stairs
  T.open2 = endOf(4, 0.1); T.read = T.open2 + 0.4;
  T.toCounter = endOf(8, 0.15); T.shut2 = T.toCounter;                    // takes bread + ham, shuts the fridge, to the island
  T.make0 = at(9, 0.9); T.make1 = endOf(9, 0.9);                          // sandwich hands (during "Never mind..." + the [+1.0])
  T.plateOut = at(10, 0.3);
  T.maxOut = endOf(10, -0.4);
  T.creep = endOf(10, 0.35); T.grab = at(11, 0.55);
  T.duck = endOf(12, 0.08); T.dadIn = endOf(12, 0.25);
  T.open3 = at(13, 2.2);
  T.lookUp = at(15, 0.05);
  T.ham = at(16, 0.1); T.bite = endOf(16, 0.05);
  T.shut3 = endOf(17, -0.5); T.dadOut = endOf(17, 0.05);
  T.exhale = at(18, -0.55);
}

// ---------- setup ----------
let C, A, P = {}, beam, set;
export async function setup(stage) {
  await K.buildSets(stage, ['kitchen']);
  K.setState({ chapter: 3, letters: 'BE NI', fridgeOpen: 1, pantryDoor: 0 });
  set = K.getSet('kitchen');
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.dad, 'dad_robe');
  A = await K.loadAnims(['idle', 'walk', 'run', 'duck', 'horror_reach', 'horror_listen', 'horror_torch_hold', 'typing', 'think', 'shrug', 'look_up', 'talk', 'scheming', 'hold']);
  const add = (k, id, o) => { P[k] = K.makeProp(id, o); stage.scene.add(P[k]); return P[k]; };
  add('letters', 'magnet_letters'); add('torch', 'flashlight'); add('knife', 'butter_knife');
  add('sandwich', 'sandwich_crustless'); add('bitten', 'sandwich_crustless', { bitten: true }); add('plate', 'plate');
  add('ham', 'ham'); add('bread', 'bread');
  beam = K.flashlightBeam(stage);
  times();
}

// ---------- shots ----------
// Cameras stay on the island side of the fridge <-> island line (fridge frame left).
const cu = (who, o = {}) => (s) => K.camOn(s, C[who], 'cu', { angle: 0.55, ...o });
const mcu = (who, o = {}) => (s) => K.camOn(s, C[who], 'mcu', { angle: 0.55, ...o });
const ms = (who, o = {}) => (s) => K.camOn(s, C[who], 'ms', { angle: 0.6, ...o });
const named = (id, fb) => (s, t) => (set.cams[id] ? K.setCam(s, set.cams[id]) : fb(s, t));
const wide = named('kitchen_wide', (s) => K.setCam(s, { pos: m('fridge').pos.clone().lerp(m('stairsBottom').pos, 0.5).add(V(0, 7.5, -19)), target: m('fridge').pos.clone().lerp(m('stairsBottom').pos, 0.5).add(V(0, 2.4, 2)), fov: 42 }));
const lettersCam = (who) => named('fridge_letters', (s) => K.overShoulder(s, C[who], C[who], 'cu', { apply: true }));
const opening = (s, t) => {
  const a = K.camOn(s, C.skye, 'ms', { angle: 0.75, apply: false, look: V(0, 0.55, 0) }), b = K.camOn(s, C.skye, 'mcu', { angle: 0.7, apply: false, look: V(0, 0.4, 0) });
  return K.applyShot(s, K.blendShot(a, b, sm(inv(0, at(1), t))));
};
const lowBehind = named('island_low_behind', (s) => K.camOn(s, C.skye, 'ms', { angle: 0.5, height: -0.6, fov: 40 }));
const SHOTS = [
  { at: () => 0, id: 'open', cam: opening },
  { at: () => at(1), id: 'skye_letters', cam: mcu('skye') },
  { at: () => at(2), id: 'letters_insert', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 1.1, look: V(0, 0.2, 0) }) },
  { at: () => T.freeze, id: 'wide_dive', cam: wide },
  { at: () => at(3, -0.1), id: 'max_stairs', cam: ms('max', { angle: 0.4 }) },
  { at: () => at(4), id: 'skye_gap', cam: cu('skye', { angle: 0.3 }) },
  { at: () => T.open2, id: 'max_fridge', cam: ms('max', { angle: 0.75 }) },
  { at: () => at(5), id: 'max_reads', cam: mcu('max', { angle: 0.9 }) },
  { at: () => at(6), id: 'max_mcu', cam: mcu('max') },
  { at: () => at(7), id: 'skye_gap2', cam: cu('skye', { angle: 0.3 }) },
  { at: () => at(8), id: 'max_deal', cam: mcu('max') },
  { at: () => T.toCounter, id: 'max_counter', cam: ms('max', { angle: 0.3 }) },
  { at: () => word(9, 3).start, id: 'skye_react', cam: cu('skye', { angle: 0.3 }) },
  { at: () => word(9, 6).start, id: 'max_sandwich', cam: ms('max', { angle: 0.3 }) },
  { at: () => at(10), id: 'max_plate', cam: mcu('max', { angle: 0.3 }) },
  { at: () => T.maxOut, id: 'wide_swap', cam: wide },
  { at: () => at(11, 0.1), id: 'skye_crusts', cam: mcu('skye', { angle: 0.7 }) },
  { at: () => at(12), id: 'skye_smug', cam: ms('skye', { angle: 0.7 }) },
  { at: () => T.duck - 0.05, id: 'wide_dad', cam: wide },
  { at: () => at(13, 1.6), id: 'dad_snack', cam: ms('dad', { angle: 0.6 }) },
  { at: () => at(14), id: 'dad_reads', cam: mcu('dad', { angle: 0.85 }) },
  { at: () => at(15), id: 'dad_up', cam: mcu('dad', { angle: 0.5 }) },
  { at: () => at(16), id: 'dad_ham', cam: ms('dad', { angle: 0.5 }) },
  { at: () => T.bite, id: 'skye_chew', cam: cu('skye', { angle: 0.4, height: -0.2 }) },
  { at: () => at(17), id: 'dad_hungry', cam: ms('dad', { angle: 0.5 }) },
  { at: () => T.dadOut, id: 'low_behind', cam: lowBehind },
];
let SH = null;
const shotAt = (t) => { SH ||= SHOTS.map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start); let s = SH[0]; for (const x of SH) if (t >= x.start) s = x; return s; };

// ---------- helpers ----------
// A multi-leg walk through marks/points from t0: returns { pos, heading, moving, anim, done, arrive }.
function route(pts, t0, t, speed = 12) {
  let tt = t0, lastH = pts[0].heading ?? 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i].pos || pts[i], b = pts[i + 1].pos || pts[i + 1];
    const tr = travel(a, b, tt, t, speed);
    if (!tr.done || i === pts.length - 2) return { ...tr, heading: tr.moving || tr.done ? tr.heading : lastH, arrive: tr.arrive };
    lastH = tr.heading; tt = tr.arrive;
  }
}
function pose(actor, m0, layers, opts = {}) { K.playAnim(actor, layers); K.putOn(actor, m0, opts); }
const walkLayer = (r, speed = 12) => (r.moving ? [[speed >= 14 ? A.run : A.walk, r.anim]] : null);
// the letters on the door at time t
function lettersAt(t) {
  let s = 'BE NI';
  if (t >= T.reach1 + 0.5) s = 'BE NIC';
  if (t >= T.reach2 + 0.5) s = 'BE NICE';
  if (t >= T.letters[2]) s = 'BE NICE 2';
  if (t >= T.letters[3]) s = 'BE NICE 2 S';
  if (t >= T.letters[3] + 0.18) s = 'BE NICE 2 SK';
  if (t >= T.letters[3] + 0.32) s = 'BE NICE 2 SKY';
  if (t >= T.letters[3] + 0.45) s = 'BE NICE 2 SKYE';
  return s;
}
const ramp = (t, open, shut) => (open === null ? 0 : sm(inv(open, open + 0.35, t))) * (shut === null ? 1 : 1 - sm(inv(shut, shut + 0.3, t)));
function fridgeAt(t) { return Math.max(ramp(t, -1, T.shut1), ramp(t, T.open2, T.shut2), ramp(t, T.open3, T.shut3)); }
function pantryAt(t) { // closed -> open as she dives -> ajar while she peeks -> open as she creeps out -> ajar
  if (t < T.dive) return 0;
  if (t < T.dive + 0.6) return 1 - 0.65 * sm(inv(T.dive + 0.3, T.dive + 0.6, t));
  if (t < T.creep) return 0.35;
  return 0.35 + 0.5 * sm(inv(T.creep, T.creep + 0.3, t));
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  set = K.showSet('kitchen');
  const fo = fridgeAt(t);
  K.setState({ chapter: 3, letters: lettersAt(t), fridgeOpen: fo, pantryDoor: pantryAt(t), plate: t >= T.plateOut ? 'on_counter' : null });
  K.applyLight(stage, 'night_fridge', { set, practicals: { fridge_light: fo } });
  const idle = K.holdClock(t, L, [[T.maxIn, T.maxIn + 2.5], [T.dadIn, T.dadIn + 3]]);
  const vis = ['skye'];
  if (t >= T.maxIn && t < T.maxOut + 1.6) vis.push('max');
  if (t >= T.dadIn && t < T.dadOut + 3) vis.push('dad');
  K.only(C, vis);
  K.setBlockers(set.group, ...vis.map((k) => C[k]));
  K.setLine(m('fridge').pos.clone().add(V(0, 4.6, 0)), m('counter').pos.clone().add(V(0, 4.6, 0)), 1);
  for (const p of Object.values(P)) p.visible = false;

  // ----- Skye -----
  const sk = C.skye;
  let skFace = 'scheming';
  if (t < T.freeze) {                                    // at the fridge placing letters
    const reach = (t0) => Math.sin(PI * inv(t0, t0 + 1.0, t));
    const r = Math.max(reach(T.reach1), reach(T.reach2), ...T.letters.map((x) => reach(x - 0.35)));
    pose(sk, m('fridge'), [[A.idle, idle], [A.horror_reach, 1.0, r * 2]], { heading: m('fridge').heading - 0.35 });
    P.letters.visible = true; K.hold(P.letters, sk, 'L');
  } else if (t < T.creep) {                              // freeze, shut the fridge, dive into the pantry, peek
    skFace = 'scared';
    if (t < T.dive) pose(sk, m('fridge'), [[A.horror_listen, (t - T.freeze) * 2]], { heading: m('fridge').heading + 0.9 });
    else {
      const r = route([m('fridge'), m('pantryIn'), m('pantryGap')], T.dive, t, 16);
      if (r.moving) pose(sk, { pos: r.pos }, walkLayer(r, 16), { heading: r.heading });
      else pose(sk, m('pantryGap'), [[A.idle, idle]]);
      if (t > at(4, 0.3)) skFace = t < at(5) ? 'smug' : t < at(9) ? 'scheming' : 'surprised';
    }
  } else if (t < T.duck) {                               // creep out, take the sandwich
    skFace = t < at(12) ? 'surprised' : 'smug';
    const r = route([m('pantryGap'), m('pickup')], T.creep, t, 10);
    if (r.moving) pose(sk, { pos: r.pos }, walkLayer(r), { heading: r.heading });
    else pose(sk, m('pickup'), [[A.idle, idle], [A.hold, 0.3, t > T.grab ? 1 : 0]], { heading: K.faceTo(m('pickup'), m('stairsBottom')) + 0.4 });
    if (t >= T.grab) { P.sandwich.visible = true; K.hold(P.sandwich, sk, 'R'); }
  } else {                                               // duck behind the island
    const r = route([m('pickup'), m('crouch')], T.duck, t, 14);
    const dk = sm(inv(r.arrive - 0.05, r.arrive + 0.2, t));
    if (r.moving) pose(sk, { pos: r.pos }, walkLayer(r, 14), { heading: r.heading });
    else pose(sk, m('crouch'), [[A.duck, 0.25, 1], [A.hold, 0.3, 0.6]]);
    skFace = t < T.bite ? 'scared' : t < T.exhale ? 'scared' : 'happy';
    const s = t >= T.bite ? P.bitten : P.sandwich; s.visible = true; K.hold(s, sk, 'R');
    void dk;
  }
  K.speak(sk, skFace, t, L.said('SKYE'));

  // ----- Max -----
  const mx = C.max;
  if (vis.includes('max')) {
    let mxFace = 'scared';
    P.torch.visible = true;
    if (t < T.toCounter) {
      const r = route([m('stairsExit'), m('stairsBottom'), m('fridge')], T.maxIn, t, 12);
      if (r.moving) pose(mx, { pos: r.pos }, walkLayer(r).concat([[A.horror_torch_hold, 0.5, 0.5]]), { heading: r.heading });
      else {
        const lean = sm(inv(T.read, T.read + 0.5, t)) * (1 - sm(inv(at(6, 0.2), at(6, 0.6), t)));
        const turn = t > at(6, 0.3) ? 0.7 : 0;           // turns 3/4 to the room to talk to the ghost
        const layers = [[A.idle, idle], [A.horror_torch_hold, 0.5, 0.6]];
        if (t > at(8) && t < at(8, 0.7)) layers.push([A.shrug, (t - at(8)), 1.2]);
        pose(mx, m('fridge'), layers, { heading: m('fridge').heading + turn });
        mx.root.position.addScaledVector(V(Math.sin(m('fridge').heading), 0, Math.cos(m('fridge').heading)), 0.35 * lean);
      }
      mxFace = t < T.open2 ? (t < at(4) ? 'scared' : 'nervous') : t < at(5) ? 'surprised' : t < at(8) ? 'suspicious' : 'nervous';
      K.hold(P.torch, mx, 'R');
    } else if (t < T.maxOut) {                           // the island: makes the sandwich, slides the plate out
      const r = route([m('fridge'), m('counter')], T.toCounter, t, 12);
      if (r.moving) { pose(mx, { pos: r.pos }, walkLayer(r), { heading: r.heading }); P.bread.visible = true; K.hold(P.bread, mx, 'L'); P.ham.visible = true; K.hold(P.ham, mx, 'R'); }
      else {
        const making = t >= T.make0 && t < T.make1;
        const layers = [[A.idle, idle]];
        if (making) layers.push([A.typing, t - T.make0, 1.5]); else if (t < T.make0) layers.push([A.think, 0.4, 0.8]);
        pose(mx, m('counter'), layers);
        if (making) { P.knife.visible = true; K.hold(P.knife, mx, 'R'); }
        if (t >= T.make0 && t < T.plateOut) { const p = m('plate').pos.clone().add(V(0.3, 0, 1.2)); P.plate.visible = true; P.plate.position.copy(p); P.sandwich.visible = t >= T.make0 + 0.4; P.sandwich.position.copy(p).add(V(0, 0.12, 0)); P.sandwich.rotation.set(0, 0, 0); }
      }
      mxFace = t < at(9, 1.2) ? 'nervous' : t < at(10) ? 'annoyed' : 'nervous';
      P.torch.position.copy(m('plate').pos).add(V(2.2, 0.1, 0.6)); P.torch.rotation.set(0, 0, PI / 2);
    } else {                                             // back upstairs
      const r = route([m('counter'), m('stairsBottom'), m('stairsExit')], T.maxOut, t, 12);
      pose(mx, { pos: r.pos }, walkLayer(r) || [[A.idle, idle]], { heading: r.heading });
      mxFace = 'nervous'; K.hold(P.torch, mx, 'R');
      if (r.done) mx.root.visible = false;
    }
    K.speak(mx, mxFace, t, L.said('MAX').filter((w) => w.start < T.maxOut + 1));
    if (P.torch.visible && mx.root.visible && t < T.toCounter) {
      const from = new THREE.Vector3(); P.torch.getWorldPosition(from); const h = mx.root.rotation.y;
      beam.set(true, from, V(Math.sin(h), -0.15, Math.cos(h)));
    } else beam.set(false);
  } else beam.set(false);

  // the plate (and the sandwich) on the counter once Max has made it
  if (t >= T.plateOut) {
    P.plate.visible = true; P.plate.position.copy(m('plate').pos); P.plate.rotation.set(0, 0, 0);
    if (t < T.grab) { P.sandwich.visible = true; P.sandwich.position.copy(m('plate').pos).add(V(0, 0.12, 0)); P.sandwich.rotation.set(0, 0, 0); }
  }

  // ----- Dad -----
  const dd = C.dad;
  if (vis.includes('dad')) {
    let ddFace = 'happy';
    if (t < T.dadOut) {
      const r = route([m('stairsExit'), m('stairsBottom'), m('fridge')], T.dadIn, t, 8);
      if (r.moving) pose(dd, { pos: r.pos }, walkLayer(r, 8), { heading: r.heading });
      else {
        const layers = [[A.idle, idle]];
        if (t >= T.lookUp && t < at(16)) layers.push([A.look_up, 0.4, 1.5]);
        pose(dd, m('fridge'), layers, { heading: m('fridge').heading + (t > at(14, 1.2) ? 0.7 : 0.2) });
      }
      ddFace = t < at(14) ? 'happy' : t < T.lookUp ? 'suspicious' : t < at(16) ? 'surprised' : t < at(17) ? 'annoyed' : 'sad';
      if (t >= T.ham) { P.ham.visible = true; K.hold(P.ham, dd, 'R'); }
    } else {
      const r = route([m('fridge'), m('stairsBottom'), m('stairsExit')], T.dadOut, t, 8);
      pose(dd, { pos: r.pos }, walkLayer(r, 8) || [[A.idle, idle]], { heading: r.heading });
      P.ham.visible = true; K.hold(P.ham, dd, 'R');
      if (r.done) dd.root.visible = false;
    }
    K.speak(dd, ddFace, t, L.said('DAD'));
  }

  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }
