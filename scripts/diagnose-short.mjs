import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const AUTH_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';
const TARGET_URL = 'http://localhost:5173/studio/blog/a927c746-47b2-4590-8c68-c79b530d899c/edit';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
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

  const report = await page.evaluate(() => {
    // 1. Check toolbar buttons and left offset
    const toolbar = document.querySelector('div.border-b.bg-\\[\\#FAFAFC\\]') || document.querySelector('[class*="border-b"][class*="bg-"]');
    const buttons = toolbar ? Array.from(toolbar.querySelectorAll('button')).map(b => ({
      text: b.textContent.trim(),
      rect: b.getBoundingClientRect()
    })) : [];

    const textarea = document.querySelector('textarea');
    const taRect = textarea ? textarea.getBoundingClientRect() : null;

    // Check ancestors of textarea for negative margin, transform, or scrollLeft
    const ancestors = [];
    let cur = textarea;
    while (cur && cur !== document.documentElement) {
      const cs = window.getComputedStyle(cur);
      const r = cur.getBoundingClientRect();
      ancestors.push({
        tag: cur.tagName,
        className: (cur.className && typeof cur.className === 'string') ? cur.className.slice(0, 50) : '',
        rect: { left: r.left, width: r.width, right: r.right },
        margin: cs.margin,
        padding: cs.padding,
        transform: cs.transform,
        scrollLeft: cur.scrollLeft,
        overflowX: cs.overflowX
      });
      cur = cur.parentElement;
    }

    // 2. Check wheel event behavior on textarea, preview, and sidebar
    // Check if any element intercepts wheel
    const editorHit = document.elementFromPoint(100, 300);
    const previewHit = document.elementFromPoint(700, 300);
    const sidebarHit = document.elementFromPoint(1200, 300);

    // Check textarea scrollHeight vs clientHeight
    // What is in textarea?
    const taVal = textarea ? textarea.value : '';
    const words = taVal.trim().split(/\s+/).filter(Boolean);

    // Check preview scrollHeight
    const preview = document.querySelector('h1')?.closest('.overflow-y-auto') || document.querySelector('.overflow-y-auto');
    const previewMetrics = preview ? {
      scrollHeight: preview.scrollHeight,
      clientHeight: preview.clientHeight,
      scrollTop: preview.scrollTop
    } : null;

    // Check sidebar scrollHeight
    const aside = document.querySelector('aside');
    const asideMetrics = aside ? {
      scrollHeight: aside.scrollHeight,
      clientHeight: aside.clientHeight,
      scrollTop: aside.scrollTop,
      rect: aside.getBoundingClientRect()
    } : null;

    // Check reading time elements
    const readingTimeNodes = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && el.textContent && el.textContent.includes('min read')
    ).map(el => el.textContent.trim());

    return {
      buttons: buttons.map(b => ({ text: b.text, left: b.rect.left, width: b.rect.width })),
      taRect,
      ancestors: ancestors.slice(0, 6),
      hits: {
        editorHit: { tag: editorHit?.tagName, class: editorHit?.className?.slice(0, 40) },
        previewHit: { tag: previewHit?.tagName, class: previewHit?.className?.slice(0, 40) },
        sidebarHit: { tag: sidebarHit?.tagName, class: sidebarHit?.className?.slice(0, 40) }
      },
      taValLength: taVal.length,
      taValWords: words.length,
      taValSnippet: taVal.slice(0, 150),
      taScrollHeight: textarea?.scrollHeight,
      taClientHeight: textarea?.clientHeight,
      previewMetrics,
      asideMetrics,
      readingTimeNodes
    };
  });

  console.log('=== SHORT REPORT ===');
  console.log(JSON.stringify(report, null, 2));

  // Test if Lenis is active
  const lenisCheck = await page.evaluate(() => {
    return {
      hasLenisClass: document.documentElement.classList.contains('lenis'),
      lenisScroll: (window).lenis ? true : false,
      preventedElements: document.querySelectorAll('[data-lenis-prevent]').length
    };
  });
  console.log('Lenis status:', lenisCheck);

  // Test sidebar before data-lenis-prevent
  await page.mouse.move(1200, 300);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  const asideBeforeFix = await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Article metadata sidebar"]');
    return aside ? { scrollTop: aside.scrollTop, scrollHeight: aside.scrollHeight, clientHeight: aside.clientHeight } : null;
  });
  console.log('Sidebar scroll BEFORE data-lenis-prevent:', asideBeforeFix);

  // Fill textarea with more text to ensure scrollHeight > clientHeight
  await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    if (ta) {
      ta.value = ta.value + '\n\n' + Array(50).fill('Extra line for testing textarea scroll height and wheel behaviors in PolyLance blog studio.').join('\n\n');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  await page.waitForTimeout(200);

  // Test editor before data-lenis-prevent
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);
  const editorBeforeFix = await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    return ta ? { scrollTop: ta.scrollTop, scrollHeight: ta.scrollHeight, clientHeight: ta.clientHeight } : null;
  });
  console.log('Editor scroll BEFORE data-lenis-prevent:', editorBeforeFix);

  // Now destroy or pause Lenis, or add data-lenis-prevent to studio root
  await page.evaluate(() => {
    document.body.setAttribute('data-lenis-prevent', 'true');
    const studio = document.querySelector('[role="region"]') || document.querySelector('textarea')?.closest('.flex-1');
    if (studio) studio.setAttribute('data-lenis-prevent', 'true');
    document.querySelectorAll('textarea, aside, .overflow-y-auto').forEach(el => el.setAttribute('data-lenis-prevent', 'true'));
  });

  console.log('\n--- Sending mouse wheel (0, 300) over Editor after adding data-lenis-prevent ---');
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);

  const editorAfterLenisFix = await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    return ta ? { scrollTop: ta.scrollTop, scrollHeight: ta.scrollHeight, clientHeight: ta.clientHeight } : null;
  });
  console.log('Editor scroll after data-lenis-prevent:', editorAfterLenisFix);

  console.log('\n--- Sending mouse wheel (0, 300) over Preview after adding data-lenis-prevent ---');
  await page.mouse.move(700, 300);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);

  const previewAfterLenisFix = await page.evaluate(() => {
    const preview = document.querySelector('h1')?.closest('.overflow-y-auto') || document.querySelector('.overflow-y-auto');
    return preview ? { scrollTop: preview.scrollTop, scrollHeight: preview.scrollHeight, clientHeight: preview.clientHeight } : null;
  });
  console.log('Preview scroll after data-lenis-prevent:', previewAfterLenisFix);

  console.log('\n--- Sending mouse wheel (0, 300) over Sidebar after adding data-lenis-prevent ---');
  await page.mouse.move(1200, 300);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(400);

  const asideAfterLenisFix = await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="Article metadata sidebar"]');
    return aside ? { scrollTop: aside.scrollTop, scrollHeight: aside.scrollHeight, clientHeight: aside.clientHeight } : null;
  });
  console.log('Sidebar scroll after data-lenis-prevent:', asideAfterLenisFix);

  await browser.close();
}

run().catch(console.error);
