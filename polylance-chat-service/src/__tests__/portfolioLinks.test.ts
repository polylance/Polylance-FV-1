import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { server, getSharedState } from '../server.js';
import { createSessionToken } from '../auth.js';
import {
  MAX_PORTFOLIO_LINKS,
  validateSafePortfolioUrl,
  validatePortfolioLinksList,
} from '../portfolioLinks.js';

describe('Backend Part 3: Portfolio Links (Max 5, Strict Format Validation, Zero SSRF)', () => {
  const TEST_PORT = 3032;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  const walletA = '0x9999111122223333444455556666777788881111'.toLowerCase();
  const tokenA = createSessionToken(walletA);
  const originalFetch = global.fetch;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    const state = getSharedState();
    if (state.portfolioLinks) delete state.portfolioLinks[walletA];
    if (state.profiles) delete state.profiles[walletA];
    global.fetch = originalFetch;
  });

  it('includes 0003 migration + rollback SQL and OpenAPI portfolio docs', () => {
    const migDir = path.resolve(__dirname, '../../prisma/migrations/0003_portfolio_links');
    const upSql = fs.readFileSync(path.join(migDir, 'migration.sql'), 'utf-8');
    const downSql = fs.readFileSync(path.join(migDir, 'rollback.sql'), 'utf-8');
    const openApi = fs.readFileSync(path.resolve(__dirname, '../../docs/openapi.yaml'), 'utf-8');

    expect(upSql).toContain('CREATE TABLE IF NOT EXISTS "PortfolioLink"');
    expect(downSql).toContain('DROP TABLE IF EXISTS "PortfolioLink"');
    expect(openApi).toContain('/me/portfolio:');
    expect(openApi).toContain('/api/profiles/{address}/portfolio:');
  });

  it('rejects unsafe SSRF targets, non-https protocols, credentials in URLs, and invalid tags without outbound fetches', () => {
    const badUrls = [
      'http://example.com/work',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'https://localhost/admin',
      'https://127.0.0.1/internal',
      'https://169.254.169.254/latest/meta-data',
      'https://10.0.0.5/secret',
      'https://192.168.1.10/router',
      'https://172.16.0.1/vpc',
      'https://[::1]/loopback',
      'https://user:pass@dribbble.com/shots/123',
      'https://intranet/doc',
    ];

    for (const url of badUrls) {
      const check = validateSafePortfolioUrl(url);
      expect(check.valid).toBe(false);
    }

    const okUrl = validateSafePortfolioUrl('https://behance.net/gallery/12345/brand-kit');
    expect(okUrl.valid).toBe(true);

    const badTag = validatePortfolioLinksList([
      {
        title: 'Brand Identity Deck',
        url: 'https://behance.net/gallery/12345/brand-kit',
        role: 'Brand Designer',
        category_tag: 'nonexistent-category-xyz',
      },
    ]);
    expect(badTag.valid).toBe(false);
    expect(badTag.errorCode).toBe('INVALID_CATEGORY_TAG');
  });

  it('enforces auth, max 5 limit, zero outbound SSRF fetches, CRUD lifecycle, and sync guard', async () => {
    const unauthGet = await fetch(`${baseUrl}/me/portfolio`);
    expect(unauthGet.status).toBe(401);

    // Spy on global.fetch for outbound requests (must only see calls to baseUrl from this test, NEVER portfolio URLs)
    const externalFetchCalls: string[] = [];
    global.fetch = vi.fn().mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = url.toString();
      if (!u.startsWith(baseUrl)) {
        externalFetchCalls.push(u);
      }
      return originalFetch(url, init);
    });

    // Reject SSRF attempt via HTTP
    const ssrfPost = await fetch(`${baseUrl}/me/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Cloud Metadata Probe',
        url: 'https://169.254.169.254/latest/meta-data/',
        role: 'Designer',
        category_tag: 'design-creative',
      }),
    });
    expect(ssrfPost.status).toBe(400);
    const ssrfJson = await ssrfPost.json();
    expect(ssrfJson.code).toBe('UNSAFE_PORTFOLIO_URL');

    // Add 5 valid portfolio links
    for (let i = 1; i <= MAX_PORTFOLIO_LINKS; i++) {
      const addRes = await fetch(`${baseUrl}/me/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `polylance_session=${tokenA}`,
        },
        body: JSON.stringify({
          title: `<b>Campaign ${i}</b>`,
          url: `https://dribbble.com/shots/${1000 + i}`,
          role: 'Art Director',
          category_tag: 'design-creative',
        }),
      });
      expect(addRes.status).toBe(201);
    }

    // 6th link must be rejected
    const sixthRes = await fetch(`${baseUrl}/me/portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Sixth Overflow Link',
        url: 'https://dribbble.com/shots/9999',
        role: 'Art Director',
        category_tag: 'design-creative',
      }),
    });
    expect(sixthRes.status).toBe(400);
    const sixthJson = await sixthRes.json();
    expect(sixthJson.code).toBe('MAX_PORTFOLIO_LINKS_EXCEEDED');

    // Verify public endpoint returns sanitized plain text and resolved taxonomy tag
    const pubRes = await fetch(`${baseUrl}/api/profiles/${walletA}/portfolio`);
    expect(pubRes.status).toBe(200);
    const pubJson = await pubRes.json();
    expect(pubJson.count).toBe(5);
    expect(pubJson.portfolio[0].title).toBe('Campaign 1'); // HTML stripped
    expect(pubJson.portfolio[0].category_tag).toBe('cat_design_creat');

    // Delete 1 item, then confirm 4 remain
    const firstId = pubJson.portfolio[0].id;
    const delRes = await fetch(`${baseUrl}/me/portfolio/${encodeURIComponent(firstId)}`, {
      method: 'DELETE',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(delRes.status).toBe(200);
    const delJson = await delRes.json();
    expect(delJson.count).toBe(4);

    // Also verify POST /api/sync enforces portfolio validation
    const badSync = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${tokenA}`,
      },
      body: JSON.stringify({
        profiles: {
          [walletA]: {
            address: walletA,
            portfolioLinks: [
              { title: 'Insecure HTTP', url: 'http://example.com/a', role: 'Writer', category_tag: 'writing-translation' },
            ],
          },
        },
      }),
    });
    expect(badSync.status).toBe(400);

    // Guarantee ZERO outbound HTTP fetches occurred to any user-supplied portfolio URL
    expect(externalFetchCalls).toEqual([]);
  });
});
