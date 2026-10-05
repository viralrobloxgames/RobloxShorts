// Hold check for He Won By Not Sleeping (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './cliff_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.gun + 0.3, 'folk0', 'R', 'starter pistol up'], [W.hand + 0.2, 'folk0', 'L', 'cheque handed over'], [W.hand + 0.7, 'cliff', 'R', 'cheque held in both hands'],
  [T.gives + 0.5, 'max', 'R', 'cash (Max)'], [T.gives + 1.5, 'skye', 'R', 'cash (Skye)'],
]);
