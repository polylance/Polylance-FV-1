import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

class MemoryWebhookCache {
  private cache = new Map<string, number[]>();

  async limit(identifier: string, windowMs = 60000, maxRequests = 100): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const timestamps = (this.cache.get(identifier) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      return { success: false, limit: maxRequests, remaining: 0, reset: oldest + windowMs };
    }

    timestamps.push(now);
    this.cache.set(identifier, timestamps);
    return { success: true, limit: maxRequests, remaining: maxRequests - timestamps.length, reset: now + windowMs };
  }
}

const memoryWebhookFallback = new MemoryWebhookCache();

let webhookLimiterInstance: any = null;
let failedAuthLimiterInstance: any = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = Redis.fromEnv();
  webhookLimiterInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // Generous 100 req/min overall ceiling per IP
    prefix: "ratelimit:auditx-webhook",
  });

  failedAuthLimiterInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // Strict 5 failed attempts/min per IP
    prefix: "ratelimit:auditx-webhook-failed",
  });
}

export async function checkWebhookRateLimit(ip: string) {
  if (webhookLimiterInstance) {
    const res = await webhookLimiterInstance.limit(ip);
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryWebhookFallback.limit(`webhook:${ip}`, 60 * 1000, 100);
}

export async function checkFailedWebhookAuthLimit(ip: string) {
  if (failedAuthLimiterInstance) {
    const res = await failedAuthLimiterInstance.limit(ip);
    return { success: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
  }
  return memoryWebhookFallback.limit(`failed-webhook:${ip}`, 60 * 1000, 5);
}
