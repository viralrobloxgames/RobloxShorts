// Cover for The Vampire Case (one frame, 1080x1920; everything that matters inside y 290-1560). Count Vlad and his
// sister grinning with their fangs out, Max's long nose in profile at the frame edge; the show's lock-up
// (Detective / MAX SNIFFWELL / The Vampire Case) lower left, as in the video's title card (the original's covers put the
// episode's oddball suspect behind the lock-up).
import * as THREE from 'three';
import * as base from './vampire_clip.js';
import { setExpression } from '../../../web/lib/rig.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
const at = (a, x, y, z) => { a.root.updateMatrixWorld(true); return V(x, y, z).applyMatrix4(a.root.matrixWorld); };
export function update(t, stage) {
  base.update(W.fangs + 0.7, stage);                    // both grinning, fangs out
  const { max, sis, vlad } = base.cast();
  max.root.visible = true; setExpression(max, 'suspicious');
  const head = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.5, 0).applyMatrix4(a.bones.Head.matrixWorld); };
  const mid = head(sis).lerp(head(vlad), 0.5);
  // The video's fangs shot camera, then Max put side-on at the right edge of it, nose pointing into the frame.
  const C = at(sis, 2.8, 5.3, 12), T = mid.clone().add(V(0, -0.4, 0)), f = T.clone().sub(C).normalize(), r = f.clone().cross(V(0, 1, 0)).normalize();
  const H = C.clone().addScaledVector(f, 6.0).addScaledVector(r, 1.05).add(V(0, -2.2, 0));
  max.root.rotation.set(0, Math.atan2(-r.x, -r.z), 0); max.root.position.set(H.x, 0, H.z); max.root.updateMatrixWorld(true);
  max.root.position.y += H.y - head(max).y; max.root.updateMatrixWorld(true);
  const cam = stage.camera; cam.position.copy(C); cam.fov = 52; cam.updateProjectionMatrix(); cam.lookAt(T.clone().add(V(0, -0.9, 0)));
  stage.aimSun(V(mid.x, 0, mid.z), 20); stage.bloom.strength = 0.45;
}
export function overlay(g, s) {
  base.lockup(g, s, { x: 70, y: 1130 });
}
