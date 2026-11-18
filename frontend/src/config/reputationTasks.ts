import { Job, UserProfile } from '../types';

export type TaskCategory =
  | 'freelancer_milestone'
  | 'freelancer_volume'
  | 'code_quality'
  | 'github_attestation'
  | 'arbitration'
  | 'special_event';

export interface EventOccasionConfig {
  name: string;
  badgeLabel?: string;
  multiplier?: number;
  description?: string;
}

export interface ReputationTaskDefinition {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  basePoints: number;
  maxPoints?: number;
  isActive: boolean;
  eventOccasion?: EventOccasionConfig;
  /**
   * Evaluator calculates points awarded to a freelancer based on verified on-chain metrics.
   * Returns points awarded and a descriptive progress text.
   */
  evaluate: (metrics: FreelancerMetrics) => {
    awardedPoints: number;
    isCompleted: boolean;
    progressText: string;
  };
}

export interface FreelancerMetrics {
  isFreelancerRole: boolean;
  completedJobsCount: number;
  totalFinishedJobs: number;
  completedVolumeUsdc: number;
  disputeCount: number;
  hasGithubVerified: boolean;
  githubReposCount: number;
  githubCommitsCount: number;
  arbitratedDisputesCount: number;
  hasWeb3CategoryDeliverable: boolean;
}

/**
 * REPUTATION TASKS & SPECIAL EVENTS CONFIGURATION
 * 
 * Central registry to add, configure, and modify reputation tasks and occasion-based events.
 * Changes here automatically adjust scores without needing any in-site UI task editor.
 * Tasks are rebalanced to ensure reputation is earned through genuine, rigorous freelance work.
 */
