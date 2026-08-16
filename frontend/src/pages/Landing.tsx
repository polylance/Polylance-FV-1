import React, { useState, useRef, useEffect } from 'react';
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
  ArrowDown
} from 'lucide-react';
import { scrollReveal } from '../lib/motion';

// ── Animated Number Counter Component ──────────────────────────────────────────
interface CounterProps {
  from?: number;
  to: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  decimals = 0,
  duration = 2,
  prefix = '',
  suffix = ''
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const node = ref.current;
    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(value) {
        node.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      }
    });
    return () => controls.stop();
  }, [isInView, from, to, decimals, duration, prefix, suffix]);

  return <span ref={ref}>{prefix}{from.toFixed(decimals)}{suffix}</span>;
};

// ── Main Redesigned Landing Component ──────────────────────────────────────────
export const Landing: React.FC = () => {
  const { isConnected, address, currentRole } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Hero Scroll Target Ref for linked viewport scroll step animations
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  // Motion Transforms for instruction spec scroll steps:
  // Gentle, ultra-smooth transforms so scroll feels completely natural
  const heroScale = useTransform(heroScroll, [0, 0.8], [1, 0.97]);
  const logoRotate = useTransform(heroScroll, [0, 0.8], [0, 8]);
  const heroY = useTransform(heroScroll, [0, 0.8], [0, -15]);
  const logoY = useTransform(heroScroll, [0, 0.8], [0, -12]);

  // Gentle, comfortable fade so hero stays clearly readable
  const heroOpacity = useTransform(heroScroll, [0.4, 0.95], [1, 0.85]);

  // Silky smooth springs with higher damping
  const smoothHeroScale = useSpring(heroScale, { stiffness: 60, damping: 30 });
  const smoothLogoRotate = useSpring(logoRotate, { stiffness: 60, damping: 30 });

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

  const scrollToWhySection = () => {
    const whySection = document.getElementById('why-polylance-section');
    if (whySection) {
      whySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'Completed').length;
  const disputedJobs = jobs.filter((j) => j.status === 'Disputed' || j.dispute).length;
  const totalEscrowUsdc = jobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0);
  const verifiedPros = Object.values(profiles).length > 0
    ? Object.values(profiles).filter((p) => p.githubVerified || Boolean(p.githubUsername?.trim()) || (p.skills && p.skills.length > 0) || Boolean(p.displayName)).length
    : jobs.flatMap((j) => [j.freelancer, ...j.applications.map((a) => a.applicant)]).filter(Boolean).length;
  const disputeRateNum = totalJobs > 0 ? Number(((disputedJobs / totalJobs) * 100).toFixed(1)) : 0;

  const realSuccessRate = totalJobs > 0
    ? Number((((totalJobs - disputedJobs) / totalJobs) * 100).toFixed(1))
    : 100;

  // Real data dynamic formatters
  const prosStat = verifiedPros >= 1000
    ? { to: Number((verifiedPros / 1000).toFixed(1)), decimals: 1, suffix: 'K+' }
    : { to: verifiedPros, decimals: 0, suffix: '' };

  const jobsStat = completedJobs >= 1000
    ? { to: Number((completedJobs / 1000).toFixed(1)), decimals: 1, suffix: 'K+' }
    : { to: completedJobs, decimals: 0, suffix: '' };

  const escrowStat = totalEscrowUsdc >= 1_000_000
    ? { to: Number((totalEscrowUsdc / 1_000_000).toFixed(1)), decimals: 1, prefix: '$', suffix: 'M+' }
    : totalEscrowUsdc >= 1_000
      ? { to: Number((totalEscrowUsdc / 1_000).toFixed(1)), decimals: 1, prefix: '$', suffix: 'K+' }
      : { to: totalEscrowUsdc, decimals: totalEscrowUsdc % 1 !== 0 ? 2 : 0, prefix: '$', suffix: '' };

  const rateStat = {
    to: realSuccessRate,
    decimals: realSuccessRate % 1 !== 0 ? 1 : 0,
    suffix: '%'
  };

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
    <div className="space-y-24 py-4 max-w-7xl mx-auto overflow-hidden">

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 1: INITIAL VIEW (HERO) + 3D PEDESTAL STAGE & SCROLL INTERACTION
          ────────────────────────────────────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative min-h-[85vh] flex flex-col justify-between pt-6 pb-12 wave-bg-light rounded-3xl px-6 sm:px-12 border border-purple-100/60 shadow-xs"
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
                <span>Go to Dashboard</span>
                <ArrowRight size={19} />
              </button>

              <Link
                to="/jobs"
                className="liquid-glass px-7 py-4 rounded-xl font-headline font-bold text-slate-800 text-base hover:bg-white border-slate-200/80 transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Search size={18} className="text-purple-600" />
                <span>Browse Jobs</span>
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
                  <PolyLanceLogo size={110} className="filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)] hidden sm:block" />
                  <PolyLanceLogo size={85} className="filter drop-shadow-[0_10px_25px_rgba(37,99,235,0.4)] sm:hidden" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Down Cue Indicator */}
        <div className="pt-8 flex justify-end">
          <button
            onClick={scrollToWhySection}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 shadow-md hover:shadow-lg transition-all duration-300 animate-bounce cursor-pointer group"
            title="Scroll Down"
          >
            <ArrowDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </motion.section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 2: INSTITUTIONAL TRUST & REAL-TIME PROTOCOL STATS
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-12">
        <div className="bg-gradient-to-br from-slate-50/90 via-purple-50/40 to-sky-50/30 p-8 sm:p-12 rounded-3xl border border-purple-100/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">

            {/* Left Column: Institutional Trust Copy */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 border border-purple-200 rounded-full shadow-2xs">
                <ShieldCheck size={14} className="text-purple-600" />
                <span className="font-mono uppercase tracking-wider text-[10px] font-bold text-slate-700">
                  TRUSTED BY BUILDERS. POWERED BY BLOCKCHAIN.
                </span>
              </div>

              {/* Heading */}
              <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.18] tracking-tight">
                Institutional Trust for the{' '}
                <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 bg-clip-text text-transparent">
                  Decentralized
                </span>{' '}
                Workforce.
              </h2>

              {/* Supporting Text */}
              <div className="space-y-3 text-slate-600 font-sans text-sm sm:text-base leading-relaxed max-w-2xl">
                <p className="font-medium text-slate-800">
                  PolyLance isn't just another job board. It's a financial terminal for talent.
                </p>
                <p>
                  By removing middlemen and replacing them with smart contract code, we ensure that top engineers get paid faster, work credentials remain tamper-proof, and escrows execute autonomously.
                </p>
              </div>
            </motion.div>

            {/* Right Column: Real-Time Protocol Stats Terminal Card */}
            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="bg-white p-7 sm:p-8 rounded-[24px] border border-purple-200/80 shadow-md space-y-6 text-left">
                {/* Header + Status Pill */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Cpu size={15} className="text-purple-600" /> REAL-TIME PROTOCOL STATS
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Mainnet Ledger
                  </span>
                </div>

                {/* Live Data Row 1: Total Jobs Created */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">TOTAL JOBS CREATED</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      <Counter to={totalJobs} decimals={0} suffix=" Jobs" />
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${totalJobs === 0 ? 0 : Math.min(100, Math.max(6, (totalJobs / Math.max(10, totalJobs * 2)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Live Data Row 2: Total Escrow Value Locked */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">TOTAL ESCROW VALUE LOCKED</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      ${totalEscrowUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${totalEscrowUsdc <= 0 ? 0 : Math.min(100, Math.max(4, (totalEscrowUsdc / Math.max(250, totalEscrowUsdc * 2.5)) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Live Data Row 3: Jobs Completed (SBTs Minted) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider">JOBS COMPLETED (SBTs MINTED)</span>
                    <span className="font-extrabold text-purple-900 text-sm">
                      <Counter to={completedJobs} decimals={0} suffix=" SBTs" />
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-sky-600 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${completedJobs === 0 ? 0 : totalJobs > 0 ? (completedJobs / totalJobs) * 100 : Math.min(100, completedJobs * 10)}%` }}
                    />
                  </div>
                </div>

                {/* Technical Footnote */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <span className="flex items-center gap-1">
                    <Network size={12} className="text-purple-600" /> Polygon PoS Escrow Protocol
                  </span>
                  <span>EIP-5192 Compliant</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              SECTION 3: PROTOCOL KPI CARDS (4 HORIZONTALLY ALIGNED STATS)
              ────────────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">

            {/* KPI Card 1: TOTAL JOBS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all text-left space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL JOBS</span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 group-hover:scale-105 transition-transform">
                  <Briefcase size={18} />
                </div>
              </div>
              <div className="font-headline text-3xl font-black text-slate-900 font-mono">
                <Counter to={totalJobs} decimals={0} />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-medium flex items-center gap-1">
                <Activity size={12} className="text-purple-600" /> Active on-chain marketplace
              </p>
            </motion.div>

            {/* KPI Card 2: TOTAL IN ESCROW */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all text-left space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL IN ESCROW</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:scale-105 transition-transform">
                  <Lock size={18} />
                </div>
              </div>
              <div className="font-headline text-3xl font-black text-emerald-700 font-mono">
                ${totalEscrowUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-medium flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" /> Non-custodial smart contracts
              </p>
            </motion.div>

            {/* KPI Card 3: DISPUTE RATE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-cyan-300 transition-all text-left space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">DISPUTE RATE</span>
                <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100 group-hover:scale-105 transition-transform">
                  <Scale size={18} />
                </div>
              </div>
              <div className="font-headline text-3xl font-black text-slate-900 font-mono">
                <Counter to={disputeRateNum} decimals={1} suffix="%" />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 size={12} className="text-cyan-600" /> DAO Arbitrator dispute resolution
              </p>
            </motion.div>

            {/* KPI Card 4: VERIFIED PROS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all text-left space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">VERIFIED PROS</span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
              </div>
              <div className="font-headline text-3xl font-black text-purple-900 font-mono">
                <Counter to={verifiedPros} decimals={0} />
              </div>
              <p className="text-[11px] text-slate-600 font-mono font-medium flex items-center gap-1">
                <Sparkles size={12} className="text-blue-600" /> GitHub E-KYC attested developers
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4: "WHY POLYLANCE BEATS TRADITIONAL FREELANCING" (WEB2 VS WEB3 COMPARISON)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-12 py-6">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="font-mono text-[11px] text-purple-800 bg-purple-100/80 border border-purple-200 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            WEB3 FREELANCING
          </span>

          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600">PolyLance</span> Beats Traditional Freelancing
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-sans max-w-xl mx-auto leading-relaxed">
            A decentralized freelancing protocol where your reputation, payments, and work belong to you—not the platform.
          </p>
        </motion.div>

        {/* Web2 vs Web3 Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-2">

          {/* Left Column: Traditional Platforms (Web2) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 bg-white p-7 sm:p-8 rounded-3xl border border-rose-200/80 shadow-xs space-y-6 text-left relative"
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold text-rose-700 uppercase tracking-widest block">WEB2 MARKETPLACE</span>
                <h3 className="font-headline text-xl font-bold text-slate-900 mt-0.5">Traditional Platforms</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-sm font-mono">
                Web2
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <XCircle size={17} className="text-rose-600 shrink-0" />
                  <span>20% Platform Fees</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">High commissions taken on every payment milestone.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <XCircle size={17} className="text-rose-600 shrink-0" />
                  <span>Payment Holds</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Funds locked for 5 to 14 business days before withdrawal.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <XCircle size={17} className="text-rose-600 shrink-0" />
                  <span>Locked Reputation</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Reviews stay trapped inside corporate database servers.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <XCircle size={17} className="text-rose-600 shrink-0" />
                  <span>Weak Verification</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Text reviews can be easily manipulated or deleted by admins.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-2">
                  <XCircle size={17} className="text-rose-600 shrink-0" />
                  <span>Centralized Disputes</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Platform company staff arbitrarily decides dispute outcomes.</p>
              </div>
            </div>
          </motion.div>

          {/* Middle Column: Visual Transition Indicator */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center my-2 lg:my-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 rounded-full shadow-xs font-mono text-xs font-extrabold text-purple-900">
              <span>WEB2</span>
              <ArrowRight size={14} className="text-purple-600 animate-pulse" />
              <span>WEB3</span>
            </div>
          </div>

          {/* Right Column: PolyLance (Web3) - Visually Dominant Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 bg-gradient-to-br from-white via-purple-50/50 to-sky-50/40 p-7 sm:p-8 rounded-3xl border-2 border-purple-300 shadow-xl space-y-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-purple-100 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <PolyLanceLogo size={36} />
                <div>
                  <span className="font-mono text-[10px] font-bold text-purple-700 uppercase tracking-widest block">FUTURE OF FREELANCING</span>
                  <h3 className="font-headline text-xl font-black text-slate-900">PolyLance</h3>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                WEB3 NATIVE
              </span>
            </div>

            <div className="space-y-4 font-sans text-xs sm:text-sm relative z-10">
              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span>0% Platform Fees</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Peer-to-peer smart contract payments with zero middleman fees.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span>Instant Settlement</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Automatic escrow release immediately upon client milestone approval.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span>Own Your Reputation</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Soulbound EIP-5192 tokens stored permanently in your Web3 wallet.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span>Proof of Work</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Audited code byte distribution and GitHub repository verification.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                  <span>DAO Arbitration</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">Community-governed decentralized dispute resolution.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Benefit Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-4 font-mono text-xs"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl shadow-2xs font-bold text-slate-800">
            <Percent size={14} className="text-purple-600" />
            <span>0% Commission</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl shadow-2xs font-bold text-slate-800">
            <Wallet size={14} className="text-purple-600" />
            <span>Wallet Reputation</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl shadow-2xs font-bold text-slate-800">
            <Zap size={14} className="text-purple-600" />
            <span>Instant Payout</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl shadow-2xs font-bold text-slate-800">
            <Shield size={14} className="text-purple-600" />
            <span>DAO Security</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/80 rounded-2xl shadow-2xs font-bold text-slate-800">
            <CheckCircle2 size={14} className="text-purple-600" />
            <span>Proof-of-Work</span>
          </div>
        </motion.div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 5: "WHY POLYLANCE?" FEATURE CARDS SECTION (PRESERVED)
          ────────────────────────────────────────────────────────────────────────── */}
      <section id="why-polylance-section" className="space-y-12 py-6">

        {/* Section Header */}
        <motion.div
          {...scrollReveal}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="font-mono text-[11px] text-purple-800 bg-purple-100/80 border border-purple-200 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
            BUILT ON WEB3. DESIGNED FOR TRUST.
          </span>

          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">PolyLance?</span>
          </h2>
        </motion.div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">

          {/* Card 1: On-Chain Verified */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 text-left group"
          >
            <div className="w-13 h-13 rounded-2xl bg-purple-100/70 border border-purple-200/60 flex items-center justify-center text-purple-700 shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldCheck size={26} />
            </div>
            <h3 className="font-headline text-lg font-bold text-slate-900">
              On-Chain Verified
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Every milestone, credential, and review is immutably recorded on-chain.
            </p>
          </motion.div>

          {/* Card 2: Secure Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 text-left group"
          >
            <div className="w-13 h-13 rounded-2xl bg-cyan-100/70 border border-cyan-200/60 flex items-center justify-center text-cyan-700 shadow-2xs group-hover:scale-105 transition-transform">
              <Lock size={26} />
            </div>
            <h3 className="font-headline text-lg font-bold text-slate-900">
              Secure Escrow
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Funds are locked in smart contracts and released only upon verified delivery.
            </p>
          </motion.div>

          {/* Card 3: Reputation That Follows */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 text-left group"
          >
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
              <TrendingUp size={26} />
            </div>
            <h3 className="font-headline text-lg font-bold text-slate-900">
              Reputation That Follows
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Your on-chain reputation is portable, verifiable, and always yours.
            </p>
          </motion.div>

          {/* Card 4: Decentralized Governance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 text-left group"
          >
            <div className="w-13 h-13 rounded-2xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={26} />
            </div>
            <h3 className="font-headline text-lg font-bold text-slate-900">
              Decentralized Governance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Community-driven decisions ensure transparency and fairness for all.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 3: DARK BANNER ("THE FUTURE OF WORK IS ON-CHAIN") + REAL ANIMATED STATS
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-[#090D16] text-white p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden space-y-10">

        {/* Dark Background Glow Particles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight">
            The Future of Work is On-Chain
          </h2>
        </div>

        {/* 4 Animated Real Stat Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 pt-2">

          {/* Stat 1: Verified Professionals */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400 shrink-0">
              <User size={22} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="font-headline text-2xl sm:text-3xl font-black text-white block">
                <Counter to={prosStat.to} decimals={prosStat.decimals} suffix={prosStat.suffix} />
              </span>
              <span className="text-xs text-slate-400 font-sans font-medium block">
                Verified Professionals
              </span>
            </div>
          </div>

          {/* Stat 2: Jobs Completed */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-blue-950/80 border border-blue-700/50 flex items-center justify-center text-blue-400 shrink-0">
              <Briefcase size={22} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="font-headline text-2xl sm:text-3xl font-black text-white block">
                <Counter to={jobsStat.to} decimals={jobsStat.decimals} suffix={jobsStat.suffix} />
              </span>
              <span className="text-xs text-slate-400 font-sans font-medium block">
                Jobs Completed
              </span>
            </div>
          </div>

          {/* Stat 3: Secured in Escrow */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="font-headline text-2xl sm:text-3xl font-black text-white block">
                <Counter to={escrowStat.to} prefix={escrowStat.prefix} decimals={escrowStat.decimals} suffix={escrowStat.suffix} />
              </span>
              <span className="text-xs text-slate-400 font-sans font-medium block">
                Secured in Escrow
              </span>
            </div>
          </div>

          {/* Stat 4: Success Rate */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
              <Star size={22} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="font-headline text-2xl sm:text-3xl font-black text-white block">
                <Counter to={rateStat.to} decimals={rateStat.decimals} suffix={rateStat.suffix} />
              </span>
              <span className="text-xs text-slate-400 font-sans font-medium block">
                Success Rate
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 4: FINAL CTA BANNER ("READY TO BUILD YOUR LEGACY?")
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="wave-bg-light rounded-3xl p-10 sm:p-14 border border-purple-100/70 text-center space-y-6 shadow-xs relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            Ready to Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500">Your Legacy?</span>
          </h2>
          <p className="text-base text-slate-600 font-sans leading-relaxed">
            Join PolyLance and make your work history unstoppable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleGetStarted}
              className="blue-glow-btn text-white px-8 py-4 rounded-xl font-headline font-bold text-base flex items-center gap-3 cursor-pointer"
            >
              <Wallet size={19} />
              <span>Go to Dashboard</span>
              <ArrowRight size={19} />
            </button>

            <Link
              to="/jobs"
              className="liquid-glass px-7 py-4 rounded-xl font-headline font-bold text-slate-800 text-base hover:bg-white border-slate-200/80 transition-all flex items-center gap-2.5 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Search size={18} className="text-purple-600" />
              <span>Browse Jobs (Marketplace)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          EXTRA SPEC: TECHNICAL ARCHITECTURE & FREQUENTLY ASKED QUESTIONS
          ────────────────────────────────────────────────────────────────────────── */}

      {/* TECHNICAL SPECIFICATION SECTION */}
      <section className="glass-panel p-8 sm:p-10 border-slate-200 bg-white hard-shadow relative overflow-hidden space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 border border-purple-100/50 rounded-2xl flex items-center justify-center shrink-0 shadow-3xs">
              <FileText size={22} />
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-purple-700">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                  TECHNICAL SPECIFICATION V1.0
                </span>
              </div>
              <h2 className="font-heading text-2xl font-black text-slate-900 leading-tight">
                Protocol Whitepaper & Architecture <span className="gradient-text-purple-pink">Primitive</span>
              </h2>
            </div>
          </div>

          <div className="border border-slate-200 bg-white/60 p-1 rounded-full flex items-center gap-2.5 shadow-3xs shrink-0 max-w-max self-start sm:self-center">
            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100/50 text-[10px] tracking-wide font-mono">
              EIP-5192
            </span>
            <span className="text-[10px] text-slate-500 font-sans pr-3 font-semibold">
              Soulbound Attestation Spec
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center text-left">
          <div className="md:col-span-7 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed font-sans border-l-[3px] border-purple-600/80 pl-4 py-1">
              PolyLance establishes a decentralized clearinghouse for professional merit. By anchoring work history to a cryptographically secured Polygon ledger, we eliminate the trust deficit in global remote employment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white border border-slate-150 p-4 flex items-center justify-between shadow-3xs hover:shadow-sm transition-all duration-300 group cursor-pointer relative">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center text-purple-600 shrink-0">
                    <Shield size={16} />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-[9px] text-slate-400 font-bold tracking-wider block">SMART CONTRACT CORE</span>
                    <span className="font-satoshi text-xs font-bold text-slate-800 block">ERC-20 Minimal Proxy Clones</span>
                  </div>
                </div>
              </div>

              <Link
                to="/chat"
                className="rounded-2xl bg-white border border-slate-150 p-4 flex items-center justify-between shadow-3xs hover:shadow-sm transition-all duration-300 group cursor-pointer relative block"
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center text-purple-600 shrink-0">
                    <Lock size={16} />
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="font-mono text-[9px] text-slate-400 font-bold tracking-wider block">ENCRYPTED TRANSPORT</span>
                    <span className="font-satoshi text-xs font-bold text-slate-800 block">XMTP Peer-to-Peer Protocol</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="bg-[#0B0F1A]/95 text-slate-100 p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden font-mono text-[11px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                  <LayoutGrid size={14} className="text-purple-400" /> SYSTEM DIAGRAM SPEC
                </span>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
                  POLYLANCE_CORE_V1
                </span>
              </div>

              <div className="space-y-3.5 pt-1 text-left">
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
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="glass-panel p-8 sm:p-10 border-slate-200 bg-white hard-shadow space-y-6 relative overflow-hidden">
        <div className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 max-w-max mx-auto font-mono text-[9px] font-bold uppercase tracking-widest">
            <HelpCircle size={12} className="text-purple-600 animate-pulse" />
            <span>Knowledge Base & FAQ</span>
          </div>
          <h2 className="font-heading text-3xl font-black text-slate-900 leading-tight">
            Frequently Asked Questions <span className="gradient-text-purple-pink">for New Users</span>
          </h2>
        </div>

        <div className="space-y-4 relative z-10 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen
                  ? 'border-purple-500 bg-purple-50/15 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-3xs'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${isOpen ? 'bg-purple-100 text-purple-700' : 'bg-purple-50/50 text-purple-600/80 border border-purple-100/30'
                      }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <span className="font-satoshi font-bold text-slate-900 text-sm leading-tight">
                      {faq.q}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-purple-600 text-white shadow-sm scale-105' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-slate-600'
                    }`}>
                    <ChevronDown size={15} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-white/60">
                    <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-sans font-medium">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
