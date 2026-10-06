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
  { index: 1, speaker: 'VO', text: "I secretly lived in my enemy's house for a week, and he had no idea.", start: 0.0, end: 4.8 },
  { index: 2, speaker: 'MAX', text: 'Hello? Is somebody in my closet?', start: 5.05, end: 7.4 },
  { index: 3, speaker: 'MAX', text: 'Huh. Just hoodies.', start: 8.65, end: 10.0 },
  { index: 4, speaker: 'SKYE', note: 'whisper', text: 'That was way too close.', start: 10.85, end: 12.5 },
  { index: 5, speaker: 'VO', text: "That's Max. My enemy since kindergarten. And this morning, he started a war.", start: 12.85, end: 17.4 },
  { index: 6, speaker: 'MAX', text: 'You cut the crusts off your sandwich? What are you, five?', start: 17.65, end: 21.7 },
  { index: 7, speaker: 'SKYE', text: "At least my lunch doesn't smell like your gym socks.", start: 21.95, end: 25.4 },
  { index: 8, speaker: 'SKYE', note: 'shriek', text: 'Spider! Get it off! Get it off!', start: 26.45, end: 28.9 },
  { index: 9, speaker: 'MAX', text: "It's rubber, Skye. Wow. You're scared of everything.", start: 29.15, end: 32.1 },
  { index: 10, speaker: 'MAX', text: "I bet you wouldn't last one night in a haunted house.", start: 32.35, end: 36.2 },
  { index: 11, speaker: 'SKYE', text: 'Oh, and nothing scares you, I guess?', start: 36.45, end: 38.9 },
  { index: 12, speaker: 'MAX', text: 'Nothing. My house is so boring, nothing ever happens there. Not even a creaky floor.', start: 39.15, end: 44.7 },
  { index: 13, speaker: 'SKYE', text: "We'll see about that.", start: 44.95, end: 46.4 },
  { index: 14, speaker: 'MAX', text: 'See you tomorrow, scaredy-cat.', start: 46.65, end: 48.4 },
  { index: 15, speaker: 'VO', text: 'So after school, I slipped in through his back door and hid in the last place anyone would look for me.', start: 48.75, end: 56.0 },
  { index: 16, speaker: 'SKYE', note: 'ghost', text: 'Maaax.', start: 56.35, end: 57.4 },
  { index: 17, speaker: 'MAX', text: 'Lily! Go back to bed!', start: 57.65, end: 59.3 },
  { index: 18, speaker: 'LILY', note: 'offscreen', text: "I am in bed! And you're too loud!", start: 59.55, end: 62.6 },
  { index: 19, speaker: 'MAX', text: 'Then who said my name?', start: 62.85, end: 64.5 },
  { index: 20, speaker: 'SKYE', note: 'whisper', text: 'Day one.', start: 65.55, end: 66.5 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(Math.max(...L.lines.map((l) => l.end)) + 0.8);   // "Day one." + 0.8 s room tone
export const sky = K.SKY;
export const samples = () => 1;
// line numbers below are 0-based in script order; lines.json counts spoken lines from 1
const at = (i, off = 0) => L.line(i + 1).start + off;
const end = (i, off = 0) => L.line(i + 1).end + off;
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
  night: 0,                         // set below: back in the bedroom; three knocks before "Maaax"
  lump: end(18) + 0.15,             // [+0.8] Max yanks the blanket over his head; the closet opens a crack
};
// dusk: from halfway up the garden path to the back door (a look round at path_near), then in; the door shuts behind her
const DUSK_SPEED = 8, DUSK_LEGS = () => [K.mark('exterior', 'path_mid'), K.mark('exterior', 'path_near'), K.mark('exterior', 'porch_step'), K.mark('exterior', 'back_door')];
T.door = 0;   // filled in setup() from the marks (needs the built sets)
let KNOCKS = [];

