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
// lines by their order in the chapter (0-based; lines.json numbers them from 1)
const LN = (i) => { const l = L.lines[i]; if (!l) throw new Error(`ch03: no spoken line #${i}`); return l; };
const at = (i, off = 0) => LN(i).start + off;
const endOf = (i, off = 0) => LN(i).end + off;
const inv = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = (u) => u * u * (3 - 2 * u);
const word = (i, k) => { const l = LN(i), ws = L.words.filter((w) => w.speaker === l.speaker && w.start >= l.start - 0.05 && w.end <= l.end + 0.05); return ws[Math.min(k, ws.length - 1)] || { start: l.start, end: l.end }; };

// ---------- marks (kitchen set, local layout in web/kit/sets/kitchen.js; +z is the open camera side) ----------
const PI = Math.PI;
const KO = V(900, 0, 0), W = (x, y, z) => V(x, y, z).add(KO);
const FR_HINGE = [-13, -9.05], DOOR_SKYE = 0.3;            // fridge door hinge (local x, z); Skye works with it 30% open
// where the middle of the letters is with the door open u (world) and the way the door front faces
function lettersAt3(u) {
  const th = -1.75 * u, x = FR_HINGE[0] + 2 * Math.cos(th) + 0.36 * Math.sin(th), z = FR_HINGE[1] - 2 * Math.sin(th) + 0.36 * Math.cos(th);
  return { pos: W(x, 4.6, z), n: V(Math.sin(th), 0, Math.cos(th)), r: V(Math.cos(th), 0, -Math.sin(th)) };
}
const M = {}, CREEP = 11, DADV = 12;                                   // tiptoe speed (studs/s)
function marks() {
  const mk = (n) => K.mark('kitchen', n);
  M.peek = null;
  for (const n of ['fridge_read', 'pantry_inside', 'pantry_gap', 'pantry_front', 'island_end_left', 'island_crouch', 'stairs_top', 'stairs_bottom']) M[n] = mk(n);
  const LD = lettersAt3(DOOR_SKYE);
  const sp = LD.pos.clone().addScaledVector(LD.n, 1.95).addScaledVector(LD.r, -1.25); sp.y = 0;      // front-left of the letters
  M.skyeDoor = { pos: sp, heading: K.faceTo(sp, LD.pos.clone().setY(0)) - 0.85 };   // toward the door, cheated 3/4 to the camera
  M.openCam = LD.pos.clone().addScaledVector(LD.n, 4.4).addScaledVector(LD.r, 2.6).add(V(0, 0.7, 0));
  M.openLook = LD.pos.clone().addScaledVector(LD.r, -0.7).addScaledVector(LD.n, 0.8).add(V(0, -0.1, 0));
  // reading the shut door from outside the door's swing (radius 4 from the hinge), cheated 3/4 to the right
  M.reader = { pos: W(-8.6, 0, -4.8), heading: PI - 0.7 };   // arms clear of the door's swing too
  // the walk from the stairs: down the treads, round the newel and the stair wall (x 11.8), along the back of the island
  M.footOut = { pos: W(13.5, 0, 4.4), heading: 0 };                         // one step clear of the foot (newel at x 11.2, z 1.6)
  M.stairTurn = { pos: W(8.5, 0, 4.4), heading: -PI / 2 };
  M.behind = { pos: W(8.5, 0, -4.6), heading: -PI / 2 };                     // clear of the stair wall (x 10.8)
  M.behindL = { pos: W(-6, 0, -4.6), heading: -PI / 2 };
  // Max makes the sandwich behind the island facing the camera side (stools tucked), between stools 1 and 2
  M.counter = { pos: W(-2.4, 0, -3.15), heading: 0 };
  M.counterBack = { pos: W(-2.4, 0, -4.6), heading: PI / 2 };
  M.skyeCounter = { pos: W(-2.4, 0, -3.55), heading: 0 };                   // half a step further back: her forearm clears the island top
  M.plate = W(-2.4, 3.6, -1.3);                                             // set again in setup from Max's reach (cutPlate)
  M.torchRest = W(0.1, 3.6, -1.7);
  M.hamRest = W(1.7, 3.6, -1.4);
  // Skye's way out of the pantry to the counter, and her hide at the island's left end (out of the stairs' and the back
  // path's sight), then round to the front as Dad leaves
  M.pantryOut = { pos: W(-8.5, 0, -3.6), heading: PI / 2 };
  M.hideEnd = { pos: W(-7.3, 0, -0.3), heading: -PI / 2 };
  M.hideFront = { pos: W(-4.3, 0, 2.75), heading: 0.2 };
  M.endRun = { pos: W(-8.0, 0, -3.6), heading: PI };
}

