import { useMemo, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { AccountMode } from '../types';
import { areAddressesEqual } from '../utils/accountMode';

export interface UseAccountModeResult {
  accountMode: AccountMode;
  isFreelancerAllowed: boolean;
  isClientAllowed: boolean;
  setAccountMode: (newMode: AccountMode) => Promise<boolean>;
  isConnected: boolean;
  address: string | undefined;
}

/**
 * Single source of truth hook for platform account mode (Freelancer only / Client only / Both).
 * Defaults to 'both' if no mode has been saved.
 */
export function useAccountMode(): UseAccountModeResult {
  const { address, isConnected } = useWeb3();
  const { profiles, updateProfile } = usePolyLanceData();

  const currentProfile = useMemo(() => {
    if (!address) return null;
    const key = Object.keys(profiles).find((k) => areAddressesEqual(k, address));
    return key ? profiles[key] : null;
  }, [profiles, address]);

  // Existing users or users without saved mode default to 'both'
  const accountMode: AccountMode = currentProfile?.accountMode || 'both';

  const isFreelancerAllowed = accountMode === 'freelancer' || accountMode === 'both';
  const isClientAllowed = accountMode === 'client' || accountMode === 'both';

  const setAccountMode = useCallback(
    async (newMode: AccountMode): Promise<boolean> => {
      if (!address) return false;
      try {
        await updateProfile({ accountMode: newMode }, address);
        return true;
      } catch (err) {
        console.error('Failed to update account mode:', err);
        return false;
      }
    },
    [address, updateProfile]
  );

  return {
    accountMode,
    isFreelancerAllowed,
    isClientAllowed,
    setAccountMode,
    isConnected,
    address,
  };
}
