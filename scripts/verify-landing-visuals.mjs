import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = 'C:\\Users\\sunny\\.gemini\\antigravity-ide\\brain\\84d39d38-9a99-4b66-875f-cec24335fb5e';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Desktop 1440x900
  const context1440 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page1440 = await context1440.newPage();
  await page1440.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page1440.waitForTimeout(1000);

  // Take full page screenshot
  await page1440.screenshot({
    path: path.join(artifactDir, 'landing_redesign_desktop_1440.png'),
    fullPage: true,
  });
  console.log('Saved landing_redesign_desktop_1440.png');

  // Take hero screenshot
  await page1440.screenshot({
    path: path.join(artifactDir, 'landing_hero_desktop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 800 },
  });
  console.log('Saved landing_hero_desktop.png');

  // Test Simulator interaction
  const clientPill = page1440.locator('button:has-text("I want to hire")').first();
  await clientPill.click();
  await page1440.waitForTimeout(500);

  // Scroll to simulator
  const sim = page1440.locator('text=Interactive Escrow Simulator').first();
  await sim.scrollIntoViewIfNeeded();
  await page1440.waitForTimeout(500);

  // Click $2,500 preset
  const preset2500 = page1440.locator('button:has-text("2,500")').first();
  if (await preset2500.isVisible()) {
    await preset2500.click();
    await page1440.waitForTimeout(300);
  }

  // Click dispute toggle
  const disputeBtn = page1440.locator('button:has-text("What if there is a disagreement")').first();
  if (await disputeBtn.isVisible()) {
    await disputeBtn.click();
    await page1440.waitForTimeout(300);
  }

  await page1440.screenshot({
    path: path.join(artifactDir, 'landing_simulator_interactive.png'),
    clip: { x: 0, y: 800, width: 1440, height: 950 },
  });
  console.log('Saved landing_simulator_interactive.png');

  // 2. Ultra-wide 1920x1080
  const context1920 = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page1920 = await context1920.newPage();
  await page1920.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page1920.waitForTimeout(1000);

  await page1920.screenshot({
    path: path.join(artifactDir, 'landing_redesign_desktop_1920.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1920, height: 950 },
  });
  console.log('Saved landing_redesign_desktop_1920.png');

  // Screenshot footer logo & alignment
  const footer = page1920.locator('footer').first();
  await footer.scrollIntoViewIfNeeded();
  await page1920.waitForTimeout(400);
  await footer.screenshot({
    path: path.join(artifactDir, 'landing_footer_restored.png'),
  });
  console.log('Saved landing_footer_restored.png');

  // 3. Mobile 390x844 (iPhone 14)
  const context390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const page390 = await context390.newPage();
  await page390.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page390.waitForTimeout(1000);

  await page390.screenshot({
    path: path.join(artifactDir, 'landing_redesign_mobile_390.png'),
    fullPage: true,
  });
  console.log('Saved landing_redesign_mobile_390.png');

  await browser.close();
  console.log('Visual verification complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
