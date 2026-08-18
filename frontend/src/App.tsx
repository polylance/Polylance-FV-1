import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { PolyLanceDataProvider } from './context/PolyLanceDataContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Security } from './pages/Security';
import { Disclaimer } from './pages/Disclaimer';
import { Manifesto } from './pages/Manifesto';
import { pageVariants, transition } from './lib/motion';

// ── Apple-style page transition wrapper ────────────────────────────────────
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const { isConnected, currentRole } = useWeb3();
  const isVisitor = !isConnected || currentRole === 'visitor';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition.page}
        className="w-full"
        style={{ willChange: 'transform, opacity' }}
      >
        <Routes location={location}>
          {/* PUBLIC & PERCEPTION ACCESS ROUTES */}
          <Route path="/" element={<Landing />} />
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

          {/* ROLE PROTECTED OR PERCEPTION-GUIDED ROUTES */}
          <Route path="/onboarding" element={isVisitor ? <Navigate to="/login" replace /> : <Onboarding />} />
          <Route path="/dashboard" element={isVisitor ? <Navigate to="/login" replace /> : <Dashboard />} />
          <Route path="/dao" element={isVisitor ? <Navigate to="/login" replace /> : <Dao />} />
          <Route path="/analytics" element={isVisitor ? <Navigate to="/login" replace /> : <Analytics />} />
          <Route path="/jobs/post" element={currentRole === 'client' || currentRole === 'admin' || currentRole === 'judge' ? <PostJob /> : <Navigate to="/jobs" replace />} />
          <Route path="/judge" element={currentRole === 'judge' || currentRole === 'admin' ? <Judge /> : <Navigate to="/dashboard" replace />} />
          <Route path="/treasury" element={currentRole === 'admin' ? <Treasury /> : <Navigate to="/dashboard" replace />} />
          <Route path="/settings" element={isVisitor ? <Navigate to="/login" replace /> : <Settings />} />

          {/* Certified trust & reputation audits */}
          <Route path="/audit/:address" element={<AuditReport />} />

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
  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#111827] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Production Navbar with Role-Aware Perception Navigation */}
      <Navbar />

      {/* Main Application Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        <AnimatedRoutes />
      </main>

      {/* Global Unified Footer */}
      <Footer />
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
