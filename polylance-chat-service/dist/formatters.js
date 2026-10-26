import { ethers } from 'ethers';
/**
 * Converts any Ethereum/Polygon address to EIP-55 Checksum casing.
 * Guaranteed consistent address format across nav, profile, cards, and chips.
 */
export function toChecksumAddress(addr) {
    if (!addr)
        return '';
    const clean = addr.trim();
    if (!clean.startsWith('0x') || clean.length !== 42)
        return clean;
    try {
        return ethers.getAddress(clean);
    }
    catch {
        return clean;
    }
}
/**
 * Truncates an address (first 6 + last 4 characters) in canonical checksum format.
 */
export function truncateAddress(addr) {
    if (!addr)
        return '';
    const checksummed = toChecksumAddress(addr);
    if (checksummed.length <= 10)
        return checksummed;
    return `${checksummed.slice(0, 6)}...${checksummed.slice(-4)}`;
}
/**
 * Formats POL amount to 3 decimal digits (.000)
 */
export function formatPolBalance(val) {
    if (val === undefined || val === null || val === '')
        return '0.000';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
    return num.toFixed(3);
}
/**
 * Formats timestamps to clean sentence-case relative strings:
 * e.g. "Just now", "5m ago", "3h ago", "2d ago"
 */
export function formatTimeAgo(timestamp) {
    if (!timestamp)
        return 'Recently';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60)
        return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}
/**
 * Formats a posted date with both calendar date and relative time:
 * e.g. "Posted Oct 1, 2026 · 7 days ago"
 */
export function formatPostedDate(timestamp) {
    if (!timestamp)
        return 'Posted recently';
    const dateStr = new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    return `Posted ${dateStr} · ${formatTimeAgo(timestamp)}`;
}
export function formatDaysRemaining(submittedAt, reviewPeriodDays) {
    const safeReviewDays = reviewPeriodDays && reviewPeriodDays > 0 ? reviewPeriodDays : 7;
    if (!submittedAt || submittedAt <= 0) {
        return `${safeReviewDays}d remaining`;
    }
    const reviewPeriodMs = safeReviewDays * 24 * 60 * 60 * 1000;
    const expiresAt = submittedAt + reviewPeriodMs;
    const diff = expiresAt - Date.now();
    if (diff <= 0)
        return 'Review period expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (days > 0)
        return `${days}d ${remHours}h remaining`;
    return `${remHours}h remaining`;
}
/**
 * @deprecated Fake transaction hashes are prohibited by protocol integrity standards.
 */
