// Chapter 8: "The Worst" (FRIDAY 9:30 PM). Shot plan: production/shots/ch08.md. From web/ch_template.js.
// Hallway at Max's door (Skye with her confession note; Max inside on the phone: "Skye is the worst...") -> the attic at
// night: Skye in her nest, Lily climbs up in her pyjamas; the revenge plan; "Then why are you crying?"
// First frame = boundary "Start of Ch8"; last frame = "End of Ch8" (attic nest two-shot, Skye crying, Lily sad).
// Everything is a pure function of t.
// The cast comes from the Roblox pack via the kit (web/lib/robloxPack.js), so fit_check.mjs checks this clip's accessories.
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 8;
const CARD = { day: 'FRIDAY', time: '9:30 PM' };
const EST = [
  { index: 1, speaker: 'VO', text: "Friday night. I decided to stop. I'd leave Max a note, tell him the truth, and go home.", start: 0.0, end: 6.4 },
  { index: 2, speaker: 'SKYE', note: 'whisper', text: "Dear Max. The ghost was me. Sorry. Also, your dad's pancakes are amazing.", start: 6.7, end: 12.3 },
  { index: 3, speaker: 'MAX', note: 'phone', text: 'Skye? Ask Skye to the dance?', start: 13.2, end: 15.2 },
  { index: 4, speaker: 'MAX', note: 'phone', text: "Okay. Don't tell anyone.", start: 15.5, end: 17.2 },
  { index: 5, speaker: 'MAX', note: 'phone', text: 'Skye is the worst...', start: 17.5, end: 19.0 },
  { index: 6, speaker: 'SKYE', note: 'whisper', text: 'The worst. Right. Got it.', start: 19.9, end: 22.0 },
  { index: 7, speaker: 'LILY', text: 'What happened? Did he see you?', start: 22.4, end: 24.4 },
  { index: 8, speaker: 'SKYE', text: "Worse. Your brother thinks I'm the worst.", start: 24.7, end: 27.2 },
  { index: 9, speaker: 'LILY', text: 'He said that?', start: 27.5, end: 28.4 },
  { index: 10, speaker: 'SKYE', text: 'Word for word. Skye is the worst.', start: 28.7, end: 31.0 },
  { index: 11, speaker: 'LILY', text: 'What came after?', start: 31.3, end: 32.4 },
  { index: 12, speaker: 'SKYE', text: "Nothing. I left. I didn't need to hear the rest.", start: 32.7, end: 35.8 },
  { index: 13, speaker: 'LILY', text: 'Max never says mean things about you. Only dumb things. Like how your laugh sounds like a goose.', start: 36.1, end: 41.6 },
  { index: 14, speaker: 'SKYE', text: "Tomorrow night, I'm doing the biggest haunting this house has ever seen. And I'm filming the whole thing.", start: 41.9, end: 47.4 },
  { index: 15, speaker: 'SKYE', text: 'On Monday, the whole class gets to watch Max scream.', start: 47.7, end: 50.6 },
  { index: 16, speaker: 'LILY', text: "You don't really want to do that.", start: 50.9, end: 52.6 },
  { index: 17, speaker: 'SKYE', text: 'Yes, I do.', start: 52.9, end: 53.8 },
  { index: 18, speaker: 'LILY', text: 'Then why are you crying?', start: 54.1, end: 55.5 },
  { index: 19, speaker: 'SKYE', text: "It's dusty. It's a really, really dusty attic.", start: 55.8, end: 59.0 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.lines[L.lines.length - 1].end + 0.8);   // last line + 0.8 s room tone
export const sky = K.SKY;
export const samples = () => 1;
// lines.json numbers spoken lines from 1; the code below counts them from 0 (line 0 = the VO)
const at = (line, off = 0) => L.line(line + 1).start + off;
export const lineStart = (i) => L.line(i + 1).start;
const endOf = (line, off = 0) => L.line(line + 1).end + off;
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
  // Skye beside Max's door (x -9), cheated 3/4 toward the camera side, reading her note
  door: () => { const m = K.mark('hallway', 'max_door'); return { pos: m.pos.clone().add(V(1.1, 0, -0.1)), heading: 1.2 }; },
  // kneeling at the door gap, turned toward the camera side so the face reads
  doorKneel: () => { const m = K.mark('hallway', 'max_door_kneel'); return { pos: m.pos.clone().add(V(0.5, 0, 0)), heading: 2.3 }; },
  doorStep: () => { const m = K.mark('hallway', 'max_door_kneel'); return { pos: m.pos.clone().add(V(1.1, 0, 1.0)), heading: 2.3 }; },
  doorBack: () => { const m = K.mark('hallway', 'max_door_back'); return { pos: m.pos.clone().add(V(1.4, 0, -0.6)), heading: 1.6 }; },
  bed: () => K.mark('bedroom', 'bed_edge'),
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
  P.note = K.makeProp('note', { state: 'folded' }); stage.scene.add(P.note);
  P.crumpled = K.makeProp('note', { state: 'crumpled' }); stage.scene.add(P.crumpled);
  P.phone = K.makeProp('phone', { screen: 'call' }); stage.scene.add(P.phone);
  K.holdTeddy(C.lily, 'L');
}

