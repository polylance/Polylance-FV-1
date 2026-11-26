import React, { useState, useEffect } from 'react';
import { useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { TurnstileWidget } from './common/TurnstileWidget';
import { WalletLogo } from './brand/WalletLogo';
import { useEip6963 } from '../utils/useEip6963';
import { ClientTrustBadge } from './common/ClientTrustBadge';
import { PortfolioVerifierForm } from './onboarding/PortfolioVerifierForm';
import { TECH_DISCIPLINES, NON_TECH_DISCIPLINES } from '../utils/portfolioPlatforms';
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Briefcase,
  UserCheck,
  Code2,
  Palette,
  Github,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'role' | 'wallet' | 'verify';
type SelectedRole = 'client' | 'freelancer';
type FreelancerTrack = 'tech' | 'non-tech' | null;

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    address,
    isConnected,
    connectWallet,
    isWrongNetwork,
    switchToTargetNetwork,
    setRole,
  } = useWeb3();
  const { jobs, profiles, updateProfile } = usePolyLanceData();
  const { connectors, connectAsync } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { isMetaMaskInstalled, isCoinbaseInstalled, providers } = useEip6963();
  const navigate = useNavigate();

  const [step, setStep] = useState<ModalStep>('role');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_pending_account_mode');
      if (saved === 'client' || saved === 'freelancer') return saved;
    }
    return 'freelancer';
  });
  const [freelancerTrack, setFreelancerTrack] = useState<FreelancerTrack>(null);
  const [companyOrDisplayName, setCompanyOrDisplayName] = useState('');
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'rejected' | 'pending' | 'uninstalled' | 'network' | 'general' | null
  >(null);
  const [uninstalledWallet, setUninstalledWallet] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const existingProfile = address
    ? profiles[Object.keys(profiles).find((k) => k.toLowerCase() === address.toLowerCase()) || '']
    : null;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setErrorType(null);
      setUninstalledWallet(null);
      setConnectingProvider(null);
      setIsSuccess(false);
      setFreelancerTrack(existingProfile?.freelancerTrack || null);
      if (isConnected && address) {
        setStep('verify');
      } else {
        setStep('role');
      }
    }
  }, [isOpen]);

  const handleChooseRole = (role: SelectedRole) => {
    setSelectedRole(role);
    try {
      localStorage.setItem('polylance_pending_account_mode', role);
      localStorage.setItem('polylance_demo_role', role);
    } catch {}
    setRole(role);
    setStep('wallet');
  };

  const handleModalClose = () => {
    setConnectingProvider(null);
    setErrorMessage(null);
    setErrorType(null);
    setUninstalledWallet(null);
    setIsSuccess(false);
    onClose();
  };

  const onWalletConnectedTransition = async () => {
    setIsSuccess(true);
    setRole(selectedRole);
    try {
      localStorage.setItem('polylance_pending_account_mode', selectedRole);
      localStorage.setItem('polylance_demo_role', selectedRole);
    } catch {}

    setTimeout(() => {
      setIsSuccess(false);
      setStep('verify');
    }, 500);
  };

  const handleWalletConnect = async (provider: string) => {
    setConnectingProvider(provider);
    setErrorMessage(null);
    setErrorType(null);
    setUninstalledWallet(null);

    try {
      if (provider === 'all') {
        handleModalClose();
        if (openConnectModal) {
          openConnectModal();
        } else {
          await connectWallet();
        }
        return;
      }

      const isMobileDevice =
        typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (provider === 'MetaMask') {
        if (isMobileDevice && !(window as any).ethereum?.isMetaMask) {
          const cleanHost = window.location.host;
          const currentPath = window.location.pathname + window.location.search + window.location.hash;
          window.location.href = `https://metamask.app.link/dapp/${cleanHost}${currentPath}`;
          return;
        }

        if (!isMetaMaskInstalled && typeof window !== 'undefined' && !(window as any).ethereum?.isMetaMask) {
          setErrorType('uninstalled');
          setUninstalledWallet('MetaMask');
          setErrorMessage('MetaMask is not installed in this browser.');
          setConnectingProvider(null);
          return;
        }

        const injected = connectors.find((c) => {
          const id = c.id.toLowerCase();
          const name = c.name.toLowerCase();
          return id === 'injected' || id.includes('metamask') || name.includes('metamask');
        });

        if (injected) {
          try {
            await connectAsync({ connector: injected });
            await onWalletConnectedTransition();
            return;
          } catch (e: any) {
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              setErrorType('rejected');
              setErrorMessage('Request rejected in wallet. Try again.');
              return;
            }
            if (e?.message?.toLowerCase().includes('already pending') || e?.code === -32002) {
              setErrorType('pending');
              setErrorMessage('A request is already pending in your wallet. Check your extension.');
              return;
            }
            setErrorType('general');
            setErrorMessage(e?.message || 'MetaMask connection failed.');
            return;
          }
        }
      }

      if (provider === 'Coinbase') {
        if (
          isMobileDevice &&
          !(window as any).coinbaseWalletExtension &&
          !(window as any).ethereum?.isCoinbaseWallet
        ) {
          const fullUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://go.cb-w.com/dapp?cb_url=${fullUrl}`;
          return;
        }

        if (!isCoinbaseInstalled && typeof window !== 'undefined' && !(window as any).coinbaseWalletExtension) {
          setErrorType('uninstalled');
          setUninstalledWallet('Coinbase Wallet');
          setErrorMessage('Coinbase Wallet extension is not installed.');
          setConnectingProvider(null);
          return;
        }

        const cb = connectors.find((c) => {
          const id = c.id.toLowerCase();
          const name = c.name.toLowerCase();
          return id.includes('coinbase') || name.includes('coinbase');
        });

        if (cb) {
          try {
            await connectAsync({ connector: cb });
            await onWalletConnectedTransition();
            return;
          } catch (e: any) {
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              setErrorType('rejected');
              setErrorMessage('Request rejected in wallet. Try again.');
              return;
            }
            if (e?.message?.toLowerCase().includes('already pending') || e?.code === -32002) {
              setErrorType('pending');
              setErrorMessage('A request is already pending in your wallet. Check your extension.');
              return;
            }
            setErrorType('general');
            setErrorMessage(e?.message || 'Coinbase Wallet connection failed.');
            return;
          }
        }
      }

      handleModalClose();
      if (openConnectModal) {
        openConnectModal();
      } else {
        await connectWallet();
      }
    } catch (err: any) {
      if (err?.name === 'UserRejectedRequestError' || err?.code === 4001) {
        setErrorType('rejected');
        setErrorMessage('Request rejected in wallet. Try again.');
      } else {
        setErrorType('general');
        setErrorMessage('Failed to connect wallet. Please try again.');
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleFinalizeClientOnboarding = async () => {
    setIsCompletingSetup(true);
    try {
      setRole('client');
      if (address) {
        await updateProfile(
          {
            role: 'client',
            accountMode: 'client',
            onboardingCompleted: true,
            ...(companyOrDisplayName.trim() ? { displayName: companyOrDisplayName.trim() } : {}),
          },
          address
        );
      }
      handleModalClose();
      navigate('/jobs/post');
    } finally {
      setIsCompletingSetup(false);
    }
  };

  const handleSaveNonTechPortfolio = async (data: {
    portfolioLinks: any[];
    primaryDiscipline: string;
    portfolioVerified: boolean;
  }) => {
    setRole('freelancer');
    if (address) {
      await updateProfile(
        {
          role: 'freelancer',
          accountMode: 'freelancer',
          freelancerTrack: 'non-tech',
          primaryDiscipline: data.primaryDiscipline,
          primaryCategory: data.primaryDiscipline,
          portfolioLinks: data.portfolioLinks,
          portfolioVerified: data.portfolioVerified,
          onboardingCompleted: true,
        },
        address
      );
    }
    handleModalClose();
    navigate('/jobs');
  };

  const modalTitle =
    step === 'role'
      ? 'Welcome to PolyLance'
      : step === 'wallet'
      ? 'Connect your wallet'
      : selectedRole === 'client'
      ? 'Client Verification & Trust Score'
      : freelancerTrack === 'tech'
      ? 'Tech Freelancer — GitHub Verification'
      : freelancerTrack === 'non-tech'
      ? 'Creative & Non-Tech Portfolio'
      : 'Choose Your Freelancer Track';

  const modalDescription =
    step === 'role'
      ? 'Step 1 of 3 — Select how you are joining PolyLance on Polygon.'
      : step === 'wallet'
      ? 'Step 2 of 3 — Wallet signature acts as your cryptographic account login.'
      : selectedRole === 'client'
      ? 'Step 3 of 3 — Client Reputation works automatically on-chain. No GitHub required.'
      : 'Step 3 of 3 — Verification matches your actual craft and portfolio.';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={modalTitle}
      description={modalDescription}
      maxWidth={step === 'verify' ? 'lg' : 'md'}
    >
      <div className="space-y-4">
        {/* Progress Step Pills */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
          {[
            { id: 'role', label: '1. Choose Role' },
            { id: 'wallet', label: '2. Connect Wallet' },
            { id: 'verify', label: '3. Verify Track' },
          ].map((s, idx) => {
            const active = step === s.id;
            const past =
              (step === 'wallet' && idx === 0) || (step === 'verify' && idx < 2);
            return (
              <div
                key={s.id}
                className={`px-2.5 py-1.5 rounded-lg border text-center font-semibold transition-colors ${
                  active
                    ? 'bg-[#EFF6FF] border-[#0A52B8] text-[#0A52B8]'
                    : past
                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                    : 'bg-[#F8FAFC] border-slate-200 text-slate-400'
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: CHOOSE ROLE */}
          {step === 'role' && (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <button
                type="button"
                onClick={() => handleChooseRole('client')}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#EFF6FF]/40 text-left flex items-start gap-3.5 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0A52B8] shrink-0">
                  <Briefcase size={20} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8]">
                      Join as a Client
                    </span>
                    <ArrowRight size={15} className="text-slate-400 group-hover:text-[#0A52B8] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hire vetted tech &amp; creative talent with non-custodial milestone protection.
                  </p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Client Trust Score • Zero GitHub Needed
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChooseRole('freelancer')}
                className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#EFF6FF]/40 text-left flex items-start gap-3.5 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0A52B8] shrink-0">
                  <UserCheck size={20} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8]">
                      Join as a Freelancer
                    </span>
                    <ArrowRight size={15} className="text-slate-400 group-hover:text-[#0A52B8] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Find global contracts, get paid instantly in POL/USDC, and build on-chain proof.
                  </p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE]">
                    GitHub Track (Tech) OR Portfolio Track (Creative)
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-slate-200">
                <Shield size={14} className="text-[#0A52B8] shrink-0" />
                <span>Account roles stay cleanly separated for hiring, escrow payouts, and community trust badges.</span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CONNECT WALLET */}
          {step === 'wallet' && (
            <motion.div
              key="step-wallet"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs">
                <span className="text-slate-600">
                  Selected Account:{' '}
                  <strong className="text-[#0F172A] capitalize">{selectedRole}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="text-[#0A52B8] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  <span>Change role</span>
                </button>
              </div>

              {isSuccess && (
                <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#0A52B8] flex items-center gap-3">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <div>
                    <span className="font-semibold block">Wallet connected on Polygon</span>
                    <span>Opening your {selectedRole} verification setup...</span>
                  </div>
                </div>
              )}

              {connectingProvider && !isSuccess && (
                <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#0A52B8] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>
                      Connecting {connectingProvider}... <strong>Approve signature in wallet</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConnectingProvider(null)}
                    className="text-[11px] font-semibold text-[#0A52B8] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {isWrongNetwork && (
                <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs text-[#0F172A] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0 text-[#0A52B8]" />
                    <span>Switch to Polygon PoS (Chain 137) to continue.</span>
                  </div>
                  <Button size="sm" variant="primary" onClick={switchToTargetNetwork} className="shrink-0">
                    Switch to Polygon
                  </Button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="font-medium hover:underline text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>

                  {errorType === 'uninstalled' && uninstalledWallet === 'MetaMask' && (
                    <div className="pt-1 border-t border-rose-200 flex items-center justify-between">
                      <span>Install MetaMask extension:</span>
                      <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#0A52B8] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Download MetaMask</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {errorType === 'uninstalled' && uninstalledWallet === 'Coinbase Wallet' && (
                    <div className="pt-1 border-t border-rose-200 flex items-center justify-between">
                      <span>Install Coinbase Wallet:</span>
                      <a
                        href="https://www.coinbase.com/wallet"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#0A52B8] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Download Coinbase Wallet</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {errorType === 'rejected' && (
                    <div className="pt-1 border-t border-rose-200">
                      <button
                        type="button"
                        onClick={() => handleWalletConnect(connectingProvider || 'MetaMask')}
                        className="font-semibold text-rose-800 hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        <span>Try again</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <div
                  onClick={() => handleWalletConnect('MetaMask')}
                  className="w-full h-16 p-3.5 bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#F8FAFC] rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                      <WalletLogo name="MetaMask" size={26} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0A52B8]">
                          MetaMask
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE]">
                          Recommended
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">Browser extension &amp; mobile</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-[#0A52B8]" />
                </div>

                <div
                  onClick={() => handleWalletConnect('WalletConnect')}
                  className="w-full h-16 p-3.5 bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#F8FAFC] rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                      <WalletLogo name="WalletConnect" size={26} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0A52B8] block">
                        WalletConnect
                      </span>
                      <span className="text-xs text-slate-500">Scan QR with any mobile wallet</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-[#0A52B8]" />
                </div>

                <div
                  onClick={() => handleWalletConnect('Coinbase')}
                  className="w-full h-16 p-3.5 bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#F8FAFC] rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                      <WalletLogo name="Coinbase" size={26} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0A52B8] block">
                        Coinbase Wallet
                      </span>
                      <span className="text-xs text-slate-500">App or browser extension</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-[#0A52B8]" />
                </div>

                {providers
                  .filter((p) => {
                    const name = p.info.name.toLowerCase();
                    return !name.includes('metamask') && !name.includes('coinbase');
                  })
                  .map((p) => (
                    <div
                      key={p.info.uuid}
                      onClick={() => handleWalletConnect(p.info.name)}
                      className="w-full h-16 p-3.5 bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#F8FAFC] rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                          <WalletLogo name={p.info.name} iconUrl={p.info.icon} size={26} />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-[#0F172A] group-hover:text-[#0A52B8] block">
                            {p.info.name}
                          </span>
                          <span className="text-xs text-slate-500">Detected browser wallet</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-1 rounded bg-[#EFF6FF] text-[#0A52B8] border border-[#BFDBFE]">
                        Installed
                      </span>
                    </div>
                  ))}
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleWalletConnect('all')}
                  className="text-xs text-[#0A52B8] font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View all supported wallets</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="flex justify-center -my-1">
                <TurnstileWidget size="compact" action="login-modal" theme="auto" />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                  <HelpCircle size={14} className="text-[#0A52B8]" />
                  <span>New to Web3 wallets?</span>
                </div>
                <Link to="/help" onClick={handleModalClose} className="text-[#0A52B8] hover:underline font-semibold">
                  Read beginner guide &rarr;
                </Link>
              </div>
            </motion.div>
          )}

          {/* STEP 3: BRANCHING ROLE-SPECIFIC VERIFICATION */}
          {step === 'verify' && (
            <motion.div
              key="step-verify"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 text-left"
            >
              {selectedRole === 'client' ? (
                /* BRANCH A: CLIENT (Zero GitHub, Zero Portfolio) */
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-semibold text-[#0A52B8]">
                      <ShieldCheck size={15} />
                      <span>How Your Client Trust Score Works</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Clients do <strong>not</strong> connect GitHub or portfolios. Your reputation builds automatically on Polygon from funded escrows, fast milestone release speed, dispute-free completion rate, and freelancer reviews.
                    </p>
                  </div>

                  <ClientTrustBadge clientAddress={address} jobs={jobs} profile={existingProfile} />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#0F172A]">
                      Display Name or Company (Optional)
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={companyOrDisplayName}
                        onChange={(e) => setCompanyOrDisplayName(e.target.value)}
                        placeholder={existingProfile?.displayName || 'e.g. Acme Studio or Alex M.'}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/20 focus:border-[#0A52B8]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="text-xs text-slate-500 hover:text-[#0F172A] font-medium cursor-pointer"
                    >
                      Skip for now
                    </button>
                    <Button
                      variant="primary"
                      size="md"
                      loading={isCompletingSetup}
                      onClick={handleFinalizeClientOnboarding}
                      trailingIcon={<ArrowRight size={15} />}
                    >
                      Complete Client Setup
                    </Button>
                  </div>
                </div>
              ) : !freelancerTrack ? (
                /* BRANCH B1: FREELANCER — TECH VS NON-TECH CHOOSER */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setFreelancerTrack('tech')}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#EFF6FF]/40 text-left space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0A52B8]">
                        <Code2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8]">
                          Tech Freelancer
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {TECH_DISCIPLINES.join(', ')}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A52B8]">
                        <Github size={12} />
                        <span>Verify with GitHub ✓</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFreelancerTrack('non-tech')}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0A52B8] hover:bg-[#EFF6FF]/40 text-left space-y-2.5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0A52B8]">
                        <Palette size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0A52B8]">
                          Non-Tech &amp; Creative
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {NON_TECH_DISCIPLINES.join(', ')}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A52B8]">
                        <Sparkles size={12} />
                        <span>Verify via Portfolio Links (No GitHub)</span>
                      </span>
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="text-slate-500 hover:text-[#0F172A] cursor-pointer"
                    >
                      Skip for now → Browse Jobs
                    </button>
                  </div>
                </div>
              ) : freelancerTrack === 'tech' ? (
                /* BRANCH B2: TECH FREELANCER -> GITHUB FLOW */
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setFreelancerTrack(null)}
                    className="text-xs font-semibold text-[#0A52B8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={12} />
                    <span>Switch between Tech / Non-Tech</span>
                  </button>

                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                        <Github size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#0F172A]">
                          Connect GitHub for Developer Verification
                        </h4>
                        <p className="text-xs text-slate-600">
                          Authenticate via read-only GitHub OAuth to verify repo activity and earn the Cobalt <strong className="text-[#0A52B8]">GitHub Verified ✓</strong> badge.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (address) {
                            updateProfile(
                              { role: 'freelancer', accountMode: 'freelancer', freelancerTrack: 'tech' },
                              address
                            );
                          }
                          handleModalClose();
                          navigate('/onboarding?track=tech');
                        }}
                        icon={<Github size={15} />}
                        className="flex-1"
                      >
                        Continue to GitHub Verification
                      </Button>
                      <Button variant="secondary" onClick={handleModalClose}>
                        Later
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* BRANCH B3: NON-TECH FREELANCER -> PORTFOLIO SHOWCASE (SKIPS GITHUB) */
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setFreelancerTrack(null)}
                    className="text-xs font-semibold text-[#0A52B8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={12} />
                    <span>Switch between Tech / Non-Tech</span>
                  </button>

                  <PortfolioVerifierForm
                    compact
                    initialLinks={existingProfile?.portfolioLinks || []}
                    initialDiscipline={existingProfile?.primaryDiscipline}
                    submitLabel="Complete Portfolio Verification"
                    onSave={handleSaveNonTechPortfolio}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default LoginModal;
