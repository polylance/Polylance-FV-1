import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { PolyLanceLogo } from './PolyLanceLogo';
import { LoginModal } from './LoginModal';
import { WalletBalanceModal } from './WalletBalanceModal';
import {
  Briefcase,
  PlusCircle,
  LayoutDashboard,
  Scale,
  BarChart3,
  User,
  Users,
  LogIn,
  Shield,
  ShieldCheck,
  ChevronDown,
  MessageSquare,
  Menu,
  X,
  Landmark,
  Trophy,
  Settings,
  Grid,
  Power,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { truncateAddress, formatPolBalance } from '../utils/formatters';
import { dropdownVariants, transition } from '../lib/motion';
import { Drawer } from './mobile/Drawer';
import { Accordion } from './mobile/Accordion';


// ──────────────────────────────────────────────────────────────────────────────
// Relatable Section Color Accent Palette
// ──────────────────────────────────────────────────────────────────────────────
export type NavAccent =
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'cyan'
  | 'sky'
  | 'amber'
  | 'orange'
  | 'purple'
  | 'rose';

const ACCENT_MAP: Record<NavAccent, {
  activeText: string;
  hover: string;
  pillBg: string;
  pillBorder: string;
  pillShadow: string;
}> = {
  indigo: {
    activeText: 'text-indigo-700 font-bold',
    hover: 'hover:text-indigo-600 hover:bg-indigo-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-indigo-50/80',
    pillBorder: 'border-indigo-300/80 ring-1 ring-indigo-400/25',
    pillShadow: '0 3px 12px rgba(99, 102, 241, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(99, 102, 241, 0.08)',
  },
  blue: {
    activeText: 'text-blue-700 font-bold',
    hover: 'hover:text-blue-600 hover:bg-blue-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-blue-50/80',
    pillBorder: 'border-blue-300/80 ring-1 ring-blue-400/25',
    pillShadow: '0 3px 12px rgba(59, 130, 246, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(59, 130, 246, 0.08)',
  },
  emerald: {
    activeText: 'text-emerald-800 font-bold',
    hover: 'hover:text-emerald-700 hover:bg-emerald-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-emerald-50/80',
    pillBorder: 'border-emerald-300/80 ring-1 ring-emerald-400/25',
    pillShadow: '0 3px 12px rgba(16, 185, 129, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(16, 185, 129, 0.08)',
  },
  cyan: {
    activeText: 'text-cyan-800 font-bold',
    hover: 'hover:text-cyan-700 hover:bg-cyan-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-cyan-50/80',
    pillBorder: 'border-cyan-300/80 ring-1 ring-cyan-400/25',
    pillShadow: '0 3px 12px rgba(6, 182, 212, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(6, 182, 212, 0.08)',
  },
  sky: {
    activeText: 'text-sky-800 font-bold',
    hover: 'hover:text-sky-700 hover:bg-sky-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-sky-50/80',
    pillBorder: 'border-sky-300/80 ring-1 ring-sky-400/25',
    pillShadow: '0 3px 12px rgba(14, 165, 233, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(14, 165, 233, 0.08)',
  },
  amber: {
    activeText: 'text-amber-900 font-bold',
    hover: 'hover:text-amber-800 hover:bg-amber-50/60',
    pillBg: 'bg-gradient-to-b from-amber-100/90 via-amber-50/80 to-amber-100/70',
    pillBorder: 'border-amber-300/80 ring-1 ring-amber-400/25',
    pillShadow: '0 3px 12px rgba(245, 158, 11, 0.18), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(217, 119, 6, 0.08)',
  },
  orange: {
    activeText: 'text-orange-800 font-bold',
    hover: 'hover:text-orange-700 hover:bg-orange-50/60',
    pillBg: 'bg-gradient-to-b from-orange-100/90 via-orange-50/80 to-orange-100/70',
    pillBorder: 'border-orange-300/80 ring-1 ring-orange-400/25',
    pillShadow: '0 3px 12px rgba(249, 115, 22, 0.18), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(249, 115, 22, 0.08)',
  },
  purple: {
    activeText: 'text-purple-700 font-bold',
    hover: 'hover:text-purple-600 hover:bg-purple-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-purple-50/70',
    pillBorder: 'border-purple-300/80 ring-1 ring-purple-500/25',
    pillShadow: '0 3px 12px rgba(147, 51, 234, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(147, 51, 234, 0.08)',
  },
  rose: {
    activeText: 'text-rose-700 font-bold',
    hover: 'hover:text-rose-600 hover:bg-rose-50/60',
    pillBg: 'bg-gradient-to-b from-white/95 via-white/80 to-rose-50/80',
    pillBorder: 'border-rose-300/80 ring-1 ring-rose-400/25',
    pillShadow: '0 3px 12px rgba(244, 63, 94, 0.15), inset 0 1px 1px #fff, inset 0 -1px 2px rgba(244, 63, 94, 0.08)',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Nav Link with layoutId sliding pill & section color theme
// ──────────────────────────────────────────────────────────────────────────────
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
  accent?: NavAccent;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children, accent = 'purple' }) => {
  const conf = ACCENT_MAP[accent];

  return (
    <Link
      to={to}
      className={`
        relative px-3 sm:px-3.5 py-1.5 rounded-full text-[13px] sm:text-[13.5px] font-semibold
        flex items-center gap-1.5 select-none z-10 whitespace-nowrap
        transition-colors duration-200
        nav-pill-item
        ${active ? conf.activeText : `text-slate-600 ${conf.hover}`}
      `}
    >
      {/* Apple Liquid Glass Sliding active background with relatable section color */}
      {active && (
        <motion.span
          layoutId="activeNavAppleGlass"
          className={`absolute inset-0 rounded-full border ${conf.pillBg} ${conf.pillBorder}`}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: conf.pillShadow,
          }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 30,
            mass: 0.8,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5 transition-transform duration-150 active:scale-95">
        {children}
      </span>
    </Link>
  );
};

interface DropdownLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: 'cyan' | 'amber' | 'orange' | 'blue' | 'purple' | 'emerald' | 'slate';
}

const DropdownLink: React.FC<DropdownLinkProps> = ({ to, icon, label, onClick, accent = 'purple' }) => {
  const hoverStyles = {
    cyan: 'hover:bg-cyan-50/90 hover:text-cyan-800 text-slate-700',
    amber: 'hover:bg-amber-50/90 hover:text-amber-800 text-slate-700',
    orange: 'hover:bg-orange-50/90 hover:text-orange-800 text-slate-700',
    blue: 'hover:bg-blue-50/90 hover:text-blue-700 text-slate-700',
    purple: 'hover:bg-purple-50/90 hover:text-purple-700 text-slate-700',
    emerald: 'hover:bg-emerald-50/90 hover:text-emerald-800 text-slate-700',
    slate: 'hover:bg-slate-100 hover:text-slate-900 text-slate-700',
  }[accent];

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-150 group ${hoverStyles}`}
    >
      <span className="text-slate-400 transition-colors group-hover:text-current">{icon}</span>
      {label}
    </Link>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Navbar
// ──────────────────────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const { 
    isConnected, 
    address, 
    currentRole, 
    disconnectWallet, 
    balanceNative, 
    balanceUsdc,
    balanceUsdt,
    isWrongNetwork,
    targetChainName,
    targetChainId,
    switchToTargetNetwork
  } = useWeb3();
  const { jobs } = usePolyLanceData();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  const moreRef = useRef<HTMLDivElement>(null);

  const userAddr = (address || '').toLowerCase();
  const hasActiveJobs = jobs.some(
    (j) =>
      (j.client.toLowerCase() === userAddr || j.freelancer?.toLowerCase() === userAddr) &&
      (j.status === 'Selected' || j.status === 'Funded' || j.status === 'Submitted' || j.status === 'Open')
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      // Directional scroll for mobile screens only (below lg: 1024px)
      if (window.innerWidth < 1024) {
        if (currentY > 80 && currentY > lastScrollYRef.current + 10) {
          setIsHeaderHidden(true); // scrolling down -> hide
        } else if (currentY < lastScrollYRef.current - 10) {
          setIsHeaderHidden(false); // scrolling up -> reveal
        }
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollYRef.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileOpen(false); setIsMoreOpen(false); }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const isVisitor = !isConnected || currentRole === 'visitor';

  const isAuditPage = location.pathname.startsWith('/audit') || location.pathname.includes('attestation');

  if (isAuditPage) {
    return (
      <header
        className="sticky top-0 z-50 w-full py-2.5 border-b border-slate-200/60 shadow-xs no-print transition-all duration-300"
        style={{
          background: 'rgba(246, 249, 252, 0.82)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        }}
      >
        <div className="max-w-[1480px] mx-auto flex items-center justify-between px-6 sm:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md group-hover:bg-purple-500/35 transition-all duration-300" />
              <PolyLanceLogo size={32} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[20px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-purple-600">Lance</span>
              </span>
              <span className="text-[7px] font-mono text-purple-700/80 font-bold tracking-[0.16em] uppercase mt-0.5 leading-none select-none">
                mvp on-chain
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 text-xs font-mono font-bold shadow-2xs">
            <ShieldCheck size={13} className="text-purple-600" />
            <span>{location.pathname.includes('attestation') ? 'OFFICIAL JOB SBT ATTESTATION' : 'OFFICIAL AUDIT REPORT'}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── Wrong Network Alert Banner (MetaMask Network Guard) ────────────────────── */}
      {isWrongNetwork && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-sm no-print relative z-50">
          <div className="flex items-center gap-2 max-w-5xl">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>
              <strong>Wrong Network Detected:</strong> Your wallet is connected to an unsupported chain. Please switch to <strong>{targetChainName}</strong> (Chain ID: {targetChainId}) to interact with PolyLance smart contracts and real payments.
            </span>
          </div>
          <button
            type="button"
            onClick={switchToTargetNetwork}
            className="px-3.5 py-1 bg-white text-orange-800 hover:bg-orange-50 font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer shrink-0 ml-3 flex items-center gap-1.5"
          >
            <AlertTriangle size={13} className="text-orange-600" />
            <span>Switch to {targetChainName}</span>
          </button>
        </div>
      )}

      {/* ── Scroll-aware Liquid Glass Header with Full Backdrop Blur (iOS 26 Frosted Glass) ───────── */}
      <header
        className={`sticky top-0 z-50 w-full py-2 border-b border-slate-200/50 transition-transform duration-300 no-print pt-safe ${
          isHeaderHidden ? '-translate-y-full lg:translate-y-0' : 'translate-y-0'
        }`}
        style={{
          background: scrolled ? 'rgba(246, 249, 252, 0.85)' : 'rgba(246, 249, 252, 0.94)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          boxShadow: scrolled ? '0 4px 20px rgba(15, 23, 42, 0.04)' : 'none',
        }}
      >
        <motion.nav
          animate={{
            scale: scrolled ? 0.995 : 1,
            boxShadow: scrolled
              ? '0 12px 36px rgba(124,58,237,0.10), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 2px rgba(124,58,237,0.04)'
              : '0 4px 20px rgba(15,23,42,0.04), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 2px rgba(0,0,0,0.02)',
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[1800px] mx-auto
            flex items-center justify-between
            px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 rounded-[24px] bg-white/80 border border-white/80 shadow-sm"
          style={{
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          }}
        >
        {/* ── LEFT: Brand (Positioned at Left Side Corner) ─────────────────────────────── */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-purple-400/20 blur-md group-hover:bg-purple-400/30 transition-all duration-300" />
              <PolyLanceLogo size={29} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[17px] sm:text-[20px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-purple-600">Lance</span>
              </span>
              <span className="text-[6px] sm:text-[6.5px] font-mono text-slate-400/70 font-bold tracking-[0.15em] uppercase mt-0.5 leading-none select-none">
                mvp on-chain
              </span>
            </div>
          </Link>
        </div>

        {/* ── CENTER: Navigation Pill (Apple Glass Container with Relatable Section Colors) ─── */}
        <div className="hidden md:flex items-center gap-0.5 font-sans">
          <div
            className="flex items-center gap-0.5 rounded-full px-1 py-0.5 border border-black/5"
            style={{
              background: 'rgba(255,255,255,0.65)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02), 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* VISITOR LINKS */}
            {isVisitor && (
              <>
                <NavLink to="/" active={isActive('/') && location.pathname === '/'} accent="indigo">
                  <Shield size={13} className={isActive('/') && location.pathname === '/' ? 'text-indigo-600' : 'text-slate-400'} />
                  Overview
                </NavLink>
                <NavLink to="/jobs" active={isActive('/jobs')} accent="sky">
                  <Briefcase size={13} className={isActive('/jobs') ? 'text-sky-600' : 'text-slate-400'} />
                  Find Jobs
                </NavLink>
                <NavLink to="/reputation" active={isActive('/reputation')} accent="amber">
                  <Trophy size={13} className={isActive('/reputation') ? 'text-amber-500' : 'text-slate-400'} />
                  SBT Leaderboard
                </NavLink>
                <NavLink to="/dao" active={isActive('/dao')} accent="purple">
                  <Users size={13} className={isActive('/dao') ? 'text-purple-600' : 'text-slate-400'} />
                  DAO
                </NavLink>
              </>
            )}

            {/* CONNECTED ROLE LINKS */}
            {!isVisitor && (
              <>
                {/* 1. Dashboard (Blue) */}
                <NavLink to="/dashboard" active={isActive('/dashboard')} accent="blue">
                  <LayoutDashboard size={13} className={isActive('/dashboard') ? 'text-blue-600' : 'text-slate-400'} />
                  Dashboard
                </NavLink>

                {/* 2. Job Workspace (Green / Emerald) */}
                <NavLink to="/workspace" active={isActive('/workspace')} accent="emerald">
                  <Briefcase size={13} className={isActive('/workspace') ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>Job Workspace</span>
                  {hasActiveJobs && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                </NavLink>

                {/* 3. Post Job (Cyan - For Clients and Admins directly in main top bar) */}
                {(currentRole === 'client' || currentRole === 'admin') && (
                  <NavLink to="/jobs/post" active={isActive('/jobs/post')} accent="cyan">
                    <PlusCircle size={13} className={isActive('/jobs/post') ? 'text-cyan-600' : 'text-slate-400'} />
                    Post Job
                  </NavLink>
                )}

                {/* 4. Find Jobs (Sky Blue) */}
                <NavLink to="/jobs" active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')} accent="sky">
                  <Briefcase size={13} className={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace') ? 'text-sky-600' : 'text-slate-400'} />
                  Find Jobs
                </NavLink>

                {/* 5. SBT Leaderboard (Amber / Gold - For regular clients/freelancers in top bar) */}
                {(currentRole !== 'admin' && currentRole !== 'judge') && (
                  <NavLink to="/reputation" active={isActive('/reputation')} accent="amber">
                    <Trophy size={13} className={isActive('/reputation') ? 'text-amber-500' : 'text-slate-400'} />
                    SBT Leaderboard
                  </NavLink>
                )}

                {/* 6. Judge Panel (Orange / Amber - For Judge role) */}
                {currentRole === 'judge' && (
                  <NavLink to="/judge" active={isActive('/judge')} accent="orange">
                    <Scale size={13} className={isActive('/judge') ? 'text-orange-500' : 'text-slate-400'} />
                    Judge Panel
                  </NavLink>
                )}

                {/* 7. Treasury (Emerald Green - For Admin role) */}
                {currentRole === 'admin' && (
                  <NavLink to="/treasury" active={isActive('/treasury')} accent="emerald">
                    <Landmark size={13} className={isActive('/treasury') ? 'text-emerald-600' : 'text-slate-400'} />
                    Treasury
                  </NavLink>
                )}

                {/* 8. DAO (Purple) */}
                <NavLink to="/dao" active={isActive('/dao')} accent="purple">
                  <Users size={13} className={isActive('/dao') ? 'text-purple-600' : 'text-slate-400'} />
                  DAO
                </NavLink>

                {/* 9. Messages (Rose / Pink) */}
                <NavLink to="/chat" active={isActive('/chat')} accent="rose">
                  <MessageSquare size={13} className={isActive('/chat') ? 'text-rose-600' : 'text-slate-400'} />
                  Messages
                </NavLink>

                {/* 10. More dropdown */}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`
                      px-3 sm:px-3.5 py-1.5 rounded-full text-[13px] sm:text-[13.5px] font-semibold
                      flex items-center gap-1 cursor-pointer select-none
                      nav-pill-item transition-all duration-150
                      ${isMoreOpen ? 'text-purple-700 font-bold bg-white/70' : 'text-slate-600 hover:text-slate-900'}
                    `}
                    style={isMoreOpen ? {
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 3px rgba(124,58,237,0.08)',
                    } : {}}
                  >
                    <Grid size={13} className={isMoreOpen ? 'text-purple-600' : 'text-slate-400'} />
                    More
                    <motion.span
                      animate={{ rotate: isMoreOpen ? 180 : 0 }}
                      transition={transition.fast}
                    >
                      <ChevronDown size={11} />
                    </motion.span>
                  </button>

                  {/* Solid Opaque High-Z Dropdown */}
                  <AnimatePresence>
                    {isMoreOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full right-0 mt-2.5 w-52 rounded-2xl p-1.5 space-y-0.5 z-[100] bg-white border border-slate-200 shadow-2xl overflow-hidden"
                        style={{
                          boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        {/* Admin shortcuts in dropdown */}
                        {currentRole === 'admin' && (
                          <>
                            <DropdownLink to="/reputation" icon={<Trophy size={13.5} />} label="SBT Leaderboard" onClick={() => setIsMoreOpen(false)} accent="amber" />
                            <DropdownLink to="/judge" icon={<Scale size={13.5} />} label="Judge Panel" onClick={() => setIsMoreOpen(false)} accent="orange" />
                            <div className="border-t border-slate-100 my-0.5" />
                          </>
                        )}
                        {currentRole === 'judge' && (
                          <>
                            <DropdownLink to="/reputation" icon={<Trophy size={13.5} />} label="SBT Leaderboard" onClick={() => setIsMoreOpen(false)} accent="amber" />
                            <div className="border-t border-slate-100 my-0.5" />
                          </>
                        )}
                        {currentRole !== 'admin' && currentRole !== 'judge' && (
                          <>
                            {(currentRole === 'client' || currentRole === 'freelancer') && (
                              <DropdownLink to="/judge" icon={<Scale size={13.5} />} label="Judge Panel" onClick={() => setIsMoreOpen(false)} accent="orange" />
                            )}
                            <div className="border-t border-slate-100 my-0.5" />
                          </>
                        )}
                        <DropdownLink to={`/profile/${address}`} icon={<User size={13.5} />} label="Profile" onClick={() => setIsMoreOpen(false)} accent="blue" />
                        <DropdownLink to={`/audit/${address}`} icon={<BarChart3 size={13.5} />} label="Audit Report" onClick={() => setIsMoreOpen(false)} accent="purple" />
                        <DropdownLink to="/settings" icon={<Settings size={13.5} />} label="Settings" onClick={() => setIsMoreOpen(false)} accent="slate" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Wallet + Mobile Toggle ──────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isConnected && address ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Network Warning Pill if wrong network */}
              {isWrongNetwork ? (
                <button
                  type="button"
                  onClick={switchToTargetNetwork}
                  title={`Click to switch wallet network to ${targetChainName}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 shadow-2xs transition-all cursor-pointer animate-pulse"
                >
                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-none">Switch to {targetChainName}</span>
                </button>
              ) : (
                /* Real-Time Live Wallet Money Pill (Clickable -> Full Balance Breakdown Modal) */
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(true)}
                  title="Click to view full wallet & all token balances (POL, USDC, USDT)"
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white/85 hover:bg-purple-50/80 border border-purple-200/80 hover:border-purple-300 text-purple-700 shadow-2xs transition-all cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="group-hover:text-purple-900">{formatPolBalance(balanceNative)} POL</span>
                </button>
              )}

              {/* User Account Profile Pill */}
              <Link
                to={`/profile/${address}`}
                title="View User Profile"
                className="
                  flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full
                  text-[11px] sm:text-[12.5px] font-semibold font-mono text-purple-700
                  hover:bg-purple-100/90 transition-all duration-200
                  apple-button shrink-0
                "
                style={{
                  background: 'rgba(246,240,255,0.85)',
                  border: '1px solid rgba(167,139,250,0.35)',
                  boxShadow: '0 1px 3px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-purple-500 flex items-center justify-center shrink-0 shadow-xs">
                  <User size={9} className="text-white" />
                </div>
                <span>{truncateAddress(address)}</span>
                <ChevronDown size={10} className="text-purple-400 hidden sm:inline" />
              </Link>

              {/* Redesigned Clean Disconnect Button (visible on sm+; on mobile, available in drawer) */}
              <motion.button
                type="button"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="
                  hidden sm:flex w-8 h-8 rounded-full items-center justify-center
                  bg-white/85 hover:bg-rose-50 text-slate-400 hover:text-rose-600
                  border border-slate-200/80 hover:border-rose-300
                  shadow-xs transition-all duration-200 cursor-pointer shrink-0
                "
              >
                <Power size={13} className="stroke-[2.2]" />
              </motion.button>
            </div>
          ) : (
            <Link
              to="/login"
              className="
                px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12.5px] font-bold text-white
                flex items-center gap-1.5 cursor-pointer shrink-0
                apple-button glass-highlight
                bg-gradient-to-r from-purple-600 to-purple-500
              "
              style={{
                boxShadow: '0 2px 6px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <LogIn size={12} />
              <span>Connect</span>
            </Link>
          )}

          {/* Mobile toggle button (compact on mobile, min 36x36px) */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label={isMobileOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={isMobileOpen}
            className="md:hidden w-8.5 h-8.5 sm:w-11 sm:h-11 min-w-[34px] sm:min-w-[44px] rounded-full flex items-center justify-center text-slate-700 hover:text-purple-700 bg-white/85 active:bg-slate-100 border border-slate-200/80 shadow-xs transition-colors cursor-pointer select-none shrink-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileOpen ? (
                <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={transition.micro}>
                  <X size={18} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={transition.micro}>
                  <Menu size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ── PHASE 3 ACCESSIBLE FULL-HEIGHT MOBILE DRAWER ────────────────────── */}
        <Drawer
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <PolyLanceLogo size={26} />
              <span className="font-bold text-slate-900 text-lg">Navigation</span>
            </div>
          }
          side="right"
          footer={
            isConnected && address ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/90 border border-purple-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                      <User size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-purple-900">{truncateAddress(address)}</div>
                      <div className="text-[11px] text-purple-600 capitalize font-medium">{currentRole} Account</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-900">{formatPolBalance(balanceNative)} POL</div>
                    <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Live
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnectWallet();
                    setIsMobileOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm hover:bg-rose-50 active:bg-rose-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Power size={15} />
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={16} />
                Connect Wallet
              </button>
            )
          }
        >
          {/* Main Primary Links */}
          <div className="space-y-1">
            <MobileLink to="/" icon={<Shield size={18} className="text-indigo-600" />} label="Overview" onClick={() => setIsMobileOpen(false)} accent="indigo" />
            <MobileLink to="/jobs" icon={<Briefcase size={18} className="text-sky-600" />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} accent="sky" />
            {!isVisitor && (
              <>
                <MobileLink to="/dashboard" icon={<LayoutDashboard size={18} className="text-blue-600" />} label="Dashboard" onClick={() => setIsMobileOpen(false)} accent="blue" />
                <MobileLink to="/workspace" icon={<Grid size={18} className="text-emerald-600" />} label="Job Workspace" onClick={() => setIsMobileOpen(false)} accent="emerald" />
                {(currentRole === 'client' || currentRole === 'admin') && (
                  <MobileLink to="/jobs/post" icon={<PlusCircle size={18} className="text-cyan-600" />} label="Post a Job" onClick={() => setIsMobileOpen(false)} accent="cyan" />
                )}
                <MobileLink to="/chat" icon={<MessageSquare size={18} className="text-rose-600" />} label="Messages & Negotiations" onClick={() => setIsMobileOpen(false)} accent="rose" />
              </>
            )}
          </div>

          {/* Sub-sections inside Accordion for clean mobile organization */}
          <div className="pt-2">
            <Accordion
              items={[
                {
                  title: 'Governance & Arbitration',
                  icon: <Scale size={18} />,
                  content: (
                    <div className="space-y-1 pt-1">
                      <MobileLink to="/dao" icon={<Users size={16} className="text-purple-600" />} label="DAO Proposals & Voting" onClick={() => setIsMobileOpen(false)} accent="purple" />
                      <MobileLink to="/judge" icon={<Scale size={16} className="text-orange-600" />} label="Judge Arbitration Bench" onClick={() => setIsMobileOpen(false)} accent="orange" />
                      {currentRole === 'admin' && (
                        <MobileLink to="/treasury" icon={<Landmark size={16} className="text-emerald-600" />} label="Protocol Treasury Multisig" onClick={() => setIsMobileOpen(false)} accent="emerald" />
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Reputation & Audits',
                  icon: <Trophy size={18} />,
                  content: (
                    <div className="space-y-1 pt-1">
                      <MobileLink to="/reputation" icon={<Trophy size={16} className="text-amber-500" />} label="SBT Leaderboard & Scores" onClick={() => setIsMobileOpen(false)} accent="amber" />
                      <MobileLink to="/audit" icon={<BarChart3 size={16} className="text-purple-600" />} label="Smart Contract Security Audit" onClick={() => setIsMobileOpen(false)} accent="purple" />
                      <MobileLink to="/attestation" icon={<ShieldCheck size={16} className="text-emerald-600" />} label="Soulbound Attestations" onClick={() => setIsMobileOpen(false)} accent="emerald" />
                    </div>
                  ),
                },
                {
                  title: 'Protocol & Legal',
                  icon: <Shield size={18} />,
                  content: (
                    <div className="space-y-1 pt-1">
                      <MobileLink to="/manifesto" icon={<User size={16} className="text-indigo-600" />} label="PolyLance Manifesto & Team" onClick={() => setIsMobileOpen(false)} accent="indigo" />
                      <MobileLink to="/security" icon={<Shield size={16} className="text-sky-600" />} label="Security Architecture" onClick={() => setIsMobileOpen(false)} accent="sky" />
                      <MobileLink to="/terms" icon={<Shield size={16} className="text-slate-500" />} label="Terms of Service" onClick={() => setIsMobileOpen(false)} accent="slate" />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Drawer>
      </motion.nav>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <WalletBalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} />
    </>
  );
};


// Helper for mobile nav items
interface MobileLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: 'indigo' | 'blue' | 'emerald' | 'cyan' | 'sky' | 'amber' | 'orange' | 'purple' | 'rose' | 'slate';
}

const MobileLink: React.FC<MobileLinkProps> = ({ to, icon, label, onClick, accent = 'purple' }) => {
  const accentClasses = {
    indigo: 'hover:bg-indigo-50/90 hover:text-indigo-800 text-slate-700',
    blue: 'hover:bg-blue-50/90 hover:text-blue-800 text-slate-700',
    emerald: 'hover:bg-emerald-50/90 hover:text-emerald-800 text-slate-700',
    cyan: 'hover:bg-cyan-50/90 hover:text-cyan-800 text-slate-700',
    sky: 'hover:bg-sky-50/90 hover:text-sky-800 text-slate-700',
    amber: 'hover:bg-amber-50/90 hover:text-amber-800 text-slate-700',
    orange: 'hover:bg-orange-50/90 hover:text-orange-800 text-slate-700',
    purple: 'hover:bg-purple-50/90 hover:text-purple-800 text-slate-700',
    rose: 'hover:bg-rose-50/90 hover:text-rose-800 text-slate-700',
    slate: 'hover:bg-slate-100 hover:text-slate-900 text-slate-700',
  }[accent];

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all group ${accentClasses}`}
    >
      <span className="text-slate-400 group-hover:text-current shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
};
