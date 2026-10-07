import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Hexagon,
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
  Wrench,
} from 'lucide-react';
import { truncateAddress, formatPolBalance } from '../utils/formatters';
import { Drawer } from './mobile/Drawer';
import { isJudgeAddress, isAdminAddress } from '../utils/adminGuard';
import { PolygonIcon } from './TokenIcon';

// ──────────────────────────────────────────────────────────────────────────────
// Nav Item: Sculpted Contoured Glowing Tab Dock (Matching Image 3)
// ──────────────────────────────────────────────────────────────────────────────
interface NavItemProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, active, icon, label }) => {
  const gradId = `tabGrad-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
  return (
    <Link
      to={to}
      className={`
        relative h-16 flex items-center gap-1.5 px-3.5 text-[13px] select-none
        transition-colors duration-150 whitespace-nowrap group
        ${
          active
            ? 'text-[#0047AB] font-bold'
            : 'text-[#4B5563] hover:text-[#0047AB] font-medium'
        }
      `}
    >
      <span className={`transition-colors duration-150 ${active ? 'text-[#0066FF]' : 'text-[#6B7280] group-hover:text-[#0047AB]'}`}>
        {icon}
      </span>
      <span>{label}</span>

      {/* ── Glowing Contoured Underline Dock (Matching 3rd Image) ── */}
      {active && (
        <div className="absolute -bottom-px left-0 right-0 pointer-events-none flex flex-col items-center">
          <svg
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            className="w-full h-[7px] overflow-visible"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0047AB" />
                <stop offset="20%" stopColor="#0052CC" />
                <stop offset="50%" stopColor="#00D2FF" />
                <stop offset="80%" stopColor="#0052CC" />
                <stop offset="100%" stopColor="#0047AB" />
              </linearGradient>
              <filter id={`tabGlow-${gradId}`} x="-20%" y="-20%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Contoured bracket curve: starts at y=0, flairs down to y=3.5, runs across, flairs back up to y=0 */}
            <path
              d="M 2 0 C 7 0, 10 3.5, 17 3.5 L 83 3.5 C 90 3.5, 93 0, 98 0"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              filter={`url(#tabGlow-${gradId})`}
            />
            {/* Center radiant cyan node */}
            <circle cx="50" cy="3.5" r="1.3" fill="#00E5FF" />
          </svg>
          {/* Ambient diffuse electric blue radiance radiating downward */}
          <div className="w-[85%] h-2.5 -mt-0.5 rounded-full bg-[#0066FF]/40 blur-[6px] pointer-events-none" />
        </div>
      )}
    </Link>
  );
};

