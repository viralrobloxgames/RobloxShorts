// The AFK Millionaire - 63.2 s short, web renderer + Roblox R6 pack. Timings from audio/alignment/captions.json.
// Last one in the circle wins a million coins. Leo, Max and Mia take each other out; the noob never moves.
// Story time `s` drives everything. The hook (0-4.35 s) replays the rocket flight in slow motion, then a rewind runs
// the story backwards to 5.29 s, where it plays forward in real time (s = t).
import * as THREE from 'three';
import { setExpression, soleHeight } from '../../../web/lib/rig.js';
import { cloud, puff, rng, canvasTexture } from '../../../web/lib/world.js';
import { clamp, lerp, inv, easeInOut, easeOut, easeIn, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { speedLines, flash, roundRect } from '../../../web/lib/overlay.js';
import { loadRobloxCharacter, packItem, loadAnimation, robloxPose, holdItem } from '../../../web/lib/robloxPack.js';

export const meta = { seconds: 63.2, fps: 30, width: 1080, height: 1920, title: 'The AFK Millionaire' };
export const sky = { zenith: '#2a78e4', horizon: '#bfe6ff', below: '#eaf5ff', fog: '#d4ecff' };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- story beats (story seconds) ----------
const B = {
  buttonDrop: [13.35, 13.65], maxRun: [17.2, 17.9], maxSlam: 17.95, maxOut: 18.8,
  giftSlide: [23.8, 24.55], giftOpen: 25.05, bombBack: [26.65, 27.9], bombBoom: 28.05, leoFly: [28.05, 29.6],
  miaWalkIn: [36.3, 36.85], push: 36.95, swordOn: 38.75, slash: 39.3, clang: 39.5, swordOff: 41.3,
  aimOn: 41.6, fire: 42.7, hit: 43.3, tree: 45.6, land: 47.62,
  lookBig: 50.25, stepOut: [51.8, 52.7], buzzer: 52.5, miaOut: 54.3, win: 55.3,
  turn: 57.5, type1: [59.4, 60.5], type2: [61.2, 62.0], react: 61.9,
};
const CIRCLE_R = 7;
// Players stand in a shallow arc facing the audience (+Z), so no one blocks another's close-up; every action path
// (Max to the button, the gift, Mia to the noob and to the big launcher) runs clear of the others.
const P = { leo: V(-4.5, 0, -0.5), max: V(1.5, 0, -1.8), mia: V(-1.5, 0, 1.2), noob: V(4.0, 0, 0.6) };
const BUTTON = V(9.5, 0, -1.8), TREE = V(-16, 0, -11), BIG = V(-11.8, 0, 4.2);
const SPECT = { max: V(5.6, 0, -8.2), leo: V(8, 0, -6.6), mia: V(3.2, 0, -8.8) };   // behind the ring, behind the noob from the front
const face = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const MAXSPOT = BUTTON.clone().add(P.max.clone().sub(BUTTON).normalize().multiplyScalar(1.9));
const GIFT_DIR = P.mia.clone().sub(P.leo).normalize();
const AIMSPOT = V(-2.2, 0, 1.6), OUTSPOT = V(-7.9, 0, 2.9);

// Story time from video time: slow-motion flight hook, a rewind, then real time.
function storyTime(t) {
  if (t < 4.35) return 43.4 + t * 0.32;              // the open-sky part of the flight, slowed down
  if (t < 5.29) return lerp(44.8, 5.29, easeIn(inv(4.35, 5.29, t)));
  return t;
}
const SHOTS = [
  [0, 'hook'], [4.35, 'rewind'], [5.29, 'intro0'], [5.55, 'intro1'], [5.81, 'intro2'], [6.07, 'intro3'], [6.36, 'circle'],
  [7.29, 'prize'], [10.4, 'leo'], [12.77, 'drop'], [15.5, 'sign'], [16.94, 'maxRun'], [18.76, 'maxOut'],
  [20.0, 'miaSmart'], [23.5, 'gift'], [25.04, 'bomb'], [26.34, 'sendBack'], [28.0, 'leoFly'], [29.68, 'twoDown'],
  [30.64, 'standoff'], [32.32, 'noobClose'], [33.84, 'noobOrbit'], [36.84, 'push'], [38.81, 'sword'],
  [41.69, 'aim'], [43.35, 'flight'], [47.4, 'landing'], [48.7, 'still'], [50.19, 'bigger'], [51.72, 'stepOut'],
  [54.29, 'threeDown'], [55.27, 'winner'], [57.24, 'turn'], [59.4, 'chat'], [61.9, 'react'],
].map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : 63.2, id }));

// ---------- chat ----------
const SERVER = '#FFD23F', C = { Leo: '#FF9E80', Max: '#7FE3DD', Mia: '#C9A6FF', noob: '#F5CD30' };
const CHAT = [
  { name: 'noob', text: 'brb', at: -99 },
  { name: 'Server', text: 'Last one in the circle wins 1,000,000 coins!', at: 5.3 },
  { name: 'Max', text: 'FREE COINS??', at: 17.1 },
  { name: 'Server', text: 'Max was eliminated.', at: 18.85 },
  { name: 'Leo', text: 'gift for u mia :)', at: 23.6 },
  { name: 'Server', text: 'Leo was eliminated.', at: 29.7 },
  { name: 'Mia', text: 'move noob', at: 37.0 },
  { name: 'Mia', text: 'MOVE', at: 39.4 },
  { name: 'Mia', text: 'ok bye', at: 42.2 },
  { name: 'Server', text: 'Mia was eliminated.', at: 54.3 },
  { name: 'Server', text: 'noob WINS 1,000,000 coins!', at: 55.4 },
  { name: 'noob', text: 'sorry was eating dinner', at: 60.55, typed: B.type1 },
  { name: 'noob', text: 'did i miss anything?', at: 62.05, typed: B.type2 },
];
const playersLeft = (s) => (s < B.maxOut ? 4 : s < 29.68 ? 3 : s < B.miaOut ? 2 : 1);

// ---------- scene ----------
let A = {}, leo, max, mia, noob, cam, ring, ringMat, disc, button, gift, giftLid = [], bomb, sword, launcher, bigLauncher, rocket, tree;
let blasts = [], puffs = [], coins = [], sparkles = [], signTex, prizeTex;

