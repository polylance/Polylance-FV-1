import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const AUTH_TOKEN = 'eyJ3YWxsZXQiOiIweGIzMGYyZWZiY2ViYzUyOWQ5NDZlMDVjOWNjZTBmMWZmZmI3ZTFhYjEiLCJpYXQiOjE3OTI5MTg1NTc2NzgsImV4cCI6MTc5MzAwNDk1NzY3OH0.go8-BVsTGYxuJPOsOAKD2moCJX-9lvuCApOLUOh-Dww';
const ADMIN_WALLET = '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1';
const NON_TEAM_WALLET = '0x1111111111111111111111111111111111111111';

import crypto from 'crypto';

const SESSION_SECRET = "polylance-crypto-session-secret-2026-strict-key-secure";

function createMockSessionToken(wallet) {
  const normalizedWallet = wallet.toLowerCase().trim();
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ wallet: normalizedWallet, iat: now, exp: expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

const NON_TEAM_TOKEN = createMockSessionToken(NON_TEAM_WALLET);

const SCREENSHOT_DIR = path.resolve('C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e');

async function testBackendEndpoints() {
  console.log('\n======================================================');
  console.log('1. TESTING BACKEND /api/studio/me ENDPOINT CONTRACT');
  console.log('======================================================');

  // Test 1: Authenticated admin
  const resAdmin = await fetch('http://localhost:3001/api/studio/me', {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });
  console.log('Admin request status:', resAdmin.status);
  const dataAdmin = await resAdmin.json();
  console.log('Admin response data:', dataAdmin);
  console.log('Cache-Control header:', resAdmin.headers.get('cache-control'));
  if (resAdmin.status !== 200 || dataAdmin.role !== 'admin' || !dataAdmin.active) {
    throw new Error('Admin contract failed!');
  }
  if (!resAdmin.headers.get('cache-control')?.includes('no-store')) {
    throw new Error('Cache-Control no-store header missing on /api/studio/me');
  }

  // Test 2: Authenticated non-team member (MUST return 200 with role: null, NOT 403!)
  const resNonTeam = await fetch('http://localhost:3001/api/studio/me', {
    headers: { Authorization: `Bearer ${NON_TEAM_TOKEN}` }
  });
  console.log('Non-team request status (must be 200, not 403):', resNonTeam.status);
  const dataNonTeam = await resNonTeam.json();
  console.log('Non-team response data:', dataNonTeam);
  if (resNonTeam.status !== 200 || dataNonTeam.role !== null || dataNonTeam.active !== false) {
    throw new Error(`Non-team contract failed! Expected 200 role:null, got ${resNonTeam.status} ${JSON.stringify(dataNonTeam)}`);
  }

  // Test 3: Unauthenticated request (MUST return 401)
  const resUnauth = await fetch('http://localhost:3001/api/studio/me');
  console.log('Unauthenticated request status (must be 401):', resUnauth.status);
  if (resUnauth.status !== 401) {
    throw new Error(`Unauthenticated contract failed! Expected 401, got ${resUnauth.status}`);
  }

  console.log('✓ All Backend endpoint contract tests PASSED!');
}

async function testPartA_Scrolling() {
  console.log('\n======================================================');
  console.log('2. TESTING PART A: SCROLLING AUDIT ACROSS ALL ROUTES');
  console.log('======================================================');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const routesToTest = [
    { name: 'Studio Editor', url: 'http://localhost:5173/studio/blog/a927c746-47b2-4590-8c68-c79b530d899c/edit', expectFixedShell: true },
    { name: 'Studio Blog Dashboard', url: 'http://localhost:5173/studio/blog', expectFixedShell: false },
    { name: 'Studio Media Library', url: 'http://localhost:5173/studio/blog/media', expectFixedShell: false },
    { name: 'Studio Team Management', url: 'http://localhost:5173/studio/blog/team', expectFixedShell: false },
    { name: 'Public Blog', url: 'http://localhost:5173/blog', expectFixedShell: false },
    { name: 'Landing Page', url: 'http://localhost:5173/', expectFixedShell: false },
    { name: 'Find Jobs', url: 'http://localhost:5173/jobs', expectFixedShell: false },
    { name: 'Dashboard', url: 'http://localhost:5173/dashboard', expectFixedShell: false },
    { name: 'Workspace', url: 'http://localhost:5173/workspace', expectFixedShell: false },
    { name: 'Messages / Chat', url: 'http://localhost:5173/chat', expectFixedShell: true },
    { name: 'AuditX Security', url: 'http://localhost:5173/auditx', expectFixedShell: false },
    { name: 'Fee Schedule', url: 'http://localhost:5173/fees', expectFixedShell: false },
    { name: 'Terms of Service', url: 'http://localhost:5173/terms', expectFixedShell: false },
  ];

  const viewports = [
    { width: 1920, height: 1080, name: '1920px Desktop' },
    { width: 1440, height: 900, name: '1440px Laptop' },
    { width: 1024, height: 768, name: '1024px Tablet Landscape' },
    { width: 768, height: 1024, name: '768px Tablet Portrait' },
    { width: 375, height: 667, name: '375px Mobile' },
    { width: 1440, height: 900, deviceScaleFactor: 1.5, name: '1440px @ 150% Zoom' },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height}${vp.deviceScaleFactor ? ' @ ' + vp.deviceScaleFactor * 100 + '%' : ''})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor || 1,
    });

    await context.addInitScript(({ token, adminWallet }) => {
      localStorage.setItem('polylance_mock_address', adminWallet);
      localStorage.setItem('polylance_auth_wallet', adminWallet);
      localStorage.setItem('polylance_auth_token', token);
      localStorage.setItem('polylance_session_token', token);
      localStorage.setItem('polylance_blog_auth_token', token);
    }, { token: AUTH_TOKEN, adminWallet: ADMIN_WALLET });

    const page = await context.newPage();

    for (const r of routesToTest) {
      await page.goto(r.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const check = await page.evaluate((expectFixed) => {
        const docEl = document.documentElement;
        const body = document.body;
        const main = document.querySelector('main');
        const motion = main?.querySelector(':scope > div');

        const csHtml = window.getComputedStyle(docEl);
        const csBody = window.getComputedStyle(body);
        const csMain = main ? window.getComputedStyle(main) : null;
        const csMotion = motion ? window.getComputedStyle(motion) : null;

        const scrollHeight = document.scrollingElement?.scrollHeight || 0;
        const clientHeight = document.scrollingElement?.clientHeight || 0;
        const isScrollable = scrollHeight > clientHeight + 10;

        return {
          url: window.location.pathname,
          htmlOverflow: csHtml.overflowY,
          bodyOverflow: csBody.overflowY,
          bodyPosition: csBody.position,
          mainOverflow: csMain?.overflowY,
          motionOverflow: csMotion?.overflowY,
          scrollHeight,
          clientHeight,
          isScrollable,
        };
      }, r.expectFixedShell);

      // Verify no leaked overflow: hidden on html or body
      if (check.htmlOverflow === 'hidden' && !r.expectFixedShell) {
        throw new Error(`Route ${r.name} (${r.url}) has html overflow: hidden!`);
      }
      if (check.bodyPosition === 'fixed') {
        throw new Error(`Route ${r.name} (${r.url}) has leaked body position: fixed!`);
      }

      // If page is scrollable, send wheel scroll and assert scrollTop increases
      if (check.isScrollable) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(300);

        const newScrollTop = await page.evaluate(() => document.scrollingElement?.scrollTop || 0);
        if (newScrollTop <= 0) {
          throw new Error(`Route ${r.name} (${r.url}) failed to scroll! Expected scrollTop > 0, got ${newScrollTop}`);
        }
      }

      // Special check on Studio Blog dashboard: Verify last row of articles table is reachable
      if (r.name === 'Studio Blog Dashboard') {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);
        const lastRowVisible = await page.evaluate(() => {
          const rows = document.querySelectorAll('table tbody tr');
          if (rows.length === 0) return true;
          const lastRow = rows[rows.length - 1];
          const rect = lastRow.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        });
        if (!lastRowVisible) {
          throw new Error('Studio Blog Dashboard last row of table is not reachable via scroll!');
        }
      }
    }

    await context.close();
  }

  console.log('✓ All routes and viewports verified for scrolling!');
  await browser.close();
}

