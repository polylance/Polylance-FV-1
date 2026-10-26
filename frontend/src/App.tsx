import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { PolyLanceDataProvider } from './context/PolyLanceDataContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BottomTabBar } from './components/mobile';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { FindJobs } from './pages/FindJobs';
import { PostJob } from './pages/PostJob';
import { JobDetail } from './pages/JobDetail';
import { Profile } from './pages/Profile';
import { Reputation } from './pages/Reputation';
import { Dao } from './pages/Dao';
import { Analytics } from './pages/Analytics';
import { AuditReport } from './pages/AuditReport';
import { Certificate } from './pages/Certificate';
import { JobAttestationReport } from './pages/JobAttestationReport';
import { Chat } from './pages/Chat';
import { JobWorkspace } from './pages/JobWorkspace';
import { Settings } from './pages/Settings';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Security } from './pages/Security';
import { Disclaimer } from './pages/Disclaimer';
import { Manifesto } from './pages/Manifesto';
import { CertifiedPass } from './pages/CertifiedPass';
import { Help } from './pages/Help';
import {
  AuditXLandingPage,
  ScanWorkspacePage,
  UserReportsPage,
  ReportDetailPage,
  InternalReportPage
} from './features/auditx';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FeesPage } from './pages/FeesPage';
import { EscrowPage } from './pages/EscrowPage';
import { ForFreelancersPage } from './pages/ForFreelancersPage';
import { ForClientsPage } from './pages/ForClientsPage';
import { GetPaidInUsdcPage } from './pages/GetPaidInUsdcPage';
import { GetPaidInCryptoPage } from './pages/GetPaidInCryptoPage';
import { CategoryJobsHubPage } from './pages/CategoryJobsHubPage';
import { SkillPage } from './pages/SkillPage';

export const FOOTER_HIDDEN_ROUTES: string[] = ['/'];
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { BlogIndexPage } from './pages/BlogIndexPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthBanner } from './components/common/AuthBanner';

// Lazy-loaded privileged and lab routes to protect code bundles from untrusted callers
const Judge = React.lazy(() => import('./pages/Judge').then((m) => ({ default: m.Judge })));
const Treasury = React.lazy(() => import('./pages/Treasury').then((m) => ({ default: m.Treasury })));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage })));
const Demo = React.lazy(() => import('./pages/Demo').then((m) => ({ default: m.Demo })));
const Showcase = React.lazy(() => import('./pages/Showcase').then((m) => ({ default: m.Showcase })));
const MediaLab = React.lazy(() => import('./pages/MediaLab').then((m) => ({ default: m.MediaLab })));
const MotionLab = React.lazy(() => import('./pages/MotionLab').then((m) => ({ default: m.MotionLab })));
const TypeLab = React.lazy(() => import('./pages/TypeLab').then((m) => ({ default: m.TypeLab })));
const EmblemLab = React.lazy(() => import('./pages/EmblemLab').then((m) => ({ default: m.EmblemLab })));
const DevPrimitivesPage = React.lazy(() => import('./pages/DevPrimitivesPage').then((m) => ({ default: m.DevPrimitivesPage })));
const DevStatesPage = React.lazy(() => import('./pages/DevStatesPage').then((m) => ({ default: m.DevStatesPage })));
const NotFound = React.lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const BlogStudioPage = React.lazy(() => import('./features/studio/BlogStudioPage').then((m) => ({ default: m.BlogStudioPage })));
const BlogStudioGuard = React.lazy(() => import('./features/studio/components/BlogStudioGuard').then((m) => ({ default: m.BlogStudioGuard })));
const EscrowSimulatorPage = React.lazy(() => import('./pages/EscrowSimulatorPage').then((m) => ({ default: m.EscrowSimulatorPage })));


const RouteLoadingSpinner: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#0047AB]/20 border-t-[#0047AB] animate-spin" />
  </div>
);
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext';
import { DemoBanner } from './components/demo/DemoBanner';
import { GuidedTour } from './components/demo/GuidedTour';
import { VideoManagerProvider } from './media';
import { usePolyLanceData } from './context/PolyLanceDataContext';
import { isAdminAddress, isJudgeAddress } from './utils/adminGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { pageVariants, transition } from './lib/motion';
import { scrollToSection, extractTargetSection } from './utils/scroll';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { cleanupOrphanScrollLocks } from './utils/scrollLock';


