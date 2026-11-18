import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const AUTH_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';
const TARGET_URL = 'http://localhost:5173/studio/blog/a927c746-47b2-4590-8c68-c79b530d899c/edit';

async function diagnose() {
  console.log('--- Launching browser for Studio Scroll Diagnosis ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  // Set localStorage token and mock wallet before loading
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

  console.log('Page loaded:', await page.title(), 'Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Body text:', bodyText);

  // 1. Diagnose element ancestors and computed styles
  const diagData = await page.evaluate(() => {
    const getAncestorChain = (el) => {
      const chain = [];
      let cur = el;
      while (cur) {
        const cs = window.getComputedStyle(cur);
        chain.push({
          tag: cur.tagName.toLowerCase(),
          id: cur.id || '',
          className: (cur.className && typeof cur.className === 'string') ? cur.className.slice(0, 80) : '',
          clientHeight: cur.clientHeight,
          scrollHeight: cur.scrollHeight,
          offsetHeight: cur.offsetHeight,
          clientWidth: cur.clientWidth,
          scrollWidth: cur.scrollWidth,
          overflowY: cs.overflowY,
          overflowX: cs.overflowX,
          height: cs.height,
          maxHeight: cs.maxHeight,
          minHeight: cs.minHeight,
          position: cs.position,
          display: cs.display,
          flexDirection: cs.flexDirection,
          transform: cs.transform,
          pointerEvents: cs.pointerEvents,
          zIndex: cs.zIndex,
        });
        cur = cur.parentElement;
      }
      return chain;
    };

    // Locate the panes
    const editorEl = document.querySelector('textarea') || document.querySelector('[role="region"][aria-label*="Editor"]') || document.querySelector('.font-mono');
    const previewEl = document.querySelector('.overflow-y-auto[tabindex="0"]') || document.querySelector('#preview-content') || document.querySelector('article') || document.querySelector('.markdown-body');
    // Let's find specific containers
    const asideEl = document.querySelector('aside');
    
    // Find preview container: look for pane containing rendered markdown or with role="region"
    const previewPanes = Array.from(document.querySelectorAll('div, aside, section')).filter(el => {
      const cs = window.getComputedStyle(el);
      return cs.overflowY === 'auto' || cs.overflowY === 'scroll';
    });

    // Check body and html
    const htmlCS = window.getComputedStyle(document.documentElement);
    const bodyCS = window.getComputedStyle(document.body);

    // Check for any horizontal overflow
    const docScrollWidth = document.documentElement.scrollWidth;
    const docClientWidth = document.documentElement.clientWidth;
    const bodyScrollWidth = document.body.scrollWidth;

    // Check elements at left edge
    const toolbar = document.querySelector('[class*="sticky top-0"]') || document.querySelector('[class*="border-b"]');
    const firstButton = document.querySelector('button');

    return {
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollY: window.scrollY,
        docScrollWidth,
        docClientWidth,
        bodyScrollWidth
      },
      html: {
        overflow: htmlCS.overflow,
        overflowY: htmlCS.overflowY,
        overflowX: htmlCS.overflowX,
        height: htmlCS.height,
        position: htmlCS.position
      },
      body: {
        overflow: bodyCS.overflow,
        overflowY: bodyCS.overflowY,
        overflowX: bodyCS.overflowX,
        height: bodyCS.height,
        position: bodyCS.position,
        paddingRight: bodyCS.paddingRight
      },
      editorChain: editorEl ? getAncestorChain(editorEl) : null,
      asideChain: asideEl ? getAncestorChain(asideEl) : null,
      scrollablePanesFound: previewPanes.map(p => ({
        tag: p.tagName,
        className: (p.className && typeof p.className === 'string') ? p.className.slice(0, 60) : '',
        id: p.id,
        clientHeight: p.clientHeight,
        scrollHeight: p.scrollHeight,
        scrollTop: p.scrollTop,
        overflowY: window.getComputedStyle(p).overflowY
      }))
    };
  });

  console.log('\n=== DOCUMENT & BODY COMPUTED ===');
  console.log(JSON.stringify({ window: diagData.window, html: diagData.html, body: diagData.body }, null, 2));

  console.log('\n=== SCROLLABLE PANES FOUND ===');
  console.log(JSON.stringify(diagData.scrollablePanesFound, null, 2));

  // 2. Perform wheel testing on each pane
  console.log('\n=== WHEEL SCROLL TESTING ===');
  
  // Test Editor wheel
  const textarea = await page.$('textarea');
  if (textarea) {
    const box = await textarea.boundingBox();
    console.log('Textarea boundingBox:', box);
    const initialScroll = await textarea.evaluate(el => el.scrollTop);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const afterScroll = await textarea.evaluate(el => el.scrollTop);
    const metrics = await textarea.evaluate(el => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      overflowY: window.getComputedStyle(el).overflowY
    }));
    console.log(`EDITOR WHEEL: initial scrollTop=${initialScroll}, after=${afterScroll}, metrics:`, metrics);
  } else {
    console.log('No textarea found!');
  }

  // Test Preview wheel
  // Let's find preview container
  const previewBox = await page.evaluate(() => {
    // Look for element that contains "What Is Crypto Escrow"
    const h1 = Array.from(document.querySelectorAll('h1')).find(h => h.textContent.includes('Crypto Escrow'));
    if (!h1) return null;
    let parent = h1.parentElement;
    while (parent && parent !== document.body) {
      const cs = window.getComputedStyle(parent);
      if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
        const rect = parent.getBoundingClientRect();
        return {
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          scrollTop: parent.scrollTop, scrollHeight: parent.scrollHeight, clientHeight: parent.clientHeight,
          className: parent.className.slice(0, 60),
          tag: parent.tagName
        };
      }
      parent = parent.parentElement;
    }
    return null;
  });

  console.log('Preview Box search result:', previewBox);
  if (previewBox) {
    await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const previewAfter = await page.evaluate((pb) => {
      const h1 = Array.from(document.querySelectorAll('h1')).find(h => h.textContent.includes('Crypto Escrow'));
      let parent = h1.parentElement;
      while (parent && parent !== document.body) {
        const cs = window.getComputedStyle(parent);
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') {
          return { scrollTop: parent.scrollTop, scrollHeight: parent.scrollHeight, clientHeight: parent.clientHeight };
        }
        parent = parent.parentElement;
      }
      return null;
    }, previewBox);
    console.log(`PREVIEW WHEEL: initial=${previewBox.scrollTop}, after=`, previewAfter);
  }

  // Test Sidebar wheel
  const asideBox = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return null;
    const rect = aside.getBoundingClientRect();
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      scrollTop: aside.scrollTop, scrollHeight: aside.scrollHeight, clientHeight: aside.clientHeight,
      overflowY: window.getComputedStyle(aside).overflowY
    };
  });
  console.log('Sidebar Box:', asideBox);
  if (asideBox) {
    await page.mouse.move(asideBox.x + asideBox.width / 2, asideBox.y + 100);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    const asideAfter = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? { scrollTop: aside.scrollTop, scrollHeight: aside.scrollHeight, clientHeight: aside.clientHeight } : null;
    });
    console.log(`SIDEBAR WHEEL: initial=${asideBox.scrollTop}, after=`, asideAfter);
  }

  // Check left-edge clipping and toolbar buttons
  const toolbarCheck = await page.evaluate(() => {
    const toolbar = document.querySelector('div.border-b.bg-\\[\\#FAFAFC\\]') || document.querySelector('[class*="border-b"][class*="bg-"]');
    if (!toolbar) return { error: 'No toolbar found' };
    const tRect = toolbar.getBoundingClientRect();
    const buttons = Array.from(toolbar.querySelectorAll('button')).map(b => ({
      text: b.textContent.trim(),
      left: b.getBoundingClientRect().left,
      right: b.getBoundingClientRect().right,
      width: b.getBoundingClientRect().width,
      x: b.getBoundingClientRect().x
    }));
    return {
      toolbarRect: { left: tRect.left, right: tRect.right, width: tRect.width },
      toolbarOverflowX: window.getComputedStyle(toolbar).overflowX,
      toolbarScrollLeft: toolbar.scrollLeft,
      buttons
    };
  });
  console.log('\n=== TOOLBAR CHECK ===');
  console.log(JSON.stringify(toolbarCheck, null, 2));

  // Print buttons details
  if (toolbarCheck.buttons) {
    console.log('Buttons:', toolbarCheck.buttons.map(b => `${b.text} (left: ${b.left}, right: ${b.right})`).join(', '));
  }

  // Deep layout and hit inspection
  const deepLayout = await page.evaluate(() => {
    const editor = document.querySelector('textarea');
    const preview = document.querySelector('h1')?.closest('.overflow-y-auto') || document.querySelector('.overflow-y-auto');
    const aside = document.querySelector('aside');

    const getMetrics = (el, name) => {
      if (!el) return { name, exists: false };
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        name,
        exists: true,
        tag: el.tagName,
        className: el.className,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom },
        cs: {
          display: cs.display,
          flexDirection: cs.flexDirection,
          flex: cs.flex,
          gridTemplateColumns: cs.gridTemplateColumns,
          width: cs.width,
          height: cs.height,
          minWidth: cs.minWidth,
          minHeight: cs.minHeight,
          overflowY: cs.overflowY,
          overflowX: cs.overflowX,
          position: cs.position,
          pointerEvents: cs.pointerEvents,
          zIndex: cs.zIndex
        },
        scroll: {
          scrollTop: el.scrollTop,
          scrollLeft: el.scrollLeft,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        }
      };
    };

    const hitTests = {};
    if (editor) {
      const er = editor.getBoundingClientRect();
      const hitEl = document.elementFromPoint(er.x + er.width / 2, er.y + er.height / 2);
      hitTests.editorCenter = {
        point: { x: er.x + er.width / 2, y: er.y + er.height / 2 },
        hitTag: hitEl?.tagName,
        hitClass: hitEl?.className,
        isSameOrDescendant: editor === hitEl || editor.contains(hitEl)
      };
    }
    if (preview) {
      const pr = preview.getBoundingClientRect();
      const hitEl = document.elementFromPoint(pr.x + pr.width / 2, pr.y + pr.height / 2);
      hitTests.previewCenter = {
        point: { x: pr.x + pr.width / 2, y: pr.y + pr.height / 2 },
        hitTag: hitEl?.tagName,
        hitClass: hitEl?.className,
        isSameOrDescendant: preview === hitEl || preview.contains(hitEl)
      };
    }
    if (aside) {
      const ar = aside.getBoundingClientRect();
      const hitEl = document.elementFromPoint(ar.x + ar.width / 2, ar.y + ar.height / 2);
      hitTests.asideCenter = {
        point: { x: ar.x + ar.width / 2, y: ar.y + ar.height / 2 },
        hitTag: hitEl?.tagName,
        hitClass: hitEl?.className,
        isSameOrDescendant: aside === hitEl || aside.contains(hitEl)
      };
    }

    const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent.trim(),
      rect: b.getBoundingClientRect()
    }));

    const textareaAncestors = [];
    let cur = editor;
    while (cur && cur !== document.documentElement) {
      const r = cur.getBoundingClientRect();
      const cs = window.getComputedStyle(cur);
      textareaAncestors.push({
        tag: cur.tagName,
        className: cur.className.slice(0, 70),
        rect: { x: r.x, y: r.y, width: r.width, height: r.height, left: r.left, top: r.top },
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        display: cs.display,
        flex: cs.flex,
        position: cs.position
      });
      cur = cur.parentElement;
    }

    return {
      editorMetrics: getMetrics(editor, 'editor'),
      previewMetrics: getMetrics(preview, 'preview'),
      asideMetrics: getMetrics(aside, 'aside'),
      hitTests,
      allButtons: allButtons.slice(0, 15),
      textareaAncestors
    };
  });
  console.log('\n=== DEEP LAYOUT INSPECTION ===');
  console.log(JSON.stringify(deepLayout, null, 2));

  // Check reading time
  const readingTimeCheck = await page.evaluate(() => {
    const textElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && el.textContent && el.textContent.includes('min read')
    );
    const ta = document.querySelector('textarea');
    const content = ta ? ta.value : '';
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    return {
      renderedText: textElements.map(el => el.textContent),
      textareaWordCount: wordCount,
      calculatedReadingTime: Math.max(1, Math.ceil(wordCount / 200))
    };
  });
  console.log('\n=== READING TIME CHECK ===');
  console.log(JSON.stringify(readingTimeCheck, null, 2));

  await browser.close();
  console.log('--- Done diagnosis ---');
}

diagnose().catch(err => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});
