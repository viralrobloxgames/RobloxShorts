// Hold check for He Sold The Eiffel Tower (see web/lib/holdcheck.js): the bill of sale passing from Max's left fist to
// Leo's right, the newspaper in both hands, the stamp, the cash bags, the phone earpiece, the briefcase and the reward.
import * as base from './eiffel_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [0.2, 'max', 'L', 'bill of sale (Max)'], [W.eiffel + 0.6, 'leo', 'R', 'bill of sale (Leo)'],
  [T.idea + 0.4, 'max', 'R', 'newspaper (both hands)'], [T.stampT + 0.1, 'max', 'R', 'stamp'],
  [W.bribe + 0.1, 'leo', 'R', 'little bribe bag'], [W.grabs + 0.3, 'max', 'R', 'cash bag (grabbed)'],
  [T.call + 0.8, 'mia', 'R', 'phone earpiece'], [T.capone + 0.2, 'max', 'R', 'briefcase'], [W.capone + 0.6, 'noob', 'R', 'reward cash'],
], { dist: 6.5, side: -2.6, up: 1.4 });
