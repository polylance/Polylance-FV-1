# PolyLance SEO Architecture & Contributor Guide

All SEO constants, keywords, page metadata, schemas, and FAQ data are strictly centralized inside `src/seo/`. No SEO strings (titles, descriptions, keywords, canonical URLs, OG tags, or schema structures) may be hardcoded inside page components, routes, or build scripts.

---

## Folder Structure

\`\`\`
src/seo/
├── site.config.ts        // Site-wide constants: SITE_NAME, SITE_URL ("https://polylance.codes"), contracts, fees
├── keywords.ts           // The centralized keyword taxonomy (stable IDs, one targetPage per keyword)
├── pages.seo.ts          // Per-route SEO registry (titles, descriptions, robots, canonicals)
├── templates.ts          // Dynamic templates for jobs, skills, and freelancer profiles
├── schema/               // Pure JSON-LD schema builders (Organization, WebSite, JobPosting, FAQPage, etc.)
├── faq.data.ts           // Typed FAQ data (serves BOTH visible <FaqSection /> and FAQPage JSON-LD)
├── blog.data.ts          // 15 comprehensive authority articles and guides
├── types.ts              // TypeScript definitions
├── validate.ts           // Validation suite used in CI and `npm run seo:check`
├── index.ts              // Unified public export
└── README.md             // This guide
\`\`\`

---

## Common Workflows

### 1. Adding or Modifying a Keyword
Edit `src/seo/keywords.ts`:
\`\`\`ts
'core-new-keyword': {
  id: 'core-new-keyword',
  term: 'solidity audit freelance',
  cluster: 'skill',
  intent: 'transactional',
  priority: 1,
  targetPage: '/skills/security-audit',
  status: 'active'
}
\`\`\`
> **Invariant**: Each keyword must have exactly **ONE** `targetPage` to prevent keyword cannibalization.

### 2. Adding a New Static Page
1. Register the route in `src/seo/pages.seo.ts`:
\`\`\`ts
'/my-new-page': {
  path: '/my-new-page',
  title: 'Descriptive Title (30 to 60 Chars) | PolyLance',
  description: 'Helpful meta description accurately explaining page content between 120 and 160 characters long.',
  canonicalPath: '/my-new-page',
  primaryKeywordId: 'core-web3-freelance-marketplace',
  secondaryKeywordIds: ['brand-polylance'],
  robots: 'index, follow',
  jsonLdTypes: ['BreadcrumbList'],
  sitemapPriority: 0.8,
  changefreq: 'weekly',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'My New Page', url: '/my-new-page' }
  ]
}
\`\`\`
2. In your page component, import and render:
\`\`\`tsx
import { Seo } from '../components/seo/Seo';

export const MyNewPage = () => (
  <>
    <Seo routeKey="/my-new-page" />
    {/* Page content */}
  </>
);
\`\`\`

### 3. Adding an FAQ Item
Edit `src/seo/faq.data.ts`:
\`\`\`ts
{
  id: 'my-new-question',
  pageIds: ['/fees', '/faq'],
  category: 'fees',
  question: 'What is the network gas fee on Polygon?',
  answer: 'Gas fees on Polygon PoS are paid in POL directly to blockchain validators and typically cost under $0.01 per milestone release.',
  keywordIds: ['problem-low-fee-freelance-platform'],
  schemaEligible: true,
  updatedAt: '2026-10-24'
}
\`\`\`
This single entry will render in the visible `<FaqSection />` accordion AND in the `<script type="application/ld+json">` `FAQPage` schema.

---

## Validation & CI Check
Run the validator anytime:
\`\`\`bash
npm run seo:check
\`\`\`
The validator checks:
1. Every public page title is between 30 and 60 characters.
2. Every public page description is between 120 and 160 characters.
3. Titles and descriptions are globally unique across all pages.
4. Every keyword has one `targetPage`.
5. Private routes are strictly `noindex, nofollow`.
6. Visible FAQ text matches JSON-LD schema output.
