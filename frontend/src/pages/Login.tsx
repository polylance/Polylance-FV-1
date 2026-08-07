import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { DemoRole } from '../types';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { ShieldCheck, User, Briefcase, ArrowRight, Check, CheckCircle2, Zap, Sparkles, Lock, Network, Award, TrendingUp, Globe, FolderLock, Cpu, Rocket, DollarSign, Users, MessageSquare, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

const LaurelLeft = () => (
  <svg className="w-8 h-8 text-purple-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21A9 9 0 0 1 3 12A9 9 0 0 1 12 3" />
    <path d="M3 12h3" />
    <path d="M5 7h2.5" />
    <path d="M5 17h2.5" />
    <path d="M9 4.5l1.5 1.5" />
    <path d="M9 19.5l1.5-1.5" />
  </svg>
);

const LaurelRight = () => (
  <svg className="w-8 h-8 text-purple-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21a9 9 0 0 0 9-9a9 9 0 0 0-9-9" />
    <path d="M21 12h-3" />
    <path d="M19 7h-2.5" />
    <path d="M19 17h-2.5" />
    <path d="M15 4.5L13.5 6" />
    <path d="M15 19.5L13.5 18" />
  </svg>
);

export const Login: React.FC = () => {
  const { isConnected, address, currentRole, setRole, connectWallet } = useWeb3();
  const { profiles } = usePolyLanceData();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [step, setStep] = useState<'wallet' | 'role'>('wallet');

  const walletProviders = [
    {
      id: 'metamask',
      name: 'MetaMask',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-100/50',
      circleBg: 'bg-orange-50/30',
      desc: 'Connect using your MetaMask wallet instantly.',
      arrowColor: 'text-orange-500 bg-orange-50/20 border-orange-100/30 group-hover:bg-orange-50 group-hover:border-orange-300',
      logo: (
        <img src="/MetaMask_logo.png" alt="MetaMask" className="w-9 h-9 object-contain shrink-0" />
      )
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-100/50',
      circleBg: 'bg-blue-50/30',
      desc: 'Scan with your wallet app to connect.',
      arrowColor: 'text-blue-500 bg-blue-50/20 border-blue-100/30 group-hover:bg-blue-50 group-hover:border-blue-300',
      logo: (
        <img src="/WalletConnect_logo.png" alt="WalletConnect" className="w-9 h-9 object-contain shrink-0" />
      )
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-100/50',
      circleBg: 'bg-blue-50/30',
      desc: 'Connect with Coinbase Wallet in one click.',
      arrowColor: 'text-blue-500 bg-blue-50/20 border-blue-100/30 group-hover:bg-blue-50 group-hover:border-blue-300',
      logo: (
        <img src="/CoinBase_logo.png" alt="Coinbase Wallet" className="w-9 h-9 object-contain shrink-0" />
      )
    },
  ];

  // Dynamic routing based on connected address
  React.useEffect(() => {
    if (isConnected && address) {
      const lowerAddress = address.toLowerCase();

      // 1. Check if Admin
      const isAdmin = lowerAddress === '0x62cdfc0692cc675c95304bace2c834d8f901dcba' || 
                      lowerAddress === '0x25f6c8ed995c811e6c0adb1d66a60830e8115e9a';
      if (isAdmin) {
        setRole('admin');
        confetti({ particleCount: 80, spread: 70 });
        navigate('/treasury');
        return;
      }

      // 2. Check if Judge
      const isJudge = lowerAddress === '0xb8aa0398b91a150b041da819bc954bb356e009dd';
      if (isJudge) {
        setRole('judge');
        confetti({ particleCount: 80, spread: 70 });
        navigate('/judge');
        return;
      }

      // 3. Check if existing profile matches
      const existingProfile = profiles[address];
      if (existingProfile) {
        const userRole = existingProfile.role || 'freelancer';
        setRole(userRole);
        confetti({ particleCount: 80, spread: 70 });
        navigate('/dashboard');
        return;
      }

      // 4. New user -> Show profile selection stage
      setStep('role');
    }
  }, [isConnected, address, profiles, navigate, setRole]);

  const handleWalletConnect = async (provider: string) => {
    setConnectingProvider(provider);
    try {
      await connectWallet();
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleContinue = (role: 'freelancer' | 'client') => {
    setRole(role as DemoRole);
    navigate('/onboarding');
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 page-transition relative overflow-hidden">
      {/* Floating background decorative shape elements mimicking 3D cubes */}
      <div className="hidden lg:block absolute top-10 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-blue-500/5 rounded-3xl border border-white/20 shadow-md rotate-12 animate-pulse pointer-events-none" />
      <div className="hidden lg:block absolute top-32 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl border border-white/20 shadow-sm -rotate-45 animate-bounce-slow pointer-events-none" />

      {step === 'role' ? (
        <>
          {/* Header Section */}
          <div className="text-center space-y-4 relative z-10 select-none max-w-2xl mx-auto">
            {/* Decorative 3D-styled floating elements */}
            {/* Left 3D Hexagon Plate */}
            <div className="hidden lg:block absolute left-[-100px] top-[10%] w-24 h-24 bg-gradient-to-br from-white to-purple-50 border border-purple-100 rounded-[24px] shadow-lg shadow-purple-100/50 rotate-12 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-md" />
              <div className="absolute w-20 h-20 bg-purple-50/50 rounded-[20px] border border-purple-100/30 -z-10" />
              <PolyLanceLogo size={44} className="relative z-10" />
            </div>

            {/* Right 3D Blue Card Stack */}
            <div className="hidden lg:block absolute right-[-100px] top-[10%] w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400 rounded-[24px] shadow-lg shadow-blue-500/35 -rotate-12 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
              <div className="absolute w-20 h-20 bg-blue-400/40 rounded-[20px] -translate-y-2 translate-x-2 -z-10 border border-blue-300/30" />
              <div className="absolute w-20 h-20 bg-blue-300/20 rounded-[20px] -translate-y-4 translate-x-4 -z-20 border border-blue-200/10" />
              <Sparkles size={36} className="text-white fill-white/20 animate-pulse" />
            </div>

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full shadow-3xs text-[10px] font-mono tracking-widest font-black uppercase">
              <Sparkles size={11} className="text-purple-600 animate-pulse" />
              <span>Choose Your Role</span>
              <Sparkles size={11} className="text-purple-600 animate-pulse" />
            </div>

            {/* Glowing Logo */}
            <div className="relative flex justify-center py-1">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-purple-400/10 rounded-full blur-xl pointer-events-none animate-pulse" />
              <PolyLanceLogo size={55} className="relative z-10 shrink-0" />
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Where will you{' '}
              <span className="relative inline-block text-purple-600">
                begin your journey?
                <svg className="absolute left-0 bottom-[-6px] w-full h-2 text-purple-400" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q50,9 100,5" stroke="currentColor" strokeWidth="3" fill="transparent" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-sans mt-3 font-medium max-w-md mx-auto leading-relaxed">
              Your role determines your path. You can switch anytime as you grow on PolyLance.
            </p>
          </div>

          {/* Role Selector Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">
            {/* Freelancer Card */}
            <div
              onClick={() => setSelectedRole('freelancer')}
              className={`relative flex flex-col justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer text-left h-full group bg-white shadow-xs overflow-hidden ${
                selectedRole === 'freelancer'
                  ? 'border-purple-600 ring-2 ring-purple-500/15'
                  : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex gap-5 items-start min-w-0">
                  {/* Left: 3D Avatar */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0 select-none">
                    {/* Base disk */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-100 to-purple-200 rounded-full scale-100 opacity-60 shadow-inner" />
                    {/* Middle disk */}
                    <div className="absolute inset-2 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full scale-100 shadow-sm border border-purple-200" />
                    {/* Top sphere */}
                    <div className="absolute inset-4 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md shadow-purple-900/40 border border-purple-400">
                      <User size={24} className="text-white fill-white/10 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Right: Badge, Title, Description */}
                  <div className="min-w-0 space-y-1.5 text-left">
                    <span className="inline-block text-[9px] px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 font-mono font-black uppercase rounded-full tracking-wider">
                      ✦ I Offer Skills
                    </span>
                    <h3 className="font-black text-slate-900 text-xl font-satoshi leading-none">Freelancer</h3>
                    <p className="text-xs text-slate-500 font-sans leading-normal font-medium">
                      Offer your skills, build your reputation and get paid fairly.
                    </p>
                  </div>
                </div>

                {/* Features Strip Row */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center divide-x divide-slate-200/80 items-center">
                  <div className="flex items-center gap-2.5 px-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <Rocket size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Build</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">Your Profile</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pl-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <DollarSign size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Earn</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">With Trust</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pl-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                      <TrendingUp size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Grow</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">Your Brand</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Triangle corner badge with upright checkmark */}
              {selectedRole === 'freelancer' && (
                <div className="absolute top-0 right-0 w-12 h-12">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="absolute top-0 right-0">
                    <path d="M0 0 H48 V48 Z" fill="#8B5CF6" />
                  </svg>
                  <Check size={14} className="absolute top-2.5 right-2.5 text-white stroke-[3.5]" />
                </div>
              )}

              {/* Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinue('freelancer');
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-between shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span className="font-headline font-black text-sm">Continue as Freelancer</span>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-purple-600 shrink-0 shadow-3xs">
                    <ArrowRight size={14} className="stroke-[3]" />
                  </div>
                </button>
              </div>
            </div>

            {/* Client Card */}
            <div
              onClick={() => setSelectedRole('client')}
              className={`relative flex flex-col justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer text-left h-full group bg-white shadow-xs overflow-hidden ${
                selectedRole === 'client'
                  ? 'border-blue-600 ring-2 ring-blue-500/15'
                  : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex gap-5 items-start min-w-0">
                  {/* Left: 3D Avatar */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0 select-none">
                    {/* Base disk */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-blue-200 rounded-full scale-100 opacity-60 shadow-inner" />
                    {/* Middle disk */}
                    <div className="absolute inset-2 bg-gradient-to-b from-blue-300 to-blue-400 rounded-full scale-100 shadow-sm border border-blue-200" />
                    {/* Top sphere */}
                    <div className="absolute inset-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-md shadow-blue-900/40 border border-blue-400">
                      <Briefcase size={22} className="text-white fill-white/10 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Right: Badge, Title, Description */}
                  <div className="min-w-0 space-y-1.5 text-left">
                    <span className="inline-block text-[9px] px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 font-mono font-black uppercase rounded-full tracking-wider">
                      ✦ I Need Talent
                    </span>
                    <h3 className="font-black text-slate-900 text-xl font-satoshi leading-none">Client</h3>
                    <p className="text-xs text-slate-500 font-sans leading-normal font-medium">
                      Find top talent, collaborate easily and get work done securely.
                    </p>
                  </div>
                </div>

                {/* Features Strip Row */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center divide-x divide-slate-200/80 items-center">
                  <div className="flex items-center gap-2.5 px-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Users size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Hire</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">Top Talent</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pl-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <MessageSquare size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Collaborate</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">Seamlessly</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pl-2 justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <ShieldCheck size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="font-bold text-slate-800 text-[11px] block font-satoshi">Scale</span>
                      <span className="text-[9px] text-slate-400 font-sans block leading-none font-medium">With Confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Triangle corner badge with upright checkmark */}
              {selectedRole === 'client' && (
                <div className="absolute top-0 right-0 w-12 h-12">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="absolute top-0 right-0">
                    <path d="M0 0 H48 V48 Z" fill="#2563EB" />
                  </svg>
                  <Check size={14} className="absolute top-2.5 right-2.5 text-white stroke-[3.5]" />
                </div>
              )}

              {/* Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinue('client');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-between shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span className="font-headline font-black text-sm">Continue as Client</span>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-blue-600 shrink-0 shadow-3xs">
                    <ArrowRight size={14} className="stroke-[3]" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Redesigned 4 Bottom Informational Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto pt-10 select-none">
            {/* 100% On-Chain */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs flex items-start gap-3.5 text-left hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100/50 flex items-center justify-center shrink-0 shadow-4xs">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1">
                <span className="font-black text-slate-800 text-xs block leading-none font-satoshi">100% On-Chain</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-tight font-medium">
                  Everything is recorded on-chain. Always transparent.
                </span>
              </div>
            </div>

            {/* Secure & Private */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs flex items-start gap-3.5 text-left hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100/50 flex items-center justify-center shrink-0 shadow-4xs">
                <Lock size={16} />
              </div>
              <div className="space-y-1">
                <span className="font-black text-slate-800 text-xs block leading-none font-satoshi">Secure & Private</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-tight font-medium">
                  Your data and identity are always in your control.
                </span>
              </div>
            </div>

            {/* Smart Contracts */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs flex items-start gap-3.5 text-left hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-4xs">
                <CheckCircle2 size={16} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="font-black text-slate-800 text-xs block leading-none font-satoshi">Smart Contracts</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-tight font-medium">
                  Automated, fair and tamper-proof agreements.
                </span>
              </div>
            </div>

            {/* Global Opportunities */}
            <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs flex items-start gap-3.5 text-left hover:scale-[1.01] transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100/50 flex items-center justify-center shrink-0 shadow-4xs">
                <Globe size={16} />
              </div>
              <div className="space-y-1">
                <span className="font-black text-slate-800 text-xs block leading-none font-satoshi">Global Opportunities</span>
                <span className="text-[10px] text-slate-500 font-sans block leading-tight font-medium">
                  Connect, work and grow without borders.
                </span>
              </div>
            </div>
          </div>

          {/* Laurel Wreaths Footer */}
          <div className="flex items-center justify-center gap-6 pt-10 select-none max-w-lg mx-auto">
            <LaurelLeft />
            <span className="text-[11px] sm:text-xs text-slate-500 font-sans font-bold text-center tracking-wide leading-none">
              Your reputation. Your freedom. Your future. <span className="text-purple-650 font-black">On-Chain.</span>
            </span>
            <LaurelRight />
          </div>
        </>
      ) : (
        <>
          {/* Connect Wallet section */}
          <div className="max-w-5xl mx-auto space-y-8 relative pt-2">
            {/* Logo and title platform */}
            <div className="text-center space-y-3 select-none relative z-10">
              <div className="relative flex justify-center py-1">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-purple-400/10 rounded-full blur-xl pointer-events-none animate-pulse" />
                <div className="absolute bottom-0 w-20 h-1.5 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full blur-xs opacity-85" />
                <PolyLanceLogo size={66} className="relative z-10 shrink-0" />
              </div>

              <h3 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                Connect Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Wallet</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-sans mt-2.5 font-medium max-w-md mx-auto leading-relaxed">
                Connect your decentralized professional identity to start building on-chain reputation.
              </p>

              {/* Capsule lists */}
              <div className="flex justify-center pt-1.5">
                <div className="inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 px-4.5 py-1.5 border border-slate-200/60 bg-white/70 backdrop-blur-md rounded-full shadow-4xs text-[10px] sm:text-[11px] font-black text-slate-700 select-none">
                  <span className="flex items-center gap-1"><Sparkles size={11} className="text-purple-650" /> Verified Talent</span>
                  <span className="text-slate-350">•</span>
                  <span>Smart Contracts</span>
                  <span className="text-slate-300">•</span>
                  <span>Fair Payments</span>
                  <span className="text-slate-300">•</span>
                  <span>Global Opportunities</span>
                </div>
              </div>
            </div>

            {/* Wallet Options Horizontal Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2">
              {walletProviders.map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  disabled={Boolean(connectingProvider)}
                  onClick={() => {
                    handleWalletConnect(prov.name);
                  }}
                  className="flex items-center justify-between p-5 border border-slate-200 rounded-3xl bg-white hover:bg-slate-50/50 hover:border-purple-300 transition-all cursor-pointer shadow-sm group hover:scale-[1.01] duration-300 relative select-none text-left"
                >
                  <div className="flex gap-4 items-start min-w-0">
                    <div className={`w-14 h-14 rounded-full ${prov.circleBg} flex items-center justify-center shadow-inner shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                      {prov.logo}
                    </div>
                    <div className="min-w-0 pr-1">
                      <span className="font-black text-slate-900 text-base font-satoshi block">
                        {prov.name}
                      </span>
                      <div className={`inline-block text-[8px] px-2 py-0.5 ${prov.badgeColor} border font-mono font-black uppercase rounded-full tracking-wider mt-1.5`}>
                        ⚡ Fast & Secure
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-2.5 leading-snug font-medium">
                        {prov.desc}
                      </span>
                    </div>
                  </div>
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 shadow-4xs shrink-0 hover:scale-105 ${prov.arrowColor}`}>
                    <ArrowRight size={14} className="stroke-[3]" />
                  </div>
                </button>
              ))}
            </div>

            {/* Identity Footer */}
            <div className="flex items-center justify-center gap-2 select-none pt-4 text-[10.5px] sm:text-xs text-slate-500 font-sans font-medium text-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
              <ShieldCheck size={13.5} className="text-purple-650 fill-purple-100" />
              <span>Your wallet. Your identity. Your reputation. <span className="text-purple-650 font-black">Fully on-chain.</span></span>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

