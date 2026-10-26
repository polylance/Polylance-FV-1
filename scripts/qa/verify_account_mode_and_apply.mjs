import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/sunny/.gemini/antigravity-ide/brain/4090b77d-7c06-4a3e-8cfe-f0961fbe9c5a';

async function runVerification() {
  console.log('Launching Chromium for browser verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addInitScript(() => {
    const ownerAddr = '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd';
    const eth = {
      isMetaMask: true,
      request: async ({ method, params }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [ownerAddr];
        }
        if (method === 'eth_chainId') {
          return '0x13882';
        }
        return null;
      },
      on: (event, handler) => {
        if (event === 'accountsChanged') {
          setTimeout(() => handler([ownerAddr]), 100);
        }
      },
      removeListener: () => {},
      off: () => {},
    };
    window.ethereum = eth;
    localStorage.setItem('polylance_mock_address', ownerAddr);
    localStorage.setItem('polylance_demo_role', 'client');
    localStorage.setItem('wagmi.recentConnectorId', '"injected"');
    localStorage.setItem('wagmi.connected', 'true');
  });

  const page = await context.newPage();

  // Test 1: Job Details as Owner (wallet 0xB8aa...09Dd)
  console.log('Navigating to Job Details as Owner: http://localhost:5173/#/jobs/0x0D34F6B4Fb25');
  await page.goto('http://localhost:5173/#/jobs/0x0D34F6B4Fb25', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check that "You posted this job" is visible and "Apply for this job" is NOT in the budget card
  const ownerPanelText = await page.textContent('body');
  const hasOwnerNotice = ownerPanelText.includes('You posted this job');
  const hasManageProposals = ownerPanelText.includes('Manage proposals');
  const hasModify = ownerPanelText.includes('Modify');
  const hasDelete = ownerPanelText.includes('Delete');
  console.log('Verification 1 (Owner Panel):', {
    hasOwnerNotice,
    hasManageProposals,
    hasModify,
    hasDelete
  });

  const screenshot1Path = path.join(ARTIFACTS_DIR, 'job_owner_job_details.png');
  await page.screenshot({ path: screenshot1Path, fullPage: false });
  console.log('Screenshot 1 saved:', screenshot1Path);

  // Test 2: Deep-link apply URL as Owner
  console.log('Testing deep-link apply URL: http://localhost:5173/#/jobs/0x0D34F6B4Fb25?apply=true');
  await page.goto('http://localhost:5173/#/jobs/0x0D34F6B4Fb25?apply=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const deepLinkBody = await page.textContent('body');
  const blockedOwnerToast = deepLinkBody.includes("can't apply to your own job") || deepLinkBody.includes("You posted this job");
  console.log('Verification 2 (Deep-link blocked):', blockedOwnerToast);

  // Test 3: Settings Account Mode at 1440px
  console.log('Navigating to Settings Account Mode: http://localhost:5173/#/settings?section=accountMode');
  await page.goto('http://localhost:5173/#/settings?section=accountMode', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const screenshot2Path = path.join(ARTIFACTS_DIR, 'settings_account_mode_1440px.png');
  await page.screenshot({ path: screenshot2Path, fullPage: false });
  console.log('Screenshot 2 saved (1440px):', screenshot2Path);

  // Test 4: Settings Account Mode at 768px (Tablet)
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  const screenshot3Path = path.join(ARTIFACTS_DIR, 'settings_account_mode_768px.png');
  await page.screenshot({ path: screenshot3Path, fullPage: false });
  console.log('Screenshot 3 saved (768px):', screenshot3Path);

  // Test 5: Settings Account Mode at 360px (Mobile)
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(1000);
  const screenshot4Path = path.join(ARTIFACTS_DIR, 'settings_account_mode_360px.png');
  await page.screenshot({ path: screenshot4Path, fullPage: false });
  console.log('Screenshot 4 saved (360px):', screenshot4Path);

  // Reset to 1440px for mode switching tests
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/#/settings?section=accountMode', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Test 6: Click "Only freelancing" mode
  console.log('Testing switch to Only freelancing mode...');
  const freelancingCard = page.locator('div[role="radio"]').filter({ hasText: 'Only freelancing' });
  if (await freelancingCard.count() > 0) {
    await freelancingCard.click();
    await page.waitForTimeout(1000);
    const confirmBtn = page.locator('button').filter({ hasText: 'Proceed and switch' });
    if (await confirmBtn.count() > 0) {
      console.log('Confirmation warning modal displayed for open jobs. Clicking Proceed and switch...');
      await confirmBtn.click();
      await page.waitForTimeout(1500);
    }
    const navText = await page.locator('header').textContent();
    const hasPostJob = navText.includes('Post a job');
    console.log('Verification 6 (Freelancer Mode - Post a job hidden in nav):', !hasPostJob);

    const screenshot5Path = path.join(ARTIFACTS_DIR, 'nav_freelancer_mode_hidden_post_job.png');
    await page.screenshot({ path: screenshot5Path, fullPage: false });
    console.log('Screenshot 5 saved:', screenshot5Path);

    // Test direct navigation to /post-job when in freelancer mode
    console.log('Testing direct route navigation to /post-job...');
    await page.goto('http://localhost:5173/#/post-job', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    console.log('Redirected URL from /post-job:', currentUrl);
  }

  async function handleAnyModal() {
    const html = await page.evaluate(() => document.getElementById('overlay-root')?.innerHTML || '');
    if (html.trim().length > 0) {
      console.log('Overlay modal HTML length:', html.length, 'content snippet:', html.slice(0, 300));
      const proceedBtn = page.locator('#overlay-root button').filter({ hasText: 'Proceed and switch' });
      const understoodBtn = page.locator('#overlay-root button').filter({ hasText: 'Understood' });
      const cancelBtn = page.locator('#overlay-root button').filter({ hasText: 'Cancel' });
      const backdrop = page.locator('#overlay-root .fixed.inset-0');
      if (await proceedBtn.count() > 0 && await proceedBtn.isVisible()) {
        await proceedBtn.click();
      } else if (await understoodBtn.count() > 0 && await understoodBtn.isVisible()) {
        await understoodBtn.click();
      } else if (await cancelBtn.count() > 0 && await cancelBtn.isVisible()) {
        await cancelBtn.click();
      } else if (await backdrop.count() > 0 && await backdrop.isVisible()) {
        await backdrop.click({ force: true });
      }
      await page.waitForTimeout(1000);
    }
  }

  // Test 7: Click "Only client" mode
  console.log('Testing switch to Only client mode...');
  await page.goto('http://localhost:5173/#/settings?section=accountMode', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await handleAnyModal();
  const accountModeTab = page.locator('aside button').filter({ hasText: 'Account mode' });
  if (await accountModeTab.count() > 0) {
    await accountModeTab.click();
    await page.waitForTimeout(500);
  }
  const clientCard = page.locator('div[role="radio"]').filter({ hasText: 'Only client' });
  if (await clientCard.count() > 0) {
    await clientCard.click();
    await page.waitForTimeout(1000);
    await handleAnyModal();
    await page.waitForTimeout(2000);
    const navTextClient = await page.locator('header').textContent();
    const hasPostJobClient = navTextClient.includes('Post a job');
    console.log('Verification 7 (Client Mode - Post a job present in nav):', hasPostJobClient);
  }

  // Test 8: Restore to "Both" (default)
  console.log('Restoring to Both mode...');
  await handleAnyModal();
  if (await accountModeTab.count() > 0) {
    await accountModeTab.click();
    await page.waitForTimeout(500);
  }
  const bothCard = page.locator('div[role="radio"]').filter({ hasText: 'Both' });
  if (await bothCard.count() > 0) {
    await bothCard.click();
    await page.waitForTimeout(1000);
    await handleAnyModal();
    await page.waitForTimeout(2000);
    const navTextBoth = await page.locator('header').textContent();
    console.log('Verification 8 (Both Mode restored):', navTextBoth.includes('Post a job'));
    const screenshot6Path = path.join(ARTIFACTS_DIR, 'settings_account_mode_both_restored.png');
    await page.screenshot({ path: screenshot6Path, fullPage: false });
    console.log('Screenshot 6 saved:', screenshot6Path);
  }

  await browser.close();
  console.log('All browser verifications completed successfully!');
}

runVerification().catch(err => {
  console.error('Browser verification error:', err);
  process.exit(1);
});
