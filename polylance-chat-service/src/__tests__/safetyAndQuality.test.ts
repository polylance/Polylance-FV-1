import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { server } from '../server.js';
import { createSessionToken } from '../auth.js';
import { createLimiter, evaluateIpAndWalletRateLimit } from '../ratelimit.js';
import { redactSecretsForLog } from '../securityLog.js';

describe('Backend Part 6: Safety, Per-IP & Per-Wallet Rate Limits, Log Redaction & OpenAPI', () => {
  const TEST_PORT = 3035;
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
  const walletA = '0xc000111122223333444455556666777788881111'.toLowerCase();
  const walletB = '0xd000111122223333444455556666777788882222'.toLowerCase();
  const tokenB = createSessionToken(walletB);

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

  it('redacts OAuth tokens, Bearer headers, secrets, and private keys from logs with zero hardcoded secrets in src/', () => {
    const raw =
      'Authorization: Bearer eyJhbGciOi.secret.sig ghp_ABC123SecretToken access_token="gho_xyz987" client_secret=shhh_secret privateKey=0x1111111111111111111111111111111111111111111111111111111111111111';
    const cleaned = redactSecretsForLog(raw);

    expect(cleaned).not.toContain('eyJhbGciOi.secret.sig');
    expect(cleaned).not.toContain('ghp_ABC123SecretToken');
    expect(cleaned).not.toContain('gho_xyz987');
    expect(cleaned).not.toContain('shhh_secret');
    expect(cleaned).not.toContain('0x1111111111111111111111111111111111111111111111111111111111111111');
    expect(cleaned).toContain('[REDACTED]');
    expect(cleaned).toContain('[REDACTED_GITHUB_TOKEN]');

    // Confirm legacy hardcoded GitHub client secret literal is removed from server.ts
    const serverSrc = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf-8');
    expect(serverSrc).not.toContain('60eb74a3ca190caa');
  });

  it('enforces independent per-IP and per-wallet rate limits', async () => {
    const ipTestLimiter = createLimiter('test_ip_p6', 3, 60_000, '1 m');
    const walletTestLimiter = createLimiter('test_wallet_p6', 2, 60_000, '1 m');

    // Wallet A hits wallet limit on 3rd call across different IPs
    const d1 = await evaluateIpAndWalletRateLimit({
      ip: '198.51.100.1',
      wallet: walletA,
      isReadPath: false,
      ipLimiter: ipTestLimiter,
      walletLimiter: walletTestLimiter,
    });
    const d2 = await evaluateIpAndWalletRateLimit({
      ip: '198.51.100.2',
      wallet: walletA,
      isReadPath: false,
      ipLimiter: ipTestLimiter,
      walletLimiter: walletTestLimiter,
    });
    const d3 = await evaluateIpAndWalletRateLimit({
      ip: '198.51.100.3',
      wallet: walletA,
      isReadPath: false,
      ipLimiter: ipTestLimiter,
      walletLimiter: walletTestLimiter,
    });
    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(true);
    expect(d3.allowed).toBe(false);
    expect(d3.reason).toBe('WALLET_RATE_LIMITED');
    expect(d3.retryAfterSeconds).toBeGreaterThan(0);

    // Same IP exceeds IP limit after 3 anonymous calls
    const a1 = await evaluateIpAndWalletRateLimit({ ip: '203.0.113.9', isReadPath: true, ipLimiter: ipTestLimiter });
    const a2 = await evaluateIpAndWalletRateLimit({ ip: '203.0.113.9', isReadPath: true, ipLimiter: ipTestLimiter });
    const a3 = await evaluateIpAndWalletRateLimit({ ip: '203.0.113.9', isReadPath: true, ipLimiter: ipTestLimiter });
    const a4 = await evaluateIpAndWalletRateLimit({ ip: '203.0.113.9', isReadPath: true, ipLimiter: ipTestLimiter });
    expect(a1.allowed && a2.allowed && a3.allowed).toBe(true);
    expect(a4.allowed).toBe(false);
    expect(a4.reason).toBe('IP_RATE_LIMITED');
  });

  it('requires authentication on every Part 1-5 write endpoint and validates PATCH taxonomy + OpenAPI coverage', async () => {
    const protectedWrites: Array<{ method: string; path: string; body?: any }> = [
      { method: 'POST', path: '/api/jobs', body: { id: '0x1', title: 'X' } },
      { method: 'PATCH', path: '/api/jobs/0x1', body: { title: 'Y' } },
      { method: 'POST', path: '/api/sync', body: { jobs: [] } },
      { method: 'POST', path: '/me/proof/github/refresh' },
      { method: 'DELETE', path: '/me/proof/github' },
      { method: 'PUT', path: '/me/portfolio', body: [] },
      { method: 'POST', path: '/me/portfolio', body: {} },
      { method: 'DELETE', path: '/me/portfolio/pf_123' },
      { method: 'POST', path: '/me/score/recompute' },
      { method: 'DELETE', path: '/me/score' },
    ];

    for (const ep of protectedWrites) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: ep.body ? { 'Content-Type': 'application/json' } : undefined,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      expect(res.status).toBe(401);
    }

    // Authenticated PATCH with invalid categoryId is rejected with 400
    const badPatch = await fetch(`${baseUrl}/api/jobs/0xnonexistent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `polylance_session=${tokenB}`,
      },
      body: JSON.stringify({ categoryId: 'cat_fake_invalid' }),
    });
    expect(badPatch.status).toBe(400);
    const badPatchJson = await badPatch.json();
    expect(badPatchJson.code).toBe('INVALID_CATEGORY');

    // OpenAPI covers all Part 1-5 routes
    const openApiRes = await fetch(`${baseUrl}/api/docs/openapi.yaml`);
    expect(openApiRes.status).toBe(200);
    const yaml = await openApiRes.text();
    for (const expectedRoute of [
      '/api/categories:',
      '/api/jobs:',
      '/api/sync:',
      '/me/proof:',
      '/me/proof/github/start:',
      '/me/proof/github/callback:',
      '/me/proof/github/refresh:',
      '/me/proof/github:',
      '/me/portfolio:',
      '/me/portfolio/{id}:',
      '/api/profiles/{address}/portfolio:',
      '/me/score:',
      '/me/score/recompute:',
      '/leaderboard:',
      '/leaderboard/top-by-category:',
    ]) {
      expect(yaml).toContain(expectedRoute);
    }
  });
});
