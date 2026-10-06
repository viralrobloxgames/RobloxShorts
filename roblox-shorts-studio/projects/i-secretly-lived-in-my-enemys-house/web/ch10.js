// Ch10 "Hungry?" (SATURDAY 11:59 PM). Max's bedroom at midnight: the big scare, the lamp clicks on, "Hey, Skye.
// Hungry?", the reveal (every twist clue paid off), "Nobody!" / "Nobody!". Shot plan: production/shots/ch10.md.
// Timing: audio/chapters/ch10/lines.json + captions.json when present, else the estimates in EST below.
// Everything is a pure function of time.
import * as THREE from 'three';
import * as K from './kit/index.js';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeInOut, shotAt } from '../../../web/lib/anim.js';
import { loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- timing ----------
// Estimated line windows (index = spoken line in script.txt # CH10), replaced by lines.json when it exists.
const EST = [
  ['VO', 0.0, 6.0], ['SKYE', 6.25, 8.25], ['MAX', 9.3, 12.5], ['SKYE', 12.75, 16.25], ['MAX', 16.5, 22.8],
  ['SKYE', 23.85, 26.45], ['MAX', 26.7, 29.7], ['MAX', 29.95, 33.65], ['SKYE', 33.9, 38.2], ['MAX', 38.45, 45.45],
  ['MAX', 45.7, 50.9], ['SKYE', 51.15, 55.45], ['MAX', 55.7, 57.9], ['SKYE', 58.15, 61.15], ['MAX', 61.4, 65.1],
  ['DAD', 66.35, 68.75], ['MAX', 69.0, 69.7], ['SKYE', 69.95, 70.65],
];
const load = async (f) => { try { const r = await fetch(new URL(`../audio/chapters/ch10/${f}`, import.meta.url)); return r.ok ? await r.json() : null; } catch { return null; } };
const LJ = await load('lines.json'), CJ = await load('captions.json');
const spoken = LJ ? (LJ.lines || LJ).filter((l) => l.text && l.speaker) : null;
const L = spoken && spoken.length === EST.length ? spoken.map((l) => ({ who: l.speaker, start: l.start, end: l.end })) : EST.map(([who, start, end]) => ({ who, start, end }));
const WORDS = (CJ ? (CJ.words || CJ) : []).map((w) => ({ ...w, speaker: w.speaker || '' }));
// a speaker's words inside line i (for speak()); with no captions yet, fake ~3 words/s over the line
function wordsOf(i) {
  const l = L[i], ws = WORDS.filter((w) => w.start >= l.start - 0.05 && w.end <= l.end + 0.05);
  if (ws.length) return ws;
  const n = Math.max(1, Math.round((l.end - l.start) * 3)), d = (l.end - l.start) / n;
  return Array.from({ length: n }, (_, k) => ({ start: l.start + k * d, end: l.start + k * d + d * 0.8 }));
}
const AUDIO_END = LJ?.seconds ?? LJ?.duration ?? (L[L.length - 1].end + 0.6);
export const meta = { ...(K.META || { width: 1920, height: 1080, fps: 30 }), seconds: Math.ceil((Math.max(AUDIO_END, L[L.length - 1].end + 0.6) + 0.3) * 30) / 30, title: 'Ch10 Hungry?' };

// key beats on the narration
const T = {
  click: L[1].end + 0.2,                  // the lamp switch ([+0.8] after "Maaax")
  pull: L[4].end + 0.1,                   // sheet off ([+0.8] after "...on Monday.")
  pinkWord: L[4].start + (L[4].end - L[4].start) * 0.18,     // "pink"
  sticking: L[4].start + (L[4].end - L[4].start) * 0.30,     // "It's sticking out of the sheet"
  monday: L[4].start + (L[4].end - L[4].start) * 0.62,       // "Same as in my closet on Monday"
  edge: L[7].start + 0.2,                 // Max swings round onto the bed edge, plate to the table
  pumpkin: L[7].start + (L[7].end - L[7].start) * 0.62,      // "Or fixing your pumpkin?"
  attic: L[9].start + (L[9].end - L[9].start) * 0.55,        // "She's been in our attic all week."
  comesDown: L[10].start + (L[10].end - L[10].start) * 0.58, // "If she ever comes down."
  smiles: L[14].end,                      // [+1.0] smiles, footsteps
  handle: L[15].end - 0.9,                // the handle starts turning
  end: meta.seconds,
};

// ---------- scene ----------
let CAST, skye, max, set, A = {}, P = {}, SHOT = 'open', NOW = 0;
let lay;                                   // marks (set marks when present, else the fallback layout below)
export async function setup(stage) {
  const { scene } = stage;
  CAST = await K.loadCast(scene); ({ skye, max } = CAST);
  for (const a of [CAST.dad, CAST.lily, ...(CAST.extras || [])]) if (a) a.root.visible = false;
  set = K.sets.bedroom.build(scene);
  set.setState?.({ chapter: 10, garlic: true, door: 1, lamp: false });
  for (const n of ['idle', 'walk', 'sit', 'point_forward', 'point_up', 'shrug', 'shock', 'talk', 'think']) A[n] = await loadAnimation(n);
  for (const id of ['phone', 'plate', 'sheet_bunched']) { P[id] = K.makeProp(id); scene.add(P[id]); }
  P.glowL = K.makeProp('glow_sticks', { side: 'L' }); P.glowR = K.makeProp('glow_sticks', { side: 'R' }); scene.add(P.glowL, P.glowR);
  // glow-stick and phone light (stand-in until the kit's practicals land)
  P.glowLight = new THREE.PointLight('#5dff6a', 0, 9, 1.6); P.phoneLight = new THREE.PointLight('#cfe3ff', 0, 5, 1.8); scene.add(P.glowLight, P.phoneLight);
  lay = layout(set);
}

// Room layout. Set marks win; the fallback matches the bedroom I asked kit-sets-a for (bed under the window on the back
// wall, door in the right wall). The action axis runs from Skye (screen right) to Max (screen left); every camera sits
// on the +z (open) side of it.
function layout(s) {
  const m = s.marks || {}, o = K.sets.bedroom.OFFSET || V(0, 0, 0), w = (x, y, z) => V(x, y, z).add(o);
  const mk = (id, pos, heading) => (m[id] ? { pos: m[id].pos.clone(), heading: m[id].heading } : { pos, heading });
  const bedTop = 1.7;
  const L0 = {
    doorOut: mk('door_outside', w(13.5, 0, -3), -Math.PI / 2),
    doorIn: mk('door_inside', w(9.5, 0, -3), -Math.PI / 2),
    ghost: mk('ghost_stop', w(2.5, 0, -2.8), 0),
    nearBed: mk('skye_near_bed', w(0.5, 0, -2.4), 0),
    bedUp: mk('bed_sit_up', w(-8.2, bedTop, -6.6), Math.PI / 2),
    bedEdge: mk('bed_edge', w(-4.6, bedTop - 0.1, -4.6), 0),
    plateSpot: mk('bedside_plate', w(-10.0, 2.3, -7.6), 0),
    lamp: mk('lamp_switch', w(-10.0, 3.2, -7.8), 0),
    door: mk('door', w(11, 0, -3), -Math.PI / 2),
  };
  // headings that face each other
  const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  if (!m.ghost_stop) L0.ghost.heading = face(L0.ghost.pos, L0.bedUp.pos);
  if (!m.skye_near_bed) L0.nearBed.heading = face(L0.nearBed.pos, L0.bedEdge.pos);
  if (!m.bed_edge) L0.bedEdge.heading = face(L0.bedEdge.pos, L0.nearBed.pos);
  L0.face = face;
  return L0;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
// raise an arm forward (pitch) with a little spread: fwd ~ -1.5 = straight out in front
function armFwd(a, sd, pitch, spread = 0.1) { EUL.set(pitch, 0, sd === 'L' ? spread : -spread, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
function place(a, x) {
  a.root.visible = x.visible !== false; if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const f of x.arms) f(a);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  a.root.updateMatrixWorld(true);
  if (x.words) K.speak(a, x.face, NOW, x.words); else if (a.setFace) a.setFace(x.face); else setExpression(a, x.face);
}
const grip = (a, sd = 'R', y = -1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, y, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
// a held prop: the kit's hold() when it's real, else parented at the palm
function inHand(prop, a, sd, mode = 'palm') {
  if (!prop) return;
  if (K.hold && prop.userData?.kitHold !== false) K.hold(prop, a, sd, mode);
  if (prop.parent !== a.bones['Arm.' + sd] && !prop.userData.placed) { a.bones['Arm.' + sd].add(prop); prop.position.set(sd === 'R' ? -0.5 : 0.5, -1.3, 0); prop.rotation.set(Math.PI / 2, 0, 0); }
  prop.visible = true;
}
function onTable(prop, pos) { if (!prop) return; if (prop.parent) prop.parent.remove(prop); set.group.parent.add(prop); prop.position.copy(pos); prop.rotation.set(0, 0, 0); prop.visible = true; }

// who speaks when (for faces)
const speaking = (who, s) => L.findIndex((l) => l.who === who && s >= l.start - 0.02 && s < l.end + 0.02);

// ---------- Skye ----------
const CREEP = 5.5;                                   // creeping speed (studs/s), legs driven by distance
function skyeAt(s) {
  const g = lay.ghost, nb = lay.nearBed;
  let x = st(g.pos, g.heading, 'scheming'); x.sheet = s < T.pull + 0.2; x.phoneUp = true;
  // the entrance: already in the doorway at frame 0, creeping to her mark
  const from = lay.doorIn.pos.clone().lerp(lay.doorOut.pos, 0.15), d = from.distanceTo(g.pos), u = clamp(s * CREEP / d);
  if (u < 1) { x.pos = from.clone().lerp(g.pos, u); x.heading = Math.atan2(g.pos.x - from.x, g.pos.z - from.z); x.layers = [['walk', (u * d) / STRIDE]]; }
  else x.layers = [['idle', s * 0.6]];
  // spooky sway + one arm out at shoulder height (never both): "Maaax", "I am a ghost"
  const spook = (s > L[1].start - 0.2 && s < L[1].end + 0.1) || (s > L[3].start - 0.2 && s < L[3].end + 0.1);
  if (spook) { const k = Math.sin(s * 3.2); x.heading += 0.12 * k; x.arms.push((a) => setArm(a, 'L', 1.45 + 0.15 * Math.sin(s * 5), 0.25)); }
  // the phone is held up recording in the right hand until the reveal sinks in, then at chest height
  const phoneLow = s > T.pull + 0.3;
  x.arms.push((a) => armFwd(a, 'R', phoneLow ? -0.75 : -1.35, 0.18));
  if (s > T.pull - 0.05 && s < T.pull + 0.45) { const k = inv(T.pull - 0.05, T.pull + 0.4, s); x.arms.push((a) => setArm(a, 'L', lerp(1.0, 2.6, Math.sin(k * Math.PI)), 0.4)); }
  else if (s >= T.pull + 0.45) x.arms.push((a) => setArm(a, 'L', 0.28, -0.15));        // sheet bunched in her left hand
  // after the reveal she steps nearer the bed (a real walk), before "But on the phone"
  if (s > L[7].end - 0.6) {
    const t0 = L[7].end - 0.6, dd = g.pos.distanceTo(nb.pos), uu = clamp((s - t0) * 9 / dd);
    x.pos = g.pos.clone().lerp(nb.pos, uu);
    if (uu > 0 && uu < 1) { x.heading = Math.atan2(nb.pos.x - g.pos.x, nb.pos.z - g.pos.z); x.layers = [['walk', (uu * dd) / STRIDE]]; }
    else { x.heading = nb.heading; x.layers = [['idle', s * 0.6]]; }
  }
  // faces (only read once the sheet is off)
  if (s > T.pull) x.face = 'shocked';
  if (s > L[6].start) x.face = 'surprised';
  if (s > L[8].start) x.face = 'sad';
  if (s > L[9].start + 1.6) x.face = 'nervous';                    // "worst at hiding": embarrassed
  if (s > L[10].start) x.face = 'surprised';
  if (s > T.comesDown) x.face = 'nervous';                         // blushing
  if (s > L[11].start) x.face = 'annoyed';
  if (s > L[11].end) x.face = 'smug';
  if (s > L[13].start) x.face = 'nervous';
  if (s > L[14].end - 0.8) x.face = 'happy';
  if (s > L[15].start + 0.3) x.face = 'shocked';
  // points at him with the phone hand on "a fridge told you to"
  if (s > L[11].start + 0.9 && s < L[11].end) x.arms.push((a) => armFwd(a, 'R', -1.45, 0.05));
  // the door: both turn to it on Dad's voice
  if (s > L[15].start + 0.3) { const k = smooth(inv(L[15].start + 0.3, L[15].start + 0.8, s)); x.heading = lerp(x.heading, lay.face(x.pos, lay.door.pos), k); x.look = [0, 0]; }
  const i = speaking('SKYE', s); if (i >= 0 && !x.sheet) x.words = wordsOf(i);
  if (i >= 16) x.face = 'shouting';
  return x;
}

// ---------- Max ----------
function maxAt(s) {
  const up = lay.bedUp, ed = lay.bedEdge;
  let x = st(up.pos, lay.face(up.pos, lay.ghost.pos), 'happy'); x.sit = true; x.layers = [['sit', 0, 1, false]];
  x.plate = 'lap';
  // the lamp click: his right hand to the switch
  if (s > T.click - 0.45 && s < T.click + 0.35) { const k = Math.sin(inv(T.click - 0.45, T.click + 0.35, s) * Math.PI); x.arms.push((a) => setArm(a, 'R', lerp(0.2, 1.3, k), lerp(0, 0.9, k))); x.plate = 'L'; }
  if (s > T.click + 0.35) x.plate = 'L';
  // "Hey, Skye. Hungry?": holds the plate out to her (left hand)
  if (s > L[2].start && s < L[2].end + 0.2) x.arms.push((a) => armFwd(a, 'L', -1.25, -0.05));
  // "Your hair is pink": points at her head (right hand)
  if (s > T.pinkWord - 0.15 && s < T.monday) x.arms.push((a) => armFwd(a, 'R', -1.5, 0.05));
  if (s > T.monday && s < L[4].end) x.face = 'smug';
  // "making the sandwiches": lifts the plate a little
  if (s > L[6].start && s < L[6].end) { const k = Math.sin(inv(L[6].start, L[6].end, s) * Math.PI); x.arms.push((a) => armFwd(a, 'L', -0.9 - 0.5 * k, -0.05)); }
  // onto the bed edge, plate down on the bedside table
  if (s > T.edge) {
    const k = smooth(inv(T.edge, T.edge + 1.0, s));
    x.pos = up.pos.clone().lerp(ed.pos, k); x.heading = lerp(up.heading ?? x.heading, ed.heading, k);
    if (s > T.edge + 0.5) x.plate = 'table';
    else x.arms.push((a) => setArm(a, 'L', 0.9, -0.4));
  }
  // "fixing your pumpkin": one hand at head height, a little straightening twist
  if (s > T.pumpkin - 0.1 && s < L[7].end + 0.1) x.arms.push((a) => setArm(a, 'R', 2.1 + 0.15 * Math.sin((s - T.pumpkin) * 9), -0.5));
  if (s > L[9].start) x.face = 'happy';
  if (s > T.attic - 0.1 && s < L[9].end) x.arms.push((a) => setArm(a, 'R', 2.5, -0.2));     // points up at the attic (one arm)
  if (s > L[10].start && s < T.comesDown + 0.2) { x.face = 'nervous'; x.look = [0, 0.15]; }
  if (s > L[12].start - 0.1 && s < L[12].end + 0.2) x.layers = [['sit', 0, 1, false]], x.arms.push((a) => { setArm(a, 'L', 0.6, -0.6); setArm(a, 'R', 0.6, -0.6); }); // shrug-ish, arms low
  if (s > L[15].start + 0.2) { x.face = 'shocked'; const k = smooth(inv(L[15].start + 0.2, L[15].start + 0.7, s)); x.look = [k * 0.55, 0]; }
  const i = speaking('MAX', s); if (i >= 0) x.words = wordsOf(i);
  if (i >= 16) x.face = 'shouting';
  if (s > L[17].end) x.face = 'shocked', x.words = null;
  return x;
}

// ---------- shots ----------
const SH = [
  [0, 'open'], [3.9, 'ghostFront'], [L[1].start - 0.15, 'ghostMs'], [T.click - 0.25, 'maxCu'], [L[2].start - 0.1, 'maxMcu'],
  [L[3].start - 0.1, 'ghostMs2'], [L[4].start - 0.1, 'maxMcu2'], [T.sticking - 0.1, 'lockCu'], [T.monday - 0.1, 'maxMcu3'],
  [T.pull - 0.1, 'skyeMs'], [L[5].start - 0.1, 'skyeMcu'], [L[6].start - 0.1, 'maxMcu4'], [L[7].start - 0.1, 'two'],
  [L[8].start - 0.1, 'skyeMcu2'], [L[9].start - 0.1, 'maxEdge'], [T.attic - 0.3, 'two2'], [L[10].start - 0.1, 'maxEdge2'],
  [T.comesDown - 0.1, 'skyeCu'], [L[11].start - 0.1, 'skyeMs2'], [L[12].start - 0.1, 'maxEdge3'], [L[13].start - 0.1, 'skyeMcu3'],
  [L[14].start - 0.1, 'two3'], [L[15].start - 0.1, 'doorCu'], [L[16].start - 0.15, 'end'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));

function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg); }
// a camera on the open (+z) side of the action axis, in front of a, d studs away, `side` of 3/4 cheat
function frontCam(stage, a, d, fov, side = 0.55, up = 0.25, aim = V(0, -0.2, 0)) {
  const h = headPos(a), f = V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y));
  let r = V(f.z, 0, -f.x); if (r.z < 0) r.negate();     // bias toward +z (camera side of the line)
  const dir = f.clone().multiplyScalar(Math.cos(side)).addScaledVector(r, Math.sin(side)).normalize();
  look(stage, h.clone().addScaledVector(dir, d).add(V(0, up, 0)), h.clone().add(aim), fov);
}
function twoCam(stage, a, b, d = 16, fov = 40, lift = 2.2) {
  const ha = headPos(a), hb = headPos(b), mid = ha.clone().add(hb).multiplyScalar(0.5), ax = hb.clone().sub(ha); ax.y = 0; ax.normalize();
  let n = V(-ax.z, 0, ax.x); if (n.z < 0) n.negate();
  look(stage, mid.clone().addScaledVector(n, d).add(V(0, lift, 0)), mid.clone().add(V(0, -0.6, 0)), fov);
}
const cam = (id) => set.cams?.[id];

