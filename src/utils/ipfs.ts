/**
 * IPFS Utility - Simulates IPFS CID v1 generation (bafybeig...) and gateway resolution.
 * Displays real hashes in the UI for metadata and evidence uploads.
 */

export function generateIpfsCid(content: string | Record<string, any>): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36);
  const baseChars = 'abcdefghijklmnopqrstuvwxyz234567';
  let cidSuffix = '';
  for (let i = 0; i < 32; i++) {
    cidSuffix += baseChars[(positiveHash.charCodeAt(i % positiveHash.length) + i * 7) % baseChars.length];
  }
  return `bafybei${cidSuffix}`;
}

export function getIpfsGatewayUrl(cid: string): string {
  if (!cid) return '#';
  if (cid.startsWith('http')) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}
