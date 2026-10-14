import { describe, it, expect } from 'vitest';
import {
  canApplyToJob,
  validateAccountModeSwitch,
  areAddressesEqual,
  normalizeAddress,
} from '../accountMode';
import { Job } from '../../types';

describe('accountMode utilities', () => {
  const CLIENT_ADDR = '0xB8aa4718c3F53109aF9a9f237B157d6209Dd09Dd';
  const FREELANCER_ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  const mockOpenJob: any = {
    id: 'job-1',
    client: CLIENT_ADDR,
    status: 'Open',
    applications: [],
  };

  describe('normalizeAddress & areAddressesEqual', () => {
    it('matches addresses with different casing', () => {
      expect(
        areAddressesEqual(
          '0xb8aa4718c3f53109af9a9f237b157d6209dd09dd',
          '0xB8aa4718c3F53109aF9a9f237B157d6209Dd09Dd'
        )
      ).toBe(true);
    });

    it('returns false for completely different addresses', () => {
      expect(areAddressesEqual(CLIENT_ADDR, FREELANCER_ADDR)).toBe(false);
    });

    it('handles empty or undefined inputs safely', () => {
      expect(areAddressesEqual(null, CLIENT_ADDR)).toBe(false);
      expect(areAddressesEqual(undefined, undefined)).toBe(false);
    });
  });

  describe('canApplyToJob', () => {
    it('denies the job owner from applying to their own job (OWN_JOB)', () => {
      const res = canApplyToJob(
        { address: CLIENT_ADDR, isConnected: true, accountMode: 'both' },
        mockOpenJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('OWN_JOB');
    });

    it('denies the job owner even if the address casing is all lowercase', () => {
      const res = canApplyToJob(
        {
          address: '0xb8aa4718c3f53109af9a9f237b157d6209dd09dd',
          isConnected: true,
          accountMode: 'both',
        },
        mockOpenJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('OWN_JOB');
    });

    it('denies a non-owner in client-only mode (CLIENT_ONLY_MODE)', () => {
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: true, accountMode: 'client' },
        mockOpenJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('CLIENT_ONLY_MODE');
    });

    it('allows a non-owner in freelancer-only mode', () => {
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: true, accountMode: 'freelancer' },
        mockOpenJob
      );
      expect(res.allowed).toBe(true);
    });

    it('allows a non-owner in both mode (default)', () => {
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: true, accountMode: 'both' },
        mockOpenJob
      );
      expect(res.allowed).toBe(true);
    });

    it('denies when wallet is not connected (NOT_CONNECTED)', () => {
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: false },
        mockOpenJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('NOT_CONNECTED');
    });

    it('denies when job status is not Open (JOB_CLOSED)', () => {
      const closedJob = { ...mockOpenJob, status: 'In progress' };
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: true, accountMode: 'both' },
        closedJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('JOB_CLOSED');
    });

    it('allows applying to a Selected job during negotiation if user has not applied', () => {
      const selectedJob = { ...mockOpenJob, status: 'Selected' };
      const res = canApplyToJob(
        { address: '0x9999999999999999999999999999999999999999', isConnected: true, accountMode: 'both' },
        selectedJob
      );
      expect(res.allowed).toBe(true);
    });

    it('denies when freelancer has already applied (ALREADY_APPLIED)', () => {
      const appliedJob = {
        ...mockOpenJob,
        applications: [{ applicant: FREELANCER_ADDR }],
      };
      const res = canApplyToJob(
        { address: FREELANCER_ADDR, isConnected: true, accountMode: 'both' },
        appliedJob
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('ALREADY_APPLIED');
    });
  });

  describe('validateAccountModeSwitch', () => {
    it('blocks switching to freelancer mode if user has active escrow contracts as client', () => {
      const jobsWithClientEscrow: any[] = [
        {
          id: 'j-active',
          client: CLIENT_ADDR,
          freelancer: FREELANCER_ADDR,
          status: 'Funded', // Active escrow
        },
      ];

      const res = validateAccountModeSwitch('freelancer', CLIENT_ADDR, jobsWithClientEscrow);
      expect(res.canSwitch).toBe(false);
      expect(res.blockedReason).toContain('active contract(s) as a client');
    });

    it('blocks switching to client mode if user has active escrow contracts as freelancer', () => {
      const jobsWithFreelancerEscrow: any[] = [
        {
          id: 'j-active-2',
          client: CLIENT_ADDR,
          freelancer: FREELANCER_ADDR,
          status: 'In progress', // Active escrow
        },
      ];

      const res = validateAccountModeSwitch('client', FREELANCER_ADDR, jobsWithFreelancerEscrow);
      expect(res.canSwitch).toBe(false);
      expect(res.blockedReason).toContain('active contract(s) as a freelancer');
    });

    it('allows switching to freelancer mode with warning if user has open jobs', () => {
      const jobsWithOpen: any[] = [
        {
          id: 'j-open',
          client: CLIENT_ADDR,
          status: 'Open',
        },
      ];

      const res = validateAccountModeSwitch('freelancer', CLIENT_ADDR, jobsWithOpen);
      expect(res.canSwitch).toBe(true);
      expect(res.hasWarnings).toBe(true);
      expect(res.warningMessage).toContain('open job posting(s)');
    });

    it('allows switching to client mode with warning if user has pending applications', () => {
      const jobsWithApps: any[] = [
        {
          id: 'j-app',
          client: CLIENT_ADDR,
          status: 'Open',
          applications: [{ applicant: FREELANCER_ADDR }],
        },
      ];

      const res = validateAccountModeSwitch('client', FREELANCER_ADDR, jobsWithApps);
      expect(res.canSwitch).toBe(true);
      expect(res.hasWarnings).toBe(true);
      expect(res.warningMessage).toContain('pending application(s)');
    });

    it('allows clean switch to both mode without blocking', () => {
      const res = validateAccountModeSwitch('both', CLIENT_ADDR, []);
      expect(res.canSwitch).toBe(true);
      expect(res.hasWarnings).toBe(false);
    });
  });
});
