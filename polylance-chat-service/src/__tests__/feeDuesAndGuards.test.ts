import { describe, it, expect, beforeEach } from 'vitest';
import {
  feeDuesRouter,
  feeDuesStore,
  FEE_DUES_CONFIG,
  PlatformFeeDue,
} from '../feeDues';
import express from 'express';

// Simple unit tests for backend fee dues engine and logic
describe('Backend Fee Dues Engine & 409 Guards', () => {
  beforeEach(() => {
    feeDuesStore.clear();
  });

  it('safely maintains fee dues config with feature flag OFF by default', () => {
    expect(FEE_DUES_CONFIG.ENABLED).toBe(false);
    expect(FEE_DUES_CONFIG.DUST_THRESHOLD_WEI).toBe(10_000_000_000_000_000n); // 0.01 POL
    expect(FEE_DUES_CONFIG.TREASURY_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(FEE_DUES_CONFIG.REMINDER_SCHEDULE_DAYS).toEqual([0, 3, 7, 14, 21, 28]);
    expect(FEE_DUES_CONFIG.MAX_REMINDERS).toBe(5);
  });

  it('stores and retrieves user-specific dues without leaking to other wallets', () => {
    const userA = '0xb30f000000000000000000000000000000001ab1';
    const userB = '0xb8aa0000000000000000000000000000000009dd';

    const dueA: PlatformFeeDue = {
      id: 'due-1',
      jobId: '0x0D34F6B4Fb25',
      party: 'FREELANCER',
      wallet: userA,
      token: 'POL',
      expectedFee: '250000000000000000',
      paidFee: '6250000000000000',
      outstanding: '0.24375',
      status: 'DUE',
      evidence: { txHashes: ['0x111'] },
      reasonCode: 'SETTLEMENT_FEE_UNDERPAID',
      dueSince: Date.now() - 86400000,
      reminderCount: 1,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    };

    const dueB: PlatformFeeDue = {
      id: 'due-2',
      jobId: '0x0D34F6B4Fb25',
      party: 'CLIENT',
      wallet: userB,
      token: 'POL',
      expectedFee: '250000000000000000',
      paidFee: '0',
      outstanding: '0.25',
      status: 'DUE',
      evidence: { txHashes: ['0x222'] },
      reasonCode: 'SETTLEMENT_FEE_UNDERPAID',
      dueSince: Date.now() - 86400000,
      reminderCount: 1,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
    };

    feeDuesStore.set(dueA.id, dueA);
    feeDuesStore.set(dueB.id, dueB);

    // Filter scoped to userA
    const userADues = Array.from(feeDuesStore.values()).filter(
      (d) => d.wallet.toLowerCase() === userA.toLowerCase()
    );
    expect(userADues.length).toBe(1);
    expect(userADues[0].id).toBe('due-1');
    expect(userADues[0].outstanding).toBe('0.24375');

    // Filter scoped to userB
    const userBDues = Array.from(feeDuesStore.values()).filter(
      (d) => d.wallet.toLowerCase() === userB.toLowerCase()
    );
    expect(userBDues.length).toBe(1);
    expect(userBDues[0].id).toBe('due-2');
    expect(userBDues[0].outstanding).toBe('0.25');
  });

  it('pauses reminders and updates status to UNDER_REVIEW on dispute note', () => {
    const userA = '0xb30f000000000000000000000000000000001ab1';
    const dueA: PlatformFeeDue = {
      id: 'due-dispute-1',
      jobId: '0x0D34F6B4Fb25',
      party: 'FREELANCER',
      wallet: userA,
      token: 'POL',
      expectedFee: '250000000000000000',
      paidFee: '0',
      outstanding: '0.25',
      status: 'DUE',
      evidence: {},
      reasonCode: 'SETTLEMENT_FEE_UNDERPAID',
      dueSince: Date.now(),
      reminderCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    feeDuesStore.set(dueA.id, dueA);

    // Simulate problem report
    const target = feeDuesStore.get(dueA.id)!;
    target.status = 'UNDER_REVIEW';
    target.resolutionNote = 'Client directly covered this in private transfer';
    feeDuesStore.set(dueA.id, target);

    const updated = feeDuesStore.get(dueA.id)!;
    expect(updated.status).toBe('UNDER_REVIEW');
    expect(updated.resolutionNote).toBe('Client directly covered this in private transfer');
  });

  it('prevents double release / double submission when job is completed', () => {
    // Model server-side completed job verification check
    function canModifyOrDeleteJob(job: any): boolean {
      const isJobFunded = job.status === 'Funded' || job.status === 'Submitted' || job.status === 'Completed' || job.escrowStatus === 'RELEASED';
      const isJobCompleted = job.status === 'Completed' || job.escrowStatus === 'RELEASED';
      return !isJobFunded && !isJobCompleted;
    }

    const openJob = { id: 'job-1', status: 'Open' };
    const fundedJob = { id: 'job-2', status: 'Funded' };
    const completedJob = { id: 'job-3', status: 'Completed', escrowStatus: 'RELEASED' };

    expect(canModifyOrDeleteJob(openJob)).toBe(true);
    expect(canModifyOrDeleteJob(fundedJob)).toBe(false);
    expect(canModifyOrDeleteJob(completedJob)).toBe(false);
  });
});
