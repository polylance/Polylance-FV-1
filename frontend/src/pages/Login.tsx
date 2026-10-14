import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { WalletLogo } from '../components/brand/WalletLogo';
import { useEip6963 } from '../utils/useEip6963';
import {
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { WatchButton, VideoModal, useVideoModal } from '../components/video';
import confetti from 'canvas-confetti';

export const Login: React.FC = () => {
  const {
    isConnected,
    address,
    setRole,
    connectWallet,
    isWrongNetwork,
    targetChainName,
    switchToTargetNetwork,
  } = useWeb3();
  const { profiles } = usePolyLanceData();
  const { connectors, connectAsync } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { isMetaMaskInstalled, isCoinbaseInstalled, providers } = useEip6963();
  const navigate = useNavigate();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'rejected' | 'pending' | 'uninstalled' | 'network' | 'general' | null
  >(null);
  const [uninstalledWallet, setUninstalledWallet] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();

  // Dynamic routing based on connected address
  React.useEffect(() => {
    if (isConnected && address) {
      const lowerAddress = address.toLowerCase();

      // 1. Check if Admin
      const isAdmin =
        lowerAddress === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase() ||
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

      // 3. Existing profile
      const existingKey = Object.keys(profiles).find((k) => k.toLowerCase() === lowerAddress);
      const existingProfile = existingKey ? profiles[existingKey] : null;
      if (existingProfile) {
        const userRole = existingProfile.role || 'freelancer';
        setRole(userRole);
        confetti({ particleCount: 80, spread: 70 });
        navigate('/dashboard');
        return;
      }

      // Default redirect
      navigate('/dashboard');
    }
  }, [isConnected, address, profiles, navigate, setRole]);

  const handleWalletConnect = async (provider: string) => {
    setConnectingProvider(provider);
    setErrorMessage(null);
    setErrorType(null);
    setUninstalledWallet(null);

    try {
      if (provider === 'all') {
        if (openConnectModal) {
          openConnectModal();
        } else {
          await connectWallet();
        }
        return;
      }

      if (provider === 'MetaMask') {
        if (!isMetaMaskInstalled && typeof window !== 'undefined' && !(window as any).ethereum) {
          setErrorType('uninstalled');
          setUninstalledWallet('MetaMask');
          setErrorMessage('MetaMask extension is not installed in this browser.');
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
            setIsSuccess(true);
            return;
          } catch (e: any) {
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              setErrorType('rejected');
              setErrorMessage('Connection request rejected in wallet. Try again.');
              return;
            }
            if (e?.message?.toLowerCase().includes('already pending') || e?.code === -32002) {
              setErrorType('pending');
              setErrorMessage('A request is already pending in your wallet. Check your extension.');
              return;
            }
            setErrorType('general');
            setErrorMessage(e?.message || 'Failed to connect MetaMask.');
            return;
          }
        }
      }

      if (provider === 'Coinbase') {
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
            setIsSuccess(true);
            return;
          } catch (e: any) {
            if (e?.name === 'UserRejectedRequestError' || e?.code === 4001) {
              setErrorType('rejected');
              setErrorMessage('Connection request rejected in wallet. Try again.');
              return;
            }
            if (e?.message?.toLowerCase().includes('already pending') || e?.code === -32002) {
              setErrorType('pending');
              setErrorMessage('A request is already pending in your wallet. Check your extension.');
              return;
            }
            setErrorType('general');
            setErrorMessage(e?.message || 'Failed to connect Coinbase Wallet.');
            return;
          }
        }
      }

      // Fallback
      if (openConnectModal) {
        openConnectModal();
      } else {
        await connectWallet();
      }
    } catch (err: any) {
      if (err?.code === 4001 || err?.name === 'UserRejectedRequestError') {
        setErrorType('rejected');
        setErrorMessage('Connection request was declined. Try again.');
      } else {
        setErrorType('general');
        setErrorMessage('Failed to connect wallet. Please try again.');
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <PageContainer className="py-6 max-w-4xl space-y-6">
      {/* Wrong Network Warning */}
      {isWrongNetwork && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#92400E]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-[#B45309]" />
            <span>
              Connected to an unsupported network. Please switch to <strong>{targetChainName}</strong>.
            </span>
          </div>
          <Button size="sm" variant="primary" onClick={switchToTargetNetwork}>
            Switch to Polygon
          </Button>
        </div>
      )}

      {/* Success Banner */}
      {isSuccess && (
        <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] flex items-center gap-3 text-xs text-[#166534]">
          <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
          <span>Wallet authorized. Setting up session...</span>
        </div>
      )}

      {/* Connecting Prompt Banner */}
      {connectingProvider && (
        <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px] flex items-center justify-between text-xs text-[#0047AB]">
          <div className="flex items-center gap-2.5">
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>
              Connecting {connectingProvider}... <strong>Check your wallet to approve</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setConnectingProvider(null)}
            className="text-[11px] font-semibold hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] text-xs text-[#991B1B] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>

          {errorType === 'uninstalled' && uninstalledWallet === 'MetaMask' && (
            <div className="pt-2 border-t border-[#FECACA] flex items-center justify-between">
              <span>Install MetaMask to connect with this browser:</span>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0047AB] hover:underline inline-flex items-center gap-1"
              >
                <span>Install MetaMask</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {errorType === 'uninstalled' && uninstalledWallet === 'Coinbase Wallet' && (
            <div className="pt-2 border-t border-[#FECACA] flex items-center justify-between">
              <span>Install Coinbase Wallet extension:</span>
              <a
                href="https://www.coinbase.com/wallet"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0047AB] hover:underline inline-flex items-center gap-1"
              >
                <span>Install Coinbase Wallet</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {errorType === 'rejected' && (
            <div className="pt-2 border-t border-[#FECACA]">
              <button
                type="button"
                onClick={() => handleWalletConnect(connectingProvider || 'MetaMask')}
                className="font-semibold text-[#991B1B] hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B0B0F] tracking-tight">
            Connect your wallet
          </h1>
          <WatchButton
            id="task-connect-wallet"
            label="Watch tutorial (30s)"
            onOpen={openVideo}
          />
        </div>
        <p className="text-sm text-[#4B5563] max-w-lg mx-auto">
          Your wallet is your PolyLance login. No email or password.
        </p>
      </div>

      {/* 3 Equal Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: MetaMask (Recommended) */}
        <div
          onClick={() => handleWalletConnect('MetaMask')}
          className="p-6 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[12px] flex flex-col justify-between space-y-6 cursor-pointer transition-all hover:bg-[#F9FAFB] group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-2 shrink-0">
                <WalletLogo name="MetaMask" size={32} />
              </div>
              <div className="flex items-center gap-1.5">
                {isMetaMaskInstalled && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                    Installed
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE]">
                  Recommended
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                MetaMask
              </h3>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Connect using browser extension or mobile app.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              handleWalletConnect('MetaMask');
            }}
            disabled={Boolean(connectingProvider)}
          >
            Connect MetaMask
          </Button>
        </div>

        {/* Card 2: WalletConnect */}
        <div
          onClick={() => handleWalletConnect('WalletConnect')}
          className="p-6 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[12px] flex flex-col justify-between space-y-6 cursor-pointer transition-all hover:bg-[#F9FAFB] group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-2 shrink-0">
                <WalletLogo name="WalletConnect" size={32} />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                WalletConnect
              </h3>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Scan QR code with any mobile wallet.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              handleWalletConnect('WalletConnect');
            }}
            disabled={Boolean(connectingProvider)}
          >
            Connect WalletConnect
          </Button>
        </div>

        {/* Card 3: Coinbase Wallet */}
        <div
          onClick={() => handleWalletConnect('Coinbase')}
          className="p-6 bg-white border border-[#E5E7EB] hover:border-[#0047AB] rounded-[12px] flex flex-col justify-between space-y-6 cursor-pointer transition-all hover:bg-[#F9FAFB] group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-2 shrink-0">
                <WalletLogo name="Coinbase" size={32} />
              </div>
              {isCoinbaseInstalled && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  Installed
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                Coinbase Wallet
              </h3>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Connect with Coinbase browser extension or mobile.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              handleWalletConnect('Coinbase');
            }}
            disabled={Boolean(connectingProvider)}
          >
            Connect Coinbase
          </Button>
        </div>
      </div>

      {/* Or View All Wallets */}
      <div className="text-center mb-10">
        <button
          type="button"
          onClick={() => handleWalletConnect('all')}
          className="text-xs text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>View all supported wallets</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* "New to wallets?" Explainer & Beginner Links (No email anywhere) */}
      <Card className="p-6 bg-[#F6F7F9] border-[#E5E7EB] space-y-5 max-w-2xl mx-auto text-left">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[#0047AB]" />
            <h3 className="text-sm font-semibold text-[#0B0B0F]">New to Web3 wallets?</h3>
            <WatchButton
              id="new-to-wallets"
              label="Watch quickstart (45s)"
              onOpen={openVideo}
            />
          </div>
          <Link to="/help" className="text-xs text-[#0047AB] hover:underline font-semibold">
            Read beginner guide &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-[#0B0B0F] block">1. Choose a wallet</span>
            <p className="text-[#4B5563] leading-relaxed">
              Install MetaMask or Coinbase Wallet as a free browser extension.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="text-[#0047AB] hover:underline text-[11px] font-medium inline-flex items-center gap-1 pt-1"
            >
              <span>Get MetaMask</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#0B0B0F] block">2. Save recovery phrase</span>
            <p className="text-[#4B5563] leading-relaxed">
              Store your secret phrase offline in a secure place. Never share it with anyone.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-[#0B0B0F] block">3. Connect to PolyLance</span>
            <p className="text-[#4B5563] leading-relaxed">
              Approve with one click to sign contracts, fund escrows, and receive payments.
            </p>
          </div>
        </div>

        {/* Security guarantee */}
        <div className="flex items-center gap-2 text-[11px] text-[#4B5563] bg-white p-3 rounded-[8px] border border-[#E5E7EB]">
          <Shield size={15} className="text-[#0047AB] shrink-0" />
          <span>PolyLance never asks for your recovery phrase. Your private keys never leave your device.</span>
        </div>
      </Card>

      {/* Global Video Modal */}
      <VideoModal
        id={activeVideoId}
        isOpen={isOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </PageContainer>
  );
};

export default Login;
