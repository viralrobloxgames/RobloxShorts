// Hold check for She Went Over Niagara Falls In A Barrel (see web/lib/holdcheck.js): Leo's hands on the pump's T-handle
// (top and bottom of the stroke), Noob's hand pressing the lid shut, Leo and Noob pushing the barrel off the dock, Skye's
// hands on the barrel in the rowboat.
import * as base from './barrel_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
const top = T.pump + 0.3, bottom = T.pump + 0.3 + 0.31;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [top, 'leo', 'R', 'pump handle (top of the stroke)'], [top, 'leo', 'L', 'pump handle (top of the stroke)'],
  [bottom, 'leo', 'R', 'pump handle (bottom of the stroke)'], [bottom, 'leo', 'L', 'pump handle (bottom)'],
  [W.seal + 0.1, 'noob', 'R', 'pressing the lid shut'],
  [W.adrift - 0.1, 'leo', 'R', 'pushing the barrel'], [W.adrift - 0.1, 'noob', 'L', 'pushing the barrel'],
  [W.grab + 0.2, 'skye', 'R', 'hands on the barrel'], [W.grab + 0.2, 'skye', 'L', 'hands on the barrel'],
], { dist: 6.5, side: -3.0, up: 1.6 });
