// Hold check for They Lost A War To Emus (see web/lib/holdcheck.js). Nothing is carried by hand; these close-ups check
// the gunners' hands on the Lewis gun (ambush and truck) and the major's salute against his hat brim.
import * as base from './emu_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.day3 + 0.5, 'leo', 'R', 'hands on the gun (ambush)'], [T.ride + 0.5, 'leo', 'R', 'hands on the truck gun'],
  [W.admits + 0.6, 'max', 'R', 'salute at the brim'], [W.soldiers + 0.3, 'mia', 'R', 'farmer salute'],
]);