// ---------- key times ----------
const T = {};
const arrive = (pts, t0, v) => { let tt = t0; for (let i = 0; i < pts.length - 1; i++) tt += pts[i].pos.distanceTo(pts[i + 1].pos) / v; return tt; };
const DOWN = () => [M.stairs_top, M.stairs_bottom, M.footOut, M.stairTurn, M.behind, M.behindL, M.reader];
function times() {
  T.reach1 = 0.9; T.reach2 = 2.7;                                          // C, then E go up during the VO
  T.letters = [word(2, 0).start, word(2, 1).start, word(2, 2).start, word(2, 3).start]; // BE / NICE / 2 / SKYE
  T.freeze = endOf(2, 0.05); T.shut1 = T.freeze + 0.3; T.dive = T.shut1 + 0.25;
  T.maxIn = at(3, -1.3);                                                   // Max at the top of the stairs
  T.reachMax = endOf(4, 0.05); T.read = T.reachMax + 0.35;
  T.open2 = endOf(8, 0.0); T.toIsland = T.open2 + 1.15; T.shut2 = T.toIsland - 0.45;
  T.make0 = word(9, 6).start; T.make1 = at(10, 0.05); T.cut0 = endOf(9, 0.3); T.cut1 = endOf(9, 0.85);                       // the sandwich (from "Who even is Skye?" over the [+1.0])
  T.plateOut = at(10, 0.35);
  T.maxOut = endOf(10, -0.35);
  T.creep = endOf(10, -0.05);
  T.grab = arrive([M.pantry_inside, M.pantry_front, M.pantryOut, M.counterBack, M.skyeCounter], T.creep, CREEP) + 0.45;
  T.duck = endOf(12, 0.05); T.dadIn = endOf(12, 0.1);
  T.lookUp = at(15, 0.05);
  T.open3 = at(16, -0.2); T.ham = at(16, 0.45); T.bite = endOf(16, 0.05);
  T.shut3 = endOf(17, -0.75); T.dadOut = endOf(17, -0.2);
  T.exhale = at(18, -0.6);
  T.maxAt = arrive(DOWN(), T.maxIn, 12);
  T.maxBottom = arrive([M.stairs_top, M.stairs_bottom], T.maxIn, 12); T.dadBottom = arrive([M.stairs_top, M.stairs_bottom], T.dadIn, DADV); T.dadBehind = arrive(DOWN().slice(0, 5), T.dadIn, DADV);
  T.dadAt = arrive(DOWN(), T.dadIn, DADV);
  T.round = T.dadBehind + 0.25;                             // Dad at x ~4 on the back path: she slips round to the front
}

// ---------- setup ----------
let C, A, P = {}, beam, set, SCENE;
export async function setup(stage) {
  SCENE = stage.scene;
  await K.buildSets(stage, ['kitchen']);
  K.setState({ chapter: 3 });
  set = K.getSet('kitchen');
  marks();
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs'); K.dress(C.dad, 'dad_robe');
  A = await K.loadAnims(['idle', 'walk', 'run', 'duck', 'sit', 'horror_reach', 'horror_listen', 'horror_torch_hold', 'typing', 'think', 'shrug', 'look_up', 'talk', 'scheming', 'hold']);
  const add = (k, id, o) => { P[k] = K.makeProp(id, o); stage.scene.add(P[k]); return P[k]; };
  add('letters', 'magnet_letters', { letters: 'CE2SKYE' }); add('torch', 'flashlight'); add('torchDown', 'flashlight'); add('knife', 'knife');
  add('sandwich', 'sandwich', { filling: 'ham' }); add('bitten', 'sandwich', { filling: 'ham', bitten: 'half_eaten' }); add('onPlate', 'sandwich', { filling: 'ham' }); add('withCrust', 'sandwich', { filling: 'ham', crusts: true }); add('knifeIns', 'knife');
  add('plate', 'plate'); add('ham', 'ham'); add('dadHam', 'ham'); add('milk', 'milk');
  beam = K.flashlightBeam(stage);
  times();
  cutGeometry();
}