// ---------- marks (all from the sets) ----------
const M = {
  closet: () => ({ pos: V(-11.5, 0, 3.0), heading: -1.448 - 0.3 }),         // a little further toward the doors than closet_inside, so the gap camera has room
  closetHoodies: () => ({ pos: V(-13.95, 0, 3.85), heading: Math.PI / 2 + 0.5 }), // pressed in among the right-hand hoodies: only her pink hair pokes out
  closetDeep: () => K.mark('bedroom', 'closet_deep'),
  closetCrack: () => K.mark('bedroom', 'closet_crack'),
  closetFront: () => K.mark('bedroom', 'closet_front'),
  bedSide: () => K.mark('bedroom', 'bed_side'),
  bedSit: () => K.mark('bedroom', 'bed_sit'),
  deskSkye: () => K.mark('classroom', 'desk_skye'),
  aisle: () => K.mark('classroom', 'aisle_mid'),
  skyeSide: () => K.mark('classroom', 'skye_desk_side'),
  classDoor: () => K.mark('classroom', 'door_inside'),
  extra: (i) => K.mark('classroom', `desk_extra_${i + 1}`),
  gate: () => K.mark('exterior', 'gate'),
  pathMid: () => K.mark('exterior', 'path_mid'),
  pathNear: () => K.mark('exterior', 'path_near'),
  step: () => K.mark('exterior', 'porch_step'),
  backDoor: () => K.mark('exterior', 'back_door'),
  inside: () => K.mark('exterior', 'inside_door'),
};

// ---------- setup ----------
let C, A, P = {}, beam, RED = null, OVL = {}, SETS = {};
export async function setup(stage) {
  SETS = await K.buildSets(stage, ['bedroom', 'classroom', 'exterior']);
  K.setState({ chapter: 1 });
  { const lg = DUSK_LEGS(); let d = 0; for (let i = 0; i < lg.length - 1; i++) d += lg[i].pos.distanceTo(lg[i + 1].pos);
    T.door = T.dusk + 0.1 + d / DUSK_SPEED + 0.6 + 0.15;                  // she arrives, the door opens
    T.night = Math.min(T.door + 0.8, at(15) - 1.0);                      // cut back to the closet as she slips inside
    KNOCKS = [T.night + 0.2, T.night + 0.45, T.night + 0.7];
    for (const sh of SHOTS) if (sh.at) sh.start = sh.at(); SHOTS.sort((a, b) => a.start - b.start); }
  C = await K.loadCast(stage.scene);
  A = await K.loadAnims(['idle', 'walk', 'run', 'shock', 'sit', 'laugh', 'point']);
  P.torch = K.makeProp('flashlight', { beam: true }); K.hold(P.torch, C.max, 'R');
  P.lunchbox = K.makeProp('lunchbox', { open: true, spider: true }); stage.scene.add(P.lunchbox);
  P.spider = K.makeProp('rubber_spider'); K.hold(P.spider, C.max, 'R', 'out');
  beam = K.flashlightBeam(stage, { cone: 0 });
}

// ---------- helpers ----------
const bedroom = () => SETS.bedroom, classroom = () => SETS.classroom, exterior = () => SETS.exterior;
// one-arm poses on top of the animation (never both arms up): arm bone euler (x forward/back, z sideways)
const armSet = (a, sd, x, y = 0, z = 0) => a.bones['Arm.' + sd].rotation.set(x, y, z);
const handOverMouth = (a) => K.gesture(a, [-140, 0, 55], 'L');   // the kit's 'hand_over_mouth' mirrored for the left arm (its L mirror points outward)
const crossArms = (a) => K.posture(a, 'arms_folded');
const hipsHands = (a) => { K.gesture(a, 'hand_on_hip', 'L'); K.gesture(a, 'hand_on_hip', 'R'); };
const headTurn = (a, y, x = 0) => a.bones.Head?.rotation.set(x, y, 0);
const faceAt = (list, t, dflt) => { let f = dflt; for (const [t0, x] of list) if (t >= t0) f = x; return f; };
const cam = (set, name) => set.cams[name];
const shotOf = (c) => ({ pos: c.pos.clone(), target: c.target.clone(), fov: c.fov });
function push(stage, a, b, u) { return K.applyShot(stage, K.blendShot(a, b, smooth(clamp(u)))); }
// a set cam pushed in toward its target by k (0..1 of the distance)
// inside the closet, in the gap between the two clusters of hoodies (z 0.7..3.3), behind the rail
const GAP = V(-15.0, 4.5, 2.0);
// close on Skye from inside the closet (3/4 front); k pushes in
const skyeCloset = (k) => { const h = K.headPos(C.skye); const p = h.clone().add(V(-2.9, 0.05, -0.6)); p.lerp(h, k); return { pos: p, target: h.clone().add(V(0, -0.25, 0)), fov: 36 }; };
// classroom: every camera on the +z side of the Skye-Max line (the back rows' side, clear of the seated extras)
const lineN = () => { const d = K.headPos(C.max).sub(K.headPos(C.skye)); d.y = 0; d.normalize(); const n = V(d.z, 0, -d.x); if (n.z < 0) n.negate(); return { d, n }; };
// a 3/4 single: out to the side of the Skye-Max line and a little toward the other person (so we see the face)
const single = (a, side, k) => { const { d, n } = lineN(), h = K.headPos(a); const p = h.clone().addScaledVector(n, 3.9).addScaledVector(d, 2.3 * side).add(V(0, 0.35, 0)); p.lerp(h, k); return { pos: p, target: h.clone().add(V(0, -0.45, 0)), fov: 36 }; };
const pair = (dist) => { const { n } = lineN(), m = K.headPos(C.skye).lerp(K.headPos(C.max), 0.5); return { pos: m.clone().addScaledVector(n, dist).add(V(0, 0.9, 0)), target: m.clone().add(V(0, -0.9, 0)), fov: 38 }; };
const dolly = (c, k) => { const s = shotOf(c); s.pos.lerp(s.target, k); return s; };

