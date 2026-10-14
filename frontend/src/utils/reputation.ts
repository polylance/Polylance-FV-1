import { Job, UserProfile } from '../types';
import {
  calculateFreelancerReputation,
  TaskEvaluationResult,
  UserReputationSummary,
} from '../config/reputationTasks';

export interface ReputationScores {
  totalPoints: number;
  escrowPoints: number;
  volumePoints: number;
  attestationBonus: number;
  arbitrationPoints: number;
  eventBonusPoints: number;
  completedJobsCount: number;
  totalVolume: number;
  successRatePercent: number;
  taskResults?: TaskEvaluationResult[];
}

/**
 * Standardized PolyLance Freelancer Reputation Calculation Formula:
 * Powered by modular configuration in `src/config/reputationTasks.ts`.
 * 
 * Rules:
 * 1. Reputation scores are strictly awarded to freelancers based on genuine deliverables.
 * 2. Accounts acting strictly as clients do not receive freelance reputation points.
 * 3. Eliminates phantom/fake score fallbacks to keep leaderboard deterministic and consistent.
 */
export const calculateReputationScores = (
  targetAddress: string,
  jobs: Job[],
  profileObj?: UserProfile | null,
  _sbtCount: number = 0,
  isJudgeAccount: boolean = false,
  _judgeAddr: string = ''
): ReputationScores => {
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

  const result: UserReputationSummary = calculateFreelancerReputation(
    targetAddress,
    jobs,
    profileObj,
    isJudgeAccount
  );

  return {
    totalPoints: result.totalPoints,
    escrowPoints: result.escrowPoints,
    volumePoints: result.volumePoints,
    attestationBonus: result.attestationBonus,
    arbitrationPoints: result.arbitrationPoints,
    eventBonusPoints: result.eventBonusPoints,
    completedJobsCount: result.completedJobsCount,
    totalVolume: result.totalVolume,
    successRatePercent: result.successRatePercent,
    taskResults: result.taskResults,
  };
};

export const getReputationTier = (totalPoints: number): { tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'; label: string; color: string } => {
  if (totalPoints >= 1000) return { tier: 'Diamond', label: 'Diamond Tier', color: 'blue' };
  if (totalPoints >= 500) return { tier: 'Gold', label: 'Gold Tier', color: 'gold' };
  if (totalPoints >= 200) return { tier: 'Silver', label: 'Silver Tier', color: 'silver' };
  return { tier: 'Bronze', label: 'Bronze Tier', color: 'slate' };
};

export const formatEarnings = (val: number): string => {
  if (!val || val <= 0) return '$0';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  if (val % 1 === 0) return `$${val}`;
  return `$${val.toFixed(2)}`;
};
