import { ethers } from "ethers";

export const AUTH_CHALLENGE_MESSAGE = "PolyLance IPFS Upload Authorization Request";

/**
 * Verify wallet authentication for IPFS upload requests.
 * Expects request headers:
 *   - 'x-wallet-address': expected wallet address
 *   - 'x-wallet-signature': signature of AUTH_CHALLENGE_MESSAGE by the wallet
 * Or 'authorization': 'Bearer <signature>:<address>'
 */
export async function verifyWalletAuth(req: Request): Promise<bool> {
  try {
    let walletAddress = req.headers.get("x-wallet-address");
    let signature = req.headers.get("x-wallet-signature");

    if (!walletAddress || !signature) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const parts = token.split(":");
        if (parts.length === 2) {
          signature = parts[0];
          walletAddress = parts[1];
        }
      }
    }

    if (!walletAddress || !signature) {
      return false;
    }

    if (!ethers.isAddress(walletAddress)) {
      return false;
    }

    // Recover signer address from signature of standard challenge message
    const recoveredAddress = ethers.verifyMessage(AUTH_CHALLENGE_MESSAGE, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    return false;
  }
}
