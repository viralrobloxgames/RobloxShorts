// Accessory fit check: required before any full render of a clip that uses the Roblox pack (web/render.mjs enforces it).
//
//   node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js      check what that clip's characters wear
//   node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js --reviewed   after looking at the sheet, mark it reviewed
//   node web/fit_check.mjs --all [--out <dir>]                       every pack character with every pack accessory
//
// For each character + accessory it runs the same fitting as the clip (robloxPack.js fitAccessory), measures how far
// any hair/head surface pokes through the accessory, and renders front / three-quarter / side / back head close-ups.
// Writes <clip dir>/fit_check/<clip name>/fit_check.json and fit_sheet.png (one row per pair). Exit code 1 when any pair fails.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, newReportPath, fitFingerprint, usesPack } from './lib/fitgate.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip && !args.all) { console.error('Usage: node web/fit_check.mjs --clip <path from studio root> [--reviewed] | --all [--out <dir>]'); process.exit(2); }
const report = args.clip ? newReportPath(args.clip) : path.resolve(args.out || path.join(ROOT, 'assets/roblox_pack/fit_check'), 'fit_check.json');
const outDir = path.dirname(report);

if (args.reviewed) {
  const r = fs.existsSync(report) && JSON.parse(fs.readFileSync(report, 'utf8'));
  if (!r || r.fingerprint !== fitFingerprint(args.clip)) { console.error('No current fit check for this clip; run it first.'); process.exit(1); }
  if (!r.passed) { console.error('The fit check failed; fix the fits before marking it reviewed.'); process.exit(1); }
  r.reviewed = true; r.reviewedAt = new Date().toISOString();
  fs.writeFileSync(report, JSON.stringify(r, null, 2)); console.log('Marked reviewed:', path.relative(ROOT, report)); process.exit(0);
}
if (args.clip && !usesPack(args.clip)) { console.log('This clip does not use the Roblox pack; nothing to check.'); process.exit(0); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.obj': 'text/plain', '.mtl': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'],
});
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
const q = new URLSearchParams({ clip: 'web/fit_check_clip.js', scale: '1', ...(args.clip ? { target: args.clip } : { all: '1' }) });
await page.goto(`http://127.0.0.1:${server.address().port}/web/runner.html?${q}`);
await page.waitForFunction('window.ready === true', null, { timeout: 600000 });
const fit = await page.evaluate('window.fitReport');
const frames = await page.evaluate('window.fitFrames');

fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(path.join(outDir, 'views'), { recursive: true });
for (let f = 1; f <= frames; f++) {
  const url = await page.evaluate((n) => window.renderFrame(n), f);
  fs.writeFileSync(path.join(outDir, 'views', `view_${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close(); server.close();

const passed = fit.pairs.every((p) => p.passed);
const out = {
  clip: args.clip || null, generated: new Date().toISOString(), fingerprint: args.clip ? fitFingerprint(args.clip) : null,
  tolerance_studs: 0.02, passed, reviewed: false, wardrobe: fit.wardrobe, pairs: fit.pairs,
};
fs.writeFileSync(report, JSON.stringify(out, null, 2));

// Contact sheet: one row per pair, four views across.
if (frames) {
  try {
    execFileSync(process.env.FFMPEG || 'ffmpeg', ['-v', 'error', '-y', '-i', path.join(outDir, 'views', 'view_%04d.png'),
      '-vf', `tile=4x${frames / 4}:padding=4:color=white`, '-frames:v', '1', path.join(outDir, 'fit_sheet.png')]);
  } catch (e) { console.error('Could not build fit_sheet.png (ffmpeg):', e.message); }
}
for (const p of fit.pairs) console.log(`${p.passed ? 'PASS' : 'FAIL'}  ${p.character} + ${p.accessory}  (${p.mode}, x${p.scale}, depth ${p.depth}${p.hideHair ? ', hair hidden' : ''}${p.note ? ', ' + p.note : ''})`);
console.log(`${passed ? 'Fit check passed' : 'Fit check FAILED'}: ${fit.pairs.length} pair(s). Review ${path.relative(ROOT, path.join(outDir, 'fit_sheet.png'))}` +
  (args.clip && passed ? `, then: node web/fit_check.mjs --clip ${args.clip} --reviewed` : ''));
process.exit(passed ? 0 : 1);
