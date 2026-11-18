import React from 'react';
import { PageContainer } from '../layout/PageContainer';
import { Reveal } from '../common/MotionPrimitives';
import { DOMAINS } from '../../utils/domainMapping';
import { CategoryCard } from './CategoryCard';
import { useDomainJobCounts } from '../../hooks/useDomainJobCounts';

export const CategoriesSection: React.FC = () => {
  const { counts, totalOpenJobs, isLoading, isError, refetch } = useDomainJobCounts();

  return (
    <section className="w-full bg-white py-[clamp(56px,7vw,96px)] border-b border-[#E5E7EB]">
      <PageContainer>
        <div className="space-y-12">
          {/* Section Header with 80ms sequential reveal */}
          <div className="max-w-2xl space-y-3 text-left">
            <Reveal delay={0} riseDistance={16}>
              <div className="text-eyebrow">Categories</div>
            </Reveal>
            <Reveal delay={80} riseDistance={16}>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Browse projects by domain.
              </h2>
            </Reveal>
            <Reveal delay={160} riseDistance={16}>
              <p className="text-lead">
                Explore open contract roles across Web3 architecture, frontend interfaces, backend systems, and mobile applications.
              </p>
            </Reveal>

            {/* Slim summary line under paragraph (hidden while loading) */}
            {!isLoading && (
              <Reveal delay={200} riseDistance={8}>
                <div className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider flex items-center gap-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>
                    {totalOpenJobs} open {totalOpenJobs === 1 ? 'job' : 'jobs'} across 4 domains
                  </span>
                </div>
              </Reveal>
            )}
          </div>

          {/* 4 Category Tiles (Stagger in: fade + 24px rise, 100ms stagger) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
            {DOMAINS.map((domain, idx) => (
              <Reveal
                key={domain.id}
                delay={240 + idx * 100}
                riseDistance={24}
                scaleFrom={0.98}
                className="h-full flex flex-col"
              >
                <CategoryCard
                  domain={domain}
                  count={counts[domain.id]}
                  isLoading={isLoading}
                  isError={isError}
                  onRetry={refetch}
                  staggerIndex={idx}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
};

export default CategoriesSection;