// ---------- shots ----------
// Skye's fridge shots from the front-left (pantry side); Max and Dad at the fridge from the front-right over the back
// counter; the pantry from outside (pantry_peek). All on the room side of the pantry <-> fridge line.
// Fixed set-ups (kitchen-local positions) aimed at whoever they frame; no wall-pulling (the walls hide themselves).
const FR = { cu: [2.6, 0.04], mcu: [3.8, 0.1], ms: [4.8, 0.18] };
function fix(pos, who, framing, o = {}) {
  return (s) => {
    const P0 = W(...pos), S = C[who].scale || 1, [span0, up] = FR[framing], span = span0 * S;
    const target = K.headPos(C[who]).add(V(0, -up * span + (o.up || 0), 0));
    const d = P0.distanceTo(target), fov = THREE.MathUtils.radToDeg(2 * Math.atan(span / 2 / d));
    return K.applyShot(s, { pos: P0, target, fov });
  };
}
const cam = (id) => (s) => K.setCam(s, set.cams[id], { clear: false });
const on = (who, framing, o = {}) => (s) => K.camOn(s, C[who], framing, o);
function lettersInsert(s, u) {
  const LD = lettersAt3(u), pos = LD.pos.clone().addScaledVector(LD.n, 3.0).addScaledVector(LD.r, 2.6).add(V(0, 0.3, 0));
  return K.applyShot(s, { pos, target: LD.pos.clone(), fov: 34 });
}
const WALK_IN = [-14.2, 5.4, -1.6], AT_FRIDGE = [-4.6, 5.3, -6.0], AT_ISLAND = [-1.2, 5.7, 6.2], PEEK = [-10.2, 4.8, -0.3], HIDE = [-2.2, 3.0, 7.2], LOW = [0.6, 2.4, 7.6];
const SHOTS = [
  { at: () => 0, id: 'open', cam: (s, t) => { const u = sm(inv(0, at(1), t)); return K.applyShot(s, { pos: M.openCam.clone().lerp(M.openLook, 0.18 * u), target: M.openLook, fov: 44 }); } },
  { at: () => at(1), id: 'skye_letters', cam: fix([-7.6, 5.2, -5.2], 'skye', 'mcu') },
  { at: () => at(2), id: 'letters_insert', cam: (s) => lettersInsert(s, DOOR_SKYE) },
  { at: () => T.freeze, id: 'wide_dive', cam: cam('fridge_wide') },
  { at: () => Math.max(T.maxIn, T.dive + 0.55), id: 'max_stairs', cam: cam('stairs_bottom') },
  { at: () => T.maxBottom + 0.5, id: 'max_walks', cam: fix(WALK_IN, 'max', 'ms') },
  { at: () => at(4), id: 'max_vampire', cam: fix(AT_FRIDGE, 'max', 'mcu') },
  { at: () => word(4, 3).start, id: 'skye_peek', cam: fix(PEEK, 'skye', 'cu') },
  { at: () => word(4, 5).start - 0.05, id: 'max_garlic', cam: fix(AT_FRIDGE, 'max', 'mcu') },
  { at: () => Math.min(T.maxAt + 0.1, T.reachMax - 0.1), id: 'max_fridge', cam: fix(AT_FRIDGE, 'max', 'ms') },
  { at: () => at(5), id: 'letters_max', cam: fix(AT_FRIDGE, 'max', 'ms', { up: 0.1 }) },
  { at: () => at(6), id: 'max_mcu', cam: fix(AT_FRIDGE, 'max', 'mcu') },
  { at: () => at(7), id: 'skye_peek2', cam: fix(PEEK, 'skye', 'cu') },
  { at: () => at(8), id: 'max_deal', cam: fix(AT_FRIDGE, 'max', 'mcu') },
  { at: () => T.open2, id: 'max_raid', cam: fix(AT_FRIDGE, 'max', 'ms') },
  { at: () => T.toIsland + 0.2, id: 'max_island', cam: fix(AT_ISLAND, 'max', 'ms') },
  { at: () => word(9, 4).start, id: 'skye_react', cam: fix(PEEK, 'skye', 'cu') },
  { at: () => word(9, 6).start, id: 'max_sandwich', cam: fix(AT_ISLAND, 'max', 'ms') },
  { at: () => endOf(9, 0.0), id: 'sandwich_insert', cam: (s) => K.applyShot(s, { pos: M.plate.clone().add(V(1.3, 2.4, 3.6)), target: M.plate.clone().add(V(-0.2, 0.3, -0.3)), fov: 34 }) },
  { at: () => at(10), id: 'max_plate', cam: fix(AT_ISLAND, 'max', 'mcu') },
  { at: () => T.maxOut, id: 'wide_swap', cam: cam('fridge_wide') },
  { at: () => Math.max(at(11, 0.15), T.grab - 0.5), id: 'skye_crusts', cam: fix(AT_ISLAND, 'skye', 'mcu') },
  { at: () => at(12), id: 'skye_smug', cam: fix(AT_ISLAND, 'skye', 'ms') },
  { at: () => T.duck - 0.05, id: 'wide_dad', cam: cam('stairs_wide') },
  { at: () => T.dadBehind + 0.1, id: 'dad_walk', cam: fix(WALK_IN, 'dad', 'ms') },
  { at: () => T.dadAt - 0.05, id: 'dad_snack', cam: fix(AT_FRIDGE, 'dad', 'ms') },
  { at: () => at(14), id: 'dad_reads', cam: fix(AT_FRIDGE, 'dad', 'mcu') },
  { at: () => at(15), id: 'dad_up', cam: fix(AT_FRIDGE, 'dad', 'mcu') },
  { at: () => at(16), id: 'dad_ham', cam: fix(AT_FRIDGE, 'dad', 'ms', { up: -0.8 }) },
  { at: () => T.bite, id: 'skye_chew', cam: fix(HIDE, 'skye', 'cu') },
  { at: () => at(17, 0.9), id: 'dad_hungry', cam: fix(AT_FRIDGE, 'dad', 'ms', { up: -0.8 }) },
  { at: () => T.dadOut, id: 'low_behind', cam: fix(LOW, 'skye', 'ms', { up: 0.4 }) },
];
let SH = null;
const shotAt = (t) => { SH ||= SHOTS.map((x) => ({ ...x, start: x.at() })).sort((a, b) => a.start - b.start); let s = SH[0]; for (const x of SH) if (t >= x.start) s = x; return s; };

