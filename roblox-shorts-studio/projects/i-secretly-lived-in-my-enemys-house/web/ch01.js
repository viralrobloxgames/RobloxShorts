// Chapter 1, "The Dare" (MONDAY 9:47 PM). Shot plan: production/shots/ch01.md. Boundary: source/boundary_sheet.md
// ("Ch1 opening (frame 0)" and "Ch1 | Ch2"). Four scenes: the closet hook (night), the classroom at lunch (earlier that
// day), the back door at dusk, and back to the bedroom ("Day one."). Everything is a pure function of t.
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch01.js --out /tmp/ch01 \
//            --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';
import { clamp, inv, smooth, easeOut, easeIn } from '../../../web/lib/anim.js';

// ---------- CHAPTER ----------
const CH = 1;
const CARD = { day: 'MONDAY', time: '9:47 PM' };
// Estimated spoken lines until audio/chapters/ch01/lines.json exists (same index numbering as lines.json).
const EST = [
  { index: 0, speaker: 'VO', text: "I secretly lived in my enemy's house for a week, and he had no idea.", start: 0.0, end: 4.8 },
  { index: 1, speaker: 'MAX', text: 'Hello? Is somebody in my closet?', start: 5.05, end: 7.4 },
  { index: 2, speaker: 'MAX', text: 'Huh. Just hoodies.', start: 8.65, end: 10.0 },
  { index: 3, speaker: 'SKYE', note: 'whisper', text: 'That was way too close.', start: 10.85, end: 12.5 },
  { index: 4, speaker: 'VO', text: "That's Max. My enemy since kindergarten. And this morning, he started a war.", start: 12.85, end: 17.4 },
  { index: 5, speaker: 'MAX', text: 'You cut the crusts off your sandwich? What are you, five?', start: 17.65, end: 21.7 },
  { index: 6, speaker: 'SKYE', text: "At least my lunch doesn't smell like your gym socks.", start: 21.95, end: 25.4 },
  { index: 7, speaker: 'SKYE', note: 'shriek', text: 'Spider! Get it off! Get it off!', start: 26.45, end: 28.9 },
  { index: 8, speaker: 'MAX', text: "It's rubber, Skye. Wow. You're scared of everything.", start: 29.15, end: 32.1 },
  { index: 9, speaker: 'MAX', text: "I bet you wouldn't last one night in a haunted house.", start: 32.35, end: 36.2 },
  { index: 10, speaker: 'SKYE', text: 'Oh, and nothing scares you, I guess?', start: 36.45, end: 38.9 },
  { index: 11, speaker: 'MAX', text: 'Nothing. My house is so boring, nothing ever happens there. Not even a creaky floor.', start: 39.15, end: 44.7 },
  { index: 12, speaker: 'SKYE', text: "We'll see about that.", start: 44.95, end: 46.4 },
  { index: 13, speaker: 'MAX', text: 'See you tomorrow, scaredy-cat.', start: 46.65, end: 48.4 },
  { index: 14, speaker: 'VO', text: 'So after school, I slipped in through his back door and hid in the last place anyone would look for me.', start: 48.75, end: 56.0 },
  { index: 15, speaker: 'SKYE', note: 'ghost', text: 'Maaax.', start: 56.35, end: 57.4 },
  { index: 16, speaker: 'MAX', text: 'Lily! Go back to bed!', start: 57.65, end: 59.3 },
  { index: 17, speaker: 'LILY', note: 'offscreen', text: "I am in bed! And you're too loud!", start: 59.55, end: 62.6 },
  { index: 18, speaker: 'MAX', text: 'Then who said my name?', start: 62.85, end: 64.5 },
  { index: 19, speaker: 'SKYE', note: 'whisper', text: 'Day one.', start: 65.55, end: 66.5 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(L.end + 0.8);        // "Day one." + room tone
export const sky = K.SKY;
export const samples = () => 1;
const at = (i, off = 0) => L.line(i).start + off;
const end = (i, off = 0) => L.line(i).end + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- key times (all on the narration) ----------
const T = {
  closeup: 1.0, circle: 2.5, circleOff: Math.min(4.4, end(0) - 0.2),
  doorOpen: end(1) + 0.15,          // [+1.0] Max swings the closet door open; the beam sweeps the hoodies
  doorShut: end(2) + 0.1,           // [+0.6] he shuts it and pads back to bed
  class: at(4) - 0.35,              // hard cut: the classroom, earlier that day
  spider: end(6) + 0.2,             // [+0.8] the rubber spider drops into her lunchbox
  jump: at(7) - 0.05,               // Skye leaps up
  exit: at(13) + 0.3,               // Max leaves for the door
  dusk: at(14) - 0.35,              // the back of Max's house
  night: at(15) - 1.2,              // back in the bedroom; three knocks before "Maaax"
  lump: end(18) + 0.15,             // [+0.8] Max yanks the blanket over his head; the closet opens a crack
};
const KNOCKS = [T.night + 0.25, T.night + 0.55, T.night + 0.85];

// ---------- marks (fallbacks are only used until the set defines the mark) ----------
const M = {
  closet: () => K.mark('bedroom', 'closet_inside', { pos: V(-8, 0, 7), heading: -Math.PI / 2 + 0.0 }),
  closetHide: () => K.mark('bedroom', 'closet_hide', { pos: V(-8.6, 0, 8.6), heading: -Math.PI / 2 }),
  closetFront: () => K.mark('bedroom', 'closet_front', { pos: V(-3.5, 0, 6.5), heading: Math.PI / 2 }),
  bedSide: () => K.mark('bedroom', 'bed_side', { pos: V(5, 0, 0), heading: -1.4 }),
  bedLie: () => K.mark('bedroom', 'bed_lie', { pos: V(6.5, 1.6, -3), heading: -1.2 }),
  deskSkye: () => K.mark('classroom', 'desk_skye', { pos: V(-4, 0, -2), heading: Math.PI }),
  deskMax: () => K.mark('classroom', 'desk_max', { pos: V(0, 0, 3), heading: Math.PI }),
  aisle: () => K.mark('classroom', 'aisle_skye', { pos: V(-1.6, 0, -1.2), heading: -Math.PI / 2 }),
  classDoor: () => K.mark('classroom', 'door', { pos: V(8, 0, 6), heading: 0 }),
  extra: (i) => K.mark('classroom', `desk_extra_${i + 1}`, { pos: V([-4, 4, 4, -8][i], 0, [3, -2, 3, 3][i]), heading: Math.PI }),
  yard: () => K.mark('exterior', 'yard_start', { pos: V(-8, 0, 6), heading: 0.9 }),
  backDoor: () => K.mark('exterior', 'back_door', { pos: V(2, 0, 2), heading: Math.PI }),
  inside: () => K.mark('exterior', 'inside_back_door', { pos: V(2, 0, -1.5), heading: Math.PI }),
};
const SIT_DROP = 1.55;                                  // stand-in: the root drops this much when seated on a chair

// ---------- setup ----------
let C, A, P = {}, beam, RED = null, OVL = {};
export async function setup(stage) {
  await K.buildSets(stage, ['bedroom', 'classroom', 'exterior']);
  K.setState({ chapter: 1 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack');
  A = await K.loadAnims(['idle', 'walk', 'run', 'shock', 'point', 'sit', 'laugh', 'proud', 'talk', 'scheming']);
  P.torch = K.makeProp('flashlight'); stage.scene.add(P.torch); K.hold(P.torch, C.max, 'R');
  P.lunchbox = K.makeProp('lunchbox'); stage.scene.add(P.lunchbox);
  P.sandwich = K.makeProp('sandwich'); stage.scene.add(P.sandwich);
  P.spider = K.makeProp('rubber_spider'); stage.scene.add(P.spider);
  beam = K.flashlightBeam(stage);
}

// ---------- helpers ----------
// door controls are the set's (kit-sets-a / kit-sets-c); no-ops until the set has them
const door = (set, name, u) => { if (set.setDoor) set.setDoor(name, u); else if (set.doors?.[name]?.set) set.doors[name].set(u); };
const bed = (set, state) => { if (set.setBed) set.setBed(state); };
// one-arm poses on top of the animation (no two-arms-up): arm bone euler (x forward/back, z sideways)
const armSet = (a, sd, x, y = 0, z = 0) => a.bones['Arm.' + sd].rotation.set(x, y, z);
const handOverMouth = (a) => armSet(a, 'L', -2.35, 0.0, -0.55);     // left hand up across the mouth
const crossArms = (a) => { armSet(a, 'L', -1.35, 0, -0.75); armSet(a, 'R', -1.25, 0, 0.75); };
const hipsHands = (a) => { armSet(a, 'L', 0.1, 0, 0.55); armSet(a, 'R', 0.1, 0, -0.55); };
const headTurn = (a, y, x = 0) => a.bones.Head?.rotation.set(x, y, 0);
const faceAt = (list, t, dflt) => { let f = dflt; for (const [t0, x] of list) if (t >= t0) f = x; return f; };
const offset = (m, dx, dz, dy = 0) => ({ pos: m.pos.clone().add(V(dx, dy, dz)), heading: m.heading });
const fw = (h) => V(Math.sin(h), 0, Math.cos(h));
const rt = (h) => V(-Math.cos(h), 0, Math.sin(h));      // the right of something facing h

// ---------- the shot table ----------
// scene: night1 | class | dusk | night2. cam(stage, t, sh) frames whoever speaks.
const S = {
  hook: { scene: 'night1', cam: (s, t) => closetPov(s, t) },
  skyeCU: { scene: 'night1', cam: (s, t, sh) => push(s, K.camOn(s, C.skye, 'mcu', { angle: 0.35, apply: false }), K.camOn(s, C.skye, 'cu', { angle: 0.35, apply: false }), inv(sh.start, sh.start + 3.5, t)) },
  maxDoor: { scene: 'night1', cam: (s) => K.camOn(s, C.max, 'ms', { angle: 0.75 }) },
  doorOpen: { scene: 'night1', cam: (s, t) => closetPov(s, t, true) },
  maxHoodies: { scene: 'night1', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.3 }) },
  backToBed: { scene: 'night1', cam: (s) => wideRoom(s) },
  skyeWhisper: { scene: 'night1', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.35 }) },
  classWide: { scene: 'class', cam: (s, t, sh) => classWide(s, inv(sh.start, sh.start + 4.5, t)) },
  maxMocks: { scene: 'class', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.85 }) },
  skyeBack: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.85 }) },
  insert: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.9, height: 2.6, look: V(0, -1.2, 0) }) },
  shriek: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.3 }) },
  maxLaugh: { scene: 'class', cam: (s) => K.camOn(s, C.max, 'mcu', { angle: 0.85 }) },
  classTwo: { scene: 'class', cam: (s) => K.twoShot(s, C.skye, C.max, { framing: 'ms' }) },
  skyeAsks: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.85 }) },
  maxBrags: { scene: 'class', cam: (s, t, sh) => push(s, K.camOn(s, C.max, 'ms', { angle: 0.4, apply: false }), K.camOn(s, C.max, 'mcu', { angle: 0.4, apply: false }), inv(sh.start, sh.start + 5, t)) },
  skyeSees: { scene: 'class', cam: (s, t, sh) => push(s, K.camOn(s, C.skye, 'mcu', { angle: 0.35, apply: false }), K.camOn(s, C.skye, 'cu', { angle: 0.35, apply: false }), inv(sh.start, sh.start + 1.6, t)) },
  maxLeaves: { scene: 'class', cam: (s) => K.twoShot(s, C.skye, C.max, { framing: 'ws' }) },
  yardWide: { scene: 'dusk', cam: (s) => yardWide(s) },
  backDoor: { scene: 'dusk', cam: (s) => K.camOn(s, C.skye, 'ms', { angle: 0.6, fov: 38 }) },
  knock: { scene: 'night2', cam: (s) => K.camOn(s, C.skye, 'cu', { angle: 0.35 }) },
  maxBed: { scene: 'night2', cam: (s) => K.camOn(s, C.max, 'ms', { angle: 0.4 }) },
  maxBedCU: { scene: 'night2', cam: (s, t, sh) => push(s, K.camOn(s, C.max, 'mcu', { angle: 0.4, apply: false }), K.camOn(s, C.max, 'cu', { angle: 0.4, apply: false }), inv(sh.start, sh.start + 4, t)) },
  dayOne: { scene: 'night2', cam: (s) => wideRoom(s, true) },
};
const SHOTS = [
  ['hook', 0], ['skyeCU', T.closeup], ['maxDoor', at(1) - 0.1], ['doorOpen', T.doorOpen - 0.15], ['maxHoodies', at(2) - 0.1],
  ['backToBed', T.doorShut], ['skyeWhisper', at(3) - 0.2],
  ['classWide', T.class], ['maxMocks', at(5)], ['skyeBack', at(6)], ['insert', T.spider - 0.15], ['shriek', T.jump],
  ['maxLaugh', at(8)], ['classTwo', at(9)], ['skyeAsks', at(10)], ['maxBrags', at(11)], ['skyeSees', at(12)], ['maxLeaves', at(13)],
  ['yardWide', T.dusk], ['backDoor', at(14, 3.6)],
  ['knock', T.night], ['maxBed', at(16)], ['maxBedCU', at(17)], ['dayOne', T.lump],
].map(([id, start]) => ({ id, start, ...S[id] })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };
const SCENE = { night1: ['bedroom', 'night_moon'], class: ['classroom', 'school_day'], dusk: ['exterior', 'dusk'], night2: ['bedroom', 'night_moon'] };

