import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // 1. Deploy JobEscrow implementation (cloned per job, never called directly)
  console.log("1/6 Deploying JobEscrow implementation...");
  const jobImpl = await ethers.deployContract("JobEscrow");
  await jobImpl.waitForDeployment();
  console.log("   JobEscrow impl:", await jobImpl.getAddress());

  // 2. Deploy ReputationSBT — pass ZeroAddress for factory initially
  console.log("2/6 Deploying ReputationSBT...");
  const sbt = await ethers.deployContract("ReputationSBT", [ethers.ZeroAddress]);
  await sbt.waitForDeployment();
  console.log("   ReputationSBT:", await sbt.getAddress());

  // 3. Deploy JobFactory
  console.log("3/6 Deploying JobFactory...");
  const factory = await ethers.deployContract("JobFactory", [
    await jobImpl.getAddress(),
    await sbt.getAddress(),
  ]);
  await factory.waitForDeployment();
  console.log("   JobFactory:", await factory.getAddress());

  // Wire: grant MINTER_ROLE on SBT to factory
  const MINTER_ROLE = await sbt.MINTER_ROLE();
  const mintTx = await sbt.grantRole(MINTER_ROLE, await factory.getAddress());
  await mintTx.wait();
  console.log("   MINTER_ROLE granted to JobFactory ✓");

  // 4. Deploy ProfileRegistry
  console.log("4/6 Deploying ProfileRegistry...");
  const profileRegistry = await ethers.deployContract("ProfileRegistry");
  await profileRegistry.waitForDeployment();
  console.log("   ProfileRegistry:", await profileRegistry.getAddress());

  // 5. Deploy GithubReputationRegistry
  console.log("5/6 Deploying GithubReputationRegistry...");
  const githubRegistry = await ethers.deployContract("GithubReputationRegistry");
  await githubRegistry.waitForDeployment();
  console.log("   GithubReputationRegistry:", await githubRegistry.getAddress());

  // 6. Deploy JudgeDAO
  console.log("6/6 Deploying JudgeDAO...");
  const judgeDAO = await ethers.deployContract("JudgeDAO", [await sbt.getAddress()]);
  await judgeDAO.waitForDeployment();
  console.log("   JudgeDAO:", await judgeDAO.getAddress());

  // ── Write deployment manifest ──────────────────────────────────────────────
  const network = await ethers.provider.getNetwork();
  const addresses = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      JobEscrowImpl: await jobImpl.getAddress(),
      ReputationSBT: await sbt.getAddress(),
      JobFactory: await factory.getAddress(),
      ProfileRegistry: await profileRegistry.getAddress(),
      GithubReputationRegistry: await githubRegistry.getAddress(),
      JudgeDAO: await judgeDAO.getAddress(),
    },
  };

  const outPath = path.join(__dirname, "..", "amoy_deployment_addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nDeployment addresses written to amoy_deployment_addresses.json ✓");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