// ---------- helpers ----------
// A walk through marks/points from t0: { pos, heading, moving, anim, done, arrive }.
function route(pts, t0, t, speed = 12) {
  let tt = t0, r = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i].pos || pts[i], b = pts[i + 1].pos || pts[i + 1];
    r = travel(a, b, tt, t, speed);
    if (Math.abs(a.x - b.x) < 0.01 && Math.abs(a.x - M.stairs_top.pos.x) < 0.01) r.pos.y = set.stairFootY(r.pos.z - 0.45);   // feet on the higher tread under the body (kit stairsPath rule)
    if (!r.done) return r;
    tt = r.arrive;
  }
  return r;
}
// put a prop on a surface (world pos), taking it out of any hand first
function put(prop, pos, heading = 0) { if (prop.parent !== SCENE) SCENE.add(prop); K.place(prop, pos, heading); prop.visible = true; return prop; }
const walkAnim = (r, speed = 12) => [[speed >= 14 ? A.run : A.walk, r.anim]];
function place(actor, at, layers, heading) { K.playAnim(actor, layers); K.putOn(actor, at, heading === undefined ? {} : { heading }); }
// a walk that ends on a mark; while still: the given layers and heading
function walkTo(actor, pts, t0, t, speed, still, heading) {
  const r = route(pts, t0, t, speed);
  if (r.moving && r.pos.y > 0.05 && actor === C.dad) {     // Dad shuffles down the stairs (small steps, no leg through a tread)
    K.putOn(actor, { pos: r.pos, heading: r.heading }); const d = K.posture(actor, K.gait('shuffle', r.anim)); actor.root.position.y -= d || 0;
  } else if (r.moving) place(actor, { pos: r.pos }, walkAnim(r, speed), r.heading);
  else if (r.done) place(actor, pts[pts.length - 1], still, heading ?? pts[pts.length - 1].heading);
  else place(actor, pts[0], still, pts[0].heading);
  return r;
}
// the letters on the door: two padded lines so the layout never shifts as letters go up
function lettersText(t) {
  const full = 'BE NICE\n2 SKYE';
  let n = 5;                                               // "BE NI"
  if (t >= T.reach1 + 0.55) n = 6;
  if (t >= T.reach2 + 0.55) n = 7;
  if (t >= T.letters[2]) n = 9;                             // + "2"
  if (t >= T.letters[3]) n = 11 + Math.min(3, Math.floor((t - T.letters[3]) / 0.14));
  return [...full].map((c, i) => (i < n || c === '\n' ? c : ' ')).join('');
}
const ramp = (t, a, b, d = 0.35) => sm(inv(a, a + d, t)) * (1 - sm(inv(b, b + 0.3, t)));
const fridgeAt = (t) => Math.max(DOOR_SKYE * (1 - sm(inv(T.shut1, T.shut1 + 0.3, t))), ramp(t, T.open2, T.shut2), ramp(t, T.open3, T.shut3));
const PEEKS = ['skye_peek', 'skye_peek2', 'skye_react'];
function pantryAt(t, shot) {                               // the slatted doors: open for her, shut behind her, a crack for her peeks
  if (t < T.dive) return 0;
  if (t < T.dive + 1.2) return sm(inv(T.dive, T.dive + 0.3, t)) * (1 - sm(inv(T.dive + 0.85, T.dive + 1.2, t)));
  if (t < T.creep) return PEEKS.includes(shot) ? 0.3 : 0;
  return sm(inv(T.creep, T.creep + 0.25, t)) * (1 - sm(inv(T.creep + 1.1, T.creep + 1.45, t)));
}

