import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import {
  generateAuthNonce,
  verifySiweSignature,
  createSessionToken,
  verifySessionToken,
  consumeAuthNonce,
  clearExpiredNonces
} from '../auth.js';

describe('Check B.7: Cryptographic Wallet Authentication & SIWE Session', () => {
  const testWallet = ethers.Wallet.createRandom();
  const address = testWallet.address;

  it('generates a bound, expiring nonce for a wallet address', () => {
    const nonceObj = generateAuthNonce(address, 137);
    expect(nonceObj.nonce).toHaveLength(32);
    expect(nonceObj.expiresAt).toBeGreaterThan(Date.now());
    expect(nonceObj.message).toContain(address);
    expect(nonceObj.message).toContain('Nonce: ' + nonceObj.nonce);
    expect(nonceObj.message).toContain('Chain ID: 137');
  });

  it('verifies a valid signature against issued nonce and binds address', async () => {
    const nonceObj = generateAuthNonce(address, 137);
    const signature = await testWallet.signMessage(nonceObj.message);

    const result = await verifySiweSignature(address, signature, nonceObj.message);
    expect(result.valid).toBe(true);
    expect(result.wallet).toBe(address.toLowerCase());
  });

  it('rejects an old or consumed nonce (replay attack prevention)', async () => {
    const nonceObj = generateAuthNonce(address, 137);
    const signature = await testWallet.signMessage(nonceObj.message);

    // First verification consumes the nonce
    const firstVerify = await verifySiweSignature(address, signature, nonceObj.message);
    expect(firstVerify.valid).toBe(true);

    // Immediate replay attempt must fail
    const replayVerify = await verifySiweSignature(address, signature, nonceObj.message);
    expect(replayVerify.valid).toBe(false);
    expect(replayVerify.reason).toContain('Invalid or expired nonce');
  });

  it('rejects signature from a different wallet than claimed', async () => {
    const imposterWallet = ethers.Wallet.createRandom();
    const nonceObj = generateAuthNonce(address, 137);
    const forgedSignature = await imposterWallet.signMessage(nonceObj.message);

    const result = await verifySiweSignature(address, forgedSignature, nonceObj.message);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Signature mismatch');
  });

  it('creates and verifies a tamper-proof signed session token', () => {
    const token = createSessionToken(address);
    expect(token).toBeDefined();

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.wallet).toBe(address.toLowerCase());

    // Tampered token must fail
    const tampered = token.slice(0, -4) + 'abcd';
    expect(verifySessionToken(tampered)).toBeNull();
  });
});
