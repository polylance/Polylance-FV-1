import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Copy, Check, ExternalLink, RefreshCw, QrCode, ArrowUpRight, Wallet } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { CHAIN_ID, NETWORK_CONFIG } from '../config/contracts';
import { modalOverlayVariants, modalContentVariants, transition } from '../lib/motion';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: string;
  tokenSymbol: string;
  currentBalance: string;
  onFundsReceived?: () => void;
}

export const InsufficientFundsModal: React.FC<InsufficientFundsModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  tokenSymbol,
  currentBalance,
  onFundsReceived,
}) => {
  const { address, refreshBalances } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const reqNum = parseFloat(requiredAmount) || 0;
  const balNum = parseFloat(currentBalance) || 0;
  const shortfall = Math.max(0, reqNum - balNum);

  const isMainnet = CHAIN_ID === 137;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalances();
    setTimeout(() => {
      setIsRefreshing(false);
      if (balNum >= reqNum && onFundsReceived) {
        onFundsReceived();
      }
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition.medium}
            className="glass-panel max-w-lg w-full p-6 sm:p-7 border-amber-200 bg-white hard-shadow relative space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Insufficient Wallet Funds
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  You need additional {tokenSymbol} to complete this escrow payment.
                </p>
              </div>
            </div>

            {/* Shortfall Breakdown Card */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">Required Deposit:</span>
                <span className="font-bold text-slate-900">{reqNum.toFixed(2)} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">Current Wallet Balance:</span>
                <span className="font-bold text-slate-700">{balNum.toFixed(2)} {tokenSymbol}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-amber-900">Missing Shortfall:</span>
                <span className="font-black text-amber-700 text-sm">+{shortfall.toFixed(2)} {tokenSymbol}</span>
              </div>
            </div>

            {/* Deposit / Top-up Address Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 font-sans flex items-center justify-between">
                <span>Deposit Address (Polygon PoS)</span>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="text-purple-600 hover:text-purple-700 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  <QrCode size={13} /> {showQr ? 'Hide QR' : 'Show QR'}
                </button>
              </label>

              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 break-all">
                <span className="truncate flex-1">{address || 'No wallet connected'}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer"
                  title="Copy wallet address"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              {showQr && address && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`}
                    alt="Wallet QR Code"
                    className="w-36 h-36 rounded-lg border border-slate-200 shadow-2xs"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">Scan with Binance, Coinbase, or mobile wallet</span>
                </div>
              )}
            </div>

            {/* Quick Top-up Options */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 font-sans block">
                Recommended Top-Up Channels:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {isMainnet ? (
                  <>
                    <a
                      href="https://portal.polygon.technology/bridge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all text-xs font-sans font-bold text-slate-800 flex items-center justify-between group"
                    >
                      <span>Polygon Bridge</span>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                    </a>
                    <a
                      href="https://quickswap.exchange/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all text-xs font-sans font-bold text-slate-800 flex items-center justify-between group"
                    >
                      <span>QuickSwap DEX</span>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="https://faucet.polygon.technology/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all text-xs font-sans font-bold text-slate-800 flex items-center justify-between group"
                    >
                      <span>Amoy POL Faucet</span>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                    </a>
                    <a
                      href="https://faucet.circle.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all text-xs font-sans font-bold text-slate-800 flex items-center justify-between group"
                    >
                      <span>Circle USDC Faucet</span>
                      <ArrowUpRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Footer Action: Check Balance */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {NETWORK_CONFIG.chainName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>Check Balance</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="gradient-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
