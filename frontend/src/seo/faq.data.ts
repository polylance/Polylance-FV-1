/**
 * PolyLance Centralized FAQ Data Registry
 * Single source of truth for BOTH the visible FAQ UI (<FaqSection />) and FAQPage JSON-LD.
 * Every answer is verified against the codebase, smart contracts, and platform config.
 */

import { FaqItem } from './types';
import { PLATFORM_FEE_PERCENT, REVIEW_WINDOW_DAYS, DELIVERY_GRACE_DAYS } from './site.config';

export const FAQ_DATA: FaqItem[] = [
  // ── GENERAL ──
  {
    id: 'what-is-polylance',
    pageIds: ['/', '/how-it-works', '/faq', '/about'],
    category: 'general',
    question: 'What is PolyLance?',
    answer: 'PolyLance is a freelance marketplace on the Polygon blockchain where project funds are locked in an escrow smart contract. Clients fund milestone escrows, freelancers deliver work, and payment is released upon client approval or verifiable milestones. Completed jobs also earn verifiable on-chain reputation certificates.',
    keywordIds: ['core-web3-freelance-marketplace', 'brand-polylance'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'how-does-polylance-work',
    pageIds: ['/', '/how-it-works', '/faq', '/for-freelancers', '/for-clients'],
    category: 'general',
    question: 'How does PolyLance work?',
    answer: 'Clients post a project, select an applicant, and fund escrow on Polygon PoS. The freelancer completes the milestone, uploads proof-of-work, and client approval instantly releases funds directly to the freelancer wallet. For multi-phase projects, contracts can be organized and funded milestone by milestone.',
    keywordIds: ['core-decentralized-freelance-platform', 'problem-freelance-escrow-payment'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'need-crypto-wallet',
    pageIds: ['/', '/how-it-works', '/faq', '/for-freelancers', '/for-clients'],
    category: 'general',
    question: 'Do I need a crypto wallet to use PolyLance?',
    answer: 'Yes. You sign in and receive payments through a Polygon-compatible wallet such as MetaMask, Coinbase Wallet, or WalletConnect. Your cryptographic wallet address is your account identifier, eliminating passwords and centralized credential storage.',
    keywordIds: ['question-wallet-safety-guide', 'core-crypto-freelance-marketplace'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'supported-tokens-chains',
    pageIds: ['/', '/how-it-works', '/fees', '/faq', '/get-paid-in-usdc', '/get-paid-in-crypto'],
    category: 'general',
    question: 'Which blockchain and tokens does PolyLance use?',
    answer: 'PolyLance operates on Polygon Mainnet (Chain ID 137). Supported payment tokens are native POL (the upgraded MATIC token), USDC, and USDT. Polygon delivers sub-cent network transaction fees and fast confirmations, making micro and enterprise freelance payments practical.',
    keywordIds: ['core-get-paid-in-pol', 'core-freelance-jobs-usdc'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── ESCROW & PAYMENTS ──
  {
    id: 'what-is-escrow-protection',
    pageIds: ['/escrow', '/how-it-works', '/faq', '/for-freelancers'],
    category: 'escrow',
    question: 'What is escrow and how does it protect me?',
    answer: 'Escrow holds milestone payments inside an immutable Polygon smart contract rather than a platform bank account. Freelancers have cryptographic assurance that funds are committed before work begins, while clients retain control because funds release only after delivered deliverables are inspected and approved.',
    keywordIds: ['problem-freelance-escrow-payment', 'web3-smart-contract-escrow'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'is-money-safe-escrow',
    pageIds: ['/escrow', '/security', '/faq'],
    category: 'escrow',
    question: 'Is my money safe in PolyLance escrow?',
    answer: 'Funds are secured in on-chain smart contracts deployed on Polygon PoS, with all deposits and payouts visible on Polygonscan. PolyLance contracts have undergone internal security hardening but have not yet received an external third-party firm audit. We recommend funding milestones incrementally.',
    keywordIds: ['brand-polylance-reviews', 'web3-smart-contract-escrow'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'when-freelancer-paid',
    pageIds: ['/escrow', '/fees', '/faq', '/for-freelancers'],
    category: 'escrow',
    question: 'When does the freelancer get paid?',
    answer: `The freelancer receives payment instantly when the client approves the submitted work. If a client becomes unresponsive after deliverables are submitted, the freelancer can trigger the on-chain auto-release function once the ${REVIEW_WINDOW_DAYS}-day review period expires.`,
    keywordIds: ['core-freelance-jobs-crypto', 'problem-milestone-payment-protection'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'freelancer-needs-pol-to-receive',
    pageIds: ['/faq', '/for-freelancers', '/get-paid-in-crypto'],
    category: 'escrow',
    question: 'Does the freelancer need POL to receive payment?',
    answer: 'No POL is required simply to receive funds released by the client, as the client pays the release transaction gas. However, freelancers need a tiny fraction of POL (typically under $0.01) to submit proof-of-work on-chain, propose terms, or initiate a claim.',
    keywordIds: ['core-get-paid-in-pol', 'question-polygon-for-payments'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'milestone-payments',
    pageIds: ['/escrow', '/how-it-works', '/faq', '/for-clients'],
    category: 'escrow',
    question: 'Can I pay in milestones on PolyLance?',
    answer: 'Yes. Projects can be structured into discrete milestones with dedicated budgets, timelines, and deliverables. Each milestone is funded and approved independently, mitigating risk for both parties across long-term engagements.',
    keywordIds: ['problem-milestone-payment-protection'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'client-unresponsive-timeout',
    pageIds: ['/escrow', '/faq', '/for-freelancers'],
    category: 'escrow',
    question: 'What happens if the client does not respond to a submission?',
    answer: `Clients have a standard ${REVIEW_WINDOW_DAYS}-day review window after proof-of-work submission. If the client takes no action and does not request revisions or open a dispute, the freelancer can invoke JobEscrow.claimAutoRelease() on Polygon to release 100% of the milestone funds.`,
    keywordIds: ['problem-milestone-payment-protection', 'web3-smart-contract-escrow'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── FEES ──
  {
    id: 'platform-fee-amount',
    pageIds: ['/', '/fees', '/how-it-works', '/faq'],
    category: 'fees',
    question: 'How much does PolyLance charge, and who pays it?',
    answer: 'PolyLance charges a 2.5% service fee to each side, 5% of the job budget in total. The client pays the job budget plus 2.5%, and the freelancer receives the job budget minus 2.5%. For example, on a 9 POL job the client pays 9.225 POL and the freelancer receives 8.775 POL. On a 10 USDC job, the client pays 10.25 USDC and the freelancer receives 9.75 USDC; on a 100 USDC job, the client pays 102.50 USDC and the freelancer receives 97.50 USDC; on a 1,000 USDC job, the client pays 1,025.00 USDC and the freelancer receives 975.00 USDC. Network (gas) fees are separate and are paid in POL to the Polygon network, not to PolyLance.',
    keywordIds: ['problem-low-fee-freelance-platform', 'core-web3-freelance-marketplace'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'other-fees-gas',
    pageIds: ['/fees', '/faq', '/get-paid-in-crypto'],
    category: 'fees',
    question: 'Are there other fees?',
    answer: 'No other PolyLance fees apply to a job. The only additional cost is the Polygon network fee (gas) for blockchain transactions, paid in POL to the network.',
    keywordIds: ['problem-low-fee-freelance-platform', 'question-polygon-for-payments'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'milestone-fees-applicable',
    pageIds: ['/fees', '/faq', '/escrow', '/how-it-works'],
    category: 'fees',
    question: 'Does the 2.5% fee apply to each milestone?',
    answer: 'Yes. When a contract is divided into milestones, the 2.5% client fee and 2.5% freelancer fee apply to each milestone amount independently upon funding and release.',
    keywordIds: ['problem-milestone-payment-protection', 'problem-low-fee-freelance-platform'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── WALLET & SIGN-IN ──
  {
    id: 'sign-in-wallet-cost',
    pageIds: ['/faq', '/security', '/how-it-works'],
    category: 'wallet',
    question: 'What does "Sign in with wallet" do? Does it cost anything?',
    answer: 'Signing in uses Sign-In with Ethereum (EIP-4361). It requires signing a cryptographic message proving wallet ownership. It is completely gasless, sends no on-chain transaction, and cannot move funds. Always verify the domain shows polylance.codes before signing.',
    keywordIds: ['question-wallet-safety-guide', 'brand-polylance-codes'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'supported-wallets',
    pageIds: ['/faq', '/how-it-works', '/for-freelancers'],
    category: 'wallet',
    question: 'Which wallets work with PolyLance?',
    answer: 'Any Polygon-compatible Web3 wallet functions with PolyLance, including MetaMask, Coinbase Wallet, Rainbow, Rabby, and hundreds of mobile wallets via WalletConnect. Your wallet must be configured to Polygon Mainnet (Chain ID 137).',
    keywordIds: ['question-wallet-safety-guide'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'switch-to-polygon-reason',
    pageIds: ['/faq', '/get-paid-in-crypto'],
    category: 'wallet',
    question: 'Why does PolyLance prompt me to switch to Polygon?',
    answer: 'PolyLance escrow smart contracts are deployed natively on Polygon PoS. If your wallet is connected to Ethereum or another network, transactions cannot execute. PolyLance prompts a network switch to keep transaction fees negligible.',
    keywordIds: ['question-polygon-for-payments', 'core-polygon-freelance-marketplace'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'lost-wallet-access',
    pageIds: ['/faq', '/security'],
    category: 'wallet',
    question: 'What happens if I lose access to my wallet?',
    answer: 'Because PolyLance is non-custodial, we cannot recover lost seed phrases or reverse blockchain transactions. Store your recovery phrase securely offline. PolyLance staff will never request your private key or recovery phrase.',
    keywordIds: ['question-wallet-safety-guide'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── FREELANCERS ──
  {
    id: 'find-apply-jobs-guide',
    pageIds: ['/for-freelancers', '/faq', '/find-jobs'],
    category: 'freelancers',
    question: 'How do I find and apply for jobs on PolyLance?',
    answer: 'Navigate to Find Jobs, filter by required skill or budget, and review contract details. Click "Apply for this job" to submit your proposal. If the client selects you, terms and milestones can be finalized in the pre-negotiation channel before escrow funding.',
    keywordIds: ['core-freelance-jobs-crypto', 'web3-jobs-hub'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'fiat-offramp-local-currency',
    pageIds: ['/for-freelancers', '/faq', '/get-paid-in-usdc'],
    category: 'freelancers',
    question: 'How do I convert crypto earnings into my local currency?',
    answer: 'Earnings arrive in your self-custody wallet as USDC or POL. You can convert them to local fiat via regulated cryptocurrency exchanges or off-ramp providers in your jurisdiction. Local tax and reporting rules vary; consult a qualified professional.',
    keywordIds: ['core-freelance-jobs-usdc', 'question-how-to-get-paid-usdc'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'what-are-work-certificates',
    pageIds: ['/for-freelancers', '/faq', '/reputation'],
    category: 'certificates',
    question: 'What are PolyLance work certificates?',
    answer: 'Upon milestone approval, the JobFactory contract mints a Soulbound (ERC-5192) Reputation Token (SBT) to the freelancer wallet. It cryptographically binds project title, payment volume, and completion timestamps on-chain as permanent verifiable portfolio proof.',
    keywordIds: ['web3-onchain-work-certificates', 'web3-verifiable-freelancer-reputation'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── CLIENTS ──
  {
    id: 'how-to-hire-guide',
    pageIds: ['/for-clients', '/faq'],
    category: 'clients',
    question: 'How do I hire a freelancer on PolyLance?',
    answer: 'Post a project with milestone specifications, review applicant proposals and on-chain work certificates, select the best candidate, and fund the Polygon escrow. You review all deliverables before authorizing payment release.',
    keywordIds: ['core-hire-web3-developers'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'refund-cancellation-rules',
    pageIds: ['/for-clients', '/escrow', '/faq', '/fees'],
    category: 'clients',
    question: 'Can I get a refund?',
    answer: "Before escrow is funded, you can cancel freely. After funding, funds can return to the client if the freelancer agrees to cancel, if the freelancer misses the deadline plus a 2-day grace period without delivering, or if a dispute is decided in the client's favor. PolyLance's 2.5% service fee is collected at funding, while 100% of the locked escrow principal is returned to the client upon cancellation. The freelancer service fee is never deducted on cancelled or refunded jobs. Once the client approves the work, payment can't be reversed. Network fees are never refundable.",
    keywordIds: ['problem-freelance-escrow-payment', 'problem-milestone-payment-protection'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── DISPUTES & SECURITY ──
  {
    id: 'dispute-arbitration-process',
    pageIds: ['/security', '/faq', '/how-it-works'],
    category: 'disputes',
    question: 'What happens if client and freelancer disagree on deliverables?',
    answer: 'Either party can open a formal dispute before funds are released. Both sides submit evidence hashes through the dispute room, and assigned JudgeDAO arbitrators evaluate deliverables against agreed terms. Arbitrator rulings can release funds 100% to either party or split them proportionally.',
    keywordIds: ['problem-milestone-payment-protection', 'web3-smart-contract-escrow'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'are-messages-private',
    pageIds: ['/security', '/faq'],
    category: 'security',
    question: 'Are messages on PolyLance private and encrypted?',
    answer: 'Messages are encrypted in transit using industry-standard TLS and authenticated session tokens. While communication between contract parties is restricted to authenticated participants, never share private keys, seed phrases, or sensitive passwords in chat.',
    keywordIds: ['brand-polylance-reviews', 'question-wallet-safety-guide'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'how-to-avoid-scams',
    pageIds: ['/security', '/faq', '/for-freelancers', '/for-clients'],
    category: 'security',
    question: 'How do I protect myself from freelance payment scams?',
    answer: 'Keep all milestones and communications strictly within PolyLance smart contract escrow. Never accept off-platform payments or wire transfers. Verify signature prompts originate from polylance.codes, and never share recovery seed phrases with anyone.',
    keywordIds: ['problem-avoid-payment-scams', 'question-wallet-safety-guide'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },

  // ── AUDITX SMART CONTRACT SECURITY ──
  {
    id: 'auditx-what-is-it',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'What is AuditX?',
    answer: 'AuditX is PolyLance automated smart contract analysis workspace. It performs static analysis and AST checks on Solidity code, helping freelancers, clients, and developers identify vulnerabilities and code quality issues before releasing milestone escrow funds or deploying to mainnet.',
    keywordIds: ['brand-polylance', 'brand-polylance-reviews'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-official-audit-status',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'Is AuditX a substitute for a professional third-party smart contract audit?',
    answer: 'No. AuditX is an automated static analysis hygiene tool designed to catch common programming bugs early. It is not an independent formal audit, cannot detect complex architectural or economic flaws, and does not provide an absolute guarantee of safety.',
    keywordIds: ['brand-polylance-reviews'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-privacy-and-access',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'Who can see my uploaded smart contracts and scan reports?',
    answer: 'Uploaded contracts and generated reports are strictly private to the authenticated uploader wallet. They are isolated on the server and are never published publicly, indexed, or shared with other platform users.',
    keywordIds: ['brand-polylance'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-vulnerabilities-checked',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'What vulnerabilities does AuditX detect?',
    answer: 'AuditX scans for critical EVM issues including reentrancy loop patterns, unprotected functions and missing access control modifiers, unchecked call return values, compiler configuration discrepancies, and gas optimization opportunities.',
    keywordIds: ['brand-polylance-reviews'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-supported-inputs',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'How can I submit contracts to AuditX?',
    answer: 'You can upload individual .sol files, drop a .zip archive, paste raw Solidity code into the web editor, or provide a verified contract address deployed on Polygon Mainnet.',
    keywordIds: ['brand-polylance'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-escrow-review',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'How does AuditX help clients review freelance deliverables?',
    answer: 'Clients can paste or upload contract deliverables received from freelancers and review an automated severity-ranked findings summary. This provides transparency on whether critical vulnerabilities exist before releasing escrow milestone payments.',
    keywordIds: ['problem-milestone-payment-protection'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-data-retention',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'How long does AuditX retain my uploaded files?',
    answer: 'Uploaded files and temporary analysis artifacts are automatically expired and purged from server storage after 30 days. You can also permanently delete any scan and report manually at any time from your workspace.',
    keywordIds: ['brand-polylance'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
  {
    id: 'auditx-pricing-quota',
    pageIds: ['/auditx', '/faq'],
    category: 'security',
    question: 'Is AuditX free to use?',
    answer: 'Yes. During the current preview period, all registered PolyLance users receive a daily quota of 15 automated scans at zero cost and without requiring gas fees.',
    keywordIds: ['brand-polylance'],
    schemaEligible: true,
    updatedAt: '2026-10-24'
  },
];


export function getFaqsForPage(pageId: string): FaqItem[] {
  const cleanPath = pageId.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return FAQ_DATA.filter((faq) => faq.pageIds.includes(cleanPath));
}

export function getAllFaqs(): FaqItem[] {
  return FAQ_DATA;
}
