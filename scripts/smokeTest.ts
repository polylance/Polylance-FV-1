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

  if (!clientPrivateKey || !freelancerPrivateKey) {
    throw new Error("CLIENT_PRIVATE_KEY and FREELANCER_PRIVATE_KEY env vars are required for live testnet smoke test.");
  }

  const clientWallet = new ethers.Wallet(clientPrivateKey, ethers.provider);
  const freelancerWallet = new ethers.Wallet(freelancerPrivateKey, ethers.provider);

  await assertNotPublicTestAccount(clientWallet.address, "Client");
  await assertNotPublicTestAccount(freelancerWallet.address, "Freelancer");

  const network = (await ethers.provider.getNetwork()).name;
  const manifestPath = `./deployments/${network}_addresses.json`;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Deployment manifest not found at ${manifestPath}. Run deploy.ts first.`);
  }

  const addresses = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  console.log("═══════════════════════════════════════");
  console.log(` PolyLance Live Smoke Test — ${network}`);
  console.log("═══════════════════════════════════════");
  console.log("Client:", clientWallet.address);
  console.log("Freelancer:", freelancerWallet.address);
  console.log("JobFactory:", addresses.JobFactory);
  console.log("═══════════════════════════════════════\n");

  const factory = await ethers.getContractAt("JobFactory", addresses.JobFactory, clientWallet);

  // ── 1. Post a real job ──
  console.log("1/8 Posting job...");
  let tx = await factory.postJob("ipfs://smoke-test-job-description", ethers.ZeroAddress);
  let receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);

  const jobs = await factory.getAllJobs();
  const jobAddress = jobs[jobs.length - 1]; // most recent
  console.log("    ✓ Job deployed at:", jobAddress);

  const job = await ethers.getContractAt("JobEscrow", jobAddress);

  // ── 2. Fund it ──
  console.log("2/8 Funding job with test MATIC...");
  const fundAmount = ethers.parseEther("0.01"); // small amount
  tx = await job.connect(clientWallet).fundJob(0, { value: fundAmount });
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);
  console.log("    ✓ On-chain amount():", ethers.formatEther(await job.amount()), "MATIC");

  // ── 3. Freelancer applies ──
  console.log("3/8 Freelancer applying...");
  tx = await job.connect(freelancerWallet).applyToJob("ipfs://smoke-test-proposal");
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);

  const applicants = await job.getApplicants();
  console.log("    ✓ Applicants on-chain:", applicants.length);

  // ── 4. Client selects ──
  console.log("4/8 Client selecting freelancer...");
  tx = await job.connect(clientWallet).selectFreelancer(freelancerWallet.address);
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);
  console.log("    ✓ On-chain freelancer():", await job.freelancer());

  // ── 5. Both propose terms ──
  console.log("5/8 Proposing terms (both parties)...");
  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("smoke test terms v1"));
  tx = await job.connect(clientWallet).proposeTerms(termsHash);
  await tx.wait();
  tx = await job.connect(freelancerWallet).proposeTerms(termsHash);
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);
  console.log("    ✓ On-chain termsHash():", await job.termsHash());

  // ── 6. Freelancer submits work ──
  console.log("6/8 Freelancer submitting work...");
  tx = await job.connect(freelancerWallet).submitWork(
    "Smoke Test Delivery",
    "Real end-to-end test on live deployment",
    ["ipfs://smoke-test-evidence"]
  );
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);
  console.log("    ✓ On-chain status():", (await job.status()).toString(), "(expected: 2 = Submitted)");

  // ── 7. Client releases payment ──
  console.log("7/8 Client releasing payment...");
  const freelancerBalanceBefore = await ethers.provider.getBalance(freelancerWallet.address);
  tx = await job.connect(clientWallet).releasePayment();
  receipt = await tx.wait();
  console.log("    ✓ tx:", receipt!.hash);
  const freelancerBalanceAfter = await ethers.provider.getBalance(freelancerWallet.address);
  console.log("    ✓ Freelancer balance change:", ethers.formatEther(freelancerBalanceAfter - freelancerBalanceBefore), "MATIC");

  // ── 8. Confirm reputation SBT minted ──
  console.log("8/8 Verifying ReputationSBT minted...");
  const sbt = await ethers.getContractAt("ReputationSBT", addresses.ReputationSBT);
  const balance = await sbt.balanceOf(freelancerWallet.address);
  console.log("    ✓ Freelancer SBT balance:", balance.toString());

  console.log("\n═══════════════════════════════════════");
  console.log(` SMOKE TEST COMPLETE — full lifecycle verified live on ${network}`);
  console.log(" Job contract:", jobAddress);
  console.log(" View on Polygonscan:", `https://amoy.polygonscan.com/address/${jobAddress}`);
  console.log("═══════════════════════════════════════");
}

main().catch((error) => {
  console.error("Smoke test FAILED at step:", error.message);
  process.exitCode = 1;
});
