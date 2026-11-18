import { chromium } from '../frontend/node_modules/playwright/index.mjs';

async function audit() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const width of [1440, 1920]) {
    console.log(`\n=================== VIEWPORT WIDTH: ${width}px ===================`);
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const data = await page.evaluate(() => {
      const sects = Array.from(document.querySelectorAll('section, footer'));
      const heroText = document.querySelector('h1')?.getBoundingClientRect();
      const heroContainer = document.querySelector('section:first-of-type div[class*="max-w"]')?.getBoundingClientRect();

      const items = sects.map((s, idx) => {
        const rect = s.getBoundingClientRect();
        const cs = window.getComputedStyle(s);
        const heading = s.querySelector('h1, h2, h3, h4')?.textContent?.trim() || '';
        const container = s.querySelector('div[class*="max-w"]') || s.querySelector('.max-w-\\[1540px\\]') || s.querySelector('.max-w-\\[1280px\\]');
        const cRect = container ? container.getBoundingClientRect() : null;
        const cStyle = container ? window.getComputedStyle(container) : null;

        return {
          idx,
          tag: s.tagName,
          heading: heading.slice(0, 40),
          rect: { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, height: Math.round(rect.height) },
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          container: cRect ? {
            left: Math.round(cRect.left),
            right: Math.round(cRect.right),
            width: Math.round(cRect.width),
            paddingTop: cStyle?.paddingTop,
            paddingBottom: cStyle?.paddingBottom,
          } : null,
        };
      });

      return {
        heroTextLeft: heroText ? Math.round(heroText.left) : null,
        heroContainerLeft: heroContainer ? Math.round(heroContainer.left) : null,
        sections: items,
      };
    });

    console.log(`Hero h1 left: ${data.heroTextLeft}px | Hero container left: ${data.heroContainerLeft}px`);
    for (let i = 0; i < data.sections.length; i++) {
      const s = data.sections[i];
      const prev = i > 0 ? data.sections[i - 1] : null;
      const visualGap = prev ? (s.rect.top - prev.rect.bottom) : 0;
      console.log(`Section ${s.idx} [${s.heading || s.tag}]:
  Height: ${s.rect.height}px | Visual Gap from prev: ${visualGap}px
  Section padding: top=${s.paddingTop}, bottom=${s.paddingBottom}
  Container padding: top=${s.container?.paddingTop}, bottom=${s.container?.paddingBottom}
  Container width=${s.container?.width}px, left=${s.container?.left}px, right=${s.container?.right}px`);
    }
  }
  await browser.close();
}

audit().catch(console.error);
