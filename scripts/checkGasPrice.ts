import { ethers } from "ethers";

export interface PolygonGasOverrides {
  maxPriorityFeePerGas?: bigint;
  maxFeePerGas?: bigint;
}

/**
 * Query Polygon Gas Station (v2) dynamically for the "Safe Low" tier
 * Enforces the Polygon network minimum floor of 25 gwei priority fee.
 */
export async function getPolygonGasOverrides(networkName: string): Promise<PolygonGasOverrides> {
  if (networkName !== "polygon") {
    return {};
  }
  try {
    const gasRes = await fetch("https://gasstation.polygon.technology/v2", {
      signal: AbortSignal.timeout(5000),
    });
    if (!gasRes.ok) throw new Error(`Gas station HTTP ${gasRes.status}`);
    const gasData = await gasRes.json();

    const priorityGwei = Math.max(Number(gasData.safeLow?.maxPriorityFee ?? 25), 25);
    const maxFeeGwei = Math.max(Number(gasData.safeLow?.maxFee ?? 50), priorityGwei + 10);

    const overrides = {
      maxPriorityFeePerGas: ethers.parseUnits(priorityGwei.toFixed(2), "gwei"),
      maxFeePerGas: ethers.parseUnits(maxFeeGwei.toFixed(2), "gwei"),
    };
    console.log(`    [Gas Override] Safe Low maxFee: ${maxFeeGwei.toFixed(2)} Gwei, priority: ${priorityGwei.toFixed(2)} Gwei`);
    return overrides;
  } catch (err: any) {
    console.warn(`    ⚠️ Gas station query failed (${err.message}), using fallback: 30 Gwei priority / 150 Gwei maxFee`);
    return {
      maxPriorityFeePerGas: ethers.parseUnits("30", "gwei"),
      maxFeePerGas: ethers.parseUnits("150", "gwei"),
    };
  }
}

// scripts/checkGasPrice.ts — run this immediately before deploying,
// not once and forget, since gas prices shift by the hour
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Fetching Polygon Mainnet Gas Station (v2)...");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    const res = await fetch("https://gasstation.polygon.technology/v2");
    if (!res.ok) {
      throw new Error(`Gas station HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();

    console.log("Current Polygon gas prices (gwei):");
    console.log("  Safe Low:", data.safeLow);   // cheapest reliable option — use this for non-urgent deploys
    console.log("  Standard:", data.standard);
    console.log("  Fast:    ", data.fast);
    console.log("  Base Fee:", data.estimatedBaseFee);
    console.log("\nNetwork-enforced floor: 25 gwei priority fee — going below this will get your tx stuck");
  } catch (error: any) {
    console.error("Failed to fetch gas prices from Polygon Gas Station:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
