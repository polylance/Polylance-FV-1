import { TECH_SKILLS_DATABASE, TechSkill, formatSkillDisplayName } from '../data/skillsData';
import { CATEGORIES } from './formatters';

/**
 * Common abbreviations and shorthand aliases mapped to canonical skill names.
 */
export const SKILL_ALIASES_MAP: Record<string, string> = {
  ts: 'TypeScript',
  tsc: 'TypeScript',
  js: 'JavaScript',
  es6: 'JavaScript',
  'react.js': 'React',
  reactjs: 'React',
  next: 'Next.js',
  nextjs: 'Next.js',
  tailwind: 'TailwindCSS',
  tw: 'TailwindCSS',
  sol: 'Solidity',
  py: 'Python',
  py3: 'Python',
  rs: 'Rust',
  golang: 'Go (Golang)',
  eth: 'Ethereum',
  pol: 'Polygon',
  matic: 'Polygon',
  gql: 'GraphQL',
  pg: 'PostgreSQL',
  postgres: 'PostgreSQL',
  rn: 'React Native',
};

/**
 * Helper to check if a skill belongs to or aligns with a high-level job category.
 */
export function isSkillInCategory(skill: TechSkill, categoryId?: string): boolean {
  if (!categoryId) return false;
  const cleanCategory = categoryId.toLowerCase();

  // 1. Direct check against formatters.ts CATEGORIES
  const matchedCategoryConfig = CATEGORIES.find(
    (c) => c.id.toLowerCase() === cleanCategory
  );
  if (
    matchedCategoryConfig?.skills.some(
      (s) => s.toLowerCase() === skill.name.toLowerCase()
    )
  ) {
    return true;
  }

  // 2. SkillCategoryName domain alignment
  const catLower = skill.category.toLowerCase();
  if (cleanCategory === 'frontend') {
    return (
      catLower.includes('frontend') ||
      skill.name === 'TypeScript' ||
      skill.name === 'JavaScript' ||
      skill.name === 'HTML5' ||
      skill.name === 'CSS3'
    );
  }
  if (cleanCategory === 'web3') {
    return (
      catLower.includes('blockchain') ||
      catLower.includes('smart contract') ||
      skill.name === 'Solidity' ||
      skill.name === 'Rust' ||
      skill.name === 'Polygon'
    );
  }
  if (cleanCategory === 'backend') {
    return (
      catLower.includes('backend') ||
      catLower.includes('database') ||
      catLower.includes('apis') ||
      catLower.includes('cloud') ||
      skill.name === 'Node.js' ||
      skill.name === 'Python' ||
      skill.name === 'Go (Golang)'
    );
  }
  if (cleanCategory === 'mobile') {
    return (
      catLower.includes('mobile') ||
      skill.name === 'Flutter' ||
      skill.name === 'React Native' ||
      skill.name === 'Swift' ||
      skill.name === 'Kotlin'
    );
  }

  return false;
}

export interface RankedSkillMatch {
  skill: TechSkill;
  score: number;
  highlightIndices: [number, number]; // [start, end] within skill.name, or [-1, -1]
  matchedAlias?: string;
  categoryTag: string;
}

/**
 * Highly requested / foundational core industry skills prioritized on tie-breaks.
 */
export const POPULAR_SKILLS = new Set([
  'TypeScript',
  'JavaScript',
  'Solidity',
  'React',
  'Next.js',
  'TailwindCSS',
  'Node.js',
  'Python',
  'Rust',
  'Go (Golang)',
  'Foundry',
  'Hardhat',
  'Ethers.js',
  'Viem',
  'Polygon',
  'Ethereum',
  'GraphQL',
  'PostgreSQL',
  'Docker',
  'Smart Contracts',
  'Web3 Development',
]);

/**
 * Ranks and returns top matching skills from TECH_SKILLS_DATABASE.
 */
