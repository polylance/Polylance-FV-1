import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { getBackendSyncUrl } from '../utils/backendUrl';
import { sharedPoller } from '../utils/sharedPoller';

export type NetworkSeverity = 'NORMAL' | 'SLOW' | 'DISRUPTED';

export interface PublicRpcHealth {
  success: boolean;
  status: 'healthy' | 'degraded' | 'down';
  isHealthy: boolean;
  currentBlock?: number;
  message?: string;
}

const DEGRADATION_SHOW_DELAY_MS = 60 * 1000; // 60 seconds continuous before showing
const RECOVERY_HIDE_DELAY_MS = 120 * 1000;    // 120 seconds sustained recovery before hiding
const DISMISSAL_DURATION_MS = 30 * 60 * 1000; // 30 minutes dismissal memory

export function useNetworkStatus() {
  const { address, isConnected } = useWeb3();
  const { jobs } = usePolyLanceData();
  const location = useLocation();

  const [rawHealth, setRawHealth] = useState<PublicRpcHealth>({
    success: true,
    status: 'healthy',
    isHealthy: true,
  });

  // Effective severity after applying 60s/120s hysteresis
  const [effectiveSeverity, setEffectiveSeverity] = useState<NetworkSeverity>('NORMAL');
  const [showRecoveryToast, setShowRecoveryToast] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(() => {
    try {
      return parseInt(sessionStorage.getItem('polylance_net_dismissed_until') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [dismissedSeverity, setDismissedSeverity] = useState<NetworkSeverity | null>(() => {
    try {
      return (sessionStorage.getItem('polylance_net_dismissed_level') as NetworkSeverity) || null;
    } catch {
      return null;
    }
  });

  // Track state transitions for hysteresis
  const candidateRef = useRef<NetworkSeverity>('NORMAL');
  const candidateSinceRef = useRef<number>(Date.now());
  const hasEverShownRef = useRef<boolean>(false);

  // Poll sanitized RPC health via sharedPoller
  useEffect(() => {
    let isMounted = true;

    const pollHealth = async () => {
      try {
        const syncUrl = getBackendSyncUrl();
        const data = await sharedPoller.fetchDeduplicated<PublicRpcHealth>(`${syncUrl}/api/health/rpc`, {}, {
          cacheTtlMs: 10000,
          skipIfHidden: true,
        });

        if (data && isMounted) {
          setRawHealth(data);
        }
      } catch {
        // Do not jump to degraded on transient client poll errors
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute candidate severity based on server status
  const currentCandidateSeverity: NetworkSeverity = useMemo(() => {
    if (rawHealth.status === 'down' || rawHealth.isHealthy === false) {
      return 'DISRUPTED';
    }
    if (rawHealth.status === 'degraded') {
      return 'SLOW';
    }
    return 'NORMAL';
  }, [rawHealth]);

  // Hysteresis engine (60s show delay, 120s recovery delay)
  useEffect(() => {
    if (currentCandidateSeverity !== candidateRef.current) {
      candidateRef.current = currentCandidateSeverity;
      candidateSinceRef.current = Date.now();
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - candidateSinceRef.current;

      if (candidateRef.current === 'NORMAL') {
        // Recovering: requires 120 seconds of sustained normal status
        if (effectiveSeverity !== 'NORMAL' && elapsed >= RECOVERY_HIDE_DELAY_MS) {
          setEffectiveSeverity('NORMAL');
          if (hasEverShownRef.current) {
            setShowRecoveryToast(true);
            hasEverShownRef.current = false;
          }
        }
      } else {
        // Escalating/Degrading: requires 60 seconds of sustained slow/disrupted status
        if (effectiveSeverity !== candidateRef.current && elapsed >= DEGRADATION_SHOW_DELAY_MS) {
          setEffectiveSeverity(candidateRef.current);
          hasEverShownRef.current = true;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCandidateSeverity, effectiveSeverity]);

  // Check whether user has active contracts or pending engagements
  const hasActiveEngagement = useMemo(() => {
    if (!address || !isConnected) return false;
    const lower = address.toLowerCase();
    const activeStatuses = ['Selected', 'Funded', 'In Progress', 'Submitted', 'Revision Requested', 'Disputed'];
    return (jobs || []).some((j) => {
      const isClient = j.client && j.client.toLowerCase() === lower;
      const isFreelancer = j.freelancer && j.freelancer.toLowerCase() === lower;
      return (isClient || isFreelancer) && activeStatuses.includes(j.status);
    });
  }, [address, isConnected, jobs]);

  // Check if user is currently on a payment-related screen
  const isPaymentScreen = useMemo(() => {
    const path = location.pathname.toLowerCase();
    return path.startsWith('/workspace') || path.startsWith('/treasury');
  }, [location.pathname]);

  // Check for in-flight pending transactions
  const hasPendingTransactions = useMemo(() => {
    try {
      const pendingRaw = localStorage.getItem('polylance_pending_txs');
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return true;
      }
    } catch {}
    return false;
  }, []);

  // Determine if the current user is affected
  // Only users with connected wallets who have pending transactions, active engagements,
  // or are currently on payment screens are considered affected.
  const isUserAffected = useMemo(() => {
    // DISRUPTED: any user on a payment screen is affected to protect them from starting a payment
    if (effectiveSeverity === 'DISRUPTED' && isPaymentScreen) {
      return true;
    }

    if (!isConnected || !address) {
      return false;
    }

    return hasPendingTransactions || hasActiveEngagement || isPaymentScreen;
  }, [effectiveSeverity, isPaymentScreen, isConnected, address, hasPendingTransactions, hasActiveEngagement]);

  // Check 30-minute dismissal
  const isDismissed = useMemo(() => {
    if (Date.now() < dismissedUntil) {
      // If severity worsened from SLOW to DISRUPTED, cancel dismissal
      if (dismissedSeverity === 'SLOW' && effectiveSeverity === 'DISRUPTED') {
        return false;
      }
      return true;
    }
    return false;
  }, [dismissedUntil, dismissedSeverity, effectiveSeverity]);

  // Auto-clear dismissal when duration expires
  useEffect(() => {
    if (dismissedUntil > Date.now()) {
      const remaining = Math.max(0, dismissedUntil - Date.now());
      const timer = setTimeout(() => {
        setDismissedUntil(0);
        setDismissedSeverity(null);
        try {
          sessionStorage.removeItem('polylance_net_dismissed_until');
          sessionStorage.removeItem('polylance_net_dismissed_level');
        } catch {}
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [dismissedUntil]);

  // Dismiss banner handler (persists 30 min in sessionStorage)
  const dismissBanner = useCallback(() => {
    const until = Date.now() + DISMISSAL_DURATION_MS;
    setDismissedUntil(until);
    setDismissedSeverity(effectiveSeverity);
    try {
      sessionStorage.setItem('polylance_net_dismissed_until', String(until));
      sessionStorage.setItem('polylance_net_dismissed_level', effectiveSeverity);
    } catch {}
  }, [effectiveSeverity]);

  const clearRecoveryToast = useCallback(() => {
    setShowRecoveryToast(false);
  }, []);

  // Auto-hide recovery toast after 5 seconds
  useEffect(() => {
    if (showRecoveryToast) {
      const t = setTimeout(() => setShowRecoveryToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showRecoveryToast]);

  // Determine if floating banner should be shown
  const shouldShowBanner = useMemo(() => {
    if (effectiveSeverity === 'NORMAL') return false;
    if (isDismissed) return false;
    return isUserAffected;
  }, [effectiveSeverity, isDismissed, isUserAffected]);

  // Whether payment actions should be disabled (DISRUPTED level)
  const isPaymentDisabled = effectiveSeverity === 'DISRUPTED';

  return {
    rawStatus: rawHealth.status,
    isHealthy: rawHealth.isHealthy,
    currentBlock: rawHealth.currentBlock,
    severity: effectiveSeverity,
    isUserAffected,
    shouldShowBanner,
    isPaymentDisabled,
    isDismissed,
    dismissBanner,
    showRecoveryToast,
    clearRecoveryToast,
  };
}
