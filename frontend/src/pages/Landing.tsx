import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useSpring, animate } from 'motion/react';
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
  Sparkles,
  User,
  Shield,
  Box,
  Briefcase,
  Users,
  Star,
  ArrowDown,
  BarChart3,
  XCircle,
  CheckCircle2,
  Percent,
  Zap,
  Code2
} from 'lucide-react';

const AnimatedStatValue: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => setDisplayValue(latest),
      });
      return () => controls.stop();
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

export const Landing: React.FC = () => {
  const { isConnected, address, currentRole } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const navigate = useNavigate();

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
    } else {
      navigate('/dashboard');
    }
  };

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const totalEscrowUsdc = jobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-headline font-bold text-base flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Wallet size={19} />
                <span>{isConnected ? 'Go to Dashboard' : 'Connect Wallet to Start'}</span>
                <ArrowRight size={19} />
              </button>

              <Link
                to="/jobs"
                className="liquid-glass px-7 py-4 rounded-xl font-headline font-bold text-slate-800 text-base hover:bg-white border-slate-200/80 transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer hover:scale-105 active:scale-95"
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
                  animate={{ y: [-6, 6, -6], rotate: [0, 2, 0, -2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="p-4 sm:p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(37,99,235,0.22)] flex items-center justify-center group transform-gpu"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-400/20 via-blue-500/20 to-purple-600/20 filter blur-md -z-10 group-hover:blur-lg transition-all" />
                  <PolyLanceLogo size={100} className="filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)]" />
                </motion.div>
              </motion.div>

              {/* Scroll Down Cue (Interactive Pulsing Arrow Button) */}
              <motion.button
                onClick={() => {
                  const el = document.getElementById('why-polylance');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.scrollTo({ top: 620, behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.15, y: 3 }}
                whileTap={{ scale: 0.92 }}
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute -bottom-2 -right-2 sm:right-2 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border border-purple-200/80 shadow-md flex items-center justify-center text-purple-600 hover:text-purple-900 hover:bg-purple-50 transition-all cursor-pointer z-20"
                title="Scroll Down"
              >
                <ArrowDown size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. WHY POLYLANCE? (BUILT ON WEB3. DESIGNED FOR TRUST) SECTION */}
      <motion.section
        id="why-polylance"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-10 py-6 relative"
      >
        {/* Floating Ambient Cube Accents */}
        <motion.div
          animate={{ y: [-6, 6, -6], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -left-3 w-8 h-8 rounded-lg bg-cyan-100/50 border border-cyan-200/60 shadow-xs flex items-center justify-center pointer-events-none hidden sm:flex"
        >
          <Box size={14} className="text-cyan-600" />
        </motion.div>

        <motion.div
          animate={{ y: [8, -8, 8], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-12 right-2 w-9 h-9 rounded-xl bg-purple-100/50 border border-purple-200/60 shadow-xs flex items-center justify-center pointer-events-none hidden sm:flex"
        >
          <Sparkles size={16} className="text-purple-600" />
        </motion.div>

        <div className="space-y-3 text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 text-[10px] font-mono font-bold uppercase tracking-wider shadow-2xs"
          >
            <span>BUILT ON WEB3. DESIGNED FOR TRUST.</span>
          </motion.div>

          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Why <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">PolyLance?</span>
          </h2>
        </div>

        {/* 4 Feature Bento Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: On-Chain Verified */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-200 transition-all text-left space-y-4 relative overflow-hidden group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shadow-2xs">
              <Shield size={22} className="text-purple-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-headline font-bold text-slate-900 text-base">On-Chain Verified</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                Every milestone, credential, and review is immutably recorded on-chain.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Secure Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-cyan-200 transition-all text-left space-y-4 relative overflow-hidden group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform shadow-2xs">
              <Lock size={22} className="text-cyan-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-headline font-bold text-slate-900 text-base">Secure Escrow</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                Funds are locked in smart contracts and released only upon verified delivery.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Reputation That Follows */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all text-left space-y-4 relative overflow-hidden group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-2xs">
              <BarChart3 size={22} className="text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-headline font-bold text-slate-900 text-base">Reputation That Follows</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                Your on-chain reputation is portable, verifiable, and always yours.
              </p>
            </div>
          </motion.div>

          {/* Card 4: Decentralized Governance */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-200 transition-all text-left space-y-4 relative overflow-hidden group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shadow-2xs">
              <Users size={22} className="text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-headline font-bold text-slate-900 text-base">Decentralized Governance</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                Community-driven decisions ensure transparency and fairness for all.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* 2.5 WHY POLYLANCE BEATS TRADITIONAL FREELANCING (COMPARISON MATRIX) */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-10 py-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs"
          >
            WEB3 FREELANCING
          </motion.span>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Why <span className="text-purple-600 font-black">PolyLance</span> Beats Traditional Freelancing
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-sans font-medium">
            A decentralized freelancing protocol where your reputation, payments, and work belong to you—not the platform.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-6 max-w-5xl mx-auto px-2">
          {/* Left Card: Traditional Platforms */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-5 p-7 sm:p-8 rounded-3xl border border-rose-100 bg-rose-50/40 shadow-xs space-y-6 text-left transition-all hover:shadow-md"
          >
            <div>
              <h3 className="font-headline text-lg font-bold text-rose-950 leading-tight">Traditional Platforms</h3>
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">WEB2 MARKETPLACE</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">20% Platform Fees</span>
                  <span className="text-xs text-slate-500 font-sans">High commissions on every payment.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Payment Holds</span>
                  <span className="text-xs text-slate-500 font-sans">Funds locked for several business days.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Locked Reputation</span>
                  <span className="text-xs text-slate-500 font-sans">Reviews stay inside the platform database.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Weak Verification</span>
                  <span className="text-xs text-slate-500 font-sans">Text reviews can be easily manipulated.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Centralized Disputes</span>
                  <span className="text-xs text-slate-500 font-sans">Platform company decides the outcome.</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Middle Transition Cue */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center text-purple-600 py-2 lg:py-0">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-purple-600 block mb-1 whitespace-nowrap">
              WEB2 → WEB3
            </span>
            <div className="hidden lg:flex items-center text-purple-400">
              <span className="text-sm tracking-tighter font-mono">--------&gt;</span>
            </div>
            <div className="lg:hidden flex items-center text-purple-400">
              <span className="text-sm tracking-tighter font-mono">↓</span>
            </div>
          </div>

          {/* Right Card: PolyLance Future of Freelancing */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="lg:col-span-5 p-7 sm:p-8 rounded-3xl border-2 border-purple-200 bg-white shadow-md space-y-6 text-left relative overflow-hidden transition-all hover:shadow-xl hover:border-purple-300 ring-1 ring-purple-50"
          >
            {/* Web3 badge on top-right */}
            <span className="absolute top-4 right-4 bg-purple-600 text-white text-[9px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              WEB3
            </span>

            <div>
              <h3 className="font-headline text-lg font-black text-purple-700 leading-tight">PolyLance</h3>
              <span className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-wider">FUTURE OF FREELANCING</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">0% Commission</span>
                  <span className="text-xs text-slate-600 font-sans">Zero middleman commission. Only a 2.5% platform maintenance fee routed to decentralized DAO treasury for protocol operations.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Instant Settlement</span>
                  <span className="text-xs text-slate-600 font-sans">Automatic release after milestone approval.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Own Your Reputation</span>
                  <span className="text-xs text-slate-600 font-sans">Soulbound reputation stored permanently in your wallet.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">Proof of Work</span>
                  <span className="text-xs text-slate-600 font-sans">Audited code bytes and GitHub verification.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block font-sans">DAO Arbitration</span>
                  <span className="text-xs text-slate-600 font-sans">Community-governed dispute resolution.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Badges List with Hover Physics */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 max-w-4xl mx-auto pt-2">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors cursor-default"
          >
            <Percent size={14} className="text-purple-600" />
            <span>0% Commission (2.5% Maint. Fee)</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors cursor-default"
          >
            <Wallet size={14} className="text-purple-600" />
            <span>Wallet Reputation</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors cursor-default"
          >
            <Zap size={14} className="text-purple-600" />
            <span>Instant Payout</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors cursor-default"
          >
            <Shield size={14} className="text-purple-600" />
            <span>DAO Security</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-colors cursor-default"
          >
            <Code2 size={14} className="text-purple-600" />
            <span>Proof-of-Work</span>
          </motion.div>
        </div>
      </motion.section>

      {/* 3. THE FUTURE OF WORK IS ON-CHAIN (DARK IMMERSIVE STATS BAND) */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full rounded-3xl bg-gradient-to-r from-[#090D1A] via-[#0F172A] to-[#0A1024] p-8 sm:p-12 text-white border border-slate-800 shadow-2xl relative overflow-hidden text-center space-y-8"
      >
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <h3 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
          The Future of Work is On-Chain
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Stat 1: Verified Professionals */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm shrink-0">
              <User size={20} />
            </div>
            <div>
              <div className="font-headline text-2xl sm:text-3xl font-black text-white">
                <AnimatedStatValue value={Object.keys(profiles).length} suffix="+" decimals={0} />
              </div>
              <span className="text-xs text-slate-400 font-sans block">Verified Professionals</span>
            </div>
          </div>

          {/* Stat 2: Jobs Completed */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-blue-900/60 border border-blue-500/30 flex items-center justify-center text-blue-300 shadow-sm shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="font-headline text-2xl sm:text-3xl font-black text-white">
                <AnimatedStatValue value={completedJobs} suffix="+" decimals={0} />
              </div>
              <span className="text-xs text-slate-400 font-sans block">Jobs Completed</span>
            </div>
          </div>

          {/* Stat 3: Total Escrow */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-sm shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="font-headline text-2xl sm:text-3xl font-black text-white">
                <AnimatedStatValue value={totalEscrowUsdc} prefix="$" suffix="" decimals={0} />
              </div>
              <span className="text-xs text-slate-400 font-sans block">Secured in Escrow</span>
            </div>
          </div>

          {/* Stat 4: Success Rate */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-amber-900/60 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Star size={20} className="fill-amber-300" />
            </div>
            <div>
              <div className="font-headline text-2xl sm:text-3xl font-black text-white">
                <AnimatedStatValue value={100} suffix="%" decimals={1} />
              </div>
              <span className="text-xs text-slate-400 font-sans block">Success Rate</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. READY TO BUILD YOUR LEGACY? (BOTTOM CTA BANNER) */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative py-12 px-6 sm:px-12 rounded-3xl bg-gradient-to-b from-purple-50/40 via-sky-50/30 to-white border border-purple-100 shadow-xs text-center space-y-6 overflow-hidden"
      >
        {/* Translucent Floating Cubes */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 left-8 w-10 h-10 rounded-xl bg-cyan-100/60 border border-cyan-200/80 shadow-xs flex items-center justify-center pointer-events-none hidden sm:flex"
        >
          <Box size={18} className="text-cyan-600" />
        </motion.div>

        <motion.div
          animate={{ y: [8, -8, 8], rotate: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-6 right-8 w-10 h-10 rounded-xl bg-purple-100/60 border border-purple-200/80 shadow-xs flex items-center justify-center pointer-events-none hidden sm:flex"
        >
          <Sparkles size={18} className="text-purple-600" />
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-2 relative z-10">
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Ready to Build <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">Your Legacy?</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-sans">
            Join PolyLance and make your work history unstoppable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-full font-headline font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Wallet size={16} />
            <span>{isConnected ? 'Go to Dashboard' : 'Get Started'}</span>
            <ArrowRight size={16} />
          </button>

          <Link
            to="/jobs"
            className="px-7 py-3.5 rounded-full font-headline font-bold text-slate-800 text-sm bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={15} className="text-purple-600" />
            <span>Browse Jobs (Marketplace)</span>
          </Link>
        </div>
      </motion.section>
    </div>
  );
};
