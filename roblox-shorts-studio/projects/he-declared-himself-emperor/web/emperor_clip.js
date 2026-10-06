// He Declared Himself Emperor (web route, three.js). True story: Joshua Norton, San Francisco, 1859-1880.
// WORK IN PROGRESS (overnight 2026-10-06): shots 1-3 are staged (hook: the Emperor walks down the 1859 street and the
// townsfolk wave, cheer and clap; "the city goes along with it": a wide; the name: a close-up). Everything from T.rich on
// is a placeholder wide of the street. Next: the rice and the ships at the dock, the newspaper, the reign (his money,
// Congress), the arrest and the salutes, the bridge, the farewell, the CTA (source/story.md beats), then previews, hold
// and fit checks, sound cues, cover.
// Beats: web/beats.js (source/beats.py). Sets and props: web/kit.js. Everything is a pure function of time.
import * as THREE from 'three';
import { setExpression } from '../../../web/lib/rig.js';
import { clamp, lerp, easeOut, easeOutBack, shotAt } from '../../../web/lib/anim.js';
import { loadRobloxCharacter, loadAnimation, robloxPose } from '../../../web/lib/robloxPack.js';
import { STRIDE } from '../../../web/lib/locomotion.js';
import { roundRect } from '../../../web/lib/overlay.js';
import { W } from './beats.js';
import { sanFrancisco, nortonUniform, merchantCoat, dress, hat, headHat, riceSack, STREET_Z, DOCK } from './kit.js';

