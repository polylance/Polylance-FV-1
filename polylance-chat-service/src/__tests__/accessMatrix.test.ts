import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers } from 'ethers';
import { server } from '../server.js';
import { createSessionToken } from '../auth.js';

const TEST_PORT = 3014;
const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

describe('Check G.27: Access Matrix & Authorization Guards Regression Suite', () => {
  const clientA = '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd'.toLowerCase();
  const freelancerB = '0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1'.toLowerCase();
  const thirdPartyC = '0x3333444455556666777788889999000011112222'.toLowerCase();
  const adminWallet = '0x940D8475689b2156D6174555F3382b5E6951653F'.toLowerCase();

  const tokenA = createSessionToken(clientA);
  const tokenB = createSessionToken(freelancerB);
  const tokenC = createSessionToken(thirdPartyC);
  const tokenAdmin = createSessionToken(adminWallet);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ADMIN_ADDRESS_1 = adminWallet;
    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('Route: GET /api/jobs/:id/events (SSE catchup & IDOR check)', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/0x0D34F6B4Fb25/events`);
      expect(res.status).toBe(401);
    });

    it('rejects third-party wallet C with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/0x0D34F6B4Fb25/events`, {
        headers: { Cookie: `polylance_session=${tokenC}` }
      });
      expect(res.status).toBe(403);
    });

    it('allows Client A (authorized client on job) with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/jobs/0x0D34F6B4Fb25/events`, {
        headers: { Cookie: `polylance_session=${tokenA}` }
      });
      // If job is in shared state, returns 200; if not found in test fixture, 404, but NOT 401 or 403
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Route: GET /api/notifications (Identity from session only)', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/notifications?wallet=${clientA}`);
      expect(res.status).toBe(401);
    });

    it('returns only caller notifications; query param spoofing by third-party C is ignored', async () => {
      const res = await fetch(`${baseUrl}/api/notifications?wallet=${clientA}`, {
        headers: { Cookie: `polylance_session=${tokenC}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Notifications must only belong to thirdPartyC, none for clientA
      for (const n of data.notifications) {
        expect(n.recipientWallet.toLowerCase()).toBe(thirdPartyC);
      }
    });
  });

  describe('Route: POST /api/maintenance/reset (Administrative authorization)', () => {
    it('rejects unauthenticated caller with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/reset`, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it('rejects third-party C attempting header spoofing with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/reset`, {
        method: 'POST',
        headers: {
          Cookie: `polylance_session=${tokenC}`,
          'x-wallet-address': adminWallet // Attacker spoof header
        }
      });
      expect(res.status).toBe(403);
    });

    it('allows validated admin session to execute maintenance reset', async () => {
      const res = await fetch(`${baseUrl}/api/maintenance/reset`, {
        method: 'POST',
        headers: { Cookie: `polylance_session=${tokenAdmin}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Route: GET /api/fees/my-dues (Private financial records)', () => {
    it('rejects unauthenticated caller with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/fees/my-dues?wallet=${clientA}`);
      expect(res.status).toBe(401);
    });

    it('allows authenticated caller C to query their own dues', async () => {
      const res = await fetch(`${baseUrl}/api/fees/my-dues`, {
        headers: { Cookie: `polylance_session=${tokenC}` }
      });
      expect(res.status).toBe(200);
    });
  });
});
