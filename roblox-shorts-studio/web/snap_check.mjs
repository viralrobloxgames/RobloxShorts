// Snap check: one-frame jumps inside a shot. Poses every frame of a clip in order from frame 1 (no drawing; the same
// history as a pre-rolled render) and compares each frame with the one before:
//   limb   - a bone (torso, head, arms, legs) turns more than --angle degrees (default 25) in one frame;
//   root   - an actor's velocity changes by more than --move studs/frame (default 0.3): starts and stops, not a steady walk;
//   jump   - an actor moves more than --jump studs (default 3) in one frame (a teleport inside the shot); moves over 50
//            studs are set changes and are skipped;
//   prop   - a prop (held or loose) changes velocity by more than --move studs/frame (pops between hand and elbow,
//            a prop leaping into a hand), or appears / disappears while its holder stays in frame (--pops);
// skipping frames where the camera cuts (moves more than --cut studs or turns more than 10 degrees in one frame) and
// actors / props that are off camera on either frame (--all reports them too).
//   node web/snap_check.mjs --clip projects/<slug>/web/chNN.js [--root <studio root>] [--out file.json]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : a), []));
if (!args.clip) { console.error('Usage: node web/snap_check.mjs --clip <clip> [--root dir] [--angle 25] [--move 0.3] [--cut 0.5] [--out file.json]'); process.exit(2); }
const ROOT = path.resolve(args.root || HERE), ANGLE = Number(args.angle || 25), MOVE = Number(args.move || 0.3), CUT = Number(args.cut || 0.5), JUMP = Number(args.jump || 3);
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
const meta = await page.evaluate('window.clipMeta'), total = Math.round(meta.seconds * meta.fps), S = {};
for (let f = 1; f <= total; f += 60) Object.assign(S, await page.evaluate(([a, b]) => { const o = {}; for (let f = a; f <= b; f++) { window.frameState(f); o[f] = window.__cc.snapState(f); } return o; }, [f, Math.min(total, f + 59)]));
await browser.close(); server.close();

