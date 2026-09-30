// Accessory fit gate shared by web/fit_check.mjs (writes the report) and web/render.mjs (refuses full renders without it).
// The report is tied to a fingerprint of the clip file, the fitting code and the pack catalog, so any edit to those
// needs a fresh fit check before the next full render.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const ROOT = path.dirname(WEB);

export const usesPack = (clip) => fs.readFileSync(path.resolve(ROOT, clip), 'utf8').includes('robloxPack.js');
export const reportPath = (clip) => path.join(path.dirname(path.resolve(ROOT, clip)), 'fit_check', 'fit_check.json');

export function fitFingerprint(clip) {
  const h = crypto.createHash('sha256');
  for (const f of [path.resolve(ROOT, clip), path.join(WEB, 'lib/robloxPack.js'), path.join(WEB, 'fit_check_clip.js'), path.join(ROOT, 'assets/roblox_pack/catalog.json')]) {
    h.update(f.slice(ROOT.length)); h.update(fs.readFileSync(f));
  }
  return h.digest('hex').slice(0, 16);
}

// Returns null when the clip may be fully rendered, otherwise the reason it may not.
export function fitGate(clip) {
  if (!usesPack(clip)) return null;
  const p = reportPath(clip);
  if (!fs.existsSync(p)) return `no fit check found (${path.relative(ROOT, p)})`;
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (r.fingerprint !== fitFingerprint(clip)) return 'the clip, the fitting code or the pack changed since the last fit check';
  if (!r.passed) return `the last fit check failed: ${r.pairs.filter((x) => !x.passed).map((x) => `${x.character} + ${x.accessory}`).join(', ')}`;
  if (!r.reviewed) return `the fit sheet has not been marked as reviewed (look at ${path.relative(ROOT, path.join(path.dirname(p), 'fit_sheet.png'))}, then run fit_check.mjs --clip ${clip} --reviewed)`;
  return null;
}
