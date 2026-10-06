// Chapter 5: The Tea Party (WEDNESDAY 3:41 PM). The attic, afternoon sun through the round window. Lily finds Skye in
// her nest, makes a deal (a tea party every day, and Skye is the horse), and tells her Max talks about her every night
// at dinner. Shot plan: production/shots/ch05.md. Contract: source/boundary_sheet.md (Ch4|Ch5 start, Ch5|Ch6 end).
// Everything is a pure function of t.
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch05.js --out /tmp/ch05 \
//            --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 5;
const CARD = { day: 'WEDNESDAY', time: '3:41 PM' };
// Estimated lines (until audio/chapters/ch05/lines.json lands): words / pace + 0.25 s, 0.25 s gaps, the [+N] pauses.
const SCRIPT = [
  ['VO', "Wednesday afternoon. I always got back before anyone else. Almost anyone."],
  ['LILY', 'Who are you?'],
  ['SKYE', "I'm a ghost. Boo."],
  ['LILY', "Ghosts don't have backpacks."],
  ['SKYE', "I'm a modern ghost."],
  ['LILY', "You're Skye. From the fridge."],
  ['SKYE', "Okay. Please, please don't tell anyone."],
  ['LILY', "I won't tell. If you come to my tea party. Every day."],
  ['SKYE', 'Deal.'],
  ['LILY', 'And you have to be the horse.', 0.6],
  ['SKYE', "Fine. I'll be the horse.", 0.8],
  ['LILY', 'More tea, horse?'],
  ['SKYE', 'Neigh. I mean, yes, please.'],
  ['LILY', 'Why are you living in our attic?'],
  ['SKYE', "Your brother said I'm scared of everything."],
  ['LILY', 'Are you?'],
  ['SKYE', 'Not of him.'],
  ['LILY', "So you're haunting him."],
  ['SKYE', 'Professionally.'],
  ['LILY', 'Is it working?'],
  ['SKYE', 'He hides under his blanket every night.'],
  ['LILY', 'He sleeps with the light on now. And he put garlic on his window.'],
  ['SKYE', 'Garlic is for vampires.'],
  ['LILY', 'I told him that.'],
  ['LILY', 'He talks about you every night at dinner, you know.'],
  ['SKYE', 'Because he hates me.'],
  ['LILY', "That's not what it sounds like."],
  ['SKYE', 'What does it sound like?'],
  ['LILY', 'Like when Dad talks about pancakes.', 0.8],
  ['SKYE', "That's... He doesn't... More tea, please."],
];
const PACE = { VO: 2.9, SKYE: 2.8, LILY: 2.5 };
const EST = (() => {
  let t = 0; const out = [];
  SCRIPT.forEach(([speaker, text, pause = 0], i) => {
    const d = text.split(/\s+/).length / PACE[speaker] + 0.25 + (/\.\.\./.test(text) ? 0.8 : 0);
    out.push({ index: i, speaker, text, start: t, end: t + d }); t += d + 0.25 + pause;
  });
  return out;
})();
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.75);
export const sky = K.SKY;
export const samples = () => 1;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// Lines by their order in the chapter (0 = the VO), whatever numbering lines.json uses.
const ln = (k) => L.lines[k];
const at = (k, off = 0) => ln(k).start + off;
const end = (k, off = 0) => ln(k).end + off;
const inv = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const smooth = (u) => u * u * (3 - 2 * u);

// ---------- marks (attic local coordinates -> world; the set's own marks where it has them) ----------
const AO = K.SET_ORIGIN.attic;
const W = (x, y, z) => V(x, y, z).add(AO);
const M = {
  nest: () => K.mark('attic', 'nest'),
  hatchHead: () => K.mark('attic', 'hatch_head_lily'),
  hatchClimb: () => K.mark('attic', 'hatch_climb'),
  hatchTop: () => K.mark('attic', 'hatch_top'),
  horse: () => K.mark('attic', 'hobby_horse'),
  nestFront: () => { const m = K.mark('attic', 'nest_front'); m.pos.add(V(2.6, 0, 0.8)); return m; },   // out of the window shaft and its bar shadow
  teaSkye: () => K.mark('attic', 'tea_skye'),
  teaLily: () => K.mark('attic', 'tea_lily'),
};