// ---------- the shot table ----------
// scene: night1 | class | dusk | night2. cam(stage, t, sh) frames whoever speaks.
const S = {
  hook: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).lerp(K.headPos(C.skye), 0.5).add(V(0, -0.4, 0)), fov: 50 }) },
  skyeCU: { scene: 'night1', cam: (s, t, sh) => push(s, skyeCloset(0), skyeCloset(0.25), inv(sh.start, sh.start + 3.8, t)) },
  maxDoor: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -1.0, 0)), fov: 32 }) },
  doorOpen: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -0.8, 0)), fov: 40 }) },
  pinkLock: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: K.headPos(C.max).add(V(-0.7, 0.1, 0.3)), target: K.headPos(C.skye).add(V(0, 0.45, 0)), fov: 20 }) },   // Max's POV: the pink lock between the hoodies
  maxHoodies: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -0.45, 0)), fov: 24 }) },
  backToBed: { scene: 'night1', cam: (s) => K.setCam(s, cam(bedroom(), 'two_shot_bed_closet'), { clear: false }) },
  skyeWhisper: { scene: 'night1', cam: (s) => K.applyShot(s, skyeCloset(0.2)) },
  classWide: { scene: 'class', cam: (s, t, sh) => push(s, shotOf(cam(classroom(), 'wide_front')), dolly(cam(classroom(), 'wide_front'), 0.3), inv(sh.start, sh.start + 4.5, t)) },
  maxMocks: { scene: 'class', cam: (s) => K.applyShot(s, single(C.max, -1, 0)) },
  skyeBack: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.45, height: 0.9 }) },
  insert: { scene: 'class', cam: (s) => K.setCam(s, cam(classroom(), 'lunchbox_top'), { clear: false }) },
  shriek: { scene: 'class', cam: (s) => K.applyShot(s, single(C.skye, 1, -0.3)) },
  maxLaugh: { scene: 'class', cam: (s) => K.applyShot(s, single(C.max, -1, 0)) },
  classTwo: { scene: 'class', cam: (s) => K.applyShot(s, pair(7.5)) },
  skyeAsks: { scene: 'class', cam: (s) => K.applyShot(s, single(C.skye, 1, 0.1)) },
  maxBrags: { scene: 'class', cam: (s, t, sh) => push(s, single(C.max, -1, 0.1), single(C.max, -1, 0.35), inv(sh.start, sh.start + 5, t)) },
  skyeSees: { scene: 'class', cam: (s, t, sh) => push(s, single(C.skye, 1, 0), single(C.skye, 1, 0.3), inv(sh.start, sh.start + 1.6, t)) },
  maxLeaves: { scene: 'class', cam: (s) => K.setCam(s, cam(classroom(), 'wide_front'), { clear: false }) },
  yardWide: { scene: 'dusk', cam: (s, t, sh) => push(s, shotOf(cam(exterior(), 'dusk_wide')), dolly(cam(exterior(), 'dusk_wide'), 0.35), inv(sh.start, sh.start + 4, t)) },
  backDoor: { scene: 'dusk', cam: (s) => K.applyShot(s, { pos: V(1500 + 1.2, 4.4, -6.2), target: K.headPos(C.skye).add(V(0, -1.3, 0)), fov: 40 }) },
  knock: { scene: 'night2', cam: (s) => K.applyShot(s, skyeCloset(0.1)) },
  maxBed: { scene: 'night2', cam: (s) => K.applyShot(s, { pos: K.headPos(C.max).add(V(2.6, 0.5, 6.0)), target: K.headPos(C.max).add(V(0, -1.0, 0)), fov: 34 }) },
  maxBedCU: { scene: 'night2', cam: (s, t, sh) => { const h = K.headPos(C.max); return push(s, { pos: h.clone().add(V(1.6, 0.3, 4.2)), target: h.clone().add(V(0, -0.4, 0)), fov: 32 }, { pos: h.clone().add(V(1.2, 0.25, 3.2)), target: h.clone().add(V(0, -0.35, 0)), fov: 32 }, inv(sh.start, sh.start + 4, t)); } },
  dayOne: { scene: 'night2', cam: (s) => K.applyShot(s, { pos: V(-0.8, 5.6, -6.6), target: V(-7.8, 3.6, -0.2), fov: 50 }) },
};
const SHOTS = [
  ['hook', 0], ['skyeCU', T.closeup], ['maxDoor', at(1) - 0.1], ['doorOpen', T.doorOpen - 0.15], ['pinkLock', T.doorOpen + 0.45], ['maxHoodies', at(2) - 0.1],
  ['backToBed', T.doorShut], ['skyeWhisper', at(3) - 0.2],
  ['classWide', T.class], ['maxMocks', at(5)], ['skyeBack', at(6)], ['insert', T.spider - 0.15], ['shriek', T.jump],
  ['maxLaugh', at(8)], ['classTwo', at(9)], ['skyeAsks', at(10)], ['maxBrags', at(11)], ['skyeSees', at(12)], ['maxLeaves', at(13)],
  ['yardWide', T.dusk], ['backDoor', () => T.door - 2.0],
  ['knock', () => T.night], ['maxBed', at(16)], ['maxBedCU', at(17)], ['dayOne', T.lump],
].map(([id, start]) => ({ id, start: typeof start === 'function' ? 0 : start, at: typeof start === 'function' ? start : null, ...S[id] })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };
const SCENE = { night1: ['bedroom', 'night_moon'], class: ['classroom', 'school_day'], dusk: ['exterior', 'dusk'], night2: ['bedroom', 'night_moon'] };

