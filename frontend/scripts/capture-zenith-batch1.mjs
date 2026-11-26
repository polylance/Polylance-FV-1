import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../../docs/redesign/zenith-after');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const baseUrl = 'http://localhost:5173';
const viewports = [
  { name: '375', width: 375, height: 812, isMobile: true },
  { name: '768', width: 768, height: 1024, isMobile: false },
  { name: '1280', width: 1280, height: 800, isMobile: false },
  { name: '1920', width: 1920, height: 1080, isMobile: false },
];

async function capture() {
  console.log('Launching browser for Zenith Batch 1 Core Components QA capture...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  }).catch(() =>
    chromium.launch({
      channel: 'msedge',
      headless: true,
    })
  );

  console.log('Browser launched successfully.');

  for (const vp of viewports) {
    console.log(`Capturing Batch 1 at ${vp.name}px...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
    });

    try {
      const page = await context.newPage();
      await page.goto(`${baseUrl}/#/dev/states`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      const filePath = path.join(outputDir, `batch1-core-components-${vp.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`  ✓ Saved ${filePath}`);
      await page.close();
    } catch (err) {
      console.error(`  ✗ Error at ${vp.name}px:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('All Batch 1 screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
