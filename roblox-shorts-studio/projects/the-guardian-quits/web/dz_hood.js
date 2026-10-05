// Disguise comparison still (hood). Not part of the short.
import * as base from './guardian_clip.js';
export const meta = base.meta, sky = base.sky;
export async function setup(stage) { globalThis.DISGUISE = 'hood'; await base.setup(stage); }
export const update = base.update, overlay = base.overlay, samples = () => 1, shutter = () => 0;
