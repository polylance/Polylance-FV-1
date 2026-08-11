import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import { DemoRole } from '../types';
import JobFactoryABI from '../config/abis/JobFactory.json';
import ReputationSBTABI from '../config/abis/ReputationSBT.json';

interface Web3ContextType {
  address: string;
  isConnected: boolean;
  isArbitrator: boolean;
  isTreasuryAdmin: boolean;
  reputationCount: number;
  loading: boolean;
  error: string | null;
  currentRole: DemoRole;
  setRole: (role: DemoRole) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshOnChainState: () => Promise<void>;
  provider: ethers.Provider;
  getSigner: () => Promise<ethers.Signer | null>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string>('');
  const [isArbitrator, setIsArbitrator] = useState(false);
  const [isTreasuryAdmin, setIsTreasuryAdmin] = useState(false);
  const [reputationCount, setReputationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<DemoRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_demo_role');
      return (saved as DemoRole) || 'visitor';
    }
    return 'visitor';
  });

  const browserProviderRef = useRef<ethers.BrowserProvider | null>(null);
  const fallbackProviderRef = useRef<ethers.JsonRpcProvider | null>(null);

  const getActiveProvider = (): ethers.Provider => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      if (!browserProviderRef.current) {
        if (typeof (window as any).ethereum.setMaxListeners === 'function') {
          try {
            (window as any).ethereum.setMaxListeners(30);
          } catch {}
        }
        browserProviderRef.current = new ethers.BrowserProvider((window as any).ethereum);
      }
      return browserProviderRef.current;
    }
    if (!fallbackProviderRef.current) {
      fallbackProviderRef.current = new ethers.JsonRpcProvider();
    }
    return fallbackProviderRef.current;
  };

  const getAbi = (imported: any) => (Array.isArray(imported) ? imported : imported.abi ?? imported);

  const loadRealOnChainState = useCallback(async (connectedAddress: string) => {
    if (!connectedAddress) {
      setIsArbitrator(false);
      setIsTreasuryAdmin(false);
      setReputationCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        setIsArbitrator(false);
        setIsTreasuryAdmin(false);
        setReputationCount(0);
        return;
      }

      const provider = getActiveProvider();
      const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), provider);
      const sbt = new ethers.Contract(CONTRACTS.ReputationSBT, getAbi(ReputationSBTABI), provider);

      const [ARBITRATOR_ROLE, TREASURY_ADMIN_ROLE] = await Promise.all([
        factory.ARBITRATOR_ROLE(),
        factory.TREASURY_ADMIN_ROLE(),
      ]);

      const [arbitrator, treasuryAdmin, sbtBalance] = await Promise.all([
        factory.hasRole(ARBITRATOR_ROLE, connectedAddress),
        factory.hasRole(TREASURY_ADMIN_ROLE, connectedAddress),
        sbt.balanceOf(connectedAddress),
      ]);

      setIsArbitrator(Boolean(arbitrator));
      setIsTreasuryAdmin(Boolean(treasuryAdmin));
      setReputationCount(Number(sbtBalance));
    } catch (err) {
      console.error('Failed to load on-chain state:', err);
      setError('Could not load on-chain permissions — check network connection.');
      // Fail closed: never leave stale/previous-account permissions active
      setIsArbitrator(false);
      setIsTreasuryAdmin(false);
      setReputationCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const setRole = (role: DemoRole) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_demo_role', role);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No wallet extension detected. Install MetaMask or another Web3 wallet.');
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        setAddress(accounts[0]);
        await loadRealOnChainState(accounts[0]);
      }
    } catch (err) {
      console.error('Wallet connection rejected or failed:', err);
      setError('Wallet connection was rejected.');
    }
  };

  const disconnectWallet = () => {
    setAddress('');
    setIsArbitrator(false);
    setIsTreasuryAdmin(false);
    setReputationCount(0);
    setError(null);
    setCurrentRole('visitor');
  };

  const refreshOnChainState = async () => {
    if (address) await loadRealOnChainState(address);
  };

  const getSigner = async (): Promise<ethers.Signer | null> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        if (!browserProviderRef.current) {
          browserProviderRef.current = new ethers.BrowserProvider((window as any).ethereum);
        }
        return await browserProviderRef.current.getSigner();
      } catch (err) {
        console.warn('Failed to get signer:', err);
      }
    }
    return null;
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts[0]) {
        setAddress(accounts[0]);
        loadRealOnChainState(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const ethObj = (window as any).ethereum;
    if (ethObj.on) {
      ethObj.on('accountsChanged', handleAccountsChanged);
      ethObj.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethObj.removeListener) {
        ethObj.removeListener('accountsChanged', handleAccountsChanged);
        ethObj.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [loadRealOnChainState]);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected: Boolean(address),
        isArbitrator,
        isTreasuryAdmin,
        reputationCount,
        loading,
        error,
        currentRole,
        setRole,
        connectWallet,
        disconnectWallet,
        refreshOnChainState,
        provider: getActiveProvider(),
        getSigner,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within a Web3Provider');
  return context;
};
