export const DEMO_WALLETS = {
  visitor: {
    address: '',
    label: 'Anonymous Visitor',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  client: {
    address: (import.meta.env.VITE_CLIENT_ADDRESS || '') as string,
    label: 'Client (Project Owner)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  freelancer: {
    address: (import.meta.env.VITE_TESTER_ADDRESS || import.meta.env.VITE_FREELANCER_ADDRESS || '') as string,
    label: 'Freelancer (Dev)',
    isArbitrator: false,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
} as const;
