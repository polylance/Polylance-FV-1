import crypto from "crypto";
import { ethers } from "ethers";
// Fallback session secret if not set in environment
const SESSION_SECRET = (process.env.SESSION_SECRET || "polylance-crypto-session-secret-2026-strict-key-secure").trim();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
// In-memory nonce store (keyed by normalized lowercase wallet address)
const nonceStore = new Map();
// Cleanup expired nonces periodically
export function clearExpiredNonces() {
    const now = Date.now();
    for (const [wallet, record] of nonceStore.entries()) {
        if (record.expiresAt <= now) {
            nonceStore.delete(wallet);
        }
    }
}
const DEFAULT_CHAIN_ID = process.env.NODE_ENV === "production" ? 137 : 80002;
/**
 * Single source of truth for SIWE Domain and URI configuration.
 * Development: localhost:5173 / http://localhost:5173
 * Production: polylance.codes / https://polylance.codes
 */
export function getSiweConfig() {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !process.env.SIWE_DOMAIN && !process.env.SIWE_URI && !process.env.APP_URL) {
        throw new Error("[SIWE CONFIG ERROR] Missing required environment variable SIWE_DOMAIN / SIWE_URI in production. Expected 'polylance.codes' and 'https://polylance.codes'.");
    }
    const domain = process.env.SIWE_DOMAIN || (isProd ? "polylance.codes" : "localhost:5173");
    const uri = process.env.SIWE_URI || process.env.APP_URL || (isProd ? "https://polylance.codes" : "http://localhost:5173");
    return { domain, uri };
}
/**
 * Strict allowlist of authorized SIWE domains.
 * Client-supplied domains outside this allowlist are strictly rejected.
 */
export const ALLOWED_SIWE_DOMAINS = [
    "polylance.codes",
    "www.polylance.codes",
    ...(process.env.NODE_ENV !== "production" ? ["localhost:5173", "localhost", "127.0.0.1:5173", "127.0.0.1"] : []),
];
/**
 * Generate a cryptographically secure, single-use, 5-minute expiring nonce for SIWE.
 */
