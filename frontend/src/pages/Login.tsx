import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { DemoRole } from '../types';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { ShieldCheck, User, Building2, ArrowRight, Check, History, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Login: React.FC = () => {
  const { setRole, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const walletProviders = [
    {
      id: 'metamask',
      name: 'MetaMask',
      desc: 'Connect using browser extension or mobile wallet',
      badgeText: 'Most Popular',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100/50',
      badgeIcon: <ShieldCheck size={11} />,
      logo: (
        <img src="/MetaMask_logo.png" alt="MetaMask" className="w-8 h-8 object-contain" />
      )
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      desc: 'Connect with Coinbase Wallet or Extension',
      badgeText: 'Secure & Trusted',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-100/50',
      badgeIcon: <ShieldCheck size={11} />,
      logo: (
        <img src="/CoinBase_logo.png" alt="Coinbase Wallet" className="w-8 h-8 object-contain" />
      )
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      desc: 'Scan QR code with 300+ Web3 mobile wallets',
      badgeText: '300+ Wallets',
      badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-100/50',
      badgeIcon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
        </svg>
      ),
      logo: (
        <img src="/WalletConnect_logo.png" alt="WalletConnect" className="w-8.5 h-8.5 object-contain" />
      )
    },
  ];

  const handleRealWalletConnect = async (providerName: string) => {
    setConnectingProvider(providerName);
    try {
      await connectWallet();
      confetti({ particleCount: 80, spread: 70 });
      navigate('/dashboard');
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnectingProvider(null);
    }
  };

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

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleWeb2Login('Email (' + email + ')');
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-start page-transition">
      {/* Left Column: Value Prop */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 rounded-full border border-purple-200">
          <ShieldCheck size={16} className="text-purple-700" />
          <span className="font-mono uppercase tracking-widest text-[11px] font-bold">
            Blockchain Verified Portal
          </span>
        </div>

        <h1 className="hero-title text-slate-900 leading-tight">
          Immutable Professionalism <br />
          <span className="gradient-text-purple-pink">Secured by Ledger.</span>
        </h1>

        <p className="body-text text-slate-600">
          Access a global workforce with absolute trust. Every contract is an on-chain escrow, ensuring fair payment for verifiable work.
        </p>

        <div className="space-y-4 pt-4 font-mono text-xs">
          <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 hard-shadow">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-satoshi text-base">Secure Escrows</h3>
              <p className="text-slate-600 font-sans text-xs">Payments locked in smart contracts, released only upon milestone verification.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 hard-shadow">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-satoshi text-base">Verifiable Reputation</h3>
              <p className="text-slate-600 font-sans text-xs">Your work history is written to the blockchain. Permanent, portable, and proven.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Login Card */}
      <div className="glass-panel p-8 border-purple-200 bg-white hard-shadow space-y-6">
        <div className="text-center space-y-2">
          <PolyLanceLogo size={56} className="mx-auto animate-bounce-slow" />
          <h2 className="card-title text-slate-900">Get Started</h2>
          <p className="text-xs text-slate-600 font-sans">Select your role and connect via Web2 account or Web3 wallet.</p>
        </div>

        {/* Role Selector Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedRole('freelancer')}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === 'freelancer'
              ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
          >
            <User size={24} className={selectedRole === 'freelancer' ? 'text-purple-700 mb-1 animate-pulse' : 'text-slate-500 mb-1'} />
            <span className="font-bold text-xs">Freelancer</span>
            {selectedRole === 'freelancer' && (
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-0.5 rounded-full shadow-md">
                <Check size={12} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === 'client'
              ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
          >
            <Building2 size={24} className={selectedRole === 'client' ? 'text-purple-700 mb-1 animate-pulse' : 'text-slate-500 mb-1'} />
            <span className="font-bold text-xs">Client</span>
            {selectedRole === 'client' && (
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-0.5 rounded-full shadow-md">
                <Check size={12} />
              </div>
            )}
          </button>
        </div>

        {/* Direct Web2 Secure Sign-In Section */}
        <div className="space-y-4 pt-1">
          <label className="block font-mono uppercase tracking-widest text-[11px] text-slate-500 font-bold">
            Secure Web2 Sign-In
          </label>

          {/* Email OTP Sign-In */}
          <form onSubmit={handleEmailLogin} className="space-y-2">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input text-xs py-3 border border-slate-200 focus:border-purple-500 transition-all duration-300"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={Boolean(connectingProvider)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-300"
            >
              {connectingProvider === 'Email' ? 'Connecting...' : 'Continue with Email'}
            </button>
          </form>

          {/* Social Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Google')}
              className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('GitHub')}
              className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Apple')}
              className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.1-.98.04-2.17.65-2.86 1.46-.62.72-1.16 1.88-1.01 3 .09 0 2.21-.54 2.88-1.36z" />
              </svg>
              <span>Apple ID</span>
            </button>

            {/* Twitter / X */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Twitter / X')}
              className="flex items-center justify-center gap-2 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter / X</span>
            </button>
          </div>
        </div>

        {/* Web3 Wallets */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 max-w-max mx-auto font-mono text-[9px] font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Connect Real Web3 Wallet</span>
          </div>

          <h3 className="text-center font-heading text-xl font-bold text-slate-900 leading-tight">
            Connect Your <span className="gradient-text-purple-pink">Wallet</span>
          </h3>
          <p className="text-center text-[11px] text-slate-500 font-sans -mt-2">
            Choose your wallet to connect directly to Polygon Amoy Testnet
          </p>

          <div className="flex items-center justify-center gap-1.5 -mt-1 pb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
            <div className="w-8 h-1 rounded-full bg-purple-600 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-200" />
          </div>

          <div className="space-y-3.5">
            {walletProviders.map((prov) => (
              <button
                key={prov.id}
                type="button"
                disabled={Boolean(connectingProvider)}
                onClick={() => handleRealWalletConnect(prov.name)}
                className="w-full flex items-center justify-between p-4 border border-slate-150 rounded-2xl bg-white hover:bg-slate-50/60 transition-all duration-300 group cursor-pointer shadow-3xs hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden disabled:opacity-50"
              >
                {/* Border Gradient Overlay */}
                <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/20 rounded-2xl pointer-events-none transition-colors" />

                <div className="flex items-center gap-4 relative z-10">
                  {/* Icon Container */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-2xs flex items-center justify-center p-2.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {prov.logo}
                  </div>

                  <div className="text-left space-y-1">
                    <span className="font-extrabold text-slate-900 text-sm font-satoshi block">{prov.name}</span>
                    <span className="text-xs text-slate-500 font-sans block leading-tight font-medium">{prov.desc}</span>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mt-1.5 ${prov.badgeClass}`}>
                      {prov.badgeIcon}
                      <span>{prov.badgeText}</span>
                    </div>
                  </div>
                </div>

                {/* Circular Action Arrow */}
                <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-purple-500 group-hover:bg-purple-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-3xs group-hover:shadow-purple-500/20 group-hover:scale-105 shrink-0">
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer with Centered Icon */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="relative flex items-center justify-center py-6">
            <div className="w-full border-t border-slate-100" />
            <div className="absolute bg-white px-3 flex items-center justify-center">
              <PolyLanceLogo size={50} className="animate-spin-slow" />
            </div>
          </div>
          <div className="text-center font-mono text-[8px] text-slate-400 uppercase tracking-widest">
            PolyLance Autonomous Protocol V1
          </div>
        </div>
      </div>
    </div>
  );
};
