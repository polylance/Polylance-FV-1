/**
 * PolyLance Unified Lifecycle State Machine & Constants
 * Single source of truth for job, proposal, escrow, and notification states.
 */

export type JobStatus =
  | 'Draft'
  | 'Open'
  | 'Selected'
  | 'Funded'
  | 'Submitted'
  | 'Disputed'
  | 'Completed'
  | 'Cancelled';

export type EngagementState =
  | 'OFFER_SENT'
  | 'COUNTER_PROPOSED_BY_FREELANCER'
  | 'COUNTER_PROPOSED_BY_CLIENT'
  | 'OFFER_ACCEPTED_BY_FREELANCER'
  | 'OFFER_ACCEPTED'
  | 'TERMS_AGREED'
  | 'FUNDING_PENDING'
  | 'ESCROW_DEPOSIT_PENDING'
  | 'ESCROW_FUNDED'
  | 'SELECTION_CANCELLED_BY_CLIENT'
  | 'OFFER_DECLINED_BY_FREELANCER'
  | 'OFFER_DECLINED'
  | 'OFFER_EXPIRED'
  | 'IN_PROGRESS'
  | 'WORK_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'PAYMENT_RELEASED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'OFFER_SENT'
  | 'COUNTER_OFFER_REQUESTED'
  | 'COUNTER_OFFER_ACCEPTED'
  | 'COUNTER_OFFER_REJECTED'
  | 'TERMS_AGREED'
  | 'SELECTION_CANCELLED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'OFFER_EXPIRED'
  | 'FUNDING_PENDING'
  | 'FUNDING_FAILED'
  | 'ESCROW_FUNDED'
  | 'WORK_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'PAYMENT_RELEASED'
  | 'DISPUTE_OPENED'
  | 'JOB_CANCELLED'
  | 'SYSTEM';

export const MAX_NEGOTIATION_ROUNDS = 6;
export const OFFER_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours
export const ALLOW_PROPOSALS_DURING_NEGOTIATION = true;

export interface NegotiationTermVersion {
  version: number;
  round: number;
  proposedBy: 'client' | 'freelancer';
  proposerWallet: string;
  amountWei: string; // BigInt string
  currency: string; // 'POL' | 'USDC' | 'USDT'
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
}

export interface JobEngagement {
  id: string;
  jobId: string;
  client: string;
  freelancer: string;
  state: EngagementState;
  currentVersion: number;
  history: NegotiationTermVersion[];
  selectedAt: number;
  agreedAt?: number;
  fundedAt?: number;
  closedAt?: number;
  closeReason?: string;
}

export interface AppNotification {
  id: string;
  recipientWallet: string;
  actorWallet?: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: 'job' | 'proposal' | 'dispute' | 'system';
  entityId: string;
  deepLink: string;
  readAt: number | null;
  createdAt: number;
  dedupeKey: string;
}

/**
 * Calculates the exact 2.5% platform fee using BigInt arithmetic.
 * Fee = (principalWei * 250n) / 10000n
 * Client pays: principal + fee
 * Freelancer receives: principal - fee
 */
export function calculateEscrowFeeBigInt(principalWei: bigint): {
  principalWei: bigint;
  clientFeeWei: bigint;
  freelancerFeeWei: bigint;
  totalClientPayWei: bigint;
  netFreelancerReceiveWei: bigint;
} {
  const clientFeeWei = (principalWei * 250n) / 10000n;
  const freelancerFeeWei = (principalWei * 250n) / 10000n;
  return {
    principalWei,
    clientFeeWei,
    freelancerFeeWei,
    totalClientPayWei: principalWei + clientFeeWei,
    netFreelancerReceiveWei: principalWei - freelancerFeeWei,
  };
}

/**
 * Global single source of truth deciding whether a job appears in Find Jobs.
 * RULE: The job leaves Find Jobs ONLY when escrow funding is confirmed on-chain
 * (status === 'Funded'). Selection, counter-offers, or failed/pending tx MUST NOT hide it.
 */
export function isJobListed(job: any): boolean {
  if (!job) return false;
  if (job.isDemo || job.isMock) return false;

  const rawStatus = (job.status || '').toLowerCase().trim();

  // Exclude completed, cancelled, or disputed
  if (rawStatus === 'completed' || rawStatus === 'cancelled' || rawStatus === 'draft') {
    return false;
  }
  if (job.dispute && !job.dispute.resolved) return false;

  // The job leaves Find Jobs ONLY when confirmed funded
  if (rawStatus === 'funded' || rawStatus === 'submitted') {
    return false;
  }
  if (job.engagement?.state === 'ESCROW_FUNDED') {
    return false;
  }
  const isFundedEvent = (job.events || []).some(
    (e: any) => (e.step === 'Funded' || e.step === 'EscrowFunded') && e.status === 'completed'
  );
  if (isFundedEvent) {
    return false;
  }

  // Jobs in 'open' or 'selected' (with active negotiation or pending funding) MUST stay listed!
  return rawStatus === 'open' || rawStatus === 'selected';
}