export async function setup(stage) {
  const { scene } = stage; const r = rng(21);
  const expressions = ['happy', 'neutral', 'surprised', 'shocked', 'angry', 'annoyed', 'suspicious', 'smug', 'evil_grin', 'scheming', 'dizzy', 'determined', 'scared', 'laugh', 'shouting', 'talking', 'knocked_out'];
  [leo, max, mia, noob] = await Promise.all(['Leo', 'Max', 'Mia', 'Noob'].map((n) => loadRobloxCharacter(n, { expressions, hairLift: n === 'Leo' ? 0.16 : 0 })));
  scene.add(leo.root, max.root, mia.root, noob.root);
  for (const n of ['idle', 'walk', 'sprint', 'push', 'tool_slash', 'aim', 'scheming', 'cheer', 'dizzy', 'facepalm', 'shock', 'think', 'shrug', 'laugh_big', 'point_forward', 'typing', 'defeated', 'panic', 'fly', 'celebrate', 'stomp', 'look_up', 'proud', 'tool_hold'])
    A[n] = await loadAnimation(n);

  // Arena: studded lobby, glowing circle, prize pile and signs.
  const lobby = await packItem('map', 'lobby_platform'); lobby.position.y = -2.2; scene.add(lobby);
  ringMat = new THREE.MeshStandardMaterial({ color: '#35e8ff', emissive: '#35e8ff', emissiveIntensity: 2.2, roughness: 0.3 });
  ring = new THREE.Mesh(new THREE.TorusGeometry(CIRCLE_R, 0.16, 12, 128), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; scene.add(ring);
  disc = new THREE.Mesh(new THREE.CircleGeometry(CIRCLE_R, 96), new THREE.MeshBasicMaterial({ color: '#35e8ff', transparent: true, opacity: 0.1, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03; scene.add(disc);
  const pile = await packItem('props', 'coin_pile'); pile.scale.setScalar(2.2); pile.position.set(-1, 0, -13); scene.add(pile);
  for (let i = 0; i < 3; i++) { const p2 = await packItem('props', 'coin_pile'); p2.scale.setScalar(1.4); p2.position.set(-4.5 + i * 3.5, 0, -14.5 + (i % 2) * 1.5); p2.rotation.y = i; scene.add(p2); }
  signTex = canvasTexture(1024, 340, (x, W, H) => {
    x.fillStyle = '#1f2a44'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffd23f'; x.lineWidth = 16; x.strokeRect(12, 12, W - 24, H - 24);
    x.textAlign = 'center'; x.fillStyle = '#ffffff'; x.font = '92px "Luckiest Guy"'; x.fillText('LAST ONE IN', W / 2, 140); x.fillText('THE CIRCLE WINS', W / 2, 262);
  });
  prizeTex = canvasTexture(1024, 340, (x, W, H) => {
    x.fillStyle = '#1f2a44'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ffd23f'; x.lineWidth = 16; x.strokeRect(12, 12, W - 24, H - 24);
    x.textAlign = 'center'; x.fillStyle = '#ffd23f'; x.font = '150px "Luckiest Guy"'; x.fillText('1,000,000', W / 2, 190); x.fillStyle = '#ffffff'; x.font = '70px "Luckiest Guy"'; x.fillText('COINS', W / 2, 290);
  });
  for (const [tex, pos, sc] of [[signTex, V(-9, 0, -13), 1.5], [prizeTex, V(-1, 0, -17.5), 1.8]]) {
    const s = await packItem('map', 'stage_sign'); s.scale.setScalar(sc); s.position.copy(pos); s.rotation.y = face(pos, V(0, 0, 4));
    s.traverse((o) => { if (o.isMesh && o.name === 'Board_Face') { o.material = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.5 }); } });
    scene.add(s);
  }
  const spec = await packItem('map', 'stage_sign'); spec.position.set(7.5, 0, -11.5); spec.rotation.y = face(spec.position, V(0, 0, 0));
  const specTex = canvasTexture(1024, 340, (x, W, H) => { x.fillStyle = '#39414f'; x.fillRect(0, 0, W, H); x.textAlign = 'center'; x.fillStyle = '#ffffff'; x.font = '120px "Luckiest Guy"'; x.fillText('ELIMINATED', W / 2, 215); });
  spec.traverse((o) => { if (o.isMesh && o.name === 'Board_Face') o.material = new THREE.MeshStandardMaterial({ map: specTex, roughness: 0.5 }); }); scene.add(spec);

  tree = await packItem('map', 'tree_round'); tree.position.copy(TREE); scene.add(tree);
  for (const [x, z, s] of [[16, -16, 0.9], [-18, 8, 1.1], [18, 14, 0.8]]) { const t2 = await packItem('map', 'tree_round'); t2.position.set(x, 0, z); t2.scale.setScalar(s); scene.add(t2); }
  for (let i = 0; i < 6; i++) { const isl = await packItem('map', 'island_large'); const a = r() * Math.PI * 2, d = 70 + r() * 60; isl.position.set(Math.cos(a) * d, -10 + r() * 25, Math.sin(a) * d); isl.scale.setScalar(0.8 + r()); scene.add(isl); }
  for (let i = 0; i < 40; i++) { const c = cloud(200 + i, 7 + r() * 9); const a = r() * Math.PI * 2, d = 90 + r() * 160; c.position.set(Math.cos(a) * d, -40 - r() * 30, Math.sin(a) * d); scene.add(c); }
  for (let i = 0; i < 18; i++) { const c = cloud(400 + i, 5 + r() * 6); const a = r() * Math.PI * 2, d = 80 + r() * 90; c.position.set(Math.cos(a) * d, 12 + r() * 30, Math.sin(a) * d); scene.add(c); }

  // Props.
  button = await packItem('props', 'free_coins_button'); button.position.copy(BUTTON); button.rotation.y = face(BUTTON, V(0, 0, 0)); scene.add(button);
  gift = await packItem('props', 'gift_box'); gift.scale.setScalar(0.8); scene.add(gift);
  gift.traverse((o) => { if (o.isMesh && /Lid|RibbonTop|Bow/.test(o.name)) giftLid.push(o); });
  bomb = await packItem('props', 'bomb'); bomb.scale.setScalar(0.55); scene.add(bomb);
  sword = holdItem(mia, await packItem('props', 'sword'));
  launcher = holdItem(mia, await packItem('props', 'rocket_launcher'));
  bigLauncher = await packItem('props', 'rocket_launcher'); bigLauncher.scale.setScalar(1.6); bigLauncher.position.copy(BIG).add(V(0, 1.6, 0)); bigLauncher.rotation.set(0, 0.9, 0.25); scene.add(bigLauncher);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.8, 32), new THREE.MeshStandardMaterial({ color: '#39414f', roughness: 0.5 })); pedestal.position.copy(BIG).add(V(0, 0.4, 0)); pedestal.castShadow = pedestal.receiveShadow = true; scene.add(pedestal);
  rocket = new THREE.Group();
  const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 16), new THREE.MeshStandardMaterial({ color: '#d8d8d8', roughness: 0.4 })); rb.rotation.x = Math.PI / 2; rocket.add(rb);
  const rn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 16), new THREE.MeshStandardMaterial({ color: '#e0302a', roughness: 0.4 })); rn.rotation.x = Math.PI / 2; rn.position.z = 0.62; rocket.add(rn);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 12), new THREE.MeshBasicMaterial({ color: '#ffb640' })); fl.rotation.x = -Math.PI / 2; fl.position.z = -0.72; rocket.add(fl);
  scene.add(rocket);

  // Effects pools.
  for (let i = 0; i < 4; i++) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ffb640', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ff4a1c', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.renderOrder = shell.renderOrder = 6; scene.add(core, shell); blasts.push({ core, shell });
  }
  for (let i = 0; i < 16; i++) { const p = puff(); p.material = p.material.clone(); scene.add(p); puffs.push(p); }
  const coinSrc = await packItem('props', 'gold_coin');
  for (let i = 0; i < 70; i++) { const c = coinSrc.clone(); c.scale.setScalar(0.9); scene.add(c); coins.push(c); }
  for (let i = 0; i < 24; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(s); sparkles.push(s);
  }
}

