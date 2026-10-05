// Patch helper (not part of the short): renders only the band y 180-420 of each frame of egg_clip.js at full resolution,
// overlay included, so a HUD change in that band can be pasted into already-rendered frames (see source/patch_strip.py).
import * as base from './egg_clip.js';
export const Y0 = 180, H = 240;
export const meta = { ...base.meta, width: 1080, height: H };
export const sky = base.sky;
export async function setup(stage) { await base.setup(stage); }
export function samples() { return 1; }
export function shutter() { return 0; }
export function update(t, stage) {
  base.update(t, stage);
  const c = stage.camera; globalThis.__stripCam = c; c.aspect = 1080 / 1920; c.setViewOffset(1080, 1920, 0, Y0, 1080, H); c.updateProjectionMatrix();
}
export function overlay(g, s, t) {
  // The overlay projects 3D points, so draw it with the full-frame projection.
  const cam = globalThis.__stripCam; if (cam) { cam.clearViewOffset(); cam.updateProjectionMatrix(); }
  g.save(); g.translate(0, -Y0 * s); base.overlay(g, s, t); g.restore();
}
