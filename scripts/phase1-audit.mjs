import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const WIDTHS = [390, 768, 1024, 1280, 1440, 1920, 2560];

async function runAudit() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  console.log('=== PHASE 1: SECTION EDGE & CONTAINER MEASUREMENTS ===\n');

  for (const width of WIDTHS) {
    console.log(`\n=================== VIEWPORT WIDTH: ${width}px ===================`);
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const measurements = await page.evaluate(() => {
      // Navbar logo and container
      const navHeader = document.querySelector('header');
      const navContainer = document.querySelector('header > div[class*="max-w"]');
      const navLogo = document.querySelector('header a[href="/"]');

      const navContainerRect = navContainer ? navContainer.getBoundingClientRect() : null;
      const navLogoRect = navLogo ? navLogo.getBoundingClientRect() : null;

      const sections = Array.from(document.querySelectorAll('section, footer'));
      const results = sections.map((s, idx) => {
        const rect = s.getBoundingClientRect();
        const heading = s.querySelector('h1, h2, h3, h4')?.textContent?.trim() || s.tagName;
        const container = s.querySelector('div[class*="max-w"]') || s.querySelector('.w-full');
        const containerRect = container ? container.getBoundingClientRect() : null;
        
        // First visible content element inside container
        const firstContent = s.querySelector('h1, h2, h3, h4, p, [role="radiogroup"], .text-eyebrow');
        const contentRect = firstContent ? firstContent.getBoundingClientRect() : null;

        return {
          idx,
          tag: s.tagName,
          heading: heading.slice(0, 35),
          left: rect.left,
          width: rect.width,
          containerLeft: containerRect ? Math.round(containerRect.left) : 'none',
          containerWidth: containerRect ? Math.round(containerRect.width) : 'none',
          contentLeft: contentRect ? Math.round(contentRect.left) : 'none',
        };
      });

      return {
        navLogoLeft: navLogoRect ? Math.round(navLogoRect.left) : 'none',
        navContainerLeft: navContainerRect ? Math.round(navContainerRect.left) : 'none',
        navContainerWidth: navContainerRect ? Math.round(navContainerRect.width) : 'none',
        sections: results,
      };
    });

    console.log(`Navbar container: left=${measurements.navContainerLeft}px, width=${measurements.navContainerWidth}px | Logo left=${measurements.navLogoLeft}px`);
    for (const s of measurements.sections) {
      console.log(`  Section ${s.idx} [${s.heading}]: Container (left=${s.containerLeft}px, width=${s.containerWidth}px) | Content left=${s.contentLeft}px`);
    }

    await page.close();
  }

  // Baseline Performance (LCP / CLS via Performance API)
  console.log('\n=== BASELINE WEB VITALS (Desktop 1440 & Mobile 390) ===');
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const perf = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let lcp = 0;
        let cls = 0;

        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.startTime > lcp) lcp = entry.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          resolve({
            lcp: Math.round(lcp),
            cls: Number(cls.toFixed(4)),
          });
        }, 800);
      });
    });

    console.log(`Viewport ${width}px: LCP = ${perf.lcp}ms, CLS = ${perf.cls}`);
    await page.close();
  }

  await browser.close();
  console.log('\nAudit measurements complete!');
}

runAudit().catch(console.error);
