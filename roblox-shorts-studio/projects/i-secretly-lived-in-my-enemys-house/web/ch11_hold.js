// Hold check for Ch11: one close-up per held prop and moment (web/lib/holdcheck.js). Frame k shows entry k-1.
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch11_hold.js --out <dir> --frames 1-12 --scale 0.35 --skip-fit-check
import * as base from './ch11.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const K = base.KEY;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [K.morning, 'dad', 'R', 'spatula'], [K.thief, 'dad', 'R', 'spatula (pointing)'], [K.phone, 'dad', 'R', 'spatula (pointing)'],
  [K.flip, 'dad', 'R', 'spatula (flip)'], [K.end, 'dad', 'R', 'spatula (end screen)'],
  [K.mom, 'skye', 'R', 'phone at ear'],
  [K.knew, 'lily', 'R', 'teddy'], [K.says, 'lily', 'R', 'teddy (pointing)'], [K.wide, 'lily', 'R', 'teddy (wide)'],
  [K.wide, 'max', 'R', 'plate slide'],
]);
