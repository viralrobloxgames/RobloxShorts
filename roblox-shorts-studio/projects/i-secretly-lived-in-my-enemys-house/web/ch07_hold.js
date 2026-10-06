// Ch7 hold check: one close-up per held prop and moment (render every frame, look at each one before the full render).
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch07_hold.js --out /tmp/hold7 --frames 1-6 --scale 0.35 --skip-fit-check
import * as base from './ch07.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const T = base.HOLD_TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [2.0, 'lily', 'R', 'teddy (kneeling at the tea box)', { dist: 3.2, side: 0.6, up: 0.9 }],
  [T.goDecor + 0.4, 'lily', 'R', 'teddy (running)', { dist: 3.5, side: 0.8, up: 0.8 }],
  [T.jam - 0.15, 'lily', 'L', 'pumpkin bucket (reaching up to Skye)', { dist: 1.6, side: 2.6, up: 1.2 }],
  [T.jam - 0.15, 'lily', 'R', 'teddy (hop)', { dist: 3.2, side: 1.2, up: 0.6 }],
  [T.lilyCome + 2.5, 'lily', 'R', 'teddy (beside Skye, end)'],
  [T.nozzle + 0.6, 'dad', 'R', 'vacuum nozzle (raised at her face)', { dist: 2.0, side: 1.0, up: 0.5 }],
]);
