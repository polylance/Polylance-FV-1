import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback map for dev / local test environments when Upstash environment variables are not configured
class MemoryCache {
  private countCache = new Map<string, number[]>();
  private volumeCache = new Map<string, { timestamp: number; bytes: number }[]>();

  async limit(identifier: string, windowMs = 600000, maxRequests = 10): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const timestamps = (this.countCache.get(identifier) || []).filter((t) => now - t < windowMs);
    
    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      return { success: false, limit: maxRequests, remaining: 0, reset: oldest + windowMs };
    }

    timestamps.push(now);
    this.countCache.set(identifier, timestamps);
    return { success: true, limit: maxRequests, remaining: maxRequests - timestamps.length, reset: now + windowMs };
  }

  async limitBytes(identifier: string, bytes: number, windowMs = 600000, maxBytes = 100 * 1024 * 1024): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const records = (this.volumeCache.get(identifier) || []).filter((r) => now - r.timestamp < windowMs);
    const currentBytes = records.reduce((acc, curr) => acc + curr.bytes, 0);

    if (currentBytes + bytes > maxBytes) {
      return { success: false, limit: maxBytes, remaining: Math.max(0, maxBytes - currentBytes), reset: now + windowMs };
    }

    records.push({ timestamp: now, bytes });
    this.volumeCache.set(identifier, records);
    return { success: true, limit: maxBytes, remaining: maxBytes - (currentBytes + bytes), reset: now + windowMs };
  }
}

const memoryFallback = new MemoryCache();

let countLimiterInstance: any = null;
let volumeLimiterInstance: any = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = Redis.fromEnv();
  countLimiterInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 uploads per 10 minutes per wallet
    prefix: "ratelimit:upload-count",
  });

  volumeLimiterInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100 * 1024 * 1024, "10 m"), // 100MB per 10 minutes per wallet
    prefix: "ratelimit:upload-volume",
  });
}

export async function checkUploadRateLimit(walletAddress: string) {
  if (countLimiterInstance) {
    const res = await countLimiterInstance.limit(walletAddress);
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryFallback.limit(`count:${walletAddress}`, 10 * 60 * 1000, 10);
}

export async function checkUploadVolumeLimit(walletAddress: string, sizeInBytes: number) {
  if (volumeLimiterInstance) {
    const res = await volumeLimiterInstance.limit(walletAddress, { rate: sizeInBytes });
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryFallback.limitBytes(`volume:${walletAddress}`, sizeInBytes, 10 * 60 * 1000, 100 * 1024 * 1024);
}
