// Cover for The Dog Who Found The World Cup (one frame, 1080x1920; everything that must read inside y 290..1560,
// x 60..1020). Pickles sits proudly by the hedge next to the torn parcel and the gold trophy; Max behind, amazed.
import * as THREE from 'three';
import * as base from './cup_clip.js';
import { setExpression } from '../../../web/lib/rig.js';
import { STREET } from './kit.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SS = (x, y, z) => V(STREET.x + x, y, STREET.z + z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
export function update(t, stage) {
  base.update(base.TIMES.inside + 0.8, stage);            // dusk on the street, Max shocked
  const { max } = base.cast(), P = base.props();
  max.root.position.x = SS(-1.5, 0, 0).x; max.root.position.z = 0.3; max.root.rotation.y = 0.45; max.root.updateMatrixWorld(true); setExpression(max, 'shocked');
  const d = base.dbase(SS(1.45, 0, 1.0), -0.3); d.sit = 1; d.head = [0, 0.15, -0.25]; d.wag = 0;
  base.placeDog(d, 0); base.setLeash(true);
  P.torn.position.copy(SS(0.05, 0, 1.9)); P.torn.rotation.set(0, 0.15, 0); P.cup.position.copy(P.torn.position); P.cup.rotation.set(0, 0.15, 0); P.torn.scale.setScalar(1.5); P.cup.scale.setScalar(1.5);
  const cam = stage.camera; cam.position.copy(SS(0.0, 3.6, 14.2)); cam.fov = 44; cam.up.set(0, 1, 0); cam.updateProjectionMatrix(); cam.lookAt(SS(0.0, 3.6, 0.8));
  stage.aimSun(SS(0, 2, 0.5), 10);
}
function big(g, s, text, x, y, size, color, rot = 0) {
  g.save(); g.translate(x * s, y * s); g.rotate(rot); g.font = `${size * s}px "Luckiest Guy"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30 * s; g.shadowOffsetY = 10 * s;
  g.strokeStyle = '#0c1020'; g.lineWidth = size * 0.2 * s; g.strokeText(text, 0, 0); g.shadowColor = 'transparent';
  g.fillStyle = color; g.fillText(text, 0, 0); g.restore();
}
export function overlay(g, s) {
  big(g, s, 'THIS DOG FOUND', 540, 340, 112, '#ffffff', -0.03);
  big(g, s, 'THE WORLD CUP', 540, 468, 128, '#ffd23f', -0.03);
  big(g, s, 'TRUE STORY', 540, 578, 70, '#ff4d5a', -0.03);
}
