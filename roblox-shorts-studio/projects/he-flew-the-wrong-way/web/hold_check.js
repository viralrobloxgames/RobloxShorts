// Hold check for He Flew The Wrong Way (see web/lib/holdcheck.js). Held props: Max's screwdriver in the cockpit (raised,
// first jab on the floor, second jab), Mia's rubber stamp (held over the form, raised, on the form), and the telegram
// (both of Max's hands on its top edge). Camera in front and to the holder's left (the cockpit's open side).
import * as base from './wrongway_clip.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
import { W } from './beats.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.screw + 0.25, 'max', 'R', 'screwdriver raised'], [T.screw + 0.55, 'max', 'R', 'screwdriver jab 1 (tip on the floor)'],
  [T.screw + 1.05, 'max', 'R', 'screwdriver jab 2'], [T.ask + 0.5, 'mia', 'R', 'stamp held over the form'],
  [W.no1 - 0.55 + 0.4, 'mia', 'R', 'stamp raised'], [W.no1 - 0.55 + 0.7, 'mia', 'R', 'stamp on the form (DENIED)'],
  [W.california2 + 0.2, 'mia', 'R', 'stamp on the form (APPROVED)'],
  [T.telegram + 1.2, 'max', 'R', 'telegram, right hand'], [T.telegram + 1.2, 'max', 'L', 'telegram, left hand'],
], { dist: 4.0, side: -2.5, up: 1.0 });
