// YouTube thumbnail (1280x720), one frame, built with the kit: Skye caught in Max's open closet by his flashlight.
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/thumbnail.js --out /tmp/thumb --samples 8 --skip-fit-check
// then: ffmpeg -i /tmp/thumb/web_0001.png -q:v 2 delivery/thumbnail.jpg
import * as THREE from 'three';
import * as K from './kit/index.js';

export const meta = { width: 1280, height: 720, fps: 30, seconds: 1 / 30 };
export const sky = K.SKY;
export const samples = () => 8;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

let C, P = {}, beam, set;
export async function setup(stage) {
  await K.buildSets(stage, ['bedroom']);
  K.setState({ chapter: 1, closet: 1 });
  C = await K.loadCast(stage.scene);
  K.dress(C.skye, 'skye_hoodie'); K.dress(C.max, 'max_pjs');
  P.torch = K.makeProp('flashlight'); K.hold(P.torch, C.max, 'R');
  beam = K.flashlightBeam(stage, { intensity: 22, cone: 0.035, angle: 0.36 });
}

export function update(t, stage) {
  set = K.showSet('bedroom');
  K.applyLight(stage, 'night_moon', { set, practicals: {} });
  K.only(C, ['skye', 'max']);
  // Skye just inside the closet, turned out towards the room and the camera, hand over her mouth
  K.posture(C.skye, 'stand'); K.gesture(C.skye, [-108, 0, 50], 'R');
  C.skye.bones.Head.rotation.set(0, 0, 0);
  K.putOn(C.skye, { pos: K.SET_ORIGIN.bedroom.clone().add(V(-12.0, 0, 2.1)), heading: Math.PI / 2 - 0.15 });
  C.skye.setFace('shocked');
  // Max at the doors, torch up at her, turned a little to the camera
  K.posture(C.max, 'stand'); K.gesture(C.max, 'hold_out', 'R');
  K.putOn(C.max, { pos: K.SET_ORIGIN.bedroom.clone().add(V(-6.2, 0, -0.4)), heading: 0.75 });
  C.max.bones.Head.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.6, 0)));   // looking into the closet
  C.max.setFace('suspicious');
  K.setBlockers(set.group);
  K.setCam(stage, { pos: K.SET_ORIGIN.bedroom.clone().add(V(-0.8, 4.8, 3.6)), target: K.SET_ORIGIN.bedroom.clone().add(V(-9.0, 5.2, 1.2)), fov: 31 }, { clear: false });
  const from = new THREE.Vector3(); P.torch.getWorldPosition(from);
  beam.set(true, from, K.headPos(C.skye).sub(from));
}

// big short text, readable at 168x94 (the smallest YouTube size)
export function overlay(g, s) {
  const text = (str, x, y, size, fill, stroke = '#120a24', lw = 18, rot = 0) => {
    g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.lineJoin = 'round';
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 16 * s; g.shadowOffsetY = 8 * s;
    g.strokeStyle = stroke; g.lineWidth = lw * s; g.strokeText(str, 0, 0); g.shadowColor = 'transparent';
    g.fillStyle = fill; g.fillText(str, 0, 0); g.restore();
  };
  text('I LIVED IN', 640, 118, 112, '#ffffff');
  text('HIS HOUSE!', 640, 236, 132, '#ffd23f');
  // "7 DAYS" sticker, bottom left
  g.save(); g.translate(150 * s, 640 * s); g.rotate(-0.12);
  g.fillStyle = '#ff2a2a'; K.roundRect(g, -110 * s, -52 * s, 220 * s, 104 * s, 18 * s); g.fill();
  g.lineWidth = 8 * s; g.strokeStyle = '#ffffff'; g.stroke(); g.restore();
  text('7 DAYS', 150, 662, 64, '#ffffff', '#7a0000', 10, -0.12);
}
