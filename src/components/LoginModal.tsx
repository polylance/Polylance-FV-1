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

        {/* Web3 Wallets - Mapped to the second mockup layout */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 max-w-max mx-auto font-mono text-[9px] font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Connect Web3 Wallet</span>
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
              <PolyLanceLogo size={50} />
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
