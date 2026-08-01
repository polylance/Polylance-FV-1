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
  Hexagon
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Reputation: React.FC = () => {
  const { address } = useWeb3();
  const { profiles } = usePolyLanceData();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'monthly'>('all');

  const leaderboardData = [
    { rank: 1, name: 'Alex Rivera', role: 'Solidity Architect', points: 1402, successRate: '100%', earnings: '$428.5k', isUser: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { rank: 2, name: 'Sarah Chen', role: 'Cyber Auditor', points: 1280, successRate: '100%', earnings: '$312.0k', isUser: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { rank: 3, name: 'Marcus Thorne', role: 'DevOps Lead', points: 1190, successRate: '98.5%', earnings: '$284.2k', isUser: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { rank: 42, name: 'Elena Vance (You)', role: 'Web3 Engineer', points: 982, successRate: '99.2%', earnings: '$184.2k', isUser: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
    { rank: 43, name: 'Dmitri Volkov', role: 'Zero-Knowledge Dev', points: 978, successRate: '97.8%', earnings: '$176.0k', isUser: false, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
  ];

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
        <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-2xl text-white shadow-[0_10px_30px_-10px_rgba(98,35,220,0.3)] border border-purple-500/10 flex flex-col justify-between min-h-[170px] group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300 font-bold">
                Global Standing • Soulbound Reputation
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold !text-white">
              Verified Tier: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-indigo-300">Diamond League</span>
            </h1>
          </div>

          <div className="relative z-10 flex items-baseline gap-4 mt-6">
            <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_10px_rgba(56,189,248,0.3)]">
              #42
            </span>
            <span className="text-sm font-semibold text-cyan-200 opacity-90">
              of 124,502 Verified On-Chain Freelancers
            </span>
          </div>
        </div>

        {/* Reputation Score Card */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white border border-slate-100 shadow-md p-6 pb-16 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden group"
        >
          {/* Subtle radial glow inside card */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-purple-50/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
          
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-300">
            <div className="font-mono text-5xl font-black text-purple-900 tracking-tighter">982</div>
          </div>
          <div className="space-y-0.5 z-10">
            <div className="font-headline font-black text-slate-800 text-sm uppercase tracking-widest">
              Reputation Points
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Soulbound ledger verified score</p>
          </div>
          <span className="px-3.5 py-1 bg-purple-100 text-purple-950 font-mono text-xs font-black rounded-full border border-purple-200/60 shadow-sm z-10">
            TOP 2% PERCENTILE
          </span>

          {/* SVG wave line graph centered vertically so it is 100% visible and not cut off by corners */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none select-none overflow-hidden rounded-b-2xl">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="score-chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Wave Path */}
              <path 
                d="M-5,35 L0,20 Q15,8 30,18 T60,5 T90,14 T100,4 L105,4 L105,35 Z" 
                fill="url(#score-chart-grad)" 
              />
              <motion.path 
                d="M0,20 Q15,8 30,18 T60,5 T90,14 T100,4" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
              <motion.circle 
                cx="100" 
                cy="4" 
                r="2" 
                fill="#8b5cf6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.8, 1], opacity: 1 }}
                transition={{ delay: 1.8, duration: 1.2, repeat: Infinity }}
              />
              <circle cx="100" cy="4" r="1.2" fill="#8b5cf6" />
            </svg>
          </div>
        </motion.div>
      </motion.section>

      {/* Point Breakdown & Active League Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Point Breakdown */}
        <motion.section 
          variants={itemVariants}
          className="lg:col-span-8 bg-white border border-slate-100 shadow-md rounded-2xl p-5 space-y-4 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
              <Award size={20} className="text-purple-700" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-extrabold text-slate-900 leading-tight">
                Point Breakdown Trail
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Track how your reputation points are earned across the ecosystem.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Breakdown item 1 */}
            <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 transition-all duration-300 hover:shadow-3xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-3xs">
                <CheckCircle2 size={18} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-sm font-bold w-full">
                  <span className="text-slate-800">Successful Escrow Contracts</span>
                  <span className="font-mono text-purple-950 font-black text-base">+640 pts</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Based on 48 block-verified deliverables across 12 projects.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 bg-slate-200/60 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-purple-650 bg-purple-600 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-mono font-black shrink-0">
                    64%
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 2 */}
            <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 transition-all duration-300 hover:shadow-3xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-3xs">
                <ShieldCheck size={18} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-sm font-bold w-full">
                  <span className="text-slate-800">Multi-sig Approvals & Releases</span>
                  <span className="font-mono text-purple-955 font-black text-base">+212 pts</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Earned from 15 high-stakes escrow releases with 0 disputes.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 bg-slate-200/60 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-purple-655 bg-purple-600 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-blue-50 text-blue-755 border border-blue-100 px-2 py-0.5 rounded-full text-xs font-mono font-black shrink-0">
                    21%
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 3 */}
            <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl flex items-start gap-3.5 transition-all duration-300 hover:shadow-3xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-3xs">
                <Trophy size={18} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-sm font-bold w-full">
                  <span className="text-slate-800">DAO Governance Participation</span>
                  <span className="font-mono text-purple-950 font-black text-base">+130 pts</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Protocol governance votes and peer milestone reviews.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 bg-slate-200/60 h-2 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '15%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="bg-purple-600 h-full rounded-full" 
                    />
                  </div>
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full text-xs font-mono font-black shrink-0">
                    15%
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown item 4 (Total Points Card) */}
            <div className="bg-slate-50/40 border border-slate-100 p-4 rounded-xl flex items-center gap-3.5 transition-all duration-300 hover:shadow-3xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-3xs">
                <Sparkles size={18} className="stroke-[2.5] fill-purple-100" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-slate-800 block">Total Points Earned</span>
                  <p className="text-xs text-slate-500 font-mono">
                    Keep building your on-chain reputation
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-mono text-purple-955 font-black text-base shrink-0">
                    +982 pts
                  </span>
                  
                  {/* Miniature wave line graph */}
                  <div className="w-20 h-6 select-none overflow-hidden shrink-0 hidden sm:block">
                    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="row-chart-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M0,25 Q15,10 30,22 T60,8 T90,18 T100,5 L100,30 L0,30 Z" 
                        fill="url(#row-chart-grad)" 
                      />
                      <path 
                        d="M0,25 Q15,10 30,22 T60,8 T90,18 T100,5" 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                      <circle cx="100" cy="5" r="2.5" fill="#8b5cf6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Active League Sidebar */}
        <motion.section 
          variants={itemVariants}
          className="lg:col-span-4 bg-white border border-slate-100 shadow-md rounded-2xl p-5 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 shrink-0">
                <Compass size={18} className="text-purple-700" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold text-slate-900 leading-tight">
                  Active League
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Your current standing
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Active Diamond Tier */}
              <div className="flex items-center justify-between p-3.5 bg-purple-50/20 border border-purple-200/80 rounded-xl relative overflow-hidden group">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0">
                    <Sparkles size={16} className="text-purple-700 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">Diamond Tier</span>
                    <span className="text-[10px] text-slate-500 font-medium">Top 2% of verified freelancers</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-purple-200 px-2 py-0.5 rounded-lg text-purple-950 border border-purple-300/40 relative z-10 font-black shrink-0">
                  CURRENT
                </span>
              </div>

              {/* Gold Tier */}
              <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Trophy size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 text-xs block leading-tight">Gold Tier</span>
                    <span className="text-[10px] text-slate-400 font-medium">Top 10% of verified freelancers</span>
                  </div>
                </div>
                <Lock size={13} className="text-slate-400 shrink-0" />
              </div>

              {/* Silver Tier */}
              <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Star size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 text-xs block leading-tight">Silver Tier</span>
                    <span className="text-[10px] text-slate-400 font-medium">Top 30% of verified freelancers</span>
                  </div>
                </div>
                <Lock size={13} className="text-slate-400 shrink-0" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-900">
              <span>Next Tier Goal:</span>
              <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">18 pts left</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Earn 18 more reputation points to enter the Elite Platinum circle.</p>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300/40 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '92%' }}
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
        className="bg-white border border-slate-100 shadow-md rounded-2xl p-4 md:p-5 space-y-5"
      >
        {/* Header and Toggle Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600/10 text-purple-700 rounded-xl shadow-sm">
                <Trophy size={22} className="text-purple-700" />
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-slate-900">
                Global Freelancer Standings
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium pl-1">
              Top performing professionals ranked by smart contract reputation ledger points
            </p>
          </div>
          
          {/* Custom Pill Toggle Switch */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                filterPeriod === 'all'
                  ? 'bg-white text-purple-950 shadow-sm border border-slate-200/50 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Rank 2 (Silver) - Positioned first on desktop for symmetric display (2 - 1 - 3) */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between order-2 md:order-1 mt-4 md:mt-6 border-t-4 border-t-slate-300"
          >
            <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-bold text-xs text-slate-500 font-mono shadow-sm">
              #2
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <img
                  src={leaderboardData[1].avatar}
                  alt={leaderboardData[1].name}
                  className="w-16 h-16 rounded-full border-4 border-slate-200 object-cover shadow-inner"
                />
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs border border-white shadow-sm font-mono">
                  2
                </span>
              </div>
              
              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-base group-hover:text-purple-700 transition-colors">
                  {leaderboardData[1].name}
                </h4>
                <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-1 border border-slate-200/40">
                  {leaderboardData[1].role}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-xs font-black text-slate-800 font-mono">{leaderboardData[1].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-xs font-black text-emerald-600 font-mono">{leaderboardData[1].successRate}</p>
              </div>
            </div>
            
            <div className="mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 text-[10px] font-bold uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[1].earnings}</span>
            </div>
          </motion.div>

          {/* Rank 1 (Gold) - Positioned middle and larger/emphasized */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="relative group bg-gradient-to-b from-amber-500/5 to-white border border-amber-200 rounded-2xl p-7 text-center shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between order-1 md:order-2 ring-2 ring-amber-400/20 border-t-8 border-t-amber-400"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-955 font-black text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
              <Sparkles size={10} className="fill-amber-900" /> Winner
            </div>
            
            <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 border border-amber-200 font-bold text-xs text-amber-600 font-mono shadow-sm">
              #1
            </div>

            <div className="flex flex-col items-center space-y-3.5 mt-2">
              <div className="relative">
                <img
                  src={leaderboardData[0].avatar}
                  alt={leaderboardData[0].name}
                  className="w-20 h-20 rounded-full border-4 border-amber-400 object-cover shadow-inner ring-4 ring-amber-400/10"
                />
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-955 font-black text-sm border-2 border-white shadow-sm font-mono">
                  👑
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-lg group-hover:text-purple-700 transition-colors">
                  {leaderboardData[0].name}
                </h4>
                <p className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full inline-block font-mono uppercase tracking-wider font-black mt-1 border border-amber-200/40">
                  {leaderboardData[0].role}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-sm font-black text-slate-800 font-mono">{leaderboardData[0].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-sm font-black text-emerald-600 font-mono">{leaderboardData[0].successRate}</p>
              </div>
            </div>

            <div className="mt-4 bg-amber-500/5 p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
              <span className="font-mono text-amber-800/60 font-bold text-[10px] uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[0].earnings}</span>
            </div>
          </motion.div>

          {/* Rank 3 (Bronze) - Positioned third */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="relative group bg-white border border-slate-200/60 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between order-3 mt-4 md:mt-6 border-t-4 border-t-amber-700/65 border-t-amber-850"
          >
            <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-bold text-xs text-amber-800 font-mono shadow-sm">
              #3
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <img
                  src={leaderboardData[2].avatar}
                  alt={leaderboardData[2].name}
                  className="w-16 h-16 rounded-full border-4 border-amber-700/40 object-cover shadow-inner"
                />
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs border border-white shadow-sm font-mono">
                  3
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-base group-hover:text-purple-700 transition-colors">
                  {leaderboardData[2].name}
                </h4>
                <p className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block font-mono uppercase tracking-wider font-bold mt-1 border border-slate-200/40">
                  {leaderboardData[2].role}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Reputation</span>
                <p className="text-xs font-black text-slate-800 font-mono">{leaderboardData[2].points} pts</p>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Success Rate</span>
                <p className="text-xs font-black text-emerald-600 font-mono">{leaderboardData[2].successRate}</p>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 text-[10px] font-bold uppercase">Volume</span>
              <span className="font-black text-emerald-700 font-mono">{leaderboardData[2].earnings}</span>
            </div>
          </motion.div>
        </div>

        {/* LIST VIEW */}
        <div className="border border-slate-200/60 bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Header Row for List */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200/80 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Freelancer Name & Specialty</div>
            <div className="col-span-2">Reputation Score</div>
            <div className="col-span-2 text-center">Success Rate</div>
            <div className="col-span-2 text-right">Volume Handled</div>
          </div>

          <div className="divide-y divide-slate-100">
            {leaderboardData.map((item) => {
              // Custom layout for user row vs normal row
              return (
                <motion.div
                  key={item.rank}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center px-6 py-4.5 transition-all duration-200 ${
                    item.isUser
                      ? 'bg-gradient-to-r from-purple-500/[0.04] to-indigo-500/[0.04] ring-2 ring-purple-600/30 font-bold relative z-10 border-l-4 border-l-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.03)]'
                      : 'hover:bg-slate-50/80 border-l-4 border-l-transparent hover:border-l-purple-200'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-1 flex items-center md:justify-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Rank:</span>
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-black shadow-sm ${
                      item.rank === 1 ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/40' :
                      item.rank === 2 ? 'bg-slate-100 text-slate-800 ring-1 ring-slate-300/40' :
                      item.rank === 3 ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-800/20' :
                      item.isUser ? 'bg-purple-600 text-white shadow-purple-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200/50'
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
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className={`w-10 h-10 rounded-full object-cover border shadow-sm ${
                          item.isUser ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200'
                        }`}
                      />
                      {item.rank <= 3 && (
                        <span className="absolute -top-1 -left-1 text-[10px]">
                          {item.rank === 1 ? '👑' : item.rank === 2 ? '🥈' : '🥉'}
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
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wide font-bold inline-block border bg-slate-100 text-slate-650 border-slate-200/40">
                        {item.role}
                      </span>
                    </div>
                  </div>

                  {/* Reputation Points */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Score:</span>
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-purple-600/80 animate-pulse" />
                      <span className={`text-xs font-mono font-black ${item.isUser ? 'text-purple-900' : 'text-slate-800'}`}>
                        {item.points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="col-span-2 flex items-center md:justify-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Success:</span>
                    <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-black flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {item.successRate}
                    </span>
                  </div>

                  {/* Volume Handled */}
                  <div className="col-span-2 flex items-center md:justify-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase md:hidden text-slate-400">Volume:</span>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-600">
                        {item.earnings}
                      </span>
                      <div className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5 justify-end">
                        <TrendingUp size={10} className="text-emerald-500" /> verified
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button className="text-purple-700 font-extrabold text-xs hover:text-purple-800 transition-colors inline-flex items-center gap-1 cursor-pointer hover:gap-2 transition-all">
              View All 124,502 Freelancers <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* On-Chain Achievements / Badges Grid matching reference HTML */}
      <motion.section variants={itemVariants} className="space-y-5">
        <h2 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
          <Hexagon size={18} className="text-purple-700 animate-pulse" /> On-Chain SBT Achievements
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Badge 1 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.04, rotate: [0, -1, 1, 0], transition: { duration: 0.3 } }}
            className="glass-panel p-6 border-slate-200 bg-white text-center hard-shadow hover:border-purple-400 transition-all space-y-3 relative overflow-hidden group shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-purple-100 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Award size={28} className="text-purple-700 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">Genesis Auditor</h4>
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full inline-block">
              Protocol Pioneer
            </p>
          </motion.div>

          {/* Badge 2 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.04, rotate: [0, 1, -1, 0], transition: { duration: 0.3 } }}
            className="glass-panel p-6 border-slate-200 bg-white text-center hard-shadow hover:border-purple-400 transition-all space-y-3 relative overflow-hidden group shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-555 to-cyan-500" />
            <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-purple-100 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck size={28} className="text-indigo-700" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">Escrow Master</h4>
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full inline-block">
              100+ Escrows Released
            </p>
          </motion.div>

          {/* Badge 3 (Locked) */}
          <div 
            className="glass-panel p-6 border-slate-200 bg-slate-50/50 text-center hard-shadow space-y-3 relative overflow-hidden group shadow-sm opacity-60 border-dashed"
          >
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none" />
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-slate-50 shadow-inner">
              <Lock size={24} className="text-slate-400" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-500">Oracle Tier</h4>
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full inline-block">
              Locked (Rank #10 Req)
            </p>
          </div>

          {/* Badge 4 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.04, rotate: [0, -1, 1, 0], transition: { duration: 0.3 } }}
            className="glass-panel p-6 border-slate-200 bg-white text-center hard-shadow hover:border-purple-400 transition-all space-y-3 relative overflow-hidden group shadow-sm hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-purple-100 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 size={28} className="text-emerald-700" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">Identity Verified</h4>
            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full inline-block">
              GitHub Attestation
            </p>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
};