// ---------- timeline (key moments) ----------
const MORE = (L.said('SKYE').find((w) => /^More/.test(w.word) && w.start > L.lines[29].start) || { start: L.lines[29].end - 0.9 }).start;
const T = {
  lilyUp: 0.9,                     // Lily finishes rising through the hatch (frame 0 she is already head + shoulders up)
  climb: at(5, -0.35),             // she climbs out during "You're Skye. From the fridge."
  climbDur: 0.7,
  backpackOff: end(8, 0.15),       // after "Deal.": the backpack comes off (swapped on Lily's shot)
  horseGive: at(10, 1.0),          // Skye takes the horse on "horse"
  tea: end(10, 0.2),               // hard cut to the tea party (inside the +0.8 pause)
  blush: end(28, 0.05),            // [+0.8] Skye's face goes pink
};

// ---------- setup ----------
let C, A, P = {}, SET;
export async function setup(stage) {
  await K.buildSets(stage, ['attic']);
  SET = K.getSet('attic');
  K.setState({ chapter: 5 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.lily, 'lily_day');
  A = await K.loadAnims(['idle', 'walk', 'climb', 'sit', 'shrug', 'point', 'talk']);
  for (const id of ['hobby_horse', 'teapot', 'cup', 'cracker_packet']) { P[id] = K.makeProp(id); stage.scene.add(P[id]); }
  P.cupLily = K.makeProp('cup'); stage.scene.add(P.cupLily);
  P.teddySit = K.makeProp('teddy', { pose: 'sit' }); stage.scene.add(P.teddySit);   // Lily's teddy when it is put down (same bear, sitting pose)
  T.grab = lilyPath().t2;
}
export const cast = () => ({ skye: C.skye, lily: C.lily });

// ---------- the shot table (k = line by order; off seconds) ----------
const SHOTS = [
  // frame 0: from beside the nest toward the hatch, Skye 3/4 in the foreground (left), Lily up through the hatch (right)
  { k: 0, off: 0, id: 'open', cam: (s) => K.setCam(s, { pos: W(-5.4, 2.7, -9.3), target: W(1.6, 3.4, -0.5), fov: 52 }, { blockers: SET.group }) },
  { k: 0, off: 1.3, id: 'lily_hatch', cam: (s) => hatchCu(s) },
  { k: 0, off: 2.8, id: 'skye_shock', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5 }) },
  { k: 1, off: -0.1, id: 'lily_hatch', cam: (s) => hatchCu(s) },
  { k: 2, off: -0.1, id: 'skye_nest', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5 }) },
  { k: 3, off: -0.1, id: 'lily_hatch', cam: (s) => hatchCu(s) },
  { k: 4, off: -0.4, id: 'skye_nest', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5 }) },
  { k: 5, off: -0.35, id: 'wide_walk', cam: (s) => K.setCam(s, { pos: W(-10.2, 3.8, -2.5), target: W(2.5, 1.6, -0.5), fov: 52 }, { blockers: SET.group }) },
  { k: 6, off: -0.1, id: 'skye_plead', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.55 }) },
  { k: 7, off: -0.1, id: 'lily_deal', cam: (s) => lilyStand(s) },
  { k: 8, off: -0.1, id: 'skye_deal', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.9 }) },
  { k: 9, off: -0.1, id: 'lily_horse', cam: (s) => lilyStand(s) },
  { k: 9, off: 'end+0.05', id: 'handoff', cam: (s) => K.twoShot(s, C.skye, C.lily, { framing: 'ms' }) },
  
  { k: 10, off: 'tea', id: 'tea_wide', cam: (s) => teaSide(s, 44) },
  { k: 11, off: -0.1, id: 'pour_two', cam: (s) => teaSide(s, 34) },   // the pour reads side-on (in a single her near arm would cover her)
  { k: 12, off: -0.1, id: 'skye_ots', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { k: 13, off: -0.1, id: 'lily_ots', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.55 }) },
  { k: 14, off: -0.1, id: 'skye_ots', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { k: 15, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 16, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 17, off: -0.1, id: 'lily_ots', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.55 }) },
  { k: 18, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 19, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 20, off: -0.1, id: 'skye_ots', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { k: 21, off: -0.1, id: 'lily_ots', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.55 }) },
  { k: 22, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 23, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 24, off: -0.1, id: 'tea_two', cam: (s) => teaSide(s, 34) },
  { k: 25, off: -0.1, id: 'skye_ots', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.55 }) },
  { k: 26, off: -0.1, id: 'lily_ots', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.55 }) },
  { k: 27, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 28, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 28, off: 'blush', id: 'blush_push', cam: (s, t) => blushPush(s, t) },
  { k: 29, off: 'more', id: 'end_two', cam: (s) => teaSide(s, 34) },
].map((x) => ({ ...x, start: x.off === 'tea' ? T.tea : x.off === 'blush' ? T.blush : x.off === 'end+0.05' ? end(x.k, 0.05) : x.off === 'more' ? MORE - 0.1 : at(x.k, x.off) }))
  .sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };
