// Hold check for The Penguin General (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './penguin_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [W.king + 0.3, 'noob', 'R', 'ceremonial sword raised'], [W.knight - 0.05, 'noob', 'R', 'sword tap on the shoulder'],
  [W.citation + 0.4, 'leo', 'L', 'citation scroll'], [W.qualified, 'leo', 'R', 'citation scroll'],
  [W.lance + 0.4, 'max', 'R', '1972 salute (hand at the brow)'],
]);
