// YouTube thumbnail (1280x720) for "I Secretly Lived In My Enemy's House For A Week": a kit-built still, not a video
// frame. One frame per variant: frame 1 = A, 2 = B, 3 = C (production/briefs/package.md).
// Max's room at night: Skye (pink hair, hoodie) peeks out of his closet, wide-eyed, while Max in his pyjamas shines his
// flashlight the other way. Big headline at the top, faces large below it.
//
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/thumbnail.js --out <dir> --frames 1-3 --skip-fit-check
import * as THREE from 'three';
import * as K from './kit/index.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const meta = { width: 1280, height: 720, fps: 30, seconds: 3 / 30 };
export const sky = K.SKY;
export const samples = () => 12;

// ---------- the variants ----------
// cam: camera; skye / max: floor position + heading (forward = (sin h, 0, cos h)); head: head yaw (rad, + = to his left);
// text: headline lines (Luckiest Guy) with the accent line in yellow; doors: closet leaves (0 shut .. 1 wide).
const BASE = {
  cam: { pos: V(1.5, 5.0, 1.0), target: V(-10.0, 4.5, 0.6), fov: 22 },
  skye: { pos: V(-11.35, 0, 2.2), heading: 1.4 }, skyeFace: 'shocked', hand: false,
  max: { pos: V(-8.3, 0, -0.4), heading: 2.2 }, head: 0.05, maxFace: 'suspicious',
  doors: [1.0, 0.33], textSide: 'left',
};
const VARIANTS = [
  { ...BASE, text: [['HE NEVER', '#ffffff'], ['KNEW', '#ffd23f']] },                       // A: the core image
  { ...BASE, cam: { pos: V(1.5, 5.0, 1.6), target: V(-10.0, 4.55, 1.05), fov: 18 }, text: [['7 DAYS', '#ffd23f'], ['HIDING', '#ffffff']] },  // B: closer on Skye
  { ...BASE, circle: true, text: [['HE NEVER', '#ffffff'], ['KNEW', '#ffd23f']],                     // C: tighter + red circle on Skye
    cam: { pos: V(1.5, 5.0, 1.0), target: V(-10.0, 4.6, 0.6), fov: 19 } },
];
const variantAt = (t) => VARIANTS[Math.min(VARIANTS.length - 1, Math.max(0, Math.round(t * 30)))];

// ---------- setup ----------
let C, A, P = {}, beam, key, rimPink, faceFill, RED = null, CUR = VARIANTS[0];
export async function setup(stage) {
  await K.buildSets(stage, ['bedroom']);
  K.setState({ chapter: 1 });
  C = await K.loadCast(stage.scene);
  A = await K.loadAnims(['idle']);
  P.torch = K.makeProp('flashlight', { beam: true }); K.hold(P.torch, C.max, 'R');
  beam = K.flashlightBeam(stage, { cone: 0.16, intensity: 90 });
  // thumbnail lighting on top of night_moon: a soft cool key from the camera side so both faces read at phone size,
  // a warm fill inside the closet on Skye, and a pink rim behind her
  key = new THREE.SpotLight('#dfe6ff', 0, 30, 0.22, 0.8, 1.2); stage.scene.add(key, key.target);
  faceFill = new THREE.PointLight('#ffd9a8', 0, 7, 1.6); stage.scene.add(faceFill);
  rimPink = new THREE.PointLight('#ff5fa2', 0, 8, 1.6); stage.scene.add(rimPink);
}

const armSet = (a, sd, x, y = 0, z = 0) => a.bones['Arm.' + sd].rotation.set(x, y, z);

// ---------- update ----------
export function update(t, stage) {
  const v = CUR = variantAt(t);
  const set = K.showSet('bedroom');
  K.applyLight(stage, 'night_moon', { set, practicals: { bedside_lamp: false, moon_window: true, closet_light: 0.2 } });
  stage.hemi.intensity *= 0.45; stage.fill.intensity *= 0.5; stage.renderer.toneMappingExposure = 0.95;
  K.only(C, ['skye', 'max']);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs');
  set.setClosetDoors(v.doors[0], v.doors[1]); set.setBlanket?.('flat');

  K.playAnim(C.skye, [[A.idle, 0]]); K.playAnim(C.max, [[A.idle, 0]]);
  K.putOn(C.skye, v.skye); K.putOn(C.max, v.max);
  if (v.hand) K.gesture(C.skye, [-140, 0, 55], 'L');
  C.max.bones.Head?.rotation.set(0.05, v.head, 0);
  armSet(C.max, 'R', -1.65, 0.1, 0.1);                    // flashlight up, aimed off to his left (frame right)
  K.hold(P.torch, C.max, 'R'); P.torch.visible = true; P.torch.userData.setOn?.(true);

  C.skye.setFace(v.skyeFace); C.max.setFace(v.maxFace);
  K.blush(C.skye, 0);

  stage.camera.position.copy(v.cam.pos); stage.camera.lookAt(v.cam.target);
  stage.camera.fov = v.cam.fov; stage.camera.updateProjectionMatrix();
  K.applyShot(stage, { pos: v.cam.pos.clone(), target: v.cam.target.clone(), fov: v.cam.fov });

  const hs = K.headPos(C.skye), hm = K.headPos(C.max);
  key.intensity = 70; key.position.copy(v.cam.pos).add(V(0.5, 2.5, 1.5)); key.target.position.copy(hs.clone().lerp(hm, 0.5));
  faceFill.intensity = 4; faceFill.position.copy(hs).add(V(1.6, 0.4, -0.6));
  rimPink.intensity = 7; rimPink.position.copy(hs).add(V(-2.2, 1.2, 0.9));

  const from = new THREE.Vector3(), q = new THREE.Quaternion();
  C.max.root.updateWorldMatrix(true, true);
  P.torch.getWorldPosition(from); P.torch.getWorldQuaternion(q);
  beam.set(true, from, V(0, 0, 1).applyQuaternion(q));

  RED = v.circle ? K.screenOf(stage, hs) : null;
}

// ---------- overlay (1280x720 units x s) ----------
// screenOf returns 1920x1080 units; the overlay here is 1280x720
const SX = 1280 / 1920;
export function overlay(g, s) {
  const v = CUR;
  // vignette (night) and a darker top so the headline pops
  const vg = g.createRadialGradient(640 * s, 400 * s, 260 * s, 640 * s, 400 * s, 820 * s);
  vg.addColorStop(0, 'rgba(4,6,24,0)'); vg.addColorStop(1, 'rgba(4,6,24,0.6)');
  g.fillStyle = vg; g.fillRect(0, 0, 1280 * s, 720 * s);
  const grd = g.createLinearGradient(0, 0, 0, 300 * s);
  grd.addColorStop(0, 'rgba(6,6,22,0.55)'); grd.addColorStop(1, 'rgba(6,6,22,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 1280 * s, 300 * s);
  g.save(); g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const left = v.textSide === 'left', x = left ? 36 : 1244;
  g.textAlign = left ? 'left' : 'right';
  let y = 128;
  for (const [line, color] of v.text) {
    g.font = `${128 * s}px "Luckiest Guy"`;
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 18 * s; g.shadowOffsetY = 6 * s;
    g.strokeStyle = '#120a24'; g.lineWidth = 22 * s; g.strokeText(line, x * s, y * s);
    g.shadowColor = 'transparent';
    g.fillStyle = color; g.fillText(line, x * s, y * s);
    y += 118;
  }
  g.restore();
  if (RED) K.redCircle(g, s, 1, RED.x * SX + 10, RED.y * SX + 8, 100, { t0: 0, width: 9 });
}
