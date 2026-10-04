import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { DemoRole } from '../types';
import { PolyLanceLogo } from './PolyLanceLogo';
import { X, Check, ArrowRight, User, Briefcase, ShieldCheck, CheckCircle2, Zap, Sparkles, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { modalOverlayVariants, modalContentVariants, transition } from '../lib/motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setRole, connectWallet } = useWeb3();
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState('');


  const walletProviders = [
    {
      id: 'metamask',
      name: 'MetaMask',
      logo: (
        <img src={`${import.meta.env.BASE_URL}MetaMask_logo.png`} alt="MetaMask" className="w-5.5 h-5.5 object-contain shrink-0" />
      )
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      logo: (
        <img src={`${import.meta.env.BASE_URL}WalletConnect_logo.png`} alt="WalletConnect" className="w-5.5 h-5.5 object-contain shrink-0" />
      )
    },
    {
      id: 'coinbase',
      name: 'Coinbase',
      logo: (
        <img src={`${import.meta.env.BASE_URL}CoinBase_logo.png`} alt="Coinbase Wallet" className="w-5.5 h-5.5 object-contain shrink-0" />
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

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      variants={modalOverlayVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition.fast}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
    >
        <motion.div
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition.medium}
          className="glass-panel max-w-lg w-full p-6 sm:p-8 border-slate-200 bg-white hard-shadow relative space-y-5"
        >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        {/* Logo and Header */}
        <div className="text-center relative pt-2">
          <div className="relative z-10 flex justify-center mb-2">
            <PolyLanceLogo size={58} />
          </div>
          <h2 className="font-heading text-2xl font-black text-slate-900 tracking-tight">
            Welcome to <span className="text-slate-900">PolyLance</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans font-medium mt-1 leading-relaxed max-w-sm mx-auto">
            The decentralized platform for verified talent and trusted opportunities.
          </p>
        </div>

        {/* Divider with Role Label */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="h-[1px] bg-slate-100 flex-1" />
          <span className="font-mono text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
            Choose Your Role
          </span>
          <div className="h-[1px] bg-slate-100 flex-1" />
        </div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Freelancer Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('freelancer')}
            className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left h-full ${selectedRole === 'freelancer'
                ? 'border-[#0047AB] bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div className="flex gap-3 items-start min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-2xs shrink-0 relative overflow-hidden">
                <User size={18} className="text-slate-800" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-satoshi block">Freelancer</span>
                <span className="text-[9.5px] text-slate-500 font-sans block mt-0.5 leading-tight font-medium">
                  Offer your skills and get paid fairly.
                </span>
              </div>
            </div>

            <div className="mt-3.5">
              <div className="inline-block text-[8.5px] px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-black uppercase rounded-full tracking-wider">
                Build • Earn • Grow
              </div>
            </div>

            {selectedRole === 'freelancer' && (
              <div className="absolute -top-1.5 -right-1.5 bg-[#0047AB] text-white p-0.5 rounded-full shadow-xs border border-white">
                <Check size={10} className="stroke-[3.5]" />
              </div>
            )}
          </button>

          {/* Client Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer text-left h-full ${selectedRole === 'client'
                ? 'border-[#0047AB] bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div className="flex gap-3 items-start min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shadow-2xs shrink-0 relative overflow-hidden">
                <Briefcase size={16} className="text-slate-800" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-satoshi block">Client</span>
                <span className="text-[9.5px] text-slate-500 font-sans block mt-0.5 leading-tight font-medium">
                  Find talent and get work done securely.
                </span>
              </div>
            </div>

            <div className="mt-3.5">
              <div className="inline-block text-[8.5px] px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-black uppercase rounded-full tracking-wider">
                Hire • Collaborate • Scale
              </div>
            </div>

            {selectedRole === 'client' && (
              <div className="absolute -top-1.5 -right-1.5 bg-[#0047AB] text-white p-0.5 rounded-full shadow-xs border border-white">
                <Check size={10} className="stroke-[3.5]" />
              </div>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center my-3.5">
          <div className="h-[1px] bg-slate-100 flex-grow" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-3" />
          <div className="h-[1px] bg-slate-100 flex-grow" />
        </div>

        {/* Connect Wallet section */}
        <div className="space-y-4 pt-1">
          <div className="w-8 h-8 rounded-xl bg-[#0B0B0C] text-white border border-slate-800 flex items-center justify-center mx-auto shadow-2xs shrink-0">
            <Lock size={14} className="text-white" />
          </div>
          <div className="text-center">
            <h3 className="font-heading text-sm font-black text-slate-900">
              Connect Your Wallet
            </h3>
            <p className="text-[10.5px] text-slate-500 font-sans mt-0.5 font-medium">
              Choose your preferred wallet to continue
            </p>
          </div>

          {/* Wallet Options Side-by-Side Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {walletProviders.map((prov) => (
              <button
                key={prov.id}
                type="button"
                disabled={Boolean(connectingProvider)}
                onClick={() => handleWeb2Login(prov.name)}
                className="flex items-center justify-between p-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-[#0047AB] transition-all cursor-pointer shadow-4xs group hover:scale-[1.01] duration-300 relative select-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {prov.logo}
                  <span className="text-[9.5px] font-black text-slate-800 tracking-tight font-satoshi truncate">
                    {prov.name}
                  </span>
                </div>
                <ArrowRight size={9} className="text-slate-400 group-hover:text-[#0047AB] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-slate-500 font-sans font-medium mt-1">
            <ShieldCheck size={11.5} className="text-[#0047AB]" />
            <span>Your data stays on-chain. You stay in control.</span>
          </div>
        </div>

        {/* Security / Bottom highlights bar inside the card */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 -mx-6 -mb-5 sm:-mx-8 sm:-mb-8 rounded-b-2xl grid grid-cols-3 gap-2 text-center select-none">
          <div>
            <ShieldCheck size={14} className="text-[#0047AB] mx-auto" />
            <span className="text-[9px] font-black text-slate-800 block mt-1">100% On-Chain</span>
            <span className="text-[7.5px] text-slate-500 block leading-tight font-sans mt-0.5">Transparent & Secure</span>
          </div>
          <div className="border-l border-slate-200">
            <CheckCircle2 size={13.5} className="text-[#0047AB] mx-auto" />
            <span className="text-[9px] font-black text-slate-800 block mt-1">Verified Platform</span>
            <span className="text-[7.5px] text-slate-500 block leading-tight font-sans mt-0.5">Built for Trust</span>
          </div>
          <div className="border-l border-slate-200">
            <Zap size={13.5} className="text-[#0047AB] mx-auto" />
            <span className="text-[9px] font-black text-slate-800 block mt-1">Fair & Transparent</span>
            <span className="text-[7.5px] text-slate-500 block leading-tight font-sans mt-0.5">No Middlemen</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
