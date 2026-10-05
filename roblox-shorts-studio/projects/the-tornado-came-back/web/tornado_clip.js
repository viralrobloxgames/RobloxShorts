// The Tornado Came Back. Web renderer + Roblox R6 pack. True story (Tinker Air Force Base, Oklahoma, March 1948): an
// unforecast tornado wrecks some fifty planes; the general asks why weathermen can forecast rain but not tornadoes; five
// days later his two weathermen see the same weather map, put the odds at billions to one, and still answer his "yes or
// no?" with yes. The planes go into hangars, everyone to shelter, one weatherman goes home wondering about a job running
// an elevator, and at six a tornado hits almost the same spot: the first official tornado forecast came true.
// Max is the younger weatherman (Miller), Leo the senior one (Fawbush), Mia the general (officer_cap); Skye and Noob are
// airmen. Beats: web/beats.js (source/beats.py). Sets, planes and the tornado: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, fitAccessory, wear } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { rng } from '../../../web/lib/world.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'The Tornado Came Back' };
export const sky = { zenith: '#0d1424', horizon: '#2a3550', below: '#1a2030', fog: '#1c2232', sunDir: new THREE.Vector3(-0.45, 0.6, 0.65) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;
const O = (x, y, z) => K.OFFICE.clone().add(V(x, y, z));       // office-local to world
const E = (x, y, z) => K.ELEVATOR.clone().add(V(x, y, z));

// ---------- key times (all on the narration) ----------
const T = {
  days: W.five1 - 0.1, notice: W.tornadoes1 - 0.1, type: W.weather1 - 0.1, general: W.but - 0.1, rain: W.if - 0.1,
  dig: W.so - 0.1, map: W.on - 0.1, eyes: W.night - 0.05, odds: W.odds - 0.1, billions: W.billions - 0.1, radar: W.general2 - 0.1,
  yesno: W.another2 - 0.1, yes: W.they2 - 0.1, hangar: W.planes2 - 0.1, shelter: W.everyone - 0.1, home: W.one3 - 0.1,
  dream: W.wondering - 0.1, clock: W.at - 0.1, hit2: W.tornado4 - 0.2, same: W.almost - 0.1, ready: W.this - 0.1,
  first: W.first - 0.1, phone: W.warnings - 0.1, cta: W.follow - 0.15,
};
const SHOTS = [
  [0, 'hook'], [T.days, 'office1'], [T.notice, 'notice'], [T.type, 'type'], [T.general, 'general'], [T.rain, 'rain'],
  [T.dig, 'dig'], [T.map, 'map'], [T.eyes, 'eyes'], [T.odds, 'odds'], [T.billions, 'billions'], [T.radar, 'radar'],
  [T.yesno, 'yesno'], [T.yes, 'yes'], [T.hangar, 'hangar'], [T.shelter, 'shelter'], [T.home, 'home'], [T.dream, 'dream'],
  [T.clock, 'clock'], [T.hit2, 'hit2'], [T.same, 'same'], [T.ready, 'ready'], [T.first, 'first'], [T.phone, 'phone'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = {
  hook: 'base', office1: 'office', notice: 'office', type: 'office', general: 'office', rain: 'office', dig: 'office', map: 'office',
  eyes: 'office', odds: 'base', billions: 'office', radar: 'office', yesno: 'office', yes: 'office', hangar: 'base', shelter: 'base',
  home: 'base', dream: 'elevator', clock: 'office', hit2: 'base', same: 'base', ready: 'base', first: 'base', phone: 'table', cta: 'base',
};
// lighting per shot
const MODE_OF = {
  hook: 'night', odds: 'day', hangar: 'storm', shelter: 'storm', home: 'storm', hit2: 'dusk', same: 'day', ready: 'morning', first: 'morning', cta: 'morning',
  dream: 'elevator', phone: 'table',
};

// ---------- the tornadoes ----------
const TOR1 = (t) => V(-104 + 14 * t, 0, -2);                              // the night of March 20 (the hook)
const TOR2 = (t) => V(-118 + 17 * (t - T.hit2), 0, 7);                     // March 25 at six: a few studs over
// the hook's lightning flashes (scene-wide), and the one in the second strike
const FLASHES = [0.08, 1.35, 2.25, T.hit2 + 0.3, T.hit2 + 1.4];
const flashAt = (t) => { let f = 0; for (const t0 of FLASHES) { const u = t - t0; if (u >= 0 && u < 0.45) f = Math.max(f, u < 0.06 ? 1 : u < 0.1 ? 0.3 : 0.85 * (1 - (u - 0.1) / 0.35)); } return f; };

// ---------- scene ----------
let A = {}, max, leo, mia, skye, noob, miaCap, maxBox, tor1, tor2, deck, deckLight, P = {}, S = {}, PLACES = {}, SHOT = 'hook', cam;
let head2D = {};
const PLANES = [];                                                          // {g, kind, home, heading, toss}
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye, noob] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['scared', 'happy', 'neutral', 'surprised', 'shocked', 'determined', 'sad', 'nervous', 'confused', 'laugh', 'smug', 'talking', 'cool'] }),
    loadRobloxCharacter('Leo', { expressions: ['scared', 'happy', 'neutral', 'surprised', 'shocked', 'nervous', 'determined', 'laugh', 'confused', 'talking'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['angry', 'neutral', 'happy', 'annoyed', 'shouting', 'suspicious', 'determined', 'surprised', 'talking', 'scared', 'smug'] }),
    loadRobloxCharacter('Skye', { expressions: ['scared', 'happy', 'neutral', 'surprised', 'nervous'] }),
    loadRobloxCharacter('Noob', { expressions: ['scared', 'happy', 'neutral', 'surprised', 'nervous', 'determined'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root, noob.root);
  miaCap = await wear(mia, 'officer_cap');
  maxBox = await fitAccessory(max, 'pillbox_hat'); max.bones.Head.add(maxBox.item);
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'laugh_big', 'point_forward', 'think', 'talk', 'typing', 'clap', 'facepalm']) A[n] = await loadAnimation(n);

  K.ground(scene);
  PLACES.base = K.airbase(scene); S.base = PLACES.base.userData;
  const far = []; const r = rng(4);
  for (let i = 0; i < 120; i++) { const a = r() * 6.28, d = 380 + r() * 260; far.push([Math.cos(a) * d, Math.sin(a) * d, 1.2 + r() * 0.8]); }
  PLACES.trees = K.trees(scene, far, 9);
  PLACES.office = K.office(scene); S.of = PLACES.office.userData;
  const el = K.elevator(scene); PLACES.elevator = el.group; S.el = el;
  const tb = K.table(scene); PLACES.table = tb.group; S.tb = tb;
  tor1 = K.tornado({ seed: 1 }); scene.add(tor1);
  tor2 = K.tornado({ seed: 2, light: true, height: 64, r0: 1.8, r1: 17 }); scene.add(tor2);
  deck = K.cloudDeck(3, 26, 700, 95); scene.add(deck);

  // planes: two parked rows (a lane through the fighters at x -116..-68 for the hook's run), inside the hangars, the one
  // pushed in, the two tied down, and two carried round the funnel in the hook
  const add = (kind, home, heading, role) => { const g = kind === 'bomber' ? K.bomber() : K.fighter(); scene.add(g); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); const p = { g, kind, home: home.clone(), heading, role }; PLANES.push(p); return p; };
  for (const x of [-130, -80, -30, 20, 70, 120]) add('bomber', V(x, 0, K.BOMBER_Z), 0, 'row');
  for (const x of [-150, -126, -58, -34, -10, 14, 38, 62, 86, 110, 134]) add('fighter', V(x, 0, K.FIGHTER_Z), 0, 'row');
  add('fighter', V(K.HANGARS[0] - 14, 0, K.HANGAR_Z - 24), Math.PI, 'inside'); add('bomber', V(K.HANGARS[1], 0, K.HANGAR_Z - 22), Math.PI, 'inside');
  add('fighter', V(K.HANGARS[2] - 12, 0, K.HANGAR_Z - 22), Math.PI, 'inside'); add('fighter', V(K.HANGARS[2] + 12, 0, K.HANGAR_Z - 26), Math.PI, 'inside');
  P.pushed = add('fighter', V(K.HANGARS[0] + 8, 0, 0), Math.PI, 'pushed');
  P.tied = [add('fighter', V(-40, 0, 30), 0.3, 'tied'), add('fighter', V(-8, 0, 32), -0.2, 'tied')];
  P.carried = [add('fighter', V(0, 0, 0), 0, 'carried'), add('fighter', V(0, 0, 0), 0, 'carried')];
  // the hook: planes near the path are thrown when the funnel reaches them
  const rr = rng(77);
  for (const p of PLANES.filter((q) => q.role === 'row')) {
    const dz = p.home.z - TOR1(0).z;
    if (Math.abs(dz) > 26) continue;
    const t0 = (p.home.x - 7 - TOR1(0).x) / 14, side = Math.sign(dz) || 1;
    p.toss = { t0, dur: 2.0 + rr() * 0.6, to: p.home.clone().add(V(16 + rr() * 16, 0, side * (14 + rr() * 14))), h: 16 + rr() * 14,
      spin: [rr() * 1.6 - 0.8, rr() * 3 - 1.5, (rr() < 0.5 ? -1 : 1) * (rr() < 0.5 ? 1 : 2)], end: { rz: Math.PI + (rr() - 0.5) * 0.4, ry: (rr() - 0.5) * 1.4, y: p.kind === 'bomber' ? 7.9 : 5.2 } };
  }
  P.ropes = [0, 1, 2, 3].map(() => { const l = K.rope(); scene.add(l); return l; });
  P.sheets = []; for (let i = 0; i < 10; i++) { const s = K.sheet(); scene.add(s); P.sheets.push(s); }
  P.rings = new THREE.Group(); scene.add(P.rings);                                  // the target on the apron (odds)
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(10 + i * 14, 14 + i * 14, 64), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffffff' : '#ff3b3b', transparent: true, opacity: 0.75, depthWrite: false, fog: false, toneMapped: false })); m.rotation.x = -R90; m.position.y = 0.4; P.rings.add(m); }
  P.rings.position.set(-70, 0, 2);
  P.path1 = K.pathRibbon(V(-170, 0, -2), V(20, 0, -2), 7, '#ff3b3b'); scene.add(P.path1);
  P.path2 = K.pathRibbon(V(-170, 0, 7), V(20, 0, 7), 7, '#f4f4f4'); scene.add(P.path2);
  // a street lamp glow for the night (floodlight pools on the apron)
  S.floodLights = [-140, -45, 45].map((x) => { const l = new THREE.SpotLight('#ffe7b8', 0, 140, 0.75, 0.6, 1.0); l.position.set(x, 22, 48); l.target.position.set(x, 0, 10); scene.add(l, l.target); return l; });
}

