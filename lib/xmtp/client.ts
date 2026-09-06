import { Client, createEOASigner } from "@xmtp/browser-sdk";
import type { WalletClient } from "viem";

let xmtpClient: Client | null = null;

export function getXmtpEnv(): "dev" | "production" {
  if (process.env.NEXT_PUBLIC_XMTP_ENV) {
    return process.env.NEXT_PUBLIC_XMTP_ENV as "dev" | "production";
  }
  return process.env.NODE_ENV === "production" ? "production" : "dev";
}

export async function initXmtpClient(
  walletClient: WalletClient,
  address: `0x${string}`
): Promise<Client> {
  if (xmtpClient) return xmtpClient;

  // Create EOA signer adapter from viem WalletClient
  const signer = createEOASigner(address, walletClient);
  const env = getXmtpEnv();

  xmtpClient = await Client.create(signer, {
    env,
  });

  return xmtpClient;
}

export function setMockXmtpClient(client: Client | null) {
  xmtpClient = client;
}

export function getXmtpClient(): Client | null {
  return xmtpClient;
}
