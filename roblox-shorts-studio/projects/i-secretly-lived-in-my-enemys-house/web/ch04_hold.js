// Hold check for Ch4: one close-up per held prop moment (cookie, the sandwich halves, the hand-off). See web/lib/holdcheck.js.
// The classroom is hidden (desks stand between any camera and a seated hand); only the holder and the props show.
// node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/ch04_hold.js --out /tmp/hold4 --frames 1-8 --scale 0.35 --skip-fit-check
import * as base from './ch04.js';
import * as K from './kit/index.js';
import { holdCheck } from '../../../web/lib/holdcheck.js';
const hc = holdCheck(base, base.HOLDS);
export const { meta, sky, setup, overlay } = hc;
export function update(t, stage) { hc.update(t, stage); K.getSet('classroom').group.visible = false; }
