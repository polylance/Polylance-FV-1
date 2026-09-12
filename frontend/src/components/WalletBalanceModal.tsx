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
  ChevronRight
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { truncateAddress } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { useLiveCurrencyRates } from '../utils/currency';
import { useNavigate } from 'react-router-dom';
import polylanceLogoImg from '../assets/polylanceLogo.png';

interface WalletBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({ isOpen, onClose }) => {
  const { address, balanceNative, balanceUsdc, balanceUsdt, refreshBalances } = useWeb3();
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

  // Safe numeric parsing for display with NaN protection
  const polNum = parseFloat(balanceNative || '0') || 0;
  const usdcNum = parseFloat(balanceUsdc || '0') || 0;
  const usdtNum = parseFloat(balanceUsdt || '0') || 0;

  // Real-time live valuation
  const polPrice = rates?.cryptoPrices?.POL || 0.45;
  const polUsd = polNum * polPrice;
  const totalUsd = (isNaN(polUsd) ? 0 : polUsd) + (isNaN(usdcNum) ? 0 : usdcNum) + (isNaN(usdtNum) ? 0 : usdtNum);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Card matching Image 3 */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-[460px] max-h-[92vh] bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col overflow-hidden z-10 font-sans text-slate-900"
        >
          {/* Header Section (Pinned top, shrink-0) */}
          <div className="p-5 sm:p-6 pb-3 flex items-start justify-between gap-3 shrink-0 border-b border-slate-100/60">
            <div className="flex items-start gap-3">
              {/* Wallet Gradient Badge */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] p-[2px] shadow-sm shadow-indigo-500/20 shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white">
                  <Wallet size={22} strokeWidth={2} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  Wallet &amp; Balances
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Live on-chain assets &amp; tokens
                </p>

