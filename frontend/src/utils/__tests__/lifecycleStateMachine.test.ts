import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import {
  isJobListed,
  calculateEscrowFeeBigInt,
  MAX_NEGOTIATION_ROUNDS,
  OFFER_EXPIRY_MS,
  ALLOW_PROPOSALS_DURING_NEGOTIATION,
  EngagementState,
} from '../../types/lifecycle';
import { sharedPoller } from '../sharedPoller';

describe('Lifecycle State Machine & Invariants', () => {
  describe('isJobListed invariant', () => {
    it('returns true for Open jobs', () => {
      const job = { id: 'j-1', status: 'Open' };
      expect(isJobListed(job)).toBe(true);
    });

    it('returns true during active negotiation states (OFFER_SENT, COUNTER, TERMS_AGREED)', () => {
      expect(isJobListed({ id: 'j-2', status: 'Selected', engagement: { state: 'OFFER_SENT' } })).toBe(true);
      expect(isJobListed({ id: 'j-3', status: 'Selected', engagement: { state: 'COUNTER_PROPOSED_BY_FREELANCER' } })).toBe(true);
      expect(isJobListed({ id: 'j-4', status: 'Selected', engagement: { state: 'COUNTER_PROPOSED_BY_CLIENT' } })).toBe(true);
      expect(isJobListed({ id: 'j-5', status: 'Selected', engagement: { state: 'TERMS_AGREED' } })).toBe(true);
    });

    it('returns true when funding transaction is pending or failed', () => {
      expect(isJobListed({ id: 'j-6', status: 'Selected', engagement: { state: 'FUNDING_PENDING' } })).toBe(true);
      expect(isJobListed({ id: 'j-7', status: 'Selected', events: [{ step: 'Funded', status: 'failed' }] })).toBe(true);
    });

    it('returns false ONLY when escrow funding is confirmed on-chain', () => {
      const fundedJob = {
        id: 'j-8',
        status: 'Funded',
        events: [{ step: 'Funded', status: 'completed', timestamp: Date.now() }],
      };
      expect(isJobListed(fundedJob)).toBe(false);

      const inProgressJob = {
        id: 'j-9',
        status: 'Selected',
        events: [{ step: 'Funded', status: 'completed', timestamp: Date.now() }],
      };
      expect(isJobListed(inProgressJob)).toBe(false);
    });

    it('reappears as listed (returns true) after client cancels selection', () => {
      const cancelledSelectionJob = {
        id: 'j-10',
        status: 'Open',
        engagement: { state: 'SELECTION_CANCELLED_BY_CLIENT' },
      };
      expect(isJobListed(cancelledSelectionJob)).toBe(true);
    });
  });

  describe('BigInt Money Math & Platform Fee Parity', () => {
    it('computes 2.5% platform fee accurately using BigInt integer arithmetic', () => {
      // 10 POL = 10 * 10^18 wei
      const principalWei = ethers.parseEther('10');
      const { totalClientPayWei, netFreelancerReceiveWei, clientFeeWei } = calculateEscrowFeeBigInt(principalWei);

      // 2.5% of 10 POL = 0.25 POL = 25 * 10^16 wei
      const expectedFeeWei = ethers.parseEther('0.25');
      expect(clientFeeWei).toBe(expectedFeeWei);

      // Client pays: 10 + 0.25 = 10.25 POL
      const expectedClientTotalWei = ethers.parseEther('10.25');
      expect(totalClientPayWei).toBe(expectedClientTotalWei);

      // Freelancer receives: 10 - 0.25 = 9.75 POL
      const expectedFreelancerNetWei = ethers.parseEther('9.75');
      expect(netFreelancerReceiveWei).toBe(expectedFreelancerNetWei);
    });

    it('handles non-round values with exact BigInt truncation parity', () => {
      // 13.333333 POL
      const principalWei = ethers.parseEther('13.333333');
      const { totalClientPayWei, netFreelancerReceiveWei, clientFeeWei } = calculateEscrowFeeBigInt(principalWei);

      expect(totalClientPayWei).toBe(principalWei + clientFeeWei);
      expect(netFreelancerReceiveWei).toBe(principalWei - clientFeeWei);
    });
  });

  describe('Negotiation Constants & Caps', () => {
    it('enforces maximum rounds cap of 6', () => {
      expect(MAX_NEGOTIATION_ROUNDS).toBe(6);
    });

    it('sets default offer expiration to 72 hours', () => {
      expect(OFFER_EXPIRY_MS).toBe(72 * 60 * 60 * 1000);
    });

    it('enables proposal submissions during negotiation by default', () => {
      expect(ALLOW_PROPOSALS_DURING_NEGOTIATION).toBe(true);
    });
  });

  describe('SharedPoller Deduplication & Backoff', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('deduplicates simultaneous concurrent fetches for the same endpoint', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        // Small delay to simulate network latency
        await new Promise((r) => setTimeout(r, 20));
        return {
          ok: true,
          status: 200,
          json: async () => ({ notifications: [] }),
        };
      }) as any;

      const p1 = sharedPoller.fetchDeduplicated('http://localhost:3001/api/notifications?test=1');
      const p2 = sharedPoller.fetchDeduplicated('http://localhost:3001/api/notifications?test=1');
      const p3 = sharedPoller.fetchDeduplicated('http://localhost:3001/api/notifications?test=1');

      const [res1, res2, res3] = await Promise.all([p1, p2, p3]);
      expect(callCount).toBe(1);
      expect(res1).toEqual({ notifications: [] });
      expect(res2).toEqual({ notifications: [] });
      expect(res3).toEqual({ notifications: [] });
    });

    it('handles 429 response by recording backoff without throwing crash errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '5' }),
      } as any);

      const res = await sharedPoller.fetchDeduplicated('http://localhost:3001/api/sync?address=0x123');
      // Returns last cached or null on 429 rather than exploding
      expect(res).toBeNull();
    });
  });
});
