// Hold check for He Won The Marathon By Car (see web/lib/holdcheck.js): Mia's medal (raised, low, pulled back), Leo's
// apple (low, at the mouth, the rotten one) and Noob's hands on the steering wheel.
import * as base from './marathon_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.medal + 0.6, 'mia', 'R', 'medal raised (line 2)'], [W.medal2 + 0.1, 'mia', 'R', 'medal raised (caught)'],
  [T.caught + 0.2, 'mia', 'R', 'medal low'], [T.banned + 0.3, 'mia', 'R', 'medal pulled back'],
  [T.apple + 0.15, 'leo', 'R', 'apple low'], [W.apples + 0.3, 'leo', 'R', 'apple at the mouth'], [T.nap + 0.2, 'leo', 'R', 'rotten apple'],
  [1.0, 'noob', 'R', 'steering wheel'], [1.0, 'noob', 'L', 'steering wheel'],
], { dist: 6.5, side: -3.0, up: 1.6 });
