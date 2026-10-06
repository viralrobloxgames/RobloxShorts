// Hold check for The Six Million Dollar Banana (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './banana_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [0.5, 'leo', 'R', 'banana held up (hook)'], [T.eats + 0.3, 'leo', 'R', 'banana at the mouth'], [T.eats + 1.2, 'leo', 'R', 'banana bitten'],
  [T.fair + 0.6, 'noob', 'R', 'banana carried to the wall'], [W.banana2, 'noob', 'L', 'tape roll'],
  [W.eats2 + 0.3, 'max', 'R', 'banana eaten (fair)'], [W.tape - 0.3, 'skye', 'R', 'new banana'], [W.tape - 0.3, 'skye', 'L', 'tape roll'],
  [W.eats3 + 0.6, 'mia', 'R', 'banana eaten (Seoul)'], [W.three, 'folk1', 'R', 'paddle up'], [W.dollars3 - 0.1, 'skye', 'R', 'gavel'],
  [T.stand + 0.8, 'folk6', 'R', 'banana handed over'], [W.cents, 'folk7', 'R', 'runner with the banana'],
]);