export function generateFallbackTxHash() {
    return '';
}
export const generateMockTxHash = generateFallbackTxHash;
export function generateDeterministicHash(seed = Date.now().toString()) {
    return ethers.keccak256(ethers.toUtf8Bytes(seed));
}
export function formatWeb3ErrorMessage(err) {
    if (!err)
        return 'Transaction failed. Please try again.';
    const rawMsg = String(err?.message || err?.shortMessage || err?.data?.message || err || '');
    const code = err?.code ?? err?.error?.code ?? err?.info?.error?.code;
    if (code === 'ACTION_REJECTED' ||
        code === 4001 ||
        rawMsg.includes('ACTION_REJECTED') ||
        rawMsg.includes('user rejected') ||
        rawMsg.includes('User denied') ||
        rawMsg.includes('User rejected the request')) {
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
export function getPolygonScanUrl(txHash) {
    const baseUrl = 'https://polygonscan.com';
    return `${baseUrl}/tx/${txHash}`;
}
export const getPolygonScanTxUrl = getPolygonScanUrl;
export function getPolygonScanAddressUrl(address) {
    const baseUrl = 'https://polygonscan.com';
    return `${baseUrl}/address/${address}`;
}
export function getDeterministicSbtId(jobId) {
    if (!jobId)
        return 1001;
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
 */
export function getCanonicalCertificateId(jobId, contractAddress) {
    if (!jobId)
        return 'PL-SBT-JOB-001';
    if (typeof jobId === 'object' && jobId !== null) {
        if (jobId.certificateId)
            return String(jobId.certificateId).trim();
        return getCanonicalCertificateId(jobId.id, jobId.contractAddress);
    }
    const str = String(jobId).trim();
    if (str.startsWith('PL-SBT-JOB-')) {
        return str;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const cached = localStorage.getItem(`polylance_cert_id_${str}`);
            if (cached)
                return cached;
        }
        catch (_) { }
    }
    const clean = str.replace(/^PL-SBT-JOB-/i, '');
    const canonicalId = `PL-SBT-JOB-${clean}`;
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            localStorage.setItem(`polylance_cert_id_${str}`, canonicalId);
        }
        catch (_) { }
    }
    return canonicalId;
}
export function getCertifiedPassVerifyUrl(certId) {
    const clean = String(certId || '').trim();
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        return `${origin}/?certId=${encodeURIComponent(clean)}#/verify?certId=${encodeURIComponent(clean)}`;
    }
    return `https://certifiedpass.polylance.codes/?certId=${encodeURIComponent(clean)}#/verify?certId=${encodeURIComponent(clean)}`;
}
export const CATEGORIES = [
    {
        id: 'web3',
        label: 'Web3 / Smart Contracts',
        description: 'Solidity, Smart Contracts, DeFi, Hardhat, Polygon',
        skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Ethers.js', 'Polygon']
    },
    {
        id: 'frontend',
        label: 'Frontend',
        description: 'TypeScript, React, Next.js, Web3 UI, Tailwind CSS',
        skills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Vite']
    },
    {
        id: 'backend',
        label: 'Backend',
        description: 'Node.js, Rust, Go, Python, APIs, Indexers',
        skills: ['Node.js', 'Rust', 'Go', 'Python', 'PostgreSQL', 'GraphQL']
    },
    {
        id: 'mobile',
        label: 'Mobile',
        description: 'React Native, Flutter, iOS Swift, Android Kotlin',
        skills: ['React Native', 'Flutter', 'iOS', 'Android']
    }
];
export function getCanonicalCategory(raw) {
    const lower = (raw || '').toLowerCase().trim();
    if (lower.includes('web3') || lower.includes('solidity') || lower.includes('smart contract')) {
        return CATEGORIES[0];
    }
    if (lower.includes('frontend') || lower.includes('ui')) {
        return CATEGORIES[1];
    }
    if (lower.includes('backend') || lower.includes('indexer') || lower.includes('systems')) {
        return CATEGORIES[2];
    }
    if (lower.includes('mobile')) {
        return CATEGORIES[3];
    }
    return CATEGORIES[0];
}
export function getCanonicalJobStatus(job) {
    if (!job)
        return 'Open';
    const raw = job.status;
    if (raw === 'Completed' || job.escrowStatus === 'RELEASED')
        return 'Completed';
    if (raw === 'Disputed' || Boolean(job.dispute && !job.dispute.resolved))
        return 'Disputed';
    if (raw === 'Submitted' || Boolean(job.proof && job.proof.submittedAt))
        return 'Submitted';
    const isFundedEvent = (job.events || []).some((e) => (e.step === 'Funded' || e.step === 'EscrowFunded') && (e.status === 'completed' || e.status === 'CONFIRMED'));
    if (raw === 'Funded' || isFundedEvent || job.escrowStatus === 'FUNDED') {
        return 'Funded';
    }
    if (raw === 'Selected') {
        if (job.clientAgreedTerms && job.freelancerAgreedTerms) {
            return 'In progress';
        }
        return 'Negotiating';
    }
    if (raw === 'Open') {
        if (job.applications && job.applications.length > 0) {
            return 'Negotiating';
        }
        return 'Open';
    }
    return 'Open';
}
export function calculateFeeBreakdown(budgetInput, tokenInput = 'POL') {
    const upper = (tokenInput || 'POL').toUpperCase().trim();
    const tokenSymbol = upper === 'MATIC' || upper === 'POL' ? 'POL' : (upper === 'USDT' ? 'USDT' : 'USDC');
    const num = parseFloat(String(budgetInput || '0').replace(/[^0-9.-]/g, '')) || 0;
    const clientFee = num * 0.025;
    const freelancerFee = num * 0.025;
    return {
        budget: num,
        platformFee: clientFee + freelancerFee,
        clientDeposit: num + clientFee,
        freelancerReceives: num - freelancerFee,
        tokenSymbol,
    };
}
// ─────────────────────────────────────────────────────────────────────────────
// REPUTATION PERCENTILE HELPER
// ─────────────────────────────────────────────────────────────────────────────
export function calculateReputationPercentile(rank, total) {
    if (!total || total <= 0 || !rank || rank <= 0)
        return 'Unranked';
    if (total === 1)
        return 'Top 1%';
    const pct = Math.max(1, Math.min(100, Math.round((rank / total) * 100)));
    return `Top ${pct}%`;
}
/**
 * Robust clipboard copy function that never throws an unhandled error.
 * Gracefully falls back to document.execCommand if Clipboard API is blocked or denied.
 */
export async function copyToClipboard(text) {
    if (!text)
        return false;
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return true;
        }
    }
    catch (_) {
        // Fallback to legacy execCommand below
    }
    try {
        if (typeof document !== 'undefined') {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }
    catch (_) { }
    return false;
}
