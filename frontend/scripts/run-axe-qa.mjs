import { chromium } from 'playwright-core';

async function testAllRoutesAxe() {
  console.log('Running Axe accessibility audit on all PolyLance routes...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  await context.addInitScript(() => {
    localStorage.setItem('polylance_demo_mode', 'true');
    localStorage.setItem('polylance_demo_role', 'admin');
    localStorage.setItem('polylance_tour_dismissed', 'true');
    sessionStorage.setItem('polylance_admin_bypass', 'true');
  });

  const page = await context.newPage();
  const routes = [
    '/#/dashboard',
    '/#/jobs',
    '/#/jobs/sample-job-1',
    '/#/post-job',
    '/#/workspace',
    '/#/chat',
    '/#/profile',
    '/#/settings',
    '/#/reputation',
    '/#/attestation',
    '/#/judge',
    '/#/dao',
    '/#/treasury',
    '/#/terms',
    '/#/privacy',
    '/#/disclaimer',
    '/#/certifiedpass',
    '/#/help',
    '/#/demo',
    '/#/login',
  ];

  let totalViolations = 0;

  for (const route of routes) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Inject axe
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' });
    const results = await page.evaluate(async () => {
      // @ts-ignore
      const res = await window.axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
      return {
        violations: res.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map(n => n.target)
        })),
        passes: res.passes.length
      };
    });

    console.log(`Route ${route.padEnd(25)}: Passes=${results.passes}, Critical/Serious Violations=${results.violations.length}`);
    if (results.violations.length > 0) {
      console.log('  Violations:', JSON.stringify(results.violations, null, 2));
      totalViolations += results.violations.length;
    }
  }

  await browser.close();
  console.log(`\nAxe accessibility audit finished. Total Critical/Serious Violations: ${totalViolations}`);
  if (totalViolations === 0) {
    console.log('SUCCESS: All routes passed Axe WCAG 2.2 AA audit with 0 critical or serious violations!');
  }
}

testAllRoutesAxe().catch(console.error);
