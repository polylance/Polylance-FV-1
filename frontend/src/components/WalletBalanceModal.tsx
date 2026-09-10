import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Wallet,
  User,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { truncateAddress } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { useLiveCurrencyRates } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

interface WalletBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({ isOpen, onClose }) => {
  const { address, balanceNative, balanceUsdc, balanceUsdt, refreshBalances, currentRole } = useWeb3();
  const rates = useLiveCurrencyRates();
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
  const usdtNum = parseFloat(balanceUsdt || '0');

  // Real-time live valuation
  const polPrice = rates.cryptoPrices.POL || 0.45;
  const polUsd = polNum * polPrice;
  const totalUsd = polUsd + usdcNum + usdtNum;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-purple-100/80 flex flex-col overflow-hidden z-10"
        >
          {/* Header Gradient */}
          <div className="relative p-4 sm:p-5 pb-3.5 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none -ml-8 -mb-8" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                  <Wallet size={16} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-white leading-tight">
                    Wallet & Balances
                  </h3>
                  <p className="text-[11px] text-purple-200/80 font-sans">
                    Live on-chain assets & tokens
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Refresh Balances"
                  className={`p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Connected Address Pill */}
            <div className="relative z-10 mt-3 p-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-[11px] font-semibold text-white truncate">
                  {address ? truncateAddress(address) : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  title="Copy Wallet Address"
                  className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-mono font-bold flex items-center gap-1 text-purple-200 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Block Explorer"
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-purple-200 hover:text-white transition-colors"
                >
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* Balance Cards Body */}
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {/* Net Total Portfolio Valuation Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-emerald-50/70 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Total Wallet Value
                </span>
                <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight">
                  ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[11px] font-semibold text-slate-500 font-sans">USD</span>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[9.5px] font-mono font-bold flex items-center gap-1 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </div>
            </div>

            {/* Asset Rows List */}
            <div className="space-y-2">
              {/* Native POL Card */}
              <div className="p-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0">
                    POL
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Polygon Native</span>
                      <span className="text-[8.5px] font-mono font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.2 rounded border border-purple-200">
                        Primary
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Gas & Protocol Settlement
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-slate-900">
                    {polNum.toFixed(3)} <span className="text-xs font-bold text-purple-600">POL</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ≈ ${polUsd.toFixed(2)} USD
                  </div>
                </div>
              </div>

              {/* Stablecoin USDC Card */}
              <div className="p-3 rounded-2xl bg-blue-50/40 hover:bg-blue-50/70 border border-blue-200/70 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                    $
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">USD Coin</span>
                      <span className="text-[8.5px] font-mono font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded border border-blue-200">
                        USDC
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      1:1 Stable Escrow Token
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-blue-900">
                    ${usdcNum.toFixed(2)} <span className="text-xs font-bold text-blue-700">USDC</span>
                  </div>
                  <div className="text-[10px] font-mono text-blue-600/80">
                    Exact: ${balanceUsdc}
                  </div>
                </div>
              </div>

              {/* Stablecoin USDT Card */}
              <div className="p-3 rounded-2xl bg-teal-50/40 hover:bg-teal-50/70 border border-teal-200/70 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center font-extrabold text-sm shadow-2xs shrink-0 font-mono">
                    ₮
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Tether USD</span>
                      <span className="text-[8.5px] font-mono font-bold text-teal-700 bg-teal-100/60 px-1.5 py-0.2 rounded border border-teal-200">
                        USDT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Multi-Chain Stablecoin
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-teal-900">
                    ${usdtNum.toFixed(2)} <span className="text-xs font-bold text-teal-700">USDT</span>
                  </div>
                  <div className="text-[10px] font-mono text-teal-600/80">
                    Exact: ${balanceUsdt}
                  </div>
                </div>
              </div>
            </div>

            {/* Network & Protocol Details Strip */}
            <div className="p-2.5 px-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs flex items-center justify-between text-slate-600 font-sans">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers size={13} className="text-purple-600 shrink-0" />
                <span className="text-[11px] font-mono font-semibold text-slate-700 truncate">
                  {NETWORK_CONFIG.chainName || 'Polygon'} ({NETWORK_CONFIG.chainId})
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <Activity size={13} className="text-emerald-600 shrink-0" />
                <span className="font-mono font-bold uppercase text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded text-[10px]">
                  {currentRole || 'User'}
                </span>
              </div>
            </div>

            {/* Footer Navigation Buttons */}
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${address}`);
                }}
                className="flex-1 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-200 transition-colors cursor-pointer"
              >
                <User size={13} />
                <span>View Full Profile</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
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
