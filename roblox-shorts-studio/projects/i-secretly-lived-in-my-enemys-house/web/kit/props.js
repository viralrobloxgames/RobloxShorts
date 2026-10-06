// kit-props: every hand-held or worn prop (makeProp), and hold() / carry2() at the measured palm.
// STUB: the full builders land shortly; the exported names are final.
import * as THREE from 'three';
export const PROPS = {};
export function makeProp(id, opts = {}) { const g = new THREE.Group(); g.name = id; g.userData = { id, opts }; return g; }
export function hold(prop, actor, hand = 'R', mode = 'palm', opts = {}) { return prop; }
export function carry2(prop, actor, opts = {}) { return prop; }
