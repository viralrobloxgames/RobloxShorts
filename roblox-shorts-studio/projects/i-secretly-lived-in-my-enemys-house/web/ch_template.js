// Chapter template: copy to web/chNN.js and replace the CHAPTER block, EST, the shot table and the per-shot blocking.
// The house pattern every chapter follows (KIT_SPEC.md):
//   - META from the kit (1920x1080, 30 fps); the chapter's length comes from its narration (lines.json) or, until that
//     lands, from the estimated timings in EST;
//   - a shot table keyed to script lines (line index as in lines.json + an offset in seconds): set, light, camera;
//   - showSet() + applyLight() on every frame; actors on set marks; the camera on whoever speaks (camOn / twoShot /
//     overShoulder) on one side of the scene's line; speak() faces on the word timings; held props via hold();
//   - dayCard (Ch2-11, from frame 0) / timeStamp overlays; captions are burned in later by finish_longform.py;
//   - holdClock(): idle motion only runs while someone speaks, so silent held moments are identical frames and
//     render.mjs copies them instead of rendering them.
// Everything is a pure function of t (the runner may render frames in any order).
//
// Preview: node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch_template.js --out /tmp/tpl \
//            --frames 1,30,75,120,200,300 --scale 0.5 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';

// ---------- CHAPTER ----------
const CH = 0;                                        // chapter number (0 = this template: no lines.json, so EST is used)
const CARD = { day: 'MONDAY', time: '9:47 PM' };     // the day card (Ch2-11 open on it from frame 0; Ch1 uses a time stamp)
// Estimated spoken lines (seconds) until audio/chapters/chNN/lines.json exists; `index` is 1-based as in lines.json.
const EST = [
  { index: 1, speaker: 'VO', text: "I secretly lived in my enemy's house for a week, and he had no idea.", start: 0.0, end: 3.4 },
  { index: 2, speaker: 'MAX', text: 'Hello? Is somebody in my closet?', start: 3.7, end: 5.4 },
  { index: 3, speaker: 'SKYE', note: 'whisper', text: 'That was way too close.', start: 6.2, end: 7.7 },
  { index: 4, speaker: 'MAX', text: 'You cut the crusts off your sandwich? What are you, five?', start: 8.1, end: 10.5 },
  { index: 5, speaker: 'SKYE', text: "At least my lunch doesn't smell like your gym socks.", start: 10.8, end: 12.7 },
];
const L = await K.loadLines(import.meta.url, CH, EST);
export const meta = K.chapterMeta(K.chapterLength(L)); // last line + room tone (boundary sheet: 0.5-1.0 s)
export const sky = K.SKY;
export const samples = () => 1;                       // one sample per frame (house setting for the long-form)
const at = (line, off = 0) => L.line(line).start + off;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- marks (fallbacks only matter until the set defines the mark) ----------
const M = {
  closet: () => K.mark('bedroom', 'closet_inside', { pos: V(-6, 0, 6), heading: Math.PI * 0.85 }),
  bed: () => K.mark('bedroom', 'bed_side', { pos: V(4, 0, -6), heading: -0.6 }),
  closetFront: () => K.mark('bedroom', 'closet_front', { pos: V(-4.5, 0, 1.5), heading: -0.6 }),
  deskSkye: () => K.mark('classroom', 'desk_skye', { pos: V(-3, 0, 0), heading: 0 }),
  deskMax: () => K.mark('classroom', 'desk_max', { pos: V(0.5, 0, 4.5), heading: -2.6 }),
};

// ---------- setup ----------
let C, A, P = {}, beam, RED = null;
export async function setup(stage) {
  await K.buildSets(stage, ['bedroom', 'classroom']);
  K.setState({ chapter: Math.max(1, CH) });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs');
  A = await K.loadAnims(['idle', 'walk', 'run', 'shock', 'point']);
  P.torch = K.makeProp('flashlight'); stage.scene.add(P.torch); K.hold(P.torch, C.max, 'R');
  beam = K.flashlightBeam(stage);
}

