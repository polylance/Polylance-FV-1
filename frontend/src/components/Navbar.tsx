import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { PolyLanceLogo } from './PolyLanceLogo';
import { LoginModal } from './LoginModal';
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
  Power
} from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { dropdownVariants, transition } from '../lib/motion';

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
  const { isConnected, address, currentRole, disconnectWallet } = useWeb3();
  const { jobs } = usePolyLanceData();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
      {/* ── Scroll-aware Liquid Glass Header with Full Backdrop Blur (iOS 26 Frosted Glass) ───────── */}
      <header
        className="sticky top-0 z-50 w-full py-2 border-b border-slate-200/40 transition-all duration-300 no-print"
        style={{
          background: scrolled ? 'rgba(246, 249, 252, 0.76)' : 'rgba(246, 249, 252, 0.88)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          boxShadow: scrolled ? '0 4px 20px rgba(15, 23, 42, 0.04)' : 'none',
        }}
      >
        <motion.nav
          animate={{
            scale: scrolled ? 0.99 : 1,
            boxShadow: scrolled
              ? '0 12px 36px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 2px rgba(124,58,237,0.04)'
              : '0 4px 20px rgba(15,23,42,0.04), inset 0 1px 1px rgba(255,255,255,1), inset 0 -1px 2px rgba(0,0,0,0.02)',
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] max-w-[1480px] mx-auto
            flex items-center justify-between
            px-6 sm:px-8 py-2 rounded-[24px] bg-white/80 border border-white/80 shadow-sm"
          style={{
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          }}
        >
        {/* ── LEFT: Brand ─────────────────────────────────────────────── */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-purple-400/20 blur-md group-hover:bg-purple-400/30 transition-all duration-300" />
              <PolyLanceLogo size={32} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[20px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-purple-600">Lance</span>
              </span>
              <span className="text-[6.5px] font-mono text-slate-400/70 font-bold tracking-[0.15em] uppercase mt-0.5 leading-none select-none">
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

                {/* 3. Post Job (Cyan - For Clients directly in main top bar) */}
                {currentRole === 'client' && (
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

                  {/* Apple-glass dropdown */}
                  <AnimatePresence>
                    {isMoreOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={transition.fast}
                        className="absolute right-0 mt-2 w-48 rounded-2xl p-1 z-50"
                        style={{
                          background: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                          border: '1px solid rgba(255,255,255,0.8)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                      >
                        {/* Admin / Judge specific options in More dropdown */}
                        {(currentRole === 'admin' || currentRole === 'judge') && (
                          <>
                            <DropdownLink to="/jobs/post" icon={<PlusCircle size={13.5} />} label="Post Job" onClick={() => setIsMoreOpen(false)} accent="cyan" />
                            <DropdownLink to="/reputation" icon={<Trophy size={13.5} />} label="SBT Leaderboard" onClick={() => setIsMoreOpen(false)} accent="amber" />
                            {currentRole === 'admin' && (
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
        <div className="flex items-center gap-1.5 shrink-0">
          {isConnected && address ? (
            <div className="flex items-center gap-1.5">
              <Link
                to={`/profile/${address}`}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[12.5px] font-semibold font-mono text-purple-700
                  hover:bg-purple-100/80 transition-all duration-200
                  apple-button
                "
                style={{
                  background: 'rgba(246,240,255,0.85)',
                  border: '1px solid rgba(167,139,250,0.30)',
                  boxShadow: '0 1px 3px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                  <User size={9} className="text-white" />
                </div>
                <span>{truncateAddress(address)}</span>
                <ChevronDown size={10} className="text-purple-400" />
              </Link>

              <motion.button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  w-7 h-7 rounded-full flex items-center justify-center
                  text-slate-400 hover:text-rose-500
                  cursor-pointer transition-colors duration-200
                "
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <Power size={12} className="stroke-[2]" />
              </motion.button>
            </div>
          ) : (
            <Link
              to="/login"
              className="
                px-3.5 py-1.5 rounded-full text-[12.5px] font-bold text-white
                flex items-center gap-1.5 cursor-pointer
                apple-button glass-highlight
                bg-gradient-to-r from-purple-600 to-purple-500
              "
              style={{
                boxShadow: '0 2px 6px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <LogIn size={12} />
              Connect Wallet
            </Link>
          )}

          {/* Mobile toggle */}
          <motion.button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            whileTap={{ scale: 0.93 }}
            className="
              md:hidden p-1.5 rounded-full
              text-slate-500 hover:text-purple-700
              transition-colors duration-200 cursor-pointer
            "
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileOpen ? (
                <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={transition.micro}>
                  <X size={15} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={transition.micro}>
                  <Menu size={15} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── MOBILE DRAWER ─────────────────────────────────────────── */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6, scale: 0.99  }}
              transition={transition.medium}
              className="absolute top-full left-0 right-0 mt-2 mx-1
                rounded-3xl p-3 space-y-0.5 z-50 md:hidden"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.70)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              {isVisitor ? (
                <>
                  <MobileLink to="/" icon={<Shield size={14} className="text-indigo-500" />} label="Overview" onClick={() => setIsMobileOpen(false)} accent="indigo" />
                  <MobileLink to="/jobs" icon={<Briefcase size={14} className="text-sky-500" />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} accent="sky" />
                  <MobileLink to="/reputation" icon={<Trophy size={14} className="text-amber-500" />} label="SBT Leaderboard" onClick={() => setIsMobileOpen(false)} accent="amber" />
                  <MobileLink to="/dao" icon={<Users size={14} className="text-purple-500" />} label="DAO" onClick={() => setIsMobileOpen(false)} accent="purple" />
                  <div className="pt-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-2xl text-[13px] font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 transition-all"
                      style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
                    >
                      <LogIn size={14} /> Connect Wallet
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <MobileLink to="/dashboard" icon={<LayoutDashboard size={14} className="text-blue-500" />} label="Dashboard" onClick={() => setIsMobileOpen(false)} accent="blue" />
                  <MobileLink to="/workspace" icon={<Briefcase size={14} className="text-emerald-500" />} label="Job Workspace" onClick={() => setIsMobileOpen(false)} accent="emerald" />
                  {(currentRole === 'client' || currentRole === 'judge' || currentRole === 'admin') && (
                    <MobileLink to="/jobs/post" icon={<PlusCircle size={14} className="text-cyan-500" />} label="Post Job" onClick={() => setIsMobileOpen(false)} accent="cyan" />
                  )}
                  <MobileLink to="/jobs" icon={<Briefcase size={14} className="text-sky-500" />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} accent="sky" />

                  <MobileLink to="/reputation" icon={<Trophy size={14} className="text-amber-500" />} label="SBT Leaderboard" onClick={() => setIsMobileOpen(false)} accent="amber" />
                  {(currentRole === 'admin' || currentRole === 'judge') && (
                    <MobileLink to="/judge" icon={<Scale size={14} className="text-orange-500" />} label="Judge Panel" onClick={() => setIsMobileOpen(false)} accent="orange" />
                  )}
                  {currentRole === 'admin' && (
                    <MobileLink to="/treasury" icon={<Landmark size={14} className="text-emerald-600" />} label="Treasury" onClick={() => setIsMobileOpen(false)} accent="emerald" />
                  )}
                  <MobileLink to="/dao" icon={<Users size={14} className="text-purple-500" />} label="DAO" onClick={() => setIsMobileOpen(false)} accent="purple" />
                  <MobileLink to="/chat" icon={<MessageSquare size={14} className="text-rose-500" />} label="Messages" onClick={() => setIsMobileOpen(false)} accent="rose" />
                  <div className="border-t border-slate-100/80 pt-2 mt-1 space-y-0.5">
                    <MobileLink to={`/profile/${address}`} icon={<User size={14} className="text-blue-500" />} label="Profile" onClick={() => setIsMobileOpen(false)} accent="blue" />
                    <MobileLink to={`/audit/${address}`} icon={<BarChart3 size={14} className="text-purple-500" />} label="Audit Report" onClick={() => setIsMobileOpen(false)} accent="purple" />
                    <MobileLink to="/settings" icon={<Settings size={14} className="text-slate-400" />} label="Settings" onClick={() => setIsMobileOpen(false)} accent="slate" />
                    <button
                      onClick={() => { disconnectWallet(); setIsMobileOpen(false); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-all text-left"
                    >
                      <Power size={14} /> Disconnect
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
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
      className={`flex items-center gap-2.5 p-2 rounded-xl text-[12.5px] font-semibold transition-all group ${accentClasses}`}
    >
      <span className="text-slate-400 group-hover:text-current">{icon}</span>
      {label}
    </Link>
  );
};
