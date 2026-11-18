/**
 * PolyLance Public Stats Mapper & Fee Calculator Helpers
 * Pure deterministic functions for:
 * 1. Safely parsing aggregate stats (token decimals, zero states, small numbers)
 * 2. Calculating real fee breakdowns for the live landing calculator
 * 3. Handling personalized vs visitor reputation states
 */

import { PublicStatsData } from '../hooks/usePublicStats';
import { feeBreakdown } from './fees';
import { toBaseUnits } from './formatAmount';
import { ethers } from 'ethers';
import { calculateReputationScores, getReputationTier, ReputationScores } from './reputation';
import { Job, UserProfile } from '../types';

export interface FormattedEscrowStats {
  polLocked: number;
  usdcLocked: number;
  activeCount: number;
  contractAddress: string;
  sourceVerified: boolean;
  hasFundsLocked: boolean;
}

export interface FormattedCertStats {
  totalIssued: number;
  latest: {
    tokenId: string;
    mintedAt: string | number;
    txHash: string | null;
    contract: string;
  } | null;
}

export interface FormattedDisputeStats {
  opened: number;
  resolved: number;
  hasResolvedCases: boolean;
  outcomes: {
    fullRelease: number;
    fullRefund: number;
    split: number;
    releasePercent: number;
    refundPercent: number;
    splitPercent: number;
  };
}

export interface FormattedReputationStats {
  isPersonalized: boolean;
  score: number;
  tierName: string;
  tierColor: string;
  completedJobs: number;
  nextTierThreshold: number | null;
  progressPercent: number;
}

export interface LiveFeeCalculation {
  budgetNumber: number;
  token: 'POL' | 'USDC';
  clientPays: string;
  freelancerReceives: string;
  totalFee: string;
  clientFee: string;
  freelancerFee: string;
  clientDepositUnits: bigint;
  freelancerNetUnits: bigint;
  totalFeeUnits: bigint;
}

/**
 * Maps raw public stats into safe, typed view-models.
 * Handles zero states, dust amounts, and missing records gracefully.
 */
export function mapPublicStats(raw: PublicStatsData | null) {
  const escrow: FormattedEscrowStats = {
    polLocked: Number(raw?.escrow?.lockedByToken?.POL ?? 0),
    usdcLocked: Number(raw?.escrow?.lockedByToken?.USDC ?? 0),
    activeCount: Math.max(0, raw?.escrow?.activeCount ?? 0),
    contractAddress: raw?.escrow?.contractAddress || '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB',
    sourceVerified: !!raw?.escrow?.sourceVerified,
    hasFundsLocked: (Number(raw?.escrow?.lockedByToken?.POL ?? 0) > 0) || (Number(raw?.escrow?.lockedByToken?.USDC ?? 0) > 0),
  };

  const certificates: FormattedCertStats = {
    totalIssued: Math.max(0, raw?.certificates?.totalIssued ?? 0),
    latest: raw?.certificates?.latest ?? null,
  };

  const opened = Math.max(0, raw?.disputes?.opened ?? 0);
  const resolved = Math.max(0, raw?.disputes?.resolved ?? 0);
  const fullRelease = Math.max(0, raw?.disputes?.outcomes?.fullRelease ?? 0);
  const fullRefund = Math.max(0, raw?.disputes?.outcomes?.fullRefund ?? 0);
  const split = Math.max(0, raw?.disputes?.outcomes?.split ?? 0);
  const totalOutcomes = fullRelease + fullRefund + split;

  const disputes: FormattedDisputeStats = {
    opened,
    resolved,
    hasResolvedCases: resolved > 0 && totalOutcomes > 0,
    outcomes: {
      fullRelease,
      fullRefund,
      split,
      releasePercent: totalOutcomes > 0 ? Math.round((fullRelease / totalOutcomes) * 100) : 0,
      refundPercent: totalOutcomes > 0 ? Math.round((fullRefund / totalOutcomes) * 100) : 0,
      splitPercent: totalOutcomes > 0 ? Math.round((split / totalOutcomes) * 100) : 0,
    },
  };

  const completedJobs = Math.max(0, raw?.jobs?.completed ?? 0);

  return {
    escrow,
    certificates,
    disputes,
    completedJobs,
    tiers: raw?.reputation?.tiers || [
      { name: 'Bronze', minPoints: 0, maxPoints: 199 },
      { name: 'Silver', minPoints: 200, maxPoints: 499 },
      { name: 'Gold', minPoints: 500, maxPoints: 999 },
      { name: 'Diamond', minPoints: 1000, maxPoints: null },
    ],
  };
}

/**
 * Resolves user reputation status: personalized (connected wallet) vs visitor state.
 */
export function resolveReputationState(
  connectedAddress?: string | null,
  jobs: Job[] = [],
  profile?: UserProfile | null
): FormattedReputationStats {
  if (!connectedAddress) {
    return {
      isPersonalized: false,
      score: 0,
      tierName: 'Visitor',
      tierColor: 'slate',
      completedJobs: 0,
      nextTierThreshold: 200,
      progressPercent: 0,
    };
  }

  const scores: ReputationScores = calculateReputationScores(connectedAddress, jobs, profile);
  const tierInfo = getReputationTier(scores.totalPoints);

  let nextThreshold: number | null = 200;
  let prevThreshold = 0;

  if (tierInfo.tier === 'Bronze') {
    prevThreshold = 0;
    nextThreshold = 200;
  } else if (tierInfo.tier === 'Silver') {
    prevThreshold = 200;
    nextThreshold = 500;
  } else if (tierInfo.tier === 'Gold') {
    prevThreshold = 500;
    nextThreshold = 1000;
  } else {
    prevThreshold = 1000;
    nextThreshold = null;
  }

  let progress = 100;
  if (nextThreshold !== null) {
    const range = nextThreshold - prevThreshold;
    const current = Math.max(0, scores.totalPoints - prevThreshold);
    progress = Math.min(100, Math.max(0, Math.round((current / range) * 100)));
  }

  return {
    isPersonalized: true,
    score: scores.totalPoints,
    tierName: tierInfo.label,
    tierColor: tierInfo.color,
    completedJobs: scores.completedJobsCount,
    nextTierThreshold: nextThreshold,
    progressPercent: progress,
  };
}

/**
 * Computes exact fee amounts for the landing page fee calculator.
 * Strictly adheres to 2.5% client fee + 2.5% freelancer fee.
 */
export function calculateLiveFees(
  budgetInput: string | number,
  token: 'POL' | 'USDC' = 'POL'
): LiveFeeCalculation {
  const decimals = token === 'USDC' ? 6 : 18;
  const num = typeof budgetInput === 'number' ? budgetInput : parseFloat(String(budgetInput)) || 0;
  const safeNum = Math.max(0, num);

  // Convert to base units for exact BigInt math
  const budgetUnits = toBaseUnits(safeNum.toString(), decimals);
  const breakdown = feeBreakdown(budgetUnits, token);

  return {
    budgetNumber: safeNum,
    token,
    clientPays: ethers.formatUnits(breakdown.clientDeposit, decimals),
    freelancerReceives: ethers.formatUnits(breakdown.freelancerNet, decimals),
    totalFee: ethers.formatUnits(breakdown.platformTotal, decimals),
    clientFee: ethers.formatUnits(breakdown.clientFee, decimals),
    freelancerFee: ethers.formatUnits(breakdown.freelancerFee, decimals),
    clientDepositUnits: breakdown.clientDeposit,
    freelancerNetUnits: breakdown.freelancerNet,
    totalFeeUnits: breakdown.platformTotal,
  };
}