export const cast = () => ({ leo, max, mia, noob });   // for the cover image

// ---------- actors ----------
const st = (pos, rotY, layers, faceE, extra = {}) => ({ pos: pos.clone(), rotY, layers, face: faceE, grounded: true, floor: 0, ...extra });
const idle = (s, k = 0) => [[A.idle, s + k]];
const blendTo = (a, b, u) => [...a.map(([x, y, w = 1]) => [x, y, w * (1 - u)]), ...b.map(([x, y, w = 1]) => [x, y, w * u])];
const arc = (a, b, h, u) => a.clone().lerp(b, u).add(V(0, h * 4 * u * (1 - u), 0));

function noobState(s) {
  const base = st(P.noob, face(P.noob, V(0, 0, 9)), idle(s, 0.4), 'happy');
  if (s >= B.hit && s < B.land) {
    // Launched: stiff idle pose the whole way (he is AFK), spinning, off the tree and back into the circle.
    base.grounded = false; base.layers = [[A.idle, 0.2]];
    const hitPt = TREE.clone().add(V(2.2, 5, 1.8));
    base.pos = s < B.tree ? arc(P.noob, hitPt, 9, easeOut(inv(B.hit, B.tree, s))) : arc(hitPt, P.noob, 6, easeInOut(inv(B.tree, B.land, s)));
    const spin = (s - B.hit) * 7.5;
    base.rotX = spin; base.rotZ = Math.sin(spin * 0.7) * 0.6;
    base.pos.y += 1.2;
  }
  if (s >= B.land && s < B.land + 0.35) base.squash = 1 - 0.18 * Math.sin(Math.PI * inv(B.land, B.land + 0.35, s));
  if (s >= B.turn) {
    const u = easeInOut(inv(B.turn, B.turn + 0.5, s));
    base.rotY = lerp(base.rotY, face(P.noob, V(0, 0, 12)), u);
    const typing = (s >= B.type1[0] - 0.2 && s < B.type1[1] + 0.2) || (s >= B.type2[0] - 0.2 && s < B.type2[1] + 0.2);
    base.layers = typing ? [[A.typing, s]] : idle(s, 0.4);
    base.face = s >= B.type1[0] && s < B.type2[1] + 0.3 ? 'talking' : 'happy';
  }
  return base;
}

function leoState(s) {
  const b = st(P.leo, face(P.leo, V(0, 0, 0)), idle(s), 'smug');
  if (s < 10.4) { b.face = s < 6.2 ? 'smug' : 'happy'; }
  else if (s < 12.77) { b.rotY = face(P.leo, V(0, 0, 9)); b.layers = [[A.scheming, s - 10.4]]; b.face = s < 11.85 ? 'evil_grin' : 'scheming'; }
  else if (s < 16.9) { b.rotY = face(P.leo, BUTTON); b.layers = s < 13.5 ? [[A.point_forward, s - 12.8]] : [[A.scheming, s - 13.5]]; b.face = 'evil_grin'; }
  else if (s < 20) { b.rotY = face(P.leo, BUTTON); b.layers = s > B.maxOut ? [[A.laugh_big, s - B.maxOut]] : idle(s); b.face = s > B.maxOut ? 'laugh' : 'evil_grin'; }
  else if (s < B.bombBoom) {
    b.rotY = face(P.leo, P.mia);
    if (s > 23.5 && s < 24.3) b.layers = [[A.push, s - 23.5]];
    else if (s > 26.5) { b.layers = [[A.panic, s - 26.5]]; b.face = 'scared'; }
    b.face = s > 26.5 ? 'scared' : s > 23.4 ? 'evil_grin' : 'smug';
  } else if (s < B.leoFly[1]) {
    const u = inv(...B.leoFly, s); b.grounded = false;
    b.pos = arc(P.leo, SPECT.leo, 14, easeOut(u)); b.pos.y += 0.6 * (1 - u);
    b.rotX = u * 9; b.rotZ = u * 4; b.layers = [[A.fly, s]]; b.face = 'dizzy';
  } else {
    b.pos = SPECT.leo.clone(); b.rotY = face(SPECT.leo, P.noob);
    b.layers = s < 33 ? [[A.dizzy, s - B.leoFly[1]]] : s >= B.react ? [[A.facepalm, s - B.react]] : idle(s);
    b.face = s < 33 ? 'dizzy' : s > 55 ? 'annoyed' : s > 44 ? 'shocked' : 'angry';
  }
  return b;
}

