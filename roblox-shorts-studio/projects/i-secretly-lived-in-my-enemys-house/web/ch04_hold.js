// Hold check for Ch4: one close-up per held prop moment (cookie, the sandwich halves, the hand-off). See web/lib/holdcheck.js.
import * as base from './ch04.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, base.HOLDS);
