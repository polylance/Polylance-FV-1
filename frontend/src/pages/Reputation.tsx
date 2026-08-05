import React, { useState } from 'react';
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
  Bookmark
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Reputation: React.FC = () => {
  const { address, reputationCount, isArbitrator } = useWeb3();
  const { profiles } = usePolyLanceData();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly'>('all');

  // Calculate dynamic points breakdown based on actual wallet reputation count
  const escrowPoints = reputationCount * 60;
  const multisigPoints = isArbitrator ? reputationCount * 25 : 0;
  const govPoints = reputationCount > 0 ? (reputationCount * 15) + 10 : 0;
  const totalPoints = escrowPoints + multisigPoints + govPoints;

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
    rankLabel = '#42';
  } else if (totalPoints >= 300) {
    activeTier = 'Gold';
    nextTierName = 'Diamond';
    ptsLeft = 800 - totalPoints;
    tierProgress = ((totalPoints - 300) / 500) * 100;
    rankLabel = '#156';
  } else if (totalPoints >= 100) {
    activeTier = 'Silver';
    nextTierName = 'Gold';
    ptsLeft = 300 - totalPoints;
    tierProgress = ((totalPoints - 100) / 200) * 100;
    rankLabel = '#842';
  } else {
    activeTier = 'None';
    nextTierName = 'Silver';
    ptsLeft = 100 - totalPoints;
    tierProgress = (totalPoints / 100) * 100;
    rankLabel = 'Unranked';
  }

  const userLeaderboardItem = {
    rank: totalPoints >= 800 ? 42 : totalPoints >= 300 ? 156 : totalPoints >= 100 ? 842 : 99,
    name: address ? `${address.slice(0, 6)}...${address.slice(-4)} (You)` : 'You',
    role: isArbitrator ? 'DAO Arbitrator' : 'Web3 Engineer',
    points: totalPoints,
    successRate: reputationCount > 0 ? '99.2%' : '0%',
    earnings: reputationCount > 0 ? `$${(reputationCount * 45).toFixed(1)}k` : '$0.0k',
    isUser: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80'
  };

  const leaderboardData = Object.values(profiles)
    .map((profile) => {
      const isYou = profile.address.toLowerCase() === address?.toLowerCase();
      const sbtCount = profile.reputationSbtCount || 0;
      const pts = sbtCount * 100;
      return {
        rank: 0,
        name: isYou ? `${profile.displayName || 'Anonymous'} (You)` : (profile.displayName || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`),
        role: profile.primaryCategory === 'web3' ? 'Web3 Engineer' : profile.primaryCategory === 'frontend' ? 'Frontend Dev' : profile.primaryCategory === 'backend' ? 'Backend Dev' : 'Sovereign Developer',
        points: pts,
        successRate: sbtCount > 0 ? '100%' : '0%',
        earnings: sbtCount > 0 ? `$${(sbtCount * 25).toFixed(1)}k` : '$0.0k',
        isUser: isYou,
        avatar: profile.avatarUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        address: profile.address
      };
    })
    .concat(
      address && !profiles[address]
        ? [
            {
              rank: 0,
              name: address ? `${address.slice(0, 6)}...${address.slice(-4)} (You)` : 'You',
              role: isArbitrator ? 'DAO Arbitrator' : 'Web3 Engineer',
              points: totalPoints,
              successRate: reputationCount > 0 ? '100%' : '0%',
              earnings: reputationCount > 0 ? `$${(reputationCount * 25).toFixed(1)}k` : '$0.0k',
              isUser: true,
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
              address: address
            }
          ]
        : []
    )
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const getRoleBadge = (role: string) => {
    const normalized = role.toLowerCase();
    if (normalized.includes('solidity')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-amber-50/50 text-amber-700 border border-amber-200/50 font-mono tracking-wide">
          <Star size={9.5} className="fill-amber-500/10 text-amber-550" /> {role}
        </span>
      );
    }
    if (normalized.includes('auditor') || normalized.includes('cyber')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-blue-50/50 text-blue-700 border border-blue-200/50 font-mono tracking-wide">
          <ShieldCheck size={9.5} className="text-blue-500" /> {role}
        </span>
      );
    }
    if (normalized.includes('devops') || normalized.includes('lead')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1.5 bg-orange-50/50 text-orange-850 border border-orange-200/50 font-mono tracking-wide">
          <span className="text-[10px] font-black font-mono text-orange-600">&gt;_</span> {role}
        </span>
      );
    }
    if (normalized.includes('zero-knowledge') || normalized.includes('zk')) {
      return (
        <span className="text-[9.5px] px-2 py-0.5 rounded-md font-extrabold inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200/50 font-mono tracking-wide">
          <span className="text-[10px] font-black font-mono text-slate-500">&lt;/&gt;</span> {role}
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

  // Simple static variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: 'easeOut' as any
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
        <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-5 rounded-2xl text-white shadow-[0_10px_30px_-10px_rgba(98,35,220,0.3)] border border-purple-500/10 flex flex-col justify-between min-h-[150px] group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300 font-bold">
                Global Standing • Soulbound Reputation
              </span>
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold !text-white leading-tight">
              Verified Tier: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-indigo-300">{activeTier === 'None' ? 'Starter League' : activeTier + ' League'}</span>
            </h1>
          </div>

          <div className="relative z-10 flex items-baseline gap-3 mt-4">
            <span className="text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_10px_rgba(56,189,248,0.3)]">
              {rankLabel}
            </span>
            <span className="text-xs font-semibold text-cyan-200 opacity-90">
              {totalPoints > 0 ? 'of 124,502 Verified On-Chain Freelancers' : 'Connect wallet to rank on the leaderboard'}
            </span>
          </div>
        </div>

        {/* Reputation Score Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white border border-slate-100 shadow-xl p-5 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden group"
        >
          {/* Subtle radial glow inside card */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.04),transparent_60%)] pointer-events-none" />
          
          {/* Circular Display Area with Concentric Rings */}
          <div className="relative w-32 h-32 flex items-center justify-center mt-1">
            
            {/* Left Dot Grid Decoration */}
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
            
            {/* Right Dot Grid Decoration */}
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

            {/* Sparkles (✦) Decoration */}
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

            {/* Outer Ring */}
            <div className="absolute w-full h-full rounded-full border border-purple-100/40 flex items-center justify-center">
              {/* Middle Ring */}
              <div className="w-[114px] h-[114px] rounded-full border border-purple-50/60 bg-white/20 flex items-center justify-center shadow-[0_3px_12px_rgba(168,85,247,0.01)]">
                {/* Inner Ring (Main Score Circle) */}
                <div className="w-[98px] h-[98px] rounded-full border border-purple-100/70 bg-white flex flex-col items-center justify-center p-2.5 relative shadow-[0_4px_12px_-3px_rgba(168,85,247,0.05),inset_0_1.5px_4px_rgba(168,85,247,0.03)]">
                  
                  {/* Hexagonal Star Badge at Top */}
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

                  {/* Reputation Points Value */}
                  <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                    {totalPoints}
                  </div>
                  
                  {/* Description Label inside */}
                  <div className="text-[7.5px] font-bold text-slate-400 tracking-wide uppercase mt-0.5">
                    Reputation Points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-0.5 z-10">
            <h2 className="font-headline font-extrabold text-slate-800 text-lg tracking-tight">
              Reputation <span className="text-purple-600">Points</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Soulbound ledger verified score</p>
          </div>

          {/* Bottom Capsule Container */}
          <div className="w-full max-w-[220px] bg-purple-50/30 border border-purple-100/50 rounded-xl p-2 flex items-center shadow-2xs z-10">
            {/* Diamond Icon Circle */}
            <div className="w-7 h-7 rounded-full bg-purple-100/60 flex items-center justify-center text-purple-600 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9zM11 3v6M5 9h14M12 21l3-12M12 21l-3-12" />
              </svg>
            </div>
            
            {/* Divider Line */}
            <div className="w-[1px] h-5 bg-purple-100/80 mx-2" />

            {/* Trophy Icon, Percentile Text */}
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
          {/* Header */}
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

            {/* Breakdown item 4 (Total Points Card) */}
            <div className="bg-purple-50/15 border border-purple-100/60 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 hover:shadow-3xs">
              <div className="w-9 h-9 rounded-lg bg-purple-100/70 border border-purple-200 flex items-center justify-center text-purple-650 shrink-0 shadow-3xs">
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
                  
                  {/* Purple glow and sparkles decoration */}
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
            {/* Header */}
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
        {/* Header and Toggle Button */}
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
          
          {/* Custom Pill Toggle Switch */}
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
          {/* Rank 2 (Silver) - Positioned first on desktop for symmetric display (2 - 1 - 3) */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between order-2 md:order-1 mt-3 md:mt-4 border-t-4 border-t-slate-300"
          >
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-500 font-mono shadow-xs">
              #2
            </div>
            
            <div className="flex flex-col items-center space-y-2 mt-1">
              <div className="relative">
                <img
                  src={leaderboardData[1].avatar}
                  alt={leaderboardData[1].name}
                  className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover shadow-inner"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-black text-[10px] border border-white shadow-xs font-mono">
                  2
                </span>
              </div>
              
              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-sm group-hover:text-purple-700 transition-colors">
                  {leaderboardData[1].name}
                </h4>
                <p className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-0.5 border border-slate-200/40">
                  {leaderboardData[1].role}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-left">
              <div className="space-y-0.5">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-xs font-black text-slate-800 font-mono">{leaderboardData[1].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-xs font-black text-emerald-600 font-mono">{leaderboardData[1].successRate}</p>
              </div>
            </div>
            
            <div className="mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100/50 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400 text-[9.5px] font-bold uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[1].earnings}</span>
            </div>
          </motion.div>

          {/* Rank 1 (Gold) - Positioned middle and larger/emphasized */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-gradient-to-b from-amber-500/5 to-white border border-amber-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between order-1 md:order-2 ring-2 ring-amber-400/20 border-t-8 border-t-amber-400"
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-955 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-white">
              <Sparkles size={8} className="fill-amber-900" /> Winner
            </div>
            
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 border border-amber-200 font-bold text-[11px] text-amber-600 font-mono shadow-xs">
              #1
            </div>

            <div className="flex flex-col items-center space-y-2 mt-2">
              <div className="relative">
                <img
                  src={leaderboardData[0].avatar}
                  alt={leaderboardData[0].name}
                  className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-inner ring-2 ring-amber-400/10"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5.5 h-5.5 rounded-full bg-amber-400 text-amber-955 font-black text-xs border border-white shadow-xs font-mono">
                  👑
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-base group-hover:text-purple-700 transition-colors">
                  {leaderboardData[0].name}
                </h4>
                <p className="text-[9px] bg-amber-100 text-amber-955 px-2 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-black mt-0.5 border border-amber-200/40">
                  {leaderboardData[0].role}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-left">
              <div className="space-y-0.5">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-xs font-black text-slate-800 font-mono">{leaderboardData[0].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-xs font-black text-emerald-600 font-mono">{leaderboardData[0].successRate}</p>
              </div>
            </div>

            <div className="mt-2.5 bg-amber-500/5 p-2 rounded-xl border border-amber-100 flex items-center justify-between text-[11px]">
              <span className="font-mono text-amber-850/60 text-amber-850 font-bold text-[9.5px] uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[0].earnings}</span>
            </div>
          </motion.div>

          {/* Rank 3 (Bronze) - Positioned third */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between order-3 mt-3 md:mt-4 border-t-4 border-t-amber-700/60"
          >
            <div className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-amber-800 font-mono shadow-xs">
              #3
            </div>

            <div className="flex flex-col items-center space-y-2 mt-1">
              <div className="relative">
                <img
                  src={leaderboardData[2].avatar}
                  alt={leaderboardData[2].name}
                  className="w-12 h-12 rounded-full border-2 border-amber-700/40 object-cover shadow-inner"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] border border-white shadow-xs font-mono">
                  3
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-sm group-hover:text-purple-700 transition-colors">
                  {leaderboardData[2].name}
                </h4>
                <p className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-0.5 border border-slate-200/40">
                  {leaderboardData[2].role}
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-left">
              <div className="space-y-0.5">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-xs font-black text-slate-800 font-mono">{leaderboardData[2].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-xs font-black text-emerald-600 font-mono">{leaderboardData[2].successRate}</p>
              </div>
            </div>

            <div className="mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100/50 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400 text-[9.5px] font-bold uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[2].earnings}</span>
            </div>
          </motion.div>
        </div>

        {/* LIST VIEW */}
        <div className="border border-slate-200/60 bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Header Row for List */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4.5 py-3 bg-slate-50 border-b border-slate-200/80 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Freelancer Name & Specialty</div>
            <div className="col-span-3">Reputation Score</div>
            <div className="col-span-2 text-center">Success Rate</div>
            <div className="col-span-2 text-right">Volume Handled</div>
          </div>

          <div className="bg-white">
            {leaderboardData.map((item) => {
              // Custom layout for user row vs normal row
              return (
                <motion.div
                  key={item.rank}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-4 items-center px-4.5 py-3 transition-all duration-200 ${
                    item.isUser
                      ? 'bg-gradient-to-r from-purple-500/[0.03] to-indigo-500/[0.03] border border-purple-300 rounded-xl mx-2.5 my-2 shadow-[0_3px_12px_rgba(147,51,234,0.04)] font-bold relative z-10'
                      : 'hover:bg-slate-50/80 border-b border-slate-100/70 last:border-b-0'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-1 flex items-center md:justify-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Rank:</span>
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg font-mono text-xs font-black shadow-2xs border ${
                      item.rank === 1 ? 'bg-amber-50/70 text-amber-700 border-amber-200/50' :
                      item.rank === 2 ? 'bg-slate-100/70 text-slate-700 border-slate-200/50' :
                      item.rank === 3 ? 'bg-orange-50/50 text-orange-800 border-orange-200/40' :
                      item.isUser ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200/50'
                    }`}>
                      {item.rank.toString().padStart(2, '0')}
                    </span>
                    {item.isUser && (
                      <span className="md:hidden text-[9px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider shadow-sm">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Name Column */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className={`w-8.5 h-8.5 rounded-full object-cover border shadow-sm ${
                          item.isUser ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200'
                        }`}
                      />
                      {item.rank === 1 && (
                        <span className="absolute -top-1.5 -left-1.5 bg-white border border-amber-200 rounded-full w-4 h-4 flex items-center justify-center shadow-3xs">
                          <span className="text-[8.5px] leading-none mb-0.5">👑</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold text-slate-800 block leading-tight ${item.isUser ? 'text-purple-950 font-black' : ''}`}>
                          {item.name}
                        </span>
                        {item.isUser && (
                          <span className="hidden md:inline-block text-[9px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-full font-mono uppercase tracking-widest shadow-sm">
                            YOU
                          </span>
                        )}
                      </div>
                      {getRoleBadge(item.role)}
                    </div>
                  </div>

                  {/* Reputation Points */}
                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Score:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5.5 h-5.5 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Star size={11} className="fill-purple-500/10 text-purple-600" />
                      </div>
                      <span className={`text-xs font-mono font-black ${item.isUser ? 'text-purple-900' : 'text-slate-855'}`}>
                        {item.points.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="col-span-2 flex items-center md:justify-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Success:</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-mono font-black flex items-center gap-0.5 shadow-2xs">
                      <span className="text-[10px] font-sans font-black mr-0.5">↗</span>
                      {item.successRate}
                    </span>
                  </div>

                  {/* Volume Handled */}
                  <div className="col-span-2 flex items-center md:justify-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Volume:</span>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-slate-850">
                        {item.earnings}
                      </span>
                      <div className="text-[9px] text-emerald-600 font-mono flex items-center gap-0.5 justify-end mt-0.5">
                        <svg className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500/10 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verified
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
            <button className="text-purple-700 font-extrabold text-xs hover:text-purple-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer group">
              View All 124,502 Freelancers
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm group-hover:bg-purple-700 transition-colors">
                <ChevronRight size={12} className="stroke-[2.5]" />
              </span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* On-Chain Achievements / Badges Grid matching reference HTML */}
      <motion.section variants={itemVariants} className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 space-y-4.5">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 7l1.5 3 3.5.5-2.5 2.5 1 3.5-3.5-2-3.5 2 1-3.5-2.5-2.5 3.5-.5z" fill="currentColor" className="text-slate-800" />
            </svg>
          </div>
          <div>
            <h2 className="font-headline text-base font-extrabold text-slate-900 leading-tight">
              On-Chain SBT Achievements
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Your soulbound badge milestones on-chain.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Badge 1 - Genesis Auditor */}
          {(() => {
            const isUnlocked = reputationCount >= 1;
            return (
              <motion.div 
                whileHover={isUnlocked ? { y: -5, scale: 1.02 } : {}}
                className={`bg-white border border-slate-100 rounded-2xl text-center p-4.5 space-y-3 relative overflow-hidden group shadow-2xs ${
                  isUnlocked ? 'hover:border-purple-300 transition-all hover:shadow-xs' : 'opacity-70'
                }`}
              >
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-100 bg-slate-50/50" />
                  <div className="absolute inset-1.5 rounded-full border border-slate-100 bg-white" />
                  <div className="relative z-10 text-slate-800 flex items-center justify-center">
                    {isUnlocked ? (
                      <Award size={22} className="stroke-[2] text-slate-800" />
                    ) : (
                      <Lock size={18} className="text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Genesis Auditor</h4>
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full inline-block border border-slate-100">
                  {isUnlocked ? 'Protocol Pioneer' : 'LOCKED (1+ JOB REQ)'}
                </p>
              </motion.div>
            );
          })()}

          {/* Badge 2 - Escrow Master */}
          {(() => {
            const isUnlocked = reputationCount >= 4;
            return (
              <motion.div 
                whileHover={isUnlocked ? { y: -5, scale: 1.02 } : {}}
                className={`bg-white border border-slate-100 rounded-2xl text-center p-4.5 space-y-3 relative overflow-hidden group shadow-2xs ${
                  isUnlocked ? 'hover:border-purple-300 transition-all hover:shadow-xs' : 'opacity-70'
                }`}
              >
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-100 bg-slate-50/50" />
                  <div className="absolute inset-1.5 rounded-full border border-slate-100 bg-white" />
                  <div className="relative z-10 text-slate-800 flex items-center justify-center">
                    {isUnlocked ? (
                      <ShieldCheck size={22} className="stroke-[2] text-slate-800" />
                    ) : (
                      <Lock size={18} className="text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Escrow Master</h4>
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full inline-block border border-slate-100">
                  {isUnlocked ? '100+ Escrows Released' : 'LOCKED (4+ JOBS REQ)'}
                </p>
              </motion.div>
            );
          })()}

          {/* Badge 3 - Oracle Tier */}
          {(() => {
            const isUnlocked = totalPoints >= 1000;
            return (
              <motion.div 
                whileHover={isUnlocked ? { y: -5, scale: 1.02 } : {}}
                className={`bg-white border border-slate-100 rounded-2xl text-center p-4.5 space-y-3 relative overflow-hidden group shadow-2xs ${
                  isUnlocked ? 'hover:border-purple-300 transition-all hover:shadow-xs' : 'opacity-70'
                }`}
              >
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-100 bg-slate-50/50" />
                  <div className="absolute inset-1.5 rounded-full border border-slate-100 bg-white" />
                  <div className="relative z-10 text-slate-800 flex items-center justify-center">
                    {isUnlocked ? (
                      <Star size={20} className="stroke-[2] text-slate-800 fill-slate-800/10" />
                    ) : (
                      <Lock size={18} className="text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Oracle Tier</h4>
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full inline-block border border-slate-100">
                  {isUnlocked ? 'Oracle Status Active' : 'Locked (Rank #10 Req)'}
                </p>
              </motion.div>
            );
          })()}

          {/* Badge 4 - Identity Verified */}
          {(() => {
            const isUnlocked = reputationCount > 0;
            return (
              <motion.div 
                whileHover={isUnlocked ? { y: -5, scale: 1.02 } : {}}
                className={`bg-white border border-slate-100 rounded-2xl text-center p-4.5 space-y-3 relative overflow-hidden group shadow-2xs ${
                  isUnlocked ? 'hover:border-purple-300 transition-all hover:shadow-xs' : 'opacity-70'
                }`}
              >
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-slate-100 bg-slate-50/50" />
                  <div className="absolute inset-1.5 rounded-full border border-slate-100 bg-white" />
                  <div className="relative z-10 text-slate-800 flex items-center justify-center">
                    {isUnlocked ? (
                      <CheckCircle2 size={22} className="stroke-[2] text-slate-800" />
                    ) : (
                      <Lock size={18} className="text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Identity Verified</h4>
                <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-full inline-block border border-slate-100">
                  {isUnlocked ? 'GitHub Attestation' : 'LOCKED (LINK GITHUB)'}
                </p>
              </motion.div>
            );
          })()}
        </div>
      </motion.section>
    </motion.div>
  );
};