// ---------- the crust cut: Max's (rigid R6) right arm sweeps about the shoulder, so the knife in his palm runs along an
// arc; the plate and the sandwich are placed so that arc runs just outside the sandwich's edge.
const CUT = {};
const ARM_G = V(-0.5, -1.3, 0);                           // the palm grip in the right arm bone's frame (x scale)
function cutGeometry() {
  const mx = C.max, S = mx.scale || 1;
  K.putOn(mx, M.counter); K.playAnim(mx, [[A.idle, 0]]); mx.root.updateMatrixWorld(true);
  const sh = mx.bones['Arm.R'].getWorldPosition(V(0, 0, 0)), Lr = ARM_G.length() * S;
  CUT.dy = 3.6 + 0.055 + 0.3 - sh.y;                     // blade at the middle of the sandwich's height
  CUT.rh = Math.sqrt(Math.max(0.01, Lr * Lr - CUT.dy * CUT.dy));
  CUT.th0 = -0.55; CUT.sweep = 0.55;                      // forward and a little to his right; the stroke sweeps 0.55 rad
  const palm = (u, base = sh) => { const th = CUT.th0 + (0.5 - u) * CUT.sweep; return base.clone().add(V(CUT.rh * Math.sin(th), CUT.dy, CUT.rh * Math.cos(th))); };
  CUT.palm = palm;
  const p0 = palm(0), p1 = palm(1), mid = p0.clone().lerp(p1, 0.5), tdir = p1.clone().sub(p0).setY(0).normalize();
  const radial = V(Math.sin(CUT.th0), 0, Math.cos(CUT.th0));
  const centre = mid.clone().addScaledVector(radial, 0.41).setY(3.6 + 0.055);
  CUT.h = Math.atan2(tdir.x, tdir.z);                      // the blade and the sandwich's long edges along the stroke
  M.sandwichH = CUT.h;
  M.sandwichAt = centre.clone().addScaledVector(tdir, -0.42);   // the sandwich's grip (back edge) on the plate
  M.plate = centre.clone().setY(3.6);
}
function cutArm(t) {
  const mx = C.max, bone = mx.bones['Arm.R'];
  const u = sm(inv(T.cut0, T.cut1, t)), blend = sm(inv(T.cut0 - 0.15, T.cut0, t)) * (1 - sm(inv(T.cut1, T.cut1 + 0.2, t)));
  mx.root.updateMatrixWorld(true);
  const sh = bone.getWorldPosition(V(0, 0, 0)), dirW = CUT.palm(u, sh).sub(sh).normalize();
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const want = new THREE.Quaternion().setFromUnitVectors(ARM_G.clone().normalize(), dirW.applyQuaternion(pq));
  bone.quaternion.slerp(want, blend);
  mx.root.updateMatrixWorld(true);
  CUT.yaw = CUT.h - mx.root.rotation.y;
}

