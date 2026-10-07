// Chapter 1, "The Dare" (MONDAY 9:47 PM). Shot plan: production/shots/ch01.md. Boundary: source/boundary_sheet.md
// ("Ch1 opening (frame 0)" and "Ch1 | Ch2"). Four scenes: the closet hook (night), the classroom at lunch (earlier that
// day), the back door at dusk, and back to the bedroom ("Day one."). Everything is a pure function of t.
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch01.js --out /tmp/ch01 \
//            --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';
import { clamp, inv, smooth, easeOut, easeIn } from '../../../web/lib/anim.js';
import { waveArm } from '../../../web/lib/gestures.js';

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
  spider: end(6) + 0.3,             // [+0.8] the rubber spider drops into her lunchbox
  maxWalk: at(4) + 1.6,             // he walks up the aisle to her desk, face to camera, arriving before his line
  jump: at(7) - 0.05,               // Skye leaps up
  exit: end(13) - 0.15,             // Max says it from her desk, then leaves for the door
  dusk: at(14) - 0.35,              // the back of Max's house
  night: 0,                         // set below: back in the bedroom; three knocks before "Maaax"
  wake: end(15) + 0.1,              // after "Maaax" he pushes up to sit (on camera)
  lump: end(18) + 0.15,             // [+0.8] Max yanks the blanket over his head; the closet opens a crack
};
// dusk: from halfway up the garden path to the back door (a look round at path_near), then in; the door shuts behind her
const DUSK_SPEED = 8, DUSK_LEGS = () => [K.mark('exterior', 'path_mid'), K.mark('exterior', 'path_near'), K.mark('exterior', 'porch_step'), K.mark('exterior', 'back_door')];
T.door = 0;   // filled in setup() from the marks (needs the built sets)
// Max in bed (3/4 from his left, a little above): headboard, pillow and the duvet over his legs all in frame
const BEDCAM = { pos: V(2.2, 6.6, -1.0), target: V(-4.2, 3.2, -5.2), fov: 42 };
const BLANKET = (t) => (t < T.wake + 0.45 || t > T.lump + 0.2 ? 'lying' : 'sitting');   // kit-sets-a's draped duvet over him lying / sitting
let KNOCKS = [];

// ---------- marks (all from the sets) ----------
const M = {
  closet: () => K.mark('bedroom', 'closet_hide'),   // the walk-in corner behind the bedroom wall: solid wall between her and Max (SA2)   // behind the closed right leaf: out of Max's line of sight, 3/4 to the closet camera         // a little further toward the doors than closet_inside, so the gap camera has room
  closetHoodies: () => ({ pos: V(-13.15, 0, 4.0), heading: Math.PI / 2 + 0.6 }),   // pressed against the right-hand hoodies, only her pink hair past their edge // pressed in among the right-hand hoodies: only her pink hair pokes out
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

const LOCK = V(-13.45, 5.1, 3.88);   // where the pink lock pokes out of the seam between the grey and red hoodies
// walk a path of marks/points (legs driven by distance), starting at t0; returns the last travel state
function walkPath(a, pts, t0, t, opts = {}) {
  const sp = opts.speed ?? 12; let s0 = t0, m = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = pts[i].pos.distanceTo(pts[i + 1].pos), s1 = s0 + d / sp;
    if (t < s1 || i === pts.length - 2) return K.walk(a, A, pts[i], pts[i + 1], s0, t, { ...opts, endHeading: i === pts.length - 2 ? opts.endHeading : undefined });
    s0 = s1;
  }
  return m;
}
const P3 = (set, x, z, h = 0) => ({ pos: K.getSet(set).group.position.clone().add(V(x, 0, z)), heading: h });
// show / hide an actor's leg meshes (Max's legs under the duvet in bed)
function setLegs(a, on) { for (const b of ['Leg.L', 'Leg.R']) a.bones[b].traverse((o) => { if (o.isMesh) o.visible = on; }); }
let STAGE = null, ROUTE = {};
// walk along a set route (waypoints around the furniture, kit-sets-c); legs driven by the distance walked
function routeWalk(a, set, pts, t0, t, { speed = 12, idleAt = 0, endHeading, startHeading, lead = 0.15 } = {}) {
  const len = set.routeLength(pts), RU = 0.3, tt = t - t0 + lead, d = clamp(tt < RU ? speed * tt * tt / (2 * RU) : speed * (tt - RU / 2), 0, len);   // steps off (accelerates over 0.3 s, starting `lead` early so the arrival is unchanged)
  const r = set.alongRoute(pts, d), moving = tt > 0 && d < len, w = smooth(clamp(tt / RU));
  K.playAnim(a, moving ? (w < 1 ? [[A.idle, idleAt, 1 - w], [A.walk, d / 14.5, w]] : [[A.walk, d / 14.5]]) : [[A.idle, idleAt]]);
  K.putOn(a, { pos: r.pos, heading: moving ? r.heading : d >= len ? (endHeading ?? r.heading) : (startHeading ?? r.heading) });
  return { moving, done: d >= len, arrive: t0 + len / speed + RU / 2 - lead };
}
const MAX_FROM = () => K.mark('classroom', 'max_desk_front');                  // Max starts at the front of his desk (row 3)
const BOX = () => K.getSet('classroom').anchors.skyeDeskTop.clone().add(V(1.0, 0, 0.1));   // the lunchbox on Skye's desk

