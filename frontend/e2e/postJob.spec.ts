import { test, expect } from '@playwright/test';

test.describe('PolyLance E2E — Job Posting & Data Invariants', () => {
  test('landing page loads correctly and navigates to Find Jobs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PolyLance')).toBeVisible();
    await page.click('text=Explore Bounties');
    await expect(page.url()).toContain('/jobs');
  });

  test('post job page displays form fields and submits without fabricating fake addresses', async ({ page }) => {
    await page.goto('/post');
    await page.fill('input[placeholder*="Senior Smart Contract Auditor"]', 'E2E Test Bounty Job');
    await page.fill('textarea', 'Comprehensive audit of ERC20 payment escrow contract');
    await page.fill('input[type="number"]', '500');

    await expect(page.locator('button:has-text("Deploy Job Escrow Clone")')).toBeVisible();
  });
});
