// Hold check for The Dog Who Saved A Town (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './dog_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.sick + 0.6, 'leo', 'R', 'medicine bottle'], [W.seven + 0.3, 'leo', 'R', 'medicine bottle (later)'],
  [T.arrive + 0.6, 'leo', 'L', 'crate'], [W.stopped + 0.3, 'leo', 'L', 'crate (stopped)'],
]);