import { useAccountMode } from './hooks/useAccountMode';
import { ToastContainer, ToastMessage } from './components/mobile/Toast';
import { subscribeToasts, toast } from './utils/toast';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';

// ── Human Interface page transition wrapper ───────────────────────────────
const isCertifiedPassDomain = typeof window !== 'undefined' &&
  (window.location.hostname === 'certifiedpass.polylance.codes' || window.location.hostname.startsWith('certifiedpass.'));

const PostJobRouteGuard: React.FC = () => {
  const { accountMode } = useAccountMode();
  React.useEffect(() => {
    if (accountMode === 'freelancer') {
      toast.error(
        'Posting jobs is turned off',
        'Your account is in Freelancer only mode. Switch to Client or Both in Settings to post jobs.'
      );
    }
  }, [accountMode]);

  if (accountMode === 'freelancer') {
    return <Navigate to="/settings" replace />;
  }
  return <PostJob />;
};

const GlobalToasts: React.FC = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  React.useEffect(() => {
    return subscribeToasts((newToast) => {
      setToasts((prev) => [...prev, newToast]);
    });
  }, []);
  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  return <ToastContainer toasts={toasts} onDismiss={handleDismiss} />;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, currentRole, address, isArbitrator } = useWeb3();
  const { isDemoMode } = useDemoMode();
  const { isAdmin: isServerAdmin, isJudge: isServerJudge } = useAuth();
  const isVisitor = (!isConnected || currentRole === 'visitor') && !isDemoMode;

  const isJudgeAllowed =
    isDemoMode ||
    isServerJudge ||
    isServerAdmin ||
    currentRole === 'judge' ||
    currentRole === 'admin' ||
    Boolean(isArbitrator) ||
    Boolean(address && (isJudgeAddress(address) || isAdminAddress(address)));

  const isTreasuryAllowed =
    isDemoMode ||
    isServerAdmin ||
    currentRole === 'admin' ||
    Boolean(address && isAdminAddress(address));

  // Immediate redirect for incoming legacy hash routes (e.g. #/find-jobs -> /find-jobs)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      const cleanPath = hash.slice(1);
      navigate(cleanPath, { replace: true });
    }
  }, [navigate]);

  // Social media deep link synchronization from search params & subdomain handling
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const auditParam = searchParams.get('audit') || searchParams.get('audit-report');
      const attestationParam = searchParams.get('attestation') || searchParams.get('cert');
      const certIdParam = searchParams.get('certId') || searchParams.get('id') || searchParams.get('q');
      const roleParam = searchParams.get('role');

      if (isCertifiedPassDomain) {
        document.title = "CertifiedPass — Proof of What You've Achieved | Verification Oracle";
      }

      if (auditParam && !location.pathname.startsWith('/audit')) {
        navigate(`/audit/${auditParam}`, { replace: true });
      } else if (attestationParam && !location.pathname.startsWith('/attestation') && !location.pathname.includes('/attestation')) {
        navigate(`/attestation/${attestationParam}${roleParam ? `?role=${roleParam}` : ''}`, { replace: true });
      } else if (certIdParam) {
        if (!location.pathname.startsWith('/verify') && !location.pathname.startsWith('/certifiedpass')) {
          navigate(`/verify?certId=${encodeURIComponent(certIdParam)}`, { replace: true });
        } else if (!location.search.includes('certId')) {
          navigate(`${location.pathname}?certId=${encodeURIComponent(certIdParam)}`, { replace: true });
        }
      }
    } catch { }
  }, [location.pathname, location.search, navigate]);

  // Butter-smooth section redirect & scroll management:
  // If target section is provided (via ?section=, #hash, or state), smoothly scroll into view; otherwise reset cleanly to top
  React.useEffect(() => {
    const targetSection = extractTargetSection(
      location.search,
      location.hash,
      location.state
    );

    if (targetSection) {
      scrollToSection(targetSection, 200);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.search, location.hash, location.state]);

  const isStudioEditor = location.pathname === '/studio/blog/new' || (location.pathname.startsWith('/studio/blog/') && location.pathname.endsWith('/edit'));
  const isConstrained = location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages') || isStudioEditor;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition.page}
        className={isConstrained ? "w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden" : "w-full"}
        style={{ willChange: 'transform, opacity' }}
      >
        <Routes location={location}>
          {/* PUBLIC & PERCEPTION ACCESS ROUTES */}
          {/* If accessed via certifiedpass.polylance.codes, root '/' defaults directly to CertifiedPass */}
          <Route path="/" element={isCertifiedPassDomain ? <CertifiedPass /> : <Landing />} />
          <Route path="/overview" element={isCertifiedPassDomain ? <CertifiedPass /> : <Landing />} />
          <Route path="/verify" element={<CertifiedPass />} />
          <Route path="/verify/:certId" element={<CertifiedPass />} />
          <Route path="/certifiedpass" element={<CertifiedPass />} />
          <Route path="/certified-pass" element={<CertifiedPass />} />
          <Route path="/c/:id" element={<Certificate />} />
          <Route path="/certificate/:id" element={<Certificate />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<FindJobs />} />
          <Route path="/find-jobs" element={<FindJobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/freelancers/:handle" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/manifesto" element={<Manifesto />} />
          {/* AuditX Public Landing, User Scanning Workspace, User Reports & Admin Internal Report */}
          <Route path="/auditx" element={<AuditXLandingPage />} />
          <Route path="/audit-x" element={<Navigate to="/auditx" replace />} />
          <Route path="/auditx/scan" element={<ScanWorkspacePage />} />
          <Route path="/auditx/reports" element={<UserReportsPage />} />
          <Route path="/auditx/reports/:id" element={<ReportDetailPage />} />
          <Route path="/auditx/internal" element={<InternalReportPage />} />
          <Route path="/help" element={<Help />} />

          {/* SEO Content, Hubs, and Landing Pages */}
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/escrow" element={<EscrowPage />} />
          <Route path="/escrow-simulator" element={<React.Suspense fallback={<RouteLoadingSpinner />}><EscrowSimulatorPage /></React.Suspense>} />
          <Route path="/simulator" element={<Navigate to="/escrow-simulator" replace />} />
          <Route path="/for-freelancers" element={<ForFreelancersPage />} />
          <Route path="/for-clients" element={<ForClientsPage />} />
          <Route path="/get-paid-in-usdc" element={<GetPaidInUsdcPage />} />
          <Route path="/get-paid-in-crypto" element={<GetPaidInCryptoPage />} />
          <Route path="/upwork-alternative" element={<Navigate to="/how-it-works" replace />} />
          <Route path="/fiverr-alternative" element={<Navigate to="/how-it-works" replace />} />
          <Route path="/web3-jobs" element={<CategoryJobsHubPage />} />
          <Route path="/polygon-jobs" element={<CategoryJobsHubPage />} />
          <Route path="/solidity-developer-jobs" element={<CategoryJobsHubPage />} />
          <Route path="/smart-contract-developer-jobs" element={<CategoryJobsHubPage />} />
          <Route path="/dapp-developer-jobs" element={<CategoryJobsHubPage />} />
          <Route path="/skills/:skill" element={<SkillPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
          <Route path="/support" element={<Navigate to="/contact" replace />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          {import.meta.env.DEV && (
            <>
              <Route path="/demo" element={<React.Suspense fallback={<RouteLoadingSpinner />}><Demo /></React.Suspense>} />
              <Route path="/showcase" element={<React.Suspense fallback={<RouteLoadingSpinner />}><Showcase /></React.Suspense>} />
              <Route path="/media-lab" element={<React.Suspense fallback={<RouteLoadingSpinner />}><MediaLab /></React.Suspense>} />
              <Route path="/motion-lab" element={<React.Suspense fallback={<RouteLoadingSpinner />}><MotionLab /></React.Suspense>} />
              <Route path="/type-lab" element={<React.Suspense fallback={<RouteLoadingSpinner />}><TypeLab /></React.Suspense>} />
              <Route path="/emblem-lab" element={<React.Suspense fallback={<RouteLoadingSpinner />}><EmblemLab /></React.Suspense>} />
              <Route path="/dev/primitives" element={<React.Suspense fallback={<RouteLoadingSpinner />}><DevPrimitivesPage /></React.Suspense>} />
              <Route path="/dev/states" element={<React.Suspense fallback={<RouteLoadingSpinner />}><DevStatesPage /></React.Suspense>} />
            </>
          )}

          {/* ROLE PROTECTED OR PERCEPTION-GUIDED ROUTES */}
          <Route path="/onboarding" element={isVisitor ? <Navigate to="/login" replace /> : <Onboarding />} />
          <Route path="/dashboard" element={isVisitor ? <Navigate to="/login" replace /> : <Dashboard />} />
          <Route path="/dao" element={isVisitor ? <Navigate to="/login" replace /> : <Dao />} />
          <Route path="/analytics" element={isVisitor ? <Navigate to="/login" replace /> : <Analytics />} />
          <Route path="/jobs/post" element={isVisitor ? <Navigate to="/login" replace /> : <PostJobRouteGuard />} />
          <Route path="/post-job" element={isVisitor ? <Navigate to="/login" replace /> : <PostJobRouteGuard />} />
          <Route
            path="/judge"
            element={
              isJudgeAllowed ? (
                <React.Suspense fallback={<RouteLoadingSpinner />}>
                  <Judge />
                </React.Suspense>
              ) : (
                <React.Suspense fallback={<RouteLoadingSpinner />}>
                  <NotFound />
                </React.Suspense>
              )
            }
          />
          <Route
            path="/treasury"
            element={
              isTreasuryAllowed ? (
                <React.Suspense fallback={<RouteLoadingSpinner />}>
                  <Treasury />
                </React.Suspense>
              ) : (
                <React.Suspense fallback={<RouteLoadingSpinner />}>
                  <NotFound />
                </React.Suspense>
              )
            }
          />

          {/* Certified trust & reputation audits */}
          <Route path="/audit" element={<AuditReport />} />
          <Route path="/audit/:address" element={<AuditReport />} />
          <Route path="/audit-report" element={<AuditReport />} />
          <Route path="/audit-report/:address" element={<AuditReport />} />

          {/* Per-Job Soulbound Token (SBT) Attestation & Social Proof Reports */}
          <Route path="/jobs/:id/attestation" element={<Certificate />} />
          <Route path="/attestation/:id" element={<Certificate />} />
          <Route path="/attestation" element={<JobAttestationReport />} />
          <Route path="/job-attestation-report/:id" element={<Certificate />} />
          <Route path="/job-attestation-report" element={<JobAttestationReport />} />

          {/* Settings & Profile Customization */}
          <Route path="/settings" element={isVisitor ? <Navigate to="/login" replace /> : <Settings />} />
          <Route path="/workspace" element={isVisitor ? <Navigate to="/login" replace /> : <JobWorkspace />} />

          {/* Chat & Negotiation messages */}
          <Route path="/chat" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />
          <Route path="/chat/:jobId" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />
          <Route path="/messages" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />
          <Route path="/messages/:jobId" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />

          {/* Standalone Maintenance Page route */}
          <Route path="/maintenance" element={<React.Suspense fallback={<RouteLoadingSpinner />}><MaintenancePage /></React.Suspense>} />

          {/* Blog Studio (Role-restricted internal authoring area with 3-state guard) */}
          <Route element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioGuard /></React.Suspense>}>
            <Route path="/studio/blog" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/blog/new" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/blog/:id/edit" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/blog/team" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/blog/media" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/blog/audit" element={<React.Suspense fallback={<RouteLoadingSpinner />}><BlogStudioPage /></React.Suspense>} />
            <Route path="/studio/*" element={<Navigate to="/studio/blog" replace />} />
          </Route>

          <Route
            path="*"
            element={
              isCertifiedPassDomain ? (
                <Navigate to="/certifiedpass" replace />
              ) : (
                <React.Suspense fallback={<RouteLoadingSpinner />}>
                  <NotFound />
                </React.Suspense>
              )
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  useSmoothScroll();
  const location = useLocation();
  const { maintenanceState, toggleMaintenanceMode } = usePolyLanceData();
  const { address } = useWeb3();
  const isAdmin = address ? isAdminAddress(address) : false;

  const [adminBypassed, setAdminBypassed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('polylance_admin_bypass') === 'true';
    }
    return false;
  });

  const handleAdminBypass = () => {
    setAdminBypassed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('polylance_admin_bypass', 'true');
    }
  };

  const handleExitBypass = () => {
    setAdminBypassed(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('polylance_admin_bypass');
    }
  };

  React.useEffect(() => {
    if (!maintenanceState?.enabled) {
      setAdminBypassed(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('polylance_admin_bypass');
      }
    }
  }, [maintenanceState?.enabled]);

  // Direct Route to /maintenance or full platform lock for non-admins
  const isMaintenanceRoute = location.pathname === '/maintenance';
  const isSiteLocked = Boolean(maintenanceState?.enabled && (!isAdmin || !adminBypassed));

  if (isMaintenanceRoute || isSiteLocked) {
    return <MaintenancePage onBypass={isAdmin ? handleAdminBypass : undefined} />;
  }

  const isChat = location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages');
  const isAudit = location.pathname.startsWith('/audit');
  const isStudio = location.pathname.startsWith('/studio');
  const isStudioEditor = location.pathname === '/studio/blog/new' || (location.pathname.startsWith('/studio/blog/') && location.pathname.endsWith('/edit'));
  const isViewportConstrained = isChat || isStudioEditor;
  const isFooterHidden = FOOTER_HIDDEN_ROUTES.includes(location.pathname);
  const showFooter = !isChat && !isAudit && !isStudio && !isFooterHidden;

  return (
    <div
      id="app"
      className={
        isViewportConstrained
          ? "relative z-1 h-[100dvh] max-h-[100dvh] overflow-hidden bg-transparent text-[#0B0B0C] flex flex-col font-sans selection:bg-[#E7EEF9] selection:text-[#0047AB]"
          : isAudit
            ? "relative z-1 min-h-[100dvh] bg-[#FFFFFF] text-[#0B0B0C] flex flex-col font-sans selection:bg-[#E7EEF9] selection:text-[#0047AB]"
            : "relative z-1 min-h-[100dvh] bg-transparent text-[#0B0B0C] flex flex-col font-sans selection:bg-[#E7EEF9] selection:text-[#0047AB]"
      }
    >
      {/* Admin Developer Bypass Notification Bar */}
      {maintenanceState?.enabled && isAdmin && (
        <div className="w-full bg-amber-500 text-slate-950 font-sans text-xs px-4 py-2 font-bold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm sticky top-0 z-[100] border-b border-amber-600">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-ping shrink-0" />
            <span>⚠️ Platform is currently under Maintenance Mode for regular users (writes locked). You have Developer Bypass access.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExitBypass}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              View Maintenance Screen
            </button>
            <button
              type="button"
              onClick={() => toggleMaintenanceMode(false)}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              Exit Maintenance Mode
            </button>
          </div>
        </div>
      )}

      {/* RPC Network Status Banner (displays when public RPCs degrade) */}
      <NetworkStatusBanner />

      {/* Production Navbar with Role-Aware Perception Navigation (Hidden on Audit Document and Chat/Messages Section) */}
      {!isAudit && !isChat && <Navbar />}

      {/* SIWE Authenticated Session Prompt Banner (rendered below navbar) */}
      {!isAudit && !isChat && <AuthBanner />}

      {/* Persistent Demo Mode Banner with Role Switcher & Tour Trigger */}
      {!isAudit && !isChat && <DemoBanner />}

      {/* Guided 8-Step Spotlight Product Tour */}
      <GuidedTour />

      {/* Main Application Content */}
      <main
        className={
          isChat
            ? "flex-1 w-full h-[100dvh] min-h-0 overflow-hidden flex flex-col p-0 m-0"
            : isAudit
              ? "w-full p-0 m-0"
              : isStudioEditor
                ? "flex-1 w-full h-full min-h-0 overflow-hidden flex flex-col p-0 m-0"
                : isFooterHidden || isStudio
                  ? "flex-1 w-full flex flex-col min-h-0 p-0 m-0"
                  : "flex-1 w-full flex flex-col min-h-0 pb-20 lg:pb-8"
        }
      >
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </main>

      {/* Footer ONLY on Dashboard and Landing Page */}
      {showFooter && <Footer />}

      {/* Mobile-only Authenticated dApp Bottom Tab Bar (Hidden on Audit Document and Chat/Messages Section) */}
      {!isAudit && !isChat && <BottomTabBar />}

      {/* Global Application Stacking Toasts */}
      <GlobalToasts />
    </div>
  );
};

const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  React.useEffect(() => {
    cleanupOrphanScrollLocks();
    // If navigating with a certificate ID or hash target, let the page handle smooth scroll to target
    const params = new URLSearchParams(search);
    const hasCertTarget = params.has('cert') || params.has('certId') || params.has('token') || params.has('tokenId');
    const isVerifyPath = pathname === '/certifiedpass' || pathname === '/certified-pass' || pathname.startsWith('/verify');
    if ((isVerifyPath && hasCertTarget) || hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);
  return null;
};

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <DemoModeProvider>
        <AuthProvider>
          <PolyLanceDataProvider>
            <VideoManagerProvider>
              <Router>
                <ScrollToTop />
                <AppContent />
              </Router>
            </VideoManagerProvider>
          </PolyLanceDataProvider>
        </AuthProvider>
      </DemoModeProvider>
    </Web3Provider>
  );
};

export default App;