// ---------- the cast ----------
const st = (pos, heading, face = 'neutral') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above)
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const arrive = (from, to, at, speed) => at - from.distanceTo(to) / speed;   // start time to arrive at `at`
const headTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const SHOCK = (s, t0) => [['shock', clamp(s - t0, 0, 0.3), 1, false]];
const PUSH = [['L', 0.12, -1.4], ['R', 0.12, -1.4]];
// office spots (local)
const MAP_MAX = O(-1.6, 0, -4.4), MAP_LEO = O(-6.2, 0, -4.2);
const CHAIR_MAX = O(4.2, 0.35, -4.2), CHAIR_LEO = O(0.2, 0.35, -4.2);
const MIA_IN = O(-14.5, 0, 0.3), MIA_AT = O(-4.4, 0, 0.9), RADAR_AT = O(6.6, 0, -2.6);
const HOOK_MAX = [V(-95, 0, 14), V(-95, 0, 59)], HOOK_LEO = [V(-89.5, 0, 9), V(-89.5, 0, 56)];

function maxAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'hook': {                                                      // running for the weather station, looking back
      x = st(HOOK_MAX[0], 0, 'scared'); moveTo(x, HOOK_MAX[0], HOOK_MAX[1], -0.55, s, 16, 0);
      if (s > 1.1 && s < 1.7) x.look = [0.9 * Math.sin(Math.PI * inv(1.1, 1.7, s)), 0];
      x.face = s > 1.3 && s < 1.8 ? 'shocked' : 'scared'; return x;
    }
    case 'office1': case 'eyes': case 'general': case 'rain': {
      x = st(MAP_MAX, 0.55, 'determined');
      if (SHOT === 'office1') {
        x.layers = [['point_forward', clamp(s - T.days, 0, 0.2), 1, false]]; x.heading = headTo(MAP_MAX, O(-4.2, 0, -7.5)) + 0.55; x.face = 'determined';
        if (s >= W.say1 - 0.1) { x.layers = [['idle', s]]; x.heading = 0.5; x.face = 'nervous'; }
      }
      if (SHOT === 'eyes') { x.heading = 0.45; x.face = 'shocked'; x.layers = SHOCK(s, T.eyes); }
      if (SHOT === 'general' || SHOT === 'rain') {
        x.heading = lerp(0.55, headTo(MAP_MAX, MIA_AT), smooth(inv(W.general1 - 0.2, W.general1 + 0.3, s))); x.face = 'nervous';
        if (SHOT === 'rain' && s > W.why) { x.look = [0.6 * smooth(inv(W.tornadoes2, W.tornadoes2 + 0.25, s)), 0]; x.face = 'confused'; }
      }
      return x;
    }
    case 'type': {                                                      // typing at the desk (close on the paper)
      x = st(CHAIR_MAX, Math.PI * 0, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = typingArms(s); return x;
    }
    case 'dig': {
      x = st(CHAIR_MAX, 0, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]];
      x.arms = [['L', 0.1, -1.05 + 0.08 * Math.sin(s * 7)], ['R', 0.1, -1.05 + 0.08 * Math.sin(s * 7 + 1)]];
      x.face = s > (T.dig + T.map) / 2 ? 'nervous' : 'determined'; x.look = [0.25 * Math.sin(s * 2.3), -0.25]; return x;
    }
    case 'billions': case 'yesno': case 'yes': case 'radar': {
      x = st(O(1.2, 0, -3.6), -0.1, 'nervous');
      if (SHOT === 'radar') { x.heading = headTo(O(1.2, 0, -3.6), RADAR_AT) - 0.4; x.face = 'nervous'; }
      if (SHOT === 'yesno') { x.heading = headTo(O(1.2, 0, -3.6), O(5.0, 0, -1.2)) - 0.5; x.face = 'nervous'; }
      if (SHOT === 'yes') {
        x.heading = headTo(O(1.2, 0, -3.6), O(5.0, 0, -1.2)) - 0.5; x.face = 'determined';
        const n = inv(W.yes2 - 0.25, W.yes2 + 0.35, s); x.look = [0, 0.32 * Math.sin(n * Math.PI * 2)];
      }
      if (SHOT === 'billions') { x.face = 'nervous'; x.heading = 0.25; }
      return x;
    }
    case 'home': {                                                      // walking out of the gate toward the camera
      const a = K.GATE.clone().add(V(14, 0, 0)), b = K.GATE.clone().add(V(-26, 0, 1));
      x = st(a, -R90, 'sad'); moveTo(x, a, b, T.home + 0.05, s, 12, -R90); x.face = 'sad'; x.look = [0, 0.18]; return x;
    }
    case 'dream': {                                                     // the elevator: presses a button, the gate shuts
      x = st(E(1.8, 0, -4.2), 0.15, 'sad'); x.box = true;
      const k = smooth(inv(T.dream + 0.25, T.dream + 0.6, s)) * (1 - smooth(inv(T.dream + 1.2, T.dream + 1.5, s)));
      x.arms = [['L', lerp(0.08, 1.15, k), lerp(0, -0.55, k)]];
      x.face = s > T.dream + 1.3 ? 'sad' : 'neutral'; return x;
    }
    case 'first': {                                                     // back in the morning: walks up, hands on hips
      const a = V(-8, 0, 50), b = V(-2.5, 0, 38.5);
      x = st(a, Math.PI, 'happy'); moveTo(x, a, b, T.first, s, 12, Math.PI - 0.35);
      if (!x.moving && s > T.first + 0.3) { x.layers = [['proud', s - T.first - 0.6, 1, false]]; x.face = 'cool'; }
      return x;
    }
    case 'cta': { x = st(V(-2.5, 0, 38.5), Math.PI - 0.15, 'happy'); x.wave = true; return x; }
  }
  return x;
}
function typingArms(s) { const a = 0.06 * Math.sin(s * 22), b = 0.06 * Math.sin(s * 22 + 2); return [['L', 0.12, -1.0 + a], ['R', 0.12, -1.0 + b]]; }

