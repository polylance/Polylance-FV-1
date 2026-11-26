import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { server, getSharedState } from '../server.js';
import { createSessionToken } from '../auth.js';
import {
  GITHUB_PROOF_MIN_SCOPE,
  signGithubProofState,
  verifyGithubProofState,
} from '../githubProof.js';

describe('Backend Part 2: Minimal-Scope GitHub Proof, Single-Use Token & Cooldowns', () => {
  const TEST_PORT = 3031;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  const walletA = '0x7777111122223333444455556666777788889999'.toLowerCase();
  const walletB = '0x8888111122223333444455556666777788880000'.toLowerCase();
  const tokenA = createSessionToken(walletA);
  const tokenB = createSessionToken(walletB);

  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GITHUB_CLIENT_ID = 'test_github_client_id';
    process.env.GITHUB_CLIENT_SECRET = 'test_github_client_secret';
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    const state = getSharedState();
    if (state.githubProofs) {
      delete state.githubProofs[walletA];
      delete state.githubProofs[walletB];
    }
    if (state.profiles) {
      delete state.profiles[walletA];
      delete state.profiles[walletB];
    }
    global.fetch = originalFetch;
  });

  it('includes valid 0002 migration + rollback SQL and OpenAPI proof documentation', () => {
    const migDir = path.resolve(__dirname, '../../prisma/migrations/0002_github_proof');
    const upSql = fs.readFileSync(path.join(migDir, 'migration.sql'), 'utf-8');
    const downSql = fs.readFileSync(path.join(migDir, 'rollback.sql'), 'utf-8');
    const openApi = fs.readFileSync(path.resolve(__dirname, '../../docs/openapi.yaml'), 'utf-8');

    expect(upSql).toContain('CREATE TABLE IF NOT EXISTS "GithubProof"');
    expect(upSql).not.toContain('email');
    expect(upSql).not.toContain('access_token');
    expect(downSql).toContain('DROP TABLE IF EXISTS "GithubProof"');
    expect(openApi).toContain('/me/proof:');
    expect(openApi).toContain('/me/proof/github/refresh:');
  });

  it('enforces minimum OAuth scope (read:user only, no user:email) and HMAC-signed state', async () => {
    expect(GITHUB_PROOF_MIN_SCOPE).toBe('read:user');

    const unauthStart = await fetch(`${baseUrl}/me/proof/github/start`);
    expect(unauthStart.status).toBe(401);

    const startRes = await fetch(`${baseUrl}/me/proof/github/start`, {
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(startRes.status).toBe(200);
    const startJson = await startRes.json();
    expect(startJson.scope).toBe('read:user');

    const authUrl = new URL(startJson.authorizeUrl);
    expect(authUrl.searchParams.get('scope')).toBe('read:user');
    expect(authUrl.searchParams.get('scope')).not.toContain('user:email');
    expect(authUrl.searchParams.get('scope')).not.toContain('repo');

    const stateParam = authUrl.searchParams.get('state') || '';
    expect(verifyGithubProofState(stateParam).valid).toBe(true);
    expect(verifyGithubProofState(`${stateParam}tampered`).valid).toBe(false);

    // Tampered state rejected by callback
    const badCb = await fetch(`${baseUrl}/me/proof/github/callback?code=abc&state=${encodeURIComponent(stateParam + 'x')}`);
    expect(badCb.status).toBe(400);
    const badCbJson = await badCb.json();
    expect(badCbJson.code).toBe('INVALID_OAUTH_STATE');
  });

  it('uses OAuth token once, discards token & PII, stores stats snapshot, enforces cooldown, and deletes cleanly', async () => {
    let repoStars = 42;
    global.fetch = vi.fn().mockImplementation((url: string | URL, init?: RequestInit) => {
      const u = url.toString();
      if (u.startsWith(baseUrl)) {
        return originalFetch(url, init);
      }
      if (u.includes('login/oauth/access_token')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ access_token: 'gho_ephemeral_single_use_secret_token' }),
        } as any);
      }
      if (u === 'https://api.github.com/user') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: 424242,
            login: 'builder-zk',
            email: 'private@example.com', // MUST be discarded and never stored
            public_repos: 14,
          }),
        } as any);
      }
      if (u.includes('/users/builder-zk') && !u.includes('/repos') && !u.includes('/events')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 424242, login: 'builder-zk', public_repos: 14 }),
        } as any);
      }
      if (u.includes('/repos')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { name: 'core', language: 'TypeScript', stargazers_count: repoStars, fork: false, private: false },
            { name: 'contracts', language: 'Solidity', stargazers_count: 10, fork: false, private: false },
            { name: 'forked', language: 'Python', stargazers_count: 99, fork: true, private: false },
          ],
        } as any);
      }
      if (u.includes('/events/public')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { type: 'PushEvent', created_at: new Date().toISOString() },
            { type: 'IssuesEvent', created_at: new Date().toISOString() },
          ],
        } as any);
      }
      return originalFetch(url, init);
    });

    const signedState = signGithubProofState(walletA, '/onboarding');
    const cbRes = await fetch(
      `${baseUrl}/me/proof/github/callback?code=valid_code_123&state=${encodeURIComponent(signedState)}`
    );
    expect(cbRes.status).toBe(200);
    const cbJson = await cbRes.json();
    expect(cbJson.success).toBe(true);
    expect(cbJson.token_persisted).toBe(false);
    expect(cbJson.email_stored).toBe(false);
    expect(cbJson.github.github_id).toBe('424242');
    expect(cbJson.github.github_login).toBe('builder-zk');
    expect(cbJson.github.stats.public_repos).toBe(14);
    expect(cbJson.github.stats.stars).toBe(151); // sum over owner public repos
    expect(cbJson.github.stats.top_languages[0].language).toBe('Solidity'); // TypeScript & Solidity both 1 repo -> alphabetical tie-break
    expect(cbJson.github.stats.recent_activity.push_events_30d).toBe(1);
    expect(JSON.stringify(cbJson)).not.toContain('gho_ephemeral_single_use_secret_token');
    expect(JSON.stringify(cbJson)).not.toContain('private@example.com');

    // Verify stored sharedState holds neither token nor email
    const storedSnapshotText = JSON.stringify(getSharedState().githubProofs?.[walletA]);
    const storedProfileText = JSON.stringify(getSharedState().profiles?.[walletA]);
    expect(storedSnapshotText).not.toContain('gho_ephemeral');
    expect(storedSnapshotText).not.toContain('private@example.com');
    expect(storedProfileText).not.toContain('private@example.com');

    // Sybil protection: Wallet B cannot connect the same GitHub account
    const stateB = signGithubProofState(walletB, '/onboarding');
    const sybilCb = await fetch(
      `${baseUrl}/me/proof/github/callback?code=valid_code_456&state=${encodeURIComponent(stateB)}`
    );
    expect(sybilCb.status).toBe(409);
    const sybilJson = await sybilCb.json();
    expect(sybilJson.code).toBe('DUPLICATE_GITHUB_ACCOUNT');

    // GET /me/proof returns saved snapshot for authenticated walletA
    const meRes = await fetch(`${baseUrl}/me/proof`, {
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(meRes.status).toBe(200);
    const meJson = await meRes.json();
    expect(meJson.proof.github.github_login).toBe('builder-zk');
    expect(meJson.proof.privacy.email_stored).toBe(false);
    expect(meJson.proof.privacy.token_persisted).toBe(false);

    // Immediate refresh hits 429 cooldown with Retry-After header
    const cooldownRes = await fetch(`${baseUrl}/me/proof/github/refresh`, {
      method: 'POST',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(cooldownRes.status).toBe(429);
    expect(Number(cooldownRes.headers.get('retry-after'))).toBeGreaterThan(0);

    // Simulate cooldown expiry (16 mins ago) and refresh public stats without any token
    getSharedState().githubProofs[walletA].last_synced_at = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    repoStars = 60;
    const refreshRes = await fetch(`${baseUrl}/me/proof/github/refresh`, {
      method: 'POST',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(refreshRes.status).toBe(200);
    const refreshJson = await refreshRes.json();
    expect(refreshJson.github.stats.stars).toBe(169);

    // Disconnect deletes snapshot completely
    const delRes = await fetch(`${baseUrl}/me/proof/github`, {
      method: 'DELETE',
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    expect(delRes.status).toBe(200);
    const delJson = await delRes.json();
    expect(delJson.disconnected).toBe(true);

    const afterDel = await fetch(`${baseUrl}/me/proof`, {
      headers: { Cookie: `polylance_session=${tokenA}` },
    });
    const afterDelJson = await afterDel.json();
    expect(afterDelJson.proof.github).toBeNull();
  });
});
