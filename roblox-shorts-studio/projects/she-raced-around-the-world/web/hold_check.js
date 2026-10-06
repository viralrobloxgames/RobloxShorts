// Hold check for She Raced Around The World (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './race_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [W.reporter + 0.3, 'mia', 'L', 'bag (hook)'], [W.faster + 0.4, 'mia', 'L', 'bag (pointing)'], [T.sail + 0.6, 'mia', 'L', 'bag (sail)'],
  [T.verne + 0.6, 'mia', 'L', 'bag (walking)'], [W.meet + 0.4, 'mia', 'L', 'bag (author)'], [W.meet + 0.4, 'max', 'L', 'book'],
  [T.route + 0.6, 'mia', 'L', 'bag (route)'], [W.news + 0.4, 'mia', 'R', 'telegram'], [T.race + 0.5, 'mia', 'L', 'bag (race)'],
  [T.storm + 0.6, 'mia', 'L', 'bag (storm)'], [T.cta + 0.6, 'mia', 'L', 'bag (cta)'],
]);
