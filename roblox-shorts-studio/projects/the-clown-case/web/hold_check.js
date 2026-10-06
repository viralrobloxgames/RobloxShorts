// Hold check for The Clown Case (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './clown_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [7.6, 'chief', 'R', 'photo'], [9.08, 'chief', 'R', 'putter (address)'], [9.73, 'chief', 'R', 'putter (top of backswing)'], [10.01, 'chief', 'L', 'putter (through the ball)'], [16.6, 'max', 'R', 'ransom note'],
  [20.5, 'max', 'R', 'note at the nose'], [44.74, 'crew1', 'R', 'sundae before the throw'], [47.88, 'wife', 'R', 'cuffs (till)'],
  [50.80, 'wife', 'R', 'cuffs (speech)'],
  [59.07, 'max', 'R', 'spoon', { dist: 2.4, side: -1.6, up: 0.6 }], [59.35, 'max', 'R', 'spoon (up)', { dist: 2.4, side: -1.6, up: 0.6 }],
]);