// ---------- the shot table ----------
// Each shot runs from its line's start (+ off) to the next shot. set/light/practicals pick the place and the light;
// cam(stage, t) frames whoever speaks. Cuts follow the speaker; a scene's line is set once (setLine) at its first shot.
const SHOTS = [
  { line: 1, off: 0, id: 'hook', set: 'bedroom', light: 'night_moon', cam: (s) => K.overShoulder(s, C.skye, C.max, 'ms', { fov: 40 }) },
  { line: 1, off: 1.0, id: 'skye_cu', set: 'bedroom', light: 'night_moon', cam: (s) => K.camOn(s, C.skye, 'cu') },
  { line: 2, off: 0, id: 'max_asks', set: 'bedroom', light: 'night_moon', cam: (s) => K.overShoulder(s, C.skye, C.max, 'mcu') },
  { line: 3, off: 0, id: 'skye_whisper', set: 'bedroom', light: 'night_moon', cam: (s) => K.camOn(s, C.skye, 'cu') },
  { line: 4, off: -0.25, id: 'class_two', set: 'classroom', light: 'school_day', stamp: 'MONDAY 12:15 PM', cam: (s) => K.twoShot(s, C.max, C.skye) },
  { line: 4, off: 1.2, id: 'max_mocks', set: 'classroom', light: 'school_day', stamp: 'MONDAY 12:15 PM', cam: (s) => K.overShoulder(s, C.skye, C.max, 'mcu') },
  { line: 5, off: 0, id: 'skye_back', set: 'classroom', light: 'school_day', stamp: 'MONDAY 12:15 PM', cam: (s) => K.overShoulder(s, C.max, C.skye, 'mcu') },
].map((x) => ({ ...x, start: at(x.line, x.off) })).sort((a, b) => a.start - b.start);
const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.start) s = x; return s; };

// ---------- update: everything for time t ----------
export function update(t, stage) {
  const sh = shotAt(t);
  const set = K.showSet(sh.set);
  K.setBlockers(set.group, C.skye, C.max);
  const torchOn = sh.set === 'bedroom';
  K.applyLight(stage, sh.light, { set, practicals: { bedside_lamp: false } });
  const idle = K.holdClock(t, L);                      // idle motion only while someone speaks
  K.only(C, ['skye', 'max']);

  if (sh.set === 'bedroom') {
    K.setLine(C.skye, C.max, 1);
    // Skye inside the closet, hand over her mouth (the arm pose comes from cast when it has one); Max walks at the closet.
    K.playAnim(C.skye, [[A.idle, idle]]); K.putOn(C.skye, M.closet());
    K.walk(C.max, A, M.bed(), M.closetFront(), 0.2, t, { idleAt: idle, endHeading: K.faceTo(M.closetFront(), M.closet()) });
  } else {
    K.setLine(C.max, C.skye, 1);
    // Skye turned round in her seat to answer Max (row 3, diagonally behind her)
    const sk = M.deskSkye(), mx = M.deskMax();
    K.playAnim(C.skye, [[A.idle, idle]]); K.putOn(C.skye, sk, { heading: K.faceTo(sk, mx) });
    K.playAnim(C.max, [[A.idle, idle + 0.7]]); K.putOn(C.max, mx, { heading: K.faceTo(mx, sk) });
  }
  // faces: talking/mouth_o on the speaker's words, the scripted face otherwise
  K.speak(C.skye, sh.set === 'bedroom' ? 'scared' : 'annoyed', t, L.said('SKYE'));
  K.speak(C.max, sh.set === 'bedroom' ? 'suspicious' : 'smug', t, L.said('MAX'));
  P.torch.visible = torchOn;

  sh.cam(stage, t);                                    // camera last: it reads the posed actors

  // practical: the flashlight beam from the torch along Max's facing
  if (torchOn) {
    const from = new THREE.Vector3(); P.torch.getWorldPosition(from);
    const h = C.max.root.rotation.y; beam.set(true, from, V(Math.sin(h), -0.08, Math.cos(h)));
  } else beam.set(false);

  // red circle on Skye's face from 2.5 s in the hook (screen position of her head this frame)
  RED = sh.id === 'skye_cu' && t >= 2.5 ? K.screenOf(stage, K.headPos(C.skye)) : null;
  OVL = { stamp: sh.stamp || (CH === 1 ? `${CARD.day} ${CARD.time}` : null) };
}

// ---------- overlay (1920x1080 units x s) ----------
let OVL = {};
export function overlay(g, s, t) {
  if (CH !== 1) K.dayCard(g, s, t, CARD);              // Ch2-11: full-width card from frame 0 for ~2 s
  if (OVL.stamp && (CH === 1 || t > 2.2)) K.timeStamp(g, s, OVL.stamp);
  if (RED) K.redCircle(g, s, t, RED.x, RED.y, 130, { t0: 2.5 });
}
