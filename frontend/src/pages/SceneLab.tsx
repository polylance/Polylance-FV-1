import React, { useState, useMemo } from 'react';
import {
  ALL_SCENE_DESCRIPTORS,
  resolveCategoryScene,
  extractCategorySkills,
  MiniSceneIcon,
} from '../landing/categoryScenes';
import { LazyCategoryScene } from '../landing/categoryScenes/LazyCategoryScene';
import type { SceneForcedState } from '../landing/categoryScenes/types';
import type { Category } from '../types/taxonomy';

const FAKE_KEYWORD_CATEGORY: Category = {
  id: 'cat_fake_kw',
  slug: 'solidity-fuzzing-audit',
  name: 'Solidity Fuzzing & Security',
  description: 'Temporary fake category testing automatic keyword resolution.',
  themeColor: 'cobalt',
  accentColor: '#0047AB',
  subcategories: [
    {
      id: 'sub_fk_1',
      slug: 'audit',
      name: 'Audit',
      skills: ['Slither', 'Foundry', 'Vulnerability Audit'],
    },
  ],
};

const FAKE_GENERIC_CATEGORY: Category = {
  id: 'cat_fake_gen',
  slug: 'quantum-gastronomy-lab',
  name: 'Quantum Gastronomy',
  description: 'Temporary fake category testing GenericScene fallback and dev console warning.',
  themeColor: 'cobalt',
  accentColor: '#0047AB',
  subcategories: [
    {
      id: 'sub_fg_1',
      slug: 'molecular',
      name: 'Molecular Culinary',
      skills: ['Cryo Plating', 'Aroma Synthesis', 'Precision Timing'],
    },
  ],
};

export const SceneLab: React.FC = () => {
  const [selectedState, setSelectedState] = useState<SceneForcedState | 'all'>('playing');
  const [includeFakeCategory, setIncludeFakeCategory] = useState(false);

  const states: Array<{ id: SceneForcedState | 'all'; label: string }> = [
    { id: 'playing', label: 'Playing (Timeline)' },
    { id: 'first', label: 'First Frame' },
    { id: 'final', label: 'Final Frame' },
    { id: 'reduced', label: 'Reduced Motion' },
    { id: 'all', label: 'All 4 States Side-by-Side' },
  ];

  const fakeTests = useMemo(() => {
    if (!includeFakeCategory) return [];
    return [FAKE_KEYWORD_CATEGORY, FAKE_GENERIC_CATEGORY].map((cat) => ({
      category: cat,
      descriptor: resolveCategoryScene(cat),
      skills: extractCategorySkills(cat),
    }));
  }, [includeFakeCategory]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0B0B0F] py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EAF1FB] text-[#0047AB]">
            Development Tool Only · /#/scene-lab
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0F] mt-2">
            Category Scenes QA Lab
          </h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Inspect every scene in first-frame, playing, final-frame, and reduced-motion states, plus mini tab icons and fallback resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {states.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedState(s.id)}
              className={`px-3.5 py-2 min-h-[44px] rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                selectedState === s.id
                  ? 'bg-[#0047AB] text-white'
                  : 'bg-[#F5F6FA] text-[#0B0B0F] border border-[#E5E7EB] hover:bg-[#EAF1FB]'
              }`}
            >
              {s.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIncludeFakeCategory((prev) => !prev)}
            className={`px-3.5 py-2 min-h-[44px] rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              includeFakeCategory
                ? 'bg-[#E8F7EF] text-[#0B7A55] border-[#BFE6D3]'
                : 'bg-[#FFFFFF] text-[#0B0B0F] border-[#E5E7EB] hover:border-[#0047AB]'
            }`}
          >
            {includeFakeCategory ? 'Hide Fake Categories' : '+ Inject Fake Categories (Test Fallback)'}
          </button>
        </div>
      </div>

      {/* Fake Fallback Verification Section */}
      {includeFakeCategory && (
        <section className="space-y-4 p-6 rounded-[16px] bg-[#F5F6FA] border border-[#C9DAF2]">
          <div>
            <h2 className="text-lg font-bold text-[#0B0B0F]">
              Automatic Fallback Verification
            </h2>
            <p className="text-xs text-[#4B5563]">
              Verifies keyword matching ("Solidity Fuzzing &amp; Security") and GenericScene fallback ("Quantum Gastronomy" logs a dev-only console warning).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fakeTests.map(({ category, descriptor, skills }) => (
              <div key={category.slug} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#0B0B0F]">{category.name}</div>
                    <div className="text-xs text-[#6B7280] font-mono">
                      matchedBy: {descriptor.matchedBy} → {descriptor.key}
                    </div>
                  </div>
                  <MiniSceneIcon sceneKey={descriptor.key} isSelected />
                </div>
                <LazyCategoryScene
                  descriptor={descriptor}
                  categoryName={category.name}
                  categorySlug={category.slug}
                  skills={skills}
                  forcedState={selectedState === 'all' ? 'playing' : selectedState}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mini Tab Icons Gallery */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0B0B0F]">
          Mini Tab Icons (40px — animate on hover, focus, or selected)
        </h2>
        <div className="flex flex-wrap gap-3">
          {ALL_SCENE_DESCRIPTORS.map((desc) => (
            <div
              key={`mini-${desc.key}`}
              tabIndex={0}
              className="pl-mini-trigger flex items-center gap-2.5 p-2.5 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] hover:bg-[#EAF1FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
            >
              <MiniSceneIcon sceneKey={desc.key} isSelected={false} />
              <div className="text-xs">
                <div className="font-semibold text-[#0B0B0F]">{desc.key}</div>
                <div className="text-[11px] text-[#6B7280]">Hover/focus</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Registered Scenes Grid */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-[#0B0B0F]">
          All Registered Scenes ({ALL_SCENE_DESCRIPTORS.length})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ALL_SCENE_DESCRIPTORS.map((desc) => {
            const descriptor = { ...desc, matchedBy: 'exact' as const };
            return (
              <div
                key={desc.key}
                className="p-5 rounded-[16px] border border-[#E5E7EB] bg-[#F5F6FA] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <MiniSceneIcon sceneKey={desc.key} isSelected />
                    <div>
                      <h3 className="text-base font-bold text-[#0B0B0F]">
                        {desc.title}{' '}
                        <span className="text-xs font-mono font-normal text-[#0047AB]">
                          ({desc.key})
                        </span>
                      </h3>
                      <p className="text-xs text-[#6B7280]">{desc.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#4B5563] bg-[#FFFFFF] px-2 py-1 rounded border border-[#E5E7EB]">
                    {desc.durationMs}ms
                  </span>
                </div>

                {selectedState === 'all' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(['first', 'playing', 'final', 'reduced'] as SceneForcedState[]).map((st) => (
                      <div key={st} className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#4B5563]">
                          {st}
                        </span>
                        <LazyCategoryScene
                          descriptor={descriptor}
                          categoryName={desc.title}
                          categorySlug={desc.key}
                          skills={['React', 'Solidity', 'TypeScript']}
                          forcedState={st}
                          showReplayButton={false}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <LazyCategoryScene
                    descriptor={descriptor}
                    categoryName={desc.title}
                    categorySlug={desc.key}
                    skills={['React', 'Solidity', 'TypeScript']}
                    forcedState={selectedState}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default SceneLab;
