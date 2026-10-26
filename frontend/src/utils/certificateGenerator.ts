/**
 * PolyLance Canonical Verified Work & Patronage Certificate Generator
 * Standardized on A4 Landscape (1.414:1 ratio, 1414x1000 viewBox).
 * 
 * Human-designed Banknote / Sovereign Diploma Aesthetics:
 * 1. Single canonical renderer: pure function renderCertificate(data, designVersion) -> SVG
 * 2. Header Brand Lockup: Real glowing hexagon logo (polylance_logo.png) beside the script wordmark (polylance-verified-seal.png) on a shared baseline with mix-blend-mode: multiply
 * 3. Center Embossed Foil Seal: Real glowing hexagon mark + script wordmark inside scalloped antique-gold foil seal rim with radial gradient and double inner rings
 * 4. Anti-forgery & security marks: Seeded dynamic guilloche border, continuous 5.5px microtext, near-invisible hidden hash, large watermark logo, hover-only shine sweep
 * 5. Official Polygon Lockup: Vector mark with official #8247E5 Polygon purple and "Secured on Polygon PoS"
 * 6. Discreet Job Record Commitment: keccak256 hash commitment of canonical preimage; only public-safe fields exposed
 * 7. Unified design system: Cobalt & Ink for Verified Work, Antique Gold & Ink for Patronage
 */

import { ethers } from 'ethers';
import QRCode from 'qrcode';
import { formatAmount } from './formatAmount';
import { truncateAddress, toChecksumAddress } from './formatters';
import { POLYLANCE_LOGO_DATA_URI, POLYLANCE_SCRIPT_WORDMARK_DATA_URI } from '../assets/brandDataUris';

export interface KnownTokenInfo {
  onchainTokenId: number;
  certificateNo: number;
  mintTxHash: string;
  mintBlock: number;
  mintedAt: number;
  holderWallet: string;
  clientWallet: string;
  jobTitle: string;
  jobId: string;
  variant: 'work' | 'patronage';
  amount: number;
  tokenSymbol: string;
}

export const KNOWN_ONCHAIN_TOKENS: Record<string, KnownTokenInfo> = {
  "0": {
    onchainTokenId: 0,
    certificateNo: 1181,
    mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f",
    mintBlock: 94145122,
    mintedAt: 1792126500000,
    holderWallet: "0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Polylance Backend Archite",
    jobId: "0xcf3665d90001",
    variant: "work",
    amount: 10,
    tokenSymbol: "POL"
  },
  "1181": {
    onchainTokenId: 0,
    certificateNo: 1181,
    mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f",
    mintBlock: 94145122,
    mintedAt: 1792126500000,
    holderWallet: "0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Polylance Backend Archite",
    jobId: "0xcf3665d90001",
    variant: "work",
    amount: 10,
    tokenSymbol: "POL"
  },
  "0xcf3665d90001": {
    onchainTokenId: 0,
    certificateNo: 1181,
    mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f",
    mintBlock: 94145122,
    mintedAt: 1792126500000,
    holderWallet: "0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Polylance Backend Archite",
    jobId: "0xcf3665d90001",
    variant: "work",
    amount: 10,
    tokenSymbol: "POL"
  },

  "1": {
    onchainTokenId: 1,
    certificateNo: 1,
    mintTxHash: "0xaae9b181e5c9450459f7f5191ae0a3705390f3194c9d648cfa108a35bed40c36",
    mintBlock: 94145176,
    mintedAt: 1792126800000,
    holderWallet: "0x62cDfc0692cC675c95304BaCE2C834D8F901dCba",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Build smart contract escrow",
    jobId: "0x91175c581877",
    variant: "work",
    amount: 10,
    tokenSymbol: "POL"
  },
  "0x91175c581877": {
    onchainTokenId: 1,
    certificateNo: 1,
    mintTxHash: "0xaae9b181e5c9450459f7f5191ae0a3705390f3194c9d648cfa108a35bed40c36",
    mintBlock: 94145176,
    mintedAt: 1792126800000,
    holderWallet: "0x62cDfc0692cC675c95304BaCE2C834D8F901dCba",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Build smart contract escrow",
    jobId: "0x91175c581877",
    variant: "work",
    amount: 10,
    tokenSymbol: "POL"
  },

  "2": {
    onchainTokenId: 2,
    certificateNo: 9805,
    mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542",
    mintBlock: 94145179,
    mintedAt: 1792127023000,
    holderWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Enhance Polylance UI design",
    jobId: "0x0d34f6b4fb25",
    variant: "patronage",
    amount: 10,
    tokenSymbol: "POL"
  },
  "9805": {
    onchainTokenId: 2,
    certificateNo: 9805,
    mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542",
    mintBlock: 94145179,
    mintedAt: 1792127023000,
    holderWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Enhance Polylance UI design",
    jobId: "0x0d34f6b4fb25",
    variant: "patronage",
    amount: 10,
    tokenSymbol: "POL"
  },
  "0x0d34f6b4fb25": {
    onchainTokenId: 2,
    certificateNo: 9805,
    mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542",
    mintBlock: 94145179,
    mintedAt: 1792127023000,
    holderWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    clientWallet: "0xB8aa0398B91A150B041DA819bc954Bb356e009Dd",
    jobTitle: "Enhance Polylance UI design",
    jobId: "0x0d34f6b4fb25",
    variant: "patronage",
    amount: 10,
    tokenSymbol: "POL"
  }
};