function maxState(s) {
  const b = st(P.max, face(P.max, V(0, 0, 0)), idle(s, 0.7), 'happy');
  if (s < 15.4) { b.face = 'happy'; if (s > 13.7) { b.rotY = face(P.max, BUTTON); b.face = 'surprised'; } }
  else if (s < B.maxRun[0]) { b.rotY = face(P.max, BUTTON); b.face = 'surprised'; b.layers = [[A.look_up, 0.3]]; }
  else if (s < B.maxSlam) {
    const u = easeIn(inv(...B.maxRun, s)), goal = MAXSPOT;
    b.pos = P.max.clone().lerp(goal, u); b.rotY = face(P.max, BUTTON); b.layers = [[A.sprint, s * 1.3]]; b.face = 'happy';
  } else if (s < B.maxOut) {
    b.pos = MAXSPOT.clone(); b.rotY = face(b.pos, BUTTON);
    b.layers = [[A.push, s - B.maxSlam]]; b.face = s > 18.3 ? 'shocked' : 'happy';
  } else {
    b.pos = SPECT.max.clone(); b.rotY = face(SPECT.max, P.noob);
    b.layers = s >= B.react ? [[A.shock, s - B.react]] : [[A.defeated, s - B.maxOut]];
    b.face = s >= B.react ? 'shocked' : 'annoyed';
    b.visible = s > B.maxOut + 0.35;
  }
  return b;
}

function miaState(s) {
  const b = st(P.mia, face(P.mia, V(0, 0, 0)), idle(s, 0.2), 'neutral');
  const toNoob = face(P.mia, P.noob);
  if (s < 20) { b.face = s > B.maxOut ? 'smug' : 'neutral'; if (s > 13.7) b.rotY = face(P.mia, BUTTON); }
  else if (s < 23.5) { b.rotY = face(P.mia, BUTTON); b.layers = s < 21.3 ? [[A.think, s - 20]] : [[A.shrug, s - 21.3]]; b.face = s < 21.2 ? 'suspicious' : 'smug'; }
  else if (s < 26.34) { b.rotY = face(P.mia, P.leo); b.layers = s > 25.3 ? [[A.shock, s - 25.3]] : idle(s); b.face = s > 25.25 ? 'shocked' : s > 24.2 ? 'happy' : 'suspicious'; }
  else if (s < 30.6) { b.rotY = face(P.mia, P.leo); b.layers = s < 27.5 ? [[A.push, s - 26.55]] : s > B.bombBoom + 0.3 ? [[A.laugh_big, s - 28.3]] : idle(s); b.face = s < 28.3 ? 'determined' : 'laugh'; }
  else if (s < B.miaWalkIn[0]) { b.rotY = toNoob; b.face = 'determined'; }
  else if (s < 38.75) {
    const pushSpot = P.noob.clone().add(V(-1.9, 0, 0.1)), u = easeInOut(inv(...B.miaWalkIn, s));
    b.pos = P.mia.clone().lerp(pushSpot, u); b.rotY = face(b.pos, P.noob);
    b.layers = s < B.miaWalkIn[1] ? [[A.walk, s * 1.2]] : [[A.push, s - B.push]];
    if (s > 37.35) b.pos.x -= 0.5 * easeOut(inv(37.35, 37.7, s));   // bounces off him
    b.face = s < 37.4 ? 'determined' : 'shocked';
  } else if (s < B.aimOn) {
    b.pos = P.noob.clone().add(V(-2.6, 0, 0.1)); b.rotY = face(b.pos, P.noob);
    b.layers = s < B.slash ? [[A.tool_hold, s]] : [[A.tool_slash, s - B.slash]];
    b.face = s < 40.3 ? 'angry' : 'annoyed';
  } else if (s < 48.7) {
    b.pos = AIMSPOT.clone(); b.rotY = face(b.pos, P.noob);
    b.layers = s < 44 ? [[A.aim, s - B.aimOn]] : [[A.shock, s - 44]]; b.face = s < 43.3 ? 'determined' : s < 47.7 ? 'shocked' : 'annoyed';
    if (s > 43.35) b.rotY = face(b.pos, TREE) * clamp(1 - inv(46, 47.6, s)) + face(b.pos, P.noob) * inv(46, 47.6, s);
  } else if (s < B.stepOut[0]) {
    b.pos = AIMSPOT.clone(); b.rotY = s < B.lookBig ? face(b.pos, P.noob) : face(b.pos, BIG); b.layers = s < B.lookBig ? [[A.shrug, s - 48.7]] : [[A.think, s - B.lookBig]];
    b.face = s < B.lookBig ? 'annoyed' : 'evil_grin';
  } else if (s < B.miaOut + 0.6) {
    const u = inv(...B.stepOut, s), from = AIMSPOT, to = OUTSPOT;
    b.pos = from.clone().lerp(to, u); b.rotY = face(from, BIG);
    b.layers = s < B.stepOut[1] ? [[A.walk, s * 1.3]] : [[A.shock, s - B.stepOut[1]]];
    b.face = s < B.buzzer ? 'evil_grin' : 'shocked';
  } else {
    b.pos = SPECT.mia.clone(); b.rotY = face(SPECT.mia, P.noob);
    b.layers = s >= B.react ? [[A.shrug, s - B.react]] : [[A.defeated, s - 55]]; b.face = s >= B.react ? 'annoyed' : 'angry';
    b.visible = s > B.miaOut + 0.9;
  }
  return b;
}