// Dropdown link helper
interface DropdownLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const DropdownLink: React.FC<DropdownLinkProps> = ({ to, icon, label, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium text-[#0B0B0C] hover:bg-[#EBF3FF] hover:text-[#0047AB] transition-colors duration-150 group"
    >
      <span className="text-[#8892A0] group-hover:text-[#0066FF] transition-colors">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Editorial Full-Width Navbar
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

  // Strictly protect Judge Panel: Freelancers and Clients must NEVER see the Judge Panel.
  // It is only visible when the active role is 'judge' or 'admin' AND the address is authorized.
  const isJudgeUser = (currentRole === 'judge' || currentRole === 'admin') && Boolean(
    isArbitrator ||
    (address && (isJudgeAddress(address) || isAdminAddress(address)))
  );

  const { profiles, maintenanceState, toggleMaintenanceMode } = usePolyLanceData();
  const isAdmin = address ? isAdminAddress(address) : false;
  const location = useLocation();
  const isCertifiedPassDomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'certifiedpass.polylance.codes' || window.location.hostname.startsWith('certifiedpass.'));

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAddressMenuOpen, setIsAddressMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const addressMenuRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

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

  // Determine user initial for letter avatar
  const displayName = currentProfile?.displayName || '';
  const userInitial = displayName
    ? displayName.trim()[0].toUpperCase()
    : (address ? address.slice(2, 3).toUpperCase() : 'P');

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

  // Special simplified header for standalone audit report document
  const isAuditPage = location.pathname.startsWith('/audit') && !location.pathname.includes('attestation');
  if (isAuditPage) {
    return (
      <header className="sticky top-0 z-50 w-full h-16 bg-[#FFFFFF] border-b border-[#E2E6EC] no-print">
        <div className="w-full max-w-[1760px] mx-auto h-full flex items-center justify-between px-[clamp(16px,3vw,56px)] pl-[max(env(safe-area-inset-left,0px),clamp(16px,3vw,56px))] pr-[max(env(safe-area-inset-right,0px),clamp(16px,3vw,56px))]">
          <Link to="/" className="flex items-center gap-3 group select-none">
            <div className="flex items-center justify-center p-1 rounded-xl bg-slate-50 border border-[#E2E6EC] group-hover:border-[#0047AB]/30 transition-all">
              <PolyLanceLogo size={32} className="transition-transform duration-200 group-hover:scale-105" />
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl text-[#0B0B0C] tracking-tight">
              {isCertifiedPassDomain ? 'CertifiedPass' : <>Poly<span className="text-[#0047AB]">Lance</span></>}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F6F9] text-[#4B5563] border border-[#E2E6EC] rounded-[6px] text-xs font-mono font-medium">
              <ShieldCheck size={13} strokeWidth={1.5} className="text-[#0047AB]" />
              <span>OFFICIAL AUDIT REPORT</span>
            </div>

            {isVisitor ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white text-xs font-medium transition-colors"
              >
                <span>Launch App</span>
                <ArrowUpRight size={13} strokeWidth={1.5} />
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0C] bg-[#F4F6F9] hover:bg-[#E2E6EC] border border-[#E2E6EC] transition-colors"
              >
                <LayoutGrid size={13} strokeWidth={1.5} className="text-[#0047AB]" />
                <span>Dashboard</span>
              </Link>
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
        <div className="bg-[#FCEBDD] border-b border-[#E2E6EC] text-[#C2610C] text-xs font-medium px-4 py-2 flex items-center justify-between no-print relative z-50">
          <div className="flex items-center gap-2 w-full max-w-[1760px] mx-auto px-[clamp(16px,3vw,56px)] pl-[max(env(safe-area-inset-left,0px),clamp(16px,3vw,56px))] pr-[max(env(safe-area-inset-right,0px),clamp(16px,3vw,56px))]">
            <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0" />
            <span>
              <strong>Wrong Network:</strong> Wallet connected to unsupported chain. Please switch to <strong>{targetChainName}</strong> (Chain ID: {targetChainId}).
            </span>
            <button
              type="button"
              onClick={switchToTargetNetwork}
              className="ml-auto px-3 py-1 bg-[#FFFFFF] border border-[#E2E6EC] text-[#C2610C] hover:bg-[#F4F6F9] font-medium rounded-[6px] text-xs transition-colors cursor-pointer shrink-0"
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* ── Full-Width White Editorial Navbar ───────────────── */}
      <header className="sticky top-0 z-50 w-full bg-[#FFFFFF] border-b border-[#E2E6EC] no-print">
        <div className="w-full max-w-[1760px] mx-auto px-[clamp(16px,3vw,56px)] pl-[max(env(safe-area-inset-left,0px),clamp(16px,3vw,56px))] pr-[max(env(safe-area-inset-right,0px),clamp(16px,3vw,56px))] h-16 flex items-center justify-between gap-4">
          
          {/* ── LEFT: Brand Logo & Wordmark ──────────────────── */}
          <div className="flex items-center gap-6 shrink-0">
            <Link 
              to="/" 
              className="flex items-center gap-3 py-1 px-0.5 select-none group transition-all duration-200"
              title="PolyLance - The Sovereign Labor Protocol"
            >
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-slate-50 border border-[#E2E6EC] group-hover:border-[#0047AB]/35 group-hover:bg-blue-50/40 shadow-xs transition-all duration-200">
                <PolyLanceLogo size={38} className="transition-transform duration-200 group-hover:scale-105 shrink-0" />
              </div>
              <span className="font-serif font-bold text-2xl sm:text-[26px] tracking-tight text-[#0B0B0C] leading-none">
                {isCertifiedPassDomain ? (
                  <>CertifiedPass</>
                ) : (
                  <>Poly<span className="text-[#0047AB]">Lance</span></>
                )}
              </span>
            </Link>
          </div>

          {/* ── CENTER: Desktop Navigation Tabs ──────────────── */}
          <nav className="hidden lg:flex items-center gap-1 font-sans h-16">
            {isCertifiedPassDomain ? (
              <>
                <NavItem
                  to="/verify"
                  active={location.pathname === '/' || location.pathname.startsWith('/verify') || location.pathname.startsWith('/certifiedpass')}
                  icon={<ShieldCheck size={15} strokeWidth={1.5} />}
                  label="Verify Certificate"
                />
                <NavItem
                  to="/reputation"
                  active={isActive('/reputation')}
                  icon={<Trophy size={15} strokeWidth={1.5} />}
                  label="Reputation"
                />
                <a
                  href="https://polylance.codes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-16 flex items-center gap-1.5 px-3 text-[13px] font-medium text-[#4B5563] hover:text-[#0B0B0C] transition-colors select-none"
                >
                  <Briefcase size={15} strokeWidth={1.5} />
                  <span>Escrow</span>
                  <ExternalLink size={12} strokeWidth={1.5} className="text-[#8892A0]" />
                </a>
              </>
            ) : !isUnlocked ? (
              <>
                {/* 1. Overview (Landing Page) */}
                <NavItem
                  to="/"
                  active={location.pathname === '/' || location.pathname === '/overview'}
                  icon={<Briefcase size={15} strokeWidth={1.5} />}
                  label="Overview"
                />

                {/* 2. Find Jobs */}
                <NavItem
                  to="/jobs"
                  active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')}
                  icon={<Search size={15} strokeWidth={1.5} />}
                  label="Find Jobs"
                />

                {/* 3. Reputation */}
                <NavItem
                  to="/reputation"
                  active={isActive('/reputation')}
                  icon={<Trophy size={15} strokeWidth={1.5} />}
                  label="Reputation"
                />

                {/* If connected with wallet but hasn't synced GitHub yet */}
                {isConnected && !isGithubSynced && (
                  <Link
                    to="/settings"
                    className="ml-2 px-3 py-1.5 rounded-[8px] text-xs font-medium flex items-center gap-1.5 select-none bg-[#FDF3DC] text-[#C2610C] border border-[#E2E6EC] hover:bg-[#F4F6F9] transition-colors"
                    title="Connect & Sync GitHub to unlock Dashboard, Job Workspace, and DAO"
                  >
                    <Lock size={12} strokeWidth={1.5} className="text-[#C2610C]" />
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
                  icon={<LayoutGrid size={15} strokeWidth={1.5} />}
                  label="Dashboard"
                />

                {/* 2. Job Workspace */}
                <NavItem
                  to="/workspace"
                  active={isActive('/workspace')}
                  icon={<Briefcase size={15} strokeWidth={1.5} />}
                  label="Workspace"
                />

                {/* 3. Find Jobs */}
                <NavItem
                  to="/jobs"
                  active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')}
                  icon={<Search size={15} strokeWidth={1.5} />}
                  label="Find Jobs"
                />

                {/* 4. Judge Panel (Only for Authorized Judges & Admins) */}
                {isJudgeUser && (
                  <NavItem
                    to="/judge"
                    active={isActive('/judge')}
                    icon={<Scale size={15} strokeWidth={1.5} />}
                    label="Judge Panel"
                  />
                )}

                {/* 5. DAO */}
                <NavItem
                  to="/dao"
                  active={isActive('/dao')}
                  icon={<Share2 size={15} strokeWidth={1.5} />}
                  label="DAO"
                />

                {/* 6. More Dropdown */}
                <div className="relative h-16 flex items-center" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(!isMoreOpen);
                      setIsAddressMenuOpen(false);
                      setIsAvatarMenuOpen(false);
                    }}
                    className={`
                      relative h-16 flex items-center gap-1.5 px-3.5 text-[13px] select-none cursor-pointer
                      transition-colors duration-150 whitespace-nowrap group
                      ${
                        isMoreActive
                          ? 'text-[#0047AB] font-bold'
                          : 'text-[#4B5563] hover:text-[#0047AB] font-medium'
                      }
                    `}
                  >
                    <MoreHorizontal
                      size={15}
                      strokeWidth={1.5}
                      className={isMoreActive ? 'text-[#0066FF]' : 'text-[#6B7280] group-hover:text-[#0047AB] transition-colors'}
                    />
                    <span>More</span>
                    <ChevronDown
                      size={12}
                      strokeWidth={1.5}
                      className={`text-[#8892A0] transition-transform duration-150 ${isMoreOpen ? 'rotate-180' : ''}`}
                    />

                    {isMoreActive && (
                      <div className="absolute -bottom-px left-0 right-0 pointer-events-none flex flex-col items-center">
                        <svg
                          viewBox="0 0 100 8"
                          preserveAspectRatio="none"
                          className="w-full h-[7px] overflow-visible"
                        >
                          <defs>
                            <linearGradient id="tabGrad-more" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#0047AB" />
                              <stop offset="50%" stopColor="#00D2FF" />
                              <stop offset="100%" stopColor="#0047AB" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 2 0 C 7 0, 10 3.5, 17 3.5 L 83 3.5 C 90 3.5, 93 0, 98 0"
                            fill="none"
                            stroke="url(#tabGrad-more)"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          />
                          <circle cx="50" cy="3.5" r="1.3" fill="#00E5FF" />
                        </svg>
                        <div className="w-[85%] h-2.5 -mt-0.5 rounded-full bg-[#0066FF]/40 blur-[6px] pointer-events-none" />
                      </div>
                    )}
                  </button>

                  {/* More Dropdown Menu */}
                  {isMoreOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 rounded-[10px] p-1.5 space-y-0.5 z-[100] bg-[#FFFFFF] border border-[#E2E6EC] shadow-[0_1px_2px_rgba(11,11,12,0.06)]">
                      <DropdownLink
                        to="/reputation"
                        icon={<Trophy size={14} strokeWidth={1.5} />}
                        label="SBT Reputation"
                        onClick={() => setIsMoreOpen(false)}
                      />
                      {(currentRole === 'client' || currentRole === 'admin') && (
                        <DropdownLink
                          to="/jobs/post"
                          icon={<PlusCircle size={14} strokeWidth={1.5} />}
                          label="Post a Job"
                          onClick={() => setIsMoreOpen(false)}
                        />
                      )}
                      {currentRole === 'admin' && (
                        <DropdownLink
                          to="/treasury"
                          icon={<Landmark size={14} strokeWidth={1.5} />}
                          label="Protocol Treasury"
                          onClick={() => setIsMoreOpen(false)}
                        />
                      )}
                      <DropdownLink
                        to="/chat"
                        icon={<MessageSquare size={14} strokeWidth={1.5} />}
                        label="Messages & Chat"
                        onClick={() => setIsMoreOpen(false)}
                      />
                      <DropdownLink
                        to={`/audit/${address || ''}`}
                        icon={<BarChart3 size={14} strokeWidth={1.5} />}
                        label="Security & Audit"
                        onClick={() => setIsMoreOpen(false)}
                      />
                      <DropdownLink
                        to="/attestation"
                        icon={<ShieldCheck size={14} strokeWidth={1.5} />}
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
                          className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] font-medium flex items-center gap-2.5 text-[#C2610C] hover:bg-[#F4F6F9] cursor-pointer transition-colors duration-150"
                        >
                          <Wrench size={14} strokeWidth={1.5} className="text-[#C2610C]" />
                          <span>{maintenanceState?.enabled ? 'Exit Maintenance' : 'Toggle Maintenance'}</span>
                        </button>
                      )}
                      <div className="border-t border-[#E2E6EC] my-1" />
                      <DropdownLink
                        to="/settings"
                        icon={<Settings size={14} strokeWidth={1.5} />}
                        label="Settings"
                        onClick={() => setIsMoreOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* ── RIGHT: Balance & Wallet & User Avatar ────────── */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isConnected && address ? (
              <>
                {/* Admin Maintenance Mode Indicator */}
                {isAdmin && maintenanceState?.enabled && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[#FAE4E1] text-[#C0392B] border border-[#E2E6EC]">
                    <Wrench size={12} strokeWidth={1.5} />
                    <span>Maintenance Active</span>
                  </span>
                )}

                {/* 1. Neutral Balance Chip (Matching Image 3) */}
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(true)}
                  title="View wallet token balances"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E6EC] text-[#0B0B0C] font-mono text-xs font-semibold hover:border-[#0047AB]/30 hover:bg-white transition-all duration-150 cursor-pointer shadow-2xs"
                >
                  <PolygonIcon size={14} className="text-[#7B3FE4]" />
                  <span>{formatPolBalance(balanceNative)} POL</span>
                </button>

                {/* 2. Neutral Wallet Address Chip with Hexagon Icon (Matching Image 3) */}
                <div className="relative" ref={addressMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddressMenuOpen(!isAddressMenuOpen);
                      setIsAvatarMenuOpen(false);
                      setIsMoreOpen(false);
                    }}
                    title="Address details"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FFFFFF] border border-[#E2E6EC] text-[#0B0B0C] font-mono text-xs font-semibold hover:border-[#0047AB]/30 hover:bg-[#F8FAFC] transition-all duration-150 cursor-pointer shadow-2xs"
                  >
                    <Hexagon size={13} strokeWidth={2} className="text-[#0047AB]" />
                    <span>{truncateAddress(address)}</span>
                    <ChevronDown
                      size={11}
                      strokeWidth={1.5}
                      className={`text-[#8892A0] transition-transform duration-150 ${isAddressMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Address Dropdown */}
                  {isAddressMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-64 rounded-[10px] p-2 z-[100] bg-[#FFFFFF] border border-[#E2E6EC] shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-1.5">
                      <div className="p-2.5 bg-[#F4F6F9] rounded-[8px]">
                        <div className="text-[11px] text-[#4B5563] font-medium mb-0.5">Connected Address</div>
                        <div className="text-xs font-mono font-medium text-[#0B0B0C] break-all select-all">
                          {address}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors duration-150 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {copied ? <Check size={14} strokeWidth={1.5} className="text-[#1E8449]" /> : <Copy size={14} strokeWidth={1.5} />}
                          {copied ? 'Copied to Clipboard' : 'Copy Address'}
                        </span>
                      </button>

                      <a
                        href={`https://polygonscan.com/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors duration-150"
                      >
                        <span className="flex items-center gap-2">
                          <ExternalLink size={14} strokeWidth={1.5} />
                          View on PolygonScan
                        </span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAddressMenuOpen(false);
                          setIsBalanceModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-medium text-[#0047AB] hover:bg-[#E7EEF9] transition-colors duration-150 cursor-pointer"
                      >
                        <Link2 size={14} strokeWidth={1.5} />
                        <span>View Token Balances</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. User Avatar */}
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
                    <div className="w-8 h-8 rounded-full bg-[#0B0B0C] text-white flex items-center justify-center overflow-hidden shrink-0 border border-[#E2E6EC]">
                      {rawAvatarUrl && !avatarImgError ? (
                        <img
                          src={rawAvatarUrl}
                          alt={displayName || 'User Avatar'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarImgError(true)}
                        />
                      ) : (
                        <span className="font-medium text-xs text-[#FFFFFF] select-none font-sans">
                          {userInitial}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={11}
                      strokeWidth={1.5}
                      className={`text-[#8892A0] transition-transform duration-150 ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Avatar Dropdown Menu */}
                  {isAvatarMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-56 rounded-[10px] p-2 z-[100] bg-[#FFFFFF] border border-[#E2E6EC] shadow-[0_1px_2px_rgba(11,11,12,0.06)] space-y-1">
                      <div className="flex items-center gap-2.5 p-2 bg-[#F4F6F9] rounded-[8px]">
                        <div className="w-8 h-8 rounded-full bg-[#0B0B0C] text-white flex items-center justify-center font-medium text-xs overflow-hidden shrink-0">
                          {rawAvatarUrl && !avatarImgError ? (
                            <img src={rawAvatarUrl} alt={displayName || 'User Avatar'} className="w-full h-full object-cover" />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#0B0B0C] truncate">
                            {displayName || truncateAddress(address)}
                          </div>
                          <div className="text-[11px] text-[#0047AB] font-medium capitalize">
                            {currentRole} Role
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#E2E6EC] my-1" />

                      <Link
                        to={`/profile/${address}`}
                        onClick={() => setIsAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                      >
                        <User size={14} strokeWidth={1.5} className="text-[#8892A0]" />
                        <span>View Profile</span>
                      </Link>

                      <Link
                        to="/workspace"
                        onClick={() => setIsAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                      >
                        <Briefcase size={14} strokeWidth={1.5} className="text-[#8892A0]" />
                        <span>Job Workspace</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                      >
                        <Settings size={14} strokeWidth={1.5} className="text-[#8892A0]" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-[#E2E6EC] my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          disconnectWallet();
                          setIsAvatarMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#C0392B] hover:bg-[#FAE4E1] transition-colors cursor-pointer"
                      >
                        <Power size={14} strokeWidth={1.5} />
                        <span>Disconnect Wallet</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-[#0047AB] hover:bg-[#003A8C] active:bg-[#002F73] text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-[8px] transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn size={14} strokeWidth={1.5} className="text-white" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              className="lg:hidden w-9 h-9 rounded-[8px] flex items-center justify-center text-[#0B0B0C] hover:bg-[#F4F6F9] border border-[#E2E6EC] transition-colors cursor-pointer select-none"
            >
              {isMobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Accessible Drawer ────────────────────────────── */}
        <Drawer
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          title={
            <div className="flex items-center gap-2.5">
              <PolyLanceLogo size={30} />
              <span className="font-serif font-bold text-[#0B0B0C] text-lg">
                Poly<span className="text-[#0047AB]">Lance</span>
              </span>
            </div>
          }
          side="right"
          footer={
            isConnected && address ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#F4F6F9] border border-[#E2E6EC]">
                  <div className="text-xs font-mono font-medium text-[#0B0B0C]">{truncateAddress(address)}</div>
                  <div className="text-xs font-mono font-medium text-[#0047AB]">{formatPolBalance(balanceNative)} POL</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    disconnectWallet();
                    setIsMobileOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-[8px] border border-[#E2E6EC] text-[#C0392B] font-medium text-xs hover:bg-[#FAE4E1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Power size={14} strokeWidth={1.5} />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#0047AB] hover:bg-[#003A8C] text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn size={15} strokeWidth={1.5} />
                <span>Connect Wallet</span>
              </button>
            )
          }
        >
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
            >
              <Briefcase size={16} strokeWidth={1.5} className="text-[#0047AB]" />
              <span>Overview</span>
            </Link>
            <Link
              to="/jobs"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
            >
              <Search size={16} strokeWidth={1.5} className="text-[#0047AB]" />
              <span>Find Jobs</span>
            </Link>
            <Link
              to="/reputation"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
            >
              <Trophy size={16} strokeWidth={1.5} className="text-[#0047AB]" />
              <span>Reputation</span>
            </Link>
            {isUnlocked && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                >
                  <LayoutGrid size={16} strokeWidth={1.5} className="text-[#0047AB]" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/workspace"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                >
                  <Briefcase size={16} strokeWidth={1.5} className="text-[#0047AB]" />
                  <span>Job Workspace</span>
                </Link>
                <Link
                  to="/dao"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                >
                  <Share2 size={16} strokeWidth={1.5} className="text-[#0047AB]" />
                  <span>DAO</span>
                </Link>
                {isJudgeUser && (
                  <Link
                    to="/judge"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium text-[#0B0B0C] hover:bg-[#F4F6F9] transition-colors"
                  >
                    <Scale size={16} strokeWidth={1.5} className="text-[#0047AB]" />
                    <span>Judge Panel</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </Drawer>
      </header>

      {/* Login & Wallet Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <WalletBalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} />
    </>
  );
};
export default Navbar;
