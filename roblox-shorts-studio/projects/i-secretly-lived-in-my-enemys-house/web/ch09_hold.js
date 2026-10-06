// Hold check for ch09: one close-up per held prop moment (list: HOLDS in ch09.js).
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch09_hold.js --out /tmp/hold09 --frames 1-10 --scale 0.35 --skip-fit-check
import * as base from './ch09.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, base.HOLDS);
