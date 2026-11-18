const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // 1. Desktop Test @ 1440px
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Scroll to Features Section and capture complete section
  const featuresSection = page.locator('section:has-text("Built for clarity, speed and security.")');
  await featuresSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take screenshot of entire Bento Section
  await featuresSection.screenshot({
    path: 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e/bento_features_full_section.png',
  });
  console.log('Saved bento_features_full_section.png');

  // Test Details Disclosure on Card 1
  const escrowDetailsBtn = page.locator('article:has-text("Escrow vault") button:has-text("Details")');
  await escrowDetailsBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e/bento_disclosure_open.png',
    fullPage: false,
  });
  console.log('Saved bento_disclosure_open.png');

  // Close disclosure
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Scroll to Footer
  const footer = page.locator('footer');
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e/footer_social_links.png',
    fullPage: false,
  });
  console.log('Saved footer_social_links.png');

  // Verify social links exist and github does NOT exist in footer
  const xLink = await footer.locator('a[href="https://x.com/PolyLance26"]').count();
  const instaLink = await footer.locator('a[href="https://www.instagram.com/polylance/"]').count();
  const linkedinLink = await footer.locator('a[href="https://www.linkedin.com/in/polylance-zenith-5727113ba/"]').count();
  const githubLink = await footer.locator('a[href*="github.com"]').count();

  console.log(`Footer verification: X=${xLink}, Insta=${instaLink}, LinkedIn=${linkedinLink}, GitHub=${githubLink}`);

  // Test 2: Tablet Viewport @ 900px
  const tabletPage = await browser.newPage({ viewport: { width: 900, height: 1000 } });
  await tabletPage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const tabletFeatures = tabletPage.locator('text=Built for clarity, speed and security.');
  await tabletFeatures.scrollIntoViewIfNeeded();
  await tabletPage.waitForTimeout(800);
  await tabletPage.screenshot({
    path: 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e/bento_features_tablet_900.png',
  });
  console.log('Saved bento_features_tablet_900.png');

  // Test 3: Mobile Viewport @ 390px
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const mobileFeatures = mobilePage.locator('text=Built for clarity, speed and security.');
  await mobileFeatures.scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({
    path: 'C:/Users/sunny/.gemini/antigravity-ide/brain/84d39d38-9a99-4b66-875f-cec24335fb5e/bento_features_mobile_390.png',
  });
  console.log('Saved bento_features_mobile_390.png');

  // Test 4: Verify Card Links Navigate Successfully
  // 1. Escrow Link
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const escrowLink = page.locator('article:has-text("Escrow vault") a:has-text("How escrow works")');
  await escrowLink.click();
  await page.waitForTimeout(1000);
  console.log(`Navigated to: ${page.url()}`);

  // 2. Fees Link to Escrow Simulator
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const feeLink = page.locator('article:has-text("Simple, honest fees") a:has-text("Explore Escrow Simulator")');
  await feeLink.click();
  await page.waitForTimeout(1000);
  console.log(`Navigated to: ${page.url()}`);

  // 3. Certificates Link to CertifiedPass
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const certLink = page.locator('article:has-text("Verified work certificates") a:has-text("CertifiedPass Registry")');
  await certLink.click();
  await page.waitForTimeout(1000);
  console.log(`Navigated to: ${page.url()}`);

  await browser.close();
  console.log('All tests completed successfully!');
})();