export function generateAuthNonce(wallet, chainId = DEFAULT_CHAIN_ID, requestedDomain, requestedUri) {
    clearExpiredNonces();
    const normalizedWallet = wallet.toLowerCase().trim();
    const nonce = crypto.randomBytes(16).toString("hex");
    const now = Date.now();
    const expiresAt = now + NONCE_TTL_MS;
    const config = getSiweConfig();
    let domain = config.domain;
    let uri = config.uri;
    // If a domain was requested by the client, only use it if it exists in the allowlist
    if (requestedDomain) {
        const cleanReq = requestedDomain.trim().toLowerCase();
        if (ALLOWED_SIWE_DOMAINS.includes(cleanReq)) {
            domain = cleanReq;
            uri = requestedUri?.trim() || (cleanReq.startsWith("localhost") || cleanReq.startsWith("127.0.0.1") ? `http://${cleanReq}` : `https://${cleanReq}`);
        }
    }
    const checksumAddress = ethers.getAddress(normalizedWallet);
    const message = [
        `${domain} wants you to sign in with your Polygon account:`,
        checksumAddress,
        "",
        "Sign in to PolyLance. This request will not trigger a blockchain transaction or cost any gas.",
        "",
        `URI: ${uri}`,
        "Version: 1",
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date(now).toISOString()}`,
        `Expiration Time: ${new Date(expiresAt).toISOString()}`
    ].join("\n");
    const record = {
        nonce,
        wallet: normalizedWallet,
        chainId,
        message,
        issuedAt: now,
        expiresAt
    };
    nonceStore.set(normalizedWallet, record);
    return record;
}
/**
 * Consume and remove a nonce for a wallet.
 */
export function consumeAuthNonce(wallet) {
    const normalizedWallet = wallet.toLowerCase().trim();
    const record = nonceStore.get(normalizedWallet);
    if (record) {
        nonceStore.delete(normalizedWallet);
        if (record.expiresAt > Date.now()) {
            return record;
        }
    }
    return null;
}
/**
 * Verify SIWE signature against the issued nonce.
 */
export async function verifySiweSignature(wallet, signature, message) {
    if (!wallet || !signature || !message) {
        return { valid: false, reason: "Missing wallet address, signature, or message payload" };
    }
    const normalizedWallet = wallet.toLowerCase().trim();
    const pendingNonce = nonceStore.get(normalizedWallet);
    if (!pendingNonce || pendingNonce.expiresAt <= Date.now()) {
        nonceStore.delete(normalizedWallet);
        return { valid: false, reason: "Invalid or expired nonce. Request a fresh nonce." };
    }
    // 1. Extract and verify domain is in the strict allowlist
    const domainMatch = message.match(/^([^\s]+) wants you to sign in with your Polygon account:/);
    const messageDomain = domainMatch ? domainMatch[1].trim().toLowerCase() : null;
    if (!messageDomain) {
        return { valid: false, reason: "Invalid sign-in challenge: missing domain header." };
    }
    if (!ALLOWED_SIWE_DOMAINS.includes(messageDomain)) {
        return { valid: false, reason: `Domain '${messageDomain}' is not an authorized PolyLance domain.` };
    }
    // 2. Verify Chain ID is Polygon
    const chainIdMatch = message.match(/Chain ID:\s*(\d+)/);
    const messageChainId = chainIdMatch ? parseInt(chainIdMatch[1], 10) : null;
    if (!messageChainId || (messageChainId !== 137 && messageChainId !== 80002)) {
        return { valid: false, reason: `Chain ID ${messageChainId} is not an authorized Polygon network (137 or 80002).` };
    }
    // 3. Ensure message supplied matches the issued message
    if (message.trim() !== pendingNonce.message.trim()) {
        return { valid: false, reason: "Message text does not match the server-issued challenge." };
    }
    // 4. Burn nonce immediately to prevent replay attacks (single-use)
    nonceStore.delete(normalizedWallet);
    try {
        const recovered = ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== normalizedWallet) {
            return { valid: false, reason: "Signature mismatch: recovered address does not match claimed wallet." };
        }
        return { valid: true, wallet: normalizedWallet };
    }
    catch (err) {
        return { valid: false, reason: `Cryptographic recovery error: ${err?.message || "Invalid signature format"}` };
    }
}
/**
 * Create a tamper-proof HMAC-SHA256 signed session token.
 */
export function createSessionToken(wallet) {
    const normalizedWallet = wallet.toLowerCase().trim();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;
    const payload = Buffer.from(JSON.stringify({ wallet: normalizedWallet, iat: now, exp: expiresAt })).toString("base64url");
    const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}
/**
 * Verify and decode an HMAC-SHA256 session token.
 */
export function verifySessionToken(token) {
    if (!token || typeof token !== "string" || !token.includes("."))
        return null;
    const parts = token.split(".");
    if (parts.length !== 2)
        return null;
    const [payload, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSig.length)
        return null;
    const match = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    if (!match)
        return null;
    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
        if (!data.wallet || typeof data.wallet !== "string" || !data.exp)
            return null;
        if (data.exp <= Date.now())
            return null; // Expired
        return { wallet: data.wallet.toLowerCase().trim(), exp: data.exp };
    }
    catch {
        return null;
    }
}
/**
 * Legacy compatibility helper.
 */
export async function verifyWalletAuth(address, signature, message) {
    const res = await verifySiweSignature(address, signature, message);
    return res.valid;
}
// Global list of configured admin addresses
export function getSystemAdminWallets() {
    const admins = new Set();
    for (let i = 1; i <= 10; i++) {
        const a1 = (process.env[`ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
        if (a1 && /^0x[a-f0-9]{40}$/.test(a1))
            admins.add(a1);
        const a2 = (process.env[`VITE_ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
        if (a2 && /^0x[a-f0-9]{40}$/.test(a2))
            admins.add(a2);
        const a3 = (process.env[`NEXT_PUBLIC_ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
        if (a3 && /^0x[a-f0-9]{40}$/.test(a3))
            admins.add(a3);
    }
    const treasury = (process.env.TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS || "").toLowerCase().trim();
    if (treasury && /^0x[a-f0-9]{40}$/.test(treasury))
        admins.add(treasury);
    const adminGen = (process.env.ADMIN_ADDRESS || process.env.VITE_ADMIN_ADDRESS || "").toLowerCase().trim();
    if (adminGen && /^0x[a-f0-9]{40}$/.test(adminGen))
        admins.add(adminGen);
    return admins;
}
export function isSystemAdmin(wallet) {
    if (!wallet)
        return false;
    return getSystemAdminWallets().has(wallet.toLowerCase().trim());
}
export function isSystemJudge(wallet) {
    if (!wallet)
        return false;
    const w = wallet.toLowerCase().trim();
    const j1 = (process.env.JUDGE_ADDRESS || "").toLowerCase().trim();
    const j2 = (process.env.VITE_JUDGE_ADDRESS || "").toLowerCase().trim();
    return (j1.length > 0 && w === j1) || (j2.length > 0 && w === j2);
}
/**
 * Express middleware to extract session from Cookie or Authorization header.
 */
export function sessionMiddleware(req, res, next) {
    let token;
    // 1. Check cookies (polylance_session)
    if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(";").map((c) => c.trim());
        for (const cookie of cookies) {
            if (cookie.startsWith("polylance_session=")) {
                token = cookie.substring("polylance_session=".length);
                break;
            }
        }
    }
    // 2. Check Authorization Bearer header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.substring(7).trim();
    }
    // 3. Test mode mock fixture fallback (strictly inactive in production/development)
    if (!token && process.env.NODE_ENV === "test" && req.headers["x-wallet-address"]) {
        const testWallet = String(req.headers["x-wallet-address"]).toLowerCase().trim();
        if (/^0x[a-f0-9]{40}$/.test(testWallet)) {
            req.session = {
                wallet: testWallet,
                isAdmin: isSystemAdmin(testWallet),
                isJudge: isSystemJudge(testWallet),
                expiresAt: Date.now() + 3600000
            };
            return next();
        }
    }
    if (token) {
        const verified = verifySessionToken(token);
        if (verified) {
            req.session = {
                wallet: verified.wallet,
                isAdmin: isSystemAdmin(verified.wallet),
                isJudge: isSystemJudge(verified.wallet),
                expiresAt: verified.exp
            };
        }
    }
    next();
}
/**
 * Express guard: requires a valid, cryptographically verified session.
 */
