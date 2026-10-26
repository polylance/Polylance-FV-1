import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  console.log('Browser launched successfully!');
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#/terms');
  console.log('Page loaded:', await page.title());
  await browser.close();
  console.log('Done test');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
