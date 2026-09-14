import { ethers } from 'ethers';

export interface GasOverrides {
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
  const MIN_PRIORITY_WEI = ethers.parseUnits('32', 'gwei'); // 32 Gwei (comfortably exceeds the 25 Gwei node requirement)
  const MIN_MAX_FEE_WEI = ethers.parseUnits('65', 'gwei');  // 65 Gwei

  try {
    if (provider && typeof provider.getFeeData === 'function') {
      const feeData = await provider.getFeeData().catch(() => null);
      if (feeData) {
        const priorityFee = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY_WEI
          ? feeData.maxPriorityFeePerGas
          : MIN_PRIORITY_WEI;

        const baseMaxFee = feeData.maxFeePerGas || MIN_MAX_FEE_WEI;
        const maxFee = baseMaxFee > priorityFee
          ? baseMaxFee + priorityFee
          : priorityFee * 2n;

        return {
          maxPriorityFeePerGas: priorityFee,
          maxFeePerGas: maxFee > MIN_MAX_FEE_WEI ? maxFee : MIN_MAX_FEE_WEI,
        };
      }
    }
  } catch (e) {
    console.debug('Gas estimation fallback:', e);
  }

  return {
    maxPriorityFeePerGas: MIN_PRIORITY_WEI,
    maxFeePerGas: MIN_MAX_FEE_WEI,
  };
}
