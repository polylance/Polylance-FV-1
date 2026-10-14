import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, isDemoOrMockJob, MOCK_ADDRESSES_TO_PURGE, isMockOrDemoProfile } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Trophy, 
  ChevronLeft,
  ChevronRight,
  Bookmark, 
  Scale, 
  Zap, 
  Search,
  Info,
  Calendar,
  Github,
  Briefcase,
  ListChecks,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';

import { calculateReputationScores, formatEarnings } from '../utils/reputation';
import { truncateAddress } from '../utils/formatters';
import { PageContainer } from '../components/layout/PageContainer';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';
import { REPUTATION_TASKS } from '../config/reputationTasks';
import { TierEmblem, RankEmblem, CompactTierChip } from '../components/common/TierEmblem';
import { Modal } from '../components/overlay/Modal';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All roles' },
  { value: 'engineer', label: 'Engineers' },
  { value: 'developer', label: 'Developers' },
  { value: 'arbitrator', label: 'Arbitrators' },
];

interface LeaderboardItem {
  name: string;
  role: string;
  points: number;
  completedJobsCount: number;
  totalVolume: number;
  successRate: string;
  earnings: string;
  isUser: boolean;
  avatar: string;
  address: string;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  githubVerified: boolean;
  rankNumber: number;
  displayRank: string;
  isTied: boolean;
}

