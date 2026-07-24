import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * bootstrap.ts — Grants protocol roles after deployment.
 *
 * Required env vars:
 *   BOOTSTRAP_ARBITRATOR_1      — first arbitrator wallet address
 *   BOOTSTRAP_ARBITRATOR_2      — second arbitrator wallet address (optional)
 *   SAFE_ADDRESS                — 2-of-2 Gnosis Safe for treasury admin
 *   ORACLE_SIGNING_ADDRESS      — oracle hot wallet for GithubReputationRegistry
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  const manifestPath = path.join(__dirname, "..", "amoy_deployment_addresses.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("amoy_deployment_addresses.json not found. Run deploy.ts first.");
  }

  const addresses = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log("Bootstrap using deployment manifest:");
  console.log(JSON.stringify(addresses.contracts, null, 2));
  console.log();

  // ── Env vars ────────────────────────────────────────────────────────────────
  const ARBITRATOR_1 = process.env.BOOTSTRAP_ARBITRATOR_1;
  const ARBITRATOR_2 = process.env.BOOTSTRAP_ARBITRATOR_2; // optional
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  const ORACLE_SIGNING_ADDRESS = process.env.ORACLE_SIGNING_ADDRESS;

  const missing: string[] = [];
  if (!ARBITRATOR_1) missing.push("BOOTSTRAP_ARBITRATOR_1");
  if (!SAFE_ADDRESS) missing.push("SAFE_ADDRESS");
  if (!ORACLE_SIGNING_ADDRESS) missing.push("ORACLE_SIGNING_ADDRESS");
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  // ── Connect to deployed contracts ────────────────────────────────────────────
  const factory = await ethers.getContractAt("JobFactory", addresses.contracts.JobFactory);
  const githubRegistry = await ethers.getContractAt("GithubReputationRegistry", addresses.contracts.GithubReputationRegistry);

  const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
  const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
  const ORACLE_OPERATOR_ROLE = await githubRegistry.ORACLE_OPERATOR_ROLE();

  // ── Grant roles ──────────────────────────────────────────────────────────────

  // ARBITRATOR_ROLE #1
  console.log(`Granting ARBITRATOR_ROLE to ${ARBITRATOR_1}...`);
  await (await factory.grantRole(ARBITRATOR_ROLE, ARBITRATOR_1!)).wait();
  console.log("   ✓");

  // ARBITRATOR_ROLE #2 (optional)
  if (ARBITRATOR_2) {
    console.log(`Granting ARBITRATOR_ROLE to ${ARBITRATOR_2}...`);
    await (await factory.grantRole(ARBITRATOR_ROLE, ARBITRATOR_2)).wait();
    console.log("   ✓");
  }

  // TREASURY_ADMIN_ROLE → Safe (not an EOA)
  console.log(`Granting TREASURY_ADMIN_ROLE to Safe ${SAFE_ADDRESS}...`);
  await (await factory.grantRole(TREASURY_ADMIN_ROLE, SAFE_ADDRESS!)).wait();
  console.log("   ✓");

  // Revoke TREASURY_ADMIN_ROLE from deployer EOA (Safe is now in control)
  console.log("Revoking TREASURY_ADMIN_ROLE from deployer...");
  // Note: deployer never had TREASURY_ADMIN_ROLE by default, so this is a safety no-op
  // If deployer was accidentally granted it, this cleans it up.
  const hasRole = await factory.hasRole(TREASURY_ADMIN_ROLE, deployer.address);
  if (hasRole) {
    await (await factory.revokeRole(TREASURY_ADMIN_ROLE, deployer.address)).wait();
    console.log("   ✓ revoked");
  } else {
    console.log("   ✓ deployer never had TREASURY_ADMIN_ROLE");
  }

  // ORACLE_OPERATOR_ROLE on GithubReputationRegistry
  console.log(`Granting ORACLE_OPERATOR_ROLE to ${ORACLE_SIGNING_ADDRESS}...`);
  await (await githubRegistry.grantRole(ORACLE_OPERATOR_ROLE, ORACLE_SIGNING_ADDRESS!)).wait();
  console.log("   ✓");

  console.log("\nBootstrap complete ✓");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
