import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { CountUp, ScrollReveal, ScrollRevealGroup } from '../common/MotionPrimitives';
import { PublicStatsData } from '../../hooks/usePublicStats';
import {
  MAINNET_CONTRACTS,
  POLYGONSCAN_BASE_URL,
  POLYGON_CHAIN_ID,
} from '../../seo/site.config';
import { CLIENT_FEE_PERCENT, TOTAL_PLATFORM_FEE_PERCENT } from '../../utils/fees';
import { Job, UserProfile } from '../../types';
import { isRealPublicJob, isTestProfile } from '../../config/testDataFilter';

interface LiveProofStripProps {
  stats: PublicStatsData | null;
  jobs?: Job[];
  profiles?: Record<string, UserProfile>;
}

export const LiveProofStrip: React.FC<LiveProofStripProps> = ({
  stats,
  jobs = [],
  profiles = {},
}) => {
  const realJobs = jobs.filter((j) => isRealPublicJob(j));
  const realProfiles = Object.entries(profiles || {}).filter(([, p]) => !isTestProfile(p));

  const registeredProfilesCount = stats?.registeredProfiles ?? realProfiles.length;
  const completedProjectsCount =
    stats?.jobs?.completed ?? realJobs.filter((j) => j.status === 'Completed').length;

  const polSettled = stats?.settledByToken?.POL ?? 0;
  const usdcSettled = stats?.settledByToken?.USDC ?? 0;

  const totalEscrowsCount = stats?.jobs?.total;

  return (
    <section
      aria-label="Live protocol numbers and key facts"
      className="w-full bg-[#F5F6F8] border-b border-[#E2E5EA] py-10 sm:py-12"
    >
      <PageContainer noVerticalPadding>
        <div className="space-y-8 text-left">
          {/* Row A: Live Protocol Numbers with Staggered Smooth Counters */}
          <ScrollRevealGroup staggerSec={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="space-y-1">
              <div className="text-[13px] font-medium text-[#4B5563]">Profiles</div>
              <div className="text-[28px] sm:text-[32px] font-bold text-[#0B0B0C] tabular-nums leading-tight">
                <CountUp value={registeredProfilesCount} durationMs={650} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[13px] font-medium text-[#4B5563]">Completed projects</div>
              <div className="text-[28px] sm:text-[32px] font-bold text-[#0B0B0C] tabular-nums leading-tight">
                <CountUp value={completedProjectsCount} durationMs={650} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[13px] font-medium text-[#4B5563]">Settled volume</div>
              <div className="text-[22px] sm:text-[26px] font-bold text-[#0B0B0C] tabular-nums leading-tight pt-0.5">
                {stats ? (
                  <>
                    <CountUp value={polSettled} decimals={polSettled > 0 ? 1 : 0} durationMs={650} suffix=" POL" />
                    <span className="text-[#4B5563] font-normal mx-1.5">·</span>
                    <CountUp value={usdcSettled} decimals={0} durationMs={650} suffix=" USDC" />
                  </>
                ) : (
                  <span className="text-[16px] font-medium text-[#4B5563]">Loading…</span>
                )}
              </div>
            </div>

            {typeof totalEscrowsCount === 'number' && (
              <div className="space-y-1">
                <div className="text-[13px] font-medium text-[#4B5563]">Total escrows created</div>
                <div className="text-[28px] sm:text-[32px] font-bold text-[#0B0B0C] tabular-nums leading-tight">
                  <CountUp value={totalEscrowsCount} durationMs={650} />
                </div>
              </div>
            )}
          </ScrollRevealGroup>

          <div className="border-t border-[#E2E5EA]" />

          {/* Row B: Four Labelled Facts Once Per Page */}
          <ScrollReveal delay={0.1}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#4B5563]">
                Protection
              </dt>
              <dd className="text-[15px] font-semibold text-[#0B0B0C] mt-0.5">
                Escrow-protected
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#4B5563]">
                Fee
              </dt>
              <dd className="text-[15px] font-semibold text-[#0B0B0C] mt-0.5 tabular-nums">
                {CLIENT_FEE_PERCENT}% per side ({TOTAL_PLATFORM_FEE_PERCENT}% total)
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#4B5563]">
                Review window
              </dt>
              <dd className="text-[15px] font-semibold text-[#0B0B0C] mt-0.5">
                7-day review window
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#4B5563]">
                Network
              </dt>
              <dd className="text-[15px] font-semibold text-[#0B0B0C] mt-0.5 tabular-nums">
                Polygon Mainnet (Chain {POLYGON_CHAIN_ID})
              </dd>
            </div>
          </dl>
          </ScrollReveal>

          {/* Footnote with verified contract link built from config */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#4B5563]">
            <span>Verified JobFactory contract:</span>
            <a
              href={`${POLYGONSCAN_BASE_URL}/address/${MAINNET_CONTRACTS.jobFactory}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[12px] font-medium text-[#0047AB] hover:underline break-all"
            >
              <span>{MAINNET_CONTRACTS.jobFactory}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};

export default LiveProofStrip;
