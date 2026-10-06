// Hold check for He Flew A Lawn Chair (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './chair_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [W.sandwiches + 0.2, 'max', 'R', 'sandwich'], [W.pellet + 0.4, 'max', 'R', 'pellet gun shown'], [T.liner + 0.5, 'max', 'R', 'pellet gun (liner)'],
  [W.pops + 0.2, 'max', 'R', 'pellet gun aimed up'], [W.drops - 0.2, 'max', 'R', 'pellet gun before the drop'],
  [T.cockpit + 0.6, 'leo', 'R', 'radio mic'], [W.reporters + 0.4, 'leo', 'R', 'press camera'], [W.reporters + 0.4, 'mia', 'R', 'microphone'],
  [W.police + 0.4, 'noob', 'R', 'flashlight'], [T.fined + 0.6, 'max', 'R', 'letter (R)'], [T.fined + 0.6, 'max', 'L', 'letter (L)'], [T.aircraft + 0.8, 'max', 'R', 'letter (aircraft)'],
]);
