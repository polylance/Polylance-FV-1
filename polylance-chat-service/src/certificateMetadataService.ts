/**
 * PolyLance Certificate Metadata Server Module
 * Generates ERC-721 standard metadata and SVG certificate artwork for any tokenId.
 */

export interface CertificateData {
  tokenId: number | string;
  variant?: 'work' | 'patronage';
  jobId?: string;
  jobTitle: string;
  recipientAddress: string;
  recipientName?: string;
  clientAddress: string;
  clientName?: string;
  amount: number | string;
  tokenSymbol?: string;
  completedAt: number;
  contractAddress?: string;
}

function formatShortAddress(addr: string): string {
  if (!addr) return '0x0000...0000';
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(ts: number): string {
  if (!ts) return 'UNKNOWN';
  const ms = ts > 1e11 ? ts : ts * 1000;
  const d = new Date(ms);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

function escapeXml(unsafe: string): string {
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

function generateSecurityPattern(tokenId: number | string, accentColor: string): string {
  const numId = typeof tokenId === 'number' ? tokenId : parseInt(String(tokenId).replace(/\D/g, '') || '1', 10);
  const baseOffset = (numId * 13) % 40;
  const lines: string[] = [];

  for (let r = 80; r <= 440; r += 20) {
    const rx = r + (baseOffset % 8);
    const ry = r - ((numId + r) % 12);
    lines.push(
      `<ellipse cx="500" cy="500" rx="${rx}" ry="${ry}" fill="none" stroke="${accentColor}" stroke-width="0.75" stroke-opacity="0.06" />`
    );
  }

  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 * Math.PI) / 180;
    const x1 = Math.round(500 + Math.cos(angle) * 120);
    const y1 = Math.round(500 + Math.sin(angle) * 120);
    const x2 = Math.round(500 + Math.cos(angle) * 440);
    const y2 = Math.round(500 + Math.sin(angle) * 440);
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accentColor}" stroke-width="0.5" stroke-opacity="0.04" />`
    );
  }

  return lines.join('\n    ');
}

