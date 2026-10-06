// Camera continuity check: every frame of a clip (no rendering), flags
//   glide   - the camera travels more than --glide studs/frame for 2+ frames in a row (a shot change that interpolates
//             instead of cutting, or a camera orbiting a turning actor), not a single-frame cut;
//   inside  - the camera sits inside solid scenery;
//   head    - the camera is inside or within 0.25 studs of a character's head.
//   node web/cam_check.mjs --clip projects/<slug>/web/chNN.js [--glide 0.6] [--out file.json]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const WEB = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(WEB);
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip) { console.error('Usage: node web/cam_check.mjs --clip <clip> [--glide 0.6] [--out file.json]'); process.exit(2); }
const GLIDE = Number(args.glide || 0.6);
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
await page.waitForFunction('window.ready === true', null, { timeout: 240000 });
await page.evaluate(async () => { window.__cc = await import('/web/lib/clipcheck_page.js'); });
const meta = await page.evaluate('window.clipMeta'), total = Math.round(meta.seconds * meta.fps), cams = {};
for (let f = 1; f <= total; f += 60) Object.assign(cams, await page.evaluate(([a, b]) => { const o = {}; for (let f = a; f <= b; f++) o[f] = window.__cc.checkCamera(f); return o; }, [f, Math.min(total, f + 59)]));
await browser.close(); server.close();
const fps = meta.fps, chm = path.basename(args.clip).match(/ch(\d+)/), ch = chm ? Number(chm[1]) : null;
let filmStart = null;
const rep = path.join(path.dirname(path.dirname(path.resolve(ROOT, args.clip))), 'delivery', 'stitch_report.json');
if (ch && fs.existsSync(rep)) filmStart = JSON.parse(fs.readFileSync(rep, 'utf8')).chapter_starts?.[`ch${String(ch).padStart(2, '0')}`]?.s ?? null;
const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const flags = [];
const push = (kind, f, info) => { const l = flags[flags.length - 1]; if (l && l.kind === kind && f - l.to <= 1 && l.info === info) { l.to = f; return; } flags.push({ kind, from: f, to: f, info }); };
for (let f = 2; f <= total; f++) {
  const c = cams[f], step = dist(c.pos, cams[f - 1].pos), next = f < total ? dist(cams[f + 1].pos, c.pos) : 0;
  if (step > GLIDE && next > GLIDE) push('glide', f, '');              // moving fast on two frames in a row: not a cut
  if (c.inside) push('inside', f, c.inside);
  if (c.headDist < 0.25) push('head', f, c.head);
}
for (const x of flags) { x.t = `${((x.from - 1) / fps).toFixed(2)}-${((x.to - 1) / fps).toFixed(2)}s`; if (filmStart !== null) x.film = mmss(filmStart + (x.from - 1) / fps); x.frames = x.to - x.from + 1; }
const glides = flags.filter((x) => x.kind === 'glide');
for (const g of glides) g.info = `${dist(cams[g.from - 1].pos, cams[g.to].pos).toFixed(1)} studs over ${g.frames + 1} frames`;
const out = { clip: args.clip, chapter: ch, frames: total, glide_threshold: GLIDE, flags };
if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1)); }
console.log(`${args.clip}: ${total} frames; ${glides.length} glides, ${flags.filter((x) => x.kind === 'inside').length} inside scenery, ${flags.filter((x) => x.kind === 'head').length} at a head`);
for (const x of flags) console.log(`  ${x.kind.padEnd(6)} ${(x.film || '').padEnd(8)} ${x.t.padEnd(12)} f${x.from}-${x.to}  ${x.info}`);
