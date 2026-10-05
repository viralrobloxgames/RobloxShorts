// Lightning Hit Him Seven Times. Web renderer + Roblox R6 pack. True story (Roy Sullivan, Shenandoah park ranger,
// struck seven times 1942-77): the lookout tower (toenail), his truck window (eyebrows), his front yard (shoulder), the
// ranger station (hair on fire; from then on a can of water), outrunning a storm cloud (hair again), nobody standing near
// him (even his boss), his ankle, and fishing (hair a third time, and a bear steals his fish). The record still stands.
// Max is the ranger (ranger_hat), Leo his boss (ranger_hat), Mia and Skye on the bench; the bear is the pack bear cut into
// parts (animal_bear_parts). Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, inv, smooth, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose, fitAccessory, wear, packItem } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect, speedLines } from '../../../web/lib/overlay.js';
import { puff, cloud } from '../../../web/lib/world.js';
import { loadCreature, poseCreature, creaturePoint } from '../../../web/lib/creature.js';
import { W } from './beats.js';
import * as K from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'Lightning Hit Him Seven Times' };
export const sky = { zenith: '#2c3447', horizon: '#7a8296', below: '#5b6270', fog: '#6f7788', sunDir: new THREE.Vector3(0.35, 0.75, 0.55) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R90 = Math.PI / 2;

// ---------- key times (all on the narration) ----------
const T = {
  every: W.every - 0.1, s1: W.s1 - 0.1, door: W.runs - 0.25, hit1: W.then - 0.1, toe: W.toenail - 0.35,
  s2: W.s2 - 0.1, brows: W.window + 0.12, drift: W.eyebrows + 0.75, s3: W.s3 - 0.1, s4: W.s4 - 0.1, can: W.now - 0.1,
  s5: W.s5 - 0.1, race: W.races - 0.1, safe: W.steps - 0.15, hit5: W.hair2 - 0.12, bench: W.soon - 0.1,
  boss: W.when - 0.1, boss2: W.boss - 0.15, s6: W.s6 - 0.1, s7: W.s7 - 0.1, hit7: W.hair3 - 0.12, bear: W.bear - 0.3,
  chase: W.chases - 0.1, seven: W.seven2 - 0.1, survived: W.survived - 0.1, museum: W.record - 0.1, cta: W.follow - 0.15,
};
// the moment each of the seven strikes lands on him (the HUD counts these)
const HIT = [W.hits, W.window - 0.03, W.yard - 0.06, W.sets, W.hair2, W.gets, W.hair3];
const POPS = [[W.toenail + 0.05, '-1 TOENAIL'], [W.eyebrows, '-2 EYEBROWS'], [W.yard + 0.05, 'SHOULDER: ZAPPED'], [W.fire1, 'HAIR: ON FIRE'],
  [W.fire2, 'HAIR: ON FIRE (AGAIN)'], [W.ankle, '-1 ANKLE'], [W.catches, 'HAIR: ON FIRE x3']];
const TITLES = [W.s1, W.s2, W.s3, W.s4, W.s5, W.s6, W.s7];

// ---------- scene ----------
let A = {}, max, leo, mia, skye, bear, maxHat, leoHat, pegHat, P = {}, S = {}, BOLTS = [], cam, SHOT = 'hook';
let flamesM, smokes = [], spark, rainbow, stormA, stormB, toeHole, leoHead2D = null;
const PLACES = {};
export async function setup(stage) {
  const { scene } = stage;
  [max, leo, mia, skye] = await Promise.all([
    loadRobloxCharacter('Max', { expressions: ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'determined', 'smug', 'sad', 'dizzy', 'knocked_out', 'laugh', 'cool',
      'singed', 'nobrow_scared', 'nobrow_sad', 'nobrow_determined', 'nobrow_surprised', 'nobrow_shocked', 'nobrow_smug', 'nobrow_confused', 'nobrow_annoyed', 'confused', 'annoyed'] }),
    loadRobloxCharacter('Leo', { expressions: ['happy', 'neutral', 'surprised', 'scared', 'nervous', 'shocked'], hairLift: 0.16 }),
    loadRobloxCharacter('Mia', { expressions: ['happy', 'neutral', 'surprised', 'nervous', 'scared'] }),
    loadRobloxCharacter('Skye', { expressions: ['happy', 'neutral', 'surprised', 'nervous', 'scared'] }),
  ]);
  scene.add(max.root, leo.root, mia.root, skye.root);
  maxHat = await fitAccessory(max, 'ranger_hat'); max.bones.Head.add(maxHat.item);
  leoHat = await wear(leo, 'ranger_hat');
  for (const n of ['idle', 'walk', 'run', 'proud', 'shrug', 'shock', 'sit', 'laugh_big', 'point_forward', 'look_up', 'dizzy', 'think', 'talk', 'facepalm']) A[n] = await loadAnimation(n);
  bear = await loadCreature('animal_bear_parts'); bear.root.scale.setScalar(0.5); scene.add(bear.root);
  bear.obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  K.ground(scene);
  PLACES.forest = K.forest(scene);
  const tw = K.tower(scene); PLACES.tower = tw.group; P.door = tw.door; S.roofTop = tw.roofTop;
  PLACES.road = K.road(scene);
  const yd = K.yard(scene); PLACES.yard = yd.group; S.transformer = yd.transformer;
  const st = K.station(scene); PLACES.station = st.group; S.st = st;
  const pd = K.pond(scene); PLACES.pond = pd.group;
  const mu = await K.museum(scene); PLACES.museum = mu.group; S.mu = mu;
  const strikeTree = K.pines(scene, [[K.STRIKE_TREE.x, K.STRIKE_TREE.z, 1.25]], 44); PLACES.strikeTree = strikeTree;

  const add = (k, o) => { P[k] = o; scene.add(o); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };
  add('truck', K.truck()); add('can', K.waterCan()); add('rod', K.fishingRod()); add('fish', K.fish()); add('line', K.line()); add('bobber', K.bobber());
  add('nail', K.toenail()); P.nail.scale.setScalar(2.2);
  pegHat = add('pegHat', await packItem('accessories', 'ranger_hat'));
  // a dark scorch on the front of his right boot after strike one (rides the leg)
  toeHole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshStandardMaterial({ color: '#141210', roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 }));
  toeHole.position.set(0.05, -1.82, 0.505); toeHole.scale.setScalar(0.75); toeHole.visible = false; max.bones['Leg.R'].add(toeHole);
  // fire on his head, smoke puffs, sparks
  flamesM = K.flames(); flamesM.position.set(0, 1.0, 0); flamesM.visible = false; max.bones.Head.add(flamesM);
  const smokeMat = new THREE.MeshStandardMaterial({ color: '#5d5d62', roughness: 1, transparent: true, opacity: 0.6, depthWrite: false });
  for (let i = 0; i < 14; i++) { const p = puff(); p.material = smokeMat.clone(); p.visible = false; scene.add(p); smokes.push(p); }
  spark = K.sparks(28); scene.add(spark);
  // water drops for the pour
  P.drops = []; const dm = new THREE.MeshStandardMaterial({ color: '#7fc4ff', roughness: 0.1, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), dm); d.scale.y = 1.8; d.visible = false; scene.add(d); P.drops.push(d); }
  // storm clouds: one that follows him in the hook, one that chases the truck
  stormA = K.stormCloud(5, 7); scene.add(stormA); stormB = K.stormCloud(8, 9); scene.add(stormB);
  // the rainbow at the end (half rings, far behind the pond)
  rainbow = new THREE.Group();
  ['#ff5a5a', '#ffa64d', '#ffe066', '#7ddc6f', '#5ab0ff', '#9a7bff'].forEach((c, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(60 - i * 2.2, 1.1, 8, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.0, fog: false, depthWrite: false }));
    rainbow.add(m);
  });
  rainbow.position.set(K.POND.x - 10, -8, K.POND.z - 150); scene.add(rainbow);

  // ---------- bolts (endpoints from where everyone is at that moment) ----------
  const head = (s) => maxAt(s).pos.clone().add(V(0, 5.1, 0));
  const skyAbove = (p, dx = -6, dz = -30) => p.clone().add(V(dx, 85, dz));
  const B = (t0, a, b, o = {}) => { const g = K.bolt(o.seed ?? Math.round(t0 * 100), a, b, o); g.visible = false; scene.add(g); BOLTS.push({ t0, g, strength: o.strength ?? 1, place: o.place }); };
  B(-0.06, skyAbove(V(0, 0, 0), -10, -26), V(0, 5.6, 0), { seed: 7 });                                    // the hook
  for (const [i, t] of [W.keeps, W.hitting, W.tower].entries()) B(t - 0.03, skyAbove(S.roofTop, -8 + i * 7, -25), S.roofTop.clone().add(V(0, 0.3, 0)), { seed: 30 + i, strength: 0.7, width: 0.5 });
  B(HIT[0] - 0.04, skyAbove(head(HIT[0]), 8, 12), head(HIT[0]), { seed: 41 });
  const tree = K.STRIKE_TREE.clone(), win = truckAt(HIT[1]).localToWorld(V(0.1, 4.6, -2.2));
  B(W.comes, skyAbove(tree, 8, -30), tree.clone().add(V(0, 10.5, 0)), { seed: 51 });
  B(HIT[1] - 0.05, tree.clone().add(V(0, 6.5, 0)), win, { seed: 52, width: 0.14, forks: 1 });
  B(W.own - 0.02, skyAbove(S.transformer, -8, -20), S.transformer.clone().add(V(0, 0.9, 0)), { seed: 61, strength: 0.8 });
  B(HIT[2] - 0.05, S.transformer.clone().add(V(-0.6, 0, 0)), maxAt(HIT[2]).pos.clone().add(V(0, 3.5, 0)), { seed: 62, width: 0.12, forks: 1 });
  B(HIT[3] - 0.04, S.st.bulb.clone(), head(HIT[3] + 0.01), { seed: 71, width: 0.12, forks: 1, place: 'office' });
  B(HIT[4] - 0.04, skyAbove(head(HIT[4]), 6, -24), head(HIT[4]), { seed: 81 });
  B(W.flashes - 0.03, V(-180, 70, -70), V(-170, 0, -60), { seed: 91, strength: 0.45, width: 0.5 });
  B(HIT[5] - 0.04, skyAbove(maxAt(HIT[5]).pos, 6, -24), maxAt(HIT[5]).pos.clone().add(V(0.3, 0.1, 0.6)), { seed: 101 });
  B(HIT[6] - 0.04, skyAbove(head(HIT[6]), -6, 28), head(HIT[6]), { seed: 111 });
}

