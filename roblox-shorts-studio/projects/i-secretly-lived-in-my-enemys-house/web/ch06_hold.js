// Ch6 hold check: one close-up per held prop and moment (render every frame, look at each one before the full render).
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch06_hold.js --out /tmp/hold6 --frames 1-10 --scale 0.35 --skip-fit-check
import * as base from './ch06.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const T = base.HOLD_TIMES;
export const { meta, sky, setup, update, overlay } = holdCheck(base, [
  [T.creep, 'skye', 'R', 'flashlight (lit, under her chin)'],
  [T.listen, 'skye', 'R', 'flashlight (at the door)'],
  [T.lowered, 'skye', 'R', 'flashlight (lowered)'],
  [T.lily, 'lily', 'R', 'teddy'],
  [T.closet, 'lily', 'R', 'teddy (closet)'],
  [T.dadWalk, 'dad', 'R', 'broom (sword)'],
  [T.dadWalk, 'dad', 'L', 'flashlight (forward)'],
  [T.line, 'dad', 'R', 'broom (raised, draw the line)'],
  [T.hatch, 'dad', 'R', 'broom (at the hatch)'],
  [T.hatch, 'dad', 'L', 'flashlight (up at the hatch)'],
]);
