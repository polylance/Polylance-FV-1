import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { DemoRole } from '../types';
import { X, Phone, ChevronDown, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParticleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ParticleAuthModal: React.FC<ParticleAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { setRole, connectWallet } = useWeb3();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'freelancer' | 'client'>('freelancer');
  const [showMoreSocials, setShowMoreSocials] = useState(false);
  const [activeTab, setActiveTab] = useState<'social' | 'web3'>('social');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCodeSent(true);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProvider('email');
    setRole(selectedRole as DemoRole);

    setTimeout(async () => {
      await connectWallet();
      setLoadingProvider(null);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const handleSocialLogin = (providerName: string) => {
    setLoadingProvider(providerName);
    setRole(selectedRole as DemoRole);

    setTimeout(async () => {
      await connectWallet();
      setLoadingProvider(null);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#141721] border border-[#2a2f42] rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full bg-[#23283a] text-slate-400 hover:text-white hover:bg-[#2c334b] transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Particle Network Logo Header matching attached image */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-purple-500/20 mx-auto">
            <div className="w-full h-full bg-[#141721] rounded-[14px] flex items-center justify-center">
              {/* Particle Network Spiral Logo SVG */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="6" r="2.2" fill="#E879F9" />
                <circle cx="23" cy="9" r="2" fill="#D946EF" />
                <circle cx="26" cy="16" r="1.8" fill="#C084FC" />
                <circle cx="23" cy="23" r="1.6" fill="#A855F7" />
                <circle cx="16" cy="26" r="1.4" fill="#9333EA" />
                <circle cx="10" cy="23" r="1.6" fill="#7E22CE" />
                <circle cx="7" cy="16" r="1.8" fill="#C084FC" />
                <circle cx="10" cy="9" r="2" fill="#E879F9" />
                <circle cx="16" cy="12" r="1.8" fill="#F472B6" />
                <circle cx="19" cy="16" r="1.6" fill="#EC4899" />
                <circle cx="16" cy="20" r="1.4" fill="#D946EF" />
                <circle cx="13" cy="16" r="1.6" fill="#F472B6" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black font-heading tracking-tight !text-white drop-shadow-md" style={{ color: '#ffffff' }}>
              Particle Auth
            </h2>
            <p className="text-xs !text-slate-300 font-sans" style={{ color: '#cbd5e1' }}>
              Login to <span className="!text-purple-300 font-bold" style={{ color: '#d8b4fe' }}>PolyLance</span> to continue
            </p>
          </div>
        </div>

        {/* Role Selector Bar (Freelancer vs Client) */}
        <div className="bg-[#1c2131] p-1 rounded-xl flex items-center gap-1 border border-[#2b3248]">
          <button
            type="button"
            onClick={() => setSelectedRole('freelancer')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'freelancer'
                ? 'bg-purple-600 !text-white shadow-sm'
                : '!text-slate-400 hover:!text-white'
            }`}
            style={{ color: selectedRole === 'freelancer' ? '#ffffff' : '#94a3b8' }}
          >
            Freelancer Role
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'client'
                ? 'bg-purple-600 !text-white shadow-sm'
                : '!text-slate-400 hover:!text-white'
            }`}
            style={{ color: selectedRole === 'client' ? '#ffffff' : '#94a3b8' }}
          >
            Client Role
          </button>
        </div>

        {/* Auth Mode Toggle (Particle Social AA vs Native Web3 Wallets) */}
        <div className="flex border-b border-[#2a2f42] text-xs font-mono">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'social'
                ? 'border-purple-500 !text-white'
                : 'border-transparent !text-slate-500 hover:!text-slate-300'
            }`}
            style={{ color: activeTab === 'social' ? '#ffffff' : '#64748b' }}
          >
            Particle Social & AA
          </button>
          <button
            onClick={() => setActiveTab('web3')}
            className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'web3'
                ? 'border-purple-500 !text-white'
                : 'border-transparent !text-slate-500 hover:!text-slate-300'
            }`}
            style={{ color: activeTab === 'web3' ? '#ffffff' : '#64748b' }}
          >
            Native Web3 Wallets
          </button>
        </div>

        {activeTab === 'social' ? (
          <div className="space-y-5">
            {/* Email OTP Auth Form */}
            {!codeSent ? (
              <form onSubmit={handleSendCode} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1e2436] border border-[#2e3752] focus:border-purple-500 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-3.5 text-sm outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Send Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-purple-400 font-semibold block">
                    Code sent to {email}
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-[#1e2436] border border-[#2e3752] focus:border-purple-500 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-3.5 text-sm outline-none text-center font-mono tracking-widest text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={Boolean(loadingProvider)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingProvider === 'email' ? 'Logging in...' : 'Verify & Login with Particle AA'}
                </button>
              </form>
            )}

            {/* Divider OR */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#2a2f42]"></div>
              <span className="absolute bg-[#141721] px-3 font-mono text-[10px] text-slate-400 font-bold tracking-widest">
                OR
              </span>
            </div>

            {/* Social Logins Icon Row matching attached image */}
            <div className="flex items-center justify-center gap-3">
              {/* Phone OTP */}
              <button
                type="button"
                onClick={() => handleSocialLogin('Phone')}
                title="Login with Phone OTP"
                className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Phone size={20} className="text-slate-900" />
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => handleSocialLogin('Facebook')}
                title="Login with Facebook"
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                title="Login with Google"
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleSocialLogin('Apple ID')}
                title="Login with Apple ID"
                className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.1-.98.04-2.17.65-2.86 1.46-.62.72-1.16 1.88-1.01 3 .09 0 2.21-.54 2.88-1.36z"/>
                </svg>
              </button>

              {/* Expand Dropdown arrow matching image */}
              <button
                type="button"
                onClick={() => setShowMoreSocials(!showMoreSocials)}
                title="More social options"
                className="w-11 h-11 rounded-full bg-[#23283a] text-slate-300 hover:text-white flex items-center justify-center hover:bg-[#2c334b] transition-all cursor-pointer border border-[#3b435d]"
              >
                <ChevronDown size={18} className={`transition-transform ${showMoreSocials ? 'rotate-180 text-purple-400' : ''}`} />
              </button>
            </div>

            {/* EXPANDED SOCIAL OPTIONS DRAWER WITH BRAND SVGs matching 2nd image */}
            {showMoreSocials && (
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#2a2f42] animate-fade-in font-mono text-xs">
                {/* Twitter / X */}
                <button
                  onClick={() => handleSocialLogin('Twitter / X')}
                  className="p-3 rounded-2xl bg-[#1e2436] hover:bg-[#273048] border border-[#2e3752] hover:border-purple-500 text-slate-100 flex items-center gap-2.5 cursor-pointer transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="font-bold text-white">Twitter / X</span>
                </button>

                {/* GitHub */}
                <button
                  onClick={() => handleSocialLogin('GitHub')}
                  className="p-3 rounded-2xl bg-[#1e2436] hover:bg-[#273048] border border-[#2e3752] hover:border-purple-500 text-slate-100 flex items-center gap-2.5 cursor-pointer transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span className="font-bold text-white">GitHub</span>
                </button>

                {/* Discord */}
                <button
                  onClick={() => handleSocialLogin('Discord')}
                  className="p-3 rounded-2xl bg-[#1e2436] hover:bg-[#273048] border border-[#2e3752] hover:border-purple-500 text-slate-100 flex items-center gap-2.5 cursor-pointer transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.950-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="font-bold text-white">Discord</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => handleSocialLogin('LinkedIn')}
                  className="p-3 rounded-2xl bg-[#1e2436] hover:bg-[#273048] border border-[#2e3752] hover:border-purple-500 text-slate-100 flex items-center gap-2.5 cursor-pointer transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  <span className="font-bold text-white">LinkedIn</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Native Web3 Wallets Tab */
          <div className="space-y-2.5">
            {[
              { id: 'metamask', name: 'MetaMask', desc: 'Browser Extension or Mobile App' },
              { id: 'coinbase', name: 'Coinbase Wallet', desc: 'Coinbase Web3 Wallet' },
              { id: 'walletconnect', name: 'WalletConnect', desc: 'Scan QR with 300+ Web3 Wallets' },
              { id: 'phantom', name: 'Phantom Wallet', desc: 'EVM & Solana Multi-Chain' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => handleSocialLogin(w.name)}
                className="w-full p-3.5 rounded-2xl bg-[#1e2436] hover:bg-[#283049] border border-[#2e3752] hover:border-purple-500 text-left flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-white text-xs block">{w.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{w.desc}</span>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Modal Footer matching attached image */}
        <div className="pt-3 border-t border-[#23283a] text-center">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            <span>Powered By</span>
            <svg width="12" height="12" viewBox="0 0 32 32" fill="none" className="inline-block">
              <circle cx="16" cy="6" r="2.2" fill="#E879F9" />
              <circle cx="23" cy="9" r="2" fill="#D946EF" />
              <circle cx="26" cy="16" r="1.8" fill="#C084FC" />
            </svg>
            <span className="text-white font-extrabold">PARTICLE NETWORK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