export function getSmartSkillSuggestions(
  query: string,
  selectedSkills: string[] = [],
  selectedCategory?: string,
  limit: number = 8
): RankedSkillMatch[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // Set of selected skills (lowercase) for exclusion
  const selectedSet = new Set(selectedSkills.map((s) => s.toLowerCase().trim()));

  // Check alias map
  const aliasCanonical = SKILL_ALIASES_MAP[clean];

  const results: RankedSkillMatch[] = [];

  for (const skill of TECH_SKILLS_DATABASE) {
    const nameLower = skill.name.toLowerCase();
    if (selectedSet.has(nameLower)) continue;

    let score = 0;
    let matchedAlias: string | undefined;
    let highlightIndices: [number, number] = [-1, -1];

    // Priority 1: Exact match on name or direct alias map
    if (nameLower === clean || (aliasCanonical && aliasCanonical.toLowerCase() === nameLower)) {
      score = 1000;
      highlightIndices = [0, clean.length];
    }
    // Priority 2: Exact match on skill aliases
    else if (skill.aliases.some((a) => a.toLowerCase() === clean)) {
      score = 900;
      matchedAlias = skill.aliases.find((a) => a.toLowerCase() === clean);
      const idx = nameLower.indexOf(clean);
      if (idx !== -1) {
        highlightIndices = [idx, idx + clean.length];
      }
    }
    // Priority 3: Prefix match on skill name
    else if (nameLower.startsWith(clean)) {
      score = 800;
      highlightIndices = [0, clean.length];
    }
    // Priority 4: Prefix match on skill alias or alias map target starts with query
    else if (
      skill.aliases.some((a) => a.toLowerCase().startsWith(clean)) ||
      (aliasCanonical && aliasCanonical.toLowerCase().startsWith(clean))
    ) {
      score = 650;
      matchedAlias = skill.aliases.find((a) => a.toLowerCase().startsWith(clean));
      const idx = nameLower.indexOf(clean);
      if (idx !== -1) {
        highlightIndices = [idx, idx + clean.length];
      }
    }
    // Priority 5: Word-start match inside name (e.g., "Script" in "TypeScript")
    else if (
      nameLower.includes(` ${clean}`) ||
      nameLower.includes(`-${clean}`) ||
      nameLower.includes(`/${clean}`) ||
      nameLower.includes(`.${clean}`)
    ) {
      score = 500;
      const idx = nameLower.search(new RegExp(`[\\s\\-/.\\(]${clean}`, 'i'));
      if (idx !== -1) {
        highlightIndices = [idx + 1, idx + 1 + clean.length];
      }
    }
    // Priority 6: Substring match anywhere in skill name
    else if (nameLower.includes(clean)) {
      score = 300;
      const idx = nameLower.indexOf(clean);
      highlightIndices = [idx, idx + clean.length];
    }
    // Priority 7: Substring match in alias
    else if (skill.aliases.some((a) => a.toLowerCase().includes(clean))) {
      score = 150;
      matchedAlias = skill.aliases.find((a) => a.toLowerCase().includes(clean));
    }

    if (score > 0) {
      // Category alignment bonus
      if (isSkillInCategory(skill, selectedCategory)) {
        score += 80;
      }

      // Popularity boost for primary foundational skills
      if (POPULAR_SKILLS.has(skill.name)) {
        score += 40;
      }

      // Shorter names slightly preferred in ties
      score += Math.max(0, 30 - skill.name.length);

      // Category tag presentation (compact)
      const categoryTag = getShortCategoryTag(skill.category);

      results.push({
        skill,
        score,
        highlightIndices,
        matchedAlias,
        categoryTag,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Calculates ghost text for the active input string based on the top suggestion.
 * Only returns ghost text when the top suggestion starts with the typed query.
 */
export function getGhostCompletionText(
  typedValue: string,
  topSuggestion?: RankedSkillMatch
): string | null {
  if (!typedValue || !topSuggestion) return null;
  const suggestionName = topSuggestion.skill.name;

  // Strict prefix match required for inline ghost text
  if (suggestionName.toLowerCase().startsWith(typedValue.toLowerCase())) {
    return suggestionName.slice(typedValue.length);
  }

  return null;
}

/**
 * Simplifies 26 SkillCategoryName values into short, readable badges.
 */
function getShortCategoryTag(categoryName: string): string {
  if (categoryName.includes('Frontend')) return 'Frontend';
  if (categoryName.includes('Smart Contract')) return 'Smart Contract';
  if (categoryName.includes('Blockchain')) return 'Web3';
  if (categoryName.includes('Backend')) return 'Backend';
  if (categoryName.includes('Mobile')) return 'Mobile';
  if (categoryName.includes('Database')) return 'Database';
  if (categoryName.includes('Programming')) return 'Languages';
  if (categoryName.includes('Security')) return 'Security';
  if (categoryName.includes('AI') || categoryName.includes('Learning')) return 'AI / ML';
  if (categoryName.includes('Design')) return 'UI/UX';
  if (categoryName.includes('Cloud') || categoryName.includes('DevOps')) return 'DevOps';
  return categoryName.split(' ')[0] || 'Tech';
}
