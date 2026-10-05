// Which frames did an edit change? Re-render only those.
//
//   node web/changed_frames.mjs --clip <clip> --out <render dir>            list the changed frames (no rendering)
//   node web/changed_frames.mjs --clip <clip> --out <render dir> --delete   ...and delete their PNGs (refuses when every
//     frame changed, which points at a fingerprint problem rather than an edit; --force overrides), then:
//   node web/render.mjs --clip <clip> --out <render dir> --workers 3 --resume   renders just those
//   node web/changed_frames.mjs --clip <clip> --out <render dir> --save     record the current clip as what's rendered
//
// Each frame gets a fingerprint of everything that decides its picture (window.frameState in runner.html: the camera,
// every visible mesh's transform/shape/material, skinned bones, lights, fog, bloom, samples/shutter and the overlay).
// render.mjs saves the fingerprint of every frame it writes into <out>/frame_hashes.json; this compares the clip as it is
// now against that file. It takes about a minute for a 60 s clip, versus hours to re-render everything.
// Frames with no saved fingerprint count as changed, so the first run after an old render re-renders everything (use
// --save right after a full render made before this tool existed, if you know the PNGs match the clip).
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(WEB);
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip || !args.out) { console.error('Usage: node web/changed_frames.mjs --clip <clip> --out <render dir> [--delete | --save]'); process.exit(2); }
const out = path.resolve(args.out), hashFile = path.join(out, 'frame_hashes.json');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/web/runner.html?clip=${encodeURIComponent(args.clip)}&scale=0.1`);
await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
const meta = await page.evaluate('window.clipMeta'), total = Math.round(meta.seconds * meta.fps);
const t0 = Date.now();
const now = await page.evaluate((n) => { const h = {}; for (let f = 1; f <= n; f++) h[f] = window.frameState(f); return h; }, total);
await browser.close(); server.close();
console.log(`fingerprinted ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (args.save) { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(hashFile, JSON.stringify({ clip: args.clip, total, hashes: now })); console.log(`saved ${hashFile}`); process.exit(0); }
const saved = fs.existsSync(hashFile) ? JSON.parse(fs.readFileSync(hashFile, 'utf8')) : { hashes: {} };
const png = (f) => path.join(out, `web_${String(f).padStart(4, '0')}.png`);
const changed = [];
for (let f = 1; f <= total; f++) if (saved.hashes[f] !== now[f] || !fs.existsSync(png(f))) changed.push(f);
const extra = fs.existsSync(out) ? fs.readdirSync(out).filter((n) => /^web_\d+\.png$/.test(n) && Number(n.slice(4, -4)) > total) : [];
const ranges = []; for (const f of changed) { const r = ranges[ranges.length - 1]; if (r && f === r[1] + 1) r[1] = f; else ranges.push([f, f]); }
const fps = meta.fps, fmt = (f) => ((f - 1) / fps).toFixed(2);
console.log(`${changed.length} of ${total} frames changed${extra.length ? `, ${extra.length} past the new end` : ''}:`);
for (const [a, b] of ranges) console.log(`  ${a}-${b}  (${fmt(a)}-${fmt(b)} s)`);
if (args.delete && Object.keys(saved.hashes).length && changed.length === total && !args.force) {
  // Every frame changed although fingerprints exist: far more likely a fingerprint bug or the wrong --out than a real
  // edit (moving one title card changes ~100 frames). Deleting would throw away the whole render, so ask for --force.
  console.error('Refusing to delete: every frame changed. Check the clip and --out (or pass --force if you really edited every frame).');
  process.exit(4);
}
if (args.delete) {
  for (const f of changed) fs.rmSync(png(f), { force: true });
  for (const n of extra) fs.rmSync(path.join(out, n), { force: true });
  console.log(`deleted ${changed.length + extra.length} PNGs; now run render.mjs with --resume`);
}