// ---------- setup ----------
let C, A, P = {}, beam, RED = null, OVL = {}, SETS = {};
export async function setup(stage) {
  STAGE = stage;
  SETS = await K.buildSets(stage, ['bedroom', 'classroom', 'exterior']);
  K.setState({ chapter: 1 });
  { const lg = DUSK_LEGS(); let d = 0; for (let i = 0; i < lg.length - 1; i++) d += lg[i].pos.distanceTo(lg[i + 1].pos);
    T.door = T.dusk + 0.1 + d / DUSK_SPEED + 0.6 + 0.15;                  // she arrives, the door opens
    T.night = Math.min(T.door + 1.55, at(15) - 1.0);                     // the door shuts behind her, then back to the closet
    KNOCKS = [T.night + 0.2, T.night + 0.45, T.night + 0.7];
    for (const sh of SHOTS) if (sh.at) sh.start = sh.at(); SHOTS.sort((a, b) => a.start - b.start); }
  { const cl = K.getSet('classroom'), side = K.mark('classroom', 'skye_desk_side').pos;
    ROUTE.in = cl.route(K.mark('classroom', 'desk_max_side_entry').pos.add(V(-1.2, 0, 0)), side);   // from the aisle beside his desk (clear of it)
    ROUTE.out = cl.route(side, K.mark('classroom', 'door_inside').pos);
    T.maxArrive = T.maxWalk + cl.routeLength(ROUTE.in) / 6;
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
const handOverMouth = (a, mix = 1) => K.gesture(a, [-122, 0, 88], 'L', mix);   // the kit's 'hand_over_mouth' mirrored for the left arm (its L mirror points outward)
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
const single = (a, side, k) => { const { d, n } = lineN(), h = K.headPos(a); const p = h.clone().addScaledVector(n, 4.3).addScaledVector(d, 1.1 * side).add(V(0, 0.35, 0)); p.lerp(h, k); return { pos: p, target: h.clone().add(V(0, -0.45, 0)), fov: 36 }; };
const pair = (dist) => { const { n } = lineN(), m = K.headPos(C.skye).lerp(K.headPos(C.max), 0.5); return { pos: m.clone().addScaledVector(n, dist).add(V(0, 0.9, 0)), target: m.clone().add(V(0, -0.9, 0)), fov: 38 }; };
// eases (no one-frame snaps): ramp(t, a, b) rises over [a, a+d] and falls over [b, b+d]
const ramp = (t, a, b = Infinity, d = 0.2) => smooth(inv(a, a + d, t)) * (1 - smooth(inv(b, b + d, t)));
// an arm eased toward an euler (radians) from wherever the pose left it
const armMix = (a, sd, x, y, z, k) => { if (k <= 0) return; const b = a.bones['Arm.' + sd], q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, b.rotation.order)); b.quaternion.slerp(q, Math.min(k, 1)); };
// a prop's world transform when held (so it can fly from one hold to another)
function heldWorld(prop, actor, hand, mode, opts) { K.hold(prop, actor, hand, mode, opts); actor.root.updateMatrixWorld(true); prop.updateWorldMatrix(true, false); return prop.matrixWorld.clone(); }
function flyProp(prop, m0, m1, u) {
  const p0 = new THREE.Vector3(), q0 = new THREE.Quaternion(), s0 = new THREE.Vector3(), p1 = new THREE.Vector3(), q1 = new THREE.Quaternion(), s1 = new THREE.Vector3();
  m0.decompose(p0, q0, s0); m1.decompose(p1, q1, s1);
  if (prop.parent !== STAGE.scene) STAGE.scene.add(prop);
  prop.position.copy(p0.lerp(p1, u)); prop.quaternion.copy(q0.slerp(q1, u)); prop.scale.copy(s0.lerp(s1, u));
}
const dolly = (c, k) => { const s = shotOf(c); s.pos.lerp(s.target, k); return s; };

