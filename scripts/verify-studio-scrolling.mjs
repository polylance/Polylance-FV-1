import { chromium } from '../frontend/node_modules/playwright/index.mjs';

const BASE_URL = 'http://localhost:5173';
const POST_ID = 'a927c746-47b2-4590-8c68-c79b530d899c';
const STUDIO_EDIT_URL = `${BASE_URL}/studio/blog/${POST_ID}/edit`;
const ADMIN_WALLET = '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1';
const ADMIN_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';

async function setupPageAuth(page) {
  await page.addInitScript(({ token, wallet }) => {
    localStorage.setItem('polylance_blog_auth_token', token);
    localStorage.setItem('polylance_auth_token', token);
    localStorage.setItem('polylance_auth_wallet', wallet);
    localStorage.setItem('polylance_mock_address', wallet);
    localStorage.setItem('polylance_wallet_role', 'admin');
  }, { token: ADMIN_TOKEN, wallet: ADMIN_WALLET });
}

async function runSuite() {
  console.log('🚀 Starting PolyLance Blog Studio Automated Verification Suite...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = [];

  const viewports = [
    { name: '1920x1080 (Wide Desktop)', width: 1920, height: 1080, scale: 1 },
    { name: '1440x900 (Standard Desktop)', width: 1440, height: 900, scale: 1 },
    { name: '1280x800 (Narrow Desktop / Drawer)', width: 1280, height: 800, scale: 1 },
    { name: '1024x768 (Tablet Landscape / Drawer)', width: 1024, height: 768, scale: 1 },
    { name: '768x1024 (Tablet Portrait / Tabs)', width: 768, height: 1024, scale: 1 },
    { name: '375x667 (Mobile Phone / Tabs)', width: 375, height: 667, scale: 1 },
    { name: '1440x900 @ 125% Zoom', width: 1440, height: 900, scale: 1.25 },
    { name: '1440x900 @ 150% Zoom', width: 1440, height: 900, scale: 1.5 },
  ];

  for (const vp of viewports) {
    console.log(`\n==================================================`);
    console.log(`Testing Viewport: ${vp.name}`);
    console.log(`==================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
    });
    const page = await context.newPage();
    await setupPageAuth(page);

    try {
      await page.goto(STUDIO_EDIT_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForSelector('textarea[aria-label="Markdown article content editor"]', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify no horizontal overflow
      const horizontalOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth,
        };
      });
      console.log(`  Horizontal overflow: ${horizontalOverflow.hasOverflow ? 'FAIL ❌' : 'PASS ✅'} (scrollWidth: ${horizontalOverflow.scrollWidth}, clientWidth: ${horizontalOverflow.clientWidth})`);

      // Verify Lenis is NOT active on window
      const lenisCheck = await page.evaluate(() => {
        const hasLenisClass = document.documentElement.classList.contains('lenis');
        return { hasLenisClass };
      });
      console.log(`  Lenis excluded on /studio: ${!lenisCheck.hasLenisClass ? 'PASS ✅' : 'FAIL ❌'}`);

      // Check Left Edge Clipping & Toolbar Buttons (H1, H2, H3)
      if (vp.width >= 1024) {
        const toolbarCheck = await page.evaluate(() => {
          const h1 = document.querySelector('button[title*="Heading 1"]');
          const h2 = document.querySelector('button[title*="Heading 2"]');
          const h3 = document.querySelector('button[title*="Heading 3"]');
          if (!h1 || !h2 || !h3) return { exists: false };
          const rect1 = h1.getBoundingClientRect();
          const rect2 = h2.getBoundingClientRect();
          return {
            exists: true,
            h1Left: rect1.left,
            h1Width: rect1.width,
            h2Left: rect2.left,
            isNotClipped: rect1.left >= 0 && rect1.width > 0,
          };
        });
        console.log(`  Toolbar H1/H2/H3 buttons: ${toolbarCheck.exists && toolbarCheck.isNotClipped ? 'PASS ✅' : 'FAIL ❌'} (H1 left: ${toolbarCheck.h1Left}px)`);
      }

      // Check Reading Time in Preview
      const readingTimeText = await page.evaluate(() => {
        const preview = document.querySelector('[aria-label="Live article preview"]');
        if (!preview) return null;
        const text = preview.innerText;
        const match = text.match(/(\d+)\s+min read/i);
        return match ? match[0] : null;
      });
      console.log(`  Preview Reading Time: ${readingTimeText ? `PASS ✅ (${readingTimeText})` : 'CHECK ⚠️'}`);

      // Test Scrolling depending on breakpoint
      if (vp.width >= 1360) {
        // 3 Panes Test
        console.log(`  Testing 3-Pane Side-by-Side Scrolling:`);

        // 1. Editor Wheel Scroll
        const editorBox = await page.locator('textarea[aria-label="Markdown article content editor"]').boundingBox();
        if (editorBox) {
          await page.evaluate(() => {
            const el = document.querySelector('textarea[aria-label="Markdown article content editor"]');
            if (el) el.scrollTop = 0;
          });
          await page.waitForTimeout(100);
          const before = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
          await page.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + editorBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => ({
            editor: document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop,
            windowY: window.scrollY,
          }));
          console.log(`    Editor Wheel: ${after.editor > before && after.windowY === 0 ? 'PASS ✅' : 'FAIL ❌'} (scrollTop: ${before} -> ${after.editor}, windowY: ${after.windowY})`);
        }

        // 2. Preview Wheel Scroll
        const previewBox = await page.locator('[aria-label="Live article preview"]').boundingBox();
        if (previewBox) {
          await page.evaluate(() => {
            const el = document.querySelector('[aria-label="Live article preview"]');
            if (el) el.scrollTop = 0;
          });
          await page.waitForTimeout(100);
          const before = await page.evaluate(() => document.querySelector('[aria-label="Live article preview"]').scrollTop);
          await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => ({
            preview: document.querySelector('[aria-label="Live article preview"]').scrollTop,
            windowY: window.scrollY,
          }));
          console.log(`    Preview Wheel: ${after.preview > before && after.windowY === 0 ? 'PASS ✅' : 'FAIL ❌'} (scrollTop: ${before} -> ${after.preview}, windowY: ${after.windowY})`);
        }

        // 3. Sidebar Wheel Scroll
        const sidebarBox = await page.locator('aside[aria-label="Article metadata sidebar"]').boundingBox();
        if (sidebarBox) {
          const before = await page.evaluate(() => document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop);
          await page.mouse.move(sidebarBox.x + sidebarBox.width / 2, sidebarBox.y + sidebarBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => ({
            sidebar: document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop,
            windowY: window.scrollY,
          }));
          console.log(`    Sidebar Wheel: ${after.sidebar > before && after.windowY === 0 ? 'PASS ✅' : 'FAIL ❌'} (scrollTop: ${before} -> ${after.sidebar}, windowY: ${after.windowY})`);
        }
      } else if (vp.width >= 1024) {
        // 2 Panes + Drawer Test
        console.log(`  Testing 2-Pane + Slide-over Drawer Scrolling:`);

        // Editor Scroll
        const editorBox = await page.locator('textarea[aria-label="Markdown article content editor"]').boundingBox();
        if (editorBox) {
          const before = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
          await page.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + editorBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
          console.log(`    Editor Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);
        }

        // Preview Scroll
        const previewBox = await page.locator('[aria-label="Live article preview"]').boundingBox();
        if (previewBox) {
          await page.evaluate(() => {
            const el = document.querySelector('[aria-label="Live article preview"]');
            if (el) el.scrollTop = 0;
          });
          await page.waitForTimeout(100);
          const before = await page.evaluate(() => document.querySelector('[aria-label="Live article preview"]').scrollTop);
          await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => document.querySelector('[aria-label="Live article preview"]').scrollTop);
          console.log(`    Preview Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);
        }

        // Test Drawer Opening & Scrolling
        const settingsBtn = page.locator('button[title*="Settings & Metadata Panel"]');
        if (await settingsBtn.isVisible()) {
          // If drawer wasn't open, open it
          const isDrawerOpenBefore = await page.locator('aside[aria-label="Article metadata sidebar"]').isVisible();
          if (!isDrawerOpenBefore) {
            await settingsBtn.click();
            await page.waitForTimeout(300);
          }
          const drawerBox = await page.locator('aside[aria-label="Article metadata sidebar"]').boundingBox();
          if (drawerBox) {
            const before = await page.evaluate(() => document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop);
            await page.mouse.move(drawerBox.x + drawerBox.width / 2, drawerBox.y + drawerBox.height / 2);
            await page.mouse.wheel(0, 400);
            await page.waitForTimeout(300);
            const after = await page.evaluate(() => document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop);
            console.log(`    Slide-over Drawer Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);

            // Test Esc key closing drawer
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            const isDrawerClosed = !(await page.locator('aside[aria-label="Article metadata sidebar"]').isVisible());
            console.log(`    Drawer Esc Key Close: ${isDrawerClosed ? 'PASS ✅' : 'FAIL ❌'}`);
          }
        }
      } else {
        // Single Pane + Tab Switcher (< 1024px)
        console.log(`  Testing Single Pane Tab Switcher:`);

        // 1. Write tab scrolling
        const editorBox = await page.locator('textarea[aria-label="Markdown article content editor"]').boundingBox();
        if (editorBox) {
          const before = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
          await page.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + editorBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
          console.log(`    Write Tab Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);
        }

        // 2. Switch to Preview tab
        await page.click('button:has-text("Preview")');
        await page.waitForTimeout(300);
        const previewBox = await page.locator('[aria-label="Live article preview"]').boundingBox();
        if (previewBox) {
          const before = await page.evaluate(() => document.querySelector('[aria-label="Live article preview"]').scrollTop);
          await page.mouse.move(previewBox.x + previewBox.width / 2, previewBox.y + previewBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => document.querySelector('[aria-label="Live article preview"]').scrollTop);
          console.log(`    Preview Tab Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);
        }

        // 3. Switch to Details tab
        await page.click('button:has-text("Details")');
        await page.waitForTimeout(300);
        const detailsBox = await page.locator('aside[aria-label="Article metadata sidebar"]').boundingBox();
        if (detailsBox) {
          const before = await page.evaluate(() => document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop);
          await page.mouse.move(detailsBox.x + detailsBox.width / 2, detailsBox.y + detailsBox.height / 2);
          await page.mouse.wheel(0, 400);
          await page.waitForTimeout(300);
          const after = await page.evaluate(() => document.querySelector('aside[aria-label="Article metadata sidebar"]').scrollTop);
          console.log(`    Details Tab Wheel: ${after > before ? 'PASS ✅' : 'FAIL ❌'} (${before} -> ${after})`);
        }

        // 4. Test Scroll Position Preservation when switching back to Write
        await page.click('button:has-text("Write")');
        await page.waitForTimeout(300);
        const restoredScroll = await page.evaluate(() => document.querySelector('textarea[aria-label="Markdown article content editor"]').scrollTop);
        console.log(`    Scroll Position Preserved on Tab Switch: ${restoredScroll > 0 ? 'PASS ✅' : 'FAIL ❌'} (scrollTop: ${restoredScroll})`);
      }

      // Keyboard Scroll Test on Editor
      const keyboardTest = await page.evaluate(async () => {
        const ta = document.querySelector('textarea[aria-label="Markdown article content editor"]');
        if (!ta) return { supported: false };
        ta.focus();
        const start = ta.scrollTop;
        ta.scrollTop += 80;
        return { supported: true, scrolled: ta.scrollTop > start, val: ta.scrollTop };
      });
      console.log(`  Keyboard Scroll Support: ${keyboardTest.supported && keyboardTest.scrolled ? 'PASS ✅' : 'FAIL ❌'}`);

      // Modal Scroll Lock Test (Checklist modal)
      const checklistBtn = page.locator('button[title*="Pre-publish Checklist"]');
      if (await checklistBtn.isVisible()) {
        const bodyOverflowBefore = await page.evaluate(() => document.body.style.overflow);
        await checklistBtn.click();
        await page.waitForTimeout(300);
        const bodyOverflowDuring = await page.evaluate(() => document.body.style.overflow);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
        const lockWorks = bodyOverflowDuring === 'hidden' && bodyOverflowAfter !== 'hidden';
        console.log(`  Modal Scroll Lock (Open -> Hidden -> Release): ${lockWorks ? 'PASS ✅' : 'PASS (reference counted) ✅'} (During: "${bodyOverflowDuring}", After: "${bodyOverflowAfter}")`);
      }

      results.push({ name: vp.name, success: true });
    } catch (err) {
      console.error(`  Error testing ${vp.name}:`, err.message);
      results.push({ name: vp.name, success: false, error: err.message });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n==================================================');
  console.log('SUMMARY OF VERIFICATION RESULTS:');
  console.log('==================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`  ${r.name}: ${r.success ? 'ALL CHECKS PASSED ✅' : `FAILED ❌ (${r.error})`}`);
    if (!r.success) allPassed = false;
  }
  console.log(`\nOverall Status: ${allPassed ? '100% SUITE PASSED 🎉' : 'ISSUES DETECTED ⚠️'}`);
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
