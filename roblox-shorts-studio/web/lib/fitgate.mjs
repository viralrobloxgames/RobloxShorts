// Accessory fit gate shared by web/fit_check.mjs (writes the report) and web/render.mjs (refuses full renders without it).
// The report is tied to a fingerprint of the clip file, the fitting code and the pack catalog, so any edit to those
// needs a fresh fit check before the next full render.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const ROOT = path.dirname(WEB);

// The clip and every local module it imports (static relative imports, followed recursively): a chapter that gets its
// cast through a shared kit (kit/index.js -> kit/cast.js -> robloxPack.js) counts as using the pack, and edits to the kit
// invalidate its fit check.
export function clipFiles(clip) {
  const seen = new Set(), todo = [path.resolve(ROOT, clip)];
  while (todo.length) {
    const f = todo.pop(); if (seen.has(f) || !fs.existsSync(f)) continue; seen.add(f);
    if (f.startsWith(path.join(WEB, 'lib') + path.sep)) continue;             // the shared libs are fingerprinted below
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(path.resolve(path.dirname(f), m[1]));
  }
  return [...seen];
}
export const usesPack = (clip) => clipFiles(clip).some((f) => fs.readFileSync(f, 'utf8').includes('robloxPack.js'));
// One report per clip: <clip dir>/fit_check/<clip name>/fit_check.json (several clips share a folder, e.g. eleven
// chapters). A report written before this change at <clip dir>/fit_check/fit_check.json is still read when no per-clip
// one exists.
export const newReportPath = (clip) => { const c = path.resolve(ROOT, clip); return path.join(path.dirname(c), 'fit_check', path.basename(c, path.extname(c)), 'fit_check.json'); };
export const reportPath = (clip) => {
  const p = newReportPath(clip), legacy = path.join(path.dirname(path.resolve(ROOT, clip)), 'fit_check', 'fit_check.json');
  return fs.existsSync(p) || !fs.existsSync(legacy) ? p : legacy;
};

export function fitFingerprint(clip) {
  const h = crypto.createHash('sha256');
  for (const f of [...clipFiles(clip).sort(), path.join(WEB, 'lib/robloxPack.js'), path.join(WEB, 'fit_check_clip.js'), path.join(ROOT, 'assets/roblox_pack/catalog.json')]) {
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
