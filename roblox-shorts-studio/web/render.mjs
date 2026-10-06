// Render a web clip to PNG frames with headless Chromium (software WebGL, no GPU needed).
//
//   node web/render.mjs --clip projects/<slug>/web/<clip>.js --out projects/<slug>/renders/web
//        [--frames 1-300 | --frames 1,45,90] [--every 10] [--scale 0.5] [--samples 8] [--workers 2] [--resume] [--no-skip]
//
// A frame whose fingerprint equals the previous frame's is copied, not rendered (see "Frame skip" below).
//
// A full render (no --frames / --every) of a clip that uses the Roblox pack needs a current, passing and reviewed
// accessory fit check first: node web/fit_check.mjs --clip <clip>. --skip-fit-check overrides (not for deliveries).
//
// Frames are written as web_0001.png ... so `studio.py finish <project> --encode --frames renders/web` can assemble them.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitGate, clipFiles } from './lib/fitgate.mjs';
import crypto from 'node:crypto';

const WEB = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(WEB);
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip || !args.out) { console.error('Usage: node web/render.mjs --clip <path from studio root> --out <dir> [--frames a-b|list] [--every n] [--scale s] [--samples n] [--workers n]'); process.exit(2); }
if (!args.frames && !args.every && !args['skip-fit-check']) {
  const why = fitGate(args.clip);
  if (why) { console.error(`Full render blocked: ${why}.\nRun: node web/fit_check.mjs --clip ${args.clip}`); process.exit(3); }
}
const out = path.resolve(args.out); fs.mkdirSync(out, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'],
});
const scale = Number(args.scale || 1);
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/web/runner.html?clip=${encodeURIComponent(args.clip)}&scale=${scale}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  return page;
}

const first = await openPage();
const meta = await first.evaluate('window.clipMeta');
const total = Math.round(meta.seconds * meta.fps);
let frames = [];
const spec = String(args.frames || `1-${total}`);
for (const part of spec.split(',')) {
  const [a, b] = part.split('-').map(Number);
  for (let f = a; f <= (b || a); f++) frames.push(f);
}
if (args.every) frames = frames.filter((f) => (f - 1) % Number(args.every) === 0);
// --resume: skip frames already written (lets a long render pick up where it stopped).
if (args.resume) frames = frames.filter((f) => !fs.existsSync(path.join(out, `web_${String(f).padStart(4, '0')}.png`)));

// Each written frame's fingerprint goes into <out>/frame_hashes.json, so web/changed_frames.mjs can later tell which frames
// an edit changed (full-quality renders only: not for --scale/--samples previews).
const record = !args.scale && !args.samples, hashFile = path.join(out, 'frame_hashes.json');
const saved = record && fs.existsSync(hashFile) ? JSON.parse(fs.readFileSync(hashFile, 'utf8')) : null;
const hashes = saved && saved.clip === args.clip ? saved.hashes : {};
// code: a fingerprint of everything the picture is computed from (the clip, its local imports such as the kit, the shared
// libs and the runner). finish_longform.py copies it into each segment's record and stitch_longform.py warns when the two
// segments of a chapter were rendered from different code (their seam can pop).
const codeHash = (() => { const h = crypto.createHash('sha256'); const libs = fs.readdirSync(path.join(WEB, 'lib')).filter((f) => /\.(js|mjs)$/.test(f)).sort().map((f) => path.join(WEB, 'lib', f));
  for (const f of [...clipFiles(args.clip).sort(), ...libs, path.join(WEB, 'runner.html')]) { h.update(path.relative(ROOT, f)); h.update(fs.readFileSync(f)); }
  const sets = path.join(path.dirname(path.resolve(ROOT, args.clip)), 'kit', 'sets');            // set modules load dynamically
  if (fs.existsSync(sets)) for (const f of fs.readdirSync(sets).sort()) { h.update(f); h.update(fs.readFileSync(path.join(sets, f))); }
  return h.digest('hex').slice(0, 12); })();
const flushHashes = () => { if (record) fs.writeFileSync(hashFile, JSON.stringify({ clip: args.clip, total, code: codeHash, hashes })); };
const workers = Math.max(1, Number(args.workers || 1));
const pages = [first, ...(await Promise.all(Array.from({ length: workers - 1 }, openPage)))];
const t0 = Date.now(); let done = 0, skipped = 0;
// Frame skip: when a frame's fingerprint (window.frameState: camera, every visible mesh/bone/light, materials and their
// textures, exposure, fog, sky, the overlay) equals the previous frame's, the previous PNG is copied instead of rendering.
// Each worker takes one contiguous run of frames so that held moments stay together. --no-skip turns it off.
const skip = !args['no-skip'];
const fileOf = (f) => path.join(out, `web_${String(f).padStart(4, '0')}.png`);
const prints = new Map(record ? Object.entries(hashes).map(([k, v]) => [Number(k), v]) : []);   // frame -> fingerprint (this run, or a resumed full render)
const per = Math.ceil(frames.length / pages.length);
const chunks = pages.map((_, i) => frames.slice(i * per, (i + 1) * per));
await Promise.all(pages.map(async (page, w) => {
  for (const f of chunks[w]) {
    const fp = (skip || record) ? await page.evaluate((f) => window.frameState(f), f) : null;
    const file = fileOf(f);
    if (skip && fp && prints.get(f - 1) === fp && fs.existsSync(fileOf(f - 1))) {
      fs.copyFileSync(fileOf(f - 1), file + '.part'); fs.renameSync(file + '.part', file); skipped++;
    } else {
      const url = await page.evaluate(([f, s]) => window.renderFrame(f, s ? { samples: s } : {}), [f, args.samples ? Number(args.samples) : 0]);
      fs.writeFileSync(file + '.part', Buffer.from(url.split(',')[1], 'base64')); fs.renameSync(file + '.part', file);
    }
    if (fp) prints.set(f, fp);
    if (record) hashes[f] = fp;
    done++; if (record && done % 50 === 0) flushHashes();
    if (done % 10 === 0 || done === frames.length) {
      const s = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames.length} frames (${skipped} copied), ${(s / done).toFixed(2)} s/frame, ~${Math.round((s / done) * (frames.length - done))} s left`);
    }
  }
}));
flushHashes();
await browser.close(); server.close();
const secs = (Date.now() - t0) / 1000;
console.log(`Wrote ${frames.length} frames to ${out} (${meta.seconds}s clip, ${total} frames total); ${skipped} copied (${(100 * skipped / Math.max(1, frames.length)).toFixed(1)}% skipped), ${(secs / Math.max(1, frames.length)).toFixed(2)} s/frame overall, ${(secs / Math.max(1, frames.length - skipped)).toFixed(2)} s per rendered frame`);
