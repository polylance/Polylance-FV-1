import { Job, UserProfile } from '../types';
import { areAddressesEqual } from './accountMode';

export interface ClientTrustStats {
  clientScore: number; // 0 to 1000
  averageRating: number; // 0 to 5
  reviewCount: number;
  jobsPosted: number;
  jobsSettled: number;
  escrowFundedCount: number;
  escrowFundedRate: number; // 0 to 100
  disputesCount: number;
  avgReleaseHours: number | null;
  tierLabel: 'New Client' | 'Verified Client' | 'Trusted Patron' | 'Premier Client';
}

export function calculateClientTrustStats(
  clientAddress: string | undefined | null,
  jobs: Job[] = [],
  profile?: UserProfile | null
): ClientTrustStats {
  if (!clientAddress) {
    return {
      clientScore: 0,
      averageRating: 0,
      reviewCount: 0,
      jobsPosted: 0,
      jobsSettled: 0,
      escrowFundedCount: 0,
      escrowFundedRate: 0,
      disputesCount: 0,
      avgReleaseHours: null,
      tierLabel: 'New Client',
    };
  }

  const clientJobs = (jobs || []).filter((j) =>
    areAddressesEqual(j.client, clientAddress)
  );
  const jobsPosted = clientJobs.length;

  const jobsSettled = clientJobs.filter(
    (j) =>
      j.status === 'Completed' ||
      (j as any).escrowStatus === 'RELEASED' ||
      Boolean(
        j.events?.some(
          (e) =>
            (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') &&
            (e.status === 'completed' || (e.status as string) === 'CONFIRMED')
        )
      )
  ).length;

  const escrowFundedCount = clientJobs.filter(
    (j) =>
      j.status === 'Funded' ||
      j.status === 'Submitted' ||
      j.status === 'Completed' ||
      (j as any).escrowStatus === 'LOCKED' ||
      (j as any).escrowStatus === 'RELEASED' ||
      Boolean(j.events?.some((e) => e.step === 'Funded' && e.status === 'completed'))
  ).length;

  const escrowFundedRate =
    jobsPosted > 0 ? Math.round((escrowFundedCount / jobsPosted) * 100) : 0;

  const disputesCount = clientJobs.filter(
    (j) => j.status === 'Disputed' || Boolean(j.dispute)
  ).length;

  // Release speed calculation where timestamps exist
  const releaseDurationsHours: number[] = [];
  for (const j of clientJobs) {
    const subTs = j.submittedAt || j.proof?.submittedAt;
    const compTs = j.completedAt;
    if (subTs && compTs && compTs > subTs) {
      releaseDurationsHours.push((compTs - subTs) / (1000 * 60 * 60));
    }
  }
  const avgReleaseHours =
    releaseDurationsHours.length > 0
      ? Math.round(
          (releaseDurationsHours.reduce((a, b) => a + b, 0) / releaseDurationsHours.length) * 10
        ) / 10
      : null;

  // Star rating based on completed dispute-free track record & reviews
  const ratedJobs = clientJobs.filter((j) => j.clientReview?.rating && j.clientReview.rating > 0);
  const reviewCount = ratedJobs.length;

  let averageRating = 0;
  if (reviewCount > 0) {
    const sum = ratedJobs.reduce((acc, j) => acc + (j.clientReview?.rating || 5), 0);
    averageRating = Math.round((sum / reviewCount) * 10) / 10;
  } else if (jobsSettled > 0) {
    const cleanRatio = Math.max(0, (jobsSettled - disputesCount) / Math.max(1, jobsSettled));
    averageRating = Math.round((4.2 + 0.8 * cleanRatio) * 10) / 10;
  }

  // Composite score (max 1000)
  const fundedPoints = Math.min(350, escrowFundedCount * 75);
  const settledPoints = Math.min(400, jobsSettled * 90);
  const speedBonus = avgReleaseHours !== null && avgReleaseHours <= 48 ? 100 : jobsSettled > 0 ? 50 : 0;
  const profileBonus = profile?.displayName ? 50 : 0;
  const disputePenalty = disputesCount * 60;

  const rawScore = fundedPoints + settledPoints + speedBonus + profileBonus - disputePenalty;
  const clientScore = Math.max(0, Math.min(1000, rawScore));

  let tierLabel: ClientTrustStats['tierLabel'] = 'New Client';
  if (clientScore >= 750 && jobsSettled >= 5) {
    tierLabel = 'Premier Client';
  } else if (clientScore >= 400 && jobsSettled >= 2) {
    tierLabel = 'Trusted Patron';
  } else if (escrowFundedCount > 0 || profile?.onboardingCompleted) {
    tierLabel = 'Verified Client';
  }

  return {
    clientScore,
    averageRating,
    reviewCount,
    jobsPosted,
    jobsSettled,
    escrowFundedCount,
    escrowFundedRate,
    disputesCount,
    avgReleaseHours,
    tierLabel,
  };
}
