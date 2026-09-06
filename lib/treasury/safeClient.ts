import { ethers } from "ethers";

export interface SafeTransactionRequest {
  safeAddress: string;
  to: string;
  amount: bigint;
  tokenAddress: string;
  factoryAddress: string;
}

export async function encodeWithdrawTreasuryData(
  tokenAddress: string,
  to: string,
  amount: bigint
): Promise<string> {
  const factoryInterface = new ethers.Interface([
    "function withdrawTreasury(address token, address to, uint256 amount)",
  ]);
  return factoryInterface.encodeFunctionData("withdrawTreasury", [
    tokenAddress,
    to,
    amount,
  ]);
}

/**
 * Gnosis Safe Transaction Service Integration Helper
 * Interfaces with Safe Transaction API Endpoint for Polygon Amoy (ChainId 80002)
 */
export async function getPendingTreasuryTransactions(
  safeAddress: string,
  serviceUrl: string = "https://safe-transaction-polygon.safe.global"
) {
  try {
    const res = await fetch(`${serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/?executed=false`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch Safe pending transactions:", err);
    return { results: [] };
  }
}
