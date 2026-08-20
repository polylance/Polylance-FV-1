/**
 * IPFS Utility - Simulates IPFS CID v1 generation (bafybeig...) and gateway resolution.
 * Uses high-availability Pinata and Cloudflare IPFS gateways to avoid 504 timeouts.
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
  const cleanCid = cid.replace('ipfs://', '');
  return `https://ipfs.filebase.io/ipfs/${cleanCid}`;
}