// ---------- the shot table ----------
// scene: night1 | class | dusk | night2. cam(stage, t, sh) frames whoever speaks.
const S = {
  hook: { scene: 'night1', cam: (s) => K.setCam(s, cam(bedroom(), 'closet_hide_pov'), { clear: false }) },   // Skye 3/4 in the corner, Max beyond the wall edge
  skyeCU: { scene: 'night1', cam: (s, t, sh) => push(s, skyeCloset(0), skyeCloset(0.25), inv(sh.start, sh.start + 3.8, t)) },
  maxDoor: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -1.0, 0)), fov: 32 }) },
  doorOpen: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -0.8, 0)), fov: 40 }) },
  pinkLock: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: V(-10.2, 5.4, 1.6), target: LOCK.clone().add(V(0, -0.3, 0)), fov: 38 }) },   // two hoodies, the pink lock between them, the beam stops on it   // the beam on the hoodies: the pink lock between two of them
  maxHoodies: { scene: 'night1', cam: (s) => K.applyShot(s, { pos: GAP.clone(), target: K.headPos(C.max).add(V(0, -0.45, 0)), fov: 24 }) },
  backToBed: { scene: 'night1', cam: (s) => K.setCam(s, cam(bedroom(), 'two_shot_bed_closet'), { clear: false }) },
  skyeWhisper: { scene: 'night1', cam: (s) => K.applyShot(s, skyeCloset(0.2)) },
  classWide: { scene: 'class', cam: (s, t, sh) => push(s, shotOf(cam(classroom(), 'wide_front')), dolly(cam(classroom(), 'wide_front'), 0.3), inv(sh.start, sh.start + 4.5, t)) },
  maxIntro: { scene: 'class', cam: (s) => { const h = K.headPos(C.max), sd = K.mark('classroom', 'skye_desk_side').pos; return K.applyShot(s, { pos: sd.clone().add(V(-1.6, 4.9, -4.6)), target: h.clone().add(V(0, -0.9, 0)), fov: 36 }); } },
  classWalk: { scene: 'class', cam: (s) => K.setCam(s, cam(classroom(), 'wide_front'), { clear: false }) },   // the walk up the aisle, wide (the route turns him away from the close camera)
  maxMocks: { scene: 'class', cam: (s) => K.applyShot(s, single(C.max, -1, 0)) },
  skyeBack: { scene: 'class', cam: (s) => K.camOn(s, C.skye, 'mcu', { angle: 0.45, height: 0.9 }) },
  insert: { scene: 'class', cam: (s) => K.setCam(s, cam(classroom(), 'lunchbox_top'), { clear: false }) },
  shriek: { scene: 'class', cam: (s) => { const x = single(C.skye, 1, -0.45); x.fov = 44; x.target.y -= 0.5; return K.applyShot(s, x); } },   // wide enough for the spider on her held-out hand
  maxLaugh: { scene: 'class', cam: (s) => { const x = single(C.max, -1, -0.15); x.target.y -= 0.35; x.fov = 42; return K.applyShot(s, x); } },
  classTwo: { scene: 'class', cam: (s) => K.applyShot(s, pair(7.5)) },
  skyeAsks: { scene: 'class', cam: (s) => K.applyShot(s, single(C.skye, 1, 0.1)) },
  maxBrags: { scene: 'class', cam: (s, t, sh) => push(s, single(C.max, -1, 0.05), single(C.max, -1, 0.15), inv(sh.start, sh.start + 5, t)) },
  skyeSees: { scene: 'class', cam: (s, t, sh) => push(s, single(C.skye, 1, 0), single(C.skye, 1, 0.12), inv(sh.start, sh.start + 1.6, t)) },
  maxLeaves: { scene: 'class', cam: (s, t) => t < T.exit ? K.applyShot(s, single(C.max, -1, 0.05)) : K.setCam(s, cam(classroom(), 'wide_front'), { clear: false }) },   // the taunt on his face, then he goes
  yardWide: { scene: 'dusk', cam: (s, t, sh) => push(s, { pos: V(1500 + 2, 11, 34), target: V(1500, 6, -2), fov: 50 }, { pos: V(1500 + 2, 9.5, 26), target: V(1500, 5.5, -2), fov: 50 }, inv(sh.start, sh.start + 4, t)) },   // below the far trees (dusk_wide sits inside them)
  backDoor: { scene: 'dusk', cam: (s) => K.applyShot(s, { pos: V(1500 + 14.5, 5.4, -1.6), target: V(1500 + 5.4, 4.2, -7.8), fov: 44 }) },   // yard side, 3/4: her grin back, the door swinging open
  knockDoors: { scene: 'night2', cam: (s) => K.applyShot(s, { pos: V(-6.0, 4.6, 3.4), target: V(-11.0, 4.2, 2.0), fov: 40 }) },   // the louvred doors rattle with each knock
  knock: { scene: 'night2', cam: (s) => K.applyShot(s, skyeCloset(0.1)) },
  maxWakes: { scene: 'night2', cam: (s) => K.applyShot(s, BEDCAM) },   // 3/4 from the side: pillow, headboard, the L of his body under the duvet
  maxBed: { scene: 'night2', cam: (s) => K.applyShot(s, { ...BEDCAM, pos: V(0.6, 6.2, -2.4), target: V(-4.2, 3.6, -5.6), fov: 40 }) },   // a step closer for his line, the bed still in frame
  maxBedCU: { scene: 'night2', cam: (s, t, sh) => { const h = K.headPos(C.max); return push(s, { pos: h.clone().add(V(3.6, 1.9, 3.4)), target: h.clone().add(V(0, -0.8, 0)), fov: 36 }, { pos: h.clone().add(V(3.1, 1.6, 2.9)), target: h.clone().add(V(0, -0.7, 0)), fov: 36 }, inv(sh.start, sh.start + 4, t)); } },   // 3/4 from his side: pillow and headboard behind him
  dayOne: { scene: 'night2', cam: (s) => K.applyShot(s, { pos: V(2.5, 6.6, -7.8), target: V(-7.0, 3.9, -0.9), fov: 27 }) },
};
const SHOTS = [
  ['hook', 0], ['skyeCU', T.closeup], ['maxDoor', at(1) - 0.1], ['doorOpen', T.doorOpen - 0.15], ['pinkLock', T.doorOpen + 0.35], ['maxHoodies', at(2) - 0.1],
  ['backToBed', T.doorShut], ['skyeWhisper', at(3) - 0.2],
  ['classWide', T.class], ['maxIntro', at(4)], ['classWalk', T.maxWalk + 0.6], ['maxMocks', () => Math.min(T.maxArrive + 0.05, at(5) - 0.1)], ['skyeBack', at(6)], ['insert', T.spider - 0.15], ['shriek', T.jump],
  ['maxLaugh', at(8)], ['classTwo', at(9)], ['skyeAsks', at(10)], ['maxBrags', at(11)], ['skyeSees', at(12)], ['maxLeaves', at(13)],
  ['yardWide', T.dusk], ['backDoor', () => T.door - 0.75],
  ['knockDoors', () => T.night], ['knock', () => T.night + 1.0], ['maxWakes', end(15) + 0.05], ['maxBed', at(16)], ['maxBedCU', at(17)], ['dayOne', T.lump],
].map(([id, start]) => ({ id, start: typeof start === 'function' ? 0 : start, at: typeof start === 'function' ? start : null, ...S[id] })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };
const SCENE = { night1: ['bedroom', 'night_moon'], class: ['classroom', 'school_day'], dusk: ['exterior', 'dusk'], night2: ['bedroom', 'night_moon'] };