// ---------- the truck ----------
// Strike two: driving +x at 14, the driver's window passes the strike tree at HIT[1]; then it rolls to a stop at the
// guardrail, drifting toward the cliff. Strike five: driving at 14, then racing at 30 from W.races, parked at the
// scenic view from T.safe.
const TRUCK = new THREE.Object3D();
const D2 = { x0: K.STRIKE_TREE.x - 6.1, v: 14, roll: W.window + 0.55, stop: W.eyebrows + 1.5 };
const PARK_X = 62, D5 = { race: W.races - 0.05, v1: 14, v2: 30 };
function truckAt(s) {
  let x, z = K.ROAD_Z - 2.2, yaw = 0;
  if (s < T.s3) {
    if (s < D2.roll) x = D2.x0 + D2.v * (s - HIT[1]);
    else {                                                   // decelerate to a stop over [roll, stop], steering toward the rail
      const dur = D2.stop - D2.roll, u = clamp((s - D2.roll) / dur);
      x = D2.x0 + D2.v * (D2.roll - HIT[1]) + D2.v * dur * (u - u * u / 2);
      z += 4.6 * smooth(u); yaw = -0.35 * Math.sin(Math.PI * u) * (1 - u * 0.4) - 0.12 * smooth(u);
    }
  } else {
    // strike five: arrives at PARK_X at T.safe; speed v2 over [race, T.safe - 0.5], v1 before
    const dec = T.safe - 0.5, x1 = PARK_X - D5.v2 * (dec - D5.race) - D5.v2 * 0.25;
    if (s < D5.race) x = x1 - D5.v1 * (D5.race - s);
    else if (s < dec) x = x1 + D5.v2 * (s - D5.race);
    else { const u = clamp((s - dec) / 0.5); x = x1 + D5.v2 * (dec - D5.race) + D5.v2 * 0.5 * (u - u * u / 2); }
  }
  TRUCK.position.set(x, 0, z); TRUCK.rotation.set(0, yaw, 0); TRUCK.updateMatrixWorld(true);
  return TRUCK;
}

// ---------- the cast ----------
const st = (pos, heading, face = 'happy') => ({ pos: pos.clone(), heading, layers: [['idle', 0]], face, arms: [], visible: true });
// constant-speed move; the leg cycle follows distance travelled (walk under 14 studs/s, run above)
function moveTo(x, from, to, t0, s, speed, endHeading) {
  const d = from.distanceTo(to), u = d < 1e-3 ? 1 : clamp((s - t0) * speed / d);
  x.pos = from.clone().lerp(to, u);
  const moving = u > 0 && u < 1;
  if (moving) { x.heading = Math.atan2(to.x - from.x, to.z - from.z); x.layers = [[speed >= 14 ? 'run' : 'walk', (u * d) / STRIDE]]; }
  else if (u >= 1) { x.heading = endHeading ?? x.heading; x.layers = [['idle', s]]; }
  x.moving = moving; return x;
}
const hillY = (p) => { const dx = p.x - K.TOWER.x, dz = p.z - K.TOWER.z, r2 = dx * dx + dz * dz; return r2 < 3600 ? K.HILL_Y * Math.sqrt(1 - r2 / 3600) : 0; };
// arm poses: [side, up, fwd] (fwd < 0 raises the arm in front)
const CARRY_CAN = [['R', 0.08, -0.12]], SHOW_CAN = [['R', 0.25, -1.35]], POUR = [['R', 2.25, 0.25]], WHEEL = [['L', 0.18, -1.05], ['R', 0.18, -1.05]];
const ROD = [['R', 0.1, -0.95]], ROD_UP = [['R', 0.12, -1.35]], ROD_WAVE = (s) => [['R', 2.3 + 0.18 * Math.sin(s * 14), 0.15]];
// after strike two his eyebrows are gone: faces with brows swap to their brow-less copies
const NOBROW = { scared: 'nobrow_scared', sad: 'nobrow_sad', determined: 'nobrow_determined', surprised: 'nobrow_surprised', shocked: 'nobrow_shocked', smug: 'nobrow_smug', confused: 'nobrow_confused', annoyed: 'nobrow_annoyed' };
const maxFace = (f, s) => (s >= W.burns && NOBROW[f] ? NOBROW[f] : f);

const HOOK_POS = V(0, 0, 0);
const DOOR_IN = K.TOWER_DOOR.clone().add(V(0, -K.HILL_Y + 0, -2.2)), DOOR_OUT = K.TOWER_DOOR.clone().add(V(2.6, 0, 6.2));
const YARD_DOOR = K.YARD.clone().add(V(0, 0, -4.2)), YARD_BOX = K.YARD.clone().add(V(1.9, 0, 8.4));
const ST_DOOR = K.STATION.clone().add(V(0, 0, 0.6)), ST_OUT = K.STATION.clone().add(V(1.2, 0, 6.8));
const BENCH_SEAT = (dx) => K.BENCH.clone().add(V(dx, 0, -0.05));
const TRAIL_A = V(-27, 0, -0.9), TRAIL_B = V(-19.5, 0, -0.9);
const SPOT = V(K.POND_SPOT.x, 0, K.POND_SPOT.z);

