import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress, formatTimeAgo } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { useLiveCurrencyRates } from '../utils/currency';
import { useNavigate } from 'react-router-dom';
import polylanceLogoImg from '../assets/polylanceLogo.png';
import { scrollToSection } from '../utils/scroll';

interface WalletBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletBalanceModal: React.FC<WalletBalanceModalProps> = ({ isOpen, onClose }) => {
  const { address, balanceNative, balanceUsdc, balanceUsdt, refreshBalances } = useWeb3();
  const { jobs } = usePolyLanceData();
  const rates = useLiveCurrencyRates();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'balances' | 'polygon_history'>('balances');

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTxHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(hash);
    setTimeout(() => setCopiedTxHash(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBalances();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const explorerUrl = `${NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com'}/address/${address}`;

  // Safe numeric parsing for display with NaN protection
  const polNum = parseFloat(balanceNative || '0') || 0;
  const usdcNum = parseFloat(balanceUsdc || '0') || 0;
  const usdtNum = parseFloat(balanceUsdt || '0') || 0;

  // Real-time live valuation
  const polPrice = rates?.cryptoPrices?.POL || 0.45;
  const polUsd = polNum * polPrice;
  const totalUsd = (isNaN(polUsd) ? 0 : polUsd) + (isNaN(usdcNum) ? 0 : usdcNum) + (isNaN(usdtNum) ? 0 : usdtNum);

  // Compute all PolyLance transactions related to this wallet on Polygon
  const polygonTransactions = useMemo(() => {
    if (!address) return [];
    const addrLower = address.toLowerCase();
    const txList: Array<{
      id: string;
      title: string;
      subtitle: string;
      jobTitle: string;
      jobId: string;
      amountDisplay?: string;
      tokenSymbol?: string;
      txHash: string;
      timestamp: number;
      type: 'fund' | 'release' | 'submission' | 'creation' | 'sbt' | 'dispute';
      isIncoming: boolean;
    }> = [];

    const seenTxHashes = new Set<string>();

    (jobs || []).forEach((job) => {
      const isClient = Boolean(job.client && job.client.toLowerCase() === addrLower);
      const isFreelancer = Boolean(job.freelancer && job.freelancer.toLowerCase() === addrLower);
      const isApplicant = (job.applications || []).some(
        (a) => a.applicant && a.applicant.toLowerCase() === addrLower
      );

      if (!isClient && !isFreelancer && !isApplicant) return;

      const sym = (job.paymentTokenSymbol || 'USDC').toUpperCase();
      const isCrypto = sym === 'POL' || sym === 'MATIC';
      const tokenSym = isCrypto ? 'POL' : sym;
      const rawAmt = parseFloat(isCrypto ? (job.amountEth || job.amountUsdc || '0') : (job.amountUsdc || '0')) || 0;
      const amountStr = isCrypto ? `${rawAmt} POL` : `$${rawAmt.toFixed(2)} ${tokenSym}`;

      // Events
      (job.events || []).forEach((evt) => {
        if (!evt.txHash || evt.status !== 'completed') return;
        const key = `${evt.txHash.toLowerCase()}-${evt.step}`;
        if (seenTxHashes.has(key)) return;
        seenTxHashes.add(key);

        let type: 'fund' | 'release' | 'submission' | 'creation' | 'sbt' | 'dispute' = 'creation';
        let isIncoming = false;
        let title = evt.title || evt.step;
        let subtitle = job.title;

        if (evt.step === 'Posted') {
          type = 'creation';
          title = 'Job Escrow Created';
          isIncoming = false;
        } else if (evt.step === 'Funded') {
          type = 'fund';
          title = isClient ? 'Escrow Deposit Funded' : 'Escrow Locked for Milestone';
          isIncoming = !isClient;
        } else if (evt.step === 'Submitted') {
          type = 'submission';
          title = 'Deliverables Submitted to IPFS';
          isIncoming = false;
        } else if (evt.step === 'Completed') {
          type = 'release';
          title = isFreelancer ? 'Escrow Payout Received' : 'Escrow Payment Released';
          isIncoming = isFreelancer;
        } else if (evt.step === 'Minted') {
          type = 'sbt';
          title = 'Reputation Soulbound Token Minted';
          isIncoming = true;
        }

        txList.push({
          id: `${job.id}-${evt.step}-${evt.timestamp}`,
          title,
          subtitle,
          jobTitle: job.title,
          jobId: job.id,
          amountDisplay: (evt.step === 'Funded' || evt.step === 'Completed') ? amountStr : undefined,
          tokenSymbol: tokenSym,
          txHash: evt.txHash,
          timestamp: evt.timestamp || job.createdAt || Date.now(),
          type,
          isIncoming,
        });
      });

      // Also check sbtTxHash if not in events
      if (job.sbtTxHash && !seenTxHashes.has(job.sbtTxHash.toLowerCase())) {
        seenTxHashes.add(job.sbtTxHash.toLowerCase());
        txList.push({
          id: `${job.id}-sbt-${job.sbtTxHash}`,
          title: 'Reputation Soulbound NFT Minted',
          subtitle: `Verified Attestation for "${job.title}"`,
          jobTitle: job.title,
          jobId: job.id,
          txHash: job.sbtTxHash,
          timestamp: job.completedAt || Date.now(),
          type: 'sbt',
          isIncoming: true,
        });
      }
    });

    return txList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [jobs, address]);

  if (!isOpen) return null;

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

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-[480px] max-h-[92vh] bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-slate-100 flex flex-col overflow-hidden z-10 font-sans text-slate-900"
        >
          {/* Header Section */}
          <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3 shrink-0 border-b border-slate-100/60 bg-white">
            <div className="flex items-start gap-3 min-w-0">
              {view === 'polygon_history' ? (
                <button
                  type="button"
                  onClick={() => setView('balances')}
                  className="w-10 h-10 rounded-2xl bg-purple-100/80 hover:bg-purple-200 text-purple-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Back to Balances"
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] p-[2px] shadow-sm shadow-indigo-500/20 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white">
                    <Wallet size={20} strokeWidth={2} />
                  </div>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug truncate">
                    {view === 'polygon_history' ? 'Polygon Transaction History' : 'Wallet & Balances'}
                  </h3>
                  {view === 'polygon_history' && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                      {polygonTransactions.length} Txs
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {view === 'polygon_history'
                    ? 'All PolyLance on-chain transactions on Polygon'
                    : 'Live on-chain assets & tokens'}
                </p>

                {/* Connected Address Pill */}
                <div
                  onClick={handleCopyAddress}
                  title="Click to copy address"
                  className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 rounded-full text-xs font-mono text-slate-700 transition-colors cursor-pointer select-none"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold">{address ? truncateAddress(address) : 'Not Connected'}</span>
                  <span className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                title="Refresh Balances"
                className={`w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all cursor-pointer ${
                  refreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="w-8 h-8 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          {view === 'balances' ? (
            /* ── VIEW 1: TOKEN BALANCES ── */
            <div className="p-4 sm:p-5 pt-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {/* Total Wallet Value Card */}
              <div className="relative overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-r from-[#eff6ff] via-[#f5f8ff] to-[#f5f3ff] p-3.5 sm:p-4 shadow-3xs shrink-0 min-h-[105px] flex flex-col justify-between">
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
                {/* 1. Native POL (Clickable to view Polygon Transaction History in PolyLance) */}
                <div
                  onClick={() => setView('polygon_history')}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md flex items-center justify-between transition-all group shrink-0 cursor-pointer hover:bg-purple-50/20"
                  title="Click to view Polygon transaction history in PolyLance"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#9333ea] flex items-center justify-center text-white shadow-sm shadow-purple-500/20 shrink-0">
                      <svg width="22" height="22" viewBox="0 0 40 40" fill="currentColor">
                        <path d="M28.3 15.6c-.6-.4-1.4-.4-2 0l-4.5 2.6-2.5 1.5-4.5 2.6c-.6.4-1.4.4-2 0l-3.5-2c-.6-.4-1-.1-1 .6v4.1c0 .7.4 1.3 1 1.6l3.5 2c.6.4 1.4.4 2 0l4.5-2.6 2.5-1.5 4.5-2.6c.6-.4 1.4-.4 2 0l3.5 2c.6.4 1 .1 1-.6v-4.1c0-.7-.4-1.3-1-1.6l-3.5-2.1z" />
                        <path d="M28.3 6.6c-.6-.4-1.4-.4-2 0l-4.5 2.6-2.5 1.5-4.5 2.6c-.6.4-1.4.4-2 0l-3.5-2c-.6-.4-1-.1-1 .6v4.1c0 .7.4 1.3 1 1.6l3.5 2c.6.4 1.4.4 2 0l4.5-2.6 2.5-1.5 4.5-2.6c.6-.4 1.4-.4 2 0l3.5 2c.6.4 1 .1 1-.6V9.9c0-.7-.4-1.3-1-1.6l-3.5-1.7z" opacity="0.8" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          Polygon Native
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/70">
                          POL
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 font-medium mt-0.5 flex items-center gap-1">
                        <span>Click to view Tx History</span>
                        <ChevronRight size={12} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {polNum.toFixed(3)} <span className="font-extrabold text-[#7c3aed]">POL</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ≈ ${polUsd.toFixed(2)} USD
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-colors ml-1">
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
                    {NETWORK_CONFIG.chainName || 'Polygon Mainnet'} ({NETWORK_CONFIG.chainId || '137'})
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
                    navigate(`/profile/${address}?section=reputation-overview`);
                    scrollToSection('reputation-overview', 250);
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
                  <span className="text-[11px] tracking-normal font-medium">
                    Powered by <strong className="text-slate-700 font-bold">PolyLance</strong>
                  </span>
                  <img src={polylanceLogoImg} alt="PolyLance" className="w-4 h-4 object-contain" />
                </div>
              </div>
            </div>
          ) : (
            /* ── VIEW 2: POLYGON TRANSACTION HISTORY ── */
            <div className="p-4 sm:p-5 pt-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {/* Back to Balances Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200/80">
                <button
                  type="button"
                  onClick={() => setView('balances')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>&larr; Back to Balances</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-purple-950 bg-white/80 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Polygon Mainnet (137)</span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {polygonTransactions.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Clock size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800">No PolyLance Transactions Yet</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        When you fund escrows, submit deliverables, or receive payouts in PolyLance, your Polygon on-chain transaction history will appear here.
                      </p>
                    </div>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 underline pt-1"
                    >
                      <span>Check Address on PolygonScan</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  polygonTransactions.map((tx) => {
                    const polygonScanTxUrl = `${NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com'}/tx/${tx.txHash}`;
                    const isCopied = copiedTxHash === tx.txHash;

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 shadow-3xs hover:shadow-xs transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                tx.type === 'release'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : tx.type === 'fund'
                                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                  : tx.type === 'sbt'
                                  ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                  : tx.type === 'submission'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {tx.type === 'release' ? (
                                <ArrowDownLeft size={16} />
                              ) : tx.type === 'fund' ? (
                                <ArrowUpRight size={16} />
                              ) : tx.type === 'sbt' ? (
                                <Award size={16} />
                              ) : tx.type === 'submission' ? (
                                <FileText size={16} />
                              ) : (
                                <Layers size={16} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {tx.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {tx.jobTitle}
                              </p>
                            </div>
                          </div>

                          {tx.amountDisplay && (
                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs sm:text-sm font-bold font-mono ${
                                  tx.isIncoming ? 'text-emerald-600' : 'text-slate-900'
                                }`}
                              >
                                {tx.isIncoming ? `+${tx.amountDisplay}` : tx.amountDisplay}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tx Hash Pill & Timestamp */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10.5px] font-mono text-slate-400">
                          <span>{formatTimeAgo(tx.timestamp)}</span>

                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">
                              {truncateAddress(tx.txHash)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyTxHash(tx.txHash, e)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy transaction hash"
                            >
                              {isCopied ? (
                                <Check size={11} className="text-emerald-600" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                            <a
                              href={polygonScanTxUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-slate-100 text-purple-600 hover:text-purple-800 transition-colors"
                              title="View on PolygonScan"
                            >
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setView('balances')}
                  className="flex-1 py-3 px-4 rounded-2xl border border-purple-200/90 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-3xs"
                >
                  <ArrowLeft size={15} />
                  <span>Back to Balances</span>
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
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