function leoAt(s) {
  let x = st(V(0, -50, 0), 0); x.visible = false;
  switch (SHOT) {
    case 'hook': {
      x = st(HOOK_LEO[0], 0, 'scared'); moveTo(x, HOOK_LEO[0], HOOK_LEO[1], -0.55, s, 16, 0);
      if (s > 0.6 && s < 1.2) x.look = [-0.9 * Math.sin(Math.PI * inv(0.6, 1.2, s)), 0];
      x.face = 'scared'; return x;
    }
    case 'office1': case 'eyes': case 'general': case 'rain': {
      x = st(MAP_LEO, 0.9, 'nervous');
      if (SHOT === 'office1') { x.heading = 0.8; x.face = s >= W.coming ? 'scared' : 'nervous'; }
      if (SHOT === 'eyes') { x.heading = 0.75; x.face = 'shocked'; x.layers = SHOCK(s, T.eyes + 0.04); }
      if (SHOT === 'general' || SHOT === 'rain') {
        x.heading = lerp(0.9, headTo(MAP_LEO, MIA_AT), smooth(inv(W.general1 - 0.1, W.general1 + 0.4, s))); x.face = 'scared';
        if (SHOT === 'rain' && s > W.why) { x.look = [-0.5 * smooth(inv(W.tornadoes2, W.tornadoes2 + 0.25, s)), 0]; x.face = 'nervous'; }
      }
      return x;
    }
    case 'dig': {
      x = st(CHAIR_LEO, 0.2, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]];
      x.arms = [['L', 0.1, -0.95], ['R', 0.1, -0.95 + 0.1 * Math.sin(s * 5)]]; x.look = [0.2 * Math.sin(s * 1.9 + 1), -0.3]; x.face = 'determined'; return x;
    }
    case 'billions': case 'yesno': case 'yes': case 'radar': {
      x = st(O(-1.6, 0, -3.2), 0.2, 'nervous');
      if (SHOT === 'billions') { x.layers = [['shrug', clamp(s - T.billions - 0.05, 0, 0.7), 1, false]]; x.face = 'nervous'; x.heading = 0.35; }
      if (SHOT === 'radar') { x.heading = headTo(O(-1.6, 0, -3.2), RADAR_AT) - 0.3; }
      if (SHOT === 'yesno' || SHOT === 'yes') { x.heading = headTo(O(-1.6, 0, -3.2), O(5.0, 0, -1.2)) - 0.55; }
      if (SHOT === 'yes') { x.face = 'determined'; const n = inv(W.yes2 - 0.2, W.yes2 + 0.4, s); x.look = [0, 0.32 * Math.sin(n * Math.PI * 2)]; }
      return x;
    }
    case 'shelter': {
      const a = V(96, 0, 28), b = K.SHELTER.clone().add(V(-1.2, 0, 2.5));
      x = st(a, 0, 'scared'); moveTo(x, a, b, T.shelter - 0.15, s, 16, 0); x.face = 'scared'; x.gone = !x.moving && s > T.shelter + 0.5; return x;
    }
    case 'ready': {
      const a = K.SHELTER.clone().add(V(-1.5, 0, 1.5)), b = K.SHELTER.clone().add(V(-4, 0, -9));
      x = st(a, Math.PI, 'happy'); moveTo(x, a, b, T.ready + 0.45, s, 12, Math.PI - 0.4); x.face = 'surprised'; if (!x.moving && s > T.ready + 1.2) x.face = 'happy'; return x;
    }
    case 'first': case 'cta': {
      x = st(V(-8.5, 0, 36.5), Math.PI - 0.55, 'happy');
      if (SHOT === 'first') { x.layers = [['laugh_big', s - T.first, 1, true]]; x.face = 'laugh'; }
      return x;
    }
  }
  return x;
}
function miaAt(s) {
  let x = st(V(0, -50, 0), 0, 'angry'); x.visible = false;
  switch (SHOT) {
    case 'general': {                                                   // through the door, straight to them
      x = st(MIA_IN, R90, 'angry'); moveTo(x, MIA_IN, MIA_AT, T.general + 0.1, s, 12, headTo(MIA_AT, MAP_MAX.clone().lerp(MAP_LEO, 0.5)) + 0.25);
      x.face = 'angry'; return x;
    }
    case 'rain': {
      x = st(MIA_AT, headTo(MIA_AT, MAP_MAX.clone().lerp(MAP_LEO, 0.5)) + 0.25, 'shouting');
      x.layers = [['talk', s, 1, true]]; x.face = s > W.why ? 'angry' : 'shouting'; return x;
    }
    case 'radar': {
      x = st(RADAR_AT, headTo(RADAR_AT, O(9.0, 0, -5.4)), 'suspicious'); x.layers = [['think', clamp(s - T.radar, 0, 0.4), 1, false]];
      x.look = [0, 0.35]; x.face = 'suspicious'; return x;
    }
    case 'yesno': case 'yes': {
      x = st(O(5.0, 0, -1.2), 0, 'angry');
      const h0 = headTo(O(5.0, 0, -1.2), O(9.0, 0, -5.4)), h1 = headTo(O(5.0, 0, -1.2), O(-0.2, 0, -3.4)) + 0.35;
      x.heading = lerp(h0, h1, smooth(inv(T.yesno, T.yesno + 0.4, s)));
      x.face = SHOT === 'yes' ? (s > W.yes2 + 0.2 ? 'determined' : 'surprised') : 'angry';
      if (SHOT === 'yesno' && s > T.yesno + 0.3) x.layers = [['talk', s, 1, true]];
      return x;
    }
    case 'shelter': {
      const a = V(104, 0, 24), b = K.SHELTER.clone().add(V(1.6, 0, 2.5));
      x = st(a, 0, 'determined'); moveTo(x, a, b, T.shelter - 0.05, s, 16, 0); x.gone = !x.moving && s > T.shelter + 0.5; return x;
    }
    case 'ready': {
      const a = K.SHELTER.clone().add(V(1.5, 0, 1.5)), b = K.SHELTER.clone().add(V(3.5, 0, -10));
      x = st(a, Math.PI, 'happy'); moveTo(x, a, b, T.ready + 0.15, s, 12, Math.PI + 0.3); x.face = 'happy'; return x;
    }
    case 'first': case 'cta': {
      x = st(V(3.5, 0, 36.5), Math.PI + 0.55, 'happy');
      if (SHOT === 'first') { if (s > T.first + 0.5) x.layers = [['clap', s, 1, true]]; x.face = 'happy'; }
      return x;
    }
  }
  return x;
}
// Skye and Noob: airmen. They push the fighter into hangar one, run for the shelter, and walk out in the morning.
function crewAt(a, s) {
  const isS = a === skye; let x = st(V(0, -50, 0), 0, 'neutral'); x.visible = false;
  switch (SHOT) {
    case 'hangar': {
      const pl = pushedAt(s), side = isS ? -1 : 1;
      x = st(pl.pos.clone().add(V(side * 3.4, 0, 7.6)), Math.PI, 'determined'); x.layers = pl.moving ? [['walk', pl.dist / STRIDE]] : [['idle', s]]; x.arms = PUSH; x.face = 'determined'; return x;
    }
    case 'shelter': {
      const a = isS ? V(110, 0, 16) : V(118, 0, 20), b = K.SHELTER.clone().add(V(isS ? -0.4 : 0.6, 0, 2.8));
      x = st(a, 0, 'scared'); moveTo(x, a, b, T.shelter - (isS ? 0.35 : 0.25), s, 16, 0); x.face = 'scared'; x.gone = !x.moving && s > T.shelter + 0.2; return x;
    }
    case 'ready': {
      const a = K.SHELTER.clone().add(V(isS ? -0.4 : 0.8, 0, 1.0)), b = K.SHELTER.clone().add(V(isS ? -9 : 9, 0, -6));
      x = st(a, Math.PI, 'happy'); moveTo(x, a, b, T.ready + (isS ? 0.75 : 0.95), s, 12, isS ? Math.PI - 0.6 : Math.PI + 0.6); x.face = 'surprised';
      if (!x.moving && s > T.ready + 1.6) x.face = 'happy'; return x;
    }
  }
  return x;
}
// The fighter being pushed into hangar one: nose first (-z), at walking pace.
const PUSH_FROM = V(K.HANGARS[0], 0, -26), PUSH_TO = V(K.HANGARS[0], 0, -60);
function pushedAt(s) { const d = PUSH_FROM.distanceTo(PUSH_TO), t0 = T.hangar - 0.35, u = clamp((s - t0) * 12 / d); return { pos: PUSH_FROM.clone().lerp(PUSH_TO, u), moving: u > 0 && u < 1, dist: u * d }; }

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
let NOW = 0;
function place(a, x) {
  a.root.visible = x.visible !== false && !x.gone;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  if (x.lift) a.root.position.y += x.lift;
  a.root.updateMatrixWorld(true);
  setExpression(a, x.face);
}
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };

