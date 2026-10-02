// Screenshot a source page for a ViralRoblox News evidence shot.
//
//   node web/news_shot.mjs --url <page> --out <file.png> [--find "text on the page"] [--width 1280] [--height 1000] [--pad 60]
//   node web/news_shot.mjs --url <page> --out <file.png> --span "a sentence or two" --mark "key words|more key words" --width 360 [--col 250]
//
// Without --find it captures the top of the page. With --find it scrolls to the first element whose text contains the
// phrase and captures a band around it, with the phrase outlined in yellow. With --span it crops to just the lines of
// that phrase and puts the --mark phrases behind a yellow highlighter: the short, readable version for video, where a
// viewer has two or three seconds per card. Cookie banners and sticky popups are hidden with CSS (nothing is accepted
// or clicked).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
if (!args.url || !args.out) {
  console.error('usage: node web/news_shot.mjs --url <page> --out <file.png> [--find "text"]');
  process.exit(1);
}
const width = Number(args.width || 1280);
const height = Number(args.height || 1000);
const pad = Number(args.pad || 60);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
await page.goto(args.url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.addStyleTag({
  content: `[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [id*="onetrust" i],
            [class*="onetrust" i], [aria-label*="cookie" i] { display: none !important; }`,
});

let clip = { x: 0, y: 0, width, height };
if (args.span) {
  // Short, readable crop: just the lines of --span, with --mark (a phrase inside it) behind a yellow highlighter.
  const box = await page.evaluate(({ span, mark, col }) => {
    const find = (phrase) => {
      const want = phrase.toLowerCase();
      for (const el of document.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, td')) {
        const nodes = []; let text = '';
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { nodes.push([n, text.length]); text += n.data; }
        const i = text.toLowerCase().indexOf(want);
        if (i < 0) continue;
        const at = (k) => { for (let j = nodes.length - 1; j >= 0; j--) if (nodes[j][1] <= k) return [nodes[j][0], k - nodes[j][1]]; };
        const r = document.createRange(); r.setStart(...at(i)); r.setEnd(...at(i + want.length));
        return { r, el };
      }
      return null;
    };
    const s = find(span);
    if (!s) return null;
    if (col) s.el.style.width = s.el.style.maxWidth = `${col}px`; // narrower column = fewer words per line = bigger text in the video
    s.el.scrollIntoView({ block: 'center' });
    for (const m of (mark || '').split('|').filter(Boolean)) {
      const f = find(m); if (!f) continue;
      const mk = document.createElement('mark');
      mk.style.cssText = 'background:#ffd400;color:#111;border-radius:6px;padding:0 4px;box-decoration-break:clone;-webkit-box-decoration-break:clone';
      mk.appendChild(f.r.extractContents()); f.r.insertNode(mk);
    }
    const r = find(span).r.getBoundingClientRect(); const p = s.el.getBoundingClientRect();
    return { x: p.left, y: r.top, w: p.width, h: r.height };
  }, { span: args.span, mark: args.mark, col: Number(args.col || 0) });
  if (!box) {
    console.error(`span not found: ${args.span}`);
    await browser.close();
    process.exit(2);
  }
  await page.waitForTimeout(400);
  clip = { x: Math.max(0, box.x - 14), y: Math.max(0, box.y - pad), width: Math.min(width, box.w + 28), height: box.h + pad * 2 };
} else if (args.find) {
  const box = await page.evaluate((phrase) => {
    const want = phrase.toLowerCase();
    let best = null;
    for (const el of document.querySelectorAll('p, li, h1, h2, h3, h4, blockquote, td, span, div')) {
      const t = (el.innerText || '').toLowerCase();
      if (!t.includes(want)) continue;
      if (!best || t.length < (best.innerText || '').length) best = el;
    }
    if (!best) return null;
    best.scrollIntoView({ block: 'center' });
    best.style.outline = '4px solid #ffd400';
    best.style.outlineOffset = '4px';
    const r = best.getBoundingClientRect();
    return { y: r.top, h: r.height };
  }, args.find);
  if (!box) {
    console.error(`phrase not found: ${args.find}`);
    await browser.close();
    process.exit(2);
  }
  await page.waitForTimeout(500);
  const top = Math.max(0, box.y - pad * 3);
  clip = { x: 0, y: top, width, height: Math.min(height - top, box.h + pad * 6) };
}
mkdirSync(dirname(args.out), { recursive: true });
await page.screenshot({ path: args.out, clip });
console.log(`saved ${args.out}`);
await browser.close();
