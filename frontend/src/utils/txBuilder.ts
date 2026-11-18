import { ethers } from 'ethers';
import { feeBreakdown } from './fees';

export interface FundingParameters {
  isNative: boolean;
  tokenSymbol: string;
  decimals: number;
  tokenAddress: string;
  spenderAddress: string;
  principalUnits: bigint;
  feeUnits: bigint;
  totalRequiredUnits: bigint;
  tokenAmountArg: bigint;
  valueArg: bigint;
  requiredConfirmations: number;
}

export interface ReadinessCheckResult {
  ready: boolean;
  errorMessage?: string;
  suggestedAction?: string;
  isGasShortage?: boolean;
}

export const KNOWN_CONTRACTS = {
  POLYGON_USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'.toLowerCase(),
  POLYGON_USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'.toLowerCase(),
  JOB_ESCROW_FACTORY: '0xbE74923BBfd72d400a681915dBcf6e6Adc72C317'.toLowerCase(),
};

/**
 * Single source of truth for building escrow funding transactions.
 * All arithmetic is performed in BigInt with zero floating point representation.
 */
export function buildFundingParameters(job: {
  amountEth?: string;
  amountUsdc?: string;
  paymentTokenSymbol?: string;
  paymentToken?: string;
  contractAddress?: string;
  engagement?: {
    history?: Array<{ status: string; amountWei?: string }>;
  };
}): FundingParameters {
  const tokenSymbol = (job.paymentTokenSymbol || 'USDC').toUpperCase().trim();
  const isNative = tokenSymbol === 'POL' || tokenSymbol === 'MATIC';
  const decimals = isNative ? 18 : 6;
  const tokenAddress = isNative
    ? ethers.ZeroAddress
    : (job.paymentToken || KNOWN_CONTRACTS.POLYGON_USDC).toLowerCase();
  const spenderAddress = (job.contractAddress || '').toLowerCase();

  let principalUnits: bigint;
  const agreedVersion = job.engagement?.history?.slice().reverse().find((h) => h.status === 'ACCEPTED');

  if (agreedVersion && agreedVersion.amountWei) {
    principalUnits = BigInt(agreedVersion.amountWei);
  } else if (isNative) {
    const rawVal = job.amountEth && job.amountEth !== '0' ? job.amountEth : '0.05';
    principalUnits = ethers.parseEther(rawVal);
  } else {
    const rawVal = job.amountUsdc && job.amountUsdc !== '0' ? job.amountUsdc : '100';
    principalUnits = ethers.parseUnits(rawVal, decimals);
  }

  // Exact 2.5% platform fee calculated using single source of truth pure feeBreakdown
  const fees = feeBreakdown(principalUnits, tokenSymbol);
  const feeUnits = fees.clientFee;
  const totalRequiredUnits = fees.clientDeposit;

  // Confirmation depth tier
  let approxUsd = parseFloat(job.amountUsdc || '100');
  if (isNative && job.amountEth) {
    approxUsd = parseFloat(job.amountEth) * 0.40; // Conservative Polygon exchange tier approximation
  }
  let requiredConfirmations = 3;
  if (approxUsd > 2500) requiredConfirmations = 10;
  else if (approxUsd > 250) requiredConfirmations = 5;

  return {
    isNative,
    tokenSymbol,
    decimals,
    tokenAddress,
    spenderAddress,
    principalUnits,
    feeUnits,
    totalRequiredUnits,
    // Contract signature for JobEscrow.fundJob(uint256 tokenAmount):
    // For native POL: tokenAmount = 0n, value = totalRequiredUnits
    // For ERC20: tokenAmount = principalUnits, value = 0n
    tokenAmountArg: isNative ? 0n : principalUnits,
    valueArg: isNative ? totalRequiredUnits : 0n,
    requiredConfirmations,
  };
}

/**
 * Checks whether user has adequate token balance and adequate native POL for gas.
 */
