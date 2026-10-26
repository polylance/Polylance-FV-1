import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/apiClient';

export interface PlatformFeeDue {
  id: string;
  jobId: string;
  engagementId?: string;
  party: 'CLIENT' | 'FREELANCER';
  wallet: string;
  token: string;
  expectedFee: string;
  paidFee: string;
  outstanding: string;
  status: 'NOT_DUE' | 'DUE' | 'PAYMENT_PENDING' | 'PAID' | 'UNDER_REVIEW' | 'WAIVED' | 'RECOVERY';
  evidence: {
    txHashes?: string[];
    submittedTxHash?: string;
    submittedAt?: number;
  };
  reasonCode: string;
  dueSince: number;
  lastReminderAt?: number;
  reminderCount: number;
  settlementTxHash?: string;
}

export interface UsePlatformFeeDuesOptions {
  enabled?: boolean;
}

export function usePlatformFeeDues(options: UsePlatformFeeDuesOptions = {}) {
  const { address } = useWeb3();
  const { isAuthenticated } = useAuth();
  const [dues, setDues] = useState<PlatformFeeDue[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const shouldFetch = Boolean(address && isAuthenticated && options.enabled !== false);

  const fetchDues = useCallback(async () => {
    if (!address || !isAuthenticated || options.enabled === false) {
      setDues([]);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.get<{ enabled?: boolean; dues?: PlatformFeeDue[] }>(
        '/api/fees/my-dues'
      );
      if (data) {
        setEnabled(Boolean(data.enabled));
        setDues(Array.isArray(data.dues) ? data.dues : []);
      }
    } catch {
      // Feature remains quiet on network errors or auth required
    } finally {
      setLoading(false);
    }
  }, [address, isAuthenticated, options.enabled]);

  useEffect(() => {
    if (shouldFetch) {
      fetchDues();
    } else {
      setDues([]);
    }
  }, [shouldFetch, fetchDues]);

  const createPaymentIntent = async (dueId: string) => {
    if (!address || !isAuthenticated) throw new Error("Authentication required");
    return await apiClient.post(`/api/fees/${encodeURIComponent(dueId)}/intent`, {});
  };

  const submitPayment = async (dueId: string, txHash: string) => {
    if (!address || !isAuthenticated) throw new Error("Authentication required");
    const data = await apiClient.post(`/api/fees/${encodeURIComponent(dueId)}/submitted`, { txHash });
    await fetchDues();
    return data;
  };

  const reportProblem = async (dueId: string, note: string) => {
    if (!address || !isAuthenticated) throw new Error("Authentication required");
    const data = await apiClient.post(`/api/fees/${encodeURIComponent(dueId)}/report-problem`, { note });
    await fetchDues();
    return data;
  };

  return {
    dues,
    enabled,
    loading,
    refreshDues: fetchDues,
    createPaymentIntent,
    submitPayment,
    reportProblem,
  };
}
