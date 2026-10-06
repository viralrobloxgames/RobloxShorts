// Hold check for Ch2 (see web/lib/holdcheck.js): every held prop in close-up, one frame each.
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch02_hold.js --out /tmp/ch02_hold --frames 1-8 --scale 0.35 --skip-fit-check
import * as base from './ch02.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const { T, at } = base;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.kitchen() + 1.0, 'dad', 'R', 'spatula (cooking)', { dist: 1, side: 4.5, up: 1.5 }], [T.kitchen() + 1.0, 'dad', 'L', 'pan (cooking)', { dist: 1, side: -4.5, up: 1.5 }],
  [at(2, 1.5), 'dad', 'R', 'spatula (good morning)'], [at(9, 2.0), 'dad', 'R', 'spatula pointing at the stack', { up: 2.5 }],
  [T.slide() + 0.9, 'skye', 'R', 'pancake (hiding)', { dist: 4, up: 2.2 }], [at(14, 0.3), 'skye', 'R', 'pancake (back step)', { up: 2 }],
  [at(6, 0.3), 'lily', 'R', 'teddy', { dist: -3, side: -2, up: 2 }], [at(12, 0.5), 'lily', 'R', 'teddy (ghost x4)', { dist: -3, side: 2, up: 2 }],
]);
