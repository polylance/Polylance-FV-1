import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { server, getSharedState } from '../server.js';
import { createSessionToken } from '../auth.js';
import { invalidateLeaderboardCache } from '../leaderboard.js';

describe('Backend Part 5: Category Reputation Leaderboard (On-Chain Points, Cursor Pagination, Cache & Own Rank)', () => {
  const TEST_PORT = 3034;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  const w1 = '0x1000000000000000000000000000000000000001'.toLowerCase();
  const w2 = '0x2000000000000000000000000000000000000002'.toLowerCase();
  const w3 = '0x3000000000000000000000000000000000000003'.toLowerCase();
  const w4 = '0x4000000000000000000000000000000000000004'.toLowerCase();
  const w5 = '0x5000000000000000000000000000000000000005'.toLowerCase();
  const wUnranked = '0x6000000000000000000000000000000000000006'.toLowerCase();

  const tokenW3 = createSessionToken(w3);

  let savedJobs: any[] = [];
  let savedProfiles: Record<string, any> = {};

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const state = getSharedState();
    savedJobs = [...(state.jobs || [])];
    savedProfiles = { ...(state.profiles || {}) };
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    const state = getSharedState();
    state.jobs = savedJobs;
    state.profiles = savedProfiles;
    invalidateLeaderboardCache();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    invalidateLeaderboardCache();
    const state = getSharedState();
    state.jobs = [
      // w1: 3 completed jobs + 1 SBT -> 350 pts (dev-it)
      { id: 'lb-j1', title: 'J1', status: 'Completed', freelancer: w1, client: wUnranked, categoryId: 'cat_dev_it', sbtMinted: true },
      { id: 'lb-j2', title: 'J2', status: 'Paid', freelancer: w1, client: wUnranked, categoryId: 'cat_dev_it' },
      { id: 'lb-j3', title: 'J3', status: 'Released', freelancer: w1, client: wUnranked, categoryId: 'cat_dev_it' },
      // w2: 2 completed jobs -> 200 pts (dev-it)
      { id: 'lb-j4', title: 'J4', status: 'Completed', freelancer: w2, client: wUnranked, categoryId: 'cat_dev_it' },
      { id: 'lb-j5', title: 'J5', status: 'Completed', freelancer: w2, client: wUnranked, categoryId: 'cat_dev_it' },
      // w3: 1 completed job -> 100 pts (dev-it)
      { id: 'lb-j6', title: 'J6', status: 'Completed', freelancer: w3, client: wUnranked, categoryId: 'cat_dev_it' },
      // w4: 1 completed job -> 100 pts (dev-it, tie-broken alphabetically after w3)
      { id: 'lb-j7', title: 'J7', status: 'Completed', freelancer: w4, client: wUnranked, categoryId: 'cat_dev_it' },
      // w5: 2 completed jobs + 1 SBT -> 250 pts (design-creative)
      { id: 'lb-j8', title: 'J8', status: 'Completed', freelancer: w5, client: wUnranked, categoryId: 'cat_design_creat', sbtMinted: true },
      { id: 'lb-j9', title: 'J9', status: 'Completed', freelancer: w5, client: wUnranked, categoryId: 'cat_design_creat' },
      // Open job for wUnranked MUST NOT award points
      { id: 'lb-open', title: 'Open Job', status: 'Open', freelancer: wUnranked, client: w1, categoryId: 'cat_dev_it' },
    ];
    state.profiles = {
      [w1]: { address: w1, displayName: 'Alice', primaryCategoryId: 'cat_dev_it' },
      [w2]: { address: w2, displayName: 'Bob', primaryCategoryId: 'cat_dev_it' },
      [w3]: { address: w3, displayName: 'Carol', primaryCategoryId: 'cat_dev_it' },
      [w4]: { address: w4, displayName: 'Dan', primaryCategoryId: 'cat_dev_it' },
      [w5]: { address: w5, displayName: 'Eve', primaryCategoryId: 'cat_design_creat' },
      [wUnranked]: { address: wUnranked, displayName: 'ZeroPts', primaryCategoryId: 'cat_dev_it' },
    };
    // Ensure Part 4 demo ProfileStrengthScore CANNOT affect ranking order
    state.profileScores = {
      [wUnranked]: { status: 'demo', value: 100, factors: [], model_version: 'rule-demo-v1.0.0', computed_at: new Date().toISOString() },
      [w4]: { status: 'demo', value: 99, factors: [], model_version: 'rule-demo-v1.0.0', computed_at: new Date().toISOString() },
    };
  });

  it('includes 0005 migration + rollback SQL and OpenAPI leaderboard docs', () => {
    const migDir = path.resolve(__dirname, '../../prisma/migrations/0005_leaderboard_indexes');
    const upSql = fs.readFileSync(path.join(migDir, 'migration.sql'), 'utf-8');
    const downSql = fs.readFileSync(path.join(migDir, 'rollback.sql'), 'utf-8');
    const openApi = fs.readFileSync(path.resolve(__dirname, '../../docs/openapi.yaml'), 'utf-8');

    expect(upSql).toContain('CREATE INDEX IF NOT EXISTS "JobRecord_freelancer_status_idx"');
    expect(upSql).toContain('CREATE INDEX IF NOT EXISTS "CertificateRecord_holder_type_status_idx"');
    expect(downSql).toContain('DROP INDEX IF EXISTS "JobRecord_freelancer_status_idx"');
    expect(openApi).toContain('/leaderboard:');
    expect(openApi).toContain('/leaderboard/top-by-category:');
  });

  it('ranks by real reputation points, isolates demo scores, paginates with cursor, caches, and returns myRank', async () => {
    // First call builds cache (cached: false)
    const p1Res = await fetch(`${baseUrl}/leaderboard?category=development-it&limit=2`, {
      headers: { Cookie: `polylance_session=${tokenW3}` },
    });
    expect(p1Res.status).toBe(200);
    const p1 = await p1Res.json();

    expect(p1.meta.cached).toBe(false);
    expect(p1.meta.scoringSource).toBe('onchain_and_escrow_events_only');
    expect(typeof p1.meta.queryMs).toBe('number');
    console.info(`[Part 5 Timing] GET /leaderboard cold queryMs=${p1.meta.queryMs}`);

    expect(p1.leaderboard.map((x: any) => x.address)).toEqual([w1, w2]);
    expect(p1.leaderboard[0].reputation_points).toBe(350);
    expect(p1.leaderboard[0].completed_jobs_count).toBe(3);
    expect(p1.pagination.total).toBe(4); // wUnranked excluded despite 100 demo profileScore
    expect(p1.pagination.hasMore).toBe(true);
    expect(p1.myRank).toMatchObject({
      address: w3,
      rank: 3,
      totalParticipants: 4,
      inLeaderboard: true,
      reputation_points: 100,
    });

    // Second call hits short-lived cache (cached: true) + advances cursor
    const p2Res = await fetch(
      `${baseUrl}/leaderboard?category=development-it&limit=2&cursor=${encodeURIComponent(p1.pagination.cursor)}`
    );
    expect(p2Res.status).toBe(200);
    const p2 = await p2Res.json();
    expect(p2.meta.cached).toBe(true);
    console.info(`[Part 5 Timing] GET /leaderboard cached queryMs=${p2.meta.queryMs}`);

    expect(p2.leaderboard.map((x: any) => x.address)).toEqual([w3, w4]);
    expect(p2.pagination.hasMore).toBe(false);

    // Unranked user query shows inLeaderboard: false cleanly
    const unrankedRes = await fetch(`${baseUrl}/leaderboard?address=${wUnranked}`);
    const unrankedJson = await unrankedRes.json();
    expect(unrankedJson.myRank.inLeaderboard).toBe(false);
    expect(unrankedJson.myRank.rank).toBeNull();

    // Invalid address query rejected cleanly
    const badAddr = await fetch(`${baseUrl}/leaderboard?address=not-a-wallet`);
    expect(badAddr.status).toBe(400);
  });

  it('returns top 3 per category ONLY for categories where real reputation data exists', async () => {
    const res = await fetch(`${baseUrl}/leaderboard/top-by-category`, {
      headers: { Cookie: `polylance_session=${tokenW3}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.categories.map((c: any) => c.category_id)).toEqual(['cat_dev_it', 'cat_design_creat']);

    const devGroup = json.categories.find((c: any) => c.category_id === 'cat_dev_it');
    expect(devGroup.total_ranked).toBe(4);
    expect(devGroup.top.length).toBe(3); // Capped at top 3 even though 4 exist
    expect(devGroup.top.map((x: any) => x.address)).toEqual([w1, w2, w3]);

    const designGroup = json.categories.find((c: any) => c.category_id === 'cat_design_creat');
    expect(designGroup.top.length).toBe(1);
    expect(designGroup.top[0].address).toBe(w5);
    expect(json.myRank.rank).toBe(4); // Global rank for w3: w1 (350), w5 (250), w2 (200), w3 (100)
  });
});
