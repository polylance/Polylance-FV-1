import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e';

async function runVisualVerification() {
  console.log('🚀 Launching visual verification across viewports...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const viewports = [
    { name: 'mobile_375', width: 375, height: 812 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'desktop_1100', width: 1100, height: 900 },
    { name: 'desktop_1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    console.log(`📸 Capturing viewport ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    // 1. Landing Page
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture Landing Hero
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `verify_landing_${vp.name}.png`),
      fullPage: false
    });

    // Scroll to Feature Bento and capture
    const bentoHeading = page.locator('text=Why PolyLance');
    if (await bentoHeading.count() > 0) {
      await bentoHeading.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `verify_bento_${vp.name}.png`),
        fullPage: false
      });
    }

    // Scroll to Landing Footer and capture
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      await footer.last().scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `verify_landing_footer_${vp.name}.png`),
        fullPage: false
      });
    }

    // 2. Escrow Simulator Page
    if (vp.width !== 1100) { // requested 375, 768, 1440
      await page.goto('http://localhost:5173/escrow-simulator', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `verify_simulator_${vp.name}.png`),
        fullPage: false
      });

      // Scroll to Simulator footer
      if (await footer.count() > 0) {
        await footer.last().scrollIntoViewIfNeeded();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, `verify_simulator_footer_${vp.name}.png`),
          fullPage: false
        });
      }
    }

    await page.close();
  }

  // 3. Search Box States (Desktop 1440px)
  console.log('📸 Capturing search box states at 1440px...');
  const searchPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await searchPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await searchPage.waitForTimeout(1000);

  // Capture empty search box with shortcut hint
  await searchPage.screenshot({
    path: path.join(ARTIFACT_DIR, `verify_search_empty.png`),
    clip: { x: 0, y: 0, width: 1440, height: 100 }
  });

  // Focus search input
  const searchInput = searchPage.locator('input[placeholder="Search jobs..."]');
  if (await searchInput.count() > 0) {
    await searchInput.first().focus();
    await searchInput.first().fill('Fullstack React');
    await searchPage.waitForTimeout(400);
    await searchPage.screenshot({
      path: path.join(ARTIFACT_DIR, `verify_search_active.png`),
      clip: { x: 0, y: 0, width: 1440, height: 100 }
    });
  }

  // Measure Web Vitals & Container Alignment
  const containerMetrics = await searchPage.evaluate(() => {
    const navContainer = document.querySelector('header .max-w-\\[1440px\\]');
    const heroContainer = document.querySelector('section .max-w-\\[1440px\\]');
    const footerContainer = document.querySelector('footer .max-w-\\[1440px\\]');

    const getBox = (el) => el ? {
      width: el.getBoundingClientRect().width,
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right
    } : null;

    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries.length > 0 ? navEntries[0] : null;

    return {
      nav: getBox(navContainer),
      hero: getBox(heroContainer),
      footer: getBox(footerContainer),
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
      domInteractive: nav ? Math.round(nav.domInteractive) : 0,
      loadComplete: nav ? Math.round(nav.loadEventEnd) : 0
    };
  });

  console.log('Container & Performance Metrics:', JSON.stringify(containerMetrics, null, 2));

  await searchPage.close();
  await browser.close();
  console.log('✨ All visual verification screenshots captured successfully!');
}

runVisualVerification().catch(err => {
  console.error('Error during visual verification:', err);
  process.exit(1);
});
