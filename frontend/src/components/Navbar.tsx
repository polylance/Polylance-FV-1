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
  LayoutGrid,
  Scale,
  Search,
  Share2,
  MoreHorizontal,
  Link2,
  ChevronDown,
  User,
  Power,
  Shield,
  ShieldCheck,
  Trophy,
  Landmark,
  MessageSquare,
  Settings,
  PlusCircle,
  BarChart3,
  Copy,
  Check,
  ExternalLink,
  LogIn,
  AlertTriangle,
  ArrowUpRight,
  Menu,
  X,
  Lock,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { truncateAddress, formatPolBalance } from '../utils/formatters';
import { dropdownVariants, transition } from '../lib/motion';
import { Drawer } from './mobile/Drawer';
import { Accordion } from './mobile/Accordion';
import { isJudgeAddress, isAdminAddress } from '../utils/adminGuard';

// ──────────────────────────────────────────────────────────────────────────────
// Apple iOS 26 Liquid Glass Navigation Theme Token System
// ──────────────────────────────────────────────────────────────────────────────
export interface NavSectionTheme {
  accentHex: string;
  textActive: string;
  iconActive: string;
  gradientSheen: string;
  borderTint: string;
  glowShadow: string;
}

export const NAV_THEMES: Record<string, NavSectionTheme> = {
  overview: {
    accentHex: '#2563EB',
    textActive: 'text-[#2563EB]',
    iconActive: 'text-[#2563EB]',
    gradientSheen: 'linear-gradient(180deg, rgba(239, 246, 255, 0.96) 0%, rgba(219, 234, 254, 0.78) 100%)',
    borderTint: 'rgba(59, 130, 246, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.28), 0 1px 3px 0 rgba(37, 99, 235, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(37, 99, 235, 0.12)',
  },
  dashboard: {
    accentHex: '#2563EB',
    textActive: 'text-[#2563EB]',
    iconActive: 'text-[#2563EB]',
    gradientSheen: 'linear-gradient(180deg, rgba(239, 246, 255, 0.96) 0%, rgba(219, 234, 254, 0.78) 100%)',
    borderTint: 'rgba(59, 130, 246, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(37, 99, 235, 0.28), 0 1px 3px 0 rgba(37, 99, 235, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(37, 99, 235, 0.12)',
  },
  workspace: {
    accentHex: '#059669',
    textActive: 'text-[#059669]',
    iconActive: 'text-[#059669]',
    gradientSheen: 'linear-gradient(180deg, rgba(236, 253, 245, 0.96) 0%, rgba(209, 250, 229, 0.78) 100%)',
    borderTint: 'rgba(16, 185, 129, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(5, 150, 105, 0.28), 0 1px 3px 0 rgba(5, 150, 105, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(5, 150, 105, 0.12)',
  },
  jobs: {
    accentHex: '#D97706',
    textActive: 'text-[#D97706]',
    iconActive: 'text-[#D97706]',
    gradientSheen: 'linear-gradient(180deg, rgba(254, 243, 199, 0.96) 0%, rgba(253, 230, 138, 0.78) 100%)',
    borderTint: 'rgba(245, 158, 11, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(217, 119, 6, 0.28), 0 1px 3px 0 rgba(217, 119, 6, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(217, 119, 6, 0.12)',
  },
  judge: {
    accentHex: '#7C3AED',
    textActive: 'text-[#7C3AED]',
    iconActive: 'text-[#7C3AED]',
    gradientSheen: 'linear-gradient(180deg, rgba(245, 243, 255, 0.96) 0%, rgba(237, 233, 254, 0.78) 100%)',
    borderTint: 'rgba(139, 92, 246, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(124, 58, 237, 0.28), 0 1px 3px 0 rgba(124, 58, 237, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(124, 58, 237, 0.12)',
  },
  dao: {
    accentHex: '#0284C7',
    textActive: 'text-[#0284C7]',
    iconActive: 'text-[#0284C7]',
    gradientSheen: 'linear-gradient(180deg, rgba(240, 249, 255, 0.96) 0%, rgba(224, 242, 254, 0.78) 100%)',
    borderTint: 'rgba(14, 165, 233, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(2, 132, 199, 0.28), 0 1px 3px 0 rgba(2, 132, 199, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(2, 132, 199, 0.12)',
  },
  more: {
    accentHex: '#E11D48',
    textActive: 'text-[#E11D48]',
    iconActive: 'text-[#E11D48]',
    gradientSheen: 'linear-gradient(180deg, rgba(255, 241, 242, 0.96) 0%, rgba(255, 228, 230, 0.78) 100%)',
    borderTint: 'rgba(244, 63, 94, 0.38)',
    glowShadow: '0 4px 16px -2px rgba(225, 29, 72, 0.28), 0 1px 3px 0 rgba(225, 29, 72, 0.15), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 2px 0 rgba(225, 29, 72, 0.12)',
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Nav Item: Apple iOS 26 Liquid Glass Segmented Pill with Spring Physics
// ──────────────────────────────────────────────────────────────────────────────
interface NavItemProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  theme: NavSectionTheme;
}

const NavItem: React.FC<NavItemProps> = ({ to, active, icon, label, theme }) => {
  return (
    <Link
      to={to}
      className={`
        relative px-3.5 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 select-none
        transition-colors duration-200 whitespace-nowrap group
        ${active ? `${theme.textActive} font-semibold` : 'text-slate-600 hover:text-slate-900 font-medium'}
      `}
    >
      {/* ── Apple iOS 26 Liquid Glass Sliding Indicator ── */}
      {active && (
        <motion.div
          layoutId="ios26-navbar-glass-pill"
          className="absolute inset-0 rounded-full z-0 overflow-hidden pointer-events-none"
          style={{
            background: theme.gradientSheen,
            border: `1px solid ${theme.borderTint}`,
            boxShadow: theme.glowShadow,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
          transition={{
            type: 'spring',
            stiffness: 440,
            damping: 32,
            mass: 0.65,
          }}
        >
          {/* iOS Liquid Glass Specular Top Highlight Streak */}
          <div className="absolute inset-x-2.5 top-0.5 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-90" />
          {/* Subtle Bottom Reflection */}
          <div className="absolute inset-x-3 bottom-0.5 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
          {/* Ambient Glow Gradient Bubble */}
          <div
            className="absolute -inset-1 opacity-30 blur-sm pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${theme.accentHex}, transparent 70%)`,
            }}
          />
        </motion.div>
      )}

      {/* Hover Glass Pill for Inactive Tabs */}
      {!active && (
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-slate-200/50 transition-opacity duration-150 pointer-events-none" />
      )}

      {/* Content: Icon & Label (Positioned above the glass pill z-10) */}
      <span
        className={`relative z-10 transition-transform duration-200 ${
          active ? `${theme.iconActive} scale-105` : 'text-slate-500 group-hover:text-slate-800'
        }`}
      >
        {icon}
      </span>
      <span className="relative z-10">{label}</span>
    </Link>
  );
};

// Dropdown item helper
interface DropdownLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: string;
}

