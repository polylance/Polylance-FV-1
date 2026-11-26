import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';
import { ScrollReveal, ScrollRevealGroup, SpotlightCard } from '../common/MotionPrimitives';
import { PolygonIcon } from '../TokenIcon';
import { Job } from '../../types';
import { isRealPublicJob, sanitizeText } from '../../config/testDataFilter';

interface OpenJobsPreviewProps {
  jobs?: Job[];
}

export const OpenJobsPreview: React.FC<OpenJobsPreviewProps> = ({ jobs = [] }) => {
  const openJobs = (jobs || [])
    .filter((j) => isRealPublicJob(j) && (j.status === 'Open' || !j.status))
    .slice(0, 6);

  if (openJobs.length < 3) {
    return null;
  }

  return (
    <section className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-16 sm:py-20">
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="font-mono text-[11.5px] font-semibold uppercase tracking-wider text-[#0047AB]">
                Live Marketplace
              </div>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Active freelance opportunities.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563]">
                Real open briefs protected by milestone smart contracts on Polygon.
              </p>
            </div>

            <Button
              as="Link"
              to="/jobs"
              variant="secondary"
              size="md"
              trailingIcon={<ArrowRight size={15} />}
            >
              View all open jobs
            </Button>
          </div>

          <ScrollRevealGroup staggerSec={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {openJobs.map((job) => {
              const tokenSymbol = job.paymentTokenSymbol || (job.amountUsdc ? 'USDC' : 'POL');
              const amountDisplay = job.amountUsdc || job.amountEth || '0';
              const skills = job.skillsRequired || [];
              const isFunded = job.status === 'Funded';
              const cleanTitle = sanitizeText(job.title);
              const cleanDescription = sanitizeText(job.description);

              return (
                <SpotlightCard key={job.id} className="h-full">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="p-5 flex flex-col justify-between group h-full select-none"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
                          {job.category || 'Engineering'}
                        </span>
                        {isFunded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0047AB] bg-[#EAF1FB] px-2 py-0.5 rounded border border-[#C9DAF2]">
                            <ShieldCheck size={12} />
                            <span>Escrow Funded</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono font-semibold text-[#4B5563] bg-[#F6F7F9] px-2 py-0.5 rounded">
                            Open Brief
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors line-clamp-2 leading-snug">
                        {cleanTitle}
                      </h3>

                      <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                        {cleanDescription || 'Deliver project milestones securely through Polygon smart contract escrow.'}
                      </p>

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[10px] font-mono font-medium text-[#4B5563] bg-[#F6F7F9] border border-[#E5E7EB] px-1.5 py-0.5 rounded"
                            >
                              {sanitizeText(skill)}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-[#0B0B0F] flex items-center gap-1.5 tabular-nums">
                        {tokenSymbol === 'POL' && <PolygonIcon size={12} className="text-[#0047AB]" />}
                        <span>{amountDisplay}</span>
                        <span className="text-[#6B7280] font-medium">{tokenSymbol}</span>
                      </div>

                      <span className="text-xs font-semibold text-[#0047AB] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        <span>Inspect brief</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </SpotlightCard>
              );
            })}
          </ScrollRevealGroup>
        </div>
      </PageContainer>
    </section>
  );
};
