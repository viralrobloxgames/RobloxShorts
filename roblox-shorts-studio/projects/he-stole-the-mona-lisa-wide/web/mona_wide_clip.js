// He Stole The Mona Lisa, landscape cut for YouTube long-form (1920x1080, 16:9: a vertical or square file up to three
// minutes is classed as a Short, and Shorts-feed views do not count towards watch hours). Same story, timing, cast and
// sets as ../../he-stole-the-mona-lisa/web/mona_clip.js; only the frame changes: every lens is narrowed (fovK) so the
// cast stays about the same size on screen while the picture shows twice the width, and the graphics move to the
// landscape frame (LAY, read by the base clip).
import * as base from '../../he-stole-the-mona-lisa/web/mona_clip.js';

Object.assign(base.LAY, {
  w: 1920, h: 1080, ox: 420, oy: -200, tagY: 70, fovK: 0.62, ext: 1.6, wide: true, cta: 'SUBSCRIBE', ctaColor: '#ff0000',
  cam: {},
});
export const meta = { ...base.meta, width: 1920, height: 1080 };
export const { sky, setup, samples, update, overlay, cast, TIMES, props, LAY } = base;