function hatchCu(s) { return K.camOn(s, C.lily, 'mcu', { angle: 0.3, look: V(0, -0.75, 0), zoom: 1.3 }); }
function lilyStand(s) { const h = K.headPos(C.lily); return K.setCam(s, { pos: W(-1.8, 2.9, -6.8), target: V(h.x, h.y - 0.7, h.z), fov: 40 }, { blockers: SET.group }); }
// the tea party side-on from the window-left side: Skye frame-left, Lily frame-right, the box and the toys between
function teaSide(s, fov) { return K.setCam(s, { pos: W(-9.6, 3.8, 2.2), target: W(-3.5, 1.9, 1.8), fov }, { blockers: SET.group }); }
function setNamed(name) { return K.setCam(STAGE, SET.cams[name], { blockers: SET.group }); }
function blushPush(s, t) {
  const u = smooth(inv(T.blush, at(29, 1.6), t));
  return K.applyShot(s, K.blendShot(K.camOn(s, C.skye, 'mcu', { angle: 0.65, apply: false }), K.camOn(s, C.skye, 'cu', { angle: 0.65, apply: false }), u));
}

// ---------- faces ----------
// [from time, face] per character; speak() swaps in talking / mouth_o on their own words.
const FACE_SKYE = () => [
  [0, 'shocked'], [at(2, -0.1), 'scheming'], [end(2), 'nervous'], [at(4), 'smug'], [end(4), 'nervous'],
  [at(5), 'shocked'], [at(6, -0.2), 'nervous'], [at(8), 'happy'], [end(9), 'annoyed'], [T.tea, 'neutral'],
  [at(12), 'happy'], [at(14), 'annoyed'], [at(16), 'determined'], [at(17), 'neutral'], [at(18), 'smug'],
  [at(20), 'scheming'], [end(20), 'laugh'], [at(22), 'confused'], [at(24), 'surprised'], [at(25), 'annoyed'],
  [at(27), 'surprised'], [T.blush, 'nervous'],
];
const FACE_LILY = () => [
  [0, 'suspicious'], [at(3), 'smug'], [at(5), 'smug'], [T.tea, 'happy'], [at(13), 'suspicious'], [at(17), 'smug'],
  [at(19), 'suspicious'], [at(21), 'neutral'], [at(23), 'annoyed'], [at(24), 'smug'],
];
// a face the cast hasn't preloaded yet falls back (confused -> surprised) so the chapter renders meanwhile
const FALLBACK = { confused: 'surprised' };
const faceAt = (list, t) => { let f = list[0][1]; for (const [s, x] of list) if (t >= s) f = x; return K.FACES.includes(f) ? f : FALLBACK[f] || 'neutral'; };

// ---------- update ----------
let STAGE;
export function update(t, stage) {
  STAGE = stage;
  const sh = shotAt(t), set = K.showSet('attic');
  const tea = t >= T.tea, bpOff = t >= T.backpackOff;
  K.setState({
    chapter: 5, hatch: 'open', tea, backpack: bpOff, hobbyHorse: t >= lilyPath().t2 + GRAB * 0.5 ? 'none' : 'boxes',
    hide: tea ? ['teapot', 'cup_1', 'teddy_left'] : t < at(2, 0.3) ? ['crackers'] : [],
  });
  K.dress(C.skye, bpOff ? 'skye_hoodie' : ['skye_hoodie', 'backpack']);
  K.applyLight(stage, 'attic_afternoon', { set });
  K.setBlockers(set.group, C.skye, C.lily);
  K.only(C, ['skye', 'lily']);
  const idle = K.holdClock(t, L, [[T.climb, T.climb + 2.2]]);

  if (!tea) blockNest(t, idle); else blockTea(t, idle);

  K.speak(C.skye, faceAt(FACE_SKYE(), t), t, L.said('SKYE'));
  K.speak(C.lily, faceAt(FACE_LILY(), t), t, L.said('LILY'));
  if (K.blush) K.blush(C.skye, smooth(inv(T.blush, T.blush + 0.6, t)));

  sh.cam(stage, t);
}

