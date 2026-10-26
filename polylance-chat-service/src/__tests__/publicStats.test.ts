import { describe, it, expect } from 'vitest';

describe('Public Stats API Aggregate Contract & Security Invariants', () => {
  it('GET /api/public/stats returns strictly aggregates without PII or user addresses', async () => {
    const res = await fetch('http://localhost:3001/api/public/stats');
    expect(res.status).toBe(200);

    const data = await res.json();

    // 1. Structure invariants
    expect(data).toHaveProperty('updatedAt');
    expect(data).toHaveProperty('chainId', 137);
    expect(data).toHaveProperty('escrow');
    expect(data).toHaveProperty('certificates');
    expect(data).toHaveProperty('disputes');
    expect(data).toHaveProperty('jobs');
    expect(data).toHaveProperty('reputation');

    // 2. Token separation: POL and USDC separate numbers (never summed)
    expect(typeof data.escrow.lockedByToken.POL).toBe('number');
    expect(typeof data.escrow.lockedByToken.USDC).toBe('number');
    expect(typeof data.escrow.activeCount).toBe('number');

    // 3. Security: Assert NO user wallet addresses, NO names, NO job titles, NO messages
    const stringified = JSON.stringify(data);
    expect(stringified).not.toContain('freelancer');
    expect(stringified).not.toContain('client');
    expect(stringified).not.toContain('email');
    expect(stringified).not.toContain('title');
    expect(stringified).not.toContain('description');
    expect(stringified).not.toContain('message');
    expect(stringified).not.toContain('budget');

    // 4. Cache header check
    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toContain('max-age');
  });
});
