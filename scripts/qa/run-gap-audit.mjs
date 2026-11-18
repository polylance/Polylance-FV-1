import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Import chromium from playwright installed in frontend
const playwrightPkg = await import(pathToFileURL(path.resolve(rootDir, 'frontend/node_modules/@playwright/test/index.mjs')).href);
const { chromium } = playwrightPkg;

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];

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

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const MODE = process.env.AUDIT_MODE || 'before'; // 'before' | 'after'

async function runAudit() {
  console.log(`Starting PolyLance Clean UI Gap Audit [Mode: ${MODE}]`);
  console.log(`Base URL: ${BASE_URL}`);

  const outputDir = path.resolve(rootDir, `docs/redesign/clean-${MODE}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const auditResults = [];

  for (const route of ROUTES) {
    console.log(`\nAuditing route: ${route.path} (${route.name})`);
    const routeViolations = {
      route: route.path,
      name: route.name,
      isLanding: route.isLanding,
      viewports: {},
    };

    for (const vp of VIEWPORTS) {
      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Pre-seed localStorage to guarantee demo mode and admin privileges
      await page.addInitScript(() => {
        localStorage.setItem('polylance_demo_mode', 'true');
        localStorage.setItem('polylance_tour_dismissed', 'true');
        localStorage.setItem('polylance_demo_role', 'admin');
        sessionStorage.setItem('polylance_admin_bypass', 'true');
      });

      try {
        const targetUrl = `${BASE_URL}/#${route.path}`;
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(600); // Allow layout and font rendering to stabilize

        // Take screenshot
        const screenshotPath = path.join(outputDir, `${route.name}-${vp.width}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Run in-page Gap Audit
        const pageViolations = await page.evaluate(({ isLanding, width }) => {
          const violations = {
            excessiveVerticalGaps: [],
            underfilledCards: [],
            emptyGridSlots: [],
            horizontalBlankRegions: [],
            excessiveTextWidth: [],
          };

          const maxAllowedGap = isLanding ? 96 : 48;
          const mainEl = document.querySelector('main') || document.querySelector('#app') || document.body;

          // 1. Measure vertical gaps between visible block siblings inside main
          const blockEls = Array.from(mainEl.querySelectorAll('section, article, .page-container > div, main > div, [data-section]'))
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              return rect.height > 10 && rect.width > 50 && style.display !== 'none' && style.visibility !== 'hidden';
            });

          for (let i = 0; i < blockEls.length - 1; i++) {
            const currentRect = blockEls[i].getBoundingClientRect();
            const nextRect = blockEls[i + 1].getBoundingClientRect();
            const gap = nextRect.top - currentRect.bottom;
            if (gap > maxAllowedGap && gap < 600) {
              violations.excessiveVerticalGaps.push({
                selector: `${blockEls[i].tagName.toLowerCase()} -> ${blockEls[i + 1].tagName.toLowerCase()}`,
                gap: Math.round(gap),
                maxAllowed: maxAllowedGap,
              });
            }
          }

          // 2. Underfilled cards (visible content height < 50% of card height)
          const cards = Array.from(document.querySelectorAll('.card-editorial, [class*="rounded-"][class*="border"], [class*="Card"]'))
            .filter((card) => {
              const rect = card.getBoundingClientRect();
              const style = window.getComputedStyle(card);
              return rect.height > 120 && rect.width > 100 && style.display !== 'none';
            });

          for (const card of cards) {
            const cardHeight = card.clientHeight;
            const children = Array.from(card.children).filter((c) => {
              const s = window.getComputedStyle(c);
              return s.display !== 'none' && s.visibility !== 'hidden' && s.position !== 'absolute';
            });
            if (children.length > 0) {
              let contentHeight = 0;
              for (const child of children) {
                contentHeight += child.offsetHeight;
              }
              if (contentHeight > 0 && contentHeight < cardHeight * 0.5) {
                violations.underfilledCards.push({
                  selector: card.className.slice(0, 40),
                  cardHeight: Math.round(cardHeight),
                  contentHeight: Math.round(contentHeight),
                  ratio: Math.round((contentHeight / cardHeight) * 100) + '%',
                });
              }
            }
          }

          // 3. Grid rows with empty column slots wider than 240px (excluding last row)
          const grids = Array.from(document.querySelectorAll('[class*="grid"], [style*="display: grid"]'))
            .filter((g) => {
              const s = window.getComputedStyle(g);
              return s.display === 'grid';
            });

          for (const grid of grids) {
            const s = window.getComputedStyle(grid);
            const cols = s.gridTemplateColumns.split(' ').filter(Boolean);
            if (cols.length >= 2) {
              const items = Array.from(grid.children).filter((c) => window.getComputedStyle(c).display !== 'none');
              const totalSlotsInFullRow = cols.length;
              if (items.length > totalSlotsInFullRow) {
                const remainder = items.length % totalSlotsInFullRow;
                // If not last row or incomplete row has gap > 240px
                const colWidth = grid.clientWidth / totalSlotsInFullRow;
                if (colWidth > 240 && remainder !== 0 && items.length > totalSlotsInFullRow * 2) {
                  violations.emptyGridSlots.push({
                    gridClass: grid.className.slice(0, 40),
                    columns: totalSlotsInFullRow,
                    itemsCount: items.length,
                    slotWidth: Math.round(colWidth),
                  });
                }
              }
            }
          }

          // 4. Horizontal blank regions wider than 320px beside cards in 2-column layouts
          const twoColContainers = Array.from(document.querySelectorAll('[class*="grid-cols-12"], [class*="lg:grid-cols-3"], [class*="lg:grid-cols-4"], [class*="gap-6"], [class*="gap-8"]'))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 700;
            });

          for (const container of twoColContainers) {
            const cols = Array.from(container.children).filter((c) => {
              const s = window.getComputedStyle(c);
              return s.display !== 'none' && c.getBoundingClientRect().height > 80;
            });
            if (cols.length === 2) {
              const col1 = cols[0].getBoundingClientRect();
              const col2 = cols[1].getBoundingClientRect();
              const heightDiff = Math.abs(col1.height - col2.height);
              if (heightDiff > 320 && (col1.width > 280 || col2.width > 280)) {
                violations.horizontalBlankRegions.push({
                  container: container.className.slice(0, 40),
                  heightDifference: Math.round(heightDiff),
                  shorterColumn: col1.height < col2.height ? 'left' : 'right',
                });
              }
            }
          }

          // 5. Text blocks wider than 80ch (~720px) without container constraint
          const textBlocks = Array.from(document.querySelectorAll('p, .text-body, .text-lead, article p'))
            .filter((p) => {
              const s = window.getComputedStyle(p);
              const textLen = (p.textContent || '').trim().length;
              return textLen > 90 && p.clientWidth > 760 && s.display !== 'none';
            });

          for (const tb of textBlocks) {
            violations.excessiveTextWidth.push({
              selector: (tb.className || tb.tagName).slice(0, 40),
              width: Math.round(tb.clientWidth),
              snippet: (tb.textContent || '').trim().slice(0, 50) + '...',
            });
          }

          return violations;
        }, { isLanding: route.isLanding, width: vp.width });

        routeViolations.viewports[vp.width] = pageViolations;
      } catch (err) {
        console.error(`Error auditing ${route.path} at ${vp.width}px:`, err.message);
        routeViolations.viewports[vp.width] = {
          error: err.message,
          excessiveVerticalGaps: [],
          underfilledCards: [],
          emptyGridSlots: [],
          horizontalBlankRegions: [],
          excessiveTextWidth: [],
        };
      } finally {
        await page.close();
      }
    }

    auditResults.push(routeViolations);
  }

  await browser.close();

  // Generate markdown report
  const reportPath = path.resolve(rootDir, `docs/redesign/gap-report-${MODE}.md`);
  let totalViolations = 0;
  let gapCount = 0;
  let cardCount = 0;
  let gridCount = 0;
  let blankRegionCount = 0;
  let textWidthCount = 0;

  let reportMd = `# PolyLance UI Gap Audit Report (${MODE.toUpperCase()})\n\n`;
  reportMd += `**Date:** ${new Date().toISOString()}\n`;
  reportMd += `**Audited Routes:** ${ROUTES.length}\n`;
  reportMd += `**Viewports:** 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide desktop)\n\n`;

  reportMd += `## Summary of Violations\n\n`;
  reportMd += `| Route | Path | Viewport | Vertical Gaps (>48px / 96px) | Underfilled Cards (<50%) | Empty Grid Slots (>240px) | Horizontal Blank Regions (>320px) | Text Width (>80ch / 720px) | Total |\n`;
  reportMd += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const r of auditResults) {
    for (const [vpWidth, v] of Object.entries(r.viewports)) {
      const gaps = v.excessiveVerticalGaps?.length || 0;
      const cards = v.underfilledCards?.length || 0;
      const grids = v.emptyGridSlots?.length || 0;
      const blanks = v.horizontalBlankRegions?.length || 0;
      const texts = v.excessiveTextWidth?.length || 0;
      const subtotal = gaps + cards + grids + blanks + texts;

      gapCount += gaps;
      cardCount += cards;
      gridCount += grids;
      blankRegionCount += blanks;
      textWidthCount += texts;
      totalViolations += subtotal;

      if (subtotal > 0 || vpWidth === '1280') {
        reportMd += `| ${r.name} | \`${r.route}\` | ${vpWidth}px | ${gaps} | ${cards} | ${grids} | ${blanks} | ${texts} | **${subtotal}** |\n`;
      }
    }
  }

  reportMd += `\n### Aggregate Metrics\n\n`;
  reportMd += `- **Total Violations:** ${totalViolations}\n`;
  reportMd += `- **Excessive Vertical Gaps:** ${gapCount}\n`;
  reportMd += `- **Underfilled Cards (<50%):** ${cardCount}\n`;
  reportMd += `- **Empty Grid Slots:** ${gridCount}\n`;
  reportMd += `- **Horizontal Blank Regions:** ${blankRegionCount}\n`;
  reportMd += `- **Text Blocks >80ch:** ${textWidthCount}\n\n`;

  reportMd += `## Detailed Violations by Route\n\n`;

  for (const r of auditResults) {
    const hasAny = Object.values(r.viewports).some(
      (v) => (v.excessiveVerticalGaps?.length || 0) + (v.underfilledCards?.length || 0) + (v.emptyGridSlots?.length || 0) + (v.horizontalBlankRegions?.length || 0) + (v.excessiveTextWidth?.length || 0) > 0
    );

    if (hasAny) {
      reportMd += `### ${r.name} (\`${r.route}\`)\n\n`;
      for (const [vpWidth, v] of Object.entries(r.viewports)) {
        if (v.excessiveVerticalGaps?.length > 0) {
          reportMd += `- **[${vpWidth}px] Vertical Gaps:**\n`;
          for (const g of v.excessiveVerticalGaps) {
            reportMd += `  - \`${g.selector}\`: **${g.gap}px** (Limit: ${g.maxAllowed}px)\n`;
          }
        }
        if (v.underfilledCards?.length > 0) {
          reportMd += `- **[${vpWidth}px] Underfilled Cards:**\n`;
          for (const c of v.underfilledCards) {
            reportMd += `  - \`${c.selector}\`: Height ${c.cardHeight}px, content only ${c.contentHeight}px (${c.ratio})\n`;
          }
        }
        if (v.horizontalBlankRegions?.length > 0) {
          reportMd += `- **[${vpWidth}px] Horizontal Blank Regions:**\n`;
          for (const b of v.horizontalBlankRegions) {
            reportMd += `  - \`${b.container}\`: Shorter ${b.shorterColumn} column leaves **${b.heightDifference}px** blank region\n`;
          }
        }
        if (v.excessiveTextWidth?.length > 0) {
          reportMd += `- **[${vpWidth}px] Text >80ch Width:**\n`;
          for (const t of v.excessiveTextWidth) {
            reportMd += `  - Width ${t.width}px: "${t.snippet}"\n`;
          }
        }
      }
      reportMd += `\n`;
    }
  }

  fs.writeFileSync(reportPath, reportMd, 'utf8');
  console.log(`\nAudit completed! Report written to ${reportPath}`);
  console.log(`Total Violations Flagged: ${totalViolations}`);
  console.log(`- Vertical Gaps: ${gapCount}`);
  console.log(`- Underfilled Cards: ${cardCount}`);
  console.log(`- Empty Grid Slots: ${gridCount}`);
  console.log(`- Horizontal Blank Regions: ${blankRegionCount}`);
  console.log(`- Text Blocks >80ch: ${textWidthCount}`);
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
