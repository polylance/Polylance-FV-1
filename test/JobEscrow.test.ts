import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { JobEscrow, JobFactory, ReputationSBT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JobEscrow", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let arbitrator: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const JOB_DESCRIPTION = "QmJobDescriptionHash";
  const PROPOSAL_HASH = "QmProposalHash";
  const REVIEW_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  const JOB_AMOUNT = ethers.parseEther("1.0");

  async function deployContracts() {
    [client, freelancer, arbitrator, other] = await ethers.getSigners();

    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    // Deploy SBT with a temporary address — we'll fix minter role after factory deploy
    sbt = await ethers.deployContract("ReputationSBT", [ethers.ZeroAddress]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    // Grant MINTER_ROLE to factory
    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    // Grant ARBITRATOR_ROLE to arbitrator
    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, arbitrator.address);
  }

  async function deployAndGetJob(): Promise<JobEscrow> {
    const tx = await factory.connect(client).postJob(JOB_DESCRIPTION);
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((log) => {
        try { return factory.interface.parseLog(log as any); } catch { return null; }
      })
      .find((e) => e?.name === "JobDeployed");

    const jobAddress = event!.args.jobContract;
    return ethers.getContractAt("JobEscrow", jobAddress) as Promise<JobEscrow>;
  }

  beforeEach(deployContracts);

  // ── Happy Path ──────────────────────────────────────────────────────────────

  describe("Happy path: post → apply → select → terms → fund → submit → release → SBT minted", function () {
    it("should complete the full happy path and mint an SBT", async function () {
      const job = await deployAndGetJob();

      // Apply
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      expect(await job.hasApplied(freelancer.address)).to.be.true;

      // Select
      await job.connect(client).selectFreelancer(freelancer.address);
      expect(await job.status()).to.equal(1); // Selected

      // Fund
      await job.connect(client).fundJob({ value: JOB_AMOUNT });
      expect(await job.amount()).to.equal(JOB_AMOUNT);

      // Terms — both parties sign
      const termsHash = ethers.id("terms-v1");
      await job.connect(client).proposeTerms(termsHash);
      await job.connect(freelancer).proposeTerms(termsHash);
      expect(await job.termsHash()).to.equal(termsHash);

      // Submit work
      await job.connect(freelancer).submitWork("MVP v1", "All tasks done", ["QmEvidence1"]);
      expect(await job.status()).to.equal(2); // Submitted

      // Release payment — track balances
      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
      const clientBefore = await ethers.provider.getBalance(client.address);

      const releaseTx = await job.connect(client).releasePayment();
      const releaseReceipt = await releaseTx.wait();
      const gasUsed = releaseReceipt!.gasUsed * releaseReceipt!.gasPrice;

      expect(await job.status()).to.equal(4); // Completed

      // 2.5% platform fee → treasury
      const expectedFee = (JOB_AMOUNT * 250n) / 10000n;
      const expectedToFreelancer = JOB_AMOUNT - expectedFee;

      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerAfter - freelancerBefore).to.equal(expectedToFreelancer);

      const treasuryBalance = await factory.treasuryBalance();
      expect(treasuryBalance).to.equal(expectedFee);

      // SBT minted
      expect(await sbt.balanceOf(freelancer.address)).to.equal(1n);
    });
  });

  // ── Auto Release ────────────────────────────────────────────────────────────

  describe("Auto-release after review period", function () {
    it("should allow claimAutoRelease after reviewPeriod elapses", async function () {
      const job = await deployAndGetJob();

      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: JOB_AMOUNT });
      await job.connect(freelancer).submitWork("Work", "Done", ["QmEv"]);

      // Should revert before review period
      await expect(job.connect(other).claimAutoRelease()).to.be.revertedWith(
        "Review period still active"
      );

      // Advance time past reviewPeriod
      await time.increase(REVIEW_PERIOD + 1);

      await expect(job.connect(other).claimAutoRelease())
        .to.emit(job, "AutoReleased")
        .and.to.emit(job, "PaymentReleased");

      expect(await job.status()).to.equal(4); // Completed
    });
  });

  // ── Mutual Cancel ───────────────────────────────────────────────────────────

  describe("Mutual cancel", function () {
    it("should not cancel until both parties consent", async function () {
      const job = await deployAndGetJob();

      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: JOB_AMOUNT });

      // Only client consents — should NOT cancel yet
      await expect(job.connect(client).proposeMutualCancel())
        .to.emit(job, "CancelConsentGiven")
        .withArgs(client.address);
      expect(await job.status()).to.equal(1); // Still Selected

      // Freelancer consents — triggers cancellation
      const clientBefore = await ethers.provider.getBalance(client.address);
      await expect(job.connect(freelancer).proposeMutualCancel())
        .to.emit(job, "JobCancelled");

      expect(await job.status()).to.equal(5); // Cancelled
      const clientAfter = await ethers.provider.getBalance(client.address);
      expect(clientAfter).to.be.gt(clientBefore); // Refunded
    });

    it("unilateral cancel by client should work when Open", async function () {
      const job = await deployAndGetJob();
      await job.connect(client).fundJob({ value: JOB_AMOUNT });

      await expect(job.connect(client).cancelJob())
        .to.emit(job, "JobCancelled")
        .withArgs(JOB_AMOUNT);

      expect(await job.status()).to.equal(5); // Cancelled
    });

    it("unilateral cancel should revert after freelancer selected", async function () {
      const job = await deployAndGetJob();
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);

      await expect(job.connect(client).cancelJob()).to.be.revertedWith(
        "Too late to cancel unilaterally"
      );
    });
  });

  // ── Disputes ────────────────────────────────────────────────────────────────

  describe("Disputes", function () {
    async function setupDispute() {
      const job = await deployAndGetJob();

      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(client).fundJob({ value: JOB_AMOUNT });
      await job.connect(freelancer).submitWork("Work", "Done", ["QmEv"]);

      // Client raises dispute
      await job.connect(client).raiseDispute(0, "QmClientEvidence"); // reason: QUALITY
      expect(await job.status()).to.equal(3); // Disputed

      return job;
    }

    it("raise → respond → only ARBITRATOR_ROLE can resolve with correct bps split", async function () {
      const job = await setupDispute();

      // Freelancer submits response
      await expect(job.connect(freelancer).submitDisputeResponse("QmFreelancerResponse"))
        .to.emit(job, "DisputeResponseSubmitted")
        .withArgs(freelancer.address, "QmFreelancerResponse");

      // Non-arbitrator cannot resolve
      await expect(
        job.connect(other).resolveDispute(5000, "QmReasoning")
      ).to.be.revertedWith("Not an arbitrator");

      // Arbitrator resolves: 60% freelancer, 40% client
      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
      const clientBefore = await ethers.provider.getBalance(client.address);

      await expect(
        job.connect(arbitrator).resolveDispute(6000, "QmReasoning")
      )
        .to.emit(job, "DisputeResolved")
        .withArgs(6000n, arbitrator.address, "QmReasoning");

      expect(await job.status()).to.equal(4); // Completed

      const fee = (JOB_AMOUNT * 250n) / 10000n;
      const distributable = JOB_AMOUNT - fee;
      const expectedFreelancer = (distributable * 6000n) / 10000n;
      const expectedClient = distributable - expectedFreelancer;

      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);
      const clientAfter = await ethers.provider.getBalance(client.address);

      expect(freelancerAfter - freelancerBefore).to.equal(expectedFreelancer);
      expect(clientAfter - clientBefore).to.be.closeTo(expectedClient, ethers.parseEther("0.001"));
    });

    it("should not allow resolving an already-resolved dispute", async function () {
      const job = await setupDispute();
      await job.connect(arbitrator).resolveDispute(10000, "QmReason");

      await expect(
        job.connect(arbitrator).resolveDispute(5000, "QmReason2")
      ).to.be.revertedWith("No active dispute"); // status is Completed
    });
  });

  // ── Replay Guards ───────────────────────────────────────────────────────────

  describe("Replay guards", function () {
    it("cannot apply twice", async function () {
      const job = await deployAndGetJob();
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);

      await expect(
        job.connect(freelancer).applyToJob("QmAnotherProposal")
      ).to.be.revertedWith("Already applied");
    });

    it("client cannot apply to own job", async function () {
      const job = await deployAndGetJob();
      await expect(
        job.connect(client).applyToJob(PROPOSAL_HASH)
      ).to.be.revertedWith("Client cannot apply to own job");
    });

    it("declined freelancer resets selection to Open", async function () {
      const job = await deployAndGetJob();
      await job.connect(freelancer).applyToJob(PROPOSAL_HASH);
      await job.connect(client).selectFreelancer(freelancer.address);

      await job.connect(freelancer).declineSelection();
      expect(await job.status()).to.equal(0); // Open
      expect(await job.freelancer()).to.equal(ethers.ZeroAddress);
    });
  });
});
