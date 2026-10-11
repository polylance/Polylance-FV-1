import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  User,
  Power,
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
  Menu,
  X,
  Bell,
  HelpCircle,
  Wrench,
  CheckCheck,
  Play,
  Wallet,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { truncateAddress, formatPolBalance, toChecksumAddress } from '../utils/formatters';
import { Drawer } from './mobile/Drawer';
import { isJudgeAddress, isAdminAddress } from '../utils/adminGuard';
import { PolygonLogo } from './brand/PolygonLogo';
import { Button } from './common/Button';
import { useNotifications } from '../utils/notifications';

interface NavItemProps {
  to: string;
  active: boolean;
  icon?: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, active, icon, label }) => {
  return (
    <Link
      to={to}
      className={`relative h-16 flex items-center gap-1.5 px-3 text-sm select-none transition-colors duration-150 whitespace-nowrap ${
        active
          ? 'text-[#0047AB] font-semibold'
          : 'text-[#4B5563] hover:text-[#0B0B0F] font-medium'
      }`}
    >
      {icon && (
        <span className={`shrink-0 ${active ? 'text-[#0047AB]' : 'text-[#6B7280]'}`}>
          {icon}
        </span>
      )}
      <span>{label}</span>
      {/* Flat 2px cobalt underline */}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0047AB]" />
      )}
    </Link>
  );
};

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
  const { isConnecting } = useAccount();

  const isJudgeUser =
    (currentRole === 'judge' || currentRole === 'admin') &&
    Boolean(
      isArbitrator ||
        (address && (isJudgeAddress(address) || isAdminAddress(address)))
    );

  const { profiles, maintenanceState, toggleMaintenanceMode } = usePolyLanceData();
  const isAdmin = address ? isAdminAddress(address) : false;
  const location = useLocation();
  const navigate = useNavigate();

  const isCertifiedPassDomain =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'certifiedpass.polylance.codes' ||
      window.location.hostname.startsWith('certifiedpass.'));

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mode: 'work' | 'hire' (persisted in localStorage)
  const [userMode, setUserMode] = useState<'work' | 'hire'>(() => {
    try {
      const saved = localStorage.getItem('polylance_user_mode');
      if (saved === 'hire' || saved === 'work') return saved;
      return currentRole === 'client' ? 'hire' : 'work';
    } catch {
      return 'work';
    }
  });

  const handleToggleMode = (mode: 'work' | 'hire') => {
    setUserMode(mode);
    try {
      localStorage.setItem('polylance_user_mode', mode);
      window.dispatchEvent(new Event('polylance_mode_change'));
    } catch {}
  };

  const moreRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Find user profile from context
  const userProfileKey = address
    ? Object.keys(profiles).find((k) => k.toLowerCase() === address.toLowerCase())
    : null;
  const currentProfile = userProfileKey ? profiles[userProfileKey] : null;

  const rawAvatarUrl =
    currentProfile?.avatarUrl ||
    (currentProfile?.githubUsername
      ? `https://github.com/${currentProfile.githubUsername}.png`
      : '');

  useEffect(() => {
    setAvatarImgError(false);
  }, [address, rawAvatarUrl]);

  const displayName = currentProfile?.displayName || '';
  const userInitial = displayName
    ? displayName.trim()[0].toUpperCase()
    : address
    ? address.slice(2, 3).toUpperCase()
    : 'P';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreRef.current && !moreRef.current.contains(target)) setIsMoreOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(target))
        setIsNotificationsOpen(false);
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(target))
        setIsAvatarMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsMoreOpen(false);
    setIsNotificationsOpen(false);
    setIsAvatarMenuOpen(false);
  }, [location.pathname]);

  // Scroll progress for top indicator (2px cobalt bar) and navbar compact state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 8;
      setIsScrolled(scrolled);
      const navHeight = scrolled ? 68 : 80;
      document.documentElement.style.setProperty('--nav-h', `${navHeight}px`);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(toChecksumAddress(address));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  // "More" nav item must not appear active on pages that are not under it (e.g. /jobs/post).
  const isMoreActive =
    isMoreOpen ||
    ['/reputation', '/audit', '/attestation', '/dao', '/judge', '/treasury', '/help'].some(
      (path) => location.pathname.startsWith(path)
    );

  const isAuditPage =
    location.pathname.startsWith('/audit') && !location.pathname.includes('attestation');
  if (isAuditPage) {
    return (
      <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-[#E5E7EB] no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 select-none">
            <PolyLanceLogo size={32} />
            <span className="font-extrabold text-xl text-[#0B0B0F] tracking-[-0.02em]">
              {isCertifiedPassDomain ? 'CertifiedPass' : 'PolyLance'}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB] rounded-[8px] text-xs font-medium">
              <ShieldCheck size={14} className="text-[#0047AB]" />
              <span>Official Audit Report</span>
            </div>
            <Link
              to={isConnected ? '/dashboard' : '/jobs'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-white bg-[#0047AB] hover:bg-[#00388A] transition-colors"
            >
              <span>{isConnected ? 'Dashboard' : 'Find Jobs'}</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Wrong Network Alert Banner */}
      {isWrongNetwork && (
        <div className="bg-[#FFFBEB] border-b border-[#FDE68A] text-[#92400E] text-xs font-medium px-4 py-2 flex items-center justify-between no-print relative z-50">
          <div className="flex items-center gap-2 w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              <strong>Wrong Network:</strong> Wallet connected to unsupported chain. Please switch to <strong>{targetChainName}</strong> (Chain ID: {targetChainId}).
            </span>
            <button
              type="button"
              onClick={switchToTargetNetwork}
              className="ml-auto px-3 py-1 bg-white border border-[#E5E7EB] text-[#92400E] hover:bg-[#F6F7F9] font-medium rounded-[8px] text-xs transition-colors shrink-0"
            >
              Switch to Polygon
            </button>
          </div>
        </div>
      )}

      {/* Main Top Bar */}
      <header
        className={`sticky top-0 z-50 w-full no-print relative transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled
            ? 'h-[68px] bg-white shadow-[0_4px_16px_-4px_rgba(11,11,15,0.06),0_1px_3px_rgba(11,11,15,0.04)] border-b border-[#E5E7EB]'
            : 'h-20 bg-white border-b border-[#E5E7EB]'
        }`}
      >
        {/* 2px Cobalt Scroll Progress Bar */}
        <div 
          className="absolute top-0 left-0 h-[2px] bg-[#0047AB] transition-[width] duration-75 ease-out z-50 pointer-events-none"
          style={{ width: `${scrollProgress}%` }}
          role="progressbar"
          aria-label="Page scroll progress"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-full flex items-center justify-between gap-4">
          
          {/* LEFT: Logo & Wordmark */}
          <div className="flex items-center gap-6 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 select-none group"
              title="PolyLance - Sovereign Escrow Labor Protocol on Polygon"
            >
              <PolyLanceLogo size={36} />
              <span className="font-extrabold text-[23px] sm:text-[25px] tracking-[-0.02em] text-[#0B0B0F] select-none leading-none">
                PolyLance
              </span>
            </Link>
          </div>

          {/* CENTER-LEFT: Primary Navigation Links (Max 5) */}
          <nav className="hidden lg:flex items-center gap-1 font-sans h-full">
            {isConnected ? (
              <>
                <NavItem to="/dashboard" active={isActive('/dashboard')} label="Dashboard" />
                <NavItem to="/jobs" active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')} label="Find Jobs" />
                <NavItem to="/workspace" active={isActive('/workspace')} label="Workspace" />
                <NavItem to="/chat" active={isActive('/chat')} label="Messages" />
                {(currentRole === 'client' || userMode === 'hire') && (
                  <Link
                    to="/jobs/post"
                    className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-medium transition-colors"
                  >
                    <PlusCircle size={14} />
                    <span>Post a job</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <NavItem to="/" active={location.pathname === '/' || location.pathname === '/overview'} label="Home" />
                <NavItem to="/jobs" active={isActive('/jobs')} label="Find Jobs" />
                <NavItem to="/reputation" active={isActive('/reputation')} label="Reputation" />
              </>
            )}

            {/* More Dropdown */}
            <div className="relative h-16 flex items-center" ref={moreRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(!isMoreOpen);
                  setIsNotificationsOpen(false);
                  setIsAvatarMenuOpen(false);
                }}
                className={`relative h-16 flex items-center gap-1 px-3 text-sm select-none transition-colors duration-150 whitespace-nowrap ${
                  isMoreActive
                    ? 'text-[#0047AB] font-semibold'
                    : 'text-[#4B5563] hover:text-[#0B0B0F] font-medium'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-150 ${isMoreOpen ? 'rotate-180' : ''}`}
                />
                {isMoreActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0047AB]" />
                )}
              </button>

              {/* Grouped More Dropdown */}
              {isMoreOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-[12px] p-2 z-[100] bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.06)] divide-y divide-[#E5E7EB]">
                  {/* Group: Reputation */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Reputation
                    </div>
                    <Link
                      to="/reputation"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <Trophy size={14} className="text-[#6B7280]" />
                      <span>Leaderboard & Reputation</span>
                    </Link>
                    <Link
                      to="/attestation"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <ShieldCheck size={14} className="text-[#6B7280]" />
                      <span>Attestation Reports</span>
                    </Link>
                  </div>

                  {/* Group: Governance */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Governance
                    </div>
                    <Link
                      to="/dao"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <Share2 size={14} className="text-[#6B7280]" />
                      <span>DAO Governance</span>
                    </Link>
                    {isJudgeUser && (
                      <Link
                        to="/judge"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                      >
                        <Scale size={14} className="text-[#6B7280]" />
                        <span>Judge Panel</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/treasury"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                      >
                        <Landmark size={14} className="text-[#6B7280]" />
                        <span>Protocol Treasury</span>
                      </Link>
                    )}
                  </div>

                  {/* Group: Resources */}
                  <div className="py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Resources
                    </div>
                    <Link
                      to={`/audit/${address || ''}`}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <BarChart3 size={14} className="text-[#6B7280]" />
                      <span>Security & Audit</span>
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <HelpCircle size={14} className="text-[#6B7280]" />
                      <span>Help & FAQ</span>
                    </Link>
                    <Link
                      to="/demo"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <Play size={14} className="text-[#6B7280]" />
                      <span>Watch demo</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* GLOBAL SEARCH */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] pl-8 pr-3 py-1.5 text-xs text-[#0B0B0F] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:bg-white transition-all"
              />
            </form>
          </div>

          {/* RIGHT CONTROLS: Messages Icon | Bell Notifications | Wallet Balance | Account Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && (
              <>
                {/* Messages icon button */}
                <Link
                  to="/chat"
                  aria-label="Messages"
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9] border border-[#E5E7EB] transition-colors relative"
                  title="Messages"
                >
                  <MessageSquare size={16} />
                </Link>

                {/* Notifications bell with dropdown */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsMoreOpen(false);
                      setIsAvatarMenuOpen(false);
                    }}
                    aria-label="Notifications"
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9] border border-[#E5E7EB] transition-colors relative"
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0047AB]" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-[12px] p-3 z-[100] bg-white border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0B0B0F]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-[8px] bg-[#EFF6FF] text-[#0047AB] font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-xs text-[#0047AB] hover:underline flex items-center gap-1"
                          >
                            <CheckCheck size={13} />
                            <span>Mark all as read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB]">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-[#6B7280]">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 6).map((notif) => (
                            <Link
                              key={notif.id}
                              to={notif.link}
                              onClick={() => {
                                markAsRead(notif.id);
                                setIsNotificationsOpen(false);
                              }}
                              className={`block p-2.5 rounded-[8px] hover:bg-[#F6F7F9] transition-colors ${
                                !notif.isRead ? 'bg-[#EFF6FF]/40' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#0B0B0F]">
                                  {notif.title}
                                </span>
                                <span className="text-[11px] text-[#6B7280]">
                                  {notif.timeAgo}
                                </span>
                              </div>
                              <p className="text-xs text-[#4B5563] mt-0.5 line-clamp-2">
                                {notif.description}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Balance Chip with Official Polygon Logo */}
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(true)}
                  title="View token balances"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] font-mono text-xs font-semibold hover:bg-white transition-colors min-h-[44px]"
                >
                  <PolygonLogo variant="mark" size={14} />
                  <span>{formatPolBalance(balanceNative)} POL</span>
                </button>
              </>
            )}

            {/* Account Menu / Connect Button States */}
            {isWrongNetwork ? (
              <button
                type="button"
                onClick={switchToTargetNetwork}
                className="px-3.5 py-2 rounded-[10px] border border-amber-500 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Switch to Polygon</span>
              </button>
            ) : isConnecting ? (
              <Button variant="primary" size="md" loading disabled>
                Connecting...
              </Button>
            ) : isConnected && address ? (
              <div className="relative" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(!isAvatarMenuOpen);
                    setIsMoreOpen(false);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] transition-colors min-h-[44px]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0B0B0F] text-white flex items-center justify-center overflow-hidden text-xs font-semibold shrink-0">
                    {rawAvatarUrl && !avatarImgError ? (
                      <img
                        src={rawAvatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarImgError(true)}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#0B0B0F] hidden sm:inline">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#6B7280] transition-transform ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Account Menu Dropdown */}
                {isAvatarMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 rounded-[12px] p-2.5 z-[100] bg-white border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.08)] space-y-2">
                    {/* User Info Header */}
                    <div className="p-2.5 bg-[#F6F7F9] rounded-[8px]">
                      <div className="text-xs font-semibold text-[#0B0B0F] truncate">
                        {displayName || truncateAddress(address)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-xs text-[#6B7280]">
                          {truncateAddress(address)}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className="text-xs text-[#0047AB] hover:underline flex items-center gap-1"
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Hire / Work Segmented Switch */}
                    <div className="p-1 bg-[#F6F7F9] rounded-[8px] flex items-center">
                      <button
                        type="button"
                        onClick={() => handleToggleMode('work')}
                        className={`flex-1 py-1 text-xs font-medium rounded-[6px] transition-colors ${
                          userMode === 'work'
                            ? 'bg-white text-[#0047AB] shadow-xs'
                            : 'text-[#6B7280] hover:text-[#0B0B0F]'
                        }`}
                      >
                        Work
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleMode('hire')}
                        className={`flex-1 py-1 text-xs font-medium rounded-[6px] transition-colors ${
                          userMode === 'hire'
                            ? 'bg-white text-[#0047AB] shadow-xs'
                            : 'text-[#6B7280] hover:text-[#0B0B0F]'
                        }`}
                      >
                        Hire
                      </button>
                    </div>

                    <div className="border-t border-[#E5E7EB] my-1" />

                    <Link
                      to={`/profile/${address}`}
                      onClick={() => setIsAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <User size={14} className="text-[#6B7280]" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <Settings size={14} className="text-[#6B7280]" />
                      <span>Edit Profile & Settings</span>
                    </Link>

                    <Link
                      to="/help"
                      onClick={() => setIsAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                    >
                      <HelpCircle size={14} className="text-[#6B7280]" />
                      <span>Help & Support</span>
                    </Link>

                    <div className="border-t border-[#E5E7EB] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setIsAvatarMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#991B1B] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <Power size={14} />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="group relative overflow-hidden px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#0047AB] to-[#00388A] hover:from-[#00388A] hover:to-[#002C6C] active:scale-[0.98] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center gap-2 cursor-pointer min-h-[40px]"
              >
                <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]" aria-hidden="true">
                  <span className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </span>
                <Wallet size={15} className="relative z-10" />
                <span className="relative z-10">Connect wallet</span>
              </button>
            )}

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden w-11 h-11 rounded-[8px] flex items-center justify-center text-[#0B0B0F] hover:bg-[#F6F7F9] border border-[#E5E7EB] transition-colors cursor-pointer"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <PolyLanceLogo size={24} />
              <span className="font-semibold text-[#0B0B0F] text-base">PolyLance</span>
            </div>
          }
          side="right"
        >
          <div className="p-4 flex flex-col gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
              />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] pl-8 pr-3 py-2 text-xs"
              />
            </form>

            {/* Primary Nav */}
            <div className="flex flex-col gap-1">
              <Link
                to={isConnected ? '/dashboard' : '/'}
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                {isConnected ? 'Dashboard' : 'Overview'}
              </Link>
              <Link
                to="/jobs"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                Find Jobs
              </Link>
              {isConnected && (
                <>
                  <Link
                    to="/workspace"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                  >
                    Workspace
                  </Link>
                  <Link
                    to="/chat"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                  >
                    Messages
                  </Link>
                  <Link
                    to="/jobs/post"
                    onClick={() => setIsMobileOpen(false)}
                    className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0047AB] bg-[#EFF6FF] hover:bg-[#DBEAFE]"
                  >
                    Post a Job
                  </Link>
                </>
              )}
              <Link
                to="/reputation"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                Reputation
              </Link>
              <Link
                to="/dao"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                DAO Governance
              </Link>
              {isJudgeUser && (
                <Link
                  to="/judge"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                >
                  Judge Panel
                </Link>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
              {isConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    disconnectWallet();
                    setIsMobileOpen(false);
                  }}
                  className="w-full py-2.5 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] text-sm font-medium"
                >
                  Disconnect Wallet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-[8px] bg-[#0047AB] text-white text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </Drawer>
      </header>

      {/* Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <WalletBalanceModal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} />
    </>
  );
};
export default Navbar;
