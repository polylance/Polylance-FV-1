/**
 * Single source of truth for PolyLance Project Domains
 * Used across Category cards, live counts, Find Jobs page filtering, and Post Job pre-selection.
 */

export type DomainId = 'web3' | 'frontend' | 'backend' | 'mobile';

export interface DomainConfig {
  id: DomainId;
  label: string;
  eyebrow: string;
  jobLine: string;
  description: string;
  skills: string[];
  categoryMatches: string[];
  skillKeywords: string[];
}

export const DOMAINS: DomainConfig[] = [
  {
    id: 'web3',
    label: 'Web3 / Smart Contracts',
    eyebrow: 'SMART CONTRACT DEVELOPER',
    jobLine: 'Write, test and audit on-chain contracts.',
    description: 'Solidity, Smart Contracts, DeFi, Hardhat, Polygon',
    skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Hardhat', 'Polygon'],
    categoryMatches: [
      'web3',
      'web3 / smart contracts',
      'smart contracts',
      'smart contract',
      'defi',
      'blockchain',
      'solidity',
    ],
    skillKeywords: [
      'solidity',
      'smart contract',
      'smart contracts',
      'hardhat',
      'foundry',
      'defi',
      'polygon',
      'ethers.js',
      'ethers',
      'viem',
      'wagmi',
      'erc20',
      'erc721',
      'erc1155',
      'truffle',
      'chainlink',
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    eyebrow: 'FRONTEND ENGINEER',
    jobLine: 'Turn designs into fast, responsive interfaces.',
    description: 'TypeScript, React, Next.js, Web3 UI, Tailwind CSS',
    skills: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Vite'],
    categoryMatches: [
      'frontend',
      'frontend ui / web',
      'frontend engineer',
      'ui / web',
      'web3 ui',
      'ui',
    ],
    skillKeywords: [
      'react',
      'next.js',
      'typescript',
      'tailwind',
      'tailwind css',
      'vite',
      'javascript',
      'html',
      'css',
      'vue',
      'svelte',
      'web3 ui',
      'redux',
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    eyebrow: 'BACKEND ENGINEER',
    jobLine: 'Build the APIs and data pipelines behind the app.',
    description: 'Node.js, Rust, Go, Python, APIs, Indexers',
    skills: ['Node.js', 'Rust', 'Go', 'Python', 'PostgreSQL'],
    categoryMatches: [
      'backend',
      'backend systems / indexers',
      'backend engineer',
      'systems / indexers',
      'indexers',
      'api',
      'apis',
    ],
    skillKeywords: [
      'node.js',
      'node',
      'rust',
      'go',
      'golang',
      'python',
      'postgresql',
      'graphql',
      'indexer',
      'indexers',
      'subsquid',
      'the graph',
      'api',
      'apis',
      'mongodb',
      'redis',
      'docker',
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    eyebrow: 'MOBILE APP DEVELOPER',
    jobLine: 'Ship apps to the iOS and Android stores.',
    description: 'React Native, Flutter, iOS Swift, Android Kotlin',
    skills: ['React Native', 'Flutter', 'iOS Swift', 'Android Kotlin'],
    categoryMatches: [
      'mobile',
      'mobile app development',
      'mobile engineer',
      'ios',
      'android',
      'react native',
      'flutter',
    ],
    skillKeywords: [
      'react native',
      'flutter',
      'swift',
      'kotlin',
      'ios',
      'android',
      'mobile',
      'expo',
      'dart',
    ],
  },
];

export const DOMAIN_BY_ID: Record<DomainId, DomainConfig> = {
  web3: DOMAINS[0],
  frontend: DOMAINS[1],
  backend: DOMAINS[2],
  mobile: DOMAINS[3],
};
import { isJobListed as canonicalIsJobListed } from '../types/lifecycle';

/**
 * Global single source of truth deciding whether a job appears in Find Jobs.
 * RULE: Delegated directly to canonical isJobListed in types/lifecycle.ts
 */
export function isJobListed(job: any): boolean {
  return canonicalIsJobListed(job);
}

/**
 * Returns true if the job is listed and available on the marketplace.
 * Kept for backwards compatibility, delegating directly to isJobListed.
 */
export function isJobOpen(job: any): boolean {
  return isJobListed(job);
}

/**
 * Matches a job to a domain:
 * 1. By category field match
 * 2. If no category or no category match, by skill overlap
 * 3. Title/description fallback for edge cases
 */
export function isJobInDomain(job: any, domainId: DomainId): boolean {
  if (!job) return false;
  const domain = DOMAIN_BY_ID[domainId];
  if (!domain) return false;

  // 1. Category match
  const rawCat = (job.category || '').toLowerCase().trim();
  if (rawCat) {
    if (domain.categoryMatches.some((match) => rawCat.includes(match) || match.includes(rawCat))) {
      return true;
    }
  }

  // 2. Skill overlap
  const skills: string[] = Array.isArray(job.skillsRequired)
    ? job.skillsRequired
    : Array.isArray(job.skills)
    ? job.skills
    : [];

  const lowerSkills = skills.map((s) => (s || '').toLowerCase().trim());
  const hasSkillOverlap = lowerSkills.some((s) =>
    domain.skillKeywords.some((keyword) => s === keyword || s.includes(keyword) || keyword.includes(s))
  );

  if (hasSkillOverlap) return true;

  // 3. Fallback: Title or Description keyword check if category is missing or ambiguous
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  const textMatches = domain.skillKeywords.some(
    (kw) => kw.length > 3 && (title.includes(kw) || desc.includes(kw))
  );

  return textMatches;
}

/**
 * Finds the canonical domain for an arbitrary category string or ID
 */
export function resolveDomainId(query?: string | null): DomainId | null {
  if (!query) return null;
  const lower = query.toLowerCase().trim();

  for (const domain of DOMAINS) {
    if (domain.id === lower) return domain.id;
    if (domain.label.toLowerCase() === lower) return domain.id;
    if (domain.categoryMatches.some((m) => lower === m || lower.includes(m))) return domain.id;
  }

  return null;
}