export const REPUTATION_TASKS: ReputationTaskDefinition[] = [
  // --- FREELANCER ESCROW COMPLETION BREAKPOINTS ---
  {
    id: 'TASK_ESCROW_BASE',
    title: 'Verified Escrow Deliveries',
    description: 'Earned for each completed, verified freelance contract.',
    category: 'freelancer_milestone',
    basePoints: 25, // 25 pts each (rebalanced from trivial 100 pts)
    isActive: true,
    evaluate: (m) => {
      if (!m.isFreelancerRole || m.completedJobsCount === 0) {
        return { awardedPoints: 0, isCompleted: false, progressText: '0 completed escrow deliverables' };
      }
      const pts = m.completedJobsCount * 25;
      return {
        awardedPoints: pts,
        isCompleted: true,
        progressText: `${m.completedJobsCount} verified contract${m.completedJobsCount > 1 ? 's' : ''} (25 pts each)`,
      };
    },
  },
  {
    id: 'TASK_ESCROW_CONSISTENCY',
    title: 'Consistency Streak (3+ Escrows)',
    description: 'Demonstrate reliability with 3 or more successfully delivered contracts.',
    category: 'freelancer_milestone',
    basePoints: 35,
    isActive: true,
    evaluate: (m) => {
      const completed = m.isFreelancerRole && m.completedJobsCount >= 3;
      return {
        awardedPoints: completed ? 35 : 0,
        isCompleted: completed,
        progressText: completed
          ? 'Consistency milestone achieved (3+ contracts delivered)'
          : `${Math.min(m.completedJobsCount, 3)}/3 completed contracts delivered`,
      };
    },
  },
  {
    id: 'TASK_ESCROW_VETERAN',
    title: 'Veteran Deliveries (5+ Escrows)',
    description: 'Advanced reputation tier for delivering 5 or more completed freelance contracts.',
    category: 'freelancer_milestone',
    basePoints: 60,
    isActive: true,
    evaluate: (m) => {
      const completed = m.isFreelancerRole && m.completedJobsCount >= 5;
      return {
        awardedPoints: completed ? 60 : 0,
        isCompleted: completed,
        progressText: completed
          ? 'Veteran freelancer threshold achieved (5+ contracts)'
          : `${Math.min(m.completedJobsCount, 5)}/5 completed contracts delivered`,
      };
    },
  },
  {
    id: 'TASK_ESCROW_MASTER',
    title: 'Master Practitioner (10+ Escrows)',
    description: 'Elite milestone for seasoned developers with 10 or more verified contract completions.',
    category: 'freelancer_milestone',
    basePoints: 100,
    isActive: true,
    evaluate: (m) => {
      const completed = m.isFreelancerRole && m.completedJobsCount >= 10;
      return {
        awardedPoints: completed ? 100 : 0,
        isCompleted: completed,
        progressText: completed
          ? 'Elite milestone unlocked: 10+ verified deliveries'
          : `${Math.min(m.completedJobsCount, 10)}/10 completed contracts delivered`,
      };
    },
  },

  // --- VOLUME SETTLED BREAKPOINTS ---
  {
    id: 'TASK_VOLUME_TIER_1',
    title: 'Escrow Volume Milestone ($100+)',
    description: 'Proof of commercial delivery totaling at least $100 in settled contract volume.',
    category: 'freelancer_volume',
    basePoints: 20,
    isActive: true,
    evaluate: (m) => {
      const completed = m.isFreelancerRole && m.completedVolumeUsdc >= 100;
      return {
        awardedPoints: completed ? 20 : 0,
        isCompleted: completed,
        progressText: completed
          ? `$${m.completedVolumeUsdc.toFixed(1)} settled volume ($100 milestone met)`
          : `$${m.completedVolumeUsdc.toFixed(1)} / $100.0 settled volume`,
      };
    },
  },
  {
    id: 'TASK_VOLUME_TIER_2',
    title: 'High-Value Volume Tier ($500+)',
    description: 'High-value milestone for delivering over $500 in cumulative contract volume.',
    category: 'freelancer_volume',
    basePoints: 40,
    isActive: true,
    evaluate: (m) => {
      const completed = m.isFreelancerRole && m.completedVolumeUsdc >= 500;
      return {
        awardedPoints: completed ? 40 : 0,
        isCompleted: completed,
        progressText: completed
          ? `$${m.completedVolumeUsdc.toFixed(1)} settled volume ($500 milestone met)`
          : `$${m.completedVolumeUsdc.toFixed(1)} / $500.0 settled volume`,
      };
    },
  },
  {
    id: 'TASK_VOLUME_PROPORTIONAL',
    title: 'Volume Velocity (1 pt / $50 settled)',
    description: 'Continuous earned volume points: 1 pt per $50 settled USDC (capped at 60 pts).',
    category: 'freelancer_volume',
    basePoints: 1,
    maxPoints: 60,
    isActive: true,
    evaluate: (m) => {
      if (!m.isFreelancerRole || m.completedVolumeUsdc <= 0) {
        return { awardedPoints: 0, isCompleted: false, progressText: '$0.0 settled volume' };
      }
      const rawPts = Math.floor(m.completedVolumeUsdc / 50);
      const capped = Math.min(rawPts, 60);
      return {
        awardedPoints: capped,
        isCompleted: capped > 0,
        progressText: `${capped} pts from $${m.completedVolumeUsdc.toFixed(1)} settled volume`,
      };
    },
  },

  // --- QUALITY & DISPUTE-FREE TRACK RECORD ---
  {
    id: 'TASK_QUALITY_DISPUTE_FREE',
    title: 'Flawless Execution (Zero Disputes)',
    description: 'Maintain a 100% dispute-free record across at least 2 completed contracts.',
    category: 'code_quality',
    basePoints: 30,
    isActive: true,
    evaluate: (m) => {
      const eligible = m.isFreelancerRole && m.completedJobsCount >= 2 && m.disputeCount === 0;
      return {
        awardedPoints: eligible ? 30 : 0,
        isCompleted: eligible,
        progressText: eligible
          ? 'Flawless record: 0 disputes across verified deliveries'
          : m.completedJobsCount < 2
          ? 'Requires at least 2 completed jobs to unlock'
          : `${m.disputeCount} dispute(s) recorded`,
      };
    },
  },

  // --- CRYPTOGRAPHIC GITHUB ATTESTATION ---
  {
    id: 'TASK_GITHUB_OAUTH',
    title: 'GitHub OAuth 2.0 Identity Proof',
    description: 'Cryptographically bound GitHub developer profile via official OAuth 2.0.',
    category: 'github_attestation',
    basePoints: 30,
    isActive: true,
    evaluate: (m) => {
      const eligible = m.isFreelancerRole && m.completedJobsCount > 0 && m.hasGithubVerified;
      return {
        awardedPoints: eligible ? 30 : 0,
        isCompleted: eligible,
        progressText: eligible
          ? 'Verified & bound via OAuth 2.0 (+30 pts)'
          : m.completedJobsCount === 0
          ? 'Requires at least 1 completed freelance job to unlock'
          : 'Authorize GitHub in Settings to unlock',
      };
    },
  },
  {
    id: 'TASK_GITHUB_CODE_ACTIVITY',
    title: 'Proven Code Footprint',
    description: 'Bonus for verified developers with active public repositories and commits.',
    category: 'github_attestation',
    basePoints: 20,
    isActive: true,
    evaluate: (m) => {
      const eligible = m.isFreelancerRole && m.completedJobsCount > 0 && m.hasGithubVerified && (m.githubReposCount >= 3 || m.githubCommitsCount >= 20);
      return {
        awardedPoints: eligible ? 20 : 0,
        isCompleted: eligible,
        progressText: eligible
          ? 'Active developer footprint verified (+20 pts)'
          : m.completedJobsCount === 0
          ? 'Requires at least 1 completed freelance job to unlock'
          : 'Requires active public repo and commit activity',
      };
    },
  },

  // --- DECENTRALIZED ARBITRATION TRIBUNAL ---
  // Inactive: Points are strictly reserved for users performing freelancing jobs
  {
    id: 'TASK_ARBITRATION_RULING',
    title: 'Tribunal Dispute Arbitration',
    description: 'Presided over and resolved on-chain disputes as an accredited DAO arbitrator.',
    category: 'arbitration',
    basePoints: 35,
    isActive: false,
    evaluate: (m) => {
      return {
        awardedPoints: 0,
        isCompleted: false,
        progressText: 'Reputation points are strictly awarded for completed freelancing jobs',
      };
    },
  },

  // --- SPECIAL EVENTS & SEASONAL OCCASIONS ---
  // Modify or toggle tasks here whenever special events, hackathons, or occasions occur.
  {
    id: 'TASK_EVENT_POLYGON_SPRINT',
    title: 'Polygon Ecosystem Sprint',
    description: 'Active event bonus: deliver a Web3/Smart Contract escrow milestone.',
    category: 'special_event',
    basePoints: 25,
    isActive: true,
    eventOccasion: {
      name: 'Polygon Ecosystem Sprint',
      badgeLabel: 'Sprint Builder',
      multiplier: 1.0,
      description: 'Polygon Network seasonal acceleration event',
    },
    evaluate: (m) => {
      const eligible = m.isFreelancerRole && m.completedJobsCount > 0 && m.hasWeb3CategoryDeliverable;
      return {
        awardedPoints: eligible ? 25 : 0,
        isCompleted: eligible,
        progressText: eligible
          ? 'Completed Web3/Smart Contract deliverable during Sprint (+25 pts)'
          : 'Deliver a Web3/Smart Contract escrow to claim sprint bonus',
      };
    },
  },
  {
    id: 'TASK_EVENT_GENESIS_BUILDER',
    title: 'Genesis Builder Milestone',
    description: 'Special occasion bonus for early protocol freelancers delivering on PolyLance.',
    category: 'special_event',
    basePoints: 20,
    isActive: true,
    eventOccasion: {
      name: 'Genesis Protocol Launch',
      badgeLabel: 'Genesis Builder',
      multiplier: 1.0,
      description: 'Special milestone for early platform contributors',
    },
    evaluate: (m) => {
      const eligible = m.isFreelancerRole && m.completedJobsCount > 0;
      return {
        awardedPoints: eligible ? 20 : 0,
        isCompleted: eligible,
        progressText: eligible
          ? 'Genesis builder milestone achieved (+20 pts)'
          : 'Complete at least 1 freelance deliverable to earn Genesis bonus',
      };
    },
  },
  {
    id: 'TASK_EVENT_SECURITY_AUDIT_SPRINT',
    title: 'Security Audit & Bug Bounty Sprint',
    description: 'Occasion task: deliver a security audit or smart contract verification milestone.',
    category: 'special_event',
    basePoints: 30,
    isActive: false, // Inactive by default; enable when security audit month or special events occur
    eventOccasion: {
      name: 'Security Audit Sprint',
      badgeLabel: 'Security Auditor',
      multiplier: 1.0,
      description: 'Dedicated occasion for smart contract security audits',
    },
    evaluate: (m) => {
      return {
        awardedPoints: 0,
        isCompleted: false,
        progressText: 'Event concluded or upcoming',
      };
    },
  },
];

