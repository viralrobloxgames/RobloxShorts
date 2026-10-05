// Hold check for He Traded A Paperclip For A House (see web/lib/holdcheck.js): every held prop in close-up.
import * as base from './paperclip_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const SW = [W.fish + 0.05, W.knob1 + 0.05, W.stove1 + 0.05, W.generator + 0.05];
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [2.0, 'max', 'R', 'paperclip shown to camera'], [7.6, 'max', 'R', 'paperclip walking'],
  [SW[0] - 0.4, 'max', 'R', 'paperclip offered'], [SW[0] - 0.4, 'mia', 'L', 'fish pen offered'], [SW[0] + 0.9, 'mia', 'L', 'paperclip (Mia going home)'],
  [SW[0] + 0.9, 'max', 'R', 'fish pen walking'], [SW[1] - 0.4, 'leo', 'L', 'doorknob offered'], [SW[1] + 0.8, 'max', 'R', 'doorknob'],
  [SW[2] - 0.4, 'skye', 'R', 'camp stove carried (Skye)'], [SW[2] + 0.9, 'max', 'R', 'camp stove carried (Max)'],
  [SW[3] - 0.4, 'noob', 'R', 'generator carried (Noob)'], [SW[3] + 0.9, 'max', 'R', 'generator carried (Max)'], [SW[3] + 0.9, 'noob', 'R', 'stove carried (Noob)'],
  [W.trip + 0.5, 'max', 'R', 'ticket'], [W.record + 0.5, 'max', 'R', 'gold record'], [W.rent + 0.6, 'max', 'R', 'rent key'], [T.passIn + 0.6, 'max', 'R', 'VIP pass'],
  [T.globe - 0.45, 'max', 'R', 'pass offered'], [T.globe - 0.45, 'skye', 'L', 'snow globe offered'], [T.globe + 0.9, 'max', 'R', 'snow globe'],
  [W.dumbest, 'max', 'R', 'snow globe (shrug)'], [T.people + 0.7, 'skye', 'L', 'pass (Skye leaving)'],
  [T.want + 0.6, 'max', 'R', 'globe shown to Leo'], [T.so + 0.6, 'leo', 'L', 'clapperboard offered'], [T.role + 1.1, 'leo', 'L', 'globe (Leo)'], [T.role + 1.1, 'max', 'R', 'clapperboard (Max)'],
  [T.tiny + 1.4, 'max', 'R', 'clapperboard walking'], [W.auditions + 0.3, 'max', 'R', 'clapperboard up'],
  [T.house - 0.4, 'noob', 'L', 'house key offered'], [T.house + 0.7, 'noob', 'L', 'clapperboard (mayor)'], [T.house + 1.5, 'max', 'R', 'house key up'], [T.final + 1.5, 'max', 'R', 'house key on porch'],
]);
