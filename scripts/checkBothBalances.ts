import { ethers } from "hardhat";

async function main() {
  const clientPrivateKey = process.env.CLIENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const freelancerPrivateKey = process.env.FREELANCER_PRIVATE_KEY;

  if (!clientPrivateKey || !freelancerPrivateKey) {
    throw new Error("Missing CLIENT_PRIVATE_KEY or FREELANCER_PRIVATE_KEY in environment.");
  }

  const clientWallet = new ethers.Wallet(clientPrivateKey, ethers.provider);
  const freelancerWallet = new ethers.Wallet(freelancerPrivateKey, ethers.provider);
  const network = await ethers.provider.getNetwork();

  const clientBal = await ethers.provider.getBalance(clientWallet.address);
  const freelancerBal = await ethers.provider.getBalance(freelancerWallet.address);

  console.log("═══════════════════════════════════════");
  console.log(` Network:    ${network.name} (Chain ID: ${network.chainId})`);
  console.log(` Client:     ${clientWallet.address} | Balance: ${ethers.formatEther(clientBal)} MATIC/POL`);
  console.log(` Freelancer: ${freelancerWallet.address} | Balance: ${ethers.formatEther(freelancerBal)} MATIC/POL`);
  console.log("═══════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
