import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { server, getSharedState } from '../server.js';
import { createSessionToken } from '../auth.js';
import { computeRuleBasedProfileStrength, DEMO_MODEL_VERSION } from '../profileScore.js';

describe('Backend Part 4: Transparent Rule-Based Profile Strength Score (User-Only, Disconnectable)', () => {
  const TEST_PORT = 3033;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  const walletA = '0xaaaa111122223333444455556666777788881111'.toLowerCase();
  const walletB = '0xbbbb111122223333444455556666777788882222'.toLowerCase();
  const tokenA = createSessionToken(walletA);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    const state = getSharedState();
    if (state.profiles) {
      delete state.profiles[walletA];
      delete state.profiles[walletB];
    }
    if (state.portfolioLinks) delete state.portfolioLinks[walletA];
    if (state.githubProofs) delete state.githubProofs[walletA];
    if (state.profileScores) delete state.profileScores[walletA];
    if (state.profileScoreOptOut) delete state.profileScoreOptOut[walletA];
  });

  it('includes valid 0004 migration + rollback SQL, social proof design doc, and OpenAPI docs', () => {
    const migDir = path.resolve(__dirname, '../../prisma/migrations/0004_profile_strength_score');
    const upSql = fs.readFileSync(path.join(migDir, 'migration.sql'), 'utf-8');
    const downSql = fs.readFileSync(path.join(migDir, 'rollback.sql'), 'utf-8');
    const openApi = fs.readFileSync(path.resolve(__dirname, '../../docs/openapi.yaml'), 'utf-8');
    const socialDoc = fs.readFileSync(path.resolve(__dirname, '../../docs/social-proof-design.md'), 'utf-8');

    expect(upSql).toContain('CREATE TABLE IF NOT EXISTS "ProfileStrengthScore"');
    expect(downSql).toContain('DROP TABLE IF EXISTS "ProfileStrengthScore"');
    expect(openApi).toContain('/me/score:');
    expect(socialDoc).toContain('Minimum OAuth Scopes');
    expect(socialDoc).toContain('No Scraping');
  });

  it('computes explainable rule-based score strictly from non-sensitive attributes', () => {
    const state = getSharedState();
    state.profiles = state.profiles || {};

    // Two identical profiles except walletB carries extraneous sensitive fields -> scores must be 100% identical
    const baseProfile = {
      displayName: 'Alex Studio',
      headline: 'Brand & Motion Designer',
      bio: 'Crafting accessible design systems, motion micro-interactions, and high-converting editorial landing pages for SaaS and consumer teams worldwide across web and mobile platforms.',
      primaryCategoryId: 'cat_design_creat',
      subcategories: ['sub_brand_identity'],
      skills: ['Figma', 'Branding', 'Motion'],
      accountMode: 'freelancer',
      hourlyRate: '75',
    };

    state.profiles[walletA] = { ...baseProfile, address: walletA };
    state.profiles[walletB] = {
      ...baseProfile,
      address: walletB,
      email: 'sensitive@example.com',
      phone: '+15550001234',
      nationality: 'REDACTED',
      age: 29,
    };

    const scoreA = computeRuleBasedProfileStrength({ walletAddress: walletA, sharedState: state });
    const scoreB = computeRuleBasedProfileStrength({ walletAddress: walletB, sharedState: state });

    expect(scoreA.status).toBe('demo');
    expect(scoreA.model_version).toBe(DEMO_MODEL_VERSION);
    expect(scoreA.value).toBe(scoreB.value);
    expect(scoreA.factors.reduce((sum, f) => sum + f.contribution, 0)).toBe(scoreA.value);
    expect(scoreA.factors.map((f) => f.key)).toEqual([
      'categories_filled',
      'description_quality',
      'portfolio_completeness',
      'profile_clarity',
    ]);
  });

  it('enforces owner-only auth, reflects portfolio completeness, and supports disconnect/delete -> unavailable', async () => {
    // Unauthenticated callers rejected cleanly (never visible publicly while demo/beta)
    const unauth = await fetch(`${baseUrl}/me/score`);
    expect(unauth.status).toBe(401);

    const state = getSharedState();
    state.profiles = state.profiles || {};
    state.profiles[walletA] = {
      address: walletA,
      displayName: 'Maya',
      headline: 'UGC Creator',
      bio: 'Producing crisp product walkthroughs, launch reels, and studio photography tailored for DTC brands.',
      primaryCategoryId: 'cat_creators_collab',
      subcategories: ['sub_ugc_creators'],
      skills: ['UGC', 'Reels', 'Editing'],
      accountMode: 'freelancer',
    };
    state.portfolioLinks = state.portfolioLinks || {};
    state.portfolioLinks[walletA] = [
      { id: 'pf_1', title: 'Reel 1', url: 'https://vimeo.com/1', role: 'Creator', category_tag: 'cat_creators_collab' },
      { id: 'pf_2', title: 'Reel 2', url: 'https://vimeo.com/2', role: 'Creator', category_tag: 'cat_creators_collab' },
      { id: 'pf_3', title: 'Reel 3', url: 'https://vimeo.com/3', role: 'Creator', category_tag: 'cat_creators_collab' },
    ];

    const res1 = await fetch(`${baseUrl}/me/score`, {
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.status).toBe('demo');
    expect(json1.value).toBeGreaterThan(60);
    expect(json1.factors.find((f: any) => f.key === 'portfolio_completeness')?.contribution).toBe(20);
    expect(json1.model_version).toBe(DEMO_MODEL_VERSION);
    expect(Date.parse(json1.computed_at)).not.toBeNaN();

    // Disconnect and delete score
    const delRes = await fetch(`${baseUrl}/me/score`, {
      method: 'DELETE',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(delRes.status).toBe(200);
    const delJson = await delRes.json();
    expect(delJson.deleted).toBe(true);
    expect(delJson.status).toBe('unavailable');
    expect(delJson.value).toBeNull();
    expect(delJson.factors).toEqual([]);

    // Subsequent GET stays unavailable while opted out
    const afterDel = await fetch(`${baseUrl}/me/score`, {
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    const afterDelJson = await afterDel.json();
    expect(afterDelJson.status).toBe('unavailable');
    expect(afterDelJson.value).toBeNull();

    // Explicit recompute opts back in
    const recomputeRes = await fetch(`${baseUrl}/me/score/recompute`, {
      method: 'POST',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(recomputeRes.status).toBe(200);
    const recomputeJson = await recomputeRes.json();
    expect(recomputeJson.status).toBe('demo');
    expect(recomputeJson.value).toBe(json1.value);
  });
});