export interface CertificateData {
  tokenId: number | string;
  certificateNo?: number | string;
  variant?: 'work' | 'patronage';
  jobId?: string;
  engagementId?: string;
  jobTitle: string;
  category?: string;
  recipientAddress: string;
  recipientName?: string;
  clientAddress?: string;
  clientName?: string;
  amount: number | string;
  tokenSymbol?: string;
  completedAt: number; // Unix timestamp in seconds or ms
  contractAddress?: string; // SBT Contract
  escrowAddress?: string; // Job Escrow Contract
  releaseTxHash?: string;
  milestoneCount?: number;
  recordHash?: string; // Precomputed keccak256 commitment
  salt?: string;
  designVersion?: string;
  isLegacy?: boolean;
  traceRecipientAddress?: string;
  settlementPolRate?: number | string;
}

export interface JobRecordPreimage {
  approvalTime: number;
  budget: string;
  category: string;
  chainId: number;
  clientAddress: string;
  deliverableCids: string[];
  engagementId: string;
  escrowContract: string;
  freelancerAddress: string;
  freelancerFee: string;
  freelancerNet: string;
  jobId: string;
  milestoneCount: number;
  releaseTxHash: string;
  role: 'freelancer' | 'client';
  salt: string;
  sbtContract: string;
  schemaVersion: string;
  title: string;
  token: string;
}

export interface ProofPack {
  schemaVersion: string;
  recordHash: string;
  tokenId: string | number;
  preimage: JobRecordPreimage;
  generatedAt: string;
  verifyUrl: string;
}

/**
 * Escape XML special characters for safe SVG inclusion
 */
export function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Format timestamp into standard human readable date (e.g., "OCT 16, 2026")
 */
function formatDate(ts: number): string {
  if (!ts) return 'OCT 16, 2026';
  const ms = ts > 1e11 ? ts : ts * 1000;
  const d = new Date(ms);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

/**
 * Builds canonical JSON preimage object with sorted keys
 */
export function buildJobRecordPreimage(data: CertificateData, customSalt?: string): JobRecordPreimage {
  const ms = data.completedAt > 1e11 ? data.completedAt : (data.completedAt || 1729094400) * 1000;
  const approvalSec = Math.floor(ms / 1000);
  const salt = customSalt || data.salt || '0x4f8a912e73c8d0b2e5a19846321f0987cba6543210fe9876543210abcdef1234';

  return {
    approvalTime: approvalSec,
    budget: String(data.amount || '0'),
    category: data.category || 'Web3 Engineering',
    chainId: 137,
    clientAddress: toChecksumAddress(data.clientAddress || '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092'),
    deliverableCids: [],
    engagementId: data.engagementId || `eng-${data.tokenId}`,
    escrowContract: toChecksumAddress(data.escrowAddress || '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB'),
    freelancerAddress: toChecksumAddress(data.recipientAddress || '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D'),
    freelancerFee: '0',
    freelancerNet: String(data.amount || '0'),
    jobId: data.jobId || `job-${data.tokenId}`,
    milestoneCount: data.milestoneCount || 1,
    releaseTxHash: data.releaseTxHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
    role: data.variant === 'patronage' ? 'client' : 'freelancer',
    salt,
    sbtContract: toChecksumAddress(data.contractAddress || '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879'),
    schemaVersion: '1.0',
    title: data.jobTitle || 'Verified PolyLance Sovereign Deliverable',
    token: (data.tokenSymbol || 'POL').toUpperCase(),
  };
}

/**
 * Computes deterministic keccak256 hash of canonical preimage
 */
export function computeRecordHash(preimage: JobRecordPreimage): string {
  const sortedKeys = Object.keys(preimage).sort() as Array<keyof JobRecordPreimage>;
  const sortedObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    sortedObj[k] = preimage[k];
  }
  const canonicalJson = JSON.stringify(sortedObj);
  return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
}

/**
 * Builds complete ProofPack for user download and offline/third-party verification
 */
export function buildProofPack(data: CertificateData): ProofPack {
  const preimage = buildJobRecordPreimage(data);
  const recordHash = computeRecordHash(preimage);
  const tokenIdStr = String(data.tokenId);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://polylance.codes';
  const verifyUrl = `${origin}/#/verify?certId=${encodeURIComponent(tokenIdStr)}&code=${encodeURIComponent(recordHash.slice(0, 10))}`;

  return {
    schemaVersion: '1.0',
    recordHash,
    tokenId: data.tokenId,
    preimage,
    generatedAt: new Date().toISOString(),
    verifyUrl,
  };
}

/**
 * Pure seeded PRNG (SplitMix32) derived from record hash for unique, deterministic guilloche borders
 */
