// Procedural arm gestures for pack (R6) actors that keep the arms clear of the head and body. The pack's celebrate and
// panic animations fold the arms over the head (the hands sink into it) and the Roblox wave swings the arm behind the
// head, so clips use these instead. Call after robloxPose(): they override the arm joints only. hop(t) is an optional
// lift (world units per unit of character scale) to add to the root after grounding, for a celebratory bounce.
import * as THREE from 'three';

const e = new THREE.Euler();
// up: how far the arm is raised sideways (0 hanging, PI/2 straight out); kept <= 2.6 rad so the inner edge of the
// arm stays outside the head and hair. fwd: tilt of the raised arm towards the front.
function arm(actor, side, up, fwd = 0.08) {
  const b = actor.bones[side === 'L' ? 'Arm.L' : 'Arm.R'];
  e.set(fwd, 0, side === 'L' ? up : -up, 'XYZ'); b.quaternion.setFromEuler(e);
}
export const hop = (t, k = 0.12) => k * Math.abs(Math.sin(t * Math.PI * 2.2));

// Both arms up in a V, swaying side to side together, with a little hop: winning, celebrating.
export function cheerWave(actor, t) { const d = 0.13 * Math.sin(t * 9); arm(actor, 'L', 2.42 + d); arm(actor, 'R', 2.42 - d); }
// One arm up, waving from the shoulder: hi / bye.
export function waveArm(actor, t, side = 'R') { arm(actor, side, 2.4 + 0.18 * Math.sin(t * 11), 0.1); }
// Both arms flailing out of step above the shoulders: panic.
export function panicArms(actor, t) { arm(actor, 'L', 2.3 + 0.22 * Math.sin(t * 17)); arm(actor, 'R', 2.3 + 0.22 * Math.sin(t * 17 + Math.PI)); }
