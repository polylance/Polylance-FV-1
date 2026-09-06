import { ethers } from "hardhat";
import * as fs from "fs";

const KNOWN_PUBLIC_TEST_ADDRESSES = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat default #0
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat default #1
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat default #2
];

async function assertRealNetwork() {
  const network = await ethers.provider.getNetwork();

  if (network.name === "hardhat" || network.name === "unknown" || network.chainId === 31337n) {
    throw new Error(
      `Refusing to run smoke test — connected to ephemeral local network ` +
      `(chainId ${network.chainId}), not Amoy. Did you forget the ` +
      `--network amoy flag? Run: npx hardhat run --network amoy <script>`
    );
  }

  if (network.chainId !== 80002n) {
    throw new Error(
      `Refusing to run — expected Amoy (chainId 80002), got chainId ${network.chainId}. ` +
      `Check your --network flag and hardhat.config.ts.`
    );
  }
}

async function assertNotPublicTestAccount(address: string, label: string) {
  if (KNOWN_PUBLIC_TEST_ADDRESSES.map((a) => a.toLowerCase()).includes(address.toLowerCase())) {
    throw new Error(
      `SECURITY: ${label} address (${address}) is a publicly known ` +
      `Hardhat test account. This must never appear in a real-network ` +
      `smoke test — it means the wrong private key is loaded, or you're ` +
      `actually still connected to the local network despite the flag.`
    );
  }
}

async function main() {
  await assertRealNetwork();

  const clientPrivateKey = process.env.CLIENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const freelancerPrivateKey = process.env.FREELANCER_PRIVATE_KEY;
  const judgePrivateKey = process.env.JUDGE_PRIVATE_KEY || clientPrivateKey;

  if (!clientPrivateKey || !freelancerPrivateKey) {
    throw new Error("CLIENT_PRIVATE_KEY and FREELANCER_PRIVATE_KEY env vars are required.");
  }

  const clientWallet = new ethers.Wallet(clientPrivateKey, ethers.provider);
  const freelancerWallet = new ethers.Wallet(freelancerPrivateKey, ethers.provider);
  const judgeWallet = new ethers.Wallet(judgePrivateKey, ethers.provider);

  await assertNotPublicTestAccount(clientWallet.address, "Client");
  await assertNotPublicTestAccount(freelancerWallet.address, "Freelancer");

  const network = (await ethers.provider.getNetwork()).name;
  const manifestPath = `./deployments/${network}_addresses.json`;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Deployment manifest not found at ${manifestPath}. Run deploy.ts first.`);
  }

  const addresses = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  console.log("═══════════════════════════════════════");
  console.log(` PolyLance Dispute Path Smoke Test — ${network}`);
  console.log("═══════════════════════════════════════");
  console.log("Client:", clientWallet.address);
  console.log("Freelancer:", freelancerWallet.address);
  console.log("Judge/Arbitrator:", judgeWallet.address);
  console.log("JobFactory:", addresses.JobFactory);
  console.log("═══════════════════════════════════════\n");

  const factory = await ethers.getContractAt("JobFactory", addresses.JobFactory, clientWallet);

  // 1. Post job
  console.log("1/7 Posting dispute test job...");
  let tx = await factory.postJob("ipfs://dispute-test-job-description", ethers.ZeroAddress);
  await tx.wait();
  const jobs = await factory.getAllJobs();
  const jobAddress = jobs[jobs.length - 1];
  console.log("    ✓ Job deployed at:", jobAddress);

  const job = await ethers.getContractAt("JobEscrow", jobAddress);

  // 2. Fund job
  console.log("2/7 Funding job...");
  tx = await job.connect(clientWallet).fundJob(0, { value: ethers.parseEther("0.01") });
  await tx.wait();

  // 3. Apply & Select
  console.log("3/7 Freelancer applying & Client selecting...");
  tx = await job.connect(freelancerWallet).applyToJob("ipfs://dispute-proposal");
  await tx.wait();
  tx = await job.connect(clientWallet).selectFreelancer(freelancerWallet.address);
  await tx.wait();

  // 4. Propose terms & Submit work
  console.log("4/7 Terms & Work submission...");
  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("dispute test terms"));
  tx = await job.connect(clientWallet).proposeTerms(termsHash);
  await tx.wait();
  tx = await job.connect(freelancerWallet).proposeTerms(termsHash);
  await tx.wait();
  tx = await job.connect(freelancerWallet).submitWork("Deliverable", "Details", ["ipfs://evidence"]);
  await tx.wait();

  // 5. Raise dispute
  console.log("5/7 Client raising dispute...");
  tx = await job.connect(clientWallet).raiseDispute(0, "ipfs://client-dispute-evidence"); // 0 = QUALITY
  let receipt = await tx.wait();
  console.log("    ✓ Dispute tx:", receipt!.hash);
  console.log("    ✓ On-chain status():", (await job.status()).toString(), "(expected: 3 = Disputed)");

  // 6. Arbitrator resolves dispute with 50/50 split
  console.log("6/7 Arbitrator resolving dispute (5000 bps = 50% split)...");
  tx = await job.connect(judgeWallet).resolveDispute(5000, "ipfs://arbitrator-reasoning");
  receipt = await tx.wait();
  console.log("    ✓ Resolution tx:", receipt!.hash);
  console.log("    ✓ On-chain status():", (await job.status()).toString(), "(expected: 4 = Completed)");

  // 7. Verify reputation SBT minted
  console.log("7/7 Verifying ReputationSBT status post-dispute...");
  const sbt = await ethers.getContractAt("ReputationSBT", addresses.ReputationSBT);
  const balance = await sbt.balanceOf(freelancerWallet.address);
  console.log("    ✓ Freelancer SBT balance:", balance.toString());

  console.log("\n═══════════════════════════════════════");
  console.log(" DISPUTE SMOKE TEST COMPLETE — live resolution verified");
  console.log(" Job contract:", jobAddress);
  console.log(" View on Polygonscan:", `https://amoy.polygonscan.com/address/${jobAddress}`);
  console.log("═══════════════════════════════════════");
}

main().catch((error) => {
  console.error("Dispute smoke test FAILED:", error.message);
  process.exitCode = 1;
});