// First half: the nest and the hatch. Line Skye -> Lily; cameras on the window-left side.
const GRAB = 0.45;                                    // Lily stops beside the boxes to pick up the hobby horse
const LILY_SPOT = () => { const p = W(-2.2, 0, -3.4); return { pos: p, heading: K.faceTo(p, M.nest()) }; };   // ~4.5 studs from Skye, clear of the skeleton and the window shaft
const HORSE_STOP = () => ({ pos: W(6.5, 0, 3.0), heading: K.faceTo(W(6.5, 0, 3.0), W(7.9, 0, 2.6)) });          // 1.4 studs from the leaning horse
function lilyPath() {
  const top = M.hatchTop(), horse = HORSE_STOP(), front = LILY_SPOT();
  const c1 = T.climb + 0.55, t1 = c1 + 0.35;                       // up the ladder; knee onto the floor; standing
  const legA = top.pos.distanceTo(horse.pos) / 12;
  return { top, horse, front, c1, t1, t2: t1 + legA, t3: t1 + legA + GRAB };   // t2: at the horse, t3: walks on
}
function blockNest(t, idle) {
  const nest = M.nest(), L5 = lilyPath();
  K.setLine(C.skye, C.lily, 1);
  // Skye: cross-legged in her nest, side-on to the hatch with her crackers, head already turned to the hatch (frame 0);
  // she swings her whole body round to face Lily on her own shot (3.0-3.6 s), then follows her as she walks in.
  const turn = smooth(inv(3.0, 3.6, t));
  const lilyAt = t < L5.t3 ? M.hatchHead() : L5.front;          // (a pure function of t: never read last frame's pose)
  const faceLily = K.faceTo(nest, lilyAt);
  const kneelUp = t >= at(6, -0.15) && t < at(7, 0.3);           // up on her knees to plead
  floorSit(C.skye, { pos: nest.pos, heading: -1.0 + (faceLily + 1.0) * turn }, kneelUp ? 'kneel_up' : 'sit_cross');
  headYaw(C.skye, -0.55 * (1 - turn) + 0.05 * Math.sin(t * 1.7) * (t > 3.6 && t < at(2) ? 1 : 0));   // eyes on the hatch from frame 0
  if (t < at(2, 0.3)) K.gesture(C.skye, 'cup_hold', 'L', 0.5);       // the cracker packet in her left hand
  if (t >= at(2, 0.55) && t < end(2, 0.2)) K.gesture(C.skye, 'wave', 'L', 0.75 + 0.08 * Math.sin(t * 25));   // "Boo": one arm up on the far side, hand wiggling
  if (kneelUp) { K.gesture(C.skye, 'hand_hold', 'L', 0.9); K.gesture(C.skye, 'hand_hold', 'R', 0.9); }        // hands together at her chest
  const reach = smooth(inv(T.horseGive - 0.5, T.horseGive, t)) * (1 - smooth(inv(T.horseGive + 0.2, T.horseGive + 0.7, t)));
  if (reach > 0) K.gesture(C.skye, 'hold_out', 'R', reach);
  if (t >= T.horseGive + 0.7) K.gesture(C.skye, 'hand_hold', 'R');

  // Lily: head and shoulders up through the hatch hugging her teddy (above the rim), rising a little over the first
  // second; then a real climb (up the ladder, knee onto the floor, stand), a walk to the boxes for the hobby horse, and
  // a walk to her spot ~4.5 studs in front of Skye, facing her.
  const hh = M.hatchHead();
  if (t < T.climb) {
    const p = hh.pos.clone(); p.y += 0.15 - 0.3 * (1 - smooth(inv(0, T.lilyUp, t)));
    // arms down inside the hole (rigid R6 arms on the floor read as a crate); her teddy sits on the rim in front of her
    K.posture(C.lily, 'stand'); teddyDown(V(hh.pos.x - 0.5, 0, 7.05 + AO.z), Math.PI);
    putRoot(C.lily, p, K.faceTo(hh, nest));
  } else if (t < L5.c1) {                                        // up the ladder in the hole, facing the rungs
    P.teddySit.visible = false; C.lily.teddy.visible = true;
    const u = smooth(inv(T.climb, L5.c1, t)), y0 = hh.pos.y + 0.15, y1 = -1.2 * C.lily.scale;
    const d = K.posture(C.lily, K.gait('climb', (y1 - y0) * u / 1.6)); K.holdTeddy(C.lily, 'L');
    putRoot(C.lily, V(hh.pos.x, y0 + (y1 - y0) * u - d, hh.pos.z), Math.PI);
  } else if (t < L5.t1) {                                        // knee up onto the floor, then stand
    P.teddySit.visible = false; C.lily.teddy.visible = true;
    const u = smooth(inv(L5.c1, L5.t1, t)), y1 = -1.2 * C.lily.scale;
    const d = K.posture(C.lily, u < 0.6 ? 'crouch' : 'stand'); K.holdTeddy(C.lily, 'L');
    const lift = smooth(Math.min(1, u / 0.45));                 // up out of the hole first, then onto the floor
    const p = V(hh.pos.x, 0, hh.pos.z).lerp(L5.top.pos, smooth(Math.max(0, (u - 0.4) / 0.6))); p.y = y1 * (1 - lift) - (u < 0.6 ? d * lift : 0);
    putRoot(C.lily, p, Math.PI);
  } else {
    K.holdTeddy(C.lily, 'L'); P.teddySit.visible = false; C.lily.teddy.visible = true;
    if (t < L5.t3) {
      K.walk(C.lily, A, L5.top, L5.horse, L5.t1, t, { idleAt: idle });
      if (t >= L5.t2) K.gesture(C.lily, 'hold_out', 'R', Math.sin(Math.PI * inv(L5.t2, L5.t3, t)));   // reaches for the stick
    } else K.walk(C.lily, A, L5.horse, L5.front, L5.t3, t, { idleAt: idle, endHeading: L5.front.heading });
    const offerU = smooth(inv(at(9, 0.3), at(9, 0.8), t));
    if (t >= at(9, 0.3) && t < T.horseGive + 0.3) K.gesture(C.lily, 'hold_out', 'R', 0.4 + 0.6 * offerU);     // holds the horse out to Skye
  }
  const lilyHasHorse = t >= L5.t2 + GRAB * 0.5 && t < T.horseGive;
  K.hold(P.hobby_horse, lilyHasHorse ? C.lily : C.skye, 'R');
  P.hobby_horse.visible = t >= L5.t2 + GRAB * 0.5;
  K.hold(P.cracker_packet, C.skye, 'L'); P.cracker_packet.visible = t < at(2, 0.3);
  P.teapot.visible = P.cup.visible = P.cupLily.visible = false;
}