// ---------- planes ----------
function placePlanes(s) {
  for (const p of PLANES) {
    const g = p.g; g.visible = false;
    g.position.copy(p.home); g.rotation.set(0, p.heading, 0); for (const pr of g.userData.props) pr.rotation.z = 0;
    const rows = SHOT === 'hook' || SHOT === 'odds' || SHOT === 'same';
    if (p.role === 'row' && rows) {
      g.visible = true;
      if (SHOT === 'hook' && p.toss && s >= p.toss.t0) {
        const k = clamp((s - p.toss.t0) / p.toss.dur), tp = p.toss;
        K.tossPose(g, p.home, tp.to, tp.h, easeOut(k) * 0.4 + k * 0.6, tp.spin, tp.end, p.heading);
        if (k < 0.35) { const c = TOR1(s); g.position.lerp(V(c.x, g.position.y, c.z), 0.35 * Math.sin(k / 0.35 * Math.PI)); }
      }
      if (SHOT === 'same' && p.kind === 'fighter') g.visible = false;
    }
    if (p.role === 'inside' && (SHOT === 'hangar' || SHOT === 'ready' || SHOT === 'first' || SHOT === 'cta')) g.visible = true;
    if (p.role === 'pushed') {
      if (SHOT === 'hangar') { g.visible = true; g.position.copy(pushedAt(s).pos); }
      if (SHOT === 'ready' || SHOT === 'first' || SHOT === 'cta') { g.visible = true; g.position.copy(PUSH_TO).add(V(0, 0, -14)); }
    }
    if (p.role === 'tied') {
      if (SHOT === 'hit2') {
        g.visible = true; const c = TOR2(s), near = clamp(1 - Math.abs(c.x - p.home.x) / 40);
        g.rotation.set(0.05 * near * Math.sin(s * 9 + p.home.x), p.heading, 0.12 * near * Math.sin(s * 11 + p.home.x));
      }
      if (SHOT === 'ready' || SHOT === 'first' || SHOT === 'cta') {
        g.visible = true;
        if (p === P.tied[1]) { g.position.copy(p.home).add(V(10, 5.2, 6)); g.rotation.set(0.15, p.heading + 0.9, Math.PI - 0.12); }   // this one flipped
      }
    }
    if (p.role === 'carried' && SHOT === 'hook') {
      g.visible = true; const i = P.carried.indexOf(p), c = TOR1(s), a = s * (2.6 - i * 0.5) + i * 2.6, R = 11 + i * 6, h = 18 + i * 12 + 3 * Math.sin(s * 3 + i);
      g.position.set(c.x + Math.cos(a) * R - 9 * (h / 70) ** 2, h, c.z + Math.sin(a) * R); g.rotation.set(s * (2 + i), -a, s * (3.4 - i));
    }
    if (g.visible) for (const pr of g.userData.props) pr.rotation.z = SHOT === 'hook' || SHOT === 'hit2' ? s * 9 : 0;
  }
}

