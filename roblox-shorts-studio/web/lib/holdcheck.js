// Hold check: one close-up per held prop, from in front of the holder with everyone else hidden, so you can see whether
// the thing is actually in the hand (grips inside the palm, handles in the fists, nothing floating or sunk in an arm).
// Per project, a three-line clip:
//   import * as base from './my_clip.js'; import { holdCheck } from '../../../web/lib/holdcheck.js';
//   export const { meta, sky, setup, update, overlay } = holdCheck(base, [[19.0, 'leo', 'R', 'burger'], ...]);
// base.cast() must return the actors by name. Render every frame and look at all of them before a full render:
//   node web/render.mjs --clip projects/<slug>/web/hold_check.js --out /tmp/hold --frames 1-N --scale 0.35 --skip-fit-check
// (frame k shows entry k-1). An entry may end with { dist, side, up } to move its camera, e.g. when a wall stands in front of the holder.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function holdCheck(base, list, { dist = 5.5, side = -2.5, up = 1.2 } = {}) {
  return {
    meta: { ...base.meta, seconds: Math.max(1, (list.length + 1) / 30) }, sky: base.sky,
    setup: (stage) => base.setup(stage),
    update(t, stage) {
      const [tt, who, hand, , o = {}] = list[Math.min(list.length - 1, Math.max(0, Math.round(t * 30)))], c = stage.camera;
      base.update(tt, stage);
      const cast = base.cast(), a = cast[who]; a.root.updateMatrixWorld(true);
      for (const o of Object.values(cast)) if (o !== a) o.root.visible = false;
      const g = a.bones[hand === 'L' ? 'Arm.L' : 'Arm.R'].localToWorld(V(0, -1.8, 0));
      const fwd = V(Math.sin(a.root.rotation.y), 0, Math.cos(a.root.rotation.y)), right = V(-fwd.z, 0, fwd.x);
      c.position.copy(g).addScaledVector(fwd, o.dist ?? dist).addScaledVector(right, o.side ?? side).add(V(0, o.up ?? up, 0)); c.lookAt(g); c.fov = 40; c.updateProjectionMatrix();
    },
    overlay() {},
  };
}
