// Hold check for Lightning Hit Him Seven Times (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './lightning_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.can + 0.4, 'max', 'R', 'water can carried (walking out)'], [W.can + 0.3, 'max', 'R', 'water can shown'],
  [T.safe + 0.15, 'max', 'R', 'water can carried (out of the truck)'], [W.safe + 0.3, 'max', 'R', 'water can (proud)'],
  [W.again + 0.15, 'max', 'R', 'water can raised'], [W.again + 0.5, 'max', 'R', 'water can pouring'],
  [W.window - 0.4, 'max', 'R', 'steering wheel (strike two)'], [W.spots - 0.3, 'max', 'R', 'steering wheel (strike five)'],
  [W.s7 + 0.4, 'max', 'R', 'fishing rod'], [W.fishing + 0.7, 'max', 'R', 'fishing rod lifted'], [W.hair3 + 0.3, 'max', 'R', 'fishing rod (struck)'],
  [W.steal, 'max', 'R', 'fishing rod (the bear)'], [W.chases + 0.3, 'max', 'R', 'rod waved (running)'], [W.still, 'max', 'R', 'rod waved (stopped)'],
]);
