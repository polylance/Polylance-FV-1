import { ethers } from 'ethers';
import { feeBreakdown } from '../../utils/fees';
import { toBaseUnits, getTokenDecimals } from '../../utils/formatAmount';
import type { Job, NegotiationProposal } from '../../types';

export type ViewerRole = 'client' | 'freelancer' | 'judge' | 'admin' | 'visitor';

export type JobAmountStage =
  | 'pre-acceptance' // Job is Open, no accepted proposal, no funded escrow
  | 'agreed-unfunded' // Proposal accepted or terms agreed, but escrow not funded yet
  | 'funded' // Escrow funded on-chain, job in progress / submitted / disputed
  | 'completed' // Job completed & escrow released
  | 'cancelled'; // Escrow cancelled / refunded

export interface EscrowAmountRecord {
  lockedAmount?: string | bigint;
  settledAmount?: string | bigint;
  token?: string;
  decimals?: number;
}

export interface JobAmountsResult {
  /** Canonical token symbol, e.g. "POL" or "USDC" */
  token: string;
  /** Decimals for this token (18 for POL, 6 for USDC) */
  decimals: number;
  /** Client-set job budget string in token units (e.g. "9.00") */
  budget: string;
  /** Active proposed price if pending and differs from budget */
  proposed?: string;
  /** Agreed / negotiated price if accepted */
  agreed?: string;
  /** Actually locked amount in escrow contract (only when funded/completed) */
  locked?: string;
  /** Actually settled / released amount (for completed jobs) */
  settled?: string;
  /** The effective base amount for the current stage (budget, agreed, locked, or settled) */
  effectiveAmount: string;
  /** Total client deposit / pay amount including client fee (budget + 2.5%) */
  clientPays: string;
  /** Net freelancer receive amount after freelancer fee (budget - 2.5%) */
  freelancerReceives: string;
  /** Client fee amount (2.5%) */
  feeClient: string;
  /** Freelancer fee amount (2.5%) */
  feeFreelancer: string;
  /** Stage of the amount lifecycle */
  stage: JobAmountStage;
  /** Label for the primary amount chip by stage, e.g. "Job budget", "Agreed price", "Escrow locked", "Paid" */
  primaryLabel: string;
  /** Label for the second role-aware chip ("You receive", "You pay (incl. fee)", "Deposit required", "You paid") */
  roleActionLabel: string;
  /** The value corresponding to roleActionLabel (freelancerReceives or clientPays) */
  roleActionAmount: string;
  /** Raw bigints for contract transactions */
  raw: {
    effectiveUnits: bigint;
    clientDepositUnits: bigint;
    freelancerNetUnits: bigint;
    clientFeeUnits: bigint;
    freelancerFeeUnits: bigint;
  };
}

/**
 * Normalizes payment token symbol ('MATIC' -> 'POL', default 'POL').
 */
export function normalizeTokenSymbol(token?: string): string {
  const t = (token || '').trim().toUpperCase();
  if (t === 'MATIC' || t === 'POL') return 'POL';
  if (t === 'USDC') return 'USDC';
  if (t === 'USDT') return 'USDT';
  if (t === 'ETH') return 'ETH';
  return t || 'POL';
}

/**
 * Formats a bigint into a clean decimal string with minimum 2 decimal places,
 * without thousands commas, and trimming unnecessary trailing zeroes beyond 2 decimals.
 * Examples:
 *   9000000000000000000n (18 dec) -> "9.00"
 *   8775000000000000000n (18 dec) -> "8.775"
 *   9225000000000000000n (18 dec) -> "9.225"
 *   225000000000000000n  (18 dec) -> "0.225"
 *   1000000000n (6 dec)          -> "1000.00"
 */
export function formatTokenDecimals(units: bigint, decimals: number): string {
  const isNegative = units < 0n;
  const absUnits = isNegative ? -units : units;
  const rawStr = ethers.formatUnits(absUnits, decimals);

  const [intPart, fracPart = ''] = rawStr.split('.');
  // Trim trailing zeros, but preserve at least 2 decimal places
  let trimmed = fracPart.replace(/0+$/, '');
  while (trimmed.length < 2) {
    trimmed += '0';
  }

  return `${isNegative ? '-' : ''}${intPart}.${trimmed}`;
}