function place(a, stt) {
  a.root.visible = stt.visible !== false;
  a.root.position.copy(stt.pos); a.root.rotation.set(stt.rotX || 0, stt.rotY, stt.rotZ || 0, 'YXZ');
  if (stt.rotX || stt.rotZ) { const c = V(0, 2.6, 0); a.root.position.add(c.clone().sub(c.clone().applyEuler(a.root.rotation))); }   // tumble about the body centre
  a.root.scale.set(1, stt.squash || 1, 1);
  robloxPose(a, stt.layers);
  if (stt.grounded) { a.root.updateMatrixWorld(true); a.root.position.y += stt.floor - soleHeight(a); }
  setExpression(a, stt.face);
  a.root.updateMatrixWorld(true);
}

// ---------- camera ----------
function look(stage, p, tg, fov = 40) { const c = stage.camera; c.position.copy(p); c.fov = fov; c.updateProjectionMatrix(); c.lookAt(tg); stage.aimSun(V(tg.x, 0, tg.z), 26); }
function orbit(stage, tg, az, el, d, fov = 40) { look(stage, tg.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), tg, fov); }
const head = (a) => { const v = new THREE.Vector3(0, 0.55, 0); return a.bones.Head.localToWorld(v); };   // head centre (the bone sits at the neck)
const jolt = (t, a) => V(a * Math.sin(t * 83), a * Math.cos(t * 71), 0);

export function samples(t) { const s = storyTime(t); return t < 5.29 || (s > B.maxRun[0] && s < B.maxSlam) || (s > B.leoFly[0] && s < B.leoFly[1]) || (s > B.hit && s < B.land) ? 3 : 1; }
export function shutter(t) { return samples(t) > 1 ? 0.5 : 0; }

