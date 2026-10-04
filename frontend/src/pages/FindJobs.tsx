import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, isDemoOrMockJob } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { Search, Filter, Briefcase, ArrowRight, ShieldCheck, Award, CheckCircle2, Globe, Clock } from 'lucide-react';
import { SUPPORTED_FIAT, convertCryptoToFiat, useLiveCurrencyRates } from '../utils/currency';
import { truncateAddress, formatTimeAgo } from '../utils/formatters';
import { getJobInactivityStatus } from '../utils/inactivity';
import { staggerContainer, staggerItem, scrollReveal, transition } from '../lib/motion';
import { NoSearchResultState } from '../components/UIStates';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { TokenIcon } from '../components/TokenIcon';

export const FindJobs: React.FC = () => {
  const { currentRole } = useWeb3();
  const { jobs } = usePolyLanceData();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiat, setSelectedFiat] = useState('INR');
  useLiveCurrencyRates();

  const fiatSelectOptions = useMemo<SelectOption<string>[]>(() => {
    return SUPPORTED_FIAT.map((fiat) => ({
      value: fiat.code,
      label: `${fiat.code} (${fiat.symbol})`,
      sublabel: fiat.name,
      flag: fiat.flag,
    }));
  }, []);

  const isClientRole = currentRole === 'client';

  const categories: { id: SkillCategory | 'all'; label: string; sub: string }[] = [
    { id: 'all', label: 'All Jobs', sub: 'Everything' },
    { id: 'web3', label: 'Web3 / Smart Contracts', sub: 'Solidity, Vyper, Cairo' },
    { id: 'frontend', label: 'Frontend UI', sub: 'TypeScript, React, Vue, CSS' },
    { id: 'backend', label: 'Backend Indexers', sub: 'Rust, Go, Python, Java' },
    { id: 'mobile', label: 'Mobile Apps', sub: 'Swift, Kotlin, Dart' },
  ];

  // Only active Open jobs with NO freelancer selected, not expired (> 14 days), and not fake/demo are listed on marketplace.
  const filteredJobs = jobs.filter((job) => {
    const statusInfo = getJobInactivityStatus(job);
    const isOpen = job.status === 'Open' && !job.freelancer && !statusInfo.isExpired && !isDemoOrMockJob(job);
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isOpen && matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      {...scrollReveal}
      className="space-y-8 py-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E6EC] pb-4 sm:pb-6 text-left">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#0B0B0C]">
              Find Verifiable Escrow Jobs
            </h1>
            <span className="text-[10px] sm:text-xs bg-[#E7EEF9] text-[#0047AB] border border-[#D0E0F7] px-2.5 py-0.5 rounded-[4px] font-mono font-bold shrink-0 whitespace-nowrap">
              CREDENTIAL-FIRST MARKETPLACE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] font-normal">
            Browse active jobs with smart contract escrow deposits. Earn Soulbound reputation tokens upon completion.
          </p>
        </div>

        {/* Post a Job Button for Clients, Judges, and Admins only */}
        {(currentRole === 'client' || currentRole === 'judge' || currentRole === 'admin') && (
          <Link
            to="/jobs/post"
            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors self-start md:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            <Briefcase size={14} />
            <span>Post a Job</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3 text-left">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <label className="relative flex-1 flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E6EC] focus-within:border-[#0047AB] rounded-[8px] px-3 py-2.5 transition-colors cursor-text">
            <Search size={15} className="shrink-0 text-[#8892A0] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. Solidity, Circom, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[#0B0B0C] placeholder:text-[#8892A0] text-xs outline-none"
            />
          </label>

          {/* Global Currency Conversion Dropdown for Freelancers */}
          <div className="flex items-center gap-1.5 shrink-0 min-w-[140px]">
            <PolyLanceSelect
              value={selectedFiat}
              onChange={(val) => setSelectedFiat(val)}
              options={fiatSelectOptions}
              variant="glass"
              className="w-full"
            />
          </div>
        </div>

        {/* Category Filter Pills (Section 10 Spec) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-[8px] text-xs transition-colors text-left cursor-pointer shrink-0 border ${isSelected
                    ? 'bg-[#E7EEF9] border-[#0047AB] text-[#0047AB] font-semibold'
                    : 'bg-[#FFFFFF] border-[#E2E6EC] text-[#4B5563] hover:text-[#0B0B0C] hover:border-[#8892A0]'
                  }`}
              >
                <div className="font-semibold text-[11px] sm:text-xs">{cat.label}</div>
                <div className="text-[9px] sm:text-[10px] text-[#8892A0] font-mono">{cat.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CREDENTIAL-FIRST JOB CARDS GRID */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        {filteredJobs.length === 0 ? (
          <div className="col-span-2 py-6">
            <NoSearchResultState
              title={searchQuery ? 'No matching jobs found' : 'No jobs in this category'}
              description={searchQuery ? `We couldn't find any opportunities matching "${searchQuery}". Try a different keyword or clear your filters.` : 'No active escrow jobs in this skill category right now. Check back soon or browse other categories.'}
              onClear={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          filteredJobs.map((job) => {
            const sym = (job.paymentTokenSymbol || 'USDC').toUpperCase();
            const isCrypto = sym === 'POL' || sym === 'MATIC';
            const payToken = isCrypto ? 'POL' : sym;
            const payAmountNum = parseFloat(isCrypto ? (job.amountEth || job.amountUsdc || '0') : (job.amountUsdc || '0')) || 0;
            const usdAmountNum = parseFloat(job.amountUsdc || '0') || 0;
            const dec = isCrypto ? 4 : 2;
            const converted = convertCryptoToFiat(payAmountNum, payToken, selectedFiat);
            const netToken = payAmountNum * 0.975;
            const netUsd = usdAmountNum * 0.975;
            return (
              <motion.div
                key={job.id}
                variants={staggerItem}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="bg-[#FFFFFF] p-5 sm:p-6 border border-[#E2E6EC] hover:border-[#0047AB] rounded-[10px] flex flex-col justify-between space-y-3 group transition-colors shadow-[0_1px_2px_rgba(11,11,12,0.06)] cursor-pointer text-left"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#4B5563] bg-[#F4F6F9] px-2 py-0.5 rounded-[4px] border border-[#E2E6EC]">
                      {job.category}
                    </span>
                    <span className={`badge-status badge-${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base sm:text-lg font-semibold text-[#0B0B0C] group-hover:text-[#0047AB] transition-colors line-clamp-1"
                    >
                      {job.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] line-clamp-2 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Credential First Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="bg-[#E3F3EA] text-[#1E8449] border border-[#B7E2CB] px-2 py-0.5 rounded-[4px] font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified Client
                    </span>
                    <span className="bg-[#F4F6F9] text-[#4B5563] border border-[#E2E6EC] px-2 py-0.5 rounded-[4px] font-medium flex items-center gap-1">
                      <Clock size={10} className="text-[#0047AB]" /> Posted {formatTimeAgo(job.createdAt || Date.now())}
                    </span>
                    {getJobInactivityStatus(job).isReminderActive && (
                      <span className="bg-[#FDF3DC] text-[#C2610C] border border-[#F6D896] px-2 py-0.5 rounded-[4px] font-medium flex items-center gap-1">
                        ⚠️ Inactive • Closes in {getJobInactivityStatus(job).daysRemaining}d
                      </span>
                    )}
                    <span className="bg-[#F4F6F9] text-[#4B5563] border border-[#E2E6EC] px-2 py-0.5 rounded-[4px] font-medium flex items-center gap-1">
                      <Award size={11} className="text-[#0047AB]" /> Req Score &gt; 700
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E6EC] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] uppercase font-mono text-[#8892A0] font-semibold block">Budget / Escrow</span>
                    <div className="font-mono font-bold text-sm text-[#0B0B0C] flex items-center flex-wrap gap-1.5">
                      <TokenIcon token={payToken} size={15} />
                      <span>{payAmountNum.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                      <span className="text-xs font-normal text-[#4B5563]">{payToken}</span>
                      {isCrypto && (
                        <span className="text-[10px] font-normal text-[#8892A0]">
                          (≈ ${usdAmountNum.toFixed(2)} USDC)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#0047AB] font-semibold font-mono block truncate pt-0.5">
                      {isCrypto
                        ? `Net: ${netToken.toFixed(dec)} ${payToken} (~$${netUsd.toFixed(2)} USDC, 2.5% fee)`
                        : `Net: $${netUsd.toFixed(2)} USDC (2.5% fee)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[9.5px] uppercase font-mono text-[#8892A0] font-semibold block">Applicants</span>
                      <span className="font-mono text-[#0B0B0C] font-semibold text-xs">{job.applications.length} submitted</span>
                    </div>

                    <div
                      className="w-8 h-8 rounded-[6px] bg-[#F4F6F9] border border-[#E2E6EC] group-hover:bg-[#0047AB] group-hover:border-[#0047AB] text-[#0B0B0C] group-hover:text-white transition-colors flex items-center justify-center shrink-0"
                    >
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
};
