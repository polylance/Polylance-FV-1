import { Client, IdentifierKind } from "@xmtp/browser-sdk";

/**
 * Checks if a counterparty address has an active XMTP V3 identity registered.
 * If false, UI presents a clear "This user hasn't set up messaging yet" state.
 */
export async function canMessage(address: string): Promise<boolean> {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return false;
  }

  try {
    const env = process.env.NODE_ENV === "production" ? "production" : "dev";
    const result = await Client.canMessage(
      [
        {
          identifier: address,
          identifierKind: IdentifierKind.Ethereum,
        },
      ],
      { env }
    );
    return result.get(address.toLowerCase()) ?? false;
  } catch (err) {
    console.warn("XMTP canMessage check failed:", err);
    return false;
  }
}
