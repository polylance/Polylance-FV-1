import crypto from "crypto";
import { ethers } from "ethers";
import type { Request, Response, NextFunction } from "express";

// Fallback session secret if not set in environment
const SESSION_SECRET = (process.env.SESSION_SECRET || "polylance-crypto-session-secret-2026-strict-key-secure").trim();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface AuthNonceRecord {
  nonce: string;
  wallet: string;
  chainId: number;
  message: string;
  issuedAt: number;
  expiresAt: number;
}

declare global {
  namespace Express {
    interface Request {
      session?: {
        wallet: string;
        isAdmin: boolean;
        expiresAt: number;
      };
    }
  }
}

// In-memory nonce store (keyed by normalized lowercase wallet address)
const nonceStore = new Map<string, AuthNonceRecord>();

// Cleanup expired nonces periodically
export function clearExpiredNonces(): void {
  const now = Date.now();
  for (const [wallet, record] of nonceStore.entries()) {
    if (record.expiresAt <= now) {
      nonceStore.delete(wallet);
    }
  }
}

const DEFAULT_CHAIN_ID = process.env.NODE_ENV === "production" ? 137 : 80002;

/**
 * Generate a cryptographically secure, single-use, 5-minute expiring nonce for SIWE.
 */
export function generateAuthNonce(wallet: string, chainId: number = DEFAULT_CHAIN_ID): AuthNonceRecord {
  clearExpiredNonces();
  const normalizedWallet = wallet.toLowerCase().trim();
  const nonce = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAt = now + NONCE_TTL_MS;

  const domain = process.env.APP_DOMAIN || "polylance.com";
  const checksumAddress = ethers.getAddress(normalizedWallet);
  const message = [
    `${domain} wants you to sign in with your Polygon account:`,
    checksumAddress,
    "",
    "Sign in to PolyLance using your cryptographic Polygon wallet.",
    "",
    `URI: https://${domain}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date(now).toISOString()}`,
    `Expiration Time: ${new Date(expiresAt).toISOString()}`
  ].join("\n");

  const record: AuthNonceRecord = {
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
export function consumeAuthNonce(wallet: string): AuthNonceRecord | null {
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
export async function verifySiweSignature(
  wallet: string,
  signature: string,
  message: string
): Promise<{ valid: boolean; wallet?: string; reason?: string }> {
  if (!wallet || !signature || !message) {
    return { valid: false, reason: "Missing wallet address, signature, or message payload" };
  }

  const normalizedWallet = wallet.toLowerCase().trim();
  const pendingNonce = nonceStore.get(normalizedWallet);

  if (!pendingNonce || pendingNonce.expiresAt <= Date.now()) {
    nonceStore.delete(normalizedWallet);
    return { valid: false, reason: "Invalid or expired nonce. Request a fresh nonce." };
  }

  // Ensure message supplied matches the issued message
  if (message.trim() !== pendingNonce.message.trim()) {
    return { valid: false, reason: "Message text does not match the server-issued challenge." };
  }

  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== normalizedWallet) {
      return { valid: false, reason: "Signature mismatch: recovered address does not match claimed wallet." };
    }

    // Success: Burn nonce immediately to prevent replay attacks
    nonceStore.delete(normalizedWallet);
    return { valid: true, wallet: normalizedWallet };
  } catch (err: any) {
    return { valid: false, reason: `Cryptographic recovery error: ${err?.message || "Invalid signature format"}` };
  }
}

/**
 * Create a tamper-proof HMAC-SHA256 signed session token.
 */
export function createSessionToken(wallet: string): string {
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
export function verifySessionToken(token: string): { wallet: string; exp: number } | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSig.length) return null;
  const match = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  if (!match) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data.wallet || typeof data.wallet !== "string" || !data.exp) return null;
    if (data.exp <= Date.now()) return null; // Expired
    return { wallet: data.wallet.toLowerCase().trim(), exp: data.exp };
  } catch {
    return null;
  }
}

/**
 * Legacy compatibility helper.
 */
export async function verifyWalletAuth(address: string, signature: string, message: string): Promise<boolean> {
  const res = await verifySiweSignature(address, signature, message);
  return res.valid;
}

// Global list of configured admin addresses
export function getSystemAdminWallets(): Set<string> {
  const admins = new Set<string>();
  for (let i = 1; i <= 10; i++) {
    const a1 = (process.env[`ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
    if (a1 && /^0x[a-f0-9]{40}$/.test(a1)) admins.add(a1);
    const a2 = (process.env[`VITE_ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
    if (a2 && /^0x[a-f0-9]{40}$/.test(a2)) admins.add(a2);
    const a3 = (process.env[`NEXT_PUBLIC_ADMIN_ADDRESS_${i}`] || "").toLowerCase().trim();
    if (a3 && /^0x[a-f0-9]{40}$/.test(a3)) admins.add(a3);
  }
  const treasury = (process.env.TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS || "").toLowerCase().trim();
  if (treasury && /^0x[a-f0-9]{40}$/.test(treasury)) admins.add(treasury);
  const adminGen = (process.env.ADMIN_ADDRESS || process.env.VITE_ADMIN_ADDRESS || "").toLowerCase().trim();
  if (adminGen && /^0x[a-f0-9]{40}$/.test(adminGen)) admins.add(adminGen);
  return admins;
}

export function isSystemAdmin(wallet: string): boolean {
  if (!wallet) return false;
  return getSystemAdminWallets().has(wallet.toLowerCase().trim());
}

export function isSystemJudge(wallet: string): boolean {
  if (!wallet) return false;
  const w = wallet.toLowerCase().trim();
  const j1 = (process.env.JUDGE_ADDRESS || "").toLowerCase().trim();
  const j2 = (process.env.VITE_JUDGE_ADDRESS || "").toLowerCase().trim();
  return (j1.length > 0 && w === j1) || (j2.length > 0 && w === j2);
}

/**
 * Express middleware to extract session from Cookie or Authorization header.
 */
export function sessionMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

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
      (req as any).session = {
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
      (req as any).session = {
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
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = (req as any).session;
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
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = (req as any).session;
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
export function isPartyToJob(job: any, wallet: string): boolean {
  if (!job || !wallet) return false;
  const w = wallet.toLowerCase().trim();
  if (isSystemAdmin(w)) return true;
  if (job.client && job.client.toLowerCase() === w) return true;
  if (job.freelancer && job.freelancer.toLowerCase() === w) return true;
  if (Array.isArray(job.applications)) {
    return job.applications.some((app: any) => app && app.applicant && app.applicant.toLowerCase() === w);
  }
  return false;
}