export function generateCertificateSvg(data: CertificateData): string {
  const isWork = data.variant !== 'patronage';
  const accentColor = isWork ? '#0047AB' : '#0B0B0F';
  const badgeBg = isWork ? '#EFF6FF' : '#F4F4F5';
  const badgeBorder = isWork ? '#0047AB' : '#52525B';
  const variantLabel = isWork ? 'PROOF OF WORK' : 'PATRONAGE';
  const headingText = isWork ? 'VERIFIED WORK CERTIFICATE' : 'PATRONAGE CERTIFICATE';

  const recipientShort = formatShortAddress(data.recipientAddress);
  const recipientDisplay = data.recipientName ? `${data.recipientName} (${recipientShort})` : recipientShort;

  const clientShort = formatShortAddress(data.clientAddress);
  const clientDisplay = data.clientName ? `${data.clientName} (${clientShort})` : clientShort;

  const tokenSymbol = data.tokenSymbol || 'USDC';
  const formattedAmount = `${Number(data.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${tokenSymbol}`;
  const formattedDate = formatDate(data.completedAt);
  const tokenIdStr = String(data.tokenId);

  const rawTitle = data.jobTitle || 'Verified On-Chain Contract Deliverable';
  const titleLine1 = rawTitle.length > 45 ? rawTitle.slice(0, 42) + '...' : rawTitle;

  const securityPattern = generateSecurityPattern(data.tokenId, accentColor);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" style="background:#FAFAF8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <path id="seal-circle-path" d="M 500,278 A 82,82 0 1,1 499.9,278" />
    <g id="corner-flourish">
      <path d="M 0 0 L 24 0 C 14 0 0 14 0 24 Z" fill="${accentColor}" fill-opacity="0.2" />
      <path d="M 0 0 L 16 0 L 0 16 Z" fill="${accentColor}" />
    </g>
  </defs>

  <rect width="1000" height="1000" fill="#FAFAF8" />

  <g>
    ${securityPattern}
  </g>

  <rect x="32" y="32" width="936" height="936" rx="4" fill="none" stroke="#0B0B0F" stroke-width="3" />
  <rect x="38" y="38" width="924" height="924" rx="3" fill="none" stroke="#E5E7EB" stroke-width="1" />
  <rect x="42" y="42" width="916" height="916" rx="2" fill="none" stroke="${accentColor}" stroke-width="1.5" />

  <use href="#corner-flourish" x="43" y="43" />
  <use href="#corner-flourish" x="957" y="43" transform="scale(-1, 1) translate(-1000, 0)" />
  <use href="#corner-flourish" x="43" y="957" transform="scale(1, -1) translate(0, -1000)" />
  <use href="#corner-flourish" x="957" y="957" transform="scale(-1, -1) translate(-1000, -1000)" />

  <text x="500" y="85" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="4" fill="#6B7280">
    POLYLANCE PROTOCOL • POLYGON NETWORK
  </text>

  <text x="500" y="128" text-anchor="middle" font-size="30" font-weight="900" letter-spacing="-0.5" fill="#0B0B0F">
    ${escapeXml(headingText)}
  </text>

  <g transform="translate(500, 162)">
    <rect x="-170" y="-14" width="340" height="28" rx="14" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1.5" />
    <text x="0" y="4" text-anchor="middle" font-size="10.5" font-weight="800" letter-spacing="2" fill="${accentColor}">
      ${variantLabel} • PL-SBT #${escapeXml(tokenIdStr)}
    </text>
  </g>

  <g id="official-seal">
    <circle cx="500" cy="340" r="105" fill="#FFFFFF" stroke="#0B0B0F" stroke-width="2" />
    <circle cx="500" cy="340" r="99" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="4,3" />

    <text font-size="9.5" font-weight="800" letter-spacing="3.2" fill="#0B0B0F">
      <textPath href="#seal-circle-path" startOffset="50%" text-anchor="middle">
        VERIFIED WORK CERTIFICATE • POLYLANCE • POLYGON
      </textPath>
    </text>

    <circle cx="500" cy="340" r="66" fill="${badgeBg}" stroke="${accentColor}" stroke-width="2" />

    <g transform="translate(470, 310) scale(0.6)">
      <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" fill="none" stroke="${accentColor}" stroke-width="8" stroke-linejoin="round" />
      <path d="M 34 26 L 50 26 L 50 74 L 34 74 Z" fill="${accentColor}" />
      <path d="M 50 26 L 66 26 C 76 26 80 32 80 41 C 80 50 76 56 66 56 L 50 56 Z" fill="${accentColor}" />
      <path d="M 50 36 L 64 36 C 68 36 70 38 70 41 C 70 44 68 46 64 46 L 50 46 Z" fill="#FFFFFF" />
    </g>

    <text x="408" y="344" font-size="12" fill="${accentColor}">★</text>
    <text x="584" y="344" font-size="12" fill="${accentColor}">★</text>
  </g>

  <line x1="120" y1="480" x2="880" y2="480" stroke="#E5E7EB" stroke-width="1.5" />

  <text x="120" y="515" font-size="10.5" font-weight="800" letter-spacing="2.5" fill="#6B7280">
    PROJECT TITLE
  </text>
  <text x="120" y="546" font-size="21" font-weight="800" fill="#0B0B0F">
    ${escapeXml(titleLine1)}
  </text>

  <line x1="120" y1="580" x2="880" y2="580" stroke="#E5E7EB" stroke-width="1" />

  <g transform="translate(120, 615)">
    <text x="0" y="0" font-size="10" font-weight="800" letter-spacing="2" fill="#6B7280">
      ${isWork ? 'AWARDED TO (FREELANCER)' : 'AWARDED TO (CLIENT)'}
    </text>
    <text x="0" y="24" font-size="15" font-weight="700" font-family="monospace" fill="#0B0B0F">
      ${escapeXml(recipientDisplay)}
    </text>

    <text x="0" y="80" font-size="10" font-weight="800" letter-spacing="2" fill="#6B7280">
      ESCROW SETTLEMENT RELEASED
    </text>
    <g transform="translate(0, 96)">
      <circle cx="6" cy="6" r="4" fill="#10B981" />
      <text x="18" y="11" font-size="16" font-weight="800" fill="#0B0B0F">
        ${escapeXml(formattedAmount)}
      </text>
    </g>
  </g>

  <g transform="translate(540, 615)">
    <text x="0" y="0" font-size="10" font-weight="800" letter-spacing="2" fill="#6B7280">
      ${isWork ? 'AUTHORIZED BY (CLIENT)' : 'CONTRACTOR (FREELANCER)'}
    </text>
    <text x="0" y="24" font-size="15" font-weight="700" font-family="monospace" fill="#0B0B0F">
      ${escapeXml(clientDisplay)}
    </text>

    <text x="0" y="80" font-size="10" font-weight="800" letter-spacing="2" fill="#6B7280">
      SETTLEMENT DATE (ON-CHAIN)
    </text>
    <text x="0" y="106" font-size="15" font-weight="800" fill="#0B0B0F">
      ${escapeXml(formattedDate)}
    </text>
  </g>

  <line x1="80" y1="785" x2="920" y2="785" stroke="#0B0B0F" stroke-width="2" />
  <line x1="80" y1="789" x2="920" y2="789" stroke="${accentColor}" stroke-width="1" />

  <g transform="translate(120, 818)">
    <rect x="-1" y="-12" width="10" height="10" fill="none" stroke="${accentColor}" stroke-width="2" />
    <text x="18" y="-3" font-size="10.5" font-weight="700" fill="#0B0B0F">
      ERC-5192 Soulbound Token • Non-transferable • Cryptographically validated
    </text>
    <text x="0" y="16" font-size="9.5" font-weight="600" fill="#6B7280">
      Permanent record of verified commercial performance secured by Polygon PoS bytecode.
    </text>
  </g>

  <rect x="42" y="865" width="916" height="91" fill="#F4F5F7" />
  <line x1="42" y1="865" x2="958" y2="865" stroke="#E5E7EB" stroke-width="1" />

  <g transform="translate(80, 905)">
    <text x="0" y="0" font-size="15" font-weight="900" font-family="monospace" fill="#0B0B0F">
      PL-SBT #${escapeXml(tokenIdStr)}
    </text>
    <text x="0" y="20" font-size="9" font-weight="700" letter-spacing="1" fill="#6B7280">
      STATUS: LOCKED (NON-TRANSFERABLE)
    </text>
  </g>

  <g transform="translate(435, 896)">
    <svg width="26" height="26" viewBox="0 0 38 33" fill="none">
      <path d="M28.7 13.1c-1.6 0-3.1.8-3.9 2.2l-3.2 5.5-3.2-5.5c-.8-1.4-2.3-2.2-3.9-2.2H7.2l7.4 12.8 3.8-6.6 3.8 6.6 7.4-12.8h-1z" fill="#7B3FE4" />
      <path d="M19 0L7.6 19.8h7l4.4-7.6 4.4 7.6h7L19 0z" fill="#7B3FE4" />
    </svg>
    <text x="36" y="19" font-size="15" font-weight="800" letter-spacing="-0.3" fill="#0B0B0F">
      Polygon
    </text>
  </g>

  <g transform="translate(720, 895)">
    <text x="0" y="10" font-size="10.5" font-weight="700" fill="#0B0B0F">
      Verify on-chain at:
    </text>
    <text x="0" y="26" font-size="9.5" font-weight="800" font-family="monospace" fill="#0047AB">
      polylance.codes/#/certificate/${escapeXml(tokenIdStr)}
    </text>
  </g>

</svg>`;
}

export function buildMetadataPayload(tokenId: number | string, baseUrl: string, data?: Partial<CertificateData>) {
  const numId = typeof tokenId === 'number' ? tokenId : parseInt(String(tokenId).replace(/\D/g, '') || '1', 10);
  const isWork = data?.variant !== 'patronage';

  const fullData: CertificateData = {
    tokenId: numId,
    variant: data?.variant || 'work',
    jobTitle: data?.jobTitle || `Web3 Verified Milestone #${numId}`,
    recipientAddress: data?.recipientAddress || '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D',
    recipientName: data?.recipientName || 'Verified Freelancer',
    clientAddress: data?.clientAddress || '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092',
    clientName: data?.clientName || 'PolyLance Protocol',
    amount: data?.amount ?? 500,
    tokenSymbol: data?.tokenSymbol || 'USDC',
    completedAt: data?.completedAt || Math.floor(Date.now() / 1000) - 86400 * 3,
  };

  return {
    name: `PolyLance Verified Work Certificate #${numId}`,
    description: "Non-transferable proof of completed work on PolyLance, recorded on Polygon.",
    image: `${baseUrl}/api/certificate/image/${numId}.svg`,
    external_url: `https://polylance.codes/#/certificate/${numId}`,
    attributes: [
      {
        trait_type: "Type",
        value: isWork ? "Proof of Work" : "Patronage"
      },
      {
        trait_type: "Job",
        value: fullData.jobTitle
      },
      {
        trait_type: "Payout",
        value: Number(fullData.amount),
        display_type: "number"
      },
      {
        trait_type: "Token",
        value: fullData.tokenSymbol || "USDC"
      },
      {
        trait_type: "Completed",
        value: fullData.completedAt > 1e11 ? Math.floor(fullData.completedAt / 1000) : fullData.completedAt,
        display_type: "date"
      },
      {
        trait_type: "Network",
        value: "Polygon"
      },
      {
        trait_type: "Soulbound",
        value: "Yes"
      },
      {
        trait_type: "Standard",
        value: "ERC-5192"
      }
    ]
  };
}