// ---------- blocking per scene ----------
function night1(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs');
  // closet doors: ajar at frame 0 (closet_pov sees Max through the gap), swung open, then shut
  const open = t < T.doorOpen ? 0.5 : t < T.doorShut ? 0.5 + 0.42 * easeOut(inv(T.doorOpen, T.doorOpen + 0.45, t)) : 0.92 * (1 - easeIn(inv(T.doorShut, T.doorShut + 0.4, t)));
  set.setClosetDoors(Math.max(open, t < T.doorShut ? 0.95 : open), open); set.setBlanket('flat');
  K.setPractical(set, 'closet_light', t > T.doorOpen && t < T.doorShut ? 1.0 : 0);   // the beam spilling into the closet
  set.setLamp(false);   // left leaf wide (Max seen past it), right leaf ajar
  // Skye: 3/4 to the camera in the closet, left hand over her mouth; presses back into the hoodie gap while the doors are open
  const c = M.closet(), hideU = smooth(inv(T.doorOpen - 0.3, T.doorOpen + 0.05, t)) * (1 - smooth(inv(T.doorShut, T.doorShut + 0.45, t)));
  K.playAnim(C.skye, [[A.idle, idle]]);
  K.putOn(C.skye, { pos: c.pos.clone().lerp(M.closetHoodies().pos, hideU), heading: c.heading + hideU * (M.closetHoodies().heading - c.heading) });
  if (t < end(3) - 0.5 && hideU < 0.5) handOverMouth(C.skye);
  // Max: creeps from the bed to the closet (real walk), stops to listen, on to the doors; then pads back to bed
  const bs = M.bedSide(), cf = M.closetFront(), mid = { pos: bs.pos.clone().lerp(cf.pos, 0.55), heading: K.faceTo(bs, cf) };
  const start = { pos: bs.pos.clone().lerp(cf.pos, 0.2), heading: mid.heading };
  if (t < T.doorShut) {
    if (t < at(1) - 1.4) K.walk(C.max, A, start, mid, -0.35, t, { speed: 7, idleAt: idle, endHeading: K.faceTo(mid, cf) });
    else K.walk(C.max, A, mid, cf, at(1) - 1.4, t, { speed: 7, idleAt: idle, endHeading: cf.heading });
    headTurn(C.max, t > T.doorOpen + 0.35 && t < at(2) ? -0.25 : 0);   // he looks right at the pink lock
  } else K.walk(C.max, A, cf, bs, T.doorShut + 0.25, t, { speed: 10, idleAt: idle });
  const up = t < T.doorShut + 0.2;
  armSet(C.max, 'R', up ? -1.35 : -0.3, 0, 0.05);                   // flashlight up, aimed at the closet
  const sweep = t > T.doorOpen && t < at(2) ? Math.sin((t - T.doorOpen) * 3.2) * 0.3 : 0;
  if (sweep) C.max.bones['Arm.R'].rotation.y = sweep;
  K.hold(P.torch, C.max, 'R'); P.torch.visible = true;
  P.lunchbox.visible = false; P.spider.visible = false;
  return { torch: true };
}

