import EthCrypto from "eth-crypto";
import crypto from "crypto";

export function recoverPublicKey(message: string, signature: string): string {
  return EthCrypto.recoverPublicKey(signature, EthCrypto.hash.keccak256(message));
}

export async function createConversationKey(
  clientPubKey: string,
  freelancerPubKey: string
): Promise<{ encryptedKeyForClient: string; encryptedKeyForFreelancer: string; rawSymmetricKey: string }> {
  const symmetricKey = crypto.randomBytes(32).toString("hex");

  const encryptedForClient = await EthCrypto.encryptWithPublicKey(clientPubKey, symmetricKey);
  const encryptedForFreelancer = await EthCrypto.encryptWithPublicKey(freelancerPubKey, symmetricKey);

  return {
    encryptedKeyForClient: EthCrypto.cipher.stringify(encryptedForClient),
    encryptedKeyForFreelancer: EthCrypto.cipher.stringify(encryptedForFreelancer),
    rawSymmetricKey: symmetricKey,
  };
}

export async function decryptOwnKey(encryptedKeyString: string, privateKey: string): Promise<string> {
  const parsed = EthCrypto.cipher.parse(encryptedKeyString);
  return EthCrypto.decryptWithPrivateKey(privateKey, parsed);
}

export function encryptMessage(plaintext: string, symmetricKeyHex: string): string {
  const key = Buffer.from(symmetricKeyHex, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptMessage(ciphertext: string, symmetricKeyHex: string): string {
  const key = Buffer.from(symmetricKeyHex, "hex");
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
