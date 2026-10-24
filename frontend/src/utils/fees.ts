import { ethers } from 'ethers';

export const CLIENT_FEE_BPS = 250n; // 2.5%
export const FREELANCER_FEE_BPS = 250n; // 2.5%
export const BPS_DIVISOR = 10000n;

export const CLIENT_FEE_PERCENT = Number(CLIENT_FEE_BPS) / 100; // 2.5
export const FREELANCER_FEE_PERCENT = Number(FREELANCER_FEE_BPS) / 100; // 2.5
export const TOTAL_PLATFORM_FEE_PERCENT = Number(CLIENT_FEE_BPS + FREELANCER_FEE_BPS) / 100; // 5.0

export interface FeeBreakdown {
  budget: bigint;
  clientFee: bigint;
  freelancerFee: bigint;
  clientDeposit: bigint;
  freelancerNet: bigint;
  platformTotal: bigint;
  bps: {
    client: number;
    freelancer: number;
    total: number;
  };
}

export interface FormattedFeeBreakdown {
  budget: string;
  clientFee: string;
  freelancerFee: string;
  clientDeposit: string;
  freelancerNet: string;
  platformTotal: string;
  tokenSymbol: string;
  decimals: number;
}

/**
 * ONE pure function calculating the exact fee breakdown for a given budget using basis points and BigInt.
 * Strict Invariant: clientDeposit === freelancerNet + platformTotal
 * 
 * Rounding Rule:
 * - clientFee: Ceil division ((budget * 250n + 9999n) / 10000n) to prevent zero-fee on dust amounts.
 * - freelancerFee: Floor division ((budget * 250n) / 10000n).
 * - platformTotal = clientFee + freelancerFee.
 * - clientDeposit = budget + clientFee.
 * - freelancerNet = budget - freelancerFee.
 * Exactly preserves clientDeposit === freelancerNet + platformTotal with zero stranded value.
 */
export function feeBreakdown(budget: bigint, _token?: string): FeeBreakdown {
  if (budget < 0n) {
    throw new Error('Budget cannot be negative');
  }

  // Ceil division for client fee: avoids dust underflow
  const clientFee = (budget * CLIENT_FEE_BPS + (BPS_DIVISOR - 1n)) / BPS_DIVISOR;
  // Floor division for freelancer fee
  const freelancerFee = (budget * FREELANCER_FEE_BPS) / BPS_DIVISOR;

  const clientDeposit = budget + clientFee;
  const freelancerNet = budget - freelancerFee;
  const platformTotal = clientFee + freelancerFee;

  // Invariant verification
  if (clientDeposit !== freelancerNet + platformTotal) {
    throw new Error(
      `Fee invariant violation: clientDeposit (${clientDeposit}) !== freelancerNet (${freelancerNet}) + platformTotal (${platformTotal})`
    );
  }

  return {
    budget,
    clientFee,
    freelancerFee,
    clientDeposit,
    freelancerNet,
    platformTotal,
    bps: {
      client: Number(CLIENT_FEE_BPS),
      freelancer: Number(FREELANCER_FEE_BPS),
      total: Number(CLIENT_FEE_BPS + FREELANCER_FEE_BPS),
    },
  };
}

/**
 * Formats a FeeBreakdown into human-readable decimal strings given a token symbol and decimals.
 */
export function formatFeeBreakdown(
  breakdown: FeeBreakdown,
  tokenSymbol: string = 'POL',
  decimals: number = 18
): FormattedFeeBreakdown {
  return {
    budget: ethers.formatUnits(breakdown.budget, decimals),
    clientFee: ethers.formatUnits(breakdown.clientFee, decimals),
    freelancerFee: ethers.formatUnits(breakdown.freelancerFee, decimals),
    clientDeposit: ethers.formatUnits(breakdown.clientDeposit, decimals),
    freelancerNet: ethers.formatUnits(breakdown.freelancerNet, decimals),
    platformTotal: ethers.formatUnits(breakdown.platformTotal, decimals),
    tokenSymbol: tokenSymbol.toUpperCase(),
    decimals,
  };
}

/**
 * Convenience helper to calculate fee breakdown directly from a decimal string input (e.g., "10", "10.5").
 */
export interface CalculatedFeeResult extends FormattedFeeBreakdown {
  breakdown: FeeBreakdown;
  formatted: FormattedFeeBreakdown;
  budgetFormatted: string;
  clientFeeFormatted: string;
  clientDepositFormatted: string;
  freelancerFeeFormatted: string;
  freelancerNetFormatted: string;
  platformTotalFormatted: string;
  token: string;
}

export function calculateFeeBreakdownFromString(
  amountStr: string,
  tokenSymbol: string = 'POL'
): CalculatedFeeResult {
  const isNative = tokenSymbol.toUpperCase() === 'POL' || tokenSymbol.toUpperCase() === 'MATIC';
  const decimals = isNative ? 18 : 6;
  
  const cleanStr = (amountStr || '0').trim();
  let budgetUnits = 0n;
  try {
    budgetUnits = ethers.parseUnits(cleanStr || '0', decimals);
  } catch {
    budgetUnits = 0n;
  }

  const breakdown = feeBreakdown(budgetUnits, tokenSymbol);
  const formatted = formatFeeBreakdown(breakdown, tokenSymbol, decimals);

  return {
    ...formatted,
    breakdown,
    formatted,
    budgetFormatted: formatted.budget,
    clientFeeFormatted: formatted.clientFee,
    clientDepositFormatted: formatted.clientDeposit,
    freelancerFeeFormatted: formatted.freelancerFee,
    freelancerNetFormatted: formatted.freelancerNet,
    platformTotalFormatted: formatted.platformTotal,
    token: formatted.tokenSymbol,
  };
}