let S = 0, SHOT = 'hook';
export function update(t, stage) {
  const s = storyTime(t); S = s;
  const states = [[leo, leoState(s)], [max, maxState(s)], [mia, miaState(s)], [noob, noobState(s)]];
  if (s < 6.36) for (const [, x] of states) x.rotY = face(x.pos, V(x.pos.x * 0.3, 0, 14));   // intros: everyone faces the audience
  for (const [a, x] of states) place(a, x);
  cam = stage.camera;

  // Circle flashes red on each elimination.
  const hitR = [B.maxOut - 0.15, 29.55, B.buzzer].some((e) => s > e && s < e + 0.9 && Math.floor((s - e) * 8) % 2 === 0);
  ringMat.color.set(hitR ? '#ff3344' : '#35e8ff'); ringMat.emissive.set(hitR ? '#ff3344' : '#35e8ff'); disc.material.color.set(hitR ? '#ff3344' : '#35e8ff');

  // Button drops in from the sky.
  button.visible = s > B.buttonDrop[0];
  button.position.set(BUTTON.x, 18 * (1 - easeIn(inv(...B.buttonDrop, s))), BUTTON.z);

  // Gift slides Leo -> Mia, lid pops, bomb rises out, flies back, explodes at Leo.
  const giftFrom = P.leo.clone().addScaledVector(GIFT_DIR, 1.2), giftTo = P.mia.clone().addScaledVector(GIFT_DIR, -1.2);
  gift.visible = s > 23.55 && s < 27.2;
  gift.position.copy(giftFrom.clone().lerp(giftTo, easeOut(inv(...B.giftSlide, s))));
  giftLid.forEach((o) => { o.position.y = s > B.giftOpen ? 3 * easeOut(inv(B.giftOpen, B.giftOpen + 0.4, s)) : 0; o.visible = s < B.giftOpen + 0.5; });
  bomb.visible = s > B.giftOpen && s < B.bombBoom;
  if (s < B.bombBack[0]) bomb.position.copy(giftTo).add(V(0, 0.4 + 1.1 * easeOutBack(inv(B.giftOpen, B.giftOpen + 0.35, s)), 0));
  else bomb.position.copy(arc(giftTo.clone().add(V(0, 1.5, 0)), P.leo.clone().add(V(0, 0.4, 0)), 3.5, inv(...B.bombBack, s)));
  bomb.rotation.set(0, s * 2, Math.sin(s * 9) * 0.15);

  // Held tools.
  sword.visible = s > B.swordOn && s < B.swordOff;
  launcher.visible = s > B.aimOn && s < 44.2;
  bigLauncher.visible = s > 30;
  bigLauncher.rotation.y = 0.9 + s * 0.6;
  const muzzle = new THREE.Vector3(0, 0, 2.6).applyMatrix4(launcher.matrixWorld);
  rocket.visible = s > B.fire && s < B.hit;
  if (rocket.visible) { const tgt = head(noob).add(V(0, -1.2, 0)); rocket.position.copy(muzzle.clone().lerp(tgt, inv(B.fire, B.hit, s))); rocket.lookAt(tgt); }

  // Explosions: bomb at Leo, rocket at the noob.
  blasts.forEach(({ core, shell }) => { core.visible = shell.visible = false; });
  [[B.bombBoom, P.leo.clone().add(V(0, 1.5, 0)), 3.2], [B.hit, P.noob.clone().add(V(0, 2.5, 0)), 2.6]].forEach(([at, pos, size], i) => {
    const age = s - at; if (age < 0 || age > 0.55) return;
    const { core, shell } = blasts[i], u = age / 0.55; core.visible = shell.visible = true;
    core.position.copy(pos); shell.position.copy(pos);
    core.scale.setScalar(size * (0.3 + easeOut(clamp(u * 2)))); core.material.opacity = 1 - u;
    shell.scale.setScalar(size * (0.6 + 1.6 * easeOut(u))); shell.material.opacity = 0.6 * (1 - u) ** 1.5;
  });

  // Puffs: Max vanishing, Mia vanishing, tree hit, landing dust, button landing dust.
  const events = [[B.maxOut, MAXSPOT.clone().add(V(0, 1.5, 0)), 1.1], [B.miaOut, OUTSPOT.clone().add(V(0, 1.5, 0)), 1.1], [B.tree, TREE.clone().add(V(1.5, 6, 1.5)), 1.8], [B.land, P.noob.clone().add(V(0, 0.3, 0)), 1.0], [B.buttonDrop[1], BUTTON.clone().add(V(0, 0.3, 0)), 1.0]];
  let ev = null; for (const e of events) if (s >= e[0] && s < e[0] + 0.9) ev = e;
  puffs.forEach((p, i) => {
    p.visible = !!ev; if (!ev) return;
    const [at, c, size] = ev, u = (s - at) / 0.9, a = i * 0.39;
    p.position.set(c.x + Math.cos(a) * size * 1.8 * easeOut(u), c.y + Math.sin(a * 2) * size * 0.5 + u * size * 0.6, c.z + Math.sin(a) * size * 1.8 * easeOut(u));
    p.scale.setScalar(size * (0.35 + 0.55 * easeOut(u))); p.material.opacity = 0.85 * (1 - u) ** 2;
  });
  // Tree shakes when he hits it.
  const th = s - B.tree; tree.rotation.z = th > 0 && th < 1.2 ? Math.sin(th * 30) * 0.06 * (1 - th / 1.2) : 0;

  // Coin rain on the winner, and a burst over the prize when it is announced.
  coins.forEach((c, i) => {
    const r = rng(i + 3), start = B.win + r() * 1.6, age = s - start;
    c.visible = age > 0 && s < 63.2;
    if (!c.visible) return;
    const x = P.noob.x + (r() - 0.5) * 7, z = P.noob.z + (r() - 0.5) * 7;
    c.position.set(x, Math.max(0.15 + (i % 5) * 0.12, 14 - 9.8 * age * age * 0.9), z);
    c.rotation.set(age * 6 + i, age * 4, 0);
  });
  const sparkAt = [[8.97, V(-1, 3, -13)], [15.53, BUTTON.clone().add(V(0, 3, 0))], [B.win, P.noob.clone().add(V(0, 2.5, 0))]];
  let sp = null; for (const e of sparkAt) if (s >= e[0] && s < e[0] + 1) sp = e;
  sparkles.forEach((m, i) => {
    m.visible = !!sp; if (!sp) return;
    const u = (s - sp[0]), a = i * 2.39996;
    m.position.copy(sp[1]).add(V(Math.cos(a + u * 3) * (1 + 3 * u), (i % 6) * 0.5 + u * 2, Math.sin(a + u * 3) * (1 + 3 * u)));
    m.scale.setScalar(1.3 * (1 - u)); m.material.opacity = 1 - u; m.rotation.set(t * 5 + i, t * 3, 0);
  });

  // ---------- shots ----------
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  const nh = head(noob), lh = head(leo), mh = head(mia), xh = head(max);
  stage.bloom.strength = 0.3;
  const front = (pos) => face(pos, V(pos.x * 0.3, 0, 14));
  switch (shot.id) {
    case 'hook': { const c = noob.bones.Torso.localToWorld(V(0, 1, 0)); look(stage, c.clone().add(V(7 - 2 * u, 1, 11)), c.clone().add(V(-0.3, 2.2, 0)), 46); stage.aimSun(c.clone().setY(0), 30); break; }
    case 'rewind': orbit(stage, V(0, 1.5, 0), 0.3, 0.55, 34, 44); break;
    case 'intro0': orbit(stage, lh, front(P.leo), 0.06, 9, 34); break;
    case 'intro1': orbit(stage, xh, front(P.max), 0.06, 9, 34); break;
    case 'intro2': orbit(stage, mh, front(P.mia), 0.06, 9, 34); break;
    case 'intro3': orbit(stage, nh, front(P.noob), 0.06, 9, 34); break;
    case 'circle': orbit(stage, V(0, 0, 0), 0.2 + u * 0.3, 1.1, lerp(30, 27, u), 44); break;
    case 'prize': { const k = easeInOut(u); look(stage, V(lerp(-1, 1, k), lerp(4.5, 6, k), lerp(6, 2, k)), V(0, lerp(5, 6.5, k), -13), 44); break; }
    case 'leo': orbit(stage, lh.clone().add(V(0, -0.5, 0)), front(P.leo), 0.06, t > 11.89 ? 6.5 : lerp(10.5, 9.5, u), 34); break;
    case 'drop': look(stage, V(-7, 9, -9), V(7, 1, -2), 42); break;
    case 'sign': orbit(stage, BUTTON.clone().add(V(0, 2.4, 0)), face(BUTTON, V(0, 0, 0)) + 0.15, 0.14, lerp(7, 6.2, u), 40); break;
    case 'maxRun': { const p = max.root.position; look(stage, p.clone().add(V(-0.5, 3.5, 11)), p.clone().add(V(1.5, 2.5, -1.5)), 44); break; }
    case 'maxOut': orbit(stage, MAXSPOT.clone().add(V(0.5, 2.3, 0)), face(MAXSPOT, V(22, 0, 6)), 0.18, 12, 42); break;
    case 'miaSmart': orbit(stage, mh.clone().add(V(0, -0.4, 0)), face(P.mia, BUTTON) - 0.7, 0.06, lerp(10, 9, u), 36); break;
    case 'gift': look(stage, V(-3.2, 3.8, 11.5), V(-3, 2.2, 0.3), 40); break;
    case 'bomb': look(stage, giftTo.clone().add(V(-3.2, 2.4, 5.5)), giftTo.clone().add(V(0.4, 1.8, -0.2)), 40); break;
    case 'sendBack': look(stage, V(-3, 4.2, 13), V(-3, 2.4, 0), 42); break;
    case 'leoFly': look(stage, V(3, 6, 22), leo.root.position.clone().add(V(0, 1, 0)).lerp(V(4, 4, -2), 0.4), 50); break;
    case 'twoDown': orbit(stage, head(leo).add(V(0, -0.8, 0)), face(SPECT.leo, V(10, 0, 14)), 0.1, 10, 38); break;
    case 'standoff': look(stage, V(1.2, 4.2, lerp(15, 13.5, u)), V(1.2, 2.6, 0.9), 48); break;
    case 'noobClose': orbit(stage, nh, front(P.noob), 0.05, lerp(8.5, 7.5, u), 34); break;
    case 'noobOrbit': orbit(stage, nh.clone().add(V(0, -1, 0)), front(P.noob) + lerp(-0.9, 0.9, u), 0.12, 10.5, 38); break;
    case 'push': look(stage, V(3, 3.2, 11.5), V(3, 2.6, 0.8), 40); break;
    case 'sword': { const j = s > B.clang && s < B.clang + 0.25 ? jolt(t, 0.12) : V(0, 0, 0); look(stage, V(2, 3.6, 11).add(j), V(2.8, 2.8, 0.6), 40); break; }
    case 'aim': look(stage, V(-8.5, 4.6, 8.5), V(2.5, 2.4, 0.6), 40); break;
    case 'flight': { const p = noob.bones.Torso.localToWorld(V(0, 1, 0)); look(stage, p.clone().add(V(8, 2, 11)), p.clone().add(V(-1.5, 0.5, 0)), 48); stage.aimSun(p.clone().setY(0), 34); break; }
    case 'landing': orbit(stage, V(3, 2, 0.6), 0.2, 0.25, 15, 42); break;
    case 'still': orbit(stage, nh, front(P.noob) + 0.2, 0.04, lerp(8.5, 7.5, u), 34); break;
    case 'bigger': { const k = easeInOut(inv(50.25, 51.3, s)); look(stage, V(-5, 4, 12.5), mh.clone().lerp(BIG.clone().add(V(0, 2, 0)), k).add(V(0, -0.6, 0)), 42); break; }
    case 'stepOut': { const k = s > 52.92 ? easeOut(inv(52.92, 53.3, s)) : 0; look(stage, V(-2.5 - 1.5 * k, 3.6 - 0.6 * k, 12.5 - 5 * k), V(-6.8, 2.3, 2.6), 42); break; }
    case 'threeDown': orbit(stage, OUTSPOT.clone().add(V(0, 2.2, 0)), 0.3, 0.2, 11, 42); break;
    case 'winner': orbit(stage, nh.clone().add(V(0, -1.5, 0)), front(P.noob) - 0.2, -0.05 + 0.15 * u, lerp(13, 10.5, u), 44); stage.bloom.strength = 0.45; break;
    case 'turn': orbit(stage, nh.clone().add(V(0, -0.5, 0)), face(P.noob, V(0, 0, 12)) + 0.15, 0.04, lerp(9.5, 8.5, u), 36); break;
    case 'chat': orbit(stage, nh.clone().add(V(0, -0.9, 0)), face(P.noob, V(0, 0, 12)), 0.05, 9.5, 36); break;
    default: look(stage, V(3.6, 3.4, 14.5), V(5, 4.6, -3.5), 42);   // react: the noob in front, the three losers staring from behind
  }
}