// ---------- blocking per scene ----------
function night1(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs');
  // closet doors: ajar at frame 0 (closet_pov sees Max through the gap), swung open, then shut
  // left leaf stands open (the closet camera sees Max through it); the right leaf, closed, hides Skye until Max swings it open
  const openR = t < T.doorOpen ? 0 : t < T.doorShut ? 0.92 * easeOut(inv(T.doorOpen, T.doorOpen + 0.35, t)) : 0.92 * (1 - easeIn(inv(T.doorShut, T.doorShut + 0.4, t)));
  const openL = t < T.doorShut ? 0.95 : 0.95 * (1 - easeIn(inv(T.doorShut, T.doorShut + 0.4, t)));
  set.setClosetDoors(openL, openR); set.setBlanket('flat');
  K.setPractical(set, 'closet_light', t > T.doorOpen && t < T.doorShut ? (t >= T.doorOpen + 0.35 && t < at(2) - 0.1 ? 0.5 : 2.2) : 0);   // dimmer in the insert so the beam reads   // the beam spilling into the closet
  set.setLamp(false);   // left leaf wide (Max seen past it), right leaf ajar
  // Skye: 3/4 to the camera in the closet, left hand over her mouth; presses back into the hoodie gap while the doors are open
  const c = M.closet(), hideU = smooth(inv(T.doorOpen - 0.3, T.doorOpen + 0.05, t)) * (1 - smooth(inv(T.doorShut, T.doorShut + 0.45, t)));
  K.playAnim(C.skye, [[A.idle, idle]]);
  if (t >= T.doorOpen + 0.35 && t < at(2) - 0.1) K.putOn(C.skye, { pos: V(-14.05, 0, 3.88), heading: -Math.PI / 2 });   // the insert: her back to the room, hair in the seam between the grey and red hoodies
  else K.putOn(C.skye, c);   // flat against the wall in the corner the whole time
  if (t < end(3) - 0.2 && !(t >= T.doorOpen + 0.35 && t < at(2) - 0.1)) { const k = 1 - smooth(inv(end(3) - 0.5, end(3) - 0.2, t)); handOverMouth(C.skye, k); headTurn(C.skye, 0.3 * k, 0.12 * k); }   // the hand comes down slowly after the whisper   // head turned into the hand
  // Max: creeps from the bed to the closet (real walk), stops to listen, on to the doors; then pads back to bed
  const bs = M.bedSide(), cf = M.closetFront(), mid = { pos: bs.pos.clone().lerp(cf.pos, 0.55), heading: K.faceTo(bs, cf) };
  // he creeps in from the middle of the room (seen through the open left leaf from Skye's corner); the bedroom wall stays
  // between his eyes and her the whole way (clip_check --sight)
  const start = { pos: V(-4.6, 0, 8.2), heading: K.faceTo(V(-4.6, 0, 8.2), cf) };
  mid.pos.copy(start.pos.clone().lerp(cf.pos, 0.45)); mid.heading = start.heading;
  if (t < T.doorShut) {
    if (t < at(1) - 1.4) K.walk(C.max, A, start, mid, -0.35, t, { speed: 5, idleAt: idle, endHeading: K.faceTo(mid, cf) });
    else K.walk(C.max, A, mid, cf, at(1) - 1.4, t, { speed: 7, idleAt: idle, endHeading: cf.heading });
    headTurn(C.max, t > T.doorOpen + 0.35 && t < at(2) ? -0.25 : 0);   // he looks right at the pink lock
  } else walkPath(C.max, [cf, { pos: V(-1.0, 0, -0.9) }, bs], T.doorShut + 0.25, t, { speed: 10, idleAt: idle });
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
  // all paths keep to the aisles: x -9 runs between Skye's column (desks x -14.8..-11.2) and Max's (x -6.8..-3.2);
  // z -3.4 runs between row 1's chairs and row 2's desks, right across the room to the door
  const sk = M.deskSkye(), side = M.skyeSide();
  const sideIn = { pos: side.pos.clone().add(V(-0.35, 0, 0)), heading: side.heading };            // a step in, to reach the lunchbox
  const stand = { pos: sk.pos.clone().add(V(1.6, 0, 1.1)), heading: Math.PI / 2 };               // up, out of her chair, into the aisle edge
  stand.pos.y = 0;
  // extras eating at their desks; they turn to look at the shriek
  C.extras.forEach((e, i) => {
    const m = M.extra(i), look = t > T.jump + 0.2 && t < at(10);
    K.putOn(e, m, { sit: true, heading: m.heading });
    K.posture(e, 'sit_desk_arms'); e.root.position.y = set.seatY(e.scale);   // forearms on the desk
    if (look) headTurn(e, clamp(K.faceTo(m, sk) - m.heading, -0.7, 0.7));    // heads turn to the shriek
    e.setFace(look ? 'surprised' : 'happy');
  });
  // Skye: seated, turned towards Max once he talks; her right hand rests by the lunchbox (the spider lands on it);
  // then up into the aisle, holding the arm with the spider out away from her ("Get it off!"), and standing her ground
  if (t < T.jump) {
    const turned = smooth(inv(at(5) - 0.45, at(5) - 0.1, t));
    K.putOn(C.skye, sk, { sit: true, heading: sk.heading + (K.faceTo(sk, side) - sk.heading) * 0.45 * turned });
    K.posture(C.skye, K.mixAngles(K.POSES.sit_desk_arms, K.POSES.sit_chair, turned)); C.skye.root.position.y = set.seatY(C.skye.scale);   // eating at the desk, then turned to Max
    armMix(C.skye, 'R', -1.15, 0, 0, smooth(inv(T.spider - 1.35, T.spider - 0.85, t)));          // hand on the desk by the lunchbox
  } else {
    const u = smooth(inv(T.jump, T.jump + 0.3, t));
    K.playAnim(C.skye, [[A.idle, idle]]);
    K.putOn(C.skye, { pos: sk.pos.clone().lerp(stand.pos, u), heading: K.faceTo(stand, side) - 0.4 });   // cheated toward the camera side
    if (u < 1) C.skye.root.position.y = sk.pos.y + (stand.pos.y - sk.pos.y) * u;               // rise from the seat
    const rec = t < end(7) ? smooth(inv(T.jump, T.jump + 0.3, t)) * (1 - smooth(inv(end(7) - 0.3, end(7), t))) : 0;
    if (rec > 0) {                                                                               // recoil: lean back from her own hand
      C.skye.root.rotation.order = 'YXZ'; C.skye.root.rotation.x = -0.15 * rec;
    }
    const out = 1 - smooth(inv(at(8) - 0.15, at(8) + 0.2, t));
    if (out > 0) { K.gesture(C.skye, 'hold_out', 'R', out); C.skye.bones['Arm.R'].rotateZ(0.12 * Math.sin(t * 38) * rec * out); }   // the spider hand held out, away from her, shaking; lowered once he takes it
    { const k = ramp(t, at(10) - 0.2, at(11) - 0.2, 0.25); if (k > 0) { K.gesture(C.skye, 'hand_on_hip', 'L', k); K.gesture(C.skye, 'hand_on_hip', 'R', k); } }
  }
  // Max: up the aisle from beside his desk during the VO, stands at her desk; a step in to drop the spider; leaves along the aisles
  const toSkye = K.faceTo(side, t < T.jump ? sk : stand) + 0.4;                                // cheated toward the camera side
  if (t < T.exit) {
    if (t < T.spider - 1.0) { routeWalk(C.max, set, ROUTE.in, T.maxWalk, t, { speed: 6, idleAt: idle, endHeading: toSkye, startHeading: K.faceTo(ROUTE.in[0], side) }); { const k = 1 - smooth(inv(T.maxWalk, T.maxWalk + 0.3, t)); armMix(C.max, 'L', 0, 0, 0.06, k); armMix(C.max, 'R', 0, 0, -0.06, k); } }   // arms down at his desk
    else { const k = smooth(inv(T.spider - 1.0, T.spider - 0.6, t)) * (1 - smooth(inv(T.spider + 0.7, T.spider + 1.1, t)));   // a small step in to the lunchbox and back, eased
      K.playAnim(C.max, [[A.idle, idle]]); K.putOn(C.max, { pos: side.pos.clone().lerp(sideIn.pos, k), heading: toSkye + (K.faceTo(sideIn, BOX()) + 0.2 - toSkye) * k }); }
    { const k = ramp(t, at(5) + 0.05, at(5, 1.8), 0.22); if (k > 0) K.gesture(C.max, 'point', 'R', k); }   // points at the crusts
    armMix(C.max, 'R', -1.45, 0, 0, ramp(t, T.spider - 0.8, T.spider + 0.3, 0.25));             // hand out over her hand
    armMix(C.max, 'R', -1.45, 0, 0, ramp(t, at(8) - 0.5, at(8) - 0.15, 0.3) );                  // reaches for the spider on her hand
    armMix(C.max, 'R', -2.0, 0, 0.15, ramp(t, at(8) - 0.15, at(8, 2.4), 0.3));                  // holds it up by his face: "It's rubber"
    if (t > at(11) && t < end(11)) { armSet(C.max, 'R', 0, 0, -0.06); K.gesture(C.max, 'hand_on_hip', 'L'); }   // relaxed: arm down, one hand on his hip
  } else {
    const m = routeWalk(C.max, set, ROUTE.out, T.exit, t, { idleAt: idle, lead: 0 });
    if (m.moving && t < T.exit + 1.2) waveArm(C.max, t, 'R');                                    // one-arm wave as he goes
  }
  // the lunchbox on her desk; the spider: Max's palm -> onto her hand -> on her hand while she shrieks -> back in his hand
  K.place(P.lunchbox, BOX(), sk.heading + Math.PI);
  P.lunchbox.visible = true; P.lunchbox.userData.spider.visible = false;
  const ON = { offset: [0, 0.55, -0.2] };   // sitting on top of her hand, not sunk into it
  const H = at(8) - 0.15, falling = t >= T.spider && t < T.spider + 0.3, taking = t >= H && t < H + 0.25, onSkye = t >= T.spider + 0.3 && t < H;
  if (falling) flyProp(P.spider, heldWorld(P.spider, C.max, 'R', 'out'), heldWorld(P.spider, C.skye, 'R', 'out', ON), easeIn(inv(T.spider, T.spider + 0.3, t)));   // drops from his fingers onto her hand
  else if (taking) flyProp(P.spider, heldWorld(P.spider, C.skye, 'R', 'out', ON), heldWorld(P.spider, C.max, 'R', 'out'), smooth(inv(H, H + 0.25, t)));     // he plucks it off her hand
  else if (onSkye) K.hold(P.spider, C.skye, 'R', 'out', ON);
  else K.hold(P.spider, C.max, 'R', 'out');
  P.spider.visible = t > at(5) + 1.8 && t < T.exit;
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
  if (t > T.door - 0.9 && t < T.door + 0.3) headTurn(C.skye, -0.9);   // a grin back over her shoulder
  // the back door is unlocked: it just opens; she slips in and it closes behind her
  const open = t < T.door ? 0 : t < T.door + 1.15 ? easeOut(inv(T.door, T.door + 0.4, t)) : 1 - easeIn(inv(T.door + 1.15, T.door + 1.5, t));   // opens (unlocked), she slips in, it shuts
  set.setState({ backDoor: open });
  if (t > T.door - 0.3 && t < T.door + 0.4) armSet(C.skye, 'R', -1.3, 0, 0.1);   // hand on the handle
  if (t >= T.door + 0.55) { const w = K.walk(C.skye, A, M.backDoor(), M.inside(), T.door + 0.55, t, { speed: sp, idleAt: idle }); C.skye.root.visible = !w.done; }
  P.torch.visible = false; P.lunchbox.visible = false; P.spider.visible = false;
  return { torch: false };
}

