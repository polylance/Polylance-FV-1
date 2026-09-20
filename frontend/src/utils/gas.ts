import { ethers } from 'ethers';

export interface GasOverrides {
  type: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
}

/**
 * Returns EIP-1559 gas overrides enforcing Polygon's mandatory minimum priority fee.
 * Polygon Amoy (80002) and Polygon PoS (137) require a minimum 25-30 Gwei priority fee (25,000,000,000 Wei).
 * MetaMask defaults to 1.5 Gwei which causes RPC rejection with:
 * "transaction gas price below minimum: gas tip cap 1500000000, minimum needed 25000000000".
 */
export async function getPolygonGasOverrides(provider?: ethers.Provider | null): Promise<GasOverrides> {
  const MIN_PRIORITY_WEI = ethers.parseUnits('35', 'gwei'); // 35 Gwei (exceeds Polygon's 25-30 Gwei tip cap requirement)
  const MIN_MAX_FEE_WEI = ethers.parseUnits('450', 'gwei');  // 450 Gwei (comfortably clears Polygon's ~250-380 Gwei base fee)

  try {
    let feeData: ethers.FeeData | null = null;
    if (provider && typeof provider.getFeeData === 'function') {
      feeData = await provider.getFeeData().catch(() => null);
    }
    if (!feeData) {
      // Fallback directly to public Bor RPC if active provider fails
      const borProvider = new ethers.JsonRpcProvider('https://polygon-bor-rpc.publicnode.com', 137, { staticNetwork: true });
      feeData = await borProvider.getFeeData().catch(() => null);
    }

    if (feeData) {
      const priorityFee = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY_WEI
        ? feeData.maxPriorityFeePerGas
        : MIN_PRIORITY_WEI;

      const baseMaxFee = feeData.maxFeePerGas || MIN_MAX_FEE_WEI;
      // Buffer maxFeePerGas by 1.35x to absorb rapid base fee volatility on Polygon PoS
      const bufferedMaxFee = (baseMaxFee * 135n) / 100n;
      const finalMaxFee = bufferedMaxFee > MIN_MAX_FEE_WEI ? bufferedMaxFee : MIN_MAX_FEE_WEI;

      return {
        type: 2,
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas: finalMaxFee > priorityFee * 2n ? finalMaxFee : priorityFee * 2n,
      };
    }
  } catch (e) {
    console.debug('Gas estimation fallback:', e);
  }

  return {
    type: 2,
    maxPriorityFeePerGas: MIN_PRIORITY_WEI,
    maxFeePerGas: MIN_MAX_FEE_WEI,
  };
}