// ---------- cameras built from the closet's own frame ----------
function push(stage, a, b, u) { return K.applyShot(stage, K.blendShot(a, b, smooth(u))); }
function closetBasis() { const c = M.closet(); return { c, f: fw(c.heading), r: rt(c.heading) }; }
// Inside the closet, behind and beside Skye, looking out through the door gap at Max: both faces read (frame 0).
function closetPov(stage, t, opened = false) {
  const set = K.currentSet();
  if (set.cams.closet_pov && !opened) return K.setCam(stage, set.cams.closet_pov);
  const { c, f, r } = closetBasis();
  const pos = c.pos.clone().addScaledVector(f, -1.6).addScaledVector(r, -2.2).add(V(0, 4.9, 0));
  const tgt = K.headPos(C.max).lerp(K.headPos(C.skye), opened ? 0.15 : 0.45).add(V(0, -0.5, 0));
  return K.setCam(stage, { pos, target: tgt, fov: opened ? 42 : 46 }, { clear: false });
}
function wideRoom(stage, end = false) {
  const set = K.currentSet();
  if (set.cams.two_shot_bed_closet) return K.setCam(stage, set.cams.two_shot_bed_closet);
  return K.twoShot(stage, C.max, C.skye, { framing: 'ws', fov: 40 });
}
function classWide(stage, u) {
  const set = K.currentSet();
  if (set.cams.classroom_wide) return K.setCam(stage, set.cams.classroom_wide);
  const a = K.twoShot(stage, C.skye, C.max, { framing: 'ws', apply: false, fov: 42 }), b = K.twoShot(stage, C.skye, C.max, { framing: 'ms', apply: false, fov: 42 });
  return push(stage, a, b, u * 0.6);
}
function yardWide(stage) {
  const set = K.currentSet();
  if (set.cams.back_door_wide) return K.setCam(stage, set.cams.back_door_wide);
  return K.camOn(stage, C.skye, 'ws', { angle: 0.9, fov: 45 });
}

