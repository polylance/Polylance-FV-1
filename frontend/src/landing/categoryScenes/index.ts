import type { Category } from '../../types/taxonomy';
import type { CategorySceneDescriptor, SceneKey } from './types';

export * from './types';
export { MiniSceneIcon } from './miniIcons';
export { SceneStageFrame } from './SceneStageFrame';
export { useScenePlayback } from './useScenePlayback';

/**
 * Scene descriptors backed by lazy dynamic imports so only hovered/focused/selected
 * scenes are downloaded by the client.
 */
export const SCENE_CATALOG: Record<SceneKey, Omit<CategorySceneDescriptor, 'matchedBy'>> = {
  web3: {
    key: 'web3',
    title: 'Contract execution',
    subtitle: 'Escrow chain blocks, lock closure, token transfer, and verified hash.',
    durationMs: 4400,
    load: () => import('./Web3Scene'),
  },
  frontend: {
    key: 'frontend',
    title: 'Interface build',
    subtitle: 'Skeleton placeholders resolve into responsive UI cards and interactions.',
    durationMs: 4200,
    load: () => import('./FrontendScene'),
  },
  backend: {
    key: 'backend',
    title: 'Request and response',
    subtitle: 'Client to API to database round trip with verified response and latency bar.',
    durationMs: 4200,
    load: () => import('./BackendScene'),
  },
  mobile: {
    key: 'mobile',
    title: 'App flow',
    subtitle: 'Mobile skeleton resolves, tap ripple fires, and milestone card confirms.',
    durationMs: 4200,
    load: () => import('./MobileScene'),
  },
  design: {
    key: 'design',
    title: 'Artboard and system',
    subtitle: 'Grid-snapped card construction, cobalt swatches, and layer hierarchy.',
    durationMs: 4200,
    load: () => import('./DesignScene'),
  },
  'data-ai': {
    key: 'data-ai',
    title: 'Neural pipeline',
    subtitle: 'Connected model nodes, rising metrics, and verified evaluation score.',
    durationMs: 4200,
    load: () => import('./DataAiScene'),
  },
  'data-analytics': {
    key: 'data-analytics',
    title: 'Analytics & BI',
    subtitle: 'Query results, growing bar chart, and trend line synchronization.',
    durationMs: 4000,
    load: () => import('./DataAnalyticsScene'),
  },
  devops: {
    key: 'devops',
    title: 'CI/CD deployment',
    subtitle: 'Build, Test, Deploy Workflow stepper completing at a live cluster.',
    durationMs: 4000,
    load: () => import('./DevOpsScene'),
  },
  security: {
    key: 'security',
    title: 'Security & audit',
    subtitle: 'Automated scan sweep isolates and resolves risk under a verified shield.',
    durationMs: 4200,
    load: () => import('./SecurityScene'),
  },
  'content-writing': {
    key: 'content-writing',
    title: 'Editorial & docs',
    subtitle: 'Document drafting, word count progression, and readership impact.',
    durationMs: 4000,
    load: () => import('./ContentWritingScene'),
  },
  marketing: {
    key: 'marketing',
    title: 'Growth & SEO',
    subtitle: 'Acquisition funnel stages paired with organic growth metrics.',
    durationMs: 4000,
    load: () => import('./MarketingScene'),
  },
  creators: {
    key: 'creators',
    title: 'Creator collabs',
    subtitle: 'Sponsored brief lock, media delivery, and milestone release.',
    durationMs: 4000,
    load: () => import('./CreatorsScene'),
  },
  'video-motion': {
    key: 'video-motion',
    title: 'Video & motion',
    subtitle: 'Timeline clips snap into sync as the playhead updates the frame.',
    durationMs: 4200,
    load: () => import('./VideoMotionScene'),
  },
  qa: {
    key: 'qa',
    title: 'QA & testing',
    subtitle: 'Sequential test assertions passing alongside coverage progress.',
    durationMs: 3800,
    load: () => import('./QaTestingScene'),
  },
  'admin-support': {
    key: 'admin-support',
    title: 'Operations & support',
    subtitle: 'Structured ticket triage, sprint sync, and milestone delivery.',
    durationMs: 3800,
    load: () => import('./AdminSupportScene'),
  },
  generic: {
    key: 'generic',
    title: 'Escrow workflow',
    subtitle: 'Category specialization paired with Post, Fund, and Get paid steps.',
    durationMs: 4000,
    load: () => import('./GenericScene'),
  },
};

const EXACT_SLUG_MAP: Record<string, SceneKey> = {
  'web3-blockchain': 'web3',
  web3: 'web3',
  'smart-contracts': 'web3',
  'development-it': 'frontend',
  frontend: 'frontend',
  'web-development': 'frontend',
  backend: 'backend',
  'software-apis': 'backend',
  mobile: 'mobile',
  'mobile-development': 'mobile',
  'design-creative': 'design',
  design: 'design',
  'ui-ux': 'design',
  'ai-automation': 'data-ai',
  ai: 'data-ai',
  'ai-ml': 'data-ai',
  'data-analytics': 'data-analytics',
  data: 'data-analytics',
  analytics: 'data-analytics',
  devops: 'devops',
  'devops-cloud': 'devops',
  cloud: 'devops',
  infrastructure: 'devops',
  security: 'security',
  'security-review': 'security',
  audit: 'security',
  cybersecurity: 'security',
  'writing-content': 'content-writing',
  content: 'content-writing',
  writing: 'content-writing',
  marketing: 'marketing',
  seo: 'marketing',
  'creators-brand-collabs': 'creators',
  creators: 'creators',
  'video-audio-animation': 'video-motion',
  'video-audio': 'video-motion',
  video: 'video-motion',
  motion: 'video-motion',
  'qa-testing': 'qa',
  qa: 'qa',
  testing: 'qa',
  'admin-support': 'admin-support',
};