export interface TaskEvaluationResult {
  taskId: string;
  title: string;
  description: string;
  category: TaskCategory;
  awardedPoints: number;
  maxPoints?: number;
  isCompleted: boolean;
  progressText: string;
}

export interface UserReputationSummary {
  totalPoints: number;
  escrowPoints: number;
  volumePoints: number;
  attestationBonus: number;
  arbitrationPoints: number;
  eventBonusPoints: number;
  completedJobsCount: number;
  totalVolume: number;
  successRatePercent: number;
  taskResults: TaskEvaluationResult[];
}

/**
 * Calculates deterministic reputation points strictly from verified freelance deliverables
 * and active protocol tasks. Clients receive 0 freelance reputation points.
 */
export function calculateFreelancerReputation(
  targetAddress: string,
  jobs: Job[],
  profileObj?: UserProfile | null,
  isJudgeAccount: boolean = false
): UserReputationSummary {
  if (!targetAddress) {
    return {
      totalPoints: 0,
      escrowPoints: 0,
      volumePoints: 0,
      attestationBonus: 0,
      arbitrationPoints: 0,
      eventBonusPoints: 0,
      completedJobsCount: 0,
      totalVolume: 0,
      successRatePercent: 0,
      taskResults: [],
    };
  }

  const lower = targetAddress.toLowerCase().trim();

  // STAGE 1: Extract verified freelance deliverables
  // Only jobs where targetAddress was the assigned freelancer count.
  const freelanceJobs = (jobs || []).filter(
    (j) => j.freelancer?.toLowerCase().trim() === lower
  );
  const completedJobs = freelanceJobs.filter((j) => j.status === 'Completed');

  const completedCount = completedJobs.length;
  const completedVolume = completedJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  // Finished jobs: Completed or Disputed with resolved ruling
  const finishedJobs = freelanceJobs.filter(
    (j) => j.status === 'Completed' || (j.status === 'Disputed' && j.dispute?.resolved)
  );
  const successfulJobs = completedJobs.filter(
    (j) => !j.dispute || (j.dispute.resolved && (j.dispute.rulingBps ?? 0) >= 5000)
  );
  const successRate = finishedJobs.length > 0
    ? Math.round((successfulJobs.length / finishedJobs.length) * 100)
    : (completedCount > 0 ? 100 : 0);

  const disputesCount = freelanceJobs.filter((j) => j.status === 'Disputed' || j.dispute).length;

  // Arbitrated disputes count (Judge role)
  const resolvedArbitratedDisputes = (jobs || []).filter(
    (j) => j.dispute?.resolved && j.dispute.judge?.toLowerCase().trim() === lower
  );

  const isClientRole = profileObj?.role === 'client';
  
  // STRICT RULE: Only give reputation points to users who actually do the freelancing job!
  // If the user has 0 completed freelance jobs or is strictly acting as a client, totalPoints is 0.
  if (completedCount === 0 || (isClientRole && freelanceJobs.length === 0)) {
    return {
      totalPoints: 0,
      escrowPoints: 0,
      volumePoints: 0,
      attestationBonus: 0,
      arbitrationPoints: 0,
      eventBonusPoints: 0,
      completedJobsCount: 0,
      totalVolume: 0,
      successRatePercent: 0,
      taskResults: REPUTATION_TASKS.filter((t) => t.isActive).map((t) => ({
        taskId: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        awardedPoints: 0,
        maxPoints: t.maxPoints,
        isCompleted: false,
        progressText: 'Requires at least 1 completed freelance job to earn reputation points',
      })),
    };
  }

  // Check if target has completed Web3/Smart contract category jobs
  const hasWeb3Job = completedJobs.some(
    (j) => j.category === 'web3' || /solidity|web3|polygon|smart/i.test(`${j.title || ''} ${j.description || ''}`)
  );

  const metrics: FreelancerMetrics = {
    isFreelancerRole: true,
    completedJobsCount: completedCount,
    totalFinishedJobs: finishedJobs.length,
    completedVolumeUsdc: completedVolume,
    disputeCount: disputesCount,
    hasGithubVerified: Boolean(profileObj?.githubVerified),
    githubReposCount: Number(profileObj?.reposCount) || 0,
    githubCommitsCount: Number(profileObj?.commitsCount) || 0,
    arbitratedDisputesCount: resolvedArbitratedDisputes.length,
    hasWeb3CategoryDeliverable: hasWeb3Job,
  };

  // STAGE 2: Evaluate tasks
  let escrowPoints = 0;
  let volumePoints = 0;
  let attestationBonus = 0;
  let arbitrationPoints = 0;
  let eventBonusPoints = 0;

  const taskResults: TaskEvaluationResult[] = [];

  for (const task of REPUTATION_TASKS) {
    if (!task.isActive) continue;

    const evaluation = task.evaluate(metrics);
    taskResults.push({
      taskId: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      awardedPoints: evaluation.awardedPoints,
      maxPoints: task.maxPoints,
      isCompleted: evaluation.isCompleted,
      progressText: evaluation.progressText,
    });

    switch (task.category) {
      case 'freelancer_milestone':
        escrowPoints += evaluation.awardedPoints;
        break;
      case 'freelancer_volume':
        volumePoints += evaluation.awardedPoints;
        break;
      case 'code_quality':
        escrowPoints += evaluation.awardedPoints;
        break;
      case 'github_attestation':
        attestationBonus += evaluation.awardedPoints;
        break;
      case 'arbitration':
        arbitrationPoints += evaluation.awardedPoints;
        break;
      case 'special_event':
        eventBonusPoints += evaluation.awardedPoints;
        break;
    }
  }

  const totalPoints = escrowPoints + volumePoints + attestationBonus + arbitrationPoints + eventBonusPoints;

  return {
    totalPoints,
    escrowPoints,
    volumePoints,
    attestationBonus,
    arbitrationPoints,
    eventBonusPoints,
    completedJobsCount: completedCount,
    totalVolume: completedVolume,
    successRatePercent: successRate,
    taskResults,
  };
}