export const meta = { seconds: Math.ceil((W.end + 2.0) * 30) / 30, fps: 30, width: 1080, height: 1920, title: 'He Declared Himself Emperor' };
export const sky = { zenith: '#5a8fd6', horizon: '#e6dcc4', below: '#f0f6ff', fog: '#e8e0cc', sunDir: new THREE.Vector3(0.4, 0.62, 0.68) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T = { city: W.city1 - 0.15, name: W.name - 0.15, rich: W.rich - 0.15, ships: W.ship1 - 0.15, writes: W.writes - 0.15 };
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524'], COATS = ['#5a4636', '#3f4a5a', '#6b3b3b', '#4e5a3a'];
let leo, SF, OUT, HAT;
const A = {}, folk = [], SACKS = [];

export async function setup(stage) {
  const { scene } = stage;
  leo = await loadRobloxCharacter('Leo', { expressions: ['neutral', 'determined', 'happy', 'surprised'], hairLift: 0.16 });
  scene.add(leo.root);
  OUT = { emperor: nortonUniform(leo), merchant: merchantCoat(leo) }; HAT = { emperor: headHat(leo, hat({ feather: true })), merchant: headHat(leo, hat()) };
  for (let i = 0; i < 4; i++) {                          // townsfolk: recoloured Noobs in frock coats
    const e = await loadRobloxCharacter('Noob', { expressions: ['neutral', 'happy', 'surprised'] });
    e.root.traverse((o) => {
      if (!o.isMesh || o.name === 'Face') return;
      if (!['Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Head'].includes(o.name)) return;
      o.material = o.material.clone(); o.material.map = null; o.material.needsUpdate = true;
      o.material.color.set(/Leg/.test(o.name) ? '#2e2a28' : o.name === 'Torso' ? COATS[i] : SKIN[i]);
    });
    dress(e, { color: COATS[i], hem: 0.4, buttons: '#c9a24a' }); scene.add(e.root); folk.push(e);
  }
  for (const n of ['idle', 'walk', 'wave', 'cheer', 'clap', 'proud']) A[n] = await loadAnimation(n);
  SF = sanFrancisco(scene);
  for (let i = 0; i < 14; i++) {                         // the rice pile on the dock: it grows with every ship
    const k = riceSack(), row = Math.floor(i / 5), col = i % 5;
    k.position.set(DOCK.x - 1 + col * 1.25 + row * 0.6, 0.8 + row * 0.9, DOCK.z - 1.2 + (row % 2) * 0.3); k.rotation.y = (i * 1.7) % 0.6 - 0.3;
    scene.add(k); SACKS.push(k);
  }
  SF.ships.forEach((sh) => { sh.userData.home = sh.position.clone(); });
}

const SHOTS = [[0, 'hook'], [T.city, 'city'], [T.name, 'name'], [T.rich, 'rich'], [T.ships, 'ships'], [T.writes, 'wip']]
  .map(([start, id], i, a) => ({ start, end: a[i + 1] ? a[i + 1][0] : meta.seconds, id }));
const X0 = -20, X1 = -4, SPEED = 5;                       // the Emperor's walk down the street (left to right)
const FX = [-15, -11, -7.5, -1.5];                        // townsfolk on the boardwalk
function grounded(a, y = 0) { a.root.updateMatrixWorld(true); a.root.position.y -= a.soleHeight() - y; a.root.updateMatrixWorld(true); }
let SHOT = 'hook';

export function samples() { return 1; }
export function update(t, stage) {
  const { shot, u } = shotAt(SHOTS, t); SHOT = shot.id;
  stage.sun.intensity = 2.8; stage.hemi.intensity = 0.55;
  const dock = t >= T.rich && t < T.writes;
  OUT.emperor.visible = HAT.emperor.visible = !dock; OUT.merchant.visible = HAT.merchant.visible = dock;
  const d = Math.min(X1 - X0, t * SPEED), walking = !dock && d < X1 - X0, lx = X0 + d;
  leo.root.visible = true;
  if (dock) {                                             // the merchant on the dock, facing the bay, then the crash
    leo.root.position.set(DOCK.x - 3.2, 0, DOCK.z + 0.8); leo.root.rotation.set(0, t < T.ships ? -0.55 : 0.9, 0);   // to camera, then to the bay
    robloxPose(leo, t < W.lost - 0.1 ? [[A.proud, t - T.rich, 1, true]] : [[A.idle, t, 1, true]]);
    grounded(leo, 0.8); setExpression(leo, t < W.arrived ? 'happy' : 'surprised');
  } else {
    leo.root.position.set(lx, 0, STREET_Z); leo.root.rotation.set(0, walking ? Math.PI / 2 : 0.35, 0);
    robloxPose(leo, walking ? [[A.walk, d / STRIDE]] : [[A.proud, t - (X1 - X0) / SPEED, 1, true]]);
    grounded(leo); setExpression(leo, 'happy');
  }
  const arrive = (i) => W.ship1 + i * 0.75;              // ship i reaches the dock: one, then ship after ship
  SF.ships.forEach((sh, i) => { const k = clamp((t - (arrive(i) - 1.4)) / 1.4); sh.position.copy(sh.userData.home).add(V(60 * (1 - easeOut(k)), 0, 0)); });
  const landed = t < T.ships ? 3 : 3 + SF.ships.filter((sh, i) => t > arrive(i)).length * 3;
  SACKS.forEach((k, i) => { k.visible = i < landed; });
  folk.forEach((e, i) => {
    if (dock) { e.root.visible = false; return; }
    const near = lx > FX[i] - 5, anim = [A.wave, A.cheer, A.clap, A.wave][i];
    e.root.visible = true; e.root.position.set(FX[i], 0, STREET_Z - 4.4); e.root.rotation.set(0, (i % 2 ? 0.25 : -0.25), 0);
    robloxPose(e, near ? [[anim, t + i * 0.3, 1, true]] : [[A.idle, t + i, 1, true]]);
    grounded(e); setExpression(e, near ? 'happy' : 'neutral');
  });
  const c = stage.camera;
  if (shot.id === 'hook') { c.position.set(lx + 4.6, 4.0, STREET_Z + 13.5); c.lookAt(V(lx + 0.4, 4.6, STREET_Z - 1.2)); c.fov = 46; }   // hat clear below the headline
  else if (shot.id === 'city') { c.position.set(lerp(-7, -5, u), 9.5, STREET_Z + 21); c.lookAt(V(-7, 2.6, STREET_Z - 3)); c.fov = 50; }
  else if (shot.id === 'rich') { c.position.set(DOCK.x - 10.5, 4.6, DOCK.z + lerp(12.5, 11.5, u)); c.lookAt(V(DOCK.x - 1.6, 4.0, DOCK.z - 1.0)); c.fov = 46; }
  else if (shot.id === 'ships') { c.position.set(DOCK.x - 10, 6.0, DOCK.z + 13); c.lookAt(V(DOCK.x + 8, 3.0, DOCK.z - 12)); c.fov = 50; }
  else if (shot.id === 'name') { c.position.set(lx + 1.6, 4.6, STREET_Z + lerp(9.6, 8.6, u)); c.lookAt(V(lx, 5.0, STREET_Z)); c.fov = 40; }   // head, hat and epaulettes, name above
  else { c.position.set(-6, 9.5, STREET_Z + 21); c.lookAt(V(-6, 2.6, STREET_Z - 3)); c.fov = 50; }
  c.up.set(0, 1, 0); c.updateProjectionMatrix(); stage.aimSun(V(lx, 2, STREET_Z), 18);
}

// ---------- overlays ----------
const pop = (t, t0, d = 0.22) => easeOutBack(clamp((t - t0) / d), 1.7);
function bigText(g, s, text, x, y, size, color, k = 1, rot = 0, edge = '#16141f', font = '"Luckiest Guy"') {
  if (k <= 0) return;
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.scale(k, k); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = `${size * s}px ${font}`; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 6 * s;
  g.strokeStyle = edge; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent'; g.fillStyle = color; g.fillText(text, 0, 0);
  g.restore();
}
function tag(g, s, t, t0, text, sub) {
  const a = clamp((t - t0) / 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.translate((60 - 30 * (1 - easeOut(a))) * s, 250 * s);
  g.font = `800 ${34 * s}px Montserrat`; const w = Math.max(g.measureText(text).width, sub ? g.measureText(sub).width : 0) / s + 56;
  roundRect(g, 0, 0, w * s, (sub ? 108 : 66) * s, 18 * s); g.fillStyle = 'rgba(14,18,34,.82)'; g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 10 * s, (sub ? 108 : 66) * s);
  g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, 30 * s, 34 * s);
  if (sub) { g.font = `800 ${28 * s}px Montserrat`; g.fillStyle = '#c9cfdc'; g.fillText(sub, 30 * s, 76 * s); }
  g.restore();
}
export function overlay(g, s, t) {
  if (SHOT === 'hook' || SHOT === 'city') tag(g, s, t, 0.3, 'SAN FRANCISCO, 1859', 'a broke man');
  if (SHOT === 'hook' && t > W.emperor1 - 0.15) {
    bigText(g, s, 'EMPEROR OF THE', 540, 400, 88, '#ffffff', pop(t, W.emperor1 - 0.15), -0.03);
    bigText(g, s, 'UNITED STATES', 540, 500, 108, '#ffd23f', pop(t, W.emperor1 + 0.05), -0.03);
  }
  if (SHOT === 'name' && t > W.norton1 - 0.2) bigText(g, s, 'JOSHUA NORTON', 540, 440, 104, '#ffffff', pop(t, W.norton1 - 0.2), -0.03);
  if (SHOT === 'rich' && t > W.rice1 - 0.15) bigText(g, s, 'ALL THE RICE', 540, 330, 100, '#ffd23f', pop(t, W.rice1 - 0.15), -0.03);
  if (SHOT === 'ships' && t > W.lost - 0.1) bigText(g, s, 'BROKE', 540, 440, 150, '#ff4b3f', pop(t, W.lost - 0.1, 0.18), -0.12, '#2a0d0d');
}
export const cast = () => ({ leo, folk0: folk[0] });
