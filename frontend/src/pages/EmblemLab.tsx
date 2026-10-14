import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { TierEmblem, RankEmblem, CompactTierChip, TierType } from '../components/common/TierEmblem';

const TIERS: TierType[] = ['bronze', 'silver', 'gold', 'diamond'];
const SIZES: (20 | 32 | 48 | 96 | 140)[] = [20, 32, 48, 96, 140];

export const EmblemLab: React.FC = () => {
  return (
    <PageContainer className="py-8 space-y-10">
      <PageHeader
        title="Tier Emblem Lab"
        subtitle="Visual QA and design inspection for PolyLance vector SVG tier emblems and ranks across sizes, states, and surfaces."
      />

      {/* 1. Light Surface Standard Grid */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          1. Light Surface (#FFFFFF) — Standard & Active States
        </h3>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs">
          {TIERS.map((tier) => (
            <div key={tier} className="space-y-3 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase text-[#0047AB] bg-[#EAF1FB] px-2.5 py-0.5 rounded">
                  {tier}
                </span>
                <CompactTierChip tier={tier} />
              </div>

              {/* Standard Sizes */}
              <div className="flex items-end gap-6 flex-wrap pt-2">
                {SIZES.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <TierEmblem tier={tier} size={size} />
                    <span className="text-[11px] font-mono text-slate-500">{size}px</span>
                  </div>
                ))}
              </div>

              {/* Current (Active Glow) State */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-medium block mb-2">Active / Current State:</span>
                <div className="flex items-center gap-6 flex-wrap">
                  {SIZES.map((size) => (
                    <div key={`curr-${size}`} className="flex flex-col items-center gap-2">
                      <TierEmblem tier={tier} size={size} isCurrent={true} />
                      <span className="text-[10px] font-mono text-slate-400">{size}px current</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked State */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 font-medium block mb-2">Locked State:</span>
                <div className="flex items-center gap-6 flex-wrap">
                  {SIZES.map((size) => (
                    <div key={`lock-${size}`} className="flex flex-col items-center gap-2">
                      <TierEmblem tier={tier} size={size} isLocked={true} />
                      <span className="text-[10px] font-mono text-slate-400">{size}px locked</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Dark Surface (Ink #0B0B0F) High Contrast Inspection */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          2. Dark Surface (Ink #0B0B0F) — Standing Card Contrast
        </h3>
        <div className="bg-[#0B0B0F] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
          {TIERS.map((tier) => (
            <div key={`dark-${tier}`} className="space-y-3 border-b border-slate-900 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase text-white bg-slate-800 px-2.5 py-0.5 rounded">
                  {tier}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-white text-xs font-medium">
                  <TierEmblem tier={tier} size={20} />
                  <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                </span>
              </div>

              <div className="flex items-end gap-6 flex-wrap pt-2">
                {SIZES.map((size) => (
                  <div key={`dark-${size}`} className="flex flex-col items-center gap-2">
                    <TierEmblem tier={tier} size={size} isCurrent={tier === 'gold'} />
                    <span className="text-[11px] font-mono text-slate-400">{size}px</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Rank Emblems (1, 2, 3, 4+) */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          3. Leaderboard Rank Emblems (1 Crowned, 2 Silver, 3 Bronze, 4+ Monospace)
        </h3>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-6 flex-wrap">
            {[1, 2, 3, 4, 5, 10, 42].map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <RankEmblem rank={r} size={40} />
                <span className="text-xs font-medium text-slate-600">Rank {r}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 flex-wrap pt-4 border-t border-slate-100">
            {[1, 2, 3, 4, 5].map((r) => (
              <div key={`sm-${r}`} className="flex flex-col items-center gap-2">
                <RankEmblem rank={r} size={24} />
                <span className="text-[11px] font-medium text-slate-500">24px</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
};
