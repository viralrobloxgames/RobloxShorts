// Screenshot a source page for a ViralRoblox News evidence shot.
//
//   node web/news_shot.mjs --url <page> --out <file.png> [--find "text on the page"] [--width 1280] [--height 1000] [--pad 60]
//
// Without --find it captures the top of the page. With --find it scrolls to the first element whose text contains the
// phrase and captures a band around it, with the phrase outlined in yellow. Cookie banners and sticky popups are
// hidden with CSS (nothing is accepted or clicked).
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
if (args.find) {
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
