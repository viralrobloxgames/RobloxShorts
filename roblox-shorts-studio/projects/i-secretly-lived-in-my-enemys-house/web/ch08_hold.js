// Ch8 hold check: every held prop at its moments (render all frames, look at each close-up).
import * as base from './ch08.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const at = (i, off = 0) => base.lineStart(i) + off;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [1.0, 'skye', 'R', 'note folded (VO, at the door)'],
  [at(1, 1.0), 'skye', 'R', 'note folded (reading it)'],
  [at(2, 0.5), 'skye', 'R', 'note at the door gap (kneeling)', { up: -0.5 }],
  [at(5, 0.5), 'skye', 'R', 'crumpled note in her fist (hallway)'],
  [at(3, 0.5), 'max', 'L', 'phone at his ear', { side: 2.5 }],
  [at(3, 0.5), 'max', 'L', 'phone at his ear (front)', { side: 0, dist: 4 }],
  [at(9, 0.5), 'skye', 'R', 'crumpled note (nest)'],
  [at(13, 1.0), 'skye', 'R', 'crumpled note thump (nest)'],
  [at(6, 0.2), 'lily', 'L', 'teddy (hatch)'],
  [at(10, 0.5), 'lily', 'L', 'teddy (sitting)'],
]);