function classScene(t, set, idle) {
  K.only(C, ['skye', 'max', 'extras']);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.skye, 'backpack', false); K.dress(C.max, 'max_school');
  const sk = M.deskSkye(), ai = M.aisle(), side = { ...M.skyeSide() }; side.pos.x -= 0.7;   // a step closer to her desk
  const stand = { pos: V(sk.pos.x + 0.9, 0, sk.pos.z + 0.2), heading: Math.PI / 2 };   // up out of her seat, into the aisle by Max
  // extras eating at their desks; they turn to look at the shriek
  C.extras.forEach((e, i) => {
    const m = M.extra(i), look = t > T.jump + 0.2 && t < at(10);
    K.playAnim(e, [[A.sit, 0, 1, false]]);
    K.putOn(e, m, { sit: true, heading: look ? m.heading + (K.faceTo(m, sk) - m.heading) * 0.5 : m.heading });
    e.setFace(look ? 'surprised' : 'happy');
  });
  // Skye: seated, turned towards Max once he talks, until the spider; then up and standing her ground
  if (t < T.jump) {
    K.playAnim(C.skye, [[A.sit, 0, 1, false]]);
    K.putOn(C.skye, sk, { sit: true, heading: t < at(5) - 0.3 ? sk.heading : sk.heading + (K.faceTo(sk, side) - sk.heading) * 0.6 });
  } else {
    const u = smooth(inv(T.jump, T.jump + 0.3, t));
    K.playAnim(C.skye, t < end(7) ? [[A.shock, (t - T.jump), 1, false]] : [[A.idle, idle]]);
    K.putOn(C.skye, { pos: sk.pos.clone().lerp(stand.pos, u), heading: K.faceTo(stand, side) - 0.4 });   // cheated toward the camera side
    if (u < 1) C.skye.root.position.y = sk.pos.y + (stand.pos.y - sk.pos.y) * u;   // rise from the seat
    if (t > at(10) - 0.2 && t < at(11)) hipsHands(C.skye);
    if (t > at(11) && t < at(12)) crossArms(C.skye);
  }
  // Max: walks over from his column during the VO and stands over her; leaves at "See you tomorrow"
  const toSkye = K.faceTo(side, t < T.jump ? sk : stand) + 0.4;   // cheated toward the camera side
  if (t < T.exit) {
    K.walk(C.max, A, ai, side, T.class + 1.0, t, { idleAt: idle, endHeading: toSkye });
    if (t > at(5) + 0.2 && t < at(5, 1.8)) armSet(C.max, 'R', -1.45, 0, -0.1);           // points at the crusts
    if (t > T.spider - 0.6 && t < T.spider + 0.25) armSet(C.max, 'R', -1.3, 0, -0.25);  // holds the spider over the lunchbox
    if (t > at(8) && t < at(8, 2.2)) armSet(C.max, 'R', -1.7, 0, 0.0);                  // holds it up: "It's rubber"
    if (t > at(11) && t < end(11)) crossArms(C.max);
  } else {
    const m = K.walk(C.max, A, side, M.classDoor(), T.exit, t, { idleAt: idle });
    if (m.moving && t < T.exit + 1.4) armSet(C.max, 'R', -0.2, 0, 2.3);                 // one-arm wave
  }
  // the lunchbox on her desk; the spider in Max's hand, dropped into the lunchbox, picked up again ("It's rubber")
  const top = set.anchors.skyeDeskTop;
  K.place(P.lunchbox, top.clone().add(V(1.0, 0, 0.1)), sk.heading + Math.PI);   // on the aisle side of her desk, in Max's reach
  P.lunchbox.visible = true;
  const sp = P.lunchbox.userData.spider; sp.userData.base ??= sp.position.clone();
  const inBox = t >= T.spider && t < at(8) - 0.1;
  sp.visible = inBox; sp.position.copy(sp.userData.base).add(V(0, 1.4 * (1 - easeIn(inv(T.spider, T.spider + 0.28, t))), 0));
  K.hold(P.spider, C.max, 'R', 'out'); P.spider.visible = !inBox && t > at(5) + 1.8 && t < T.exit;
  P.torch.visible = false;
  return { torch: false };
}

