// Hold check for He Stole The Mona Lisa (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './mona_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [0.2, 'max', 'R', 'framed painting lifted off the pegs'], [1.0, 'max', 'R', 'framed painting turning'], [2.5, 'max', 'R', 'framed painting carried'],
  [T.walkOut + 0.6, 'max', 'R', 'framed painting walking'], [T.stair + 0.3, 'max', 'R', 'framed painting on the landing'],
  [T.dump + 0.3, 'max', 'R', 'bare panel'], [T.dump + 0.9, 'max', 'R', 'bare panel down the stairs'], [T.door + 0.6, 'max', 'R', 'bare panel at the door'],
  [T.open + 1.0, 'max', 'R', 'bare panel walking out'],
  [T.plumber + 0.6, 'noob', 'L', 'toolbox'], [T.open - 0.3, 'noob', 'R', 'key in the lock'],
  [T.morning + 0.6, 'leo', 'R', 'brush'],
  [W.report + 0.3, 'mia', 'R', 'pencil'],
  [T.papers + 0.6, 'folk0', 'L', 'newspaper'],
  [T.italy + 0.6, 'max', 'R', 'trunk carried'], [W.sell + 0.5, 'max', 'R', 'panel shown to the dealer'],
  [T.dealer + 0.6, 'leo', 'R', 'magnifier'], [T.calls + 0.8, 'leo', 'L', 'phone earpiece'],
  [T.today + 1.2, 'folk0', 'R', 'phone filming'], [T.today + 1.2, 'folk1', 'L', 'phone filming'],
]);
