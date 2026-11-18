import { describe, it, expect } from 'vitest';
import {
  mapPublicStats,
  calculateLiveFees,
  resolveReputationState,
} from '../publicStatsMapper';
import { PublicStatsData } from '../../hooks/usePublicStats';

describe('Public Stats Mapper & Live Fee Calculator', () => {
  describe('Fee Calculator Unit Tests', () => {
    it('calculates 9 POL correctly (client: 9.225, freelancer: 8.775, fee: 0.45)', () => {
      const calc = calculateLiveFees(9, 'POL');
      expect(parseFloat(calc.clientPays)).toBe(9.225);
      expect(parseFloat(calc.freelancerReceives)).toBe(8.775);
      expect(parseFloat(calc.totalFee)).toBe(0.45);
      expect(parseFloat(calc.clientFee)).toBe(0.225);
      expect(parseFloat(calc.freelancerFee)).toBe(0.225);
    });

    it('calculates 100 USDC correctly (client: 102.50, freelancer: 97.50, fee: 5.00)', () => {
      const calc = calculateLiveFees(100, 'USDC');
      expect(parseFloat(calc.clientPays)).toBe(102.5);
      expect(parseFloat(calc.freelancerReceives)).toBe(97.5);
      expect(parseFloat(calc.totalFee)).toBe(5);
    });

    it('handles zero budget safely without NaN or negative values', () => {
      const calc = calculateLiveFees(0, 'POL');
      expect(parseFloat(calc.clientPays)).toBe(0);
      expect(parseFloat(calc.freelancerReceives)).toBe(0);
      expect(parseFloat(calc.totalFee)).toBe(0);
    });

    it('handles small dust amounts with ceil client fee rounding', () => {
      const calc = calculateLiveFees(0.01, 'POL');
      expect(parseFloat(calc.clientPays)).toBeGreaterThan(0.01);
      expect(parseFloat(calc.freelancerReceives)).toBeLessThanOrEqual(0.01);
    });
  });

  describe('Stats Mapper Unit Tests', () => {
    it('handles null raw data gracefully with honest zero states', () => {
      const mapped = mapPublicStats(null);
      expect(mapped.escrow.polLocked).toBe(0);
      expect(mapped.escrow.usdcLocked).toBe(0);
      expect(mapped.escrow.activeCount).toBe(0);
      expect(mapped.escrow.hasFundsLocked).toBe(false);
      expect(mapped.certificates.totalIssued).toBe(0);
      expect(mapped.certificates.latest).toBeNull();
      expect(mapped.disputes.opened).toBe(0);
      expect(mapped.disputes.hasResolvedCases).toBe(false);
      expect(mapped.completedJobs).toBe(0);
    });

    it('maps valid aggregate statistics accurately', () => {
      const mockRaw: PublicStatsData = {
        updatedAt: '2026-10-25T12:00:00Z',
        chainId: 137,
        escrow: {
          lockedByToken: {
            POL: 12.5,
            USDC: 250.0,
          },
          activeCount: 3,
          contractAddress: '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB',
          sourceVerified: true,
        },
        certificates: {
          totalIssued: 15,
          latest: {
            tokenId: '42',
            mintedAt: '2026-10-24T18:00:00Z',
            txHash: '0xabc123',
            contract: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
          },
        },
        disputes: {
          opened: 2,
          resolved: 2,
          outcomes: {
            fullRelease: 1,
            fullRefund: 1,
            split: 0,
          },
        },
        jobs: {
          completed: 15,
        },
        reputation: {
          tiers: [
            { name: 'Bronze', minPoints: 0, maxPoints: 199 },
            { name: 'Silver', minPoints: 200, maxPoints: 499 },
          ],
        },
      };

      const mapped = mapPublicStats(mockRaw);
      expect(mapped.escrow.polLocked).toBe(12.5);
      expect(mapped.escrow.usdcLocked).toBe(250);
      expect(mapped.escrow.activeCount).toBe(3);
      expect(mapped.escrow.hasFundsLocked).toBe(true);
      expect(mapped.certificates.totalIssued).toBe(15);
      expect(mapped.certificates.latest?.tokenId).toBe('42');
      expect(mapped.disputes.hasResolvedCases).toBe(true);
      expect(mapped.disputes.outcomes.releasePercent).toBe(50);
      expect(mapped.disputes.outcomes.refundPercent).toBe(50);
      expect(mapped.completedJobs).toBe(15);
    });
  });

  describe('Personalized vs Visitor Reputation State', () => {
    it('returns visitor state when wallet address is not connected', () => {
      const state = resolveReputationState(null);
      expect(state.isPersonalized).toBe(false);
      expect(state.tierName).toBe('Visitor');
      expect(state.score).toBe(0);
      expect(state.completedJobs).toBe(0);
    });

    it('returns personalized tier and score when wallet is provided', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const state = resolveReputationState(address, [], {
        address,
        role: 'freelancer',
        createdAt: 0,
        name: 'Test Dev',
      });
      expect(state.isPersonalized).toBe(true);
      expect(state.tierName).toContain('Tier');
      expect(typeof state.score).toBe('number');
    });
  });
});
