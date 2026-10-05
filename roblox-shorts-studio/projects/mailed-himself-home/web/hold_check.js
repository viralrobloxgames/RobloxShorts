// Hold check for He Mailed Himself Home (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './mail_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [0.2, 'leo', 'R', 'hammer (hook)'], [W.nails + 0.1, 'leo', 'R', 'hammer swinging'], [W.nails + 0.25, 'leo', 'R', 'hammer striking'],
  [T.inside + 0.5, 'max', 'R', 'torch in the crate'], [T.bottles + 0.5, 'max', 'R', 'torch (bottles shot)'],
  [T.athlete + 0.2, 'max', 'R', 'javelin run-up'], [T.athlete + 0.45, 'max', 'R', 'javelin release'],
  [T.panics + 0.5, 'leo', 'L', 'phone handset to the ear'], [W.calls + 0.4, 'leo', 'L', 'handset talking'],
  [T.whole + 0.4, 'folk3', 'R', 'press camera'], [T.whole + 0.4, 'folk4', 'L', 'reporter notebook'], [T.whole + 0.4, 'folk5', 'R', 'press camera 2'],
  [T.airline + 0.3, 'skye', 'R', 'invoice in both hands'], [T.tear + 0.4, 'skye', 'R', 'invoice torn'],
]);
