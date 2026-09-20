import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { Judge } from './pages/Judge';
import { Treasury } from './pages/Treasury';
import { Analytics } from './pages/Analytics';
import { AuditReport } from './pages/AuditReport';
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
import { DevPrimitivesPage } from './pages/DevPrimitivesPage';
import { DevStatesPage } from './pages/DevStatesPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { pageVariants, transition } from './lib/motion';

// ── Apple-style page transition wrapper ────────────────────────────────────
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, currentRole } = useWeb3();
  const isVisitor = !isConnected || currentRole === 'visitor';

  // Social media deep link synchronization from search params
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const auditParam = searchParams.get('audit') || searchParams.get('audit-report');
      const attestationParam = searchParams.get('attestation') || searchParams.get('cert');
      const roleParam = searchParams.get('role');

      if (auditParam && !location.pathname.startsWith('/audit')) {
        navigate(`/audit/${auditParam}`, { replace: true });
      } else if (attestationParam && !location.pathname.startsWith('/attestation') && !location.pathname.includes('/attestation')) {
        navigate(`/attestation/${attestationParam}${roleParam ? `?role=${roleParam}` : ''}`, { replace: true });
      }
    } catch {}
  }, [location.pathname, navigate]);

  // Butter-smooth section change: reset scroll position cleanly to top
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition.page}
        className={location.pathname.startsWith('/chat') ? "w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden" : "w-full"}
        style={{ willChange: 'transform, opacity' }}
      >
        <Routes location={location}>
          {/* PUBLIC & PERCEPTION ACCESS ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route path="/overview" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<FindJobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/security" element={<Security />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/manifesto" element={<Manifesto />} />
          <Route path="/certifiedpass" element={<CertifiedPass />} />
          <Route path="/certified-pass" element={<CertifiedPass />} />
          <Route path="/dev/primitives" element={<DevPrimitivesPage />} />
          <Route path="/dev/states" element={<DevStatesPage />} />

          {/* ROLE PROTECTED OR PERCEPTION-GUIDED ROUTES */}
          <Route path="/onboarding" element={isVisitor ? <Navigate to="/login" replace /> : <Onboarding />} />
          <Route path="/dashboard" element={isVisitor ? <Navigate to="/login" replace /> : <Dashboard />} />
          <Route path="/dao" element={isVisitor ? <Navigate to="/login" replace /> : <Dao />} />
          <Route path="/analytics" element={isVisitor ? <Navigate to="/login" replace /> : <Analytics />} />
          <Route path="/jobs/post" element={isVisitor ? <Navigate to="/login" replace /> : <PostJob />} />
          <Route path="/judge" element={currentRole === 'judge' || currentRole === 'admin' ? <Judge /> : <Navigate to="/dashboard" replace />} />
          <Route path="/treasury" element={currentRole === 'admin' ? <Treasury /> : <Navigate to="/dashboard" replace />} />

          {/* Certified trust & reputation audits */}
          <Route path="/audit" element={<AuditReport />} />
          <Route path="/audit/:address" element={<AuditReport />} />
          <Route path="/audit-report" element={<AuditReport />} />
          <Route path="/audit-report/:address" element={<AuditReport />} />

          {/* Per-Job Soulbound Token (SBT) Attestation & Social Proof Reports */}
          <Route path="/jobs/:id/attestation" element={<JobAttestationReport />} />
          <Route path="/attestation/:id" element={<JobAttestationReport />} />
          <Route path="/attestation" element={<JobAttestationReport />} />

          {/* Settings & Profile Customization */}
          <Route path="/settings" element={isVisitor ? <Navigate to="/login" replace /> : <Settings />} />
          <Route path="/workspace" element={isVisitor ? <Navigate to="/login" replace /> : <JobWorkspace />} />

          {/* Chat & Negotiation messages */}
          <Route path="/chat" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />
          <Route path="/chat/:jobId" element={isVisitor ? <Navigate to="/login" replace /> : <Chat />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isAudit = location.pathname.startsWith('/audit');
  const showFooter = !isChat && !isAudit && (location.pathname === '/' || location.pathname === '/dashboard');

  return (
    <div className={isChat ? "h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#F6F9FC] text-[#111827] flex flex-col font-sans selection:bg-purple-600 selection:text-white" : (isAudit ? "min-h-[100dvh] bg-[#E2E8F0]/40 text-[#111827] flex flex-col font-sans selection:bg-purple-600 selection:text-white" : "min-h-[100dvh] bg-[#F6F9FC] text-[#111827] flex flex-col font-sans selection:bg-purple-600 selection:text-white")}>
      {/* Production Navbar with Role-Aware Perception Navigation (Hidden on Audit Document) */}
      {!isAudit && <Navbar />}

      {/* Main Application Content */}
      <main className={isChat ? "flex-1 w-full min-h-0 overflow-hidden flex flex-col pb-16 lg:pb-0" : (isAudit ? "w-full p-0 m-0" : "flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 pb-24 lg:pb-6")}>
        <ErrorBoundary>
          <AnimatedRoutes />
        </ErrorBoundary>
      </main>

      {/* Footer ONLY on Dashboard and Landing Page */}
      {showFooter && <Footer />}

      {/* Mobile-only Authenticated dApp Bottom Tab Bar (Hidden on Audit Document) */}
      {!isAudit && <BottomTabBar />}
    </div>
  );
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <PolyLanceDataProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </PolyLanceDataProvider>
    </Web3Provider>
  );
};

export default App;
