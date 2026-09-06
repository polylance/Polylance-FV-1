import { expect } from "chai";
import { ethers } from "hardhat";

describe("JobEscrow USDC Payment Tests (6 Decimals)", function () {
  let factory: any;
  let sbt: any;
  let mockUSDC: any;
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

    mockUSDC = await ethers.deployContract("MockUSDT"); // Standard mock ERC20 with 6 decimals
    await mockUSDC.waitForDeployment();

    await factory.setApprovedPaymentToken(await mockUSDC.getAddress(), true);
    await mockUSDC.faucet(client.address, 10_000 * 10 ** 6);
  });

  it("funds, completes, and pays out correctly in real testnet USDC token shape (6 decimals)", async function () {
    const usdcAddress = await mockUSDC.getAddress();
    await factory.connect(client).postJob("ipfs://usdc-job", usdcAddress);
    const jobs = await factory.getAllJobs();
    const jobAddress = jobs[jobs.length - 1];
    const job = await ethers.getContractAt("JobEscrow", jobAddress);

    expect(await job.paymentToken()).to.equal(usdcAddress);

    const fundAmount = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)
    await mockUSDC.connect(client).approve(jobAddress, fundAmount);
    await job.connect(client).fundJob(fundAmount);

    expect(await job.amount()).to.equal(fundAmount);
    expect(await mockUSDC.balanceOf(jobAddress)).to.equal(fundAmount);

    await job.connect(freelancer).applyToJob("ipfs://proposal");
    await job.connect(client).selectFreelancer(freelancer.address);

    const termsHash = ethers.keccak256(ethers.toUtf8Bytes("terms"));
    await job.connect(client).proposeTerms(termsHash);
    await job.connect(freelancer).proposeTerms(termsHash);
    await job.connect(freelancer).submitWork("Title", "Desc", ["ipfs://evidence"]);

    const freelancerBefore = await mockUSDC.balanceOf(freelancer.address);
    await job.connect(client).releasePayment();
    const freelancerAfter = await mockUSDC.balanceOf(freelancer.address);

    const expectedFee = (fundAmount * 250n) / 10000n; // 2.5% fee = 2.5 USDC
    const expectedPayout = fundAmount - expectedFee;

    expect(freelancerAfter - freelancerBefore).to.equal(expectedPayout);
  });

  it("rejects funding with a non-approved token", async function () {
    const randomUnapprovedAddress = ethers.Wallet.createRandom().address;
    await expect(
      factory.connect(client).postJob("ipfs://unapproved", randomUnapprovedAddress)
    ).to.be.revertedWith("Payment token not approved");
  });
});
