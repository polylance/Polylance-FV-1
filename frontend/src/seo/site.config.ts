/**
 * PolyLance Site SEO & Platform Constants Configuration
 * Single source of truth for site URLs, brand metadata, and contract policies.
 */

import { SiteConfig } from './types';

// Strict canonical host: polylance.codes, protocol: https
const ENV_SITE_URL = typeof process !== 'undefined' && process.env?.VITE_SITE_URL
  ? process.env.VITE_SITE_URL
  : (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SITE_URL) || 'https://polylance.codes';

export const SITE_URL = ENV_SITE_URL.replace(/\/+$/, '');
export const SITE_NAME = 'PolyLance';
export const DEFAULT_LOCALE = 'en-US';
export const THEME_COLOR = '#0047AB'; // PolyLance Blue
export const CONTACT_EMAIL = 'support@polylance.codes';
export const SECURITY_EMAIL = 'security@polylance.codes';
export const TWITTER_HANDLE = '@PolyLanceCodes';
export const GITHUB_URL = 'https://github.com/polylance';

// Verified Contract & Policy Constants (read from Polygon deployment manifests and smart contracts)
export const PLATFORM_FEE_PERCENT = 2.5; // 2.5% platform fee (250 basis points)
export const FEE_PAID_BY = 'both' as const; // Dual: 2.5% client deposit fee + 2.5% freelancer payout fee (5.0% total)
export const REVIEW_WINDOW_DAYS = 7; // 7-day client review window
export const DELIVERY_GRACE_DAYS = 2; // 48-hour delivery grace period before expiry
export const AUTO_RELEASE_ON_REVIEW_TIMEOUT = true; // Claimable via JobEscrow.claimAutoRelease() on-chain

export const DISPUTE_PANEL_SIZE = 3; // 3-judge decentralized peer arbitration panel
export const DISPUTE_EVIDENCE_WINDOW_DAYS = 3; // 72-hour evidence submission period

export const MESSAGING_CONFIG = {
  mode: 'in_transit' as const,
  label: 'Encrypted in transit',
  isE2EE: false,
  shortDesc: 'Wallet-signed session with TLS 1.3 transport encryption protects specifications and proposals.',
  details: 'Client and freelancer discussions are encrypted in transit using industry-standard TLS 1.3. Sessions require cryptographic wallet signature verification (SIWE). Never share private keys or seed phrases in chat.',
} as const;

export const AUDIT_STATUS = {
  isAudited: false,
  status: 'pending' as const,
  label: 'Not yet independently audited',
  subtext: 'Third-party security audit pending',
  url: '/security',
} as const;

export const POLYGON_CHAIN_ID = 137;
export const POLYGONSCAN_BASE_URL = 'https://polygonscan.com';

export const MAINNET_CONTRACTS = {
  jobFactory: '0xbE74923BBfd72d400a681915dBcf6e6Adc72C317',
  jobEscrowImpl: '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB',
  reputationSBT: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
  profileRegistry: '0xA408070979043215C8C91d245973886eA7c09f42',
  githubReputationRegistry: '0x91e103Fd78ccC3233d08f4830587763F72b9D5aB',
  judgeDAO: '0xe991e45907Bd341a036CF4A6a95768af198d4b86',
  timelockController: '0x45602bE11306651C7FA5c96Bc7fa5051BA4a856f',
} as const;

export const SITE: SiteConfig = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  defaultLocale: DEFAULT_LOCALE,
  defaultOgImage: `${SITE_URL}/assets/og-image.png`,
  twitterHandle: TWITTER_HANDLE,
  githubUrl: GITHUB_URL,
  contactEmail: CONTACT_EMAIL,
  themeColor: THEME_COLOR,
  platformFeePercent: PLATFORM_FEE_PERCENT,
  feePaidBy: FEE_PAID_BY,
  reviewWindowDays: REVIEW_WINDOW_DAYS,
  deliveryGraceDays: DELIVERY_GRACE_DAYS,
  autoReleaseOnReviewTimeout: AUTO_RELEASE_ON_REVIEW_TIMEOUT,
  polygonscanUrl: POLYGONSCAN_BASE_URL,
  contracts: {
    jobFactory: MAINNET_CONTRACTS.jobFactory,
    jobEscrowImpl: MAINNET_CONTRACTS.jobEscrowImpl,
    reputationSBT: MAINNET_CONTRACTS.reputationSBT,
    profileRegistry: MAINNET_CONTRACTS.profileRegistry,
    judgeDAO: MAINNET_CONTRACTS.judgeDAO,
    timelockController: MAINNET_CONTRACTS.timelockController,
  },
};