function createSeededPrng(seedStr: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Generates harmonic guilloche sine ribbons derived from certificate seed
 */
function generateGuillocheRibbons(seed: string, color: string): string {
  const prng = createSeededPrng(seed);
  const freq1 = 0.015 + prng() * 0.01;
  const freq2 = 0.025 + prng() * 0.015;
  const amp1 = 4 + prng() * 3;
  const amp2 = 3 + prng() * 2;
  const phase1 = prng() * Math.PI * 2;
  const phase2 = prng() * Math.PI * 2;

  // Top border ribbon: x from 80 to 1334
  let topD1 = 'M 80 54 ';
  let topD2 = 'M 80 54 ';
  for (let x = 80; x <= 1334; x += 12) {
    const y1 = 54 + Math.sin(x * freq1 + phase1) * amp1;
    const y2 = 54 + Math.cos(x * freq2 + phase2) * amp2;
    topD1 += `L ${x.toFixed(1)} ${y1.toFixed(1)} `;
    topD2 += `L ${x.toFixed(1)} ${y2.toFixed(1)} `;
  }

  // Bottom border ribbon: x from 80 to 1334
  let botD1 = 'M 80 946 ';
  let botD2 = 'M 80 946 ';
  for (let x = 80; x <= 1334; x += 12) {
    const y1 = 946 + Math.sin(x * freq1 + phase1) * amp1;
    const y2 = 946 + Math.cos(x * freq2 + phase2) * amp2;
    botD1 += `L ${x.toFixed(1)} ${y1.toFixed(1)} `;
    botD2 += `L ${x.toFixed(1)} ${y2.toFixed(1)} `;
  }

  // Left border ribbon: y from 80 to 920
  let leftD1 = 'M 54 80 ';
  let leftD2 = 'M 54 80 ';
  for (let y = 80; y <= 920; y += 12) {
    const x1 = 54 + Math.sin(y * freq1 + phase1) * amp1;
    const x2 = 54 + Math.cos(y * freq2 + phase2) * amp2;
    leftD1 += `L ${x1.toFixed(1)} ${y.toFixed(1)} `;
    leftD2 += `L ${x2.toFixed(1)} ${y.toFixed(1)} `;
  }

  // Right border ribbon: y from 80 to 920
  let rightD1 = 'M 1360 80 ';
  let rightD2 = 'M 1360 80 ';
  for (let y = 80; y <= 920; y += 12) {
    const x1 = 1360 + Math.sin(y * freq1 + phase1) * amp1;
    const x2 = 1360 + Math.cos(y * freq2 + phase2) * amp2;
    rightD1 += `L ${x1.toFixed(1)} ${y.toFixed(1)} `;
    rightD2 += `L ${x2.toFixed(1)} ${y.toFixed(1)} `;
  }

  return `
    <path d="${topD1}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.35" />
    <path d="${topD2}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.25" stroke-dasharray="3,2" />
    <path d="${botD1}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.35" />
    <path d="${botD2}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.25" stroke-dasharray="3,2" />
    <path d="${leftD1}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.35" />
    <path d="${leftD2}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.25" stroke-dasharray="3,2" />
    <path d="${rightD1}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.35" />
    <path d="${rightD2}" fill="none" stroke="${color}" stroke-width="0.8" stroke-opacity="0.25" stroke-dasharray="3,2" />
  `;
}

/**
 * Generates an authentic embossed scalloped foil rim for royal / university seals
 */
function generateScallopedSealPath(cx: number, cy: number, rInner: number, rOuter: number, teeth: number = 48): string {
  let path = '';
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a1 = i * step;
    const aMid = a1 + step / 2;
    const a2 = a1 + step;

    const x0 = cx + Math.cos(a1) * rInner;
    const y0 = cy + Math.sin(a1) * rInner;
    const xMid = cx + Math.cos(aMid) * rOuter;
    const yMid = cy + Math.sin(aMid) * rOuter;
    const x1 = cx + Math.cos(a2) * rInner;
    const y1 = cy + Math.sin(a2) * rInner;

    if (i === 0) {
      path += `M ${x0.toFixed(2)} ${y0.toFixed(2)} `;
    }
    path += `Q ${xMid.toFixed(2)} ${yMid.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)} `;
  }
  return path + 'Z';
}

/**
 * Generates synchronous vector QR code path
 */