// ---------- lighting ----------
const MODES = {
  night: { sun: 0.55, sunC: '#9fb4ff', hemi: 0.55, env: 0.35, fill: 0.35, rim: 0.9, z: '#0d1424', h: '#2a3550', fog: '#1c2232', near: 80, far: 520, flood: 1 },
  office: { sun: 0, sunC: '#ffffff', hemi: 0.5, env: 0.3, fill: 0.35, rim: 0.4, z: '#3a4252', h: '#8a8f96', fog: '#6f7480', near: 200, far: 900, lamp: 55, win: 10 },
  day: { sun: 1.9, sunC: '#fff0dc', hemi: 0.8, env: 0.5, fill: 0.55, rim: 0.8, z: '#4a6aa0', h: '#c8d2dc', fog: '#b9c4cf', near: 150, far: 900 },
  storm: { sun: 1.1, sunC: '#d8dce8', hemi: 0.95, env: 0.5, fill: 0.55, rim: 0.7, z: '#3a4252', h: '#8a8f96', fog: '#6f7480', near: 70, far: 520, deck: 1 },
  dusk: { sun: 1.5, sunC: '#ffb070', hemi: 0.75, env: 0.45, fill: 0.45, rim: 1.0, z: '#3d3a48', h: '#c9a77a', fog: '#8f7f6a', near: 70, far: 520, deck: 1 },
  morning: { sun: 2.7, sunC: '#fff0dc', hemi: 0.6, env: 0.55, fill: 0.7, rim: 1.0, z: '#4f8fe6', h: '#d7ecff', fog: '#cfe3f5', near: 150, far: 900 },
  elevator: { sun: 0, sunC: '#ffffff', hemi: 0.5, env: 0.35, fill: 0.4, rim: 0.5, z: '#e9dcc0', h: '#f4ead2', fog: '#e9dcc0', near: 200, far: 900, el: 70 },
  table: { sun: 0, sunC: '#ffffff', hemi: 0.9, env: 0.6, fill: 0.6, rim: 0.6, z: '#c9d2dc', h: '#e8eef4', fog: '#e8eef4', near: 200, far: 900 },
};
function light(stage, mode, F) {
  const L = MODES[mode], u = stage.skyMesh.material.uniforms, sc = stage.scene;
  stage.sun.intensity = L.sun; stage.sun.color.set(L.sunC); stage.hemi.intensity = L.hemi + 2.0 * F; sc.environmentIntensity = L.env + 0.5 * F;
  stage.fill.intensity = L.fill + 0.6 * F; stage.rim.intensity = L.rim;
  u.zenith.value.set(L.z).lerp(new THREE.Color('#c9d2ff'), 0.6 * F); u.horizon.value.set(L.h).lerp(new THREE.Color('#eef1ff'), 0.5 * F);
  sc.fog.color.set(L.fog).lerp(new THREE.Color('#9aa6c8'), 0.4 * F); sc.fog.near = L.near; sc.fog.far = L.far;
  S.of.lamp.intensity = L.lamp || 0; S.of.winLight.intensity = (L.win || 0) + 40 * F; S.of.radarLight.intensity = mode === 'office' && SHOT === 'radar' ? 14 : 0;
  S.el.light.intensity = L.el || 0;
  for (const l of S.floodLights) l.intensity = L.flood ? 900 : 0;
  for (const h of S.base.flood) h.material.emissiveIntensity = L.flood ? 3 : 0;
  deck.visible = !!L.deck || mode === 'night'; deck.userData.mat.color.set(mode === 'dusk' ? '#5a5048' : mode === 'night' ? '#1c2030' : '#4a4f5a');
}

