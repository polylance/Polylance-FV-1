import { describe, it, expect } from 'vitest';
import {
  buildFundingParameters,
  checkPaymentReadiness,
  needsUsdtZeroReset,
  decodeRevertReason,
  KNOWN_CONTRACTS,
} from '../txBuilder';
import { ethers } from 'ethers';

describe('txBuilder - Funding Parameters Builder', () => {
  it('correctly formats Native POL jobs: tokenAmount is 0 and value is set with 2.5% fee', () => {
    const job = {
      amountEth: '10',
      paymentTokenSymbol: 'POL',
      contractAddress: '0x1111111111111111111111111111111111111111',
    };

    const params = buildFundingParameters(job);

    expect(params.isNative).toBe(true);
    expect(params.tokenSymbol).toBe('POL');
    expect(params.decimals).toBe(18);
    expect(params.principalUnits).toBe(ethers.parseEther('10'));

    // 2.5% fee on 10 POL is 0.25 POL
    const expectedFee = ethers.parseEther('0.25');
    const expectedTotal = ethers.parseEther('10.25');

    expect(params.feeUnits).toBe(expectedFee);
    expect(params.totalRequiredUnits).toBe(expectedTotal);

    // Hard requirement: Native job -> tokenAmount is 0n and value is totalRequiredUnits
    expect(params.tokenAmountArg).toBe(0n);
    expect(params.valueArg).toBe(expectedTotal);
  });

  it('correctly formats ERC-20 USDC jobs: tokenAmount is principal and value is 0', () => {
    const job = {
      amountUsdc: '500',
      paymentTokenSymbol: 'USDC',
      paymentToken: KNOWN_CONTRACTS.POLYGON_USDC,
      contractAddress: '0x2222222222222222222222222222222222222222',
    };

    const params = buildFundingParameters(job);

    expect(params.isNative).toBe(false);
    expect(params.tokenSymbol).toBe('USDC');
    expect(params.decimals).toBe(6);

    const expectedPrincipal = 500_000_000n; // 500 * 10^6
    const expectedFee = (expectedPrincipal * 250n) / 10000n; // 12.5 USDC = 12_500_000n
    const expectedTotal = expectedPrincipal + expectedFee; // 512.5 USDC

    expect(params.principalUnits).toBe(expectedPrincipal);
    expect(params.feeUnits).toBe(expectedFee);
    expect(params.totalRequiredUnits).toBe(expectedTotal);

    // Hard requirement: Token job -> tokenAmount is principalUnits and value is 0n
    expect(params.tokenAmountArg).toBe(expectedPrincipal);
    expect(params.valueArg).toBe(0n);
    expect(params.requiredConfirmations).toBe(5); // $500 is in tier 2 (5 confs)
  });

  it('correctly assigns high confirmation depth (10) for large jobs > $2500', () => {
    const job = {
      amountUsdc: '5000',
      paymentTokenSymbol: 'USDC',
    };
    const params = buildFundingParameters(job);
    expect(params.requiredConfirmations).toBe(10);
  });
});

describe('txBuilder - Payment Readiness Pre-checks', () => {
  it('blocks payment and warns if holding USDC but zero POL for gas', () => {
    const check = checkPaymentReadiness({
      isNative: false,
      tokenSymbol: 'USDC',
      nativePolBalance: 0n,
      tokenBalance: 1000_000_000n, // has 1000 USDC
      totalRequiredUnits: 100_000_000n,
    });

    expect(check.ready).toBe(false);
    expect(check.isGasShortage).toBe(true);
    expect(check.errorMessage).toBe('You need a small amount of POL for network fees.');
  });

  it('passes payment readiness when both token balance and POL gas are sufficient', () => {
    const check = checkPaymentReadiness({
      isNative: false,
      tokenSymbol: 'USDC',
      nativePolBalance: ethers.parseEther('1.5'),
      tokenBalance: 200_000_000n,
      totalRequiredUnits: 102_500_000n,
    });

    expect(check.ready).toBe(true);
    expect(check.errorMessage).toBeUndefined();
  });

  it('fails if POL balance is less than required funding + gas for native job', () => {
    const check = checkPaymentReadiness({
      isNative: true,
      tokenSymbol: 'POL',
      nativePolBalance: ethers.parseEther('1.0'),
      tokenBalance: 0n,
      totalRequiredUnits: ethers.parseEther('1.0'), // Need 1.0 + gas
      estimatedGasFeeWei: ethers.parseEther('0.05'),
    });

    expect(check.ready).toBe(false);
    expect(check.isGasShortage).toBe(true);
    expect(check.errorMessage).toContain('Insufficient POL balance');
  });
});

describe('txBuilder - USDT Allowance Quirk', () => {
  it('detects when USDT allowance needs to be reset to 0 first', () => {
    const usdtAddress = KNOWN_CONTRACTS.POLYGON_USDT;
    const currentAllowance = 50_000_000n; // 50 USDT
    const targetAmount = 100_000_000n; // 100 USDT

    expect(needsUsdtZeroReset(usdtAddress, currentAllowance, targetAmount)).toBe(true);
  });

  it('does not reset USDT allowance if current allowance is 0', () => {
    const usdtAddress = KNOWN_CONTRACTS.POLYGON_USDT;
    expect(needsUsdtZeroReset(usdtAddress, 0n, 100_000_000n)).toBe(false);
  });

  it('does not reset allowance for USDC', () => {
    const usdcAddress = KNOWN_CONTRACTS.POLYGON_USDC;
    expect(needsUsdtZeroReset(usdcAddress, 50_000_000n, 100_000_000n)).toBe(false);
  });
});

describe('txBuilder - Revert Decoder', () => {
  it('decodes user cancellation into clear reassurance without raw stack traces', () => {
    const err = new Error('MetaMask Tx Signature: User denied transaction signature.');
    const decoded = decodeRevertReason(err);
    expect(decoded.title).toBe('Transaction Cancelled');
    expect(decoded.message).toContain('No funds were moved');
  });

  it('decodes rate limiting (429) clearly', () => {
    const err = { message: 'Request failed with status code 429: Too Many Requests' };
    const decoded = decodeRevertReason(err);
    expect(decoded.title).toBe('Network Congestion');
    expect(decoded.message).toContain('No funds were moved');
  });
});
