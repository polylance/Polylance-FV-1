import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "dummy_jwt_for_development",
  pinataGateway: process.env.PINATA_GATEWAY || "gateway.pinata.cloud",
});

const MAX_FILE_SIZE_MB = 25;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
];

export interface UploadResult {
  cid: string;
  gatewayUrl: string;
  size: number;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  const result = await pinata.upload.file(file);
  const gateway = process.env.FILEBASE_GATEWAY || "ipfs.filebase.io";
  return {
    cid: result.IpfsHash,
    gatewayUrl: `https://${gateway}/ipfs/${result.IpfsHash}`,
    size: result.PinSize,
  };
}

export async function uploadJSON(data: Record<string, unknown>): Promise<UploadResult> {
  const result = await pinata.upload.json(data);
  const gateway = process.env.FILEBASE_GATEWAY || "ipfs.filebase.io";
  return {
    cid: result.IpfsHash,
    gatewayUrl: `https://${gateway}/ipfs/${result.IpfsHash}`,
    size: result.PinSize,
  };
}

export async function uploadMultiple(files: File[]): Promise<UploadResult[]> {
  // Sequential, not Promise.all — avoids hammering rate limits on
  // multi-evidence proof-of-work submissions
  const results: UploadResult[] = [];
  for (const file of files) {
    results.push(await uploadFile(file));
  }
  return results;
}
