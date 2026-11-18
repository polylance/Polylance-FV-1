import { describe, it, expect } from 'vitest';
import {
  deriveEngagementState,
  normalizeTimestampMs,
  JobStatus,
  EngagementState,
} from '../lifecycle';

describe('Unified Lifecycle State Machine & Invariants', () => {
  it('normalizes seconds vs milliseconds timestamps correctly (Bug 4 fix)', () => {
    const msNow = 1791983628210;
    const secNow = Math.floor(msNow / 1000); // 1791983628 (seconds)

    expect(normalizeTimestampMs(msNow)).toBe(msNow);
    expect(normalizeTimestampMs(secNow)).toBe(secNow * 1000);
    expect(normalizeTimestampMs('1791983628')).toBe(secNow * 1000);
    expect(normalizeTimestampMs(undefined)).toBeGreaterThan(0);
  });

  it('proves Bug 1 fix: selecting candidate derives OFFER_SENT, NEVER ESCROW_FUNDED', () => {
    const selectedJobWithoutAgreement = {
      status: 'Selected' as const,
      clientAgreedTerms: true,
      freelancerAgreedTerms: false,
      events: [{ step: 'Selected', status: 'completed' as const, timestamp: Date.now() }],
    };

    const derived: EngagementState = deriveEngagementState(selectedJobWithoutAgreement);
    expect(derived).toBe('OFFER_SENT');
    expect(derived).not.toBe('ESCROW_FUNDED');
  });

  it('derives TERMS_AGREED when freelancer agrees to terms', () => {
    const selectedJobAgreed = {
      status: 'Selected' as const,
      clientAgreedTerms: true,
      freelancerAgreedTerms: true,
      events: [{ step: 'Selected', status: 'completed' as const, timestamp: Date.now() }],
    };

    const derived: EngagementState = deriveEngagementState(selectedJobAgreed);
    expect(derived === 'TERMS_AGREED' || derived === 'OFFER_ACCEPTED').toBe(true);
    expect(derived).not.toBe('ESCROW_FUNDED');
  });

  it('only derives ESCROW_FUNDED when on-chain Funded status or event is confirmed', () => {
    const fundedJob = {
      status: 'Funded' as const,
      clientAgreedTerms: true,
      freelancerAgreedTerms: true,
      events: [
        { step: 'Selected', status: 'completed' as const, timestamp: Date.now() - 10000 },
        { step: 'Funded', status: 'completed' as const, timestamp: Date.now() },
      ],
    };

    const derived: EngagementState = deriveEngagementState(fundedJob);
    expect(derived).toBe('ESCROW_FUNDED');
  });

  it('derives WORK_SUBMITTED when proof or deliverable is uploaded', () => {
    const submittedJob = {
      status: 'Submitted' as const,
      clientAgreedTerms: true,
      freelancerAgreedTerms: true,
      proof: { title: 'DApp Deliverables', submittedAt: Date.now() },
    };

    const derived: EngagementState = deriveEngagementState(submittedJob);
    expect(derived).toBe('WORK_SUBMITTED');
  });
});
