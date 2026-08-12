import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const rawKey = process.env.MESSAGE_ENCRYPTION_KEY || "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const KEY = Buffer.from(rawKey, "hex"); // 32 bytes

export function encryptMessage(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptMessage(stored: string): string {
  try {
    const data = Buffer.from(stored, "base64");
    if (data.length < 28) return "[Malformed Ciphertext]";
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (err) {
    return "[Decryption Failed]";
  }
}
