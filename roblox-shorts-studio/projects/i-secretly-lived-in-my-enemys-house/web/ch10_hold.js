// Ch10 hold check: one close-up per held prop and moment (web/lib/holdcheck.js). Render every frame and look at all:
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch10_hold.js --out /tmp/hold10 --frames 1-9 --scale 0.35 --skip-fit-check
import * as base from './ch10.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const T = base.TIMES, L = base.LINES, at = (i, o = 0) => L.line(i).start + o;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [2.0, 'skye', 'R', 'phone held up recording (sheet on)'],
  [at(2, 0.5), 'skye', 'R', 'phone up, spooky arm out'],
  [at(3, 0.5), 'max', 'L', 'plate out to her ("Hungry?")'],
  [at(7, 1.2), 'max', 'L', 'plate lifted ("the sandwiches")'],
  [T.pull + 0.6, 'skye', 'L', 'sheet bunched in her left hand'],
  [T.pull + 0.6, 'skye', 'R', 'phone lowered to her chest'],
  [at(12, 2.5), 'skye', 'R', 'phone hand pointing at him'],
  [at(18, 0.3), 'skye', 'L', 'end: sheet bunch'],
  [at(18, 0.3), 'skye', 'R', 'end: phone'],
]);
