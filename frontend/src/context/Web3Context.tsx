import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { CONTRACTS, RPC_URL } from '../config/contracts';
import { DemoRole } from '../types';
import JobFactoryABI from '../config/abis/JobFactory.json';
import ReputationSBTABI from '../config/abis/ReputationSBT.json';
import { detectPrivilegedRole, isAdminAddress, isJudgeAddress } from '../utils/adminGuard';

export const DEMO_WALLETS = {
  visitor: {
    address: '',
    label: 'Anonymous Visitor',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  client: {
    address: import.meta.env.VITE_CLIENT_ADDRESS as string || '',
    label: 'Client (Project Owner)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  freelancer: {
    address: import.meta.env.VITE_TESTER_ADDRESS as string || '',
    label: 'Freelancer (Dev)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 4,
  },
  judge: {
    address: import.meta.env.VITE_JUDGE_ADDRESS as string || '',
    label: 'Judge / Arbitrator',
    isArbitrator: true,
    isTreasuryAdmin: false,
    reputationCount: 12,
  },
  admin: {
    // Primary admin demo address — loaded from env only, never hardcoded
    address: import.meta.env.VITE_ADMIN_ADDRESS_2 as string || '',
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
      
      // Verify if contract code exists on the connected network
      const code = await provider.getCode(CONTRACTS.JobFactory).catch(() => '0x');
      let arbitrator = false;
      let treasuryAdmin = false;
      let sbtBalance = 0;

      if (code && code !== '0x') {
        const factory = new ethers.Contract(CONTRACTS.JobFactory, getAbi(JobFactoryABI), provider);
        const sbt = new ethers.Contract(CONTRACTS.ReputationSBT, getAbi(ReputationSBTABI), provider);

        const arbitratorRole = ethers.id("ARBITRATOR_ROLE");
        const treasuryAdminRole = ethers.id("TREASURY_ADMIN_ROLE");

        const [isArb, isTreasury, balance] = await Promise.all([
          factory.hasRole(arbitratorRole, connectedAddress).catch(() => false),
          factory.hasRole(treasuryAdminRole, connectedAddress).catch(() => false),
          sbt.balanceOf(connectedAddress).catch(() => 0n),
        ]);

        arbitrator = Boolean(isArb);
        treasuryAdmin = Boolean(isTreasury);
        sbtBalance = Number(balance || 0);
      }

      // Use adminGuard — address matching as primary/fallback
      const isActuallyAdmin = isAdminAddress(connectedAddress) || treasuryAdmin;
      const isActuallyJudge = isJudgeAddress(connectedAddress) || arbitrator;

      setIsArbitrator(isActuallyJudge);
      setIsTreasuryAdmin(isActuallyAdmin);
      setReputationCount(sbtBalance);

      // Persist role to localStorage so page refresh doesn't lose it
      const persistRole = (r: DemoRole) => {
        setCurrentRole(r);
        if (typeof window !== 'undefined') localStorage.setItem('polylance_demo_role', r);
      };

      if (isActuallyJudge) {
        persistRole('judge');
      } else if (isActuallyAdmin) {
        persistRole('admin');
      } else {
        const activeRole = localStorage.getItem('polylance_demo_role') as DemoRole;
        if (!activeRole || activeRole === 'visitor' || activeRole === 'judge' || activeRole === 'admin') {
          persistRole('freelancer');
        } else {
          persistRole(activeRole);
        }
      }
    } catch (err) {
      console.warn('On-chain permissions check notice:', err);
      // Even on RPC failure, detect role purely via env-var address matching
      const privilegedRole = detectPrivilegedRole(connectedAddress);
      const persistRoleCatch = (r: DemoRole) => {
        setCurrentRole(r);
        if (typeof window !== 'undefined') localStorage.setItem('polylance_demo_role', r);
      };
      if (privilegedRole === 'judge') {
        persistRoleCatch('judge');
        setIsArbitrator(true);
        setIsTreasuryAdmin(false);
      } else if (privilegedRole === 'admin') {
        persistRoleCatch('admin');
        setIsArbitrator(false);
        setIsTreasuryAdmin(true);
      } else {
        setIsArbitrator(false);
        setIsTreasuryAdmin(false);
        setReputationCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state between wallet connection and mock role settings
  useEffect(() => {
    if (walletIsConnected && walletAddress) {
      loadRealOnChainState(walletAddress);
    }
    // When wallet disconnects, disconnectWallet() handles clearing state directly.
    // We do NOT re-apply DEMO_WALLETS state here to avoid race conditions.
  }, [walletAddress, walletIsConnected, loadRealOnChainState]);

  const setRole = (role: DemoRole) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_demo_role', role);
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
    // Immediately clear role from localStorage BEFORE wagmi fires async state updates
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_demo_role');
    }
    setCurrentRole('visitor');
    setIsArbitrator(false);
    setIsTreasuryAdmin(false);
    setReputationCount(0);
    disconnect();
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

  const address = walletIsConnected ? walletAddress || '' : '';
  const isConnected = Boolean(walletIsConnected);

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