// ---------- overlay ----------
function project(v, s) {
  cam.updateMatrixWorld(); const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * 1080 * s, y: (-p.y * 0.5 + 0.5) * 1920 * s, on: p.z < 1 && Math.abs(p.x) < 1.2 && Math.abs(p.y) < 1.2 };
}
function bigText(g, s, text, x, y, size, color, { alpha = 1, k = 1, rot = 0, stroke = '#152435' } = {}) {
  g.save(); g.globalAlpha = alpha; g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k);
  g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = stroke; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
function pill(g, s, x, y, text, { bg = 'rgba(21,36,53,.86)', fg = '#ffffff', border = '#FFC83D', size = 50 } = {}) {
  g.save(); g.font = `${size * s}px "Luckiest Guy"`;
  const w = g.measureText(text).width + 60 * s, h = size * 1.7 * s;
  roundRect(g, x * s, y * s, w, h, h / 3); g.fillStyle = bg; g.fill(); g.lineWidth = 5 * s; g.strokeStyle = border; g.stroke();
  g.fillStyle = fg; g.textBaseline = 'middle'; g.fillText(text, x * s + 30 * s, y * s + h / 2 + 3 * s); g.restore();
}
function chatBox(g, s, t, story, { x = 60, y = 370, w = 820, rows = 4 } = {}) {
  const shown = CHAT.filter((l) => (t < 5.29 ? l.at < -1 : story >= l.at)).slice(-rows);
  const ty = CHAT.find((l) => l.typed && story >= l.typed[0] - 0.1 && story < l.typed[1] + 0.1 && t >= 5.29);
  if (!shown.length && !ty) return;
  g.save();
  const lh = 50 * s, pad = 20 * s, n = shown.length + (ty ? 1 : 0), h = pad * 2 + n * lh + (ty ? 8 * s : 0);
  roundRect(g, x * s, y * s, w * s, h, 20 * s); g.fillStyle = 'rgba(12,18,28,.55)'; g.fill();
  g.font = `800 ${31 * s}px Montserrat`; g.textBaseline = 'middle'; g.textAlign = 'left';
  let yy = y * s + pad + lh / 2;
  for (const l of shown) {
    g.globalAlpha = t < 5.29 ? 1 : clamp((story - l.at) / 0.12);
    const tag = `[${l.name}]: `; g.fillStyle = l.name === 'Server' ? SERVER : C[l.name]; g.fillText(tag, x * s + pad, yy);
    g.fillStyle = l.name === 'Server' ? '#FFE9A8' : '#ffffff'; g.fillText(l.text, x * s + pad + g.measureText(tag).width, yy); yy += lh;
  }
  g.globalAlpha = 1;
  if (ty) {
    const k = Math.floor(clamp((story - ty.typed[0]) / (ty.typed[1] - ty.typed[0])) * ty.text.length), txt = ty.text.slice(0, k);
    roundRect(g, x * s + pad * 0.6, yy - lh / 2 + 4 * s, w * s - pad * 1.2, lh, 12 * s); g.fillStyle = 'rgba(255,255,255,.16)'; g.fill();
    g.fillStyle = '#ffffff'; g.fillText(txt, x * s + pad * 1.2, yy + 4 * s);
    if (Math.floor(t * 4) % 2 === 0 || k < ty.text.length) g.fillRect(x * s + pad * 1.2 + g.measureText(txt).width + 4 * s, yy - 14 * s, 4 * s, 36 * s);
  }
  g.restore();
}
function bubble(g, s, pos, text, alpha) {
  const p = project(pos, s); if (!p.on || alpha <= 0) return;
  g.save(); g.globalAlpha = alpha; g.font = `800 ${38 * s}px Montserrat`;
  const w = Math.min(760 * s, g.measureText(text).width + 60 * s), h = 84 * s, x = clamp(p.x - w / 2, 40 * s, (1080 - 40) * s - w), y = p.y - h - 30 * s;
  roundRect(g, x, y, w, h, 28 * s); g.fillStyle = 'rgba(255,255,255,.96)'; g.fill();
  g.beginPath(); g.moveTo(p.x - 18 * s, y + h - 1); g.lineTo(p.x + 18 * s, y + h - 1); g.lineTo(p.x, y + h + 26 * s); g.closePath(); g.fill();
  g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + w / 2, y + h / 2 + 2 * s); g.restore();
}

