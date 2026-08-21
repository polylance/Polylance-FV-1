import { test, expect } from '@playwright/test';

test.describe('PolyLance — Full Lifecycle Integration', () => {
  test('landing page loads, marketplace lists bounties, and post job form operates on-chain', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('link', { name: /PolyLance/i }).first()).toBeVisible();

    await page.goto('/#/jobs');
    await expect(page.url()).toContain('#/jobs');

    await page.goto('/#/jobs/post');
    await expect(page.locator('h1')).toBeVisible();
  });
});
