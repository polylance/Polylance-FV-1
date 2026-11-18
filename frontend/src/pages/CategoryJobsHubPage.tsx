import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, ArrowRight, ShieldCheck, Coins, ExternalLink } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { Amount } from '../components/common/Amount';

export interface CategoryJobsHubProps {
  routeKey?: string;
  badge?: string;
  heading?: string;
  intro?: string;
  filterTag?: string;
}

const HUB_CONFIGS: Record<string, { badge: string; heading: string; intro: string; filterTag?: string }> = {
  '/web3-jobs': {
    badge: 'WEB3 FREELANCE CONTRACTS',
    heading: 'Web3 Freelance Jobs & Smart Contracts',
    intro: 'Browse verified blockchain, DeFi, tokenomics, and smart contract development opportunities with milestone escrow on Polygon.',
    filterTag: 'web3',
  },
  '/polygon-jobs': {
    badge: 'POLYGON ECOSYSTEM GIGS',
    heading: 'Polygon Freelance Jobs & DApp Engineering',
    intro: 'Work on ultra low-fee, high-throughput Polygon PoS applications. Get paid directly in native POL and verified Polygon USDC.',
    filterTag: 'polygon',
  },
  '/solidity-developer-jobs': {
    badge: 'SOLIDITY & EVM DEVELOPMENT',
    heading: 'Solidity Developer Freelance Jobs',
    intro: 'Discover freelance contracts for Solidity smart contracts, DeFi vaults, token bridges, and security audits backed by milestone escrow.',
    filterTag: 'solidity',
  },
  '/smart-contract-developer-jobs': {
    badge: 'SMART CONTRACT ARCHITECTURE',
    heading: 'Smart Contract Developer Jobs',
    intro: 'Build mission-critical smart contracts across EVM protocols. Milestone payments held in non-custodial smart escrow.',
    filterTag: 'smart contract',
  },
  '/dapp-developer-jobs': {
    badge: 'FULL-STACK DAPP ENGINEERING',
    heading: 'DApp Developer Freelance Jobs',
    intro: 'Build modern decentralized web applications with React, viem, wagmi, and Polygon smart contracts. Instant crypto payouts upon approval.',
    filterTag: 'dapp',
  },
};

export const CategoryJobsHubPage: React.FC<CategoryJobsHubProps> = ({
  routeKey: explicitRouteKey,
  badge: explicitBadge,
  heading: explicitHeading,
  intro: explicitIntro,
  filterTag: explicitFilterTag,
}) => {
  const location = useLocation();
  const currentPath = explicitRouteKey || location.pathname;
  const config = HUB_CONFIGS[currentPath] || {
    badge: 'FREELANCE CONTRACTS',
    heading: 'Web3 Freelance Opportunities',
    intro: 'Explore active on-chain freelance contracts with non-custodial smart contract escrow on Polygon.',
    filterTag: '',
  };

  const routeKey = currentPath;
  const badge = explicitBadge || config.badge;
  const heading = explicitHeading || config.heading;
  const intro = explicitIntro || config.intro;
  const filterTag = explicitFilterTag !== undefined ? explicitFilterTag : config.filterTag;

  const { jobs } = usePolyLanceData();

  const matchingJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      if (j.status === 'Cancelled' || (j.status as string) === 'Draft') return false;
      if (!filterTag) return true;
      const tagLower = filterTag.toLowerCase();
      const inTitle = j.title?.toLowerCase().includes(tagLower);
      const inDesc = j.description?.toLowerCase().includes(tagLower);
      const skillsList = j.skillsRequired || (j as any).skills || [];
      const inSkills = skillsList.some((s: string) => s.toLowerCase().includes(tagLower));
      return inTitle || inDesc || inSkills;
    });
  }, [jobs, filterTag]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B0B0C] flex flex-col">
      <Seo routeKey={routeKey} />

      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E6EC] py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EEF9] text-[#0047AB] text-xs font-bold tracking-wide">
            <Briefcase size={14} />
            <span>{badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B0B0C] tracking-tight">
            {heading}
          </h1>
          <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        </div>
      </header>

      {/* Jobs Listing Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[#0B0B0C]">
            Available Gigs ({matchingJobs.length})
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
            <h3 className="text-base font-bold text-[#0B0B0C]">No jobs matching this filter currently</h3>
            <p className="text-sm text-slate-500 mt-1">
              Check back soon or explore the complete jobs catalog.
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

export default CategoryJobsHubPage;
