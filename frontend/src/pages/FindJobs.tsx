import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { SkillCategory } from '../types';
import { Search, Filter, Briefcase, ArrowRight, ShieldCheck, Award, CheckCircle2, Globe } from 'lucide-react';
import { SUPPORTED_FIAT, convertCryptoToFiat } from '../utils/currency';
import { staggerContainer, staggerItem, scrollReveal, transition } from '../lib/motion';
import { NoSearchResultState } from '../components/UIStates';

export const FindJobs: React.FC = () => {
  const { currentRole } = useWeb3();
  const { jobs } = usePolyLanceData();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiat, setSelectedFiat] = useState('INR');

  const isClientRole = currentRole === 'client';

  const categories: { id: SkillCategory | 'all'; label: string; sub: string }[] = [
    { id: 'all', label: 'All Jobs', sub: 'Everything' },
    { id: 'web3', label: 'Web3 / Smart Contracts', sub: 'Solidity, Vyper, Cairo' },
    { id: 'frontend', label: 'Frontend UI', sub: 'TypeScript, React, Vue, CSS' },
    { id: 'backend', label: 'Backend Indexers', sub: 'Rust, Go, Python, Java' },
    { id: 'mobile', label: 'Mobile Apps', sub: 'Swift, Kotlin, Dart' },
  ];

  const filteredJobs = jobs.filter((job) => {
    const isNotCompleted = job.status !== 'Completed' && job.status !== 'Cancelled';
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotCompleted && matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      {...scrollReveal}
      className="space-y-8 py-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
              Find Verifiable Escrow Jobs
            </h1>
            <span className="text-xs bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              CREDENTIAL-FIRST MARKETPLACE
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Browse active jobs with smart contract escrow deposits. Earn soulbound reputation tokens upon completion.
          </p>
        </div>

        {/* Post a Job Button for all users */}
        <Link
          to="/jobs/post"
          className="gradient-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow self-start md:self-auto"
        >
          <Briefcase size={15} />
          Post a Job
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. Solidity, Circom, Go indexer, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input !pl-10 text-xs"
            />
          </div>

          {/* Global Currency Conversion Dropdown for Freelancers */}
          <div className="flex items-center gap-2 bg-white/70 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Globe size={14} className="text-purple-600 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Freelancer Pay:</span>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border whitespace-nowrap transition-all text-left cursor-pointer ${isSelected
                    ? 'bg-purple-100 border-purple-300 text-purple-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
              >
                <div className="font-bold">{cat.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{cat.sub}</div>
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
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
                className="glass-panel p-6 border-slate-200 hover:border-purple-300 bg-white flex flex-col justify-between space-y-4 group transition-all hard-shadow cursor-pointer premium-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                      {job.category}
                    </span>
                    <span className={`badge-status badge-${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-lg font-bold text-slate-900 group-hover:text-purple-700 font-heading transition-colors line-clamp-1"
                    >
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Credential First Badges matching reference HTML */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified Client
                    </span>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Award size={12} className="text-purple-700" /> Req Score &gt; 700
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Budget / Escrow</span>
                    <div className="font-mono text-slate-800 font-extrabold text-sm flex flex-col">
                      <span className="text-emerald-700">
                        {parseFloat(payAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-xs font-normal text-slate-500">{payToken}</span>
                      </span>
                      <span className="text-[10px] text-purple-700 font-bold font-sans mt-0.5 whitespace-nowrap block">
                        Net: ${(parseFloat(payAmount) * 0.975).toFixed(2)} USDC (after 2.5% fee)
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Applicants</span>
                    <span className="font-mono text-slate-700 font-bold">{job.applications.length} submitted</span>
                  </div>

                  <div
                    className="p-2.5 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-900 group-hover:text-white transition-all shadow-xs"
                  >
                    <ArrowRight size={16} />
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
