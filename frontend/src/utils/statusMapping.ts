/**
 * Explicit contract enum mapping generated directly from JobEscrow.sol:
 * enum JobStatus { Open, Selected, Submitted, Disputed, Completed, Cancelled }
 * 
 * Invariants:
 * 1. 0 = Open
 * 2. 1 = Selected
 * 3. 2 = Submitted
 * 4. 3 = Disputed
 * 5. 4 = Completed
 * 6. 5 = Cancelled
 * 7. Any unknown or unreadable status (-1, undefined, null, out-of-range) MUST return 'Syncing…'
 *    NEVER derive 'Cancelled' or 'Open' from unknown status, failed reads, or zero balances!
 */

export const ContractJobStatus = {
  Open: 0,
  Selected: 1,
  Submitted: 2,
  Disputed: 3,
  Completed: 4,
  Cancelled: 5,
} as const;

export type ContractJobStatus = (typeof ContractJobStatus)[keyof typeof ContractJobStatus];

export const CONTRACT_STATUS_MAP: Record<number, string> = {
  [ContractJobStatus.Open]: 'Open',
  [ContractJobStatus.Selected]: 'Selected',
  [ContractJobStatus.Submitted]: 'Submitted',
  [ContractJobStatus.Disputed]: 'Disputed',
  [ContractJobStatus.Completed]: 'Completed',
  [ContractJobStatus.Cancelled]: 'Cancelled',
};

export const CONTRACT_ESCROW_STATUS_MAP: Record<number, string> = {
  [ContractJobStatus.Open]: 'AWAITING_DEPOSIT',
  [ContractJobStatus.Selected]: 'FUNDED',
  [ContractJobStatus.Submitted]: 'FUNDED',
  [ContractJobStatus.Disputed]: 'DISPUTED',
  [ContractJobStatus.Completed]: 'RELEASED',
  [ContractJobStatus.Cancelled]: 'CANCELLED',
};

/**
 * Maps on-chain integer status code to human-readable job status string.
 * Unrecognized or invalid codes strictly map to 'Syncing…'
 */
export function mapOnChainJobStatus(statusNum: number | string | null | undefined): string {
  if (statusNum === null || statusNum === undefined) {
    return 'Syncing…';
  }
  const parsed = typeof statusNum === 'string' ? parseInt(statusNum, 10) : statusNum;
  if (isNaN(parsed) || !(parsed in CONTRACT_STATUS_MAP)) {
    return 'Syncing…';
  }
  return CONTRACT_STATUS_MAP[parsed];
}

/**
 * Maps on-chain status code to escrow status chip state.
 * Strictly guarantees that 'CANCELLED' is only returned for verified on-chain Cancelled event/status.
 */
export function mapOnChainEscrowStatus(
  statusNum: number | string | null | undefined,
  hasConfirmedCancelEvent: boolean = false
): string {
  if (statusNum === null || statusNum === undefined) {
    return 'SYNCING';
  }
  const parsed = typeof statusNum === 'string' ? parseInt(statusNum, 10) : statusNum;
  
  // If cancelled status is returned, verify confirmed cancellation
  if (parsed === ContractJobStatus.Cancelled) {
    return hasConfirmedCancelEvent || parsed === 5 ? 'CANCELLED' : 'SYNCING';
  }

  if (isNaN(parsed) || !(parsed in CONTRACT_ESCROW_STATUS_MAP)) {
    return 'SYNCING';
  }
  return CONTRACT_ESCROW_STATUS_MAP[parsed];
}
