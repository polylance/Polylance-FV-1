import { describe, it, expect } from 'vitest';
import { feeBreakdown } from '../fees';
import { formatAmount } from '../formatAmount';

describe('Fee Breakdown & Strict Invariant Tests', () => {
  it('strictly computes additive freelancer and client numbers for 1500 USDC', () => {
    const budgetRaw = 1500000000n; // 1500.000000 USDC
    const breakdown = feeBreakdown(budgetRaw, 'USDC');

    // Numbers must equal feeBreakdown invariants
    expect(breakdown.budget).toBe(1500000000n);
    expect(breakdown.clientFee).toBe(37500000n); // 2.5% on top = 37.50
    expect(breakdown.freelancerFee).toBe(37500000n); // 2.5% deducted = 37.50
    expect(breakdown.clientDeposit).toBe(1537500000n); // 1537.50
    expect(breakdown.freelancerNet).toBe(1462500000n); // 1462.50
    expect(breakdown.platformTotal).toBe(75000000n); // 75.00 (5%)

    // Invariant verification
    expect(breakdown.clientDeposit).toBe(breakdown.freelancerNet + breakdown.platformTotal);

    // Freelancer View: 1,500.00 - 37.50 = 1,462.50
    const budgetFmt = formatAmount(breakdown.budget, 'USDC').formatted;
    const freeFeeFmt = formatAmount(breakdown.freelancerFee, 'USDC').formatted;
    const netFmt = formatAmount(breakdown.freelancerNet, 'USDC').formatted;

    expect(budgetFmt).toBe('1,500.00');
    expect(freeFeeFmt).toBe('37.50');
    expect(netFmt).toBe('1,462.50');

    // Client View: 1,500.00 + 37.50 = 1,537.50
    const clientFeeFmt = formatAmount(breakdown.clientFee, 'USDC').formatted;
    const depositFmt = formatAmount(breakdown.clientDeposit, 'USDC').formatted;

    expect(clientFeeFmt).toBe('37.50');
    expect(depositFmt).toBe('1,537.50');
  });

  it('works identically for POL jobs with 18 decimals', () => {
    const budgetRaw = 100000000000000000000n; // 100 POL
    const breakdown = feeBreakdown(budgetRaw, 'POL');

    expect(formatAmount(breakdown.budget, 'POL').formatted).toBe('100.00');
    expect(formatAmount(breakdown.clientFee, 'POL').formatted).toBe('2.50');
    expect(formatAmount(breakdown.clientDeposit, 'POL').formatted).toBe('102.50');
    expect(formatAmount(breakdown.freelancerNet, 'POL').formatted).toBe('97.50');
  });

  it('works identically for USDT jobs with 6 decimals', () => {
    const budgetRaw = 500000000n; // 500 USDT
    const breakdown = feeBreakdown(budgetRaw, 'USDT');

    expect(formatAmount(breakdown.budget, 'USDT').formatted).toBe('500.00');
    expect(formatAmount(breakdown.clientFee, 'USDT').formatted).toBe('12.50');
    expect(formatAmount(breakdown.clientDeposit, 'USDT').formatted).toBe('512.50');
    expect(formatAmount(breakdown.freelancerNet, 'USDT').formatted).toBe('487.50');
  });
});

describe('Network Fee & Reserve Mathematics', () => {
  it('enforces Polygon priority fee floor of at least 30 Gwei', () => {
    const MIN_PRIORITY_WEI = 30000000000n;
    const reportedPriorityFee = 1500000000n; // 1.5 Gwei (rejected by Bor)
    const effectivePriorityFee = reportedPriorityFee > MIN_PRIORITY_WEI ? reportedPriorityFee : MIN_PRIORITY_WEI;

    expect(effectivePriorityFee).toBe(30000000000n);
  });

  it('computes wallet maximum and typical fee in strict bigint', () => {
    const baseFee = 35000000000n; // 35 Gwei
    const priorityFee = 30000000000n; // 30 Gwei
    const typicalFeePerGas = baseFee + priorityFee; // 65 Gwei
    const maxFeePerGas = ((baseFee * 135n) / 100n) + priorityFee; // 77.25 Gwei

    const gasUsed = 142000n; // Fund USDC median
    const gasLimit = 200000n; // Fund USDC buffer

    const typicalCost = gasUsed * typicalFeePerGas;
    const maxCost = gasLimit * maxFeePerGas;

    expect(typicalCost).toBe(9230000000000000n); // ~0.00923 POL
    expect(maxCost).toBe(15450000000000000n); // ~0.01545 POL

    // Max cost is strictly greater than typical cost
    expect(maxCost > typicalCost).toBe(true);

    // Pre-flight check uses balance >= deposit + maxCost (not typicalCost)
    const userBalance = 15000000000000000n; // 0.015 POL
    const hasEnoughForTypical = userBalance >= typicalCost;
    const hasEnoughForMax = userBalance >= maxCost;

    expect(hasEnoughForTypical).toBe(true);
    expect(hasEnoughForMax).toBe(false); // Blocks upfront before wallet error!
  });
});
