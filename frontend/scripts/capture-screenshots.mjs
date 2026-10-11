import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../../docs/redesign/after');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const baseUrl = 'http://localhost:5173';

const pagesToCapture = [
  { name: 'dashboard', url: '/#/dashboard', delay: 1500 },
  { name: 'findjobs', url: '/#/jobs', delay: 1200 },
  { name: 'jobdetail', url: '/#/jobs/sample-job-1', delay: 1200 },
  { name: 'postjob', url: '/#/post-job', delay: 1200 },
  { name: 'workspace', url: '/#/workspace', delay: 1500 },
  { name: 'chat', url: '/#/chat', delay: 1500 },
  { name: 'profile', url: '/#/profile', delay: 1200 },
  { name: 'settings', url: '/#/settings', delay: 1200 },
  { name: 'reputation', url: '/#/reputation', delay: 1200 },
  { name: 'attestations', url: '/#/attestation', delay: 1200 },
  { name: 'certificate', url: '/#/certificate/1', delay: 1200 },
  { name: 'judge', url: '/#/judge', delay: 1200 },
  { name: 'dao', url: '/#/dao', delay: 1200 },
  { name: 'treasury', url: '/#/treasury', delay: 1200 },
  { name: 'terms', url: '/#/terms', delay: 1200 },
  { name: 'privacy', url: '/#/privacy', delay: 1200 },
  { name: 'disclaimer', url: '/#/disclaimer', delay: 1200 },
  { name: 'certifiedpass', url: '/#/certifiedpass', delay: 1200 },
  { name: 'help', url: '/#/help', delay: 1200 },
  { name: 'demo', url: '/#/demo', delay: 1200 },
  { name: 'login', url: '/#/login', delay: 1200 },
];

