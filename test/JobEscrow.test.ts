import { expect } from "chai";
import { ethers, network } from "hardhat";
import { JobEscrow, JobFactory, ReputationSBT, MaliciousReentrancyAttacker } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("JobEscrow — Full Lifecycle & Security Invariants", function () {
  let factory: JobFactory;
  let sbt: ReputationSBT;
  let jobImpl: JobEscrow;
  let client: HardhatEthersSigner;
  let freelancer: HardhatEthersSigner;
  let otherFreelancer: HardhatEthersSigner;
  let judge1: HardhatEthersSigner;
  let judge2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const REVIEW_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    client = signers[1];
    freelancer = signers[2];
    otherFreelancer = signers[3];
    judge1 = signers[4];
    judge2 = signers[5];
    attacker = signers[6];

    jobImpl = await ethers.deployContract("JobEscrow");
    await jobImpl.waitForDeployment();

    sbt = await ethers.deployContract("ReputationSBT", [deployer.address]);
    await sbt.waitForDeployment();

    factory = await ethers.deployContract("JobFactory", [
      await jobImpl.getAddress(),
      await sbt.getAddress(),
    ]);
    await factory.waitForDeployment();

    const MINTER_ROLE = await sbt.MINTER_ROLE();
    await sbt.grantRole(MINTER_ROLE, await factory.getAddress());

    const ARBITRATOR_ROLE = await factory.ARBITRATOR_ROLE();
    await factory.grantRole(ARBITRATOR_ROLE, judge1.address);
    await factory.grantRole(ARBITRATOR_ROLE, judge2.address);
  });

  async function deployJob(): Promise<JobEscrow> {
    const tx = await factory.connect(client).postJob("ipfs://job-description", ethers.ZeroAddress);
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((l) => {
        try { return factory.interface.parseLog(l as any); } catch { return null; }
      })
      .find((e) => e?.name === "JobDeployed");

    const jobAddress = event!.args.jobContract;
    return ethers.getContractAt("JobEscrow", jobAddress) as Promise<JobEscrow>;
  }

  describe("Happy path: post → fund → apply → select → submit → release", function () {
    it("completes the full flow with correct final balances", async function () {
      const job = await deployJob();
      const fundAmount = ethers.parseEther("1.0");

      await job.connect(client).fundJob(0, { value: fundAmount });
      expect(await job.amount()).to.equal(fundAmount);
      expect(await job.status()).to.equal(0); // Open

      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(otherFreelancer).applyToJob("ipfs://proposal2");

      const applicants = await job.getApplicants();
      expect(applicants.length).to.equal(2);

      await job.connect(client).selectFreelancer(freelancer.address);
      expect(await job.freelancer()).to.equal(freelancer.address);
      expect(await job.status()).to.equal(1); // Selected

      const termsHash = ethers.keccak256(ethers.toUtf8Bytes("agreed terms v1"));
      await job.connect(client).proposeTerms(termsHash);
      await job.connect(freelancer).proposeTerms(termsHash);
      expect(await job.termsHash()).to.equal(termsHash);

      await job.connect(freelancer).submitWork("Final delivery", "Implemented per spec", ["ipfs://evidence1"]);
      expect(await job.status()).to.equal(2); // Submitted

      const balanceBefore = await ethers.provider.getBalance(freelancer.address);
      const tx = await job.connect(client).releasePayment();
      await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(freelancer.address);

      const expectedFee = (fundAmount * 250n) / 10000n; // 2.5%
      const expectedPayout = fundAmount - expectedFee;
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);

      expect(await sbt.balanceOf(freelancer.address)).to.equal(1n);
      expect(await job.status()).to.equal(4); // Completed
    });
  });

  describe("Application rules", function () {
    it("prevents duplicate applications", async function () {
      const job = await deployJob();
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await expect(
        job.connect(freelancer).applyToJob("ipfs://proposal-again")
      ).to.be.revertedWith("Already applied");
    });

    it("prevents the client from applying to their own job", async function () {
      const job = await deployJob();
      await expect(
        job.connect(client).applyToJob("ipfs://proposal")
      ).to.be.revertedWith("Client cannot apply to own job");
    });

    it("only the client can select a freelancer", async function () {
      const job = await deployJob();
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await expect(
        job.connect(attacker).selectFreelancer(freelancer.address)
      ).to.be.revertedWith("Only client selects");
    });

    it("cannot select someone who didn't apply", async function () {
      const job = await deployJob();
      await expect(
        job.connect(client).selectFreelancer(freelancer.address)
      ).to.be.revertedWith("Did not apply");
    });
  });

  describe("Auto-release after review period", function () {
    let job: JobEscrow;

    beforeEach(async function () {
      job = await deployJob();
      await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(freelancer).submitWork("Delivery", "Done", ["ipfs://evidence"]);
    });

    it("blocks auto-release before the review period ends", async function () {
      await expect(job.connect(freelancer).claimAutoRelease()).to.be.revertedWith("Review period still active");
    });

    it("allows anyone to trigger auto-release after the review period", async function () {
      await timeIncrease(REVIEW_PERIOD + 1);

      await expect(job.connect(attacker).claimAutoRelease()).to.not.be.reverted;
      expect(await job.status()).to.equal(4); // Completed
    });

    it("client releasing before the window closes prevents later auto-release attempts", async function () {
      await job.connect(client).releasePayment();
      await timeIncrease(REVIEW_PERIOD + 1);

      await expect(job.connect(attacker).claimAutoRelease()).to.be.revertedWith("Not awaiting review");
    });
  });

  describe("Cancellation tiers", function () {
    it("client can cancel freely while Open (no funds locked yet)", async function () {
      const job = await deployJob();
      await expect(job.connect(client).cancelJob()).to.not.be.reverted;
      expect(await job.status()).to.equal(5); // Cancelled
    });

    it("client cancel refunds locked funds if already funded pre-selection", async function () {
      const job = await deployJob();
      await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });

      const balanceBefore = await ethers.provider.getBalance(client.address);
      const tx = await job.connect(client).cancelJob();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(client.address);

      expect(balanceAfter + gasCost - balanceBefore).to.equal(ethers.parseEther("1.0"));
    });

    it("cannot unilaterally cancel once Selected", async function () {
      const job = await deployJob();
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);

      await expect(job.connect(client).cancelJob()).to.be.revertedWith("Too late to cancel unilaterally");
    });

    it("requires BOTH parties to consent to mutual cancel", async function () {
      const job = await deployJob();
      await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);

      await job.connect(client).proposeMutualCancel();
      expect(await job.status()).to.equal(1); // Still Selected

      await job.connect(freelancer).proposeMutualCancel();
      expect(await job.status()).to.equal(5); // Cancelled
    });

    it("freelancer can decline a selection before terms are finalized", async function () {
      const job = await deployJob();
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);

      await job.connect(freelancer).declineSelection();
      expect(await job.status()).to.equal(0); // Open
      expect(await job.freelancer()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Disputes", function () {
    let job: JobEscrow;

    beforeEach(async function () {
      job = await deployJob();
      await job.connect(client).fundJob(0, { value: ethers.parseEther("1.0") });
      await job.connect(freelancer).applyToJob("ipfs://proposal");
      await job.connect(client).selectFreelancer(freelancer.address);
      await job.connect(freelancer).submitWork("Delivery", "Done", ["ipfs://evidence"]);
    });

    it("either party can raise a dispute", async function () {
      await expect(job.connect(client).raiseDispute(0, "ipfs://client-evidence")).to.not.be.reverted;
      expect(await job.status()).to.equal(3); // Disputed
    });

    it("freelancer can submit dispute response", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://client-evidence");
      await expect(job.connect(freelancer).submitDisputeResponse("ipfs://freelancer-response"))
        .to.emit(job, "DisputeResponseSubmitted")
        .withArgs(freelancer.address, "ipfs://freelancer-response");
    });

    it("a non-party cannot raise a dispute", async function () {
      await expect(job.connect(attacker).raiseDispute(0, "ipfs://fake")).to.be.revertedWith("Not a party to this job");
    });

    it("only ARBITRATOR_ROLE can resolve", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://evidence");
      await expect(job.connect(attacker).resolveDispute(5000, "ipfs://reasoning")).to.be.revertedWith("Not an arbitrator");
    });

    it("resolves with correct split — full to freelancer", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://evidence");
      const balanceBefore = await ethers.provider.getBalance(freelancer.address);
      await job.connect(judge1).resolveDispute(10000, "ipfs://reasoning");
      const balanceAfter = await ethers.provider.getBalance(freelancer.address);

      const fee = (ethers.parseEther("1.0") * 250n) / 10000n;
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1.0") - fee);
    });

    it("resolves with correct split — 50/50", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://evidence");
      const clientBefore = await ethers.provider.getBalance(client.address);
      const freelancerBefore = await ethers.provider.getBalance(freelancer.address);

      await job.connect(judge1).resolveDispute(5000, "ipfs://reasoning");

      const freelancerAfter = await ethers.provider.getBalance(freelancer.address);
      const fee = (ethers.parseEther("1.0") * 250n) / 10000n;
      const distributable = ethers.parseEther("1.0") - fee;
      expect(freelancerAfter - freelancerBefore).to.equal(distributable / 2n);
    });

    it("cannot resolve an already-resolved dispute", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://evidence");
      await job.connect(judge1).resolveDispute(5000, "ipfs://reasoning");
      await expect(job.connect(judge2).resolveDispute(5000, "ipfs://reasoning-2")).to.be.revertedWith("No active dispute");
    });

    it("no reputation SBT minted when freelancer gets 0%", async function () {
      await job.connect(client).raiseDispute(0, "ipfs://evidence");
      await job.connect(judge1).resolveDispute(0, "ipfs://reasoning");
      expect(await sbt.balanceOf(freelancer.address)).to.equal(0n);
    });
  });

  describe("Fund-flow invariant (Section 5 — no dust lost or created)", function () {
    const testBpsValues = [0, 1, 2500, 4999, 5000, 5001, 9999, 10000];

    testBpsValues.forEach((bps) => {
      it(`fee + toFreelancer + toClient equals original amount at bps=${bps}`, async function () {
        const job = await deployJob();
        const amount = ethers.parseEther("1.23456789");
        await job.connect(client).fundJob(0, { value: amount });
        await job.connect(freelancer).applyToJob("ipfs://proposal");
        await job.connect(client).selectFreelancer(freelancer.address);
        await job.connect(freelancer).submitWork("Delivery", "Done", ["ipfs://evidence"]);
        await job.connect(client).raiseDispute(0, "ipfs://evidence");

        const clientBefore = await ethers.provider.getBalance(client.address);
        const freelancerBefore = await ethers.provider.getBalance(freelancer.address);
        const treasuryBefore = await factory.treasuryBalance();

        await job.connect(judge1).resolveDispute(bps, "ipfs://reasoning");

        const clientAfter = await ethers.provider.getBalance(client.address);
        const freelancerAfter = await ethers.provider.getBalance(freelancer.address);
        const treasuryAfter = await factory.treasuryBalance();

        const totalOut = (clientAfter - clientBefore) + (freelancerAfter - freelancerBefore) + (treasuryAfter - treasuryBefore);
        expect(totalOut).to.equal(amount);
      });
    });
  });


});

async function timeIncrease(seconds: number) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}
