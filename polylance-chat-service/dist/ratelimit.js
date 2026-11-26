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
export function createLimiter(prefix, maxRequests, windowMs, upstashWindowStr) {
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
// 5. HTTP Limiter: 60 requests/min per IP for mutations / heavy endpoints
export const httpLimiter = createLimiter("http", 60, 60 * 1000, "1 m");
// 6. HTTP Read Limiter: 300 requests/min per IP for lightweight read/polling routes
export const httpReadLimiter = createLimiter("http_read", 300, 60 * 1000, "1 m");
// 7. HTTP Per-Wallet Limiters: bounded write & read quotas per authenticated session wallet
export const walletWriteLimiter = createLimiter("http_wallet_write", 60, 60 * 1000, "1 m");
export const walletReadLimiter = createLimiter("http_wallet_read", 300, 60 * 1000, "1 m");
// 8. Nonce Limiter: 15 requests/min per IP to throttle SIWE nonce generation
export const nonceLimiter = createLimiter("nonce", 15, 60 * 1000, "1 m");
/**
 * Evaluates both per-IP and per-wallet sliding-window quotas for HTTP requests.
 */
export async function evaluateIpAndWalletRateLimit(params) {
    const ipLimiter = params.ipLimiter || (params.isReadPath ? httpReadLimiter : httpLimiter);
    const ipRes = await ipLimiter.limit(`ip:${params.ip}`);
    if (!ipRes.success) {
        return {
            allowed: false,
            reason: "IP_RATE_LIMITED",
            remaining: 0,
            reset: ipRes.reset,
            retryAfterSeconds: Math.max(1, Math.ceil((ipRes.reset - Date.now()) / 1000)),
        };
    }
    const cleanWallet = (params.wallet || "").toLowerCase().trim();
    if (cleanWallet && /^0x[a-f0-9]{40}$/.test(cleanWallet)) {
        const wLimiter = params.walletLimiter || (params.isReadPath ? walletReadLimiter : walletWriteLimiter);
        const wRes = await wLimiter.limit(`wallet:${cleanWallet}`);
        if (!wRes.success) {
            return {
                allowed: false,
                reason: "WALLET_RATE_LIMITED",
                remaining: 0,
                reset: wRes.reset,
                retryAfterSeconds: Math.max(1, Math.ceil((wRes.reset - Date.now()) / 1000)),
            };
        }
        return {
            allowed: true,
            remaining: Math.min(ipRes.remaining, wRes.remaining),
            reset: Math.min(ipRes.reset, wRes.reset),
            retryAfterSeconds: 0,
        };
    }
    return {
        allowed: true,
        remaining: ipRes.remaining,
        reset: ipRes.reset,
        retryAfterSeconds: 0,
    };
}
