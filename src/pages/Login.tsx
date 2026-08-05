import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { DemoRole } from '../types';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { ShieldCheck, User, Briefcase, ArrowRight, Check, CheckCircle2, Zap, Sparkles, Lock, Network, Award, TrendingUp, Globe, FolderLock, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Login: React.FC = () => {
  const { setRole, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

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

  const handleWeb2Login = (provider: string) => {
    setConnectingProvider(provider);
    setRole(selectedRole as DemoRole);

    setTimeout(async () => {
      await connectWallet();
      setConnectingProvider(null);
      confetti({ particleCount: 80, spread: 70 });
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 page-transition relative overflow-hidden">
      {/* Floating background decorative shape elements mimicking 3D cubes */}
      <div className="hidden lg:block absolute top-10 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-blue-500/5 rounded-3xl border border-white/20 shadow-md rotate-12 animate-pulse pointer-events-none" />
      <div className="hidden lg:block absolute top-32 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-2xl border border-white/20 shadow-sm -rotate-45 animate-bounce-slow pointer-events-none" />

      {/* Header Section */}
      <div className="text-center space-y-3 relative z-10 select-none">
        <div className="flex items-center justify-center gap-1 text-[10px] font-mono tracking-widest text-purple-600/80 font-black uppercase">
          <Sparkles size={9} className="fill-purple-200" /> Welcome to <Sparkles size={9} className="fill-purple-200" />
        </div>
        
        {/* Glow hex logo container */}
        <div className="relative flex justify-center py-2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-purple-400/10 rounded-full blur-xl pointer-events-none animate-pulse" />
          <PolyLanceLogo size={66} className="relative z-10 shrink-0" />
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mt-1">
          Welcome to <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">PolyLance</span>
        </h1>
        <h2 className="font-heading text-base sm:text-lg font-extrabold text-slate-800 tracking-tight mt-1.5 uppercase">
          Build. <span className="text-purple-650">Earn.</span> <span className="text-blue-650">Grow.</span> On-Chain.
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed mt-3 font-sans font-medium">
          PolyLance connects verified talent with real opportunities using smart contracts and on-chain reputation.
        </p>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-5 text-left">
          {/* No Middlemen */}
          <div className="flex items-center gap-3 bg-white/60 border border-slate-200/60 p-3 rounded-2xl shadow-3xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-50 text-purple-655 flex items-center justify-center shrink-0 shadow-inner">
              <Network size={15} />
            </div>
            <div className="space-y-0.5">
              <span className="font-black text-slate-850 text-[11px] block leading-none font-satoshi">No Middlemen</span>
              <span className="text-[9.5px] text-slate-450 font-sans block font-medium">100% Transparent</span>
            </div>
          </div>

          {/* On-Chain Reputation */}
          <div className="flex items-center gap-3 bg-white/60 border border-slate-200/60 p-3 rounded-2xl shadow-3xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-50 text-purple-655 flex items-center justify-center shrink-0 shadow-inner">
              <Cpu size={15} />
            </div>
            <div className="space-y-0.5">
              <span className="font-black text-slate-850 text-[11px] block leading-none font-satoshi">On-Chain Reputation</span>
              <span className="text-[9.5px] text-slate-450 font-sans block font-medium">Earn Trust, Get More</span>
            </div>
          </div>

          {/* Fair & Secure */}
          <div className="flex items-center gap-3 bg-white/60 border border-slate-200/60 p-3 rounded-2xl shadow-3xs">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-50 text-purple-655 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck size={15} />
            </div>
            <div className="space-y-0.5">
              <span className="font-black text-slate-850 text-[11px] block leading-none font-satoshi">Fair & Secure</span>
              <span className="text-[9.5px] text-slate-450 font-sans block font-medium">Built for Everyone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 select-none">
        <div className="h-[1px] bg-slate-200 flex-1" />
        <span className="font-mono text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles size={8} /> Choose Your Role <Sparkles size={8} />
        </span>
        <div className="h-[1px] bg-slate-200 flex-1" />
      </div>

      {/* Role Selector Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Freelancer Card */}
        <button
          type="button"
          onClick={() => setSelectedRole('freelancer')}
          className={`relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer text-left h-full group ${
            selectedRole === 'freelancer'
              ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-500/10'
              : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/20'
          }`}
        >
          <div className="flex gap-4 items-start min-w-0">
            {/* Color circle icon container */}
            <div className="w-12 h-12 rounded-full bg-purple-100/90 flex items-center justify-center text-purple-700 shadow-inner shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <User size={22} className="text-purple-650" />
            </div>
            
            <div className="min-w-0">
              <span className="font-black text-slate-900 text-base sm:text-lg font-satoshi block">Freelancer</span>
              <span className="text-[11.5px] text-slate-500 font-sans block mt-1 leading-normal font-medium max-w-xs">
                Offer your skills and get paid fairly.
              </span>
            </div>
          </div>

          <div className="mt-4 pt-1">
            <div className="inline-block text-[9px] px-3 py-0.5 bg-purple-50 border border-purple-100/50 text-purple-700 font-mono font-black uppercase rounded-full tracking-wider">
              Build • Earn • Grow
            </div>
          </div>

          {selectedRole === 'freelancer' && (
            <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white p-0.5 rounded-full shadow-md border border-white">
              <Check size={11} className="stroke-[3.5]" />
            </div>
          )}
        </button>

        {/* Client Card */}
        <button
          type="button"
          onClick={() => setSelectedRole('client')}
          className={`relative flex flex-col justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer text-left h-full group ${
            selectedRole === 'client'
              ? 'border-purple-600 bg-purple-50/50 shadow-md ring-1 ring-purple-500/10'
              : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/20'
          }`}
        >
          <div className="flex gap-4 items-start min-w-0">
            {/* Color circle icon container */}
            <div className="w-12 h-12 rounded-full bg-blue-100/90 flex items-center justify-center text-blue-700 shadow-inner shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <Briefcase size={20} className="text-blue-650" />
            </div>

            <div className="min-w-0">
              <span className="font-black text-slate-900 text-base sm:text-lg font-satoshi block">Client</span>
              <span className="text-[11.5px] text-slate-500 font-sans block mt-1 leading-normal font-medium max-w-xs">
                Find talent and get work done securely.
              </span>
            </div>
          </div>

          <div className="mt-4 pt-1">
            <div className="inline-block text-[9px] px-3 py-0.5 bg-blue-50 border border-blue-100/50 text-blue-700 font-mono font-black uppercase rounded-full tracking-wider">
              Hire • Collaborate • Scale
            </div>
          </div>

          {selectedRole === 'client' && (
            <div className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white p-0.5 rounded-full shadow-md border border-white">
              <Check size={11} className="stroke-[3.5]" />
            </div>
          )}
        </button>
      </div>

      {/* Reputation Superpower Banner */}
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-md flex flex-col md:flex-row items-center gap-6 justify-between select-none text-left">
        {/* Left column */}
        <div className="space-y-1.5 md:max-w-xs shrink-0">
          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-400">Reputation Score</span>
          <div className="text-xl sm:text-2xl font-black font-heading leading-tight text-white">
            Reputation is your <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Superpower.</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed font-medium">
            Every task. Every delivery. Every review. Build your on-chain reputation and unlock better opportunities, higher earnings, and global visibility.
          </p>
        </div>

        {/* Grid items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left flex-1 md:border-l md:border-slate-800/85 md:pl-8">
          <div className="space-y-2.5">
            <div className="w-9.5 h-9.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Award size={17} />
            </div>
            <span className="font-black text-[12.5px] sm:text-[13.5px] block font-satoshi leading-tight text-slate-100 tracking-tight">On-Chain Reputation</span>
            <span className="text-[10.5px] sm:text-[11.5px] text-slate-400 font-sans block leading-relaxed font-medium">
              Your work speaks. The chain remembers.
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="w-9.5 h-9.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <TrendingUp size={17} />
            </div>
            <span className="font-black text-[12.5px] sm:text-[13.5px] block font-satoshi leading-tight text-slate-100 tracking-tight">Better Opportunities</span>
            <span className="text-[10.5px] sm:text-[11.5px] text-slate-400 font-sans block leading-relaxed font-medium">
              Top rated pros get priority access.
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="w-9.5 h-9.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={17} />
            </div>
            <span className="font-black text-[12.5px] sm:text-[13.5px] block font-satoshi leading-tight text-slate-100 tracking-tight">Higher Earnings</span>
            <span className="text-[10.5px] sm:text-[11.5px] text-slate-400 font-sans block leading-relaxed font-medium">
              More trust means better rewards.
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 select-none">
        <div className="h-[1px] bg-slate-200/60 flex-grow" />
        <div className="flex items-center gap-1.5 px-3.5 py-1 border border-purple-100 rounded-full bg-purple-50/30 text-[9px] font-black font-mono tracking-widest text-purple-650 uppercase">
          <Lock size={10} className="fill-purple-100/50" /> Secure & Decentralized <Lock size={10} className="fill-purple-100/50" />
        </div>
        <div className="h-[1px] bg-slate-200/60 flex-grow" />
      </div>

      {/* Connect Wallet section */}
      <div className="max-w-5xl mx-auto space-y-8 relative">
        {/* Floating elements inside section */}
        <div className="hidden lg:block absolute -left-12 top-6 w-20 h-20 bg-gradient-to-tr from-purple-500/10 to-blue-500/5 rounded-3xl border border-white/20 shadow-md rotate-12 pointer-events-none animate-pulse" />

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
            Securely access PolyLance and unlock a world of decentralized opportunities.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2">
          {walletProviders.map((prov) => (
            <button
              key={prov.id}
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login(prov.name)}
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
        <div className="flex items-center justify-center gap-2 select-none pt-2 text-[10.5px] sm:text-xs text-slate-500 font-sans font-medium text-center">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
          <ShieldCheck size={13.5} className="text-purple-600 fill-purple-100" />
          <span>Your wallet. Your identity. Your reputation. <span className="text-purple-650 font-black">Fully on-chain.</span></span>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
        </div>
      </div>

      {/* Why Choose PolyLance? Footer grid */}
      <div className="max-w-4xl mx-auto bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-900 shadow-lg select-none">
        <div className="flex items-center justify-center gap-2 mb-6 font-mono text-[9px] font-black uppercase tracking-widest text-purple-400">
          <span>✦ Why Choose PolyLance? ✦</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {/* 100% On-Chain */}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="font-extrabold text-xs sm:text-sm font-satoshi text-slate-100">100% On-Chain</div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">Transparent by design. Powered by blockchain.</p>
          </div>

          {/* Smart Contract Escrow */}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner shrink-0">
              <FolderLock size={16} />
            </div>
            <div className="font-extrabold text-xs sm:text-sm font-satoshi text-slate-100">Smart Contract Escrow</div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">Secure payments. No disputes.</p>
          </div>

          {/* Verified Talent Only */}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="font-extrabold text-xs sm:text-sm font-satoshi text-slate-100">Verified Talent Only</div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">Quality assured. Community trusted.</p>
          </div>

          {/* Global Opportunities */}
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner shrink-0">
              <Globe size={16} />
            </div>
            <div className="font-extrabold text-xs sm:text-sm font-satoshi text-slate-100">Global Opportunities</div>
            <p className="text-[10px] text-slate-400 leading-normal font-sans font-medium">Work with top clients worldwide.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
