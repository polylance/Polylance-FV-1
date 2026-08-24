import { Job, UserProfile } from '../types';

export interface ReputationScores {
  totalPoints: number;
  escrowPoints: number;
  volumePoints: number;
  attestationBonus: number;
  arbitrationPoints: number;
  completedJobsCount: number;
  totalVolume: number;
  successRatePercent: number;
}

/**
 * Standardized PolyLance Reputation Calculation Formula:
 * 1. SBT Escrow Deliveries: 100 pts per completed escrow delivery / minted SBT
 * 2. Escrow Volume Settled: 1 pt per $25 completed volume (4 pts per $100)
 * 3. Verified Developer Attestation: +50 pts (if GitHub verified)
 * 4. Governance & Dispute Arbitration: +50 pts per ruling / DAO vote (if arbitrator)
 */
export const calculateReputationScores = (
  targetAddress: string,
  jobs: Job[],
  profileObj?: UserProfile | null,
  sbtCount: number = 0,
  isJudgeAccount: boolean = false,
  judgeAddr: string = ''
): ReputationScores => {
  if (!targetAddress) {
    return {
      totalPoints: 0,
      escrowPoints: 0,
      volumePoints: 0,
      attestationBonus: 0,
      arbitrationPoints: 0,
      completedJobsCount: 0,
      totalVolume: 0,
      successRatePercent: 0,
    };
  }

  const lower = targetAddress.toLowerCase();
  const profileJobs = jobs.filter(
    (j) => j.freelancer?.toLowerCase() === lower
  );
  const completedJobs = profileJobs.filter((j) => j.status === 'Completed');
  const completedCount = completedJobs.length;

  const completedVolume = completedJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  const escrowPts = completedCount * 100;
  const volumePts = Math.floor(completedVolume / 25);
  const hasGithub = Boolean(profileObj?.githubVerified);
  const attestationBonus = hasGithub ? 50 : 0;
  
  // Real arbitration points: only awarded when judge actually resolved a dispute
  const resolvedDisputes = jobs.filter(
    (j) => j.dispute?.resolved && (j.dispute.judge?.toLowerCase() === lower || (isJudgeAccount && j.dispute.resolved))
  );
  const arbitrationPts = resolvedDisputes.length * 50;

  const totalPts = escrowPts + volumePts + attestationBonus + arbitrationPts;

  const successRatePercent = completedCount > 0
    ? Math.round((completedJobs.filter(j => !j.dispute || (j.dispute.resolved && (j.dispute.rulingBps ?? 0) >= 5000)).length / completedCount) * 100)
    : 0;

  return {
    totalPoints: totalPts,
    escrowPoints: escrowPts,
    volumePoints: volumePts,
    attestationBonus,
    arbitrationPoints: arbitrationPts,
    completedJobsCount: completedCount,
    totalVolume: completedVolume,
    successRatePercent,
  };
};

export const getReputationTier = (totalPoints: number): { tier: string; label: string; color: string } => {
  if (totalPoints >= 800) return { tier: 'Diamond', label: 'Diamond League', color: 'cyan' };
  if (totalPoints >= 300) return { tier: 'Gold', label: 'Gold League', color: 'amber' };
  if (totalPoints >= 100) return { tier: 'Silver', label: 'Silver League', color: 'slate' };
  return { tier: 'None', label: 'Starter League', color: 'purple' };
};

export const formatEarnings = (val: number): string => {
  if (!val || val <= 0) return '$0.0k';
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(1)}`;
};
