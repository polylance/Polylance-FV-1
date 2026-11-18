import { test, expect } from '@playwright/test';

test.describe('Video Loading & Network Budget Enforcement', () => {

  test('assert ZERO media requests on initial page load before scrolling', async ({ page }) => {
    const mediaRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url().toLowerCase();
      if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        mediaRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Without scrolling or missing media, there should be zero uncoordinated video fetches
    expect(mediaRequests.length).toBe(0);
  });

  test('assert zero media requests under reduced-motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const mediaRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url().toLowerCase();
      if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        mediaRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll through the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Reduced motion must prevent all autoplay/ambient video loading
    expect(mediaRequests.length).toBe(0);
  });

  test('assert maximum of 1 playing video across the page when videos are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check count of playing videos
    const playingCount = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.filter((v) => !v.paused && !v.ended).length;
    });

    expect(playingCount).toBeLessThanOrEqual(1);
  });

});
