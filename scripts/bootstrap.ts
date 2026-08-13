import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const KNOWN_DEMO_ADDRESSES = [
  "0xb30F2eFBCEBC529d946e05C9ccE0f1ffFB7e1aB1", // Demo Admin 3 wallet
  "0x9999888877776666555544443333222211110000", // Demo Client wallet
  "0x3333444455556666777788889999000011112222", // Demo Freelancer wallet
  "0x25F6111122223333444455556666777788880e9A", // Demo Safe wallet
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat default account #0
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat default account #1
];

function assertRealAddress(address: string | undefined, label: string, required: boolean = true): string | undefined {
  if (!address || address.trim() === "") {
    if (required) {
      throw new Error(`SECURITY EXCEPTION: ${label} is not set in environment.`);
    }
    return undefined;
  }
  if (KNOWN_DEMO_ADDRESSES.map((a) => a.toLowerCase()).includes(address.toLowerCase())) {
    throw new Error(
      `SECURITY EXCEPTION: ${label} resolves to a known demo/mock account (${address}). ` +
      `This address must NEVER be granted production smart contract roles.`
    );
  }
  return address;
}

export async function bootstrapRoles(): Promise<boolean> {
  const [deployer] = await ethers.getSigners();
  const networkObj = await ethers.provider.getNetwork();
  const network = networkObj.name === "unknown" ? "hardhat" : networkObj.name;

  const YOUR_WALLET = assertRealAddress(process.env.JUDGE_1_ADDRESS, "JUDGE_1_ADDRESS", true)!;
  const TEAM_MEMBER_WALLET = assertRealAddress(process.env.JUDGE_2_ADDRESS, "JUDGE_2_ADDRESS", true)!;
  const ADMIN_3_WALLET = assertRealAddress(process.env.JUDGE_3_ADDRESS, "JUDGE_3_ADDRESS", false);
  const TREASURY_SAFE_ADDRESS = assertRealAddress(process.env.TREASURY_SAFE_ADDRESS, "TREASURY_SAFE_ADDRESS", true)!;
  const ORACLE_SIGNING_ADDRESS = assertRealAddress(process.env.ORACLE_ADDRESS, "ORACLE_ADDRESS", true)!;

  const manifestPath = path.join(__dirname, "..", "deployments", `${network}_addresses.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`No deployment manifest found at ${manifestPath}. Run deploy.ts first.`);
    throw new Error(`No deployment manifest found at ${manifestPath}`);
  }
  const addresses = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  console.log("═══════════════════════════════════════");
  console.log(" PolyLance MVP Bootstrap");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network);
  console.log("Judge 1:", YOUR_WALLET);
  console.log("Judge 2:", TEAM_MEMBER_WALLET);
  console.log("Judge 3 (Optional):", ADMIN_3_WALLET ?? "None configured (2-Judge setup)");
  console.log("Treasury Safe:", TREASURY_SAFE_ADDRESS);
  console.log("Oracle:", ORACLE_SIGNING_ADDRESS);
  console.log("═══════════════════════════════════════\n");

  const factory = await ethers.getContractAt("JobFactory", addresses.JobFactory);
  const githubRegistry = await ethers.getContractAt("GithubReputationRegistry", addresses.GithubReputationRegistry);

  // ── 1. Grant ARBITRATOR_ROLE and TREASURY_ADMIN_ROLE to judges/admins ──
  console.log("1/5 Granting ARBITRATOR_ROLE and Admin roles...");
  const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
  const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
  const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();

  let tx = await factory.grantRole(ARBITRATOR_ROLE, YOUR_WALLET);
  await tx.wait();
  tx = await factory.grantRole(ARBITRATOR_ROLE, TEAM_MEMBER_WALLET);
  await tx.wait();

  if (ADMIN_3_WALLET) {
    tx = await factory.grantRole(ARBITRATOR_ROLE, ADMIN_3_WALLET);
    await tx.wait();
    tx = await factory.grantRole(TREASURY_ADMIN_ROLE, ADMIN_3_WALLET);
    await tx.wait();
    tx = await factory.grantRole(DEFAULT_ADMIN_ROLE, ADMIN_3_WALLET);
    await tx.wait();
    console.log("    ✓ Judge 1, Judge 2, and Judge 3 granted ARBITRATOR_ROLE & Admin access");
  } else {
    console.log("    ✓ Judge 1 and Judge 2 granted ARBITRATOR_ROLE (2-Judge setup)");
  }

  // ── 2. Grant TREASURY_ADMIN_ROLE to the Safe ──
  console.log("2/5 Granting TREASURY_ADMIN_ROLE to Safe...");
  tx = await factory.grantRole(TREASURY_ADMIN_ROLE, TREASURY_SAFE_ADDRESS);
  await tx.wait();
  console.log("    ✓ Treasury control granted to Safe:", TREASURY_SAFE_ADDRESS);

  // ── 3. Grant ORACLE_OPERATOR_ROLE for GitHub verification ──
  console.log("3/5 Granting ORACLE_OPERATOR_ROLE...");
  const ORACLE_OPERATOR_ROLE = await githubRegistry.ORACLE_OPERATOR_ROLE();
  tx = await githubRegistry.grantRole(ORACLE_OPERATOR_ROLE, ORACLE_SIGNING_ADDRESS);
  await tx.wait();
  console.log("    ✓ Oracle operator granted:", ORACLE_SIGNING_ADDRESS);

  // ── 3.5 Approve Polygon Amoy testnet USDC ──
  const AMOY_USDC = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  if (network === "amoy") {
    const isApproved = await factory.approvedPaymentTokens(AMOY_USDC);
    if (!isApproved) {
      tx = await factory.setApprovedPaymentToken(AMOY_USDC, true);
      await tx.wait();
      console.log("    ✓ USDC approved as payment token:", AMOY_USDC);
    }
  }

  // ── 4. Verify every grant actually landed ──
  console.log("4/5 Verifying role grants...");
  const checks: [string, boolean][] = [
    ["Judge 1 has ARBITRATOR_ROLE", await factory.hasRole(ARBITRATOR_ROLE, YOUR_WALLET)],
    ["Judge 2 has ARBITRATOR_ROLE", await factory.hasRole(ARBITRATOR_ROLE, TEAM_MEMBER_WALLET)],
    ["Safe has TREASURY_ADMIN_ROLE", await factory.hasRole(TREASURY_ADMIN_ROLE, TREASURY_SAFE_ADDRESS)],
    ["Oracle has ORACLE_OPERATOR_ROLE", await githubRegistry.hasRole(ORACLE_OPERATOR_ROLE, ORACLE_SIGNING_ADDRESS)],
  ];

  if (ADMIN_3_WALLET) {
    checks.push(
      ["Admin 3 has ARBITRATOR_ROLE", await factory.hasRole(ARBITRATOR_ROLE, ADMIN_3_WALLET)],
      ["Admin 3 has TREASURY_ADMIN_ROLE", await factory.hasRole(TREASURY_ADMIN_ROLE, ADMIN_3_WALLET)],
      ["Admin 3 has DEFAULT_ADMIN_ROLE", await factory.hasRole(DEFAULT_ADMIN_ROLE, ADMIN_3_WALLET)]
    );
  }
  let allPassed = true;
  for (const [label, result] of checks) {
    console.log(`    ${result ? "✓" : "f"} ${label}`);
    if (!result) allPassed = false;
  }
  if (!allPassed) {
    console.error("\nOne or more role grants failed verification. Stopping — do not proceed to Step 5.");
    throw new Error("One or more role grants failed verification.");
  }

  // ── 5. Optional: transfer DEFAULT_ADMIN_ROLE to the Safe too ──
  const TRANSFER_ADMIN = process.env.TRANSFER_ADMIN_TO_SAFE === "true";
  if (TRANSFER_ADMIN) {
    console.log("5/5 Transferring DEFAULT_ADMIN_ROLE to Safe...");
    tx = await factory.grantRole(DEFAULT_ADMIN_ROLE, TREASURY_SAFE_ADDRESS);
    await tx.wait();

    const safeHasAdmin = await factory.hasRole(DEFAULT_ADMIN_ROLE, TREASURY_SAFE_ADDRESS);
    if (!safeHasAdmin) {
      console.error("    f Safe does not have DEFAULT_ADMIN_ROLE after grant — NOT renouncing deployer's role.");
      throw new Error("Safe does not have DEFAULT_ADMIN_ROLE after grant.");
    }
    tx = await factory.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
    await tx.wait();
    console.log("    ✓ DEFAULT_ADMIN_ROLE transferred to Safe, deployer renounced");
  } else {
    console.log("5/5 Skipping DEFAULT_ADMIN_ROLE transfer (set TRANSFER_ADMIN_TO_SAFE=true to enable).");
  }

  console.log("\n═══════════════════════════════════════");
  console.log(" Bootstrap complete.");
  console.log("═══════════════════════════════════════\n");

  return true;
}

if (require.main === module) {
  bootstrapRoles().catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exitCode = 1;
  });
}
