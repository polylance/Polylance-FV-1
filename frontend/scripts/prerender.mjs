#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PAGES_SEO } from '../src/seo/pages.seo';
import { BLOG_POSTS } from '../src/seo/blog.data';
import { FAQ_DATA } from '../src/seo/faq.data';
import { SITE_URL, SITE_NAME, TWITTER_HANDLE } from '../src/seo/site.config';
import { buildJsonLd } from '../src/seo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

console.log('⚡ [PolyLance Prerender] Generating static HTML snapshots for crawlers in dist/...');

const templateHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(templateHtmlPath)) {
  console.error('❌ dist/index.html not found! Please run `npm run build` before prerendering.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');

function renderPageHtml(config, bodyContentHtml, schemas = []) {
  let html = templateHtml;

  // 1. Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${config.title}</title>`);

  // 2. Meta description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${config.description}" />`
  );

  // 3. Canonical link
  const canonicalUrl = config.canonicalPath.startsWith('http')
    ? config.canonicalPath
    : `${SITE_URL}${config.canonicalPath}`;
  html = html.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // 4. Meta robots
  html = html.replace(
    /<meta\s+name="robots"\s+content=".*?"\s*\/?>/i,
    `<meta name="robots" content="${config.robots}" />`
  );

  // 5. Open Graph tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${config.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${config.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // 6. Twitter card tags
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${config.title}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${config.description}" />`
  );

  // 7. Inject JSON-LD Schema
  if (schemas && schemas.length > 0) {
    const jsonLdBlock = schemas
      .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
      .join('\n');
    html = html.replace('</head>', `${jsonLdBlock}\n</head>`);
  }

  // 8. Inject Server-rendered fallback content into <div id="root"></div>
  if (bodyContentHtml) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${bodyContentHtml}</div>`
    );
  }

  return html;
}

let generatedCount = 0;

// ── 1. PRERENDER STATIC PAGES ──
for (const [routePath, config] of Object.entries(PAGES_SEO)) {
  if (config.robots.includes('noindex')) continue;

  const targetDir = routePath === '/'
    ? distDir
    : path.join(distDir, routePath.replace(/^\//, ''));

  fs.mkdirSync(targetDir, { recursive: true });

  // Build semantic fallback HTML
  const relatedFaqs = FAQ_DATA.filter(
    (f) => f.pageId === routePath || (f.pageId === '/faq' && routePath === '/faq')
  );

  const faqHtml = relatedFaqs.length > 0 ? `
    <section class="faq-snapshot" style="max-width:800px;margin:2rem auto;padding:1rem;">
      <h2>Frequently Asked Questions</h2>
      ${relatedFaqs.map(f => `
        <details style="margin-bottom:1rem;border:1px solid #e2e8f0;padding:1rem;border-radius:8px;">
          <summary style="font-weight:bold;cursor:pointer;">${f.question}</summary>
          <p style="margin-top:0.5rem;color:#4a5568;">${f.answer}</p>
        </details>
      `).join('')}
    </section>
  ` : '';

  const fallbackHtml = `
    <header style="max-width:1100px;margin:2rem auto;padding:1rem;text-align:center;">
      <h1 style="font-size:2.25rem;font-weight:800;color:#0b0b0c;">${config.title}</h1>
      <p style="font-size:1.125rem;color:#4b5563;margin-top:1rem;max-width:700px;margin-left:auto;margin-right:auto;">
        ${config.description}
      </p>
    </header>
    <main style="max-width:1100px;margin:1rem auto;padding:1rem;">
      ${faqHtml}
    </main>
  `;

  const schemas = buildJsonLd(config);
  const fullHtml = renderPageHtml(config, fallbackHtml, schemas);

  fs.writeFileSync(path.join(targetDir, 'index.html'), fullHtml, 'utf-8');
  generatedCount++;
}

// ── 2. PRERENDER ALL 15 BLOG POSTS ──
for (const post of BLOG_POSTS) {
  const targetDir = path.join(distDir, 'blog', post.slug);
  fs.mkdirSync(targetDir, { recursive: true });

  const postConfig = {
    path: `/blog/${post.slug}`,
    title: `${post.title} | PolyLance`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}`,
    robots: 'index, follow',
    primaryKeywordId: post.primaryKeywordId,
    secondaryKeywordIds: post.secondaryKeywordIds,
    jsonLdTypes: ['Article', 'BreadcrumbList'],
  };

  const authorName = typeof post.author === 'string' ? post.author : (post.author?.name || 'PolyLance Core Team');
  const faqs = post.faqs || post.faq || [];

  const articleHtml = `
    <article style="max-width:850px;margin:2rem auto;padding:1rem;font-family:system-ui,-apple-system,sans-serif;">
      <nav aria-label="Breadcrumb" style="font-size:0.875rem;margin-bottom:1rem;color:#6b7280;">
        <a href="/" style="color:#0047ab;text-decoration:none;">Home</a> &gt; 
        <a href="/blog" style="color:#0047ab;text-decoration:none;">Blog</a> &gt; 
        <span>${post.title}</span>
      </nav>
      <header style="margin-bottom:2rem;">
        <h1 style="font-size:2.25rem;font-weight:800;color:#0b0b0c;line-height:1.25;">${post.title}</h1>
        <p style="font-size:1.125rem;color:#4b5563;margin-top:0.75rem;">${post.description}</p>
        <div style="font-size:0.875rem;color:#9ca3af;margin-top:1rem;">
          Published: ${post.publishedAt} · ${post.readingTimeMinutes} min read · By ${authorName}
        </div>
      </header>
      <div style="line-height:1.75;font-size:1.0625rem;color:#1f2937;white-space:pre-wrap;">
        ${post.content || post.summary}
      </div>
      ${faqs && faqs.length > 0 ? `
        <section style="margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e7eb;">
          <h2 style="font-size:1.5rem;font-weight:700;">Frequently Asked Questions</h2>
          ${faqs.map(item => `
            <div style="margin-top:1rem;padding:1rem;background:#f8fafc;border-radius:8px;">
              <h3 style="font-size:1.125rem;font-weight:600;color:#0f172a;">${item.question}</h3>
              <p style="margin-top:0.5rem;color:#475569;">${item.answer}</p>
            </div>
          `).join('')}
        </section>
      ` : ''}
    </article>
  `;

  const schemas = buildJsonLd(postConfig, { article: post });
  const fullHtml = renderPageHtml(postConfig, articleHtml, schemas);

  fs.writeFileSync(path.join(targetDir, 'index.html'), fullHtml, 'utf-8');
  generatedCount++;
}

