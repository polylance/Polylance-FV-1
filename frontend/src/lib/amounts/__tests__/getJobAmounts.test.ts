import { describe, it, expect } from 'vitest';
import { getJobAmounts, normalizeTokenSymbol, formatTokenDecimals } from '../getJobAmounts';
import type { Job, NegotiationProposal } from '../../../types';

describe('getJobAmounts Resolver', () => {
  const basePolJob: Partial<Job> = {
    id: 'job-pol-1',
    title: 'Real time Payment Testing in Polylance',
    client: '0xClient123',
    paymentTokenSymbol: 'POL',
    paymentTokenDecimals: 18,
    amountEth: '9',
    amountUsdc: '1.14', // Legacy USD equivalent
    status: 'Open',
  };

  const baseUsdcJob: Partial<Job> = {
    id: 'job-usdc-1',
    title: 'Frontend Integration',
    client: '0xClient456',
    paymentTokenSymbol: 'USDC',
    paymentTokenDecimals: 6,
    amountUsdc: '1000',
    status: 'Open',
  };

  it('correctly formats formatTokenDecimals', () => {
    expect(formatTokenDecimals(9000000000000000000n, 18)).toBe('9.00');
    expect(formatTokenDecimals(8775000000000000000n, 18)).toBe('8.775');
    expect(formatTokenDecimals(9225000000000000000n, 18)).toBe('9.225');
    expect(formatTokenDecimals(225000000000000000n, 18)).toBe('0.225');
    expect(formatTokenDecimals(1000000000n, 6)).toBe('1000.00');
  });

  it('correctly handles pre-acceptance for 9 POL job (Freelancer view)', () => {
    const res = getJobAmounts(basePolJob, null, null, 'freelancer');

    expect(res.token).toBe('POL');
    expect(res.decimals).toBe(18);
    expect(res.budget).toBe('9.00');
    expect(res.effectiveAmount).toBe('9.00');
    expect(res.stage).toBe('pre-acceptance');
    expect(res.primaryLabel).toBe('Job budget');
    expect(res.roleActionLabel).toBe('You receive');
    expect(res.freelancerReceives).toBe('8.775');
    expect(res.clientPays).toBe('9.225');
    expect(res.feeClient).toBe('0.225');
    expect(res.feeFreelancer).toBe('0.225');
    expect(res.roleActionAmount).toBe('8.775');
    expect(res.locked).toBeUndefined();
  });

  it('correctly handles pre-acceptance for 9 POL job (Client view)', () => {
    const res = getJobAmounts(basePolJob, null, null, 'client');

    expect(res.token).toBe('POL');
    expect(res.stage).toBe('pre-acceptance');
    expect(res.primaryLabel).toBe('Job budget');
    expect(res.roleActionLabel).toBe('You pay (incl. fee)');
    expect(res.roleActionAmount).toBe('9.225');
  });

  it('detects pending proposal differing from budget', () => {
    const proposal: NegotiationProposal = {
      id: 'prop-1',
      jobId: 'job-pol-1',
      proposedBy: 'Freelancer',
      amountUsdc: '12.0',
      deadlineDays: 5,
      status: 'Pending',
      createdAt: Date.now(),
    };

    const res = getJobAmounts(basePolJob, proposal, null, 'freelancer');
    expect(res.proposed).toBe('12.00');
    expect(res.budget).toBe('9.00');
    expect(res.stage).toBe('pre-acceptance');
  });

  it('handles agreed-unfunded stage when terms are agreed', () => {
    const jobWithTerms: Partial<Job> = {
      ...basePolJob,
      clientAgreedTerms: true,
      freelancerAgreedTerms: true,
      negotiatedAmount: '10.0',
    };

    const res = getJobAmounts(jobWithTerms, null, null, 'client');
    expect(res.stage).toBe('agreed-unfunded');
    expect(res.primaryLabel).toBe('Agreed price');
    expect(res.effectiveAmount).toBe('10.00');
    expect(res.clientPays).toBe('10.25'); // 10 + 2.5% = 10.25
    expect(res.roleActionLabel).toBe('Deposit required');
    expect(res.roleActionAmount).toBe('10.25');
  });

  it('handles funded stage with on-chain locked amount', () => {
    const fundedJob: Partial<Job> = {
      ...basePolJob,
      status: 'Funded',
    };

    const res = getJobAmounts(fundedJob, null, { lockedAmount: '9' }, 'freelancer');
    expect(res.stage).toBe('funded');
    expect(res.primaryLabel).toBe('Escrow locked');
    expect(res.locked).toBe('9.00');
    expect(res.roleActionLabel).toBe('You receive');
    expect(res.roleActionAmount).toBe('8.775');
  });

  it('handles completed stage with settled amount', () => {
    const completedJob: Partial<Job> = {
      ...basePolJob,
      status: 'Completed',
    };

    const res = getJobAmounts(completedJob, null, { settledAmount: '9' }, 'freelancer');
    expect(res.stage).toBe('completed');
    expect(res.primaryLabel).toBe('Paid');
    expect(res.settled).toBe('9.00');
    expect(res.roleActionLabel).toBe('You received');
    expect(res.roleActionAmount).toBe('8.775');
  });

  it('handles 6-decimal USDC jobs accurately', () => {
    const res = getJobAmounts(baseUsdcJob, null, null, 'client');

    expect(res.token).toBe('USDC');
    expect(res.decimals).toBe(6);
    expect(res.budget).toBe('1000.00');
    expect(res.clientPays).toBe('1025.00'); // 1000 + 25 = 1025
    expect(res.freelancerReceives).toBe('975.00'); // 1000 - 25 = 975
    expect(res.feeClient).toBe('25.00');
    expect(res.feeFreelancer).toBe('25.00');
  });

  it('normalizes MATIC token to POL', () => {
    expect(normalizeTokenSymbol('MATIC')).toBe('POL');
    expect(normalizeTokenSymbol('matic')).toBe('POL');
    expect(normalizeTokenSymbol('POL')).toBe('POL');
    expect(normalizeTokenSymbol('USDC')).toBe('USDC');
    expect(normalizeTokenSymbol(undefined)).toBe('POL');
  });
});
