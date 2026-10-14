import { ethers } from 'ethers';
import { AccountMode, Job } from '../types';
import { ALLOW_PROPOSALS_DURING_NEGOTIATION } from '../types/lifecycle';

export type ApplyDenialReason =
  | 'NOT_CONNECTED'
  | 'OWN_JOB'
  | 'CLIENT_ONLY_MODE'
  | 'JOB_CLOSED'
  | 'ALREADY_APPLIED';

export interface CanApplyResult {
  allowed: boolean;
  reason?: ApplyDenialReason;
  message?: string;
}

/**
 * Normalizes an Ethereum address into a canonical checksum format when possible,
 * or lowercase trimmed format.
 */
export function normalizeAddress(addr?: string | null): string {
  if (!addr) return '';
  const trimmed = addr.trim().toLowerCase();
  try {
    return ethers.getAddress(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Checks if two addresses represent the identical account (case and checksum insensitive).
 */
export function areAddressesEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
}

export interface UserForApplyCheck {
  address?: string | null;
  accountMode?: AccountMode;
  isConnected?: boolean;
}

export interface JobForApplyCheck {
  client: string;
  status: string;
  applications?: Array<{ applicant: string }>;
}

/**
 * Single source of truth determining if an account can submit a proposal to a job.
 * Enforces rules on both client UI and server API.
 */
export function canApplyToJob(
  user: UserForApplyCheck | null | undefined,
  job: JobForApplyCheck | null | undefined
): CanApplyResult {
  if (!job) {
    return { allowed: false, reason: 'JOB_CLOSED', message: 'Job not found' };
  }

  // 1. Connection check
  if (!user || !user.address || user.isConnected === false) {
    return {
      allowed: false,
      reason: 'NOT_CONNECTED',
      message: 'Connect wallet to apply',
    };
  }

  // 2. Owner check (strictly case/checksum normalized)
  if (areAddressesEqual(user.address, job.client)) {
    return {
      allowed: false,
      reason: 'OWN_JOB',
      message: "You can't apply to your own job",
    };
  }

  // 3. Job status check
  const isAcceptingProposals =
    job.status === 'Open' ||
    (ALLOW_PROPOSALS_DURING_NEGOTIATION && job.status === 'Selected');
  if (!isAcceptingProposals) {
    return {
      allowed: false,
      reason: 'JOB_CLOSED',
      message: 'Job is not open for applications',
    };
  }

  // 4. Duplicate proposal check
  const alreadyApplied = (job.applications || []).some((app) =>
    areAddressesEqual(app.applicant, user.address)
  );
  if (alreadyApplied) {
    return {
      allowed: false,
      reason: 'ALREADY_APPLIED',
      message: 'Already applied · View proposal',
    };
  }

  // 5. Account mode check
  if (user.accountMode === 'client') {
    return {
      allowed: false,
      reason: 'CLIENT_ONLY_MODE',
      message: 'Switch to freelancer mode to apply',
    };
  }

  return { allowed: true };
}

export interface ModeSwitchValidationResult {
  canSwitch: boolean;
  blockedReason?: string;
  hasWarnings: boolean;
  warningMessage?: string;
  affectedItems: {
    activeEscrowsAsClient: number;
    openJobsAsClient: number;
    activeEscrowsAsFreelancer: number;
    openApplicationsAsFreelancer: number;
  };
}

const ACTIVE_ESCROW_STATUSES = new Set(['Selected', 'Funded', 'In progress', 'Submitted', 'Disputed']);

/**
 * Validates switching between account modes (Freelancer only / Client only / Both).
 * Blocks switches when active escrow contracts exist (locked funds).
 * Shows warnings when open job postings or pending applications exist.
 */
export function validateAccountModeSwitch(
  targetMode: AccountMode,
  userAddress: string | null | undefined,
  jobs: Job[]
): ModeSwitchValidationResult {
  const result: ModeSwitchValidationResult = {
    canSwitch: true,
    hasWarnings: false,
    affectedItems: {
      activeEscrowsAsClient: 0,
      openJobsAsClient: 0,
      activeEscrowsAsFreelancer: 0,
      openApplicationsAsFreelancer: 0,
    },
  };

  if (!userAddress) return result;

  // Calculate client items
  const clientJobs = jobs.filter((j) => areAddressesEqual(j.client, userAddress));
  result.affectedItems.activeEscrowsAsClient = clientJobs.filter((j) =>
    ACTIVE_ESCROW_STATUSES.has(j.status)
  ).length;
  result.affectedItems.openJobsAsClient = clientJobs.filter((j) => j.status === 'Open').length;

  // Calculate freelancer items
  const freelancerJobs = jobs.filter((j) => areAddressesEqual(j.freelancer, userAddress));
  result.affectedItems.activeEscrowsAsFreelancer = freelancerJobs.filter((j) =>
    ACTIVE_ESCROW_STATUSES.has(j.status)
  ).length;

  result.affectedItems.openApplicationsAsFreelancer = jobs.filter(
    (j) =>
      j.status === 'Open' &&
      (j.applications || []).some((app) => areAddressesEqual(app.applicant, userAddress))
  ).length;

  if (targetMode === 'client') {
    // Turning off Freelancer role
    if (result.affectedItems.activeEscrowsAsFreelancer > 0) {
      result.canSwitch = false;
      result.blockedReason = `Cannot switch to Client only: You have ${result.affectedItems.activeEscrowsAsFreelancer} active contract(s) as a freelancer with funds in escrow. Complete work and release escrow before disabling freelancer mode.`;
      return result;
    }

    if (result.affectedItems.openApplicationsAsFreelancer > 0) {
      result.hasWarnings = true;
      result.warningMessage = `You have ${result.affectedItems.openApplicationsAsFreelancer} pending application(s). Switching to Client only will withdraw or pause these applications.`;
    }
  } else if (targetMode === 'freelancer') {
    // Turning off Client role
    if (result.affectedItems.activeEscrowsAsClient > 0) {
      result.canSwitch = false;
      result.blockedReason = `Cannot switch to Freelancer only: You have ${result.affectedItems.activeEscrowsAsClient} active contract(s) as a client with escrow funds locked. Settle contracts and release funds before disabling client mode.`;
      return result;
    }

    if (result.affectedItems.openJobsAsClient > 0) {
      result.hasWarnings = true;
      result.warningMessage = `You have ${result.affectedItems.openJobsAsClient} open job posting(s). Switching to Freelancer only will pause these postings from accepting new proposals.`;
    }
  }

  return result;
}
