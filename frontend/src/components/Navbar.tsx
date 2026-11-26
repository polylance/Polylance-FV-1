import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useAccountMode } from '../hooks/useAccountMode';
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
  Award,
  ShieldAlert,
  FileText,
  Lock,
  DollarSign,
  Layers,
  Edit3,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { truncateAddress, formatPolBalance, toChecksumAddress } from '../utils/formatters';
import { formatAmount } from '../utils/formatAmount';
import { Drawer } from './mobile/Drawer';
import { isJudgeAddress, isAdminAddress } from '../utils/adminGuard';
import { useBlogRole } from '../features/studio/hooks/useBlogRole';
import { PolygonLogo } from './brand/PolygonLogo';
import { Button } from './common/Button';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';
import { useNotifications } from '../utils/notifications';
import { Popover } from './overlay/Popover';
import { usePlatformFeeDues } from '../hooks/usePlatformFeeDues';
import { MORE_MENU_GROUPS } from '../config/navigation';
import { CategoriesMegaMenu } from './navigation/CategoriesMegaMenu';

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
  const { accountMode, isClientAllowed } = useAccountMode();
  const isAdmin = address ? isAdminAddress(address) : false;
  const location = useLocation();
  const navigate = useNavigate();

  const isCertifiedPassDomain =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'certifiedpass.polylance.codes' ||
      window.location.hostname.startsWith('certifiedpass.'));

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const { dues: feeDues, enabled: feeDuesEnabled } = usePlatformFeeDues();
  const hasPlatformFeesDue = feeDuesEnabled && feeDues.some(d => d.status === 'DUE' || d.status === 'PAYMENT_PENDING');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchCollapseRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Server-verified blog role for Studio menu item and TEAM badge
  const { hasAccess: hasStudioAccess, badgeLabel: blogBadgeLabel, checkFreshness: checkBlogRoleFreshness } = useBlogRole();
  const moreTriggerBtnRef = useRef<HTMLButtonElement>(null);


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

  const handleMoreNavigate = (path: string) => {
    setIsMoreOpen(false);
    navigate(path);
  };

  const handleAvatarNavigate = (path: string) => {
    setIsAvatarMenuOpen(false);
    navigate(path);
  };

  useEffect(() => {
    setIsMobileOpen(false);
    setIsMoreOpen(false);
    setIsNotificationsOpen(false);
    setIsAvatarMenuOpen(false);
  }, [location.pathname]);

  // Scroll progress for top indicator (2px cobalt bar) and secondary strip hide-on-scroll-down
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hideSubStrip, setHideSubStrip] = useState(false);
  const lastScrollYRef = useRef(0);

  const navbarWrapperRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const compactSearchRef = useRef<HTMLInputElement>(null);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  // Global platform-aware search keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 1280 && desktopSearchRef.current) {
          desktopSearchRef.current.focus();
        } else {
          setIsSearchOpen(true);
          setTimeout(() => {
            compactSearchRef.current?.focus();
          }, 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ResizeObserver to dynamically update --navbar-height and --nav-h on html
  useEffect(() => {
    const el = navbarWrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateHeight = () => {
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
        document.documentElement.style.setProperty('--nav-h', `${height}px`);
      }
    };

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(el);
    updateHeight();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const scrolled = y > 20;
      setIsScrolled(scrolled);

      setHideSubStrip(y > 60);
      lastScrollYRef.current = y;

      const navEl = navbarWrapperRef.current;
      const navHeight = navEl ? navEl.getBoundingClientRect().height : 64;
      document.documentElement.style.setProperty('--nav-h', `${navHeight}px`);
      document.documentElement.style.setProperty('--navbar-height', `${navHeight}px`);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (y / docHeight) * 100)));
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
    MORE_MENU_GROUPS.some((g) =>
      g.items.some((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/')))
    );

  const handleMoreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const menuEl = document.getElementById('more-menu-dropdown');
      if (!menuEl) return;
      const items = Array.from(menuEl.querySelectorAll<HTMLButtonElement>('button[data-menu-item="true"]'));
      if (items.length === 0) return;
      const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex = 0;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex >= 0 && currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      }
      items[nextIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsMoreOpen(false);
      moreTriggerBtnRef.current?.focus();
    }
  };

  const isAuditPage =
    location.pathname.startsWith('/audit') && !location.pathname.includes('attestation');
  if (isAuditPage) {
    return (
      <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-[#E5E7EB] no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
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
          <div className="flex items-center gap-2 w-full px-4 sm:px-6 lg:px-8">
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

      {/* Main Top Bar: h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 */}
      <header
        ref={navbarWrapperRef}
        className="sticky top-0 z-50 w-full no-print relative"
      >
        <div
          className={`relative h-16 border-b border-slate-200/80 transition-[background-color,backdrop-filter,box-shadow] duration-200 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(15,23,42,0.05)]'
              : 'bg-white/95 backdrop-blur-md'
          }`}
        >
          {/* 2px Animated Royal Blue Scroll Progress Bar along Bottom Edge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A52B8] origin-left transition-transform duration-75 ease-out z-50 pointer-events-none"
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, scrollProgress / 100))})` }}
            role="progressbar"
            aria-label="Page scroll progress"
            aria-valuenow={Math.round(scrollProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 min-w-0">

            {/* LEFT: Logo + Prominent Inline Search Bar */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 flex-1 min-w-0">
              <Link
                to="/"
                className="flex items-center gap-1.5 sm:gap-2.5 select-none group shrink-0 whitespace-nowrap"
                title="PolyLance Home"
              >
                <PolyLanceLogo size={28} />
                <span
                  className="font-bold text-[15.5px] sm:text-[20px] text-[#0F172A] select-none leading-none shrink-0 whitespace-nowrap"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  PolyLance
                </span>
              </Link>

              {/* Inline Marketplace Search Bar (md+) */}
              <form
                onSubmit={handleSearchSubmit}
                className="hidden md:flex items-center flex-1 max-w-[440px] min-w-[200px] relative"
              >
                <input
                  ref={desktopSearchRef}
                  type="text"
                  placeholder="What service or Web3 skill are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-12 text-[13.5px] text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A52B8]/25 focus:border-[#0A52B8] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  aria-label="Search services"
                  className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-[#0A52B8] hover:bg-[#084298] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Search size={15} />
                </button>
              </form>
            </div>

            {/* RIGHT NAVIGATION + ACTIONS: Find Jobs, Post a Job, Workspace, More, Wallet & Profile */}
            <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 min-w-0">
              <nav className="hidden lg:flex items-center gap-0.5 font-sans h-16 min-w-0 shrink">
                <NavItem to="/jobs" active={isActive('/jobs') && !isActive('/jobs/post') && !isActive('/workspace')} label="Find Jobs" />
                {isConnected ? (
                  <>
                    <NavItem to="/workspace" active={isActive('/workspace')} label="Workspace" />
                    {isClientAllowed && (
                      <Link
                        to="/jobs/post"
                        className="mx-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A52B8] hover:bg-[#084298] text-white text-[13.5px] font-semibold whitespace-nowrap shrink-0 transition-colors h-9"
                      >
                        <PlusCircle size={14} className="shrink-0" />
                        <span>Post a Job</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <NavItem to="/jobs/post" active={isActive('/jobs/post')} label="Post a Job" />
                )}

                <NavItem to="/community" active={isActive('/community')} label="Community" />

                <div className="hidden xl:flex items-center h-16">
                  <CategoriesMegaMenu />
                </div>

                {/* More Dropdown */}
                <div className="relative h-16 flex items-center shrink-0" ref={moreRef}>
                  <button
                    ref={moreTriggerBtnRef}
                    type="button"
                    id="more-menu-button"
                    aria-haspopup="true"
                    aria-expanded={isMoreOpen}
                    aria-controls="more-menu-dropdown"
                    onClick={() => {
                      const nextOpen = !isMoreOpen;
                      setIsMoreOpen(nextOpen);
                      if (nextOpen) {
                        checkBlogRoleFreshness();
                        setIsNotificationsOpen(false);
                        setIsAvatarMenuOpen(false);
                      }
                    }}
                    className={`relative h-16 flex items-center gap-1 px-2.5 text-[14px] select-none transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      isMoreActive
                        ? 'text-[#0A52B8] font-semibold'
                        : 'text-[#475569] hover:text-[#0F172A] font-medium'
                    }`}
                  >
                    <span>More</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-150 ${isMoreOpen ? 'rotate-180' : ''}`}
                    />
                    {isMoreActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A52B8]" />
                    )}
                  </button>

                  {/* Grouped More Dropdown */}
                  <Popover
                    isOpen={isMoreOpen}
                    onClose={() => {
                      setIsMoreOpen(false);
                      moreTriggerBtnRef.current?.focus();
                    }}
                    triggerRef={moreRef}
                    width={280}
                    align="start"
                  >
                    <div
                      id="more-menu-dropdown"
                      role="menu"
                      aria-labelledby="more-menu-button"
                      data-lenis-prevent="true"
                      className="p-2 divide-y divide-[#E2E5EA] overflow-y-auto overscroll-contain max-h-[calc(100dvh-var(--navbar-height,64px)-16px)] min-h-0"
                      onKeyDown={handleMoreKeyDown}
                    >
                      {MORE_MENU_GROUPS.map((group) => (
                        <div key={group.id} className="py-1">
                          <h4 className="px-3 py-1 text-[12px] font-semibold text-[#4B5563] uppercase tracking-[0.05em]">
                            {group.title}
                          </h4>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const itemActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
                            return (
                              <button
                                key={item.id}
                                type="button"
                                role="menuitem"
                                data-menu-item="true"
                                onClick={() => handleMoreNavigate(item.to)}
                                className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-[14px] transition-colors cursor-pointer ${
                                  itemActive
                                    ? 'text-[#0047AB] bg-[#EAF1FB] font-semibold'
                                    : 'text-[#0B0B0C] hover:bg-[#F5F6F8] font-medium'
                                }`}
                              >
                                <Icon size={14} className={itemActive ? 'text-[#0047AB]' : 'text-[#4B5563]'} />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </Popover>
                </div>
              </nav>

              {/* Mobile Compact Search Trigger (< md) */}
              <div className="flex md:hidden items-center shrink-0" ref={searchCollapseRef}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Search jobs"
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#475569] hover:text-[#0F172A] hover:bg-slate-50 border border-slate-200 transition-colors relative cursor-pointer"
                  title={`Search jobs (${shortcutLabel})`}
                >
                  <Search size={16} />
                </button>
                <Popover
                  isOpen={isSearchOpen}
                  onClose={() => setIsSearchOpen(false)}
                  triggerRef={searchCollapseRef}
                  width={290}
                  align="end"
                >
                  <div className="p-2.5">
                    <form
                      onSubmit={(e) => {
                        handleSearchSubmit(e);
                        setIsSearchOpen(false);
                      }}
                      className="relative w-full"
                    >
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                      />
                      <input
                        ref={compactSearchRef}
                        type="text"
                        autoFocus
                        placeholder="Search services or Web3 skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] pl-8 pr-3 py-1.5 text-xs text-[#0B0B0F] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0A52B8] focus:bg-white transition-all"
                      />
                    </form>
                  </div>
                </Popover>
              </div>
            {isConnected && (
              <>
                {/* Messages icon button (icon-only) */}
                <Link
                  to="/chat"
                  aria-label="Messages"
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#0B0B0C] hover:bg-[#F5F6F8] border border-[#E2E5EA] transition-colors relative shrink-0"
                  title="Messages"
                >
                  <MessageSquare size={16} />
                </Link>

                {/* Notifications bell icon button (icon-only) */}
                <NotificationErrorBoundary>
                  <div className="relative shrink-0" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsMoreOpen(false);
                        setIsAvatarMenuOpen(false);
                      }}
                      aria-label="Notifications"
                      className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[#0B0B0C] hover:bg-[#F5F6F8] border border-[#E2E5EA] transition-colors relative"
                      title="Notifications"
                    >
                      <Bell size={16} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0047AB]" />
                      )}
                    </button>

                    {/* Notifications Popover */}
                    <Popover
                      isOpen={isNotificationsOpen}
                      onClose={() => setIsNotificationsOpen(false)}
                      triggerRef={notificationsRef}
                      width={380}
                      align="end"
                    >
                      <div className="flex flex-col max-h-[460px]">
                        {/* Sticky Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-white shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0B0B0F]">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-[6px] bg-[#EAF1FB] text-[#0047AB] font-semibold">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllAsRead}
                              className="text-xs text-[#0047AB] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <CheckCheck size={13} />
                              <span>Mark all as read</span>
                            </button>
                          )}
                        </div>

                        {/* Scrollable list with keyboard and wheel containment */}
                        <div
                          tabIndex={0}
                          role="region"
                          aria-label="Notifications list"
                          data-lenis-prevent="true"
                          className="overflow-y-auto overscroll-contain divide-y divide-[#E5E7EB] max-h-[360px] min-h-0 focus:outline-none custom-scrollbar"
                        >
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-xs text-[#6B7280]">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <Link
                                key={notif.id}
                                to={notif.link}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  setIsNotificationsOpen(false);
                                }}
                                className={`block p-3.5 hover:bg-[#F6F7F9] transition-colors ${
                                  !notif.isRead ? 'bg-[#EAF1FB]/30' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {!notif.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-[#0047AB] shrink-0" />
                                    )}
                                    <span className="text-xs font-semibold text-[#0B0B0F] truncate">
                                      {notif.title}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#6B7280] shrink-0 font-mono">
                                    {notif.timeAgo}
                                  </span>
                                </div>
                                <p className="text-xs text-[#4B5563] mt-1 line-clamp-2 leading-relaxed">
                                  {notif.description}
                                </p>
                              </Link>
                            ))
                          )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="sticky bottom-0 z-10 px-4 py-2.5 border-t border-[#E5E7EB] bg-[#F6F7F9] flex items-center justify-between text-xs text-[#6B7280] shrink-0">
                          <span className="font-mono">{notifications.length} updates</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              navigate('/jobs');
                            }}
                            className="text-xs text-[#0047AB] font-medium hover:underline cursor-pointer"
                          >
                            Browse marketplace
                          </button>
                        </div>
                      </div>
                    </Popover>
                  </div>
                </NotificationErrorBoundary>

                {/* Wallet Balance Chip */}
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(true)}
                  title={hasPlatformFeesDue ? "Platform fees due — view balances" : "View token balances"}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#F5F6F8] border border-[#E2E5EA] text-[#0B0B0C] font-sans text-[14px] font-semibold hover:bg-white transition-colors h-9 shrink-0 whitespace-nowrap cursor-pointer relative"
                >
                  <PolygonLogo variant="mark" size={14} className="shrink-0" />
                  <span className="tabular-amount shrink-0 whitespace-nowrap">
                    {formatAmount(balanceNative, 'POL', { isBalance: true }).formatted}
                    <span className="font-normal text-[#4B5563] ml-1 shrink-0 whitespace-nowrap">POL</span>
                  </span>
                  {hasPlatformFeesDue && (
                    <span className="w-2 h-2 rounded-full bg-[#B1122B] ml-0.5 shrink-0" title="Platform fees due" />
                  )}
                </button>
              </>
            )}

            {/* Account Menu / Connect Button States */}
            {isWrongNetwork ? (
              <Button
                variant="secondary"
                size="md"
                onClick={switchToTargetNetwork}
                className="border-[#0047AB] text-[#0047AB] bg-[#EAF1FB] hover:bg-[#C9DAF2] shrink-0 whitespace-nowrap"
                icon={<AlertTriangle size={15} className="text-[#0047AB] shrink-0" />}
              >
                <span className="shrink-0 whitespace-nowrap">Switch to Polygon</span>
              </Button>
            ) : isConnecting ? (
              <Button variant="primary" size="md" loading disabled className="shrink-0 whitespace-nowrap">
                Connecting...
              </Button>
            ) : isConnected && address ? (
              <div className="relative shrink-0" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isAvatarMenuOpen;
                    setIsAvatarMenuOpen(nextOpen);
                    if (nextOpen) {
                      checkBlogRoleFreshness();
                    }
                    setIsMoreOpen(false);
                    setIsNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] transition-colors h-9 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0B0B0F] text-white flex items-center justify-center overflow-hidden text-xs font-semibold shrink-0">
                    {rawAvatarUrl && !avatarImgError ? (
                      <img
                        src={rawAvatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover shrink-0"
                        onError={() => setAvatarImgError(true)}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <span className="font-mono text-[12px] font-medium text-[#0B0B0C] hidden xl:inline shrink-0 whitespace-nowrap">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#6B7280] shrink-0 transition-transform ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Account Menu Popover */}
                <Popover
                  isOpen={isAvatarMenuOpen}
                  onClose={() => setIsAvatarMenuOpen(false)}
                  triggerRef={avatarMenuRef}
                  width={280}
                  align="end"
                >
                  <div data-lenis-prevent="true" className="p-3 space-y-2.5 overflow-y-auto overscroll-contain max-h-[380px] min-h-0">
                    {/* User Info Header */}
                    <div className="p-2.5 bg-[#F6F7F9] rounded-[8px] border border-[#E5E7EB]">
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
                          className="text-xs text-[#0047AB] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Hire / Work Segmented Switch */}
                    <div className="p-1 bg-[#F6F7F9] rounded-[8px] flex items-center border border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={() => handleToggleMode('work')}
                        className={`flex-1 py-1 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
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
                        className={`flex-1 py-1 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
                          userMode === 'hire'
                            ? 'bg-white text-[#0047AB] shadow-xs'
                            : 'text-[#6B7280] hover:text-[#0B0B0F]'
                        }`}
                      >
                        Hire
                      </button>
                    </div>

                    <div className="border-t border-[#E5E7EB] my-1" />

                    {hasPlatformFeesDue && feeDues.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAvatarMenuOpen(false);
                          setIsBalanceModalOpen(true);
                        }}
                        className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#0047AB] bg-[#EAF1FB] hover:bg-[#D4E4FA] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-[#0047AB]" />
                          <span>Platform fees due</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold">
                          {feeDues[0].outstanding} {feeDues[0].token} ({feeDues.length} {feeDues.length === 1 ? 'job' : 'jobs'})
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAvatarNavigate('/dashboard')}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-[14px] font-medium text-[#0B0B0C] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                    >
                      <BarChart3 size={14} className="text-[#0047AB]" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAvatarNavigate(`/profile/${address}`)}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-[14px] font-medium text-[#0B0B0C] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                    >
                      <User size={14} className="text-[#4B5563]" />
                      <span>View Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAvatarNavigate('/settings')}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
                    >
                      <Settings size={14} className="text-[#6B7280]" />
                      <span>Edit Profile & Settings</span>
                    </button>

                    {hasStudioAccess && (
                      <Link
                        to="/studio/blog"
                        onClick={() => setIsAvatarMenuOpen(false)}
                        className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0047AB] bg-[#0047AB]/5 hover:bg-[#0047AB]/10 transition-colors cursor-pointer border border-[#0047AB]/20"
                      >
                        <div className="flex items-center gap-2.5">
                          <Edit3 size={14} className="text-[#0047AB]" />
                          <span className="font-semibold">Blog Studio</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-[#0047AB] text-white px-1.5 py-0.5 rounded">
                          {blogBadgeLabel || 'Team'}
                        </span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAvatarNavigate('/help')}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9] transition-colors cursor-pointer"
                    >
                      <HelpCircle size={14} className="text-[#6B7280]" />
                      <span>Help & Support</span>
                    </button>

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
                </Popover>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsLoginModalOpen(true)}
                icon={<Wallet size={15} className="shrink-0" />}
                className="shrink-0 whitespace-nowrap"
              >
                <span className="shrink-0 whitespace-nowrap">Connect<span className="hidden sm:inline"> wallet</span></span>
              </Button>
            )}

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden w-10 h-10 rounded-[8px] flex items-center justify-center text-[#0B0B0F] hover:bg-[#F6F7F9] border border-[#E5E7EB] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-[transform,background-color] duration-150 cursor-pointer shrink-0"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          </div>
        </div>

        {/* Clean Secondary Discovery Strip (directly under main navbar, smoothly compacts on downward scroll) */}
        {(location.pathname === '/' || location.pathname === '/overview') && (
          <div
            className={`hidden md:block w-full bg-white border-b border-slate-100 overflow-hidden transition-all duration-200 ${
              hideSubStrip ? 'max-h-0 opacity-0 border-b-0' : 'max-h-11 opacity-100'
            }`}
          >
            <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10 h-11 flex items-center gap-6 overflow-x-auto no-scrollbar">
              {[
                { label: 'Featured Services', href: '/#categories' },
                { label: 'All Categories', href: '/categories', isRoute: true },
                { label: 'Community Hub', href: '/community', isRoute: true },
                { label: 'How It Solves', href: '/#what-is-polylance' },
                { label: 'AI & Web3 Experts', href: '/jobs?category=web3-blockchain', isRoute: true },
                { label: 'Escrow Protection', href: '/#guarantees' },
                { label: 'FAQ', href: '/#faq' },
              ].map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors whitespace-nowrap shrink-0"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>
          </div>
        )}

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
                to="/"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                Home
              </Link>
              {isConnected && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/jobs"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                Find Jobs
              </Link>
              <Link
                to="/categories"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9] flex items-center justify-between"
              >
                <span>Categories</span>
                <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#0047AB] px-1.5 py-0.5 rounded border border-[#BFDBFE]">10 Domains</span>
              </Link>
              <Link
                to="/community"
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0B0B0F] hover:bg-[#F6F7F9]"
              >
                Community Hub
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
                  {isClientAllowed && (
                    <Link
                      to="/jobs/post"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0047AB] bg-[#EFF6FF] hover:bg-[#DBEAFE]"
                    >
                      Post a Job
                    </Link>
                  )}
                </>
              )}
              {hasStudioAccess && (
                <Link
                  to="/studio/blog"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-2 rounded-[8px] text-sm font-medium text-[#0047AB] bg-[#0047AB]/5 hover:bg-[#0047AB]/10 flex items-center justify-between border border-[#0047AB]/20"
                >
                  <div className="flex items-center gap-2">
                    <Edit3 size={14} className="text-[#0047AB]" />
                    <span className="font-semibold">Blog Studio</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-[#0047AB] text-white px-1.5 py-0.5 rounded">
                    {blogBadgeLabel || 'Team'}
                  </span>
                </Link>
              )}

              {MORE_MENU_GROUPS.map((group) => (
                <div key={group.id} className="pt-2 border-t border-[#E5E7EB] mt-1 space-y-1">
                  <span className="px-3 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                    {group.title}
                  </span>
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        onClick={() => setIsMobileOpen(false)}
                        className="px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#0B0B0F] hover:bg-[#F6F7F9] flex items-center gap-2"
                      >
                        <IconComponent size={13} className="text-[#6B7280]" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
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
