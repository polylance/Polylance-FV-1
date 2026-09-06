import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  X,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  User,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { truncateAddress } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { PAYMENT_TOKENS } from '../config/paymentTokens';
import { useNavigate } from 'react-router-dom';


interface WalletBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({ isOpen, onClose }) => {
  const { address, balanceNative, balanceUsdc, refreshBalances, currentRole } = useWeb3();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalances();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const explorerUrl = `${NETWORK_CONFIG.blockExplorerUrl || 'https://amoy.polygonscan.com'}/address/${address}`;

  // Safe numeric parsing for display
  const polNum = parseFloat(balanceNative || '0');
  const usdcNum = parseFloat(balanceUsdc || '0');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100/80 overflow-hidden z-10"
        >
          {/* Header Gradient */}
          <div className="relative p-6 pb-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none -ml-8 -mb-8" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                  <Wallet size={20} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-white">
                    Wallet & Balance
                  </h3>
                  <p className="text-xs text-purple-200/80 font-sans">
                    Complete on-chain breakdown
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Refresh Balances"
                  className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Connected Address Pill */}
            <div className="relative z-10 mt-4 p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-xs font-semibold text-white truncate">
                  {address || 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  title="Copy Wallet Address"
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-mono font-bold flex items-center gap-1 text-purple-200 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Block Explorer"
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-purple-200 hover:text-white transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Balance Cards Body */}
          <div className="p-6 space-y-4">
            {/* Native POL Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-xs">
                    POL
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Polygon Native</div>
                    <div className="text-[10px] text-slate-500 font-mono">Gas & Transaction Token</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Primary
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                    {polNum.toFixed(3)} <span className="text-sm font-bold text-purple-600">POL</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Exact: <span className="font-semibold text-slate-700">{balanceNative} POL</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-sans">Estimated Fiat</div>
                  <div className="text-xs font-bold font-mono text-slate-700">
                    ≈ ${(polNum * 0.45).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Stablecoin USDC Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs">
                    $
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">USD Coin (USDC)</div>
                    <div className="text-[10px] text-slate-500 font-mono">Escrow Settlement Token</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                  1:1 USD Peg
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200/50 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black font-mono text-emerald-900 tracking-tight">
                    ${usdcNum.toFixed(2)} <span className="text-sm font-bold text-emerald-700">USDC</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700/80 mt-0.5">
                    Exact: <span className="font-semibold text-emerald-900">${balanceUsdc} USDC</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-emerald-600 font-sans">Settled Value</div>
                  <div className="text-xs font-bold font-mono text-emerald-900">
                    ${usdcNum.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Network & Protocol Details */}
            <div className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs space-y-1.5 font-sans">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <Layers size={12} className="text-purple-600" />
                  Network
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {NETWORK_CONFIG.chainName || 'Polygon PoS / Amoy'} ({NETWORK_CONFIG.chainId})
                </span>

              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1 text-[11px]">
                  <Activity size={12} className="text-emerald-600" />
                  Protocol Role
                </span>
                <span className="font-mono font-bold uppercase text-purple-700 bg-purple-100/70 px-2 py-0.2 rounded text-[10px]">
                  {currentRole || 'User'}
                </span>
              </div>
            </div>

            {/* Footer Navigation Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${address}`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-200 transition-colors cursor-pointer"
              >
                <User size={14} />
                <span>View Full Profile</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