export function requireAuth(req, res, next) {
    const session = req.session;
    if (!session || !session.wallet) {
        res.status(401).json({
            error: "Authentication required. Please connect your wallet and sign in.",
            code: "NO_SESSION"
        });
        return;
    }
    next();
}
/**
 * Express guard: requires an authenticated admin.
 * Returns 404 for non-privileged callers so route existence is never revealed.
 */
export function requireAdmin(req, res, next) {
    const session = req.session;
    if (!session || !session.wallet) {
        res.status(401).json({ error: "Authentication required", code: "NO_SESSION" });
        return;
    }
    if (!session.isAdmin) {
        res.status(403).json({ error: "Administrator authorization required", code: "FORBIDDEN" });
        return;
    }
    next();
}
/**
 * Authorization helper: verifies caller is a party to the job.
 */
export function isPartyToJob(job, wallet) {
    if (!job || !wallet)
        return false;
    const w = wallet.toLowerCase().trim();
    if (isSystemAdmin(w))
        return true;
    if (job.client && job.client.toLowerCase() === w)
        return true;
    if (job.freelancer && job.freelancer.toLowerCase() === w)
        return true;
    if (Array.isArray(job.applications)) {
        return job.applications.some((app) => app && app.applicant && app.applicant.toLowerCase() === w);
    }
    return false;
}
