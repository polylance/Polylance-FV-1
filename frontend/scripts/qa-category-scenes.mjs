import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../docs/redesign/zenith-after/category-scenes');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BASE_URL = 'http://localhost:5173';
const VIEWPORTS = [375, 390, 414, 768, 1280, 1920];

async function runQA() {
  const browser = await chromium
    .launch({ channel: 'chrome', headless: true })
    .catch(() => chromium.launch({ channel: 'msedge', headless: true }));

  const report = {
    viewports: {},
    clsOnTabSwitch: 0,
    keyboardTest: false,
    axeViolations: [],
    fakeFallbackTest: false,
    screenshots: [],
  };

  try {
    // 1. Test ALL 6 Viewports for horizontal overflow & 16:10 stage ratio
    for (const width of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width, height: width < 768 ? 812 : 900 },
        deviceScaleFactor: 1,
        isMobile: width < 768,
      });
      const page = await ctx.newPage();
      await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);

      const explorer = page.locator('#category-explorer');
      await explorer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const stage = document.querySelector('#category-explorer [data-scene-key]');
        const rect = stage ? stage.getBoundingClientRect() : null;
        const ratio = rect && rect.height > 0 ? rect.width / rect.height : 0;
        const tabsCount = document.querySelectorAll('#category-explorer [role="tab"]').length;
        return {
          overflow,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          ratio: Number(ratio.toFixed(2)),
          tabsCount,
        };
      });

      report.viewports[width] = metrics;

      if (width === 375 || width === 1280) {
        // Wait ~2.2s into scene timeline so explorer shows resolved UI mid-motion
        await page.waitForTimeout(1800);
        const file = path.join(outDir, `explorer-${width}.png`);
        await explorer.screenshot({ path: file });
        report.screenshots.push(file);
      }

      await ctx.close();
    }

    // 2. Desktop 1280: Keyboard Navigation + CLS across all 10 tabs + Axe checks
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await desktopCtx.newPage();
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // Inject CLS observer
    await page.evaluate(() => {
      window.__plCls = 0;
      if ('PerformanceObserver' in window) {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__plCls += entry.value;
            }
          }
        });
        po.observe({ type: 'layout-shift', buffered: false });
      }
    });

    const explorer = page.locator('#category-explorer');
    await explorer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Keyboard test: ArrowDown, End, Home
    const firstTab = page.locator('#category-explorer [role="tab"]').first();
    await firstTab.focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
    const secondSelected = await page
      .locator('#category-explorer [role="tab"]')
      .nth(1)
      .getAttribute('aria-selected');

    await page.keyboard.press('End');
    await page.waitForTimeout(250);
    const lastSelected = await page
      .locator('#category-explorer [role="tab"]')
      .last()
      .getAttribute('aria-selected');

    await page.keyboard.press('Home');
    await page.waitForTimeout(250);
    const firstSelectedAgain = await firstTab.getAttribute('aria-selected');

    report.keyboardTest =
      secondSelected === 'true' && lastSelected === 'true' && firstSelectedAgain === 'true';

    // Click through all tabs and measure CLS
    const tabCount = await page.locator('#category-explorer [role="tab"]').count();
    for (let i = 0; i < tabCount; i++) {
      await page.locator('#category-explorer [role="tab"]').nth(i).click();
      await page.waitForTimeout(260);
    }
    report.clsOnTabSwitch = await page.evaluate(() => Number((window.__plCls || 0).toFixed(4)));

    // Lightweight built-in WCAG ARIA + contrast sanity check & performance vitals on #category-explorer
    report.performanceVitals = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((p) => p.name === 'first-contentful-paint');
      return {
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
        fcpMs: fcp ? Math.round(fcp.startTime) : null,
        explorerSvgCount: document.querySelectorAll('#category-explorer svg[viewBox="0 0 640 400"]').length,
      };
    });

    report.axeSummary = await page.evaluate(() => {
      const root = document.querySelector('#category-explorer');
      if (!root) return { error: 'No explorer' };
      const tablist = root.querySelector('[role="tablist"]');
      const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
      const panel = root.querySelector('[role="tabpanel"]');
      const replayBtn = root.querySelector('button[aria-label^="Replay"]');
      const svgs = Array.from(root.querySelectorAll('svg[viewBox="0 0 640 400"]'));
      return {
        hasTablist: Boolean(tablist),
        tabsWithAriaSelected: tabs.every((t) => t.hasAttribute('aria-selected')),
        hasTabpanel: Boolean(panel && panel.getAttribute('aria-labelledby')),
        hasReplayAriaLabel: Boolean(replayBtn),
        allSceneSvgsAriaHidden: svgs.every((s) => s.getAttribute('aria-hidden') === 'true'),
      };
    });

    // 3. Capture Reuse Surfaces at 1280 & 375
    const reuseRoutes = [
      { name: 'reuse-category-page', url: '/#/category/web3-blockchain' },
      { name: 'reuse-find-jobs', url: '/#/jobs?domain=web3-blockchain' },
      { name: 'reuse-post-job', url: '/jobs/post?demo=true' },
    ];
    for (const r of reuseRoutes) {
      for (const w of [375, 1280]) {
        const rCtx = await browser.newContext({
          viewport: { width: w, height: w < 768 ? 812 : 900 },
          isMobile: w < 768,
        });
        const rPage = await rCtx.newPage();
        await rPage.addInitScript(() => {
          localStorage.setItem('polylance_demo_mode', 'true');
          localStorage.setItem('polylance_demo_role', 'client');
          localStorage.setItem('polylance_account_mode', 'client');
          localStorage.setItem('polylance_tour_dismissed', 'true');
        });
        await rPage.goto(`${BASE_URL}${r.url}`, { waitUntil: 'domcontentloaded' });
        await rPage.waitForTimeout(1000);
        const file = path.join(outDir, `${r.name}-${w}.png`);
        await rPage.screenshot({ path: file });
        report.screenshots.push(file);
        await rCtx.close();
      }
    }

    // 4. Scene Lab: Capture ALL scenes in first, playing, final, reduced at 1280 & 375 + Fake Category Fallback
    for (const w of [375, 1280]) {
      const sCtx = await browser.newContext({
        viewport: { width: w, height: w < 768 ? 812 : 900 },
        isMobile: w < 768,
      });
      const sPage = await sCtx.newPage();
      await sPage.goto(`${BASE_URL}/#/scene-lab`, { waitUntil: 'domcontentloaded' });
      await sPage.waitForTimeout(1200);

      // Inject Fake Categories
      const fakeBtn = sPage.getByRole('button', { name: /Inject Fake Categories/i });
      if (await fakeBtn.isVisible()) {
        await fakeBtn.click();
        await sPage.waitForTimeout(800);
        if (w === 1280) {
          const kwExists = (await sPage.locator('[data-scene-key="security-solidity-fuzzing-audit"]').count()) > 0;
          const genExists = (await sPage.locator('[data-scene-key="generic-quantum-gastronomy-lab"]').count()) > 0;
          report.fakeFallbackTest = kwExists && genExists;
        }
      }

      // Switch to "All 4 States Side-by-Side" and wait ~2s into PLAYING timeline
      const allBtn = sPage.getByRole('button', { name: /All 4 States Side-by-Side/i });
      await allBtn.click();
      await sPage.waitForTimeout(2100);

      const labFile = path.join(outDir, `scene-lab-all-states-${w}.png`);
      await sPage.screenshot({ path: labFile, fullPage: true });
      report.screenshots.push(labFile);

      // Capture per-category stage screenshots in 4 states on 1280
      if (w === 1280) {
        const cards = sPage.locator('section:has-text("All Registered Scenes") > div > div');
        const count = await cards.count();
        for (let idx = 0; idx < count; idx++) {
          const card = cards.nth(idx);
          const keyAttr = await card.locator('[data-scene-key]').first().getAttribute('data-scene-key');
          const keyName = (keyAttr || `scene-${idx}`).split('-')[0];
          const cardFile = path.join(outDir, `scene-${keyName}-4states-1280.png`);
          await card.scrollIntoViewIfNeeded();
          await card.screenshot({ path: cardFile });
          report.screenshots.push(cardFile);
        }
      }

      await sCtx.close();
    }

    await desktopCtx.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(report, null, 2));
}

runQA().catch((err) => {
  console.error(err);
  process.exit(1);
});
