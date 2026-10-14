import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { DOMAINS, DomainId, isJobOpen, isJobInDomain } from '../utils/domainMapping';

export interface DomainJobCounts {
  counts: Record<DomainId, number>;
  totalOpenJobs: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useDomainJobCounts(): DomainJobCounts {
  const { jobs, loading: contextLoading } = usePolyLanceData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [revalidationTick, setRevalidationTick] = useState(0);

  const refetch = useCallback(() => {
    setIsRefreshing(true);
    setIsError(false);
    setTimeout(() => {
      setRevalidationTick((prev) => prev + 1);
      setIsRefreshing(false);
    }, 250);
  }, []);

  // 1. Refetch on window focus
  useEffect(() => {
    const handleFocus = () => {
      setRevalidationTick((prev) => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 2. Poll every 30s while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        setRevalidationTick((prev) => prev + 1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 3. Compute live counts
  const { counts, totalOpenJobs } = useMemo(() => {
    try {
      const openJobs = (jobs || []).filter(isJobOpen);

      const domainCounts: Record<DomainId, number> = {
        web3: 0,
        frontend: 0,
        backend: 0,
        mobile: 0,
      };

      const matchedJobIds = new Set<string>();

      DOMAINS.forEach((domain) => {
        const matchingForDomain = openJobs.filter((job) => isJobInDomain(job, domain.id));
        domainCounts[domain.id] = matchingForDomain.length;

        matchingForDomain.forEach((j) => {
          if (j.id) matchedJobIds.add(j.id);
        });
      });

      return {
        counts: domainCounts,
        totalOpenJobs: matchedJobIds.size,
      };
    } catch (err) {
      console.error('Failed to calculate domain job counts:', err);
      setIsError(true);
      return {
        counts: { web3: 0, frontend: 0, backend: 0, mobile: 0 },
        totalOpenJobs: 0,
      };
    }
    // revalidationTick is included to trigger memo recalculation on focus / timer
  }, [jobs, revalidationTick]);

  const isLoading = contextLoading || isRefreshing;

  return {
    counts,
    totalOpenJobs,
    isLoading,
    isError,
    refetch,
  };
}
