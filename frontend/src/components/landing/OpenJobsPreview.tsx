import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, ShieldCheck, Tag, PlusCircle } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';
import { PolygonIcon } from '../TokenIcon';
import { Job } from '../../types';
import { isRealPublicJob, sanitizeText } from '../../config/testDataFilter';

interface OpenJobsPreviewProps {
  jobs?: Job[];
}

export const OpenJobsPreview: React.FC<OpenJobsPreviewProps> = ({ jobs = [] }) => {
  // Filter for real, non-test open jobs
  const openJobs = (jobs || [])
    .filter((j) => isRealPublicJob(j) && (j.status === 'Open' || !j.status))
    .slice(0, 6);

  if (openJobs.length === 0) {
    return (
      <section className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-14 sm:py-18">
        <PageContainer noVerticalPadding>
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#0047AB] shadow-2xs">
              <Briefcase size={22} />
            </div>
            <h3 className="text-xl font-bold text-[#0B0B0F]">
              Be the first to post a project
            </h3>
            <p className="text-sm text-[#4B5563] max-w-md mx-auto">
              There are currently no open listings awaiting proposals. Post a new project or explore completed verified credentials.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button as="Link" to="/jobs/post" variant="primary" size="md" leadingIcon={<PlusCircle size={15} />}>
                Post a job
              </Button>
              <Button as="Link" to="/jobs" variant="secondary" size="md">
                Browse all jobs
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-16 sm:py-20">
      <PageContainer noVerticalPadding>
        <div className="space-y-10 text-left">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-eyebrow text-[#0047AB]">Live Marketplace</div>
              <h2 className="text-landing-h2 text-[#0B0B0F]">
                Active freelance opportunities.
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563]">
                Real open projects with milestone escrow protection on Polygon.
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

          {/* Jobs Grid (Up to 6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {openJobs.map((job) => {
              const tokenSymbol = job.paymentTokenSymbol || (job.amountUsdc ? 'USDC' : 'POL');
              const amountDisplay = job.amountUsdc || job.amountEth || '0';
              const skills = job.skillsRequired || [];
              const isFunded = job.status === 'Funded';
              const cleanTitle = sanitizeText(job.title);
              const cleanDescription = sanitizeText(job.description);

              return (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-2xs hover:border-[#0047AB] hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full select-none"
                >
                  <div className="space-y-3">
                    {/* Category & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F3F4F6] text-[#4B5563]">
                        {job.category || 'Engineering'}
                      </span>
                      {isFunded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0047AB] bg-[#EAF1FB] px-2 py-0.5 rounded-[4px]">
                          <ShieldCheck size={12} />
                          <span>Escrow Funded</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-[4px]">
                          Open
                        </span>
                      )}
                    </div>

                    {/* Job Title */}
                    <h3 className="text-base font-bold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors line-clamp-2 leading-snug">
                      {cleanTitle}
                    </h3>

                    {/* Description snippet */}
                    <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                      {cleanDescription || 'Deliver project milestones securely through Polygon smart contract escrow.'}
                    </p>

                    {/* Skills pills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.slice(0, 3).map((skill: string) => (
                          <span
                            key={skill}
                            className="text-[10px] font-medium text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] px-1.5 py-0.5 rounded"
                          >
                            {sanitizeText(skill)}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="text-[10px] text-[#6B7280]">
                            +{skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Budget & Link bottom */}
                  <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                    <div className="text-xs font-bold text-[#0B0B0F] flex items-center gap-1">
                      {tokenSymbol === 'POL' && <PolygonIcon size={12} className="text-[#0047AB]" />}
                      <span>{amountDisplay}</span>
                      <span className="text-[#6B7280] font-medium">{tokenSymbol}</span>
                    </div>

                    <span className="text-xs font-semibold text-[#0047AB] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      <span>View details</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </PageContainer>
    </section>
  );
};
