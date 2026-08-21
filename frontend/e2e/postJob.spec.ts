import { test, expect } from '@playwright/test';

test.describe('PolyLance E2E — Job Posting & Data Invariants', () => {
  test('landing page loads correctly and navigates to Find Jobs', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('link', { name: /PolyLance/i }).first()).toBeVisible();
    await page.click('text=Browse Jobs (Marketplace)');
    await expect(page.url()).toContain('#/jobs');
  });

  test('post job page loads form header correctly', async ({ page }) => {
    await page.goto('/#/jobs/post');
    await expect(page.locator('h1')).toBeVisible();
  });
});