// ---------- update ----------
export function update(t, stage) {
  const sh = shotAt(t);
  set = K.showSet('kitchen');
  K.applyLight(stage, 'night_fridge');                      // the set's own night practicals + the fridge light follow setState
  const fo = fridgeAt(t);
  K.setState({ fridge: lettersText(t), fridgeOpen: fo, pantryDoors: pantryAt(t, sh.id), plate: null, practicals: { ceiling_light: 0 } });
  const idle = K.holdClock(t, L, [[T.maxIn, at(3, 2.5)], [T.dadIn, at(13, 2.5)], [T.toIsland, T.make1]]);
  const vis = ['skye'];
  if (t >= T.maxIn && t < T.maxOut + 3) vis.push('max');
  if (t >= T.dadIn && t < T.dadOut + 4) vis.push('dad');
  K.only(C, vis);
  K.setBlockers();
  K.clearLine();
  for (const p of Object.values(P)) p.visible = false;

  // ----- Skye -----
  const sk = C.skye;
  let skFace = 'scheming';
  const reachG = (actor, side, t0, t1) => { const u = sm(inv(t0, t0 + 0.25, t)) * (1 - sm(inv(t1 - 0.25, t1, t))); if (u > 0.01) K.gesture(actor, 'hold_out', side, u); };
  if (t < T.dive) {                                         // at the fridge door, letters going up; freezes at the footsteps
    const reach = (t0) => Math.sin(PI * inv(t0, t0 + 1.0, t));
    const r = Math.max(reach(T.reach1), reach(T.reach2), ...T.letters.slice(1).map((x) => reach(x - 0.4)));
    if (t < T.freeze) {
      place(sk, M.skyeDoor, [[A.idle, idle]]);
      K.gesture(sk, 'cup_hold', 'L', 1);                                   // the handful held up in her left palm
      if (r > 0.01) K.gesture(sk, 'tap', 'R', r);                         // a letter onto the door
      P.letters.visible = true; K.hold(P.letters, sk, 'L');
    } else {                                                // listens (head to the stairs), then pushes the fridge shut
      skFace = 'scared';
      const turn = sm(inv(T.freeze, T.freeze + 0.25, t));
      place(sk, M.skyeDoor, [[A.horror_listen, 0.9 + (t - T.freeze)]], M.skyeDoor.heading - 0.6 * turn);
      reachG(sk, 'R', T.shut1 - 0.3, T.shut1 + 0.05);
    }
  } else if (t < T.creep) {                                 // through the open pantry doors, deep inside; at the gap only for her peeks
    skFace = 'scared';
    const r = route([M.skyeDoor, M.pantry_front, M.pantry_inside], T.dive, t, 16);
    if (r.moving) place(sk, { pos: r.pos }, walkAnim(r, 16), r.heading);
    else place(sk, PEEKS.includes(sh.id) && t > T.dive + 1.2 ? M.pantry_gap : M.pantry_inside, [[A.idle, idle]], PI / 2);
    if (t > at(4, 0.3)) skFace = t < at(5) ? 'smug' : t < at(9) ? 'scheming' : 'surprised';
  } else if (t < T.duck) {                                  // tiptoes out round the back of the island, takes the sandwich
    skFace = t < at(12) ? 'surprised' : 'smug';
    const r = route([M.pantry_inside, M.pantry_front, M.pantryOut, M.counterBack, M.skyeCounter], T.creep, t, CREEP);
    if (r.moving) { K.putOn(sk, { pos: r.pos, heading: r.heading }); const d = K.posture(sk, K.gait('creep', r.anim)); sk.root.position.y = r.pos.y - d; }
    else {
      place(sk, M.skyeCounter, [[A.idle, idle]]);
      reachG(sk, 'R', T.grab - 0.45, T.grab + 0.2);                      // reaches to the plate ...
      if (t >= T.grab) K.gesture(sk, 'chin_hand', 'R', 0.6 * sm(inv(T.grab + 0.05, T.grab + 0.4, t)));   // ... lifts it to her chest
    }
    if (t >= T.grab) { P.sandwich.visible = true; K.hold(P.sandwich, sk, 'R'); }
  } else if (t < T.round) {                                 // runs round to the island's left end and sits tight against it
    const r = route([M.skyeCounter, M.counterBack, M.endRun, M.hideEnd], T.duck, t, 14);
    if (r.moving) place(sk, { pos: r.pos }, walkAnim(r, 14), r.heading);
    else { K.putOn(sk, M.hideEnd); const d = K.posture(sk, 'sit_cross'); sk.root.position.y = M.hideEnd.pos.y - d; K.gesture(sk, 'chin_hand', 'R', 0.6); }
    skFace = 'scared';
    const s = t >= T.bite ? P.bitten : P.sandwich; s.visible = true; K.hold(s, sk, 'R');
  } else {                                                  // as Dad leaves along the back, she crawls round to the front
    const r = route([M.hideEnd, { pos: W(-7.3, 0, 2.75) }, M.hideFront], T.round, t, 6);
    K.putOn(sk, { pos: r.moving ? r.pos : M.hideFront.pos, heading: r.moving ? r.heading : M.hideFront.heading });
    const d = r.moving ? K.posture(sk, K.gait('crawl', r.anim)) : K.posture(sk, 'sit_cross');
    sk.root.position.y = M.hideFront.pos.y - d;
    if (!r.moving) K.gesture(sk, 'chin_hand', 'R', 0.6);
    skFace = t < T.exhale ? 'scared' : 'happy';
    P.bitten.visible = true; K.hold(P.bitten, sk, 'R');
  }
  const skLine = L.lines.find((l) => l.speaker === 'SKYE' && t >= l.start - 0.1 && t < l.end + 0.1);
  K.speak(sk, skFace, t, L.said('SKYE'), { whisper: skLine?.note === 'whisper' });

  // ----- Max -----
  const mx = C.max;
  beam.set(false);
  if (vis.includes('max')) {
    let face = 'scared';
    if (t < T.toIsland) {                                   // down the stairs, round the back of the island, to the fridge
      const still = [[A.idle, idle], [A.horror_torch_hold, 0.5, t < T.open2 ? 0.7 : 0]];
      if (t > at(8) && t < at(8, 0.7)) still.push([A.shrug, t - at(8), 1.2]);
      const turn = sm(inv(at(6, 0.0), at(6, 0.7), t)) * (1 - sm(inv(T.open2 - 0.5, T.open2, t)));   // eases round to talk to the room
      const r = walkTo(mx, DOWN(), T.maxIn, t, 12, still, M.reader.heading - 0.65 * turn);
      face = t < at(4) ? 'scared' : t < T.reachMax ? 'nervous' : t < at(5) ? 'surprised' : t < at(8) ? 'suspicious' : 'nervous';
      if (t < T.open2) { P.torch.visible = true; K.hold(P.torch, mx, 'R'); }
      else {                                                // opens the fridge, takes the ham, pushes it shut
        reachG(mx, 'L', T.open2 - 0.35, T.open2 + 0.02);
        reachG(mx, 'R', T.open2 + 0.2, T.open2 + 0.6);
        reachG(mx, 'L', T.shut2 - 0.3, T.shut2 + 0.02);
        if (t > T.open2 + 0.45) { P.ham.visible = true; K.hold(P.ham, mx, 'R', 'side'); }
      }
      if (t < T.open2 && t > T.maxIn) { const from = new THREE.Vector3(); P.torch.getWorldPosition(from); const h = mx.root.rotation.y; beam.set(true, from, V(Math.sin(h), r.done ? -0.12 : -0.3, Math.cos(h))); }
    } else if (t < T.maxOut) {                              // behind the island facing the room: the sandwich
      const still = [[A.idle, idle]];
      const making = t >= T.make0 && t < T.make1;
      if (making && !(t >= T.cut0 && t < T.cut1 + 0.2)) still.push([A.typing, t - T.make0, 1.0]);
      walkTo(mx, [M.reader, M.behindL, M.counterBack, M.counter], T.toIsland, t, 12, still);
      if (t >= T.cut0 - 0.15 && t < T.cut1 + 0.2) cutArm(t);  // the knife along the crust edge
      if (making) { P.knife.visible = true; K.hold(P.knife, mx, 'R', 'side', t >= T.cut0 - 0.15 && t < T.cut1 + 0.2 ? { level: true, yaw: CUT.yaw } : {}); }
      if (t < T.make0 - 0.4) { P.ham.visible = true; K.hold(P.ham, mx, 'R', 'side'); }
      else { put(P.ham, M.hamRest, 1.2); }
      if (t >= at(10, 0.4)) reachG(mx, 'R', at(10, 0.4), at(10, 1.4));   // "There." slides the plate an inch toward the room
      put(P.torchDown, M.torchRest.clone().add(V(0, 0.27, 0)), -2.2); P.torchDown.userData.setOn?.(false);
      face = t < word(9, 4).start ? 'nervous' : t < at(10) ? 'annoyed' : 'nervous';
    } else {                                                // back round the island and up the stairs
      const r = walkTo(mx, [M.counter, M.counterBack, M.behind, M.stairTurn, M.footOut, M.stairs_bottom, M.stairs_top], T.maxOut, t, 12, [[A.idle, idle]]);
      if (r.done) mx.root.visible = false;
      P.torch.visible = true; K.hold(P.torch, mx, 'R');
      put(P.ham, M.hamRest, 1.2); face = 'nervous';
    }
    K.speak(mx, face, t, L.said('MAX').filter((w) => w.start < T.maxOut + 1));
  } else if (t >= T.maxOut) put(P.ham, M.hamRest, 1.2);     // he left the ham on the island: Dad finds it there
  // the plate from the moment Max makes the sandwich; the crusted sandwich until the cut, then crustless until Skye takes it
  if (t >= T.make0) {
    put(P.plate, M.plate, 0);
    if (t < T.cut1) put(P.withCrust, M.sandwichAt, M.sandwichH);
    else if (t < T.grab) put(P.onPlate, M.sandwichAt, M.sandwichH);
  }

  // ----- Dad -----
  const dd = C.dad;
  if (vis.includes('dad')) {
    let face = 'happy';
    if (t < T.dadOut) {
      const still = [[A.idle, idle]];
      if (t >= T.lookUp && t < at(16)) still.push([A.look_up, 0.4, 1.5]);
      walkTo(dd, DOWN(), T.dadIn, t, DADV, still, M.reader.heading);
      face = t < at(14) ? 'happy' : t < T.lookUp ? 'suspicious' : t < at(16) ? 'surprised' : t < at(17) ? 'annoyed' : 'sad';
      reachG(dd, 'L', T.open3 - 0.35, T.open3 + 0.02);     // pulls the fridge open ...
      reachG(dd, 'L', T.shut3 - 0.3, T.shut3 + 0.02);      // ... and pushes it shut
      if (t >= T.ham) {                                     // lifts his ham to look at it
        K.gesture(dd, 'hold_out', 'R', sm(inv(T.ham, T.ham + 0.35, t)));
        P.dadHam.visible = true; K.hold(P.dadHam, dd, 'R', t >= T.ham + 0.2 ? 'out' : 'side');
      }
    } else {
      const r = walkTo(dd, [M.reader, M.behindL, M.behind, M.stairTurn, M.footOut, M.stairs_bottom, M.stairs_top], T.dadOut, t, DADV, [[A.idle, idle]]);
      if (r.done) dd.root.visible = false;
      P.dadHam.visible = true; K.hold(P.dadHam, dd, 'R', 'side');
    }
    K.speak(dd, face, t, L.said('DAD'));
  }

  sh.cam(stage, t);
}

// ---------- overlay ----------
export function overlay(g, s, t) { K.dayCard(g, s, t, CARD); }

// for the hold check (ch03_hold.js)
export const cast = () => ({ skye: C.skye, max: C.max, dad: C.dad, lily: C.lily });
export const lineAt = (i, off = 0) => at(i, off);
export const lineEnd = (i, off = 0) => endOf(i, off);
