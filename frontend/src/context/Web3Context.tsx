import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { DemoRole } from '../types';

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
  currentRole: DemoRole;
  setRole: (role: DemoRole) => void;
  address: string;
  isConnected: boolean;
  isArbitrator: boolean;
  isTreasuryAdmin: boolean;
  reputationCount: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: walletAddress, isConnected: walletIsConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const [currentRole, setCurrentRole] = useState<DemoRole>(() => {
    const saved = localStorage.getItem('polylance_demo_role');
    return (saved as DemoRole) || 'visitor';
  });

  const walletInfo = DEMO_WALLETS[currentRole];

  // If a real wallet is connected, use its address. Otherwise, fall back to the selected role's mock address.
  const address = walletAddress || walletInfo.address;
  const isConnected = walletIsConnected;

  // Automatically adjust currentRole if connected address matches a known arbitrator/admin
  useEffect(() => {
    if (walletAddress) {
      const lowerAddr = walletAddress.toLowerCase();
      if (
        lowerAddr === DEMO_WALLETS.judge.address.toLowerCase() ||
        lowerAddr === (import.meta.env.VITE_JUDGE_ADDRESS || '0xb8aa0398b91a150b041da819bc954bb356e009dd').toLowerCase()
      ) {
        setCurrentRole('judge');
      } else if (
        lowerAddr === DEMO_WALLETS.admin.address.toLowerCase() ||
        lowerAddr === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '0x62cdfc0692cc675c95304bace2c834d8f901dcba').toLowerCase()
      ) {
        setCurrentRole('admin');
      } else {
        // Default to freelancer if not a predefined special role
        const activeRole = localStorage.getItem('polylance_demo_role') as DemoRole;
        if (!activeRole || activeRole === 'visitor' || activeRole === 'judge' || activeRole === 'admin') {
          setCurrentRole('freelancer');
        }
      }
    }
  }, [walletAddress]);

  const setRole = (role: DemoRole) => {
    setCurrentRole(role);
    localStorage.setItem('polylance_demo_role', role);
  };

  const connectWallet = async () => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      console.warn('Connect modal not ready');
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setRole('visitor');
  };

  return (
    <Web3Context.Provider
      value={{
        currentRole,
        setRole,
        address,
        isConnected,
        isArbitrator: currentRole === 'judge' || currentRole === 'admin',
        isTreasuryAdmin: currentRole === 'admin',
        reputationCount: walletInfo.reputationCount,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