async function testPartB_RoleHookAndAvatarMenu() {
  console.log('\n======================================================');
  console.log('3. TESTING PART B: ROLE HOOK & AVATAR MENU RELIABILITY');
  console.log('======================================================');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. 20 consecutive reloads as Admin
  console.log('Testing 20 consecutive page loads as Admin to verify 100% menu item presence...');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await adminContext.addInitScript(({ token, adminWallet }) => {
    localStorage.setItem('polylance_mock_address', adminWallet);
    localStorage.setItem('polylance_auth_wallet', adminWallet);
    localStorage.setItem('polylance_auth_token', token);
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_blog_auth_token', token);
  }, { token: AUTH_TOKEN, adminWallet: ADMIN_WALLET });

  const adminPage = await adminContext.newPage();
  await adminPage.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });

  for (let i = 1; i <= 20; i++) {
    await adminPage.reload({ waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(400);

    // Click avatar dropdown button
    const avatarBtn = adminPage.locator('button:has-text("0xb30f")').first();
    await avatarBtn.waitFor({ state: 'visible', timeout: 3000 });
    await avatarBtn.click();

    // Verify Blog Studio link exists with badge "Admin"
    const studioLink = adminPage.locator('a[href="/studio/blog"]:has-text("Blog Studio")');
    await studioLink.waitFor({ state: 'visible', timeout: 2000 });
    const badgeText = await studioLink.locator('span:has-text("Admin")').textContent();

    if (badgeText?.trim() !== 'Admin') {
      throw new Error(`Iteration ${i}: Expected badge "Admin", got "${badgeText}"`);
    }

    // Close avatar menu
    await adminPage.keyboard.press('Escape');
    await adminPage.waitForTimeout(100);
    process.stdout.write(`.`);
  }
  console.log('\n✓ 20/20 reloads successfully displayed Blog Studio with "Admin" badge!');

  // 2. Mobile drawer test at 375px
  console.log('Testing Mobile Drawer at 375px for Blog Studio link...');
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
  await mobileContext.addInitScript(({ token, adminWallet }) => {
    localStorage.setItem('polylance_mock_address', adminWallet);
    localStorage.setItem('polylance_auth_wallet', adminWallet);
    localStorage.setItem('polylance_auth_token', token);
    localStorage.setItem('polylance_session_token', token);
    localStorage.setItem('polylance_blog_auth_token', token);
  }, { token: AUTH_TOKEN, adminWallet: ADMIN_WALLET });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  // Open mobile menu
  const menuBtn = mobilePage.locator('button[aria-label="Open menu"]');
  await menuBtn.click();
  await mobilePage.waitForTimeout(300);

  const mobileStudioLink = mobilePage.locator('a[href="/studio/blog"]:has-text("Blog Studio")');
  await mobileStudioLink.waitFor({ state: 'visible', timeout: 3000 });
  const mobileBadge = await mobileStudioLink.locator('span:has-text("Admin")').textContent();
  if (mobileBadge?.trim() !== 'Admin') {
    throw new Error(`Mobile drawer: Expected badge "Admin", got "${mobileBadge}"`);
  }
  console.log('✓ Mobile drawer verified: Blog Studio present with Admin badge!');

  // 3. Non-team user test (verifying Blog Studio does NOT appear)
  console.log('Testing Non-team user avatar menu...');
  const nonTeamContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await nonTeamContext.addInitScript(({ nonTeamWallet, nonTeamToken }) => {
    localStorage.setItem('polylance_mock_address', nonTeamWallet);
    localStorage.setItem('polylance_auth_wallet', nonTeamWallet);
    localStorage.setItem('polylance_auth_token', nonTeamToken);
    localStorage.setItem('polylance_session_token', nonTeamToken);
    localStorage.setItem('polylance_blog_auth_token', nonTeamToken);
  }, { nonTeamWallet: NON_TEAM_WALLET, nonTeamToken: NON_TEAM_TOKEN });

  const nonTeamPage = await nonTeamContext.newPage();
  await nonTeamPage.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await nonTeamPage.waitForTimeout(600);

  const nonTeamAvatarBtn = nonTeamPage.locator('button:has-text("0x1111")').first();
  await nonTeamAvatarBtn.waitFor({ state: 'visible', timeout: 4000 });
  await nonTeamAvatarBtn.click();
  await nonTeamPage.waitForTimeout(400);

  const nonTeamStudioLink = nonTeamPage.locator('a[href="/studio/blog"]');
  const count = await nonTeamStudioLink.count();
  if (count > 0) {
    throw new Error('Non-team user unexpectedly saw Blog Studio in avatar menu!');
  }
  console.log('✓ Non-team user correctly does NOT see Blog Studio!');
  await nonTeamContext.close();

  await adminContext.close();
  await mobileContext.close();
  await browser.close();
}

async function testPartC_MoreMenu() {
  console.log('\n======================================================');
  console.log('4. TESTING PART C: REORDERED MORE MENU');
  console.log('======================================================');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Desktop 1440px
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);

  const moreBtn = desktopPage.locator('button:has-text("More")');
  await moreBtn.waitFor({ state: 'visible' });
  await moreBtn.click();
  await desktopPage.waitForTimeout(300);

  // Verify group headers in order
  const groupHeaders = await desktopPage.locator('[role="menu"] h4').allTextContents();
  console.log('Desktop More menu group headers:', groupHeaders);

  const expectedHeaders = [
    'Reputation & Governance',
    'Protocol',
    'Legal & Compliance'
  ];

  if (JSON.stringify(groupHeaders.map(s => s.trim())) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`More menu group headers mismatch! Expected ${JSON.stringify(expectedHeaders)}, got ${JSON.stringify(groupHeaders)}`);
  }

  // Verify items in each group
  const group1Items = await desktopPage.locator('[role="menu"] > div:nth-child(1) [role="menuitem"]').allTextContents();
  const group2Items = await desktopPage.locator('[role="menu"] > div:nth-child(2) [role="menuitem"]').allTextContents();
  const group3Items = await desktopPage.locator('[role="menu"] > div:nth-child(3) [role="menuitem"]').allTextContents();

  console.log('Group 1 items:', group1Items.map(s => s.trim()));
  console.log('Group 2 items:', group2Items.map(s => s.trim()));
  console.log('Group 3 items:', group3Items.map(s => s.trim()));

  const expectedG1 = ['Leaderboard & Reputation', 'Attestation Reports', 'DAO Governance', 'Judge Panel'];
  const expectedG2 = ['How It Works', 'Fee Schedule', 'Security Architecture', 'AuditX Security', 'FAQ Hub'];
  const expectedG3 = ['Terms of Service', 'Privacy Policy', 'Risk Notice'];

  const clean = arr => arr.map(s => s.replace(/\s+/g, ' ').trim());

  if (JSON.stringify(clean(group1Items)) !== JSON.stringify(expectedG1)) {
    throw new Error(`Group 1 items mismatch! Got ${JSON.stringify(clean(group1Items))}`);
  }
  if (JSON.stringify(clean(group2Items)) !== JSON.stringify(expectedG2)) {
    throw new Error(`Group 2 items mismatch! Got ${JSON.stringify(clean(group2Items))}`);
  }
  if (JSON.stringify(clean(group3Items)) !== JSON.stringify(expectedG3)) {
    throw new Error(`Group 3 items mismatch! Got ${JSON.stringify(clean(group3Items))}`);
  }

  // Keyboard navigation test: ArrowDown, Escape returns focus to More button
  await desktopPage.keyboard.press('ArrowDown');
  await desktopPage.waitForTimeout(100);
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForTimeout(200);

  const isMoreFocused = await desktopPage.evaluate(() => {
    return document.activeElement?.textContent?.includes('More');
  });
  console.log('Focus returned to More button on Escape:', isMoreFocused);
  if (!isMoreFocused) {
    throw new Error('Focus did not return to More trigger button on Escape!');
  }

  // Re-open for desktop screenshot
  await moreBtn.click();
  await desktopPage.waitForTimeout(300);
  const desktopScreenshotPath = path.join(SCREENSHOT_DIR, 'more_menu_desktop_1440.png');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
  console.log('Saved desktop screenshot to:', desktopScreenshotPath);

  // 2. Mobile 375px
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);

  const mobileMenuBtn = mobilePage.locator('button[aria-label="Open menu"]');
  await mobileMenuBtn.click();
  await mobilePage.waitForTimeout(400);

  const mobileScreenshotPath = path.join(SCREENSHOT_DIR, 'more_menu_mobile_375.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log('Saved mobile screenshot to:', mobileScreenshotPath);

  // Assert mobile drawer group titles in order
  const mobileGroupTitles = await mobilePage.locator('.pt-2.border-t span.uppercase').allTextContents();
  console.log('Mobile drawer group titles:', mobileGroupTitles.map(s => s.trim()));
  if (JSON.stringify(mobileGroupTitles.map(s => s.trim())) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Mobile drawer headers mismatch! Expected ${JSON.stringify(expectedHeaders)}, got ${JSON.stringify(mobileGroupTitles)}`);
  }

  console.log('✓ Part C More menu verified on Desktop and Mobile!');
  await mobileContext.close();
  await desktopContext.close();
}

async function run() {
  try {
    await testBackendEndpoints();
    await testPartA_Scrolling();
    await testPartB_RoleHookAndAvatarMenu();
    await testPartC_MoreMenu();
    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! ALL 3 FIXES VERIFIED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

run();