const DropdownLink: React.FC<DropdownLinkProps> = ({ to, icon, label, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
    >
      <span className="text-slate-400 group-hover:text-blue-600 transition-colors">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Floating Pill Navbar
// ──────────────────────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const {
    isConnected,
    address,
    currentRole,
    isArbitrator,
    disconnectWallet,
    balanceNative,
    isWrongNetwork,
    targetChainName,
    targetChainId,
    switchToTargetNetwork,
  } = useWeb3();

  const isJudgeUser = Boolean(
    isArbitrator ||
    currentRole === 'judge' ||
    currentRole === 'admin' ||
    (address && isJudgeAddress(address))
  );

  const { jobs, profiles, maintenanceState, toggleMaintenanceMode } = usePolyLanceData();
  const isAdmin = address ? isAdminAddress(address) : false;
  const location = useLocation();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAddressMenuOpen, setIsAddressMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const addressMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);

  // Find user profile from context
  const userProfileKey = address
    ? Object.keys(profiles).find((k) => k.toLowerCase() === address.toLowerCase())
    : null;
  const currentProfile = userProfileKey ? profiles[userProfileKey] : null;

  // Resolve avatar URL
  const rawAvatarUrl =
    currentProfile?.avatarUrl ||
    (currentProfile?.githubUsername
      ? `https://github.com/${currentProfile.githubUsername}.png`
      : '');

  useEffect(() => {
    setAvatarImgError(false);
  }, [address, rawAvatarUrl]);

  // Determine user initial for letter avatar (matches the "S" avatar in Image 2)
  const displayName = currentProfile?.displayName || '';
  const userInitial = displayName
    ? displayName.trim()[0].toUpperCase()
    : (address ? address.slice(2, 3).toUpperCase() : 'S');

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreRef.current && !moreRef.current.contains(target)) setIsMoreOpen(false);
      if (addressMenuRef.current && !addressMenuRef.current.contains(target)) setIsAddressMenuOpen(false);
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(target)) setIsAvatarMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Directional scroll behavior on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (window.innerWidth < 1024) {
        if (currentY > 80 && currentY > lastScrollYRef.current + 10) {
          setIsHeaderHidden(true);
        } else if (currentY < lastScrollYRef.current - 10) {
          setIsHeaderHidden(false);
        }
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollYRef.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsMoreOpen(false);
    setIsAddressMenuOpen(false);
    setIsAvatarMenuOpen(false);
  }, [location.pathname]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const isMoreActive =
    isMoreOpen ||
    ['/reputation', '/audit', '/attestation', '/chat', '/settings', '/treasury', '/jobs/post'].some(
      (path) => location.pathname.startsWith(path)
    );

  const isVisitor = !isConnected || currentRole === 'visitor';
  const isGithubSynced = Boolean(currentProfile?.githubVerified || currentProfile?.githubUsername);
  const isUnlocked = isConnected && (isGithubSynced || currentRole === 'admin' || currentRole === 'judge');

  // Only standalone audit document page has special simplified header (attestation reports uses standard floating navbar)
  const isAuditPage = location.pathname.startsWith('/audit') && !location.pathname.includes('attestation');
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
          <Link to="/" className="flex items-center gap-2.5 group">
            <PolyLanceLogo size={30} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
            <span className="font-extrabold text-[19px] tracking-tight text-slate-900 leading-none">
              Poly<span className="text-blue-600">Lance</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 text-xs font-mono font-bold shadow-2xs">
              <ShieldCheck size={13} className="text-purple-600" />
              <span className="hidden sm:inline">{location.pathname.includes('attestation') ? 'OFFICIAL JOB SBT ATTESTATION' : 'OFFICIAL AUDIT REPORT'}</span>
              <span className="sm:hidden">{location.pathname.includes('attestation') ? 'SBT ATTESTATION' : 'AUDIT REPORT'}</span>
            </div>

            {isVisitor ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs"
                >
                  <span>Explore PolyLance</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Launch App</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs"
                >
                  <LayoutGrid size={13} className="text-blue-600" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/workspace"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs"
                >
                  <Briefcase size={13} className="text-blue-600" />
                  <span>Workspace</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── Wrong Network Alert Banner ────────────────────── */}
      {isWrongNetwork && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between shadow-sm no-print relative z-50">
          <div className="flex items-center gap-2 max-w-5xl">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span>
              <strong>Wrong Network:</strong> Wallet connected to unsupported chain. Please switch to <strong>{targetChainName}</strong> (Chain ID: {targetChainId}).
            </span>
          </div>
          <button
            type="button"
            onClick={switchToTargetNetwork}
            className="px-3 py-1 bg-white text-orange-800 hover:bg-orange-50 font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer shrink-0 ml-3 flex items-center gap-1.5"
          >
            <AlertTriangle size={13} className="text-orange-600" />
            <span>Switch Network</span>
          </button>
        </div>
      )}

      {/* ── Floating Capsule Navbar (Matching Image 2 Reference) ───────── */}
      <header
        className={`sticky top-0 z-50 w-full px-3 sm:px-6 lg:px-8 pt-3 pb-2 transition-transform duration-200 no-print pt-safe ${
          isHeaderHidden ? '-translate-y-full lg:translate-y-0' : 'translate-y-0'
        }`}
      >
        <div className="max-w-[1440px] mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2">
          {/* ── LEFT: PolyLance Logo ────────────────────────────────────── */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0 select-none">
              <div className="relative flex items-center justify-center">
                <PolyLanceLogo size={28} className="relative group-hover:scale-105 transition-transform duration-300 ease-out" />
              </div>
              <span className="font-extrabold text-[19px] tracking-tight text-slate-900 leading-none">
                Poly<span className="text-[#2563EB]">Lance</span>
              </span>
            </Link>
          </div>

          {/* ── CENTER: Navigation Links (Apple iOS 26 Liquid Glass Segmented Pill) ── */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 font-sans z-20 relative p-1 rounded-full bg-slate-200/50 border border-slate-200/80 backdrop-blur-xl shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.06),0_1px_1px_rgba(255,255,255,0.8)]">
            {!isUnlocked ? (
              <>
                {/* 1. Overview (Landing Page Button for New Users / Visitors) */}
                <NavItem
                  to="/"
                  active={location.pathname === '/' || location.pathname === '/overview'}
                  icon={<Sparkles size={14.5} />}
                  label="Overview"
                  theme={NAV_THEMES.overview}
                />

                {/* 2. Find Jobs */}
                <NavItem
                  to="/jobs"
                  active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')}
                  icon={<Search size={14.5} />}
                  label="Find Jobs"
                  theme={NAV_THEMES.jobs}
                />

                {/* If connected with wallet but hasn't synced GitHub yet */}
                {isConnected && !isGithubSynced && (
                  <Link
                    to="/settings"
                    className="relative px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 select-none bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 text-purple-700 border border-purple-200/80 shadow-2xs transition-all animate-pulse"
                    title="Connect & Sync GitHub to unlock Dashboard, Job Workspace, and DAO"
                  >
                    <Lock size={12} className="text-purple-600" />
                    <span>Sync GitHub to Unlock</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                {/* 1. Dashboard */}
                <NavItem
                  to="/dashboard"
                  active={isActive('/dashboard')}
                  icon={<LayoutGrid size={14.5} />}
                  label="Dashboard"
                  theme={NAV_THEMES.dashboard}
                />

                {/* 2. Job Workspace */}
                <NavItem
                  to="/workspace"
                  active={isActive('/workspace')}
                  icon={<Briefcase size={14.5} />}
                  label="Job Workspace"
                  theme={NAV_THEMES.workspace}
                />

            {/* 3. Find Jobs (Search Icon) */}
            <NavItem
              to="/jobs"
              active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')}
              icon={<Search size={14.5} />}
              label="Find Jobs"
              theme={NAV_THEMES.jobs}
            />

            {/* 4. Judge Panel (Only for Authorized Judges & Admins) */}
            {isJudgeUser && (
              <NavItem
                to="/judge"
                active={isActive('/judge')}
                icon={<Scale size={14.5} />}
                label="Judge Panel"
                theme={NAV_THEMES.judge}
              />
            )}

            {/* 5. DAO (3-nodes Network/Share Icon) */}
            <NavItem
              to="/dao"
              active={isActive('/dao')}
              icon={<Share2 size={14.5} />}
              label="DAO"
              theme={NAV_THEMES.dao}
            />

            {/* 6. More Dropdown (... More v) */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(!isMoreOpen);
                  setIsAddressMenuOpen(false);
                  setIsAvatarMenuOpen(false);
                }}
                className={`
                  relative px-3.5 py-1.5 rounded-full text-[13px] flex items-center gap-1.5 select-none cursor-pointer
                  transition-colors duration-200 whitespace-nowrap group
                  ${
                    isMoreActive
                      ? `${NAV_THEMES.more.textActive} font-semibold`
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }
                `}
              >
                {/* ── Apple iOS 26 Liquid Glass Sliding Indicator for More ── */}
                {isMoreActive && (
                  <motion.div
                    layoutId="ios26-navbar-glass-pill"
                    className="absolute inset-0 rounded-full z-0 overflow-hidden pointer-events-none"
                    style={{
                      background: NAV_THEMES.more.gradientSheen,
                      border: `1px solid ${NAV_THEMES.more.borderTint}`,
                      boxShadow: NAV_THEMES.more.glowShadow,
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 440,
                      damping: 32,
                      mass: 0.65,
                    }}
                  >
                    <div className="absolute inset-x-2.5 top-0.5 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-90" />
                    <div className="absolute inset-x-3 bottom-0.5 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    <div
                      className="absolute -inset-1 opacity-30 blur-sm pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${NAV_THEMES.more.accentHex}, transparent 70%)`,
                      }}
                    />
                  </motion.div>
                )}

                {!isMoreActive && (
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-slate-200/50 transition-opacity duration-150 pointer-events-none" />
                )}

                <MoreHorizontal
                  size={14.5}
                  className={`relative z-10 transition-transform duration-200 ${
                    isMoreActive ? `${NAV_THEMES.more.iconActive} scale-105` : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="relative z-10">More</span>
                <motion.span
                  animate={{ rotate: isMoreOpen ? 180 : 0 }}
                  transition={transition.fast}
                  className="relative z-10 flex items-center justify-center"
                >
                  <ChevronDown
                    size={11}
                    className={isMoreActive ? NAV_THEMES.more.iconActive : 'text-slate-400 group-hover:text-slate-600'}
                  />
                </motion.span>
              </button>

              {/* More Dropdown Menu */}
              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-0 mt-2.5 w-52 rounded-2xl p-1.5 space-y-0.5 z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)] overflow-hidden"
                  >
                    <DropdownLink
                      to="/reputation"
                      icon={<Trophy size={13.5} />}
                      label="SBT Leaderboard"
                      onClick={() => setIsMoreOpen(false)}
                    />
                    {(currentRole === 'client' || currentRole === 'admin') && (
                      <DropdownLink
                        to="/jobs/post"
                        icon={<PlusCircle size={13.5} />}
                        label="Post a Job"
                        onClick={() => setIsMoreOpen(false)}
                      />
                    )}
                    {currentRole === 'admin' && (
                      <DropdownLink
                        to="/treasury"
                        icon={<Landmark size={13.5} />}
                        label="Protocol Treasury"
                        onClick={() => setIsMoreOpen(false)}
                      />
                    )}
                    <DropdownLink
                      to="/chat"
                      icon={<MessageSquare size={13.5} />}
                      label="Messages & Chat"
                      onClick={() => setIsMoreOpen(false)}
                    />
                    <DropdownLink
                      to={`/audit/${address || ''}`}
                      icon={<BarChart3 size={13.5} />}
                      label="Security & Audit"
                      onClick={() => setIsMoreOpen(false)}
                    />
                    <DropdownLink
                      to="/attestation"
                      icon={<ShieldCheck size={13.5} />}
                      label="Attestation Reports"
                      onClick={() => setIsMoreOpen(false)}
                    />
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreOpen(false);
                          toggleMaintenanceMode(!maintenanceState?.enabled);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-amber-700 hover:bg-amber-50 cursor-pointer"
                      >
                        <Wrench size={13.5} className="text-amber-600" />
                        <span>{maintenanceState?.enabled ? 'Exit Maintenance Mode' : 'Keep Site under Maintenance'}</span>
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1" />
                    <DropdownLink
                      to="/settings"
                      icon={<Settings size={13.5} />}
                      label="Settings"
                      onClick={() => setIsMoreOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          )}
          </nav>

          {/* ── RIGHT: Balance Pill + Address Pill + User Avatar (Image 2) ── */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {isConnected && address ? (
              <>
                {/* Thin Vertical Divider */}
                <div className="hidden lg:block h-5 w-px bg-slate-200/90 mx-0.5 shrink-0" />

                {/* Admin Maintenance Mode Button */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => toggleMaintenanceMode(!maintenanceState?.enabled)}
                    title={maintenanceState?.enabled ? "Click to exit maintenance and resume normal user access" : "Click to put PolyLance under Maintenance Mode"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs shrink-0 ${
                      maintenanceState?.enabled
                        ? "bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800 animate-pulse"
                        : "bg-amber-100/90 hover:bg-amber-200 border-amber-300 text-amber-900"
                    }`}
                  >
                    <Wrench size={13} className={maintenanceState?.enabled ? "text-rose-600" : "text-amber-700"} />
                    <span className="hidden sm:inline">{maintenanceState?.enabled ? "Maintenance: ON" : "Keep Site under Maintenance"}</span>
                    <span className="sm:hidden">{maintenanceState?.enabled ? "Maint: ON" : "Maint"}</span>
                  </button>
                )}

                {/* 1. Purple Balance Pill (18.335 POL) */}
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(true)}
                  title="Click to view full wallet token balances"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#F3E8FF]/70 hover:bg-[#F3E8FF] border border-purple-200/70 text-purple-700 transition-all cursor-pointer shadow-2xs group shrink-0"
                >
                  <Link2 size={13} className="text-purple-600 group-hover:rotate-45 transition-transform shrink-0 stroke-[2.2]" />
                  <span>{formatPolBalance(balanceNative)} POL</span>
                </button>

                {/* 2. Light Blue Wallet Address Pill (0xB8aa...090d v) */}
                <div className="relative" ref={addressMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressMenuOpen(!isAddressMenuOpen);
                      setIsAvatarMenuOpen(false);
                      setIsMoreOpen(false);
                    }}
                    title="Click for address details"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#EBF5FF] hover:bg-[#DFEFFF] border border-blue-200/70 text-blue-600 transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Shield size={9} className="text-white fill-white" />
                    </div>
                    <span>{truncateAddress(address)}</span>
                    <ChevronDown
                      size={11}
                      className={`text-blue-500 transition-transform duration-150 ${
                        isAddressMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Address Dropdown */}
                  <AnimatePresence>
                    {isAddressMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full right-0 mt-2.5 w-64 rounded-2xl p-2 z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)] space-y-1.5"
                      >
                        <div className="p-2.5 bg-slate-50 rounded-xl">
                          <div className="text-[11px] text-slate-500 font-medium mb-0.5">Connected Address</div>
                          <div className="text-xs font-mono font-bold text-slate-800 break-all select-all">
                            {address}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? 'Copied to Clipboard!' : 'Copy Address'}
                          </span>
                        </button>

                        <a
                          href={`https://amoy.polygonscan.com/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <ExternalLink size={14} />
                            View on PolygonScan
                          </span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAddressMenuOpen(false);
                            setIsBalanceModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <Link2 size={14} />
                          <span>View Token Balances</span>
                        </button>

                        {isWrongNetwork && (
                          <button
                            type="button"
                            onClick={switchToTargetNetwork}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <AlertTriangle size={14} />
                            Switch to {targetChainName}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. User Avatar with Initial "S" or Photo + ChevronDown (Image 2) */}
                <div className="relative" ref={avatarMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAvatarMenuOpen(!isAvatarMenuOpen);
                      setIsAddressMenuOpen(false);
                      setIsMoreOpen(false);
                    }}
                    title="User Profile Menu"
                    className="flex items-center gap-1 cursor-pointer select-none group shrink-0 p-0.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/90 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500/30 transition-all">
                      {rawAvatarUrl && !avatarImgError ? (
                        <img
                          src={rawAvatarUrl}
                          alt={displayName || 'User Avatar'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarImgError(true)}
                        />
                      ) : (
                        <span className="font-bold text-xs text-white select-none">
                          {userInitial}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={12}
                      className={`text-slate-600 group-hover:text-slate-900 transition-transform duration-150 ${
                        isAvatarMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Avatar Dropdown Menu */}
                  <AnimatePresence>
                    {isAvatarMenuOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full right-0 mt-2.5 w-60 rounded-2xl p-2 z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)] space-y-1 overflow-hidden"
                      >
                        {/* User preview header */}
                        <div className="flex items-center gap-2.5 p-2 bg-slate-50/90 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center overflow-hidden shrink-0">
                            {rawAvatarUrl && !avatarImgError ? (
                              <img
                                src={rawAvatarUrl}
                                alt={displayName || 'User Avatar'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-sm text-white select-none">
                                {userInitial}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {displayName || truncateAddress(address)}
                            </div>
                            <div className="text-[10px] text-blue-600 font-semibold capitalize flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              {currentRole} Role
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 my-1" />

                        <Link
                          to={`/profile/${address}`}
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <User size={14} className="text-slate-400" />
                          <span>View Profile</span>
                        </Link>

                        <Link
                          to="/workspace"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Briefcase size={14} className="text-slate-400" />
                          <span>Job Workspace</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Settings size={14} className="text-slate-400" />
                          <span>Account Settings</span>
                        </Link>

                        <Link
                          to={`/audit/${address}`}
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <BarChart3 size={14} className="text-slate-400" />
                          <span>Security Audit</span>
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            disconnectWallet();
                            setIsAvatarMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Power size={14} className="text-rose-500" />
                          <span>Disconnect Wallet</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="
                  px-4 py-1.5 rounded-full text-xs font-bold text-white
                  flex items-center gap-1.5 cursor-pointer shrink-0
                  bg-blue-600 hover:bg-blue-700 shadow-sm transition-all
                "
              >
                <LogIn size={13} />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile hamburger menu toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={isMobileOpen}
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer select-none shrink-0"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={transition.micro}
                  >
                    <X size={17} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={transition.micro}
                  >
                    <Menu size={17} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile Accessible Drawer ────────────────────────────────── */}
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {rawAvatarUrl && !avatarImgError ? (
                        <img src={rawAvatarUrl} alt={displayName || 'User Avatar'} className="w-full h-full object-cover" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-900">{truncateAddress(address)}</div>
                      <div className="text-[11px] text-blue-600 capitalize font-medium">{currentRole} Account</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-purple-700">{formatPolBalance(balanceNative)} POL</div>
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
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={16} />
                Connect Wallet
              </button>
            )
          }
        >
          {/* Main Primary Links in Mobile Drawer */}
          {!isUnlocked ? (
            <div className="space-y-1">
              <MobileLink to="/" icon={<Sparkles size={18} className="text-blue-600" />} label="Overview" onClick={() => setIsMobileOpen(false)} />
              <MobileLink to="/jobs" icon={<Search size={18} className="text-blue-600" />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} />
              {isConnected && !isGithubSynced && (
                <div className="p-3 my-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1">
                    <Lock size={14} className="text-purple-600" />
                    <span>GitHub Sync Required</span>
                  </div>
                  <p className="text-[11px] text-purple-700 mb-2 leading-relaxed">
                    Connect and sync your GitHub profile to unlock Dashboard, Job Workspace, and DAO.
                  </p>
                  <MobileLink to="/settings" icon={<Settings size={16} className="text-purple-600" />} label="Go to Settings to Sync" onClick={() => setIsMobileOpen(false)} />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <MobileLink to="/dashboard" icon={<LayoutGrid size={18} className="text-blue-600" />} label="Dashboard" onClick={() => setIsMobileOpen(false)} />
                <MobileLink to="/workspace" icon={<Briefcase size={18} className="text-blue-600" />} label="Job Workspace" onClick={() => setIsMobileOpen(false)} />
                <MobileLink to="/jobs" icon={<Search size={18} className="text-blue-600" />} label="Find Jobs" onClick={() => setIsMobileOpen(false)} />
                {isJudgeUser && (
                  <MobileLink to="/judge" icon={<Scale size={18} className="text-blue-600" />} label="Judge Panel" onClick={() => setIsMobileOpen(false)} />
                )}
                <MobileLink to="/dao" icon={<Share2 size={18} className="text-blue-600" />} label="DAO Governance" onClick={() => setIsMobileOpen(false)} />
                <MobileLink to="/chat" icon={<MessageSquare size={18} className="text-blue-600" />} label="Messages & Negotiations" onClick={() => setIsMobileOpen(false)} />
              </div>

              {/* Sub-sections inside Accordion */}
              <div className="pt-2">
                <Accordion
                  items={[
                    {
                      title: 'Reputation & Audits',
                      icon: <Trophy size={18} />,
                      content: (
                        <div className="space-y-1 pt-1">
                          <MobileLink to="/reputation" icon={<Trophy size={16} className="text-amber-500" />} label="SBT Leaderboard & Scores" onClick={() => setIsMobileOpen(false)} />
                          <MobileLink to="/audit" icon={<BarChart3 size={16} className="text-purple-600" />} label="Smart Contract Security Audit" onClick={() => setIsMobileOpen(false)} />
                          <MobileLink to="/attestation" icon={<ShieldCheck size={16} className="text-emerald-600" />} label="Soulbound Attestations" onClick={() => setIsMobileOpen(false)} />
                        </div>
                      ),
                    },
                    {
                      title: 'Account & Protocol',
                      icon: <Settings size={18} />,
                      content: (
                        <div className="space-y-1 pt-1">
                          {address && (
                            <MobileLink to={`/profile/${address}`} icon={<User size={16} className="text-blue-600" />} label="Profile Overview" onClick={() => setIsMobileOpen(false)} />
                          )}
                          <MobileLink to="/settings" icon={<Settings size={16} className="text-slate-600" />} label="Profile Settings" onClick={() => setIsMobileOpen(false)} />
                          {(currentRole === 'client' || currentRole === 'admin') && (
                            <MobileLink to="/jobs/post" icon={<PlusCircle size={16} className="text-cyan-600" />} label="Post a Job" onClick={() => setIsMobileOpen(false)} />
                          )}
                          {currentRole === 'admin' && (
                            <MobileLink to="/treasury" icon={<Landmark size={16} className="text-emerald-600" />} label="Protocol Treasury" onClick={() => setIsMobileOpen(false)} />
                          )}
                          <MobileLink to="/manifesto" icon={<Shield size={16} className="text-indigo-600" />} label="PolyLance Manifesto" onClick={() => setIsMobileOpen(false)} />
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </>
          )}
        </Drawer>
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
}

const MobileLink: React.FC<MobileLinkProps> = ({ to, icon, label, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors group"
    >
      <span className="text-slate-400 group-hover:text-blue-600 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
};
