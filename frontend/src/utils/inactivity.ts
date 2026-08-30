import { Job } from '../types';

export const JOB_INACTIVITY_REMINDER_DAYS = 10;
export const JOB_AUTO_EXPIRY_DAYS = 14;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface JobInactivityStatus {
  daysElapsed: number;
  daysRemaining: number;
  isReminderActive: boolean;
  isExpired: boolean;
}

/**
 * Evaluates whether an open job has reached the 10-day client inactivity reminder threshold
 * or the 14-day automatic expiration & removal threshold.
 *
 * Rules:
 * - Applicable only to jobs with status === 'Open' and no assigned freelancer.
 * - Days 0–10: Normal active posting.
 * - Days 10–14: Inactivity reminder active (prominent notice to client & applicants).
 * - Day 14+: Automatically removed from marketplace list and pruned from database.
 */
export const getJobInactivityStatus = (job: Job | null | undefined): JobInactivityStatus => {
  if (!job) {
    return { daysElapsed: 0, daysRemaining: JOB_AUTO_EXPIRY_DAYS, isReminderActive: false, isExpired: false };
  }

  // Non-Open jobs (Selected, Funded, Submitted, Completed, Disputed, Cancelled) are in active contracts and not expired
  if (job.status !== 'Open' || Boolean(job.freelancer)) {
    return { daysElapsed: 0, daysRemaining: JOB_AUTO_EXPIRY_DAYS, isReminderActive: false, isExpired: false };
  }

  const postedAt = job.createdAt || Date.now();
  const diffMs = Math.max(0, Date.now() - postedAt);
  const daysElapsed = diffMs / MS_PER_DAY;
  const daysRemaining = Math.max(0, Math.ceil(JOB_AUTO_EXPIRY_DAYS - daysElapsed));
  const isExpired = daysElapsed >= JOB_AUTO_EXPIRY_DAYS;
  const isReminderActive = !isExpired && daysElapsed >= JOB_INACTIVITY_REMINDER_DAYS;

  return {
    daysElapsed,
    daysRemaining,
    isReminderActive,
    isExpired,
  };
};
