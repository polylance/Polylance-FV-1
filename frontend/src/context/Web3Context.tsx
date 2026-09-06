import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { CONTRACTS, RPC_URL, CHAIN_ID, NETWORK_CONFIG } from '../config/contracts';
import { DemoRole } from '../types';
import JobFactoryABI from '../config/abis/JobFactory.json';
import ReputationSBTABI from '../config/abis/ReputationSBT.json';
import { detectPrivilegedRole, isAdminAddress, isJudgeAddress } from '../utils/adminGuard';

import { PAYMENT_TOKENS } from '../config/paymentTokens';

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
    reputationCount: 0,
  },
};

export interface Web3ContextType {
  address: string;
  isConnected: boolean;
  isArbitrator: boolean;
  isTreasuryAdmin: boolean;
  reputationCount: number;
  balanceNative: string;
  balanceUsdc: string;
  refreshBalances: () => Promise<void>;
  isWrongNetwork: boolean;
  targetChainId: number;
  targetChainName: string;
  switchToTargetNetwork: () => Promise<void>;
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
  const connectedChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const isWrongNetwork = Boolean(
    walletIsConnected && connectedChainId && connectedChainId !== CHAIN_ID
  );

  const switchToTargetNetwork = useCallback(async () => {
    if (switchChain) {
      try {
        await switchChain({ chainId: CHAIN_ID });
        return;
      } catch (e: any) {
        console.warn('Wagmi switchChain error, falling back to window.ethereum:', e);
      }
    }
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: NETWORK_CONFIG.chainHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORK_CONFIG.chainHex,
                chainName: NETWORK_CONFIG.chainName,
                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrl ? [NETWORK_CONFIG.blockExplorerUrl] : [],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  }, [switchChain]);

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
  const [balanceNative, setBalanceNative] = useState<string>('0.00');
  const [balanceUsdc, setBalanceUsdc] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browserProviderRef = useRef<ethers.BrowserProvider | null>(null);
  const fallbackProviderRef = useRef<ethers.JsonRpcProvider | null>(null);

  const getActiveProvider = useCallback((): ethers.Provider => {
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
  }, []);

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
  }, [getActiveProvider]);

  const refreshBalances = useCallback(async (overrideAddress?: string) => {
    const targetAddr = overrideAddress || (walletIsConnected ? walletAddress : '');
    if (!targetAddr || !ethers.isAddress(targetAddr)) {
      setBalanceNative('0.00');
      setBalanceUsdc('0.00');
      return;
    }
    try {
      const p = getActiveProvider();
      const balWei = await p.getBalance(targetAddr).catch(() => 0n);
      setBalanceNative(parseFloat(ethers.formatEther(balWei)).toFixed(4));

      const usdcAddress = PAYMENT_TOKENS.USDC.address;
      if (usdcAddress && usdcAddress !== ethers.ZeroAddress) {
        const usdcContract = new ethers.Contract(
          usdcAddress,
          ["function balanceOf(address) view returns (uint256)"],
          p
        );
        const usdcRaw = await usdcContract.balanceOf(targetAddr).catch(() => 0n);
        setBalanceUsdc(parseFloat(ethers.formatUnits(usdcRaw, PAYMENT_TOKENS.USDC.decimals)).toFixed(2));
      }
    } catch (e) {
      console.warn("Failed to fetch wallet balances:", e);
    }
  }, [walletIsConnected, walletAddress, getActiveProvider]);

  // Real-time polling for wallet balances
  useEffect(() => {
    refreshBalances();
    const interval = setInterval(() => {
      refreshBalances();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshBalances]);

  // MetaMask event subscription (accountsChanged, chainChanged)
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      browserProviderRef.current = null;
      if (!accounts || accounts.length === 0) {
        setBalanceNative('0.00');
        setBalanceUsdc('0.00');
        setIsArbitrator(false);
        setIsTreasuryAdmin(false);
        setReputationCount(0);
        setCurrentRole('visitor');
        if (typeof window !== 'undefined') localStorage.removeItem('polylance_demo_role');
      } else {
        const newAddress = accounts[0];
        refreshBalances(newAddress);
        loadRealOnChainState(newAddress);
      }
    };

    const handleChainChanged = () => {
      browserProviderRef.current = null;
      refreshBalances();
      if (walletAddress) {
        loadRealOnChainState(walletAddress);
      }
    };

    const removeListenerSafely = (event: string, handler: any) => {
      try {
        if (typeof eth.removeListener === 'function') {
          eth.removeListener(event, handler);
        } else if (typeof eth.off === 'function') {
          eth.off(event, handler);
        }
      } catch {}
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      removeListenerSafely('accountsChanged', handleAccountsChanged);
      removeListenerSafely('chainChanged', handleChainChanged);
    };
  }, [walletAddress, loadRealOnChainState, refreshBalances]);

  // Sync state between wallet connection and mock role settings
  useEffect(() => {
    if (walletIsConnected && walletAddress) {
      loadRealOnChainState(walletAddress);
    }
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

  const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const bp = new ethers.BrowserProvider((window as any).ethereum);
        return await bp.getSigner();
      } catch (err) {
        console.warn('Failed to get signer:', err);
      }
    }
    return null;
  }, []);

  const address = walletIsConnected ? walletAddress || '' : '';
  const isConnected = Boolean(walletIsConnected);

  const contextValue = React.useMemo<Web3ContextType>(() => ({
    address,
    isConnected,
    isArbitrator,
    isTreasuryAdmin,
    reputationCount,
    balanceNative,
    balanceUsdc,
    refreshBalances,
    isWrongNetwork,
    targetChainId: CHAIN_ID,
    targetChainName: NETWORK_CONFIG.chainName,
    switchToTargetNetwork,
    loading,
    error,
    currentRole,
    setRole,
    connectWallet,
    disconnectWallet,
    refreshOnChainState,
    provider: getActiveProvider(),
    getSigner,
  }), [
    address,
    isConnected,
    isArbitrator,
    isTreasuryAdmin,
    reputationCount,
    balanceNative,
    balanceUsdc,
    refreshBalances,
    isWrongNetwork,
    switchToTargetNetwork,
    loading,
    error,
    currentRole,
    setRole,
    connectWallet,
    disconnectWallet,
    refreshOnChainState,
    getSigner,
    getActiveProvider,
  ]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

const SAFE_FALLBACK_WEB3_CONTEXT: Web3ContextType = {
  address: '',
  isConnected: false,
  isArbitrator: false,
  isTreasuryAdmin: false,
  reputationCount: 0,
  balanceNative: '0.00',
  balanceUsdc: '0.00',
  refreshBalances: async () => {},
  isWrongNetwork: false,
  targetChainId: CHAIN_ID,
  targetChainName: NETWORK_CONFIG.chainName,
  switchToTargetNetwork: async () => {},
  loading: false,
  error: null,
  currentRole: 'visitor',
  setRole: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
  refreshOnChainState: async () => {},
  provider: null as any,
  getSigner: async () => null,
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    return SAFE_FALLBACK_WEB3_CONTEXT;
  }
  return context;
};
