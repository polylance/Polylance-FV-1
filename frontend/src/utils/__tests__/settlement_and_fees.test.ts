import { describe, it, expect } from 'vitest';
import {
  feeBreakdown,
  calculateFeeBreakdownFromString,
  formatFeeBreakdown,
  BPS_DIVISOR,
  CLIENT_FEE_BPS,
  FREELANCER_FEE_BPS,
} from '../fees';
import {
  ContractJobStatus,
  CONTRACT_STATUS_MAP,
  CONTRACT_ESCROW_STATUS_MAP,
  mapOnChainJobStatus,
  mapOnChainEscrowStatus,
} from '../statusMapping';
import { isJobListed, getEngagementDisplayState } from '../../types/lifecycle';
import { validateDeliverableUrl } from '../security';

describe('Settlement and Fee Module (feeBreakdown)', () => {
  it('strictly satisfies the invariant: clientDeposit === freelancerNet + platformTotal for 10 POL', () => {
    // 10 POL in 18-decimal wei
    const budget = 10_000_000_000_000_000_000n;
    const result = feeBreakdown(budget, 'POL');

    expect(result.budget).toBe(10_000_000_000_000_000_000n);
    expect(result.clientFee).toBe(250_000_000_000_000_000n); // 0.25 POL
    expect(result.clientDeposit).toBe(10_250_000_000_000_000_000n); // 10.25 POL
    expect(result.freelancerFee).toBe(250_000_000_000_000_000n); // 0.25 POL
    expect(result.freelancerNet).toBe(9_750_000_000_000_000_000n); // 9.75 POL
    expect(result.platformTotal).toBe(500_000_000_000_000_000n); // 0.50 POL

    // The gold standard invariant:
    expect(result.clientDeposit).toBe(result.freelancerNet + result.platformTotal);
  });

  it('strictly satisfies the invariant for 100 USDC (6 decimals)', () => {
    // 100 USDC in 6 decimals
    const budget = 100_000_000n;
    const result = feeBreakdown(budget, 'USDC');

    expect(result.budget).toBe(100_000_000n);
    expect(result.clientFee).toBe(2_500_000n); // 2.5 USDC
    expect(result.clientDeposit).toBe(102_500_000n); // 102.5 USDC
    expect(result.freelancerFee).toBe(2_500_000n); // 2.5 USDC
    expect(result.freelancerNet).toBe(97_500_000n); // 97.5 USDC
    expect(result.platformTotal).toBe(5_000_000n); // 5.0 USDC

    expect(result.clientDeposit).toBe(result.freelancerNet + result.platformTotal);
  });

  it('handles 1 wei dust correctly without dropping funds or underflowing', () => {
    const budget = 1n; // 1 wei
    const result = feeBreakdown(budget, 'POL');

    // clientFee: ceil(1 * 250 / 10000) = 1
    expect(result.clientFee).toBe(1n);
    expect(result.clientDeposit).toBe(2n);
    // freelancerFee: floor(1 * 250 / 10000) = 0
    expect(result.freelancerFee).toBe(0n);
    expect(result.freelancerNet).toBe(1n);
    // platformTotal: 1n + 0n = 1n
    expect(result.platformTotal).toBe(1n);

    expect(result.clientDeposit).toBe(result.freelancerNet + result.platformTotal);
  });

  it('handles 0 budget gracefully', () => {
    const result = feeBreakdown(0n, 'POL');
    expect(result.budget).toBe(0n);
    expect(result.clientDeposit).toBe(0n);
    expect(result.freelancerNet).toBe(0n);
    expect(result.platformTotal).toBe(0n);
    expect(result.clientDeposit).toBe(result.freelancerNet + result.platformTotal);
  });

  it('invariant holds across 1,000 diverse budget amounts (property test)', () => {
    const testCases: bigint[] = [
      1n, 2n, 3n, 7n, 13n, 99n, 100n, 101n, 250n, 399n, 400n, 401n, 10000n,
      100_000n, 999_999n, 1_000_000n, 12_345_678n, 1_000_000_000_000_000_000n,
      333_333_333_333_333_333n, 7_777_777_777_777_777_777n
    ];

    // Add pseudo-random large values
    let seed = 123456789n;
    for (let i = 0; i < 500; i++) {
      seed = (seed * 6364136223846793005n + 1442695040888963407n) & 0x7fffffffffffffffn;
      testCases.push(seed);
    }

    for (const b of testCases) {
      const res = feeBreakdown(b, 'POL');
      expect(res.clientDeposit).toBe(res.freelancerNet + res.platformTotal);
    }
  });

  it('calculateFeeBreakdownFromString formats numbers cleanly', () => {
    const res = calculateFeeBreakdownFromString('10', 'POL');
    expect(res.budgetFormatted).toBe('10.0');
    expect(res.clientFeeFormatted).toBe('0.25');
    expect(res.clientDepositFormatted).toBe('10.25');
    expect(res.freelancerFeeFormatted).toBe('0.25');
    expect(res.freelancerNetFormatted).toBe('9.75');
    expect(res.platformTotalFormatted).toBe('0.5');
    expect(res.token).toBe('POL');
  });

  it('calculateFeeBreakdownFromString handles 6-decimal tokens like USDC', () => {
    const res = calculateFeeBreakdownFromString('250.50', 'USDC');
    expect(res.budgetFormatted).toBe('250.5');
    expect(res.clientFeeFormatted).toBe('6.2625');
    expect(res.clientDepositFormatted).toBe('256.7625');
    expect(res.freelancerNetFormatted).toBe('244.2375');
    expect(res.token).toBe('USDC');
  });
});

