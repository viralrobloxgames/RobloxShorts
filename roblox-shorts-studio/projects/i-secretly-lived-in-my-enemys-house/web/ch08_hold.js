// Ch8 hold check: one close-up per held prop and moment, seen from the shot's own camera direction (so walls never get
// in the way), 3.2 studs from the prop. Frame k shows entry k-1. Render all frames and look at every one:
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch08_hold.js --out <dir> --frames 1-10 --scale 0.35 --skip-fit-check
import * as THREE from 'three';
import * as base from './ch08.js';
const at = (i, off = 0) => base.lineStart(i) + off;
const LIST = [
  [1.0, 'note', 'note folded (VO, at the door)'],
  [at(1, 1.0), 'note', 'note folded (reading it)'],
  [at(2, -0.4), 'note', 'note at the door gap (kneeling)'],
  [at(5, 0.5), 'crumpled', 'crumpled note in her fist (hallway)'],
  [at(3, 0.5), 'phone', 'phone at Max\'s ear'],
  [at(9, 0.5), 'crumpled', 'crumpled note (nest)'],
  [at(18, 1.0), 'crumpled', 'crumpled note (nest, end)'],
  [at(6, 0.6), 'teddy', 'teddy (Lily up through the hatch)'],
  [at(8, 0.3), 'teddy', 'teddy (Lily sitting)'],
  [at(18, 1.0), 'teddy', 'teddy (end)'],
];
export const meta = { ...base.meta, seconds: (LIST.length + 1) / 30 };
export const sky = base.sky, setup = base.setup;
export function update(t, stage) {
  const [tt, which] = LIST[Math.min(LIST.length - 1, Math.round(t * 30))];
  base.update(tt, stage);
  const p = base.props()[which], c = stage.camera, w = new THREE.Vector3();
  p.getWorldPosition(w);
  const dir = c.position.clone().sub(w).normalize();
  c.position.copy(w).addScaledVector(dir, 3.2); c.fov = 40; c.updateProjectionMatrix(); c.lookAt(w);
}
export function overlay() {}