// ── 3. PRERENDER CORE SKILL HUBS ──
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

for (const skill of coreSkills) {
  const targetDir = path.join(distDir, 'skills', skill);
  fs.mkdirSync(targetDir, { recursive: true });

  const capitalized = skill.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const skillConfig = {
    path: `/skills/${skill}`,
    title: `${capitalized} Developer Jobs & Contracts | PolyLance`,
    description: `Discover verified freelance ${capitalized} jobs on Polygon. Deliver code, review milestone terms in escrow, and earn non-custodial crypto payments.`,
    canonicalPath: `/skills/${skill}`,
    robots: 'index, follow',
    primaryKeywordId: 'web3-jobs-hub',
    secondaryKeywordIds: ['core-freelance-jobs-crypto'],
    jsonLdTypes: ['BreadcrumbList'],
  };

  const skillHtml = `
    <header style="max-width:1100px;margin:2rem auto;padding:1rem;text-align:center;">
      <h1 style="font-size:2.25rem;font-weight:800;color:#0b0b0c;">${capitalized} Developer Jobs & Contracts</h1>
      <p style="font-size:1.125rem;color:#4b5563;margin-top:1rem;max-width:700px;margin-left:auto;margin-right:auto;">
        Explore active on-chain freelance contracts requiring ${capitalized} proficiency. Non-custodial escrow on Polygon with instant payouts.
      </p>
    </header>
  `;

  const schemas = buildJsonLd(skillConfig);
  const fullHtml = renderPageHtml(skillConfig, skillHtml, schemas);
  fs.writeFileSync(path.join(targetDir, 'index.html'), fullHtml, 'utf-8');
  generatedCount++;
}

console.log(`✨ Prerendered ${generatedCount} static HTML snapshots with schema JSON-LD into dist/.`);
