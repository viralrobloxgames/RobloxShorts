// Cover for The Clown Case (one frame, 1080x1920; everything that matters inside y 290-1560). Giggles the clown
// candidate in his suit, nervous, with Max's long nose in profile at the frame edge; the show's lock-up
// (Detective / MAX SNIFFWELL / The Clown Case) lower left, as in the video's title card.
import * as THREE from 'three';
import * as base from './clown_clip.js';
import { lockup } from '../../super-nose-case-2/web/vampire_clip.js';
import { setExpression } from '../../../web/lib/rig.js';
import { W } from './beats.js';

export const meta = { ...base.meta, seconds: 1 };
export const sky = base.sky;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 6; }
const at = (a, x, y, z) => { a.root.updateMatrixWorld(true); return V(x, y, z).applyMatrix4(a.root.matrixWorld); };
export function update(t, stage) {
  base.update(W.figure - 0.5, stage);                   // the dressing room, the clown face on full show (before he points)
  const { max, gig, chief } = base.cast();
  chief.root.visible = false; gig.root.visible = true; setExpression(gig, 'surprised'); setExpression(max, 'suspicious');
  const head = (a) => { a.bones.Head.updateMatrixWorld(true); return V(0, 0.5, 0).applyMatrix4(a.bones.Head.matrixWorld); };
  const gh = head(gig);
  // In front of the clown, then Max put side-on at the right edge, nose pointing into the frame.
  const C = at(gig, 0.6, 4.6, 9.5), T = gh.clone().add(V(0, -0.6, 0)), f = T.clone().sub(C).normalize(), r = f.clone().cross(V(0, 1, 0)).normalize();
  const H = C.clone().addScaledVector(f, 5.0).addScaledVector(r, 1.4).add(V(0, -1.95, 0));
  max.root.rotation.set(0, Math.atan2(-r.x, -r.z), 0); max.root.position.set(H.x, 0, H.z); max.root.updateMatrixWorld(true);
  max.root.position.y += H.y - head(max).y; max.root.updateMatrixWorld(true);
  const cam = stage.camera; cam.position.copy(C); cam.fov = 48; cam.updateProjectionMatrix(); cam.lookAt(T.clone().add(V(0, -0.9, 0)));
  stage.aimSun(V(gh.x, 0, gh.z), 20); stage.bloom.strength = 0.45;
}
export function overlay(g, s) {
  lockup(g, s, { x: 70, y: 1130, caseName: 'The Clown Case' });
}
