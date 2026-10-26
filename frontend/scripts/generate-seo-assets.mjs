#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PAGES_SEO } from '../src/seo/pages.seo';
import { BLOG_POSTS } from '../src/seo/blog.data';
import { SITE_URL, SITE_NAME } from '../src/seo/site.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

console.log('📦 [PolyLance SEO Generator] Generating robots.txt, sitemaps, and llms.txt...');

const today = new Date().toISOString().split('T')[0];

// ── 1. GENERATE ROBOTS.TXT ──
const disallowedRoutes = Object.entries(PAGES_SEO)
  .filter(([_, config]) => config.robots.includes('noindex'))
  .map(([routePath]) => `Disallow: ${routePath}`);

const robotsContent = `# PolyLance Search Engine & Web Crawler Directives
User-agent: *
Allow: /
${disallowedRoutes.join('\n')}
Disallow: /api/
Disallow: /c/
Disallow: /studio/
Disallow: /studio/*

# Sitemap index
Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf-8');
console.log('  ✓ Generated public/robots.txt');

// ── 2. GENERATE SITEMAP-STATIC.XML ──
const staticEntries = Object.entries(PAGES_SEO)
  .filter(([_, config]) => !config.robots.includes('noindex'))
  .map(([routePath, config]) => {
    const loc = `${SITE_URL}${config.canonicalPath || routePath}`;
    const priority = (config.sitemapPriority !== undefined ? config.sitemapPriority : 0.6).toFixed(1);
    const freq = config.changefreq || 'weekly';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries.join('\n')}
</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap-static.xml'), staticSitemap, 'utf-8');
console.log('  ✓ Generated public/sitemap-static.xml');

// ── 3. GENERATE SITEMAP-BLOG.XML ──
const blogEntries = BLOG_POSTS.map((post) => {
  const loc = `${SITE_URL}/blog/${post.slug}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
});

const blogSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogEntries.join('\n')}
</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap-blog.xml'), blogSitemap, 'utf-8');
console.log('  ✓ Generated public/sitemap-blog.xml');

// ── 4. GENERATE SITEMAP-SKILLS.XML ──
const coreSkills = [
  'solidity',
  'smart-contracts',
  'react',
  'typescript',
  'web3',
  'polygon',
  'evm',
  'defi',
  'security-audit',
  'rust'
];

const skillEntries = coreSkills.map((s) => {
  const loc = `${SITE_URL}/skills/${s}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
});

const skillSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${skillEntries.join('\n')}
</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap-skills.xml'), skillSitemap, 'utf-8');
console.log('  ✓ Generated public/sitemap-skills.xml');

// ── 5. GENERATE SITEMAP-JOBS.XML (DYNAMIC BASE) ──
const jobsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/find-jobs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

fs.writeFileSync(path.join(publicDir, 'sitemap-jobs.xml'), jobsSitemap, 'utf-8');
console.log('  ✓ Generated public/sitemap-jobs.xml');

// ── 6. GENERATE SITEMAP.XML (INDEX) ──
const masterSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-skills.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-jobs.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), masterSitemap, 'utf-8');
console.log('  ✓ Generated public/sitemap.xml (Index)');

// ── 7. GENERATE LLMS.TXT (AI DISCOVERY STANDARD) ──
const llmsContent = `# PolyLance
> Decentralized Freelance Marketplace & Escrow on Polygon (Chain ID: 137)

PolyLance (https://polylance.codes) is a non-custodial Web3 freelance marketplace that replaces opaque corporate intermediaries with immutable smart contract escrows on Polygon. Clients deposit funds into escrow milestones; freelancers deliver verified code; funds release instantly upon milestone approval.

## Core Protocol Architecture
- Smart Contract Escrow: Milestone funds locked on Polygon PoS. No platform employee or central entity holds private custody of funds.
- Fee Structure: 2.5% platform fee per side (client pays 2.5% deposit fee, freelancer pays 2.5% payout fee; total platform fee 5.0%).
- Settlement Currencies: Native USDC (Polygon 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359) and POL.
- Work Verification: Soulbound Token (ReputationSBT) non-transferable certificates minted upon verified delivery, backed by GitHub commit verification.
- Dispute Arbitration: Decentralized JudgeDAO council (0xe991e45907Bd341a036CF4A6a95768af198d4b86) handles evidence reviews and rulings with arbitrary split capabilities (0-10000 bps).
- Review Period: 7 days default window after milestone submission. If client takes no action, the freelancer can invoke on-chain claimAutoRelease().
- Audit Status Notice: PolyLance smart contracts have undergone internal security hardening and automated test suites, but have not yet completed an independent third-party audit firm engagement.

## Key Hubs & Documentation
- [How PolyLance Works](${SITE_URL}/how-it-works): 4-step escrow lifecycle from job discovery to SBT minting.
- [Transparent Fee Schedule](${SITE_URL}/fees): Real cost breakdown detailing the 2.5% per side escrow fees with POL and USDC examples.
- [Smart Contract Escrow Safeguards](${SITE_URL}/escrow): Milestone locks, auto-release timers, and mutual cancellation protocols.
- [Security Disclosures & Contract Registry](${SITE_URL}/security): Verified mainnet contract addresses, timelock policies, and audit notices.
- [AuditX Security Engine](${SITE_URL}/auditx): Automated smart contract static analysis and threat monitoring reports.
- [Find Web3 Jobs](${SITE_URL}/find-jobs): Live decentralized marketplace contracts.
- [For Freelancers](${SITE_URL}/for-freelancers): Instant global crypto settlement, zero chargebacks, portable reputation.
- [For Clients](${SITE_URL}/for-clients): Zero hiring subscription fees, milestone protection, top Web3 engineers.
- [Get Paid in USDC](${SITE_URL}/get-paid-in-usdc): Dollar-pegged stablecoin settlement guide with sub-cent Polygon gas.
- [Get Paid in Crypto](${SITE_URL}/get-paid-in-crypto): Cross-border crypto freelancing guide and tax considerations.
- [Web3 Jobs](${SITE_URL}/web3-jobs): Specialized blockchain, DeFi, and smart contract opportunities.
- [Polygon Jobs](${SITE_URL}/polygon-jobs): High-throughput, low-fee Polygon ecosystem contracts.
- [Solidity Jobs](${SITE_URL}/solidity-developer-jobs): Smart contract architecture and security auditing contracts.
- [FAQ Hub](${SITE_URL}/faq): 25 verified policy and technical answers.
- [Authority Blog & Guides](${SITE_URL}/blog): 15 comprehensive educational guides on crypto freelancing, escrow mechanics, and Web3 hiring.

## Mainnet Smart Contract Addresses (Polygon Chain ID 137)
- JobFactory: 0xbE74923BBfd72d400a681915dBcf6e6Adc72C317
- JobEscrowImpl: 0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB
- ReputationSBT: 0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879
- ProfileRegistry: 0xA408070979043215C8C91d245973886eA7c09f42
- GithubReputationRegistry: 0x91e103Fd78ccC3233d08f4830587763F72b9D5aB
- JudgeDAO: 0xe991e45907Bd341a036CF4A6a95768af198d4b86
- TimelockController: 0x45602bE11306651C7FA5c96Bc7fa5051BA4a856f
`;

fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsContent, 'utf-8');
console.log('  ✓ Generated public/llms.txt');

console.log('✨ All SEO assets generated successfully.');
