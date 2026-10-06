// Ch1 hold check: every held prop at its moments (frame k = entry k-1).
//   node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch01_hold.js --out /tmp/h1 --frames 1-6 --scale 0.35 --skip-fit-check
import * as base from './ch01.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const T = base.TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [0.3, 'max', 'R', 'flashlight walking at the closet', { side: 2.5 }],
  [T.doorOpen + 0.3, 'max', 'R', 'flashlight sweeping the hoodies', { side: 3.5, dist: 3.5, up: 0.4 }],
  [T.doorShut + 0.6, 'max', 'R', 'flashlight walking back to bed', { side: 2.5 }],
  [T.spider - 0.3, 'max', 'R', 'rubber spider over the lunchbox'],
  [T.jump + 3.2, 'max', 'R', "spider held up: It's rubber"],
]);
