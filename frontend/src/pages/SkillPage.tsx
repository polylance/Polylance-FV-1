import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Code, ArrowRight, Briefcase } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { buildSkillSeo } from '../seo';
import { usePolyLanceData } from '../context/PolyLanceDataContext';

export const SkillPage: React.FC = () => {
  const { skill } = useParams<{ skill: string }>();
  const skillSlug = skill ? skill.toLowerCase() : '';
  const skillName = skillSlug.replace(/-/g, ' ');

  const { jobs } = usePolyLanceData();

  const matchingJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      if (j.status === 'Cancelled' || (j.status as string) === 'Draft') return false;
      const inTitle = j.title?.toLowerCase().includes(skillName);
      const inDesc = j.description?.toLowerCase().includes(skillName);
      const skillsList = j.skillsRequired || (j as any).skills || [];
      const inSkills = skillsList.some((s: string) => s.toLowerCase().includes(skillName));
      return inTitle || inDesc || inSkills;
    });
  }, [jobs, skillName]);

  const skillSeoConfig = useMemo(() => {
    return buildSkillSeo(skillSlug, skillName, matchingJobs.length);
  }, [skillSlug, skillName, matchingJobs.length]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo customConfig={skillSeoConfig} />

      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide uppercase">
            <Code size={14} />
            <span>SKILL DIRECTORY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight capitalize">
            {skillName} Freelance Jobs & Developers
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            Discover verified freelance gigs requiring {skillName} expertise. Work with smart contract escrow on Polygon PoS and receive payments in USDC or POL.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[#0B0B0C]">
            Available Gigs for {skillName} ({matchingJobs.length})
          </h2>
          <Link
            to="/find-jobs"
            className="text-xs font-bold text-[#0047AB] hover:underline inline-flex items-center gap-1"
          >
            <span>View All Jobs</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {matchingJobs.length > 0 ? (
          <div className="space-y-4">
            {matchingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-[#E2E6EC] hover:border-[#CBD5E1] p-6 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {job.status || 'Open'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {job.paymentTokenSymbol || 'USDC'} Escrow
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0B0B0C] hover:text-[#0047AB]">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Budget</span>
                    <span className="text-base font-extrabold text-[#0047AB]">
                      {job.amountUsdc ? `$${job.amountUsdc} USDC` : `${job.amountEth || '0'} POL`}
                    </span>
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="px-4 py-2 rounded-xl bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    View & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E6EC]">
            <Briefcase className="mx-auto text-slate-400 mb-3" size={32} />
            <h3 className="text-base font-bold text-[#0B0B0C]">No jobs currently active for {skillName}</h3>
            <p className="text-sm text-slate-500 mt-1">
              This page is marked noindex until at least 3 active listings are published.
            </p>
            <div className="mt-4">
              <Link
                to="/find-jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0047AB] text-white text-xs font-bold"
              >
                <span>Browse All Jobs</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SkillPage;
