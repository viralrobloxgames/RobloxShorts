// Chapter 8: "The Worst" (FRIDAY 9:30 PM). Shot plan: production/shots/ch08.md. From web/ch_template.js.
// Hallway at Max's door (Skye with her confession note; Max inside on the phone: "Skye is the worst...") -> the attic at
// night: Skye in her nest, Lily climbs up in her pyjamas; the revenge plan; "Then why are you crying?"
// First frame = boundary "Start of Ch8"; last frame = "End of Ch8" (attic nest two-shot, Skye crying, Lily sad).
// Everything is a pure function of t.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 8;
const CARD = { day: 'FRIDAY', time: '9:30 PM' };
const EST = [
  { index: 0, speaker: 'VO', text: "Friday night. I decided to stop. I'd leave Max a note, tell him the truth, and go home.", start: 0.0, end: 6.4 },
  { index: 1, speaker: 'SKYE', note: 'whisper', text: "Dear Max. The ghost was me. Sorry. Also, your dad's pancakes are amazing.", start: 6.7, end: 12.3 },
  { index: 2, speaker: 'MAX', note: 'phone', text: 'Skye? Ask Skye to the dance?', start: 13.2, end: 15.2 },
  { index: 3, speaker: 'MAX', note: 'phone', text: "Okay. Don't tell anyone.", start: 15.5, end: 17.2 },
  { index: 4, speaker: 'MAX', note: 'phone', text: 'Skye is the worst...', start: 17.5, end: 19.0 },
  { index: 5, speaker: 'SKYE', note: 'whisper', text: 'The worst. Right. Got it.', start: 19.9, end: 22.0 },
  { index: 6, speaker: 'LILY', text: 'What happened? Did he see you?', start: 22.4, end: 24.4 },
  { index: 7, speaker: 'SKYE', text: "Worse. Your brother thinks I'm the worst.", start: 24.7, end: 27.2 },
  { index: 8, speaker: 'LILY', text: 'He said that?', start: 27.5, end: 28.4 },
  { index: 9, speaker: 'SKYE', text: 'Word for word. Skye is the worst.', start: 28.7, end: 31.0 },
  { index: 10, speaker: 'LILY', text: 'What came after?', start: 31.3, end: 32.4 },
  { index: 11, speaker: 'SKYE', text: "Nothing. I left. I didn't need to hear the rest.", start: 32.7, end: 35.8 },
  { index: 12, speaker: 'LILY', text: 'Max never says mean things about you. Only dumb things. Like how your laugh sounds like a goose.', start: 36.1, end: 41.6 },
  { index: 13, speaker: 'SKYE', text: "Tomorrow night, I'm doing the biggest haunting this house has ever seen. And I'm filming the whole thing.", start: 41.9, end: 47.4 },
  { index: 14, speaker: 'SKYE', text: 'On Monday, the whole class gets to watch Max scream.', start: 47.7, end: 50.6 },
  { index: 15, speaker: 'LILY', text: "You don't really want to do that.", start: 50.9, end: 52.6 },
  { index: 16, speaker: 'SKYE', text: 'Yes, I do.', start: 52.9, end: 53.8 },
  { index: 17, speaker: 'LILY', text: 'Then why are you crying?', start: 54.1, end: 55.5 },
  { index: 18, speaker: 'SKYE', text: "It's dusty. It's a really, really dusty attic.", start: 55.8, end: 59.0 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.8);
export const sky = K.SKY;
export const samples = () => 1;
const at = (line, off = 0) => L.line(line).start + off;
const endOf = (line, off = 0) => L.line(line).end + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (t, t0, t1) => smooth((t - t0) / (t1 - t0));

// key moments (on the narration)
const T = {
  crouch: endOf(1, 0.1),                 // she bends to slide the note under the door
  rise: endOf(4, 0.05),                  // she straightens up, backs away; the note crumples
  attic: endOf(5, 0.3),                  // cut to the attic
};

// ---------- marks (fallbacks are offsets from the set origin until the set defines the mark) ----------
const M = {
  door: () => K.mark('hallway', 'max_door_outside', { pos: V(0, 0, -6.5), heading: Math.PI }),
  doorCrouch: () => K.mark('hallway', 'max_door_crouch', { pos: V(0, 0, -6.8), heading: Math.PI }),
  doorBack: () => K.mark('hallway', 'max_door_back', { pos: V(0.6, 0, -3.8), heading: Math.PI }),
  bed: () => K.mark('bedroom', 'bed_sit', { pos: V(4, 0, -6), heading: 0.4 }),
  nest: () => K.mark('attic', 'nest'),
  beside: () => K.mark('attic', 'nest_beside'),
  hatchTop: () => K.mark('attic', 'hatch_top'),
  hatchClimb: () => K.mark('attic', 'hatch_climb'),
};

// ---------- setup ----------
let C, A, P = {}, ATTIC;
export async function setup(stage) {
  await K.buildSets(stage, ['hallway', 'bedroom', 'attic']);
  K.setState({ chapter: CH });
  ATTIC = K.getSet('attic');
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.lily, 'lily_pjs');
  A = await K.loadAnims(['idle', 'walk', 'sit', 'duck', 'horror_backstep', 'think']);
  P.note = K.makeProp('note'); stage.scene.add(P.note); K.hold(P.note, C.skye, 'R');
  P.phone = K.makeProp('phone'); stage.scene.add(P.phone); K.hold(P.phone, C.max, 'R', 'ear');
  P.teddy = K.makeProp('teddy'); stage.scene.add(P.teddy); K.hold(P.teddy, C.lily, 'L');
}