// ---------- blocking per scene ----------
function night1(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.setLine(C.max, C.skye, 1);
  // closet door: ajar at frame 0 (the camera sees Max through the gap), swings open, shut again
  const open = t < T.doorOpen ? 0.22 : t < T.doorShut ? 0.22 + 0.78 * easeOut(inv(T.doorOpen, T.doorOpen + 0.45, t)) : 1 - easeIn(inv(T.doorShut, T.doorShut + 0.4, t));
  door(set, 'closet', open);
  bed(set, 'normal');
  // Skye: 3/4 to the camera in the closet, left hand over her mouth; ducks behind the hoodies while the door is open
  const c = M.closet(), hideU = smooth(inv(T.doorOpen - 0.35, T.doorOpen, t)) * (1 - smooth(inv(T.doorShut + 0.4, T.doorShut + 0.9, t)));
  const sk = { pos: c.pos.clone().lerp(M.closetHide().pos, hideU), heading: c.heading + 0.95 };
  K.playAnim(C.skye, [[A.idle, idle]]); K.putOn(C.skye, sk);
  if (t < end(3) - 0.6) handOverMouth(C.skye);
  headTurn(C.skye, -0.35);
  // Max: creeps from the bed to the closet (real walk, legs by distance), stops to listen, on to the doors; back to bed
  const bs = M.bedSide(), cf = M.closetFront(), mid = { pos: bs.pos.clone().lerp(cf.pos, 0.45), heading: bs.heading };
  const toCloset = K.faceTo(cf, M.closet());
  if (t < T.doorShut) {
    if (t < at(1) - 1.3) K.walk(C.max, A, { pos: bs.pos.clone().lerp(cf.pos, 0.05), heading: 0 }, mid, -0.5, t, { speed: 7, idleAt: idle, endHeading: toCloset });
    else K.walk(C.max, A, mid, cf, at(1) - 1.3, t, { speed: 7, idleAt: idle, endHeading: toCloset });
    // he looks right at the pink lock (between two hoodies) while the door is open
    headTurn(C.max, t > T.doorOpen + 0.35 && t < at(2) ? -0.25 : 0);
  } else K.walk(C.max, A, cf, bs, T.doorShut + 0.25, t, { speed: 9, idleAt: idle });
  // flashlight up, aimed at the closet
  armSet(C.max, 'R', -1.45, 0, 0.05);
  const sweep = t > T.doorOpen && t < at(2) ? Math.sin((t - T.doorOpen) * 3.2) * 0.35 : 0;
  return { torch: t < T.doorShut + 0.3, sweep };
}