/**
 * Extracts the canonical client-set budget from a Job record.
 * Handles legacy records where amountUsdc was used for USD equivalent on POL jobs.
 */
export function getCanonicalJobBudget(job: Partial<Job> | null | undefined, tokenSymbol: string): string {
  if (!job) return '0';

  if (tokenSymbol === 'POL') {
    // For POL jobs, amountEth is the client-set budget in POL (e.g. "9" or "9.00").
    if (job.amountEth && parseFloat(job.amountEth) > 0) {
      return job.amountEth;
    }
    // If amountEth is missing, check if budget exists
    if ((job as any).budget && parseFloat((job as any).budget) > 0) {
      return (job as any).budget;
    }
    // Fallback to amountUsdc if it's the only field
    return job.amountUsdc || '0';
  }

  // For USDC, USDT, etc.
  return job.amountUsdc || (job as any).budget || job.amountEth || '0';
}

/**
 * Resolves the accurate amount model, fees, stage, and role-aware labels for any job.
 * Single source of truth for:
 * 1. Chat sidebar channel cards
 * 2. Chat header strip
 * 3. Chat header action chips
 * 4. Payment breakdown right panel
 * 5. Proposal cards & modals
 * 6. Dashboard, JobDetail, Workspace, and Certificates
 */
export function getJobAmounts(
  job: Partial<Job> | null | undefined,
  proposal?: NegotiationProposal | null,
  escrow?: EscrowAmountRecord | null,
  viewerRole: ViewerRole = 'freelancer'
): JobAmountsResult {
  const token = normalizeTokenSymbol(escrow?.token || job?.paymentTokenSymbol || (job?.amountEth ? 'POL' : 'USDC'));
  const decimals = escrow?.decimals || job?.paymentTokenDecimals || getTokenDecimals(token);

  // 1. Job Budget (client-set)
  const rawBudgetString = getCanonicalJobBudget(job, token);
  const budgetUnits = toBaseUnits(rawBudgetString, decimals);
  const budgetFmt = formatTokenDecimals(budgetUnits, decimals);

  // 2. Identify active proposals (if any)
  const allProposals = (job?.negotiationProposals || []);
  const acceptedProposal = proposal?.status === 'Accepted'
    ? proposal
    : allProposals.find((p) => p.status === 'Accepted');

  const pendingProposal = proposal?.status === 'Pending'
    ? proposal
    : allProposals.find((p) => p.status === 'Pending');

  // Negotiated agreed price
  let agreedString: string | undefined;
  if (acceptedProposal?.amountUsdc) {
    const agreedUnits = toBaseUnits(acceptedProposal.amountUsdc, decimals);
    agreedString = formatTokenDecimals(agreedUnits, decimals);
  } else if (job?.negotiatedAmount && parseFloat(job.negotiatedAmount) > 0) {
    const agreedUnits = toBaseUnits(job.negotiatedAmount, decimals);
    agreedString = formatTokenDecimals(agreedUnits, decimals);
  }

  // Pending proposed price
  let proposedString: string | undefined;
  if (pendingProposal?.amountUsdc) {
    const pVal = pendingProposal.amountUsdc;
    const pUnits = toBaseUnits(pVal, decimals);
    const pFmt = formatTokenDecimals(pUnits, decimals);
    if (parseFloat(pFmt) !== parseFloat(budgetFmt)) {
      proposedString = pFmt;
    }
  }

  // 3. Determine Lifecycle Stage
  const status = job?.status;
  const termsAgreed = Boolean(
    (job?.clientAgreedTerms && job?.freelancerAgreedTerms) ||
    agreedString ||
    status === 'Selected' ||
    (status as string) === 'TermsAgreed'
  );

  let stage: JobAmountStage = 'pre-acceptance';
  if (status === 'Completed') {
    stage = 'completed';
  } else if (status === 'Funded' || status === 'Submitted' || status === 'Disputed') {
    stage = 'funded';
  } else if (status === 'Cancelled') {
    stage = 'cancelled';
  } else if (termsAgreed) {
    stage = 'agreed-unfunded';
  } else {
    stage = 'pre-acceptance';
  }

  // 4. Effective Base Amount for the Stage
  let effectiveUnits = budgetUnits;
  let lockedString: string | undefined;
  let settledString: string | undefined;

  if (stage === 'completed') {
    if (escrow?.settledAmount !== undefined) {
      const settledUnits = typeof escrow.settledAmount === 'bigint'
        ? escrow.settledAmount
        : toBaseUnits(escrow.settledAmount, decimals);
      settledString = formatTokenDecimals(settledUnits, decimals);
      effectiveUnits = settledUnits;
    } else if (agreedString) {
      settledString = agreedString;
      effectiveUnits = toBaseUnits(agreedString, decimals);
    } else {
      settledString = budgetFmt;
      effectiveUnits = budgetUnits;
    }
  } else if (stage === 'funded') {
    if (escrow?.lockedAmount !== undefined) {
      const lockedUnits = typeof escrow.lockedAmount === 'bigint'
        ? escrow.lockedAmount
        : toBaseUnits(escrow.lockedAmount, decimals);
      lockedString = formatTokenDecimals(lockedUnits, decimals);
      effectiveUnits = lockedUnits;
    } else if (agreedString) {
      lockedString = agreedString;
      effectiveUnits = toBaseUnits(agreedString, decimals);
    } else {
      lockedString = budgetFmt;
      effectiveUnits = budgetUnits;
    }
  } else if (stage === 'agreed-unfunded') {
    if (agreedString) {
      effectiveUnits = toBaseUnits(agreedString, decimals);
    }
  }

  // 5. Exact BigInt Fee Math
  const effectiveString = formatTokenDecimals(effectiveUnits, decimals);
  const breakdown = feeBreakdown(effectiveUnits, token);

  const clientPays = formatTokenDecimals(breakdown.clientDeposit, decimals);
  const freelancerReceives = formatTokenDecimals(breakdown.freelancerNet, decimals);
  const feeClient = formatTokenDecimals(breakdown.clientFee, decimals);
  const feeFreelancer = formatTokenDecimals(breakdown.freelancerFee, decimals);

  // 6. Labels by Stage and Viewer Role
  const isClient = viewerRole === 'client';

  let primaryLabel = 'Job budget';
  let roleActionLabel = isClient ? 'You pay (incl. fee)' : 'You receive';
  let roleActionAmount = isClient ? clientPays : freelancerReceives;

  switch (stage) {
    case 'pre-acceptance':
      primaryLabel = 'Job budget';
      roleActionLabel = isClient ? 'You pay (incl. fee)' : 'You receive';
      roleActionAmount = isClient ? clientPays : freelancerReceives;
      break;

    case 'agreed-unfunded':
      primaryLabel = 'Agreed price';
      roleActionLabel = isClient ? 'Deposit required' : 'You receive';
      roleActionAmount = isClient ? clientPays : freelancerReceives;
      break;

    case 'funded':
      primaryLabel = 'Escrow locked';
      roleActionLabel = isClient ? 'You paid' : 'You receive';
      roleActionAmount = isClient ? clientPays : freelancerReceives;
      break;

    case 'completed':
      primaryLabel = 'Paid';
      roleActionLabel = isClient ? 'Total paid' : 'You received';
      roleActionAmount = isClient ? clientPays : freelancerReceives;
      break;

    case 'cancelled':
      primaryLabel = 'Job budget';
      roleActionLabel = isClient ? 'Refunded' : 'Unpaid';
      roleActionAmount = isClient ? clientPays : '0';
      break;
  }

  return {
    token,
    decimals,
    budget: budgetFmt,
    proposed: proposedString,
    agreed: agreedString,
    locked: lockedString,
    settled: settledString,
    effectiveAmount: effectiveString,
    clientPays,
    freelancerReceives,
    feeClient,
    feeFreelancer,
    stage,
    primaryLabel,
    roleActionLabel,
    roleActionAmount,
    raw: {
      effectiveUnits,
      clientDepositUnits: breakdown.clientDeposit,
      freelancerNetUnits: breakdown.freelancerNet,
      clientFeeUnits: breakdown.clientFee,
      freelancerFeeUnits: breakdown.freelancerFee,
    },
  };
}
