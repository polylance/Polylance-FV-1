import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { CONTRACTS, RPC_URL } from '../config/contracts';
import { DemoRole } from '../types';
import JobFactoryABI from '../config/abis/JobFactory.json';
import ReputationSBTABI from '../config/abis/ReputationSBT.json';

export const DEMO_WALLETS = {
  visitor: {
    address: '',
    label: 'Anonymous Visitor',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  client: {
    address: import.meta.env.VITE_CLIENT_ADDRESS || '0x9999888877776666555544443333222211110000',
    label: 'Client (Project Owner)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  freelancer: {
    address: import.meta.env.VITE_TESTER_ADDRESS || '0x3333444455556666777788889999000011112222',
    label: 'Freelancer (Dev)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 4,
  },
  judge: {
    address: import.meta.env.VITE_JUDGE_ADDRESS || '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd',
    label: 'Judge / Arbitrator',
    isArbitrator: true,
    isTreasuryAdmin: false,
    reputationCount: 12,
  },
  admin: {
    address: import.meta.env.VITE_ADMIN_ADDRESS_2 || '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A',
    label: 'Treasury Admin (Safe Multisig)',
    isArbitrator: false,
    isTreasuryAdmin: true,
    reputationCount: 1,
  },
};

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
  const { address: walletAddress, isConnected: walletIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [currentRole, setCurrentRole] = useState<DemoRole>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('polylance_demo_role');
      return (saved as DemoRole) || 'visitor';
    }
    return 'visitor';
  });

  const [isArbitrator, setIsArbitrator] = useState(false);
  const [isTreasuryAdmin, setIsTreasuryAdmin] = useState(false);
  const [reputationCount, setReputationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      fallbackProviderRef.current = new ethers.JsonRpcProvider(RPC_URL);
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

      const lowerAddr = connectedAddress.toLowerCase();
      const isActuallyAdmin = 
        lowerAddr === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '0x62cdfc0692cc675c95304bace2c834d8f901dcba').toLowerCase() ||
        lowerAddr === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A').toLowerCase() ||
        lowerAddr === '0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1'.toLowerCase() ||
        Boolean(treasuryAdmin);

      setIsArbitrator(Boolean(arbitrator));
      setIsTreasuryAdmin(isActuallyAdmin);
      setReputationCount(Number(sbtBalance));

      // Auto-detect role based on address re-evaluation
      if (
        lowerAddr === (import.meta.env.VITE_JUDGE_ADDRESS || '0xB8aa0398B91A150B041DA819bc954Bb356e009Dd').toLowerCase() ||
        Boolean(arbitrator)
      ) {
        setCurrentRole('judge');
      } else if (isActuallyAdmin) {
        setCurrentRole('admin');
      } else {
        const activeRole = localStorage.getItem('polylance_demo_role') as DemoRole;
        if (!activeRole || activeRole === 'visitor' || activeRole === 'judge' || activeRole === 'admin') {
          setCurrentRole('freelancer');
        } else {
          setCurrentRole(activeRole);
        }
      }
    } catch (err) {
      console.error('Failed to load on-chain state:', err);
      setError('Could not load on-chain permissions — check network connection.');
      // Fail closed
      setIsArbitrator(false);
      setIsTreasuryAdmin(false);
      setReputationCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state between wallet connection and mock role settings
  useEffect(() => {
    if (walletIsConnected && walletAddress) {
      loadRealOnChainState(walletAddress);
    } else {
      setIsArbitrator(DEMO_WALLETS[currentRole].isArbitrator);
      setIsTreasuryAdmin(DEMO_WALLETS[currentRole].isTreasuryAdmin);
      setReputationCount(DEMO_WALLETS[currentRole].reputationCount);
    }
  }, [walletAddress, walletIsConnected, currentRole, loadRealOnChainState]);

  const setRole = (role: DemoRole) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_demo_role', role);
    }
    if (!walletIsConnected) {
      setIsArbitrator(DEMO_WALLETS[role].isArbitrator);
      setIsTreasuryAdmin(DEMO_WALLETS[role].isTreasuryAdmin);
      setReputationCount(DEMO_WALLETS[role].reputationCount);
    }
  };

  const connectWallet = async () => {
    if (openConnectModal) {
      await openConnectModal();
    } else {
      console.warn('Connect modal not ready');
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setRole('visitor');
  };

  const refreshOnChainState = async () => {
    if (walletAddress) {
      await loadRealOnChainState(walletAddress);
    }
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

  const address = walletIsConnected ? walletAddress || '' : DEMO_WALLETS[currentRole].address;
  const isConnected = walletIsConnected || currentRole !== 'visitor';

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
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
