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
  crouch: endOf(1, -0.25),                 // she bends to slide the note under the door
  rise: endOf(4, 0.05),                  // she straightens up, backs away; the note crumples
  attic: endOf(5, 0.3),                  // cut to the attic
};

// ---------- marks (fallbacks are offsets from the set origin until the set defines the mark) ----------
const M = {
  // Skye beside Max's door (x -9), cheated 3/4 toward the camera side, reading her note
  door: () => { const m = K.mark('hallway', 'max_door'); return { pos: m.pos.clone().add(V(1.1, 0, 0.6)), heading: 1.5 }; },   // her left arm clear of the door
  // kneeling at the door gap, turned toward the camera side so the face reads
  doorKneel: () => { const m = K.mark('hallway', 'max_door_kneel'); return { pos: m.pos.clone().add(V(-0.4, 0, 1.25)), heading: Math.PI + 1.0 }; },   // right hand toward the gap, face toward the hall's far end
  doorStep: () => { const m = K.mark('hallway', 'max_door_kneel'); return { pos: m.pos.clone().add(V(0.4, 0, 2.9)), heading: Math.PI + 1.0 }; },   // ~2.5 studs back from the door
  doorBack: () => M.doorStep(),
  bed: () => K.mark('bedroom', 'bed_sit'),
  nest: () => K.mark('attic', 'nest'),
  beside: () => ({ pos: K.SET_ORIGIN.attic.clone().add(V(-3.8, 0, -4.8)), heading: 0.75 }),   // at Skye's left (frame-left), clear of her, the nest flashlight and the decorations   // 0.5 stud gap from Skye, legs short of the skeleton
  hatchTop: () => K.mark('attic', 'hatch_top'),
  hatchClimb: () => K.mark('attic', 'hatch_climb'),
};

// ---------- setup ----------
let C, A, P = {}, ATTIC, FILL;
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
  // a soft warm face fill from the camera side (the night attic is lit only by the standing flashlight)
  FILL = new THREE.PointLight('#ffe6cc', 0, 0, 2); stage.scene.add(FILL);
}

