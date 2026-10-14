import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { UserProfile, Job } from '../types';
import { truncateAddress, formatTimeAgo, getDeterministicSbtId, getCanonicalCertificateId } from '../utils/formatters';
import { scoreGithubUser, getUserBytecodeMatrix } from '../utils/githubOracle';
import { calculateReputationScores, getReputationTier } from '../utils/reputation';
import { getJobInactivityStatus } from '../utils/inactivity';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { GroupedList, GroupedRow } from '../components/common/GroupedList';
import { CompactEmptyState } from '../components/common/CompactEmptyState';
import { StatCard } from '../components/common/Card';
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
import { PolygonIcon, UsdcIcon, UsdtIcon, TokenIcon } from '../components/TokenIcon';
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
  const rawProfile = userProfileKey ? profiles[userProfileKey] : null;
  const userProfile = (rawProfile || {
    displayName: activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Anonymous User',
    bio: 'No biography has been written yet.',
    avatarUrl: activeAddress ? `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress.toLowerCase()}` : '',
    skills: [],
    reputationSbtCount: 0,
  }) as UserProfile;

  // Sanitize any lingering unsplash demo avatars
  if (userProfile.avatarUrl && userProfile.avatarUrl.includes('unsplash.com')) {
    userProfile.avatarUrl = activeAddress ? `https://api.dicebear.com/7.x/identicon/svg?seed=${activeAddress.toLowerCase()}` : '';
  }

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

  // Dynamic ranking strictly based on verified freelance reputation points
  const rankedProfiles = Object.values(profiles)
    .map((p) => {
      const scores = calculateReputationScores(p.address, jobs, p);
      return { address: p.address, points: scores.totalPoints, completedJobsCount: scores.completedJobsCount };
    })
    .filter((p) => p.points > 0 && p.completedJobsCount > 0)
    .sort((a, b) => b.points - a.points);

  const myRankIdx = rankedProfiles.findIndex((p) => p.address.toLowerCase() === activeAddress.toLowerCase());
  const myRank = myRankIdx !== -1 ? `#${myRankIdx + 1}` : (userScores.totalPoints > 0 ? `#${rankedProfiles.length + 1}` : 'Unranked');

  // Real monthly settlement activity derivation from actual completed jobs
  const monthlyActivityData = useMemo(() => {
    const relevantJobs = isClientView ? completedClientJobs : completedFreelanceJobs;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    const months: { label: string; year: number; monthIndex: number; volume: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        volume: 0,
      });
    }

    relevantJobs.forEach((job) => {
      const ts = job.completedAt || job.submittedAt || job.createdAt;
      if (!ts) return;
      const jobDate = new Date(ts);
      const target = months.find(
        (m) => m.year === jobDate.getFullYear() && m.monthIndex === jobDate.getMonth()
      );
      if (target) {
        const paidFraction = job.dispute?.resolved ? ((job.dispute.rulingBps ?? 0) / 10000) : 1.0;
        const amt = parseFloat(job.amountUsdc || job.amountEth || '0') * paidFraction;
        target.volume += amt;
      }
    });

    const maxVolume = Math.max(...months.map((m) => m.volume), 0);

    return {
      months: months.map((m) => ({
        label: m.label,
        volume: m.volume,
        amount: `$${m.volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        heightPercent: maxVolume > 0 && m.volume > 0 ? Math.max(Math.round((m.volume / maxVolume) * 100), 8) : 0,
      })),
      maxVolume,
      hasActivity: maxVolume > 0,
    };
  }, [isClientView, completedClientJobs, completedFreelanceJobs]);

  // First-run checklist items calculation
  const isWalletConnected = Boolean(activeAddress);
  const isProfileComplete = Boolean(userProfile.bio && userProfile.bio !== 'No biography has been written yet.' && (userProfile.skills?.length || 0) > 0);
  const isFunded = parseFloat(balanceNative || '0') > 0 || parseFloat(balanceUsdc || '0') > 0;
  const hasActivity = myClientJobs.length > 0 || myApplications.length > 0 || myFreelancerJobs.length > 0;
  const isChecklistComplete = isWalletConnected && isProfileComplete && isFunded && hasActivity;

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

  // Freelancer: Offers waiting for acceptance
  myFreelancerJobs.filter(j => j.status === 'Selected' && !j.freelancerAgreedTerms).forEach(j => {
    attentionItems.push({
      id: `offer-${j.id}`,
      title: j.title,
      description: 'You have been selected! Review project terms and accept or decline the offer.',
      actionLabel: 'Review offer',
      actionPath: `/workspace?jobId=${j.id}`,
      badge: 'Offer received',
      badgeColor: 'bg-[#FDF3DC] text-[#C2610C]',
    });
  });

  // Client: Selected candidate status
  myClientJobs.filter(j => j.status === 'Selected').forEach(j => {
    if (j.freelancerAgreedTerms) {
      attentionItems.push({
        id: `fund-${j.id}`,
        title: j.title,
        description: 'Candidate accepted your offer! Deposit escrow into smart contract.',
        actionLabel: 'Deposit escrow',
        actionPath: `/workspace?jobId=${j.id}`,
        badge: 'Ready to fund',
        badgeColor: 'bg-[#E7EEF9] text-[#0047AB]',
      });
    } else {
      attentionItems.push({
        id: `awaiting-acceptance-${j.id}`,
        title: j.title,
        description: 'Offer sent to candidate. Waiting for freelancer to accept terms.',
        actionLabel: 'View status',
        actionPath: `/workspace?jobId=${j.id}`,
        badge: 'Offer pending',
        badgeColor: 'bg-slate-100 text-slate-700',
      });
    }
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

  // User's authentic completed jobs with on-chain attestations (freelancer + client)
  const allUserCompletedJobs = useMemo(() => {
    if (!activeAddress) return [];
    const lowerUser = activeAddress.toLowerCase();
    const map = new Map<string, Job>();

    jobs.forEach((j) => {
      if (
        (j.status === 'Completed' || j.status === 'Submitted') &&
        (j.freelancer?.toLowerCase() === lowerUser || j.client?.toLowerCase() === lowerUser)
      ) {
        map.set(j.id.toLowerCase(), j);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.completedAt || a.submittedAt || a.createdAt || 0;
      const timeB = b.completedAt || b.submittedAt || b.createdAt || 0;
      return timeB - timeA;
    });
  }, [jobs, activeAddress]);

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

  type DashboardHubTab = 'active' | 'offers' | 'applications' | 'open' | 'completed';
  const [contractsTab, setContractsTab] = useState<DashboardHubTab>('active');

  const pendingOffers = useMemo(() => {
    return myFreelancerJobs.filter(j => j.status === 'Selected');
  }, [myFreelancerJobs]);

  const openClientJobs = useMemo(() => {
    return myClientJobs.filter(j => j.status === 'Open' || (j.status === 'Selected' && !j.freelancerAgreedTerms));
  }, [myClientJobs]);

  const filteredContracts = useMemo(() => {
    if (contractsTab === 'completed') {
      return (isClientView ? myClientJobs : myFreelancerJobs).filter(j => j.status === 'Completed');
    }
    if (contractsTab === 'offers') {
      return pendingOffers;
    }
    if (contractsTab === 'open') {
      return openClientJobs;
    }
    const list = isClientView ? myClientJobs : myFreelancerJobs;
    return list.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled');
  }, [isClientView, myClientJobs, myFreelancerJobs, contractsTab, pendingOffers, openClientJobs]);

  return (
    <PageContainer>
      {/* ── 0. WELCOME TOUR (DISMISSIBLE) ───────────────────────────────── */}
      {showWelcomeCard && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-4 mb-6 shadow-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
              <h3 className="font-semibold text-sm text-[#0B0B0F]">
                Welcome to PolyLance: 15-Second Tour
              </h3>
            </div>
            <button
              type="button"
              onClick={handleDismissWelcome}
              className="text-[#6B7280] hover:text-[#0B0B0F] text-xs font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="max-w-xl pt-3">
            <VideoSlot id="welcome-15s" />
          </div>
        </div>
      )}

      {/* ── 1. CLEAN PAGE HEADER ────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${rawDisplayName} • ${tierInfo.tier} tier • Polygon Mainnet`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hire / Work Segmented Control */}
            <div className="inline-flex p-0.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs font-medium">
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

            {/* Role-based primary action */}
            {isClientView ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/jobs/post')}
                icon={<PlusCircle size={14} />}
              >
                Post a job
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/jobs')}
                icon={<Search size={14} />}
              >
                Find jobs
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
            >
              Edit profile
            </Button>
          </div>
        }
      />

      {/* ── 2. TWO-COLUMN MAIN + RAIL LAYOUT ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        {/* MAIN COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Getting Started Checklist as Inset Grouped List (Hides automatically upon completion) */}
          {!isChecklistComplete && (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-[#0B0B0F]">Getting Started Checklist</h3>
                  <p className="text-xs text-[#4B5563]">Four quick steps to transact safely on PolyLance.</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
                  {[isWalletConnected, isProfileComplete, isFunded, hasActivity].filter(Boolean).length} of 4 complete
                </span>
              </div>

              <GroupedList dense>
                <GroupedRow
                  title="1. Connect wallet"
                  subtitle="Connected to Polygon Mainnet"
                  leading={isWalletConnected ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
                  trailing={<span className="text-xs text-[#4B5563]">{isWalletConnected ? 'Ready' : 'Pending'}</span>}
                />
                <GroupedRow
                  title="2. Complete profile"
                  subtitle={isProfileComplete ? 'Bio and skills recorded' : 'Add bio, avatar and skills'}
                  leading={isProfileComplete ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
                  onClick={() => navigate('/profile')}
                />
                <GroupedRow
                  title="3. Add funds"
                  subtitle={isFunded ? 'POL / USDC available' : 'Fund wallet for escrow'}
                  leading={isFunded ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
                  onClick={() => setIsTopUpModalOpen(true)}
                />
                <GroupedRow
                  title={isClientView ? '4. Post first job' : '4. Apply to a job'}
                  subtitle={hasActivity ? 'First contract active' : isClientView ? 'Create an escrow job' : 'Submit your first proposal'}
                  leading={hasActivity ? <CheckCircle2 size={16} className="text-[#10B981] shrink-0" /> : <Circle size={16} className="text-[#9CA3AF] shrink-0" />}
                  onClick={() => navigate(isClientView ? '/jobs/post' : '/jobs')}
                />
              </GroupedList>

              {/* Profile Completeness Compact Row (Hides at 100%) */}
              {completenessScore < 100 && (
                <div className="pt-2 flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-[#4B5563] shrink-0">Profile completeness: <strong className="text-[#0B0B0F]">{completenessScore}%</strong></span>
                    <div className="flex-1 bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden max-w-[180px]">
                      <div
                        className="bg-[#0047AB] h-full rounded-full transition-all duration-300"
                        style={{ width: `${completenessScore}%` }}
                      />
                    </div>
                  </div>
                  <Link to="/profile" className="text-[#0047AB] hover:underline font-medium shrink-0 flex items-center gap-1">
                    <span>Complete profile</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Resume Last Workspace (if available) */}
          {lastOpenedJob && (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#4B5563] flex items-center gap-1 font-medium">
                    <Clock size={12} /> Recent workspace
                  </span>
                  <StatusBadge status={lastOpenedJob.status} />
                </div>
                <h4 className="font-semibold text-sm text-[#0B0B0F]">{lastOpenedJob.title}</h4>
                <div className="text-xs text-[#4B5563] flex items-center gap-1.5">
                  <span>Budget:</span>
                  <Amount amount={lastOpenedJob.amountEth || lastOpenedJob.amountUsdc || '0'} token={lastOpenedJob.paymentTokenSymbol || 'POL'} showFiat={true} />
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/workspace?jobId=${lastOpenedJob.id}`)}
                icon={<ArrowRight size={14} />}
              >
                Open workspace
              </Button>
            </div>
          )}

          {/* Needs Your Attention */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-[#0B0B0F]">Needs your attention</h3>
                {attentionItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold">
                    {attentionItems.length}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#4B5563]">Active action items</span>
            </div>

            {attentionItems.length === 0 ? (
              <CompactEmptyState
                icon={CheckCircle2}
                title="All caught up"
                description="No pending milestones or proposals requiring immediate action."
              />
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                  >
                    <div className="space-y-0.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#0B0B0F]">{item.title}</span>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563]">{item.description}</p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(item.actionPath)}
                      icon={<ArrowRight size={12} />}
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Completed jobs"
              value={isClientView ? completedClientJobs.length : completedFreelanceJobs.length}
            />
            <StatCard
              label={isClientView ? 'Total spent' : 'Net earned'}
              value={`$${isClientView ? clientTotalSpent.toFixed(2) : (userScores.totalVolume * 0.975).toFixed(2)}`}
            />
            <StatCard
              label={isClientView ? 'Client patronage' : 'Reputation score'}
              value={isClientView ? `${completedClientJobs.length} jobs` : userScores.totalPoints}
            />
          </div>

          {/* Activity Chart with Dynamic Axis Labels & Real Hover Values */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <h3 className="font-semibold text-sm text-[#0B0B0F]">
                {isClientView ? 'Escrow volume distribution' : 'Monthly milestone settlement'}
              </h3>
              <span className="text-xs text-[#6B7280]">Settled volume (POL / USDC)</span>
            </div>

            <div className="flex gap-3 pt-3">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[11px] text-[#9CA3AF] py-1 text-right w-14 select-none tabular-nums font-mono">
                <span>${monthlyActivityData.maxVolume > 0 ? Math.round(monthlyActivityData.maxVolume).toLocaleString() : '0'}</span>
                <span>${monthlyActivityData.maxVolume > 0 ? Math.round(monthlyActivityData.maxVolume / 2).toLocaleString() : '0'}</span>
                <span>$0</span>
              </div>

              {/* Bar Visualization */}
              <div className="flex-1 h-36 flex items-end justify-between gap-3 border-l border-b border-[#E5E7EB] px-2 pb-1 relative">
                {!monthlyActivityData.hasActivity && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-[#9CA3AF] font-medium bg-white/90 px-2.5 py-1 rounded-[6px] border border-[#E5E7EB]/60">
                      No settled escrow activity in the past 6 months
                    </span>
                  </div>
                )}
                {monthlyActivityData.months.map((item) => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] text-[#4B5563] opacity-0 group-hover:opacity-100 transition-opacity font-mono tabular-nums whitespace-nowrap">
                      {item.amount}
                    </div>
                    <div
                      className={`w-full max-w-[36px] rounded-t-[4px] transition-all cursor-pointer ${
                        item.heightPercent > 0
                          ? 'bg-[#0047AB] hover:bg-[#003882]'
                          : 'bg-[#E5E7EB]/80 hover:bg-[#D1D5DB]'
                      }`}
                      style={{ height: `${Math.max(item.heightPercent, 2)}%` }}
                    />
                    <span className="text-xs text-[#4B5563] font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contracts Grouped List with Active | Completed Tabs */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-sm text-[#0B0B0F]">
                  {isClientView ? 'Client Project Hub' : 'Freelancer Contract Hub'}
                </h3>
                {/* Role-Specific Hub Tabs */}
                {!isClientView ? (
                  <div className="inline-flex p-0.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[6px] text-xs flex-wrap gap-0.5">
                    <button
                      type="button"
                      onClick={() => setContractsTab('active')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        contractsTab === 'active'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractsTab('offers')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        contractsTab === 'offers'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      <span>Offers</span>
                      {pendingOffers.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FDF3DC] text-[#C2610C] border border-[#F0D58C]">
                          {pendingOffers.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractsTab('applications')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        contractsTab === 'applications'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      <span>My Proposals</span>
                      {myApplications.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
                          {myApplications.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractsTab('completed')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        contractsTab === 'completed'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex p-0.5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[6px] text-xs flex-wrap gap-0.5">
                    <button
                      type="button"
                      onClick={() => setContractsTab('active')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        contractsTab === 'active'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Active Escrows
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractsTab('open')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                        contractsTab === 'open'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      <span>Posted Jobs</span>
                      {openClientJobs.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E7EEF9] text-[#0047AB] border border-[#D0E1F9]">
                          {openClientJobs.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractsTab('completed')}
                      className={`px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer ${
                        contractsTab === 'completed'
                          ? 'bg-white text-[#0047AB] shadow-xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#0B0B0F]'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                )}
              </div>

              {isClientView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/jobs/post')}
                  icon={<PlusCircle size={13} />}
                >
                  Post new job
                </Button>
              )}
            </div>

            {contractsTab === 'applications' ? (
              myApplications.length === 0 ? (
                <CompactEmptyState
                  title="No active applications"
                  description="Find open contracts on the marketplace and submit milestone proposals."
                  action={{
                    label: 'Browse marketplace',
                    onClick: () => navigate('/jobs'),
                  }}
                />
              ) : (
                <GroupedList>
                  {myApplications.map(({ job, ...app }, idx) => (
                    <GroupedRow
                      key={`${job.id}-${app.id || idx}`}
                      title={job.title}
                      subtitle={
                        <div className="flex items-center gap-2 text-xs text-[#4B5563] mt-0.5">
                          <Amount
                            amount={app.proposedAmountUsdc || job.amountEth || job.amountUsdc || '0'}
                            token={job.paymentTokenSymbol || 'POL'}
                            showFiat={true}
                          />
                          <span>•</span>
                          <span>Est: {app.estimatedDays || 7} days</span>
                          <span>•</span>
                          <span>{job.category}</span>
                        </div>
                      }
                      trailing={
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                            job.status === 'Selected' && job.freelancer?.toLowerCase() === activeAddress.toLowerCase()
                              ? 'bg-[#FDF3DC] text-[#C2610C] border border-[#F0D58C]'
                              : 'bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]'
                          }`}>
                            {job.status === 'Selected' && job.freelancer?.toLowerCase() === activeAddress.toLowerCase()
                              ? 'Offer received'
                              : 'Submitted proposal'}
                          </span>
                        </div>
                      }
                      onClick={() => navigate(
                        job.status === 'Selected' && job.freelancer?.toLowerCase() === activeAddress.toLowerCase()
                          ? `/workspace?jobId=${job.id}`
                          : `/jobs/${job.id}`
                      )}
                    />
                  ))}
                </GroupedList>
              )
            ) : filteredContracts.length === 0 ? (
              <CompactEmptyState
                title={
                  contractsTab === 'offers'
                    ? 'No pending job offers'
                    : contractsTab === 'open'
                    ? 'No open job listings'
                    : contractsTab === 'active'
                    ? 'No active contracts'
                    : 'No completed contracts'
                }
                description={
                  contractsTab === 'offers'
                    ? 'When clients review and select your proposals, offers will appear here for review.'
                    : isClientView
                    ? 'Post an escrow job to hire top verified talent.'
                    : 'Find contracts and submit milestone proposals.'
                }
                action={{
                  label: isClientView ? 'Post an escrow job' : 'Find contracts',
                  onClick: () => navigate(isClientView ? '/jobs/post' : '/jobs'),
                }}
              />
            ) : (
              <GroupedList>
                {filteredContracts.map((job) => (
                  <GroupedRow
                    key={job.id}
                    title={job.title}
                    subtitle={
                      <div className="flex items-center gap-2 text-xs text-[#4B5563] mt-0.5">
                        <Amount
                          amount={job.amountEth || job.amountUsdc || '0'}
                          token={job.paymentTokenSymbol || 'POL'}
                          showFiat={true}
                        />
                        <span>•</span>
                        <span>{job.category}</span>
                        <span>•</span>
                        <span>{job.applications?.length || 0} proposals</span>
                      </div>
                    }
                    trailing={<StatusBadge status={job.status} />}
                    onClick={() => {
                      if (job.status === 'Funded' || job.status === 'Selected' || job.status === 'Submitted' || job.status === 'Completed' || job.status === 'Disputed') {
                        navigate(`/workspace?jobId=${job.id}`);
                      } else {
                        navigate(`/jobs/${job.id}`);
                      }
                    }}
                  />
                ))}
              </GroupedList>
            )}
          </div>
        </div>

        {/* RIGHT RAIL (4 cols, sticky) */}
        <div className="lg:col-span-4 sticky top-[88px] space-y-6">
          {/* Escrow Funding Account Card */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-[#0047AB]" />
                <h3 className="font-semibold text-sm text-[#0B0B0F]">Escrow funding account</h3>
              </div>
              <span className="text-[10px] text-[#047857] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded-[4px] border border-[#A7F3D0]">
                Live sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#F6F7F9] p-3 rounded-[8px] border border-[#E5E7EB]">
              <div className="text-xs">
                <span className="text-[#4B5563] block text-[11px]">Native POL</span>
                <span className="font-semibold text-sm text-[#0B0B0F] tabular-nums">{balanceNative}</span>
              </div>
              <div className="text-xs">
                <span className="text-[#4B5563] block text-[11px]">Dollar Escrow</span>
                <span className="font-semibold text-sm text-[#0047AB] tabular-nums">${balanceUsdc}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBalances}
                disabled={isRefreshingBalances}
                icon={<RefreshCw size={13} className={isRefreshingBalances ? 'animate-spin text-[#0047AB]' : ''} />}
                className="w-full justify-center"
              >
                Sync
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center bg-[#0047AB] hover:bg-[#003882] text-white font-semibold shadow-xs"
                onClick={() => setIsTopUpModalOpen(true)}
                icon={<DollarSign size={13} />}
              >
                Top-up
              </Button>
            </div>
          </div>

          {/* Verified Work Certificates */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <div className="flex items-center gap-2">
                <Award size={15} className="text-[#0047AB]" />
                <h3 className="font-semibold text-sm text-[#0B0B0F]">Work certificates</h3>
              </div>
              <Badge variant="neutral">{allUserCompletedJobs.length}</Badge>
            </div>

            {allUserCompletedJobs.length === 0 ? (
              <p className="text-xs text-[#4B5563] py-2">
                No certificates issued yet. Complete a contract to generate verified on-chain attestations.
              </p>
            ) : (
              <GroupedList dense>
                {allUserCompletedJobs.slice(0, 4).map((j) => {
                  const isFreelancer = Boolean(activeAddress && j.freelancer?.toLowerCase() === activeAddress.toLowerCase());
                  const canonicalCertId = getCanonicalCertificateId(j.id, j.contractAddress);
                  const tokenAmt = parseFloat(j.amountUsdc || j.amountEth || '0');
                  const tokenSym = j.paymentTokenSymbol === 'MATIC' ? 'POL' : (j.paymentTokenSymbol || 'USDC');

                  return (
                    <GroupedRow
                      key={j.id}
                      title={j.title}
                      subtitle={`${tokenAmt.toLocaleString()} ${tokenSym} • ${isFreelancer ? 'Proof of Work' : 'Patronage'}`}
                      trailing={<ArrowUpRight size={13} className="text-[#6B7280]" />}
                      onClick={() => navigate(`/attestation/${j.id}`)}
                    />
                  );
                })}
              </GroupedList>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attestation')}
              >
                All certificates
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/reputation')}
              >
                Rank ({myRank})
              </Button>
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
