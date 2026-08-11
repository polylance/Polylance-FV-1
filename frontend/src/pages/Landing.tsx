import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { ArrowRight, Wallet, Lock, History, Network, Activity, PlusCircle, Search, FileText, Cpu, CheckCircle2, ShieldCheck, ChevronDown, Sparkles, HelpCircle, User, XCircle, Percent, Shield, Scale, Zap, LayoutGrid, Box } from 'lucide-react';

export const Landing: React.FC = () => {
  const { isConnected, address, currentRole } = useWeb3();
  const { jobs, profiles } = usePolyLanceData();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleGetStarted = () => {
    if (!isConnected) {
      navigate('/login');
      return;
    }
    const profile = profiles[address];
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
      {/* Hero Section matching landing_connect_wallet/code.html */}
      <section className="hero-gradient pt-8 pb-12">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 rounded-full border border-purple-200">
              <ShieldCheck size={16} className="text-purple-700" />
              <span className="font-label-mono uppercase tracking-wider text-xs font-bold">
                PolyLance Zenith • Sovereign Escrow Protocol
              </span>
            </div>

            <h1 className="font-headline text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
              Verifiable Reputation. <br />
              <span className="gradient-text-purple-pink">Immutable Professionalism.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              The world's first decentralized talent protocol where work history is written in stone. No inflated resumes. No fake reviews. Just pure, on-chain performance.
            </p>

            {/* HERO CTA BUTTONS */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleGetStarted}
                className="gradient-btn-primary px-8 py-3.5 rounded-xl font-headline font-bold text-base flex items-center gap-2.5 hard-shadow cursor-pointer"
              >
                <Wallet size={18} />
                {isConnected ? 'Go to Dashboard' : 'Connect Wallet to Start'}
                <ArrowRight size={18} />
              </button>

              {currentRole === 'client' ? (
                <Link
                  to="/jobs/post"
                  className="glass-panel px-8 py-3.5 rounded-xl font-headline font-bold text-purple-900 text-base hover:bg-slate-50 border-purple-200 transition-all flex items-center gap-2"
                >
                  <PlusCircle size={18} className="text-purple-700" />
                  Post Job Escrow
                </Link>
              ) : (
                <Link
                  to="/jobs"
                  className="glass-panel px-8 py-3.5 rounded-xl font-headline font-bold text-slate-800 text-base hover:bg-slate-50 border-slate-200 transition-all flex items-center gap-2"
                >
                  <Search size={18} className="text-purple-700" />
                  Browse Jobs (Marketplace)
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Reputation Card Mockup from reference HTML */}
          <div className="md:col-span-5 relative">
            <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-slate-900">Alex Rivera</h3>
                    <p className="font-label-mono text-xs text-purple-700 font-semibold">0x71C...3921</p>
                  </div>
                </div>
                <span className="bg-purple-900 text-white px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase">
                  TOP RATED
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Success Rate</span>
                  <span className="font-bold text-emerald-600">99.2%</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Jobs Completed</span>
                  <span className="font-bold text-purple-700">142</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Volume Handled</span>
                  <span className="font-bold text-purple-900">$42,500 USDC</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 font-data-hash text-[11px] text-purple-900">
                <span className="text-purple-700 font-bold">sig:</span> 0xf82a...9b2c (Verified by PolyLance Protocol)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY POLYLANCE COMPARISON MATRIX SECTION */}
      <section className="space-y-12 py-10 border-t border-b border-slate-100">
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
            <span className="absolute top-3 right-3 bg-purple-650 bg-purple-600 text-white text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-purple-500 flex items-center gap-1 shadow-2xs">
              <Sparkles size={8} /> Web3
            </span>

            <div className="flex items-center gap-3">
              <PolyLanceLogo size={66} className="shrink-0" />
              <div>
                <h3 className="font-headline text-lg font-black text-slate-900 leading-tight font-heading">PolyLance</h3>
                <span className="text-[10px] font-mono text-purple-755 text-purple-700 font-bold uppercase">Future of Freelancing</span>
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
      </section>

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
          <div className="border border-slate-250 bg-white/60 p-1 rounded-full flex items-center gap-2.5 shadow-3xs shrink-0 max-w-max self-start sm:self-center">
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
              <div className="rounded-2xl bg-white border border-slate-150 p-4 flex items-center justify-between shadow-3xs hover:shadow-sm transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 relative">
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
              </div>
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

        <div className="space-y-4 relative z-10">
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
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? 'border-purple-500 bg-purple-50/15 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-3xs hover:shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer group transition-colors duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Index Number Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors duration-300 ${
                      isOpen ? 'bg-purple-100 text-purple-700' : 'bg-purple-50/50 text-purple-600/80 border border-purple-100/30'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <span className="font-satoshi font-bold text-slate-900 text-sm leading-tight">
                      {faq.q}
                    </span>
                  </div>

                  {/* Circular Chevron Button */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen ? 'bg-purple-600 text-white shadow-sm scale-105' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex gap-4 px-6 pb-6 pt-1 border-t border-slate-100/40 bg-white/60">
                      {/* Decorative Line & Icon Column */}
                      <div className="flex flex-col items-center shrink-0 relative pt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-purple-400 to-purple-300 my-1 min-h-[48px]" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-purple-50 border border-purple-200/50 flex items-center justify-center text-purple-700 shadow-3xs shrink-0">
                          <Shield size={16} />
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-300" />
                      </div>

                      {/* Answer & Badges list */}
                      <div className="flex-1 space-y-4 pl-4 sm:pl-8 pt-1">
                        <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-sans font-medium">
                          {faq.a}
                        </p>

                        {/* Horizontal Tags Badge */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {faqTags.map((tag, tagIdx) => (
                            <div
                              key={tagIdx}
                              className="flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-100/50 px-3 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider shadow-4xs"
                            >
                              {tag.icon}
                              <span>{tag.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Real-Time Protocol Stats matching landing_connect_wallet/code.html */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-extrabold text-slate-900 leading-tight">
            Institutional Trust for the <span className="gradient-text-purple-pink">Decentralized Workforce</span>.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            PolyLance isn't just another job board. It's a financial terminal for talent. By removing middlemen and replacing them with smart contract code, we ensure that top engineers get paid fastest.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-3">
              <img
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Developer Avatar"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Developer Avatar"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                alt="Developer Avatar"
              />
            </div>
            <span className="font-label-mono text-xs text-purple-900 font-bold">
              +1,200 Verified Pros On-Chain
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-label-mono text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2 font-bold">
              <Activity size={16} className="text-purple-700" /> Real-Time Protocol Stats
            </h4>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Live Mainnet Ledger
            </span>
          </div>

          <div className="space-y-4 font-mono">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Total Jobs Created</span>
                <span className="font-bold text-purple-900">{totalJobs} Jobs</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Total Escrow Value Locked</span>
                <span className="font-bold text-emerald-700">${totalEscrowUsdc.toLocaleString()} USDC</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full" style={{ width: '70%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Jobs Completed (SBTs Minted)</span>
                <span className="font-bold text-purple-700">{completedJobs}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Footer Bar matching reference HTML */}
      <section className="glass-panel p-6 border-slate-200 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-center">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Total Jobs</p>
            <p className="stat-number text-slate-900">{totalJobs}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Total in Escrow</p>
            <p className="stat-number text-emerald-600">${totalEscrowUsdc.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Dispute Rate</p>
            <p className="stat-number text-amber-600">0.02%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Verified Pros</p>
            <p className="stat-number text-purple-700">1,200+</p>
          </div>
        </div>
      </section>
    </div>
  );
};
