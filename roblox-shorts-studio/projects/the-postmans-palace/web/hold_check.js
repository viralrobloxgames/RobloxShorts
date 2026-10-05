// Hold check for The Postman's Palace (see web/lib/holdcheck.js): the stone in his palm, the basket hanging from his
// fist, the wheelbarrow handles in both fists (posed from both hands every frame), and a stone being set at night.
import * as base from './palace_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.pocket + 0.6, 'max', 'R', 'the stone (raised)'], [T.baskets + 0.8, 'max', 'R', 'basket (walking)'],
  [T.barrow + 0.8, 'max', 'R', 'wheelbarrow right handle'], [T.barrow + 0.8, 'max', 'L', 'wheelbarrow left handle'],
  [T.night + 0.5, 'max', 'R', 'a stone at night'], [T.tomb + 0.6, 'max', 'R', 'a stone at the tomb'],
], { dist: 6.5, side: -2.6, up: 1.4 });
