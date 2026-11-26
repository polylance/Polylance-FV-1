/**
 * Single source of truth for PolyLance Project Domains
 * Used across Category cards, live counts, Find Jobs page filtering, and Post Job pre-selection.
 */

/**
 * Single source of truth for PolyLance Project Domains
 * Used across Category cards, live counts, Find Jobs page filtering, and Post Job pre-selection.
 */

export type DomainId =
  | 'development-it'
  | 'ai-automation'
  | 'web3-blockchain'
  | 'design-creative'
  | 'video-audio'
  | 'creators-brand-collabs'
  | 'marketing'
  | 'writing-content'
  | 'data-analytics'
  | 'admin-support'
  // Legacy aliases
  | 'web3'
  | 'frontend'
  | 'backend'
  | 'mobile';

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
    id: 'development-it',
    label: 'Development & IT',
    eyebrow: 'SOFTWARE ENGINEER / DEVOPS',
    jobLine: 'Build resilient web, mobile, backend and cloud applications.',
    description: 'React, TypeScript, Next.js, Node.js, Python, Go, Rust, DevOps',
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Python', 'Go', 'Rust', 'Tailwind CSS'],
    categoryMatches: [
      'development-it',
      'development',
      'dev & it',
      'it',
      'software',
      'frontend',
      'backend',
      'mobile',
      'devops',
      'cloud',
      'web development',
      'mobile development',
      'software-apis',
      'qa-testing',
    ],
    skillKeywords: [
      'react', 'next.js', 'typescript', 'javascript', 'tailwind', 'tailwind css', 'vite',
      'node.js', 'node', 'rust', 'go', 'golang', 'python', 'postgresql', 'graphql',
      'react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'docker', 'kubernetes',
      'terraform', 'aws', 'gcp', 'ci/cd', 'devops', 'linux', 'microservices', 'rest api', 'api'
    ],
  },
  {
    id: 'ai-automation',
    label: 'AI & Automation',
    eyebrow: 'AI & AUTOMATION ENGINEER',
    jobLine: 'Deploy neural models, autonomous agents, and automated workflows.',
    description: 'Python, PyTorch, LangChain, OpenAI, Hugging Face, RAG, Agents',
    skills: ['Python', 'PyTorch', 'LangChain', 'OpenAI API', 'Hugging Face', 'RAG Systems', 'LlamaIndex'],
    categoryMatches: [
      'ai-automation',
      'ai',
      'automation',
      'machine learning',
      'ai/ml',
      'chatbots',
      'agents',
      'no-code',
      'nlp',
      'computer vision'
    ],
    skillKeywords: [
      'python', 'pytorch', 'tensorflow', 'langchain', 'llamaindex', 'openai', 'anthropic',
      'gemini', 'fine-tuning', 'rag', 'vector database', 'chromadb', 'pinecone', 'agents',
      'chatbots', 'prompt engineering', 'n8n', 'make', 'zapier', 'computer vision', 'opencv', 'mlops'
    ],
  },
  {
    id: 'web3-blockchain',
    label: 'Web3 & Blockchain',
    eyebrow: 'SMART CONTRACT DEVELOPER',
    jobLine: 'Write, test and audit sovereign on-chain contracts.',
    description: 'Solidity, Smart Contracts, DeFi, Hardhat, Polygon, Foundry',
    skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Hardhat', 'Polygon', 'Ethers.js', 'Foundry'],
    categoryMatches: [
      'web3-blockchain',
      'web3',
      'blockchain',
      'smart contracts',
      'smart contract',
      'defi',
      'solidity',
      'tokenomics',
      'dapp',
      'security review'
    ],
    skillKeywords: [
      'solidity', 'smart contract', 'smart contracts', 'hardhat', 'foundry', 'defi', 'polygon',
      'ethers.js', 'ethers', 'viem', 'wagmi', 'erc20', 'erc721', 'erc1155', 'erc5192', 'truffle',
      'chainlink', 'slither', 'audit', 'tokenomics', 'zero knowledge', 'zk-snarks', 'the graph', 'subsquid'
    ],
  },
  {
    id: 'design-creative',
    label: 'Design & Creative',
    eyebrow: 'PRODUCT DESIGNER / UI-UX',
    jobLine: 'Create intuitive interfaces, visual systems, and brand identities.',
    description: 'Figma, UI/UX Design, Design Systems, Branding, 3D & Motion',
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Web Design', 'Wireframing', 'Prototyping'],
    categoryMatches: [
      'design-creative',
      'design',
      'ui/ux',
      'graphic design',
      'branding',
      'illustration',
      '3d',
      'presentation design'
    ],
    skillKeywords: [
      'figma', 'ui/ux', 'ui design', 'ux design', 'design systems', 'wireframing', 'prototyping',
      'user research', 'brand identity', 'logo design', 'illustration', 'packaging', '3d modeling',
      'blender', 'spline', 'deck design', 'adobe creative suite'
    ],
  },
  {
    id: 'video-audio',
    label: 'Video, Audio & Animation',
    eyebrow: 'VIDEO EDITOR / SOUND DESIGNER',
    jobLine: 'Produce high-retention video edits, motion graphics, and audio.',
    description: 'Premiere Pro, After Effects, DaVinci Resolve, Motion Design, Audio',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Sound Design', 'Motion Graphics'],
    categoryMatches: [
      'video-audio-animation',
      'video-audio',
      'video',
      'audio',
      'animation',
      'video editing',
      'motion graphics',
      'podcast production',
      'music'
    ],
    skillKeywords: [
      'premiere pro', 'after effects', 'davinci resolve', 'video editing', 'motion graphics',
      'color grading', 'sound design', 'audio mastering', 'podcast editing', 'short-form editing',
      'reels', 'tiktok editing', 'youtube editing', 'voice-over', 'ableton'
    ],
  },
  {
    id: 'creators-brand-collabs',
    label: 'Creators & Brand Collabs',
    eyebrow: 'CREATOR / BRAND AMBASSADOR',
    jobLine: 'Amplify Web3 protocols with dedicated sponsorships and UGC.',
    description: 'YouTube, UGC, Short Video, Podcasts, Livestreaming, Brand Deals',
    skills: ['YouTube', 'UGC Creation', 'Brand Sponsorships', 'Short-Form Video', 'Podcasting'],
    categoryMatches: [
      'creators-brand-collabs',
      'creators',
      'brand collabs',
      'influencer',
      'ugc',
      'youtube',
      'livestreaming',
      'sponsorships'
    ],
    skillKeywords: [
      'youtube', 'ugc', 'brand sponsorship', 'dedicated video', 'mid-roll', 'podcast interview',
      'livestream', 'twitter spaces', 'brand ambassador', 'audience reach', 'media kit', 'rate card'
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    eyebrow: 'GROWTH STRATEGIST / SEO',
    jobLine: 'Drive user acquisition, organic search rankings, and viral reach.',
    description: 'SEO, Content Marketing, Paid Ads, Social Media, Growth Strategy',
    skills: ['SEO', 'Content Marketing', 'Social Media Marketing', 'Email Marketing', 'Growth Strategy'],
    categoryMatches: [
      'marketing',
      'growth',
      'seo',
      'performance marketing',
      'social media',
      'community management',
      'brand strategy'
    ],
    skillKeywords: [
      'seo', 'sem', 'content marketing', 'social media', 'google ads', 'meta ads', 'email marketing',
      'copywriting', 'funnel optimization', 'analytics', 'growth hacking', 'affiliate marketing'
    ],
  },
  {
    id: 'writing-content',
    label: 'Writing & Content',
    eyebrow: 'TECHNICAL WRITER / COPYWRITER',
    jobLine: 'Draft authoritative documentation, whitepapers, and brand copy.',
    description: 'Technical Writing, Whitepapers, Documentation, Copywriting, Translation',
    skills: ['Technical Writing', 'Copywriting', 'Whitepapers', 'Blog Writing', 'Content Strategy'],
    categoryMatches: [
      'writing-content',
      'writing',
      'content',
      'copywriting',
      'technical writing',
      'translation',
      'localization',
      'whitepaper'
    ],
    skillKeywords: [
      'technical writing', 'documentation', 'whitepaper', 'api documentation', 'copywriting',
      'blog writing', 'seo writing', 'ghostwriting', 'translation', 'proofreading', 'scriptwriting'
    ],
  },
  {
    id: 'data-analytics',
    label: 'Data & Analytics',
    eyebrow: 'DATA ENGINEER / BI ANALYST',
    jobLine: 'Extract actionable intelligence with SQL, dashboards, and pipelines.',
    description: 'SQL, Python, Tableau, Power BI, Data Modeling, ETL Pipelines',
    skills: ['SQL', 'Python', 'Tableau', 'Power BI', 'Data Modeling', 'ETL Pipelines'],
    categoryMatches: [
      'data-analytics',
      'data',
      'analytics',
      'bi',
      'dashboards',
      'data science',
      'data engineering',
      'spreadsheets'
    ],
    skillKeywords: [
      'sql', 'python', 'r', 'tableau', 'power bi', 'looker', 'data engineering', 'etl',
      'data modeling', 'dune analytics', 'bigquery', 'snowflake', 'pandas', 'statistics'
    ],
  },
  {
    id: 'admin-support',
    label: 'Admin & Support',
    eyebrow: 'PROJECT MANAGER / VIRTUAL ASSISTANT',
    jobLine: 'Streamline team operations, customer success, and delivery schedules.',
    description: 'Project Coordination, Virtual Assistance, Customer Support, Research',
    skills: ['Project Coordination', 'Virtual Assistance', 'Customer Support', 'Research', 'Documentation'],
    categoryMatches: [
      'admin-support',
      'admin',
      'support',
      'virtual assistant',
      'customer support',
      'project management',
      'transcription'
    ],
    skillKeywords: [
      'project management', 'virtual assistant', 'customer support', 'zendesk', 'intercom',
      'jira', 'notion', 'data entry', 'research', 'transcription', 'operations', 'calendar management'
    ],
  },
];

export const DOMAIN_BY_ID: Record<string, DomainConfig> = {
  'development-it': DOMAINS[0],
  'ai-automation': DOMAINS[1],
  'web3-blockchain': DOMAINS[2],
  'design-creative': DOMAINS[3],
  'video-audio': DOMAINS[4],
  'video-audio-animation': DOMAINS[4],
  'creators-brand-collabs': DOMAINS[5],
  'marketing': DOMAINS[6],
  'writing-content': DOMAINS[7],
  'data-analytics': DOMAINS[8],
  'admin-support': DOMAINS[9],
  // Legacy aliases mapped to canonical domain configs
  'web3': DOMAINS[2],
  'frontend': DOMAINS[0],
  'backend': DOMAINS[0],
  'mobile': DOMAINS[0],
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
