// Hold check for Ch5: one close-up per held prop and moment (list in ch05.js HOLDS). Frame k shows entry k-1.
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch05_hold.js --out /tmp/hold5 --frames 1-13 --scale 0.35 --skip-fit-check
import * as base from './ch05.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
export const { meta, sky, setup, update, overlay } = holdCheck(base, base.HOLDS());