// ---------- cameras ----------
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) {
    const on = k === place0 || (k === 'trees' && place0 === 'base');
    if (Array.isArray(g)) g.forEach((o) => { o.visible = on; }); else g.visible = on;
  }
  const F = flashAt(t) * (place0 === 'base' ? 1 : 0);
  light(stage, MODE_OF[SHOT] || 'office', F);

  // ---------- cast ----------
  place(max, maxAt(s)); place(leo, leoAt(s)); place(mia, miaAt(s)); place(skye, crewAt(skye, s)); place(noob, crewAt(noob, s));
  maxBox.item.visible = SHOT === 'dream';
  placePlanes(s);

  // ---------- the tornadoes ----------
  tor1.visible = SHOT === 'hook'; if (tor1.visible) { tor1.position.copy(TOR1(s)); K.updateTornado(tor1, s, { strength: 1, spin: 1.2 }); }
  tor2.visible = SHOT === 'hit2'; if (tor2.visible) { tor2.position.copy(TOR2(s)); K.updateTornado(tor2, s, { strength: smooth(inv(T.hit2 - 0.1, T.hit2 + 0.5, s)), spin: 1.3 }); }
  deck.position.set(SHOT === 'hook' ? -80 : 0, 0, 0);

  // ---------- base dressing ----------
  const hg = S.base.hangars;
  const shut = SHOT === 'hangar' ? smooth(inv(W.hangars + 0.25, W.everyone - 0.05, s)) : SHOT === 'hit2' || SHOT === 'shelter' || SHOT === 'home' ? 1 : 0;
  hg.forEach((h, i) => { h.open(1 - (i === 0 && SHOT === 'hangar' ? 0 : shut)); if (SHOT === 'hit2') h.leaves.forEach((l, j) => { l.position.x += 0.12 * Math.sin(s * 23 + i + j); }); });
  if (SHOT === 'hangar') hg[1].open(1 - smooth(inv(T.hangar + 0.2, T.hangar + 1.6, s))), hg[2].open(1 - smooth(inv(T.hangar + 0.6, T.hangar + 2.0, s)));
  const siren = SHOT === 'shelter' || SHOT === 'hangar' || SHOT === 'hit2';
  S.base.beacon.rotation.y = s * 7; S.base.lampM.emissiveIntensity = siren ? 2.5 : 0; S.base.beam.intensity = siren ? 400 : 0;
  S.base.sock.rotation.y = SHOT === 'hook' || SHOT === 'hit2' ? 0.4 * Math.sin(s * 6) : 0.2;
  // ropes on the tied-down fighters (hit2)
  P.ropes.forEach((l, i) => {
    const pl = P.tied[i >> 1]; l.visible = SHOT === 'hit2'; if (!l.visible) return;
    pl.g.updateMatrixWorld(true); const tip = V((i % 2 ? 1 : -1) * 9.3, 2.3, 2.5).applyMatrix4(pl.g.userData.body.matrixWorld);
    K.setRope(l, tip, pl.home.clone().add(V((i % 2 ? 1 : -1) * 11, 0, 3).applyAxisAngle(V(0, 1, 0), pl.heading)));
  });
  P.rings.visible = SHOT === 'odds'; P.rings.children.forEach((m, i) => { m.scale.setScalar(1 + 0.06 * Math.sin(s * 6 - i)); });
  P.path1.visible = P.path2.visible = SHOT === 'same';
  if (SHOT === 'same') { P.path1.userData.grow(1); P.path2.userData.grow(smooth(inv(T.same + 0.1, W.spot + 0.1, s))); }

  // ---------- office dressing ----------
  const of = S.of;
  of.door.rotation.y = SHOT === 'general' ? -1.6 * easeOut(inv(T.general - 0.05, T.general + 0.25, s)) : 0;
  of.ghost.material.opacity = SHOT === 'map' ? 0.9 * smooth(inv(W.map - 0.2, W.map + 0.2, s)) : 0;
  of.ghost.position.x = of.mapX + (SHOT === 'map' ? 12 * (1 - easeOut(inv(W.map - 0.2, W.exactly + 0.15, s))) : 0);
  // clock: 2:30 in the afternoon shots, spinning through the days in the montage, snapping to six for the strike
  let hrs = 14.5;
  if (SHOT === 'dig') hrs = 9 + 96 * smooth(inv(T.dig, T.map, s));
  if (SHOT === 'radar' || SHOT === 'yesno' || SHOT === 'yes') hrs = 14.75;
  if (SHOT === 'clock') hrs = 17.9 + 0.1 * easeOutBack(inv(T.clock + 0.15, T.clock + 0.4, s), 3);
  of.hourH.rotation.z = -(hrs % 12) / 12 * Math.PI * 2; of.minH.rotation.z = -(hrs % 1) * Math.PI * 2;
  const day = SHOT === 'dig' ? 20 + Math.min(5, Math.floor(1 + 5 * inv(T.dig, T.map - 0.2, s))) : 25;
  of.cal.material.map = of.calTex[day];
  const nFiles = SHOT === 'dig' ? Math.floor(18 * inv(T.dig, T.map - 0.3, s)) : SHOT === 'type' ? 3 : 6;
  of.files.forEach((f, i) => { f.visible = i < nFiles; });
  of.mugs.forEach((m, i) => { m.visible = SHOT === 'dig' ? i < Math.floor(5 * inv(T.dig, T.map - 0.3, s)) + 1 : i < 2; });
  K.setPaper(of.tw, SHOT === 'type' ? 'banned' : SHOT === 'yes' ? 'forecast' : 'blank');
  of.radar.update(s, SHOT === 'radar' || SHOT === 'yesno' ? inv(T.radar, T.yes, s) : 0);
  // papers flying in the montage
  P.sheets.forEach((p, i) => {
    p.visible = SHOT === 'dig'; if (!p.visible) return; const r = rng(500 + i), a = ((s - T.dig) * (0.9 + r() * 0.5) + r()) % 1;
    p.position.copy(O(-1 + r() * 8, 3.6 + a * 5 - a * a * 4, -2 + r() * 2.5)); p.rotation.set(a * 8 + r(), a * 5, a * 3);
  });
  // elevator
  if (SHOT === 'dream') {
    S.el.setGate(smooth(inv(T.dream + 0.7, T.dream + 1.5, s)));
    S.el.arrow.rotation.z = lerp(-1.3, 1.3, smooth(inv(T.dream + 1.3, T.clock, s)));
    S.el.buttons.forEach((b, i) => { b.material.emissiveIntensity = i === 1 && s > T.dream + 0.55 ? 3 : 0.4; });
  }
  // phone buzz
  if (SHOT === 'phone') { const b = (s - T.phone) % 0.9 < 0.4 ? 0.04 * Math.sin(s * 120) : 0; S.tb.phone.position.set(-0.5 + b, 3.36, 0.8); }

  // ---------- cameras ----------
  const mp = max.root.position.clone();
  switch (SHOT) {
    case 'hook': { const k = easeOut(clamp(t / T.days)); look(stage, V(lerp(-92.5, -93, k), lerp(3.4, 3.0, k), lerp(70, 68, k)), V(lerp(-96, -90, k), lerp(11, 9, k), 0), 56, 70); break; }
    case 'office1': look(stage, O(lerp(1.4, 0.9, u), 5.0, lerp(10.5, 9.5, u)), O(-3.8, 4.6, -4.8), 44, 14); break;
    case 'notice': look(stage, O(-8.2, 5.9, -3.2), O(-9.6, 5.7, -7.5), 38, 8); break;
    case 'type': { const p = of.tw.localToWorld(V(0, 2.1, -0.62)); look(stage, p.clone().add(V(0.6, 0.6, 3.6)), p.clone().add(V(0, -0.1, 0)), 40, 6); break; }
    case 'general': look(stage, O(lerp(5.5, 5.0, u), 5.4, 11.5), O(-5.2, 4.3, -1.6), 50, 16); break;
    case 'rain': look(stage, O(-9.5, 4.8, 6.5), O(-3.0, 4.6, -3.0), 46, 14); break;
    case 'dig': look(stage, O(lerp(3.2, 2.6, u), 5.8, lerp(8.5, 7.6, u)), O(2.2, 3.8, -2.6), 50, 12); break;
    case 'map': look(stage, O(-4.2 + 0.4 * u, 6.0, 5.2 - 0.6 * u), O(-4.2, 6.0, -7.5), 40, 10); break;
    case 'eyes': look(stage, O(-1.4, 5.0, 4.6), O(-4.0, 4.9, -4.3), 44, 10); break;
    case 'odds': { const k = easeOut(u); look(stage, V(-70 + 40 * (1 - k), lerp(130, 110, k), lerp(150, 120, k)), V(-70, 0, 0), 46, 120); break; }
    case 'billions': look(stage, O(0.4, 4.8, 5.4), O(-0.2, 4.6, -3.4), 46, 10); break;
    case 'radar': { const sp = of.radar.screenAt(); look(stage, sp.clone().add(V(-3.4, 0.6, 3.6)), sp.clone().lerp(headPos(mia), 0.5).add(V(0, -0.2, 0)), 42, 8); break; }
    case 'yesno': look(stage, O(-3.6, 5.0, 5.8), O(2.4, 4.6, -2.4), 46, 12); break;
    case 'yes': look(stage, O(2.6, 5.0, 4.8), O(-0.2, 4.6, -3.4), 46, 12); break;
    case 'hangar': look(stage, V(K.HANGARS[0] + 4, 5.5, K.HANGAR_Z - 40), V(K.HANGARS[0], 5.0, -30), 52, 40); break;
    case 'shelter': look(stage, K.SHELTER.clone().add(V(14, 4.2, -4)), K.SHELTER.clone().add(V(-10, 4.5, -26)), 50, 40); break;
    case 'home': look(stage, K.GATE.clone().add(V(-36, 4.2, 6)), K.GATE.clone().add(V(-6, 5.0, 0)), 46, 30); break;
    case 'dream': look(stage, E(lerp(0.2, 0.6, u), 5.2, lerp(9.5, 8.0, u)), E(1.2, 5.0, -4.2), 44, 12); break;
    case 'clock': { const c = of.hourH.parent.getWorldPosition(V()); look(stage, c.clone().add(V(0.3, -0.2, 3.4)), c, 40, 6); break; }
    case 'hit2': { const c = TOR2(s); look(stage, V(-30, 4.2, 66), V(lerp(-95, -60, u), 16, 0), 54, 80); break; }
    case 'same': { const k = easeOut(u); look(stage, V(-70, lerp(260, 230, k), 60), V(-70, 0, 2), 44, 160); break; }
    case 'ready': look(stage, K.SHELTER.clone().add(V(-3, 4.6, -26)), K.SHELTER.clone().add(V(0, 4.0, 0)), 48, 30); break;
    case 'first': look(stage, V(-1.5, 4.8, 22), V(-2.5, 4.6, 37.5), 50, 20); break;
    case 'phone': look(stage, K.TABLE.clone().add(V(0.4, 9.0, 3.6)), K.TABLE.clone().add(V(-0.4, 3.4, 0.8)), 38, 8); break;
    case 'cta': look(stage, V(-1.5, 5.0, 20), V(-2.5, 5.8, 37.5), 50, 20); break;
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
  head2D = {};
  for (const [k, a] of Object.entries({ max, leo, mia })) if (a.root.visible) { const p = headPos(a).project(cam); head2D[k] = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; }
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
const pop = (t, t0, d = 0.22, sc = 2.2) => easeOutBack(clamp((t - t0) / d), sc);
const out = (t, t1, d = 0.2) => 1 - clamp((t - (t1 - d)) / d);
function pill(g, s, text, x, y, k, color = '#ffd23f', bg = 'rgba(14,18,34,.85)', size = 46) {
  if (k <= 0) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70, h = size * 1.9;
  g.translate(x * s, y * s); g.scale(k, k);
  roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 26 * s); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
}
function bubble(g, s, lines, x, y, k, size = 56) {                     // speech bubble with a tail down to (x, y)
  if (k <= 0) return;
  g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) / s + 80, h = lines.length * size * 1.12 + 60;
  const bx = clamp(x - w / 2, 50, 900 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  const tx = clamp(x, bx + 50, bx + w - 50);
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h - 3) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo((tx - 22) * s, (by + h) * s); g.lineTo((tx + 4) * s, (y - 40) * s); g.lineTo((tx + 26) * s, (by + h) * s); g.stroke();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, (bx + w / 2) * s, (by + 30 + size * 0.56 + i * size * 1.12 + 4) * s));
  g.restore();
}
function stamp(g, s, text, x, y, k, color = '#e0262b', rot = -0.12, size = 120) {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); const sc = 1 + 1.6 * (1 - Math.min(1, k)); g.scale(sc, sc); g.globalAlpha = Math.min(1, k * 1.4);
  g.font = `${size * s}px "Alfa Slab One"`; const w = g.measureText(text).width / s + 70, h = size * 1.45;
  g.lineWidth = 12 * s; g.strokeStyle = color; roundRect(g, -w / 2 * s, -h / 2 * s, w * s, h * s, 18 * s); g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 6 * s); g.restore();
}
function rain(g, s, t, amount, slant = 0.35) {
  if (amount <= 0) return;
  const frame = Math.floor(t * 30); let st = 7919 + frame * 104729;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  g.save(); g.strokeStyle = `rgba(210,220,240,${0.3 * amount})`; g.lineWidth = 2.2 * s; g.lineCap = 'round';
  for (let i = 0; i < 120; i++) { const x = rnd() * 1300 - 110, y = rnd() * 1920, l = 40 + rnd() * 50; g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x - l * slant) * s, (y + l) * s); g.stroke(); }
  g.restore();
}
// The date / time pill under the For You tabs.
const DATES = [[0, T.days, 'MARCH 20, 1948 · 10 P.M.'], [T.days, T.notice, '5 DAYS LATER'], [T.map, T.eyes, 'MARCH 25 · AFTER LUNCH'], [T.yes, T.hangar, '2:50 P.M.'],
  [T.hit2, T.same, 'MARCH 25 · 6:00 P.M.'], [T.ready, T.first, 'THE NEXT MORNING'], [T.phone, T.cta, 'TODAY']];