const fps = meta.fps, chm = path.basename(args.clip).match(/ch(\d+)/), ch = chm ? Number(chm[1]) : null;
let filmStart = null;
const rep = path.join(HERE, path.dirname(path.dirname(args.clip)), 'delivery', 'stitch_report.json');
if (ch && fs.existsSync(rep)) filmStart = JSON.parse(fs.readFileSync(rep, 'utf8')).chapter_starts?.[`ch${String(ch).padStart(2, '0')}`]?.s ?? null;
const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (v) => Math.hypot(v[0], v[1], v[2]);
const qAngle = (a, b) => { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return (2 * Math.acos(Math.min(1, d)) * 180) / Math.PI; };
const isCut = (f) => { const a = S[f - 1].cam, b = S[f].cam; const turn = (Math.acos(Math.max(-1, Math.min(1, a[1][0] * b[1][0] + a[1][1] * b[1][1] + a[1][2] * b[1][2]))) * 180) / Math.PI; return len(sub(b[0], a[0])) > CUT || turn > 10; };
const flags = [];
const add = (f, kind, who, part, delta, note = '') => flags.push({ frame: f, t: +((f - 1) / fps).toFixed(2), film: filmStart !== null ? mmss(filmStart + (f - 1) / fps) : undefined, kind, actor: who, part, delta: +delta.toFixed(2), note });
for (let f = 2; f <= total; f++) {
  if (isCut(f)) continue;
  const A = S[f - 1], B = S[f];
  for (const [who, b] of Object.entries(B.actors)) {
    const a = A.actors[who]; if (!a) continue;                 // just appeared (an entrance or a set change)
    if (!args.all && !(a.on && b.on)) continue;               // off camera on either frame
    const mv = len(sub(b.root, a.root));
    if (mv > 50) continue;                                    // a set change (sets are 300 studs apart)
    if (mv > JUMP) { add(f, 'jump', who, 'root', mv, 'studs in one frame (teleport)'); continue; }
    for (const [bone, q] of Object.entries(b.bones)) { if (!a.bones[bone]) continue; const d = qAngle(a.bones[bone], q); if (d > ANGLE) add(f, 'limb', who, bone, d, 'degrees'); }
    const v1 = sub(b.root, a.root), z = S[f - 2]?.actors[who], v0 = z && len(sub(a.root, z.root)) <= JUMP ? sub(a.root, z.root) : [0, 0, 0], dv = len(sub(v1, v0));
    if (dv > MOVE) add(f, 'root', who, 'root', dv, `studs/frame change (moved ${len(v1).toFixed(2)})`);
  }
  for (const [id, b] of Object.entries(B.props)) {
    const a = A.props[id], z = S[f - 2]?.props[id];
    if (a && !args.all && !(a.on && b.on)) continue;
    if (a && len(sub(b.pos, a.pos)) > 50) continue;            // carried through a set change
    if (!a) { if (b.on && b.holder && A.actors[b.holder] && args.pops) add(f, 'prop', b.holder, id.split('#')[0], 0, 'appears'); continue; }
    if (a.holder !== b.holder) { add(f, 'prop', b.holder || a.holder || '-', id.split('#')[0], len(sub(b.pos, a.pos)), `changes holder ${a.holder || 'none'} -> ${b.holder || 'none'}`); continue; }
    const v1 = sub(b.pos, a.pos), v0 = z && len(sub(a.pos, z.pos)) <= 50 ? sub(a.pos, z.pos) : [0, 0, 0], dv = len(sub(v1, v0));
    if (dv > MOVE) add(f, 'prop', b.holder || '-', id.split('#')[0], dv, `studs/frame change (moved ${len(v1).toFixed(2)})`);
  }
  if (args.pops) for (const [id, a] of Object.entries(A.props)) if (!B.props[id] && a.on && a.holder && B.actors[a.holder]) add(f, 'prop', a.holder, id.split('#')[0], 0, 'disappears');
}
// group: the same actor + kind on frames within 2 of each other count as one event (all limbs that pop together = one
// pose snap); severity high = a limb over 60 degrees, a teleport, a prop or root jump over 1 stud, a prop changing holder over 1 stud
const events = [];
for (const x of flags) {
  const key = x.kind === 'prop' ? x.part : '';
  const l = events.find((e) => e.actor === x.actor && e.kind === x.kind && e.key === key && x.frame - e.to <= 2);
  if (l) { l.to = x.frame; l.max = Math.max(l.max, x.delta); l.n++; if (!l.parts.includes(x.part)) l.parts.push(x.part); if (x.delta >= l.max) l.note = x.note; }
  else events.push({ ...x, key, parts: [x.part], from: x.frame, to: x.frame, max: x.delta, n: 1 });
}
for (const e of events) { e.part = e.parts.join(' '); e.severity = (e.kind === 'limb' ? e.max > 60 : e.kind === 'jump' || e.max > 1) ? 'high' : 'low'; delete e.parts; delete e.key; }
const out = { clip: args.clip, chapter: ch, frames: total, thresholds: { angle_deg: ANGLE, move_studs_per_frame: MOVE, cut_studs: CUT, jump_studs: JUMP }, events: events.map(({ frame, delta, ...e }) => e), flags };
if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1)); }
console.log(`${args.clip}: ${total} frames; ${events.length} snap events (${events.filter((e) => e.severity === 'high').length} high; ${flags.length} flags)`);
for (const e of events) console.log(`  ${(e.film || '').padEnd(9)} f${e.from}${e.to !== e.from ? '-' + e.to : ''}  ${e.severity.padEnd(4)} ${e.kind.padEnd(4)} ${String(e.actor).padEnd(7)} ${e.part.padEnd(24)} ${e.max} ${e.note}`);
