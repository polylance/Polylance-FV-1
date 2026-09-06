import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20 Payment Support (USDT/USDC)", function () {
  let factory: any;
  let sbt: any;
  let mockUSDT: any;
  let admin: any;
  let client: any;
  let freelancer: any;
  let arbitrator: any;
  let treasuryAdmin: any;

  beforeEach(async function () {
    [admin, client, freelancer, arbitrator, treasuryAdmin] = await ethers.getSigners();

    const jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [admin.address]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, arbitrator.address);

    const TREASURY_ADMIN_ROLE = await factory.TREASURY_ADMIN_ROLE();
    await factory.grantRole(TREASURY_ADMIN_ROLE, treasuryAdmin.address);

    mockUSDT = await ethers.deployContract("MockUSDT");
    await mockUSDT.waitForDeployment();

    // Approve MockUSDT on factory for client job posting
    await factory.setApprovedPaymentToken(await mockUSDT.getAddress(), true);

    // Fund client with 10,000 USDT (6 decimals)
    await mockUSDT.faucet(client.address, 10_000 * 10 ** 6);
  });

  it("should reject job creation with an unapproved payment token", async function () {
    const randomToken = ethers.Wallet.createRandom().address;
    await expect(
      factory.connect(client).postJob("ipfs://unapproved-job", randomToken)
    ).to.be.revertedWith("Payment token not approved");
  });

  it("should complete full job lifecycle using 6-decimal MockUSDT", async function () {
    const usdtAddress = await mockUSDT.getAddress();
    
    // 1. Post job with USDT
    await factory.connect(client).postJob("ipfs://usdt-job", usdtAddress);
    const jobs = await factory.getAllJobs();
    const jobAddress = jobs[jobs.length - 1];
    const job = await ethers.getContractAt("JobEscrow", jobAddress);

    expect(await job.paymentToken()).to.equal(usdtAddress);

    // 2. Client approves and funds 1,000 USDT
    const fundAmount = 1_000 * 10 ** 6; // 1,000 USDT with 6 decimals
    await mockUSDT.connect(client).approve(jobAddress, fundAmount);

    // Reject passing native value to token job
    await expect(
      job.connect(client).fundJob(fundAmount, { value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Do not send MATIC for token jobs");

    // Rejects tokenAmount = 0
    await expect(
      job.connect(client).fundJob(0)
    ).to.be.revertedWith("Must specify token amount");

    await job.connect(client).fundJob(fundAmount);
    expect(await job.amount()).to.equal(fundAmount);
    expect(await mockUSDT.balanceOf(jobAddress)).to.equal(fundAmount);

    // 3. Apply & Select
    await job.connect(freelancer).applyToJob("ipfs://proposal");
    await job.connect(client).selectFreelancer(freelancer.address);

    // 4. Propose terms
    const termsHash = ethers.keccak256(ethers.toUtf8Bytes("terms v1"));
    await job.connect(client).proposeTerms(termsHash);
    await job.connect(freelancer).proposeTerms(termsHash);

    // 5. Submit work
    await job.connect(freelancer).submitWork("Title", "Desc", ["ipfs://evidence"]);

    // 6. Release payment
    const freelancerBalBefore = await mockUSDT.balanceOf(freelancer.address);
    const factoryBalBefore = await mockUSDT.balanceOf(await factory.getAddress());

    await job.connect(client).releasePayment();

    const freelancerBalAfter = await mockUSDT.balanceOf(freelancer.address);
    const factoryBalAfter = await mockUSDT.balanceOf(await factory.getAddress());

    // 2.5% fee = 25 USDT, 97.5% to freelancer = 975 USDT
    const expectedFee = (fundAmount * 250) / 10000; // 25,000,000 (25 USDT)
    const expectedFreelancerPayout = fundAmount - expectedFee; // 975,000,000 (975 USDT)

    expect(freelancerBalAfter - freelancerBalBefore).to.equal(expectedFreelancerPayout);
    expect(factoryBalAfter - factoryBalBefore).to.equal(expectedFee);

    // Verify SBT minted
    expect(await sbt.balanceOf(freelancer.address)).to.equal(1);
  });

  it("should enforce fund-flow invariant for ERC20 payments across all bps split values", async function () {
    const usdtAddress = await mockUSDT.getAddress();
    const bpsValues = [0, 1, 2500, 4999, 5000, 5001, 9999, 10000];

    for (const bps of bpsValues) {
      await factory.connect(client).postJob(`ipfs://job-bps-${bps}`, usdtAddress);
      const jobs = await factory.getAllJobs();
      const jobAddress = jobs[jobs.length - 1];
      const job = await ethers.getContractAt("JobEscrow", jobAddress);

      const jobAmount = 500 * 10 ** 6; // 500 USDT
      await mockUSDT.connect(client).approve(jobAddress, jobAmount);
      await job.connect(client).fundJob(jobAmount);

      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);

      const termsHash = ethers.keccak256(ethers.toUtf8Bytes(`terms-${bps}`));
      await job.connect(client).proposeTerms(termsHash);
      await job.connect(freelancer).proposeTerms(termsHash);
      await job.connect(freelancer).submitWork("Title", "Desc", ["ipfs://evidence"]);
      await job.connect(client).raiseDispute(0, "ipfs://dispute");

      const clientBefore = await mockUSDT.balanceOf(client.address);
      const freelancerBefore = await mockUSDT.balanceOf(freelancer.address);
      const factoryBefore = await mockUSDT.balanceOf(await factory.getAddress());

      await job.connect(arbitrator).resolveDispute(bps, "ipfs://reasoning");

      const clientAfter = await mockUSDT.balanceOf(client.address);
      const freelancerAfter = await mockUSDT.balanceOf(freelancer.address);
      const factoryAfter = await mockUSDT.balanceOf(await factory.getAddress());

      const feeCollected = factoryAfter - factoryBefore;
      const toFreelancer = freelancerAfter - freelancerBefore;
      const toClient = clientAfter - clientBefore;

      expect(feeCollected + toFreelancer + toClient).to.equal(jobAmount);
    }
  });

  it("should allow TREASURY_ADMIN_ROLE to withdraw collected ERC20 fees", async function () {
    const usdtAddress = await mockUSDT.getAddress();
    
    // Complete a job to collect fee
    await factory.connect(client).postJob("ipfs://treasury-job", usdtAddress);
    const jobs = await factory.getAllJobs();
    const jobAddress = jobs[jobs.length - 1];
    const job = await ethers.getContractAt("JobEscrow", jobAddress);

    const fundAmount = 2_000 * 10 ** 6; // 2,000 USDT
    await mockUSDT.connect(client).approve(jobAddress, fundAmount);
    await job.connect(client).fundJob(fundAmount);

    await job.connect(freelancer).applyToJob("ipfs://proposal");
    await job.connect(client).selectFreelancer(freelancer.address);
    const termsHash = ethers.keccak256(ethers.toUtf8Bytes("terms"));
    await job.connect(client).proposeTerms(termsHash);
    await job.connect(freelancer).proposeTerms(termsHash);
    await job.connect(freelancer).submitWork("Title", "Desc", ["ipfs://evidence"]);
    await job.connect(client).releasePayment();

    const expectedFee = (fundAmount * 250) / 10000; // 50 USDT (50,000,000)
    expect(await factory.treasuryBalanceByToken(usdtAddress)).to.equal(expectedFee);

    // Non-admin withdraw fails
    await expect(
      factory.connect(client).withdrawTreasury(usdtAddress, client.address, expectedFee)
    ).to.be.reverted;

    // Admin withdraws ERC20 fee
    const recipient = ethers.Wallet.createRandom().address;
    await factory.connect(treasuryAdmin).withdrawTreasury(usdtAddress, recipient, expectedFee);

    expect(await mockUSDT.balanceOf(recipient)).to.equal(expectedFee);
    expect(await factory.treasuryBalanceByToken(usdtAddress)).to.equal(0);
  });
});