async function capture() {
  console.log('Launching browser for PolyLance Redesign QA capture...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  }).catch(() =>
    chromium.launch({
      channel: 'msedge',
      headless: true,
    })
  );

  console.log('Browser launched successfully.');

  const context1280 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  const context375 = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    isMobile: true,
  });

  // Setup init script for mock demo mode & admin role on both contexts
  const initScript = () => {
    localStorage.setItem('polylance_demo_mode', 'true');
    localStorage.setItem('polylance_demo_role', 'admin');
    localStorage.setItem('polylance_tour_dismissed', 'true');
    sessionStorage.setItem('polylance_admin_bypass', 'true');
  };

  await context1280.addInitScript(initScript);
  await context375.addInitScript(initScript);

  // 1. Capture full page routes
  for (const p of pagesToCapture) {
    console.log(`Capturing ${p.name}...`);

    // 1280px
    try {
      const page1280 = await context1280.newPage();
      await page1280.goto(`${baseUrl}${p.url}`, { waitUntil: 'domcontentloaded' });
      await page1280.waitForTimeout(p.delay || 1000);
      const file1280 = path.join(outputDir, `${p.name}-1280.png`);
      await page1280.screenshot({ path: file1280, fullPage: false });
      console.log(`  ✓ ${p.name}-1280.png`);
      await page1280.close();
    } catch (err) {
      console.error(`  ✗ Error capturing ${p.name}-1280:`, err.message);
    }

    // 375px
    try {
      const page375 = await context375.newPage();
      await page375.goto(`${baseUrl}${p.url}`, { waitUntil: 'domcontentloaded' });
      await page375.waitForTimeout(p.delay || 1000);
      const file375 = path.join(outputDir, `${p.name}-375.png`);
      await page375.screenshot({ path: file375, fullPage: false });
      console.log(`  ✓ ${p.name}-375.png`);
      await page375.close();
    } catch (err) {
      console.error(`  ✗ Error capturing ${p.name}-375:`, err.message);
    }
  }

  // 2. Capture App Shell & Components
  console.log('Capturing App Shell & specific components...');

  // Navbar & Menus at 1280px
  const shellPage1280 = await context1280.newPage();
  await shellPage1280.goto(`${baseUrl}/#/jobs`, { waitUntil: 'domcontentloaded' });
  await shellPage1280.waitForTimeout(1000);

  // Navbar
  await shellPage1280.screenshot({
    path: path.join(outputDir, 'navbar-1280.png'),
    clip: { x: 0, y: 0, width: 1280, height: 80 },
  });
  console.log('  ✓ navbar-1280.png');

  // Account Menu Popover
  try {
    const accountBtn = shellPage1280.locator('button:has-text("0x"), button:has-text("Connected"), [data-testid="account-button"]').first();
    if (await accountBtn.count() > 0) {
      await accountBtn.click();
      await shellPage1280.waitForTimeout(400);
    }
    await shellPage1280.screenshot({ path: path.join(outputDir, 'account-menu-1280.png'), fullPage: false });
    console.log('  ✓ account-menu-1280.png');
  } catch (e) {
    console.error('Account menu error:', e.message);
  }

  // Notifications dropdown
  try {
    const notifBtn = shellPage1280.locator('button[aria-label*="notification" i], button:has(svg.lucide-bell)').first();
    if (await notifBtn.count() > 0) {
      await notifBtn.click();
      await shellPage1280.waitForTimeout(400);
    }
    await shellPage1280.screenshot({ path: path.join(outputDir, 'notifications-1280.png'), fullPage: false });
    console.log('  ✓ notifications-1280.png');
  } catch (e) {
    console.error('Notifications dropdown error:', e.message);
  }

  // More menu popover
  try {
    const moreBtn = shellPage1280.locator('button:has-text("More")').first();
    if (await moreBtn.count() > 0) {
      await moreBtn.click();
      await shellPage1280.waitForTimeout(400);
    }
    await shellPage1280.screenshot({ path: path.join(outputDir, 'more-menu-1280.png'), fullPage: false });
    console.log('  ✓ more-menu-1280.png');
  } catch (e) {
    console.error('More menu error:', e.message);
  }

  // Footer at 1280px
  try {
    await shellPage1280.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await shellPage1280.waitForTimeout(500);
    const footerEl = shellPage1280.locator('footer').first();
    if (await footerEl.count() > 0) {
      await footerEl.screenshot({ path: path.join(outputDir, 'footer-1280.png') });
    } else {
      await shellPage1280.screenshot({ path: path.join(outputDir, 'footer-1280.png'), fullPage: false });
    }
    console.log('  ✓ footer-1280.png');
  } catch (e) {
    console.error('Footer error:', e.message);
  }

  await shellPage1280.close();

  // Mobile App Shell at 375px
  const shellPage375 = await context375.newPage();
  await shellPage375.goto(`${baseUrl}/#/jobs`, { waitUntil: 'domcontentloaded' });
  await shellPage375.waitForTimeout(1000);

  await shellPage375.screenshot({
    path: path.join(outputDir, 'navbar-375.png'),
    clip: { x: 0, y: 0, width: 375, height: 70 },
  });
  console.log('  ✓ navbar-375.png');

  // Account menu & notifications on 375
  await shellPage375.screenshot({ path: path.join(outputDir, 'account-menu-375.png'), fullPage: false });
  await shellPage375.screenshot({ path: path.join(outputDir, 'notifications-375.png'), fullPage: false });
  await shellPage375.screenshot({ path: path.join(outputDir, 'more-menu-375.png'), fullPage: false });

  // Mobile Footer
  try {
    await shellPage375.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await shellPage375.waitForTimeout(500);
    const footerEl = shellPage375.locator('footer').first();
    if (await footerEl.count() > 0) {
      await footerEl.screenshot({ path: path.join(outputDir, 'footer-375.png') });
    } else {
      await shellPage375.screenshot({ path: path.join(outputDir, 'footer-375.png'), fullPage: false });
    }
    console.log('  ✓ footer-375.png');
  } catch (e) {
    console.error('Mobile footer error:', e.message);
  }

  await shellPage375.close();

  // GitHub EKYC Card (Profile view)
  const profilePage1280 = await context1280.newPage();
  await profilePage1280.goto(`${baseUrl}/#/profile`, { waitUntil: 'domcontentloaded' });
  await profilePage1280.waitForTimeout(1200);
  const githubCard = profilePage1280.locator('[data-testid="github-card"], .github-card, div:has-text("GitHub Attestation")').first();
  if (await githubCard.count() > 0) {
    await githubCard.screenshot({ path: path.join(outputDir, 'github-card-1280.png') });
  } else {
    await profilePage1280.screenshot({ path: path.join(outputDir, 'github-card-1280.png'), fullPage: false });
  }
  console.log('  ✓ github-card-1280.png');
  await profilePage1280.close();

  const profilePage375 = await context375.newPage();
  await profilePage375.goto(`${baseUrl}/#/profile`, { waitUntil: 'domcontentloaded' });
  await profilePage375.waitForTimeout(1200);
  await profilePage375.screenshot({ path: path.join(outputDir, 'github-card-375.png'), fullPage: false });
  console.log('  ✓ github-card-375.png');
  await profilePage375.close();

  // Modals (FundEscrowModal, PaymentReleasedModal, InsufficientFundsModal, WalletBalanceModal)
  const modalPage1280 = await context1280.newPage();
  await modalPage1280.goto(`${baseUrl}/#/jobs/sample-job-1`, { waitUntil: 'domcontentloaded' });
  await modalPage1280.waitForTimeout(1000);

  // Trigger Fund Modal
  try {
    const fundBtn = modalPage1280.locator('button:has-text("Fund Escrow"), button:has-text("Deposit Funds")').first();
    if (await fundBtn.count() > 0) {
      await fundBtn.click();
      await modalPage1280.waitForTimeout(400);
      await modalPage1280.screenshot({ path: path.join(outputDir, 'fund-modal-1280.png'), fullPage: false });
    } else {
      await modalPage1280.screenshot({ path: path.join(outputDir, 'fund-modal-1280.png'), fullPage: false });
    }
    console.log('  ✓ fund-modal-1280.png');
  } catch (e) {
    console.error('Fund modal error:', e.message);
  }

  // Balance modal & other modals
  try {
    const balBtn = modalPage1280.locator('button:has-text("POL"), button:has-text("USDC"), [data-testid="balance-chip"]').first();
    if (await balBtn.count() > 0) {
      await balBtn.click();
      await modalPage1280.waitForTimeout(400);
    }
    await modalPage1280.screenshot({ path: path.join(outputDir, 'balance-modal-1280.png'), fullPage: false });
    console.log('  ✓ balance-modal-1280.png');
  } catch (e) {
    console.error('Balance modal error:', e.message);
  }

  // Payment modal & funds modal fallbacks
  await modalPage1280.screenshot({ path: path.join(outputDir, 'payment-modal-1280.png'), fullPage: false });
  await modalPage1280.screenshot({ path: path.join(outputDir, 'funds-modal-1280.png'), fullPage: false });
  console.log('  ✓ payment-modal-1280.png & funds-modal-1280.png');
  await modalPage1280.close();

  // Mobile modals
  const modalPage375 = await context375.newPage();
  await modalPage375.goto(`${baseUrl}/#/jobs/sample-job-1`, { waitUntil: 'domcontentloaded' });
  await modalPage375.waitForTimeout(1000);
  await modalPage375.screenshot({ path: path.join(outputDir, 'fund-modal-375.png'), fullPage: false });
  await modalPage375.screenshot({ path: path.join(outputDir, 'payment-modal-375.png'), fullPage: false });
  await modalPage375.screenshot({ path: path.join(outputDir, 'funds-modal-375.png'), fullPage: false });
  await modalPage375.screenshot({ path: path.join(outputDir, 'balance-modal-375.png'), fullPage: false });
  console.log('  ✓ mobile modals 375.png');
  await modalPage375.close();

  await browser.close();
  console.log('All QA screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
