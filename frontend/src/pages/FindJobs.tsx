import React, { useState } from 'react';
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

export const FindJobs: React.FC = () => {
  const { currentRole } = useWeb3();
  const { jobs } = usePolyLanceData();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiat, setSelectedFiat] = useState('INR');
  useLiveCurrencyRates();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Find Verifiable Escrow Jobs
            </h1>
            <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0 whitespace-nowrap">
              CREDENTIAL-FIRST MARKETPLACE
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Browse active jobs with smart contract escrow deposits. Earn soulbound reputation tokens upon completion.
          </p>
        </div>

        {/* Post a Job Button for Clients, Judges, and Admins only */}
        {(currentRole === 'client' || currentRole === 'judge' || currentRole === 'admin') && (
          <Link
            to="/jobs/post"
            className="gradient-btn-primary px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow self-start md:self-auto shrink-0"
          >
            <Briefcase size={14} />
            <span>Post a Job</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. Solidity, Circom, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input !pl-9 !py-2 text-xs"
            />
          </div>

          {/* Global Currency Conversion Dropdown for Freelancers */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs shrink-0">
            <div className="flex items-center gap-1.5">
              <Globe size={13} className="text-purple-600 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Pay:</span>
            </div>
            <select
              value={selectedFiat}
              onChange={(e) => setSelectedFiat(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 font-sans outline-none focus:ring-0 cursor-pointer"
            >
              {SUPPORTED_FIAT.map((fiat) => (
                <option key={fiat.code} value={fiat.code}>
                  {fiat.flag} {fiat.code} ({fiat.symbol})
                </option>
              ))}
            </select>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap transition-all text-left cursor-pointer shrink-0 ${isSelected
                    ? 'bg-purple-100 border-purple-300 text-purple-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
              >
                <div className="font-bold text-[11px] sm:text-xs">{cat.label}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">{cat.sub}</div>
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
            const payToken = job.paymentTokenSymbol || 'USDC';
            const payAmount = job.amountUsdc;
            const converted = convertCryptoToFiat(parseFloat(payAmount), payToken, selectedFiat);
            return (
              <motion.div
                key={job.id}
                variants={staggerItem}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="glass-panel p-4 sm:p-5 border-slate-200 hover:border-purple-300 bg-white flex flex-col justify-between space-y-3 group transition-all hard-shadow cursor-pointer premium-card overflow-hidden"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {job.category}
                    </span>
                    <span className={`badge-status badge-${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 font-heading transition-colors line-clamp-1"
                    >
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Credential First Badges matching reference HTML */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 font-mono text-[10px] sm:text-[11px]">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified Client
                    </span>
                    <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Clock size={10} className="text-purple-600" /> Posted {formatTimeAgo(job.createdAt || Date.now())}
                    </span>
                    {getJobInactivityStatus(job).isReminderActive && (
                      <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                        ⚠️ Inactive • Closes in {getJobInactivityStatus(job).daysRemaining}d
                      </span>
                    )}
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Award size={11} className="text-purple-700" /> Req Score &gt; 700
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] uppercase font-mono text-slate-400 font-bold block">Budget / Escrow</span>
                    <div className="font-mono font-extrabold text-sm text-emerald-700">
                      {parseFloat(payAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                      <span className="text-xs font-normal text-slate-500">{payToken}</span>
                    </div>
                    <span className="text-[9.5px] text-purple-700 font-bold font-mono block truncate">
                      Net: ${(parseFloat(payAmount) * 0.975).toFixed(2)} USDC (2.5% fee)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[9.5px] uppercase font-mono text-slate-400 font-bold block">Applicants</span>
                      <span className="font-mono text-slate-700 font-bold text-xs">{job.applications.length} submitted</span>
                    </div>

                    <div
                      className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white transition-all shadow-2xs flex items-center justify-center shrink-0"
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
