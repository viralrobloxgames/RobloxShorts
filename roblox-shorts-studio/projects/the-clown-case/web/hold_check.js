// Hold check for The Clown Case (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './clown_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [7.6, 'chief', 'R', 'photo'], [9.8, 'chief', 'R', 'putter (R)'], [10.2, 'chief', 'L', 'putter (L)'], [16.6, 'max', 'R', 'ransom note'],
  [20.5, 'max', 'R', 'note at the nose'], [45.75, 'crew1', 'R', 'sundae before the throw'], [56.75, 'max', 'R', 'spoon', { dist: 2.4, side: -1.6, up: 0.6 }], [57.03, 'max', 'R', 'spoon (up)', { dist: 2.4, side: -1.6, up: 0.6 }],
]);