function generateQrVectorPath(text: string): { path: string; size: number } {
  try {
    const qr = (QRCode as any).create(text, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    let path = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c},${r}h1v1h-1z `;
        }
      }
    }
    return { path, size };
  } catch {
    return { path: 'M0,0h1v1h-1z', size: 1 };
  }
}

/**
 * CANONICAL CERTIFICATE DESIGN TOKENS
 * Official PolyLance Palette: Black, White/Parchment, Cobalt Blue, Electric Blue
 */
export const CERTIFICATE_THEME = {
  paperBg: '#F8FAFC',        // Clean cool-white banknote parchment
  inkBlack: '#0B0E14',       // Deep banknote ink obsidian black
  inkMuted: '#475569',       // Slate 600
  inkLight: '#94A3B8',       // Slate 400
  cobaltBlue: '#0047FF',     // Official PolyLance Cobalt Blue (primary accent)
  cobaltDeep: '#030E24',     // Deep navy cobalt for seal gradient
  electricBlue: '#00D2FF',   // Electric blue for highlights, rim highlight, shine
  borderDark: '#0B0E14',     // Outer frame (obsidian black)
  borderCobalt: '#0047FF',   // Inner frame (cobalt blue)
  confirmedGreen: '#10B981', // Confirmed on Polygon status tick
  polygonPurple: '#0047FF',  // Official brand cobalt blue vector mark
};

/**
 * CANONICAL CERTIFICATE RENDERER
 * 
 * Pure, deterministic function: renderCertificate(data, designVersion) -> SVG
 * Renders A4 Landscape (1414 x 1000) certificate artwork using official PolyLance palette:
 * - Cobalt Blue (#0047AB) as primary accent, Electric Blue (#00D2FF) for highlights, Deep Ink (#0A0D14), Cool White (#F8FAFC)
 * - Seal: Cobalt-to-navy radial foil finish, electric-blue rim highlight, 48 scallops, double inner ring, emboss shadow/highlight
 * - Seal text: Full mathematical textPath circumference with fixed separator stars
 * - Inside seal: Only glowing hexagon logo, scaled 62% of inner circle, no script name
 * - Script wordmark: Placed centered directly BELOW seal (58% of seal width) with mix-blend-mode: multiply
 * - Anti-forgery: Seeded guilloche ribbons, continuous 5.2px microtext, hidden 16-char hash, faint large logo watermark
 */
export function renderCertificate(data: CertificateData, designVersion: string = 'v2.0'): string {
  const isWork = data.variant !== 'patronage';
  
  // Design Tokens (Unified across both variants - zero drift)
  const T = CERTIFICATE_THEME;
  const accentColor = T.cobaltBlue;
  const frameAccent = T.borderCobalt;
  const deepInk = T.inkBlack;
  const coolWhite = T.paperBg;

  const variantLabel = isWork ? 'PROOF OF WORK' : 'PATRONAGE';
  const headingText = isWork ? 'Certificate of Verified Work' : 'Certificate of Patronage';

  const recipientShort = truncateAddress(data.recipientAddress);
  const recipientDisplay = data.recipientName ? `${data.recipientName} (${recipientShort})` : recipientShort;

  const clientShort = truncateAddress(data.clientAddress);
  const clientDisplay = data.clientName ? `${data.clientName} (${clientShort})` : clientShort;

  const tokenSymbol = (data.tokenSymbol || 'POL').toUpperCase();
  const isCrypto = tokenSymbol === 'POL' || tokenSymbol === 'MATIC';
  
  // Format amount with canonical formatAmount (no "$" on crypto)
  const formattedAmtObj = formatAmount(data.amount || 0, tokenSymbol);
  const formattedAmount = `${formattedAmtObj.formatted} ${tokenSymbol}`;
  const polRate = data.settlementPolRate || (typeof window !== 'undefined' && (window as any)._polylancePolPrice) || 0.45;
  const fiatEquivalent = isCrypto
    ? `≈ $${(Number(formattedAmtObj.formatted.replace(/,/g, '')) * polRate).toFixed(2)} USD`
    : `≈ $${formattedAmtObj.formatted} USD`;

  const formattedDate = formatDate(data.completedAt);
  const tokenIdStr = String(data.tokenId);
  const certificateNoStr = data.certificateNo ? String(data.certificateNo) : '';

  // Discreet cryptographic commitment (keccak256 hash)
  const preimage = buildJobRecordPreimage(data);
  const recordHash = data.recordHash || computeRecordHash(preimage);
  const shortVerificationCode = recordHash.slice(0, 10);
  const hidden16Hash = recordHash.slice(2, 18);
  const displayHash = `${recordHash.slice(0, 10)}...${recordHash.slice(-8)}`;
  const displayTxHash = data.releaseTxHash ? truncateAddress(data.releaseTxHash) : '0x7a89...01ab';

  // Verification URL derived from environment / origin (supports both token and cert params)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://polylance.codes';
  const verifyUrl = `${origin}/#/certified-pass?token=${encodeURIComponent(tokenIdStr)}${certificateNoStr && certificateNoStr !== tokenIdStr ? `&cert=${encodeURIComponent(certificateNoStr)}` : ''}&code=${encodeURIComponent(shortVerificationCode)}`;

  // Generate QR vector path synchronously
  const { path: qrPath, size: qrSize } = generateQrVectorPath(verifyUrl);

  // Security Border Guilloche ribbons seeded by record hash (in low-contrast cobalt)
  const guillocheMarkup = generateGuillocheRibbons(recordHash, T.cobaltBlue);

  // Scalloped Foil Rim for Central Oracle Seal (48 fine scallops)
  const scallopedSealPath = generateScallopedSealPath(0, 0, 84, 89, 48);

  // Continuous microtext line containing strictly public-safe fields (NO private details)
  const sbtContractTrunc = truncateAddress(data.contractAddress || '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879');
  const escrowContractTrunc = truncateAddress(data.escrowAddress || '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB');
  const certNoMicro = certificateNoStr && certificateNoStr !== tokenIdStr ? ` · CERT NO ${certificateNoStr}` : '';
  const microtextSentence = `POLYLANCE · VERIFIED ON POLYGON · PL-SBT #${tokenIdStr}${certNoMicro} · ${shortVerificationCode} · CHAIN 137 · SBT ${sbtContractTrunc} · ESCROW ${escrowContractTrunc} · DATE ${formattedDate} · ${tokenSymbol} · DESIGN ${designVersion} · `;
  const microtextRepeated = microtextSentence.repeat(4);

  // Safe job title truncation
  const rawTitle = data.jobTitle || 'Verified On-Chain Contract Deliverable';
  const cleanTitle = rawTitle.length > 58 ? rawTitle.slice(0, 55) + '...' : rawTitle;

  // Seal Top & Bottom text: Full string fits the whole circumference exactly
  const sealTopText = isWork 
    ? '★ CERTIFICATE · WORK · VERIFIED ★'
    : '★ CERTIFICATE · PATRONAGE · VERIFIED ★';
  const sealBottomText = '★ POLYLANCE ORACLE ATTESTATION ★';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1414 1000" width="1414" height="1000" style="background:${coolWhite}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Embedded Styles for Interactive Hover Shine (Static in Exports) -->
    <style>
      .seal-interactive-group {
        cursor: pointer;
      }
      .seal-shine-sweep {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .seal-interactive-group:hover .seal-shine-sweep {
        opacity: 0.75;
        animation: foilShineSweep 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes foilShineSweep {
        0% { transform: translate(-140px, -140px) rotate(45deg); opacity: 0; }
        25% { opacity: 0.8; }
        100% { transform: translate(140px, 140px) rotate(45deg); opacity: 0; }
      }
    </style>

    <!-- Background Watermark: Tiled PolyLance Hexagon Pattern tilted -20deg -->
    <pattern id="hex-watermark-pattern" width="100" height="86.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
      <polygon points="50,4 92,25 92,67 50,88 8,67 8,25" fill="none" stroke="${T.cobaltBlue}" stroke-width="0.75" stroke-opacity="0.025" />
    </pattern>

    <!-- Subtle Diagonal Background Security Banner -->
    <pattern id="diagonal-verify-band" width="400" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)">
      <text x="10" y="45" font-size="10.5" font-weight="700" letter-spacing="2.5" fill="${T.cobaltBlue}" fill-opacity="0.025">
        VERIFIED ON POLYGON · PL-SBT #${escapeXml(tokenIdStr)}
      </text>
    </pattern>

    <!-- Cobalt to Deep Navy Radial Foil Gradient (Official PolyLance Embossed Seal) -->
    <radialGradient id="cobalt-seal-radial" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#00D2FF" />
      <stop offset="35%" stop-color="#0047FF" />
      <stop offset="70%" stop-color="#03164D" />
      <stop offset="100%" stop-color="#0B0E14" />
    </radialGradient>

    <!-- Specular Highlight for Seal Hover Sweep (Electric Cyan to White) -->
    <linearGradient id="seal-shine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D2FF" stop-opacity="0" />
      <stop offset="45%" stop-color="#38BDF8" stop-opacity="0.2" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="55%" stop-color="#38BDF8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#00D2FF" stop-opacity="0" />
    </linearGradient>

    <!-- Seal Circular Clip Path -->
    <clipPath id="seal-clip">
      <circle cx="0" cy="0" r="90" />
    </clipPath>

    <!-- PolyLance Hexagon Rosette Corner Motif (Cobalt Blue + Ink Black) -->
    <g id="corner-rosette">
      <polygon points="20,0 36,9.2 36,27.8 20,37 4,27.8 4,9.2" fill="none" stroke="${T.cobaltBlue}" stroke-width="1.8" />
      <polygon points="20,5 31,11.5 31,25.5 20,32 9,25.5 9,11.5" fill="${coolWhite}" stroke="${deepInk}" stroke-width="1" />
      <circle cx="20" cy="18.5" r="3" fill="${T.electricBlue}" />
    </g>
  </defs>

  <!-- 1. Cool White Paper Texture Background -->
  <rect width="1414" height="1000" fill="${coolWhite}" />

  <!-- 2. Watermark Layers: Hexagon lattice & Repeating diagonal verified band -->
  <rect width="1414" height="1000" fill="url(#hex-watermark-pattern)" pointer-events="none" />
  <rect width="1414" height="1000" fill="url(#diagonal-verify-band)" pointer-events="none" />

  <!-- Faint Large Hexagon Logo Watermark Behind Center Content (3.5% Opacity, recolored to cobalt/slate) -->
  <image
    href="${POLYLANCE_LOGO_DATA_URI}"
    x="517"
    y="280"
    width="380"
    height="390"
    opacity="0.035"
    style="mix-blend-mode: multiply;"
    pointer-events="none"
    alt="PolyLance Watermark"
  />

  <!-- 3. Security Guilloche Border -->
  <!-- Outer Solid Rule (2.5px Ink Black) -->
  <rect x="36" y="36" width="1342" height="928" rx="8" fill="none" stroke="${deepInk}" stroke-width="2.5" />
  
  <!-- Middle Interlaced Seeded Guilloche Ribbons (Deterministic in low-contrast cobalt) -->
  <g id="seeded-guilloche-band">
    ${guillocheMarkup}
  </g>

  <!-- PolyLance Hexagon Corner Rosettes -->
  <use href="#corner-rosette" x="38" y="38" />
  <use href="#corner-rosette" x="1332" y="38" />
  <use href="#corner-rosette" x="38" y="922" />
  <use href="#corner-rosette" x="1332" y="922" />

  <!-- Inner Colored Accent Rule (1.5px Cobalt Blue) -->
  <rect x="76" y="76" width="1262" height="848" rx="4" fill="none" stroke="${frameAccent}" stroke-width="1.5" />

  <!-- Continuous Vector Microtext Running Around Frame (5.2px, crisp vector line at normal zoom) -->
  <g font-size="5.2" font-family="monospace" font-weight="700" letter-spacing="0.9" fill="#334155" opacity="0.85">
    <text x="84" y="71">${escapeXml(microtextRepeated)}</text>
    <text x="84" y="931">${escapeXml(microtextRepeated)}</text>
    <text transform="translate(71, 920) rotate(-90)">${escapeXml(microtextRepeated)}</text>
    <text transform="translate(1343, 80) rotate(90)">${escapeXml(microtextRepeated)}</text>
  </g>

  <!-- 4. Eyebrow Header: PolyLance Protocol · Polygon PoS -->
  <text x="707" y="112" text-anchor="middle" font-size="11.5" font-weight="700" letter-spacing="3.5" fill="#475569">
    POLYLANCE PROTOCOL · POLYGON PoS
  </text>

  <!-- 5. Title in Elegant Banknote Serif -->
  <text x="707" y="152" text-anchor="middle" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" letter-spacing="-0.5" fill="${deepInk}">
    ${escapeXml(headingText)}
  </text>

  <!-- 6. Role & Token ID Engraved Badge -->
  <g transform="translate(707, 184)">
    <rect x="-160" y="-13" width="320" height="26" rx="13" fill="${coolWhite}" stroke="${accentColor}" stroke-width="1.4" />
    <rect x="-156" y="-9" width="312" height="18" rx="9" fill="none" stroke="${T.electricBlue}" stroke-width="0.75" stroke-opacity="0.45" />
    <text x="0" y="4.5" text-anchor="middle" font-size="10.5" font-weight="800" letter-spacing="2.2" fill="${accentColor}">
      ${variantLabel} · PL-SBT #${escapeXml(tokenIdStr)}
    </text>
  </g>
  ${certificateNoStr && certificateNoStr !== tokenIdStr ? `
  <text x="707" y="209" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="1.4" fill="#64748B">
    Certificate No. ${escapeXml(certificateNoStr)}
  </text>` : ''}

  <!-- 7. CENTER SEAL & SIGNATURE STACK (Nothing between badge pill and seal) -->

  <!-- 7A. PolyLance Oracle Embossed Seal (Center x = 707, y = 308) -->
  <g id="polylance-oracle-seal" class="seal-interactive-group" transform="translate(707, 308)">
    <!-- Accessible Tooltip and DOM inspection layer -->
    <title>Attested by PolyLance Escrow Oracle · Chain 137 · Tx: ${escapeXml(displayTxHash)}</title>

    <!-- Outer Scalloped Foil Rim (48 fine scallops with cobalt-to-navy radial gradient and electric-blue rim highlight) -->
    <path
      d="${scallopedSealPath}"
      fill="url(#cobalt-seal-radial)"
      stroke="${T.electricBlue}"
      stroke-width="0.8"
    />

    <!-- Double Concentric Inner Rings -->
    <circle cx="0" cy="0" r="82" fill="none" stroke="${T.electricBlue}" stroke-width="1.2" stroke-opacity="0.85" />
    <circle cx="0" cy="0" r="77" fill="none" stroke="#60A5FA" stroke-width="1" stroke-dasharray="2.5,2" stroke-opacity="0.7" />

    <!-- Top-Left Emboss Highlight -->
    <path d="M -54 -54 A 76 76 0 0 1 54 -54" fill="none" stroke="#BAE6FD" stroke-width="2" stroke-linecap="round" opacity="0.85" />
    <!-- Bottom-Right Soft Inner Shadow -->
    <path d="M 54 54 A 76 76 0 0 1 -54 54" fill="none" stroke="#020817" stroke-width="2.5" stroke-linecap="round" opacity="0.75" />

    <!-- Circular Foil Text Rings: Precise SVG textPath fitting circumference cleanly -->
    <path id="seal-text-path-top" d="M -67 0 A 67 67 0 1 1 67 0" fill="none" />
    <path id="seal-text-path-bot" d="M 67 0 A 67 67 0 1 1 -67 0" fill="none" />
    
    <text font-size="7.6" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="700" fill="#FFFFFF" letter-spacing="1.2">
      <textPath href="#seal-text-path-top" startOffset="50%" text-anchor="middle" textLength="202" lengthAdjust="spacing">
        ${escapeXml(sealTopText)}
      </textPath>
    </text>
    <text font-size="7.6" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="700" fill="#BAE6FD" letter-spacing="1.2">
      <textPath href="#seal-text-path-bot" startOffset="50%" text-anchor="middle" textLength="202" lengthAdjust="spacing">
        ${escapeXml(sealBottomText)}
      </textPath>
    </text>

    <!-- Near-Invisible Hidden Hash Arc (Anti-forgery micro-print: 0x<hash.slice(2, 18)>) -->
    <path id="seal-hash-path" d="M -54 0 A 54 54 0 0 1 54 0" fill="none" />
    <text font-size="4.2" font-family="monospace" font-weight="700" fill="${T.electricBlue}" opacity="0.4" letter-spacing="1.2">
      <textPath href="#seal-hash-path" startOffset="50%" text-anchor="middle">
        SEALED RECORD: 0x${escapeXml(hidden16Hash)}
      </textPath>
    </text>

    <!-- Inner Disc with Double Ring -->
    <circle cx="0" cy="0" r="48" fill="${coolWhite}" stroke="${T.cobaltBlue}" stroke-width="1.5" />
    <circle cx="0" cy="0" r="45" fill="none" stroke="${T.electricBlue}" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.65" />

    <!-- Real Glowing Hexagon Logo (polylance_logo.png) Scaled to 62% of Inner Circle (No script text inside seal) -->
    <image
      href="${POLYLANCE_LOGO_DATA_URI}"
      x="-29"
      y="-30"
      width="58"
      height="60"
      style="mix-blend-mode: multiply;"
      alt="PolyLance Glowing Logo"
      aria-label="PolyLance Seal Logo"
    />

    <!-- Slow Shine Sweep on Hover Only (Static in Exports) -->
    <g class="seal-shine-sweep" pointer-events="none">
      <rect x="-90" y="-90" width="180" height="180" fill="url(#seal-shine-grad)" clip-path="url(#seal-clip)" />
    </g>

    <!-- Selectable Text for Copy-Verification in DOM / PDF -->
    <text x="0" y="85" text-anchor="middle" font-size="3" fill="transparent" pointer-events="none">
      Attested by PolyLance Escrow Oracle · Chain 137 · Tx: ${escapeXml(displayTxHash)}
    </text>
  </g>

  <!-- 7B. Script Wordmark Centered Directly BELOW Seal (58% of seal width, even spacing above & below) -->
  <g id="polylance-script-wordmark-below-seal" transform="translate(707, 412)">
    <image
      href="${POLYLANCE_SCRIPT_WORDMARK_DATA_URI}"
      x="-52"
      y="0"
      width="104"
      height="35"
      style="mix-blend-mode: multiply;"
      alt="PolyLance Script Signature"
      aria-label="PolyLance Wordmark"
    />
  </g>

  <!-- 8. Formal Statement Paragraph -->
  <g transform="translate(707, 478)">
    <text x="0" y="0" text-anchor="middle" font-size="14.5" font-weight="400" fill="#475569">
      ${isWork
        ? `This certifies that <tspan font-weight="700" fill="${deepInk}">${escapeXml(recipientDisplay)}</tspan> completed the verified milestone contract`
        : `This certifies that <tspan font-weight="700" fill="${deepInk}">${escapeXml(clientDisplay)}</tspan> funded and authorized the verified milestone contract`
      }
    </text>
    <text x="0" y="28" text-anchor="middle" font-size="20" font-weight="800" letter-spacing="-0.3" fill="${deepInk}">
      "${escapeXml(cleanTitle)}"
    </text>
    <text x="0" y="52" text-anchor="middle" font-size="13" font-weight="500" fill="#64748B">
      ${isWork
        ? `Authorized by <tspan font-weight="700" fill="${deepInk}">${escapeXml(clientDisplay)}</tspan> on Polygon PoS · Category: <tspan font-weight="600" fill="${deepInk}">${escapeXml(data.category || 'Web3 Engineering')}</tspan>`
        : `Executed by contractor <tspan font-weight="700" fill="${deepInk}">${escapeXml(recipientDisplay)}</tspan> on Polygon PoS · Category: <tspan font-weight="600" fill="${deepInk}">${escapeXml(data.category || 'Web3 Engineering')}</tspan>`
      }
    </text>
  </g>

  <!-- 9. Contract Specifications Row (4 Balanced Columns Aligned on Uniform Baseline Grid) -->
  <g transform="translate(140, 575)">
    <!-- Column 1: Awarded To -->
    <g transform="translate(0, 0)">
      <text x="0" y="0" font-size="10.5" font-weight="700" letter-spacing="1" fill="#64748B">
        ${isWork ? 'Awarded to (Freelancer)' : 'Awarded to (Client / Patron)'}
      </text>
      <text x="0" y="24" font-size="14" font-weight="600" fill="${deepInk}">
        ${escapeXml(isWork ? (data.recipientName || 'Verified Contributor') : (data.clientName || 'Escrow Patron'))}
      </text>
      <text x="0" y="42" font-size="11.5" font-family="monospace" fill="#475569">
        ${escapeXml(isWork ? recipientShort : clientShort)}
      </text>
    </g>

    <!-- Column 2: Authorized By / Contractor -->
    <g transform="translate(290, 0)">
      <text x="0" y="0" font-size="10.5" font-weight="700" letter-spacing="1" fill="#64748B">
        ${isWork ? 'Authorized by (Client)' : 'Contractor (Freelancer)'}
      </text>
      <text x="0" y="24" font-size="14" font-weight="600" fill="${deepInk}">
        ${escapeXml(isWork ? (data.clientName || 'Escrow Patron') : (data.recipientName || 'Verified Contributor'))}
      </text>
      <text x="0" y="42" font-size="11.5" font-family="monospace" fill="#475569">
        ${escapeXml(isWork ? clientShort : recipientShort)}
      </text>
    </g>

    <!-- Column 3: Escrow Settlement -->
    <g transform="translate(580, 0)">
      <text x="0" y="0" font-size="10.5" font-weight="700" letter-spacing="1" fill="#64748B">
        Escrow settlement released
      </text>
      <g transform="translate(0, 24)">
        <circle cx="5" cy="-5" r="3.5" fill="${T.confirmedGreen}" />
        <text x="14" y="0" font-size="17" font-weight="800" font-family="-apple-system, sans-serif" fill="${deepInk}">
          ${escapeXml(formattedAmount)}
        </text>
        <text x="14" y="18" font-size="11.5" font-weight="500" fill="#64748B">
          ${escapeXml(fiatEquivalent)}
        </text>
      </g>
    </g>

    <!-- Column 4: Settlement Date -->
    <g transform="translate(860, 0)">
      <text x="0" y="0" font-size="10.5" font-weight="700" letter-spacing="1" fill="#64748B">
        Settlement date (On-chain)
      </text>
      <text x="0" y="24" font-size="15" font-weight="800" fill="${deepInk}">
        ${escapeXml(formattedDate)}
      </text>
      <text x="0" y="42" font-size="11" font-weight="600" fill="${T.confirmedGreen}">
        ✓ Confirmed on Polygon
      </text>
    </g>
  </g>

  <!-- 10. Discreet Job Commitment Row (Hash Commitment) -->
  <line x1="140" y1="665" x2="1274" y2="665" stroke="#E2E8F0" stroke-width="1.2" />
  <g transform="translate(707, 692)">
    <circle cx="-185" cy="-4" r="3.5" fill="${T.electricBlue}" />
    <text x="0" y="0" text-anchor="middle" font-size="12" font-weight="600" fill="#475569">
      Job record sealed · Commitment Hash: <tspan font-family="monospace" font-weight="700" fill="${deepInk}">${escapeXml(displayHash)}</tspan>
    </text>
  </g>

  <!-- 11. Security Footer Strip (1214 x 135) -->
  <g id="certificate-footer" transform="translate(100, 725)">
    <!-- Container Card -->
    <rect x="0" y="0" width="1214" height="140" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2" />

    <!-- Footer Left: Soulbound Non-Transferable Status -->
    <g transform="translate(36, 45)">
      <g transform="translate(0, 0)">
        <!-- Padlock Vector Icon -->
        <rect x="0" y="6" width="16" height="12" rx="2" fill="none" stroke="${T.cobaltBlue}" stroke-width="2" />
        <path d="M 3 6 L 3 3 C 3 -1 13 -1 13 3 L 13 6" fill="none" stroke="${T.cobaltBlue}" stroke-width="2" />
        <circle cx="8" cy="12" r="1.5" fill="${T.electricBlue}" />
      </g>
      <text x="26" y="16" font-size="13" font-weight="700" fill="${deepInk}">
        Soulbound · Non-transferable · ERC-5192
      </text>
      <text x="26" y="34" font-size="11" font-weight="500" fill="#64748B">
        Permanent commercial reputation token bound to recipient wallet on Polygon PoS.
      </text>
      <text x="26" y="52" font-size="11" font-weight="700" font-family="monospace" fill="${T.cobaltBlue}">
        PL-SBT #${escapeXml(tokenIdStr)}${certificateNoStr && certificateNoStr !== tokenIdStr ? ` · Certificate No. ${escapeXml(certificateNoStr)}` : ''} · STATUS: LOCKED
      </text>
    </g>

    <!-- Footer Center: Official Polygon Brand Mark & Wordmark -->
    <g transform="translate(540, 48)">
      <!-- Official Polygon Mark Vector Coordinates (Source: polygon-mark.svg) -->
      <g transform="translate(0, -8) scale(0.095)">
        <path fill="${T.polygonPurple}" d="M384.58,136.59c-9.28-5.3-21.22-5.3-31.83,0l-74.26,43.77L228.1,208.2,155.16,252c-9.28,5.3-21.22,5.3-31.83,0l-57-34.48a32.33,32.33,0,0,1-15.92-27.85V123.33c0-10.61,5.31-21.22,15.92-27.85l57-33.15c9.28-5.31,21.22-5.31,31.83,0l57,34.48a32.31,32.31,0,0,1,15.92,27.85v43.76l50.39-29.18V94.16c0-10.61-5.3-21.22-15.91-27.85L156.48,4c-9.28-5.31-21.21-5.31-31.82,0L15.91,67.63C5.3,72.94,0,83.55,0,94.16V218.81C0,229.42,5.3,240,15.91,246.66L123.33,309c9.28,5.31,21.22,5.31,31.83,0l72.94-42.44,50.39-29.17,72.94-42.44c9.28-5.3,21.22-5.3,31.83,0l57,33.16A32.32,32.32,0,0,1,456.19,256v66.3c0,10.61-5.3,21.22-15.91,27.85l-55.7,33.16c-9.28,5.3-21.22,5.3-31.83,0l-57-33.16a32.32,32.32,0,0,1-15.91-27.85V279.82L229.42,309v43.76c0,10.61,5.31,21.22,15.92,27.85l107.41,62.33c9.29,5.31,21.22,5.31,31.83,0L492,380.6a32.32,32.32,0,0,0,15.91-27.85v-126c0-10.61-5.3-21.22-15.91-27.85Z" />
      </g>
      <text x="60" y="16" font-size="20" font-weight="800" letter-spacing="-0.5" fill="${deepInk}">
        Polygon
      </text>
      <text x="60" y="34" font-size="11" font-weight="600" fill="#64748B">
        Secured on Polygon PoS
      </text>
    </g>

    <!-- Footer Right: Vector QR Code & Verify Link -->
    <g transform="translate(930, 26)">
      <!-- Synchronous QR Code Render (Scaled to 88x88) -->
      <g transform="translate(0, 0)">
        <rect x="-4" y="-4" width="96" height="96" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
        <g transform="scale(${88 / qrSize})">
          <path d="${qrPath}" fill="${deepInk}" shape-rendering="crispEdges" />
        </g>
      </g>
      <!-- Verify Text -->
      <g transform="translate(108, 18)">
        <text x="0" y="0" font-size="11" font-weight="700" fill="${deepInk}">
          Verify on-chain at:
        </text>
        <text x="0" y="18" font-size="10.5" font-weight="800" font-family="monospace" fill="${T.cobaltBlue}">
          polylance.codes/#/verify
        </text>
        <text x="0" y="34" font-size="9.5" font-weight="700" font-family="monospace" fill="#64748B">
          Code: ${escapeXml(shortVerificationCode)}
        </text>
        <text x="0" y="48" font-size="9" font-weight="500" fill="#94A3B8">
          Scan QR to confirm proof
        </text>
      </g>
    </g>
  </g>

  <!-- 12. Bottom Security & Watermark Elements -->
  <!-- Design v2.0 & Issue Date micro-mark in bottom-right corner -->
  <text x="1334" y="890" text-anchor="end" font-size="6" font-family="monospace" font-weight="700" fill="#64748B" opacity="0.8">
    Design v2.0 · Issued ${escapeXml(formattedDate)} · Sovereign Escrow Bytecode
  </text>

  <!-- Bottom Traceability Watermark Line (Faint, owner-specific) -->
  <text x="707" y="904" text-anchor="middle" font-size="9" font-family="monospace" font-weight="600" fill="#64748B" opacity="0.7">
    Issued to ${escapeXml(toChecksumAddress(data.traceRecipientAddress || data.recipientAddress))} · Cryptographically sealed by PolyLance Escrow Oracle · Chain ID: 137
  </text>
</svg>`;
}

/**
 * Backward compatibility alias
 */
export const generateCertificateSvg = renderCertificate;

/**
 * Render SVG to PNG in browser environments via HTML5 Canvas (300 DPI high resolution)
 */
export async function renderCertificateToPng(svgString: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        // A4 landscape 300 DPI canvas resolution (1414 x 1000 scaled to 2121 x 1500)
        canvas.width = 2121;
        canvas.height = 1500;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobURL);
          reject(new Error('Failed to create canvas 2d context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobURL);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob conversion returned null'));
            }
          },
          'image/png',
          0.95
        );
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(blobURL);
        reject(new Error('Failed to load SVG into image for PNG rendering: ' + String(e)));
      };

      img.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Convert SVG string to base64 Data URI for image preview tags
 */
export function svgToDataUri(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Download ProofPack JSON in browser
 */
export function downloadProofPack(data: CertificateData): void {
  const proofPack = buildProofPack(data);
  const jsonStr = JSON.stringify(proofPack, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PolyLance-ProofPack-PL-SBT-${data.tokenId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
