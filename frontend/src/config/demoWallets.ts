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
    reputationCount: 0,
  },
  judge: {
    address: import.meta.env.VITE_JUDGE_ADDRESS || '',
    label: 'Judge / Arbitrator',
    isArbitrator: true,
    isTreasuryAdmin: false,
    reputationCount: 0,
  },
  admin: {
    address: '0x25F6111122223333444455556666777788880e9A',
    label: 'Treasury Admin (Safe Multisig)',
    isArbitrator: false,
    isTreasuryAdmin: true,
    reputationCount: 0,
  },
  admin3: {
    address: import.meta.env.VITE_ADMIN_ADDRESS_3 || '',
    label: '3rd Admin & Arbitrator (0xb30F2e...)',
    isArbitrator: true,
    isTreasuryAdmin: true,
    reputationCount: 0,
  },
} as const;
