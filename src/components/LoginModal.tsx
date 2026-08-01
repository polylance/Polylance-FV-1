import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { DemoRole } from '../types';
import { PolyLanceLogo } from './PolyLanceLogo';
import { X, Check, ArrowRight, User, Building2, ShieldCheck, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setRole, connectWallet } = useWeb3();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const walletProviders = [
    {
      id: 'metamask',
      name: 'MetaMask',
      desc: 'Connect using browser extension or mobile wallet',
      badgeText: 'Most Popular',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100/50',
      badgeIcon: <ShieldCheck size={11} />,
      logo: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.235l-2.6-4.59L15 8.1l2.43 3.66L22 11.235z" fill="#E2761B"/>
          <path d="M2 11.235l-2.6-4.59L9 8.1 6.57 11.76 2 11.235z" fill="#E4761B"/>
          <path d="M18.8 15.6l-2.43-3.66-3.87 2.13.78 3.51 5.52-1.98z" fill="#E4761B"/>
          <path d="M5.2 15.6l2.43-3.66 3.87 2.13-.78 3.51-5.52-1.98z" fill="#E4761B"/>
          <path d="M12 18.96l4.37-5.39-.78-3.51-3.59.84v8.06z" fill="#D7C1B1"/>
          <path d="M12 18.96l-4.37-5.39.78-3.51 3.59.84v8.06z" fill="#D7C1B1"/>
          <path d="M16.37 13.57l-4.37 5.39v4.29l6.37-6.28-2-3.4z" fill="#F6851B"/>
          <path d="M7.63 13.57l-4.37 5.39v4.29l-6.37-6.28 2-3.4z" fill="#F6851B"/>
          <path d="M12 23.25l6-3.68-1.63-2.01-4.37 3.68v2.01z" fill="#E4761B"/>
          <path d="M12 23.25l-6-3.68 1.63-2.01 4.37 3.68v2.01z" fill="#E4761B"/>
          <path d="M22 11.235l-4.57.525 2 3.4L22 11.235z" fill="#CD6116"/>
          <path d="M2 11.235l4.57.525-2 3.4L2 11.235z" fill="#CD6116"/>
          <path d="M15 8.1l4.4-1.455-2.6-4.59L15 8.1z" fill="#E4761B"/>
          <path d="M9 8.1L4.6 6.645l2.6-4.59L9 8.1z" fill="#E4761B"/>
          <path d="M12 9.06l3-5.55h-6l3 5.55z" fill="#D7C1B1"/>
          <path d="M16.8 2.055L12 3.51 7.2 2.055l-.77.585L12 9.06l5.57-6.42-.77-.585z" fill="#F6851B"/>
          {/* MetaMask Fox Eyes (Black/Blue center details to fix distorted empty face look) */}
          <path d="M10.46 14.58l-2.12-.62 1.5-.69.62 1.31z" fill="#233447"/>
          <path d="M13.54 14.58l2.12-.62-1.5-.69-.62 1.31z" fill="#233447"/>
          <path d="M8.03 14.89l.31-2.12 1.8 1.5-2.11.62z" fill="#E4761B"/>
          <path d="M15.97 14.89l-.31-2.12-1.8 1.5 2.11.62z" fill="#E4761B"/>
        </svg>
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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5" fill="#0052FF"/>
          <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" stroke="white" strokeWidth="3" fill="none"/>
        </svg>
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
        <svg width="28" height="28" viewBox="0 0 300 185" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M61.4385429,36.2562612 C110.349767,-11.6319051 189.65053,-11.6319051 238.561752,36.2562612 L244.448297,42.0196786 C246.893858,44.4140867 246.893858,48.2961898 244.448297,50.690599 L224.311602,70.406102 C223.088821,71.6033071 221.106302,71.6033071 221.106302,70.406102 C223.088821,71.6033071 221.106302,71.6033071 219.883521,70.406102 L211.782937,62.4749541 C177.661245,29.0669724 122.339051,29.0669724 88.2173582,62.4749541 L79.542302,70.9685592 C78.3195204,72.1657633 76.337001,72.1657633 75.1142214,70.9685592 L54.9775265,51.2530561 C52.5319653,48.8586469 52.5319653,44.9765439 54.9775265,42.5821357 L61.4385429,36.2562612 Z M280.206339,77.0300061 L298.128036,94.5769031 C300.573585,96.9713 300.573599,100.85338 298.128067,103.247793 L217.317896,182.368927 C214.872352,184.763353 210.907314,184.76338 208.461736,182.368989 C208.461726,182.368979 208.461714,182.368967 208.461704,182.368957 L151.107561,126.214385 C150.496171,125.615783 149.504911,125.615783 148.893521,126.214385 C148.893517,126.214389 148.893514,126.214393 148.89351,126.214396 L91.5405888,182.368927 C89.095052,184.763359 85.1300133,184.763399 82.6844276,182.369014 C82.6844133,182.369 82.684398,182.368986 82.6843827,182.36897 L1.87196327,103.246785 C-0.573596939,100.852377 -0.573596939,96.9702735 1.87196327,94.5758653 L19.7936929,77.028998 C22.2392531,74.6345898 26.2042918,74.6345898 28.6498531,77.028998 L86.0048306,133.184355 C86.6162214,133.782957 87.6074796,133.782957 88.2188704,133.184355 C88.2188796,133.184346 88.2188878,133.184338 88.2188969,133.184331 L145.571,77.028998 Z" fill="#3B99FC"/>
        </svg>
      )
    },
  ];

  const handleWeb2Login = (provider: string) => {
    setConnectingProvider(provider);
    setRole(selectedRole as DemoRole);

    setTimeout(async () => {
      await connectWallet();
      setConnectingProvider(null);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onClose();
    }, 600);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    handleWeb2Login('Email (' + email + ')');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-panel max-w-lg w-full p-6 sm:p-8 border-purple-200 bg-white hard-shadow relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <PolyLanceLogo size={42} className="mx-auto animate-bounce-slow" />
          <h2 className="font-headline text-2xl font-extrabold text-slate-900">
            Connect Secure Identity
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Select your role and connect via Web2 account or Web3 wallet
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="space-y-2">
          <label className="block font-mono uppercase tracking-widest text-[11px] text-slate-500 font-bold">
            1. Select Your Primary Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('freelancer')}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedRole === 'freelancer'
                  ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <User size={24} className={selectedRole === 'freelancer' ? 'text-purple-700 mb-1 animate-pulse' : 'text-slate-500 mb-1'} />
              <span className="text-xs font-bold">Freelancer</span>
              <span className="text-[10px] text-slate-500 font-normal font-mono">Earn & Build Rep</span>
              {selectedRole === 'freelancer' && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-0.5 rounded-full shadow-md">
                  <Check size={12} />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('client')}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedRole === 'client'
                  ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building2 size={24} className={selectedRole === 'client' ? 'text-purple-700 mb-1 animate-pulse' : 'text-slate-500 mb-1'} />
              <span className="text-xs font-bold">Client</span>
              <span className="text-[10px] text-slate-500 font-normal font-mono">Post Escrow Jobs</span>
              {selectedRole === 'client' && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white p-0.5 rounded-full shadow-md">
                  <Check size={12} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Web2 Social and Email Sign-In */}
        <div className="space-y-3 pt-1">
          <label className="block font-mono uppercase tracking-widest text-[11px] text-slate-500 font-bold">
            2. Secure Web2 Sign-In
          </label>

          {/* Email OTP */}
          <form onSubmit={handleEmailLogin} className="space-y-2">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input text-xs py-2.5 border border-slate-200 focus:border-purple-500 transition-all duration-300"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <button
              type="submit"
              disabled={Boolean(connectingProvider)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 duration-300"
            >
              {connectingProvider === 'Email' ? 'Connecting...' : 'Continue with Email'}
            </button>
          </form>

          {/* Grid of Web2 Socials */}
          <div className="grid grid-cols-2 gap-2">
            {/* Google */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Google')}
              className="flex items-center justify-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('GitHub')}
              className="flex items-center justify-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Apple')}
              className="flex items-center justify-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.1-.98.04-2.17.65-2.86 1.46-.62.72-1.16 1.88-1.01 3 .09 0 2.21-.54 2.88-1.36z"/>
              </svg>
              <span>Apple ID</span>
            </button>

            {/* Twitter / X */}
            <button
              type="button"
              disabled={Boolean(connectingProvider)}
              onClick={() => handleWeb2Login('Twitter / X')}
              className="flex items-center justify-center gap-2 p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-purple-300 transition-all font-sans text-xs font-bold text-slate-800 cursor-pointer shadow-3xs hover:scale-[1.02] hover:-translate-y-0.5 duration-300 disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#000000" className="shrink-0">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Twitter / X</span>
            </button>
          </div>
        </div>

        {/* Web3 Wallets - Mapped to the second mockup layout */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 max-w-max mx-auto font-mono text-[9px] font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Or Connect Web3 Wallet</span>
          </div>

          <h3 className="text-center font-heading text-xl font-bold text-slate-900 leading-tight">
            Connect Your <span className="gradient-text-purple-pink">Wallet</span>
          </h3>
          <p className="text-center text-[11px] text-slate-500 font-sans -mt-2">
            Choose your preferred wallet to continue to PolyLance
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
                onClick={() => handleWeb2Login(prov.name)}
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
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider mt-1.5 ${prov.badgeClass}`}>
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