export const Reputation: React.FC = () => {
  const { address, isConnected, connectWallet, isArbitrator, reputationCount: onChainReputationCount } = useWeb3();
  const { profiles, jobs } = usePolyLanceData();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedBadge, setSelectedBadge] = useState<{
    tier: string;
    pointsRequired: number;
    perks: string[];
    description: string;
  } | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Retrieve user profile case-insensitively
  const userProfileKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const userProfile = userProfileKey ? profiles[userProfileKey] : null;

  const judgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase();

  // Current connected user stats
  const userScores = calculateReputationScores(
    address || '',
    jobs,
    userProfile,
    onChainReputationCount || userProfile?.reputationSbtCount || 0,
    isArbitrator,
    judgeAddr
  );

  const escrowPoints = userScores.escrowPoints;
  const multisigPoints = userScores.arbitrationPoints;
  const govPoints = userScores.attestationBonus;
  const eventPoints = userScores.eventBonusPoints || 0;
  const totalPoints = userScores.totalPoints;
  const userCompletedJobsCount = userScores.completedJobsCount;

  // Connected user's strictly scoped completed deliverables
  const userCompletedDeliverables = useMemo(() => {
    if (!address) return [];
    const lower = address.toLowerCase();
    return (jobs || []).filter(
      (j) => j.status === 'Completed' && j.freelancer?.toLowerCase() === lower
    );
  }, [jobs, address]);

  // Connected user's strictly scoped arbitrated disputes
  const userResolvedDisputes = useMemo(() => {
    if (!address) return [];
    const lower = address.toLowerCase();
    return (jobs || []).filter(
      (j) => j.dispute?.resolved && j.dispute.judge?.toLowerCase() === lower
    );
  }, [jobs, address]);

  // Combine registered freelance talent and active protocol participants
  const allParticipantProfiles: UserProfile[] = useMemo(() => {
    const map = new Map<string, UserProfile>();

    // 1. Registered user profiles (only freelancers, arbitrators, or accounts with freelance work)
    Object.values(profiles || {}).forEach((p) => {
      if (p && p.address) {
        const lower = p.address.toLowerCase().trim();
        if (MOCK_ADDRESSES_TO_PURGE.has(lower) || isMockOrDemoProfile(p)) return;
        if (p.role === 'client') {
          const hasFreelanceDeliverable = (jobs || []).some(
            (j) => j.freelancer?.toLowerCase().trim() === lower
          );
          if (!hasFreelanceDeliverable) return;
        }
        map.set(lower, p);
      }
    });

    // 2. Active freelancers from real jobs
    (jobs || []).filter((j) => !isDemoOrMockJob(j)).forEach((j) => {
      if (j.freelancer) {
        const lower = j.freelancer.toLowerCase().trim();
        if (!MOCK_ADDRESSES_TO_PURGE.has(lower) && !isMockOrDemoProfile({ address: lower }) && !map.has(lower)) {
          map.set(lower, {
            address: lower,
            displayName: `${lower.slice(0, 6)}...${lower.slice(-4)}`,
            bio: 'Verified Web3 Talent on PolyLance protocol.',
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${lower}`,
            ipfsHash: '',
            skills: ['Smart Contracts', 'Polygon'],
            githubVerified: false,
            role: 'freelancer',
            reputationSbtCount: 0,
          });
        }
      }
    });

    // Ensure the current connected wallet is registered as a participant if connected
    if (address) {
      const userLower = address.toLowerCase().trim();
      if (!map.has(userLower) && !MOCK_ADDRESSES_TO_PURGE.has(userLower)) {
        map.set(userLower, {
          address: userLower,
          displayName: `${userLower.slice(0, 6)}...${userLower.slice(-4)}`,
          bio: 'PolyLance participant',
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${userLower}`,
          ipfsHash: '',
          skills: ['Web3 Engineer'],
          githubVerified: false,
          role: 'freelancer',
          reputationSbtCount: 0,
        });
      }
    }

    return Array.from(map.values());
  }, [profiles, jobs, address]);

  // Compute leaderboard across all registered profiles
  const leaderboardData: LeaderboardItem[] = useMemo(() => {
    const list = allParticipantProfiles
      .filter((profile) => {
        if (profile.role === 'client') {
          const hasFreelanceDeliverable = (jobs || []).some(
            (j) => j.freelancer?.toLowerCase().trim() === profile.address.toLowerCase().trim()
          );
          if (!hasFreelanceDeliverable) return false;
        }
        return true;
      })
      .map((profile) => {
        const isYou = profile.address?.toLowerCase().trim() === address?.toLowerCase().trim();
        const lower = profile.address?.toLowerCase().trim();
        const isJudge = lower === judgeAddr || profile.role === 'judge' || (isYou && Boolean(isArbitrator));
        const sbtCount = profile.reputationSbtCount || (isYou ? (onChainReputationCount || 0) : 0);

        const scores = calculateReputationScores(
          profile.address,
          jobs,
          profile,
          sbtCount,
          isJudge,
          judgeAddr
        );

        const roleDisplay = profile.title 
          ? profile.title
          : profile.role === 'judge'
            ? 'Arbitrator'
            : profile.skills && profile.skills.length > 0
              ? `${profile.skills[0]} Engineer`
              : 'Web3 Engineer';

        const rawName = profile.displayName && profile.displayName !== 'Anonymous PolyLancer'
          ? profile.displayName
          : profile.githubUsername
            ? `@${profile.githubUsername}`
            : `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;

        const itemTier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 
          scores.totalPoints >= 1000 ? 'Diamond' :
          scores.totalPoints >= 500 ? 'Gold' :
          scores.totalPoints >= 200 ? 'Silver' : 'Bronze';

        return {
          name: isYou ? `${rawName} (You)` : rawName,
          role: roleDisplay,
          points: scores.totalPoints,
          completedJobsCount: scores.completedJobsCount,
          totalVolume: scores.totalVolume,
          successRate: `${scores.successRatePercent}%`,
          earnings: formatEarnings(scores.totalVolume),
          isUser: isYou,
          avatar: profile.avatarUrl || (profile.githubUsername ? `https://github.com/${profile.githubUsername}.png` : `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.address}`),
          address: profile.address,
          tier: itemTier,
          githubVerified: Boolean(profile.githubVerified)
        };
      });

    // Tie-break rule: Points -> Completed Jobs -> Volume -> Address
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.completedJobsCount !== a.completedJobsCount) return b.completedJobsCount - a.completedJobsCount;
      if (b.totalVolume !== a.totalVolume) return b.totalVolume - a.totalVolume;
      return (a.address || '').localeCompare(b.address || '');
    });

    // Assign rank and detect ties (formatted as "T5")
    return list.map((item, idx, arr) => {
      const isTied = arr.some(
        (other, oIdx) =>
          oIdx !== idx &&
          other.points === item.points &&
          other.completedJobsCount === item.completedJobsCount &&
          other.totalVolume === item.totalVolume
      );
      const firstTieIdx = arr.findIndex(
        (other) =>
          other.points === item.points &&
          other.completedJobsCount === item.completedJobsCount &&
          other.totalVolume === item.totalVolume
      );
      const displayRank = item.points === 0 ? '—' : isTied ? `T${firstTieIdx + 1}` : `${idx + 1}`;
      return {
        ...item,
        rankNumber: item.points === 0 ? 0 : idx + 1,
        displayRank,
        isTied
      };
    });
  }, [allParticipantProfiles, address, jobs, judgeAddr, isArbitrator, onChainReputationCount]);

  // Find user's dynamic rank index
  const userRankIndex = leaderboardData.findIndex((item) => item.isUser);
  const userRank = userRankIndex !== -1 && totalPoints > 0 ? userRankIndex + 1 : 0;
  const userLeaderboardItem = userRankIndex !== -1 ? leaderboardData[userRankIndex] : null;

  // Determine active tier based on real fixed point thresholds:
  // Bronze: 0-199 pts, Silver: 200-499 pts, Gold: 500-999 pts, Diamond: 1000+ pts
  let activeTier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
  let ptsLeft = 200 - totalPoints;
  let nextTierName = 'Silver Tier';

  if (totalPoints >= 1000) {
    activeTier = 'Diamond';
    nextTierName = 'Top Standing';
    ptsLeft = 0;
  } else if (totalPoints >= 500) {
    activeTier = 'Gold';
    nextTierName = 'Diamond Tier';
    ptsLeft = 1000 - totalPoints;
  } else if (totalPoints >= 200) {
    activeTier = 'Silver';
    nextTierName = 'Gold Tier';
    ptsLeft = 500 - totalPoints;
  } else {
    activeTier = 'Bronze';
    nextTierName = 'Silver Tier';
    ptsLeft = Math.max(0, 200 - totalPoints);
  }

  // Filter and paginate leaderboard rows
  const filteredLeaderboard = useMemo(() => {
    return leaderboardData.filter((item) => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = selectedRoleFilter === 'all' ||
        (selectedRoleFilter === 'engineer' && item.role.toLowerCase().includes('engineer')) ||
        (selectedRoleFilter === 'developer' && item.role.toLowerCase().includes('developer')) ||
        (selectedRoleFilter === 'arbitrator' && item.role.toLowerCase().includes('arbitrat'));

      return matchesSearch && matchesRole;
    });
  }, [leaderboardData, searchQuery, selectedRoleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  const firstPlace = leaderboardData[0] || null;
  const secondPlace = leaderboardData[1] || null;
  const thirdPlace = leaderboardData[2] || null;

  const openTierDetails = (tier: string) => {
    if (tier === 'Diamond') {
      setSelectedBadge({
        tier: 'Diamond Tier',
        pointsRequired: 1000,
        description: 'The pinnacle of on-chain engineering reputation. Unlocked at 1000+ verified protocol points.',
        perks: ['0% platform escrow fee', 'Priority DAO dispute arbitration', 'Verified badge in talent discovery', 'Access to high-value escrow contracts'],
      });
    } else if (tier === 'Gold') {
      setSelectedBadge({
        tier: 'Gold Tier',
        pointsRequired: 500,
        description: 'Elite verified builders with consistent track records and verified deliverable completions.',
        perks: ['1.5% platform fee discount', 'Fast-tracked milestone reviews', 'Gold work certificate credential on Polygon'],
      });
    } else if (tier === 'Silver') {
      setSelectedBadge({
        tier: 'Silver Tier',
        pointsRequired: 200,
        description: 'Demonstrated completion of verified smart contract escrow jobs.',
        perks: ['Public cryptographic attestation', 'Search ranking boost over unverified accounts', 'Access to multi-milestone jobs'],
      });
    } else {
      setSelectedBadge({
        tier: 'Bronze Tier',
        pointsRequired: 0,
        description: 'Starting tier for all registered on-chain participants.',
        perks: ['Profile registration', 'Ability to apply to open escrow jobs', 'Verified wallet badge'],
      });
    }
    setIsBadgeModalOpen(true);
  };

  // Ring arc calculations (circumference for radius 56 = 351.86)
  const ringRadius = 56;
  const circumference = 2 * Math.PI * ringRadius;
  // Progress towards 1000 pts ceiling
  const ceilingProgress = Math.min(1, Math.max(0, totalPoints / 1000));
  const strokeDashoffset = circumference - (ceilingProgress * circumference);

  return (
    <PageContainer className="space-y-8 py-6 text-[#0B0B0F]">

      {/* =========================================================================
          HERO: THE STANDING CARD (#0B0B0F, 140px segmented ring, tabular numbers)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-[#0B0B0F] rounded-xl text-white border border-[#1E2330] shadow-sm">
        {/* Cobalt hairline accent line */}
        <div className="h-1 w-full bg-[#0047AB]" />

        <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Column: Avatar/Emblem, Tabular Score, Rank callout, Tier pill */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative shrink-0">
              <TierEmblem tier={activeTier} size={96} isCurrent={true} />
              {userRank > 0 && userRank <= 3 && (
                <div className="absolute -bottom-2 -right-2">
                  <RankEmblem rank={userRank} size={32} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <span className="text-[11px] font-semibold tracking-wider text-[#8892A0] uppercase">
                  Reputation Score
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#EAF1FB] text-[#0047AB]">
                  {activeTier} Tier
                </span>
                <span className="text-[12px] font-mono text-[#8892A0]">
                  Polygon Mainnet
                </span>
              </div>

              {/* 52px bold white score */}
              <div className="text-[52px] font-bold font-mono tracking-tight leading-none text-white tabular-nums">
                {totalPoints}
              </div>

              {/* Rank Callout */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[13px] text-[#C9DAF2]">
                {Boolean(address) && totalPoints > 0 ? (
                  <>
                    <RankEmblem rank={userRank} size={20} />
                    <span>Rank <strong className="text-white font-mono">{userLeaderboardItem?.displayRank || `#${userRank}`}</strong> of {leaderboardData.length} verified builders</span>
                  </>
                ) : (
                  <span className="text-[#8892A0]">
                    {address ? 'Complete escrow jobs to calculate your rank' : 'Connect wallet to inspect personal standing'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 140px Segmented Progress Ring */}
          <div className="relative w-[140px] h-[140px] shrink-0 flex items-center justify-center">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="rotate-[-90deg] select-none"
              aria-label="Tier progress ring"
            >
              {/* Background remainder arc (#1E2330) */}
              <circle
                cx="70"
                cy="70"
                r={ringRadius}
                fill="none"
                stroke="#1E2330"
                strokeWidth="8"
              />
              {/* Completed cobalt arc (#0047AB) */}
              <circle
                cx="70"
                cy="70"
                r={ringRadius}
                fill="none"
                stroke="#0047AB"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Ring Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              {activeTier === 'Diamond' ? (
                <>
                  <span className="text-[10px] font-semibold tracking-wider text-[#8892A0] uppercase">
                    Pinnacle
                  </span>
                  <span className="text-[13px] font-bold text-white font-mono mt-0.5">
                    MAX TIER
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-semibold text-[#8892A0] uppercase tracking-wider">
                    Next Tier
                  </span>
                  <div className="flex items-center gap-1 font-mono font-bold text-white text-[14px] mt-0.5 tabular-nums">
                    <span>+{ptsLeft}</span>
                    <span className="text-[#7FA3DB]">pts</span>
                  </div>
                  <span className="text-[10px] text-[#C9DAF2] mt-0.5 font-medium truncate max-w-[100px]">
                    {nextTierName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Hairline dividers, tabular numbers (Jobs completed, On-time delivery, Dispute win rate) */}
        <div className="border-t border-[#1E2330] grid grid-cols-3 divide-x divide-[#1E2330] bg-[#0B0B0F]/80">
          <div className="p-4 sm:px-8 text-center">
            <span className="text-[11px] font-semibold text-[#8892A0] uppercase tracking-wider block">
              Jobs completed
            </span>
            <span className="text-[18px] sm:text-[22px] font-bold font-mono text-white tabular-nums block mt-0.5">
              {userCompletedJobsCount}
            </span>
          </div>
          <div className="p-4 sm:px-8 text-center">
            <span className="text-[11px] font-semibold text-[#8892A0] uppercase tracking-wider block">
              On-time delivery
            </span>
            <span className="text-[18px] sm:text-[22px] font-bold font-mono text-white tabular-nums block mt-0.5">
              100%
            </span>
          </div>
          <div className="p-4 sm:px-8 text-center">
            <span className="text-[11px] font-semibold text-[#8892A0] uppercase tracking-wider block">
              Dispute win rate
            </span>
            <span className="text-[18px] sm:text-[22px] font-bold font-mono text-white tabular-nums block mt-0.5">
              100%
            </span>
          </div>
        </div>
      </section>


      {/* =========================================================================
          TIER LADDER TRACK & POINT BREAKDOWN
         ========================================================================= */}
      <section className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0B0B0F] tracking-tight">
            Tier Progression Ladder
          </h2>
          <p className="text-[13px] text-[#4B5563] mt-0.5">
            Fixed reputation milestones unlock verifiable protocol privileges and fee discounts
          </p>
        </div>

        {/* Horizontal Ladder Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[
            { name: 'Bronze', pts: 0, maxPts: 199 },
            { name: 'Silver', pts: 200, maxPts: 499 },
            { name: 'Gold', pts: 500, maxPts: 999 },
            { name: 'Diamond', pts: 1000, maxPts: '1000+' },
          ].map((tierItem) => {
            const isCurrent = activeTier === tierItem.name;
            const isUnlocked = totalPoints >= tierItem.pts;
            const isLocked = !isUnlocked;

            return (
              <div
                key={tierItem.name}
                onClick={() => openTierDetails(tierItem.name)}
                className={`relative p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[170px] ${
                  isCurrent 
                    ? 'border-[#0047AB] bg-[#EAF1FB]/40 ring-1 ring-[#0047AB]' 
                    : isUnlocked 
                      ? 'border-[#E5E7EB] bg-white hover:border-[#7FA3DB]' 
                      : 'border-[#E5E7EB] bg-[#F6F7F9]/60 opacity-80 hover:opacity-100'
                }`}
              >
                {/* "You are here" indicator chip */}
                {isCurrent && (
                  <div className="absolute -top-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0047AB] text-white shadow-xs">
                    You are here
                  </div>
                )}

                <div className="pt-2">
                  <TierEmblem 
                    tier={tierItem.name} 
                    size={48} 
                    isCurrent={isCurrent} 
                    isLocked={isLocked} 
                  />
                </div>

                <div className="space-y-0.5 mt-2">
                  <span className="font-semibold text-[14px] text-[#0B0B0F] block">
                    {tierItem.name}
                  </span>
                  <span className="text-[12px] font-mono text-[#4B5563] tabular-nums block">
                    {tierItem.pts}+ pts
                  </span>
                </div>

                <div className="mt-2 w-full pt-2 border-t border-[#E5E7EB]">
                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-[#0047AB]">Active Tier</span>
                  ) : isUnlocked ? (
                    <span className="text-[11px] font-medium text-[#4B5563]">Unlocked</span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#8892A0] flex items-center justify-center gap-1">
                      <Lock size={11} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grouped Point Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Verified Deliverables */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                <Briefcase size={14} className="text-[#0047AB]" />
                <span>Verified Deliverables</span>
              </span>
              <span className="font-mono font-bold text-[#0047AB] tabular-nums">+{escrowPoints} pts</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              +25 base pts per escrow milestone + volume multiplier
            </p>
          </div>

          {/* On-Time Delivery */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#0047AB]" />
                <span>On-Time Delivery</span>
              </span>
              <span className="font-mono font-bold text-[#0047AB] tabular-nums">+25 pts</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              Awarded for milestones completed within deadline
            </p>
          </div>

          {/* Dispute Won / Arbitration */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                <Scale size={14} className="text-[#0047AB]" />
                <span>Tribunal Rulings</span>
              </span>
              <span className="font-mono font-bold text-[#0047AB] tabular-nums">+{multisigPoints} pts</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              +15 pts per verified dispute resolved as arbitrator
            </p>
          </div>

          {/* GitHub eKYC */}
          <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                <Github size={14} className="text-[#0B0B0F]" />
                <span>GitHub Verification</span>
              </span>
              <span className="font-mono font-bold text-[#0047AB] tabular-nums">+{govPoints} pts</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">
              +100 pts for cryptographic OAuth developer attestation
            </p>
          </div>
        </div>

        {/* View All Tasks Trigger */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsAllTasksModalOpen(true)}
            className="px-4 py-2 text-[13px] font-semibold text-[#0047AB] bg-[#EAF1FB] hover:bg-[#C9DAF2] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ListChecks size={15} />
            <span>View All Reputation Tasks ({REPUTATION_TASKS.length})</span>
          </button>
        </div>
      </section>


      {/* =========================================================================
          LEADERBOARD REDESIGN: PODIUM & 56px TABLE ROWS
         ========================================================================= */}
      <section className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#0047AB]" />
              <h2 className="text-[18px] font-semibold text-[#0B0B0F]">
                Global Leaderboard
              </h2>
            </div>
            <p className="text-[12px] text-[#4B5563]">
              Ranked by verified on-chain score, completed jobs, and total escrow volume
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F6F7F9] p-1 rounded-lg border border-[#E5E7EB]">
            {(['all', 'monthly', 'weekly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer capitalize ${
                  filterPeriod === period
                    ? 'bg-white text-[#0B0B0F] shadow-xs border border-[#E5E7EB] font-semibold'
                    : 'text-[#4B5563] hover:text-[#0B0B0F]'
                }`}
              >
                {period === 'all' ? 'All time' : period === 'monthly' ? 'This month' : 'This week'}
              </button>
            ))}
          </div>
        </div>

        {/* Stepped Podium (Order: Rank 2 on Left, Rank 1 in Center, Rank 3 on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
          
          {/* Rank 2 (Left, Height 200px) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center flex flex-col justify-between order-2 md:order-1 min-h-[200px]">
            <div className="flex justify-between items-center">
              <RankEmblem rank={2} size={28} />
              <CompactTierChip tier={secondPlace?.tier || 'Silver'} />
            </div>

            <div className="flex flex-col items-center space-y-2 py-2">
              {secondPlace ? (
                <>
                  <Link to={`/profile/${secondPlace.address}`} className="relative hover:opacity-90">
                    <img
                      src={secondPlace.avatar}
                      alt={secondPlace.name}
                      className="w-12 h-12 rounded-full border border-[#E5E7EB] object-cover"
                    />
                  </Link>
                  <div>
                    <Link to={`/profile/${secondPlace.address}`} className="font-semibold text-[14px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline block truncate max-w-[180px]">
                      {secondPlace.name}
                    </Link>
                    <span className="text-[12px] text-[#4B5563] block truncate max-w-[180px]">{secondPlace.role}</span>
                  </div>
                </>
              ) : (
                <div className="text-[#8892A0] text-sm py-4">Open Podium Spot</div>
              )}
            </div>

            <div className="grid grid-cols-3 border-t border-[#E5E7EB] pt-2 text-[12px]">
              <div>
                <span className="text-[#8892A0] block text-[11px]">Points</span>
                <span className="font-bold text-[#0B0B0F] font-mono tabular-nums">{secondPlace?.points || 0}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{secondPlace?.successRate || '0%'}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{secondPlace?.earnings || '$0'}</span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Center, Height 240px, Cobalt Border) */}
          <div className="bg-white border-2 border-[#0047AB] rounded-xl p-5 text-center flex flex-col justify-between order-1 md:order-2 min-h-[240px] shadow-sm">
            <div className="flex justify-between items-center">
              <RankEmblem rank={1} size={36} />
              <CompactTierChip tier={firstPlace?.tier || 'Diamond'} />
            </div>

            <div className="flex flex-col items-center space-y-2 py-2">
              {firstPlace ? (
                <>
                  <Link to={`/profile/${firstPlace.address}`} className="relative hover:opacity-90">
                    <img
                      src={firstPlace.avatar}
                      alt={firstPlace.name}
                      className="w-16 h-16 rounded-full border-2 border-[#0047AB] object-cover"
                    />
                  </Link>
                  <div>
                    <Link to={`/profile/${firstPlace.address}`} className="font-bold text-[15px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline block truncate max-w-[200px]">
                      {firstPlace.name}
                    </Link>
                    <span className="text-[12px] text-[#4B5563] block truncate max-w-[200px]">{firstPlace.role}</span>
                  </div>
                </>
              ) : (
                <div className="text-[#8892A0] text-sm py-4">Open Podium Spot</div>
              )}
            </div>

            <div className="grid grid-cols-3 border-t border-[#E5E7EB] pt-2 text-[12px]">
              <div>
                <span className="text-[#8892A0] block text-[11px]">Points</span>
                <span className="font-bold text-[#0047AB] font-mono tabular-nums text-[14px]">{firstPlace?.points || 0}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{firstPlace?.successRate || '0%'}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{firstPlace?.earnings || '$0'}</span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Right, Height 180px) */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center flex flex-col justify-between order-3 min-h-[180px]">
            <div className="flex justify-between items-center">
              <RankEmblem rank={3} size={28} />
              <CompactTierChip tier={thirdPlace?.tier || 'Bronze'} />
            </div>

            <div className="flex flex-col items-center space-y-2 py-2">
              {thirdPlace ? (
                <>
                  <Link to={`/profile/${thirdPlace.address}`} className="relative hover:opacity-90">
                    <img
                      src={thirdPlace.avatar}
                      alt={thirdPlace.name}
                      className="w-12 h-12 rounded-full border border-[#E5E7EB] object-cover"
                    />
                  </Link>
                  <div>
                    <Link to={`/profile/${thirdPlace.address}`} className="font-semibold text-[14px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline block truncate max-w-[180px]">
                      {thirdPlace.name}
                    </Link>
                    <span className="text-[12px] text-[#4B5563] block truncate max-w-[180px]">{thirdPlace.role}</span>
                  </div>
                </>
              ) : (
                <div className="text-[#8892A0] text-sm py-4">Open Podium Spot</div>
              )}
            </div>

            <div className="grid grid-cols-3 border-t border-[#E5E7EB] pt-2 text-[12px]">
              <div>
                <span className="text-[#8892A0] block text-[11px]">Points</span>
                <span className="font-bold text-[#0B0B0F] font-mono tabular-nums">{thirdPlace?.points || 0}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{thirdPlace?.successRate || '0%'}</span>
              </div>
              <div>
                <span className="text-[#8892A0] block text-[11px]">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums">{thirdPlace?.earnings || '$0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter, and Tie-break Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Search builder or address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] placeholder:text-[#8892A0]"
              />
            </div>

            <div className="w-40">
              <PolyLanceSelect
                value={selectedRoleFilter}
                onChange={(val) => {
                  setSelectedRoleFilter(val);
                  setCurrentPage(1);
                }}
                options={ROLE_OPTIONS}
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-[#4B5563] bg-[#F6F7F9] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
            <Info size={13} className="text-[#0047AB] shrink-0" />
            <span>Deterministic sorting: Points, then jobs, then volume</span>
          </div>
        </div>

        {/* 56px TABLE ROWS (Desktop) */}
        <div className="hidden md:block overflow-x-auto border border-[#E5E7EB] rounded-xl">
          <table className="w-full border-collapse text-left text-[13px] text-[#0B0B0F]">
            <thead>
              <tr className="bg-[#F6F7F9] border-b border-[#E5E7EB] text-[12px] font-semibold text-[#4B5563] h-11">
                <th className="px-4 text-center w-16">Rank</th>
                <th className="px-4 min-w-[240px]">Developer</th>
                <th className="px-4 w-44">Tier</th>
                <th className="px-4 text-center w-28">Success Rate</th>
                <th className="px-4 text-center w-32">Volume</th>
                <th className="px-4 text-right w-44">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#4B5563]">
                    <Trophy size={32} className="mx-auto text-[#8892A0] mb-2 opacity-50" />
                    <p className="font-semibold text-[#0B0B0F] text-[14px]">No developers match your filters</p>
                    <p className="text-[12px] text-[#4B5563] mt-1">
                      Try clearing the search query or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr 
                    key={row.address}
                    className={`h-14 hover:bg-[#F6F7F9] transition-colors ${
                      row.isUser ? 'bg-[#EAF1FB]/50 font-medium' : ''
                    }`}
                  >
                    {/* Rank (RankEmblem for 1-3, tabular numbers for others, T5 for ties) */}
                    <td className="px-4 text-center font-mono font-medium text-[13px] tabular-nums">
                      {row.rankNumber > 0 && row.rankNumber <= 3 && !row.isTied ? (
                        <div className="flex justify-center">
                          <RankEmblem rank={row.rankNumber} size={24} />
                        </div>
                      ) : (
                        <span className={row.isTied ? 'font-bold text-[#0047AB]' : ''}>
                          {row.displayRank}
                        </span>
                      )}
                    </td>
                    
                    {/* Developer Name, Address, GitHub */}
                    <td className="px-4">
                      <div className="flex items-center gap-3">
                        <Link to={`/profile/${row.address}`} className="relative shrink-0 hover:opacity-90">
                          <img
                            src={row.avatar}
                            alt={row.name}
                            className={`w-8 h-8 rounded-full object-cover border ${
                              row.isUser ? 'border-[#0047AB]' : 'border-[#E5E7EB]'
                            }`}
                          />
                        </Link>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link 
                              to={`/profile/${row.address}`} 
                              className={`truncate hover:underline text-[13px] ${
                                row.isUser ? 'text-[#0047AB] font-bold' : 'text-[#0B0B0F] font-semibold'
                              }`}
                            >
                              {row.name}
                            </Link>
                            {row.githubVerified && (
                              <span title="GitHub verified" className="inline-flex shrink-0">
                                <Github size={12} className="text-[#0B0B0F]" />
                              </span>
                            )}
                            {row.isUser && (
                              <span className="bg-[#0047AB] text-white text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#4B5563] font-mono block">
                            {truncateAddress(row.address)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Tier badge with CompactTierChip */}
                    <td className="px-4">
                      <CompactTierChip tier={row.tier} />
                    </td>
                    
                    {/* Success Rate */}
                    <td className="px-4 text-center font-mono text-[13px] text-[#0B0B0F] tabular-nums">
                      {row.successRate}
                    </td>
                    
                    {/* Volume */}
                    <td className="px-4 text-center font-mono text-[13px] text-[#0B0B0F] tabular-nums">
                      {row.earnings}
                    </td>
                    
                    {/* Points with inline cobalt miniature bar */}
                    <td className="px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-16 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden hidden lg:block">
                          <div
                            style={{ width: `${Math.min(100, (row.points / 1000) * 100)}%` }}
                            className="h-full bg-[#0047AB] rounded-full"
                          />
                        </div>
                        <span className="font-mono font-bold text-[#0047AB] text-[13px] tabular-nums">
                          {row.points} pts
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE TABLE CARDS */}
        <div className="md:hidden space-y-3">
          {paginatedRows.length === 0 ? (
            <div className="p-8 text-center text-[#4B5563] bg-[#F6F7F9] rounded-lg border border-[#E5E7EB]">
              <Trophy size={32} className="mx-auto text-[#8892A0] mb-2 opacity-50" />
              <p className="font-semibold text-[#0B0B0F] text-[14px]">No developers found</p>
              <p className="text-[12px] text-[#4B5563] mt-1">Try resetting search filters.</p>
            </div>
          ) : (
            paginatedRows.map((row) => (
              <div
                key={row.address}
                className={`p-4 rounded-xl border bg-white ${row.isUser ? 'border-[#0047AB] bg-[#EAF1FB]/30' : 'border-[#E5E7EB]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center font-mono font-semibold text-[12px] shrink-0 text-[#0B0B0F] tabular-nums">
                      {row.displayRank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/profile/${row.address}`} className={`font-semibold text-[13px] truncate ${row.isUser ? 'text-[#0047AB]' : 'text-[#0B0B0F]'}`}>
                          {row.name}
                        </Link>
                        {row.isUser && (
                          <span className="bg-[#0047AB] text-white text-[10px] px-1.5 py-0.2 rounded font-medium">YOU</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#4B5563] font-mono block">
                        {truncateAddress(row.address)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-[13px] font-bold text-[#0047AB] block tabular-nums">{row.points} pts</span>
                    <span className="text-[11px] text-[#4B5563] font-mono tabular-nums">{row.earnings}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E5E7EB] text-[12px]">
                  <CompactTierChip tier={row.tier} />
                  <div className="text-[#4B5563]">
                    Success: <strong className="text-[#0B0B0F] font-mono tabular-nums">{row.successRate}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            <p className="text-[12px] text-[#4B5563]">
              Showing {Math.min(filteredLeaderboard.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredLeaderboard.length, currentPage * pageSize)} of {filteredLeaderboard.length} builders
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-[12px] font-medium border border-[#E5E7EB] rounded-lg text-[#0B0B0F] hover:bg-[#F6F7F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <span className="text-[12px] text-[#4B5563] px-2 font-mono tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 text-[12px] font-medium border border-[#E5E7EB] rounded-lg text-[#0B0B0F] hover:bg-[#F6F7F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sticky "Your Position" Bar at bottom when connected */}
      {isConnected && address && userLeaderboardItem && (
        <div className="sticky bottom-4 z-20 bg-[#0B0B0F] text-white p-3.5 sm:px-6 rounded-xl border border-[#1E2330] shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={userLeaderboardItem.avatar}
              alt="You"
              className="w-8 h-8 rounded-full border border-[#0047AB] object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[13px] text-white truncate">
                  Your Standing
                </span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#0047AB] text-white font-mono tabular-nums">
                  {userLeaderboardItem.displayRank}
                </span>
              </div>
              <span className="text-[11px] text-[#8892A0] font-mono block">
                {truncateAddress(address)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block">
              <CompactTierChip tier={activeTier} className="bg-white/10 text-white border-white/10" />
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-[14px] text-white block tabular-nums">
                {totalPoints} pts
              </span>
              <span className="text-[11px] text-[#8892A0] font-mono tabular-nums">
                {formatEarnings(userScores.totalVolume)}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* =========================================================================
          TIER DETAILS MODAL (Portal Modal)
         ========================================================================= */}
      <Modal
        isOpen={isBadgeModalOpen && Boolean(selectedBadge)}
        onClose={() => setIsBadgeModalOpen(false)}
        title={selectedBadge?.tier ? `${selectedBadge.tier} Audit` : 'Tier Audit'}
        subtitle={address ? `On-chain ledger for ${truncateAddress(address)}` : 'On-chain reputation point verification'}
        maxWidth="lg"
      >
        {selectedBadge && (
          <div className="space-y-5">
            {/* Summary Banner */}
            <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider block">
                  Your Current Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[#0047AB] tabular-nums">
                    {totalPoints}
                  </span>
                  <span className="text-xs text-[#4B5563]">pts</span>
                  <span className="text-xs text-[#8892A0]">•</span>
                  <span className="text-xs font-semibold text-[#0B0B0F]">
                    {activeTier} Tier
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-semibold text-[#4B5563] block">
                  Threshold Requirement
                </span>
                <div className="inline-flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-[#0B0B0F] font-mono tabular-nums">
                    {selectedBadge.pointsRequired}+ pts
                  </span>
                  {totalPoints >= selectedBadge.pointsRequired ? (
                    <span className="text-[11px] bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2] px-2 py-0.5 rounded-md font-semibold">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[11px] bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB] px-2 py-0.5 rounded-md font-medium tabular-nums">
                      {selectedBadge.pointsRequired - totalPoints} pts to unlock
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Where your points come from */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0F]">
                Verified Points Breakdown
              </h4>

              {!isConnected || !address ? (
                <div className="p-4 rounded-xl bg-[#EAF1FB] border border-[#C9DAF2] text-xs space-y-2">
                  <p className="text-[#0047AB] font-medium leading-relaxed">
                    PolyLance scopes completed milestones and attestation scores to your authenticated wallet. Connect your wallet to inspect your verified breakdown.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBadgeModalOpen(false);
                      connectWallet();
                    }}
                    className="mt-2 px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#003A8C] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {/* Completed Milestone Deliveries */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                      <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                        <Briefcase size={13} className="text-[#0047AB]" />
                        <span>Completed Deliverables ({userCompletedDeliverables.length})</span>
                      </span>
                      <span className="font-mono font-bold text-[#0047AB] tabular-nums">
                        +{escrowPoints + userScores.volumePoints} pts
                      </span>
                    </div>

                    {userCompletedDeliverables.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {userCompletedDeliverables.map((j) => (
                          <div
                            key={j.id}
                            className="p-2 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between gap-2"
                          >
                            <span className="font-medium text-[#0B0B0F] truncate">{j.title}</span>
                            <span className="font-mono font-bold text-[#0047AB] shrink-0 tabular-nums">+25 pts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[#4B5563] text-[11px] py-1 italic">
                        No completed freelance milestones recorded yet for this wallet.
                      </div>
                    )}
                  </div>

                  {/* GitHub Verification */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github size={14} className="text-[#0B0B0F]" />
                      <div>
                        <span className="font-semibold text-[#0B0B0F] block">GitHub Developer Footprint</span>
                        <span className="text-[11px] text-[#4B5563]">
                          {userProfile?.githubVerified && userProfile?.githubUsername
                            ? `Verified @${userProfile.githubUsername}`
                            : 'Unverified (Connect via Settings)'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#0047AB] tabular-nums">
                      +{govPoints} pts
                    </span>
                  </div>

                  {/* Tribunal Rulings */}
                  {userScores.arbitrationPoints > 0 && (
                    <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-[#0047AB]" />
                        <div>
                          <span className="font-semibold text-[#0B0B0F] block">Tribunal Rulings</span>
                          <span className="text-[11px] text-[#4B5563]">
                            {userResolvedDisputes.length} disputes arbitrated
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#0047AB] tabular-nums">
                        +{userScores.arbitrationPoints} pts
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Perks */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0F]">
                {selectedBadge.tier} Privileges & Guarantees
              </h4>
              <div className="space-y-1.5">
                {selectedBadge.perks.map((perk, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] text-xs text-[#0B0B0F]"
                  >
                    <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(false)}
                className="px-4 py-2 bg-[#0047AB] hover:bg-[#003A8C] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        )}
      </Modal>


      {/* =========================================================================
          ALL TASKS MODAL (Portal Modal)
         ========================================================================= */}
      <Modal
        isOpen={isAllTasksModalOpen}
        onClose={() => setIsAllTasksModalOpen(false)}
        title="Protocol Reputation Tasks"
        subtitle="Complete verified tasks to increase your on-chain reputation score"
        maxWidth="xl"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {REPUTATION_TASKS.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border ${
                task.isActive ? 'bg-white border-[#E5E7EB]' : 'bg-[#F6F7F9] border-[#E5E7EB] opacity-60'
              } space-y-1.5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[13px] font-semibold text-[#0B0B0F]">{task.title}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2]">
                      {task.category.replace('_', ' ')}
                    </span>
                    {!task.isActive && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#4B5563] mt-1">{task.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[14px] font-bold font-mono text-[#0047AB] block tabular-nums">
                    +{task.basePoints}
                  </span>
                  <span className="text-[10px] text-[#4B5563]">
                    {task.maxPoints ? `max ${task.maxPoints}` : 'pts'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] mt-4">
          <span className="text-[12px] text-[#4B5563]">
            {REPUTATION_TASKS.filter(t => t.isActive).length} active tasks on Polygon
          </span>
          <button
            type="button"
            onClick={() => setIsAllTasksModalOpen(false)}
            className="px-4 py-2 bg-[#0047AB] hover:bg-[#003A8C] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </Modal>

    </PageContainer>
  );
};
