// The 3 s 16:9 pipeline proof: the chapter template from 5.0 s to 8.0 s (Max's line ends, a silent hold, Skye's whispered
// line, the cut to the classroom). Rendered, encoded as two segments with finish_longform.py and stitched with
// stitch_longform.py (production/status/kit-pipeline.md has the numbers).
import * as T from './ch_template.js';
const OFF = 5.0;
export const meta = { ...T.meta, seconds: 3 };
export const sky = T.sky;
export const samples = T.samples;
export const setup = T.setup;
export const update = (t, stage) => T.update(t + OFF, stage);
export const overlay = (g, s, t) => T.overlay(g, s, t + OFF);