// ---------- the shot table ----------
const HALL = { set: 'hallway', light: 'night_moon', practicals: { moon_window: true, under_door: true, nightlight: true, ceiling_light: 0.3 } };
const ROOM = { set: 'bedroom', light: 'night_moon', practicals: { bedside_lamp: true, moon_window: true } };
const ATT = { set: 'attic', light: 'night_moon', practicals: { moon: true, bounce: true, flashlight: true, flashlightCone: true, hatchGlow: true } };
const camS = (name) => (s) => K.setCam(s, K.getSet(SHOTSET[name] || 'hallway').cams[name]);
const SHOTSET = { bed_edge_ms: 'bedroom' };
const TWO = (s) => { const a = K.headPos(C.skye), b = K.headPos(C.lily), m = a.clone().add(b).multiplyScalar(0.5); return K.applyShot(s, { pos: m.clone().add(V(0.4, 0.5, 7.4)), target: m.clone().add(V(-0.2, -1.1, 0)), fov: 36 }); };
const camA = (name) => (s) => K.setCam(s, ATTIC.cams[name]);
// attic singles: from the room side (+z), each cheated 3/4 toward the other (Lily is on Skye's left, frame-left)
const headCam = (who, off, fov, look = V(0, -0.25, 0)) => (s) => { const h = K.headPos(who()); return K.applyShot(s, { pos: h.clone().add(off), target: h.clone().add(look), fov }); };
const SKYE_MCU = headCam(() => C.skye, V(0.5, 0.35, 5.2), 34), SKYE_CU = headCam(() => C.skye, V(0.4, 0.25, 3.9), 30, V(0, -0.05, 0));
const LILY_MCU = headCam(() => C.lily, V(-0.2, 0.3, 4.4), 28, V(0, -0.15, 0));
const SHOTS = [
  { line: 0, off: 0, id: 'door_ws', ...HALL, cam: (s, t) => K.applyShot(s, K.blendShot(K.getSet('hallway').cams.wide_to_max_door, { pos: K.headPos(C.skye).add(V(4.6, 0.6, 5.0)), target: K.headPos(C.skye).add(V(0, -0.9, 0)), fov: 38 }, smooth((t - 0.3) / (endOf(0) - 0.3)))) },
  { line: 1, off: -0.1, id: 'note_mcu', ...HALL, cam: headCam(() => C.skye, V(3.4, 0.3, 3.2), 34, V(0, -0.6, 0)) },
  { line: 1, off: endOf(1) - at(1), id: 'kneel', ...HALL, cam: headCam(() => C.skye, V(3.6, 0.0, 0.6), 42, V(-0.9, -1.3, -0.8)) },
  { line: 2, off: -0.1, id: 'max_phone', ...ROOM, cam: headCam(() => C.max, V(4.6, 0.4, -2.6), 34, V(0, -0.7, 0)) },
  { line: 4, off: -0.1, id: 'max_worst', ...ROOM, cam: headCam(() => C.max, V(5.4, 0.6, -2.4), 40, V(0, -1.2, 0)) },
  { line: 4, off: 0.9, id: 'skye_hears', ...HALL, cam: headCam(() => C.skye, V(2.5, 0.1, -0.5), 32, V(0, -0.1, 0)) },
  { line: 4, off: endOf(4) - at(4) + 0.05, id: 'backs_away', ...HALL, cam: headCam(() => C.skye, V(4.6, 0.2, 2.2), 40, V(0, -1.0, 0)) },
  { line: 5, off: -0.1, id: 'got_it', ...HALL, cam: headCam(() => C.skye, V(3.6, 0.3, 1.2), 32, V(0, -0.4, 0)) },
  { line: 6, off: -0.35, id: 'lily_hatch', ...ATT, cam: camA('hatch_lily_cu') },
  { line: 7, off: -0.1, id: 'attic_wide', ...ATT, cam: camA('wide') },
  { line: 7, off: 1.3, id: 'skye_worse', ...ATT, cam: SKYE_MCU },
    { line: 8, off: -0.1, id: 'lily_said', ...ATT, cam: LILY_MCU },
  { line: 9, off: -0.1, id: 'skye_word', ...ATT, cam: SKYE_MCU },
  { line: 10, off: -0.1, id: 'lily_after', ...ATT, cam: LILY_MCU },
  { line: 11, off: -0.1, id: 'skye_left', ...ATT, cam: SKYE_MCU },
  { line: 12, off: -0.1, id: 'goose_two', ...ATT, cam: TWO },
  { line: 13, off: -0.1, id: 'plan', ...ATT, cam: (s, t) => { const h = K.headPos(C.skye), u = ramp(t, at(13), endOf(14)); return K.applyShot(s, { pos: h.clone().add(V(0.5, 0.35, 5.2).lerp(V(0.4, 0.25, 3.9), u)), target: h.clone().add(V(0, -0.25 + 0.2 * u, 0)), fov: 34 - 4 * u }); } },
  { line: 15, off: -0.1, id: 'lily_dont', ...ATT, cam: LILY_MCU },
  { line: 16, off: -0.1, id: 'skye_yes', ...ATT, cam: SKYE_CU },
  { line: 17, off: -0.1, id: 'lily_crying', ...ATT, cam: LILY_MCU },
  { line: 18, off: -0.1, id: 'end_two', ...ATT, cam: TWO },
].map((x) => ({ ...x, start: x.line === 0 && x.off === 0 ? -1 : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- posing (kit-cast posture / gesture) ----------
// Put an actor on a floor point in a posture: root y = floor - the pose's drop.
function poseAt(actor, pose, at, heading, opts = {}) {
  const drop = K.posture(actor, pose, opts);
  K.putOn(actor, { pos: at.pos.clone().setY(at.pos.y - drop), heading }, { sit: true });
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.applyLight(stage, sh.light, { set, practicals: sh.practicals });
  const idle = K.holdClock(t, L);

  if (sh.set === 'hallway') {
    K.only(C, ['skye']);
    K.setBlockers(set.group);
    K.setState({ chapter: CH });
    const kneelK = t < T.rise ? ramp(t, T.crouch, T.crouch + 0.45) : 1 - ramp(t, T.rise, T.rise + 0.35);
    const backT0 = T.rise + 0.35;
    if (t < backT0) {
      const d = M.door(), k = M.doorKneel(), u = ramp(t, T.crouch, T.crouch + 0.45);
      const at0 = { pos: d.pos.clone().lerp(k.pos, u) };
      poseAt(C.skye, 'kneel', at0, d.heading + (k.heading - d.heading) * u, { mix: kneelK });
      // reading the note at chest height on line 1; holding it low toward the door gap while kneeling
      const read = ramp(t, at(1) - 0.3, at(1) + 0.2) * (1 - ramp(t, endOf(1) - 0.2, endOf(1) + 0.2));
      K.gesture(C.skye, 'hand_hold', 'R');
      if (read > 0) K.gesture(C.skye, 'hold_out', 'R', read);
      if (kneelK > 0) K.gesture(C.skye, 'tap', 'R', kneelK);
    } else {
      // backs away from the door (a real backward step, 4 studs/s), then turns and walks off down the hall
      const k = M.doorKneel(), st = M.doorStep(), bk = M.doorBack(), d1 = k.pos.distanceTo(st.pos), stepEnd = backT0 + d1 / 4;
      if (t < stepEnd) {
        const u = clamp((t - backT0) * 4 / d1);
        K.playAnim(C.skye, [[A.horror_backstep, u * d1 / 4]]);
        K.putOn(C.skye, { pos: k.pos.clone().lerp(st.pos, u), heading: k.heading });
      } else {
        const m = K.walk(C.skye, A, st, bk, stepEnd + 0.15, t, { idleAt: 0, endHeading: bk.heading });
        if (!m.moving) poseAt(C.skye, 'stand', bk, bk.heading);
      }
    }
    const crumpled = t >= T.rise + 0.15;
    K.hold(crumpled ? P.crumpled : P.note, C.skye, 'R');
    P.note.visible = !crumpled; P.crumpled.visible = crumpled; P.phone.visible = false;
    const face = t < at(1) ? (t > at(0) + 4.5 ? 'sad' : 'nervous') : t < endOf(1) ? (t > endOf(1) - 1.6 ? 'happy' : 'nervous')
      : t < at(4) + 0.5 ? 'nervous' : t < T.rise ? 'shocked' : t < at(5) ? 'sad' : (t > endOf(5) - 0.7 ? 'annoyed' : 'sad');
    K.speak(C.skye, face, t, L.said('SKYE'), { whisper: true });
  } else if (sh.set === 'bedroom') {
    K.only(C, ['max']);
    K.setBlockers(set.group);
    K.setState({ chapter: CH, lamp: true });
    const b = M.bed();
    K.posture(C.max, 'sit_upright');
    K.putOn(C.max, { pos: b.pos.clone().setY(K.seatY(C.max, K.getSet('bedroom').marks.bed_edge.seat)), heading: Math.PI / 2 + 0.35 }, { sit: true });
    K.gesture(C.max, 'phone_ear', 'R');                 // phone at his right ear (the far side from the camera: his face stays clear)
    K.hold(P.phone, C.max, 'R', 'ear');
    P.note.visible = P.crumpled.visible = false;
    const face = t < at(2) + 0.6 ? 'surprised' : t < at(3) ? 'happy' : t < at(3) + 0.9 ? 'nervous' : 'happy';
    K.speak(C.max, face, t, L.said('MAX'));
    K.blush(C.max, t > at(3) && t < at(3) + 1.6 ? 1 : 0);
  } else {
    K.only(C, ['skye', 'lily']);
    K.setState({ chapter: CH, hatch: ramp(t, T.attic, T.attic + 0.5) });   // Lily pushes the hatch up
    K.setBlockers(set.group);
    // Skye cross-legged in the nest, turned a little toward Lily
    poseAt(C.skye, 'sit_cross', M.nest(), 0.25);
    K.gesture(C.skye, 'hand_hold', 'R');
    const wipe = ramp(t, at(18) + 0.2, at(18) + 0.6) * (1 - ramp(t, endOf(18) - 0.6, endOf(18) - 0.2));
    if (wipe > 0) K.gesture(C.skye, 'eye_wipe', 'L', wipe);
    K.hold(P.crumpled, C.skye, 'R'); P.crumpled.visible = true; P.note.visible = false; P.phone.visible = false;
    const sf = t < at(7) ? 'sad' : t < at(9) ? 'sad' : t < at(11) ? 'annoyed' : t < at(12) + 3.5 ? 'sad'
      : t < at(13) ? 'annoyed' : t < at(14) ? 'determined' : t < at(15) ? 'scheming' : t < at(18) ? 'determined' : 'crying';
    K.speak(C.skye, sf, t, L.said('SKYE'));

    // Lily: head and shoulders up through the hatch for line 6, then climbs out, walks to the nest and sits beside Skye
    const climb = M.hatchClimb(), top = M.hatchTop(), side = M.beside();
    const rise = ramp(t, T.attic, at(6) + 0.2) * 0.4 + ramp(t, endOf(6) + 0.1, endOf(6) + 0.7) * 0.6;
    const walkT0 = endOf(6) + 0.75, dWalk = top.pos.distanceTo(side.pos), arrive = walkT0 + dWalk / 12;
    if (t < walkT0) {
      K.posture(C.lily, 'stand');
      const y = ATTIC.hatchRise(C.lily.scale, rise);
      const p = climb.pos.clone().lerp(top.pos, ramp(t, endOf(6) + 0.4, walkT0)).setY(climb.pos.y + y);
      K.putOn(C.lily, { pos: p, heading: climb.heading }, { sit: true });
    } else if (t < arrive) {
      K.walk(C.lily, A, top, side, walkT0, t);
    } else {
      poseAt(C.lily, 'sit_cross', side, side.heading);
    }
    K.holdTeddy(C.lily, 'L');
    const lf = t < at(8) ? 'nervous' : t < at(10) ? 'surprised' : t < at(12) ? 'suspicious'
      : t < at(12) + 4.2 ? 'neutral' : t < at(13) ? 'smug' : 'sad';
    K.speak(C.lily, lf, t, L.said('LILY'));
  }
  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// for the hold check (web/ch08_hold.js)
export function cast() { return { skye: C.skye, max: C.max, lily: C.lily }; }
export function props() { return { note: P.note, crumpled: P.crumpled, phone: P.phone, teddy: C.lily.teddy }; }