function maxAt(s) {
  let x = st(HOOK_POS, 0.5, 'shocked');
  if (s < T.every) {                                            // the hook: struck in the clearing
    x.layers = [['shock', clamp(s + 0.35, 0, 0.6), 1, false]]; x.face = s < 0.9 ? 'shocked' : 'dizzy';
    if (s > 1.2) { x.layers = [['dizzy', s - 1.2, 1, true]]; x.face = 'dizzy'; }
    x.smoke = 1; x.hat = hatPop(s, -0.12, 1.25); return x;
  }
  if (s < T.s1) {                                               // walks off along the trail, a cloud overhead
    x = st(V(-8, 0, 0), R90, 'annoyed');
    moveTo(x, V(-8, 0, 0), V(22, 0, 0), T.every + 0.25, s, 12, R90); x.face = 'annoyed'; x.smoke = 0.4;
    return x;
  }
  if (s < T.door) { x = st(DOOR_IN, 0, 'scared'); x.visible = false; return x; }   // inside the tower
  if (s < T.s2) {                                               // strike one: out of the door, then hit
    x = st(DOOR_IN, 0, 'scared');
    const from = DOOR_IN.clone(), to = DOOR_OUT.clone(); from.y = hillY(from); to.y = hillY(to);
    moveTo(x, from, to, W.runs - 0.15, s, 16, 0.55); if (x.moving) x.face = 'scared';
    if (!x.moving && s > W.runs) { x.face = 'happy'; x.layers = [['idle', s]]; }
    if (s >= HIT[0]) { x.layers = [['shock', clamp(s - HIT[0], 0, 0.6), 1, false]]; x.face = 'shocked'; x.hat = hatPop(s, HIT[0], HIT[0] + 1.0); x.smoke = 1; }
    if (s >= W.toenail + 0.3) { x.face = 'dizzy'; }
    x.pos.y = hillY(x.pos);
    return x;
  }
  if (s < T.s3) {                                               // strike two: in the truck
    const tr = truckAt(s), seat = tr.localToWorld(V(-0.35, 1.8 - 1.5, -1.0));
    x = st(seat, tr.rotation.y + R90, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = WHEEL;
    if (s >= HIT[1]) { x.face = 'shocked'; x.hat = hatPop(s, HIT[1], HIT[1] + 0.5, 0.35); x.look = [0.55 * smooth(inv(HIT[1], HIT[1] + 0.2, s)), 0]; }
    if (s >= W.burns - 0.05) { x.face = 'singed'; x.smoke = 0.8; }
    if (s >= T.drift) { x.face = 'knocked_out'; x.arms = [['L', 0.1, -0.5], ['R', 0.1, -0.5]]; }
    if (s >= D2.stop + 0.1) x.face = 'dizzy';
    return x;
  }
  if (s < T.s4) {                                               // strike three: the front yard
    x = st(YARD_DOOR, 0, 'happy');
    moveTo(x, YARD_DOOR, YARD_BOX, T.s3 + 0.1, s, 12, 0.6);
    if (s >= HIT[2]) { x.layers = [['shock', clamp(s - HIT[2], 0, 0.6), 1, false]]; x.face = 'shocked'; x.hat = hatPop(s, HIT[2], HIT[2] + 0.9); x.smoke = 0.8; x.zap = 1; }
    if (s >= HIT[2] + 1.0) { x.layers = [['dizzy', s - HIT[2] - 1.0, 1, true]]; x.face = 'dizzy'; }
    return x;
  }
  if (s < T.can) {                                              // strike four: the office, sitting at the desk
    const ch = S.st ? S.st.chair : K.STATION_IN.clone().add(V(-1.5, 1.75, -5.0));
    x = st(V(ch.x, ch.y - 1.5, ch.z), 0, 'neutral'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = [['L', 0.1, -1.2], ['R', 0.1, -1.2]];
    x.hat = { off: true };
    if (s >= HIT[3]) { x.face = 'shocked'; x.arms = [['L', 0.5, -1.0], ['R', 0.5, -1.0]]; }
    if (s >= W.hair1 - 0.1) {                                  // jumps up, hair on fire
      x.sit = false; x.pos = V(ch.x, 0, ch.z + 0.2); x.layers = [['shock', clamp(s - W.hair1 + 0.1, 0, 0.6), 1, false]]; x.face = 'scared'; x.arms = [];
      x.fire = 1; x.lift = 0.35 * Math.max(0, Math.sin(clamp((s - W.hair1 + 0.1) / 0.35) * Math.PI));
    }
    return x;
  }
  if (s < T.s5) {                                               // a can of water from now on
    x = st(ST_DOOR, 0, 'determined'); moveTo(x, ST_DOOR, ST_OUT, T.can + 0.15, s, 12, 0.35);
    x.arms = x.moving ? CARRY_CAN : [['R', lerp(0.08, 0.25, smooth(inv(W.can - 0.35, W.can, s))), lerp(-0.12, -1.35, smooth(inv(W.can - 0.35, W.can, s)))]];
    x.can = 'hand'; return x;
  }
  if (s < T.safe) {                                             // strike five: driving, the cloud, racing away
    const tr = truckAt(s), seat = tr.localToWorld(V(-0.35, 0.3, -1.0));
    x = st(seat, R90, 'determined'); x.sit = true; x.layers = [['sit', 0, 1, false]]; x.arms = WHEEL;
    if (s >= W.spots - 0.1) { const k = smooth(inv(W.spots - 0.1, W.spots + 0.3, s)) * (1 - smooth(inv(W.races - 0.3, W.races, s))); x.look = [0.9 * k, -0.35 * k]; x.face = 'scared'; }
    if (s >= W.races - 0.1) x.face = 'determined';
    return x;
  }
  if (s < T.bench) {                                            // steps out at the scenic view; hit; the water can
    const tr = truckAt(T.safe + 0.5), door = tr.localToWorld(V(0.3, 0, -3.0)), out = tr.localToWorld(V(1.6, 0, -6.6));
    x = st(door, Math.PI, 'determined'); moveTo(x, door, out, T.safe + 0.05, s, 12, Math.PI + 0.35);
    x.arms = CARRY_CAN; x.can = 'hand';
    if (s >= W.sure - 0.1) x.face = 'smug';
    if (s >= W.safe - 0.15) { x.layers = [['proud', s - W.safe + 0.15, 1, false]]; x.arms = [['R', 0.08, -0.12]]; }
    if (s >= HIT[4]) { x.layers = [['shock', clamp(s - HIT[4], 0, 0.6), 1, false]]; x.face = 'shocked'; x.hat = hatPop(s, HIT[4], W.again + 1.05); x.fire = 1 - smooth(inv(W.again + 0.35, W.again + 0.75, s)); x.smoke = 1; x.arms = CARRY_CAN; }
    if (s >= W.again - 0.05) {                                  // lifts the can over his head and pours
      const k = smooth(inv(W.again - 0.05, W.again + 0.2, s)) * (1 - smooth(inv(W.again + 0.85, W.again + 1.1, s)));
      x.layers = [['idle', s]]; x.arms = [['R', lerp(0.08, 2.25, k), lerp(-0.12, 0.25, k)]]; x.pour = k; x.face = 'scared';
      if (s > W.again + 0.8) x.face = 'annoyed';
    }
    return x;
  }
  if (s < T.boss) {                                             // the bench: everybody leaves
    x = st(BENCH_SEAT(2.1), 0, 'happy'); x.sit = true; x.pos.y = 1.64 - 1.5; x.layers = [['sit', 0, 1, false]]; x.smoke = 0.3;
    if (s >= W.stand) x.face = 'sad';
    return x;
  }
  if (s < T.boss2) {                                            // walking with the boss; lightning far away
    x = st(TRAIL_A.clone().add(V(0, 0, 0.9)), R90, 'happy'); moveTo(x, TRAIL_A.clone().add(V(0, 0, 0.9)), TRAIL_B.clone().add(V(0, 0, 0.9)), T.boss, s, 12, R90 - 0.4);
    if (s >= W.far - 0.2) { const k = smooth(inv(W.far - 0.2, W.far + 0.2, s)); x.look = [-1.1 * k, 0]; x.face = 'surprised'; }
    return x;
  }
  if (s < T.s6) {                                               // "I'll see you later."
    x = st(V(-13.2, 0, 0.2), -R90 + 0.45, 'surprised');
    if (s >= W.later + 0.2) x.face = 'sad';
    if (s >= W.later + 0.9) { x.layers = [['shrug', s - W.later - 0.9, 1, false]]; x.face = 'sad'; }
    return x;
  }
  if (s < T.s7) {                                               // strike six: the ankle
    x = st(V(0, 0, 0.3), R90, 'happy'); moveTo(x, V(-8, 0, 0.3), V(6, 0, 0.3), T.s6, s, 12, R90);
    if (s < HIT[5] && s < T.s6 + 14 / 12) x.pos = x.pos;     // walking
    if (s >= HIT[5]) {
      const p0 = V(-8, 0, 0.3).lerp(V(6, 0, 0.3), clamp((HIT[5] - T.s6) * 12 / 14));
      x.pos = p0; x.heading = lerp(R90, 0.35, smooth(inv(HIT[5], HIT[5] + 0.3, s))); x.layers = [['shock', clamp(s - HIT[5], 0, 0.6), 1, false]]; x.face = 'shocked'; x.hat = hatPop(s, HIT[5], HIT[5] + 0.7, 0.8);
      if (s >= HIT[5] + 0.35) {                                // hops on his left leg
        const h = s - HIT[5] - 0.35; x.layers = [['idle', s]]; x.legs = [['R', -0.9]]; x.lift = 0.55 * Math.abs(Math.sin(h * Math.PI * 2.4)); x.face = 'scared';
        x.arms = [['L', 0.9, 0], ['R', 0.9, 0]];
      }
    }
    return x;
  }
  if (s < T.seven) {                                            // strike seven: fishing, the bear
    x = st(SPOT, Math.PI, 'happy'); x.arms = ROD; x.rod = 'fish';
    if (s >= W.fishing + 0.55) x.arms = ROD_UP;
    if (s >= HIT[6]) { x.layers = [['shock', clamp(s - HIT[6], 0, 0.6), 1, false]]; x.face = 'shocked'; x.hat = hatPop(s, HIT[6], T.bear + 0.15); x.fire = 1 - smooth(inv(T.bear - 0.35, T.bear + 0.05, s)); x.smoke = 1; x.arms = ROD_UP; }
    if (s >= T.bear) { x.layers = [['idle', s]]; x.face = 'dizzy'; x.heading = lerp(Math.PI, Math.PI - 0.9, smooth(inv(W.walks, W.walks + 0.5, s))); }
    if (s >= W.steal) x.face = 'surprised';
    if (s >= W.fish + 0.1) x.face = 'annoyed';
    if (s >= W.chases - 0.05) {                                 // charges the bear, waving the rod
      x.heading = Math.PI - 0.9; x.face = 'annoyed';
      moveTo(x, SPOT, SPOT.clone().add(V(7.5, 0, 2.4)), W.chases - 0.05, s, 16, R90 + 0.2); x.arms = ROD_WAVE(s);
      if (!x.moving && s > W.chases + 0.6) { x.face = 'annoyed'; }
    }
    if (s >= W.still - 0.3) x.smoke = 1;
    return x;
  }
  // the payoff: proud on the bank, the sky clearing
  x = st(SPOT.clone().add(V(4.5, 0, 2.0)), 0.25, 'happy'); x.layers = [['proud', s - T.seven, 1, false]]; x.smoke = 0.5 * (1 - smooth(inv(T.survived, T.museum, s)));
  if (s >= T.survived) x.face = 'laugh';
  if (s >= T.museum) x.visible = false;
  if (s >= T.cta) { x.visible = true; x.layers = [['idle', s]]; x.face = 'happy'; x.wave = true; x.smoke = 0; }
  return x;
}
// The hat pops up off his head at a strike (t0), tumbles while his hair burns, and drops back on by t1.
function hatPop(s, t0, t1, h = 2.2) {
  if (s < t0 || s > t1) return null;
  const up = easeOut(clamp((s - t0) / 0.25)), down = smooth(inv(t1 - 0.3, t1, s));
  return { lift: h * up * (1 - down) + 0.12 * Math.sin((s - t0) * 9) * up * (1 - down), spin: (s - t0) * 7 * (1 - down), tilt: 0.4 * up * (1 - down) };
}

function leoAt(s) {
  const x = st(V(0, 0, 0), 0, 'happy'); x.visible = false;
  if (s >= T.boss && s < T.boss2) {
    x.visible = true; moveTo(x, TRAIL_A.clone().add(V(0, 0, -0.9)), TRAIL_B.clone().add(V(0, 0, -0.9)), T.boss, s, 12, R90 - 0.2);
    if (s >= W.far - 0.2) { const k = smooth(inv(W.far - 0.2, W.far + 0.2, s)); x.look = [1.0 * k, 0]; x.face = 'surprised'; }
  } else if (s >= T.boss2 && s < T.s6) {
    x.visible = true; x.pos = V(-16.8, 0, 0.2); x.heading = R90 - 0.45; x.face = 'nervous';
    if (s >= W.says - 0.1) x.layers = [['talk', s, 1, true]];
    if (s >= W.later) { moveTo(x, V(-16.8, 0, 0.2), V(-42, 0, -1.5), W.later + 0.1, s, 13, -R90); x.face = 'scared'; }
  }
  return x;
}
function benchAt(a, s) {                                         // Mia (dx -2.4) and Skye (dx -0.4) on the bench, then leave
  const dx = a === mia ? -2.3 : -0.5, x = st(BENCH_SEAT(dx), 0, 'happy');
  x.visible = s >= T.bench && s < T.boss;
  x.sit = true; x.pos.y = 1.64 - 1.5; x.layers = [['sit', 0, 1, false]];
  if (s >= W.nobody - 0.1) { x.face = 'nervous'; x.look = [-0.7, 0]; }
  if (s >= W.stand) {
    x.sit = false; x.look = null; const from = BENCH_SEAT(dx).add(V(0, 0, 0.9)), to = K.BENCH.clone().add(V(-22 + (a === mia ? -2 : 0), 0, 3.5 + (a === mia ? 1.2 : 0)));
    moveTo(x, from, to, W.stand + (a === mia ? 0.05 : 0.2), s, 12, -R90); x.face = 'nervous';
  }
  return x;
}
// The bear: walks out of the reeds to the fish, takes it, then runs off when Max charges.
export const STUMP = SPOT.clone().add(V(3.0, 0, -0.6)), STUMP_TOP = 1.8;
const BEAR_IN = SPOT.clone().add(V(19, 0, -0.6)), BEAR_AT = STUMP.clone().add(V(2.35, 0, 0)), BEAR_OUT = SPOT.clone().add(V(30, 0, 22));
function bearAt(s) {
  const b = { visible: s >= T.bear - 0.3 && s < T.seven, pos: BEAR_IN.clone(), heading: -R90 - 0.5, dist: 0, head: 0, speed: 0 };
  if (!b.visible) return b;
  const d1 = BEAR_IN.distanceTo(BEAR_AT), v1 = 6.5, t1 = W.steal - 0.15, t0 = t1 - d1 / v1;
  const u = clamp((s - t0) * v1 / d1); b.pos = BEAR_IN.clone().lerp(BEAR_AT, u); b.dist = u * d1; b.heading = Math.atan2(BEAR_AT.x - BEAR_IN.x, BEAR_AT.z - BEAR_IN.z);
  b.head = 0.45 * smooth(inv(W.steal - 0.25, W.steal + 0.15, s)) * (1 - smooth(inv(W.fish + 0.1, W.fish + 0.4, s)));
  const turn0 = W.chases + 0.15;
  if (s >= turn0) {                                              // turns round and runs off with the fish
    const k = smooth(inv(turn0, turn0 + 0.45, s)), away = Math.atan2(BEAR_OUT.x - BEAR_AT.x, BEAR_OUT.z - BEAR_AT.z);
    b.heading = lerp(b.heading, b.heading + ((away - b.heading + 3 * Math.PI) % (2 * Math.PI) - Math.PI), k);
    const t2 = turn0 + 0.4, d2 = BEAR_AT.distanceTo(BEAR_OUT), u2 = clamp((s - t2) * 15 / d2);
    b.pos = BEAR_AT.clone().lerp(BEAR_OUT, u2); b.dist = d1 + 3 * k + u2 * d2; b.speed = u2 > 0 && u2 < 1 ? 15 : 0;
  }
  b.moving = (u > 0 && u < 1) || b.speed > 0;
  return b;
}

// ---------- posing ----------
const EUL = new THREE.Euler(), Q = new THREE.Quaternion();
function setArm(a, sd, up, fwd = 0.08) { EUL.set(fwd, 0, sd === 'L' ? up : -up, 'XYZ'); a.bones['Arm.' + sd].quaternion.setFromEuler(EUL); }
let NOW = 0;
function place(a, x) {
  a.root.visible = x.visible !== false;
  if (!a.root.visible) return;
  a.root.position.copy(x.pos); a.root.rotation.set(0, x.heading, 0);
  robloxPose(a, x.layers.map(([n, at, w = 1, loop]) => [A[n], at, w, loop]));
  for (const [sd, up, fwd] of x.arms) setArm(a, sd, up, fwd);
  if (x.wave) setArm(a, 'R', 2.4 + 0.18 * Math.sin(NOW * 11), 0.1);
  if (x.legs) for (const [sd, rx] of x.legs) a.bones['Leg.' + sd].quaternion.setFromEuler(EUL.set(rx, 0, 0));
  if (x.look) a.bones.Head.quaternion.multiply(Q.setFromEuler(EUL.set(x.look[1], x.look[0], 0, 'YXZ')));
  a.root.updateMatrixWorld(true);
  if (!x.sit) a.root.position.y -= a.soleHeight() - x.pos.y;
  if (x.lift) a.root.position.y += x.lift;
  a.root.updateMatrixWorld(true);
  setExpression(a, a === max ? maxFace(x.face, NOW) : x.face);
}
// The palm, measured on the pack mesh: an R6 arm spans 0.5 above to 1.5 below the shoulder pivot and is centred 0.5 studs
// outward from it, so the fist is at (-+0.5, -1.3, 0) in the arm bone's frame (R: -0.5, L: +0.5).
const grip = (a, sd = 'R', d = 1.3) => { a.bones['Arm.' + sd].updateMatrixWorld(true); return V(sd === 'R' ? -0.5 : 0.5, -d, 0).applyMatrix4(a.bones['Arm.' + sd].matrixWorld); };
const headPos = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.55, 0).applyMatrix4(a.bones.Head.matrixWorld); };
function placeBear(b, s) {
  bear.root.visible = b.visible; if (!b.visible) return;
  bear.root.position.copy(b.pos); bear.root.rotation.set(0, b.heading - R90, 0);
  const ph = (b.dist / 3.6) * Math.PI * 2, sw = b.moving ? 0.42 : 0, sn = Math.sin(ph);
  poseCreature(bear, {
    Body: { r: [0, 0, 0], p: [0, b.moving ? 0.18 * Math.abs(Math.cos(ph)) : 0, 0] },
    FrontL: [0, 0, sw * sn], RearR: [0, 0, sw * sn], FrontR: [0, 0, -sw * sn], RearL: [0, 0, -sw * sn],
    Head: [0, 0.12 * Math.sin(ph * 0.5) * (b.moving ? 1 : 0.3), b.head + (b.moving ? 0.05 * Math.sin(ph * 2) : 0)],
    Tail: [0, 0.3 * Math.sin(ph), 0],
  });
  bear.root.updateMatrixWorld(true);
}