export function checkPaymentReadiness(params: {
  isNative: boolean;
  tokenSymbol: string;
  nativePolBalance: bigint;
  tokenBalance: bigint;
  totalRequiredUnits: bigint;
  estimatedGasFeeWei?: bigint;
}): ReadinessCheckResult {
  const minGasBuffer = params.estimatedGasFeeWei || ethers.parseEther('0.01'); // 0.01 POL buffer for Polygon transactions

  if (params.isNative) {
    const totalNeeded = params.totalRequiredUnits + minGasBuffer;
    if (params.nativePolBalance < totalNeeded) {
      const diff = totalNeeded - params.nativePolBalance;
      return {
        ready: false,
        errorMessage: `Insufficient POL balance. You need ${ethers.formatEther(totalNeeded)} POL (including ${ethers.formatEther(minGasBuffer)} POL for gas fees), but you only hold ${ethers.formatEther(params.nativePolBalance)} POL.`,
        suggestedAction: `Deposit at least ${ethers.formatEther(diff)} more POL to continue.`,
        isGasShortage: true,
      };
    }
  } else {
    // Token job (USDC / USDT)
    if (params.nativePolBalance < minGasBuffer) {
      return {
        ready: false,
        errorMessage: 'You need a small amount of POL for network fees.',
        suggestedAction: `You hold ${params.tokenSymbol}, but transaction gas on Polygon PoS requires native POL. Please deposit at least 0.02 POL for transaction gas fees.`,
        isGasShortage: true,
      };
    }

    if (params.tokenBalance < params.totalRequiredUnits) {
      return {
        ready: false,
        errorMessage: `Insufficient ${params.tokenSymbol} balance. You need ${ethers.formatUnits(params.totalRequiredUnits, 6)} ${params.tokenSymbol}, but hold ${ethers.formatUnits(params.tokenBalance, 6)} ${params.tokenSymbol}.`,
        suggestedAction: `Deposit more ${params.tokenSymbol} into your wallet to fund this contract.`,
        isGasShortage: false,
      };
    }
  }

  return { ready: true };
}

/**
 * Tether (USDT) requires resetting allowance to 0 first if existing allowance > 0 and < target
 */
export function needsUsdtZeroReset(
  tokenAddress: string,
  currentAllowance: bigint,
  targetAmount: bigint
): boolean {
  const isUsdt = tokenAddress.toLowerCase() === KNOWN_CONTRACTS.POLYGON_USDT;
  return isUsdt && currentAllowance > 0n && currentAllowance < targetAmount;
}

/**
 * Translates raw contract reverts and RPC errors into clear, trustworthy human messages.
 */
export function decodeRevertReason(error: any): { title: string; message: string; technical?: string } {
  const rawMsg = String(error?.data?.message || error?.message || error || '').toLowerCase();

  let technical = error?.data || error?.message ? String(error.message || error.data) : undefined;

  if (rawMsg.includes('insufficient funds') || rawMsg.includes('exceeds balance')) {
    return {
      title: 'Insufficient Funds',
      message: 'Your wallet does not have enough POL to cover gas and funding fees. No funds were moved.',
      technical,
    };
  }

  if (rawMsg.includes('user rejected') || rawMsg.includes('user denied') || rawMsg.includes('action_rejected')) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the request in your wallet. No funds were moved.',
      technical,
    };
  }

  if (rawMsg.includes('allowance') || rawMsg.includes('transferfrom failed')) {
    return {
      title: 'Token Approval Required',
      message: 'The escrow contract was not granted sufficient token allowance. Please approve the required amount and retry.',
      technical,
    };
  }

  if (rawMsg.includes('already funded') || rawMsg.includes('invalid state')) {
    return {
      title: 'Escrow Already Funded',
      message: 'This contract escrow is already funded on Polygon PoS. You do not need to pay again.',
      technical,
    };
  }

  if (rawMsg.includes('429') || rawMsg.includes('too many requests') || rawMsg.includes('rate limit')) {
    return {
      title: 'Network Congestion',
      message: 'The network is experiencing high traffic. Please wait a few seconds and retry. No funds were moved.',
      technical,
    };
  }

  if (rawMsg.includes('timeout') || rawMsg.includes('network error') || rawMsg.includes('could not detect network')) {
    return {
      title: 'Network Slow',
      message: 'Unable to reach the network node. Your funds are safe. Please retry in a moment.',
      technical,
    };
  }

  return {
    title: 'Transaction Could Not Be Completed',
    message: 'The smart contract rejected the simulation or call. No funds were moved.',
    technical,
  };
}
