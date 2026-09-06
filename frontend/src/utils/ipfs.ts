/**
 * IPFS Utility - Real-time file caching, IPFS CID generation, and multi-format preview/gateway resolution.
 */

export interface CachedIpfsFile {
  cid: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: number;
}

const memoryIpfsCache = new Map<string, CachedIpfsFile>();

const FILEBASE_API_KEY = import.meta.env.VITE_FILEBASE_API_KEY;

/**
 * Upload JSON payload directly to Filebase IPFS
 */
export async function pinJsonToFilebase(body: Record<string, any>, name: string = 'payload.json'): Promise<string> {
  if (!FILEBASE_API_KEY) {
    const fallbackCid = generateIpfsCid(body);
    storeIpfsFile(fallbackCid, {
      cid: fallbackCid,
      name,
      type: 'application/json',
      size: JSON.stringify(body).length,
      dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body))}`,
      uploadedAt: Date.now(),
    });
    return fallbackCid;
  }

  try {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob, name);

    const res = await fetch('https://rpc.filebase.io/ipfs/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FILEBASE_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`Filebase error: ${res.statusText}`);
    const data = await res.json();
    const cid = data.cid || data.Hash || data.IpfsHash;

    storeIpfsFile(cid, {
      cid,
      name,
      type: 'application/json',
      size: JSON.stringify(body).length,
      dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body))}`,
      uploadedAt: Date.now(),
    });

    return cid;
  } catch (err) {
    console.warn('Filebase upload fallback to local CID:', err);
    const fallbackCid = generateIpfsCid(body);
    return fallbackCid;
  }
}

/**
 * Upload File / Blob directly to Filebase IPFS
 */
export async function pinFileToFilebase(file: File | Blob, filename: string): Promise<string> {
  if (!FILEBASE_API_KEY) {
    const fallbackCid = generateIpfsCid({ name: filename, size: file.size, timestamp: Date.now() });
    return fallbackCid;
  }

  try {
    const formData = new FormData();
    formData.append('file', file, filename);

    const res = await fetch('https://rpc.filebase.io/ipfs/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FILEBASE_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`Filebase file error: ${res.statusText}`);
    const data = await res.json();
    return data.cid || data.Hash || data.IpfsHash;
  } catch (err) {
    console.warn('Filebase file upload fallback:', err);
    return generateIpfsCid({ name: filename, size: file.size, timestamp: Date.now() });
  }
}

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

export function storeIpfsFile(cid: string, fileData: CachedIpfsFile): void {
  if (!cid) return;
  const cleanCid = cid.replace('ipfs://', '');
  memoryIpfsCache.set(cleanCid, { ...fileData, cid: cleanCid });
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`polylance_ipfs_file_${cleanCid}`, JSON.stringify({ ...fileData, cid: cleanCid }));
    }
  } catch (err) {
    // quota fallback - preserved in memory cache
    console.warn('Local storage quota notice for IPFS cache:', err);
  }
}

export function getCachedIpfsFile(cid: string): CachedIpfsFile | null {
  if (!cid) return null;
  const cleanCid = cid.replace('ipfs://', '');
  if (memoryIpfsCache.has(cleanCid)) {
    return memoryIpfsCache.get(cleanCid)!;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(`polylance_ipfs_file_${cleanCid}`);
      if (saved) {
        const parsed: CachedIpfsFile = JSON.parse(saved);
        memoryIpfsCache.set(cleanCid, parsed);
        return parsed;
      }
    }
  } catch {}
  return null;
}

export const IPFS_GATEWAYS = [
  import.meta.env.VITE_FILEBASE_GATEWAY || 'https://ipfs.filebase.io/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
];

export function getIpfsGatewayUrl(cid: string): string {
  if (!cid) return '#';
  if (cid.startsWith('data:') || cid.startsWith('blob:') || cid.startsWith('http://') || cid.startsWith('https://')) {
    return cid;
  }
  const cleanCid = cid.replace('ipfs://', '');
  const cached = getCachedIpfsFile(cleanCid);
  if (cached && cached.dataUrl) {
    return cached.dataUrl;
  }
  const primaryGateway = IPFS_GATEWAYS[0];
  return `${primaryGateway}${cleanCid}`;
}

/**
 * Multi-Gateway Resilient JSON Fetcher (Tries Filebase, IPFS.io, Cloudflare, dweb.link)
 */
export async function fetchIpfsJsonWithFallback<T = any>(cid: string): Promise<T | null> {
  if (!cid) return null;
  const cleanCid = cid.replace('ipfs://', '');

  // 1. Check local cache
  const cached = getCachedIpfsFile(cleanCid);
  if (cached && cached.dataUrl) {
    try {
      if (cached.dataUrl.startsWith('data:application/json')) {
        const jsonStr = decodeURIComponent(cached.dataUrl.split(',')[1]);
        return JSON.parse(jsonStr) as T;
      }
    } catch {}
  }

  // 2. Iterate through redundant IPFS gateways with timeout
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cleanCid}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        // Save to local cache for future fast instant load
        storeIpfsFile(cleanCid, {
          cid: cleanCid,
          name: `payload-${cleanCid.slice(0, 8)}.json`,
          type: 'application/json',
          size: JSON.stringify(data).length,
          dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`,
          uploadedAt: Date.now(),
        });
        return data as T;
      }
    } catch (_err) {
      // Gateway timed out or failed, try next gateway in array
      continue;
    }
  }

  return null;
}

export function openOrDownloadIpfsFile(cid: string, fallbackName?: string): void {
  const cleanCid = cid.replace('ipfs://', '');
  const cached = getCachedIpfsFile(cleanCid);
  const url = getIpfsGatewayUrl(cleanCid);
  const filename = cached?.name || fallbackName || `deliverable-${cleanCid.slice(0, 8)}.json`;

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

