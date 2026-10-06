// Hold check for Ch3 (web/lib/holdcheck.js): every held prop in close-up. Frame k shows entry k-1.
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch03_hold.js --out /tmp/hold3 --frames 1-13 --scale 0.35 --skip-fit-check
import * as base from './ch03.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const { lineAt: at, lineEnd: end } = base;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [1.0, 'skye', 'L', 'magnet letters (at the fridge)', { side: 3.0, dist: 4.5, up: 1.5 }],
  [at(3, 1.0), 'max', 'R', 'flashlight (walking in)', { side: 2.5 }],
  [at(6, 0.5), 'max', 'R', 'flashlight (at the fridge)'],
  [end(8, 0.75), 'max', 'R', 'ham (from the fridge)', { side: 3.0, dist: 4.5, up: 1.5 }],
  [at(9, 0.3), 'max', 'R', 'ham (at the island)', { side: 3.0, dist: 4.5, up: 1.5 }],
  [end(9, 0.5), 'max', 'R', 'knife (cutting the crusts)'],
  [at(11, 1.0), 'skye', 'R', 'sandwich (crusts line)'],
  [at(12, 1.5), 'skye', 'R', 'sandwich (smug line)'],
  [at(14, 0.5), 'skye', 'R', 'sandwich (crouched)'],
  [end(16, 0.5), 'skye', 'R', 'half-eaten sandwich'],
  [at(17, 1.0), 'dad', 'R', 'ham (Dad)'],
  [end(17, 0.6), 'dad', 'R', 'ham (Dad walking off)'],
  [base.meta.seconds - 0.1, 'skye', 'R', 'half-eaten sandwich (last frame)'],
]);