function classScene(t, set, idle) {
  K.only(C, ['skye', 'max', 'extras']);
  K.setLine(C.max, C.skye, 1);
  const sk = M.deskSkye(), mx = M.deskMax(), ai = M.aisle();
  // extras eating at their desks; they turn to look at the shriek
  C.extras.forEach((e, i) => {
    const m = M.extra(i);
    K.playAnim(e, [[A.sit, 0, 1, false], [A.idle, idle + i, 0.3]]);
    K.putOn(e, offset(m, 0, 0, -SIT_DROP), { sit: true, heading: t > T.jump + 0.2 && t < at(10) ? K.faceTo(m, sk) : m.heading });
    e.setFace(t > T.jump + 0.2 && t < at(10) ? 'surprised' : 'happy');
  });
  // Skye: seated, turned towards Max, until the spider; then up and standing her ground
  if (t < T.jump) {
    K.playAnim(C.skye, [[A.sit, 0, 1, false]]);
    K.putOn(C.skye, offset(sk, 0, 0, -SIT_DROP), { sit: true, heading: t < at(5) ? sk.heading : sk.heading + 0.9 });
  } else {
    const up = smooth(inv(T.jump, T.jump + 0.25, t));
    const stand = offset(sk, 0, 0, 0);
    K.playAnim(C.skye, t < end(7) ? [[A.shock, (t - T.jump) * 1.0, 1, false]] : [[A.idle, idle]]);
    K.putOn(C.skye, { pos: stand.pos.clone().add(V(0, -SIT_DROP * (1 - up), 0)), heading: K.faceTo(stand, C.max) });
    if (t > at(10) - 0.2 && t < at(11)) hipsHands(C.skye);
    if (t > at(11) && t < at(12)) crossArms(C.skye);
  }
  // Max: up from his desk, over to Skye's desk during the VO, standing over her; leaves at "See you tomorrow"
  if (t < T.exit) {
    K.walk(C.max, A, mx, ai, T.class + 0.6, t, { idleAt: idle, endHeading: K.faceTo(ai, sk) });
    if (t > at(5) && t < at(5, 1.6)) armSet(C.max, 'R', -1.5, 0, 0.15);           // points at the crusts
    if (t > T.spider - 0.5 && t < T.spider + 0.3) armSet(C.max, 'R', -1.2, 0, 0.35); // holds the spider out over the lunchbox
    if (t > at(8) && t < at(8, 2.2)) armSet(C.max, 'R', -1.6, 0, 0.1);              // holds it up: "It's rubber"
    if (t > at(11) && t < end(11)) crossArms(C.max);
  } else {
    const m = K.walk(C.max, A, ai, M.classDoor(), T.exit, t, { idleAt: idle });
    if (m.moving && t < T.exit + 1.2) armSet(C.max, 'L', -0.2, 0, -2.3);            // one-arm wave over his shoulder
  }
  // lunchbox and sandwich on her desk; the spider in Max's hand, then dropped into the lunchbox, then back in his hand
  const desk = sk.pos.clone().addScaledVector(fw(sk.heading), 1.6).add(V(0, 2.6, 0));
  P.lunchbox.position.copy(desk); P.lunchbox.rotation.set(0, sk.heading, 0); P.lunchbox.visible = true;
  P.sandwich.visible = t < T.jump; P.sandwich.position.copy(desk).add(V(0, 0.3, 0));
  const hand = new THREE.Vector3(); C.max.bones['Arm.R'].localToWorld(hand.set(-0.5, -2.0, 0));
  if (t < T.spider) P.spider.position.copy(hand);
  else if (t < at(8)) P.spider.position.copy(hand.clone().lerp(desk, 1)).add(V(0, 0.25 + 0.6 * (1 - easeIn(inv(T.spider, T.spider + 0.25, t))), 0));
  else P.spider.position.copy(hand);
  P.spider.visible = t > at(5) + 1.6 && t < T.exit;
}