function dateTag(g, s, t) {
  for (const [a, b, text] of DATES) {
    if (t < a || t >= b) continue;
    const k = pop(t, a, 0.2, 1.8) * out(t, b, 0.12);
    g.save(); g.font = `${44 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 60;
    g.translate((60 + w / 2) * s, 270 * s); g.scale(k, k);
    roundRect(g, -w / 2 * s, -42 * s, w * s, 84 * s, 22 * s); g.fillStyle = 'rgba(14,18,34,.85)'; g.fill(); g.lineWidth = 4 * s; g.strokeStyle = '#ffffff'; g.stroke();
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4 * s); g.restore();
  }
}
// thought-bubble vignette for the daydream: soft cloud border + trailing dots
function dreamFrame(g, s, t) {
  const k = clamp((t - T.dream) / 0.2);
  g.save(); g.globalAlpha = k;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.beginPath(); g.rect(0, 0, 1080 * s, 1920 * s);
  // the hole: a cloud shape made of circles (even-odd)
  const cx = 540, cy = 900, rx = 470, ry = 700, n = 22;
  g.moveTo((cx + rx) * s, cy * s);
  for (let i = 1; i <= n; i++) {
    const a0 = ((i - 1) / n) * Math.PI * 2, a1 = (i / n) * Math.PI * 2, am = (a0 + a1) / 2;
    const p1 = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry], pm = [cx + Math.cos(am) * (rx + 70), cy + Math.sin(am) * (ry + 70)];
    g.quadraticCurveTo(pm[0] * s, pm[1] * s, p1[0] * s, p1[1] * s);
  }
  g.fill('evenodd');
  g.lineWidth = 8 * s; g.strokeStyle = 'rgba(40,46,70,.6)'; g.stroke();
  for (const [x, y, r] of [[240, 1700, 34], [170, 1790, 22], [120, 1855, 14]]) { g.beginPath(); g.arc(x * s, y * s, r * s, 0, 7); g.fillStyle = '#ffffff'; g.fill(); g.stroke(); }
  g.restore();
}
const OUTDOOR_RAIN = { hook: 0.8, hangar: 0.7, shelter: 1, home: 0.9, hit2: 1 };
export function overlay(g, s, t) {
  const F = flashAt(t) * (PLACE_OF[SHOT] === 'base' ? 1 : 0);
  if (OUTDOOR_RAIN[SHOT]) rain(g, s, t, OUTDOOR_RAIN[SHOT], SHOT === 'hit2' || SHOT === 'hook' ? 0.6 : 0.35);
  if (F > 0) { g.save(); g.globalAlpha = 0.3 * F; g.fillStyle = '#f2f5ff'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
  if (SHOT === 'dream') dreamFrame(g, s, t);
  dateTag(g, s, t);
  // the hook: planes wrecked counter
  if (SHOT === 'hook') {
    const n = Math.round(50 * smooth(inv(0.15, W.base1 + 0.25, t)));
    const k = t < 0.05 ? 1 : 1;
    g.save(); g.translate(540 * s, 470 * s); g.scale(k, k);
    roundRect(g, -380 * s, -95 * s, 760 * s, 190 * s, 34 * s); g.fillStyle = 'rgba(14,18,34,.86)'; g.fill(); g.lineWidth = 7 * s; g.strokeStyle = '#ff4d4d'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${48 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('PLANES WRECKED', 0, -40 * s);
    g.font = `${104 * s}px "Luckiest Guy"`; g.fillStyle = '#ff4d4d'; g.fillText(String(n), 0, 42 * s); g.restore();
  }
  if (SHOT === 'office1') {
    if (t > W.two - 0.1 && t < W.coming - 0.1 && head2D.max && head2D.leo) { const k = pop(t, W.two - 0.1) * out(t, W.coming - 0.1); bigText(g, s, 'WEATHERMEN', (head2D.max[0] + head2D.leo[0]) / 2, Math.min(head2D.max[1], head2D.leo[1]) - 170, 70, '#ffffff', k, -0.03); }
    if (t > W.coming - 0.1) bigText(g, s, "IT'S COMING", 540, 430, 110, '#ffd23f', pop(t, W.coming - 0.1), -0.04), bigText(g, s, 'BACK', 540, 560, 150, '#ff4d4d', pop(t, W.back - 0.05), -0.04);
  }
  if (SHOT === 'type' && t > W.allowed - 0.1) stamp(g, s, 'BANNED', 560, 980, clamp((t - W.allowed + 0.1) / 0.18), '#e0262b', -0.16, 130);
  if (SHOT === 'type' && t > W.word - 0.1) bigText(g, s, 'THE WORD "TORNADO"', 540, 520, 70, '#ffffff', pop(t, W.word - 0.1), -0.03);
  if (SHOT === 'general' && head2D.mia && t > W.general1 - 0.1) bigText(g, s, 'THE GENERAL', head2D.mia[0], head2D.mia[1] - 190, 66, '#ffd23f', pop(t, W.general1 - 0.1), -0.03);
  if (SHOT === 'rain' && head2D.mia) { const k = pop(t, T.rain + 0.05, 0.2, 2) * out(t, T.dig, 0.12); bubble(g, s, ['IF YOU CAN FORECAST RAIN,', 'WHY NOT TORNADOES?'], head2D.mia[0], Math.min(head2D.mia[1] - 70, 820), k, 52); }
  if (SHOT === 'dig') { const n = Math.min(5, 1 + Math.floor(5 * inv(T.dig, T.map - 0.2, t))); pill(g, s, `DAY ${n}`, 540, 470, pop(t, T.dig, 0.2), '#ffd23f', 'rgba(14,18,34,.85)', 70); }
  if (SHOT === 'map') {
    if (t > W.map - 0.1) pill(g, s, 'MARCH 20: THE NIGHT IT HIT', 540, 430, pop(t, W.map - 0.1) * out(t, T.eyes, 0.1), '#ff6b6b', 'rgba(14,18,34,.85)', 44);
    if (t > W.exactly - 0.05) stamp(g, s, 'SAME MAP', 540, 1240, clamp((t - W.exactly + 0.05) / 0.18), '#e0262b', -0.1, 110);
  }
  if (SHOT === 'odds') {
    bigText(g, s, 'SAME BASE?', 540, 430, 104, '#ffffff', pop(t, T.odds + 0.1), -0.03);
    const spin = Math.floor(t * 30) % 10; bigText(g, s, `ODDS: 1 IN ${'9'.repeat(1 + Math.floor(6 * inv(W.odds, W.billions, t)))}${spin}`, 540, 580, 70, '#ffd23f', pop(t, W.odds + 0.2), 0.02);
  }
  if (SHOT === 'billions') bigText(g, s, 'BILLIONS', 540, 440, 150, '#ffd23f', pop(t, T.billions), -0.05), bigText(g, s, 'TO 1', 540, 590, 120, '#ffffff', pop(t, T.billions + 0.15), -0.05);
  if (SHOT === 'yesno' && head2D.mia) { const k = pop(t, W.another2 - 0.05, 0.2, 2); bubble(g, s, ['ANOTHER TORNADO.', 'YES OR NO?'], head2D.mia[0], Math.min(head2D.mia[1] - 70, 820), k, 60); }
  if (SHOT === 'yes') { bigText(g, s, 'YES.', 540, 470, 190, '#7CFC9A', pop(t, W.yes2 - 0.08), -0.05); }
  if (SHOT === 'hangar' && t > W.hangars - 0.1) pill(g, s, 'PLANES INTO HANGARS', 540, 470, pop(t, W.hangars - 0.1), '#ffd23f', 'rgba(14,18,34,.85)', 54);
  if (SHOT === 'shelter') pill(g, s, 'EVERYONE TO SHELTER', 540, 470, pop(t, T.shelter + 0.05), '#ff6b6b', 'rgba(14,18,34,.85)', 54);
  if (SHOT === 'dream' && t > W.job - 0.15) bigText(g, s, 'NEW JOB?', 540, 400, 110, '#2b3550', pop(t, W.job - 0.15), -0.04, '#ffffff');
  if (SHOT === 'clock' && t > T.clock + 0.2) bigText(g, s, '6:00 P.M.', 540, 470, 140, '#ffd23f', pop(t, T.clock + 0.2), -0.04);
  if (SHOT === 'hit2' && t > W.again - 0.1) bigText(g, s, 'AGAIN!', 540, 470, 170, '#ff4d4d', pop(t, W.again - 0.1), -0.05);
  if (SHOT === 'same') {
    pill(g, s, 'MARCH 20', 300, 760, pop(t, T.same + 0.05), '#ff6b6b', 'rgba(14,18,34,.85)', 46);
    pill(g, s, 'MARCH 25', 300, 1150, pop(t, W.same2 - 0.1), '#ffffff', 'rgba(14,18,34,.85)', 46);
    bigText(g, s, 'ALMOST THE', 540, 400, 96, '#ffffff', pop(t, T.same + 0.1), -0.03); bigText(g, s, 'SAME SPOT', 540, 520, 128, '#ffd23f', pop(t, W.spot - 0.1), -0.03);
  }
  if (SHOT === 'ready' && t > W.ready - 0.1) bigText(g, s, 'THIS TIME: READY', 540, 470, 96, '#7CFC9A', pop(t, W.ready - 0.1), -0.03);
  if (SHOT === 'first') {
    bigText(g, s, 'FIRST TORNADO', 540, 400, 104, '#ffffff', pop(t, W.first - 0.05), -0.03); bigText(g, s, 'FORECAST', 540, 520, 120, '#ffffff', pop(t, W.forecast2 - 0.1), -0.03);
    if (t > W.true - 0.1) stamp(g, s, 'IT CAME TRUE', 540, 680, clamp((t - W.true + 0.1) / 0.18), '#2fbf5a', -0.08, 96);
  }
  if (SHOT === 'phone' && t > W.warnings - 0.05) bigText(g, s, 'TORNADO WARNINGS', 540, 430, 92, '#ffffff', pop(t, W.warnings - 0.05), -0.03), bigText(g, s, 'START HERE', 540, 550, 110, '#ffd23f', pop(t, W.born - 0.1), -0.03);
  if (t >= T.cta) {                                       // call to action
    const k2 = easeOutBack(clamp((t - T.cta) / 0.3), 1.6);
    g.save(); g.translate(540 * s, 440 * s); g.scale(k2, k2);
    roundRect(g, -440 * s, -170 * s, 880 * s, 340 * s, 36 * s); g.fillStyle = 'rgba(12,16,32,.92)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#ffd23f'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${60 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('MORE STORIES LIKE THIS', 0, -100 * s);
    g.font = `800 ${46 * s}px Montserrat`; g.fillStyle = '#ffd23f'; g.fillText('@viralrobloxgames', 0, -26 * s);
    roundRect(g, -170 * s, 50 * s, 340 * s, 84 * s, 20 * s); g.fillStyle = '#fe2c55'; g.fill();
    g.font = `${52 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('FOLLOW', 0, 95 * s);
    g.restore();
  }
}

export const cast = () => ({ max, leo, mia, skye, noob });
export const TIMES = T;
export const SHOT_LIST = SHOTS;
