import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TAXONOMY_CATEGORIES,
  LEGACY_CATEGORY_MAP,
  validateAndResolveJobCategories,
  filterAndPaginateJobs,
} from '../taxonomy.js';
import { server } from '../server.js';
import { createSessionToken } from '../auth.js';

describe('Backend Part 1: Job Categories, Legacy Mapping, Filters & Migrations', () => {
  it('loads all 10 canonical taxonomy categories with valid track assignments', () => {
    expect(TAXONOMY_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    const dev = TAXONOMY_CATEGORIES.find((c) => c.id === 'cat_dev_it');
    const creators = TAXONOMY_CATEGORIES.find((c) => c.id === 'cat_creators_collab');
    expect(dev?.track).toBe('tech');
    expect(creators?.track).toBe('non-tech');
  });

  it('validates canonical categoryId + subcategoryId and rejects invalid or mismatched combos', () => {
    const valid = validateAndResolveJobCategories({
      categoryId: 'cat_dev_it',
      subcategoryId: 'sub_web_dev',
    });
    expect(valid.valid).toBe(true);
    expect(valid.categoryId).toBe('cat_dev_it');
    expect(valid.subcategoryId).toBe('sub_web_dev');
    expect(valid.isLegacyFallback).toBe(false);

    const unknownCat = validateAndResolveJobCategories({
      categoryId: 'cat_does_not_exist',
    });
    expect(unknownCat.valid).toBe(false);
    expect(unknownCat.errorCode).toBe('INVALID_CATEGORY');

    const mismatch = validateAndResolveJobCategories({
      categoryId: 'cat_dev_it',
      subcategoryId: 'sub_ugc_creators',
    });
    expect(mismatch.valid).toBe(false);
    expect(mismatch.errorCode).toBe('SUBCATEGORY_MISMATCH');

    const unknownSub = validateAndResolveJobCategories({
      categoryId: 'cat_dev_it',
      subcategoryId: 'sub_not_real',
    });
    expect(unknownSub.valid).toBe(false);
    expect(unknownSub.errorCode).toBe('INVALID_SUBCATEGORY');
  });

  it('maps old 4 legacy categories read-only without erasing original key', () => {
    expect(Object.keys(LEGACY_CATEGORY_MAP)).toEqual(['web3', 'frontend', 'backend', 'mobile']);

    const mappedWeb3 = validateAndResolveJobCategories({ category: 'web3' });
    expect(mappedWeb3.valid).toBe(true);
    expect(mappedWeb3.categoryId).toBe('cat_web3_block');
    expect(mappedWeb3.subcategoryId).toBe('sub_smart_contracts');
    expect(mappedWeb3.legacyCategory).toBe('web3');

    const mappedFrontend = validateAndResolveJobCategories({ category: 'frontend' });
    expect(mappedFrontend.categoryId).toBe('cat_dev_it');
    expect(mappedFrontend.subcategoryId).toBe('sub_web_dev');
    expect(mappedFrontend.legacyCategory).toBe('frontend');
  });

  it('filters jobs across canonical IDs, legacy records, tracks, and keyword with cursor pagination & timing', () => {
    const sampleJobs = [
      {
        id: 'job-1',
        title: 'Solidity Vault Audit',
        status: 'Open',
        category: 'web3',
        skillsRequired: ['Solidity'],
      },
      {
        id: 'job-2',
        title: 'Brand Ambassador Shorts Campaign',
        status: 'Open',
        categoryId: 'cat_creators_collab',
        subcategoryId: 'sub_short_video',
        skillsRequired: ['TikTok'],
      },
      {
        id: 'job-3',
        title: 'Next.js Checkout Flow',
        status: 'Open',
        categoryId: 'cat_dev_it',
        subcategoryId: 'sub_web_dev',
        skillsRequired: ['React', 'TypeScript'],
      },
      {
        id: 'job-4',
        title: 'Rust Indexing Service',
        status: 'Completed',
        categoryId: 'cat_dev_it',
        subcategoryId: 'sub_software_apis',
        skillsRequired: ['Rust'],
      },
    ];

    // Legacy web3 job matches canonical web3-blockchain filter
    const web3Res = filterAndPaginateJobs(sampleJobs, { category: 'web3-blockchain' });
    expect(web3Res.items.map((j) => j.id)).toEqual(['job-1']);
    expect(web3Res.queryMs).toBeGreaterThanOrEqual(0);

    // Filter by non-tech track returns Creators job only
    const nonTechRes = filterAndPaginateJobs(sampleJobs, { track: 'non-tech' });
    expect(nonTechRes.items.map((j) => j.id)).toEqual(['job-2']);

    // Cursor pagination over dev-it jobs
    const page1 = filterAndPaginateJobs(sampleJobs, { category: 'development-it', limit: 1 });
    expect(page1.items.map((j) => j.id)).toEqual(['job-3']);
    expect(page1.nextCursor).toBe('job-3');

    const page2 = filterAndPaginateJobs(sampleJobs, {
      category: 'development-it',
      limit: 1,
      cursor: page1.nextCursor || undefined,
    });
    expect(page2.items.map((j) => j.id)).toEqual(['job-4']);
    expect(page2.nextCursor).toBeNull();
  });

  it('includes valid paired migration and rollback SQL files plus OpenAPI spec', () => {
    const migDir = path.resolve(__dirname, '../../prisma/migrations/0001_job_categories_and_profiles');
    const upSql = fs.readFileSync(path.join(migDir, 'migration.sql'), 'utf-8');
    const downSql = fs.readFileSync(path.join(migDir, 'rollback.sql'), 'utf-8');
    const openApi = fs.readFileSync(path.resolve(__dirname, '../../docs/openapi.yaml'), 'utf-8');

    expect(upSql).toContain('ADD COLUMN IF NOT EXISTS "category_id"');
    expect(upSql).toContain('CREATE TABLE IF NOT EXISTS "CategoryLegacyMapping"');
    expect(downSql).toContain('DROP TABLE IF EXISTS "CategoryLegacyMapping"');
    expect(downSql).toContain('DROP COLUMN IF EXISTS "category_id"');
    expect(openApi).toContain('/api/categories:');
    expect(openApi).toContain('/api/jobs:');
  });
});

describe('Backend Part 1 HTTP Endpoints: Categories, Jobs Filter & Strict Write Validation', () => {
  const TEST_PORT = 3029;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  const clientWallet = '0x4444555566667777888899990000111122223333'.toLowerCase();
  const sessionToken = createSessionToken(clientWallet);

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

  it('serves GET /api/docs/openapi.yaml and GET /api/categories with openJobsCount and timing', async () => {
    const specRes = await fetch(`${baseUrl}/api/docs/openapi.yaml`);
    expect(specRes.status).toBe(200);
    const specText = await specRes.text();
    expect(specText).toContain('openapi: 3.0.3');

    const catRes = await fetch(`${baseUrl}/api/categories`);
    expect(catRes.status).toBe(200);
    const catJson = await catRes.json();
    expect(catJson.success).toBe(true);
    expect(catJson.categories.length).toBeGreaterThanOrEqual(10);
    expect(catJson.legacyMapping.web3.categoryId).toBe('cat_web3_block');
    expect(typeof catJson.meta?.queryMs).toBe('number');
    console.info(`[Part 1 Timing] GET /api/categories queryMs=${catJson.meta.queryMs}`);
  });

  it('rejects unauthenticated POST /api/jobs with 401 and invalid taxonomy payloads with 400', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: '0xunauthjob1', title: 'Unauth Test Job', categoryId: 'cat_dev_it' }),
    });
    expect(unauthRes.status).toBe(401);

    const invalidCatRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${sessionToken}`,
      },
      body: JSON.stringify({
        id: '0xinvalidcat1',
        title: 'Bad Category Job',
        client: clientWallet,
        amountEth: '1.0',
        categoryId: 'cat_nonexistent',
      }),
    });
    expect(invalidCatRes.status).toBe(400);
    const invalidCatBody = await invalidCatRes.json();
    expect(invalidCatBody.code).toBe('INVALID_CATEGORY');

    const mismatchRes = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${sessionToken}`,
      },
      body: JSON.stringify({
        jobs: [
          {
            id: '0xmismatchsync1',
            title: 'Mismatched Subcategory Job',
            client: clientWallet,
            amountEth: '1.0',
            categoryId: 'cat_dev_it',
            subcategoryId: 'sub_ugc_creators',
          },
        ],
      }),
    });
    expect(mismatchRes.status).toBe(400);
    const mismatchBody = await mismatchRes.json();
    expect(mismatchBody.code).toBe('SUBCATEGORY_MISMATCH');
  });

  it('persists canonical + legacy jobs and supports filtered/cursor-paginated GET /api/jobs queries', async () => {
    const createRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${sessionToken}`,
      },
      body: JSON.stringify([
        {
          id: '0xpart1job_tech_1',
          title: 'Part 1 Indexed API Service',
          description: 'Build cursor paginated GraphQL + REST service',
          client: clientWallet,
          amountEth: '1.5',
          status: 'Open',
          categoryId: 'cat_dev_it',
          subcategoryId: 'sub_software_apis',
          skillsRequired: ['TypeScript', 'PostgreSQL'],
        },
        {
          id: '0xpart1job_legacy_1',
          title: 'Part 1 Legacy Frontend Redesign',
          description: 'Legacy key preserved alongside canonical id',
          client: clientWallet,
          amountEth: '2.0',
          status: 'Open',
          category: 'frontend',
          skillsRequired: ['React'],
        },
        {
          id: '0xpart1job_nontech_1',
          title: 'Part 1 UGC Brand Launch Pack',
          description: 'Non-tech creator deliverables',
          client: clientWallet,
          amountEth: '1.2',
          status: 'Open',
          categoryId: 'cat_creators_collab',
          subcategoryId: 'sub_ugc_creators',
          skillsRequired: ['UGC', 'Reels'],
        },
      ]),
    });
    expect(createRes.status).toBe(200);

    const badTrackRes = await fetch(`${baseUrl}/api/jobs?track=unknown_track`);
    expect(badTrackRes.status).toBe(400);

    const nonTechRes = await fetch(`${baseUrl}/api/jobs?track=non-tech&q=UGC`);
    expect(nonTechRes.status).toBe(200);
    const nonTechJson = await nonTechRes.json();
    expect(nonTechJson.jobs.some((j: any) => j.id === '0xpart1job_nontech_1')).toBe(true);
    expect(nonTechJson.jobs.some((j: any) => j.id === '0xpart1job_tech_1')).toBe(false);
    expect(typeof nonTechJson.meta?.queryMs).toBe('number');
    console.info(`[Part 1 Timing] GET /api/jobs?track=non-tech&q=UGC queryMs=${nonTechJson.meta.queryMs}`);

    const devPage1Res = await fetch(`${baseUrl}/api/jobs?category=development-it&limit=1`);
    expect(devPage1Res.status).toBe(200);
    const devPage1 = await devPage1Res.json();
    expect(devPage1.jobs.length).toBe(1);
    expect(devPage1.pagination.total).toBeGreaterThanOrEqual(2);
    expect(devPage1.pagination.hasMore).toBe(true);
    console.info(`[Part 1 Timing] GET /api/jobs?category=development-it&limit=1 queryMs=${devPage1.meta.queryMs}`);

    const devPage2Res = await fetch(
      `${baseUrl}/api/jobs?category=development-it&limit=1&cursor=${encodeURIComponent(devPage1.pagination.cursor)}`
    );
    expect(devPage2Res.status).toBe(200);
    const devPage2 = await devPage2Res.json();
    expect(devPage2.jobs.length).toBe(1);
    expect(devPage2.jobs[0].id).not.toBe(devPage1.jobs[0].id);

    const legacyCheckRes = await fetch(`${baseUrl}/api/jobs?subcategory=sub_web_dev`);
    const legacyCheck = await legacyCheckRes.json();
    const legacyMatch = legacyCheck.jobs.find((j: any) => j.id === '0xpart1job_legacy_1');
    expect(legacyMatch).toBeDefined();
    expect(legacyMatch.categoryId).toBe('cat_dev_it');
    expect(legacyMatch.legacyCategory).toBe('frontend');
    expect(legacyMatch.legacyFallbackLabel).toBeNull();
  });
});
