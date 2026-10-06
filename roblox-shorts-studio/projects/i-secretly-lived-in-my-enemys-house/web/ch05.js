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
  nestFront: () => ({ pos: W(1.9, 0, -3.4), heading: Math.atan2(0.2 - 1.9, -7.2 + 3.4) }),   // ~4 studs from the nest
  teaSkye: () => K.mark('attic', 'tea_skye'),
  teaLily: () => K.mark('attic', 'tea_lily'),
};

// ---------- timeline (key moments) ----------
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
  // light shafts and dust motes are not walls for the camera (requested in the kit; runtime tag only, no look change)
  SET.group.traverse((o) => { if (o.isPoints || o.material?.blending === THREE.AdditiveBlending) o.userData.noCamBlock = true; });
  K.setState({ chapter: 5 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack'); K.dress(C.lily, 'lily_day');
  A = await K.loadAnims(['idle', 'walk', 'climb', 'sit', 'shrug', 'point', 'talk']);
  for (const id of ['teddy', 'hobby_horse', 'teapot', 'cup', 'cracker_packet']) { P[id] = K.makeProp(id); stage.scene.add(P[id]); }
  P.cupLily = K.makeProp('cup'); stage.scene.add(P.cupLily);
}
export const cast = () => ({ skye: C.skye, lily: C.lily });

// ---------- the shot table (k = line by order; off seconds) ----------
const SHOTS = [
  // frame 0: from beside the nest toward the hatch, Skye 3/4 in the foreground (left), Lily up through the hatch (right)
  { k: 0, off: 0, id: 'open', cam: (s) => K.setCam(s, { pos: W(-5.4, 2.7, -9.3), target: W(1.6, 2.4, -0.5), fov: 52 }, { blockers: SET.group }) },
  { k: 0, off: 1.4, id: 'skye_shock', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: -0.5 }) },
  { k: 0, off: 2.8, id: 'lily_hatch', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.3 }) },
  { k: 2, off: -0.1, id: 'skye_nest', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.35 }) },
  { k: 3, off: -0.1, id: 'lily_hatch', cam: (s) => K.camOn(s, C.lily, 'mcu', { angle: 0.3 }) },
  { k: 4, off: -0.4, id: 'skye_nest', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.35 }) },
  { k: 5, off: -0.35, id: 'wide_walk', cam: () => setNamed('wide_low') },
  { k: 6, off: -0.1, id: 'skye_plead', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 2.8 }) },
  { k: 7, off: -0.1, id: 'lily_deal', cam: (s) => K.camOn(s, C.lily, 'ms', { angle: 0.45 }) },
  { k: 8, off: -0.1, id: 'skye_deal', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.35 }) },
  { k: 9, off: -0.1, id: 'lily_horse', cam: (s) => K.camOn(s, C.lily, 'ms', { angle: 0.45 }) },
  { k: 9, off: 'end+0.05', id: 'horse_pov', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 1.2 }) },
  { k: 10, off: -0.1, id: 'skye_horse', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.35 }) },
  { k: 10, off: 'tea', id: 'tea_wide', cam: () => setNamed('tea_wide') },
  { k: 11, off: -0.1, id: 'lily_ots', cam: (s) => K.overShoulder(s, C.skye, C.lily, 'mcu', { shoulder: 2.8 }) },
  { k: 12, off: -0.1, id: 'skye_ots', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 2.8 }) },
  { k: 13, off: -0.1, id: 'lily_ots', cam: (s) => K.overShoulder(s, C.skye, C.lily, 'mcu', { shoulder: 2.8 }) },
  { k: 14, off: -0.1, id: 'skye_ots', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 2.8 }) },
  { k: 15, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 16, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 17, off: -0.1, id: 'lily_ots', cam: (s) => K.overShoulder(s, C.skye, C.lily, 'mcu', { shoulder: 2.8 }) },
  { k: 18, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 19, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 20, off: -0.1, id: 'skye_ots', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 2.8 }) },
  { k: 21, off: -0.1, id: 'lily_ots', cam: (s) => K.overShoulder(s, C.skye, C.lily, 'mcu', { shoulder: 2.8 }) },
  { k: 22, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 23, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 24, off: -0.1, id: 'tea_two', cam: (s) => K.twoShot(s, C.lily, C.skye, { framing: 'ms' }) },
  { k: 25, off: -0.1, id: 'skye_ots', cam: (s) => K.overShoulder(s, C.lily, C.skye, 'mcu', { shoulder: 2.8 }) },
  { k: 26, off: -0.1, id: 'lily_ots', cam: (s) => K.overShoulder(s, C.skye, C.lily, 'mcu', { shoulder: 2.8 }) },
  { k: 27, off: -0.1, id: 'skye_cu', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.4 }) },
  { k: 28, off: -0.1, id: 'lily_cu', cam: (s) => K.camOn(s, C.lily, 'cu', { angle: 0.4 }) },
  { k: 28, off: 'blush', id: 'blush_push', cam: (s, t) => blushPush(s, t) },
  { k: 29, off: 1.6, id: 'end_two', cam: (s) => K.twoShot(s, C.lily, C.skye, { framing: 'ms' }) },
].map((x) => ({ ...x, start: x.off === 'tea' ? T.tea : x.off === 'blush' ? T.blush : x.off === 'end+0.05' ? end(x.k, 0.05) : at(x.k, x.off) }))
  .sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };
function setNamed(name) { return K.setCam(STAGE, SET.cams[name], { blockers: SET.group }); }
function blushPush(s, t) {
  const u = smooth(inv(T.blush, at(29, 1.6), t));
  return K.applyShot(s, K.blendShot(K.camOn(s, C.skye, 'mcu', { angle: 0.4, apply: false }), K.camOn(s, C.skye, 'cu', { angle: 0.4, apply: false }), u));
}

