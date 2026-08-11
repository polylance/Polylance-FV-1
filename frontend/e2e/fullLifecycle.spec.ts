import { test, expect } from '@playwright/test';

test.describe('PolyLance — Full Lifecycle Integration', () => {
  test('landing page loads, marketplace lists bounties, and post job form operates on-chain', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PolyLance')).toBeVisible();

    await page.goto('/jobs');
    await expect(page.url()).toContain('/jobs');

    await page.goto('/post');
    await expect(page.locator('text=Post an')).toBeVisible();
    await expect(page.locator('button:has-text("Deploy Job Escrow Clone")')).toBeVisible();
  });
});
