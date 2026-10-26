import { Job, UserProfile } from '../types';

/**
 * Filter utility to ensure only genuine, production-ready, non-test data is
 * displayed on public landing surfaces (marketplace preview, activity ticker,
 * public statistics, and work certificates showcase).
 */

const TEST_KEYWORDS = [
  'test',
  'e2e',
  'mock',
  'sample',
  'cypress',
  'playwright',
  'dummy',
  'temp',
  '0x62330823b1a9',
];

export function isTestJob(job: Partial<Job> | null | undefined): boolean {
  if (!job) return true;

  const id = (job.id || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const client = (job.client || '').toLowerCase();

  // Explicit test jobs identified during audit
  if (id.includes('job-escrow-test') || id.includes('test') || id.includes('0x62330823b1a9')) {
    return true;
  }

  for (const kw of TEST_KEYWORDS) {
    if (id.includes(kw) || title.includes(kw) || desc.includes(kw) || client.includes(kw)) {
      return true;
    }
  }

  return false;
}

export function isRealPublicJob(job: Partial<Job> | null | undefined): boolean {
  if (!job) return false;
  if (isTestJob(job)) return false;
  // Ensure the job has an actual title and non-zero budget
  if (!job.title || job.title.trim().length === 0) return false;
  return true;
}

export function sanitizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove **bold**
    .replace(/\*(.*?)\*/g, '$1')     // remove *italic*
    .replace(/__(.*?)__/g, '$1')     // remove __bold__
    .replace(/_(.*?)_/g, '$1')       // remove _italic_
    .replace(/`([^`]+)`/g, '$1')     // remove `code`
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove markdown links
    .replace(/[#*_~`]/g, '')         // strip stray tokens
    .trim();
}

export function isTestProfile(profile: Partial<UserProfile> | null | undefined): boolean {
  if (!profile) return true;
  const name = (profile.displayName || '').toLowerCase();
  const bio = (profile.bio || '').toLowerCase();
  const title = (profile.title || '').toLowerCase();

  for (const kw of TEST_KEYWORDS) {
    if (name.includes(kw) || bio.includes(kw) || title.includes(kw)) {
      return true;
    }
  }
  return false;
}

export function isTestActivityEvent(event: any): boolean {
  if (!event) return true;
  const str = JSON.stringify(event).toLowerCase();
  for (const kw of TEST_KEYWORDS) {
    if (str.includes(kw)) return true;
  }
  return false;
}
