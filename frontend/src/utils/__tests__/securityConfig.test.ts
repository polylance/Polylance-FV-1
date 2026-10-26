import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Check A.1: Frontend Secret Leakage Invariants', () => {
  it('must not expose Pinata API key, secret or JWT in frontend .env', () => {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) continue;
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim();
        if (key === 'VITE_PINATA_API_KEY' || key === 'VITE_PINATA_API_SECRET' || key === 'VITE_PINATA_JWT') {
          expect(val).toBe('');
        }
      }
    }
  });

  it('must not expose server private keys or database URLs in frontend .env', () => {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      expect(content).not.toMatch(/DATABASE_URL\s*=/i);
      expect(content).not.toMatch(/PRIVATE_KEY\s*=/i);
      expect(content).not.toMatch(/GITHUB_CLIENT_SECRET\s*=/i);
    }
  });

  it('generates deterministic CID and caches file when no Pinata credentials are in browser', async () => {
    const { pinJsonToFilebase, getCachedIpfsFile } = await import('../ipfs');
    const payload = { test: 'security-audit-fix', timestamp: 1792340000 };
    const cid = await pinJsonToFilebase(payload, 'test-audit.json');
    expect(cid).toBeDefined();
    expect(cid.startsWith('Qm') || cid.startsWith('bafy')).toBe(true);
    const cached = getCachedIpfsFile(cid);
    expect(cached).toBeDefined();
    expect(cached?.name).toBe('test-audit.json');
  });
});
