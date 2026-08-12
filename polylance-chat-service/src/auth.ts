import { ethers } from "ethers";

export async function verifyWalletAuth(address: string, signature: string, message: string): Promise<boolean> {
  if (!address || !signature || !message) return false;
  try {
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch (err) {
    return false;
  }
}