export function update(t, stage) {
  const s = t; NOW = s; const { shot } = shotAt(SH, t); SHOT = shot.id;
  // light: midnight until the click, then the lamp
  const lampOn = s >= T.click;
  K.applyLight?.(stage, 'midnight', { lamp: lampOn, phone: true, glow: true, hallUnderDoor: s > L[14].end + 0.2 });
  set.setState?.({ chapter: 10, garlic: true, lamp: lampOn, door: doorOpen(s), doorHandle: s > T.handle ? smooth(inv(T.handle, T.handle + 0.4, s)) * (0.6 + 0.4 * Math.sin((s - T.handle) * 14)) : 0, hallUnderDoor: s > L[14].end + 0.2 });

  const xs = skyeAt(s), xm = maxAt(s);
  K.dress(skye, xs.sheet ? 'skye_sheet' : 'skye_hoodie');
  K.dress(max, 'max_pjs');
  place(skye, xs); place(max, xm);

  // props
  inHand(P.phone, skye, 'R');
  P.glowL.visible = P.glowR.visible = true; K.wearOn?.(P.glowL, skye, 'L'); K.wearOn?.(P.glowR, skye, 'R');
  P.sheet_bunched.visible = !xs.sheet; if (!xs.sheet) inHand(P.sheet_bunched, skye, 'L');
  if (xm.plate === 'table') onTable(P.plate, lay.plateSpot.pos); else inHand(P.plate, max, xm.plate === 'lap' ? 'L' : 'L');
  // stand-in practical lights
  const gp = grip(skye, 'L'), pp = grip(skye, 'R', -1.8);
  P.glowLight.position.copy(gp).lerp(grip(skye, 'R'), 0.5); P.glowLight.intensity = 6;
  P.phoneLight.position.copy(pp); P.phoneLight.intensity = 2.5;

  // cameras
  switch (SHOT) {
    case 'open': { const c = cam('bed_to_door'); if (c) look(stage, c.pos, c.target, c.fov); else { const mp = max.root.position; look(stage, mp.clone().add(V(4.5, 2.6, 7.5)), lay.doorIn.pos.clone().add(V(-3, 3.2, -0.5)), 50); } break; }
    case 'ghostFront': frontCam(stage, skye, 5.2, 40, 0.35, 0.1); break;
    case 'ghostMs': case 'ghostMs2': frontCam(stage, skye, 10, 42, 0.75, 0.6, V(0, -1.4, 0)); break;
    case 'maxCu': frontCam(stage, max, 6.5, 40, 0.55, 0.4, V(-0.6, -0.6, 0)); break;
    case 'maxMcu': case 'maxMcu2': case 'maxMcu3': case 'maxMcu4': frontCam(stage, max, 6.2, 40, 0.5, 0.3, V(0, -0.5, 0)); break;
    case 'lockCu': frontCam(stage, skye, 3.6, 38, 0.15, 0.1, V(0, 0, 0)); break;
    case 'skyeMs': case 'skyeMs2': frontCam(stage, skye, 9, 42, 0.6, 0.4, V(0, -1.3, 0)); break;
    case 'skyeMcu': case 'skyeMcu2': case 'skyeMcu3': frontCam(stage, skye, 5.4, 40, 0.5, 0.2, V(0, -0.5, 0)); break;
    case 'skyeCu': frontCam(stage, skye, 4.0, 38, 0.45, 0.1, V(0, -0.2, 0)); break;
    case 'maxEdge': case 'maxEdge2': case 'maxEdge3': frontCam(stage, max, 6.0, 40, 0.5, 0.3, V(0, -0.5, 0)); break;
    case 'two': case 'two2': case 'two3': twoCam(stage, max, skye, 16, 40); break;
    case 'doorCu': { const c = cam('door_handle_cu'); if (c) look(stage, c.pos, c.target, c.fov); else look(stage, lay.door.pos.clone().add(V(-6, 3.4, 3)), lay.door.pos.clone().add(V(0, 3.2, 0.8)), 40); break; }
    case 'end': { const c = cam('two_shot_door'); if (c) look(stage, c.pos, c.target, c.fov); else twoCam(stage, max, skye, 17, 42); break; }
  }
  if (stage.aimSun) stage.aimSun(headPos(max).lerp(headPos(skye), 0.5), 18);
  K.hold?.frame?.(t);
}
function doorOpen(s) { if (s < 2.6) return lerp(0.75, 1.0, smooth(clamp(s / 0.8))); return 1 - smooth(inv(2.6, 3.2, s)); }

// ---------- overlay ----------
export function overlay(g, s, t) {
  if (K.dayCard) K.dayCard(g, s, t, { day: 'SATURDAY', time: '11:59 PM' });
  if (SHOT === 'lockCu' && K.redCircle) K.redCircle(g, s, t - T.sticking, 960 + 170, 380, 150);
}

export function samples() { return 1; }
export const cast = () => ({ skye, max });
export const TIMES = T, SHOTS = SH, LINES = L;
