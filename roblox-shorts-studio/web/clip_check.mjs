// Clipping detector: finds frames where a character's body goes through scenery (desks, banisters, the island, walls,
// furniture) or through another character, without rendering anything.
//
//   node web/clip_check.mjs --clip projects/<slug>/web/chNN.js [--every 2] [--frames 1-900] [--out <file.json>]
//        [--min-depth 0.06] [--all]        (--all: also report clipping the camera can't see: out of frame or behind scenery)
//
// Each sampled frame is posed exactly as for a render (clip.update + the scene's before-render hooks), then every visible
// actor body part (head, torso, arms, legs, as boxes shrunk by 0.14 studs so resting contact doesn't count) is tested
// against visible solid scene meshes and the other actors (web/lib/clipcheck_page.js). Results are merged into frame
// ranges per actor + part + object with the deepest penetration; film times come from delivery/stitch_report.json.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.dirname(WEB);
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip) { console.error('Usage: node web/clip_check.mjs --clip <clip> [--every 2] [--frames a-b] [--out file.json] [--min-depth 0.06] [--all]'); process.exit(2); }
const every = Number(args.every || 2), minDepth = Number(args['min-depth'] || 0.06);
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
const meta = await page.evaluate('window.clipMeta'), total = Math.round(meta.seconds * meta.fps);
const [fa, fb] = args.frames ? String(args.frames).split('-').map(Number) : [1, total];
const frames = []; for (let f = fa; f <= (fb || fa); f += every) frames.push(f);
const t0 = Date.now(), per = {};
for (let i = 0; i < frames.length; i += 40) {
  const batch = frames.slice(i, i + 40);
  Object.assign(per, await page.evaluate(([fs_, md]) => { const o = {}; for (const f of fs_) o[f] = window.__cc.checkFrame(f, { minDepth: md }); return o; }, [batch, minDepth]));
}
await browser.close(); server.close();

// ---- merge into ranges
const fps = meta.fps, chm = path.basename(args.clip).match(/ch(\d+)/), ch = chm ? Number(chm[1]) : null;
let filmStart = null;
const rep = path.join(path.dirname(path.dirname(path.resolve(ROOT, args.clip))), 'delivery', 'stitch_report.json');
if (ch && fs.existsSync(rep)) { const r = JSON.parse(fs.readFileSync(rep, 'utf8')); filmStart = r.chapter_starts?.[`ch${String(ch).padStart(2, '0')}`]?.s ?? null; }
const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const open = new Map(), ranges = [];
for (const f of frames) {
  const seen = new Set();
  for (const h of per[f] || []) {
    if (!args.all && !h.onscreen) continue;
    const k = `${h.actor}|${h.part}|${h.object}`; seen.add(k);
    const r = open.get(k);
    if (r && f - r.to <= every) { r.to = f; r.depth = Math.max(r.depth, h.depth); r.cover = Math.max(r.cover, h.cover); r.samples++; }
    else { const n = { actor: h.actor, part: h.part, object: h.object, from: f, to: f, depth: h.depth, cover: h.cover, samples: 1 }; open.set(k, n); ranges.push(n); }
  }
}
for (const r of ranges) {
  r.t = `${((r.from - 1) / fps).toFixed(2)}-${((r.to - 1) / fps).toFixed(2)}s`;
  if (filmStart !== null) r.film = mmss(filmStart + (r.from - 1) / fps);
  r.kind = /^(skye|max|dad|lily|extra\d+)\./.test(r.object) ? 'actor' : 'scenery';
}
ranges.sort((a, b) => b.depth * Math.min(b.to - b.from + every, 60) - a.depth * Math.min(a.to - a.from + every, 60));
// group by actor + object (all parts) for the summary
const groups = new Map();
for (const r of ranges) {
  const k = `${r.actor}|${r.object}|${Math.floor(r.from / 60)}`;
  const g = groups.get(k) || { actor: r.actor, object: r.object, from: r.from, to: r.to, depth: 0, cover: 0, parts: new Set(), film: r.film, kind: r.kind };
  g.from = Math.min(g.from, r.from); g.to = Math.max(g.to, r.to); g.depth = Math.max(g.depth, r.depth); g.cover = Math.max(g.cover, r.cover); g.parts.add(r.part); groups.set(k, g);
}
const score = (g) => g.depth * (0.4 + g.cover / 100) * Math.min(1, 0.3 + (g.to - g.from) / 30);
const top = [...groups.values()].filter((g) => g.depth >= 0.15 || g.cover >= 15 || g.to - g.from >= 6).sort((a, b) => score(b) - score(a));
const out = {
  clip: args.clip, chapter: ch, frames_total: total, every, sampled: frames.length, min_depth: minDepth, onscreen_only: !args.all,
  film_start_s: filmStart, seconds: Math.round((Date.now() - t0) / 100) / 10,
  summary: top.map((g) => ({ actor: g.actor, object: g.object, kind: g.kind, frames: `${g.from}-${g.to}`, t: `${((g.from - 1) / fps).toFixed(1)}-${((g.to - 1) / fps).toFixed(1)}s`, film: filmStart !== null ? mmss(filmStart + (g.from - 1) / fps) : undefined, parts: [...g.parts].join(','), max_depth: g.depth, max_cover_pct: g.cover, severity: (g.depth >= 0.4 && g.cover >= 15) || g.depth >= 0.6 ? 'high' : g.depth >= 0.25 || g.cover >= 15 ? 'medium' : 'low' })),
  ranges,
};
if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1)); }
const sev = (x) => out.summary.filter((g) => g.severity === x).length;
console.log(`${args.clip}: ${frames.length} frames checked in ${out.seconds} s; ${ranges.length} ranges; notable: ${sev('high')} high, ${sev('medium')} medium, ${sev('low')} low`);
for (const g of out.summary.slice(0, Number(args.top ?? 25))) console.log(`  ${g.severity.padEnd(6)} ${g.film ? g.film + '  ' : ''}${g.t.padEnd(12)} ${g.actor.padEnd(7)} ${g.parts.padEnd(28)} in ${g.object}  depth ${g.max_depth} cover ${g.max_cover_pct}%`);
