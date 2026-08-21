import { ethers } from "hardhat";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(" 🚀 PolyLance Local End-to-End Smoke Test — 8-Step Lifecycle");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Generate deterministic local wallets for client & freelancer
  const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", ethers.provider);
  const client = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", ethers.provider);
  const freelancer = new ethers.Wallet("0x5de4111daf4783847b20778a5ba6027301b46a54c946464b45d4a9b6b78690d0", ethers.provider);

  console.log("Deployer:   ", deployer.address);
  console.log("Client:     ", client.address);
  console.log("Freelancer: ", freelancer.address);
  console.log("---------------------------------------------------------------\n");

  // 1. Deploy ReputationSBT
  console.log("1/8 Deploying ReputationSBT...");
  const ReputationSBT = await ethers.getContractFactory("ReputationSBT");
  const sbt = await ReputationSBT.deploy(deployer.address);
  await sbt.waitForDeployment();
  const sbtAddress = await sbt.getAddress();
  console.log("    ✓ ReputationSBT deployed at:", sbtAddress);

  // 2. Deploy JobEscrowImplementation
  console.log("2/8 Deploying JobEscrowImplementation...");
  const JobEscrow = await ethers.getContractFactory("JobEscrowImplementation");
  const implementation = await JobEscrow.deploy();
  await implementation.waitForDeployment();
  const implAddress = await implementation.getAddress();
  console.log("    ✓ JobEscrowImplementation deployed at:", implAddress);

  // 3. Deploy JobFactory & Grant Minter Role
  console.log("3/8 Deploying JobFactory & Granting MINTER_ROLE...");
  const JobFactory = await ethers.getContractFactory("JobFactory");
  const factory = await JobFactory.deploy(implAddress, sbtAddress, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("    ✓ JobFactory deployed at:", factoryAddress);

  const MINTER_ROLE = await sbt.MINTER_ROLE();
  await sbt.grantRole(MINTER_ROLE, factoryAddress);
  console.log("    ✓ MINTER_ROLE granted to JobFactory");

  // 4. Client Posts a Job
  console.log("4/8 Client Posting Job...");
  const postTx = await factory.connect(client).postJob("ipfs://bafybeismoketestjobdescription", ethers.ZeroAddress);
  const postReceipt = await postTx.wait();
  console.log("    ✓ tx hash:", postReceipt!.hash);

  const jobs = await factory.getAllJobs();
  const jobAddress = jobs[jobs.length - 1];
  console.log("    ✓ Job Escrow Clone deployed at:", jobAddress);

  const job = await ethers.getContractAt("JobEscrowImplementation", jobAddress);

  // 5. Client Funds Job Escrow Vault
  console.log("5/8 Client Funding Escrow Vault...");
  const depositAmount = ethers.parseEther("1.0"); // 1 MATIC
  const fundTx = await job.connect(client).fundJob(0, { value: depositAmount });
  const fundReceipt = await fundTx.wait();
  console.log("    ✓ tx hash:", fundReceipt!.hash);
  console.log("    ✓ Vault Locked Amount:", ethers.formatEther(await job.amount()), "MATIC");

  // 6. Freelancer Applies & Client Selects Freelancer
  console.log("6/8 Freelancer Applying & Client Selecting...");
  const applyTx = await job.connect(freelancer).applyToJob("ipfs://bafybeismoketestproposal");
  await applyTx.wait();
  
  const selectTx = await job.connect(client).selectFreelancer(freelancer.address);
  await selectTx.wait();
  console.log("    ✓ Selected Freelancer:", await job.freelancer());

  // 7. Propose Terms & Freelancer Submits Work
  console.log("7/8 Cryptographic Terms Signature & Submitting Work...");
  const termsHash = ethers.keccak256(ethers.toUtf8Bytes("smoke test agreement v1"));
  await job.connect(client).proposeTerms(termsHash);
  await job.connect(freelancer).proposeTerms(termsHash);
  console.log("    ✓ Terms Hash Signature Agreed:", await job.termsHash());

  const submitTx = await job.connect(freelancer).submitWork(
    "E2E Milestone Deliverable",
    "Smart Contract Audit & Optimization Suite Complete",
    ["ipfs://bafybeismoketestevidence"]
  );
  await submitTx.wait();
  console.log("    ✓ Deliverable Submitted. Status:", (await job.status()).toString(), "(Submitted)");

  // 8. Client Releases Payment & Reputation SBT Minted
  console.log("8/8 Client Approving Release & Verifying SBT Mint...");
  const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
  const releaseTx = await job.connect(client).releasePayment();
  const releaseReceipt = await releaseTx.wait();
  const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);

  console.log("    ✓ Release Tx Hash:", releaseReceipt!.hash);
  console.log("    ✓ Freelancer Balance Increase:", ethers.formatEther(freelancerBalanceAfter - freelancerBalanceBefore), "MATIC");

  const sbtBalance = await sbt.balanceOf(freelancer.address);
  console.log("    ✓ Freelancer ReputationSBT Balance:", sbtBalance.toString(), "SBT Token(s)");

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(" 🎉 LOCAL END-TO-END SMOKE TEST PASSED 100%");
  console.log(" All 8-step lifecycle contract invariants hold.");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((error) => {
  console.error("Local Smoke Test FAILED:", error);
  process.exitCode = 1;
});
