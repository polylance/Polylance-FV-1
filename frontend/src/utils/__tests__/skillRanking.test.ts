import { describe, it, expect } from 'vitest';
import {
  getSmartSkillSuggestions,
  getGhostCompletionText,
  isSkillInCategory,
  SKILL_ALIASES_MAP,
} from '../skillRanking';

describe('Skill Ranking & Autocomplete Engine', () => {
  it('ranks exact and prefix matches above substring matches', () => {
    const results = getSmartSkillSuggestions('type', [], 'frontend');
    expect(results.length).toBeGreaterThan(0);
    // TypeScript should be top match
    expect(results[0].skill.name).toBe('TypeScript');
    expect(results[0].score).toBeGreaterThanOrEqual(800);
  });

  it('resolves common shorthand aliases correctly', () => {
    // "ts" -> TypeScript
    const tsMatches = getSmartSkillSuggestions('ts', []);
    expect(tsMatches[0].skill.name).toBe('TypeScript');

    // "sol" -> Solidity
    const solMatches = getSmartSkillSuggestions('sol', []);
    expect(solMatches[0].skill.name).toBe('Solidity');

    // "reactjs" -> React
    const reactMatches = getSmartSkillSuggestions('reactjs', []);
    expect(reactMatches[0].skill.name).toBe('React');

    // "next" -> Next.js
    const nextMatches = getSmartSkillSuggestions('next', []);
    expect(nextMatches[0].skill.name).toBe('Next.js');

    // "tailwind" -> TailwindCSS
    const twMatches = getSmartSkillSuggestions('tailwind', []);
    expect(twMatches[0].skill.name).toBe('TailwindCSS');
  });

  it('excludes already selected skills (case-insensitively)', () => {
    // Before selecting TypeScript
    const initial = getSmartSkillSuggestions('type', []);
    expect(initial.some((s) => s.skill.name === 'TypeScript')).toBe(true);

    // After selecting TypeScript
    const filtered = getSmartSkillSuggestions('type', ['typescript']);
    expect(filtered.some((s) => s.skill.name === 'TypeScript')).toBe(false);
  });

  it('prioritizes skills belonging to the selected category on ties', () => {
    // When category is "frontend" vs "backend"
    const frontendResults = getSmartSkillSuggestions('re', [], 'frontend');
    const topFrontend = frontendResults[0]?.skill.name;
    expect(topFrontend).toBe('React');
  });

  it('calculates ghost text completion accurately for prefix matches', () => {
    const suggestions = getSmartSkillSuggestions('type', []);
    const topSuggestion = suggestions[0];
    expect(topSuggestion.skill.name).toBe('TypeScript');

    // Typed "type" -> Ghost should be "Script"
    const ghost = getGhostCompletionText('type', topSuggestion);
    expect(ghost).toBe('Script');

    // Typed "ty" -> Ghost should be "peScript"
    const ghostShort = getGhostCompletionText('ty', topSuggestion);
    expect(ghostShort).toBe('peScript');

    // When query is not a prefix match (e.g. alias search or middle substring), ghost is null
    const noPrefixSuggestion = {
      ...topSuggestion,
      skill: { ...topSuggestion.skill, name: 'Web3 Development' },
    };
    expect(getGhostCompletionText('dev', noPrefixSuggestion)).toBeNull();
  });

  it('returns empty array when query is empty or only whitespace', () => {
    expect(getSmartSkillSuggestions('')).toEqual([]);
    expect(getSmartSkillSuggestions('   ')).toEqual([]);
  });
});
