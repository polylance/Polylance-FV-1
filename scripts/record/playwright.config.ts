import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright recording configuration for PolyLance demo video automation.
 * Fixed viewport 1600x900 @ 30fps with automatic video recording output.
 */
export default defineConfig({
  testDir: './',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1600, height: 900 },
    video: {
      mode: 'on',
      size: { width: 1600, height: 900 },
    },
    trace: 'off',
    colorScheme: 'light',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
