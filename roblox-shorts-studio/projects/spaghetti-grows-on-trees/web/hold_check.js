// Hold check for Spaghetti Grows On Trees (see web/lib/holdcheck.js). Held props: the hank in Mia's right hand and the
// basket by its handle in Skye's (hook), the hank Skye holds at the drying rail (both hands), the spaghetti tin in Noob's
// hand, the telephone handsets (Leo's left hand, Max's right hand), and the sprig Leo lowers into the tin.
import * as base from './spaghetti_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [1.0, 'mia', 'R', 'hank (hook)'], [1.0, 'skye', 'R', 'basket by its handle (hook)'],
  [T.dry + 1.2, 'skye', 'L', 'hank at the rail, left hand'], [T.dry + 1.2, 'skye', 'R', 'hank at the rail, right hand'],
  [T.tin + 1.0, 'noob', 'R', 'spaghetti tin'], [T.ask + 0.6, 'leo', 'L', 'handset (Leo)'], [T.answer + 0.6, 'max', 'R', 'handset (Max)'],
  [W.tomato + 0.2, 'leo', 'R', 'sprig into the tin'],
], { dist: 4.5, side: -2.0, up: 1.0 });
