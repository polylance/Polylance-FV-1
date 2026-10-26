import { useState, useEffect, useCallback, useRef } from 'react';
import { sharedPoller } from '../utils/sharedPoller';
import { getBackendSyncUrl } from '../utils/backendUrl';

export interface PublicStatsEscrow {
  lockedByToken: {
    POL: number;
    USDC: number;
  };
  activeCount: number;
  contractAddress: string;
  sourceVerified: boolean;
}

export interface PublicStatsCertificate {
  tokenId: string;
  mintedAt: string | number;
  txHash: string | null;
  contract: string;
}

export interface PublicStatsDisputes {
  opened: number;
  resolved: number;
  outcomes: {
    fullRelease: number;
    fullRefund: number;
    split: number;
  };
}

export interface PublicStatsReputationTier {
  name: string;
  minPoints: number;
  maxPoints: number | null;
}

export interface PublicActivityEvent {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  txHash?: string | null;
}

export interface PublicStatsData {
  updatedAt: string;
  chainId: number;
  escrow: PublicStatsEscrow;
  settledByToken?: {
    POL: number;
    USDC: number;
  };
  registeredProfiles?: number;
  recentActivity?: PublicActivityEvent[];
  certificates: {
    totalIssued: number;
    latest: PublicStatsCertificate | null;
  };
  disputes: PublicStatsDisputes;
  jobs: {
    completed: number;
  };
  reputation: {
    tiers: PublicStatsReputationTier[];
  };
}

export interface UsePublicStatsResult {
  stats: PublicStatsData | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const POLL_INTERVAL_MS = 60000; // 60s

export function usePublicStats(): UsePublicStatsResult {
  const [stats, setStats] = useState<PublicStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const lastGoodStatsRef = useRef<PublicStatsData | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchStats = useCallback(async (isInitial = false) => {
    // If hidden and not initial load, skip polling
    if (typeof document !== 'undefined' && document.hidden && !isInitial) {
      return;
    }

    try {
      const baseUrl = getBackendSyncUrl();
      const endpoint = `${baseUrl}/api/public/stats`;

      const data = await sharedPoller.fetchDeduplicated<PublicStatsData>(
        endpoint,
        {
          headers: {
            Accept: 'application/json',
          },
        },
        {
          cacheTtlMs: 30000,
          skipIfHidden: true,
        }
      );

      if (!isMountedRef.current) return;

      if (data && data.escrow) {
        lastGoodStatsRef.current = data;
        setStats(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      // Retain last known good stats on failure
      if (lastGoodStatsRef.current) {
        setStats(lastGoodStatsRef.current);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchStats(true);

    const interval = setInterval(() => {
      fetchStats(false);
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchStats(false),
  };
}
