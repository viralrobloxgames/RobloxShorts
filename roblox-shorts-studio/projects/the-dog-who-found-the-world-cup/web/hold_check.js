// Hold check for The Dog Who Found The World Cup (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './cup_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [1.0, 'max', 'L', 'lead (hook)'], [T.walk + 0.5, 'max', 'L', 'lead walking'],
  [T.bomb + 0.6, 'max', 'R', 'parcel at arm\'s length'], [T.tear + 0.6, 'max', 'R', 'torn parcel + trophy'], [T.names + 1.2, 'max', 'L', 'trophy'],
  [T.desk + 0.25, 'max', 'R', 'trophy carried in'], [T.desk + 1.8, 'max', 'R', 'trophy set on the desk'],
  [T.ransom + 1.2, 'leo', 'R', 'phone handset'],
  [T.handover + 0.6, 'noob', 'R', 'small parcel'], [T.handover + 1.6, 'mia', 'R', 'warrant card'],
  [T.stadium + 0.8, 'leo', 'R', 'trophy (captain)'], [T.stadium + 1.6, 'leo', 'L', 'trophy (captain)'],
]);
