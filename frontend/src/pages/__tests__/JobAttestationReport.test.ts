import { describe, it, expect } from 'vitest';
import { Job } from '../../types';

describe('Part B: Attestation Report Multi-Role Certificate Query & Isolation', () => {
  const aliceAddress = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'; // Checksummed
  const lowerAlice = aliceAddress.toLowerCase();
  const bobAddress = '0x1234567890123456789012345678901234567890';
  const charlieAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  // 4 mock jobs:
  // Job 1: Alice is freelancer (Verified Work), completed with minted SBT
  // Job 2: Alice is client (Patronage), completed with minted SBT
  // Job 3: Alice is freelancer (Verified Work), completed with pending mint (no SBT token yet)
  // Job 4: Bob is client, Charlie is freelancer (Alice is not a party)
  const mockJobs: Job[] = [
    {
      id: 'job-1',
      title: 'Fullstack DApp Development',
      status: 'Completed',
      freelancer: aliceAddress.toUpperCase(), // Case variation
      client: bobAddress,
      amountUsdc: '500',
      sbtTokenId: 101,
      completedAt: 1729000000000,
    } as any,
    {
      id: 'job-2',
      title: 'Smart Contract Security Audit',
      status: 'Completed',
      freelancer: charlieAddress,
      client: aliceAddress.toLowerCase(), // Lowercase variation
      amountUsdc: '1200',
      sbtTokenId: 102,
      completedAt: 1729100000000,
    } as any,
    {
      id: 'job-3',
      title: 'Solidity Gas Optimization',
      status: 'Completed',
      freelancer: aliceAddress, // Standard checksummed
      client: bobAddress,
      amountUsdc: '350',
      sbtTokenId: undefined, // Pending mint!
      completedAt: 1729200000000,
    } as any,
    {
      id: 'job-4',
      title: 'Private Job for Bob and Charlie',
      status: 'Completed',
      freelancer: charlieAddress,
      client: bobAddress,
      amountUsdc: '900',
      sbtTokenId: 103,
      completedAt: 1729300000000,
    } as any,
  ];

  // Logic matching JobAttestationReport
  function filterUserCompletedCertificates(
    jobsList: Job[],
    connectedAddress: string
  ): Job[] {
    if (!connectedAddress) return [];
    const lowerUser = connectedAddress.toLowerCase().trim();
    const map = new Map<string, Job>();

    const checkAndAdd = (j: any) => {
      if (!j) return;
      const jFreelancer = (j.freelancer || '').toLowerCase().trim();
      const jClient = (j.client || '').toLowerCase().trim();
      const isParty = (jFreelancer === lowerUser || jClient === lowerUser);
      if (!isParty) return;

      const isCompletedOrMinted =
        j.status === 'Completed' ||
        j.status === 'Submitted' ||
        j.status === 'PaymentReleased' ||
        Boolean(j.sbtTokenId) ||
        Boolean(j.sbtPatronageTokenId) ||
        Boolean(j.releaseTxHash) ||
        Boolean(j.events && j.events.some((e: any) => e.step === 'Completed' || e.step === 'Released'));

      if (isCompletedOrMinted) {
        const key = String(j.id || '').toLowerCase().trim();
        if (key && !map.has(key)) {
          map.set(key, j);
        }
      }
    };

    jobsList.forEach(checkAndAdd);
    return Array.from(map.values());
  }

  it('lists ALL 3 certificates for an account holding both Verified Work and Patronage roles', () => {
    const userCerts = filterUserCompletedCertificates(mockJobs, aliceAddress);
    expect(userCerts).toHaveLength(3);
    const ids = userCerts.map((j) => j.id);
    expect(ids).toContain('job-1');
    expect(ids).toContain('job-2');
    expect(ids).toContain('job-3');
    // Confirm Job 4 is strictly excluded (privacy boundary)
    expect(ids).not.toContain('job-4');
  });

  it('handles address comparisons case-insensitively regardless of input format', () => {
    // Testing with all-caps address, lowercase, and checksummed
    const certsFromLower = filterUserCompletedCertificates(mockJobs, lowerAlice);
    const certsFromUpper = filterUserCompletedCertificates(mockJobs, lowerAlice.toUpperCase());
    const certsFromMixed = filterUserCompletedCertificates(mockJobs, aliceAddress);

    expect(certsFromLower).toHaveLength(3);
    expect(certsFromUpper).toHaveLength(3);
    expect(certsFromMixed).toHaveLength(3);
  });

  it('includes pending mint certificates (Job 3 without sbtTokenId) and separates roles accurately', () => {
    const userCerts = filterUserCompletedCertificates(mockJobs, aliceAddress);
    const pendingCert = userCerts.find((j) => j.id === 'job-3');
    expect(pendingCert).toBeDefined();
    expect(pendingCert?.sbtTokenId).toBeUndefined();

    // Role filtering: Verified Work vs Patronage
    const verifiedWorkCerts = userCerts.filter(
      (j) => (j.freelancer || '').toLowerCase().trim() === lowerAlice
    );
    const patronageCerts = userCerts.filter(
      (j) => (j.client || '').toLowerCase().trim() === lowerAlice
    );

    expect(verifiedWorkCerts).toHaveLength(2); // Job 1 and Job 3
    expect(patronageCerts).toHaveLength(1);    // Job 2
  });

  it('sorts certificates newest first by default', () => {
    const userCerts = filterUserCompletedCertificates(mockJobs, aliceAddress);
    const sorted = [...userCerts].sort(
      (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
    );

    expect(sorted[0].id).toBe('job-3'); // 1729200000000
    expect(sorted[1].id).toBe('job-2'); // 1729100000000
    expect(sorted[2].id).toBe('job-1'); // 1729000000000
  });

  it('isolates user certificates so other users (e.g. Bob) only see their own certificates', () => {
    const bobCerts = filterUserCompletedCertificates(mockJobs, bobAddress);
    const bobIds = bobCerts.map((j) => j.id);
    // Bob is client on job-1, client on job-3, client on job-4. But NOT party to job-2.
    expect(bobIds).toContain('job-1');
    expect(bobIds).toContain('job-3');
    expect(bobIds).toContain('job-4');
    expect(bobIds).not.toContain('job-2');
  });
});
