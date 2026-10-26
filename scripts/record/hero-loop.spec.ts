import { test } from '@playwright/test';

/**
 * Scripted Recording: Hero Loop (20-25s seamless loop)
 * Follows Appendix A1 storyboard specifications.
 */
test('record hero loop (20-25s)', async ({ page }) => {
  // Scene 1 (0-4s): Dashboard in Demo Mode
  await page.goto('/#/dashboard?demo=true');
  await page.waitForTimeout(3500);

  // Scene 2 (4-9s): Find Jobs & Filter
  await page.goto('/#/jobs?demo=true');
  await page.waitForTimeout(1000);
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('account abstraction');
  }
  await page.waitForTimeout(3000);

  // Scene 3 (9-14s): Job Detail with Escrow Timeline & FeeBreakdown
  await page.goto('/#/jobs/sample-job-1?demo=true');
  await page.waitForTimeout(4500);

  // Scene 4 (14-19s): Messages Negotiation Thread
  await page.goto('/#/chat?demo=true');
  await page.waitForTimeout(4500);

  // Scene 5 (19-24s): Profile Certificates & Return to Dashboard
  await page.goto('/#/profile/0x2222222222222222222222222222222222222222?demo=true');
  await page.waitForTimeout(3000);
  await page.goto('/#/dashboard?demo=true');
  await page.waitForTimeout(1000);
});