function duskScene(t, set, idle) {
  K.only(C, ['skye']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']);
  const legs = DUSK_LEGS(), sp = DUSK_SPEED;            // a sneaking walk, legs driven by distance
  let t0 = T.dusk + 0.1, m;
  for (let i = 0; i < legs.length - 1; i++) {
    const d = legs[i].pos.distanceTo(legs[i + 1].pos), t1 = t0 + d / sp + (i === 0 ? 0.6 : 0);   // a look round at path_near
    if (t < t1 || i === legs.length - 2) { m = K.walk(C.skye, A, legs[i], legs[i + 1], t0, t, { speed: sp, idleAt: idle, endHeading: legs[i + 1].heading }); break; }
    t0 = t1;
  }
  if (t > T.door - 0.2 && t < T.door + 0.5) headTurn(C.skye, 0.9);   // a grin back over her shoulder
  // the back door is unlocked: it just opens; she slips in and it closes behind her
  const open = t < T.door ? 0 : t < T.door + 1.8 ? easeOut(inv(T.door, T.door + 0.4, t)) : 1 - easeIn(inv(T.door + 1.8, T.door + 2.2, t));
  set.setState({ backDoor: open });
  if (t > T.door - 0.3 && t < T.door + 0.4) armSet(C.skye, 'R', -1.3, 0, 0.1);   // hand on the handle
  if (t >= T.door + 0.5) { const w = K.walk(C.skye, A, M.backDoor(), M.inside(), T.door + 0.5, t, { speed: sp, idleAt: idle }); C.skye.root.visible = !w.done; }
  P.torch.visible = false; P.lunchbox.visible = false; P.spider.visible = false;
  return { torch: false };
}

function night2(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs');
  const lumped = t > T.lump + 0.2;
  set.setClosetDoors(0, t < T.lump + 0.35 ? 0 : 0.3 * easeOut(inv(T.lump + 0.35, T.lump + 0.75, t)));
  set.setBlanket(lumped ? 'over_head' : 'legs'); set.setLamp(false);
  K.setPractical(set, 'closet_light', lumped ? 1.4 : 0);              // a little light in the closet so her grin reads at the crack
  // Skye in the closet: knocks three times on the door (right knuckles), "Maaax", then her face at the crack
  const c = M.closet(), toCrack = smooth(inv(T.lump, T.lump + 0.35, t));
  K.playAnim(C.skye, [[A.idle, idle]]);
  const crackAt = { pos: V(-10.75, 0, 2.95), heading: Math.atan2(-0.8 + 10.75, -6.6 - 2.95) };   // face at the gap the right leaf opens, toward the camera by the window   // leaning out of the gap   // face at the gap the left leaf opens, turned to the camera
  K.putOn(C.skye, { pos: c.pos.clone().lerp(crackAt.pos, toCrack), heading: c.heading + (crackAt.heading - c.heading) * toCrack });
  const k = KNOCKS.findIndex((x) => t >= x && t < x + 0.25);
  if (t > KNOCKS[0] - 0.2 && t < KNOCKS[2] + 0.4) K.gesture(C.skye, 'knock', 'R', k >= 0 ? 1 - 0.35 * Math.sin((t - KNOCKS[k]) / 0.25 * Math.PI) : 1);
  // Max sitting up in bed (flashlight off on the bedside table), then under the blanket
  K.playAnim(C.max, [[A.sit, 0, 1, false]]);
  K.putOn(C.max, M.bedSit(), { sit: true, visible: !lumped });
  armSet(C.max, 'L', -0.1, 0, 0.08); armSet(C.max, 'R', -0.1, 0, -0.08);    // arms down on the blanket
  headTurn(C.max, t > at(16) - 0.3 && t < at(18) ? 0.35 : 0);
  // the flashlight, off, standing on the bedside table
  if (P.torch.parent !== set.group) set.group.add(P.torch);
  P.torch.userData.setOn(false); K.place(P.torch, V(1.2, 3.05, -7.6), 0); P.torch.rotation.x = -Math.PI / 2; P.torch.visible = true;
  P.lunchbox.visible = false; P.spider.visible = false;
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
  K.applyLight(stage, light, { set, practicals: { bedside_lamp: false, moon_window: setId === 'bedroom' } });
  const idle = K.holdClock(t, L, [[0, T.closeup], [T.doorOpen, T.doorShut + 1.2], [T.spider, T.spider + 0.6], [T.exit, T.exit + 2], [T.dusk, T.dusk + 7.5], [T.night, at(15)], [T.lump, T.lump + 0.8]]);
  let r = {};
  if (sh.scene === 'night1') r = night1(t, set, idle);
  else if (sh.scene === 'class') r = classScene(t, set, idle);
  else if (sh.scene === 'dusk') r = duskScene(t, set, idle);
  else r = night2(t, set, idle);
  faces(t, sh.scene);
  K.setBlockers(set.group, C.skye, C.max, ...(sh.scene === 'class' ? C.extras : []));

  sh.cam(stage, t, sh);                                // camera last: it reads the posed actors

  // the flashlight: its own soft cone plus the kit's spot light along the torch's forward axis
  P.torch.userData.setOn(!!r.torch);
  if (r.torch) {
    const from = new THREE.Vector3(), q = new THREE.Quaternion();
    P.torch.getWorldPosition(from); P.torch.getWorldQuaternion(q);
    beam.set(true, from, V(0, 0, 1).applyQuaternion(q));
  } else beam.set(false);

  // red circle on Skye's face in the close-up (2.5 s)
  RED = null;
  if (sh.id === 'skyeCU' && t >= T.circle && t <= T.circleOff) {
    const h = K.headPos(C.skye), c = K.screenOf(stage, h), up = K.screenOf(stage, h.clone().add(V(0, 1.2, 0)));
    RED = { x: c.x, y: c.y + 20, r: Math.min(330, Math.hypot(up.x - c.x, up.y - c.y)) };
  }
  OVL = { stamp: sh.scene === 'class' ? 'MONDAY 12:15 PM' : sh.scene === 'night1' ? 'MONDAY 9:47 PM' : null };
}

// ---------- overlay (1920x1080 units x s) ----------
export function overlay(g, s, t) {
  if (OVL.stamp) K.timeStamp(g, s, OVL.stamp);
  if (RED) K.redCircle(g, s, t, RED.x, RED.y, RED.r, { t0: T.circle, t1: T.circleOff });
}

// for web/ch01_hold.js
export const cast = () => ({ skye: C.skye, max: C.max });
export const TIMES = T;
