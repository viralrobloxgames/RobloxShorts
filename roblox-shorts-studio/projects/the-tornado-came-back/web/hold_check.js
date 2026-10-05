// Hold check for The Tornado Came Back (see web/lib/holdcheck.js). Nobody carries a prop in this one; these are the
// hand-contact moments instead: Skye and Noob's hands on the fighter's tail plane as they push it into the hangar, Max
// typing (the elevator button press is checked in the dream shot's own preview).
import * as base from './tornado_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.hangar + 0.4, 'skye', 'R', 'pushing the tail (moving)'], [T.hangar + 0.4, 'noob', 'L', 'pushing the tail (moving)'],
  [T.hangar + 1.5, 'skye', 'L', 'pushing the tail (late)'], [T.hangar + 1.5, 'noob', 'R', 'pushing the tail (late)'],
  [T.type + 0.5, 'max', 'R', 'typing'],
], { dist: 6.5, side: -3.0, up: 1.6 });