export function overlay(g, s, t) {
  const story = S;
  // Players left (top-left) and chat.
  const left = playersLeft(story), changed = [B.maxOut, 29.68, B.miaOut].find((e) => story > e && story < e + 0.6);
  pill(g, s, 60, 250, `PLAYERS LEFT: ${left}`, { bg: changed ? 'rgba(200,40,60,.92)' : 'rgba(21,36,53,.86)' });
  chatBox(g, s, t, story, { y: 370 });

  // AFK tag over the noob until he finally moves.
  if (story < B.turn + 0.3 && noob.root.visible) {
    const p = project(head(noob).add(V(0, 1.55, 0)), s);
    if (p.on) { g.save(); g.font = `${40 * s}px "Luckiest Guy"`; const w = g.measureText('AFK').width + 36 * s; roundRect(g, p.x - w / 2, p.y - 30 * s, w, 60 * s, 18 * s); g.fillStyle = 'rgba(40,40,48,.85)'; g.fill(); g.fillStyle = '#d7d7de'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AFK', p.x, p.y + 3 * s); g.restore(); }
  }

  // Hook title and rewind.
  if (t < 4.35) {
    bigText(g, s, "HE WASN'T", 540, 650, 116, '#ffffff', { k: easeOutBack(clamp(t / 0.25), 2) });
    bigText(g, s, 'EVEN PLAYING', 540, 770, 116, '#FFD23F', { k: easeOutBack(clamp((t - 0.12) / 0.25), 2) });
    speedLines(g, s, t, 0.45, { cx: 540, cy: 1000 });
  } else if (t < 5.29) {
    g.save(); g.globalAlpha = 0.18; g.fillStyle = '#ffffff'; for (let y = 0; y < 1920; y += 14) g.fillRect(0, y * s, 1080 * s, 3 * s); g.restore();
    const u = inv(4.35, 5.29, t);
    g.save(); g.fillStyle = '#ffffff'; g.translate(420 * s, 700 * s);
    for (const dx of [0, 70]) { g.beginPath(); g.moveTo((dx + 60) * s, -40 * s); g.lineTo(dx * s, 0); g.lineTo((dx + 60) * s, 40 * s); g.closePath(); g.fill(); }
    g.restore(); bigText(g, s, 'REWIND', 640, 700, 78, '#ffffff', { alpha: 0.95 });
    flash(g, s, 0.35 * (1 - u) * (Math.floor(t * 20) % 2), '#ffffff');
  }

  // Intro name tags.
  const intro = { intro0: ['LEO', C.Leo], intro1: ['MAX', C.Max], intro2: ['MIA', C.Mia], intro3: ['THE NOOB', C.noob] }[SHOT];
  if (intro) bigText(g, s, intro[0], 540, 720, 104, intro[1]);

  // Eliminations.
  for (const [at, who] of [[B.maxOut, 'MAX'], [29.68, 'LEO'], [B.miaOut, 'MIA']]) {
    const a = story - at; if (a < 0 || a > 1.3) continue;
    const k = easeOutBack(clamp(a / 0.25), 2.4), al = 1 - inv(1.05, 1.3, a);
    bigText(g, s, 'ELIMINATED', 540, 650, 104, '#ff4d5e', { k, alpha: al });
    bigText(g, s, who, 540, 770, 84, '#ffffff', { k, alpha: al });
  }
  // Comic hits.
  for (const [at, word, x, y, col] of [[B.maxSlam + 0.05, 'SLAM!', 700, 900, '#ffffff'], [B.bombBoom, 'BOOM!', 540, 820, '#FFB640'], [B.clang, 'CLANG!', 700, 880, '#e8f4ff'], [B.hit, 'BOOM!', 560, 820, '#FFB640'], [B.tree, 'BONK!', 520, 760, '#8BE36B'], [B.buzzer, 'BZZZT!', 420, 860, '#ff4d5e']]) {
    const a = story - at; if (a < 0 || a > 0.7 || t < 5.29 && word !== 'BONK!') continue;
    bigText(g, s, word, x, y, 120, col, { k: easeOutBack(clamp(a / 0.15), 3), alpha: 1 - inv(0.5, 0.7, a), rot: -0.12 });
  }
  if (SHOT === 'stepOut' && story > 52.92) bigText(g, s, '1 SECOND', 540, 700, 110, '#FFD23F', { k: easeOutBack(clamp((story - 52.92) / 0.2), 2.5) });
  if (SHOT === 'winner') { const a = story - B.win; bigText(g, s, 'WINNER', 540, 640, 130, '#FFD23F', { k: easeOutBack(clamp(a / 0.25), 2.5) }); bigText(g, s, '1,000,000', 540, 780, 100, '#ffffff', { k: easeOutBack(clamp((a - 0.2) / 0.25), 2.5) }); }

  // Bubble chat over the noob.
  if (story > 60.55 && story < 62.05) bubble(g, s, head(noob).add(V(0, 1.2, 0)), 'sorry was eating dinner', clamp((story - 60.55) / 0.12));
  if (story > 62.05) bubble(g, s, head(noob).add(V(0, 1.2, 0)), 'did i miss anything?', clamp((story - 62.05) / 0.12));

  // Flashes and motion.
  if (SHOT === 'maxRun' || SHOT === 'flight' || SHOT === 'leoFly') speedLines(g, s, t, 0.4, { cx: 540, cy: 1000 });
  flash(g, s, [B.bombBoom, B.hit].reduce((m, e) => Math.max(m, story > e ? 0.5 * (1 - clamp((story - e) / 0.18)) : 0), 0), '#fff2cc');
}