// Second half: the tea party at the upturned box (Skye on the hatch side facing -z, Lily on the nest side facing +z).
function blockTea(t, idle) {
  const sk = M.teaSkye(), li = M.teaLily();
  K.setLine(C.lily, C.skye, -1);              // cameras on the window-left (-x) side, as in the first half
  // both cheated ~25 degrees towards the window-left cameras so their faces read 3/4 in the two-shots
  floorSit(C.skye, { pos: sk.pos, heading: sk.heading - 0.45 }, 'sit_cross');
  floorSit(C.lily, { pos: li.pos, heading: li.heading + 0.45 }, 'kneel');
  // Skye: cup in her left hand (her right arm is on the camera side), the hobby horse across her lap
  const sip = (a, b) => t >= a && t < b;
  K.gesture(C.skye, 'cup_hold', 'L', 0.65);                      // high enough that the cup clears the box
  if (sip(at(12), end(12))) K.gesture(C.skye, 'hold_out', 'L');        // cup out for more tea
  if (sip(at(18), end(18, 0.5))) K.gesture(C.skye, 'cup_hold', 'L', 1);                          // "Professionally." (a sip)
  if (sip(at(20), end(20))) K.gesture(C.skye, 'hand_over_mouth', 'R', 0.6);                       // gossip
  K.gesture(C.skye, 'hand_hold', 'R');
  // the hobby horse lies across her lap (head to her right), flat on her crossed legs
  if (P.hobby_horse.parent !== STAGE.scene) STAGE.scene.add(P.hobby_horse);
  K.place(P.hobby_horse, V(sk.pos.x, 0.6, sk.pos.z + 0.75), Math.PI / 2, { flat: true }); P.hobby_horse.visible = true;
  P.cup.visible = true;
  if (t >= MORE - 0.1) { K.gesture(C.skye, [-92, 0, 4], 'L'); K.hold(P.cup, C.skye, 'L'); }   // "More tea, please": cup out over the box
  else K.hold(P.cup, C.skye, 'L');
  // Lily: teapot in her right hand (pours on "More tea, horse?" and at the end), her teddy beside her on the floor
  const pour = lilyPours(t);
  // pouring: arm out level so the pot clears the box; between pours the pot stands on the box (the set's teapot)
  // one teapot track: always in her left hand; level when pouring, low by her knee in between (never both arms up)
  if (pour) K.gesture(C.lily, [-92, t >= MORE - 0.1 ? -45 : -30, 6], 'L'); else K.gesture(C.lily, 'hand_hold', 'L', 0.8);  // left hand (camera side), level so her face stays clear; at the end swung toward Skye's cup
  K.hold(P.teapot, C.lily, 'L'); if (pour) P.teapot.rotateX(0.5 * smooth(inv(0, 0.4, t - pourStart(t)))); P.teapot.visible = true;
  P.cupLily.visible = false; P.cracker_packet.visible = false;
  const tm = K.mark('attic', 'tea_teddy_lily'); teddyDown(tm.pos, tm.heading);
}