// ---------- faces ----------
// [from time, face] per character; speak() swaps in talking / mouth_o on their own words.
const FACE_SKYE = () => [
  [0, 'shocked'], [at(2, -0.1), 'scheming'], [end(2), 'nervous'], [at(4), 'smug'], [end(4), 'nervous'],
  [at(5), 'shocked'], [at(6), 'nervous'], [at(8), 'happy'], [end(9), 'annoyed'], [T.tea, 'neutral'],
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
    chapter: 5, hatch: 'open', tea, backpack: bpOff, hobbyHorse: t >= at(5, -0.35) + 0.9 ? 'none' : 'boxes',
    hide: tea ? ['teapot', 'cup_1'] : [],
  });
  K.dress(C.skye, bpOff ? 'skye_hoodie' : 'backpack');
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
function blockNest(t, idle) {
  const nest = M.nest();
  K.setLine(C.skye, C.lily, 1);
  // Skye sits in her nest facing the hatch side (sit_cross from the cast when it lands)
  // she was sitting side-on to the hatch with her crackers; she swings round to face it (1.6-2.2 s), head first
  const turn = smooth(inv(1.6, 2.2, t));
  sitOn(C.skye, { pos: nest.pos, heading: -0.9 + (K.faceTo(nest, M.hatchHead()) + 0.9) * turn }, idle);
  headYaw(C.skye, 0.35 * (1 - turn));
  // Lily: head and shoulders up through the hatch, rising a little over the first second; then climbs out and walks in
  // past the boxes (picking up the hobby horse) to stand in front of the nest.
  const hh = M.hatchHead(), climbEnd = T.climb + T.climbDur;
  if (t < T.climb) {
    const p = hh.pos.clone(); p.y -= 0.3 * (1 - smooth(inv(0, T.lilyUp, t)));
    K.playAnim(C.lily, [[A.idle, idle]]); K.putOn(C.lily, { pos: p, heading: K.faceTo(hh, nest) }, { sit: true });
  } else if (t < climbEnd) {
    const u = smooth(inv(T.climb, climbEnd, t)), top = M.hatchTop();
    const p = hh.pos.clone().lerp(V(top.pos.x, 0, top.pos.z + 1.2), u); p.y = hh.pos.y * (1 - u);
    K.playAnim(C.lily, [[A.climb, (t - T.climb) * 1.4]]); K.putOn(C.lily, { pos: p, heading: Math.PI }, { sit: true });
  } else {
    const top = M.hatchTop(), horse = M.horse(), front = M.nestFront();
    const legA = top.pos.distanceTo(horse.pos) / 12, grab = 0.45;
    if (t < climbEnd + legA + grab) {
      const m = K.walk(C.lily, A, top, horse, climbEnd, t, { idleAt: idle });
      if (m.done) K.putOn(C.lily, { pos: horse.pos, heading: horse.heading });
    } else {
      K.walk(C.lily, A, horse, front, climbEnd + legA + grab, t, { idleAt: idle, endHeading: K.faceTo(front, nest) });
    }
  }
  // props: Lily's teddy in her left hand; the hobby horse in her right from the grab until Skye takes it
  const climbDone = T.climb + T.climbDur + M.hatchTop().pos.distanceTo(M.horse().pos) / 12 + 0.3;
  K.hold(P.teddy, C.lily, 'L');
  P.hobby_horse.visible = t >= climbDone;
  if (t >= T.horseGive) K.hold(P.hobby_horse, C.skye, 'R'); else K.hold(P.hobby_horse, C.lily, 'R');
  // crackers in Skye's hand until she drops them for "Boo"
  P.cracker_packet.visible = t < at(2, 0.3);
  K.hold(P.cracker_packet, C.skye, 'L');
  P.teapot.visible = P.cup.visible = P.cupLily.visible = false;
}

// Second half: the tea party at the upturned box (Skye on the hatch side, Lily on the nest side).
function blockTea(t, idle) {
  const sk = M.teaSkye(), li = M.teaLily();
  K.setLine(C.lily, C.skye, 1);
  sitOn(C.skye, sk, idle);
  sitOn(C.lily, li, idle + 0.6, 'kneel');
  // Lily's teddy sits beside her on the floor; the horse lies across Skye's lap (resting on her arm until the cast's
  // lap pose exists); Skye holds a cup, Lily the teapot.
  const tm = K.mark('attic', 'tea_teddy_lily');
  P.teddy.removeFromParent(); STAGE.scene.add(P.teddy); P.teddy.position.copy(tm.pos); P.teddy.rotation.set(0, tm.heading, 0);
  P.hobby_horse.visible = true; K.hold(P.hobby_horse, C.skye, 'L');
  P.cup.visible = true; K.hold(P.cup, C.skye, 'R');
  P.teapot.visible = true; K.hold(P.teapot, C.lily, 'R');
  P.cupLily.visible = false;
  P.cracker_packet.visible = false;
}

// turn an actor's head (radians, + = towards their left) on top of the pose
const _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
function headYaw(actor, yaw) { if (yaw) actor.bones.Head.quaternion.premultiply(_q.setFromAxisAngle(_up, yaw)); }

// Sitting on the floor at a mark: the cast's floor poses when they land (K.sitFloor), else the pack sit with the
// lowest point of the legs on the floor.
function sitOn(actor, mark, idle, style = 'cross') {
  if (K.sitFloor) { K.sitFloor(actor, mark, style, idle); return; }
  K.playAnim(actor, [[A.sit, 10, 1, false], [A.idle, idle, 0.25]]);
  K.putOn(actor, mark);
}

// ---------- overlay ----------
export function overlay(g, s, t) {
  K.dayCard(g, s, t, CARD);
}
