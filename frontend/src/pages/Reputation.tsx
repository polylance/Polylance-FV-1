import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, isDemoOrMockJob, MOCK_ADDRESSES_TO_PURGE, isMockOrDemoProfile } from '../context/PolyLanceDataContext';
import { UserProfile } from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Trophy, 
  Star, 
  Sparkles, 
  Lock, 
  ChevronLeft,
  ChevronRight,
  Bookmark, 
  Scale, 
  ShieldAlert, 
  Zap, 
  X,
  Search,
  Filter,
  Info,
  Award,
  Calendar,
  DollarSign,
  ExternalLink,
  Github,
  Building2,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { calculateReputationScores } from '../utils/reputation';
import { calculateReputationPercentile, toChecksumAddress, truncateAddress } from '../utils/formatters';
import { PageContainer } from '../components/layout/PageContainer';
import { PolyLanceSelect, SelectOption } from '../components/PolyLanceSelect';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All roles' },
  { value: 'engineer', label: 'Engineers' },
  { value: 'developer', label: 'Developers' },
  { value: 'arbitrator', label: 'Arbitrators' },
  { value: 'client', label: 'Clients' },
];

export const Reputation: React.FC = () => {
  const { address, isConnected, connectWallet, isArbitrator, currentRole, reputationCount: onChainReputationCount } = useWeb3();
  const { profiles, jobs, judges } = usePolyLanceData();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly'>('all');
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
  const [isBadgeSheetOpen, setIsBadgeSheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
  const totalPoints = userScores.totalPoints;
  const userCompletedJobsCount = userScores.completedJobsCount;

  // Connected user's strictly scoped completed deliverables (Data privacy protected)
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

  // Combine all registered profiles and active protocol participants (clients, freelancers, judges)
  const allParticipantProfiles: UserProfile[] = useMemo(() => {
    const map = new Map<string, UserProfile>();

    // 1. All explicitly registered user profiles
    Object.values(profiles || {}).forEach((p) => {
      if (p && p.address) {
        const lower = p.address.toLowerCase().trim();
        if (MOCK_ADDRESSES_TO_PURGE.has(lower) || isMockOrDemoProfile(p)) return;
        map.set(lower, p);
      }
    });

    // 2. Active freelancers and clients from real jobs
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
      if (j.client) {
        const lower = j.client.toLowerCase().trim();
        if (!MOCK_ADDRESSES_TO_PURGE.has(lower) && !isMockOrDemoProfile({ address: lower }) && !map.has(lower)) {
          map.set(lower, {
            address: lower,
            displayName: `${lower.slice(0, 6)}...${lower.slice(-4)}`,
            bio: 'Verified PolyLance Project Creator & Escrow Client.',
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${lower}`,
            ipfsHash: '',
            skills: ['Protocol Governance'],
            githubVerified: false,
            role: 'client',
            reputationSbtCount: 0,
          });
        }
      }
    });

    // 3. Decentralized DAO Judges
    (judges || []).forEach((j) => {
      if (j.address) {
        const lower = j.address.toLowerCase().trim();
        if (MOCK_ADDRESSES_TO_PURGE.has(lower) || isMockOrDemoProfile({ address: lower, displayName: j.name })) return;
        if (!map.has(lower)) {
          map.set(lower, {
            address: lower,
            displayName: j.name || `${lower.slice(0, 6)}...${lower.slice(-4)}`,
            bio: j.notes || 'Decentralized Tribunal Arbitrator.',
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${lower}`,
            ipfsHash: '',
            skills: ['Arbitration', 'Audit'],
            githubVerified: false,
            role: 'judge',
            reputationSbtCount: 0,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [profiles, jobs, judges]);

  // Compute leaderboard across all registered profiles with the unified reputation system
  const leaderboardData = useMemo(() => {
    const list = allParticipantProfiles
      .map((profile) => {
        const isYou = profile.address?.toLowerCase() === address?.toLowerCase();
        const lower = profile.address?.toLowerCase();
        const isJudge = lower === judgeAddr;

        const scores = calculateReputationScores(
          profile.address,
          jobs,
          profile,
          profile.reputationSbtCount || 0,
          isJudge,
          judgeAddr
        );

        const roleDisplay = profile.title 
          ? profile.title
          : profile.role === 'client'
            ? 'Protocol Client'
            : profile.role === 'judge'
              ? 'Tribunal Arbitrator'
              : profile.skills && profile.skills.length > 0
                ? `${profile.skills[0]} Engineer`
                : profile.primaryCategory === 'web3' 
                  ? 'Web3 Engineer' 
                  : profile.primaryCategory === 'frontend' 
                    ? 'Frontend Developer' 
                    : profile.primaryCategory === 'backend' 
                      ? 'Backend Developer' 
                      : 'Smart Contract Developer';

        const formatEarnings = (val: number): string => {
          if (!val || val <= 0) return '$0.0k';
          if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
          return `$${val.toFixed(1)}`;
        };

        const rawName = profile.displayName && profile.displayName !== 'Anonymous PolyLancer'
          ? profile.displayName
          : profile.githubUsername
            ? `@${profile.githubUsername}`
            : `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;

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
          address: profile.address
        };
      })
      .concat(
        address && !allParticipantProfiles.some(p => p.address?.toLowerCase() === address.toLowerCase())
          ? [
              {
                name: `${address.slice(0, 6)}...${address.slice(-4)} (You)`,
                role: isArbitrator ? 'Protocol Arbitrator' : currentRole === 'admin' ? 'DAO Admin' : 'Web3 Engineer',
                points: userScores.totalPoints,
                completedJobsCount: userScores.completedJobsCount,
                totalVolume: userScores.totalVolume,
                successRate: `${userScores.successRatePercent}%`,
                earnings: userScores.totalVolume > 0 ? (userScores.totalVolume >= 1000 ? `$${(userScores.totalVolume / 1000).toFixed(1)}k` : `$${userScores.totalVolume.toFixed(1)}`) : '$0.0k',
                isUser: true,
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
                address: address
              }
            ]
          : []
      );

    // Visible tie-break rule:
    // 1. Total Points (descending)
    // 2. Completed Jobs count (descending)
    // 3. Total Volume (descending)
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.completedJobsCount !== a.completedJobsCount) return b.completedJobsCount - a.completedJobsCount;
      return b.totalVolume - a.totalVolume;
    });

    // Assign rank and detect ties in points
    return list.map((item, idx, arr) => {
      // Check if another item has identical points, completions, and volume (genuine tie)
      const isTied = arr.some((other, oIdx) => oIdx !== idx && other.points === item.points && other.completedJobsCount === item.completedJobsCount && other.totalVolume === item.totalVolume);
      // Find first occurrence with this point count
      const firstTieIdx = arr.findIndex(other => other.points === item.points);
      const displayRank = isTied ? `T-${firstTieIdx + 1}` : `${idx + 1}`;
      return {
        ...item,
        rankNumber: idx + 1,
        displayRank,
        isTied
      };
    });
  }, [allParticipantProfiles, address, jobs, judgeAddr, isArbitrator, currentRole, userScores]);

  // Find user's dynamic rank index
  const userRankIndex = leaderboardData.findIndex((item) => item.isUser);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : 0;
  const userPercentile = calculateReputationPercentile(userRank, leaderboardData.length);

  // Determine active tier based on real fixed point thresholds:
  // Bronze: 0-99 pts, Silver: 100-299 pts, Gold: 300-799 pts, Diamond: 800+ pts
  let activeTier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
  let tierProgress = 0;
  let ptsLeft = 100 - totalPoints;
  let nextTierName = 'Silver Tier';
  let rankLabel = 'Unranked';

  if (totalPoints >= 800) {
    activeTier = 'Diamond';
    nextTierName = 'Top Standing';
    ptsLeft = 0;
    tierProgress = 100;
  } else if (totalPoints >= 300) {
    activeTier = 'Gold';
    nextTierName = 'Diamond Tier (800 pts)';
    ptsLeft = 800 - totalPoints;
    tierProgress = Math.min(100, Math.round(((totalPoints - 300) / 500) * 100));
  } else if (totalPoints >= 100) {
    activeTier = 'Silver';
    nextTierName = 'Gold Tier (300 pts)';
    ptsLeft = 300 - totalPoints;
    tierProgress = Math.min(100, Math.round(((totalPoints - 100) / 200) * 100));
  } else {
    activeTier = 'Bronze';
    nextTierName = 'Silver Tier (100 pts)';
    ptsLeft = Math.max(0, 100 - totalPoints);
    tierProgress = Math.min(100, Math.round((totalPoints / 100) * 100));
  }

  if (userRankIndex !== -1 && totalPoints > 0) {
    rankLabel = `#${userRankIndex + 1}`;
  } else {
    rankLabel = 'Unranked';
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
        (selectedRoleFilter === 'arbitrator' && item.role.toLowerCase().includes('arbitrat')) ||
        (selectedRoleFilter === 'client' && item.role.toLowerCase().includes('client'));

      return matchesSearch && matchesRole;
    });
  }, [leaderboardData, searchQuery, selectedRoleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaderboard.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, currentPage, pageSize]);

  const firstPlace = leaderboardData[0] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: '', successRate: '0%', earnings: '$0.0k', address: '', displayRank: '1' };
  const secondPlace = leaderboardData[1] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: '', successRate: '0%', earnings: '$0.0k', address: '', displayRank: '2' };
  const thirdPlace = leaderboardData[2] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: '', successRate: '0%', earnings: '$0.0k', address: '', displayRank: '3' };

  const openTierDetails = (tier: string) => {
    if (tier === 'Diamond') {
      setSelectedBadge({
        tier: 'Diamond League',
        pointsRequired: 800,
        description: 'The pinnacle of on-chain engineering reputation. Unlocked at 800+ verified points.',
        perks: ['0% platform escrow fee', 'Priority DAO dispute arbitration', 'Verified badge in client search results', 'Exclusive access to high-value escrow contracts'],
      });
    } else if (tier === 'Gold') {
      setSelectedBadge({
        tier: 'Gold League',
        pointsRequired: 300,
        description: 'Elite verified builders with consistent track records and verified deliverable completions.',
        perks: ['1.5% platform fee discount', 'Fast-tracked milestone reviews', 'Gold work certificate credential on Polygon'],
      });
    } else if (tier === 'Silver') {
      setSelectedBadge({
        tier: 'Silver League',
        pointsRequired: 100,
        description: 'Demonstrated completion of verified smart contract escrow jobs.',
        perks: ['Public cryptographic attestation', 'Search ranking boost over unverified accounts', 'Access to multi-milestone jobs'],
      });
    } else {
      setSelectedBadge({
        tier: 'Bronze League',
        pointsRequired: 0,
        description: 'Starting tier for all registered on-chain participants.',
        perks: ['Profile registration', 'Ability to apply to open escrow jobs', 'Verified wallet badge'],
      });
    }
    setIsBadgeSheetOpen(true);
  };

  const getRoleBadge = (role: string) => {
    return (
      <span className="text-[12px] px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB]">
        {role}
      </span>
    );
  };

  return (
    <PageContainer className="space-y-8 py-6 text-[#0B0B0F]">
      {/* Top Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tier Card (The Single Dark Hero Element on this page) */}
        <div className="md:col-span-2 relative overflow-hidden bg-[#0B0B0F] p-6 sm:p-8 rounded-xl text-white border border-[#0B0B0F] flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <span className="h-2 w-2 rounded-full bg-[#0047AB]" />
                <span className="text-[12px] text-white/80 font-medium">
                  Global reputation standing
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1 rounded-full text-[12px] font-medium text-white/80">
                <Sparkles size={13} className="text-white" />
                <span>Verified on Polygon</span>
              </div>
            </div>

            {/* Single-color headline (no two-tone or gradient) */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight pt-1">
              Verified Tier: {activeTier} League
            </h1>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
            {Boolean(address) && totalPoints > 0 ? (
              <div className="flex items-baseline gap-4">
                <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-mono">
                  {rankLabel}
                </span>
                <div className="space-y-0.5">
                  <span className="text-[14px] font-medium text-white/90 tracking-tight block">
                    of {leaderboardData.length} verified freelancers
                  </span>
                  <span className="text-[12px] text-white/60 block">
                    {userPercentile} percentile · Polygon mainnet
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-medium text-white/80 bg-white/10 px-2.5 py-0.5 rounded-md">
                    Status: Unranked
                  </span>
                  <span className="text-[12px] text-white/60">
                    Reputation index
                  </span>
                </div>
                <p className="text-[13px] text-white/80">
                  Connect your wallet to calculate your reputation rank on the leaderboard
                </p>
              </div>
            )}

            <div className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-lg flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                <Trophy size={16} />
              </div>
              <div>
                <span className="text-[13px] font-medium text-white block">{totalPoints} points</span>
                <span className="text-[12px] text-white/60 block">Reputation score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reputation Score Card - Clean white bordered card */}
        <div className="bg-white border border-[#E5E7EB] p-6 rounded-xl flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full border-2 border-[#E5E7EB] bg-[#F6F7F9] flex flex-col items-center justify-center p-3 relative">
            <span className="text-3xl font-semibold text-[#0B0B0F] tracking-tight">
              {totalPoints}
            </span>
            <span className="text-[12px] text-[#4B5563] font-medium mt-0.5">
              Points
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-[#0B0B0F]">
              Reputation score
            </h2>
            <p className="text-[12px] text-[#4B5563]">
              Calculated from verified escrow settlements and attestations
            </p>
          </div>

          <div className="w-full bg-[#F6F7F9] border border-[#E5E7EB] rounded-lg p-2.5 flex items-center justify-center gap-2">
            <Trophy size={14} className="text-[#0047AB]" />
            <span className="text-[12px] font-semibold text-[#0047AB]">
              {userPercentile}
            </span>
            <span className="text-[12px] text-[#4B5563]">
              percentile
            </span>
          </div>
        </div>
      </section>

      {/* Point Breakdown & Active League Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Point Breakdown */}
        <section className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0047AB] shrink-0">
              <Bookmark size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#0B0B0F]">
                Point breakdown
              </h2>
              <p className="text-[12px] text-[#4B5563]">
                Transparent scoring based on verified milestone completions and protocol rules
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Breakdown item 1 */}
            <div className="bg-[#F6F7F9] border border-[#E5E7EB] p-3.5 rounded-lg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-[#0B0B0F]">Successful escrow contracts</span>
                  <span className="font-semibold text-emerald-700">+{escrowPoints} pts</span>
                </div>
                <p className="text-[12px] text-[#4B5563]">
                  {userCompletedJobsCount > 0 
                    ? `Based on ${userCompletedJobsCount} completed escrow contract${userCompletedJobsCount !== 1 ? 's' : ''} (100 pts each).`
                    : 'Complete verified jobs to build your escrow success history.'}
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="flex-1 bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: totalPoints > 0 ? `${Math.round((escrowPoints / totalPoints) * 100)}%` : '0%' }}
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                    />
                  </div>
                  <span className="text-[12px] text-[#4B5563] font-medium shrink-0">
                    {totalPoints > 0 ? `${Math.round((escrowPoints / totalPoints) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 2 */}
            <div className="bg-[#F6F7F9] border border-[#E5E7EB] p-3.5 rounded-lg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0047AB] shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-[#0B0B0F]">Arbitration and dispute resolution</span>
                  <span className="font-semibold text-[#0047AB]">+{multisigPoints} pts</span>
                </div>
                <p className="text-[12px] text-[#4B5563]">
                  {multisigPoints > 0 
                    ? `Earned +${multisigPoints} pts from presiding over resolved disputes.`
                    : 'Acquire arbitrator credentials to earn dispute arbitration points.'}
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="flex-1 bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: totalPoints > 0 ? `${Math.round((multisigPoints / totalPoints) * 100)}%` : '0%' }}
                      className="bg-[#0047AB] h-full rounded-full transition-all duration-300" 
                    />
                  </div>
                  <span className="text-[12px] text-[#4B5563] font-medium shrink-0">
                    {totalPoints > 0 ? `${Math.round((multisigPoints / totalPoints) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 3 */}
            <div className="bg-[#F6F7F9] border border-[#E5E7EB] p-3.5 rounded-lg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Star size={16} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-[#0B0B0F]">GitHub developer verification</span>
                  <span className="font-semibold text-amber-700">+{govPoints} pts</span>
                </div>
                <p className="text-[12px] text-[#4B5563]">
                  {govPoints > 0 
                    ? `+${govPoints} pts from verified GitHub cryptographic attestation.`
                    : 'Verify your GitHub account to earn 50 bonus attestation points.'}
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="flex-1 bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: totalPoints > 0 ? `${Math.round((govPoints / totalPoints) * 100)}%` : '0%' }}
                      className="bg-amber-600 h-full rounded-full transition-all duration-300" 
                    />
                  </div>
                  <span className="text-[12px] text-[#4B5563] font-medium shrink-0">
                    {totalPoints > 0 ? `${Math.round((govPoints / totalPoints) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active League Sidebar */}
        <section className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0047AB] shrink-0">
              <Trophy size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#0B0B0F]">
                Tier thresholds
              </h2>
              <p className="text-[12px] text-[#4B5563]">
                Fixed point thresholds
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {/* Diamond Tier */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => openTierDetails('Diamond')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTierDetails('Diamond'); }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                activeTier === 'Diamond'
                  ? 'border-[#0047AB] bg-[#EFF6FF] ring-1 ring-[#0047AB]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#93C5FD] hover:bg-[#F0F9FF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0047AB] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy size={15} />
                </div>
                <div>
                  <span className="font-semibold text-[13px] text-[#0B0B0F] block">Diamond Tier</span>
                  <span className="text-[12px] text-[#4B5563]">800+ points required</span>
                </div>
              </div>
              {activeTier === 'Diamond' ? (
                <span className="text-[11px] bg-[#0047AB] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                  Current
                </span>
              ) : (
                <span className="text-[11px] text-[#4B5563] flex items-center gap-1 font-medium bg-[#F6F7F9] px-2 py-0.5 rounded border border-[#E5E7EB]">
                  <Lock size={12} />
                  <span>Inspect</span>
                </span>
              )}
            </div>

            {/* Gold Tier */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => openTierDetails('Gold')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTierDetails('Gold'); }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                activeTier === 'Gold'
                  ? 'border-[#D97706] bg-[#FFFBEB] ring-1 ring-[#D97706]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#FCD34D] hover:bg-[#FEFCE8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D97706] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Star size={15} />
                </div>
                <div>
                  <span className="font-semibold text-[13px] text-[#0B0B0F] block">Gold Tier</span>
                  <span className="text-[12px] text-[#4B5563]">300 - 799 points</span>
                </div>
              </div>
              {activeTier === 'Gold' ? (
                <span className="text-[11px] bg-[#D97706] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                  Current
                </span>
              ) : totalPoints >= 300 ? (
                <span className="text-[11px] text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0] font-medium">
                  Unlocked
                </span>
              ) : (
                <span className="text-[11px] text-[#4B5563] flex items-center gap-1 font-medium bg-[#F6F7F9] px-2 py-0.5 rounded border border-[#E5E7EB]">
                  <Lock size={12} />
                  <span>Inspect</span>
                </span>
              )}
            </div>

            {/* Silver Tier */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => openTierDetails('Silver')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTierDetails('Silver'); }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                activeTier === 'Silver'
                  ? 'border-[#475569] bg-[#F1F5F9] ring-1 ring-[#475569]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#475569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <span className="font-semibold text-[13px] text-[#0B0B0F] block">Silver Tier</span>
                  <span className="text-[12px] text-[#4B5563]">100 - 299 points</span>
                </div>
              </div>
              {activeTier === 'Silver' ? (
                <span className="text-[11px] bg-[#475569] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                  Current
                </span>
              ) : totalPoints >= 100 ? (
                <span className="text-[11px] text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0] font-medium">
                  Unlocked
                </span>
              ) : (
                <span className="text-[11px] text-[#4B5563] flex items-center gap-1 font-medium bg-[#F6F7F9] px-2 py-0.5 rounded border border-[#E5E7EB]">
                  <Lock size={12} />
                  <span>Inspect</span>
                </span>
              )}
            </div>

            {/* Bronze Tier */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => openTierDetails('Bronze')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTierDetails('Bronze'); }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                activeTier === 'Bronze'
                  ? 'border-[#B45309] bg-[#FFF7ED] ring-1 ring-[#B45309]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#FDBA74] hover:bg-[#FFFAF0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#B45309] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <span className="font-semibold text-[13px] text-[#0B0B0F] block">Bronze Tier</span>
                  <span className="text-[12px] text-[#4B5563]">0 - 99 points</span>
                </div>
              </div>
              {activeTier === 'Bronze' ? (
                <span className="text-[11px] bg-[#B45309] text-white px-2.5 py-0.5 rounded-full font-semibold shadow-xs">
                  Current
                </span>
              ) : (
                <span className="text-[11px] text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0] font-medium">
                  Unlocked
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-lg space-y-2 mt-2">
            <div className="flex justify-between items-center text-[12px] font-medium text-[#0B0B0F]">
              <span>Next tier progress</span>
              {ptsLeft > 0 ? (
                <span className="text-[#0047AB] font-semibold">{ptsLeft} pts to {nextTierName}</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Maximum tier achieved</span>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div 
                style={{ width: `${tierProgress}%` }}
                className="bg-[#0047AB] h-full rounded-full transition-all duration-300" 
              />
            </div>
          </div>
        </section>
      </div>

      {/* Global Leaderboard Container */}
      <section className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#0047AB]" />
              <h2 className="text-[18px] font-semibold text-[#0B0B0F]">
                Global freelancer leaderboard
              </h2>
            </div>
            <p className="text-[12px] text-[#4B5563]">
              Ranked by verified on-chain reputation points, completed escrow deliveries, and volume
            </p>
          </div>
          
          <div className="flex bg-[#F6F7F9] p-1 rounded-lg border border-[#E5E7EB] w-fit">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                filterPeriod === 'all'
                  ? 'bg-white text-[#0B0B0F] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              All time
            </button>
            <button
              onClick={() => setFilterPeriod('monthly')}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                filterPeriod === 'monthly'
                  ? 'bg-white text-[#0B0B0F] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Search, Filter, and Tie-break rule information */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Search by name, address, or role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-hidden focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] placeholder:text-[#4B5563]"
              />
            </div>

            <div className="w-40 sm:w-44">
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
            <span>Tie-break rule: Points first, then completed jobs, then total volume</span>
          </div>
        </div>

        {/* Podium Top 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Rank 2 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center flex flex-col justify-between order-2 md:order-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-semibold text-[#4B5563]">Rank #{secondPlace.displayRank}</span>
              <span className="text-[12px] bg-[#F6F7F9] px-2 py-0.5 rounded text-[#4B5563]">Silver</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              {secondPlace.address ? (
                <Link to={`/profile/${secondPlace.address}`} className="relative block shrink-0 hover:opacity-90">
                  <img
                    src={secondPlace.avatar}
                    alt={secondPlace.name}
                    className="w-12 h-12 rounded-full border border-[#E5E7EB] object-cover"
                  />
                </Link>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                  ?
                </div>
              )}
              <div>
                {secondPlace.address ? (
                  <Link to={`/profile/${secondPlace.address}`} className="font-semibold text-[14px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline">
                    {secondPlace.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[14px] text-[#4B5563]">Open spot</span>
                )}
                <p className="text-[12px] text-[#4B5563] mt-0.5">{secondPlace.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[#E5E7EB] mt-3 pt-2 text-[12px]">
              <div>
                <span className="text-[#4B5563] block">Points</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{secondPlace.points}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{secondPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{secondPlace.earnings}</span>
              </div>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="bg-white border-2 border-[#0047AB] rounded-xl p-4 text-center flex flex-col justify-between order-1 md:order-2 shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-bold text-[#0047AB]">Rank #{firstPlace.displayRank}</span>
              <span className="text-[12px] bg-blue-50 text-[#0047AB] font-medium px-2 py-0.5 rounded">Leader</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              {firstPlace.address ? (
                <Link to={`/profile/${firstPlace.address}`} className="relative block shrink-0 hover:opacity-90">
                  <img
                    src={firstPlace.avatar}
                    alt={firstPlace.name}
                    className="w-14 h-14 rounded-full border-2 border-[#0047AB] object-cover"
                  />
                </Link>
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                  ?
                </div>
              )}
              <div>
                {firstPlace.address ? (
                  <Link to={`/profile/${firstPlace.address}`} className="font-bold text-[15px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline">
                    {firstPlace.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[15px] text-[#4B5563]">Open spot</span>
                )}
                <p className="text-[12px] text-[#4B5563] mt-0.5">{firstPlace.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[#E5E7EB] mt-3 pt-2 text-[12px]">
              <div>
                <span className="text-[#4B5563] block">Points</span>
                <span className="font-bold text-[#0047AB] font-mono">{firstPlace.points}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{firstPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{firstPlace.earnings}</span>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center flex flex-col justify-between order-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[12px] font-semibold text-[#4B5563]">Rank #{thirdPlace.displayRank}</span>
              <span className="text-[12px] bg-[#F6F7F9] px-2 py-0.5 rounded text-[#4B5563]">Bronze</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              {thirdPlace.address ? (
                <Link to={`/profile/${thirdPlace.address}`} className="relative block shrink-0 hover:opacity-90">
                  <img
                    src={thirdPlace.avatar}
                    alt={thirdPlace.name}
                    className="w-12 h-12 rounded-full border border-[#E5E7EB] object-cover"
                  />
                </Link>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                  ?
                </div>
              )}
              <div>
                {thirdPlace.address ? (
                  <Link to={`/profile/${thirdPlace.address}`} className="font-semibold text-[14px] text-[#0B0B0F] hover:text-[#0047AB] hover:underline">
                    {thirdPlace.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[14px] text-[#4B5563]">Open spot</span>
                )}
                <p className="text-[12px] text-[#4B5563] mt-0.5">{thirdPlace.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-[#E5E7EB] mt-3 pt-2 text-[12px]">
              <div>
                <span className="text-[#4B5563] block">Points</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{thirdPlace.points}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Success</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{thirdPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[#4B5563] block">Volume</span>
                <span className="font-semibold text-[#0B0B0F] font-mono">{thirdPlace.earnings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LEADERBOARD TABLE with explicit column widths */}
        <div className="hidden md:block overflow-x-auto border border-[#E5E7EB] rounded-lg">
          <table className="w-full border-collapse text-left text-[13px] text-[#0B0B0F]">
            <thead>
              <tr className="bg-[#F6F7F9] border-b border-[#E5E7EB] text-[12px] font-medium text-[#4B5563]">
                <th className="px-4 py-3 text-center w-16">Rank</th>
                <th className="px-4 py-3 min-w-[220px]">Developer</th>
                <th className="px-4 py-3 w-40">Role badge</th>
                <th className="px-4 py-3 text-center w-28">Success rate</th>
                <th className="px-4 py-3 text-center w-32">Total volume</th>
                <th className="px-4 py-3 text-right w-36">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#4B5563]">
                    <Trophy size={32} className="mx-auto text-[#4B5563] mb-2 opacity-50" />
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
                    className={`hover:bg-[#F6F7F9] transition-colors ${
                      row.isUser ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center font-mono font-medium text-[13px]">
                      {row.isTied ? (
                        <span title="Tied rank with identical score" className="text-[#0047AB] font-semibold underline decoration-dotted cursor-help">
                          {row.displayRank}
                        </span>
                      ) : (
                        <span>{row.displayRank}</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3">
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
                        
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Link 
                              to={`/profile/${row.address}`} 
                              className={`font-medium hover:underline text-[13px] ${
                                row.isUser ? 'text-[#0047AB] font-semibold' : 'text-[#0B0B0F]'
                              }`}
                            >
                              {row.name}
                            </Link>
                            {row.isUser && (
                              <span className="bg-[#0047AB] text-white text-[11px] px-1.5 py-0.2 rounded font-medium">You</span>
                            )}
                          </div>
                          <span className="text-[12px] text-[#4B5563] font-mono block">
                            {truncateAddress(row.address)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      {getRoleBadge(row.role)}
                    </td>
                    
                    <td className="px-4 py-3 text-center font-mono text-[13px] text-[#0B0B0F]">
                      {row.successRate}
                    </td>
                    
                    <td className="px-4 py-3 text-center font-mono text-[13px] text-[#0B0B0F]">
                      {row.earnings}
                    </td>
                    
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#0047AB] pr-6 text-[13px]">
                      {row.points} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE LEADERBOARD CARD STACK */}
        <div className="md:hidden space-y-3">
          {paginatedRows.length === 0 ? (
            <div className="p-8 text-center text-[#4B5563] bg-[#F6F7F9] rounded-lg border border-[#E5E7EB]">
              <Trophy size={32} className="mx-auto text-[#4B5563] mb-2 opacity-50" />
              <p className="font-semibold text-[#0B0B0F] text-[14px]">No developers found</p>
              <p className="text-[12px] text-[#4B5563] mt-1">Try resetting search filters.</p>
            </div>
          ) : (
            paginatedRows.map((row) => (
              <div
                key={row.address}
                className={`p-3.5 rounded-lg border bg-white ${row.isUser ? 'border-[#0047AB] bg-blue-50/20' : 'border-[#E5E7EB]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center font-mono font-semibold text-[12px] shrink-0 text-[#0B0B0F]">
                      {row.displayRank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/profile/${row.address}`} className={`font-medium text-[13px] truncate ${row.isUser ? 'text-[#0047AB]' : 'text-[#0B0B0F]'}`}>
                          {row.name}
                        </Link>
                        {row.isUser && (
                          <span className="bg-[#0047AB] text-white text-[10px] px-1.5 py-0.2 rounded font-medium">YOU</span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#4B5563] font-mono block">
                        {truncateAddress(row.address)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-[13px] font-semibold text-[#0047AB] block">{row.points} pts</span>
                    <span className="text-[12px] text-[#4B5563] font-mono">{row.earnings}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E5E7EB] text-[12px]">
                  <div>{getRoleBadge(row.role)}</div>
                  <div className="text-[#4B5563]">
                    Success: <strong className="text-[#0B0B0F] font-mono">{row.successRate}</strong>
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
              Showing {Math.min(filteredLeaderboard.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredLeaderboard.length, currentPage * pageSize)} of {filteredLeaderboard.length} developers
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
              <span className="text-[12px] text-[#4B5563] px-2 font-mono">
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

      {/* Tier Detail & Points Breakdown Modal (Desktop & Mobile) */}
      <AnimatePresence>
        {isBadgeSheetOpen && selectedBadge && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsBadgeSheetOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left my-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between gap-3 bg-[#F6F7F9]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[10px] bg-[#0047AB] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {selectedBadge.tier.includes('Diamond') ? (
                      <Trophy size={20} />
                    ) : selectedBadge.tier.includes('Gold') ? (
                      <Star size={20} />
                    ) : selectedBadge.tier.includes('Silver') ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-[#0B0B0F] tracking-tight truncate">
                      {selectedBadge.tier} &amp; Points Audit
                    </h3>
                    <p className="text-xs text-[#4B5563] truncate">
                      {address ? `On-chain ledger for ${truncateAddress(address)}` : 'On-chain reputation point verification'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBadgeSheetOpen(false)}
                  className="p-1.5 rounded-[8px] text-[#6B7280] hover:text-[#0B0B0F] hover:bg-[#E5E7EB] transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                
                {/* Status & Point Threshold Banner */}
                <div className="p-4 rounded-[12px] bg-[#F6F7F9] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-medium text-[#4B5563] uppercase tracking-wider block">
                      Your Total Score
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-[#0047AB]">
                        {totalPoints}
                      </span>
                      <span className="text-xs text-[#6B7280]">points</span>
                      <span className="text-xs text-[#9CA3AF]">•</span>
                      <span className="text-xs font-semibold text-[#0B0B0F]">
                        {activeTier} Tier
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-medium text-[#4B5563] block">
                      Tier Requirement
                    </span>
                    <div className="inline-flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-[#0B0B0F]">
                        {selectedBadge.pointsRequired}+ pts
                      </span>
                      {totalPoints >= selectedBadge.pointsRequired ? (
                        <span className="text-[11px] bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] px-2 py-0.5 rounded-[6px] font-medium">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[11px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-[6px] font-medium">
                          {selectedBadge.pointsRequired - totalPoints} pts to unlock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Point Sources Audit (Transparent Breakdown) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0F] flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#0047AB]" />
                      <span>Where Your Points Come From</span>
                    </h4>
                    <span className="text-[11px] text-[#6B7280]">
                      Protected User Data
                    </span>
                  </div>

                  {!isConnected || !address ? (
                    <div className="p-4 rounded-[10px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#1E40AF] font-semibold">
                        <Lock size={14} />
                        <span>Private User Ledger</span>
                      </div>
                      <p className="text-[#1E40AF]/90 leading-relaxed">
                        PolyLance strictly scopes all completed job histories and attestation scores to your authenticated wallet. Connect your wallet to inspect your transparent points breakdown.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBadgeSheetOpen(false);
                          connectWallet();
                        }}
                        className="mt-2 px-3.5 py-1.5 bg-[#0047AB] hover:bg-[#003882] text-white rounded-[8px] text-xs font-medium transition-colors cursor-pointer"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {/* Completed Deliverables List */}
                      <div className="p-3.5 rounded-[10px] bg-white border border-[#E5E7EB] space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                          <span className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                            <Briefcase size={13} className="text-[#0047AB]" />
                            <span>Completed Milestone Deliveries ({userCompletedDeliverables.length})</span>
                          </span>
                          <span className="font-mono font-bold text-[#0047AB]">
                            +{escrowPoints + userScores.volumePoints} pts
                          </span>
                        </div>

                        {userCompletedDeliverables.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {userCompletedDeliverables.map((j) => {
                              const completedEvt = j.events?.find((e: any) => e.step === 'Completed');
                              const dateStr = completedEvt?.timestamp
                                ? new Date(completedEvt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : j.createdAt
                                ? new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Recent';
                              const amt = parseFloat(j.amountUsdc || '0');
                              const volPts = Math.floor(amt / 25);
                              const jobPts = 100 + volPts;

                              return (
                                <div
                                  key={j.id}
                                  className="p-2 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="font-medium text-[#0B0B0F] truncate">
                                      {j.title}
                                    </div>
                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-2 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        <span>{dateStr}</span>
                                      </span>
                                      <span>•</span>
                                      <span>${amt.toLocaleString()} {j.paymentTokenSymbol || 'USDC'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-semibold text-[#166534] bg-[#DCFCE7] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                                      +{jobPts} pts
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[#6B7280] text-[11px] py-1 italic">
                            No completed milestones recorded yet for this wallet. Completing escrows awards +100 base pts + 1 pt per $25 settled volume.
                          </div>
                        )}
                      </div>

                      {/* GitHub Developer eKYC */}
                      <div className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Github size={14} className="text-[#0B0B0F]" />
                          <div>
                            <span className="font-medium text-[#0B0B0F] block">
                              GitHub Developer Footprint
                            </span>
                            <span className="text-[11px] text-[#6B7280]">
                              {userProfile?.githubVerified && userProfile?.githubUsername
                                ? `Linked & verified: @${userProfile.githubUsername}`
                                : 'Unverified (Link in Settings to earn +50 pts)'}
                            </span>
                          </div>
                        </div>
                        <span className={`font-mono font-semibold px-2 py-0.5 rounded border ${
                          govPoints > 0
                            ? 'text-[#166534] bg-[#DCFCE7] border-[#BBF7D0]'
                            : 'text-[#6B7280] bg-[#F6F7F9] border-[#E5E7EB]'
                        }`}>
                          +{govPoints} pts
                        </span>
                      </div>

                      {/* DAO Tribunal Governance */}
                      {userScores.arbitrationPoints > 0 && (
                        <div className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale size={14} className="text-[#B45309]" />
                            <div>
                              <span className="font-medium text-[#0B0B0F] block">
                                DAO Arbitration Rulings
                              </span>
                              <span className="text-[11px] text-[#6B7280]">
                                {userResolvedDisputes.length} disputes arbitrated on-chain
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                            +{userScores.arbitrationPoints} pts
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tier Privileges */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B0B0F]">
                    {selectedBadge.tier} Privileges &amp; Guarantees
                  </h4>
                  <div className="space-y-1.5">
                    {selectedBadge.perks.map((perk, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs text-[#0B0B0F]"
                      >
                        <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#E5E7EB] bg-[#F6F7F9] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBadgeSheetOpen(false)}
                  className="px-4 py-2 bg-[#0047AB] hover:bg-[#003882] text-white font-medium text-xs rounded-[8px] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
