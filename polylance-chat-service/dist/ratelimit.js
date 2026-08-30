import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
class MemoryLimiter {
    requests = new Map();
    maxRequests;
    windowMs;
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    async limit(identifier) {
        const now = Date.now();
        const timestamps = (this.requests.get(identifier) || []).filter(t => now - t < this.windowMs);
        if (timestamps.length >= this.maxRequests) {
            return { success: false, remaining: 0, reset: now + this.windowMs };
        }
        timestamps.push(now);
        this.requests.set(identifier, timestamps);
        return { success: true, remaining: this.maxRequests - timestamps.length, reset: now + this.windowMs };
    }
}
function createLimiter(prefix, maxRequests, windowMs, upstashWindowStr) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token && url.trim() !== "" && token.trim() !== "" && !url.includes("your_")) {
        try {
            const redis = new Redis({ url, token });
            const upstashLimiter = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(maxRequests, upstashWindowStr),
                prefix: `ratelimit:${prefix}`,
                ephemeralCache: new Map(),
            });
            return {
                limit: async (id) => {
                    const res = await upstashLimiter.limit(id);
                    return { success: res.success, remaining: res.remaining, reset: res.reset };
                },
            };
        }
        catch (err) {
            console.warn(`Upstash Redis initialization failed for ${prefix}, using in-memory limiter:`, err);
        }
    }
    return new MemoryLimiter(maxRequests, windowMs);
}
export function isUpstashActive() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    return Boolean(url && token && url.trim() !== "" && token.trim() !== "" && !url.includes("your_"));
}
// 1. Socket Auth Limiter: 10 attempts/min per IP
export const authLimiter = createLimiter("auth", 10, 60 * 1000, "1 m");
// 2. Message Limiter: 30 messages/min per wallet
export const messageLimiter = createLimiter("message", 30, 60 * 1000, "1 m");
// 3. Join Chat Limiter: 20 joins/min per wallet (Triggers on-chain RPC lookup)
export const joinLimiter = createLimiter("join", 20, 60 * 1000, "1 m");
// 4. Delete Conversation Limiter: 5 attempts/hour per wallet
export const deleteLimiter = createLimiter("delete", 5, 60 * 60 * 1000, "1 h");
// 5. HTTP Limiter: 60 requests/min per IP
export const httpLimiter = createLimiter("http", 60, 60 * 1000, "1 m");
