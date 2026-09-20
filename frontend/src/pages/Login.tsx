import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { DemoRole } from '../types';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import {
  Shield,
  ShieldCheck,
  User,
  Briefcase,
  ArrowRight,
  Check,
  CheckCircle2,
  Zap,
  Sparkles,
  Lock,
  Eye,
  BarChart3,
  Network,
  Award,
  TrendingUp,
  Globe,
  FolderLock,
  Cpu,
  Rocket,
  DollarSign,
  Users,
  MessageSquare,
  ArrowLeft,
  LayoutGrid,
} from 'lucide-react';
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
  const { connectors, connectAsync } = useConnect();
  const { openConnectModal } = useConnectModal();
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
        <img src={`${import.meta.env.BASE_URL}MetaMask_logo.png`} alt="MetaMask" className="w-9 h-9 object-contain shrink-0" />
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
        <img src={`${import.meta.env.BASE_URL}WalletConnect_logo.png`} alt="WalletConnect" className="w-9 h-9 object-contain shrink-0" />
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
        <img src={`${import.meta.env.BASE_URL}CoinBase_logo.png`} alt="Coinbase Wallet" className="w-9 h-9 object-contain shrink-0" />
      )
    },
  ];


  // Dynamic routing based on connected address
  React.useEffect(() => {
    if (isConnected && address) {
      const lowerAddress = address.toLowerCase();

      // 1. Check if Admin
      const isAdmin = lowerAddress === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase() || 
                      lowerAddress === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '').toLowerCase() ||
                      lowerAddress === (import.meta.env.VITE_ADMIN_ADDRESS_3 || '').toLowerCase();
      if (isAdmin) {
        setRole('admin');
        confetti({ particleCount: 80, spread: 70 });
        navigate('/treasury');
        return;
      }

      // 2. Check if Judge
      const isJudge = lowerAddress === (import.meta.env.VITE_JUDGE_ADDRESS || '').toLowerCase();
      if (isJudge) {
        setRole('judge');
        confetti({ particleCount: 80, spread: 70 });
        navigate('/judge');
        return;
      }

      // 3. Check if existing profile matches case-insensitively
      const existingKey = Object.keys(profiles).find(
        (k) => k.toLowerCase() === lowerAddress
      );
      const existingProfile = existingKey ? profiles[existingKey] : null;
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

  // Automatically select the requested wallet when the RainbowKit modal appears
  const autoSelectWalletInModal = (target: string) => {
    const targetLower = target.toLowerCase();
    const startTime = Date.now();
    let clicked = false;

    const interval = setInterval(() => {
      if (clicked || Date.now() - startTime > 3500) {
        clearInterval(interval);
        return;
      }

      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')) as HTMLElement[];
      for (const el of buttons) {
        const text = (el.innerText || el.textContent || '').trim();
        const textLower = text.toLowerCase();

        // Skip our own page buttons which start with "connect " (e.g. "Connect WalletConnect")
        if (textLower.startsWith('connect ')) {
          continue;
        }

        let match = false;
        if (targetLower.includes('walletconnect')) {
          if (textLower.includes('walletconnect') || text === 'WalletConnect') {
            match = true;
          }
        } else if (targetLower.includes('metamask')) {
          if (textLower.includes('metamask') || text === 'MetaMask') {
            match = true;
          }
        } else if (targetLower.includes('coinbase')) {
          if (textLower.includes('coinbase') || text.includes('Coinbase')) {
            match = true;
          }
        }

        if (match) {
          clicked = true;
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          el.click();
          clearInterval(interval);
          return;
        }
      }
    }, 25);
  };

  const handleWalletConnect = async (provider: string) => {
    setConnectingProvider(provider);
    try {
      if (provider === 'all') {
        if (openConnectModal) {
          openConnectModal();
        } else {
          await connectWallet();
        }
        return;
      }

      // 1. Direct MetaMask browser extension injection if requested & extension is present
      if (provider === 'MetaMask' && typeof window !== 'undefined' && (window as any).ethereum) {
        const injected = connectors.find((c) => {
          const id = c.id.toLowerCase();
          const name = c.name.toLowerCase();
          return id === 'injected' || id.includes('metamask') || name.includes('metamask');
        });
        if (injected) {
          try {
            await connectAsync({ connector: injected });
            return;
          } catch (e: any) {
            // User rejected prompt in MetaMask extension popup -> do not force another modal
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              return;
            }
          }
        }
      }

      // 2. Direct Coinbase wallet extension injection if requested & extension is present
      if (provider === 'Coinbase' && typeof window !== 'undefined' && ((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet)) {
        const cb = connectors.find((c) => {
          const id = c.id.toLowerCase();
          const name = c.name.toLowerCase();
          return id.includes('coinbase') || name.includes('coinbase');
        });
        if (cb) {
          try {
            await connectAsync({ connector: cb });
            return;
          } catch (e: any) {
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              return;
            }
          }
        }
      }

      // 3. For WalletConnect (or MetaMask/Coinbase fallback):
      // Automatically queue immediate auto-click on the specific wallet option in the modal
      autoSelectWalletInModal(provider);

      if (openConnectModal) {
        openConnectModal();
      } else {
        await connectWallet();
      }
    } catch (err: any) {
      console.warn(`Wallet connect via ${provider} fallback:`, err?.message || err);
      autoSelectWalletInModal(provider);
      if (openConnectModal) {
        openConnectModal();
      } else {
        await connectWallet();
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleContinue = (role: 'freelancer' | 'client') => {
    setRole(role as DemoRole);
    navigate('/onboarding');
  };

  return (
    <div className={step === 'role' ? "max-w-5xl mx-auto py-12 px-4 space-y-12 page-transition relative overflow-hidden" : "w-full max-w-[1520px] mx-auto py-4 sm:py-6 px-4 sm:px-8 xl:px-12 page-transition relative overflow-visible"}>
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
              Your reputation. Your freedom. Your future. <span className="text-purple-600 font-black">On-Chain.</span>
            </span>
            <LaurelRight />
          </div>
        </>
      ) : (
        <>
          {/* ── Outer Panoramic Canvas (Exact Image 2 Reference Design) ── */}
          <div className="w-full relative flex flex-col justify-between min-h-[660px]">
            
            {/* 1. TOP-LEFT: Cursive Script "Build Verify Earn ↗" */}
            <div className="absolute top-0 left-2 sm:left-4 xl:left-8 pointer-events-none hidden md:block select-none z-10">
              <div
                className="text-blue-500/80 -rotate-12 text-2xl lg:text-3xl font-bold leading-tight"
                style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
              >
                Build<br />
                &nbsp;&nbsp;Verify ↗<br />
                &nbsp;&nbsp;&nbsp;&nbsp;Earn
              </div>
            </div>

            {/* 2. TOP-RIGHT: 4-Item Vertical Feature List */}
            <div className="absolute top-0 right-2 sm:right-4 xl:right-8 pointer-events-none hidden md:flex flex-col gap-2.5 text-right select-none z-10">
              <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-bold tracking-[0.18em] text-slate-500">
                <Shield size={13} className="text-blue-600 shrink-0" />
                <span>YOUR WALLET</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-bold tracking-[0.18em] text-slate-500">
                <User size={13} className="text-blue-600 shrink-0" />
                <span>YOUR IDENTITY</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-bold tracking-[0.18em] text-slate-500">
                <BarChart3 size={13} className="text-blue-600 shrink-0" />
                <span>YOUR REPUTATION</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] font-mono font-bold tracking-[0.18em] text-slate-500">
                <Network size={13} className="text-blue-600 shrink-0" />
                <span>FULLY ON-CHAIN</span>
              </div>
            </div>

            {/* ── MAIN CENTRAL CONTENT HERO ── */}
            <div className="space-y-6 relative z-10 pt-2">
              
              {/* Central 3D Hexagon Emblem with Orbit Rings */}
              <div className="relative flex items-center justify-center py-2 select-none">
                {/* 3D Angled Orbit Ellipse Ring with Orbital Nodes */}
                <div className="absolute w-64 sm:w-80 h-28 sm:h-36 rounded-[100%] border border-blue-200/60 -rotate-12 pointer-events-none">
                  {/* Orbital Particle Bead Left */}
                  <div className="absolute left-2 top-7 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse" />
                  {/* Orbital Particle Bead Top Right */}
                  <div className="absolute right-6 top-3 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,207,232,0.9)] animate-pulse" />
                  {/* Orbital Particle Bead Bottom */}
                  <div className="absolute left-1/3 bottom-0 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse" />
                </div>

                {/* Ambient Backlight Glow */}
                <div className="absolute w-28 h-28 bg-gradient-to-tr from-blue-400/20 to-cyan-300/30 rounded-full blur-2xl pointer-events-none" />

                {/* 3D Emblem Container */}
                <div className="relative z-10 p-2.5 rounded-3xl bg-white/70 backdrop-blur-md border border-white/90 shadow-md">
                  <PolyLanceLogo size={72} className="relative z-10 shrink-0" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center space-y-2 select-none">
                <h1 className="font-heading text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
                  Connect Your <span className="text-[#4F46E5]">Wallet</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-sans mt-2.5 font-medium max-w-lg mx-auto leading-relaxed">
                  Connect your decentralized professional identity to start building your on-chain reputation.
                </p>
              </div>

              {/* Feature Value Pills Row */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1 max-w-2xl mx-auto select-none">
                {/* 1. Secure Connection */}
                <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 border border-blue-100/90 text-slate-700 text-xs font-semibold shadow-3xs hover:border-blue-200 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Shield size={13} />
                  </div>
                  <span>Secure Connection</span>
                </div>

                {/* 2. Privacy First */}
                <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 border border-blue-100/90 text-slate-700 text-xs font-semibold shadow-3xs hover:border-blue-200 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Eye size={13} />
                  </div>
                  <span>Privacy First</span>
                </div>

                {/* 3. Start Building */}
                <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-white/90 border border-blue-100/90 text-slate-700 text-xs font-semibold shadow-3xs hover:border-blue-200 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Zap size={13} />
                  </div>
                  <span>Start Building</span>
                </div>
              </div>

              {/* ── 3 WALLET CARDS GRID ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-3">
                
                {/* Card 1: MetaMask (Recommended Highlighted Card) */}
                <div className="relative p-6 sm:p-7 rounded-3xl bg-white border-2 border-amber-300/80 ring-4 ring-amber-100/40 shadow-[0_12px_36px_rgba(245,158,11,0.08)] flex flex-col justify-between group hover:shadow-md transition-all select-none">
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/80">
                    Recommended
                  </span>

                  <div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50/60 border border-amber-100/90 flex items-center justify-center p-2 shrink-0 shadow-inner">
                        <img src={`${import.meta.env.BASE_URL}MetaMask_logo.png`} alt="MetaMask" className="w-10 h-10 object-contain" />
                      </div>
                      <div className="min-w-0 pt-0.5 text-left">
                        <h4 className="font-black text-slate-900 text-lg font-heading leading-tight">MetaMask</h4>
                        <p className="text-xs text-slate-500 font-sans mt-1 leading-snug">
                          Connect using your MetaMask wallet instantly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(connectingProvider)}
                    onClick={() => handleWalletConnect('MetaMask')}
                    className="w-full mt-6 py-3 px-4 rounded-xl bg-[#EEF4FF] hover:bg-[#E0EDFF] text-[#1E40AF] font-bold text-xs flex items-center justify-between border border-[#D0E2FF] transition-all group/btn cursor-pointer shadow-3xs"
                  >
                    <span>Connect MetaMask</span>
                    <div className="w-6 h-6 rounded-full bg-blue-200/50 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                      <ArrowRight size={13} className="text-blue-700 stroke-[2.5]" />
                    </div>
                  </button>
                </div>

                {/* Card 2: WalletConnect */}
                <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 flex flex-col justify-between group hover:shadow-md transition-all select-none">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/60 border border-blue-100/90 flex items-center justify-center p-2.5 shrink-0 shadow-inner">
                        <img src={`${import.meta.env.BASE_URL}WalletConnect_logo.png`} alt="WalletConnect" className="w-9 h-9 object-contain" />
                      </div>
                      <div className="min-w-0 pt-0.5 text-left">
                        <h4 className="font-black text-slate-900 text-lg font-heading leading-tight">WalletConnect</h4>
                        <p className="text-xs text-slate-500 font-sans mt-1 leading-snug">
                          Scan with your wallet app to connect.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(connectingProvider)}
                    onClick={() => handleWalletConnect('WalletConnect')}
                    className="w-full mt-6 py-3 px-4 rounded-xl bg-[#EEF4FF] hover:bg-[#E0EDFF] text-[#1E40AF] font-bold text-xs flex items-center justify-between border border-[#D0E2FF] transition-all group/btn cursor-pointer shadow-3xs"
                  >
                    <span>Connect WalletConnect</span>
                    <div className="w-6 h-6 rounded-full bg-blue-200/50 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                      <ArrowRight size={13} className="text-blue-700 stroke-[2.5]" />
                    </div>
                  </button>
                </div>

                {/* Card 3: Coinbase Wallet */}
                <div className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 flex flex-col justify-between group hover:shadow-md transition-all select-none">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/60 border border-blue-100/90 flex items-center justify-center p-2.5 shrink-0 shadow-inner">
                        <img src={`${import.meta.env.BASE_URL}CoinBase_logo.png`} alt="Coinbase Wallet" className="w-9 h-9 object-contain" />
                      </div>
                      <div className="min-w-0 pt-0.5 text-left">
                        <h4 className="font-black text-slate-900 text-lg font-heading leading-tight">Coinbase Wallet</h4>
                        <p className="text-xs text-slate-500 font-sans mt-1 leading-snug">
                          Connect with Coinbase Wallet in one click.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(connectingProvider)}
                    onClick={() => handleWalletConnect('Coinbase')}
                    className="w-full mt-6 py-3 px-4 rounded-xl bg-[#EEF4FF] hover:bg-[#E0EDFF] text-[#1E40AF] font-bold text-xs flex items-center justify-between border border-[#D0E2FF] transition-all group/btn cursor-pointer shadow-3xs"
                  >
                    <span>Connect Coinbase</span>
                    <div className="w-6 h-6 rounded-full bg-blue-200/50 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                      <ArrowRight size={13} className="text-blue-700 stroke-[2.5]" />
                    </div>
                  </button>
                </div>

              </div>

              {/* ── OR DIVIDER & ALL WALLETS BUTTON ── */}
              <div className="pt-3 space-y-3 max-w-md mx-auto text-center select-none">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-200/80 flex-1" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">OR</span>
                  <div className="h-px bg-slate-200/80 flex-1" />
                </div>

                <button
                  type="button"
                  disabled={Boolean(connectingProvider)}
                  onClick={() => handleWalletConnect('all')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold shadow-3xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <LayoutGrid size={13.5} className="text-blue-600" />
                  <span>View All Supported Wallets</span>
                  <ArrowRight size={13.5} className="text-blue-600" />
                </button>
              </div>

            </div>

            {/* ── BOTTOM IDENTITY CAPSULE & PERIMETER LABELS ── */}
            <div className="pt-8 flex flex-col items-center gap-4 select-none">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50/70 border border-blue-200/70 text-slate-600 text-xs font-medium shadow-3xs">
                <ShieldCheck size={14} className="text-blue-600 fill-blue-100" />
                <span>
                  Your wallet. Your identity. Your reputation.{' '}
                  <strong className="text-blue-700 font-bold">Fully on-chain.</strong>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 ml-1" />
              </div>

              {/* Bottom Corners: MORE OPPORTUNITIES (Left) & Powered by Community (Right) */}
              <div className="w-full flex items-center justify-between pt-2 px-2">
                <div className="text-[9.5px] font-mono font-bold tracking-[0.2em] text-slate-400 leading-relaxed hidden sm:block">
                  <div>MORE</div>
                  <div>OPPORTUNITIES</div>
                  <div>A FAIRER FUTURE</div>
                </div>

                <div className="text-right hidden sm:block">
                  <div
                    className="text-blue-500/75 -rotate-6 text-xl sm:text-2xl font-bold leading-tight"
                    style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                  >
                    Powered by<br />
                    &nbsp;&nbsp;Community
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