// ---------- the shot table ----------
const HALL = { set: 'hallway', light: 'night_moon', practicals: { door_glow: true, max_door_glow: true } };
const ROOM = { set: 'bedroom', light: 'night_moon', practicals: { bedside_lamp: true } };
const ATT = { set: 'attic', light: 'night_moon', practicals: { flashlight: true, flashlightCone: true } };
const TWO = (s) => { const a = K.headPos(C.skye), b = K.headPos(C.lily), m = a.clone().add(b).multiplyScalar(0.5); return K.applyShot(s, { pos: m.clone().add(V(-0.2, 0.9, 7.6)), target: m.clone().add(V(0, -0.5, 0)), fov: 38 }); };
const camA = (name) => (s) => K.setCam(s, ATTIC.cams[name]);
// attic singles: from the room side (+z), each cheated 3/4 toward the other (Lily is on Skye's left, frame-left)
const headCam = (who, off, fov, look = V(0, -0.25, 0)) => (s) => { const h = K.headPos(who()); return K.applyShot(s, { pos: h.clone().add(off), target: h.clone().add(look), fov }); };
const SKYE_MCU = headCam(() => C.skye, V(-0.6, 0.35, 5.2), 34), SKYE_CU = headCam(() => C.skye, V(-0.9, 0.25, 3.9), 30, V(0, -0.05, 0));
const LILY_MCU = headCam(() => C.lily, V(1.6, 0.15, 4.8), 34, V(0, -0.1, 0));
const SHOTS = [
  { line: 0, off: 0, id: 'door_ws', ...HALL, cam: (s, t) => K.applyShot(s, K.blendShot(K.camOn(s, C.skye, 'ws', { angle: 0.55, apply: false }), K.camOn(s, C.skye, 'ms', { angle: 0.5, apply: false }), smooth(t / endOf(0)))) },
  { line: 1, off: -0.1, id: 'note_mcu', ...HALL, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.6 }) },
  { line: 1, off: endOf(1) - at(1), id: 'crouch_side', ...HALL, cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 1.2, height: -0.6 }) },
  { line: 2, off: -0.1, id: 'max_phone', ...ROOM, cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.45 }) },
  { line: 4, off: -0.1, id: 'max_worst', ...ROOM, cam: (s) => K.camOn(s, C.max, 'ms', { angle: 0.45 }) },
  { line: 4, off: 0.9, id: 'skye_hears', ...HALL, cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.8 }) },
  { line: 4, off: endOf(4) - at(4) + 0.05, id: 'backs_away', ...HALL, cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.7 }) },
  { line: 5, off: -0.1, id: 'got_it', ...HALL, cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.6 }) },
  { line: 6, off: -0.35, id: 'lily_hatch', ...ATT, cam: camA('hatch_lily_cu') },
  { line: 7, off: -0.1, id: 'nest_ms', ...ATT, cam: camA('nest_ms') },
    { line: 8, off: -0.1, id: 'lily_said', ...ATT, cam: LILY_MCU },
  { line: 9, off: -0.1, id: 'skye_word', ...ATT, cam: SKYE_MCU },
  { line: 10, off: -0.1, id: 'lily_after', ...ATT, cam: LILY_MCU },
  { line: 11, off: -0.1, id: 'skye_left', ...ATT, cam: SKYE_MCU },
  { line: 12, off: -0.1, id: 'goose_two', ...ATT, cam: TWO },
  { line: 13, off: -0.1, id: 'plan', ...ATT, cam: (s, t) => { const h = K.headPos(C.skye), u = ramp(t, at(13), endOf(14)); return K.applyShot(s, { pos: h.clone().add(V(-0.6, 0.35, 5.2).lerp(V(-0.9, 0.25, 3.9), u)), target: h.clone().add(V(0, -0.25 + 0.2 * u, 0)), fov: 34 - 4 * u }); } },
  { line: 15, off: -0.1, id: 'lily_dont', ...ATT, cam: LILY_MCU },
  { line: 16, off: -0.1, id: 'skye_yes', ...ATT, cam: SKYE_CU },
  { line: 17, off: -0.1, id: 'lily_crying', ...ATT, cam: LILY_MCU },
  { line: 18, off: -0.1, id: 'end_two', ...ATT, cam: TWO },
].map((x) => ({ ...x, start: x.line === 0 && x.off === 0 ? -1 : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- arm helpers (override after playAnim) ----------
const _e = new THREE.Euler();
function arm(actor, side, x, z = 0) { _e.set(x, 0, side === 'L' ? z : -z, 'XYZ'); actor.bones[side === 'L' ? 'Arm.L' : 'Arm.R'].quaternion.setFromEuler(_e); }

// Floor sitting: root height so the seat is on the floor (attic floor y 0 at the mark).
const floorSit = (m, actor) => ({ pos: m.pos.clone().add(V(0, -2 * actor.scale + 0.25 * actor.scale, 0)), heading: m.heading });

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.applyLight(stage, sh.light, { set, practicals: sh.practicals });
  const idle = K.holdClock(t, L);

  if (sh.set === 'hallway') {
    K.only(C, ['skye']);
    K.setBlockers(set.group);
    const crouchK = t < T.rise ? ramp(t, T.crouch, T.crouch + 0.4) : 1 - ramp(t, T.rise, T.rise + 0.35);
    if (t < T.rise + 0.35) {
      K.playAnim(C.skye, crouchK > 0.01 ? [[A.idle, idle], [A.duck, 0.6, crouchK, false]] : [[A.idle, idle]]);
      K.putOn(C.skye, M.door());
      // note: in her palm at chest height (reading it on line 1), low toward the gap while crouched
      const read = t > at(1) - 0.2 && t < endOf(1) ? 1 : 0.35;
      arm(C.skye, 'R', crouchK > 0.5 ? 1.2 : 0.4 + 0.7 * read, 0.15);
    } else {
      // backs away along the hall: a real backward walk (backstep) over the distance, facing the door
      const from = M.door(), to = M.doorBack(), d = from.pos.distanceTo(to.pos);
      const u = clamp((t - T.rise - 0.35) * 4 / d);
      K.playAnim(C.skye, u < 1 ? [[A.horror_backstep, u * d / 4]] : [[A.idle, idle]]);
      K.putOn(C.skye, { pos: from.pos.clone().lerp(to.pos, smooth(u)), heading: from.heading });
      arm(C.skye, 'R', 0.15, 0.1);                     // fist down by her side, the note crumpled in it
    }
    P.note.userData.state = t >= T.rise + 0.15 ? 'crumpled' : 'folded';
    P.note.visible = true;
    const face = t < at(1) ? (t > at(0) + 4.5 ? 'sad' : 'nervous') : t < endOf(1) ? (t > endOf(1) - 1.6 ? 'happy' : 'nervous')
      : t < T.crouch + 0.5 ? 'nervous' : t < T.rise ? 'shocked' : t < at(5) ? 'sad' : (t > endOf(5) - 0.7 ? 'annoyed' : 'sad');
    K.speak(C.skye, face, t, L.said('SKYE'));
  } else if (sh.set === 'bedroom') {
    K.only(C, ['max']);
    K.setBlockers(set.group);
    K.playAnim(C.max, [[A.sit, 0, 1, false], [A.idle, idle, 0.3]]);
    const b = M.bed(); K.putOn(C.max, { pos: b.pos.clone().add(V(0, 1.5 - 2 * C.max.scale + 0.4, 0)), heading: b.heading }, { sit: true });
    arm(C.max, 'R', 2.5, 0.35);                         // phone at his right ear
    P.phone.visible = true;
    const face = t < at(2) + 0.6 ? 'surprised' : t < at(3) ? 'happy' : t < at(3) + 0.9 ? 'nervous' : 'happy';
    K.speak(C.max, face, t, L.said('MAX'));
  } else {
    K.only(C, ['skye', 'lily']);
    K.setState({ chapter: CH });
    K.setBlockers(set.group);
    K.setLine(C.skye, C.lily, 1);
    // Skye in the nest
    K.playAnim(C.skye, [[A.sit, 0, 1, false], [A.idle, idle, 0.25]]);
    K.putOn(C.skye, floorSit(M.nest(), C.skye), { sit: true, heading: -0.25 });
    const wipe = ramp(t, at(18) + 0.2, at(18) + 0.6) * (1 - ramp(t, endOf(18) - 0.6, endOf(18) - 0.2));
    if (wipe > 0) arm(C.skye, 'L', 2.2 * wipe + 0.3, 0.35 * wipe);
    arm(C.skye, 'R', t > at(13) && t < endOf(13) ? 0.9 + 0.2 * Math.sin((t - at(13)) * 2) : 0.6, 0.1);
    P.note.userData.state = 'crumpled'; P.note.visible = true;
    const sf = t < at(7) ? 'sad' : t < at(9) ? 'sad' : t < at(11) ? 'annoyed' : t < at(12) + 3.5 ? 'sad'
      : t < at(13) ? 'annoyed' : t < at(14) ? 'determined' : t < at(15) ? 'scheming' : t < at(18) ? 'determined' : 'crying';
    K.speak(C.skye, sf, t, L.said('SKYE'));

    // Lily: up through the hatch (line 6), walks to the nest (line 7), sits beside Skye
    // head and shoulders up through the hatch for line 6, then climbs out and walks to the nest
    const climb = M.hatchClimb(), top = M.hatchTop(), side = M.beside();
    const rise = ramp(t, T.attic, at(6) + 0.2) * 0.4 + ramp(t, endOf(6) + 0.1, endOf(6) + 0.7) * 0.6;
    const walkT0 = endOf(6) + 0.75, dWalk = top.pos.distanceTo(side.pos), arrive = walkT0 + dWalk / 12;
    if (t < walkT0) {
      K.playAnim(C.lily, [[A.idle, idle + 0.5]]);
      const y = ATTIC.hatchRise(C.lily.scale, rise);
      const p = climb.pos.clone().lerp(top.pos, ramp(t, endOf(6) + 0.4, walkT0)).setY(climb.pos.y + y);
      K.putOn(C.lily, { pos: p, heading: climb.heading }, { sit: true });
    } else if (t < arrive) {
      K.walk(C.lily, A, top, side, walkT0, t);
    } else {
      K.playAnim(C.lily, [[A.sit, 0, 1, false], [A.idle, idle + 0.5, 0.25]]);
      K.putOn(C.lily, floorSit(side, C.lily), { sit: true, heading: 0.6 });
    }
    arm(C.lily, 'L', 0.5, 0.15);                         // teddy in her left hand
    P.teddy.visible = true;
    const lf = t < at(8) ? 'nervous' : t < at(10) ? 'surprised' : t < at(12) ? 'suspicious'
      : t < at(12) + 4.2 ? 'neutral' : t < at(13) ? 'smug' : t < at(15) ? 'sad' : 'sad';
    K.speak(C.lily, lf, t, L.said('LILY'));
  }
  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}
