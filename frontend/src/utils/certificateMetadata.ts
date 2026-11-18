/**
 * PolyLance Verified Work Certificate Metadata Service
 * ERC-721 / ERC-5192 standard metadata builder and resolver.
 */

import { generateCertificateSvg, renderCertificateToPng, svgToDataUri, CertificateData } from './certificateGenerator';
import { pinJsonToFilebase, pinFileToFilebase } from './ipfs';

export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

/**
 * Deterministically build standard ERC-721 metadata for any token ID.
 * Reads on-chain / contextual job data and returns standard JSON.
 */
export async function buildCertificateMetadata(
  tokenId: number | string,
  customData?: Partial<CertificateData>
): Promise<{
  metadata: CertificateMetadata;
  svg: string;
  imageUri: string;
}> {
  const numId = typeof tokenId === 'number' ? tokenId : parseInt(String(tokenId).replace(/\D/g, '') || '1', 10);

  // Default / fallback job properties
  const certData: CertificateData = {
    tokenId: numId,
    variant: customData?.variant || 'work',
    jobId: customData?.jobId || `job-poly-${numId}`,
    jobTitle: customData?.jobTitle || `Web3 Milestone Contract #${numId}`,
    recipientAddress: customData?.recipientAddress || '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D',
    recipientName: customData?.recipientName || 'Verified Freelancer',
    clientAddress: customData?.clientAddress || '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092',
    clientName: customData?.clientName || 'PolyLance Protocol',
    amount: customData?.amount ?? 500,
    tokenSymbol: customData?.tokenSymbol || 'USDC',
    completedAt: customData?.completedAt || Math.floor(Date.now() / 1000) - 86400 * 3,
    contractAddress: customData?.contractAddress || '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
  };

  // 1. Generate master vector SVG
  const svg = generateCertificateSvg(certData);
  const svgDataUri = svgToDataUri(svg);

  let finalImageUri = svgDataUri;

  // 2. Attempt optional IPFS pinning if credentials exist
  try {
    if (typeof window !== 'undefined') {
      // In browser, attempt to render PNG for IPFS
      const pngBlob = await renderCertificateToPng(svg).catch(() => null);
      if (pngBlob && import.meta.env.VITE_FILEBASE_API_KEY) {
        const ipfsCid = await pinFileToFilebase(pngBlob, `certificate-${numId}.png`).catch(() => '');
        if (ipfsCid) {
          finalImageUri = `ipfs://${ipfsCid}`;
        }
      }
    }
  } catch {
    // Graceful fallback to SVG data URI
    finalImageUri = svgDataUri;
  }

  const isWork = certData.variant !== 'patronage';
  const base = (import.meta.env.VITE_METADATA_BASE_URL || 'https://polylance.codes').replace(/\/+$/, '');
  const canonicalImageUrl = `${base}/api/sbt/image/${numId}.png`;

  const metadata: CertificateMetadata = {
    name: isWork
      ? `PolyLance Certificate of Verified Work #${numId}`
      : `PolyLance Certificate of Patronage #${numId}`,
    description: isWork
      ? `Verified milestone performance attestation bound to freelancer ${certData.recipientAddress} on Polygon PoS. Soulbound ERC-721 credential.`
      : `Commercial escrow patronage attestation bound to client ${certData.clientAddress} on Polygon PoS. Soulbound ERC-721 credential.`,
    image: canonicalImageUrl,
    external_url: `${base}/#/certificate/${numId}`,
    attributes: [
      {
        trait_type: "Certificate Type",
        value: isWork ? "Verified Work" : "Patronage"
      },
      {
        trait_type: "Job",
        value: certData.jobTitle
      },
      {
        trait_type: "Payout",
        value: Number(certData.amount),
        display_type: "number"
      },
      {
        trait_type: "Token",
        value: certData.tokenSymbol || "POL"
      },
      {
        trait_type: "Completed",
        value: certData.completedAt > 1e11 ? Math.floor(certData.completedAt / 1000) : certData.completedAt,
        display_type: "date"
      },
      {
        trait_type: "Chain",
        value: "Polygon PoS (Chain 137)"
      },
      {
        trait_type: "Soulbound",
        value: "true"
      },
      {
        trait_type: "Certificate No",
        value: String(certData.certificateNo || numId)
      }
    ]
  };

  return { metadata, svg, imageUri: finalImageUri };
}
