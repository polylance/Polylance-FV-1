import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers } from 'ethers';
import { server } from '../server.js';

const TEST_PORT = 3025;
const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

describe('SIWE HTTP Endpoints Integration Test', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('performs full SIWE sign-in, session verification, and logout lifecycle', async () => {
    const testWallet = ethers.Wallet.createRandom();
    const address = testWallet.address;

    // 1. Request nonce
    const nonceRes = await fetch(`${baseUrl}/api/auth/nonce?wallet=${address}&chainId=137`);
    expect(nonceRes.status).toBe(200);
    const nonceData = await nonceRes.json();
    expect(nonceData.success).toBe(true);
    expect(nonceData.nonce).toBeDefined();
    expect(nonceData.message).toContain(address);

    // 2. Sign message
    const signature = await testWallet.signMessage(nonceData.message);

    // 3. Verify signature and obtain session cookie
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        signature,
        message: nonceData.message
      })
    });
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.wallet).toBe(address.toLowerCase());
    expect(verifyData.token).toBeDefined();

    const cookieHeader = verifyRes.headers.get('set-cookie');
    expect(cookieHeader).toContain('polylance_session');

    // Extract cookie value for subsequent requests
    const cookie = cookieHeader?.split(';')[0] || '';

    // 4. Check authenticated identity via /api/auth/me using cookie
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.authenticated).toBe(true);
    expect(meData.wallet).toBe(address.toLowerCase());

    // 5. Check unauthenticated caller receives authenticated: false
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    expect(unauthRes.status).toBe(200);
    const unauthData = await unauthRes.json();
    expect(unauthData.authenticated).toBe(false);

    // 6. Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    expect(logoutRes.status).toBe(200);
    const logoutCookie = logoutRes.headers.get('set-cookie');
    expect(logoutCookie).toContain('polylance_session=;');
  });

  it('rejects verification with wrong signature', async () => {
    const wallet1 = ethers.Wallet.createRandom();
    const wallet2 = ethers.Wallet.createRandom();

    const nonceRes = await fetch(`${baseUrl}/api/auth/nonce?wallet=${wallet1.address}`);
    const nonceData = await nonceRes.json();

    const wrongSignature = await wallet2.signMessage(nonceData.message);

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: wallet1.address,
        signature: wrongSignature,
        message: nonceData.message
      })
    });
    expect(verifyRes.status).toBe(401);
  });
});
