import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════");
  console.log(` Network:  ${network.name} (Chain ID: ${network.chainId})`);
  console.log(` Deployer: ${deployer.address}`);
  console.log(` Balance:  ${ethers.formatEther(balance)} MATIC/POL`);
  console.log("═══════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
