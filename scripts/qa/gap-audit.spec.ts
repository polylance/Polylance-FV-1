import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'landing', isLanding: true },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/jobs', name: 'findjobs' },
  { path: '/jobs/sample-job-1', name: 'jobdetail' },
  { path: '/post-job', name: 'postjob' },
  { path: '/workspace', name: 'workspace' },
  { path: '/chat', name: 'chat' },
  { path: '/profile', name: 'profile' },
  { path: '/reputation', name: 'reputation' },
  { path: '/settings', name: 'settings' },
  { path: '/certifiedpass', name: 'certifiedpass' },
  { path: '/certificate/1', name: 'certificate' },
  { path: '/attestation/1', name: 'attestation' },
  { path: '/audit', name: 'audit' },
  { path: '/judge', name: 'judge' },
  { path: '/dao', name: 'dao' },
  { path: '/treasury', name: 'treasury' },
  { path: '/analytics', name: 'analytics' },
  { path: '/login', name: 'login' },
  { path: '/help', name: 'help' },
  { path: '/demo', name: 'demo' },
  { path: '/terms', name: 'terms' },
  { path: '/privacy', name: 'privacy' },
  { path: '/security', name: 'security' },
  { path: '/disclaimer', name: 'disclaimer' },
  { path: '/manifesto', name: 'manifesto' },
];

const VIEWPORTS = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 900, name: 'desktop' },
  { width: 1920, height: 1080, name: 'wide' },
];

test.describe('PolyLance Clean UI Gap Audit', () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route.name} (${vp.width}px) passes spacing and layout density checks`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.addInitScript(() => {
          localStorage.setItem('polylance_demo_mode', 'true');
          localStorage.setItem('polylance_tour_dismissed', 'true');
          localStorage.setItem('polylance_demo_role', 'admin');
          sessionStorage.setItem('polylance_admin_bypass', 'true');
        });

        await page.goto(`http://localhost:5173/#${route.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(400);

        const violations = await page.evaluate(({ isLanding }) => {
          const maxGap = isLanding ? 96 : 48;
          const mainEl = document.querySelector('main') || document.querySelector('#app') || document.body;
          const blocks = Array.from(mainEl.querySelectorAll('section, article, .page-container > div, main > div'))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              const s = window.getComputedStyle(el);
              return r.height > 10 && r.width > 50 && s.display !== 'none';
            });

          let excessiveGaps = 0;
          for (let i = 0; i < blocks.length - 1; i++) {
            const gap = blocks[i + 1].getBoundingClientRect().top - blocks[i].getBoundingClientRect().bottom;
            if (gap > maxGap && gap < 600) excessiveGaps++;
          }

          return { excessiveGaps };
        }, { isLanding: route.isLanding });

        expect(violations.excessiveGaps).toBeLessThanOrEqual(2);
      });
    }
  }
});
