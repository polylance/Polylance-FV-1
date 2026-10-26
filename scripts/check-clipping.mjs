import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const AUTH_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';
const TARGET_URL = 'http://localhost:5173/studio/blog/a927c746-47b2-4590-8c68-c79b530d899c/edit';

async function check() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [1440, 1280, 1024, 768, 502]) {
    const context = await browser.newContext({ viewport: { width, height: 800 } });
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
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const btn = document.querySelector('button[title*="H2"]');
      const ta = document.querySelector('textarea');
      const toolbar = btn ? btn.parentElement : null;
      return {
        btnRect: btn ? btn.getBoundingClientRect() : null,
        taRect: ta ? ta.getBoundingClientRect() : null,
        toolbarRect: toolbar ? toolbar.getBoundingClientRect() : null,
        toolbarScrollLeft: toolbar ? toolbar.scrollLeft : null,
        windowScrollX: window.scrollX,
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth
      };
    });
    console.log(`Width ${width}:`, info);
    await context.close();
  }
  await browser.close();
}

check().catch(console.error);