function night2(t, set, idle) {
  K.only(C, ['skye', 'max']);
  K.dress(C.skye, ['skye_hoodie', 'backpack']); K.dress(C.max, 'max_pjs');
  const pull = smooth(inv(T.lump + 0.12, T.lump + 0.45, t)), lumped = t > T.lump + 0.4;   // he slides back down (below) while the duvet is pulled up over his head
  const rattle = KNOCKS.reduce((r, x) => r + (t >= x && t < x + 0.16 ? 0.025 * Math.sin(Math.PI * (t - x) / 0.16) : 0), 0);   // each knock shakes the leaf in and out
  const crk = t < T.lump + 0.6 ? rattle : 0.27 * easeOut(inv(T.lump + 0.6, T.lump + 0.95, t));
  set.setClosetDoors(rattle, crk);
  set.setBlanket(pull >= 1 ? 'over_head' : BLANKET(t));
  { const u = set.parts.blanketUp; u.visible = pull > 0; const k = 0.25 + 0.75 * pull;   // the over-head duvet grows from the foot of the bed up over him
    u.scale.set(1, 0.6 + 0.4 * pull, k); u.position.z = -1.75 * (1 - k); }
 set.setLamp(false);
  K.setPractical(set, 'closet_light', 3.0 * smooth(inv(T.lump + 0.3, T.lump + 0.8, t)));              // a little light in the closet so her grin reads at the crack
  // Skye in the closet: knocks three times on the door (right knuckles), "Maaax", then her face at the crack
  const c = M.closet(), toCrack = t > T.lump + 0.15 ? 1 : 0;
  const crackAt = { pos: V(-11.95, 0, 3.4), heading: Math.atan2(2.5 + 11.75, -7.8 - 3.4) + 0.35 };   // face at the gap the right leaf opens, toward the camera by the window   // leaning out of the gap   // face at the gap the left leaf opens, turned to the camera
  K.playAnim(C.skye, [[A.idle, idle]]);
  const knocking = t > KNOCKS[0] - 0.2 && t < KNOCKS[2] + 0.4;
  if (t < T.lump + 0.15) K.putOn(C.skye, { pos: knocking ? c.pos.clone().add(V(-0.9, 0, 0)) : c.pos, heading: knocking ? Math.PI / 2 : c.heading });   // turns to knock on the wall she hides behind
  else { walkPath(C.skye, [c, { pos: V(-13.3, 0, -3.0) }, { pos: V(-13.5, 0, -1.6) }, { pos: V(-12.9, 0, 1.6) }, crackAt], T.lump + 0.15, t, { speed: 12, idleAt: idle, endHeading: crackAt.heading }); }   // out of the corner to the crack while he dives under the blanket
  if (toCrack > 0) { armSet(C.skye, 'L', 0, 0, 0.05); armSet(C.skye, 'R', 0, 0, 0.1); }   // arms down at her sides in the gap
  const k = KNOCKS.findIndex((x) => t >= x && t < x + 0.25);
  if (t > KNOCKS[0] - 0.2 && t < KNOCKS[2] + 0.4) K.gesture(C.skye, 'knock', 'R', k >= 0 ? 1 - 0.35 * Math.sin((t - KNOCKS[k]) / 0.25 * Math.PI) : 1);
  // Max sitting up in bed (flashlight off on the bedside table), then under the blanket
  // Max in bed: lying on his back, head on the pillow, until "Maaax"; lifts his head, pushes up to sit back against the
  // headboard and pillow, legs forward under the duvet; then dives under it (the lump)
  const up = smooth(inv(T.wake, T.wake + 0.9, t)) * (1 - smooth(inv(T.lump, T.lump + 0.35, t))), lift = smooth(inv(at(15) + 0.25, at(15) + 0.6, t));
  const lieRoot = V(-4, 0, -2.85), sitRoot = V(-4, 0, -5.95);   // lying: the rig pivots at the feet, so its head lands on the pillow at z -7.6
  K.putOn(C.max, { pos: lieRoot.clone().lerp(sitRoot, up), heading: 0 }, { sit: true, visible: !lumped });
  const armsIn = { 'Arm.L': [-12, 0, -4], 'Arm.R': [-12, 0, 4] };                                  // arms close in all the way up
  const lieP = { ...K.POSES.lie_back, ...armsIn, Head: [(1 - up) * 30 * lift, 0, 0] };            // head lifts up off the pillow (never dips)
  const sitP = { ...K.POSES.sit_upright, Torso: [-20, 0, 0], ...armsIn };   // leaning back on the pillow, hands on the duvet
  const drop = K.posture(C.max, K.mixAngles(lieP, sitP, up));
  C.max.root.position.y = (1 - up) * 1.9 + up * K.seatY(C.max, 2.0) - 0.7 * pull;   // sinks under the duvet as it comes up
  if (up > 0) C.max.bones.Root.position.y += 0.5 * (1 - up) * C.max.scale;   // the kit lifts the lying root 0.5 only at exactly -90 deg: keep that lift while he rises (no dip)
  setLegs(C.max, false);   // his legs are under the duvet: its leg ridge is them (no separate roll beside plaid legs)   // lying: sunk a little into the mattress and pillow, under the duvet   // body and legs stay under the duvet's ridge (top y 3.07)   // lying: his back on the mattress, head on the pillow
  headTurn(C.max, t > at(17) - 0.1 && t < end(17) + 0.2 ? 0.4 * smooth(inv(at(17) - 0.1, at(17) + 0.25, t)) : t > at(16) - 0.3 && t < at(18) ? 0.35 : 0);   // turns to the wall Lily's voice comes through
  // the flashlight, off, standing on the bedside table
  if (P.torch.parent !== set.group) set.group.add(P.torch);
  P.torch.userData.setOn(false); K.place(P.torch, V(1.2, 3.05, -7.6), 0); P.torch.rotation.x = -Math.PI / 2; P.torch.visible = true;
  P.lunchbox.visible = false; P.spider.visible = false;
  return { torch: false };
}

