/**
 * PolyLance Route SEO Registry
 * Maps each route path to its title (30-60 chars), meta description (120-160 chars),
 * canonical path, keywords, robots directives, JSON-LD types, and sitemap priorities.
 */

import { RouteSeoConfig } from './types';

export const PAGES_SEO: Record<string, RouteSeoConfig> = {
  // ── PUBLIC LANDING & MARKETING PAGES ──
  '/': {
    path: '/',
    title: 'PolyLance — Web3 Freelance Marketplace with Polygon Escrow',
    description: 'Hire vetted Web3 developers or find crypto freelance jobs protected by Polygon smart contract escrow. Work safely with milestone releases and low fees.',
    canonicalPath: '/',
    primaryKeywordId: 'core-web3-freelance-marketplace',
    secondaryKeywordIds: ['brand-polylance', 'core-freelance-jobs-crypto', 'problem-freelance-escrow-payment'],
    robots: 'index, follow',
    jsonLdTypes: ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage'],
    sitemapPriority: 1.0,
    changefreq: 'daily',
    ogType: 'website',
    breadcrumbs: [{ name: 'Home', url: '/' }]
  },

  '/find-jobs': {
    path: '/find-jobs',
    title: 'Find Web3 Freelance Jobs Paid in Crypto & USDC | PolyLance',
    description: 'Browse verified Web3 freelance jobs paid in USDC and POL. Apply with your wallet and work under on-chain escrow milestones with zero custody risk.',
    canonicalPath: '/find-jobs',
    primaryKeywordId: 'core-freelance-jobs-crypto',
    secondaryKeywordIds: ['web3-jobs-hub', 'core-freelance-jobs-usdc', 'web3-solidity-developer-jobs'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.9,
    changefreq: 'hourly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Find Jobs', url: '/find-jobs' }
    ]
  },

  '/how-it-works': {
    path: '/how-it-works',
    title: 'How PolyLance Works — Decentralized Web3 Freelance Escrow',
    description: 'Discover how PolyLance uses Polygon smart contract escrows to coordinate freelance contracts, milestone proof-of-work, and automated client approvals.',
    canonicalPath: '/how-it-works',
    primaryKeywordId: 'core-decentralized-freelance-platform',
    secondaryKeywordIds: ['problem-freelance-escrow-payment', 'question-how-crypto-escrow-works'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'How It Works', url: '/how-it-works' }
    ]
  },

  '/fees': {
    path: '/fees',
    title: 'Transparent Platform Fees & Gas Breakdown | PolyLance',
    description: 'Transparent PolyLance fee schedule: 2.5% service fee per side (5% total). Automatic escrow settlement on Polygon with zero withdrawal fees or currency spreads.',
    canonicalPath: '/fees',
    primaryKeywordId: 'problem-low-fee-freelance-platform',
    secondaryKeywordIds: ['problem-freelance-escrow-payment'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'monthly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Fees', url: '/fees' }
    ]
  },

  '/escrow': {
    path: '/escrow',
    title: 'Smart Contract Escrow for Web3 Freelancers | PolyLance',
    description: 'Secure milestone freelance payments on Polygon. Funds stay locked in immutable smart contracts until deliverables are verified and approved by the client.',
    canonicalPath: '/escrow',
    primaryKeywordId: 'problem-freelance-escrow-payment',
    secondaryKeywordIds: ['web3-smart-contract-escrow', 'problem-milestone-payment-protection'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Escrow', url: '/escrow' }
    ]
  },

  '/escrow-simulator': {
    path: '/escrow-simulator',
    title: 'Interactive Escrow Simulator & Fee Calculator | PolyLance',
    description: 'Simulate any freelance project budget on Polygon. Calculate exact client deposits, freelancer payouts, 2.5% fee splits, and milestone payment schedules.',
    canonicalPath: '/escrow-simulator',
    primaryKeywordId: 'tool-escrow-fee-simulator',
    secondaryKeywordIds: ['problem-low-fee-freelance-platform', 'problem-freelance-escrow-payment'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'WebApplication'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Escrow Simulator', url: '/escrow-simulator' }
    ]
  },

  '/security': {
    path: '/security',
    title: 'Smart Contract Security, Audits & Architecture | PolyLance',
    description: 'Review PolyLance security architecture, verified Polygon contract addresses, cryptographic SIWE authentication, and dispute resolution mechanisms.',
    canonicalPath: '/security',
    primaryKeywordId: 'brand-polylance-reviews',
    secondaryKeywordIds: ['web3-smart-contract-escrow', 'question-wallet-safety-guide'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.7,
    changefreq: 'monthly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Security', url: '/security' }
    ]
  },

  '/for-freelancers': {
    path: '/for-freelancers',
    title: 'Crypto Freelance Marketplace for Web3 Talent | PolyLance',
    description: 'Get hired by top Web3 projects and receive payments in USDC or POL. Build a tamper-proof on-chain portfolio of soulbound work reputation certificates.',
    canonicalPath: '/for-freelancers',
    primaryKeywordId: 'core-crypto-freelance-marketplace',
    secondaryKeywordIds: ['web3-onchain-work-certificates', 'core-freelance-jobs-usdc'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'For Freelancers', url: '/for-freelancers' }
    ]
  },

  '/for-clients': {
    path: '/for-clients',
    title: 'Hire Vetted Web3 & Solidity Freelancers Safely | PolyLance',
    description: 'Hire experienced Solidity, frontend, and smart contract engineers with protected Polygon escrow milestones. Only release funds when work meets requirements.',
    canonicalPath: '/for-clients',
    primaryKeywordId: 'core-hire-web3-developers',
    secondaryKeywordIds: ['question-how-to-hire-solidity-dev', 'web3-solidity-developer-jobs'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'For Clients', url: '/for-clients' }
    ]
  },

  '/get-paid-in-usdc': {
    path: '/get-paid-in-usdc',
    title: 'How to Get Paid in USDC for Freelance Work | PolyLance Guide',
    description: 'Complete guide to receiving freelance earnings in USDC on Polygon. Eliminate currency exchange friction and chargebacks with instant digital dollar escrow.',
    canonicalPath: '/get-paid-in-usdc',
    primaryKeywordId: 'core-freelance-jobs-usdc',
    secondaryKeywordIds: ['question-how-to-get-paid-usdc', 'core-freelance-jobs-crypto'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage', 'Article'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Get Paid in USDC', url: '/get-paid-in-usdc' }
    ]
  },

  '/get-paid-in-crypto': {
    path: '/get-paid-in-crypto',
    title: 'Get Paid in POL & Crypto for Freelance Services | PolyLance',
    description: 'Learn how Web3 freelancers receive instant payments in native POL and ERC-20 tokens. Low transaction fees and direct self-custodial wallet settlements.',
    canonicalPath: '/get-paid-in-crypto',
    primaryKeywordId: 'core-get-paid-in-pol',
    secondaryKeywordIds: ['core-freelance-jobs-crypto', 'question-polygon-for-payments'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage', 'Article'],
    sitemapPriority: 0.7,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Get Paid in Crypto', url: '/get-paid-in-crypto' }
    ]
  },

  '/auditx': {
    path: '/auditx',
    title: 'AuditX — Smart Contract Security Checks | PolyLance',
    description: 'Automated vulnerability scanning for Solidity smart contracts. Check deliverables, catch reentrancy bugs, and review security findings before escrow release.',
    canonicalPath: '/auditx',
    primaryKeywordId: 'auditx-contract-security',
    secondaryKeywordIds: ['brand-polylance-reviews'],
    robots: 'index, follow',
    jsonLdTypes: ['SoftwareApplication', 'WebApplication', 'FAQPage', 'BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'AuditX', url: '/auditx' }
    ]
  },

  '/web3-jobs': {
    path: '/web3-jobs',
    title: 'Web3 Freelance Jobs & Blockchain Contract Gigs | PolyLance',
    description: 'Discover curated Web3 freelance jobs across smart contract development, dapp engineering, tokenomics, and security auditing on Polygon PoS.',
    canonicalPath: '/web3-jobs',
    primaryKeywordId: 'web3-jobs-hub',
    secondaryKeywordIds: ['core-freelance-jobs-crypto', 'web3-solidity-developer-jobs'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Web3 Jobs', url: '/web3-jobs' }
    ]
  },

  '/polygon-jobs': {
    path: '/polygon-jobs',
    title: 'Polygon Freelance Jobs & PoS DApp Development | PolyLance',
    description: 'Find freelance gigs on Polygon network. Work on high-speed, sub-cent transaction dApps and receive payments directly in POL and Polygon USDC.',
    canonicalPath: '/polygon-jobs',
    primaryKeywordId: 'core-polygon-freelance-marketplace',
    secondaryKeywordIds: ['core-get-paid-in-pol', 'question-polygon-for-payments'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Polygon Jobs', url: '/polygon-jobs' }
    ]
  },

  '/solidity-developer-jobs': {
    path: '/solidity-developer-jobs',
    title: 'Solidity Developer Freelance Jobs & Smart Contracts',
    description: 'Explore verified freelance Solidity developer jobs. Build secure EVM smart contracts, token bridges, and DeFi protocols protected by on-chain escrow.',
    canonicalPath: '/solidity-developer-jobs',
    primaryKeywordId: 'web3-solidity-developer-jobs',
    secondaryKeywordIds: ['web3-smart-contract-developer-jobs', 'skill-solidity'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Solidity Jobs', url: '/solidity-developer-jobs' }
    ]
  },

  '/smart-contract-developer-jobs': {
    path: '/smart-contract-developer-jobs',
    title: 'Smart Contract Developer Jobs & Escrow Contracts | PolyLance',
    description: 'Find high-paying freelance smart contract engineering gigs. Implement upgradeable contracts, NFT platforms, and automated escrow modules.',
    canonicalPath: '/smart-contract-developer-jobs',
    primaryKeywordId: 'web3-smart-contract-developer-jobs',
    secondaryKeywordIds: ['web3-solidity-developer-jobs', 'skill-smart-contracts'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Smart Contract Jobs', url: '/smart-contract-developer-jobs' }
    ]
  },

  '/dapp-developer-jobs': {
    path: '/dapp-developer-jobs',
    title: 'DApp Developer Jobs & Full-Stack Web3 Projects | PolyLance',
    description: 'Connect with projects seeking full-stack dApp builders proficient in React, Wagmi, Ethers, Viem, and Polygon contracts. Milestone escrow protected.',
    canonicalPath: '/dapp-developer-jobs',
    primaryKeywordId: 'web3-dapp-developer-jobs',
    secondaryKeywordIds: ['skill-frontend-web3', 'web3-jobs-hub'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'DApp Jobs', url: '/dapp-developer-jobs' }
    ]
  },

  '/faq': {
    path: '/faq',
    title: 'Frequently Asked Questions & Support Hub | PolyLance',
    description: 'Answers to common questions about PolyLance smart contract escrow, platform fees, wallet sign-in, review periods, and dispute resolution.',
    canonicalPath: '/faq',
    primaryKeywordId: 'question-how-crypto-escrow-works',
    secondaryKeywordIds: ['problem-low-fee-freelance-platform', 'brand-polylance'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'FAQPage'],
    sitemapPriority: 0.8,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'FAQ', url: '/faq' }
    ]
  },

  '/blog': {
    path: '/blog',
    title: 'Web3 Freelance Blog, Escrow Guides & Tutorials | PolyLance',
    description: 'In-depth articles and tutorials on crypto escrow, getting paid in USDC, smart contract hiring, fee breakdowns, and decentralized freelancing.',
    canonicalPath: '/blog',
    primaryKeywordId: 'core-crypto-freelance-marketplace',
    secondaryKeywordIds: ['question-how-to-get-paid-usdc', 'problem-avoid-payment-scams'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.8,
    changefreq: 'daily',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' }
    ]
  },

  '/reputation': {
    path: '/reputation',
    title: 'Verifiable On-Chain Reputation & Work Certificates',
    description: 'Inspect verifiable soulbound reputation tokens issued to freelancers upon milestone completion. Cryptographic proof of work with zero forgery risk.',
    canonicalPath: '/reputation',
    primaryKeywordId: 'web3-onchain-work-certificates',
    secondaryKeywordIds: ['web3-verifiable-freelancer-reputation', 'core-crypto-freelance-marketplace'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.7,
    changefreq: 'weekly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Reputation', url: '/reputation' }
    ]
  },

  '/about': {
    path: '/about',
    title: 'About PolyLance — The Open Polygon Escrow Marketplace',
    description: 'Learn about PolyLance mission to build a decentralized freelance economy where payments are guaranteed by open smart contracts on Polygon PoS.',
    canonicalPath: '/about',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: ['core-decentralized-freelance-platform'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList', 'Organization'],
    sitemapPriority: 0.6,
    changefreq: 'monthly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'About', url: '/about' }
    ]
  },

  '/contact': {
    path: '/contact',
    title: 'Contact Support & Developer Relations | PolyLance',
    description: 'Reach out to the PolyLance team for assistance with escrows, platform questions, developer integrations, or security disclosures.',
    canonicalPath: '/contact',
    primaryKeywordId: 'brand-polylance-codes',
    secondaryKeywordIds: ['brand-polylance'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.5,
    changefreq: 'monthly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Contact', url: '/contact' }
    ]
  },

  '/terms': {
    path: '/terms',
    title: 'Terms of Service & Smart Contract Protocol Agreement',
    description: 'Review the terms governing the use of the PolyLance marketplace interface, smart contract interactions, and user dispute arbitration.',
    canonicalPath: '/terms',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: ['problem-freelance-escrow-payment'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.4,
    changefreq: 'yearly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Terms of Service', url: '/terms' }
    ]
  },

  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy & Public Blockchain Data Disclosures',
    description: 'Understand how PolyLance handles session authentication and respects user privacy while interacting with transparent public Polygon ledgers.',
    canonicalPath: '/privacy',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: ['brand-polylance-codes'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.4,
    changefreq: 'yearly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Privacy Policy', url: '/privacy' }
    ]
  },

  '/help': {
    path: '/help',
    title: 'Help Center & Web3 Freelancer Knowledge Base | PolyLance',
    description: 'Browse comprehensive guides on wallet setup, funding escrows, milestone submissions, time extension requests, and arbitration on PolyLance.',
    canonicalPath: '/help',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: ['question-how-crypto-escrow-works'],
    robots: 'index, follow',
    jsonLdTypes: ['BreadcrumbList'],
    sitemapPriority: 0.6,
    changefreq: 'monthly',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Help Center', url: '/help' }
    ]
  },


  // ── PRIVATE / APPLICATION ROUTES (STRICTLY NOINDEX, NOFOLLOW) ──
  '/auditx/scan': {
    path: '/auditx/scan',
    title: 'AuditX Code Scanning Workspace | PolyLance',
    description: 'Upload and scan Solidity smart contracts in an isolated sandbox.',
    canonicalPath: '/auditx/scan',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/auditx/reports': {
    path: '/auditx/reports',
    title: 'My AuditX Reports | PolyLance',
    description: 'Private smart contract analysis history and vulnerability findings.',
    canonicalPath: '/auditx/reports',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/auditx/internal': {
    path: '/auditx/internal',
    title: 'PolyLance Internal Smart Contract Security Report | PolyLance',
    description: 'Admin-only internal security hardening report for PolyLance core protocol contracts.',
    canonicalPath: '/auditx/internal',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/dashboard': {
    path: '/dashboard',
    title: 'Client & Freelancer Dashboard | PolyLance',
    description: 'Private dashboard for managing active contracts, proposals, and milestones.',
    canonicalPath: '/dashboard',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/messages': {
    path: '/messages',
    title: 'Messages & Encrypted Chat | PolyLance',
    description: 'Private negotiation channels and escrow coordination chat.',
    canonicalPath: '/messages',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/chat': {
    path: '/chat',
    title: 'Chat Workspace | PolyLance',
    description: 'Private escrow communication and proposal negotiation.',
    canonicalPath: '/chat',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/workspace': {
    path: '/workspace',
    title: 'Contract Workspace | PolyLance',
    description: 'Private project workspace for code submissions and milestone tracking.',
    canonicalPath: '/workspace',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/settings': {
    path: '/settings',
    title: 'Account Settings & Preferences | PolyLance',
    description: 'Private user preferences, notification settings, and wallet configuration.',
    canonicalPath: '/settings',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/login': {
    path: '/login',
    title: 'Sign In With Wallet | PolyLance',
    description: 'Authenticate with your Polygon wallet using Sign-In with Ethereum (EIP-4361).',
    canonicalPath: '/login',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/onboarding': {
    path: '/onboarding',
    title: 'Profile Setup & Onboarding | PolyLance',
    description: 'Create your freelancer or client profile on PolyLance.',
    canonicalPath: '/onboarding',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/jobs/post': {
    path: '/jobs/post',
    title: 'Post a New Job | PolyLance',
    description: 'Post a job with milestone deliverables and deposit escrow on Polygon.',
    canonicalPath: '/jobs/post',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/post-job': {
    path: '/post-job',
    title: 'Post a Job | PolyLance',
    description: 'Publish a freelance project to the PolyLance marketplace.',
    canonicalPath: '/post-job',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/judge': {
    path: '/judge',
    title: 'JudgeDAO Arbitration Docket | PolyLance',
    description: 'Arbitrator portal for reviewing evidence and adjudicating escrow disputes.',
    canonicalPath: '/judge',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/treasury': {
    path: '/treasury',
    title: 'Platform Treasury & Protocol Reserve | PolyLance',
    description: 'Internal treasury inspection and timelock contract management.',
    canonicalPath: '/treasury',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
  '/maintenance': {
    path: '/maintenance',
    title: 'Platform Maintenance | PolyLance',
    description: 'Scheduled protocol upgrades and network synchronization in progress.',
    canonicalPath: '/maintenance',
    primaryKeywordId: 'brand-polylance',
    secondaryKeywordIds: [],
    robots: 'noindex, nofollow',
    jsonLdTypes: [],
  },
};

export function getRouteSeo(pathname: string): RouteSeoConfig | undefined {
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return PAGES_SEO[cleanPath];
}
