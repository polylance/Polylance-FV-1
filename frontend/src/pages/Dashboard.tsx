import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile, Job } from '../types';
import { truncateAddress, formatTimeAgo, getDeterministicSbtId } from '../utils/formatters';
import { generateCertificateSvg } from '../utils/certificateGenerator';
import { CONTRACTS } from '../config/contracts';
import { scoreGithubUser, getUserBytecodeMatrix } from '../utils/githubOracle';
import { calculateReputationScores, getReputationTier } from '../utils/reputation';
import { getJobInactivityStatus } from '../utils/inactivity';
import { PageContainer } from '../components/layout/PageContainer';
import { Amount } from '../components/common/Amount';
import { StatusBadge } from '../components/common/StatusBadge';
import { Badge } from '../components/common/Badge';
import { AddressChip } from '../components/common/AddressChip';
import { getVideo } from '../media';
import { VideoSlot, WatchButton, VideoModal, useVideoModal } from '../components/video';
import { Button } from '../components/common/Button';
import { InsufficientFundsModal } from '../components/InsufficientFundsModal';
import { GithubEkycCard } from '../components/GithubEkycCard';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { PolygonIcon, UsdcIcon, UsdtIcon } from '../components/TokenIcon';
import {
  Briefcase,
  PlusCircle,
  ArrowUpRight,
  Award,
  Search,
  Lock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Wallet,
  ArrowRight,
  DollarSign,
  Layers,
  FileCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { address, currentRole, isArbitrator, balanceNative, balanceUsdc, balanceUsdt, refreshBalances } = useWeb3();
  const { jobs, profiles, updateProfile, deleteJob, renewJob } = usePolyLanceData();
  const navigate = useNavigate();

  const activeAddress = address || '';

  // Persistent Role Mode: Work vs Hire
  const [roleMode, setRoleMode] = useState<'work' | 'hire'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_role_mode');
      if (saved === 'work' || saved === 'hire') return saved;
    }
    return currentRole === 'client' ? 'hire' : 'work';
  });

  const handleRoleModeChange = (mode: 'work' | 'hire') => {
    setRoleMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_role_mode', mode);
    }
  };

  const isClientView = roleMode === 'hire';

  const [activeHubTab, setActiveHubTab] = useState<'contracts' | 'applications' | 'posted' | 'explore'>('contracts');
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  // Video Modal hook
  const { activeVideoId, isOpen: isVideoModalOpen, triggerRef, openVideo, closeVideo } = useVideoModal();

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
        .catch((err) => console.warn('Background GitHub sync failed:', err));
    }
  }, [activeAddress, userProfile.githubUsername, userProfile.githubVerified, userProfile.primaryScore]);

  const myClientJobs = jobs.filter((j) => Boolean(j.client && activeAddress && j.client.toLowerCase() === activeAddress.toLowerCase()));
  const myFreelancerJobs = jobs.filter((j) => Boolean(j.freelancer && activeAddress && j.freelancer.toLowerCase() === activeAddress.toLowerCase()));

  const myApplications = jobs.flatMap((j) =>
    (j.applications || [])
      .filter((app) => app.applicant.toLowerCase() === activeAddress.toLowerCase())
      .map((app) => ({ ...app, job: j }))
  );

  const completedFreelanceJobs = myFreelancerJobs.filter((j) => j.status === 'Completed');
  const completedClientJobs = myClientJobs.filter((j) => j.status === 'Completed');

  const clientTotalEscrow = myClientJobs.reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);
  const clientTotalSpent = completedClientJobs.reduce((sum, j) => {
    const paidFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * paidFraction);
  }, 0);

  const bytecodeMatrix = getUserBytecodeMatrix(userProfile, completedFreelanceJobs.length, userScores.totalVolume * 0.975);

  // Dynamic ranking calculation
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

  // First-run checklist items calculation
  const isWalletConnected = Boolean(activeAddress);
  const isProfileComplete = Boolean(userProfile.bio && userProfile.bio !== 'No biography has been written yet.' && (userProfile.skills?.length || 0) > 0);
  const isFunded = parseFloat(balanceNative || '0') > 0 || parseFloat(balanceUsdc || '0') > 0;
  const hasActivity = myClientJobs.length > 0 || myApplications.length > 0 || myFreelancerJobs.length > 0;

  // Profile completeness score
  let completenessScore = 0;
  if (userProfile.avatarUrl && !userProfile.avatarUrl.includes('dicebear')) completenessScore += 25;
  if (userProfile.bio && userProfile.bio !== 'No biography has been written yet.') completenessScore += 25;
  if (userProfile.skills && userProfile.skills.length > 0) completenessScore += 25;
  if (userProfile.githubVerified) completenessScore += 25;

  // "Needs your attention" list derivation
  interface AttentionItem {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionPath: string;
    badge: string;
    badgeColor: string;
  }

  const attentionItems: AttentionItem[] = [];

  // Client: Submissions waiting for approval
  myClientJobs.filter(j => j.status === 'Submitted').forEach(j => {
    attentionItems.push({
      id: `review-${j.id}`,
      title: j.title,
      description: 'Freelancer submitted deliverables for review. Inspect and release escrow funds.',
      actionLabel: 'Review deliverables',
      actionPath: `/workspace?jobId=${j.id}`,
      badge: 'Review needed',
      badgeColor: 'bg-[#FDF3DC] text-[#C2610C]',
    });
  });

  // Client: Proposals received on open jobs
  myClientJobs.filter(j => j.status === 'Open' && (j.applications?.length || 0) > 0).forEach(j => {
    attentionItems.push({
      id: `proposals-${j.id}`,
      title: j.title,
      description: `${j.applications.length} proposal(s) received from candidates. Review and select a freelancer.`,
      actionLabel: 'Review proposals',
      actionPath: `/jobs/${j.id}`,
      badge: `${j.applications.length} proposals`,
      badgeColor: 'bg-[#E7EEF9] text-[#0047AB]',
    });
  });

  // Freelancer: Funded jobs in progress
  myFreelancerJobs.filter(j => j.status === 'Funded').forEach(j => {
    attentionItems.push({
      id: `work-${j.id}`,
      title: j.title,
      description: 'Escrow is funded. Work is in progress — submit deliverables when ready.',
      actionLabel: 'Submit work',
      actionPath: `/workspace?jobId=${j.id}`,
      badge: 'In progress',
      badgeColor: 'bg-[#E7EEF9] text-[#0047AB]',
    });
  });

  // Disputes
  [...myClientJobs, ...myFreelancerJobs].filter(j => j.status === 'Disputed').forEach(j => {
    attentionItems.push({
      id: `dispute-${j.id}`,
      title: j.title,
      description: 'Dispute opened. DAO arbitrator review is active.',
      actionLabel: 'View dispute',
      actionPath: `/workspace?jobId=${j.id}`,
      badge: 'Disputed',
      badgeColor: 'bg-[#FCE8E6] text-[#DC2626]',
    });
  });

  // Unlocked badges
  const unlockedBadges = [];
  const completedJobsCount = completedFreelanceJobs.length + completedClientJobs.length;
  if (completedJobsCount >= 1) {
    unlockedBadges.push({
      name: 'Genesis Auditor SBT',
      token: `#${1000 + completedJobsCount}`,
      desc: 'Minted for completing smart contract escrows on PolyLance.',
    });
  }
  if (completedJobsCount >= 4) {
    unlockedBadges.push({
      name: 'Escrow Master SBT',
      token: `#${900 + completedJobsCount}`,
      desc: 'Achieved a high delivery rate across multiple escrows.',
    });
  }
  if (userProfile.githubVerified) {
    unlockedBadges.push({
      name: 'Identity Verified SBT',
      token: '#0001',
      desc: 'Successfully linked and verified your GitHub developer footprint.',
    });
  }

  // First-login welcome video: shown once per wallet in localStorage, never auto-playing; coming-soon state hides it entirely
  const welcomeVideo = getVideo('welcome-15s');
  const isWelcomeReady = welcomeVideo?.status === 'ready' && Boolean(welcomeVideo.sources.webm || welcomeVideo.sources.mp4 || welcomeVideo.embed);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !activeAddress) return true;
    return localStorage.getItem(`polylance_welcome_dismissed_${activeAddress.toLowerCase()}`) === 'true';
  });

  const handleDismissWelcome = () => {
    if (!activeAddress) return;
    setWelcomeDismissed(true);
    try {
      localStorage.setItem(`polylance_welcome_dismissed_${activeAddress.toLowerCase()}`, 'true');
    } catch {}
  };

  const showWelcomeCard = isWelcomeReady && !welcomeDismissed;

  return (
    <PageContainer className="space-y-8 py-6 text-[#0B0B0F]">
      {/* First-login welcome card (hidden in coming-soon state) */}
      {showWelcomeCard && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
              <h3 className="font-sans font-semibold text-sm text-[#0B0B0F]">
                Welcome to PolyLance: 15-Second Tour
              </h3>
            </div>
            <button
              type="button"
              onClick={handleDismissWelcome}
              className="text-[#6B7280] hover:text-[#0B0B0F] text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
          <div className="max-w-xl">
            <VideoSlot id="welcome-15s" />
          </div>
        </div>
      )}
      {/* ── 1. HEADER WITH HIRE / WORK SWITCH & ROLE-BASED PRIMARY ACTION ── */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 text-left">
        <div className="flex items-center gap-4 min-w-0">
          <Link to={`/profile/${activeAddress}`} className="shrink-0">
            <img
              src={userProfile.avatarUrl || (userProfile.githubUsername ? `https://github.com/${userProfile.githubUsername}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress}`)}
              alt={rawDisplayName}
              className="w-14 h-14 rounded-[8px] border border-[#E5E7EB] object-cover"
            />
          </Link>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${activeAddress}`} className="text-xl font-semibold text-[#0B0B0F] truncate hover:text-[#0047AB] transition-colors">
                {rawDisplayName}
              </Link>
              <Badge variant={tierInfo.tier === 'Gold' ? 'success' : 'neutral'}>
                {tierInfo.tier}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
              <AddressChip address={activeAddress} />
              <span>•</span>
              <span className="text-[#047857] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                Polygon Mainnet
              </span>
            </div>
          </div>
        </div>

        {/* Role Toggle & Primary Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Hire / Work Segmented Switch */}
          <div className="inline-flex p-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs font-medium">
            <button
              type="button"
              onClick={() => handleRoleModeChange('work')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                roleMode === 'work'
                  ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Work
            </button>
            <button
              type="button"
              onClick={() => handleRoleModeChange('hire')}
              className={`px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
                roleMode === 'hire'
                  ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Hire
            </button>
          </div>

          {/* Role-based primary action button */}
          {isClientView ? (
            <Link
              to="/jobs/post"
              className="bg-[#0047AB] hover:bg-[#003882] text-white px-4 py-2 rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle size={14} />
              <span>Post a job</span>
            </Link>
          ) : (
            <Link
              to="/jobs"
              className="bg-[#0047AB] hover:bg-[#003882] text-white px-4 py-2 rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search size={14} />
              <span>Find jobs</span>
            </Link>
          )}

          <Link
            to="/profile"
            className="border border-[#E5E7EB] hover:bg-[#F6F7F9] text-[#0B0B0F] px-3.5 py-2 rounded-[8px] text-xs font-medium text-center transition-colors"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {/* ── 2. FIRST-RUN CHECKLIST FOR NEW USERS (AUTO-TICKING) & COMPLETENESS ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Onboarding Checklist Card */}
        <div className="md:col-span-8 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 space-y-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
            <div>
              <h3 className="font-semibold text-sm text-[#0B0B0F]">Getting Started Checklist</h3>
              <p className="text-xs text-[#4B5563]">Complete these four steps to start transacting safely on PolyLance.</p>
            </div>
            <span className="text-xs font-semibold text-[#4B5563]">
              {[isWalletConnected, isProfileComplete, isFunded, hasActivity].filter(Boolean).length}/4 complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className={`p-2.5 rounded-[8px] border text-xs flex items-center gap-2.5 ${isWalletConnected ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#F6F7F9] border-[#E5E7EB] text-[#4B5563]'}`}>
              {isWalletConnected ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
              <div>
                <div className="font-semibold text-[#0B0B0F]">1. Connect wallet</div>
                <div className="text-[11px] text-[#4B5563]">Connected to Polygon Mainnet</div>
              </div>
            </div>

            <Link to="/profile" className={`p-2.5 rounded-[8px] border text-xs flex items-center gap-2.5 transition-colors ${isProfileComplete ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#F6F7F9] hover:bg-[#E5E7EB] border-[#E5E7EB] text-[#4B5563]'}`}>
              {isProfileComplete ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
              <div>
                <div className="font-semibold text-[#0B0B0F]">2. Complete profile</div>
                <div className="text-[11px] text-[#4B5563]">{isProfileComplete ? 'Bio & skills recorded' : 'Add bio, avatar & skills'}</div>
              </div>
            </Link>

            <button type="button" onClick={() => setIsTopUpModalOpen(true)} className={`p-2.5 rounded-[8px] border text-xs flex items-center gap-2.5 text-left cursor-pointer transition-colors ${isFunded ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#F6F7F9] hover:bg-[#E5E7EB] border-[#E5E7EB] text-[#4B5563]'}`}>
              {isFunded ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
              <div>
                <div className="font-semibold text-[#0B0B0F]">3. Add funds</div>
                <div className="text-[11px] text-[#4B5563]">{isFunded ? 'POL / USDC available' : 'Fund wallet for escrow'}</div>
              </div>
            </button>

            <Link to={isClientView ? "/jobs/post" : "/jobs"} className={`p-2.5 rounded-[8px] border text-xs flex items-center gap-2.5 transition-colors ${hasActivity ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]' : 'bg-[#F6F7F9] hover:bg-[#E5E7EB] border-[#E5E7EB] text-[#4B5563]'}`}>
              {hasActivity ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
              <div>
                <div className="font-semibold text-[#0B0B0F]">4. {isClientView ? 'Post first job' : 'Apply to a job'}</div>
                <div className="text-[11px] text-[#4B5563]">{hasActivity ? 'First contract active' : isClientView ? 'Create an escrow job' : 'Submit your first proposal'}</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Profile Completeness Bar Card */}
        <div className="md:col-span-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 space-y-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-semibold text-sm text-[#0B0B0F]">Profile completeness</h3>
              <span className="text-xs font-semibold text-[#0047AB]">{completenessScore}%</span>
            </div>
            <p className="text-xs text-[#4B5563]">
              Clients and freelancers with complete profiles get 4x more engagement.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0047AB] h-full rounded-full transition-all duration-300"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            {completenessScore < 100 && (
              <Link
                to="/profile"
                className="text-xs text-[#0047AB] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>Complete remaining details</span>
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. RESUME LAST OPENED WORKSPACE (IF AVAILABLE) ──────────────── */}
      {lastOpenedJob && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#4B5563] flex items-center gap-1">
                <Clock size={12} /> Recent workspace
              </span>
              <StatusBadge status={lastOpenedJob.status} />
            </div>
            <h4 className="font-semibold text-base text-[#0B0B0F]">{lastOpenedJob.title}</h4>
            <div className="text-xs text-[#4B5563] flex items-center gap-2">
              <span>Budget:</span>
              <Amount amount={lastOpenedJob.amountEth || lastOpenedJob.amountUsdc || '0'} token={lastOpenedJob.paymentTokenSymbol || 'POL'} showFiat={true} />
            </div>
          </div>

          <Link
            to={`/workspace?jobId=${lastOpenedJob.id}`}
            className="bg-[#0047AB] hover:bg-[#003882] text-white px-4 py-2 rounded-[8px] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <span>Open workspace</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── 4. NEEDS YOUR ATTENTION SECTION ─────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-[#0B0B0F]">Needs your attention</h3>
            {attentionItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold">
                {attentionItems.length}
              </span>
            )}
          </div>
          <span className="text-xs text-[#4B5563]">Active action items</span>
        </div>

        {attentionItems.length === 0 ? (
          <div className="py-6 text-center text-[#4B5563] space-y-1">
            <CheckCircle2 size={24} className="mx-auto text-[#10B981] mb-2" />
            <div className="font-medium text-sm text-[#0B0B0F]">All caught up</div>
            <div className="text-xs">No pending milestones or proposals requiring immediate action.</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#0B0B0F]">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563]">{item.description}</p>
                </div>

                <Link
                  to={item.actionPath}
                  className="bg-[#0047AB] hover:bg-[#003882] text-white px-3.5 py-1.5 rounded-[8px] text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors shrink-0"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. FUNDING & WALLET ACTIONS CARD ────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-5 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-[#0047AB]" />
            <h3 className="font-semibold text-sm text-[#0B0B0F]">Escrow funding account</h3>
            <span className="text-[11px] text-[#047857] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] border border-[#A7F3D0]">
              Live sync
            </span>
          </div>
          <p className="text-xs text-[#4B5563]">
            Funds available on Polygon Mainnet for escrow deposits and transaction gas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="p-2.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex items-center gap-3">
            <div className="text-xs">
              <span className="text-[#4B5563] block text-[11px]">Native Token</span>
              <span className="font-semibold text-[#0B0B0F]">{balanceNative} POL</span>
            </div>
            <div className="h-6 w-px bg-[#E5E7EB]" />
            <div className="text-xs">
              <span className="text-[#4B5563] block text-[11px]">Dollar Escrow</span>
              <span className="font-semibold text-[#0047AB]">${balanceUsdc} USDC</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <WatchButton id="get-paid-cash-out" onOpen={openVideo} />
            <button
              type="button"
              onClick={handleRefreshBalances}
              disabled={isRefreshingBalances}
              title="Refresh balances"
              className="p-2 border border-[#E5E7EB] hover:bg-[#F6F7F9] rounded-[8px] text-[#4B5563] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isRefreshingBalances ? 'animate-spin text-[#0047AB]' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setIsTopUpModalOpen(true)}
              className="bg-[#0047AB] hover:bg-[#003882] text-white px-4 py-2 rounded-[8px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <DollarSign size={13} />
              <span>Top-up</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. STATS & COBALT-ONLY ACTIVITY CHART ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Stats Row */}
        <div className="md:col-span-8 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="text-xs text-[#4B5563]">Completed jobs</div>
              <div className="text-2xl font-semibold text-[#0B0B0F] mt-1">
                {isClientView ? completedClientJobs.length : completedFreelanceJobs.length}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="text-xs text-[#4B5563]">
                {isClientView ? 'Total spent' : 'Net earned'}
              </div>
              <div className="text-2xl font-semibold text-[#0047AB] mt-1">
                ${isClientView ? clientTotalSpent.toFixed(2) : (userScores.totalVolume * 0.975).toFixed(2)}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] col-span-2 sm:col-span-1">
              <div className="text-xs text-[#4B5563]">Reputation score</div>
              <div className="text-2xl font-semibold text-[#0B0B0F] mt-1">
                {userScores.totalPoints}
              </div>
            </div>
          </div>

          {/* Simple Cobalt-Only Activity Chart */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-semibold text-sm text-[#0B0B0F]">
                {isClientView ? 'Escrow volume distribution' : 'Monthly milestone settlement'}
              </h3>
              <span className="text-xs text-[#6B7280]">Settled volume (POL / USDC)</span>
            </div>

            {/* Simple Bar Visualization in Cobalt (#0047AB) Only */}
            <div className="h-36 flex items-end justify-between gap-3 pt-4 px-2">
              {[
                { label: 'May', val: 30 },
                { label: 'Jun', val: 55 },
                { label: 'Jul', val: 40 },
                { label: 'Aug', val: 75 },
                { label: 'Sep', val: 90 },
                { label: 'Oct', val: 65 },
              ].map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] text-[#4B5563] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {item.val}%
                  </div>
                  <div
                    className="w-full max-w-[40px] bg-[#0047AB] rounded-t-[4px] hover:bg-[#003882] transition-all"
                    style={{ height: `${item.val}%` }}
                  />
                  <span className="text-xs text-[#4B5563] font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column: Badges & GitHub E-KYC */}
        <div className="md:col-span-4 space-y-5 text-left">
          {/* Soulbound Attestations Card */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <div className="flex items-center gap-2">
                <Award size={15} className="text-[#0047AB]" />
                <h3 className="font-semibold text-sm text-[#0B0B0F]">Verified work certificates</h3>
              </div>
              <Badge variant="neutral">{unlockedBadges.length + completedFreelanceJobs.length}</Badge>
            </div>

            {completedFreelanceJobs.length > 0 && (() => {
              const latestJob = completedFreelanceJobs[0];
              const sbtId = latestJob.sbtTokenId || getDeterministicSbtId(latestJob.id);
              const svgThumb = generateCertificateSvg({
                tokenId: sbtId,
                variant: 'work',
                jobTitle: latestJob.title,
                recipientAddress: latestJob.freelancer || activeAddress,
                clientAddress: latestJob.client || '',
                amount: latestJob.amountEth || latestJob.amountUsdc || 100,
                tokenSymbol: latestJob.paymentTokenSymbol || 'POL',
                completedAt: latestJob.completedAt || Date.now(),
                contractAddress: CONTRACTS.ReputationSBT,
              });
              const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgThumb)}`;

              return (
                <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E5E7EB] space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/certificate/${sbtId}`}
                      className="shrink-0 w-16 h-16 rounded-[6px] overflow-hidden border border-[#E5E7EB] bg-white hover:border-[#0047AB] transition-transform hover:scale-105 shadow-xs"
                      title="View certificate"
                    >
                      <img src={svgDataUri} alt={`SBT #${sbtId}`} className="w-full h-full object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#0047AB] bg-[#EFF6FF] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                          PL-SBT #{sbtId}
                        </span>
                        <span className="text-[10px] text-[#166534] font-medium bg-[#DCFCE7] px-1.5 py-0.2 rounded">
                          ERC-5192
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#0B0B0F] truncate" title={latestJob.title}>
                        {latestJob.title}
                      </h4>
                      <Link
                        to={`/certificate/${sbtId}`}
                        className="text-[11px] text-[#0047AB] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>View certificate</span>
                        <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {unlockedBadges.length === 0 && completedFreelanceJobs.length === 0 ? (
              <div className="p-4 bg-[#F6F7F9] rounded-[8px] text-center text-xs text-[#4B5563]">
                No certificates minted yet. Complete your first contract to earn an ERC-721 Soulbound token.
              </div>
            ) : (
              <div className="space-y-2">
                {unlockedBadges.map((badge, index) => (
                  <div key={index} className="p-2.5 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB] space-y-0.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0B0B0F]">
                      <span>{badge.name}</span>
                      <span className="font-mono text-[10px] text-[#0047AB]">{badge.token}</span>
                    </div>
                    <p className="text-[11px] text-[#4B5563]">{badge.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/profile"
                className="py-2 text-xs font-medium text-center text-[#0047AB] border border-[#E5E7EB] hover:bg-[#F6F7F9] rounded-[8px] block transition-colors"
              >
                All certificates
              </Link>
              <Link
                to="/reputation"
                className="py-2 text-xs font-medium text-center text-[#4B5563] hover:text-[#0B0B0F] border border-[#E5E7EB] hover:bg-[#F6F7F9] rounded-[8px] block transition-colors"
              >
                Rank (#{myRank})
              </Link>
            </div>
          </div>

          {/* GitHub Verification Card */}
          <GithubEkycCard
            bytecodeMatrix={bytecodeMatrix}
            userProfile={userProfile}
            onboardingLink
          />
        </div>
      </div>

      {/* ── 7. REPOSITORY CONTRACTS LIST (POSTED / ONGOING) ─────────────── */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="font-semibold text-base text-[#0B0B0F]">
            {isClientView ? `Posted Escrow Jobs (${myClientJobs.length})` : `Active Contracts (${myFreelancerJobs.length})`}
          </h3>
          {isClientView && (
            <Link to="/jobs/post" className="text-xs font-medium text-[#0047AB] hover:underline flex items-center gap-1">
              <PlusCircle size={13} />
              <span>Post new job</span>
            </Link>
          )}
        </div>

        {(isClientView ? myClientJobs : myFreelancerJobs).length === 0 ? (
          <div className="py-8 text-center text-[#4B5563] space-y-2">
            <p className="text-xs">No contracts in this view.</p>
            <Link
              to={isClientView ? "/jobs/post" : "/jobs"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0047AB] hover:bg-[#003882] text-white text-xs font-medium transition-colors"
            >
              {isClientView ? 'Post an escrow job' : 'Find contracts'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(isClientView ? myClientJobs : myFreelancerJobs).map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="p-4 bg-[#F6F7F9] hover:bg-[#E5E7EB]/50 border border-[#E5E7EB] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-[#0B0B0F] hover:text-[#0047AB] transition-colors">
                    {job.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                    <Amount amount={job.amountEth || job.amountUsdc || '0'} token={job.paymentTokenSymbol || 'POL'} showFiat={true} />
                    <span>•</span>
                    <span>{job.category}</span>
                    <span>•</span>
                    <span>{job.applications?.length || 0} proposals</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <ArrowUpRight size={16} className="text-[#4B5563]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insufficient Funds Modal */}
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

      {/* Video Modal */}
      <VideoModal
        id={activeVideoId}
        isOpen={isVideoModalOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </PageContainer>
  );
};

export default Dashboard;
