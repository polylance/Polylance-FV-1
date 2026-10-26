import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

async function measure() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  }).catch(() =>
    chromium.launch({
      channel: 'msedge',
      headless: true,
    })
  );

  const outDir = path.resolve('scripts/media');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const viewports = [
    { width: 390, height: 844, name: '390_mobile' },
    { width: 1024, height: 768, name: '1024_tablet' },
    { width: 1280, height: 800, name: '1280_laptop' },
    { width: 1440, height: 900, name: '1440_desktop' },
    { width: 1920, height: 1080, name: '1920_fhd' },
    { width: 2560, height: 1440, name: '2560_qhd' },
  ];

  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Measure navbar container and elements
    const metrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const container = header ? header.querySelector('.container-custom, [class*="max-w-[1440px]"]') : null;
      const logo = header ? header.querySelector('a[href="/"]') : null;
      const navLinks = header ? header.querySelector('nav') : null;
      const search = header ? header.querySelector('input[type="text"], input[placeholder*="Search"]') : null;
      const postJobBtn = Array.from(header ? header.querySelectorAll('a, button') : []).find(el => el.textContent?.includes('Post a job') || el.textContent?.includes('Post Job'));
      
      const getRect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right) };
      };

      return {
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        containerRect: getRect(container),
        logoRect: getRect(logo),
        navLinksRect: getRect(navLinks),
        searchRect: getRect(search),
        postJobRect: getRect(postJobBtn),
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    });

    results.push({ viewport: vp.name, width: vp.width, ...metrics });
    await page.screenshot({ path: `scripts/media/navbar_${vp.name}.png` });
    await page.close();
  }

  // Also test logged-in mock state if token or user state is set in localStorage
  const loggedInPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await loggedInPage.goto('http://localhost:5173/');
  await loggedInPage.evaluate(() => {
    localStorage.setItem('polylance_token', 'mock_token');
    localStorage.setItem('polylance_user', JSON.stringify({
      id: 'mock-1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'client',
      walletAddress: '0x1234...5678'
    }));
  });
  await loggedInPage.reload({ waitUntil: 'networkidle' });
  const loggedInMetrics = await loggedInPage.evaluate(() => {
    const header = document.querySelector('header');
    const container = header ? header.querySelector('.container-custom, [class*="max-w-[1440px]"]') : null;
    const postJobBtn = Array.from(header ? header.querySelectorAll('a, button') : []).find(el => el.textContent?.includes('Post a job') || el.textContent?.includes('Post Job'));
    const getRect = (el) => el ? { width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) } : null;
    return {
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
      containerRect: getRect(container),
      postJobRect: getRect(postJobBtn),
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
  });
  await loggedInPage.screenshot({ path: `scripts/media/navbar_logged_in_1440.png` });
  await loggedInPage.close();

  // Test /escrow-simulator page
  const simPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await simPage.goto('http://localhost:5173/escrow-simulator', { waitUntil: 'networkidle' });
  const simTitle = await simPage.title();
  const simHeading = await simPage.textContent('h1');
  await simPage.screenshot({ path: `scripts/media/escrow_simulator_page.png` });
  await simPage.close();

  await browser.close();
  console.log(JSON.stringify({ viewports: results, loggedIn1440: loggedInMetrics, simPage: { title: simTitle, heading: simHeading } }, null, 2));
}

measure().catch(err => {
  console.error(err);
  process.exit(1);
});
