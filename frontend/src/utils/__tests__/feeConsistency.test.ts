import { describe, it, expect } from 'vitest';
import {
  CLIENT_FEE_BPS,
  FREELANCER_FEE_BPS,
  CLIENT_FEE_PERCENT,
  FREELANCER_FEE_PERCENT,
  TOTAL_PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_CLIENT_PERCENT,
  PLATFORM_FEE_FREELANCER_PERCENT,
  PLATFORM_FEE_TOTAL_PERCENT,
  feeBreakdown,
  calculateFeeBreakdownFromString,
  calculateClientTotal,
  calculateFreelancerPayout
} from '../fees';
import { ethers } from 'ethers';

describe('Fee Consistency & Platform Invariant Test Suite', () => {
  it('should have exact 2.5% client fee and 2.5% freelancer fee (5.0% total)', () => {
    expect(CLIENT_FEE_BPS).toBe(250n);
    expect(FREELANCER_FEE_BPS).toBe(250n);
    expect(CLIENT_FEE_PERCENT).toBe(2.5);
    expect(FREELANCER_FEE_PERCENT).toBe(2.5);
    expect(TOTAL_PLATFORM_FEE_PERCENT).toBe(5.0);
    expect(PLATFORM_FEE_CLIENT_PERCENT).toBe(2.5);
    expect(PLATFORM_FEE_FREELANCER_PERCENT).toBe(2.5);
    expect(PLATFORM_FEE_TOTAL_PERCENT).toBe(5.0);
  });

  it('should calculate exact client total and freelancer payout for 9 POL', () => {
    const budgetWei = ethers.parseEther('9');
    const breakdown = feeBreakdown(budgetWei, 'POL');

    expect(ethers.formatEther(breakdown.clientFee)).toBe('0.225');
    expect(ethers.formatEther(breakdown.freelancerFee)).toBe('0.225');
    expect(ethers.formatEther(breakdown.clientDeposit)).toBe('9.225');
    expect(ethers.formatEther(breakdown.freelancerNet)).toBe('8.775');
    expect(ethers.formatEther(breakdown.platformTotal)).toBe('0.45');

    // Convenience functions
    expect(calculateClientTotal('9', 'POL')).toBe('9.225');
    expect(calculateFreelancerPayout('9', 'POL')).toBe('8.775');
  });

  it('should calculate exact client total and freelancer payout for 10 USDC', () => {
    const result = calculateFeeBreakdownFromString('10', 'USDC');
    expect(result.clientFee).toBe('0.25');
    expect(result.freelancerFee).toBe('0.25');
    expect(result.clientDeposit).toBe('10.25');
    expect(result.freelancerNet).toBe('9.75');
    expect(result.platformTotal).toBe('0.5');

    expect(calculateClientTotal('10', 'USDC')).toBe('10.25');
    expect(calculateFreelancerPayout('10', 'USDC')).toBe('9.75');
  });

  it('should calculate exact client total and freelancer payout for 100 USDC', () => {
    const result = calculateFeeBreakdownFromString('100', 'USDC');
    expect(result.clientFee).toBe('2.5');
    expect(result.freelancerFee).toBe('2.5');
    expect(result.clientDeposit).toBe('102.5');
    expect(result.freelancerNet).toBe('97.5');
    expect(result.platformTotal).toBe('5.0');

    expect(calculateClientTotal('100', 'USDC')).toBe('102.5');
    expect(calculateFreelancerPayout('100', 'USDC')).toBe('97.5');
  });

  it('should calculate exact client total and freelancer payout for 1,000 USDC', () => {
    const result = calculateFeeBreakdownFromString('1000', 'USDC');
    expect(result.clientFee).toBe('25.0');
    expect(result.freelancerFee).toBe('25.0');
    expect(result.clientDeposit).toBe('1025.0');
    expect(result.freelancerNet).toBe('975.0');
    expect(result.platformTotal).toBe('50.0');

    expect(calculateClientTotal('1000', 'USDC')).toBe('1025.0');
    expect(calculateFreelancerPayout('1000', 'USDC')).toBe('975.0');
  });

  it('should preserve strict conservation of value invariant: clientDeposit === freelancerNet + platformTotal', () => {
    const testAmounts = ['0.5', '1', '7.77', '9', '15.25', '100', '999.99', '1000', '50000'];
    for (const amt of testAmounts) {
      const polResult = calculateFeeBreakdownFromString(amt, 'POL');
      expect(polResult.breakdown.clientDeposit).toBe(
        polResult.breakdown.freelancerNet + polResult.breakdown.platformTotal
      );

      const usdcResult = calculateFeeBreakdownFromString(amt, 'USDC');
      expect(usdcResult.breakdown.clientDeposit).toBe(
        usdcResult.breakdown.freelancerNet + usdcResult.breakdown.platformTotal
      );
    }
  });
});
