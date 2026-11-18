import { test } from '@playwright/test';

/**
 * Scripted Recording: Walkthrough (75-90s product walkthrough)
 * Follows Appendix A2 storyboard specifications.
 */
test('record product walkthrough (75-90s)', async ({ page }) => {
  // Scene 1 (0-8s): Landing Hero & EscrowFlow Diagram
  await page.goto('/#/?demo=true');
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await page.waitForTimeout(4000);

  // Scene 2 (8-20s): Post a Job
  await page.goto('/#/jobs/post?demo=true');
  await page.waitForTimeout(6000);

  // Scene 3 (20-32s): Find and Apply
  await page.goto('/#/jobs?demo=true');
  await page.waitForTimeout(5000);

  // Scene 4 (32-44s): Negotiate in Encrypted Messages
  await page.goto('/#/chat?demo=true');
  await page.waitForTimeout(6000);

  // Scene 5 (44-56s): Fund Escrow & TransactionStatus Stepper
  await page.goto('/#/workspace?demo=true');
  await page.waitForTimeout(6000);

  // Scene 6 (56-68s): Work Submission & Milestone Approval
  await page.goto('/#/jobs/sample-job-1?demo=true');
  await page.waitForTimeout(6000);

  // Scene 7 (68-78s): Profile Reputation & Soulbound Attestation
  await page.goto('/#/profile/0x2222222222222222222222222222222222222222?demo=true');
  await page.waitForTimeout(6000);

  // Scene 8 (78-90s): Dispute Safety Net & Closing Demo CTA
  await page.goto('/#/demo?demo=true');
  await page.waitForTimeout(6000);
});
