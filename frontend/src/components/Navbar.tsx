import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useWeb3 } from '../context/Web3Context';
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
import { dropdownVariants, transition, spring } from '../lib/motion';

// ──────────────────────────────────────────────────────────────────────────────
// Nav Link with layoutId sliding pill
// ──────────────────────────────────────────────────────────────────────────────
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
  accent?: 'purple' | 'amber';
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children, accent = 'purple' }) => {
  const activeTextClass = accent === 'amber' ? 'text-amber-800 font-bold' : 'text-purple-700 font-bold';
  const hoverClass = accent === 'amber'
    ? 'hover:text-amber-700 hover:bg-amber-50/60'
    : 'hover:text-slate-900 hover:bg-white/50';

  return (
    <Link
      to={to}
      className={`
        relative px-3.5 py-1.5 rounded-full text-[13px] font-semibold
        flex items-center gap-1.5 select-none z-10
        transition-colors duration-200
        nav-pill-item
        ${active ? activeTextClass : `text-slate-600 ${hoverClass}`}
      `}
    >
      {/* Sliding active background */}
      {active && (
        <motion.span
          layoutId="activeNav"
          className={`absolute inset-0 rounded-full ${
            accent === 'amber'
              ? 'bg-amber-100/80'
              : 'bg-white/70'
          }`}
          style={{
            boxShadow: accent === 'amber'
              ? 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.06)'
              : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 3px rgba(37,99,235,0.08)',
          }}
          transition={spring.default}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </Link>
  );
};

const DropdownLink: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick: () => void }> = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-700 hover:bg-purple-50/80 hover:text-purple-700 transition-all duration-150 group"
  >
    <span className="text-slate-400 group-hover:text-purple-500 transition-colors">{icon}</span>
    {label}
  </Link>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Navbar
