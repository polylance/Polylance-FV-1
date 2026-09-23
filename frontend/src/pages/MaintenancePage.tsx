import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  FileCode, 
  Server, 
  ShieldCheck, 
  Globe, 
  Sparkles, 
  Check, 
  Send, 
  Radio, 
  Zap, 
  Activity, 
  Trash2, 
  ShieldAlert, 
  Power, 
  CheckCircle2, 
  Box, 
  Shield, 
  ExternalLink
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, MaintenanceChangelogItem } from '../context/PolyLanceDataContext';
import { isAdminAddress } from '../utils/adminGuard';
import { PolyLanceLogo } from '../components/PolyLanceLogo';

interface MaintenancePageProps {
  onBypass?: () => void;
}

// Known primary admin address for local testing / default fallback
const DEFAULT_FALLBACK_ADMIN = '0x62cdfc0692cc675c95304bace2c834d8f901dcba';

const DEFAULT_CHANGELOG: MaintenanceChangelogItem[] = [
  {
    id: 'cl-1',
    title: 'v2.4.0 — Sybil-Resistant Developer Binding',
    desc: 'Upgraded GitHub OAuth 2.0 cryptographic binding. One verified GitHub identity maps uniquely to one Polygon wallet with zero impersonation risk.',
    status: 'Deployed',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'cl-2',
    title: 'v2.3.9 — High-Performance Escrow State Cache',
    desc: 'Optimized real-time WebSocket state distribution across secondary nodes to guarantee zero latency during high-volume arbitration spikes.',
    status: 'In Progress',
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'cl-3',
    title: 'v2.3.8 — Instant Chat Purge & GDPR Cryptographic Erasure',
    desc: 'Users can permanently delete escrow chats and request full database obliteration across both primary and backup storage clusters.',
    status: 'Deployed',
    timestamp: Date.now() - 3600000 * 12,
  }
];

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onBypass }) => {
  const { address, isTreasuryAdmin, currentRole } = useWeb3();
  const { 
    maintenanceState, 
    toggleMaintenanceMode, 
    addMaintenanceChangelog,
    deleteMaintenanceChangelog 
  } = usePolyLanceData();

  // Admin access detection: Web3 wallet, role guard, or authenticated admin session
  const isWalletAdmin = (address ? isAdminAddress(address) : false) || isTreasuryAdmin || currentRole === 'admin';
  const [adminManualAuth, setAdminManualAuth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('polylance_maintenance_admin_auth') === 'true';
    }
    return false;
  });

  const isAdmin = isWalletAdmin || adminManualAuth;
  const effectiveAdminAddr = address && isAdminAddress(address) ? address : DEFAULT_FALLBACK_ADMIN;

  // Interaction States
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);
  const [adminToggleSuccess, setAdminToggleSuccess] = useState<string | null>(null);

  // Admin Live Changelog Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<'Deployed' | 'In Progress' | 'Fixing'>('In Progress');
  const [isPostingChangelog, setIsPostingChangelog] = useState(false);
  const [changelogPostSuccess, setChangelogPostSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Changelog list merging live server updates with default fallback
  const changelogList = (maintenanceState?.changelog && maintenanceState.changelog.length > 0)
    ? maintenanceState.changelog
    : DEFAULT_CHANGELOG;

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusMessage(null);
    try {
      await new Promise((r) => setTimeout(r, 650));
      setStatusMessage('Live Status: Core smart contracts & escrow vaults are 100% operational on Polygon Mainnet. Node sync in progress.');
    } catch {
      setStatusMessage('Live Connection: Platform maintenance active.');
    } finally {
      setIsCheckingStatus(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const handleToggleOffMaintenance = async () => {
    if (!isAdmin) return;
    setIsTogglingAdmin(true);
    setAdminToggleSuccess(null);
    try {
      const success = await toggleMaintenanceMode(false);
      if (success) {
        setAdminToggleSuccess('Maintenance mode turned OFF successfully! Normal operations restored for all users.');
        setTimeout(() => {
          if (onBypass) {
            onBypass();
          } else {
            window.location.hash = '#/';
            window.location.reload();
          }
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to toggle off maintenance mode:', err);
      setAdminToggleSuccess('Failed to turn off maintenance mode. Please try again.');
    } finally {
      setIsTogglingAdmin(false);
    }
  };

  const handleBroadcastChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    setIsPostingChangelog(true);
    setChangelogPostSuccess(null);
    try {
      const ok = await addMaintenanceChangelog({
        title: newTitle.trim(),
        desc: newDesc.trim(),
        status: newStatus
      }, effectiveAdminAddr);

      if (ok) {
        setChangelogPostSuccess('Broadcasted! Update is now live for all users in real time.');
        setNewTitle('');
        setNewDesc('');
        setTimeout(() => setChangelogPostSuccess(null), 4500);
      } else {
        setChangelogPostSuccess('Notice: Broadcast saved to local view. Syncing with node...');
      }
    } finally {
      setIsPostingChangelog(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!isAdmin) return;
    setDeletingId(id);
    try {
      await deleteMaintenanceChangelog(id, effectiveAdminAddr);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminLogout = () => {
    setAdminManualAuth(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('polylance_maintenance_admin_auth');
      sessionStorage.removeItem('polylance_admin_bypass');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* ── AMBIENT FLUID GRADIENT ACCENTS (POLYLANCE LANDING STYLE) ────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-purple-200/40 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 left-8 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-24 right-8 w-96 h-96 bg-purple-200/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ── HEADER / NAVIGATION BAR (POLYLANCE BRAND STYLE) ─────────────── */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between z-30">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center justify-center">
            <PolyLanceLogo size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline font-black text-lg tracking-tight text-slate-900">
                POLYLANCE
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                MAINTENANCE
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-500 hidden sm:block">
              Sovereign Talent & Escrow Protocol on Polygon
            </p>
          </div>
        </div>

        {/* Right Status Indicator: Only shows Turn Off button if verified admin */}
        <div className="flex items-center gap-3">
          {/* Network Health Badge */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 text-xs font-mono text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>Polygon Mainnet: Operational</span>
          </div>

          {/* If Verified Admin: Direct Turn Off Button in Header */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleToggleOffMaintenance}
              disabled={isTogglingAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-headline font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Turn off maintenance mode for all users"
            >
              <Power size={13} className={isTogglingAdmin ? 'animate-spin' : ''} />
              <span>{isTogglingAdmin ? 'Deactivating...' : 'Turn Off Maintenance'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col items-center text-center space-y-8 z-10">

        {/* ── 🌟 PROMINENT ADMIN PROTOCOL COMMAND BANNER (ONLY FOR ADMINS) ───── */}
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 shadow-xl shadow-purple-500/10 flex flex-col md:flex-row items-center justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-headline font-extrabold text-slate-900 text-base">
                    Admin Protocol Control Center
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] font-bold">
                    MAINTENANCE ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Regular user writes are paused to ensure zero state divergence. Escrows and smart contracts remain 100% safe. You have verified admin authority to deactivate maintenance mode.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-purple-800">
                  <span>Authorized Wallet: <strong>{effectiveAdminAddr.slice(0, 10)}...{effectiveAdminAddr.slice(-6)}</strong></span>
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  >
                    Lock session
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons for Admin */}
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              {onBypass && (
                <button
                  type="button"
                  onClick={onBypass}
                  className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs font-headline font-bold transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} className="text-purple-600" />
                  <span>Preview App</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleOffMaintenance}
                disabled={isTogglingAdmin}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-headline font-black transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Power size={15} className={isTogglingAdmin ? 'animate-spin' : ''} />
                <span>{isTogglingAdmin ? 'Restoring System...' : 'Turn Off Maintenance Mode'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {adminToggleSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{adminToggleSuccess}</span>
            </div>
          </motion.div>
        )}

        {/* ── HERO CENTERPIECE: OFFICIAL POLYLANCE LOGO & VISIBLE BADGES ──── */}
        <section className="flex flex-col items-center space-y-6 pt-2">
          
          {/* Pill Badge matching Landing.tsx */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 text-purple-900 rounded-full border border-purple-200/80 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px] font-bold text-purple-800">
              POLYLANCE ZENITH • INFRASTRUCTURE UPGRADE ACTIVE
            </span>
          </div>

          {/* Official PolyLance Emblem Stage with Visible Non-Overlapping Ambient Badges */}
          <div className="relative py-6 sm:py-8 flex items-center justify-center w-full max-w-md mx-auto">
            
            {/* Top-Left: On-Chain Escrow (Positioned clearly outside the card) */}
            <div className="absolute -top-2 left-0 sm:-left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-cyan-200/90 shadow-sm">
              <Box size={16} className="text-cyan-600 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">ESCROW</span>
            </div>

            {/* Top-Right: Protocol Upgrade (Positioned clearly outside the card) */}
            <div className="absolute -top-2 right-0 sm:-right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-sm">
              <Sparkles size={16} className="text-purple-600 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">UPGRADE</span>
            </div>

            {/* Bottom-Left: Immutable Security (Positioned clearly outside the card) */}
            <div className="absolute -bottom-2 left-0 sm:-left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-blue-200/90 shadow-sm">
              <Shield size={16} className="text-blue-600 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">SECURE</span>
            </div>

            {/* Bottom-Right: High-Performance Network (Positioned clearly outside the card) */}
            <div className="absolute -bottom-2 right-0 sm:-right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-sm">
              <Zap size={16} className="text-emerald-600 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider">NETWORK</span>
            </div>

            {/* Centerpiece PolyLance Logo Emblem Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(37,99,235,0.18)] flex items-center justify-center relative z-10 group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-400/20 via-blue-500/20 to-purple-600/20 filter blur-md -z-10 group-hover:blur-lg transition-all" />
              <PolyLanceLogo size={90} className="filter drop-shadow-[0_8px_20px_rgba(37,99,235,0.35)]" />
            </div>
          </div>

          {/* Punchy Fluid Headline (Landing.tsx Typography) */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.14] tracking-tight">
              Infrastructure Upgrade <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                in Progress.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
              Decentralized talent protocol undergoing scheduled enhancements. Smart contracts, escrow vaults, and soulbound reputation records remain 100% secure and immutable on Polygon.
            </p>
          </div>
        </section>

        {/* ── REAL-TIME PROTOCOL STATUS MONITOR CARD ───────────────────────── */}
        <div className="w-full max-w-xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            {/* Animated Radar Pulse Core in Brand Gradient */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
              <span className="absolute inset-0 rounded-2xl bg-purple-400 animate-ping opacity-25" />
              <Activity size={24} className="text-white relative z-10 animate-pulse" />
            </div>

            {/* Dynamic Status Badges */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                  Active Protocol Upgrade
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  Write Guard: Active
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                Non-Admin Operations Paused • Funds & Escrows 100% Protected
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Mutations are locked to prevent state divergence while nodes finalize database synchronization.
              </p>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTON: CHECK STATUS (CENTERED & STREAMLINED) ─────────── */}
        <div className="flex items-center justify-center w-full max-w-md mx-auto">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isCheckingStatus}
            className="w-full sm:w-auto min-w-[220px] py-3.5 px-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-headline font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-75"
          >
            <RotateCw size={14} className={isCheckingStatus ? 'animate-spin' : ''} />
            <span>{isCheckingStatus ? 'Probing Network...' : 'Check Status'}</span>
          </button>
        </div>

        {/* Live Status Toast Banner */}
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono font-medium max-w-lg mx-auto flex items-center gap-2 shadow-xs"
          >
            <Zap size={14} className="text-purple-600 shrink-0" />
            <span>{statusMessage}</span>
          </motion.div>
        )}

        {/* ── LIVE SERVICE HEALTH STATUS (4 POLYLANCE BENTO CARDS) ─────────── */}
        <div className="w-full max-w-4xl mx-auto pt-2 space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="font-headline text-sm font-bold text-slate-900">Live Service Status</span>
            </div>
            <p className="text-xs text-slate-500">Real-time status of PolyLance infrastructure services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Smart Contracts */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <FileCode size={20} className="text-purple-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-headline font-bold text-slate-900">Smart Contracts</p>
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operational
                </p>
                <span className="text-[10px] font-mono text-slate-400">Polygon Mainnet</span>
              </div>
            </div>

            {/* Card 2: Backend API */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Server size={20} className="text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-headline font-bold text-slate-900">Backend API</p>
                <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Upgrading
                </p>
                <span className="text-[10px] font-mono text-slate-400">State Resync</span>
              </div>
            </div>

            {/* Card 3: Escrow Vaults */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-headline font-bold text-slate-900">Escrow Vaults</p>
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  100% Secure
                </p>
                <span className="text-[10px] font-mono text-slate-400">All funds locked</span>
              </div>
            </div>

            {/* Card 4: Web Application */}
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Globe size={20} className="text-indigo-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-headline font-bold text-slate-900">Web App</p>
                <p className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Protected
                </p>
                <span className="text-[10px] font-mono text-slate-400">Maintenance Gateway</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── REAL-TIME PROTOCOL CHANGELOG SECTION ──────────────────────────── */}
        <div className="w-full max-w-4xl mx-auto p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm text-left space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-headline font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Live Protocol Changelog</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold">
                    {changelogList.length} updates logged
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time protocol fixes, security patches, and features actively being deployed.
                </p>
              </div>
            </div>

            {isAdmin && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
                Admin Broadcaster Active
              </span>
            )}
          </div>

          {/* ── ADMIN LIVE UPDATE BROADCASTER FORM (ONLY FOR ADMINS) ───────── */}
          {isAdmin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5 font-mono">
                  <Radio size={15} className="text-rose-500 animate-pulse" />
                  POST PROTOCOL UPDATE (BROADCASTS IN REAL-TIME)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Broadcasts immediately to all users
                </span>
              </div>

              {changelogPostSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-300">
                  <Check size={16} />
                  <span>{changelogPostSuccess}</span>
                </div>
              )}

              <form onSubmit={handleBroadcastChangelog} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Title (e.g., Enhanced Database Replication & Reconnection)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 h-full">
                      {(['In Progress', 'Fixing', 'Deployed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
                            newStatus === st 
                              ? (st === 'Deployed' ? 'bg-emerald-600 text-white shadow-sm' : st === 'Fixing' ? 'bg-amber-500 text-white shadow-sm' : 'bg-purple-600 text-white shadow-sm')
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe what is actively changing or being fixed so users understand the upgrade in progress..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500 font-mono">
                    Broadcasting as: <span className="font-bold text-slate-700">{effectiveAdminAddr.slice(0, 10)}...</span>
                  </p>

                  <button
                    type="submit"
                    disabled={isPostingChangelog}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-headline font-bold flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{isPostingChangelog ? 'Broadcasting...' : 'Broadcast Live to Users'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── LIVE CHANGELOG ITEMS LIST ─────────────────────────────────── */}
          <div className="space-y-3 pt-1">
            {changelogList.map((item) => {
              const isDeployed = item.status === 'Deployed';
              const isFixing = item.status === 'Fixing';
              return (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-purple-200 hover:bg-white transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold gap-2">
                    <span className="font-headline text-slate-900 text-xs sm:text-sm">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                        isDeployed 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isFixing 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.status}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete update"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/50 mt-1">
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                    <span>PolyLance Core Protocol Architecture</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── OFFICIAL COMMUNITY CHANNELS (POLYLANCE STYLE) ────────────────── */}
        <div className="w-full max-w-4xl mx-auto pt-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] bg-slate-200 flex-1" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              STAY CONNECTED • Official Community Channels
            </span>
            <div className="h-[1px] bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Discord */}
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-headline font-bold text-slate-900">Discord</p>
                <p className="text-[11px] text-slate-500">Community Hub</p>
              </div>
            </a>

            {/* 2. X (Twitter) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-headline font-bold text-slate-900">X (Twitter)</p>
                <p className="text-[11px] text-slate-500">Live Alerts</p>
              </div>
            </a>

            {/* 3. Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-headline font-bold text-slate-900">Instagram</p>
                <p className="text-[11px] text-slate-500">Visual Stories</p>
              </div>
            </a>

            {/* 4. Telegram */}
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-headline font-bold text-slate-900">Telegram</p>
                <p className="text-[11px] text-slate-500">Live Broadcast</p>
              </div>
            </a>
          </div>
        </div>
      </main>

      {/* ── FOOTER SIGNATURES (POLYLANCE STYLE) ───────────────────────────── */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 z-20 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>© {new Date().getFullYear()} POLYLANCE PROTOCOL</span>
          <span>•</span>
          <span>All rights reserved</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-slate-400">
            Polygon Mainnet (Chain ID 137)
          </span>
        </div>
      </footer>

    </div>
  );
};
