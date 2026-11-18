import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for ReputationSBT_v2 (ERC-5192 Minimal Soulbound NFTs)
 * STRICT SAFETY RULE: Testnet (Polygon Amoy / Localhost) ONLY. Mainnet transactions are blocked.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("═══════════════════════════════════════════════════════");
  console.log(" PolyLance ReputationSBT_v2 Deployment (Testnet Only)");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Network Name:", network.name);
  console.log("Chain ID:", chainId);
  console.log("Deployer Address:", deployer.address);
  console.log("═══════════════════════════════════════════════════════\n");

  // HARD SAFETY CHECK: Refuse execution on Polygon Mainnet (137) or Ethereum Mainnet (1)
  if (chainId === 137 || chainId === 1) {
    throw new Error(
      "SAFETY VIOLATION: Mainnet deployment aborted. This script is restricted to local chains and Polygon Amoy testnet."
    );
  }

  // Load existing Amoy JobFactory address if present
  let factoryAddress = ethers.ZeroAddress;
  const amoyConfigPath = path.join(__dirname, "..", "frontend", "src", "config", "amoy_addresses.json");
  if (fs.existsSync(amoyConfigPath)) {
    try {
      const amoyConfig = JSON.parse(fs.readFileSync(amoyConfigPath, "utf-8"));
      if (amoyConfig.JobFactory) {
        factoryAddress = amoyConfig.JobFactory;
        console.log("Found existing JobFactory on Amoy:", factoryAddress);
      }
    } catch (e) {
      console.warn("Could not read amoy_addresses.json:", e);
    }
  }

  const baseURI = process.env.VITE_METADATA_BASE_URL || "https://polylance.codes/api/metadata/";
  console.log("Configuring initial baseURI:", baseURI);

  console.log("Deploying ReputationSBT_v2...");
  const SBTv2Factory = await ethers.getContractFactory("ReputationSBT_v2");
  const sbtV2 = await SBTv2Factory.deploy(factoryAddress, baseURI);
  await sbtV2.waitForDeployment();

  const deployedAddress = await sbtV2.getAddress();
  console.log("✓ ReputationSBT_v2 deployed at:", deployedAddress);

  // Verification helper commands
  console.log("\nDeployment completed successfully on chain ID", chainId);
  console.log("To verify on Amoy Polygonscan (if enabled):");
  console.log(`npx hardhat verify --network amoy ${deployedAddress} "${factoryAddress}" "${baseURI}"`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
