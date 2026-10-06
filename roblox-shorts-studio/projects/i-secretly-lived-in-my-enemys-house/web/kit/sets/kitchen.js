// kitchen set (kit-sets-c). PLACEHOLDER: full build in progress; API is final: build(scene) -> { id, group, marks, cams, lights, setState }.
import { THREE, V, std, box, markMaker, camMaker } from './common_c.js';
export const OFFSET = V(900, 0, 0);
export function build(scene) {
  const group = new THREE.Group(); group.name = 'set_kitchen'; group.position.copy(OFFSET); scene.add(group);
  box(32, 0.2, 24, std('#c8b89a'), 0, -0.1, 0, group);
  const M = markMaker(OFFSET), C = camMaker(OFFSET);
  const marks = { center: M(0, 0, 0, Math.PI) };
  const cams = { wide: C([0, 9, 26], [0, 3, 0], 40) };
  return { id: 'kitchen', group, marks, cams, lights: {}, setState() {} };
}
