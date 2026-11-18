import { chromium } from '@playwright/test';

async function auditFeatureLinks() {
  console.log('🔍 Starting Feature Section Link Audit with Playwright...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll to Features section
  const sectionHeader = page.locator('text=Why PolyLance');
  await sectionHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Find all links in the feature section
  const links = page.locator('article a');
  const count = await links.count();
  console.log(`Found ${count} links in the feature cards.`);

  const auditResults = [];

  for (let i = 0; i < count; i++) {
    // Re-locate after navigation
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const targetLink = page.locator('article a').nth(i);
    const text = (await targetLink.innerText()).trim();
    const href = await targetLink.getAttribute('href');
    const tagName = await targetLink.evaluate(el => el.tagName.toLowerCase());
    const isRealAnchor = tagName === 'a' && !!href;

    console.log(`Testing link ${i + 1}/${count}: "${text}" (href: ${href})...`);
    
    // Clear errors
    consoleErrors.length = 0;

    // Click link
    const initialUrl = page.url();
    await targetLink.click();
    await page.waitForTimeout(1000);

    const resultingUrl = page.url();
    const isNotFound = (await page.locator('text=Page Not Found').count() > 0) ||
                       (await page.locator('text=404').count() > 0) ||
                       (await page.title()).includes('404') ||
                       (await page.title()).includes('Not Found');

    // Check scroll position
    const scrollY = await page.evaluate(() => window.scrollY);

    auditResults.push({
      text,
      href,
      resultingUrl,
      isRealAnchor,
      isNotFound,
      scrollY,
      consoleErrors: [...consoleErrors]
    });
  }

  console.log('\n--- LINK AUDIT RESULTS ---');
  console.log(JSON.stringify(auditResults, null, 2));

  // Also check Card measurements: height, illustration height, top border
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const cardMetrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('article'));
    return cards.map((c, idx) => {
      const rect = c.getBoundingClientRect();
      const style = window.getComputedStyle(c);
      const visual = c.firstElementChild;
      const visualRect = visual ? visual.getBoundingClientRect() : null;
      const list = c.querySelector('ul');
      const listRect = list ? list.getBoundingClientRect() : null;
      const divider = c.querySelector('.border-t');
      const dividerRect = divider ? divider.getBoundingClientRect() : null;

      return {
        cardIndex: idx,
        cardHeight: Math.round(rect.height),
        visualHeight: visualRect ? Math.round(visualRect.height) : 0,
        borderTop: style.borderTop,
        borderRadius: style.borderRadius,
        gapBetweenListAndDivider: (dividerRect && listRect) ? Math.round(dividerRect.top - listRect.bottom) : null
      };
    });
  });

  console.log('\n--- CARD METRICS ---');
  console.log(JSON.stringify(cardMetrics, null, 2));

  await browser.close();
}

auditFeatureLinks().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
