import React, { useState } from 'react';
import { useConnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../context/Web3Context';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { WalletLogo } from './brand/WalletLogo';
import { useEip6963 } from '../utils/useEip6963';
import {
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { connectWallet, isWrongNetwork, switchToTargetNetwork } = useWeb3();
  const { connectors, connectAsync } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { isMetaMaskInstalled, isCoinbaseInstalled, providers } = useEip6963();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'rejected' | 'pending' | 'uninstalled' | 'network' | 'general' | null
  >(null);
  const [uninstalledWallet, setUninstalledWallet] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetState = () => {
    setConnectingProvider(null);
    setErrorMessage(null);
    setErrorType(null);
    setUninstalledWallet(null);
    setIsSuccess(false);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
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

      if (provider === 'MetaMask') {
        if (!isMetaMaskInstalled && typeof window !== 'undefined' && !(window as any).ethereum) {
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
            setIsSuccess(true);
            setTimeout(() => {
              handleModalClose();
            }, 750);
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
            setTimeout(() => {
              handleModalClose();
            }, 750);
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

      // Fallback for WalletConnect or other providers
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Connect your wallet"
      description="Your wallet is your PolyLance login. No email or password."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Success State */}
        {isSuccess && (
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] text-xs text-[#166534] flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[#16A34A] shrink-0" />
            <div>
              <span className="font-semibold block">Wallet connected successfully</span>
              <span>Redirecting to your PolyLance workspace...</span>
            </div>
          </div>
        )}

        {/* Connecting Banner */}
        {connectingProvider && !isSuccess && (
          <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[10px] text-xs text-[#0047AB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 size={16} className="animate-spin shrink-0" />
              <span>
                Connecting {connectingProvider}... <strong>Check your wallet to approve</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConnectingProvider(null)}
              className="text-[11px] font-semibold text-[#0047AB] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Wrong Network Notice */}
        {isWrongNetwork && (
          <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] text-xs text-[#92400E] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-[#B45309]" />
              <span>Connected to unsupported network. Switch to Polygon to proceed.</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={switchToTargetNetwork}
              className="shrink-0"
            >
              Switch to Polygon
            </Button>
          </div>
        )}

        {/* Error States with action */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-xs text-[#991B1B] space-y-2">
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
              <div className="pt-1 border-t border-[#FECACA] flex items-center justify-between">
                <span>Download MetaMask extension:</span>
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
              <div className="pt-1 border-t border-[#FECACA] flex items-center justify-between">
                <span>Download Coinbase Wallet:</span>
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
              <div className="pt-1 border-t border-[#FECACA]">
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

        {/* Wallet Rows (Equal Height, whole row clickable, official logos) */}
        <div className="space-y-2.5">
          {/* Row 1: MetaMask (Recommended) */}
          <div
            onClick={() => handleWalletConnect('MetaMask')}
            className="w-full h-16 p-3.5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:bg-[#F9FAFB] rounded-[10px] cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-1.5 shrink-0">
                <WalletLogo name="MetaMask" size={26} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors">
                    MetaMask
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE]">
                    Recommended
                  </span>
                </div>
                <span className="text-xs text-[#6B7280]">Browser extension & mobile</span>
              </div>
            </div>

            {isMetaMaskInstalled ? (
              <span className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                Installed
              </span>
            ) : (
              <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#0047AB] group-hover:translate-x-0.5 transition-all" />
            )}
          </div>

          {/* Row 2: WalletConnect */}
          <div
            onClick={() => handleWalletConnect('WalletConnect')}
            className="w-full h-16 p-3.5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:bg-[#F9FAFB] rounded-[10px] cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-1.5 shrink-0">
                <WalletLogo name="WalletConnect" size={26} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors block">
                  WalletConnect
                </span>
                <span className="text-xs text-[#6B7280]">Scan with any mobile wallet</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#0047AB] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Row 3: Coinbase Wallet */}
          <div
            onClick={() => handleWalletConnect('Coinbase')}
            className="w-full h-16 p-3.5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:bg-[#F9FAFB] rounded-[10px] cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-1.5 shrink-0">
                <WalletLogo name="Coinbase" size={26} />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors block">
                  Coinbase Wallet
                </span>
                <span className="text-xs text-[#6B7280]">App or browser extension</span>
              </div>
            </div>

            {isCoinbaseInstalled ? (
              <span className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                Installed
              </span>
            ) : (
              <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#0047AB] group-hover:translate-x-0.5 transition-all" />
            )}
          </div>

          {/* Other detected EIP-6963 Wallets */}
          {providers
            .filter((p) => {
              const name = p.info.name.toLowerCase();
              return !name.includes('metamask') && !name.includes('coinbase');
            })
            .map((p) => (
              <div
                key={p.info.uuid}
                onClick={() => handleWalletConnect(p.info.name)}
                className="w-full h-16 p-3.5 bg-white border border-[#E5E7EB] hover:border-[#0047AB] hover:bg-[#F9FAFB] rounded-[10px] cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center p-1.5 shrink-0">
                    <WalletLogo name={p.info.name} iconUrl={p.info.icon} size={26} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-[#0B0B0F] group-hover:text-[#0047AB] transition-colors block">
                      {p.info.name}
                    </span>
                    <span className="text-xs text-[#6B7280]">Detected browser wallet</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  Installed
                </span>
              </div>
            ))}
        </div>

        {/* View All Wallets button */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => handleWalletConnect('all')}
            className="text-xs text-[#0047AB] font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>View all supported wallets</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Footer info: New to wallets? + Security guarantee */}
        <div className="pt-3 border-t border-[#E5E7EB] space-y-2.5 text-xs text-[#4B5563]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#0B0B0F] font-medium">
              <HelpCircle size={14} className="text-[#0047AB]" />
              <span>New to Web3 wallets?</span>
            </div>
            <Link
              to="/help"
              onClick={handleModalClose}
              className="text-[#0047AB] hover:underline font-semibold"
            >
              Read beginner guide &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#4B5563] bg-[#F6F7F9] p-2.5 rounded-[8px] border border-[#E5E7EB]">
            <Shield size={14} className="text-[#0047AB] shrink-0" />
            <span>PolyLance never asks for your recovery phrase or private keys.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;
