import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const AUTH_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';
const TARGET_URL = 'http://localhost:5173/studio/blog';

async function main() {
  console.log('=== PART A DIAGNOSTIC: STUDIO BLOG DASHBOARD SCROLLING & GRAY BAR ===');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addInitScript(({ token }) => {
    const adminWallet = '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1';
    localStorage.setItem('polylance_mock_address', adminWallet);
    localStorage.setItem('polylance_auth_wallet', adminWallet);
    localStorage.setItem('polylance_auth_token', token);
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_blog_auth_token', token);
  }, { token: AUTH_TOKEN });

  const page = await context.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Current URL:', page.url());

  // 1. Check layout wrappers computed styles
  const layoutInfo = await page.evaluate(() => {
    const getStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        selector,
        tag: el.tagName,
        id: el.id,
        className: el.className,
        height: cs.height,
        maxHeight: cs.maxHeight,
        minHeight: cs.minHeight,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        position: cs.position,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    };

    return {
      html: getStyles('html'),
      body: getStyles('body'),
      root: getStyles('#root'),
      app: getStyles('#app'),
      main: getStyles('main'),
      motionDiv: getStyles('main > div'),
      scrollingElement: {
        scrollTop: document.scrollingElement?.scrollTop,
        scrollHeight: document.scrollingElement?.scrollHeight,
        clientHeight: document.scrollingElement?.clientHeight,
      },
      windowInnerHeight: window.innerHeight,
    };
  });

  console.log('--- Layout wrappers ---');
  console.log(JSON.stringify(layoutInfo, null, 2));

  // 2. Test wheel scrolling over table, card, empty space
  console.log('--- Testing Wheel Scrolling before fix ---');
  const initialScrollTop = await page.evaluate(() => document.scrollingElement.scrollTop);
  
  // Wheel over table
  const table = page.locator('table');
  if (await table.count() > 0) {
    const box = await table.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(300);
    }
  }

  // Wheel over empty area
  await page.mouse.move(100, 500);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);

  const afterScrollTop = await page.evaluate(() => document.scrollingElement.scrollTop);
  console.log(`Initial scrollTop: ${initialScrollTop}, After wheel scrollTop: ${afterScrollTop}`);

  // 3. Inspect bottom center element to identify the small gray horizontal bar
  console.log('--- Inspecting Bottom Center of Viewport ---');
  const bottomCenterInfo = await page.evaluate(() => {
    const points = [
      { x: window.innerWidth / 2, y: window.innerHeight - 5 },
      { x: window.innerWidth / 2, y: window.innerHeight - 10 },
      { x: window.innerWidth / 2, y: window.innerHeight - 15 },
      { x: window.innerWidth / 2, y: window.innerHeight - 20 },
      { x: window.innerWidth / 2, y: window.innerHeight - 30 },
    ];

    const results = points.map(p => {
      const el = document.elementFromPoint(p.x, p.y);
      if (!el) return { point: p, el: null };
      const cs = window.getComputedStyle(el);
      return {
        point: p,
        tag: el.tagName,
        id: el.id,
        className: el.className,
        outerHTML: el.outerHTML.slice(0, 150),
        position: cs.position,
        zIndex: cs.zIndex,
        pointerEvents: cs.pointerEvents,
        rect: el.getBoundingClientRect(),
        bg: cs.backgroundColor,
      };
    });

    // Also search entire DOM for fixed or absolute elements near the bottom center
    const allElements = Array.from(document.querySelectorAll('*'));
    const fixedBottomElements = [];
    for (const el of allElements) {
      const cs = window.getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') {
        const r = el.getBoundingClientRect();
        if (r.bottom >= window.innerHeight - 50 && r.height < 50 && r.width < 200 && r.width > 10) {
          fixedBottomElements.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            outerHTML: el.outerHTML.slice(0, 150),
            rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
            position: cs.position,
            zIndex: cs.zIndex,
            pointerEvents: cs.pointerEvents,
            bg: cs.backgroundColor,
            borderRadius: cs.borderRadius,
          });
        }
      }
    }

    return { results, fixedBottomElements };
  });

  console.log('Bottom center inspection results:', JSON.stringify(bottomCenterInfo, null, 2));

  // Take screenshot of the page
  await page.screenshot({ path: 'scripts/reproduce_studio_dashboard.png', fullPage: false });
  console.log('Screenshot saved to scripts/reproduce_studio_dashboard.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