function duskScene(t, set, idle) {
  K.only(C, ['skye']);
  const y = M.yard(), d = M.backDoor(), ins = M.inside();
  const arrive = at(14, 3.4), open0 = arrive + 0.2;
  door(set, 'back_door', t < open0 ? 0 : t < open0 + 1.6 ? easeOut(inv(open0, open0 + 0.4, t)) : 1 - easeIn(inv(open0 + 1.6, open0 + 2.0, t)));
  if (t < open0 + 0.5) {
    K.walk(C.skye, A, y, d, arrive - y.pos.distanceTo(d.pos) / 8, t, { speed: 8, idleAt: idle });
    if (t > arrive - 1.2 && t < arrive - 0.5) headTurn(C.skye, 0.7);            // a glance over her shoulder
  } else {
    const m = K.walk(C.skye, A, d, ins, open0 + 0.5, t, { speed: 8, idleAt: idle });
    C.skye.root.visible = !m.done;
  }
  if (t > arrive - 0.1 && t < open0 + 0.4) armSet(C.skye, 'R', -1.3, 0, 0.1);     // her hand on the handle
}

function night2(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.setLine(C.max, C.skye, 1);
  const crack = t < T.lump ? 0 : 0.12 * easeOut(inv(T.lump + 0.35, T.lump + 0.7, t));
  door(set, 'closet', crack);
  const lumped = t > T.lump + 0.2;
  bed(set, lumped ? 'over_head' : 'normal');
  // Skye in the closet: knocks three times (right knuckles), "Maaax", then her face in the crack
  const c = M.closet();
  const toDoor = t > T.lump;
  K.playAnim(C.skye, [[A.idle, idle]]);
  K.putOn(C.skye, toDoor ? { pos: c.pos.clone().addScaledVector(fw(c.heading), 0.4), heading: c.heading + 0.45 } : { pos: c.pos, heading: c.heading + 0.95 });
  const k = KNOCKS.findIndex((x) => t >= x && t < x + 0.22);
  if (t > KNOCKS[0] - 0.2 && t < KNOCKS[2] + 0.4) armSet(C.skye, 'R', -1.5 + (k >= 0 ? 0.25 * Math.sin((t - KNOCKS[k]) / 0.22 * Math.PI) : 0), 0, 0.2);
  // Max sitting up in bed, flashlight off on the bedside table; yanks the blanket over his head
  const bl = M.bedLie();
  K.playAnim(C.max, [[A.sit, 0, 1, false], [A.idle, idle, 0.3]]);
  K.putOn(C.max, bl, { sit: true });
  C.max.root.visible = !lumped;
  headTurn(C.max, t > at(16) && t < at(18) ? 0.3 : 0);
  return { torch: false };
}

