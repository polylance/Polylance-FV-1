import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/contracts';

export function truncateAddress(addr: string | undefined): string {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Formats POL amount to 3 decimal digits (.000)
 */
export function formatPolBalance(val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '0.000';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
  return num.toFixed(3);
}


export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDaysRemaining(submittedAt: number, reviewPeriodDays: number): string {
  const reviewPeriodMs = reviewPeriodDays * 24 * 60 * 60 * 1000;
  const expiresAt = submittedAt + reviewPeriodMs;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Review period expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days > 0) return `${days}d ${remHours}h remaining`;
  return `${remHours}h remaining`;
}

export function generateFallbackTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const generateMockTxHash = generateFallbackTxHash;

export function generateDeterministicHash(seed: string = Date.now().toString()): string {
  return ethers.keccak256(ethers.toUtf8Bytes(seed));
}

export function formatWeb3ErrorMessage(err: any): string {
  if (!err) return 'Transaction failed. Please try again.';
  const rawMsg = String(err?.message || err?.shortMessage || err?.data?.message || err || '');
  const code = err?.code ?? err?.error?.code ?? err?.info?.error?.code;

  if (
    code === 'ACTION_REJECTED' ||
    code === 4001 ||
    rawMsg.includes('ACTION_REJECTED') ||
    rawMsg.includes('user rejected') ||
    rawMsg.includes('User denied') ||
    rawMsg.includes('User rejected the request')
  ) {
    return 'Transaction signature rejected in wallet.';
  }

  if (rawMsg.includes('insufficient funds') || rawMsg.includes('exceeds balance')) {
    return 'Insufficient funds in wallet for gas and amount.';
  }

  if (rawMsg.includes('Not submitted')) {
    return 'The assigned freelancer must submit deliverables on-chain before payment can be released.';
  }

  if (rawMsg.includes('Only client releases')) {
    return 'Only the job client can release the escrow payment.';
  }

  if (rawMsg.includes('Only assigned freelancer')) {
    return 'Only the assigned freelancer wallet can submit deliverables for this job.';
  }

  if (rawMsg.includes('Did not apply')) {
    return 'Freelancer must submit an application before being selected on-chain.';
  }

  if (rawMsg.includes('CALL_EXCEPTION') || rawMsg.includes('execution reverted')) {
    return 'Contract transaction execution reverted on-chain.';
  }

  if (rawMsg.includes('network') || rawMsg.includes('Wrong network') || rawMsg.includes('chain not supported')) {
    return 'Network mismatch. Please verify your mobile wallet is connected to Polygon Mainnet (137).';
  }

  if (rawMsg.includes('Connector not found') || rawMsg.includes('Provider not found') || rawMsg.includes('No provider')) {
    return 'Mobile wallet connection lost. Please open MetaMask or your wallet app and re-connect.';
  }

  if (rawMsg.includes('nonce too low') || rawMsg.includes('replacement transaction underpriced')) {
    return 'Transaction replaced or pending nonce collision. Please wait a moment and try again.';
  }

  if (rawMsg.includes('gas required exceeds allowance') || rawMsg.includes('UNPREDICTABLE_GAS_LIMIT')) {
    return 'Gas estimation failed. The contract state may prevent this action at this time.';
  }

  if (rawMsg.includes('timeout') || rawMsg.includes('Timeout') || rawMsg.includes('ETIMEDOUT')) {
    return 'RPC node timeout. The Polygon network is experiencing delays; please retry.';
  }

  return rawMsg.length > 120 ? `${rawMsg.slice(0, 117)}...` : rawMsg;
}

export function getPolygonScanUrl(txHash: string): string {
  const baseUrl = NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com';
  return `${baseUrl}/tx/${txHash}`;
}

export function getPolygonScanAddressUrl(address: string): string {
  const baseUrl = NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com';
  return `${baseUrl}/address/${address}`;
}

export function getDeterministicSbtId(jobId: string | undefined): number {
  if (!jobId) return 1001;
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) {
    const char = jobId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 8999) + 1000;
}

/**
 * Returns permanent canonical CertifiedPass Certificate ID: PL-SBT-JOB-<jobId>
 * Guaranteed to never mutate across re-renders, reloads, or after downloading.
 */
export function getCanonicalCertificateId(jobId?: string | number | any, contractAddress?: string): string {
  if (!jobId) return 'PL-SBT-JOB-001';
  if (typeof jobId === 'object' && jobId !== null) {
    if (jobId.certificateId) return String(jobId.certificateId).trim();
    return getCanonicalCertificateId(jobId.id, jobId.contractAddress);
  }
  const str = String(jobId).trim();
  if (str.startsWith('PL-SBT-JOB-')) {
    return str;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cached = localStorage.getItem(`polylance_cert_id_${str}`);
      if (cached) return cached;
    } catch (_) {}
  }
  const clean = str.replace(/^PL-SBT-JOB-/i, '');
  const canonicalId = `PL-SBT-JOB-${clean}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`polylance_cert_id_${str}`, canonicalId);
    } catch (_) {}
  }
  return canonicalId;
}

/**
 * Formats canonical CertifiedPass Universal Verification URL
 */
export function getCertifiedPassVerifyUrl(certId: string): string {
  const clean = String(certId || '').trim();
  return `https://sunny200551.github.io/CertifiedPass/verify?certId=${encodeURIComponent(clean)}&partner=polylance`;
}