/**
 * Normalizes any timestamp to epoch milliseconds.
 * If timestamp is in seconds (< 1e11), converts to ms.
 */
export function normalizeTimestampMs(val?: number | string | null): number {
  if (!val) return Date.now();
  const num = typeof val === 'string' ? Number(val) : val;
  if (isNaN(num) || num <= 0) return Date.now();
  if (num < 100000000000) return num * 1000;
  return num;
}

/**
 * Derives the honest engagement state for a given job.
 */
export function deriveEngagementState(job: any): EngagementState {
  if (!job) return 'OFFER_SENT';
  if (job.status === 'Completed') return 'COMPLETED';
  if (job.status === 'Disputed') return 'DISPUTED';
  if (job.status === 'Cancelled') return 'CANCELLED';

  const isFundedEvent = (job.events || []).some(
    (e: any) => e.step === 'Funded' && e.status === 'completed'
  );

  if (job.status === 'Submitted') return 'WORK_SUBMITTED';

  if (job.status === 'Funded' || isFundedEvent) {
    if (job.deliverableSubmittedAt || job.proof) return 'WORK_SUBMITTED';
    return 'ESCROW_FUNDED';
  }

  // Active negotiation / pre-funding engagement
  if (job.engagement) {
    return job.engagement.state || 'OFFER_SENT';
  }

  if (job.status === 'Selected') {
    if (job.freelancerAgreedTerms && job.clientAgreedTerms) {
      return 'TERMS_AGREED';
    }
    if (job.freelancerAgreedTerms) {
      return 'OFFER_ACCEPTED_BY_FREELANCER';
    }
    return 'OFFER_SENT';
  }

  return 'OFFER_SENT';
}

/**
 * Validates whether a requested job transition is permitted.
 */
export function isValidJobTransition(
  currentStatus: JobStatus,
  targetStatus: JobStatus,
  context?: { hasFreelancer?: boolean; isFunded?: boolean }
): { valid: boolean; reason?: string } {
  if (currentStatus === targetStatus) return { valid: true };

  switch (currentStatus) {
    case 'Draft':
      if (targetStatus === 'Open' || targetStatus === 'Cancelled') return { valid: true };
      return { valid: false, reason: 'Draft jobs can only be published to Open or Cancelled' };

    case 'Open':
      if (targetStatus === 'Selected' && context?.hasFreelancer) return { valid: true };
      if (targetStatus === 'Cancelled') return { valid: true };
      return { valid: false, reason: 'Open jobs can only transition to Selected (with freelancer) or Cancelled' };

    case 'Selected':
      // From Selected, can move to Open (if selection cancelled, offer declined/expired),
      // or to Funded (if escrow deposit confirmed), or Cancelled
      if (targetStatus === 'Open') return { valid: true };
      if (targetStatus === 'Funded' && context?.isFunded) return { valid: true };
      if (targetStatus === 'Cancelled') return { valid: true };
      return { valid: false, reason: 'Selected jobs require confirmed escrow funding to become Funded' };

    case 'Funded':
      if (targetStatus === 'Submitted') return { valid: true };
      if (targetStatus === 'Disputed') return { valid: true };
      return { valid: false, reason: 'Funded jobs can only transition to Submitted or Disputed' };

    case 'Submitted':
      if (targetStatus === 'Funded') return { valid: true }; // revision requested -> back to working
      if (targetStatus === 'Completed') return { valid: true }; // approved & paid
      if (targetStatus === 'Disputed') return { valid: true };
      return { valid: false, reason: 'Submitted deliverables can be approved (Completed), revised (Funded), or Disputed' };

    case 'Disputed':
      if (targetStatus === 'Completed' || targetStatus === 'Cancelled') return { valid: true };
      return { valid: false, reason: 'Disputed jobs can only transition after ruling to Completed or Cancelled' };

    case 'Completed':
    case 'Cancelled':
      return { valid: false, reason: `Cannot transition from terminal state ${currentStatus}` };

    default:
      return { valid: true };
  }
}