const KEYWORD_RULES: Array<{ sceneKey: SceneKey; keywords: string[] }> = [
  { sceneKey: 'security', keywords: ['security', 'audit', 'pentest', 'slither', 'mythril', 'cybersecurity', 'vulnerability'] },
  { sceneKey: 'web3', keywords: ['web3', 'solidity', 'blockchain', 'smart contract', 'foundry', 'hardhat', 'polygon', 'defi'] },
  { sceneKey: 'devops', keywords: ['devops', 'cloud', 'infra', 'kubernetes', 'terraform', 'docker', 'ci/cd', 'aws', 'gcp'] },
  { sceneKey: 'qa', keywords: ['qa', 'test', 'playwright', 'cypress', 'vitest', 'jest', 'selenium'] },
  { sceneKey: 'mobile', keywords: ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 'expo'] },
  { sceneKey: 'backend', keywords: ['backend', 'api', 'node', 'postgres', 'graphql', 'microservices', 'grpc', 'golang'] },
  { sceneKey: 'frontend', keywords: ['frontend', 'react', 'next.js', 'vue', 'tailwind', 'typescript', 'ui engineering'] },
  { sceneKey: 'design', keywords: ['design', 'ui', 'ux', 'figma', 'wireframing', 'branding', 'illustration', '3d'] },
  { sceneKey: 'video-motion', keywords: ['video', 'motion', 'edit', 'after effects', 'premiere', 'davinci', 'audio', 'animation'] },
  { sceneKey: 'data-ai', keywords: ['ai', 'ml', 'pytorch', 'tensorflow', 'langchain', 'rag', 'llm', 'agent', 'automation'] },
  { sceneKey: 'data-analytics', keywords: ['data', 'analytics', 'sql', 'tableau', 'power bi', 'snowflake', 'bigquery', 'etl'] },
  { sceneKey: 'creators', keywords: ['creator', 'youtube', 'ugc', 'sponsorship', 'influencer', 'podcast'] },
  { sceneKey: 'marketing', keywords: ['marketing', 'seo', 'ads', 'growth', 'cro', 'funnel'] },
  { sceneKey: 'content-writing', keywords: ['content', 'writing', 'copywriting', 'whitepaper', 'blog', 'documentation'] },
  { sceneKey: 'admin-support', keywords: ['admin', 'support', 'assistant', 'zendesk', 'intercom', 'jira', 'scrum'] },
];

const warnedFallbackSlugs = new Set<string>();

export interface CategoryInputLike {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  subcategories?: Category['subcategories'];
  skills?: string[];
}

/**
 * Extracts flat unique skill names from a taxonomy Category or domain-like object.
 */
export function extractCategorySkills(category: CategoryInputLike): string[] {
  const skillSet = new Set<string>();
  if (Array.isArray(category.skills)) {
    category.skills.forEach((s) => s && skillSet.add(s));
  }
  if (Array.isArray(category.subcategories)) {
    category.subcategories.forEach((sub) => {
      if (Array.isArray(sub.skills)) {
        sub.skills.forEach((s) => s && skillSet.add(s));
      }
    });
  }
  return Array.from(skillSet);
}

/**
 * Resolves any category (known, newly added, or keyword-matched) to a scene descriptor.
 * Automatically falls back to GenericScene when no slug or keyword matches, and emits
 * a single dev-only console warning naming the unmatched category.
 */
export function resolveCategoryScene(category: CategoryInputLike): CategorySceneDescriptor {
  const slugLower = (category.slug || '').toLowerCase().trim();
  const idLower = (category.id || '').toLowerCase().trim();

  // 1. Exact slug or id match
  const exactKey = EXACT_SLUG_MAP[slugLower] || EXACT_SLUG_MAP[idLower];
  if (exactKey && SCENE_CATALOG[exactKey]) {
    return {
      ...SCENE_CATALOG[exactKey],
      matchedBy: 'exact',
    };
  }

  // 2. Keyword match against slug, name, description, and skills
  const skills = extractCategorySkills(category);
  const haystack = `${slugLower} ${category.name || ''} ${category.description || ''} ${skills.join(' ')}`.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some((kw) => {
      if (kw.length <= 3) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
      }
      return haystack.includes(kw);
    });

    if (matched) {
      return {
        ...SCENE_CATALOG[rule.sceneKey],
        matchedBy: 'keyword',
      };
    }
  }

  // 3. Generic fallback with dev-only console warning
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    if (!warnedFallbackSlugs.has(slugLower)) {
      warnedFallbackSlugs.add(slugLower);
      console.warn(
        `[CategoryScenes] Category "${category.name}" (slug: "${category.slug}") used the GenericScene fallback. Consider adding a custom scene or keyword rule in src/landing/categoryScenes/index.ts.`
      );
    }
  }

  return {
    ...SCENE_CATALOG.generic,
    matchedBy: 'fallback',
  };
}

/** Helper to get all registered scenes for dev /scene-lab */
export const ALL_SCENE_DESCRIPTORS = Object.values(SCENE_CATALOG);

/**
 * Triggers a background module load for a scene unless Data Saver is enabled.
 */
export function preloadCategoryScene(
  descriptor: CategorySceneDescriptor,
  isDataSaver: boolean
): void {
  if (isDataSaver) return;
  try {
    void descriptor.load();
  } catch {
    // Ignore preload failure; React.lazy handles actual render
  }
}
