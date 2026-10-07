// Seam check: does a frame pose the same when its page starts cold (a segment start or a render worker's chunk start)
// as when the page got there frame by frame? Lists the frames that differ, cold vs warm and pre-rolled vs warm.
//
//   node web/seam_check.mjs --clip projects/<slug>/web/chNN.js --range 785-1742 [--workers 4] [--preroll 300]
//        [--window n] [--root <studio root>] [--out file.json]
//
// Cold starts are the range start and each worker chunk start, chunked exactly as render.mjs does (contiguous chunks of
// ceil(n / workers)). "warm" = one page that posed every frame from 1 in order (the state a single sequential render
// has); "cold" = a fresh page that starts at the cold start (what render.mjs did before --preroll); with --preroll N also a
// fresh page that first poses the N frames before it. Each start is checked over its whole chunk (or --window frames). --root serves another
// checkout of roblox-shorts-studio (e.g. an older commit extracted elsewhere) instead of this one.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip || !args.range) { console.error('Usage: node web/seam_check.mjs --clip <clip> --range a-b [--workers 4] [--preroll 300] [--window 120] [--root dir] [--out file.json]'); process.exit(2); }
const ROOT = path.resolve(args.root || HERE), W = Number(args.workers || 4), N = args.preroll === undefined ? 0 : Number(args.preroll);
const [ra, rb] = String(args.range).split('-').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/web/runner.html?clip=${encodeURIComponent(args.clip)}&scale=0.1`);
  await page.waitForFunction('window.ready === true', null, { timeout: 240000 });
  return page;
}
const fp = (page, a, b) => page.evaluate(([a, b]) => { const o = {}; for (let f = a; f <= b; f++) o[f] = window.frameState(f); return o; }, [a, b]);
const pose = (page, a, b) => (b >= a ? page.evaluate(([a, b]) => { for (let f = a; f <= b; f++) window.frameState(f); }, [a, b]) : null);

const frames = []; for (let f = ra; f <= rb; f++) frames.push(f);
const per = Math.ceil(frames.length / W);
const starts = [...new Set(Array.from({ length: W }, (_, i) => frames[i * per]).filter(Boolean))];
// each start is checked over its whole chunk (up to the next start) unless --window limits it
const endOf = (s) => Math.min(rb, args.window ? s + Number(args.window) - 1 : (starts[starts.indexOf(s) + 1] ?? rb + 1) - 1);
const t0 = Date.now();
// warm: one page, every frame from 1 in order; keep the fingerprints of each window
const warmPage = await openPage(), warm = {};
let at = 1;
for (const s of starts) {
  const e = endOf(s);
  await pose(warmPage, at, s - 1); Object.assign(warm, await fp(warmPage, s, e)); at = e + 1;
}
await warmPage.close();
const report = [];
for (const s of starts) {
  const e = endOf(s);
  const cp = await openPage(); const cold = await fp(cp, s, e); await cp.close();
  let pre = null;
  if (N > 0 && s > 1) { const pp = await openPage(); await pose(pp, Math.max(1, s - N), s - 1); pre = await fp(pp, s, e); await pp.close(); }
  const diff = (x) => { if (!x) return null; const d = []; for (let f = s; f <= e; f++) if (x[f] !== warm[f]) d.push(f); return d; };
  const dc = diff(cold), dp = diff(pre);
  const ranges = (d) => { if (!d || !d.length) return []; const r = []; for (const f of d) { const l = r[r.length - 1]; if (l && f === l[1] + 1) l[1] = f; else r.push([f, f]); } return r.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)); };
  report.push({ start: s, window: `${s}-${e}`, cold_differs: dc.length, cold_frames: ranges(dc), cold_converged: !dc.length || dc[dc.length - 1] < e,
    preroll_differs: dp ? dp.length : 0, preroll_frames: ranges(dp), preroll_converged: !dp || !dp.length || dp[dp.length - 1] < e });
}
await browser.close(); server.close();
const out = { clip: args.clip, root: ROOT, range: `${ra}-${rb}`, workers: W, preroll: N, seconds: Math.round((Date.now() - t0) / 1000), starts: report };
if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1)); }
console.log(`${args.clip} ${ra}-${rb} (workers ${W}): ${report.length} cold starts, ${out.seconds} s`);
for (const r of report) console.log(`  start ${r.start}: cold differs on ${r.cold_differs} frames ${r.cold_frames.join(' ')}${r.cold_converged ? '' : ' (NOT converged in window)'}; preroll ${N}: ${r.preroll_differs}${r.preroll_frames.length ? ' ' + r.preroll_frames.join(' ') : ''}${r.preroll_converged ? '' : ' (NOT converged)'}`);
