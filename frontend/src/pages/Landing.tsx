import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring, animate } from 'motion/react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import {
  ArrowRight,
  Wallet,
  Lock,
  Search,
  PlusCircle,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  HelpCircle,
  User,
  XCircle,
  Percent,
  Shield,
  Scale,
  Zap,
  LayoutGrid,
  Box,
  Briefcase,
  TrendingUp,
  Users,
  Star,
  FileText,
  Cpu,
  CheckCircle2,
  Network,
  Activity,
  ArrowDown,
  Trophy,
  BarChart3
} from 'lucide-react';
import { scrollReveal } from '../lib/motion';

export const Landing: React.FC = () => {
  const { isConnected, address, currentRole } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.96]);
  const smoothHeroScale = useSpring(heroScale, { stiffness: 100, damping: 30 });
  const heroY = useTransform(scrollY, [0, 300], [0, -20]);
  const logoRotate = useTransform(scrollY, [0, 500], [0, 15]);
  const smoothLogoRotate = useSpring(logoRotate, { stiffness: 100, damping: 30 });
  const logoY = useTransform(scrollY, [0, 500], [0, 25]);

  const handleGetStarted = () => {
    if (!isConnected) {
      navigate('/login');
      return;
    }
    const profileKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
    const profile = profileKey ? profiles[profileKey] : null;
    if (profile && profile.displayName) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const totalEscrowUsdc = jobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);

  const faqs = [
    {
      q: 'How does PolyLance protect my project funds as a Client?',
      a: 'When you post a job, your USDC funds are locked into a non-custodial Polygon smart contract escrow. Funds are never held by PolyLance as a company. They are programmatically released to the freelancer only when you approve the milestone deliverable.'
    },
    {
      q: 'How do Freelancers get paid with 0% platform commission?',
      a: 'Traditional platforms like Upwork or Fiverr take 10% to 20% cut from every payout. PolyLance operates directly on Polygon smart contracts without centralized middlemen, so freelancers keep 100% of their earned crypto funds.'
    },
    {
      q: 'What is a Soulbound Reputation Token (EIP-5192)?',
      a: 'Upon successful contract completion, the PolyLance factory smart contract mints a non-transferable ERC-721 Soulbound Token (SBT) directly to your Web3 wallet address. This forms an immutable, un-fakeable record of your real-world work history that you permanently own.'
    },
    {
      q: 'How does GitHub Proof-of-Work Verification work?',
      a: 'PolyLance integrates with GitHub OAuth to audit your public repository commits, byte counts, and language distribution (e.g. 88k bytes Solidity, 42k bytes Rust). Your code metrics are signed into an on-chain cryptographic attestation token.'
    },
    {
      q: 'What happens if a dispute arises between a client and a freelancer?',
      a: 'If a milestone is disputed, the contract locks funds and forwards the evidence to the PolyLance DAO Judge Panel. Reputation-weighted arbitrators inspect the deliverables, commit cryptographically blinded votes, and execute fund distribution based on DAO quorum.'
    }
  ];

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative pt-6 pb-12 w-full max-w-6xl mx-auto"
      >

        {/* Subtle Ambient Particle Accents */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">

          {/* Left Column: Hero Text Content & Actions */}
          <motion.div
            style={{ scale: smoothHeroScale, y: heroY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Pill Header Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-900 rounded-full border border-purple-200/80 shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[11px] font-bold text-purple-800">
                POLYLANCE ZENITH • SOVEREIGN ESCROW PROTOCOL
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Verifiable Reputation. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                Immutable Professionalism.
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-sm sm:text-lg text-slate-600 leading-relaxed font-sans max-w-xl">
              The world's first decentralized talent protocol where work history is written in stone. No inflated resumes. No fake reviews. Just pure, on-chain performance.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={handleGetStarted}
                className="blue-glow-btn text-white px-8 py-4 rounded-xl font-headline font-bold text-base flex items-center justify-center gap-3 cursor-pointer"
              >
                <Wallet size={19} />
                <span>{isConnected ? 'Go to Dashboard' : 'Connect Wallet to Start'}</span>
                <ArrowRight size={19} />
              </button>

              <Link
                to="/jobs"
                className="liquid-glass px-7 py-4 rounded-xl font-headline font-bold text-slate-800 text-base hover:bg-white border-slate-200/80 transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Search size={18} className="text-purple-600" />
                <span>Browse Jobs (Marketplace)</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 3D Stage & Official Floating PolyLance Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative flex items-center justify-center py-6 lg:py-0"
          >
            {/* 3D Pedestal Platform Stage */}
            <div className="relative w-64 h-64 sm:w-88 sm:h-88 flex items-center justify-center">

              {/* Outer Glowing Stage Rings */}
              <div className="absolute inset-0 rounded-full stage-pedestal border border-purple-200/50 transform rotate-45 animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full stage-ring opacity-75" />
              <div className="absolute inset-10 rounded-full stage-ring opacity-50 border-dashed animate-[spin_25s_linear_infinite_reverse]" />

              {/* Pedestal Top Gloss Floor */}
              <div className="absolute bottom-4 w-56 sm:w-64 h-16 sm:h-20 bg-gradient-to-t from-purple-200/40 via-sky-200/30 to-transparent rounded-[100%] filter blur-xs" />

              {/* Floating Ambient 3D Translucent Cubes */}
              <motion.div
                animate={{ y: [-8, 8, -8], rotate: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-2 left-4 sm:left-6 w-8 h-8 sm:w-10 sm:h-10 rounded-xl floating-cube bg-white/40 flex items-center justify-center shadow-xs"
              >
                <Box size={18} className="text-cyan-500 opacity-80" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10], rotate: [0, -15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-10 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg floating-cube bg-white/40 flex items-center justify-center shadow-xs"
              >
                <Sparkles size={14} className="text-purple-500 opacity-80" />
              </motion.div>

              <motion.div
                animate={{ y: [-12, 6, -12] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-6 left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl floating-cube bg-white/40 flex items-center justify-center shadow-xs"
              >
                <Shield size={16} className="text-blue-500 opacity-80" />
              </motion.div>

              {/* Centerpiece: Official Floating 3D PolyLance Emblem */}
              <motion.div
                style={{ rotate: smoothLogoRotate, y: logoY, willChange: 'transform' }}
                className="relative z-10 transform-gpu"
              >
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="p-4 sm:p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(37,99,235,0.22)] flex items-center justify-center group transform-gpu"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-400/20 via-blue-500/20 to-purple-600/20 filter blur-md -z-10 group-hover:blur-lg transition-all" />
                  <PolyLanceLogo size={100} className="filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)]" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* WHY POLYLANCE COMPARISON MATRIX SECTION */}
      <motion.section
        {...scrollReveal}
        className="space-y-12 py-10 border-t border-b border-slate-100"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="font-mono text-[10px] text-purple-800 bg-purple-100 border border-purple-200 px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles size={12} className="text-purple-700" /> Web3 Freelancing
          </span>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Why PolyLance Beats Traditional Freelancing
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-sans">
            A decentralized freelancing protocol where your reputation, payments, and work belong to you—not the platform.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-6 max-w-5xl mx-auto px-4">
          {/* Left Card: Traditional Platforms */}
          <div className="md:col-span-5 glass-panel p-6 sm:p-8 border-slate-200 bg-white shadow-xs space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-headline text-lg font-black text-slate-900 leading-tight">Traditional Platforms</h3>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Web2 Marketplace</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">20% Platform Fees</span>
                  <span className="text-xs text-slate-500 font-sans">High commissions on every payment.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Payment Holds</span>
                  <span className="text-xs text-slate-500 font-sans">Funds locked for several business days.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Locked Reputation</span>
                  <span className="text-xs text-slate-500 font-sans">Reviews stay inside the platform database.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Weak Verification</span>
                  <span className="text-xs text-slate-500 font-sans">Text reviews can be easily manipulated.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Centralized Disputes</span>
                  <span className="text-xs text-slate-500 font-sans">Platform company decides the outcome in secret.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Arrow */}
          <div className="md:col-span-1 flex flex-col items-center justify-center text-slate-400 py-4 md:py-0">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1 whitespace-nowrap">
              Old → Future
            </span>
            <div className="rotate-90 md:rotate-0 flex items-center justify-center bg-slate-100 border border-slate-200 w-8 h-8 rounded-full shadow-2xs">
              <ArrowRight size={16} className="text-slate-600" />
            </div>
          </div>

          {/* Right Card: PolyLance Future of Freelancing */}
          <div className="md:col-span-5 glass-panel p-6 sm:p-8 border-purple-300 bg-purple-50/50 shadow-sm space-y-6 relative overflow-hidden ring-1 ring-purple-100">
            {/* Web3 badge on top-right */}
            <span className="absolute top-3 right-3 bg-purple-600 bg-purple-600 text-white text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-purple-500 flex items-center gap-1 shadow-2xs">
              <Sparkles size={8} /> Web3
            </span>

            <div className="flex items-center gap-3">
              <PolyLanceLogo size={66} className="shrink-0" />
              <div>
                <h3 className="font-headline text-lg font-black text-slate-900 leading-tight font-heading">PolyLance</h3>
                <span className="text-[10px] font-mono text-purple-700 text-purple-700 font-bold uppercase">Future of Freelancing</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">0% Platform Fees</span>
                  <span className="text-xs text-slate-600 font-sans">Peer-to-peer smart contract payments.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Instant Settlement</span>
                  <span className="text-xs text-slate-655 text-slate-600 font-sans">Automatic release after milestone approval.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Own Your Reputation</span>
                  <span className="text-xs text-slate-655 text-slate-600 font-sans">Soulbound NFT stored permanently in your wallet.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">Proof of Work</span>
                  <span className="text-xs text-slate-655 text-slate-600 font-sans">Audited code bytes and GitHub verification.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block font-sans">DAO Arbitration</span>
                  <span className="text-xs text-slate-655 text-slate-600 font-sans">Community governed blind voting.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badges List */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto pt-6">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white/80 shadow-2xs hover:scale-105 transition-all shrink-0">
            <Percent size={14} className="text-purple-700 animate-pulse" />
            <span>0% Commission</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white/80 shadow-2xs hover:scale-105 transition-all shrink-0">
            <Wallet size={14} className="text-purple-700" />
            <span>Wallet Reputation</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white/80 shadow-2xs hover:scale-105 transition-all shrink-0">
            <Zap size={14} className="text-purple-700" />
            <span>Instant Payout</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white/80 shadow-2xs hover:scale-105 transition-all shrink-0">
            <Shield size={14} className="text-purple-700" />
            <span>DAO Security</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white/80 shadow-2xs hover:scale-105 transition-all shrink-0">
            <Cpu size={14} className="text-purple-700 animate-spin" />
            <span>Proof-of-Work</span>
          </div>
        </div>
      </motion.section>

      {/* TECHNICAL SPECIFICATION & WHITEPAPER VARIANT SECTION matching landing_whitepaper_aesthetic_variant */}
      <section className="glass-panel p-8 sm:p-10 border-slate-200 bg-white hard-shadow relative overflow-hidden space-y-8">
        {/* Subtle decorative elements matching image */}
        <div className="absolute right-[40%] top-[30%] w-24 h-24 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full blur-xl opacity-40 pointer-events-none" />
        <div className="absolute right-[33%] top-[40%] w-12 h-12 bg-white/40 border border-slate-200/50 shadow-xs rounded-xl rotate-12 flex items-center justify-center p-2 text-slate-300 font-bold pointer-events-none">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M9 17L15 12L9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            {/* Logo Document Icon Frame */}
            <div className="w-12 h-12 bg-purple-50 text-purple-700 border border-purple-100/50 rounded-2xl flex items-center justify-center shrink-0 shadow-3xs">
              <FileText size={22} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-purple-700">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                  TECHNICAL SPECIFICATION V1.0
                </span>
                <span className="h-1 w-1 rounded-full bg-purple-500" />
              </div>
              <h2 className="font-heading text-2xl font-black text-slate-900 leading-tight">
                Protocol Whitepaper & Architecture <span className="gradient-text-purple-pink">Primitive</span>
              </h2>
              {/* Custom underline accent */}
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-10 h-1 rounded-full bg-purple-600/80" />
                <div className="w-1 h-1 rounded-full bg-purple-400" />
              </div>
            </div>
          </div>

          {/* Double Pill Attestation Spec Badge */}
          <div className="border border-slate-200 bg-white/60 p-1 rounded-full flex items-center gap-2.5 shadow-3xs shrink-0 max-w-max self-start sm:self-center">
            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100/50 text-[10px] tracking-wide font-mono">
              EIP-5192
            </span>
            <span className="text-[10px] text-slate-500 font-sans pr-3 font-semibold">
              Soulbound Attestation Spec
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-sans border-l-[3px] border-purple-600/80 pl-4 py-1">
              PolyLance establishes a decentralized clearinghouse for professional merit. By anchoring work history to a cryptographically secured Polygon ledger, we eliminate the trust deficit in global remote employment.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="rounded-2xl bg-white border border-slate-150 p-4 flex items-center justify-between shadow-3xs hover:shadow-sm transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 relative">
                <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/10 rounded-2xl pointer-events-none transition-colors" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center text-purple-600 shrink-0">
                    <Shield size={16} />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-[9px] text-slate-400 font-bold tracking-wider block">SMART CONTRACT CORE</span>
                    <span className="font-satoshi text-xs font-bold text-slate-800 block">ERC-20 Minimal Proxy Clones</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-3xs shrink-0">
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Card 2 */}
              <Link
                to="/chat"
                className="rounded-2xl bg-white border border-slate-150 p-4 flex items-center justify-between shadow-3xs hover:shadow-sm transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 relative block"
              >
                <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/10 rounded-2xl pointer-events-none transition-colors" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center text-purple-600 shrink-0">
                    <Lock size={16} />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-[9px] text-slate-400 font-bold tracking-wider block">ENCRYPTED TRANSPORT</span>
                    <span className="font-satoshi text-xs font-bold text-slate-800 block">XMTP Peer-to-Peer Protocol</span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full border border-slate-200 group-hover:border-blue-500 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-3xs shrink-0">
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            {/* System Diagram Dark Glass Box */}
            <div className="bg-[#0B0F1A]/95 text-slate-100 p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden font-mono text-[11px] space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Row 1 */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-purple-400" /> SYSTEM DIAGRAM SPEC
                </span>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
                  POLYLANCE_CORE_V1
                </span>
              </div>

              {/* Specs Rows */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Box size={14} className="text-blue-400 shrink-0" />
                    <span>FACTORY_CONTRACT</span>
                  </span>
                  <span className="text-blue-400 font-bold">0x1a2b...9a0b</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Scale size={14} className="text-purple-400 shrink-0" />
                    <span>DISPUTE_JURY_ORACLE</span>
                  </span>
                  <span className="text-purple-400 font-bold">0xc3d4...a1b2</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-indigo-400 shrink-0" />
                    <span>ATTRIBUTION_SBT</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ERC-5192 Locked <CheckCircle2 size={12} className="inline text-emerald-400" />
                  </span>
                </div>
              </div>

              {/* Bottom Divider */}
              <div className="border-t border-slate-800/60 my-2 pt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Network size={20} className="text-purple-400" />
                  <div className="font-sans">
                    <span className="text-[9px] text-slate-500 block leading-tight font-medium">Polygon Mainnet Height</span>
                    <span className="text-sm font-bold text-slate-100 block font-heading">18,294,012</span>
                  </div>
                </div>
                <div className="text-right font-sans">
                  <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sync Active</span>
                  </span>
                  <span className="text-[9px] text-slate-500 block font-medium">Network Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) SECTION FOR NEW USERS */}
      <section className="glass-panel p-8 sm:p-10 border-slate-200 bg-white hard-shadow space-y-6 relative overflow-hidden">
        {/* Subtle background grids */}
        <div className="absolute left-[3%] top-[10%] w-24 h-24 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full blur-2xl opacity-30 pointer-events-none" />
        <div className="absolute right-[5%] bottom-[15%] w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-35 pointer-events-none" />

        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 max-w-max mx-auto font-mono text-[9px] font-bold uppercase tracking-widest">
            <HelpCircle size={12} className="text-purple-600 animate-pulse" />
            <span>Knowledge Base & FAQ</span>
          </div>
          
          <h2 className="font-heading text-3xl font-black text-slate-900 leading-tight">
            Frequently Asked Questions <span className="gradient-text-purple-pink">for New Users</span>
          </h2>
          
          <p className="text-xs text-slate-500 font-sans">
            Find answers to the most common questions about PolyLance.
          </p>

          <div className="flex items-center justify-center gap-1.5 pt-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
            <div className="w-8 h-1 rounded-full bg-purple-600" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
          </div>
        </div>

        <div className="space-y-4 relative z-10 text-left max-w-4xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            
            // Contextual badges based on FAQ index
            const faqTags = [
              // Q1
              [
                { text: 'Non-Custodial', icon: <Lock size={11} /> },
                { text: 'Smart Contract Secured', icon: <FileText size={11} /> },
                { text: 'Client Controlled', icon: <User size={11} /> }
              ],
              // Q2
              [
                { text: 'Direct P2P Payouts', icon: <Network size={11} /> },
                { text: 'No Central Middlemen', icon: <Activity size={11} /> },
                { text: 'Keep 100% Crypto', icon: <Percent size={11} /> }
              ],
              // Q3
              [
                { text: 'EIP-5192 Attestation', icon: <Sparkles size={11} /> },
                { text: 'Non-Transferable SBT', icon: <Lock size={11} /> },
                { text: 'On-Chain Provenance', icon: <User size={11} /> }
              ],
              // Q4
              [
                { text: 'GitHub OAuth Verified', icon: <Cpu size={11} /> },
                { text: 'Code Byte Analytics', icon: <Search size={11} /> },
                { text: 'Cryptographic Signature', icon: <ShieldCheck size={11} /> }
              ],
              // Q5
              [
                { text: 'DAO Arbitration', icon: <Scale size={11} /> },
                { text: 'Reputation Voting', icon: <ShieldCheck size={11} /> },
                { text: 'Escrow Quorum Resolution', icon: <HelpCircle size={11} /> }
              ]
            ][idx] || [];

            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  borderColor: isOpen ? '#9333EA' : '#E2E8F0',
                  backgroundColor: isOpen ? '#FAF5FF' : '#FFFFFF',
                }}
                transition={{ duration: 0.3 }}
                className={`border rounded-2xl overflow-hidden transition-shadow duration-300 ${
                  isOpen
                    ? 'shadow-md shadow-purple-500/10 ring-1 ring-purple-500/20'
                    : 'hover:border-purple-200 hover:shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <motion.div
                      animate={{
                        scale: isOpen ? 1.08 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors duration-300 ${
                        isOpen
                          ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30'
                          : 'bg-purple-50/60 text-purple-700 border border-purple-100/60'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </motion.div>
                    <span className="font-satoshi font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {faq.q}
                    </span>
                  </div>

                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                      scale: isOpen ? 1.1 : 1,
                      backgroundColor: isOpen ? '#7C3AED' : '#F8FAFC',
                      color: isOpen ? '#FFFFFF' : '#94A3B8',
                    }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="px-6 pb-6 pt-2 border-t border-purple-100/60 bg-gradient-to-b from-purple-50/30 to-white/80"
                      >
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                          {faq.a}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Real-Time Protocol Stats Section */}
      <section className="grid md:grid-cols-2 gap-8 items-start py-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100/50 text-[10px] uppercase font-bold tracking-widest w-fit shadow-4xs">
            <ShieldCheck size={13} className="text-blue-700" />
            Trusted by Builders. Powered by Blockchain.
          </div>

          <h2 className="font-headline text-3xl font-black text-slate-900 leading-tight text-left">
            Institutional Trust <br />
            for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-black" style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>Decentralized <br />Workforce</span>.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed text-left">
            PolyLance isn't just another job board. It's a financial terminal for talent. By removing middlemen and replacing them with smart contract code, we ensure that top engineers get paid fastest.
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
          {/* Card Header with Glowing Wave */}
          <div className="bg-slate-950 p-4 flex items-center justify-between text-white relative overflow-hidden">
            <div className="space-y-1 relative z-10 text-left">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f8fafc' }}>
                REAL-TIME PROTOCOL STATS
              </h4>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-none w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Mainnet Ledger
              </span>
            </div>
            
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-6 text-purple-400 opacity-30 select-none pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 100 30">
              <path d="M0,15 L30,15 L35,5 L40,25 L45,15 L50,15 L55,0 L60,30 L65,15 L100,15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="p-5 space-y-4">
            {/* Stat Row 1 */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-3xs">
                <Briefcase size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Total Jobs Created</span>
                  <span className="text-purple-700 font-mono font-bold">{totalJobs} Jobs</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500" style={{ width: totalJobs > 0 ? '40%' : '0%' }} />
                </div>
              </div>
            </div>

            {/* Stat Row 2 */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-3xs">
                <Lock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Total Escrow Value Locked</span>
                  <span className="text-emerald-700 font-mono font-bold">${totalEscrowUsdc.toLocaleString()} USDC</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-500" style={{ width: totalEscrowUsdc > 0 ? '50%' : '0%' }} />
                </div>
              </div>
            </div>

            {/* Stat Row 3 */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 shadow-3xs">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>Jobs Completed (SBTs Minted)</span>
                  <span className="text-blue-700 font-mono font-bold">{completedJobs}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500" style={{ width: completedJobs > 0 ? '40%' : '0%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Total Jobs */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Total Jobs</span>
              <p className="text-3xl font-black text-slate-805 font-sans">{totalJobs}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shadow-3xs">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="mt-4 pt-2">
            <svg className="w-24 h-24 mx-auto opacity-80 group-hover:scale-105 transition-transform" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="90" rx="40" ry="12" fill="#E0E7FF" opacity="0.6" />
              <ellipse cx="60" cy="87" rx="40" ry="12" fill="#EEF2F6" />
              <path d="M35 50 C35 48, 37 46, 40 46 L80 46 C83 46, 85 48, 85 50 L85 76 C85 79, 83 81, 80 81 L40 81 C37 81, 35 79, 35 76 Z" fill="url(#purpleGrad)" filter="drop-shadow(0px 8px 12px rgba(124, 58, 237, 0.15))" />
              <path d="M50 46 V41 C50 39, 52 37, 55 37 H65 C68 37, 70 39, 70 41 V46" stroke="url(#purpleGrad)" strokeWidth="3" fill="none" />
              <rect x="56" y="58" width="8" height="8" rx="2" fill="#A78BFA" />
              <line x1="60" y1="62" x2="60" y2="66" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="purpleGrad" x1="35" y1="37" x2="85" y2="81" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2 - Total in Escrow */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-slate-455 font-bold uppercase font-mono tracking-wider">Total in Escrow</span>
              <p className="text-3xl font-black text-emerald-600 font-sans">${totalEscrowUsdc.toLocaleString()}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-3xs">
              <Lock size={16} />
            </div>
          </div>
          <div className="mt-4 pt-2">
            <svg className="w-24 h-24 mx-auto opacity-85 group-hover:scale-105 transition-transform" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="90" rx="40" ry="12" fill="#DCFCE7" opacity="0.6" />
              <ellipse cx="60" cy="87" rx="40" ry="12" fill="#EEF2F6" />
              <rect x="42" y="52" width="36" height="28" rx="6" fill="url(#greenGrad)" filter="drop-shadow(0px 8px 12px rgba(16, 185, 129, 0.15))" />
              <path d="M49 52 V44 C49 38, 54 33, 60 33 C66 33, 71 38, 71 44 V52" stroke="url(#greenGrad)" strokeWidth="4" fill="none" />
              <circle cx="60" cy="62" r="3.5" fill="#34D399" />
              <path d="M60 65 L60 72" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="greenGrad" x1="42" y1="33" x2="78" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3 - Dispute Rate */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-slate-455 font-bold uppercase font-mono tracking-wider">Dispute Rate</span>
              <p className="text-3xl font-black text-amber-600 font-sans">0.02%</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shadow-3xs">
              <Scale size={16} />
            </div>
          </div>
          <div className="mt-4 pt-2">
            <svg className="w-24 h-24 mx-auto opacity-85 group-hover:scale-105 transition-transform" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="90" rx="40" ry="12" fill="#FEF3C7" opacity="0.6" />
              <ellipse cx="60" cy="87" rx="40" ry="12" fill="#EEF2F6" />
              <path d="M42 42 C42 42, 60 36, 60 36 C60 36, 78 42, 78 42 V60 C78 72, 60 81, 60 81 C60 81, 42 72, 42 60 Z" fill="url(#goldGrad)" filter="drop-shadow(0px 8px 12px rgba(245, 158, 11, 0.15))" />
              <path d="M53 58 L58 63 L67 52" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="goldGrad" x1="42" y1="36" x2="78" y2="81" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4 - Verified Pros */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-slate-455 font-bold uppercase font-mono tracking-wider">Verified Pros</span>
              <p className="text-3xl font-black text-purple-600 font-sans">{Object.keys(profiles).length}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-3xs">
              <User size={16} />
            </div>
          </div>
          <div className="mt-4 pt-2">
            <svg className="w-24 h-24 mx-auto opacity-85 group-hover:scale-105 transition-transform" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="90" rx="40" ry="12" fill="#F3E8FF" opacity="0.6" />
              <ellipse cx="60" cy="87" rx="40" ry="12" fill="#EEF2F6" />
              <circle cx="48" cy="53" r="8" fill="url(#userPurpleGrad)" />
              <path d="M36 73 C36 66, 41 62, 48 62 C52.5 62, 56.5 64.5, 58.5 68" stroke="#EEF2F6" strokeWidth="1.5" fill="url(#userPurpleGrad)" />
              <circle cx="72" cy="53" r="8" fill="url(#userPurpleGrad)" />
              <path d="M84 73 C84 66, 79 62, 72 62 C67.5 62, 63.5 64.5, 61.5 68" stroke="#EEF2F6" strokeWidth="1.5" fill="url(#userPurpleGrad)" />
              <circle cx="60" cy="48" r="9" fill="url(#userPurpleGradMain)" />
              <path d="M46 70 C46 62, 52 58, 60 58 C68 58, 74 62, 74 70 Z" stroke="#EEF2F6" strokeWidth="1.5" fill="url(#userPurpleGradMain)" />
              <circle cx="74" cy="70" r="5" fill="#10B981" />
              <path d="M72 70 L73.5 71.5 L76 68.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="userPurpleGrad" x1="36" y1="45" x2="84" y2="73" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#DDD6FE" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="userPurpleGradMain" x1="46" y1="39" x2="74" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};
