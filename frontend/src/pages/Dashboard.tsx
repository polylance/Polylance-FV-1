import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { truncateAddress, formatTimeAgo } from '../utils/formatters';
import { scoreGithubUser, getUserBytecodeMatrix } from '../utils/githubOracle';
import { calculateReputationScores, getReputationTier } from '../utils/reputation';
import { getJobInactivityStatus } from '../utils/inactivity';
import { Briefcase, Send, PlusCircle, ArrowUpRight, Award, Search, Lock, TrendingUp, ShieldCheck, CheckCircle2, FileText, MessageSquare, Clock, AlertTriangle, Trash2, RefreshCw, Wallet, Sparkles, ArrowRight, DollarSign } from 'lucide-react';
import { staggerContainer, staggerItem, scrollReveal } from '../lib/motion';
import { EmptyState } from '../components/UIStates';
import { InsufficientFundsModal } from '../components/InsufficientFundsModal';
import { GithubEkycCard } from '../components/GithubEkycCard';

export const Dashboard: React.FC = () => {
  const { address, currentRole, isArbitrator, balanceNative, balanceUsdc, refreshBalances } = useWeb3();
  const { jobs, profiles, updateProfile, deleteJob, renewJob } = usePolyLanceData();
  const navigate = useNavigate();

  const activeAddress = address;
  const isClientRole = currentRole === 'client';
  const [activeHubTab, setActiveHubTab] = React.useState<'contracts' | 'applications' | 'posted' | 'explore'>('contracts');
  const [isRefreshingBalances, setIsRefreshingBalances] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);

  const lastOpenedJobId = typeof window !== 'undefined' ? localStorage.getItem('polylance_last_opened_job') : null;
  const lastOpenedJob = lastOpenedJobId ? jobs.find(j => j.id === lastOpenedJobId || j.contractAddress?.toLowerCase() === lastOpenedJobId.toLowerCase()) : null;

  const handleRefreshBalances = async () => {
    setIsRefreshingBalances(true);
    await refreshBalances();
    setTimeout(() => setIsRefreshingBalances(false), 500);
  };

  const userProfileKey = activeAddress ? Object.keys(profiles).find(k => k.toLowerCase() === activeAddress.toLowerCase()) : null;
  const userProfile = ((userProfileKey ? profiles[userProfileKey] : null) || {
    displayName: activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Anonymous User',
    bio: 'No biography has been written yet.',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    skills: [],
    reputationSbtCount: 0,
  }) as UserProfile;

  const judgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase();
  const userScores = calculateReputationScores(
    activeAddress || '',
    jobs,
    userProfile,
    userProfile.reputationSbtCount || 0,
    Boolean(isArbitrator || currentRole === 'judge'),
    judgeAddr
  );

  const tierInfo = getReputationTier(userScores.totalPoints);

  const rawDisplayName = userProfile.displayName && userProfile.displayName !== 'Anonymous User' && userProfile.displayName !== 'Anonymous PolyLancer'
    ? userProfile.displayName
    : userProfile.githubUsername
      ? `@${userProfile.githubUsername}`
      : activeAddress
        ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
        : 'Anonymous User';

  // Real-time GitHub sync on dashboard mount if verified
  useEffect(() => {
    if (userProfile.githubVerified && userProfile.githubUsername) {
      if (userProfile.primaryScore && userProfile.primaryScore > 0) {
        return;
      }
      scoreGithubUser(userProfile.githubUsername, activeAddress)
        .then((res) => {
          if (res && typeof res.primaryScore === 'number') {
            updateProfile({
              primaryScore: res.primaryScore,
              secondaryScores: res.secondaryScores,
              languageBytes: res.languageBytes || {},
              verifiedAt: res.verifiedAt,
            }, activeAddress);
          }
        })
        .catch((err) => console.warn('Real-time background GitHub sync failed on dashboard:', err));
    }
  }, [activeAddress, userProfile.githubUsername, userProfile.githubVerified, userProfile.primaryScore]);

  const myClientJobs = jobs.filter((j) => Boolean(j.client && activeAddress && j.client.toLowerCase() === activeAddress.toLowerCase()));
  const myFreelancerJobs = jobs.filter((j) => Boolean(j.freelancer && activeAddress && j.freelancer.toLowerCase() === activeAddress.toLowerCase()));

  // Ongoing client projects: Selected, Funded, Submitted, Disputed
  const ongoingClientJobs = myClientJobs.filter((j) => ['Selected', 'Funded', 'Submitted', 'Disputed'].includes(j.status));
  // Platform ongoing jobs fallback (shows platform escrows if wallet has not created ongoing jobs yet)
  const platformOngoingJobs = jobs.filter((j) => ['Selected', 'Funded', 'Submitted', 'Disputed'].includes(j.status));
  const effectiveOngoingJobs = ongoingClientJobs.length > 0 ? ongoingClientJobs : platformOngoingJobs;

  // Collect all applications sent by this address across all jobs
  const myApplications = jobs.flatMap((j) =>
    j.applications
      .filter((app) => app.applicant.toLowerCase() === activeAddress.toLowerCase())
      .map((app) => ({ ...app, job: j }))
  );

  const completedFreelanceJobs = myFreelancerJobs.filter((j) => j.status === 'Completed');
  const totalEarnedUsdc = completedFreelanceJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    const gross = parseFloat(j.amountUsdc || '0') * earnedFraction;
    const net = gross * 0.975; // 0% commission, 2.5% platform maintenance fee
    return sum + net;
  }, 0);

  const bytecodeMatrix = getUserBytecodeMatrix(userProfile, completedFreelanceJobs.length, totalEarnedUsdc);

  const clientTotalEscrow = myClientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const completedClientJobs = myClientJobs.filter((j) => j.status === 'Completed');
  const clientTotalSpent = completedClientJobs.reduce((sum, j) => {
    const paidFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * paidFraction);
  }, 0);
  const clientPendingReviewJobs = myClientJobs.filter((j) => j.status === 'Submitted');

  // Dynamic ranking calculation matching the official PolyLance Reputation System
  const sortedProfiles = Object.values(profiles)
    .map((p) => {
      const profileCompletedJobs = jobs.filter(
        (j) => j.freelancer?.toLowerCase() === p.address.toLowerCase() && j.status === 'Completed'
      );
      const volume = profileCompletedJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
      const repSbt = Math.max(p.reputationSbtCount || 0, profileCompletedJobs.length);
      const pts = (repSbt * 100) + Math.floor(volume / 25) + (p.githubVerified ? 50 : 0);
      return { address: p.address, points: pts };
    })
    .sort((a, b) => b.points - a.points);

  const myRankIdx = sortedProfiles.findIndex((p) => p.address.toLowerCase() === activeAddress.toLowerCase());
  const myRank = myRankIdx !== -1 ? myRankIdx + 1 : sortedProfiles.length + 1;

  // Dynamic unlocked badges for both Freelancers and Clients
  const unlockedBadges = [];
  const completedJobsCount = completedFreelanceJobs.length + completedClientJobs.length;
  if (completedJobsCount >= 1) {
    unlockedBadges.push({
      name: 'Genesis Auditor SBT',
      token: `#${1000 + completedJobsCount}`,
      desc: 'Minted for completing smart contract escrows on PolyLance.',
      bgClass: 'bg-purple-50 border-purple-100 text-purple-950',
      tokenBgClass: 'bg-purple-200 text-purple-900',
    });
  }
  if (completedJobsCount >= 4) {
    unlockedBadges.push({
      name: 'Escrow Master SBT',
      token: `#${900 + completedJobsCount}`,
      desc: 'Achieved a high delivery rate across multiple escrows.',
      bgClass: 'bg-emerald-50 border-emerald-100 text-emerald-950',
      tokenBgClass: 'bg-emerald-200 text-emerald-900',
    });
  }
  if (userProfile.githubVerified) {
    unlockedBadges.push({
      name: 'Identity Verified SBT',
      token: '#0001',
      desc: 'Successfully linked and verified your GitHub developer footprint.',
      bgClass: 'bg-indigo-50 border-indigo-100 text-indigo-950',
      tokenBgClass: 'bg-indigo-200 text-indigo-900',
    });
  }

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Banner with Role Context */}
      <div className="glass-panel p-4 sm:p-7 border-purple-200 bg-white hard-shadow flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex flex-col gap-2.5 min-w-0 w-full lg:w-auto">
          {/* Avatar and Name Row with Badges in ONE Line */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img
              src={userProfile.avatarUrl || (userProfile.githubUsername ? `https://github.com/${userProfile.githubUsername}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress}`)}
              alt={rawDisplayName}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress}`;
              }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 border-purple-200 object-cover shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 font-heading truncate leading-tight">
                {rawDisplayName}
              </h1>
              {/* Badges strictly placed in ONE line */}
              <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-x-auto no-scrollbar">
                <span className="text-[9px] sm:text-xs bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-full font-mono font-bold capitalize shrink-0 whitespace-nowrap">
                  {isClientRole ? 'Verified Enterprise Client' : `${tierInfo.tier} Freelancer`}
                </span>
                <span className="text-[9px] sm:text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <CheckCircle2 size={10} /> On-Chain Verified
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Address placed cleanly BELOW avatar */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 w-full sm:w-auto">
            <span className="text-slate-400 font-medium">Wallet:</span>
            <span className="text-purple-950 font-bold">{truncateAddress(address)}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-purple-700 font-semibold truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Polygon Mainnet Connected
            </span>
          </div>
        </div>

        {/* ROLE-SPECIFIC HEADER CTA BUTTONS (RESIZED & BALANCED FOR MOBILE) */}
        <div className="flex items-center gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
          {(currentRole === 'client' || currentRole === 'judge' || currentRole === 'admin') ? (
            <Link
              to="/jobs/post"
              className="flex-1 sm:flex-none gradient-btn-primary px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <PlusCircle size={14} />
              <span>Post Escrow Job</span>
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="flex-1 sm:flex-none gradient-btn-primary px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Search size={14} />
              <span>Browse Marketplace</span>
            </Link>
          )}

          <Link
            to={`/profile/${address}`}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
          >
            <span>Edit Profile</span>
          </Link>
        </div>

      </div>

      {/* RESUME LAST OPENED WORKSPACE CARD */}
      {lastOpenedJob && (
        <motion.div
          variants={staggerItem}
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white hard-shadow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-400/30"
        >
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 border border-blue-300/30 text-[10px] font-mono font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1">
                <Clock size={11} /> Resume Last Opened Workspace
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                lastOpenedJob.status === 'Funded' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                lastOpenedJob.status === 'Submitted' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-white/10 text-white/90 border border-white/20'
              }`}>
                {lastOpenedJob.status}
              </span>
            </div>
            <h2 className="text-xl font-black font-heading line-clamp-1 text-white">
              {lastOpenedJob.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-200/80 font-mono">
              <span>Budget: <strong className="text-white">${lastOpenedJob.amountUsdc || lastOpenedJob.amountEth} {lastOpenedJob.paymentTokenSymbol || 'USDC'}</strong></span>
              <span>•</span>
              <span>Contract: {truncateAddress(lastOpenedJob.contractAddress)}</span>
              {lastOpenedJob.freelancer && (
                <>
                  <span>•</span>
                  <span>Freelancer: {truncateAddress(lastOpenedJob.freelancer)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <Link
              to={`/workspace?jobId=${lastOpenedJob.id}`}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-900 font-bold text-xs flex items-center gap-2 transition-transform hover:scale-102 hard-shadow shadow-white/10"
            >
              <span>Open In Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* REAL-TIME LIVE WALLET LIQUIDITY CARD */}
      <div className="glass-panel p-3.5 sm:p-6 border-slate-200 bg-white hard-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
            <Wallet size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-headline text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider truncate">
                Wallet Liquidity
              </span>
              <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9.5px] font-mono font-bold flex items-center gap-1 border border-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-[10px] sm:text-[11.5px] text-slate-400 font-sans mt-0.5 line-clamp-1 sm:line-clamp-none">
              On-chain balances available on Polygon for escrow funding & transactions.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 font-mono w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-left sm:text-right">
            <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 uppercase font-bold tracking-wide block">Native POL</span>
            <span className="text-base sm:text-lg font-black text-slate-900">{balanceNative} <span className="text-[10px] font-bold text-slate-400">POL</span></span>
          </div>

          <div className="h-7 w-px bg-slate-200" />

          <div className="text-left sm:text-right">
            <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 uppercase font-bold tracking-wide block">Stablecoin USDC</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">${balanceUsdc} <span className="text-[10px] font-bold text-emerald-500">USDC</span></span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <button
              onClick={handleRefreshBalances}
              disabled={isRefreshingBalances}
              title="Refresh wallet balances on-chain"
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw size={13} className={isRefreshingBalances ? 'animate-spin text-purple-600' : ''} />
            </button>
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            >
              <DollarSign size={12} />
              <span>Top-Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLIENT ENTERPRISE OVERVIEW DASHBOARD */}
      {isClientRole ? (
        <div className="space-y-8">
          {/* Financial Overview Cards (High-Integrity Ledger Style from client_dashboard_enterprise_overview) */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={staggerItem} className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 premium-card">
              <span className="font-label-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Total Value Locked (TVL)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-slate-900">
                  ${clientTotalEscrow > 0 ? clientTotalEscrow.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-purple-700 font-bold font-mono">
                <Lock size={14} /> {myClientJobs.length} Active Smart Contract Escrows
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-2 premium-card">
              <span className="font-label-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                Total Spent (YTD)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-emerald-700">
                  ${clientTotalSpent > 0 ? clientTotalSpent.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">USDC</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold font-mono">
                <TrendingUp size={14} /> {clientTotalSpent > 0 ? 'Active payouts settled' : 'No payouts settled yet'}
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="glass-panel p-6 border-purple-200 bg-purple-50 hard-shadow space-y-2 premium-card">
              <span className="font-label-mono text-xs uppercase tracking-wider text-purple-900 font-bold">
                Avg Milestone Approval
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-black text-purple-950">
                  {completedClientJobs.length > 0 ? '12.5' : '0.0'}
                </span>
                <span className="text-xs font-mono text-purple-900 font-bold">Hours</span>
              </div>
              <div className="pt-2">
                <span className="bg-purple-200 text-purple-950 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                  {completedClientJobs.length > 0 ? 'Top Response Rate' : 'No Milestones Reviewed'}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Milestone Approvals + Active Contracts */}
            <div className="lg:col-span-8 space-y-8">
              {/* Action Required: Pending Milestone Submissions */}
              {clientPendingReviewJobs.length > 0 && (
                <section className="glass-panel border-amber-200 bg-white hard-shadow overflow-hidden">
                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-amber-700" />
                      <h3 className="font-headline text-sm font-extrabold uppercase tracking-widest text-amber-950">
                        Action Required: Pending Milestone Review
                      </h3>
                    </div>
                    <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                      {clientPendingReviewJobs.length} Action Item{clientPendingReviewJobs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {clientPendingReviewJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-6 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">{job.title}</span>
                            <span className="bg-purple-100 text-purple-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                              Proof Submitted
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-mono">
                            Submitted by: <span className="text-purple-700 font-bold">{truncateAddress(job.freelancer || '')}</span>
                          </p>
                          {job.proof && (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs italic text-slate-700">
                              "{job.proof.description}"
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                            {job.proof?.externalLink && (
                              <span className="flex items-center gap-1">
                                <FileText size={14} /> {job.proof.externalLink}
                              </span>
                            )}
                            <span>•</span>
                            <span>Submitted recently</span>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-auto">
                          <div
                            className="gradient-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                          >
                            Review & Release
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ONGOING CLIENT PROJECTS & ACTIVE ESCROWS */}
              <section className="glass-panel p-6 border-blue-200 bg-white hard-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900 font-heading">
                      Ongoing Client Projects & Active Escrows ({effectiveOngoingJobs.length})
                    </h3>
                  </div>
                  <Link
                    to="/workspace"
                    className="text-xs font-mono text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Full Workspace</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {effectiveOngoingJobs.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-mono">No active ongoing escrows in progress.</p>
                    <Link
                      to="/jobs/post"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700"
                    >
                      <PlusCircle size={14} /> Post an Escrow Project
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {effectiveOngoingJobs.map((job) => {
                      const isFunded = job.status === 'Funded';
                      const isSubmitted = job.status === 'Submitted';
                      const isSelected = job.status === 'Selected';
                      const isDisputed = job.status === 'Disputed';

                      return (
                        <div
                          key={job.id}
                          onClick={() => navigate(`/workspace?jobId=${job.id}`)}
                          className="bg-slate-50/80 hover:bg-blue-50/40 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 max-w-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                                {job.title}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                isFunded ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                isSubmitted ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                isDisputed ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {job.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono">
                              <span className="font-bold text-emerald-700">
                                ${job.amountUsdc || job.amountEth} {job.paymentTokenSymbol || 'USDC'} Escrow
                              </span>
                              <span>•</span>
                              <span>
                                Freelancer: <strong className="text-slate-800">{truncateAddress(job.freelancer || (job.applications?.[0]?.applicant ?? 'Unassigned'))}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                {isFunded ? '⚡ Work in progress' : isSubmitted ? '🔔 Deliverable under review' : isSelected ? '💳 Ready to fund' : '⚖️ Under DAO arbitration'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                            {isSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/jobs/${job.id}`);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <DollarSign size={13} />
                                <span>Fund Escrow</span>
                              </button>
                            )}

                            {isSubmitted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/jobs/${job.id}`);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Clock size={13} />
                                <span>Review & Release</span>
                              </button>
                            )}

                            <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors text-slate-600">
                              <ArrowUpRight size={15} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* All Posted Contracts Grid */}
              <section className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-700" /> Active Escrow Contracts ({myClientJobs.length > 0 ? myClientJobs.length : 3})
                  </h3>
                  <Link to="/jobs/post" className="text-xs font-mono text-purple-700 font-bold hover:underline flex items-center gap-1">
                    <PlusCircle size={14} /> Post New Escrow
                  </Link>
                </div>

                <div className="space-y-3">
                  {(myClientJobs.length > 0 ? myClientJobs : jobs.slice(0, 3)).map((job) => {
                    const inact = getJobInactivityStatus(job);
                    return (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="space-y-1 max-w-md">
                          <div
                            className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1"
                          >
                            {job.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-mono">
                            <span className="font-bold text-emerald-700">${job.amountUsdc} USDC Escrow</span>
                            <span>•</span>
                            <span>{job.applications.length} Proposals</span>
                            {inact.isReminderActive && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                                ⚠️ Inactive (10+ Days) • Closes in {inact.daysRemaining}d
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          {inact.isReminderActive && isClientRole && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await renewJob(job.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-mono font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Reset 14-day inactivity timer"
                            >
                              <RefreshCw size={12} />
                              <span>Renew</span>
                            </button>
                          )}
                          <span className={`badge-status badge-${job.status.toLowerCase()}`}>
                            {job.status}
                          </span>
                          <div
                            className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-900 border border-purple-200 transition-colors"
                          >
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Sidebar Column (4 Cols): Enterprise Profile & Hiring Pipeline */}
            <div className="lg:col-span-4 space-y-6">
              {/* Enterprise Identity Card */}
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-6">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">
                  Enterprise Identity
                </h3>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-mono font-black text-xl">
                    {completedClientJobs.length > 0 ? '4.98' : '5.00'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-base block">Enterprise Trust Score</span>
                    <span className="text-xs text-purple-700 font-mono font-semibold">
                      {completedClientJobs.length > 0 ? 'Top 1% Global Client' : 'New Client Profile'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs border-t border-slate-100 pt-4">
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Verification Level</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      <ShieldCheck size={14} /> Platinum Verified
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Rehire Rate</span>
                    <span className="font-bold text-slate-900">
                      {completedClientJobs.length > 0 ? '92%' : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Dispute Ratio</span>
                    <span className="font-bold text-emerald-605">
                      0.00%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/audit/${address}`)}
                  className="w-full glass-panel py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Download Audit Report
                </button>
              </div>

              {/* Escrow Guarantee Security Box */}
              <div className="bg-[#2563EB] p-6 rounded-2xl hard-shadow text-white space-y-3">
                <ShieldCheck size={28} className="text-white" />
                <div>
                  <h4 className="font-bold text-base text-white">Escrow Protection Active</h4>
                  <p className="text-xs text-white leading-relaxed mt-1 opacity-95">
                    Your funds are locked in the PolyLance Immutable Vault. Milestones can only be released upon your cryptographic signature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FREELANCER PERSONAL OVERVIEW & COLLABORATION HUB */
        <div className="space-y-8">
          {/* Freelancer Performance Stat Cards (matching unified reputation metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {userScores.completedJobsCount}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Jobs Completed
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                ${(userScores.totalVolume * 0.975).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Net Earned (-2.5% Maint. Fee)
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-purple-700 font-mono">
                {myApplications.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Applications Sent
              </div>
            </div>

            <div className="glass-panel p-4 border-slate-200 bg-white text-center hard-shadow space-y-1">
              <div className="text-2xl font-black text-amber-700 font-mono">
                {userScores.successRatePercent}%
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Success Rate
              </div>
            </div>

            <div className="glass-panel p-4 border-purple-200 bg-purple-50 text-center hard-shadow space-y-1 col-span-2 sm:col-span-1">
              <div className="text-2xl font-black text-purple-900 font-mono">
                {userScores.totalPoints} pts
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-900">
                Reputation Score
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Active Contracts & Collaboration Hub */}
            <div className="lg:col-span-8 space-y-8">
              {/* Active Contracts & Deliverable Proof Submissions */}
              <section className="glass-panel p-3.5 sm:p-6 border-slate-200 bg-white hard-shadow space-y-3.5 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-heading flex items-center gap-1.5 sm:gap-2">
                    <Send size={16} className="text-purple-700 shrink-0 sm:w-[18px] sm:h-[18px]" /> Active Freelance Contracts & Collaboration Hub
                  </h3>
                  <Link to="/reputation" className="text-[11px] sm:text-xs font-mono text-purple-700 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto">
                    <Award size={13} className="shrink-0" /> View Leaderboard Standings
                  </Link>
                </div>

                {/* Hub Navigation Tabs (2 buttons per line on mobile, reduced size) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 border-b border-slate-100 pb-2.5 sm:pb-3">
                  <button
                    onClick={() => setActiveHubTab('contracts')}
                    className={`px-2 sm:px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 truncate ${
                      activeHubTab === 'contracts'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Briefcase size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Contracts ({myFreelancerJobs.length})</span>
                    <span className="hidden sm:inline">Active Contracts ({myFreelancerJobs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('applications')}
                    className={`px-2 sm:px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 truncate ${
                      activeHubTab === 'applications'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Send size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Applications ({myApplications.length})</span>
                    <span className="hidden sm:inline">My Applications ({myApplications.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('posted')}
                    className={`px-2 sm:px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 truncate ${
                      activeHubTab === 'posted'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PlusCircle size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Posted Jobs ({myClientJobs.length})</span>
                    <span className="hidden sm:inline">My Posted Jobs ({myClientJobs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('explore')}
                    className={`px-2 sm:px-3.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 truncate ${
                      activeHubTab === 'explore'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    <Search size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Marketplace ({jobs.filter(j => j.status === 'Open').length})</span>
                    <span className="hidden sm:inline">Marketplace Jobs ({jobs.filter(j => j.status === 'Open').length})</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* TAB 1: ACTIVE CONTRACTS */}
                  {activeHubTab === 'contracts' && (
                    myFreelancerJobs.length === 0 ? (
                      <div className="py-2">
                        <EmptyState
                          title="No Active Freelance Contracts"
                          description="Browse the marketplace and submit verified proposals to get started."
                          actionText="Explore Opportunities"
                          onAction={() => setActiveHubTab('explore')}
                        />
                      </div>
                    ) : (
                      myFreelancerJobs.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="bg-slate-50 p-5 rounded-2xl border border-purple-200 space-y-3 cursor-pointer group hover:border-purple-400 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                                {job.title}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 font-mono">
                                Client: <span className="text-purple-700 font-bold">{truncateAddress(job.client)}</span>
                              </p>
                            </div>
                            <span className={`badge-status badge-${job.status.toLowerCase()} shrink-0`}>
                              {job.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono text-xs pt-1">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 text-[10px] block font-bold uppercase">Escrow / Net Payout</span>
                              <span className="font-bold text-emerald-700 block">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span>
                              <span className="text-[9.5px] text-purple-700 font-bold block">Net: ${(parseFloat(job.amountUsdc || '0') * 0.975).toFixed(2)} USDC</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 text-[10px] block font-bold uppercase">Review Period</span>
                              <span className="font-bold text-purple-700">{job.reviewPeriodDays} Days</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                              <span className="text-slate-500 text-[10px] block font-bold uppercase">Category</span>
                              <span className="font-bold text-slate-900 capitalize">{job.category}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                              <MessageSquare size={15} className="text-purple-700 shrink-0" />
                              <span className="truncate">XMTP Encrypted Chat Connected</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${job.id}`);
                              }}
                              className="gradient-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                            >
                              <span>Open Collaboration Hub</span>
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* TAB 2: MY APPLICATIONS */}
                  {activeHubTab === 'applications' && (
                    myApplications.length === 0 ? (
                      <div className="py-2">
                        <EmptyState
                          title="No Submitted Applications"
                          description="You haven't submitted any job proposals yet. Explore available smart contract jobs to apply."
                          actionText="Browse Marketplace"
                          onAction={() => setActiveHubTab('explore')}
                        />
                      </div>
                    ) : (
                      myApplications.map((app, idx) => (
                        <div
                          key={idx}
                          onClick={() => navigate(`/jobs/${app.job.id}`)}
                          className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-purple-300 space-y-3 cursor-pointer transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-base text-slate-900">
                                {app.job.title}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                Applied for: <span className="text-emerald-700 font-bold">${parseFloat(app.job.amountUsdc || '0').toLocaleString()} USDC</span> • {app.job.reviewPeriodDays} Days SLA
                              </p>
                            </div>
                            <span className={`badge-status badge-${app.job.status.toLowerCase()} shrink-0`}>
                              {app.job.status === 'Open' ? 'Under Review' : app.job.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-sans line-clamp-2 bg-white p-3 rounded-xl border border-slate-200">
                            "{app.proposalText}"
                          </p>
                          <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-500">
                            <span>Client: {truncateAddress(app.job.client)}</span>
                            <span className="text-purple-700 font-bold hover:underline">View Job & Proposal →</span>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {/* TAB 3: MY POSTED JOBS */}
                  {activeHubTab === 'posted' && (
                    myClientJobs.length === 0 ? (
                      <div className="py-2">
                        <EmptyState
                          title="No Jobs Posted by You"
                          description="You haven't created any escrow jobs yet. Post a job with guaranteed smart contract milestones."
                          actionText="Post New Job"
                          onAction={() => navigate('/jobs/post')}
                        />
                      </div>
                    ) : (
                      myClientJobs.map((job) => {
                        const isStale = job.status === 'Open' && (Date.now() - (job.createdAt || Date.now()) >= 10 * 24 * 60 * 60 * 1000);
                        return (
                          <div
                            key={job.id}
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-purple-300 space-y-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold text-base text-slate-900">
                                  {job.title}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                  Escrow Vault: <span className="text-purple-700 font-bold">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span> • {job.applications.length} Applicant{job.applications.length !== 1 ? 's' : ''} • <span className="text-slate-600 font-bold">Posted {formatTimeAgo(job.createdAt || Date.now())}</span>
                                </p>
                              </div>
                              <span className={`badge-status badge-${job.status.toLowerCase()} shrink-0`}>
                                {job.status}
                              </span>
                            </div>

                            {/* 10-Day Retention Notice on Client Dashboard */}
                            {isStale && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 font-sans"
                              >
                                <div className="flex items-center gap-1.5 font-bold">
                                  <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                                  <span>Posted 10+ days ago. Clean database or keep active?</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await renewJob(job.id);
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  >
                                    <RefreshCw size={11} /> Keep (+10d)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const ok = window.confirm('Permanently remove this job from marketplace and database?');
                                      if (ok) await deleteJob(job.id);
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  >
                                    <Trash2 size={11} /> Remove
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-500">
                              <span>Freelancer: {job.freelancer ? truncateAddress(job.freelancer) : 'Awaiting Selection'}</span>
                              <span className="text-purple-700 font-bold hover:underline">Manage Job Details →</span>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}

                  {/* TAB 4: EXPLORE MARKETPLACE JOBS */}
                  {activeHubTab === 'explore' && (
                    jobs.filter(j => j.status === 'Open').length === 0 ? (
                      <div className="py-2">
                        <EmptyState
                          title="No Open Marketplace Listings"
                          description="There are currently no open marketplace listings. Be the first to create one!"
                          actionText="Post New Job"
                          onAction={() => navigate('/jobs/post')}
                        />
                      </div>
                    ) : (
                      jobs.filter(j => j.status === 'Open').map((job) => (
                        <div
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="bg-white p-5 rounded-2xl border border-purple-200 hover:border-purple-400 space-y-3 cursor-pointer shadow-3xs hover:shadow-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-base text-slate-900 hover:text-purple-700 transition-colors">
                                {job.title}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                Client: {truncateAddress(job.client)} • Category: <span className="capitalize text-slate-700 font-bold">{job.category}</span> • <span className="text-purple-700 font-bold">Posted {formatTimeAgo(job.createdAt || Date.now())}</span>
                              </p>
                            </div>
                            <span className="text-base font-extrabold text-emerald-700 font-mono">
                              ${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 font-sans">
                            {job.description}
                          </p>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-mono">
                            <span className="text-slate-500">{job.applications.length} Proposal{job.applications.length !== 1 ? 's' : ''} Received</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/${job.id}`);
                              }}
                              className="gradient-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer"
                            >
                              View & Apply
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Column (4 Cols): On-Chain Reputation & Applications */}
            <div className="lg:col-span-4 space-y-6">
              {/* Soulbound Reputation Badges Card */}
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Award size={16} className="text-purple-700" /> Soulbound SBT Attestations
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  {unlockedBadges.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 font-sans">
                      <p className="font-extrabold text-slate-800">No SBTs Minted Yet</p>
                      <p className="mt-1 text-[10px] leading-relaxed">Complete your first job or link your GitHub profile to unlock your first dynamic badge attestation.</p>
                    </div>
                  ) : (
                    unlockedBadges.map((badge, index) => (
                      <div key={index} className={`p-3 rounded-xl border space-y-1 ${badge.bgClass}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{badge.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${badge.tokenBgClass}`}>
                            {badge.token}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{badge.desc}</p>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/reputation"
                  className="w-full glass-panel py-2 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl text-center block"
                >
                  View Global Leaderboard Rank (#{myRank})
                </Link>
                <Link
                  to={`/audit/${address}`}
                  className="w-full mt-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 py-2 text-xs font-bold rounded-xl text-center block cursor-pointer font-sans"
                >
                  Download Certified Audit
                </Link>
              </div>

              {/* Audited Code-Byte Matrix & Developer Score (New Apple-Style Neumorphic / Glass Design) */}
              <GithubEkycCard
                bytecodeMatrix={bytecodeMatrix}
                userProfile={userProfile}
                onboardingLink
              />
            </div>
          </div>
        </div>
      )}

      {/* Top-up Assistant Modal */}
      <InsufficientFundsModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        requiredAmount="10.0"
        tokenSymbol="POL"
        currentBalance={balanceNative}
        onFundsReceived={() => setIsTopUpModalOpen(false)}
      />
    </div>
  );
};