// ---------- faces ----------
function faces(t, sc) {
  const shriek = sc === 'class' && t >= at(7) - 0.05 && t < end(7) + 0.1;
  const sk = sc === 'night1' ? faceAt([[0, 'scared'], [T.doorShut + 0.5, 'nervous']], t)
    : sc === 'class' ? faceAt([[0, 'happy'], [at(5), 'annoyed'], [T.spider + 0.2, 'shocked'], [at(7), 'scared'], [end(7) + 0.1, 'scared'], [at(8) + 0.5, 'annoyed'], [at(12) - 0.2, 'scheming']], t)
    : sc === 'dusk' ? 'scheming'
    : 'scheming';
  const mx = sc === 'night1' ? faceAt([[0, 'suspicious'], [at(2), 'neutral'], [end(2) - 0.4, 'happy'], [T.doorShut, 'neutral']], t)
    : sc === 'class' ? faceAt([[0, 'smug'], [at(8), 'laugh'], [at(9), 'smug']], t)
    : faceAt([[0, 'annoyed'], [at(17), 'surprised'], [end(17), 'scared']], t);
  if (shriek) C.skye.setFace('shocked');   // terrified the whole line: wide eyes, mouth open in a scream
  else K.speak(C.skye, sk, t, L.said('SKYE'));
  K.speak(C.max, mx, t, L.said('MAX'));
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t), [setId, light] = SCENE[sh.scene];
  setLegs(C.max, true);
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
    let dir = V(0, 0, 1).applyQuaternion(q);
    if (sh.id === 'pinkLock') { const u = easeOut(inv(sh.start, sh.start + 0.5, t)); dir = LOCK.clone().add(V(0, 0.6 * (1 - u), -1.6 * (1 - u))).sub(from).normalize(); }   // sweeps across the hoodies and stops on the pink
    beam.set(true, from, dir);
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