// ──────────────────────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const { isConnected, address, currentRole, disconnectWallet } = useWeb3();
  const location = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);

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

  const isAuditPage = location.pathname.startsWith('/audit/');

  if (isAuditPage) {
    return (
      <header className="sticky top-0 z-50 w-full py-3.5 backdrop-blur-xl bg-[#F6F9FC]/95 border-b border-slate-200/60 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md group-hover:bg-purple-500/35 transition-all duration-300" />
              <PolyLanceLogo size={36} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[22px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-purple-600">Lance</span>
              </span>
              <span className="text-[7.5px] font-mono text-purple-700/80 font-bold tracking-[0.16em] uppercase mt-0.5 leading-none select-none">
                mvp on-chain
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-800 rounded-full border border-purple-200 text-xs font-mono font-bold shadow-2xs">
            <ShieldCheck size={14} className="text-purple-600" />
            <span>OFFICIAL AUDIT REPORT</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── Scroll-aware Liquid Glass Header with Full Backdrop Blur ───────── */}
      <header className="sticky top-0 z-50 w-full py-1.5 backdrop-blur-xl bg-[#F6F9FC]/80 border-b border-slate-200/50 shadow-3xs transition-all duration-300">
        <motion.nav
          animate={{
            scale: scrolled ? 0.99 : 1,
            boxShadow: scrolled
              ? '0 12px 40px rgba(124,58,237,0.14), 0 3px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)'
              : '0 8px 30px rgba(124,58,237,0.08), 0 2px 6px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-2.5rem)] max-w-[1536px] mx-auto
            flex items-center justify-between
            px-5 py-2 sm:py-2.5 rounded-[28px] bg-white/85 border border-white/90 shadow-2xs"
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
        {/* ── LEFT: Brand ─────────────────────────────────────────────── */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-purple-400/20 blur-md group-hover:bg-purple-400/30 transition-all duration-300" />
              <PolyLanceLogo size={36} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[22px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-purple-600">Lance</span>
              </span>
              <span className="text-[7px] font-mono text-slate-400/60 font-medium tracking-[0.15em] uppercase mt-0.5 leading-none select-none">
                mvp on-chain
              </span>
            </div>
          </Link>
        </div>

        {/* ── CENTER: Navigation Pill ──────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-0.5 font-sans">
          <div
            className="flex items-center gap-0.5 rounded-full px-1.5 py-1"
            style={{
              background: 'rgba(255,255,255,0.40)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* VISITOR LINKS */}
            {isVisitor && (
              <>
                <NavLink to="/" active={isActive('/') && location.pathname === '/'}>
                  <Shield size={13} />Overview
                </NavLink>
                <NavLink to="/jobs" active={isActive('/jobs')}>
                  <Briefcase size={13} />Find Jobs
                </NavLink>
                <NavLink to="/reputation" active={isActive('/reputation')}>
                  <Trophy size={13} />SBT Leaderboard
                </NavLink>
                <NavLink to="/dao" active={isActive('/dao')}>
                  <Users size={13} />DAO
                </NavLink>
              </>
            )}

            {/* CONNECTED ROLE LINKS */}
            {!isVisitor && (
              <>
                <NavLink to="/dashboard" active={isActive('/dashboard')}>
                  <LayoutDashboard size={13} />Dashboard
                </NavLink>

                <NavLink to="/jobs/post" active={isActive('/jobs/post')}>
                  <PlusCircle size={13} />Post Job
                </NavLink>

                <NavLink to="/jobs" active={isActive('/jobs') && !isActive('/jobs/post')}>
                  <Briefcase size={13} />Find Jobs
                </NavLink>

                <NavLink to="/reputation" active={isActive('/reputation')}>
                  <Trophy size={13} />SBT Leaderboard
                </NavLink>

                {/* Judge Panel on top bar for Judge role */}
                {currentRole === 'judge' && (
                  <NavLink to="/judge" active={isActive('/judge')} accent="amber">
                    <Scale size={13} />Judge Panel
                  </NavLink>
                )}

                {/* Treasury on top bar for Admin role */}
                {currentRole === 'admin' && (
                  <NavLink to="/treasury" active={isActive('/treasury')}>
                    <Landmark size={13} />Treasury
                  </NavLink>
                )}

                <NavLink to="/dao" active={isActive('/dao')}>
                  <Users size={13} />DAO
                </NavLink>
                <NavLink to="/chat" active={isActive('/chat')}>
                  <MessageSquare size={13} />Messages
                </NavLink>

                {/* More dropdown */}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`
                      px-3.5 py-1.5 rounded-full text-[13px] font-semibold
                      flex items-center gap-1.5 cursor-pointer select-none
                      nav-pill-item
                      ${isMoreOpen ? 'text-purple-700 font-bold' : 'text-slate-600'}
                    `}
                    style={isMoreOpen ? {
                      background: 'rgba(255,255,255,0.70)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 1px 3px rgba(124,58,237,0.08)',
                    } : {}}
                  >
                    <Grid size={13} />
                    More
                    <motion.span
                      animate={{ rotate: isMoreOpen ? 180 : 0 }}
                      transition={transition.fast}
                    >
                      <ChevronDown size={12} />
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
                        className="absolute right-0 mt-2.5 w-52 rounded-2xl p-1.5 z-50"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                          border: '1px solid rgba(255,255,255,0.65)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                        }}
                      >
                        {/* Admin specific extra options in More dropdown */}
                        {currentRole === 'admin' && (
                          <>
                            <DropdownLink to="/jobs" icon={<Briefcase size={14} />} label="Find Jobs" onClick={() => setIsMoreOpen(false)} />
                            <DropdownLink to="/reputation" icon={<Trophy size={14} />} label="SBT Leaderboard" onClick={() => setIsMoreOpen(false)} />
                            <DropdownLink to="/judge" icon={<Scale size={14} />} label="Judge Panel" onClick={() => setIsMoreOpen(false)} />
                            <div className="border-t border-slate-100/80 my-1" />
                          </>
                        )}
                        <DropdownLink to={`/profile/${address}`} icon={<User size={14} />} label="Profile" onClick={() => setIsMoreOpen(false)} />
                        <DropdownLink to={`/audit/${address}`} icon={<BarChart3 size={14} />} label="Audit Report" onClick={() => setIsMoreOpen(false)} />
                        <DropdownLink to="/settings" icon={<Settings size={14} />} label="Settings" onClick={() => setIsMoreOpen(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Wallet + Mobile Toggle ──────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${address}`}
                className="
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                  text-[13px] font-semibold font-mono text-purple-700
                  hover:bg-purple-100/80 transition-all duration-200
                  apple-button
                "
                style={{
                  background: 'rgba(246,240,255,0.85)',
                  border: '1px solid rgba(167,139,250,0.30)',
                  boxShadow: '0 1px 3px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                  <User size={10} className="text-white" />
                </div>
                <span>{truncateAddress(address)}</span>
                <ChevronDown size={11} className="text-purple-400" />
              </Link>

              <motion.button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-slate-400 hover:text-rose-500
                  cursor-pointer transition-colors duration-200
                "
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <Power size={13} className="stroke-[2]" />
              </motion.button>
            </div>
          ) : (
            <Link
              to="/login"
              className="
                px-4 py-1.5 rounded-full text-[13px] font-bold text-white
                flex items-center gap-1.5 cursor-pointer
                apple-button glass-highlight
                bg-gradient-to-r from-purple-600 to-purple-500
              "
              style={{
                boxShadow: '0 2px 8px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <LogIn size={13} />
              Connect Wallet
            </Link>
          )}

          {/* Mobile toggle */}
          <motion.button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            whileTap={{ scale: 0.93 }}
            className="
              md:hidden p-2 rounded-full
              text-slate-500 hover:text-purple-700
              transition-colors duration-200 cursor-pointer
            "
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
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
                  <MobileLink to="/" icon={<Shield size={14} />} label="Overview" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/jobs" icon={<Briefcase size={14} />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/reputation" icon={<Trophy size={14} />} label="SBT Leaderboard" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/dao" icon={<Users size={14} />} label="DAO" onClick={() => setIsMobileOpen(false)} />
                  <div className="pt-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center justify-center gap-2 p-3 rounded-2xl text-[13px] font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 transition-all"
                      style={{ boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
                    >
                      <LogIn size={14} /> Connect Wallet
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <MobileLink to="/dashboard" icon={<LayoutDashboard size={14} />} label="Dashboard" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/jobs/post" icon={<PlusCircle size={14} />} label="Post Job" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/jobs" icon={<Briefcase size={14} />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/reputation" icon={<Trophy size={14} />} label="SBT Leaderboard" onClick={() => setIsMobileOpen(false)} />
                  {(currentRole === 'admin' || currentRole === 'judge') && (
                    <Link
                      to="/judge"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-[13px] font-semibold text-amber-800 bg-amber-50/80 transition-all"
                    >
                      <Scale size={14} className="text-amber-500" /> Judge Panel
                    </Link>
                  )}
                  {currentRole === 'admin' && (
                    <MobileLink to="/treasury" icon={<Landmark size={14} />} label="Treasury" onClick={() => setIsMobileOpen(false)} />
                  )}
                  <MobileLink to="/dao" icon={<Users size={14} />} label="DAO" onClick={() => setIsMobileOpen(false)} />
                  <MobileLink to="/chat" icon={<MessageSquare size={14} />} label="Messages" onClick={() => setIsMobileOpen(false)} />
                  <div className="border-t border-slate-100/80 pt-2 mt-1 space-y-0.5">
                    <MobileLink to={`/profile/${address}`} icon={<User size={14} />} label="Profile" onClick={() => setIsMobileOpen(false)} />
                    <MobileLink to={`/audit/${address}`} icon={<BarChart3 size={14} />} label="Audit Report" onClick={() => setIsMobileOpen(false)} />
                    <MobileLink to="/settings" icon={<Settings size={14} />} label="Settings" onClick={() => setIsMobileOpen(false)} />
                    <button
                      onClick={() => { disconnectWallet(); setIsMobileOpen(false); }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-all text-left"
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
const MobileLink: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick: () => void }> = ({ to, icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-2.5 p-2.5 rounded-xl text-[13px] font-semibold text-slate-700 hover:bg-purple-50/80 hover:text-purple-700 transition-all"
  >
    <span className="text-slate-400">{icon}</span>
    {label}
  </Link>
);
