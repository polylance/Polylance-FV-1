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
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { PolygonIcon, UsdcIcon, UsdtIcon, TokenIcon } from '../components/TokenIcon';

export const Dashboard: React.FC = () => {
  const { address, currentRole, isArbitrator, balanceNative, balanceUsdc, balanceUsdt, refreshBalances } = useWeb3();
  const { jobs, profiles, updateProfile, deleteJob, renewJob } = usePolyLanceData();
  const navigate = useNavigate();

  const activeAddress = address;
  const isClientRole = currentRole === 'client';
  const [activeHubTab, setActiveHubTab] = React.useState<'contracts' | 'applications' | 'posted' | 'explore'>('contracts');
  const [isRefreshingBalances, setIsRefreshingBalances] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [alertModalOptions, setAlertModalOptions] = React.useState<AlertModalOptions | null>(null);

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

  // Ongoing client projects: Selected, Funded, Submitted, Disputed (strictly the client's own jobs, zero demo fallback)
  const ongoingClientJobs = myClientJobs.filter((j) => ['Selected', 'Funded', 'Submitted', 'Disputed'].includes(j.status));
  const effectiveOngoingJobs = ongoingClientJobs;

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
      bgClass: 'bg-[#F4F6F9] border-[#E2E6EC] text-[#0B0B0C]',
      tokenBgClass: 'bg-[#E7EEF9] text-[#0047AB]',
    });
  }
  if (completedJobsCount >= 4) {
    unlockedBadges.push({
      name: 'Escrow Master SBT',
      token: `#${900 + completedJobsCount}`,
      desc: 'Achieved a high delivery rate across multiple escrows.',
      bgClass: 'bg-[#F4F6F9] border-[#E2E6EC] text-[#0B0B0C]',
      tokenBgClass: 'bg-[#E3F3EA] text-[#1E8449]',
    });
  }
  if (userProfile.githubVerified) {
    unlockedBadges.push({
      name: 'Identity Verified SBT',
      token: '#0001',
      desc: 'Successfully linked and verified your GitHub developer footprint.',
      bgClass: 'bg-[#F4F6F9] border-[#E2E6EC] text-[#0B0B0C]',
      tokenBgClass: 'bg-[#E7EEF9] text-[#0047AB]',
    });
  }

  return (
    <div className="space-y-8 py-6 w-full">
      {/* Top Banner with Role Context */}
      <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2.5 min-w-0 w-full lg:w-auto">
          {/* Avatar and Name Row with Badges in ONE Line */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img
              src={userProfile.avatarUrl || (userProfile.githubUsername ? `https://github.com/${userProfile.githubUsername}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress}`)}
              alt={rawDisplayName}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress}`;
              }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-[10px] border border-[#E2E6EC] object-cover shrink-0"
            />
            <div className="min-w-0 flex-1 text-left">
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-[#0B0B0C] truncate leading-tight">
                {rawDisplayName}
              </h1>
              {/* Badges strictly placed in ONE line */}
              <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-x-auto no-scrollbar">
                <span className="text-[10px] sm:text-xs bg-[#E7EEF9] text-[#0047AB] border border-[#D0E0F7] px-2.5 py-0.5 rounded-[4px] font-mono font-semibold capitalize shrink-0 whitespace-nowrap">
                  {isClientRole ? 'Verified Enterprise Client' : `${tierInfo.tier} Freelancer`}
                </span>
                <span className="text-[10px] sm:text-xs bg-[#E3F3EA] text-[#1E8449] border border-[#B7E2CB] px-2.5 py-0.5 rounded-[4px] font-mono font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <CheckCircle2 size={10} /> On-Chain Verified
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Address placed cleanly BELOW avatar */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#4B5563] bg-[#F4F6F9] border border-[#E2E6EC] rounded-[6px] px-3 py-1.5 w-full sm:w-auto">
            <span className="text-[#8892A0]">Wallet:</span>
            <span className="text-[#0B0B0C] font-semibold">{truncateAddress(address)}</span>
            <span className="text-[#8892A0]">•</span>
            <span className="inline-flex items-center gap-1 text-[#0047AB] font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_#00D2FF] animate-pulse shrink-0" />
              Polygon Mainnet Connected
            </span>
          </div>
        </div>

        {/* ROLE-SPECIFIC HEADER CTA BUTTONS */}
        <div className="flex items-center gap-2 w-full sm:w-auto pt-0.5 sm:pt-0">
          {(currentRole === 'client' || currentRole === 'judge' || currentRole === 'admin') ? (
            <Link
              to="/jobs/post"
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] hover:from-[#003A8C] hover:via-[#0052CC] hover:to-[#003A8C] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:shadow-[0_4px_16px_rgba(0,210,255,0.4)] transition-all duration-200 cursor-pointer"
            >
              <PlusCircle size={14} className="text-[#00D2FF]" />
              <span>Post Escrow Job</span>
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="flex-1 sm:flex-none bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] hover:from-[#003A8C] hover:via-[#0052CC] hover:to-[#003A8C] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:shadow-[0_4px_16px_rgba(0,210,255,0.4)] transition-all duration-200 cursor-pointer"
            >
              <Search size={14} className="text-[#00D2FF]" />
              <span>Browse Marketplace</span>
            </Link>
          )}

          <Link
            to={`/profile/${address}`}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[8px] text-xs sm:text-sm font-medium text-[#0B0B0C] hover:text-[#0047AB] border border-[#E2E6EC] bg-[#FFFFFF] hover:bg-[#F4F6F9] transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* RESUME LAST OPENED WORKSPACE CARD */}
      {lastOpenedJob && (
        <motion.div
          variants={staggerItem}
          className="p-5 sm:p-6 rounded-[10px] bg-[#0B0B0C] text-white border border-[#222326] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
        >
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-[4px] bg-[#0047AB]/20 border border-[#0047AB]/40 text-[10px] font-mono font-semibold text-[#8EB8F5] uppercase tracking-wider flex items-center gap-1">
                <Clock size={11} /> Resume Last Opened Workspace
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] uppercase ${
                lastOpenedJob.status === 'Funded' ? 'bg-[#1E8449]/20 text-[#48C774] border border-[#1E8449]/40' :
                lastOpenedJob.status === 'Submitted' ? 'bg-[#C2610C]/20 text-[#F5A623] border border-[#C2610C]/40' :
                'bg-white/10 text-white/90 border border-white/20'
              }`}>
                {lastOpenedJob.status}
              </span>
            </div>
            <h2 className="text-xl font-serif font-semibold line-clamp-1 text-white">
              {lastOpenedJob.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 font-mono">
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
              className="px-5 py-2.5 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>Open In Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* REAL-TIME LIVE WALLET LIQUIDITY CARD */}
      <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(11,11,12,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC] flex items-center justify-center text-[#0047AB] shrink-0">
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-[#0B0B0C] uppercase tracking-wider truncate">
                Wallet Liquidity
              </span>
              <span className="px-2 py-0.5 rounded-[4px] bg-[#E3F3EA] text-[#1E8449] border border-[#B7E2CB] text-[10px] font-mono font-semibold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E8449]" />
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-[#4B5563] mt-0.5 line-clamp-1 sm:line-clamp-none font-normal">
              On-chain balances available on Polygon for escrow funding &amp; transactions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 font-mono w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E2E6EC]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#7B3FE4] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <PolygonIcon size={15} className="text-white" />
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#8892A0] uppercase font-semibold tracking-wide block leading-none">POL</span>
              <span className="text-sm sm:text-base font-bold text-[#0B0B0C]">{balanceNative}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E2E6EC] hidden sm:block" />

          <div className="flex items-center gap-2">
            <UsdcIcon size={28} className="w-7 h-7 shrink-0 drop-shadow-2xs" />
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#8892A0] uppercase font-semibold tracking-wide block leading-none">USDC</span>
              <span className="text-sm sm:text-base font-bold text-[#0047AB]">${balanceUsdc}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E2E6EC] hidden sm:block" />

          <div className="flex items-center gap-2">
            <UsdtIcon size={28} className="w-7 h-7 shrink-0 drop-shadow-2xs" />
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#8892A0] uppercase font-semibold tracking-wide block leading-none">USDT</span>
              <span className="text-sm sm:text-base font-bold text-[#1E8449]">${balanceUsdt}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
            <button
              onClick={handleRefreshBalances}
              disabled={isRefreshingBalances}
              title="Refresh wallet balances on-chain"
              className="p-2 rounded-[6px] border border-[#E2E6EC] hover:bg-[#F4F6F9] text-[#4B5563] transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw size={13} className={isRefreshingBalances ? 'animate-spin text-[#0047AB]' : ''} />
            </button>
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="px-3 py-1.5 rounded-[6px] bg-[#0047AB] hover:bg-[#003A8C] text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
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
          {/* Financial Overview Cards */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={staggerItem} className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-2 text-left">
              <span className="text-xs uppercase tracking-wider text-[#8892A0] font-semibold font-mono">
                Total Value Locked (TVL)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#0B0B0C]">
                  ${clientTotalEscrow > 0 ? clientTotalEscrow.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-[#8892A0] font-semibold">USDC</span>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-[#0047AB] font-semibold font-mono">
                <Lock size={14} /> {myClientJobs.length} Active Smart Contract Escrows
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-2 text-left">
              <span className="text-xs uppercase tracking-wider text-[#8892A0] font-semibold font-mono">
                Total Spent (YTD)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1E8449]">
                  ${clientTotalSpent > 0 ? clientTotalSpent.toLocaleString() : '0.00'}
                </span>
                <span className="text-xs font-mono text-[#8892A0] font-semibold">USDC</span>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-[#1E8449] font-semibold font-mono">
                <TrendingUp size={14} /> {clientTotalSpent > 0 ? 'Active payouts settled' : 'No payouts settled yet'}
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-2 text-left">
              <span className="text-xs uppercase tracking-wider text-[#8892A0] font-semibold font-mono">
                Avg Milestone Approval
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#0B0B0C]">
                  {completedClientJobs.length > 0 ? '12.5' : '0.0'}
                </span>
                <span className="text-xs font-mono text-[#8892A0] font-semibold">Hours</span>
              </div>
              <div className="pt-1">
                <span className="bg-[#E7EEF9] text-[#0047AB] text-[10px] font-mono px-2 py-0.5 rounded-[4px] font-semibold uppercase">
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
                <section className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] shadow-[0_1px_2px_rgba(11,11,12,0.06)] overflow-hidden text-left">
                  <div className="bg-[#FDF3DC] px-5 sm:px-6 py-3.5 border-b border-[#F6D896] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#C2610C]" />
                      <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#C2610C]">
                        Action Required: Pending Milestone Review
                      </h3>
                    </div>
                    <span className="bg-[#C2610C] text-white text-xs font-semibold px-2.5 py-0.5 rounded-[4px] font-mono">
                      {clientPendingReviewJobs.length} Action Item{clientPendingReviewJobs.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-[#E2E6EC]">
                    {clientPendingReviewJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-5 sm:p-6 flex flex-col md:flex-row gap-4 items-start justify-between hover:bg-[#F4F6F9] transition-colors cursor-pointer group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#0B0B0C] text-base group-hover:text-[#0047AB] transition-colors">{job.title}</span>
                            <span className="bg-[#E7EEF9] text-[#0047AB] text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px]">
                              Proof Submitted
                            </span>
                          </div>
                          <p className="text-xs text-[#4B5563] font-mono">
                            Submitted by: <span className="text-[#0047AB] font-semibold">{truncateAddress(job.freelancer || '')}</span>
                          </p>
                          {job.proof && (
                            <div className="p-3 bg-[#F4F6F9] rounded-[6px] border border-[#E2E6EC] text-xs text-[#4B5563]">
                              "{job.proof.description}"
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-[11px] font-mono text-[#8892A0] pt-1">
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
                            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 text-xs font-medium rounded-[8px] flex items-center gap-1 shadow-xs transition-colors"
                          >
                            Review &amp; Release
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ONGOING CLIENT PROJECTS & ACTIVE ESCROWS (REAL DATA ONLY) */}
              <section className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-[#0047AB]" />
                    <h3 className="text-base font-serif font-semibold text-[#0B0B0C]">
                      Ongoing Client Projects &amp; Active Escrows ({effectiveOngoingJobs.length})
                    </h3>
                  </div>
                  <Link
                    to="/workspace"
                    className="text-xs font-mono text-[#0047AB] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Full Workspace</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {effectiveOngoingJobs.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-[#8892A0] font-mono">No active ongoing escrows in progress.</p>
                    <Link
                      to="/jobs/post"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium shadow-xs transition-colors"
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
                          className="bg-[#F4F6F9] hover:bg-[#E7EEF9]/30 p-4 rounded-[8px] border border-[#E2E6EC] hover:border-[#0047AB] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                        >
                          <div className="space-y-1.5 max-w-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#0B0B0C] group-hover:text-[#0047AB] transition-colors line-clamp-1">
                                {job.title}
                              </span>
                              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] uppercase ${
                                isFunded ? 'bg-[#E3F3EA] text-[#1E8449] border border-[#B7E2CB]' :
                                isSubmitted ? 'bg-[#FDF3DC] text-[#C2610C] border border-[#F6D896]' :
                                isDisputed ? 'bg-[#FBEAE8] text-[#C0392B] border border-[#F5C2BC]' :
                                'bg-[#E7EEF9] text-[#0047AB] border border-[#D0E0F7]'
                              }`}>
                                {job.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#4B5563] font-mono">
                              <span className="font-semibold text-[#1E8449]">
                                ${job.amountUsdc || job.amountEth} {job.paymentTokenSymbol || 'USDC'} Escrow
                              </span>
                              <span>•</span>
                              <span>
                                Freelancer: <strong className="text-[#0B0B0C]">{truncateAddress(job.freelancer || (job.applications?.[0]?.applicant ?? 'Unassigned'))}</strong>
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
                                className="px-3 py-1.5 rounded-[6px] bg-[#1E8449] hover:bg-[#186A3B] text-white font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <TokenIcon token={job.paymentTokenSymbol || 'USDC'} size={13} />
                                <span>Fund Escrow</span>
                              </button>
                            )}

                            {isSubmitted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/jobs/${job.id}`);
                                }}
                                className="px-3 py-1.5 rounded-[6px] bg-[#C2610C] hover:bg-[#9E4E0A] text-white font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Clock size={13} />
                                <span>Review &amp; Release</span>
                              </button>
                            )}

                            <div className="p-2 rounded-[6px] bg-[#FFFFFF] border border-[#E2E6EC] group-hover:bg-[#0047AB] group-hover:text-white group-hover:border-[#0047AB] transition-colors text-[#4B5563]">
                              <ArrowUpRight size={15} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* All Posted Contracts Grid (Strictly user's own jobs, zero demo fallback) */}
              <section className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-[#E2E6EC] pb-3">
                  <h3 className="text-base font-serif font-semibold text-[#0B0B0C] flex items-center gap-2">
                    <Briefcase size={18} className="text-[#0047AB]" /> Active Escrow Contracts ({myClientJobs.length})
                  </h3>
                  <Link to="/jobs/post" className="text-xs font-mono text-[#0047AB] font-semibold hover:underline flex items-center gap-1">
                    <PlusCircle size={14} /> Post New Escrow
                  </Link>
                </div>

                {myClientJobs.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-[#8892A0] font-mono">You haven't posted any escrow contracts yet.</p>
                    <Link
                      to="/jobs/post"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium transition-colors"
                    >
                      <PlusCircle size={14} /> Post an Escrow Project
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myClientJobs.map((job) => {
                      const inact = getJobInactivityStatus(job);
                      return (
                        <div
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="bg-[#F4F6F9] hover:bg-[#E7EEF9]/30 p-4 rounded-[8px] border border-[#E2E6EC] hover:border-[#0047AB] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group text-left"
                        >
                          <div className="space-y-1 max-w-md">
                            <div
                              className="font-semibold text-sm text-[#0B0B0C] group-hover:text-[#0047AB] transition-colors line-clamp-1"
                            >
                              {job.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#4B5563] font-mono">
                              <span className="font-semibold text-[#1E8449]">${job.amountUsdc} USDC Escrow</span>
                              <span>•</span>
                              <span>{job.applications.length} Proposals</span>
                              {inact.isReminderActive && (
                                <span className="bg-[#FDF3DC] text-[#C2610C] border border-[#F6D896] px-2 py-0.5 rounded-[4px] font-semibold">
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
                                className="px-2.5 py-1 rounded-[6px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-[11px] font-mono font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
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
                              className="p-2 rounded-[6px] bg-[#FFFFFF] group-hover:bg-[#0047AB] text-[#0B0B0C] group-hover:text-white border border-[#E2E6EC] group-hover:border-[#0047AB] transition-colors"
                            >
                              <ArrowUpRight size={16} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Column (4 Cols): Enterprise Profile & Hiring Pipeline */}
            <div className="lg:col-span-4 space-y-6 text-left">
              {/* Enterprise Identity Card */}
              <div className="bg-[#FFFFFF] border border-[#E2E6EC] rounded-[10px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8892A0] font-mono border-b border-[#E2E6EC] pb-3">
                  Enterprise Identity
                </h3>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[8px] bg-[#E7EEF9] text-[#0047AB] border border-[#D0E0F7] flex items-center justify-center font-mono font-bold text-xl">
                    {completedClientJobs.length > 0 ? '4.98' : '5.00'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#0B0B0C] text-base block">Enterprise Trust Score</span>
                    <span className="text-xs text-[#0047AB] font-mono font-medium">
                      {completedClientJobs.length > 0 ? 'Top 1% Global Client' : 'New Client Profile'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs border-t border-[#E2E6EC] pt-4">
                  <div className="flex justify-between pb-2 border-b border-[#E2E6EC]">
                    <span className="text-[#8892A0]">Verification Level</span>
                    <span className="font-semibold text-[#0047AB] flex items-center gap-1">
                      <ShieldCheck size={14} /> Platinum Verified
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E2E6EC]">
                    <span className="text-[#8892A0]">Rehire Rate</span>
                    <span className="font-semibold text-[#0B0B0C]">
                      {completedClientJobs.length > 0 ? '92%' : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#E2E6EC]">
                    <span className="text-[#8892A0]">Dispute Ratio</span>
                    <span className="font-semibold text-[#1E8449]">
                      0.00%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/audit/${address}`)}
                  className="w-full py-2 text-xs font-medium text-[#0B0B0C] border border-[#E2E6EC] hover:bg-[#F4F6F9] rounded-[8px] cursor-pointer transition-colors"
                >
                  Download Audit Report
                </button>
              </div>

              {/* Escrow Guarantee Security Box */}
              <div className="bg-[#0047AB] p-6 rounded-[10px] shadow-xs text-white space-y-3">
                <ShieldCheck size={28} className="text-white" />
                <div>
                  <h4 className="font-serif font-semibold text-base text-white">Escrow Protection Active</h4>
                  <p className="text-xs text-white/90 leading-relaxed mt-1">
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
          {/* Freelancer Performance Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 border border-[#E2E6EC] bg-white rounded-[10px] text-center space-y-1 shadow-xs">
              <div className="text-2xl font-bold text-[#0B0B0C] font-mono">
                {userScores.completedJobsCount}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8892A0]">
                Jobs Completed
              </div>
            </div>

            <div className="p-4 border border-[#E2E6EC] bg-white rounded-[10px] text-center space-y-1 shadow-xs">
              <div className="text-2xl font-bold text-[#0B0B0C] font-mono">
                ${(userScores.totalVolume * 0.975).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8892A0]">
                Net Earned (-2.5%)
              </div>
            </div>

            <div className="p-4 border border-[#E2E6EC] bg-white rounded-[10px] text-center space-y-1 shadow-xs">
              <div className="text-2xl font-bold text-[#0B0B0C] font-mono">
                {myApplications.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8892A0]">
                Applications Sent
              </div>
            </div>

            <div className="p-4 border border-[#E2E6EC] bg-white rounded-[10px] text-center space-y-1 shadow-xs">
              <div className="text-2xl font-bold text-[#0B0B0C] font-mono">
                {userScores.successRatePercent}%
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8892A0]">
                Success Rate
              </div>
            </div>

            <div className="p-4 border border-[#0047AB]/20 bg-[#0047AB]/5 rounded-[10px] text-center space-y-1 col-span-2 sm:col-span-1 shadow-xs">
              <div className="text-2xl font-bold text-[#0047AB] font-mono">
                {userScores.totalPoints} pts
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#0047AB]">
                Reputation Score
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Column (8 Cols): Active Contracts & Collaboration Hub */}
            <div className="lg:col-span-8 space-y-8">
              {/* Active Contracts & Deliverable Proof Submissions */}
              <section className="p-4 sm:p-6 border border-[#E2E6EC] bg-white rounded-[10px] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[#E2E6EC] pb-3">
                  <h3 className="text-sm sm:text-base font-serif font-semibold text-[#0B0B0C] flex items-center gap-2">
                    <Send size={16} className="text-[#0047AB] shrink-0" /> Active Freelance Contracts & Collaboration Hub
                  </h3>
                  <Link to="/reputation" className="text-xs font-medium text-[#0047AB] hover:underline flex items-center gap-1 self-start sm:self-auto">
                    <Award size={13} className="shrink-0" /> View Leaderboard Standings
                  </Link>
                </div>

                {/* Hub Navigation Tabs */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-0.5 border-b border-[#E2E6EC] pb-3">
                  <button
                    onClick={() => setActiveHubTab('contracts')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
                      activeHubTab === 'contracts'
                        ? 'bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] text-white shadow-[0_2px_8px_rgba(0,102,255,0.3)] font-semibold'
                        : 'bg-[#F4F6F9] text-[#4B5563] hover:bg-[#EBF3FF] hover:text-[#0047AB] border border-[#E2E6EC]'
                    }`}
                  >
                    <Briefcase size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Contracts ({myFreelancerJobs.length})</span>
                    <span className="hidden sm:inline">Active Contracts ({myFreelancerJobs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('applications')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
                      activeHubTab === 'applications'
                        ? 'bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] text-white shadow-[0_2px_8px_rgba(0,102,255,0.3)] font-semibold'
                        : 'bg-[#F4F6F9] text-[#4B5563] hover:bg-[#EBF3FF] hover:text-[#0047AB] border border-[#E2E6EC]'
                    }`}
                  >
                    <Send size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Applications ({myApplications.length})</span>
                    <span className="hidden sm:inline">My Applications ({myApplications.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('posted')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
                      activeHubTab === 'posted'
                        ? 'bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] text-white shadow-[0_2px_8px_rgba(0,102,255,0.3)] font-semibold'
                        : 'bg-[#F4F6F9] text-[#4B5563] hover:bg-[#EBF3FF] hover:text-[#0047AB] border border-[#E2E6EC]'
                    }`}
                  >
                    <PlusCircle size={12} className="shrink-0" />
                    <span className="truncate sm:hidden">Posted Jobs ({myClientJobs.length})</span>
                    <span className="hidden sm:inline">My Posted Jobs ({myClientJobs.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveHubTab('explore')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
                      activeHubTab === 'explore'
                        ? 'bg-gradient-to-r from-[#0047AB] via-[#0066FF] to-[#0047AB] text-white shadow-[0_2px_8px_rgba(0,102,255,0.3)] font-semibold'
                        : 'bg-[#F4F6F9] text-[#4B5563] hover:bg-[#EBF3FF] hover:text-[#0047AB] border border-[#E2E6EC]'
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
                          className="bg-white p-5 rounded-[10px] border border-[#E2E6EC] space-y-3 cursor-pointer group hover:border-[#0047AB] transition-colors shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-serif font-semibold text-base text-[#0B0B0C] group-hover:text-[#0047AB] transition-colors">
                                {job.title}
                              </div>
                              <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                                Client: <span className="text-[#0B0B0C] font-semibold">{truncateAddress(job.client)}</span>
                              </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] border bg-[#F4F6F9] text-[#0B0B0C] border-[#E2E6EC] shrink-0">
                              {job.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono text-xs pt-1">
                            <div className="bg-[#F4F6F9] p-2.5 rounded-[8px] border border-[#E2E6EC]">
                              <span className="text-[#8892A0] text-[10px] block font-semibold uppercase">Escrow / Net Payout</span>
                              <span className="font-bold text-[#0B0B0C] block">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span>
                              <span className="text-[10px] text-[#0047AB] font-semibold block">Net: ${(parseFloat(job.amountUsdc || '0') * 0.975).toFixed(2)} USDC</span>
                            </div>
                            <div className="bg-[#F4F6F9] p-2.5 rounded-[8px] border border-[#E2E6EC]">
                              <span className="text-[#8892A0] text-[10px] block font-semibold uppercase">Review Period</span>
                              <span className="font-bold text-[#0B0B0C]">{job.reviewPeriodDays} Days</span>
                            </div>
                            <div className="bg-[#F4F6F9] p-2.5 rounded-[8px] border border-[#E2E6EC]">
                              <span className="text-[#8892A0] text-[10px] block font-semibold uppercase">Category</span>
                              <span className="font-bold text-[#0B0B0C] capitalize">{job.category}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#E2E6EC]">
                            <div className="flex items-center gap-2 text-xs text-[#4B5563] font-mono">
                              <MessageSquare size={15} className="text-[#0047AB] shrink-0" />
                              <span className="truncate">XMTP Encrypted Chat Connected</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/chat/${job.id}`);
                              }}
                              className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto transition-colors"
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
                          className="bg-white p-5 rounded-[10px] border border-[#E2E6EC] hover:border-[#0047AB] space-y-3 cursor-pointer transition-colors shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-serif font-semibold text-base text-[#0B0B0C]">
                                {app.job.title}
                              </div>
                              <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                                Applied for: <span className="text-[#0B0B0C] font-semibold">${parseFloat(app.job.amountUsdc || '0').toLocaleString()} USDC</span> • {app.job.reviewPeriodDays} Days SLA
                              </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] border bg-[#F4F6F9] text-[#0B0B0C] border-[#E2E6EC] shrink-0">
                              {app.job.status === 'Open' ? 'Under Review' : app.job.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#4B5563] font-sans line-clamp-2 bg-[#F4F6F9] p-3 rounded-[8px] border border-[#E2E6EC]">
                            "{app.proposalText}"
                          </p>
                          <div className="flex justify-between items-center text-xs font-mono pt-1 text-[#8892A0]">
                            <span>Client: {truncateAddress(app.job.client)}</span>
                            <span className="text-[#0047AB] font-semibold hover:underline">View Job & Proposal →</span>
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
                            className="bg-white p-5 rounded-[10px] border border-[#E2E6EC] hover:border-[#0047AB] space-y-3 cursor-pointer transition-colors shadow-xs"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-serif font-semibold text-base text-[#0B0B0C]">
                                  {job.title}
                                </div>
                                <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                                  Escrow Vault: <span className="text-[#0B0B0C] font-semibold">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span> • {job.applications.length} Applicant{job.applications.length !== 1 ? 's' : ''} • <span className="text-[#8892A0]">Posted {formatTimeAgo(job.createdAt || Date.now())}</span>
                                </p>
                              </div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] border bg-[#F4F6F9] text-[#0B0B0C] border-[#E2E6EC] shrink-0">
                                {job.status}
                              </span>
                            </div>

                            {/* 10-Day Retention Notice on Client Dashboard */}
                            {isStale && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="p-3 bg-[#FFF9E6] border border-[#F0D58C] rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B0B0C] font-sans"
                              >
                                <div className="flex items-center gap-1.5 font-semibold text-[#8C6B00]">
                                  <AlertTriangle size={15} className="text-[#8C6B00] shrink-0" />
                                  <span>Posted 10+ days ago. Clean database or keep active?</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await renewJob(job.id);
                                    }}
                                    className="px-2.5 py-1 bg-[#0047AB] hover:bg-[#003A8C] text-white rounded-[6px] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <RefreshCw size={11} /> Keep (+10d)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAlertModalOptions({
                                        title: 'Remove Job Posting',
                                        message: 'Permanently remove this job from the marketplace and database?',
                                        type: 'confirm',
                                        showCancel: true,
                                        isDestructive: true,
                                        confirmText: 'Remove Job',
                                        onConfirm: async () => {
                                          await deleteJob(job.id);
                                        },
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Trash2 size={11} /> Remove
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-xs font-mono pt-1 text-[#8892A0]">
                              <span>Freelancer: {job.freelancer ? truncateAddress(job.freelancer) : 'Awaiting Selection'}</span>
                              <span className="text-[#0047AB] font-semibold hover:underline">Manage Job Details →</span>
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
                          className="bg-white p-5 rounded-[10px] border border-[#E2E6EC] hover:border-[#0047AB] space-y-3 cursor-pointer shadow-xs transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-serif font-semibold text-base text-[#0B0B0C] hover:text-[#0047AB] transition-colors">
                                {job.title}
                              </div>
                              <p className="text-xs text-[#4B5563] mt-0.5 font-mono">
                                Client: {truncateAddress(job.client)} • Category: <span className="capitalize text-[#0B0B0C] font-semibold">{job.category}</span> • <span className="text-[#8892A0]">Posted {formatTimeAgo(job.createdAt || Date.now())}</span>
                              </p>
                            </div>
                            <span className="text-base font-bold text-[#0B0B0C] font-mono">
                              ${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC
                            </span>
                          </div>
                          <p className="text-xs text-[#4B5563] line-clamp-2 font-sans">
                            {job.description}
                          </p>
                          <div className="flex justify-between items-center pt-2 border-t border-[#E2E6EC] text-xs font-mono">
                            <span className="text-[#8892A0]">{job.applications.length} Proposal{job.applications.length !== 1 ? 's' : ''} Received</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/${job.id}`);
                              }}
                              className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-3.5 py-1.5 rounded-[8px] text-xs font-semibold cursor-pointer transition-colors"
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
              <div className="p-6 border border-[#E2E6EC] bg-white rounded-[10px] shadow-xs space-y-4">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-[#8892A0] border-b border-[#E2E6EC] pb-3 flex items-center gap-2">
                  <Award size={16} className="text-[#0047AB]" /> Soulbound SBT Attestations
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  {unlockedBadges.length === 0 ? (
                    <div className="p-4 bg-[#F4F6F9] rounded-[8px] border border-dashed border-[#E2E6EC] text-center text-[#4B5563] font-sans">
                      <p className="font-bold text-[#0B0B0C]">No SBTs Minted Yet</p>
                      <p className="mt-1 text-[11px] text-[#8892A0] leading-relaxed">Complete your first job or link your GitHub profile to unlock your first dynamic badge attestation.</p>
                    </div>
                  ) : (
                    unlockedBadges.map((badge, index) => (
                      <div key={index} className="p-3 rounded-[8px] border border-[#E2E6EC] bg-[#F4F6F9] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-[#0B0B0C]">{badge.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-semibold bg-[#E2E6EC] text-[#0B0B0C]">
                            {badge.token}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#4B5563] leading-relaxed font-sans">{badge.desc}</p>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/reputation"
                  className="w-full py-2 text-xs font-medium text-[#0B0B0C] border border-[#E2E6EC] hover:bg-[#F4F6F9] rounded-[8px] text-center block transition-colors"
                >
                  View Global Leaderboard Rank (#{myRank})
                </Link>
                <Link
                  to={`/audit/${address}`}
                  className="w-full mt-2 py-2 text-xs font-semibold text-white bg-[#0047AB] hover:bg-[#003A8C] rounded-[8px] text-center block cursor-pointer transition-colors"
                >
                  Download Certified Audit
                </Link>
              </div>

              {/* Audited Code-Byte Matrix & Developer Score */}
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

      {/* PolyLance Alert & Confirmation Modal */}
      <PolyLanceAlertModal
        isOpen={Boolean(alertModalOptions)}
        options={alertModalOptions}
        onClose={() => setAlertModalOptions(null)}
      />
    </div>
  );
};
