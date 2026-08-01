import React, { createContext, useContext, useState, useEffect } from 'react';
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
    address: '0x9999888877776666555544443333222211110000',
    label: 'Client (Project Owner)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  freelancer: {
    address: '0x3333444455556666777788889999000011112222',
    label: 'Freelancer (Dev)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 4, // 4 completed jobs SBT
  },
  judge: {
    address: '0x62cD88889999000011112222333344445555dCba',
    label: 'Judge / Arbitrator',
    isArbitrator: true,
    isTreasuryAdmin: false,
    reputationCount: 12,
  },
  admin: {
    address: '0x25F6111122223333444455556666777788880e9A',
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
  const [currentRole, setCurrentRole] = useState<DemoRole>(() => {
    const saved = localStorage.getItem('polylance_demo_role');
    return (saved as DemoRole) || 'visitor';
  });
  const [customAddress, setCustomAddress] = useState<string | null>(null);

  const walletInfo = DEMO_WALLETS[currentRole];
  const address = customAddress || walletInfo.address;
  const isConnected = currentRole !== 'visitor' || !!customAddress;

  const setRole = (role: DemoRole) => {
    setCustomAddress(null);
    setCurrentRole(role);
    localStorage.setItem('polylance_demo_role', role);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setCustomAddress(accounts[0]);
          // Let's set role to freelancer by default on connect if no role was set
          if (currentRole === 'visitor') {
            setRole('freelancer');
          }
        }
      } catch (err) {
        console.error('User rejected wallet connection', err);
      }
    } else {
      // Default to visitor role if no browser extension
      setRole('visitor');
    }
  };

  const disconnectWallet = () => {
    setCustomAddress(null);
    setRole('visitor');
  };

  return (
    <Web3Context.Provider
      value={{
        currentRole,
        setRole,
        address,
        isConnected,
        isArbitrator: walletInfo.isArbitrator,
        isTreasuryAdmin: walletInfo.isTreasuryAdmin,
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