                {/* Connected Address Pill */}
                <div
                  onClick={handleCopyAddress}
                  title="Click to copy address"
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 rounded-full text-xs font-mono text-slate-700 transition-colors cursor-pointer select-none"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold">{address ? truncateAddress(address) : 'Not Connected'}</span>
                  <span className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Header: 3D Cubes + Round Control Buttons */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Refresh Balances"
                  className={`w-9 h-9 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all cursor-pointer ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Close"
                  className="w-9 h-9 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 3D Isometric Translucent Cubes Illustration */}
              <div className="flex flex-col items-end pr-0.5 pt-0.5 opacity-85 pointer-events-none select-none">
                <svg width="74" height="42" viewBox="0 0 100 56" fill="none" className="overflow-visible">
                  {/* Cube 1 (top back) */}
                  <g transform="translate(34, 0) scale(0.65)" opacity="0.45">
                    <polygon points="30,5 55,18 30,31 5,18" fill="#c7d2fe" />
                    <polygon points="5,18 30,31 30,58 5,45" fill="#818cf8" />
                    <polygon points="30,31 55,18 55,45 30,58" fill="#a5b4fc" />
                  </g>
                  {/* Cube 2 (right middle) */}
                  <g transform="translate(56, 12) scale(0.72)" opacity="0.65">
                    <polygon points="30,5 55,18 30,31 5,18" fill="#bae6fd" />
                    <polygon points="5,18 30,31 30,58 5,45" fill="#38bdf8" />
                    <polygon points="30,31 55,18 55,45 30,58" fill="#7dd3fc" />
                  </g>
                  {/* Cube 3 (front left) */}
                  <g transform="translate(14, 16) scale(0.82)" opacity="0.8">
                    <polygon points="30,5 55,18 30,31 5,18" fill="#e0e7ff" />
                    <polygon points="5,18 30,31 30,58 5,45" fill="#6366f1" />
                    <polygon points="30,31 55,18 55,45 30,58" fill="#818cf8" />
                  </g>
                </svg>
                <span className="text-[7.5px] font-mono tracking-widest text-slate-400 font-bold uppercase -mt-0.5">
                  YOUR ASSETS. ON-CHAIN.
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Body (Always allows full viewing without any cutoffs or squishing) */}
          <div className="p-5 sm:p-6 pt-3.5 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {/* Total Wallet Value Card */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-r from-[#eff6ff] via-[#f5f8ff] to-[#f5f3ff] p-4 sm:p-5 shadow-3xs shrink-0 min-h-[120px] flex flex-col justify-between">
              {/* Ambient Sinusoidal Flow Wave SVG */}
              <svg className="absolute right-0 bottom-0 w-60 h-24 pointer-events-none opacity-80" viewBox="0 0 240 100" fill="none">
                <defs>
                  <linearGradient id="totalWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.15" />
                    <stop offset="60%" stopColor="#c7d2fe" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.45" />
                  </linearGradient>
                  <linearGradient id="totalWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path d="M0 72 C 45 72, 65 30, 110 46 C 150 60, 175 22, 240 38 L 240 100 L 0 100 Z" fill="url(#totalWaveGrad)" />
                <path d="M0 72 C 45 72, 65 30, 110 46 C 150 60, 175 22, 240 38" stroke="url(#totalWaveStroke)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-500 tracking-tight font-sans">
                  Total Wallet Value
                </span>
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 shadow-3xs">
                  <Activity size={12} className="text-emerald-600" />
                  <span>Live Sync</span>
                </div>
              </div>

              <div className="relative z-10 my-2 flex items-baseline">
                <span className="text-3xl font-black text-slate-900 font-sans tracking-tight leading-none">
                  ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-slate-500 ml-1.5 font-sans">USD</span>
              </div>

              <div className="relative z-10 flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 font-medium">Updated just now</span>
              </div>
            </div>

            {/* Asset Rows List */}
            <div className="space-y-2.5 shrink-0">
              {/* 1. Native POL */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-xs flex items-center justify-between transition-all group shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center text-white shadow-sm shadow-purple-500/20 shrink-0">
                    <svg width="22" height="22" viewBox="0 0 40 40" fill="currentColor">
                      <path d="M28.3 15.6c-.6-.4-1.4-.4-2 0l-4.5 2.6-2.5 1.5-4.5 2.6c-.6.4-1.4.4-2 0l-3.5-2c-.6-.4-1-.1-1 .6v4.1c0 .7.4 1.3 1 1.6l3.5 2c.6.4 1.4.4 2 0l4.5-2.6 2.5-1.5 4.5-2.6c.6-.4 1.4-.4 2 0l3.5 2c.6.4 1 .1 1-.6v-4.1c0-.7-.4-1.3-1-1.6l-3.5-2.1z" />
                      <path d="M28.3 6.6c-.6-.4-1.4-.4-2 0l-4.5 2.6-2.5 1.5-4.5 2.6c-.6.4-1.4.4-2 0l-3.5-2c-.6-.4-1-.1-1 .6v4.1c0 .7.4 1.3 1 1.6l3.5 2c.6.4 1.4.4 2 0l4.5-2.6 2.5-1.5 4.5-2.6c.6-.4 1.4-.4 2 0l3.5 2c.6.4 1 .1 1-.6V9.9c0-.7-.4-1.3-1-1.6l-3.5-1.7z" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Polygon Native</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/70">
                        Primary
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Gas &amp; Protocol Settlement</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {polNum.toFixed(3)} <span className="font-extrabold text-[#2563eb]">POL</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      ≈ ${polUsd.toFixed(2)} USD
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors ml-1">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              {/* 2. USD Coin (USDC) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs flex items-center justify-between transition-all group shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#2775CA] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-500/20 shrink-0 font-sans">
                    $
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">USD Coin</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/70">
                        USDC
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">1:1 Stable Escrow Token</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ${usdcNum.toFixed(2)} <span className="font-extrabold text-[#2563eb]">USDC</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Exact: ${balanceUsdc}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors ml-1">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              {/* 3. Tether USD (USDT) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-xs flex items-center justify-between transition-all group shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#26A17B] flex items-center justify-center text-white font-black text-lg shadow-sm shadow-teal-500/20 shrink-0 font-sans">
                    ₮
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">Tether USD</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/70">
                        USDT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Multi-Chain Stablecoin</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      ${usdtNum.toFixed(2)} <span className="font-extrabold text-[#059669]">USDT</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Exact: ${balanceUsdt}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors ml-1">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Network Connection Strip */}
            <div className="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-3xs">
                  <svg width="15" height="15" viewBox="0 0 40 40" fill="currentColor">
                    <path d="M28.3 15.6c-.6-.4-1.4-.4-2 0l-4.5 2.6-2.5 1.5-4.5 2.6c-.6.4-1.4.4-2 0l-3.5-2c-.6-.4-1-.1-1 .6v4.1c0 .7.4 1.3 1 1.6l3.5 2c.6.4 1.4.4 2 0l4.5-2.6 2.5-1.5 4.5-2.6c.6-.4 1.4-.4 2 0l3.5 2c.6.4 1 .1 1-.6v-4.1c0-.7-.4-1.3-1-1.6l-3.5-2.1z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {NETWORK_CONFIG.chainName || 'Polygon Amoy Testnet'} ({NETWORK_CONFIG.chainId || '80002'})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Polygonscan"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${address}`);
                }}
                className="flex-1 py-3 px-4 rounded-2xl border border-purple-200/90 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-3xs"
              >
                <User size={15} />
                <span>View Full Profile</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-8 rounded-2xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-sm"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-slate-400 text-[9.5px] font-mono tracking-widest pt-1 px-1 select-none shrink-0">
              <span>SECURE &bull; TRANSPARENT &bull; ON-CHAIN</span>
              <div className="flex items-center gap-1.5 text-slate-500 font-sans font-semibold">
                <span className="text-[11px] tracking-normal font-medium">Powered by <strong className="text-slate-700 font-bold">PolyLance</strong></span>
                <img src={polylanceLogoImg} alt="PolyLance" className="w-4 h-4 object-contain" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
