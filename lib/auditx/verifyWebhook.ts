import crypto from "crypto";

/**
 * Timing-safe HMAC-SHA256 signature verification for AuditX webhooks.
 * Prevents timing side-channel attacks by comparing digest buffers with timingSafeEqual.
 */
export function verifyAuditXSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.AUDITX_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison — prevents leaking info via response-time
  // differences, same category of care as the ECDSA checks elsewhere
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
