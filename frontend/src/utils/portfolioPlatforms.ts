export type PortfolioPlatformId =
  | 'behance'
  | 'dribbble'
  | 'youtube'
  | 'instagram'
  | 'figma'
  | 'notion'
  | 'linkedin'
  | 'website';

export interface DetectedPlatformMeta {
  id: PortfolioPlatformId;
  label: string;
  accentClass: string;
  badgeBgClass: string;
}

const PLATFORM_MAP: Record<PortfolioPlatformId, DetectedPlatformMeta> = {
  behance: {
    id: 'behance',
    label: 'Behance',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  dribbble: {
    id: 'dribbble',
    label: 'Dribbble',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  figma: {
    id: 'figma',
    label: 'Figma',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    accentClass: 'text-[#0F172A]',
    badgeBgClass: 'bg-slate-100 border-slate-200 text-[#0F172A]',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    accentClass: 'text-[#0A52B8]',
    badgeBgClass: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0A52B8]',
  },
  website: {
    id: 'website',
    label: 'Personal Website',
    accentClass: 'text-[#0F172A]',
    badgeBgClass: 'bg-slate-100 border-slate-200 text-[#0F172A]',
  },
};

export function detectPortfolioPlatform(rawUrl: string): DetectedPlatformMeta {
  const lower = (rawUrl || '').toLowerCase();
  if (lower.includes('behance.net')) return PLATFORM_MAP.behance;
  if (lower.includes('dribbble.com')) return PLATFORM_MAP.dribbble;
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return PLATFORM_MAP.youtube;
  if (lower.includes('instagram.com')) return PLATFORM_MAP.instagram;
  if (lower.includes('figma.com')) return PLATFORM_MAP.figma;
  if (lower.includes('notion.so') || lower.includes('notion.site')) return PLATFORM_MAP.notion;
  if (lower.includes('linkedin.com')) return PLATFORM_MAP.linkedin;
  return PLATFORM_MAP.website;
}

export function normalizeSafeUrl(rawUrl: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export const NON_TECH_DISCIPLINES = [
  'Design & Creative',
  'Video, Audio & Animation',
  'Creators & Brand Collabs',
  'Marketing',
  'Writing & Content',
  'Admin & Support',
] as const;

export const TECH_DISCIPLINES = [
  'Development & IT',
  'Web3 & Blockchain',
  'AI & Automation',
  'Data & Analytics',
] as const;

export function isDualVerified(profile?: {
  githubVerified?: boolean;
  portfolioVerified?: boolean;
  portfolioLinks?: Array<{ url?: string }>;
} | null): boolean {
  if (!profile) return false;
  const hasPortfolio = Boolean(
    profile.portfolioVerified && profile.portfolioLinks && profile.portfolioLinks.length > 0
  );
  return Boolean(profile.githubVerified && hasPortfolio);
}

const TECH_CATEGORY_KEYWORDS = [
  'development',
  'web3',
  'blockchain',
  'smart contract',
  'solidity',
  'security',
  'audit',
  'frontend',
  'backend',
  'mobile',
  'devops',
  'cloud',
  'ai',
  'machine learning',
  'ml',
  'automation',
  'data engineering',
  'data science',
  'api',
  'cybersecurity',
  'qa',
  'testing',
  'it support',
];

export function classifyJobVerificationTrack(
  category?: string,
  skills: string[] = []
): 'tech' | 'non-tech' {
  const catLower = (category || '').toLowerCase();
  if (
    catLower.includes('design') ||
    catLower.includes('creative') ||
    catLower.includes('video') ||
    catLower.includes('audio') ||
    catLower.includes('animation') ||
    catLower.includes('creator') ||
    catLower.includes('collab') ||
    catLower.includes('marketing') ||
    catLower.includes('writing') ||
    catLower.includes('content') ||
    catLower.includes('admin') ||
    catLower.includes('support')
  ) {
    return 'non-tech';
  }
  if (TECH_CATEGORY_KEYWORDS.some((kw) => catLower.includes(kw))) {
    return 'tech';
  }
  const combinedSkills = skills.join(' ').toLowerCase();
  if (
    /\b(solidity|rust|react|typescript|next\.js|python|smart contract|docker|kubernetes|terraform)\b/.test(
      combinedSkills
    )
  ) {
    return 'tech';
  }
  return 'non-tech';
}
