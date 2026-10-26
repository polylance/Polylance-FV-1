import { useState, useEffect, useCallback, useRef } from 'react';
import { getBackendSyncUrl } from '../utils/backendUrl';
import { sharedPoller } from '../utils/sharedPoller';

export interface ActionFeeEstimate {
  name: string;
  medianGas: number;
  gasLimit: number;
  typicalWei: string;
  maxWei: string;
  typicalPol: string;
  maxPol: string;
}

export interface NetworkFeesResponse {
  success: boolean;
  chainId: number;
  baseFeeWei: string;
  priorityFeeWei: string;
  typicalFeePerGasWei: string;
  maxFeePerGasWei: string;
  baseFeeGwei: string;
  priorityFeeGwei: string;
  typicalFeePerGasGwei: string;
  maxFeePerGasGwei: string;
  trend: 'normal' | 'busy';
  isBusy: boolean;
  suggestedReservePol: string;
  actions: Record<string, ActionFeeEstimate>;
  timestamp: number;
  ageMs: number;
  isStale: boolean;
  fallback?: boolean;
}

const DEFAULT_NETWORK_FEES: NetworkFeesResponse = {
  success: true,
  chainId: 137,
  baseFeeWei: '35000000000',
  priorityFeeWei: '30000000000',
  typicalFeePerGasWei: '65000000000',
  maxFeePerGasWei: '90000000000',
  baseFeeGwei: '35.0',
  priorityFeeGwei: '30.0',
  typicalFeePerGasGwei: '65.0',
  maxFeePerGasGwei: '90.0',
  trend: 'normal',
  isBusy: false,
  suggestedReservePol: '0.1',
  ageMs: 0,
  isStale: false,
  fallback: true,
  actions: {
    fundNative: { name: 'Fund Escrow (POL)', medianGas: 82000, gasLimit: 120000, typicalWei: '5330000000000000', maxWei: '10800000000000000', typicalPol: '0.0053', maxPol: '0.0108' },
    fundUsdc: { name: 'Fund Escrow (USDC)', medianGas: 142000, gasLimit: 200000, typicalWei: '9230000000000000', maxWei: '18000000000000000', typicalPol: '0.0092', maxPol: '0.0180' },
    approveUsdc: { name: 'Approve USDC', medianGas: 48200, gasLimit: 75000, typicalWei: '3133000000000000', maxWei: '6750000000000000', typicalPol: '0.0031', maxPol: '0.0068' },
    fundUsdt: { name: 'Fund Escrow (USDT)', medianGas: 142000, gasLimit: 200000, typicalWei: '9230000000000000', maxWei: '18000000000000000', typicalPol: '0.0092', maxPol: '0.0180' },
    releasePayment: { name: 'Release Escrow Payment', medianGas: 141800, gasLimit: 220000, typicalWei: '9217000000000000', maxWei: '19800000000000000', typicalPol: '0.0092', maxPol: '0.0198' },
    submitWork: { name: 'Submit Work Deliverable', medianGas: 72000, gasLimit: 120000, typicalWei: '4680000000000000', maxWei: '10800000000000000', typicalPol: '0.0047', maxPol: '0.0108' },
    payFeeDue: { name: 'Pay Platform Fee Due', medianGas: 52000, gasLimit: 90000, typicalWei: '3380000000000000', maxWei: '8100000000000000', typicalPol: '0.0034', maxPol: '0.0081' },
    refund: { name: 'Refund Escrow', medianGas: 65000, gasLimit: 100000, typicalWei: '4225000000000000', maxWei: '9000000000000000', typicalPol: '0.0042', maxPol: '0.0090' },
  },
  timestamp: Date.now(),
};

export function useNetworkFees(autoRefresh: boolean = true) {
  const [fees, setFees] = useState<NetworkFeesResponse>(DEFAULT_NETWORK_FEES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedRef = useRef<number>(0);

  const fetchFees = useCallback(async () => {
    // Avoid hammering if called within 5 seconds
    if (Date.now() - lastFetchedRef.current < 5000) return;
    lastFetchedRef.current = Date.now();

    try {
      setLoading(true);
      const syncUrl = getBackendSyncUrl();
      const res = await sharedPoller.fetchDeduplicated<NetworkFeesResponse>(`${syncUrl}/api/network/fees`);
      if (res && res.success) {
        setFees(res);
        setError(null);
      }
    } catch (err: any) {
      console.debug('Network fee fetch notice, using cached/fallback:', err?.message || err);
      // Keep existing fees without breaking UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
    if (!autoRefresh) return;

    // Refresh every 20 seconds while page is visible
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchFees();
      }
    }, 20000);

    const onFocus = () => fetchFees();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchFees, autoRefresh]);

  const getActionFee = useCallback((actionKey: string): ActionFeeEstimate => {
    return fees.actions[actionKey] || {
      name: actionKey,
      medianGas: 100000,
      gasLimit: 150000,
      typicalWei: '6500000000000000',
      maxWei: '13500000000000000',
      typicalPol: '0.0065',
      maxPol: '0.0135',
    };
  }, [fees]);

  return {
    fees,
    loading,
    error,
    refresh: fetchFees,
    getActionFee,
    isBusy: fees.isBusy,
    suggestedReservePol: fees.suggestedReservePol || '0.1',
  };
}
