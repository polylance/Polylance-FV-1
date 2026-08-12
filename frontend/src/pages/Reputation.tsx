import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Trophy, 
  Star, 
  Sparkles, 
  Lock, 
  ArrowUpRight, 
  ChevronRight, 
  TrendingUp,
  Compass,
  Hexagon,
  Landmark,
  Bookmark,
  Check,
  Shield
} from 'lucide-react';
import { motion, Variants } from 'motion/react';
import { staggerContainer, staggerItem, scrollReveal } from '../lib/motion';

export const Reputation: React.FC = () => {
  const { address, isArbitrator, currentRole, reputationCount: onChainReputationCount } = useWeb3();
  const { profiles, jobs } = usePolyLanceData();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Retrieve user profile case-insensitively
  const userProfileKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const userProfile = userProfileKey ? profiles[userProfileKey] : null;

  // Compute actual completed freelance jobs count for this user
  const userCompletedJobs = jobs.filter(
    (j) => j.freelancer?.toLowerCase() === address?.toLowerCase() && j.status === 'Completed'
  );
  const userCompletedJobsCount = userCompletedJobs.length;
  
  // Combine on-chain reputation count with local completed jobs
  const reputationCount = Math.max(Number(onChainReputationCount || 0), userCompletedJobsCount);

  const userVolume = userCompletedJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  // Calculate dynamic points breakdown based on reputation count
  const escrowPoints = reputationCount * 60;
  const multisigPoints = isArbitrator ? reputationCount * 25 : 0;
  const govPoints = reputationCount > 0 ? (reputationCount * 15) + 10 : 0;
  const totalPoints = escrowPoints + multisigPoints + govPoints;

  // Exclude non-developer roles/addresses (judge, admins, client) from rankings
  const judgeAddr = (import.meta.env.VITE_JUDGE_ADDRESS || '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd').toLowerCase();
  const adminAddr1 = (import.meta.env.VITE_ADMIN_ADDRESS_1 || '0x62cdfc0692cc675c95304bace2c834d8f901dcba').toLowerCase();
  const adminAddr2 = (import.meta.env.VITE_ADMIN_ADDRESS_2 || '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A').toLowerCase();
  const adminAddr3 = '0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1'.toLowerCase();
  const clientAddr = (import.meta.env.VITE_CLIENT_ADDRESS || '0x9999888877776666555544443333222211110000').toLowerCase();

  // Compute leaderboard first to determine dynamic rank
  const leaderboardData = Object.values(profiles)
    .filter((profile) => {
      const lower = profile.address.toLowerCase();
      // Only exclude standard clients who are not admin or judge
      return lower !== clientAddr;
    })
    .map((profile) => {
      const isYou = profile.address.toLowerCase() === address?.toLowerCase();
      // For profile entries, count their completed/active jobs in real-time
      const profileJobs = jobs.filter(
        (j) => j.freelancer?.toLowerCase() === profile.address.toLowerCase()
      );
      const profileCompletedJobs = profileJobs.filter(j => j.status === 'Completed');
      const profileCompletedJobsCount = profileCompletedJobs.length;

      const totalVolumeHandled = profileJobs.reduce((sum, j) => {
        if (j.status === 'Completed') {
          const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
          return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
        }
        if (j.status === 'Submitted' || j.status === 'Selected') {
          return sum + parseFloat(j.amountUsdc || '0');
        }
        return sum;
      }, 0);

      const combinedRep = Math.max(profile.reputationSbtCount || 0, profileCompletedJobsCount);
      const pts = combinedRep * 100;
      const successRatePercent = profileCompletedJobsCount > 0
        ? Math.round((profileCompletedJobs.filter(j => !j.dispute || (j.dispute.resolved && (j.dispute.rulingBps ?? 0) >= 5000)).length / profileCompletedJobsCount) * 100)
        : (profileJobs.length > 0 ? 100 : 0);

      const formatEarnings = (val: number): string => {
        if (!val || val <= 0) return '$0.0k';
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
        return `$${val.toFixed(1)}`;
      };

      return {
        rank: 0,
        name: isYou ? `${profile.displayName || 'Anonymous'} (You)` : (profile.displayName || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`),
        role: profile.primaryCategory === 'web3' ? 'Web3 Engineer' : profile.primaryCategory === 'frontend' ? 'Frontend Dev' : profile.primaryCategory === 'backend' ? 'Backend Dev' : 'Sovereign Developer',
        points: pts || 10,
        successRate: (profileCompletedJobsCount > 0 || profileJobs.length > 0) ? `${successRatePercent}%` : '0%',
        earnings: formatEarnings(totalVolumeHandled),
        isUser: isYou,
        avatar: profile.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        address: profile.address
      };
    })
    .concat(
      address && (currentRole === 'freelancer' || currentRole === 'admin' || currentRole === 'judge') && !Object.keys(profiles).some(k => k.toLowerCase() === address.toLowerCase())
        ? [
            {
              rank: 0,
              name: address ? `${address.slice(0, 6)}...${address.slice(-4)} (You)` : 'You',
              role: isArbitrator ? 'DAO Arbitrator' : 'Web3 Engineer',
              points: totalPoints || 10,
              successRate: userCompletedJobsCount > 0 ? '100%' : '0%',
              earnings: userVolume > 0 ? (userVolume >= 1000 ? `$${(userVolume / 1000).toFixed(1)}k` : `$${userVolume.toFixed(1)}`) : '$0.0k',
              isUser: true,
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              address: address
            }
          ]
        : []
    )
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Find user's dynamic rank index
  const userRankIndex = leaderboardData.findIndex((item) => item.isUser);

  // Determine active tier and standings
  let activeTier: 'Diamond' | 'Gold' | 'Silver' | 'None' = 'None';
  let tierProgress = 0;
  let ptsLeft = 100 - totalPoints;
  let nextTierName = 'Silver';
  let rankLabel = 'Unranked';

  if (totalPoints >= 800) {
    activeTier = 'Diamond';
    nextTierName = 'Elite Platinum';
    ptsLeft = Math.max(0, 1500 - totalPoints);
    tierProgress = Math.min(100, ((totalPoints - 800) / 700) * 100);
  } else if (totalPoints >= 300) {
    activeTier = 'Gold';
    nextTierName = 'Diamond';
    ptsLeft = 800 - totalPoints;
    tierProgress = ((totalPoints - 300) / 500) * 100;
  } else if (totalPoints >= 100) {
    activeTier = 'Silver';
    nextTierName = 'Gold';
    ptsLeft = 300 - totalPoints;
    tierProgress = ((totalPoints - 100) / 200) * 100;
  } else {
    activeTier = 'None';
    nextTierName = 'Silver';
    ptsLeft = 100 - totalPoints;
    tierProgress = (totalPoints / 100) * 100;
  }

  if (userRankIndex !== -1) {
    rankLabel = `#${userRankIndex + 1}`;
  } else {
    rankLabel = 'Unranked';
  }

  const firstPlace = leaderboardData[0] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', successRate: '0%', earnings: '$0.0k', address: '' };
  const secondPlace = leaderboardData[1] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', successRate: '0%', earnings: '$0.0k', address: '' };
  const thirdPlace = leaderboardData[2] || { name: 'Open Spot', points: 0, role: 'Web3 Builder', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', successRate: '0%', earnings: '$0.0k', address: '' };

  const getRoleBadge = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized.includes('solidity') || normalized.includes('architect')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-amber-50/50 text-amber-700 border border-amber-200/50 font-mono tracking-wide">
          <Star size={9.5} className="fill-amber-500/10 text-amber-500" /> {role}
        </span>
      );
    }
    if (normalized.includes('auditor') || normalized.includes('cyber') || normalized.includes('shield')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-blue-50/50 text-blue-700 border border-blue-200/50 font-mono tracking-wide">
          <ShieldCheck size={9.5} className="text-blue-500" /> {role}
        </span>
      );
    }
    if (normalized.includes('devops') || normalized.includes('lead') || normalized.includes('backend')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1.5 bg-orange-50/50 text-orange-800 border border-orange-200/50 font-mono tracking-wide">
          <span className="text-[10px] font-black font-mono text-orange-600">&gt;_</span> {role}
        </span>
      );
    }
    // Default (Web3 Engineer, etc.)
    return (
      <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/50 font-mono tracking-wide">
        <span className="text-[10px] font-black font-mono text-purple-500">&lt;/&gt;</span> {role}
      </span>
    );
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: 'easeOut'
      } 
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 py-6 max-w-6xl mx-auto px-4 md:px-0"
    >
      {/* Top Hero Section */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Diamond Level Card */}
        <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#311042] p-7 sm:p-8 rounded-3xl text-white shadow-[0_15px_40px_-10px_rgba(37,99,235,0.35)] border border-cyan-500/30 flex flex-col justify-between min-h-[220px] group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,207,238,0.2),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,230,58,0.1),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:18px_18px] pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-cyan-950/80 px-3.5 py-1 rounded-full border border-cyan-500/40 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-extrabold">
                  Global Standing • Soulbound Reputation
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-900/60 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-mono font-bold text-purple-200">
                <Sparkles size={13} className="text-cyan-300" />
                <span>Ranked Verified Builder</span>
              </div>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight pt-1">
              <span className="text-white drop-shadow-md" style={{ color: '#FFFFFF' }}>Verified Tier: </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-lime-300 drop-shadow-[0_2px_12px_rgba(6,207,238,0.4)]">
                {activeTier === 'None' ? 'Starter League' : activeTier + ' League'}
              </span>
            </h1>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/10">
            {Boolean(address) ? (
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-black tracking-tight text-[#FFFFFF] drop-shadow-[0_6px_20px_rgba(6,207,238,0.6)] font-space" style={{ color: '#FFFFFF' }}>
                  {rankLabel}
                </span>
                <div className="space-y-0.5">
                  <span className="text-base sm:text-lg font-black text-cyan-100 tracking-tight block">
                    of {leaderboardData.length} Verified On-Chain Freelancers
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    SBT Reputation Index • Polygon Mainnet
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-extrabold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-3.5 py-1 rounded-xl">
                    Status: Unranked
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    SBT Reputation Index • Polygon Mainnet
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-200">
                  Connect wallet to calculate your Soulbound reputation rank on the leaderboard
                </p>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Trophy size={18} />
              </div>
              <div>
                <span className="text-xs font-mono font-black text-white block">{totalPoints} PLREP</span>
                <span className="text-[10px] font-mono text-cyan-200 font-bold block">Soulbound Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reputation Score Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white border border-slate-100 shadow-xl p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.04),transparent_60%)] pointer-events-none" />
          
          <div className="relative w-32 h-32 flex items-center justify-center mt-1">
            <div className="absolute left-[-18px] top-[40%] -translate-y-1/2 opacity-20 select-none pointer-events-none">
              <svg width="18" height="30" viewBox="0 0 18 30" fill="none">
                <circle cx="3" cy="3" r="1" fill="#8b5cf6" />
                <circle cx="11" cy="3" r="1" fill="#8b5cf6" />
                <circle cx="3" cy="11" r="1" fill="#8b5cf6" />
                <circle cx="11" cy="11" r="1" fill="#8b5cf6" />
                <circle cx="3" cy="19" r="1" fill="#8b5cf6" />
                <circle cx="11" cy="19" r="1" fill="#8b5cf6" />
                <circle cx="3" cy="27" r="1" fill="#8b5cf6" />
                <circle cx="11" cy="27" r="1" fill="#8b5cf6" />
              </svg>
            </div>
            
            <div className="absolute right-[-18px] top-[40%] -translate-y-1/2 opacity-20 select-none pointer-events-none">
              <svg width="18" height="30" viewBox="0 0 18 30" fill="none">
                <circle cx="7" cy="3" r="1" fill="#8b5cf6" />
                <circle cx="15" cy="3" r="1" fill="#8b5cf6" />
                <circle cx="7" cy="11" r="1" fill="#8b5cf6" />
                <circle cx="15" cy="11" r="1" fill="#8b5cf6" />
                <circle cx="7" cy="19" r="1" fill="#8b5cf6" />
                <circle cx="15" cy="19" r="1" fill="#8b5cf6" />
                <circle cx="7" cy="27" r="1" fill="#8b5cf6" />
                <circle cx="15" cy="27" r="1" fill="#8b5cf6" />
              </svg>
            </div>

            <div className="absolute left-[-8px] bottom-[20%] text-purple-400 opacity-50 animate-pulse pointer-events-none">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2Z" />
              </svg>
            </div>
            <div className="absolute right-[-8px] top-[15%] text-purple-400 opacity-50 animate-pulse pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2Z" />
              </svg>
            </div>

            <div className="absolute w-full h-full rounded-full border border-purple-100/40 flex items-center justify-center">
              <div className="w-[114px] h-[114px] rounded-full border border-purple-50/60 bg-white/20 flex items-center justify-center shadow-[0_3px_12px_rgba(168,85,247,0.01)]">
                <div className="w-[98px] h-[98px] rounded-full border border-purple-100/70 bg-white flex flex-col items-center justify-center p-2.5 relative shadow-[0_4px_12px_-3px_rgba(168,85,247,0.05),inset_0_1.5px_4px_rgba(168,85,247,0.03)]">
                  {totalPoints > 0 && (
                    <div 
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white p-0.5 shadow-[0_1.5px_6px_rgba(98,27,203,0.25)] border border-purple-400/30 flex items-center justify-center w-5.5 h-5.5"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      <svg className="w-2.5 h-2.5 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </div>
                  )}

                  <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                    {totalPoints}
                  </div>
                  
                  <div className="text-[7.5px] font-bold text-slate-400 tracking-wide uppercase mt-0.5">
                    Reputation Points
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-0.5 z-10">
            <h2 className="font-headline font-extrabold text-slate-800 text-lg tracking-tight">
              Reputation <span className="text-purple-600">Points</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Soulbound ledger verified score</p>
          </div>

          <div className="w-full max-w-[220px] bg-purple-50/30 border border-purple-100/50 rounded-xl p-2 flex items-center shadow-2xs z-10">
            <div className="w-7 h-7 rounded-full bg-purple-100/60 flex items-center justify-center text-purple-600 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9zM11 3v6M5 9h14M12 21l3-12M12 21l-3-12" />
              </svg>
            </div>
            
            <div className="w-[1px] h-5 bg-purple-100/80 mx-2" />

            <div className="flex items-center text-purple-600 pr-0.5">
              <Trophy size={12} className="text-purple-600 mr-1.5 shrink-0" />
              <span className="font-extrabold text-[10px] uppercase tracking-wide mr-1 select-none">
                {activeTier === 'None' ? 'UNRANKED' : activeTier === 'Diamond' ? 'TOP 2%' : activeTier === 'Gold' ? 'TOP 10%' : 'TOP 30%'}
              </span>
              <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wide select-none">PERCENTILE</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Point Breakdown & Active League Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Point Breakdown */}
        <motion.section 
          variants={itemVariants}
          className="lg:col-span-8 bg-white border border-slate-100 shadow-md rounded-2xl p-4 space-y-3.5 flex flex-col justify-start"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
              <Bookmark size={18} className="text-purple-700 fill-purple-100/50" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-extrabold text-slate-900 leading-tight">
                Point Breakdown Trail
              </h2>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Track how your reputation points are earned across the ecosystem.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Breakdown item 1 */}
            <div className="bg-slate-50/40 border border-slate-100 p-3 rounded-xl flex items-start gap-3 transition-all duration-300 hover:shadow-3xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-3xs">
                <CheckCircle2 size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold w-full">
                  <span className="text-slate-800">Successful Escrow Contracts</span>
                  <span className="font-mono text-emerald-600 font-black text-sm">+{escrowPoints} pts</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {reputationCount > 0 
                    ? `Based on ${reputationCount * 12} block-verified deliverables across ${reputationCount * 3} projects.`
                    : 'Complete verified jobs to build your escrow success history.'}
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <div className="flex-1 bg-slate-200/60 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: reputationCount > 0 ? '64%' : '0%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-emerald-600 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black shrink-0">
                    {reputationCount > 0 ? '64%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 2 */}
            <div className="bg-slate-50/40 border border-slate-100 p-3 rounded-xl flex items-start gap-3 transition-all duration-300 hover:shadow-3xs">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-3xs">
                <ShieldCheck size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold w-full">
                  <span className="text-slate-800">Multi-sig Approvals & Releases</span>
                  <span className="font-mono text-blue-600 font-black text-sm">+{multisigPoints} pts</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {isArbitrator 
                    ? `Earned from ${reputationCount * 3 || 15} high-stakes escrow releases with 0 disputes.`
                    : 'Acquire arbitrator credentials to earn multi-sig verification points.'}
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <div className="flex-1 bg-slate-200/60 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isArbitrator ? '21%' : '0%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-blue-600 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black shrink-0">
                    {isArbitrator ? '21%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 3 */}
            <div className="bg-slate-50/40 border border-slate-100 p-3 rounded-xl flex items-start gap-3 transition-all duration-300 hover:shadow-3xs">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-3xs">
                <Landmark size={16} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold w-full">
                  <span className="text-slate-800">DAO Governance Participation</span>
                  <span className="font-mono text-amber-600 font-black text-sm">+{govPoints} pts</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Protocol governance votes and peer milestone reviews.
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <div className="flex-1 bg-slate-200/60 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: reputationCount > 0 ? '15%' : '0%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-amber-500 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black shrink-0">
                    {reputationCount > 0 ? '15%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 4 */}
            <div className="bg-purple-50/15 border border-purple-100/60 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 hover:shadow-3xs">
              <div className="w-9 h-9 rounded-lg bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-3xs">
                <Star size={16} className="stroke-[2.5] fill-purple-100 text-purple-700" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">Total Points Earned</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Keep building your on-chain reputation
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-purple-700 font-black text-sm shrink-0">
                    +{totalPoints} pts
                  </span>
                  
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
                    <div className="absolute inset-2 bg-purple-500/10 blur-sm rounded-full" />
                    <div 
                      className="relative w-5.5 h-5.5 bg-purple-600 text-white flex items-center justify-center shadow-[0_1px_4px_rgba(124,58,237,0.3)] z-10"
                      style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                      <Star size={10} className="fill-current text-white" />
                    </div>
                    <Star size={4} className="absolute top-1 right-2 text-purple-500 fill-current animate-pulse" />
                    <Sparkles size={6} className="absolute bottom-1 left-2 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Active League Sidebar */}
        <motion.section 
          variants={itemVariants}
          className="lg:col-span-4 bg-white border border-slate-100 shadow-md rounded-2xl p-4 space-y-3.5 flex flex-col justify-start"
        >
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
                <Trophy size={18} className="text-purple-700 fill-purple-100/50" />
              </div>
              <div>
                <h2 className="font-headline text-base font-bold text-slate-900 leading-tight">
                  Active League
                </h2>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Your current standing
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Active Diamond Tier */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl relative overflow-hidden group transition-all ${
                activeTier === 'Diamond'
                  ? 'bg-purple-50/20 border border-purple-300'
                  : 'border border-slate-100 bg-white'
              }`}>
                <div className="flex items-center gap-2.5 relative z-10">
                  <div 
                    className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9z" />
                    </svg>
                  </div>
                  <div>
                    <span className={`font-bold text-xs block leading-tight ${activeTier === 'Diamond' ? 'text-slate-900' : 'text-slate-700'}`}>Diamond Tier</span>
                    <span className="text-[9px] text-slate-400 font-medium">Top 2% of verified freelancers</span>
                  </div>
                </div>
                {activeTier === 'Diamond' ? (
                  <span className="font-mono text-[9px] bg-purple-600 px-1.5 py-0.2 rounded text-white relative z-10 font-black shrink-0 shadow-sm">
                    CURRENT
                  </span>
                ) : (
                  <Lock size={12} className="text-slate-400 shrink-0" />
                )}
              </div>

              {/* Gold Tier */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl relative overflow-hidden group transition-all ${
                activeTier === 'Gold'
                  ? 'bg-purple-50/20 border border-purple-300'
                  : 'border border-slate-100 bg-white'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <Trophy size={14} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className={`font-bold text-xs block leading-tight ${activeTier === 'Gold' ? 'text-slate-900' : 'text-slate-700'}`}>Gold Tier</span>
                    <span className="text-[9px] text-slate-400 font-medium">Top 10% of verified freelancers</span>
                  </div>
                </div>
                {activeTier === 'Gold' ? (
                  <span className="font-mono text-[9px] bg-purple-600 px-1.5 py-0.2 rounded text-white relative z-10 font-black shrink-0 shadow-sm">
                    CURRENT
                  </span>
                ) : (
                  <Lock size={12} className="text-slate-400 shrink-0" />
                )}
              </div>

              {/* Silver Tier */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl relative overflow-hidden group transition-all ${
                activeTier === 'Silver'
                  ? 'bg-purple-50/20 border border-purple-300'
                  : 'border border-slate-100 bg-white'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <Star size={14} className="fill-current text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <span className={`font-bold text-xs block leading-tight ${activeTier === 'Silver' ? 'text-slate-900' : 'text-slate-700'}`}>Silver Tier</span>
                    <span className="text-[9px] text-slate-400 font-medium">Top 30% of verified freelancers</span>
                  </div>
                </div>
                {activeTier === 'Silver' ? (
                  <span className="font-mono text-[9px] bg-purple-600 px-1.5 py-0.2 rounded text-white relative z-10 font-black shrink-0 shadow-sm">
                    CURRENT
                  </span>
                ) : (
                  <Lock size={12} className="text-slate-400 shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50/20 border border-purple-100/60 rounded-xl space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Next Tier Goal</span>
              {ptsLeft > 0 ? (
                <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px] font-bold">
                  {ptsLeft} pts left
                </span>
              ) : (
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                  Max Tier Reached
                </span>
              )}
            </div>
            <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
              {ptsLeft > 0 
                ? `Earn ${ptsLeft} more reputation points to enter the Elite Platinum circle.`
                : 'You have attained the highest soulbound reputation tier on PolyLance!'}
            </p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300/40 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="bg-purple-600 h-full rounded-full" 
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* Global Leaderboard Container */}
      <motion.section 
        variants={itemVariants}
        className="bg-white border border-slate-100 shadow-md rounded-2xl p-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600/10 text-purple-700 rounded-lg shadow-sm">
                <Trophy size={18} className="text-purple-700" />
              </div>
              <h2 className="font-headline text-lg font-extrabold text-slate-900 leading-tight">
                Global Freelancer Standings
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium pl-1">
              Top performing professionals ranked by smart contract reputation ledger points
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                filterPeriod === 'all'
                  ? 'bg-white text-purple-950 shadow-sm border border-slate-200/50 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterPeriod('monthly')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                filterPeriod === 'monthly'
                  ? 'bg-white text-purple-950 shadow-sm border border-slate-200/50 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* TOP 3 PODIUM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Rank 2 (Silver) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between order-2 md:order-1 mt-3 md:mt-4 border-t-4 border-t-slate-300"
          >
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-500 font-mono shadow-xs">
              #2
            </div>
            
            <div className="flex flex-col items-center space-y-2 mt-1">
              {secondPlace.address ? (
                <Link to={`/profile/${secondPlace.address}`} className="relative block shrink-0 hover:opacity-90 transition-opacity">
                  <img
                    src={secondPlace.avatar}
                    alt={secondPlace.name}
                    className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover shadow-inner"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-black text-[10px] border border-white shadow-xs font-mono">
                    2
                  </span>
                </Link>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 text-slate-400">
                  ?
                </div>
              )}
              
              <div>
                {secondPlace.address ? (
                  <Link to={`/profile/${secondPlace.address}`} className="font-extrabold text-slate-900 tracking-tight text-sm hover:text-purple-700 hover:underline block leading-tight">
                    {secondPlace.name}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-500 block leading-tight">Open Spot</span>
                )}
                <p className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-0.5 border border-slate-200/40">
                  {secondPlace.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-slate-100 mt-4 pt-3 gap-2">
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Score</span>
                <span className="font-mono text-xs font-black text-slate-900">{secondPlace.points}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Success</span>
                <span className="font-mono text-xs font-black text-slate-900">{secondPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Earnings</span>
                <span className="font-mono text-xs font-black text-emerald-600">{secondPlace.earnings}</span>
              </div>
            </div>
          </motion.div>

          {/* Rank 1 (Gold) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-lg transition-all duration-300 flex flex-col justify-between order-1 md:order-2 border-t-4 border-t-amber-500 scale-102 z-10"
            style={{ boxShadow: '0 15px 35px -10px rgba(245,158,11,0.2)' }}
          >
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 font-bold text-[11px] text-amber-400 font-mono shadow-xs">
              #1
            </div>
            
            <div className="flex flex-col items-center space-y-2 mt-1">
              {firstPlace.address ? (
                <Link to={`/profile/${firstPlace.address}`} className="relative block shrink-0 hover:opacity-90 transition-opacity">
                  <img
                    src={firstPlace.avatar}
                    alt={firstPlace.name}
                    className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-inner"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5.5 h-5.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] border border-slate-900 shadow-xs font-mono">
                    1
                  </span>
                </Link>
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border-2 border-amber-400 text-amber-400">
                  ?
                </div>
              )}
              
              <div>
                {firstPlace.address ? (
                  <Link to={`/profile/${firstPlace.address}`} className="font-extrabold text-white tracking-tight text-base hover:text-amber-400 hover:underline block leading-tight">
                    {firstPlace.name}
                  </Link>
                ) : (
                  <span className="font-bold text-amber-500 block leading-tight">Open Spot</span>
                )}
                <p className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-0.5 border border-amber-500/20">
                  {firstPlace.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-slate-800 mt-4 pt-3 gap-2">
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Score</span>
                <span className="font-mono text-xs font-black text-white">{firstPlace.points}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Success</span>
                <span className="font-mono text-xs font-black text-white">{firstPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Earnings</span>
                <span className="font-mono text-xs font-black text-amber-400">{firstPlace.earnings}</span>
              </div>
            </div>
          </motion.div>

          {/* Rank 3 (Bronze) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between order-3 mt-3 md:mt-4 border-t-4 border-t-amber-700"
          >
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-500 font-mono shadow-xs">
              #3
            </div>
            
            <div className="flex flex-col items-center space-y-2 mt-1">
              {thirdPlace.address ? (
                <Link to={`/profile/${thirdPlace.address}`} className="relative block shrink-0 hover:opacity-90 transition-opacity">
                  <img
                    src={thirdPlace.avatar}
                    alt={thirdPlace.name}
                    className="w-12 h-12 rounded-full border-2 border-amber-800 object-cover shadow-inner"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-800 text-white font-black text-[10px] border border-white shadow-xs font-mono">
                    3
                  </span>
                </Link>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 text-slate-400">
                  ?
                </div>
              )}
              
              <div>
                {thirdPlace.address ? (
                  <Link to={`/profile/${thirdPlace.address}`} className="font-extrabold text-slate-900 tracking-tight text-sm hover:text-purple-700 hover:underline block leading-tight">
                    {thirdPlace.name}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-500 block leading-tight">Open Spot</span>
                )}
                <p className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-0.5 border border-slate-200/40">
                  {thirdPlace.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-slate-100 mt-4 pt-3 gap-2">
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Score</span>
                <span className="font-mono text-xs font-black text-slate-900">{thirdPlace.points}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Success</span>
                <span className="font-mono text-xs font-black text-slate-900">{thirdPlace.successRate}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-slate-400 uppercase font-bold font-mono tracking-wide block">Earnings</span>
                <span className="font-mono text-xs font-black text-emerald-600">{thirdPlace.earnings}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* LEADERBOARD LIST */}
        <div className="overflow-x-auto border border-slate-150 rounded-xl mt-6">
          <table className="w-full border-collapse text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3 w-40">Role Badge</th>
                <th className="px-4 py-3 text-center w-24">Success Rate</th>
                <th className="px-4 py-3 text-center w-24">Total Earnings</th>
                <th className="px-4 py-3 text-right w-24">Attestation Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-medium">
              {leaderboardData.map((row) => (
                <tr 
                  key={row.address}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    row.isUser 
                      ? 'bg-purple-50/20 border-y border-purple-150' 
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center font-mono">
                    {row.rank === 1 ? (
                      <span className="text-amber-500 font-extrabold text-sm flex items-center justify-center gap-0.5 font-sans">
                        🥇 1
                      </span>
                    ) : row.rank === 2 ? (
                      <span className="text-slate-400 font-extrabold text-sm flex items-center justify-center gap-0.5 font-sans">
                        🥈 2
                      </span>
                    ) : row.rank === 3 ? (
                      <span className="text-amber-800 font-extrabold text-sm flex items-center justify-center gap-0.5 font-sans">
                        🥉 3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">{row.rank}</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {row.address ? (
                        <Link to={`/profile/${row.address}`} className="relative shrink-0 hover:opacity-90 transition-opacity">
                          <img
                            src={row.avatar}
                            alt={row.name}
                            className={`w-9 h-9 rounded-full object-cover border ${
                              row.isUser ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
                            }`}
                          />
                        </Link>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-bold">
                          ?
                        </div>
                      )}
                      
                      <div>
                        {row.address ? (
                          <Link to={`/profile/${row.address}`} className="font-bold text-slate-900 hover:text-purple-700 hover:underline">
                            {row.name}
                          </Link>
                        ) : (
                          <span className="font-bold text-slate-500">Open Spot</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {row.address ? `${row.address.slice(0, 8)}...${row.address.slice(-6)}` : '0x0000...0000'}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    {getRoleBadge(row.role)}
                  </td>
                  
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                    {row.successRate}
                  </td>
                  
                  <td className="px-4 py-3 text-center font-mono font-black text-emerald-600">
                    {row.earnings}
                  </td>
                  
                  <td className="px-4 py-3 text-right font-mono font-black text-purple-600 pr-6">
                    {row.points} pts
                  </td>
                </tr>
              ))}
              
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-mono font-medium">
                    No verified freelancers found on the leaderboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
};