// ---------- shots ----------
const SHOTS = [
  [0, 'hook'], [T.every, 'every'], [T.s1, 'tower'], [T.door, 'door'], [T.hit1, 'hit1'], [T.toe, 'toe'],
  [T.s2, 'drive'], [T.brows, 'brows'], [T.drift, 'drift'], [T.s3, 'yard'], [T.s4, 'office'], [T.can, 'can'],
  [T.s5, 'spot'], [T.race, 'race'], [T.safe, 'safe'], [T.hit5, 'hit5'], [T.bench, 'bench'], [T.boss, 'boss'], [T.boss2, 'boss2'],
  [T.s6, 'ankle'], [T.s7, 'fishing'], [T.hit7, 'hit7'], [T.bear, 'bear'], [T.chase, 'chase'], [T.seven, 'seven'], [T.survived, 'survived'],
  [T.museum, 'museum'], [T.cta, 'cta'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const PLACE_OF = {
  hook: 'forest', every: 'forest', tower: 'tower', door: 'tower', hit1: 'tower', toe: 'tower', drive: 'road', brows: 'road', drift: 'road',
  yard: 'yard', office: 'station', can: 'station', spot: 'road', race: 'road', safe: 'road', hit5: 'road', bench: 'forest', boss: 'forest',
  boss2: 'forest', ankle: 'forest', fishing: 'pond', hit7: 'pond', bear: 'pond', chase: 'pond', seven: 'pond', survived: 'pond', museum: 'museum', cta: 'pond',
};
function look(stage, p, tg, fov = 40, ext = 18) {
  const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.up.set(0, 1, 0); c.lookAt(tg);
  stage.aimSun(tg.clone(), ext); return tg;
}
export function samples() { return 1; }

// lightning: each bolt flickers on for ~0.3 s; F(t) is the scene-wide flash
const boltOn = (u) => (u >= 0 && u < 0.07) || (u >= 0.11 && u < 0.32);
function flashAt(t) {
  let f = 0;
  for (const b of BOLTS) {
    const u = t - b.t0; if (u < 0 || u > 0.5) continue;
    const e = u < 0.07 ? 1 : u < 0.11 ? 0.3 : 0.85 * (1 - (u - 0.11) / 0.39);
    f = Math.max(f, e * b.strength);
  }
  return f;
}
function light(stage, mode, F, clear = 0) {
  const u = stage.skyMesh.material.uniforms, sc = stage.scene, inn = S.st, mu = S.mu;
  const L = {
    storm: { sun: 1.25, hemi: 1.0, env: 0.5, fill: 0.55, rim: 0.7, lamp: 0, win: 0, spot: 0 },
    office: { sun: 0, hemi: 0.45, env: 0.3, fill: 0.35, rim: 0.4, lamp: 60, win: 8, spot: 0 },
    museum: { sun: 0, hemi: 0.22, env: 0.25, fill: 0.3, rim: 0.5, lamp: 0, win: 0, spot: 220 },
  }[mode];
  const sun = lerp(L.sun, 2.7, clear), hemi = lerp(L.hemi, 0.6, clear);
  stage.sun.intensity = sun; stage.hemi.intensity = hemi + 2.2 * F; sc.environmentIntensity = L.env + 0.5 * F;
  stage.fill.intensity = L.fill + 0.6 * F; stage.rim.intensity = L.rim;
  stage.sun.color.set('#cfd8ff').lerp(new THREE.Color('#fff0dc'), clear);
  stage.hemi.color.set('#aab8d8').lerp(new THREE.Color('#d9ecff'), clear);
  inn.lamp.intensity = L.lamp; inn.winLight.intensity = L.win + (mode === 'office' ? 60 * F : 0); mu.spot.intensity = L.spot;
  const z = new THREE.Color('#2c3447').lerp(new THREE.Color('#4f8fe6'), clear).lerp(new THREE.Color('#c9d2ff'), 0.7 * F);
  const h = new THREE.Color('#7a8296').lerp(new THREE.Color('#d7ecff'), clear).lerp(new THREE.Color('#eef1ff'), 0.6 * F);
  u.zenith.value.copy(z); u.horizon.value.copy(h);
  sc.fog.color.set('#6f7788').lerp(new THREE.Color('#cfe3f5'), clear).lerp(new THREE.Color('#c9d2ff'), 0.4 * F);
  sc.fog.near = mode === 'museum' ? 200 : 60; sc.fog.far = mode === 'museum' ? 900 : lerp(380, 600, clear);
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();
export function update(t, stage) {
  const s = t; NOW = s; const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const place0 = PLACE_OF[SHOT];
  for (const [k, g] of Object.entries(PLACES)) {
    const on = k === place0 || (k === 'strikeTree' && place0 === 'road' && SHOT !== 'brows');
    if (Array.isArray(g)) g.forEach((o) => { o.visible = on; }); else g.visible = on;
  }
  const F = flashAt(t) * (SHOT === 'museum' ? 0 : 1);
  const clear = smooth(inv(T.seven - 0.2, T.seven + 1.2, s));   // the storm clears at the pond for the payoff
  light(stage, SHOT === 'office' ? 'office' : SHOT === 'museum' ? 'museum' : 'storm', F, place0 === 'pond' ? clear : 0);

  // ---------- cast ----------
  const mx = maxAt(s); place(max, mx);
  const lx = leoAt(s); place(leo, lx);
  place(mia, benchAt(mia, s)); place(skye, benchAt(skye, s));
  placeBear(bearAt(s), s);
  // his hat: on his head (fitted), popping up at a strike, or on the peg in the office
  const hp = mx.hat && !mx.hat.off ? mx.hat : null;
  maxHat.item.visible = !(mx.hat && mx.hat.off);
  maxHat.item.position.copy(maxHat.offset).add(V(0, hp ? hp.lift : 0, 0)); maxHat.item.rotation.set(hp ? hp.tilt : 0, hp ? hp.spin : 0, hp ? hp.tilt * 0.5 : 0);
  pegHat.visible = SHOT === 'office'; pegHat.position.copy(S.st.peg).add(V(0.35, 0.2, 0)); pegHat.rotation.set(0, 0.3, -0.25); pegHat.scale.setScalar(maxHat.scale);
  // fire
  flamesM.visible = !!mx.fire && mx.fire > 0.02 && max.root.visible; if (flamesM.visible) K.flicker(flamesM, s, mx.fire);
  flamesM.position.y = 1.0 + (hp ? Math.min(hp.lift, 0.3) : 0);
  toeHole.visible = s >= HIT[0] && s < T.s2;
  P.door.rotation.y = -1.9 * easeOut(inv(W.runs - 0.3, W.runs - 0.08, s));

  // ---------- props ----------
  for (const k of ['truck', 'can', 'rod', 'fish', 'line', 'bobber', 'nail']) P[k].visible = false;
  if (place0 === 'road') {
    const tr = truckAt(s); P.truck.visible = true; P.truck.position.copy(tr.position); P.truck.rotation.copy(tr.rotation);
    for (const w of P.truck.userData.wheels) w.rotation.z = -tr.position.x / 1.1;
    P.truck.userData.ws.visible = SHOT !== 'spot';                 // filmed through the windscreen: no glass in the way
  }
  if (mx.can === 'hand' && max.root.visible) {
    P.can.visible = true; const g = grip(max, 'R'); P.can.position.copy(g); P.can.rotation.set(0, max.root.rotation.y, 0);
    if (mx.pour) { P.can.rotation.set(0, max.root.rotation.y, -2.0 * mx.pour); }
  }
  if (mx.rod && max.root.visible) {
    const g = grip(max, 'R'); P.rod.visible = true; P.rod.position.copy(g);
    const raised = mx.arms === ROD_UP || (Array.isArray(mx.arms) && mx.arms[0] && mx.arms[0][1] > 2) ? 1 : 0;
    const wave = Array.isArray(mx.arms) && mx.arms[0] && mx.arms[0][1] > 2;
    const pitch = wave ? 1.25 : mx.arms === ROD_UP ? 0.75 : 0.42;
    P.rod.rotation.set(-pitch, max.root.rotation.y, 0, 'YXZ'); P.rod.updateMatrixWorld(true);
    const tip = P.rod.localToWorld(P.rod.userData.TIP.clone());
    // the line: to the bobber on the water; he lifts the fish out and flips it onto the stump by the bank
    const bite = W.fishing + 0.3, lifted = W.fishing + 0.55, landed = W.fishing + 0.95;
    if (s < lifted && !wave) {
      const bob = tip.clone(); bob.y = 0.1 - (s > bite ? 0.25 * Math.abs(Math.sin((s - bite) * 18)) : 0.03 * Math.sin(s * 3));
      P.bobber.visible = true; P.bobber.position.copy(bob); P.line.visible = true; K.setLine(P.line, tip, bob);
    } else if (s < landed && !wave) {
      const end = tip.clone().add(V(0, -2.4, 0)), k = smooth(inv(lifted + 0.1, landed, s)), on = STUMP.clone().add(V(0, STUMP_TOP + 0.15, 0));
      const f = end.clone().lerp(on, k).add(V(0, 2.2 * Math.sin(k * Math.PI), 0));
      P.line.visible = k < 0.6; K.setLine(P.line, tip, f); P.fish.visible = true; P.fish.position.copy(f); P.fish.rotation.set(0, 0, k * Math.PI / 2);
    }
  }
  if (place0 === 'pond' && s >= W.fishing + 0.95 && s < W.fish) {   // the catch lies on the stump
    P.fish.visible = true; P.fish.position.copy(STUMP).add(V(0.75, STUMP_TOP + 0.2, 0)); P.fish.rotation.set(0, 0.3, Math.PI / 2);
  }
  if (bear.root.visible && s >= W.fish) {                        // the fish in the bear's mouth
    const m = creaturePoint(bear, 'Head', -4.5, 4.2, 0);
    P.fish.visible = true; P.fish.position.copy(m); P.fish.rotation.set(0, bear.root.rotation.y, Math.PI / 2);
  }
  // the toenail: pops off the boot and spins away
  if (SHOT === 'toe' && s >= W.toenail) {
    const a = s - W.toenail, f = V(0, -2, 0.45).applyMatrix4(max.bones['Leg.R'].matrixWorld);
    P.nail.visible = a < 1.2; P.nail.position.copy(f).add(V(0.9 * a, 2.6 * a - 4.9 * a * a + 0.15, 0.6 * a)); P.nail.rotation.set(a * 14, a * 9, 0);
  }
  // the hook cloud follows him; the strike-five cloud chases the truck
  stormA.visible = SHOT === 'hook' || SHOT === 'every';
  stormA.position.set(max.root.position.x - 1 + (SHOT === 'every' ? -4 * (1 - smooth(inv(W.finds - 0.4, W.finds + 0.2, s))) : 0), SHOT === 'every' ? 15 : 19, max.root.position.z - 5);
  stormB.visible = SHOT === 'spot' || SHOT === 'race' || SHOT === 'safe' || SHOT === 'hit5';
  { const tr = truckAt(s); const lag = SHOT === 'safe' ? -9 + 8 * smooth(inv(T.safe, T.hit5, s)) : SHOT === 'hit5' ? -1 : -12; stormB.position.set(tr.position.x + lag, SHOT === 'race' ? 15 : 19, K.ROAD_Z - 6); truckAt(s); }
  // bolts
  for (const b of BOLTS) {
    const uu = t - b.t0; b.g.visible = boltOn(uu) && (b.place ? SHOT === 'office' : SHOT !== 'office' && SHOT !== 'museum');
    if (b.g.visible) b.g.userData.glowM.opacity = 0.35 * (uu < 0.07 ? 1 : 1 - (uu - 0.11) / 0.25);
  }
  // sparks: burst from the latest impact on him
  spark.visible = false;
  const lastHit = [-0.06, ...HIT].filter((h) => s >= h && s < h + 0.55).pop();
  if (lastHit !== undefined && max.root.visible) {
    spark.visible = true; const c = lastHit === HIT[5] ? max.root.position.clone().add(V(0.3, 0.3, 0.6)) : headPos(max).add(V(0, 0.7, 0)), a = s - lastHit;
    for (let i = 0; i < 28; i++) {
      const th = i * 2.399, ph = 0.4 + (i % 7) * 0.18, sp = 7 + (i % 5) * 1.6;
      const d = V(Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph));
      const p = c.clone().addScaledVector(d, sp * a).add(V(0, -9 * a * a, 0));
      tmpQ.setFromUnitVectors(V(0, 0, 1), d.clone().add(V(0, -1.5 * a, 0)).normalize());
      tmpM.compose(p, tmpQ, V(1, 1, a < 0.45 ? 1 : 0.001)); spark.setMatrixAt(i, tmpM);
    }
    spark.instanceMatrix.needsUpdate = true;
  }
  // smoke from his head (and steam after the pour)
  for (const p of smokes) p.visible = false;
  const smk = (mx.smoke || 0) + (mx.fire ? 0.6 : 0);
  if (smk > 0 && max.root.visible) {
    const h = headPos(max).add(V(0, 0.5, 0));
    smokes.forEach((p, i) => {
      const age = ((s * 0.9 + i / smokes.length) % 1);
      p.visible = true; p.position.copy(h).add(V(0.35 * Math.sin(i * 2.1 + s), age * 3.2, 0.35 * Math.cos(i * 1.7)));
      p.scale.setScalar(0.25 + age * 0.75); p.material.opacity = 0.55 * (1 - age) * Math.min(1, smk); p.material.color.set(mx.pour ? '#e8eef5' : '#55565c');
    });
  }
  // water from the can
  for (const d of P.drops) d.visible = false;
  if (mx.pour > 0.3) {
    P.can.updateMatrixWorld(true); const sp = P.can.localToWorld(P.can.userData.spout.clone());
    P.drops.forEach((d, i) => { const a = ((s * 2.2 + i / P.drops.length) % 1); d.visible = true; d.position.copy(sp).add(V(0.15 * Math.sin(i * 3), -a * 2.6, 0.15 * Math.cos(i * 2))); });
  }
  rainbow.visible = place0 === 'pond'; rainbow.children.forEach((m) => { m.material.opacity = 0.32 * clear; });

  // ---------- cameras ----------
  const mp = max.root.position.clone(), hd = headPos(max);
  switch (shot.id) {
    case 'hook': { const k = easeOut(clamp(t / 1.6)); look(stage, V(lerp(2.0, 3.0, k), lerp(2.3, 3.0, k), lerp(6.4, 9.5, k)), V(0.1, lerp(4.4, 4.0, k), 0), 54, 12); break; }
    case 'every': look(stage, V(mp.x + 2 - 4 * u, 4.5, 21), V(mp.x - 1, 8.5, 0), 54, 24); break;
    case 'tower': look(stage, K.TOWER.clone().add(V(lerp(16, 12, u), 9, lerp(44, 40, u))), K.TOWER.clone().add(V(0, 12.5, 0)), 50, 30); break;
    case 'door': look(stage, K.TOWER_DOOR.clone().add(V(9.5, 2.6, 18)), K.TOWER_DOOR.clone().add(V(1.6, 4.4, 3.0)), 48, 16); break;
    case 'hit1': look(stage, mp.clone().add(V(5.0, 2.2, 11.5)), mp.clone().add(V(0, 5.6, 0)), 52, 14); break;
    case 'toe': { const f = V(0, -1.8, 0.5).applyMatrix4(max.bones['Leg.R'].matrixWorld); look(stage, f.clone().add(V(3.4, 0.6, 7.8)), f.clone().add(V(0, 3.6, 0)), 54, 10); break; }
    case 'drive': { const tp = P.truck.position; look(stage, tp.clone().add(V(-9.5, 5.6, -9.5)), tp.clone().add(V(2.5, 4.4, -1.5)), 52, 26); break; }
    case 'brows': look(stage, hd.clone().add(V(1.7, 0.6, -3.7)), hd.clone().add(V(0, 0.45, 0)), 42, 8); break;
    case 'drift': { const tp = P.truck.position; look(stage, V(tp.x + 12, 9, K.CLIFF_Z + 6), V(tp.x, 2.5, tp.z + 1.0), 48, 22); break; }
    case 'yard': look(stage, K.YARD.clone().add(V(-5.5, 5.2, 25)), K.YARD.clone().add(V(2.4, 6.6, 5)), 52, 26); break;
    case 'office': look(stage, K.STATION_IN.clone().add(V(lerp(2.6, 2.0, u), 5.0, lerp(10.5, 9.0, u))), K.STATION_IN.clone().add(V(-1.4, 4.4, -3.6)), 46, 12); break;
    case 'can': look(stage, K.STATION.clone().add(V(3.5, 3.4, 18.5)), K.STATION.clone().add(V(0.4, 5.2, 5.0)), 48, 16); break;
    case 'spot': look(stage, hd.clone().add(V(5.2, 0.5, -1.2)), hd.clone().add(V(0, 0.9, -0.3)), 42, 10); break;
    case 'race': { const tp = P.truck.position; look(stage, V(tp.x + 26 - 10 * u, 4.5, K.ROAD_Z - 7.0), tp.clone().add(V(-5, 7.5, 0)), 56, 30); break; }
    case 'safe': { const tp = truckAt(T.safe + 0.6).position.clone(); truckAt(s); look(stage, tp.clone().add(V(5.5, 4.2, -17)), tp.clone().add(V(1.6, 4.0, -5.5)), 46, 16); break; }
    case 'hit5': look(stage, mp.clone().add(V(3.4, 2.6, -11)), mp.clone().add(V(0, 5.6, 0)), 50, 14); break;
    case 'bench': look(stage, K.BENCH.clone().add(V(0.0, 3.6, 17.5)), K.BENCH.clone().add(V(0.0, 3.9, 0)), 48, 16); break;
    case 'boss': look(stage, V(-8.5, 3.4, 6.5), V(-19, 3.6, -0.3), 46, 16); break;
    case 'boss2': look(stage, V(-15, 3.6, 13), V(-15, 5.0, 0.2), 48, 14); break;
    case 'ankle': look(stage, V(mp.x + 2.0, 3.0, 15.5), V(mp.x, 4.4, 0.3), 50, 14); break;
    case 'fishing': look(stage, SPOT.clone().add(V(-8.4, 3.6, -7.5)), SPOT.clone().add(V(0.4, 4.6, -1.8)), 50, 16); break;
    case 'hit7': look(stage, SPOT.clone().add(V(-6.6, 3.6, -5.6)), SPOT.clone().add(V(0, 6.0, -0.6)), 48, 12); break;
    case 'bear': look(stage, SPOT.clone().add(V(-2.0, 5.6, -15.5)), SPOT.clone().add(V(2.6, 3.0, -0.5)), 54, 22); break;
    case 'chase': look(stage, SPOT.clone().add(V(0, 7, -21)), SPOT.clone().add(V(9, 2.8, 4)), 52, 28); break;
    case 'seven': look(stage, mp.clone().add(V(lerp(1.6, 1.0, u), lerp(2.2, 2.6, u), lerp(10.5, 9.0, u))), mp.clone().add(V(0, 4.8, 0)), 50, 16); break;
    case 'survived': look(stage, hd.clone().add(V(0, -0.2, 7.0).applyAxisAngle(V(0, 1, 0), 0.25)), hd.clone().add(V(0, 0.9, 0)), 40, 8); break;
    case 'cta': look(stage, mp.clone().add(V(1.2, 2.6, 11)), mp.clone().add(V(0, 5.8, 0)), 50, 16); break;
    case 'museum': { const k = easeOut(clamp((t - T.museum) / 3.0)); look(stage, K.MUSEUM.clone().add(V(lerp(3.5, 1.2, k), lerp(5.4, 5.0, k), lerp(17, 10.5, k))), K.MUSEUM.clone().add(V(0, lerp(4.4, 4.3, k), 0)), 44, 14); break; }
    default: look(stage, V(5, 6, 10), V(0, 4, 0), 50);
  }
  cam = stage.camera;
  // where Leo's head is on screen (for the speech bubble)
  if (leo.root.visible) { const p = headPos(leo).project(cam); leoHead2D = [(p.x + 1) / 2 * 1080, (1 - p.y) / 2 * 1920]; } else leoHead2D = null;
}

// ---------- overlay ----------
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px "Luckiest Guy"`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function boltIcon(g, x, y, h, fill, stroke = '#16141f') {   // a lightning bolt, h tall, centred at x,y
  const k = h / 10; g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); g.moveTo(1.2, -5); g.lineTo(-2.6, 0.6); g.lineTo(-0.2, 0.6); g.lineTo(-1.4, 5); g.lineTo(2.8, -1.2); g.lineTo(0.3, -1.2); g.lineTo(1.6, -5); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 1.1; g.strokeStyle = stroke; g.stroke(); g.fillStyle = fill; g.fill(); g.restore();
}
// the strike counter: seven bolt slots, top left under the For You tabs
function hud(g, s, t) {
  if (t < T.s1 - 0.05 || t >= T.museum) return;
  const n = HIT.filter((h) => t >= h).length, a = clamp((t - T.s1 + 0.05) / 0.25);
  g.save(); g.globalAlpha = a;
  const x = 50, y = 236, w = 640, h = 104;
  roundRect(g, x * s, y * s, w * s, h * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = '#ffd23f'; g.stroke();
  g.font = `${46 * s}px "Luckiest Guy"`; g.fillStyle = '#ffd23f'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('STRIKES', (x + 28) * s, (y + 56) * s);
  for (let i = 0; i < 7; i++) {
    const on = i < n, hit = HIT[i], pop = on ? easeOutBack(clamp((t - hit) / 0.25), 3) : 1;
    const cx = (x + 262 + i * 52) * s, cy = (y + 52) * s;
    g.save(); g.translate(cx, cy); g.scale(pop, pop); boltIcon(g, 0, 0, 64 * s, on ? '#ffd23f' : 'rgba(255,255,255,.18)', on ? '#16141f' : 'rgba(255,255,255,.35)'); g.restore();
  }
  g.restore();
}
function rain(g, s, t, amount) {
  if (amount <= 0) return;
  const frame = Math.floor(t * 30); let st = 7919 + frame * 104729;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  g.save(); g.strokeStyle = `rgba(210,220,240,${0.28 * amount})`; g.lineWidth = 2.2 * s; g.lineCap = 'round';
  for (let i = 0; i < 110; i++) { const x = rnd() * 1180 - 50, y = rnd() * 1920, l = 38 + rnd() * 50; g.beginPath(); g.moveTo(x * s, y * s); g.lineTo((x - l * 0.25) * s, (y + l) * s); g.stroke(); }
  g.restore();
}
function bubble(g, s, t, text, x, y, k) {                        // speech bubble with a tail down to (x, y)
  if (k <= 0) return;
  g.save(); g.font = `${58 * s}px "Luckiest Guy"`; const w = g.measureText(text).width / s + 70, h = 110;
  const bx = clamp(x - w / 2, 60, 900 - w), by = y - h - 90;
  g.translate((bx + w / 2) * s, (by + h / 2) * s); g.scale(k, k); g.translate(-(bx + w / 2) * s, -(by + h / 2) * s);
  roundRect(g, bx * s, by * s, w * s, h * s, 40 * s); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#16141f'; g.stroke();
  g.beginPath(); g.moveTo((x - 22) * s, (by + h - 3) * s); g.lineTo((x + 4) * s, (y - 40) * s); g.lineTo((x + 26) * s, (by + h - 3) * s); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  g.beginPath(); g.moveTo((x - 22) * s, (by + h) * s); g.lineTo((x + 4) * s, (y - 40) * s); g.lineTo((x + 26) * s, (by + h) * s); g.stroke();
  g.fillStyle = '#16141f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, (bx + w / 2) * s, (by + h / 2 + 4) * s);
  g.restore();
}
const OUTDOOR_STORM = new Set(['hook', 'every', 'tower', 'door', 'hit1', 'toe', 'drive', 'brows', 'drift', 'yard', 'can', 'spot', 'race', 'safe', 'hit5', 'bench', 'boss', 'boss2', 'ankle', 'fishing', 'hit7', 'bear', 'chase']);
export function overlay(g, s, t) {
  const F = flashAt(t);
  if (OUTDOOR_STORM.has(SHOT)) rain(g, s, t, SHOT === 'brows' || SHOT === 'spot' ? 0.6 : 1);
  if (SHOT === 'race') speedLines(g, s, t, 0.7, { cx: 540, cy: 980 });
  if (F > 0 && SHOT !== 'museum') { g.save(); g.globalAlpha = (SHOT === 'hook' && t < 0.25 ? 0.12 : 0.35) * F; g.fillStyle = '#f2f5ff'; g.fillRect(0, 0, 1080 * s, 1920 * s); g.restore(); }
  // the hook: what this is, readable on frame 1
  if (t < T.s1 - 0.1) {
    const out = 1 - clamp((t - (T.s1 - 0.4)) / 0.3);
    g.save(); g.globalAlpha = out;
    bigText(g, s, 'HIT BY LIGHTNING', 540, 330, 104, '#ffffff', t < 0.05 ? 1 : 1, -0.03);
    if (t > W.seven1 - 0.08) bigText(g, s, '7 TIMES', 540, 470, 170, '#ffd23f', easeOutBack(clamp((t - W.seven1 + 0.08) / 0.25), 2.2), -0.03);
    if (t > W.new - 0.6) bigText(g, s, 'AND LIVED?!', 540, 610, 80, '#ffffff', easeOutBack(clamp((t - W.new + 0.6) / 0.25), 2), 0.03);
    g.restore();
  }
  hud(g, s, t);
  // round titles
  TITLES.forEach((t0, i) => {
    const a = t - t0 + 0.05; if (a < 0 || a > 1.35) return;
    const k = easeOutBack(clamp(a / 0.22), 2.2) * (1 - clamp((a - 1.1) / 0.25));
    bigText(g, s, `STRIKE ${i + 1}`, 540, 470, 132, i === 6 ? '#ff6b3d' : '#ffd23f', k, -0.04);
  });
  // what it took this time
  for (const [t0, text] of POPS) {
    const a = t - t0; if (a < 0 || a > 1.7 || shotAt(SHOTS, t0).shot.id !== SHOT) continue;   // never carried over a cut
    const k = easeOutBack(clamp(a / 0.2), 2.4) * (1 - clamp((a - 1.45) / 0.25));
    bigText(g, s, text, 540, 650 - 40 * easeOut(clamp(a / 1.7)), text.length > 16 ? 70 : 92, '#ff4d4d', k, 0.04, '#2a0a0a');
  }
  // new item: the water can
  if (SHOT === 'can' && t > W.can - 0.15) {
    const k = easeOutBack(clamp((t - W.can + 0.15) / 0.25), 1.8);
    g.save(); g.translate(540 * s, 520 * s); g.scale(k, k);
    roundRect(g, -330 * s, -95 * s, 660 * s, 190 * s, 30 * s); g.fillStyle = 'rgba(14,18,34,.9)'; g.fill(); g.lineWidth = 6 * s; g.strokeStyle = '#7CFC9A'; g.stroke();
    roundRect(g, -300 * s, -70 * s, 140 * s, 140 * s, 22 * s); g.fillStyle = 'rgba(255,255,255,.1)'; g.fill();
    g.fillStyle = '#c8202b'; roundRect(g, -268 * s, -40 * s, 76 * s, 92 * s, 10 * s); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(-262 * s, -2 * s, 64 * s, 22 * s);
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `800 ${32 * s}px Montserrat`; g.fillStyle = '#7CFC9A'; g.fillText('NEW ITEM', -130 * s, -36 * s);
    g.font = `${70 * s}px "Luckiest Guy"`; g.fillStyle = '#ffffff'; g.fillText('WATER CAN', -130 * s, 30 * s);
    g.restore();
  }
  // the boss
  if (SHOT === 'boss2' && leoHead2D && t > W.says - 0.15 && t < W.later + 0.8) {
    const k = easeOutBack(clamp((t - W.says + 0.15) / 0.2), 2) * (1 - clamp((t - W.later - 0.6) / 0.2));
    bubble(g, s, t, "I'LL SEE YOU LATER.", leoHead2D[0], Math.min(leoHead2D[1] - 60, 760), k);
  }
  if (SHOT === 'boss2' && leoHead2D && t < W.says + 0.1) bigText(g, s, 'THE BOSS', leoHead2D[0], leoHead2D[1] - 180, 60, '#ffffff', easeOutBack(clamp((t - T.boss2) / 0.2), 2));
  // the payoff
  if (SHOT === 'seven') bigText(g, s, '7 STRIKES', 540, 470, 150, '#ffd23f', easeOutBack(clamp((t - W.seven2 + 0.05) / 0.25), 2), -0.04);
  if (SHOT === 'survived') {
    const k = easeOutBack(clamp((t - W.survived + 0.05) / 0.2), 2.4);
    g.save(); g.translate(540 * s, 430 * s); g.rotate(-0.08); g.scale(k * 1.0, k * 1.0);
    roundRect(g, -340 * s, -95 * s, 680 * s, 190 * s, 26 * s); g.lineWidth = 14 * s; g.strokeStyle = '#3ddc7a'; g.stroke(); g.fillStyle = 'rgba(14,18,34,.55)'; g.fill();
    g.font = `${104 * s}px "Luckiest Guy"`; g.fillStyle = '#3ddc7a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SURVIVED 7/7', 0, 10 * s);
    g.restore();
  }
  if (SHOT === 'museum' && t > W.stands - 0.1 && t < T.cta) {
    const k = easeOutBack(clamp((t - W.stands + 0.1) / 0.25), 2) * (1 - clamp((t - T.cta + 0.15) / 0.15));
    bigText(g, s, 'STILL THE', 540, 380, 88, '#ffffff', k, -0.03); bigText(g, s, 'WORLD RECORD', 540, 500, 118, '#ffd23f', k, -0.03);
  }
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

export const cast = () => ({ max, leo, mia, skye });
export const TIMES = T;
export const props = () => P;
export const HITS = HIT;
export const SHOT_LIST = SHOTS;
