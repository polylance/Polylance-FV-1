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

  it('builds message with polylance.codes domain and uri in production config', () => {
    const origEnv = process.env.NODE_ENV;
    const origDomain = process.env.SIWE_DOMAIN;
    const origUri = process.env.SIWE_URI;
    try {
      process.env.NODE_ENV = 'production';
      process.env.SIWE_DOMAIN = 'polylance.codes';
      process.env.SIWE_URI = 'https://polylance.codes';

      const nonceObj = generateAuthNonce(address, 137);
      expect(nonceObj.message).toContain('polylance.codes wants you to sign in with your Polygon account:');
      expect(nonceObj.message).toContain('URI: https://polylance.codes');
      expect(nonceObj.message).toContain('Sign in to PolyLance. This request will not trigger a blockchain transaction or cost any gas.');
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.SIWE_DOMAIN = origDomain;
      process.env.SIWE_URI = origUri;
    }
  });

  it('rejects SIWE verification when message uses unauthorized domain like polylance.com', async () => {
    // Generate valid nonce
    const nonceObj = generateAuthNonce(address, 137);
    
    // Manually construct or alter message with unauthorized domain polylance.com
    const spoofedMessage = nonceObj.message.replace(
      /^[^\s]+ wants you to sign in with your Polygon account:/m,
      'polylance.com wants you to sign in with your Polygon account:'
    );
    const signature = await testWallet.signMessage(spoofedMessage);

    const result = await verifySiweSignature(address, signature, spoofedMessage);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('is not an authorized PolyLance domain');
  });
});