const POURS = () => [[at(11, -0.2), end(11, 0.3)], [at(24), end(24)], [MORE - 0.1, 1e9]];
const pourStart = (t) => (POURS().find(([a, b]) => t >= a && t < b) || [t])[0];
const lilyPours = (t) => (t >= at(11, -0.2) && t < end(11, 0.3)) || (t >= at(24) && t < end(24)) || t >= MORE - 0.1;

// Lily's teddy put down: her held bear hides and the sitting one stands in for it (one teddy on screen)
function teddyDown(pos, heading) {
  K.holdTeddy(C.lily, 'L'); C.lily.teddy.visible = false;
  K.place(P.teddySit, pos, heading); P.teddySit.scale.setScalar(C.lily.scale); P.teddySit.visible = true;
}

// floor poses from the cast (sit_cross, kneel, kneel_up): the pose's drop puts the seat on the floor
function floorSit(actor, mark, pose) {
  const d = K.posture(actor, pose);
  putRoot(actor, V(mark.pos.x, mark.pos.y - d, mark.pos.z), mark.heading);
}
function putRoot(actor, pos, heading) {
  actor.root.visible = true; actor.root.position.copy(pos); actor.root.rotation.set(0, heading, 0); actor.root.updateMatrixWorld(true);
}
// turn an actor's head (radians, + = towards their left) on top of the pose
const _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
function headYaw(actor, yaw) { if (yaw) actor.bones.Head.quaternion.premultiply(_q.setFromAxisAngle(_up, yaw)); }

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}

// ---------- held props, for web/ch05_hold.js: [t, who, hand, label] ----------
export const HOLDS = () => {
  const over = { up: 3.2, dist: 4.2, side: -1.5 };             // over the tea box (it hides the hands from eye level)
  return [
    [0.5, 'skye', 'L', 'cracker_packet (nest)'],
    [0.5, 'lily', 'R', 'teddy hug (hatch)', { up: 3.0, dist: 4.0 }],
    [T.climb + T.climbDur + 0.3, 'lily', 'L', 'teddy at her side (walking)'],
    [at(6, 0.2), 'lily', 'R', 'hobby_horse (walking)'],
    [at(9, 0.8), 'lily', 'R', 'hobby_horse held out', { side: 2.5, dist: 4.5 }],
    [at(10, 1.4), 'skye', 'R', 'hobby_horse (Skye)', { up: 2.0 }],
    [at(11, 0.3), 'lily', 'L', 'teapot pouring', over],
    [at(12, 0.3), 'skye', 'L', 'cup held out', over],
    [at(14, 0.3), 'skye', 'L', 'cup resting', over],
    [at(15, 0.2), 'lily', 'L', 'teapot resting', over],
    [at(18, 0.3), 'skye', 'L', 'cup sip', over],
    [L.end - 0.2, 'skye', 'L', 'cup out (end)', over],
    [L.end - 0.2, 'lily', 'L', 'teapot (end)', over],
  ];
};