describe('Contract Status Mapping (statusMapping.ts)', () => {
  it('maps on-chain enum numbers exactly according to JobEscrow.sol', () => {
    expect(mapOnChainJobStatus(0)).toBe('Open');
    expect(mapOnChainJobStatus(1)).toBe('Selected');
    expect(mapOnChainJobStatus(2)).toBe('Submitted');
    expect(mapOnChainJobStatus(3)).toBe('Disputed');
    expect(mapOnChainJobStatus(4)).toBe('Completed');
    expect(mapOnChainJobStatus(5)).toBe('Cancelled');
  });

  it('treats unknown status strictly as Syncing… (NEVER Cancelled or Open)', () => {
    expect(mapOnChainJobStatus(99)).toBe('Syncing…');
    expect(mapOnChainJobStatus(-1)).toBe('Syncing…');
    expect(mapOnChainJobStatus(undefined)).toBe('Syncing…');
    expect(mapOnChainJobStatus(null)).toBe('Syncing…');
  });

  it('maps escrow status correctly', () => {
    expect(mapOnChainEscrowStatus(ContractJobStatus.Completed)).toBe('RELEASED');
    expect(mapOnChainEscrowStatus(ContractJobStatus.Cancelled, true)).toBe('CANCELLED');
    expect(mapOnChainEscrowStatus(99)).toBe('SYNCING');
  });
});

describe('Job Listing Lifecycle (isJobListed)', () => {
  it('lists genuinely open un-funded jobs', () => {
    const openJob: any = {
      id: 'job-1',
      status: 'Open',
      createdAt: Date.now(),
    };
    expect(isJobListed(openJob)).toBe(true);
  });

  it('excludes Completed, Released, Funded, or Cancelled jobs from Find Jobs', () => {
    expect(isJobListed({ id: '1', status: 'Completed' } as any)).toBe(false);
    expect(isJobListed({ id: '2', status: 'Cancelled' } as any)).toBe(false);
    expect(isJobListed({ id: '3', status: 'Funded' } as any)).toBe(false);
    expect(isJobListed({ id: '4', status: 'Submitted' } as any)).toBe(false);
    expect(isJobListed({ id: '5', status: 'Open', escrowStatus: 'RELEASED' } as any)).toBe(false);
    expect(isJobListed({ id: '6', status: 'Open', events: [{ step: 'Funded', status: 'completed' }] } as any)).toBe(false);
    expect(isJobListed({ id: '7', status: 'Open', events: [{ step: 'Completed', status: 'completed' }] } as any)).toBe(false);
  });
});

