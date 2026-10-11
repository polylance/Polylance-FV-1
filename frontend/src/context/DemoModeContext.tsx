import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_WALLETS } from '../config/demoWallets';
import { DemoRole, Job, UserProfile } from '../types';

export const SAMPLE_DEMO_JOBS: Job[] = [
  {
    id: 'sample-job-1',
    contractAddress: '0x3892F73C569eAdc26629c42E41b714C8360Dea81',
    client: '0x1111111111111111111111111111111111111111',
    freelancer: '0x2222222222222222222222222222222222222222',
    title: 'Polygon ZK-Rollup Account Abstraction Module',
    description: 'Implement an ERC-4337 smart account paymaster and session key validator for low-latency Polygon gaming dApps. Must include comprehensive Foundry fuzz tests and Slither static analysis verification.',
    category: 'web3',
    skillsRequired: ['Solidity', 'ERC-4337', 'Foundry', 'Polygon PoS', 'Account Abstraction'],
    amountEth: '500',
    amountUsdc: '225',
    paymentToken: '0x0000000000000000000000000000000000000000',
    paymentTokenSymbol: 'POL',
    paymentTokenDecimals: 18,
    reviewPeriodDays: 7,
    events: [],
    status: 'Funded',
    createdAt: Date.now() - 86400000 * 3,
    applications: [
      {
        applicant: '0x2222222222222222222222222222222222222222',
        proposalIpfsHash: 'ipfs://sample-proposal-1',
        proposalText: 'Extensive track record deploying gas-efficient account abstraction paymasters on Polygon. Full Foundry test suite ready to adapt.',
        appliedAt: Date.now() - 86400000 * 2,
        applicantSkills: ['Solidity', 'Foundry'],
        githubVerified: true,
        githubScore: 840,
      },
    ],
  },
  {
    id: 'sample-job-2',
    contractAddress: '0x71C94AaD23eB36d50D32a4e21Ecf5f3B37a0F329',
    client: '0x3333333333333333333333333333333333333333',
    freelancer: '',
    title: 'Decentralized Orderbook Exchange Frontend',
    description: 'Build a high-performance, dark-mode DEX trading terminal using React 19, TypeScript, and Tailwind CSS. Connect directly to Polygon websocket orderbook endpoints.',
    category: 'frontend',
    skillsRequired: ['React', 'TypeScript', 'TailwindCSS', 'WebSockets', 'Ethers.js'],
    amountEth: '350',
    amountUsdc: '160',
    paymentToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    paymentTokenSymbol: 'USDC',
    paymentTokenDecimals: 6,
    reviewPeriodDays: 5,
    events: [],
    status: 'Open',
    createdAt: Date.now() - 86400000,
    applications: [],
  },
  {
    id: 'sample-job-3',
    contractAddress: '0x88F064C65d023bC615462D6997C25Af312984a92',
    client: '0x1111111111111111111111111111111111111111',
    freelancer: '0x2222222222222222222222222222222222222222',
    title: 'Subsquid Indexer for Soulbound SBT Mint Events',
    description: 'Design and deploy an archival GraphQL indexer tracking PolyLance ERC-721 Soulbound attestation token transfers and reputation weight updates.',
    category: 'backend',
    skillsRequired: ['Node.js', 'Subsquid', 'GraphQL', 'PostgreSQL', 'Docker'],
    amountEth: '400',
    amountUsdc: '180',
    paymentToken: '0x0000000000000000000000000000000000000000',
    paymentTokenSymbol: 'POL',
    paymentTokenDecimals: 18,
    reviewPeriodDays: 7,
    events: [],
    status: 'Funded',
    createdAt: Date.now() - 86400000 * 5,
    applications: [],
  },
];

export const SAMPLE_DEMO_PROFILES: Record<string, UserProfile> = {
  '0x1111111111111111111111111111111111111111': {
    address: '0x1111111111111111111111111111111111111111',
    displayName: 'Nexus DAO Labs',
    bio: 'Venture studio and research lab building sovereign infrastructure on Polygon. 100% on-chain escrow funding record.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    ipfsHash: 'ipfs://sample-nexus-dao',
    skills: ['Protocol Architecture', 'ZK Research', 'DAO Governance'],
    githubVerified: true,
    githubUsername: 'nexus-dao',
    reputationSbtCount: 18,
    primaryCategory: 'Protocol Engineering & Venture Lab',
  },
  '0x2222222222222222222222222222222222222222': {
    address: '0x2222222222222222222222222222222222222222',
    displayName: 'Alex Rivera',
    bio: 'Senior Smart Contract & Protocol Contributor. 8+ years distributed systems, 14 audits completed with zero critical vulnerabilities.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    ipfsHash: 'ipfs://sample-alex-rivera',
    skills: ['Solidity', 'Foundry', 'Rust', 'EVM Security', 'EIP-1167'],
    githubVerified: true,
    githubUsername: 'alexrivera-web3',
    reputationSbtCount: 24,
    primaryCategory: 'Senior Smart Contract Engineer',
  },
};

interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  demoWalletInfo: typeof DEMO_WALLETS[keyof typeof DEMO_WALLETS];
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  tourStep: number;
  setTourStep: (step: number) => void;
  restartTour: () => void;
  sampleJobs: Job[];
  sampleProfiles: Record<string, UserProfile>;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('demo') === 'true';
      const stored = localStorage.getItem('polylance_demo_mode') === 'true';
      return param || stored;
    }
    return false;
  });

  const [demoRole, setDemoRoleState] = useState<DemoRole>('freelancer');

  // Guided tour state
  const [isTourActive, setIsTourActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const tourDismissed = localStorage.getItem('polylance_tour_dismissed') === 'true';
      return isDemoMode && !tourDismissed;
    }
    return false;
  });

  const [tourStep, setTourStep] = useState<number>(1);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_demo_mode', 'true');
    }
    setIsTourActive(true);
    setTourStep(1);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setIsTourActive(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_demo_mode');
    }
  };

  const restartTour = () => {
    setIsTourActive(true);
    setTourStep(1);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('polylance_tour_dismissed');
    }
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoRole,
        setDemoRole: setDemoRoleState,
        demoWalletInfo: (DEMO_WALLETS as any)[demoRole] || DEMO_WALLETS.freelancer,
        isTourActive,
        setIsTourActive,
        tourStep,
        setTourStep,
        restartTour,
        sampleJobs: SAMPLE_DEMO_JOBS,
        sampleProfiles: SAMPLE_DEMO_PROFILES,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

const DEFAULT_DEMO_CONTEXT: DemoModeContextType = {
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
  demoRole: 'freelancer',
  setDemoRole: () => {},
  demoWalletInfo: DEMO_WALLETS.freelancer,
  isTourActive: false,
  setIsTourActive: () => {},
  tourStep: 1,
  setTourStep: () => {},
  restartTour: () => {},
  sampleJobs: SAMPLE_DEMO_JOBS,
  sampleProfiles: SAMPLE_DEMO_PROFILES,
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  return context || DEFAULT_DEMO_CONTEXT;
};
