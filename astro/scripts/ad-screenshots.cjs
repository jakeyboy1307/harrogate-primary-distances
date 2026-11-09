// Retakes the screenshots on /advertise/ (public/advertise/*.webp): each ad slot outlined, the rest dimmed.
// Run the site locally (npx wrangler dev --port 8787), then from a folder with Playwright installed
// (npm i playwright && npx playwright install webkit):
//   node ad-screenshots.cjs http://127.0.0.1:8787 <out dir>
// and convert each PNG with: cwebp -q 78 -resize 1100 0 <name>.png -o public/advertise/<name>.webp
const { webkit } = require('playwright');
const [, , BASE = 'http://127.0.0.1:8787', OUT = '.'] = process.argv;

const CSS = `
  .ad-demo { display: none !important; }
  .shot-hl { position: relative; z-index: 50; border-radius: 16px;
    box-shadow: 0 0 0 4px #FFE45C, 0 0 0 7px #14182B, 0 0 0 4000px rgba(20,24,43,.55) !important; }
  .ad-strip.shot-hl { padding: 10px 14px; margin-left: -14px; background: #fff; }
  * { transition: none !important; animation: none !important; }`;

async function shoot(page, sel, name, { w = 1100, h = 688 } = {}) {
  await page.addStyleTag({ content: CSS });
  const el = page.locator(sel).first();
  await el.waitFor();
  await page.evaluate(() => document.querySelectorAll('.shot-hl').forEach((e) => e.classList.remove('shot-hl')));
  await el.evaluate((e) => { e.classList.add('shot-hl'); e.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400);
  const b = await el.boundingBox();
  const vp = page.viewportSize();
  w = Math.min(vp.width, Math.max(w, b.width + 140));
  h = Math.min(vp.height, Math.max(h, b.height + 140, Math.round(w * 0.625)));
  const x = Math.max(0, Math.min(vp.width - w, b.x + b.width / 2 - w / 2));
  const y = Math.max(0, Math.min(vp.height - h, b.y + b.height / 2 - h / 2));
  await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x, y, width: w, height: h } });
  console.log('saved', name, Math.round(w), Math.round(h));
}

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.25 });

  // results: the featured card after a Harrogate search
  await page.goto(`${BASE}/#pc=HG20NA`);
  await page.locator('.ad-row .ad-card').waitFor();
  await page.waitForTimeout(1500);   // walking distances
  await shoot(page, '.ad-row .ad-card', 'results');

  // the school panel: open days, uniform, nearby
  await page.locator('#rows .row-name', { hasText: 'Western Primary' }).first().click();
  await page.locator('#panel.open .ad-profile').waitFor();
  await page.waitForTimeout(400);
  await shoot(page, '#panel .ad-profile', 'profile');
  await shoot(page, '#panel .ad-sec .ad-card:nth-child(1)', 'uniform');
  await shoot(page, '#panel .ad-sec .ad-card:nth-child(2)', 'nearby');

  // the plan page, with a few schools in the list
  await page.evaluate(() => localStorage.setItem('ysc-list', JSON.stringify([142220, 142198, 142592])));
  await page.goto(`${BASE}/plan/`);
  await page.locator('#ready:not([hidden]) .ad-card').first().waitFor();
  await page.waitForTimeout(800);
  await shoot(page, '#readyGrid', 'plan');

  // the area page sponsor line
  await page.goto(`${BASE}/harrogate-primary-schools/`);
  await shoot(page, '.ad-strip', 'area');

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