// ---------- the shot table ----------
const HALL = { set: 'hallway', light: 'night_moon', practicals: { moon_window: true, under_door: true, nightlight: true, ceiling_light: 0.3 } };
const ROOM = { set: 'bedroom', light: 'night_moon', practicals: { bedside_lamp: 0.45, moon_window: true } };
const ATT = { set: 'attic', light: 'night_moon', practicals: { moon: 0.45, bounce: true, flashlight: true, flashlightCone: false, hatchGlow: true } };
const camS = (name) => (s) => K.setCam(s, K.getSet(SHOTSET[name] || 'hallway').cams[name]);
// Max in bed on the phone, 3/4 from the room side, the window with the garlic behind him (k 0 closer, 1 wider)
const ROOMCAM = (k) => (s) => { const o = K.SET_ORIGIN.bedroom; return K.applyShot(s, { pos: o.clone().add(V(-1.9 + 0.5 * k, 5.4, 0.6 + 1.4 * k)), target: o.clone().add(V(-3.9, 5.2, -6.8)), fov: 40 }); };
const SHOTSET = { bed_phone_mcu: 'bedroom', bed_phone_ms: 'bedroom' };
// the door beat from down the hall (the linen-closet end, -x): she kneels side-on to Max's door, right hand at the gap,
// face to this camera. dist: from her head; h: height above her eyes; look: aim below her eyes.
const SIDECAM = (dist, h, look, fov) => (s) => { const hd = K.headPos(C.skye); return K.applyShot(s, { pos: hd.clone().add(V(-0.97 * dist, h, -0.08 * dist)), target: hd.add(V(0, look, 0)), fov }); };
const TWO = (s) => { const a = K.headPos(C.skye), b = K.headPos(C.lily), m = a.clone().add(b).multiplyScalar(0.5); return K.applyShot(s, { pos: m.clone().add(V(1.2, 0.8, 7.2)), target: m.clone().add(V(0, -1.1, 0)), fov: 36 }); };
const ATTIC_WS = (s) => { const o = K.SET_ORIGIN.attic; return K.applyShot(s, { pos: o.clone().add(V(-9.0, 5.2, 12.0)), target: o.clone().add(V(2.0, 1.6, 0.5)), fov: 52 }); };
const camA = (name) => (s) => K.setCam(s, ATTIC.cams[name]);
// attic singles: from the room side (+z), each cheated 3/4 toward the other (Lily is on Skye's left, frame-left)
const headCam = (who, off, fov, look = V(0, -0.25, 0)) => (s) => { const h = K.headPos(who()); return K.applyShot(s, { pos: h.clone().add(off), target: h.clone().add(look), fov }); };
const SKYE_MCU = headCam(() => C.skye, V(-0.3, 0.35, 5.2), 34), SKYE_CU = headCam(() => C.skye, V(-0.3, 0.25, 3.9), 30, V(0, -0.05, 0));
const LILY_MCU = headCam(() => C.lily, V(1.1, 0.3, 3.6), 32, V(0, -0.2, 0));   // in front of her (she is turned toward Skye and the room)
const SHOTS = [
  { line: 0, off: 0, id: 'door_ws', ...HALL, cam: (s, t) => K.applyShot(s, K.blendShot(K.getSet('hallway').cams.wide_to_max_door, { pos: K.headPos(C.skye).add(V(4.6, 0.6, 5.0)), target: K.headPos(C.skye).add(V(0, -0.9, 0)), fov: 38 }, smooth((t - 0.3) / (endOf(0) - 0.3)))) },
  { line: 1, off: -0.1, id: 'note_mcu', ...HALL, cam: headCam(() => C.skye, V(4.8, 0.0, 1.4), 46, V(0, -1.3, 0)) },
  { line: 1, off: endOf(1) - at(1) - 0.25, id: 'kneel', ...HALL, cam: SIDECAM(4.4, 0.7, -1.2, 42) },
  { line: 2, off: -0.1, id: 'max_phone', ...ROOM, cam: ROOMCAM(0) },
  { line: 4, off: -0.1, id: 'max_worst', ...ROOM, cam: ROOMCAM(1) },
  { line: 4, off: 0.9, id: 'skye_hears', ...HALL, cam: SIDECAM(3.6, 0.2, -0.5, 34) },
  { line: 4, off: endOf(4) - at(4) + 0.05, id: 'backs_away', ...HALL, cam: SIDECAM(4.6, 0.3, -1.0, 40) },
  { line: 5, off: -0.1, id: 'got_it', ...HALL, cam: SIDECAM(4.2, 0.3, -0.8, 34) },
  { line: 6, off: -0.35, id: 'attic_open', ...ATT, cam: ATTIC_WS },
  { line: 6, off: 0.6, id: 'lily_hatch', ...ATT, cam: camA('hatch_lily_cu') },
  { line: 7, off: -0.1, id: 'attic_wide', ...ATT, cam: ATTIC_WS },
  { line: 7, off: 1.3, id: 'skye_worse', ...ATT, cam: SKYE_MCU },
    { line: 8, off: -0.1, id: 'lily_said', ...ATT, cam: LILY_MCU },
  { line: 9, off: -0.1, id: 'skye_word', ...ATT, cam: SKYE_MCU },
  { line: 10, off: -0.1, id: 'lily_after', ...ATT, cam: LILY_MCU },
  { line: 11, off: -0.1, id: 'skye_left', ...ATT, cam: SKYE_MCU },
  { line: 12, off: -0.1, id: 'goose_two', ...ATT, cam: TWO },
  { line: 13, off: -0.1, id: 'plan', ...ATT, cam: (s, t) => { const h = K.headPos(C.skye), u = ramp(t, at(13), endOf(14)); return K.applyShot(s, { pos: h.clone().add(V(-0.3, 0.35, 5.2).lerp(V(-0.3, 0.25, 3.9), u)), target: h.clone().add(V(0, -0.25 + 0.2 * u, 0)), fov: 34 - 4 * u }); } },
  { line: 15, off: -0.1, id: 'lily_dont', ...ATT, cam: LILY_MCU },
  { line: 16, off: -0.1, id: 'skye_yes', ...ATT, cam: SKYE_CU },
  { line: 17, off: -0.1, id: 'lily_crying', ...ATT, cam: LILY_MCU },
  { line: 17, off: 0.8, id: 'skye_tears', ...ATT, cam: SKYE_CU },
  { line: 18, off: -0.1, id: 'end_two', ...ATT, cam: TWO },
].map((x) => ({ ...x, start: x.line === 0 && x.off === 0 ? -1 : at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- posing (kit-cast posture / gesture) ----------
// Put an actor on a floor point in a posture: root y = floor - the pose's drop.
function poseAt(actor, pose, at, heading, opts = {}) {
  const drop = K.posture(actor, pose, opts);
  K.putOn(actor, { pos: at.pos.clone().setY(at.pos.y - drop), heading }, { sit: true });
}

// note arm poses (degrees, kit gesture convention): bent up at the chest / raised to read / out and down to the door gap
const PHONE_TURN = 0.9, PHONE_ARM = [-28, 0, 124], EYE_WIPE = [-118, 0, 30];
const NOTE_CHEST = [-70, 0, -22], NOTE_READ = [-96, 0, -28], NOTE_GAP = [-30, 0, 16], FIST_FRONT = [-34, 0, 8];

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
      const at0 = { pos: t >= T.crouch ? k.pos : d.pos };   // she is at the kneel spot from the cut on
      poseAt(C.skye, 'kneel', at0, t >= T.crouch ? k.heading : d.heading, { mix: kneelK });   // turned on the cut to the kneel shot
      C.skye.root.position.y += 0.45 * Math.sin(Math.PI * kneelK); C.skye.root.updateMatrixWorld(true);   // legs fold without going into the floor
      // the folded note held at her chest (arm bent up in front); out to her right, low at the door gap, while kneeling
      const read = ramp(t, at(1) - 0.3, at(1) + 0.2) * (1 - ramp(t, endOf(1) - 0.2, endOf(1) + 0.2));
      K.gesture(C.skye, NOTE_CHEST, 'R');
      if (read > 0) K.gesture(C.skye, NOTE_READ, 'R', read);
      if (kneelK > 0) K.gesture(C.skye, NOTE_GAP, 'R', kneelK);
    } else {
      // backs away from the door: a real backward walk (backstep cycle driven by the distance, 3 studs/s), facing the door
      const k = M.doorKneel(), st = M.doorStep(), d1 = k.pos.distanceTo(st.pos), u = clamp((t - backT0) * 3 / d1);
      if (u < 1) { K.playAnim(C.skye, [[A.horror_backstep, u * d1 / 3]]); K.putOn(C.skye, { pos: k.pos.clone().lerp(st.pos, u), heading: k.heading }); }
      else poseAt(C.skye, 'stand', st, st.heading);
      K.gesture(C.skye, FIST_FRONT, 'R');                 // the crumpled note in her fist, in front of her hip
    }
    const crumpled = t >= T.rise + 0.15;
    K.hold(crumpled ? P.crumpled : P.note, C.skye, 'R');
    P.note.visible = !crumpled; P.crumpled.visible = crumpled; P.phone.visible = false;
    const face = t < at(1) ? (t > at(0) + 3.0 ? 'sad' : 'scared') : t < endOf(1) ? (t > endOf(1) - 1.6 ? 'neutral' : 'sad')
      : t < at(4) + 0.5 ? 'scared' : t < T.rise ? 'shocked' : t < at(5) ? 'sad' : (t > endOf(5) - 0.7 ? 'annoyed' : 'sad');
    K.speak(C.skye, face, t, L.said('SKYE'));
  } else if (sh.set === 'bedroom') {
    K.only(C, ['max']);
    K.setBlockers(set.group);
    K.setState({ chapter: CH, lamp: true });
    const b = M.bed();
    K.posture(C.max, 'sit_upright');
    K.putOn(C.max, { pos: b.pos.clone().setY(K.seatY(C.max, K.getSet('bedroom').marks.bed_sit.seat)), heading: b.heading + 0.5 }, { sit: true });   // turned to the camera: the phone arm sits beside his head
    K.gesture(C.max, PHONE_ARM, 'L');                   // hand by his jaw, the phone above it against his ear (camera side)
    K.hold(P.phone, C.max, 'L', 'ear', { offset: [0.04, -0.14, 0.42] }); P.phone.rotateY(PHONE_TURN); P.phone.visible = true;   // 'ear' mode doesn't set visibility; other sets hide it
    const talk = K.holdClock(t, L);                     // head moves only while he talks (held frames stay identical)
    C.max.bones.Head.rotation.set(0.06 * Math.sin(talk * 2.1), 0.12 * Math.sin(talk * 1.3), 0.05 * Math.sin(talk * 1.7));
    P.note.visible = P.crumpled.visible = false;
    const face = t < at(3) ? 'happy' : t < at(3) + 0.9 ? 'nervous' : 'happy';
    K.speak(C.max, face, t, L.said('MAX'));
    K.blush(C.max, t > at(3) && t < at(3) + 1.6 ? 1 : 0);
  } else {
    K.only(C, ['skye', 'lily']);
    K.setState({ chapter: CH, hatch: 0.6 + 0.4 * ramp(t, at(6, -0.35), at(6, 0.2)), hide: ['shafts_moon'] });   // Lily has pushed the hatch up
    K.setBlockers(set.group);
    // Skye cross-legged in the nest, turned a little toward Lily
    poseAt(C.skye, 'sit_cross', M.nest(), -0.25);   // turned a little toward Lily (at her left)
    K.gesture(C.skye, [-26, 0, -14], 'L');               // her near arm rests inward on her knee, clear of Lily
    // her right fist with the crumpled note rests on her knee; one thump on "biggest"
    const big = (L.said('SKYE').find((w) => /biggest/i.test(w.word)) || { start: at(13, 1.5) }).start;
    const thump = Math.max(0, Math.sin(Math.PI * clamp((t - big + 0.15) / 0.4)));
    K.gesture(C.skye, [-22 - 30 * thump, 0, -16], 'R');
    // "It's dusty": the left hand comes up to wipe her eye (fist in front of the cheek, never into the head), then down
    const wipe = 0.9 * ramp(t, at(18, 0.15), at(18, 0.55)) * (1 - ramp(t, endOf(18, -0.6), endOf(18, -0.2)));
    if (wipe > 0) K.gesture(C.skye, EYE_WIPE, 'R', wipe);   // the far hand (the fist with the note), so it never crosses Lily
    K.hold(P.crumpled, C.skye, 'R'); P.crumpled.visible = true; P.note.visible = false; P.phone.visible = false;
    const sf = t < at(7) ? 'sad' : t < at(9) ? 'sad' : t < at(11) ? 'annoyed' : t < at(12) + 3.5 ? 'sad'
      : t < at(13) ? 'annoyed' : t < at(14) ? 'determined' : t < at(15) ? 'scheming' : t < at(16) ? 'determined' : 'crying';   // tears from "Yes, I do."
    K.speak(C.skye, sf, t, L.said('SKYE'));

    // Lily: head and shoulders up through the hatch for line 6, then climbs out, walks to the nest and sits beside Skye
    const climb = M.hatchClimb(), top = M.hatchTop(), side = M.beside();
    const rise = 0.36 + ramp(t, at(6, -0.35), at(6, 0.5)) * 0.16 + ramp(t, endOf(6) + 0.1, endOf(6) + 0.7) * 0.48;
    const walkT0 = endOf(6) + 0.75, dWalk = top.pos.distanceTo(side.pos), arrive = walkT0 + dWalk / 12;
    if (t < walkT0) {
      K.posture(C.lily, 'stand');
      const y = ATTIC.hatchRise(C.lily.scale, rise);
      const p = climb.pos.clone().lerp(top.pos, ramp(t, endOf(6) + 0.4, walkT0)).setY(climb.pos.y + y);
      K.putOn(C.lily, { pos: p, heading: climb.heading - (t < at(6, 0.6) ? 0.5 : 0) }, { sit: true });   // in the opening wide, turned a little toward the nest/camera
    } else if (t < arrive) {
      K.walk(C.lily, A, top, side, walkT0, t);
    } else {
      poseAt(C.lily, 'sit_cross', side, side.heading, { extra: { 'Arm.L': [-48, 0, 26], 'Arm.R': [-42, 0, -26] } });
    }
    K.holdTeddy(C.lily, t >= arrive ? 'hug' : 'L');
    const lf = t < at(8) ? 'scared' : t < at(10) ? 'surprised' : t < at(12) ? 'suspicious'
      : t < at(12) + 4.2 ? 'neutral' : t < at(13) ? 'smug' : 'sad';
    K.speak(C.lily, lf, t, L.said('LILY'));
  }
  sh.cam(stage, t);
  // face fill, attic and bedroom only: a soft light 2.5 studs in front of the framed face (the nearest one), toward the
  // camera and a little above, so the face gets the same fill in close-ups and wides and nothing near the lens blows out
  const c = stage.camera, heads = ['skye', 'lily', 'max'].filter((k) => C[k].root.visible).map((k) => K.headPos(C[k]));
  const face = heads.reduce((a, b) => (c.position.distanceTo(a) <= c.position.distanceTo(b) ? a : b));
  FILL.position.copy(face).addScaledVector(c.position.clone().sub(face).normalize(), 2.5).add(V(0, 0.6, 0));
  FILL.intensity = (sh.set === 'attic' ? FILL_I.attic : sh.set === 'bedroom' ? FILL_I.bedroom : 0) * 2.5 * 2.5;
}
const FILL_I = { attic: 1.3, bedroom: 0.4 };

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// for the hold check (web/ch08_hold.js)
export function cast() { return { skye: C.skye, max: C.max, lily: C.lily }; }
export function props() { return { note: P.note, crumpled: P.crumpled, phone: P.phone, teddy: C.lily.teddy }; }
