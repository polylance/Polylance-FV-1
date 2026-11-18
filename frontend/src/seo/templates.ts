/**
 * PolyLance SEO Title & Description Dynamic Templates
 * Enforces length limits:
 * - Titles: 30 - 60 characters
 * - Descriptions: 120 - 160 characters
 * Safely handles missing data and marks thin content as noindex.
 */

import { RouteSeoConfig } from './types';
import { SITE_URL } from './site.config';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string cleanly at word boundary with an ellipsis
 */
export function clampString(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const sub = text.slice(0, maxLen - 3);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
}

/**
 * Dynamic SEO for public Job Posting pages (/jobs/:id or /jobs/:slug)
 */
export function buildJobSeo(job?: {
  id: string;
  title?: string;
  description?: string;
  amountUsdc?: string;
  amountEth?: string;
  paymentTokenSymbol?: string;
  status?: string;
  skills?: string[];
  client?: string;
  createdAt?: number;
}): RouteSeoConfig {
  if (!job || !job.id || job.status === 'Cancelled' || job.status === 'Draft') {
    return {
      path: job?.id ? `/jobs/${job.id}` : '/jobs',
      title: 'Job Not Available | PolyLance',
      description: 'This freelance contract is no longer active or has been filled on the PolyLance marketplace.',
      canonicalPath: '/find-jobs',
      primaryKeywordId: 'core-freelance-jobs-crypto',
      secondaryKeywordIds: [],
      robots: 'noindex, follow',
      jsonLdTypes: [],
    };
  }

  const rawTitle = job.title || 'Web3 Freelance Project';
  const token = job.paymentTokenSymbol || 'USDC';
  const budget = job.amountUsdc || job.amountEth || '';
  const budgetSuffix = budget ? ` (${budget} ${token})` : '';

  // Form title targeting 40-58 chars
  let title = `${rawTitle}${budgetSuffix} | PolyLance`;
  if (title.length > 60) {
    title = `${clampString(rawTitle, 45)} | PolyLance`;
  }
  if (title.length < 30) {
    title = `${rawTitle} — Web3 Escrow Gig | PolyLance`;
  }

  const cleanDesc = (job.description || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  const descPrefix = `Apply for this escrow-protected freelance job on Polygon. `;
  const descSuffix = ` Milestone escrow funded on-chain with instant release.`;
  const descMaxLen = 158;
  const availableBudget = descMaxLen - descPrefix.length - descSuffix.length;
  const clippedBody = clampString(cleanDesc || 'Deliver web3 milestones under smart contract escrow.', Math.max(availableBudget, 40));
  const description = `${descPrefix}${clippedBody}${descSuffix}`;

  const slug = `${slugify(rawTitle)}-${job.id}`;
  const canonicalPath = `/jobs/${slug}`;

  // Only open/funded real jobs are indexable
  const isIndexable = job.status === 'Open' || job.status === 'Funded' || job.status === 'Selected';

  return {
    path: `/jobs/${job.id}`,
    title,
    description: clampString(description, 160),
    canonicalPath,
    primaryKeywordId: 'core-freelance-jobs-crypto',
    secondaryKeywordIds: ['web3-jobs-hub', 'problem-freelance-escrow-payment'],
    robots: isIndexable ? 'index, follow' : 'noindex, follow',
    jsonLdTypes: isIndexable ? ['JobPosting', 'BreadcrumbList'] : ['BreadcrumbList'],
    ogType: 'website',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Find Jobs', url: '/find-jobs' },
      { name: rawTitle, url: canonicalPath }
    ]
  };
}

/**
 * Dynamic SEO for Skill pages (/skills/:skill)
 * Strict requirement: noindex any skill page with fewer than 3 items
 */
export function buildSkillSeo(skillSlug: string, skillName: string, itemCount: number = 0): RouteSeoConfig {
  const formattedName = skillName || skillSlug.replace(/-/g, ' ');
  const capitalized = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

  const title = `${capitalized} Freelance Jobs Paid in Crypto | PolyLance`;
  const description = `Hire vetted ${capitalized} developers or apply for open ${capitalized} jobs protected by Polygon escrow. Low fees and instant milestone payouts in USDC.`;
  const canonicalPath = `/skills/${skillSlug.toLowerCase()}`;
  const hasAdequateContent = itemCount >= 3;

  return {
    path: `/skills/${skillSlug}`,
    title: clampString(title, 60),
    description: clampString(description, 160),
    canonicalPath,
    primaryKeywordId: 'web3-jobs-hub',
    secondaryKeywordIds: ['core-freelance-jobs-crypto'],
    robots: hasAdequateContent ? 'index, follow' : 'noindex, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: hasAdequateContent ? 0.7 : undefined,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Find Jobs', url: '/find-jobs' },
      { name: `${capitalized} Jobs`, url: canonicalPath }
    ]
  };
}

/**
 * Dynamic SEO for Public Freelancer Profile pages (/freelancers/:handle or /profile/:address)
 * Strict requirement: Indexable ONLY when the user explicitly opted in (isPublic === true).
 */
export function buildProfileSeo(profile?: {
  address: string;
  displayName?: string;
  bio?: string;
  skills?: string[];
  completedJobsCount?: number;
  isPublic?: boolean;
}): RouteSeoConfig {
  if (!profile || !profile.isPublic) {
    return {
      path: profile?.address ? `/profile/${profile.address}` : '/profile',
      title: 'Freelancer Profile | PolyLance',
      description: 'Private freelancer profile on PolyLance. Verify work certificates and active escrow reputation.',
      canonicalPath: profile?.address ? `/profile/${profile.address}` : '/find-jobs',
      primaryKeywordId: 'brand-polylance',
      secondaryKeywordIds: [],
      robots: 'noindex, nofollow',
      jsonLdTypes: [],
    };
  }

  const name = profile.displayName || `Web3 Developer`;
  const skillsList = (profile.skills || []).slice(0, 3).join(', ');
  const skillsSuffix = skillsList ? ` (${skillsList})` : '';

  const title = `${name}${skillsSuffix} — Web3 Profile | PolyLance`;
  const bioExcerpt = profile.bio ? clampString(profile.bio, 65) : 'Experienced web3 freelancer.';
  const completedText = profile.completedJobsCount ? ` Completed ${profile.completedJobsCount} on-chain jobs.` : '';
  const description = `Hire ${name} on PolyLance. ${bioExcerpt}${completedText} Milestone escrow protected on Polygon with verified on-chain certificates.`;

  return {
    path: `/profile/${profile.address}`,
    title: clampString(title, 60),
    description: clampString(description, 160),
    canonicalPath: `/profile/${profile.address}`,
    primaryKeywordId: 'core-hire-web3-developers',
    secondaryKeywordIds: ['web3-onchain-work-certificates'],
    robots: 'index, follow',
    jsonLdTypes: ['ProfilePage', 'Person', 'BreadcrumbList'],
    ogType: 'profile',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Freelancers', url: '/find-jobs' },
      { name: name, url: `/profile/${profile.address}` }
    ]
  };
}