// ---------- faces ----------
function faces(t, sc) {
  const sk = sc === 'night1' ? faceAt([[0, 'scared'], [T.doorShut + 0.5, 'nervous']], t)
    : sc === 'class' ? faceAt([[0, 'happy'], [at(5), 'annoyed'], [T.spider + 0.2, 'shocked'], [at(7), 'scared'], [end(7) + 0.1, 'annoyed'], [at(12) - 0.2, 'scheming']], t)
    : sc === 'dusk' ? 'scheming'
    : 'scheming';
  const mx = sc === 'night1' ? faceAt([[0, 'suspicious'], [at(2), 'neutral'], [end(2) - 0.4, 'happy'], [T.doorShut, 'neutral']], t)
    : sc === 'class' ? faceAt([[0, 'smug'], [at(8), 'laugh'], [at(9), 'smug']], t)
    : faceAt([[0, 'annoyed'], [at(17), 'surprised'], [end(17), 'scared']], t);
  K.speak(C.skye, sk, t, L.said('SKYE'));
  K.speak(C.max, mx, t, L.said('MAX'));
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t), [setId, light] = SCENE[sh.scene];
  const set = K.showSet(setId);
  K.applyLight(stage, light, { set, practicals: { bedside_lamp: false } });
  const idle = K.holdClock(t, L, [[0, T.closeup], [T.doorOpen, T.doorShut + 1.2], [T.spider, T.spider + 0.6], [T.exit, T.exit + 2], [T.dusk, T.dusk + 7.5], [T.night, at(15)], [T.lump, T.lump + 0.8]]);
  let r = {};
  if (sh.scene === 'night1') r = night1(t, set, idle);
  else if (sh.scene === 'class') classScene(t, set, idle);
  else if (sh.scene === 'dusk') duskScene(t, set, idle);
  else r = night2(t, set, idle);
  P.torch.visible = !!r.torch;
  for (const k of ['lunchbox', 'sandwich', 'spider']) if (sh.scene !== 'class') P[k].visible = false;
  faces(t, sh.scene);
  K.setBlockers(set.group, C.skye, C.max);

  sh.cam(stage, t, sh);                                // camera last: it reads the posed actors

  if (r.torch) {
    const from = new THREE.Vector3(); P.torch.getWorldPosition(from);
    const h = C.max.root.rotation.y + (r.sweep || 0); beam.set(true, from, V(Math.sin(h), -0.12, Math.cos(h)));
  } else beam.set(false);

  // red circle on Skye's face in the close-up (2.5 s)
  RED = sh.id === 'skyeCU' && t >= T.circle && t <= T.circleOff ? K.screenOf(stage, K.headPos(C.skye)) : null;
  OVL = { stamp: sh.scene === 'class' ? 'MONDAY 12:15 PM' : sh.scene === 'night1' ? 'MONDAY 9:47 PM' : null };
}

// ---------- overlay (1920x1080 units x s) ----------
export function overlay(g, s, t) {
  if (OVL.stamp) K.timeStamp(g, s, OVL.stamp);
  if (RED) K.redCircle(g, s, t, RED.x, RED.y - 10, 150, { t0: T.circle, t1: T.circleOff });
}