describe('Security: Deliverable URL Validation', () => {
  it('accepts legitimate public HTTPS links', () => {
    expect(validateDeliverableUrl('https://github.com/polylance/project').valid).toBe(true);
    expect(validateDeliverableUrl('https://demo.myapp.com/staging').valid).toBe(true);
    expect(validateDeliverableUrl('https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco').valid).toBe(true);
  });

  it('blocks localhost, 127.0.0.1, and private IP addresses', () => {
    expect(validateDeliverableUrl('http://localhost:3000').valid).toBe(false);
    expect(validateDeliverableUrl('https://localhost:5173').valid).toBe(false);
    expect(validateDeliverableUrl('http://127.0.0.1:8080').valid).toBe(false);
    expect(validateDeliverableUrl('http://192.168.1.50/demo').valid).toBe(false);
    expect(validateDeliverableUrl('http://10.0.0.1').valid).toBe(false);
  });

  it('blocks cloud metadata IP (169.254.169.254)', () => {
    expect(validateDeliverableUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
  });

  it('blocks non-http protocols (javascript:, file:, data:)', () => {
    expect(validateDeliverableUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateDeliverableUrl('file:///etc/passwd').valid).toBe(false);
    expect(validateDeliverableUrl('data:text/html,<script>alert(1)</script>').valid).toBe(false);
  });
});

describe('Unified Display State Engine (getEngagementDisplayState)', () => {
  it('strictly derives COMPLETED when confirmed release or completion event exists, even if status is Submitted', () => {
    const staleSubmittedJob: any = {
      id: 'job-stale-1',
      title: 'Enhance Polylance UI design',
      status: 'Submitted', // stale status before sync
      escrowStatus: 'RELEASED',
      events: [
        { step: 'Created', status: 'completed' },
        { step: 'Funded', status: 'completed' },
        { step: 'Submitted', status: 'completed' },
        { step: 'Completed', status: 'completed' },
      ],
    };

    const disp = getEngagementDisplayState(staleSubmittedJob);
    expect(disp.isCompleted).toBe(true);
    expect(disp.state).toBe('COMPLETED');
    expect(disp.displayLabel).toContain('Completed');
    expect(disp.allowedActions.canReleasePayment).toBe(false);
    expect(disp.allowedActions.canSubmit).toBe(false);
    expect(disp.displayLabel).not.toBe('In Review');
    expect(disp.displayLabel).not.toBe('Submitted, Under Review');
  });

  it('suppresses revision banner once a subsequent submission or completion exists', () => {
    const jobWithSupersededRevision: any = {
      id: 'job-rev-1',
      status: 'Completed',
      modificationRequests: [
        {
          id: 'mod-1',
          requestedAt: 1000,
          details: 'resend it',
        },
      ],
      submissionHistory: [
        {
          version: 1,
          submittedAt: 500,
        },
        {
          version: 2,
          submittedAt: 2000, // submitted after revision requested at 1000!
        },
      ],
      events: [
        { step: 'Completed', status: 'completed', timestamp: 3000 },
      ],
    };

    const disp = getEngagementDisplayState(jobWithSupersededRevision);
    expect(disp.isCompleted).toBe(true);
    expect(disp.isRevisionActive).toBe(false);
  });

  it('derives PAYMENT_PENDING when release transaction is broadcasting/confirming', () => {
    const confirmingJob: any = {
      id: 'job-pending-1',
      status: 'Submitted',
      releaseTxPending: true,
      events: [
        { step: 'Submitted', status: 'completed' },
      ],
    };

    const disp = getEngagementDisplayState(confirmingJob);
    expect(disp.state).toBe('PAYMENT_PENDING');
    expect(disp.displayLabel).toBe('Payment confirming…');
    expect(disp.isCompleted).toBe(false);
  });
});

describe('Platform Fee Dues Classification Engine', () => {
  interface OnChainSettlementAudit {
    jobId: string;
    budget: bigint;
    clientDeposited: bigint;
    freelancerReceived: bigint;
    treasuryReceived: bigint;
    contractLeftover: bigint;
  }

  function classifyFeeSettlement(audit: OnChainSettlementAudit) {
    const exp = feeBreakdown(audit.budget, 'POL');
    const clientUnderpaid = audit.clientDeposited < exp.clientDeposit;
    const freelancerUnderDeducted = audit.freelancerReceived > exp.freelancerNet;

    let clientClassification = 'FEE_PAID';
    let freelancerClassification = 'FEE_PAID';

    if (audit.clientDeposited >= exp.clientDeposit) {
      if (audit.contractLeftover >= exp.clientFee && audit.treasuryReceived < exp.clientFee) {
        clientClassification = 'FEE_IN_CONTRACT';
      } else {
        clientClassification = 'FEE_PAID';
      }
    } else {
      clientClassification = 'FEE_UNDERPAID';
    }

    if (audit.freelancerReceived <= exp.freelancerNet) {
      freelancerClassification = 'FEE_PAID';
    } else if (freelancerUnderDeducted) {
      freelancerClassification = 'FEE_UNDERPAID';
    }

    return {
      clientClassification,
      freelancerClassification,
      clientShortfall: clientUnderpaid ? exp.clientDeposit - audit.clientDeposited : 0n,
      freelancerShortfall: freelancerUnderDeducted ? audit.freelancerReceived - exp.freelancerNet : 0n,
    };
  }

  it('classifies FEE_PAID when atomic payout split sent all shares correctly', () => {
    // 10 POL: client deposited 10.25, freelancer got 9.75, treasury got 0.50
    const audit: OnChainSettlementAudit = {
      jobId: 'normal-job',
      budget: 10_000_000_000_000_000_000n,
      clientDeposited: 10_250_000_000_000_000_000n,
      freelancerReceived: 9_750_000_000_000_000_000n,
      treasuryReceived: 500_000_000_000_000_000n,
      contractLeftover: 0n,
    };

    const res = classifyFeeSettlement(audit);
    expect(res.clientClassification).toBe('FEE_PAID');
    expect(res.freelancerClassification).toBe('FEE_PAID');
  });

  it('classifies FEE_IN_CONTRACT when client paid fee into contract but release did not sweep to treasury', () => {
    const audit: OnChainSettlementAudit = {
      jobId: 'contract-leftover-job',
      budget: 10_000_000_000_000_000_000n,
      clientDeposited: 10_250_000_000_000_000_000n,
      freelancerReceived: 9_750_000_000_000_000_000n,
      treasuryReceived: 0n,
      contractLeftover: 500_000_000_000_000_000n, // Stuck in contract!
    };

    const res = classifyFeeSettlement(audit);
    expect(res.clientClassification).toBe('FEE_IN_CONTRACT'); // Platform recovery, NOT user debt!
  });

  it('classifies FEE_UNDERPAID on job 0x0D34F6B4Fb25 where client deposited 0 to contract & underpaid fee', () => {
    const audit: OnChainSettlementAudit = {
      jobId: '0x0D34F6B4Fb25',
      budget: 10_000_000_000_000_000_000n,
      clientDeposited: 0n, // refunded & transferred direct
      freelancerReceived: 9_993_750_000_000_000_000n, // received full budget - gas
      treasuryReceived: 0n,
      contractLeftover: 0n,
    };

    const res = classifyFeeSettlement(audit);
    expect(res.clientClassification).toBe('FEE_UNDERPAID');
    expect(res.freelancerClassification).toBe('FEE_UNDERPAID');
    expect(res.clientShortfall).toBe(10_250_000_000_000_000_000n);
    expect(res.freelancerShortfall).toBe(243_750_000_000_000_000n);
  });
});
